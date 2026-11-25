export class PeopleGroupsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidQueryError extends PeopleGroupsError {}

export class UnknownPlaceError extends PeopleGroupsError {}

export class PeopleGroupNotFoundError extends PeopleGroupsError {}

export class QueryTooBroadError extends PeopleGroupsError {}
