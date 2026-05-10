---
read_when:
    - Sie erstellen ein neues Nachrichtenkanal-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die ChannelPlugin-Adapter-Schnittstelle verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Kanal-Plugins erstellen
x-i18n:
    generated_at: "2026-05-10T19:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Dieser Leitfaden führt Sie durch den Aufbau eines Kanal-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Kanal mit DM-Sicherheit,
Pairing, Antwort-Threading und ausgehendem Messaging.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Einrichtung des Manifests.
</Info>

## So funktionieren Kanal-Plugins

Kanal-Plugins benötigen keine eigenen Tools zum Senden/Bearbeiten/Reagieren. OpenClaw hält ein
gemeinsames `message`-Tool im Kern bereit. Ihr Plugin ist verantwortlich für:

- **Konfiguration** - Kontoauflösung und Einrichtungsassistent
- **Sicherheit** - DM-Richtlinie und Allowlists
- **Pairing** - DM-Freigabeablauf
- **Sitzungsgrammatik** - wie providerspezifische Konversations-IDs auf Basischats, Thread-IDs und übergeordnete Fallbacks abgebildet werden
- **Ausgehend** - Senden von Text, Medien und Umfragen an die Plattform
- **Threading** - wie Antworten in Threads eingeordnet werden
- **Heartbeat-Tippen** - optionale Tipp-/Beschäftigt-Signale für Heartbeat-Zustellziele

Der Kern ist verantwortlich für das gemeinsame Message-Tool, Prompt-Verkabelung, die äußere Form des Sitzungsschlüssels,
generische `:thread:`-Buchführung und Dispatch.

Neue Kanal-Plugins sollten außerdem einen `message`-Adapter mit
`defineChannelMessageAdapter` aus `openclaw/plugin-sdk/channel-message` bereitstellen. Der
Adapter deklariert, welche dauerhaften Final-Send-Fähigkeiten der native Transport
tatsächlich unterstützt, und verweist Text-/Mediensendungen auf dieselben Transportfunktionen wie
der alte `outbound`-Adapter. Deklarieren Sie eine Fähigkeit nur, wenn ein Contract-Test
den nativen Seiteneffekt und die zurückgegebene Quittung nachweist.
Den vollständigen API-Vertrag, Beispiele, Fähigkeitsmatrix, Quittungsregeln, Live-
Preview-Finalisierung, Receive-Ack-Richtlinie, Tests und Migrationstabelle finden Sie unter
[Kanal-Message-API](/de/plugins/sdk-channel-message).
Wenn der vorhandene `outbound`-Adapter bereits die passenden Sendemethoden und
Fähigkeitsmetadaten besitzt, verwenden Sie `createChannelMessageAdapterFromOutbound(...)`, um
den `message`-Adapter abzuleiten, statt eine weitere Bridge von Hand zu schreiben.
Adapter-Sendungen sollten `MessageReceipt`-Werte zurückgeben. Wenn Kompatibilitätscode
weiterhin Legacy-IDs benötigt, leiten Sie diese mit `listMessageReceiptPlatformIds(...)`
oder `resolveMessageReceiptPrimaryId(...)` ab, statt parallele
`messageIds`-Felder in neuem Lifecycle-Code zu halten.
Preview-fähige Kanäle sollten außerdem `message.live.capabilities` mit
dem exakten Live-Lifecycle deklarieren, den sie besitzen, etwa `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` oder
`quietFinalization`. Kanäle, die eine Entwurfs-Preview direkt finalisieren, sollten
außerdem `message.live.finalizer.capabilities` deklarieren, etwa `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` und
`retainOnAmbiguousFailure`, und die Laufzeitlogik über
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)` führen. Hinterlegen Sie diese Fähigkeiten
mit Tests über `verifyChannelMessageLiveCapabilityAdapterProofs(...)` und
`verifyChannelMessageLiveFinalizerProofs(...)`, damit natives Preview-,
Fortschritts-, Bearbeitungs-, Fallback-/Aufbewahrungs-, Bereinigungs- und Quittungsverhalten
nicht unbemerkt abweichen kann.
Eingehende Receiver, die Plattformbestätigungen verzögern, sollten
`message.receive.defaultAckPolicy` und `supportedAckPolicies` deklarieren, statt
Ack-Timing in monitorlokalem Zustand zu verbergen. Decken Sie jede deklarierte Richtlinie mit
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ab.

Legacy-Helfer für Antworten/Turns wie `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` und `recordInboundSessionAndDispatchReply`
bleiben für Kompatibilitäts-Dispatcher verfügbar. Verwenden Sie diese Namen nicht für neuen
Kanalcode; neue Plugins sollten mit dem `message`-Adapter, Quittungen und
Receive-/Send-Lifecycle-Helfern unter `openclaw/plugin-sdk/channel-message` beginnen.

Kanäle, die eingehende Autorisierung migrieren, können den experimentellen
Subpfad `openclaw/plugin-sdk/channel-ingress-runtime` aus Laufzeit-Receive-Pfaden verwenden.
Der Subpfad hält Plattform-Lookups und Seiteneffekte im Plugin, während
Allowlist-Zustandsauflösung, Route-/Sender-/Befehls-/Ereignis-/Aktivierungsentscheidungen,
redigierte Diagnosen und Turn-Zulassungsabbildung gemeinsam genutzt werden. Behalten Sie die
Normalisierung der Plugin-Identität im Deskriptor, den Sie an den Resolver übergeben; serialisieren Sie keine
rohen Match-Werte aus dem aufgelösten Zustand oder der Entscheidung. Siehe
[Kanal-Ingress-API](/de/plugins/sdk-channel-ingress) für API-Design,
Eigentumsgrenze und Testerwartungen.

Wenn Ihr Kanal Tippindikatoren außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` im Kanal-Plugin bereit. Der Kern ruft es mit dem
aufgelösten Heartbeat-Zustellziel auf, bevor der Heartbeat-Modelllauf beginnt, und
verwendet den gemeinsamen Lifecycle für Tipp-Keepalive und Bereinigung. Fügen Sie `heartbeat.clearTyping(...)`
hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

