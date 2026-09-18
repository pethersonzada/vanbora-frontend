import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../config/config';
import { colors } from '../constants/colors';

type Props = {
    turma: any;
    onAtualizarTurma: (turmaAtualizada: any) => void;
};

export function PainelTurmaSelecionada({ turma, onAtualizarTurma }: Props) {
    const [carregandoCodigo, setCarregandoCodigo] = useState(false);

    if (!turma) return null;

    async function handleRegenerarCodigo() {
        setCarregandoCodigo(true);
        try {
            const res = await fetch(`${API_URL}/turmas/${turma.id}/regenerar-codigo`, {
                method: 'PUT',
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (res.ok) {
                const turmaAtualizada = await res.json();
                onAtualizarTurma(turmaAtualizada);
            } else {
                Alert.alert("Erro", "Não foi possível gerar um novo código.");
            }
        } catch (e) {
            Alert.alert("Erro", "Falha de conexão com o servidor.");
        } finally {
            setCarregandoCodigo(false);
        }
    }

    return (
        <View style={{ 
            backgroundColor: colors.backgroundAlt, 
            padding: 15, 
            borderRadius: 12, 
            borderWidth: 1, 
            borderColor: colors.border, 
            marginBottom: 15,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <View>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>Código de Convite</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary, letterSpacing: 2, marginTop: 2 }}>
                    {turma.codigoConvite || '------'}
                </Text>
            </View>

            <TouchableOpacity 
                onPress={handleRegenerarCodigo}
                disabled={carregandoCodigo}
                style={{ 
                    backgroundColor: colors.background, 
                    padding: 10, 
                    borderRadius: 10, 
                    borderWidth: 1, 
                    borderColor: colors.border, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 6
                }}
            >
                {carregandoCodigo ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <>
                        <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>Gerar Novo</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}