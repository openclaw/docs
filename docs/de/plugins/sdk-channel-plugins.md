---
read_when:
    - Sie erstellen ein neues Messaging-Channel-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die ChannelPlugin-Adapteroberfläche verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Kanal-Plugins erstellen
x-i18n:
    generated_at: "2026-07-02T22:27:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Dieser Leitfaden führt Sie durch den Aufbau eines Channel-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende verfügen Sie über einen funktionierenden Channel mit DM-Sicherheit,
Pairing, Antwort-Threading und ausgehendem Messaging.

<Info>
  Wenn Sie noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Manifest-Einrichtung.
</Info>

## Funktionsweise von Channel-Plugins

Channel-Plugins benötigen keine eigenen Tools zum Senden, Bearbeiten oder Reagieren. OpenClaw hält ein
gemeinsames `message`-Tool im Core vor. Ihr Plugin ist zuständig für:

- **Konfiguration** - Kontoauflösung und Einrichtungsassistent
- **Sicherheit** - DM-Richtlinie und Allowlists
- **Pairing** - DM-Genehmigungsablauf
- **Sitzungsgrammatik** - wie providerspezifische Konversations-IDs Basischats, Thread-IDs und übergeordnete Fallbacks abbilden
- **Ausgehend** - Senden von Text, Medien und Umfragen an die Plattform
- **Threading** - wie Antworten in Threads eingeordnet werden
- **Heartbeat-Tippen** - optionale Tipp-/Beschäftigt-Signale für Heartbeat-Zustellziele

Der Core ist zuständig für das gemeinsame Message-Tool, Prompt-Verkabelung, die äußere Form des Sitzungsschlüssels,
generische `:thread:`-Buchhaltung und Dispatch.

