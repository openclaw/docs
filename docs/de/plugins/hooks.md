---
read_when:
    - Sie entwickeln ein Plugin, das `before_tool_call`, `before_agent_reply`, Nachrichten-Hooks oder Lifecycle-Hooks benötigt
    - Sie müssen Tool-Aufrufe eines Plugins blockieren, umschreiben oder genehmigungspflichtig machen
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
    - Sie übertragen OpenClaw-Cron-Aufrufe in einen externen Host-Scheduler.
summary: 'Plugin-Hooks: Ereignisse im Lebenszyklus von Agenten, Tools, Nachrichten, Sitzungen und Gateway abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-07-24T04:01:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330deb9a7dfbf69b8bb5c7e06f61d4d1a0db670abff20328cac5858bc893c326
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-Hooks sind prozessinterne Erweiterungspunkte für OpenClaw-Plugins: Sie ermöglichen das Prüfen oder
Ändern von Agent-Ausführungen, Tool-Aufrufen, Nachrichtenflüssen, Sitzungslebenszyklen, Subagent-
Routing, Installationen oder des Gateway-Starts.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks) für ein kleines, vom Betreiber installiertes
`HOOK.md`-Skript, das auf Befehls- und Gateway-Ereignisse wie `/new`,
`/reset`, `/stop`, `agent:bootstrap` oder `gateway:startup` reagiert.

## Schnellstart

Registrieren Sie typisierte Hooks mit `api.on(...)` im Plugin-Einstiegspunkt:

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
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Handler, die Entscheidungen oder Änderungen zurückgeben können, werden sequenziell in
absteigender Reihenfolge nach `priority` ausgeführt; Handler mit gleicher Priorität behalten die Registrierungsreihenfolge bei.
Handler, die nur beobachten, werden parallel ausgeführt, und Fire-and-forget-Beobachtungs-
Dispatches können sich mit späteren Ereignissen überschneiden. Verwenden Sie die Priorität nicht, um
Beobachtungsnebeneffekte zu ordnen.

`api.on(name, handler, opts?)` akzeptiert:

| Option      | Wirkung                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Reihenfolge; höhere Werte werden zuerst ausgeführt.                                                                                                                                                                      |
| `timeoutMs` | Wartezeitbudget pro Hook. Nach dessen Ablauf wartet OpenClaw nicht mehr auf diesen Handler und fährt fort. Der Handler oder seine Nebeneffekte werden dadurch nicht abgebrochen. Lassen Sie die Option weg, um das standardmäßige Zeitlimit des Runners pro Hook zu verwenden. |

Betreiber können Hook-Budgets festlegen, ohne den Plugin-Code zu ändern:

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
vom Plugin festgelegten Wert `api.on(..., { timeoutMs })` überschreibt. Jeder Wert muss eine
positive Ganzzahl bis zu 600000 ms sein. Bevorzugen Sie Überschreibungen pro Hook für bekanntermaßen langsame
Hooks, damit ein Plugin nicht überall ein längeres Budget erhält.

Ein Handler-Promise, dessen Zeitlimit überschritten wurde, läuft weiter, da Hook-Callbacks kein
Abbruchsignal erhalten. Der Hook-Dispatch kann seine Gateway-
Zulassung freigeben, während die Plugin-Arbeit noch läuft. Plugins, die
lang laufende Arbeit verwalten, müssen einen eigenen Abbruch- und Herunterfahrlebenszyklus bereitstellen.

Die ausgehenden modifizierenden Hooks `message_sending` und `reply_payload_sending` verwenden standardmäßig
15 Sekunden pro Handler. Wenn bei einem das Zeitlimit überschritten wird, protokolliert OpenClaw den Plugin-Fehler
und fährt mit der neuesten Nutzlast fort, damit sich die serialisierte Zustellungsspur
abschließen kann. Legen Sie für Plugins, die vor der Zustellung absichtlich langsamere
Arbeit ausführen, ein höheres Budget pro Hook fest.

