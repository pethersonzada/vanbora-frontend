import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { homeMotoristaStyles as styles } from '../constants/homeMotoristaStyles';

type Props = {
    onPress: () => void;
};

export function BannerRotaAtiva({ onPress }: Props) {
    return (
        <TouchableOpacity style={styles.bannerAtivo} onPress={onPress}>
            <Ionicons name="map" size={28} color={colors.white} style={{ marginRight: 15 }} />
            <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitulo}>ROTA EM ANDAMENTO</Text>
                <Text style={styles.bannerSub}>Toque para voltar ao radar.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
    );
}