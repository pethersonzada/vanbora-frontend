import { Ionicons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardTurmaPassageiro } from '../components/cards/CardTurmaPassageiro';
import ConfirmadosAvatares from '../components/motorista/ConfirmadosAvatares';
import { SeletorPresenca } from '../components/passageiro/SeletorPresenca';
import { API_URL } from '../config/config';
import { colors } from '../constants/colors';
import { homePassageiroStyles as styles } from '../constants/homePassageiroStyles';
import { useAuth } from './context/AuthContext';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
MapboxGL.setAccessToken(MAPBOX_TOKEN);

export default function HomePassageiro() {
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const cameraRef = useRef<MapboxGL.Camera>(null);
    
    const [loading, setLoading] = useState(true);
    const [temEndereco, setTemEndereco] = useState(true);
    const [statusConfirmado, setStatusConfirmado] = useState('');
    const [minhaLocalizacao, setMinhaLocalizacao] = useState<{ latitude: number; longitude: number } | null>(null);
    const [posicaoVan, setPosicaoVan] = useState<{ latitude: number; longitude: number } | null>(null);
    const [statusViagem, setStatusViagem] = useState('INATIVA');
    const [statusGps, setStatusGps] = useState('GARAGEM');
    const [turma, setTurma] = useState(null);
    const [enderecos, setEnderecos] = useState<{ id: number; apelido: string; rua: string; numero: string; bairro: string; }[]>([]);
    const [passageirosConfirmados, setPassageirosConfirmados] = useState<{ nome: string; iniciais: string }[]>([]);

    useEffect(() => {
        if (user?.id) {
            carregarDados();
        }
    }, [user?.id]);

    useEffect(() => {
        let intervalo: ReturnType<typeof setInterval> | null = null;

        const verificarRadar = async () => {
            try {
                const res = await fetch(`${API_URL}/rota/status-atual`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });
                if (!res.ok) return;
                const data = await res.json();
                setStatusViagem(data.status);

                if (data.status === 'ATIVA') {
                    const resLoc = await fetch(`${API_URL}/rota/localizacao-van`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });
                    if (resLoc.ok) {
                        setStatusGps('ONLINE');
                        const pos = await resLoc.json();
                        if (pos?.latitude && pos?.longitude) {
                            const novaPos = { latitude: Number(pos.latitude), longitude: Number(pos.longitude) };
                            setPosicaoVan(novaPos);
                            if (cameraRef.current) {
                                cameraRef.current.setCamera({
                                    centerCoordinate: [novaPos.longitude, novaPos.latitude],
                                    zoomLevel: 16,
                                    animationDuration: 1000,
                                });
                            }
                        }
                    } else if (resLoc.status === 404) { 
                        setStatusGps('AGUARDANDO'); 
                    }
                } else { 
                    setStatusGps('GARAGEM'); 
                    setPosicaoVan(null);
                }
            } catch (e) { 
                setStatusGps('ERRO'); 
            }
        };

        verificarRadar();
        intervalo = setInterval(verificarRadar, 15000);

        return () => {
            if (intervalo) clearInterval(intervalo);
        };
    }, []);

    async function carregarDados() {
        try {
            if (user?.id) {
                const [resStatus, resTurma, resEnderecos] = await Promise.all([
                    fetch(`${API_URL}/usuarios/passageiros`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } }),
                    fetch(`${API_URL}/turmas/usuario/${user.id}`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } }),
                    fetch(`${API_URL}/enderecos/usuario/${user.id}`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } })
                ]);
                
                if (resEnderecos.ok) {
                    const listaEnderecos = await resEnderecos.json();
                    setEnderecos(listaEnderecos);
                    setTemEndereco(listaEnderecos.length > 0);
                }

                if (resStatus.ok) {
                    const list = await resStatus.json();
                    const meuRegistro = list.find((p: any) => String(p.id || p.usuarioId || p.passageiroId) === String(user.id));
                    setStatusConfirmado(meuRegistro?.status || meuRegistro?.presenca || '');

                    const confirmados = list
                        .filter((p: any) => {
                            const st = (p.status || p.presenca || '').toUpperCase();
                            return st === 'IDA' || st === 'VOLTA' || st === 'AMBOS' || st === 'CONFIRMADO';
                        })
                        .map((p: any) => {
                            const nomeCompleto = p.nome || p.usuarioNome || 'Passageiro';
                            const partes = nomeCompleto.trim().split(' ');
                            const iniciais = partes.length > 1 
                                ? `${partes[0][0]}${partes[partes.length - 1][0]}` 
                                : partes[0].substring(0, 2);
                            
                            return {
                                nome: nomeCompleto,
                                iniciais: iniciais.toUpperCase()
                            };
                        });

                    setPassageirosConfirmados(confirmados);
                }
                
                if (resTurma.ok) {
                    const dadosTurma = await resTurma.json();
                    setTurma(dadosTurma);
                } else {
                    setTurma(null);
                }

                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    setMinhaLocalizacao({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                }
            }
        } catch (e) { 
            setTurma(null);
        } finally {
            setLoading(false);
        }
    }

    async function registrarPresenca(status: string, enderecoId?: number) {
        if (!user?.id) return;
        const statusEnvio = status === 'LIMPAR' ? 'LIMPAR' : status;
        setStatusConfirmado(status === 'LIMPAR' ? '' : statusEnvio);
        
        try {
            let url = `${API_URL}/rota/confirmar?usuarioId=${Number(user.id)}&status=${statusEnvio}`;
            if (enderecoId) {
                url += `&enderecoId=${enderecoId}`;
            }

            await fetch(url, { 
                method: 'POST', 
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
        } catch (e) { 
            Alert.alert("Erro", "Falha de conexão ao registrar presença."); 
        }
    }

    const minhaPosicaoNaFila = useMemo(() => {
        if (!user?.nome) return null;
        const index = passageirosConfirmados.findIndex(p => p.nome.toLowerCase() === user.nome.toLowerCase());
        return index !== -1 ? index + 1 : null;
    }, [passageirosConfirmados, user?.nome]);

    if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1, backgroundColor: colors.background }} />;

    const centroMapa = posicaoVan || minhaLocalizacao;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
                <View>
                    <Text style={styles.dateText}>{new Date().toLocaleDateString('pt-BR', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</Text>
                    <Text style={styles.welcome}>Olá, {user?.nome ? user.nome.split(' ')[0] : ''}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {!temEndereco && (
                    <TouchableOpacity style={styles.bannerAlerta} onPress={() => router.push('/cadastro-endereco')}>
                        <View style={{ backgroundColor: 'rgba(244, 67, 54, 0.15)', padding: 10, borderRadius: 12 }}>
                            <Ionicons name="location" size={22} color={colors.danger} />
                        </View>
                        <View style={{flex: 1, marginLeft: 12}}>
                            <Text style={styles.alertaTitulo}>Endereço Pendente</Text>
                            <Text style={styles.alertaTexto}>Toque aqui para definir o seu local de embarque.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                )}

                <CardTurmaPassageiro turma={turma} />

                {turma ? (
                    <>
                        <View style={[styles.topoPassageiro, { alignItems: 'center', marginBottom: 12 }]}>
                            <Text style={styles.sectionTitle}>Radar da Van</Text>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: statusGps === 'ONLINE' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(255, 193, 7, 0.12)',
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: statusGps === 'ONLINE' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 193, 7, 0.3)'
                            }}>
                                <View style={{ 
                                    width: 7, 
                                    height: 7, 
                                    borderRadius: 3.5, 
                                    backgroundColor: statusGps === 'ONLINE' ? '#4CAF50' : '#FFC107', 
                                    marginRight: 6 
                                }} />
                                <Text style={{ 
                                    fontSize: 11, 
                                    fontWeight: '700', 
                                    color: statusGps === 'ONLINE' ? '#4CAF50' : '#FFC107',
                                    letterSpacing: 0.5
                                }}>
                                    {statusGps}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.radarCard, { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }]}>
                            {statusViagem === 'INATIVA' ? (
                                <View style={styles.cadeadoBox}>
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 30, marginBottom: 12 }}>
                                        <Ionicons name="bus-outline" size={36} color={colors.textMuted} />
                                    </View>
                                    <Text style={styles.cadeadoTitulo}>A van está na garagem</Text>
                                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>O radar será ativado quando a viagem começar.</Text>
                                </View>
                            ) : centroMapa ? (
                                <MapboxGL.MapView 
                                    style={{ flex: 1 }} 
                                    styleURL={MapboxGL.StyleURL.Dark} 
                                    logoEnabled={false} 
                                    attributionEnabled={false} 
                                    compassEnabled={false}
                                >
                                    <MapboxGL.Camera
                                        ref={cameraRef}
                                        zoomLevel={16}
                                        centerCoordinate={[centroMapa.longitude, centroMapa.latitude]}
                                    />
                                    {posicaoVan && (
                                        <MapboxGL.PointAnnotation id="van-passageiro" coordinate={[posicaoVan.longitude, posicaoVan.latitude]}>
                                            <View style={{ backgroundColor: '#1E1E1E', width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 8 }}>
                                                <Text style={{ fontSize: 18 }}>🚐</Text>
                                            </View>
                                        </MapboxGL.PointAnnotation>
                                    )}
                                </MapboxGL.MapView>
                            ) : (
                                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
                            )}
                        </View>

                        <View style={{ backgroundColor: colors.backgroundAlt, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ backgroundColor: 'rgba(255, 193, 7, 0.12)', padding: 8, borderRadius: 10, marginRight: 10 }}>
                                        <Ionicons name="analytics" size={18} color={colors.primary} />
                                    </View>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textMain, letterSpacing: 0.3 }}>Status da Viagem</Text>
                                </View>
                                <View style={{ backgroundColor: statusViagem === 'ATIVA' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: statusViagem === 'ATIVA' ? '#4CAF50' : colors.textMuted }}>
                                        {statusViagem === 'ATIVA' ? 'EM CURSO' : 'AGUARDANDO'}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', marginBottom: 12 }}>
                                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500', marginBottom: 4 }}>Sua Posição na Fila</Text>
                                <Text style={{ fontSize: 17, fontWeight: 'bold', color: colors.primary }}>
                                    {minhaPosicaoNaFila ? `${minhaPosicaoNaFila}º na ordem de embarque` : 'Não confirmado na rota de hoje'}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 193, 7, 0.06)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.15)' }}>
                                <Ionicons name={statusViagem === 'ATIVA' ? "navigate-circle" : "time"} size={20} color={colors.primary} style={{ marginRight: 10 }} />
                                <Text style={{ fontSize: 13, color: colors.textMain, flex: 1, lineHeight: 18, fontWeight: '500' }}>
                                    {statusViagem === 'ATIVA' 
                                        ? 'A van está na estrada recolhendo os passageiros. Fique pronto no local!' 
                                        : 'Confirme sua presença abaixo para entrar na escala da rota de hoje.'}
                                </Text>
                            </View>
                        </View>

                        <View style={{ marginBottom: 16, backgroundColor: colors.backgroundAlt, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textMain, marginBottom: 12 }}>Colegas Confirmados</Text>
                            <ConfirmadosAvatares passageiros={passageirosConfirmados} />
                        </View>

                        <SeletorPresenca statusConfirmado={statusConfirmado} enderecos={enderecos} onRegistrar={registrarPresenca} />
                    </>
                ) : (
                    <View style={{ 
                        marginTop: 20, 
                        backgroundColor: colors.backgroundAlt, 
                        padding: 28, 
                        borderRadius: 22, 
                        borderWidth: 1, 
                        borderColor: 'rgba(255,255,255,0.06)',
                        alignItems: 'center' 
                    }}>
                        <View style={{ backgroundColor: 'rgba(255, 193, 7, 0.12)', padding: 18, borderRadius: 30, marginBottom: 16 }}>
                            <Ionicons name="ticket-outline" size={32} color={colors.primary} />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textMain, textAlign: 'center', marginBottom: 8 }}>
                            Aguardando Vinculação
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
                            Você ainda não faz parte de nenhuma turma ou o motorista ainda não aprovou o seu acesso.
                        </Text>
                        <TouchableOpacity 
                            style={{ 
                                backgroundColor: colors.primary, 
                                paddingVertical: 14, 
                                paddingHorizontal: 20, 
                                borderRadius: 14, 
                                width: '100%', 
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 6
                            }} 
                            onPress={() => router.push('/entrar-turma')}
                        >
                            <Ionicons name="key-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Inserir Código de Convite</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}