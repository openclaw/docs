---
read_when:
    - Sie möchten Agent-Hooks verwalten
    - Sie möchten die Verfügbarkeit von Hooks prüfen oder Workspace-Hooks aktivieren
summary: CLI-Referenz für `openclaw hooks` (Agent-Hooks)
title: Hooks
x-i18n:
    generated_at: "2026-07-12T01:29:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Agent-Hooks verwalten (ereignisgesteuerte Automatisierungen für Befehle wie `/new`, `/reset` und den Gateway-Start). `openclaw hooks` ohne weitere Argumente entspricht `openclaw hooks list`.

Verwandte Themen: [Hooks](/de/automation/hooks) – [Plugin-Hooks](/de/plugins/hooks)

## Hooks auflisten

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Listet Hooks auf, die in Workspace-, verwalteten, zusätzlichen und gebündelten Verzeichnissen gefunden wurden.

- `--eligible`: nur Hooks, deren Anforderungen erfüllt sind.
- `--json`: strukturierte Ausgabe.
- `-v, --verbose`: fügt eine Spalte „Fehlend“ mit den nicht erfüllten Anforderungen hinzu.

```
Hooks (4/5 bereit)

Bereit:
  🚀 boot-md ✓ - BOOT.md beim Gateway-Start ausführen
  📎 bootstrap-extra-files ✓ - Beim Agent-Bootstrap zusätzliche Workspace-Bootstrap-Dateien einfügen
  📝 command-logger ✓ - Alle Befehlsereignisse in einer zentralen Auditdatei protokollieren
  💾 session-memory ✓ - Sitzungskontext im Speicher sichern, wenn der Befehl /new oder /reset ausgeführt wird
```

## Hook-Informationen abrufen

```bash
openclaw hooks info <name> [--json]
```

`<name>` ist der Hook-Name oder Hook-Schlüssel (zum Beispiel `session-memory`). Zeigt Quelle, Datei-/Handler-Pfade, Homepage, Ereignisse und den Status der einzelnen Anforderungen (Binärdateien, Umgebungsvariablen, Konfiguration, Betriebssystem).

## Verfügbarkeit prüfen

```bash
openclaw hooks check [--json]
```

Gibt eine Zusammenfassung der Anzahl bereiter bzw. nicht bereiter Hooks aus. Wenn Hooks nicht bereit sind, werden sie jeweils mit dem Grund für die Blockierung aufgelistet.

## Einen Hook aktivieren

```bash
openclaw hooks enable <name>
```

Fügt `hooks.internal.entries.<name>.enabled = true` zur Konfiguration hinzu oder aktualisiert den Wert und aktiviert außerdem den Hauptschalter `hooks.internal.enabled` (der Gateway lädt keine internen Hook-Handler, solange nicht mindestens einer konfiguriert ist). Der Vorgang schlägt fehl, wenn der Hook nicht vorhanden ist, von einem Plugin verwaltet wird oder aufgrund fehlender Anforderungen nicht verfügbar ist.

Von Plugins verwaltete Hooks zeigen in `hooks list` den Eintrag `plugin:<id>` und können hier nicht aktiviert oder deaktiviert werden. Aktivieren oder deaktivieren Sie stattdessen das zuständige Plugin.

Starten Sie den Gateway nach der Aktivierung neu (Neustart der macOS-Menüleisten-App oder im Entwicklungsbetrieb Neustart Ihres Gateway-Prozesses), damit die Hooks neu geladen werden.

## Einen Hook deaktivieren

```bash
openclaw hooks disable <name>
```

Setzt `hooks.internal.entries.<name>.enabled = false`. Starten Sie den Gateway anschließend neu.

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

Hook-Pakete werden über das einheitliche Installations- und Aktualisierungsprogramm für Plugins installiert. `openclaw hooks install` und `openclaw hooks update` funktionieren weiterhin als veraltete Aliase, die eine Warnung ausgeben und an die `plugins`-Befehle weiterleiten.

- Npm-Spezifikationen dürfen nur auf die Registry verweisen: Paketname sowie optional eine exakte Version oder ein Dist-Tag. Git-, URL- und Dateispezifikationen sowie SemVer-Bereiche werden abgelehnt. Abhängigkeiten werden projektlokal mit `--ignore-scripts` installiert.
- Spezifikationen ohne Zusatz und `@latest` bleiben auf dem stabilen Veröffentlichungskanal. Wenn npm eine Vorabversion auflöst, bricht OpenClaw ab und fordert Sie zur ausdrücklichen Zustimmung auf (`@beta`, `@rc` oder eine exakte Vorabversion).
- Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` verknüpft ein lokales Verzeichnis, anstatt es zu kopieren (es wird `hooks.internal.load.extraDirs` hinzugefügt). Verknüpfte Hook-Pakete sind verwaltete Hooks aus einem vom Betreiber konfigurierten Verzeichnis und keine Workspace-Hooks.
- `--pin` speichert npm-Installationen mit der exakt aufgelösten Angabe `name@version` in `hooks.internal.installs`.
- Die Installation kopiert das Paket nach `~/.openclaw/hooks/<id>`, aktiviert seine Hooks unter `hooks.internal.entries.*` und zeichnet die Installation unter `hooks.internal.installs` auf.
- Wenn ein gespeicherter Integritäts-Hash nicht mehr mit dem abgerufenen Artefakt übereinstimmt, warnt OpenClaw und fordert vor dem Fortfahren zur Bestätigung auf. Mit der globalen Option `--yes` können Sie die Abfrage umgehen, beispielsweise in CI.

## Gebündelte Hooks

| Hook                  | Ereignisse                                        | Funktion                                                                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Führt `BOOT.md` beim Gateway-Start für jeden konfigurierten Agent-Gültigkeitsbereich aus                       |
| bootstrap-extra-files | `agent:bootstrap`                                 | Fügt beim Agent-Bootstrap zusätzliche Bootstrap-Dateien ein (zum Beispiel `AGENTS.md`/`TOOLS.md` aus Monorepos) |
| command-logger        | `command`                                         | Protokolliert Befehlsereignisse in `~/.openclaw/logs/commands.log`                                             |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Sendet sichtbare Chat-Benachrichtigungen, wenn die Compaction der Sitzung beginnt und abgeschlossen ist       |
| session-memory        | `command:new`, `command:reset`                    | Speichert den Sitzungskontext bei `/new` oder `/reset` im Speicher                                             |

Aktivieren Sie einen beliebigen gebündelten Hook mit `openclaw hooks enable <hook-name>`. Vollständige Informationen, Konfigurationsschlüssel und Standardwerte: [Gebündelte Hooks](/de/automation/hooks#bundled-hooks).

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
