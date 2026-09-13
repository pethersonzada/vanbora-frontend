import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { homeMotoristaStyles as styles } from '../constants/homeMotoristaStyles';

type Props = {
    passageiros: any[];
    turmaSelecionada: any;
    onAdicionarAluno: () => void;
    onRemoverAluno: (id: number, nome: string) => void;
};

export function ListaPassageirosAprovados({ passageiros, turmaSelecionada, onAdicionarAluno, onRemoverAluno }: Props) {
    return (
        <>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Passageiros Aprovados</Text>
            </View>

            <View style={styles.cardList}>
                {passageiros.length === 0 ? (
                    <Text style={styles.emptyText}>Nenhum aluno aprovado nesta turma.</Text>
                ) : (
                    passageiros.map(p => (
                        <View key={p.id} style={[styles.listItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.nameText}>{p.nome}</Text>
                                <Text style={styles.subText}>{p.status ? 'Respondeu' : 'Aguardando...'}</Text>
                            </View>
                            
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={[styles.badge, { backgroundColor: p.status ? colors.successBg : colors.dangerBg }]}>
                                    <Text style={{ color: p.status ? colors.success : colors.danger, fontSize: 12, fontWeight: 'bold' }}>
                                        {p.status || 'PENDENTE'}
                                    </Text>
                                </View>

                                <TouchableOpacity onPress={() => onRemoverAluno(p.id, p.nome)} style={{ padding: 6 }}>
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </>
    );
}