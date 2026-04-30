---
read_when:
    - Sie möchten ereignisgesteuerte Automatisierung für /new, /reset, /stop und Agent-Lebenszyklusereignisse
    - Sie möchten Hooks erstellen, installieren oder debuggen
summary: 'Hooks: ereignisgesteuerte Automatisierung für Befehle und Lebenszyklusereignisse'
title: Hooks
x-i18n:
    generated_at: "2026-04-30T06:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

Hooks sind kleine Skripte, die ausgeführt werden, wenn innerhalb des Gateway etwas passiert. Sie können aus Verzeichnissen erkannt und mit `openclaw hooks` inspiziert werden. Das Gateway lädt interne Hooks erst, nachdem Sie Hooks aktiviert oder mindestens einen Hook-Eintrag, ein Hook-Pack, einen Legacy-Handler oder ein zusätzliches Hook-Verzeichnis konfiguriert haben.

In OpenClaw gibt es zwei Arten von Hooks:

- **Interne Hooks** (diese Seite): werden innerhalb des Gateway ausgeführt, wenn Agent-Ereignisse ausgelöst werden, etwa `/new`, `/reset`, `/stop` oder Lebenszyklusereignisse.
- **Webhooks**: externe HTTP-Endpunkte, mit denen andere Systeme Arbeit in OpenClaw auslösen können. Siehe [Webhooks](/de/automation/cron-jobs#webhooks).

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

| Ereignis                 | Wann es ausgelöst wird                                      |
| ------------------------ | ----------------------------------------------------------- |
| `command:new`            | Befehl `/new` ausgeführt                                    |
| `command:reset`          | Befehl `/reset` ausgeführt                                  |
| `command:stop`           | Befehl `/stop` ausgeführt                                   |
| `command`                | Beliebiges Befehlsereignis (allgemeiner Listener)           |
| `session:compact:before` | Bevor Compaction den Verlauf zusammenfasst                  |
| `session:compact:after`  | Nachdem Compaction abgeschlossen ist                        |
| `session:patch`          | Wenn Sitzungseigenschaften geändert werden                  |
| `agent:bootstrap`        | Bevor Bootstrap-Dateien für den Arbeitsbereich eingefügt werden |
| `gateway:startup`        | Nachdem Kanäle gestartet und Hooks geladen wurden           |
| `gateway:shutdown`       | Wenn das Herunterfahren des Gateway beginnt                 |
| `gateway:pre-restart`    | Vor einem erwarteten Neustart des Gateway                   |
| `message:received`       | Eingehende Nachricht aus einem beliebigen Kanal             |
| `message:transcribed`    | Nachdem die Audiotranskription abgeschlossen ist            |
| `message:preprocessed`   | Nachdem die Medien- und Link-Vorverarbeitung abgeschlossen oder übersprungen wurde |
| `message:sent`           | Ausgehende Nachricht zugestellt                            |

## Hooks schreiben

### Hook-Struktur

Jeder Hook ist ein Verzeichnis mit zwei Dateien:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Format von HOOK.md

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
| `events`   | Array von Ereignissen, auf die gehört werden soll    |
| `export`   | Zu verwendender benannter Export (standardmäßig `"default"`) |
| `os`       | Erforderliche Plattformen (z. B. `["darwin", "linux"]`) |
| `requires` | Erforderliche Pfade für `bins`, `anyBins`, `env` oder `config` |
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

Jedes Ereignis enthält: `type`, `action`, `sessionKey`, `timestamp`, `messages` (zum Senden an den Benutzer hinzufügen) und `context` (ereignisspezifische Daten). Hook-Kontexte von Agent- und Tool-Plugins können außerdem `trace` enthalten, einen schreibgeschützten W3C-kompatiblen Diagnose-Trace-Kontext, den Plugins für die OTEL-Korrelation an strukturierte Logs übergeben können.

### Wichtige Ereigniskontexte

**Befehlsereignisse** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Nachrichtenereignisse** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (Provider-spezifische Daten einschließlich `senderId`, `senderName`, `guildId`).

**Nachrichtenereignisse** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Nachrichtenereignisse** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Nachrichtenereignisse** (`message:preprocessed`): `context.bodyForAgent` (endgültiger angereicherter Text), `context.from`, `context.channelId`.

**Bootstrap-Ereignisse** (`agent:bootstrap`): `context.bootstrapFiles` (änderbares Array), `context.agentId`.

**Sitzungs-Patch-Ereignisse** (`session:patch`): `context.sessionEntry`, `context.patch` (nur geänderte Felder), `context.cfg`. Nur privilegierte Clients können Patch-Ereignisse auslösen.

**Compaction-Ereignisse**: `session:compact:before` enthält `messageCount`, `tokenCount`. `session:compact:after` fügt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` hinzu.

`command:stop` beobachtet, dass der Benutzer `/stop` ausführt; es ist Teil des Abbruch-/Befehlslebenszyklus und kein Gate für die Agent-Finalisierung. Plugins, die eine natürliche finale Antwort inspizieren und den Agent um einen weiteren Durchlauf bitten müssen, sollten stattdessen den typisierten Plugin-Hook `before_agent_finalize` verwenden. Siehe [Plugin-Hooks](/de/plugins/hooks).

**Gateway-Lebenszyklusereignisse**: `gateway:shutdown` enthält `reason` und `restartExpectedMs` und wird ausgelöst, wenn das Herunterfahren des Gateway beginnt. `gateway:pre-restart` enthält denselben Kontext, wird aber nur ausgelöst, wenn das Herunterfahren Teil eines erwarteten Neustarts ist und ein endlicher Wert für `restartExpectedMs` bereitgestellt wird. Während des Herunterfahrens ist jedes Warten auf Lebenszyklus-Hooks best-effort und begrenzt, sodass das Herunterfahren fortgesetzt wird, wenn ein Handler hängen bleibt.

## Hook-Erkennung

Hooks werden aus diesen Verzeichnissen erkannt, in Reihenfolge zunehmender Überschreibungspriorität:

1. **Gebündelte Hooks**: mit OpenClaw ausgeliefert
2. **Plugin-Hooks**: Hooks, die in installierten Plugins gebündelt sind
3. **Verwaltete Hooks**: `~/.openclaw/hooks/` (vom Benutzer installiert, über Arbeitsbereiche hinweg gemeinsam genutzt). Zusätzliche Verzeichnisse aus `hooks.internal.load.extraDirs` teilen diese Priorität.
4. **Arbeitsbereich-Hooks**: `<workspace>/hooks/` (pro Agent, standardmäßig deaktiviert, bis sie explizit aktiviert werden)

Arbeitsbereich-Hooks können neue Hook-Namen hinzufügen, aber keine gebündelten, verwalteten oder von Plugins bereitgestellten Hooks mit demselben Namen überschreiben.

Das Gateway überspringt die interne Hook-Erkennung beim Start, bis interne Hooks konfiguriert sind. Aktivieren Sie einen gebündelten oder verwalteten Hook mit `openclaw hooks enable <name>`, installieren Sie ein Hook-Pack oder setzen Sie `hooks.internal.enabled=true`, um sich dafür zu entscheiden. Wenn Sie einen benannten Hook aktivieren, lädt das Gateway nur den Handler dieses Hooks; `hooks.internal.enabled=true`, zusätzliche Hook-Verzeichnisse und Legacy-Handler entscheiden sich für eine breite Erkennung.

### Hook-Packs

Hook-Packs sind npm-Pakete, die Hooks über `openclaw.hooks` in `package.json` exportieren. Installieren Sie sie mit:

```bash
openclaw plugins install <path-or-spec>
```

Npm-Spezifikationen sind ausschließlich Registry-basiert (Paketname plus optionale exakte Version oder dist-tag). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt.

## Gebündelte Hooks

| Hook                  | Ereignisse                     | Was er tut                                           |
| --------------------- | ------------------------------ | ---------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Speichert Sitzungskontext in `<workspace>/memory/`   |
| bootstrap-extra-files | `agent:bootstrap`              | Fügt zusätzliche Bootstrap-Dateien aus Glob-Mustern ein |
| command-logger        | `command`                      | Protokolliert alle Befehle nach `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Führt `BOOT.md` aus, wenn das Gateway startet        |

Einen beliebigen gebündelten Hook aktivieren:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details zu session-memory

Extrahiert die letzten 15 Benutzer-/Assistant-Nachrichten, erzeugt per LLM einen beschreibenden Dateinamen-Slug und speichert ihn unter `<workspace>/memory/YYYY-MM-DD-slug.md` unter Verwendung des lokalen Datums des Hosts. Erfordert, dass `workspace.dir` konfiguriert ist.

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

Pfade werden relativ zum Arbeitsbereich aufgelöst. Nur erkannte Bootstrap-Basisnamen werden geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Details zu command-logger

Protokolliert jeden Slash-Befehl nach `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Details zu boot-md

Führt `BOOT.md` aus dem aktiven Arbeitsbereich aus, wenn das Gateway startet.

## Plugin-Hooks

Plugins können typisierte Hooks über das Plugin SDK registrieren, um eine tiefere Integration zu ermöglichen:
Tool-Aufrufe abfangen, Prompts ändern, den Nachrichtenfluss steuern und mehr.
Verwenden Sie Plugin-Hooks, wenn Sie `before_tool_call`, `before_agent_reply`,
`before_install` oder andere prozessinterne Lebenszyklus-Hooks benötigen.

Die vollständige Plugin-Hook-Referenz finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

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
Das Legacy-Konfigurationsformat des Arrays `hooks.internal.handlers` wird aus Gründen der Abwärtskompatibilität weiterhin unterstützt, aber neue Hooks sollten das erkennungsgestützte System verwenden.
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

## Bewährte Verfahren

- **Halten Sie Handler schnell.** Hooks laufen während der Befehlsverarbeitung. Starten Sie aufwendige Arbeit im Fire-and-forget-Stil mit `void processInBackground(event)`.
- **Behandeln Sie Fehler kontrolliert.** Umgeben Sie riskante Operationen mit try/catch; werfen Sie keine Fehler, damit andere Handler ausgeführt werden können.
- **Filtern Sie Ereignisse früh.** Kehren Sie sofort zurück, wenn der Ereignistyp oder die Aktion nicht relevant ist.
- **Verwenden Sie spezifische Ereignisschlüssel.** Bevorzugen Sie `"events": ["command:new"]` gegenüber `"events": ["command"]`, um Overhead zu reduzieren.

## Fehlerbehebung

### Hook nicht erkannt

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook nicht geeignet

```bash
openclaw hooks info my-hook
```

Prüfen Sie auf fehlende Binärdateien (PATH), Umgebungsvariablen, Konfigurationswerte oder Betriebssystemkompatibilität.

### Hook wird nicht ausgeführt

1. Prüfen Sie, ob der Hook aktiviert ist: `openclaw hooks list`
2. Starten Sie Ihren Gateway-Prozess neu, damit Hooks neu geladen werden.
3. Prüfen Sie die Gateway-Logs: `./scripts/clawlog.sh | grep hook`

## Verwandte Themen

- [CLI-Referenz: Hooks](/de/cli/hooks)
- [Webhooks](/de/automation/cron-jobs#webhooks)
- [Plugin-Hooks](/de/plugins/hooks) — In-Process-Hooks für den Plugin-Lebenszyklus
- [Konfiguration](/de/gateway/configuration-reference#hooks)
