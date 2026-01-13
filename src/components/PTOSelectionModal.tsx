import React, { useState } from "react";
import XIcon from "./icons/XIcon";
import { useStore } from "../store";
import { PTOEntry, PTOCalendarUtils } from "../utils/ptoUtils";
import { format, parseISO, addDays, isWeekend, eachDayOfInterval } from "date-fns";
import { getHolidayFromISODate } from "../constants/holidays";
import "./Modal.css";

interface PTOSelectionModalProps {
	selectedDate: string; // ISO date format
	initialEndDate?: string; // Optional end date for multi-day selection
	onClose: () => void;
}

const PTOSelectionModal: React.FC<PTOSelectionModalProps> = ({ selectedDate, initialEndDate, onClose }) => {
	const { 
		selectedGroupId,
		addPTOEntry, 
		updatePTOEntry, 
		deletePTOEntry, 
		validatePTOEntry, 
		getPTOSummary,
		getSelectedGroupPTOEntries
	} = useStore();
	
	const [selectedHours, setSelectedHours] = useState<number>(8);
	const [description, setDescription] = useState<string>("");
	const [isMultiDay, setIsMultiDay] = useState<boolean>(false);
	const [endDate, setEndDate] = useState<string>(selectedDate || "");
	const [duration, setDuration] = useState<number>(1);
	
	// Find existing PTO entry for this date
	const ptoEntries = getSelectedGroupPTOEntries();
	const existingEntry = ptoEntries.find(entry => 
		selectedDate >= entry.startDate && selectedDate <= entry.endDate
	);
	
	// Initialize form with existing entry if it exists
	React.useEffect(() => {
		if (existingEntry) {
			setSelectedHours(existingEntry.hoursPerDay);
			setDescription(existingEntry.name ?? "");
			setIsMultiDay(existingEntry.startDate !== existingEntry.endDate);
			setEndDate(existingEntry.endDate);
			// Calculate duration (weekdays only)
			const weekdayCount = countWeekdays(existingEntry.startDate, existingEntry.endDate);
			setDuration(weekdayCount);
		} else {
			setSelectedHours(8);
			setDescription("");
			
			// Determine if this is multi-day by comparing actual dates
			const finalEndDate = initialEndDate || selectedDate || "";
			const isActuallyMultiDay = selectedDate !== finalEndDate;
			
			setIsMultiDay(isActuallyMultiDay);
			setEndDate(finalEndDate);
			
			if (isActuallyMultiDay) {
				// Calculate weekdays for multi-day selection
				const weekdayCount = countWeekdays(selectedDate, finalEndDate);
				setDuration(weekdayCount);
			} else {
				// Single day selection
				setDuration(1);
			}
		}
	}, [existingEntry, selectedDate, initialEndDate]);

	if (!selectedGroupId) {
		return null;
	}

	const summary = getPTOSummary(selectedGroupId);
	const holidayName = getHolidayFromISODate(selectedDate);
	const parsedDate = parseISO(selectedDate);
	const formattedDate = format(parsedDate, "EEEE, MMMM d, yyyy");

	// Helper function to count weekdays between two dates
	const countWeekdays = (startDate: string, endDate: string): number => {
		const start = parseISO(startDate);
		const end = parseISO(endDate);
		const dates = eachDayOfInterval({ start, end });
		return dates.filter(date => !isWeekend(date)).length;
	};

	// Calculate end date from weekday count
	const calculateEndDate = (startDate: string, weekdayCount: number): string => {
		let current = parseISO(startDate);
		let weekdaysFound = 0;
		
		// Keep adding days until we find the required number of weekdays
		while (weekdaysFound < weekdayCount) {
			if (!isWeekend(current)) {
				weekdaysFound++;
			}
			if (weekdaysFound < weekdayCount) {
				current = addDays(current, 1);
			}
		}
		
		return format(current, "yyyy-MM-dd");
	};

	// Handle duration change (days = weekdays)
	const handleDurationChange = (weekdays: number) => {
		setDuration(weekdays);
		setEndDate(calculateEndDate(selectedDate, weekdays));
	};

	const handleSubmit = () => {
		const finalEndDate = isMultiDay ? endDate : selectedDate;
		const entry: PTOEntry = isMultiDay 
			? PTOCalendarUtils.createMultiDayEntry(
				selectedDate,
				finalEndDate,
				selectedHours,
				description.trim() || undefined
			)
			: PTOCalendarUtils.createSingleDayEntry(
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
		console.log('handleDelete called:', { existingEntry, selectedGroupId });
		if (existingEntry && existingEntry.id) {
			console.log('Calling deletePTOEntry with:', selectedGroupId, existingEntry.id);
			deletePTOEntry(selectedGroupId, existingEntry.id);
			onClose();
		} else {
			console.log('No existing entry or ID to delete');
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
				
				<h2>{existingEntry ? "Edit PTO Request" : "Log PTO"}</h2>
				
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
							{/* Multi-day toggle */}
							<div className="pto-duration-selection">
								<label htmlFor="pto-multiday">Multi-day PTO:</label>
								<input
									type="checkbox"
									id="pto-multiday"
									checked={isMultiDay}
									onChange={(e) => setIsMultiDay(e.target.checked)}
								/>
							</div>

							{/* Duration selection for multi-day */}
							{isMultiDay && (
								<div className="pto-multiday-options">
									<div className="pto-duration-input">
										<label htmlFor="pto-duration">Number of days:</label>
										<input
											type="number"
											id="pto-duration"
											min="1"
											max="30"
											value={duration}
											onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
										/>
									</div>
									<div className="pto-end-date">
										<label htmlFor="pto-end-date">End date:</label>
										<input
											type="date"
											id="pto-end-date"
											value={endDate}
											onChange={(e) => {
												setEndDate(e.target.value);
												// Calculate weekdays correctly (not total days including weekends)
												const weekdayCount = countWeekdays(selectedDate, e.target.value);
												setDuration(Math.max(1, weekdayCount));
											}}
										/>
									</div>
								</div>
							)}

							<div className="pto-hours-selection">
								<label htmlFor="pto-hours">Hours per day:</label>
								<div className="hours-buttons">
									{[2, 4, 8].map(hours => (
										<button
											key={hours}
											className={`hour-button ${selectedHours === hours ? 'selected' : ''}`}
											onClick={() => setSelectedHours(hours)}
											type="button"
										>
											{getHourDisplay(hours)}
										</button>
									))}
								</div>
								{isMultiDay && (
									<div className="pto-total-hours">
										Total hours: {selectedHours * duration}h
									</div>
								)}
							</div>

							<div className="pto-description">
								<label htmlFor="pto-description">Description (Optional):</label>
								<input
									type="text"
									id="pto-description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="e.g., Vacation, Personal, Medical"
									maxLength={100}
								/>
							</div>

							{summary && (
								<div className="pto-balance-info">
									<h4>PTO Balance Summary</h4>
									<div className="balance-grid">
										<div className="balance-item">
											<span className="balance-label">Remaining:</span>
											<span className="balance-value">{summary.remainingHours}h ({summary.remainingDays} days)</span>
										</div>
										<div className="balance-item">
											<span className="balance-label">Used:</span>
											<span className="balance-value">{summary.usedHours}h ({summary.usedDays} days)</span>
										</div>
										<div className="balance-item">
											<span className="balance-label">Total:</span>
											<span className="balance-value">{summary.totalHours}h ({summary.totalDays} days)</span>
										</div>
									</div>
								</div>
							)}

							<div className="pto-modal-actions">
								{existingEntry && (
									<button 
										className="delete-button"
										onClick={handleDelete}
										type="button"
									>
										Delete Request
									</button>
								)}
								<div className="primary-actions">
									<button 
										className="cancel-button"
										onClick={onClose}
										type="button"
									>
										Cancel
									</button>
									<button 
										className="submit-button"
										onClick={handleSubmit}
										type="button"
									>
										{existingEntry ? "Update Request" : "Log PTO"}
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default PTOSelectionModal;