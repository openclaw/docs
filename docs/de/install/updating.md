---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr.
summary: OpenClaw sicher aktualisieren (globale Installation oder Source), plus Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-26T11:33:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

Halten Sie OpenClaw aktuell.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Erkennt Ihren Installationstyp (npm oder git), ruft die neueste Version ab, führt `openclaw doctor` aus und startet das Gateway neu.

```bash
openclaw update
```

Um Channels zu wechseln oder eine bestimmte Version anzusteuern:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # Vorschau ohne Anwenden
```

`--channel beta` bevorzugt Beta, aber die Laufzeit fällt auf stable/latest zurück, wenn
das Beta-Tag fehlt oder älter als die neueste stabile Version ist. Verwenden Sie `--tag beta`,
wenn Sie das rohe npm-Beta-dist-tag für ein einmaliges Paket-Update möchten.

Siehe [Development channels](/de/install/development-channels) für die Semantik von Channels.

## Zwischen npm- und git-Installationen wechseln

Verwenden Sie Channels, wenn Sie den Installationstyp ändern möchten. Der Updater behält Ihren
Status, Ihre Konfiguration, Anmeldedaten und Ihren Workspace in `~/.openclaw`; er ändert nur,
welche OpenClaw-Codeinstallation CLI und Gateway verwenden.

```bash
# npm-Paketinstallation -> editierbarer git-Checkout
openclaw update --channel dev

# git-Checkout -> npm-Paketinstallation
openclaw update --channel stable
```

Führen Sie zuerst `--dry-run` aus, um den genauen Wechsel des Installationsmodus anzuzeigen:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Der Channel `dev` stellt einen git-Checkout sicher, baut ihn und installiert die globale CLI
aus diesem Checkout. Die Channels `stable` und `beta` verwenden Paketinstallationen. Wenn das
Gateway bereits installiert ist, aktualisiert `openclaw update` die Service-Metadaten
und startet es neu, sofern Sie nicht `--no-restart` übergeben.

## Alternative: den Installer erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Um über
den Installer einen bestimmten Installationstyp zu erzwingen, übergeben Sie `--install-method git --no-onboard` oder
`--install-method npm --no-onboard`.

## Alternative: manuell mit npm, pnpm oder bun

```bash
npm i -g openclaw@latest
```

Wenn `openclaw update` eine globale npm-Installation verwaltet, führt es zuerst den normalen
globalen Installationsbefehl aus. Wenn dieser Befehl fehlschlägt, versucht OpenClaw es einmal erneut mit
`--omit=optional`. Dieser Wiederholungsversuch hilft auf Hosts, auf denen native optionale Abhängigkeiten
nicht kompiliert werden können, während der ursprüngliche Fehler sichtbar bleibt, falls auch der Fallback fehlschlägt.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Globale npm-Installationen und Laufzeitabhängigkeiten

OpenClaw behandelt paketierte globale Installationen zur Laufzeit als schreibgeschützt, selbst wenn das
globale Paketverzeichnis für den aktuellen Benutzer beschreibbar ist. Laufzeitabhängigkeiten gebündelter Plugins
werden in ein beschreibbares Laufzeitverzeichnis staged, statt den
Paketbaum zu verändern. Dadurch verhindert `openclaw update`, dass es mit einem laufenden Gateway oder
lokalen Agenten kollidiert, der während derselben Installation Plugin-Abhängigkeiten repariert.

Einige Linux-npm-Setups installieren globale Pakete in root-eigenen Verzeichnissen wie
`/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout über denselben
externen Staging-Pfad.

Für gehärtete systemd-Units setzen Sie ein beschreibbares Stage-Verzeichnis, das in
`ReadWritePaths` enthalten ist:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Wenn `OPENCLAW_PLUGIN_STAGE_DIR` nicht gesetzt ist, verwendet OpenClaw `$STATE_DIRECTORY`, wenn
systemd es bereitstellt, und fällt dann auf `~/.openclaw/plugin-runtime-deps` zurück.
Der Reparaturschritt behandelt dieses Stage-Verzeichnis als OpenClaw-eigenes lokales Paket-Root und
ignoriert npm-Prefix-/Global-Einstellungen des Benutzers, sodass globale Installationskonfiguration von npm
gebündelte Plugin-Abhängigkeiten nicht in `~/node_modules` oder den globalen Paketbaum umleitet.

Vor Paket-Updates und Reparaturen gebündelter Laufzeitabhängigkeiten versucht OpenClaw eine
Best-Effort-Prüfung des freien Speicherplatzes für das Zielvolume. Wenig Speicherplatz erzeugt eine Warnung
mit dem geprüften Pfad, blockiert das Update aber nicht, da Dateisystem-Quotas,
Snapshots und Netzwerk-Volumes sich nach der Prüfung ändern können. Die eigentliche npm-
Installation, das Kopieren und die Verifikation nach der Installation bleiben maßgeblich.

### Laufzeitabhängigkeiten gebündelter Plugins

Paketierte Installationen halten Laufzeitabhängigkeiten gebündelter Plugins aus dem schreibgeschützten
Paketbaum heraus. Beim Start und während `openclaw doctor --fix` repariert OpenClaw
Laufzeitabhängigkeiten nur für gebündelte Plugins, die in der Konfiguration aktiv sind, durch Legacy-Channel-Konfiguration aktiv sind
oder durch ihren gebündelten Manifest-Standard aktiviert werden.
Persistierter Channel-Authentifizierungszustand allein löst beim Gateway-Start keine
Reparatur von Laufzeitabhängigkeiten aus.

Explizite Deaktivierung hat Vorrang. Ein deaktiviertes Plugin oder ein deaktivierter Channel erhält keine
Reparatur seiner Laufzeitabhängigkeiten, nur weil es im Paket vorhanden ist. Externe
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

| Channel  | Verhalten                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (gestaffelter Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                                |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                         |

Das Gateway protokolliert außerdem beim Start einen Update-Hinweis (deaktivierbar mit `update.checkOnStart: false`).

## Nach dem Update

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert die Konfiguration, prüft DM-Richtlinien und den Gateway-Status. Details: [Doctor](/de/gateway/doctor)

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

Um zur neuesten Version zurückzukehren: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` auf Source-Checkouts bootstrappt der Updater bei Bedarf automatisch `pnpm`. Wenn Sie einen pnpm-/corepack-Bootstrap-Fehler sehen, installieren Sie `pnpm` manuell (oder aktivieren `corepack` erneut) und führen das Update erneut aus.
- Prüfen Sie: [Troubleshooting](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Install Overview](/de/install) — alle Installationsmethoden
- [Doctor](/de/gateway/doctor) — Health Checks nach Updates
- [Migrating](/de/install/migrating) — Migrationsanleitungen für Hauptversionen
