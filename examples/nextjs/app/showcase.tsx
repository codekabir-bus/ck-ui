"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import * as Badge from "@/components/ck-ui/Badge";
import * as Button from "@/components/ck-ui/Button";
import * as Checkbox from "@/components/ck-ui/Checkbox";
import * as Field from "@/components/ck-ui/Field";
import * as Input from "@/components/ck-ui/Input";
import * as Modal from "@/components/ck-ui/Modal";
import * as Select from "@/components/ck-ui/Select";
import * as Switch from "@/components/ck-ui/Switch";
import * as ThemeScope from "@/components/ck-ui/ThemeScope";
import { Toaster, toast } from "@/components/ck-ui/Toast";
import * as Tooltip from "@/components/ck-ui/Tooltip";

function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    // The theme is known only in the browser, so the label is rendered after mounting.
    const mounted = React.useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
    const dark = mounted && resolvedTheme === "dark";
    return (
        <Button.Root variant="stroke" color="neutral" onClick={() => setTheme(dark ? "light" : "dark")}>
            {dark ? "Light mode" : "Dark mode"}
        </Button.Root>
    );
}

function InviteDialog() {
    return (
        <Modal.Root>
            <Modal.Trigger asChild>
                <Button.Root>Invite</Button.Root>
            </Modal.Trigger>
            <Modal.Content>
                <Modal.Header>
                    <Modal.Title>Invite a teammate</Modal.Title>
                    <Modal.Description>They&apos;ll get an email with a link.</Modal.Description>
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
                        <Button.Root variant="stroke" color="neutral">
                            Cancel
                        </Button.Root>
                    </Modal.Close>
                    <Button.Root>Send invite</Button.Root>
                </Modal.Footer>
            </Modal.Content>
        </Modal.Root>
    );
}

export function Showcase() {
    return (
        <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="size-h4 text-foreground">CK-UI with Next.js</h1>
                    <p className="size-p-sm text-muted-foreground">Tailwind CSS v4, set up with ck-ui-cli.</p>
                </div>
                <ThemeToggle />
            </header>

            <section aria-labelledby="actions" className="flex flex-col gap-4">
                <h2 id="actions" className="size-label-md text-foreground">
                    Buttons and badges
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                    <Button.Root>Save</Button.Root>
                    <Button.Root variant="stroke" color="neutral">
                        Cancel
                    </Button.Root>
                    <Button.Root variant="lighter" color="destructive">
                        Delete
                    </Button.Root>
                    <Button.Root variant="ghost" color="neutral" href="https://www.ck-ui.com/docs/getting-started/introduction">
                        Documentation
                    </Button.Root>
                    <Badge.Root>New</Badge.Root>
                    <Badge.Root color="green" variant="lighter">
                        Paid
                    </Badge.Root>
                </div>
            </section>

            <section aria-labelledby="form" className="flex flex-col gap-4">
                <h2 id="form" className="size-label-md text-foreground">
                    Form fields
                </h2>
                <form
                    className="flex max-w-md flex-col gap-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        toast({ title: "Settings saved", color: "success" });
                    }}
                >
                    <Field.Root>
                        <Field.Label>Email</Field.Label>
                        <Input.Root>
                            <Input.Wrapper>
                                <Input.Input type="email" name="email" placeholder="you@example.com" />
                            </Input.Wrapper>
                        </Input.Root>
                        <Field.Description>Used only for account updates.</Field.Description>
                    </Field.Root>
                    <Field.Root>
                        <Field.Label>Plan</Field.Label>
                        <Select.Root name="plan" defaultValue="free">
                            <Select.Trigger>
                                <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value="free">Free</Select.Item>
                                <Select.Item value="team">Team</Select.Item>
                                <Select.Item value="enterprise">Enterprise</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Field.Root>
                    <Field.Root className="flex-row items-center gap-2">
                        <Checkbox.Root name="updates" />
                        <Field.Label>Email me about new components</Field.Label>
                    </Field.Root>
                    <Field.Root className="flex-row items-center gap-2">
                        <Switch.Root name="compact" />
                        <Field.Label>Compact layout</Field.Label>
                    </Field.Root>
                    <Button.Root type="submit" className="self-start">
                        Save settings
                    </Button.Root>
                </form>
            </section>

            <section aria-labelledby="overlays" className="flex flex-col gap-4">
                <h2 id="overlays" className="size-label-md text-foreground">
                    Dialog, tooltip and toast
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                    <InviteDialog />
                    <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                            <Button.Root variant="stroke" color="neutral">
                                Hover or focus me
                            </Button.Root>
                        </Tooltip.Trigger>
                        <Tooltip.Content>Tooltips open on hover and keyboard focus.</Tooltip.Content>
                    </Tooltip.Root>
                    <Button.Root variant="stroke" color="neutral" onClick={() => toast({ title: "Copied", description: "The link is on your clipboard." })}>
                        Show a toast
                    </Button.Root>
                </div>
            </section>

            <section aria-labelledby="scope" className="flex flex-col gap-4">
                <h2 id="scope" className="size-label-md text-foreground">
                    Theme scope
                </h2>
                <ThemeScope.Root theme="dark" className="flex flex-wrap items-center gap-3 rounded-2xl bg-background p-4 text-foreground">
                    <span className="size-p-sm">This panel is always dark.</span>
                    <Button.Root variant="stroke" color="neutral">
                        Button
                    </Button.Root>
                    <Badge.Root>Badge</Badge.Root>
                </ThemeScope.Root>
            </section>

            <Toaster />
        </main>
    );
}
