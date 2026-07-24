---
read_when:
    - Sie entwickeln ein neues Plugin für einen Nachrichtenkanal
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapteroberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Channel-Plugins entwickeln
x-i18n:
    generated_at: "2026-07-24T04:49:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f287892d3354362d1770e0a70f79f61b812ee6ad213ca5d82f9764e441eff130
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Dieser Leitfaden erstellt ein Channel-Plugin, das OpenClaw mit einer Messaging-
Plattform verbindet: DM-Sicherheit, Kopplung, Antwort-Threading und ausgehende Nachrichten.

<Info>
  Sind OpenClaw-Plugins neu für Sie? Lesen Sie zuerst [Erste Schritte](/de/plugins/building-plugins),
  um sich mit der Paketstruktur und der Einrichtung des Manifests vertraut zu machen.
</Info>

## Zuständigkeiten Ihres Plugins

Channel-Plugins implementieren keine Tools zum Senden, Bearbeiten oder Reagieren; der Core stellt ein
gemeinsames `message`-Tool bereit. Ihr Plugin ist zuständig für:

- **Konfiguration** - Kontoauflösung und Einrichtungsassistent
- **Sicherheit** - DM-Richtlinie und Positivlisten
- **Kopplung** - DM-Genehmigungsablauf
- **Sitzungsgrammatik** - wie Provider-spezifische Konversations-IDs Basis-
  Chats, Thread-IDs und übergeordnete Rückfalloptionen zugeordnet werden
- **Ausgehend** - Senden von Text, Medien und Umfragen an die Plattform
- **Threading** - wie Antworten in Threads eingeordnet werden
- **Heartbeat-Tippanzeige** - optionale Tipp-/Beschäftigt-Signale für Heartbeat-Zustellungs-
  ziele

Der Core ist zuständig für das gemeinsame Nachrichtentool, die Prompt-Verknüpfung, die äußere Form des Sitzungsschlüssels,
die generische `:thread:`-Buchführung und den Versand.

## Nachrichtenadapter

Stellen Sie einen `message`-Adapter mit `defineChannelMessageAdapter` aus
`openclaw/plugin-sdk/channel-outbound` bereit. Deklarieren Sie nur die dauerhaften Fähigkeiten für den endgültigen Versand,
die Ihr nativer Transport tatsächlich unterstützt, abgesichert durch einen Vertragstest,
der den nativen Nebeneffekt und die zurückgegebene Empfangsbestätigung nachweist. Leiten Sie Text-/Medien-
sendungen an dieselben Transportfunktionen weiter, die der bisherige `outbound`-Adapter verwendet. Den
vollständigen API-Vertrag, die Fähigkeitsmatrix, Regeln für Empfangsbestätigungen, den Abschluss von Live-Vorschauen,
die Richtlinie für Empfangsbestätigungen, Tests und die Migrationstabelle finden Sie unter
[API für ausgehende Channel-Nachrichten](/de/plugins/sdk-channel-outbound).

Wenn Ihr vorhandener `outbound`-Adapter bereits über die richtigen Sendemethoden und
Fähigkeitsmetadaten verfügt, leiten Sie den `message`-Adapter mit
`createChannelMessageAdapterFromOutbound(...)` ab, statt eine weitere
Bridge von Hand zu schreiben. Adapter-Sendevorgänge geben `MessageReceipt`-Werte zurück. Leiten Sie bei bisherigen IDs
diese mit `listMessageReceiptPlatformIds(...)` oder
`resolveMessageReceiptPrimaryId(...)` ab, statt parallele `messageIds`-
Felder beizubehalten.

Deklarieren Sie Live- und Finalizer-Fähigkeiten präzise – der Core verwendet sie, um zu entscheiden,
was ein Channel leisten kann, und Abweichungen zwischen dem deklarierten und tatsächlichen Verhalten führen zum
Fehlschlagen eines Vertragstests:

