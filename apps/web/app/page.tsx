import { Explore } from "../components/Explore";
import { SiteHeader } from "../components/SiteChrome";
import { loadCountryCatalog } from "../lib/live-catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await loadCountryCatalog("USA", 4_000);
  return (
    <>
      <SiteHeader current="explore" />
      <Explore initial={catalog} />
    </>
  );
}
