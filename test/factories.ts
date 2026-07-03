import { faker } from "@faker-js/faker";
import type { DirEntry, Drive, User } from "@/core/http/types";

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    publicID: faker.string.alphanumeric(16),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    provider: "google",
    providerID: faker.string.alphanumeric(21),
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function makeDrive(overrides: Partial<Drive> = {}): Drive {
  return {
    id: faker.string.uuid(),
    publicID: faker.string.alphanumeric(16),
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    ownerID: faker.string.uuid(),
    rootNodeID: faker.string.uuid(),
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function makeDirEntry(overrides: Partial<DirEntry> = {}): DirEntry {
  return {
    inodeID: faker.string.uuid(),
    name: faker.system.commonFileName(),
    type: "regular",
    ...overrides,
  };
}
