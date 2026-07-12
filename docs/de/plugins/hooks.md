---
read_when:
    - Sie entwickeln ein Plugin, das `before_tool_call`, `before_agent_reply`, Nachrichten-Hooks oder Lifecycle-Hooks benötigt.
    - Sie müssen Tool-Aufrufe eines Plugins blockieren, umschreiben oder genehmigungspflichtig machen.
    - Sie entscheiden zwischen internen Hooks und Plugin-Hooks
    - Sie übertragen OpenClaw-Cron-Aufrufe in einen externen Host-Scheduler.
summary: 'Plugin-Hooks: Agenten-, Tool-, Nachrichten-, Sitzungs- und Gateway-Lebenszyklusereignisse abfangen'
title: Plugin-Hooks
x-i18n:
    generated_at: "2026-07-12T15:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin-Hooks sind prozessinterne Erweiterungspunkte für OpenClaw-Plugins: Sie können Agent-Ausführungen, Tool-Aufrufe, den Nachrichtenfluss, den Sitzungslebenszyklus, das Subagent-Routing, Installationen oder den Gateway-Start prüfen oder ändern.

Verwenden Sie stattdessen [interne Hooks](/de/automation/hooks), wenn Sie ein kleines, vom Betreiber installiertes `HOOK.md`-Skript benötigen, das auf Befehls- und Gateway-Ereignisse wie `/new`, `/reset`, `/stop`, `agent:bootstrap` oder `gateway:startup` reagiert.

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

Handler, die Entscheidungen oder Änderungen zurückgeben können, werden sequenziell in absteigender Reihenfolge ihrer `priority` ausgeführt; Handler mit gleicher Priorität behalten ihre Registrierungsreihenfolge bei. Reine Beobachtungs-Handler werden parallel ausgeführt, und nach dem Fire-and-Forget-Prinzip ausgelöste Beobachtungen können sich mit späteren Ereignissen überschneiden. Verwenden Sie die Priorität nicht, um Nebenwirkungen von Beobachtungen zu ordnen.

`api.on(name, handler, opts?)` akzeptiert:

| Option      | Wirkung                                                                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Reihenfolge; höhere Werte werden zuerst ausgeführt.                                                                                                                                                                              |
| `timeoutMs` | Wartezeitbudget pro Hook. Nach dessen Ablauf wartet OpenClaw nicht länger auf diesen Handler und fährt fort. Der Handler oder seine Nebenwirkungen werden dadurch nicht abgebrochen. Lassen Sie die Option weg, um das standardmäßige Zeitlimit des Runners pro Hook zu verwenden. |

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

`hooks.timeouts.<hookName>` überschreibt `hooks.timeoutMs`, das wiederum den vom Plugin festgelegten Wert `api.on(..., { timeoutMs })` überschreibt. Jeder Wert muss eine positive Ganzzahl bis 600000 ms sein. Verwenden Sie für bekanntermaßen langsame Hooks vorzugsweise Hook-spezifische Überschreibungen, damit ein Plugin nicht überall ein längeres Budget erhält.

Das Promise eines Handlers, dessen Zeitlimit überschritten wurde, wird weiter ausgeführt, da Hook-Callbacks kein Abbruchsignal erhalten. Die Hook-Ausführung kann ihre Gateway-Zulassung freigeben, während die Arbeit dieses Plugins noch läuft. Plugins, die lang laufende Aufgaben verwalten, müssen einen eigenen Abbruch- und Beendigungslebenszyklus bereitstellen.

Die ausgehenden modifizierenden Hooks `message_sending` und `reply_payload_sending` verwenden standardmäßig 15 Sekunden pro Handler. Wird bei einem Handler das Zeitlimit überschritten, protokolliert OpenClaw den Plugin-Fehler und fährt mit der neuesten Nutzlast fort, damit die serialisierte Zustellspur abgeschlossen werden kann. Legen Sie für Plugins, die vor der Zustellung absichtlich langsamere Arbeiten ausführen, ein größeres Hook-spezifisches Budget fest.

Channel-Plugins, die `createReplyDispatcher` verwenden, können ebenso ein größeres positives Budget pro Stufe mit `beforeDeliverOptions: { timeoutMs }` angeben oder beim Anhängen von Arbeit `dispatcher.appendBeforeDeliver(handler, { timeoutMs })` verwenden. Ohne ein vom zuständigen Eigentümer festgelegtes Budget verwenden diese Callbacks ebenfalls den Standardwert von 15 Sekunden, damit ein hängender Callback die serialisierte Zustellspur nicht blockieren kann.

Jeder Hook erhält `event.context.pluginConfig`, die aufgelöste Konfiguration für das Plugin, das diesen Handler registriert hat. OpenClaw fügt sie für jeden Handler ein, ohne das gemeinsam genutzte Ereignisobjekt zu verändern, das andere Plugins sehen.

## Hook-Katalog

Hooks sind nach dem Bereich gruppiert, den sie erweitern. **Fettgedruckte** Namen akzeptieren ein Entscheidungsergebnis (blockieren, abbrechen, überschreiben oder Genehmigung anfordern); die übrigen dienen nur der Beobachtung.

**Agent-Durchlauf**

