import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

import { API_URL } from '../config/config';
import { colors } from '../constants/colors';
import { useAuth } from './context/AuthContext';

// Componentes Modularizados
import { BannerRotaAtiva } from '../components/banners/BannerRotaAtiva';
import { CardsTurmasMotorista } from '../components/cards/CardsTurmasMotorista';
import { BotoesAcaoMotorista } from '../components/motorista/BotoesAcaoMotorista';
import { HeaderMotorista } from '../components/motorista/HeaderMotorista';
import { ListaPassageirosAprovados } from '../components/motorista/ListaPassageirosAprovados';
import { PainelTurmaSelecionada } from '../components/motorista/PainelTurmaSelecionada';

export default function HomeMotorista() {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const primeiraCarga = useRef(true);

    const [turmas, setTurmas] = useState<any[]>([]);
    const [turmaSelecionada, setTurmaSelecionada] = useState<any | null>(null);
    const [passageiros, setPassageiros] = useState<any[]>([]);
    const [alunosPendentes, setAlunosPendentes] = useState<any[]>([]);
    const [viagemAtiva, setViagemAtiva] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalNotificacoesVisible, setModalNotificacoesVisible] = useState(false);
    const [todosAlunos, setTodosAlunos] = useState<any[]>([]);
    const [carregandoAlunos, setCarregandoAlunos] = useState(false);

    useFocusEffect(
        useCallback(() => {
            carregarDadosSilencioso();
        }, [user?.id, turmaSelecionada?.id])
    );

    async function carregarDadosSilencioso() {
        if (primeiraCarga.current) setLoading(true);

        if (user?.id) {
            await Promise.all([
                buscarTurmas(String(user.id)),
                checarAmnesia()
            ]);
        }

        setLoading(false);
        primeiraCarga.current = false;
    }

    async function buscarTurmas(motoristaId: string | number) {
        try {
            const res = await fetch(`${API_URL}/turmas/motorista/${motoristaId}`, { headers: { 'Accept': 'application/json', 'Bypass-Tunnel-Reminder': 'true' } });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setTurmas(data);

            if (data.length > 0) {
                const atual = turmaSelecionada ? (data.find((t: any) => t.id === turmaSelecionada.id) || data[0]) : data[0];

                if (!turmaSelecionada || turmaSelecionada.id !== atual.id) {
                    setTurmaSelecionada(atual);
                }

                await buscarDadosDaTurma(atual.id);
            } else {
                setTurmaSelecionada(null);
                setPassageiros([]);
                setAlunosPendentes([]);
            }
        } catch (e) {
            console.log("Falha ao carregar as turmas.");
        }
    }

    async function buscarDadosDaTurma(turmaId: number) {
        await Promise.all([
            buscarPassageirosPorTurma(turmaId),
            buscarAlunosPendentes(turmaId)
        ]);
    }

    async function buscarPassageirosPorTurma(turmaId: number) {
        try {
            const res = await fetch(`${API_URL}/turmas/${turmaId}/passageiros`, { headers: { 'Accept': 'application/json', 'Bypass-Tunnel-Reminder': 'true' } });
            if (res.ok) {
                const dados = await res.json();
                setPassageiros(dados);
            }
        } catch (e) { console.log("Falha ao buscar passageiros."); }
    }

    async function buscarAlunosPendentes(turmaId: number) {
        try {
            const res = await fetch(`${API_URL}/turmas/${turmaId}/pendentes`, { headers: { 'Accept': 'application/json', 'Bypass-Tunnel-Reminder': 'true' } });
            if (res.ok) {
                const dados = await res.json();
                setAlunosPendentes(dados);
            }
        } catch (e) { console.log("Falha ao buscar pendentes."); }
    }

    async function analisarSolicitacao(vinculoId: number, status: 'APROVADO' | 'REJEITADO') {
        try {
            const res = await fetch(`${API_URL}/turmas/analisar/${vinculoId}?status=${status}`, {
                method: 'PUT',
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (res.ok) {
                await buscarDadosDaTurma(turmaSelecionada.id);
            } else {
                Alert.alert("Erro", "Não foi possível atualizar a solicitação.");
            }
        } catch (e) { Alert.alert("Erro", "Falha de conexão com o servidor."); }
    }

    async function excluirTurmaAtual() {
        if (!turmaSelecionada) return;

        Alert.alert(
            "Excluir Turma",
            `Deseja realmente excluir a turma "${turmaSelecionada.nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_URL}/turmas/${turmaSelecionada.id}`, {
                                method: 'DELETE',
                                headers: { 'Bypass-Tunnel-Reminder': 'true' }
                            });

                            if (res.ok) {
                                setTurmaSelecionada(null);
                                if (user?.id) await buscarTurmas(String(user.id));
                            } else {
                                Alert.alert("Erro", "Não foi possível excluir a turma.");
                            }
                        } catch (e) { Alert.alert("Erro", "Falha de conexão com o servidor."); }
                    }
                }
            ]
        );
    }

    async function checarAmnesia() {
        try {
            const res = await fetch(`${API_URL}/rota/status-atual`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });
            if (res.ok) {
                const data = await res.json();
                setViagemAtiva(data.status === 'ATIVA');
            }
        } catch (e) { }
    }

    async function abrirModalAdicionarAluno() {
        if (!turmaSelecionada) return;
        setModalVisible(true);
        setCarregandoAlunos(true);
        try {
            const res = await fetch(`${API_URL}/usuarios/passageiros`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });
            if (res.ok) {
                const todosOsPassageiros = await res.json();
                const idsNaTurma = new Set(passageiros.map(p => p.id));
                const disponiveis = todosOsPassageiros.filter((p: any) => !idsNaTurma.has(p.id));
                setTodosAlunos(disponiveis);
            }
        } catch (e) {
            Alert.alert("Erro", "Não foi possível carregar alunos livres.");
        } finally { setCarregandoAlunos(false); }
    }

    async function vincularAluno(alunoId: number) {
        if (!turmaSelecionada) return;
        try {
            const res = await fetch(`${API_URL}/turmas/${turmaSelecionada.id}/alunos/${alunoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (res.ok) {
                setModalVisible(false);
                await buscarDadosDaTurma(turmaSelecionada.id);
            } else {
                const erroTexto = await res.text();
                Alert.alert("Erro", erroTexto || "Não foi possível vincular o aluno.");
            }
        } catch (e) { Alert.alert("Erro", "Falha de conexão com o servidor."); }
    }

    async function removerAluno(alunoId: number, nomeAluno: string) {
        if (!turmaSelecionada) return;

        Alert.alert(
            "Remover Passageiro",
            `Deseja realmente remover ${nomeAluno} desta turma?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_URL}/turmas/${turmaSelecionada.id}/alunos/${alunoId}`, {
                                method: 'DELETE',
                                headers: { 'Bypass-Tunnel-Reminder': 'true' }
                            });

                            if (res.ok) await buscarDadosDaTurma(turmaSelecionada.id);
                            else Alert.alert("Erro", "Não foi possível remover o aluno.");
                        } catch (e) { Alert.alert("Erro", "Falha de conexão com o servidor."); }
                    }
                }
            ]
        );
    }

    const totalPassageiros = passageiros.length;
    const totalRespostas = passageiros.filter(p => p.status).length;
    const todosResponderam = totalPassageiros > 0 && totalRespostas === totalPassageiros;

    const iniciarRota = (sentido: string) => {
        if (!turmaSelecionada) { Alert.alert("Atenção", "Selecione uma turma."); return; }
        if (viagemAtiva) return;

        const executarInicioNoServidor = async () => {
            try {
                const res = await fetch(`${API_URL}/rota/iniciar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                    body: JSON.stringify({ turmaId: Number(turmaSelecionada.id), sentido: sentido })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.erro);
                }

                router.push(`/mapa?sentido=${sentido.toLowerCase()}`);
            } catch (e: any) { Alert.alert("Erro", e.message || "Erro ao iniciar a rota."); }
        };

        Alert.alert(
            !todosResponderam ? "Alunos Pendentes" : "Iniciar Rota",
            !todosResponderam ? "Existem alunos sem confirmar presença. Deseja iniciar mesmo assim?" : "Deseja iniciar a rota de " + sentido + " agora?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Iniciar", style: "default", onPress: executarInicioNoServidor }
            ]
        );
    };

    if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1, backgroundColor: colors.background }} />;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <HeaderMotorista
                nomeMotorista={user?.nome ? user.nome.split(' ')[0] : ''}
                totalPendentes={alunosPendentes.length}
                onAbrirNotificacoes={() => setModalNotificacoesVisible(true)}
            />

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                {viagemAtiva && <BannerRotaAtiva onPress={() => router.push('/mapa')} />}

                <CardsTurmasMotorista
                    turmas={turmas}
                    turmaSelecionada={turmaSelecionada}
                    onSelecionarTurma={async (t) => { setTurmaSelecionada(t); await buscarDadosDaTurma(t.id); }}
                    onEditarTurma={() => { }}
                />

                <PainelTurmaSelecionada
                    turma={turmaSelecionada}
                    onAtualizarTurma={(tAtualizada) => setTurmaSelecionada(tAtualizada)}
                />

                {turmaSelecionada && (
                    <>
                        <View style={{ backgroundColor: todosResponderam ? colors.success : colors.primary, padding: 15, borderRadius: 12, marginBottom: 15, alignItems: 'center' }}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>{todosResponderam ? "PRONTO!" : "COLETANDO..."}</Text>
                            <Text style={{ color: '#FFF', fontSize: 13, marginTop: 2 }}>{turmaSelecionada.nome} ({totalRespostas}/{totalPassageiros} responderam)</Text>
                        </View>

                        <BotoesAcaoMotorista viagemAtiva={viagemAtiva} todosResponderam={todosResponderam} onIniciarRota={iniciarRota} />
                    </>
                )}

                <ListaPassageirosAprovados
                    passageiros={passageiros}
                    turmaSelecionada={turmaSelecionada}
                    onAdicionarAluno={abrirModalAdicionarAluno}
                    onRemoverAluno={removerAluno}
                />
            </ScrollView>

            {/* Modal de Notificações / Pendentes */}
            <Modal visible={modalNotificacoesVisible} animationType="fade" transparent={true} onRequestClose={() => setModalNotificacoesVisible(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalNotificacoesVisible(false)} />
                    <View style={{ backgroundColor: colors.backgroundAlt, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '75%' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textMain, marginBottom: 15 }}>Solicitações de Entrada</Text>
                        {alunosPendentes.length === 0 ? (
                            <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 30 }}>Nenhuma solicitação pendente.</Text>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {alunosPendentes.map(item => (
                                    <View key={item.id} style={{ backgroundColor: colors.background, padding: 14, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textMain }}>{item.aluno?.nome}</Text>
                                            <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.aluno?.telefone || 'Sem telefone'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity onPress={() => analisarSolicitacao(item.id, 'APROVADO')} style={{ backgroundColor: colors.success, padding: 8, borderRadius: 8 }}>
                                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Aprovar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => analisarSolicitacao(item.id, 'REJEITADO')} style={{ backgroundColor: colors.danger, padding: 8, borderRadius: 8 }}>
                                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Recusar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal de Adicionar Passageiro Manual */}
            <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalVisible(false)} />
                    <View style={{ backgroundColor: colors.backgroundAlt, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '75%' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textMain, marginBottom: 15 }}>Adicionar Passageiro</Text>
                        {carregandoAlunos ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
                        ) : todosAlunos.length === 0 ? (
                            <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 30 }}>Nenhum aluno disponível.</Text>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {todosAlunos.map(aluno => (
                                    <TouchableOpacity key={aluno.id} style={{ backgroundColor: colors.background, padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border }} onPress={() => vincularAluno(aluno.id)}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textMain }}>{aluno.nome}</Text>
                                        <Ionicons name="add" size={18} color={colors.primary} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}