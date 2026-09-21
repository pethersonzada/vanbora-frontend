import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, updateEmail } from 'firebase/auth';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../config/config';
import { auth } from '../../config/firebase';
import { colors } from '../../constants/colors';
import { perfilStyles as s } from '../../constants/perfilStyles';
import { useAuth } from '../context/AuthContext';

const WHATSAPP_URL = 'https://wa.me/5581991976404';
const PALAVRA_CONFIRMACAO = 'EXCLUIR';

export default function Perfil() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Estados - Exclusão
    const [modalDeletarVisivel, setModalDeletarVisivel] = useState(false);
    const [textoDigitado, setTextoDigitado] = useState('');
    const [excluindo, setExcluindo] = useState(false);
    const [erroExclusao, setErroExclusao] = useState('');

    // Estados - Alterar E-mail
    const [modalEmailVisivel, setModalEmailVisivel] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novoEmail, setNovoEmail] = useState('');
    const [carregandoEmail, setCarregandoEmail] = useState(false);

    // Estados - Redefinir Senha
    const [modalSenhaVisivel, setModalSenhaVisivel] = useState(false);
    const [carregandoSenha, setCarregandoSenha] = useState(false);

    const nome = user?.nome?.trim() || 'Usuário';
    const inicial = nome.charAt(0).toUpperCase();
    const confirmacaoOk = textoDigitado.trim().toUpperCase() === PALAVRA_CONFIRMACAO;

    const abrirWhatsApp = () => {
        Linking.openURL(WHATSAPP_URL).catch(() =>
            Alert.alert('Erro', 'Não foi possível iniciar o atendimento.')
        );
    };

    const sair = () => {
        Alert.alert('Encerrar sessão', 'Deseja realmente sair do aplicativo?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sair',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    router.replace('/login');
                },
            },
        ]);
    };

    const fecharModais = () => {
        if (excluindo || carregandoEmail || carregandoSenha) return;
        
        setModalDeletarVisivel(false);
        setTextoDigitado('');
        setErroExclusao('');

        setModalEmailVisivel(false);
        setSenhaAtual('');
        setNovoEmail('');

        setModalSenhaVisivel(false);
    };

    const handleAlterarEmail = async () => {
        if (!senhaAtual.trim() || !novoEmail.trim()) {
            Alert.alert('Atenção', 'Preencha sua senha atual e o novo e-mail.');
            return;
        }

        setCarregandoEmail(true);
        try {
            const userFirebase = auth.currentUser;
            if (!userFirebase || !userFirebase.email) throw new Error("Usuário não autenticado");

            const credential = EmailAuthProvider.credential(userFirebase.email, senhaAtual);
            await reauthenticateWithCredential(userFirebase, credential);
            await updateEmail(userFirebase, novoEmail.trim());

            const resposta = await fetch(`${API_URL}/usuarios/${user.id}/email`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true' 
                },
                body: JSON.stringify({ email: novoEmail.trim() })
            });

            if (!resposta.ok) {
                const erroData = await resposta.json();
                throw new Error(erroData.erro || "Falha ao sincronizar com o banco de dados");
            }
            
            Alert.alert('Sucesso', 'Seu e-mail foi atualizado com segurança.');
            fecharModais();
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                Alert.alert('Erro', 'A senha atual informada está incorreta.');
            } else if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Erro', 'Este e-mail já está em uso por outra conta.');
            } else {
                Alert.alert('Erro', error.message || 'Não foi possível alterar o e-mail.');
            }
        } finally {
            setCarregandoEmail(false);
        }
    };

    const handleRecuperarSenha = async () => {
        setCarregandoSenha(true);
        try {
            const userFirebase = auth.currentUser;
            if (!userFirebase || !userFirebase.email) {
                throw new Error("Nenhum usuário logado no momento.");
            }

            // Dispara o link automaticamente para o e-mail da conta ativa
            await sendPasswordResetEmail(auth, userFirebase.email);
            
            Alert.alert(
                'Link Enviado', 
                `Enviamos um link seguro de redefinição para o e-mail da sua conta (${userFirebase.email}). Verifique sua caixa de entrada.`
            );
            fecharModais();
        } catch (error: any) {
            console.error(error);
            Alert.alert('Erro', 'Ocorreu um erro ao enviar o link de recuperação.');
        } finally {
            setCarregandoSenha(false);
        }
    };

    const excluirConta = async () => {
        if (!confirmacaoOk || excluindo) return;

        setExcluindo(true);
        setErroExclusao('');
        try {
            const resposta = await fetch(`${API_URL}/usuarios/${user.id}`, { 
                method: 'DELETE',
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (!resposta.ok) throw new Error(`HTTP Erro: ${resposta.status}`);

            await signOut();
            fecharModais();
            router.replace('/login');
        } catch (error) {
            console.error(error);
            setErroExclusao('Serviço indisponível no momento. Tente novamente mais tarde.');
        } finally {
            setExcluindo(false);
        }
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
                <View style={[s.headerBanner, { paddingTop: insets.top + 60 }]} />

                <View style={s.profileHeader}>
                    <View style={s.avatarContainer}>
                        <Text style={s.avatarText}>{inicial}</Text>
                    </View>
                    <Text style={s.nome} numberOfLines={1}>{nome}</Text>
                    {user?.tipo ? (
                        <View style={s.badge}>
                            <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                            <Text style={s.badgeText}>{user.tipo}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={s.section}>
                    <Text style={s.sectionTitle}>CONFIGURAÇÕES</Text>
                    <View style={s.card}>
                        <Pressable style={s.menuItem} onPress={() => router.push('/gerenciar-enderecos')}>
                            <View style={s.menuIconWrapper}>
                                <Ionicons name="location-outline" size={20} color={colors.primary} />
                            </View>
                            <Text style={s.menuText}>Gerenciar Endereços</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </Pressable>
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={s.sectionTitle}>SEGURANÇA</Text>
                    <View style={s.card}>
                        <Pressable style={s.menuItem} onPress={() => setModalEmailVisivel(true)}>
                            <View style={s.menuIconWrapper}>
                                <Ionicons name="mail-outline" size={20} color={colors.textMain} />
                            </View>
                            <Text style={s.menuText}>Alterar E-mail</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </Pressable>

                        <View style={s.divider} />

                        <Pressable style={s.menuItem} onPress={() => setModalSenhaVisivel(true)}>
                            <View style={s.menuIconWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.textMain} />
                            </View>
                            <Text style={s.menuText}>Alterar Senha</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </Pressable>
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={s.sectionTitle}>SUPORTE</Text>
                    <View style={s.card}>
                        <Pressable style={s.menuItem} onPress={abrirWhatsApp}>
                            <View style={s.menuIconWrapper}>
                                <Ionicons name="headset-outline" size={20} color={colors.textMain} />
                            </View>
                            <Text style={s.menuText}>Central de Ajuda</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </Pressable>
                    </View>
                </View>

                <View style={s.actionContainer}>
                    <Pressable style={s.botaoSair} onPress={sair}>
                        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                        <Text style={s.textoBotaoSair}>Encerrar Sessão</Text>
                    </Pressable>

                    <Pressable style={s.botaoDeletar} onPress={() => setModalDeletarVisivel(true)}>
                        <Ionicons name="trash-outline" size={20} color={colors.white} />
                        <Text style={s.textoBotaoDeletar}>Excluir Minha Conta</Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* MODAL: ALTERAR E-MAIL */}
            <Modal animationType="fade" transparent visible={modalEmailVisivel} onRequestClose={fecharModais}>
                <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={s.modalContent}>
                        <Text style={s.modalTitulo}>Alterar E-mail</Text>
                        <Text style={s.modalTexto}>
                            Por segurança, informe sua senha atual e o novo endereço de e-mail.
                        </Text>

                        <TextInput
                            style={s.inputForm}
                            placeholder="Senha atual"
                            placeholderTextColor={colors.textMuted}
                            secureTextEntry
                            value={senhaAtual}
                            onChangeText={setSenhaAtual}
                            editable={!carregandoEmail}
                        />

                        <TextInput
                            style={s.inputForm}
                            placeholder="Novo e-mail"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={novoEmail}
                            onChangeText={setNovoEmail}
                            editable={!carregandoEmail}
                        />

                        <View style={s.modalBotoes}>
                            <Pressable style={[s.botaoModal, s.botaoCancelar]} onPress={fecharModais} disabled={carregandoEmail}>
                                <Text style={s.textoBotaoCancelar}>Cancelar</Text>
                            </Pressable>
                            <Pressable style={[s.botaoModal, s.botaoConfirmarPadrao]} onPress={handleAlterarEmail} disabled={carregandoEmail}>
                                {carregandoEmail ? <ActivityIndicator color={colors.white} /> : <Text style={s.textoBotaoConfirmarPadrao}>Atualizar</Text>}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* MODAL: REDEFINIR SENHA (Sem input livre, vai direto para o e-mail da conta logada) */}
            <Modal animationType="fade" transparent visible={modalSenhaVisivel} onRequestClose={fecharModais}>
                <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={s.modalContent}>
                        <Text style={s.modalTitulo}>Redefinir Senha</Text>
                        <Text style={s.modalTexto}>
                            Deseja receber um link de redefinição de senha no e-mail associado à sua conta atual?
                        </Text>

                        <View style={s.modalBotoes}>
                            <Pressable style={[s.botaoModal, s.botaoCancelar]} onPress={fecharModais} disabled={carregandoSenha}>
                                <Text style={s.textoBotaoCancelar}>Cancelar</Text>
                            </Pressable>
                            <Pressable style={[s.botaoModal, s.botaoConfirmarPadrao]} onPress={handleRecuperarSenha} disabled={carregandoSenha}>
                                {carregandoSenha ? <ActivityIndicator color={colors.white} /> : <Text style={s.textoBotaoConfirmarPadrao}>Enviar Link</Text>}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* MODAL: EXCLUIR CONTA */}
            <Modal animationType="fade" transparent visible={modalDeletarVisivel} onRequestClose={fecharModais}>
                <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={s.modalContent}>
                        <View style={s.modalIcon}>
                            <Ionicons name="alert-circle" size={40} color={colors.danger} />
                        </View>
                        <Text style={s.modalTitulo}>Aviso de Exclusão</Text>
                        <Text style={s.modalTexto}>
                            Esta operação não pode ser desfeita. Digite <Text style={{ fontWeight: 'bold', color: colors.textMain }}>{PALAVRA_CONFIRMACAO}</Text> para prosseguir.
                        </Text>

                        <TextInput
                            style={s.inputCodigo}
                            placeholder={PALAVRA_CONFIRMACAO}
                            placeholderTextColor={colors.textMuted}
                            value={textoDigitado}
                            onChangeText={(t) => {
                                setTextoDigitado(t);
                                if (erroExclusao) setErroExclusao('');
                            }}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            editable={!excluindo}
                        />
                        {erroExclusao ? <Text style={s.errorText}>{erroExclusao}</Text> : null}
                        <View style={s.modalBotoes}>
                            <Pressable style={[s.botaoModal, s.botaoCancelar]} onPress={fecharModais} disabled={excluindo}>
                                <Text style={s.textoBotaoCancelar}>Cancelar</Text>
                            </Pressable>
                            <Pressable style={[s.botaoModal, s.botaoConfirmarExclusao, (!confirmacaoOk || excluindo) && { opacity: 0.4 }]} onPress={excluirConta} disabled={!confirmacaoOk || excluindo}>
                                {excluindo ? <ActivityIndicator color={colors.white} /> : <Text style={s.textoBotaoConfirmarExclusao}>Excluir</Text>}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}