/**
 * PTO Export Utilities
 * Functions for exporting PTO data in various formats
 */

import { format } from "date-fns";
import { PTOEntry, PTOConfig } from "./ptoUtils";

export interface ExportData {
  ptoEntries: PTOEntry[];
  config: PTOConfig;
  exportDate: string;
  version: string;
}

/**
 * Export PTO data as JSON file
 * @param ptoEntries Array of PTO entries
 * @param config PTO configuration
 */
export const exportPTODataAsJSON = (
  ptoEntries: PTOEntry[], 
  config: PTOConfig
): void => {
  const exportData: ExportData = {
    ptoEntries,
    config,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pto-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export PTO data as CSV file for Excel/ADP integration
 * @param ptoEntries Array of PTO entries
 * @param config PTO configuration
 */
export const exportPTODataAsCSV = (
  ptoEntries: PTOEntry[], 
  _config: PTOConfig
): void => {
  const headers = ['Date', 'Hours', 'Description', 'Day Fraction'];
  
  // Convert new multi-day structure to individual day entries for export compatibility
  const rows: string[][] = [];
  ptoEntries.forEach(entry => {
    // Parse date strings manually to avoid timezone issues
    const [startYear, startMonth, startDay] = entry.startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = entry.endDate.split('-').map(Number);

    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      rows.push([
        format(date, 'yyyy-MM-dd'),
        entry.hoursPerDay.toString(),
        entry.name || '',
        (entry.hoursPerDay / 8).toString() // Day fraction for ADP
      ]);
    }
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pto-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export PTO data formatted for ADP time entry system
 * @param ptoEntries Array of PTO entries
 */
export const exportForADP = (ptoEntries: PTOEntry[]): void => {
  const adpData = ptoEntries.map(entry => ({
    'Pay Code': 'PTO',
    'Date': entry.startDate === entry.endDate ? 
      format(new Date(entry.startDate), 'MM/dd/yyyy') :
      `${format(new Date(entry.startDate), 'MM/dd/yyyy')} - ${format(new Date(entry.endDate), 'MM/dd/yyyy')}`,
    'Hours': entry.totalHours,
    'Comments': entry.name || 'PTO Request'
  }));

  const headers = ['Pay Code', 'Date', 'Hours', 'Comments'];
  const rows = adpData.map(row => [
    row['Pay Code'],
    row['Date'],
    row['Hours'].toString(),
    row['Comments']
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adp-pto-import-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Import PTO data from JSON file
 * @param file File object to import
 * @returns Promise resolving to imported data or null if invalid
 */
export const importPTODataFromJSON = (file: File): Promise<ExportData | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;
        
        // Validate the imported data structure
        if (!data.ptoEntries || !Array.isArray(data.ptoEntries)) {
          throw new Error('Invalid PTO entries data');
        }
        
        if (!data.config || typeof data.config !== 'object') {
          throw new Error('Invalid PTO config data');
        }
        
        // Validate each PTO entry
        for (const entry of data.ptoEntries) {
          if (!entry.startDate || !entry.hoursPerDay) {
            throw new Error('Invalid PTO entry format');
          }
          if (![2, 4, 8].includes(entry.hoursPerDay)) {
            throw new Error('Invalid PTO hours (must be 2, 4, or 8)');
          }
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Create a summary report of PTO usage
 * @param ptoEntries Array of PTO entries
 * @param config PTO configuration
 * @returns HTML string for the report
 */
export const generatePTOSummaryReport = (
  ptoEntries: PTOEntry[], 
  config: PTOConfig
): string => {
  const totalHours = config.yearsOfService < 5 ? 168 : 208;
  const totalAvailable = totalHours + config.rolloverHours;
  const usedHours = ptoEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  const remainingHours = totalAvailable - usedHours;
  
  const entriesByMonth = ptoEntries.reduce((acc, entry) => {
    const month = format(new Date(entry.startDate), 'MMM yyyy');
    if (!acc[month]) acc[month] = [];
    acc[month].push(entry);
    return acc;
  }, {} as Record<string, PTOEntry[]>);

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1>PTO Summary Report - ${new Date().getFullYear()}</h1>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3>PTO Balance</h3>
        <p><strong>Years of Service:</strong> ${config.yearsOfService}</p>
        <p><strong>Annual PTO:</strong> ${totalHours} hours (${totalHours/8} days)</p>
        <p><strong>Rollover Hours:</strong> ${config.rolloverHours} hours</p>
        <p><strong>Total Available:</strong> ${totalAvailable} hours (${totalAvailable/8} days)</p>
        <p><strong>Used:</strong> ${usedHours} hours (${usedHours/8} days)</p>
        <p><strong>Remaining:</strong> ${remainingHours} hours (${remainingHours/8} days)</p>
      </div>
      
      <h3>PTO Entries by Month</h3>
  `;

  Object.keys(entriesByMonth).sort().forEach(month => {
    const entries = entriesByMonth[month];
    const monthTotal = entries.reduce((sum, entry) => sum + entry.totalHours, 0);
    
    html += `
      <div style="margin-bottom: 20px; border-left: 3px solid #007cba; padding-left: 15px;">
        <h4>${month} - ${monthTotal} hours (${monthTotal/8} days)</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Date</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Hours</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Description</th>
          </tr>
    `;
    
    entries.forEach(entry => {
      html += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${entry.startDate === entry.endDate ? 
            format(new Date(entry.startDate), 'MMM dd, yyyy') : 
            `${format(new Date(entry.startDate), 'MMM dd')} - ${format(new Date(entry.endDate), 'MMM dd, yyyy')}`}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${entry.totalHours}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${entry.name || '-'}</td>
        </tr>
      `;
    });
    
    html += `</table></div>`;
  });

  html += `
      <div style="margin-top: 30px; font-size: 12px; color: #666;">
        <p>Report generated on ${format(new Date(), 'MMM dd, yyyy \'at\' h:mm a')}</p>
        <p>Generated by Unispace PTO Calculator PTO Tracker</p>
      </div>
    </div>
  `;
  
  return html;
};

/**
 * Export PTO summary report as HTML file
 * @param ptoEntries Array of PTO entries
 * @param config PTO configuration
 */
export const exportPTOSummaryReportAsHTML = (
  ptoEntries: PTOEntry[], 
  config: PTOConfig
): void => {
  const html = generatePTOSummaryReport(ptoEntries, config);
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pto-summary-report-${format(new Date(), 'yyyy-MM-dd')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};