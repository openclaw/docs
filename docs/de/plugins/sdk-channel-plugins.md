---
read_when:
    - Sie entwickeln ein neues Plugin für einen Messaging-Kanal
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapteroberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Channel-Plugins erstellen
x-i18n:
    generated_at: "2026-07-12T15:44:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fa573f956bc710b72433d3e19421ab4af4cab8fc854b93dec371e029ce268273
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Dieser Leitfaden erstellt ein Channel-Plugin, das OpenClaw mit einer Messaging-
Plattform verbindet: DM-Sicherheit, Kopplung, Antwort-Threads und ausgehende Nachrichten.

<Info>
  Neu bei OpenClaw-Plugins? Lesen Sie zunächst [Erste Schritte](/de/plugins/building-plugins),
  um sich mit der Paketstruktur und der Einrichtung des Manifests vertraut zu machen.
</Info>

## Zuständigkeiten Ihres Plugins

Channel-Plugins implementieren keine Werkzeuge zum Senden, Bearbeiten oder Reagieren; der Core stellt ein
gemeinsames `message`-Werkzeug bereit. Ihr Plugin ist zuständig für:

- **Konfiguration** - Kontoauflösung und Einrichtungsassistent
- **Sicherheit** - DM-Richtlinie und Zulassungslisten
- **Kopplung** - Genehmigungsablauf für DMs
- **Sitzungsgrammatik** - wie Provider-spezifische Konversations-IDs auf Basis-
  Chats, Thread-IDs und übergeordnete Rückfalloptionen abgebildet werden
- **Ausgehend** - Senden von Text, Medien und Umfragen an die Plattform
- **Threading** - wie Antworten in Threads eingeordnet werden
- **Heartbeat-Tippstatus** - optionale Tipp-/Beschäftigt-Signale für Heartbeat-Zustellungs-
  ziele

Der Core ist zuständig für das gemeinsame Nachrichtenwerkzeug, die Prompt-Anbindung, die äußere Form des Sitzungsschlüssels,
die generische `:thread:`-Verwaltung und den Versand.

## Nachrichtenadapter

Stellen Sie einen `message`-Adapter mit `defineChannelMessageAdapter` aus
`openclaw/plugin-sdk/channel-outbound` bereit. Deklarieren Sie nur die dauerhaften Funktionen für den endgültigen Versand,
die Ihr nativer Transport tatsächlich unterstützt, abgesichert durch einen Vertragstest,
der den nativen Seiteneffekt und die zurückgegebene Empfangsbestätigung nachweist. Leiten Sie Text-/Medien-
Sendungen an dieselben Transportfunktionen weiter, die der ältere `outbound`-Adapter verwendet. Den
vollständigen API-Vertrag, die Funktionsmatrix, Empfangsbestätigungsregeln, die Finalisierung der Live-Vorschau,
die Richtlinie für Empfangsbestätigungen, Tests und die Migrationstabelle finden Sie unter
[API für ausgehende Channel-Nachrichten](/de/plugins/sdk-channel-outbound).

Wenn Ihr vorhandener `outbound`-Adapter bereits über die richtigen Sendemethoden und
Funktionsmetadaten verfügt, leiten Sie den `message`-Adapter mit
`createChannelMessageAdapterFromOutbound(...)` ab, statt eine weitere
Brücke manuell zu schreiben. Adapter-Sendevorgänge geben `MessageReceipt`-Werte zurück. Leiten Sie
ältere IDs mit `listMessageReceiptPlatformIds(...)` oder
`resolveMessageReceiptPrimaryId(...)` ab, statt parallele `messageIds`-
Felder beizubehalten.

Deklarieren Sie Live- und Finalisierungsfunktionen präzise – der Core verwendet sie, um zu entscheiden,
was ein Channel leisten kann, und Abweichungen zwischen dem deklarierten und dem tatsächlichen Verhalten führen zu einem
Fehlschlag des Vertragstests:

