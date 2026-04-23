---
read_when:
    - Sie möchten Agent-Hooks verwalten.
    - Sie möchten die Verfügbarkeit von Hooks prüfen oder Workspace-Hooks aktivieren.
summary: CLI-Referenz für `openclaw hooks` (Agent-Hooks)
title: Hooks
x-i18n:
    generated_at: "2026-04-23T06:26:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Verwalten Sie Agent-Hooks (ereignisgesteuerte Automatisierungen für Befehle wie `/new`, `/reset` und den Gateway-Start).

Die Ausführung von `openclaw hooks` ohne Unterbefehl entspricht `openclaw hooks list`.

Verwandt:

- Hooks: [Hooks](/de/automation/hooks)
- Plugin-Hooks: [Plugin hooks](/de/plugins/architecture#provider-runtime-hooks)

## Alle Hooks auflisten

```bash
openclaw hooks list
```

Listet alle erkannten Hooks aus Workspace-, verwalteten, zusätzlichen und gebündelten Verzeichnissen auf.
Beim Gateway-Start werden interne Hook-Handler erst geladen, wenn mindestens ein interner Hook konfiguriert ist.

**Optionen:**

- `--eligible`: Nur geeignete Hooks anzeigen (Anforderungen erfüllt)
- `--json`: Als JSON ausgeben
- `-v, --verbose`: Detaillierte Informationen einschließlich fehlender Anforderungen anzeigen

**Beispielausgabe:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
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

Gibt strukturiertes JSON für die programmgesteuerte Verwendung zurück.

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
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Hook-Eignung prüfen

```bash
openclaw hooks check
```

Zeigt eine Zusammenfassung des Hook-Eignungsstatus an (wie viele bereit vs. nicht bereit sind).

**Optionen:**

- `--json`: Als JSON ausgeben

**Beispielausgabe:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Einen Hook aktivieren

```bash
openclaw hooks enable <name>
```

Aktiviert einen bestimmten Hook, indem er Ihrer Konfiguration hinzugefügt wird (standardmäßig `~/.openclaw/openclaw.json`).

**Hinweis:** Workspace-Hooks sind standardmäßig deaktiviert, bis sie hier oder in der Konfiguration aktiviert werden. Von Plugins verwaltete Hooks zeigen `plugin:<id>` in `openclaw hooks list` an und können hier nicht aktiviert/deaktiviert werden. Aktivieren bzw. deaktivieren Sie stattdessen das Plugin.

**Argumente:**

- `<name>`: Hook-Name (z. B. `session-memory`)

**Beispiel:**

```bash
openclaw hooks enable session-memory
```

**Ausgabe:**

```
✓ Enabled hook: 💾 session-memory
```

**Was dies bewirkt:**

- Prüft, ob der Hook existiert und geeignet ist
- Aktualisiert `hooks.internal.entries.<name>.enabled = true` in Ihrer Konfiguration
- Speichert die Konfiguration auf dem Datenträger

Wenn der Hook aus `<workspace>/hooks/` stammt, ist dieser Opt-in-Schritt erforderlich, bevor
das Gateway ihn lädt.

**Nach dem Aktivieren:**

- Starten Sie das Gateway neu, damit Hooks neu geladen werden (Neustart der Menüleisten-App auf macOS oder Neustart Ihres Gateway-Prozesses in der Entwicklung).

## Einen Hook deaktivieren

```bash
openclaw hooks disable <name>
```

Deaktiviert einen bestimmten Hook durch Aktualisieren Ihrer Konfiguration.

**Argumente:**

- `<name>`: Hook-Name (z. B. `command-logger`)

**Beispiel:**

```bash
openclaw hooks disable command-logger
```

**Ausgabe:**

```
⏸ Disabled hook: 📝 command-logger
```

**Nach dem Deaktivieren:**

- Starten Sie das Gateway neu, damit Hooks neu geladen werden

## Hinweise

- `openclaw hooks list --json`, `info --json` und `check --json` schreiben strukturiertes JSON direkt in stdout.
- Von Plugins verwaltete Hooks können hier nicht aktiviert oder deaktiviert werden; aktivieren oder deaktivieren Sie stattdessen das besitzende Plugin.

## Hook-Pakete installieren

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installieren Sie Hook-Pakete über das einheitliche Plugin-Installationsprogramm.

`openclaw hooks install` funktioniert weiterhin als Kompatibilitätsalias, gibt aber eine
Veraltungswarnung aus und leitet an `openclaw plugins install` weiter.

Npm-Spezifikationen sind **nur für Registries** (Paketname + optionale **exakte Version** oder
**Dist-Tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen mit `--ignore-scripts`.

Einfache Spezifikationen und `@latest` bleiben auf dem stabilen Kanal. Wenn npm eines
davon auf eine Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, explizit mit einem
Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversion zuzustimmen.

**Was dies bewirkt:**

- Kopiert das Hook-Paket nach `~/.openclaw/hooks/<id>`
- Aktiviert die installierten Hooks in `hooks.internal.entries.*`
- Zeichnet die Installation unter `hooks.internal.installs` auf

**Optionen:**

- `-l, --link`: Ein lokales Verzeichnis verknüpfen statt kopieren (fügt es zu `hooks.internal.load.extraDirs` hinzu)
- `--pin`: Npm-Installationen als exakt aufgelöstes `name@version` in `hooks.internal.installs` speichern

**Unterstützte Archive:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Beispiele:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Verknüpfte Hook-Pakete werden als verwaltete Hooks aus einem vom Betreiber konfigurierten
Verzeichnis behandelt, nicht als Workspace-Hooks.

## Hook-Pakete aktualisieren

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualisieren Sie verfolgte npm-basierte Hook-Pakete über das einheitliche Plugin-Aktualisierungsprogramm.

`openclaw hooks update` funktioniert weiterhin als Kompatibilitätsalias, gibt aber eine
Veraltungswarnung aus und leitet an `openclaw plugins update` weiter.

**Optionen:**

- `--all`: Alle verfolgten Hook-Pakete aktualisieren
- `--dry-run`: Anzeigen, was sich ändern würde, ohne zu schreiben

Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert,
gibt OpenClaw eine Warnung aus und fordert vor dem Fortfahren eine Bestätigung an. Verwenden Sie
global `--yes`, um Eingabeaufforderungen in CI-/nicht interaktiven Ausführungen zu umgehen.

## Gebündelte Hooks

### session-memory

Speichert den Sitzungskontext im Speicher, wenn Sie `/new` oder `/reset` ausführen.

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

Protokolliert alle Befehlsereignisse in einer zentralen Audit-Datei.

**Aktivieren:**

```bash
openclaw hooks enable command-logger
```

**Ausgabe:** `~/.openclaw/logs/commands.log`

**Logs anzeigen:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Siehe:** [command-logger-Dokumentation](/de/automation/hooks#command-logger)

### boot-md

Führt `BOOT.md` aus, wenn das Gateway startet (nachdem die Channels gestartet wurden).

**Ereignisse**: `gateway:startup`

**Aktivieren**:

```bash
openclaw hooks enable boot-md
```

**Siehe:** [boot-md-Dokumentation](/de/automation/hooks#boot-md)
