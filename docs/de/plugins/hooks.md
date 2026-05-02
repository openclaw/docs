---
read_when:
    - Sie erstellen ein Plugin, das before_tool_call, before_agent_reply, Nachrichten-Hooks oder Lebenszyklus-Hooks benötigt
    - Sie müssen Tool-Aufrufe von einem Plugin blockieren, umschreiben oder eine Genehmigung dafür verlangen
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agenten-, Werkzeug-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-05-02T06:41:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-Hooks sind prozessinterne Erweiterungspunkte für OpenClaw-Plugins. Verwenden Sie sie, wenn ein Plugin Agent-Läufe, Tool-Aufrufe, Nachrichtenfluss, Sitzungslebenszyklus, Subagent-Routing, Installationen oder den Gateway-Start prüfen oder ändern muss.

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

- `priority` — Handler-Reihenfolge (höhere Werte werden zuerst ausgeführt).
- `timeoutMs` — optionales Budget pro Hook. Wenn gesetzt, bricht der Hook-Runner diesen Handler nach Ablauf des Budgets ab und fährt mit dem nächsten fort, statt langsame Einrichtung oder Abrufarbeit das vom Aufrufer konfigurierte Modell-Timeout verbrauchen zu lassen. Lassen Sie es weg, um das standardmäßige Beobachtungs-/Entscheidungs-Timeout zu verwenden, das der Hook-Runner generisch anwendet.

Jeder Hook erhält `event.context.pluginConfig`, die aufgelöste Konfiguration für das Plugin, das diesen Handler registriert hat. Verwenden Sie sie für Hook-Entscheidungen, die aktuelle Plugin-Optionen benötigen; OpenClaw injiziert sie pro Handler, ohne das gemeinsam genutzte Ereignisobjekt zu verändern, das andere Plugins sehen.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettdruck** akzeptieren ein Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung anfordern); alle anderen dienen nur der Beobachtung.

**Agent-Turn**

- `before_model_resolve` — Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `agent_turn_prepare` — in die Warteschlange gestellte Plugin-Turn-Injektionen verbrauchen und Kontext für denselben Turn vor Prompt-Hooks hinzufügen
- `before_prompt_build` — dynamischen Kontext oder System-Prompt-Text vor dem Modellaufruf hinzufügen
- `before_agent_start` — nur aus Kompatibilitätsgründen kombinierte Phase; bevorzugen Sie die beiden Hooks oben
- **`before_agent_reply`** — den Modell-Turn mit einer synthetischen Antwort oder Stille kurzschließen
- **`before_agent_finalize`** — die natürliche finale Antwort prüfen und einen weiteren Modelllauf anfordern
- `agent_end` — finale Nachrichten, Erfolgszustand und Laufdauer beobachten
- `heartbeat_prompt_contribution` — nur für Heartbeat bestimmten Kontext für Hintergrundmonitor- und Lebenszyklus-Plugins hinzufügen

**Konversationsbeobachtung**

- `model_call_started` / `model_call_ended` — bereinigte Provider-/Modellaufruf-Metadaten, Timing, Ergebnis und begrenzte Request-ID-Hashes ohne Prompt- oder Antwortinhalt beobachten
- `llm_input` — Provider-Eingabe beobachten (System-Prompt, Prompt, Verlauf)
- `llm_output` — Provider-Ausgabe beobachten

**Tools**