| Oberfläche                            | Werte                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Channels, die eine Entwurfsvorschau direkt finalisieren, sollten die Laufzeitlogik
über `defineFinalizableLivePreviewAdapter(...)` und
`deliverWithFinalizableLivePreviewAdapter(...)` leiten und die deklarierten
Funktionen durch Tests mit `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
und `verifyChannelMessageLiveFinalizerProofs(...)` absichern, damit natives Vorschau-,
Fortschritts-, Bearbeitungs-, Rückfall-/Beibehaltungs-, Bereinigungs- und Empfangsbestätigungsverhalten nicht unbemerkt
abweichen kann.

Empfänger eingehender Nachrichten, die Plattformbestätigungen verzögern, sollten
`message.receive.defaultAckPolicy` und `supportedAckPolicies` deklarieren, statt den
Bestätigungszeitpunkt in einem monitorlokalen Zustand zu verbergen. Decken Sie jede deklarierte Richtlinie mit
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ab.

Ältere Antwort-Hilfsfunktionen wie `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` und `recordInboundSessionAndDispatchReply`
bleiben für Kompatibilitäts-Dispatcher verfügbar. Verwenden Sie sie nicht für neuen
Channel-Code; beginnen Sie stattdessen mit dem `message`-Adapter, Empfangsbestätigungen und den Hilfsfunktionen für den Empfangs-/Sende-
Lebenszyklus aus `openclaw/plugin-sdk/channel-outbound`.

### Eingang eingehender Nachrichten (experimentell)

Channels, die die Autorisierung eingehender Nachrichten migrieren, können den experimentellen
Unterpfad `openclaw/plugin-sdk/channel-ingress-runtime` aus den Laufzeitpfaden für den Empfang
verwenden. Er akzeptiert Plattformfakten, unverarbeitete Zulassungslisten, Routendeskriptoren, Befehls-
fakten und die Konfiguration von Zugriffsgruppen und gibt anschließend Sender-/Routen-/Befehls-/Aktivierungs-
Projektionen sowie den geordneten Eingangsgraphen zurück, während Plattformabfragen und Neben-
effekte im Plugin verbleiben. Behalten Sie die Normalisierung der Plugin-Identität in dem
Deskriptor bei, den Sie an den Resolver übergeben; serialisieren Sie keine unverarbeiteten Vergleichswerte aus
dem aufgelösten Zustand oder der Entscheidung. Unter
[API für den Channel-Eingang](/de/plugins/sdk-channel-ingress) finden Sie das API-Design,
die Zuständigkeitsgrenze und die Testerwartungen. Der ältere
Unterpfad `openclaw/plugin-sdk/channel-ingress` bleibt als veraltete
Kompatibilitätsfassade für Plugins von Drittanbietern exportiert.

### Tippindikatoren

Wenn Ihr Channel Tippindikatoren außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` im Channel-Plugin bereit. Der Core ruft es mit dem
aufgelösten Heartbeat-Zustellungsziel auf, bevor der Heartbeat-Modelllauf beginnt, und
verwendet den gemeinsamen Lebenszyklus für Keepalive und Bereinigung des Tippstatus. Fügen Sie
`heartbeat.clearTyping(...)` hinzu, wenn die Plattform ein ausdrückliches Stoppsignal benötigt.

### Parameter für Medienquellen

Wenn Ihr Kanal Parameter für das Nachrichten-Tool hinzufügt, die Medienquellen enthalten, stellen Sie
diese Parameternamen über `plugin.actions.describeMessageTool(...).mediaSourceParams` bereit.
Der Kern verwendet diese explizite Liste für die Normalisierung von Sandbox-Pfaden und die Richtlinie
für ausgehenden Medienzugriff, sodass Plugins keine Sonderfälle im gemeinsam genutzten Kern für
Provider-spezifische Avatar-, Anhangs- oder Titelbildparameter benötigen.

