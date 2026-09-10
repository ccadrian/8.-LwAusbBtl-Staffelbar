#!/usr/bin/env node
/**
 * Staffelbar – automatisches Firebase-Setup.
 *
 *   node setup.mjs
 *
 * Legt Projekt, Firestore-Datenbank und Web-App an, trägt die Konfiguration
 * in index.html ein und veröffentlicht die Zugriffsregeln.
 * Der einzige manuelle Schritt ist die Google-Anmeldung im Browser –
 * die kann und darf dieses Skript nicht für dich übernehmen.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const FB = ["-y", "firebase-tools@13"];
const log = (...a) => console.log(...a);
const step = t => log("\n\x1b[1m→ " + t + "\x1b[0m");
const ok = t => log("  \x1b[32m✓\x1b[0m " + t);
const warn = t => log("  \x1b[33m!\x1b[0m " + t);
const die = t => { console.error("\n\x1b[31m✗ " + t + "\x1b[0m"); process.exit(1); };

function run(args, { capture = false, allowFail = false } = {}) {
  const r = spawnSync("npx", [...FB, ...args], {
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
    encoding: "utf8", shell: process.platform === "win32"
  });
  if (r.status !== 0 && !allowFail) {
    if (capture) console.error(r.stderr || r.stdout);
    die("Befehl fehlgeschlagen: firebase " + args.join(" "));
  }
  return { out: (r.stdout || "") + (r.stderr || ""), code: r.status };
}
const ask = async q => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question(q)).trim(); rl.close(); return a;
};

log("\n\x1b[1mStaffelbar – Firebase-Einrichtung\x1b[0m");

if (!existsSync("index.html")) die("index.html nicht gefunden – bitte im Projektordner ausführen.");
const major = Number(process.versions.node.split(".")[0]);
if (major < 18) die("Node 18 oder neuer nötig (installiert: " + process.versions.node + ").");

/* 1 – Anmeldung -------------------------------------------------------- */
step("Google-Anmeldung");
const who = run(["login:list"], { capture: true, allowFail: true });
if (/No authorized accounts|Kein/i.test(who.out) || who.code !== 0) {
  log("  Es öffnet sich gleich ein Browserfenster. Dort mit dem Google-Konto anmelden.");
  run(["login"]);
}
ok("angemeldet");

/* 2 – Projekt ---------------------------------------------------------- */
step("Firebase-Projekt");
const list = run(["projects:list"], { capture: true, allowFail: true }).out;
const existing = [...list.matchAll(/│\s*([a-z0-9][a-z0-9-]{4,29})\s*│/g)].map(m => m[1])
  .filter(id => id !== "Project" && !/^-+$/.test(id));
if (existing.length) {
  log("  Vorhandene Projekte: " + existing.slice(0, 12).join(", "));
}
let projectId = await ask("  Projekt-ID (Enter = neues Projekt anlegen): ");
if (!projectId) {
  projectId = "staffelbar-" + Math.random().toString(36).slice(2, 8);
  log("  Lege neues Projekt an: " + projectId);
  run(["projects:create", projectId, "--display-name", "Staffelbar"]);
}
ok("Projekt: " + projectId);

/* 3 – Firestore -------------------------------------------------------- */
step("Firestore-Datenbank");
const db = run(["firestore:databases:create", "(default)", "--location", "eur3", "--project", projectId],
               { capture: true, allowFail: true });
if (db.code === 0) ok("Datenbank angelegt (eur3)");
else if (/already exists|ALREADY_EXISTS/i.test(db.out)) ok("Datenbank besteht bereits");
else {
  warn("Datenbank konnte nicht automatisch angelegt werden.");
  warn("Einmal in der Konsole anlegen: https://console.firebase.google.com/project/" + projectId + "/firestore");
  await ask("  Danach Enter drücken… ");
}

/* 4 – Web-App + Konfiguration ------------------------------------------ */
step("Web-App und Konfiguration");
let apps = run(["apps:list", "WEB", "--project", projectId], { capture: true, allowFail: true }).out;
let appId = (apps.match(/1:\d+:web:[a-f0-9]+/i) || [])[0];
if (!appId) {
  run(["apps:create", "WEB", "Staffelbar", "--project", projectId], { capture: true });
  apps = run(["apps:list", "WEB", "--project", projectId], { capture: true }).out;
  appId = (apps.match(/1:\d+:web:[a-f0-9]+/i) || [])[0];
}
if (!appId) die("Keine Web-App-ID gefunden.");
ok("App-ID: " + appId);

const sdk = run(["apps:sdkconfig", "WEB", appId, "--project", projectId], { capture: true }).out;
const json = sdk.slice(sdk.indexOf("{"), sdk.lastIndexOf("}") + 1);
let cfg;
try { cfg = JSON.parse(json); } catch { die("SDK-Konfiguration nicht lesbar."); }
if (cfg.result) cfg = cfg.result;
if (!cfg.apiKey || !cfg.projectId) die("Konfiguration unvollständig.");
ok("Konfiguration geladen");

/* 5 – index.html patchen ------------------------------------------------ */
step("index.html eintragen");
const html = readFileSync("index.html", "utf8");
const block = "const FIREBASE_CONFIG = {\n" +
  ["apiKey","authDomain","projectId","storageBucket","messagingSenderId","appId"]
    .map(k => '  ' + k + ': "' + (cfg[k] || "") + '"').join(",\n") + "\n};";
const patched = html.replace(/const FIREBASE_CONFIG = \{[\s\S]*?\n\};/, block);
if (patched === html) die("FIREBASE_CONFIG-Block in index.html nicht gefunden.");
writeFileSync("index.html", patched);
ok("Konfiguration in index.html geschrieben");

/* 6 – Regeln veröffentlichen -------------------------------------------- */
step("Zugriffsregeln veröffentlichen");
run(["deploy", "--only", "firestore:rules", "--project", projectId]);
ok("Regeln aktiv (nur bars/staffelbar ist offen)");

/* 7 – hochladen --------------------------------------------------------- */
step("Änderung hochladen");
const git = (...a) => spawnSync("git", a, { stdio: "inherit", shell: process.platform === "win32" });
git("add", "index.html");
git("commit", "-m", "Firebase-Konfiguration eingetragen");
const push = spawnSync("git", ["push"], { stdio: "inherit", shell: process.platform === "win32" });
if (push.status !== 0) warn("Push fehlgeschlagen – bitte einmal von Hand: git push");

log("\n\x1b[1mFertig.\x1b[0m");
log("GitHub Pages wird beim nächsten Push automatisch durch den Workflow aktiviert.");
log("Die Adresse steht danach unter: Repository → Actions → \"Deploy to GitHub Pages\".");
log("Im Tool unter \x1b[1mMehr\x1b[0m findest du den QR-Code für den Tresen.\n");
