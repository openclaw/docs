---
read_when:
    - Sie erstellen ein neues Plugin für einen Messaging-Kanal
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Schnittstelle von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Channel-Plugins erstellen
x-i18n:
    generated_at: "2026-07-16T13:08:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Dieser Leitfaden erstellt ein Channel-Plugin, das OpenClaw mit einer Messaging-
Plattform verbindet: DM-Sicherheit, Kopplung, Antwort-Threads und ausgehende Nachrichten.

<Info>
  Noch nicht mit OpenClaw-Plugins vertraut? Lesen Sie zuerst [Erste Schritte](/de/plugins/building-plugins),
  um mehr über die Paketstruktur und die Einrichtung des Manifests zu erfahren.
</Info>

## Zuständigkeiten Ihres Plugins

Channel-Plugins implementieren keine Tools zum Senden, Bearbeiten oder Reagieren; der Core stellt ein
gemeinsames `message`-Tool bereit. Ihr Plugin ist für Folgendes zuständig:

- **Konfiguration** - Kontoauflösung und Einrichtungsassistent
- **Sicherheit** - DM-Richtlinie und Zulassungslisten
- **Kopplung** - DM-Genehmigungsablauf
- **Sitzungsgrammatik** - wie Provider-spezifische Konversations-IDs Basis-
  Chats, Thread-IDs und übergeordneten Fallbacks zugeordnet werden
- **Ausgehend** - Senden von Text, Medien und Umfragen an die Plattform
- **Threading** - wie Antworten in Threads eingeordnet werden
- **Heartbeat-Tippanzeige** - optionale Tipp-/Beschäftigt-Signale für Heartbeat-Zustellungs-
  ziele

Der Core ist für das gemeinsame Nachrichtentool, die Prompt-Verknüpfung, die äußere Form des Sitzungsschlüssels,
die allgemeine `:thread:`-Verwaltung und den Versand zuständig.

## Nachrichtenadapter

Stellen Sie einen `message`-Adapter mit `defineChannelMessageAdapter` aus
`openclaw/plugin-sdk/channel-outbound` bereit. Deklarieren Sie nur die dauerhaften Fähigkeiten für den endgültigen Versand,
die Ihr nativer Transport tatsächlich unterstützt, abgesichert durch einen Vertragstest,
der den nativen Nebeneffekt und den zurückgegebenen Beleg nachweist. Leiten Sie Text-/Medien-
sendungen an dieselben Transportfunktionen weiter, die der veraltete `outbound`-Adapter verwendet. Den
vollständigen API-Vertrag, die Fähigkeitsmatrix, Belegregeln, die Finalisierung der Live-Vorschau,
die Richtlinie für Empfangsbestätigungen, Tests und die Migrationstabelle finden Sie unter
[API für ausgehende Channel-Nachrichten](/de/plugins/sdk-channel-outbound).

Wenn Ihr vorhandener `outbound`-Adapter bereits die richtigen Sendemethoden und
Fähigkeitsmetadaten besitzt, leiten Sie den `message`-Adapter mit
`createChannelMessageAdapterFromOutbound(...)` ab, anstatt eine weitere
Brücke manuell zu schreiben. Adapter-Sendungen geben `MessageReceipt`-Werte zurück. Leiten Sie
veraltete IDs mit `listMessageReceiptPlatformIds(...)` oder
`resolveMessageReceiptPrimaryId(...)` ab, anstatt parallele `messageIds`-
Felder beizubehalten.

Deklarieren Sie Live- und Finalisierungsfähigkeiten präzise – der Core entscheidet anhand dieser Angaben,
was ein Channel leisten kann, und eine Abweichung zwischen deklariertem und tatsächlichem Verhalten führt zum
Fehlschlagen eines Vertragstests:

| Oberfläche                            | Werte                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Channels, die einen Vorschauentwurf direkt finalisieren, sollten die Laufzeitlogik
über `defineFinalizableLivePreviewAdapter(...)` zusammen mit
`deliverWithFinalizableLivePreviewAdapter(...)` leiten und die deklarierten
Fähigkeiten durch `verifyChannelMessageLiveCapabilityAdapterProofs(...)`-
und `verifyChannelMessageLiveFinalizerProofs(...)`-Tests absichern, damit natives Vorschau-,
Fortschritts-, Bearbeitungs-, Fallback-/Aufbewahrungs-, Bereinigungs- und Belegverhalten nicht
unbemerkt voneinander abweichen können.

Empfangskomponenten, die Plattformbestätigungen verzögern, sollten
`message.receive.defaultAckPolicy` und `supportedAckPolicies` deklarieren, anstatt
den Bestätigungszeitpunkt in lokalem Monitorzustand zu verbergen. Decken Sie jede deklarierte Richtlinie mit
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ab.

