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
import ShareIcon from "./icons/ShareIcon";
import InfoIcon from "./icons/InfoIcon";
import PTOSummaryDashboard from "./PTOSummaryDashboard";
import Tooltip from "./Tooltip";
import DarkModeToggle from "./DarkModeToggle";

import "./Sidebar.css";

interface SidebarProps {
	onShowWelcome: () => void;
	onShowShareModal: () => void;
}

function Sidebar({ onShowWelcome, onShowShareModal }: SidebarProps) {
	const {
		includeWeekends,
		showToday,
		eventGroups,
		selectedGroupId,
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
				console.log('[Sidebar] Auto-selecting first group:', firstNonSpecialGroup.id, firstNonSpecialGroup.name);
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

	const footerGroups = () => {
		const helpAndCopyButtons = (
			<div className="sidebar-footer-buttons">
				<Tooltip content="View the getting started guide">
					<button
						className="footer-button"
						onClick={onShowWelcome}
						aria-label="Show getting started guide"
					>
						<InfoIcon color="currentColor" /> Guide
					</button>
				</Tooltip>
				<Tooltip content="View keyboard shortcuts and features">
					<button
						className="footer-button"
						onClick={() => setShowHelpModal(true)}
						aria-label="Show instructions"
					>
						<HelpIcon width={16} height={16} color="currentColor" /> Help
					</button>
				</Tooltip>
				<Tooltip content="Generate a shareable link for your calendar">
					<button
						className="footer-button"
						onClick={onShowShareModal}
						aria-label="Share calendar"
					>
						<ShareIcon width={16} height={16} color="currentColor" /> Share
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
				</div>
				<DarkModeToggle />

			</div>

			<h3>
				<CalIcon height={20} />
				Calendars ({eventGroups.length}/{maxGroups})
			</h3>
			<div className="event-groups-list" role="list">
				{getAllDisplayGroups().map((group) => (
					<div
						key={group.id}
						className={`event-group-item ${selectedGroupId === group.id ? "selected" : ""
							} ${editingGroup?.id === group.id ? "editing" : ""}`}
						onClick={() => {
							if (editingGroup?.id !== group.id && !group.isSpecial) {
								console.log('[Sidebar] User clicked calendar:', group.id, group.name);
								selectEventGroup(group.id);
							}
						}}
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
									<Tooltip content="PTO is based on years of service. 1–4 years: 21 days (6.46hr accrual). 5+ years: 26 days (8hr accrual).">
										<label htmlFor="years-of-service">Years of Employment</label>
									</Tooltip>
									<select
										id="years-of-service"
										// Ensure the value matches your state (likely 1 or 5)
										value={getSelectedGroupPTOConfig()?.yearsOfService || 1}
										onChange={(e) => setPTOConfig(selectedGroupId, { yearsOfService: parseInt(e.target.value) })}
									>
										<option value={1}>1 – 4 years</option>
										<option value={5}>5+ years</option>
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
										max="2000"
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
