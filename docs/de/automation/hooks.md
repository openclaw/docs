---
read_when:
    - Sie möchten ereignisgesteuerte Automatisierung für /new, /reset, /stop und Agent-Lebenszyklusereignisse
    - Sie möchten Hooks erstellen, installieren oder debuggen
summary: 'Hooks: ereignisgesteuerte Automatisierung für Befehle und Lebenszyklusereignisse'
title: Hooks
x-i18n:
    generated_at: "2026-06-27T17:08:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hooks sind kleine Skripte, die ausgeführt werden, wenn innerhalb des Gateway etwas passiert. Sie können aus Verzeichnissen erkannt und mit `openclaw hooks` geprüft werden. Der Gateway lädt interne Hooks erst, nachdem Sie Hooks aktiviert oder mindestens einen Hook-Eintrag, ein Hook-Pack, einen Legacy-Handler oder ein zusätzliches Hook-Verzeichnis konfiguriert haben.

Es gibt zwei Arten von Hooks in OpenClaw:

- **Interne Hooks** (diese Seite): werden innerhalb des Gateway ausgeführt, wenn Agent-Ereignisse ausgelöst werden, etwa `/new`, `/reset`, `/stop` oder Lebenszyklusereignisse.
- **Webhooks**: externe HTTP-Endpunkte, mit denen andere Systeme Arbeit in OpenClaw auslösen können. Siehe [Webhooks](/de/automation/cron-jobs#webhooks).

Hooks können auch in Plugins gebündelt sein. `openclaw hooks list` zeigt sowohl eigenständige Hooks als auch von Plugins verwaltete Hooks an.

## Die richtige Oberfläche wählen

OpenClaw hat mehrere Erweiterungsoberflächen, die ähnlich wirken, aber unterschiedliche Probleme lösen:

| Wenn Sie Folgendes möchten ...                                                                                        | Verwenden Sie ...                       | Warum                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Bei `/new` einen Snapshot speichern, `/reset` protokollieren, nach `message:sent` eine externe API aufrufen oder grobe Operator-Automatisierung hinzufügen | Interne Hooks (`HOOK.md`, diese Seite)  | Dateibasierte Hooks sind für operatorverwaltete Nebeneffekte sowie Befehls- und Lebenszyklusautomatisierung gedacht |
| Prompts umschreiben, Tools blockieren, ausgehende Nachrichten abbrechen oder geordnete Middleware/Policy hinzufügen   | Typisierte Plugin-Hooks über `api.on(...)` | Typisierte Hooks haben explizite Verträge, Prioritäten, Zusammenführungsregeln sowie Blockier-/Abbruchsemantik |
| Reinen Telemetrieexport oder Observability hinzufügen                                                                 | Diagnoseereignisse                      | Observability ist ein separater Event-Bus, keine Policy-Hook-Oberfläche                                        |

Verwenden Sie interne Hooks, wenn Sie Automatisierung möchten, die sich wie eine kleine installierte Integration verhält. Verwenden Sie typisierte Plugin-Hooks, wenn Sie Laufzeitsteuerung für den Lebenszyklus benötigen.

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

| Ereignis                 | Wann es ausgelöst wird                                   |
| ------------------------ | -------------------------------------------------------- |
| `command:new`            | Befehl `/new` wurde ausgegeben                           |
| `command:reset`          | Befehl `/reset` wurde ausgegeben                         |
| `command:stop`           | Befehl `/stop` wurde ausgegeben                          |
| `command`                | Beliebiges Befehlsereignis (allgemeiner Listener)        |
| `session:compact:before` | Bevor Compaction den Verlauf zusammenfasst               |
| `session:compact:after`  | Nachdem Compaction abgeschlossen ist                     |
| `session:patch`          | Wenn Sitzungseigenschaften geändert werden               |
| `agent:bootstrap`        | Bevor Workspace-Bootstrap-Dateien injiziert werden       |
| `gateway:startup`        | Nachdem Kanäle gestartet und Hooks geladen wurden        |
| `gateway:shutdown`       | Wenn das Herunterfahren des Gateway beginnt              |
| `gateway:pre-restart`    | Vor einem erwarteten Gateway-Neustart                    |
| `message:received`       | Eingehende Nachricht aus einem beliebigen Kanal          |
| `message:transcribed`    | Nachdem die Audiotranskription abgeschlossen ist         |
| `message:preprocessed`   | Nachdem Medien- und Link-Vorverarbeitung abgeschlossen oder übersprungen wurde |
| `message:sent`           | Ausgehende Nachricht wurde zugestellt                    |

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

| Feld       | Beschreibung                                            |
| ---------- | ------------------------------------------------------- |
| `emoji`    | Anzeige-Emoji für die CLI                               |
| `events`   | Array von Ereignissen, auf die gehört werden soll       |
| `export`   | Zu verwendender benannter Export (Standard: `"default"`) |
| `os`       | Erforderliche Plattformen (z. B. `["darwin", "linux"]`) |
| `requires` | Erforderliche `bins`-, `anyBins`-, `env`- oder `config`-Pfade |
| `always`   | Eignungsprüfungen umgehen (Boolean)                     |
| `install`  | Installationsmethoden                                   |

### Handler-Implementierung

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Jedes Ereignis enthält: `type`, `action`, `sessionKey`, `timestamp`, `messages` (Antworten nur auf antwortfähigen Oberflächen hier per Push hinzufügen) und `context` (ereignisspezifische Daten). Agent- und Tool-Plugin-Hook-Kontexte können außerdem `trace` enthalten, einen schreibgeschützten W3C-kompatiblen Diagnose-Trace-Kontext, den Plugins für die OTEL-Korrelation an strukturierte Logs übergeben können.

`event.messages` wird nur auf antwortfähigen Oberflächen wie
`command:*` und `message:received` automatisch zugestellt. Reine Lebenszyklusereignisse wie
`agent:bootstrap`, `session:*`, `gateway:*` oder `message:sent` haben keinen
Antwortkanal und ignorieren per Push hinzugefügte Nachrichten.

### Wichtige Ereigniskontexte

**Befehlsereignisse** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Nachrichtenereignisse** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (providerspezifische Daten einschließlich `senderId`, `senderName`, `guildId`). `context.content` bevorzugt bei befehlsartigen Nachrichten einen nicht leeren Befehlstext, fällt dann auf den rohen eingehenden Text und den generischen Text zurück; es enthält keine rein agentbezogene Anreicherung wie Thread-Verlauf oder Link-Zusammenfassungen.

**Nachrichtenereignisse** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Nachrichtenereignisse** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Nachrichtenereignisse** (`message:preprocessed`): `context.bodyForAgent` (endgültiger angereicherter Text), `context.from`, `context.channelId`.

**Bootstrap-Ereignisse** (`agent:bootstrap`): `context.bootstrapFiles` (veränderbares Array), `context.agentId`.

**Sitzungs-Patch-Ereignisse** (`session:patch`): `context.sessionEntry`, `context.patch` (nur geänderte Felder), `context.cfg`. Nur privilegierte Clients können Patch-Ereignisse auslösen.

**Compaction-Ereignisse**: `session:compact:before` enthält `messageCount`, `tokenCount`. `session:compact:after` ergänzt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` beobachtet, dass der Benutzer `/stop` ausgibt; es gehört zum Abbruch-/Befehlslebenszyklus, nicht zu einem Gate für die Agent-Finalisierung. Plugins, die eine natürliche Abschlussantwort prüfen und den Agent um einen weiteren Durchlauf bitten müssen, sollten stattdessen den typisierten Plugin-Hook `before_agent_finalize` verwenden. Siehe [Plugin-Hooks](/de/plugins/hooks).

**Gateway-Lebenszyklusereignisse**: `gateway:shutdown` enthält `reason` und `restartExpectedMs` und wird ausgelöst, wenn das Herunterfahren des Gateway beginnt. `gateway:pre-restart` enthält denselben Kontext, wird aber nur ausgelöst, wenn das Herunterfahren Teil eines erwarteten Neustarts ist und ein endlicher Wert für `restartExpectedMs` bereitgestellt wird. Während des Herunterfahrens ist jedes Warten auf Lebenszyklus-Hooks nach bestem Aufwand und begrenzt, sodass das Herunterfahren fortgesetzt wird, wenn ein Handler hängen bleibt. Das standardmäßige Wartebudget beträgt 5 Sekunden für `gateway:shutdown` und 10 Sekunden für `gateway:pre-restart`.

Verwenden Sie `gateway:pre-restart` für kurze Neustarthinweise, solange Kanäle noch verfügbar sind:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Zwischen dem Ereignis `gateway:shutdown` (oder `gateway:pre-restart`) und dem Rest der Herunterfahrsequenz löst der Gateway außerdem für jede Sitzung, die beim Stoppen des Prozesses noch aktiv war, einen typisierten `session_end`-Plugin-Hook aus. Der `reason` des Ereignisses ist `shutdown` bei einem einfachen SIGTERM/SIGINT-Stopp und `restart`, wenn das Schließen als Teil eines erwarteten Neustarts geplant wurde. Dieses Leeren ist begrenzt, sodass ein langsamer `session_end`-Handler den Prozessausstieg nicht blockieren kann; Sitzungen, die bereits durch Ersetzen / Zurücksetzen / Löschen / Compaction finalisiert wurden, werden übersprungen, um doppelte Auslösungen zu vermeiden.

## Hook-Erkennung

Hooks werden aus diesen Verzeichnissen erkannt, in der Reihenfolge zunehmender Überschreibungspriorität:

1. **Gebündelte Hooks**: werden mit OpenClaw ausgeliefert
2. **Plugin-Hooks**: Hooks, die in installierten Plugins gebündelt sind
3. **Verwaltete Hooks**: `~/.openclaw/hooks/` (benutzerinstalliert, workspaceübergreifend geteilt). Zusätzliche Verzeichnisse aus `hooks.internal.load.extraDirs` teilen diese Priorität.
4. **Workspace-Hooks**: `<workspace>/hooks/` (pro Agent, standardmäßig deaktiviert, bis sie ausdrücklich aktiviert werden)

Workspace-Hooks können neue Hook-Namen hinzufügen, aber keine gebündelten, verwalteten oder von Plugins bereitgestellten Hooks mit demselben Namen überschreiben.

Der Gateway überspringt beim Start die Erkennung interner Hooks, bis interne Hooks konfiguriert sind. Aktivieren Sie einen gebündelten oder verwalteten Hook mit `openclaw hooks enable <name>`, installieren Sie ein Hook-Pack oder setzen Sie `hooks.internal.enabled=true`, um sich anzumelden. Wenn Sie einen benannten Hook aktivieren, lädt der Gateway nur den Handler dieses Hooks; `hooks.internal.enabled=true`, zusätzliche Hook-Verzeichnisse und Legacy-Handler melden eine breite Erkennung an.

### Hook-Packs

Hook-Packs sind npm-Pakete, die Hooks über `openclaw.hooks` in `package.json` exportieren. Installation mit:

```bash
openclaw plugins install <path-or-spec>
```

npm-Spezifikationen sind ausschließlich Registry-Spezifikationen (Paketname plus optionale exakte Version oder dist-tag). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt.

## Gebündelte Hooks

| Hook                  | Ereignisse                                        | Funktion                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Speichert Sitzungskontext in `<workspace>/memory/`             |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injiziert zusätzliche Bootstrap-Dateien aus Glob-Mustern       |
| command-logger        | `command`                                         | Protokolliert alle Befehle in `~/.openclaw/logs/commands.log`  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Sendet sichtbare Chat-Hinweise, wenn die Sitzungs-Compaction beginnt/endet |
| boot-md               | `gateway:startup`                                 | Führt `BOOT.md` aus, wenn der Gateway startet                  |

Aktivieren Sie einen beliebigen gebündelten Hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details zu session-memory

Extrahiert die letzten 15 Benutzer-/Assistentennachrichten und speichert sie unter `<workspace>/memory/YYYY-MM-DD-HHMM.md` mit dem lokalen Datum des Hosts. Die Speichererfassung läuft im Hintergrund, sodass Bestätigungen für `/new` und `/reset` nicht durch das Lesen des Transkripts oder die optionale Slug-Erzeugung verzögert werden. Setzen Sie `hooks.internal.entries.session-memory.llmSlug: true`, um beschreibende Dateinamen-Slugs mit dem konfigurierten Modell zu erzeugen. Erfordert, dass `workspace.dir` konfiguriert ist.

<a id="bootstrap-extra-files"></a>

### Konfiguration für bootstrap-extra-files

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

Pfade werden relativ zum Arbeitsbereich aufgelöst. Es werden nur erkannte Bootstrap-Basisnamen geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Details zu command-logger

Protokolliert jeden Slash-Befehl in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Details zu compaction-notifier

Sendet kurze Statusmeldungen in die aktuelle Unterhaltung, wenn OpenClaw mit der Compaction des Sitzungstranskripts beginnt und sie abschließt. Dadurch werden lange Turns auf Chat-Oberflächen weniger verwirrend, weil der Benutzer sehen kann, dass der Assistent den Kontext zusammenfasst und nach der Compaction fortfährt.

<a id="boot-md"></a>

### Details zu boot-md

Führt `BOOT.md` aus dem aktiven Arbeitsbereich aus, wenn der Gateway startet.

## Plugin-Hooks

Plugins können typisierte Hooks über das Plugin SDK für tiefere Integration registrieren:
Abfangen von Tool-Aufrufen, Ändern von Prompts, Steuern des Nachrichtenflusses und mehr.
Verwenden Sie Plugin-Hooks, wenn Sie `before_tool_call`, `before_agent_reply`,
`before_install` oder andere prozessinterne Lifecycle-Hooks benötigen.

Von Plugins verwaltete interne Hooks sind anders: Sie nehmen am groben Befehls-/Lifecycle-Ereignissystem dieser Seite teil und erscheinen in `openclaw hooks list` als
`plugin:<id>`. Verwenden Sie diese für Nebeneffekte und Kompatibilität mit Hook-Paketen, nicht
für geordnete Middleware oder Policy-Gates.

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
Das alte Konfigurationsformat mit dem Array `hooks.internal.handlers` wird aus Gründen der Abwärtskompatibilität weiterhin unterstützt, neue Hooks sollten jedoch das discoverybasierte System verwenden.
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

- **Halten Sie Handler schnell.** Hooks laufen während der Befehlsverarbeitung. Starten Sie aufwendige Arbeit nach dem Fire-and-forget-Prinzip mit `void processInBackground(event)`.
- **Behandeln Sie Fehler elegant.** Umschließen Sie riskante Operationen mit try/catch; werfen Sie keine Fehler, damit andere Handler ausgeführt werden können.
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

### Hook nicht berechtigt

```bash
openclaw hooks info my-hook
```

Prüfen Sie auf fehlende Binärdateien (PATH), Umgebungsvariablen, Konfigurationswerte oder OS-Kompatibilität.

### Hook wird nicht ausgeführt

1. Prüfen Sie, ob der Hook aktiviert ist: `openclaw hooks list`
2. Starten Sie Ihren Gateway-Prozess neu, damit Hooks neu geladen werden.
3. Prüfen Sie die Gateway-Protokolle: `./scripts/clawlog.sh | grep hook`

## Verwandte Themen

- [CLI-Referenz: Hooks](/de/cli/hooks)
- [Webhooks](/de/automation/cron-jobs#webhooks)
- [Plugin-Hooks](/de/plugins/hooks) — prozessinterne Plugin-Lifecycle-Hooks
- [Konfiguration](/de/gateway/configuration-reference#hooks)
