import Link from "next/link";
import { MapExplorer } from "../components/MapExplorer";
import { GroupList } from "../components/GroupList";
import { SampleBanner, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { countryCounts, getCatalog, stateCounts } from "../lib/catalog";
import { usShapes, worldShapes } from "../lib/maps";

export default function HomePage() {
  const catalog = getCatalog();
  const states = usShapes(stateCounts(catalog.groups));
  const countries = worldShapes(countryCounts(catalog.groups));
  const top = catalog.groups.filter((group) => group.unreached === true).slice(0, 4);

  return (
    <>
      <SiteHeader current="explore" />
      <SampleBanner label={catalog.sampleLabel} attribution={catalog.attribution} />
      <main className="shell">
        <section className="hero">
          <div className="hero-copy">
            <h1>Who is unreached near you?</h1>
            <p className="lede">
              A quiet look at people groups, the language they speak, and the free Scripture already published for them.
            </p>
          </div>
          <form className="picker" action="/groups">
            <label>
              <span>State or country</span>
              <select name="place" defaultValue="Texas">
                <option>Texas</option>
                <option>Louisiana</option>
                <option>Benin</option>
                <option>Afghanistan</option>
                <option>Guatemala</option>
                <option>Andorra</option>
              </select>
            </label>
            <button className="btn" type="submit">Show groups</button>
          </form>
        </section>
        <section className="section">
          <MapExplorer states={states.shapes} countries={countries.shapes} stateView={states.viewBox} worldView={countries.viewBox} groups={catalog.groups} />
        </section>
        <section className="section">
          <h2>Largest in this set</h2>
          <GroupList groups={top} />
          <p style={{ marginTop: 16 }}>
            <Link className="btn secondary" href="/groups">Search all groups</Link>
          </p>
        </section>
      </main>
      <SiteFooter attribution={catalog.attribution} />
    </>
  );
}