- **`before_tool_call`** — Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung anfordern
- `after_tool_call` — Tool-Ergebnisse, Fehler und Dauer beobachten
- **`tool_result_persist`** — die aus einem Tool-Ergebnis erzeugte Assistentennachricht umschreiben
- **`before_message_write`** — einen laufenden Nachrichtenschreibvorgang prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** — eine eingehende Nachricht vor dem Agent-Routing beanspruchen (synthetische Antworten)
- `message_received` — eingehenden Inhalt, Absender, Thread und Metadaten beobachten
- **`message_sending`** — ausgehenden Inhalt umschreiben oder Zustellung abbrechen
- `message_sent` — Erfolg oder Fehlschlag der ausgehenden Zustellung beobachten
- **`before_dispatch`** — eine ausgehende Dispatch-Anfrage vor der Channel-Übergabe prüfen oder umschreiben
- **`reply_dispatch`** — an der finalen Antwort-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` — Grenzen des Sitzungslebenszyklus verfolgen
- `before_compaction` / `after_compaction` — Compaction-Zyklen beobachten oder annotieren
- `before_reset` — Sitzungs-Reset-Ereignisse beobachten (`/reset`, programmatische Resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — Subagent-Routing und Abschlusszustellung koordinieren

**Lebenszyklus**

- `gateway_start` / `gateway_stop` — Plugin-eigene Dienste mit dem Gateway starten oder stoppen
- `cron_changed` — Änderungen am Gateway-eigenen Cron-Lebenszyklus beobachten (hinzugefügt, aktualisiert, entfernt, gestartet, abgeschlossen, geplant)
- **`before_install`** — Skill- oder Plugin-Installationsscans prüfen und optional blockieren

## Tool-Aufrufrichtlinie

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId` (gesetzt bei Cron-gesteuerten Läufen) und diagnostisches `ctx.trace`

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
- `requireApproval` pausiert den Agent-Lauf und fragt den Benutzer über Plugin-Freigaben. Der Befehl `/approve` kann sowohl Exec- als auch Plugin-Freigaben genehmigen.
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook mit höherer Priorität eine Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung — `allow-once`, `allow-always`, `deny`, `timeout` oder `cancelled`.

Gebündelte Plugins, die Richtlinien auf Host-Ebene benötigen, können vertrauenswürdige Tool-Richtlinien mit `api.registerTrustedToolPolicy(...)` registrieren. Diese laufen vor gewöhnlichen `before_tool_call`-Hooks und vor Entscheidungen externer Plugins. Verwenden Sie sie nur für host-vertrauenswürdige Schranken wie Workspace-Richtlinien, Budgetdurchsetzung oder Sicherheit reservierter Workflows. Externe Plugins sollten normale `before_tool_call`-Hooks verwenden.

### Persistenz von Tool-Ergebnissen

Tool-Ergebnisse können strukturierte `details` für UI-Rendering, Diagnosen, Medien-Routing oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeitmetadaten, nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor Provider-Replay und Compaction-Eingabe, damit Metadaten nicht zu Modellkontext werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Überdimensionierte Details werden durch eine kompakte Zusammenfassung und `persistedDetailsTruncated: true` ersetzt.
- `tool_result_persist` und `before_message_write` laufen vor der finalen Persistenzgrenze. Hooks sollten zurückgegebene `details` dennoch klein halten und vermeiden, promptrelevanten Text nur in `details` abzulegen; legen Sie für das Modell sichtbare Tool-Ausgabe in `content` ab.

## Prompt- und Modell-Hooks

Verwenden Sie für neue Plugins die phasenspezifischen Hooks:

- `before_model_resolve`: erhält nur den aktuellen Prompt und Anhangsmetadaten. Geben Sie `providerOverride` oder `modelOverride` zurück.
- `agent_turn_prepare`: erhält den aktuellen Prompt, vorbereitete Sitzungsnachrichten und alle genau einmalig in die Warteschlange gestellten Injektionen, die für diese Sitzung entnommen wurden. Geben Sie `prependContext` oder `appendContext` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und Sitzungsnachrichten. Geben Sie `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` zurück.
- `heartbeat_prompt_contribution`: läuft nur für Heartbeat-Turns und gibt `prependContext` oder `appendContext` zurück. Es ist für Hintergrundmonitore vorgesehen, die den aktuellen Zustand zusammenfassen müssen, ohne benutzerinitiierte Turns zu ändern.

`before_agent_start` bleibt aus Kompatibilitätsgründen erhalten. Bevorzugen Sie die expliziten Hooks oben, damit Ihr Plugin nicht von einer veralteten kombinierten Phase abhängt.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw den aktiven Lauf identifizieren kann. Derselbe Wert ist auch auf `ctx.runId` verfügbar. Cron-gesteuerte Läufe stellen außerdem `ctx.jobId` bereit (die ID des ursprünglichen Cron-Jobs), damit Plugin-Hooks Metriken, Nebeneffekte oder Zustand auf einen bestimmten geplanten Job begrenzen können.

