/**
 * GitHub-style calendar heatmap
 *
 * Shows last 90 days of activity as a 7-row x 13-column SVG grid.
 * Active days are sage green, inactive are light gray.
 */

import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useMemo } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 32; // left label space + right padding
const CELL_GAP = 3;
const ROWS = 7;
const COLS = 13;
const CELL_SIZE = Math.floor(
  (SCREEN_WIDTH - PADDING - 40 - CELL_GAP * (COLS - 1)) / COLS
);

const ACTIVE_COLOR = '#7C9A72';
const INACTIVE_COLOR = '#F3F4F6';

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type CalendarHeatmapProps = {
  activityDates: string[];
};

export default function CalendarHeatmap({ activityDates }: CalendarHeatmapProps) {
  const { grid, monthMarkers } = useMemo(() => {
    const today = new Date();
    const dateSet = new Set(activityDates);

    // Build grid: 13 columns x 7 rows, from 90 days ago to today
    // Each column is a week, rows are days of week (Sun=0..Sat=6)
    const totalDays = COLS * ROWS; // 91 days
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    // Adjust start to Sunday
    const startDow = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDow);

    const cells: { col: number; row: number; active: boolean; date: string }[] = [];
    const months: { col: number; label: string }[] = [];
    let lastMonth = -1;

    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + col * 7 + row);

        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const isFuture = d > today;

        cells.push({
          col,
          row,
          active: !isFuture && dateSet.has(dateKey),
          date: dateKey,
        });

        // Track month boundaries (first day of week)
        if (row === 0 && d.getMonth() !== lastMonth) {
          months.push({ col, label: MONTH_LABELS[d.getMonth()] });
          lastMonth = d.getMonth();
        }
      }
    }

    return { grid: cells, monthMarkers: months };
  }, [activityDates]);

  const svgWidth = COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const svgHeight = ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const activeDays = activityDates.length;

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
          Activity
        </Text>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
          {activeDays} active {activeDays === 1 ? 'day' : 'days'}
        </Text>
      </View>

      {/* Month labels */}
      <View style={{ flexDirection: 'row', marginLeft: 24, marginBottom: 4 }}>
        {monthMarkers.map((m, i) => (
          <Text
            key={i}
            style={{
              position: 'absolute',
              left: m.col * (CELL_SIZE + CELL_GAP),
              fontSize: 10,
              color: '#9CA3AF',
            }}
          >
            {m.label}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        {/* Day of week labels */}
        <View style={{ width: 20, marginRight: 4 }}>
          {DAY_LABELS.map((label, i) => (
            <View
              key={i}
              style={{
                height: CELL_SIZE + CELL_GAP,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9, color: '#9CA3AF' }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Grid */}
        <Svg width={svgWidth} height={svgHeight}>
          {grid.map((cell, i) => (
            <Rect
              key={i}
              x={cell.col * (CELL_SIZE + CELL_GAP)}
              y={cell.row * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={3}
              fill={cell.active ? ACTIVE_COLOR : INACTIVE_COLOR}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}
