---
read_when:
    - Sie erstellen ein Plugin, das before_tool_call, before_agent_reply, Nachrichten-Hooks oder Lifecycle-Hooks benötigt
    - Sie müssen Tool-Aufrufe von einem Plugin blockieren, umschreiben oder eine Genehmigung dafür verlangen.
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
summary: 'Plugin-Hooks: Agenten-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-06-27T17:48:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-Hooks sind prozessinterne Erweiterungspunkte für OpenClaw-Plugins. Verwenden Sie sie,
wenn ein Plugin Agent-Läufe, Tool-Aufrufe, Nachrichtenfluss,
Sitzungslebenszyklus, Subagent-Routing, Installationen oder Gateway-Start prüfen oder ändern muss.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks), wenn Sie ein kleines,
operatorinstalliertes `HOOK.md`-Skript für Befehls- und Gateway-Ereignisse wie
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

Hook-Handler werden nacheinander in absteigender `priority` ausgeführt. Hooks
mit gleicher Priorität behalten die Registrierungsreihenfolge bei.

`api.on(name, handler, opts?)` akzeptiert:

- `priority` – Handler-Reihenfolge (höhere Werte werden zuerst ausgeführt).
- `timeoutMs` – optionales Budget pro Hook. Wenn gesetzt, bricht der Hook-Runner diesen
  Handler nach Ablauf des Budgets ab und fährt mit dem nächsten fort, statt
  langsame Einrichtungs- oder Abrufarbeit das konfigurierte Modell-Timeout des
  Aufrufers verbrauchen zu lassen. Lassen Sie es weg, um das Standard-Timeout
  für Beobachtung/Entscheidung zu verwenden, das der Hook-Runner allgemein anwendet.

Operatoren können Hook-Budgets auch ohne Patchen von Plugin-Code setzen:

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
vom Plugin verfassten Wert `api.on(..., { timeoutMs })` überschreibt. Jeder konfigurierte Wert muss
eine positive Ganzzahl von höchstens 600000 Millisekunden sein. Bevorzugen Sie Überschreibungen pro Hook
für bekannte langsame Hooks, damit ein Plugin nicht überall ein längeres Budget erhält.

Jeder Hook erhält `event.context.pluginConfig`, die aufgelöste Konfiguration für das
Plugin, das diesen Handler registriert hat. Verwenden Sie sie für Hook-Entscheidungen, die
aktuelle Plugin-Optionen benötigen; OpenClaw injiziert sie pro Handler, ohne das
gemeinsame Ereignisobjekt zu mutieren, das andere Plugins sehen.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. Namen in **Fettschrift** akzeptieren ein
Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung anfordern); alle anderen dienen
nur der Beobachtung.

**Agent-Turn**

- `before_model_resolve` – Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden
- `agent_turn_prepare` – eingereihte Plugin-Turn-Injektionen verarbeiten und Kontext für denselben Turn vor Prompt-Hooks hinzufügen
- `before_prompt_build` – dynamischen Kontext oder System-Prompt-Text vor dem Modellaufruf hinzufügen
- `before_agent_start` – kombinierte Phase nur zur Kompatibilität; bevorzugen Sie die beiden Hooks oben
- **`before_agent_run`** – den finalen Prompt und die Sitzungsnachrichten vor der Modellübermittlung prüfen und den Lauf optional blockieren
- **`before_agent_reply`** – den Modell-Turn mit einer synthetischen Antwort oder Stille kurzschließen
- **`before_agent_finalize`** – die natürliche finale Antwort prüfen und einen weiteren Modelldurchlauf anfordern
- `agent_end` – finale Nachrichten, Erfolgszustand und Laufdauer beobachten
- `heartbeat_prompt_contribution` – nur Heartbeat-Kontext für Hintergrundmonitor- und Lebenszyklus-Plugins hinzufügen

**Konversationsbeobachtung**