| Oberfläche                            | Werte                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Channels, die eine Entwurfsvorschau direkt abschließen, sollten die Laufzeitlogik
über `defineFinalizableLivePreviewAdapter(...)` und
`deliverWithFinalizableLivePreviewAdapter(...)` leiten und die deklarierten
Fähigkeiten durch Tests für `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
und `verifyChannelMessageLiveFinalizerProofs(...)` absichern, damit das native Verhalten
für Vorschau, Fortschritt, Bearbeitung, Rückfall/Beibehaltung, Bereinigung und Empfangsbestätigung nicht
unbemerkt abweichen kann.

Eingehende Empfänger, die Plattformbestätigungen verzögern, sollten
`message.receive.defaultAckPolicy` und `supportedAckPolicies` deklarieren, statt den
Zeitpunkt der Bestätigung in einem lokalen Monitorzustand zu verbergen. Decken Sie jede deklarierte Richtlinie mit
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ab.

Bisherige Antworthelfer wie `dispatchInboundReplyWithBase` und
`recordInboundSessionAndDispatchReply` bleiben für kompatible
Dispatcher verfügbar. Verwenden Sie sie nicht für neuen Channel-Code; beginnen Sie stattdessen mit dem `message`-
Adapter, Empfangsbestätigungen und Lebenszyklushelfern für Empfang und Versand auf
`openclaw/plugin-sdk/channel-outbound`.

### Eingehender Eingang (experimentell)

Channels, die die Autorisierung eingehender Nachrichten migrieren, können den experimentellen
`openclaw/plugin-sdk/channel-ingress-runtime`-Unterpfad aus den Empfangs-
pfaden der Laufzeit verwenden. Er akzeptiert Plattformfakten, unverarbeitete Positivlisten, Routingdeskriptoren, Befehls-
fakten und die Konfiguration von Zugriffsgruppen und gibt anschließend Projektionen für Absender, Route, Befehl und Aktivierung
sowie den geordneten Eingangsgraphen zurück, während Plattformabfragen und Neben-
effekte im Plugin verbleiben. Behalten Sie die Normalisierung der Plugin-Identität in dem
Deskriptor bei, den Sie an den Resolver übergeben; serialisieren Sie keine unverarbeiteten Vergleichswerte aus
dem aufgelösten Zustand oder der Entscheidung. Informationen zum API-Design,
zur Zuständigkeitsgrenze und zu den Testerwartungen finden Sie unter
[API für eingehende Channel-Nachrichten](/de/plugins/sdk-channel-ingress).

### Dauerhafter Eingang und Replay-Deduplizierung

Channels, die einen dauerhaften Eingang einführen, sollten `createChannelIngressMonitor`
aus `openclaw/plugin-sdk/channel-outbound` verwenden, sofern sie keinen wesentlich
anderen Zulassungs- oder Pumpvertrag benötigen. Stellen Sie den unverarbeiteten Transportumschlag an einem
einzigen Engpass des Empfangs in die Warteschlange ein (keine Normalisierung zum Empfangszeitpunkt), machen Sie bei Webhook-Transporten
die Transportbestätigung vom dauerhaften Anhängen abhängig, leiten Sie pro Konversation eine
serialisierte Lane ab und markieren Sie das Ereignis bei der Übernahme durch den Dispatcher als abgeschlossen.
Der Primärschlüssel der Warteschlange ist `(queue_name, event_id)`, und beim Abschluss
wird der Datensatz mit einem Tombstone versehen, statt ihn zu löschen, sodass eine verspätete erneute Plattformzustellung
derselben `event_id` für das Aufbewahrungsfenster des Tombstones dauerhaft abgelehnt wird.
Informationen zur Monitor-API und zum Vertrag für das Herunterfahren finden Sie unter
[API für ausgehende Channel-Nachrichten](/de/plugins/sdk-channel-outbound#durable-ingress-monitors).

Dieser Tombstone bildet die Schichtungsregel für Replay-Schutzmechanismen
(`openclaw/plugin-sdk/persistent-dedupe`): Ein geleerter Channel behält nur dann einen separaten
Replay-Schutz bei, wenn dessen Identität oder Aufbewahrungsdauer über die der Warteschlange hinausgeht
– einen logischen Nachrichtenschlüssel, der sich von der Transportzustellungs-ID unterscheidet (Telegram
dedupliziert `chat_id:message_id`, weil Debounce-Zusammenführungen eine Nachricht
unter einer neuen `update_id` erneut erscheinen lassen können), oder ein längeres Fenster als die Tombstone-
Aufbewahrungsdauer des Channels. Wenn Ihr Schutzschlüssel der `event_id` des Drains entsprechen würde, löschen Sie den
Schutz bei der Einführung des Drains und dimensionieren Sie stattdessen `completedTtlMs`/`completedMaxEntries`
so, dass das bisherige Schutzfenster abgedeckt wird. Schutzmaßnahmen ohne Deduplizierung, etwa Alters-
grenzen, sind von dieser Regel unabhängig. Stabile IDs ausgehender Nachrichten verwenden die gemeinsame
Registrierung für ausgehende Echos aus `openclaw/plugin-sdk/channel-outbound` statt eines
Channel-lokalen TTL-Caches.

#### Transportklassen und Aufbewahrung

Klassifizieren Sie einen Transport anhand der Wiederherstellungsgarantie an seiner Empfangsgrenze:

- **Bestätigungsgebundene Webhook- oder Ereigniszustellung:** Bestätigen Sie den Empfang oder geben Sie nur dann Erfolg zurück,
  nachdem das dauerhafte Anhängen abgeschlossen ist. Bei einem Fehler beim Anhängen muss die Zustellung weiterhin
  für einen erneuten Versuch infrage kommen oder die Empfangsgrenze muss fehlschlagen. Diese Klasse umfasst Slack, SMS, Zalo,
  Microsoft Teams, Google Chat, LINE und Synology Chat.
- **Abgewartete Polling- oder Stream-Zustellung:** Setzen Sie den Remote-Cursor fort oder senden Sie die
  Transportbestätigung erst nach dem Anhängen. Wenn kein expliziter Cursor vorhanden ist, halten Sie den
  Empfangs-Callback serialisiert und warten Sie ihn ab, sodass ein Fehler beim Anhängen nicht dazu führen kann, dass die
  Empfangsschleife vorauseilt. Telegram-Polling, Signal und Tlon verwenden diese Klasse;
  die Telegram-Webhook-Zustellung folgt der oben beschriebenen bestätigungsgebundenen Regel.
- **Sockets ohne Replay:** IRC, Mattermost, Twitch und Zalo Personal können die
  Plattform nicht zur erneuten Zustellung eines akzeptierten Ereignisses auffordern. Ihre dauerhafte Warteschlange schützt das
  Zeitfenster eines Prozessabsturzes und unterstützt die lokale Wiederherstellung nach einem Neustart; Abschluss-
  Tombstones sind gegen Plattform-Replays nahezu wirkungslos.

Verwenden Sie 30 Tage als flottenweite Konvention für die Tombstone-TTL, nicht als SDK-Standardwert. Ein
Zustellungswiederholungsfenster mit hohem Volumen verwendet normalerweise eine Obergrenze von 20,000 abgeschlossenen Einträgen;
abgewartete Transporte und Transporte ohne Replay mit geringerem Volumen verwenden normalerweise 1,000-2,000.
Zu den aktuellen Ausnahmen gehören die Obergrenzen von 4,096 Einträgen bei LINE, die TTL von 24 Stunden für abgeschlossene
SMS-Einträge und die ausschließlich durch eine Obergrenze begrenzte Aufbewahrung abgeschlossener Tlon-Einträge. Obergrenzen für fehlgeschlagene Datensätze können ebenfalls niedriger
als die Obergrenzen für abgeschlossene Datensätze sein. Sowohl TTL als auch Obergrenze entfernen Datensätze, sodass die effektive Aufbewahrung endet,
sobald die erste Grenze erreicht ist. Weichen Sie nur aufgrund eines dokumentierten Wiederholungszeitraums der Plattform,
eines beibehaltenen ausgelieferten Replay-Schutzfensters, des erwarteten Volumens oder Speicherplatzbudgets
oder eines Transports ohne Replay davon ab, und sichern Sie den Aufbewahrungsvertrag durch Tests ab.

#### Mindestens einmal ausgeführte Nebeneffekte

Der Drain-Dispatcher führt Befehlsnebeneffekte aus, bevor der Eingangsdatensatz seinen
Abschluss-Tombstone erreicht. Ein Prozessabsturz zwischen diesen Schritten spielt den Datensatz erneut ab und
kann den Nebeneffekt erneut ausführen. Dieses Absturzfenster mit mindestens einmaliger Ausführung ist der
Standardvertrag. Verwenden Sie für nicht idempotente Arbeiten wie Konfigurationsschreibvorgänge, Speicher-
bereinigungen oder sichtbare Bestätigungen außerhalb der Antwort-Lane
`createIngressEffectOnce(...)` aus
`openclaw/plugin-sdk/ingress-effect-once`. Übergeben Sie jedem Aufruf die stabile Eingangs-
`eventId` sowie einen Effektnamen. Erstellen Sie pro Eingangswarteschlange/Konto einen Helfer und
verwenden Sie eine stabile, eindeutige `namespacePrefix` für diesen Geltungsbereich, da Transportereignis-
IDs warteschlangenlokal sein können. Der Helfer schreibt seinen dauerhaften Anspruch erst fest, nachdem der
Effekt erfolgreich war; ein ausgelöster Effekt gibt den Anspruch frei, sodass ein erneuter Drain-Versuch
ihn erneut ausführen kann, während gleichzeitige Aufrufer auf den aktiven Anspruch warten. Fehler im dauerhaften
Zustand rufen `onDiskError` auf, sofern angegeben, und lehnen ab, statt auf den Prozessspeicher
zurückzufallen.

Setzen Sie `ttlMs` des Helfers mindestens auf die Aufbewahrungsdauer des Eingangs-Tombstones des Channels
zuzüglich der maximalen Verzögerung zwischen dem Festschreiben des Effekts und dem Abschluss des Datensatzes, einschließlich
begrenzter Ausfallzeit und erneuter Drain-Versuche. Die TTL des Effektdatensatzes beginnt beim Festschreiben,
während die Tombstone-Aufbewahrung später beim Abschluss beginnt; wenn die Lebensdauer ausstehender Datensätze
unbegrenzt ist, kann keine endliche TTL beliebige Ausfallzeiten abdecken. Nachdem der Tombstone
den Datensatz nicht mehr erneut abspielen kann, sind ältere Effektdatensätze unnötiger Ballast. Dimensionieren Sie
`stateMaxEntries` für jeden eindeutigen Ereignis-/Effektschlüssel, der in diesem
Aufbewahrungsfenster vorhanden sein kann, wobei die Obergrenze der Warteschlange für abgeschlossene Einträge und die
maximale Anzahl von Effekten pro Ereignis zu berücksichtigen sind. Eine niedrigere Obergrenze entfernt den ältesten Datensatz vor Ablauf seiner TTL
und ermöglicht die erneute Ausführung dieses Effekts. Verbleibende Fenster mit mindestens einmaliger Ausführung bleiben bestehen,
wenn der Prozess beendet wird oder die Persistierung fehlschlägt, nachdem der Effekt erfolgreich war, aber bevor
der Anspruch festgeschrieben wurde, oder wenn der Datensatz abläuft, während sein Eingangsdokument noch
aussteht.

#### Kontospezifischer Neustartvertrag

Änderungen an der Channel-Konfiguration starten standardmäßig den gesamten Channel neu. Ein Channel mit mehreren Konten
darf `reload.accountScopedRestart: true` nur setzen, wenn die Konfigurations-
auflösung Channel-weite gemeinsame Felder sowie das ausgewählte Konto liest, niemals ein
benachbartes Konto, und der Gateway eine einzelne `(channel, accountId)`-
Laufzeit stoppen und starten kann, ohne benachbarte Laufzeiten zu ersetzen.

Der begrenzte Pfad gilt nur für Änderungen unter
`channels.<channel>.accounts.<non-default-id>.*`. Änderungen an gemeinsamen Channel-
Feldern, `accounts.default`, entfernten oder nicht auflösbaren Konten sowie gemischte Änderungen,
die sich auf die Vererbung auswirken können, werden zu einem Neustart des gesamten Channels hochgestuft. Plugins,
die sich nicht dafür entscheiden, verwenden stets den Pfad für den gesamten Channel.

Bei Channels, die den dauerhaften Eingangs-Drain verwenden, muss der Stopppfad des Kontomonitors
zunächst alle akzeptierten Transportzulassungen abschließen und anschließend seinen
Drain freigeben und abwarten. Beim Starten des Kontos wird dieselbe kontoschlüsselbasierte Warteschlange geöffnet, deren anfänglicher
Drain nicht versandte dauerhafte Datensätze wiederherstellt. Fügen Sie keinen zweiten neustartspezifischen
Replay-Durchlauf hinzu; die Wiederherstellung der Warteschlange ist der kanonische Neustartpfad.

Behandeln Sie dieses Flag als Fähigkeitszusage, nicht als Leistungspräferenz. Vertrags-
tests sollten nachweisen, dass das Hinzufügen und Bearbeiten eines benannten Kontos die aufgelöste
Konfiguration eines benachbarten Kontos unverändert lässt, das Stoppen eines Kontos nur den Monitor und Drain dieses Kontos
abschließt und ein neuer Monitor die Datensätze dieses Kontos genau
einmal wiederherstellt. Wenn eine Garantie nicht nachgewiesen werden kann, lassen Sie das Flag weg.

### Tippanzeigen

Wenn Ihr Channel Tippanzeigen außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` im Channel-Plugin bereit. Der Core ruft dies mit dem
aufgelösten Heartbeat-Zustellungsziel auf, bevor der Heartbeat-Modelllauf beginnt, und
verwendet den gemeinsamen Lebenszyklus für Keepalive und Bereinigung der Tippanzeige. Fügen Sie
`heartbeat.clearTyping(...)` hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

