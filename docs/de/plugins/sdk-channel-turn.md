---
read_when:
    - Sie erstellen ein Kanal-Plugin und möchten den gemeinsam genutzten Lebenszyklus für eingehende Interaktionen
    - Sie migrieren einen Kanalmonitor weg von handgeschriebener Record-/Dispatch-Klebelogik
    - Sie müssen die Phasen Annahme, Aufnahme, Klassifizierung, Vorprüfung, Auflösung, Aufzeichnung, Weiterleitung und Abschluss verstehen.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- der gemeinsame Kern für eingehende Turns, den gebündelte und Drittanbieter-Kanal-Plugins verwenden, um Agenten-Turns aufzuzeichnen, weiterzuleiten und abzuschließen
title: Kanal-Turn-Kernel
x-i18n:
    generated_at: "2026-04-30T07:07:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Der Channel-Turn-Kernel ist die gemeinsame eingehende Zustandsmaschine, die ein normalisiertes Plattformereignis in einen Agent-Turn umwandelt. Channel-Plugins liefern die Plattformfakten und den Delivery-Callback. Core übernimmt die Orchestrierung: Ingest, Klassifizierung, Preflight, Auflösung, Autorisierung, Zusammenstellung, Aufzeichnung, Dispatch und Finalisierung.

Verwenden Sie dies, wenn Ihr Plugin im Hot Path für eingehende Nachrichten liegt. Halten Sie nicht nachrichtenbezogene Ereignisse (Slash-Commands, Modals, Button-Interaktionen, Lifecycle-Ereignisse, Reaktionen, Voice State) Plugin-lokal. Der Kernel übernimmt nur Ereignisse, die zu einem Text-Turn des Agents werden können.

<Info>
  Der Kernel wird über die injizierte Plugin-Runtime als `runtime.channel.turn.*` erreicht. Der Plugin-Runtime-Typ wird aus `openclaw/plugin-sdk/core` exportiert, sodass native Drittanbieter-Plugins diese Einstiegspunkte genauso verwenden können wie gebündelte Channel-Plugins.
</Info>

## Warum ein gemeinsamer Kernel

Channel-Plugins wiederholen denselben eingehenden Ablauf: normalisieren, routen, sperren, einen Kontext erstellen, Sitzungsmetadaten aufzeichnen, den Agent-Turn dispatchen, den Delivery-Status finalisieren. Ohne gemeinsamen Kernel muss eine Änderung an Mention-Gating, sichtbaren Tool-only-Antworten, Sitzungsmetadaten, ausstehender Historie oder Dispatch-Finalisierung pro Channel angewendet werden.

Der Kernel hält vier Konzepte bewusst getrennt:

- `ConversationFacts`: woher die Nachricht kam
- `RouteFacts`: welcher Agent und welche Sitzung sie verarbeiten soll
- `ReplyPlanFacts`: wohin sichtbare Antworten gehen sollen
- `MessageFacts`: welchen Inhalt und Zusatzkontext der Agent sehen soll

Slack-DMs, Telegram-Themen, Matrix-Threads und Feishu-Themensitzungen unterscheiden diese in der Praxis alle. Sie als einen einzigen Bezeichner zu behandeln, führt im Lauf der Zeit zu Abweichungen.

## Stage-Lifecycle

Der Kernel führt unabhängig vom Channel dieselbe feste Pipeline aus:

1. `ingest` -- Adapter konvertiert ein rohes Plattformereignis in `NormalizedTurnInput`
2. `classify` -- Adapter deklariert, ob dieses Ereignis einen Agent-Turn starten kann
3. `preflight` -- Adapter übernimmt Deduplizierung, Self-Echo, Hydration, Debounce, Entschlüsselung, teilweises Vorbefüllen von Fakten
4. `resolve` -- Adapter gibt einen vollständig zusammengestellten Turn zurück (Route, Antwortplan, Nachricht, Delivery)
5. `authorize` -- DM-, Gruppen-, Mention- und Command-Policy wird auf die zusammengestellten Fakten angewendet
6. `assemble` -- `FinalizedMsgContext` wird aus den Fakten über `buildContext` erstellt
7. `record` -- eingehende Sitzungsmetadaten und letzte Route werden persistiert
8. `dispatch` -- Agent-Turn wird über den gepufferten Block-Dispatcher ausgeführt
9. `finalize` -- Adapter-`onFinalize` läuft auch bei Dispatch-Fehlern

