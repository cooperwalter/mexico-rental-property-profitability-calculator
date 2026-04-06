import { useMemo, useState } from "react";
import type { CalculatorInputs, CalculatorResults } from "./calculations";
import { formatCurrency, formatNumber, formatPercent } from "./format";

interface ReportProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

const COLORS = {
  gain: "oklch(0.45 0.15 155)",
  loss: "oklch(0.50 0.18 25)",
  accent: "oklch(0.42 0.12 250)",
  highlight: "oklch(0.55 0.14 85)",
  ink: "oklch(0.22 0.02 55)",
  inkSoft: "oklch(0.45 0.015 55)",
  inkMuted: "oklch(0.60 0.01 55)",
  inkFaint: "oklch(0.75 0.008 55)",
  rule: "oklch(0.85 0.01 55)",
  paper: "oklch(0.97 0.005 75)",
};

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
  const barHeight = 22;
  const gap = 4;
  const labelWidth = 36;
  const chartWidth = 280;
  const svgHeight = data.length * (barHeight + gap) + 8;

  return (
    <div className="mb-8">
      <h4 className="text-[11px] tracking-[0.15em] uppercase text-ink-muted font-body font-semibold mb-3">
        {label}
      </h4>
      <svg
        width="100%"
        viewBox={`0 0 ${labelWidth + chartWidth + 110} ${svgHeight}`}
        style={{ maxWidth: 460 }}
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
          const fillColor = isNeg ? COLORS.loss : color;
          const isHov = hovered === i;
          return (
            <g key={d.label}>
              <text
                x={labelWidth - 4}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontSize={10}
                fontFamily="'DM Sans', system-ui"
                fill={COLORS.inkMuted}
              >
                {d.label}
              </text>
              <rect
                x={labelWidth}
                y={y + 1}
                width={Math.max(barW, 2)}
                height={barHeight - 2}
                rx={2}
                fill={fillColor}
                opacity={isHov ? 1 : 0.75}
              />
              <text
                x={labelWidth + barW + 6}
                y={y + barHeight / 2 + 4}
                fontSize={11}
                fontFamily="'DM Serif Display', Georgia"
                fontWeight={isHov ? 700 : 400}
                fill={isNeg ? COLORS.loss : COLORS.ink}
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

  const padLeft = 72;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const chartW = 360;
  const chartH = 160;
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

  const showZero = minVal < 0 && maxVal > 0;

  return (
    <div className="mb-8">
      <h4 className="text-[11px] tracking-[0.15em] uppercase text-ink-muted font-body font-semibold mb-3">
        {title}
      </h4>
      <svg
        width="100%"
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ maxWidth: 480 }}
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
              stroke={COLORS.rule}
              strokeWidth={0.5}
            />
            <text
              x={padLeft - 8}
              y={toY(v) + 3}
              textAnchor="end"
              fontSize={9}
              fontFamily="'DM Sans', system-ui"
              fill={COLORS.inkFaint}
            >
              {formatCurrency(v)}
            </text>
          </g>
        ))}

        {showZero && (
          <line
            x1={padLeft}
            y1={toY(0)}
            x2={padLeft + chartW}
            y2={toY(0)}
            stroke={COLORS.inkMuted}
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        )}

        {labels.map((l, i) => (
          <text
            key={l}
            x={toX(i)}
            y={svgH - 4}
            textAnchor="middle"
            fontSize={9}
            fontFamily="'DM Sans', system-ui"
            fill={COLORS.inkFaint}
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
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.data.map((v, i) => {
                const isNeg = v < 0;
                const pointColor = isNeg ? COLORS.loss : s.color;
                return (
                  <circle
                    key={`${s.name}-${labels[i]}`}
                    cx={toX(i)}
                    cy={toY(v)}
                    r={hovered === i ? 5 : 3}
                    fill={pointColor}
                    stroke={hovered === i ? COLORS.paper : "none"}
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
            stroke={COLORS.inkFaint}
            strokeWidth={0.5}
            strokeDasharray="2 2"
            pointerEvents="none"
          />
        )}

        {hovered !== null && (
          <g pointerEvents="none">
            {(() => {
              const tooltipX = toX(hovered);
              const tooltipW = 125;
              const lineH = 15;
              const tooltipH = 4 + series.length * lineH + 4;
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
                    rx={3}
                    fill={COLORS.ink}
                    opacity={0.94}
                  />
                  <text
                    x={tx + 7}
                    y={ty + 13}
                    fontSize={9}
                    fontWeight={700}
                    fontFamily="'DM Sans', system-ui"
                    fill={COLORS.paper}
                  >
                    {labels[hovered]}
                  </text>
                  {series.map((s, si) => {
                    const val = s.data[hovered];
                    const isNeg = val < 0;
                    return (
                      <text
                        key={s.name}
                        x={tx + 7}
                        y={ty + 13 + (si + 1) * lineH}
                        fontSize={9}
                        fontFamily="'DM Sans', system-ui"
                        fill={
                          isNeg ? "oklch(0.75 0.12 25)" : "oklch(0.82 0.01 55)"
                        }
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
      <div className="flex gap-4 mt-1.5 ml-[72px]">
        {series.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-1.5 text-[10px] font-body text-ink-muted"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: s.color }}
            />
            {s.name}
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
          results.appreciationBase *
          (1 + inputs.appreciationPct / 100) ** s.year,
      ),
    [snapshots, results.appreciationBase, inputs.appreciationPct],
  );

  if (snapshots.length === 0) {
    return (
      <p className="text-sm text-ink-muted font-body italic">
        Set a hold period of at least 1 year to see the report.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-10 sm:grid-cols-4">
        <div>
          <p className="text-[11px] tracking-wide uppercase text-ink-muted font-body mb-1">
            Total Investment
          </p>
          <p className="text-2xl font-display text-ink">
            ${formatNumber(results.totalInvestment)}
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-wide uppercase text-ink-muted font-body mb-1">
            Cash Invested
          </p>
          <p className="text-2xl font-display text-ink">
            ${formatNumber(results.cashInvested)}
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-wide uppercase text-ink-muted font-body mb-1">
            Cap Rate
          </p>
          <p className="text-2xl font-display text-ink">
            {formatPercent(results.capRatePct)}
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-wide uppercase text-ink-muted font-body mb-1">
            Total Profit ({inputs.holdYears}yr)
          </p>
          <p
            className={`text-2xl font-display ${results.totalProfit >= 0 ? "text-gain" : "text-loss"}`}
          >
            {formatCurrency(results.totalProfit)}
          </p>
          <p className="text-[11px] mt-0.5 text-ink-faint font-body">
            {formatPercent(results.annualizedReturnPct)} annualized
          </p>
        </div>
      </div>

      <div
        className="grid gap-x-12"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                color: COLORS.accent,
              },
              {
                name: "Cash Flow",
                data: snapshots.map((s) => s.cashFlow),
                color: COLORS.gain,
              },
            ]}
          />
          <BarChart
            label="Cash Flow by Year"
            color={COLORS.gain}
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
                color: COLORS.highlight,
              },
              {
                name: "Cumulative CF",
                data: cumulativeBySYear,
                color: COLORS.gain,
              },
            ]}
          />
          <BarChart
            label="Effective Income by Year"
            color={COLORS.accent}
            data={snapshots.map((s) => ({
              label: `Yr ${s.year}`,
              value: s.grossAnnual,
            }))}
          />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-ink-muted font-body font-semibold mb-4 pb-2 border-b border-rule">
          Year-by-Year P&L
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full text-sm font-body" style={{ minWidth: 560 }}>
            <thead>
              <tr className="border-b-2 border-rule">
                <th className="text-left py-2 pr-3 text-[11px] tracking-wide uppercase text-ink-muted font-semibold">
                  Year
                </th>
                <th className="text-right py-2 px-3 text-[11px] tracking-wide uppercase text-ink-muted font-semibold">
                  Effective Income
                </th>
                <th className="text-right py-2 px-3 text-[11px] tracking-wide uppercase text-ink-muted font-semibold">
                  Expenses
                </th>
                <th className="text-right py-2 px-3 text-[11px] tracking-wide uppercase text-ink-muted font-semibold">
                  NOI
                </th>
                {results.mortgageAnnual > 0 && (
                  <>
                    <th className="text-right py-2 px-3 text-[11px] tracking-wide uppercase text-ink-muted font-semibold">
                      Principal
                    </th>
                    <th className="text-right py-2 px-3 text-[11px] tracking-wide uppercase text-ink-muted font-semibold">
                      Interest
                    </th>
                    <th className="text-right py-2 px-3 text-[11px] tracking-wide uppercase text-ink-muted font-semibold">
                      Debt Service
                    </th>
                  </>
                )}
                <th className="text-right py-2 pl-3 text-[11px] tracking-wide uppercase text-ink-muted font-semibold">
                  Cash Flow
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.year} className="border-b border-rule-light">
                  <td className="py-2 pr-3 font-semibold tabular-nums">
                    {s.year}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    ${formatNumber(s.grossAnnual)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-ink-muted">
                    ${formatNumber(s.totalExpenses)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold">
                    ${formatNumber(s.noi)}
                  </td>
                  {results.mortgageAnnual > 0 && (
                    <>
                      <td className="py-2 px-3 text-right tabular-nums text-ink-muted">
                        ${formatNumber(s.principalPaid)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-ink-muted">
                        ${formatNumber(s.interestPaid)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-ink-muted">
                        ${formatNumber(s.mortgageAnnual)}
                      </td>
                    </>
                  )}
                  <td
                    className={`py-2 pl-3 text-right font-display text-base tabular-nums ${s.cashFlow >= 0 ? "text-gain" : "text-loss"}`}
                  >
                    {formatCurrency(s.cashFlow)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-rule">
                <td className="py-2.5 pr-3 font-bold">Total</td>
                <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                  $
                  {formatNumber(
                    snapshots.reduce((a, s) => a + s.grossAnnual, 0),
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-bold tabular-nums text-ink-muted">
                  $
                  {formatNumber(
                    snapshots.reduce((a, s) => a + s.totalExpenses, 0),
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                  ${formatNumber(snapshots.reduce((a, s) => a + s.noi, 0))}
                </td>
                {results.mortgageAnnual > 0 && (
                  <>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-ink-muted">
                      $
                      {formatNumber(
                        snapshots.reduce((a, s) => a + s.principalPaid, 0),
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-ink-muted">
                      $
                      {formatNumber(
                        snapshots.reduce((a, s) => a + s.interestPaid, 0),
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-ink-muted">
                      $
                      {formatNumber(
                        snapshots.reduce((a, s) => a + s.mortgageAnnual, 0),
                      )}
                    </td>
                  </>
                )}
                <td
                  className={`py-2.5 pl-3 text-right font-display text-lg font-bold tabular-nums ${results.cumulativeCashFlow >= 0 ? "text-gain" : "text-loss"}`}
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
