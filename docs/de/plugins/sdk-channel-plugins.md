---
read_when:
    - Sie erstellen ein neues Messaging-Channel-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Schnittstelle von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Channel-Plugins für OpenClaw
title: Channel-Plugins erstellen
x-i18n:
    generated_at: "2026-06-27T17:58:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Dieser Leitfaden führt Sie durch den Aufbau eines Channel-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende verfügen Sie über einen funktionierenden Channel mit DM-Sicherheit,
Pairing, Antwort-Threading und ausgehenden Nachrichten.

<Info>
  Wenn Sie zuvor noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und Manifest-Einrichtung.
</Info>

## Funktionsweise von Channel-Plugins

Channel-Plugins benötigen keine eigenen Tools zum Senden, Bearbeiten oder Reagieren. OpenClaw hält ein
gemeinsames `message`-Tool im Kern vor. Ihr Plugin besitzt:

- **Konfiguration** - Kontoauflösung und Einrichtungsassistent
- **Sicherheit** - DM-Richtlinie und Allowlists
- **Pairing** - DM-Genehmigungsablauf
- **Sitzungsgrammatik** - wie provider-spezifische Konversations-IDs Basis-Chats, Thread-IDs und übergeordnete Fallbacks zugeordnet werden
- **Ausgehend** - Senden von Text, Medien und Umfragen an die Plattform
- **Threading** - wie Antworten in Threads organisiert werden
- **Heartbeat-Tippen** - optionale Tipp-/Beschäftigt-Signale für Heartbeat-Zustellziele

Der Kern besitzt das gemeinsame Nachrichtentool, Prompt-Verkabelung, die äußere Sitzungs-Schlüssel-Form,
generische `:thread:`-Buchhaltung und Dispatch.

Neue Channel-Plugins sollten außerdem einen `message`-Adapter mit
`defineChannelMessageAdapter` aus `openclaw/plugin-sdk/channel-outbound` bereitstellen. Der
Adapter deklariert, welche dauerhaften Final-Send-Fähigkeiten der native Transport
tatsächlich unterstützt, und verweist Text-/Mediensendungen auf dieselben Transportfunktionen wie
der ältere `outbound`-Adapter. Deklarieren Sie eine Fähigkeit nur, wenn ein Vertragstest
den nativen Seiteneffekt und die zurückgegebene Empfangsbestätigung nachweist.
Den vollständigen API-Vertrag, Beispiele, die Fähigkeitsmatrix, Empfangsbestätigungsregeln, Live-
Preview-Finalisierung, Empfangsbestätigungsrichtlinie, Tests und Migrationstabelle finden Sie unter
[Channel-Outbound-API](/de/plugins/sdk-channel-outbound).
Wenn der vorhandene `outbound`-Adapter bereits die richtigen Sendemethoden und
Fähigkeitsmetadaten hat, verwenden Sie `createChannelMessageAdapterFromOutbound(...)`, um
den `message`-Adapter abzuleiten, statt eine weitere Brücke manuell zu schreiben.
Adapter-Sendungen sollten `MessageReceipt`-Werte zurückgeben. Wenn Kompatibilitätscode
weiterhin alte IDs benötigt, leiten Sie diese mit `listMessageReceiptPlatformIds(...)`
oder `resolveMessageReceiptPrimaryId(...)` ab, statt parallele
`messageIds`-Felder in neuem Lebenszykluscode beizubehalten.
Preview-fähige Channels sollten außerdem `message.live.capabilities` mit
dem exakten Live-Lebenszyklus deklarieren, den sie besitzen, zum Beispiel `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` oder
`quietFinalization`. Channels, die eine Entwurfs-Preview direkt finalisieren, sollten
außerdem `message.live.finalizer.capabilities` deklarieren, zum Beispiel `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` und
`retainOnAmbiguousFailure`, und die Laufzeitlogik über
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)` routen. Halten Sie diese Fähigkeiten durch
`verifyChannelMessageLiveCapabilityAdapterProofs(...)`- und
`verifyChannelMessageLiveFinalizerProofs(...)`-Tests abgesichert, damit natives Preview-,
Fortschritts-, Bearbeitungs-, Fallback-/Beibehaltungs-, Bereinigungs- und Empfangsbestätigungsverhalten
nicht unbemerkt abweichen kann.
Eingehende Empfänger, die Plattformbestätigungen zurückstellen, sollten
`message.receive.defaultAckPolicy` und `supportedAckPolicies` deklarieren, statt
das Bestätigungs-Timing in monitor-lokalem Zustand zu verstecken. Decken Sie jede deklarierte Richtlinie mit
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ab.

Legacy-Antworthelfer wie `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` und `recordInboundSessionAndDispatchReply`
bleiben für Kompatibilitäts-Dispatcher verfügbar. Verwenden Sie diese Namen nicht für neuen
Channel-Code; neue Plugins sollten mit dem `message`-Adapter, Empfangsbestätigungen und
Empfangs-/Sende-Lebenszyklushelfern unter `openclaw/plugin-sdk/channel-outbound` beginnen.

Channels, die eingehende Autorisierung migrieren, können den experimentellen
`openclaw/plugin-sdk/channel-ingress-runtime`-Unterpfad aus Laufzeit-Empfangspfaden verwenden.
Der Unterpfad belässt Plattform-Lookup und Seiteneffekte im Plugin und teilt zugleich
Allowlist-Zustandsauflösung, Routen-/Absender-/Befehls-/Ereignis-/Aktivierungsentscheidungen,
redigierte Diagnosen und Turn-Zulassungszuordnung. Behalten Sie die Normalisierung der
Plugin-Identität im Descriptor, den Sie an den Resolver übergeben; serialisieren Sie keine
rohen Match-Werte aus dem aufgelösten Zustand oder der Entscheidung. Siehe
[Channel-Ingress-API](/de/plugins/sdk-channel-ingress) für API-Design,
Besitzgrenze und Testerwartungen.

Wenn Ihr Channel Tippindikatoren außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` im Channel-Plugin bereit. Der Kern ruft es mit dem
aufgelösten Heartbeat-Zustellziel auf, bevor der Heartbeat-Modelllauf beginnt, und
verwendet den gemeinsamen Tipp-Keepalive-/Bereinigungslebenszyklus. Fügen Sie `heartbeat.clearTyping(...)`
hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

