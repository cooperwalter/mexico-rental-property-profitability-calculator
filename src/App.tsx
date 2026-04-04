import { useState, useMemo, useEffect, useCallback, ReactNode } from "react";

interface ScenarioData {
  price: number;
  closingPct: number;
  rehabCost: number;
  furnishing: number;
  downPct: number;
  loanRate: number;
  loanYears: number;
  monthlyRent: number;
  occupancy: number;
  isShortTerm: boolean;
  nightlyRate: number;
  nightsPerMonth: number;
  predial: number;
  maintenance: number;
  hoa: number;
  insurance: number;
  mgmtFee: number;
  utilities: number;
  platformFee: number;
  appreciation: number;
  holdYears: number;
}

interface Scenario {
  id: string;
  name: string;
  data: ScenarioData;
}

const STORAGE_KEY = "cdmx-calc-scenarios";

function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScenarios(scenarios: Scenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

interface TooltipProps {
  term: string;
  tip: string;
  children?: ReactNode;
}

interface InputProps {
  label: string;
  value: number | string;
  onChange: (v: number | string) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  small?: boolean;
  tip?: string;
}

interface StatProps {
  label: string;
  value: string;
  sub?: string;
  good?: boolean;
  tip?: string;
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

interface PLRowProps {
  label: string;
  value: string;
  neg?: boolean;
  bold?: boolean;
  tip?: string;
  border?: boolean;
}

const Tooltip = ({ term, tip, children }: TooltipProps) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center gap-1" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onClick={() => setShow(!show)}>
      {children || term}
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", fontSize: 10, fontWeight: 700, background: "var(--border, #ccc)", color: "var(--text-secondary, #666)", cursor: "help", flexShrink: 0 }}>?</span>
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "var(--text-primary, #222)", color: "#fff", fontSize: 12, lineHeight: 1.4,
          padding: "8px 12px", borderRadius: 8, width: 240, zIndex: 50, pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,.2)"
        }}>
          <strong style={{ display: "block", marginBottom: 2 }}>{term}</strong>
          {tip}
          <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: 6, borderStyle: "solid", borderColor: "var(--text-primary, #222) transparent transparent transparent" }} />
        </span>
      )}
    </span>
  );
};