Bevorzugen Sie eine nach Aktionen indizierte Zuordnung wie `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
damit nicht zusammenhängende Aktionen nicht die Medienargumente einer anderen Aktion übernehmen. Ein flaches Array
funktioniert weiterhin für Parameter, die absichtlich von jeder bereitgestellten Aktion gemeinsam verwendet werden.

Kanäle, die eine temporäre öffentliche URL für einen plattformseitigen Medienabruf
bereitstellen müssen, können `createHostedOutboundMediaStore(...)` aus
`openclaw/plugin-sdk/outbound-media` mit Plugin-Zustandsspeichern verwenden. Behalten Sie das Parsen
von Plattformrouten und die Token-Durchsetzung im Kanal-Plugin; die gemeinsam genutzte Hilfsfunktion
verwaltet nur das Laden von Medien, Ablaufmetadaten, Blockzeilen und die Bereinigung.

### Native Nutzlastgestaltung

Wenn Ihr Kanal Provider-spezifische Anpassungen für `message(action="send")` benötigt,
bevorzugen Sie `actions.prepareSendPayload(...)`. Legen Sie native Karten, Blöcke, Einbettungen oder
andere dauerhafte Daten unter `payload.channelData.<channel>` ab und lassen Sie den Kern
den Versand über den Adapter für ausgehende Nachrichten durchführen. Verwenden Sie `actions.handleAction(...)` für den Versand
nur als Kompatibilitäts-Fallback für Nutzlasten, die nicht serialisiert und
erneut versucht werden können.

### Grammatik für Sitzungskonversationen

Wenn Ihre Plattform zusätzlichen Geltungsbereich in Konversations-IDs speichert, behalten Sie dieses Parsen
mit `messaging.resolveSessionConversation(...)` im Plugin. Dies ist der
kanonische Hook zur Zuordnung von `rawId` zur Basis-Konversations-ID, einer optionalen
Thread-ID, einer expliziten `baseConversationId` und beliebigen
`parentConversationCandidates`. Wenn Sie `parentConversationCandidates` zurückgeben,
ordnen Sie diese vom engsten übergeordneten Element bis zur allgemeinsten/Basis-Konversation.

`messaging.resolveParentConversationCandidates(...)` ist ein veralteter
Kompatibilitäts-Fallback für Plugins, die lediglich übergeordnete Fallbacks zusätzlich zur
generischen/rohen ID benötigen. Wenn beide Hooks vorhanden sind, verwendet der Kern zuerst
`resolveSessionConversation(...).parentConversationCandidates` und greift nur
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische
Hook sie auslässt.

Mitgelieferte Plugins, die dasselbe Parsen benötigen, bevor die Kanalregistrierung startet,
können eine `session-key-api.ts`-Datei auf oberster Ebene mit einem passenden
`resolveSessionConversation(...)`-Export bereitstellen (siehe die Feishu- und Telegram-
Plugins). Der Kern verwendet diese bootstrap-sichere Oberfläche nur, wenn die Laufzeit-Plugin-
Registrierung noch nicht verfügbar ist.

Verwenden Sie `openclaw/plugin-sdk/channel-route`, wenn Plugin-Code routenähnliche
Felder normalisieren, einen untergeordneten Thread mit seiner übergeordneten Route vergleichen oder einen
stabilen Deduplizierungsschlüssel aus `{ channel, to, accountId, threadId }` erstellen muss. Die Hilfsfunktion
normalisiert numerische Thread-IDs auf dieselbe Weise wie der Kern; bevorzugen Sie sie daher gegenüber Ad-hoc-
Vergleichen mit `String(threadId)`. Plugins mit Provider-spezifischer Zielgrammatik
sollten `messaging.resolveOutboundSessionRoute(...)` bereitstellen, damit der Kern
Provider-native Sitzungs- und Thread-Identität ohne Parser-Shims erhält.

### Unterstützung für kontobezogene Konversationsbindungen

Setzen Sie `conversationBindings.supportsCurrentConversationBinding`, wenn der Kanal
generische Bindungen an die aktuelle Konversation unterstützt. `createChatChannelPlugin(...)`
setzt diese statische Fähigkeit standardmäßig auf `true`.

Wenn sich die Unterstützung je nach konfiguriertem Konto unterscheidet, implementieren Sie außerdem
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Der Kern wertet diesen synchronen Hook erst aus, nachdem die statische Fähigkeit
aktiviert wurde. Die Rückgabe von `false` macht generische Funktionen für die aktuelle Konversation,
Bindungs-, Such-, Auflistungs-, Aktualisierungs- und Aufhebungsvorgänge für dieses Konto nicht verfügbar.
Wird der Hook weggelassen, gilt die statische Fähigkeit für jedes Konto.

Ermitteln Sie die Antwort aus der bereits geladenen Kontokonfiguration oder dem Laufzeitstatus. Dieser
Hook steuert nur generische Bindungen an die aktuelle Konversation; er ersetzt weder
konfigurierte Bindungsregeln noch das Plugin-eigene Sitzungsrouting. Vertragstests
sollten mindestens ein unterstütztes und ein nicht unterstütztes Konto über den
von `openclaw/plugin-sdk/channel-core` exportierten Vertrag
`ChannelPlugin["conversationBindings"]` abdecken.

## Genehmigungen und Kanalfähigkeiten

Die meisten Kanal-Plugins benötigen keinen genehmigungsspezifischen Code. Der Kern verwaltet
`/approve` im selben Chat, gemeinsam genutzte Nutzlasten für Genehmigungsschaltflächen und die generische Fallback-Zustellung.
`ChannelPlugin.approvals` wurde entfernt; legen Sie Fakten zu Genehmigungszustellung, nativer Darstellung, Rendering und Authentifizierung
stattdessen in einem einzigen `approvalCapability`-Objekt ab. `plugin.auth` dient nur der Anmeldung/Abmeldung
– der Kern liest aus diesem Objekt keine Hooks für die Genehmigungsauthentifizierung mehr.

Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder die Unterdrückung
von Fallbacks und `approvalCapability.render` nur, wenn ein Kanal tatsächlich
benutzerdefinierte Genehmigungsnutzlasten anstelle des gemeinsam genutzten Renderers benötigt.

### Genehmigungsauthentifizierung

- `approvalCapability.authorizeActorAction` und
  `approvalCapability.getActionAvailabilityState` bilden die kanonische Schnittstelle
  für die Genehmigungsauthentifizierung.
- Verwenden Sie `getActionAvailabilityState` für die Verfügbarkeit der Genehmigungsauthentifizierung im selben Chat.
  Lassen Sie konfigurierte Genehmigende für `/approve` verfügbar, selbst wenn die native Zustellung
  deaktiviert ist; verwenden Sie stattdessen den Status der nativen initiierenden Oberfläche für Hinweise
  zur Zustellung und Einrichtung.
- Wenn Ihr Kanal native Ausführungsgenehmigungen bereitstellt, verwenden Sie
  `approvalCapability.getExecInitiatingSurfaceState` für den Status
  der initiierenden Oberfläche/des nativen Clients, wenn dieser von der Genehmigungsauthentifizierung
  im selben Chat abweicht. Der Kern verwendet diesen ausführungsspezifischen Hook, um `enabled` und
  `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Kanal native Ausführungs-
  genehmigungen unterstützt, und den Kanal in die Fallback-Hinweise für native Clients aufzunehmen.
  `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für
  den üblichen Fall aus.
- Wenn ein Kanal aus der vorhandenen Konfiguration stabile, eigentümerähnliche DM-Identitäten ableiten kann,
  verwenden Sie `createResolvedApproverActionAuthAdapter` aus
  `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken,
  ohne genehmigungsspezifische Kernlogik hinzuzufügen.
