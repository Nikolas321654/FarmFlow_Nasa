## Stack
React, TypeScript, Vite, TailwindCSS, React Router, TanStack Query, React Leaflet, Leaflet, Leaflet-Geoman, Recharts, FontAwesome; Helvetica for UI text and Righteous for large headings and display accents.

## Typography
- Primary font: Helvetica
- Display font: Righteous 400, self-hosted with `@fontsource/righteous`
- Body text, navigation, buttons, forms, charts: Helvetica
- Large page headings and display accents: Righteous 400 (`font-display font-normal` or `display-accent`)
- Avoid Righteous in small text and dense data displays.
- Use consistent typography tokens across all screens.

## Rules
- Use FontAwesome icons for common actions and status indicators. Avoid custom icons unless they are essential to the demo story.

## Design Principles

Rivnova is a map-first agricultural monitoring application. The interface should feel modern, calm, trustworthy, and practical.

- **Map-first experience:** The interactive field map is the central element of the application.
- **Data over decoration:** Prioritize field conditions, environmental indicators, and actionable recommendations.
- **Progressive disclosure:** Show the most important information first, with detailed analytics available after selecting a field.
- **Minimal navigation:** Avoid unnecessary pages, menus, and dashboard complexity.
- **Consistent visual language:** Reuse components, spacing, typography, colors, and interaction patterns.
- **No unnecessary authentication barriers:** Visitors can explore demo fields before signing in.

Avoid generic SaaS dashboards, excessive gradients, decorative illustrations, heavy shadows, and unnecessary animations.

## Color System

The Rivnova interface uses a natural, muted palette based on the approved agricultural field-mapping prototype.

### Core Palette

| Token | HEX | Usage |
|---|---|---|
| `forest` | `#162A1F` | Dark navigation panels, sidebar, strong visual anchors |
| `primary` | `#24543A` | Primary buttons, active navigation, selected controls |
| `primary-hover` | `#173A2A` | Hover state for primary actions |
| `sage` | `#788868` | Secondary buttons, supporting elements, muted green surfaces |
| `background` | `#F6F1EA` | Main page background and header |
| `surface` | `#FCF9F5` | Cards, menus, elevated surfaces |
| `surface-muted` | `#F3EDE6` | Form panels, secondary containers |
| `modal` | `#F5EFE8` | Modal backgrounds |
| `text-primary` | `#101D17` | Headings and primary text |
| `text-secondary` | `#626960` | Descriptions, metadata, helper text |
| `border` | `#CCC6BC` | Form borders, separators, card outlines |
| `terracotta` | `#A47854` | Decorative accents, illustrations, secondary highlights |
| `terracotta-action` | `#9A5536` | Accent-colored interactive buttons with white text |

The core background, forest green, sage and terracotta colors are based on the visual prototype. Additional interaction and surface tokens are defined to maintain consistency and accessibility.

### Semantic Colors

| Status | Text/Icon | Background |
|---|---|---|
| Success / Optimal | `#357646` | `#E5F0DF` |
| Warning / Water Stress | `#9A5E12` | `#FFF0D3` |
| Danger / Work Blocked | `#B75042` | `#FCE9E4` |
| Neutral / Unknown | `#626960` | `#EAE8E2` |

Use the same semantic colors across field cards, map legends, status badges, alerts and analytics.

Never communicate status by color alone. Always include a meaningful label or FontAwesome icon.

### Color Usage Rules

- Use warm cream as the default page background, not pure white.
- Use Forest Green for dark navigation surfaces and large visual anchors.
- Use Primary Green for important active actions.
- Use Sage Green for supporting elements and low-emphasis surfaces.
- Use Terracotta sparingly for emphasis and illustration accents.
- Use primary text on light surfaces and white text on dark green surfaces.
- Use semantic colors consistently; do not introduce new status colors for individual screens.
- Avoid neon greens, highly saturated gradients and arbitrary brand colors.
- Do not use Sage Green with white text for small buttons without checking contrast.
- Disabled controls must be visibly inactive and functionally disabled.
- Preserve the original logo colors and proportions; do not recolor the asset to match the interface.

Use the original approved Rivnova logo asset from the repository. Preserve its exact colors, proportions, and transparency. Never recreate, recolor, or approximate the logo. The UI color palette does not override the logo's original colors.

## Layout & Navigation

### Screen Architecture (MVP)

The Rivnova MVP consists of **3 primary screens and 3 modal dialogs**.

**Primary screens:**
1. Field Explorer (`/`) — supports Guest and Authenticated states.
2. Field Insights (`/fields/:id`) — shared analytics view for demo and user-owned fields.
3. Add Field (`/fields/new`) — interactive field creation and GeoJSON import.

**Modal dialogs:**
1. Google Sign-In — displayed when authentication is required.
2. Edit Profile — allows users to change their Rivnova display name.
3. Delete Field Confirmation — prevents accidental field deletion.

**Navigation rules:**
- Do not create separate pages for Demo Fields and My Fields.
- Do not create separate dashboards for guest and authenticated users.
- Do not create dedicated Login, Register, or Profile pages.
- Keep the navigation simple and consistent across all screens.
- Google OAuth callbacks are technical routes, not standalone UI screens.

