export type LoanPaymentType = "amortized" | "interestOnly";

export interface PropertyInputs {
  purchasePrice: number;
  closingCostPct: number;
  rehabCost: number;
  furnishingCost: number;
  downPaymentPct: number;
  loanRatePct: number;
  loanTermYears: number;
  loanPaymentType: LoanPaymentType;
}

export interface RentalInputs {
  isShortTerm: boolean;
  monthlyRent: number;
  nightlyRate: number;
  nightsPerMonth: number;
  occupancyPct: number;
}

export interface ExpenseInputs {
  predialAnnual: number;
  maintenancePct: number;
  hoaMonthly: number;
  insuranceAnnual: number;
  managementFeePct: number;
  platformFeePct: number;
  utilitiesMonthly: number;
}

export interface ProjectionInputs {
  appreciationPct: number;
  rentIncreasePct: number;
  expenseInflationPct: number;
  sellingCostPct: number;
  holdYears: number;
}

export type CalculatorInputs = PropertyInputs &
  RentalInputs &
  ExpenseInputs &
  ProjectionInputs;

export interface CalculatorResults {
  closingCost: number;
  totalInvestment: number;
  downPayment: number;
  cashInvested: number;
  loanAmount: number;
  monthlyMortgage: number;
  mortgageAnnual: number;
  grossMonthly: number;
  effectiveMonthly: number;
  grossAnnual: number;
  maintenanceAnnual: number;
  managementAnnual: number;
  platformAnnual: number;
  utilitiesAnnual: number;
  totalExpensesAnnual: number;
  noi: number;
  cashFlow: number;
  monthlyCashFlow: number;
  capRatePct: number;
  cashOnCashPct: number;
  appreciationBase: number;
  futureValue: number;
  cumulativeCashFlow: number;
  equityBuildup: number;
  yearSnapshots: YearSnapshot[];
  sellingCosts: number;
  totalProfit: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
}

export interface YearSnapshot {
  year: number;
  grossAnnual: number;
  totalExpenses: number;
  noi: number;
  mortgageAnnual: number;
  principalPaid: number;
  interestPaid: number;
  cashFlow: number;
}

