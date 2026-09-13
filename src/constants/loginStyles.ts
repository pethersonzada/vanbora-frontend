import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const loginStyles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: colors.background 
    },
    content: { 
        padding: 30, 
        flexGrow: 1, 
        justifyContent: 'center' 
    },
    logoBox: { 
        width: 90, 
        height: 90, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 40, 
        alignSelf: 'center',
    },
    title: { 
        fontSize: 32, 
        fontWeight: '800', 
        color: colors.textMain, 
        marginBottom: 10, 
        textAlign: 'center' 
    },
    subtitle: { 
        fontSize: 16, 
        color: colors.textMuted, 
        marginBottom: 40, 
        lineHeight: 24, 
        textAlign: 'center' 
    },
    inputGroup: { 
        marginBottom: 20 
    },
    label: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: colors.textMuted, 
        textTransform: 'uppercase', 
        marginBottom: 8, 
        letterSpacing: 0.5 
    },
    input: { 
        backgroundColor: colors.white, 
        padding: 18, 
        borderRadius: 15, 
        fontSize: 16, 
        borderWidth: 1, 
        borderColor: colors.border, 
        color: colors.textMain 
    },
    button: { 
        backgroundColor: colors.primary, 
        padding: 18, 
        borderRadius: 15, 
        alignItems: 'center', 
        marginTop: 10 
    },
    buttonText: { 
        color: colors.white, 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    registerContainer: { 
        marginTop: 40, 
        alignItems: 'center' 
    },
    row: { 
        flexDirection: 'row', 
        marginTop: 8, 
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
        marginHorizontal: 5 
    }
});