# Bug Analysis: Calendar Events Added to Wrong Calendar

## Problem Summary
When clicking dates on multiple calendars, events are added to the WRONG calendar. The selected calendar ID is consistently **one click behind** the actual UI selection.

## Root Cause
**React state synchronization timing issue** between Sidebar and Calendar components.

When user clicks a calendar in the Sidebar:
1. Sidebar calls `selectEventGroup(newId)`
2. State updates in Zustand store
3. User immediately clicks a date
4. **Calendar component hasn't re-rendered yet with new `selectedGroupId`**
5. `handleMouseDown` captures the OLD `selectedGroupId` (from previous selection)
6. Event gets added to the wrong calendar

## Evidence from Console Logs

### Scenario 1: Click Calendar "My PTO" then click date Jan 21
```
[Sidebar] User clicked calendar: TB6nEV-Si_HFK34bqlT6e My PTO
=== MOUSE DOWN ===
Selected Calendar: My PTO ID: FGdKTBax-_UhLBj8KYL6p  ❌ WRONG ID!
dragStartGroupIdRef.current: FGdKTBax-_UhLBj8KYL6p
=== MOUSE UP ===
current selectedGroupId: TB6nEV-Si_HFK34bqlT6e  ✓ Correct (but too late)
Adding range to calendar: FGdKTBax-_UhLBj8KYL6p  ❌ WRONG!
```

### Scenario 2: Click Calendar "New Calendar" then click date Jan 21
```
[Sidebar] User clicked calendar: lPLCDGgPAz8g0BV77YeZo New Calendar
=== MOUSE DOWN ===
Selected Calendar: My PTO ID: TB6nEV-Si_HFK34bqlT6e  ❌ WRONG (previous calendar!)
dragStartGroupIdRef.current: TB6nEV-Si_HFK34bqlT6e
=== MOUSE UP ===
current selectedGroupId: lPLCDGgPAz8g0BV77YeZo  ✓ Correct (but too late)
Adding range to calendar: TB6nEV-Si_HFK34bqlT6e  ❌ WRONG!
```

### Scenario 3: Second click on same calendar
```
=== MOUSE DOWN ===
Selected Calendar: New Calendar ID: lPLCDGgPAz8g0BV77YeZo  ✓ CORRECT!
dragStartGroupIdRef.current: lPLCDGgPAz8g0BV77YeZo
=== MOUSE UP ===
Adding range to calendar: lPLCDGgPAz8g0BV77YeZo  ✓ CORRECT!
```

**Pattern:** The selectedGroupId is ONE CLICK BEHIND. After switching calendars, the first click uses the OLD calendar ID, the second click uses the correct one.

## Why Our Previous Fix Didn't Work
We added `dragStartGroupIdRef` to capture the ID at mouseDown time, but that doesn't help because `selectedGroupId` is already stale at mouseDown time due to React re-render delays.

## The Real Issue
The Calendar component is reading `selectedGroupId` from Zustand store, but the component hasn't re-rendered between the Sidebar click and the Calendar mouseDown.

## Potential Solutions

### Option 1: Force Sync in handleMouseDown
Instead of using the stale `selectedGroupId` or `selectedGroup` from closure, read directly from the store:
```tsx
const handleMouseDown = (date: Date) => {
    const store = useStore.getState();
    const currentSelectedId = store.selectedGroupId;
    const currentSelectedGroup = store.getAllDisplayGroups().find(g => g.id === currentSelectedId);
    // Use currentSelectedId and currentSelectedGroup
}
```

### Option 2: Use useEffect to Clear Drag State
Add effect that clears drag state when selectedGroupId changes (already exists at line 552-558, but may need to be more aggressive)

### Option 3: Add Key to Calendar Component
Force Calendar to remount when selectedGroupId changes by adding key prop in parent component

### Option 4: Debounce/Delay Calendar Interaction
Wait a tick after calendar selection before allowing date clicks (bad UX)

## Recommended Fix: Option 1
Read fresh state from store at mouseDown time instead of relying on closure values.

## Files Affected
- `src/components/Calendar.tsx` - handleMouseDown function (line 372)
- `src/components/Sidebar.tsx` - selectEventGroup calls (line 153-157)
- `src/store.ts` - selectEventGroup action (line 297)

## Related Code Locations
- Calendar.tsx:372 - handleMouseDown function
- Calendar.tsx:108-127 - Store hooks and state
- Calendar.tsx:487-551 - handleMouseUp callback
- Sidebar.tsx:153-157 - Calendar selection click handler

## Test to Verify Fix
1. Create two calendars with different names
2. Select Calendar A in sidebar
3. Click a date - verify event appears ONLY on Calendar A
4. Select Calendar B in sidebar
5. Click same date - verify event appears ONLY on Calendar B (should NOT remove Calendar A's event)
6. Repeat steps 4-5 multiple times to ensure consistency

---

## FIX IMPLEMENTED: 2026-01-13

### What Was Changed
Modified `handleMouseDown` in `Calendar.tsx` (line 372-463) to read fresh state directly from Zustand store instead of using closure values:

```tsx
const handleMouseDown = (date: Date) => {
    // CRITICAL: Read fresh state from store to avoid stale closure values
    const freshSelectedGroupId = useStore.getState().selectedGroupId;
    const allGroups = useStore.getState().getAllDisplayGroups();
    const freshSelectedGroup = allGroups.find(g => g.id === freshSelectedGroupId);
    const freshIsPTOEnabled = freshSelectedGroupId ? useStore.getState().isPTOEnabledForGroup(freshSelectedGroupId) : false;

    // ... rest of function uses fresh* variables instead of closure values
}
```

### Key Changes
- **Line 375-378**: Read fresh `selectedGroupId`, `selectedGroup`, and `isPTOEnabled` from store
- **Line 392**: Use `freshSelectedGroup.isSpecial` instead of `selectedGroup.isSpecial`
- **Line 397**: Use `freshIsPTOEnabled` instead of `isPTOEnabled`
- **Line 429**: Use `freshSelectedGroup` in `findRangeForDate`
- **Lines 433, 444, 452**: Use `freshSelectedGroupId` in all `addDateRange`/`deleteDateRange` calls
- **Line 459**: Capture `freshSelectedGroupId` in `dragStartGroupIdRef`

### Why This Works
By reading state directly from `useStore.getState()` at event time, we bypass React's render cycle delays and get the most up-to-date calendar selection, even if the component hasn't re-rendered yet after a Sidebar click.

### Files Modified
- `src/components/Calendar.tsx` - handleMouseDown function (lines 372-463)

### Test Results
**Status:** Ready for testing
**Build:** ✅ Successful (280.22 kB bundle)

### Next Steps
1. Clear browser cache
2. Test the exact scenario from console logs above
3. Verify events now go to correct calendar immediately after switching
4. Check that debug logs show matching IDs:
   - `Selected Calendar ID` should match clicked calendar
   - `dragStartGroupIdRef.current` should match clicked calendar
   - `Adding range to calendar` should match clicked calendar
