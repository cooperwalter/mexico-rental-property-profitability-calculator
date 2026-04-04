export interface PropertyInputs {
  purchasePrice: number;
  closingCostPct: number;
  rehabCost: number;
  furnishingCost: number;
  downPaymentPct: number;
  loanRatePct: number;
  loanTermYears: number;
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
  futureValue: number;
  cumulativeCashFlow: number;
  yearSnapshots: YearSnapshot[];
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
  cashFlow: number;
}

export function calculateMonthlyMortgage(
  loanAmount: number,
  annualRatePct: number,
  termYears: number,
): number {
  if (loanAmount <= 0 || annualRatePct <= 0 || termYears <= 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  const totalPayments = termYears * 12;
  const compoundFactor = (1 + monthlyRate) ** totalPayments;
  return (loanAmount * (monthlyRate * compoundFactor)) / (compoundFactor - 1);
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
): number {
  const maintenance = grossAnnual * (expenses.maintenancePct / 100);
  const management = grossAnnual * (expenses.managementFeePct / 100);
  const platform = isShortTerm
    ? grossAnnual * (expenses.platformFeePct / 100)
    : 0;
  const utilities = isShortTerm ? expenses.utilitiesMonthly * 12 : 0;
  return (
    expenses.predialAnnual +
    maintenance +
    expenses.hoaMonthly * 12 +
    expenses.insuranceAnnual +
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
  );
  const mortgageAnnual = monthlyMortgage * 12;

  const grossMonthly = calculateGrossMonthlyIncome(inputs);
  const effectiveMonthly = grossMonthly * (inputs.occupancyPct / 100);
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
  );

  const noi = grossAnnual - totalExpensesAnnual;
  const cashFlow = noi - mortgageAnnual;
  const monthlyCashFlow = cashFlow / 12;

  const capRatePct = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;
  const cashOnCashPct = cashInvested > 0 ? (cashFlow / cashInvested) * 100 : 0;

  const futureValue =
    inputs.purchasePrice *
    (1 + inputs.appreciationPct / 100) ** inputs.holdYears;

  const rentGrowthRate = inputs.rentIncreasePct / 100;
  let cumulativeCashFlow = 0;
  const yearSnapshots: YearSnapshot[] = [];
  for (let year = 0; year < inputs.holdYears; year++) {
    const yearGrossAnnual = grossAnnual * (1 + rentGrowthRate) ** year;
    const yearExpenses = calculateAnnualExpenses(
      yearGrossAnnual,
      inputs,
      inputs.isShortTerm,
    );
    const yearNoi = yearGrossAnnual - yearExpenses;
    const yearCashFlow = yearNoi - mortgageAnnual;
    cumulativeCashFlow += yearCashFlow;
    yearSnapshots.push({
      year: year + 1,
      grossAnnual: yearGrossAnnual,
      totalExpenses: yearExpenses,
      noi: yearNoi,
      mortgageAnnual,
      cashFlow: yearCashFlow,
    });
  }

  const totalProfit = cumulativeCashFlow + (futureValue - inputs.purchasePrice);
  const totalReturnPct =
    cashInvested > 0 ? (totalProfit / cashInvested) * 100 : 0;
  const annualizedReturnPct =
    cashInvested > 0 && inputs.holdYears > 0
      ? ((1 + totalProfit / cashInvested) ** (1 / inputs.holdYears) - 1) * 100
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
    futureValue,
    cumulativeCashFlow,
    yearSnapshots,
    totalProfit,
    totalReturnPct,
    annualizedReturnPct,
  };
}
