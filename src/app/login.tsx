import { useRouter } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormLogin } from '../components/FormLogin';
import { API_URL } from '../config/config';
import { auth } from '../config/firebase';
import { loginStyles as styles } from '../constants/loginStyles';
import { useAuth } from './context/AuthContext';

export default function Login() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signIn } = useAuth(); 
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [carregandoSenha, setCarregandoSenha] = useState(false);

    async function handleLogin() {
        if (!email || !senha) {
            Alert.alert("Atenção", "Preencha o e-mail e a senha.");
            return;
        }

        setLoading(true);
        try {
            const emailFormatado = email.trim().toLowerCase();

            const userCredential = await signInWithEmailAndPassword(auth, emailFormatado, senha);
            const firebaseUid = userCredential.user.uid;

            const response = await fetch(`${API_URL}/usuarios/por-uid/${firebaseUid}`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true' 
                }
            });

            if (response.ok) {
                const data = await response.json();

                await signIn({
                    id: String(data.id),
                    nome: data.nome || 'Usuário',
                    tipo: data.tipo || 'PASSAGEIRO',
                    endereco: data.enderecoCompleto || 'Endereço Pendente'
                });
                
                router.replace('/(tabs)/home');
            } else {
                Alert.alert("Aviso", "Conta autenticada, mas o perfil não foi encontrado no banco de dados.");
            }
        } catch (error: any) {
            let mensagemErro = "E-mail ou senha incorretos.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                mensagemErro = "E-mail ou senha incorretos.";
            } else if (error.code === 'auth/invalid-email') {
                mensagemErro = "Formato de e-mail inválido.";
            }
            Alert.alert("Acesso Negado", mensagemErro);
        } finally {
            setLoading(false);
        }
    }

    async function handleEsqueciSenha() {
        if (!email.trim()) {
            Alert.alert("Atenção", "Informe seu e-mail no campo acima para recuperar a senha.");
            return;
        }

        setCarregandoSenha(true);
        try {
            const emailFormatado = email.trim().toLowerCase();
            await sendPasswordResetEmail(auth, emailFormatado);
            Alert.alert(
                "E-mail Enviado",
                `Enviamos as instruções de redefinição para ${emailFormatado}.`
            );
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                Alert.alert("Erro", "Não há conta cadastrada com este e-mail.");
            } else {
                Alert.alert("Erro", "Não foi possível enviar o e-mail de recuperação.");
            }
        } finally {
            setCarregandoSenha(false);
        }
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <ScrollView 
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 30 }]} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo Centralizada e Limpa */}
                <View style={styles.logoContainer}>
                    <Image source={require('../../assets/images/logo-app-sem-fundo-sem-titulo.png')} style={styles.logoImage}/>
                </View>

                <Text style={styles.title}>Bem-vindo de volta!</Text>
                <Text style={styles.subtitle}>Entre com seus dados para continuar.</Text>

                <FormLogin 
                    email={email} 
                    setEmail={setEmail} 
                    senha={senha} 
                    setSenha={setSenha} 
                    loading={loading} 
                    onLogin={handleLogin} 
                    onEsqueciSenha={handleEsqueciSenha}
                    carregandoSenha={carregandoSenha}
                />

                <View style={styles.registerContainer}>
                    <Text style={styles.text}>Ainda não tem conta?</Text>
                    <View style={styles.row}>
                        <Text style={styles.text}>Cadastre-se como</Text>
                        <TouchableOpacity onPress={() => router.push({ pathname: '/cadastro', params: { tipo: 'PASSAGEIRO' } })}>
                            <Text style={styles.linkText}>Passageiro</Text>
                        </TouchableOpacity>
                        <Text style={styles.text}>ou</Text>
                        <TouchableOpacity onPress={() => router.push({ pathname: '/cadastro', params: { tipo: 'MOTORISTA' } })}>
                            <Text style={styles.linkText}>Motorista</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}