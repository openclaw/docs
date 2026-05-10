---
read_when:
    - Sie erstellen ein Kanal-Plugin und möchten den gemeinsamen Lebenszyklus für eingehende Durchläufe nutzen
    - Sie migrieren einen Kanalmonitor weg von selbstgebautem Record-/Dispatch-Verbindungscode
    - Sie müssen die Phasen Annahme, Aufnahme, Klassifizierung, Vorabprüfung, Auflösung, Aufzeichnung, Weiterleitung und Finalisierung verstehen
sidebarTitle: Channel turn
summary: runtime.channel.turn -- der gemeinsame Kernel für eingehende Turns, den gebündelte und Drittanbieter-Channel-Plugins verwenden, um Agent-Turns aufzuzeichnen, weiterzuleiten und abzuschließen
title: Kern für Kanaldurchläufe
x-i18n:
    generated_at: "2026-05-10T19:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Der Channel-Turn-Kernel ist die gemeinsame eingehende Zustandsmaschine, die ein normalisiertes Plattformereignis in einen Agent-Turn umwandelt. Channel-Plugins stellen die Plattformfakten und den Zustellungs-Callback bereit. Core besitzt die Orchestrierung: Aufnahme, Klassifizierung, Vorabprüfung, Auflösung, Autorisierung, Zusammenstellung, Aufzeichnung, Dispatch und Finalisierung.

Verwenden Sie dies, wenn Ihr Plugin im Hot Path für eingehende Nachrichten liegt. Für Nicht-Nachrichtenereignisse (Slash-Befehle, Modale, Button-Interaktionen, Lifecycle-Ereignisse, Reaktionen, Sprachstatus) halten Sie diese Plugin-lokal. Der Kernel besitzt nur Ereignisse, die zu einem Agent-Text-Turn werden können.

<Info>
  Der Kernel wird über die injizierte Plugin-Runtime als `runtime.channel.turn.*` erreicht. Der Plugin-Runtime-Typ wird aus `openclaw/plugin-sdk/core` exportiert, sodass native Drittanbieter-Plugins diese Einstiegspunkte genauso verwenden können wie gebündelte Channel-Plugins.
</Info>

## Warum ein gemeinsamer Kernel

Channel-Plugins wiederholen denselben eingehenden Ablauf: normalisieren, routen, sperren, Kontext erstellen, Sitzungsmetadaten aufzeichnen, den Agent-Turn dispatchen, Zustellungsstatus finalisieren. Ohne gemeinsamen Kernel müsste eine Änderung an Mention-Gating, nur für Tools sichtbaren Antworten, Sitzungsmetadaten, ausstehendem Verlauf oder Dispatch-Finalisierung pro Channel angewendet werden.

Der Kernel hält vier Konzepte bewusst getrennt:

- `ConversationFacts`: woher die Nachricht kam
- `RouteFacts`: welcher Agent und welche Sitzung sie verarbeiten sollen
- `ReplyPlanFacts`: wohin sichtbare Antworten gehen sollen
- `MessageFacts`: welchen Inhalt und welchen ergänzenden Kontext der Agent sehen soll

Slack-DMs, Telegram-Themen, Matrix-Threads und Feishu-Themensitzungen unterscheiden diese in der Praxis alle. Sie als eine Kennung zu behandeln, führt mit der Zeit zu Abweichungen.

## Stage-Lifecycle

Der Kernel führt unabhängig vom Channel dieselbe feste Pipeline aus:

1. `ingest` -- Adapter wandelt ein rohes Plattformereignis in `NormalizedTurnInput` um
2. `classify` -- Adapter gibt an, ob dieses Ereignis einen Agent-Turn starten kann
3. `preflight` -- Adapter führt Deduplizierung, Self-Echo, Hydration, Debounce, Entschlüsselung und Vorbefüllung partieller Fakten aus
4. `resolve` -- Adapter gibt einen vollständig zusammengesetzten Turn zurück (Route, Antwortplan, Nachricht, Zustellung)
5. `authorize` -- DM-, Gruppen-, Mention- und Befehlsrichtlinien werden auf die zusammengesetzten Fakten angewendet
6. `assemble` -- `FinalizedMsgContext` wird über `buildContext` aus den Fakten erstellt
7. `record` -- eingehende Sitzungsmetadaten und letzte Route werden persistiert
8. `dispatch` -- Agent-Turn wird über den gepufferten Block-Dispatcher ausgeführt
9. `finalize` -- Adapter-`onFinalize` läuft auch bei Dispatch-Fehlern

