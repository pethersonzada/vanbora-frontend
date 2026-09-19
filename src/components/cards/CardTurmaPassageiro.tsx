import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { colors } from '../../constants/colors';

export function CardTurmaPassageiro({ turma }: { turma: any }) {
    if (!turma) {
        return null; 
    }

    return (
        <View style={{ 
            backgroundColor: colors.backgroundAlt, 
            padding: 16, 
            borderRadius: 12, 
            borderWidth: 1, 
            borderColor: colors.border,
            marginBottom: 15,
            flexDirection: 'row',
            alignItems: 'center'
        }}>
            <Ionicons name="bus" size={24} color={colors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textMain }}>{turma.nome}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>Turno: {turma.turno || 'Não informado'}</Text>
            </View>
        </View>
    );
}