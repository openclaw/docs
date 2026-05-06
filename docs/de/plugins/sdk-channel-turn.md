---
read_when:
    - Sie erstellen ein Channel-Plugin und möchten den gemeinsamen Lebenszyklus für eingehende Turns
    - Sie migrieren einen Kanalmonitor weg von handgeschriebenem Record-/Dispatch-Glue-Code
    - Sie müssen die Phasen Zulassung, Aufnahme, Klassifizierung, Vorabprüfung, Auflösung, Aufzeichnung, Weiterleitung und Abschluss verstehen
sidebarTitle: Channel turn
summary: runtime.channel.turn -- der gemeinsam genutzte Kernel für eingehende Turns, den gebündelte und Drittanbieter-Kanal-Plugins verwenden, um Agent-Turns aufzuzeichnen, weiterzuleiten und abzuschließen
title: Kanal-Durchlauf-Kernel
x-i18n:
    generated_at: "2026-05-06T06:58:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Der Kanal-Turn-Kernel ist die gemeinsame eingehende Zustandsmaschine, die ein normalisiertes Plattformereignis in einen Agenten-Turn umwandelt. Kanal-Plugins stellen die Plattformfakten und den Delivery-Callback bereit. Core besitzt die Orchestrierung: erfassen, klassifizieren, vorprüfen, auflösen, autorisieren, zusammensetzen, aufzeichnen, dispatchen und abschließen.

Verwenden Sie dies, wenn Ihr Plugin im Hot Path für eingehende Nachrichten liegt. Für Nicht-Nachrichtenereignisse (Slash-Commands, Modals, Button-Interaktionen, Lifecycle-Ereignisse, Reaktionen, Voice State) bleiben diese Plugin-lokal. Der Kernel besitzt nur Ereignisse, die zu einem Agenten-Text-Turn werden können.

<Info>
  Der Kernel wird über die injizierte Plugin-Runtime als `runtime.channel.turn.*` erreicht. Der Plugin-Runtime-Typ wird aus `openclaw/plugin-sdk/core` exportiert, sodass native Drittanbieter-Plugins diese Einstiegspunkte genauso verwenden können wie gebündelte Kanal-Plugins.
</Info>

## Warum ein gemeinsamer Kernel

Kanal-Plugins wiederholen denselben eingehenden Ablauf: normalisieren, routen, gaten, einen Kontext aufbauen, Sitzungsmetadaten aufzeichnen, den Agenten-Turn dispatchen, den Delivery-Status abschließen. Ohne gemeinsamen Kernel muss eine Änderung an Mention-Gating, nur für Tools sichtbaren Antworten, Sitzungsmetadaten, ausstehender Historie oder Dispatch-Abschluss pro Kanal angewendet werden.

Der Kernel hält vier Konzepte bewusst getrennt:

- `ConversationFacts`: woher die Nachricht kam
- `RouteFacts`: welcher Agent und welche Sitzung sie verarbeiten sollen
- `ReplyPlanFacts`: wohin sichtbare Antworten gehen sollen
- `MessageFacts`: welchen Body und Zusatzkontext der Agent sehen soll

Slack-DMs, Telegram-Themen, Matrix-Threads und Feishu-Themensitzungen unterscheiden diese in der Praxis alle. Sie als eine Kennung zu behandeln, verursacht mit der Zeit Drift.

## Stage-Lifecycle

Der Kernel führt unabhängig vom Kanal dieselbe feste Pipeline aus:

1. `ingest` -- Adapter wandelt ein rohes Plattformereignis in `NormalizedTurnInput` um
2. `classify` -- Adapter deklariert, ob dieses Ereignis einen Agenten-Turn starten kann
3. `preflight` -- Adapter erledigt Deduplizierung, Self-Echo, Hydration, Debounce, Entschlüsselung, teilweise Vorbefüllung von Fakten
4. `resolve` -- Adapter gibt einen vollständig zusammengesetzten Turn zurück (Route, Antwortplan, Nachricht, Delivery)
5. `authorize` -- DM-, Gruppen-, Mention- und Command-Policy wird auf die zusammengesetzten Fakten angewendet
6. `assemble` -- `FinalizedMsgContext` wird aus den Fakten über `buildContext` aufgebaut
7. `record` -- eingehende Sitzungsmetadaten und letzte Route werden persistiert
8. `dispatch` -- Agenten-Turn wird über den gepufferten Block-Dispatcher ausgeführt
9. `finalize` -- Adapter-`onFinalize` läuft selbst bei einem Dispatch-Fehler

