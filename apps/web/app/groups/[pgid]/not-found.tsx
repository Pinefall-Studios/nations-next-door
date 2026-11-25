import Link from "next/link";
import { SiteHeader } from "../../../components/SiteChrome";

export default function MissingGroup() {
  return (
    <>
      <SiteHeader />
      <main className="shell hero">
        <h1>That group is not in this set</h1>
        <p className="lede">The sample does not include that id.</p>
        <Link className="btn" href="/groups">Back to groups</Link>
      </main>
    </>
  );
}
