---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder Quellcode) plus Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-22T04:23:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# Aktualisieren

Halten Sie OpenClaw auf dem neuesten Stand.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Der Installations-Typ (npm oder Git) wird erkannt, die neueste Version wird abgerufen, `openclaw doctor` wird ausgeführt und das Gateway wird neu gestartet.

```bash
openclaw update
```

Um Channels zu wechseln oder eine bestimmte Version anzusteuern:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # Vorschau ohne Anwendung
```

`--channel beta` bevorzugt Beta, aber die Runtime fällt auf Stable/Latest zurück, wenn das Beta-Tag fehlt oder älter als das neueste Stable-Release ist. Verwenden Sie `--tag beta`, wenn Sie das rohe npm-Beta-dist-tag für ein einmaliges Paket-Update möchten.

Siehe [Development channels](/de/install/development-channels) für die Semantik von Channels.

## Alternative: Installer erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Bei Source-Installationen übergeben Sie `--install-method git --no-onboard`.

## Alternative: manuell mit npm, pnpm oder bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Globale npm-Installationen mit Root-Besitz

Einige Linux-npm-Setups installieren globale Pakete in root-eigenen Verzeichnissen wie
`/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout: Das installierte Paket wird zur Laufzeit als schreibgeschützt behandelt, und Runtime-Abhängigkeiten gebündelter Plugins werden in ein beschreibbares Runtime-Verzeichnis ausgelagert, statt den Paketbaum zu verändern.

Für gehärtete systemd-Units setzen Sie ein beschreibbares Stage-Verzeichnis, das in `ReadWritePaths` enthalten ist:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Wenn `OPENCLAW_PLUGIN_STAGE_DIR` nicht gesetzt ist, verwendet OpenClaw `$STATE_DIRECTORY`, wenn systemd es bereitstellt, und fällt andernfalls auf `~/.openclaw/plugin-runtime-deps` zurück.

## Auto-Updater

Der Auto-Updater ist standardmäßig deaktiviert. Aktivieren Sie ihn in `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | Verhalten                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours`, wendet dann mit deterministischem Jitter über `stableJitterHours` an (gestaffelter Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                              |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                       |

Das Gateway protokolliert beim Start außerdem einen Update-Hinweis (deaktivierbar mit `update.checkOnStart: false`).

## Nach dem Aktualisieren

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert die Konfiguration, prüft DM-Richtlinien und überprüft den Zustand des Gateways. Details: [Doctor](/de/gateway/doctor)

### Gateway neu starten

```bash
openclaw gateway restart
```

### Verifizieren

```bash
openclaw health
```

</Steps>

## Rollback

### Version fixieren (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Tipp: `npm view openclaw version` zeigt die aktuell veröffentlichte Version.

### Commit fixieren (Source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Um zur neuesten Version zurückzukehren: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` auf Source-Checkouts bootstrapped der Updater bei Bedarf automatisch `pnpm`. Wenn ein pnpm-/corepack-Bootstrap-Fehler angezeigt wird, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` wieder) und führen Sie das Update erneut aus.
- Siehe: [Troubleshooting](/de/gateway/troubleshooting)
- Fragen Sie auf Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Install Overview](/de/install) — alle Installationsmethoden
- [Doctor](/de/gateway/doctor) — Zustandsprüfungen nach Updates
- [Migrating](/de/install/migrating) — Migrationsleitfäden für Hauptversionen