Wenn Ihr Channel Nachrichtentool-Parameter hinzufügt, die Medienquellen tragen, stellen Sie diese
Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit. Der Kern verwendet
diese explizite Liste für Sandbox-Pfadnormalisierung und Richtlinien für ausgehenden Medienzugriff,
sodass Plugins keine Shared-Core-Sonderfälle für provider-spezifische
Avatar-, Anhangs- oder Titelbild-Parameter benötigen.
Bevorzugen Sie die Rückgabe einer nach Aktionen verschlüsselten Map wie
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht zusammenhängende Aktionen nicht
die Medienargumente einer anderen Aktion erben. Ein flaches Array funktioniert weiterhin für Parameter, die
absichtlich über alle bereitgestellten Aktionen hinweg geteilt werden.
Channels, die eine temporäre öffentliche URL für einen plattformseitigen Medienabruf
bereitstellen müssen, können `createHostedOutboundMediaStore(...)` aus
`openclaw/plugin-sdk/outbound-media` mit Plugin-Zustandsspeichern verwenden. Behalten Sie
Plattform-Routenparsing und Token-Erzwingung im Channel-Plugin; der gemeinsame Helfer
besitzt nur Medienladen, Ablaufmetadaten, Chunk-Zeilen und Bereinigung.

Wenn Ihr Channel provider-spezifische Formung für `message(action="send")` benötigt,
bevorzugen Sie `actions.prepareSendPayload(...)`. Legen Sie native Karten, Blöcke, Einbettungen oder
andere dauerhafte Daten unter `payload.channelData.<channel>` ab und lassen Sie den Kern
den tatsächlichen Versand über den Outbound-/Message-Adapter ausführen. Verwenden Sie
`actions.handleAction(...)` für das Senden nur als Kompatibilitäts-Fallback für
Payloads, die nicht serialisiert und erneut versucht werden können.