Neue Channel-Plugins sollten außerdem einen `message`-Adapter mit
`defineChannelMessageAdapter` aus `openclaw/plugin-sdk/channel-outbound` bereitstellen. Der
Adapter deklariert, welche dauerhaften Final-Send-Fähigkeiten der native Transport
tatsächlich unterstützt, und leitet Text-/Medien-Sends an dieselben Transportfunktionen wie
der alte `outbound`-Adapter weiter. Deklarieren Sie eine Fähigkeit nur, wenn ein Contract-Test
den nativen Seiteneffekt und den zurückgegebenen Beleg nachweist.
Den vollständigen API-Vertrag, Beispiele, die Fähigkeitsmatrix, Belegregeln, Live-
Preview-Finalisierung, Receive-Ack-Richtlinie, Tests und Migrationstabelle finden Sie unter
[Channel outbound API](/de/plugins/sdk-channel-outbound).
Wenn der vorhandene `outbound`-Adapter bereits die richtigen Sendemethoden und
Fähigkeitsmetadaten hat, verwenden Sie `createChannelMessageAdapterFromOutbound(...)`, um
den `message`-Adapter abzuleiten, statt eine weitere Bridge von Hand zu schreiben.
Adapter-Sends sollten `MessageReceipt`-Werte zurückgeben. Wenn Kompatibilitätscode
weiterhin Legacy-IDs benötigt, leiten Sie sie mit `listMessageReceiptPlatformIds(...)`
oder `resolveMessageReceiptPrimaryId(...)` ab, statt parallele
`messageIds`-Felder in neuem Lifecycle-Code beizubehalten.
Preview-fähige Channels sollten außerdem `message.live.capabilities` mit
dem exakten Live-Lifecycle deklarieren, den sie besitzen, zum Beispiel `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` oder
`quietFinalization`. Channels, die eine Draft-Preview direkt finalisieren, sollten
außerdem `message.live.finalizer.capabilities` deklarieren, zum Beispiel `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` und
`retainOnAmbiguousFailure`, und die Runtime-Logik über
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)` führen. Stützen Sie diese Fähigkeiten
durch Tests mit `verifyChannelMessageLiveCapabilityAdapterProofs(...)` und
`verifyChannelMessageLiveFinalizerProofs(...)`, damit natives Preview-,
Fortschritts-, Bearbeitungs-, Fallback-/Aufbewahrungs-, Bereinigungs- und Belegverhalten
nicht unbemerkt abweichen kann.
Inbound-Empfänger, die Plattformbestätigungen verzögern, sollten
`message.receive.defaultAckPolicy` und `supportedAckPolicies` deklarieren, statt
Ack-Timing in monitorlokalem Zustand zu verbergen. Decken Sie jede deklarierte Richtlinie mit
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ab.

Legacy-Antworthelfer wie `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` und `recordInboundSessionAndDispatchReply`
bleiben für Kompatibilitäts-Dispatcher verfügbar. Verwenden Sie diese Namen nicht für neuen
Channel-Code; neue Plugins sollten mit dem `message`-Adapter, Belegen und
Receive-/Send-Lifecycle-Helfern unter `openclaw/plugin-sdk/channel-outbound` beginnen.

Channels, die Inbound-Autorisierung migrieren, können den experimentellen
Subpfad `openclaw/plugin-sdk/channel-ingress-runtime` aus Runtime-Receive-
Pfaden verwenden. Der Subpfad belässt Plattform-Lookup und Seiteneffekte im Plugin,
während Allowlist-Zustandsauflösung, Routen-/Sender-/Command-/Event-/Aktivierungs-
Entscheidungen, redigierte Diagnosen und Turn-Admission-Mapping geteilt werden. Belassen Sie die
Normalisierung der Plugin-Identität in dem Descriptor, den Sie an den Resolver übergeben; serialisieren Sie keine
rohen Match-Werte aus dem aufgelösten Zustand oder der Entscheidung. Siehe
[Channel ingress API](/de/plugins/sdk-channel-ingress) für API-Design,
Owner-Grenze und Testerwartungen.

Wenn Ihr Channel Tippindikatoren außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` im Channel-Plugin bereit. Der Core ruft es mit dem
aufgelösten Heartbeat-Zustellziel auf, bevor der Heartbeat-Modelllauf startet, und
verwendet den gemeinsamen Typing-Keepalive-/Cleanup-Lifecycle. Fügen Sie `heartbeat.clearTyping(...)`
hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

Wenn Ihr Channel Message-Tool-Parameter hinzufügt, die Medienquellen tragen, stellen Sie diese
Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit. Der Core verwendet
diese explizite Liste für Sandbox-Pfadnormalisierung und ausgehende Medienzugriffs-
Richtlinie, sodass Plugins keine Shared-Core-Sonderfälle für providerspezifische
Avatar-, Attachment- oder Cover-Image-Parameter benötigen.
Bevorzugen Sie die Rückgabe einer nach Aktionen geschlüsselten Map wie
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht zusammenhängende Aktionen nicht
die Medienargumente einer anderen Aktion erben. Ein flaches Array funktioniert weiterhin für Parameter, die
absichtlich über jede bereitgestellte Aktion hinweg geteilt werden.
Channels, die eine temporäre öffentliche URL für einen plattformseitigen Medienabruf
bereitstellen müssen, können `createHostedOutboundMediaStore(...)` aus
`openclaw/plugin-sdk/outbound-media` mit Plugin-Zustandsspeichern verwenden. Belassen Sie Plattform-
Routenparsing und Token-Durchsetzung im Channel-Plugin; der gemeinsame Helper
ist nur für Medienladen, Ablaufmetadaten, Chunk-Zeilen und Cleanup zuständig.

Wenn Ihr Channel providerspezifische Formung für `message(action="send")` benötigt,
bevorzugen Sie `actions.prepareSendPayload(...)`. Legen Sie native Cards, Blocks, Embeds oder
andere dauerhafte Daten unter `payload.channelData.<channel>` ab und lassen Sie den Core
den tatsächlichen Send über den Outbound-/Message-Adapter ausführen. Verwenden Sie
`actions.handleAction(...)` für Send nur als Kompatibilitäts-Fallback für
Payloads, die nicht serialisiert und erneut versucht werden können.

