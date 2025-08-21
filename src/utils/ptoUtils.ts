/**
 * PTO Calendar Utilities
 * Mathematical precision functions for PTO calculation and validation
 */

export interface PTOEntry {
  date: string;     // ISO date format (YYYY-MM-DD)
  hours: number;    // 2, 4, or 8 hours
  name?: string;    // Optional description
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
    const days = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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
    date: number,
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
   * Calculates total PTO hours for a given years of service
   * @param yearsOfService Number of years of service
   * @returns Total PTO hours for the year
   */
  static calculateTotalPTOHours(yearsOfService: number): number {
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
    const usedHours = ptoEntries.reduce((sum, entry) => sum + entry.hours, 0);
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
    const totalHours = this.calculateTotalPTOHours(config.yearsOfService) + config.rolloverHours;
    const usedHours = ptoEntries.reduce((sum, entry) => sum + entry.hours, 0);
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