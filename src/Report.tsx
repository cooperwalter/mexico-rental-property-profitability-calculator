import { useMemo } from "react";
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
  negativeColor,
}: {
  data: { label: string; value: number }[];
  label: string;
  color: string;
  negativeColor?: string;
}) {
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
        viewBox={`0 0 ${labelWidth + chartWidth + 100} ${svgHeight}`}
        style={{ maxWidth: 500 }}
      >
        <title>{label}</title>
        {data.map((d, i) => {
          const y = i * (barHeight + gap);
          const barW = (Math.abs(d.value) / maxAbs) * chartWidth;
          const isNeg = d.value < 0;
          const fillColor = isNeg ? (negativeColor ?? "#dc2626") : color;
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
                opacity={0.85}
              />
              <text
                x={labelWidth + barW + 6}
                y={y + barHeight / 2 + 4}
                fontSize={11}
                fill="var(--text-primary, #333)"
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
  if (labels.length === 0) return null;
  const allValues = series.flatMap((s) => s.data);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
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
              {s.data.map((v, i) => (
                <circle
                  key={`${s.name}-${labels[i]}`}
                  cx={toX(i)}
                  cy={toY(v)}
                  r={3.5}
                  fill={s.color}
                />
              ))}
            </g>
          );
        })}
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
