import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { useStore } from '../store';
import type { EventGroup, PTOEntry, PTOConfig } from '../store';

/**
 * Custom render function for testing components with Zustand store
 */
export function renderWithStore(
  ui: ReactElement,
  options?: RenderOptions,
) {
  return render(ui, options);
}

/**
 * Reset the Zustand store to initial state
 */
export function resetStore() {
  useStore.setState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    includeWeekends: false,
    showToday: true,
    eventGroups: [],
    selectedGroupId: null,
    showHelpModal: false,
    isDarkMode: false,
    licenseKey: null,
    isProUser: false,
  });
}

/**
 * Create a mock EventGroup for testing
 */
export function createMockEventGroup(overrides?: Partial<EventGroup>): EventGroup {
  return {
    id: 'test-group-1',
    name: 'Test Calendar',
    color: '#3b82f6',
    ranges: [],
    ptoEntries: [],
    ...overrides,
  };
}

/**
 * Create a mock PTOEntry for testing
 */
export function createMockPTOEntry(overrides?: Partial<PTOEntry>): PTOEntry {
  return {
    id: 'test-entry-1',
    startDate: '2025-01-15',
    endDate: '2025-01-15',
    hoursPerDay: 8,
    totalHours: 8,
    name: 'Test PTO',
    ...overrides,
  };
}

/**
 * Create a mock PTOConfig for testing
 */
export function createMockPTOConfig(overrides?: Partial<PTOConfig>): PTOConfig {
  return {
    yearsOfService: 5,
    rolloverHours: 0,
    isEnabled: true,
    ...overrides,
  };
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const storage: { [key: string]: string } = {};

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
  };
}

/**
 * Wait for next tick (useful for async state updates)
 */
export function waitForNextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create a date string in ISO format (YYYY-MM-DD)
 */
export function createISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Get a date range for testing
 */
export function createDateRange(startYear: number, startMonth: number, startDay: number, endYear: number, endMonth: number, endDay: number) {
  return {
    start: createISODate(startYear, startMonth, startDay),
    end: createISODate(endYear, endMonth, endDay),
  };
}
