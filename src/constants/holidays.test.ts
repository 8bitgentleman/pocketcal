/**
 * Test suite for holiday calendar functionality
 * Testing holiday blocking and date conversion functions
 */

import { describe, it, expect } from 'vitest';
import {
  HOLIDAYS_2025,
  getHoliday,
  isHoliday,
  getAllHolidayDates,
  isoDateToMMDD,
  getHolidayFromISODate,
  isHolidayFromISODate
} from './holidays';

describe('Holiday Calendar 2025', () => {
  describe('HOLIDAYS_2025 constant', () => {
    it('should contain all expected holidays', () => {
      const expectedHolidays = [
        101,  // New Year's Day
        120,  // MLK Jr. Day
        526,  // Memorial Day
        619,  // Juneteenth
        703,  // Independence Day Eve
        704,  // Independence Day
        901,  // Labor Day
        1013, // Indigenous People's Day
        1127, // Thanksgiving
        1128, // Day after Thanksgiving
        1225, // Christmas
        1226, // Unispace Gift Day
        1227, // Unispace Gift Day
        1230, // Unispace Gift Day
        1231  // Unispace Gift Day
      ];

      expectedHolidays.forEach(date => {
        expect(HOLIDAYS_2025).toHaveProperty(date.toString());
      });
    });

    it('should have correct holiday names', () => {
      expect(HOLIDAYS_2025[101]).toBe("New Year's Day");
      expect(HOLIDAYS_2025[120]).toBe("MLK Jr. Day");
      expect(HOLIDAYS_2025[704]).toBe("Independence Day");
      expect(HOLIDAYS_2025[1225]).toBe("Christmas");
      expect(HOLIDAYS_2025[1226]).toBe("Unispace Gift Day");
    });
  });

  describe('getHoliday', () => {
    it('should return holiday name for valid holiday dates', () => {
      expect(getHoliday(101, 2025)).toBe("New Year's Day");
      expect(getHoliday(704, 2025)).toBe("Independence Day");
      expect(getHoliday(1225, 2025)).toBe("Christmas");
    });

    it('should return null for non-holiday dates', () => {
      expect(getHoliday(102)).toBe(null);
      expect(getHoliday(315)).toBe(null);
      expect(getHoliday(1224)).toBe(null);
    });
  });

  describe('isHoliday', () => {
    it('should return true for holiday dates', () => {
      expect(isHoliday(101, 2025)).toBe(true);
      expect(isHoliday(704, 2025)).toBe(true);
      expect(isHoliday(1225, 2025)).toBe(true);
      expect(isHoliday(1226, 2025)).toBe(true);
    });

    it('should return false for non-holiday dates', () => {
      expect(isHoliday(102)).toBe(false);
      expect(isHoliday(315)).toBe(false);
      expect(isHoliday(1224)).toBe(false);
    });
  });

  describe('getAllHolidayDates', () => {
    it('should return all holiday dates as numbers', () => {
      const dates = getAllHolidayDates(2025);
      expect(dates).toContain(101);
      expect(dates).toContain(704);
      expect(dates).toContain(1225);
      expect(dates.length).toBeGreaterThan(10);
    });

    it('should return dates in numerical format', () => {
      const dates = getAllHolidayDates();
      dates.forEach(date => {
        expect(typeof date).toBe('number');
        expect(date).toBeGreaterThan(0);
        expect(date).toBeLessThan(1232); // Max possible date in MMDD format
      });
    });
  });

  describe('isoDateToMMDD', () => {
    it('should convert ISO dates to MMDD format correctly', () => {
      expect(isoDateToMMDD('2025-01-01')).toBe(101);
      expect(isoDateToMMDD('2025-07-04')).toBe(704);
      expect(isoDateToMMDD('2025-12-25')).toBe(1225);
    });

    it('should handle single digit months and days', () => {
      expect(isoDateToMMDD('2025-01-05')).toBe(105);
      expect(isoDateToMMDD('2025-09-03')).toBe(903);
    });

    it('should handle double digit months and days', () => {
      expect(isoDateToMMDD('2025-10-15')).toBe(1015);
      expect(isoDateToMMDD('2025-11-27')).toBe(1127);
      expect(isoDateToMMDD('2025-12-31')).toBe(1231);
    });

    it('should work with different years (only month/day matter)', () => {
      expect(isoDateToMMDD('2024-07-04')).toBe(704);
      expect(isoDateToMMDD('2026-12-25')).toBe(1225);
    });
  });

  describe('getHolidayFromISODate', () => {
    it('should return holiday name for ISO date holidays', () => {
      expect(getHolidayFromISODate('2025-01-01')).toBe("New Year's Day");
      expect(getHolidayFromISODate('2025-07-04')).toBe("Independence Day");
      expect(getHolidayFromISODate('2025-12-25')).toBe("Christmas");
    });

    it('should return null for non-holiday ISO dates', () => {
      expect(getHolidayFromISODate('2025-01-02')).toBe(null);
      expect(getHolidayFromISODate('2025-03-15')).toBe(null);
      expect(getHolidayFromISODate('2025-12-24')).toBe(null);
    });

    it('should work regardless of year', () => {
      expect(getHolidayFromISODate('2024-07-04')).toBe("Independence Day");
      expect(getHolidayFromISODate('2026-12-25')).toBe("Christmas");
    });
  });

  describe('isHolidayFromISODate', () => {
    it('should return true for ISO date holidays', () => {
      expect(isHolidayFromISODate('2025-01-01')).toBe(true);
      expect(isHolidayFromISODate('2025-07-04')).toBe(true);
      expect(isHolidayFromISODate('2025-12-25')).toBe(true);
      expect(isHolidayFromISODate('2025-12-26')).toBe(true); // Unispace Gift Day
    });

    it('should return false for non-holiday ISO dates', () => {
      expect(isHolidayFromISODate('2025-01-02')).toBe(false);
      expect(isHolidayFromISODate('2025-03-15')).toBe(false);
      expect(isHolidayFromISODate('2025-12-24')).toBe(false);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle February dates correctly', () => {
      expect(isoDateToMMDD('2025-02-14')).toBe(214); // Valentine's Day
      expect(isHolidayFromISODate('2025-02-14')).toBe(false);
    });

    it('should handle New Year transition dates', () => {
      expect(isHolidayFromISODate('2025-12-31')).toBe(true); // Unispace Gift Day
      expect(isHolidayFromISODate('2026-01-01')).toBe(true); // New Year's Day
    });

    it('should handle all Unispace Gift Days', () => {
      expect(isHolidayFromISODate('2025-12-26')).toBe(true);
      expect(isHolidayFromISODate('2025-12-27')).toBe(true);
      expect(isHolidayFromISODate('2025-12-30')).toBe(true);
      expect(isHolidayFromISODate('2025-12-31')).toBe(true);
    });

    it('should handle Independence Day Eve correctly', () => {
      expect(isHolidayFromISODate('2025-07-03')).toBe(true);
      expect(getHolidayFromISODate('2025-07-03')).toBe("Independence Day Eve");
    });

    it('should handle Thanksgiving and day after', () => {
      expect(isHolidayFromISODate('2025-11-27')).toBe(true); // Thanksgiving
      expect(isHolidayFromISODate('2025-11-28')).toBe(true); // Day after
      expect(getHolidayFromISODate('2025-11-27')).toBe("Thanksgiving");
      expect(getHolidayFromISODate('2025-11-28')).toBe("Day after Thanksgiving");
    });
  });

  describe('Integration with PTO System', () => {
    it('should block PTO requests on all company holidays', () => {
      const allHolidays = getAllHolidayDates(2025);

      allHolidays.forEach(mmddDate => {
        // Convert MMDD back to ISO date for 2025
        const month = Math.floor(mmddDate / 100);
        const day = mmddDate % 100;
        const isoDate = `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        expect(isHolidayFromISODate(isoDate)).toBe(true);
      });
    });

    it('should allow PTO requests on business days', () => {
      const businessDays = [
        '2025-01-02', // Day after New Year
        '2025-07-01', // Day before July 4th Eve
        '2025-12-23', // Day before Christmas Eve
        '2025-11-26', // Day before Thanksgiving
      ];

      businessDays.forEach(date => {
        expect(isHolidayFromISODate(date)).toBe(false);
      });
    });
  });
});