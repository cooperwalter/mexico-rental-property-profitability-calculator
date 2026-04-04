import { describe, expect, test } from "bun:test";
import {
  type CalculatorInputs,
  calculate,
  calculateAnnualExpenses,
  calculateGrossMonthlyIncome,
  calculateMonthlyMortgage,
  type ExpenseInputs,
  type RentalInputs,
} from "./calculations";

function makeInputs(
  overrides: Partial<CalculatorInputs> = {},
): CalculatorInputs {
  return {
    purchasePrice: 3_500_000,
    closingCostPct: 6,
    rehabCost: 200_000,
    furnishingCost: 150_000,
    downPaymentPct: 100,
    loanRatePct: 12,
    loanTermYears: 15,
    monthlyRent: 25_000,
    occupancyPct: 85,
    isShortTerm: false,
    nightlyRate: 1_800,
    nightsPerMonth: 20,
    predialAnnual: 8_000,
    maintenancePct: 3,
    hoaMonthly: 2_500,
    insuranceAnnual: 6_000,
    managementFeePct: 10,
    utilitiesMonthly: 2_000,
    platformFeePct: 3,
    appreciationPct: 5,
    holdYears: 5,
    ...overrides,
  };
}

function makeRentalInputs(overrides: Partial<RentalInputs> = {}): RentalInputs {
  return {
    isShortTerm: false,
    monthlyRent: 25_000,
    nightlyRate: 1_800,
    nightsPerMonth: 20,
    occupancyPct: 85,
    ...overrides,
  };
}

function makeExpenseInputs(
  overrides: Partial<ExpenseInputs> = {},
): ExpenseInputs {
  return {
    predialAnnual: 8_000,
    maintenancePct: 3,
    hoaMonthly: 2_500,
    insuranceAnnual: 6_000,
    managementFeePct: 10,
    utilitiesMonthly: 2_000,
    platformFeePct: 3,
    ...overrides,
  };
}

describe("calculateMonthlyMortgage", () => {
  test("should return 0 when loan amount is 0", () => {
    expect(calculateMonthlyMortgage(0, 12, 15)).toBe(0);
  });

  test("should return 0 when interest rate is 0", () => {
    expect(calculateMonthlyMortgage(1_000_000, 0, 15)).toBe(0);
  });

  test("should return 0 when term is 0 years", () => {
    expect(calculateMonthlyMortgage(1_000_000, 12, 0)).toBe(0);
  });

  test("should return 0 when loan amount is negative", () => {
    expect(calculateMonthlyMortgage(-500_000, 12, 15)).toBe(0);
  });

  test("should compute standard amortization for a 1M MXN loan at 12% over 15 years", () => {
    const payment = calculateMonthlyMortgage(1_000_000, 12, 15);
    expect(payment).toBeCloseTo(12_001.68, 0);
  });

  test("should compute higher payment for shorter term", () => {
    const short = calculateMonthlyMortgage(1_000_000, 12, 10);
    const long = calculateMonthlyMortgage(1_000_000, 12, 15);
    expect(short).toBeGreaterThan(long);
  });

  test("should compute higher payment for higher interest rate", () => {
    const low = calculateMonthlyMortgage(1_000_000, 9, 15);
    const high = calculateMonthlyMortgage(1_000_000, 14, 15);
    expect(high).toBeGreaterThan(low);
  });

  test("total payments over loan life should exceed principal (interest cost)", () => {
    const principal = 2_000_000;
    const monthly = calculateMonthlyMortgage(principal, 12, 15);
    const totalPaid = monthly * 15 * 12;
    expect(totalPaid).toBeGreaterThan(principal);
  });
});

describe("calculateGrossMonthlyIncome", () => {
  test("should return monthly rent for long-term rental", () => {
    const result = calculateGrossMonthlyIncome(
      makeRentalInputs({ isShortTerm: false, monthlyRent: 30_000 }),
    );
    expect(result).toBe(30_000);
  });

  test("should return nightly rate * nights for short-term rental", () => {
    const result = calculateGrossMonthlyIncome(
      makeRentalInputs({
        isShortTerm: true,
        nightlyRate: 2_000,
        nightsPerMonth: 18,
      }),
    );
    expect(result).toBe(36_000);
  });

  test("should ignore nightly rate fields when long-term", () => {
    const result = calculateGrossMonthlyIncome(
      makeRentalInputs({
        isShortTerm: false,
        monthlyRent: 10_000,
        nightlyRate: 99_999,
      }),
    );
    expect(result).toBe(10_000);
  });

  test("should ignore monthly rent when short-term", () => {
    const result = calculateGrossMonthlyIncome(
      makeRentalInputs({
        isShortTerm: true,
        monthlyRent: 99_999,
        nightlyRate: 1_000,
        nightsPerMonth: 10,
      }),
    );
    expect(result).toBe(10_000);
  });

  test("should return 0 when short-term with 0 nights booked", () => {
    const result = calculateGrossMonthlyIncome(
      makeRentalInputs({
        isShortTerm: true,
        nightlyRate: 2_000,
        nightsPerMonth: 0,
      }),
    );
    expect(result).toBe(0);
  });
});

