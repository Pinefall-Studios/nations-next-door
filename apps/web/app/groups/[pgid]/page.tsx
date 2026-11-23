import Link from "next/link";
import { Noto_Sans_Kannada } from "next/font/google";
import { notFound } from "next/navigation";
import { EvangelicalBand } from "../../../components/EvangelicalBand";
import { Librarian } from "../../../components/Librarian";
import { LocatorMap } from "../../../components/LocatorMap";
import { PatternTile } from "../../../components/PatternTile";
import { SampleBanner, SiteFooter, SiteHeader } from "../../../components/SiteChrome";
import { getCatalog, getGroup } from "../../../lib/catalog";

const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], weight: ["500"] });

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ pgid: string }>;
  searchParams: Promise<{ ask?: string }>;
}) {
  const { pgid } = await params;
  const query = await searchParams;
  const group = getGroup(pgid);
  if (!group) notFound();
  const catalog = getCatalog();
  const where = group.usStates.length > 0 ? group.usStates.join(", ") : group.country;
  const prayer = `Pray for the ${group.name} people${group.country ? ` of ${group.country}` : ""}, ${group.population?.toLocaleString("en-US") ?? "a people"} whose primary language is ${group.languageName ?? "not listed"}.`;

  return (
    <>
      <SiteHeader />
      <SampleBanner label={catalog.sampleLabel} attribution={catalog.attribution} />
      <main className="shell">
        <p style={{ marginTop: 24 }}><Link href="/groups">All groups</Link></p>
        <article className="detail-card" style={{ marginTop: 12 }}>
          <PatternTile name={group.name} large />
          <div className="detail-body">
            <p className="gold">People group</p>
            <h1>{group.name}</h1>
            {group.nativeName ? (
              <p className={`${kannada.className} native`} lang={group.languageCode === "kan" ? "kn" : undefined}>
                {group.nativeName}
              </p>
            ) : null}
            <EvangelicalBand band={group.evangelicalBand} unreached={group.unreached} />
            <p className="notice">Source: {catalog.attribution}</p>
            <ul className="facts">
              <li><span>Population</span><strong className="nums">{group.population?.toLocaleString("en-US") ?? "Not stated"}</strong></li>
              <li><span>Primary religion</span><strong>{group.religion ?? "Not stated"}</strong></li>
              <li><span>Language</span><strong>{group.languageName} ({group.languageCode})</strong></li>
              <li><span>Place</span><strong>{where}</strong></li>
              <li>
                <span>Location</span>
                <strong>
                  {group.latitude ?? "—"}, {group.longitude ?? "—"}
                  {group.coordinatesRounded ? " · rounded" : ""}
                </strong>
              </li>
            </ul>
            {group.latitude !== null && group.longitude !== null ? (
              <LocatorMap
                latitude={group.latitude}
                longitude={group.longitude}
                countryCode={group.countryCode}
                usStates={group.usStates}
                rounded={group.coordinatesRounded}
              />
            ) : null}
            <p className="notice">Pattern tile. People-group photos are not shown.</p>
            {group.summary ? <p>{group.summary}</p> : null}
            <p className="gold">Resources in {group.languageName}</p>
            <div className="chips">
              {group.links.map((link) => (
                <a key={link.label} className="chip" href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
            <ul className="facts">
              {group.scripture.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <strong>
                    {row.href && row.linkText ? (
                      <a href={row.href} target="_blank" rel="noreferrer">{row.linkText}</a>
                    ) : "Not in this sample"}
                  </strong>
                </li>
              ))}
            </ul>
            {group.links.map((link) => (
              <p key={`${link.label}-note`} className="notice">{link.notice}</p>
            ))}
            <div className="actions">
              <a className="btn" href="#pray">Pray</a>
              <Link className="btn secondary" href={`/groups/${group.pgid}?ask=1`}>Ask about this group</Link>
            </div>
            <div className="prayer" id="pray">
              <p>{prayer}</p>
              <p className="notice">A printable card comes later. It will use this public record and a public-domain verse, not another agency&apos;s data.</p>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter attribution={catalog.attribution} />
      <Librarian
        groups={catalog.groups}
        attribution={catalog.attribution}
        demo={!process.env.AI_GATEWAY_API_KEY}
        initialOpen={query.ask === "1"}
        closeHref={`/groups/${group.pgid}`}
      />
    </>
  );
}