Bei Läufen, die aus Channels stammen, ist `ctx.messageProvider` die Provider-Oberfläche wie `discord` oder `telegram`, während `ctx.channelId` der Zielbezeichner der Konversation ist, wenn OpenClaw ihn aus dem Sitzungsschlüssel oder den Zustellmetadaten ableiten kann.

`agent_end` ist ein Beobachtungs-Hook und läuft nach dem Turn im Fire-and-forget-Modus. Der Hook-Runner wendet ein Timeout von 30 Sekunden an, damit ein hängendes Plugin oder ein hängender Embedding-Endpunkt das Hook-Promise nicht unbegrenzt ausstehend lassen kann. Ein Timeout wird protokolliert und OpenClaw fährt fort; Plugin-eigene Netzwerkarbeit wird dadurch nicht abgebrochen, sofern das Plugin nicht auch sein eigenes Abbruchsignal verwendet.

Verwenden Sie `model_call_started` und `model_call_ended` für Provider-Aufruf-Telemetrie, die keine Roh-Prompts, Verläufe, Antworten, Header, Request-Bodies oder Provider-Request-IDs erhalten sollte. Diese Hooks enthalten stabile Metadaten wie `runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminale `durationMs`/`outcome` und `upstreamRequestIdHash`, wenn OpenClaw einen begrenzten Provider-Request-ID-Hash ableiten kann.

`before_agent_finalize` läuft nur, wenn ein Harness eine natürliche finale Assistentenantwort akzeptieren will. Es ist nicht der Abbruchpfad `/stop` und läuft nicht, wenn der Benutzer einen Turn abbricht. Geben Sie `{ action: "revise", reason }` zurück, um den Harness vor der Finalisierung um einen weiteren Modelllauf zu bitten, `{ action: "finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis weg, um fortzufahren. Native Codex-`Stop`-Hooks werden als OpenClaw-`before_agent_finalize`-Entscheidungen in diesen Hook weitergeleitet.

Nicht gebündelte Plugins, die `llm_input`, `llm_output`, `before_agent_finalize` oder `agent_end` benötigen, müssen Folgendes setzen:

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

Prompt-verändernde Hooks und dauerhafte Next-Turn-Injektionen können pro Plugin mit `plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

### Sitzungserweiterungen und Next-Turn-Injektionen

Workflow-Plugins können kleinen JSON-kompatiblen Sitzungszustand mit `api.registerSessionExtension(...)` persistieren und ihn über die Gateway-Methode `sessions.pluginPatch` aktualisieren. Sitzungszeilen projizieren registrierten Erweiterungszustand über `pluginExtensions`, sodass Control UI und andere Clients Plugin-eigenen Status rendern können, ohne Plugin-Interna zu kennen.

Verwenden Sie `api.enqueueNextTurnInjection(...)`, wenn ein Plugin dauerhaften Kontext genau einmal bis zum nächsten Modell-Turn bringen muss. OpenClaw entnimmt in die Warteschlange gestellte Injektionen vor Prompt-Hooks, verwirft abgelaufene Injektionen und dedupliziert pro Plugin nach `idempotencyKey`. Dies ist der richtige Übergangspunkt für Genehmigungsfortsetzungen, Richtlinienzusammenfassungen, Deltas von Hintergrundmonitoren und Befehlsfortsetzungen, die im nächsten Turn für das Modell sichtbar sein sollen, aber nicht zu dauerhaftem System-Prompt-Text werden sollen.

Bereinigungssemantik ist Teil des Vertrags. Bereinigungs-Callbacks für Sitzungserweiterungen und Laufzeit-Lebenszyklus erhalten `reset`, `delete`, `disable` oder `restart`. Der Host entfernt den persistenten Sitzungserweiterungszustand und ausstehende Next-Turn-Injektionen des besitzenden Plugins bei Reset/Delete/Disable; Restart behält dauerhaften Sitzungszustand bei, während Bereinigungs-Callbacks Plugins ermöglichen, Scheduler-Jobs, Laufkontext und andere Out-of-band-Ressourcen für die alte Laufzeitgeneration freizugeben.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing- und Zustellrichtlinien auf Channel-Ebene:

- `message_received`: eingehende Inhalte, Absender, `threadId`, `messageId`,
  `senderId`, optionale Run-/Sitzungskorrelation und Metadaten beobachten.
- `message_sending`: `content` umschreiben oder `{ cancel: true }` zurückgeben.
- `message_sent`: abschließenden Erfolg oder Fehler beobachten.

Bei reinen Audio-TTS-Antworten kann `content` das verborgene gesprochene Transkript
enthalten, auch wenn die Channel-Nutzlast keinen sichtbaren Text/keine sichtbare Beschriftung hat. Das Umschreiben dieses
`content` aktualisiert nur das für den Hook sichtbare Transkript; es wird nicht als
Medienbeschriftung gerendert.

Message-Hook-Kontexte stellen stabile Korrelationsfelder bereit, sofern verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Bevorzugen Sie
diese Felder erster Klasse, bevor Sie veraltete Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie Channel-spezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Umgeschriebener `content` läuft weiter zu Hooks mit niedrigerer Priorität, sofern kein späterer Hook
  die Zustellung abbricht.

## Installations-Hooks

`before_install` wird nach dem integrierten Scan für Skill- und Plugin-Installationen ausgeführt.
Geben Sie zusätzliche Befunde oder `{ block: true, blockReason }` zurück, um die
Installation zu stoppen.

`block: true` ist terminal. `block: false` wird als keine Entscheidung behandelt.

## Gateway-Lebenszyklus

Verwenden Sie `gateway_start` für Plugin-Dienste, die vom Gateway verwalteten Zustand benötigen. Der
Kontext stellt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für
Cron-Inspektion und -Aktualisierungen bereit. Verwenden Sie `gateway_stop`, um langlebige
Ressourcen zu bereinigen.

Verlassen Sie sich für Plugin-eigene Laufzeitdienste nicht auf den internen Hook
`gateway:startup`.

`cron_changed` wird bei Gateway-eigenen Cron-Lebenszyklusereignissen mit einer typisierten
Ereignisnutzlast ausgelöst, die die Gründe `added`, `updated`, `removed`, `started`, `finished`
und `scheduled` abdeckt. Das Ereignis enthält einen `PluginHookGatewayCronJob`-
Snapshot (einschließlich `state.nextRunAtMs`, `state.lastRunStatus` und
`state.lastError`, sofern vorhanden) sowie einen `PluginHookGatewayCronDeliveryStatus`
von `not-requested` | `delivered` | `not-delivered` | `unknown`. Entfernte
Ereignisse enthalten weiterhin den gelöschten Job-Snapshot, damit externe Scheduler den
Zustand abgleichen können. Verwenden Sie `ctx.getCron?.()` und `ctx.config` aus dem Laufzeit-
Kontext, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als
Quelle der Wahrheit für Fälligkeitsprüfungen und Ausführung bei.

## Bevorstehende Abkündigungen

Einige Hook-nahe Oberflächen sind veraltet, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major-Release:

- **Klartext-Channel-Envelopes** in `inbound_claim`- und `message_received`-
  Handlern. Lesen Sie `BodyForAgent` und die strukturierten Benutzerkontext-Blöcke,
  anstatt flachen Envelope-Text zu parsen. Siehe
  [Klartext-Channel-Envelopes → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen bestehen. Neue Plugins sollten
  `before_model_resolve` und `before_prompt_build` anstelle der kombinierten
  Phase verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt die typisierte
  `PluginApprovalResolution`-Union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) anstelle eines frei formulierten `string`.

Die vollständige Liste — Registrierung von Speicher-Capabilities, Thinking-
Profil für Provider, externe Auth-Provider, Provider-Erkennungstypen, Task-Laufzeit-
Accessors und die Umbenennung von `command-auth` zu `command-status` — finden Sie unter
[Plugin-SDK-Migration → Aktive Abkündigungen](/de/plugins/sdk-migration#active-deprecations).

## Verwandte Themen

- [Plugin-SDK-Migration](/de/plugins/sdk-migration) — aktive Abkündigungen und Zeitplan für Entfernungen
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-SDK-Überblick](/de/plugins/sdk-overview)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Interna der Plugin-Architektur](/de/plugins/architecture-internals)