Veraltete Antworthelfer wie `dispatchInboundReplyWithBase` und
`recordInboundSessionAndDispatchReply` bleiben für kompatible
Dispatcher verfügbar. Verwenden Sie sie nicht für neuen Channel-Code; beginnen Sie stattdessen mit dem `message`-
Adapter, Belegen und den Empfangs-/Sendelebenszyklus-Helfern auf
`openclaw/plugin-sdk/channel-outbound`.

### Eingehender Zugang (experimentell)

Channels, die die Autorisierung eingehender Nachrichten migrieren, können den experimentellen
`openclaw/plugin-sdk/channel-ingress-runtime`-Unterpfad aus Empfangspfaden der Laufzeit
verwenden. Er akzeptiert Plattformfakten, rohe Zulassungslisten, Routendeskriptoren, Befehls-
fakten und die Konfiguration von Zugriffsgruppen und gibt anschließend Absender-/Routen-/Befehls-/Aktivierungs-
projektionen sowie den geordneten Zugangsgraphen zurück, während Plattformsuche und Neben-
effekte im Plugin verbleiben. Behalten Sie die Normalisierung der Plugin-Identität in dem
Deskriptor bei, den Sie an den Resolver übergeben; serialisieren Sie keine rohen Übereinstimmungswerte aus
dem aufgelösten Zustand oder der Entscheidung. Unter
[API für eingehende Channel-Nachrichten](/de/plugins/sdk-channel-ingress) finden Sie das API-Design,
die Zuständigkeitsgrenze und die Testerwartungen.

### Tippanzeigen

Wenn Ihr Channel Tippanzeigen außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` im Channel-Plugin bereit. Der Core ruft es mit dem
aufgelösten Heartbeat-Zustellungsziel auf, bevor der Heartbeat-Modelllauf beginnt, und
verwendet den gemeinsamen Lebenszyklus für Aufrechterhaltung und Bereinigung der Tippanzeige. Fügen Sie
`heartbeat.clearTyping(...)` hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

### Parameter für Medienquellen

Wenn Ihr Channel dem Nachrichtentool Parameter hinzufügt, die Medienquellen enthalten, stellen Sie
diese Parameternamen über `plugin.actions.describeMessageTool(...).mediaSourceParams` bereit.
Der Core verwendet diese explizite Liste für die Normalisierung von Sandbox-Pfaden und die Richtlinie für den
Zugriff auf ausgehende Medien, sodass Plugins keine Sonderfälle im gemeinsamen Core für
Provider-spezifische Avatar-, Anhangs- oder Titelbildparameter benötigen.

Bevorzugen Sie eine aktionsbasierte Zuordnung wie `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
damit nicht zusammengehörige Aktionen nicht die Medienargumente einer anderen Aktion übernehmen. Ein flaches Array
funktioniert weiterhin für Parameter, die absichtlich von allen bereitgestellten Aktionen gemeinsam verwendet werden.

Channels, die vorübergehend eine öffentliche URL für einen plattformseitigen Medien-
abruf bereitstellen müssen, können `createHostedOutboundMediaStore(...)` aus
`openclaw/plugin-sdk/outbound-media` mit Plugin-Zustandsspeichern verwenden. Belassen Sie das Parsen von Plattform-
routen und die Token-Durchsetzung im Channel-Plugin; der gemeinsame Helfer
ist nur für das Laden von Medien, Ablaufmetadaten, Blockzeilen und die Bereinigung zuständig.

### Formung nativer Nutzdaten

Wenn Ihr Channel eine Provider-spezifische Formung für `message(action="send")` benötigt,
bevorzugen Sie `actions.prepareSendPayload(...)`. Legen Sie native Karten, Blöcke, Einbettungen oder
andere dauerhafte Daten unter `payload.channelData.<channel>` ab und lassen Sie den Core
über den Adapter für ausgehende Nachrichten senden. Verwenden Sie `actions.handleAction(...)` beim Senden
nur als Kompatibilitäts-Fallback für Nutzdaten, die nicht serialisiert und
erneut versucht werden können.

### Grammatik für Sitzungskonversationen

Wenn Ihre Plattform zusätzlichen Geltungsbereich in Konversations-IDs speichert, belassen Sie das Parsen
mit `messaging.resolveSessionConversation(...)` im Plugin. Dies ist der
kanonische Hook für die Zuordnung von `rawId` zur Basis-Konversations-ID, einer optionalen
Thread-ID, einem expliziten `baseConversationId` und beliebigen
`parentConversationCandidates`. Wenn Sie `parentConversationCandidates` zurückgeben,
ordnen Sie sie von der engsten übergeordneten Konversation bis zur breitesten/Basis-Konversation.

