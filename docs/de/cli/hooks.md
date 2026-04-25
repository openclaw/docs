---
read_when:
    - Sie möchten Agent-Hooks verwalten.
    - Sie möchten die Verfügbarkeit von Hooks prüfen oder Workspace-Hooks aktivieren.
summary: CLI-Referenz für `openclaw hooks` (Agent-Hooks)
title: Hooks
x-i18n:
    generated_at: "2026-04-25T13:43:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Agent-Hooks verwalten (ereignisgesteuerte Automatisierungen für Befehle wie `/new`, `/reset` und den Gateway-Start).

Das Ausführen von `openclaw hooks` ohne Unterbefehl entspricht `openclaw hooks list`.

Verwandt:

- Hooks: [Hooks](/de/automation/hooks)
- Plugin-Hooks: [Plugin hooks](/de/plugins/hooks)

## Alle Hooks auflisten

```bash
openclaw hooks list
```

Listet alle erkannten Hooks aus Workspace-, verwalteten, zusätzlichen und gebündelten Verzeichnissen auf.
Der Gateway-Start lädt keine internen Hook-Handler, bis mindestens ein interner Hook konfiguriert ist.

**Optionen:**

- `--eligible`: Nur geeignete Hooks anzeigen (Anforderungen erfüllt)
- `--json`: Als JSON ausgeben
- `-v, --verbose`: Detaillierte Informationen einschließlich fehlender Anforderungen anzeigen

**Beispielausgabe:**

```
Hooks (4/4 bereit)

Bereit:
  🚀 boot-md ✓ - BOOT.md beim Gateway-Start ausführen
  📎 bootstrap-extra-files ✓ - Zusätzliche Workspace-Bootstrap-Dateien während des Agent-Bootstraps einfügen
  📝 command-logger ✓ - Alle Befehlsereignisse in eine zentrale Audit-Datei protokollieren
  💾 session-memory ✓ - Sitzungskontext im Speicher sichern, wenn der Befehl /new oder /reset ausgeführt wird
```

**Beispiel (ausführlich):**

```bash
openclaw hooks list --verbose
```

Zeigt fehlende Anforderungen für nicht geeignete Hooks an.

**Beispiel (JSON):**

```bash
openclaw hooks list --json
```

Gibt strukturiertes JSON zur programmatischen Verwendung zurück.

## Hook-Informationen abrufen

```bash
openclaw hooks info <name>
```

Zeigt detaillierte Informationen zu einem bestimmten Hook an.

**Argumente:**

- `<name>`: Hook-Name oder Hook-Schlüssel (z. B. `session-memory`)

**Optionen:**

- `--json`: Als JSON ausgeben

**Beispiel:**

```bash
openclaw hooks info session-memory
```

**Ausgabe:**

```
💾 session-memory ✓ Bereit

Sitzungskontext im Speicher sichern, wenn der Befehl /new oder /reset ausgeführt wird

Details:
  Quelle: openclaw-bundled
  Pfad: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Ereignisse: command:new, command:reset

Anforderungen:
  Konfiguration: ✓ workspace.dir
```

## Hook-Eignung prüfen

```bash
openclaw hooks check
```

Zeigt eine Zusammenfassung des Eignungsstatus der Hooks an (wie viele bereit bzw. nicht bereit sind).

**Optionen:**

- `--json`: Als JSON ausgeben

**Beispielausgabe:**

```
Hook-Status

Hooks insgesamt: 4
Bereit: 4
Nicht bereit: 0
```

## Einen Hook aktivieren

```bash
openclaw hooks enable <name>
```

Aktiviert einen bestimmten Hook, indem er Ihrer Konfiguration hinzugefügt wird (standardmäßig `~/.openclaw/openclaw.json`).

**Hinweis:** Workspace-Hooks sind standardmäßig deaktiviert, bis sie hier oder in der Konfiguration aktiviert werden. Von Plugins verwaltete Hooks zeigen `plugin:<id>` in `openclaw hooks list` an und können hier nicht aktiviert/deaktiviert werden. Aktivieren/deaktivieren Sie stattdessen das Plugin.

**Argumente:**

- `<name>`: Hook-Name (z. B. `session-memory`)

**Beispiel:**

```bash
openclaw hooks enable session-memory
```

**Ausgabe:**

```
✓ Hook aktiviert: 💾 session-memory
```

**Was dies macht:**

- Prüft, ob der Hook existiert und geeignet ist
- Aktualisiert `hooks.internal.entries.<name>.enabled = true` in Ihrer Konfiguration
- Speichert die Konfiguration auf dem Datenträger

Wenn der Hook aus `<workspace>/hooks/` stammt, ist dieser Opt-in-Schritt erforderlich, bevor
das Gateway ihn lädt.

**Nach der Aktivierung:**

- Starten Sie das Gateway neu, damit Hooks neu geladen werden (Neustart der Menüleisten-App auf macOS oder Neustart Ihres Gateway-Prozesses in der Entwicklung).

## Einen Hook deaktivieren

```bash
openclaw hooks disable <name>
```

Deaktiviert einen bestimmten Hook durch Aktualisierung Ihrer Konfiguration.

