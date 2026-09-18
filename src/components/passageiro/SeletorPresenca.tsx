import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { homeMotoristaStyles as styles } from '../../constants/homeMotoristaStyles';

type Endereco = {
    id: number;
    apelido: string;
    rua: string;
    numero: string;
    bairro: string;
};

type Props = {
    statusConfirmado: string;
    enderecos: Endereco[];
    onRegistrar: (status: string, enderecoId?: number) => void;
};

export function SeletorPresenca({ statusConfirmado, enderecos, onRegistrar }: Props) {
    const [statusSelecionado, setStatusSelecionado] = useState<string | null>(null);
    const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<number | null>(null);

    if (statusConfirmado) {
        return (
            <View style={[styles.cardList, { alignItems: 'center', padding: 30 }]}>
                <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                <Text style={[styles.nameText, { fontSize: 20, marginVertical: 10 }]}>Confirmado!</Text>
                <Text style={styles.subText}>Opção: {statusConfirmado}</Text>
                <TouchableOpacity onPress={() => onRegistrar('LIMPAR')} style={{ marginTop: 15, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.danger, fontSize: 12, fontWeight: 'bold' }}>Alterar decisão</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!statusSelecionado) {
        return (
            <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 10 }}>O que você vai fazer hoje?</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {['IDA', 'VOLTA', 'AMBOS', 'NAO_VOU'].map((s) => (
                        <TouchableOpacity key={s} style={[styles.btnMotorista, { backgroundColor: colors.primary, width: '48%', marginBottom: 10 }]} onPress={() => {
                            if (s === 'NAO_VOU') {
                                onRegistrar(s);
                            } else {
                                setStatusSelecionado(s);
                            }
                        }}>
                            <Text style={styles.btnText}>{s.replace('_', ' ')}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={{ backgroundColor: colors.backgroundAlt, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 10 }}>Escolha o local de embarque:</Text>
            {enderecos.length === 0 ? (
                <Text style={{ color: colors.danger, marginBottom: 10 }}>Você não tem endereços cadastrados!</Text>
            ) : (
                enderecos.map((end) => (
                    <TouchableOpacity 
                        key={end.id} 
                        style={{ 
                            padding: 12, 
                            borderRadius: 8, 
                            marginBottom: 8, 
                            backgroundColor: enderecoSelecionadoId === end.id ? colors.primary + '20' : colors.background,
                            borderWidth: 1,
                            borderColor: enderecoSelecionadoId === end.id ? colors.primary : colors.border
                        }}
                        onPress={() => setEnderecoSelecionadoId(end.id)}
                    >
                        <Text style={{ fontWeight: 'bold', color: colors.textMain }}>{end.apelido || 'Endereço'}</Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>{end.rua}, {end.numero} - {end.bairro}</Text>
                    </TouchableOpacity>
                ))
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <TouchableOpacity style={{ padding: 10 }} onPress={() => setStatusSelecionado(null)}>
                    <Text style={{ color: colors.textMuted }}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.btnMotorista, { backgroundColor: colors.primary, paddingHorizontal: 20 }]} 
                    onPress={() => {
                        if (enderecoSelecionadoId) {
                            onRegistrar(statusSelecionado, enderecoSelecionadoId);
                        } else {
                            alert("Selecione um endereço para continuar.");
                        }
                    }}
                >
                    <Text style={styles.btnText}>Confirmar {statusSelecionado}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}