import { useMemo, useState } from "react";
import type { CalculatorInputs, CalculatorResults } from "./calculations";
import { formatCurrency, formatNumber, formatPercent } from "./format";

interface ReportProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

function BarChart({
  data,
  label,
  color,
}: {
  data: { label: string; value: number }[];
  label: string;
  color: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) return null;
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const barHeight = 24;
  const gap = 6;
  const labelWidth = 50;
  const chartWidth = 320;
  const svgHeight = data.length * (barHeight + gap) + 28;

  return (
    <div className="mb-6">
      <h4
        className="text-xs font-semibold mb-2"
        style={{ color: "var(--text-secondary, #666)" }}
      >
        {label}
      </h4>
      <svg
        width="100%"
        viewBox={`0 0 ${labelWidth + chartWidth + 120} ${svgHeight}`}
        style={{ maxWidth: 520 }}
        onPointerMove={(e) => {
          const svg = e.currentTarget;
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
          const idx = Math.floor(svgPt.y / (barHeight + gap));
          setHovered(idx >= 0 && idx < data.length ? idx : null);
        }}
        onPointerLeave={() => setHovered(null)}
      >
        <title>{label}</title>
        {data.map((d, i) => {
          const y = i * (barHeight + gap);
          const barW = (Math.abs(d.value) / maxAbs) * chartWidth;
          const isNeg = d.value < 0;
          const fillColor = isNeg ? "#dc2626" : color;
          const isHovered = hovered === i;
          return (
            <g key={d.label}>
              <text
                x={labelWidth - 6}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--text-secondary, #888)"
              >
                {d.label}
              </text>
              <rect
                x={labelWidth}
                y={y}
                width={Math.max(barW, 2)}
                height={barHeight}
                rx={4}
                fill={fillColor}
                opacity={isHovered ? 1 : 0.8}
              />
              <text
                x={labelWidth + barW + 6}
                y={y + barHeight / 2 + 4}
                fontSize={11}
                fontWeight={isHovered ? 700 : 400}
                fill={isNeg ? "#dc2626" : "var(--text-primary, #333)"}
              >
                {formatCurrency(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChart({
  series,
  labels,
  title,
}: {
  series: { name: string; data: number[]; color: string }[];
  labels: string[];
  title: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (labels.length === 0) return null;
  const allValues = series.flatMap((s) => s.data);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);

  const minVal = Math.min(dataMin, 0);
  const maxVal = Math.max(dataMax, 0);
  const range = maxVal - minVal || 1;

  const padLeft = 80;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const chartW = 400;
  const chartH = 180;
  const svgW = padLeft + chartW + padRight;
  const svgH = padTop + chartH + padBottom;

  const xStep = labels.length > 1 ? chartW / (labels.length - 1) : 0;

  const toY = (v: number) => padTop + chartH - ((v - minVal) / range) * chartH;
  const toX = (i: number) => padLeft + i * xStep;

  const gridLines = 4;
  const gridValues = Array.from(
    { length: gridLines + 1 },
    (_, i) => minVal + (range / gridLines) * i,
  );

  const hasZeroLine =
    minVal < 0 && maxVal > 0 && !gridValues.some((v) => Math.abs(v) < 0.01);

  return (
    <div className="mb-6">
      <h4
        className="text-xs font-semibold mb-2"
        style={{ color: "var(--text-secondary, #666)" }}
      >
        {title}
      </h4>
      <svg
        width="100%"
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ maxWidth: 540 }}
        onPointerMove={(e) => {
          const svg = e.currentTarget;
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
          if (labels.length <= 1) {
            setHovered(
              svgPt.x >= padLeft && svgPt.x <= padLeft + chartW ? 0 : null,
            );
            return;
          }
          const idx = Math.round((svgPt.x - padLeft) / xStep);
          setHovered(idx >= 0 && idx < labels.length ? idx : null);
        }}
        onPointerLeave={() => setHovered(null)}
      >
        <title>{title}</title>
        {gridValues.map((v) => (
          <g key={v}>
            <line
              x1={padLeft}
              y1={toY(v)}
              x2={padLeft + chartW}
              y2={toY(v)}
              stroke="var(--border, #e0e0e0)"
              strokeWidth={1}
            />
            <text
              x={padLeft - 8}
              y={toY(v) + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--text-secondary, #888)"
            >
              ${formatNumber(v)}
            </text>
          </g>
        ))}

        {hasZeroLine && (
          <g>
            <line
              x1={padLeft}
              y1={toY(0)}
              x2={padLeft + chartW}
              y2={toY(0)}
              stroke="var(--text-secondary, #999)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={padLeft - 8}
              y={toY(0) + 4}
              textAnchor="end"
              fontSize={10}
              fontWeight={600}
              fill="var(--text-secondary, #666)"
            >
              $0
            </text>
          </g>
        )}

        {minVal <= 0 && maxVal >= 0 && !hasZeroLine && (
          <line
            x1={padLeft}
            y1={toY(0)}
            x2={padLeft + chartW}
            y2={toY(0)}
            stroke="var(--text-secondary, #999)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {labels.map((l, i) => (
          <text
            key={l}
            x={toX(i)}
            y={svgH - 6}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-secondary, #888)"
          >
            {l}
          </text>
        ))}

        {series.map((s) => {
          const points = s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
          return (
            <g key={s.name}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.data.map((v, i) => {
                const isNeg = v < 0;
                const pointColor = isNeg ? "#dc2626" : s.color;
                return (
                  <circle
                    key={`${s.name}-${labels[i]}`}
                    cx={toX(i)}
                    cy={toY(v)}
                    r={hovered === i ? 6 : 3.5}
                    fill={pointColor}
                    stroke={hovered === i ? "#fff" : "none"}
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          );
        })}

        {hovered !== null && (
          <line
            x1={toX(hovered)}
            y1={padTop}
            x2={toX(hovered)}
            y2={padTop + chartH}
            stroke="var(--text-secondary, #aaa)"
            strokeWidth={1}
            strokeDasharray="3 2"
            pointerEvents="none"
          />
        )}

        {hovered !== null && (
          <g pointerEvents="none">
            {(() => {
              const tooltipX = toX(hovered);
              const tooltipW = 130;
              const lineH = 16;
              const tooltipH = 6 + series.length * lineH + 6;
              const flipX = tooltipX + tooltipW + 10 > svgW;
              const tx = flipX ? tooltipX - tooltipW - 10 : tooltipX + 10;
              const ty = padTop + 4;
              return (
                <>
                  <rect
                    x={tx}
                    y={ty}
                    width={tooltipW}
                    height={tooltipH}
                    rx={6}
                    fill="var(--text-primary, #222)"
                    opacity={0.92}
                  />
                  <text
                    x={tx + 8}
                    y={ty + 16}
                    fontSize={10}
                    fontWeight={700}
                    fill="#fff"
                  >
                    {labels[hovered]}
                  </text>
                  {series.map((s, si) => {
                    const val = s.data[hovered];
                    const isNeg = val < 0;
                    return (
                      <text
                        key={s.name}
                        x={tx + 8}
                        y={ty + 16 + (si + 1) * lineH}
                        fontSize={10}
                        fill={isNeg ? "#fca5a5" : "#d1d5db"}
                      >
                        <tspan fill={s.color}>&#9679; </tspan>
                        {s.name}: {formatCurrency(val)}
                      </text>
                    );
                  })}
                </>
              );
            })()}
          </g>
        )}
      </svg>
      <div className="flex gap-4 mt-1 ml-20">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1 text-xs">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: s.color,
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--text-secondary, #666)" }}>
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Report({ inputs, results }: ReportProps) {
  const snapshots = results.yearSnapshots;
  const years = snapshots.map((s) => `Yr ${s.year}`);

  const cumulativeBySYear = useMemo(() => {
    let running = 0;
    return snapshots.map((s) => {
      running += s.cashFlow;
      return running;
    });
  }, [snapshots]);

  const propertyValues = useMemo(
    () =>
      snapshots.map(
        (s) =>
          inputs.purchasePrice * (1 + inputs.appreciationPct / 100) ** s.year,
      ),
    [snapshots, inputs.purchasePrice, inputs.appreciationPct],
  );

  if (snapshots.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-secondary, #888)" }}>
        Set a hold period of at least 1 year to see the report.
      </p>
    );
  }

  return (
    <div>
      <div
        className="grid gap-3 mb-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card, #f7f7f7)" }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-secondary, #888)" }}
          >
            Total Investment
          </p>
          <p className="text-xl font-bold">
            ${formatNumber(results.totalInvestment)}
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card, #f7f7f7)" }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-secondary, #888)" }}
          >
            Cash Invested
          </p>
          <p className="text-xl font-bold">
            ${formatNumber(results.cashInvested)}
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card, #f7f7f7)" }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-secondary, #888)" }}
          >
            Cap Rate
          </p>
          <p className="text-xl font-bold">
            {formatPercent(results.capRatePct)}
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card, #f7f7f7)" }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-secondary, #888)" }}
          >
            Total Profit ({inputs.holdYears}yr)
          </p>
          <p
            className="text-xl font-bold"
            style={{ color: results.totalProfit >= 0 ? "#16a34a" : "#dc2626" }}
          >
            {formatCurrency(results.totalProfit)}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-secondary, #999)" }}
          >
            {formatPercent(results.annualizedReturnPct)} annualized
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        <div>
          <LineChart
            title="Annual Cash Flow & NOI"
            labels={years}
            series={[
              {
                name: "NOI",
                data: snapshots.map((s) => s.noi),
                color: "#2563eb",
              },
              {
                name: "Cash Flow",
                data: snapshots.map((s) => s.cashFlow),
                color: "#16a34a",
              },
            ]}
          />
          <BarChart
            label="Cash Flow by Year"
            color="#16a34a"
            data={snapshots.map((s) => ({
              label: `Yr ${s.year}`,
              value: s.cashFlow,
            }))}
          />
        </div>
        <div>
          <LineChart
            title="Cumulative Cash Flow & Property Value"
            labels={years}
            series={[
              {
                name: "Property Value",
                data: propertyValues,
                color: "#7c3aed",
              },
              {
                name: "Cumulative CF",
                data: cumulativeBySYear,
                color: "#16a34a",
              },
            ]}
          />
          <BarChart
            label="Gross Income by Year"
            color="#2563eb"
            data={snapshots.map((s) => ({
              label: `Yr ${s.year}`,
              value: s.grossAnnual,
            }))}
          />
        </div>
      </div>

      <div className="mt-6">
        <h3
          className="text-sm font-semibold mb-3 pb-1 border-b"
          style={{
            color: "var(--text-primary, #333)",
            borderColor: "var(--border, #e5e5e5)",
          }}
        >
          Year-by-Year P&L
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full text-sm" style={{ minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border, #ddd)" }}>
                <th
                  className="text-left py-2 pr-3 font-semibold"
                  style={{ color: "var(--text-secondary, #666)" }}
                >
                  Year
                </th>
                <th
                  className="text-right py-2 px-3 font-semibold"
                  style={{ color: "var(--text-secondary, #666)" }}
                >
                  Gross Income
                </th>
                <th
                  className="text-right py-2 px-3 font-semibold"
                  style={{ color: "var(--text-secondary, #666)" }}
                >
                  Expenses
                </th>
                <th
                  className="text-right py-2 px-3 font-semibold"
                  style={{ color: "var(--text-secondary, #666)" }}
                >
                  NOI
                </th>
                {results.mortgageAnnual > 0 && (
                  <th
                    className="text-right py-2 px-3 font-semibold"
                    style={{ color: "var(--text-secondary, #666)" }}
                  >
                    Debt Service
                  </th>
                )}
                <th
                  className="text-right py-2 pl-3 font-semibold"
                  style={{ color: "var(--text-secondary, #666)" }}
                >
                  Cash Flow
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr
                  key={s.year}
                  style={{ borderBottom: "1px solid var(--border, #eee)" }}
                >
                  <td className="py-1.5 pr-3 font-medium">{s.year}</td>
                  <td className="py-1.5 px-3 text-right">
                    ${formatNumber(s.grossAnnual)}
                  </td>
                  <td
                    className="py-1.5 px-3 text-right"
                    style={{ color: "var(--text-secondary, #888)" }}
                  >
                    ${formatNumber(s.totalExpenses)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-medium">
                    ${formatNumber(s.noi)}
                  </td>
                  {results.mortgageAnnual > 0 && (
                    <td
                      className="py-1.5 px-3 text-right"
                      style={{ color: "var(--text-secondary, #888)" }}
                    >
                      ${formatNumber(s.mortgageAnnual)}
                    </td>
                  )}
                  <td
                    className="py-1.5 pl-3 text-right font-bold"
                    style={{ color: s.cashFlow >= 0 ? "#16a34a" : "#dc2626" }}
                  >
                    {formatCurrency(s.cashFlow)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border, #ddd)" }}>
                <td className="py-2 pr-3 font-bold">Total</td>
                <td className="py-2 px-3 text-right font-bold">
                  $
                  {formatNumber(
                    snapshots.reduce((a, s) => a + s.grossAnnual, 0),
                  )}
                </td>
                <td
                  className="py-2 px-3 text-right font-bold"
                  style={{ color: "var(--text-secondary, #888)" }}
                >
                  $
                  {formatNumber(
                    snapshots.reduce((a, s) => a + s.totalExpenses, 0),
                  )}
                </td>
                <td className="py-2 px-3 text-right font-bold">
                  ${formatNumber(snapshots.reduce((a, s) => a + s.noi, 0))}
                </td>
                {results.mortgageAnnual > 0 && (
                  <td
                    className="py-2 px-3 text-right font-bold"
                    style={{ color: "var(--text-secondary, #888)" }}
                  >
                    ${formatNumber(results.mortgageAnnual * inputs.holdYears)}
                  </td>
                )}
                <td
                  className="py-2 pl-3 text-right font-bold"
                  style={{
                    color:
                      results.cumulativeCashFlow >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {formatCurrency(results.cumulativeCashFlow)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
