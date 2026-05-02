---
read_when:
    - Sie möchten Agent-Hooks verwalten
    - Sie möchten die Verfügbarkeit von Hooks prüfen oder Hooks für den Arbeitsbereich aktivieren
summary: CLI-Referenz für `openclaw hooks` (Agent-Hooks)
title: Einhängepunkte
x-i18n:
    generated_at: "2026-05-02T20:44:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Agent-Hooks verwalten (ereignisgesteuerte Automatisierungen für Befehle wie `/new`, `/reset` und den Gateway-Start).

Das Ausführen von `openclaw hooks` ohne Unterbefehl entspricht `openclaw hooks list`.

Verwandt:

- Hooks: [Hooks](/de/automation/hooks)
- Plugin-Hooks: [Plugin-Hooks](/de/plugins/hooks)

## Alle Hooks auflisten

```bash
openclaw hooks list
```

Listet alle erkannten Hooks aus Arbeitsbereichs-, verwalteten, zusätzlichen und gebündelten Verzeichnissen auf.
Der Gateway-Start lädt interne Hook-Handler erst, wenn mindestens ein interner Hook konfiguriert ist.

**Optionen:**

- `--eligible`: Nur geeignete Hooks anzeigen (Anforderungen erfüllt)
- `--json`: Ausgabe als JSON
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

Zeigt fehlende Anforderungen für ungeeignete Hooks an.

**Beispiel (JSON):**

```bash
openclaw hooks list --json
```

Gibt strukturiertes JSON für die programmatische Verwendung zurück.

## Hook-Informationen abrufen

```bash
openclaw hooks info <name>
```

Detaillierte Informationen zu einem bestimmten Hook anzeigen.

**Argumente:**

- `<name>`: Hook-Name oder Hook-Schlüssel (z. B. `session-memory`)

**Optionen:**

- `--json`: Ausgabe als JSON

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

- `--json`: Ausgabe als JSON

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

**Hinweis:** Arbeitsbereichs-Hooks sind standardmäßig deaktiviert, bis sie hier oder in der Konfiguration aktiviert werden. Von Plugins verwaltete Hooks zeigen `plugin:<id>` in `openclaw hooks list` an und können hier nicht aktiviert/deaktiviert werden. Aktivieren/deaktivieren Sie stattdessen das Plugin.

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

**Was dabei geschieht:**

- Prüft, ob der Hook existiert und geeignet ist
- Aktualisiert `hooks.internal.entries.<name>.enabled = true` in Ihrer Konfiguration
- Speichert die Konfiguration auf der Festplatte

Wenn der Hook aus `<workspace>/hooks/` stammt, ist dieser Opt-in-Schritt erforderlich, bevor
der Gateway ihn lädt.

**Nach dem Aktivieren:**

- Starten Sie den Gateway neu, damit Hooks neu geladen werden (Neustart der Menüleisten-App unter macOS oder Neustart Ihres Gateway-Prozesses in der Entwicklung).

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

- Starten Sie den Gateway neu, damit Hooks neu geladen werden

## Hinweise

- `openclaw hooks list --json`, `info --json` und `check --json` schreiben strukturiertes JSON direkt nach stdout.
- Von Plugins verwaltete Hooks können hier nicht aktiviert oder deaktiviert werden; aktivieren oder deaktivieren Sie stattdessen das zugehörige Plugin.

## Hook-Pakete installieren

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installieren Sie Hook-Pakete über das vereinheitlichte Plugin-Installationsprogramm.

`openclaw hooks install` funktioniert weiterhin als Kompatibilitätsalias, gibt aber eine
Veraltungswarnung aus und leitet an `openclaw plugins install` weiter.

Npm-Spezifikationen sind **nur Registry** (Paketname + optionale **exakte Version** oder
**dist-tag**). Git-/URL-/Datei-Spezifikationen und semver-Bereiche werden abgelehnt. Dependency-
Installationen werden aus Sicherheitsgründen projektlokal mit `--ignore-scripts` ausgeführt, selbst wenn Ihre
Shell globale npm-Installationseinstellungen hat.

Bare-Spezifikationen und `@latest` bleiben auf dem stabilen Kanal. Wenn npm eines von
beidem zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem
Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version dafür zu entscheiden.

**Was dabei geschieht:**

- Kopiert das Hook-Paket nach `~/.openclaw/hooks/<id>`
- Aktiviert die installierten Hooks in `hooks.internal.entries.*`
- Zeichnet die Installation unter `hooks.internal.installs` auf

**Optionen:**

- `-l, --link`: Ein lokales Verzeichnis verknüpfen, statt es zu kopieren (fügt es zu `hooks.internal.load.extraDirs` hinzu)
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

Verknüpfte Hook-Pakete werden als verwaltete Hooks aus einem vom Operator konfigurierten
Verzeichnis behandelt, nicht als Arbeitsbereichs-Hooks.

## Hook-Pakete aktualisieren

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualisieren Sie nachverfolgte npm-basierte Hook-Pakete über den vereinheitlichten Plugin-Aktualisierer.

`openclaw hooks update` funktioniert weiterhin als Kompatibilitätsalias, gibt aber eine
Veraltungswarnung aus und leitet an `openclaw plugins update` weiter.

**Optionen:**

- `--all`: Alle nachverfolgten Hook-Pakete aktualisieren
- `--dry-run`: Anzeigen, was sich ändern würde, ohne zu schreiben

Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert,
gibt OpenClaw eine Warnung aus und fragt vor dem Fortfahren nach Bestätigung. Verwenden Sie
das globale `--yes`, um Eingabeaufforderungen in CI-/nicht interaktiven Läufen zu umgehen.

## Gebündelte Hooks

### session-memory

Speichert Sitzungskontext im Speicher, wenn Sie `/new` oder `/reset` ausgeben.

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

Protokolliert alle Befehlsereignisse in einer zentralisierten Audit-Datei.

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
