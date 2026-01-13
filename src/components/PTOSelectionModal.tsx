import React, { useState } from "react";
import XIcon from "./icons/XIcon";
import { useStore } from "../store";
import { PTOEntry, PTOCalendarUtils } from "../utils/ptoUtils";
import { format, parseISO, isWithinInterval } from "date-fns";
import { getHolidayFromISODate } from "../constants/holidays";
import "./Modal.css";

interface PTOSelectionModalProps {
	selectedDate: string; // ISO date format
	onClose: () => void;
}

const PTOSelectionModal: React.FC<PTOSelectionModalProps> = ({ selectedDate, onClose }) => {
	const {
		selectedGroupId,
		addPTOEntry,
		updatePTOEntry,
		deletePTOEntry,
		validatePTOEntry,
		getPTOSummary,
		getSelectedGroupPTOEntries
	} = useStore();

	// Find existing PTO entry for this date (handles both single-day and multi-day entries)
	const ptoEntries = getSelectedGroupPTOEntries();
	const selectedDateObj = parseISO(selectedDate);
	const existingEntry = ptoEntries.find(entry => {
		const entryStart = parseISO(entry.startDate);
		const entryEnd = parseISO(entry.endDate);
		// Check if selected date falls within this PTO entry's range
		return isWithinInterval(selectedDateObj, { start: entryStart, end: entryEnd });
	});

	const [selectedHours, setSelectedHours] = useState<number>(existingEntry?.hoursPerDay || 8);
	const [description, setDescription] = useState<string>(existingEntry?.name || "");

	if (!selectedGroupId) {
		return null;
	}

	const summary = getPTOSummary(selectedGroupId);
	const holidayName = getHolidayFromISODate(selectedDate);
	const parsedDate = parseISO(selectedDate);
	const formattedDate = format(parsedDate, "EEEE, MMMM d, yyyy");

	const handleSubmit = () => {
		// Always single-day entries now
		const entry: PTOEntry = PTOCalendarUtils.createSingleDayEntry(
			selectedDate,
			selectedHours,
			description.trim() || undefined
		);

		const validation = validatePTOEntry(selectedGroupId, entry);
		if (!validation.isValid) {
			alert(validation.warning);
			return;
		}

		if (existingEntry && existingEntry.id) {
			updatePTOEntry(selectedGroupId, existingEntry.id, entry);
		} else {
			addPTOEntry(selectedGroupId, entry);
		}
		onClose();
	};

	const handleDelete = () => {
		if (existingEntry && existingEntry.id) {
			deletePTOEntry(selectedGroupId, existingEntry.id);
			onClose();
		}
	};

	const getHourDisplay = (hours: number): string => {
		switch (hours) {
			case 2: return "2h (Quarter Day)";
			case 4: return "4h (Half Day)";
			case 8: return "8h (Full Day)";
			default: return `${hours}h`;
		}
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<button
					className="modal-close"
					onClick={onClose}
					aria-label="Close PTO selection"
				>
					<XIcon color="var(--text-secondary)" />
				</button>

				<h2>{existingEntry ? "Edit PTO" : "Add PTO"}</h2>

				<div className="pto-modal-content">
					<div className="pto-date-info">
						<h3>{formattedDate}</h3>
						{holidayName && (
							<div className="holiday-warning">
								<strong>⚠️ Company Holiday:</strong> {holidayName}
								<p>PTO cannot be requested on company holidays.</p>
							</div>
						)}
					</div>

					{!holidayName && (
						<>
							{/* Hours selection */}
							<div className="pto-hours-selection">
								<label>Hours:</label>
								<div className="hours-buttons">
									{[2, 4, 8].map((hours) => (
										<button
											key={hours}
											type="button"
											className={`hour-button ${selectedHours === hours ? 'selected' : ''}`}
											onClick={() => setSelectedHours(hours)}
										>
											{getHourDisplay(hours)}
										</button>
									))}
								</div>
							</div>

							{/* Description */}
							<div className="pto-description">
								<label htmlFor="pto-description">Description (optional):</label>
								<input
									type="text"
									id="pto-description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="e.g., Vacation, Doctor appointment"
									maxLength={100}
								/>
							</div>

							{/* Summary info */}
							{summary && (
								<div className="pto-summary-info">
									<p>
										<strong>Available:</strong> {summary.remainingHours}h remaining
										{selectedHours > 0 && !existingEntry && (
											<> (will be {summary.remainingHours - selectedHours}h after this)</>
										)}
									</p>
								</div>
							)}

							{/* Actions */}
							<div className="modal-actions">
								{existingEntry && (
									<button onClick={handleDelete} className="delete-button">
										Delete PTO
									</button>
								)}
								<button onClick={onClose} className="cancel-button">
									Cancel
								</button>
								<button onClick={handleSubmit} className="submit-button">
									{existingEntry ? 'Update' : 'Add'} PTO
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default PTOSelectionModal;
