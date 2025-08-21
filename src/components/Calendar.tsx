import React, { useState, useRef, useEffect, useCallback } from "react";
import {
	useStore,
	getCalendarDates,
	isDateInRange,
	checkSameDay,
	DateRange,
	findRangeForDate,
} from "../store";
import { isHolidayFromISODate, getHolidayFromISODate } from "../constants/holidays";
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
import "./Calendar.css";

const Calendar: React.FC = () => {
	const {
		startDate,
		includeWeekends,
		showToday,
		eventGroups,
		selectedGroupId,
		addDateRange,
		deleteDateRange,
		// PTO state
		getSelectedGroupPTOEntries,
		isPTOEnabledForGroup,
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

		const selectedGroup = eventGroups.find(
			(group) => group.id === selectedGroupId
		);
		if (!selectedGroup) return;

		// Check if PTO mode is enabled and date is a holiday
		const dateStr = formatISO(date, { representation: "date" });
		const isPTOEnabled = selectedGroupId && isPTOEnabledForGroup(selectedGroupId);
		
		if (isPTOEnabled && isHolidayFromISODate(dateStr)) {
			const holidayName = getHolidayFromISODate(dateStr);
			alert(`Cannot select ${holidayName}. PTO cannot be requested on company holidays.`);
			return;
		}

		// If PTO mode is enabled, trigger PTO selection instead of normal date range selection
		if (isPTOEnabled) {
			const ptoSelectEvent = new CustomEvent('ptoDateSelect', {
				detail: { date: dateStr }
			});
			window.dispatchEvent(ptoSelectEvent);
			return;
		}

		// Check if the date is already in a range for this group
		const existingRange = findRangeForDate(date, selectedGroup);
		if (existingRange) {
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

		const selectedGroup = eventGroups.find(
			(group) => group.id === selectedGroupId
		);
		if (!selectedGroup) return;

		// Check if PTO mode is enabled and date is a holiday
		const dateStr = formatISO(date, { representation: "date" });
		const isPTOEnabled = selectedGroupId && isPTOEnabledForGroup(selectedGroupId);
		
		if (isPTOEnabled && isHolidayFromISODate(dateStr)) {
			const holidayName = getHolidayFromISODate(dateStr);
			alert(`Cannot select ${holidayName}. PTO cannot be requested on company holidays.`);
			return;
		}

		// If PTO mode is enabled, trigger PTO selection instead of normal date range selection
		if (isPTOEnabled) {
			const ptoSelectEvent = new CustomEvent('ptoDateSelect', {
				detail: { date: dateStr }
			});
			window.dispatchEvent(ptoSelectEvent);
			return;
		}

		// Check if the date is already in a range for this group
		const existingRange = findRangeForDate(date, selectedGroup);
		if (existingRange) {
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

		// Ensure start is before end
		const finalStartDate = isBefore(dragStartDate, dragEndDate)
			? dragStartDate
			: dragEndDate;
		const finalEndDate = isAfter(dragEndDate, dragStartDate)
			? dragEndDate
			: dragStartDate;

		const newRange: DateRange = {
			start: formatISO(finalStartDate, { representation: "date" }),
			end: formatISO(finalEndDate, { representation: "date" }),
		};

		addDateRange(selectedGroupId, newRange);

		setDragStartDate(null);
		setDragEndDate(null);
	}, [isDragging, dragStartDate, dragEndDate, selectedGroupId, addDateRange]);

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
		
		// Check for holidays first
		if (isHolidayFromISODate(dateStr)) {
			const holiday = getHolidayFromISODate(dateStr);
			return holiday ? `🎉 ${holiday}` : "🎉 Company Holiday";
		}

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
				return `🏝️ PTO: ${hourText} (${ptoEntry.hoursPerDay}h)${nameText}${dayText}`;
			}
		}

		// Check for regular events from all groups
		const groupsWithEvent = eventGroups.filter(group => isDateInRange(date, group));
		if (groupsWithEvent.length > 0) {
			if (groupsWithEvent.length === 1) {
				const group = groupsWithEvent[0];
				const isSelected = group.id === selectedGroupId;
				const prefix = isSelected ? "📅" : "📋";
				return `${prefix} ${group.name}${isSelected ? "" : " (background)"}`;
			} else {
				const selectedGroup = groupsWithEvent.find(g => g.id === selectedGroupId);
				const otherGroups = groupsWithEvent.filter(g => g.id !== selectedGroupId);
				if (selectedGroup) {
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

		if (showToday && checkSameDay(date, today)) {
			className += " today";
		}

		if (!includeWeekends && isWeekend(date)) {
			className += " weekend-hidden";
		}

		if (focusedDate && checkSameDay(date, focusedDate)) {
			className += " focused";
		}

		// Add holiday styling when PTO mode is enabled
		const dateStr = formatISO(date, { representation: "date" });
		if (isHolidayFromISODate(dateStr)) {
			className += " holiday";
		}

		// Add PTO entry styling for the selected group
		if (selectedGroupId && isPTOEnabledForGroup(selectedGroupId)) {
			const ptoEntries = getSelectedGroupPTOEntries();
			const ptoEntry = ptoEntries.find(entry => 
				dateStr >= entry.startDate && dateStr <= entry.endDate
			);
			if (ptoEntry) {
				className += " pto-requested";
			}
		}

		if (isDragging && dragStartDate && dragEndDate) {
			const currentDragStart = isBefore(dragStartDate, dragEndDate)
				? dragStartDate
				: dragEndDate;
			const currentDragEnd = isAfter(dragEndDate, dragStartDate)
				? dragEndDate
				: dragStartDate;

			if (date >= currentDragStart && date <= currentDragEnd) {
				className += " dragging";
			}
		}

		return className;
	};

	const getRangeStyles = (date: Date): React.CSSProperties[] => {
		const styles: React.CSSProperties[] = [];
		const groupsWithDate = eventGroups.filter((group) =>
			isDateInRange(date, group)
		);

		// Show selected group prominently, others dimmed
		groupsWithDate.forEach((group, index) => {
			const isSelected = group.id === selectedGroupId;
			const opacity = isSelected ? 1 : 0.3;
			const zIndex = isSelected ? 2 : 1;
			
			if (isSelected) {
				// Selected group takes full height
				styles.push({
					backgroundColor: group.color,
					position: "absolute",
					left: 0,
					right: 0,
					top: 0,
					height: "100%",
					opacity: opacity,
					zIndex: zIndex,
				});
			} else {
				// Other groups shown as thin strips at the bottom
				styles.push({
					backgroundColor: group.color,
					position: "absolute",
					left: `${index * 20}%`,
					width: "20%",
					bottom: "2px",
					height: "3px",
					opacity: opacity,
					zIndex: zIndex,
					borderRadius: "1px",
				});
			}
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
								const isSelected = eventGroups.some((group) =>
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