### Parameter für Medienquellen

Wenn Ihr Channel dem Nachrichtentool Parameter hinzufügt, die Medienquellen enthalten, stellen Sie
diese Parameternamen über `plugin.actions.describeMessageTool(...).mediaSourceParams` bereit.
Der Core verwendet diese explizite Liste zur Normalisierung von Sandbox-Pfaden und für die Richtlinie zum Zugriff auf
ausgehende Medien, sodass Plugins keine Sonderfälle im gemeinsamen Core für
Provider-spezifische Parameter für Avatare, Anhänge oder Titelbilder benötigen.

Bevorzugen Sie eine aktionsbasierte Zuordnung wie `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
damit nicht zusammenhängende Aktionen nicht die Medienargumente einer anderen Aktion übernehmen. Ein flaches Array
funktioniert weiterhin für Parameter, die absichtlich von jeder bereitgestellten Aktion gemeinsam genutzt werden.

Kanäle, die eine temporäre öffentliche URL für einen plattformseitigen Medienabruf
bereitstellen müssen, können `createHostedOutboundMediaStore(...)` aus
`openclaw/plugin-sdk/outbound-media` mit Plugin-Zustandsspeichern verwenden. Behalten Sie die plattformspezifische
Routenanalyse und Token-Durchsetzung im Kanal-Plugin; der gemeinsame Helfer
ist nur für das Laden von Medien, Ablaufmetadaten, Chunk-Zeilen und die Bereinigung zuständig.

### Native Nutzdatenformung

Wenn Ihr Kanal eine Provider-spezifische Formung für `message(action="send")` benötigt,
bevorzugen Sie `actions.prepareSendPayload(...)`. Legen Sie native Karten, Blöcke, Einbettungen oder
andere persistente Daten unter `payload.channelData.<channel>` ab und lassen Sie den Core
sie über den Ausgangs-/Nachrichtenadapter senden. Verwenden Sie `actions.handleAction(...)` für das Senden
nur als Kompatibilitäts-Fallback für Nutzdaten, die nicht serialisiert und
erneut versucht werden können.

### Grammatik für Sitzungskonversationen

Wenn Ihre Plattform zusätzlichen Geltungsbereich in Konversations-IDs speichert, behalten Sie diese Analyse
mit `messaging.resolveSessionConversation(...)` im Plugin. Dies ist der
kanonische Hook für die Zuordnung von `rawId` zur Basis-Konversations-ID, zur optionalen
Thread-ID, zu explizitem `baseConversationId` und zu beliebigen
`parentConversationCandidates`. Wenn Sie `parentConversationCandidates` zurückgeben,
ordnen Sie sie vom engsten übergeordneten Element bis zur allgemeinsten/Basis-Konversation.

`messaging.resolveParentConversationCandidates(...)` ist ein veralteter
Kompatibilitäts-Fallback für Plugins, die nur übergeordnete Fallbacks zusätzlich zur
generischen/unverarbeiteten ID benötigen. Wenn beide Hooks vorhanden sind, verwendet der Core zuerst
`resolveSessionConversation(...).parentConversationCandidates` und greift nur dann
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische
Hook sie auslässt.

Gebündelte Plugins, die dieselbe Analyse benötigen, bevor die Kanalregistrierung startet,
können eine `session-key-api.ts`-Datei auf oberster Ebene mit einem entsprechenden
`resolveSessionConversation(...)`-Export bereitstellen (siehe die Feishu- und Telegram-
Plugins). Der Core verwendet diese bootstrap-sichere Oberfläche nur, wenn die Laufzeit-Plugin-
Registrierung noch nicht verfügbar ist.

Verwenden Sie `openclaw/plugin-sdk/channel-route`, wenn Plugin-Code routenähnliche
Felder normalisieren, einen untergeordneten Thread mit seiner übergeordneten Route vergleichen oder einen
stabilen Deduplizierungsschlüssel aus `{ channel, to, accountId, threadId }` erstellen muss. Der Helfer
normalisiert numerische Thread-IDs genauso wie der Core; bevorzugen Sie ihn daher gegenüber Ad-hoc-
Vergleichen mit `String(threadId)`. Plugins mit Provider-spezifischer Zielgrammatik
sollten `messaging.resolveOutboundSessionRoute(...)` bereitstellen, damit der Core
Provider-native Sitzungs- und Thread-Identitäten ohne Parser-Shims erhält.

### Unterstützung kontobezogener Konversationsbindungen

Setzen Sie `conversationBindings.supportsCurrentConversationBinding`, wenn der Kanal
generische Bindungen für die aktuelle Konversation unterstützt. `createChatChannelPlugin(...)`
setzt diese statische Fähigkeit standardmäßig auf `true`.

Wenn sich die Unterstützung je nach konfiguriertem Konto unterscheidet, implementieren Sie außerdem
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Der Core wertet diesen synchronen Hook erst aus, nachdem die statische Fähigkeit
aktiviert wurde. Die Rückgabe von `false` macht generische Fähigkeiten sowie
Bindungs-, Such-, Auflistungs-, Aktualisierungs- und Aufhebungsoperationen für die aktuelle Konversation für dieses Konto nicht verfügbar.
Wird der Hook ausgelassen, gilt die statische Fähigkeit für jedes Konto.

Ermitteln Sie die Antwort aus der bereits geladenen Kontokonfiguration oder dem Laufzeitzustand. Dieser
Hook steuert nur generische Bindungen für die aktuelle Konversation; er ersetzt weder
konfigurierte Bindungsregeln noch Plugin-eigenes Sitzungsrouting. Vertragstests
sollten über den von
`openclaw/plugin-sdk/channel-core` exportierten Vertrag `ChannelPlugin["conversationBindings"]` mindestens ein unterstütztes und ein nicht unterstütztes Konto
abdecken.

## Genehmigungen und Kanalfähigkeiten

Die meisten Kanal-Plugins benötigen keinen genehmigungsspezifischen Code. Der Core verwaltet
`/approve` im selben Chat, gemeinsame Nutzdaten für Genehmigungsschaltflächen und die generische Fallback-Zustellung.
`ChannelPlugin.approvals` wurde entfernt; legen Sie Fakten zu Genehmigungszustellung, nativer Darstellung, Rendering und Authentifizierung
stattdessen in einem einzigen `approvalCapability`-Objekt ab. `plugin.auth` dient nur
zur An- und Abmeldung – der Core liest aus diesem Objekt keine Hooks zur Genehmigungsauthentifizierung mehr.

Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder die Unterdrückung von Fallbacks
und `approvalCapability.render` nur, wenn ein Kanal tatsächlich
benutzerdefinierte Genehmigungsnutzdaten anstelle des gemeinsamen Renderers benötigt.

### Genehmigungsauthentifizierung

- `approvalCapability.authorizeActorAction` und
  `approvalCapability.getActionAvailabilityState` bilden die kanonische
  Schnittstelle für die Genehmigungsauthentifizierung.
- Verwenden Sie `getActionAvailabilityState` für die Verfügbarkeit der Genehmigungsauthentifizierung im selben Chat.
  Halten Sie konfigurierte Genehmigende für `/approve` verfügbar, selbst wenn die native Zustellung
  deaktiviert ist; verwenden Sie stattdessen den Zustand der nativen initiierenden Oberfläche für Hinweise
  zur Zustellung und Einrichtung.
- Wenn Ihr Kanal native Ausführungsgenehmigungen bereitstellt, verwenden Sie
  `approvalCapability.getExecInitiatingSurfaceState` für den Zustand
  der initiierenden Oberfläche/des nativen Clients, wenn dieser von der Genehmigungsauthentifizierung
  im selben Chat abweicht. Der Core verwendet diesen ausführungsspezifischen Hook, um `enabled` von
  `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Kanal native Ausführungsgenehmigungen
  unterstützt, und den Kanal in Fallback-Hinweise für native Clients aufzunehmen.
  `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für
  den üblichen Fall aus.
- Wenn ein Kanal aus der vorhandenen Konfiguration stabile, eigentümerähnliche Direktnachrichtenidentitäten ableiten kann,
  verwenden Sie `createResolvedApproverActionAuthAdapter` aus
  `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken,
  ohne genehmigungsspezifische Core-Logik hinzuzufügen.