| Hook                            | Zweck                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Provider oder Modell überschreiben, bevor Sitzungsnachrichten geladen werden                                                |
| `agent_turn_prepare`            | In die Warteschlange gestellte Plugin-Einspeisungen für den Durchlauf verarbeiten und vor Prompt-Hooks Kontext für denselben Durchlauf hinzufügen |
| `before_prompt_build`           | Vor dem Modellaufruf dynamischen Kontext oder Text für den System-Prompt hinzufügen                                         |
| `before_agent_start`            | Kombinierte Phase ausschließlich zur Kompatibilität; bevorzugen Sie die beiden obigen Hooks                                 |
| **`before_agent_run`**          | Den endgültigen Prompt und die Sitzungsnachrichten vor der Übermittlung an das Modell prüfen; kann die Ausführung blockieren |
| **`before_agent_reply`**        | Den Modelldurchlauf mit einer synthetischen Antwort oder ohne Ausgabe vorzeitig beenden                                     |
| **`before_agent_finalize`**     | Die natürliche endgültige Antwort prüfen und einen weiteren Modelldurchlauf anfordern                                       |
| `agent_end`                     | Endgültige Nachrichten, Erfolgsstatus und Ausführungsdauer beobachten                                                       |
| `heartbeat_prompt_contribution` | Nur für den Heartbeat bestimmten Kontext für Hintergrundüberwachungs- und Lebenszyklus-Plugins hinzufügen                   |

**Konversationsbeobachtung**

| Hook                                      | Zweck                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `model_call_started` / `model_call_ended` | Bereinigte Metadaten des Provider-/Modellaufrufs: Zeitmessung, Ergebnis und begrenzte Hashes der Anfrage-ID. Keine Prompt- oder Antwortinhalte. |
| `llm_input`                               | Provider-Eingabe: System-Prompt, Prompt, Verlauf                                                                                            |
| `llm_output`                              | Provider-Ausgabe, Nutzung und das aufgelöste `contextTokenBudget`, sofern verfügbar                                                         |

**Tools**

| Hook                       | Zweck                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **`before_tool_call`**     | Tool-Parameter umschreiben, Ausführung blockieren oder Genehmigung anfordern                 |
| `after_tool_call`          | Tool-Ergebnisse, Fehler und Dauer beobachten                                                 |
| `resolve_exec_env`         | Plugin-eigene Umgebungsvariablen zu `exec` beitragen                                         |
| **`tool_result_persist`**  | Die aus einem Tool-Ergebnis erzeugte Assistentennachricht umschreiben                        |
| **`before_message_write`** | Einen laufenden Schreibvorgang für eine Nachricht prüfen oder blockieren (selten)             |

**Nachrichten und Zustellung**

| Hook                            | Zweck                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| **`inbound_claim`**             | Eine eingehende Nachricht vor dem Agent-Routing übernehmen (synthetische Antworten)            |
| **`channel_pairing_requested`** | Neu erstellte Kopplungsanfragen für Direktnachrichten beobachten                               |
| `message_received`              | Eingehenden Inhalt, Absender, Thread und Metadaten beobachten                                  |
| **`message_sending`**           | Ausgehenden Inhalt umschreiben oder die Zustellung abbrechen                                   |
| **`reply_payload_sending`**     | Normalisierte Antwortnutzlasten vor der Zustellung ändern oder abbrechen                       |
| `message_sent`                  | Erfolg oder Fehlschlag der ausgehenden Zustellung beobachten                                  |
| **`before_dispatch`**           | Einen ausgehenden Versand vor der Übergabe an den Channel prüfen oder umschreiben              |
| **`reply_dispatch`**            | An der abschließenden Pipeline für den Antwortversand teilnehmen                               |

**Sitzungen und Compaction**

| Hook                                     | Zweck                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Grenzen des Sitzungslebenszyklus verfolgen. `reason` ist einer der Werte `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` oder `unknown`. `shutdown`/`restart` werden vom Finalisierer für die Gateway-Beendigung ausgelöst, wenn der Prozess mit aktiven Sitzungen beendet oder neu gestartet wird. Dadurch können Plugins (Speicher, Transkriptspeicher) verwaiste Zeilen abschließen, statt sie über Neustarts hinweg geöffnet zu lassen. Der Finalisierer ist zeitlich begrenzt, damit ein langsames Plugin SIGTERM/SIGINT nicht blockieren kann. |
| `before_compaction` / `after_compaction` | Compaction-Zyklen beobachten oder mit Anmerkungen versehen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `before_reset`                           | Ereignisse zum Zurücksetzen von Sitzungen beobachten (`/reset`, programmgesteuerte Zurücksetzungen)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**Subagents**

- `subagent_spawned` / `subagent_ended` – Start und Abschluss von Subagents beobachten.
- `subagent_delivery_target` – Kompatibilitäts-Hook für die Zustellung nach Abschluss, wenn keine Kernsitzungsbindung eine Route projizieren kann.
- `subagent_spawning` – veralteter Kompatibilitäts-Hook. Der Kern bereitet jetzt `thread: true`-Subagent-Bindungen über Adapter für Channel-Sitzungsbindungen vor, bevor `subagent_spawned` ausgelöst wird.
- `subagent_spawned` enthält `resolvedModel` und `resolvedProvider`, wenn OpenClaw das native Modell der untergeordneten Sitzung vor dem Start aufgelöst hat.
- `subagent_ended` übermittelt `targetSessionKey` (Identität – entspricht `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` oder `"acp"`), `reason`, optional `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` oder `"deleted"`), optional `error`, `runId`, `endedAt`, `accountId` und `sendFarewell`. Es enthält **nicht** `agentId` oder `childSessionKey`; verwenden Sie `targetSessionKey`, um die Zuordnung zum entsprechenden `subagent_spawned`-Ereignis herzustellen.

**Lebenszyklus**

