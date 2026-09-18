import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { homeMotoristaStyles as styles } from '../constants/homeMotoristaStyles';

type Turma = {
    id: number;
    nome: string;
    turno: string;
};

type Props = {
    turmas: Turma[];
    turmaSelecionada: Turma | null;
    onSelecionarTurma: (turma: Turma) => void;
    onEditarTurma: () => void;
};

export function CardsTurmasMotorista({ turmas, turmaSelecionada, onSelecionarTurma, onEditarTurma }: Props) {
    const router = useRouter();

    return (
        <View>
            <View style={[styles.headerRow, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
                <Text style={styles.sectionTitle}>Selecione a Turma / Rota</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {turmaSelecionada && (
                        <TouchableOpacity onPress={onEditarTurma} style={styles.btnEditarTurma}>
                            <Ionicons name="pencil" size={14} color={colors.primary} />
                            <Text style={styles.btnEditarTurmaText}>Editar</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                        onPress={() => router.push('/cadastro-turma' as any)} 
                        style={{ 
                            backgroundColor: colors.primary, 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            paddingVertical: 6, 
                            paddingHorizontal: 10, 
                            borderRadius: 8 
                        }}
                    >
                        <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Nova</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {turmas.length === 0 ? (
                <View style={{ 
                    backgroundColor: colors.backgroundAlt, 
                    padding: 18, 
                    borderRadius: 12, 
                    borderWidth: 1, 
                    borderColor: colors.border,
                    alignItems: 'center',
                    marginBottom: 10
                }}>
                    <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 8, textAlign: 'center' }}>
                        Nenhuma turma cadastrada.
                    </Text>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.turmasScroll}>
                    {turmas.map(t => {
                        const selecionada = turmaSelecionada?.id === t.id;
                        return (
                            <TouchableOpacity
                                key={t.id}
                                style={[styles.turmaCard, selecionada && styles.turmaCardSelecionada]}
                                onPress={() => onSelecionarTurma(t)}
                            >
                                <Ionicons name="bus" size={20} color={selecionada ? colors.white : colors.primary} />
                                <Text style={[styles.turmaNome, selecionada && styles.turmaNomeSelecionada]}>{t.nome}</Text>
                                <Text style={[styles.turmaTurno, selecionada && styles.turmaTurnoSelecionada]}>{t.turno}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}