- Wenn eine benutzerdefinierte Genehmigungsauthentifizierung absichtlich nur den Fallback im selben Chat zulässt, geben Sie
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` aus
  `openclaw/plugin-sdk/approval-auth-runtime` zurück; andernfalls behandelt der Core das
  Ergebnis als explizite Autorisierung der genehmigenden Person.
- Wenn ein kanaleigener nativer Callback Genehmigungen direkt auflöst, verwenden Sie
  vor dem Auflösen `isImplicitSameChatApprovalAuthorization(...)`, damit der implizite
  Fallback weiterhin die normale Akteursautorisierung des Kanals durchläuft.

### Lebenszyklus der Nutzdaten und Einrichtungshinweise

- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder
  `outbound.beforeDeliverPayload` für kanalspezifisches Verhalten im Nutzdatenlebenszyklus,
  etwa zum Ausblenden doppelter lokaler Genehmigungsaufforderungen oder zum Senden von
  Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Kanal möchte,
  dass die Antwort für den deaktivierten Pfad die genauen Konfigurationsoptionen erläutert, die zur Aktivierung
  nativer Ausführungsgenehmigungen erforderlich sind. Der Hook empfängt `{ channel, channelLabel, accountId }`;
  Kanäle mit benannten Konten sollten kontobezogene Pfade wie
  `channels.<channel>.accounts.<id>.execApprovals.*` anstelle von
  Standardwerten auf oberster Ebene darstellen.
- Verwenden Sie `approvalCapability.describePluginApprovalSetup`, wenn Hinweise zu Fehlern bei Plugin-Genehmigungen
  bei Fehlern ohne Route und bei Zeitüberschreitungen sicher angezeigt werden können.
  `createApproverRestrictedNativeApprovalCapability(...)` leitet dies nicht
  aus `describeExecApprovalSetup` ab; übergeben Sie denselben Helfer nur dann ausdrücklich,
  wenn Plugin- und Ausführungsgenehmigungen tatsächlich dieselbe native Einrichtung verwenden.

### Native Genehmigungszustellung

Wenn ein Kanal native Genehmigungszustellung benötigt, konzentrieren Sie den Kanalcode auf
Zielnormalisierung sowie Transport- und Darstellungsfakten. Verwenden Sie
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` und
`createApproverRestrictedNativeApprovalCapability` aus
`openclaw/plugin-sdk/approval-runtime`. Legen Sie die kanalspezifischen Fakten hinter
`approvalCapability.nativeRuntime` ab, idealerweise über
`createChannelApprovalNativeRuntimeAdapter(...)` oder
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit der Core den
Handler zusammensetzen und die Filterung von Anfragen, das Routing, die Deduplizierung, den Ablauf, das Gateway-
Abonnement und Hinweise zur anderweitigen Weiterleitung verwalten kann.

