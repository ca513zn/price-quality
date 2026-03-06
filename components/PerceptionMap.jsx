"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import { getQuadrantColor, getQuadrant } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const quadrant = getQuadrant(data.avgPriceScore, data.avgQualityScore);
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold text-gray-900 dark:text-gray-100">{data.name}</p>
        <p className="text-gray-600 dark:text-gray-400">{data.brandName}</p>
        <div className="mt-1 space-y-0.5 text-gray-700 dark:text-gray-300">
          <p>
            Price: <span className="font-medium">{data.avgPriceScore.toFixed(1)}</span>/10
          </p>
          <p>
            Quality: <span className="font-medium">{data.avgQualityScore.toFixed(1)}</span>/10
          </p>
          <p>
            Votes: <span className="font-medium">{data.totalVotes}</span>
          </p>
          <p className="mt-1">
            Quadrant:{" "}
            <span
              className="font-semibold"
              style={{ color: getQuadrantColor(quadrant) }}
            >
              {quadrant}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function CustomDot(props) {
  const { cx, cy, payload, labelColor = "#374151", strokeColor = "#fff", showLabels = true } = props;
  const quadrant = getQuadrant(payload.avgPriceScore, payload.avgQualityScore);
  const color = getQuadrantColor(quadrant);

  // Scale dot size: more votes = slightly larger dot
  const minR = 6;
  const maxR = 12;
  const votes = payload.totalVotes || 0;
  const r = Math.min(maxR, minR + Math.log2(Math.max(1, votes)) * 0.8);

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.85} stroke={strokeColor} strokeWidth={1.5} />
      {showLabels && (
        <text
          x={cx}
          y={cy - r - 4}
          textAnchor="middle"
          fill={labelColor}
          fontSize={11}
          fontWeight={500}
        >
          {payload.name.length > 18 ? payload.name.slice(0, 16) + "…" : payload.name}
        </text>
      )}
    </g>
  );
}

export default function PerceptionMap({ products, showLabels = true }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const refLineColor = isDark ? "#4b5563" : "#d1d5db";
  const tickColor = isDark ? "#9ca3af" : undefined;
  const labelColor = isDark ? "#9ca3af" : "#6b7280";
  const dotLabelColor = isDark ? "#d1d5db" : "#374151";
  const dotStroke = isDark ? "#1f2937" : "#fff";

  const data = products.map((p) => ({
    name: p.name,
    brandName: p.brand?.name || p.brandName || "",
    avgPriceScore: p.avgPriceScore,
    avgQualityScore: p.avgQualityScore,
    totalVotes: p.totalVotes,
    slug: p.slug,
  }));

  return (
    <div className="w-full">
      {/* Quadrant legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 justify-center">
        {["Premium", "Best Value", "Overpriced", "Budget"].map((q) => (
          <div key={q} className="flex items-center gap-1.5 text-xs sm:text-sm">
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
              style={{ backgroundColor: getQuadrantColor(q) }}
            />
            <span className="text-gray-700 dark:text-gray-300">{q}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="h-[320px] sm:h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              type="number"
              dataKey="avgPriceScore"
              name="Perceived Price"
              domain={[0, 10]}
              ticks={[0, 2, 4, 5, 6, 8, 10]}
              tick={{ fontSize: 11, fill: tickColor }}
              stroke={gridColor}
            >
              <Label
                value="Perceived Price →"
                offset={-10}
                position="insideBottom"
                style={{ fontSize: 12, fill: labelColor }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="avgQualityScore"
              name="Perceived Quality"
              domain={[0, 10]}
              ticks={[0, 2, 4, 5, 6, 8, 10]}
              tick={{ fontSize: 11, fill: tickColor }}
              stroke={gridColor}
              width={30}
            >
              <Label
                value="Quality →"
                angle={-90}
                position="insideLeft"
                offset={5}
                style={{ fontSize: 12, fill: labelColor }}
              />
            </YAxis>

            {/* Quadrant dividers */}
            <ReferenceLine x={5} stroke={refLineColor} strokeDasharray="5 5" />
            <ReferenceLine y={5} stroke={refLineColor} strokeDasharray="5 5" />

            <Tooltip content={<CustomTooltip />} animationDuration={0} />
            <Scatter
              data={data}
              shape={(props) => (
                <CustomDot
                  {...props}
                  labelColor={dotLabelColor}
                  strokeColor={dotStroke}
                  showLabels={showLabels}
                />
              )}
            />
          </ScatterChart>
        </ResponsiveContainer>
        </div>

        {/* Quadrant labels overlaid — positioned absolutely within the chart area */}
        <div className="absolute inset-0 pointer-events-none" style={{ left: 40, right: 20, top: 20, bottom: 30 }}>
          <div className="absolute top-1 left-1 text-[10px] sm:text-xs font-medium text-amber-500/40 uppercase tracking-wide">
            Budget
          </div>
          <div className="absolute top-1 right-1 text-[10px] sm:text-xs font-medium text-red-500/40 uppercase tracking-wide">
            Overpriced
          </div>
          <div className="absolute bottom-1 left-1 text-[10px] sm:text-xs font-medium text-emerald-500/40 uppercase tracking-wide">
            Best Value
          </div>
          <div className="absolute bottom-1 right-1 text-[10px] sm:text-xs font-medium text-purple-500/40 uppercase tracking-wide">
            Premium
          </div>
        </div>
      </div>
    </div>
  );
}
