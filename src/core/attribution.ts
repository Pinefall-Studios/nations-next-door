export interface SourceCitation {
  id: string;
  name: string;
  url: string;
  attribution: string;
}

/**
 * Credit line for people-group facts.
 * The older IMB Global Research FAQ asked for this shape of credit. The month
 * and publication name vary; each record carries its own dataDate when IMB
 * sends one. See docs/DATA_SOURCES.md.
 */
export const IMB_ATTRIBUTION =
  "This information was provided by The International Mission Board - Global Research, PeopleGroups.org, https://peoplegroups.org/.";

export const IMB_SOURCE: SourceCitation = {
  id: "imb-peoplegroups",
  name: "IMB Global Research",
  url: "https://peoplegroups.org/",
  attribution: IMB_ATTRIBUTION,
};

export const US_STATE_GEOGRAPHY_NOTE =
  "US state is assigned in two ways, and a group can match more than one state. The published latitude and longitude are tested against US Census Bureau state boundaries (cartographic boundary files, simplified by the us-atlas project, public domain; the 50 states and the District of Columbia). Any of those state names that appear in the published location description are included as well. The location description itself is not returned. A point near a border can fall in the neighboring state, and a description can name a state where only part of the community lives. This is not a roster of residents, churches, or workers.";
