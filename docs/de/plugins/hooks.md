---
read_when:
    - Sie erstellen ein Plugin, das before_tool_call, before_agent_reply, Nachrichten-Hooks oder Lebenszyklus-Hooks benötigt
    - Sie müssen Tool-Aufrufe von einem Plugin blockieren, umschreiben oder genehmigungspflichtig machen.
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agent-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-05-11T20:34:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-Hooks sind prozessinterne Erweiterungspunkte für OpenClaw-Plugins. Verwenden Sie sie,
wenn ein Plugin Agent-Ausführungen, Tool-Aufrufe, Nachrichtenfluss,
Sitzungslebenszyklus, Subagent-Routing, Installationen oder Gateway-Start prüfen oder ändern muss.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks), wenn Sie ein kleines,
vom Operator installiertes `HOOK.md`-Skript für Befehls- und Gateway-Ereignisse wie
`/new`, `/reset`, `/stop`, `agent:bootstrap` oder `gateway:startup` wünschen.

## Schnellstart

Registrieren Sie typisierte Plugin-Hooks mit `api.on(...)` aus dem Einstiegspunkt Ihres Plugins:

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

- `priority` - Handler-Reihenfolge (höhere Werte laufen zuerst).
- `timeoutMs` - optionales Budget pro Hook. Wenn gesetzt, bricht der Hook-Runner
  diesen Handler nach Ablauf des Budgets ab und fährt mit dem nächsten fort,
  statt langsame Einrichtung oder Abrufarbeit das vom Aufrufer konfigurierte
  Modell-Timeout verbrauchen zu lassen. Lassen Sie es weg, um das standardmäßige
  Beobachtungs-/Entscheidungs-Timeout zu verwenden, das der Hook-Runner allgemein anwendet.

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

`hooks.timeouts.<hookName>` überschreibt `hooks.timeoutMs`, was den vom Plugin
verfassten Wert `api.on(..., { timeoutMs })` überschreibt. Jeder konfigurierte
Wert muss eine positive Ganzzahl von höchstens 600000 Millisekunden sein.
Bevorzugen Sie Überschreibungen pro Hook für bekanntermaßen langsame Hooks,
damit ein Plugin nicht überall ein längeres Budget erhält.

Jeder Hook erhält `event.context.pluginConfig`, die aufgelöste Konfiguration für
das Plugin, das diesen Handler registriert hat. Verwenden Sie sie für Hook-Entscheidungen,
die aktuelle Plugin-Optionen benötigen; OpenClaw injiziert sie pro Handler,
ohne das gemeinsam genutzte Ereignisobjekt zu verändern, das andere Plugins sehen.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettdruck**
akzeptieren ein Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder
Genehmigung anfordern); alle anderen dienen nur der Beobachtung.

**Agent-Durchlauf**

- `before_model_resolve` - Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `agent_turn_prepare` - eingereihte Plugin-Turn-Injektionen verbrauchen und Kontext für denselben Durchlauf vor Prompt-Hooks hinzufügen
- `before_prompt_build` - dynamischen Kontext oder System-Prompt-Text vor dem Modellaufruf hinzufügen
- `before_agent_start` - kombinierte Phase nur aus Kompatibilitätsgründen; bevorzugen Sie die zwei Hooks oben
- **`before_agent_run`** - den endgültigen Prompt und Sitzungsnachrichten vor der Modellübermittlung prüfen und die Ausführung optional blockieren
- **`before_agent_reply`** - den Modell-Durchlauf mit einer synthetischen Antwort oder Stille kurzschließen
- **`before_agent_finalize`** - die natürliche finale Antwort prüfen und einen weiteren Modelllauf anfordern
- `agent_end` - finale Nachrichten, Erfolgsstatus und Ausführungsdauer beobachten
- `heartbeat_prompt_contribution` - Heartbeat-spezifischen Kontext für Hintergrundmonitor- und Lebenszyklus-Plugins hinzufügen

**Konversationsbeobachtung**

- `model_call_started` / `model_call_ended` - bereinigte Metadaten zu Provider-/Modellaufrufen, Timing, Ergebnis und begrenzte Anfrage-ID-Hashes ohne Prompt- oder Antwortinhalt beobachten
- `llm_input` - Provider-Eingabe beobachten (System-Prompt, Prompt, Verlauf)
- `llm_output` - Provider-Ausgabe beobachten

