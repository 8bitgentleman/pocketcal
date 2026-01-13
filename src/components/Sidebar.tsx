import React, { useState, useEffect } from "react";
import { useStore, EventGroup, getMaxGroups } from "../store";
import CalIcon from "./icons/CalIcon";
import PencilIcon from "./icons/PencilIcon";
import TrashIcon from "./icons/TrashIcon";
import XIcon from "./icons/XIcon";
import SaveIcon from "./icons/SaveIcon";
import PlusIcon from "./icons/PlusIcon";
import SettingsIcon from "./icons/SettingsIcon";
import HelpIcon from "./icons/HelpIcon";
import CopyIcon from "./icons/CopyIcon";
import InfoIcon from "./icons/InfoIcon";
import PTOSummaryDashboard from "./PTOSummaryDashboard";
import DarkModeToggle from "./DarkModeToggle";
import Tooltip from "./Tooltip";

import "./Sidebar.css";

interface SidebarProps {
	setShowLicenseModal: (show: boolean) => void;
	onShowWelcome: () => void;
}

function Sidebar({ setShowLicenseModal, onShowWelcome }: SidebarProps) {
	const {
		startDate,
		includeWeekends,
		showToday,
		eventGroups,
		selectedGroupId,
		setStartDate,
		setIncludeWeekends,
		setShowToday,
		setShowHelpModal,
		addEventGroup,
		updateEventGroup,
		deleteEventGroup,
		selectEventGroup,
		isProUser,
		// PTO state
		setPTOConfig,
		getSelectedGroupPTOConfig,
		isPTOEnabledForGroup,
		// Display helpers
		getAllDisplayGroups,
	} = useStore();
	const maxGroups = getMaxGroups(isProUser);
	const [newEventName, setNewEventName] = useState("");
	const [editingGroup, setEditingGroup] = useState<EventGroup | null>(null);

	// Add effect to select the first non-special group if none is selected
	useEffect(() => {
		if (!selectedGroupId && eventGroups.length > 0) {
			// Find first non-special group
			const firstNonSpecialGroup = eventGroups.find(group => !group.isSpecial);
			if (firstNonSpecialGroup) {
				selectEventGroup(firstNonSpecialGroup.id);
			}
		}
	}, [selectedGroupId, eventGroups, selectEventGroup]);

	const handleAddGroup = () => {
		if (eventGroups.length < maxGroups) {
			const newGroup = addEventGroup("New Calendar");
			selectEventGroup(newGroup.id);
		}
	};

	const handleUpdateGroup = () => {
		if (editingGroup && newEventName.trim()) {
			updateEventGroup(editingGroup.id, newEventName.trim());
			setEditingGroup(null);
			setNewEventName("");
		}
	};

	const handleEditClick = (group: EventGroup) => {
		setEditingGroup(group);
		setNewEventName(group.name);
		selectEventGroup(group.id);
	};

	const handleCancelEdit = () => {
		setEditingGroup(null);
		setNewEventName("");
	};

	const handleKeyDown = (e: React.KeyboardEvent, group: EventGroup) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (editingGroup?.id !== group.id) {
				selectEventGroup(group.id);
			}
		}
	};

	const handleCopyUrl = () => {
		navigator.clipboard.writeText(window.location.href);
	};

	const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const year = parseInt(e.target.value);
			if (year >= 2020 && year <= 2030) {
				const newDate = new Date(year, 0, 1); // January 1st of the selected year
				setStartDate(newDate);
			}
		} catch (error) {
			console.error("Invalid year format", error);
		}
	};

	const footerGroups = () => {
		const helpAndCopyButtons = (
			<div className="sidebar-footer-buttons">
				<Tooltip content="View the getting started guide">
					<button
						className="footer-button"
						onClick={onShowWelcome}
						aria-label="Show getting started guide"
					>
						<InfoIcon color="#000" /> Guide
					</button>
				</Tooltip>
				<Tooltip content="View keyboard shortcuts and features">
					<button
						className="footer-button"
						onClick={() => setShowHelpModal(true)}
						aria-label="Show instructions"
					>
						<HelpIcon width={16} height={16} color="#000" /> Help
					</button>
				</Tooltip>
				<Tooltip content="Copy URL to share your calendar">
					<button
						className="footer-button"
						onClick={handleCopyUrl}
						aria-label="Copy URL to clipboard"
					>
						<CopyIcon width={16} height={16} color="#000" /> URL
					</button>
				</Tooltip>
			</div>
		);

		return [<React.Fragment key="help">{helpAndCopyButtons}</React.Fragment>];
	};

	return (
		<div className="sidebar">
			<div className="sidebar-header">
				<div className="logo">
					{/* <div className="logo-cal">U</div> */}
					<div className="logo-text">UNISPACE PTO CALCULATOR</div>
					{/* <DarkModeToggle /> */}
				</div>
				
			</div>

			<h3>
				<CalIcon height={20} />
				Calendars ({eventGroups.length}/{maxGroups})
			</h3>
			<div className="event-groups-list" role="list">
				{getAllDisplayGroups().map((group) => (
					<div
						key={group.id}
						className={`event-group-item ${
							selectedGroupId === group.id ? "selected" : ""
						} ${editingGroup?.id === group.id ? "editing" : ""}`}
						onClick={() =>
							editingGroup?.id !== group.id && !group.isSpecial && selectEventGroup(group.id)
						}
						onKeyDown={(e) => handleKeyDown(e, group)}
						tabIndex={editingGroup?.id !== group.id ? 0 : -1}
						role="listitem"
						aria-selected={selectedGroupId === group.id}
						aria-label={`Event group: ${group.name}`}
					>
						<span
							className="color-indicator"
							style={{ backgroundColor: group.color }}
						></span>
						{editingGroup?.id === group.id ? (
							<>
								<input
									type="text"
									value={newEventName}
									onChange={(e) => setNewEventName(e.target.value)}
									onClick={(e) => e.stopPropagation()}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleUpdateGroup();
										} else if (e.key === "Escape") {
											handleCancelEdit();
										}
									}}
									autoFocus
									className="group-name-input"
									aria-label="Edit group name"
								/>
								<div className="group-actions">
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleUpdateGroup();
										}}
										className="save-button"
										aria-label="Save group name"
									>
										<SaveIcon width={16} height={16} color="var(--text-secondary)" />
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleCancelEdit();
										}}
										className="cancel-button"
										aria-label="Cancel editing"
									>
										<XIcon width={16} height={16} color="var(--text-secondary)" />
									</button>
								</div>
							</>
						) : (
							<>
								<span className="group-name">{group.name}</span>
								{!group.isSpecial && (
									<div className="group-actions">
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleEditClick(group);
											}}
											disabled={!!editingGroup}
											className="edit-button"
											aria-label={`Edit ${group.name}`}
										>
											<PencilIcon width={16} color="var(--text-secondary)" />
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												deleteEventGroup(group.id);
											}}
											disabled={!!editingGroup}
											className="delete-button"
											aria-label={`Delete ${group.name}`}
										>
											<TrashIcon width={16} color="var(--text-secondary)" />
										</button>
									</div>
								)}
							</>
						)}
					</div>
				))}
			</div>

			{eventGroups.length < maxGroups && (
				<button
					className="add-group-button"
					onClick={handleAddGroup}
					disabled={!!editingGroup}
				>
					<PlusIcon height={18} /> Add new calendar
				</button>
			)}

			<>
				<h3>
					<SettingsIcon height={20} /> Settings
				</h3>
				{/* <div className="setting-item">
					<Tooltip content="The calendar will display 12 months starting from January of this year.">
						<label htmlFor="start-date">Start Year:</label>
					</Tooltip>
					<input
						type="number"
						id="start-date"
						min="2020"
						max="2030"
						value={startDate.getFullYear()}
						onChange={handleStartDateChange}
					/>
				</div> */}
				<div className="setting-item">
					<Tooltip content="Show or hide Saturday and Sunday columns in the calendar grid.">
						<label htmlFor="include-weekends">Show Weekends:</label>
					</Tooltip>
					<input
						type="checkbox"
						id="include-weekends"
						checked={includeWeekends}
						onChange={(e) => setIncludeWeekends(e.target.checked)}
					/>
				</div>
				<div className="setting-item">
					<Tooltip content="Show a visual indicator on today's date in the calendar.">
						<label htmlFor="show-today">Highlight Today:</label>
					</Tooltip>
					<input
						type="checkbox"
						id="show-today"
						checked={showToday}
						onChange={(e) => setShowToday(e.target.checked)}
					/>
				</div>
				
				{/* Per-Group PTO Settings */}
				{selectedGroupId && !getAllDisplayGroups().find(g => g.id === selectedGroupId)?.isSpecial && (
					<>
						<h4>PTO Settings - {getAllDisplayGroups().find(g => g.id === selectedGroupId)?.name}</h4>
						{/* <p className="sidebar-help-text">Configure vacation/PTO policy for this person/team.</p> */}
						<div className="setting-item">
							<Tooltip content="Turn on to track PTO hours and days for this calendar. Click dates on the calendar to log time off.">
								<label htmlFor="pto-enabled">Enable PTO Calculation:</label>
							</Tooltip>
							<input
								type="checkbox"
								id="pto-enabled"
								checked={isPTOEnabledForGroup(selectedGroupId)}
								onChange={(e) => setPTOConfig(selectedGroupId, { isEnabled: e.target.checked })}
							/>
						</div>

						{isPTOEnabledForGroup(selectedGroupId) && (
							<>
								<div className="setting-item">
									<Tooltip content="How long you've worked at the company. Employees with 5+ years get 26 PTO days/year instead of 21.">
										<label htmlFor="years-of-service">Years of Service:</label>
									</Tooltip>
									<select
										id="years-of-service"
										value={getSelectedGroupPTOConfig()?.yearsOfService || 2}
										onChange={(e) => setPTOConfig(selectedGroupId, { yearsOfService: parseInt(e.target.value) })}
									>
										{Array.from({ length: 10 }, (_, i) => i + 1).map(year => (
											<option key={year} value={year}>
												{year} year{year !== 1 ? 's' : ''} {year < 5 ? '(21 days)' : '(26 days)'}
											</option>
										))}
										<option value={10}>10+ years (26 days)</option>
									</select>
								</div>
								<div className="setting-item">
									<Tooltip content="Unused PTO hours from last year that were carried over. Enter 0 if you're starting fresh.">
										<label htmlFor="rollover-hours">Rollover Hours:</label>
									</Tooltip>
									<input
										type="number"
										id="rollover-hours"
										min="0"
										max="200"
										step="1"
										value={getSelectedGroupPTOConfig()?.rolloverHours || 0}
										onChange={(e) => setPTOConfig(selectedGroupId, { rolloverHours: parseInt(e.target.value) || 0 })}
										placeholder="0"
									/>
									<small className="setting-help">Hours carried over from previous year</small>
								</div>
							</>
						)}
					</>
				)}
			</>

			{/* PTO Summary Dashboard */}
			<PTOSummaryDashboard />

			<div className="sidebar-footer">{footerGroups()}</div>
		</div>
	);
}

export default Sidebar;
