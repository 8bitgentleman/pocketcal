# Implementation Plan: localStorage-Based Persistence with Explicit Sharing

## Overview
Migrate from automatic URL-based state persistence to localStorage-based persistence with explicit sharing. This prevents users from thinking URLs enable real-time collaboration.

## Current State Analysis

**Problem:**
- App auto-updates URL on every state change (App.tsx:100-109)
- Users think bookmarked URLs will always have their latest changes
- Users might think sharing URLs enables real-time collaboration
- Bookmarking a URL at any point creates a snapshot, not a live reference

**Current Flow:**
```
User edits calendar → State changes → URL updates automatically →
User bookmarks old URL → Returns to old bookmark → Loses recent changes
```

**Desired Flow:**
```
User edits calendar → State saves to localStorage →
User clicks Share → Explicit snapshot URL generated →
URL recipient sees frozen copy, not live edits
```

## Implementation Strategy

### 1. Core Data Persistence Changes (store.ts)

**Add three new functions:**

1. `saveToLocalStorage()` - Auto-save state to `pocketcal_calendar_state_v1` using same compressed format as URLs
2. `loadFromLocalStorage()` - Load state from localStorage on startup
3. `clearLocalStorage()` - Clear stored data (for reconciliation modal)

**Modify `getAppStateFromUrl()` to handle 4 cases:**

| Case | localStorage | URL Hash | Action |
|------|--------------|----------|--------|
| 1 | ✓ | ✓ | Show reconciliation modal (user chooses) |
| 2 | ✓ | ✗ | Load from localStorage |
| 3 | ✗ | ✓ | Load from URL, migrate to localStorage, clear URL |
| 4 | ✗ | ✗ | Use default state |

**Update all state-modifying actions to auto-save:**
- After every action (addEventGroup, addDateRange, setPTOConfig, etc.), call `saveToLocalStorage()`
- Pattern: `set({ ... }); get().saveToLocalStorage();`

### 2. Remove Auto-URL Sync (App.tsx)

**Delete the useEffect at lines 100-109:**
```typescript
// DELETE THIS:
useEffect(() => {
  const newUrl = generateShareableUrl();
  window.history.replaceState(null, "", newUrl);
}, [startDate, includeWeekends, showToday, eventGroups, generateShareableUrl]);
```

This is the critical change - URL no longer updates automatically.

### 3. Add Explicit Share Button (Sidebar.tsx)

**Replace "URL" button with "Share" button:**
- Button text: "Share" (was "URL")
- Icon: ShareIcon (was CopyIcon)
- Action: Opens ShareModal (was copying current URL)
- Tooltip: "Generate a shareable link for your calendar"

### 4. New UI Components

**ShareModal.tsx** - Shows when user clicks Share:
- Displays generated shareable URL
- Copy to clipboard button with feedback
- Explanation: "This is a snapshot of your calendar at this moment"
- Note: "Changes you make won't affect links you've already sent"

**ReconciliationModal.tsx** - Shows when both localStorage and URL hash exist:
- Two options:
  - "Use My Saved Calendar" (keeps localStorage, clears URL)
  - "Use URL Calendar" (replaces localStorage with URL data)
- Warning: "Choosing URL calendar will replace your saved calendar"

**ShareIcon.tsx** - New icon component (three connected circles, standard share icon)

### 5. Update User-Facing Messaging

**WelcomeModal.tsx - Step 5 "Sharing & Saving":**
- OLD: "Your calendar data is automatically saved in the URL"
- NEW: "Your calendar is automatically saved locally in your browser"
- Add: "Shared links are snapshots - changes won't affect them"

**HelpModal.tsx - Features section:**
- OLD: "Your data is saved locally in the URL"
- NEW: "Your data is saved automatically in your browser"
- Add: "Shared links won't change when you update your calendar"

## Critical Files to Modify

