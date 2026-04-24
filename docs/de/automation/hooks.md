---
read_when:
    - Sie möchten ereignisgesteuerte Automatisierung für `/new`, `/reset`, `/stop` und Agent-Lebenszyklusereignisse.
    - Sie möchten Hooks erstellen, installieren oder debuggen.
summary: 'Hooks: ereignisgesteuerte Automatisierung für Befehle und Lebenszyklusereignisse'
title: Hooks
x-i18n:
    generated_at: "2026-04-24T08:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6246f25272208d9a9ff2f186bcd3a463c78ea24b833f0259174d0f7f0cbea6
    source_path: automation/hooks.md
    workflow: 15
---

Hooks sind kleine Skripte, die ausgeführt werden, wenn innerhalb des Gateway etwas passiert. Sie können aus Verzeichnissen erkannt und mit `openclaw hooks` geprüft werden. Das Gateway lädt interne Hooks erst, nachdem Sie Hooks aktiviert oder mindestens einen Hook-Eintrag, ein Hook-Pack, einen Legacy-Handler oder ein zusätzliches Hook-Verzeichnis konfiguriert haben.

Es gibt zwei Arten von Hooks in OpenClaw:

- **Interne Hooks** (diese Seite): werden innerhalb des Gateway ausgeführt, wenn Agent-Ereignisse ausgelöst werden, etwa `/new`, `/reset`, `/stop` oder Lebenszyklusereignisse.
- **Webhooks**: externe HTTP-Endpunkte, über die andere Systeme Arbeit in OpenClaw auslösen können. Siehe [Webhooks](/de/automation/cron-jobs#webhooks).

Hooks können auch in Plugins gebündelt sein. `openclaw hooks list` zeigt sowohl eigenständige Hooks als auch von Plugins verwaltete Hooks an.

## Schnellstart

```bash
# Verfügbare Hooks auflisten
openclaw hooks list

# Einen Hook aktivieren
openclaw hooks enable session-memory

# Hook-Status prüfen
openclaw hooks check

# Detaillierte Informationen abrufen
openclaw hooks info session-memory
```

## Ereignistypen

| Ereignis                | Wann es ausgelöst wird                          |
| ----------------------- | ----------------------------------------------- |
| `command:new`           | `/new`-Befehl ausgeführt                        |
| `command:reset`         | `/reset`-Befehl ausgeführt                      |
| `command:stop`          | `/stop`-Befehl ausgeführt                       |
| `command`               | Beliebiges Befehlsereignis (allgemeiner Listener) |
| `session:compact:before` | Bevor Compaction den Verlauf zusammenfasst     |
| `session:compact:after` | Nachdem Compaction abgeschlossen ist            |
| `session:patch`         | Wenn Session-Eigenschaften geändert werden      |
| `agent:bootstrap`       | Bevor Workspace-Bootstrap-Dateien eingefügt werden |
| `gateway:startup`       | Nachdem Kanäle gestartet und Hooks geladen wurden |
| `message:received`      | Eingehende Nachricht aus einem beliebigen Kanal |
| `message:transcribed`   | Nachdem die Audiotranskription abgeschlossen ist |
| `message:preprocessed`  | Nachdem die gesamte Medien- und Linkverarbeitung abgeschlossen ist |
| `message:sent`          | Ausgehende Nachricht zugestellt                 |

## Hooks schreiben

### Hook-Struktur

Jeder Hook ist ein Verzeichnis mit zwei Dateien:

```
my-hook/
├── HOOK.md          # Metadaten + Dokumentation
└── handler.ts       # Handler-Implementierung
```

### `HOOK.md`-Format

```markdown
---
name: my-hook
description: "Kurze Beschreibung, was dieser Hook macht"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Mein Hook

Detaillierte Dokumentation kommt hier hin.
```

**Metadatenfelder** (`metadata.openclaw`):

| Feld       | Beschreibung                                        |
| ---------- | --------------------------------------------------- |
| `emoji`    | Anzeige-Emoji für die CLI                           |
| `events`   | Array der Ereignisse, auf die gehört werden soll    |
| `export`   | Zu verwendender benannter Export (Standard ist `"default"`) |
| `os`       | Erforderliche Plattformen (z. B. `["darwin", "linux"]`) |
| `requires` | Erforderliche `bins`, `anyBins`, `env` oder `config`-Pfade |
| `always`   | Eignungsprüfungen umgehen (boolean)                 |
| `install`  | Installationsmethoden                               |

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

Jedes Ereignis enthält: `type`, `action`, `sessionKey`, `timestamp`, `messages` (per `push`, um an den Nutzer zu senden) und `context` (ereignisspezifische Daten). Hook-Kontexte von Agent- und Tool-Plugins können außerdem `trace` enthalten, einen schreibgeschützten W3C-kompatiblen Diagnose-Trace-Kontext, den Plugins zur OTEL-Korrelation in strukturierte Logs weitergeben können.

### Wichtige Punkte zum Ereigniskontext

**Befehlsereignisse** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Nachrichtenereignisse** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (anbieterspezifische Daten einschließlich `senderId`, `senderName`, `guildId`).

**Nachrichtenereignisse** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Nachrichtenereignisse** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Nachrichtenereignisse** (`message:preprocessed`): `context.bodyForAgent` (endgültiger angereicherter Inhalt), `context.from`, `context.channelId`.

**Bootstrap-Ereignisse** (`agent:bootstrap`): `context.bootstrapFiles` (veränderbares Array), `context.agentId`.

**Session-Patch-Ereignisse** (`session:patch`): `context.sessionEntry`, `context.patch` (nur geänderte Felder), `context.cfg`. Nur privilegierte Clients können Patch-Ereignisse auslösen.

**Compaction-Ereignisse**: `session:compact:before` enthält `messageCount`, `tokenCount`. `session:compact:after` ergänzt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Hook-Erkennung

Hooks werden aus diesen Verzeichnissen erkannt, in Reihenfolge zunehmender Override-Priorität:

1. **Gebündelte Hooks**: werden mit OpenClaw ausgeliefert
2. **Plugin-Hooks**: Hooks, die in installierten Plugins gebündelt sind
3. **Verwaltete Hooks**: `~/.openclaw/hooks/` (vom Nutzer installiert, gemeinsam für alle Workspaces). Zusätzliche Verzeichnisse aus `hooks.internal.load.extraDirs` haben dieselbe Priorität.
4. **Workspace-Hooks**: `<workspace>/hooks/` (pro Agent, standardmäßig deaktiviert, bis sie ausdrücklich aktiviert werden)

Workspace-Hooks können neue Hook-Namen hinzufügen, aber keine gebündelten, verwalteten oder von Plugins bereitgestellten Hooks mit demselben Namen überschreiben.

Das Gateway überspringt die Erkennung interner Hooks beim Start, bis interne Hooks konfiguriert sind. Aktivieren Sie einen gebündelten oder verwalteten Hook mit `openclaw hooks enable <name>`, installieren Sie ein Hook-Pack oder setzen Sie `hooks.internal.enabled=true`, um dies zu aktivieren. Wenn Sie einen benannten Hook aktivieren, lädt das Gateway nur den Handler dieses Hooks; `hooks.internal.enabled=true`, zusätzliche Hook-Verzeichnisse und Legacy-Handler aktivieren eine breite Erkennung.

### Hook-Packs

Hook-Packs sind npm-Pakete, die Hooks über `openclaw.hooks` in `package.json` exportieren. Installation mit:

```bash
openclaw plugins install <path-or-spec>
```

Npm-Spezifikationen sind nur für Registries zulässig (Paketname plus optionale exakte Version oder dist-tag). Git-/URL-/Datei-Spezifikationen und semver-Bereiche werden abgelehnt.

## Gebündelte Hooks

| Hook                  | Ereignisse                     | Was er macht                                         |
| --------------------- | ------------------------------ | ---------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Speichert Session-Kontext unter `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Fügt zusätzliche Bootstrap-Dateien aus Glob-Mustern ein |
| command-logger        | `command`                      | Protokolliert alle Befehle nach `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Führt `BOOT.md` aus, wenn das Gateway startet        |

Beliebigen gebündelten Hook aktivieren:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details zu `session-memory`

Extrahiert die letzten 15 Nutzer-/Assistant-Nachrichten, erzeugt per LLM einen beschreibenden Dateinamen-Slug und speichert unter `<workspace>/memory/YYYY-MM-DD-slug.md`. Erfordert, dass `workspace.dir` konfiguriert ist.

<a id="bootstrap-extra-files"></a>

### Konfiguration für `bootstrap-extra-files`

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

### Details zu `command-logger`

Protokolliert jeden Slash-Befehl nach `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Details zu `boot-md`

Führt `BOOT.md` aus dem aktiven Workspace aus, wenn das Gateway startet.

## Plugin-Hooks

Plugins können Hooks über das Plugin SDK registrieren, um eine tiefere Integration zu ermöglichen: Tool-Aufrufe abfangen, Prompts ändern, den Nachrichtenfluss steuern und mehr. Das Plugin SDK stellt 28 Hooks bereit, die Modellauflösung, Agent-Lebenszyklus, Nachrichtenfluss, Tool-Ausführung, Subagent-Koordination und Gateway-Lebenszyklus abdecken.

Die vollständige Referenz der Plugin-Hooks einschließlich `before_tool_call`, `before_agent_reply`, `before_install` und aller anderen Plugin-Hooks finden Sie unter [Plugin Architecture](/de/plugins/architecture-internals#provider-runtime-hooks).

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
Das Legacy-Konfigurationsformat `hooks.internal.handlers` als Array wird aus Gründen der Abwärtskompatibilität weiterhin unterstützt, neue Hooks sollten jedoch das erkennungsbasierte System verwenden.
</Note>

## CLI-Referenz

```bash
# Alle Hooks auflisten (fügen Sie --eligible, --verbose oder --json hinzu)
openclaw hooks list

# Detaillierte Informationen zu einem Hook anzeigen
openclaw hooks info <hook-name>

# Eignungsübersicht anzeigen
openclaw hooks check

# Aktivieren/deaktivieren
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Best Practices

- **Handler schnell halten.** Hooks laufen während der Befehlsverarbeitung. Starten Sie aufwendige Arbeit per Fire-and-forget mit `void processInBackground(event)`.
- **Fehler sauber behandeln.** Kapseln Sie riskante Operationen in try/catch; werfen Sie keine Fehler, damit andere Handler weiterlaufen können.
- **Ereignisse früh filtern.** Geben Sie sofort zurück, wenn Ereignistyp/-aktion nicht relevant ist.
- **Spezifische Ereignisschlüssel verwenden.** Bevorzugen Sie `"events": ["command:new"]` gegenüber `"events": ["command"]`, um Overhead zu reduzieren.

## Fehlerbehebung

### Hook wird nicht erkannt

```bash
# Verzeichnisstruktur prüfen
ls -la ~/.openclaw/hooks/my-hook/
# Sollte anzeigen: HOOK.md, handler.ts

# Alle erkannten Hooks auflisten
openclaw hooks list
```

### Hook ist nicht geeignet

```bash
openclaw hooks info my-hook
```

Prüfen Sie auf fehlende Binärdateien (PATH), Umgebungsvariablen, Konfigurationswerte oder Betriebssystemkompatibilität.

### Hook wird nicht ausgeführt

1. Prüfen Sie, ob der Hook aktiviert ist: `openclaw hooks list`
2. Starten Sie Ihren Gateway-Prozess neu, damit Hooks neu geladen werden.
3. Prüfen Sie die Gateway-Logs: `./scripts/clawlog.sh | grep hook`

## Verwandt

- [CLI-Referenz: hooks](/de/cli/hooks)
- [Webhooks](/de/automation/cron-jobs#webhooks)
- [Plugin Architecture](/de/plugins/architecture-internals#provider-runtime-hooks) — vollständige Referenz der Plugin-Hooks
- [Konfiguration](/de/gateway/configuration-reference#hooks)
