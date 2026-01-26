import { create } from "zustand";
import { nanoid } from "nanoid";
import {
	addMonths,
	isWithinInterval,
	formatISO,
	parseISO,
	eachDayOfInterval,
	isSameDay,
	differenceInDays,
	addDays,
	isWeekend,
} from "date-fns";
import LZString from "lz-string";
import { PTOEntry, PTOConfig, PTOCalendarUtils } from "./utils/ptoUtils";
import { isHolidayFromISODate, getHolidaysForYear } from "./constants/holidays";

// Re-export types for use in tests and other modules
export type { PTOEntry, PTOConfig } from "./utils/ptoUtils";

export const MAX_GROUPS = 10;

export const GROUP_COLORS = [
	{ hex: "#24d05a", rgb: "rgb(36, 208, 90)" }, // green
	{ hex: "#f44336", rgb: "rgb(244 67 54)" }, // red
	{ hex: "#10a2f5", rgb: "rgb(16, 162, 245)" }, // blue
	{ hex: "#eb4888", rgb: "rgb(235, 72, 136)" }, // pink
	{ hex: "#e9bc3f", rgb: "rgb(233, 188, 63)" }, // yellow
	{ hex: "#8a35de99", rgb: "rgba(138, 53, 222, 0.6)" },
	{ hex: "#10a2f599", rgb: "rgba(16, 162, 245, 0.6)" },
	{ hex: "#eb488899", rgb: "rgba(235, 72, 136, 0.6)" },
	{ hex: "#e9bc3f99", rgb: "rgba(233, 188, 63, 0.6)" },
	{ hex: "#24d05a99", rgb: "rgba(36, 208, 90, 0.6)" },
];

export interface DateRange {
	start: string;
	end: string;
	description?: string;
}

export interface EventGroup {
	id: string;
	name: string;
	color: string;
	ranges: DateRange[];
	ptoConfig?: PTOConfig;  // Optional PTO settings per group
	ptoEntries?: PTOEntry[]; // PTO entries specific to this group
	isSpecial?: boolean;     // Special calendars cannot be edited/deleted
}

interface AppState {
	startDate: Date;
	includeWeekends: boolean;
	showToday: boolean;
	eventGroups: EventGroup[];
	holidays: EventGroup; // Separate read-only holidays data
	selectedGroupId: string | null;
	showHelpModal: boolean;
	isDarkMode: boolean;
	// Actions
	setStartDate: (date: Date) => void;
	setIncludeWeekends: (include: boolean) => void;
	setShowToday: (show: boolean) => void;
	setShowHelpModal: (show: boolean) => void;
	setIsDarkMode: (isDark: boolean) => void;
	addEventGroup: (name: string) => EventGroup;
	updateEventGroup: (id: string, name: string) => void;
	deleteEventGroup: (id: string) => void;
	selectEventGroup: (id: string | null) => void;
	addDateRange: (groupId: string, range: DateRange) => void;
	updateDateRange: (
		groupId: string,
		oldRange: DateRange,
		newRange: DateRange
	) => void;
	deleteDateRange: (groupId: string, rangeToDelete: DateRange) => void;
	getAppStateFromUrl: () => void;
	generateShareableUrl: () => string;
	// localStorage persistence
	saveToLocalStorage: () => void;
	loadFromLocalStorage: () => boolean;
	clearLocalStorage: () => void;
	checkInitializationState: () => { hasLocalStorage: boolean; hasUrlHash: boolean };
	loadFromUrlAndMigrate: () => void;
	// Per-Group PTO Actions
	setPTOConfig: (groupId: string, config: Partial<PTOConfig>) => void;
	addPTOEntry: (groupId: string, entry: PTOEntry) => void;
	updatePTOEntry: (groupId: string, entryId: string, updates: Partial<PTOEntry>) => void;
	deletePTOEntry: (groupId: string, entryId: string) => void;
	clearPTOEntries: (groupId: string) => void;
	validatePTOEntry: (groupId: string, entry: PTOEntry) => { isValid: boolean; warning?: string };
	getPTOSummary: (groupId: string) => {
		totalHours: number;
		usedHours: number;
		remainingHours: number;
		totalDays: number;
		usedDays: number;
		remainingDays: number;
		accrualRate: number;
	} | null;
	cleanupWeekendPTOEntries: () => void;
	// Helper methods
	getSelectedGroupPTOConfig: () => PTOConfig | null;
	getSelectedGroupPTOEntries: () => PTOEntry[];
	isPTOEnabledForGroup: (groupId: string) => boolean;
	// Display helpers that merge holidays with eventGroups
	getAllDisplayGroups: () => EventGroup[];
	getHolidaysGroup: () => EventGroup;
}

const defaultStartDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year

