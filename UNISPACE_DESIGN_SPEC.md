# Unispace PTO Calculator - Design Specification

## Project Overview
Redesign the pocketcal React application with Unispace branding while maintaining all existing functionality. The redesign should touch every screen and component with strategic gradient accents on a dark mode base.

## Design Philosophy
**"Minimal with Strategic Pops"** - Clean, professional interface with strategic gradient accents that honor the Unispace brand. Gradients appear on key interactive elements, active states, and PTO indicators, while maintaining clarity and readability for daily use.

## Typography

### Fonts
- **Sans-serif (Body/UI/Logo)**: `Archivo` - Modern grotesque sans-serif (similar to Neue Haas Grotesk Display used on Unispace website)
- **Serif (Headers/Titles)**: `Crimson Pro` - Elegant serif (similar to Freight Display Pro used on Unispace website)
- **Google Fonts Import**:
  ```
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Crimson+Pro:wght@400;500;600;700&display=swap');
  ```

### Font Usage
- Body text, buttons, navigation: `font-family: 'Archivo', sans-serif;`
- Page headers, modal titles, month names: `font-family: 'Crimson Pro', serif;`

## Color Palette

### Unispace Brand Gradients
- **Cyan**: `#00d4ff`
- **Purple**: `#8b5cf6`
- **Orange**: `#ff6b35`
- **Pink**: `#ff006e`

### Dark Mode Colors (Default)
- **Background**: `#0a0a0a` (deep black)
- **Card Background**: `#1a1a1a` (dark gray)
- **Border**: `#2a2a2a`
- **Text Primary**: `#ffffff`
- **Text Secondary**: `#a0a0a0`

### Light Mode Colors (Toggle Available)
- Maintain existing light mode color scheme with gradient accents

## Gradient Applications (Strategic Use Only)

### Where to Use Gradients
1. **Logo/Branding**: Cyan → Purple gradient
2. **Page Titles**: Gradient text effect using background-clip
3. **CTA Buttons**: Full gradient (Cyan → Purple → Orange) with glow shadow
4. **Primary Action Buttons**: Orange → Pink gradient
5. **Active Navigation Items**: Subtle gradient background (rgba)
6. **PTO Date Backgrounds**: Full background gradients (see PTO Display section)
7. **Today Indicator**: Gradient background with cyan border
8. **Hover States**: Cyan glows and borders (subtle)
9. **Focus States**: Cyan glow on inputs

### Where NOT to Use Gradients
- Plain text and body copy
- Regular buttons and borders (use solid colors)
- Background surfaces (keep dark/light solid colors)
- Calendar grid structure

## Layout Specifications

### Calendar Grid
- **Layout**: CSS Grid with 4 columns
- **Column Setup**: `grid-template-columns: repeat(4, minmax(250px, 250px));`
- **Month Card Size**: Fixed `250px` width
- **Gap Between Months**: `16px`
- **Card Padding**: `12px`
- **Card Border**: `1px solid #2a2a2a`, `border-radius: 8px`

### Responsive Breakpoints
- **Desktop (>1400px)**: 4 columns
- **Tablet (1000-1400px)**: 3 columns
- **Small Tablet (600-1000px)**: 2 columns
- **Mobile (<600px)**: 1 column

### Calendar Month Card
- Background: `#1a1a1a` (card-dark)
- Border: `1px solid #2a2a2a`
- Border radius: `8px`
- Padding: `12px`
- Gap between elements: `8px`
- Hover effect: Cyan border glow

### Month Header
- Center-aligned
- Font: `'Crimson Pro', serif`
- Font size: `13px`
- Font weight: `600`
- No navigation arrows (removed for space)

### Weekday Headers
- 7-column grid
- Gap: `1px`
- Font size: `9px`
- Font weight: `600`
- Text transform: `uppercase`
- Color: `#a0a0a0` (text-secondary)
- Padding: `2px 0`

### Day Cells
- 7-column grid
- Gap: `1px`
- Aspect ratio: `1:1`
- Min height: `28px`
- Border radius: `4px`
- Font size: `11px`
- Font weight: `500`
- Base color: `#a0a0a0` (text-secondary)
- Border: `1px solid transparent`
- Transition: `all 0.2s ease`

## Component Styling

### Day Cell States

#### Default Day
- Background: transparent
- Color: `#a0a0a0`
- Hover: `background: rgba(0, 212, 255, 0.1)`, `color: #ffffff`

#### Other Month Days
- Color: `rgba(160, 160, 160, 0.4)` (reduced opacity)

#### Today
- Background: `linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(139, 92, 246, 0.15))`
- Border: `1px solid #00d4ff` (cyan)
- Color: `#ffffff`
- Font weight: `600`

#### PTO Days (Single Person)
- Background: `linear-gradient(135deg, #00d4ff, #8b5cf6)` (cyan → purple)
- Color: `#0a0a0a` (dark text on bright background)
- Font weight: `600`
- Hover: Same gradient with `opacity: 0.9`