**Argumente:**

- `<name>`: Hook-Name (z. B. `command-logger`)

**Beispiel:**

```bash
openclaw hooks disable command-logger
```

**Ausgabe:**

```
⏸ Hook deaktiviert: 📝 command-logger
```

**Nach der Deaktivierung:**

- Starten Sie das Gateway neu, damit Hooks neu geladen werden

## Hinweise

- `openclaw hooks list --json`, `info --json` und `check --json` schreiben strukturiertes JSON direkt nach stdout.
- Von Plugins verwaltete Hooks können hier nicht aktiviert oder deaktiviert werden; aktivieren oder deaktivieren Sie stattdessen das zugehörige Plugin.

## Hook-Pakete installieren

```bash
openclaw plugins install <package>        # zuerst ClawHub, dann npm
openclaw plugins install <package> --pin  # Version fixieren
openclaw plugins install <path>           # lokaler Pfad
```

Installieren Sie Hook-Pakete über das einheitliche Plugin-Installationsprogramm.

`openclaw hooks install` funktioniert weiterhin als Kompatibilitätsalias, gibt jedoch eine
Veraltungwarnung aus und leitet an `openclaw plugins install` weiter.

Npm-Spezifikationen sind **nur für die Registry** (Paketname plus optionale **exakte Version** oder
**Dist-Tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeits-
installationen laufen aus Sicherheitsgründen mit `--ignore-scripts`.

Reine Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eines von beiden
zu einer Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, explizit mit einem
Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversionsnummer zuzustimmen.

**Was dies macht:**

- Kopiert das Hook-Paket nach `~/.openclaw/hooks/<id>`
- Aktiviert die installierten Hooks in `hooks.internal.entries.*`
- Erfasst die Installation unter `hooks.internal.installs`

**Optionen:**

- `-l, --link`: Ein lokales Verzeichnis verknüpfen statt kopieren (fügt es zu `hooks.internal.load.extraDirs` hinzu)
- `--pin`: Npm-Installationen als exakt aufgelöstes `name@version` in `hooks.internal.installs` erfassen

**Unterstützte Archive:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Beispiele:**

```bash
# Lokales Verzeichnis
openclaw plugins install ./my-hook-pack

# Lokales Archiv
openclaw plugins install ./my-hook-pack.zip

# NPM-Paket
openclaw plugins install @openclaw/my-hook-pack

# Ein lokales Verzeichnis verknüpfen, ohne es zu kopieren
openclaw plugins install -l ./my-hook-pack
```

Verknüpfte Hook-Pakete werden als verwaltete Hooks aus einem vom Operator konfigurierten
Verzeichnis behandelt, nicht als Workspace-Hooks.

## Hook-Pakete aktualisieren

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualisieren Sie nachverfolgte npm-basierte Hook-Pakete über das einheitliche Plugin-Aktualisierungsprogramm.

`openclaw hooks update` funktioniert weiterhin als Kompatibilitätsalias, gibt jedoch eine
Veraltungswarnung aus und leitet an `openclaw plugins update` weiter.

**Optionen:**

- `--all`: Alle nachverfolgten Hook-Pakete aktualisieren
- `--dry-run`: Anzeigen, was sich ändern würde, ohne zu schreiben

Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert,
gibt OpenClaw eine Warnung aus und fordert vor dem Fortfahren eine Bestätigung an. Verwenden Sie global
`--yes`, um Abfragen in CI-/nicht interaktiven Läufen zu umgehen.

## Gebündelte Hooks

### session-memory

Sichert Sitzungskontext im Speicher, wenn Sie `/new` oder `/reset` ausführen.

**Aktivieren:**

```bash
openclaw hooks enable session-memory
```

**Ausgabe:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Siehe:** [session-memory-Dokumentation](/de/automation/hooks#session-memory)

### bootstrap-extra-files

Fügt während `agent:bootstrap` zusätzliche Bootstrap-Dateien ein (zum Beispiel monorepo-lokale `AGENTS.md` / `TOOLS.md`).

**Aktivieren:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Siehe:** [bootstrap-extra-files-Dokumentation](/de/automation/hooks#bootstrap-extra-files)

### command-logger

Protokolliert alle Befehlsereignisse in eine zentrale Audit-Datei.

**Aktivieren:**

```bash
openclaw hooks enable command-logger
```

**Ausgabe:** `~/.openclaw/logs/commands.log`

**Logs anzeigen:**

```bash
# Aktuelle Befehle
tail -n 20 ~/.openclaw/logs/commands.log

# Formatiert ausgeben
cat ~/.openclaw/logs/commands.log | jq .

# Nach Aktion filtern
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Siehe:** [command-logger-Dokumentation](/de/automation/hooks#command-logger)

### boot-md

Führt `BOOT.md` aus, wenn das Gateway startet (nach dem Start der Channels).

**Ereignisse**: `gateway:startup`

**Aktivieren**:

```bash
openclaw hooks enable boot-md
```

**Siehe:** [boot-md-Dokumentation](/de/automation/hooks#boot-md)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Automatisierungs-Hooks](/de/automation/hooks)