- Wenn eine benutzerdefinierte Genehmigungsauthentifizierung absichtlich nur den Fallback im selben Chat zulässt, geben Sie
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` aus
  `openclaw/plugin-sdk/approval-auth-runtime` zurück; andernfalls behandelt der Kern das
  Ergebnis als explizite Autorisierung durch Genehmigende.
- Wenn ein kanaleigener nativer Callback Genehmigungen direkt auflöst, verwenden Sie
  `isImplicitSameChatApprovalAuthorization(...)` vor dem Auflösen, damit der implizite
  Fallback weiterhin die normale Akteursautorisierung des Kanals durchläuft.

### Lebenszyklus der Nutzlast und Einrichtungshinweise

- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder
  `outbound.beforeDeliverPayload` für kanalspezifisches Verhalten im
  Payload-Lebenszyklus, etwa um doppelte lokale Genehmigungsaufforderungen
  auszublenden oder vor der Zustellung Tippindikatoren zu senden.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn die
  Antwort für den deaktivierten Pfad genau die Konfigurationsoptionen erläutern
  soll, die zum Aktivieren nativer Ausführungsgenehmigungen erforderlich sind.
  Der Hook erhält `{ channel, channelLabel, accountId }`; Kanäle mit benannten
  Konten sollten kontobezogene Pfade wie
  `channels.<channel>.accounts.<id>.execApprovals.*` statt übergeordneter
  Standardwerte darstellen.
- Verwenden Sie `approvalCapability.describePluginApprovalSetup`, wenn Hinweise
  bei Fehlern von Plugin-Genehmigungen gefahrlos für Fehler ohne Route und
  Zeitüberschreitungen bei Plugin-Genehmigungen angezeigt werden können.
  `createApproverRestrictedNativeApprovalCapability(...)` leitet dies nicht aus
  `describeExecApprovalSetup` ab; übergeben Sie denselben Helper nur dann
  ausdrücklich, wenn Plugin- und Ausführungsgenehmigungen tatsächlich dieselbe
  native Einrichtung verwenden.

### Native Zustellung von Genehmigungen

Wenn ein Kanal eine native Zustellung von Genehmigungen benötigt, sollte sich
der Kanalcode auf die Zielnormalisierung sowie Transport- und
Darstellungsinformationen konzentrieren. Verwenden Sie
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` und
`createApproverRestrictedNativeApprovalCapability` aus
`openclaw/plugin-sdk/approval-runtime`. Hinterlegen Sie die kanalspezifischen
Informationen unter `approvalCapability.nativeRuntime`, idealerweise über
`createChannelApprovalNativeRuntimeAdapter(...)` oder
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit der Kern den
Handler zusammensetzen und Anforderungsfilterung, Routing, Deduplizierung,
Ablauf, Gateway-Abonnement und Hinweise auf eine anderweitige Weiterleitung
übernehmen kann.

`nativeRuntime` ist in einige kleinere Schnittstellen unterteilt:

- `availability` – ob das Konto konfiguriert ist und ob eine Anfrage verarbeitet
  werden soll
- `presentation` – Abbildung des gemeinsamen Genehmigungsansichtsmodells auf
  ausstehende/abgeschlossene/abgelaufene native Payloads oder abschließende
  Aktionen
- `transport` – Ziele vorbereiten sowie native Genehmigungsnachrichten
  senden/aktualisieren/löschen
- `interactions` – optionale Hooks zum Binden/Aufheben der Bindung/Löschen von
  Aktionen für native Schaltflächen oder Reaktionen sowie ein optionaler Hook
  `cancelDelivered`. Implementieren Sie `cancelDelivered`, wenn
  `deliverPending` prozessinternen oder persistenten Zustand registriert (etwa
  einen Speicher für Reaktionsziele), damit dieser Zustand freigegeben werden
  kann, falls das Stoppen eines Handlers die Zustellung abbricht, bevor
  `bindPending` ausgeführt wird, oder wenn `bindPending` keinen Handle
  zurückgibt
- `observe` – optionale Hooks zur Zustellungsdiagnose

Weitere Helper für Genehmigungen:

- Verwenden Sie `createNativeApprovalChannelRouteGates` aus
  `openclaw/plugin-sdk/approval-native-runtime`, wenn ein Kanal sowohl die native
  Zustellung an den Sitzungsursprung als auch explizite Weiterleitungsziele für
  Genehmigungen unterstützt. Der Helper zentralisiert die Auswahl der
  Genehmigungskonfiguration, die Verarbeitung von `mode`, Agenten-/Sitzungsfilter,
  Kontobindung, den Abgleich von Sitzungszielen und den Abgleich von Ziellisten,
  während die Aufrufer weiterhin für Kanal-ID, standardmäßigen
  Weiterleitungsmodus, Kontosuche, Prüfung der Transportaktivierung,
  Zielnormalisierung und Auflösung des Ziels aus der Turn-Quelle verantwortlich
  bleiben. Verwenden Sie ihn nicht, um kerneigene Standardrichtlinien für Kanäle
  zu erstellen; übergeben Sie den dokumentierten Standardmodus des Kanals
  ausdrücklich.
