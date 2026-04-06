import { describe, expect, test } from "bun:test";
import {
  type CalculatorInputs,
  calculate,
  calculateAnnualExpenses,
  calculateGrossMonthlyIncome,
  calculateMonthlyMortgage,
  calculateRemainingBalance,
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
    rentIncreasePct: 0,
    expenseInflationPct: 0,
    sellingCostPct: 0,
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

  test("should return principal divided by total months when interest rate is 0", () => {
    expect(calculateMonthlyMortgage(1_000_000, 0, 15)).toBeCloseTo(
      1_000_000 / (15 * 12),
      2,
    );
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

describe("calculateRemainingBalance", () => {
  test("should return 0 when loan amount is 0", () => {
    expect(calculateRemainingBalance(0, 12, 15, 5)).toBe(0);
  });

  test("should return linearly reduced balance when interest rate is 0", () => {
    expect(calculateRemainingBalance(1_000_000, 0, 15, 5)).toBeCloseTo(
      1_000_000 * (1 - 5 / 15),
      2,
    );
  });

  test("should return 0 when term is 0", () => {
    expect(calculateRemainingBalance(1_000_000, 12, 0, 5)).toBe(0);
  });

  test("should return 0 when loan amount is negative", () => {
    expect(calculateRemainingBalance(-500_000, 12, 15, 5)).toBe(0);
  });

  test("should return 0 when years elapsed equals or exceeds term", () => {
    expect(calculateRemainingBalance(1_000_000, 12, 15, 15)).toBe(0);
    expect(calculateRemainingBalance(1_000_000, 12, 15, 20)).toBe(0);
  });

  test("should return full loan amount when 0 years have elapsed", () => {
    expect(calculateRemainingBalance(1_000_000, 12, 15, 0)).toBeCloseTo(
      1_000_000,
      2,
    );
  });

  test("should return less than original loan after some payments", () => {
    const remaining = calculateRemainingBalance(1_000_000, 12, 15, 5);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThan(1_000_000);
  });

  test("should decrease as more years elapse", () => {
    const after3 = calculateRemainingBalance(1_000_000, 12, 15, 3);
    const after5 = calculateRemainingBalance(1_000_000, 12, 15, 5);
    const after10 = calculateRemainingBalance(1_000_000, 12, 15, 10);
    expect(after5).toBeLessThan(after3);
    expect(after10).toBeLessThan(after5);
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

  test("should inflate fixed costs (predial, HOA, insurance) by inflation rate and year", () => {
    const expenses = makeExpenseInputs();
    const base = calculateAnnualExpenses(300_000, expenses, false, 0, 0);
    const year3 = calculateAnnualExpenses(300_000, expenses, false, 5, 3);
    const inflationFactor = 1.05 ** 3;
    const fixedBase = 8_000 + 2_500 * 12 + 6_000;
    const fixedInflated = fixedBase * inflationFactor;
    expect(year3 - base).toBeCloseTo(fixedInflated - fixedBase, 2);
  });

  test("should not inflate percentage-based expenses (maintenance, management, platform)", () => {
    const expenses = makeExpenseInputs({
      predialAnnual: 0,
      hoaMonthly: 0,
      insuranceAnnual: 0,
      utilitiesMonthly: 0,
    });
    const year0 = calculateAnnualExpenses(300_000, expenses, false, 5, 0);
    const year3 = calculateAnnualExpenses(300_000, expenses, false, 5, 3);
    expect(year3).toBeCloseTo(year0, 2);
  });

  test("should inflate short-term utilities by inflation rate and year", () => {
    const expenses = makeExpenseInputs({
      predialAnnual: 0,
      hoaMonthly: 0,
      insuranceAnnual: 0,
      maintenancePct: 0,
      managementFeePct: 0,
      platformFeePct: 0,
      utilitiesMonthly: 3_000,
    });
    const result = calculateAnnualExpenses(300_000, expenses, true, 10, 2);
    expect(result).toBeCloseTo(3_000 * 12 * 1.1 ** 2, 2);
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

  test("should apply occupancy rate to long-term gross monthly income", () => {
    const r = calculate(
      makeInputs({ monthlyRent: 20_000, occupancyPct: 75, isShortTerm: false }),
    );
    expect(r.effectiveMonthly).toBe(15_000);
    expect(r.grossAnnual).toBe(180_000);
  });

  test("should not apply occupancy rate to short-term income since nights booked already captures vacancy", () => {
    const r = calculate(
      makeInputs({
        isShortTerm: true,
        nightlyRate: 2_000,
        nightsPerMonth: 15,
        occupancyPct: 80,
      }),
    );
    expect(r.effectiveMonthly).toBe(30_000);
    expect(r.grossAnnual).toBe(360_000);
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

  test("should compute cap rate as NOI / purchase price * 100", () => {
    const r = calculate(makeInputs({ purchasePrice: 3_500_000 }));
    expect(r.capRatePct).toBeCloseTo((r.noi / 3_500_000) * 100, 2);
  });

  test("should compute cash-on-cash as annual cash flow / cash invested * 100", () => {
    const r = calculate(makeInputs());
    expect(r.cashOnCashPct).toBeCloseTo((r.cashFlow / r.cashInvested) * 100, 2);
  });

  test("should return 0 cap rate when purchase price is 0", () => {
    const r = calculate(makeInputs({ purchasePrice: 0 }));
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

  test("should compute future value using compound appreciation on purchase price plus rehab", () => {
    const r = calculate(
      makeInputs({
        purchasePrice: 1_000_000,
        rehabCost: 200_000,
        appreciationPct: 10,
        holdYears: 3,
      }),
    );
    expect(r.futureValue).toBeCloseTo(1_200_000 * 1.1 ** 3, 2);
  });

  test("should compute total profit as sale proceeds plus cash flow minus cash invested", () => {
    const r = calculate(makeInputs({ holdYears: 3 }));
    const saleProceeds = r.futureValue;
    const expectedProfit = saleProceeds + r.cumulativeCashFlow - r.cashInvested;
    expect(r.totalProfit).toBeCloseTo(expectedProfit, 2);
  });

  test("should compute total return as total profit / cash invested * 100", () => {
    const r = calculate(makeInputs());
    expect(r.totalReturnPct).toBeCloseTo(
      (r.totalProfit / r.cashInvested) * 100,
      2,
    );
  });

  test("should return 0 total return when cash invested is 0", () => {
    const r = calculate(
      makeInputs({
        purchasePrice: 0,
        rehabCost: 0,
        furnishingCost: 0,
        downPaymentPct: 0,
      }),
    );
    expect(r.totalReturnPct).toBe(0);
  });

  test("should return 0 annualized return when hold years is 0", () => {
    const r = calculate(makeInputs({ holdYears: 0 }));
    expect(r.annualizedReturnPct).toBe(0);
  });

  test("should return -100 annualized return when total loss exceeds cash invested", () => {
    const r = calculate(
      makeInputs({
        downPaymentPct: 20,
        occupancyPct: 0,
        appreciationPct: 0,
        holdYears: 7,
      }),
    );
    expect(r.totalReturnPct).toBeLessThan(-100);
    expect(r.annualizedReturnPct).toBe(-100);
  });

  test("should return 0 annualized return when cash invested is 0", () => {
    const r = calculate(
      makeInputs({
        purchasePrice: 0,
        rehabCost: 0,
        furnishingCost: 0,
        downPaymentPct: 0,
      }),
    );
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

  test("cumulative cash flow should equal cashFlow * holdYears when rent increase is 0%", () => {
    const r = calculate(makeInputs({ rentIncreasePct: 0, holdYears: 5 }));
    expect(r.cumulativeCashFlow).toBeCloseTo(r.cashFlow * 5, 2);
  });

  test("cumulative cash flow should exceed flat projection when rent increases annually", () => {
    const flat = calculate(makeInputs({ rentIncreasePct: 0, holdYears: 5 }));
    const growing = calculate(makeInputs({ rentIncreasePct: 6, holdYears: 5 }));
    expect(growing.cumulativeCashFlow).toBeGreaterThan(flat.cumulativeCashFlow);
  });

  test("total profit should subtract closing, rehab, and furnishing costs", () => {
    const r = calculate(makeInputs({ rentIncreasePct: 4, holdYears: 3 }));
    const saleProceeds = r.futureValue;
    const expectedProfit = saleProceeds + r.cumulativeCashFlow - r.cashInvested;
    expect(r.totalProfit).toBeCloseTo(expectedProfit, 2);
  });

  test("selling costs should reduce total profit by a percentage of future value", () => {
    const noSelling = calculate(
      makeInputs({ sellingCostPct: 0, holdYears: 5 }),
    );
    const withSelling = calculate(
      makeInputs({ sellingCostPct: 6, holdYears: 5 }),
    );
    expect(withSelling.sellingCosts).toBeCloseTo(
      withSelling.futureValue * 0.06,
      2,
    );
    expect(withSelling.totalProfit).toBeCloseTo(
      noSelling.totalProfit - withSelling.sellingCosts,
      2,
    );
  });

  test("total profit with financing should account for remaining loan balance", () => {
    const r = calculate(
      makeInputs({ downPaymentPct: 30, loanRatePct: 12, holdYears: 5 }),
    );
    expect(r.equityBuildup).toBeGreaterThan(0);
    const remaining = r.loanAmount - r.equityBuildup;
    const saleProceeds = r.futureValue - remaining;
    const expectedProfit = saleProceeds + r.cumulativeCashFlow - r.cashInvested;
    expect(r.totalProfit).toBeCloseTo(expectedProfit, 2);
  });

  test("equity buildup should be 0 when paying 100% cash", () => {
    const r = calculate(makeInputs({ downPaymentPct: 100 }));
    expect(r.equityBuildup).toBe(0);
  });

  test("year snapshot principal + interest should equal debt service", () => {
    const r = calculate(
      makeInputs({ downPaymentPct: 30, loanRatePct: 12, holdYears: 5 }),
    );
    for (const s of r.yearSnapshots) {
      expect(s.principalPaid + s.interestPaid).toBeCloseTo(s.mortgageAnnual, 2);
    }
  });

  test("sum of yearly principal paid should equal equity buildup", () => {
    const r = calculate(
      makeInputs({ downPaymentPct: 30, loanRatePct: 12, holdYears: 5 }),
    );
    const totalPrincipal = r.yearSnapshots.reduce(
      (a, s) => a + s.principalPaid,
      0,
    );
    expect(totalPrincipal).toBeCloseTo(r.equityBuildup, 2);
  });

  test("principal paid should increase each year as interest decreases", () => {
    const r = calculate(
      makeInputs({ downPaymentPct: 30, loanRatePct: 12, holdYears: 5 }),
    );
    for (let i = 1; i < r.yearSnapshots.length; i++) {
      expect(r.yearSnapshots[i].principalPaid).toBeGreaterThan(
        r.yearSnapshots[i - 1].principalPaid,
      );
      expect(r.yearSnapshots[i].interestPaid).toBeLessThan(
        r.yearSnapshots[i - 1].interestPaid,
      );
    }
  });

  test("mortgage should be 0 for years after loan term ends", () => {
    const r = calculate(
      makeInputs({
        downPaymentPct: 30,
        loanRatePct: 12,
        loanTermYears: 3,
        holdYears: 5,
      }),
    );
    for (const s of r.yearSnapshots) {
      if (s.year <= 3) {
        expect(s.mortgageAnnual).toBeGreaterThan(0);
      } else {
        expect(s.mortgageAnnual).toBe(0);
        expect(s.principalPaid).toBe(0);
        expect(s.interestPaid).toBe(0);
        expect(s.cashFlow).toBe(s.noi);
      }
    }
  });

  test("rent increase should compound correctly year over year", () => {
    const r = calculate(
      makeInputs({
        rentIncreasePct: 10,
        holdYears: 3,
        downPaymentPct: 100,
        predialAnnual: 0,
        maintenancePct: 0,
        hoaMonthly: 0,
        insuranceAnnual: 0,
        managementFeePct: 0,
        appreciationPct: 0,
      }),
    );
    const year1 = r.grossAnnual;
    const year2 = r.grossAnnual * 1.1;
    const year3 = r.grossAnnual * 1.1 ** 2;
    expect(r.cumulativeCashFlow).toBeCloseTo(year1 + year2 + year3, 2);
  });

  test("expense inflation should increase total expenses year over year", () => {
    const r = calculate(
      makeInputs({
        expenseInflationPct: 5,
        rentIncreasePct: 0,
        holdYears: 3,
      }),
    );
    expect(r.yearSnapshots[1].totalExpenses).toBeGreaterThan(
      r.yearSnapshots[0].totalExpenses,
    );
    expect(r.yearSnapshots[2].totalExpenses).toBeGreaterThan(
      r.yearSnapshots[1].totalExpenses,
    );
  });

  test("should return one snapshot per hold year", () => {
    const r = calculate(makeInputs({ holdYears: 7 }));
    expect(r.yearSnapshots).toHaveLength(7);
    expect(r.yearSnapshots[0].year).toBe(1);
    expect(r.yearSnapshots[6].year).toBe(7);
  });

  test("should return empty snapshots when hold years is 0", () => {
    const r = calculate(makeInputs({ holdYears: 0 }));
    expect(r.yearSnapshots).toHaveLength(0);
  });

  test("year 1 snapshot should match top-level year-1 values", () => {
    const r = calculate(makeInputs({ rentIncreasePct: 5, holdYears: 3 }));
    const snap = r.yearSnapshots[0];
    expect(snap.grossAnnual).toBeCloseTo(r.grossAnnual, 2);
    expect(snap.totalExpenses).toBeCloseTo(r.totalExpensesAnnual, 2);
    expect(snap.noi).toBeCloseTo(r.noi, 2);
    expect(snap.cashFlow).toBeCloseTo(r.cashFlow, 2);
  });

  test("later year snapshots should reflect compounded rent growth", () => {
    const r = calculate(makeInputs({ rentIncreasePct: 10, holdYears: 3 }));
    expect(r.yearSnapshots[1].grossAnnual).toBeCloseTo(r.grossAnnual * 1.1, 2);
    expect(r.yearSnapshots[2].grossAnnual).toBeCloseTo(
      r.grossAnnual * 1.1 ** 2,
      2,
    );
  });
});