`messaging.resolveParentConversationCandidates(...)` ist ein veralteter
Kompatibilitäts-Fallback für Plugins, die nur übergeordnete Fallbacks zusätzlich zur
allgemeinen/rohen ID benötigen. Wenn beide Hooks vorhanden sind, verwendet der Core zuerst
`resolveSessionConversation(...).parentConversationCandidates` und greift nur dann
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische
Hook sie auslässt.

Gebündelte Plugins, die dasselbe Parsen benötigen, bevor die Channel-Registry startet,
können eine übergeordnete `session-key-api.ts`-Datei mit einem passenden
`resolveSessionConversation(...)`-Export bereitstellen (siehe die Feishu- und Telegram-
Plugins). Der Core verwendet diese startsichere Oberfläche nur, wenn die Laufzeit-Plugin-
Registry noch nicht verfügbar ist.

Verwenden Sie `openclaw/plugin-sdk/channel-route`, wenn Plugin-Code routenähnliche
Felder normalisieren, einen untergeordneten Thread mit seiner übergeordneten Route vergleichen oder einen
stabilen Deduplizierungsschlüssel aus `{ channel, to, accountId, threadId }` erstellen muss. Der Helfer
normalisiert numerische Thread-IDs auf dieselbe Weise wie der Core; bevorzugen Sie ihn daher gegenüber Ad-hoc-
Vergleichen mit `String(threadId)`. Plugins mit Provider-spezifischer Zielgrammatik
sollten `messaging.resolveOutboundSessionRoute(...)` bereitstellen, damit der Core
Provider-native Sitzungs- und Thread-Identitäten ohne Parser-Shims erhält.

### Unterstützung kontobezogener Konversationsbindungen

Setzen Sie `conversationBindings.supportsCurrentConversationBinding`, wenn der Channel
allgemeine Bindungen der aktuellen Konversation unterstützt. `createChatChannelPlugin(...)`
setzt diese statische Fähigkeit standardmäßig auf `true`.

Wenn die Unterstützung je nach konfiguriertem Konto unterschiedlich ist, implementieren Sie außerdem
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Der Core wertet diesen synchronen Hook erst aus, nachdem die statische Fähigkeit
aktiviert wurde. Die Rückgabe von `false` macht allgemeine Fähigkeits-,
Bindungs-, Such-, Auflistungs-, Aktualisierungs- und Aufhebungsvorgänge für die aktuelle Konversation
für dieses Konto nicht verfügbar.
Wird der Hook ausgelassen, gilt die statische Fähigkeit für jedes Konto.

Ermitteln Sie die Antwort aus der bereits geladenen Kontokonfiguration oder dem Laufzeitzustand. Dieser
Hook steuert nur allgemeine Bindungen der aktuellen Konversation; er ersetzt weder
konfigurierte Bindungsregeln noch das Plugin-eigene Sitzungsrouting. Vertragstests
sollten über den von
`openclaw/plugin-sdk/channel-core` exportierten `ChannelPlugin["conversationBindings"]`-Vertrag
mindestens ein unterstütztes und ein nicht unterstütztes Konto abdecken.

## Genehmigungen und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen genehmigungsspezifischen Code. Der Core ist für
`/approve` im selben Chat, gemeinsame Nutzdaten für Genehmigungsschaltflächen und allgemeine Fallback-Zustellung zuständig.
`ChannelPlugin.approvals` wurde entfernt; legen Sie Fakten zu Genehmigungszustellung, nativer Darstellung, Rendering und Autorisierung
stattdessen in einem einzigen `approvalCapability`-Objekt ab. `plugin.auth` dient nur der Anmeldung/Abmeldung
– der Core liest aus diesem Objekt keine Hooks für die Genehmigungsautorisierung mehr.

Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder die Unterdrückung
von Fallbacks und `approvalCapability.render` nur, wenn ein Channel tatsächlich
benutzerdefinierte Genehmigungsnutzdaten anstelle des gemeinsamen Renderers benötigt.

### Genehmigungsautorisierung

- `approvalCapability.authorizeActorAction` und
  `approvalCapability.getActionAvailabilityState` bilden die kanonische
  Schnittstelle für die Genehmigungsautorisierung.
- Verwenden Sie `getActionAvailabilityState` für die Verfügbarkeit der Genehmigungsautorisierung im selben Chat.
  Sorgen Sie dafür, dass konfigurierte Genehmiger für `/approve` verfügbar bleiben, selbst wenn die native Zustellung
  deaktiviert ist; verwenden Sie stattdessen den Zustand der nativen Ausgangsoberfläche für Zustellungs-/Einrichtungshinweise.
