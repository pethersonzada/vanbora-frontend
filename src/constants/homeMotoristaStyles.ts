import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const homeMotoristaStyles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: colors.backgroundAlt 
    },
    header: { 
        padding: 30, 
        backgroundColor: colors.white, 
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30 
    },
    welcome: { 
        fontSize: 28, 
        fontWeight: '800', 
        color: colors.textMain 
    },
    dateText: { 
        color: colors.textMuted, 
        fontSize: 12, 
        fontWeight: '600', 
        textTransform: 'uppercase', 
        marginBottom: 5 
    },
    scrollContent: { 
        padding: 20, 
        paddingBottom: 40 
    },
    bannerAtivo: { 
        flexDirection: 'row', 
        backgroundColor: colors.success, 
        padding: 20, 
        borderRadius: 15, 
        marginBottom: 20, 
        alignItems: 'center' 
    },
    bannerTitulo: { 
        color: colors.white, 
        fontWeight: 'bold', 
        fontSize: 16 
    },
    bannerSub: { 
        color: '#ecfdf5', 
        fontSize: 12, 
        marginTop: 4 
    },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 10 
    },
    sectionTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#334155' 
    },
    btnEditarTurma: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4, 
        backgroundColor: colors.primary, 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: '#bfdbfe' 
    },
    btnEditarTurmaText: { 
        fontSize: 12, 
        fontWeight: 'bold', 
        color: colors.white 
    },
    turmasScroll: { 
        marginBottom: 20 
    },
    turmaCard: { 
        backgroundColor: colors.white, 
        padding: 15, 
        borderRadius: 15, 
        marginRight: 12, 
        width: 140, 
        borderWidth: 1, 
        borderColor: colors.border, 
        justifyContent: 'center' 
    },
    turmaCardSelecionada: { 
        backgroundColor: colors.primary, 
        borderColor: colors.primaryDark 
    },
    turmaNome: { 
        fontWeight: 'bold', 
        color: colors.textMain, 
        marginTop: 8, 
        fontSize: 14 
    },
    turmaNomeSelecionada: { 
        color: colors.white 
    },
    turmaTurno: { 
        fontSize: 12, 
        color: colors.textMuted, 
        marginTop: 2 
    },
    turmaTurnoSelecionada: { 
        color: '#bfdbfe' 
    },
    statusBox: { 
        padding: 25, 
        borderRadius: 20, 
        alignItems: 'center', 
        marginBottom: 25 
    },
    statusTitle: { 
        color: colors.white, 
        fontSize: 20, 
        fontWeight: 'bold' 
    },
    statusSubtitle: { 
        color: colors.white, 
        opacity: 0.9, 
        marginTop: 5 
    },
    actionContainer: { 
        marginBottom: 10 
    },
    btnMotorista: { 
        padding: 18, 
        borderRadius: 15, 
        width: '48%', 
        alignItems: 'center', 
        marginBottom: 15, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        gap: 8 
    },
    btnText: { 
        color: colors.white, 
        fontWeight: 'bold' 
    },
    infoRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 15, 
        marginTop: 15 
    },
    infoLabel: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#334155' 
    },
    btnAdd: { 
        backgroundColor: '#eff6ff', 
        padding: 8, 
        borderRadius: 10, 
        borderWidth: 1, 
        borderColor: '#bfdbfe' 
    },
    cardList: { 
        backgroundColor: colors.white, 
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 20 
    },
    listItem: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: colors.backgroundAlt 
    },
    nameText: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#334155' 
    },
    subText: { 
        fontSize: 12, 
        color: colors.textMuted 
    },
    badge: { 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 10 
    },
    emptyText: { 
        textAlign: 'center', 
        color: colors.textMuted, 
        fontStyle: 'italic', 
        paddingVertical: 15 
    }
});