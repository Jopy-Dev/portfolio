import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("static project segment is available at the client router URL", async () => {
  const directory = path.resolve("apps/site/out/projects/topspin");
  const segment = await readFile(
    path.join(directory, "__next.projects.$d$slug.__PAGE__.txt"),
    "utf8",
  );
  assert.match(segment, /TopSpin/);
});
