---
read_when:
    - Sie erstellen ein Plugin, das before_tool_call, before_agent_reply, Nachrichten-Hooks oder Lebenszyklus-Hooks benötigt
    - Sie müssen Tool-Aufrufe von einem Plugin blockieren, umschreiben oder genehmigungspflichtig machen.
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agenten-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-05-06T06:57:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-Hooks sind In-Process-Erweiterungspunkte für OpenClaw-Plugins. Verwenden Sie sie,
wenn ein Plugin Agent-Ausführungen, Tool-Aufrufe, Nachrichtenfluss,
Sitzungslebenszyklus, Subagent-Routing, Installationen oder den Gateway-Start prüfen oder ändern muss.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks), wenn Sie ein kleines
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

Hook-Handler werden sequenziell in absteigender `priority` ausgeführt. Hooks mit
gleicher Priorität behalten die Registrierungsreihenfolge bei.

`api.on(name, handler, opts?)` akzeptiert:

- `priority` - Handler-Reihenfolge (höhere Werte werden zuerst ausgeführt).
- `timeoutMs` - optionales Budget pro Hook. Wenn gesetzt, bricht der Hook-Runner diesen
  Handler nach Ablauf des Budgets ab und fährt mit dem nächsten fort, statt
  langsame Einrichtung oder Recall-Arbeit das vom Aufrufer konfigurierte Modell-
  Timeout verbrauchen zu lassen. Lassen Sie den Wert weg, um das standardmäßige Beobachtungs-/Entscheidungs-Timeout zu verwenden, das der
  Hook-Runner allgemein anwendet.

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

`hooks.timeouts.<hookName>` überschreibt `hooks.timeoutMs`, das wiederum den
vom Plugin geschriebenen `api.on(..., { timeoutMs })`-Wert überschreibt. Jeder konfigurierte Wert muss
eine positive Ganzzahl von höchstens 600000 Millisekunden sein. Bevorzugen Sie Hook-spezifische
Überschreibungen für bekanntermaßen langsame Hooks, damit ein Plugin nicht überall
ein längeres Budget erhält.

Jeder Hook erhält `event.context.pluginConfig`, die aufgelöste Konfiguration für das
Plugin, das diesen Handler registriert hat. Verwenden Sie sie für Hook-Entscheidungen, die
aktuelle Plugin-Optionen benötigen; OpenClaw injiziert sie pro Handler, ohne das
gemeinsam genutzte Ereignisobjekt zu verändern, das andere Plugins sehen.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettschrift** akzeptieren ein
Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung anfordern); alle anderen dienen
nur der Beobachtung.

**Agent-Runde**

- `before_model_resolve` - Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `agent_turn_prepare` - eingereihte Plugin-Rundeninjektionen verbrauchen und Kontext für dieselbe Runde vor Prompt-Hooks hinzufügen
- `before_prompt_build` - dynamischen Kontext oder System-Prompt-Text vor dem Modellaufruf hinzufügen
- `before_agent_start` - kombinierte Phase nur aus Kompatibilitätsgründen; bevorzugen Sie die beiden Hooks oben
- **`before_agent_reply`** - die Modellrunde mit einer synthetischen Antwort oder Stille kurzschließen
- **`before_agent_finalize`** - die natürliche finale Antwort prüfen und einen weiteren Modell-Durchlauf anfordern
- `agent_end` - finale Nachrichten, Erfolgsstatus und Ausführungsdauer beobachten
- `heartbeat_prompt_contribution` - Heartbeat-spezifischen Kontext für Hintergrundmonitor- und Lebenszyklus-Plugins hinzufügen

**Konversationsbeobachtung**

- `model_call_started` / `model_call_ended` - bereinigte Provider-/Modellaufruf-Metadaten, Timing, Ergebnis und begrenzte Request-ID-Hashes ohne Prompt- oder Antwortinhalt beobachten
- `llm_input` - Provider-Eingabe beobachten (System-Prompt, Prompt, Verlauf)
- `llm_output` - Provider-Ausgabe beobachten

**Tools**