- `model_call_started` / `model_call_ended` – bereinigte Metadaten zu Provider-/Modellaufrufen, Timing, Ergebnis und begrenzte Request-ID-Hashes ohne Prompt- oder Antwortinhalt beobachten
- `llm_input` – Provider-Eingabe beobachten (System-Prompt, Prompt, Verlauf)
- `llm_output` – Provider-Ausgabe, Nutzung und das aufgelöste `contextTokenBudget` beobachten, sofern verfügbar

**Tools**

- **`before_tool_call`** – Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung anfordern
- `after_tool_call` – Tool-Ergebnisse, Fehler und Dauer beobachten
- `resolve_exec_env` – Plugin-eigene Umgebungsvariablen zu `exec` beitragen
- **`tool_result_persist`** – die aus einem Tool-Ergebnis erzeugte Assistant-Nachricht umschreiben
- **`before_message_write`** – einen laufenden Nachrichtenschreibvorgang prüfen oder blockieren (selten)

**Nachrichten und Zustellung**

- **`inbound_claim`** – eine eingehende Nachricht vor dem Agent-Routing beanspruchen (synthetische Antworten)
- `message_received` — eingehenden Inhalt, Absender, Thread und Metadaten beobachten
- **`message_sending`** — ausgehenden Inhalt umschreiben oder Zustellung abbrechen
- **`reply_payload_sending`** — normalisierte Antwort-Payloads vor der Zustellung verändern oder abbrechen
- `message_sent` — erfolgreiche oder fehlgeschlagene ausgehende Zustellung beobachten
- **`before_dispatch`** – einen ausgehenden Dispatch vor der Übergabe an den Kanal prüfen oder umschreiben
- **`reply_dispatch`** – an der finalen Reply-Dispatch-Pipeline teilnehmen

**Sitzungen und Compaction**

- `session_start` / `session_end` – Grenzen des Sitzungslebenszyklus verfolgen. Der `reason` des Ereignisses ist einer von `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` oder `unknown`. Die Werte `shutdown` und `restart` werden vom Finalizer beim Herunterfahren des Gateways ausgelöst, wenn der Prozess gestoppt oder neu gestartet wird, während Sitzungen noch aktiv sind. So können nachgelagerte Plugins (z. B. Speicher- oder Transkript-Stores) Ghost-Zeilen finalisieren, die sonst über Neustarts hinweg in einem offenen Zustand verbleiben würden. Der Finalizer ist begrenzt, sodass ein langsames Plugin SIGTERM/SIGINT nicht blockieren kann.
- `before_compaction` / `after_compaction` – Compaction-Zyklen beobachten oder annotieren
- `before_reset` – Sitzungs-Reset-Ereignisse beobachten (`/reset`, programmatische Resets)

**Subagents**

- `subagent_spawned` / `subagent_ended` – Start und Abschluss von Subagents beobachten.
- `subagent_delivery_target` – Kompatibilitäts-Hook für Abschlusszustellung, wenn keine Core-Sitzungsbindung eine Route projizieren kann.
- `subagent_spawning` – veralteter Kompatibilitäts-Hook. Core bereitet jetzt `thread: true`-Subagent-Bindungen über Adapter für Kanal-Sitzungsbindungen vor, bevor `subagent_spawned` ausgelöst wird.
- `subagent_spawned` enthält `resolvedModel` und `resolvedProvider`, wenn OpenClaw das native Modell der untergeordneten Sitzung vor dem Start aufgelöst hat.
- `subagent_ended` trägt `targetSessionKey` (Identität — dies entspricht `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` oder `"acp"`), `reason`, optional `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` oder `"deleted"`), optional `error`, `runId`, `endedAt`, `accountId` und `sendFarewell`. Es enthält **nicht** `agentId` oder `childSessionKey`; verwenden Sie `targetSessionKey`, um es mit dem entsprechenden `subagent_spawned`-Ereignis zu korrelieren.

**Lebenszyklus**

- `gateway_start` / `gateway_stop` – Plugin-eigene Dienste mit dem Gateway starten oder stoppen
- `deactivate` – veralteter Kompatibilitätsalias für `gateway_stop`; verwenden Sie `gateway_stop` in neuen Plugins
- `cron_changed` – Gateway-eigene Cron-Lebenszyklusänderungen beobachten (hinzugefügt, aktualisiert, entfernt, gestartet, beendet, geplant)
- **`before_install`** – bereitgestelltes Skill- oder Plugin-Installationsmaterial aus einer geladenen
  Plugin-Laufzeitumgebung prüfen

