import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../config/config';
import { colors } from '../../constants/colors';
import { perfilStyles as styles } from '../../constants/perfilStyles';
import { useAuth } from '../context/AuthContext';

export default function Perfil() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [modalDeletarVisivel, setModalDeletarVisivel] = useState(false);
    const [codigoDigitado, setCodigoDigitado] = useState('');
    const [carregandoExclusao, setCarregandoExclusao] = useState(false);

    const abrirWhatsApp = () => {
        const url = 'https://wa.me/5581991976404';
        Linking.openURL(url).catch(() => Alert.alert("Erro", "Não foi possível abrir o WhatsApp."));
    };

    const handleLogout = () => {
        Alert.alert(
            "Encerrar Sessão",
            "Você tem certeza que deseja sair do sistema?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sair",
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    const confirmarEExcluirConta = async () => {
        if (codigoDigitado.trim().toUpperCase() !== 'ROTA2026') {
            Alert.alert("Código Inválido", "O código de segurança está incorreto.");
            return;
        }

        setCarregandoExclusao(true);
        try {
            if (user.id) {
                await fetch(`${API_URL}/usuarios/${user.id}`, { method: 'DELETE' });
            }
        } catch (error) {
            console.error(error);
        } finally {
            await signOut();
            setModalDeletarVisivel(false);
            router.replace('/login');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}</Text>
                    </View>
                    <Text style={styles.nome}>{user.nome}</Text>
                    <View style={styles.badge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.white} />
                        <Text style={styles.badgeText}> Conta Verificada</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>TIPO DE CONTA</Text>
                        <Text style={styles.valor}>{user.tipo}</Text>
                    </View>
                    <View style={styles.linha} />
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>STATUS</Text>
                        <Text style={[styles.valor, { color: colors.primary }]}>Online</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/gerenciar-enderecos')}>
                    <Ionicons name="location" size={24} color={colors.primary} />
                    <Text style={styles.menuText}>Gerenciar Endereços</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={abrirWhatsApp}>
                    <Ionicons name="headset" size={24} color={colors.primary} />
                    <Text style={styles.menuText}>Central de Ajuda</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={colors.danger} />
                    <Text style={styles.textoBotaoSair}>Encerrar Sessão</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.botaoDeletar} onPress={() => setModalDeletarVisivel(true)}>
                    <Ionicons name="trash-outline" size={22} color={colors.white} />
                    <Text style={styles.textoBotaoDeletar}>Excluir Minha Conta</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalDeletarVisivel}
                onRequestClose={() => setModalDeletarVisivel(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.iconeAlerta}>
                            <Ionicons name="warning" size={40} color={colors.danger} />
                        </View>
                        <Text style={styles.modalTitulo}>Deletar conta</Text>
                        <Text style={styles.modalTexto}>
                            Esta ação é irreversível. Todos os seus dados serão apagados. Para confirmar, digite o código ROTA2026 abaixo:
                        </Text>

                        <TextInput
                            style={styles.inputCodigo}
                            placeholder="Digite o código"
                            placeholderTextColor={colors.textMuted}
                            value={codigoDigitado}
                            onChangeText={setCodigoDigitado}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />

                        <View style={styles.modalBotoes}>
                            <TouchableOpacity
                                style={[styles.botaoModal, styles.botaoCancelar]}
                                onPress={() => {
                                    setModalDeletarVisivel(false);
                                    setCodigoDigitado('');
                                }}
                                disabled={carregandoExclusao}
                            >
                                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.botaoModal, styles.botaoConfirmarExclusao]}
                                onPress={confirmarEExcluirConta}
                                disabled={carregandoExclusao}
                            >
                                {carregandoExclusao ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.textoBotaoConfirmarExclusao}>Excluir Conta</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}