Jede Stage gibt ein strukturiertes Logereignis aus, wenn ein `log`-Callback bereitgestellt wird. Siehe [Observability](#observability).

## Zulassungsarten

Der Kernel wirft keinen Fehler, wenn ein Turn gesperrt wird. Er gibt eine `ChannelTurnAdmission` zurück:

| Art           | Wann                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dispatch`    | Turn wird zugelassen. Agent-Turn läuft und der sichtbare Antwortpfad wird ausgeübt.                                                                    |
| `observeOnly` | Turn läuft Ende-zu-Ende, aber der Zustellungsadapter sendet nichts Sichtbares. Wird für Broadcast-Beobachter-Agenten und andere passive Multi-Agent-Abläufe verwendet. |
| `handled`     | Ein Plattformereignis wurde lokal verarbeitet (Lifecycle, Reaktion, Button, Modal). Kernel überspringt den Dispatch.                                  |
| `drop`        | Übersprungener Pfad. Optional hält `recordHistory: true` die Nachricht im ausstehenden Gruppenverlauf, damit eine künftige Mention Kontext hat.        |

Die Zulassung kann aus `classify` kommen (Ereignisklasse sagte, dass sie keinen Turn starten kann), aus `preflight` (Deduplizierung, Self-Echo, fehlende Mention mit Verlaufsaufzeichnung) oder aus `resolveTurn` selbst.

## Einstiegspunkte

Die Runtime stellt drei bevorzugte Einstiegspunkte bereit, damit Adapter auf der Ebene einsteigen können, die zum Channel passt.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Zwei ältere Runtime-Helfer bleiben für Plugin-SDK-Kompatibilität verfügbar:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
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

`run` ist die richtige Form, wenn der Channel kleine Adapterlogik hat und davon profitiert, den Lifecycle über Hooks zu besitzen.

### runAssembled

Verwenden Sie dies, wenn der Channel das Routing bereits aufgelöst, einen `FinalizedMsgContext` erstellt hat
und nur die gemeinsame Aufzeichnungs-, Antwort-Pipeline-, Dispatch- und Finalisierungsreihenfolge
benötigt. Dies ist die bevorzugte Form für einfache gebündelte eingehende Pfade, die sonst
`createChannelMessageReplyPipeline(...)`- und `runPrepared(...)`-Boilerplate wiederholen würden.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

Wählen Sie `runAssembled` statt `runPrepared`, wenn das einzige vom Channel besessene Dispatch-Verhalten
die endgültige Payload-Zustellung plus optionales Typing, Antwortoptionen, dauerhafte Zustellung
oder Fehlerprotokollierung ist.

### runPrepared

Verwenden Sie dies, wenn der Channel einen komplexen lokalen Dispatcher mit Vorschauen, Wiederholungen, Bearbeitungen oder Thread-Bootstrap hat, der im Besitz des Channels bleiben muss. Der Kernel zeichnet die eingehende Sitzung dennoch vor dem Dispatch auf und stellt ein einheitliches `DispatchedChannelTurnResult` bereit.

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

Rich Channels (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) verwenden `runPrepared`, weil ihr Dispatcher plattformspezifisches Verhalten orchestriert, das der Kernel nicht kennen darf.

### buildContext

Eine reine Funktion, die Faktenbündel in `FinalizedMsgContext` abbildet. Verwenden Sie sie, wenn Ihr Channel einen Teil der Pipeline manuell erstellt, aber eine konsistente Kontextform möchte.

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
  Veraltete SDK-Helfer wie `dispatchInboundReplyWithBase` leiten weiterhin über einen Assembled-Turn-Helfer weiter. Neuer Plugin-Code sollte `run` oder `runPrepared` verwenden.
</Note>

## Faktentypen

Die Fakten, die der Kernel von Ihrem Adapter konsumiert, sind plattformagnostisch. Übersetzen Sie Plattformobjekte in diese Formen, bevor Sie sie an den Kernel übergeben.

### NormalizedTurnInput

| Feld              | Zweck                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Stabile Nachrichten-ID für Deduplizierung und Logs                           |
| `timestamp`       | Optionale Epoch-Millisekunden                                                |
| `rawText`         | Inhalt, wie er von der Plattform empfangen wurde                             |
| `textForAgent`    | Optional bereinigter Inhalt für den Agenten (Mention-Entfernung, Typing-Trim) |
| `textForCommands` | Optionaler Inhalt für das Parsen von `/command`                              |
| `raw`             | Optionale Durchreichreferenz für Adapter-Callbacks, die das Original benötigen |

### ChannelEventClass

| Feld                   | Zweck                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Wenn false, gibt der Kernel `{ kind: "handled" }` zurück               |
| `requiresImmediateAck` | Hinweis für Adapter, die vor dem Dispatch ACKen müssen                 |

### SenderFacts

| Feld           | Zweck                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| `id`           | Stabile Plattform-Absender-ID                                          |
| `name`         | Anzeigename                                                            |
| `username`     | Handle, falls von `name` verschieden                                   |
| `tag`          | Discord-artiger Diskriminator oder Plattform-Tag                       |
| `roles`        | Rollen-IDs, verwendet für den Abgleich von Member-Rollen-Allowlists    |
| `isBot`        | True, wenn der Absender ein bekannter Bot ist (Kernel verwendet dies zum Verwerfen) |
| `isSelf`       | True, wenn der Absender der konfigurierte Agent selbst ist             |
| `displayLabel` | Vorgerendertes Label für Envelope-Text                                 |

### ConversationFacts

| Feld              | Zweck                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| `kind`            | `direct`, `group` oder `channel`                                       |
| `id`              | Conversation-ID, die für Routing verwendet wird                        |
| `label`           | Menschenlesbares Label für den Envelope                                |
| `spaceId`         | Optionale äußere Space-Kennung (Slack-Workspace, Matrix-Homeserver)    |
| `parentId`        | Äußere Conversation-ID, wenn dies ein Thread ist                       |
| `threadId`        | Thread-ID, wenn diese Nachricht innerhalb eines Threads ist            |
| `nativeChannelId` | Plattformnative Channel-ID, wenn sie sich von der Routing-ID unterscheidet |
| `routePeer`       | Peer, der für den `resolveAgentRoute`-Lookup verwendet wird            |

### RouteFacts

| Feld                    | Zweck                                                           |
| ----------------------- | --------------------------------------------------------------- |
| `agentId`               | Agent, der diesen Turn verarbeiten soll                         |
| `accountId`             | Optionale Überschreibung (Kanäle mit mehreren Accounts)         |
| `routeSessionKey`       | Für Routing verwendeter Sitzungsschlüssel                       |
| `dispatchSessionKey`    | Beim Dispatch verwendeter Sitzungsschlüssel, wenn er vom Routing-Schlüssel abweicht |
| `persistedSessionKey`   | Sitzungsschlüssel, der in persistierte Sitzungsmetadaten geschrieben wird |
| `parentSessionKey`      | Übergeordnete Sitzung für verzweigte/Thread-Sitzungen           |
| `modelParentSessionKey` | Modellseitige übergeordnete Sitzung für verzweigte Sitzungen    |
| `mainSessionKey`        | Haupt-DM-Besitzer-Pin für direkte Unterhaltungen                |
| `createIfMissing`       | Erlaubt dem Aufzeichnungsschritt, eine fehlende Sitzungszeile zu erstellen |

### ReplyPlanFacts

| Feld                      | Zweck                                                    |
| ------------------------- | -------------------------------------------------------- |
| `to`                      | Logisches Antwortziel, das in den Kontext `To` geschrieben wird |
| `originatingTo`           | Ursprüngliches Kontextziel (`OriginatingTo`)             |
| `nativeChannelId`         | Plattformnative Kanal-ID für die Zustellung             |
| `replyTarget`             | Endgültiges sichtbares Antwortziel, wenn es von `to` abweicht |
| `deliveryTarget`          | Zustellungsüberschreibung auf niedrigerer Ebene          |
| `replyToId`               | ID der zitierten/verankerten Nachricht                   |
| `replyToIdFull`           | Vollständige zitierte ID, wenn die Plattform beides hat  |
| `messageThreadId`         | Thread-ID zum Zustellungszeitpunkt                       |
| `threadParentId`          | ID der übergeordneten Nachricht des Threads              |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` oder `none`       |

### AccessFacts

`AccessFacts` enthält die booleschen Werte, die die Autorisierungsphase benötigt. Der Identitätsabgleich bleibt im Kanal: Der Kernel verarbeitet nur das Ergebnis.

| Feld       | Zweck                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM-Erlaubnis-/Pairing-/Ablehnungsentscheidung und `allowFrom`-Liste       |
| `group`    | Gruppenrichtlinie, Routing-Erlaubnis, Absendererlaubnis, Allowlist, Erwähnungsanforderung |
| `commands` | Befehlsautorisierung über konfigurierte Autorisierer hinweg               |
| `mentions` | Ob Erwähnungserkennung möglich ist und ob der Agent erwähnt wurde         |

### MessageFacts

| Feld             | Zweck                                                          |
| ---------------- | -------------------------------------------------------------- |
| `body`           | Endgültiger Envelope-Text (formatiert)                         |
| `rawBody`        | Roher eingehender Text                                         |
| `bodyForAgent`   | Text, den der Agent sieht                                      |
| `commandBody`    | Für Befehlsparsing verwendeter Text                            |
| `envelopeFrom`   | Vorgerendertes Absenderlabel für den Envelope                  |
| `senderLabel`    | Optionale Überschreibung für den gerenderten Absender          |
| `preview`        | Kurze redigierte Vorschau für Logs                             |
| `inboundHistory` | Aktuelle eingehende Verlaufseinträge, wenn der Kanal einen Puffer führt |

### SupplementalContextFacts

Ergänzender Kontext umfasst Zitat-, Weiterleitungs- und Thread-Bootstrap-Kontext. Der Kernel wendet die konfigurierte `contextVisibility`-Richtlinie an. Der Kanaladapter stellt nur Fakten und `senderAllowed`-Flags bereit, damit die kanalübergreifende Richtlinie konsistent bleibt.

### InboundMediaFacts

Medien sind faktenförmig. Plattform-Download, Authentifizierung, SSRF-Richtlinie, CDN-Regeln und Entschlüsselung bleiben kanal-lokal. Der Kernel ordnet Fakten `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` und `MediaTranscribedIndexes` zu.

## Adapter-Vertrag

Für vollständiges `run` hat der Adapter die folgende Form:

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

`onFinalize` läuft bei jedem Ergebnis, einschließlich Dispatch-Fehlern. Verwenden Sie es, um ausstehenden Gruppenverlauf zu löschen, Ack-Reaktionen zu entfernen, Statusindikatoren zu stoppen und lokalen Zustand zu flushen.

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

`deliver` wird einmal pro gepuffertem Antwort-Chunk aufgerufen. Während der Migration des Nachrichtenlebenszyklus ist die Zustellung zusammengesetzter Kanal-Turns standardmäßig kanalverwaltet: Ein ausgelassenes `durable`-Feld bedeutet, dass der Kernel `deliver` direkt aufrufen muss und nicht über die generische ausgehende Zustellung routen darf. Setzen Sie `durable` erst, nachdem der Kanal geprüft wurde, um nachzuweisen, dass der generische Sendepfad das alte Zustellungsverhalten beibehält, einschließlich Antwort-/Thread-Zielen, Medienverarbeitung, Caches für gesendete Nachrichten/Selbst-Echos, Statusbereinigung und zurückgegebenen Nachrichten-IDs. `durable: false` bleibt eine Kompatibilitätsschreibweise für „den kanalverwalteten Callback verwenden“, aber nicht migrierte Kanäle sollten es nicht hinzufügen müssen. Geben Sie Plattform-Nachrichten-IDs zurück, wenn der Kanal sie hat, damit der Dispatcher Thread-Anker beibehalten und spätere Chunks bearbeiten kann; neuere Zustellungspfade sollten außerdem `receipt` zurückgeben, damit Wiederherstellung, Vorschau-Finalisierung und Duplikatunterdrückung von `messageIds` weg migrieren können. Geben Sie für reine Beobachtungs-Turns `{ visibleReplySent: false }` zurück oder verwenden Sie `createNoopChannelTurnDeliveryAdapter()`.

Kanäle, die `runPrepared` mit einem vollständig kanalverwalteten Dispatcher verwenden, haben keinen `ChannelTurnDeliveryAdapter`. Diese Dispatcher sind standardmäßig nicht dauerhaft. Sie sollten ihren direkten Zustellungspfad beibehalten, bis sie sich explizit für den neuen Sendekontext mit vollständigem Ziel, replay-sicherem Adapter, Receipt-Vertrag und kanalbezogenen Side-Effect-Hooks entscheiden.

Öffentliche Kompatibilitätshelfer wie `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` und Direct-DM-Helfer müssen während der Migration verhaltenserhaltend bleiben. Sie dürfen die generische dauerhafte Zustellung nicht vor aufruferverwalteten `deliver`- oder `reply`-Callbacks aufrufen.

## Aufzeichnungsoptionen

Die Aufzeichnungsphase kapselt `recordInboundSession`. Die meisten Kanäle können die Standardwerte verwenden. Überschreiben Sie sie über `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Der Dispatcher wartet auf die Aufzeichnungsphase. Wenn die Aufzeichnung eine Ausnahme auslöst, führt der Kernel `onPreDispatchFailure` aus (wenn es für `runPrepared` bereitgestellt wurde) und löst die Ausnahme erneut aus.

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

Protokollierte Phasen: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Vermeiden Sie das Protokollieren roher Texte; verwenden Sie `MessageFacts.preview` für kurze redigierte Vorschauen.

## Was kanal-lokal bleibt

Der Kernel besitzt die Orchestrierung. Der Kanal besitzt weiterhin:

- Plattformtransporte (Gateway, REST, WebSocket, Polling, Webhooks)
- Identitätsauflösung und Abgleich von Anzeigenamen
- Native Befehle, Slash-Befehle, Autocomplete, Modale, Buttons, Sprachstatus
- Rendering von Karten, Modalen und adaptiven Karten
- Medienauthentifizierung, CDN-Regeln, verschlüsselte Medien, Transkription
- APIs für Bearbeitung, Reaktion, Redigierung und Präsenz
- Backfill und plattformseitiges Abrufen des Verlaufs
- Pairing-Flows, die plattformspezifische Verifizierung erfordern

Wenn zwei Kanäle denselben Helfer für eines davon benötigen, extrahieren Sie stattdessen einen gemeinsamen SDK-Helfer, anstatt ihn in den Kernel zu verschieben.

## Stabilität

`runtime.channel.turn.*` ist Teil der öffentlichen Plugin-Runtime-Oberfläche. Die Faktentypen (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) und Admission-Formen (`ChannelTurnAdmission`, `ChannelEventClass`) sind über `PluginRuntime` aus `openclaw/plugin-sdk/core` erreichbar.

Es gelten Regeln für Abwärtskompatibilität: Neue Faktenfelder sind additiv, Admission-Arten werden nicht umbenannt, und die Namen der Einstiegspunkte bleiben stabil. Neue Kanalanforderungen, die eine nicht additive Änderung erfordern, müssen den Plugin-SDK-Migrationsprozess durchlaufen.

## Verwandte Themen

- [Nachrichtenlebenszyklus-Refaktorierung](/de/concepts/message-lifecycle-refactor) für den geplanten Sende-/Empfangs-/Live-Lebenszyklus, der diesen Kernel kapseln wird
- [Kanal-Plugins erstellen](/de/plugins/sdk-channel-plugins) für den breiteren Vertrag von Kanal-Plugins
- [Plugin-Runtime-Helfer](/de/plugins/sdk-runtime) für andere `runtime.*`-Oberflächen
- [Plugin-Interna](/de/plugins/architecture-internals) für Ladepipeline und Registry-Mechanik
