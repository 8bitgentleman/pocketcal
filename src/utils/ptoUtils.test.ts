/**
 * Comprehensive test suite for PTO utility functions
 * Testing mathematical precision and edge cases
 */

import { describe, it, expect } from 'vitest';
import { PTOCalendarUtils, PTOEntry, PTOConfig } from './ptoUtils';

describe('PTOCalendarUtils', () => {
  describe('calculateAccruedPTO', () => {
    it('should calculate accrued PTO correctly for January 1st', () => {
      const result = PTOCalendarUtils.calculateAccruedPTO(101, 0, 168);
      expect(result).toBe(0); // No days elapsed on Jan 1st
    });

    it('should calculate accrued PTO correctly for mid-year (July 1st)', () => {
      const result = PTOCalendarUtils.calculateAccruedPTO(701, 0, 168);
      // July 1st is day 181 of year (180 days elapsed)
      const expected = Math.floor(180 * (168 / 365));
      expect(result).toBe(expected);
    });

    it('should include rollover hours in calculation', () => {
      const rollover = 40;
      const result = PTOCalendarUtils.calculateAccruedPTO(701, rollover, 168);
      const basePTO = Math.floor(180 * (168 / 365));
      expect(result).toBe(basePTO + rollover);
    });

    it('should handle end of year correctly', () => {
      const result = PTOCalendarUtils.calculateAccruedPTO(1231, 0, 168);
      // Dec 31st should give nearly full PTO (364 days elapsed)
      const expected = Math.floor(364 * (168 / 365));
      expect(result).toBe(expected);
    });

    it('should handle leap year calculations (non-leap year 2025)', () => {
      const result = PTOCalendarUtils.calculateAccruedPTO(301, 0, 168);
      // March 1st is day 60 (59 days elapsed) in non-leap year
      const expected = Math.floor(59 * (168 / 365));
      expect(result).toBe(expected);
    });
  });

  describe('validatePTORequest', () => {
    it('should validate successful PTO request', () => {
      const ptoHours = { 501: 8, 502: 4 }; // 12 hours used
      const result = PTOCalendarUtils.validatePTORequest(
        503, // May 3rd
        8,   // Request 8 hours
        ptoHours,
        168, // Total hours
        0    // No rollover
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject PTO request exceeding total allowance', () => {
      const ptoHours = { 501: 80, 502: 80 }; // 160 hours used
      const result = PTOCalendarUtils.validatePTORequest(
        503, // May 3rd
        16,  // Request 16 hours (would exceed 168 total)
        ptoHours,
        168, // Total hours
        0    // No rollover
      );
      expect(result.isValid).toBe(false);
      expect(result.warning).toContain('Exceeds total PTO allowance');
    });

    it('should account for rollover hours in validation', () => {
      const ptoHours = { 501: 160 }; // 160 hours used
      const result = PTOCalendarUtils.validatePTORequest(
        502, // May 2nd
        8,   // Request 8 hours
        ptoHours,
        168, // Total hours
        40   // Rollover hours (208 total available)
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculateTotalPTOHours', () => {
    it('should return 168 hours for less than 5 years of service', () => {
      expect(PTOCalendarUtils.calculateTotalPTOHours(0)).toBe(168);
      expect(PTOCalendarUtils.calculateTotalPTOHours(2)).toBe(168);
      expect(PTOCalendarUtils.calculateTotalPTOHours(4)).toBe(168);
    });

    it('should return 208 hours for 5 or more years of service', () => {
      expect(PTOCalendarUtils.calculateTotalPTOHours(5)).toBe(208);
      expect(PTOCalendarUtils.calculateTotalPTOHours(10)).toBe(208);
      expect(PTOCalendarUtils.calculateTotalPTOHours(25)).toBe(208);
    });
  });

  describe('calculateTotalPTODays', () => {
    it('should return 21 days for less than 5 years of service', () => {
      expect(PTOCalendarUtils.calculateTotalPTODays(3)).toBe(21);
    });

    it('should return 26 days for 5+ years of service', () => {
      expect(PTOCalendarUtils.calculateTotalPTODays(5)).toBe(26);
    });
  });

  describe('isValidPTOHours', () => {
    it('should accept valid PTO hour increments', () => {
      expect(PTOCalendarUtils.isValidPTOHours(2)).toBe(true);
      expect(PTOCalendarUtils.isValidPTOHours(4)).toBe(true);
      expect(PTOCalendarUtils.isValidPTOHours(8)).toBe(true);
    });

    it('should reject invalid PTO hour increments', () => {
      expect(PTOCalendarUtils.isValidPTOHours(1)).toBe(false);
      expect(PTOCalendarUtils.isValidPTOHours(3)).toBe(false);
      expect(PTOCalendarUtils.isValidPTOHours(6)).toBe(false);
      expect(PTOCalendarUtils.isValidPTOHours(12)).toBe(false);
    });
  });

  describe('hoursToDayFraction', () => {
    it('should convert hours to correct day fractions', () => {
      expect(PTOCalendarUtils.hoursToDayFraction(2)).toBe(0.25);
      expect(PTOCalendarUtils.hoursToDayFraction(4)).toBe(0.5);
      expect(PTOCalendarUtils.hoursToDayFraction(8)).toBe(1.0);
    });

    it('should throw error for invalid hours', () => {
      expect(() => PTOCalendarUtils.hoursToDayFraction(6)).toThrow();
    });
  });

  describe('dayFractionToHours', () => {
    it('should convert day fractions to correct hours', () => {
      expect(PTOCalendarUtils.dayFractionToHours(0.25)).toBe(2);
      expect(PTOCalendarUtils.dayFractionToHours(0.5)).toBe(4);
      expect(PTOCalendarUtils.dayFractionToHours(1.0)).toBe(8);
    });

    it('should throw error for invalid fractions', () => {
      expect(() => PTOCalendarUtils.dayFractionToHours(0.75)).toThrow();
    });
  });

  describe('calculateRemainingPTO', () => {
    const entries: PTOEntry[] = [
      { date: '2025-01-15', hours: 8 },
      { date: '2025-02-10', hours: 4 },
      { date: '2025-03-05', hours: 2 }
    ];

    it('should calculate remaining PTO correctly', () => {
      const result = PTOCalendarUtils.calculateRemainingPTO(entries, 168, 0);
      expect(result).toBe(154); // 168 - 14 used
    });

    it('should include rollover hours', () => {
      const result = PTOCalendarUtils.calculateRemainingPTO(entries, 168, 40);
      expect(result).toBe(194); // 168 + 40 - 14 used
    });
  });

  describe('calculatePTOSummary', () => {
    const config: PTOConfig = {
      yearsOfService: 3,
      rolloverHours: 20,
      isEnabled: true
    };

    const entries: PTOEntry[] = [
      { date: '2025-01-15', hours: 8, name: 'Vacation' },
      { date: '2025-02-10', hours: 4, name: 'Personal' }
    ];

    it('should calculate comprehensive PTO summary', () => {
      const summary = PTOCalendarUtils.calculatePTOSummary(entries, config);
      
      expect(summary.totalHours).toBe(188); // 168 + 20 rollover
      expect(summary.usedHours).toBe(12);
      expect(summary.remainingHours).toBe(176);
      expect(summary.totalDays).toBe(23.5); // 188 / 8
      expect(summary.usedDays).toBe(1.5); // 12 / 8
      expect(summary.remainingDays).toBe(22); // 176 / 8
      expect(summary.accrualRate).toBe(188 / 365);
    });

    it('should handle senior employee PTO calculation', () => {
      const seniorConfig: PTOConfig = {
        yearsOfService: 7,
        rolloverHours: 30,
        isEnabled: true
      };
      
      const summary = PTOCalendarUtils.calculatePTOSummary([], seniorConfig);
      
      expect(summary.totalHours).toBe(238); // 208 + 30 rollover
      expect(summary.totalDays).toBe(29.75); // 238 / 8
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle February 29th in non-leap year gracefully', () => {
      // Should not throw error even though Feb 29 doesn't exist in 2025
      expect(() => PTOCalendarUtils.calculateAccruedPTO(229, 0, 168)).not.toThrow();
    });

    it('should handle maximum rollover scenarios', () => {
      const result = PTOCalendarUtils.calculateRemainingPTO([], 208, 208);
      expect(result).toBe(416); // Maximum possible PTO
    });

    it('should validate zero hours correctly', () => {
      expect(PTOCalendarUtils.isValidPTOHours(0)).toBe(false);
    });

    it('should handle empty PTO entries array', () => {
      const config: PTOConfig = {
        yearsOfService: 5,
        rolloverHours: 0,
        isEnabled: true
      };
      
      const summary = PTOCalendarUtils.calculatePTOSummary([], config);
      expect(summary.usedHours).toBe(0);
      expect(summary.remainingHours).toBe(208);
    });
  });
});