Wenn Ihr Kanal Message-Tool-Parameter hinzufügt, die Medienquellen tragen, machen Sie diese
Parameternamen über `describeMessageTool(...).mediaSourceParams` verfügbar. Der Kern verwendet
diese explizite Liste für Sandbox-Pfadnormalisierung und Richtlinien für Medienzugriff beim ausgehenden Versand,
sodass Plugins keine Shared-Core-Sonderfälle für providerspezifische
Avatar-, Anhangs- oder Coverbild-Parameter benötigen.
Bevorzugen Sie die Rückgabe einer nach Aktionen indizierten Map wie
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht zusammenhängende Aktionen nicht
die Medienargumente einer anderen Aktion erben. Ein flaches Array funktioniert weiterhin für Parameter, die
absichtlich über jede offengelegte Aktion hinweg geteilt werden.

Wenn Ihr Kanal providerspezifische Formung für `message(action="send")` benötigt,
bevorzugen Sie `actions.prepareSendPayload(...)`. Legen Sie native Karten, Blöcke, Embeds oder
andere dauerhafte Daten unter `payload.channelData.<channel>` ab und lassen Sie den Kern
den eigentlichen Versand über den Outbound-/Message-Adapter ausführen. Verwenden Sie
`actions.handleAction(...)` für Sendungen nur als Kompatibilitäts-Fallback für
Payloads, die nicht serialisiert und erneut versucht werden können.

Wenn Ihre Plattform zusätzlichen Scope in Konversations-IDs speichert, belassen Sie dieses Parsen
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook zum Abbilden von `rawId` auf die Basis-Konversations-ID, eine optionale Thread-
ID, explizite `baseConversationId` und beliebige `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie diese von der
engsten übergeordneten Konversation bis zur breitesten/Basis-Konversation sortiert.

Verwenden Sie `openclaw/plugin-sdk/channel-route`, wenn Plugin-Code routenähnliche Felder
normalisieren, einen Child-Thread mit seiner Parent-Route vergleichen oder einen
stabilen Dedupe-Schlüssel aus `{ channel, to, accountId, threadId }` erstellen muss. Der Helfer
normalisiert numerische Thread-IDs auf dieselbe Weise wie der Kern, daher sollten Plugins ihn
Ad-hoc-Vergleichen mit `String(threadId)` vorziehen.
Plugins mit providerspezifischer Zielgrammatik können ihren Parser in
`resolveChannelRouteTargetWithParser(...)` injizieren und erhalten dennoch dieselbe Route-Target-
Form und Thread-Fallback-Semantik, die der Kern verwendet.

Gebündelte Plugins, die dasselbe Parsen benötigen, bevor die Kanal-Registry startet,
können außerdem eine Top-Level-Datei `session-key-api.ts` mit einem passenden
`resolveSessionConversation(...)`-Export bereitstellen. Der Kern verwendet diese bootstrap-sichere Oberfläche
nur, wenn die Laufzeit-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur übergeordnete Fallbacks auf Basis
der generischen/rohen ID benötigt. Wenn beide Hooks vorhanden sind, verwendet der Kern zuerst
`resolveSessionConversation(...).parentConversationCandidates` und fällt nur dann auf
`resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook sie
weglässt.

