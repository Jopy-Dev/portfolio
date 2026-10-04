import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MotionLifecycleProvider } from "@/components/motion/motion-lifecycle-provider";
import { PageTransition } from "@/components/motion/page-transition";
import { SITE_ORIGIN } from "@/lib/site";
import "./globals.css";

const SITE_TITLE = "Mark Jommer | Full-stack TypeScript Engineer";
const SITE_DESCRIPTION =
  "Full-stack engineer in Metro Manila (GMT+8) shipping secure TypeScript web apps with React, Next.js, Node.js, and PostgreSQL. Open to global remote work.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  icons: { icon: "data:," },
  openGraph: {
    type: "website",
    url: SITE_ORIGIN,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Jopy Dev",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MotionLifecycleProvider>
          <PageTransition />
          {children}
        </MotionLifecycleProvider>
      </body>
    </html>
  );
}
