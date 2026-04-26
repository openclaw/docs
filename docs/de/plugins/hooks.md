---
read_when:
    - Sie erstellen ein Plugin, das `before_tool_call`, `before_agent_reply`, Nachrichten-Hooks oder Lebenszyklus-Hooks benötigt.
    - Sie müssen Tool-Aufrufe von einem Plugin blockieren, umschreiben oder eine Genehmigung dafür verlangen
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agenten-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin hooks
x-i18n:
    generated_at: "2026-04-26T11:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin-Hooks sind In-Process-Erweiterungspunkte für OpenClaw-Plugins. Verwenden Sie sie,
wenn ein Plugin Agent-Ausführungen, Tool-Aufrufe, den Nachrichtenfluss,
den Sitzungslebenszyklus, das Subagent-Routing, Installationen oder den Gateway-Start
prüfen oder ändern muss.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks), wenn Sie ein kleines,
vom Betreiber installiertes `HOOK.md`-Skript für Befehls- und Gateway-Ereignisse wie
`/new`, `/reset`, `/stop`, `agent:bootstrap` oder `gateway:startup` möchten.

## Schnellstart

Registrieren Sie typisierte Plugin-Hooks mit `api.on(...)` aus Ihrem Plugin-Einstiegspunkt:

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

Hook-Handler werden sequenziell in absteigender `priority` ausgeführt. Hooks mit derselben Priorität
behalten die Registrierungsreihenfolge bei.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettdruck** akzeptieren ein
Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung verlangen); alle anderen dienen
nur der Beobachtung.

**Agent-Turn**

- `before_model_resolve` — Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `before_prompt_build` — dynamischen Kontext oder System-Prompt-Text vor dem Modellaufruf hinzufügen
- `before_agent_start` — reine Kompatibilitäts-Kombinationsphase; bevorzugen Sie die beiden Hooks oben
- **`before_agent_reply`** — den Modell-Turn mit einer synthetischen Antwort oder Stille kurzschließen
- **`before_agent_finalize`** — die natürliche endgültige Antwort prüfen und einen weiteren Modell-Durchlauf anfordern
- `agent_end` — endgültige Nachrichten, Erfolgsstatus und Laufdauer beobachten

**Gesprächsbeobachtung**

- `model_call_started` / `model_call_ended` — bereinigte Metadaten zu Provider-/Modellaufrufen, Zeitmessung, Ergebnis und begrenzte Request-ID-Hashes ohne Prompt- oder Antwortinhalt beobachten
- `llm_input` — Provider-Eingabe beobachten (System-Prompt, Prompt, Verlauf)
- `llm_output` — Provider-Ausgabe beobachten

**Tools**

