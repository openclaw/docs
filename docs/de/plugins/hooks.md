---
read_when:
    - Sie erstellen ein Plugin, das before_tool_call, before_agent_reply, Nachrichten-Hooks oder Lebenszyklus-Hooks benötigt
    - Sie müssen Tool-Aufrufe von einem Plugin blockieren, umschreiben oder eine Genehmigung dafür verlangen
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agenten-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-05-06T17:59:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-Hooks sind In-Process-Erweiterungspunkte für OpenClaw-Plugins. Verwenden Sie sie, wenn ein Plugin Agent-Ausführungen, Tool-Aufrufe, Nachrichtenfluss, Sitzungslebenszyklus, Subagent-Routing, Installationen oder den Gateway-Start prüfen oder ändern muss.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks), wenn Sie ein kleines, vom Operator installiertes `HOOK.md`-Skript für Befehls- und Gateway-Ereignisse wie `/new`, `/reset`, `/stop`, `agent:bootstrap` oder `gateway:startup` benötigen.

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

Hook-Handler werden nacheinander in absteigender `priority` ausgeführt. Hooks mit gleicher Priorität behalten die Registrierungsreihenfolge bei.

`api.on(name, handler, opts?)` akzeptiert:

- `priority` - Reihenfolge der Handler (höhere Werte werden zuerst ausgeführt).
- `timeoutMs` - optionales Budget pro Hook. Wenn gesetzt, bricht der Hook-Runner diesen Handler nach Ablauf des Budgets ab und fährt mit dem nächsten fort, statt zuzulassen, dass langsame Einrichtung oder Recall-Arbeit das vom Aufrufer konfigurierte Modell-Timeout verbraucht. Lassen Sie es weg, um das Standard-Timeout für Beobachtung/Entscheidung zu verwenden, das der Hook-Runner allgemein anwendet.

Operatoren können Hook-Budgets auch festlegen, ohne Plugin-Code zu patchen:

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

`hooks.timeouts.<hookName>` überschreibt `hooks.timeoutMs`, was den vom Plugin angegebenen Wert `api.on(..., { timeoutMs })` überschreibt. Jeder konfigurierte Wert muss eine positive ganze Zahl von höchstens 600000 Millisekunden sein. Bevorzugen Sie Überschreibungen pro Hook für bekannte langsame Hooks, damit ein Plugin nicht überall ein längeres Budget erhält.

Jeder Hook erhält `event.context.pluginConfig`, die aufgelöste Konfiguration für das Plugin, das diesen Handler registriert hat. Verwenden Sie sie für Hook-Entscheidungen, die aktuelle Plugin-Optionen benötigen; OpenClaw injiziert sie pro Handler, ohne das gemeinsam genutzte Ereignisobjekt zu verändern, das andere Plugins sehen.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettschrift** akzeptieren ein Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung anfordern); alle anderen dienen nur der Beobachtung.

**Agent-Durchlauf**

- `before_model_resolve` - Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `agent_turn_prepare` - in die Warteschlange gestellte Plugin-Durchlauf-Injektionen konsumieren und Kontext für denselben Durchlauf vor Prompt-Hooks hinzufügen
- `before_prompt_build` - dynamischen Kontext oder System-Prompt-Text vor dem Modellaufruf hinzufügen
- `before_agent_start` - kombinierte Phase nur aus Kompatibilitätsgründen; bevorzugen Sie die beiden Hooks oben
- **`before_agent_run`** - den finalen Prompt und die Sitzungsnachrichten vor der Modellübermittlung prüfen und die Ausführung optional blockieren
- **`before_agent_reply`** - den Modelldurchlauf mit einer synthetischen Antwort oder Stille kurzschließen
- **`before_agent_finalize`** - die natürliche finale Antwort prüfen und einen weiteren Modelldurchlauf anfordern
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
- **`before_message_write`** - einen laufenden Schreibvorgang einer Nachricht prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** - eine eingehende Nachricht vor dem Agent-Routing beanspruchen (synthetische Antworten)
- `message_received` - eingehenden Inhalt, Absender, Thread und Metadaten beobachten
- **`message_sending`** - ausgehenden Inhalt umschreiben oder Zustellung abbrechen
- `message_sent` - erfolgreiche oder fehlgeschlagene ausgehende Zustellung beobachten
- **`before_dispatch`** - einen ausgehenden Dispatch vor der Channel-Übergabe prüfen oder umschreiben
- **`reply_dispatch`** - an der finalen Antwort-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` - Sitzungslebenszyklus-Grenzen verfolgen
- `before_compaction` / `after_compaction` - Compaction-Zyklen beobachten oder annotieren
- `before_reset` - Sitzungs-Reset-Ereignisse beobachten (`/reset`, programmgesteuerte Resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - Subagent-Routing und Abschlusszustellung koordinieren

**Lebenszyklus**

- `gateway_start` / `gateway_stop` - Plugin-eigene Dienste mit dem Gateway starten oder stoppen
- `cron_changed` - Gateway-eigene Cron-Lebenszyklusänderungen beobachten (hinzugefügt, aktualisiert, entfernt, gestartet, abgeschlossen, geplant)
- **`before_install`** - Skills- oder Plugin-Installationsscans prüfen und optional blockieren

## Richtlinie für Tool-Aufrufe

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId` (bei Cron-gesteuerten Ausführungen gesetzt) und diagnostisches `ctx.trace`

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
- `requireApproval` pausiert die Agent-Ausführung und fragt den Benutzer über Plugin-Genehmigungen. Der Befehl `/approve` kann sowohl Exec- als auch Plugin-Genehmigungen erteilen.
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook mit höherer Priorität Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung - `allow-once`, `allow-always`, `deny`, `timeout` oder `cancelled`.

