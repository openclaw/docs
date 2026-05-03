---
read_when:
    - Sie möchten ereignisgesteuerte Automatisierung für /new, /reset, /stop und Ereignisse im Agent-Lebenszyklus
    - Sie möchten Hooks erstellen, installieren oder debuggen
summary: 'Hooks: ereignisgesteuerte Automatisierung für Befehle und Lebenszyklusereignisse'
title: Hooks
x-i18n:
    generated_at: "2026-05-03T21:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooks sind kleine Skripte, die ausgeführt werden, wenn im Gateway etwas passiert. Sie können aus Verzeichnissen erkannt und mit `openclaw hooks` geprüft werden. Das Gateway lädt interne Hooks erst, nachdem Sie Hooks aktiviert oder mindestens einen Hook-Eintrag, ein Hook-Pack, einen Legacy-Handler oder ein zusätzliches Hook-Verzeichnis konfiguriert haben.

Es gibt zwei Arten von Hooks in OpenClaw:

- **Interne Hooks** (diese Seite): werden im Gateway ausgeführt, wenn Agent-Ereignisse ausgelöst werden, wie `/new`, `/reset`, `/stop` oder Lebenszyklusereignisse.
- **Webhooks**: externe HTTP-Endpunkte, mit denen andere Systeme Arbeit in OpenClaw auslösen können. Siehe [Webhooks](/de/automation/cron-jobs#webhooks).

Hooks können auch in Plugins gebündelt sein. `openclaw hooks list` zeigt sowohl eigenständige Hooks als auch von Plugins verwaltete Hooks.

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

| Ereignis                 | Wann es ausgelöst wird                                      |
| ------------------------ | ----------------------------------------------------------- |
| `command:new`            | `/new`-Befehl ausgegeben                                    |
| `command:reset`          | `/reset`-Befehl ausgegeben                                  |
| `command:stop`           | `/stop`-Befehl ausgegeben                                   |
| `command`                | Beliebiges Befehlsereignis (allgemeiner Listener)           |
| `session:compact:before` | Bevor Compaction den Verlauf zusammenfasst                  |
| `session:compact:after`  | Nachdem Compaction abgeschlossen ist                        |
| `session:patch`          | Wenn Sitzungseigenschaften geändert werden                  |
| `agent:bootstrap`        | Bevor Workspace-Bootstrap-Dateien eingefügt werden          |
| `gateway:startup`        | Nachdem Kanäle gestartet und Hooks geladen wurden           |
| `gateway:shutdown`       | Wenn das Herunterfahren des Gateway beginnt                 |
| `gateway:pre-restart`    | Vor einem erwarteten Neustart des Gateway                   |
| `message:received`       | Eingehende Nachricht aus einem beliebigen Kanal             |
| `message:transcribed`    | Nachdem die Audiotranskription abgeschlossen ist            |
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

| Feld       | Beschreibung                                          |
| ---------- | ----------------------------------------------------- |
| `emoji`    | Anzeige-Emoji für die CLI                             |
| `events`   | Array der Ereignisse, auf die gehört werden soll      |
| `export`   | Benannter Export, der verwendet werden soll (standardmäßig `"default"`) |
| `os`       | Erforderliche Plattformen (z. B. `["darwin", "linux"]`) |
| `requires` | Erforderliche `bins`-, `anyBins`-, `env`- oder `config`-Pfade |
| `always`   | Eignungsprüfungen umgehen (Boolescher Wert)           |
| `install`  | Installationsmethoden                                 |

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

Jedes Ereignis enthält: `type`, `action`, `sessionKey`, `timestamp`, `messages` (zum Senden an den Benutzer pushen) und `context` (ereignisspezifische Daten). Hook-Kontexte für Agent- und Tool-Plugins können außerdem `trace` enthalten, einen schreibgeschützten, W3C-kompatiblen Diagnose-Trace-Kontext, den Plugins zur OTEL-Korrelation an strukturierte Logs übergeben können.

### Wichtige Ereigniskontexte

**Befehlsereignisse** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Nachrichtenereignisse** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (providerspezifische Daten einschließlich `senderId`, `senderName`, `guildId`). `context.content` bevorzugt für befehlsähnliche Nachrichten einen nicht leeren Befehlstext, fällt dann auf den rohen eingehenden Text und den generischen Text zurück; es enthält keine nur für den Agent bestimmten Anreicherungen wie Thread-Verlauf oder Link-Zusammenfassungen.

**Nachrichtenereignisse** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Nachrichtenereignisse** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Nachrichtenereignisse** (`message:preprocessed`): `context.bodyForAgent` (endgültig angereicherter Text), `context.from`, `context.channelId`.

**Bootstrap-Ereignisse** (`agent:bootstrap`): `context.bootstrapFiles` (veränderbares Array), `context.agentId`.

**Sitzungs-Patch-Ereignisse** (`session:patch`): `context.sessionEntry`, `context.patch` (nur geänderte Felder), `context.cfg`. Nur privilegierte Clients können Patch-Ereignisse auslösen.

**Compaction-Ereignisse**: `session:compact:before` enthält `messageCount`, `tokenCount`. `session:compact:after` fügt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` hinzu.

`command:stop` beobachtet, dass der Benutzer `/stop` ausgibt; es ist Teil des Abbruch-/Befehlslebenszyklus und kein Gate für die Finalisierung des Agent. Plugins, die eine natürliche finale Antwort prüfen und den Agent um einen weiteren Durchlauf bitten müssen, sollten stattdessen den typisierten Plugin-Hook `before_agent_finalize` verwenden. Siehe [Plugin-Hooks](/de/plugins/hooks).

**Gateway-Lebenszyklusereignisse**: `gateway:shutdown` enthält `reason` und `restartExpectedMs` und wird ausgelöst, wenn das Herunterfahren des Gateway beginnt. `gateway:pre-restart` enthält denselben Kontext, wird aber nur ausgelöst, wenn das Herunterfahren Teil eines erwarteten Neustarts ist und ein endlicher Wert für `restartExpectedMs` angegeben wird. Während des Herunterfahrens ist jedes Warten auf Lebenszyklus-Hooks best-effort und begrenzt, damit das Herunterfahren fortgesetzt wird, wenn ein Handler hängen bleibt.

## Hook-Erkennung

Hooks werden aus diesen Verzeichnissen erkannt, in der Reihenfolge steigender Überschreibungspriorität:

1. **Gebündelte Hooks**: mit OpenClaw ausgeliefert
2. **Plugin-Hooks**: Hooks, die in installierten Plugins gebündelt sind
3. **Verwaltete Hooks**: `~/.openclaw/hooks/` (vom Benutzer installiert, über Workspaces hinweg geteilt). Zusätzliche Verzeichnisse aus `hooks.internal.load.extraDirs` teilen sich diese Priorität.
4. **Workspace-Hooks**: `<workspace>/hooks/` (pro Agent, standardmäßig deaktiviert, bis sie ausdrücklich aktiviert werden)

Workspace-Hooks können neue Hook-Namen hinzufügen, aber keine gebündelten, verwalteten oder von Plugins bereitgestellten Hooks mit demselben Namen überschreiben.

Das Gateway überspringt beim Start die interne Hook-Erkennung, bis interne Hooks konfiguriert sind. Aktivieren Sie einen gebündelten oder verwalteten Hook mit `openclaw hooks enable <name>`, installieren Sie ein Hook-Pack oder setzen Sie `hooks.internal.enabled=true`, um sich dafür zu entscheiden. Wenn Sie einen benannten Hook aktivieren, lädt das Gateway nur den Handler dieses Hooks; `hooks.internal.enabled=true`, zusätzliche Hook-Verzeichnisse und Legacy-Handler aktivieren eine breite Erkennung.

### Hook-Packs

Hook-Packs sind npm-Pakete, die Hooks über `openclaw.hooks` in `package.json` exportieren. Installieren Sie sie mit:

```bash
openclaw plugins install <path-or-spec>
```

Npm-Spezifikationen sind nur registrybasiert (Paketname + optionale exakte Version oder dist-tag). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt.

## Gebündelte Hooks

| Hook                  | Ereignisse                                        | Was er tut                                                    |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Speichert den Sitzungskontext unter `<workspace>/memory/`     |
| bootstrap-extra-files | `agent:bootstrap`                                 | Fügt zusätzliche Bootstrap-Dateien aus Glob-Mustern ein       |
| command-logger        | `command`                                         | Protokolliert alle Befehle in `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Sendet sichtbare Chat-Hinweise, wenn die Sitzungs-Compaction beginnt/endet |
| boot-md               | `gateway:startup`                                 | Führt `BOOT.md` aus, wenn das Gateway startet                 |

Beliebigen gebündelten Hook aktivieren:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details zu session-memory

Extrahiert die letzten 15 Benutzer-/Assistentennachrichten, generiert per LLM einen beschreibenden Dateinamen-Slug und speichert ihn unter `<workspace>/memory/YYYY-MM-DD-slug.md` unter Verwendung des lokalen Datums des Hosts. Erfordert, dass `workspace.dir` konfiguriert ist.

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

Pfade werden relativ zum Workspace aufgelöst. Es werden nur erkannte Bootstrap-Basisnamen geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Details zu command-logger

Protokolliert jeden Slash-Befehl in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Details zu compaction-notifier

Sendet kurze Statusmeldungen in die aktuelle Unterhaltung, wenn OpenClaw beginnt und beendet, das Sitzungstranskript zu komprimieren. Das macht lange Durchläufe auf Chat-Oberflächen weniger verwirrend, da der Benutzer sehen kann, dass der Assistent Kontext zusammenfasst und nach der Compaction fortfährt.

<a id="boot-md"></a>

### Details zu boot-md

Führt `BOOT.md` aus dem aktiven Workspace aus, wenn das Gateway startet.

## Plugin-Hooks

Plugins können über das Plugin SDK typisierte Hooks für eine tiefere Integration registrieren:
Tool-Aufrufe abfangen, Prompts ändern, den Nachrichtenfluss steuern und mehr.
Verwenden Sie Plugin-Hooks, wenn Sie `before_tool_call`, `before_agent_reply`,
`before_install` oder andere In-Process-Lebenszyklus-Hooks benötigen.

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
Das Legacy-Konfigurationsformat `hooks.internal.handlers` als Array wird zur Abwärtskompatibilität weiterhin unterstützt, neue Hooks sollten jedoch das erkennungbasierte System verwenden.
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

- **Halten Sie Handler schnell.** Hooks werden während der Befehlsverarbeitung ausgeführt. Starten Sie aufwendige Arbeit ohne Warten mit `void processInBackground(event)`.
- **Behandeln Sie Fehler robust.** Umschließen Sie riskante Vorgänge mit try/catch; werfen Sie keine Fehler, damit andere Handler ausgeführt werden können.
- **Filtern Sie Events frühzeitig.** Kehren Sie sofort zurück, wenn Event-Typ oder Aktion nicht relevant ist.
- **Verwenden Sie spezifische Event-Schlüssel.** Bevorzugen Sie `"events": ["command:new"]` statt `"events": ["command"]`, um Overhead zu reduzieren.

## Fehlerbehebung

### Hook nicht gefunden

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook nicht berechtigt

```bash
openclaw hooks info my-hook
```

Prüfen Sie auf fehlende Binärdateien (PATH), Umgebungsvariablen, Konfigurationswerte oder OS-Kompatibilität.

### Hook wird nicht ausgeführt

1. Stellen Sie sicher, dass der Hook aktiviert ist: `openclaw hooks list`
2. Starten Sie Ihren Gateway-Prozess neu, damit Hooks neu geladen werden.
3. Prüfen Sie die Gateway-Logs: `./scripts/clawlog.sh | grep hook`

## Verwandte Themen

- [CLI-Referenz: Hooks](/de/cli/hooks)
- [Webhooks](/de/automation/cron-jobs#webhooks)
- [Plugin-Hooks](/de/plugins/hooks) — In-Process-Hooks für den Plugin-Lebenszyklus
- [Konfiguration](/de/gateway/configuration-reference#hooks)
