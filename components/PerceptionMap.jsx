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

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const quadrant = getQuadrant(data.avgPriceScore, data.avgQualityScore);
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold text-gray-900">{data.name}</p>
        <p className="text-gray-600">{data.brandName}</p>
        <div className="mt-1 space-y-0.5">
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
  const { cx, cy, payload } = props;
  const quadrant = getQuadrant(payload.avgPriceScore, payload.avgQualityScore);
  const color = getQuadrantColor(quadrant);

  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.8} stroke="#fff" strokeWidth={2} />
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        fill="#374151"
        fontSize={11}
        fontWeight={500}
      >
        {payload.name.length > 18 ? payload.name.slice(0, 16) + "…" : payload.name}
      </text>
    </g>
  );
}

export default function PerceptionMap({ products }) {
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
      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        {["Premium", "Best Value", "Overpriced", "Budget"].map((q) => (
          <div key={q} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getQuadrantColor(q) }}
            />
            <span className="text-gray-700">{q}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 40, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            dataKey="avgPriceScore"
            name="Perceived Price"
            domain={[0, 10]}
            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            tick={{ fontSize: 12 }}
          >
            <Label
              value="Perceived Price →"
              offset={-10}
              position="insideBottom"
              style={{ fontSize: 13, fill: "#6b7280" }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="avgQualityScore"
            name="Perceived Quality"
            domain={[0, 10]}
            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            tick={{ fontSize: 12 }}
          >
            <Label
              value="Perceived Quality →"
              angle={-90}
              position="insideLeft"
              offset={10}
              style={{ fontSize: 13, fill: "#6b7280" }}
            />
          </YAxis>

          {/* Quadrant dividers */}
          <ReferenceLine x={5.5} stroke="#d1d5db" strokeDasharray="5 5" />
          <ReferenceLine y={5.5} stroke="#d1d5db" strokeDasharray="5 5" />

          <Tooltip content={<CustomTooltip />} />
          <Scatter
            data={data}
            shape={<CustomDot />}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Quadrant labels overlaid */}
      <div className="relative -mt-[480px] pointer-events-none h-[460px] mx-[60px]">
        <div className="absolute top-2 left-2 text-xs font-medium text-amber-500/50 uppercase tracking-wide">
          Budget
        </div>
        <div className="absolute top-2 right-2 text-xs font-medium text-red-500/50 uppercase tracking-wide">
          Overpriced
        </div>
        <div className="absolute bottom-8 left-2 text-xs font-medium text-emerald-500/50 uppercase tracking-wide">
          Best Value
        </div>
        <div className="absolute bottom-8 right-2 text-xs font-medium text-purple-500/50 uppercase tracking-wide">
          Premium
        </div>
      </div>
    </div>
  );
}
