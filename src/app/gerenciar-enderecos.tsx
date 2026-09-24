import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/config';
import { colors } from '../constants/colors';
import { homeMotoristaStyles as styles } from '../constants/homeMotoristaStyles';

type Endereco = {
    id: number;
    apelido: string;
    rua: string;
    numero: string;
    bairro: string;
};

export default function GerenciarEnderecos() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [enderecos, setEnderecos] = useState<Endereco[]>([]);

    const [modalEditarVisivel, setModalEditarVisivel] = useState(false);
    const [enderecoEmEdicao, setEnderecoEmEdicao] = useState<Endereco | null>(null);
    const [novoApelido, setNovoApelido] = useState('');
    const [salvandoApelido, setSalvandoApelido] = useState(false);

    const carregarEnderecos = async () => {
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) return;

            const res = await fetch(`${API_URL}/enderecos/usuario/${userId}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (res.ok) {
                const data = await res.json();
                setEnderecos(data);
            } else {
                Alert.alert('Erro', 'Não foi possível carregar os endereços.');
            }
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível carregar os endereços.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            carregarEnderecos();
        }, [])
    );

    const abrirModalEdicao = (end: Endereco) => {
        setEnderecoEmEdicao(end);
        setNovoApelido(end.apelido || '');
        setModalEditarVisivel(true);
    };

    const salvarApelido = async () => {
        if (!enderecoEmEdicao || !novoApelido.trim()) return;

        setSalvandoApelido(true);
        try {
            const res = await fetch(`${API_URL}/enderecos/${enderecoEmEdicao.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify({ apelido: novoApelido.trim() })
            });

            if (res.ok) {
                setModalEditarVisivel(false);
                carregarEnderecos();
            } else {
                Alert.alert('Erro', 'Não foi possível atualizar o apelido.');
            }
        } catch (e) {
            Alert.alert('Erro', 'Falha de conexão.');
        } finally {
            setSalvandoApelido(false);
        }
    };

    const excluirEndereco = (id: number) => {
        Alert.alert(
            'Excluir Endereço',
            'Deseja realmente remover este local?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_URL}/enderecos/${id}`, {
                                method: 'DELETE',
                                headers: { 'Bypass-Tunnel-Reminder': 'true' }
                            });
                            if (res.ok) {
                                carregarEnderecos();
                            } else {
                                Alert.alert('Erro', 'Não foi possível excluir o endereço.');
                            }
                        } catch (e) {
                            Alert.alert('Erro', 'Falha de conexão.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1, backgroundColor: colors.background }} />;
    }

    return (
        <View style={[styles.container, { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 15, marginBottom: 20 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                    <Ionicons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textMain }}>Meus Endereços</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                {enderecos.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Ionicons name="location-outline" size={60} color={colors.textMuted} />
                        <Text style={{ color: colors.textMuted, marginTop: 15, fontSize: 16 }}>Nenhum endereço cadastrado.</Text>
                    </View>
                ) : (
                    enderecos.map((end) => (
                        <View
                            key={end.id}
                            style={{
                                backgroundColor: colors.backgroundAlt,
                                padding: 15,
                                borderRadius: 12,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textMain, marginBottom: 4 }}>{end.apelido || 'Endereço'}</Text>
                                <Text style={{ fontSize: 13, color: colors.textMuted }}>{end.rua}, {end.numero} - {end.bairro}</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity onPress={() => abrirModalEdicao(end)} style={{ padding: 8, marginRight: 5 }}>
                                    <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => excluirEndereco(end.id)} style={{ padding: 8 }}>
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                <TouchableOpacity
                    style={{
                        marginTop: 20,
                        backgroundColor: colors.primary,
                        padding: 15,
                        borderRadius: 12,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center'
                    }}
                    onPress={() => router.push('/cadastro-endereco')}
                >
                    <Ionicons name="add" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Adicionar Novo Endereço</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalEditarVisivel}
                onRequestClose={() => { if (!salvandoApelido) setModalEditarVisivel(false); }}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: colors.backgroundAlt, width: '100%', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textMain, marginBottom: 10 }}>Renomear Endereço</Text>
                        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 15 }}>Dê um apelido fácil para identificar este local (Ex: Casa, Trabalho, Faculdade).</Text>

                        <TextInput
                            style={{
                                backgroundColor: colors.background,
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 8,
                                padding: 12,
                                color: colors.textMain,
                                marginBottom: 20
                            }}
                            placeholder="Apelido do endereço"
                            placeholderTextColor={colors.textMuted}
                            value={novoApelido}
                            onChangeText={setNovoApelido}
                            editable={!salvandoApelido}
                            maxLength={30}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                            <TouchableOpacity
                                style={{ padding: 10, marginRight: 15 }}
                                onPress={() => setModalEditarVisivel(false)}
                                disabled={salvandoApelido}
                            >
                                <Text style={{ color: colors.textMuted, fontWeight: 'bold' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, opacity: !novoApelido.trim() || salvandoApelido ? 0.6 : 1 }}
                                onPress={salvarApelido}
                                disabled={!novoApelido.trim() || salvandoApelido}
                            >
                                {salvandoApelido ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Salvar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}