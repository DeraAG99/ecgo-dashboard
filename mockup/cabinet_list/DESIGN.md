---
name: ECGO Operational Core
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4a3e'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#6d7b6d'
  outline-variant: '#bccabb'
  surface-tint: '#006d33'
  primary: '#006b32'
  on-primary: '#ffffff'
  primary-container: '#008740'
  on-primary-container: '#f7fff3'
  inverse-primary: '#5adf82'
  secondary: '#4e5e82'
  on-secondary: '#ffffff'
  secondary-container: '#c4d4fe'
  on-secondary-container: '#4b5b7f'
  tertiary: '#a72e4a'
  on-tertiary: '#ffffff'
  tertiary-container: '#c84761'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#78fc9c'
  primary-fixed-dim: '#5adf82'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005225'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#b6c6f0'
  on-secondary-fixed: '#071b3b'
  on-secondary-fixed-variant: '#364669'
  tertiary-fixed: '#ffd9dd'
  tertiary-fixed-dim: '#ffb2bb'
  on-tertiary-fixed: '#400012'
  on-tertiary-fixed-variant: '#8a1636'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-page: 32px
  sidebar-width: 260px
  container-max: 1440px
---

## Brand & Style
The design system for this operational dashboard prioritizes clarity, real-time data legibility, and a professional "Mission Control" aesthetic. It utilizes a **Corporate / Modern** style with a focus on high-performance utility. 

The brand personality is efficient, sustainable, and reliable. To differentiate this from standard SaaS tools, the design system employs a high-contrast sidebar and tactical use of semantic color signaling to ensure operators can identify battery health and cabinet status at a glance. The interface remains clean with ample whitespace, ensuring that critical alerts stand out against the systematic layout.

## Colors
The palette is rooted in the "ECGO Green" to reinforce the brand's commitment to clean energy. 

- **Primary & Secondary:** The Primary Green is used for actions and "Success/Online" states. The Dark Blue (Secondary) is reserved for structural navigation elements and deep-tone headers to provide a sense of authority.
- **Surface Strategy:** Backgrounds use a light cool gray to reduce eye strain during long shifts.
- **Operational Logic:** Semantic colors are strictly mapped to hardware states:
  - **Green:** Online/Full (Normal operation).
  - **Blue:** Charging (Active process).
  - **Yellow/Orange:** Maintenance/Fault (Needs attention).
  - **Red:** Locked/Critical (Immediate action required).
  - **Gray:** Offline/Empty (Inactive).

## Typography
This design system uses **Inter** for its neutral, highly legible grotesque qualities, making it ideal for dense data environments. 

- **Hierarchy:** Use `display` for key dashboard metrics (e.g., total active batteries). Use `label-caps` for table headers and section overlines to distinguish them from interactive content.
- **Data Display:** For hardware IDs and battery serial numbers, use a monospaced alternative (JetBrains Mono) to ensure character alignment and readability.
- **Mobile scaling:** On smaller screens, `headline-lg` should scale down to 20px to maintain context without overwhelming the viewport.

## Layout & Spacing
The layout follows a **Fixed Grid** model optimized for 1440px desktop screens, ensuring a consistent operational view for dispatchers.

- **Grid:** 12-column grid with 24px gutters.
- **Sidebar:** A fixed-width (260px) left navigation bar using the Secondary (#1A2B4C) color.
- **Padding:** Content cards use internal padding of 24px to maintain a spacious, modern feel.
- **Responsive Behavior:** On tablet, the sidebar collapses into an icon-only rail. On mobile, the grid collapses to a single column with 16px horizontal margins.

## Elevation & Depth
Visual hierarchy is established using **Tonal Layers** combined with **Ambient Shadows**.

- **Level 0 (Background):** #F5F7FA.
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 4% opacity black shadow, 10px blur, and 4px vertical offset. This creates a "lifted" effect that separates interactive content from the background.
- **Interactive States:** On hover, buttons and interactive cards increase their shadow spread slightly to provide tactile feedback.
- **Overlays:** Modals and dropdowns use a higher elevation (Level 2) with a 12% shadow opacity to clearly sit above the dashboard content.

## Shapes
The shape language is modern and approachable but remains professional.

- **Cards:** Use `rounded-xl` (1.5rem / 24px) to create a distinct, friendly look for the primary data containers.
- **Buttons & Inputs:** Use `rounded-md` (0.5rem / 8px) for a more precise, functional feel.
- **Status Badges:** Use `rounded-full` (Pill-shaped) to distinguish them from buttons and indicate they are non-interactive status markers.

## Components
- **Buttons:** 
  - *Primary:* ECGO Green background, White text. 
  - *Secondary:* Transparent background, Dark Blue border/text.
- **Status Badges:** 
  - Use a 10% opacity version of the semantic color for the background, with the 100% color for the text and a 6px circular indicator icon.
- **Battery Slot Grid:**
  - Compact cards representing individual slots. 
  - Use thick top-borders (4px) colored by slot state (Charging, Empty, etc.).
- **Tables:**
  - Remove vertical borders. 
  - Use #1A2B4C at 80% opacity for headers in `label-caps` style. 
  - Rows should have a subtle hover highlight (#F5F7FA).
- **Sidebar:**
  - Dark Blue background.
  - Active links should have a left-side 4px "ECGO Green" border and 10% white overlay.
- **Metric Cards:**
  - Large display font for the value.
  - Sparkline chart (mini-line graph) in the bottom corner to show 24h trends.