### Field Explorer (`/`)

The main entry point for all users.

- Display the interactive map as the main visual element.
- Provide a field list alongside the map.
- Allow users to select fields from either the list or the map.
- Clearly highlight the selected field in both places.
- Provide a visible **Add Field** action.
- Avoid unnecessary welcome screens and marketing sections before the main functionality.

For unauthenticated visitors:
- Display four predefined demo fields.
- Allow access to their analytics.
- Offer Google Sign-In when the user attempts to save a personal field.

For authenticated users:
- Display both **Demo Fields** and **My Fields**.
- Allow switching between the two groups.
- Show a user avatar and account menu in the header.

### Field Insights (`/fields/:id`)

Use a consistent structure for both demo and personal fields.

Information hierarchy:

1. Field name, crop type, area, and location.
2. Main recommendation or most important alert.
3. Field overview and map.
4. Irrigation, workability, water stress, and vegetation indicators.
5. Historical trends and supporting charts.

Prioritize recommendations over raw numerical data.

### Add Field (`/fields/new`)

- Allow users to draw a field polygon directly on the map.
- Support importing a GeoJSON polygon.
- Provide fields for name, crop type, and planting date.
- Preview the field boundary and area before saving.
- Clearly indicate validation errors.
- Guests may open the Add Field screen, draw a polygon, import GeoJSON, and fill in field details without signing in.
- Require Google authentication before saving, not before opening the field creation interface.
- When a guest clicks **Save Field**, show the Google Sign-In prompt.
- After successful sign-in, preserve the complete field draft (polygon, name, crop type, planting date) and return the user to the creation flow so they can finish saving. Do not discard entered data during authentication.
- After successful creation, make the new field available in My Fields.

### Profile

Keep account management minimal.

- Google avatar, display name, and email in the account menu.
- Allow editing the Rivnova display name.
- Include a Logout action.
- Do not implement custom avatar uploads or password-based authentication in the MVP.

## Components

### Buttons

- Primary buttons use `primary`.
- Hover states use `primary-hover`.
- Secondary buttons use subdued surfaces or borders.
- Destructive actions require clear confirmation.
- Use descriptive labels such as **Add Field**, **View Insights**, and **Save Changes**.
- Provide hover, focus, disabled, and loading states.

### Cards

- Use `surface` or `surface-muted` backgrounds.
- Use subtle borders and moderate corner radii.
- Avoid excessive shadows.
- Maintain consistent internal padding.
- Keep titles, numerical values, status indicators, and actions visually distinct.

### Forms

- Use visible labels and clear validation messages.
- Group related inputs logically.
- Show units for measurements.
- Preserve user-entered values when validation fails.
- Use consistent borders, backgrounds and focus states.

### Modals

Use modals for short, focused interactions:
- Google Sign-In prompt.
- Edit Profile.
- Delete Field confirmation.

Avoid using modals for complex analytics or multi-step workflows.

## Maps & Data Visualization

### Interactive Map

- Use Leaflet with React Leaflet.
- Display field boundaries as polygons.
- Distinguish selected fields from unselected fields.
- Support zooming, panning, and fitting the map to a selected field.
- Provide clear interactions for drawing and editing polygons.
- Support GeoJSON imports.
- Display field details after selecting a polygon.

The production map must use actual Leaflet-compatible map tiles and interactive GeoJSON polygons, not a static screenshot or decorative background image. Satellite imagery is preferred where an appropriate tile provider is configured.

Use appropriate map layers and make sure field boundaries remain visually distinguishable from the background.

### Charts

- Use Recharts for environmental and vegetation trends.
- Label axes, units, and dates.
- Use consistent colors for the same measurements across screens.
- Provide loading, empty, and unavailable-data states.
- Do not show invented values as real satellite observations.

Charts should support interpretation, not just decoration.

## Responsive Design

### Desktop

- Map-first, multi-column layout.
- Field list beside the map.
- Insights presented in a readable card grid.

### Tablet

- Reduce the number of columns.
- Keep the map prominent.
- Allow field lists and details to collapse when necessary.

### Mobile

- Use a single-column layout.
- Keep essential actions accessible.
- Allow switching between the map and field list.
- Avoid horizontal scrolling in forms and cards.
- Ensure map controls and interactive elements are touch-friendly.

## Interaction & UI States

- Every data-driven component must support loading, empty, error, and success states.
- Display a meaningful empty state when the user has no personal fields.
- Show clear feedback after creating, deleting, or updating a field.
- Disable submit buttons during API requests.
- Preserve unsaved form data when authentication is required.
- Show appropriate messages when satellite data is unavailable.
- Keep field selection synchronized between the map and field list.
- All interactive elements must have visible hover and focus states.

## Design Constraints

- Follow the approved Rivnova logo and moodboard.
- Do not redesign or reinterpret the brand logo.
- Do not add functionality outside the agreed MVP scope.
- Do not introduce separate login, registration, or password recovery pages.
- Do not create an additional complex dashboard when the Field Explorer and Field Insights screens already cover the required functionality.
- Use reusable React components rather than duplicating UI implementations.
- Keep mock data clearly distinguishable from real API data.
- Visual design must not compromise functionality, accessibility, or readability.