1. **src/store.ts** - Add localStorage functions, modify all state actions
2. **src/App.tsx** - Remove URL sync effect, add ShareModal and ReconciliationModal
3. **src/components/Sidebar.tsx** - Replace URL button with Share button
4. **src/components/ShareModal.tsx** - NEW: Share flow UI
5. **src/components/ReconciliationModal.tsx** - NEW: Load conflict resolution UI
6. **src/components/icons/ShareIcon.tsx** - NEW: Share icon
7. **src/components/WelcomeModal.tsx** - Update messaging
8. **src/components/HelpModal.tsx** - Update messaging

## Edge Cases Handled

1. **Old bookmarks with URL hashes** → Auto-migrate to localStorage, clear URL hash
2. **localStorage quota exceeded** → Graceful error handling, log warning
3. **Corrupted localStorage** → Clear corrupted data, load default state
4. **Shared link while having local data** → Show reconciliation modal
5. **Browser without localStorage** → Fallback to default state (rare edge case)

## Implementation Order

1. **Phase 0:** Save this implementation plan to the repo (in `/docs` or root as `IMPLEMENTATION_PLAN.md`)
2. **Phase 1:** Add localStorage functions to store.ts (non-breaking)
3. **Phase 2:** Modify getAppStateFromUrl() to check localStorage first
4. **Phase 3:** Create ShareModal, ReconciliationModal, ShareIcon components
5. **Phase 4:** Update Sidebar.tsx and App.tsx to integrate modals
6. **Phase 5:** Remove URL sync effect from App.tsx
7. **Phase 6:** Update all state actions to call saveToLocalStorage()
8. **Phase 7:** Update WelcomeModal and HelpModal messaging

## Verification & Testing

**After implementation, test these scenarios:**

1. **Fresh user:**
   - Open app → Make changes → Refresh → Changes persist
   - Verify localStorage contains compressed state

2. **Sharing flow:**
   - Click Share → Modal shows URL → Copy URL
   - Open in incognito → Calendar loads correctly
   - Make changes in original → Verify shared URL unchanged

3. **Receiving shared link:**
   - Have local data → Open shared URL → Reconciliation modal appears
   - Choose "Use URL" → Shared data loads
   - Choose "Use Local" → Local data kept, URL cleared

4. **Old bookmark migration:**
   - Have URL hash bookmark, clear localStorage
   - Open bookmark → Auto-migrates to localStorage
   - Refresh → Works without URL hash

5. **Error handling:**
   - Test localStorage quota (unlikely but possible)
   - Test corrupted localStorage data
   - Test invalid URL hash

## Expected User Impact

**Positive:**
- ✅ No more confusion about URL collaboration
- ✅ Data always persists (safer than bookmarks)
- ✅ Clear mental model: "Save locally, share snapshots"
- ✅ Explicit sharing action makes intent clear

**Neutral:**
- ⚪ Extra click to share (but this is intentional - makes sharing explicit)
- ⚪ URL in address bar stays clean (no hash clutter)

**No negative impact expected** - migration is automatic and seamless

## Data Format

**localStorage key:** `pocketcal_calendar_state_v1`

**Stored value:** Same compressed format as URL (LZString-encoded JSON)

```json
{
  "s": "2026-01-01",
  "w": false,
  "t": false,
  "g": [
    {
      "n": "Team PTO",
      "c": 1,
      "r": [[0, 5], [10, 15]],
      "pto": {"y": 2, "r": 0, "e": true},
      "ptoEntries": [{"sd": 0, "ed": 5, "hpd": 8, "n": "Vacation"}]
    }
  ]
}
```

This matches URL format exactly - enables code reuse and consistency.

## Success Criteria

- [ ] User's calendar persists between sessions without bookmarking
- [ ] Share button generates snapshot URL
- [ ] Shared URLs never change when source calendar changes
- [ ] Reconciliation modal handles conflicts correctly
- [ ] Old bookmarks auto-migrate to localStorage
- [ ] WelcomeModal and HelpModal messaging reflects new model
- [ ] No data loss during migration
- [ ] All existing functionality preserved