- `createChannelNativeOriginTargetResolver` verwendet standardmäßig den
  gemeinsamen Kanalrouten-Abgleicher für Ziele vom Typ
  `{ to, accountId, threadId }`. Übergeben Sie `targetsMatch` nur, wenn ein Kanal
  providerspezifische Äquivalenzregeln besitzt, etwa den Abgleich von
  Slack-Zeitstempelpräfixen. Übergeben Sie `normalizeTargetForMatch`, wenn der
  Kanal Provider-IDs kanonisieren muss, bevor der standardmäßige
  Routen-Abgleicher oder ein benutzerdefinierter `targetsMatch`-Callback
  ausgeführt wird, wobei das ursprüngliche Ziel für die Zustellung erhalten
  bleibt. Verwenden Sie `normalizeTarget` nur, wenn das aufgelöste Zustellungsziel
  selbst kanonisiert werden soll.
- Wenn der Kanal laufzeiteigene Objekte wie einen Client, ein Token, eine
  Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie diese über
  `openclaw/plugin-sdk/channel-runtime-context`. Die generische
  Laufzeitkontext-Registry ermöglicht es dem Kern, fähigkeitsgesteuerte Handler
  aus dem Kanalstartzustand zu initialisieren, ohne genehmigungsspezifischen
  Wrapper-Verbindungscode hinzuzufügen.
- Greifen Sie nur dann auf die untergeordneten
  `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`
  zurück, wenn die fähigkeitsgesteuerte Schnittstelle noch nicht ausdrucksstark
  genug ist.
- Kanäle für native Genehmigungen müssen sowohl `accountId` als auch
  `approvalKind` durch diese Helper leiten. `accountId` beschränkt die
  Genehmigungsrichtlinie für mehrere Konten auf das richtige Bot-Konto, und
  `approvalKind` stellt dem Kanal das Verhalten für Ausführungs- gegenüber
  Plugin-Genehmigungen zur Verfügung, ohne hartcodierte Verzweigungen im Kern.
- Der Kern ist auch für Hinweise zur Umleitung von Genehmigungen zuständig.
  Kanal-Plugins sollten aus `createChannelNativeApprovalRuntime` keine eigenen
  Folgenachrichten wie „Genehmigung wurde an DMs/einen anderen Kanal gesendet“
  senden; stellen Sie stattdessen über die gemeinsamen Genehmigungs-Helper ein
  korrektes Routing für Ursprung und Genehmiger-DM bereit und lassen Sie den
  Kern die tatsächlichen Zustellungen aggregieren, bevor er einen Hinweis im
  auslösenden Chat veröffentlicht.
- Bewahren Sie die Art der zugestellten Genehmigungs-ID durchgängig bei. Native
  Clients dürfen das Routing von Ausführungs- gegenüber Plugin-Genehmigungen
  nicht anhand kanallokalen Zustands erraten oder umschreiben.
- Übergeben Sie diesen expliziten `approvalKind` an
  `resolveApprovalOverGateway`. Dies verwendet den kanonischen Dienst
  `approval.resolve` und gibt den aufgezeichneten Gewinner zurück, wenn eine
  andere Oberfläche zuerst antwortet. Die ältere explizite Eingabe
  `resolveMethod` bleibt für befehlsbasierte Steuerelemente bestehen; neue native
  Aktionen dürfen sie weder verwenden noch die Art aus einer ID ableiten.
- Unterschiedliche Genehmigungsarten können absichtlich unterschiedliche native
  Oberflächen bereitstellen. Aktuelle gebündelte Beispiele: Matrix behält für
  Ausführungs- und Plugin-Genehmigungen dasselbe native DM-/Kanal-Routing und
  dieselbe Reaktions-UX bei, ermöglicht aber weiterhin eine je nach
  Genehmigungsart unterschiedliche Authentifizierung; Slack stellt das native
  Genehmigungsrouting sowohl für Ausführungs- als auch für Plugin-IDs bereit.
- `createApproverRestrictedNativeApprovalAdapter` ist weiterhin als
  Kompatibilitäts-Wrapper vorhanden, neuer Code sollte jedoch den
  Fähigkeits-Builder bevorzugen und `approvalCapability` im Plugin bereitstellen.

### Spezifischere Unterpfade der Genehmigungslaufzeit

Bevorzugen Sie für häufig ausgeführte Kanaleinstiegspunkte diese spezifischeren
Unterpfade gegenüber dem umfassenderen Barrel `approval-runtime`, wenn Sie nur
einen Teil dieser Familie benötigen:

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
`openclaw/plugin-sdk/reply-chunking` gegenüber umfassenderen
Sammelschnittstellen, wenn Sie nicht alle benötigen.

### Einrichtungs-Unterpfade

