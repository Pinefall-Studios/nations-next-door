import { SearchBoard } from "../../components/SearchBoard";
import { SampleBanner, SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { loadCountryCatalog } from "../../lib/live-catalog";

export const dynamic = "force-dynamic";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string }>;
}) {
  const query = await searchParams;
  const catalog = await loadCountryCatalog("USA");
  return (
    <>
      <SiteHeader current="groups" />
      <SampleBanner label={catalog.sampleLabel} attribution={catalog.attribution} />
      {catalog.mode === "live" ? (
        <div className="banner">
          <div className="shell"><strong>Live data.</strong> {catalog.attribution}</div>
        </div>
      ) : null}
      <main className="shell">
        <section className="hero">
          <h1>Find a people group</h1>
          <p className="lede">Search by name or language. Filter by place, religion, the evangelical band, and whether a Bible is noted.</p>
        </section>
        <SearchBoard groups={catalog.groups} place={query.place ?? ""} />
      </main>
      <SiteFooter attribution={catalog.attribution} />
    </>
  );
}
