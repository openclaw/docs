---
read_when:
    - Sie möchten Agent-Hooks verwalten
    - Sie möchten die Verfügbarkeit von Hooks prüfen oder Workspace-Hooks aktivieren
summary: CLI-Referenz für `openclaw hooks` (Agent-Hooks)
title: Hooks
x-i18n:
    generated_at: "2026-07-12T15:06:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Verwalten Sie Agent-Hooks (ereignisgesteuerte Automatisierungen für Befehle wie `/new`, `/reset` und den Start des Gateways). `openclaw hooks` ohne weitere Argumente entspricht `openclaw hooks list`.

Verwandte Themen: [Hooks](/de/automation/hooks) – [Plugin-Hooks](/de/plugins/hooks)

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
  📎 bootstrap-extra-files ✓ - Zusätzliche Workspace-Bootstrap-Dateien während des Agent-Bootstraps einbinden
  📝 command-logger ✓ - Alle Befehlsereignisse in einer zentralen Auditdatei protokollieren
  💾 session-memory ✓ - Sitzungskontext im Speicher sichern, wenn der Befehl /new oder /reset ausgeführt wird
```

## Hook-Informationen abrufen

```bash
openclaw hooks info <name> [--json]
```

`<name>` ist der Hook-Name oder Hook-Schlüssel (zum Beispiel `session-memory`). Zeigt Quelle, Datei-/Handler-Pfade, Homepage, Ereignisse und den Status jeder Anforderung (Binärdateien, Umgebung, Konfiguration, Betriebssystem) an.

## Eignung prüfen

```bash
openclaw hooks check [--json]
```

Gibt eine Zusammenfassung der Anzahl bereiter bzw. nicht bereiter Hooks aus; bei nicht bereiten Hooks wird jeder Hook mit seinem blockierenden Grund aufgeführt.

## Einen Hook aktivieren

```bash
openclaw hooks enable <name>
```

Fügt `hooks.internal.entries.<name>.enabled = true` zur Konfiguration hinzu bzw. aktualisiert den Wert und aktiviert außerdem den Hauptschalter `hooks.internal.enabled` (das Gateway lädt keinen internen Hook-Handler, bis mindestens einer konfiguriert ist). Der Befehl schlägt fehl, wenn der Hook nicht existiert, von einem Plugin verwaltet wird oder nicht geeignet ist (fehlende Anforderungen).

Von Plugins verwaltete Hooks werden in `hooks list` als `plugin:<id>` angezeigt und können hier nicht aktiviert oder deaktiviert werden; aktivieren oder deaktivieren Sie stattdessen das zugehörige Plugin.

Starten Sie das Gateway nach der Aktivierung neu (Neustart der macOS-Menüleisten-App oder im Entwicklungsmodus Neustart Ihres Gateway-Prozesses), damit die Hooks neu geladen werden.

## Einen Hook deaktivieren

```bash
openclaw hooks disable <name>
```

Setzt `hooks.internal.entries.<name>.enabled = false`. Starten Sie das Gateway anschließend neu.

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

Hook-Pakete werden über das einheitliche Installations- und Aktualisierungsprogramm für Plugins installiert; `openclaw hooks install` / `openclaw hooks update` funktionieren weiterhin als veraltete Aliasse, die eine Warnung ausgeben und an die `plugins`-Befehle weiterleiten.

- Npm-Spezifikationen dürfen nur auf die Registry verweisen: Paketname plus optionale exakte Version oder optionales Dist-Tag. Git-/URL-/Dateispezifikationen und SemVer-Bereiche werden abgelehnt. Abhängigkeiten werden projektlokal mit `--ignore-scripts` installiert.
- Spezifikationen ohne Zusatz und `@latest` bleiben im stabilen Kanal; wenn npm eine Vorabversion auflöst, hält OpenClaw an und fordert Sie zur ausdrücklichen Zustimmung auf (`@beta`, `@rc` oder eine exakte Vorabversion).
- Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` verknüpft ein lokales Verzeichnis, statt es zu kopieren (es wird zu `hooks.internal.load.extraDirs` hinzugefügt); verknüpfte Hook-Pakete sind verwaltete Hooks aus einem vom Betreiber konfigurierten Verzeichnis, keine Workspace-Hooks.
- `--pin` zeichnet npm-Installationen als exakt aufgelöstes `name@version` in `hooks.internal.installs` auf.
- Die Installation kopiert das Paket nach `~/.openclaw/hooks/<id>`, aktiviert seine Hooks unter `hooks.internal.entries.*` und zeichnet die Installation unter `hooks.internal.installs` auf.
- Wenn ein gespeicherter Integritäts-Hash nicht mehr mit dem abgerufenen Artefakt übereinstimmt, warnt OpenClaw und fordert vor dem Fortfahren zur Bestätigung auf; übergeben Sie das globale Flag `--yes`, um die Abfrage zu überspringen (zum Beispiel in CI).

## Gebündelte Hooks

| Hook                  | Ereignisse                                        | Funktion                                                                                                      |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Führt `BOOT.md` beim Start des Gateways für jeden konfigurierten Agent-Bereich aus                             |
| bootstrap-extra-files | `agent:bootstrap`                                 | Bindet zusätzliche Bootstrap-Dateien (zum Beispiel `AGENTS.md`/`TOOLS.md` eines Monorepos) beim Agent-Bootstrap ein |
| command-logger        | `command`                                         | Protokolliert Befehlsereignisse in `~/.openclaw/logs/commands.log`                                             |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Sendet sichtbare Chat-Benachrichtigungen, wenn die Sitzungs-Compaction beginnt und endet                       |
| session-memory        | `command:new`, `command:reset`                    | Speichert den Sitzungskontext bei `/new` oder `/reset` im Speicher                                             |

Aktivieren Sie einen beliebigen gebündelten Hook mit `openclaw hooks enable <hook-name>`. Vollständige Details, Konfigurationsschlüssel und Standardwerte: [Gebündelte Hooks](/de/automation/hooks#bundled-hooks).

### Protokolldatei von command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # letzte Befehle
cat ~/.openclaw/logs/commands.log | jq .          # übersichtlich formatieren
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # nach Aktion filtern
```

## Hinweise

- `hooks list --json`, `info --json` und `check --json` schreiben strukturiertes JSON direkt nach stdout.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Automatisierungs-Hooks](/de/automation/hooks)
