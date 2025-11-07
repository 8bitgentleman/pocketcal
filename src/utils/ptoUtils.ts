/**
 * PTO Calendar Utilities
 * Mathematical precision functions for PTO calculation and validation
 */

import { isWeekend } from 'date-fns';

export interface PTOEntry {
  id?: string;         // Unique identifier for the entry
  startDate: string;   // ISO date format (YYYY-MM-DD)
  endDate: string;     // ISO date format (YYYY-MM-DD) - same as startDate for single day
  hoursPerDay: number; // 2, 4, or 8 hours per day
  totalHours: number;  // calculated: hoursPerDay * number of days
  name?: string;       // Optional description
}

export interface PTOConfig {
  yearsOfService: number;
  rolloverHours: number;
  isEnabled: boolean;
}

export class PTOCalendarUtils {
  /**
   * Calculates accrued PTO based on the current date
   * @param date Date in MMDD format
   * @param rollover Rollover hours from previous year
   * @param totalHours Total hours for the year
   * @returns Accrued PTO hours (floored)
   */
  static calculateAccruedPTO(
    date: number,       // Date in MMDD format
    rollover: number,   // Rollover hours from previous year
    totalHours: number  // Total hours for the year
  ): number {
    const start = new Date(2025, 0, 1);
    const target = new Date(2025, Math.floor(date / 100) - 1, date % 100);

    // Calculate days that have completed (not including current day)
    // For July 1, we want days from Jan 1 through June 30 (180 days)
    const dayBefore = new Date(target);
    dayBefore.setDate(dayBefore.getDate() - 1);

    // If target is Jan 1, dayBefore is Dec 31 prev year, so return 0
    if (dayBefore < start) {
      return Math.floor(rollover);
    }

    // Use UTC to avoid DST issues affecting day count
    const days = Math.floor((Date.UTC(dayBefore.getFullYear(), dayBefore.getMonth(), dayBefore.getDate()) -
                             Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
                            (1000 * 60 * 60 * 24)) + 1;
    return Math.floor(rollover + (days * (totalHours / 365)));
  }

  /**
   * Validates a PTO request against available hours
   * @param date Date in MMDD format
   * @param hours Hours to request (2, 4, or 8)
   * @param ptoHours Record of existing PTO hours by date
   * @param totalHours Total hours for the year
   * @param rollover Rollover hours from previous year
   * @returns Validation result with warning if invalid
   */
  static validatePTORequest(
    _date: number,
    hours: number,
    ptoHours: Record<number, number>,
    totalHours: number,
    rollover: number
  ): { isValid: boolean; warning?: string } {
    const totalAvailable = totalHours + rollover;
    const totalPlanned = Object.values(ptoHours).reduce((sum, h) => sum + h, 0) + hours;
    
    if (totalPlanned > totalAvailable) {
      return {
        isValid: false,
        warning: `Exceeds total PTO allowance for the year (${totalAvailable}h)`
      };
    }
    
    return { isValid: true };
  }

  /**
   * Calculates annual PTO hours allowance for a given years of service
   * @param yearsOfService Number of years of service
   * @returns Annual PTO hours for the year
   */
  static calculateAnnualPTOHours(yearsOfService: number): number {
    // < 5 years: 21 days (168 hours)
    // 5+ years: 26 days (208 hours)
    return yearsOfService < 5 ? 168 : 208;
  }

  /**
   * Calculates total PTO days for a given years of service
   * @param yearsOfService Number of years of service
   * @returns Total PTO days for the year
   */
  static calculateTotalPTODays(yearsOfService: number): number {
    return yearsOfService < 5 ? 21 : 26;
  }

  /**
   * Validates PTO hours (must be 2, 4, or 8)
   * @param hours Hours to validate
   * @returns True if valid PTO hours increment
   */
  static isValidPTOHours(hours: number): boolean {
    return hours === 2 || hours === 4 || hours === 8;
  }

  /**
   * Converts PTO hours to fraction of day
   * @param hours PTO hours (2, 4, or 8)
   * @returns Fraction of day (0.25, 0.5, or 1.0)
   */
  static hoursToDayFraction(hours: number): number {
    switch (hours) {
      case 2: return 0.25;
      case 4: return 0.5;
      case 8: return 1.0;
      default: throw new Error(`Invalid PTO hours: ${hours}`);
    }
  }

  /**
   * Converts day fraction to PTO hours
   * @param fraction Fraction of day (0.25, 0.5, or 1.0)
   * @returns PTO hours (2, 4, or 8)
   */
  static dayFractionToHours(fraction: number): number {
    switch (fraction) {
      case 0.25: return 2;
      case 0.5: return 4;
      case 1.0: return 8;
      default: throw new Error(`Invalid day fraction: ${fraction}`);
    }
  }

  /**
   * Calculates total hours for a multi-day PTO entry
   * @param startDate Start date in ISO format
   * @param endDate End date in ISO format  
   * @param hoursPerDay Hours per day (2, 4, or 8)
   * @returns Total hours for the PTO entry (excluding weekends)
   */
  static calculateTotalPTOHours(
    startDate: string,
    endDate: string,
    hoursPerDay: number
  ): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Count only weekdays between start and end dates (inclusive)
    let workDays = 0;
    const current = new Date(start);
    
    while (current <= end) {
      if (!isWeekend(current)) {
        workDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workDays * hoursPerDay;
  }

  /**
   * Creates a single-day PTO entry
   * @param date Date in ISO format
   * @param hours Hours (2, 4, or 8)
   * @param name Optional description
   * @returns PTOEntry for single day
   */
  static createSingleDayEntry(date: string, hours: number, name?: string): PTOEntry {
    return {
      startDate: date,
      endDate: date,
      hoursPerDay: hours,
      totalHours: hours,
      name
    };
  }

  /**
   * Creates a multi-day PTO entry
   * @param startDate Start date in ISO format
   * @param endDate End date in ISO format
   * @param hoursPerDay Hours per day (2, 4, or 8)
   * @param name Optional description
   * @returns PTOEntry for date range
   */
  static createMultiDayEntry(
    startDate: string, 
    endDate: string, 
    hoursPerDay: number, 
    name?: string
  ): PTOEntry {
    return {
      startDate,
      endDate,
      hoursPerDay,
      totalHours: this.calculateTotalPTOHours(startDate, endDate, hoursPerDay),
      name
    };
  }

  /**
   * Calculates remaining PTO hours for the year
   * @param ptoEntries Array of PTO entries
   * @param totalHours Total hours for the year
   * @param rollover Rollover hours from previous year
   * @returns Remaining PTO hours
   */
  static calculateRemainingPTO(
    ptoEntries: PTOEntry[],
    totalHours: number,
    rollover: number
  ): number {
    const usedHours = ptoEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    return (totalHours + rollover) - usedHours;
  }

  /**
   * Calculates PTO usage summary for reporting
   * @param ptoEntries Array of PTO entries
   * @param config PTO configuration
   * @returns Usage summary with breakdown
   */
  static calculatePTOSummary(
    ptoEntries: PTOEntry[],
    config: PTOConfig
  ): {
    totalHours: number;
    usedHours: number;
    remainingHours: number;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
    accrualRate: number;
  } {
    const totalHours = this.calculateAnnualPTOHours(config.yearsOfService) + config.rolloverHours;
    const usedHours = ptoEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const remainingHours = totalHours - usedHours;
    
    return {
      totalHours,
      usedHours,
      remainingHours,
      totalDays: totalHours / 8,
      usedDays: usedHours / 8,
      remainingDays: remainingHours / 8,
      accrualRate: totalHours / 365 // Hours per day
    };
  }
}