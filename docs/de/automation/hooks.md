---
read_when:
    - Sie möchten eine ereignisgesteuerte Automatisierung für /new, /reset, /stop und Ereignisse im Agentenlebenszyklus
    - Sie möchten Hooks erstellen, installieren oder debuggen
summary: 'Hooks: ereignisgesteuerte Automatisierung für Befehle und Lebenszyklusereignisse'
title: Hooks
x-i18n:
    generated_at: "2026-07-12T14:58:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hooks sind kleine Skripte, die innerhalb des Gateways ausgeführt werden, wenn Agent-Ereignisse ausgelöst werden: Befehle wie `/new`, `/reset`, `/stop`, Session-Compaction, Gateway-Lebenszyklus und Nachrichtenfluss. Sie werden in Verzeichnissen erkannt und mit `openclaw hooks` verwaltet. Das Gateway lädt interne Hooks erst, nachdem Sie Hooks aktiviert oder mindestens einen Hook-Eintrag, ein Hook-Paket, einen Legacy-Handler oder ein zusätzliches Hook-Verzeichnis konfiguriert haben.

In OpenClaw gibt es zwei Arten von Hooks:

- **Interne Hooks** (diese Seite): werden innerhalb des Gateways ausgeführt, wenn Agent-Ereignisse ausgelöst werden.
- **Webhooks**: externe HTTP-Endpunkte, über die andere Systeme Arbeit in OpenClaw auslösen können. Siehe [Webhooks](/de/automation/cron-jobs#webhooks).

Hooks können auch in Plugins gebündelt sein. `openclaw hooks list` zeigt sowohl eigenständige Hooks als auch von Plugins verwaltete Hooks an (dargestellt als `plugin:<id>`).

## Die richtige Schnittstelle auswählen

OpenClaw bietet mehrere Erweiterungsschnittstellen, die ähnlich aussehen, aber unterschiedliche Probleme lösen:

| Wenn Sie Folgendes möchten ...                                                                                                                | Verwenden Sie ...                              | Warum                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Bei `/new` einen Snapshot speichern, `/reset` protokollieren, nach `message:sent` eine externe API aufrufen oder grobe Betreiberautomatisierung hinzufügen | Interne Hooks (`HOOK.md`, diese Seite)         | Dateibasierte Hooks sind für betreiberverwaltete Nebeneffekte sowie Befehls- und Lebenszyklusautomatisierung gedacht |
| Prompts umschreiben, Tools blockieren, ausgehende Nachrichten abbrechen oder geordnete Middleware/Richtlinien hinzufügen                       | Typisierte Plugin-Hooks über `api.on(...)`     | Typisierte Hooks haben explizite Verträge, Prioritäten, Zusammenführungsregeln und Blockierungs-/Abbruchsemantik     |
| Ausschließlich Telemetrie exportieren oder Beobachtbarkeit hinzufügen                                                                          | Diagnoseereignisse                             | Beobachtbarkeit verwendet einen separaten Ereignisbus und ist keine Schnittstelle für Richtlinien-Hooks             |

Verwenden Sie interne Hooks, wenn Sie eine Automatisierung wünschen, die sich wie eine kleine installierte Integration verhält. Verwenden Sie typisierte Plugin-Hooks, wenn Sie Kontrolle über den Laufzeitlebenszyklus benötigen.

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

Hooks abonnieren einen bestimmten Schlüssel aus dieser Tabelle oder einen reinen Familiennamen
(`command`, `session`, `agent`, `gateway`, `message`), um jede Aktion
dieser Familie zu empfangen. Der OpenClaw-Kern gibt keine anderen Ereignisse aus, daher ist jeder andere Name fast
immer ein Tippfehler, durch den der Hook unbemerkt inaktiv bleibt (nur ein Plugin, das ein
benutzerdefiniertes Ereignis ausgibt, könnte ihn auslösen). Der Hook-Loader protokolliert für solche Namen
eine Warnung (zum Beispiel `command:nwe`), und `openclaw hooks info <name>` kennzeichnet sie, sodass ein
Hook, der nie ausgeführt wird, diagnostiziert werden kann.

| Ereignis                 | Auslösezeitpunkt                                                       |
| ------------------------ | --------------------------------------------------------------------- |
| `command:new`            | Der Befehl `/new` wird ausgegeben                                     |
| `command:reset`          | Der Befehl `/reset` wird ausgegeben                                   |
| `command:stop`           | Der Befehl `/stop` wird ausgegeben                                    |
| `command`                | Beliebiges Befehlsereignis (allgemeiner Listener)                     |
| `session:compact:before` | Bevor die Compaction den Verlauf zusammenfasst                        |
| `session:compact:after`  | Nachdem die Compaction abgeschlossen ist                              |
| `session:patch`          | Wenn Session-Eigenschaften geändert werden                            |
| `agent:bootstrap`        | Bevor Workspace-Bootstrap-Dateien eingefügt werden                    |
| `gateway:startup`        | Nachdem Kanäle gestartet und Hooks geladen wurden                     |
| `gateway:shutdown`       | Wenn das Herunterfahren des Gateways beginnt                          |
| `gateway:pre-restart`    | Vor einem erwarteten Neustart des Gateways                            |
| `message:received`       | Eingehende Nachricht von einem beliebigen Kanal                       |
| `message:transcribed`    | Nachdem die Audiotranskription abgeschlossen ist                      |
| `message:preprocessed`   | Nachdem die Medien- und Link-Vorverarbeitung abgeschlossen oder übersprungen wurde |
| `message:sent`           | Versuch, eine ausgehende Nachricht zu senden (`context.success` enthält das Ergebnis) |

## Hooks schreiben

### Hook-Struktur

Jeder Hook ist ein Verzeichnis, das zwei Dateien enthält:

```text
my-hook/
├── HOOK.md          # Metadaten + Dokumentation
└── handler.ts       # Handler-Implementierung
```

Die Handler-Datei kann `handler.ts`, `handler.js`, `index.ts` oder `index.js` sein.

### Format von HOOK.md

```markdown
---
name: my-hook
description: "Kurze Beschreibung der Funktion dieses Hooks"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Mein Hook

Hier folgt die ausführliche Dokumentation.
```

**Metadatenfelder** (`metadata.openclaw`):

| Feld       | Beschreibung                                                   |
| ---------- | -------------------------------------------------------------- |
| `emoji`    | Anzeige-Emoji für die CLI                                      |
| `events`   | Array der Ereignisse, auf die gewartet werden soll             |
| `export`   | Zu verwendeter benannter Export (Standardwert: `"default"`)    |
| `os`       | Erforderliche Plattformen (z. B. `["darwin", "linux"]`)        |
| `requires` | Erforderliche `bins`-, `anyBins`-, `env`- oder `config`-Pfade  |
| `always`   | Eignungsprüfungen umgehen (boolescher Wert)                    |
| `hookKey`  | Überschreibung des Konfigurationsschlüssels (Standardwert ist der Hook-Name) |
| `homepage` | Von `openclaw hooks info` angezeigte Dokumentations-URL        |
| `install`  | Installationsmethoden                                          |

### Handler-Implementierung

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] Neuer Befehl ausgelöst`);
  // Ihre Logik hier

  // Optional eine Antwort auf antwortfähigen Schnittstellen senden
  event.messages.push("Hook ausgeführt!");
};

export default handler;
```