Kanal-Plugins, die `createReplyDispatcher` verwenden, können ebenfalls ein höheres
positives Budget pro Stufe mit `beforeDeliverOptions: { timeoutMs }` deklarieren oder beim
Anhängen von Arbeit mit `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Ohne ein vom Verantwortlichen deklariertes Budget verwenden diese Callbacks denselben Standardwert von 15 Sekunden,
damit ein hängender Callback die serialisierte Zustellungsspur nicht blockieren kann.

Jeder Hook erhält `event.context.pluginConfig`, die aufgelöste Konfiguration für das
Plugin, das diesen Handler registriert hat. OpenClaw fügt sie für jeden Handler ein, ohne
das gemeinsam genutzte Ereignisobjekt zu verändern, das andere Plugins sehen.

## Hook-Katalog

Hooks sind nach der Oberfläche gruppiert, die sie erweitern. **Fettgedruckte** Namen akzeptieren ein Entscheidungs-
ergebnis (blockieren, abbrechen, überschreiben oder Genehmigung anfordern); die übrigen
dienen nur der Beobachtung.

**Agent-Durchlauf**

| Hook                            | Zweck                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden                                  |
| `agent_turn_prepare`            | In der Warteschlange befindliche Plugin-Einspeisungen für den Durchlauf verarbeiten und vor Prompt-Hooks Kontext für denselben Durchlauf hinzufügen      |
| `before_prompt_build`           | Vor dem Modellaufruf dynamischen Kontext oder System-Prompt-Text hinzufügen                          |
| **`before_agent_run`**          | Den endgültigen Prompt und die Sitzungsnachrichten vor der Übermittlung an das Modell prüfen; kann die Ausführung blockieren |
| **`before_agent_reply`**        | Den Modelldurchlauf mit einer synthetischen Antwort oder ohne Ausgabe kurzschließen                           |
| **`before_agent_finalize`**     | Die natürliche endgültige Antwort prüfen und einen weiteren Modelldurchlauf anfordern                         |
| `agent_end`                     | Endgültige Nachrichten, Erfolgsstatus und Ausführungsdauer beobachten                                  |
| `heartbeat_prompt_contribution` | Nur für Heartbeat bestimmten Kontext für Hintergrundüberwachungs- und Lebenszyklus-Plugins hinzufügen                  |

**Konversationsbeobachtung**

| Hook                                      | Zweck                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Bereinigte Metadaten zu Provider-/Modellaufrufen: Zeitmessung, Ergebnis, begrenzte Anfrage-ID-Hashes. Keine Prompt- oder Antwortinhalte. |
| `llm_input`                               | Provider-Eingabe: System-Prompt, Prompt, Verlauf                                                                     |
| `llm_output`                              | Provider-Ausgabe, Nutzung und die aufgelöste `contextTokenBudget`, sofern verfügbar                                       |

**Tools**

| Hook                       | Zweck                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung anfordern |
| `after_tool_call`          | Tool-Ergebnisse, Fehler und Dauer beobachten                |
| `resolve_exec_env`         | Plugin-eigene Umgebungsvariablen zu `exec` beitragen   |
| **`tool_result_persist`**  | Die aus einem Tool-Ergebnis erzeugte Assistentennachricht umschreiben |
| **`before_message_write`** | Einen laufenden Schreibvorgang für Nachrichten prüfen oder blockieren (selten)      |

**Nachrichten und Zustellung**

| Hook                            | Zweck                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Eine eingehende Nachricht vor dem Agent-Routing übernehmen (synthetische Antworten) |
| **`channel_pairing_requested`** | Neu erstellte DM-Kopplungsanfragen beobachten                         |
| `message_received`              | Eingehende Inhalte, Absender, Thread und Metadaten beobachten             |
| **`message_sending`**           | Ausgehende Inhalte umschreiben oder Zustellung abbrechen                       |
| **`reply_payload_sending`**     | Normalisierte Antwortnutzlasten vor der Zustellung verändern oder abbrechen        |
| `message_sent`                  | Erfolg oder Fehlschlag der ausgehenden Zustellung beobachten                      |
| **`before_dispatch`**           | Einen ausgehenden Dispatch vor der Übergabe an den Kanal prüfen oder umschreiben    |
| **`reply_dispatch`**            | An der abschließenden Antwort-Dispatch-Pipeline teilnehmen                  |

**Sitzungen und Compaction**

| Hook                                     | Zweck                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Grenzen des Sitzungslebenszyklus verfolgen. `reason` ist entweder `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` oder `unknown`. `shutdown`/`restart` werden vom Finalizer beim Herunterfahren des Gateways ausgelöst, wenn der Prozess mit aktiven Sitzungen beendet oder neu gestartet wird, sodass Plugins (Speicher, Transkriptspeicher) verwaiste Zeilen abschließen können, anstatt sie über Neustarts hinweg geöffnet zu lassen. Der Finalizer ist zeitlich begrenzt, damit ein langsames Plugin SIGTERM/SIGINT nicht blockieren kann. |
| `before_compaction` / `after_compaction` | Compaction-Zyklen beobachten oder annotieren                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Ereignisse zum Zurücksetzen von Sitzungen beobachten (`/reset`, programmgesteuerte Zurücksetzungen)                                                                                                                                                                                                                                                                                                                                                                                                     |

Bei `sessions.create`-Aufrufen mit `parentSessionKey` und `emitCommandHooks: true` erhält ein eigenständiges untergeordnetes Element immer `session_start`. Aufrufer geben mit `succeedsParent` an, ob das übergeordnete Element ebenfalls ein abschließendes `session_end` erhält: `true` bedeutet Nachfolger, `false` bedeutet paralleles untergeordnetes Element. Wird die Angabe weggelassen, bleibt das bisherige Rollover-Verhalten des übergeordneten Elements erhalten. Die Hooks `command:new` und `before_reset` beschreiben in beiden Fällen weiterhin die angeforderte Aktion `/new`.

**Subagents**

- `subagent_spawned` / `subagent_ended` – Start und Abschluss eines Subagenten beobachten.
- `subagent_delivery_target` – Kompatibilitäts-Hook für die Abschlusszustellung, wenn keine Bindung an eine Core-Sitzung eine Route projizieren kann.
- `subagent_spawning` – veralteter Kompatibilitäts-Hook. Core bereitet jetzt `thread: true`-Subagentenbindungen über Adapter für Kanalsitzungsbindungen vor, bevor `subagent_spawned` ausgelöst wird.
- `subagent_spawned` enthält `resolvedModel` und `resolvedProvider`, wenn OpenClaw das native Modell der untergeordneten Sitzung vor dem Start aufgelöst hat.
- `subagent_ended` enthält `targetSessionKey` (Identität – entspricht `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` oder `"acp"`), `reason`, optional `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` oder `"deleted"`), optional `error`, `runId`, `endedAt`, `accountId` und `sendFarewell`. Es enthält **weder** `agentId` **noch** `childSessionKey`; verwenden Sie `targetSessionKey`, um es mit dem entsprechenden `subagent_spawned`-Ereignis zu korrelieren.

**Lebenszyklus**

| Hook                             | Zweck                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Plugin-eigene Dienste zusammen mit dem Gateway starten oder stoppen                                                 |
| `deactivate`                     | Veralteter Kompatibilitätsalias für `gateway_stop`; verwenden Sie in neuen Plugins `gateway_stop`                 |
| `cron_reconciled`                | Nach dem Start oder Neuladen einen Abgleich mit dem vollständigen Cron-Zustand des Gateways durchführen                            |
| `cron_changed`                   | Änderungen am Gateway-eigenen Cron-Lebenszyklus beobachten (hinzugefügt, aktualisiert, entfernt, gestartet, abgeschlossen, geplant) |
| **`before_install`**             | Bereitgestelltes Installationsmaterial für Skills oder Plugins aus einer geladenen Plugin-Laufzeit untersuchen                         |

### Anfragen zur Kanalkopplung

Verwenden Sie `channel_pairing_requested`, wenn ein Plugin einen Betreiber benachrichtigen oder
einen Audit-Datensatz schreiben muss, nachdem der Absender einer nicht gekoppelten Direktnachricht eine ausstehende
Kopplungsanfrage erstellt hat. Der Hook wird beim Erstellen der Anfrage ausgelöst; die Kanalzustellung der
Kopplungsantwort wird durch langsame oder fehlschlagende Hook-Handler nicht verzögert.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Neue ${event.channel}-Kopplungsanfrage von ${event.senderId}: ${event.code}`,
  });
});
```

Der Hook dient ausschließlich der Beobachtung. Er genehmigt, lehnt, unterdrückt oder verändert
die Kopplungsantwort nicht. Die Nutzlast enthält den Kanal, optional `accountId`,
die kanalbezogene `senderId`, den Kopplungs-`code` und Kanalmetadaten. Behandeln Sie den
Kopplungscode als aktive, einmalig verwendbare Genehmigungszugangsdaten und übermitteln Sie ihn nur an eine
vertrauenswürdige Senke für Betreiber. Behandeln Sie `metadata` als nicht vertrauenswürdigen, vom Absender bereitgestellten Identitätstext.
Der Hook enthält weder den Text noch die Medien der eingehenden Nachricht.

## Hooks zum Debuggen der Laufzeit

Verwenden Sie `before_model_resolve`, um für einen Agentendurchlauf den Provider oder das Modell zu wechseln – der Hook
wird vor der Modellauflösung ausgeführt. `llm_output` wird erst ausgeführt, nachdem ein Modellversuch
eine Assistentenausgabe erzeugt hat.

Um das tatsächlich verwendete Sitzungsmodell nachzuweisen, untersuchen Sie die Laufzeitregistrierungen und
verwenden Sie anschließend `openclaw sessions` oder die Sitzungs-/Statusoberflächen des Gateways. Um
Provider-Nutzlasten zu debuggen, starten Sie das Gateway mit `--raw-stream` und
`--raw-stream-path <path>`, damit rohe Modellstream-Ereignisse in eine jsonl-Datei geschrieben werden.

## Richtlinie für Tool-Aufrufe

`before_tool_call` empfängt:

- `event.toolName`
- `event.params`
- optional `event.toolKind` und `event.toolInputKind`, vom Host autoritativ festgelegte
  Unterscheidungsmerkmale für Tools, die absichtlich dieselben Namen verwenden; beispielsweise verwenden äußere
  `exec`-Aufrufe im Code-Modus `toolKind: "code_mode_exec"` und enthalten
  `toolInputKind: "javascript" | "typescript"`, wenn die Eingabesprache
  bekannt ist
- optional `event.derivedPaths`, nach bestem Bemühen vom Host abgeleitete Hinweise auf Zielpfade
  für bekannte Tool-Umschläge wie `apply_patch`; diese Pfade können unvollständig sein oder
  übermäßig großzügig abschätzen, worauf das Tool tatsächlich zugreift (beispielsweise
  bei fehlerhaften oder unvollständigen Eingaben)
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` und das Diagnosefeld `ctx.trace`
- optional `ctx.requester`, der vom Host abgeleitete Anforderer, der den aktuellen
  Nachrichtendurchlauf initiiert hat. Er kann `channel`, `accountId`, `senderId`,
  `senderIsOwner` und das Provider-native `roleIds` enthalten. Fehlende Felder sind nicht nachgewiesen
  und keine falschen Zusicherungen; verweigern Sie im Zweifel, wenn die Richtlinie diese Felder voraussetzt.

