import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { API_URL } from '../config/config';
import { cadastroEnderecoStyles as styles } from '../constants/cadastroEnderecoStyles';
import { colors } from '../constants/colors';

export default function CadastroEndereco() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [loading, setLoading] = useState(true);
    const [initialLocation, setInitialLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [enderecoCompleto, setEnderecoCompleto] = useState('Buscando seu endereço...');
    const currentCoords = useRef<{ latitude: number; longitude: number } | null>(null);

    const [modalVisivel, setModalVisivel] = useState(false);
    const [nomeLocal, setNomeLocal] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Aviso', 'Permissão de GPS negada.');
                    const fallback = { latitude: -8.2336, longitude: -35.7958 };
                    setInitialLocation(fallback);
                    currentCoords.current = fallback;
                    setLoading(false);
                    return;
                }

                let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
                const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                
                setInitialLocation(coords);
                currentCoords.current = coords;

                const [resultado] = await Location.reverseGeocodeAsync(coords);
                if (resultado) {
                    setEnderecoCompleto(`${resultado.street || 'Rua não identificada'}, ${resultado.streetNumber || 'S/N'}`);
                } else {
                    setEnderecoCompleto('Arraste o mapa para ajustar');
                }

            } catch (error) {
                Alert.alert('Erro de GPS', 'Não foi possível encontrar sua localização exata.');
                const fallback = { latitude: -8.2336, longitude: -35.7958 };
                setInitialLocation(fallback);
                currentCoords.current = fallback;
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleMapMessage = async (event: any) => {
        try {
            const { lat, lng } = JSON.parse(event.nativeEvent.data);
            currentCoords.current = { latitude: lat, longitude: lng };
            
            const [resultado] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (resultado) {
                setEnderecoCompleto(`${resultado.street || 'Rua não identificada'}, ${resultado.streetNumber || 'S/N'}`);
            }
        } catch (error) {
            setEnderecoCompleto('Endereço selecionado no mapa');
        }
    };

    const abrirModalConfirmacao = () => {
        if (!currentCoords.current) return Alert.alert('Atenção', 'Aguarde o mapa carregar.');
        setNomeLocal(''); 
        setModalVisivel(true);
    };

    const salvarEndereco = async () => {
        if (!nomeLocal.trim()) {
            Alert.alert('Atenção', 'Você precisa dar um nome para este endereço.');
            return;
        }

        // Validação estrita para o TypeScript saber que as coordenadas nunca serão null aqui
        if (!currentCoords.current) {
            Alert.alert('Erro', 'As coordenadas do mapa não foram identificadas.');
            return;
        }

        setSalvando(true);
        try {
            const userId = await AsyncStorage.getItem('userId');

            if (!userId) {
                Alert.alert('Erro', 'Usuário não identificado. Faça login novamente.');
                setSalvando(false);
                return;
            }

            const payload = { 
                apelido: nomeLocal.trim(), 
                rua: enderecoCompleto,
                numero: "S/N", 
                bairro: "Centro", 
                latitude: currentCoords.current.latitude, 
                longitude: currentCoords.current.longitude 
            };
            
            const response = await fetch(`${API_URL}/enderecos/usuario/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await AsyncStorage.setItem('userEndereco', enderecoCompleto);
                setModalVisivel(false);
                Alert.alert('Sucesso', 'Endereço cadastrado!');
                router.replace('/(tabs)/home');
            } else {
                Alert.alert('Erro', `Falha no servidor. Status: ${response.status}`);
            }
        } catch (e) {
            Alert.alert('Erro', 'Falha estrutural na conexão.');
        } finally {
            setSalvando(false);
        }
    };

    const mapHtml = useMemo(() => {
        if (!initialLocation) return '';
        return `
            <!DOCTYPE html><html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body, html { height: 100%; margin: 0; padding: 0; overflow: hidden; }
                #map { height: 100vh; width: 100vw; position: absolute; top: 0; left: 0; }
                .pino-container {
                    position: absolute; top: 50%; left: 50%;
                    width: 25px; height: 41px;
                    margin-top: -41px; margin-left: -12.5px;
                    z-index: 9999; pointer-events: none;
                }
            </style></head>
            <body>
                <div class="pino-container"><img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"></div>
                <div id="map"></div>
                <script>
                    var map = L.map('map', {zoomControl: false, inertia: false, tap: true}).setView([${initialLocation.latitude}, ${initialLocation.longitude}], 16);
                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                    
                    var timeout = null;
                    map.on('move', function() {
                        clearTimeout(timeout);
                        timeout = setTimeout(function() {
                            var center = map.getCenter();
                            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: center.lat, lng: center.lng }));
                        }, 200);
                    });
                </script>
            </body></html>
        `;
    }, [initialLocation]);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <View style={[styles.headerOverlay, { paddingTop: insets.top + 15 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Onde você embarca?</Text>
            </View>

            <View style={styles.mapContainer}>
                <WebView 
                    source={{ html: mapHtml }} 
                    onMessage={handleMapMessage} 
                    javaScriptEnabled={true} 
                    scrollEnabled={false}
                    bounces={false}
                />
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 25 }]}>
                <Text style={styles.enderecoLabel}>Endereço selecionado:</Text>
                <Text style={styles.enderecoText}>{enderecoCompleto}</Text>
                <TouchableOpacity style={styles.button} onPress={abrirModalConfirmacao}>
                    <Text style={styles.buttonText}>Confirmar Localização</Text>
                </TouchableOpacity>
            </View>

            <Modal animationType="fade" transparent visible={modalVisivel} onRequestClose={() => { if (!salvando) setModalVisivel(false); }}>
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="bookmark" size={28} color={colors.primary} />
                            <Text style={styles.modalTitulo}>Salvar Endereço</Text>
                        </View>
                        
                        <Text style={styles.modalTexto}>
                            Como você deseja chamar este local? (ex: Casa, Faculdade, Trabalho)
                        </Text>

                        <TextInput
                            style={styles.inputNome}
                            placeholder="Nome do local"
                            placeholderTextColor={colors.textMuted}
                            value={nomeLocal}
                            onChangeText={setNomeLocal}
                            autoCapitalize="words"
                            autoCorrect={false}
                            editable={!salvando}
                            maxLength={30}
                        />

                        <View style={styles.modalBotoes}>
                            <TouchableOpacity 
                                style={[styles.botaoModal, styles.botaoCancelar]} 
                                onPress={() => setModalVisivel(false)} 
                                disabled={salvando}
                            >
                                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.botaoModal, styles.botaoConfirmar]} 
                                onPress={salvarEndereco}
                                disabled={salvando || !nomeLocal.trim()}
                            >
                                {salvando ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.textoBotaoConfirmar}>Salvar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}