describe("calculateAnnualExpenses", () => {
  test("should not include platform fee or utilities for long-term rentals", () => {
    const expenses = makeExpenseInputs({
      platformFeePct: 5,
      utilitiesMonthly: 3_000,
    });
    const grossAnnual = 300_000;
    const result = calculateAnnualExpenses(grossAnnual, expenses, false);
    const maintenance = 300_000 * 0.03;
    const management = 300_000 * 0.1;
    const expected = 8_000 + maintenance + 2_500 * 12 + 6_000 + management;
    expect(result).toBeCloseTo(expected, 2);
  });

  test("should include platform fee and utilities for short-term rentals", () => {
    const expenses = makeExpenseInputs({
      platformFeePct: 5,
      utilitiesMonthly: 3_000,
    });
    const grossAnnual = 300_000;
    const result = calculateAnnualExpenses(grossAnnual, expenses, true);
    const longTermResult = calculateAnnualExpenses(
      grossAnnual,
      expenses,
      false,
    );
    const platformCost = 300_000 * 0.05;
    const utilitiesCost = 3_000 * 12;
    expect(result).toBeCloseTo(
      longTermResult + platformCost + utilitiesCost,
      2,
    );
  });

  test("should return only fixed costs when percentage-based fees are 0", () => {
    const expenses = makeExpenseInputs({
      maintenancePct: 0,
      managementFeePct: 0,
      platformFeePct: 0,
    });
    const result = calculateAnnualExpenses(500_000, expenses, false);
    expect(result).toBe(8_000 + 2_500 * 12 + 6_000);
  });

  test("should return 0 when all expense inputs are 0", () => {
    const expenses: ExpenseInputs = {
      predialAnnual: 0,
      maintenancePct: 0,
      hoaMonthly: 0,
      insuranceAnnual: 0,
      managementFeePct: 0,
      utilitiesMonthly: 0,
      platformFeePct: 0,
    };
    expect(calculateAnnualExpenses(100_000, expenses, false)).toBe(0);
    expect(calculateAnnualExpenses(100_000, expenses, true)).toBe(0);
  });
});

