import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const cadastroEnderecoStyles = StyleSheet.create({
    center: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    container: { 
        flex: 1, 
        backgroundColor: colors.backgroundAlt || '#F4F5F7' 
    },
    headerOverlay: {
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0,
        flexDirection: 'row', 
        alignItems: 'center',
        paddingHorizontal: 20, 
        paddingBottom: 15,
        backgroundColor: colors.white, 
        zIndex: 10,
        borderBottomWidth: 1, 
        borderBottomColor: colors.border || '#E2E8F0'
    },
    backButton: { 
        marginRight: 15 
    },
    headerText: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: colors.textMain 
    },
    mapContainer: { 
        flex: 1 
    },
    footer: {
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0,
        backgroundColor: colors.white, 
        padding: 20,
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24,
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 10, 
        elevation: 10,
    },
    enderecoLabel: { 
        fontSize: 13, 
        color: colors.textMuted, 
        marginBottom: 4, 
        fontWeight: '600' 
    },
    enderecoText: { 
        fontSize: 16, 
        color: colors.textMain, 
        fontWeight: '700', 
        marginBottom: 20 
    },
    button: {
        backgroundColor: colors.primary, 
        paddingVertical: 16,
        borderRadius: 12, 
        alignItems: 'center'
    },
    buttonText: { 
        color: colors.white, 
        fontSize: 16, 
        fontWeight: 'bold' 
    },

    // Estilos do Modal de Nomeação do Endereço
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    modalTitulo: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textMain,
    },
    modalTexto: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 20,
        lineHeight: 20,
    },
    inputNome: {
        width: '100%',
        backgroundColor: colors.backgroundAlt || '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.textMain,
        marginBottom: 24,
    },
    modalBotoes: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    botaoModal: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoCancelar: {
        backgroundColor: colors.backgroundAlt || '#F8FAFC',
    },
    textoBotaoCancelar: {
        color: colors.textMain,
        fontSize: 15,
        fontWeight: '600',
    },
    botaoConfirmar: {
        backgroundColor: colors.primary,
    },
    textoBotaoConfirmar: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    }
});