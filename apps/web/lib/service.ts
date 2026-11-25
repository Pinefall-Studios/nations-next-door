import { createPeopleGroupsService, type PeopleGroupsService } from "../../../src/core/service";

let service: PeopleGroupsService | undefined;

export function peopleGroups(): PeopleGroupsService {
  service ??= createPeopleGroupsService();
  return service;
}
