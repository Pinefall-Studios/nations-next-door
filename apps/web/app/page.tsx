import { Explore } from "../components/Explore";
import { SiteHeader } from "../components/SiteChrome";
import { getCatalog } from "../lib/catalog";

export default function HomePage() {
  const catalog = getCatalog();
  return (
    <>
      <SiteHeader current="explore" />
      <Explore initial={catalog} />
    </>
  );
}
