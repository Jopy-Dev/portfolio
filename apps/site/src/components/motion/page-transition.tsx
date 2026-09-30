"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { Preloader } from "./preloader";

type Entry = { pathname: string; mode: "full" | "reveal" };

export function PageTransition() {
  const pathname = usePathname();
  const [entry, setEntry] = useState<Entry>({ pathname, mode: "full" });
  useLayoutEffect(() => {
    window.history.scrollRestoration = pathname.startsWith("/projects/")
      ? "manual"
      : "auto";
    setEntry((current) =>
      current.pathname === pathname ? current : { pathname, mode: "reveal" },
    );
  }, [pathname]);
  return <Preloader key={entry.pathname} mode={entry.mode} />;
}
