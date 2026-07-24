---
read_when:
    - Sie möchten Agent-Hooks verwalten
    - Sie möchten die Verfügbarkeit von Hooks prüfen oder Workspace-Hooks aktivieren
summary: CLI-Referenz für `openclaw hooks` (Agent-Hooks)
title: Hooks
x-i18n:
    generated_at: "2026-07-24T04:50:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d4d58ea2270cf5122018f7be2943401229929f48f448b15fdd126d1cc99e1e56
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Verwalten Sie Agent-Hooks (ereignisgesteuerte Automatisierungen für Befehle wie `/new`, `/reset` und den Start des Gateways). Ein alleinstehendes `openclaw hooks` entspricht `openclaw hooks list`.

Verwandte Themen: [Hooks](/de/automation/hooks) - [Plugin-Hooks](/de/plugins/hooks)

## Hooks auflisten

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Listet Hooks auf, die in Workspace-, verwalteten, zusätzlichen und gebündelten Verzeichnissen gefunden wurden.

- `--eligible`: nur Hooks, deren Anforderungen erfüllt sind.
- `--json`: strukturierte Ausgabe.
- `-v, --verbose`: fügt eine Spalte „Fehlend“ mit nicht erfüllten Anforderungen hinzu.

```
Hooks (4/5 bereit)

Bereit:
  🚀 boot-md ✓ - BOOT.md beim Start des Gateways ausführen
  📎 bootstrap-extra-files ✓ - Zusätzliche Workspace-Bootstrap-Dateien während des Agent-Bootstraps einfügen
  📝 command-logger ✓ - Alle Befehlsereignisse in einer zentralen Auditdatei protokollieren
  💾 session-memory ✓ - Sitzungskontext im Speicher sichern, wenn der Befehl /new oder /reset ausgeführt wird
```

## Hook-Informationen abrufen

```bash
openclaw hooks info <name> [--json]
```

`<name>` ist der Hook-Name oder Hook-Schlüssel (zum Beispiel `session-memory`). Zeigt Quelle, Datei-/Handler-Pfade, Homepage, Ereignisse und den Status jeder Anforderung (Binärdateien, Umgebung, Konfiguration, Betriebssystem).

## Eignung prüfen

```bash
openclaw hooks check [--json]
```

Gibt eine Zusammenfassung der Anzahl bereiter bzw. nicht bereiter Hooks aus. Wenn Hooks nicht bereit sind, werden sie jeweils mit dem blockierenden Grund aufgeführt.

## Einen Hook aktivieren

```bash
openclaw hooks enable <name>
```

Fügt `hooks.internal.entries.<name>.enabled = true` in der Konfiguration hinzu bzw. aktualisiert es und aktiviert außerdem den Hauptschalter `hooks.internal.enabled` (das Gateway lädt keinen internen Hook-Handler, solange nicht mindestens einer konfiguriert ist). Der Vorgang schlägt fehl, wenn der Hook nicht vorhanden ist, von einem Plugin verwaltet wird oder nicht geeignet ist (fehlende Anforderungen).

Von Plugins verwaltete Hooks zeigen `plugin:<id>` in `hooks list` an und können hier nicht aktiviert oder deaktiviert werden. Aktivieren oder deaktivieren Sie stattdessen das zugehörige Plugin.

Starten Sie das Gateway nach der Aktivierung neu (Neustart der macOS-Menüleisten-App oder im Entwicklungsbetrieb Neustart Ihres Gateway-Prozesses), damit es die Hooks neu lädt.

## Einen Hook deaktivieren

```bash
openclaw hooks disable <name>
```

Setzt `hooks.internal.entries.<name>.enabled = false`. Starten Sie anschließend das Gateway neu.

## Hook-Pakete installieren und aktualisieren

```bash
openclaw plugins install <package>        # standardmäßig npm
openclaw plugins install npm:<package>    # nur npm
openclaw plugins install <package> --pin  # aufgelöste Version fixieren
openclaw plugins install <path>           # lokales Verzeichnis oder Archiv
openclaw plugins install -l <path>        # lokales Verzeichnis verknüpfen statt kopieren

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Hook-Pakete werden über das einheitliche Installations- und Aktualisierungsprogramm für Plugins installiert. `openclaw hooks install` / `openclaw hooks update` funktionieren weiterhin als veraltete Aliasse, die eine Warnung ausgeben und an die `plugins`-Befehle weiterleiten.

- Npm-Spezifikationen sind ausschließlich für die Registry zulässig: Paketname plus optional eine exakte Version oder ein Dist-Tag. Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeiten werden projektlokal mit `--ignore-scripts` installiert.
- Unqualifizierte Spezifikationen und `@latest` bleiben im stabilen Kanal. Wenn npm eine Vorabversion auflöst, hält OpenClaw an und fordert Sie zur ausdrücklichen Zustimmung auf (`@beta`, `@rc` oder eine exakte Vorabversion).
- Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` verknüpft ein lokales Verzeichnis, statt es zu kopieren (und fügt es zu `hooks.internal.load.extraDirs` hinzu). Verknüpfte Hook-Pakete sind verwaltete Hooks aus einem vom Betreiber konfigurierten Verzeichnis, keine Workspace-Hooks.
- `--pin` erfasst npm-Installationen als exakt aufgelöstes `name@version` im gemeinsam genutzten SQLite-Zustand.
- Die Installation kopiert das Paket nach `~/.openclaw/hooks/<id>`, aktiviert seine Hooks unter `hooks.internal.entries.*` und erfasst die Installationsherkunft im gemeinsam genutzten SQLite-Zustand.
- Wenn ein gespeicherter Integritäts-Hash nicht mehr mit dem abgerufenen Artefakt übereinstimmt, warnt OpenClaw und fragt vor dem Fortfahren nach. Übergeben Sie die globale Option `--yes`, um die Abfrage zu umgehen (zum Beispiel in CI).

## Gebündelte Hooks

| Hook                  | Ereignisse                                        | Funktion                                                                                                  |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Führt `BOOT.md` beim Start des Gateways für jeden konfigurierten Agent-Gültigkeitsbereich aus   |
| bootstrap-extra-files | `agent:bootstrap`                                 | Fügt während des Agent-Bootstraps zusätzliche Bootstrap-Dateien ein (zum Beispiel Monorepo-`AGENTS.md`/`TOOLS.md`) |
| command-logger        | `command`                                 | Protokolliert Befehlsereignisse in `~/.openclaw/logs/commands.log`                                                     |
| compaction-notifier   | `session:compact:before`, `session:compact:after`             | Sendet sichtbare Chat-Benachrichtigungen, wenn die Sitzungs-Compaction beginnt und endet                  |
| session-memory        | `command:new`, `command:reset`             | Speichert den Sitzungskontext bei `/new` oder `/reset` im Speicher                  |

Aktivieren Sie einen beliebigen gebündelten Hook mit `openclaw hooks enable <hook-name>`. Vollständige Details, Konfigurationsschlüssel und Standardwerte: [Gebündelte Hooks](/de/automation/hooks#bundled-hooks).

### Protokolldatei von command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # letzte Befehle
cat ~/.openclaw/logs/commands.log | jq .          # formatiert ausgeben
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # nach Aktion filtern
```

## Hinweise

- `hooks list --json`, `info --json` und `check --json` schreiben strukturiertes JSON direkt nach stdout.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Automatisierungs-Hooks](/de/automation/hooks)
