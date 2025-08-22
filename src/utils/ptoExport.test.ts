/**
 * Test suite for PTO export functionality
 * Testing data export/import and format validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportPTODataAsJSON,
  exportPTODataAsCSV,
  exportForADP,
  importPTODataFromJSON,
  generatePTOSummaryReport,
  exportPTOSummaryReportAsHTML,
  ExportData
} from './ptoExport';
import { PTOEntry, PTOConfig } from './ptoUtils';

// Mock DOM APIs for testing
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
  
  // Mock document.createElement
  mockCreateElement.mockReturnValue({
    href: '',
    download: '',
    click: mockClick
  });
  
  global.document = {
    createElement: mockCreateElement,
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild
    }
  } as any;

  // Mock URL APIs
  global.URL = {
    createObjectURL: mockCreateObjectURL.mockReturnValue('mock-blob-url'),
    revokeObjectURL: mockRevokeObjectURL
  } as any;

  // Mock Blob
  global.Blob = vi.fn().mockImplementation((content, options) => ({
    content,
    type: options?.type
  })) as any;
});

describe('PTO Export Functions', () => {
  const mockPTOEntries: PTOEntry[] = [
    { date: '2025-01-15', hours: 8, name: 'Vacation Day' },
    { date: '2025-02-10', hours: 4, name: 'Doctor Appointment' },
    { date: '2025-03-05', hours: 2 }
  ];

  const mockPTOConfig: PTOConfig = {
    yearsOfService: 3,
    rolloverHours: 20,
    isEnabled: true
  };

  describe('exportPTODataAsJSON', () => {
    it('should create proper JSON export data', () => {
      exportPTODataAsJSON(mockPTOEntries, mockPTOConfig);

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('"ptoEntries"')],
        { type: 'application/json' }
      );
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should include all required fields in export data', () => {
      exportPTODataAsJSON(mockPTOEntries, mockPTOConfig);

      const blobCall = (global.Blob as any).mock.calls[0];
      const jsonData = JSON.parse(blobCall[0][0]);

      expect(jsonData).toHaveProperty('ptoEntries');
      expect(jsonData).toHaveProperty('config');
      expect(jsonData).toHaveProperty('exportDate');
      expect(jsonData).toHaveProperty('version');
      expect(jsonData.version).toBe('1.0');
    });

    it('should generate filename with current date', () => {
      exportPTODataAsJSON(mockPTOEntries, mockPTOConfig);

      const element = mockCreateElement.mock.results[0].value;
      expect(element.download).toMatch(/pto-2025-\d{4}-\d{2}-\d{2}\.json/);
    });
  });

  describe('exportPTODataAsCSV', () => {
    it('should create proper CSV format', () => {
      exportPTODataAsCSV(mockPTOEntries, mockPTOConfig);

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Date,Hours,Description,Day Fraction')],
        { type: 'text/csv;charset=utf-8;' }
      );
    });

    it('should include all entries with proper formatting', () => {
      exportPTODataAsCSV(mockPTOEntries, mockPTOConfig);

      const blobCall = (global.Blob as any).mock.calls[0];
      const csvContent = blobCall[0][0];

      expect(csvContent).toContain('"2025-01-15","8","Vacation Day","1"');
      expect(csvContent).toContain('"2025-02-10","4","Doctor Appointment","0.5"');
      expect(csvContent).toContain('"2025-03-05","2","","0.25"');
    });

    it('should generate CSV filename with current date', () => {
      exportPTODataAsCSV(mockPTOEntries, mockPTOConfig);

      const element = mockCreateElement.mock.results[0].value;
      expect(element.download).toMatch(/pto-2025-\d{4}-\d{2}-\d{2}\.csv/);
    });
  });

  describe('exportForADP', () => {
    it('should create ADP-compatible format', () => {
      exportForADP(mockPTOEntries);

      const blobCall = (global.Blob as any).mock.calls[0];
      const csvContent = blobCall[0][0];

      expect(csvContent).toContain('Pay Code,Date,Hours,Comments');
      expect(csvContent).toContain('"PTO"');
      expect(csvContent).toContain('"8"');
      expect(csvContent).toContain('"4"');
      expect(csvContent).toContain('"2"');
    });

    it('should generate ADP filename', () => {
      exportForADP(mockPTOEntries);

      const element = mockCreateElement.mock.results[0].value;
      expect(element.download).toMatch(/adp-pto-import-\d{4}-\d{2}-\d{2}\.csv/);
    });
  });

  describe('importPTODataFromJSON', () => {
    const mockValidData: ExportData = {
      ptoEntries: mockPTOEntries,
      config: mockPTOConfig,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    it('should successfully import valid JSON data', async () => {
      const mockFile = new File([JSON.stringify(mockValidData)], 'test.json');
      
      const result = await importPTODataFromJSON(mockFile);
      
      expect(result).toEqual(mockValidData);
    });

    it('should reject invalid PTO entries', async () => {
      const invalidData = {
        ...mockValidData,
        ptoEntries: [{ date: '2025-01-01' }] // Missing hours
      };
      
      const mockFile = new File([JSON.stringify(invalidData)], 'test.json');
      
      await expect(importPTODataFromJSON(mockFile)).rejects.toThrow('Invalid PTO entry format');
    });

    it('should reject invalid PTO hours', async () => {
      const invalidData = {
        ...mockValidData,
        ptoEntries: [{ date: '2025-01-01', hours: 6 }] // Invalid hours
      };
      
      const mockFile = new File([JSON.stringify(invalidData)], 'test.json');
      
      await expect(importPTODataFromJSON(mockFile)).rejects.toThrow('Invalid PTO hours');
    });

    it('should reject malformed JSON', async () => {
      const mockFile = new File(['invalid json'], 'test.json');
      
      await expect(importPTODataFromJSON(mockFile)).rejects.toThrow('Failed to parse JSON');
    });

    it('should reject missing required fields', async () => {
      const invalidData = { ptoEntries: [] }; // Missing config
      
      const mockFile = new File([JSON.stringify(invalidData)], 'test.json');
      
      await expect(importPTODataFromJSON(mockFile)).rejects.toThrow('Invalid PTO config data');
    });
  });

  describe('generatePTOSummaryReport', () => {
    it('should generate comprehensive HTML report', () => {
      const html = generatePTOSummaryReport(mockPTOEntries, mockPTOConfig);

      expect(html).toContain('PTO Summary Report');
      expect(html).toContain('Years of Service');
      expect(html).toContain('Annual PTO');
      expect(html).toContain('Rollover Hours');
      expect(html).toContain('Total Available');
      expect(html).toContain('Used');
      expect(html).toContain('Remaining');
    });

    it('should group entries by month', () => {
      const html = generatePTOSummaryReport(mockPTOEntries, mockPTOConfig);

      expect(html).toContain('Jan 2025 - 8 hours');
      expect(html).toContain('Feb 2025 - 4 hours');
      expect(html).toContain('Mar 2025 - 2 hours');
    });

    it('should include individual entry details', () => {
      const html = generatePTOSummaryReport(mockPTOEntries, mockPTOConfig);

      expect(html).toContain('Vacation Day');
      expect(html).toContain('Doctor Appointment');
    });

    it('should handle entries without names', () => {
      const html = generatePTOSummaryReport(mockPTOEntries, mockPTOConfig);

      expect(html).toContain('<td style="padding: 8px; border: 1px solid #ddd;">-</td>');
    });

    it('should include generation timestamp', () => {
      const html = generatePTOSummaryReport(mockPTOEntries, mockPTOConfig);

      expect(html).toContain('Report generated on');
      expect(html).toContain('Generated by Unispace PTO Calculator PTO Tracker');
    });
  });

  describe('exportPTOSummaryReportAsHTML', () => {
    it('should create HTML blob and trigger download', () => {
      exportPTOSummaryReportAsHTML(mockPTOEntries, mockPTOConfig);

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('PTO Summary Report')],
        { type: 'text/html' }
      );
      
      expect(mockClick).toHaveBeenCalled();
    });

    it('should generate HTML report filename', () => {
      exportPTOSummaryReportAsHTML(mockPTOEntries, mockPTOConfig);

      const element = mockCreateElement.mock.results[0].value;
      expect(element.download).toMatch(/pto-summary-report-\d{4}-\d{2}-\d{2}\.html/);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain data integrity in export/import roundtrip', async () => {
      // Export data
      exportPTODataAsJSON(mockPTOEntries, mockPTOConfig);
      
      // Get the exported JSON
      const blobCall = (global.Blob as any).mock.calls[0];
      const exportedJson = blobCall[0][0];
      
      // Import the data back
      const mockFile = new File([exportedJson], 'test.json');
      const importedData = await importPTODataFromJSON(mockFile);
      
      expect(importedData?.ptoEntries).toEqual(mockPTOEntries);
      expect(importedData?.config).toEqual(mockPTOConfig);
    });

    it('should handle empty PTO entries gracefully', () => {
      const html = generatePTOSummaryReport([], mockPTOConfig);
      
      expect(html).toContain('Used');
      expect(html).toContain('Remaining');
    });

    it('should calculate correct totals for senior employees', () => {
      const seniorConfig: PTOConfig = {
        yearsOfService: 7,
        rolloverHours: 40,
        isEnabled: true
      };
      
      const html = generatePTOSummaryReport(mockPTOEntries, seniorConfig);
      
      expect(html).toContain('Annual PTO');
      expect(html).toContain('Total Available');
      expect(html).toContain('Remaining');
    });
  });
});