`nativeRuntime` ist in einige kleinere Schnittstellen aufgeteilt:

- `availability` – ob das Konto konfiguriert ist und ob eine Anfrage
  verarbeitet werden soll
- `presentation` – das gemeinsame Genehmigungsansichtsmodell in
  ausstehende/aufgelöste/abgelaufene native Nutzdaten oder endgültige Aktionen überführen
- `transport` – Ziele vorbereiten sowie native Genehmigungsnachrichten senden/aktualisieren/löschen
- `interactions` – optionale Hooks zum Binden/Aufheben/Löschen von Aktionen für native Schaltflächen
  oder Reaktionen sowie ein optionaler `cancelDelivered`-Hook. Implementieren Sie
  `cancelDelivered`, wenn `deliverPending` prozessinternen oder persistenten
  Zustand registriert (etwa einen Speicher für Reaktionsziele), damit dieser Zustand freigegeben werden kann, wenn ein
  Handler-Stopp die Zustellung abbricht, bevor `bindPending` ausgeführt wird, oder wenn
  `bindPending` kein Handle zurückgibt
- `observe` – optionale Hooks für Zustellungsdiagnosen

Weitere Genehmigungshelfer:

- Verwenden Sie `createNativeApprovalChannelRouteGates` aus
  `openclaw/plugin-sdk/approval-native-runtime`, wenn ein Kanal sowohl
  Sitzungsursprungs-basierte native Zustellung als auch explizite Weiterleitungsziele für Genehmigungen unterstützt. Der
  Helfer zentralisiert die Auswahl der Genehmigungskonfiguration, die Behandlung von `mode`, Agenten-/Sitzungsfilter,
  Kontobindung, Sitzungszielabgleich und Ziellistenabgleich,
  während die Aufrufenden weiterhin für die Kanal-ID, den standardmäßigen Weiterleitungsmodus, die Kontosuche,
  die Prüfung, ob der Transport aktiviert ist, die Zielnormalisierung und die Auflösung des
  Turn-Ursprungsziels zuständig sind. Verwenden Sie ihn nicht, um Core-eigene Standardwerte für Kanalrichtlinien
  zu erstellen; übergeben Sie den dokumentierten Standardmodus des Kanals ausdrücklich.
- `createChannelNativeOriginTargetResolver` verwendet standardmäßig den gemeinsamen Kanalrouten-
  Abgleich für `{ to, accountId, threadId }`-Ziele. Übergeben Sie
  `targetsMatch` nur, wenn ein Kanal Provider-spezifische Äquivalenzregeln besitzt,
  etwa den Abgleich von Slack-Zeitstempelpräfixen. Übergeben Sie `normalizeTargetForMatch`, wenn
  der Kanal Provider-IDs kanonisieren muss, bevor der standardmäßige Routenabgleich
  oder ein benutzerdefinierter `targetsMatch`-Callback ausgeführt wird, während das
  ursprüngliche Ziel für die Zustellung erhalten bleibt. Verwenden Sie `normalizeTarget` nur, wenn das aufgelöste
  Zustellungsziel selbst kanonisiert werden soll.