Wenn Ihre Plattform zusätzlichen Scope in Konversations-IDs speichert, behalten Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook für die Zuordnung von `rawId` zur Basis-Konversations-ID, optionaler Thread-
ID, expliziter `baseConversationId` und etwaigen `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie sie von der
engsten übergeordneten Konversation bis zur breitesten/Basis-Konversation sortiert.

Verwenden Sie `openclaw/plugin-sdk/channel-route`, wenn Plugin-Code routenartige
Felder normalisieren, einen untergeordneten Thread mit seiner übergeordneten Route vergleichen oder einen
stabilen Deduplizierungsschlüssel aus `{ channel, to, accountId, threadId }` erstellen muss. Der Helfer
normalisiert numerische Thread-IDs genauso wie der Kern, daher sollten Plugins ihn gegenüber
Ad-hoc-`String(threadId)`-Vergleichen bevorzugen.
Plugins mit provider-spezifischer Zielgrammatik sollten
`messaging.resolveOutboundSessionRoute(...)` bereitstellen, damit der Kern provider-native
Sitzungs- und Thread-Identität erhält, ohne Parser-Shims zu verwenden.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Channel-Registry startet,
können außerdem eine Top-Level-Datei `session-key-api.ts` mit einem passenden
`resolveSessionConversation(...)`-Export bereitstellen. Der Kern verwendet diese bootstrapsichere Oberfläche
nur, wenn die Laufzeit-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur übergeordnete Fallbacks zusätzlich
zur generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet der Kern zuerst
`resolveSessionConversation(...).parentConversationCandidates` und fällt nur dann
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie auslässt.

## Genehmigungen und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen genehmigungsspezifischen Code.

- Core besitzt `/approve` im selben Chat, gemeinsam genutzte Genehmigungsbutton-Payloads und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt im Kanal-Plugin, wenn der Kanal genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung, nativer Darstellung, Rendering und Auth auf `approvalCapability`.
- `plugin.auth` ist nur Login/Logout; Core liest keine Genehmigungs-Auth-Hooks mehr aus diesem Objekt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Schnittstelle für Genehmigungs-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit der Genehmigungs-Auth im selben Chat.
- Wenn Ihr Kanal native exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Zustand der auslösenden Oberfläche bzw. des nativen Clients, wenn er sich von der Genehmigungs-Auth im selben Chat unterscheidet. Core verwendet diesen exec-spezifischen Hook, um `enabled` von `disabled` zu unterscheiden, zu entscheiden, ob der auslösende Kanal native exec-Genehmigungen unterstützt, und den Kanal in Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den üblichen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für kanalspezifisches Payload-Lebenszyklusverhalten, etwa das Ausblenden doppelter lokaler Genehmigungsaufforderungen oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder Fallback-Unterdrückung.
- Verwenden Sie `approvalCapability.nativeRuntime` für kanaleigene native Genehmigungsfakten. Halten Sie es an heißen Kanal-Einstiegspunkten mit `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy; dieser Adapter kann Ihr Runtime-Modul bei Bedarf importieren und Core trotzdem den Genehmigungslebenszyklus zusammensetzen lassen.
- Verwenden Sie `approvalCapability.render` nur, wenn ein Kanal wirklich eigene Genehmigungs-Payloads anstelle des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Kanal in der Antwort für den deaktivierten Pfad erklären soll, welche exakten Konfigurationsschalter zum Aktivieren nativer exec-Genehmigungen benötigt werden. Der Hook erhält `{ channel, channelLabel, accountId }`; Kanäle mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Standardwerten auf oberster Ebene rendern.
- Wenn ein Kanal stabile besitzerähnliche DM-Identitäten aus vorhandener Konfiguration ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne genehmigungsspezifische Core-Logik hinzuzufügen.
- Wenn benutzerdefinierte Genehmigungs-Auth absichtlich nur Fallback im selben Chat erlaubt, geben Sie `markImplicitSameChatApprovalAuthorization({ authorized: true })` aus `openclaw/plugin-sdk/approval-auth-runtime` zurück; andernfalls behandelt Core das Ergebnis als explizite Genehmigerautorisierung.
- Wenn ein kanaleigener nativer Callback Genehmigungen direkt auflöst, verwenden Sie vor dem Auflösen `isImplicitSameChatApprovalAuthorization(...)`, damit impliziter Fallback weiterhin durch die normale Actor-Autorisierung des Kanals läuft.
- Wenn ein Kanal native Genehmigungszustellung benötigt, halten Sie den Kanalcode auf Zielnormalisierung sowie Transport- und Präsentationsfakten fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die kanalspezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit Core den Handler zusammensetzen und Request-Filterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise auf Routing an anderer Stelle besitzen kann. `nativeRuntime` ist in einige kleinere Schnittstellen aufgeteilt:
- Verwenden Sie `createNativeApprovalChannelRouteGates` aus `openclaw/plugin-sdk/approval-native-runtime`, wenn ein Kanal sowohl native Zustellung aus dem Sitzungsursprung als auch explizite Weiterleitungsziele für Genehmigungen unterstützt. Der Helper zentralisiert Genehmigungskonfigurationsauswahl, `mode`-Behandlung, Agent-/Sitzungsfilter, Kontobindung, Sitzungszielabgleich und Ziellistenabgleich, während Aufrufer weiterhin die Kanal-ID, den Standard-Weiterleitungsmodus, Kontosuche, Prüfung auf aktivierten Transport, Zielnormalisierung und Zielauflösung aus der Turn-Quelle besitzen. Verwenden Sie ihn nicht, um core-eigene Kanalrichtlinien-Standardwerte zu erstellen; übergeben Sie den dokumentierten Standardmodus des Kanals explizit.
- `createChannelNativeOriginTargetResolver` verwendet standardmäßig den gemeinsamen Kanalrouten-Matcher für `{ to, accountId, threadId }`-Ziele. Übergeben Sie `targetsMatch` nur, wenn ein Kanal Provider-spezifische Äquivalenzregeln hat, etwa Slack-Zeitstempelpräfix-Abgleich.
- Übergeben Sie `normalizeTargetForMatch` an `createChannelNativeOriginTargetResolver`, wenn der Kanal Provider-IDs kanonisieren muss, bevor der Standard-Routenmatcher oder ein benutzerdefinierter `targetsMatch`-Callback läuft, während das ursprüngliche Ziel für die Zustellung erhalten bleibt. Verwenden Sie `normalizeTarget` nur, wenn das aufgelöste Zustellziel selbst kanonisiert werden soll.
- `availability` - ob das Konto konfiguriert ist und ob eine Anfrage behandelt werden soll
- `presentation` - das gemeinsame Genehmigungs-View-Model auf ausstehende/aufgelöste/abgelaufene native Payloads oder finale Aktionen abbilden
- `transport` - Ziele vorbereiten sowie native Genehmigungsnachrichten senden/aktualisieren/löschen
- `interactions` - optionale Bind/Unbind/Clear-Action-Hooks für native Buttons oder Reaktionen sowie ein optionaler `cancelDelivered`-Hook. Implementieren Sie `cancelDelivered`, wenn `deliverPending` prozessinternen oder persistenten Zustand registriert (etwa einen Reaktionsziel-Speicher), damit dieser Zustand freigegeben werden kann, falls ein Handler-Stopp die Zustellung abbricht, bevor `bindPending` läuft, oder wenn `bindPending` kein Handle zurückgibt
- `observe` - optionale Hooks für Zustellungsdiagnose
- Wenn der Kanal runtime-eigene Objekte wie einen Client, ein Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie sie über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry lässt Core Capability-gesteuerte Handler aus dem Kanal-Startzustand bootstrappen, ohne genehmigungsspezifischen Wrapper-Klebstoff hinzuzufügen.
- Greifen Sie nur dann zu den niedrigeren Ebenen `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die Capability-gesteuerte Schnittstelle noch nicht ausdrucksstark genug ist.
- Native Genehmigungskanäle müssen sowohl `accountId` als auch `approvalKind` durch diese Helper routen. `accountId` hält Richtlinien für Genehmigungen mit mehreren Konten auf das richtige Bot-Konto begrenzt, und `approvalKind` hält exec- gegenüber Plugin-Genehmigungsverhalten für den Kanal verfügbar, ohne hartcodierte Branches in Core.
- Core besitzt jetzt auch Hinweise zur Genehmigungsumleitung. Kanal-Plugins sollten keine eigenen Folgemeldungen wie „Genehmigung ging an DMs / einen anderen Kanal“ aus `createChannelNativeApprovalRuntime` senden; stellen Sie stattdessen genaues Routing für Ursprung und Genehmiger-DM über die gemeinsamen Genehmigungs-Capability-Helper bereit und lassen Sie Core tatsächliche Zustellungen aggregieren, bevor ein Hinweis zurück in den auslösenden Chat gepostet wird.
- Bewahren Sie die Art der zugestellten Genehmigungs-ID Ende-zu-Ende. Native Clients sollten exec- gegenüber Plugin-Genehmigungsrouting nicht aus kanal-lokalem Zustand erraten oder umschreiben.
- Unterschiedliche Genehmigungsarten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für exec- als auch Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Kanalrouting und dieselbe Reaktions-UX für exec-
    und Plugin-Genehmigungen bei, während Auth sich weiterhin nach Genehmigungsart unterscheiden kann.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` im Plugin bereitstellen.

