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
} from "date-fns";
import LZString from "lz-string";
import { PTOEntry, PTOConfig, PTOCalendarUtils } from "./utils/ptoUtils";
import { isHolidayFromISODate } from "./constants/holidays";

export const MAX_GROUPS = 5;

export const GROUP_COLORS = [
	{ hex: "#8a35de", rgb: "rgb(138, 53, 222)" }, // purple
	{ hex: "#10a2f5", rgb: "rgb(16, 162, 245)" }, // blue
	{ hex: "#eb4888", rgb: "rgb(235, 72, 136)" }, // pink
	{ hex: "#e9bc3f", rgb: "rgb(233, 188, 63)" }, // yellow
	{ hex: "#24d05a", rgb: "rgb(36, 208, 90)" }, // green
	// Pro colors (same as above, but with .6 alpha)
	{ hex: "#8a35de99", rgb: "rgba(138, 53, 222, 0.6)" },
	{ hex: "#10a2f599", rgb: "rgba(16, 162, 245, 0.6)" },
	{ hex: "#eb488899", rgb: "rgba(235, 72, 136, 0.6)" },
	{ hex: "#e9bc3f99", rgb: "rgba(233, 188, 63, 0.6)" },
	{ hex: "#24d05a99", rgb: "rgba(36, 208, 90, 0.6)" },
];

export const getMaxGroups = (isProUser: boolean) => (isProUser ? 10 : 5);

export interface DateRange {
	start: string;
	end: string;
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
	licenseKey: string | null;
	isProUser: boolean;
	// Actions
	setStartDate: (date: Date) => void;
	setIncludeWeekends: (include: boolean) => void;
	setShowToday: (show: boolean) => void;
	setShowHelpModal: (show: boolean) => void;
	setLicenseKey: (key: string | null) => void;
	validateLicenseKey: (key: string) => Promise<boolean>;
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
	// Per-Group PTO Actions
	setPTOConfig: (groupId: string, config: Partial<PTOConfig>) => void;
	addPTOEntry: (groupId: string, entry: PTOEntry) => void;
	updatePTOEntry: (groupId: string, entryId: string, updates: Partial<PTOEntry>) => void;
	deletePTOEntry: (groupId: string, entryId: string) => void;
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
	// Helper methods
	getSelectedGroupPTOConfig: () => PTOConfig | null;
	getSelectedGroupPTOEntries: () => PTOEntry[];
	isPTOEnabledForGroup: (groupId: string) => boolean;
	// Display helpers that merge holidays with eventGroups
	getAllDisplayGroups: () => EventGroup[];
	getHolidaysGroup: () => EventGroup;
}

const defaultStartDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year