Jedes Ereignis enthält: `type`, `action`, `sessionKey`, `timestamp`, `messages` und `context` (ereignisspezifische Daten). Typisierte Plugin-Hook-Kontexte für Agent- und Tool-Hooks können außerdem `trace` enthalten, einen schreibgeschützten, W3C-kompatiblen diagnostischen Trace-Kontext, den Plugins zur OTEL-Korrelation an strukturierte Protokolle übergeben können.

An `event.messages` angehängte Zeichenfolgen werden nur bei
`command:new` und `command:reset` an den Chat zurückgegeben (als Antwort an die ursprüngliche
Unterhaltung weitergeleitet) sowie bei `session:compact:before` / `session:compact:after`
(als Compaction-Statusmeldungen gesendet). Alle anderen Ereignisse, einschließlich
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch` und
`gateway:*`, ignorieren angehängte Nachrichten.

### Wichtige Angaben zum Ereigniskontext

**Befehlsereignisse** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Befehlsereignisse** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Nachrichtenereignisse** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (Provider-spezifische Daten einschließlich `senderId`, `senderName`, `guildId`). `context.content` bevorzugt bei befehlsähnlichen Nachrichten einen nicht leeren Befehlstext und greift anschließend auf den unverarbeiteten eingehenden Text sowie den allgemeinen Text zurück; ausschließlich für den Agenten bestimmte Anreicherungen wie Thread-Verlauf oder Link-Zusammenfassungen sind nicht enthalten.

**Nachrichtenereignisse** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId` sowie `context.error`, wenn das Senden fehlgeschlagen ist.

