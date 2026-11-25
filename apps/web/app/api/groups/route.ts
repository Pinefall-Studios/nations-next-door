import { imbAttribution } from "../../../../../src/core/attribution";
import { fromPublic } from "../../../lib/from-public";
import { getCatalog } from "../../../lib/catalog";
import { peopleGroups } from "../../../lib/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") ?? "USA";
  const language = url.searchParams.get("language");
  const unreachedOnly = url.searchParams.get("unreached") !== "no";
  try {
    const service = peopleGroups();
    const loaded = language
      ? await service.listPeopleGroupsByLanguage({
          language,
          country: country === "any" ? undefined : country,
          unreachedOnly,
          limit: 100,
        })
      : await service.loadCountry(country === "any" ? "USA" : country);
    const groups = ("groups" in loaded ? loaded.groups : []).map(fromPublic);
    const filtered = unreachedOnly && !language ? groups.filter((group) => group.unreached === true) : groups;
    const fetchedAt = "fetchedAt" in loaded ? loaded.fetchedAt : new Date().toISOString();
    return Response.json({
      mode: "live",
      sampleLabel: null,
      attribution: imbAttribution(new Date(fetchedAt)),
      groups: filtered.sort((a, b) => (b.population ?? 0) - (a.population ?? 0)),
    });
  } catch {
    const catalog = getCatalog();
    return Response.json({
      ...catalog,
      fallback: true,
    });
  }
}
