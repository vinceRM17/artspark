import Svg, { Path, G } from 'react-native-svg';
import { View } from 'react-native';

type LeafAccentProps = {
  size?: number;
  color?: string;
  opacity?: number;
  rotation?: number;
  style?: any;
};

/**
 * Decorative leaf accent SVG
 * A simple elegant leaf shape for corners and accents
 */
export default function LeafAccent({
  size = 40,
  color = '#7C9A72',
  opacity = 0.15,
  rotation = 0,
  style,
}: LeafAccentProps) {
  return (
    <View style={[{ width: size, height: size, transform: [{ rotate: `${rotation}deg` }] }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G opacity={opacity}>
          <Path
            d="M50 5 C20 25, 5 55, 15 85 C25 75, 35 60, 50 50 C65 60, 75 75, 85 85 C95 55, 80 25, 50 5Z"
            fill={color}
          />
          <Path
            d="M50 15 L50 75"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
            opacity={0.5}
          />
          <Path d="M50 35 L35 25" stroke={color} strokeWidth="1" fill="none" opacity={0.3} />
          <Path d="M50 35 L65 25" stroke={color} strokeWidth="1" fill="none" opacity={0.3} />
          <Path d="M50 50 L30 42" stroke={color} strokeWidth="1" fill="none" opacity={0.3} />
          <Path d="M50 50 L70 42" stroke={color} strokeWidth="1" fill="none" opacity={0.3} />
          <Path d="M50 65 L35 60" stroke={color} strokeWidth="1" fill="none" opacity={0.3} />
          <Path d="M50 65 L65 60" stroke={color} strokeWidth="1" fill="none" opacity={0.3} />
        </G>
      </Svg>
    </View>
  );
}
