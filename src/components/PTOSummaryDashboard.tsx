import React from "react";
import { useStore } from "../store";
import "./PTOSummaryDashboard.css";

const PTOSummaryDashboard: React.FC = () => {
	const { selectedGroupId, getPTOSummary, getSelectedGroupPTOConfig } = useStore();

	const ptoConfig = getSelectedGroupPTOConfig();
	
	if (!selectedGroupId || !ptoConfig?.isEnabled) {
		return null;
	}

	const summary = getPTOSummary(selectedGroupId);
	
	if (!summary) {
		return null;
	}

	const getProgressBarWidth = (used: number, total: number): number => {
		return Math.min((used / total) * 100, 100);
	};

	const getProgressBarColor = (used: number, total: number): string => {
		const percentage = (used / total) * 100;
		if (percentage >= 90) return "#dc3545"; // Red
		if (percentage >= 75) return "#ffc107"; // Yellow
		return "#28a745"; // Green
	};

	return (
		<div className="pto-summary-dashboard">
			<h3>PTO Summary</h3>
			
			{/* Main Balance Display */}
			<div className="pto-balance-overview">
				<div className="balance-card">
					<div className="balance-header">
						<span className="balance-title">Available Balance</span>
						<span className="balance-main">{summary.remainingHours}h</span>
					</div>
					<div className="balance-subtitle">{summary.remainingDays} days remaining</div>
				</div>

				<div className="balance-card">
					<div className="balance-header">
						<span className="balance-title">Used This Year</span>
						<span className="balance-main">{summary.usedHours}h</span>
					</div>
					<div className="balance-subtitle">{summary.usedDays} days used</div>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="pto-progress-section">
				<div className="progress-header">
					<span>PTO Usage</span>
					<span>{summary.usedHours}h / {summary.totalHours}h</span>
				</div>
				<div className="progress-bar">
					<div 
						className="progress-fill"
						style={{
							width: `${getProgressBarWidth(summary.usedHours, summary.totalHours)}%`,
							backgroundColor: getProgressBarColor(summary.usedHours, summary.totalHours)
						}}
					/>
				</div>
			</div>

			{/* Configuration Details */}
			<div className="pto-config-details">
				<div className="config-item">
					<span className="config-label">Years of Service:</span>
					<span className="config-value">{ptoConfig.yearsOfService} years</span>
				</div>
				<div className="config-item">
					<span className="config-label">Annual Allowance:</span>
					<span className="config-value">
						{summary.totalHours - ptoConfig.rolloverHours}h ({(summary.totalHours - ptoConfig.rolloverHours) / 8} days)
					</span>
				</div>
				{ptoConfig.rolloverHours > 0 && (
					<div className="config-item">
						<span className="config-label">Rollover Hours:</span>
						<span className="config-value">{ptoConfig.rolloverHours}h ({ptoConfig.rolloverHours / 8} days)</span>
					</div>
				)}
				<div className="config-item">
					<span className="config-label">Accrual Rate:</span>
					<span className="config-value">{summary.accrualRate.toFixed(2)}h per day</span>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="pto-quick-stats">
				<div className="stat-item">
					<span className="stat-value">{Math.round((summary.usedHours / summary.totalHours) * 100)}%</span>
					<span className="stat-label">Usage Rate</span>
				</div>
				<div className="stat-item">
					<span className="stat-value">{summary.usedDays.toFixed(1)}</span>
					<span className="stat-label">Days Used</span>
				</div>
			</div>
		</div>
	);
};

export default PTOSummaryDashboard;