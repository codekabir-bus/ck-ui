# CK-UI

Accessible React and TypeScript components built with Tailwind CSS. You copy them into your project as source files
you own, then change them as you like. They work with Next.js and React + Vite.

[Website](https://www.ck-ui.com) · [Documentation](https://www.ck-ui.com/docs/getting-started/introduction) ·
[Installation guide](https://www.ck-ui.com/docs/getting-started/installation) ·
[CLI on npm](https://www.npmjs.com/package/ck-ui-cli) · [Changelog](CHANGELOG.md)

This repository contains CK-UI's **54 free components**, exactly as the
[CK-UI CLI](https://www.npmjs.com/package/ck-ui-cli) installs them from the public registry
(`https://www.ck-ui.com/r`), plus the design tokens they need. Each supported setup has its own folder. There are
also runnable examples.

## Requirements

| Project | Tailwind CSS | Folder | Status |
| --- | --- | --- | --- |
| Next.js (App Router), TypeScript | v4 | `components/next-tailwind-v4` | Supported |
| React + Vite, TypeScript | v4 | `components/vite-tailwind-v4` | Supported |
| Next.js (App Router), TypeScript | v3.4.1 or later | `components/next-tailwind-v3` | Supported |
| React + Vite, TypeScript | v3 | — | Not supported (upgrade with `npx @tailwindcss/upgrade`) |

React 18 or later. The CLI needs Node.js 18.17 or later.

## Quick start with the CLI

The CLI is the recommended way to add components. It copies each component and the CK-UI components it uses, and it
installs their npm packages. It also adds the design tokens to your stylesheet. Your edits are kept when you update.

```bash
npx ck-ui-cli@latest init                # design tokens, dark mode and the cn() helper
npx ck-ui-cli@latest add button          # one component
npx ck-ui-cli@latest add input modal     # several at once
npx ck-ui-cli@latest list                # every component you can add
npx ck-ui-cli@latest doctor              # check the setup
```

Components go to `src/components/ck-ui` (or `components/ck-ui` without a `src` folder). `dialog` is an alias of
`modal`. The [installation guide](https://www.ck-ui.com/docs/getting-started/installation) covers every option.

## Manual installation (copy from this repository)

The component folders are self-contained. Components import each other from the same folder and the `cn()` helper
from `lib/utils.ts`, so you don't need a path alias.

### Next.js or React + Vite with Tailwind CSS v4

1. Copy `components/next-tailwind-v4` (Next.js) or `components/vite-tailwind-v4` (Vite) into your project, for
   example as `src/components/ck-ui`. You can copy only the files you need. For each one, also copy the files listed
   in its `registryDependencies` in [`components/index.json`](components/index.json), and `lib/utils.ts`.
2. Install the helper packages:

   ```bash
   npm install clsx tailwind-merge@^3
   npm install -D tw-animate-css
   ```

3. Install the npm packages of the components you copied (see the tables below, or the full command after them).
4. In the stylesheet that loads Tailwind CSS (for example `app/globals.css` or `src/index.css`):
   - add `@import "tw-animate-css";` after `@import "tailwindcss";`;
   - paste the contents of [`styles/tailwind-v4.css`](styles/tailwind-v4.css) below the imports.

   Keep the `ck-ui:start` and `ck-ui:end` markers: `npx ck-ui-cli init` recognises and updates this block.

### Next.js with Tailwind CSS v3

1. Copy `components/next-tailwind-v3` into your project, for example as `components/ck-ui`.
2. Install the helper packages:

   ```bash
   npm install clsx tailwind-merge@^2
   npm install -D tailwindcss-animate @tailwindcss/forms
   ```

3. Install the npm packages of the components you copied.
4. Paste [`styles/tailwind-v3.css`](styles/tailwind-v3.css) into your global stylesheet, after `@tailwind utilities;`.
5. Copy [`styles/ck-ui.tailwind-preset.js`](styles/ck-ui.tailwind-preset.js) next to your `tailwind.config` and add it
   as a preset. Make sure the `content` globs include the component folder:

   ```ts
   import type { Config } from "tailwindcss";
   import ckUiPreset from "./ck-ui.tailwind-preset.js";

   export default {
       presets: [ckUiPreset],
       content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
   } satisfies Config;
   ```

## Usage

Each component file exports a namespace of parts:

```tsx
import * as Button from "@/components/ck-ui/Button";
import * as Input from "@/components/ck-ui/Input";
import * as Modal from "@/components/ck-ui/Modal";

export function Example() {
    return (
        <Modal.Root>
            <Modal.Trigger asChild>
                <Button.Root>Invite</Button.Root>
            </Modal.Trigger>
            <Modal.Content>
                <Modal.Header>
                    <Modal.Title>Invite a teammate</Modal.Title>
                    <Modal.Description>They'll get an email with a link.</Modal.Description>
                </Modal.Header>
                <Modal.Body>
                    <Input.Root>
                        <Input.Wrapper>
                            <Input.Input type="email" placeholder="name@example.com" aria-label="Email" />
                        </Input.Wrapper>
                    </Input.Root>
                </Modal.Body>
                <Modal.Footer>
                    <Modal.Close asChild>
                        <Button.Root variant="stroke" color="neutral">Cancel</Button.Root>
                    </Modal.Close>
                    <Button.Root>Send invite</Button.Root>
                </Modal.Footer>
            </Modal.Content>
        </Modal.Root>
    );
}
```

Each component's documentation page shows its parts, props and examples. The [examples](examples) folder has
complete apps.

**Dark mode** follows a `dark` class on `<html>` or any ancestor, as with `next-themes` (`attribute="class"`). CK-UI's
components use their own `ck-dark:` variant, so your project's `dark:` classes keep their meaning.
`ThemeScope.Root theme="light" | "dark"` switches a subtree.

**React + Vite:** components that render links (Button, LinkButton, NavsVertical with `href`) use a plain `<a>`
instead of Next.js' `<Link>`. For client-side routing, render your router's link through `asChild`. Vite's starter
`src/index.css` styles `button` and `a` directly. With Tailwind CSS v4 those rules override utility classes, so remove
them (Tailwind's reset replaces them).

**Tailwind CSS v4:** utilities that v4 renamed use their v4 names with the same look (for example `shadow-sm` →
`shadow-xs`). Buttons show the default cursor, which is Tailwind v4's choice. To restore the pointer, add
`@layer base { button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer; } }`.

**Next.js 16 with Cache Components** (`cacheComponents: true`, which create-next-app enables by default): Calendar and
Date Picker read today's date. Render them inside a `<Suspense>` boundary, or `next build` stops with "Next.js
encountered the unstable value `new Date()` in a Client Component":

```tsx
import { Suspense } from "react";
import { BookingForm } from "./booking-form"; // a client component that renders Calendar or Date Picker

export default function Page() {
    return (
        <Suspense fallback={null}>
            <BookingForm />
        </Suspense>
    );
}
```

## Components

<!-- components:start (generated by scripts/sync-registry.mjs) -->
**54 components.** `Table.tsx` and `ThemeScope.tsx` are installed with the components that use them.

### Components

| Component | Add with the CLI | File | npm packages |
| --- | --- | --- | --- |
| [Accordion](https://www.ck-ui.com/docs/components/accordion) | `npx ck-ui-cli@latest add accordion` | `Accordion.tsx` | `@radix-ui/react-accordion`, `react-icons` |
| [Avatar](https://www.ck-ui.com/docs/components/avatar) | `npx ck-ui-cli@latest add avatar` | `Avatar.tsx` | `@radix-ui/react-avatar` |
| [Badge](https://www.ck-ui.com/docs/components/badge) | `npx ck-ui-cli@latest add badge` | `Badge.tsx` | `@radix-ui/react-slot` |
| [Button](https://www.ck-ui.com/docs/components/button) | `npx ck-ui-cli@latest add button` | `Button.tsx` | `@radix-ui/react-slot`, `class-variance-authority` |
| [Button Group](https://www.ck-ui.com/docs/components/button-group) | `npx ck-ui-cli@latest add button-group` | `ButtonGroup.tsx` | `@radix-ui/react-slot` |
| [Card](https://www.ck-ui.com/docs/components/card) | `npx ck-ui-cli@latest add card` | `card.tsx` | `@radix-ui/react-slot`, `class-variance-authority` |
| [Divider](https://www.ck-ui.com/docs/components/divider) | `npx ck-ui-cli@latest add divider` | `Divider.tsx` | none |
| [Icon](https://www.ck-ui.com/docs/components/icon) | `npx ck-ui-cli@latest add icon` | `Icon.tsx` | `@radix-ui/react-slot` |
| [Legend Indicator](https://www.ck-ui.com/docs/components/legend-indicator) | `npx ck-ui-cli@latest add legend-indicator` | `LegendIndicator.tsx` | `@radix-ui/react-slot` |
| [Link Button](https://www.ck-ui.com/docs/components/link-button) | `npx ck-ui-cli@latest add link-button` | `LinkButton.tsx` | `@radix-ui/react-slot`, `class-variance-authority` |
| [Segmented Control](https://www.ck-ui.com/docs/components/segmented-control) | `npx ck-ui-cli@latest add segmented-control` | `SegmentedControl.tsx` | `@radix-ui/react-tabs` |
| [Tag](https://www.ck-ui.com/docs/components/tag) | `npx ck-ui-cli@latest add tag` | `Tag.tsx` | `@radix-ui/react-slot`, `class-variance-authority`, `react-icons` |

### Actions

| Component | Add with the CLI | File | npm packages |
| --- | --- | --- | --- |
| [Command](https://www.ck-ui.com/docs/actions/command) | `npx ck-ui-cli@latest add command` | `Command.tsx` | `cmdk`, `react-icons` |
| [Toggle](https://www.ck-ui.com/docs/actions/toggle) | `npx ck-ui-cli@latest add toggle` | `Toggle.tsx` | `@radix-ui/react-toggle`, `class-variance-authority` |
| [Toggle Group](https://www.ck-ui.com/docs/actions/toggle-group) | `npx ck-ui-cli@latest add toggle-group` | `ToggleGroup.tsx` | `@radix-ui/react-toggle-group` |

### Feedback

| Component | Add with the CLI | File | npm packages |
| --- | --- | --- | --- |
| [Alert](https://www.ck-ui.com/docs/feedback/alert) | `npx ck-ui-cli@latest add alert` | `Alert.tsx` | `@radix-ui/react-slot`, `react-icons` |
| [Alert Dialog](https://www.ck-ui.com/docs/feedback/alert-dialog) | `npx ck-ui-cli@latest add alert-dialog` | `AlertDialog.tsx` | `@radix-ui/react-dialog` |
| [Toast](https://www.ck-ui.com/docs/feedback/toast) | `npx ck-ui-cli@latest add toast` | `Toast.tsx` | `react-icons` |

### Data Display

| Component | Add with the CLI | File | npm packages |
| --- | --- | --- | --- |
| [Calendar](https://www.ck-ui.com/docs/data-display/calendar) | `npx ck-ui-cli@latest add calendar` | `Calendar.tsx` | `react-day-picker`, `react-icons` |
| [Data Table](https://www.ck-ui.com/docs/data-display/data-table) | `npx ck-ui-cli@latest add data-table` | `DataTable.tsx` | none |
| [Progress](https://www.ck-ui.com/docs/data-display/progress) | `npx ck-ui-cli@latest add progress` | `Progress.tsx` | none |
| [Skeleton](https://www.ck-ui.com/docs/data-display/skeleton) | `npx ck-ui-cli@latest add skeleton` | `Skeleton.tsx` | none |

### Tabs

| Component | Add with the CLI | File | npm packages |
| --- | --- | --- | --- |
| [Tabs Horizontal](https://www.ck-ui.com/docs/tabs/horizontal) | `npx ck-ui-cli@latest add tabs-horizontal` | `TabsHorizontal.tsx` | `@radix-ui/react-tabs`, `merge-refs`, `react-icons` |
| [Tabs Vertical](https://www.ck-ui.com/docs/tabs/vertical) | `npx ck-ui-cli@latest add tabs-vertical` | `TabsVertical.tsx` | `@radix-ui/react-tabs`, `react-icons` |

### Navigation

| Component | Add with the CLI | File | npm packages |
| --- | --- | --- | --- |
| [Breadcrumb](https://www.ck-ui.com/docs/navigations/breadcrumb) | `npx ck-ui-cli@latest add breadcrumb` | `Breadcrumb.tsx` | `@radix-ui/react-slot`, `react-icons` |
| [Navbar](https://www.ck-ui.com/docs/navigations/navbar) | `npx ck-ui-cli@latest add navbar` | `Navbar.tsx` | `@radix-ui/react-slot` |
| [Navigation Menu](https://www.ck-ui.com/docs/navigations/navigation-menu) | `npx ck-ui-cli@latest add navigation-menu` | `NavigationMenu.tsx` | `@radix-ui/react-navigation-menu`, `react-icons` |
| [Navs Horizontal](https://www.ck-ui.com/docs/navigations/navs-horizontal) | `npx ck-ui-cli@latest add navs-horizontal` | `NavsHorizontal.tsx` | `@radix-ui/react-slot`, `react-icons` |
| [Navs Vertical](https://www.ck-ui.com/docs/navigations/navs-vertical) | `npx ck-ui-cli@latest add navs-vertical` | `NavsVertical.tsx` | `react-icons` |
| [Pagination](https://www.ck-ui.com/docs/navigations/pagination) | `npx ck-ui-cli@latest add pagination` | `Pagination.tsx` | `@radix-ui/react-slot`, `react-icons` |

### Forms

| Component | Add with the CLI | File | npm packages |
| --- | --- | --- | --- |
| [Checkbox](https://www.ck-ui.com/docs/forms/checkbox) | `npx ck-ui-cli@latest add checkbox` | `Checkbox.tsx` | `@radix-ui/react-checkbox` |
| [Checkbox Group](https://www.ck-ui.com/docs/forms/checkbox-group) | `npx ck-ui-cli@latest add checkbox-group` | `CheckboxGroup.tsx` | none |
| [Combobox](https://www.ck-ui.com/docs/forms/combobox) | `npx ck-ui-cli@latest add combobox` | `Combobox.tsx` | `react-icons` |
| [Date Picker](https://www.ck-ui.com/docs/forms/date-picker) | `npx ck-ui-cli@latest add date-picker` | `DatePicker.tsx` | `react-day-picker`, `react-icons` |
| [Field](https://www.ck-ui.com/docs/forms/field) | `npx ck-ui-cli@latest add field` | `Field.tsx` | `@radix-ui/react-slot` |
| [Fieldset](https://www.ck-ui.com/docs/forms/fieldset) | `npx ck-ui-cli@latest add fieldset` | `Fieldset.tsx` | none |
| [File Upload](https://www.ck-ui.com/docs/forms/file-upload) | `npx ck-ui-cli@latest add file-upload` | `FileUpload.tsx` | `react-icons` |
| [Hint](https://www.ck-ui.com/docs/forms/hint) | `npx ck-ui-cli@latest add hint` | `Hint.tsx` | `react-icons` |
| [Label](https://www.ck-ui.com/docs/forms/label) | `npx ck-ui-cli@latest add label` | `Label.tsx` | `@radix-ui/react-label` |
| [Number Input](https://www.ck-ui.com/docs/forms/number-input) | `npx ck-ui-cli@latest add number-input` | `NumberInput.tsx` | `react-icons` |
| [OTP Input](https://www.ck-ui.com/docs/forms/otp-input) | `npx ck-ui-cli@latest add otp-input` | `OTPInput.tsx` | none |
| [Password Input](https://www.ck-ui.com/docs/forms/password-input) | `npx ck-ui-cli@latest add password-input` | `PasswordInput.tsx` | `react-icons` |
| [Radio](https://www.ck-ui.com/docs/forms/radio) | `npx ck-ui-cli@latest add radio` | `Radio.tsx` | `@radix-ui/react-radio-group` |
| [Select](https://www.ck-ui.com/docs/forms/select) | `npx ck-ui-cli@latest add select` | `Select.tsx` | `@radix-ui/react-select`, `class-variance-authority`, `react-icons` |
| [Slider](https://www.ck-ui.com/docs/forms/slider) | `npx ck-ui-cli@latest add slider` | `Slider.tsx` | `@radix-ui/react-slider` |
| [Switch](https://www.ck-ui.com/docs/forms/switch) | `npx ck-ui-cli@latest add switch` | `Switch.tsx` | `@radix-ui/react-switch` |
| [Text Area](https://www.ck-ui.com/docs/forms/textarea) | `npx ck-ui-cli@latest add textarea` | `Textarea.tsx` | none |
| [Text Input](https://www.ck-ui.com/docs/forms/input) | `npx ck-ui-cli@latest add input` | `Input.tsx` | `@radix-ui/react-slot` |

### Disclosure

| Component | Add with the CLI | File | npm packages |
| --- | --- | --- | --- |
| [Collapsible](https://www.ck-ui.com/docs/disclosure/collapsible) | `npx ck-ui-cli@latest add collapsible` | `Collapsible.tsx` | `@radix-ui/react-slot` |

### Overlays

| Component | Add with the CLI | File | npm packages |
| --- | --- | --- | --- |
| [Drawer](https://www.ck-ui.com/docs/overlays/drawer) | `npx ck-ui-cli@latest add drawer` | `Drawer.tsx` | `@radix-ui/react-dialog`, `react-icons` |
| [Dropdown](https://www.ck-ui.com/docs/overlays/dropdown) | `npx ck-ui-cli@latest add dropdown` | `Dropdown.tsx` | `@radix-ui/react-dropdown-menu`, `framer-motion`, `react-icons` |
| [Modal](https://www.ck-ui.com/docs/overlays/modal) | `npx ck-ui-cli@latest add modal` | `Modal.tsx` | `@radix-ui/react-dialog`, `framer-motion`, `react-icons` |
| [Popover](https://www.ck-ui.com/docs/overlays/popover) | `npx ck-ui-cli@latest add popover` | `Popover.tsx` | `@radix-ui/react-popover`, `@radix-ui/react-slot` |
| [Tooltip](https://www.ck-ui.com/docs/overlays/tooltip) | `npx ck-ui-cli@latest add tooltip` | `Tooltip.tsx` | `@radix-ui/react-slot`, `@radix-ui/react-tooltip` |

<!-- components:end -->

## Examples

| Example | Stack | Run it |
| --- | --- | --- |
| [`examples/nextjs`](examples/nextjs) | Next.js (App Router), Tailwind CSS v4, `next-themes` | `cd examples/nextjs && npm install && npm run dev` |
| [`examples/vite`](examples/vite) | React + Vite, Tailwind CSS v4 | `cd examples/vite && npm install && npm run dev` |

Both were set up with `npx ck-ui-cli init` and `npx ck-ui-cli add`, so they show what the CLI writes into a project
(`ck-ui.json`, the stylesheet block, and the component folder).

## Repository structure

```text
.
├── components/
│   ├── index.json            every component: file, docs, npm packages, CK-UI components it uses
│   ├── next-tailwind-v4/     Next.js + Tailwind CSS v4: 56 component files and lib/utils.ts
│   ├── vite-tailwind-v4/     React + Vite + Tailwind CSS v4
│   └── next-tailwind-v3/     Next.js + Tailwind CSS v3
├── styles/
│   ├── tailwind-v4.css       design tokens, dark mode variant and utilities for Tailwind CSS v4
│   ├── tailwind-v3.css       design tokens for Tailwind CSS v3
│   └── ck-ui.tailwind-preset.js   Tailwind CSS v3 preset (theme, plugins)
├── examples/
│   ├── nextjs/               Next.js example app
│   └── vite/                 React + Vite example app
└── scripts/
    └── sync-registry.mjs     regenerates or checks components/ and styles/ against the registry
```

The three component folders differ only where a setup needs it. The Vite versions use `<a>` instead of `next/link`
and `import.meta.env` instead of `process.env`. The Tailwind CSS v3 versions use v3 class names.

## Updating

With the CLI, run `npx ck-ui-cli@latest add <component…>` again. Files you haven't changed are updated. Files you
edited are kept unless you confirm or pass `--overwrite`, which also keeps a `.ck-ui-backup` copy. Run
`npx ck-ui-cli@latest init` to update the design tokens. Release notes are in the [changelog](CHANGELOG.md).

This repository mirrors the public registry. `node scripts/sync-registry.mjs --check` reports any difference, and
`node scripts/sync-registry.mjs` updates the folders, styles and the component list above.

## Contributing

Bug reports and suggestions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). For security issues, see
[SECURITY.md](SECURITY.md).

## License

The components, styles, examples and scripts in this repository are licensed under the [MIT License](LICENSE). The
npm packages they use are licensed by their authors. Premium CK-UI blocks and templates aren't part of this
repository.