describe("calculate (full integration)", () => {
  test("should compute correct closing cost from purchase price and percentage", () => {
    const r = calculate(
      makeInputs({ purchasePrice: 4_000_000, closingCostPct: 5 }),
    );
    expect(r.closingCost).toBe(200_000);
  });

  test("should compute total investment as price + closing + rehab + furnishing", () => {
    const r = calculate(
      makeInputs({
        purchasePrice: 3_000_000,
        closingCostPct: 10,
        rehabCost: 100_000,
        furnishingCost: 50_000,
      }),
    );
    expect(r.totalInvestment).toBe(3_000_000 + 300_000 + 100_000 + 50_000);
  });

  test("should compute 0 loan amount when paying 100% cash", () => {
    const r = calculate(makeInputs({ downPaymentPct: 100 }));
    expect(r.loanAmount).toBe(0);
    expect(r.monthlyMortgage).toBe(0);
    expect(r.mortgageAnnual).toBe(0);
  });

  test("should compute correct loan amount when financing", () => {
    const r = calculate(
      makeInputs({ purchasePrice: 2_000_000, downPaymentPct: 20 }),
    );
    expect(r.loanAmount).toBe(1_600_000);
    expect(r.downPayment).toBe(400_000);
  });

  test("should compute cash invested as down payment + closing + rehab + furnishing", () => {
    const r = calculate(
      makeInputs({
        purchasePrice: 2_000_000,
        downPaymentPct: 50,
        closingCostPct: 5,
        rehabCost: 100_000,
        furnishingCost: 50_000,
      }),
    );
    expect(r.cashInvested).toBe(1_000_000 + 100_000 + 100_000 + 50_000);
  });

  test("should apply occupancy rate to gross monthly income", () => {
    const r = calculate(
      makeInputs({ monthlyRent: 20_000, occupancyPct: 75, isShortTerm: false }),
    );
    expect(r.effectiveMonthly).toBe(15_000);
    expect(r.grossAnnual).toBe(180_000);
  });

  test("should compute NOI as gross annual minus total expenses", () => {
    const r = calculate(makeInputs());
    expect(r.noi).toBeCloseTo(r.grossAnnual - r.totalExpensesAnnual, 2);
  });

  test("should compute cash flow as NOI minus mortgage", () => {
    const r = calculate(makeInputs({ downPaymentPct: 50 }));
    expect(r.cashFlow).toBeCloseTo(r.noi - r.mortgageAnnual, 2);
  });

  test("should compute monthly cash flow as annual / 12", () => {
    const r = calculate(makeInputs());
    expect(r.monthlyCashFlow).toBeCloseTo(r.cashFlow / 12, 2);
  });

  test("should compute cap rate as NOI / total investment * 100", () => {
    const r = calculate(makeInputs());
    expect(r.capRatePct).toBeCloseTo((r.noi / r.totalInvestment) * 100, 2);
  });

  test("should compute cash-on-cash as annual cash flow / cash invested * 100", () => {
    const r = calculate(makeInputs());
    expect(r.cashOnCashPct).toBeCloseTo((r.cashFlow / r.cashInvested) * 100, 2);
  });

  test("should return 0 cap rate when total investment is 0", () => {
    const r = calculate(
      makeInputs({ purchasePrice: 0, rehabCost: 0, furnishingCost: 0 }),
    );
    expect(r.capRatePct).toBe(0);
  });

  test("should return 0 cash-on-cash when cash invested is 0", () => {
    const r = calculate(
      makeInputs({
        purchasePrice: 0,
        rehabCost: 0,
        furnishingCost: 0,
        downPaymentPct: 0,
      }),
    );
    expect(r.cashOnCashPct).toBe(0);
  });

  test("should compute future value using compound appreciation", () => {
    const r = calculate(
      makeInputs({
        purchasePrice: 1_000_000,
        appreciationPct: 10,
        holdYears: 3,
      }),
    );
    expect(r.futureValue).toBeCloseTo(1_000_000 * 1.1 ** 3, 2);
  });

  test("should compute total profit as cumulative cash flow plus appreciation gain", () => {
    const r = calculate(makeInputs({ holdYears: 3 }));
    const expectedProfit = r.cashFlow * 3 + (r.futureValue - 3_500_000);
    expect(r.totalProfit).toBeCloseTo(expectedProfit, 2);
  });

  test("should compute total return as total profit / cash invested * 100", () => {
    const r = calculate(makeInputs());
    expect(r.totalReturnPct).toBeCloseTo(
      (r.totalProfit / r.cashInvested) * 100,
      2,
    );
  });

  test("should return 0 annualized return when hold years is 0", () => {
    const r = calculate(makeInputs({ holdYears: 0 }));
    expect(r.annualizedReturnPct).toBe(0);
  });

  test("should produce higher gross annual for short-term with high nightly rate", () => {
    const longTerm = calculate(
      makeInputs({ isShortTerm: false, monthlyRent: 25_000, occupancyPct: 90 }),
    );
    const shortTerm = calculate(
      makeInputs({
        isShortTerm: true,
        nightlyRate: 2_500,
        nightsPerMonth: 22,
        occupancyPct: 90,
      }),
    );
    expect(shortTerm.grossAnnual).toBeGreaterThan(longTerm.grossAnnual);
  });

  test("should include platform and utility costs only for short-term", () => {
    const longTerm = calculate(makeInputs({ isShortTerm: false }));
    const shortTerm = calculate(
      makeInputs({ isShortTerm: true, nightlyRate: 1_800, nightsPerMonth: 20 }),
    );
    expect(shortTerm.platformAnnual).toBeGreaterThan(0);
    expect(shortTerm.utilitiesAnnual).toBeGreaterThan(0);
    expect(longTerm.platformAnnual).toBe(0);
    expect(longTerm.utilitiesAnnual).toBe(0);
  });

  test("should produce positive cash flow with the default inputs", () => {
    const r = calculate(makeInputs());
    expect(r.monthlyCashFlow).toBeGreaterThan(0);
  });

  test("leverage should reduce cash invested compared to all-cash purchase", () => {
    const allCash = calculate(makeInputs({ downPaymentPct: 100 }));
    const leveraged = calculate(
      makeInputs({ downPaymentPct: 30, loanRatePct: 9 }),
    );
    expect(leveraged.cashInvested).toBeLessThan(allCash.cashInvested);
    expect(leveraged.mortgageAnnual).toBeGreaterThan(0);
  });
});
