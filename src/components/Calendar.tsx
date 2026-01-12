import React, { useState, useRef, useEffect, useCallback } from "react";
import {
	useStore,
	getCalendarDates,
	isDateInRange,
	checkSameDay,
	DateRange,
	findRangeForDate,
} from "../store";
// Holidays are now handled as a regular calendar
import {
	format,
	getMonth,
	getYear,
	getDate,
	getDay,
	isWeekend,
	formatISO,
	isBefore,
	isAfter,
	startOfDay,
	parseISO,
	subDays,
	addDays,
} from "date-fns";
import { getHolidayFromISODate } from "../constants/holidays";
import { PTOCalendarUtils } from "../utils/ptoUtils";
import "./Calendar.css";

const Calendar: React.FC = () => {
	const {
		startDate,
		includeWeekends,
		showToday,
		selectedGroupId,
		addDateRange,
		deleteDateRange,
		// PTO state
		getSelectedGroupPTOEntries,
		isPTOEnabledForGroup,
		deletePTOEntry,
		addPTOEntry,
		cleanupWeekendPTOEntries,
		// Display helpers
		getAllDisplayGroups,
	} = useStore();

	const calendarDates = getCalendarDates(startDate);
	const today = startOfDay(new Date());

	const [isDragging, setIsDragging] = useState(false);
	const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
	const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
	const [focusedDate, setFocusedDate] = useState<Date | null>(null);
	const [isContainerFocused, setIsContainerFocused] = useState(false);
	// Tooltip state
	const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
	const calendarGridRef = useRef<HTMLDivElement>(null);

	// Focus management
	useEffect(() => {
		// Only set initial focus when container is focused
		if (isContainerFocused && !focusedDate && calendarDates.length > 0) {
			const todayInCalendar = calendarDates.find((date) =>
				checkSameDay(date, today)
			);
			setFocusedDate(todayInCalendar || calendarDates[0]);
		}
	}, [calendarDates, focusedDate, today, isContainerFocused]);

	// Cleanup weekend PTO entries on component mount (one-time migration)
	useEffect(() => {
		cleanupWeekendPTOEntries();
	}, []); // Run only once on mount

	const handleContainerFocus = () => {
		setIsContainerFocused(true);
		// Set initial focused date if not already set
		if (!focusedDate && calendarDates.length > 0) {
			const todayInCalendar = calendarDates.find((date) =>
				checkSameDay(date, today)
			);
			setFocusedDate(todayInCalendar || calendarDates[0]);
		}
	};

	const handleContainerBlur = () => {
		setIsContainerFocused(false);
	};

	const handlePTODayDeletion = (date: Date) => {
		if (!selectedGroupId) return;

		const ptoEntries = getSelectedGroupPTOEntries();
		const dateStr = formatISO(date, { representation: "date" });
		const ptoEntry = ptoEntries.find(entry => 
			dateStr >= entry.startDate && dateStr <= entry.endDate
		);

		if (!ptoEntry || !ptoEntry.id) return;

		// Delete the original PTO entry
		deletePTOEntry(selectedGroupId, ptoEntry.id);

		// If it's a multi-day entry, create new entries for the remaining days
		if (ptoEntry.startDate !== ptoEntry.endDate) {
			const entryStart = parseISO(ptoEntry.startDate);
			const entryEnd = parseISO(ptoEntry.endDate);
			const clickedDate = parseISO(dateStr);

			// Create entry for days before the clicked date
			if (isBefore(entryStart, clickedDate)) {
				const beforeEntry = PTOCalendarUtils.createMultiDayEntry(
					formatISO(entryStart, { representation: "date" }),
					formatISO(subDays(clickedDate, 1), { representation: "date" }),
					ptoEntry.hoursPerDay,
					ptoEntry.name
				);
				addPTOEntry(selectedGroupId, beforeEntry);
			}

			// Create entry for days after the clicked date
			if (isAfter(entryEnd, clickedDate)) {
				const afterEntry = PTOCalendarUtils.createMultiDayEntry(
					formatISO(addDays(clickedDate, 1), { representation: "date" }),
					formatISO(entryEnd, { representation: "date" }),
					ptoEntry.hoursPerDay,
					ptoEntry.name
				);
				addPTOEntry(selectedGroupId, afterEntry);
			}
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!focusedDate || !selectedGroupId) return;

		const filteredDates = includeWeekends
			? calendarDates
			: calendarDates.filter((date) => !isWeekend(date));

		const currentIndex = filteredDates.findIndex((date) =>
			checkSameDay(date, focusedDate)
		);

		let newIndex = currentIndex;
		let preventDefault = true;

		switch (e.key) {
			case "ArrowRight":
				newIndex = Math.min(currentIndex + 1, filteredDates.length - 1);
				break;
			case "ArrowLeft":
				newIndex = Math.max(currentIndex - 1, 0);
				break;
			case "ArrowDown":
				// Move down by a week (or 5 days if weekends are hidden)
				newIndex = Math.min(
					currentIndex + (includeWeekends ? 7 : 5),
					filteredDates.length - 1
				);
				break;
			case "ArrowUp":
				// Move up by a week (or 5 days if weekends are hidden)
				newIndex = Math.max(currentIndex - (includeWeekends ? 7 : 5), 0);
				break;
			case " ":
			case "Enter":
				e.preventDefault();
				handleDateSelection(focusedDate);
				return;
			default:
				preventDefault = false;
		}

		if (preventDefault) {
			e.preventDefault();
		}

		if (newIndex !== currentIndex && filteredDates[newIndex]) {
			const newFocusedDate = filteredDates[newIndex];
			setFocusedDate(newFocusedDate);

			// Scroll into view if needed
			const dayElement = document.querySelector(
				`[data-date="${formatISO(newFocusedDate, { representation: "date" })}"]`
			);
			dayElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
	};

	const handleDateSelection = (date: Date) => {
		if (!selectedGroupId) return;

		const selectedGroup = getAllDisplayGroups().find(
			(group) => group.id === selectedGroupId
		);
		if (!selectedGroup) return;

		// Prevent interaction with special calendars (like holidays)
		if (selectedGroup.isSpecial) {
			alert("Cannot modify the holidays calendar. Please select a different calendar.");
			return;
		}

		// Check if the date is already in a range for this group
		const existingRange = findRangeForDate(date, selectedGroup);
		if (existingRange) {
			// If this is a PTO-enabled group, handle PTO entry deletion/splitting
			if (isPTOEnabledForGroup(selectedGroupId)) {
				handlePTODayDeletion(date);
			}
			
			deleteDateRange(selectedGroupId, existingRange);

			// Create two new ranges if needed - one before and one after the clicked date
			const startDate = parseISO(existingRange.start);
			const endDate = parseISO(existingRange.end);

			// Only create new ranges if there are dates to include
			if (isBefore(startDate, date)) {
				const beforeRange: DateRange = {
					start: formatISO(startDate, { representation: "date" }),
					end: formatISO(subDays(date, 1), { representation: "date" }),
				};
				addDateRange(selectedGroupId, beforeRange);
			}

			if (isAfter(endDate, date)) {
				const afterRange: DateRange = {
					start: formatISO(addDays(date, 1), { representation: "date" }),
					end: formatISO(endDate, { representation: "date" }),
				};
				addDateRange(selectedGroupId, afterRange);
			}
		} else {
			// Add single date
			const newRange: DateRange = {
				start: formatISO(date, { representation: "date" }),
				end: formatISO(date, { representation: "date" }),
			};
			addDateRange(selectedGroupId, newRange);
		}
	};

	const handleMouseDown = (date: Date) => {
		if (!selectedGroupId) return;
		setFocusedDate(date);

		const selectedGroup = getAllDisplayGroups().find(
			(group) => group.id === selectedGroupId
		);
		if (!selectedGroup) return;

		// Prevent interaction with special calendars
		if (selectedGroup.isSpecial) {
			alert("Cannot modify the holidays calendar. Please select a different calendar.");
			return;
		}

		// Check if PTO is enabled for this group
		const isPTOEnabled = isPTOEnabledForGroup(selectedGroupId);
		
		// Block PTO creation on weekends only
		if (isPTOEnabled && isWeekend(date)) {
			alert("PTO cannot be requested on weekends.");
			return;
		}

		// For both PTO and regular calendars, start drag detection
		// Check if the date is already in a range for this group
		const existingRange = findRangeForDate(date, selectedGroup);
		if (existingRange) {
			// If this is a PTO-enabled group, handle PTO entry deletion/splitting
			if (isPTOEnabledForGroup(selectedGroupId)) {
				handlePTODayDeletion(date);
			}
			
			deleteDateRange(selectedGroupId, existingRange);

			// Create two new ranges if needed - one before and one after the clicked date
			const startDate = parseISO(existingRange.start);
			const endDate = parseISO(existingRange.end);

			// Only create new ranges if there are dates to include
			if (isBefore(startDate, date)) {
				const beforeRange: DateRange = {
					start: formatISO(startDate, { representation: "date" }),
					end: formatISO(subDays(date, 1), { representation: "date" }),
				};
				addDateRange(selectedGroupId, beforeRange);
			}

			if (isAfter(endDate, date)) {
				const afterRange: DateRange = {
					start: formatISO(addDays(date, 1), { representation: "date" }),
					end: formatISO(endDate, { representation: "date" }),
				};
				addDateRange(selectedGroupId, afterRange);
			}
			return;
		}

		setIsDragging(true);
		setDragStartDate(date);
		setDragEndDate(date);
	};

	const handleMouseMove = (date: Date) => {
		if (!isDragging || !dragStartDate) return;
		
		// For PTO-enabled groups, skip weekends during drag
		const isPTOEnabled = selectedGroupId ? isPTOEnabledForGroup(selectedGroupId) : false;
		if (isPTOEnabled && isWeekend(date)) {
			// Find the nearest weekday in the direction of the drag
			const dragDirection = isAfter(date, dragStartDate) ? 1 : -1;
			let nearestWeekday = new Date(date);
			
			// Keep moving in the drag direction until we find a weekday
			while (isWeekend(nearestWeekday)) {
				nearestWeekday.setDate(nearestWeekday.getDate() + dragDirection);
			}
			
			setDragEndDate(nearestWeekday);
			return;
		}
		
		setDragEndDate(date);
	};

	const handleMouseEnterDate = (date: Date, event: React.MouseEvent) => {
		const tooltipContent = getTooltipContent(date);
		if (tooltipContent) {
			const rect = (event.target as HTMLElement).getBoundingClientRect();
			setTooltip({
				content: tooltipContent,
				x: rect.left + rect.width / 2,
				y: rect.top - 5
			});
		}
	};

	const handleMouseLeaveDate = () => {
		setTooltip(null);
	};

	const handleMouseUp = useCallback(() => {
		if (!isDragging || !dragStartDate || !dragEndDate || !selectedGroupId)
			return;

		setIsDragging(false);

		// Check if PTO is enabled for this group
		const isPTOEnabled = isPTOEnabledForGroup(selectedGroupId);

		// Ensure start is before end
		const finalStartDate = isBefore(dragStartDate, dragEndDate)
			? dragStartDate
			: dragEndDate;
		const finalEndDate = isAfter(dragEndDate, dragStartDate)
			? dragEndDate
			: dragStartDate;

		if (isPTOEnabled) {
			// For PTO calendars, filter out weekends from the date range
			let ptoStartDate = new Date(finalStartDate);
			let ptoEndDate = new Date(finalEndDate);
			
			// Find first weekday in the range
			while (ptoStartDate <= finalEndDate && isWeekend(ptoStartDate)) {
				ptoStartDate = addDays(ptoStartDate, 1);
			}
			
			// Find last weekday in the range
			while (ptoEndDate >= finalStartDate && isWeekend(ptoEndDate)) {
				ptoEndDate = subDays(ptoEndDate, 1);
			}
			
			// If no weekdays found in range, don't create PTO
			if (ptoStartDate > ptoEndDate) {
				alert("PTO cannot be requested on weekends only.");
				return;
			}
			
			const startDateStr = formatISO(ptoStartDate, { representation: "date" });
			const endDateStr = formatISO(ptoEndDate, { representation: "date" });
			
			// Always send both dates for PTO - let modal handle single vs multi-day logic
			const ptoSelectEvent = new CustomEvent('ptoDateSelect', {
				detail: { 
					date: startDateStr,
					endDate: endDateStr  // Always send endDate, let modal decide
				}
			});
			window.dispatchEvent(ptoSelectEvent);
		} else {
			// For regular calendars, create the date range directly
			const newRange: DateRange = {
				start: formatISO(finalStartDate, { representation: "date" }),
				end: formatISO(finalEndDate, { representation: "date" }),
			};

			addDateRange(selectedGroupId, newRange);
		}

		setDragStartDate(null);
		setDragEndDate(null);
	}, [isDragging, dragStartDate, dragEndDate, selectedGroupId, addDateRange, isPTOEnabledForGroup, checkSameDay]);

	useEffect(() => {
		const handleGlobalMouseUp = () => {
			if (isDragging) {
				handleMouseUp();
			}
		};

		window.addEventListener("mouseup", handleGlobalMouseUp);
		return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
	}, [isDragging, handleMouseUp]);

	const getMonthYearKey = (date: Date) => `${getYear(date)}-${getMonth(date)}`;

	const adjustPaddingForWeekdays = (dayOfWeek: number): number => {
		if (!includeWeekends) {
			if (dayOfWeek === 0) return 0;
			return dayOfWeek - 1;
		}
		return dayOfWeek;
	};

	const groupedDates = calendarDates.reduce((acc, date) => {
		if (!includeWeekends && isWeekend(date)) {
			return acc;
		}
		const key = getMonthYearKey(date);
		if (!acc[key]) {
			acc[key] = [];
		}
		acc[key].push(date);
		return acc;
	}, {} as { [key: string]: Date[] });

	const getTooltipContent = (date: Date): string | null => {
		const dateStr = formatISO(date, { representation: "date" });
		
		// Holidays are now handled as a regular calendar, so check event groups first

		// Check for PTO entries in the selected group
		if (selectedGroupId && isPTOEnabledForGroup(selectedGroupId)) {
			const ptoEntries = getSelectedGroupPTOEntries();
			const ptoEntry = ptoEntries.find(entry => 
				dateStr >= entry.startDate && dateStr <= entry.endDate
			);
			if (ptoEntry) {
				const hourText = ptoEntry.hoursPerDay === 2 ? "Quarter Day" : 
								ptoEntry.hoursPerDay === 4 ? "Half Day" : "Full Day";
				const nameText = ptoEntry.name ? ` - ${ptoEntry.name}` : "";
				const dayText = ptoEntry.startDate === ptoEntry.endDate ? "" : 
								` (${ptoEntry.startDate} to ${ptoEntry.endDate})`;
				return `PTO: ${hourText} (${ptoEntry.hoursPerDay}h)${nameText}${dayText}`;
			}
		}

		// Check for regular events from all groups
		const groupsWithEvent = getAllDisplayGroups().filter(group => isDateInRange(date, group));
		if (groupsWithEvent.length > 0) {
			if (groupsWithEvent.length === 1) {
				const group = groupsWithEvent[0];
				const isSelected = group.id === selectedGroupId;
				const isHoliday = group.name === "Unispace Holidays";
				const prefix = isHoliday ? "🎉" : (isSelected ? "📅" : "📋");
				
				if (isHoliday) {
					const holidayName = getHolidayFromISODate(formatISO(date, { representation: "date" }));
					return `${prefix} ${holidayName || group.name}`;
				}
				
				return `${prefix} ${group.name}${isSelected ? "" : ""}`;
			} else {
				const holidayGroup = groupsWithEvent.find(g => g.name === "Unispace Holidays");
				const selectedGroup = groupsWithEvent.find(g => g.id === selectedGroupId);
				const otherGroups = groupsWithEvent.filter(g => g.id !== selectedGroupId && g.name !== "Unispace Holidays");
				
				if (holidayGroup && selectedGroup) {
					const holidayName = getHolidayFromISODate(formatISO(date, { representation: "date" }));
					const others = otherGroups.length > 0 ? ` + ${otherGroups.map(g => g.name).join(", ")}` : "";
					return `🎉 ${holidayName || holidayGroup.name} + 📅 ${selectedGroup.name}${others}`;
				} else if (holidayGroup) {
					const holidayName = getHolidayFromISODate(formatISO(date, { representation: "date" }));
					const others = otherGroups.length > 0 ? ` + ${otherGroups.map(g => g.name).join(", ")}` : "";
					return `🎉 ${holidayName || holidayGroup.name}${others}`;
				} else if (selectedGroup) {
					const others = otherGroups.map(g => g.name).join(", ");
					return `📅 ${selectedGroup.name} + ${otherGroups.length} other${otherGroups.length > 1 ? 's' : ''}: ${others}`;
				} else {
					const groups = groupsWithEvent.map(g => g.name).join(", ");
					return `📋 Background events: ${groups}`;
				}
			}
		}

		return null;
	};

	const getDayClassName = (date: Date): string => {
		let className = "calendar-day";
		const dateStr = formatISO(date, { representation: "date" });

		// Check for holidays first
		const allGroups = getAllDisplayGroups();
		const holidayGroup = allGroups.find(g => g.name === "Unispace Holidays");
		const isHoliday = holidayGroup && isDateInRange(date, holidayGroup);

		// Count PTO entries across all PTO-enabled groups for this date
		let ptoCount = 0;
		const ptoGroups = allGroups.filter(group =>
			group.ptoConfig?.isEnabled &&
			group.ptoEntries &&
			group.ptoEntries.some(entry =>
				dateStr >= entry.startDate && dateStr <= entry.endDate
			)
		);
		ptoCount = ptoGroups.length;

		// Apply PTO state classes based on count
		if (ptoCount === 1) {
			className += " pto-single";
		} else if (ptoCount === 2) {
			className += " pto-double";
		} else if (ptoCount >= 3) {
			className += " pto-triple";
		}

		// Apply holiday class if it's a holiday
		if (isHoliday) {
			className += " holiday";
		}

		if (showToday && checkSameDay(date, today)) {
			className += " today";
		}

		if (!includeWeekends && isWeekend(date)) {
			className += " weekend-hidden";
		} else if (isWeekend(date)) {
			className += " weekend";
		}

		if (focusedDate && checkSameDay(date, focusedDate)) {
			className += " focused";
		}

		if (isDragging && dragStartDate && dragEndDate) {
			const currentDragStart = isBefore(dragStartDate, dragEndDate)
				? dragStartDate
				: dragEndDate;
			const currentDragEnd = isAfter(dragEndDate, dragStartDate)
				? dragEndDate
				: dragStartDate;

			if (date >= currentDragStart && date <= currentDragEnd) {
				// For PTO-enabled groups, only highlight weekdays during drag
				const isPTOEnabled = selectedGroupId ? isPTOEnabledForGroup(selectedGroupId) : false;
				if (isPTOEnabled && isWeekend(date)) {
					// Skip highlighting weekends for PTO groups
				} else {
					className += " dragging";
				}
			}
		}

		return className;
	};

	const getRangeStyles = (date: Date): React.CSSProperties[] => {
		const styles: React.CSSProperties[] = [];
		const groupsWithDate = getAllDisplayGroups().filter((group) =>
			isDateInRange(date, group)
		);

		const totalGroups = groupsWithDate.length;
		groupsWithDate.forEach((group, index) => {
			styles.push({
				backgroundColor: group.color,
				position: "absolute",
				left: 0,
				right: 0,
				top: `${(index / totalGroups) * 100}%`,
				height: `${100 / totalGroups}%`,
			});
		});

		return styles;
	};

	return (
		<>
		<div
			className="calendar-container"
			ref={calendarGridRef}
			onKeyDown={handleKeyDown}
			onFocus={handleContainerFocus}
			onBlur={handleContainerBlur}
			tabIndex={0}
			role="application"
			aria-label="Calendar grid. Use arrow keys to navigate dates and space or enter to select."
		>
			{Object.entries(groupedDates).map(([monthYearKey, datesInMonth]) => {
				const [year, monthIndex] = monthYearKey.split("-").map(Number);
				const monthDate = new Date(year, monthIndex);
				const firstDayOfMonth = datesInMonth[0];
				const dayOfWeek = getDay(firstDayOfMonth);
				const paddingDays = Array.from({
					length: adjustPaddingForWeekdays(dayOfWeek),
				});

				return (
					<div key={monthYearKey} className="calendar-month">
						<h3 id={`month-${monthYearKey}`}>
							{format(monthDate, "MMMM yyyy")}
						</h3>
						<div
							className={`calendar-grid ${
								!includeWeekends ? "weekends-hidden" : ""
							}`}
							role="grid"
							aria-labelledby={`month-${monthYearKey}`}
						>
							{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
								.filter(
									(_, index) => includeWeekends || (index > 0 && index < 6)
								)
								.map((day) => (
									<div key={day} className="weekday-header" role="columnheader">
										{day}
									</div>
								))}

							{paddingDays.map((_, index) => (
								<div
									key={`padding-${index}`}
									className="calendar-day empty"
									role="gridcell"
									aria-hidden="true"
								/>
							))}

							{datesInMonth.map((date) => {
								const dateStr = formatISO(date, { representation: "date" });
								const isSelected = getAllDisplayGroups().some((group) =>
									isDateInRange(date, group)
								);
								return (
									<div
										key={dateStr}
										className={getDayClassName(date)}
										onMouseDown={() => handleMouseDown(date)}
										onMouseEnter={(e) => {
											handleMouseMove(date);
											handleMouseEnterDate(date, e);
										}}
										onMouseLeave={handleMouseLeaveDate}
										data-date={dateStr}
										role="gridcell"
										aria-selected={isSelected}
										aria-label={format(date, "MMMM d, yyyy")}
										tabIndex={
											focusedDate && checkSameDay(date, focusedDate) ? 0 : -1
										}
									>
										<span className="day-number" aria-hidden="true">
											{getDate(date)}
										</span>
										<div className="range-indicators" aria-hidden="true">
											{getRangeStyles(date).map((style, index) => (
												<div
													key={`range-${index}`}
													className="range-indicator"
													style={style}
												/>
											))}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
		{/* Tooltip */}
		{tooltip && (
			<div
				className="calendar-tooltip"
				style={{
					position: 'fixed',
					left: tooltip.x,
					top: tooltip.y,
					transform: 'translateX(-50%) translateY(-100%)',
					zIndex: 1000,
					backgroundColor: 'rgba(0, 0, 0, 0.9)',
					color: 'white',
					padding: '8px 12px',
					borderRadius: '6px',
					fontSize: '14px',
					whiteSpace: 'nowrap',
					pointerEvents: 'none',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
				}}
			>
				{tooltip.content}
			</div>
		)}
		</>
	);
};

export default Calendar;