- **`before_tool_call`** - Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung anfordern
- `after_tool_call` - Tool-Ergebnisse, Fehler und Dauer beobachten
- **`tool_result_persist`** - die aus einem Tool-Ergebnis erzeugte Assistant-Nachricht umschreiben
- **`before_message_write`** - einen laufenden Nachrichtenschreibvorgang prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** - eine eingehende Nachricht vor dem Agent-Routing beanspruchen (synthetische Antworten)
- `message_received` - eingehenden Inhalt, Absender, Thread und Metadaten beobachten
- **`message_sending`** - ausgehenden Inhalt umschreiben oder Zustellung abbrechen
- `message_sent` - Erfolg oder Fehler bei ausgehender Zustellung beobachten
- **`before_dispatch`** - einen ausgehenden Dispatch vor der Channel-Übergabe prüfen oder umschreiben
- **`reply_dispatch`** - an der finalen Reply-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` - Grenzen des Sitzungslebenszyklus verfolgen
- `before_compaction` / `after_compaction` - Compaction-Zyklen beobachten oder annotieren
- `before_reset` - Ereignisse zum Zurücksetzen von Sitzungen beobachten (`/reset`, programmatische Zurücksetzungen)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - Subagent-Routing und Abschlusszustellung koordinieren

**Lebenszyklus**

- `gateway_start` / `gateway_stop` - Plugin-eigene Dienste mit dem Gateway starten oder stoppen
- `cron_changed` - Gateway-eigene Cron-Lebenszyklusänderungen beobachten (hinzugefügt, aktualisiert, entfernt, gestartet, beendet, geplant)
- **`before_install`** - Skill- oder Plugin-Installationsscans prüfen und optional blockieren

## Richtlinie für Tool-Aufrufe

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (bei cron-gesteuerten Ausführungen gesetzt) und diagnostisches `ctx.trace`

Es kann Folgendes zurückgeben:

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
- `block: false` wird als keine Entscheidung behandelt.
- `params` schreibt die Tool-Parameter für die Ausführung um.
- `requireApproval` pausiert die Agent-Ausführung und fragt den Benutzer über Plugin-
  Genehmigungen. Der Befehl `/approve` kann sowohl exec- als auch Plugin-Genehmigungen freigeben.
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook mit höherer Priorität
  eine Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung - `allow-once`,
  `allow-always`, `deny`, `timeout` oder `cancelled`.

Gebündelte Plugins, die Host-Level-Richtlinien benötigen, können vertrauenswürdige Tool-Richtlinien
mit `api.registerTrustedToolPolicy(...)` registrieren. Diese werden vor gewöhnlichen
`before_tool_call`-Hooks und vor Entscheidungen externer Plugins ausgeführt. Verwenden Sie sie nur
für vom Host vertrauenswürdige Gates wie Workspace-Richtlinien, Budgetdurchsetzung oder
reservierte Workflow-Sicherheit. Externe Plugins sollten normale `before_tool_call`-
Hooks verwenden.

### Persistenz von Tool-Ergebnissen

Tool-Ergebnisse können strukturierte `details` für UI-Rendering, Diagnosen,
Medienrouting oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeitmetadaten,
nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor Provider-Replay und Compaction-
  Eingabe, damit Metadaten nicht zu Modellkontext werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Zu große Details werden
  durch eine kompakte Zusammenfassung und `persistedDetailsTruncated: true` ersetzt.
- `tool_result_persist` und `before_message_write` werden vor der finalen
  Persistenzbegrenzung ausgeführt. Hooks sollten zurückgegebene `details` dennoch klein halten und vermeiden,
  promptrelevanten Text nur in `details` abzulegen; legen Sie modell-sichtbare Tool-Ausgabe
  in `content` ab.

## Prompt- und Modell-Hooks

Verwenden Sie die phasenspezifischen Hooks für neue Plugins:

- `before_model_resolve`: erhält nur den aktuellen Prompt und Anhangs-
  Metadaten. Gibt `providerOverride` oder `modelOverride` zurück.
- `agent_turn_prepare`: erhält den aktuellen Prompt, vorbereitete Sitzungsnachrichten
  und alle exakt einmalig eingereihten Injektionen, die für diese Sitzung entnommen wurden. Gibt
  `prependContext` oder `appendContext` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und Sitzungsnachrichten.
  Gibt `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` oder `appendSystemContext` zurück.
- `heartbeat_prompt_contribution`: wird nur für Heartbeat-Runden ausgeführt und gibt
  `prependContext` oder `appendContext` zurück. Es ist für Hintergrundmonitore gedacht,
  die den aktuellen Zustand zusammenfassen müssen, ohne benutzerinitiierte Runden zu ändern.

`before_agent_start` bleibt aus Kompatibilitätsgründen bestehen. Bevorzugen Sie die expliziten Hooks oben,
damit Ihr Plugin nicht von einer alten kombinierten Phase abhängt.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw
die aktive Ausführung identifizieren kann. Derselbe Wert ist auch unter `ctx.runId` verfügbar.
Cron-gesteuerte Ausführungen stellen außerdem `ctx.jobId` bereit (die ID des ursprünglichen Cron-Jobs), damit
Plugin-Hooks Metriken, Seiteneffekte oder Zustand auf einen bestimmten geplanten
Job begrenzen können.

Bei von Channels stammenden Ausführungen ist `ctx.messageProvider` die Provider-Oberfläche wie
`discord` oder `telegram`, während `ctx.channelId` der Zielbezeichner der Konversation ist,
wenn OpenClaw ihn aus dem Sitzungsschlüssel oder den Zustellungs-
Metadaten ableiten kann.

`agent_end` ist ein Beobachtungs-Hook und läuft fire-and-forget nach der Runde. Der
Hook-Runner wendet ein Timeout von 30 Sekunden an, damit ein blockiertes Plugin oder ein Embedding-
Endpoint das Hook-Promise nicht dauerhaft ausstehend lassen kann. Ein Timeout wird protokolliert und
OpenClaw fährt fort; Plugin-eigene Netzwerkarbeit wird dadurch nicht abgebrochen, es sei denn, das
Plugin verwendet auch ein eigenes Abort-Signal.

Verwenden Sie `model_call_started` und `model_call_ended` für Provider-Aufruf-Telemetrie,
die keine Roh-Prompts, Verläufe, Antworten, Header, Request-
Bodies oder Provider-Request-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminale
`durationMs`/`outcome` und `upstreamRequestIdHash`, wenn OpenClaw einen
begrenzten Provider-Request-ID-Hash ableiten kann.

`before_agent_finalize` wird nur ausgeführt, wenn ein Harness eine natürliche
finale Assistant-Antwort akzeptieren will. Es ist nicht der `/stop`-Abbruchpfad und wird nicht
ausgeführt, wenn der Benutzer eine Runde abbricht. Geben Sie `{ action: "revise", reason }` zurück, um
das Harness vor der Finalisierung um einen weiteren Modell-Durchlauf zu bitten, `{ action:
"finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis weg, um fortzufahren.
Native Codex-`Stop`-Hooks werden als OpenClaw-
`before_agent_finalize`-Entscheidungen an diesen Hook weitergeleitet.

Beim Zurückgeben von `action: "revise"` können Plugins `retry`-Metadaten einschließen, um
den zusätzlichen Modell-Durchlauf begrenzt und replay-sicher zu machen:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wird an den Revisionsgrund angehängt, der an das Harness gesendet wird.
`idempotencyKey` erlaubt dem Host, Wiederholungen für dieselbe Plugin-Anforderung über
äquivalente Finalisierungsentscheidungen hinweg zu zählen, und `maxAttempts` begrenzt, wie viele zusätzliche Durchläufe der
Host zulässt, bevor er mit der natürlichen finalen Antwort fortfährt.

Nicht gebündelte Plugins, die `llm_input`, `llm_output`,
`before_agent_finalize` oder `agent_end` benötigen, müssen Folgendes setzen:

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

Prompt-verändernde Hooks und dauerhafte Next-Turn-Injektionen können pro Plugin
mit `plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

### Sitzungserweiterungen und Next-Turn-Injektionen

Workflow-Plugins können kleinen JSON-kompatiblen Sitzungszustand mit
`api.registerSessionExtension(...)` speichern und ihn über die Gateway-Methode
`sessions.pluginPatch` aktualisieren. Sitzungszeilen projizieren registrierten Erweiterungszustand
über `pluginExtensions`, sodass Control UI und andere Clients
Plugin-eigenen Status darstellen können, ohne Plugin-Interna kennen zu müssen.

Verwenden Sie `api.enqueueNextTurnInjection(...)`, wenn ein Plugin dauerhaften Kontext
genau einmal bis zum nächsten Model-Turn bringen muss. OpenClaw verarbeitet eingereihte Injections vor
Prompt-Hooks, verwirft abgelaufene Injections und dedupliziert pro Plugin nach
`idempotencyKey`. Dies ist die richtige Schnittstelle für Approval-Resumes, Policy-Zusammenfassungen,
Deltas von Hintergrundmonitoren und Befehlsfortsetzungen, die im nächsten Turn
für das Modell sichtbar sein sollen, aber nicht zu dauerhaftem System-Prompt-Text werden dürfen.

Cleanup-Semantik ist Teil des Vertrags. Cleanup-Callbacks für Sitzungserweiterungen und
Runtime-Lifecycle erhalten `reset`, `delete`, `disable` oder
`restart`. Der Host entfernt den persistenten Sitzungserweiterungszustand des besitzenden Plugins
und ausstehende Next-Turn-Injections bei Reset/Delete/Disable; Restart behält
dauerhaften Sitzungszustand bei, während Cleanup-Callbacks Plugins erlauben, Scheduler-Jobs,
Run-Kontext und andere Out-of-Band-Ressourcen der alten Runtime-Generation
freizugeben.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing und Zustellrichtlinien auf Channel-Ebene:

- `message_received`: Eingehende Inhalte, Absender, `threadId`, `messageId`,
  `senderId`, optionale Run-/Sitzungskorrelation und Metadaten beobachten.
- `message_sending`: `content` umschreiben oder `{ cancel: true }` zurückgeben.
- `message_sent`: Endgültigen Erfolg oder Fehler beobachten.

Bei reinen Audio-TTS-Antworten kann `content` das verborgene gesprochene Transkript
enthalten, selbst wenn die Channel-Payload keinen sichtbaren Text/keine sichtbare Beschriftung hat. Das Umschreiben dieses
`content` aktualisiert nur das für Hooks sichtbare Transkript; es wird nicht als
Medienbeschriftung gerendert.

Nachrichten-Hook-Kontexte stellen stabile Korrelationsfelder bereit, sofern verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Bevorzugen Sie
diese First-Class-Felder, bevor Sie Legacy-Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie Channel-spezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Umgeschriebener `content` läuft weiter zu Hooks mit niedrigerer Priorität, sofern kein späterer Hook
  die Zustellung abbricht.

## Installations-Hooks

`before_install` läuft nach dem integrierten Scan für Skill- und Plugin-Installationen.
Geben Sie zusätzliche Befunde oder `{ block: true, blockReason }` zurück, um die
Installation zu stoppen.

`block: true` ist terminal. `block: false` wird als keine Entscheidung behandelt.

## Gateway-Lifecycle

Verwenden Sie `gateway_start` für Plugin-Dienste, die Gateway-eigenen Zustand benötigen. Der
Kontext stellt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für
Cron-Inspektion und -Aktualisierungen bereit. Verwenden Sie `gateway_stop`, um lang laufende
Ressourcen aufzuräumen.

Verlassen Sie sich für Plugin-eigene Runtime-Dienste nicht auf den internen Hook
`gateway:startup`.

`cron_changed` wird bei Gateway-eigenen Cron-Lifecycle-Ereignissen mit einer typisierten
Event-Payload ausgelöst, die die Gründe `added`, `updated`, `removed`, `started`, `finished`
und `scheduled` abdeckt. Das Event enthält einen `PluginHookGatewayCronJob`-
Snapshot (einschließlich `state.nextRunAtMs`, `state.lastRunStatus` und
`state.lastError`, sofern vorhanden) sowie einen `PluginHookGatewayCronDeliveryStatus`
von `not-requested` | `delivered` | `not-delivered` | `unknown`. Removed-
Events enthalten weiterhin den Snapshot des gelöschten Jobs, damit externe Scheduler den
Zustand abgleichen können. Verwenden Sie `ctx.getCron?.()` und `ctx.config` aus dem Runtime-
Kontext, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als
Source of Truth für Fälligkeitsprüfungen und Ausführung bei.

## Kommende Deprecations

Einige Hook-nahe Oberflächen sind deprecated, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major-Release:

- **Plaintext-Channel-Envelopes** in `inbound_claim`- und `message_received`-
  Handlern. Lesen Sie `BodyForAgent` und die strukturierten User-Context-Blöcke,
  statt flachen Envelope-Text zu parsen. Siehe
  [Plaintext-Channel-Envelopes → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen erhalten. Neue Plugins sollten
  `before_model_resolve` und `before_prompt_build` statt der kombinierten
  Phase verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt die typisierte
  Union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) statt eines frei formulierten `string`.

Die vollständige Liste - Registrierung der Memory-Capability, Provider-Thinking-
Profile, externe Auth-Providers, Provider-Discovery-Typen, Task-Runtime-
Accessors und die Umbenennung von `command-auth` → `command-status` - finden Sie unter
[Plugin-SDK-Migration → Aktive Deprecations](/de/plugins/sdk-migration#active-deprecations).

## Verwandt

- [Plugin-SDK-Migration](/de/plugins/sdk-migration) - aktive Deprecations und Zeitplan für Entfernungen
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-SDK-Überblick](/de/plugins/sdk-overview)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Interne Plugin-Architektur](/de/plugins/architecture-internals)
