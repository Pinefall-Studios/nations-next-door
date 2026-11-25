import { commandFor, type MapCommand } from "./map-command";
import type { ViewGroup } from "./view";

const REFUSAL =
  "I don't have that, and I won't guess. This desk only answers from public, aggregate people-group descriptions: name, population, language, religion, whether the evangelical band is under 2%, and links to Scripture. Nothing here is about field workers, local believers, or engagement.";

export type DemoReply = {
  text: string;
  map: MapCommand | null;
  groups: ViewGroup[];
};

export function demoAnswer(question: string, groups: ViewGroup[], attribution: string): DemoReply {
  const asked = question.toLowerCase();
  if (/worker|missionar|believer|engagement|church planting|congregation|\bgsec\b/.test(asked)) {
    return { text: `${REFUSAL}\n\nSource: ${attribution}`, map: null, groups: [] };
  }

  const unreached = groups.filter((group) => group.unreached === true);
  let picked = unreached;
  let label = "this sample";

  if (asked.includes("texas") || /\btx\b/.test(asked)) {
    picked = unreached.filter((group) => group.usStates.includes("TX"));
    label = "Texas";
  } else if (asked.includes("louisiana")) {
    picked = unreached.filter((group) => group.usStates.includes("LA"));
    label = "Louisiana";
  } else if (asked.includes("benin")) {
    picked = unreached.filter((group) => group.countryCode === "BEN");
    label = "Benin";
  } else if (asked.includes("afghan")) {
    picked = unreached.filter((group) => group.countryCode === "AFG");
    label = "Afghanistan";
  } else if (asked.includes("guatemala")) {
    picked = groups.filter((group) => group.countryCode === "GTM");
    label = "Guatemala";
  } else {
    const named = groups.find((group) => asked.includes(group.name.toLowerCase()));
    if (named) {
      picked = [named];
      label = named.name;
    }
  }

  if (picked.length === 0) {
    return {
      text: `This set does not include an unreached group for that question. It does include ${unreached
        .map((group) => group.name)
        .join(", ")}.\n\nSource: ${attribution}`,
      map: null,
      groups: [],
    };
  }

  const kind = picked.every((group) => group.unreached === true) ? "unreached group" : "people group";
  const resourceNote = asked.includes("resource") || asked.includes("language") || asked.includes("bible")
    ? " Scripture links on each card point outward. They are not hosted here."
    : "";
  const sentence = picked.length === 1
    ? `${picked[0]?.name} is in the public record for ${label}.`
    : `${picked.length} ${kind}s in ${label}, from the public people-group record.`;

  return {
    text: `${sentence}${resourceNote}`,
    map: commandFor(label, picked),
    groups: picked,
  };
}
