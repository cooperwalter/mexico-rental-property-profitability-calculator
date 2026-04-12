import { beforeEach, describe, expect, test } from "bun:test";
import type { CalculatorInputs } from "./calculations";
import {
  createLocalStorageBackend,
  createScenario,
  deleteScenario,
  type Scenario,
  type ScenarioStorage,
  scenarioHasChanges,
  updateScenario,
} from "./scenarios";

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
    loanPaymentType: "amortized",
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

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: "test-id-1",
    name: "Test Scenario",
    data: makeInputs(),
    ...overrides,
  };
}

function makeMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe("createLocalStorageBackend", () => {
  let storage: Storage;
  let backend: ScenarioStorage;

  beforeEach(() => {
    storage = makeMemoryStorage();
    backend = createLocalStorageBackend(storage);
  });

  test("should return empty array when storage is empty", () => {
    expect(backend.load()).toEqual([]);
  });

  test("should round-trip scenarios through save and load", () => {
    const scenarios = [
      makeScenario({ id: "a", name: "First" }),
      makeScenario({ id: "b", name: "Second" }),
    ];
    backend.save(scenarios);
    expect(backend.load()).toEqual(scenarios);
  });

  test("should return empty array when storage contains invalid JSON", () => {
    storage.setItem("cdmx-calc-scenarios", "not valid json{{{");
    expect(backend.load()).toEqual([]);
  });

  test("should overwrite previous data on save", () => {
    backend.save([makeScenario({ id: "old" })]);
    backend.save([makeScenario({ id: "new" })]);
    const loaded = backend.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("new");
  });

  test("should persist all scenario data fields", () => {
    const data = makeInputs({ purchasePrice: 9_999_999, isShortTerm: true });
    backend.save([makeScenario({ data })]);
    const loaded = backend.load();
    expect(loaded[0].data.purchasePrice).toBe(9_999_999);
    expect(loaded[0].data.isShortTerm).toBe(true);
  });
});

describe("createScenario", () => {
  test("should generate a unique id", () => {
    const a = createScenario("A", makeInputs(), 0);
    const b = createScenario("B", makeInputs(), 1);
    expect(a.id).not.toBe(b.id);
  });

  test("should use the provided name when non-empty", () => {
    const s = createScenario("My Scenario", makeInputs(), 0);
    expect(s.name).toBe("My Scenario");
  });

  test("should trim whitespace from name", () => {
    const s = createScenario("  padded name  ", makeInputs(), 0);
    expect(s.name).toBe("padded name");
  });

  test("should use fallback name when name is empty", () => {
    const s = createScenario("", makeInputs(), 2);
    expect(s.name).toBe("Scenario 3");
  });

  test("should use fallback name when name is only whitespace", () => {
    const s = createScenario("   ", makeInputs(), 0);
    expect(s.name).toBe("Scenario 1");
  });

  test("should store the provided data", () => {
    const data = makeInputs({ purchasePrice: 5_000_000 });
    const s = createScenario("Test", data, 0);
    expect(s.data).toEqual(data);
  });
});

describe("updateScenario", () => {
  test("should update the data of the matching scenario", () => {
    const scenarios = [makeScenario({ id: "a" }), makeScenario({ id: "b" })];
    const newData = makeInputs({ purchasePrice: 1 });
    const result = updateScenario(scenarios, "a", newData);
    expect(result[0].data.purchasePrice).toBe(1);
    expect(result[1].data.purchasePrice).toBe(3_500_000);
  });

  test("should not mutate the original array", () => {
    const scenarios = [makeScenario({ id: "a" })];
    const result = updateScenario(
      scenarios,
      "a",
      makeInputs({ purchasePrice: 1 }),
    );
    expect(result).not.toBe(scenarios);
    expect(scenarios[0].data.purchasePrice).toBe(3_500_000);
  });

  test("should preserve scenario name when updating data", () => {
    const scenarios = [makeScenario({ id: "a", name: "Keep This Name" })];
    const result = updateScenario(scenarios, "a", makeInputs());
    expect(result[0].name).toBe("Keep This Name");
  });

  test("should return scenarios unchanged when id does not match", () => {
    const scenarios = [makeScenario({ id: "a" })];
    const result = updateScenario(
      scenarios,
      "nonexistent",
      makeInputs({ purchasePrice: 1 }),
    );
    expect(result).toEqual(scenarios);
  });
});

describe("deleteScenario", () => {
  test("should remove the scenario with the matching id", () => {
    const scenarios = [
      makeScenario({ id: "a" }),
      makeScenario({ id: "b" }),
      makeScenario({ id: "c" }),
    ];
    const result = deleteScenario(scenarios, "b");
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(["a", "c"]);
  });

  test("should not mutate the original array", () => {
    const scenarios = [makeScenario({ id: "a" })];
    const result = deleteScenario(scenarios, "a");
    expect(result).not.toBe(scenarios);
    expect(scenarios).toHaveLength(1);
  });

  test("should return unchanged array when id does not match", () => {
    const scenarios = [makeScenario({ id: "a" })];
    const result = deleteScenario(scenarios, "nonexistent");
    expect(result).toEqual(scenarios);
  });

  test("should handle empty array", () => {
    expect(deleteScenario([], "any")).toEqual([]);
  });
});

describe("scenarioHasChanges", () => {
  test("should return false when scenario data matches current inputs", () => {
    const scenario = makeScenario({ data: makeInputs() });
    expect(scenarioHasChanges(scenario, makeInputs())).toBe(false);
  });

  test("should return true when a numeric field differs", () => {
    const scenario = makeScenario({
      data: makeInputs({ purchasePrice: 1_000_000 }),
    });
    expect(
      scenarioHasChanges(scenario, makeInputs({ purchasePrice: 2_000_000 })),
    ).toBe(true);
  });

  test("should return true when a boolean field differs", () => {
    const scenario = makeScenario({ data: makeInputs({ isShortTerm: false }) });
    expect(
      scenarioHasChanges(scenario, makeInputs({ isShortTerm: true })),
    ).toBe(true);
  });

  test("should return true when multiple fields differ", () => {
    const scenario = makeScenario({ data: makeInputs() });
    expect(
      scenarioHasChanges(
        scenario,
        makeInputs({ purchasePrice: 1, holdYears: 99 }),
      ),
    ).toBe(true);
  });
});