// Create the special holidays calendar
const createHolidaysCalendar = (): EventGroup => {
	// Convert 2025 holidays to date ranges
	const holidays2025 = {
		101: "New Year's Day",
		120: "MLK Jr. Day", 
		526: "Memorial Day",
		619: "Juneteenth",
		703: "Independence Day Eve",
		704: "Independence Day",
		901: "Labor Day",
		1013: "Indigenous People's Day",
		1127: "Thanksgiving",
		1128: "Day after Thanksgiving", 
		1225: "Christmas",
		1226: "Unispace Gift Day",
		1227: "Unispace Gift Day",
		1230: "Unispace Gift Day",
		1231: "Unispace Gift Day"
	};

	const ranges: DateRange[] = Object.keys(holidays2025).map(dateKey => {
		const mmdd = parseInt(dateKey);
		const month = Math.floor(mmdd / 100);
		const day = mmdd % 100;
		const dateStr = formatISO(new Date(2025, month - 1, day), { representation: "date" });
		return {
			start: dateStr,
			end: dateStr
		};
	});

	return {
		id: "holidays-2025",
		name: "Unispace Holidays",
		color: "#f44336", // Red color for holidays
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
	const holidaysCalendar = createHolidaysCalendar();
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
	licenseKey: localStorage.getItem("pocketcal_license") || null,
	isProUser: false,

	setStartDate: (date) => set({ startDate: new Date(date.getFullYear(), 0, 1) }),
	setIncludeWeekends: (include) => set({ includeWeekends: include }),
	setShowToday: (show) => set({ showToday: show }),
	setShowHelpModal: (show) => set({ showHelpModal: show }),

	setLicenseKey: (key) => {
		if (key) {
			localStorage.setItem("pocketcal_license", key);
		} else {
			localStorage.removeItem("pocketcal_license");
		}
		set({ licenseKey: key });
	},

	validateLicenseKey: async (key) => {
		try {
			if (!key || key.length < 20) return false;
			const instanceName = `pocketcal-web-${window.navigator.userAgent}-${window.location.hostname}`;
			const response = await fetch("/.netlify/functions/validate-license", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					licenseKey: key,
					action: "activate",
					instanceName,
				}),
			});
			const data = await response.json();
			const valid =
				data.valid ||
				(data.license_key && data.license_key.status === "active");
			set({ isProUser: valid });
			if (valid) {
				localStorage.setItem("pocketcal_license", key);
				localStorage.setItem("pocketcal_pro_validated", Date.now().toString());
			}
			return valid;
		} catch (error) {
			console.error("License validation error:", error);
			return false;
		}
	},

	addEventGroup: (name) => {
		let newGroup: EventGroup | null = null;
		set((state) => {
			const maxGroups = getMaxGroups(state.isProUser);
			if (state.eventGroups.length >= maxGroups) {
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
		return (
			newGroup || {
				id: "",
				name: "",
				color: "",
				ranges: [],
			}
		);
	},

	updateEventGroup: (id, name) =>
		set((state) => ({
			eventGroups: state.eventGroups.map((group) =>
				group.id === id ? { ...group, name } : group
			),
		})),

	deleteEventGroup: (id) =>
		set((state) => ({
			eventGroups: state.eventGroups.filter((group) => group.id !== id),
			selectedGroupId:
				state.selectedGroupId === id ? null : state.selectedGroupId,
		})),

	selectEventGroup: (id) => set({ selectedGroupId: id }),

	addDateRange: (groupId, range) =>
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
		}),

	updateDateRange: (groupId, oldRange, newRange) =>
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
		}),

	deleteDateRange: (groupId, rangeToDelete) =>
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
		}),

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
						const startDate = new Date(parsedDate.getFullYear(), 0, 1);
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
						});
					} else {
						const eventGroups = decodedState.eventGroups ?? [
							createDefaultEventGroup(),
						];
						set({
							startDate: new Date(parseISO(decodedState.startDate).getFullYear(), 0, 1),
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
	setPTOConfig: (groupId, config) =>
		set((state) => ({
			eventGroups: state.eventGroups.map((group) =>
				group.id === groupId
					? { 
						...group, 
						ptoConfig: { 
							yearsOfService: config.yearsOfService ?? group.ptoConfig?.yearsOfService ?? 2,
							rolloverHours: config.rolloverHours ?? group.ptoConfig?.rolloverHours ?? 0,
							isEnabled: config.isEnabled !== undefined ? config.isEnabled : (group.ptoConfig?.isEnabled ?? false)
						} 
					}
					: group
			),
		})),

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
			
			return {
				eventGroups: state.eventGroups.map((group) =>
					group.id === groupId
						? { 
							...group, 
							// Add PTO entry
							ptoEntries: [
								...(group.ptoEntries || []).filter(e => !(e.startDate === entry.startDate && e.endDate === entry.endDate)),
								{ ...entry, id: `${entry.startDate}-${entry.endDate}-${Date.now()}` }
							],
							// Also add as regular event range for visual consistency
							ranges: [
								...group.ranges.filter(r => !(r.start === entry.startDate && r.end === entry.endDate)),
								{ start: entry.startDate, end: entry.endDate }
							]
						}
						: group
				),
			};
		});
	},

	updatePTOEntry: (groupId, entryId, updates) =>
		set((state) => ({
			eventGroups: state.eventGroups.map((group) =>
				group.id === groupId
					? {
						...group,
						ptoEntries: (group.ptoEntries || []).map((entry) =>
							entry.id === entryId ? { ...entry, ...updates } : entry
						),
					}
					: group
			),
		})),

	deletePTOEntry: (groupId, entryId) =>
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
							// Also remove corresponding regular event range
							ranges: ptoEntry 
								? group.ranges.filter(r => !(r.start === ptoEntry.startDate && r.end === ptoEntry.endDate))
								: group.ranges
						}
						: group
				),
			};
		}),

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
				warning: "Cannot request PTO on company holidays",
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

		return PTOCalendarUtils.calculatePTOSummary(
			group.ptoEntries || [],
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
		return group?.ptoEntries || [];
	},

	isPTOEnabledForGroup: (groupId) => {
		const state = get();
		const group = state.eventGroups.find(g => g.id === groupId);
		return group?.ptoConfig?.isEnabled ?? false;
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
