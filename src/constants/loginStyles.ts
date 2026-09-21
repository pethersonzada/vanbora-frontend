import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const loginStyles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: colors.primary, // Cor de fundo do topo baseada na primária do app
    },
    topHeader: {
        height: 240,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    headerLogo: {
        width: 90,
        height: 90,
        borderRadius: 20,
        marginBottom: 10,
    },
    contentCard: { 
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 28,
        paddingTop: 36,
        paddingBottom: 40,
        flexGrow: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    title: { 
        alignSelf: 'center',
        fontSize: 32, 
        fontWeight: '800', 
        color: colors.textMain, 
        marginBottom: 4, 
    },
    subtitle: { 
        alignSelf: 'center',
        fontSize: 15, 
        color: colors.textMuted, 
        marginBottom: 30, 
    },
    inputGroup: { 
        marginBottom: 16 
    },
    label: { 
        fontSize: 12, 
        fontWeight: '700', 
        color: colors.textMuted, 
        textTransform: 'uppercase', 
        marginBottom: 6, 
        letterSpacing: 0.5 
    },
    input: { 
        backgroundColor: '#F8FAFC', 
        padding: 16, 
        borderRadius: 16, 
        fontSize: 15, 
        borderWidth: 1, 
        borderColor: '#E2E8F0', 
        color: colors.textMain 
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginTop: 4,
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    button: { 
        backgroundColor: colors.primary, 
        padding: 18, 
        borderRadius: 16, 
        alignItems: 'center', 
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: { 
        color: colors.white, 
        fontSize: 16, 
        fontWeight: 'bold',
        letterSpacing: 0.5
    },
    registerContainer: { 
        marginTop: 32, 
        alignItems: 'center' 
    },
    row: { 
        flexDirection: 'row', 
        marginTop: 6, 
        alignItems: 'center' 
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