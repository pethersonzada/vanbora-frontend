import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: LARGURA_TELA } = Dimensions.get('window');
const ESCALA = Math.min(LARGURA_TELA / 390, 1.25);

type CabecalhoMapaProps = {
    onBack: () => void;
    online: boolean;
    direcaoAtual: string;
    horarioAtual: string;
};

export function CabecalhoMapa({ onBack, online, direcaoAtual, horarioAtual }: CabecalhoMapaProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
            <TouchableOpacity
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', width: 42 * ESCALA, height: 42 * ESCALA, borderRadius: 21 * ESCALA, justifyContent: 'center', alignItems: 'center' }}
                onPress={onBack}
            >
                <Ionicons name="arrow-back" size={22} color="#FFC107" />
            </TouchableOpacity>
            <View style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', marginLeft: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: online ? '#4CAF50' : '#FF5722', marginRight: 6 }} />
                    <Text style={{ color: '#FFF', letterSpacing: 0.5, fontWeight: 'bold', fontSize: 12 * ESCALA }}>ROTA {direcaoAtual.toUpperCase()}</Text>
                </View>
                <Text style={{ color: '#FFC107', fontSize: 13 * ESCALA, fontWeight: '900', marginLeft: 10 }}>{horarioAtual}</Text>
            </View>
        </View>
    );
}