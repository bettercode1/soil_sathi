---
name: gsap
description: >-
  GSAP animation patterns for Soil Sathi. Use when adding or refactoring GSAP
  animations, useGSAP hooks, timelines, scroll triggers, or replacing Framer
  Motion with GSAP on integration dashboards, headers, steppers, and page transitions.
---

# GSAP — Soil Sathi Animation Skill

## Stack

- `gsap` + `@gsap/react` (`useGSAP` hook)
- Register once per entry file: `gsap.registerPlugin(useGSAP);`

## When to use GSAP vs Framer Motion

| Use GSAP | Use Framer Motion |
|----------|-------------------|
| Hero headers, steppers, progress bars | Simple card hover in lists |
| Page/step transitions with timelines | AnimatePresence exit animations |
| Staggered dashboard reveals | Small inline micro-interactions |

## Patterns in this project

### Scoped mount timeline (header)

```tsx
const containerRef = useRef<HTMLDivElement>(null);

useGSAP(
  () => {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".si-hero-title", { y: 24, opacity: 0, duration: 0.5 })
      .from(".si-step-node", { y: 20, opacity: 0, stagger: 0.06, duration: 0.4 }, "-=0.15");
  },
  { scope: containerRef },
);
```

### Progress bar on state change

```tsx
useEffect(() => {
  gsap.to(progressRef.current, { width: `${pct}%`, duration: 0.65, ease: "power2.inOut" });
}, [pct]);
```

### Step content transition

See `GsapPageTransition.tsx` — re-run on `stepKey` dependency.

## Files

- `IntegrationPlatformHeader.tsx` — GSAP hero + stepper
- `GsapPageTransition.tsx` — step panel enter animation
- `integrationSteps.ts` — step order constants (shared)

## Rules

- Prefer `useGSAP` with `scope` over raw `useEffect` + `gsap.to` when animating children
- Use CSS class hooks (e.g. `.si-hero-title`) inside scoped containers
- Keep durations 0.35–0.65s for enterprise UI; use `power2.out` / `power3.out`
- Respect `prefers-reduced-motion`: skip or set `duration: 0` when matched
- Do not animate layout-critical properties without `will-change` sparingly

## Reduced motion helper

```tsx
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const dur = prefersReduced ? 0 : 0.55;
```
