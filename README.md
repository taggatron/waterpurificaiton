# Interactive Water Purification Stages

An accessible, self‑contained web mini‑app that visually and interactively teaches the major stages of conventional drinking water treatment. Designed for high school learners and built with only semantic HTML, SVG, CSS, and vanilla JavaScript (no build step required).

## Features
- SVG plant diagram with highlighted stage blocks
- Animated water droplet traveling along the treatment path
- NEW: Interactive lab simulation (coagulant dose, mixing, time) affects modeled turbidity removal
- NEW: Dynamic turbidity & microbe reduction graphs (with log scale for microbes)
- NEW: Floc formation visual canvas and stage-specific decorative animations
- Step navigation (mouse, touch, keyboard arrows, or clicking diagram)
- Play / Pause auto‑advance with adjustable speed and optional looping
- Contextual learning tips per stage
- Lightweight formative quiz generator with randomized answers
- Accessible: ARIA labels, logical focus order, reduced‑motion support, high‑contrast focus indicators
- Mobile responsive layout

## Stages Covered
1. Intake (Screening)
2. Coagulation & Flocculation
3. Sedimentation (Clarification)
4. Filtration
5. Disinfection
6. Distribution

## Getting Started
Just open `index.html` locally in any modern browser.

### Optional Local Static Server (for future extension)
You can serve the folder with a simple Python command if desired:
```bash
python3 -m http.server 8080
```
Then visit: http://localhost:8080

## Project Structure
```
waterpurificaiton/
  index.html          # Main page
  README.md           # Documentation (this file)
  css/
    styles.css        # Layout, theme, animations, responsive + a11y tweaks
  js/
    app.js            # Stage data, navigation logic, droplet animation, quiz
  assets/             # (Placeholder for future images/audio)
```

## Pedagogical Notes
- Each stage card mixes concise explanation + bullet recap + a memory anchor (tip)
- Quiz reinforces terminology after exploration
- Visual animation supports sequential conceptual model (process flow)
- Colors subtly shift hue to imply progressive refinement while maintaining contrast

## Accessibility (A11y)
- SVG elements representing stages are keyboard focusable and operable with Enter/Space
- `prefers-reduced-motion` respected: animations disabled and a notice is displayed
- Clear focus outlines and ARIA relationships for stage nav and dynamic content region
- Auto‑advance requires explicit opt‑in (avoids unexpected motion)

## How It Works
- A single `stages` array in `app.js` drives navigation, content rendering, and color accents
- Droplet movement uses an SVG path; position interpolation uses `getPointAtLength()` + easing
- Stage buttons and SVG groups share indices; moving stages only requires updating the array
- Quiz questions stored in `quizBank`; answers are shuffled on generation

## Extending
Ideas for simple enhancements:
- Add more process variants (e.g., advanced oxidation, activated carbon)
- Include turbidity/contaminant reduction percentages per stage
- Add a timeline slider to scrub through stages
- Replace droplet with animated particulate transformations
- Localize text content via a simple JSON dictionary
- Add audio narration or captions for UDL support
- Provide a mini-lab mode where students adjust coagulant dose and see floc settling efficiency change
- Integrate simple water quality graphs (turbidity, microbial count) decreasing after each stage
- Add teacher mode with discussion prompts and printable worksheets
- Track user progress and correct quiz answers using localStorage
- Dark mode toggle respecting prefers-color-scheme

## Performance
The app is intentionally minimal (no dependencies). All assets are inline or tiny—ideal for classroom networks.

## Browser Support
Tested conceptually against evergreen Chromium, Firefox, and Safari. Should gracefully degrade (animation just won’t run) if `getPointAtLength` is unsupported (rare).

## License
MIT – adapt freely for educational use. Attribution appreciated but not required.

## Attribution / Credits
Content derived from broadly accepted conventional surface water treatment steps as documented by public health and environmental agencies.

---
Happy teaching! Contributions / questions welcome.
