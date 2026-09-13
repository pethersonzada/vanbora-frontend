import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/config';
import { mapaStyles as styles } from '../constants/mapaStyles';
import { useAuth } from './context/AuthContext';

MapboxGL.setAccessToken('pk.eyJ1IjoicGV0aGVyc29uemFkYSIsImEiOiJjbW8xam0yaXMwanYyMnJxNGU4anZsMTUxIn0._IPEdVhWPvth0afOP2ELLw');

type PassageiroRota = { 
    id: number; 
    nome: string; 
    latitude: number; 
    longitude: number; 
};

type LatLng = { latitude: number; longitude: number };
type Sentido = 'ida' | 'volta';

const CACHE_KEYS = {
    garagem: '@rota_estudantil:garagem',
    rota: (sentido: string) => `@rota_estudantil:rota:${sentido}`,
    geometria: (sentido: string) => `@rota_estudantil:geometria:${sentido}`,
    filaLocalizacoes: '@rota_estudantil:fila_localizacoes',
};

async function salvarCache<T>(chave: string, valor: T) {
    try { await AsyncStorage.setItem(chave, JSON.stringify(valor)); } catch { }
}

async function lerCache<T>(chave: string): Promise<T | null> {
    try {
        const raw = await AsyncStorage.getItem(chave);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
}

async function fetchComTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try { return await fetch(url, { ...options, signal: controller.signal }); }
    finally { clearTimeout(timeoutId); }
}

const HEADERS_PADRAO = { 'Bypass-Tunnel-Reminder': 'true' };