export function calculateMonthlyMortgage(
  loanAmount: number,
  annualRatePct: number,
  termYears: number,
  paymentType: LoanPaymentType = "amortized",
): number {
  if (loanAmount <= 0 || annualRatePct < 0 || termYears <= 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  if (paymentType === "interestOnly") {
    return loanAmount * monthlyRate;
  }
  if (annualRatePct === 0) return loanAmount / (termYears * 12);
  const totalPayments = termYears * 12;
  const compoundFactor = (1 + monthlyRate) ** totalPayments;
  return (loanAmount * (monthlyRate * compoundFactor)) / (compoundFactor - 1);
}

export function calculateRemainingBalance(
  loanAmount: number,
  annualRatePct: number,
  termYears: number,
  yearsElapsed: number,
  paymentType: LoanPaymentType = "amortized",
): number {
  if (loanAmount <= 0 || annualRatePct < 0 || termYears <= 0) return 0;
  if (yearsElapsed >= termYears) return 0;
  if (yearsElapsed <= 0) return loanAmount;
  if (paymentType === "interestOnly") {
    return loanAmount;
  }
  if (annualRatePct === 0) {
    return loanAmount * (1 - yearsElapsed / termYears);
  }
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  const k = yearsElapsed * 12;
  const compoundN = (1 + r) ** n;
  const compoundK = (1 + r) ** k;
  return (loanAmount * (compoundN - compoundK)) / (compoundN - 1);
}

export function calculateGrossMonthlyIncome(rental: RentalInputs): number {
  return rental.isShortTerm
    ? rental.nightlyRate * rental.nightsPerMonth
    : rental.monthlyRent;
}

export function calculateAnnualExpenses(
  grossAnnual: number,
  expenses: ExpenseInputs,
  isShortTerm: boolean,
  inflationPct = 0,
  year = 0,
): number {
  const inflationFactor = (1 + inflationPct / 100) ** year;
  const maintenance = grossAnnual * (expenses.maintenancePct / 100);
  const management = grossAnnual * (expenses.managementFeePct / 100);
  const platform = isShortTerm
    ? grossAnnual * (expenses.platformFeePct / 100)
    : 0;
  const utilities = isShortTerm
    ? expenses.utilitiesMonthly * 12 * inflationFactor
    : 0;
  return (
    expenses.predialAnnual * inflationFactor +
    maintenance +
    expenses.hoaMonthly * 12 * inflationFactor +
    expenses.insuranceAnnual * inflationFactor +
    management +
    platform +
    utilities
  );
}

export function calculate(inputs: CalculatorInputs): CalculatorResults {
  const closingCost = inputs.purchasePrice * (inputs.closingCostPct / 100);
  const totalInvestment =
    inputs.purchasePrice +
    closingCost +
    inputs.rehabCost +
    inputs.furnishingCost;
  const downPayment = inputs.purchasePrice * (inputs.downPaymentPct / 100);
  const cashInvested =
    downPayment + closingCost + inputs.rehabCost + inputs.furnishingCost;
  const loanAmount = inputs.purchasePrice - downPayment;

  const monthlyMortgage = calculateMonthlyMortgage(
    loanAmount,
    inputs.loanRatePct,
    inputs.loanTermYears,
    inputs.loanPaymentType,
  );
  const mortgageAnnual = monthlyMortgage * 12;

  const grossMonthly = calculateGrossMonthlyIncome(inputs);
  const effectiveMonthly = inputs.isShortTerm
    ? grossMonthly
    : grossMonthly * (inputs.occupancyPct / 100);
  const grossAnnual = effectiveMonthly * 12;

  const maintenanceAnnual = grossAnnual * (inputs.maintenancePct / 100);
  const managementAnnual = grossAnnual * (inputs.managementFeePct / 100);
  const platformAnnual = inputs.isShortTerm
    ? grossAnnual * (inputs.platformFeePct / 100)
    : 0;
  const utilitiesAnnual = inputs.isShortTerm ? inputs.utilitiesMonthly * 12 : 0;
  const totalExpensesAnnual = calculateAnnualExpenses(
    grossAnnual,
    inputs,
    inputs.isShortTerm,
    inputs.expenseInflationPct,
    0,
  );

  const noi = grossAnnual - totalExpensesAnnual;
  const cashFlow = noi - mortgageAnnual;
  const monthlyCashFlow = cashFlow / 12;

  const capRatePct =
    inputs.purchasePrice > 0 ? (noi / inputs.purchasePrice) * 100 : 0;
  const cashOnCashPct = cashInvested > 0 ? (cashFlow / cashInvested) * 100 : 0;

  const appreciationBase = inputs.purchasePrice + inputs.rehabCost;
  const futureValue =
    appreciationBase * (1 + inputs.appreciationPct / 100) ** inputs.holdYears;

  const rentGrowthRate = inputs.rentIncreasePct / 100;
  let cumulativeCashFlow = 0;
  const yearSnapshots: YearSnapshot[] = [];
  for (let year = 0; year < inputs.holdYears; year++) {
    const yearGrossAnnual = grossAnnual * (1 + rentGrowthRate) ** year;
    const yearExpenses = calculateAnnualExpenses(
      yearGrossAnnual,
      inputs,
      inputs.isShortTerm,
      inputs.expenseInflationPct,
      year,
    );
    const yearNoi = yearGrossAnnual - yearExpenses;

    const balanceStart = calculateRemainingBalance(
      loanAmount,
      inputs.loanRatePct,
      inputs.loanTermYears,
      year,
      inputs.loanPaymentType,
    );
    const balanceEnd = calculateRemainingBalance(
      loanAmount,
      inputs.loanRatePct,
      inputs.loanTermYears,
      year + 1,
      inputs.loanPaymentType,
    );
    const principalPaid = balanceStart - balanceEnd;
    let yearMortgage: number;
    let interestPaid: number;
    if (balanceStart <= 0) {
      yearMortgage = 0;
      interestPaid = 0;
    } else if (inputs.loanPaymentType === "interestOnly") {
      interestPaid = balanceStart * (inputs.loanRatePct / 100);
      yearMortgage = interestPaid + principalPaid;
    } else {
      yearMortgage = mortgageAnnual;
      interestPaid = yearMortgage - principalPaid;
    }
    const yearCashFlow = yearNoi - yearMortgage;
    cumulativeCashFlow += yearCashFlow;

    yearSnapshots.push({
      year: year + 1,
      grossAnnual: yearGrossAnnual,
      totalExpenses: yearExpenses,
      noi: yearNoi,
      mortgageAnnual: yearMortgage,
      principalPaid,
      interestPaid,
      cashFlow: yearCashFlow,
    });
  }

  const remainingBalance = calculateRemainingBalance(
    loanAmount,
    inputs.loanRatePct,
    inputs.loanTermYears,
    inputs.holdYears,
    inputs.loanPaymentType,
  );
  const equityBuildup = loanAmount - remainingBalance;
  const sellingCosts = futureValue * (inputs.sellingCostPct / 100);
  const saleProceeds = futureValue - remainingBalance - sellingCosts;
  const totalProfit = saleProceeds + cumulativeCashFlow - cashInvested;
  const totalReturnPct =
    cashInvested > 0 ? (totalProfit / cashInvested) * 100 : 0;
  const totalReturnRatio = cashInvested > 0 ? totalProfit / cashInvested : 0;
  const annualizedReturnPct =
    cashInvested > 0 && inputs.holdYears > 0 && 1 + totalReturnRatio > 0
      ? ((1 + totalReturnRatio) ** (1 / inputs.holdYears) - 1) * 100
      : cashInvested > 0 && inputs.holdYears > 0
        ? -100
        : 0;

  return {
    closingCost,
    totalInvestment,
    downPayment,
    cashInvested,
    loanAmount,
    monthlyMortgage,
    mortgageAnnual,
    grossMonthly,
    effectiveMonthly,
    grossAnnual,
    maintenanceAnnual,
    managementAnnual,
    platformAnnual,
    utilitiesAnnual,
    totalExpensesAnnual,
    noi,
    cashFlow,
    monthlyCashFlow,
    capRatePct,
    cashOnCashPct,
    appreciationBase,
    futureValue,
    cumulativeCashFlow,
    equityBuildup,
    yearSnapshots,
    sellingCosts,
    totalProfit,
    totalReturnPct,
    annualizedReturnPct,
  };
}
