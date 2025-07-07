import { Command } from "commander";
import { getDb } from "./db";
import { registerCreateUser } from "./commands/createUser";
import { registerListDocuments } from "./commands/listDocuments";
import { registerListUsers } from "./commands/listUsers";
import { registerCreateSpace } from "./commands/createSpace";
import { registerListSpaces } from "./commands/listSpaces";
import { registerAddWaitlist } from "./commands/addWaitlist";
import { registerListWaitlist } from "./commands/listWaitlist";
import { registerRemoveWaitlist } from "./commands/removeWaitlist";
import { registerCreateDocument } from "./commands/createDocument";
import { registerDeleteDocument } from "./commands/deleteDocument";
import { registerUpdateDocument } from "./commands/updateDocument";
import { registerAddDocumentToSpace } from "./commands/addDocumentToSpace";
import { registerRemoveDocumentFromSpace } from "./commands/removeDocumentFromSpace";
import { registerUpdateUser } from "./commands/updateUser";
import { registerDeleteUser } from "./commands/deleteUser";
import { registerDeleteSpace } from "./commands/deleteSpace";
import { registerUpdateSpace } from "./commands/updateSpace";
import { registerAddSpaceMember } from "./commands/addSpaceMember";
import { registerRemoveSpaceMember } from "./commands/removeSpaceMember";
import { registerListSpaceMembers } from "./commands/listSpaceMembers";
import { registerShowUser } from "./commands/showUser";
import { registerShowDocument } from "./commands/showDocument";
import { registerShowSpace } from "./commands/showSpace";
import { registerListSpaceDocuments } from "./commands/listSpaceDocuments";
import { registerSpaceSummary } from "./commands/spaceSummary";
import { registerUserSummary } from "./commands/userSummary";

// Ensure DATABASE_URL is loaded early
getDb();

const program = new Command();
program
  .name("supermemory-operator")
  .description("CLI utilities for managing Supermemory")
  .version("0.1.0");

registerCreateUser(program);
registerListDocuments(program);
registerListUsers(program);
registerCreateSpace(program);
registerListSpaces(program);
registerAddWaitlist(program);
registerListWaitlist(program);
registerDeleteUser(program);
registerDeleteSpace(program);
registerUpdateSpace(program);
registerAddSpaceMember(program);
registerRemoveSpaceMember(program);
registerListSpaceMembers(program);
registerRemoveWaitlist(program);
registerCreateDocument(program);
registerDeleteDocument(program);
registerUpdateUser(program);
registerUpdateDocument(program);
registerAddDocumentToSpace(program);
registerRemoveDocumentFromSpace(program);
registerShowUser(program);
registerShowDocument(program);
registerShowSpace(program);
registerListSpaceDocuments(program);
registerSpaceSummary(program);
registerUserSummary(program);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
