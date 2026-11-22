import { createPeopleGroupsService } from "../src/core/index.js";

const BANNED = [
  "GSEC",
  "EngStat",
  "EngagementStatus",
  "EngagementProgress",
  "SPI",
  "SPIdesc",
  "CongExst",
  "CongregationsExist",
  "Plnting",
  "ChurchPlanting",
  "GSEClng",
  "LocationDesc",
  "LocationDescription",
  "PicURL",
  "PhotoURL",
  "FieldWorkers",
  "Missionaries",
  "LocalBelievers",
  "SecurityLevel",
];

function assertClean(label: string, value: unknown): void {
  const text = JSON.stringify(value);
  for (const banned of BANNED) {
    if (text.includes(banned)) {
      throw new Error(`${label} included ${banned}`);
    }
  }
}

function line(group: {
  name: string;
  country: string | null;
  population: number | null;
  primaryLanguage: { name: string | null; code: string | null };
  unreached: boolean | null;
  evangelicalBand: string | null;
  usStates: string[];
}): string {
  const population = group.population === null ? "population unknown" : group.population.toLocaleString("en-US");
  const language = `${group.primaryLanguage.name ?? "language unknown"} (${group.primaryLanguage.code ?? "no code"})`;
  const states = group.usStates.length > 0 ? ` [${group.usStates.join(", ")}]` : "";
  const unreached = group.unreached === null ? "unreached unknown" : group.unreached ? "unreached yes" : "unreached no";
  return `${group.name} — ${group.country ?? "country unknown"}${states} — ${population} — ${language} — ${unreached} — ${group.evangelicalBand ?? "no evangelical band"}`;
}

async function main(): Promise<void> {
  const service = createPeopleGroupsService({ pageDelayMs: 200 });

  const one = await service.getPeopleGroup({ pgid: "PG012345" });
  assertClean("get_people_group", one);
  if (one.group.countryCode !== "BEN" || one.group.primaryLanguage.code !== "ntm") {
    throw new Error(
      `Expected PG012345 to be in BEN with language ntm, got ${one.group.countryCode} / ${one.group.primaryLanguage.code}`,
    );
  }

  const benin = await service.listUnreachedByCountry({ country: "Benin", limit: 3 });
  assertClean("benin", benin);
  if (benin.total < 1) throw new Error("Expected at least one unreached group in Benin");
  if (benin.groups.some((group) => group.unreached !== true)) {
    throw new Error("Country list included a group that is not unreached");
  }

  const texas = await service.listUnreachedByUsState({ state: "Texas", limit: 3 });
  assertClean("texas", texas);
  if (texas.total < 1) throw new Error("Expected at least one unreached group in Texas");
  if (texas.groups.some((group) => !group.usStates.includes("TX"))) {
    throw new Error("Texas list included a group that is not assigned to TX");
  }

  const language = await service.listPeopleGroupsByLanguage({ language: "ntm", limit: 5 });
  assertClean("language", language);
  if (!language.groups.some((group) => group.pgid === "PG012345")) {
    throw new Error("Language ntm did not include PG012345");
  }

  console.log(one.attribution);
  console.log("");
  console.log(`PG012345: ${line(one.group)}`);
  console.log(`Data date: ${one.group.dataDate ?? "not provided"}`);
  console.log("");
  console.log(`Unreached in Benin: ${benin.total} (showing ${benin.groups.length})`);
  for (const group of benin.groups) console.log(`  ${line(group)}`);
  console.log("");
  console.log(`Unreached in Texas: ${texas.total} (showing ${texas.groups.length})`);
  for (const group of texas.groups) console.log(`  ${line(group)}`);
  console.log("");
  console.log(`Language ntm: ${language.total}`);
  for (const group of language.groups) console.log(`  ${line(group)}`);
  console.log("");
  console.log("Smoke check passed. Live PeopleGroups.org data, public fields only.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Smoke check failed";
  console.error(message);
  process.exitCode = 1;
});