- **`before_tool_call`** — Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung verlangen
- `after_tool_call` — Tool-Ergebnisse, Fehler und Dauer beobachten
- **`tool_result_persist`** — die aus einem Tool-Ergebnis erzeugte Assistant-Nachricht umschreiben
- **`before_message_write`** — einen laufenden Nachrichtenschreibvorgang prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** — eine eingehende Nachricht vor dem Agent-Routing beanspruchen (synthetische Antworten)
- `message_received` — eingehenden Inhalt, Absender, Thread und Metadaten beobachten
- **`message_sending`** — ausgehenden Inhalt umschreiben oder Zustellung abbrechen
- `message_sent` — Erfolg oder Fehler der ausgehenden Zustellung beobachten
- **`before_dispatch`** — einen ausgehenden Dispatch vor der Kanalübergabe prüfen oder umschreiben
- **`reply_dispatch`** — an der finalen Antwort-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` — Grenzen des Sitzungslebenszyklus verfolgen
- `before_compaction` / `after_compaction` — Compaction-Zyklen beobachten oder annotieren
- `before_reset` — Sitzungs-Reset-Ereignisse beobachten (`/reset`, programmatische Resets)

**Subagents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — Subagent-Routing und Zustellung des Abschlusses koordinieren

**Lebenszyklus**

- `gateway_start` / `gateway_stop` — Plugin-eigene Dienste mit dem Gateway starten oder stoppen
- **`before_install`** — Scans für Skill- oder Plugin-Installationen prüfen und optional blockieren

## Richtlinie für Tool-Aufrufe

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
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
- `requireApproval` pausiert die Agent-Ausführung und fragt den Benutzer über Plugin-Genehmigungen. Der Befehl `/approve` kann sowohl Exec- als auch Plugin-Genehmigungen genehmigen.
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook mit höherer Priorität eine Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung — `allow-once`,
  `allow-always`, `deny`, `timeout` oder `cancelled`.

### Persistenz von Tool-Ergebnissen

Tool-Ergebnisse können strukturierte `details` für UI-Rendering, Diagnostik,
Medien-Routing oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeit-Metadaten,
nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor Provider-Replay und Compaction-Eingabe, damit Metadaten kein Modellkontext werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Zu große Details werden durch eine kompakte Zusammenfassung ersetzt, und `persistedDetailsTruncated: true` wird gesetzt.
- `tool_result_persist` und `before_message_write` laufen vor der finalen Persistenzbegrenzung. Hooks sollten zurückgegebene `details` trotzdem klein halten und promptrelevanten Text nicht nur in `details` ablegen; legen Sie modellsichtbare Tool-Ausgabe in `content` ab.

## Prompt- und Modell-Hooks

Verwenden Sie für neue Plugins die phasenspezifischen Hooks:

- `before_model_resolve`: erhält nur den aktuellen Prompt und Metadaten zu Anhängen. Geben Sie `providerOverride` oder `modelOverride` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und Sitzungsnachrichten. Geben Sie `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` zurück.

`before_agent_start` bleibt aus Kompatibilitätsgründen bestehen. Bevorzugen Sie die expliziten Hooks oben,
damit Ihr Plugin nicht von einer veralteten kombinierten Phase abhängt.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw
die aktive Ausführung identifizieren kann. Derselbe Wert ist auch auf `ctx.runId` verfügbar.
Cron-gesteuerte Ausführungen stellen außerdem `ctx.jobId` bereit (die ID des auslösenden Cron-Jobs), damit
Plugin-Hooks Metriken, Nebeneffekte oder Status auf einen bestimmten geplanten
Job eingrenzen können.

Verwenden Sie `model_call_started` und `model_call_ended` für Telemetrie von Provider-Aufrufen,
die keine Roh-Prompts, keinen Verlauf, keine Antworten, keine Header, keine Request-Bodies
und keine Provider-Request-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminales
`durationMs`/`outcome` und `upstreamRequestIdHash`, wenn OpenClaw einen
begrenzten Provider-Request-ID-Hash ableiten kann.

`before_agent_finalize` läuft nur, wenn ein Harness gerade dabei ist, eine natürliche
endgültige Assistant-Antwort zu akzeptieren. Es ist nicht der Abbruchpfad von `/stop` und läuft
nicht, wenn der Benutzer einen Turn abbricht. Geben Sie `{ action: "revise", reason }` zurück, um
das Harness um einen weiteren Modell-Durchlauf vor der Finalisierung zu bitten, `{ action:
"finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis weg, um fortzufahren.
Native Codex-`Stop`-Hooks werden in diesen Hook als OpenClaw-
`before_agent_finalize`-Entscheidungen weitergeleitet.

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

Prompt-mutierende Hooks können pro Plugin mit
`plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für kanalbezogenes Routing und Zustellrichtlinien:

- `message_received`: eingehenden Inhalt, Absender, `threadId`, `messageId`,
  `senderId`, optionale Ausführungs-/Sitzungskorrelation und Metadaten beobachten.
- `message_sending`: `content` umschreiben oder `{ cancel: true }` zurückgeben.
- `message_sent`: finalen Erfolg oder Fehler beobachten.

Bei reinen Audio-TTS-Antworten kann `content` das versteckte gesprochene Transkript
enthalten, selbst wenn die Kanallast keinen sichtbaren Text/keine sichtbare Bildunterschrift hat. Das Umschreiben dieses
`content` aktualisiert nur das für Hooks sichtbare Transkript; es wird nicht als
Medien-Bildunterschrift gerendert.

Kontexte für Nachrichten-Hooks stellen stabile Korrelationsfelder bereit, wenn verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Bevorzugen Sie
diese erstklassigen Felder, bevor Sie veraltete Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie kanalspezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Umgeschriebenes `content` wird an Hooks mit niedrigerer Priorität weitergereicht, es sei denn, ein späterer Hook bricht die Zustellung ab.

## Install-Hooks

`before_install` läuft nach dem integrierten Scan für Skill- und Plugin-Installationen.
Geben Sie zusätzliche Findings oder `{ block: true, blockReason }` zurück, um die
Installation zu stoppen.

`block: true` ist terminal. `block: false` wird als keine Entscheidung behandelt.

## Gateway-Lebenszyklus

Verwenden Sie `gateway_start` für Plugin-Dienste, die Gateway-eigenen Zustand benötigen. Der
Kontext stellt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für
Cron-Inspektion und -Aktualisierungen bereit. Verwenden Sie `gateway_stop`, um lang laufende
Ressourcen zu bereinigen.

Verlassen Sie sich nicht auf den internen Hook `gateway:startup` für Plugin-eigene Laufzeitdienste.

## Bevorstehende Deprecations

Einige Hook-nahe Oberflächen sind deprecated, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major-Release:

- **Plaintext-Kanal-Umschläge** in Handlern für `inbound_claim` und `message_received`.
  Lesen Sie stattdessen `BodyForAgent` und die strukturierten User-Context-Blöcke,
  anstatt flachen Umschlagtext zu parsen. Siehe
  [Plaintext channel envelopes → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen bestehen. Neue Plugins sollten
  `before_model_resolve` und `before_prompt_build` anstelle der kombinierten
  Phase verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt den typisierten
  Union-Typ `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) anstelle eines frei formulierten `string`.

Für die vollständige Liste — Registrierung von Speicherfähigkeiten, Thinking-Profil des Providers,
externe Auth-Provider, Provider-Discovery-Typen, Task-Laufzeit-Accessoren
und die Umbenennung `command-auth` → `command-status` — siehe
[Plugin SDK migration → Active deprecations](/de/plugins/sdk-migration#active-deprecations).

## Verwandt

- [Plugin SDK migration](/de/plugins/sdk-migration) — aktive Deprecations und Zeitplan für die Entfernung
- [Building plugins](/de/plugins/building-plugins)
- [Plugin SDK overview](/de/plugins/sdk-overview)
- [Plugin entry points](/de/plugins/sdk-entrypoints)
- [Internal hooks](/de/automation/hooks)
- [Plugin architecture internals](/de/plugins/architecture-internals)