- Wenn Ihr Channel native Ausführungsgenehmigungen bereitstellt, verwenden Sie
  `approvalCapability.getExecInitiatingSurfaceState` für den
  Zustand der Ausgangsoberfläche/des nativen Clients, wenn dieser von der Genehmigungsautorisierung
  im selben Chat abweicht. Der Core verwendet diesen ausführungsspezifischen Hook, um zwischen `enabled` und
  `disabled` zu unterscheiden, zu entscheiden, ob der Ausgangs-Channel native Ausführungs-
  genehmigungen unterstützt, und den Channel in Fallback-Hinweise für native Clients aufzunehmen.
  `createApproverRestrictedNativeApprovalCapability(...)` trägt dies für
  den üblichen Fall ein.
- Wenn ein Channel stabile inhaberähnliche DM-Identitäten aus einer vorhandenen Konfiguration ableiten kann,
  verwenden Sie `createResolvedApproverActionAuthAdapter` aus
  `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken,
  ohne dem Core genehmigungsspezifische Logik hinzuzufügen.
- Wenn eine benutzerdefinierte Genehmigungsautorisierung absichtlich nur den Fallback im selben Chat zulässt, geben Sie
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` aus
  `openclaw/plugin-sdk/approval-auth-runtime` zurück; andernfalls behandelt der Core das
  Ergebnis als ausdrückliche Autorisierung eines Genehmigers.
- Wenn ein Channel-eigener nativer Callback Genehmigungen direkt auflöst, verwenden Sie
  vor der Auflösung `isImplicitSameChatApprovalAuthorization(...)`, damit ein impliziter
  Fallback weiterhin die normale Akteurautorisierung des Channels durchläuft.

### Lebenszyklus der Nutzdaten und Einrichtungshinweise

- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder
  `outbound.beforeDeliverPayload` für Channel-spezifisches Verhalten im Lebenszyklus der Nutzdaten,
  etwa das Ausblenden doppelter lokaler Genehmigungsaufforderungen oder das Senden von Tipp-
  anzeigen vor der Zustellung.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Channel
  in der Antwort für den deaktivierten Pfad die genauen Konfigurationsoptionen erläutern soll, die zum Aktivieren
  nativer Ausführungsgenehmigungen erforderlich sind. Der Hook empfängt `{ channel, channelLabel, accountId }`;
  Channels mit benannten Konten sollten kontobezogene Pfade wie
  `channels.<channel>.accounts.<id>.execApprovals.*` anstelle übergeordneter
  Standardwerte darstellen.
- Verwenden Sie `approvalCapability.describePluginApprovalSetup`, wenn Hinweise zu Fehlern bei Plugin-Genehmigungen
  bei Fehlern wegen fehlender Route oder Zeitüberschreitungen für Plugin-Genehmigungen gefahrlos angezeigt werden können.
  `createApproverRestrictedNativeApprovalCapability(...)` leitet dies nicht
  aus `describeExecApprovalSetup` ab; übergeben Sie denselben Helfer nur dann ausdrücklich,
  wenn Plugin- und Ausführungsgenehmigungen tatsächlich dieselbe native Einrichtung verwenden.

### Native Genehmigungszustellung