Für heiße Kanal-Einstiegspunkte bevorzugen Sie die schmaleren Runtime-Unterpfade, wenn Sie nur
einen Teil dieser Familie benötigen:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Ebenso bevorzugen Sie `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere Umbrella-
Oberfläche nicht benötigen.

Speziell für Setup:

- `openclaw/plugin-sdk/setup-runtime` deckt die runtime-sicheren Setup-Helper ab:
  `createSetupTranslator`, importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Lookup-Note-Ausgabe,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-runtime` enthält die env-bewusste Adapter-Schnittstelle für
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die optional-install Setup-
  Builder plus einige setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Kanal env-gesteuertes Setup oder env-gesteuerte Auth unterstützt und generische Start-/Konfigurations-
Flows diese env-Namen kennen sollen, bevor die Runtime lädt, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Kanal-Runtime-`envVars` oder lokale
Konstanten nur für operatorbezogene Texte bei.

Wenn Ihr Kanal in `status`, `channels list`, `channels status` oder
SecretRef-Scans erscheinen kann, bevor die Plugin-Runtime startet, fügen Sie `openclaw.setupEntry` in
`package.json` hinzu. Dieser Einstiegspunkt sollte in schreibgeschützten Befehls-
pfaden sicher importierbar sein und die Kanalmetadaten, den setup-sicheren Konfigurationsadapter, den Status-
adapter und die Kanal-Secret-Zielmetadaten zurückgeben, die für diese Zusammenfassungen benötigt werden. Starten Sie keine
Clients, Listener oder Transport-Runtimes aus dem Setup-Einstieg.

