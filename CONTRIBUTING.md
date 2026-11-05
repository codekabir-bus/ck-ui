# Contributing to CK-UI

Thanks for helping improve CK-UI. Bug reports, accessibility findings, documentation fixes and suggestions are all
welcome.

## How this repository works

The component folders and styles are a mirror of CK-UI's public registry (`https://www.ck-ui.com/r`). That registry
is also what the [CLI](https://www.npmjs.com/package/ck-ui-cli) installs from.
[`scripts/sync-registry.mjs`](scripts/sync-registry.mjs) generates these from the registry:

- `components/next-tailwind-v4`, `components/vite-tailwind-v4` and `components/next-tailwind-v3`;
- `components/index.json`;
- `styles/`;
- the component list in the README.

A change to a component is applied to CK-UI's source and published through the registry. The three folders are then
regenerated, so the website, the CLI and this repository stay identical.

## Reporting a bug

[Open an issue](../../issues/new/choose) with:

- the component and what you expected to happen;
- what happened instead, with steps to reproduce (a small code sample helps);
- your setup: Next.js or Vite, Tailwind CSS version, React version, browser;
- whether you installed with the CLI or copied the files.

Please search existing issues first. For security problems, follow [SECURITY.md](SECURITY.md) instead of opening a
public issue.

## Proposing a change

1. For anything beyond a small fix, open an issue first so we can agree on the approach.
2. Make the change in `components/next-tailwind-v4/<Component>.tsx`. Describe in the pull request how the other two
   folders are affected, if at all. The Vite folder replaces `next/link` and `process.env`; the Tailwind CSS v3 folder
   uses v3 class names.
3. Check it in one of the [examples](examples) (`npm install && npm run dev`). Also test it with the keyboard, in
   light and dark mode, and at a narrow width (320 px).
4. Open a pull request that explains the problem and the fix.

Maintainers port accepted changes to CK-UI's source and to every supported setup, then regenerate the folders. Your
pull request may therefore be closed as "applied upstream" rather than merged directly; you'll be credited in the
changelog.

## Guidelines

- **Accessibility first:** keyboard support, correct roles and labels, visible focus, and text contrast of at least
  4.5:1 in both themes.
- **Use the design tokens** (`bg-primary`, `text-foreground`, `ck-dark:` …) rather than fixed colours.
- **Keep the API stable:** components are namespaces of parts (`Button.Root`, `Modal.Content`); don't rename or
  remove existing parts or props.
- **No new npm dependencies** without discussing them first.
- **TypeScript:** no `any` in public props; the files must type-check in a strict project.

## Checking the repository

```bash
node scripts/sync-registry.mjs --check   # the folders and styles match the registry
```

Node.js 18.17 or later; the script has no dependencies.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE) of this repository.