**Tools**

- **`before_tool_call`** - Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung anfordern
- `after_tool_call` - Tool-Ergebnisse, Fehler und Dauer beobachten
- **`tool_result_persist`** - die aus einem Tool-Ergebnis erzeugte Assistentennachricht umschreiben
- **`before_message_write`** - einen laufenden Nachrichtenschreibvorgang prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** - eine eingehende Nachricht vor dem Agent-Routing beanspruchen (synthetische Antworten)
- `message_received` - eingehenden Inhalt, Absender, Thread und Metadaten beobachten
- **`message_sending`** - ausgehenden Inhalt umschreiben oder Zustellung abbrechen
- `message_sent` - erfolgreiche oder fehlgeschlagene ausgehende Zustellung beobachten
- **`before_dispatch`** - einen ausgehenden Dispatch vor der Kanalübergabe prüfen oder umschreiben
- **`reply_dispatch`** - an der finalen Antwort-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` - Grenzen des Sitzungslebenszyklus nachverfolgen. Der `reason` des Ereignisses ist einer von `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` oder `unknown`. Die Werte `shutdown` und `restart` werden vom Gateway-Shutdown-Finalizer ausgelöst, wenn der Prozess gestoppt oder neu gestartet wird, während Sitzungen noch aktiv sind, sodass nachgelagerte Plugins (wie Speicher- oder Transkript-Speicher) verwaiste Zeilen finalisieren können, die sonst über Neustarts hinweg offen bleiben würden. Der Finalizer ist begrenzt, sodass ein langsames Plugin SIGTERM/SIGINT nicht blockieren kann.
- `before_compaction` / `after_compaction` - Compaction-Zyklen beobachten oder annotieren
- `before_reset` - Sitzungs-Reset-Ereignisse beobachten (`/reset`, programmatische Resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - Routing und Abschlusszustellung von Subagents koordinieren

**Lebenszyklus**

- `gateway_start` / `gateway_stop` - Plugin-eigene Dienste mit dem Gateway starten oder stoppen
- `cron_changed` - Gateway-eigene Cron-Lebenszyklusänderungen beobachten (hinzugefügt, aktualisiert, entfernt, gestartet, beendet, geplant)
- **`before_install`** - Skill- oder Plugin-Installationsscans prüfen und optional blockieren

## Tool-Aufrufrichtlinie

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
- optional `event.derivedPaths`, mit bestmöglichen, vom Host abgeleiteten Zielpfad-Hinweisen
  für bekannte Tool-Umschläge wie `apply_patch`; sofern vorhanden,
  können diese Pfade unvollständig sein oder überschätzen, was das Tool
  tatsächlich berühren wird (zum Beispiel bei fehlerhaften oder unvollständigen Eingaben)
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (gesetzt bei Cron-gesteuerten Ausführungen) und diagnostisches `ctx.trace`

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
- `requireApproval` pausiert die Agent-Ausführung und fragt den Benutzer über Plugin-Genehmigungen.
  Der Befehl `/approve` kann sowohl Exec- als auch Plugin-Genehmigungen erteilen.
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook
  mit höherer Priorität Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung - `allow-once`,
  `allow-always`, `deny`, `timeout` oder `cancelled`.

Gebündelte Plugins, die Host-Richtlinien benötigen, können vertrauenswürdige Tool-Richtlinien
mit `api.registerTrustedToolPolicy(...)` registrieren. Diese laufen vor gewöhnlichen
`before_tool_call`-Hooks und vor Entscheidungen externer Plugins. Verwenden Sie sie nur
für hostvertrauenswürdige Prüfungen wie Workspace-Richtlinien, Budgetdurchsetzung oder
Sicherheit für reservierte Workflows. Externe Plugins sollten normale `before_tool_call`-Hooks
verwenden.

### Persistenz von Tool-Ergebnissen

Tool-Ergebnisse können strukturierte `details` für UI-Rendering, Diagnose,
Medien-Routing oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeitmetadaten,
nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor Provider-Replay und Compaction-Eingabe,
  sodass Metadaten nicht zu Modellkontext werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Zu große Details werden
  durch eine kompakte Zusammenfassung und `persistedDetailsTruncated: true` ersetzt.
- `tool_result_persist` und `before_message_write` laufen vor der finalen
  Persistenzgrenze. Hooks sollten zurückgegebene `details` dennoch klein halten und vermeiden,
  promptrelevanten Text nur in `details` abzulegen; platzieren Sie modellseitig sichtbare Tool-Ausgabe
  in `content`.

## Prompt- und Modell-Hooks

Verwenden Sie die phasenspezifischen Hooks für neue Plugins:

- `before_model_resolve`: erhält nur den aktuellen Prompt und Anhangsmetadaten.
  Geben Sie `providerOverride` oder `modelOverride` zurück.
- `agent_turn_prepare`: erhält den aktuellen Prompt, vorbereitete Sitzungsnachrichten
  und alle exakt einmaligen, für diese Sitzung entnommenen eingereihten Injektionen. Geben Sie
  `prependContext` oder `appendContext` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und Sitzungsnachrichten.
  Geben Sie `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` oder `appendSystemContext` zurück.
- `heartbeat_prompt_contribution`: läuft nur für Heartbeat-Durchläufe und gibt
  `prependContext` oder `appendContext` zurück. Es ist für Hintergrundmonitore vorgesehen,
  die den aktuellen Zustand zusammenfassen müssen, ohne benutzerinitiierte Durchläufe zu ändern.

`before_agent_start` bleibt aus Kompatibilitätsgründen bestehen. Bevorzugen Sie die expliziten Hooks oben,
damit Ihr Plugin nicht von einer Legacy-Kombinationsphase abhängt.

`before_agent_run` läuft nach der Prompt-Erstellung und vor jeder Modelleingabe,
einschließlich promptlokalem Laden von Bildern und `llm_input`-Beobachtung. Es erhält
die aktuelle Benutzereingabe als `prompt`, plus geladene Sitzungshistorie in `messages`
und den aktiven System-Prompt. Geben Sie `{ outcome: "block", reason, message? }`
zurück, um die Ausführung zu stoppen, bevor das Modell den Prompt lesen kann. `reason` ist intern;
`message` ist der benutzerseitige Ersatz. Die einzigen unterstützten Ergebnisse sind
`pass` und `block`; nicht unterstützte Entscheidungsformen schlagen geschlossen fehl.

Wenn eine Ausführung blockiert wird, speichert OpenClaw nur den Ersatztext in
`message.content` plus nicht sensible Blockierungsmetadaten wie die ID des blockierenden Plugins
und den Zeitstempel. Der ursprüngliche Benutzertext wird weder im Transkript noch im zukünftigen
Kontext behalten. Interne Blockierungsgründe werden als sensibel behandelt und aus
Transkript-, Verlaufs-, Broadcast-, Log- und Diagnose-Payloads ausgeschlossen. Beobachtbarkeit
sollte bereinigte Felder wie Blocker-ID, Ergebnis, Zeitstempel oder eine sichere
Kategorie verwenden.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw
die aktive Ausführung identifizieren kann. Derselbe Wert ist auch unter `ctx.runId` verfügbar.
Cron-gesteuerte Ausführungen legen außerdem `ctx.jobId` offen (die ID des auslösenden Cron-Jobs),
damit Plugin-Hooks Metriken, Nebeneffekte oder Zustand auf einen bestimmten geplanten
Job begrenzen können.

Bei kanalbasierten Ausführungen ist `ctx.messageProvider` die Provider-Oberfläche wie
`discord` oder `telegram`, während `ctx.channelId` der Zielbezeichner der Konversation ist,
wenn OpenClaw ihn aus dem Sitzungsschlüssel oder Zustellungsmetadaten ableiten kann.

`agent_end` ist ein Beobachtungs-Hook und läuft nach dem Durchlauf fire-and-forget. Der
Hook-Runner wendet ein Timeout von 30 Sekunden an, sodass ein festhängendes Plugin oder ein Embedding-
Endpoint das Hook-Promise nicht dauerhaft offen lassen kann. Ein Timeout wird protokolliert und
OpenClaw fährt fort; Plugin-eigene Netzwerkarbeit wird dadurch nicht abgebrochen, es sei denn,
das Plugin verwendet zusätzlich sein eigenes Abort-Signal.

Verwenden Sie `model_call_started` und `model_call_ended` für Provider-Aufruf-Telemetrie,
die keine Roh-Prompts, Verläufe, Antworten, Header, Anfragekörper oder
Provider-Anfrage-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminale
`durationMs`/`outcome` sowie `upstreamRequestIdHash`, wenn OpenClaw einen
begrenzten Hash der Provider-Anfrage-ID ableiten kann.

`before_agent_finalize` wird nur ausgeführt, wenn ein Harness kurz davorsteht, eine natürliche
finale Assistant-Antwort zu akzeptieren. Dies ist nicht der `/stop`-Abbruchpfad und wird nicht
ausgeführt, wenn der Benutzer einen Turn abbricht. Geben Sie `{ action: "revise", reason }` zurück, um
das Harness vor der Finalisierung um einen weiteren Modelldurchlauf zu bitten, `{ action:
"finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis weg, um fortzufahren.
Native Codex-`Stop`-Hooks werden an diesen Hook als OpenClaw-
`before_agent_finalize`-Entscheidungen weitergegeben.

Beim Zurückgeben von `action: "revise"` können Plugins `retry`-Metadaten einschließen, um
den zusätzlichen Modelldurchlauf begrenzt und replay-sicher zu machen:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wird an den Revisionsgrund angehängt, der an das Harness gesendet wird.
`idempotencyKey` ermöglicht dem Host, Wiederholungen für dieselbe Plugin-Anfrage über
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

Prompt-verändernde Hooks und dauerhafte Next-Turn-Injections können pro Plugin
mit `plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

### Sitzungserweiterungen und Next-Turn-Injections

Workflow-Plugins können kleinen JSON-kompatiblen Sitzungsstatus mit
`api.registerSessionExtension(...)` dauerhaft speichern und ihn über die Gateway-
Methode `sessions.pluginPatch` aktualisieren. Sitzungszeilen projizieren registrierten Erweiterungsstatus
über `pluginExtensions`, sodass Control UI und andere Clients Plugin-eigenen Status rendern können,
ohne Plugin-Interna kennen zu müssen.

Verwenden Sie `api.enqueueNextTurnInjection(...)`, wenn ein Plugin dauerhaften Kontext benötigt, der
genau einmal den nächsten Modell-Turn erreichen soll. OpenClaw leert eingereihte Injections vor
Prompt-Hooks, verwirft abgelaufene Injections und dedupliziert pro Plugin nach `idempotencyKey`.
Dies ist die richtige Schnittstelle für Genehmigungs-Fortsetzungen, Richtlinienzusammenfassungen,
Deltas von Hintergrundmonitoren und Befehlsfortsetzungen, die im nächsten Turn für das Modell sichtbar sein sollen,
aber nicht zu dauerhaftem System-Prompt-Text werden dürfen.

Bereinigungssemantik ist Teil des Vertrags. Die Bereinigung von Sitzungserweiterungen und
Bereinigungs-Callbacks des Runtime-Lebenszyklus erhalten `reset`, `delete`, `disable` oder
`restart`. Der Host entfernt den persistenten Sitzungserweiterungsstatus des besitzenden Plugins
und ausstehende Next-Turn-Injections für reset/delete/disable; restart behält
dauerhaften Sitzungsstatus bei, während Bereinigungs-Callbacks Plugins erlauben, Scheduler-
Jobs, Ausführungskontext und andere out-of-band Ressourcen der alten Runtime-
Generation freizugeben.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing auf Kanalebene und Zustellungsrichtlinien:

- `message_received`: eingehende Inhalte, Absender, `threadId`, `messageId`,
  `senderId`, optionale Ausführungs-/Sitzungskorrelation und Metadaten beobachten.
- `message_sending`: `content` umschreiben oder `{ cancel: true }` zurückgeben.
- `message_sent`: finalen Erfolg oder Fehler beobachten.

Bei reinen Audio-TTS-Antworten kann `content` das verborgene gesprochene Transkript enthalten,
auch wenn die Kanalnutzlast keinen sichtbaren Text bzw. keine sichtbare Bildunterschrift hat. Das Umschreiben dieses
`content` aktualisiert nur das für Hooks sichtbare Transkript; es wird nicht als
Medienbeschriftung gerendert.

Nachrichten-Hook-Kontexte stellen stabile Korrelationsfelder bereit, sofern verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Bevorzugen Sie
diese erstklassigen Felder, bevor Sie Legacy-Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie kanalspezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Umgeschriebener `content` wird an Hooks mit niedrigerer Priorität weitergereicht, sofern kein späterer Hook
  die Zustellung abbricht.
- `message_sending` kann `cancelReason` und begrenzte `metadata` zusammen mit einem
  Abbruch zurückgeben. Neue Nachrichtenlebenszyklus-APIs stellen dies als unterdrücktes Zustellungsergebnis
  mit dem Grund `cancelled_by_message_sending_hook` bereit; Legacy-Direktzustellung
  gibt aus Kompatibilitätsgründen weiterhin ein leeres Ergebnisarray zurück.
- `message_sent` dient nur der Beobachtung. Handler-Fehler werden protokolliert und ändern
  das Zustellungsergebnis nicht.

## Installations-Hooks

`before_install` wird nach dem integrierten Scan auf Skill- und Plugin-Installationen ausgeführt.
Geben Sie zusätzliche Befunde oder `{ block: true, blockReason }` zurück, um die
Installation zu stoppen.

`block: true` ist terminal. `block: false` wird als keine Entscheidung behandelt.

## Gateway-Lebenszyklus

Verwenden Sie `gateway_start` für Plugin-Dienste, die Gateway-eigenen Status benötigen. Der
Kontext stellt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` zur
Cron-Inspektion und für Aktualisierungen bereit. Verwenden Sie `gateway_stop`, um lang laufende
Ressourcen zu bereinigen.

Verlassen Sie sich nicht auf den internen Hook `gateway:startup` für Plugin-eigene Runtime-
Dienste.

`cron_changed` wird für Gateway-eigene Cron-Lebenszyklusereignisse mit einer typisierten
Ereignisnutzlast ausgelöst, die die Gründe `added`, `updated`, `removed`, `started`, `finished`
und `scheduled` abdeckt. Das Ereignis enthält einen `PluginHookGatewayCronJob`-
Snapshot (einschließlich `state.nextRunAtMs`, `state.lastRunStatus` und
`state.lastError`, sofern vorhanden) sowie einen `PluginHookGatewayCronDeliveryStatus`
von `not-requested` | `delivered` | `not-delivered` | `unknown`. Entfernte
Ereignisse enthalten weiterhin den gelöschten Job-Snapshot, damit externe Scheduler den
Status abgleichen können. Verwenden Sie `ctx.getCron?.()` und `ctx.config` aus dem Runtime-
Kontext beim Synchronisieren externer Wake-Scheduler, und behalten Sie OpenClaw als
Quelle der Wahrheit für Fälligkeitsprüfungen und Ausführung bei.

## Anstehende Deprecations

Einige Hook-nahe Oberflächen sind veraltet, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major-Release:

- **Klartext-Kanal-Envelopes** in Handlern für `inbound_claim` und `message_received`.
  Lesen Sie stattdessen `BodyForAgent` und die strukturierten Benutzerkontextblöcke,
  statt flachen Envelope-Text zu parsen. Siehe
  [Klartext-Kanal-Envelopes → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen erhalten. Neue Plugins sollten
  `before_model_resolve` und `before_prompt_build` statt der kombinierten
  Phase verwenden.
- **`onResolution` in `before_tool_call`** verwendet nun die typisierte
  `PluginApprovalResolution`-Union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) statt eines frei formulierten `string`.

Die vollständige Liste - Registrierung von Speicherkapazitäten, Provider-Thinking-
Profil, externe Auth-Provider, Provider-Discovery-Typen, Task-Runtime-
Accessoren und die Umbenennung von `command-auth` zu `command-status` - finden Sie unter
[Plugin-SDK-Migration → Aktive Deprecations](/de/plugins/sdk-migration#active-deprecations).

## Verwandt

- [Plugin-SDK-Migration](/de/plugins/sdk-migration) - aktive Deprecations und Zeitplan für Entfernungen
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Interne Plugin-Architektur](/de/plugins/architecture-internals)
