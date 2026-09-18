import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/config';
import { mapaStyles as styles } from '../constants/mapaStyles';
import { useAuth } from './context/AuthContext';

import { CabecalhoMapa } from '../components/mapa/CabecalhoMapa';
import { ControlesViagem } from '../components/mapa/ControlesViagem';
import { PainelManobra } from '../components/mapa/PainelManobra';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
MapboxGL.setAccessToken(MAPBOX_TOKEN);

type PassageiroRota = {
    id: number;
    nome: string;
    rua?: string;
    numero?: string;
    bairro?: string;
    latitude: number;
    longitude: number;
    embarcado?: boolean;
};

type LatLng = { latitude: number; longitude: number };
type Sentido = 'ida' | 'volta';
type Manobra = { instrucao: string; tipo: string; coordenada: [number, number]; indiceRota: number };
type Projecao = { ponto: LatLng; distancia: number; bearing: number; indice: number };

const CACHE_KEYS = {
    garagem: '@rota_estudantil:garagem',
    rota: (sentido: string) => `@rota_estudantil:rota:${sentido}`,
    geometria: (sentido: string) => `@rota_estudantil:geometria:${sentido}`,
    filaLocalizacoes: '@rota_estudantil:fila_localizacoes',
};

const UNI_CARUARU: LatLng = { latitude: -8.302755, longitude: -35.991248 };
const RAIO_EMBARQUE_METROS = 45;
const RAIO_DESVIO_ROTA_METROS = 80;
const DURACAO_ANIMACAO_MS = 1900;
const JANELA_BUSCA_PROJECAO = 40;
const LIMITE_WAYPOINTS_MAPBOX = 25;
const LIMIAR_TEMPO_FORA_ROTA_MS = 6000;
const COOLDOWN_RECALCULO_MS = 20000;

async function salvarCache<T>(chave: string, valor: T) {
    try { await AsyncStorage.setItem(chave, JSON.stringify(valor)); } catch { }
}