## Freigaben und Kanalfähigkeiten

Die meisten Kanal-Plugins benötigen keinen freigabespezifischen Code.

- Core besitzt `/approve` im selben Chat, gemeinsam genutzte Payloads für Genehmigungsbuttons und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt im Channel-Plugin, wenn der Channel genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung, nativer Darstellung, Rendering und Auth auf `approvalCapability` ab.
- `plugin.auth` ist nur für Login/Logout vorgesehen; Core liest aus diesem Objekt keine Auth-Hooks für Genehmigungen mehr.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Schnittstelle für Genehmigungs-Autorisierung.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit der Genehmigungs-Autorisierung im selben Chat.
- Wenn Ihr Channel native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Status der auslösenden Oberfläche bzw. des nativen Clients, wenn dieser von der Genehmigungs-Autorisierung im selben Chat abweicht. Core verwendet diesen exec-spezifischen Hook, um `enabled` von `disabled` zu unterscheiden, zu entscheiden, ob der auslösende Channel native Exec-Genehmigungen unterstützt, und den Channel in Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den üblichen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für Channel-spezifisches Payload-Lebenszyklusverhalten, etwa das Ausblenden doppelter lokaler Genehmigungsaufforderungen oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder Fallback-Unterdrückung.
- Verwenden Sie `approvalCapability.nativeRuntime` für native Genehmigungsfakten, die dem Channel gehören. Halten Sie dies auf häufig genutzten Channel-Einstiegspunkten mit `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy; dieser kann Ihr Runtime-Modul bei Bedarf importieren und Core trotzdem den Genehmigungslebenszyklus zusammensetzen lassen.
- Verwenden Sie `approvalCapability.render` nur, wenn ein Channel wirklich eigene Genehmigungs-Payloads statt des gemeinsam genutzten Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Channel in der Antwort für den deaktivierten Pfad die exakten Konfigurationsregler erklären soll, die zum Aktivieren nativer Exec-Genehmigungen benötigt werden. Der Hook erhält `{ channel, channelLabel, accountId }`; Channels mit benannten Accounts sollten account-bezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Top-Level-Defaults rendern.
- Wenn ein Channel stabile, owner-ähnliche DM-Identitäten aus vorhandener Konfiguration ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne genehmigungsspezifische Core-Logik hinzuzufügen.
- Wenn ein Channel native Genehmigungszustellung benötigt, halten Sie den Channel-Code auf Zielnormalisierung sowie Transport- und Präsentationsfakten fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die Channel-spezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit Core den Handler zusammensetzen und Request-Filterung, Routing, Deduplizierung, Ablauf, Gateway-Subscription und Hinweise auf Weiterleitung an anderer Stelle besitzen kann. `nativeRuntime` ist in einige kleinere Schnittstellen aufgeteilt:
- `createChannelNativeOriginTargetResolver` verwendet standardmäßig den gemeinsam genutzten Channel-Routen-Matcher für `{ to, accountId, threadId }`-Ziele. Übergeben Sie `targetsMatch` nur, wenn ein Channel Provider-spezifische Äquivalenzregeln hat, etwa Slack-Timestamp-Präfixabgleich.
- Übergeben Sie `normalizeTargetForMatch` an `createChannelNativeOriginTargetResolver`, wenn der Channel Provider-IDs kanonisieren muss, bevor der Standard-Routen-Matcher oder ein benutzerdefinierter `targetsMatch`-Callback ausgeführt wird, während das ursprüngliche Ziel für die Zustellung erhalten bleibt. Verwenden Sie `normalizeTarget` nur, wenn das aufgelöste Zustellziel selbst kanonisiert werden soll.
- `availability` - ob der Account konfiguriert ist und ob eine Anfrage verarbeitet werden soll
- `presentation` - das gemeinsam genutzte Genehmigungs-View-Model auf ausstehende/aufgelöste/abgelaufene native Payloads oder finale Aktionen abbilden
- `transport` - Ziele vorbereiten sowie native Genehmigungsnachrichten senden/aktualisieren/löschen
- `interactions` - optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Buttons oder Reaktionen
- `observe` - optionale Hooks für Zustellungsdiagnosen
- Wenn der Channel Runtime-eigene Objekte wie einen Client, ein Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie diese über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry lässt Core Capability-getriebene Handler aus dem Channel-Startzustand bootstrappen, ohne genehmigungsspezifische Wrapper-Verklebung hinzuzufügen.
- Greifen Sie nur dann zu den Low-Level-Funktionen `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die Capability-getriebene Schnittstelle noch nicht ausdrucksstark genug ist.
- Native Genehmigungs-Channels müssen sowohl `accountId` als auch `approvalKind` durch diese Helfer routen. `accountId` hält Multi-Account-Genehmigungsrichtlinien auf den richtigen Bot-Account beschränkt, und `approvalKind` hält Exec- und Plugin-Genehmigungsverhalten für den Channel verfügbar, ohne fest codierte Branches in Core.
- Core besitzt jetzt auch Hinweise zur Genehmigungsumleitung. Channel-Plugins sollten keine eigenen Folgenachrichten wie „Genehmigung ging an DMs / einen anderen Channel“ aus `createChannelNativeApprovalRuntime` senden; stellen Sie stattdessen korrektes Origin- und Approver-DM-Routing über die gemeinsam genutzten Genehmigungs-Capability-Helfer bereit und lassen Sie Core tatsächliche Zustellungen aggregieren, bevor ein Hinweis zurück in den auslösenden Chat gepostet wird.
- Erhalten Sie die Art der zugestellten Genehmigungs-ID durchgehend. Native Clients sollten Routing für Exec- gegenüber Plugin-Genehmigungen nicht aus Channel-lokalem Zustand erraten oder umschreiben.
- Unterschiedliche Genehmigungsarten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting für Exec- und Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Channel-Routing und dieselbe Reaktions-UX für Exec-
    und Plugin-Genehmigungen bei, während Auth weiterhin je nach Genehmigungsart abweichen kann.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, neuer Code sollte jedoch den Capability-Builder bevorzugen und `approvalCapability` am Plugin bereitstellen.

