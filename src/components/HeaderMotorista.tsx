import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { homeMotoristaStyles as styles } from '../constants/homeMotoristaStyles';

type Props = {
    nomeMotorista: string;
    totalPendentes: number;
    onAbrirNotificacoes: () => void;
};

export function HeaderMotorista({ nomeMotorista, totalPendentes, onAbrirNotificacoes }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.header, { paddingTop: insets.top + 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
                <Text style={styles.dateText}>
                    {new Date().toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' })}
                </Text>
                <Text style={styles.welcome}>Olá, {nomeMotorista}</Text>
            </View>

            <TouchableOpacity 
                onPress={onAbrirNotificacoes} 
                style={{ 
                    backgroundColor: colors.backgroundAlt, 
                    padding: 10, 
                    borderRadius: 12, 
                    borderWidth: 1, 
                    borderColor: colors.border,
                    position: 'relative'
                }}
            >
                <Ionicons name="notifications-outline" size={22} color={colors.textMain} />
                {totalPendentes > 0 && (
                    <View style={{ 
                        position: 'absolute', 
                        top: -4, 
                        right: -4, 
                        backgroundColor: colors.danger, 
                        borderRadius: 10, 
                        minWidth: 18, 
                        height: 18, 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        paddingHorizontal: 4
                    }}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{totalPendentes}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}