Jede Stage gibt ein strukturiertes Logereignis aus, wenn ein `log`-Callback bereitgestellt wird. Siehe [Observability](#observability).

## Admission-Arten

Der Kernel wirft keinen Fehler, wenn ein Turn gegatet wird. Er gibt eine `ChannelTurnAdmission` zurück:

| Art           | Wann                                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Turn wird zugelassen. Agenten-Turn läuft und der sichtbare Antwortpfad wird ausgeführt.                                                   |
| `observeOnly` | Turn läuft vollständig durch, aber der Delivery-Adapter sendet nichts Sichtbares. Wird für Broadcast-Beobachteragenten und andere passive Multi-Agent-Flows verwendet. |
| `handled`     | Ein Plattformereignis wurde lokal verarbeitet (Lifecycle, Reaktion, Button, Modal). Kernel überspringt Dispatch.                          |
| `drop`        | Übersprungener Pfad. Optional behält `recordHistory: true` die Nachricht in der ausstehenden Gruppenhistorie, damit eine zukünftige Mention Kontext hat. |

Admission kann aus `classify` kommen (Ereignisklasse sagte, dass sie keinen Turn starten kann), aus `preflight` (Deduplizierung, Self-Echo, fehlende Mention mit Historienaufzeichnung) oder aus `resolveTurn` selbst.

## Einstiegspunkte

Die Runtime stellt drei bevorzugte Einstiegspunkte bereit, sodass Adapter auf der Ebene einsteigen können, die zum Kanal passt.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Zwei ältere Runtime-Helfer bleiben für Plugin-SDK-Kompatibilität verfügbar:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Verwenden Sie dies, wenn Ihr Kanal seinen eingehenden Ablauf als `ChannelTurnAdapter<TRaw>` ausdrücken kann. Der Adapter hat Callbacks für `ingest`, optional `classify`, optional `preflight`, verpflichtend `resolveTurn` und optional `onFinalize`.

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

`run` ist die richtige Form, wenn der Kanal kleine Adapterlogik hat und davon profitiert, den Lifecycle über Hooks zu besitzen.

### runPrepared

Verwenden Sie dies, wenn der Kanal einen komplexen lokalen Dispatcher mit Vorschauen, Wiederholungen, Bearbeitungen oder Thread-Bootstrap hat, der im Besitz des Kanals bleiben muss. Der Kernel zeichnet weiterhin die eingehende Sitzung vor dem Dispatch auf und stellt ein einheitliches `DispatchedChannelTurnResult` bereit.

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

Reichhaltige Kanäle (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) verwenden `runPrepared`, weil ihr Dispatcher plattformspezifisches Verhalten orchestriert, über das der Kernel nichts lernen darf.

### buildContext

Eine reine Funktion, die Faktenbündel auf `FinalizedMsgContext` abbildet. Verwenden Sie sie, wenn Ihr Kanal einen Teil der Pipeline selbst erstellt, aber eine konsistente Kontextform möchte.

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

`buildContext` ist auch innerhalb von `resolveTurn`-Callbacks nützlich, wenn ein Turn für `run` zusammengesetzt wird.

<Note>
  Veraltete SDK-Helfer wie `dispatchInboundReplyWithBase` bridgen weiterhin über einen Helfer für zusammengesetzte Turns. Neuer Plugin-Code sollte `run` oder `runPrepared` verwenden.
</Note>

## Faktentypen

Die Fakten, die der Kernel von Ihrem Adapter konsumiert, sind plattformagnostisch. Übersetzen Sie Plattformobjekte in diese Formen, bevor Sie sie an den Kernel übergeben.

### NormalizedTurnInput

| Feld              | Zweck                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Stabile Nachrichten-ID für Deduplizierung und Logs                           |
| `timestamp`       | Optionale Epochenzeit in ms                                                  |
| `rawText`         | Body, wie von der Plattform empfangen                                        |
| `textForAgent`    | Optional bereinigter Body für den Agenten (Mention entfernen, Eingabe trimmen) |
| `textForCommands` | Optionaler Body für das Parsen von `/command`                                |
| `raw`             | Optionale Pass-through-Referenz für Adapter-Callbacks, die das Original benötigen |

### ChannelEventClass

| Feld                   | Zweck                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Wenn false, gibt der Kernel `{ kind: "handled" }` zurück                |
| `requiresImmediateAck` | Hinweis für Adapter, die vor dem Dispatch ein ACK senden müssen         |

### SenderFacts

| Feld           | Zweck                                                             |
| -------------- | ----------------------------------------------------------------- |
| `id`           | Stabile Plattform-Sender-ID                                       |
| `name`         | Anzeigename                                                       |
| `username`     | Handle, wenn verschieden von `name`                               |
| `tag`          | Discord-artiger Discriminator oder Plattform-Tag                  |
| `roles`        | Rollen-IDs, verwendet für Allowlist-Abgleich von Mitgliedsrollen  |
| `isBot`        | True, wenn der Sender ein bekannter Bot ist (Kernel nutzt dies zum Verwerfen) |
| `isSelf`       | True, wenn der Sender der konfigurierte Agent selbst ist          |
| `displayLabel` | Vorgerendertes Label für Envelope-Text                            |

### ConversationFacts

| Feld              | Zweck                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `kind`            | `direct`, `group` oder `channel`                                      |
| `id`              | Konversations-ID für Routing                                          |
| `label`           | Menschliches Label für den Envelope                                   |
| `spaceId`         | Optionale äußere Space-Kennung (Slack-Workspace, Matrix-Homeserver)   |
| `parentId`        | Äußere Konversations-ID, wenn dies ein Thread ist                     |
| `threadId`        | Thread-ID, wenn diese Nachricht in einem Thread liegt                 |
| `nativeChannelId` | Plattformeigene Kanal-ID, wenn sie sich von der Routing-ID unterscheidet |
| `routePeer`       | Peer, der für die `resolveAgentRoute`-Suche verwendet wird            |

### RouteFacts

| Feld                    | Zweck                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| `agentId`               | Agent, der diesen Turn verarbeiten soll                            |
| `accountId`             | Optionale Überschreibung (Multi-Account-Kanäle)                    |
| `routeSessionKey`       | Sitzungsschlüssel für Routing                                      |
| `dispatchSessionKey`    | Sitzungsschlüssel für Dispatch, wenn verschieden vom Route-Schlüssel |
| `persistedSessionKey`   | Sitzungsschlüssel, der in persistierte Sitzungsmetadaten geschrieben wird |
| `parentSessionKey`      | Parent für verzweigte/Thread-Sitzungen                             |
| `modelParentSessionKey` | Modellseitiger Parent für verzweigte Sitzungen                     |
| `mainSessionKey`        | Haupt-DM-Owner-Pin für direkte Konversationen                      |
| `createIfMissing`       | Erlaubt dem Aufzeichnungsschritt, eine fehlende Sitzungszeile zu erstellen |

### ReplyPlanFacts

| Feld                      | Zweck                                                                    |
| ------------------------- | ------------------------------------------------------------------------ |
| `to`                      | Logisches Antwortziel, das in den Kontext `To` geschrieben wird          |
| `originatingTo`           | Ursprüngliches Kontextziel (`OriginatingTo`)                             |
| `nativeChannelId`         | Plattformnativer Kanal-ID für die Zustellung                             |
| `replyTarget`             | Endgültiges sichtbares Antwortziel, wenn es sich von `to` unterscheidet  |
| `deliveryTarget`          | Zustellungsüberschreibung auf niedrigerer Ebene                          |
| `replyToId`               | Zitierte/verankerte Nachrichten-ID                                       |
| `replyToIdFull`           | Vollständige zitierte ID, wenn die Plattform beides hat                  |
| `messageThreadId`         | Thread-ID zum Zustellungszeitpunkt                                       |
| `threadParentId`          | ID der übergeordneten Nachricht des Threads                              |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` oder `none`                       |

### AccessFacts

`AccessFacts` enthält die booleschen Werte, die die Autorisierungsphase benötigt. Der Identitätsabgleich bleibt im Kanal: Der Kernel verbraucht nur das Ergebnis.

| Feld       | Zweck                                                                                 |
| ---------- | ------------------------------------------------------------------------------------- |
| `dm`       | DM-Entscheidung zu Zulassen/Koppeln/Ablehnen und `allowFrom`-Liste                    |
| `group`    | Gruppenrichtlinie, Routenfreigabe, Absenderfreigabe, Allowlist, Erwähnungserfordernis |
| `commands` | Befehlsautorisierung über konfigurierte Autorisierer hinweg                           |
| `mentions` | Ob Erwähnungserkennung möglich ist und ob der Agent erwähnt wurde                     |

### MessageFacts

| Feld             | Zweck                                                              |
| ---------------- | ------------------------------------------------------------------ |
| `body`           | Endgültiger Envelope-Body (formatiert)                             |
| `rawBody`        | Rohdaten des eingehenden Bodys                                     |
| `bodyForAgent`   | Body, den der Agent sieht                                          |
| `commandBody`    | Für das Parsen von Befehlen verwendeter Body                       |
| `envelopeFrom`   | Vorab gerendertes Absenderlabel für den Envelope                   |
| `senderLabel`    | Optionale Überschreibung für den gerenderten Absender              |
| `preview`        | Kurze redigierte Vorschau für Logs                                 |
| `inboundHistory` | Aktuelle eingehende Verlaufseinträge, wenn der Kanal einen Puffer führt |

### SupplementalContextFacts

Zusätzlicher Kontext umfasst Zitat-, Weiterleitungs- und Thread-Bootstrap-Kontext. Der Kernel wendet die konfigurierte `contextVisibility`-Richtlinie an. Der Kanaladapter stellt nur Fakten und `senderAllowed`-Flags bereit, damit die kanalübergreifende Richtlinie konsistent bleibt.

### InboundMediaFacts

Medien sind als Fakten modelliert. Plattformdownload, Authentifizierung, SSRF-Richtlinie, CDN-Regeln und Entschlüsselung bleiben kanallokal. Der Kernel ordnet Fakten `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` und `MediaTranscribedIndexes` zu.

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

`resolveTurn` gibt ein `ChannelTurnResolved` zurück, also ein `AssembledChannelTurn` mit optionaler Admission-Art. Die Rückgabe von `{ admission: { kind: "observeOnly" } }` führt den Turn aus, ohne sichtbare Ausgabe zu erzeugen. Der Adapter besitzt weiterhin den Zustellungs-Callback; er wird für diesen Turn lediglich zu einem No-op.

`onFinalize` wird für jedes Ergebnis ausgeführt, einschließlich Dispatch-Fehlern. Verwenden Sie es, um ausstehende Gruppenverläufe zu löschen, Ack-Reaktionen zu entfernen, Statusindikatoren zu stoppen und lokalen Zustand zu flushen.

## Zustellungsadapter

Der Kernel ruft die Plattform nicht direkt auf. Der Kanal übergibt dem Kernel einen `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` wird einmal pro gepuffertem Antwort-Chunk aufgerufen. Während der Migration des Nachrichtenlebenszyklus ist die Zustellung zusammengesetzter Kanal-Turns standardmäßig kanaleigen: Ein ausgelassenes `durable`-Feld bedeutet, dass der Kernel `deliver` direkt aufrufen muss und nicht über die generische ausgehende Zustellung routen darf. Setzen Sie `durable` erst, nachdem der Kanal geprüft wurde, um nachzuweisen, dass der generische Sendepfad das alte Zustellungsverhalten beibehält, einschließlich Antwort-/Thread-Zielen, Medienverarbeitung, Caches für gesendete Nachrichten/Selbst-Echos, Statusbereinigung und zurückgegebenen Nachrichten-IDs. `durable: false` bleibt eine Kompatibilitätsschreibweise für „kanaleigenen Callback verwenden“, aber nicht migrierte Kanäle sollten es nicht hinzufügen müssen. Geben Sie Plattform-Nachrichten-IDs zurück, wenn der Kanal sie hat, damit der Dispatcher Thread-Anker erhalten und spätere Chunks bearbeiten kann; neuere Zustellungspfade sollten außerdem `receipt` zurückgeben, damit Wiederherstellung, Vorschau-Finalisierung und Duplikatunterdrückung von `messageIds` weg migrieren können. Für reine Beobachtungs-Turns geben Sie `{ visibleReplySent: false }` zurück oder verwenden Sie `createNoopChannelTurnDeliveryAdapter()`.

Kanäle, die `runPrepared` mit einem vollständig kanaleigenen Dispatcher verwenden, haben keinen `ChannelTurnDeliveryAdapter`. Diese Dispatcher sind standardmäßig nicht durable. Sie sollten ihren direkten Zustellungspfad beibehalten, bis sie sich ausdrücklich für den neuen Sendekontext mit vollständigem Ziel, replay-sicherem Adapter, Receipt-Vertrag und kanalseitigen Nebenwirkungs-Hooks entscheiden.

Öffentliche Kompatibilitäts-Helper wie `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` und Direct-DM-Helper müssen während der Migration verhaltenserhaltend bleiben. Sie dürfen die generische durable Zustellung nicht vor aufrufereigenen `deliver`- oder `reply`-Callbacks aufrufen.

## Aufzeichnungsoptionen

Die Aufzeichnungsphase umschließt `recordInboundSession`. Die meisten Kanäle können die Standardwerte verwenden. Überschreiben Sie sie über `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Der Dispatcher wartet auf die Aufzeichnungsphase. Wenn die Aufzeichnung eine Exception auslöst, führt der Kernel `onPreDispatchFailure` aus (wenn für `runPrepared` bereitgestellt) und wirft erneut.

## Observability

Jede Phase gibt ein strukturiertes Ereignis aus, wenn ein `log`-Callback bereitgestellt wird:

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

Protokollierte Phasen: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Vermeiden Sie das Loggen roher Bodys; verwenden Sie `MessageFacts.preview` für kurze redigierte Vorschauen.

## Was kanallokal bleibt

Der Kernel besitzt die Orchestrierung. Der Kanal besitzt weiterhin:

- Plattformtransporte (Gateway, REST, WebSocket, Polling, Webhooks)
- Identitätsauflösung und Abgleich von Anzeigenamen
- Native Befehle, Slash-Befehle, Autocomplete, Modals, Buttons, Voice-Status
- Rendering von Karten, Modals und Adaptive Cards
- Medienauthentifizierung, CDN-Regeln, verschlüsselte Medien, Transkription
- Bearbeitungs-, Reaktions-, Redaktions- und Presence-APIs
- Backfill und plattformseitiger Verlaufsabruf
- Kopplungsabläufe, die plattformspezifische Verifizierung erfordern

Wenn zwei Kanäle denselben Helper für einen dieser Punkte benötigen, extrahieren Sie einen gemeinsamen SDK-Helper, anstatt ihn in den Kernel zu verschieben.

## Stabilität

`runtime.channel.turn.*` ist Teil der öffentlichen Plugin-Runtime-Oberfläche. Die Faktentypen (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) und Admission-Formen (`ChannelTurnAdmission`, `ChannelEventClass`) sind über `PluginRuntime` aus `openclaw/plugin-sdk/core` erreichbar.

Es gelten Regeln für Abwärtskompatibilität: Neue Faktenfelder sind additiv, Admission-Arten werden nicht umbenannt, und die Einstiegspunktnamen bleiben stabil. Neue Kanalanforderungen, die eine nicht additive Änderung erfordern, müssen den Migrationsprozess des Plugin-SDK durchlaufen.

## Verwandt

- [Message-Lifecycle-Refaktorierung](/de/concepts/message-lifecycle-refactor) für den geplanten Sende-/Empfangs-/Live-Lebenszyklus, der diesen Kernel umschließen wird
- [Kanal-Plugins erstellen](/de/plugins/sdk-channel-plugins) für den umfassenderen Vertrag für Kanal-Plugins
- [Plugin-Runtime-Helper](/de/plugins/sdk-runtime) für andere `runtime.*`-Oberflächen
- [Plugin-Interna](/de/plugins/architecture-internals) für Ladepipeline und Registry-Mechaniken