- `openclaw/plugin-sdk/setup-runtime` umfasst die laufzeitsicheren
  Einrichtungs-Helper: `createSetupTranslator`, importsichere Adapter für
  Einrichtungs-Patches (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`),
  die Ausgabe von Suchhinweisen, `promptResolvedAllowFrom`,
  `splitSetupEntries` und die delegierten Einrichtungs-Proxy-Builder.
- `openclaw/plugin-sdk/channel-setup` umfasst die Einrichtungs-Builder für
  optionale Installationen sowie einige einrichtungssichere Primitive:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
  `splitSetupEntries`.
- Verwenden Sie die umfassendere Schnittstelle
  `openclaw/plugin-sdk/setup` nur, wenn Sie auch die umfangreicheren gemeinsamen
  Einrichtungs-/Konfigurations-Helper wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen.

Wenn Ihr Kanal auf Einrichtungsoberflächen lediglich „installieren Sie zuerst
dieses Plugin“ mitteilen soll, bevorzugen Sie
`createOptionalChannelSetupSurface(...)`. Der generierte Adapter/Assistent
schlägt bei Konfigurationsschreibvorgängen und der Finalisierung sicher
geschlossen fehl und verwendet dieselbe Meldung zur erforderlichen Installation
für Validierung, Finalisierung und Linktext zur Dokumentation.

Wenn Ihr Kanal eine umgebungsvariablengesteuerte Einrichtung oder
Authentifizierung unterstützt und generische Start-/Konfigurationsabläufe diese
Umgebungsvariablennamen kennen sollen, bevor die Laufzeit geladen wird,
deklarieren Sie sie im Plugin-Manifest mit `channelEnvVars`. Behalten Sie die
Kanal-Laufzeitoption `envVars` oder lokale Konstanten nur für
betreiberorientierte Texte bei.

Wenn Ihr Kanal in `status`, `channels list`, `channels status` oder
SecretRef-Scans erscheinen kann, bevor die Plugin-Laufzeit startet, fügen Sie
`openclaw.setupEntry` in `package.json` hinzu. Dieser Einstiegspunkt sollte in
schreibgeschützten Befehlspfaden gefahrlos importierbar sein und die
Kanalmetadaten, den einrichtungssicheren Konfigurationsadapter, den
Statusadapter und die Metadaten zu geheimen Kanalzielen zurückgeben, die für
diese Zusammenfassungen erforderlich sind. Starten Sie vom Einrichtungseinstieg
aus keine Clients, Listener oder Transportlaufzeiten.

Halten Sie auch den Importpfad des Haupt-Kanaleinstiegs schlank. Die Erkennung
kann den Einstieg und das Kanal-Plugin-Modul auswerten, um Fähigkeiten zu
registrieren, ohne den Kanal zu aktivieren. Dateien wie
`channel-plugin-api.ts` sollten das Kanal-Plugin-Objekt exportieren, ohne
Einrichtungsassistenten, Transport-Clients, Socket-Listener,
Unterprozess-Starter oder Module zum Starten von Diensten zu importieren.
Platzieren Sie diese Laufzeitkomponenten in Modulen, die aus `registerFull(...)`,
Laufzeit-Settern oder verzögerten Fähigkeitsadaptern geladen werden.

### Weitere spezifische Kanal-Unterpfade

Bevorzugen Sie für andere häufig ausgeführte Kanalpfade die spezifischen Helper
gegenüber umfassenderen veralteten Oberflächen:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für die Konfiguration mehrerer Konten
  und den Fallback auf das Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/channel-inbound` für eingehende Routen/Envelopes sowie
  die Verdrahtung von Aufzeichnung und Dispatch
- `openclaw/plugin-sdk/channel-targets` für Helper zur Zielanalyse
- `openclaw/plugin-sdk/outbound-media` zum Laden von Medien und
  `openclaw/plugin-sdk/channel-outbound` für Delegaten zu ausgehender
  Identität/zum Senden sowie für die Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route eine explizite
  `replyToId`/`threadId` beibehalten oder die aktuelle `:thread:`-Sitzung
  wiederherstellen soll, nachdem der Basissitzungsschlüssel weiterhin
  übereinstimmt. Provider-Plugins können Vorrang, Suffixverhalten und
  Normalisierung der Thread-ID überschreiben, wenn ihre Plattform native
  Semantik für die Thread-Zustellung besitzt.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von
  Thread-Bindungen und die Adapterregistrierung
- `openclaw/plugin-sdk/agent-media-payload` nur, wenn weiterhin ein veraltetes
  Feldlayout für Agenten-/Medien-Payloads erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` (veraltet: Kein gebündeltes
  Plugin verwendet es in der Produktion) für die Normalisierung
  benutzerdefinierter Telegram-Befehle, die Validierung auf Duplikate/Konflikte
  und einen fallbackstabilen Vertrag für die Befehlskonfiguration; bevorzugen
  Sie für neuen Plugin-Code die pluginlokale Verarbeitung der
  Befehlskonfiguration

Kanäle, die nur Authentifizierung bereitstellen, können üblicherweise beim
Standardpfad bleiben: Der Kern verarbeitet Genehmigungen und das Plugin stellt
lediglich Fähigkeiten für ausgehende Vorgänge und Authentifizierung bereit.
Kanäle für native Genehmigungen wie Matrix, Slack, Telegram und
benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Helper
verwenden, statt einen eigenen Genehmigungslebenszyklus zu implementieren.

## Richtlinie für Erwähnungen bei eingehenden Nachrichten

Halten Sie die Verarbeitung von Erwähnungen bei eingehenden Nachrichten in zwei
Ebenen getrennt:

- pluginverwaltete Beweiserfassung
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen
zur Erwähnungsrichtlinie. Verwenden Sie
`openclaw/plugin-sdk/channel-inbound` nur, wenn Sie das umfassendere Barrel für
eingehende Helper benötigen.

Gut geeignet für pluginlokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung zitierter Bot-Nachrichten
- Prüfungen der Thread-Teilnahme
- Ausschlüsse von Dienst-/Systemnachrichten
- plattformnative Caches, die zum Nachweis der Bot-Teilnahme erforderlich sind

Gut geeignet für den gemeinsamen Helper:

- `requireMention`
- Ergebnis einer expliziten Erwähnung
- Positivliste für implizite Erwähnungen
- Befehlsumgehung
- abschließende Entscheidung zum Überspringen

Bevorzugter Ablauf:

1. Ermitteln Sie lokale Fakten zu Erwähnungen.
2. Übergeben Sie diese Fakten an `resolveInboundMentionDecision({ facts, policy })`.
3. Verwenden Sie `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und
   `decision.shouldSkip` in Ihrer Eingangsprüfung.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

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

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` gibt einen booleschen Wert zurück. `hasAnyMention`,
`isExplicitlyMentioned` und `canResolveExplicit` stammen aus den nativen
Erwähnungsmetadaten des Channels (Nachrichtenentitäten, Antwort-an-Bot-Markierungen
und Ähnliches); geben Sie `false`/`undefined` an, wenn Ihre Plattform diese nicht
erkennen kann.

`api.runtime.channel.mentions` stellt dieselben gemeinsam genutzten Hilfsfunktionen
für Erwähnungen für gebündelte Channel-Plugins bereit, die bereits von
Runtime-Injektion abhängen: `buildMentionRegexes`, `matchesMentionPatterns`,
`matchesMentionWithExplicit`, `implicitMentionKindWhen`,
`resolveInboundMentionDecision`.

Wenn Sie nur `implicitMentionKindWhen` und `resolveInboundMentionDecision`
benötigen, importieren Sie sie aus `openclaw/plugin-sdk/channel-mention-gating`,
um nicht benötigte Hilfsfunktionen der Eingangs-Runtime nicht zu laden.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die standardmäßigen Plugin-Dateien. Das Feld `channels` in
    `openclaw.plugin.json` (nicht ein Feld `kind`) kennzeichnet ein Manifest als
    Eigentümer eines Channels. Die vollständige Oberfläche der Paketmetadaten
    finden Sie unter
    [Plugin-Einrichtung und -Konfiguration](/de/plugins/sdk-setup#openclaw-channel):

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
      "description": "Channel-Plugin für Acme Chat",
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

    `configSchema` validiert `plugins.entries.acme-chat.config`. Verwenden Sie
    es für Plugin-eigene Einstellungen, die nicht zur Channel-Kontokonfiguration
    gehören. `channelConfigs.acme-chat.schema` validiert `channels.acme-chat`
    und ist die Quelle im Cold Path, die von Konfigurationsschema, Einrichtung
    und UI-Oberflächen verwendet wird, bevor die Plugin-Runtime geladen wird.
    Die vollständige Referenz der Felder auf oberster Ebene finden Sie unter
    [Plugin-Manifest](/de/plugins/manifest).

  </Step>

  <Step title="Channel-Plugin-Objekt erstellen">
    Die Schnittstelle `ChannelPlugin` verfügt über viele optionale
    Adapteroberflächen. Beginnen Sie mit dem Minimum – `id`, `config` und
    `setup` – und fügen Sie bei Bedarf Adapter hinzu.

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
        // Kontoauflösung und -prüfung gehören zu `config`, nicht zu `setup`.
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

      // DM-Sicherheit: Wer dem Bot Nachrichten senden darf
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
          message: "Senden Sie diesen Code, um Ihre Identität zu bestätigen:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Kopplungscode: ${code}`);
          },
        },
      },

      // Threads: Wie Antworten zugestellt werden
      threading: { topLevelReplyToMode: "reply" },

      // Ausgang: Nachrichten an die Plattform senden
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

    Verwenden Sie für Channels, die sowohl kanonische DM-Schlüssel auf oberster
    Ebene als auch veraltete verschachtelte Schlüssel akzeptieren, die
    Hilfsfunktionen aus `plugin-sdk/channel-config-helpers`:
    `resolveChannelDmAccess`, `resolveChannelDmPolicy`,
    `resolveChannelDmAllowFrom` und `normalizeChannelDmPolicy` sorgen dafür,
    dass kontolokale Werte Vorrang vor geerbten Stammwerten haben. Kombinieren
    Sie denselben Resolver über `normalizeLegacyDmAliases` mit der
    Doctor-Reparatur, damit Runtime und Migration denselben Vertrag lesen.

    <Accordion title="Was createChatChannelPlugin für Sie übernimmt">
      Statt Low-Level-Adapterschnittstellen manuell zu implementieren,
      übergeben Sie deklarative Optionen, aus denen der Builder die Adapter
      zusammensetzt:

      | Option | Was sie einbindet |
      | --- | --- |
      | `security.dm` | Auf Konfigurationsfelder begrenzter Resolver für DM-Sicherheit |
      | `pairing.text` | Textbasierter DM-Kopplungsablauf mit Codeaustausch |
      | `threading` | Resolver für den Antwortmodus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnismetadaten (Nachrichten-IDs) zurückgeben; erfordert eine benachbarte `channel`-ID, damit der Kern das zurückgegebene Zustellungsergebnis kennzeichnen kann |

      Sie können statt der deklarativen Optionen auch rohe Adapterobjekte
      übergeben, wenn Sie vollständige Kontrolle benötigen.

      Rohe ausgehende Adapter können eine Funktion `chunker(text, limit, ctx)`
      definieren. Das optionale `ctx.formatting` enthält zur Zustellungszeit
      getroffene Formatierungsentscheidungen wie `maxLinesPerMessage`; wenden
      Sie diese vor dem Senden an, damit Antwort-Threads und Abschnittsgrenzen
      durch die gemeinsame ausgehende Zustellung nur einmal aufgelöst werden.
      Sendekontexte enthalten außerdem `replyToIdSource` (`implicit` oder
      `explicit`), wenn ein natives Antwortziel aufgelöst wurde, sodass
      Payload-Hilfsfunktionen explizite Antwort-Tags erhalten können, ohne
      einen impliziten, einmalig verwendbaren Antwortplatz zu verbrauchen.
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
      description: "Channel-Plugin für Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Verwaltung von Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Verwaltung von Acme Chat",
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

    Platzieren Sie Channel-eigene CLI-Deskriptoren in
    `registerCliMetadata(...)`, damit OpenClaw sie in der Stammhilfe anzeigen
    kann, ohne die vollständige Channel-Runtime zu aktivieren, während bei
    normalen vollständigen Ladevorgängen dieselben Deskriptoren weiterhin für
    die tatsächliche Befehlsregistrierung übernommen werden. Verwenden Sie
    `registerFull(...)` weiterhin für Arbeiten, die nur zur Runtime gehören.
    `defineChannelPluginEntry` verarbeitet die Aufteilung der
    Registrierungsmodi automatisch. Wenn `registerFull(...)`
    Gateway-RPC-Methoden registriert, verwenden Sie ein Plugin-spezifisches
    Präfix. Die administrativen Kern-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden
    immer zu `operator.admin` aufgelöst. Alle Optionen finden Sie unter
    [Einstiegspunkte](/de/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Einrichtungseinstieg hinzufügen">
    Erstellen Sie `setup-entry.ts` für ein leichtgewichtiges Laden während des
    Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt diesen Einstieg anstelle des vollständigen Einstiegs, wenn
    der Channel deaktiviert oder nicht konfiguriert ist. Dadurch wird
    verhindert, dass während der Einrichtungsabläufe umfangreicher
    Runtime-Code geladen wird. Einzelheiten finden Sie unter
    [Einrichtung und Konfiguration](/de/plugins/sdk-setup#setup-entry).

    Gebündelte Workspace-Channels, die für die Einrichtung geeignete Exporte
    in Sidecar-Module aufteilen, können
    `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem
    einen expliziten Runtime-Setter für die Einrichtungsphase benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an OpenClaw
    weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage
    überprüft und sie über den Handler für eingehende Nachrichten Ihres
    Channels weiterleitet:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // vom Plugin verwaltete Authentifizierung (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Handler für eingehende Nachrichten leitet die Nachricht an OpenClaw weiter.
          // Die genaue Anbindung hängt von Ihrem Plattform-SDK ab –
          // ein konkretes Beispiel finden Sie im gebündelten Plugin-Paket für Microsoft Teams oder Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Die Verarbeitung eingehender Nachrichten ist kanalspezifisch. Jedes Kanal-Plugin besitzt
      seine eigene Pipeline für eingehende Nachrichten. Konkrete Muster finden Sie in gebündelten Kanal-Plugins
      (beispielsweise im Plugin-Paket für Microsoft Teams oder Google Chat).
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie zugehörige Tests in `src/channel.test.ts`:

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
    describeMessageTool und Aktionsermittlung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Laufzeit-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
  <Card title="API für eingehende Kanalnachrichten" icon="bolt" href="/de/plugins/sdk-channel-inbound">
    Gemeinsamer Lebenszyklus eingehender Ereignisse: Erfassen, Auflösen, Aufzeichnen, Weiterleiten, Abschließen
  </Card>
</CardGroup>

<Note>
Einige gebündelte Hilfsschnittstellen bestehen weiterhin für die Wartung gebündelter Plugins und
die Kompatibilität. Sie sind nicht das empfohlene Muster für neue Kanal-Plugins;
bevorzugen Sie die generischen Unterpfade für Kanal, Einrichtung, Antworten und Laufzeit aus der gemeinsamen SDK-
Oberfläche, sofern Sie diese gebündelte Plugin-Familie nicht direkt warten.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) – wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Übersicht](/de/plugins/sdk-overview) – vollständige Referenz für Unterpfadimporte
- [SDK-Tests](/de/plugins/sdk-testing) – Testwerkzeuge und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) – vollständiges Manifestschema

## Verwandte Themen

- [Einrichtung des Plugin-SDK](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugins für das Agent-Harness](/de/plugins/sdk-agent-harness)
