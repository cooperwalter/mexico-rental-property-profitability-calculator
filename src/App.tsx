import { type ReactNode, useMemo, useState } from "react";
import {
  type CalculatorInputs,
  calculate,
  type YearSnapshot,
} from "./calculations";
import {
  type FormFieldValue,
  formatCurrency,
  formatNumber,
  formatPercent,
  toNumber,
} from "./format";
import Report from "./Report";
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
  loanRatePct: 7,
  loanTermYears: 30,
  loanPaymentType: "amortized",
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
  rentIncreasePct: 4,
  expenseInflationPct: 4,
  sellingCostPct: 5,
  holdYears: 7,
};

type FormState = {
  [K in keyof CalculatorInputs]: CalculatorInputs[K] extends boolean
    ? boolean
    : CalculatorInputs[K] extends string
      ? CalculatorInputs[K]
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
    loanPaymentType: form.loanPaymentType,
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
    rentIncreasePct: toNumber(form.rentIncreasePct),
    expenseInflationPct: toNumber(form.expenseInflationPct),
    sellingCostPct: toNumber(form.sellingCostPct),
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
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold bg-rule text-ink-muted cursor-help shrink-0">
        ?
      </span>
      {show && (
        <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-ink text-paper text-xs leading-snug px-3 py-2 rounded-md w-60 z-50 pointer-events-none shadow-lg">
          <strong className="block mb-0.5 font-body">{term}</strong>
          {tip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-ink" />
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
    <label className={`block ${compact ? "mb-1.5" : "mb-3"}`}>
      <span className="block text-xs tracking-wide uppercase text-ink-muted mb-1 font-body">
        <OptionalTooltip label={label} tip={tip} />
      </span>
      <div className="flex items-center border-b border-rule pb-1.5 focus-within:border-ink transition-colors">
        {prefix && (
          <span className="text-sm text-ink-faint mr-1 font-body">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full bg-transparent outline-none text-sm font-body text-ink tabular-nums"
        />
        {suffix && (
          <span className="text-xs text-ink-faint ml-1 whitespace-nowrap font-body">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-[11px] mt-1 text-ink-muted font-body">{hint}</p>
      )}
    </label>
  );
}

function Metric({
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
  const valueColor =
    positive === true
      ? "text-gain"
      : positive === false
        ? "text-loss"
        : "text-ink";
  return (
    <div className="pr-6">
      <p className="text-[11px] tracking-wide uppercase text-ink-muted mb-1 font-body">
        <OptionalTooltip label={label} tip={tip} />
      </p>
      <p className={`text-2xl font-display ${valueColor}`}>{value}</p>
      {sub && (
        <p className="text-[11px] mt-0.5 text-ink-faint font-body">{sub}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-[11px] tracking-[0.15em] uppercase text-ink-muted font-body font-semibold mb-4 pb-2 border-b border-rule">
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
      className={`flex justify-between py-0.5 ${bold ? "font-semibold" : ""} ${topBorder ? "border-t border-rule pt-1.5 mt-1" : ""} ${negative ? "text-ink-muted" : ""}`}
    >
      <span className="font-body text-sm">
        <OptionalTooltip label={label} tip={tip} />
      </span>
      <span
        className={`tabular-nums font-body text-sm ${bold ? "font-semibold" : ""}`}
      >
        {negative ? "−" : ""}
        {value}
      </span>
    </div>
  );
}

function PLSummary({
  title,
  snapshot,
}: {
  title: string;
  snapshot: YearSnapshot;
}) {
  const pos = snapshot.cashFlow >= 0;
  return (
    <div>
      <h4 className="text-[11px] tracking-wide uppercase text-ink-muted font-body font-semibold mb-1.5 mt-4 pb-1 border-b border-rule-light">
        {title}
      </h4>
      <div className="space-y-0.5 text-sm">
        <PLRow
          label="Effective Income"
          value={`$${formatNumber(snapshot.grossAnnual)}`}
        />
        <PLRow
          label="  − Expenses"
          value={`$${formatNumber(snapshot.totalExpenses)}`}
          negative
        />
        <PLRow
          label="NOI"
          value={`$${formatNumber(snapshot.noi)}`}
          bold
          topBorder
        />
        {snapshot.mortgageAnnual > 0 && (
          <PLRow
            label="  − Debt Service"
            value={`$${formatNumber(snapshot.mortgageAnnual)}`}
            negative
          />
        )}
        <div
          className={`flex justify-between border-t border-rule pt-1.5 mt-1 font-semibold ${pos ? "text-gain" : "text-loss"}`}
        >
          <span className="font-body text-sm">Cash Flow</span>
          <span className="font-display text-base tabular-nums">
            {formatCurrency(snapshot.cashFlow)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TabButton({
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
      className={`px-4 py-1.5 text-sm font-body font-medium transition-colors ${
        active
          ? "text-ink border-b-2 border-ink"
          : "text-ink-muted hover:text-ink border-b-2 border-transparent"
      }`}
    >
      {children}
    </button>
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
      className={`flex-1 py-2 text-sm font-body font-medium transition-colors border ${
        active
          ? "bg-ink text-paper border-ink"
          : "bg-transparent text-ink-muted border-rule hover:border-ink-faint"
      }`}
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
    <div className="mb-8 pb-6 border-b border-rule">
      <h3 className="text-[11px] tracking-[0.15em] uppercase text-ink-muted font-body font-semibold mb-3">
        Scenarios
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {scenarios.map((s) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onLoad(s.id)}
              className={`px-3 py-1 text-sm font-body border transition-colors ${
                s.id === activeId
                  ? "bg-ink text-paper border-ink"
                  : "bg-transparent text-ink border-rule hover:border-ink-faint"
              }`}
            >
              {s.name}
              {s.id === activeId && isDirty ? " *" : ""}
            </button>
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              className="text-xs px-1 py-0.5 text-ink-faint hover:text-loss transition-colors"
              title="Delete scenario"
            >
              ✕
            </button>
          </div>
        ))}
        {scenarios.length === 0 && (
          <p className="text-xs text-ink-faint font-body italic">
            No saved scenarios
          </p>
        )}
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          placeholder="Scenario name..."
          value={scenarioName}
          onChange={(e) => onNameChange(e.target.value)}
          className="border-b border-rule bg-transparent px-1 py-1 text-sm font-body text-ink outline-none focus:border-ink transition-colors"
          style={{ minWidth: 160 }}
        />
        <button
          type="button"
          onClick={onSaveNew}
          className="px-3 py-1 text-sm font-body font-medium bg-accent text-paper hover:opacity-90 transition-opacity"
        >
          Save as New
        </button>
        {activeId && isDirty && (
          <button
            type="button"
            onClick={onUpdate}
            className="px-3 py-1 text-sm font-body font-medium bg-gain text-paper hover:opacity-90 transition-opacity"
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
  const [view, setView] = useState<"calculator" | "report">("calculator");

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

  const plSnapshots = useMemo(() => {
    const snaps = results.yearSnapshots;
    if (snaps.length === 0) return [];
    if (snaps.length === 1) return [{ title: "Year 1", snapshot: snaps[0] }];
    const midIndex = Math.floor((snaps.length - 1) / 2);
    const items: { title: string; snapshot: YearSnapshot }[] = [
      { title: "Year 1", snapshot: snaps[0] },
    ];
    if (midIndex > 0 && midIndex < snaps.length - 1) {
      items.push({
        title: `Year ${snaps[midIndex].year}`,
        snapshot: snaps[midIndex],
      });
    }
    items.push({
      title: `Year ${snaps[snaps.length - 1].year}`,
      snapshot: snaps[snaps.length - 1],
    });
    return items;
  }, [results.yearSnapshots]);

  return (
    <div className="font-body text-ink max-w-[920px] mx-auto px-5 py-8">
      <header className="mb-8">
        <p className="text-[11px] tracking-[0.2em] uppercase text-ink-muted font-body mb-1">
          CDMX Investment Analysis
        </p>
        <h1 className="text-3xl font-display text-ink leading-tight">
          Rental Profitability Calculator
        </h1>
        <div className="flex gap-0 mt-5 border-b border-rule">
          <TabButton
            active={view === "calculator"}
            onClick={() => setView("calculator")}
          >
            Calculator
          </TabButton>
          <TabButton
            active={view === "report"}
            onClick={() => setView("report")}
          >
            Report
          </TabButton>
        </div>
      </header>

      {view === "report" ? (
        <Report inputs={inputs} results={results} />
      ) : (
        <>
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

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-10 sm:grid-cols-4">
            <Metric
              label="Monthly Cash Flow"
              value={formatCurrency(results.monthlyCashFlow)}
              positive={cashFlowPositive}
              tip="The money left each month after subtracting all expenses and debt payments from rental income. Positive = profit, negative = loss."
            />
            <Metric
              label="Cap Rate"
              value={formatPercent(results.capRatePct)}
              sub="NOI / Purchase Price"
              positive={results.capRatePct >= 5}
              tip="Capitalization Rate measures a property's return without financing. It's the annual NOI divided by purchase price. Higher = better. 5%+ is generally considered decent. Comparable to market-listed cap rates."
            />
            <Metric
              label="Cash-on-Cash"
              value={formatPercent(results.cashOnCashPct)}
              sub="Annual CF / Cash Invested"
              positive={results.cashOnCashPct >= 8}
              tip="Measures the annual return on the actual cash you put in (not the property's full value). Useful when using leverage. 8%+ is often a good benchmark."
            />
            <Metric
              label={`Total Return (${form.holdYears}yr)`}
              value={formatPercent(results.totalReturnPct)}
              sub={`${formatPercent(results.annualizedReturnPct)} ann.`}
              positive={results.annualizedReturnPct >= 10}
              tip="Net profit from sale proceeds plus cumulative cash flow, minus all cash invested. Divided by cash invested. Shows the big-picture profitability of the deal."
            />
          </div>

          <div
            className="grid gap-x-12 gap-y-0"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                    <div className="mb-3">
                      <p className="text-xs tracking-wide uppercase text-ink-muted mb-1 font-body">
                        <OptionalTooltip
                          label="Payment Type"
                          tip="Amortized: fixed monthly payments that gradually pay down the principal — you build equity each month. Interest-Only: lower monthly payments covering just interest; the full principal is still owed at the end (balloon)."
                        />
                      </p>
                      <div className="flex gap-0">
                        <ToggleButton
                          active={form.loanPaymentType === "amortized"}
                          onClick={() =>
                            set("loanPaymentType")("amortized")
                          }
                        >
                          Amortized
                        </ToggleButton>
                        <ToggleButton
                          active={form.loanPaymentType === "interestOnly"}
                          onClick={() =>
                            set("loanPaymentType")("interestOnly")
                          }
                        >
                          Interest-Only
                        </ToggleButton>
                      </div>
                    </div>
                    <p className="text-[11px] mb-3 text-ink-muted font-body">
                      Monthly payment:{" "}
                      <strong className="text-ink font-display text-sm">
                        ${formatNumber(results.monthlyMortgage)}
                      </strong>
                      {form.loanPaymentType === "interestOnly" && (
                        <span className="text-ink-faint">
                          {" "}
                          (interest only)
                        </span>
                      )}
                    </p>
                  </>
                )}
              </Section>

              <Section title="Rental Income">
                <div className="flex gap-0 mb-4">
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
                {!form.isShortTerm && (
                  <NumberInput
                    label="Occupancy Rate"
                    value={form.occupancyPct}
                    onChange={set("occupancyPct")}
                    suffix="%"
                    hint={`Effective monthly: $${formatNumber(results.effectiveMonthly)}`}
                    tip="Percentage of time the property is rented over a year. Accounts for vacancies and turnover between tenants. 85–95% is realistic for long-term."
                  />
                )}
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

              <Section title="Projections">
                <NumberInput
                  label="Annual Appreciation"
                  value={form.appreciationPct}
                  onChange={set("appreciationPct")}
                  suffix="%"
                  tip="Expected yearly increase in property value. CDMX has seen 3–8% annually in popular colonias, but this varies and is never guaranteed."
                />
                <NumberInput
                  label="Annual Rent Increase"
                  value={form.rentIncreasePct}
                  onChange={set("rentIncreasePct")}
                  suffix="%"
                  tip="Yearly rent growth rate. Conservative: 3.5–4% (CDMX law caps renewals at prior year's inflation). Moderate: 6–8% (resetting to market between tenants). Optimistic: 9–10% (gentrifying areas like Narvarte)."
                />
                <NumberInput
                  label="Annual Expense Inflation"
                  value={form.expenseInflationPct}
                  onChange={set("expenseInflationPct")}
                  suffix="%"
                  tip="Yearly increase in fixed costs (HOA, predial, insurance, utilities). In Mexico, 3–5% is typical, roughly tracking inflation."
                />
                <NumberInput
                  label="Selling Costs"
                  value={form.sellingCostPct}
                  onChange={set("sellingCostPct")}
                  suffix="% of sale price"
                  hint={
                    results.sellingCosts > 0
                      ? `≈ $${formatNumber(results.sellingCosts)}`
                      : undefined
                  }
                  tip="Costs incurred when selling: agent commissions, notary fees, transfer taxes, and capital gains tax (ISR). In Mexico, 5–8% is typical."
                />
                <NumberInput
                  label="Hold Period"
                  value={form.holdYears}
                  onChange={set("holdYears")}
                  suffix="years"
                  tip="How long you plan to own the property before selling. Longer holds benefit more from appreciation and amortization."
                />
              </Section>

              <div className="border-t border-rule pt-6">
                <h3 className="text-[11px] tracking-[0.15em] uppercase text-ink-muted font-body font-semibold mb-1">
                  P&L by Year
                </h3>
                {plSnapshots.map(({ title, snapshot }) => (
                  <PLSummary
                    key={snapshot.year}
                    title={title}
                    snapshot={snapshot}
                  />
                ))}
                <div className="mt-5 pt-4 border-t border-rule space-y-1 text-sm">
                  <PLRow
                    label="Total Cash Invested"
                    value={`$${formatNumber(results.cashInvested)}`}
                    tip="All the actual cash you put into the deal: down payment + closing costs + rehab + furnishing."
                  />
                  <PLRow
                    label={`Cash Flow over ${form.holdYears}yr`}
                    value={`$${formatNumber(results.cumulativeCashFlow)}`}
                    tip="Total cash flow summed across all years, accounting for annual rent increases. Each year's rent grows by the rent increase rate."
                  />
                  <PLRow
                    label={`Property Value in ${form.holdYears}yr`}
                    value={`$${formatNumber(results.futureValue)}`}
                    tip="Projected property value based on your assumed annual appreciation rate, compounded over the hold period."
                  />
                  {results.sellingCosts > 0 && (
                    <PLRow
                      label="Selling Costs"
                      value={`$${formatNumber(results.sellingCosts)}`}
                      negative
                      tip="Estimated costs at sale: agent commissions, notary fees, transfer taxes, and capital gains tax."
                    />
                  )}
                  <div className="flex justify-between pt-2 mt-1 border-t border-rule">
                    <span className="font-body text-sm font-semibold">
                      <Tooltip
                        term={`Total Profit (${form.holdYears}yr)`}
                        tip="Sale proceeds (after paying off any remaining loan and selling costs) plus cumulative cash flow, minus all cash invested (down payment, closing costs, rehab, furnishing)."
                      >
                        <span>Total Profit ({form.holdYears}yr)</span>
                      </Tooltip>
                    </span>
                    <span
                      className={`font-display text-lg tabular-nums ${results.totalProfit >= 0 ? "text-gain" : "text-loss"}`}
                    >
                      {formatCurrency(results.totalProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