Wenn ein Channel native Genehmigungszustellung benötigt, konzentrieren Sie den Channel-Code auf
Zielnormalisierung sowie Transport-/Darstellungsfakten. Verwenden Sie
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` und
`createApproverRestrictedNativeApprovalCapability` aus
`openclaw/plugin-sdk/approval-runtime`. Legen Sie die Channel-spezifischen Fakten hinter
`approvalCapability.nativeRuntime` ab, idealerweise über
`createChannelApprovalNativeRuntimeAdapter(...)` oder
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit der Core den
Handler zusammensetzen und für Anfragefilterung, Routing, Deduplizierung, Ablauf, Gateway-
Abonnement und Hinweise zur anderweitigen Weiterleitung zuständig sein kann.

`nativeRuntime` ist in einige kleinere Schnittstellen aufgeteilt:

- `availability` – ob das Konto konfiguriert ist und ob eine Anfrage
  verarbeitet werden soll
- `presentation` – das gemeinsame Ansichtsmodell für Genehmigungen auf
  ausstehende/abgeschlossene/abgelaufene native Payloads oder endgültige Aktionen abbilden
- `transport` – Ziele vorbereiten sowie native Genehmigungsnachrichten
  senden/aktualisieren/löschen
- `interactions` – optionale Hooks zum Binden/Aufheben der Bindung/Löschen von Aktionen für native Schaltflächen
  oder Reaktionen sowie ein optionaler `cancelDelivered`-Hook. Implementieren Sie
  `cancelDelivered`, wenn `deliverPending` prozessinternen oder persistenten
  Zustand registriert (etwa einen Speicher für Reaktionsziele), damit dieser Zustand freigegeben werden kann, falls das
  Stoppen eines Handlers die Zustellung abbricht, bevor `bindPending` ausgeführt wird, oder wenn
  `bindPending` kein Handle zurückgibt
- `observe` – optionale Hooks für Zustellungsdiagnosen

Weitere Hilfsfunktionen für Genehmigungen:

- Verwenden Sie `createNativeApprovalChannelRouteGates` aus
  `openclaw/plugin-sdk/approval-native-runtime`, wenn ein Kanal sowohl
  sitzungsursprüngliche native Zustellung als auch explizite Weiterleitungsziele für Genehmigungen unterstützt. Die
  Hilfsfunktion zentralisiert die Auswahl der Genehmigungskonfiguration, die Behandlung von `mode`, Agent-/Sitzungsfilter,
  Kontobindung, den Abgleich von Sitzungszielen und den Abgleich von Ziellisten,
  während die Aufrufer weiterhin für die Kanal-ID, den standardmäßigen Weiterleitungsmodus, die Kontosuche,
  die Prüfung auf aktivierten Transport, die Zielnormalisierung und die Auflösung des
  Ziels aus der Turn-Quelle verantwortlich sind. Verwenden Sie sie nicht, um kanaleigene Richtlinienstandards im Core
  zu erstellen; übergeben Sie den dokumentierten Standardmodus des Kanals explizit.
- `createChannelNativeOriginTargetResolver` verwendet standardmäßig den gemeinsamen Kanalrouten-
  Abgleich für `{ to, accountId, threadId }`-Ziele. Übergeben Sie
  `targetsMatch` nur, wenn ein Kanal Provider-spezifische Äquivalenzregeln besitzt,
  etwa den Abgleich von Slack-Zeitstempelpräfixen. Übergeben Sie `normalizeTargetForMatch`, wenn
  der Kanal Provider-IDs kanonisieren muss, bevor der standardmäßige Routenabgleich
  oder ein benutzerdefinierter `targetsMatch`-Callback ausgeführt wird, wobei das
  ursprüngliche Ziel für die Zustellung erhalten bleibt. Verwenden Sie `normalizeTarget` nur, wenn das aufgelöste
  Zustellungsziel selbst kanonisiert werden soll.
- Wenn der Kanal laufzeiteigene Objekte wie einen Client, ein Token, eine Bolt-
  App oder einen Webhook-Empfänger benötigt, registrieren Sie diese über
  `openclaw/plugin-sdk/channel-runtime-context`. Mit der generischen Registry für den Laufzeitkontext
  kann der Core funktionsgesteuerte Handler aus dem Kanal-
  Startzustand initialisieren, ohne Genehmigungs-spezifischen Wrapper-Code hinzuzufügen.
- Greifen Sie nur dann auf die niedrigeren Ebenen `createChannelApprovalHandler` oder
  `createChannelNativeApprovalRuntime` zurück, wenn die funktionsgesteuerte Schnittstelle
  noch nicht ausdrucksstark genug ist.
- Native Genehmigungskanäle müssen sowohl `accountId` als auch `approvalKind`
  über diese Hilfsfunktionen leiten. `accountId` beschränkt die Genehmigungsrichtlinie für mehrere Konten
  auf das richtige Bot-Konto, und `approvalKind` stellt dem Kanal das unterschiedliche
  Genehmigungsverhalten für Ausführungen und Plugins bereit, ohne fest codierte Verzweigungen im
  Core.
- Der Core ist auch für Hinweise zur Umleitung von Genehmigungen verantwortlich. Kanal-Plugins sollten
  aus `createChannelNativeApprovalRuntime` keine eigenen Folgemeldungen wie „Genehmigung wurde an Direktnachrichten/einen anderen Kanal gesendet“
  senden; stellen Sie stattdessen über die gemeinsamen Hilfsfunktionen für Genehmigungsfunktionen eine korrekte Weiterleitung vom Ursprung
  und zu den Direktnachrichten der genehmigenden Person bereit und lassen Sie
  den Core die tatsächlichen Zustellungen aggregieren, bevor ein Hinweis an den
  initiierenden Chat gesendet wird.
- Behalten Sie die Art der zugestellten Genehmigungs-ID durchgängig bei. Native Clients sollten
  die Weiterleitung von Ausführungs- und Plugin-Genehmigungen nicht anhand kanal-
  lokalen Zustands erraten oder umschreiben.
- Übergeben Sie diesen expliziten `approvalKind` an `resolveApprovalOverGateway`. Dies verwendet
  den kanonischen `approval.resolve`-Dienst und gibt die aufgezeichnete erfolgreiche Antwort zurück, wenn
  eine andere Oberfläche zuerst antwortet. Die ältere explizite Eingabe `resolveMethod`
  bleibt für befehlsbasierte Steuerelemente bestehen; neue native Aktionen dürfen sie nicht verwenden oder
  die Art aus einer ID ableiten.
- Verschiedene Genehmigungsarten können bewusst unterschiedliche native
  Oberflächen bereitstellen. Aktuelle gebündelte Beispiele: Matrix behält für Ausführungs- und Plugin-Genehmigungen dieselbe native Weiterleitung
  in Direktnachrichten/Kanäle und dieselbe Reaktions-UX bei, ermöglicht aber weiterhin
  eine je nach Genehmigungsart unterschiedliche Authentifizierung; Slack stellt die native Genehmigungsweiterleitung
  sowohl für Ausführungs- als auch für Plugin-IDs bereit.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als
  Kompatibilitäts-Wrapper, neuer Code sollte jedoch den Funktions-Builder bevorzugen
  und `approvalCapability` im Plugin bereitstellen.

### Engere Unterpfade der Genehmigungslaufzeit

Bevorzugen Sie für häufig ausgeführte Kanaleinstiegspunkte diese engeren Unterpfade gegenüber dem breiteren
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
nicht alle benötigen.

### Setup-Unterpfade

- `openclaw/plugin-sdk/setup-runtime` umfasst die laufzeitsicheren Setup-Hilfsfunktionen:
  `createSetupTranslator`, importsichere Adapter für Setup-Patches
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), die Ausgabe von Suchhinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder.
- `openclaw/plugin-sdk/channel-setup` umfasst die Setup-
  Builder für optionale Installationen sowie einige Setup-sichere Primitive: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` und `splitSetupEntries`.
