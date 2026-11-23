import type { ViewGroup } from "./view";

const REFUSAL =
  "I don't have that, and I won't guess. This desk only answers from public, aggregate people-group descriptions: name, population, language, religion, whether the evangelical band is under 2%, and links to Scripture. Nothing here is about field workers, local believers, or engagement.";

export function demoAnswer(question: string, groups: ViewGroup[], attribution: string): string {
  const asked = question.toLowerCase();
  if (/worker|missionar|believer|engagement|church planting|congregation|\bgsec\b/.test(asked)) {
    return `${REFUSAL}\n\nSource: ${attribution}`;
  }

  const unreached = groups.filter((group) => group.unreached === true);
  let picked = unreached;

  if (asked.includes("texas") || /\btx\b/.test(asked)) {
    picked = unreached.filter((group) => group.usStates.includes("TX"));
  } else if (asked.includes("benin")) {
    picked = unreached.filter((group) => group.countryCode === "BEN");
  } else if (asked.includes("afghan")) {
    picked = unreached.filter((group) => group.countryCode === "AFG");
  } else {
    const named = groups.find((group) => asked.includes(group.name.toLowerCase()));
    if (named) picked = [named];
  }

  if (picked.length === 0) {
    return `This sample does not include an unreached group for that question. It does include ${unreached
      .map((group) => group.name)
      .join(", ")}.\n\nSource: ${attribution}`;
  }

  const lines = picked.slice(0, 4).map((group) => {
    const where = group.usStates.length > 0 ? group.usStates.join(", ") : (group.country ?? "unknown place");
    const people = group.population?.toLocaleString("en-US") ?? "population not in this sample";
    const language = `${group.languageName ?? "language not listed"} (${group.languageCode ?? "no code"})`;
    const band = group.evangelicalBand ?? "evangelical band not listed";
    const scripture = group.bible === "Available" ? "A Bible is noted as available." : "Bible availability is not in this sample line.";
    return `${group.name} in ${where}: ${people} people. Primary language ${language}. Religion: ${group.religion ?? "not listed"}. Unreached: ${group.unreached ? "yes" : "no"}. Evangelical band: ${band}. ${scripture}`;
  });

  const resourceNote = asked.includes("resource") || asked.includes("language") || asked.includes("bible")
    ? "\n\nScripture links on each group page point outward. They are not hosted here. unfoldingWord is CC BY-SA 4.0. Bible audio, when linked, stays on Faith Comes By Hearing's site under their terms."
    : "";

  return `${lines.join("\n\n")}${resourceNote}\n\nSource: ${attribution}`;
}
