import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/config';
import { cadastroStyles as styles } from '../constants/cadastroStyles';
import { colors } from '../constants/colors';

export default function Signup() {
    const { tipo } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmaSenha, setConfirmaSenha] = useState('');
    const [telefone, setTelefone] = useState('');
    const [codigoAcesso, setCodigoAcesso] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSenha, setShowSenha] = useState(false);

    const tipoUsuario = (tipo as string) || 'PASSAGEIRO';

    async function handleCadastro() {
        if (!nome || !cpf || !senha || !confirmaSenha || !telefone) {
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
            const response = await fetch(`${API_URL}/usuarios/cadastrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify({ 
                    nome, 
                    cpf: cpf.replace(/\D/g, ''), 
                    senha, 
                    telefone: telefone.replace(/\D/g, ''), 
                    tipo: tipoUsuario, 
                    enderecoCompleto: 'Endereço Pendente', 
                    latitude: 0.0, 
                    longitude: 0.0 
                })
            });

            if (response.ok) {
                Alert.alert("Sucesso", "Conta criada com sucesso!");
                router.replace('/login');
            } else {
                Alert.alert("Erro", "Não foi possível realizar o cadastro.");
            }
        } catch (error) {
            Alert.alert("Erro de Conexão", "Verifique o servidor.");
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
                        <Ionicons name="card-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInputMask 
                            type={'cpf'} 
                            style={styles.inputComIcone} 
                            placeholder="CPF" 
                            placeholderTextColor={colors.textMuted} 
                            keyboardType="numeric" 
                            value={cpf} 
                            onChangeText={setCpf} 
                            autoComplete="username"
                            textContentType="username"
                            importantForAutofill="yes"
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
                            importantForAutofill="no"
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
                            importantForAutofill="yes"
                            underlineColorAndroid="transparent"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput 
                            style={styles.inputComIcone} 
                            placeholder="Confirmar Senha" 
                            placeholderTextColor={colors.textMuted} 
                            secureTextEntry={!showSenha} 
                            onChangeText={setConfirmaSenha} 
                            autoComplete="new-password"
                            textContentType="newPassword"
                            importantForAutofill="no"
                            underlineColorAndroid="transparent"
                        />
                        <TouchableOpacity onPress={() => setShowSenha(!showSenha)} style={styles.eyeIcon}>
                            <Ionicons name={showSenha ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
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