- Wenn der Kanal laufzeiteigene Objekte wie einen Client, ein Token, eine Bolt-
  App oder einen Webhook-Empfänger benötigt, registrieren Sie diese über
  `openclaw/plugin-sdk/channel-runtime-context`. Die generische Laufzeitkontext-
  Registrierung ermöglicht dem Core, fähigkeitsgesteuerte Handler aus dem Kanal-
  Startzustand zu initialisieren, ohne genehmigungsspezifischen Wrapper-Verbindungscode hinzuzufügen.
- Greifen Sie nur dann auf die niedrigeren Ebenen `createChannelApprovalHandler` oder
  `createChannelNativeApprovalRuntime` zurück, wenn die fähigkeitsgesteuerte Schnittstelle
  noch nicht ausdrucksstark genug ist.
- Kanäle mit nativen Genehmigungen müssen sowohl `accountId` als auch `approvalKind`
  durch diese Helfer leiten. `accountId` beschränkt die Genehmigungsrichtlinie für mehrere Konten
  auf das richtige Bot-Konto, und `approvalKind` stellt dem Kanal das Verhalten
  für Ausführungs- gegenüber Plugin-Genehmigungen ohne fest codierte Verzweigungen im
  Core zur Verfügung.
- Der Core verwaltet auch Hinweise zur Umleitung von Genehmigungen. Kanal-Plugins sollten
  aus `createChannelNativeApprovalRuntime` keine eigenen Folgenachrichten wie „Genehmigung wurde an Direktnachrichten/einen anderen Kanal gesendet“
  senden; stellen Sie stattdessen ein korrektes Routing für Ursprung und
  Direktnachrichten an Genehmigende über die gemeinsamen Helfer für Genehmigungsfähigkeiten bereit und lassen Sie
  den Core die tatsächlichen Zustellungen zusammenfassen, bevor er einen Hinweis an den
  initiierenden Chat zurücksendet.
- Bewahren Sie die Art der zugestellten Genehmigungs-ID durchgängig. Native Clients sollten
  das Routing von Ausführungs- gegenüber Plugin-Genehmigungen nicht anhand kanalinterner
  Zustände erraten oder umschreiben.
- Übergeben Sie dieses explizite `approvalKind` an `resolveApprovalOverGateway`. Dies verwendet
  den kanonischen `approval.resolve`-Dienst und gibt den aufgezeichneten Gewinner zurück, wenn
  eine andere Oberfläche zuerst antwortet. Die ältere explizite `resolveMethod`-Eingabe
  bleibt für befehlsbasierte Steuerelemente bestehen; neue native Aktionen dürfen sie nicht verwenden oder
  die Art aus einer ID ableiten.
- Unterschiedliche Genehmigungsarten können absichtlich unterschiedliche native
  Oberflächen bereitstellen. Aktuelle gebündelte Beispiele: Matrix behält für Ausführungs- und Plugin-Genehmigungen
  dasselbe native Direktnachrichten-/Kanalrouting und dieselbe Reaktions-UX bei, lässt aber weiterhin
  eine je nach Genehmigungsart unterschiedliche Authentifizierung zu; Slack hält natives Genehmigungsrouting
  sowohl für Ausführungs- als auch für Plugin-IDs verfügbar.
- `createApproverRestrictedNativeApprovalAdapter` besteht weiterhin als
  Kompatibilitäts-Wrapper, neuer Code sollte jedoch den Fähigkeits-Builder bevorzugen
  und `approvalCapability` im Plugin bereitstellen.

### Engere Unterpfade der Genehmigungslaufzeit

Bevorzugen Sie für häufig genutzte Kanaleinstiegspunkte diese engeren Unterpfade gegenüber dem breiteren
`approval-runtime`-Barrel, wenn Sie nur einen Teil dieser Familie benötigen:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Bevorzugen Sie ebenso `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking` gegenüber breiteren Sammeloberflächen, wenn Sie
nicht alle davon benötigen.

### Setup-Unterpfade

- `openclaw/plugin-sdk/setup-runtime` umfasst die für die Laufzeit sicheren Setup-Helfer:
  `createSetupTranslator`, importsichere Adapter für Setup-Patches
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder.
- `openclaw/plugin-sdk/channel-setup` umfasst die Setup-Builder für optionale Installationen
  sowie einige Setup-sichere Primitive: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` und `splitSetupEntries`.
- Verwenden Sie die breitere `openclaw/plugin-sdk/setup`-Schnittstelle nur, wenn Sie auch
  die umfangreicheren gemeinsamen Setup-/Konfigurationshelfer wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen.

Wenn Ihr Kanal auf Setup-Oberflächen lediglich darauf hinweisen soll, „zuerst dieses Plugin zu installieren“,
verwenden Sie vorzugsweise `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent verweigert bei Konfigurationsschreibvorgängen und der Finalisierung standardmäßig die Ausführung und verwendet
dieselbe Meldung zur erforderlichen Installation bei der Validierung, Finalisierung und im Text
des Dokumentationslinks.

Wenn Ihr Kanal ein umgebungsvariablengesteuertes Setup oder eine solche Authentifizierung unterstützt, stellen Sie dies über das
Kanalkonfigurationsschema und die Setup-Deskriptoren bereit. Verwenden Sie `envVars` der Kanallaufzeit oder
lokale Konstanten ausschließlich für an Betreiber gerichtete Texte.

Wenn Ihr Kanal in `status`, `channels list`, `channels status` oder
SecretRef-Scans erscheinen kann, bevor die Plugin-Laufzeit startet, fügen Sie `openclaw.setupEntry` in
`package.json` hinzu. Dieser Einstiegspunkt sollte in schreibgeschützten Befehlspfaden
sicher importiert werden können und die Kanalmetadaten, den Setup-sicheren Konfigurationsadapter,
den Statusadapter und die für diese Zusammenfassungen benötigten Metadaten der geheimen
Kanalziele zurückgeben. Starten Sie über den Setup-Einstieg keine Clients, Listener oder
Transportlaufzeiten.

