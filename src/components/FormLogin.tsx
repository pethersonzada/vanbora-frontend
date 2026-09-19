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
};

export function FormLogin({ email, setEmail, senha, setSenha, loading, onLogin }: Props) {
    return (
        <View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={senha}
                    onChangeText={setSenha}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Entrar</Text>}
            </TouchableOpacity>
        </View>
    );
}