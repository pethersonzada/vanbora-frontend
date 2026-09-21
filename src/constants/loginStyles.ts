import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const loginStyles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: colors.background || '#F8FAFC', 
    },
    content: { 
        paddingHorizontal: 28, 
        flexGrow: 1, 
        justifyContent: 'center' 
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    title: { 
        fontSize: 28, 
        fontWeight: '800', 
        color: colors.textMain, 
        marginBottom: 6, 
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: { 
        fontSize: 15, 
        color: colors.textMuted, 
        marginBottom: 32, 
        textAlign: 'center',
        lineHeight: 22,
    },
    inputGroup: { 
        marginBottom: 18 
    },
    label: { 
        fontSize: 12, 
        fontWeight: '700', 
        color: colors.textMuted, 
        textTransform: 'uppercase', 
        marginBottom: 8, 
        letterSpacing: 0.5 
    },
    input: { 
        backgroundColor: colors.white, 
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 14, 
        fontSize: 15, 
        borderWidth: 1, 
        borderColor: '#E2E8F0', 
        color: colors.textMain 
    },
    // ADICIONE ESTA LINHA ABAIXO PARA CORRIGIR O ERRO:
    inputFocused: {
        borderColor: colors.primary,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginTop: 6,
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    button: { 
        backgroundColor: colors.primary, 
        paddingVertical: 18, 
        borderRadius: 14, 
        alignItems: 'center', 
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: { 
        color: colors.white, 
        fontSize: 16, 
        fontWeight: '700',
        letterSpacing: 0.3
    },
    registerContainer: { 
        marginTop: 36, 
        alignItems: 'center' 
    },
    row: { 
        flexDirection: 'row', 
        marginTop: 6, 
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    text: { 
        color: colors.textMuted, 
        fontSize: 14 
    },
    linkText: { 
        color: colors.primary, 
        fontWeight: "bold", 
        fontSize: 14, 
        marginHorizontal: 4 
    }
});