- Verwenden Sie die breitere `openclaw/plugin-sdk/setup`-Schnittstelle nur, wenn Sie außerdem
  die umfangreicheren gemeinsamen Setup-/Konfigurationshilfen wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen.

Wenn Ihr Kanal in Setup-Oberflächen lediglich „Installieren Sie zuerst dieses Plugin“ anzeigen soll,
bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent verweigert Konfigurationsschreibvorgänge und die Finalisierung standardmäßig und verwendet
für Validierung, Finalisierung und den Text des Dokumentationslinks dieselbe Meldung zur erforderlichen Installation.

Wenn Ihr Kanal ein umgebungsvariablengesteuertes Setup oder eine solche Authentifizierung unterstützt und generische Start-/Konfigurations-
abläufe diese Umgebungsvariablennamen kennen sollen, bevor die Laufzeit geladen wird, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie `envVars` der Kanallaufzeit oder lokale
Konstanten ausschließlich für betreiberorientierte Texte bei.

Wenn Ihr Kanal in `status`, `channels list`, `channels status` oder
SecretRef-Scans erscheinen kann, bevor die Plugin-Laufzeit startet, fügen Sie `openclaw.setupEntry` in
`package.json` hinzu. Dieser Einstiegspunkt sollte in schreibgeschützten Befehls-
pfaden sicher importierbar sein und die Kanalmetadaten, den Setup-sicheren Konfigurationsadapter,
den Statusadapter und die Metadaten der geheimen Kanalziele zurückgeben, die für diese
Zusammenfassungen erforderlich sind. Starten Sie über den Setup-Einstieg keine Clients, Listener oder Transportlaufzeiten.

Halten Sie auch den Importpfad des Hauptkanaleinstiegs schlank. Die Erkennung kann
den Einstieg und das Kanal-Plugin-Modul auswerten, um Funktionen zu registrieren, ohne
den Kanal zu aktivieren. Dateien wie `channel-plugin-api.ts` sollten
das Kanal-Plugin-Objekt exportieren, ohne Setup-Assistenten, Transport-
Clients, Socket-Listener, Starter für Unterprozesse oder Module zum Starten von Diensten zu importieren.
Platzieren Sie diese Laufzeitkomponenten in Modulen, die aus `registerFull(...)`, Laufzeit-
Settern oder verzögert geladenen Funktionsadaptern geladen werden.

### Weitere eng gefasste Kanal-Unterpfade

Bevorzugen Sie für andere häufig ausgeführte Kanalpfade die eng gefassten Hilfsfunktionen gegenüber breiteren älteren
Oberflächen:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für die Konfiguration mehrerer Konten und den
  Rückgriff auf das Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/channel-inbound` für eingehende Routen/Envelopes sowie die
  Verdrahtung von Aufzeichnung und Weiterleitung
- `openclaw/plugin-sdk/channel-targets` für Hilfsfunktionen zur Zielanalyse
- `openclaw/plugin-sdk/outbound-media` zum Laden von Medien und
  `openclaw/plugin-sdk/channel-outbound` für ausgehende Identitäts-/Sende-Delegaten
  sowie die Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route
  einen expliziten `replyToId`/`threadId` beibehalten oder die aktuelle `:thread:`-
  Sitzung wiederherstellen soll, nachdem der Basissitzungsschlüssel weiterhin übereinstimmt. Provider-Plugins können
  die Rangfolge, das Suffixverhalten und die Normalisierung der Thread-ID überschreiben, wenn
  ihre Plattform eine native Semantik für die Thread-Zustellung besitzt.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus der Thread-Bindung
  und die Adapterregistrierung
- `openclaw/plugin-sdk/agent-media-payload` nur, wenn weiterhin ein älteres Feldlayout für Agenten-/Medien-
  Payloads erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` (veraltet: kein gebündeltes
  Plugin verwendet es in der Produktion) für die Normalisierung benutzerdefinierter Telegram-Befehle,
  die Validierung von Duplikaten/Konflikten und einen bei Rückgriffen stabilen Vertrag für die Befehlskonfiguration;
  bevorzugen Sie für neuen Plugin-Code die Plugin-lokale Handhabung der Befehlskonfiguration

