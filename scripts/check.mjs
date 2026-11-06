// Checks every app against schema/app.schema.json, and flags downloads in
// its scripts with no checksum after them. A help for review: the console
// checks each app again at sync, and its check is the one that counts.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const schema = JSON.parse(readFileSync("schema/app.schema.json", "utf8"));
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
let failed = false;

const fail = (file, message, line) => {
  failed = true;
  console.log(`::error file=${file}${line ? `,line=${line}` : ""}::${message}`);
};
const warn = (file, message, line) => console.log(`::warning file=${file},line=${line}::${message}`);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const DOWNLOAD = /\b(curl|wget)\b/;
const CHECKED = /\b(sha256sum|shasum -a 256)\b.*(-c|--check)\b/;
const PIPED = /\b(curl|wget)\b[^|]*\|\s*(ba|z|da)?sh\b/;

for (const slug of readdirSync("apps").sort()) {
  const dir = join("apps", slug);
  if (!statSync(dir).isDirectory()) continue;
  const manifestPath = join(dir, "app.json");
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(manifestPath, `not JSON: ${error.message}`);
    continue;
  }
  if (!validate(manifest)) {
    for (const e of validate.errors) fail(manifestPath, `${e.instancePath || "/"} ${e.message}`);
  }
  if (!statSync(join(dir, "Procfile"), { throwIfNoEntry: false })) fail(dir, "no Procfile");

  for (const file of walk(dir).filter((p) => p.endsWith(".sh"))) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (line.trimStart().startsWith("#") || !DOWNLOAD.test(line)) return;
      if (PIPED.test(line)) return fail(file, "a download is piped to a shell", i + 1);
      const after = lines.slice(i, i + 4).join("\n");
      if (!CHECKED.test(after)) warn(file, "a download with no SHA-256 check in the lines after it", i + 1);
    });
  }
}

if (failed) process.exit(1);
console.log("every app passes");
