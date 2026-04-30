---
read_when:
    - Sie möchten Agent-Hooks verwalten
    - Sie möchten die Hook-Verfügbarkeit prüfen oder Arbeitsbereichs-Hooks aktivieren
summary: CLI-Referenz für `openclaw hooks` (Agent-Hooks)
title: Einhängepunkte
x-i18n:
    generated_at: "2026-04-30T06:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Verwalten Sie Agent-Hooks (ereignisgesteuerte Automatisierungen für Befehle wie `/new`, `/reset` und den Gateway-Start).

Das Ausführen von `openclaw hooks` ohne Unterbefehl entspricht `openclaw hooks list`.

Verwandt:

- Hooks: [Hooks](/de/automation/hooks)
- Plugin-Hooks: [Plugin-Hooks](/de/plugins/hooks)

## Alle Hooks auflisten

```bash
openclaw hooks list
```

List all discovered hooks from workspace, managed, extra, and bundled directories.
Gateway startup does not load internal hook handlers until at least one internal hook is configured.

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

Gibt strukturiertes JSON für die programmgesteuerte Nutzung zurück.

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

Zeigt eine Zusammenfassung des Eignungsstatus der Hooks an (wie viele bereit bzw. nicht bereit sind).

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

Aktiviert einen bestimmten Hook, indem er zu Ihrer Konfiguration hinzugefügt wird (standardmäßig `~/.openclaw/openclaw.json`).

**Hinweis:** Workspace-Hooks sind standardmäßig deaktiviert, bis sie hier oder in der Konfiguration aktiviert werden. Von Plugins verwaltete Hooks zeigen `plugin:<id>` in `openclaw hooks list` an und können hier nicht aktiviert/deaktiviert werden. Aktivieren/deaktivieren Sie stattdessen das Plugin.

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

**Was es macht:**

- Prüft, ob der Hook existiert und geeignet ist
- Aktualisiert `hooks.internal.entries.<name>.enabled = true` in Ihrer Konfiguration
- Speichert die Konfiguration auf der Festplatte

Wenn der Hook aus `<workspace>/hooks/` stammt, ist dieser Opt-in-Schritt erforderlich, bevor
der Gateway ihn lädt.

**Nach der Aktivierung:**

- Starten Sie den Gateway neu, damit Hooks neu geladen werden (Neustart der Menüleisten-App unter macOS oder Neustart Ihres Gateway-Prozesses in der Entwicklung).

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
⏸ Disabled hook: 📝 command-logger
```

**Nach der Deaktivierung:**

- Starten Sie den Gateway neu, damit Hooks neu geladen werden

## Hinweise

- `openclaw hooks list --json`, `info --json` und `check --json` schreiben strukturiertes JSON direkt nach stdout.
- Von Plugins verwaltete Hooks können hier nicht aktiviert oder deaktiviert werden; aktivieren oder deaktivieren Sie stattdessen das zugehörige Plugin.

## Hook-Packs installieren

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installieren Sie Hook-Packs über den einheitlichen Plugin-Installer.

`openclaw hooks install` funktioniert weiterhin als Kompatibilitätsalias, gibt aber eine
Veraltungswarnung aus und leitet an `openclaw plugins install` weiter.

Npm-Spezifikationen sind **nur registrybasiert** (Paketname + optionale **exakte Version** oder
**dist-tag**). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen projektlokal mit `--ignore-scripts`, selbst wenn Ihre
Shell globale npm-Installationseinstellungen hat.

Bloße Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eines von
beiden zu einer Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem
Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversion dafür zu entscheiden.

**Was es macht:**

- Kopiert das Hook-Pack nach `~/.openclaw/hooks/<id>`
- Aktiviert die installierten Hooks in `hooks.internal.entries.*`
- Zeichnet die Installation unter `hooks.internal.installs` auf

**Optionen:**

- `-l, --link`: Ein lokales Verzeichnis verlinken statt kopieren (fügt es zu `hooks.internal.load.extraDirs` hinzu)
- `--pin`: npm-Installationen als exakt aufgelöstes `name@version` in `hooks.internal.installs` aufzeichnen

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

Verlinkte Hook-Packs werden als verwaltete Hooks aus einem vom Operator konfigurierten
Verzeichnis behandelt, nicht als Workspace-Hooks.

## Hook-Packs aktualisieren

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualisieren Sie nachverfolgte npm-basierte Hook-Packs über den einheitlichen Plugin-Updater.

`openclaw hooks update` funktioniert weiterhin als Kompatibilitätsalias, gibt aber eine
Veraltungswarnung aus und leitet an `openclaw plugins update` weiter.

**Optionen:**

- `--all`: Alle nachverfolgten Hook-Packs aktualisieren
- `--dry-run`: Anzeigen, was sich ändern würde, ohne zu schreiben

Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert,
gibt OpenClaw eine Warnung aus und bittet vor dem Fortfahren um Bestätigung. Verwenden Sie
global `--yes`, um Eingabeaufforderungen in CI-/nicht interaktiven Läufen zu umgehen.

## Gebündelte Hooks

### session-memory

Speichert Sitzungskontext im Speicher, wenn Sie `/new` oder `/reset` ausführen.

**Aktivieren:**

```bash
openclaw hooks enable session-memory
```

**Ausgabe:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Siehe:** [session-memory-Dokumentation](/de/automation/hooks#session-memory)

### bootstrap-extra-files

Injiziert zusätzliche Bootstrap-Dateien (zum Beispiel monorepo-lokale `AGENTS.md` / `TOOLS.md`) während `agent:bootstrap`.

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

Führt `BOOT.md` aus, wenn der Gateway startet (nachdem Kanäle gestartet wurden).

**Ereignisse**: `gateway:startup`

**Aktivieren**:

```bash
openclaw hooks enable boot-md
```

**Siehe:** [boot-md-Dokumentation](/de/automation/hooks#boot-md)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Automatisierungs-Hooks](/de/automation/hooks)
