---
description: Pre-delivery UI/UX checklist — verify before shipping
---
Review the current UI code against this checklist. For each item, check the actual code and report pass/fail with specific file:line references.

**Visual Quality**
- [ ] No emojis used as icons (use SVG: Heroicons/Lucide)
- [ ] All icons from consistent icon set
- [ ] Hover states don't cause layout shift
- [ ] Brand logos verified (Simple Icons)

**Interaction**
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide visual feedback
- [ ] Transitions are 150-300ms
- [ ] Focus states visible for keyboard navigation

**Contrast & Color**
- [ ] Light mode text contrast 4.5:1 minimum
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes

**Layout**
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

**Accessibility**
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected
