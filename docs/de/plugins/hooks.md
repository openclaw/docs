---
read_when:
    - Sie erstellen ein Plugin, das before_tool_call, before_agent_reply, Nachrichten-Hooks oder Lebenszyklus-Hooks benötigt
    - Sie müssen Tool-Aufrufe eines Plugins blockieren, umschreiben oder eine Genehmigung dafür verlangen.
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agent-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-05-10T19:43:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-Hooks sind prozessinterne Erweiterungspunkte für OpenClaw-Plugins. Verwenden Sie sie,
wenn ein Plugin Agentenläufe, Tool-Aufrufe, Nachrichtenfluss,
Sitzungslebenszyklus, Subagent-Routing, Installationen oder den Gateway-Start prüfen oder ändern muss.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks), wenn Sie ein kleines,
vom Operator installiertes `HOOK.md`-Skript für Befehls- und Gateway-Ereignisse wie
`/new`, `/reset`, `/stop`, `agent:bootstrap` oder `gateway:startup` möchten.

## Schnellstart

Registrieren Sie typisierte Plugin-Hooks mit `api.on(...)` aus Ihrem Plugin-Einstieg:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Hook-Handler werden sequenziell in absteigender `priority` ausgeführt. Hooks
mit gleicher Priorität behalten die Registrierungsreihenfolge bei.

`api.on(name, handler, opts?)` akzeptiert:

- `priority` - Handler-Reihenfolge (höher wird zuerst ausgeführt).
- `timeoutMs` - optionales Budget pro Hook. Wenn gesetzt, bricht der Hook-Runner diesen
  Handler nach Ablauf des Budgets ab und fährt mit dem nächsten fort, anstatt
  langsame Setup- oder Recall-Arbeit das vom Aufrufer konfigurierte Modell-Timeout
  verbrauchen zu lassen. Lassen Sie es weg, um das standardmäßige Beobachtungs-/Entscheidungs-Timeout zu verwenden, das der
  Hook-Runner generisch anwendet.

Operatoren können Hook-Budgets auch setzen, ohne Plugin-Code zu patchen:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` überschreibt `hooks.timeoutMs`, das wiederum den vom
Plugin definierten Wert `api.on(..., { timeoutMs })` überschreibt. Jeder konfigurierte Wert muss
eine positive Ganzzahl von höchstens 600000 Millisekunden sein. Bevorzugen Sie Überschreibungen pro Hook
für bekanntermaßen langsame Hooks, damit ein Plugin nicht überall ein längeres Budget
erhält.

Jeder Hook erhält `event.context.pluginConfig`, die aufgelöste Konfiguration für das
Plugin, das diesen Handler registriert hat. Verwenden Sie sie für Hook-Entscheidungen, die
aktuelle Plugin-Optionen benötigen; OpenClaw injiziert sie pro Handler, ohne das
gemeinsam genutzte Ereignisobjekt zu verändern, das andere Plugins sehen.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettdruck** akzeptieren ein
Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung anfordern); alle anderen dienen
nur der Beobachtung.

**Agenten-Turn**

- `before_model_resolve` - Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `agent_turn_prepare` - in die Warteschlange gestellte Plugin-Turn-Injektionen verbrauchen und Kontext für denselben Turn vor Prompt-Hooks hinzufügen
- `before_prompt_build` - dynamischen Kontext oder System-Prompt-Text vor dem Modellaufruf hinzufügen
- `before_agent_start` - kombinierte Phase nur für Kompatibilität; bevorzugen Sie die beiden Hooks oben
- **`before_agent_run`** - den finalen Prompt und die Sitzungsnachrichten vor der Modellübermittlung prüfen und den Lauf optional blockieren
- **`before_agent_reply`** - den Modell-Turn mit einer synthetischen Antwort oder Stille kurzschließen
- **`before_agent_finalize`** - die natürliche finale Antwort prüfen und einen weiteren Modelldurchlauf anfordern
- `agent_end` - finale Nachrichten, Erfolgsstatus und Laufdauer beobachten
- `heartbeat_prompt_contribution` - Heartbeat-spezifischen Kontext für Hintergrundmonitor- und Lebenszyklus-Plugins hinzufügen

**Konversationsbeobachtung**

- `model_call_started` / `model_call_ended` - bereinigte Provider-/Modellaufruf-Metadaten, Timing, Ergebnis und begrenzte Request-ID-Hashes ohne Prompt- oder Antwortinhalt beobachten
- `llm_input` - Provider-Eingabe beobachten (System-Prompt, Prompt, Verlauf)
- `llm_output` - Provider-Ausgabe beobachten

**Tools**

- **`before_tool_call`** - Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung anfordern
- `after_tool_call` - Tool-Ergebnisse, Fehler und Dauer beobachten
- **`tool_result_persist`** - die aus einem Tool-Ergebnis erzeugte Assistentennachricht umschreiben
- **`before_message_write`** - einen laufenden Nachrichtenschreibvorgang prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** - eine eingehende Nachricht vor dem Agenten-Routing beanspruchen (synthetische Antworten)
- `message_received` - eingehenden Inhalt, Absender, Thread und Metadaten beobachten
- **`message_sending`** - ausgehenden Inhalt umschreiben oder Zustellung abbrechen
- `message_sent` - Erfolg oder Fehler der ausgehenden Zustellung beobachten
- **`before_dispatch`** - einen ausgehenden Dispatch vor der Channel-Übergabe prüfen oder umschreiben
- **`reply_dispatch`** - an der finalen Antwort-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` - Grenzen des Sitzungslebenszyklus verfolgen
- `before_compaction` / `after_compaction` - Compaction-Zyklen beobachten oder annotieren
- `before_reset` - Sitzungs-Reset-Ereignisse beobachten (`/reset`, programmatische Resets)

