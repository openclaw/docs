---
read_when:
    - Sie erstellen ein Plugin, das `before_tool_call`, `before_agent_reply`, Message-Hooks oder Lebenszyklus-Hooks benötigt
    - Sie müssen Tool-Aufrufe aus einem Plugin blockieren, umschreiben oder eine Genehmigung dafür verlangen
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agenten-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-04-25T13:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

Plugin-Hooks sind prozessinterne Erweiterungspunkte für OpenClaw-Plugins. Verwenden Sie sie,
wenn ein Plugin Agentenläufe, Tool-Aufrufe, Nachrichtenfluss,
Sitzungslebenszyklus, Subagent-Routing, Installationen oder den Gateway-Start prüfen oder ändern muss.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks), wenn Sie ein kleines,
vom Operator installiertes `HOOK.md`-Skript für Befehls- und Gateway-Ereignisse wie
`/new`, `/reset`, `/stop`, `agent:bootstrap` oder `gateway:startup` möchten.

## Schnellstart

Registrieren Sie typisierte Plugin-Hooks mit `api.on(...)` aus Ihrem Plugin-Entry:

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

Hook-Handler laufen sequenziell in absteigender `priority`. Hooks mit gleicher Priorität
behalten die Registrierungsreihenfolge bei.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettdruck** akzeptieren ein
Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung verlangen); alle anderen dienen nur der Beobachtung.

**Agentenzug**

- `before_model_resolve` — Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `before_prompt_build` — dynamischen Kontext oder Systemprompt-Text vor dem Modellaufruf hinzufügen
- `before_agent_start` — nur für Kompatibilität bestehende kombinierte Phase; bevorzugen Sie die beiden Hooks oben
- **`before_agent_reply`** — den Modellzug mit einer synthetischen Antwort oder Stille kurzschließen
- `agent_end` — abschließende Nachrichten, Erfolgsstatus und Laufdauer beobachten

**Beobachtung von Konversationen**

- `llm_input` — Provider-Eingabe beobachten (Systemprompt, Prompt, Verlauf)
- `llm_output` — Provider-Ausgabe beobachten

**Tools**

- **`before_tool_call`** — Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung verlangen
- `after_tool_call` — Tool-Ergebnisse, Fehler und Dauer beobachten
- **`tool_result_persist`** — die aus einem Tool-Ergebnis erzeugte Assistentennachricht umschreiben
- **`before_message_write`** — einen laufenden Nachrichtenschreibvorgang prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** — eine eingehende Nachricht vor dem Agenten-Routing beanspruchen (synthetische Antworten)
- `message_received` — eingehenden Inhalt, Absender, Thread und Metadaten beobachten
- **`message_sending`** — ausgehenden Inhalt umschreiben oder Zustellung abbrechen
- `message_sent` — Erfolg oder Fehlschlag der ausgehenden Zustellung beobachten
- **`before_dispatch`** — eine ausgehende Dispatch vor der Kanalübergabe prüfen oder umschreiben
- **`reply_dispatch`** — an der finalen Reply-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` — Grenzen des Sitzungslebenszyklus verfolgen
- `before_compaction` / `after_compaction` — Compaction-Zyklen beobachten oder annotieren
- `before_reset` — Sitzungs-Reset-Ereignisse beobachten (`/reset`, programmatische Resets)

**Subagenten**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — Routing und Abschlusszustellung von Subagenten koordinieren

**Lebenszyklus**

- `gateway_start` / `gateway_stop` — pluginverwaltete Dienste mit dem Gateway starten oder stoppen
- **`before_install`** — Scans von Skill- oder Plugin-Installationen prüfen und optional blockieren

## Richtlinie für Tool-Aufrufe

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` und
  diagnostisches `ctx.trace`

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
- `requireApproval` pausiert den Agentenlauf und fragt den Benutzer über Plugin-
  Genehmigungen. Der Befehl `/approve` kann sowohl Exec- als auch Plugin-Genehmigungen freigeben.
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook mit höherer Priorität
  eine Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung — `allow-once`,
  `allow-always`, `deny`, `timeout` oder `cancelled`.

## Prompt- und Modell-Hooks

