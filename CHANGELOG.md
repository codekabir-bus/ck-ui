# Changelog

Notable changes to CK-UI's free components. The same release notes are on the
[website](https://www.ck-ui.com/docs/getting-started/changelog).

## 2026-11-05 — Calendar and Button Group compatibility fixes

### Fixed

- **Calendar** (and **Date Picker**, which uses it): removed an unused import. `npm run build` now passes in React +
  Vite projects whose TypeScript settings report unused variables, as Vite's starter does with `noUnusedLocals`.
- **Button Group:** reworded a code comment. Tailwind CSS v3 had turned it into two invalid CSS rules, which stopped
  Next.js 16 (Turbopack) builds.

Neither change affects how the components behave or look.

### Documented

- **Next.js 16 with Cache Components:** render Calendar and Date Picker inside a `<Suspense>` boundary (see the
  README).

### Updating an existing project

```bash
npx ck-ui-cli@latest add calendar button-group
```

Files you haven't changed are updated. Edited files are kept unless you confirm or pass `--overwrite`, which keeps a
`.ck-ui-backup` copy.

## 2026-11-05 — Public repository

- This repository publishes the 54 free components as the registry serves them, in three folders:
  - Next.js with Tailwind CSS v4;
  - React + Vite with Tailwind CSS v4;
  - Next.js with Tailwind CSS v3.
- It also has the design tokens for both Tailwind versions, two example apps, and a script that checks the folders
  against the registry.

## 2026-11-04 — Accessibility update

### Fixed

- **Button:** the success colour is green-700, so its white text reaches 5.02:1 (it was 2.28:1 on green-500). On hover
  it reaches 7.13:1. The colour comes from the `--success` design token.
- **Badge:** every colour reaches 4.5:1 in both themes. In light mode, lighter and stroke badges use the -700 text
  shades, and filled badges use the lightest shade that passes with white text. Dark mode, sizes and the API are
  unchanged.
- **Link Button** (success and destructive) and **Hint** (warning) use the high-contrast `-strong` text colours.
- **Command:** its decorative separator is hidden from assistive technology, since a listbox may contain only
  options and groups.

### Updating an existing project

New installations get the corrected components and colours. Existing projects keep their current files until you
update them:

```bash
npx ck-ui-cli@latest add badge link-button hint command
npx ck-ui-cli@latest init
```

The first command updates those components and adds any of them the project doesn't have yet. The second updates the
colour tokens. Files you edited are kept: in a terminal the CLI asks before replacing them, and `--overwrite` replaces
them while keeping a `.ck-ui-backup` copy of each. ck-ui-cli 0.1.0 installs the updated files; no new CLI version is
needed.

## 2026-10-31 — CLI 0.1.0

First release of the CK-UI CLI ([`ck-ui-cli`](https://www.npmjs.com/package/ck-ui-cli) on npm). It sets up a project
and adds CK-UI components to it as source files.

- `init` adds the design tokens, utilities and dark mode to your stylesheet, and the `cn()` helper to your project.
- `add` copies components, and the CK-UI components they use, into your project and installs their npm packages.
- `list` shows the components you can add, and `doctor` checks a project's setup.
- Supported setups: Next.js with Tailwind CSS v3.4.1 or later, or v4; React + Vite with Tailwind CSS v4.
