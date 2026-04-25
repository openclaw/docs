---
read_when:
    - OpenClaw aktualisieren
    - Etwas geht nach einem Update kaputt
summary: OpenClaw sicher aktualisieren (globale Installation oder Source) sowie Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-25T13:49:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

Halten Sie OpenClaw auf dem aktuellen Stand.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Der Befehl erkennt Ihren Installationstyp (npm oder git), lädt die neueste Version, führt `openclaw doctor` aus und startet das Gateway neu.

```bash
openclaw update
```

Um den Kanal zu wechseln oder eine bestimmte Version anzusteuern:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # Vorschau ohne Anwenden
```

`--channel beta` bevorzugt Beta, aber die Laufzeit fällt auf stable/latest zurück, wenn
das Beta-Tag fehlt oder älter als die neueste stabile Veröffentlichung ist. Verwenden Sie `--tag beta`,
wenn Sie für ein einmaliges Paket-Update das rohe npm-Beta-Dist-Tag möchten.

Siehe [Development channels](/de/install/development-channels) für die Semantik der Kanäle.

## Alternative: Installer erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Für Source-Installationen übergeben Sie `--install-method git --no-onboard`.

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

### Globale npm-Installationen und Laufzeitabhängigkeiten

OpenClaw behandelt paketierte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das
globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Laufzeitabhängigkeiten gebündelter Plugins
werden in ein beschreibbares Laufzeitverzeichnis ausgelagert, anstatt den Paketbaum zu verändern. Dadurch wird verhindert, dass `openclaw update` mit einem laufenden Gateway oder
lokalen Agenten kollidiert, der während derselben Installation Plugin-Abhängigkeiten repariert.

Einige Linux-npm-Setups installieren globale Pakete in root-eigenen Verzeichnissen wie
`/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout über denselben
externen Staging-Pfad.

Für gehärtete systemd-Units setzen Sie ein beschreibbares Staging-Verzeichnis, das in
`ReadWritePaths` enthalten ist:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Wenn `OPENCLAW_PLUGIN_STAGE_DIR` nicht gesetzt ist, verwendet OpenClaw `$STATE_DIRECTORY`, wenn
systemd dies bereitstellt, und fällt dann auf `~/.openclaw/plugin-runtime-deps` zurück.

### Laufzeitabhängigkeiten gebündelter Plugins

Paketierte Installationen halten Laufzeitabhängigkeiten gebündelter Plugins aus dem schreibgeschützten
Paketbaum heraus. Beim Start und während `openclaw doctor --fix` repariert OpenClaw
Laufzeitabhängigkeiten nur für gebündelte Plugins, die in der Konfiguration aktiv sind, durch Legacy-Kanalkonfiguration aktiv sind oder durch ihren gebündelten Manifest-Standard aktiviert sind.

Explizites Deaktivieren hat Vorrang. Ein deaktiviertes Plugin oder ein deaktivierter Kanal bekommt seine
Laufzeitabhängigkeiten nicht repariert, nur weil es im Paket existiert. Externe
Plugins und benutzerdefinierte Ladepfade verwenden weiterhin `openclaw plugins install` oder
`openclaw plugins update`.

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

| Kanal    | Verhalten                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (gestaffelter Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                                |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                         |

Das Gateway protokolliert beim Start auch einen Update-Hinweis (deaktivierbar mit `update.checkOnStart: false`).

## Nach dem Update

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert Konfiguration, prüft DM-Richtlinien und kontrolliert den Gateway-Zustand. Details: [Doctor](/de/gateway/doctor)

### Das Gateway neu starten

```bash
openclaw gateway restart
```

### Verifizieren

```bash
openclaw health
```

</Steps>

## Rollback

### Eine Version pinnen (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Tipp: `npm view openclaw version` zeigt die aktuell veröffentlichte Version.

### Einen Commit pinnen (Source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Zurück zur neuesten Version: `git checkout main && git pull`.

## Wenn Sie feststecken

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Für `openclaw update --channel dev` auf Source-Checkouts bootstrapt der Updater bei Bedarf automatisch `pnpm`. Wenn Sie einen Bootstrap-Fehler für pnpm/corepack sehen, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` wieder) und führen Sie das Update erneut aus.
- Siehe: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Install Overview](/de/install) — alle Installationsmethoden
- [Doctor](/de/gateway/doctor) — Integritätsprüfungen nach Updates
- [Migrating](/de/install/migrating) — Migrationsleitfäden für Hauptversionen
