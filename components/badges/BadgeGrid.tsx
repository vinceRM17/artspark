/**
 * Responsive grid of badge cards
 */

import { View, Dimensions } from 'react-native';
import BadgeCard from './BadgeCard';
import type { EvaluatedBadge } from '@/lib/services/badges';

const { width: screenWidth } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 16;
const COLUMNS = 3;
const ITEM_WIDTH =
  (screenWidth - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

type BadgeGridProps = {
  badges: EvaluatedBadge[];
};

export default function BadgeGrid({ badges }: BadgeGridProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: GRID_PADDING,
        gap: GRID_GAP,
      }}
    >
      {badges.map((item, index) => (
        <View key={item.badge.id} style={{ width: ITEM_WIDTH }}>
          <BadgeCard
            badge={item.badge}
            unlocked={item.unlocked}
            index={index}
          />
        </View>
      ))}
    </View>
  );
}