Halten Sie auch den Importpfad des Haupt-Kanaleinstiegs schmal. Discovery kann den
Entry und das Kanal-Plugin-Modul auswerten, um Capabilities zu registrieren, ohne den
Kanal zu aktivieren. Dateien wie `channel-plugin-api.ts` sollten das Kanal-
Plugin-Objekt exportieren, ohne Setup-Wizards, Transport-Clients, Socket-
Listener, Subprozess-Starter oder Service-Startmodule zu importieren. Legen Sie diese Runtime-
Teile in Module, die aus `registerFull(...)`, Runtime-Settern oder Lazy-
Capability-Adaptern geladen werden.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere `openclaw/plugin-sdk/setup`-Schnittstelle nur, wenn Sie auch die
  schwereren gemeinsamen Setup-/Konfigurations-Helper benötigen, etwa
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Kanal in Setup-Oberflächen nur „installieren Sie zuerst dieses Plugin“ bewerben möchte,
bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Wizard schlägt bei Konfigurationsschreibvorgängen und Finalisierung geschlossen fehl, und sie verwenden
dieselbe Meldung zur erforderlichen Installation für Validierung, Finalisierung und Docs-Link-
Text wieder.

Für andere heiße Kanalpfade bevorzugen Sie die schmalen Helper gegenüber breiteren Legacy-
Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Mehrkonto-Konfiguration und
  Fallback für Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/channel-inbound` für eingehende Route/Envelope und
  Record-and-Dispatch-Verdrahtung
- `openclaw/plugin-sdk/channel-targets` für Hilfsfunktionen zum Parsen von Zielen
- `openclaw/plugin-sdk/outbound-media` für das Laden von Medien und
  `openclaw/plugin-sdk/channel-outbound` für ausgehende Identitäts-/Sende-Delegates
  und Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route eine explizite
  `replyToId`/`threadId` erhalten oder die aktuelle `:thread:`-Sitzung
  wiederherstellen soll, nachdem der Basis-Sitzungsschlüssel weiterhin übereinstimmt. Provider-Plugins können
  Priorität, Suffix-Verhalten und Normalisierung der Thread-ID überschreiben, wenn ihre Plattform
  native Semantik für Thread-Zustellung hat.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von Thread-Bindings
  und Adapterregistrierung
- `openclaw/plugin-sdk/agent-media-payload` nur, wenn ein Legacy-Layout für Agent-/Medien-
  Payload-Felder weiterhin erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Normalisierung benutzerdefinierter Befehle,
  Prüfung auf Duplikate/Konflikte und einen fallback-stabilen Vertrag für Befehlskonfiguration

Kanäle, die nur Authentifizierung bereitstellen, können in der Regel beim Standardpfad bleiben: Core behandelt Genehmigungen, und das Plugin stellt nur ausgehende/Auth-Fähigkeiten bereit. Native Genehmigungskanäle wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Hilfsfunktionen verwenden, statt ihren eigenen Genehmigungslebenszyklus zu implementieren.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Verarbeitung eingehender Erwähnungen in zwei Schichten getrennt:

- plugin-eigene Evidenzerhebung
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur, wenn Sie den breiteren Barrel für eingehende
Hilfsfunktionen benötigen.

Gut geeignet für Plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung zitierter Bot-Nachrichten
- Prüfungen der Thread-Teilnahme
- Ausschlüsse von Dienst-/Systemnachrichten
- plattformnative Caches, die erforderlich sind, um Bot-Teilnahme nachzuweisen

Gut geeignet für die gemeinsame Hilfsfunktion:

- `requireMention`
- Ergebnis expliziter Erwähnung
- Allowlist für implizite Erwähnungen
- Befehls-Bypass
- endgültige Überspringen-Entscheidung

Bevorzugter Ablauf:

1. Berechnen Sie lokale Erwähnungsfakten.
2. Übergeben Sie diese Fakten an `resolveInboundMentionDecision({ facts, policy })`.
3. Verwenden Sie `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und `decision.shouldSkip` in Ihrem Eingangsgate.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Hilfsfunktionen für Erwähnungen für
gebündelte Kanal-Plugins bereit, die bereits von Runtime-Injektion abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht verwandter eingehender
Runtime-Hilfsfunktionen zu vermeiden.