| Hook                             | Zweck                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Plugin-eigene Dienste zusammen mit dem Gateway starten oder stoppen                                                    |
| `deactivate`                     | Veralteter Kompatibilitätsalias für `gateway_stop`; verwenden Sie in neuen Plugins `gateway_stop`                     |
| `cron_reconciled`                | Nach dem Start oder Neuladen mit dem vollständigen Cron-Status des Gateways abgleichen                                 |
| `cron_changed`                   | Änderungen am Gateway-eigenen Cron-Lebenszyklus beobachten (hinzugefügt, aktualisiert, entfernt, gestartet, beendet, geplant) |
| **`before_install`**             | Bereitgestelltes Installationsmaterial für Skills oder Plugins aus einer geladenen Plugin-Laufzeit untersuchen         |

### Anfragen zur Kanal-Kopplung

Verwenden Sie `channel_pairing_requested`, wenn ein Plugin einen Operator benachrichtigen oder
einen Audit-Datensatz schreiben muss, nachdem ein nicht gekoppelter DM-Absender eine ausstehende
Kopplungsanfrage erstellt hat. Der Hook wird beim Erstellen der Anfrage ausgelöst; die Kanalzustellung
der Kopplungsantwort wird durch langsame oder fehlschlagende Hook-Handler nicht verzögert.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Neue ${event.channel}-Kopplungsanfrage von ${event.senderId}: ${event.code}`,
  });
});
```

Der Hook dient ausschließlich der Beobachtung. Er genehmigt, lehnt, unterdrückt oder ändert
die Kopplungsantwort nicht. Die Nutzlast enthält den Kanal, die optionale `accountId`,
die kanalbezogene `senderId`, den Kopplungs-`code` und Kanalmetadaten. Behandeln Sie den
Kopplungscode als gültige, einmalig verwendbare Genehmigungszugangsdaten und übermitteln Sie ihn nur an eine
vertrauenswürdige Operator-Senke. Behandeln Sie `metadata` als nicht vertrauenswürdigen, vom Absender bereitgestellten Identitätstext.
Der Hook enthält weder den Text noch die Medien der eingehenden Nachricht.

## Hooks zur Laufzeitdiagnose

Verwenden Sie `before_model_resolve`, um für einen Agent-Durchlauf den Provider oder das Modell zu wechseln – der Hook
wird vor der Modellauflösung ausgeführt. `llm_output` wird erst ausgeführt, nachdem ein Modellversuch
eine Assistentenausgabe erzeugt hat.

Um das tatsächlich verwendete Sitzungsmodell nachzuweisen, prüfen Sie die Laufzeitregistrierungen und
verwenden Sie anschließend `openclaw sessions` oder die Sitzungs-/Statusoberflächen des Gateways. Um
Provider-Nutzlasten zu untersuchen, starten Sie den Gateway mit `--raw-stream` und
`--raw-stream-path <path>`, damit rohe Modell-Stream-Ereignisse in eine jsonl-Datei geschrieben werden.

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
  für bekannte Tool-Umschläge wie `apply_patch`; diese Pfade können
  unvollständig sein oder mehr umfassen, als das Tool tatsächlich bearbeitet (zum
  Beispiel bei fehlerhaften oder unvollständigen Eingaben)
