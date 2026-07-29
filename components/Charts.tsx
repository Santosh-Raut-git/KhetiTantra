import { View, Text, Dimensions } from 'react-native';
import {
  PieChart,
  BarChart as GBarChart,
  LineChart as GLineChart,
} from 'react-native-gifted-charts';
export type ExpenseSlice = { category: string; amount: number; color: string; label: string; };
export type CropPnl = { crop: string; profit: number; };
export type MonthlyTrend = { month: string; income: number; expense: number; };

export function fmtINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}
export function fmtINRSigned(amount: number) {
  return `${amount >= 0 ? '+' : ''}₹${amount.toLocaleString('en-IN')}`;
}

const SCREEN_W = Dimensions.get('window').width;
const SCREENW_SAFE = Math.min(SCREEN_W - 80, 480);

const PIE_COLORS: Record<string, string> = {
  seed: '#2E7D32',
  fertiliser: '#8D6E63',
  pesticide: '#D32F2F',
  labour: '#F9A825',
  irrigation: '#0288D1',
  machinery: '#6A1B9A',
  transport: '#00838F',
  crop_sale: '#388E3C',
  subsidy: '#F57C00',
  other: '#757575',
};

export function DonutChart({ slices, total }: { slices: ExpenseSlice[]; total: number }) {
  const pieData = slices.map((s) => ({
    value: s.amount,
    color: PIE_COLORS[s.category] ?? s.color,
    label: s.label,
  }));

  return (
    <View className="flex-row items-center gap-4">
      <PieChart
        data={pieData}
        donut
        radius={70}
        innerRadius={48}
        innerCircleColor="#FFFFFF"
        centerLabelComponent={() => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 10, color: '#6D4C41' }}>
              Total
            </Text>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723' }}>
              {fmtINR(total)}
            </Text>
          </View>
        )}
        showText={false}
        focusOnPress
        backgroundColor="transparent"
      />
      <View className="flex-1 gap-2">
        {slices.slice(0, 5).map((s) => (
          <View key={s.category} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1">
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: PIE_COLORS[s.category] ?? s.color }} />
              <Text className="text-soil text-sm capitalize flex-1" style={{ fontFamily: 'Inter-Regular' }}>
                {s.label}
              </Text>
            </View>
            <Text className="text-soil-muted text-sm" style={{ fontFamily: 'Inter-Medium' }}>
              {fmtINR(s.amount)}
            </Text>
          </View>
        ))}
        {slices.length > 5 && (
          <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
            +{slices.length - 5} more categories
          </Text>
        )}
      </View>
    </View>
  );
}

export function BarChart({ data }: { data: CropPnl[] }) {
  return (
    <View>
      <GBarChart
        data={data.map((c) => ({
          value: Math.abs(c.profit),
          label: c.crop,
          frontColor: c.profit >= 0 ? '#2E7D32' : '#D32F2F',
          showValuesAsTopLabel: true,
          topLabelComponent: () => (
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: '#3E2723' }}>
              {fmtINRSigned(c.profit)}
            </Text>
          ),
        }))}
        barWidth={48}
        spacing={40}
        roundedTop
        roundedBottom
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisColor="#E7E5E0"
        yAxisTextStyle={{ fontFamily: 'Inter-Regular', fontSize: 10, color: '#6D4C41' }}
        xAxisLabelTextStyle={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#3E2723' }}
        rulesColor="#F0EEE8"
        rulesType="solid"
        width={SCREENW_SAFE}
        formatYLabel={(label: string) => {
          const n = parseInt(label, 10);
          if (n >= 1000) return `${n / 1000}k`;
          return label;
        }}
        height={220}
      />
      <View className="flex-row items-center gap-4 mt-3">
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded bg-leaf" />
          <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>Profit</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded bg-clay" />
          <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>Loss</Text>
        </View>
      </View>
    </View>
  );
}

export function LineChart({ data }: { data: MonthlyTrend[] }) {
  const incomeData = data.map((d) => ({
    value: d.income,
    dataPointText: fmtINR(d.income),
  }));
  const expenseData = data.map((d) => ({
    value: d.expense,
    dataPointText: fmtINR(d.expense),
  }));

  return (
    <GLineChart
      data={incomeData}
      data2={expenseData}
      color="#2E7D32"
      color2="#F9A825"
      thickness={3}
      thickness2={3}
      dataPointsColor="#2E7D32"
      dataPointsColor2="#F9A825"
      dataPointsShape="circle"
      dataPointsRadius={4}
      startFillColor="rgba(46,125,50,0.15)"
      endFillColor="rgba(46,125,50,0.02)"
      startFillColor2="rgba(249,168,37,0.12)"
      endFillColor2="rgba(249,168,37,0.02)"
      startOpacity={0.6}
      endOpacity={0.05}
      areaChart
      curved
      xAxisLabelTextStyle={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#3E2723' }}
      yAxisTextStyle={{ fontFamily: 'Inter-Regular', fontSize: 10, color: '#6D4C41' }}
      yAxisThickness={0}
      xAxisThickness={1}
      xAxisColor="#E7E5E0"
      rulesColor="#F0EEE8"
      rulesType="solid"
      spacing={56}
      height={240}
      formatYLabel={(label: string) => {
        const n = parseInt(label, 10);
        if (n >= 1000) return `${n / 1000}k`;
        return label;
      }}
      adjustToWidth
    />
  );
}