## Laufzeit-Hooks debuggen

Verwenden Sie `before_model_resolve`, wenn ein Plugin den Provider oder das Modell
für einen Agent-Turn wechseln muss. Er läuft vor der Modellauflösung; `llm_output` läuft erst, nachdem
ein Modellversuch Assistant-Ausgabe erzeugt hat.

Als Nachweis für das effektive Sitzungsmodell prüfen Sie Laufzeitregistrierungen und
verwenden Sie dann `openclaw sessions` oder die Gateway-Sitzungs-/Statusoberflächen. Wenn Sie
Provider-Payloads debuggen, starten Sie das Gateway mit `--raw-stream` und
`--raw-stream-path <path>`; diese Flags schreiben rohe Modell-Stream-Ereignisse in eine jsonl-
Datei.

## Tool-Aufruf-Richtlinie

`before_tool_call` erhält:

- `event.toolName`
- `event.params`
- optional `event.toolKind` und `event.toolInputKind`, host-autoritative
  Diskriminatoren für Tools, die absichtlich Namen teilen; zum Beispiel verwenden äußere
  Code-Mode-`exec`-Aufrufe `toolKind: "code_mode_exec"` und
  enthalten `toolInputKind: "javascript" | "typescript"`, wenn die Eingabesprache
  bekannt ist
- optional `event.derivedPaths`, mit Best-Effort-Zielpfadhinweisen, die vom Host
  für bekannte Tool-Envelopes wie `apply_patch` abgeleitet wurden; wenn vorhanden,
  können diese Pfade unvollständig sein oder mehr umfassen, als das Tool
  tatsächlich berührt (zum Beispiel bei fehlerhaften oder unvollständigen Eingaben)
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (bei Cron-gesteuerten Läufen gesetzt), `ctx.toolKind`,
  `ctx.toolInputKind` und Diagnose-`ctx.trace`

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Hook-Guard-Verhalten für typisierte Lebenszyklus-Hooks:

