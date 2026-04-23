---
read_when:
    - Sie möchten einen Source-Checkout sicher aktualisieren.
    - Sie müssen das Kurzverhalten von `--update` verstehen.
summary: CLI-Referenz für `openclaw update` (relativ sicheres Quell-Update + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-23T06:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc049ecf3d35fe276a1e5962bb8e5316dbbc3219ef0b91ee64d41cbbea20f9ae
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw sicher aktualisieren und zwischen stable-/beta-/dev-Kanälen wechseln.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Updates über den Paketmanager-Ablauf unter [Aktualisieren](/de/install/updating).

## Verwendung

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Optionen

- `--no-restart`: Neustart des Gateway-Dienstes nach einem erfolgreichen Update überspringen.
- `--channel <stable|beta|dev>`: den Update-Kanal festlegen (git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: das Paketziel nur für dieses Update überschreiben. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: geplante Update-Aktionen (Kanal/Tag/Ziel/Neustart-Ablauf) anzeigen, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: maschinenlesbares `UpdateRunResult`-JSON ausgeben, einschließlich
  `postUpdate.plugins.integrityDrifts`, wenn während der Plugin-Synchronisierung nach dem Update eine Drift von npm-Plugin-Artefakten erkannt wird.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1200 s).
- `--yes`: Bestätigungsaufforderungen überspringen (zum Beispiel die Bestätigung bei einem Downgrade)

Hinweis: Downgrades erfordern eine Bestätigung, weil ältere Versionen die Konfiguration beschädigen können.

## `update status`

Den aktiven Update-Kanal + Git-Tag/Branch/SHA (für Source-Checkouts) sowie die Verfügbarkeit von Updates anzeigen.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: maschinenlesbares Status-JSON ausgeben.
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3 s).

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Update-Kanals und zur Bestätigung, ob das Gateway
nach dem Update neu gestartet werden soll (Standard ist ein Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen, wird angeboten, eines zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Update-Schritt (Standard `1200`)

## Was es bewirkt

Wenn Sie explizit zwischen Kanälen wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode synchron:

- `dev` → stellt ein Git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert es und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt den npm-Dist-Tag `beta`, fällt aber auf `latest` zurück, wenn `beta`
  fehlt oder älter ist als die aktuelle stabile Version.

Der Auto-Updater des Gateway-Kerns (wenn über die Konfiguration aktiviert) verwendet denselben Update-Pfad erneut.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion
auf, bevor der Paketmanager aufgerufen wird. Wenn die installierte Version exakt
dem Ziel entspricht und keine Änderung des Update-Kanals gespeichert werden muss,
wird der Befehl als übersprungen beendet, noch bevor Paketinstallation, Plugin-Synchronisierung, Abschlussaktualisierung oder Gateway-Neustart ausgeführt werden.

## Git-Checkout-Ablauf

Kanäle:

- `stable`: den neuesten Nicht-Beta-Tag auschecken, dann Build + doctor.
- `beta`: den neuesten `-beta`-Tag bevorzugen, aber auf den neuesten stabilen Tag
  zurückfallen, wenn `beta` fehlt oder älter ist.
- `dev`: `main` auschecken, dann abrufen + rebasen.

Allgemein:

1. Erfordert einen sauberen Worktree (keine nicht committeten Änderungen).
2. Wechselt zum ausgewählten Kanal (Tag oder Branch).
3. Ruft Upstream ab (nur dev).
4. Nur dev: Lint- und TypeScript-Build-Prüfung in einem temporären Worktree; wenn die Spitze fehlschlägt, wird bis zu 10 Commits zurückgegangen, um den neuesten sauberen Build zu finden.
5. Rebased auf den ausgewählten Commit (nur dev).
6. Installiert Abhängigkeiten mit dem Paketmanager des Repos. Bei pnpm-Checkouts bootstrapped der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann mit einem temporären Fallback `npm install pnpm@10`), statt `npm run build` innerhalb eines pnpm-Workspaces auszuführen.
7. Führt Build und Build der Control UI aus.
8. Führt `openclaw doctor` als abschließende Prüfung für ein „sicheres Update“ aus.
9. Synchronisiert Plugins mit dem aktiven Kanal (dev verwendet gebündelte extensions; stable/beta verwenden npm) und aktualisiert npm-installierte Plugins.

Wenn ein exakt angeheftetes npm-Plugin-Update zu einem Artefakt aufgelöst wird, dessen Integrität
von dem gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` dieses Plugin-
Artefakt-Update ab, statt es zu installieren. Installieren oder aktualisieren Sie das Plugin
erst dann explizit neu, wenn Sie überprüft haben, dass Sie dem neuen Artefakt vertrauen.

Wenn das Bootstrap von pnpm weiterhin fehlschlägt, stoppt der Updater jetzt frühzeitig mit einem
paketmanager-spezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Siehe auch

- `openclaw doctor` (bietet bei Git-Checkouts an, zuerst ein Update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
