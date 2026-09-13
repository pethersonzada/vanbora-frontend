import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/config';
import { colors } from '../constants/colors';
import { homeMotoristaStyles as styles } from '../constants/homeMotoristaStyles';

export default function EntrarTurma() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [codigo, setCodigo] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSolicitarEntrada = async () => {
        if (!codigo.trim()) {
            Alert.alert("Atenção", "Digite o código de convite enviado pelo motorista.");
            return;
        }

        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                Alert.alert("Erro", "Usuário não identificado. Faça login novamente.");
                return;
            }

            const res = await fetch(`${API_URL}/turmas/entrar/${userId}?codigo=${codigo.toUpperCase().trim()}`, {
                method: 'POST',
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });

            const textResponse = await res.text();

            if (res.ok) {
                Alert.alert("Sucesso", "Solicitação enviada! Aguarde a aprovação do motorista.", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                Alert.alert("Erro", textResponse || "Não foi possível entrar na turma.");
            }
        } catch (e) {
            Alert.alert("Erro", "Falha de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 15, marginBottom: 30 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                    <Ionicons name="arrow-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textMain }}>Entrar em uma Turma</Text>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 30 }}>
                <Ionicons name="key-outline" size={64} color={colors.primary} />
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 15, fontSize: 15, paddingHorizontal: 10 }}>
                    Digite o código de convite de 6 caracteres fornecido pelo motorista da sua van para solicitar sua entrada na rota.
                </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textMain, marginBottom: 8, fontWeight: 'bold' }}>Código de Convite</Text>
                <TextInput
                    style={{ 
                        backgroundColor: colors.backgroundAlt, 
                        borderWidth: 1, 
                        borderColor: colors.border, 
                        borderRadius: 12, 
                        padding: 15, 
                        color: colors.textMain, 
                        fontSize: 18,
                        textAlign: 'center',
                        letterSpacing: 3,
                        fontWeight: 'bold'
                    }}
                    placeholder="EX: A1B2C3"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    maxLength={6}
                    value={codigo}
                    onChangeText={setCodigo}
                />
            </View>

            <TouchableOpacity 
                style={{ 
                    backgroundColor: colors.primary, 
                    padding: 16, 
                    borderRadius: 12, 
                    alignItems: 'center',
                    marginTop: 10
                }} 
                onPress={handleSolicitarEntrada}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Enviar Solicitação</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}