Wenn Ihre Plattform zusätzlichen Scope in Konversations-IDs speichert, belassen Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook zum Abbilden von `rawId` auf die Basiskonversations-ID, optionale Thread-
ID, explizite `baseConversationId` und alle `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie sie vom
engsten Parent bis zur breitesten/Basiskonversation sortiert.

Verwenden Sie `openclaw/plugin-sdk/channel-route`, wenn Plugin-Code routenartige
Felder normalisieren, einen untergeordneten Thread mit seiner Parent-Route vergleichen oder einen
stabilen Dedupe-Schlüssel aus `{ channel, to, accountId, threadId }` erstellen muss. Der Helper
normalisiert numerische Thread-IDs auf dieselbe Weise wie der Core, daher sollten Plugins ihn gegenüber
Ad-hoc-`String(threadId)`-Vergleichen bevorzugen.
Plugins mit providerspezifischer Zielgrammatik sollten
`messaging.resolveOutboundSessionRoute(...)` bereitstellen, damit der Core provider-native
Sitzungs- und Thread-Identität erhält, ohne Parser-Shims zu verwenden.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Channel-Registry startet,
können außerdem eine Top-Level-Datei `session-key-api.ts` mit einem passenden
`resolveSessionConversation(...)`-Export bereitstellen. Der Core verwendet diese bootstrap-sichere Oberfläche
nur, wenn die Runtime-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich
zur generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet der Core zuerst
`resolveSessionConversation(...).parentConversationCandidates` und fällt nur dann
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie auslässt.

## Genehmigungen und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen genehmigungsspezifischen Code.

- Core besitzt `/approve` im selben Chat, gemeinsame Payloads für Genehmigungsbuttons und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt auf dem Channel-Plugin, wenn der Channel genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung, nativem Verhalten, Rendering und Auth auf `approvalCapability` ab.
- `plugin.auth` ist nur für Login/Logout; Core liest Genehmigungs-Auth-Hooks nicht mehr aus diesem Objekt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Nahtstelle für Genehmigungs-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Auth-Verfügbarkeit von Genehmigungen im selben Chat. Halten Sie konfigurierte Genehmigende für `/approve` verfügbar, auch wenn native Zustellung deaktiviert ist; verwenden Sie stattdessen den Status der nativen initiierenden Oberfläche für Hinweise zu Zustellung/Einrichtung.
- Wenn Ihr Channel native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Status der initiierenden Oberfläche/des nativen Clients, wenn er sich von der Genehmigungs-Auth im selben Chat unterscheidet. Core verwendet diesen Exec-spezifischen Hook, um `enabled` von `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Channel native Exec-Genehmigungen unterstützt, und den Channel in Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` ergänzt dies für den üblichen Fall.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für Channel-spezifisches Payload-Lebenszyklusverhalten, etwa zum Ausblenden doppelter lokaler Genehmigungsaufforderungen oder zum Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder Fallback-Unterdrückung.
- Verwenden Sie `approvalCapability.nativeRuntime` für Channel-eigene native Genehmigungsfakten. Halten Sie dies auf heißen Channel-Einstiegspunkten mit `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy; der Adapter kann Ihr Runtime-Modul bei Bedarf importieren und Core trotzdem den Genehmigungslebenszyklus zusammensetzen lassen.
- Verwenden Sie `approvalCapability.render` nur, wenn ein Channel wirklich benutzerdefinierte Genehmigungs-Payloads statt des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Channel in der Antwort für den deaktivierten Pfad die genauen Konfigurationsschalter erklären soll, die zum Aktivieren nativer Exec-Genehmigungen nötig sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Channels mit benannten Accounts sollten accountbezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Top-Level-Defaults ausgeben.
- Verwenden Sie `approvalCapability.describePluginApprovalSetup`, wenn Hinweise bei Plugin-Genehmigungsfehlern für No-Route- und Timeout-Fehler sicher angezeigt werden können. `createApproverRestrictedNativeApprovalCapability(...)` leitet dies nicht aus `describeExecApprovalSetup` ab; übergeben Sie denselben Helper nur dann ausdrücklich, wenn Plugin- und Exec-Genehmigungen wirklich dieselbe native Einrichtung verwenden.
- Wenn ein Channel aus vorhandener Konfiguration stabile eigentümerähnliche DM-Identitäten ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat ohne genehmigungsspezifische Core-Logik einzuschränken.
- Wenn benutzerdefinierte Genehmigungs-Auth absichtlich nur Fallback im selben Chat zulässt, geben Sie `markImplicitSameChatApprovalAuthorization({ authorized: true })` aus `openclaw/plugin-sdk/approval-auth-runtime` zurück; andernfalls behandelt Core das Ergebnis als ausdrückliche Genehmigenden-Autorisierung.
- Wenn ein Channel-eigener nativer Callback Genehmigungen direkt auflöst, verwenden Sie `isImplicitSameChatApprovalAuthorization(...)` vor der Auflösung, damit impliziter Fallback weiterhin durch die normale Actor-Autorisierung des Channels läuft.
- Wenn ein Channel native Genehmigungszustellung benötigt, halten Sie den Channel-Code auf Zielnormalisierung sowie Transport-/Präsentationsfakten fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die Channel-spezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit Core den Handler zusammensetzen und Anfragefilterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise auf anderweitiges Routing besitzen kann. `nativeRuntime` ist in einige kleinere Nahtstellen aufgeteilt:
- Verwenden Sie `createNativeApprovalChannelRouteGates` aus `openclaw/plugin-sdk/approval-native-runtime`, wenn ein Channel sowohl native Zustellung vom Session-Ursprung als auch explizite Weiterleitungsziele für Genehmigungen unterstützt. Der Helper zentralisiert Auswahl der Genehmigungskonfiguration, `mode`-Behandlung, Agent-/Session-Filter, Account-Bindung, Session-Zielabgleich und Ziellistenabgleich, während Aufrufer weiterhin Channel-ID, Standard-Weiterleitungsmodus, Account-Lookup, Transport-Aktivierungsprüfung, Zielnormalisierung und Zielauflösung der Turn-Quelle besitzen. Verwenden Sie ihn nicht, um Core-eigene Channel-Policy-Defaults zu erstellen; übergeben Sie den dokumentierten Standardmodus des Channels ausdrücklich.
- `createChannelNativeOriginTargetResolver` verwendet standardmäßig den gemeinsamen Channel-Route-Matcher für `{ to, accountId, threadId }`-Ziele. Übergeben Sie `targetsMatch` nur, wenn ein Channel Provider-spezifische Äquivalenzregeln hat, etwa Slack-Zeitstempel-Präfixabgleich.
- Übergeben Sie `normalizeTargetForMatch` an `createChannelNativeOriginTargetResolver`, wenn der Channel Provider-IDs kanonisieren muss, bevor der Standard-Route-Matcher oder ein benutzerdefinierter `targetsMatch`-Callback läuft, während das ursprüngliche Ziel für die Zustellung erhalten bleibt. Verwenden Sie `normalizeTarget` nur, wenn das aufgelöste Zustellziel selbst kanonisiert werden soll.
- `availability` - ob der Account konfiguriert ist und ob eine Anfrage verarbeitet werden soll
- `presentation` - das gemeinsame Genehmigungs-View-Model auf ausstehende/aufgelöste/abgelaufene native Payloads oder finale Aktionen abbilden
- `transport` - Ziele vorbereiten und native Genehmigungsnachrichten senden/aktualisieren/löschen
- `interactions` - optionale Hooks zum Binden/Aufheben/Löschen von Aktionen für native Buttons oder Reaktionen, plus ein optionaler `cancelDelivered`-Hook. Implementieren Sie `cancelDelivered`, wenn `deliverPending` prozessinternen oder persistenten Zustand registriert (etwa einen Reaktionsziel-Store), damit dieser Zustand freigegeben werden kann, falls ein Handler-Stop die Zustellung abbricht, bevor `bindPending` läuft, oder wenn `bindPending` kein Handle zurückgibt
- `observe` - optionale Hooks für Zustellungsdiagnosen
- Wenn der Channel Runtime-eigene Objekte wie Client, Token, Bolt-App oder Webhook-Empfänger benötigt, registrieren Sie sie über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Kontext-Registry lässt Core capability-gesteuerte Handler aus dem Channel-Startzustand bootstrappen, ohne genehmigungsspezifischen Wrapper-Klebstoff hinzuzufügen.
- Greifen Sie nur dann zu den niedrigeren Ebenen `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die capability-gesteuerte Nahtstelle noch nicht ausdrucksstark genug ist.
- Native Genehmigungs-Channels müssen sowohl `accountId` als auch `approvalKind` durch diese Helper routen. `accountId` hält Multi-Account-Genehmigungsrichtlinien auf das richtige Bot-Konto beschränkt, und `approvalKind` hält Exec- gegenüber Plugin-Genehmigungsverhalten für den Channel verfügbar, ohne hartcodierte Branches in Core.
- Core besitzt jetzt auch Hinweise zur Genehmigungsumleitung. Channel-Plugins sollten keine eigenen Folgemeldungen wie „Genehmigung ging an DMs / einen anderen Channel“ aus `createChannelNativeApprovalRuntime` senden; stattdessen sollen sie korrektes Routing für Ursprung + Genehmigenden-DM über die gemeinsamen Genehmigungs-Capability-Helper bereitstellen und Core die tatsächlichen Zustellungen aggregieren lassen, bevor ein Hinweis zurück in den initiierenden Chat gepostet wird.
- Bewahren Sie die Art der zugestellten Genehmigungs-ID Ende-zu-Ende. Native Clients sollten Exec- gegenüber Plugin-Genehmigungsrouting nicht aus Channel-lokalem Zustand erraten oder umschreiben.
- Unterschiedliche Genehmigungsarten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für Exec- als auch Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Channel-Routing und dieselbe Reaktions-UX für Exec-
    und Plugin-Genehmigungen bei, während Auth weiterhin je nach Genehmigungsart abweichen kann.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` auf dem Plugin bereitstellen.