Für häufig genutzte Channel-Einstiegspunkte bevorzugen Sie die engeren Runtime-Unterpfade, wenn Sie nur
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

- `openclaw/plugin-sdk/setup-runtime` deckt die Runtime-sicheren Setup-Helfer ab:
  importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Lookup-Note-Ausgabe,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-runtime` enthält die env-bewusste Adapter-Schnittstelle für
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die Setup-Builder für optionale Installation
  sowie einige Setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Channel env-gesteuertes Setup oder Auth unterstützt und generische Start-/Konfigurations-
Flows diese Env-Namen kennen sollen, bevor die Runtime geladen wird, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Channel-Runtime-`envVars` oder lokale
Konstanten nur für operatorbezogene Texte.

Wenn Ihr Channel in `status`, `channels list`, `channels status` oder
SecretRef-Scans erscheinen kann, bevor die Plugin-Runtime startet, fügen Sie `openclaw.setupEntry` in
`package.json` hinzu. Dieser Einstiegspunkt sollte in schreibgeschützten Befehlspfaden sicher importierbar sein
und die Channel-Metadaten, den Setup-sicheren Konfigurationsadapter, den Status-
Adapter und die Channel-Secret-Zielmetadaten zurückgeben, die für diese Zusammenfassungen benötigt werden. Starten Sie keine
Clients, Listener oder Transport-Runtimes aus dem Setup-Eintrag.

Halten Sie auch den Importpfad des Haupt-Channel-Eintrags eng. Discovery kann den
Eintrag und das Channel-Plugin-Modul auswerten, um Capabilities zu registrieren, ohne den
Channel zu aktivieren. Dateien wie `channel-plugin-api.ts` sollten das Channel-
Plugin-Objekt exportieren, ohne Setup-Assistenten, Transport-Clients, Socket-
Listener, Subprozess-Launcher oder Dienststartmodule zu importieren. Legen Sie diese Runtime-
Teile in Module, die aus `registerFull(...)`, Runtime-Settern oder lazy
Capability-Adaptern geladen werden.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere Schnittstelle `openclaw/plugin-sdk/setup` nur, wenn Sie auch die
  schwereren gemeinsam genutzten Setup-/Konfigurationshelfer benötigen, etwa
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Channel in Setup-Oberflächen nur „installieren Sie zuerst dieses Plugin“ bewerben soll,
bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung geschlossen fehl und verwendet
dieselbe Nachricht über erforderliche Installation in Validierung, Finalisierung und Docs-Link-
Text wieder.

Für andere häufig genutzte Channel-Pfade bevorzugen Sie die engen Helfer gegenüber breiteren Legacy-
Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Default-Account-Fallback
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehende Route/Envelope und
  Record-and-Dispatch-Verdrahtung
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Matching
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen sowie ausgehende
  Identitäts-/Sende-Delegates und Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route eine explizite
  `replyToId`/`threadId` beibehalten oder die aktuelle `:thread:`-Session
  wiederherstellen soll, nachdem der Basis-Session-Key weiterhin übereinstimmt. Provider-Plugins können
  Vorrang, Suffix-Verhalten und Thread-ID-Normalisierung überschreiben, wenn ihre Plattform
  native Thread-Zustellsemantik hat.
- `openclaw/plugin-sdk/thread-bindings-runtime` für Thread-Binding-Lebenszyklus
  und Adapterregistrierung
- `openclaw/plugin-sdk/agent-media-payload` nur, wenn ein Legacy-Agent/Media-
  Payload-Feldlayout weiterhin erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Custom-Command-
  Normalisierung, Duplikat-/Konfliktvalidierung und einen fallback-stabilen Command-
  Konfigurationsvertrag

Auth-only-Channels können in der Regel beim Standardpfad bleiben: Core verarbeitet Genehmigungen, und das Plugin stellt nur Outbound-/Auth-Capabilities bereit. Native Genehmigungs-Channels wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transports sollten die gemeinsam genutzten nativen Helfer verwenden, statt einen eigenen Genehmigungslebenszyklus zu implementieren.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Verarbeitung eingehender Erwähnungen in zwei Ebenen getrennt:

- Plugin-eigene Sammlung von Nachweisen
- gemeinsam genutzte Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zu Erwähnungsrichtlinien.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur, wenn Sie das breitere Barrel für eingehende
Helfer benötigen.

Gut geeignet für Plugin-lokale Logik:

- Antwort-an-Bot-Erkennung
- Zitierter-Bot-Erkennung
- Thread-Teilnahmeprüfungen
- Ausschlüsse für Dienst-/Systemnachrichten
- plattformnative Caches, die benötigt werden, um Bot-Teilnahme nachzuweisen

Gut geeignet für den gemeinsam genutzten Helfer:

- `requireMention`
- explizites Erwähnungsergebnis
- implizite Erwähnungs-Allowlist
- Befehlsumgehung
- endgültige Entscheidung zum Überspringen

Bevorzugter Ablauf:

1. Berechnen Sie lokale Erwähnungsfakten.
2. Übergeben Sie diese Fakten an `resolveInboundMentionDecision({ facts, policy })`.
3. Verwenden Sie `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und `decision.shouldSkip` in Ihrem Inbound-Gate.

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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungs-Helfer für
gebündelte Channel-Plugins bereit, die bereits von Runtime-Injection abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht benötigter Inbound-
Runtime-Helfer zu vermeiden.