**Subagenten**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - Subagent-Routing und Abschlusszustellung koordinieren

**Lebenszyklus**

- `gateway_start` / `gateway_stop` - Plugin-eigene Dienste mit dem Gateway starten oder stoppen
- `cron_changed` - vom Gateway verwaltete Cron-Lebenszyklusänderungen beobachten (hinzugefügt, aktualisiert, entfernt, gestartet, abgeschlossen, geplant)
- **`before_install`** - Skill- oder Plugin-Installationsscans prüfen und optional blockieren

## Richtlinie für Tool-Aufrufe

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
- optional `event.derivedPaths`, das Best-Effort-Hinweise zu vom Host abgeleiteten Zielpfaden
  für bekannte Tool-Umschläge wie `apply_patch` enthält; wenn vorhanden,
  können diese Pfade unvollständig sein oder überschätzen, was das Tool
  tatsächlich berühren wird (zum Beispiel bei fehlerhaften oder partiellen Eingaben)
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (bei Cron-gesteuerten Läufen gesetzt) und diagnostisches `ctx.trace`

Er kann zurückgeben:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Regeln:

- `block: true` ist terminal und überspringt Handler mit niedrigerer Priorität.
- `block: false` wird so behandelt, als gäbe es keine Entscheidung.
- `params` schreibt die Tool-Parameter für die Ausführung um.
- `requireApproval` pausiert den Agentenlauf und fragt den Benutzer über Plugin-
  Genehmigungen. Der Befehl `/approve` kann sowohl Exec- als auch Plugin-Genehmigungen erteilen.
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook mit höherer Priorität
  eine Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung - `allow-once`,
  `allow-always`, `deny`, `timeout` oder `cancelled`.

Gebündelte Plugins, die Host-Level-Richtlinien benötigen, können vertrauenswürdige Tool-Richtlinien
mit `api.registerTrustedToolPolicy(...)` registrieren. Diese laufen vor gewöhnlichen
`before_tool_call`-Hooks und vor Entscheidungen externer Plugins. Verwenden Sie sie nur
für vom Host vertrauenswürdige Gates wie Workspace-Richtlinie, Budgetdurchsetzung oder
reservierte Workflow-Sicherheit. Externe Plugins sollten normale `before_tool_call`-
Hooks verwenden.

### Persistenz von Tool-Ergebnissen

Tool-Ergebnisse können strukturierte `details` für UI-Rendering, Diagnosen,
Medien-Routing oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeitmetadaten,
nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor Provider-Replay und Compaction-
  Eingabe, damit Metadaten nicht zu Modellkontext werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Überdimensionierte Details werden
  durch eine kompakte Zusammenfassung und `persistedDetailsTruncated: true` ersetzt.
