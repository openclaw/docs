---
read_when:
    - Sie möchten einen Source-Checkout sicher aktualisieren.
    - Sie müssen das Kurzverhalten von `--update` verstehen.
summary: CLI-Referenz für `openclaw update` (relativ sichere Quellaktualisierung + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-26T11:26:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw sicher aktualisieren und zwischen Stable-/Beta-/Dev-Kanälen wechseln.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Aktualisierungen über den Paketmanager-Ablauf unter [Aktualisieren](/de/install/updating).

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

- `--no-restart`: Neustart des Gateway-Dienstes nach einer erfolgreichen Aktualisierung überspringen. Paketmanager-Aktualisierungen, die das Gateway neu starten, prüfen vor erfolgreichem Abschluss des Befehls, ob der neu gestartete Dienst die erwartete aktualisierte Version meldet.
- `--channel <stable|beta|dev>`: den Aktualisierungskanal festlegen (Git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: das Paketziel nur für diese Aktualisierung überschreiben. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: geplante Aktualisierungsaktionen (Kanal/Tag/Ziel/Neustartablauf) als Vorschau anzeigen, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: maschinenlesbares `UpdateRunResult`-JSON ausgeben, einschließlich
  `postUpdate.plugins.integrityDrifts`, wenn während der Plugin-Synchronisierung nach der Aktualisierung
  Artefaktdrift bei npm-Plugins erkannt wird.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1800 s).
- `--yes`: Bestätigungsaufforderungen überspringen (zum Beispiel Bestätigung eines Downgrades)

Hinweis: Downgrades erfordern eine Bestätigung, weil ältere Versionen die Konfiguration beschädigen können.

## `update status`

Den aktiven Aktualisierungskanal + Git-Tag/Branch/SHA (für Source-Checkouts) sowie die Verfügbarkeit von Aktualisierungen anzeigen.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: maschinenlesbares Status-JSON ausgeben.
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3 s).

## `update wizard`

Interaktiver Ablauf zum Auswählen eines Aktualisierungskanals und zum Bestätigen, ob das Gateway
nach der Aktualisierung neu gestartet werden soll (Standard ist ein Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen, wird
angeboten, eines zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Aktualisierungsschritt (Standard `1800`)

## Was es tut

Wenn Sie explizit zwischen Kanälen wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode abgestimmt:

- `dev` → stellt ein Git-Checkout sicher (Standard: `~/openclaw`, Überschreibung mit `OPENCLAW_GIT_DIR`),
  aktualisiert es und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt das npm-Dist-Tag `beta`, fällt aber auf `latest` zurück, wenn `beta`
  fehlt oder älter als das aktuelle Stable-Release ist.

Der Gateway-Core-Auto-Updater (wenn per Konfiguration aktiviert) verwendet denselben Aktualisierungspfad.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion
vor dem Aufruf des Paketmanagers auf. Selbst wenn die installierte Version
bereits dem Ziel entspricht, aktualisiert der Befehl die globale Paketinstallation,
führt dann Plugin-Synchronisierung, Vervollständigungsaktualisierung und Neustartarbeit aus. Dadurch bleiben paketierte
Sidecars und kanalverwaltete Plugin-Einträge mit dem installierten OpenClaw-Build abgestimmt.

## Git-Checkout-Ablauf

Kanäle:

- `stable`: das neueste Nicht-Beta-Tag auschecken, dann build + doctor.
- `beta`: das neueste `-beta`-Tag bevorzugen, aber auf das neueste Stable-Tag
  zurückfallen, wenn Beta fehlt oder älter ist.
- `dev`: `main` auschecken, dann fetch + rebase.

Allgemein:

1. Erfordert einen sauberen Worktree (keine nicht committeten Änderungen).
2. Wechselt auf den ausgewählten Kanal (Tag oder Branch).
3. Holt Upstream-Änderungen ab (nur Dev).
4. Nur Dev: Preflight-Lint + TypeScript-Build in einem temporären Worktree; wenn die Spitze fehlschlägt, wird bis zu 10 Commits zurückgegangen, um den neuesten sauberen Build zu finden.
5. Rebased auf den ausgewählten Commit (nur Dev).
6. Installiert Abhängigkeiten mit dem Paketmanager des Repos. Für pnpm-Checkouts bootstrapped der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann mit einem temporären Fallback `npm install pnpm@10`), statt `npm run build` innerhalb eines pnpm-Workspaces auszuführen.
7. Führt Build + Build der Control UI aus.
8. Führt `openclaw doctor` als abschließende Prüfung für die „sichere Aktualisierung“ aus.
9. Synchronisiert Plugins mit dem aktiven Kanal (Dev verwendet gebündelte Plugins; Stable/Beta verwendet npm) und aktualisiert npm-installierte Plugins.

Wenn ein exaktes angeheftetes npm-Plugin-Update auf ein Artefakt aufgelöst wird, dessen Integrität
von dem gespeicherten Installationseintrag abweicht, bricht `openclaw update` diese Plugin-
Artefaktaktualisierung ab, statt sie zu installieren. Installieren oder aktualisieren Sie das Plugin
erst dann explizit erneut, nachdem Sie verifiziert haben, dass Sie dem neuen Artefakt vertrauen.

Fehlschläge bei der Plugin-Synchronisierung nach der Aktualisierung lassen das Aktualisierungsergebnis fehlschlagen und stoppen nachfolgende Neustartarbeit.
Beheben Sie den Fehler bei der Plugin-Installation/-Aktualisierung und führen Sie dann
`openclaw update` erneut aus.

Wenn das pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater jetzt früh mit einem paketmanager-spezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet bei Git-Checkouts an, zuerst ein Update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