async function lerCache<T>(chave: string): Promise<T | null> {
    try {
        const raw = await AsyncStorage.getItem(chave);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
}

const HEADERS_PADRAO = { 'Bypass-Tunnel-Reminder': 'true' };

function distanciaMetros(a: LatLng, b: LatLng): number {
    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (b.latitude - a.latitude) * rad;
    const dLng = (b.longitude - a.longitude) * rad;
    const lat1 = a.latitude * rad;
    const lat2 = b.latitude * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function projetarNoSegmento(p: LatLng, a: LatLng, b: LatLng): { ponto: LatLng; distancia: number; t: number; bearing: number } {
    const metrosPorGrauLat = 111320;
    const metrosPorGrauLng = 111320 * Math.cos((a.latitude * Math.PI) / 180);
    const toXY = (pt: LatLng) => ({
        x: (pt.longitude - a.longitude) * metrosPorGrauLng,
        y: (pt.latitude - a.latitude) * metrosPorGrauLat,
    });
    const P = toXY(p);
    const B = toXY(b);
    const ABx = B.x;
    const ABy = B.y;
    const comprimentoQuad = ABx * ABx + ABy * ABy;
    let t = comprimentoQuad === 0 ? 0 : (P.x * ABx + P.y * ABy) / comprimentoQuad;
    t = Math.max(0, Math.min(1, t));
    const projX = ABx * t;
    const projY = ABy * t;
    const latitude = a.latitude + projY / metrosPorGrauLat;
    const longitude = a.longitude + projX / metrosPorGrauLng;
    const ponto = { latitude, longitude };
    const distancia = distanciaMetros(p, ponto);
    const bearing = (Math.atan2(ABx, ABy) * 180 / Math.PI + 360) % 360;
    return { ponto, distancia, t, bearing };
}

function encontrarProjecaoNaRota(coordenadas: [number, number][], ponto: LatLng, indiceAnterior: number | null): Projecao | null {
    if (coordenadas.length < 2) return null;
    const avaliarFaixa = (inicio: number, fim: number) => {
        let melhor: Projecao | null = null;
        for (let i = inicio; i <= fim; i++) {
            const a = { longitude: coordenadas[i][0], latitude: coordenadas[i][1] };
            const b = { longitude: coordenadas[i + 1][0], latitude: coordenadas[i + 1][1] };
            const proj = projetarNoSegmento(ponto, a, b);
            if (!melhor || proj.distancia < melhor.distancia) {
                melhor = { ponto: proj.ponto, distancia: proj.distancia, bearing: proj.bearing, indice: i };
            }
        }
        return melhor;
    };
    let melhor: Projecao | null;
    if (indiceAnterior !== null) {
        const inicio = Math.max(0, indiceAnterior - 5);
        const fim = Math.min(coordenadas.length - 2, indiceAnterior + JANELA_BUSCA_PROJECAO);
        melhor = avaliarFaixa(inicio, fim);
    } else {
        melhor = avaliarFaixa(0, coordenadas.length - 2);
    }
    if (!melhor || melhor.distancia > RAIO_DESVIO_ROTA_METROS * 3) {
        const completa = avaliarFaixa(0, coordenadas.length - 2);
        if (completa && (!melhor || completa.distancia < melhor.distancia)) melhor = completa;
    }
    return melhor;
}

function distanciaRestanteDesde(coordenadas: [number, number][], indiceSegmento: number, t: number): number {
    const [lngA, latA] = coordenadas[indiceSegmento];
    const [lngB, latB] = coordenadas[Math.min(indiceSegmento + 1, coordenadas.length - 1)];
    const segmentoTotal = distanciaMetros({ latitude: latA, longitude: lngA }, { latitude: latB, longitude: lngB });
    let total = segmentoTotal * (1 - t);
    for (let i = indiceSegmento + 1; i < coordenadas.length - 1; i++) {
        const [lA, laA] = coordenadas[i];
        const [lB, laB] = coordenadas[i + 1];
        total += distanciaMetros({ latitude: laA, longitude: lA }, { latitude: laB, longitude: lB });
    }
    return total;
}

export default function Mapa() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { sentido } = useLocalSearchParams<{ sentido: string }>();
    const { user } = useAuth();
    const cameraRef = useRef<MapboxGL.Camera>(null);
    
    const [direcaoAtual, setDirecaoAtual] = useState<Sentido>((sentido as Sentido) || 'ida');
    const [localizacao, setLocalizacao] = useState<LatLng | null>(null);
    const [posicaoSuave, setPosicaoSuave] = useState<LatLng | null>(null);
    const [headingAtual, setHeadingAtual] = useState(0);
    const [rota, setRota] = useState<PassageiroRota[]>([]);
    const [garagem, setGaragem] = useState<LatLng | null>(null);
    const [geometriaRota, setGeometriaRota] = useState<any>(null);
    const [coordenadasRota, setCoordenadasRota] = useState<[number, number][]>([]);
    const [manobras, setManobras] = useState<Manobra[]>([]);
    const [manobraAtual, setManobraAtual] = useState<Manobra | null>(null);
    const [loading, setLoading] = useState(true);
    const [viagemAtiva, setViagemAtiva] = useState(false);
    const [online, setOnline] = useState(true);
    const [erroRede, setErroRede] = useState<string | null>(null);
    const [foraDaRota, setForaDaRota] = useState(false);
    const [recalculandoRota, setRecalculandoRota] = useState(false);
    const [velocidadeAtual, setVelocidadeAtual] = useState(0);
    const [horarioAtual, setHorarioAtual] = useState('');
    const [distanciaRestante, setDistanciaRestante] = useState<number | null>(null);
    const [etaMinutos, setEtaMinutos] = useState<number | null>(null);
    
    const montadoRef = useRef(true);
    const coordenadasRotaRef = useRef<[number, number][]>([]);
    const manobrasRef = useRef<Manobra[]>([]);
    const direcaoAtualRef = useRef<Sentido>(direcaoAtual);
    const rotaRef = useRef<PassageiroRota[]>([]);
    const garagemRef = useRef<LatLng | null>(null);
    const ultimoIndiceProjecaoRef = useRef<number | null>(null);
    const headingRef = useRef(0);
    const posicaoApresentadaRef = useRef<LatLng | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const controladoresAtivosRef = useRef<Set<AbortController>>(new Set());
    const primeiroTickForaRotaRef = useRef<number | null>(null);
    const recalculandoRef = useRef(false);
    const ultimaRecalculacaoRef = useRef<number | null>(null);

    useEffect(() => { coordenadasRotaRef.current = coordenadasRota; }, [coordenadasRota]);
    useEffect(() => { manobrasRef.current = manobras; }, [manobras]);
    useEffect(() => { direcaoAtualRef.current = direcaoAtual; }, [direcaoAtual]);
    useEffect(() => { rotaRef.current = rota; }, [rota]);
    useEffect(() => { garagemRef.current = garagem; }, [garagem]);

    async function fetchComTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000) {
        const controller = new AbortController();
        controladoresAtivosRef.current.add(controller);
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
            controladoresAtivosRef.current.delete(controller);
        }
    }

    async function buscarRotaMapbox(pontos: LatLng[]): Promise<{ routeGeoJSON: any; coordenadas: [number, number][]; manobras: Manobra[] }> {
        if (pontos.length > LIMITE_WAYPOINTS_MAPBOX) {
            throw new Error(`Limite de ${LIMITE_WAYPOINTS_MAPBOX} pontos excedido (${pontos.length} fornecidos)`);
        }
        if (!MAPBOX_TOKEN) throw new Error('Token do Mapbox ausente');
        
        const waypoints = pontos.map((p) => `${p.longitude},${p.latitude}`).join(';');
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&overview=full&steps=true&language=pt-BR&access_token=${MAPBOX_TOKEN}`;
        
        const res = await fetchComTimeout(url, {}, 15000);
        const data = await res.json();
        
        if (data.code !== 'Ok' || !data.routes?.length) {
            throw new Error(data.message || 'Directions API não retornou rota válida');
        }
        
        const rotaEscolhida = data.routes[0];
        const routeGeoJSON = { type: 'Feature', properties: {}, geometry: rotaEscolhida.geometry };
        const geometryCoords = rotaEscolhida.geometry.coordinates;
        
        const manobras: Manobra[] = [];
        rotaEscolhida.legs?.forEach((leg: any) => {
            leg.steps?.forEach((s: any) => {
                if (s.maneuver?.instruction) {
                    const loc = s.maneuver.location;
                    let idxRota = geometryCoords.findIndex((c: any) => c[0] === loc[0] && c[1] === loc[1]);
                    
                    if (idxRota === -1) {
                        let minD = Infinity;
                        for (let i = 0; i < geometryCoords.length; i++) {
                            const d = distanciaMetros({longitude: geometryCoords[i][0], latitude: geometryCoords[i][1]}, {longitude: loc[0], latitude: loc[1]});
                            if (d < minD) { minD = d; idxRota = i; }
                        }
                    }

                    manobras.push({
                        instrucao: s.maneuver.instruction,
                        tipo: s.maneuver.type + (s.maneuver.modifier ? `_${s.maneuver.modifier}` : ''),
                        coordenada: loc,
                        indiceRota: idxRota
                    });
                }
            });
        });
        
        manobras.sort((a, b) => a.indiceRota - b.indiceRota);
        return { routeGeoJSON, coordenadas: geometryCoords, manobras };
    }

    useEffect(() => {
        const atualizarRelogio = () => {
            const agora = new Date();
            setHorarioAtual(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        atualizarRelogio();
        const timer = setInterval(atualizarRelogio, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const estaOnline = !!state.isConnected && !!state.isInternetReachable;
            setOnline((prev) => {
                if (!prev && estaOnline) esvaziarFilaLocalizacoes();
                return estaOnline;
            });
        });
        return () => unsubscribe();
    }, []);

    async function enfileirarLocalizacao(ponto: LatLng) {
        const fila = (await lerCache<LatLng[]>(CACHE_KEYS.filaLocalizacoes)) || [];
        fila.push(ponto);
        await salvarCache(CACHE_KEYS.filaLocalizacoes, fila.slice(-50));
    }

    async function esvaziarFilaLocalizacoes() {
        const fila = (await lerCache<LatLng[]>(CACHE_KEYS.filaLocalizacoes)) || [];
        if (fila.length === 0) return;
        const restantes: LatLng[] = [];
        for (const ponto of fila) {
            try { await enviarLocalizacao(ponto); }
            catch { restantes.push(ponto); }
        }
        await salvarCache(CACHE_KEYS.filaLocalizacoes, restantes);
    }

    async function enviarLocalizacao(ponto: LatLng) {
        const res = await fetchComTimeout(
            `${API_URL}/rota/localizacao-van?latitude=${ponto.latitude}&longitude=${ponto.longitude}`,
            { method: 'POST', headers: { Accept: 'application/json', ...HEADERS_PADRAO } },
            5000
        );
        if (!res.ok) throw new Error('Falha ao enviar localização');
    }

    function animarParaNovaPosicao(novaPos: LatLng) {
        const origem = posicaoApresentadaRef.current || novaPos;
        const inicio = Date.now();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const passo = () => {
            if (!montadoRef.current) return;
            const t = Math.min(1, (Date.now() - inicio) / DURACAO_ANIMACAO_MS);
            const lat = origem.latitude + (novaPos.latitude - origem.latitude) * t;
            const lng = origem.longitude + (novaPos.longitude - origem.longitude) * t;
            const atual = { latitude: lat, longitude: lng };
            posicaoApresentadaRef.current = atual;
            setPosicaoSuave(atual);
            if (t < 1) animFrameRef.current = requestAnimationFrame(passo);
        };
        passo();
    }

    async function recalcularRotaAPartirDe(origemAtual: LatLng) {
        if (recalculandoRef.current) return;
        const garagemAtual = garagemRef.current;
        if (!garagemAtual) return;
        
        recalculandoRef.current = true;
        if (montadoRef.current) setRecalculandoRota(true);
        
        try {
            const emOrdemDeVisita = direcaoAtualRef.current === 'ida'
                ? rotaRef.current
                : [...rotaRef.current].reverse();
            const pendentes = emOrdemDeVisita.filter((p) => !p.embarcado);
            const destinoFinal = direcaoAtualRef.current === 'ida' ? UNI_CARUARU : garagemAtual;
            const pontosOrdenados = [origemAtual, ...pendentes, destinoFinal];
            const { routeGeoJSON, coordenadas, manobras: manobrasCalculadas } = await buscarRotaMapbox(pontosOrdenados);
            
            if (!montadoRef.current) return;
            setGeometriaRota(routeGeoJSON);
            setCoordenadasRota(coordenadas);
            coordenadasRotaRef.current = coordenadas;
            ultimoIndiceProjecaoRef.current = null;
            setManobras(manobrasCalculadas);
            manobrasRef.current = manobrasCalculadas;
            if (manobrasCalculadas[0]) setManobraAtual(manobrasCalculadas[0]);
            
            await salvarCache(CACHE_KEYS.geometria(direcaoAtualRef.current), routeGeoJSON);
            primeiroTickForaRotaRef.current = null;
            setForaDaRota(false);
            setErroRede(null);
        } catch {
            if (montadoRef.current) setErroRede('Falha ao recalcular a rota automaticamente.');
        } finally {
            recalculandoRef.current = false;
            if (montadoRef.current) setRecalculandoRota(false);
        }
    }

    useEffect(() => {
        montadoRef.current = true;
        let locationSubscription: Location.LocationSubscription | null = null;
        
        const iniciarSistema = async () => {
            let direcaoDefinitiva: Sentido = (sentido as Sentido) || 'ida';
            try {
                const resStatus = await fetchComTimeout(`${API_URL}/rota/status-atual`, { headers: HEADERS_PADRAO }, 6000);
                if (!montadoRef.current) return;
                if (resStatus.ok) {
                    const dataStatus = await resStatus.json();
                    if (dataStatus.status === 'ATIVA') {
                        setViagemAtiva(true);
                        if (dataStatus.sentido) direcaoDefinitiva = dataStatus.sentido.toLowerCase();
                    }
                }
            } catch { }
            
            await carregarGaragemERota(direcaoDefinitiva);
            if (!montadoRef.current) return;
            
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (!montadoRef.current) return;
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Ative o acesso à localização para usar o painel de navegação.');
                setLoading(false);
                return;
            }
            
            locationSubscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 1 },
                (loc) => {
                    if (!montadoRef.current) return;
                    const pontoBruto: LatLng = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                    const velocidadeKmh = loc.coords.speed && loc.coords.speed > 0 ? Number((loc.coords.speed * 3.6).toFixed(0)) : 0;
                    
                    setLocalizacao(pontoBruto);
                    setVelocidadeAtual(velocidadeKmh);
                    
                    let posicaoFinal = pontoBruto;
                    let projecao: Projecao | null = null;
                    const coords = coordenadasRotaRef.current;
                    
                    if (coords.length > 1) {
                        projecao = encontrarProjecaoNaRota(coords, pontoBruto, ultimoIndiceProjecaoRef.current);
                        if (projecao) {
                            ultimoIndiceProjecaoRef.current = projecao.indice;
                            if (projecao.distancia <= RAIO_DESVIO_ROTA_METROS) {
                                posicaoFinal = projecao.ponto;
                                primeiroTickForaRotaRef.current = null;
                                setForaDaRota(false);
                                const restante = distanciaRestanteDesde(coords, projecao.indice, 0);
                                setDistanciaRestante(restante);
                                const velocidadeParaCalculo = velocidadeKmh > 5 ? velocidadeKmh : 25;
                                setEtaMinutos(Math.max(1, Math.round((restante / 1000) / velocidadeParaCalculo * 60)));
                            } else {
                                if (primeiroTickForaRotaRef.current === null) {
                                    primeiroTickForaRotaRef.current = Date.now();
                                }
                                const tempoForaMs = Date.now() - primeiroTickForaRotaRef.current;
                                if (tempoForaMs >= LIMIAR_TEMPO_FORA_ROTA_MS) {
                                    setForaDaRota(true);
                                    const agora = Date.now();
                                    const podeRecalcular = !recalculandoRef.current &&
                                        (ultimaRecalculacaoRef.current === null || agora - ultimaRecalculacaoRef.current > COOLDOWN_RECALCULO_MS);
                                    if (podeRecalcular) {
                                        ultimaRecalculacaoRef.current = agora;
                                        recalcularRotaAPartirDe(pontoBruto);
                                    }
                                }
                            }
                        }
                    }
                    
                    animarParaNovaPosicao(posicaoFinal);
                    
                    let headingAlvo: number | null = null;
                    if (loc.coords.heading !== null && loc.coords.heading >= 0 && velocidadeKmh > 3) {
                        headingAlvo = loc.coords.heading;
                    } else if (projecao && projecao.distancia <= RAIO_DESVIO_ROTA_METROS) {
                        headingAlvo = projecao.bearing;
                    }
                    
                    if (headingAlvo !== null) {
                        let diff = headingAlvo - headingRef.current;
                        diff = ((diff + 180) % 360 + 360) % 360 - 180;
                        const novoHeading = (headingRef.current + diff * 0.3 + 360) % 360;
                        headingRef.current = novoHeading;
                        setHeadingAtual(novoHeading);
                    }
                    
                    const manobrasAtuais = manobrasRef.current;
                    if (manobrasAtuais.length > 0 && projecao) {
                        const proxima = manobrasAtuais.find(m => m.indiceRota >= projecao!.indice) || manobrasAtuais[manobrasAtuais.length - 1];
                        setManobraAtual(proxima);
                    }
                    
                    setRota((prev) => prev.map((p) => {
                        if (p.embarcado) return p;
                        const dist = distanciaMetros(pontoBruto, { latitude: p.latitude, longitude: p.longitude });
                        return dist < RAIO_EMBARQUE_METROS ? { ...p, embarcado: true } : p;
                    }));
                    
                    enviarLocalizacao(pontoBruto)
                        .then(() => { if (montadoRef.current) setErroRede(null); })
                        .catch(() => {
                            enfileirarLocalizacao(pontoBruto);
                            if (montadoRef.current) setErroRede('Sinal instável. Localização em fila para reenvio.');
                        });
                }
            );
        };
        
        iniciarSistema();
        
        return () => {
            montadoRef.current = false;
            if (locationSubscription) locationSubscription.remove();
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            controladoresAtivosRef.current.forEach((c) => c.abort());
            controladoresAtivosRef.current.clear();
        };
    }, []);

    async function carregarGaragemERota(direcaoUsada: Sentido) {
        let garagemCarregada: LatLng | null = null;
        let rotaCarregada: PassageiroRota[] | null = null;
        
        try {
            await AsyncStorage.removeItem(CACHE_KEYS.rota(direcaoUsada));
            await AsyncStorage.removeItem(CACHE_KEYS.geometria(direcaoUsada));
            
            const resMotorista = await fetchComTimeout(`${API_URL}/usuarios/motorista`, { headers: HEADERS_PADRAO });
            if (!resMotorista.ok) throw new Error('Erro ao buscar motorista');
            const dadosMotorista = await resMotorista.json();
            garagemCarregada = { latitude: Number(dadosMotorista.latitude), longitude: Number(dadosMotorista.longitude) };
            
            const resRota = await fetchComTimeout(`${API_URL}/rota/otimizar?sentido=${direcaoUsada}`, { headers: HEADERS_PADRAO });
            if (!resRota.ok) {
                const erroJson = await resRota.json();
                throw new Error(erroJson.erro || 'Erro ao otimizar rota');
            }
            rotaCarregada = await resRota.json();
            
            await salvarCache(CACHE_KEYS.garagem, garagemCarregada);
            await salvarCache(CACHE_KEYS.rota(direcaoUsada), rotaCarregada);
        } catch {
            garagemCarregada = await lerCache<LatLng>(CACHE_KEYS.garagem);
            rotaCarregada = await lerCache<PassageiroRota[]>(CACHE_KEYS.rota(direcaoUsada));
            if (montadoRef.current) setErroRede('Sem conexão. Usando dados salvos anteriormente.');
        }
        
        if (!montadoRef.current) return;
        
        if (!garagemCarregada || !rotaCarregada || rotaCarregada.length === 0) {
            Alert.alert('Aviso', 'Nenhum passageiro confirmado para esta rota ou erro de conexão.');
            setLoading(false);
            return;
        }
        
        setGaragem(garagemCarregada);
        garagemRef.current = garagemCarregada;
        setRota(rotaCarregada);
        rotaRef.current = rotaCarregada;
        setDirecaoAtual(direcaoUsada);
        direcaoAtualRef.current = direcaoUsada;
        
        await carregarGeometriaRota(direcaoUsada, garagemCarregada, rotaCarregada);
        if (montadoRef.current) setLoading(false);
    }

    async function carregarGeometriaRota(direcaoUsada: Sentido, garagemPonto: LatLng, passageiros: PassageiroRota[]) {
        const pontosOrdenados: LatLng[] = direcaoUsada === 'ida'
            ? [garagemPonto, ...passageiros, UNI_CARUARU]
            : [UNI_CARUARU, ...[...passageiros].reverse(), garagemPonto];
            
        try {
            const { routeGeoJSON, coordenadas, manobras: manobrasCalculadas } = await buscarRotaMapbox(pontosOrdenados);
            if (!montadoRef.current) return;
            setGeometriaRota(routeGeoJSON);
            setCoordenadasRota(coordenadas);
            coordenadasRotaRef.current = coordenadas;
            await salvarCache(CACHE_KEYS.geometria(direcaoUsada), routeGeoJSON);
            setManobras(manobrasCalculadas);
            manobrasRef.current = manobrasCalculadas;
            if (manobrasCalculadas[0]) setManobraAtual(manobrasCalculadas[0]);
        } catch {
            if (pontosOrdenados.length > LIMITE_WAYPOINTS_MAPBOX) {
                Alert.alert(
                    'Rota muito extensa',
                    `Esta rota tem ${pontosOrdenados.length} pontos, acima do limite de ${LIMITE_WAYPOINTS_MAPBOX} da API de direções. Divida a rota ou fale com o suporte técnico.`
                );
            }
            const geometriaCache = await lerCache<any>(CACHE_KEYS.geometria(direcaoUsada));
            if (!montadoRef.current) return;
            if (geometriaCache) {
                setGeometriaRota(geometriaCache);
                setCoordenadasRota(geometriaCache.geometry.coordinates);
                coordenadasRotaRef.current = geometriaCache.geometry.coordinates;
                setManobraAtual({ instrucao: 'Navegação em modo offline (rota salva)', tipo: 'straight', coordenada: [0, 0], indiceRota: 0 });
            } else {
                setErroRede('Não foi possível calcular a rota. Verifique o token do Mapbox e a conexão.');
            }
        }
    }

    async function handleIniciarViagem() {
        if (!user?.id || !online) return Alert.alert('Conexão Necessária', 'Conecte-se à internet para iniciar a transmissão da rota.');
        try {
            const res = await fetchComTimeout(`${API_URL}/rota/iniciar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...HEADERS_PADRAO },
                body: JSON.stringify({ motoristaId: user.id, sentido: direcaoAtual.toUpperCase() }),
            });
            if (res.ok && montadoRef.current) setViagemAtiva(true);
        } catch {
            if (montadoRef.current) setErroRede('Não foi possível iniciar a viagem. Tente novamente.');
        }
    }

    async function handleEncerrarViagem() {
        if (!online) return Alert.alert('Conexão Necessária', 'Conecte-se à internet para sincronizar o encerramento.');
        try {
            const res = await fetchComTimeout(`${API_URL}/rota/encerrar`, { method: 'POST', headers: HEADERS_PADRAO });
            if (res.ok) router.replace('/(tabs)/home');
        } catch {
            if (montadoRef.current) setErroRede('Não foi possível encerrar a viagem. Tente novamente.');
        }
    }

    const centralizarNaVan = useCallback(() => {
        const pos = posicaoSuave || localizacao;
        if (pos && cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: [pos.longitude, pos.latitude],
                zoomLevel: 18,
                animationDuration: 700,
                pitch: 65,
            });
        }
    }, [posicaoSuave, localizacao]);

    const passageirosGeoJSON = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: rota.map((p, index) => ({
            type: 'Feature' as const,
            properties: {
                id: p.id,
                label: p.embarcado ? '✓' : String(index + 1),
                cor: p.embarcado ? '#4CAF50' : '#FFC107',
            },
            geometry: { type: 'Point' as const, coordinates: [Number(p.longitude), Number(p.latitude)] },
        })),
    }), [rota]);

    let geometriaPercorrida: any = null;
    let geometriaRestante: any = geometriaRota;
    
    if (localizacao && coordenadasRota.length > 1 && ultimoIndiceProjecaoRef.current !== null) {
        const idx = ultimoIndiceProjecaoRef.current;
        if (idx > 0) {
            geometriaPercorrida = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordenadasRota.slice(0, idx + 1) } };
        }
        geometriaRestante = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordenadasRota.slice(idx) } };
    }

    if (loading || !garagem) {
        return (
            <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFC107" />
                <Text style={{ color: '#888', marginTop: 12, fontSize: 13, fontWeight: '600' }}>Carregando telemetria...</Text>
            </View>
        );
    }

    const posicaoExibida = posicaoSuave || localizacao;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <CabecalhoMapa 
                onBack={() => router.replace('/(tabs)/home')} 
                online={online} 
                direcaoAtual={direcaoAtual} 
                horarioAtual={horarioAtual} 
            />
            
            <PainelManobra 
                manobraAtual={manobraAtual} 
                velocidadeAtual={velocidadeAtual} 
            />
            
            {recalculandoRota ? (
                <View style={{ position: 'absolute', top: insets.top + 138, left: 16, right: 16, zIndex: 9, backgroundColor: '#0D2B3A', borderColor: '#29B6F6', borderWidth: 1, borderRadius: 10, padding: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#29B6F6" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#29B6F6', fontSize: 11, fontWeight: '700' }}>Recalculando rota...</Text>
                </View>
            ) : foraDaRota ? (
                <View style={{ position: 'absolute', top: insets.top + 138, left: 16, right: 16, zIndex: 9, backgroundColor: '#3A1A00', borderColor: '#FF9800', borderWidth: 1, borderRadius: 10, padding: 8 }}>
                    <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700' }}>Fora da rota planejada. Recalculando automaticamente...</Text>
                </View>
            ) : erroRede ? (
                <View style={{ position: 'absolute', top: insets.top + 138, left: 16, right: 16, zIndex: 9, backgroundColor: '#3A2E00', borderColor: '#FFC107', borderWidth: 1, borderRadius: 10, padding: 8 }}>
                    <Text style={{ color: '#FFC107', fontSize: 11, fontWeight: '700' }}>{erroRede}</Text>
                </View>
            ) : null}
            
            <MapboxGL.MapView style={{ flex: 1 }} styleURL={MapboxGL.StyleURL.Dark} logoEnabled={false} attributionEnabled={false} compassEnabled={false}>
                <MapboxGL.Camera
                    ref={cameraRef}
                    zoomLevel={18}
                    pitch={65}
                    followUserLocation
                    followUserMode={MapboxGL.UserTrackingModes.FollowWithCourse}
                    followZoomLevel={18}
                    followPitch={65}
                />
                
                {geometriaPercorrida && (
                    <MapboxGL.ShapeSource id="rotaPercorridaSource" shape={geometriaPercorrida}>
                        <MapboxGL.LineLayer id="rotaPercorridaLine" style={{ lineColor: '#4A4A4A', lineWidth: 6, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.85 }} />
                    </MapboxGL.ShapeSource>
                )}
                
                {geometriaRestante && (
                    <MapboxGL.ShapeSource id="rotaRestanteSource" shape={geometriaRestante}>
                        <MapboxGL.LineLayer id="rotaCasing" style={{ lineColor: '#8a6d00', lineWidth: 10, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.5 }} />
                        <MapboxGL.LineLayer id="rotaLine" style={{ lineColor: '#FFC107', lineWidth: 6, lineCap: 'round', lineJoin: 'round' }} />
                    </MapboxGL.ShapeSource>
                )}
                
                {posicaoExibida && (
                    <MapboxGL.PointAnnotation id="van-marker" coordinate={[posicaoExibida.longitude, posicaoExibida.latitude]} anchor={{ x: 0.5, y: 0.5 }}>
                        <View style={{ transform: [{ rotate: `${headingAtual}deg` }], justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{
                                backgroundColor: '#000', width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: '#FFC107',
                                justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 8,
                            }}>
                                <Ionicons name="navigate" size={18} color="#FFC107" style={{ transform: [{ rotate: '-45deg' }] }} />
                            </View>
                        </View>
                    </MapboxGL.PointAnnotation>
                )}
                
                <MapboxGL.PointAnnotation id="garagem" coordinate={[garagem.longitude, garagem.latitude]}>
                    <View style={{ backgroundColor: '#1E1E1E', padding: 8, borderRadius: 22, borderColor: '#FFC107', borderWidth: 2 }}>
                        <Text style={{ fontSize: 14 }}>🏠</Text>
                    </View>
                </MapboxGL.PointAnnotation>
                
                <MapboxGL.PointAnnotation id="uninassau" coordinate={[UNI_CARUARU.longitude, UNI_CARUARU.latitude]}>
                    <View style={{ backgroundColor: '#E53935', padding: 8, borderRadius: 22, borderColor: '#FFF', borderWidth: 2 }}>
                        <Text style={{ fontSize: 14 }}>🏁</Text>
                    </View>
                </MapboxGL.PointAnnotation>
                
                <MapboxGL.ShapeSource id="passageirosSource" shape={passageirosGeoJSON}>
                    <MapboxGL.CircleLayer
                        id="passageirosCirculo"
                        style={{
                            circleRadius: 14,
                            circleColor: ['get', 'cor'],
                            circleStrokeWidth: 2,
                            circleStrokeColor: '#121212',
                        }}
                    />
                    <MapboxGL.SymbolLayer
                        id="passageirosLabel"
                        style={{
                            textField: ['get', 'label'],
                            textSize: 12,
                            textColor: '#121212',
                            textAllowOverlap: true,
                            iconAllowOverlap: true,
                            textIgnorePlacement: true,
                        }}
                    />
                </MapboxGL.ShapeSource>
            </MapboxGL.MapView>
            
            <TouchableOpacity style={{ position: 'absolute', right: 16, bottom: insets.bottom + 170, zIndex: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }} onPress={centralizarNaVan}>
                <Ionicons name="locate" size={22} color="#FFC107" />
            </TouchableOpacity>
            
            <ControlesViagem 
                distanciaRestante={distanciaRestante}
                etaMinutos={etaMinutos}
                viagemAtiva={viagemAtiva}
                onIniciarViagem={handleIniciarViagem}
                onEncerrarViagem={handleEncerrarViagem}
            />
        </View>
    );
}