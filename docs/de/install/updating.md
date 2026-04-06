---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update geht etwas kaputt
summary: OpenClaw sicher aktualisieren (globale Installation oder aus dem Quellcode) sowie Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-06T03:08:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca9fff0776b9f5977988b649e58a5d169e5fa3539261cb02779d724d4ca92877
    source_path: install/updating.md
    workflow: 15
---

# Aktualisieren

Halten Sie OpenClaw auf dem neuesten Stand.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Erkennt Ihren Installationstyp (npm oder git), lädt die neueste Version, führt `openclaw doctor` aus und startet das Gateway neu.

```bash
openclaw update
```

Um Kanäle zu wechseln oder eine bestimmte Version als Ziel zu verwenden:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # Vorschau ohne Anwendung
```

`--channel beta` bevorzugt Beta, aber die Runtime fällt auf stable/latest zurück, wenn
das Beta-Tag fehlt oder älter ist als die neueste stabile Veröffentlichung. Verwenden Sie `--tag beta`,
wenn Sie das rohe npm-Beta-dist-tag für ein einmaliges Paket-Update möchten.

Siehe [Development channels](/de/install/development-channels) für die Semantik von Kanälen.

## Alternative: Installer erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Für Installationen aus dem Quellcode übergeben Sie `--install-method git --no-onboard`.

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

| Channel  | Verhalten                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (gestaffelte Ausrollung). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                               |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                        |

Das Gateway protokolliert beim Start außerdem einen Update-Hinweis (deaktivierbar mit `update.checkOnStart: false`).

## Nach dem Update

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

### Überprüfen

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

Tipp: `npm view openclaw version` zeigt die aktuell veröffentlichte Version an.

### Commit fixieren (Quellcode)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Zurück zur neuesten Version: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` auf Checkouts aus dem Quellcode bootstrapped der Updater bei Bedarf automatisch `pnpm`. Wenn ein Bootstrap-Fehler mit pnpm/corepack angezeigt wird, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` erneut) und führen Sie das Update erneut aus.
- Prüfen Sie: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/de/install) — alle Installationsmethoden
- [Doctor](/de/gateway/doctor) — Zustandsprüfungen nach Updates
- [Migrationen](/de/install/migrating) — Migrationsanleitungen für Hauptversionen
