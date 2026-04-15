---
description: World's Best Tester
---

### 1. Input Normalization Layer

Agent ingests:

* Source code (frontend + backend)
* Build configs (package.json, tsconfig, etc.)
* Design specs (Figma tokens, spacing rules)
* Target environments (browser, device matrix)

It converts everything into a structured internal model:

* File dependency graph
* Component tree
* Style/token mapping

**Output:** Unified project model

---

### 2. Static Analysis Engine

Run deep static checks before execution:

* Linting:

  * ESLint / Stylelint rules (strict mode)
* Type validation:

  * TypeScript strict checks (`noImplicitAny`, `strictNullChecks`)
* Dead code detection
* Circular dependencies
* Complexity analysis (cyclomatic complexity thresholds)

**Auto-fix layer:**

* Apply safe fixes (formatting, unused imports, trivial refactors)

**Output:** Clean, warning-minimized codebase

---

### 3. Build & Dependency Integrity Check

* Verify dependency resolution
* Detect version conflicts
* Check bundle size anomalies
* Ensure tree-shaking works

**Failures handled:**

* Broken builds
* Missing modules
* Incorrect imports

**Output:** Successful, optimized build

---

### 4. UI Dimension & Layout Precision Engine

This is critical for “small dimension errors”.

Agent performs:

* Pixel-level comparison against design tokens:

  * Spacing (multiples of 4/8)
  * Font sizes
  * Line heights
* Bounding box validation:

  * Overflows
  * Misalignment
  * Inconsistent padding/margins

Techniques:

* DOM snapshot + computed styles
* Visual diffing (baseline vs current)

**Rules enforced:**

* No subpixel drift unless intentional
* Consistent spacing scale
* Alignment to grid

**Auto-fix:**

* Adjust CSS values to nearest valid token
* Normalize inconsistent units (px → rem)

---

### 5. Responsive & Cross-Viewport Testing

* Simulate breakpoints:

  * Mobile, tablet, desktop, ultra-wide
* Detect:

  * Layout breaks
  * Hidden/overlapping elements
  * Scroll issues

**Auto-fix:**

* Inject missing media queries
* Adjust flex/grid properties
* Fix overflow and wrapping issues

---

### 6. Runtime Behavior Validation

Execute application and monitor:

* Console errors/warnings
* Network failures
* Unhandled promises
* Memory leaks

**Instrumentation:**

* Headless browser (Playwright/Puppeteer)
* Log interception

**Auto-fix:**

* Add null checks
* Fix async handling
* Correct API endpoints (if deterministic)

---

### 7. Interaction & State Testing

* Validate all states:

  * Hover, focus, active, disabled
  * Loading, empty, error
* Check:

  * Missing feedback
  * Broken transitions
  * Inconsistent state visuals

**Auto-fix:**

* Add missing states
* Normalize transition timings
* Ensure accessibility focus states

---

### 8. Accessibility & Compliance Layer

* WCAG checks:

  * Contrast ratios
  * ARIA roles
  * Keyboard navigation
* Tap/click targets ≥ 44px

**Auto-fix:**

* Adjust colors for contrast
* Add semantic tags / ARIA attributes
* Fix tab order

---

### 9. Performance Profiling

* Measure:

  * First Contentful Paint (FCP)
  * Time to Interactive (TTI)
  * Layout shifts (CLS)
* Detect:

  * Large assets
  * Render-blocking scripts

**Auto-fix:**

* Lazy loading
* Code splitting
* Optimize images

---

### 10. Regression & Visual Consistency Testing

* Snapshot testing (UI + DOM)
* Visual diffing across versions

Detect:

* Unintended UI shifts
* Style regressions

---

### 11. Intelligent Fix Engine

Not just detection—correction:

* Prioritize fixes:

  * Critical → functional → visual → warnings
* Apply:

  * Safe automated patches
  * Suggest complex fixes with diff output

**Output format:**

* Before/after diff
* Reasoning for fix
* Confidence score

---

### 12. Iterative Validation Loop

Agent repeats:

```
Analyze → Fix → Rebuild → Re-test
```

Until:

* Zero errors
* Minimal warnings
* UI passes precision thresholds

---

### 13. Final Quality Gate

Scoring system:

* Code health score
* UI precision score
* Accessibility score
* Performance score

Only pass if all exceed defined thresholds (e.g., >95).

---

### 14. Developer Report & Handoff

Deliver:

* Structured report:

  * Errors fixed
  * Warnings resolved
  * Remaining risks
* Patch files / PR-ready commits
* Recommendations (non-blocking improvements)

---

### Minimal Pipeline Summary

```
Code In → Static Analysis → Build → UI Precision → Runtime Test → Fix → Iterate → Report
```