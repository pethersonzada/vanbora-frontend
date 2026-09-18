import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { CardTurmaPassageiro } from '../components/CardTurmaPassageiro';
import ConfirmadosAvatares from '../components/motorista/ConfirmadosAvatares';
import { SeletorPresenca } from '../components/passageiro/SeletorPresenca';
import { API_URL } from '../config/config';
import { colors } from '../constants/colors';
import { homePassageiroStyles as styles } from '../constants/homePassageiroStyles';
import { useAuth } from './context/AuthContext';

export default function HomePassageiro() {
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const vanMapRef = useRef<WebView>(null);
    
    const [loading, setLoading] = useState(true);
    
    const [temEndereco, setTemEndereco] = useState(true);
    const [statusConfirmado, setStatusConfirmado] = useState('');
    const [minhaLocalizacao, setMinhaLocalizacao] = useState<{ latitude: number; longitude: number } | null>(null);
    const [statusViagem, setStatusViagem] = useState('INATIVA');
    const [statusGps, setStatusGps] = useState('GARAGEM');
    const [turma, setTurma] = useState(null);
    const [enderecos, setEnderecos] = useState<{ id: number; apelido: string; rua: string; numero: string; bairro: string; }[]>([]);
    
    const [passageirosConfirmados, setPassageirosConfirmados] = useState<{ nome: string; iniciais: string }[]>([]);

    // Carrega os dados apenas uma vez quando o componente monta
    useEffect(() => {
        if (user?.id) {
            carregarDados();
        }
    }, [user?.id]);

    // Radar simplificado rodando a cada 15 segundos sem disparar loops no banco
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
                        if (pos?.latitude && pos?.longitude && vanMapRef.current) {
                            vanMapRef.current.injectJavaScript(`if(typeof updateDriverLocation==='function')updateDriverLocation(${pos.latitude},${pos.longitude});true;`);
                        }
                    } else if (resLoc.status === 404) { 
                        setStatusGps('AGUARDANDO'); 
                    }
                } else { 
                    setStatusGps('GARAGEM'); 
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
        
        // Atualiza a tela na hora sem precisar recarregar tudo do zero via backend
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

    const mapHtml = useMemo(() => {
        if (!minhaLocalizacao) return '';
        return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>body,html{height:100%;margin:0;padding:0}#map{height:100vh;width:100vw;position:absolute}.van-icon{font-size:24px;text-align:center}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,dragging:true}).setView([${minhaLocalizacao.latitude},${minhaLocalizacao.longitude}],15);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);var vMarker=null;function updateDriverLocation(lat,lng){if(!vMarker){vMarker=L.marker([lat,lng],{icon:L.divIcon({html:'🚐',className:'van-icon',iconSize:[30,30]})}).addTo(map);}else{vMarker.setLatLng([lat,lng]);map.panTo([lat,lng]);}}</script></body></html>`;
    }, [minhaLocalizacao]);

    if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1, backgroundColor: colors.background }} />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' })}</Text>
                <Text style={styles.welcome}>Olá, {user?.nome ? user.nome.split(' ')[0] : ''}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {!temEndereco && (
                    <TouchableOpacity style={styles.bannerAlerta} onPress={() => router.push('/cadastro-endereco')}>
                        <Ionicons name="location" size={24} color={colors.danger} />
                        <View style={{flex: 1, marginLeft: 10}}>
                            <Text style={styles.alertaTitulo}>Local faltando</Text>
                            <Text style={styles.alertaTexto}>Defina seu endereço no Perfil.</Text>
                        </View>
                    </TouchableOpacity>
                )}

                <CardTurmaPassageiro turma={turma} />

                {turma ? (
                    <>
                        <View style={styles.topoPassageiro}>
                            <Text style={styles.sectionTitle}>Radar da Van</Text>
                            <View style={styles.badge}><Text style={styles.badgeTexto}>{statusGps}</Text></View>
                        </View>

                        <View style={styles.radarCard}>
                            {statusViagem === 'INATIVA' ? (
                                <View style={styles.cadeadoBox}>
                                    <Ionicons name="bus-outline" size={40} color={colors.textMuted} />
                                    <Text style={styles.cadeadoTitulo}>A van está na garagem</Text>
                                </View>
                            ) : minhaLocalizacao ? (
                                <WebView ref={vanMapRef} source={{ html: mapHtml }} javaScriptEnabled={true} scrollEnabled={false} overScrollMode="never" bounces={false} />
                            ) : (
                                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
                            )}
                        </View>

                        <View style={{ marginBottom: 15, backgroundColor: colors.backgroundAlt, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 10 }}>Colegas na Rota Hoje</Text>
                            <ConfirmadosAvatares passageiros={passageirosConfirmados} />
                        </View>

                        <SeletorPresenca statusConfirmado={statusConfirmado} enderecos={enderecos} onRegistrar={registrarPresenca} />
                    </>
                ) : (
                    <View style={{ 
                        marginTop: 20, 
                        backgroundColor: colors.backgroundAlt, 
                        padding: 25, 
                        borderRadius: 16, 
                        borderWidth: 1, 
                        borderColor: colors.border,
                        alignItems: 'center' 
                    }}>
                        <Ionicons name="time-outline" size={50} color={colors.primary} style={{ marginBottom: 15 }} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textMain, textAlign: 'center', marginBottom: 8 }}>
                            Aguardando Vinculação
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                            Você ainda não faz parte de nenhuma turma ou sua solicitação enviada está aguardando aprovação do motorista.
                        </Text>
                        <TouchableOpacity 
                            style={{ 
                                backgroundColor: colors.primary, 
                                paddingVertical: 14, 
                                paddingHorizontal: 20, 
                                borderRadius: 12, 
                                width: '100%', 
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center'
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