- `tool_result_persist` und `before_message_write` laufen vor der finalen
  Persistenzbegrenzung. Hooks sollten zurückgegebene `details` dennoch klein halten und vermeiden,
  promptrelevanten Text nur in `details` abzulegen; platzieren Sie für das Modell sichtbare Tool-Ausgabe
  in `content`.

## Prompt- und Modell-Hooks

Verwenden Sie die phasenspezifischen Hooks für neue Plugins:

- `before_model_resolve`: erhält nur den aktuellen Prompt und Anhang-
  Metadaten. Geben Sie `providerOverride` oder `modelOverride` zurück.
- `agent_turn_prepare`: erhält den aktuellen Prompt, vorbereitete Sitzungsnachrichten
  und alle Exactly-once-Injektionen in der Warteschlange, die für diese Sitzung entnommen wurden. Geben Sie
  `prependContext` oder `appendContext` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und Sitzungsnachrichten.
  Geben Sie `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` oder `appendSystemContext` zurück.
- `heartbeat_prompt_contribution`: läuft nur für Heartbeat-Turns und gibt
  `prependContext` oder `appendContext` zurück. Er ist für Hintergrundmonitore vorgesehen,
  die den aktuellen Zustand zusammenfassen müssen, ohne benutzerinitiierte Turns zu ändern.

`before_agent_start` bleibt aus Kompatibilitätsgründen bestehen. Bevorzugen Sie die expliziten Hooks oben,
damit Ihr Plugin nicht von einer veralteten kombinierten Phase abhängt.

`before_agent_run` läuft nach der Prompt-Erstellung und vor jeder Modelleingabe,
einschließlich Prompt-lokalem Laden von Bildern und `llm_input`-Beobachtung. Er erhält
die aktuelle Benutzereingabe als `prompt`, plus geladene Sitzungshistorie in `messages`
und den aktiven System-Prompt. Geben Sie `{ outcome: "block", reason, message? }`
zurück, um den Lauf zu stoppen, bevor das Modell den Prompt lesen kann. `reason` ist intern;
`message` ist der benutzersichtbare Ersatz. Die einzigen unterstützten Ergebnisse sind
`pass` und `block`; nicht unterstützte Entscheidungsformen schlagen geschlossen fehl.

Wenn ein Lauf blockiert wird, speichert OpenClaw nur den Ersatztext in
`message.content` plus nicht sensible Blockierungsmetadaten wie die ID des blockierenden Plugins
und den Zeitstempel. Der ursprüngliche Benutzertext wird nicht im Transcript oder zukünftigen
Kontext beibehalten. Interne Blockierungsgründe werden als sensibel behandelt und aus
Transcript-, Verlaufs-, Broadcast-, Log- und Diagnose-Payloads ausgeschlossen. Observability
sollte bereinigte Felder wie Blocker-ID, Ergebnis, Zeitstempel oder eine sichere
Kategorie verwenden.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw
den aktiven Lauf identifizieren kann. Derselbe Wert ist auch unter `ctx.runId` verfügbar.
Cron-gesteuerte Läufe stellen außerdem `ctx.jobId` bereit (die ID des auslösenden Cron-Jobs), damit
Plugin-Hooks Metriken, Seiteneffekte oder Zustand auf einen bestimmten geplanten
Job eingrenzen können.

Für von Channels stammende Läufe ist `ctx.messageProvider` die Provider-Oberfläche wie
`discord` oder `telegram`, während `ctx.channelId` die Zielkennung der Konversation ist,
wenn OpenClaw sie aus dem Sitzungsschlüssel oder den Zustellungsmetadaten ableiten kann.

`agent_end` ist ein Beobachtungs-Hook und läuft nach dem Turn fire-and-forget. Der
Hook-Runner wendet ein Timeout von 30 Sekunden an, damit ein blockiertes Plugin oder ein Embedding-
Endpunkt das Hook-Promise nicht dauerhaft offen lassen kann. Ein Timeout wird protokolliert und
OpenClaw fährt fort; Plugin-eigene Netzwerkarbeit wird dadurch nicht abgebrochen, es sei denn, das
Plugin verwendet zusätzlich sein eigenes Abbruchsignal.

