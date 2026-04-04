import { type ReactNode, useMemo, useState } from "react";
import { type CalculatorInputs, calculate } from "./calculations";
import {
  type FormFieldValue,
  formatCurrency,
  formatNumber,
  formatPercent,
  toNumber,
} from "./format";
import {
  createLocalStorageBackend,
  createScenario,
  deleteScenario,
  type Scenario,
  scenarioHasChanges,
  updateScenario,
} from "./scenarios";

const DEFAULT_INPUTS: CalculatorInputs = {
  purchasePrice: 5_000_000,
  closingCostPct: 7.5,
  rehabCost: 550_000,
  furnishingCost: 250_000,
  downPaymentPct: 20,
  loanRatePct: 8.5,
  loanTermYears: 15,
  monthlyRent: 31_500,
  occupancyPct: 90,
  isShortTerm: false,
  nightlyRate: 2_200,
  nightsPerMonth: 15,
  predialAnnual: 5_000,
  maintenancePct: 7.5,
  hoaMonthly: 2_500,
  insuranceAnnual: 5_000,
  managementFeePct: 10,
  utilitiesMonthly: 2_000,
  platformFeePct: 3,
  appreciationPct: 7.5,
  holdYears: 7,
};

type FormState = {
  [K in keyof CalculatorInputs]: CalculatorInputs[K] extends boolean
    ? boolean
    : FormFieldValue;
};

function formToInputs(form: FormState): CalculatorInputs {
  return {
    purchasePrice: toNumber(form.purchasePrice),
    closingCostPct: toNumber(form.closingCostPct),
    rehabCost: toNumber(form.rehabCost),
    furnishingCost: toNumber(form.furnishingCost),
    downPaymentPct: toNumber(form.downPaymentPct),
    loanRatePct: toNumber(form.loanRatePct),
    loanTermYears: toNumber(form.loanTermYears),
    monthlyRent: toNumber(form.monthlyRent),
    occupancyPct: toNumber(form.occupancyPct),
    isShortTerm: form.isShortTerm,
    nightlyRate: toNumber(form.nightlyRate),
    nightsPerMonth: toNumber(form.nightsPerMonth),
    predialAnnual: toNumber(form.predialAnnual),
    maintenancePct: toNumber(form.maintenancePct),
    hoaMonthly: toNumber(form.hoaMonthly),
    insuranceAnnual: toNumber(form.insuranceAnnual),
    managementFeePct: toNumber(form.managementFeePct),
    utilitiesMonthly: toNumber(form.utilitiesMonthly),
    platformFeePct: toNumber(form.platformFeePct),
    appreciationPct: toNumber(form.appreciationPct),
    holdYears: toNumber(form.holdYears),
  };
}

function inputsToForm(inputs: CalculatorInputs): FormState {
  return { ...inputs };
}

const scenarioStorage = createLocalStorageBackend(localStorage);

function Tooltip({
  term,
  tip,
  children,
}: {
  term: string;
  tip: string;
  children?: ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <button
      type="button"
      className="relative inline-flex items-center gap-1 bg-transparent border-0 p-0 m-0 font-inherit text-inherit cursor-inherit"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      {children ?? term}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 15,
          height: 15,
          borderRadius: "50%",
          fontSize: 10,
          fontWeight: 700,
          background: "var(--border, #ccc)",
          color: "var(--text-secondary, #666)",
          cursor: "help",
          flexShrink: 0,
        }}
      >
        ?
      </span>
      {show && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--text-primary, #222)",
            color: "#fff",
            fontSize: 12,
            lineHeight: 1.4,
            padding: "8px 12px",
            borderRadius: 8,
            width: 240,
            zIndex: 50,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,.2)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 2 }}>{term}</strong>
          {tip}
          <span
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: 6,
              borderStyle: "solid",
              borderColor:
                "var(--text-primary, #222) transparent transparent transparent",
            }}
          />
        </span>
      )}
    </button>
  );
}