Für heiße Channel-Einstiegspunkte bevorzugen Sie die schmaleren Runtime-Unterpfade, wenn Sie nur
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

Speziell für die Einrichtung:

- `openclaw/plugin-sdk/setup-runtime` deckt die runtime-sicheren Setup-Helper ab:
  `createSetupTranslator`, importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Lookup-Note-Ausgabe,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-runtime` enthält die env-bewusste Adapter-Nahtstelle für
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die Setup-
  Builder für optionale Installation plus einige setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Channel env-gesteuerte Einrichtung oder Auth unterstützt und generische Startup-/Konfigurations-
Flows diese Env-Namen kennen sollen, bevor die Runtime lädt, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Channel-Runtime-`envVars` oder lokale
Konstanten nur für operatorseitige Texte.

Wenn Ihr Channel in `status`, `channels list`, `channels status` oder
SecretRef-Scans erscheinen kann, bevor die Plugin-Runtime startet, fügen Sie `openclaw.setupEntry` in
`package.json` hinzu. Dieser Einstiegspunkt sollte in schreibgeschützten Befehls-
pfaden sicher importierbar sein und die Channel-Metadaten, den setup-sicheren Konfigurationsadapter, den Status-
Adapter und die Channel-Secret-Zielmetadaten zurückgeben, die für diese Zusammenfassungen nötig sind. Starten Sie
keine Clients, Listener oder Transport-Runtimes aus dem Setup-Einstieg.

Halten Sie auch den Importpfad des Haupt-Channel-Einstiegs schmal. Discovery kann den
Entry und das Channel-Plugin-Modul auswerten, um Capabilities zu registrieren, ohne den
Channel zu aktivieren. Dateien wie `channel-plugin-api.ts` sollten das Channel-
Plugin-Objekt exportieren, ohne Setup-Assistenten, Transport-Clients, Socket-
Listener, Subprozess-Starter oder Service-Startup-Module zu importieren. Legen Sie diese Runtime-
Teile in Module, die aus `registerFull(...)`, Runtime-Settern oder lazy
Capability-Adaptern geladen werden.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere `openclaw/plugin-sdk/setup`-Nahtstelle nur, wenn Sie auch die
  schwereren gemeinsamen Setup-/Konfigurations-Helper benötigen, etwa
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Channel in Setup-Oberflächen nur „installieren Sie zuerst dieses Plugin“ anzeigen soll,
bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung geschlossen fehl und verwendet
dieselbe Installations-erforderlich-Meldung über Validierung, Finalisierung und Docs-Link-
Text hinweg wieder.

Für andere heiße Channel-Pfade bevorzugen Sie die schmalen Helper gegenüber breiteren Legacy-
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
  `openclaw/plugin-sdk/channel-outbound` für ausgehende Identität/Sende-Delegates
  und Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route eine
  explizite `replyToId`/`threadId` beibehalten oder die aktuelle `:thread:`-Sitzung
  wiederherstellen soll, nachdem der Basis-Sitzungsschlüssel weiterhin übereinstimmt. Provider-Plugins können
  Priorität, Suffix-Verhalten und Thread-ID-Normalisierung überschreiben, wenn ihre Plattform
  native Thread-Zustellungssemantik hat.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von Thread-Bindings
  und Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur, wenn ein Legacy-Feldlayout für Agent/Medien-
  Payload weiterhin erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für die Normalisierung benutzerdefinierter Telegram-Befehle,
  Duplikat-/Konfliktvalidierung und einen fallback-stabilen Befehls-
  Konfigurationsvertrag

Auth-only-Kanäle können normalerweise beim Standardpfad bleiben: Core übernimmt Genehmigungen, und das Plugin stellt nur Outbound-/Auth-Fähigkeiten bereit. Native Genehmigungskanäle wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Hilfsfunktionen verwenden, statt ihren eigenen Genehmigungslebenszyklus zu implementieren.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Verarbeitung eingehender Erwähnungen in zwei Schichten getrennt:

- Plugin-eigene Beweiserfassung
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur, wenn Sie den breiteren Barrel für eingehende
Hilfsfunktionen benötigen.

Gut geeignet für Plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung von zitierten Bots
- Prüfungen der Thread-Teilnahme
- Ausschlüsse von Service-/Systemnachrichten
- plattformnative Caches, die erforderlich sind, um Bot-Teilnahme nachzuweisen

Gut geeignet für die gemeinsame Hilfsfunktion:

- `requireMention`
- explizites Erwähnungsergebnis
- Allowlist für implizite Erwähnungen
- Befehls-Bypass
- endgültige Überspringen-Entscheidung

Bevorzugter Ablauf:

1. Berechnen Sie lokale Erwähnungsfakten.
2. Übergeben Sie diese Fakten an `resolveInboundMentionDecision({ facts, policy })`.
3. Verwenden Sie `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und `decision.shouldSkip` in Ihrem eingehenden Gate.

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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungs-Hilfsfunktionen für
gebündelte Kanal-Plugins bereit, die bereits von Runtime-Injection abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht zusammenhängender eingehender
Runtime-Hilfsfunktionen zu vermeiden.