Verwenden Sie `model_call_started` und `model_call_ended` für Provider-Aufruf-Telemetrie,
die keine rohen Prompts, Verläufe, Antworten, Header, Request-Bodys
oder Provider-Request-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminale
`durationMs`/`outcome` und `upstreamRequestIdHash`, wenn OpenClaw einen
begrenzten Provider-Request-ID-Hash ableiten kann.

`before_agent_finalize` wird nur ausgeführt, wenn ein Harness im Begriff ist, eine natürliche
finale Assistentenantwort zu akzeptieren. Dies ist nicht der Abbruchpfad `/stop` und wird nicht
ausgeführt, wenn der Benutzer einen Turn abbricht. Geben Sie `{ action: "revise", reason }` zurück, um
beim Harness vor der Finalisierung einen weiteren Modelldurchlauf anzufordern, `{ action:
"finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis weg, um fortzufahren.
Native Codex-`Stop`-Hooks werden in diesen Hook als OpenClaw-
`before_agent_finalize`-Entscheidungen weitergeleitet.

Wenn `action: "revise"` zurückgegeben wird, können Plugins `retry`-Metadaten einfügen, um
den zusätzlichen Modelldurchlauf begrenzt und replay-sicher zu machen:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wird an den Revisionsgrund angehängt, der an den Harness gesendet wird.
`idempotencyKey` ermöglicht es dem Host, Wiederholungen für dieselbe Plugin-Anfrage über
äquivalente Finalisierungsentscheidungen hinweg zu zählen, und `maxAttempts` begrenzt, wie viele zusätzliche Durchläufe der
Host zulässt, bevor er mit der natürlichen finalen Antwort fortfährt.

Nicht gebündelte Plugins, die rohe Konversations-Hooks benötigen (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` oder `before_agent_run`), müssen Folgendes setzen:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Prompt-verändernde Hooks und dauerhafte Injektionen für den nächsten Turn können pro Plugin
mit `plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

### Sitzungserweiterungen und Injektionen für den nächsten Turn

Workflow-Plugins können kleinen JSON-kompatiblen Sitzungszustand mit
`api.registerSessionExtension(...)` persistieren und ihn über die Gateway-Methode
`sessions.pluginPatch` aktualisieren. Sitzungszeilen projizieren registrierten Erweiterungszustand
über `pluginExtensions`, sodass Control UI und andere Clients Plugin-eigenen Status rendern können,
ohne Plugin-Interna kennen zu müssen.

Verwenden Sie `api.enqueueNextTurnInjection(...)`, wenn ein Plugin dauerhaften Kontext benötigt, der
genau einmal den nächsten Model-Turn erreichen soll. OpenClaw leert eingereihte Injektionen vor
Prompt-Hooks, verwirft abgelaufene Injektionen und dedupliziert pro Plugin nach `idempotencyKey`.
Dies ist der richtige Ansatzpunkt für Genehmigungsfortsetzungen, Richtlinienzusammenfassungen,
Deltas von Hintergrundmonitoren und Befehlsfortsetzungen, die im nächsten Turn für das Model
sichtbar sein sollen, aber nicht zu dauerhaftem System-Prompt-Text werden sollen.

Bereinigungssemantik ist Teil des Vertrags. Bereinigungs-Callbacks für Sitzungserweiterungen und
Runtime-Lebenszyklus erhalten `reset`, `delete`, `disable` oder
`restart`. Der Host entfernt den persistenten Sitzungserweiterungszustand und die ausstehenden
Injektionen für den nächsten Turn des besitzenden Plugins bei reset/delete/disable; restart behält
dauerhaften Sitzungszustand bei, während Bereinigungs-Callbacks Plugins ermöglichen,
Scheduler-Jobs, Ausführungskontext und andere Out-of-Band-Ressourcen der alten Runtime-Generation
freizugeben.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing und Zustellungsrichtlinien auf Kanalebene:

- `message_received`: eingehenden Inhalt, Absender, `threadId`, `messageId`,
  `senderId`, optionale Lauf-/Sitzungskorrelation und Metadaten beobachten.
- `message_sending`: `content` umschreiben oder `{ cancel: true }` zurückgeben.
- `message_sent`: finalen Erfolg oder Fehler beobachten.

Bei reinen Audio-TTS-Antworten kann `content` das verborgene gesprochene Transkript enthalten,
auch wenn die Kanal-Payload keinen sichtbaren Text/keine sichtbare Beschriftung hat. Das Umschreiben dieses
`content` aktualisiert nur das für Hooks sichtbare Transkript; es wird nicht als
Medienbeschriftung gerendert.

Nachrichten-Hook-Kontexte stellen stabile Korrelationsfelder bereit, wenn verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Bevorzugen Sie
diese erstklassigen Felder, bevor Sie ältere Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie kanalspezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Umgeschriebener `content` wird an Hooks mit niedrigerer Priorität weitergegeben, sofern kein späterer Hook
  die Zustellung abbricht.
- `message_sending` kann `cancelReason` und begrenzte `metadata` zusammen mit einem
  Abbruch zurückgeben. Neue Nachrichten-Lebenszyklus-APIs stellen dies als unterdrücktes Zustellungsergebnis
  mit dem Grund `cancelled_by_message_sending_hook` bereit; ältere direkte
  Zustellung gibt aus Kompatibilitätsgründen weiterhin ein leeres Ergebnisarray zurück.
- `message_sent` dient nur der Beobachtung. Handler-Fehler werden protokolliert und ändern das
  Zustellungsergebnis nicht.

## Installations-Hooks

`before_install` wird nach dem integrierten Scan für Skill- und Plugin-Installationen ausgeführt.
Geben Sie zusätzliche Befunde oder `{ block: true, blockReason }` zurück, um die
Installation zu stoppen.

`block: true` ist terminal. `block: false` wird als keine Entscheidung behandelt.

## Gateway-Lebenszyklus

Verwenden Sie `gateway_start` für Plugin-Dienste, die Gateway-eigenen Zustand benötigen. Der
Kontext stellt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für
Cron-Inspektion und -Aktualisierungen bereit. Verwenden Sie `gateway_stop`, um lang laufende
Ressourcen zu bereinigen.

Verlassen Sie sich für Plugin-eigene Runtime-Dienste nicht auf den internen Hook `gateway:startup`.

`cron_changed` wird bei Gateway-eigenen Cron-Lebenszyklusereignissen mit einer typisierten
Ereignis-Payload ausgelöst, die die Gründe `added`, `updated`, `removed`, `started`, `finished`
und `scheduled` abdeckt. Das Ereignis enthält einen Snapshot `PluginHookGatewayCronJob`
(einschließlich `state.nextRunAtMs`, `state.lastRunStatus` und
`state.lastError`, wenn vorhanden) sowie einen `PluginHookGatewayCronDeliveryStatus`
von `not-requested` | `delivered` | `not-delivered` | `unknown`. Entfernte
Ereignisse enthalten weiterhin den gelöschten Job-Snapshot, damit externe Scheduler den
Zustand abgleichen können. Verwenden Sie `ctx.getCron?.()` und `ctx.config` aus dem Runtime-
Kontext, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als
Quelle der Wahrheit für Fälligkeitsprüfungen und Ausführung bei.

## Bevorstehende Veraltungen

Einige Hook-nahe Oberflächen sind veraltet, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major-Release:

- **Klartext-Kanalumschläge** in `inbound_claim`- und `message_received`-
  Handlern. Lesen Sie stattdessen `BodyForAgent` und die strukturierten Benutzerkontextblöcke,
  anstatt flachen Umschlagtext zu parsen. Siehe
  [Klartext-Kanalumschläge → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen erhalten. Neue Plugins sollten
  `before_model_resolve` und `before_prompt_build` statt der kombinierten
  Phase verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt die typisierte
  Union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) anstelle eines frei formulierten `string`.

Die vollständige Liste - Registrierung von Memory-Fähigkeiten, Provider-Denkprofil,
externe Auth-Provider, Provider-Discovery-Typen, Task-Runtime-Accessors
und die Umbenennung von `command-auth` → `command-status` - finden Sie unter
[Plugin SDK-Migration → Aktive Veraltungen](/de/plugins/sdk-migration#active-deprecations).

## Verwandt

- [Plugin SDK-Migration](/de/plugins/sdk-migration) - aktive Veraltungen und Zeitplan für Entfernungen
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin SDK-Überblick](/de/plugins/sdk-overview)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Interne Plugin-Architektur](/de/plugins/architecture-internals)