// Create the special holidays calendar for a given year
const createHolidaysCalendar = (year: number = new Date().getFullYear()): EventGroup => {
	// Get holidays for the specific year from constants
	const holidayDates = getHolidaysForYear(year);

	const ranges: DateRange[] = Object.keys(holidayDates).map(dateKey => {
		const mmdd = parseInt(dateKey);
		const month = Math.floor(mmdd / 100);
		const day = mmdd % 100;
		const dateStr = formatISO(new Date(year, month - 1, day), { representation: "date" });
		return {
			start: dateStr,
			end: dateStr
		};
	});

	return {
		id: `holidays-${year}`,
		name: "Unispace Holidays",
		color: "#814ffd", // purple color for holidays
		ranges,
		isSpecial: true
	};
};

// Create a function to generate the default event group
const createDefaultEventGroup = (index = 0): EventGroup => ({
	id: nanoid(),
	name: "My PTO",
	color: GROUP_COLORS[index].hex,
	ranges: [],
});

// Create a function to get the default state
const getDefaultState = () => {
	const currentYear = defaultStartDate.getFullYear();
	const holidaysCalendar = createHolidaysCalendar(currentYear);
	const defaultGroup = createDefaultEventGroup(1); // Use index 1 since holidays uses index 0 color
	return {
		startDate: defaultStartDate,
		includeWeekends: true,
		showToday: true,
		eventGroups: [defaultGroup], // Only user groups, no holidays
		holidays: holidaysCalendar, // Separate holidays data
		selectedGroupId: defaultGroup.id,
	};
};