Jede Stage gibt ein strukturiertes Log-Ereignis aus, wenn ein `log`-Callback bereitgestellt wird. Siehe [Observability](#observability).

## Zulassungsarten

Der Kernel wirft keinen Fehler, wenn ein Turn gesperrt wird. Er gibt eine `ChannelTurnAdmission` zurück:

| Art           | Wann                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Turn wird zugelassen. Agent-Turn läuft, und der sichtbare Antwortpfad wird ausgeführt.                                                                        |
| `observeOnly` | Turn läuft End-to-End, aber der Delivery-Adapter sendet nichts Sichtbares. Wird für Broadcast-Beobachter-Agents und andere passive Multi-Agent-Flows genutzt. |
| `handled`     | Ein Plattformereignis wurde lokal verarbeitet (Lifecycle, Reaktion, Button, Modal). Kernel überspringt Dispatch.                                             |
| `drop`        | Überspringpfad. Optional hält `recordHistory: true` die Nachricht in der ausstehenden Gruppenhistorie, damit eine zukünftige Mention Kontext hat.             |

Die Zulassung kann aus `classify` kommen (Ereignisklasse sagte, dass sie keinen Turn starten kann), aus `preflight` (Deduplizierung, Self-Echo, fehlende Mention mit Historienaufzeichnung) oder aus `resolveTurn` selbst.

## Einstiegspunkte

Die Runtime stellt drei bevorzugte Einstiegspunkte bereit, damit Adapter sich auf der Ebene einklinken können, die zum Channel passt.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Zwei ältere Runtime-Hilfen bleiben für Plugin-SDK-Kompatibilität verfügbar:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Verwenden Sie dies, wenn Ihr Channel seinen eingehenden Ablauf als `ChannelTurnAdapter<TRaw>` ausdrücken kann. Der Adapter hat Callbacks für `ingest`, optional `classify`, optional `preflight`, verpflichtend `resolveTurn` und optional `onFinalize`.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` ist die passende Form, wenn der Channel kleine Adapterlogik hat und davon profitiert, den Lifecycle über Hooks zu steuern.

### runPrepared

Verwenden Sie dies, wenn der Channel einen komplexen lokalen Dispatcher mit Vorschauen, Wiederholungen, Edits oder Thread-Bootstrap hat, der Channel-eigen bleiben muss. Der Kernel zeichnet weiterhin die eingehende Sitzung vor dem Dispatch auf und stellt ein einheitliches `DispatchedChannelTurnResult` bereit.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

Reichhaltige Channels (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) verwenden `runPrepared`, weil ihr Dispatcher plattformspezifisches Verhalten orchestriert, das der Kernel nicht kennen darf.

### buildContext

Eine reine Funktion, die Faktenbündel auf `FinalizedMsgContext` abbildet. Verwenden Sie sie, wenn Ihr Channel einen Teil der Pipeline manuell implementiert, aber eine konsistente Kontextform möchte.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` ist auch innerhalb von `resolveTurn`-Callbacks nützlich, wenn ein Turn für `run` zusammengestellt wird.

<Note>
  Veraltete SDK-Hilfen wie `dispatchInboundReplyWithBase` überbrücken weiterhin über eine Hilfe für zusammengestellte Turns. Neuer Plugin-Code sollte `run` oder `runPrepared` verwenden.
</Note>

## Faktentypen

Die Fakten, die der Kernel von Ihrem Adapter konsumiert, sind plattformagnostisch. Übersetzen Sie Plattformobjekte in diese Formen, bevor Sie sie an den Kernel übergeben.

### NormalizedTurnInput

| Feld              | Zweck                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Stabile Nachrichten-ID für Deduplizierung und Logs                           |
| `timestamp`       | Optionale Epoch-ms                                                           |
| `rawText`         | Inhalt, wie von der Plattform empfangen                                      |
| `textForAgent`    | Optional bereinigter Inhalt für den Agent (Mention entfernen, Typing-Trim)   |
| `textForCommands` | Optionaler Inhalt für das Parsen von `/command`                              |
| `raw`             | Optionale Pass-through-Referenz für Adapter-Callbacks, die das Original benötigen |

### ChannelEventClass

| Feld                   | Zweck                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Wenn false, gibt der Kernel `{ kind: "handled" }` zurück               |
| `requiresImmediateAck` | Hinweis für Adapter, die vor dem Dispatch ein ACK senden müssen        |

### SenderFacts

| Feld           | Zweck                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| `id`           | Stabile Plattform-Absender-ID                                            |
| `name`         | Anzeigename                                                              |
| `username`     | Handle, falls von `name` verschieden                                     |
| `tag`          | Discord-artiger Diskriminator oder Plattform-Tag                         |
| `roles`        | Rollen-IDs, verwendet für Allowlist-Abgleich von Mitgliedsrollen         |
| `isBot`        | True, wenn der Absender ein bekannter Bot ist (Kernel nutzt dies zum Verwerfen) |
| `isSelf`       | True, wenn der Absender der konfigurierte Agent selbst ist               |
| `displayLabel` | Vorgerendertes Label für Hülltext                                        |

### ConversationFacts

| Feld              | Zweck                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `kind`            | `direct`, `group` oder `channel`                                          |
| `id`              | Conversation-ID, die für Routing verwendet wird                           |
| `label`           | Menschliches Label für die Hülle                                          |
| `spaceId`         | Optionaler äußerer Space-Bezeichner (Slack-Workspace, Matrix-Homeserver)  |
| `parentId`        | Äußere Conversation-ID, wenn dies ein Thread ist                          |
| `threadId`        | Thread-ID, wenn diese Nachricht in einem Thread liegt                     |
| `nativeChannelId` | Plattformnative Channel-ID, wenn sie von der Routing-ID abweicht          |
| `routePeer`       | Peer, der für die `resolveAgentRoute`-Suche verwendet wird                |

### RouteFacts

| Feld                    | Zweck                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| `agentId`               | Agent, der diesen Turn verarbeiten soll                           |
| `accountId`             | Optionale Überschreibung (Multi-Account-Channels)                 |
| `routeSessionKey`       | Sitzungsschlüssel, der für Routing verwendet wird                 |
| `dispatchSessionKey`    | Sitzungsschlüssel, der beim Dispatch verwendet wird, wenn er vom Route-Schlüssel abweicht |
| `persistedSessionKey`   | Sitzungsschlüssel, der in persistierte Sitzungsmetadaten geschrieben wird |
| `parentSessionKey`      | Parent für verzweigte/Thread-Sitzungen                            |
| `modelParentSessionKey` | Modellseitiger Parent für verzweigte Sitzungen                    |
| `mainSessionKey`        | Main-DM-Owner-Pin für direkte Conversations                       |
| `createIfMissing`       | Erlaubt dem Aufzeichnungsschritt, eine fehlende Sitzungszeile zu erstellen |

### ReplyPlanFacts

| Feld                      | Zweck                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| `to`                      | Logisches Antwortziel, das in den Kontext `To` geschrieben wird        |
| `originatingTo`           | Ursprüngliches Kontextziel (`OriginatingTo`)                           |
| `nativeChannelId`         | Plattformnative Kanal-ID für die Zustellung                            |
| `replyTarget`             | Endgültiges sichtbares Antwortziel, falls es sich von `to` unterscheidet |
| `deliveryTarget`          | Untergeordnete Zustellungsüberschreibung                               |
| `replyToId`               | Zitierte/verankerte Nachrichten-ID                                     |
| `replyToIdFull`           | Vollständige zitierte ID, wenn die Plattform beides hat                 |
| `messageThreadId`         | Thread-ID zum Zustellungszeitpunkt                                     |
| `threadParentId`          | ID der übergeordneten Nachricht des Threads                            |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` oder `none`                     |

### AccessFacts

`AccessFacts` enthält die booleschen Werte, die die Autorisierungsstufe benötigt. Der Identitätsabgleich bleibt im Kanal: Der Kernel verbraucht nur das Ergebnis.

| Feld       | Zweck                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| `dm`       | DM-Zulassen-/Koppeln-/Ablehnen-Entscheidung und `allowFrom`-Liste              |
| `group`    | Gruppenrichtlinie, Routenzulassung, Absenderzulassung, Allowlist, Erwähnungspflicht |
| `commands` | Befehlsautorisierung über konfigurierte Autorisierer hinweg                    |
| `mentions` | Ob Erwähnungserkennung möglich ist und ob der Agent erwähnt wurde              |

### MessageFacts

| Feld             | Zweck                                                              |
| ---------------- | ------------------------------------------------------------------ |
| `body`           | Endgültiger Envelope-Text (formatiert)                             |
| `rawBody`        | Roher eingehender Text                                             |
| `bodyForAgent`   | Text, den der Agent sieht                                          |
| `commandBody`    | Für die Befehlsanalyse verwendeter Text                            |
| `envelopeFrom`   | Vorgerendertes Absenderlabel für den Envelope                      |
| `senderLabel`    | Optionale Überschreibung für den gerenderten Absender              |
| `preview`        | Kurze redigierte Vorschau für Logs                                 |
| `inboundHistory` | Aktuelle eingehende Verlaufseinträge, wenn der Kanal einen Puffer führt |

### SupplementalContextFacts

Ergänzender Kontext umfasst Kontext für Zitate, Weiterleitungen und Thread-Bootstrapping. Der Kernel wendet die konfigurierte `contextVisibility`-Richtlinie an. Der Kanaladapter stellt nur Fakten und `senderAllowed`-Flags bereit, damit die kanalübergreifende Richtlinie konsistent bleibt.

### InboundMediaFacts

Medien sind als Fakten geformt. Plattformdownload, Authentifizierung, SSRF-Richtlinie, CDN-Regeln und Entschlüsselung bleiben kanallokal. Der Kernel ordnet Fakten `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` und `MediaTranscribedIndexes` zu.

## Adaptervertrag

Für vollständiges `run` hat der Adapter diese Form:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` gibt ein `ChannelTurnResolved` zurück, also ein `AssembledChannelTurn` mit optionaler Admission-Art. Das Zurückgeben von `{ admission: { kind: "observeOnly" } }` führt den Turn aus, ohne sichtbare Ausgabe zu erzeugen. Der Adapter besitzt weiterhin den Zustellungs-Callback; er wird für diesen Turn lediglich zu einem No-op.

`onFinalize` läuft für jedes Ergebnis, einschließlich Dispatch-Fehlern. Verwenden Sie es, um ausstehenden Gruppenverlauf zu löschen, Ack-Reaktionen zu entfernen, Statusindikatoren zu stoppen und lokalen Zustand zu flushen.

## Zustellungsadapter

Der Kernel ruft die Plattform nicht direkt auf. Der Kanal übergibt dem Kernel einen `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` wird einmal pro gepuffertem Antwort-Chunk aufgerufen. Geben Sie Plattform-Nachrichten-IDs zurück, wenn der Kanal sie hat, damit der Dispatcher Thread-Anker beibehalten und spätere Chunks bearbeiten kann. Geben Sie für observe-only-Turns `{ visibleReplySent: false }` zurück oder verwenden Sie `createNoopChannelTurnDeliveryAdapter()`.

## Aufzeichnungsoptionen

Die Aufzeichnungsstufe kapselt `recordInboundSession`. Die meisten Kanäle können die Standardwerte verwenden. Überschreiben Sie sie über `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Der Dispatcher wartet auf die Aufzeichnungsstufe. Wenn die Aufzeichnung einen Fehler auslöst, führt der Kernel `onPreDispatchFailure` aus (wenn es an `runPrepared` übergeben wurde) und wirft den Fehler erneut.

## Beobachtbarkeit

Jede Stufe gibt ein strukturiertes Ereignis aus, wenn ein `log`-Callback bereitgestellt wird:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

Protokollierte Stufen: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Vermeiden Sie das Protokollieren roher Texte; verwenden Sie `MessageFacts.preview` für kurze redigierte Vorschauen.

## Was kanallokal bleibt

Der Kernel besitzt die Orchestrierung. Der Kanal besitzt weiterhin:

- Plattformtransporte (Gateway, REST, WebSocket, Polling, Webhooks)
- Identitätsauflösung und Anzeigenamenabgleich
- Native Befehle, Slash-Befehle, Autovervollständigung, Modale, Buttons, Sprachstatus
- Rendering von Karten, Modalen und Adaptive Cards
- Medienauthentifizierung, CDN-Regeln, verschlüsselte Medien, Transkription
- APIs für Bearbeitung, Reaktion, Redigierung und Präsenz
- Backfill und plattformseitiger Verlaufsabruf
- Kopplungsabläufe, die plattformspezifische Verifizierung erfordern

Wenn zwei Kanäle beginnen, denselben Helper für einen dieser Punkte zu benötigen, extrahieren Sie stattdessen einen gemeinsamen SDK-Helper, anstatt ihn in den Kernel zu verschieben.

## Stabilität

`runtime.channel.turn.*` ist Teil der öffentlichen Plugin-Laufzeitoberfläche. Die Faktentypen (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) und Admission-Formen (`ChannelTurnAdmission`, `ChannelEventClass`) sind über `PluginRuntime` aus `openclaw/plugin-sdk/core` erreichbar.

Regeln zur Abwärtskompatibilität gelten: Neue Faktenfelder sind additiv, Admission-Arten werden nicht umbenannt, und die Namen der Einstiegspunkte bleiben stabil. Neue Kanalanforderungen, die eine nicht-additive Änderung erfordern, müssen den Migrationsprozess des Plugin-SDK durchlaufen.

## Verwandt

- [Kanal-Plugins erstellen](/de/plugins/sdk-channel-plugins) für den umfassenderen Vertrag für Kanal-Plugins
- [Plugin-Laufzeit-Helper](/de/plugins/sdk-runtime) für andere `runtime.*`-Oberflächen
- [Plugin-Interna](/de/plugins/architecture-internals) für Ladepipeline und Registry-Mechanik