Gebündelte Plugins, die Policy auf Host-Ebene benötigen, können vertrauenswürdige Tool-Policies mit `api.registerTrustedToolPolicy(...)` registrieren. Diese werden vor gewöhnlichen `before_tool_call`-Hooks und vor Entscheidungen externer Plugins ausgeführt. Verwenden Sie sie nur für vom Host vertrauenswürdige Gates wie Workspace-Policy, Budgetdurchsetzung oder Sicherheit reservierter Workflows. Externe Plugins sollten normale `before_tool_call`-Hooks verwenden.

### Tool-Ergebnis-Persistierung

Tool-Ergebnisse können strukturierte `details` für UI-Rendering, Diagnose, Medienrouting oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeitmetadaten, nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor Provider-Replay und Compaction-Eingabe, damit Metadaten nicht zu Modellkontext werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Zu große Details werden durch eine kompakte Zusammenfassung und `persistedDetailsTruncated: true` ersetzt.
- `tool_result_persist` und `before_message_write` laufen vor der finalen Persistenzobergrenze. Hooks sollten zurückgegebene `details` dennoch klein halten und vermeiden, promptrelevanten Text nur in `details` abzulegen; legen Sie für das Modell sichtbare Tool-Ausgaben in `content` ab.

## Prompt- und Modell-Hooks

Verwenden Sie die phasenspezifischen Hooks für neue Plugins:

- `before_model_resolve`: erhält nur den aktuellen Prompt und Anhangsmetadaten. Geben Sie `providerOverride` oder `modelOverride` zurück.
- `agent_turn_prepare`: erhält den aktuellen Prompt, vorbereitete Sitzungsnachrichten und alle genau einmal in die Warteschlange gestellten Injektionen, die für diese Sitzung geleert wurden. Geben Sie `prependContext` oder `appendContext` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und Sitzungsnachrichten. Geben Sie `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` zurück.
- `heartbeat_prompt_contribution`: läuft nur für Heartbeat-Durchläufe und gibt `prependContext` oder `appendContext` zurück. Er ist für Hintergrundmonitore gedacht, die den aktuellen Zustand zusammenfassen müssen, ohne benutzerinitiierte Durchläufe zu verändern.

`before_agent_start` bleibt aus Kompatibilitätsgründen erhalten. Bevorzugen Sie die expliziten Hooks oben, damit Ihr Plugin nicht von einer älteren kombinierten Phase abhängt.

`before_agent_run` läuft nach der Prompt-Erstellung und vor jeder Modelleingabe, einschließlich promptlokalem Laden von Bildern und `llm_input`-Beobachtung. Es erhält die aktuelle Benutzereingabe als `prompt`, außerdem den geladenen Sitzungsverlauf in `messages` und den aktiven System-Prompt. Geben Sie `{ outcome: "block", reason, message? }` zurück, um die Ausführung zu stoppen, bevor das Modell den Prompt lesen kann. `reason` ist intern; `message` ist der benutzerseitige Ersatz. Die einzigen unterstützten Ergebnisse sind `pass` und `block`; nicht unterstützte Entscheidungsformen schlagen geschlossen fehl.

