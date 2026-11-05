# CK-UI · React + Vite example

A React + Vite app with Tailwind CSS v4. It uses CK-UI's Button, Badge, Input, Field, Checkbox, Switch, Select, Modal,
Tooltip, Toast and ThemeScope, with a light and dark mode toggle.

## Run it

```bash
npm install
npm run dev
```

Then open the address Vite prints (http://localhost:5173 by default).

## How it was set up

```bash
npm create vite@latest vite -- --template react-ts
cd vite
npm install
npm install -D tailwindcss @tailwindcss/vite
```

Next, `vite.config.ts` got the `tailwindcss()` plugin and `src/index.css` became `@import "tailwindcss";`. The
starter's styles for `button` and `a` were removed, because they would override utility classes. Then:

```bash
npx ck-ui-cli@latest init
npx ck-ui-cli@latest add button badge input checkbox switch select modal tooltip toast theme-scope
```

| File | What it is |
| --- | --- |
| `src/index.css` | The CK-UI block that `init` added: design tokens, the `ck-dark:` variant and utilities |
| `src/components/ck-ui/` | The components, Vite versions (links are plain `<a>` elements). `add` also installed Field and Label. |
| `ck-ui.json` | Where CK-UI lives in the project, plus a checksum of each file so the CLI can update the ones you haven't edited |
| `index.html` | Applies the saved or system theme before the first paint |
| `src/App.tsx` | The page and the theme toggle |