- `block: true` ist terminal und überspringt Handler mit niedrigerer Priorität.
- `block: false` wird als keine Entscheidung behandelt.
- `params` schreibt die Tool-Parameter für die Ausführung um.
- `requireApproval` pausiert den Agent-Lauf und fragt den Benutzer über Plugin-
  Genehmigungen. Der Befehl `/approve` kann sowohl exec- als auch Plugin-Genehmigungen genehmigen.
  In nativen `PreToolUse`-Relays im Report-Modus des Codex App-Servers wird dies
  an die passende Genehmigungsanfrage des App-Servers zurückgestellt; siehe [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#hook-boundaries).
- Ein niedriger priorisiertes `block: true` kann weiterhin blockieren, nachdem ein höher priorisierter Hook
  Genehmigung angefordert hat.
- `onResolution` erhält die aufgelöste Genehmigungsentscheidung – `allow-once`,
  `allow-always`, `deny`, `timeout` oder `cancelled`.

Siehe [Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests) für
Genehmigungsrouting, Entscheidungsverhalten und wann `requireApproval` statt
optionaler Tools oder exec-Genehmigungen zu verwenden ist.

Plugins, die Policy auf Host-Ebene benötigen, können vertrauenswürdige Tool-Policies mit
`api.registerTrustedToolPolicy(...)` registrieren. Diese laufen vor gewöhnlichen
`before_tool_call`-Hooks und vor normalen Hook-Entscheidungen. Gebündelte vertrauenswürdige
Policies laufen zuerst; vertrauenswürdige Policies installierter Plugins laufen danach in Plugin-Ladereihenfolge;
gewöhnliche `before_tool_call`-Hooks laufen danach. Gebündelte Plugins behalten
den bestehenden Pfad für vertrauenswürdige Policies. Installierte Plugins müssen explizit aktiviert
sein und jede Policy-ID in `contracts.trustedToolPolicies` deklarieren; nicht deklarierte IDs
werden vor der Registrierung abgelehnt. Policy-IDs sind auf das registrierende
Plugin begrenzt, sodass verschiedene Plugins dieselbe lokale ID wiederverwenden können. Verwenden Sie diese Ebene nur
für host-vertrauenswürdige Gates wie Workspace-Policy, Budgetdurchsetzung oder
reservierte Workflow-Sicherheit.

### Exec-Umgebungs-Hook

`resolve_exec_env` lässt Plugins Umgebungsvariablen zu `exec`-
Tool-Aufrufen beitragen, nachdem die Basis-exec-Umgebung erstellt wurde und bevor der
Befehl läuft. Er erhält:

- `event.sessionKey`
- `event.toolName`, derzeit immer `"exec"`
- `event.host`, einer von `"gateway"`, `"sandbox"` oder `"node"`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` und `ctx.channelId`

Geben Sie ein `Record<string, string>` zurück, um es in die exec-Umgebung zu mergen. Handler
laufen in Prioritätsreihenfolge, und spätere Hook-Ergebnisse überschreiben frühere Hook-Ergebnisse für
denselben Schlüssel.

Hook-Ausgaben werden durch die Schlüsselrichtlinie der Host-Ausführungsumgebung gefiltert, bevor sie
zusammengeführt werden. Ungültige Schlüssel, `PATH` und gefährliche Host-Override-Schlüssel wie
`LD_*`, `DYLD_*`, `NODE_OPTIONS`, Proxy-Variablen und TLS-Override-Variablen
werden verworfen. Die gefilterte Plugin-Umgebung wird in Gateway-Genehmigungs-/Audit-
Metadaten aufgenommen und an node-host-Ausführungsanfragen weitergeleitet.

### Persistenz von Tool-Ergebnissen

Tool-Ergebnisse können strukturierte `details` für UI-Rendering, Diagnosen,
Medien-Routing oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeitmetadaten,
nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor Provider-Replay und Compaction-
  Eingaben, damit Metadaten nicht zum Modellkontext werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Übermäßig große Details werden
  durch eine kompakte Zusammenfassung und `persistedDetailsTruncated: true` ersetzt.
- `tool_result_persist` und `before_message_write` laufen vor der endgültigen
  Persistenzbegrenzung. Hooks sollten zurückgegebene `details` dennoch klein halten und vermeiden,
  prompt-relevanten Text ausschließlich in `details` abzulegen; legen Sie für das Modell sichtbare Tool-Ausgaben
  in `content` ab.

## Prompt- und Modell-Hooks

Verwenden Sie für neue Plugins die phasenspezifischen Hooks:

- `before_model_resolve`: erhält nur den aktuellen Prompt und Anhangs-
  Metadaten. Gibt `providerOverride` oder `modelOverride` zurück.
- `agent_turn_prepare`: erhält den aktuellen Prompt, vorbereitete Sitzungsnachrichten
  und alle genau einmal eingereihten Injektionen, die für diese Sitzung entnommen wurden. Gibt
  `prependContext` oder `appendContext` zurück.
- `before_prompt_build`: erhält den aktuellen Prompt und Sitzungsnachrichten.
  Gibt `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` oder `appendSystemContext` zurück.
- `heartbeat_prompt_contribution`: läuft nur für Heartbeat-Turns und gibt
  `prependContext` oder `appendContext` zurück. Es ist für Hintergrundmonitore gedacht,
  die den aktuellen Zustand zusammenfassen müssen, ohne von Benutzern initiierte Turns zu ändern.

`before_agent_start` bleibt aus Kompatibilitätsgründen erhalten. Bevorzugen Sie die oben genannten expliziten Hooks,
damit Ihr Plugin nicht von einer Legacy-Kombinationsphase abhängt.

`before_agent_run` läuft nach der Prompt-Erstellung und vor jeder Modelleingabe,
einschließlich prompt-lokalem Laden von Bildern und `llm_input`-Beobachtung. Es erhält
die aktuelle Benutzereingabe als `prompt`, zusätzlich zum geladenen Sitzungsverlauf in `messages`
und zum aktiven System-Prompt. Geben Sie `{ outcome: "block", reason, message? }`
zurück, um den Lauf zu stoppen, bevor das Modell den Prompt lesen kann. `reason` ist intern;
`message` ist der benutzersichtbare Ersatz. Die einzigen unterstützten Ergebnisse sind
`pass` und `block`; nicht unterstützte Entscheidungsformen schlagen geschlossen fehl.

Wenn ein Lauf blockiert wird, speichert OpenClaw nur den Ersatztext in
`message.content` plus nicht sensible Blockierungsmetadaten wie die ID des blockierenden Plugins
und den Zeitstempel. Der ursprüngliche Benutzertext wird nicht im Transkript oder zukünftigen
Kontext beibehalten. Interne Blockierungsgründe werden als sensibel behandelt und aus
Transkript-, Verlaufs-, Broadcast-, Log- und Diagnose-Payloads ausgeschlossen. Observability
sollte bereinigte Felder wie Blocker-ID, Ergebnis, Zeitstempel oder eine sichere
Kategorie verwenden.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw
den aktiven Lauf identifizieren kann. Derselbe Wert ist auch unter `ctx.runId` verfügbar.
Cron-gesteuerte Läufe stellen außerdem `ctx.jobId` bereit (die ID des auslösenden Cron-Jobs), damit
Plugin-Hooks Metriken, Seiteneffekte oder Zustand auf einen bestimmten geplanten
Job eingrenzen können.

Bei kanalbasierten Läufen identifizieren `ctx.channel` und `ctx.messageProvider`
die Provider-Oberfläche wie `discord` oder `telegram`, während `ctx.channelId`
die Zielkennung der Unterhaltung ist, wenn OpenClaw sie aus dem Sitzungsschlüssel
oder den Zustellungsmetadaten ableiten kann.

Wenn die Absenderidentität verfügbar ist, enthalten Agent-Hook-Kontexte außerdem:

- `ctx.senderId` — kanalbezogene Absender-ID (z. B. Feishu `open_id`, Discord-
  Benutzer-ID). Wird befüllt, wenn der Lauf aus einer Benutzernachricht mit bekannten
  Absendermetadaten stammt.
- `ctx.chatId` — transportnative Unterhaltungskennung (z. B. Feishu
  `chat_id`, Telegram `chat_id`). Wird befüllt, wenn der Ursprungskanal
  eine native Unterhaltungs-ID bereitstellt.
- `ctx.channelContext.sender.id` — dieselbe Absender-ID wie `ctx.senderId`, unter einem
  kanaleigenen Objekt, das Plugins mit kanalspezifischen Feldern erweitern können.
- `ctx.channelContext.chat.id` — dieselbe Unterhaltungs-ID wie `ctx.chatId`, unter einem
  kanaleigenen Objekt, das Plugins mit kanalspezifischen Feldern erweitern können.

Core definiert nur die verschachtelten `id`-Felder. Kanal-Plugins, die umfangreichere
Absender- oder Chat-Metadaten über den Inbound-Helper weitergeben, können
`PluginHookChannelSenderContext` oder `PluginHookChannelChatContext` aus
`openclaw/plugin-sdk/channel-inbound` erweitern:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Kanal-Plugins geben diese Felder über den Inbound-SDK-Helper weiter:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Diese Felder sind optional und fehlen bei systembasierten Läufen (Heartbeat,
Cron, exec-event).

`ctx.senderExternalId` bleibt als veraltetes Feld für Quellkompatibilität für
ältere Plugins erhalten. Core befüllt es nicht; neue kanalspezifische Absenderidentitäten
sollten über Modulerweiterung unter `ctx.channelContext.sender` liegen.

`agent_end` ist ein Beobachtungs-Hook. Gateway- und persistente Harness-Pfade führen ihn
nach dem Turn im Fire-and-forget-Verfahren aus, während kurzlebige einmalige CLI-Pfade vor der
Prozessbereinigung auf das Hook-Promise warten, damit vertrauenswürdige Plugins terminale
Observability flushen oder Zustand erfassen können. Der Hook-Runner wendet ein Timeout von 30 Sekunden an, damit ein
festhängendes Plugin oder ein eingebetteter Endpunkt das Hook-Promise nicht dauerhaft offen lässt.
Ein Timeout wird protokolliert und OpenClaw fährt fort; Plugin-eigene Netzwerkarbeit wird dadurch nicht abgebrochen,
sofern das Plugin nicht auch sein eigenes Abbruchsignal verwendet.

Verwenden Sie `model_call_started` und `model_call_ended` für Provider-Aufruf-Telemetrie,
die keine Roh-Prompts, Verläufe, Antworten, Header, Request-
Bodies oder Provider-Request-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminale
`durationMs`/`outcome` und `upstreamRequestIdHash`, wenn OpenClaw einen
begrenzten Hash der Provider-Request-ID ableiten kann. Wenn die Laufzeit Context-Window-
Metadaten aufgelöst hat, enthalten Hook-Event und Kontext außerdem `contextTokenBudget`, das
effektive Token-Budget nach Modell-/Konfigurations-/Agent-Begrenzungen, plus
`contextWindowSource` und `contextWindowReferenceTokens`, wenn eine niedrigere Begrenzung
angewendet wurde.

`before_agent_finalize` läuft nur, wenn ein Harness im Begriff ist, eine natürliche
abschließende Assistentenantwort zu akzeptieren. Es ist nicht der `/stop`-Abbruchpfad und läuft nicht,
wenn der Benutzer einen Turn abbricht. Geben Sie `{ action: "revise", reason }` zurück, um
den Harness vor der Finalisierung um einen weiteren Modelllauf zu bitten, `{ action:
"finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis weg, um fortzufahren.
Native Codex-`Stop`-Hooks werden als OpenClaw-
`before_agent_finalize`-Entscheidungen an diesen Hook weitergeleitet.

Beim Zurückgeben von `action: "revise"` können Plugins `retry`-Metadaten einschließen, um
den zusätzlichen Modelllauf begrenzt und replay-sicher zu machen:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wird an den an den Harness gesendeten Revisionsgrund angehängt.
`idempotencyKey` lässt den Host Wiederholungen für dieselbe Plugin-Anfrage über
äquivalente Finalisierungsentscheidungen hinweg zählen, und `maxAttempts` begrenzt, wie viele zusätzliche Läufe der
Host zulässt, bevor er mit der natürlichen abschließenden Antwort fortfährt.

Nicht gebündelte Plugins, die Roh-Konversations-Hooks (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` oder `before_agent_run`) benötigen, müssen Folgendes setzen:

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
`api.registerSessionExtension(...)` persistieren und ihn über die Gateway-
Methode `sessions.pluginPatch` aktualisieren. Sitzungszeilen projizieren registrierten Erweiterungszustand
über `pluginExtensions`, sodass Control UI und andere Clients
Plugin-eigenen Status darstellen können, ohne Plugin-Interna zu kennen.

Verwenden Sie `api.enqueueNextTurnInjection(...)`, wenn ein Plugin dauerhaften Kontext benötigt, der
genau einmal den nächsten Modell-Turn erreichen soll. OpenClaw entnimmt eingereihte Injektionen vor
Prompt-Hooks, verwirft abgelaufene Injektionen und dedupliziert pro Plugin nach `idempotencyKey`.
Dies ist die richtige Schnittstelle für Genehmigungsfortsetzungen, Richtlinienzusammenfassungen,
Deltas von Hintergrundmonitoren und Befehlsfortsetzungen, die für das Modell im nächsten Turn sichtbar sein sollen,
aber nicht zu dauerhaftem System-Prompt-Text werden sollen.

Bereinigungssemantik ist Teil des Vertrags. Bereinigung von Sitzungserweiterungen und
Callbacks zur Laufzeit-Lifecycle-Bereinigung erhalten `reset`, `delete`, `disable` oder
`restart`. Der Host entfernt den persistenten Sitzungserweiterungszustand des besitzenden Plugins
und ausstehende Next-Turn-Injektionen bei reset/delete/disable; restart behält
dauerhaften Sitzungszustand bei, während Bereinigungs-Callbacks Plugins erlauben, Scheduler-
Jobs, Laufkontext und andere Out-of-band-Ressourcen für die alte Laufzeit-
Generation freizugeben.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing und Zustellungsrichtlinien auf Kanalebene:

- `message_received`: beobachtet eingehende Inhalte, Absender, `threadId`, `messageId`,
  `senderId`, optionale Lauf-/Sitzungskorrelation und Metadaten.
- `message_sending`: schreibt `content` um oder gibt `{ cancel: true }` zurück.
- `reply_payload_sending`: schreibt normalisierte `ReplyPayload`-Objekte um (einschließlich
  `presentation`, `delivery`, Medienreferenzen und Text) oder gibt `{ cancel: true }` zurück.
- `message_sent`: beobachtet endgültigen Erfolg oder Fehlschlag.

Bei reinen Audio-TTS-Antworten kann `content` das verborgene gesprochene Transkript
enthalten, auch wenn der Kanal-Payload keinen sichtbaren Text/keine sichtbare Beschriftung hat. Das Umschreiben dieses
`content` aktualisiert nur das für den Hook sichtbare Transkript; es wird nicht als
Medienbeschriftung gerendert.

`reply_payload_sending`-Ereignisse können `usageState` enthalten, einen bestmöglichen Live-
Snapshot pro Turn zu Modell/Nutzung/Kontext. Dauerhafte Zustellung, wiederhergestelltes Replay und
Antworten ohne exakte Laufkorrelation lassen ihn weg.

Nachrichten-Hook-Kontexte stellen stabile Korrelationsfelder bereit, wenn verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Inbound-
und `before_dispatch`-Kontexte stellen außerdem Antwortmetadaten bereit, wenn der Kanal
sichtbarkeitsgefilterte Daten zitierter Nachrichten hat: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` und `replyToIsQuote`. Bevorzugen Sie diese First-Class-
Felder, bevor Sie Legacy-Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie kanalspezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Umgeschriebener `content` wird an Hooks mit niedrigerer Priorität weitergegeben, sofern kein späterer Hook
  die Zustellung abbricht.
- `reply_payload_sending` wird nach der Payload-Normalisierung und vor der Kanalzustellung ausgeführt,
  einschließlich Antworten, die zurück an den ursprünglichen Kanal geroutet werden. Handler
  werden sequenziell ausgeführt, und jeder Handler sieht die neueste Payload, die von
  Handlern mit höherer Priorität erzeugt wurde.
- `reply_payload_sending`-Payloads legen keine Laufzeit-Vertrauensmarker wie
  `trustedLocalMedia` offen; Plugins können die Payload-Form bearbeiten, aber kein Vertrauen für lokale
  Medien gewähren.
- `message_sending` kann bei einem Abbruch `cancelReason` und begrenzte `metadata`
  zurückgeben. Neue Message-Lifecycle-APIs machen dies als unterdrücktes Zustellungs-
  Ergebnis mit dem Grund `cancelled_by_message_sending_hook` sichtbar; die alte direkte
  Zustellung gibt aus Kompatibilitätsgründen weiterhin ein leeres Ergebnisarray zurück.
- `message_sent` dient nur der Beobachtung. Handler-Fehler werden protokolliert und ändern
  das Zustellungsergebnis nicht.

## Installations-Hooks

Verwenden Sie `security.installPolicy` für Allow-/Block-Entscheidungen, die vom Operator verwaltet werden. Diese
Policy läuft aus der OpenClaw-Konfiguration, deckt CLI-Installations- und Aktualisierungspfade ab und schlägt
geschlossen fehl, wenn sie aktiviert, aber nicht verfügbar ist.

`before_install` ist ein Lifecycle-Hook der Plugin-Laufzeit. Er wird nach
`security.installPolicy` nur in dem OpenClaw-Prozess ausgeführt, in dem Plugin-Hooks
bereits geladen wurden, etwa bei Gateway-gestützten Installationsabläufen. Er eignet sich für
Plugin-eigene Beobachtungen, Warnungen und Kompatibilitätsprüfungen, ist aber nicht die
primäre Sicherheitsgrenze für Unternehmen oder Hosts bei Installationen. Das Feld `builtinScan`
bleibt aus Kompatibilitätsgründen in der Event-Payload, aber OpenClaw führt keine
integrierte gefährlicher-Code-Blockierung zur Installationszeit mehr aus, daher ist es ein leeres `ok`-
Ergebnis. Geben Sie zusätzliche Findings oder `{ block: true, blockReason }` zurück, um die
Installation in diesem Prozess zu stoppen.

`block: true` ist terminal. `block: false` wird als keine Entscheidung behandelt.
Handler-Fehler blockieren die Installation fail-closed.

## Gateway-Lifecycle

Verwenden Sie `gateway_start` für Plugin-Dienste, die Gateway-eigenen Zustand benötigen. Der
Kontext stellt `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` zur
Cron-Inspektion und für Aktualisierungen bereit. Verwenden Sie `gateway_stop`, um lang laufende
Ressourcen zu bereinigen.

Verlassen Sie sich für Plugin-eigene Laufzeitdienste nicht auf den internen Hook
`gateway:startup`.

`cron_changed` wird für Gateway-eigene Cron-Lifecycle-Events mit einer typisierten
Event-Payload ausgelöst, die die Gründe `added`, `updated`, `removed`, `started`, `finished`
und `scheduled` abdeckt. Das Event enthält einen Snapshot von `PluginHookGatewayCronJob`
(einschließlich `state.nextRunAtMs`, `state.lastRunStatus` und
`state.lastError`, falls vorhanden) sowie einen `PluginHookGatewayCronDeliveryStatus`
von `not-requested` | `delivered` | `not-delivered` | `unknown`. Removed-
Events enthalten weiterhin den Snapshot des gelöschten Jobs, damit externe Scheduler
den Zustand abgleichen können. Verwenden Sie beim Synchronisieren externer Wake-Scheduler
`ctx.getCron?.()` und `ctx.config` aus dem Laufzeitkontext, und behalten Sie OpenClaw als
Source of Truth für Fälligkeitsprüfungen und Ausführung bei.

## Kommende Deprecations

Einige Hook-nahe Oberflächen sind deprecated, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major-Release:

- **Plaintext-Kanal-Envelopes** in `inbound_claim`- und `message_received`-
  Handlern. Lesen Sie `BodyForAgent` und die strukturierten User-Context-Blöcke,
  statt flachen Envelope-Text zu parsen. Siehe
  [Plaintext-Kanal-Envelopes → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen erhalten. Neue Plugins sollten
  stattdessen `before_model_resolve` und `before_prompt_build` statt der kombinierten
  Phase verwenden.
- **`subagent_spawning`** bleibt aus Kompatibilitätsgründen mit älteren Plugins erhalten, aber
  neue Plugins sollten daraus kein Thread-Routing zurückgeben. Core bereitet
  `thread: true`-Subagent-Bindings über Channel-Session-Binding-Adapter vor,
  bevor `subagent_spawned` ausgelöst wird.
- **`deactivate`** bleibt bis nach dem 2026-08-16 als deprecated Cleanup-Kompatibilitätsalias
  erhalten. Neue Plugins sollten `gateway_stop` verwenden.
- **`onResolution` in `before_tool_call`** verwendet nun die typisierte
  `PluginApprovalResolution`-Union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) statt eines frei formulierten `string`.

Die vollständige Liste - Registrierung der Memory-Capability, Provider-Thinking-
Profil, externe Auth-Provider, Provider-Discovery-Typen, Task-Runtime-
Accessors und die Umbenennung von `command-auth` → `command-status` - finden Sie unter
[Plugin-SDK-Migration → Aktive Deprecations](/de/plugins/sdk-migration#active-deprecations).

## Verwandt

- [Plugin-SDK-Migration](/de/plugins/sdk-migration) - aktive Deprecations und Zeitplan für Entfernungen
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Interne Plugin-Architektur](/de/plugins/architecture-internals)