Verwenden Sie `resolveInboundMentionDecision({ facts, policy })` für Mention-Gating.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json` ist
    der Auslöser dafür, dass dies ein Kanal-Plugin ist. Die vollständige Oberfläche für Paketmetadaten
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
    Plugin-eigene Einstellungen, die nicht zur Kontokonfiguration des Kanals gehören. `channelConfigs`
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

    Für Kanäle, die sowohl kanonische DM-Schlüssel auf oberster Ebene als auch verschachtelte Legacy-Schlüssel akzeptieren, verwenden Sie die Hilfsfunktionen aus `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` und `normalizeChannelDmPolicy` halten konto-lokale Werte vor geerbten Root-Werten. Kombinieren Sie denselben Resolver mit Doctor-Reparatur über `normalizeLegacyDmAliases`, damit Runtime und Migration denselben Vertrag lesen.

    <Accordion title="What createChatChannelPlugin does for you">
      Statt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Bereichsbezogener DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Code-Austausch |
      | `threading` | Resolver für den Antwortmodus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können statt der deklarativen Optionen auch rohe Adapterobjekte übergeben,
      wenn Sie vollständige Kontrolle benötigen.

      Rohe ausgehende Adapter können eine Funktion `chunker(text, limit, ctx)` definieren.
      Das optionale `ctx.formatting` trägt Formatierungsentscheidungen zur Zustellungszeit
      wie `maxLinesPerMessage`; wenden Sie sie vor dem Senden an, damit Antwort-Threading
      und Chunk-Grenzen einmal durch die gemeinsame ausgehende Zustellung aufgelöst werden.
      Sendekontexte enthalten außerdem `replyToIdSource` (`implicit` oder `explicit`),
      wenn ein natives Antwortziel aufgelöst wurde, sodass Payload-Hilfsfunktionen
      explizite Antwort-Tags beibehalten können, ohne einen impliziten einmalig nutzbaren Antwort-Slot zu verbrauchen.
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

    Put channel-owned CLI descriptors in `registerCliMetadata(...)`, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Runtime zu aktivieren,
    während normale vollständige Ladevorgänge weiterhin dieselben Deskriptoren für die echte Befehlsregistrierung
    übernehmen. Behalten Sie `registerFull(...)` für reine Runtime-Arbeit bei.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    Plugin-spezifisches Präfix. Core-Admin-Namensräume (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` handhabt die Aufteilung des Registrierungsmodus automatisch. Siehe
    [Einstiegspunkte](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Add a setup entry">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies anstelle des vollständigen Einstiegspunkts, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, dass während Setup-Abläufen schwergewichtiger Runtime-Code geladen wird.
    Weitere Details finden Sie unter [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry).

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-
    Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen
    expliziten Runtime-Setter zur Setup-Zeit benötigen.

  </Step>

  <Step title="Handle inbound messages">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Inbound-Handler Ihres Channels weiterleitet:

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
      Die Verarbeitung eingehender Nachrichten ist Channel-spezifisch. Jedes Channel-Plugin besitzt
      seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Channel-Plugins
      (zum Beispiel das Plugin-Paket für Microsoft Teams oder Google Chat) für echte Muster an.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
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

    Gemeinsame Test-Helper finden Sie unter [Testen](/de/plugins/sdk-testing).

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
  <Card title="Threading options" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Action-Erkennung
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/de/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/de/plugins/sdk-channel-inbound">
    Gemeinsamer Lebenszyklus für eingehende Events: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Seams existieren weiterhin für die Wartung gebündelter Plugins und
Kompatibilität. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen Channel-/Setup-/Reply-/Runtime-Unterpfade aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten diese gebündelte Plugin-Familie direkt.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Überblick](/de/plugins/sdk-overview) - vollständige Referenz für Subpath-Importe
- [SDK-Tests](/de/plugins/sdk-testing) - Test-Dienstprogramme und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) - vollständiges Manifest-Schema

## Verwandt

- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