Halten Sie auch den Importpfad des Hauptkanaleinstiegs schlank. Die Erkennung kann
den Einstieg und das Kanal-Plugin-Modul auswerten, um Funktionen zu registrieren, ohne
den Kanal zu aktivieren. Dateien wie `channel-plugin-api.ts` sollten
das Kanal-Plugin-Objekt exportieren, ohne Setup-Assistenten, Transport-
Clients, Socket-Listener, Starter für Unterprozesse oder Module zum Starten von Diensten zu importieren.
Legen Sie diese Laufzeitkomponenten in Modulen ab, die über `registerFull(...)`, Laufzeit-
Setter oder verzögert geladene Funktionsadapter geladen werden.

### Weitere schlanke Kanal-Unterpfade

Verwenden Sie für andere häufig ausgeführte Kanalpfade vorzugsweise die schlanken Helfer statt breiterer älterer
Oberflächen:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Konfigurationen mit mehreren Konten und
  den Rückgriff auf das Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/channel-inbound` für eingehende Routen/Envelopes sowie
  die Verdrahtung von Aufzeichnung und Weiterleitung
- `openclaw/plugin-sdk/channel-targets` für Helfer zum Parsen von Zielen
- `openclaw/plugin-sdk/channel-outbound` für Delegaten für ausgehende Identitäten/Sendungen
  und typisierte Nutzlastplanung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route einen expliziten
  `replyToId`/`threadId` beibehalten oder die aktuelle `:thread:`-
  Sitzung wiederherstellen soll, nachdem der Basissitzungsschlüssel weiterhin übereinstimmt. Provider-Plugins können
  Priorität, Suffixverhalten und die Normalisierung der Thread-ID überschreiben, wenn
  ihre Plattform über native Semantik für die Zustellung in Threads verfügt.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von Thread-Bindungen
  und die Adapterregistrierung

Kanäle, die ausschließlich Authentifizierung unterstützen, können in der Regel beim Standardpfad bleiben: Der Kern übernimmt
Genehmigungen, und das Plugin stellt lediglich Funktionen für ausgehende Nachrichten und Authentifizierung bereit. Native
Genehmigungskanäle wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte
sollten die gemeinsamen nativen Helfer verwenden, statt einen eigenen Genehmigungslebenszyklus
zu implementieren.

## Richtlinie für Erwähnungen in eingehenden Nachrichten

Teilen Sie die Verarbeitung von Erwähnungen in eingehenden Nachrichten in zwei Ebenen auf:

- Plugin-eigene Ermittlung von Nachweisen
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur, wenn Sie das breitere
Sammelmodul für eingehende Helfer benötigen.

Gut geeignet für Plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung zitierter Bot-Nachrichten
- Prüfungen der Thread-Teilnahme
- Ausschlüsse von Dienst-/Systemnachrichten
- plattformnative Caches, die zum Nachweis der Bot-Teilnahme erforderlich sind

Gut geeignet für den gemeinsamen Helfer:

- `requireMention`
- Ergebnis einer expliziten Erwähnung
- Positivliste für implizite Erwähnungen
- Befehlsumgehung
- endgültige Entscheidung zum Überspringen

Bevorzugter Ablauf:

1. Ermitteln Sie lokale Erwähnungsfakten.
2. Übergeben Sie diese Fakten an `resolveInboundMentionDecision({ facts, policy })`.
3. Verwenden Sie `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und
   `decision.shouldSkip` in Ihrer Eingangsprüfung.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";