Der Hook kann Folgendes zurückgeben:

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
    /** @deprecated Nicht aufgelöste Genehmigungen führen immer zur Ablehnung. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Guard-Verhalten für typisierte Lebenszyklus-Hooks:

- `block: true` ist endgültig und überspringt Handler mit niedrigerer Priorität.
- `block: false` wird als keine Entscheidung behandelt.
- `params` schreibt die Tool-Parameter für die Ausführung um.
- `requireApproval` pausiert den Agentendurchlauf und fragt den Benutzer über Plugin-
  Genehmigungen. `/approve` kann sowohl Ausführungs- als auch Plugin-Genehmigungen erteilen. Bei nativen
  `PreToolUse`-Weiterleitungen im Berichtsmodus des Codex-App-Servers wird dies an die
  entsprechende Genehmigungsanfrage des App-Servers delegiert; siehe
  [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#hook-boundaries).
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook mit höherer Priorität
  eine Genehmigung angefordert hat.
- `onResolution` empfängt die aufgelöste Entscheidung: `allow-once`, `allow-always`,
  `deny`, `timeout` oder `cancelled`.

### Absenderbezogene Richtlinie in einer Datei

Eine eigenständige Plugin-Datei kann bereitstellungsspezifische Richtlinien im Code verwalten,
anstatt ein weiteres Konfigurationsschema hinzuzufügen. Dieses Beispiel gewährt Eigentümern Zugriff auf alle Tools,
gestattet konfigurierten Betreuern eine konservative Auswahl an Tools und Nachrichtenaktionen
und stellt `/fix` für Absender bereit, die bereits durch die Kanalkonfiguration autorisiert sind:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const AGENT_ID = "maintenance-agent";
const MAINTAINER_SCOPES = [
  {
    channel: "discord",
    accountId: "operations",
    senderIds: new Set(["maintainer-user-id"]),
    roleIds: new Set(["maintainer-role-id"]),
  },
];
const MAINTAINER_TOOLS = new Set(["read", "web_fetch", "web_search", "session_status", "message"]);
const MAINTAINER_MESSAGE_ACTIONS = new Set(["react", "reply", "thread-create", "thread-reply"]);

export default definePluginEntry({
  id: "maintenance-access",
  name: "Wartungszugriff",
  description: "Absenderbezogene Tool-Richtlinie auf den Wartungsagenten anwenden.",
  register(api) {
    api.on("before_tool_call", (event, ctx) => {
      if (ctx.agentId !== AGENT_ID) {
        return;
      }

      const requester = ctx.requester;
      if (requester?.senderIsOwner === true) {
        return;
      }

      const maintainerScope = requester
        ? MAINTAINER_SCOPES.find(
            (scope) =>
              scope.channel === requester.channel && scope.accountId === requester.accountId,
          )
        : undefined;
      const isMaintainer =
        maintainerScope !== undefined &&
        ((requester?.senderId !== undefined && maintainerScope.senderIds.has(requester.senderId)) ||
          requester?.roleIds?.some((roleId) => maintainerScope.roleIds.has(roleId)) === true);
      if (!isMaintainer) {
        return { block: true, blockReason: "Zugriff als Betreuer erforderlich." };
      }

      if (event.toolName === "message") {
        const action = typeof event.params.action === "string" ? event.params.action : "";
        if (MAINTAINER_MESSAGE_ACTIONS.has(action)) {
          return;
        }
        return { block: true, blockReason: `Für message.${action || "unknown"} ist der Eigentümer erforderlich.` };
      }

      if (MAINTAINER_TOOLS.has(event.toolName)) {
        return;
      }
      return { block: true, blockReason: `Für ${event.toolName} ist der Eigentümer erforderlich.` };
    });

    api.registerCommand({
      name: "fix",
      description: "Den Wartungsagenten bitten, ein Problem zu untersuchen und zu beheben.",
      acceptsArgs: true,
      requireAuth: true,
      handler: async (ctx) =>
        ctx.agentId === AGENT_ID
          ? { continueAgent: true }
          : { text: "Dieser Befehl ist nur in der Wartungskonversation verfügbar." },
    });
  },
});
```

Laden Sie die Datei direkt und starten Sie das Gateway neu:

```json5
{
  agents: {
    list: [
      {
        id: "maintenance-agent",
        workspace: "~/.openclaw/workspace-maintenance",
      },
    ],
  },
  bindings: [
    {
      agentId: "maintenance-agent",
      match: {
        channel: "discord",
        accountId: "operations",
        peer: { kind: "channel", id: "maintenance-channel-id" },
      },
    },
  ],
  plugins: {
    load: { paths: ["~/.openclaw/policies/maintenance-access.ts"] },
  },
}
```

`AGENT_ID` muss den Agenten benennen, der an die Wartungskonversation gebunden ist. Die
Bindung wählt diesen Agenten für normale Nachrichten und `/fix` aus; die eigenständige Datei
bleibt die einzige zuständige Stelle für die Tool-Richtlinie, die zwischen Eigentümern und Betreuern unterscheidet.

`requireAuth: true` verwendet die bestehende Absenderzulassung jedes Kanals erneut. Bei
Discord kann eine `users`-/`roles`-Positivliste einer Guild oder eines Kanals die
Wartungszielgruppe autorisieren. Andere Kanäle können stabile Absender-IDs verwenden. Der Hook wendet dann
bei jedem Tool-Aufruf im Durchlauf die feinere Entscheidung pro Tool an, einschließlich
nativer `PreToolUse`-Aufrufe von Codex. Er kann ein für das Modell sichtbares Tool ablehnen, aber
kein vom Host ausgelassenes Tool hinzufügen. Bestehende Sandbox-, Ausführungsgenehmigungs-, nur für Eigentümer vorgesehene
Core-Tool- und Kanalrichtlinien gelten weiterhin; der Hook kann diese nicht außer Kraft setzen.

Beschränken Sie Absender- und Rollen-IDs wie gezeigt auf ein genaues Kanal-/Kontopaar; beide sind
Provider-lokale Namensräume. Halten Sie die Positivlisten restriktiv. Fügen Sie Schreib- oder
Ausführungs-Tools nur hinzu, wenn die Sandbox- und Genehmigungsrichtlinie der Bereitstellung
dies sicher macht. Entscheiden Sie bei automatisierten oder Systemdurchläufen ausdrücklich, ob ein fehlendes
`ctx.requester` zugelassen werden soll; das Beispiel lehnt dies für den betreffenden Agenten ab.

Informationen zur Weiterleitung von Genehmigungen, zum Entscheidungsverhalten und dazu, wann `requireApproval`
anstelle optionaler Tools oder Ausführungsgenehmigungen verwendet werden sollte, finden Sie unter
[Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests).

Plugins, die Richtlinien auf Host-Ebene benötigen, können mit
`api.registerTrustedToolPolicy(...)` vertrauenswürdige Tool-Richtlinien registrieren. Diese werden vor gewöhnlichen
`before_tool_call`-Hooks und vor normalen Hook-Entscheidungen ausgeführt. Gebündelte vertrauenswürdige
Richtlinien werden zuerst ausgeführt; vertrauenswürdige Richtlinien installierter Plugins folgen in der
Ladereihenfolge der Plugins; gewöhnliche `before_tool_call`-Hooks werden danach ausgeführt. Gebündelte Plugins behalten
den bestehenden Pfad für vertrauenswürdige Richtlinien bei. Installierte Plugins müssen ausdrücklich aktiviert sein
und jede Richtlinien-ID in `contracts.trustedToolPolicies` deklarieren; nicht deklarierte IDs
werden vor der Registrierung abgelehnt. Richtlinien-IDs sind auf das registrierende
Plugin beschränkt, sodass verschiedene Plugins dieselbe lokale ID wiederverwenden können. Verwenden Sie diese Stufe nur
für vom Host als vertrauenswürdig eingestufte Sperren, etwa Arbeitsbereichsrichtlinien, Budgetdurchsetzung oder
die Sicherheit reservierter Arbeitsabläufe.

### Hook für die Exec-Umgebung

`resolve_exec_env` ermöglicht es Plugins, Umgebungsvariablen zu `exec`-
Toolaufrufen beizutragen, bevor der Befehl ausgeführt wird. Der Hook empfängt:

- `event.sessionKey`
- `event.toolName`, derzeit immer `"exec"`
- `event.host`, entweder `"gateway"`, `"sandbox"` oder `"node"`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` und `ctx.channelId`

Geben Sie ein `Record<string, string>` zurück, das mit der Exec-Umgebung zusammengeführt wird. Handler
werden in Prioritätsreihenfolge ausgeführt; spätere Ergebnisse überschreiben frühere Ergebnisse für denselben
Schlüssel.

Die Hook-Ausgabe wird vor dem Zusammenführen anhand der Schlüsselrichtlinie für die Host-Exec-Umgebung
gefiltert. `PATH` wird immer verworfen (Befehlsauflösung und Prüfungen sicherer Binärdateien
hängen davon ab). Ungültige Schlüssel und gefährliche Schlüssel zum Überschreiben des Hosts wie `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, Proxy-Variablen (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) und TLS-Überschreibungsvariablen (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` und ähnliche) werden verworfen. Die gefilterte Plugin-Umgebung wird
in die Genehmigungs-/Audit-Metadaten des Gateways aufgenommen und an Ausführungsanfragen
des Node-Hosts weitergeleitet.

### Persistierung von Toolergebnissen

Toolergebnisse können strukturierte `details` für UI-Darstellung, Diagnose,
Medienrouting oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeitmetadaten,
nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor der erneuten Wiedergabe beim Provider und der Compaction-
  Eingabe, damit Metadaten nicht Teil des Modellkontexts werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Übermäßig große Details werden
  durch eine kompakte Zusammenfassung und `persistedDetailsTruncated: true` ersetzt.
- `tool_result_persist` und `before_message_write` werden vor der endgültigen
  Persistierungsbegrenzung ausgeführt. Halten Sie zurückgegebene `details` klein und legen Sie
  Prompt-relevanten Text nicht ausschließlich in `details` ab; legen Sie die für das Modell sichtbare Toolausgabe in
  `content` ab.

## Prompt- und Modell-Hooks

Verwenden Sie für neue Plugins die phasenspezifischen Hooks:

- `before_model_resolve`: empfängt nur den aktuellen Prompt und die Metadaten
  der Anhänge. Geben Sie `providerOverride` oder `modelOverride` zurück.
- `agent_turn_prepare`: empfängt den aktuellen Prompt, vorbereitete Sitzungsnachrichten
  und alle für diese Sitzung entnommenen, genau einmal einzufügenden Elemente aus der Warteschlange.
  Geben Sie `prependContext` oder `appendContext` zurück.
- `before_prompt_build`: empfängt den aktuellen Prompt und die Sitzungsnachrichten.
  Geben Sie `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` oder `appendSystemContext` zurück.
- `heartbeat_prompt_contribution`: wird nur bei Heartbeat-Durchläufen ausgeführt und gibt
  `prependContext` oder `appendContext` zurück. Vorgesehen für Hintergrundmonitore, die
  den aktuellen Zustand zusammenfassen müssen, ohne vom Benutzer initiierte Durchläufe zu ändern.

`before_agent_run` wird nach der Prompt-Erstellung und vor jeglicher Modelleingabe ausgeführt,
einschließlich des Ladens Prompt-lokaler Bilder und der Beobachtung durch `llm_input`. Der Hook empfängt
die aktuelle Benutzereingabe als `prompt`, zusätzlich den geladenen Sitzungsverlauf in `messages`
und den aktiven System-Prompt. Geben Sie `{ outcome: "block", reason, message? }`
zurück, um den Durchlauf zu stoppen, bevor das Modell den Prompt liest. `reason` ist intern;
`message` ist der für Benutzer sichtbare Ersatz. Es werden nur die Ergebnisse `pass` und `block`
unterstützt; nicht unterstützte Entscheidungsformen führen zu einem sicheren Abbruch.

Wenn ein Durchlauf blockiert wird, speichert OpenClaw nur den Ersatztext in
`message.content` sowie nicht sensible Blockierungsmetadaten wie die ID des blockierenden
Plugins und den Zeitstempel. Der ursprüngliche Benutzertext wird weder im Transkript
noch im zukünftigen Kontext aufbewahrt. Interne Blockierungsgründe werden als sensibel behandelt und
aus Transkript-, Verlaufs-, Broadcast-, Protokoll- und Diagnosenutzdaten
ausgeschlossen. Für die Beobachtbarkeit sollten bereinigte Felder wie die ID des Blockierers, das Ergebnis,
der Zeitstempel oder eine sichere Kategorie verwendet werden.

Hooks für Agentendurchläufe einschließlich `agent_end` enthalten `event.runId`, wenn OpenClaw
den aktiven Durchlauf identifizieren kann; derselbe Wert befindet sich auch in `ctx.runId`. Cron-gesteuerte
Durchläufe stellen außerdem `ctx.jobId` (die ID des auslösenden Cron-Jobs) im Kontext des Agentendurchlaufs
bereit, sodass Hooks Metriken, Nebeneffekte oder Zustände auf einen bestimmten
geplanten Job begrenzen können. `ctx.jobId` ist nicht Teil des `before_tool_call`-Toolkontexts.

Bei von Kanälen stammenden Durchläufen identifizieren `ctx.channel` und `ctx.messageProvider`
die Provider-Oberfläche wie `discord` oder `telegram`, während `ctx.channelId`
die Zielkennung der Unterhaltung ist, wenn OpenClaw sie aus dem
Sitzungsschlüssel oder den Zustellungsmetadaten ableiten kann.

Wenn die Absenderidentität verfügbar ist, enthalten Agent-Hook-Kontexte außerdem:

- `ctx.senderId` – kanalbezogene Absender-ID (z. B. Feishu `open_id`, Discord-
  Benutzer-ID). Wird ausgefüllt, wenn der Durchlauf von einer Benutzernachricht mit bekannten
  Absendermetadaten stammt.
- `ctx.chatId` – transportnative Unterhaltungskennung (z. B. Feishu
  `chat_id`, Telegram `chat_id`). Wird ausgefüllt, wenn der Ursprungskanal
  eine native Unterhaltungs-ID bereitstellt.
- `ctx.channelContext.sender.id` – dieselbe Absender-ID wie `ctx.senderId`, unter
  einem kanaleigenen Objekt, das Plugins um kanalspezifische Felder erweitern können.
- `ctx.channelContext.chat.id` – dieselbe Unterhaltungs-ID wie `ctx.chatId`,
  unter einem kanaleigenen Objekt, das Plugins um kanalspezifische
  Felder erweitern können.

Der Core definiert nur die verschachtelten `id`-Felder. Kanal-Plugins, die umfangreichere
Absender- oder Chat-Metadaten über den Hilfsmechanismus für eingehende Nachrichten übergeben, können
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

Kanal-Plugins übergeben diese Felder über den eingehenden SDK-Hilfsmechanismus:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Diese Felder sind optional und bei systemseitig ausgelösten Durchläufen (Heartbeat,
Cron, Exec-Ereignis) nicht vorhanden.

`ctx.senderExternalId` bleibt als veraltetes Feld zur Quellkompatibilität für
ältere Plugins bestehen. Der Core füllt es nicht aus; neue kanalspezifische
Absenderidentitäten sollten über Modulerweiterung unter `ctx.channelContext.sender`
abgelegt werden.

`agent_end` ist ein Beobachtungs-Hook. Gateway- und persistente Harness-Pfade führen
ihn nach dem Durchlauf im Fire-and-Forget-Modus aus, während kurzlebige einmalige CLI-Pfade
vor der Prozessbereinigung auf das Hook-Promise warten, damit vertrauenswürdige Plugins
terminale Beobachtbarkeitsdaten schreiben oder Zustände erfassen können. Der Hook-Runner wendet ein Zeitlimit von 30 Sekunden
an, damit ein hängendes Plugin oder ein hängender Embedding-Endpunkt das Hook-Promise nicht
für immer ausstehend lassen kann. Eine Zeitüberschreitung wird protokolliert und OpenClaw fährt fort; sie
bricht Plugin-eigene Netzwerkarbeit nicht ab, sofern das Plugin nicht zusätzlich sein eigenes Abbruchsignal
verwendet.

Verwenden Sie `model_call_started` und `model_call_ended` für Telemetrie zu Provider-Aufrufen,
die keine Roh-Prompts, Verläufe, Antworten, Header, Anfragetexte
oder Provider-Anfrage-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminale
`durationMs`/`outcome` und `upstreamRequestIdHash`, wenn OpenClaw einen
begrenzten Hash der Provider-Anfrage-ID ableiten kann. Wenn die Laufzeit
Metadaten zum Kontextfenster aufgelöst hat, enthalten das Hook-Ereignis und der Kontext außerdem
`contextTokenBudget`, das effektive Token-Budget nach Modell-/Konfigurations-/Agenten-
Begrenzungen, sowie `contextWindowSource` und `contextWindowReferenceTokens`, wenn eine
niedrigere Begrenzung angewendet wurde.

`before_agent_finalize` wird nur ausgeführt, wenn ein Harness kurz davor steht, eine natürliche
endgültige Assistentenantwort zu akzeptieren. Dies ist nicht der Abbruchpfad `/stop` und der Hook wird nicht
ausgeführt, wenn der Benutzer einen Durchlauf abbricht. Geben Sie `{ action: "revise", reason }` zurück, um
vom Harness vor der Finalisierung einen weiteren Modelldurchlauf anzufordern, `{ action:
"finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis aus, um fortzufahren.
Handler haben standardmäßig ein Budget von 15s; bei einer Zeitüberschreitung protokolliert OpenClaw den Fehler und
fährt mit der ursprünglichen endgültigen Antwort fort.
Native Codex-Hooks vom Typ `Stop` werden als OpenClaw-
Entscheidungen vom Typ `before_agent_finalize` an diesen Hook weitergeleitet.

Bei der Rückgabe von `action: "revise"` können Plugins `retry`-Metadaten einfügen, um
den zusätzlichen Modelldurchlauf zu begrenzen und wiederholungssicher zu machen:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` wird an den an das Harness gesendeten Überarbeitungsgrund angehängt.
`idempotencyKey` ermöglicht dem Host, Wiederholungsversuche für dieselbe Plugin-Anfrage
über gleichwertige Finalisierungsentscheidungen hinweg zu zählen, und `maxAttempts` begrenzt, wie viele zusätzliche
Durchläufe der Host zulässt, bevor er mit der natürlichen endgültigen Antwort fortfährt.

Nicht gebündelte Plugins, die Hooks für rohe Unterhaltungen benötigen (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` oder `before_agent_run`), müssen Folgendes festlegen:

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

Prompt-verändernde Hooks und dauerhafte Einfügungen für den nächsten Durchlauf können pro
Plugin mit `plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

### Sitzungserweiterungen und Einfügungen für den nächsten Durchlauf

Workflow-Plugins können mit `api.session.state.registerSessionExtension(...)` kleine JSON-kompatible Sitzungszustände
persistieren und sie über die Gateway-Methode
`sessions.pluginPatch` aktualisieren. Sitzungszeilen projizieren den registrierten
Erweiterungszustand über `pluginExtensions`, sodass die Control UI und andere
Clients Plugin-eigenen Status darstellen können, ohne die Plugin-Interna zu kennen.
`api.registerSessionExtension(...)` funktioniert weiterhin, ist jedoch zugunsten des
`api.session.state`-Namensraums veraltet.

Verwenden Sie `api.session.workflow.enqueueNextTurnInjection(...)`, wenn ein Plugin
dauerhaften Kontext benötigt, der den nächsten Modelldurchlauf genau einmal erreicht (das übergeordnete
`api.enqueueNextTurnInjection(...)` ist ein veralteter Alias mit demselben
Verhalten). OpenClaw entnimmt Einfügungen aus der Warteschlange vor den Prompt-Hooks, verwirft
abgelaufene Einfügungen und dedupliziert pro Plugin anhand von `idempotencyKey`. Dies ist
die richtige Schnittstelle für die Fortsetzung nach Genehmigungen, Richtlinienzusammenfassungen, Deltas von Hintergrundmonitoren
und Befehlsfortsetzungen, die beim nächsten Durchlauf für das Modell sichtbar sein sollen,
aber nicht zu dauerhaftem System-Prompt-Text werden sollen.

Die Bereinigungssemantik ist Teil des Vertrags. Bereinigungs-Callbacks für Sitzungserweiterungen und
den Laufzeitlebenszyklus empfangen `reset`, `delete`, `disable` oder
`restart`. Der Host entfernt bei Zurücksetzung/Löschung/Deaktivierung den persistenten
Sitzungserweiterungszustand und ausstehende Einfügungen für den nächsten Durchlauf des besitzenden Plugins; bei einem Neustart
bleibt der dauerhafte Sitzungszustand erhalten, während Bereinigungs-Callbacks Plugins ermöglichen,
Scheduler-Jobs, Laufkontext und andere außerhalb des normalen Ablaufs liegende Ressourcen der alten
Laufzeitgeneration freizugeben.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing und Zustellungsrichtlinien auf Kanalebene:

- `message_received`: beobachtet eingehenden Inhalt, Absender, `threadId`,
  `messageId`, `senderId`, optionale Lauf-/Sitzungskorrelation und Metadaten.
- `message_sending`: schreibt `content` um oder gibt `{ cancel: true }` zurück.
- `reply_payload_sending`: schreibt normalisierte `ReplyPayload`-Objekte
  (einschließlich `presentation`, `delivery`, Medienreferenzen und Text) um oder gibt
  `{ cancel: true }` zurück.
- `message_sent`: beobachtet den endgültigen Erfolg oder Fehler.

Bei reinen Audio-TTS-Antworten kann `content` das verborgene gesprochene
Transkript enthalten, selbst wenn die Kanalnutzdaten keinen sichtbaren Text bzw. keine sichtbare Beschriftung enthalten.
Das Umschreiben dieses `content` aktualisiert nur das für den Hook sichtbare Transkript; es wird nicht
als Medienbeschriftung dargestellt.

`reply_payload_sending`-Ereignisse können `usageState` enthalten, eine nach bestem Bemühen bereitgestellte aktuelle
Momentaufnahme von Modell, Nutzung und Kontext pro Durchlauf. Dauerhafte Zustellung, wiederhergestellte erneute Wiedergabe und
Antworten ohne exakte Laufkorrelation enthalten sie nicht.

Message-Hook-Kontexte stellen stabile Korrelationsfelder bereit, sofern verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Eingehende
und `before_dispatch`-Kontexte stellen außerdem Antwortmetadaten bereit, wenn der Kanal
über sichtbarkeitsgefilterte Daten zitierter Nachrichten verfügt: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` und `replyToIsQuote`. Bevorzugen Sie diese
erstklassigen Felder, bevor Sie Legacy-Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie kanalspezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist endgültig.
- `message_sending` mit `cancel: false` wird als keine Entscheidung behandelt.
- Ein umgeschriebenes `content` wird an Hooks mit niedrigerer Priorität weitergegeben, sofern ein späterer Hook
  die Zustellung nicht abbricht.
- `reply_payload_sending` wird nach der Payload-Normalisierung und vor der Kanalzustellung
  ausgeführt, einschließlich Antworten, die an den ursprünglichen Kanal zurückgeleitet werden.
  Handler werden sequenziell ausgeführt, und jeder Handler sieht die neueste Payload, die
  von Handlern mit höherer Priorität erzeugt wurde.
- `reply_payload_sending`-Payloads stellen keine Laufzeit-Vertrauensmarkierungen wie
  `trustedLocalMedia` bereit; Plugins können die Payload-Struktur bearbeiten, aber kein Vertrauen für lokale
  Medien gewähren.
- `message_sending` kann `cancelReason` und begrenzte `metadata` zusammen mit einem
  Abbruch zurückgeben. Neue APIs für den Nachrichtenlebenszyklus stellen dies als unterdrücktes
  Zustellungsergebnis mit dem Grund `cancelled_by_message_sending_hook` dar; die direkte Legacy-Zustellung
  gibt aus Kompatibilitätsgründen weiterhin ein leeres Ergebnis-Array zurück.
- `message_sent` dient ausschließlich der Beobachtung. Handler-Fehler werden protokolliert und ändern
  das Zustellungsergebnis nicht.

## Installations-Hooks

Verwenden Sie `security.installPolicy` für vom Betreiber verwaltete Zulassungs-/Blockierungsentscheidungen. Diese
Richtlinie wird über die OpenClaw-Konfiguration ausgeführt, gilt für CLI-Installations- und Aktualisierungspfade und
schlägt bei aktivierter, aber nicht verfügbarer Richtlinie geschlossen fehl.

`before_install` ist ein Lebenszyklus-Hook der Plugin-Laufzeit. Er wird nach
`security.installPolicy` nur in dem OpenClaw-Prozess ausgeführt, in dem Plugin-Hooks
bereits geladen wurden, beispielsweise bei Gateway-gestützten Installationsabläufen. Er eignet sich für
Plugin-eigene Beobachtungen, Warnungen und Kompatibilitätsprüfungen, ist jedoch nicht
die primäre Sicherheitsgrenze für Unternehmen oder Hosts bei Installationen. Das Feld
`builtinScan` bleibt aus Kompatibilitätsgründen in der Ereignis-Payload erhalten, aber
OpenClaw führt keine integrierte Blockierung gefährlichen Codes zur Installationszeit mehr aus, daher
ist es ein leeres `ok`-Ergebnis. Geben Sie zusätzliche Befunde oder
`{ block: true, blockReason }` zurück, um die Installation in diesem Prozess zu stoppen.

`block: true` ist endgültig. `block: false` wird als keine Entscheidung behandelt. Handler-
Fehler blockieren die Installation nach dem Fail-Closed-Prinzip.

## Gateway-Lebenszyklus

Verwenden Sie `gateway_start`, um allgemeine Plugin-Dienste zu starten, und `gateway_stop`, um
langlebige Ressourcen zu bereinigen. Der Cron-Scheduler kann noch geladen werden, wenn
`gateway_start` ausgeführt wird; verwenden Sie ihn daher nicht als Basissignal für eine externe
Cron-Projektion.

Verlassen Sie sich für Plugin-eigene Laufzeitdienste nicht auf den internen Hook
`gateway:startup`.

`cron_reconciled` wird ausgelöst, nachdem der Cron-Scheduler des Gateways und seine Beim-Beenden-
Watcher ihren dauerhaften Zustand abgeglichen haben. Er wird sowohl beim erstmaligen
Start als auch beim Austausch des Schedulers während eines Konfigurations-Neuladens ausgelöst. Das Ereignis meldet
`reason` (`startup` oder `reload`) und den effektiven Zustand `enabled`. Deaktiviertes
Cron löst das Ereignis dennoch mit `enabled: false` aus, sodass eine externe Projektion
veraltete Weckzeiten löschen kann. Verwenden Sie `ctx.getCron?.()` für genau die Scheduler-Instanz, die
den Abgleich abgeschlossen hat; ein späteres Neuladen leitet diesen Callback nicht auf eine andere Instanz um.
`ctx.abortSignal` besitzt denselben Scheduler-Snapshot. Das Gateway bricht ihn ab,
sobald ein neuerer Scheduler aktiviert wird oder das Herunterfahren beginnt. Reichen Sie ihn durch jeden
dauerhaften Nebeneffekt weiter und akzeptieren Sie den Snapshot nicht mehr, nachdem er abgebrochen wurde.
Dies ist ein Scheduler-Lebenszyklussignal, kein Plugin-Aktivierungssignal: Ein
reines Plugin-Hot-Reload löst es nicht erneut aus. Ein neu aktivierter Verbraucher erhält
seine erste Basislinie beim nächsten Scheduler-Austausch oder Gateway-Start.

Wie bei anderen Beobachtungs-Hooks können sich die Callbacks `gateway_start` und `cron_reconciled`
überschneiden. Wenn beide Handler dieselbe Plugin-Initialisierung verwenden, koordinieren Sie sie
mit einem Plugin-lokalen Bereitschafts-Promise, statt sich auf die Callback-Reihenfolge zu verlassen.

`cron_changed` wird für Gateway-eigene Cron-Lebenszyklusereignisse mit einer typisierten
Ereignis-Payload ausgelöst, die die Gründe `added`, `updated`, `removed`, `started`, `finished`
und `scheduled` abdeckt. Das Ereignis enthält einen `PluginHookGatewayCronJob`-
Snapshot (einschließlich `state.nextRunAtMs`, `state.lastRunStatus` und
`state.lastError`, sofern vorhanden) sowie einen `PluginHookGatewayCronDeliveryStatus`
vom Typ `not-requested` | `delivered` | `not-delivered` | `unknown`. Entfernungsereignisse
werden nach dem Commit ausgelöst: Sie werden erst ausgelöst, nachdem die dauerhafte Löschung erfolgreich war, und enthalten weiterhin
den Snapshot des gelöschten Jobs, damit externe Scheduler den Zustand abgleichen können.

Ein `scheduled`-Ereignis wird nach dem Commit ausgelöst: Es wird nur ausgelöst, nachdem ein erfolgreicher dauerhafter
Schreibvorgang das effektive `nextRunAtMs` eines vorhandenen Jobs geändert hat, ausgenommen das explizite
Lebenszyklusereignis `added`, `updated` oder `removed` dieses Jobs. Das übergeordnete
`event.nextRunAtMs` ist die bestätigte nächste Weckzeit; wenn es fehlt, hat der Job
keine nächste Weckzeit. Behandeln Sie diese Ereignisse als Hinweise für den Abgleich, nicht als geordnetes Delta-
Protokoll. Verwenden Sie sie als zusammenfassbare Hinweise, um den zuletzt von
`cron_reconciled` erfassten Scheduler erneut zu lesen; übernehmen Sie den Scheduler nicht aus einem `cron_changed`-Kontext.
OpenClaw bleibt die maßgebliche Quelle für Fälligkeitsprüfungen und Ausführung.

### Sichere externe Cron-Projektion

Projizieren Sie einen vollständigen Weckzeit-Snapshot, statt Cron-Ereignisdeltas weiterzuleiten. Die
Operation `replaceAll` des externen Adapters muss atomar und idempotent sein und darf
erst abgeschlossen werden, nachdem der Host den Snapshot dauerhaft akzeptiert hat. Sie muss
auch das bereitgestellte Abbruchsignal berücksichtigen: Wenn das Signal vor der dauerhaften
Akzeptanz abgebrochen wird, darf der Adapter diesen Snapshot nicht akzeptieren.

Dieses Muster lässt jeweils nur einen Worker für den neuesten Zustand aktiv. Nur `cron_reconciled`
übernimmt eine Scheduler-Instanz; `cron_changed` fordert diesen Worker lediglich auf, die
maßgebliche Instanz erneut zu lesen, sodass ein verspäteter Hinweis keinen älteren Scheduler wiederherstellen kann.
Eine neuere Revision bricht den aktiven Host-Versuch ab, bevor dieser einen veralteten
Snapshot akzeptieren kann.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`externe Cron-Projektion fehlgeschlagen; erneuter Versuch in ${retryMs} ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("Cron-Abgleich hat keinen Scheduler bereitgestellt");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Wenn `cron_reconciled` den Wert `enabled: false` meldet, ruft derselbe Pfad
`replaceAll([])` auf und löscht veraltete externe Weckzeiten. Wiederholungsversuche/Backoff sind in diesem Beispiel
prozesslokal und behandeln Fehler des Laufzeitadapters als vorübergehend; validieren Sie
nicht wiederholbare Konfigurationsfehler vor der Registrierung. OpenClaw stellt keine
Outbox für Auswirkungen von Plugin-Hooks bereit. Wenn der Prozess vor der dauerhaften Akzeptanz beendet wird,
gibt der nächste Gateway-Start einen neuen maßgeblichen `cron_reconciled`-Snapshot aus.
`gateway_stop` bricht laufende Host-Arbeit ab, wartet auf den Abschluss des Workers und
schließt anschließend den Adapter.

## Bevorstehende Veraltungen

Einige Hook-nahe Oberflächen sind veraltet, werden aber weiterhin unterstützt. Migrieren Sie
vor der nächsten Hauptversion:

- **Klartext-Channel-Umschläge** in den Handlern `inbound_claim` und `message_received`.
  Lesen Sie `BodyForAgent` und die strukturierten Benutzerkontextblöcke,
  anstatt flachen Umschlagtext zu parsen. Siehe
  [Klartext-Channel-Umschläge → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`subagent_spawning`** bleibt zur Kompatibilität mit älteren Plugins bestehen, neue
  Plugins sollten darüber jedoch kein Thread-Routing zurückgeben. Der Core bereitet
  `thread: true`-Subagent-Bindungen über Adapter für die Channel-Sitzungsbindung vor,
  bevor `subagent_spawned` ausgelöst wird.
- **`deactivate`** bleibt bis nach dem 2026-08-16 als veralteter
  Kompatibilitätsalias für die Bereinigung bestehen. Neue Plugins sollten `gateway_stop` verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt die typisierte
  `PluginApprovalResolution`-Union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) anstelle eines frei formulierten `string`.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** bleiben
  als Kompatibilitätsaliase auf oberster Ebene bestehen. Neue Plugins sollten
  `api.session.state.registerSessionExtension(...)` und
  `api.session.workflow.enqueueNextTurnInjection(...)` verwenden.

Die vollständige Liste – Registrierung der Speicherfunktion, Thinking-Profil
des Providers, externe Authentifizierungs-Provider, Typen für die Provider-Erkennung, Zugriffsmethoden
der Task-Laufzeit und die Umbenennung von `command-auth` → `command-status` – finden Sie unter
[Plugin-SDK-Migration → Aktive veraltete Funktionen](/de/plugins/sdk-migration#active-deprecations).

## Verwandte Themen

- [Plugin-SDK-Migration](/de/plugins/sdk-migration) – aktive veraltete Funktionen und Zeitplan für die Entfernung
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Interna der Plugin-Architektur](/de/plugins/architecture-internals)
