---
read_when:
    - Sie erstellen ein Plugin, das before_tool_call, before_agent_reply, Nachrichten-Hooks oder Lebenszyklus-Hooks benötigt
    - Sie müssen Tool-Aufrufe eines Plugins blockieren, umschreiben oder eine Genehmigung dafür erforderlich machen
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agent-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-04-30T07:05:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
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

Hook-Handler werden sequenziell mit absteigender `priority` ausgeführt. Hooks
mit derselben Priorität behalten die Registrierungsreihenfolge bei.

`api.on(name, handler, opts?)` akzeptiert:

- `priority` — Handler-Reihenfolge (höhere Werte werden zuerst ausgeführt).
- `timeoutMs` — optionales Budget pro Hook. Wenn gesetzt, bricht der Hook-Runner
  diesen Handler nach Ablauf des Budgets ab und fährt mit dem nächsten fort,
  statt langsame Einrichtung oder Recall-Arbeit das konfigurierte Modell-Timeout
  des Aufrufers verbrauchen zu lassen. Lassen Sie es weg, um das standardmäßige
  Beobachtungs-/Entscheidungs-Timeout zu verwenden, das der Hook-Runner generisch anwendet.

Jeder Hook erhält `event.context.pluginConfig`, die aufgelöste Konfiguration für das
Plugin, das diesen Handler registriert hat. Verwenden Sie sie für Hook-Entscheidungen, die
aktuelle Plugin-Optionen benötigen; OpenClaw injiziert sie pro Handler, ohne das
geteilte Event-Objekt zu mutieren, das andere Plugins sehen.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettdruck** akzeptieren ein
Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung anfordern); alle anderen dienen
nur der Beobachtung.

**Agent-Turn**

- `before_model_resolve` — Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `agent_turn_prepare` — eingereihte Plugin-Turn-Injektionen verbrauchen und Kontext für denselben Turn vor Prompt-Hooks hinzufügen
- `before_prompt_build` — dynamischen Kontext oder System-Prompt-Text vor dem Modellaufruf hinzufügen
- `before_agent_start` — kombinierte Phase nur zur Kompatibilität; bevorzugen Sie die beiden Hooks oben
- **`before_agent_reply`** — den Modell-Turn mit einer synthetischen Antwort oder Stille kurzschließen
- **`before_agent_finalize`** — die natürliche finale Antwort prüfen und einen weiteren Modell-Durchlauf anfordern
- `agent_end` — finale Nachrichten, Erfolgszustand und Ausführungsdauer beobachten
- `heartbeat_prompt_contribution` — Heartbeat-spezifischen Kontext für Hintergrundmonitor- und Lebenszyklus-Plugins hinzufügen

**Konversationsbeobachtung**

- `model_call_started` / `model_call_ended` — bereinigte Provider-/Modellaufruf-Metadaten, Timing, Ergebnis und begrenzte Request-ID-Hashes ohne Prompt- oder Antwortinhalte beobachten
- `llm_input` — Provider-Eingabe beobachten (System-Prompt, Prompt, Verlauf)
- `llm_output` — Provider-Ausgabe beobachten

**Tools**

