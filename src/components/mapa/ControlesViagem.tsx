import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ControlesViagemProps = {
    distanciaRestante: number | null;
    etaMinutos: number | null;
    viagemAtiva: boolean;
    onIniciarViagem: () => void;
    onEncerrarViagem: () => void;
};

export function ControlesViagem({ distanciaRestante, etaMinutos, viagemAtiva, onIniciarViagem, onEncerrarViagem }: ControlesViagemProps) {
    const insets = useSafeAreaInsets();

    return (
        <>
            {distanciaRestante !== null && (
                <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 92, zIndex: 20, backgroundColor: '#1E1E1E', borderRadius: 14, borderWidth: 1, borderColor: '#333', padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ color: '#888', fontSize: 10, fontWeight: '700' }}>DISTÂNCIA RESTANTE</Text>
                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>{(distanciaRestante / 1000).toFixed(1)} km</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#888', fontSize: 10, fontWeight: '700' }}>CHEGADA ESTIMADA</Text>
                        <Text style={{ color: '#FFC107', fontSize: 16, fontWeight: '900' }}>{etaMinutos} min</Text>
                    </View>
                </View>
            )}

            <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 16, zIndex: 20, paddingHorizontal: 16 }}>
                {!viagemAtiva ? (
                    <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFC107', borderRadius: 14, height: 54, shadowColor: '#FFC107', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }} onPress={onIniciarViagem}>
                        <Ionicons name="play" size={20} color="#121212" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#121212', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>INICIAR ROTA DE TRANSPORTE</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#E53935', borderRadius: 14, height: 64, shadowColor: '#E53935', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }} onPress={onEncerrarViagem}>
                        <Ionicons name="stop" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>ENCERRAR VIAGEM</Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
}