export const useStore = create<AppState>((set, get) => ({
	...getDefaultState(),
	showHelpModal: false,
	isDarkMode: localStorage.getItem("pocketcal_dark_mode") === "false" ? false : true, // Default to dark mode (Unispace design)

	setStartDate: (date) => {
		const newStartDate = new Date(date.getFullYear(), 0, 1);
		const newYear = date.getFullYear();
		set((state) => {
			// Only regenerate holidays if the year actually changed
			if (state.startDate.getFullYear() !== newYear) {
				return {
					startDate: newStartDate,
					holidays: createHolidaysCalendar(newYear)
				};
			}
			return { startDate: newStartDate };
		});
		get().saveToLocalStorage();
	},
	setIncludeWeekends: (include) => {
		set({ includeWeekends: include });
		get().saveToLocalStorage();
	},
	setShowToday: (show) => {
		set({ showToday: show });
		get().saveToLocalStorage();
	},
	setShowHelpModal: (show) => set({ showHelpModal: show }),
	setIsDarkMode: (isDark) => {
		localStorage.setItem("pocketcal_dark_mode", isDark.toString());
		set({ isDarkMode: isDark });
	},

	addEventGroup: (name) => {
		let newGroup: EventGroup | null = null;
		set((state) => {
			if (state.eventGroups.length >= MAX_GROUPS) {
				return state;
			}

			// Find the first unused color
			const usedColors = new Set(state.eventGroups.map((g) => g.color));
			const availableColor = GROUP_COLORS.find(
				(color) => !usedColors.has(color.hex)
			);

			if (!availableColor) {
				return state;
			}

			newGroup = {
				id: nanoid(),
				name,
				color: availableColor.hex,
				ranges: [],
			};
			return {
				eventGroups: [...state.eventGroups, newGroup],
			};
		});
		get().saveToLocalStorage();
		return (
			newGroup || {
				id: "",
				name: "",
				color: "",
				ranges: [],
			}
		);
	},

	updateEventGroup: (id, name) => {
		set((state) => ({
			eventGroups: state.eventGroups.map((group) =>
				group.id === id ? { ...group, name } : group
			),
		}));
		get().saveToLocalStorage();
	},

	deleteEventGroup: (id) => {
		set((state) => ({
			eventGroups: state.eventGroups.filter((group) => group.id !== id),
			selectedGroupId:
				state.selectedGroupId === id ? null : state.selectedGroupId,
		}));
		get().saveToLocalStorage();
	},

	selectEventGroup: (id) => set({ selectedGroupId: id }),

	addDateRange: (groupId, range) => {
		set((state) => {
			// Prevent adding to holidays (safety check)
			if (groupId === state.holidays.id) {
				console.warn('Cannot add date range to holidays calendar');
				return state;
			}
			return {
				eventGroups: state.eventGroups.map((group) =>
					group.id === groupId
						? { ...group, ranges: [...group.ranges, range] }
						: group
				),
			};
		});
		get().saveToLocalStorage();
	},

	updateDateRange: (groupId, oldRange, newRange) => {
		set((state) => {
			// Prevent updating holidays (safety check)
			if (groupId === state.holidays.id) {
				console.warn('Cannot update date range in holidays calendar');
				return state;
			}
			return {
				eventGroups: state.eventGroups.map((group) =>
					group.id === groupId
						? {
								...group,
								ranges: group.ranges.map((r) =>
									r.start === oldRange.start && r.end === oldRange.end
										? newRange
										: r
								),
						  }
						: group
				),
			};
		});
		get().saveToLocalStorage();
	},

	deleteDateRange: (groupId, rangeToDelete) => {
		set((state) => {
			// Prevent deleting from holidays (safety check)
			if (groupId === state.holidays.id) {
				console.warn('Cannot delete date range from holidays calendar');
				return state;
			}
			return {
				eventGroups: state.eventGroups.map((group) =>
					group.id === groupId
						? {
								...group,
								ranges: group.ranges.filter(
									(r) =>
										!(
											r.start === rangeToDelete.start &&
											r.end === rangeToDelete.end
										)
								),
						  }
						: group
				),
			};
		});
		get().saveToLocalStorage();
	},

	getAppStateFromUrl: () => {
		try {
			const hash = window.location.hash.substring(1);
			if (hash) {
				let decodedState;
				try {
					const decompressed = LZString.decompressFromEncodedURIComponent(hash);
					if (decompressed) {
						decodedState = JSON.parse(decompressed);
					} else {
						decodedState = JSON.parse(atob(hash));
					}
				} catch {
					decodedState = JSON.parse(atob(hash));
				}

				if (decodedState.startDate || decodedState.s) {
					if (decodedState.s) {
						const parsedDate = parseISO(decodedState.s);
						const savedYear = parsedDate.getFullYear();
						const currentYear = new Date().getFullYear();
						// Use current year if saved year is in the past
						const yearToUse = savedYear < currentYear ? currentYear : savedYear;
						const startDate = new Date(yearToUse, 0, 1);
						const usedColorIndices = new Set<number>();

						const validGroups = (decodedState.g || []).filter((g: any) => {
							return g.c !== undefined && g.c >= 0 && g.c < GROUP_COLORS.length;
						});

						validGroups.forEach((g: any) => {
							usedColorIndices.add(g.c);
						});

						const eventGroups = (decodedState.g || []).map(
							(g: any, index: number) => {
								let colorIndex = g.c;

								// If no color index, invalid, or already used
								if (
									colorIndex === undefined ||
									colorIndex < 0 ||
									colorIndex >= GROUP_COLORS.length
								) {
									for (let i = 0; i < GROUP_COLORS.length; i++) {
										if (!usedColorIndices.has(i)) {
											colorIndex = i;
											usedColorIndices.add(i);
											break;
										}
									}
									// Fallback if all colors are used
									if (colorIndex === undefined) {
										colorIndex = index % GROUP_COLORS.length;
									}
								}

								// Handle per-group PTO config restoration
								const ptoConfig = g.pto ? {
									yearsOfService: g.pto.y || 2,
									rolloverHours: g.pto.r || 0,
									isEnabled: g.pto.e !== undefined ? g.pto.e : false
								} : undefined;

								// Handle per-group PTO entries restoration
								const ptoEntries = g.ptoEntries ? 
									g.ptoEntries.map((entry: any) => ({
										id: `${entry.sd}-${entry.ed}-restored`,
										startDate: formatISO(addDays(startDate, entry.sd), { representation: "date" }),
										endDate: formatISO(addDays(startDate, entry.ed), { representation: "date" }),
										hoursPerDay: entry.hpd,
										totalHours: PTOCalendarUtils.calculateTotalPTOHours(
											formatISO(addDays(startDate, entry.sd), { representation: "date" }),
											formatISO(addDays(startDate, entry.ed), { representation: "date" }),
											entry.hpd
										),
										name: entry.n
									})) : undefined;

								return {
									id: nanoid(),
									name: g.n || "My PTO",
									color: GROUP_COLORS[colorIndex].hex,
									ranges: (g.r || []).map((r: any) => ({
										start: formatISO(addDays(startDate, r[0]), {
											representation: "date",
										}),
										end: formatISO(addDays(startDate, r[1]), {
											representation: "date",
										}),
									})),
									ptoConfig,
									ptoEntries
								};
							}
						);

						set({
							startDate,
							includeWeekends: decodedState.w ?? true,
							showToday: decodedState.t ?? true,
							eventGroups:
								eventGroups.length > 0
									? eventGroups
									: [createDefaultEventGroup()],
							selectedGroupId: eventGroups[0]?.id ?? null,
							holidays: createHolidaysCalendar(yearToUse), // Update holidays to match the year
						});
					} else {
						const eventGroups = decodedState.eventGroups ?? [
							createDefaultEventGroup(),
						];
						set({
							startDate: (() => {
							const savedYear = parseISO(decodedState.startDate).getFullYear();
							const currentYear = new Date().getFullYear();
							const yearToUse = savedYear < currentYear ? currentYear : savedYear;
							return new Date(yearToUse, 0, 1);
						})(),
						holidays: (() => {
							const savedYear = parseISO(decodedState.startDate).getFullYear();
							const currentYear = new Date().getFullYear();
							const yearToUse = savedYear < currentYear ? currentYear : savedYear;
							return createHolidaysCalendar(yearToUse);
						})(),
							includeWeekends: decodedState.includeWeekends ?? true,
							showToday: decodedState.showToday ?? true,
							eventGroups,
							selectedGroupId: eventGroups[0]?.id ?? null,
						});
					}
				} else {
					// If no valid state in hash, use default
					set(getDefaultState());
				}
			} else {
				// If no hash, set to default state with the default group
				set(getDefaultState());
			}
		} catch (error) {
			console.error("Failed to parse state from URL:", error);
			set(getDefaultState());
		}
	},

	// Per-Group PTO Actions
	setPTOConfig: (groupId, config) => {
		set((state) => {
			const group = state.eventGroups.find((g) => g.id === groupId);

			if (!group) return state;

			// Check if we're enabling PTO for the first time
			const wasEnabled = group.ptoConfig?.isEnabled ?? false;
			const willBeEnabled = config.isEnabled !== undefined ? config.isEnabled : wasEnabled;
			const isEnablingPTO = !wasEnabled && willBeEnabled;

			// Convert existing ranges to PTO entries if enabling PTO
			let newPTOEntries = group.ptoEntries || [];
			let newRanges = group.ranges;

			if (isEnablingPTO && group.ranges.length > 0) {
				console.log(`[PTO] Converting ${group.ranges.length} event ranges to PTO entries...`);

				// Group consecutive single-day ranges into multi-day ranges
				// This helps convert ranges that were created as individual days
				const consolidatedRanges: DateRange[] = [];
				const sortedRanges = [...group.ranges].sort((a, b) =>
					parseISO(a.start).getTime() - parseISO(b.start).getTime()
				);

				let currentRange: DateRange | null = null;
				for (const range of sortedRanges) {
					if (!currentRange) {
						currentRange = { ...range };
					} else {
						// Check if this range is consecutive with the current one
						const currentEnd = parseISO(currentRange.end);
						const rangeStart = parseISO(range.start);
						const daysDiff = differenceInDays(rangeStart, currentEnd);

						if (daysDiff === 1) {
							// Consecutive day, extend current range
							currentRange.end = range.end;
						} else {
							// Non-consecutive, save current and start new
							consolidatedRanges.push(currentRange);
							currentRange = { ...range };
						}
					}
				}
				if (currentRange) {
					consolidatedRanges.push(currentRange);
				}

				console.log(`[PTO] Consolidated into ${consolidatedRanges.length} ranges`);

				// Convert each consolidated range to a PTO entry
				const convertedEntries = consolidatedRanges.map((range) => {
					const totalHours = PTOCalendarUtils.calculateTotalPTOHours(
						range.start,
						range.end,
						8 // Default to 8 hours per day (full day)
					);

					return {
						id: `${range.start}-${range.end}-converted-${Date.now()}`,
						startDate: range.start,
						endDate: range.end,
						hoursPerDay: 8,
						totalHours,
					};
				});

				// Filter out any entries with 0 hours (weekend-only ranges)
				const validEntries = convertedEntries.filter(entry => entry.totalHours > 0);
				newPTOEntries = validEntries;

				// Create new individual day ranges for each weekday in the PTO entries
				// This matches the format used by addPTOEntry
				// Exclude holidays so they remain visible
				newRanges = validEntries.flatMap(entry =>
					eachDayOfInterval({
						start: parseISO(entry.startDate),
						end: parseISO(entry.endDate)
					})
					.filter(date => {
						const dateStr = formatISO(date, { representation: "date" });
						return !isWeekend(date) && !isHolidayFromISODate(dateStr);
					})
					.map(date => ({
						start: formatISO(date, { representation: "date" }),
						end: formatISO(date, { representation: "date" })
					}))
				);

				console.log(`[PTO] Converted to ${newPTOEntries.length} PTO entries (${newPTOEntries.reduce((sum, e) => sum + e.totalHours, 0)} total hours)`);
			}

			return {
				eventGroups: state.eventGroups.map((g) =>
					g.id === groupId
						? {
							...g,
							ptoConfig: {
								yearsOfService: config.yearsOfService ?? g.ptoConfig?.yearsOfService ?? 2,
								rolloverHours: config.rolloverHours ?? g.ptoConfig?.rolloverHours ?? 0,
								isEnabled: willBeEnabled
							},
							// Apply converted PTO entries and regenerated ranges
							ptoEntries: isEnablingPTO ? newPTOEntries : g.ptoEntries,
							ranges: isEnablingPTO ? newRanges : g.ranges
						}
						: g
				),
			};
		});
		get().saveToLocalStorage();
	},

	addPTOEntry: (groupId, entry) => {
		set((state) => {
			// Check if entry is valid (no holidays, valid hours)
			if (isHolidayFromISODate(entry.startDate) || isHolidayFromISODate(entry.endDate)) {
				console.warn(`Cannot add PTO entry on holiday dates: ${entry.startDate} - ${entry.endDate}`);
				return state;
			}
			if (!PTOCalendarUtils.isValidPTOHours(entry.hoursPerDay)) {
				console.warn(`Invalid PTO hours per day: ${entry.hoursPerDay}`);
				return state;
			}

			// Always recalculate totalHours to ensure accuracy
			const totalHours = PTOCalendarUtils.calculateTotalPTOHours(
				entry.startDate,
				entry.endDate,
				entry.hoursPerDay
			);

			// Don't create entries with 0 hours (weekend-only spans)
			if (totalHours === 0) {
				console.warn('[PTO] Skipping entry with 0 hours (weekend-only span):', {
					startDate: entry.startDate,
					endDate: entry.endDate,
					hoursPerDay: entry.hoursPerDay
				});
				return state;
			}

			// Removed console.log for performance

			return {
				eventGroups: state.eventGroups.map((group) =>
					group.id === groupId
						? {
							...group,
							// Add PTO entry with recalculated totalHours
							ptoEntries: [
								...(group.ptoEntries || []).filter(e => !(e.startDate === entry.startDate && e.endDate === entry.endDate)),
								{
									...entry,
									id: `${entry.startDate}-${entry.endDate}-${Date.now()}`,
									totalHours
								}
							],
							// Also add as regular event ranges for visual consistency (weekdays only)
							// Exclude holidays so they remain visible
							ranges: [
								...group.ranges.filter(r => !(r.start === entry.startDate && r.end === entry.endDate)),
								// Create individual ranges for each weekday in the PTO entry
								...eachDayOfInterval({
									start: parseISO(entry.startDate),
									end: parseISO(entry.endDate)
								})
								.filter(date => {
									const dateStr = formatISO(date, { representation: "date" });
									return !isWeekend(date) && !isHolidayFromISODate(dateStr);
								})
								.map(date => ({
									start: formatISO(date, { representation: "date" }),
									end: formatISO(date, { representation: "date" })
								}))
							]
						}
						: group
				),
			};
		});
		get().saveToLocalStorage();
	},

	updatePTOEntry: (groupId, entryId, updates) => {
		set((state) => {
			// Find the existing PTO entry to get old dates for range removal
			const group = state.eventGroups.find(g => g.id === groupId);
			const existingEntry = (group?.ptoEntries || []).find(entry => entry.id === entryId);
			
			if (!existingEntry) return state;

			const updatedEntry = { ...existingEntry, ...updates };

			// Recalculate totalHours if dates or hoursPerDay changed
			if (updates.startDate || updates.endDate || updates.hoursPerDay) {
				updatedEntry.totalHours = PTOCalendarUtils.calculateTotalPTOHours(
					updatedEntry.startDate,
					updatedEntry.endDate,
					updatedEntry.hoursPerDay
				);
			}

			return {
				eventGroups: state.eventGroups.map((group) =>
					group.id === groupId
						? {
							...group,
							// Update PTO entry
							ptoEntries: (group.ptoEntries || []).map((entry) =>
								entry.id === entryId ? updatedEntry : entry
							),
							// Update corresponding calendar ranges (weekdays only)
							ranges: [
								// Remove old ranges for all days in old entry
								...group.ranges.filter(r => {
									const oldDays = eachDayOfInterval({
										start: parseISO(existingEntry.startDate),
										end: parseISO(existingEntry.endDate)
									}).filter(date => {
										const dateStr = formatISO(date, { representation: "date" });
										return !isWeekend(date) && !isHolidayFromISODate(dateStr);
									});

									return !oldDays.some(date => {
										const dayStr = formatISO(date, { representation: "date" });
										return r.start === dayStr && r.end === dayStr;
									});
								}),
								// Add new ranges for weekdays only, excluding holidays
								...eachDayOfInterval({
									start: parseISO(updatedEntry.startDate),
									end: parseISO(updatedEntry.endDate)
								})
								.filter(date => {
									const dateStr = formatISO(date, { representation: "date" });
									return !isWeekend(date) && !isHolidayFromISODate(dateStr);
								})
								.map(date => ({
									start: formatISO(date, { representation: "date" }),
									end: formatISO(date, { representation: "date" })
								}))
							]
						}
						: group
				),
			};
		});
		get().saveToLocalStorage();
	},

	deletePTOEntry: (groupId, entryId) => {
		set((state) => {
			// Find the PTO entry to get its dates for removing the corresponding range
			const group = state.eventGroups.find(g => g.id === groupId);
			const ptoEntry = (group?.ptoEntries || []).find(entry => entry.id === entryId);
			
			return {
				eventGroups: state.eventGroups.map((group) =>
					group.id === groupId
						? {
							...group,
							// Remove PTO entry
							ptoEntries: (group.ptoEntries || []).filter((entry) => entry.id !== entryId),
							// Also remove corresponding regular event ranges (all weekdays in the PTO entry)
							ranges: ptoEntry
								? group.ranges.filter(r => {
									const ptoWeekdays = eachDayOfInterval({
										start: parseISO(ptoEntry.startDate),
										end: parseISO(ptoEntry.endDate)
									}).filter(date => {
										const dateStr = formatISO(date, { representation: "date" });
										return !isWeekend(date) && !isHolidayFromISODate(dateStr);
									});

									return !ptoWeekdays.some(date => {
										const dayStr = formatISO(date, { representation: "date" });
										return r.start === dayStr && r.end === dayStr;
									});
								})
								: group.ranges
						}
						: group
				),
			};
		});
		get().saveToLocalStorage();
	},

	clearPTOEntries: (groupId) => {
		set((state) => ({
			eventGroups: state.eventGroups.map((group) =>
				group.id === groupId
					? {
						...group,
						ptoEntries: [],
						// Clear all PTO-related ranges by filtering out ranges that have PTO entries
						ranges: []
					}
					: group
			),
		}));
		get().saveToLocalStorage();
	},

	validatePTOEntry: (groupId, entry) => {
		const state = get();
		const group = state.eventGroups.find(g => g.id === groupId);
		
		if (!group?.ptoConfig?.isEnabled) {
			return {
				isValid: false,
				warning: "PTO is not enabled for this group",
			};
		}

		if (isHolidayFromISODate(entry.startDate) || isHolidayFromISODate(entry.endDate)) {
			return {
				isValid: false,
				warning: "Cannot log PTO on company holidays",
			};
		}
		if (!PTOCalendarUtils.isValidPTOHours(entry.hoursPerDay)) {
			return {
				isValid: false,
				warning: "PTO hours per day must be 2, 4, or 8 hours",
			};
		}

		const totalHours = PTOCalendarUtils.calculateAnnualPTOHours(
			group.ptoConfig.yearsOfService
		);
		const remainingHours = PTOCalendarUtils.calculateRemainingPTO(
			group.ptoEntries || [],
			totalHours,
			group.ptoConfig.rolloverHours
		);

		if (entry.totalHours > remainingHours) {
			return {
				isValid: false,
				warning: `Exceeds remaining PTO balance (${remainingHours}h available)`,
			};
		}

		return { isValid: true };
	},

	getPTOSummary: (groupId) => {
		const state = get();
		const group = state.eventGroups.find(g => g.id === groupId);

		if (!group?.ptoConfig?.isEnabled) {
			return null;
		}

		// Filter out any entries with 0 hours (shouldn't exist but safety check)
		const validEntries = (group.ptoEntries || []).filter(entry => entry.totalHours > 0);

		return PTOCalendarUtils.calculatePTOSummary(
			validEntries,
			group.ptoConfig
		);
	},

	// Helper methods
	getSelectedGroupPTOConfig: () => {
		const state = get();
		if (!state.selectedGroupId) return null;
		const group = state.eventGroups.find(g => g.id === state.selectedGroupId);
		return group?.ptoConfig || null;
	},

	getSelectedGroupPTOEntries: () => {
		const state = get();
		if (!state.selectedGroupId) return [];
		const group = state.eventGroups.find(g => g.id === state.selectedGroupId);
		// Filter out any entries with 0 hours (shouldn't exist but safety check)
		return (group?.ptoEntries || []).filter(entry => entry.totalHours > 0);
	},

	isPTOEnabledForGroup: (groupId) => {
		const state = get();
		const group = state.eventGroups.find(g => g.id === groupId);
		return group?.ptoConfig?.isEnabled ?? false;
	},

	cleanupWeekendPTOEntries: () => {
		set((state) => {
			let hasChanges = false;
			const updatedGroups = state.eventGroups.map((group) => {
				if (!group.ptoConfig?.isEnabled || !group.ptoEntries) {
					return group;
				}

				// Filter out PTO entries that fall on weekends
				const validPTOEntries = group.ptoEntries.filter((entry) => {
					const startDate = parseISO(entry.startDate);
					const endDate = parseISO(entry.endDate);
					
					// Check if any day in the entry range is a weekend
					const dates = eachDayOfInterval({ start: startDate, end: endDate });
					const hasWeekendDays = dates.some(date => isWeekend(date));
					
					if (hasWeekendDays) {
						console.log(`Removing PTO entry with weekend days: ${entry.startDate} - ${entry.endDate}`);
						hasChanges = true;
						return false; // Remove this entry
					}
					return true; // Keep this entry
				});

				// Also remove corresponding calendar ranges for deleted PTO entries
				const validRanges = group.ranges.filter((range) => {
					// Keep the range if there's a corresponding valid PTO entry
					return validPTOEntries.some(entry => 
						entry.startDate === range.start && entry.endDate === range.end
					) || 
					// Or if this range doesn't correspond to any PTO entry (regular calendar entry)
					!(group.ptoEntries || []).some(entry => 
						entry.startDate === range.start && entry.endDate === range.end
					);
				});

				return hasChanges ? {
					...group,
					ptoEntries: validPTOEntries,
					ranges: validRanges
				} : group;
			});

			if (hasChanges) {
				console.log('Cleaned up weekend PTO entries');
				return { eventGroups: updatedGroups };
			}
			return state;
		});
	},

	// Display helpers that merge holidays with eventGroups
	getAllDisplayGroups: () => {
		const state = get();
		return [state.holidays, ...state.eventGroups];
	},

	getHolidaysGroup: () => {
		const state = get();
		return state.holidays;
	},

	generateShareableUrl: () => {
		const state = get();
		const startDate = state.startDate;

		const compressedState: { 
			s: string; 
			w?: boolean; 
			t?: boolean; 
			g?: any[]; 
		} = {
			s: formatISO(startDate, { representation: "date" }),
			w: state.includeWeekends ? undefined : false,
			t: state.showToday ? undefined : false,
			g: state.eventGroups.map((group) => {
				const compressedGroup: any = {
					n: group.name === `My PTO` ? undefined : group.name,
					c: GROUP_COLORS.findIndex((c) => c.hex === group.color),
					r: group.ranges.map((range) => [
						differenceInDays(parseISO(range.start), startDate),
						differenceInDays(parseISO(range.end), startDate),
					]),
					// Add per-group PTO data
					pto: group.ptoConfig ? {
						y: group.ptoConfig.yearsOfService,
						r: group.ptoConfig.rolloverHours,
						e: group.ptoConfig.isEnabled
					} : undefined,
					ptoEntries: (group.ptoEntries && group.ptoEntries.length > 0) ? 
						group.ptoEntries.map(entry => ({
							sd: differenceInDays(parseISO(entry.startDate), startDate),
							ed: differenceInDays(parseISO(entry.endDate), startDate),
							hpd: entry.hoursPerDay,
							n: entry.name
						})) : undefined
				};
				// Clean up undefined values
				Object.keys(compressedGroup).forEach(
					(key) =>
						compressedGroup[key] === undefined && delete compressedGroup[key]
				);
				return compressedGroup;
			}),
		};

		// Remove default values
		if (compressedState.w === undefined) delete compressedState.w;
		if (compressedState.t === undefined) delete compressedState.t;
		if (compressedState.g?.length === 0) delete compressedState.g;

		const compressed = LZString.compressToEncodedURIComponent(
			JSON.stringify(compressedState)
		);
		return `${window.location.origin}${window.location.pathname}#${compressed}`;
	},

	saveToLocalStorage: () => {
		try {
			const state = get();
			const startDate = state.startDate;

			// Use same compressed format as URL sharing
			const compressedState: {
				s: string;
				w?: boolean;
				t?: boolean;
				g?: any[];
			} = {
				s: formatISO(startDate, { representation: "date" }),
				w: state.includeWeekends ? undefined : false,
				t: state.showToday ? undefined : false,
				g: state.eventGroups.map((group) => {
					const compressedGroup: any = {
						n: group.name === `My PTO` ? undefined : group.name,
						c: GROUP_COLORS.findIndex((c) => c.hex === group.color),
						r: group.ranges.map((range) => [
							differenceInDays(parseISO(range.start), startDate),
							differenceInDays(parseISO(range.end), startDate),
						]),
						pto: group.ptoConfig ? {
							y: group.ptoConfig.yearsOfService,
							r: group.ptoConfig.rolloverHours,
							e: group.ptoConfig.isEnabled
						} : undefined,
						ptoEntries: (group.ptoEntries && group.ptoEntries.length > 0) ?
							group.ptoEntries.map(entry => ({
								sd: differenceInDays(parseISO(entry.startDate), startDate),
								ed: differenceInDays(parseISO(entry.endDate), startDate),
								hpd: entry.hoursPerDay,
								n: entry.name
							})) : undefined
					};
					// Clean up undefined values
					Object.keys(compressedGroup).forEach(
						(key) =>
							compressedGroup[key] === undefined && delete compressedGroup[key]
					);
					return compressedGroup;
				}),
			};

			// Remove default values
			if (compressedState.w === undefined) delete compressedState.w;
			if (compressedState.t === undefined) delete compressedState.t;
			if (compressedState.g?.length === 0) delete compressedState.g;

			const compressed = LZString.compressToEncodedURIComponent(
				JSON.stringify(compressedState)
			);
			localStorage.setItem("pocketcal_calendar_state_v1", compressed);
		} catch (error) {
			// Handle quota exceeded or other localStorage errors
			console.error("Failed to save to localStorage:", error);
		}
	},

	loadFromLocalStorage: () => {
		try {
			const stored = localStorage.getItem("pocketcal_calendar_state_v1");
			if (!stored) return false;

			// Decompress and parse (reuse same logic as getAppStateFromUrl)
			const decompressed = LZString.decompressFromEncodedURIComponent(stored);
			if (!decompressed) {
				console.error("Failed to decompress localStorage data");
				return false;
			}

			const decodedState = JSON.parse(decompressed);
			if (!decodedState.s) return false;

			// Parse the state using same logic as URL parsing
			const parsedDate = parseISO(decodedState.s);
			const savedYear = parsedDate.getFullYear();
			const currentYear = new Date().getFullYear();
			const yearToUse = savedYear < currentYear ? currentYear : savedYear;
			const startDate = new Date(yearToUse, 0, 1);
			const usedColorIndices = new Set<number>();

			const validGroups = (decodedState.g || []).filter((g: any) => {
				return g.c !== undefined && g.c >= 0 && g.c < GROUP_COLORS.length;
			});

			validGroups.forEach((g: any) => {
				usedColorIndices.add(g.c);
			});

			const eventGroups = (decodedState.g || []).map(
				(g: any, index: number) => {
					let colorIndex = g.c;

					if (
						colorIndex === undefined ||
						colorIndex < 0 ||
						colorIndex >= GROUP_COLORS.length
					) {
						for (let i = 0; i < GROUP_COLORS.length; i++) {
							if (!usedColorIndices.has(i)) {
								colorIndex = i;
								usedColorIndices.add(i);
								break;
							}
						}
						if (colorIndex === undefined) {
							colorIndex = index % GROUP_COLORS.length;
						}
					}

					const ptoConfig = g.pto ? {
						yearsOfService: g.pto.y || 2,
						rolloverHours: g.pto.r || 0,
						isEnabled: g.pto.e !== undefined ? g.pto.e : false
					} : undefined;

					const ptoEntries = g.ptoEntries ?
						g.ptoEntries.map((entry: any) => ({
							id: `${entry.sd}-${entry.ed}-restored`,
							startDate: formatISO(addDays(startDate, entry.sd), { representation: "date" }),
							endDate: formatISO(addDays(startDate, entry.ed), { representation: "date" }),
							hoursPerDay: entry.hpd,
							totalHours: PTOCalendarUtils.calculateTotalPTOHours(
								formatISO(addDays(startDate, entry.sd), { representation: "date" }),
								formatISO(addDays(startDate, entry.ed), { representation: "date" }),
								entry.hpd
							),
							name: entry.n
						})) : undefined;

					return {
						id: nanoid(),
						name: g.n || "My PTO",
						color: GROUP_COLORS[colorIndex].hex,
						ranges: (g.r || []).map((r: any) => ({
							start: formatISO(addDays(startDate, r[0]), {
								representation: "date",
							}),
							end: formatISO(addDays(startDate, r[1]), {
								representation: "date",
							}),
						})),
						ptoConfig,
						ptoEntries
					};
				}
			);

			set({
				startDate,
				includeWeekends: decodedState.w ?? true,
				showToday: decodedState.t ?? true,
				eventGroups:
					eventGroups.length > 0
						? eventGroups
						: [createDefaultEventGroup()],
				selectedGroupId: eventGroups[0]?.id ?? null,
				holidays: createHolidaysCalendar(yearToUse),
			});

			return true;
		} catch (error) {
			console.error("Failed to load from localStorage:", error);
			// Clear corrupted data
			localStorage.removeItem("pocketcal_calendar_state_v1");
			return false;
		}
	},

	clearLocalStorage: () => {
		try {
			localStorage.removeItem("pocketcal_calendar_state_v1");
		} catch (error) {
			console.error("Failed to clear localStorage:", error);
		}
	},

	checkInitializationState: () => {
		const hasLocalStorage = !!localStorage.getItem("pocketcal_calendar_state_v1");
		const hasUrlHash = window.location.hash.length > 1;
		return { hasLocalStorage, hasUrlHash };
	},

	loadFromUrlAndMigrate: () => {
		// Load from URL using existing logic
		get().getAppStateFromUrl();
		// Save to localStorage
		get().saveToLocalStorage();
		// Clear URL hash
		window.history.replaceState(null, "", window.location.pathname + window.location.search);
	},
}));

export const isDateInRange = (date: Date, group: EventGroup): boolean => {
	return group.ranges.some((range) =>
		isWithinInterval(date, {
			start: parseISO(range.start),
			end: parseISO(range.end),
		})
	);
};

export const findRangeForDate = (
	date: Date,
	group: EventGroup
): DateRange | null => {
	return (
		group.ranges.find((range) =>
			isWithinInterval(date, {
				start: parseISO(range.start),
				end: parseISO(range.end),
			})
		) || null
	);
};

export const getCalendarDates = (startDate: Date): Date[] => {
	const endDate = addMonths(startDate, 11);
	const endOfMonthDate = new Date(
		endDate.getFullYear(),
		endDate.getMonth() + 1,
		0
	);
	return eachDayOfInterval({ start: startDate, end: endOfMonthDate });
};

export const formatDateDisplay = (date: Date): string => {
	return formatISO(date, { representation: "date" });
};

export const checkSameDay = (date1: Date, date2: Date): boolean => {
	return isSameDay(date1, date2);
};