**Nachrichtenereignisse** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Nachrichtenereignisse** (`message:preprocessed`): `context.bodyForAgent` (endgültiger angereicherter Text), `context.from`, `context.channelId`.

**Bootstrap-Ereignisse** (`agent:bootstrap`): `context.bootstrapFiles` (veränderbares Array), `context.agentId`.

**Session-Patch-Ereignisse** (`session:patch`): `context.sessionEntry`, `context.patch` (nur geänderte Felder), `context.cfg`. Nur privilegierte Clients können Patch-Ereignisse auslösen; der Kontext ist ein Klon, daher können Handler den aktiven Session-Eintrag nicht verändern.

**Compaction-Ereignisse**: `session:compact:before` enthält `messageCount`, `tokenCount`. `session:compact:after` ergänzt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` erfasst, dass der Benutzer `/stop` ausgibt; es gehört zum Abbruch-/Befehlslebenszyklus
und ist keine Schranke für die Agent-Finalisierung. Plugins, die eine
natürliche endgültige Antwort prüfen und den Agenten um einen weiteren Durchlauf bitten müssen, sollten stattdessen den typisierten
Plugin-Hook `before_agent_finalize` verwenden. Siehe [Plugin-Hooks](/de/plugins/hooks).

**Gateway-Lebenszyklusereignisse**: `gateway:shutdown` enthält `reason` und `restartExpectedMs` und wird ausgelöst, wenn das Herunterfahren des Gateways beginnt. `gateway:pre-restart` enthält denselben Kontext, wird aber nur ausgelöst, wenn das Herunterfahren Teil eines erwarteten Neustarts ist und ein endlicher Wert für `restartExpectedMs` angegeben wird. Während des Herunterfahrens ist das Warten auf jeden Lebenszyklus-Hook nach bestem Bemühen zeitlich begrenzt, sodass das Herunterfahren fortgesetzt wird, wenn ein Handler hängen bleibt. Das standardmäßige Zeitbudget beträgt 5 Sekunden für `gateway:shutdown` und 10 Sekunden für `gateway:pre-restart`.

Verwenden Sie `gateway:pre-restart` für kurze Neustarthinweise, solange die Kanäle noch verfügbar sind:

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
    `Gateway wird in etwa ${restartInSeconds} s neu gestartet (${event.context.reason}). Jetzt einen Prüfpunkt erstellen.`,
  ]);
}
```

Zwischen dem Ereignis `gateway:shutdown` (oder `gateway:pre-restart`) und dem restlichen Ablauf des Herunterfahrens löst das Gateway außerdem für jede Session, die beim Beenden des Prozesses noch aktiv war, einen typisierten Plugin-Hook `session_end` aus. Der Wert `reason` des Ereignisses ist bei einem normalen Beenden durch SIGTERM/SIGINT `shutdown` und `restart`, wenn das Schließen als Teil eines erwarteten Neustarts geplant wurde. Diese Verarbeitung ist zeitlich begrenzt, sodass ein langsamer `session_end`-Handler das Beenden des Prozesses nicht blockieren kann. Sessions, die bereits durch Ersetzen / Zurücksetzen / Löschen / Compaction finalisiert wurden, werden übersprungen, um eine doppelte Auslösung zu vermeiden.

## Hook-Erkennung

Hooks werden aus vier Quellen erkannt:

