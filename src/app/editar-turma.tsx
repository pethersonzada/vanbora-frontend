import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/config';
import { colors } from '../constants/colors';

export default function EditarTurma() {
    const { id, nomeAtual, turnoAtual, origemAtual, destinoAtual } = useLocalSearchParams<{ 
        id: string; 
        nomeAtual?: string; 
        turnoAtual?: string;
        origemAtual?: string;
        destinoAtual?: string;
    }>();
    
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [nome, setNome] = useState(nomeAtual || '');
    const [turno, setTurno] = useState(turnoAtual || '');
    const [origemNome, setOrigemNome] = useState(origemAtual || '');
    const [destinoNome, setDestinoNome] = useState(destinoAtual || '');
    const [loadingDados, setLoadingDados] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        if (id) {
            buscarDetalhesTurma();
        }
    }, [id]);

    async function buscarDetalhesTurma() {
        setLoadingDados(true);
        try {
            const motoristaId = await AsyncStorage.getItem('userId') || '1';
            const response = await fetch(`${API_URL}/turmas/motorista/${motoristaId}`, {
                headers: { 'Accept': 'application/json', 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (response.ok) {
                const turmas = await response.json();
                const turmaAtual = turmas.find((t: any) => t.id.toString() === id.toString());
                if (turmaAtual) {
                    if (!nome) setNome(turmaAtual.nome || '');
                    if (!turno) setTurno(turmaAtual.turno || '');
                    setOrigemNome(turmaAtual.origemNome || '');
                    setDestinoNome(turmaAtual.destinoNome || '');
                }
            }
        } catch (e) {
            console.log("Erro ao buscar detalhes da turma", e);
        } finally {
            setLoadingDados(false);
        }
    }

    async function handleSalvarEdicao() {
        if (!nome.trim() || !turno.trim()) {
            Alert.alert("Atenção", "Preencha o nome e o turno.");
            return;
        }

        if (!id) {
            Alert.alert("Erro", "ID da turma não identificado.");
            return;
        }

        setSalvando(true);
        try {
            const response = await fetch(`${API_URL}/turmas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    nome: nome.trim(),
                    turno: turno.trim(),
                    origemNome: origemNome.trim(),
                    destinoNome: destinoNome.trim()
                })
            });

            if (response.ok) {
                Alert.alert("Sucesso", "Turma atualizada com sucesso!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                const erroTexto = await response.text();
                Alert.alert("Erro", erroTexto || "Não foi possível atualizar a turma.");
            }
        } catch (error) {
            Alert.alert("Erro", "Falha de conexão com o servidor.");
        } finally {
            setSalvando(false);
        }
    }

    function confirmarExclusao() {
        Alert.alert(
            "Excluir Turma",
            "Deseja realmente excluir esta turma? Todos os vínculos de alunos e histórico de viagens desta rota serão apagados.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Excluir", 
                    style: "destructive", 
                    onPress: handleExcluirTurma 
                }
            ]
        );
    }

    async function handleExcluirTurma() {
        if (!id) return;

        setExcluindo(true);
        try {
            const response = await fetch(`${API_URL}/turmas/${id}`, {
                method: 'DELETE',
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (response.ok) {
                Alert.alert("Sucesso", "Turma excluída com sucesso!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                const erroTexto = await response.text();
                Alert.alert("Erro", erroTexto || "Não foi possível excluir a turma.");
            }
        } catch (error) {
            Alert.alert("Erro", "Falha de conexão com o servidor.");
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <View style={{ paddingTop: insets.top + 15, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundAlt, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15, padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textMain }}>Editar Turma e Percurso</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                {loadingDados ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 20 }} />
                ) : null}

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 8 }}>Nome da Turma / Rota</Text>
                    <TextInput
                        style={{ backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: colors.textMain, fontSize: 15 }}
                        placeholder="Ex: Escola Dom Bosco - Manhã"
                        placeholderTextColor={colors.textMuted}
                        value={nome}
                        onChangeText={setNome}
                    />
                </View>

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 8 }}>Turno</Text>
                    <TextInput
                        style={{ backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: colors.textMain, fontSize: 15 }}
                        placeholder="Ex: Manhã, Tarde ou Noite"
                        placeholderTextColor={colors.textMuted}
                        value={turno}
                        onChangeText={setTurno}
                    />
                </View>

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 8 }}>Endereço de Saída (Origem)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={{ flex: 1, backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: colors.textMain, fontSize: 14 }}
                            placeholder="Defina a saída no mapa"
                            placeholderTextColor={colors.textMuted}
                            value={origemNome}
                            editable={false}
                        />
                        <TouchableOpacity 
                            style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 14, borderTopRightRadius: 12, borderBottomRightRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                            onPress={() => router.push({ pathname: '/selecionar-rota-mapa', params: { turmaId: id, tipo: 'ORIGEM' } } as any)}
                        >
                            <Ionicons name="map" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ marginBottom: 30 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 8 }}>Ponto Final (Destino)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={{ flex: 1, backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: colors.textMain, fontSize: 14 }}
                            placeholder="Defina o destino no mapa"
                            placeholderTextColor={colors.textMuted}
                            value={destinoNome}
                            editable={false}
                        />
                        <TouchableOpacity 
                            style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 14, borderTopRightRadius: 12, borderBottomRightRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                            onPress={() => router.push({ pathname: '/selecionar-rota-mapa', params: { turmaId: id, tipo: 'DESTINO' } } as any)}
                        >
                            <Ionicons name="map" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity 
                    style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 15 }}
                    onPress={handleSalvarEdicao}
                    disabled={salvando || excluindo}
                >
                    {salvando ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Salvar Alterações</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={{ backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger, borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                    onPress={confirmarExclusao}
                    disabled={salvando || excluindo}
                >
                    {excluindo ? (
                        <ActivityIndicator color={colors.danger} />
                    ) : (
                        <>
                            <Ionicons name="trash-outline" size={20} color={colors.danger} style={{ marginRight: 8 }} />
                            <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 15 }}>Excluir Turma</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}