#### PTO Days (Two People - Split Background)
- Background: `linear-gradient(180deg, #00d4ff 0%, #00d4ff 50%, #ff6b35 50%, #ff6b35 100%)`
- Horizontal split: Top half cyan, bottom half orange
- Color: `#0a0a0a`
- Font weight: `600`

#### PTO Days (Three People - Triple Stripe)
- Background: `linear-gradient(180deg, #00d4ff 0%, #00d4ff 33%, #8b5cf6 33%, #8b5cf6 66%, #ff006e 66%, #ff006e 100%)`
- Three horizontal stripes: cyan, purple, pink
- Color: `#0a0a0a`
- Font weight: `600`

#### Holiday Days
- Background: `rgba(255, 107, 53, 0.15)` (light orange tint)
- Color: `#ff6b35` (orange)
- Font weight: `600`

### Sidebar

#### Dimensions
- Width: `280px` (fixed)
- Padding: `32px 24px`
- Background: `#1a1a1a` (card-dark)
- Border right: `1px solid #2a2a2a`

#### Logo Section
- Logo icon: 40px square
- Background: `linear-gradient(135deg, #00d4ff, #8b5cf6)`
- Border radius: `8px`
- Text: "U" centered, dark color
- Logo text below: "UNISPACE" in uppercase, 14px, font-weight 600, `#a0a0a0`

#### Navigation Items
- Padding: `12px 16px`
- Border radius: `8px`
- Font size: `14px`
- Font weight: `500`
- Default: transparent background, `#a0a0a0` text
- Hover: `background: rgba(0, 212, 255, 0.05)`, `border: 1px solid #00d4ff`, `color: #00d4ff`
- Active: `background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(139, 92, 246, 0.1))`, `border: 1px solid #00d4ff`, `color: #00d4ff`

#### CTA Button (Request PTO)
- Padding: `14px 20px`
- Border radius: `10px`
- Background: `linear-gradient(135deg, #00d4ff, #8b5cf6, #ff6b35)` (full gradient)
- Color: `#0a0a0a` (dark text)
- Font weight: `600`
- Font size: `14px`
- Box shadow: `0 8px 24px rgba(0, 212, 255, 0.2)`
- Hover: `transform: translateY(-2px)`, `box-shadow: 0 12px 32px rgba(0, 212, 255, 0.3)`

### Modals

#### Modal Overlay
- Background: `rgba(10, 10, 10, 0.8)`
- Backdrop filter: `blur(4px)`
- Z-index: `1000`
- Transition: `all 0.3s ease`

#### Modal Content
- Background: `rgba(26, 26, 26, 0.95)` (slight transparency for glassmorphism)
- Border: `1px solid #2a2a2a`
- Border radius: `16px`
- Padding: `32px`
- Max width: `400px`
- Backdrop filter: `blur(10px)`
- Box shadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
- Animation: slideUp from bottom (0.3s ease)

#### Modal Title
- Font: `'Crimson Pro', serif`
- Font size: `22px`
- Font weight: `600`

#### Form Inputs
- Padding: `10px 12px`
- Border: `1px solid #2a2a2a`
- Border radius: `8px`
- Background: `rgba(255, 255, 255, 0.05)`
- Color: `#ffffff`
- Font family: `'Archivo', sans-serif`
- Transition: `all 0.2s ease`
- Focus: `border-color: #00d4ff`, `background: rgba(0, 212, 255, 0.05)`, `box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1)`

#### Buttons

**Secondary Button**
- Padding: `8px 12px`
- Border radius: `8px`
- Border: `1px solid #2a2a2a`
- Background: transparent
- Color: `#ffffff`
- Font size: `12px`
- Font weight: `500`
- Hover: `border-color: #a0a0a0`, `background: rgba(255, 255, 255, 0.05)`

**Primary Button**
- Padding: `8px 12px`
- Border radius: `8px`
- Background: `linear-gradient(135deg, #ff6b35, #ff006e)` (orange → pink)
- Border: none
- Color: `#0a0a0a` (dark text)
- Font weight: `600`
- Hover: `transform: translateY(-1px)`, `box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3)`

### Scrollbars
- Width: `8px`
- Track: transparent
- Thumb: `#2a2a2a` (border-color)
- Thumb hover: `rgba(139, 92, 246, 0.6)` (purple tint)
- Border radius: `4px`

## Interaction States

### Hover Effects
- Calendar months: Cyan border glow (`box-shadow: 0 0 20px rgba(0, 212, 255, 0.1)`)
- Day cells: Light cyan background (`rgba(0, 212, 255, 0.1)`)
- Navigation items: Cyan border and text
- Buttons: Slight lift with shadow increase
- Month navigation: Purple tint background

### Focus States
- Input fields: Cyan border with glow shadow
- Buttons: Cyan outline (use accent color)