Wenn eine Ausführung blockiert wird, speichert OpenClaw nur den Ersatztext in `message.content` plus nicht sensible Blockierungsmetadaten wie die ID des blockierenden Plugins und den Zeitstempel. Der ursprüngliche Benutzertext wird weder im Transkript noch in künftigem Kontext beibehalten. Interne Blockierungsgründe werden als sensibel behandelt und aus Transkript-, Verlaufs-, Broadcast-, Log- und Diagnose-Payloads ausgeschlossen. Beobachtbarkeit sollte bereinigte Felder wie Blocker-ID, Ergebnis, Zeitstempel oder eine sichere Kategorie verwenden.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw die aktive Ausführung identifizieren kann. Derselbe Wert ist auch auf `ctx.runId` verfügbar. Cron-gesteuerte Ausführungen stellen außerdem `ctx.jobId` bereit (die ID des auslösenden Cron-Jobs), damit Plugin-Hooks Metriken, Seiteneffekte oder Zustand auf einen bestimmten geplanten Job beschränken können.

Bei channel-originierenden Ausführungen ist `ctx.messageProvider` die Provider-Oberfläche wie `discord` oder `telegram`, während `ctx.channelId` der Zielbezeichner der Konversation ist, wenn OpenClaw ihn aus dem Sitzungsschlüssel oder Zustellmetadaten ableiten kann.

`agent_end` ist ein Beobachtungs-Hook und läuft nach dem Durchlauf nach dem Fire-and-forget-Prinzip. Der Hook-Runner wendet ein Timeout von 30 Sekunden an, damit ein blockiertes Plugin oder ein Embedding-Endpunkt das Hook-Promise nicht dauerhaft ausstehend lässt. Ein Timeout wird protokolliert, und OpenClaw fährt fort; Plugin-eigene Netzwerkarbeit wird dadurch nicht abgebrochen, es sei denn, das Plugin verwendet zusätzlich sein eigenes Abort-Signal.