- optional `event.runId`
- optional `event.toolCallId`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` und das diagnostische Feld `ctx.trace`

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
    /** @deprecated Nicht aufgelöste Genehmigungen werden immer abgelehnt. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Schutzverhalten für typisierte Lebenszyklus-Hooks:

- `block: true` ist endgültig und überspringt Handler mit niedrigerer Priorität.
- `block: false` wird als keine Entscheidung behandelt.
- `params` schreibt die Tool-Parameter für die Ausführung neu.
- `requireApproval` pausiert den Agent-Durchlauf und fragt den Benutzer über Plugin-
  Genehmigungen. `/approve` kann sowohl Ausführungs- als auch Plugin-Genehmigungen erteilen. Bei nativen `PreToolUse`-Weiterleitungen
  im Berichtsmodus des Codex-App-Servers wird dies an die
  entsprechende Genehmigungsanfrage des App-Servers delegiert; siehe
  [Laufzeit des Codex-Harness](/de/plugins/codex-harness-runtime#hook-boundaries).
- Ein `block: true` mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein Hook mit höherer Priorität
  eine Genehmigung angefordert hat.
- `onResolution` empfängt die aufgelöste Entscheidung: `allow-once`, `allow-always`,
  `deny`, `timeout` oder `cancelled`.

Unter [Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests) finden Sie Informationen zur
Weiterleitung von Genehmigungen, zum Entscheidungsverhalten und dazu, wann `requireApproval` anstelle
optionaler Tools oder Ausführungsgenehmigungen verwendet werden sollte.

Plugins, die Richtlinien auf Host-Ebene benötigen, können mit
`api.registerTrustedToolPolicy(...)` vertrauenswürdige Tool-Richtlinien registrieren. Diese werden vor gewöhnlichen
`before_tool_call`-Hooks und vor normalen Hook-Entscheidungen ausgeführt. Gebündelte vertrauenswürdige
Richtlinien werden zuerst ausgeführt; vertrauenswürdige Richtlinien installierter Plugins folgen in der
Plugin-Ladereihenfolge; gewöhnliche `before_tool_call`-Hooks werden danach ausgeführt. Gebündelte Plugins behalten
den vorhandenen Pfad für vertrauenswürdige Richtlinien bei. Installierte Plugins müssen ausdrücklich aktiviert sein
und jede Richtlinien-ID in `contracts.trustedToolPolicies` deklarieren; nicht deklarierte IDs
werden vor der Registrierung abgelehnt. Richtlinien-IDs gelten im Gültigkeitsbereich des registrierenden
Plugins, sodass verschiedene Plugins dieselbe lokale ID wiederverwenden können. Verwenden Sie diese Stufe nur
für vom Host als vertrauenswürdig eingestufte Schranken, etwa Arbeitsbereichsrichtlinien, Budgetdurchsetzung oder
die Sicherheit reservierter Arbeitsabläufe.

### Hook für die Ausführungsumgebung

Mit `resolve_exec_env` können Plugins Umgebungsvariablen zu Aufrufen des
`exec`-Tools beitragen, bevor der Befehl ausgeführt wird. Der Hook empfängt:

- `event.sessionKey`
- `event.toolName`, derzeit immer `"exec"`
- `event.host`, entweder `"gateway"`, `"sandbox"` oder `"node"`
- Kontextfelder wie `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` und `ctx.channelId`

Geben Sie einen `Record<string, string>` zurück, der in die Ausführungsumgebung zusammengeführt wird. Die Handler
werden in Prioritätsreihenfolge ausgeführt; spätere Ergebnisse überschreiben frühere Ergebnisse für denselben
Schlüssel.

Die Hook-Ausgabe wird vor dem Zusammenführen anhand der Richtlinie des Hosts für Schlüssel der Ausführungsumgebung
gefiltert. `PATH` wird immer verworfen (die Befehlsauflösung und Prüfungen sicherer Binärdateien
hängen davon ab). Ungültige Schlüssel und gefährliche Host-Überschreibungsschlüssel wie `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, Proxy-Variablen (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) und TLS-Überschreibungsvariablen (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` und ähnliche) werden verworfen. Die gefilterte Plugin-Umgebung wird
in die Genehmigungs-/Audit-Metadaten des Gateways aufgenommen und an Ausführungsanfragen
des Node-Hosts weitergeleitet.

### Persistenz von Tool-Ergebnissen

Tool-Ergebnisse können strukturierte `details` für die UI-Darstellung, Diagnose,
Medienweiterleitung oder Plugin-eigene Metadaten enthalten. Behandeln Sie `details` als Laufzeitmetadaten,
nicht als Prompt-Inhalt:

- OpenClaw entfernt `toolResult.details` vor der erneuten Wiedergabe beim Provider und vor der Compaction-
  Eingabe, damit Metadaten nicht Teil des Modellkontexts werden.
- Persistierte Sitzungseinträge behalten nur begrenzte `details`. Übermäßig große Details werden
  durch eine kompakte Zusammenfassung und `persistedDetailsTruncated: true` ersetzt.
- `tool_result_persist` und `before_message_write` werden vor der endgültigen
  Persistenzbegrenzung ausgeführt. Halten Sie zurückgegebene `details` klein und vermeiden Sie es,
  Prompt-relevanten Text ausschließlich in `details` abzulegen; legen Sie für das Modell sichtbare Tool-Ausgaben in
  `content` ab.

## Prompt- und Modell-Hooks

Verwenden Sie für neue Plugins die phasenspezifischen Hooks:

- `before_model_resolve`: empfängt nur den aktuellen Prompt und die Metadaten
  der Anhänge. Geben Sie `providerOverride` oder `modelOverride` zurück.
- `agent_turn_prepare`: empfängt den aktuellen Prompt, vorbereitete Sitzungsnachrichten
  und alle für diese Sitzung abgerufenen, genau einmal eingereihten Einfügungen.
  Geben Sie `prependContext` oder `appendContext` zurück.
- `before_prompt_build`: empfängt den aktuellen Prompt und die Sitzungsnachrichten.
  Geben Sie `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` oder `appendSystemContext` zurück.
- `heartbeat_prompt_contribution`: wird nur bei Heartbeat-Durchläufen ausgeführt und gibt
  `prependContext` oder `appendContext` zurück. Vorgesehen für Hintergrundmonitore, die
  den aktuellen Status zusammenfassen müssen, ohne vom Benutzer initiierte Durchläufe zu verändern.

`before_agent_start` bleibt aus Kompatibilitätsgründen erhalten. Bevorzugen Sie die expliziten Hooks
oben, damit das Plugin nicht von einer veralteten kombinierten Phase abhängt.

`before_agent_run` wird nach der Prompt-Erstellung und vor jeder Modelleingabe ausgeführt,
einschließlich des Ladens Prompt-lokaler Bilder und der `llm_input`-Beobachtung. Der Hook empfängt
die aktuelle Benutzereingabe als `prompt`, den geladenen Sitzungsverlauf in `messages`
und den aktiven System-Prompt. Geben Sie `{ outcome: "block", reason, message? }`
zurück, um den Durchlauf zu stoppen, bevor das Modell den Prompt liest. `reason` ist intern;
`message` ist der für den Benutzer sichtbare Ersatz. Es werden nur die Ergebnisse `pass` und `block`
unterstützt; nicht unterstützte Entscheidungsformen führen zu einer sicheren Ablehnung.

Wenn ein Durchlauf blockiert wird, speichert OpenClaw nur den Ersatztext in
`message.content` sowie nicht sensible Blockierungsmetadaten wie die ID des blockierenden
Plugins und den Zeitstempel. Der ursprüngliche Benutzertext wird weder im Transkript
noch im zukünftigen Kontext beibehalten. Interne Blockierungsgründe werden als sensibel behandelt und
aus Transkript-, Verlaufs-, Broadcast-, Protokoll- und Diagnosenutzlasten
ausgeschlossen. Für die Beobachtbarkeit sollten bereinigte Felder wie Blockierer-ID, Ergebnis,
Zeitstempel oder eine sichere Kategorie verwendet werden.

`before_agent_start` und `agent_end` enthalten `event.runId`, wenn OpenClaw
den aktiven Durchlauf identifizieren kann; derselbe Wert ist auch in `ctx.runId` enthalten. Von Cron
ausgelöste Durchläufe stellen im Agent-Durchlaufkontext außerdem `ctx.jobId` (die ID des ursprünglichen Cron-Auftrags)
bereit, damit Hooks Metriken, Nebenwirkungen oder Status auf einen bestimmten
geplanten Auftrag beschränken können. `ctx.jobId` ist nicht Teil des Tool-Kontexts von `before_tool_call`.

Bei von einem Kanal stammenden Durchläufen identifizieren `ctx.channel` und `ctx.messageProvider`
die Provider-Oberfläche wie `discord` oder `telegram`, während `ctx.channelId`
die Kennung des Konversationsziels ist, sofern OpenClaw diese aus dem
Sitzungsschlüssel oder den Zustellungsmetadaten ableiten kann.

Wenn die Absenderidentität verfügbar ist, enthalten Agent-Hook-Kontexte außerdem:

- `ctx.senderId` – kanalbezogene Absender-ID (z. B. Feishu-`open_id`, Discord-
  Benutzer-ID). Wird ausgefüllt, wenn der Durchlauf aus einer Benutzernachricht mit bekannten
  Absendermetadaten stammt.
- `ctx.chatId` – transportnative Konversationskennung (z. B. Feishu-
  `chat_id`, Telegram-`chat_id`). Wird ausgefüllt, wenn der ursprüngliche Kanal
  eine native Konversations-ID bereitstellt.
- `ctx.channelContext.sender.id` – dieselbe Absender-ID wie `ctx.senderId`, unter
  einem kanaleigenen Objekt, das Plugins um kanalspezifische Felder erweitern können.
- `ctx.channelContext.chat.id` – dieselbe Konversations-ID wie `ctx.chatId`,
  unter einem kanaleigenen Objekt, das Plugins um kanalspezifische
  Felder erweitern können.

Der Kern definiert nur die verschachtelten `id`-Felder. Kanal-Plugins, die umfangreichere
Absender- oder Chat-Metadaten über die Eingangshilfsfunktion weitergeben, können
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

Kanal-Plugins geben diese Felder über die SDK-Eingangshilfsfunktion weiter:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Diese Felder sind optional und fehlen bei systemgenerierten Durchläufen (Heartbeat,
Cron, Ausführungsereignis).

`ctx.senderExternalId` bleibt als veraltetes Feld für die Quellkompatibilität mit
älteren Plugins erhalten. Der Kern füllt es nicht aus; neue kanalspezifische
Absenderidentitäten sollten durch Modulerweiterung unter `ctx.channelContext.sender`
gespeichert werden.

`agent_end` ist ein Beobachtungs-Hook. Gateway- und persistente Harness-Pfade führen
ihn nach dem Turn nach dem Fire-and-Forget-Prinzip aus, während kurzlebige einmalige CLI-Pfade
vor der Prozessbereinigung auf das Hook-Promise warten, damit vertrauenswürdige Plugins
terminale Beobachtungsdaten schreiben oder Zustand erfassen können. Der Hook-Runner wendet ein
Timeout von 30 Sekunden an, damit ein festgefahrenes Plugin oder ein nicht reagierender Embedding-Endpunkt
das Hook-Promise nicht dauerhaft ausstehend lassen kann. Ein Timeout wird protokolliert und OpenClaw
fährt fort; netzwerkbezogene Arbeit im Besitz des Plugins wird nicht abgebrochen, sofern das Plugin
nicht zusätzlich ein eigenes Abbruchsignal verwendet.

Verwenden Sie `model_call_started` und `model_call_ended` für die Telemetrie von Provider-Aufrufen,
die keine Roh-Prompts, Verläufe, Antworten, Header, Anfrage-Bodys oder
Provider-Anfrage-IDs erhalten soll. Diese Hooks enthalten stabile Metadaten wie
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminale Werte für
`durationMs`/`outcome` sowie `upstreamRequestIdHash`, wenn OpenClaw einen
begrenzten Hash der Provider-Anfrage-ID ableiten kann. Wenn die Runtime
Metadaten zum Kontextfenster aufgelöst hat, enthalten das Hook-Ereignis und der Kontext außerdem
`contextTokenBudget`, das effektive Token-Budget nach Modell-, Konfigurations- und Agent-
Obergrenzen, sowie `contextWindowSource` und `contextWindowReferenceTokens`, wenn eine
niedrigere Obergrenze angewendet wurde.

`before_agent_finalize` wird nur ausgeführt, wenn ein Harness im Begriff ist, eine natürliche
abschließende Assistentenantwort zu akzeptieren. Es ist nicht der Abbruchpfad `/stop` und wird
nicht ausgeführt, wenn der Benutzer einen Turn abbricht. Geben Sie `{ action: "revise", reason }` zurück, um
das Harness vor der Finalisierung um einen weiteren Modelldurchlauf zu bitten, `{ action:
"finalize", reason? }`, um die Finalisierung zu erzwingen, oder lassen Sie ein Ergebnis aus, um fortzufahren.
Handler haben standardmäßig ein Budget von 15s; bei einem Timeout protokolliert OpenClaw den Fehler und
fährt mit der ursprünglichen abschließenden Antwort fort.
Native Codex-Hooks vom Typ `Stop` werden als OpenClaw-
Entscheidungen für `before_agent_finalize` an diesen Hook weitergeleitet.

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
Mit `idempotencyKey` kann der Host Wiederholungen für dieselbe Plugin-Anfrage
über äquivalente Finalisierungsentscheidungen hinweg zählen, und `maxAttempts` begrenzt, wie viele zusätzliche
Durchläufe der Host zulässt, bevor er mit der natürlichen abschließenden Antwort fortfährt.

Nicht gebündelte Plugins, die Hooks für rohe Konversationen benötigen (`before_model_resolve`,
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

Prompt-verändernde Hooks und dauerhafte Einfügungen für den nächsten Turn können pro
Plugin mit `plugins.entries.<id>.hooks.allowPromptInjection=false` deaktiviert werden.

### Sitzungserweiterungen und Einfügungen für den nächsten Turn

Workflow-Plugins können kleinen JSON-kompatiblen Sitzungszustand mit
`api.session.state.registerSessionExtension(...)` persistieren und ihn über die
Gateway-Methode `sessions.pluginPatch` aktualisieren. Sitzungszeilen projizieren registrierten
Erweiterungszustand über `pluginExtensions`, sodass die Control UI und andere
Clients Status im Besitz eines Plugins darstellen können, ohne Plugin-Interna kennen zu müssen.
`api.registerSessionExtension(...)` funktioniert weiterhin, ist jedoch zugunsten des
Namensraums `api.session.state` als veraltet markiert.

Verwenden Sie `api.session.workflow.enqueueNextTurnInjection(...)`, wenn ein Plugin
dauerhaften Kontext genau einmal in den nächsten Modell-Turn übertragen muss (das oberste
`api.enqueueNextTurnInjection(...)` ist ein veralteter Alias mit demselben
Verhalten). OpenClaw entnimmt in die Warteschlange eingestellte Einfügungen vor Prompt-Hooks, verwirft
abgelaufene Einfügungen und dedupliziert pro Plugin anhand von `idempotencyKey`. Dies ist
die richtige Schnittstelle für die Fortsetzung von Genehmigungsvorgängen, Richtlinienzusammenfassungen, Änderungen
von Hintergrundmonitoren und Befehlsfortsetzungen, die für das Modell im
nächsten Turn sichtbar sein sollen, aber nicht zu dauerhaftem System-Prompt-Text werden sollen.

Die Bereinigungssemantik ist Teil des Vertrags. Bereinigungs-Callbacks für Sitzungserweiterungen und
den Runtime-Lebenszyklus erhalten `reset`, `delete`, `disable` oder
`restart`. Der Host entfernt den persistenten Sitzungserweiterungszustand des besitzenden Plugins
und ausstehende Einfügungen für den nächsten Turn bei reset/delete/disable; restart
behält dauerhaften Sitzungszustand bei, während Bereinigungs-Callbacks Plugins ermöglichen,
Scheduler-Aufträge, Ausführungskontext und andere außerhalb des regulären Ablaufs liegende Ressourcen der alten
Runtime-Generation freizugeben.

## Nachrichten-Hooks

Verwenden Sie Nachrichten-Hooks für Routing- und Zustellrichtlinien auf Kanalebene:

- `message_received`: Beobachtet eingehende Inhalte, Absender, `threadId`,
  `messageId`, `senderId`, optionale Ausführungs-/Sitzungskorrelation und Metadaten.
- `message_sending`: Schreibt `content` um oder gibt `{ cancel: true }` zurück.
- `reply_payload_sending`: Schreibt normalisierte `ReplyPayload`-Objekte um
  (einschließlich `presentation`, `delivery`, Medienreferenzen und Text) oder gibt
  `{ cancel: true }` zurück.
- `message_sent`: Beobachtet abschließenden Erfolg oder Fehlschlag.

Bei reinen Audio-TTS-Antworten kann `content` das verborgene gesprochene
Transkript enthalten, selbst wenn die Kanal-Payload keinen sichtbaren Text/keine sichtbare Beschriftung enthält.
Das Umschreiben dieses `content` aktualisiert nur das für den Hook sichtbare Transkript; es wird nicht
als Medienbeschriftung dargestellt.

`reply_payload_sending`-Ereignisse können `usageState` enthalten, eine nach bestem Bemühen live erstellte
Momentaufnahme des Modells, der Nutzung und des Kontexts pro Turn. Dauerhafte Zustellung, wiederhergestellte Wiederholung und
Antworten ohne exakte Ausführungskorrelation lassen diesen Wert aus.

Kontexte von Nachrichten-Hooks stellen stabile Korrelationsfelder bereit, sofern verfügbar:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` und `ctx.callDepth`. Eingehende
Kontexte und `before_dispatch`-Kontexte stellen außerdem Antwortmetadaten bereit, wenn der Kanal
sichtbarkeitsgefilterte Daten zitierter Nachrichten besitzt: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` und `replyToIsQuote`. Bevorzugen Sie diese
erstklassigen Felder, bevor Sie ältere Metadaten lesen.

Bevorzugen Sie typisierte Felder `threadId` und `replyToId`, bevor Sie kanalspezifische
Metadaten verwenden.

Entscheidungsregeln:

- `message_sending` mit `cancel: true` ist terminal.
- `message_sending` mit `cancel: false` wird so behandelt, als läge keine Entscheidung vor.
- Umgeschriebener `content` wird an Hooks mit niedrigerer Priorität weitergegeben, sofern nicht ein späterer Hook
  die Zustellung abbricht.
- `reply_payload_sending` wird nach der Payload-Normalisierung und vor der Kanal-
  zustellung ausgeführt, einschließlich Antworten, die an den Ursprungskanal zurückgeleitet werden.
  Handler werden sequenziell ausgeführt, und jeder Handler sieht die neueste Payload, die
  von Handlern mit höherer Priorität erzeugt wurde.
- `reply_payload_sending`-Payloads legen keine Runtime-Vertrauensmarkierungen wie
  `trustedLocalMedia` offen; Plugins können die Payload-Struktur bearbeiten, aber kein Vertrauen für lokale
  Medien gewähren.
- `message_sending` kann bei einem Abbruch `cancelReason` und begrenzte `metadata`
  zurückgeben. Neue APIs für den Nachrichtenlebenszyklus stellen dies als unterdrücktes
  Zustellergebnis mit dem Grund `cancelled_by_message_sending_hook` bereit; die ältere
  direkte Zustellung gibt aus Kompatibilitätsgründen weiterhin ein leeres Ergebnisarray zurück.
- `message_sent` dient nur der Beobachtung. Fehler von Handlern werden protokolliert und
  ändern das Zustellergebnis nicht.

## Installations-Hooks

Verwenden Sie `security.installPolicy` für vom Betreiber verwaltete Zulassungs-/Blockierungsentscheidungen. Diese
Richtlinie wird aus der OpenClaw-Konfiguration ausgeführt, deckt CLI-Installations- und Aktualisierungspfade ab und
schlägt im aktivierten, aber nicht verfügbaren Zustand geschlossen fehl.

`before_install` ist ein Lebenszyklus-Hook der Plugin-Runtime. Er wird nur nach
`security.installPolicy` in dem OpenClaw-Prozess ausgeführt, in dem Plugin-Hooks bereits
geladen wurden, beispielsweise bei Gateway-gestützten Installationsabläufen. Er eignet sich für
plugin-eigene Beobachtungen, Warnungen und Kompatibilitätsprüfungen, ist aber nicht
die primäre Sicherheitsgrenze für Unternehmen oder Hosts bei Installationen. Das Feld
`builtinScan` verbleibt aus Kompatibilitätsgründen in der Ereignis-Payload, aber
OpenClaw führt keine integrierte Blockierung gefährlichen Codes zur Installationszeit mehr aus, daher
ist es ein leeres `ok`-Ergebnis. Geben Sie zusätzliche Befunde oder
`{ block: true, blockReason }` zurück, um die Installation in diesem Prozess zu stoppen.

`block: true` ist terminal. `block: false` wird so behandelt, als läge keine Entscheidung vor. Fehler von Handlern
blockieren die Installation nach dem Fail-Closed-Prinzip.

## Gateway-Lebenszyklus

Verwenden Sie `gateway_start`, um allgemeine Plugin-Dienste zu starten, und `gateway_stop`, um
langlebige Ressourcen zu bereinigen. Der Cron-Scheduler kann noch geladen werden, wenn
`gateway_start` ausgeführt wird; verwenden Sie ihn daher nicht als Basissignal für eine externe
Cron-Projektion.

Verlassen Sie sich für Plugin-eigene Runtime-Dienste nicht auf den internen Hook
`gateway:startup`.

`cron_reconciled` wird ausgelöst, nachdem der Cron-Scheduler des Gateways und seine beim Beenden
ausgeführten Watcher ihren dauerhaften Zustand abgeglichen haben. Er wird sowohl beim ersten
Start als auch beim Austausch des Schedulers während eines Konfigurations-Neuladens ausgelöst. Das Ereignis meldet
`reason` (`startup` oder `reload`) und den effektiven Zustand `enabled`. Auch ein deaktiviertes
Cron sendet ein Ereignis mit `enabled: false`, sodass eine externe Projektion
veraltete Weckzeitpunkte löschen kann. Verwenden Sie `ctx.getCron?.()` für genau die Scheduler-Instanz, die
den Abgleich abgeschlossen hat; ein späteres Neuladen richtet diesen Callback nicht neu aus.
`ctx.abortSignal` gehört zu derselben Scheduler-Momentaufnahme. Das Gateway bricht es ab,
sobald ein neuerer Scheduler aktiviert wird oder das Herunterfahren beginnt. Übergeben Sie es an jeden
dauerhaften Nebeneffekt und akzeptieren Sie die Momentaufnahme nach dem Abbruch nicht.
Dies ist ein Scheduler-Lebenszyklussignal, kein Plugin-Aktivierungssignal: Ein
ausschließliches Hot-Reload eines Plugins löst es nicht erneut aus. Ein neu aktivierter Consumer erhält
seine erste Basislinie beim nächsten Austausch des Schedulers oder Gateway-Start.

Wie bei anderen Beobachtungs-Hooks können sich die Callbacks `gateway_start` und `cron_reconciled`
überschneiden. Wenn beide Handler dieselbe Plugin-Initialisierung verwenden, koordinieren Sie sie
mit einem plugin-lokalen Bereitschafts-Promise, statt sich auf die Callback-Reihenfolge zu verlassen.

`cron_changed` wird für Gateway-eigene Cron-Lebenszyklusereignisse mit einer typisierten
Ereignis-Payload ausgelöst, die die Gründe `added`, `updated`, `removed`, `started`, `finished`
und `scheduled` abdeckt. Das Ereignis enthält eine Momentaufnahme von `PluginHookGatewayCronJob`
(einschließlich `state.nextRunAtMs`, `state.lastRunStatus` und
`state.lastError`, sofern vorhanden) sowie einen `PluginHookGatewayCronDeliveryStatus`
mit `not-requested` | `delivered` | `not-delivered` | `unknown`. Removed-Ereignisse
erfolgen nach dem Commit: Sie werden erst ausgelöst, nachdem die dauerhafte Löschung erfolgreich war, und enthalten weiterhin
die Momentaufnahme des gelöschten Auftrags, damit externe Scheduler den Zustand abgleichen können.

Ein `scheduled`-Ereignis erfolgt nach dem Commit: Es wird nur ausgelöst, nachdem ein erfolgreicher dauerhafter
Schreibvorgang den effektiven Wert `nextRunAtMs` eines vorhandenen Auftrags ändert, wobei das explizite
Lebenszyklusereignis `added`, `updated` oder `removed` dieses Auftrags ausgeschlossen ist. Der oberste
Wert `event.nextRunAtMs` ist der übernommene nächste Weckzeitpunkt; fehlt er, hat der Auftrag
keinen nächsten Weckzeitpunkt. Behandeln Sie diese Ereignisse als Abgleichhinweise, nicht als geordnetes Delta-
Protokoll. Verwenden Sie sie als zusammenführbare Hinweise, um den zuletzt von
`cron_reconciled` erfassten Scheduler erneut zu lesen; übernehmen Sie den Scheduler nicht aus einem
`cron_changed`-Kontext. Behalten Sie OpenClaw als maßgebliche Quelle für Fälligkeitsprüfungen
und Ausführung bei.

### Sichere externe Cron-Projektion

Projizieren Sie eine vollständige Momentaufnahme der Weckzeitpunkte, statt Deltas von Cron-Ereignissen weiterzuleiten. Die
Operation `replaceAll` des externen Adapters muss atomar und idempotent sein und darf
erst aufgelöst werden, nachdem der Host die Momentaufnahme dauerhaft akzeptiert hat. Sie muss
außerdem das bereitgestellte Abbruchsignal berücksichtigen: Wenn das Signal vor der dauerhaften
Akzeptanz abbricht, darf der Adapter diese Momentaufnahme nicht akzeptieren.

Dieses Muster hält genau einen Worker für den neuesten Zustand aktiv. Nur `cron_reconciled`
übernimmt eine Scheduler-Instanz; `cron_changed` fordert diesen Worker lediglich auf, die
maßgebliche Instanz erneut zu lesen, sodass ein verspäteter Hinweis keinen älteren Scheduler wiederherstellen kann.
Eine neuere Revision bricht den aktiven Host-Versuch ab, bevor er eine veraltete
Momentaufnahme akzeptieren kann.

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
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
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
      api.logger.warn("cron reconciliation did not expose a scheduler");
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
`replaceAll([])` auf und entfernt veraltete externe Aktivierungen. Wiederholungsversuche und Backoff sind in diesem Beispiel
prozesslokal und behandeln Fehler des Laufzeitadapters als vorübergehend; validieren Sie
nicht wiederholbare Konfigurationsfehler vor der Registrierung. OpenClaw stellt keine
Outbox für Auswirkungen von Plugin-Hooks bereit. Wenn der Prozess vor der dauerhaften Annahme beendet wird,
gibt der nächste Start des Gateways einen neuen maßgeblichen `cron_reconciled`-Snapshot aus.
`gateway_stop` bricht laufende Host-Arbeiten ab, wartet, bis der Worker abgeschlossen ist, und
schließt anschließend den Adapter.

## Bevorstehende Einstellungen

Einige an Hooks angrenzende Oberflächen sind veraltet, werden aber weiterhin unterstützt. Migrieren Sie
vor dem nächsten Major-Release:

- **Klartext-Channel-Umschläge** in `inbound_claim`- und `message_received`-
  Handlern. Lesen Sie `BodyForAgent` und die strukturierten Benutzerkontextblöcke,
  anstatt flachen Umschlagtext zu parsen. Siehe
  [Klartext-Channel-Umschläge → BodyForAgent](/de/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** bleibt aus Kompatibilitätsgründen erhalten. Neue Plugins sollten
  `before_model_resolve` und `before_prompt_build` anstelle der kombinierten
  Phase verwenden.
- **`subagent_spawning`** bleibt zur Kompatibilität mit älteren Plugins erhalten, aber
  neue Plugins sollten daraus kein Thread-Routing zurückgeben. Der Core bereitet
  `thread: true`-Subagent-Bindungen über Channel-Sitzungsbindungsadapter vor,
  bevor `subagent_spawned` ausgelöst wird.
- **`deactivate`** bleibt bis nach dem 2026-08-16 als veralteter
  Kompatibilitätsalias für die Bereinigung erhalten. Neue Plugins sollten `gateway_stop` verwenden.
- **`onResolution` in `before_tool_call`** verwendet jetzt die typisierte
  `PluginApprovalResolution`-Union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) anstelle eines frei formulierten `string`.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** bleiben
  als Kompatibilitätsaliase auf oberster Ebene erhalten. Neue Plugins sollten
  `api.session.state.registerSessionExtension(...)` und
  `api.session.workflow.enqueueNextTurnInjection(...)` verwenden.

Die vollständige Liste – Registrierung von Memory-Fähigkeiten, Provider-Denkprofil,
externe Authentifizierungs-Provider, Provider-Erkennungstypen, Zugriffsmethoden der Task-Laufzeit
und die Umbenennung von `command-auth` → `command-status` – finden Sie unter
[Plugin-SDK-Migration → Aktive Einstellungen](/de/plugins/sdk-migration#active-deprecations).

## Verwandte Themen

- [Plugin-SDK-Migration](/de/plugins/sdk-migration) – aktive Einstellungen und Zeitplan für die Entfernung
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Interne Hooks](/de/automation/hooks)
- [Interna der Plugin-Architektur](/de/plugins/architecture-internals)
