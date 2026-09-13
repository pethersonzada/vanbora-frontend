import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/config';
import { colors } from '../constants/colors';
import { useAuth } from './context/AuthContext';

export default function CadastroTurma() {
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [nome, setNome] = useState('');
    const [turno, setTurno] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleCadastrarTurma() {
        if (!nome.trim() || !turno.trim()) {
            Alert.alert("Atenção", "Preencha todos os campos da turma.");
            return;
        }

        if (!user?.id) {
            Alert.alert("Erro", "Usuário não identificado. Faça login novamente.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/turmas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    nome: nome.trim(),
                    turno: turno.trim(),
                    motorista: {
                        id: Number(user.id)
                    }
                })
            });

            if (response.ok) {
                Alert.alert("Sucesso", "Turma cadastrada com sucesso!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                const erroTexto = await response.text();
                Alert.alert("Erro", erroTexto || "Não foi possível cadastrar a turma.");
            }
        } catch (error) {
            Alert.alert("Erro", "Falha de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Header */}
            <View style={{ paddingTop: insets.top + 15, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundAlt, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15, padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textMain }}>Cadastrar Nova Turma</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 8 }}>Nome da Turma / Rota</Text>
                    <TextInput
                        style={{ 
                            backgroundColor: colors.backgroundAlt, 
                            borderWidth: 1, 
                            borderColor: colors.border, 
                            borderRadius: 12, 
                            paddingHorizontal: 16, 
                            paddingVertical: 14, 
                            color: colors.textMain,
                            fontSize: 15 
                        }}
                        placeholder="Ex: Escola Dom Bosco - Manhã"
                        placeholderTextColor={colors.textMuted}
                        value={nome}
                        onChangeText={setNome}
                    />
                </View>

                <View style={{ marginBottom: 30 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 8 }}>Turno</Text>
                    <TextInput
                        style={{ 
                            backgroundColor: colors.backgroundAlt, 
                            borderWidth: 1, 
                            borderColor: colors.border, 
                            borderRadius: 12, 
                            paddingHorizontal: 16, 
                            paddingVertical: 14, 
                            color: colors.textMain,
                            fontSize: 15 
                        }}
                        placeholder="Ex: Manhã, Tarde ou Noite"
                        placeholderTextColor={colors.textMuted}
                        value={turno}
                        onChangeText={setTurno}
                    />
                </View>

                <TouchableOpacity 
                    style={{ 
                        backgroundColor: colors.primary, 
                        borderRadius: 12, 
                        paddingVertical: 16, 
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4
                    }}
                    onPress={handleCadastrarTurma}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Salvar e Criar Turma</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}