import { resolveChannelImplicitMentions } from "openclaw/plugin-sdk/channel-ingress-runtime";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const implicitMentions = resolveChannelImplicitMentions({
  cfg,
  channel: channelId,
  accountId,
});

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    implicitMentions,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` gibt einen booleschen Wert zurück. `hasAnyMention`,
`isExplicitlyMentioned` und `canResolveExplicit` stammen aus den eigenen
nativen Erwähnungsmetadaten des Kanals (Nachrichtenentitäten, Kennzeichen für Antworten an den Bot und Ähnliches);
geben Sie `false`/`undefined`-Werte an, wenn Ihre Plattform diese nicht erkennen kann.

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungshelfer für
gebündelte Kanal-Plugins bereit, die bereits von Laufzeitinjektion abhängen:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Wenn Sie nur `implicitMentionKindWhen` und `resolveInboundMentionDecision` benötigen,
importieren Sie sie aus `openclaw/plugin-sdk/channel-mention-gating`, um das Laden
nicht zugehöriger Laufzeithelfer für eingehende Nachrichten zu vermeiden.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die standardmäßigen Plugin-Dateien. Das Feld `channels` in
    `openclaw.plugin.json` (nicht ein Feld `kind`) kennzeichnet ein Manifest als
    Eigentümer eines Kanals. Die vollständige Oberfläche der Paketmetadaten finden Sie unter
    [Plugin-Setup und -Konfiguration](/de/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "OpenClaw mit Acme Chat verbinden."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Kanal-Plugin für Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot-Token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` validiert `plugins.entries.acme-chat.config`. Verwenden Sie es für
    Plugin-eigene Einstellungen, die nicht zur Kanalkontokonfiguration gehören.
    `channelConfigs.acme-chat.schema` validiert `channels.acme-chat` und ist die
    Quelle für selten ausgeführte Pfade, die vom Konfigurationsschema, Setup und von UI-Oberflächen verwendet wird, bevor die
    Plugin-Laufzeit geladen wird. Die vollständige Referenz der Felder auf oberster Ebene finden Sie unter
    [Plugin-Manifest](/de/plugins/manifest).

  </Step>

  <Step title="Kanal-Plugin-Objekt erstellen">
    Die Schnittstelle `ChannelPlugin` verfügt über viele optionale Adapteroberflächen. Beginnen Sie mit
    dem Minimum – `id`, `config` und `setup` – und fügen Sie nach Bedarf
    Adapter hinzu.

    Erstellen Sie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // Ihr Plattform-API-Client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: Token ist erforderlich");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // Kontoauflösung/-prüfung gehört zu `config`, nicht zu `setup`.
        // `setup` umfasst Schreibvorgänge beim Onboarding (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // DM-Sicherheit: Wer Nachrichten an den Bot senden darf
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Kopplung: Genehmigungsablauf für neue DM-Kontakte
      pairing: {
        text: {
          idLabel: "Acme-Chat-Benutzername",
          message: "Senden Sie diesen Code, um Ihre Identität zu verifizieren:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Kopplungscode: ${code}`);
          },
        },
      },

      // Threading: Art der Zustellung von Antworten
      threading: { topLevelReplyToMode: "reply" },

      // Ausgehend: Nachrichten an die Plattform senden
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Für Kanäle, die sowohl kanonische DM-Schlüssel auf oberster Ebene als auch veraltete verschachtelte Schlüssel akzeptieren, verwenden Sie die Hilfsfunktionen aus `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` und `normalizeChannelDmPolicy` sorgen dafür, dass kontolokale Werte vor geerbten Stammwerten Vorrang haben. Kombinieren Sie denselben Resolver über `normalizeLegacyDmAliases` mit der Doctor-Reparatur, damit Laufzeit und Migration denselben Vertrag lesen.

    <Accordion title="Was createChatChannelPlugin für Sie übernimmt">
      Anstatt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben
      Sie deklarative Optionen, aus denen der Builder die Adapter zusammensetzt:

      | Option | Was sie verbindet |
      | --- | --- |
      | `security.dm` | Bereichsbezogener DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Kopplungsablauf mit Codeaustausch |
      | `threading` | Resolver für den Antwortmodus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs); erfordert eine zugehörige `channel`-ID, damit der Kern das zurückgegebene Zustellergebnis kennzeichnen kann |

      Sie können anstelle der deklarativen Optionen auch rohe Adapterobjekte
      übergeben, wenn Sie vollständige Kontrolle benötigen.

      Rohe ausgehende Adapter können eine `chunker(text, limit, ctx)`-Funktion definieren.
      Das optionale `ctx.formatting` enthält Formatierungsentscheidungen zum
      Zustellzeitpunkt wie `maxLinesPerMessage`; wenden Sie es vor dem Senden an,
      damit Antwort-Threading und Segmentgrenzen einmalig durch die gemeinsame
      ausgehende Zustellung aufgelöst werden. Sendekontexte enthalten außerdem
      `replyToIdSource` (`implicit` oder `explicit`), wenn ein
      natives Antwortziel aufgelöst wurde, sodass Payload-Hilfsfunktionen
      explizite Antwort-Tags beibehalten können, ohne einen impliziten,
      einmalig verwendbaren Antwortplatz zu verbrauchen.
    </Accordion>

  </Step>

  <Step title="Einstiegspunkt verbinden">
    Erstellen Sie `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme-Chat-Kanal-Plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme-Chat-Verwaltung");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme-Chat-Verwaltung",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Platzieren Sie kanaleigene CLI-Deskriptoren in `registerCliMetadata(...)`, damit
    OpenClaw sie in der Stammhilfe anzeigen kann, ohne die vollständige
    Kanallaufzeit zu aktivieren, während normale vollständige Ladevorgänge
    weiterhin dieselben Deskriptoren für die tatsächliche Befehlsregistrierung
    übernehmen. Verwenden Sie `registerFull(...)` weiterhin ausschließlich für
    Laufzeitaufgaben. `defineChannelPluginEntry` verarbeitet die Aufteilung nach
    Registrierungsmodus automatisch. Wenn `registerFull(...)` Gateway-RPC-Methoden
    registriert, verwenden Sie ein Plugin-spezifisches Präfix. Die
    Kern-Administrationsnamensräume (`config.*`, `exec.approvals.*`,
    `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst. Alle Optionen finden Sie unter
    [Einstiegspunkte](/de/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Setup-Einstieg hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt diesen Einstieg anstelle des vollständigen Einstiegs, wenn der
    Kanal deaktiviert oder nicht konfiguriert ist. Dadurch wird vermieden, dass
    während Setup-Abläufen umfangreicher Laufzeitcode geladen wird. Weitere
    Informationen finden Sie unter [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry).

    Gebündelte Workspace-Kanäle, die Setup-sichere Exporte in Sidecar-Module
    aufteilen, können `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn
    sie außerdem einen expliziten Laufzeit-Setter für die Setup-Phase benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an OpenClaw
    weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage
    verifiziert und über den Handler für eingehende Nachrichten Ihres Kanals
    weiterleitet:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // vom Plugin verwaltete Authentifizierung (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Handler für eingehende Nachrichten leitet die Nachricht an OpenClaw weiter.
          // Die genaue Einbindung hängt von Ihrem Plattform-SDK ab –
          // ein praktisches Beispiel finden Sie im gebündelten Microsoft Teams- oder Google Chat-Plugin-Paket.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Die Verarbeitung eingehender Nachrichten ist kanalspezifisch. Jedes
      Kanal-Plugin besitzt seine eigene Pipeline für eingehende Nachrichten.
      Praktische Muster finden Sie in gebündelten Kanal-Plugins, beispielsweise
      im Microsoft Teams- oder Google Chat-Plugin-Paket.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie gemeinsam abgelegte Tests in `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Gemeinsame Test-Hilfsfunktionen finden Sie unter [Testen](/de/plugins/sdk-testing).

</Step>
</Steps>

## Dateistruktur

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel-Metadaten
├── openclaw.plugin.json      # Manifest mit Konfigurationsschema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Öffentliche Exporte (optional)
├── runtime-api.ts            # Interne Laufzeitexporte (optional)
└── src/
    ├── channel.ts            # ChannelPlugin über createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Plattform-API-Client
    └── runtime.ts            # Laufzeitspeicher (falls erforderlich)
```

## Fortgeschrittene Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Nachrichtenwerkzeugs" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Aktionserkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Laufzeit-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
  <Card title="API für eingehende Kanalnachrichten" icon="bolt" href="/de/plugins/sdk-channel-inbound">
    Gemeinsamer Lebenszyklus eingehender Ereignisse: Einlesen, Auflösen, Aufzeichnen, Weiterleiten, Abschließen
  </Card>
</CardGroup>

<Note>
Einige gebündelte Hilfsschnittstellen bestehen weiterhin für die Wartung und
Kompatibilität gebündelter Plugins. Sie sind nicht das empfohlene Muster für
neue Kanal-Plugins; bevorzugen Sie die generischen Unterpfade für Kanal, Setup,
Antworten und Laufzeit aus der gemeinsamen SDK-Oberfläche, sofern Sie nicht
direkt diese gebündelte Plugin-Familie warten.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) – wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Übersicht](/de/plugins/sdk-overview) – vollständige Referenz der Unterpfadimporte
- [SDK-Tests](/de/plugins/sdk-testing) – Testwerkzeuge und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) – vollständiges Manifestschema

## Verwandte Themen

- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
