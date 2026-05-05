---
read_when:
    - Sie möchten ereignisgesteuerte Automatisierung für /new, /reset, /stop und Agent-Lebenszyklusereignisse
    - Sie möchten Hooks erstellen, installieren oder debuggen
summary: 'Hooks: ereignisgesteuerte Automatisierung für Befehle und Lebenszyklusereignisse'
title: Hooks
x-i18n:
    generated_at: "2026-05-05T08:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Hooks sind kleine Skripte, die ausgeführt werden, wenn im Gateway etwas passiert. Sie können aus Verzeichnissen erkannt und mit `openclaw hooks` geprüft werden. Das Gateway lädt interne Hooks erst, nachdem Sie Hooks aktiviert oder mindestens einen Hook-Eintrag, ein Hook-Pack, einen Legacy-Handler oder ein zusätzliches Hook-Verzeichnis konfiguriert haben.

In OpenClaw gibt es zwei Arten von Hooks:

- **Interne Hooks** (diese Seite): werden im Gateway ausgeführt, wenn Agent-Ereignisse ausgelöst werden, z. B. `/new`, `/reset`, `/stop` oder Lebenszyklusereignisse.
- **Webhooks**: externe HTTP-Endpunkte, mit denen andere Systeme Arbeit in OpenClaw auslösen können. Siehe [Webhooks](/de/automation/cron-jobs#webhooks).

Hooks können auch in Plugins gebündelt werden. `openclaw hooks list` zeigt sowohl eigenständige Hooks als auch Plugin-verwaltete Hooks an.

## Schnellstart

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Ereignistypen

| Ereignis                 | Wann es ausgelöst wird                                     |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Befehl `/new` ausgegeben                                   |
| `command:reset`          | Befehl `/reset` ausgegeben                                 |
| `command:stop`           | Befehl `/stop` ausgegeben                                  |
| `command`                | Beliebiges Befehlsereignis (allgemeiner Listener)          |
| `session:compact:before` | Bevor Compaction den Verlauf zusammenfasst                 |
| `session:compact:after`  | Nachdem Compaction abgeschlossen ist                       |
| `session:patch`          | Wenn Sitzungseigenschaften geändert werden                 |
| `agent:bootstrap`        | Bevor Workspace-Bootstrap-Dateien eingefügt werden         |
| `gateway:startup`        | Nachdem Channels gestartet und Hooks geladen wurden        |
| `gateway:shutdown`       | Wenn das Herunterfahren des Gateways beginnt               |
| `gateway:pre-restart`    | Vor einem erwarteten Gateway-Neustart                      |
| `message:received`       | Eingehende Nachricht aus einem beliebigen Channel          |
| `message:transcribed`    | Nachdem die Audiotranskription abgeschlossen ist           |
| `message:preprocessed`   | Nachdem Medien- und Link-Vorverarbeitung abgeschlossen ist oder übersprungen wurde |
| `message:sent`           | Ausgehende Nachricht zugestellt                            |

## Hooks schreiben

### Hook-Struktur

Jeder Hook ist ein Verzeichnis mit zwei Dateien:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### HOOK.md-Format

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Metadatenfelder** (`metadata.openclaw`):

| Feld       | Beschreibung                                         |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Anzeige-Emoji für die CLI                            |
| `events`   | Array von Ereignissen, auf die gewartet wird         |
| `export`   | Zu verwendender benannter Export (Standard ist `"default"`) |
| `os`       | Erforderliche Plattformen (z. B. `["darwin", "linux"]`) |
| `requires` | Erforderliche `bins`-, `anyBins`-, `env`- oder `config`-Pfade |
| `always`   | Eignungsprüfungen umgehen (boolesch)                 |
| `install`  | Installationsmethoden                                |

### Handler-Implementierung

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Jedes Ereignis enthält: `type`, `action`, `sessionKey`, `timestamp`, `messages` (per Push senden Sie an den Benutzer) und `context` (ereignisspezifische Daten). Hook-Kontexte von Agent- und Tool-Plugins können außerdem `trace` enthalten, einen schreibgeschützten, W3C-kompatiblen diagnostischen Trace-Kontext, den Plugins zur OTEL-Korrelation an strukturierte Logs übergeben können.

### Wichtige Ereigniskontexte

**Befehlsereignisse** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Nachrichtenereignisse** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (Provider-spezifische Daten einschließlich `senderId`, `senderName`, `guildId`). `context.content` bevorzugt bei befehlsartigen Nachrichten einen nicht leeren Befehlsinhalt, fällt dann auf den rohen eingehenden Inhalt und den generischen Inhalt zurück; es enthält keine rein Agent-seitige Anreicherung wie Thread-Verlauf oder Link-Zusammenfassungen.

**Nachrichtenereignisse** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Nachrichtenereignisse** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Nachrichtenereignisse** (`message:preprocessed`): `context.bodyForAgent` (endgültig angereicherter Inhalt), `context.from`, `context.channelId`.

**Bootstrap-Ereignisse** (`agent:bootstrap`): `context.bootstrapFiles` (änderbares Array), `context.agentId`.

**Sitzungs-Patch-Ereignisse** (`session:patch`): `context.sessionEntry`, `context.patch` (nur geänderte Felder), `context.cfg`. Nur privilegierte Clients können Patch-Ereignisse auslösen.

**Compaction-Ereignisse**: `session:compact:before` enthält `messageCount`, `tokenCount`. `session:compact:after` fügt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` hinzu.

`command:stop` beobachtet, dass der Benutzer `/stop` ausgibt; es gehört zum Abbruch-/Befehlslebenszyklus, ist aber kein Gate für die Agent-Finalisierung. Plugins, die eine natürliche Abschlussantwort prüfen und den Agent um einen weiteren Durchlauf bitten müssen, sollten stattdessen den typisierten Plugin-Hook `before_agent_finalize` verwenden. Siehe [Plugin-Hooks](/de/plugins/hooks).

**Gateway-Lebenszyklusereignisse**: `gateway:shutdown` enthält `reason` und `restartExpectedMs` und wird ausgelöst, wenn das Herunterfahren des Gateways beginnt. `gateway:pre-restart` enthält denselben Kontext, wird aber nur ausgelöst, wenn das Herunterfahren Teil eines erwarteten Neustarts ist und ein endlicher Wert für `restartExpectedMs` bereitgestellt wird. Während des Herunterfahrens ist das Warten auf jeden Lebenszyklus-Hook Best-Effort und begrenzt, sodass das Herunterfahren fortgesetzt wird, falls ein Handler hängen bleibt.

## Hook-Erkennung

Hooks werden aus diesen Verzeichnissen erkannt, in der Reihenfolge zunehmender Überschreibungspriorität:

1. **Gebündelte Hooks**: werden mit OpenClaw ausgeliefert
2. **Plugin-Hooks**: Hooks, die in installierten Plugins gebündelt sind
3. **Verwaltete Hooks**: `~/.openclaw/hooks/` (vom Benutzer installiert, über Workspaces hinweg geteilt). Zusätzliche Verzeichnisse aus `hooks.internal.load.extraDirs` teilen diese Priorität.
4. **Workspace-Hooks**: `<workspace>/hooks/` (pro Agent, standardmäßig deaktiviert, bis sie ausdrücklich aktiviert werden)

Workspace-Hooks können neue Hook-Namen hinzufügen, aber keine gebündelten, verwalteten oder von Plugins bereitgestellten Hooks mit demselben Namen überschreiben.

Das Gateway überspringt die interne Hook-Erkennung beim Start, bis interne Hooks konfiguriert sind. Aktivieren Sie einen gebündelten oder verwalteten Hook mit `openclaw hooks enable <name>`, installieren Sie ein Hook-Pack oder setzen Sie `hooks.internal.enabled=true`, um sich dafür zu entscheiden. Wenn Sie einen benannten Hook aktivieren, lädt das Gateway nur den Handler dieses Hooks; `hooks.internal.enabled=true`, zusätzliche Hook-Verzeichnisse und Legacy-Handler aktivieren die breite Erkennung.

### Hook-Packs

Hook-Pakete sind npm-Pakete, die Hooks über `openclaw.hooks` in `package.json` exportieren. Installieren Sie mit:

```bash
openclaw plugins install <path-or-spec>
```

npm-Spezifikationen sind ausschließlich registry-basiert (Paketname + optionale exakte Version oder dist-tag). Git-/URL-/Datei-Spezifikationen und semver-Bereiche werden abgelehnt.

## Gebündelte Hooks

| Hook                  | Ereignisse                                        | Funktion                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Speichert Sitzungskontext in `<workspace>/memory/`             |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injiziert zusätzliche Bootstrap-Dateien aus Glob-Mustern       |
| command-logger        | `command`                                         | Protokolliert alle Befehle in `~/.openclaw/logs/commands.log`  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Sendet sichtbare Chat-Hinweise, wenn die Sitzungs-Compaction startet/endet |
| boot-md               | `gateway:startup`                                 | Führt `BOOT.md` aus, wenn das Gateway startet                  |

Aktivieren Sie einen beliebigen gebündelten Hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details zu session-memory

Extrahiert die letzten 15 Benutzer-/Assistant-Nachrichten und speichert sie mit dem lokalen Datum des Hosts unter `<workspace>/memory/YYYY-MM-DD-HHMM.md`. Die Speichererfassung läuft im Hintergrund, sodass Bestätigungen für `/new` und `/reset` nicht durch Transkriptlesevorgänge oder optionale Slug-Generierung verzögert werden. Setzen Sie `hooks.internal.entries.session-memory.llmSlug: true`, um mit dem konfigurierten Modell beschreibende Dateinamen-Slugs zu generieren. Erfordert, dass `workspace.dir` konfiguriert ist.

<a id="bootstrap-extra-files"></a>

### Konfiguration von bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Pfade werden relativ zum Workspace aufgelöst. Nur erkannte Bootstrap-Basisnamen werden geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Details zu command-logger

Protokolliert jeden Slash-Befehl in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Details zu compaction-notifier

Sendet kurze Statusmeldungen in die aktuelle Unterhaltung, wenn OpenClaw mit der Kompaktierung des Sitzungstranskripts beginnt und sie abschließt. Dadurch werden lange Durchläufe auf Chat-Oberflächen weniger verwirrend, weil der Benutzer sehen kann, dass der Assistant Kontext zusammenfasst und nach der Compaction fortfährt.

<a id="boot-md"></a>

### Details zu boot-md

Führt `BOOT.md` aus dem aktiven Workspace aus, wenn das Gateway startet.

## Plugin-Hooks

Plugins können typisierte Hooks über das Plugin-SDK für tiefere Integration registrieren:
Abfangen von Tool-Aufrufen, Ändern von Prompts, Steuern des Nachrichtenflusses und mehr.
Verwenden Sie Plugin-Hooks, wenn Sie `before_tool_call`, `before_agent_reply`,
`before_install` oder andere In-Process-Lifecycle-Hooks benötigen.

Die vollständige Referenz zu Plugin-Hooks finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

## Konfiguration

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Umgebungsvariablen pro Hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Zusätzliche Hook-Verzeichnisse:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Das ältere Array-Konfigurationsformat `hooks.internal.handlers` wird aus Gründen der Abwärtskompatibilität weiterhin unterstützt, neue Hooks sollten jedoch das erkennungbasierte System verwenden.
</Note>

## CLI-Referenz

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Bewährte Methoden

- **Halten Sie Handler schnell.** Hooks laufen während der Befehlsverarbeitung. Starten Sie aufwändige Arbeit im Hintergrund, ohne darauf zu warten, mit `void processInBackground(event)`.
- **Behandeln Sie Fehler robust.** Umschließen Sie riskante Operationen mit try/catch; werfen Sie keine Fehler, damit andere Handler weiterlaufen können.
- **Filtern Sie Ereignisse früh.** Kehren Sie sofort zurück, wenn Ereignistyp oder Aktion nicht relevant sind.
- **Verwenden Sie spezifische Ereignisschlüssel.** Bevorzugen Sie `"events": ["command:new"]` gegenüber `"events": ["command"]`, um Overhead zu reduzieren.

## Fehlerbehebung

### Hook nicht gefunden

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook nicht zulässig

```bash
openclaw hooks info my-hook
```

Prüfen Sie auf fehlende Binärdateien (PATH), Umgebungsvariablen, Konfigurationswerte oder OS-Kompatibilität.

### Hook wird nicht ausgeführt

1. Vergewissern Sie sich, dass der Hook aktiviert ist: `openclaw hooks list`
2. Starten Sie Ihren Gateway-Prozess neu, damit Hooks erneut geladen werden.
3. Prüfen Sie die Gateway-Logs: `./scripts/clawlog.sh | grep hook`

## Verwandte Themen

- [CLI-Referenz: Hooks](/de/cli/hooks)
- [Webhooks](/de/automation/cron-jobs#webhooks)
- [Plugin-Hooks](/de/plugins/hooks) — Plugin-Lebenszyklus-Hooks im Prozess
- [Konfiguration](/de/gateway/configuration-reference#hooks)
