import Link from "next/link";
import { imbShortCreditFrom } from "../../../src/core/attribution";

export function SiteHeader({ current }: { current?: "explore" | "groups" }) {
  return (
    <header className="site-header">
      <div className="shell header-row">
        <Link href="/" className="brand">
          <span className="mark" aria-hidden="true" />
          <span className="brand-name">Nations Next Door</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href="/" aria-current={current === "explore" ? "page" : undefined}>
            Explore
          </Link>
          <Link href="/groups" aria-current={current === "groups" ? "page" : undefined}>
            Groups
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SampleBanner({ label, attribution }: { label: string | null; attribution: string }) {
  if (!label) return null;
  return (
    <div className="banner">
      <div className="shell">
        <strong>{label}.</strong> A small frozen public set for this concept, not a live extract. {attribution}
      </div>
    </div>
  );
}

export function SourceBanner({ attribution, sample }: { attribution: string; sample?: boolean }) {
  const line = sample
    ? `Sample data · ${imbShortCreditFrom(attribution)}`
    : imbShortCreditFrom(attribution);
  return (
    <a className="banner is-slim source-jump" href="#source">
      <div className="shell">{line}</div>
    </a>
  );
}

export function SiteFooter({ attribution }: { attribution: string }) {
  return (
    <footer className="site-footer" id="source">
      <div className="shell footer-row">
        <p>
          {attribution}
          <br />
          Free and non-commercial. No photos from people-group feeds. Pattern tile instead.
        </p>
      </div>
    </footer>
  );
}
