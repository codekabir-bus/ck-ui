import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
    title: "CK-UI · Next.js example",
    description: "CK-UI components in a Next.js app with Tailwind CSS v4.",
    // No favicon in this example; an empty icon keeps the browser from requesting /favicon.ico.
    icons: { icon: "data:," },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-background text-foreground antialiased">
                {/* CK-UI's components follow the "dark" class that next-themes sets on <html>. */}
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