function OptionalTooltip({ label, tip }: { label: string; tip?: string }) {
  if (!tip) return <>{label}</>;
  return (
    <Tooltip term={label} tip={tip}>
      <span>{label}</span>
    </Tooltip>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  compact,
  tip,
}: {
  label: string;
  value: FormFieldValue;
  onChange: (v: FormFieldValue) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  compact?: boolean;
  tip?: string;
}) {
  return (
    <label className={compact ? "mb-2 block" : "mb-3 block"}>
      <span
        className="block text-sm font-medium mb-1"
        style={{ color: "var(--text-secondary, #555)" }}
      >
        <OptionalTooltip label={label} tip={tip} />
      </span>
      <div
        className="flex items-center rounded-lg border px-3 py-2"
        style={{
          borderColor: "var(--border, #ddd)",
          background: "var(--bg-input, #fff)",
        }}
      >
        {prefix && (
          <span
            className="text-sm mr-1"
            style={{ color: "var(--text-secondary, #888)" }}
          >
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full bg-transparent outline-none text-sm"
          style={{ color: "var(--text-primary, #222)" }}
        />
        {suffix && (
          <span
            className="text-sm ml-1 whitespace-nowrap"
            style={{ color: "var(--text-secondary, #888)" }}
          >
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--text-secondary, #999)" }}
        >
          {hint}
        </p>
      )}
    </label>
  );
}

function StatCard({
  label,
  value,
  sub,
  positive,
  tip,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  tip?: string;
}) {
  const color =
    positive === true
      ? "#16a34a"
      : positive === false
        ? "#dc2626"
        : "var(--text-primary, #222)";
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-card, #f7f7f7)" }}
    >
      <p
        className="text-xs font-medium mb-1"
        style={{ color: "var(--text-secondary, #888)" }}
      >
        <OptionalTooltip label={label} tip={tip} />
      </p>
      <p className="text-xl font-bold" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--text-secondary, #999)" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <h3
        className="text-sm font-semibold mb-3 pb-1 border-b"
        style={{
          color: "var(--text-primary, #333)",
          borderColor: "var(--border, #e5e5e5)",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function PLRow({
  label,
  value,
  negative,
  bold,
  tip,
  topBorder,
}: {
  label: string;
  value: string;
  negative?: boolean;
  bold?: boolean;
  tip?: string;
  topBorder?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "font-bold" : ""} ${topBorder ? "border-t pt-1 mt-1" : ""}`}
      style={{
        color: negative ? "var(--text-secondary, #888)" : undefined,
        borderColor: "var(--border, #ddd)",
      }}
    >
      <span>
        <OptionalTooltip label={label} tip={tip} />
      </span>
      <span className={bold ? "font-bold" : "font-medium"}>
        {negative ? "−" : ""}
        {value}
      </span>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2 rounded-lg text-sm font-medium"
      style={{
        background: active
          ? "var(--text-primary, #222)"
          : "var(--bg-card, #f0f0f0)",
        color: active ? "#fff" : "var(--text-secondary, #666)",
      }}
    >
      {children}
    </button>
  );
}

function ScenarioPanel({
  scenarios,
  activeId,
  isDirty,
  activeName,
  scenarioName,
  onLoad,
  onDelete,
  onSaveNew,
  onUpdate,
  onNameChange,
}: {
  scenarios: Scenario[];
  activeId: string | null;
  isDirty: boolean;
  activeName: string | undefined;
  scenarioName: string;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveNew: () => void;
  onUpdate: () => void;
  onNameChange: (name: string) => void;
}) {
  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{
        background: "var(--bg-card, #f7f7f7)",
        border: "1px solid var(--border, #e0e0e0)",
      }}
    >
      <h3 className="text-sm font-semibold mb-3">Scenarios</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {scenarios.map((s) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onLoad(s.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{
                background:
                  s.id === activeId
                    ? "var(--text-primary, #222)"
                    : "var(--bg-input, #fff)",
                color: s.id === activeId ? "#fff" : "var(--text-primary, #222)",
                border: "1px solid var(--border, #ccc)",
              }}
            >
              {s.name}
              {s.id === activeId && isDirty ? " *" : ""}
            </button>
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              className="text-xs px-1.5 py-1 rounded"
              style={{ color: "var(--text-secondary, #888)" }}
              title="Delete scenario"
            >
              ✕
            </button>
          </div>
        ))}
        {scenarios.length === 0 && (
          <p
            className="text-xs"
            style={{ color: "var(--text-secondary, #888)" }}
          >
            No saved scenarios yet
          </p>
        )}
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          placeholder="Scenario name…"
          value={scenarioName}
          onChange={(e) => onNameChange(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none"
          style={{
            borderColor: "var(--border, #ddd)",
            background: "var(--bg-input, #fff)",
            color: "var(--text-primary, #222)",
            minWidth: 160,
          }}
        />
        <button
          type="button"
          onClick={onSaveNew}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: "#2563eb", color: "#fff" }}
        >
          Save as New
        </button>
        {activeId && isDirty && (
          <button
            type="button"
            onClick={onUpdate}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "#16a34a", color: "#fff" }}
          >
            Update &ldquo;{activeName}&rdquo;
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState<FormState>(inputsToForm(DEFAULT_INPUTS));
  const [scenarios, setScenarios] = useState<Scenario[]>(scenarioStorage.load);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState("");

  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  const inputs = useMemo(() => formToInputs(form), [form]);
  const results = useMemo(() => calculate(inputs), [inputs]);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);
  const isDirty = activeScenario
    ? scenarioHasChanges(activeScenario, inputs)
    : false;

  const persistScenarios = (updated: Scenario[]) => {
    setScenarios(updated);
    scenarioStorage.save(updated);
  };

  const handleSaveNew = () => {
    const scenario = createScenario(scenarioName, inputs, scenarios.length);
    persistScenarios([...scenarios, scenario]);
    setActiveScenarioId(scenario.id);
    setScenarioName("");
  };

  const handleUpdate = () => {
    if (!activeScenarioId) return;
    persistScenarios(updateScenario(scenarios, activeScenarioId, inputs));
  };

  const handleLoad = (id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (scenario) {
      setForm(inputsToForm(scenario.data));
      setActiveScenarioId(id);
    }
  };

  const handleDelete = (id: string) => {
    persistScenarios(deleteScenario(scenarios, id));
    if (activeScenarioId === id) setActiveScenarioId(null);
  };

  const hasLoan = toNumber(form.downPaymentPct) < 100;
  const cashFlowPositive = results.monthlyCashFlow >= 0;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        color: "var(--text-primary, #222)",
        maxWidth: 900,
        margin: "0 auto",
        padding: 16,
      }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          CDMX Rental Profitability Calculator
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary, #666)" }}>
          All amounts in MXN pesos · hover or tap{" "}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 15,
              height: 15,
              borderRadius: "50%",
              fontSize: 10,
              fontWeight: 700,
              background: "var(--border, #ccc)",
              color: "var(--text-secondary, #666)",
            }}
          >
            ?
          </span>{" "}
          for definitions
        </p>
      </div>

      <ScenarioPanel
        scenarios={scenarios}
        activeId={activeScenarioId}
        isDirty={isDirty}
        activeName={activeScenario?.name}
        scenarioName={scenarioName}
        onLoad={handleLoad}
        onDelete={handleDelete}
        onSaveNew={handleSaveNew}
        onUpdate={handleUpdate}
        onNameChange={setScenarioName}
      />

      <div
        className="grid grid-cols-2 gap-3 mb-6"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <StatCard
          label="Monthly Cash Flow"
          value={formatCurrency(results.monthlyCashFlow)}
          positive={cashFlowPositive}
          tip="The money left each month after subtracting all expenses and debt payments from rental income. Positive = profit, negative = loss."
        />
        <StatCard
          label="Cap Rate"
          value={formatPercent(results.capRatePct)}
          sub="NOI / Total Investment"
          positive={results.capRatePct >= 5}
          tip="Capitalization Rate measures a property's return without financing. It's the annual NOI divided by total investment cost. Higher = better. 5%+ is generally considered decent."
        />
        <StatCard
          label="Cash-on-Cash Return"
          value={formatPercent(results.cashOnCashPct)}
          sub="Annual CF / Cash Invested"
          positive={results.cashOnCashPct >= 8}
          tip="Measures the annual return on the actual cash you put in (not the property's full value). Useful when using leverage. 8%+ is often a good benchmark."
        />
        <StatCard
          label={`Total Return (${form.holdYears}yr)`}
          value={formatPercent(results.totalReturnPct)}
          sub={`≈ ${formatPercent(results.annualizedReturnPct)} annualized`}
          positive={results.annualizedReturnPct >= 10}
          tip="Combines all cash flow over the hold period plus projected appreciation gains, divided by your cash invested. Shows the big-picture profitability of the deal."
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        <div>
          <Section title="Purchase & Financing">
            <NumberInput
              label="Purchase Price"
              value={form.purchasePrice}
              onChange={set("purchasePrice")}
              prefix="$"
              suffix="MXN"
            />
            <NumberInput
              label="Closing Costs"
              value={form.closingCostPct}
              onChange={set("closingCostPct")}
              suffix="%"
              hint={`≈ $${formatNumber(results.closingCost)}`}
              tip="One-time fees to finalize the purchase: notary fees, title registration, appraisal, and transfer taxes. In Mexico, 5–8% is typical."
            />
            <NumberInput
              label="Rehab / Renovation"
              value={form.rehabCost}
              onChange={set("rehabCost")}
              prefix="$"
              tip="Cost of repairs or upgrades needed before renting. Includes plumbing, electrical, painting, flooring, etc."
            />
            <NumberInput
              label="Furnishing"
              value={form.furnishingCost}
              onChange={set("furnishingCost")}
              prefix="$"
              tip="Cost of furniture and appliances. Essential for short-term rentals; optional for long-term."
            />
            <NumberInput
              label="Down Payment"
              value={form.downPaymentPct}
              onChange={set("downPaymentPct")}
              suffix="%"
              hint={
                hasLoan
                  ? `Loan: $${formatNumber(results.loanAmount)}`
                  : "Paying cash"
              }
              tip="Percentage of the purchase price paid upfront. 100% = all cash, no loan. Mexican banks typically require 10–30% down."
            />
            {hasLoan && (
              <>
                <NumberInput
                  label="Annual Interest Rate"
                  value={form.loanRatePct}
                  onChange={set("loanRatePct")}
                  suffix="%"
                  compact
                  tip="The yearly interest charged on the mortgage loan. Mexican bank rates typically range from 9–14%."
                />
                <NumberInput
                  label="Loan Term"
                  value={form.loanTermYears}
                  onChange={set("loanTermYears")}
                  suffix="years"
                  compact
                  tip="How many years to repay the loan. Longer terms = lower monthly payments but more interest paid overall."
                />
                <p
                  className="text-xs mb-2"
                  style={{ color: "var(--text-secondary, #888)" }}
                >
                  Monthly payment:{" "}
                  <strong>${formatNumber(results.monthlyMortgage)}</strong>
                </p>
              </>
            )}
          </Section>

          <Section title="Rental Income">
            <div className="flex gap-2 mb-3">
              <ToggleButton
                active={!form.isShortTerm}
                onClick={() => set("isShortTerm")(false)}
              >
                Long-Term
              </ToggleButton>
              <ToggleButton
                active={form.isShortTerm}
                onClick={() => set("isShortTerm")(true)}
              >
                Short-Term (Airbnb)
              </ToggleButton>
            </div>
            {form.isShortTerm ? (
              <>
                <NumberInput
                  label="Nightly Rate"
                  value={form.nightlyRate}
                  onChange={set("nightlyRate")}
                  prefix="$"
                  suffix="MXN"
                  tip="The price charged per night on platforms like Airbnb or Booking.com."
                />
                <NumberInput
                  label="Avg Nights Booked / Month"
                  value={form.nightsPerMonth}
                  onChange={set("nightsPerMonth")}
                  tip="Average number of nights booked per month over the year. 20 nights ≈ 67% nightly occupancy."
                />
              </>
            ) : (
              <NumberInput
                label="Monthly Rent"
                value={form.monthlyRent}
                onChange={set("monthlyRent")}
                prefix="$"
                suffix="MXN"
                tip="The fixed monthly rent charged to a long-term tenant."
              />
            )}
            <NumberInput
              label="Occupancy Rate"
              value={form.occupancyPct}
              onChange={set("occupancyPct")}
              suffix="%"
              hint={`Effective monthly: $${formatNumber(results.effectiveMonthly)}`}
              tip="Percentage of time the property is rented over a year. Accounts for vacancies, turnover, and seasonal dips. 85–95% is realistic for long-term; 65–80% for short-term."
            />
          </Section>
        </div>

        <div>
          <Section title="Annual Expenses">
            <NumberInput
              label="Predial (Property Tax)"
              value={form.predialAnnual}
              onChange={set("predialAnnual")}
              prefix="$"
              suffix="/ year"
              tip="Annual property tax paid to the local government (Alcaldía). In CDMX it's relatively low compared to other countries."
            />
            <NumberInput
              label="Maintenance Reserve"
              value={form.maintenancePct}
              onChange={set("maintenancePct")}
              suffix="% of income"
              tip="Money set aside for repairs and upkeep (leaky pipes, appliance replacement, wear & tear). 3–5% of gross income is a common rule of thumb."
            />
            <NumberInput
              label="HOA / Cuota de Mantenimiento"
              value={form.hoaMonthly}
              onChange={set("hoaMonthly")}
              prefix="$"
              suffix="/ month"
              tip="Monthly fee for shared building expenses: security, cleaning, elevators, common areas, water. Varies widely by building."
            />
            <NumberInput
              label="Insurance"
              value={form.insuranceAnnual}
              onChange={set("insuranceAnnual")}
              prefix="$"
              suffix="/ year"
              tip="Annual property insurance covering damage from earthquakes, floods, fire, and liability. Earthquake coverage is important in CDMX."
            />
            <NumberInput
              label="Property Management"
              value={form.managementFeePct}
              onChange={set("managementFeePct")}
              suffix="% of income"
              tip="Fee paid to a property manager to handle tenant communication, maintenance, and rent collection. Typically 8–15% of rental income."
            />
            {form.isShortTerm && (
              <>
                <NumberInput
                  label="Platform Fee (Airbnb etc.)"
                  value={form.platformFeePct}
                  onChange={set("platformFeePct")}
                  suffix="% of income"
                  tip="Service fee charged by booking platforms (Airbnb, Booking.com). Usually 3–5% for hosts on most platforms."
                />
                <NumberInput
                  label="Utilities"
                  value={form.utilitiesMonthly}
                  onChange={set("utilitiesMonthly")}
                  prefix="$"
                  suffix="/ month"
                  tip="Monthly cost of electricity, gas, water, and internet that you cover for short-term guests."
                />
              </>
            )}
          </Section>

          <Section title="Appreciation & Hold Period">
            <NumberInput
              label="Annual Appreciation"
              value={form.appreciationPct}
              onChange={set("appreciationPct")}
              suffix="%"
              tip="Expected yearly increase in property value. CDMX has seen 3–8% annually in popular colonias, but this varies and is never guaranteed."
            />
            <NumberInput
              label="Hold Period"
              value={form.holdYears}
              onChange={set("holdYears")}
              suffix="years"
              tip="How long you plan to own the property before selling. Longer holds benefit more from appreciation and amortization."
            />
          </Section>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--bg-card, #f5f5f5)",
              border: "1px solid var(--border, #e0e0e0)",
            }}
          >
            <h3 className="text-sm font-semibold mb-3">Annual P&L Summary</h3>
            <div className="space-y-1 text-sm">
              <PLRow
                label="Gross Annual Income"
                value={`$${formatNumber(results.grossAnnual)}`}
                tip="Total rental income for the year after accounting for occupancy rate."
              />
              <PLRow
                label="  − Operating Expenses"
                value={`$${formatNumber(results.totalExpensesAnnual)}`}
                negative
                tip="All costs to operate the property: taxes, insurance, HOA, maintenance, management, and platform fees."
              />
              <PLRow
                label="Net Operating Income (NOI)"
                value={`$${formatNumber(results.noi)}`}
                bold
                topBorder
                tip="Income minus operating expenses, before mortgage payments. The core measure of a property's earning power regardless of how it's financed."
              />
              {results.mortgageAnnual > 0 && (
                <PLRow
                  label="  − Debt Service"
                  value={`$${formatNumber(results.mortgageAnnual)}`}
                  negative
                  tip="Total annual mortgage payments (principal + interest). This is the cost of financing the property."
                />
              )}
              <div
                className="flex justify-between border-t pt-1 mt-1 font-bold"
                style={{
                  borderColor: "var(--border, #ddd)",
                  color: cashFlowPositive ? "#16a34a" : "#dc2626",
                }}
              >
                <span>
                  <Tooltip
                    term="Annual Cash Flow"
                    tip="The actual money in your pocket after all expenses and loan payments. This is what you take home each year."
                  >
                    <span>Annual Cash Flow</span>
                  </Tooltip>
                </span>
                <span>{formatCurrency(results.cashFlow)}</span>
              </div>
            </div>
            <div
              className="mt-4 pt-3 border-t text-sm space-y-1"
              style={{ borderColor: "var(--border, #ddd)" }}
            >
              <PLRow
                label="Total Cash Invested"
                value={`$${formatNumber(results.cashInvested)}`}
                tip="All the actual cash you put into the deal: down payment + closing costs + rehab + furnishing."
              />
              <PLRow
                label={`Property Value in ${form.holdYears}yr`}
                value={`$${formatNumber(results.futureValue)}`}
                tip="Projected property value based on your assumed annual appreciation rate, compounded over the hold period."
              />
              <div className="flex justify-between font-bold">
                <span>
                  <Tooltip
                    term={`Total Profit (${form.holdYears}yr)`}
                    tip="All cash flow earned over the hold period plus the gain in property value (appreciation). Does not account for selling costs or taxes."
                  >
                    <span>Total Profit ({form.holdYears}yr)</span>
                  </Tooltip>
                </span>
                <span
                  style={{
                    color: results.totalProfit >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {formatCurrency(results.totalProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