Kanäle, die nur Authentifizierung bereitstellen, können üblicherweise beim Standardpfad bleiben: Der Core verarbeitet
Genehmigungen, und das Plugin stellt lediglich Funktionen für ausgehende Vorgänge/Authentifizierung bereit. Native
Genehmigungskanäle wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte
sollten die gemeinsamen nativen Hilfsfunktionen verwenden, anstatt einen eigenen Genehmigungs-
lebenszyklus zu implementieren.

## Richtlinie für Erwähnungen in eingehenden Nachrichten

Halten Sie die Verarbeitung von Erwähnungen in eingehenden Nachrichten in zwei Ebenen getrennt:

- Plugin-eigene Erfassung von Nachweisen
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur, wenn Sie das breitere
Barrel für Hilfsfunktionen eingehender Nachrichten benötigen.

Geeignet für Plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung zitierter Bot-Nachrichten
- Prüfung der Thread-Teilnahme
- Ausschluss von Dienst-/Systemnachrichten
- plattformnative Caches, die zum Nachweis der Bot-Teilnahme benötigt werden

Geeignet für die gemeinsame Hilfsfunktion:

- `requireMention`
- Ergebnis der expliziten Erwähnung
- Positivliste für implizite Erwähnungen
- Befehlsumgehung
- endgültige Entscheidung zum Überspringen

Bevorzugter Ablauf:

1. Berechnen Sie die lokalen Erwähnungsfakten.
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
`isExplicitlyMentioned` und `canResolveExplicit` stammen aus den eigenen
nativen Erwähnungsmetadaten des Kanals (Nachrichtenentitäten, Flags für Antworten an den Bot und Ähnliches);
geben Sie `false`-/`undefined`-Werte an, wenn Ihre Plattform sie nicht erkennen kann.

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Hilfsfunktionen für Erwähnungen für
gebündelte Kanal-Plugins bereit, die bereits von Laufzeitinjektion abhängen:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Wenn Sie nur `implicitMentionKindWhen` und `resolveInboundMentionDecision` benötigen,
importieren Sie sie aus `openclaw/plugin-sdk/channel-mention-gating`, um das Laden
nicht zugehöriger Laufzeithilfen für eingehende Nachrichten zu vermeiden.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die standardmäßigen Plugin-Dateien. Das Feld `channels` in
    `openclaw.plugin.json` (nicht ein Feld `kind`) kennzeichnet ein Manifest als
    Eigentümer eines Kanals. Die vollständige Oberfläche der Paketmetadaten finden Sie unter
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
    Quelle im Cold Path, die von Konfigurationsschema, Einrichtung und UI-Oberflächen verwendet wird, bevor die
    Plugin-Laufzeit geladen wird. Die vollständige Referenz der Felder auf oberster Ebene finden Sie unter
    [Plugin-Manifest](/de/plugins/manifest).

  </Step>

  <Step title="Kanal-Plugin-Objekt erstellen">
    Die Schnittstelle `ChannelPlugin` besitzt viele optionale Adapteroberflächen. Beginnen Sie mit
    dem Minimum – `id`, `config` und `setup` – und fügen Sie bei Bedarf
    weitere Adapter hinzu.

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

      // Threading: Wie Antworten zugestellt werden
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

    Verwenden Sie für Kanäle, die sowohl kanonische DM-Schlüssel auf oberster Ebene als auch veraltete verschachtelte Schlüssel akzeptieren, die Hilfsfunktionen aus `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` und `normalizeChannelDmPolicy` priorisieren kontolokale Werte gegenüber geerbten Stammwerten. Kombinieren Sie denselben Resolver über `normalizeLegacyDmAliases` mit der Doctor-Reparatur, damit Laufzeit und Migration denselben Vertrag lesen.

    <Accordion title="Was createChatChannelPlugin für Sie erledigt">
      Anstatt Low-Level-Adapterschnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, aus denen der Builder die Adapter zusammensetzt:

      | Option | Was dadurch eingebunden wird |
      | --- | --- |
      | `security.dm` | Bereichsbezogener Resolver für DM-Sicherheit aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Kopplungsablauf mit Codeaustausch |
      | `threading` | Resolver für den Antwortmodus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten (Nachrichten-IDs) zurückgeben; erfordert eine zugehörige ID `channel`, damit der Core das zurückgegebene Zustellergebnis kennzeichnen kann |

      Wenn Sie vollständige Kontrolle benötigen, können Sie anstelle der deklarativen Optionen
      auch unverarbeitete Adapterobjekte übergeben.

      Unverarbeitete ausgehende Adapter können eine Funktion `chunker(text, limit, ctx)` definieren.
      Das optionale `ctx.formatting` enthält Formatierungsentscheidungen für den Zustellzeitpunkt
      wie `maxLinesPerMessage`; wenden Sie es vor dem Senden an, damit Antwort-Threading
      und Chunk-Grenzen einmalig durch die gemeinsame ausgehende Zustellung aufgelöst werden.
      Sendekontexte enthalten außerdem `replyToIdSource` (`implicit` oder `explicit`),
      wenn ein natives Antwortziel aufgelöst wurde, sodass Payload-Hilfsfunktionen
      explizite Antwort-Tags beibehalten können, ohne einen impliziten, nur einmal verwendbaren Antwort-Slot zu verbrauchen.
    </Accordion>

  </Step>

  <Step title="Einstiegspunkt einbinden">
    Erstellen Sie `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Kanal-Plugin für Acme Chat",
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

    Legen Sie kanaleigene CLI-Deskriptoren in `registerCliMetadata(...)` ab, damit OpenClaw
    sie in der Stammhilfe anzeigen kann, ohne die vollständige Kanallaufzeit zu aktivieren,
    während normale vollständige Ladevorgänge weiterhin dieselben Deskriptoren für die tatsächliche
    Befehlsregistrierung übernehmen. Verwenden Sie `registerFull(...)` weiterhin nur für Laufzeitaufgaben.
    `defineChannelPluginEntry` verarbeitet die Aufteilung der Registrierungsmodi automatisch.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    Plugin-spezifisches Präfix. Die Core-Admin-Namensräume (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst. Alle Optionen finden Sie unter
    [Einstiegspunkte](/de/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Einrichtungs-Einstiegspunkt hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt diesen anstelle des vollständigen Einstiegspunkts, wenn der Kanal deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, während Einrichtungsabläufen umfangreichen Laufzeitcode zu laden.
    Weitere Informationen finden Sie unter [Einrichtung und Konfiguration](/de/plugins/sdk-setup#setup-entry).

    Gebündelte Workspace-Kanäle, die einrichtungssichere Exporte in Sidecar-
    Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen
    expliziten Laufzeit-Setter für die Einrichtungsphase benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Handler für eingehende Nachrichten Ihres Kanals weiterleitet:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin-verwaltete Authentifizierung (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Handler für eingehende Nachrichten leitet die Nachricht an OpenClaw weiter.
          // Die genaue Einbindung hängt von Ihrem Plattform-SDK ab –
          // ein reales Beispiel finden Sie im gebündelten Plugin-Paket für Microsoft Teams oder Google Chat.
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
      seine eigene Pipeline für eingehende Nachrichten. Reale Muster finden Sie in gebündelten Kanal-Plugins
      (beispielsweise im Plugin-Paket für Microsoft Teams oder Google Chat).
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie zusammen mit dem zugehörigen Code abgelegte Tests in `src/channel.test.ts`:

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

    Informationen zu gemeinsam genutzten Testhelfern finden Sie unter [Tests](/de/plugins/sdk-testing).

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
  <Card title="Integration des Nachrichtentools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Aktionserkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Laufzeithelfer" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien und Subagent über api.runtime
  </Card>
  <Card title="API für eingehende Kanalereignisse" icon="bolt" href="/de/plugins/sdk-channel-inbound">
    Gemeinsamer Lebenszyklus eingehender Ereignisse: Erfassen, Auflösen, Aufzeichnen, Verteilen, Abschließen
  </Card>
</CardGroup>

<Note>
Einige gebündelte Hilfsschnittstellen bestehen weiterhin für die Wartung gebündelter Plugins und
die Kompatibilität. Sie sind nicht das empfohlene Muster für neue Kanal-Plugins;
bevorzugen Sie die generischen Unterpfade für Kanal, Einrichtung, Antworten und Laufzeit aus der gemeinsamen SDK-
Oberfläche, sofern Sie diese Familie gebündelter Plugins nicht direkt pflegen.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) – wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Übersicht](/de/plugins/sdk-overview) – vollständige Referenz der Unterpfadimporte
- [SDK-Tests](/de/plugins/sdk-testing) – Testwerkzeuge und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) – vollständiges Manifestschema

## Verwandte Themen

- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugins für das Agent-Harness](/de/plugins/sdk-agent-harness)
