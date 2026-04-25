---
read_when:
    - Sie erstellen ein Plugin, das `before_tool_call`, `before_agent_reply`, Nachrichten-Hooks oder Lifecycle-Hooks benötigt
    - Sie müssen Tool-Aufrufe aus einem Plugin blockieren, umschreiben oder eine Genehmigung dafür verlangen
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agenten-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-04-25T18:20:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fa7554227cbb5d283e74c16d7e12ef524c494b8bb117a7ff4b37b49daa18af
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin-Hooks sind In-Process-Erweiterungspunkte für OpenClaw-Plugins. Verwenden Sie sie,
wenn ein Plugin Agentenläufe, Tool-Aufrufe, Nachrichtenfluss,
Sitzungslebenszyklus, Subagent-Routing, Installationen oder den Gateway-Start prüfen oder ändern muss.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks), wenn Sie ein kleines,
vom Operator installiertes `HOOK.md`-Skript für Befehls- und Gateway-Ereignisse wie
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
behalten die Reihenfolge der Registrierung bei.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettdruck** akzeptieren ein
Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung anfordern); alle anderen dienen
nur der Beobachtung.

**Agenten-Zug**

- `before_model_resolve` — Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `before_prompt_build` — vor dem Modellaufruf dynamischen Kontext oder Systemprompt-Text hinzufügen
- `before_agent_start` — kombinierte Phase nur aus Kompatibilitätsgründen; bevorzugen Sie die beiden Hooks oben
- **`before_agent_reply`** — den Modellzug mit einer synthetischen Antwort oder Stille kurzschließen
- `agent_end` — finale Nachrichten, Erfolgsstatus und Laufdauer beobachten

**Beobachtung von Unterhaltungen**

- `model_call_started` / `model_call_ended` — bereinigte Provider-/Modellaufruf-Metadaten, Zeitmessung, Ergebnis und begrenzte Request-ID-Hashes ohne Prompt- oder Antwortinhalt beobachten
- `llm_input` — Provider-Eingabe beobachten (Systemprompt, Prompt, Verlauf)
- `llm_output` — Provider-Ausgabe beobachten

**Tools**

- **`before_tool_call`** — Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung anfordern
- `after_tool_call` — Tool-Ergebnisse, Fehler und Dauer beobachten
- **`tool_result_persist`** — die aus einem Tool-Ergebnis erzeugte Assistentennachricht umschreiben
- **`before_message_write`** — einen laufenden Nachrichtenschreibvorgang prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** — eine eingehende Nachricht vor dem Agenten-Routing beanspruchen (synthetische Antworten)
- `message_received` — eingehenden Inhalt, Absender, Thread und Metadaten beobachten
- **`message_sending`** — ausgehenden Inhalt umschreiben oder Zustellung abbrechen
- `message_sent` — Erfolg oder Fehler der ausgehenden Zustellung beobachten
- **`before_dispatch`** — einen ausgehenden Dispatch vor der Kanalübergabe prüfen oder umschreiben
- **`reply_dispatch`** — an der finalen Reply-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` — Grenzen des Sitzungslebenszyklus verfolgen
- `before_compaction` / `after_compaction` — Compaction-Zyklen beobachten oder annotieren
- `before_reset` — Sitzungs-Reset-Ereignisse beobachten (`/reset`, programmatische Resets)

**Subagenten**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — Routing und Abschlusszustellung von Subagenten koordinieren

**Lifecycle**

- `gateway_start` / `gateway_stop` — plugin-eigene Dienste mit dem Gateway starten oder stoppen
- **`before_install`** — Scans für Skill- oder Plugin-Installationen prüfen und optional blockieren

## Richtlinie für Tool-Aufrufe

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` und
  Diagnoseinformationen in `ctx.trace`

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
- `requireApproval` pausiert den Agentenlauf und fragt den Benutzer über Plugin-Genehmigungen.
  Der Befehl `/approve` kann sowohl Ausführungs- als auch Plugin-Genehmigungen genehmigen.
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook mit höherer Priorität
  eine Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung — `allow-once`,
  `allow-always`, `deny`, `timeout` oder `cancelled`.

## Prompt- und Modell-Hooks

Verwenden Sie für neue Plugins die phasenspezifischen Hooks:

