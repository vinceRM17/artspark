import Svg, { Path, Circle } from 'react-native-svg';
import { View } from 'react-native';

type VineDividerProps = {
  width?: number;
  color?: string;
  opacity?: number;
};

/**
 * Decorative vine divider SVG
 * A horizontal vine with small leaves, used as a section separator
 */
export default function VineDivider({
  width = 200,
  color = '#7C9A72',
  opacity = 0.2,
}: VineDividerProps) {
  const height = 30;
  return (
    <View style={{ width, height, alignSelf: 'center' }}>
      <Svg width={width} height={height} viewBox="0 0 200 30">
        {/* Main vine curve */}
        <Path
          d="M10 15 Q50 5, 100 15 Q150 25, 190 15"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          opacity={opacity}
        />
        {/* Small leaves along the vine */}
        <Path
          d="M40 10 Q45 4, 50 8 Q45 12, 40 10Z"
          fill={color}
          opacity={opacity * 1.5}
        />
        <Path
          d="M90 16 Q95 10, 100 14 Q95 18, 90 16Z"
          fill={color}
          opacity={opacity * 1.5}
        />
        <Path
          d="M140 18 Q145 12, 150 16 Q145 20, 140 18Z"
          fill={color}
          opacity={opacity * 1.5}
        />
        {/* Small dots / berries */}
        <Circle cx="65" cy="8" r="2" fill={color} opacity={opacity} />
        <Circle cx="120" cy="20" r="2" fill={color} opacity={opacity} />
        <Circle cx="170" cy="12" r="2" fill={color} opacity={opacity} />
      </Svg>
    </View>
  );
}