Die älteren `resolveMentionGating*`-Helfer bleiben auf
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitätsexporte erhalten. Neuer Code
sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Exemplarische Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json` ist
    das, was dies zu einem Channel-Plugin macht. Die vollständige Oberfläche für
    Paketmetadaten finden Sie unter [Plugin-Einrichtung und -Konfiguration](/de/plugins/sdk-setup#openclaw-channel):

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
    Plugin-eigene Einstellungen, die nicht die Channel-Kontokonfiguration sind. `channelConfigs`
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

    Für Channels, die sowohl kanonische DM-Schlüssel auf oberster Ebene als auch ältere verschachtelte Schlüssel akzeptieren, verwenden Sie die Helfer aus `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` und `normalizeChannelDmPolicy` halten kontolokale Werte vor geerbten Root-Werten. Kombinieren Sie denselben Resolver mit Doctor-Reparatur über `normalizeLegacyDmAliases`, damit Runtime und Migration denselben Vertrag lesen.

    <Accordion title="What createChatChannelPlugin does for you">
      Statt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was sie verdrahtet |
      | --- | --- |
      | `security.dm` | Scoped DM-Sicherheitsresolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Codeaustausch |
      | `threading` | Reply-to-Modus-Resolver (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnismetadaten zurückgeben (Nachrichten-IDs) |

      Sie können auch rohe Adapterobjekte statt der deklarativen Optionen übergeben,
      wenn Sie vollständige Kontrolle benötigen.

      Rohe Outbound-Adapter können eine Funktion `chunker(text, limit, ctx)` definieren.
      Das optionale `ctx.formatting` enthält Entscheidungen zur Formatierung zum Auslieferungszeitpunkt
      wie `maxLinesPerMessage`; wenden Sie sie vor dem Senden an, damit Reply-Threading
      und Chunk-Grenzen einmalig durch die gemeinsame Outbound-Auslieferung aufgelöst werden.
      Sendekontexte enthalten außerdem `replyToIdSource` (`implicit` oder `explicit`),
      wenn ein natives Antwortziel aufgelöst wurde, sodass Payload-Helfer explizite
      Antwort-Tags beibehalten können, ohne einen impliziten Einmal-Antwortslot zu verbrauchen.
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

    Platzieren Sie Channel-eigene CLI-Deskriptoren in `registerCliMetadata(...)`, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Runtime zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Befehlsregistrierung
    übernehmen. Verwenden Sie `registerFull(...)` für reine Runtime-Arbeit.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    Plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` behandelt die Aufteilung der Registrierungsmodi automatisch. Siehe
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

    OpenClaw lädt dies statt des vollständigen Einstiegspunkts, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, während Einrichtungsabläufen
    umfangreichen Runtime-Code einzubinden.
    Siehe [Einrichtung und Konfiguration](/de/plugins/sdk-setup#setup-entry) für Details.

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-
    Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie zusätzlich einen
    expliziten Runtime-Setter zur Setup-Zeit benötigen.

  </Step>

  <Step title="Handle inbound messages">
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
      Die Verarbeitung eingehender Nachrichten ist kanalspezifisch. Jedes Kanal-Plugin besitzt
      seine eigene Eingangspipeline. Sehen Sie sich gebündelte Kanal-Plugins
      (zum Beispiel das Plugin-Paket für Microsoft Teams oder Google Chat) für echte Muster an.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie kolokalisierte Tests in `src/channel.test.ts`:

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

    Gemeinsame Test-Hilfsfunktionen finden Sie unter [Testen](/de/plugins/sdk-testing).

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
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Message-Tool-Integration" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Aktionserkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
  <Card title="Channel-Turn-Kernel" icon="bolt" href="/de/plugins/sdk-channel-turn">
    Gemeinsamer Lebenszyklus für eingehende Turns: erfassen, auflösen, aufzeichnen, dispatchen, abschließen
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Schnittstellen existieren weiterhin für die Wartung und
Kompatibilität gebündelter Plugins. Sie sind nicht das empfohlene Muster für neue Kanal-Plugins;
verwenden Sie bevorzugt die generischen channel/setup/reply/runtime-Unterpfade aus der gemeinsamen SDK-
Oberfläche, sofern Sie diese gebündelte Plugin-Familie nicht direkt warten.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Übersicht](/de/plugins/sdk-overview) - vollständige Referenz für Subpath-Importe
- [SDK-Testen](/de/plugins/sdk-testing) - Testwerkzeuge und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) - vollständiges Manifest-Schema

## Verwandt

- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