Verwenden Sie für neue Plugins die phasenspezifischen Hooks:

- `before_model_resolve`: erhält nur den aktuellen Prompt und die Metadaten
  von Anhängen. Geben Sie `providerOverride` oder `modelOverride` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und die Sitzungsnachrichten.
  Geben Sie `prependContext`, `systemPrompt`, `prependSystemContext` oder
  `appendSystemContext` zurück.

`before_agent_start` bleibt aus Kompatibilitätsgründen erhalten. Bevorzugen Sie die expliziten Hooks oben,
damit Ihr Plugin nicht von einer veralteten kombinierten Phase abhängt.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw
den aktiven Lauf identifizieren kann. Derselbe Wert ist auch auf `ctx.runId` verfügbar.

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

Hooks, die Prompts verändern, können pro Plugin mit
`plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing auf Kanalebene und Zustellrichtlinien:

- `message_received`: eingehenden Inhalt, Absender, `threadId`, `messageId`,
  `senderId`, optionale Lauf-/Sitzungskorrelation und Metadaten beobachten.
- `message_sending`: `content` umschreiben oder `{ cancel: true }` zurückgeben.
- `message_sent`: endgültigen Erfolg oder Fehlschlag beobachten.

Bei reinen Audio-TTS-Antworten kann `content` das verborgene gesprochene Transkript
enthalten, selbst wenn die Kanal-Payload keinen sichtbaren Text/keine Caption hat. Das Umschreiben dieses
`content` aktualisiert nur das für Hooks sichtbare Transkript; es wird nicht als
Medien-Caption dargestellt.

Kontexte von Nachrichten-Hooks stellen stabile Korrelationsfelder bereit, sofern verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Bevorzugen Sie
diese erstklassigen Felder, bevor Sie veraltete Metadaten auslesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie kanalspezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Umgeschriebenes `content` läuft weiter zu Hooks mit niedrigerer Priorität, sofern ein späterer Hook
  die Zustellung nicht abbricht.

## Installations-Hooks

`before_install` läuft nach dem eingebauten Scan für Skill- und Plugin-Installationen.
Geben Sie zusätzliche Findings oder `{ block: true, blockReason }` zurück, um die
Installation zu stoppen.

`block: true` ist terminal. `block: false` wird als keine Entscheidung behandelt.

## Gateway-Lebenszyklus

Verwenden Sie `gateway_start` für Plugin-Dienste, die Gateway-eigenen Status benötigen. Der
Kontext stellt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für
die Prüfung und Aktualisierung von Cron bereit. Verwenden Sie `gateway_stop`, um lang laufende
Ressourcen zu bereinigen.

Verlassen Sie sich für pluginverwaltete Laufzeitdienste nicht auf den internen Hook `gateway:startup`.

## Anstehende Veraltungen

Einige Hook-nahe Oberflächen sind veraltet, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major Release:

- **Klartext-Kanal-Umschläge** in Handlern für `inbound_claim` und `message_received`.
  Lesen Sie `BodyForAgent` und die strukturierten Blöcke des Benutzerkontexts,
  statt flache Umschlagtexte zu parsen. Siehe
  [Plaintext channel envelopes → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen erhalten. Neue Plugins sollten
  `before_model_resolve` und `before_prompt_build` statt der kombinierten
  Phase verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt den typisierten
  Union-Typ `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) statt eines frei formulierten `string`.

Für die vollständige Liste — Registrierung von Memory-Fähigkeiten, Thinking-
Profil des Providers, externe Auth-Provider, Typen zur Provider-Erkennung, Accessors zur Task-Laufzeit
und die Umbenennung von `command-auth` zu `command-status` — siehe
[Plugin SDK migration → Active deprecations](/de/plugins/sdk-migration#active-deprecations).

## Verwandt

- [Plugin SDK migration](/de/plugins/sdk-migration) — aktive Veraltungen und Zeitplan für die Entfernung
- [Building plugins](/de/plugins/building-plugins)
- [Plugin SDK overview](/de/plugins/sdk-overview)
- [Plugin entry points](/de/plugins/sdk-entrypoints)
- [Internal hooks](/de/automation/hooks)
- [Plugin architecture internals](/de/plugins/architecture-internals)
