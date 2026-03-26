---
description: Visual identity, CSS variables, component patterns, theme system
---

## Design principles
Bold, clean, high-contrast. Built for quick glances on any screen.
Flat surfaces. No gradients. No decorative shadows. No blur effects.
Color encodes meaning — not decoration.
Touch targets minimum 44px.

## CSS variables

```css
/* Dark theme (default) */
[data-theme="dark"], :root {
  --bg-base:       #0C0C0C;
  --bg-surface:    #171717;
  --bg-surface2:   #1F1F1F;
  --bg-surface3:   #282828;
  --bg-input:      #222222;
  --text-primary:  #F0EDE4;
  --text-muted:    #908878;
  --text-dim:      #555555;
  --border:        rgba(255,255,255,0.08);
  --border2:       rgba(255,255,255,0.14);
}

[data-theme="light"] {
  --bg-base:       #F5F3EF;
  --bg-surface:    #FFFFFF;
  --bg-surface2:   #F0EDE8;
  --bg-surface3:   #E8E4DE;
  --bg-input:      #FFFFFF;
  --text-primary:  #1A1814;
  --text-muted:    #7A6E62;
  --text-dim:      #AAAAAA;
  --border:        rgba(0,0,0,0.08);
  --border2:       rgba(0,0,0,0.14);
}

/* Shared — both themes */
:root {
  --accent:        #C9A435;
  --accent-dim:    rgba(201,164,53,0.15);
  --accent-border: rgba(201,164,53,0.35);
  --green:         #27A560;
  --green-dim:     rgba(39,165,96,0.15);
  --red:           #C0392B;
  --red-dim:       rgba(192,57,43,0.15);
  --amber:         #D4820A;
  --amber-dim:     rgba(212,130,10,0.15);
  --blue:          #2E7FD4;
  --blue-dim:      rgba(46,127,212,0.15);
  --sp:            40px; /* standard section padding */
}
```

## Typography
```css
:root {
  --font-condensed: 'Barlow Condensed', sans-serif; /* headings, numbers, labels */
  --font-body:      'Barlow', sans-serif;            /* body text, inputs */
}
/* Weights: 400 regular, 700 bold, 800/900 display only */
```

## Color meaning (always consistent)
- `--accent` gold → primary actions, CTAs, active nav
- `--green` → present / success / improving
- `--red` → absent / danger / error
- `--amber` → injured/sick / warning / monitor
- `--blue` → excused / info / tournament events

## Attendance % colour coding (always use this)
- ≥80% → `--green`
- 60–79% → `--amber`
- <60% → `--red`
- No data → `--text-dim`

## Always show as: `88% att.` — never a bare number

## Event type colours (always consistent)
- Training → `--accent` gold
- Match → `--red`
- Tournament → `--blue`
- Measurement day → `--green`

## Component patterns

### Card
```css
.card {
  background: var(--bg-surface);
  border: 0.5px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
```

### Button primary
```css
.btn-primary {
  background: var(--accent);
  color: #0C0C0C;
  border: none;
  border-radius: 6px;
  padding: 10px 22px;
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  min-height: 44px;
}
```

### Tag / badge
```css
.tag { font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 3px; }
.tag-green { background: var(--green-dim); color: var(--green); }
.tag-red   { background: var(--red-dim);   color: var(--red);   }
.tag-amber { background: var(--amber-dim); color: var(--amber); }
.tag-blue  { background: var(--blue-dim);  color: var(--blue);  }
.tag-gold  { background: var(--accent-dim);color: var(--accent);}
```

### Avatar
```css
.avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-surface3);
  color: var(--text-muted);
  font-family: var(--font-condensed);
  font-weight: 700; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
```

## Layout
- Desktop: sidebar (200px fixed) + main content area (scrollable)
- Mobile (≤768px): sidebar collapses to bottom tab bar
- Touch targets: minimum 44px — non-negotiable
- Max content width: 1200px centered on large screens

## Sidebar active state
```css
.nav-item.active {
  background: var(--accent-dim);
  color: var(--accent);
  border-right: 2px solid var(--accent);
}
```

## Player/parent home — content priority order
1. Next session hero card (full width, gold border, prominent)
2. Upcoming tournament (if within 30 days)
3. Attendance ratio with session count
4. Development snapshot grid (metric cards with deltas)
5. Latest measurements with trend
Everything above the fold on mobile — no tapping required.

## Screenshot verification checklist
After any UI change verify:
- [ ] Dark theme renders correctly
- [ ] Light theme renders correctly
- [ ] Mobile 375px viewport correct
- [ ] Empty states display
- [ ] Loading states display
- [ ] Touch targets ≥44px
