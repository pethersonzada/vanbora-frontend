import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { loginStyles as styles } from '../constants/loginStyles';

type Props = {
    email: string;
    setEmail: (v: string) => void;
    senha: string;
    setSenha: (v: string) => void;
    loading: boolean;
    onLogin: () => void;
    onEsqueciSenha: () => void;
    carregandoSenha: boolean;
};

export function FormLogin({ email, setEmail, senha, setSenha, loading, onLogin, onEsqueciSenha, carregandoSenha }: Props) {
    const [focado, setFocado] = useState<'email' | 'senha' | null>(null);

    return (
        <View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                    style={[styles.input, focado === 'email' && styles.inputFocused]}
                    placeholder="seu@email.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    selectionColor={colors.primary}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocado('email')}
                    onBlur={() => setFocado(null)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                    style={[styles.input, focado === 'senha' && styles.inputFocused]}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    selectionColor={colors.primary}
                    value={senha}
                    onChangeText={setSenha}
                    onFocus={() => setFocado('senha')}
                    onBlur={() => setFocado(null)}
                />
            </View>

            <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={onEsqueciSenha}
                disabled={carregandoSenha}
                activeOpacity={0.6}
            >
                <Text style={styles.forgotPasswordText}>
                    {carregandoSenha ? "Enviando..." : "Esqueceu a senha?"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, (loading || carregandoSenha) && { opacity: 0.7 }]}
                onPress={onLogin}
                disabled={loading || carregandoSenha}
                activeOpacity={0.85}
            >
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Entrar</Text>}
            </TouchableOpacity>
        </View>
    );
}