import React, { useState } from "react";
import XIcon from "./icons/XIcon";
import { useStore, DateRange } from "../store";
import { format, parseISO, isAfter } from "date-fns";
import "./Modal.css";

interface DateRangeSelectionModalProps {
	selectedDate: string; // ISO date format - initial date clicked
	existingRange?: DateRange; // If editing an existing range
	onClose: () => void;
}

const DateRangeSelectionModal: React.FC<DateRangeSelectionModalProps> = ({
	selectedDate,
	existingRange,
	onClose
}) => {
	const { selectedGroupId, addDateRange, deleteDateRange } = useStore();

	const [startDate, setStartDate] = useState<string>(
		existingRange?.start || selectedDate
	);
	const [endDate, setEndDate] = useState<string>(
		existingRange?.end || selectedDate
	);
	const [description, setDescription] = useState<string>(
		existingRange?.description || ""
	);

	if (!selectedGroupId) {
		return null;
	}

	const parsedDate = parseISO(selectedDate);
	const formattedDate = format(parsedDate, "EEEE, MMMM d, yyyy");

	const handleSubmit = () => {
		// Validate dates
		const start = parseISO(startDate);
		const end = parseISO(endDate);

		if (isAfter(start, end)) {
			alert("Start date must be before or equal to end date.");
			return;
		}

		// Delete existing range if editing
		if (existingRange) {
			deleteDateRange(selectedGroupId, existingRange);
		}

		// Create new range
		const newRange: DateRange = {
			start: startDate,
			end: endDate,
			description: description.trim() || undefined,
		};

		addDateRange(selectedGroupId, newRange);
		onClose();
	};

	const handleDelete = () => {
		if (existingRange) {
			deleteDateRange(selectedGroupId, existingRange);
			onClose();
		}
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<button
					className="modal-close"
					onClick={onClose}
					aria-label="Close date range selection"
				>
					<XIcon color="var(--text-secondary)" />
				</button>

				<h2>{existingRange ? "Edit Date Range" : "Add Date Range"}</h2>

				<div className="pto-modal-content">
					<div className="pto-date-info">
						<h3>Selected: {formattedDate}</h3>
					</div>

					{/* Date range inputs */}
					<div className="date-range-inputs">
						<div className="date-input-group">
							<label htmlFor="start-date">Start Date:</label>
							<input
								type="date"
								id="start-date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>
						<div className="date-input-group">
							<label htmlFor="end-date">End Date:</label>
							<input
								type="date"
								id="end-date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
					</div>

					{/* Description */}
					<div className="pto-description">
						<label htmlFor="range-description">Description (optional):</label>
						<input
							type="text"
							id="range-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="e.g., Sprint 1, Conference, Travel"
							maxLength={100}
						/>
					</div>

					{/* Actions */}
					<div className="modal-actions">
						{existingRange && (
							<button onClick={handleDelete} className="delete-button">
								Delete Range
							</button>
						)}
						<button onClick={onClose} className="cancel-button">
							Cancel
						</button>
						<button onClick={handleSubmit} className="submit-button">
							{existingRange ? "Update" : "Add"} Range
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DateRangeSelectionModal;