- `before_model_resolve`: erhält nur den aktuellen Prompt und
  Attachment-Metadaten. Geben Sie `providerOverride` oder `modelOverride` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und Sitzungsnachrichten.
  Geben Sie `prependContext`, `systemPrompt`, `prependSystemContext` oder
  `appendSystemContext` zurück.

`before_agent_start` bleibt aus Kompatibilitätsgründen erhalten. Bevorzugen Sie die expliziten Hooks oben,
damit Ihr Plugin nicht von einer veralteten kombinierten Phase abhängt.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw den aktiven Lauf identifizieren kann.
Derselbe Wert ist auch unter `ctx.runId` verfügbar.

Verwenden Sie `model_call_started` und `model_call_ended` für Telemetrie von Provider-Aufrufen,
die keine rohen Prompts, Verläufe, Antworten, Header, Request-Bodys oder
Provider-Request-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`,
abschließendes `durationMs`/`outcome` und `upstreamRequestIdHash`, wenn OpenClaw
einen begrenzten Hash der Provider-Request-ID ableiten kann.

Nicht gebündelte Plugins, die `llm_input`, `llm_output` oder `agent_end` benötigen, müssen Folgendes setzen:

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

Prompt-modifizierende Hooks können pro Plugin mit
`plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing und Zustellrichtlinien auf Kanalebene:

- `message_received`: eingehenden Inhalt, Absender, `threadId`, `messageId`,
  `senderId`, optionale Lauf-/Sitzungskorrelation und Metadaten beobachten.
- `message_sending`: `content` umschreiben oder `{ cancel: true }` zurückgeben.
- `message_sent`: endgültigen Erfolg oder Fehler beobachten.

Bei reinen Audio-TTS-Antworten kann `content` das verborgene gesprochene Transkript
enthalten, auch wenn die Kanallast keinen sichtbaren Text/keine sichtbare Caption hat.
Das Umschreiben dieses `content` aktualisiert nur das für Hooks sichtbare Transkript;
es wird nicht als Medien-Caption gerendert.

Kontexte von Nachrichten-Hooks stellen, sofern verfügbar, stabile Korrelationsfelder bereit:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Bevorzugen Sie
diese erstklassigen Felder, bevor Sie veraltete Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie kanalspezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Umgeschriebener `content` wird an Hooks mit niedrigerer Priorität weitergegeben,
  es sei denn, ein späterer Hook bricht die Zustellung ab.

## Install-Hooks

`before_install` läuft nach dem eingebauten Scan für Skill- und Plugin-Installationen.
Geben Sie zusätzliche Findings oder `{ block: true, blockReason }` zurück, um die
Installation zu stoppen.

`block: true` ist terminal. `block: false` wird als keine Entscheidung behandelt.

## Gateway-Lifecycle

Verwenden Sie `gateway_start` für Plugin-Dienste, die einen dem Gateway gehörenden Zustand benötigen. Der
Kontext stellt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für
Cron-Inspektion und -Aktualisierungen bereit. Verwenden Sie `gateway_stop`, um lang laufende
Ressourcen zu bereinigen.

Verlassen Sie sich für plugin-eigene Laufzeitdienste nicht auf den internen Hook `gateway:startup`.

## Bevorstehende Deprecations

Einige hook-nahe Oberflächen sind veraltet, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major Release:

- **Plaintext channel envelopes** in `inbound_claim`- und `message_received`-
  Handlern. Lesen Sie `BodyForAgent` und die strukturierten
  Benutzerkontextblöcke, statt flachen Hüllentext zu parsen. Siehe
  [Plaintext channel envelopes → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen erhalten. Neue Plugins sollten
  `before_model_resolve` und `before_prompt_build` statt der kombinierten
  Phase verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt die typisierte
  Union `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) statt eines Freitext-`string`.

Die vollständige Liste — Registrierung von Memory-Fähigkeiten, Thinking-
Profil des Providers, externe Auth-Provider, Typen für Provider-Erkennung, Task-Laufzeit-
Accessors und die Umbenennung `command-auth` → `command-status` — finden Sie unter
[Plugin SDK migration → Active deprecations](/de/plugins/sdk-migration#active-deprecations).

## Verwandt

- [Plugin SDK migration](/de/plugins/sdk-migration) — aktive Deprecations und Zeitplan für die Entfernung
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin SDK overview](/de/plugins/sdk-overview)
- [Plugin entry points](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Interne Plugin-Architektur](/de/plugins/architecture-internals)