export default function Mapa() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { sentido } = useLocalSearchParams<{ sentido: string }>();
    const { user } = useAuth();
    const cameraRef = useRef<MapboxGL.Camera>(null);

    const [direcaoAtual, setDirecaoAtual] = useState<Sentido>((sentido as Sentido) || 'ida');
    const [localizacao, setLocalizacao] = useState<LatLng | null>(null);
    const [rota, setRota] = useState<PassageiroRota[]>([]);
    const [garagem, setGaragem] = useState<LatLng | null>(null);
    const [geometriaRota, setGeometriaRota] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viagemAtiva, setViagemAtiva] = useState(false);
    const [instrucaoAtual, setInstrucaoAtual] = useState('Aguardando início da rota...');
    const [online, setOnline] = useState(true);
    const [usandoDadosOffline, setUsandoDadosOffline] = useState(false);
    const [velocidadeAtual, setVelocidadeAtual] = useState(0);

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
        if (!res.ok) throw new Error('Falha');
    }

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;

        const iniciarSistema = async () => {
            let direcaoDefinitiva: Sentido = (sentido as Sentido) || 'ida';

            try {
                const resStatus = await fetchComTimeout(`${API_URL}/rota/status-atual`, { headers: HEADERS_PADRAO }, 6000);
                if (resStatus.ok) {
                    const dataStatus = await resStatus.json();
                    if (dataStatus.status === 'ATIVA') {
                        setViagemAtiva(true);
                        if (dataStatus.sentido) direcaoDefinitiva = dataStatus.sentido.toLowerCase();
                    }
                }
            } catch { }

            await carregarGaragemERota(direcaoDefinitiva);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Ative o acesso à localização para usar o painel de navegação.');
                setLoading(false);
                return;
            }

            locationSubscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 1 },
                (loc) => {
                    const ponto: LatLng = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                    setLocalizacao(ponto);
                    setVelocidadeAtual(loc.coords.speed ? Number((loc.coords.speed * 3.6).toFixed(0)) : 0);
                    enviarLocalizacao(ponto).catch(() => enfileirarLocalizacao(ponto));
                }
            );
        };

        iniciarSistema();
        return () => { if (locationSubscription) locationSubscription.remove(); };
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
        } catch (e: any) {
            console.log('DEBUG FRONT ERRO:', e.message);
            garagemCarregada = await lerCache<LatLng>(CACHE_KEYS.garagem);
            rotaCarregada = await lerCache<PassageiroRota[]>(CACHE_KEYS.rota(direcaoUsada));
        }

        if (!garagemCarregada || !rotaCarregada || rotaCarregada.length === 0) {
            Alert.alert('Aviso', 'Nenhum passageiro confirmado para esta rota ou erro de conexão.');
            setLoading(false);
            return;
        }

        setGaragem(garagemCarregada);
        setRota(rotaCarregada);
        setDirecaoAtual(direcaoUsada);
        setUsandoDadosOffline(false);

        await carregarGeometriaRota(direcaoUsada, garagemCarregada, rotaCarregada);
        setLoading(false);
    }

    async function carregarGeometriaRota(direcaoUsada: Sentido, garagemPonto: LatLng, passageiros: PassageiroRota[]) {
        const uniCaruaru: LatLng = { latitude: -8.302755, longitude: -35.991248 };
        const pontosOrdenados: LatLng[] = direcaoUsada === 'ida'
            ? [garagemPonto, ...passageiros, uniCaruaru]
            : [uniCaruaru, ...[...passageiros].reverse(), garagemPonto];

        const waypoints = pontosOrdenados.map((p) => `${p.longitude},${p.latitude}`).join(';');

        try {
            const res = await fetchComTimeout(`https://router.project-osrm.org/route/v1/driving/${waypoints}?geometries=geojson&overview=full&steps=true`);
            const data = await res.json();

            if (data.routes?.length > 0) {
                const routeGeoJSON = { type: 'Feature', properties: {}, geometry: data.routes[0].geometry };
                setGeometriaRota(routeGeoJSON);
                await salvarCache(CACHE_KEYS.geometria(direcaoUsada), routeGeoJSON);

                const primeiroPasso = data.routes[0].legs?.[0]?.steps?.[0];
                if (primeiroPasso?.maneuver?.instruction) setInstrucaoAtual(primeiroPasso.maneuver.instruction);
            }
        } catch {
            const geometriaCache = await lerCache<any>(CACHE_KEYS.geometria(direcaoUsada));
            if (geometriaCache) {
                setGeometriaRota(geometriaCache);
                setInstrucaoAtual('Navegação em Modo Offline');
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
            if (res.ok) setViagemAtiva(true);
        } catch { }
    }

    async function handleEncerrarViagem() {
        if (!online) return Alert.alert('Conexão Necessária', 'Conecte-se à internet para sincronizar o encerramento.');
        try {
            const res = await fetchComTimeout(`${API_URL}/rota/encerrar`, { method: 'POST', headers: HEADERS_PADRAO });
            if (res.ok) {
                setViagemAtiva(false);
                router.replace('/(tabs)/home');
            }
        } catch { }
    }

    const centralizarNaVan = useCallback(() => {
        if (localizacao && cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: [localizacao.longitude, localizacao.latitude],
                zoomLevel: 18,
                animationDuration: 800,
                pitch: 70
            });
        }
    }, [localizacao]);

    if (loading || !garagem) {
        return (
            <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFC107" />
                <Text style={{ color: '#888', marginTop: 12, fontSize: 13, fontWeight: '600' }}>Carregando telemetria...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <View style={[styles.headerOverlay, { top: insets.top + 8, zIndex: 20 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={[styles.badgeSentido, { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' }]}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: online ? '#4CAF50' : '#FF5722', marginRight: 6 }} />
                    <Text style={[styles.textoBadge, { color: '#FFF', letterSpacing: 0.5 }]}>ROTA {direcaoAtual.toUpperCase()}</Text>
                </View>
            </View>

            <View style={{ 
                position: 'absolute', top: insets.top + 70, left: 16, right: 16, zIndex: 10, 
                backgroundColor: '#1E1E1E', padding: 16, borderRadius: 16, 
                borderWidth: 1, borderColor: '#333', flexDirection: 'row', alignItems: 'center', 
                shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10 
            }}>
                <View style={{ backgroundColor: '#FFC107', padding: 12, borderRadius: 12, marginRight: 14 }}>
                    <Ionicons name="navigate-outline" size={24} color="#121212" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#888', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Instrução de Rota</Text>
                    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700', marginTop: 2, lineHeight: 20 }} numberOfLines={2}>{instrucaoAtual}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <Text style={{ color: '#FFC107', fontSize: 18, fontWeight: '900' }}>{velocidadeAtual}</Text>
                    <Text style={{ color: '#777', fontSize: 9, fontWeight: '700' }}>KM/H</Text>
                </View>
            </View>

            <MapboxGL.MapView
                style={{ flex: 1 }}
                styleURL={MapboxGL.StyleURL.Dark}
                logoEnabled={false}
                attributionEnabled={false}
                compassEnabled={false}
            >
                <MapboxGL.Camera
                    ref={cameraRef}
                    zoomLevel={18}
                    pitch={70}
                    followUserLocation={true}
                    followUserMode={MapboxGL.UserTrackingModes.FollowWithCourse}
                    followZoomLevel={18}
                    followPitch={70}
                />

                <MapboxGL.UserLocation
                    visible={true}
                    showsUserHeadingIndicator={true}
                    androidRenderMode={'gps'}
                />

                {geometriaRota && (
                    <MapboxGL.ShapeSource id="routeSource" shape={geometriaRota}>
                        <MapboxGL.LineLayer
                            id="routeLine"
                            style={{ lineColor: '#FFC107', lineWidth: 7, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.9 }}
                        />
                    </MapboxGL.ShapeSource>
                )}

                <MapboxGL.PointAnnotation id="garagem" coordinate={[garagem.longitude, garagem.latitude]}>
                    <View style={{ backgroundColor: '#1E1E1E', padding: 8, borderRadius: 22, borderColor: '#FFC107', borderWidth: 2, shadowColor: '#000', elevation: 5 }}>
                        <Text style={{ fontSize: 14 }}>🏠</Text>
                    </View>
                </MapboxGL.PointAnnotation>

                <MapboxGL.PointAnnotation id="uninassau" coordinate={[-35.991248, -8.302755]}>
                    <View style={{ backgroundColor: '#E53935', padding: 8, borderRadius: 22, borderColor: '#FFF', borderWidth: 2, shadowColor: '#000', elevation: 5 }}>
                        <Text style={{ fontSize: 14 }}>🏁</Text>
                    </View>
                </MapboxGL.PointAnnotation>

                {rota.map((p, index) => (
                    <MapboxGL.PointAnnotation
                        key={String(p.id)}
                        id={`pass-${p.id}`}
                        coordinate={[Number(p.longitude), Number(p.latitude)]}
                    >
                        <View style={{ backgroundColor: '#FFC107', width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#121212', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', elevation: 4 }}>
                            <Text style={{ fontWeight: '900', color: '#121212', fontSize: 12 }}>{index + 1}</Text>
                        </View>
                    </MapboxGL.PointAnnotation>
                ))}
            </MapboxGL.MapView>

            <TouchableOpacity style={[styles.btnCentralizar, { bottom: insets.bottom + 100, zIndex: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' }]} onPress={centralizarNaVan}>
                <Ionicons name="locate" size={22} color="#FFC107" />
            </TouchableOpacity>

            <View style={[styles.footerAcoes, { bottom: insets.bottom + 16, zIndex: 20, paddingHorizontal: 16 }]}>
                {!viagemAtiva ? (
                    <TouchableOpacity style={[styles.btnIniciar, { backgroundColor: '#FFC107', borderRadius: 14, height: 54, shadowColor: '#FFC107', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }]} onPress={handleIniciarViagem}>
                        <Ionicons name="play" size={20} color="#121212" style={{ marginRight: 8 }} />
                        <Text style={[styles.btnText, { color: '#121212', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }]}>INICIAR ROTA DE TRANSPORTE</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.btnEncerrar, { backgroundColor: '#E53935', borderRadius: 14, height: 64, shadowColor: '#E53935', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }]} onPress={handleEncerrarViagem}>
                        <Ionicons name="stop" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={[styles.btnText, { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }]}>ENCERRAR VIAGEM</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}