- **`before_tool_call`** — Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung anfordern
- `after_tool_call` — Tool-Ergebnisse, Fehler und Dauer beobachten
- **`tool_result_persist`** — die aus einem Tool-Ergebnis erzeugte Assistant-Nachricht umschreiben
- **`before_message_write`** — einen laufenden Nachrichtenschreibvorgang prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** — eine eingehende Nachricht vor dem Agent-Routing beanspruchen (synthetische Antworten)
- `message_received` — eingehende Inhalte, Absender, Thread und Metadaten beobachten
- **`message_sending`** — ausgehende Inhalte umschreiben oder Zustellung abbrechen
- `message_sent` — Erfolg oder Fehler der ausgehenden Zustellung beobachten
- **`before_dispatch`** — einen ausgehenden Dispatch vor der Channel-Übergabe prüfen oder umschreiben
- **`reply_dispatch`** — an der finalen Reply-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` — Grenzen des Sitzungslebenszyklus verfolgen
- `before_compaction` / `after_compaction` — Compaction-Zyklen beobachten oder annotieren
- `before_reset` — Sitzungs-Reset-Ereignisse beobachten (`/reset`, programmatische Resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — Subagent-Routing und Abschlusszustellung koordinieren

**Lebenszyklus**

- `gateway_start` / `gateway_stop` — Plugin-eigene Dienste mit dem Gateway starten oder stoppen
- `cron_changed` — gateway-eigene Cron-Lebenszyklusänderungen beobachten (hinzugefügt, aktualisiert, entfernt, gestartet, beendet, geplant)
- **`before_install`** — Skill- oder Plugin-Installationsscans prüfen und optional blockieren

## Tool-Aufruf-Richtlinie

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (bei cron-gesteuerten Ausführungen gesetzt) und diagnostisches `ctx.trace`

Es kann zurückgeben:

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
  Genehmigungen. Der Befehl `/approve` kann sowohl Exec- als auch Plugin-Genehmigungen genehmigen.
- Ein `block: true` mit niedrigerer Priorität kann immer noch blockieren, nachdem ein Hook
  mit höherer Priorität eine Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung — `allow-once`,
  `allow-always`, `deny`, `timeout` oder `cancelled`.

Gebündelte Plugins, die eine Richtlinie auf Host-Ebene benötigen, können vertrauenswürdige Tool-Richtlinien
mit `api.registerTrustedToolPolicy(...)` registrieren. Diese werden vor gewöhnlichen
`before_tool_call`-Hooks und vor Entscheidungen externer Plugins ausgeführt. Verwenden Sie sie nur
für host-vertrauenswürdige Schranken wie Workspace-Richtlinie, Budgetdurchsetzung oder
reservierte Workflow-Sicherheit. Externe Plugins sollten normale `before_tool_call`-
Hooks verwenden.

### Persistenz von Tool-Ergebnissen

Tool-Ergebnisse können strukturierte `details` für UI-Rendering, Diagnosen,
Medien-Routing oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeitmetadaten,
nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor Provider-Replay und Compaction-
  Eingabe, damit Metadaten nicht zu Modellkontext werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Zu große Details werden
  durch eine kompakte Zusammenfassung und `persistedDetailsTruncated: true` ersetzt.
- `tool_result_persist` und `before_message_write` werden vor der finalen
  Persistenzbegrenzung ausgeführt. Hooks sollten zurückgegebene `details` dennoch klein halten und vermeiden,
  promptrelevanten Text nur in `details` abzulegen; legen Sie für das Modell sichtbare Tool-Ausgabe
  in `content` ab.

## Prompt- und Modell-Hooks

Verwenden Sie für neue Plugins die phasenspezifischen Hooks:

- `before_model_resolve`: erhält nur den aktuellen Prompt und Anhangs-
  Metadaten. Geben Sie `providerOverride` oder `modelOverride` zurück.
- `agent_turn_prepare`: erhält den aktuellen Prompt, vorbereitete Sitzungsnachrichten
  und alle genau einmal eingereihten Injektionen, die für diese Sitzung geleert wurden. Geben Sie
  `prependContext` oder `appendContext` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und Sitzungsnachrichten.
  Geben Sie `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` oder `appendSystemContext` zurück.
- `heartbeat_prompt_contribution`: wird nur für Heartbeat-Turns ausgeführt und gibt
  `prependContext` oder `appendContext` zurück. Es ist für Hintergrundmonitore
  gedacht, die den aktuellen Zustand zusammenfassen müssen, ohne von Benutzern initiierte Turns zu ändern.

`before_agent_start` bleibt aus Kompatibilitätsgründen bestehen. Bevorzugen Sie die expliziten Hooks oben,
damit Ihr Plugin nicht von einer alten kombinierten Phase abhängt.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw die
aktive Ausführung identifizieren kann. Derselbe Wert ist auch unter `ctx.runId` verfügbar.
Cron-gesteuerte Ausführungen stellen außerdem `ctx.jobId` bereit (die ID des ursprünglichen Cron-Jobs), damit
Plugin-Hooks Metriken, Seiteneffekte oder Zustand auf einen bestimmten geplanten
Job begrenzen können.

`agent_end` ist ein Beobachtungs-Hook und wird nach dem Turn fire-and-forget ausgeführt. Der
Hook-Runner wendet ein Timeout von 30 Sekunden an, damit ein festhängendes Plugin oder ein Embedding-
Endpoint das Hook-Promise nicht für immer ausstehend lassen kann. Ein Timeout wird protokolliert und
OpenClaw fährt fort; Plugin-eigene Netzwerkarbeit wird dadurch nicht abgebrochen, es sei denn, das
Plugin verwendet zusätzlich ein eigenes Abort-Signal.

Verwenden Sie `model_call_started` und `model_call_ended` für Provider-Aufruf-Telemetrie,
die keine Roh-Prompts, Verläufe, Antworten, Header, Request-
Bodies oder Provider-Request-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminale
`durationMs`/`outcome` und `upstreamRequestIdHash`, wenn OpenClaw einen
begrenzten Provider-Request-ID-Hash ableiten kann.

`before_agent_finalize` wird nur ausgeführt, wenn ein Harness kurz davor ist, eine natürliche
finale Assistant-Antwort zu akzeptieren. Es ist nicht der `/stop`-Abbruchpfad und wird nicht
ausgeführt, wenn der Benutzer einen Turn abbricht. Geben Sie `{ action: "revise", reason }` zurück, um
den Harness vor der Finalisierung um einen weiteren Modell-Durchlauf zu bitten, `{ action:
"finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis weg, um fortzufahren.
Native Codex-`Stop`-Hooks werden als OpenClaw-
`before_agent_finalize`-Entscheidungen in diesen Hook weitergeleitet.

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

Prompt-mutierende Hooks und dauerhafte Next-Turn-Injektionen können pro Plugin
mit `plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

### Sitzungserweiterungen und Next-Turn-Injektionen

Workflow-Plugins können kleinen JSON-kompatiblen Sitzungszustand mit
`api.registerSessionExtension(...)` persistieren und über die Gateway-
Methode `sessions.pluginPatch` aktualisieren. Sitzungszeilen projizieren registrierten Erweiterungszustand
über `pluginExtensions`, sodass Control UI und andere Clients
Plugin-eigenen Status rendern können, ohne Plugin-Interna zu kennen.

Verwenden Sie `api.enqueueNextTurnInjection(...)`, wenn ein Plugin dauerhaften Kontext benötigt, der
den nächsten Modell-Turn genau einmal erreicht. OpenClaw leert eingereihte Injektionen vor
Prompt-Hooks, verwirft abgelaufene Injektionen und dedupliziert pro Plugin nach `idempotencyKey`.
Dies ist die richtige Schnittstelle für Genehmigungsfortsetzungen, Richtlinienzusammenfassungen,
Deltas von Hintergrundmonitoren und Befehlsfortsetzungen, die im nächsten Turn
für das Modell sichtbar sein sollen, aber nicht zu permanentem System-Prompt-Text werden sollen.

Cleanup-Semantik ist Teil des Vertrags. Cleanup-Callbacks für Sitzungserweiterungen und
Laufzeit-Lebenszyklus erhalten `reset`, `delete`, `disable` oder
`restart`. Der Host entfernt den persistenten Sitzungserweiterungszustand
und ausstehende Next-Turn-Injektionen des besitzenden Plugins bei Reset/Delete/Disable; Restart behält
dauerhaften Sitzungszustand bei, während Cleanup-Callbacks Plugins erlauben,
Scheduler-Jobs, Ausführungskontext und andere Out-of-Band-Ressourcen für die alte Laufzeit-
Generation freizugeben.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing- und Zustellungsrichtlinien auf Channel-Ebene:

- `message_received`: eingehende Inhalte, Absender, `threadId`, `messageId`,
  `senderId`, optionale Ausführungs-/Sitzungskorrelation und Metadaten beobachten.
- `message_sending`: `content` umschreiben oder `{ cancel: true }` zurückgeben.
- `message_sent`: finalen Erfolg oder Fehler beobachten.

Bei Nur-Audio-TTS-Antworten kann `content` das verborgene gesprochene Transkript
enthalten, auch wenn die Channel-Payload keinen sichtbaren Text/keine sichtbare Beschriftung hat. Das Umschreiben dieses
`content` aktualisiert nur das für Hooks sichtbare Transkript; es wird nicht als
Medienbeschriftung gerendert.

Nachrichten-Hook-Kontexte legen stabile Korrelationsfelder offen, wenn verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Bevorzugen Sie
diese First-Class-Felder, bevor Sie Legacy-Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie channelspezifische
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

## Gateway-Lebenszyklus

Verwenden Sie `gateway_start` für Plugin-Dienste, die Gateway-eigenen Zustand benötigen. Der
Kontext legt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für
Cron-Inspektion und -Aktualisierungen offen. Verwenden Sie `gateway_stop`, um lang laufende
Ressourcen zu bereinigen.

Verlassen Sie sich nicht auf den internen Hook `gateway:startup` für Plugin-eigene Runtime-
Dienste.

`cron_changed` wird für Gateway-eigene Cron-Lebenszyklusereignisse mit einer typisierten
Event-Payload ausgelöst, die die Gründe `added`, `updated`, `removed`, `started`, `finished`
und `scheduled` abdeckt. Das Event enthält einen `PluginHookGatewayCronJob`-
Snapshot (einschließlich `state.nextRunAtMs`, `state.lastRunStatus` und
`state.lastError`, sofern vorhanden) sowie einen `PluginHookGatewayCronDeliveryStatus`
von `not-requested` | `delivered` | `not-delivered` | `unknown`. Entfernte
Events enthalten weiterhin den Snapshot des gelöschten Jobs, damit externe Scheduler den
Zustand abgleichen können. Verwenden Sie beim Synchronisieren externer Wake-Scheduler
`ctx.getCron?.()` und `ctx.config` aus dem Runtime-Kontext, und behalten Sie OpenClaw als
Source of Truth für Fälligkeitsprüfungen und Ausführung bei.

## Anstehende Deprecations

Einige Hook-nahe Oberflächen sind deprecated, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major Release:

- **Plaintext-Channel-Envelopes** in `inbound_claim`- und `message_received`-
  Handlern. Lesen Sie `BodyForAgent` und die strukturierten Benutzerkontext-Blöcke,
  statt flachen Envelope-Text zu parsen. Siehe
  [Plaintext-Channel-Envelopes → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen erhalten. Neue Plugins sollten
  `before_model_resolve` und `before_prompt_build` anstelle der kombinierten
  Phase verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt die typisierte
  Union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) anstelle eines frei formulierten `string`.

Die vollständige Liste — Registrierung von Memory-Capabilities, Provider-Thinking-
Profil, externe Auth-Provider, Provider-Discovery-Typen, Task-Runtime-
Accessors und die Umbenennung von `command-auth` zu `command-status` — finden Sie unter
[Plugin SDK-Migration → Aktive Deprecations](/de/plugins/sdk-migration#active-deprecations).

## Verwandt

- [Plugin SDK-Migration](/de/plugins/sdk-migration) — aktive Deprecations und Zeitplan für Entfernungen
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin SDK-Überblick](/de/plugins/sdk-overview)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Interne Plugin-Architektur](/de/plugins/architecture-internals)
