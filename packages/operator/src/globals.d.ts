declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
  exit(code?: number): void;
};

declare module "commander" {
  export class Command {
    command(name: string): Command;
    description(text: string): Command;
    name(text: string): Command;
    version(text: string): Command;
    argument(name: string, description: string): Command;
    option(name: string, description: string, defaultValue?: unknown): Command;
    action(fn: (...args: any[]) => any): Command;
    parseAsync(argv: string[]): Promise<void>;
  }
}
declare module "dotenv";
declare module "crypto";
declare module "@supermemory/db";
declare module "@supermemory/db/schema";
