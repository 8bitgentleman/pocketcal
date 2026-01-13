import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import {
	useStore,
	getCalendarDates,
	isDateInRange,
	checkSameDay,
	DateRange,
	findRangeForDate,
	EventGroup,
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
import { PTOCalendarUtils, PTOEntry } from "../utils/ptoUtils";
import { createGradientFromColor } from "../utils/gradientUtils";
import "./Calendar.css";

// Memoized DateCell component to prevent unnecessary re-renders
interface DateCellProps {
	date: Date;
	dateStr: string;
	isSelected: boolean;
	ptoEntry: PTOEntry | null;
	hasSingleCalendar: boolean;
	className: string;
	gradientStyle: React.CSSProperties | null;
	rangeStyles: React.CSSProperties[];
	isFocused: boolean;
	onMouseDown: (date: Date) => void;
	onMouseEnter: (date: Date, e: React.MouseEvent) => void;
	onMouseLeave: () => void;
}

const DateCell = memo(({
	date,
	dateStr,
	isSelected,
	ptoEntry,
	hasSingleCalendar,
	className,
	gradientStyle,
	rangeStyles,
	isFocused,
	onMouseDown,
	onMouseEnter,
	onMouseLeave
}: DateCellProps) => {
	return (
		<div
			key={dateStr}
			className={className}
			style={gradientStyle || {}}
			onMouseDown={() => onMouseDown(date)}
			onMouseEnter={(e) => onMouseEnter(date, e)}
			onMouseLeave={onMouseLeave}
			data-date={dateStr}
			role="gridcell"
			aria-selected={isSelected}
			aria-label={format(date, "MMMM d, yyyy")}
			tabIndex={isFocused ? 0 : -1}
		>
			<span className="day-number" aria-hidden="true">
				{getDate(date)}
			</span>
			{/* Only render range indicators for multiple calendar overlaps */}
			{!ptoEntry && !hasSingleCalendar && (
				<div className="range-indicators" aria-hidden="true">
					{rangeStyles.map((style, index) => (
						<div
							key={`range-${index}`}
							className="range-indicator"
							style={style}
						/>
					))}
				</div>
			)}
		</div>
	);
}, (prevProps, nextProps) => {
	// Custom comparison function - only re-render if these specific props change
	return (
		prevProps.dateStr === nextProps.dateStr &&
		prevProps.className === nextProps.className &&
		prevProps.isSelected === nextProps.isSelected &&
		prevProps.ptoEntry === nextProps.ptoEntry &&
		prevProps.hasSingleCalendar === nextProps.hasSingleCalendar &&
		prevProps.isFocused === nextProps.isFocused &&
		JSON.stringify(prevProps.gradientStyle) === JSON.stringify(nextProps.gradientStyle) &&
		prevProps.rangeStyles.length === nextProps.rangeStyles.length
	);
});

DateCell.displayName = 'DateCell';

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
		// Get actual state arrays for proper memoization dependencies
		eventGroups,
		holidays,
	} = useStore();

	const calendarDates = getCalendarDates(startDate);
	const today = startOfDay(new Date());

	// Memoize expensive store lookups based on actual state data (not function refs)
	const allDisplayGroups = useMemo(() => getAllDisplayGroups(), [eventGroups, holidays, getAllDisplayGroups]);
	const selectedGroup = useMemo(() =>
		allDisplayGroups.find(g => g.id === selectedGroupId),
		[allDisplayGroups, selectedGroupId]
	);
	const isPTOEnabled = useMemo(() =>
		selectedGroupId ? isPTOEnabledForGroup(selectedGroupId) : false,
		[selectedGroupId, eventGroups, isPTOEnabledForGroup]
	);
	const ptoEntries = useMemo(() =>
		selectedGroupId && isPTOEnabled ? getSelectedGroupPTOEntries() : [],
		[selectedGroupId, isPTOEnabled, eventGroups, getSelectedGroupPTOEntries]
	);

	// Pre-compute a Map of ONLY dates that have events/PTO/holidays
	// This way we only process ~50 dates instead of 365
	const dateInfoMap = useMemo(() => {
		const map = new Map<string, {
			ptoEntry?: PTOEntry;
			groups: EventGroup[];
			isHoliday: boolean;
		}>();

		// Add PTO entries
		if (isPTOEnabled && ptoEntries.length > 0) {
			ptoEntries.forEach(entry => {
				if (entry.startDate === entry.endDate) {
					const existing = map.get(entry.startDate) || { groups: [], isHoliday: false };
					existing.ptoEntry = entry;
					map.set(entry.startDate, existing);
				} else {
					const start = parseISO(entry.startDate);
					const end = parseISO(entry.endDate);
					let current = start;
					while (current <= end) {
						const dateStr = formatISO(current, { representation: "date" });
						const existing = map.get(dateStr) || { groups: [], isHoliday: false };
						existing.ptoEntry = entry;
						map.set(dateStr, existing);
						current = addDays(current, 1);
					}
				}
			});
		}

		// Add events from all groups (including holidays)
		allDisplayGroups.forEach(group => {
			group.ranges.forEach(range => {
				if (range.start === range.end) {
					const existing = map.get(range.start) || { groups: [], isHoliday: false };
					existing.groups.push(group);
					if (group.name === "Unispace Holidays") existing.isHoliday = true;
					map.set(range.start, existing);
				} else {
					const start = parseISO(range.start);
					const end = parseISO(range.end);
					let current = start;
					while (current <= end) {
						const dateStr = formatISO(current, { representation: "date" });
						const existing = map.get(dateStr) || { groups: [], isHoliday: false };
						existing.groups.push(group);
						if (group.name === "Unispace Holidays") existing.isHoliday = true;
						map.set(dateStr, existing);
						current = addDays(current, 1);
					}
				}
			});
		});

		return map;
	}, [ptoEntries, isPTOEnabled, allDisplayGroups]);

	const [isDragging, setIsDragging] = useState(false);
	const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
	const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
	const [focusedDate, setFocusedDate] = useState<Date | null>(null);
	const [isContainerFocused, setIsContainerFocused] = useState(false);
	// PTO click state - use refs for synchronous access
	const ptoClickedDateRef = useRef<Date | null>(null);
	const longPressTimerRef = useRef<number | null>(null);
	const [isLongPress, setIsLongPress] = useState(false);
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

	// Simplified PTO toggle - handles both single-day and legacy multi-day entries
	const handlePTOToggle = useCallback((date: Date) => {
		if (!selectedGroupId) return;

		const dateStr = formatISO(date, { representation: "date" });
		const dateInfo = dateInfoMap.get(dateStr);
		const ptoEntry = dateInfo?.ptoEntry;

		if (ptoEntry && ptoEntry.id) {
			// Remove existing PTO for this day
			deletePTOEntry(selectedGroupId, ptoEntry.id);
		} else {
			// Add 8h PTO for this day
			const newEntry = PTOCalendarUtils.createSingleDayEntry(dateStr, 8);
			addPTOEntry(selectedGroupId, newEntry);
		}
	}, [selectedGroupId, dateInfoMap, deletePTOEntry, addPTOEntry]);

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

		if (!selectedGroup) return;

		// Prevent interaction with special calendars (like holidays)
		if (selectedGroup.isSpecial) {
			alert("Cannot modify the holidays calendar. Please select a different calendar.");
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

		if (!selectedGroup) return;

		// Prevent interaction with special calendars
		if (selectedGroup.isSpecial) {
			alert("Cannot modify the holidays calendar. Please select a different calendar.");
			return;
		}

		if (isPTOEnabled) {
			// PTO mode: click-to-toggle with long-press for custom hours
			// Block PTO creation on weekends
			if (isWeekend(date)) {
				alert("PTO cannot be requested on weekends.");
				return;
			}

			// Store clicked date for handleMouseUp
			ptoClickedDateRef.current = date;

			// Clear any existing timer
			if (longPressTimerRef.current) {
				clearTimeout(longPressTimerRef.current);
			}

			// Start long-press timer (500ms)
			setIsLongPress(false);
			longPressTimerRef.current = window.setTimeout(() => {
				setIsLongPress(true);
				longPressTimerRef.current = null;
				// Open modal for custom hours
				const ptoSelectEvent = new CustomEvent('ptoDateSelect', {
					detail: {
						date: formatISO(date, { representation: "date" }),
						endDate: formatISO(date, { representation: "date" })
					}
				});
				window.dispatchEvent(ptoSelectEvent);
			}, 500);
		} else {
			// Regular calendar mode: use existing drag logic
			const existingRange = findRangeForDate(date, selectedGroup);
			if (existingRange) {
				deleteDateRange(selectedGroupId, existingRange);

				// Create two new ranges if needed - one before and one after the clicked date
				const startDate = parseISO(existingRange.start);
				const endDate = parseISO(existingRange.end);

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
		}
	};

	const handleMouseMove = (date: Date) => {
		// Cancel long-press if mouse moves (user is dragging, not long-pressing)
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
			setIsLongPress(false);
		}

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

	const handleMouseLeaveDate = useCallback(() => {
		setTooltip(null);
	}, []);

	const handleMouseUp = useCallback(() => {
		// Clear long-press timer if it's still running
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}

		// If this was a long press, don't do anything (modal already opened)
		if (isLongPress) {
			setIsLongPress(false);
			ptoClickedDateRef.current = null;
			return;
		}

		if (isPTOEnabled) {
			// PTO mode: simple click = instant 8h toggle
			if (ptoClickedDateRef.current) {
				handlePTOToggle(ptoClickedDateRef.current);
				ptoClickedDateRef.current = null;
			}
			return;
		}

		// Regular calendar mode: existing drag logic
		if (!isDragging || !dragStartDate || !dragEndDate || !selectedGroupId) {
			setDragStartDate(null);
			setDragEndDate(null);
			return;
		}

		setIsDragging(false);

		// Ensure start is before end
		const finalStartDate = isBefore(dragStartDate, dragEndDate)
			? dragStartDate
			: dragEndDate;
		const finalEndDate = isAfter(dragEndDate, dragStartDate)
			? dragEndDate
			: dragStartDate;

		// For regular calendars, create the date range directly
		const newRange: DateRange = {
			start: formatISO(finalStartDate, { representation: "date" }),
			end: formatISO(finalEndDate, { representation: "date" }),
		};

		addDateRange(selectedGroupId, newRange);

		setDragStartDate(null);
		setDragEndDate(null);
	}, [isDragging, dragStartDate, dragEndDate, selectedGroupId, isLongPress, addDateRange, isPTOEnabled, handlePTOToggle]);

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
		const dateInfo = dateInfoMap.get(dateStr);

		if (!dateInfo) return null; // No events on this date

		// Check for PTO entries in the selected group
		if (selectedGroupId && isPTOEnabled && dateInfo.ptoEntry) {
			const ptoEntry = dateInfo.ptoEntry;
			const hourText = ptoEntry.hoursPerDay === 2 ? "Quarter Day" :
							ptoEntry.hoursPerDay === 4 ? "Half Day" : "Full Day";
			const nameText = ptoEntry.name ? ` - ${ptoEntry.name}` : "";
			const dayText = ptoEntry.startDate === ptoEntry.endDate ? "" :
							` (${ptoEntry.startDate} to ${ptoEntry.endDate})`;
			return `PTO: ${hourText} (${ptoEntry.hoursPerDay}h)${nameText}${dayText}`;
		}

		// Check for regular events from all groups
		const groupsWithEvent = dateInfo.groups;
		if (groupsWithEvent.length > 0) {
			if (groupsWithEvent.length === 1) {
				const group = groupsWithEvent[0];
				const isSelected = group.id === selectedGroupId;
				const isHoliday = group.name === "Unispace Holidays";
				const prefix = isHoliday ? "" : (isSelected ? "" : "");
				
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
					return `${holidayName || holidayGroup.name} + ${selectedGroup.name}${others}`;
				} else if (holidayGroup) {
					const holidayName = getHolidayFromISODate(formatISO(date, { representation: "date" }));
					const others = otherGroups.length > 0 ? ` + ${otherGroups.map(g => g.name).join(", ")}` : "";
					return `${holidayName || holidayGroup.name}${others}`;
				} else if (selectedGroup) {
					const others = otherGroups.map(g => g.name).join(", ");
					return `${selectedGroup.name} + ${otherGroups.length} other${otherGroups.length > 1 ? 's' : ''}: ${others}`;
				} else {
					const groups = groupsWithEvent.map(g => g.name).join(", ");
					return `Background events: ${groups}`;
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
		} else if (isWeekend(date)) {
			className += " weekend";
		}

		if (focusedDate && checkSameDay(date, focusedDate)) {
			className += " focused";
		}

		const dateStr = formatISO(date, { representation: "date" });
		const dateInfo = dateInfoMap.get(dateStr);

		// Add PTO-specific visual classes (only on weekdays)
		if (dateInfo?.ptoEntry && selectedGroupId && isPTOEnabled && !isWeekend(date)) {
			const ptoEntry = dateInfo.ptoEntry;
			if (ptoEntry.hoursPerDay === 8) {
				className += " pto-full-day";
			} else if (ptoEntry.hoursPerDay === 4) {
				className += " pto-half-day";
			} else if (ptoEntry.hoursPerDay === 2) {
				className += " pto-quarter-day";
			}
		}

		// Check if this date has a holiday (apply subtle background)
		if (dateInfo?.isHoliday) {
			className += " holiday";
		}

		// Apply gradient styling for single calendar event (not multiple overlaps)
		const groupsWithDate = dateInfo?.groups.filter(g => g.name !== "Unispace Holidays") || [];
		if (groupsWithDate.length === 1) {
			className += " has-gradient";
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
				if (isPTOEnabled && isWeekend(date)) {
					// Skip highlighting weekends for PTO groups
				} else {
					className += " dragging";
				}
			}
		}

		return className;
	};

	// Get gradient style for a date based on calendar color (uses imported utility function)
	// This applies to ALL calendars (not just selected), but only when there's a single calendar on that date
	const getGradientStyle = (date: Date): React.CSSProperties | null => {
		const dateStr = formatISO(date, { representation: "date" });
		const dateInfo = dateInfoMap.get(dateStr);

		if (!dateInfo) return null;

		// Find all calendars with events on this date (excluding holidays)
		const groupsWithDate = dateInfo.groups.filter(g => g.name !== "Unispace Holidays");

		// Only apply gradient if there's exactly ONE calendar on this date
		if (groupsWithDate.length !== 1) return null;

		const singleGroup = groupsWithDate[0];

		// Apply gradient based on that calendar's color
		return {
			background: createGradientFromColor(singleGroup.color),
			color: '#0a0a0a',
		};
	};

	const getRangeStyles = (date: Date): React.CSSProperties[] => {
		const dateStr = formatISO(date, { representation: "date" });
		const dateInfo = dateInfoMap.get(dateStr);

		if (!dateInfo || dateInfo.groups.length === 0) return [];

		const styles: React.CSSProperties[] = [];
		const groupsWithDate = dateInfo.groups;
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
								const dateInfo = dateInfoMap.get(dateStr);

								// Quick lookups from pre-computed map
								const isSelected = dateInfo ? dateInfo.groups.length > 0 : false;
								const ptoEntry = dateInfo?.ptoEntry || null;
								const groupsWithoutHolidays = dateInfo?.groups.filter(g => g.name !== "Unispace Holidays") || [];
								const hasSingleCalendar = groupsWithoutHolidays.length === 1;

								const gradientStyle = getGradientStyle(date);
								const rangeStyles = getRangeStyles(date);
								const isFocused = focusedDate ? checkSameDay(date, focusedDate) : false;

								return (
									<DateCell
										key={dateStr}
										date={date}
										dateStr={dateStr}
										isSelected={isSelected}
										ptoEntry={ptoEntry}
										hasSingleCalendar={hasSingleCalendar}
										className={getDayClassName(date)}
										gradientStyle={gradientStyle}
										rangeStyles={rangeStyles}
										isFocused={isFocused}
										onMouseDown={handleMouseDown}
										onMouseEnter={(date, e) => {
											handleMouseMove(date);
											handleMouseEnterDate(date, e);
										}}
										onMouseLeave={handleMouseLeaveDate}
									/>
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
