import Svg, { Path, G } from 'react-native-svg';
import { View } from 'react-native';

type LeafCornerProps = {
  size?: number;
  color?: string;
  opacity?: number;
  position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  style?: any;
};

/**
 * Decorative leaf cluster for card corners
 * A small branch with 2-3 leaves, positioned in a corner
 */
export default function LeafCorner({
  size = 60,
  color = '#7C9A72',
  opacity = 0.12,
  position = 'topRight',
  style,
}: LeafCornerProps) {
  const rotation =
    position === 'topLeft' ? 0
    : position === 'topRight' ? 90
    : position === 'bottomLeft' ? 270
    : 180;

  return (
    <View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          ...(position === 'topLeft' && { top: 0, left: 0 }),
          ...(position === 'topRight' && { top: 0, right: 0 }),
          ...(position === 'bottomLeft' && { bottom: 0, left: 0 }),
          ...(position === 'bottomRight' && { bottom: 0, right: 0 }),
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G opacity={opacity} transform={`rotate(${rotation}, 50, 50)`}>
          {/* Branch */}
          <Path
            d="M5 5 Q30 20, 45 45"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M5 5 Q20 30, 30 50"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
          {/* Leaf 1 - larger */}
          <Path
            d="M20 15 Q30 5, 40 15 Q30 25, 20 15Z"
            fill={color}
          />
          {/* Leaf 2 */}
          <Path
            d="M10 25 Q20 18, 28 28 Q18 35, 10 25Z"
            fill={color}
          />
          {/* Leaf 3 - small */}
          <Path
            d="M30 35 Q38 28, 44 36 Q36 42, 30 35Z"
            fill={color}
          />
        </G>
      </Svg>
    </View>
  );
}