1. **Gebündelte Hooks**: werden mit OpenClaw ausgeliefert
2. **Plugin-Hooks**: sind in installierten Plugins gebündelt; können gebündelte Hooks mit demselben Namen überschreiben
3. **Verwaltete Hooks**: `~/.openclaw/hooks/` (vom Benutzer installiert und Workspace-übergreifend gemeinsam genutzt); können gebündelte und Plugin-Hooks überschreiben. Zusätzliche Verzeichnisse aus `hooks.internal.load.extraDirs` haben dieselbe Priorität.
4. **Workspace-Hooks**: `<workspace>/hooks/` (pro Agent, standardmäßig deaktiviert, bis sie ausdrücklich aktiviert werden)

Workspace-Hooks können neue Hook-Namen hinzufügen, aber keine von gebündelten, verwalteten oder Plugins bereitgestellten Hooks mit demselben Namen überschreiben.

Das Gateway überspringt beim Start die Erkennung interner Hooks, bis interne Hooks konfiguriert sind. Aktivieren Sie einen gebündelten oder verwalteten Hook mit `openclaw hooks enable <name>`, installieren Sie ein Hook-Paket oder setzen Sie `hooks.internal.enabled=true`, um die Funktion zu aktivieren. Wenn Sie einen benannten Hook aktivieren, lädt das Gateway nur den Handler dieses Hooks; `hooks.internal.enabled=true`, zusätzliche Hook-Verzeichnisse und Legacy-Handler aktivieren die umfassende Erkennung.

### Hook-Pakete

Hook-Pakete sind npm-Pakete, die Hooks über `openclaw.hooks` in `package.json` exportieren. Installieren Sie sie mit:

```bash
openclaw plugins install <path-or-spec>
```

Npm-Spezifikationen sind ausschließlich für die Registry zulässig (Paketname + optionale exakte Version oder dist-tag). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt. Die älteren Befehle `openclaw hooks install` und `openclaw hooks update` sind veraltete Aliase für `openclaw plugins install` / `openclaw plugins update`.

## Mitgelieferte Hooks

| Hook                  | Ereignisse                                        | Funktion                                                               |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Speichert den Sitzungskontext unter `<workspace>/memory/`              |
| bootstrap-extra-files | `agent:bootstrap`                                 | Fügt zusätzliche Bootstrap-Dateien anhand von Glob-Mustern ein         |
| command-logger        | `command`                                         | Protokolliert alle Befehle in `~/.openclaw/logs/commands.log`          |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Sendet sichtbare Chat-Hinweise, wenn die Sitzungs-Compaction beginnt/endet |
| boot-md               | `gateway:startup`                                 | Führt `BOOT.md` beim Start des Gateways aus                            |

So aktivieren Sie einen beliebigen mitgelieferten Hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Details zu session-memory

Extrahiert die letzten Benutzer-/Assistentennachrichten (standardmäßig 15, konfigurierbar mit `hooks.internal.entries.session-memory.messages`) und speichert sie unter Verwendung des lokalen Datums des Hosts in `<workspace>/memory/YYYY-MM-DD-HHMM.md`. Die Speichererfassung wird im Hintergrund ausgeführt, damit Bestätigungen für `/new` und `/reset` nicht durch das Lesen des Transkripts oder die optionale Slug-Generierung verzögert werden. Setzen Sie `hooks.internal.entries.session-memory.llmSlug: true`, um aussagekräftige Dateinamen-Slugs zu generieren, und legen Sie optional `hooks.internal.entries.session-memory.model` auf einen konfigurierten Alias wie `sonnet`, eine reine Modell-ID beim Standard-Provider des Agenten oder eine `provider/model`-Referenz fest. Wenn `model` nicht angegeben ist, verwendet die Slug-Generierung das Standardmodell des Agenten und greift auf Zeitstempel-Slugs zurück, wenn es nicht verfügbar ist. Erfordert, dass `workspace.dir` konfiguriert ist.

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

`patterns` und `files` werden als Aliase für `paths` akzeptiert. Pfade werden relativ zum Arbeitsbereich aufgelöst und müssen innerhalb davon bleiben. Nur erkannte Bootstrap-Basisdateinamen werden geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Details zu command-logger

Protokolliert jeden Slash-Befehl als JSON-Zeile (Zeitstempel, Aktion, Sitzungsschlüssel, Absender-ID, Quelle) in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Details zu compaction-notifier

