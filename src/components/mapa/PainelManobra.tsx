import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: LARGURA_TELA } = Dimensions.get('window');
const ESCALA = Math.min(LARGURA_TELA / 390, 1.25);

type Manobra = { instrucao: string; tipo: string };

type PainelManobraProps = {
    manobraAtual: Manobra | null;
    velocidadeAtual: number;
};

function iconePorManobra(tipo: string): keyof typeof Ionicons.glyphMap {
    if (tipo.includes('left')) return 'arrow-back';
    if (tipo.includes('right')) return 'arrow-forward';
    if (tipo.includes('roundabout')) return 'sync';
    if (tipo.includes('arrive')) return 'flag';
    return 'arrow-up';
}

export function PainelManobra({ manobraAtual, velocidadeAtual }: PainelManobraProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={{
            position: 'absolute', top: insets.top + 66, left: 16, right: 16, zIndex: 10,
            backgroundColor: '#1E1E1E', padding: 14, borderRadius: 16,
            borderWidth: 1, borderColor: '#333', flexDirection: 'row', alignItems: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
        }}>
            <View style={{ backgroundColor: '#FFC107', padding: 12, borderRadius: 12, marginRight: 14 }}>
                <Ionicons name={manobraAtual ? iconePorManobra(manobraAtual.tipo) : 'navigate-outline'} size={22} color="#121212" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: '#888', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Próxima manobra</Text>
                <Text style={{ color: '#FFF', fontSize: 14 * ESCALA, fontWeight: '700', marginTop: 2, lineHeight: 19 }} numberOfLines={2}>
                    {manobraAtual?.instrucao || 'Calculando rota...'}
                </Text>
            </View>
            <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <Text style={{ color: '#FFC107', fontSize: 18 * ESCALA, fontWeight: '900' }}>{velocidadeAtual}</Text>
                <Text style={{ color: '#777', fontSize: 9, fontWeight: '700' }}>KM/H</Text>
            </View>
        </View>
    );
}