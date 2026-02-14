import Svg, { Path, G } from 'react-native-svg';
import { View } from 'react-native';

type FloatingLeavesProps = {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
};

/**
 * Scattered floating leaves background decoration
 * Used as a subtle background pattern for onboarding and empty states
 */
export default function FloatingLeaves({
  width = 300,
  height = 400,
  color = '#7C9A72',
  opacity = 0.06,
}: FloatingLeavesProps) {
  return (
    <View style={{ position: 'absolute', width, height, top: 0, left: 0 }} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 300 400">
        <G opacity={opacity}>
          {/* Leaf 1 - top right */}
          <G transform="translate(220, 30) rotate(25)">
            <Path d="M0 0 Q15 -15, 30 0 Q15 15, 0 0Z" fill={color} />
            <Path d="M3 0 L27 0" stroke={color} strokeWidth="0.8" fill="none" />
          </G>

          {/* Leaf 2 - left side */}
          <G transform="translate(40, 120) rotate(-15)">
            <Path d="M0 0 Q12 -12, 24 0 Q12 12, 0 0Z" fill={color} />
            <Path d="M3 0 L21 0" stroke={color} strokeWidth="0.8" fill="none" />
          </G>

          {/* Leaf 3 - center right */}
          <G transform="translate(250, 180) rotate(45)">
            <Path d="M0 0 Q10 -10, 20 0 Q10 10, 0 0Z" fill={color} />
            <Path d="M2 0 L18 0" stroke={color} strokeWidth="0.6" fill="none" />
          </G>

          {/* Leaf 4 - left center */}
          <G transform="translate(20, 260) rotate(-30)">
            <Path d="M0 0 Q18 -18, 36 0 Q18 18, 0 0Z" fill={color} />
            <Path d="M4 0 L32 0" stroke={color} strokeWidth="1" fill="none" />
          </G>

          {/* Leaf 5 - bottom right */}
          <G transform="translate(200, 320) rotate(60)">
            <Path d="M0 0 Q14 -14, 28 0 Q14 14, 0 0Z" fill={color} />
            <Path d="M3 0 L25 0" stroke={color} strokeWidth="0.8" fill="none" />
          </G>

          {/* Leaf 6 - top left */}
          <G transform="translate(80, 60) rotate(10)">
            <Path d="M0 0 Q8 -8, 16 0 Q8 8, 0 0Z" fill={color} />
          </G>

          {/* Leaf 7 - bottom center */}
          <G transform="translate(130, 370) rotate(-45)">
            <Path d="M0 0 Q12 -12, 24 0 Q12 12, 0 0Z" fill={color} />
            <Path d="M3 0 L21 0" stroke={color} strokeWidth="0.8" fill="none" />
          </G>

          {/* Small dots / spores scattered */}
          <Path d="M160 80 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0" fill={color} />
          <Path d="M280 250 m-1.5,0 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0" fill={color} />
          <Path d="M50 350 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0" fill={color} />
          <Path d="M240 100 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0" fill={color} />
        </G>
      </Svg>
    </View>
  );
}
