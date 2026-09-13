import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
    id: string | null;
    nome: string;
    tipo: string;
    endereco: string;
};

type AuthContextData = {
    user: User;
    isLoading: boolean;
    signIn: (userData: User) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>({ id: null, nome: '', tipo: '', endereco: '' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            try {
                const keys = ['userId', 'userName', 'userTipo', 'userEndereco'];
                const result = await AsyncStorage.multiGet(keys);
                
                const storageData = Object.fromEntries(result);
                
                if (storageData.userId) {
                    setUser({
                        id: storageData.userId,
                        nome: storageData.userName || 'Usuário',
                        tipo: storageData.userTipo || 'PASSAGEIRO',
                        endereco: storageData.userEndereco || 'Endereço Pendente'
                    });
                }
            } catch (error) {
                console.error("Erro ao carregar dados do usuário", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadStorageData();
    }, []);

    const signIn = async (userData: User) => {
        setUser(userData);
        await AsyncStorage.multiSet([
            ['userId', String(userData.id)],
            ['userName', userData.nome],
            ['userTipo', userData.tipo],
            ['userEndereco', userData.endereco]
        ]);
    };

    const signOut = async () => {
        setUser({ id: null, nome: '', tipo: '', endereco: '' });
        await AsyncStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthLayout() {
    return null;
}