### Active States
- Navigation items: Gradient background with cyan border
- Selected dates: Full gradient background

## Animation Guidelines

### Timing Functions
- Standard transitions: `0.2s ease`
- Modal animations: `0.3s ease`
- Hover lifts: `0.3s ease`

### Key Animations
- Modal slide-up: translateY(20px) → translateY(0), opacity 0 → 1
- Button hover: translateY(0) → translateY(-2px)
- Gradient background: Smooth color transitions

### Performance
- Use CSS transitions over JavaScript animations
- Use `transform` and `opacity` for smooth 60fps animations
- Avoid animating expensive properties like `width`, `height`, `box-shadow` (except on hover)

## Accessibility

### Contrast
- Ensure WCAG AA compliance for text on colored backgrounds
- PTO dates use dark text (`#0a0a0a`) on bright gradient backgrounds
- Maintain high contrast for all interactive elements

### Focus Indicators
- Visible focus outlines using cyan (`#00d4ff`)
- Never remove focus styles
- Ensure keyboard navigation works throughout

### ARIA Labels
- Maintain existing ARIA labels and roles
- Add descriptive labels for gradient-styled interactive elements
- Ensure screen readers can understand PTO indicators

## Implementation Notes

### CSS Variables Approach
Update existing CSS variable system in `App.css`:
```css
:root {
  /* Base colors */
  --bg-dark: #0a0a0a;
  --card-dark: #1a1a1a;
  --border-color: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;

  /* Unispace gradients */
  --cyan: #00d4ff;
  --purple: #8b5cf6;
  --orange: #ff6b35;
  --pink: #ff006e;

  /* Gradient definitions */
  --gradient-primary: linear-gradient(135deg, var(--cyan), var(--purple));
  --gradient-cta: linear-gradient(135deg, var(--cyan), var(--purple), var(--orange));
  --gradient-button: linear-gradient(135deg, var(--orange), var(--pink));
}
```

### Component Updates Required

1. **App.css** - Update root CSS variables and global styles
2. **Calendar.tsx** & **Calendar.css** - Update calendar grid, month cards, day cell styling
3. **Sidebar.tsx** & **Sidebar.css** - Update sidebar styling, navigation, CTA button
4. **Modal.css** - Update all modal styles with glassmorphism
5. **WelcomeModal.tsx** & **WelcomeModal.css** - Update onboarding modal styling
6. **PTOSummaryDashboard.tsx** & **PTOSummaryDashboard.css** - Update dashboard with gradients
7. **index.css** - Update global button styles and scrollbar

### Font Integration
Add to `index.html` or import in CSS:
```html
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Crimson+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### PTO Background Logic
When rendering day cells with PTO:
- 1 person: Single gradient background
- 2 people: Horizontal split (50/50)
- 3+ people: Triple stripe (33/33/33) or extend pattern

Use the group's color in the gradient (existing colors: purple, blue, pink, yellow, green).

### Dark Mode Toggle
- Default to dark mode
- Maintain existing dark mode toggle functionality
- Ensure gradients work well in both modes (may need opacity adjustments for light mode)

## Reference Files

- **Design Mockup**: `unispace-design-mockup.html` - Interactive HTML mockup showing all design elements
- **Existing Codebase**: Full React app in `src/` directory
- **Current Styles**: See existing CSS files for structure to maintain

## Design Decisions Log

### Questions Asked & Answers
1. **Gradient Implementation**: Minimal with strategic pops (not bold throughout)
2. **Theme Mode**: Dark mode default (gradients pop better on dark)
3. **Calendar Style**: Seamless grid flow (not card-based with depth)
4. **Event Indicators**: Gradient pills → Full background colors (updated)
5. **Calendar Size**: Compact, 4 columns, fixed 250px width per month
6. **Typography**: Archivo (sans) + Crimson Pro (serif) matching Unispace website fonts

### Key Constraints
- Touch every screen and component
- Maintain all existing functionality
- Preserve accessibility features
- Keep calendar compact (all 12 months visible with minimal scrolling)
- Use strategic gradients (not overwhelming)
- Dark mode optimized

## Next Steps for Implementation

1. Update CSS variables in `App.css`
2. Install/import Google Fonts (Archivo, Crimson Pro)
3. Update Calendar component and styles (grid, fixed width, 4 columns)
4. Implement full background colors for PTO dates with split logic
5. Update Sidebar styling (logo, navigation, CTA button)
6. Update Modal styles (glassmorphism, gradients)
7. Update all buttons (primary gradient, hover effects)
8. Update header typography (serif for titles)
9. Test dark mode and light mode
10. Verify accessibility (contrast, focus states)
11. Test responsive breakpoints (4/3/2/1 columns)
12. Ensure all existing functionality works

---

**Design Approved**: 2026-01-12
**Implementation Ready**: Yes
**Mockup File**: `unispace-design-mockup.html`