Sendet kurze Statusmeldungen in die aktuelle Unterhaltung, wenn OpenClaw mit der Compaction des Sitzungstranskripts beginnt und sie abschließt. Dadurch sind lange Durchläufe auf Chat-Oberflächen weniger verwirrend, weil Benutzer sehen können, dass der Assistent den Kontext zusammenfasst und nach der Compaction fortfährt.

<a id="boot-md"></a>

### Details zu boot-md

Führt `BOOT.md` beim Start des Gateways für jeden konfigurierten Agentenbereich aus, sofern die Datei im aufgelösten Arbeitsbereich dieses Agenten vorhanden ist.

## Plugin-Hooks

Plugins können über das Plugin SDK typisierte Hooks für eine tiefere Integration registrieren:
Abfangen von Tool-Aufrufen, Ändern von Prompts, Steuern des Nachrichtenflusses und mehr.
Verwenden Sie Plugin-Hooks, wenn Sie `before_tool_call`, `before_agent_reply`,
`before_install` oder andere prozessinterne Lebenszyklus-Hooks benötigen.

Von Plugins verwaltete interne Hooks unterscheiden sich davon: Sie nehmen am auf dieser Seite beschriebenen
groben Befehls-/Lebenszyklus-Ereignissystem teil und werden in `openclaw hooks list` als
`plugin:<id>` angezeigt. Verwenden Sie diese für Nebeneffekte und die Kompatibilität mit Hook-Paketen, nicht
für geordnete Middleware oder Richtlinien-Gates.

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

Hook-spezifische Umgebungswerte erfüllen die Eignungsprüfungen eines Hooks für `requires.env` (zusammen mit der Prozessumgebung), und Handler können sie aus ihrem Hook-Konfigurationseintrag lesen:

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
Das veraltete Array-Konfigurationsformat `hooks.internal.handlers` wird aus Gründen der Abwärtskompatibilität weiterhin unterstützt, neue Hooks sollten jedoch das erkennungsbasierte System verwenden.
</Note>

## CLI-Referenz

```bash
# Alle Hooks auflisten (--eligible, --verbose oder --json hinzufügen)
openclaw hooks list

# Detaillierte Informationen zu einem Hook anzeigen
openclaw hooks info <hook-name>

# Zusammenfassung der Eignung anzeigen
openclaw hooks check

# Aktivieren/deaktivieren
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Bewährte Vorgehensweisen

- **Halten Sie Handler schnell.** Hooks werden während der Befehlsverarbeitung ausgeführt. Starten Sie aufwendige Arbeit nach dem Fire-and-Forget-Prinzip mit `void processInBackground(event)`.
- **Behandeln Sie Fehler kontrolliert.** Umschließen Sie riskante Operationen mit try/catch; lösen Sie keine Ausnahme aus, damit andere Handler ausgeführt werden können.
- **Filtern Sie Ereignisse frühzeitig.** Kehren Sie sofort zurück, wenn der Ereignistyp/die Aktion nicht relevant ist.
- **Verwenden Sie spezifische Ereignisschlüssel.** Bevorzugen Sie `"events": ["command:new"]` gegenüber `"events": ["command"]`, um den Aufwand zu reduzieren.

## Fehlerbehebung

### Hook wird nicht erkannt

```bash
# Verzeichnisstruktur überprüfen
ls -la ~/.openclaw/hooks/my-hook/
# Sollte Folgendes anzeigen: HOOK.md, handler.ts

# Alle erkannten Hooks auflisten
openclaw hooks list
```

### Hook ist nicht geeignet

```bash
openclaw hooks info my-hook
```

Prüfen Sie auf fehlende Binärdateien (PATH), Umgebungsvariablen, Konfigurationswerte oder Betriebssystemkompatibilität.

### Hook wird nicht ausgeführt

1. Überprüfen Sie, ob der Hook aktiviert ist: `openclaw hooks list`
2. Starten Sie Ihren Gateway-Prozess neu, damit die Hooks erneut geladen werden.
3. Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow | grep -i hook`

## Verwandte Themen

- [CLI-Referenz: Hooks](/de/cli/hooks)
- [Webhooks](/de/automation/cron-jobs#webhooks)
- [Plugin-Hooks](/de/plugins/hooks) — prozessinterne Plugin-Lebenszyklus-Hooks
- [Konfiguration](/de/gateway/configuration-reference#hooks)
