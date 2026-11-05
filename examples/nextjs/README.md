# CK-UI · Next.js example

A Next.js (App Router) app with Tailwind CSS v4. It uses CK-UI's Button, Badge, Input, Field, Checkbox, Switch, Select,
Modal, Tooltip, Toast and ThemeScope, with light and dark mode from `next-themes`.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## How it was set up

```bash
npx create-next-app@latest nextjs --ts --app --tailwind --no-src-dir --empty
cd nextjs
npm install next-themes
npx ck-ui-cli@latest init
npx ck-ui-cli@latest add button badge input checkbox switch select modal tooltip toast theme-scope
```

| File | What it is |
| --- | --- |
| `app/globals.css` | The CK-UI block that `init` added: design tokens, the `ck-dark:` variant and utilities |
| `components/ck-ui/` | The components. `add` also installed Field and Label, which the form controls use. |
| `ck-ui.json` | Where CK-UI lives in the project, plus a checksum of each file so the CLI can update the ones you haven't edited |
| `app/layout.tsx` | `ThemeProvider` from `next-themes` sets the `dark` class on `<html>` |
| `app/showcase.tsx` | The page |
