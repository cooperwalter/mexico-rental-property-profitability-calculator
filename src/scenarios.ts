import type { CalculatorInputs } from "./calculations";

export interface Scenario {
  id: string;
  name: string;
  data: CalculatorInputs;
}

const STORAGE_KEY = "cdmx-calc-scenarios";

export interface ScenarioStorage {
  load(): Scenario[];
  save(scenarios: Scenario[]): void;
}

export function createLocalStorageBackend(storage: Storage): ScenarioStorage {
  return {
    load(): Scenario[] {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },
    save(scenarios: Scenario[]) {
      storage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    },
  };
}

export function createScenario(
  name: string,
  data: CalculatorInputs,
  fallbackIndex: number,
): Scenario {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || `Scenario ${fallbackIndex + 1}`,
    data,
  };
}

export function updateScenario(
  scenarios: Scenario[],
  id: string,
  data: CalculatorInputs,
): Scenario[] {
  return scenarios.map((s) => (s.id === id ? { ...s, data } : s));
}

export function deleteScenario(scenarios: Scenario[], id: string): Scenario[] {
  return scenarios.filter((s) => s.id !== id);
}

export function scenarioHasChanges(
  scenario: Scenario,
  current: CalculatorInputs,
): boolean {
  return JSON.stringify(scenario.data) !== JSON.stringify(current);
}