Verwenden Sie `model_call_started` und `model_call_ended` für Provider-Aufruf-Telemetrie, die keine rohen Prompts, Verläufe, Antworten, Header, Request-Bodies oder Provider-Request-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie `runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminale `durationMs`/`outcome` und `upstreamRequestIdHash`, wenn OpenClaw einen begrenzten Provider-Request-ID-Hash ableiten kann.

`before_agent_finalize` läuft nur, wenn ein Harness im Begriff ist, eine natürliche finale Assistant-Antwort zu akzeptieren. Es ist nicht der `/stop`-Abbruchpfad und läuft nicht, wenn der Benutzer einen Durchlauf abbricht. Geben Sie `{ action: "revise", reason }` zurück, um vom Harness vor der Finalisierung einen weiteren Modelldurchlauf anzufordern, `{ action: "finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis weg, um fortzufahren. Native Codex-`Stop`-Hooks werden in diesen Hook als OpenClaw-`before_agent_finalize`-Entscheidungen weitergeleitet.

Bei der Rückgabe von `action: "revise"` können Plugins `retry`-Metadaten einschließen, um den zusätzlichen Modelldurchlauf begrenzt und replay-sicher zu machen:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wird an den Revisionsgrund angehängt, der an das Harness gesendet wird.
`idempotencyKey` lässt den Host Wiederholungen für dieselbe Plugin-Anfrage über
äquivalente Finalisierungsentscheidungen hinweg zählen, und `maxAttempts` begrenzt, wie viele zusätzliche Durchläufe der
Host zulässt, bevor er mit der natürlichen endgültigen Antwort fortfährt.

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

Prompt-verändernde Hooks und dauerhafte Einspeisungen für die nächste Runde können pro Plugin
mit `plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

### Sitzungserweiterungen und Einspeisungen für die nächste Runde

Workflow-Plugins können kleinen JSON-kompatiblen Sitzungszustand mit
`api.registerSessionExtension(...)` persistieren und ihn über die Gateway-Methode
`sessions.pluginPatch` aktualisieren. Sitzungszeilen projizieren registrierten Erweiterungszustand
über `pluginExtensions`, sodass Control UI und andere Clients
Plugin-eigenen Status darstellen können, ohne Plugin-Interna zu kennen.

Verwenden Sie `api.enqueueNextTurnInjection(...)`, wenn ein Plugin dauerhaften Kontext
genau einmal bis zur nächsten Modellrunde bringen muss. OpenClaw leert eingereihte Einspeisungen vor
Prompt-Hooks, verwirft abgelaufene Einspeisungen und dedupliziert pro Plugin nach `idempotencyKey`.
Dies ist die richtige Schnittstelle für Genehmigungsfortsetzungen, Richtlinienzusammenfassungen,
Deltas von Hintergrundmonitoren und Befehlsfortsetzungen, die für das Modell in der nächsten Runde
sichtbar sein sollen, aber nicht zu dauerhaftem System-Prompt-Text werden sollen.

Bereinigungssemantik ist Teil des Vertrags. Bereinigung von Sitzungserweiterungen und
Bereinigungs-Callbacks des Laufzeit-Lebenszyklus erhalten `reset`, `delete`, `disable` oder
`restart`. Der Host entfernt den persistenten Sitzungserweiterungszustand des besitzenden Plugins
und ausstehende Einspeisungen für die nächste Runde bei Zurücksetzen/Löschen/Deaktivieren; Neustart behält
dauerhaften Sitzungszustand bei, während Bereinigungs-Callbacks Plugins Scheduler-Jobs,
Ausführungskontext und andere Out-of-band-Ressourcen für die alte Laufzeitgeneration
freigeben lassen.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing auf Kanalebene und Zustellrichtlinien:

- `message_received`: eingehenden Inhalt, Absender, `threadId`, `messageId`,
  `senderId`, optionale Ausführungs-/Sitzungskorrelation und Metadaten beobachten.
- `message_sending`: `content` umschreiben oder `{ cancel: true }` zurückgeben.
- `message_sent`: endgültigen Erfolg oder Fehler beobachten.

Für reine Audio-TTS-Antworten kann `content` das verborgene gesprochene Transkript enthalten,
auch wenn die Kanal-Nutzlast keinen sichtbaren Text/keine sichtbare Beschriftung hat. Das Umschreiben dieses
`content` aktualisiert nur das für Hooks sichtbare Transkript; es wird nicht als
Medienbeschriftung gerendert.

Nachrichten-Hook-Kontexte stellen stabile Korrelationsfelder bereit, wenn verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Bevorzugen Sie
diese erstklassigen Felder, bevor Sie veraltete Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie kanalspezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Umgeschriebener `content` wird an Hooks mit niedrigerer Priorität weitergegeben, sofern kein späterer Hook
  die Zustellung abbricht.

## Installations-Hooks

`before_install` wird nach dem integrierten Scan für Skill- und Plugin-Installationen ausgeführt.
Geben Sie zusätzliche Befunde oder `{ block: true, blockReason }` zurück, um die
Installation zu stoppen.

`block: true` ist terminal. `block: false` wird als keine Entscheidung behandelt.

## Gateway-Lebenszyklus

Verwenden Sie `gateway_start` für Plugin-Dienste, die Gateway-eigenen Zustand benötigen. Der
Kontext stellt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für
Cron-Inspektion und -Aktualisierungen bereit. Verwenden Sie `gateway_stop`, um langlaufende
Ressourcen zu bereinigen.

Verlassen Sie sich für Plugin-eigene Laufzeitdienste nicht auf den internen Hook
`gateway:startup`.

`cron_changed` wird für Gateway-eigene Cron-Lebenszyklusereignisse mit einer typisierten
Ereignis-Nutzlast ausgelöst, die die Gründe `added`, `updated`, `removed`, `started`, `finished`
und `scheduled` abdeckt. Das Ereignis enthält einen Snapshot `PluginHookGatewayCronJob`
(einschließlich `state.nextRunAtMs`, `state.lastRunStatus` und
`state.lastError`, wenn vorhanden) sowie einen `PluginHookGatewayCronDeliveryStatus`
von `not-requested` | `delivered` | `not-delivered` | `unknown`. Entfernte
Ereignisse enthalten weiterhin den Snapshot des gelöschten Jobs, damit externe Scheduler den
Zustand abgleichen können. Verwenden Sie `ctx.getCron?.()` und `ctx.config` aus dem Laufzeitkontext,
wenn Sie externe Weck-Scheduler synchronisieren, und behalten Sie OpenClaw als
maßgebliche Quelle für Fälligkeitsprüfungen und Ausführung bei.

## Bevorstehende Abkündigungen

Einige hook-nahe Oberflächen sind abgekündigt, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major-Release:

- **Klartext-Kanalumschläge** in Handlern für `inbound_claim` und `message_received`.
  Lesen Sie stattdessen `BodyForAgent` und die strukturierten Benutzerkontextblöcke,
  statt flachen Umschlagtext zu parsen. Siehe
  [Klartext-Kanalumschläge → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen erhalten. Neue Plugins sollten
  stattdessen `before_model_resolve` und `before_prompt_build` anstelle der kombinierten
  Phase verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt die typisierte
  Union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) anstelle eines frei formulierten `string`.

Die vollständige Liste - Registrierung von Speicherfähigkeiten, Provider-Denkprofil,
externe Authentifizierungs-Provider, Provider-Erkennungstypen, Task-Laufzeit-Accessors
und die Umbenennung von `command-auth` zu `command-status` - finden Sie unter
[Plugin-SDK-Migration → Aktive Abkündigungen](/de/plugins/sdk-migration#active-deprecations).

## Verwandt

- [Plugin-SDK-Migration](/de/plugins/sdk-migration) - aktive Abkündigungen und Zeitplan für die Entfernung
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Plugin-Architektur-Interna](/de/plugins/architecture-internals)