const Input = ({ label, value, onChange, prefix, suffix, hint, small, tip }: InputProps) => (
  <div className={small ? "mb-2" : "mb-3"}>
    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary, #555)" }}>
      {tip ? <Tooltip term={label} tip={tip}><span>{label}</span></Tooltip> : label}
    </label>
    <div className="flex items-center rounded-lg border px-3 py-2" style={{ borderColor: "var(--border, #ddd)", background: "var(--bg-input, #fff)" }}>
      {prefix && <span className="text-sm mr-1" style={{ color: "var(--text-secondary, #888)" }}>{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full bg-transparent outline-none text-sm"
        style={{ color: "var(--text-primary, #222)" }}
      />
      {suffix && <span className="text-sm ml-1 whitespace-nowrap" style={{ color: "var(--text-secondary, #888)" }}>{suffix}</span>}
    </div>
    {hint && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary, #999)" }}>{hint}</p>}
  </div>
);

const Stat = ({ label, value, sub, good, tip }: StatProps) => (
  <div className="rounded-xl p-4" style={{ background: "var(--bg-card, #f7f7f7)" }}>
    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary, #888)" }}>
      {tip ? <Tooltip term={label} tip={tip}><span>{label}</span></Tooltip> : label}
    </p>
    <p className="text-xl font-bold" style={{ color: good === true ? "#16a34a" : good === false ? "#dc2626" : "var(--text-primary, #222)" }}>{value}</p>
    {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary, #999)" }}>{sub}</p>}
  </div>
);

const Section = ({ title, children }: SectionProps) => (
  <div className="mb-5">
    <h3 className="text-sm font-semibold mb-3 pb-1 border-b" style={{ color: "var(--text-primary, #333)", borderColor: "var(--border, #e5e5e5)" }}>{title}</h3>
    {children}
  </div>
);

const PLRow = ({ label, value, neg, bold, tip, border }: PLRowProps) => (
  <div className={`flex justify-between ${bold ? "font-bold" : ""} ${border ? "border-t pt-1 mt-1" : ""}`} style={{ color: neg ? "var(--text-secondary, #888)" : undefined, borderColor: "var(--border, #ddd)" }}>
    <span>{tip ? <Tooltip term={label} tip={tip}><span>{label}</span></Tooltip> : label}</span>
    <span className={bold ? "font-bold" : "font-medium"}>{neg ? "−" : ""}{value}</span>
  </div>
);

const num = (v: number | string): number => (v === "" ? 0 : Number(v));

const fmt = (n: number, d = 0) => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtS = (n: number, d = 0) => (n < 0 ? "−" : "") + "$" + fmt(n, d);
const fmtP = (n: number) => n.toFixed(1) + "%";

export default function App() {
  const [price, setPrice] = useState<number | string>(3500000);
  const [closingPct, setClosingPct] = useState<number | string>(6);
  const [rehabCost, setRehabCost] = useState<number | string>(200000);
  const [furnishing, setFurnishing] = useState<number | string>(150000);
  const [downPct, setDownPct] = useState<number | string>(100);
  const [loanRate, setLoanRate] = useState<number | string>(12);
  const [loanYears, setLoanYears] = useState<number | string>(15);

  const [monthlyRent, setMonthlyRent] = useState<number | string>(25000);
  const [occupancy, setOccupancy] = useState<number | string>(85);
  const [isShortTerm, setIsShortTerm] = useState(false);
  const [nightlyRate, setNightlyRate] = useState<number | string>(1800);
  const [nightsPerMonth, setNightsPerMonth] = useState<number | string>(20);

  const [predial, setPredial] = useState<number | string>(8000);
  const [maintenance, setMaintenance] = useState<number | string>(3);
  const [hoa, setHoa] = useState<number | string>(2500);
  const [insurance, setInsurance] = useState<number | string>(6000);
  const [mgmtFee, setMgmtFee] = useState<number | string>(10);
  const [utilities, setUtilities] = useState<number | string>(2000);
  const [platformFee, setPlatformFee] = useState<number | string>(3);

  const [appreciation, setAppreciation] = useState<number | string>(5);
  const [holdYears, setHoldYears] = useState<number | string>(5);

  const [scenarios, setScenarios] = useState<Scenario[]>(loadScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState("");

  const getCurrentData = useCallback((): ScenarioData => ({
    price: num(price), closingPct: num(closingPct), rehabCost: num(rehabCost),
    furnishing: num(furnishing), downPct: num(downPct), loanRate: num(loanRate),
    loanYears: num(loanYears), monthlyRent: num(monthlyRent), occupancy: num(occupancy),
    isShortTerm, nightlyRate: num(nightlyRate), nightsPerMonth: num(nightsPerMonth),
    predial: num(predial), maintenance: num(maintenance), hoa: num(hoa),
    insurance: num(insurance), mgmtFee: num(mgmtFee), utilities: num(utilities),
    platformFee: num(platformFee), appreciation: num(appreciation), holdYears: num(holdYears),
  }), [price, closingPct, rehabCost, furnishing, downPct, loanRate, loanYears,
    monthlyRent, occupancy, isShortTerm, nightlyRate, nightsPerMonth,
    predial, maintenance, hoa, insurance, mgmtFee, utilities, platformFee,
    appreciation, holdYears]);

  const applyScenario = (data: ScenarioData) => {
    setPrice(data.price);
    setClosingPct(data.closingPct);
    setRehabCost(data.rehabCost);
    setFurnishing(data.furnishing);
    setDownPct(data.downPct);
    setLoanRate(data.loanRate);
    setLoanYears(data.loanYears);
    setMonthlyRent(data.monthlyRent);
    setOccupancy(data.occupancy);
    setIsShortTerm(data.isShortTerm);
    setNightlyRate(data.nightlyRate);
    setNightsPerMonth(data.nightsPerMonth);
    setPredial(data.predial);
    setMaintenance(data.maintenance);
    setHoa(data.hoa);
    setInsurance(data.insurance);
    setMgmtFee(data.mgmtFee);
    setUtilities(data.utilities);
    setPlatformFee(data.platformFee);
    setAppreciation(data.appreciation);
    setHoldYears(data.holdYears);
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const isDirty = activeScenario ? JSON.stringify(activeScenario.data) !== JSON.stringify(getCurrentData()) : false;

  const handleSave = () => {
    if (activeScenarioId) {
      const updated = scenarios.map(s =>
        s.id === activeScenarioId ? { ...s, data: getCurrentData() } : s
      );
      setScenarios(updated);
      saveScenarios(updated);
    }
  };

  const handleSaveNew = () => {
    const name = scenarioName.trim() || `Scenario ${scenarios.length + 1}`;
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      name,
      data: getCurrentData(),
    };
    const updated = [...scenarios, newScenario];
    setScenarios(updated);
    saveScenarios(updated);
    setActiveScenarioId(newScenario.id);
    setScenarioName("");
  };

  const handleLoad = (id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
      applyScenario(scenario.data);
      setActiveScenarioId(id);
    }
  };

  const handleDelete = (id: string) => {
    const updated = scenarios.filter(s => s.id !== id);
    setScenarios(updated);
    saveScenarios(updated);
    if (activeScenarioId === id) setActiveScenarioId(null);
  };

  const r = useMemo(() => {
    const p = num(price), cp = num(closingPct), rc = num(rehabCost), f = num(furnishing);
    const dp = num(downPct), lr = num(loanRate), ly = num(loanYears);
    const mr_ = num(monthlyRent), occ = num(occupancy);
    const nr = num(nightlyRate), npm = num(nightsPerMonth);
    const pr = num(predial), mt = num(maintenance), h = num(hoa), ins = num(insurance);
    const mf = num(mgmtFee), ut = num(utilities), pf = num(platformFee);
    const ap = num(appreciation), hy = num(holdYears);

    const closingCost = p * (cp / 100);
    const totalInvestment = p + closingCost + rc + f;
    const downPayment = p * (dp / 100);
    const cashInvested = downPayment + closingCost + rc + f;
    const loanAmt = p - downPayment;

    let monthlyMortgage = 0;
    if (loanAmt > 0 && lr > 0 && ly > 0) {
      const mr = lr / 100 / 12;
      const n = ly * 12;
      monthlyMortgage = loanAmt * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
    }

    const grossMonthly = isShortTerm ? nr * npm : mr_;
    const effectiveMonthly = grossMonthly * (occ / 100);
    const grossAnnual = effectiveMonthly * 12;

    const maintAnnual = grossAnnual * (mt / 100);
    const mgmtAnnual = grossAnnual * (mf / 100);
    const platformAnnual = isShortTerm ? grossAnnual * (pf / 100) : 0;
    const utilitiesAnnual = isShortTerm ? ut * 12 : 0;
    const totalExpAnnual = pr + maintAnnual + (h * 12) + ins + mgmtAnnual + platformAnnual + utilitiesAnnual;
    const mortgageAnnual = monthlyMortgage * 12;

    const noi = grossAnnual - totalExpAnnual;
    const cashFlow = noi - mortgageAnnual;
    const monthlyCashFlow = cashFlow / 12;

    const capRate = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;
    const cashOnCash = cashInvested > 0 ? (cashFlow / cashInvested) * 100 : 0;

    const futureValue = p * Math.pow(1 + ap / 100, hy);
    const totalProfit = cashFlow * hy + (futureValue - p);
    const totalReturn = cashInvested > 0 ? (totalProfit / cashInvested) * 100 : 0;
    const annualizedReturn = cashInvested > 0 ? (Math.pow(1 + totalProfit / cashInvested, 1 / hy) - 1) * 100 : 0;

    return { totalInvestment, cashInvested, closingCost, loanAmt, monthlyMortgage, grossAnnual, effectiveMonthly, totalExpAnnual, noi, cashFlow, monthlyCashFlow, capRate, cashOnCash, futureValue, totalProfit, totalReturn, annualizedReturn, mortgageAnnual };
  }, [price, closingPct, rehabCost, furnishing, downPct, loanRate, loanYears, monthlyRent, occupancy, isShortTerm, nightlyRate, nightsPerMonth, predial, maintenance, hoa, insurance, mgmtFee, utilities, platformFee, appreciation, holdYears]);

  const pos = r.monthlyCashFlow >= 0;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "var(--text-primary, #222)", maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">🏠 CDMX Rental Profitability Calculator</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary, #666)" }}>All amounts in MXN pesos · hover or tap <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", fontSize: 10, fontWeight: 700, background: "var(--border, #ccc)", color: "var(--text-secondary, #666)" }}>?</span> for definitions</p>
      </div>

      <div className="rounded-xl p-4 mb-6" style={{ background: "var(--bg-card, #f7f7f7)", border: "1px solid var(--border, #e0e0e0)" }}>
        <h3 className="text-sm font-semibold mb-3">📁 Scenarios</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {scenarios.map(s => (
            <div key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => handleLoad(s.id)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  background: s.id === activeScenarioId ? "var(--text-primary, #222)" : "var(--bg-input, #fff)",
                  color: s.id === activeScenarioId ? "#fff" : "var(--text-primary, #222)",
                  border: "1px solid var(--border, #ccc)",
                }}
              >
                {s.name}
                {s.id === activeScenarioId && isDirty && " *"}
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="text-xs px-1.5 py-1 rounded"
                style={{ color: "var(--text-secondary, #888)" }}
                title="Delete scenario"
              >
                ✕
              </button>
            </div>
          ))}
          {scenarios.length === 0 && (
            <p className="text-xs" style={{ color: "var(--text-secondary, #888)" }}>No saved scenarios yet</p>
          )}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="text"
            placeholder="Scenario name…"
            value={scenarioName}
            onChange={e => setScenarioName(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm outline-none"
            style={{ borderColor: "var(--border, #ddd)", background: "var(--bg-input, #fff)", color: "var(--text-primary, #222)", minWidth: 160 }}
          />
          <button
            onClick={handleSaveNew}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "#2563eb", color: "#fff" }}
          >
            Save as New
          </button>
          {activeScenarioId && isDirty && (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: "#16a34a", color: "#fff" }}
            >
              Update "{activeScenario?.name}"
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Stat label="Monthly Cash Flow" value={fmtS(r.monthlyCashFlow)} good={pos}
          tip="The money left each month after subtracting all expenses and debt payments from rental income. Positive = profit, negative = loss." />
        <Stat label="Cap Rate" value={fmtP(r.capRate)} sub="NOI / Total Investment" good={r.capRate >= 5}
          tip="Capitalization Rate measures a property's return without financing. It's the annual NOI divided by total investment cost. Higher = better. 5%+ is generally considered decent." />
        <Stat label="Cash-on-Cash Return" value={fmtP(r.cashOnCash)} sub="Annual CF / Cash Invested" good={r.cashOnCash >= 8}
          tip="Measures the annual return on the actual cash you put in (not the property's full value). Useful when using leverage. 8%+ is often a good benchmark." />
        <Stat label={`Total Return (${holdYears}yr)`} value={fmtP(r.totalReturn)} sub={`≈ ${fmtP(r.annualizedReturn)} annualized`} good={r.annualizedReturn >= 10}
          tip="Combines all cash flow over the hold period plus projected appreciation gains, divided by your cash invested. Shows the big-picture profitability of the deal." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        <div>
          <Section title="🏗 Purchase & Financing">
            <Input label="Purchase Price" value={price} onChange={setPrice} prefix="$" suffix="MXN" />
            <Input label="Closing Costs" value={closingPct} onChange={setClosingPct} suffix="%"
              hint={`≈ $${fmt(r.closingCost)}`}
              tip="One-time fees to finalize the purchase: notary fees, title registration, appraisal, and transfer taxes. In Mexico, 5–8% is typical." />
            <Input label="Rehab / Renovation" value={rehabCost} onChange={setRehabCost} prefix="$"
              tip="Cost of repairs or upgrades needed before renting. Includes plumbing, electrical, painting, flooring, etc." />
            <Input label="Furnishing" value={furnishing} onChange={setFurnishing} prefix="$"
              tip="Cost of furniture and appliances. Essential for short-term rentals; optional for long-term." />
            <Input label="Down Payment" value={downPct} onChange={setDownPct} suffix="%"
              hint={num(downPct) < 100 ? `Loan: $${fmt(r.loanAmt)}` : "Paying cash"}
              tip="Percentage of the purchase price paid upfront. 100% = all cash, no loan. Mexican banks typically require 10–30% down." />
            {num(downPct) < 100 && (
              <>
                <Input label="Annual Interest Rate" value={loanRate} onChange={setLoanRate} suffix="%" small
                  tip="The yearly interest charged on the mortgage loan. Mexican bank rates typically range from 9–14%." />
                <Input label="Loan Term" value={loanYears} onChange={setLoanYears} suffix="years" small
                  tip="How many years to repay the loan. Longer terms = lower monthly payments but more interest paid overall." />
                <p className="text-xs mb-2" style={{ color: "var(--text-secondary, #888)" }}>Monthly payment: <strong>${fmt(r.monthlyMortgage)}</strong></p>
              </>
            )}
          </Section>

          <Section title="💰 Rental Income">
            <div className="flex gap-2 mb-3">
              <button onClick={() => setIsShortTerm(false)} className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: !isShortTerm ? "var(--text-primary, #222)" : "var(--bg-card, #f0f0f0)", color: !isShortTerm ? "#fff" : "var(--text-secondary, #666)" }}>
                Long-Term
              </button>
              <button onClick={() => setIsShortTerm(true)} className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: isShortTerm ? "var(--text-primary, #222)" : "var(--bg-card, #f0f0f0)", color: isShortTerm ? "#fff" : "var(--text-secondary, #666)" }}>
                Short-Term (Airbnb)
              </button>
            </div>
            {isShortTerm ? (
              <>
                <Input label="Nightly Rate" value={nightlyRate} onChange={setNightlyRate} prefix="$" suffix="MXN"
                  tip="The price charged per night on platforms like Airbnb or Booking.com." />
                <Input label="Avg Nights Booked / Month" value={nightsPerMonth} onChange={setNightsPerMonth}
                  tip="Average number of nights booked per month over the year. 20 nights ≈ 67% nightly occupancy." />
              </>
            ) : (
              <Input label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} prefix="$" suffix="MXN"
                tip="The fixed monthly rent charged to a long-term tenant." />
            )}
            <Input label="Occupancy Rate" value={occupancy} onChange={setOccupancy} suffix="%"
              hint={`Effective monthly: $${fmt(r.effectiveMonthly)}`}
              tip="Percentage of time the property is rented over a year. Accounts for vacancies, turnover, and seasonal dips. 85–95% is realistic for long-term; 65–80% for short-term." />
          </Section>
        </div>

        <div>
          <Section title="📋 Annual Expenses">
            <Input label="Predial (Property Tax)" value={predial} onChange={setPredial} prefix="$" suffix="/ year"
              tip="Annual property tax paid to the local government (Alcaldía). In CDMX it's relatively low compared to other countries." />
            <Input label="Maintenance Reserve" value={maintenance} onChange={setMaintenance} suffix="% of income"
              tip="Money set aside for repairs and upkeep (leaky pipes, appliance replacement, wear & tear). 3–5% of gross income is a common rule of thumb." />
            <Input label="HOA / Cuota de Mantenimiento" value={hoa} onChange={setHoa} prefix="$" suffix="/ month"
              tip="Monthly fee for shared building expenses: security, cleaning, elevators, common areas, water. Varies widely by building." />
            <Input label="Insurance" value={insurance} onChange={setInsurance} prefix="$" suffix="/ year"
              tip="Annual property insurance covering damage from earthquakes, floods, fire, and liability. Earthquake coverage is important in CDMX." />
            <Input label="Property Management" value={mgmtFee} onChange={setMgmtFee} suffix="% of income"
              tip="Fee paid to a property manager to handle tenant communication, maintenance, and rent collection. Typically 8–15% of rental income." />
            {isShortTerm && (
              <>
                <Input label="Platform Fee (Airbnb etc.)" value={platformFee} onChange={setPlatformFee} suffix="% of income"
                  tip="Service fee charged by booking platforms (Airbnb, Booking.com). Usually 3–5% for hosts on most platforms." />
                <Input label="Utilities" value={utilities} onChange={setUtilities} prefix="$" suffix="/ month"
                  tip="Monthly cost of electricity, gas, water, and internet that you cover for short-term guests." />
              </>
            )}
          </Section>

          <Section title="📈 Appreciation & Hold Period">
            <Input label="Annual Appreciation" value={appreciation} onChange={setAppreciation} suffix="%"
              tip="Expected yearly increase in property value. CDMX has seen 3–8% annually in popular colonias, but this varies and is never guaranteed." />
            <Input label="Hold Period" value={holdYears} onChange={setHoldYears} suffix="years"
              tip="How long you plan to own the property before selling. Longer holds benefit more from appreciation and amortization." />
          </Section>

          <div className="rounded-xl p-4" style={{ background: "var(--bg-card, #f5f5f5)", border: "1px solid var(--border, #e0e0e0)" }}>
            <h3 className="text-sm font-semibold mb-3">📊 Annual P&L Summary</h3>
            <div className="space-y-1 text-sm">
              <PLRow label="Gross Annual Income" value={`$${fmt(r.grossAnnual)}`}
                tip="Total rental income for the year after accounting for occupancy rate." />
              <PLRow label="  − Operating Expenses" value={`$${fmt(r.totalExpAnnual)}`} neg
                tip="All costs to operate the property: taxes, insurance, HOA, maintenance, management, and platform fees." />
              <PLRow label="Net Operating Income (NOI)" value={`$${fmt(r.noi)}`} bold border
                tip="Income minus operating expenses, before mortgage payments. The core measure of a property's earning power regardless of how it's financed." />
              {r.mortgageAnnual > 0 && (
                <PLRow label="  − Debt Service" value={`$${fmt(r.mortgageAnnual)}`} neg
                  tip="Total annual mortgage payments (principal + interest). This is the cost of financing the property." />
              )}
              <div className={`flex justify-between border-t pt-1 mt-1 font-bold`} style={{ borderColor: "var(--border, #ddd)", color: pos ? "#16a34a" : "#dc2626" }}>
                <span><Tooltip term="Annual Cash Flow" tip="The actual money in your pocket after all expenses and loan payments. This is what you take home each year."><span>Annual Cash Flow</span></Tooltip></span>
                <span>{fmtS(r.cashFlow)}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t text-sm space-y-1" style={{ borderColor: "var(--border, #ddd)" }}>
              <PLRow label="Total Cash Invested" value={`$${fmt(r.cashInvested)}`}
                tip="All the actual cash you put into the deal: down payment + closing costs + rehab + furnishing." />
              <PLRow label={`Property Value in ${holdYears}yr`} value={`$${fmt(r.futureValue)}`}
                tip="Projected property value based on your assumed annual appreciation rate, compounded over the hold period." />
              <div className="flex justify-between font-bold">
                <span><Tooltip term={`Total Profit (${holdYears}yr)`} tip="All cash flow earned over the hold period plus the gain in property value (appreciation). Does not account for selling costs or taxes."><span>Total Profit ({holdYears}yr)</span></Tooltip></span>
                <span style={{ color: r.totalProfit >= 0 ? "#16a34a" : "#dc2626" }}>{fmtS(r.totalProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
