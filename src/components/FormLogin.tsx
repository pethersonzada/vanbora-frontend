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
    return (
        <View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="seu@email.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={senha}
                    onChangeText={setSenha}
                />
            </View>

            <TouchableOpacity 
                style={styles.forgotPasswordContainer} 
                onPress={onEsqueciSenha}
                disabled={carregandoSenha}
            >
                <Text style={styles.forgotPasswordText}>
                    {carregandoSenha ? "Enviando..." : "Esqueceu a senha?"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading || carregandoSenha}>
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>
        </View>
    );
}