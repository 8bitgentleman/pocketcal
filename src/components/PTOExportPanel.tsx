import React, { useState } from "react";
import { useStore } from "../store";
import {
	exportPTODataAsJSON,
	exportPTODataAsCSV,
	exportForADP,
	exportPTOSummaryReportAsHTML,
	importPTODataFromJSON,
} from "../utils/ptoExport";
import "./PTOExportPanel.css";

const PTOExportPanel: React.FC = () => {
	const {
		selectedGroupId,
		getSelectedGroupPTOEntries,
		getSelectedGroupPTOConfig,
		isPTOEnabledForGroup,
		setPTOConfig,
		clearPTOEntries,
		addPTOEntry,
	} = useStore();

	const [importing, setImporting] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

	// Don't show panel if no group selected or PTO not enabled
	if (!selectedGroupId || !isPTOEnabledForGroup(selectedGroupId)) {
		return null;
	}

	const ptoEntries = getSelectedGroupPTOEntries();
	const ptoConfig = getSelectedGroupPTOConfig();

	if (!ptoConfig) {
		return null;
	}

	const showMessage = (type: "success" | "error", text: string) => {
		setMessage({ type, text });
		setTimeout(() => setMessage(null), 3000);
	};

	const handleExportJSON = () => {
		try {
			exportPTODataAsJSON(ptoEntries, ptoConfig);
			showMessage("success", "PTO data exported as JSON successfully!");
		} catch (error) {
			showMessage("error", "Failed to export JSON");
			console.error("Export JSON error:", error);
		}
	};

	const handleExportCSV = () => {
		try {
			exportPTODataAsCSV(ptoEntries, ptoConfig);
			showMessage("success", "PTO data exported as CSV successfully!");
		} catch (error) {
			showMessage("error", "Failed to export CSV");
			console.error("Export CSV error:", error);
		}
	};

	const handleExportADP = () => {
		try {
			exportForADP(ptoEntries);
			showMessage("success", "ADP import file generated successfully!");
		} catch (error) {
			showMessage("error", "Failed to export ADP format");
			console.error("Export ADP error:", error);
		}
	};

	const handleExportHTML = () => {
		try {
			exportPTOSummaryReportAsHTML(ptoEntries, ptoConfig);
			showMessage("success", "HTML summary report generated successfully!");
		} catch (error) {
			showMessage("error", "Failed to export HTML report");
			console.error("Export HTML error:", error);
		}
	};

	const handleCopyToClipboard = async () => {
		try {
			const totalHours = ptoConfig.yearsOfService < 5 ? 168 : 208;
			const totalAvailable = totalHours + ptoConfig.rolloverHours;
			const usedHours = ptoEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
			const remainingHours = totalAvailable - usedHours;

			const summaryText = `PTO Summary 2025

Years of Service: ${ptoConfig.yearsOfService}
Annual PTO: ${totalHours} hours (${totalHours / 8} days)
Rollover: ${ptoConfig.rolloverHours} hours
Total Available: ${totalAvailable} hours (${totalAvailable / 8} days)
Used: ${usedHours} hours (${usedHours / 8} days)
Remaining: ${remainingHours} hours (${remainingHours / 8} days)

PTO Entries (${ptoEntries.length} total):
${ptoEntries
	.map((entry) => {
		const dateRange =
			entry.startDate === entry.endDate
				? entry.startDate
				: `${entry.startDate} to ${entry.endDate}`;
		return `- ${dateRange}: ${entry.totalHours}h${entry.name ? ` (${entry.name})` : ""}`;
	})
	.join("\n")}
`;

			await navigator.clipboard.writeText(summaryText);
			showMessage("success", "PTO summary copied to clipboard!");
		} catch (error) {
			showMessage("error", "Failed to copy to clipboard");
			console.error("Copy to clipboard error:", error);
		}
	};

	const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setImporting(true);
		try {
			const data = await importPTODataFromJSON(file);

			if (data && selectedGroupId) {
				// Clear existing entries and set new data
				clearPTOEntries(selectedGroupId);
				setPTOConfig(selectedGroupId, data.config);

				// Add all imported entries
				data.ptoEntries.forEach((entry) => {
					addPTOEntry(selectedGroupId, entry);
				});

				showMessage("success", `Imported ${data.ptoEntries.length} PTO entries successfully!`);
			}
		} catch (error) {
			showMessage("error", "Failed to import PTO data. Please check the file format.");
			console.error("Import error:", error);
		} finally {
			setImporting(false);
			// Reset file input
			event.target.value = "";
		}
	};

	const hasPTOEntries = ptoEntries.length > 0;

	return (
		<div className="pto-export-panel">
			<h4>📤 Export PTO Data</h4>

			{message && (
				<div className={`export-message ${message.type}`}>
					{message.text}
				</div>
			)}

			<div className="export-options">
				<button
					onClick={handleExportJSON}
					className="export-btn json-export"
					disabled={!hasPTOEntries}
					title={!hasPTOEntries ? "No PTO entries to export" : "Export as JSON file"}
				>
					<span className="export-icon">📄</span>
					<span className="export-label">Export JSON</span>
				</button>

				<button
					onClick={handleExportCSV}
					className="export-btn csv-export"
					disabled={!hasPTOEntries}
					title={!hasPTOEntries ? "No PTO entries to export" : "Export as CSV for Excel"}
				>
					<span className="export-icon">📊</span>
					<span className="export-label">Export CSV</span>
				</button>

				<button
					onClick={handleExportADP}
					className="export-btn adp-export"
					disabled={!hasPTOEntries}
					title={!hasPTOEntries ? "No PTO entries to export" : "Export for ADP import"}
				>
					<span className="export-icon">💼</span>
					<span className="export-label">ADP Format</span>
				</button>

				<button
					onClick={handleExportHTML}
					className="export-btn html-export"
					disabled={!hasPTOEntries}
					title={!hasPTOEntries ? "No PTO entries to export" : "Generate HTML summary report"}
				>
					<span className="export-icon">📋</span>
					<span className="export-label">HTML Report</span>
				</button>

				<button
					onClick={handleCopyToClipboard}
					className="export-btn clipboard-export"
					disabled={!hasPTOEntries}
					title={!hasPTOEntries ? "No PTO entries to copy" : "Copy summary to clipboard"}
				>
					<span className="export-icon">📋</span>
					<span className="export-label">Copy Summary</span>
				</button>
			</div>

			<div className="import-section">
				<h4>📥 Import PTO Data</h4>
				<label className="import-file-label">
					<input
						type="file"
						accept=".json"
						onChange={handleImportFile}
						disabled={importing}
						className="import-file-input"
					/>
					<span className="import-file-button">
						{importing ? "Importing..." : "Choose JSON File"}
					</span>
				</label>
				<p className="import-help-text">
					Import PTO data from a previously exported JSON file
				</p>
			</div>
		</div>
	);
};

export default PTOExportPanel;
