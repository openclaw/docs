---
read_when:
    - Sie möchten ereignisgesteuerte Automatisierung für /new, /reset, /stop und Agent-Lebenszyklusereignisse
    - Sie möchten Hooks erstellen, installieren oder debuggen
summary: 'Hooks: ereignisgesteuerte Automatisierung für Befehle und Lebenszyklusereignisse'
title: Hook-Funktionen
x-i18n:
    generated_at: "2026-05-02T20:41:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hooks sind kleine Skripte, die ausgeführt werden, wenn im Gateway etwas geschieht. Sie können aus Verzeichnissen erkannt und mit `openclaw hooks` geprüft werden. Das Gateway lädt interne Hooks erst, nachdem Sie Hooks aktiviert oder mindestens einen Hook-Eintrag, ein Hook-Pack, einen Legacy-Handler oder ein zusätzliches Hook-Verzeichnis konfiguriert haben.

In OpenClaw gibt es zwei Arten von Hooks:

- **Interne Hooks** (diese Seite): werden im Gateway ausgeführt, wenn Agent-Ereignisse ausgelöst werden, etwa `/new`, `/reset`, `/stop` oder Lifecycle-Ereignisse.
- **Webhooks**: externe HTTP-Endpunkte, über die andere Systeme Arbeit in OpenClaw auslösen können. Siehe [Webhooks](/de/automation/cron-jobs#webhooks).

Hooks können auch in Plugins gebündelt sein. `openclaw hooks list` zeigt sowohl eigenständige Hooks als auch von Plugins verwaltete Hooks an.

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

| Ereignis                 | Wann es ausgelöst wird                                    |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Befehl `/new` wurde ausgegeben                             |
| `command:reset`          | Befehl `/reset` wurde ausgegeben                           |
| `command:stop`           | Befehl `/stop` wurde ausgegeben                            |
| `command`                | Beliebiges Befehlsereignis (allgemeiner Listener)          |
| `session:compact:before` | Bevor Compaction den Verlauf zusammenfasst                 |
| `session:compact:after`  | Nachdem Compaction abgeschlossen ist                       |
| `session:patch`          | Wenn Sitzungseigenschaften geändert werden                 |
| `agent:bootstrap`        | Bevor Workspace-Bootstrap-Dateien injiziert werden         |
| `gateway:startup`        | Nachdem Kanäle gestartet und Hooks geladen wurden          |
| `gateway:shutdown`       | Wenn das Herunterfahren des Gateways beginnt               |
| `gateway:pre-restart`    | Vor einem erwarteten Gateway-Neustart                      |
| `message:received`       | Eingehende Nachricht aus einem beliebigen Kanal            |
| `message:transcribed`    | Nachdem die Audiotranskription abgeschlossen ist           |
| `message:preprocessed`   | Nachdem Medien- und Link-Vorverarbeitung abgeschlossen ist oder übersprungen wurde |
| `message:sent`           | Ausgehende Nachricht wurde zugestellt                      |

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
| `emoji`    | Anzeige-Emoji für CLI                                |
| `events`   | Array von Ereignissen, auf die gehört werden soll    |
| `export`   | Benannter Export, der verwendet werden soll (standardmäßig `"default"`) |
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

Jedes Ereignis enthält: `type`, `action`, `sessionKey`, `timestamp`, `messages` (per Push hinzufügen, um an Benutzer zu senden) und `context` (ereignisspezifische Daten). Agent- und Tool-Plugin-Hook-Kontexte können außerdem `trace` enthalten, einen schreibgeschützten, W3C-kompatiblen diagnostischen Trace-Kontext, den Plugins für OTEL-Korrelation an strukturierte Logs weitergeben können.

### Wichtige Event-Kontexte

**Befehlsereignisse** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Nachrichtenereignisse** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (Provider-spezifische Daten einschließlich `senderId`, `senderName`, `guildId`). `context.content` bevorzugt bei befehlsähnlichen Nachrichten einen nicht leeren Befehlstext, fällt dann auf den rohen eingehenden Text und den generischen Text zurück; es enthält keine nur für den Agent bestimmten Anreicherungen wie Thread-Verlauf oder Link-Zusammenfassungen.

**Nachrichtenereignisse** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Nachrichtenereignisse** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Nachrichtenereignisse** (`message:preprocessed`): `context.bodyForAgent` (endgültig angereicherter Text), `context.from`, `context.channelId`.

**Bootstrap-Ereignisse** (`agent:bootstrap`): `context.bootstrapFiles` (veränderbares Array), `context.agentId`.

**Sitzungs-Patch-Ereignisse** (`session:patch`): `context.sessionEntry`, `context.patch` (nur geänderte Felder), `context.cfg`. Nur privilegierte Clients können Patch-Ereignisse auslösen.

**Compaction-Ereignisse**: `session:compact:before` enthält `messageCount`, `tokenCount`. `session:compact:after` fügt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` hinzu.

`command:stop` beobachtet, dass der Benutzer `/stop` ausgibt; es gehört zum Cancellation-/Befehls-Lifecycle und ist kein Gate für Agent-Finalisierung. Plugins, die eine natürliche endgültige Antwort prüfen und den Agent um einen weiteren Durchlauf bitten müssen, sollten stattdessen den typisierten Plugin-Hook `before_agent_finalize` verwenden. Siehe [Plugin-Hooks](/de/plugins/hooks).

**Gateway-Lifecycle-Ereignisse**: `gateway:shutdown` enthält `reason` und `restartExpectedMs` und wird ausgelöst, wenn das Herunterfahren des Gateways beginnt. `gateway:pre-restart` enthält denselben Kontext, wird aber nur ausgelöst, wenn das Herunterfahren Teil eines erwarteten Neustarts ist und ein endlicher Wert für `restartExpectedMs` angegeben wird. Während des Herunterfahrens ist jedes Warten auf Lifecycle-Hooks bestmöglich und begrenzt, sodass das Herunterfahren fortgesetzt wird, wenn ein Handler blockiert.

## Hook-Erkennung

Hooks werden aus diesen Verzeichnissen erkannt, in Reihenfolge zunehmender Überschreibungspriorität:

1. **Gebündelte Hooks**: werden mit OpenClaw ausgeliefert
2. **Plugin-Hooks**: Hooks, die in installierten Plugins gebündelt sind
3. **Verwaltete Hooks**: `~/.openclaw/hooks/` (vom Benutzer installiert, über Workspaces hinweg geteilt). Zusätzliche Verzeichnisse aus `hooks.internal.load.extraDirs` teilen diese Priorität.
4. **Workspace-Hooks**: `<workspace>/hooks/` (pro Agent, standardmäßig deaktiviert, bis sie explizit aktiviert werden)

Workspace-Hooks können neue Hook-Namen hinzufügen, aber keine gebündelten, verwalteten oder von Plugins bereitgestellten Hooks mit demselben Namen überschreiben.

Das Gateway überspringt beim Start die Erkennung interner Hooks, bis interne Hooks konfiguriert sind. Aktivieren Sie einen gebündelten oder verwalteten Hook mit `openclaw hooks enable <name>`, installieren Sie ein Hook-Pack oder setzen Sie `hooks.internal.enabled=true`, um sich dafür zu entscheiden. Wenn Sie einen benannten Hook aktivieren, lädt das Gateway nur den Handler dieses Hooks; `hooks.internal.enabled=true`, zusätzliche Hook-Verzeichnisse und Legacy-Handler entscheiden sich für eine breite Erkennung.

### Hook-Packs

Hook-Packs sind npm-Pakete, die Hooks über `openclaw.hooks` in `package.json` exportieren. Installation mit:

```bash
openclaw plugins install <path-or-spec>
```

Npm-Spezifikationen sind ausschließlich registrierungsbasiert (Paketname + optionale exakte Version oder dist-tag). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt.

## Gebündelte Hooks

| Hook                  | Ereignisse                     | Funktion                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Speichert Sitzungskontext in `<workspace>/memory/`    |
| bootstrap-extra-files | `agent:bootstrap`              | Fügt zusätzliche Bootstrap-Dateien aus Glob-Mustern ein |
| command-logger        | `command`                      | Protokolliert alle Befehle in `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Führt `BOOT.md` aus, wenn das Gateway startet         |

Aktivieren Sie einen beliebigen gebündelten Hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details zu session-memory

Extrahiert die letzten 15 Benutzer-/Assistentennachrichten, generiert über ein LLM einen beschreibenden Dateinamen-Slug und speichert ihn mit dem lokalen Host-Datum unter `<workspace>/memory/YYYY-MM-DD-slug.md`. Erfordert, dass `workspace.dir` konfiguriert ist.

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

<a id="boot-md"></a>

### Details zu boot-md

Führt `BOOT.md` aus dem aktiven Workspace aus, wenn das Gateway startet.

## Plugin-Hooks

Plugins können typisierte Hooks über das Plugin SDK für tiefere Integration registrieren:
Abfangen von Tool-Aufrufen, Ändern von Prompts, Steuern des Nachrichtenflusses und mehr.
Verwenden Sie Plugin-Hooks, wenn Sie `before_tool_call`, `before_agent_reply`,
`before_install` oder andere prozessinterne Lifecycle-Hooks benötigen.

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
Das ältere Konfigurationsformat des Arrays `hooks.internal.handlers` wird aus Gründen der Abwärtskompatibilität weiterhin unterstützt, neue Hooks sollten jedoch das Discovery-basierte System verwenden.
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

## Best Practices

- **Halten Sie Handler schnell.** Hooks werden während der Befehlsverarbeitung ausgeführt. Führen Sie aufwendige Arbeiten per Fire-and-Forget mit `void processInBackground(event)` aus.
- **Behandeln Sie Fehler robust.** Umschließen Sie riskante Operationen mit try/catch; werfen Sie keine Fehler, damit andere Handler ausgeführt werden können.
- **Filtern Sie Ereignisse früh.** Kehren Sie sofort zurück, wenn Ereignistyp oder Aktion nicht relevant ist.
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

Prüfen Sie auf fehlende Binärdateien (PATH), Umgebungsvariablen, Konfigurationswerte oder Betriebssystemkompatibilität.

### Hook wird nicht ausgeführt

1. Prüfen Sie, ob der Hook aktiviert ist: `openclaw hooks list`
2. Starten Sie Ihren Gateway-Prozess neu, damit Hooks neu geladen werden.
3. Prüfen Sie die Gateway-Logs: `./scripts/clawlog.sh | grep hook`

## Verwandt

- [CLI-Referenz: Hooks](/de/cli/hooks)
- [Webhooks](/de/automation/cron-jobs#webhooks)
- [Plugin-Hooks](/de/plugins/hooks) — prozessinterne Hooks für den Plugin-Lebenszyklus
- [Konfiguration](/de/gateway/configuration-reference#hooks)
