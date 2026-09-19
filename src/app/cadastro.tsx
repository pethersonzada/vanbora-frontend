import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/config';
import { auth } from '../config/firebase';
import { cadastroStyles as styles } from '../constants/cadastroStyles';
import { colors } from '../constants/colors';

export default function Signup() {
    const { tipo } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmaSenha, setConfirmaSenha] = useState('');
    const [telefone, setTelefone] = useState('');
    const [codigoAcesso, setCodigoAcesso] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSenha, setShowSenha] = useState(false);
    const [showConfirmaSenha, setShowConfirmaSenha] = useState(false);

    const tipoUsuario = (tipo as string) || 'PASSAGEIRO';

    async function handleCadastro() {
        if (!nome || !email || !senha || !confirmaSenha || !telefone) {
            Alert.alert("Atenção", "Preencha todos os campos.");
            return;
        }

        if (tipoUsuario === 'MOTORISTA' && codigoAcesso !== 'ROTA2026') {
            Alert.alert("Acesso Restrito", "Código de motorista inválido.");
            return;
        }

        if (senha !== confirmaSenha) {
            Alert.alert("Erro", "As senhas não coincidem.");
            return;
        }

        setLoading(true);
        try {
            const emailFormatado = email.trim().toLowerCase();

            // 1. Cria a conta no Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, emailFormatado, senha);
            const firebaseUid = userCredential.user.uid;

            // 2. Dispara o e-mail de verificação oficial do Firebase
            await sendEmailVerification(userCredential.user);

            // 3. Envia os dados para o backend PostgreSQL incluindo o firebaseUid
            const response = await fetch(`${API_URL}/usuarios/cadastrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify({ 
                    nome, 
                    email: emailFormatado, 
                    firebaseUid, 
                    telefone: telefone.replace(/\D/g, ''), 
                    tipo: tipoUsuario, 
                    enderecoCompleto: 'Endereço Pendente', 
                    latitude: 0.0, 
                    longitude: 0.0 
                })
            });

            if (response.ok) {
                Alert.alert(
                    "Conta Criada!", 
                    "Enviamos um e-mail de confirmação para a sua caixa de entrada. Por favor, verifique o seu e-mail antes de fazer o login."
                );
                router.replace('/login');
            } else {
                let mensagemErro = "Não foi possível salvar o utilizador no servidor.";
                try {
                    const errorData = await response.json();
                    if (errorData.message) mensagemErro = errorData.message;
                } catch (e) {}
                Alert.alert("Atenção", mensagemErro);
            }
        } catch (error: any) {
            let mensagemErro = "Não foi possível conectar ao servidor.";
            if (error.code === 'auth/email-already-in-use') {
                mensagemErro = "Este e-mail já está em uso no Firebase.";
            } else if (error.code === 'auth/invalid-email') {
                mensagemErro = "E-mail inválido.";
            } else if (error.code === 'auth/weak-password') {
                mensagemErro = "A senha deve ter pelo menos 6 caracteres.";
            }
            Alert.alert("Erro no Cadastro", mensagemErro);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
                <ScrollView 
                    contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]} 
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.textMain} />
                    </TouchableOpacity>

                    <Text style={styles.titulo}>Cadastro {tipoUsuario.charAt(0) + tipoUsuario.slice(1).toLowerCase()}</Text>
                    <Text style={styles.subtitulo}>Preencha seus dados para começar</Text>
                    
                    {tipoUsuario === 'MOTORISTA' && (
                        <View style={[styles.inputContainer, { borderColor: colors.primary, backgroundColor: colors.backgroundAlt }]}>
                            <Ionicons name="key-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                            <TextInput 
                                style={styles.inputComIcone} 
                                placeholder="Código de Autorização" 
                                placeholderTextColor={colors.textMuted}
                                onChangeText={setCodigoAcesso}
                                secureTextEntry
                                underlineColorAndroid="transparent"
                            />
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput 
                            style={styles.inputComIcone} 
                            placeholder="Nome Completo" 
                            placeholderTextColor={colors.textMuted} 
                            onChangeText={setNome} 
                            autoComplete="name"
                            textContentType="name"
                            autoCapitalize="words"
                            underlineColorAndroid="transparent"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput 
                            style={styles.inputComIcone} 
                            placeholder="E-mail" 
                            placeholderTextColor={colors.textMuted} 
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email} 
                            onChangeText={setEmail} 
                            autoComplete="email"
                            textContentType="emailAddress"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInputMask 
                            type={'cel-phone'} 
                            options={{ withDDD: true, dddMask: '(99) ' }} 
                            style={styles.inputComIcone} 
                            placeholderTextColor={colors.textMuted} 
                            placeholder="Telefone" 
                            keyboardType="numeric" 
                            value={telefone} 
                            onChangeText={setTelefone} 
                            autoComplete="tel"
                            textContentType="telephoneNumber"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput 
                            style={styles.inputComIcone} 
                            placeholder="Senha" 
                            placeholderTextColor={colors.textMuted} 
                            secureTextEntry={!showSenha} 
                            onChangeText={setSenha} 
                            autoComplete="new-password"
                            textContentType="newPassword"
                        />
                        <TouchableOpacity onPress={() => setShowSenha(!showSenha)} style={styles.eyeIcon}>
                            <Ionicons name={showSenha ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput 
                            style={styles.inputComIcone} 
                            placeholder="Confirmar Senha" 
                            placeholderTextColor={colors.textMuted} 
                            secureTextEntry={!showConfirmaSenha} 
                            onChangeText={setConfirmaSenha} 
                            autoComplete="new-password"
                            textContentType="newPassword"
                        />
                        <TouchableOpacity onPress={() => setShowConfirmaSenha(!showConfirmaSenha)} style={styles.eyeIcon}>
                            <Ionicons name={showConfirmaSenha ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                        <Text style={styles.infoText}>
                            O endereço será configurado posteriormente no seu perfil.
                        </Text>
                    </View>
                    
                    <TouchableOpacity style={styles.btnPrimary} onPress={handleCadastro} disabled={loading}>
                        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>CRIAR CONTA</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}