Verwenden Sie `resolveInboundMentionDecision({ facts, policy })` für Erwähnungs-Gating.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json` ist
    das, was dies zu einem Kanal-Plugin macht. Die vollständige Oberfläche für Paketmetadaten
    finden Sie unter [Plugin-Einrichtung und -Konfiguration](/de/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` validiert `plugins.entries.acme-chat.config`. Verwenden Sie es für
    plugin-eigene Einstellungen, die nicht die Konto-Konfiguration des Kanals sind. `channelConfigs`
    validiert `channels.acme-chat` und ist die Cold-Path-Quelle, die von Konfigurationsschema,
    Einrichtung und UI-Oberflächen verwendet wird, bevor die Plugin-Runtime geladen wird.

  </Step>

  <Step title="Build the channel plugin object">
    Die Schnittstelle `ChannelPlugin` hat viele optionale Adapter-Oberflächen. Beginnen Sie mit
    dem Minimum - `id` und `setup` - und fügen Sie Adapter hinzu, wenn Sie sie benötigen.

    Erstellen Sie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    Für Kanäle, die sowohl kanonische DM-Schlüssel auf oberster Ebene als auch verschachtelte Legacy-Schlüssel akzeptieren, verwenden Sie die Hilfsfunktionen aus `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` und `normalizeChannelDmPolicy` behalten kontolokale Werte vor geerbten Root-Werten. Kombinieren Sie denselben Resolver mit Doctor-Reparatur durch `normalizeLegacyDmAliases`, damit Runtime und Migration denselben Vertrag lesen.

    <Accordion title="What createChatChannelPlugin does for you">
      Anstatt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Bereichsbezogener DM-Sicherheitsresolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Codeaustausch |
      | `threading` | Resolver für Antwortmodus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können auch rohe Adapterobjekte anstelle der deklarativen Optionen übergeben,
      wenn Sie vollständige Kontrolle benötigen.

      Rohe ausgehende Adapter können eine Funktion `chunker(text, limit, ctx)` definieren.
      Das optionale `ctx.formatting` enthält Formatierungsentscheidungen zur Zustellzeit
      wie `maxLinesPerMessage`; wenden Sie es vor dem Senden an, damit Antwort-Threading
      und Chunk-Grenzen einmalig durch die gemeinsame ausgehende Zustellung aufgelöst werden.
      Sende-Kontexte enthalten auch `replyToIdSource` (`implicit` oder `explicit`),
      wenn ein natives Antwortziel aufgelöst wurde, damit Payload-Hilfsfunktionen
      explizite Antwort-Tags erhalten können, ohne einen impliziten einmalig verwendbaren Antwort-Slot zu verbrauchen.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
    Erstellen Sie `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    Setzen Sie channel-eigene CLI-Deskriptoren in `registerCliMetadata(...)`, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Runtime zu aktivieren,
    während normale vollständige Ladevorgänge weiterhin dieselben Deskriptoren für die echte Befehlsregistrierung
    aufnehmen. Behalten Sie `registerFull(...)` für reine Runtime-Arbeit bei.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    Plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung des Registrierungsmodus automatisch. Siehe
    [Entry Points](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Setup-Einstieg hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt diesen Einstieg anstelle des vollständigen Einstiegs, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, dass während Setup-Flows schwergewichtiger Runtime-Code geladen wird.
    Siehe [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry) für Details.

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-Module
    auslagern, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen
    expliziten Runtime-Setter für die Setup-Zeit benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Inbound-Handler Ihres Channels dispatcht:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Die Verarbeitung eingehender Nachrichten ist channel-spezifisch. Jedes Channel-Plugin besitzt
      seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Channel-Plugins
      an (zum Beispiel das Plugin-Paket für Microsoft Teams oder Google Chat), um echte Muster zu finden.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie colocated Tests in `src/channel.test.ts`:

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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Für gemeinsame Test-Helfer siehe [Testing](/de/plugins/sdk-testing).

</Step>
</Steps>

## Dateistruktur

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Fortgeschrittene Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, account-bezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Nachrichtentools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Action-Ermittlung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime-Helfer" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
  <Card title="Channel-Inbound-API" icon="bolt" href="/de/plugins/sdk-channel-inbound">
    Gemeinsamer Inbound-Event-Lebenszyklus: aufnehmen, auflösen, aufzeichnen, dispatchen, finalisieren
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helfer-Seams existieren weiterhin für die Wartung gebündelter Plugins und
Kompatibilität. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen Channel-/Setup-/Reply-/Runtime-Unterpfade aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten diese gebündelte Plugin-Familie direkt.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Übersicht](/de/plugins/sdk-overview) - vollständige Importreferenz für Unterpfade
- [SDK-Testing](/de/plugins/sdk-testing) - Testwerkzeuge und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) - vollständiges Manifest-Schema

## Verwandt

- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
