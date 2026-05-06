---
read_when:
    - Sie erstellen ein neues Plugin für einen Messaging-Kanal
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Schnittstelle von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Channel-Plugins für OpenClaw
title: Kanal-Plugins erstellen
x-i18n:
    generated_at: "2026-05-06T06:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Dieser Leitfaden führt durch das Erstellen eines Kanal-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Kanal mit Direktnachrichten-Sicherheit,
Pairing, Antwort-Threading und ausgehendem Messaging.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins), um die grundlegende Paketstruktur
  und Manifest-Einrichtung kennenzulernen.
</Info>

## Funktionsweise von Kanal-Plugins

Kanal-Plugins benötigen keine eigenen Werkzeuge zum Senden, Bearbeiten oder Reagieren. OpenClaw behält ein
gemeinsames `message`-Werkzeug im Kern. Ihr Plugin ist zuständig für:

- **Konfiguration** - Kontoauflösung und Einrichtungsassistent
- **Sicherheit** - Direktnachrichten-Richtlinie und Allowlists
- **Pairing** - Genehmigungsablauf per Direktnachricht
- **Sitzungsgrammatik** - wie Provider-spezifische Konversations-IDs Basis-Chats, Thread-IDs und übergeordnete Fallbacks zugeordnet werden
- **Ausgehend** - Senden von Text, Medien und Umfragen an die Plattform
- **Threading** - wie Antworten in Threads eingeordnet werden
- **Heartbeat-Tippen** - optionale Tipp-/Beschäftigt-Signale für Heartbeat-Zustellziele

Der Kern besitzt das gemeinsame Nachrichtenwerkzeug, Prompt-Verkabelung, die äußere Session-Key-Form,
generische `:thread:`-Buchführung und Dispatch.

Neue Kanal-Plugins sollten außerdem einen `message`-Adapter mit
`defineChannelMessageAdapter` aus `openclaw/plugin-sdk/channel-message` bereitstellen. Der
Adapter deklariert, welche dauerhaften Final-Send-Fähigkeiten der native Transport
tatsächlich unterstützt, und verweist Text-/Medien-Sends auf dieselben Transportfunktionen wie
der ältere `outbound`-Adapter. Deklarieren Sie eine Fähigkeit nur, wenn ein Vertragstest
den nativen Seiteneffekt und den zurückgegebenen Empfangsnachweis belegt.
Den vollständigen API-Vertrag, Beispiele, die Fähigkeitsmatrix, Empfangsnachweis-Regeln, die Finalisierung von Live-
Vorschauen, die Empfangsbestätigungsrichtlinie, Tests und die Migrationstabelle finden Sie unter
[Channel message API](/de/plugins/sdk-channel-message).
Wenn der vorhandene `outbound`-Adapter bereits die richtigen Sendemethoden und
Fähigkeitsmetadaten besitzt, verwenden Sie `createChannelMessageAdapterFromOutbound(...)`, um
den `message`-Adapter abzuleiten, statt eine weitere Brücke von Hand zu schreiben.
Adapter-Sends sollten `MessageReceipt`-Werte zurückgeben. Wenn Kompatibilitätscode
weiterhin ältere IDs benötigt, leiten Sie diese mit `listMessageReceiptPlatformIds(...)`
oder `resolveMessageReceiptPrimaryId(...)` ab, statt parallele
`messageIds`-Felder in neuem Lifecycle-Code zu behalten.
Vorschaufähige Kanäle sollten außerdem `message.live.capabilities` mit
dem exakten Live-Lifecycle deklarieren, den sie besitzen, z. B. `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` oder
`quietFinalization`. Kanäle, die eine Entwurfsvorschau direkt finalisieren, sollten
außerdem `message.live.finalizer.capabilities` deklarieren, z. B. `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` und
`retainOnAmbiguousFailure`, und die Laufzeitlogik über
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)` führen. Halten Sie diese Fähigkeiten durch
Tests mit `verifyChannelMessageLiveCapabilityAdapterProofs(...)` und
`verifyChannelMessageLiveFinalizerProofs(...)` abgesichert, damit natives Vorschau-,
Fortschritts-, Bearbeitungs-, Fallback-/Aufbewahrungs-, Aufräum- und Empfangsnachweisverhalten nicht
unbemerkt abweichen kann.
Eingehende Empfänger, die Plattformbestätigungen verzögern, sollten
`message.receive.defaultAckPolicy` und `supportedAckPolicies` deklarieren, statt den
Bestätigungszeitpunkt in monitorlokalem Zustand zu verstecken. Decken Sie jede deklarierte Richtlinie mit
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` ab.

Ältere Antwort-/Turn-Helfer wie `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` und `recordInboundSessionAndDispatchReply`
bleiben für Kompatibilitäts-Dispatcher verfügbar. Verwenden Sie diese Namen nicht für neuen
Kanalcode; neue Plugins sollten mit dem `message`-Adapter, Empfangsnachweisen und
Empfangs-/Sende-Lifecycle-Helfern in `openclaw/plugin-sdk/channel-message` beginnen.

Wenn Ihr Kanal Tippindikatoren außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` im Kanal-Plugin bereit. Der Kern ruft es mit dem
aufgelösten Heartbeat-Zustellziel auf, bevor der Heartbeat-Modelllauf startet, und
verwendet den gemeinsamen Lifecycle für Tipp-Keepalive und Aufräumen. Fügen Sie `heartbeat.clearTyping(...)`
hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

Wenn Ihr Kanal Nachrichtenwerkzeug-Parameter hinzufügt, die Medienquellen tragen, stellen Sie diese
Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit. Der Kern verwendet
diese explizite Liste für Sandbox-Pfadnormalisierung und ausgehende Medienzugriffsrichtlinien,
sodass Plugins keine Sonderfälle im gemeinsamen Kern für Provider-spezifische
Avatar-, Anhangs- oder Coverbild-Parameter benötigen.
Geben Sie bevorzugt eine aktionsschlüsselbasierte Map zurück, z. B.
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit unabhängige Aktionen nicht
die Medienargumente einer anderen Aktion erben. Ein flaches Array funktioniert weiterhin für Parameter, die
absichtlich über jede bereitgestellte Aktion hinweg geteilt werden.

Wenn Ihr Kanal Provider-spezifische Formung für `message(action="send")` benötigt,
verwenden Sie bevorzugt `actions.prepareSendPayload(...)`. Legen Sie native Karten, Blöcke, Einbettungen oder
andere dauerhafte Daten unter `payload.channelData.<channel>` ab und lassen Sie den Kern
den tatsächlichen Versand über den Outbound-/Message-Adapter ausführen. Verwenden Sie
`actions.handleAction(...)` für Send nur als Kompatibilitäts-Fallback für
Payloads, die nicht serialisiert und erneut versucht werden können.

Wenn Ihre Plattform zusätzlichen Scope in Konversations-IDs speichert, behalten Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook zum Zuordnen von `rawId` zur Basis-Konversations-ID, optionalen Thread-
ID, expliziten `baseConversationId` und etwaigen `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie sie vom
engsten übergeordneten Element bis zur breitesten/Basis-Konversation sortiert.

Verwenden Sie `openclaw/plugin-sdk/channel-route`, wenn Plugin-Code routenähnliche
Felder normalisieren, einen untergeordneten Thread mit seiner übergeordneten Route vergleichen oder einen
stabilen Deduplizierungsschlüssel aus `{ channel, to, accountId, threadId }` erstellen muss. Der Helfer
normalisiert numerische Thread-IDs auf dieselbe Weise wie der Kern, daher sollten Plugins ihn
Ad-hoc-Vergleichen mit `String(threadId)` vorziehen.
Plugins mit Provider-spezifischer Zielgrammatik können ihren Parser in
`resolveChannelRouteTargetWithParser(...)` injizieren und erhalten dennoch dieselbe Routenziel-
Form und dieselbe Thread-Fallback-Semantik, die der Kern verwendet.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Kanalregistrierung startet,
können außerdem eine `session-key-api.ts`-Datei auf oberster Ebene mit einem passenden
`resolveSessionConversation(...)`-Export bereitstellen. Der Kern verwendet diese bootstrapsichere Oberfläche
nur, wenn die Laufzeit-Plugin-Registrierung noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
älterer Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur übergeordnete Fallbacks zusätzlich
zur generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet der Kern zuerst
`resolveSessionConversation(...).parentConversationCandidates` und fällt nur
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie auslässt.

## Genehmigungen und Kanalfähigkeiten

Die meisten Kanal-Plugins benötigen keinen genehmigungsspezifischen Code.

- Core ist für same-chat `/approve`, geteilte Genehmigungsbutton-Payloads und generische Fallback-Zustellung zuständig.
- Verwenden Sie bevorzugt ein einzelnes `approvalCapability`-Objekt im Kanal-Plugin, wenn der Kanal genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung, nativer Darstellung, Rendering und Authentifizierung in `approvalCapability` ab.
- `plugin.auth` ist nur für Login/Logout vorgesehen; Core liest Genehmigungs-Auth-Hooks nicht mehr aus diesem Objekt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Genehmigungs-Auth-Schnittstelle.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit der Genehmigungs-Auth im selben Chat.
- Wenn Ihr Kanal native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Zustand der auslösenden Oberfläche bzw. des nativen Clients, wenn er sich von der Genehmigungs-Auth im selben Chat unterscheidet. Core nutzt diesen Exec-spezifischen Hook, um `enabled` und `disabled` zu unterscheiden, zu entscheiden, ob der auslösende Kanal native Exec-Genehmigungen unterstützt, und den Kanal in Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den üblichen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für kanalspezifisches Payload-Lebenszyklusverhalten, etwa zum Ausblenden doppelter lokaler Genehmigungsaufforderungen oder zum Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder Fallback-Unterdrückung.
- Verwenden Sie `approvalCapability.nativeRuntime` für kanalverwaltete native Genehmigungsfakten. Halten Sie es auf heißen Kanal-Einstiegspunkten mit `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy; damit kann Ihr Laufzeitmodul bei Bedarf importiert werden, während Core weiterhin den Genehmigungslebenszyklus zusammensetzen kann.
- Verwenden Sie `approvalCapability.render` nur, wenn ein Kanal wirklich benutzerdefinierte Genehmigungs-Payloads statt des geteilten Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Kanal in der Antwort für den deaktivierten Pfad die exakten Konfigurationsschalter erklären soll, die zum Aktivieren nativer Exec-Genehmigungen erforderlich sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Kanäle mit benannten Konten sollten kontospezifische Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt oberster Defaults rendern.
- Wenn ein Kanal aus bestehender Konfiguration stabile eigentümerähnliche DM-Identitäten ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um same-chat `/approve` einzuschränken, ohne genehmigungsspezifische Core-Logik hinzuzufügen.
- Wenn ein Kanal native Genehmigungszustellung benötigt, halten Sie den Kanalcode auf Zielnormalisierung sowie Transport- und Präsentationsfakten fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die kanalspezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit Core den Handler zusammensetzen und Request-Filterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise auf anderweitiges Routing verwalten kann. `nativeRuntime` ist in einige kleinere Schnittstellen aufgeteilt:
- `createChannelNativeOriginTargetResolver` verwendet standardmäßig den geteilten Kanalrouten-Matcher für `{ to, accountId, threadId }`-Ziele. Übergeben Sie `targetsMatch` nur, wenn ein Kanal providerspezifische Äquivalenzregeln hat, etwa Slack-Timestamp-Präfixabgleich.
- Übergeben Sie `normalizeTargetForMatch` an `createChannelNativeOriginTargetResolver`, wenn der Kanal Provider-IDs vor dem Standardrouten-Matcher oder einem benutzerdefinierten `targetsMatch`-Callback kanonisieren muss, während das ursprüngliche Ziel für die Zustellung erhalten bleibt. Verwenden Sie `normalizeTarget` nur, wenn das aufgelöste Zustellziel selbst kanonisiert werden soll.
- `availability` - ob das Konto konfiguriert ist und ob ein Request verarbeitet werden soll
- `presentation` - das geteilte Genehmigungs-View-Model auf ausstehende/aufgelöste/abgelaufene native Payloads oder finale Aktionen abbilden
- `transport` - Ziele vorbereiten und native Genehmigungsnachrichten senden/aktualisieren/löschen
- `interactions` - optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Buttons oder Reaktionen
- `observe` - optionale Hooks für Zustellungsdiagnose
- Wenn der Kanal laufzeitverwaltete Objekte wie einen Client, ein Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie sie über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry ermöglicht Core, capability-getriebene Handler aus dem Kanal-Startzustand zu bootstrappen, ohne genehmigungsspezifischen Wrapper-Code hinzuzufügen.
- Greifen Sie nur dann zu den Low-Level-Helfern `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die capability-getriebene Schnittstelle noch nicht ausdrucksstark genug ist.
- Native Genehmigungskanäle müssen sowohl `accountId` als auch `approvalKind` durch diese Helfer routen. `accountId` hält Multi-Account-Genehmigungsrichtlinien auf das richtige Bot-Konto begrenzt, und `approvalKind` hält Exec- und Plugin-Genehmigungsverhalten für den Kanal verfügbar, ohne hartcodierte Branches in Core.
- Core verwaltet jetzt auch Hinweise zur Genehmigungsumleitung. Kanal-Plugins sollten keine eigenen Folgenachrichten wie „Genehmigung ging an DMs / einen anderen Kanal“ aus `createChannelNativeApprovalRuntime` senden; stattdessen sollen sie genaues Origin- und Genehmiger-DM-Routing über die geteilten Genehmigungs-Capability-Helfer bereitstellen und Core die tatsächlichen Zustellungen aggregieren lassen, bevor ein Hinweis zurück in den auslösenden Chat gepostet wird.
- Bewahren Sie die Art der zugestellten Genehmigungs-ID durchgängig. Native Clients sollten
  Exec- und Plugin-Genehmigungsrouting nicht aus kanal-lokalem Zustand erraten oder umschreiben.
- Unterschiedliche Genehmigungsarten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Kanal-Routing und dieselbe Reaktions-UX für Exec-
    und Plugin-Genehmigungen bei, während Authentifizierung weiterhin je nach Genehmigungsart abweichen kann.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, neuer Code sollte jedoch den Capability-Builder bevorzugen und `approvalCapability` im Plugin bereitstellen.

Für heiße Kanal-Einstiegspunkte bevorzugen Sie die engeren Laufzeit-Unterpfade, wenn Sie nur
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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere Sammeloberfläche
nicht benötigen.

Speziell für Setup:

- `openclaw/plugin-sdk/setup-runtime` umfasst die laufzeitsicheren Setup-Helfer:
  importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Lookup-Notiz-Ausgabe,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die enge, env-bewusste Adapter-
  Schnittstelle für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` umfasst die Optional-Install-Setup-
  Builder plus einige setup-sichere Primitive:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Kanal env-gesteuertes Setup oder Authentifizierung unterstützt und generische Start-/Konfigurations-
Flows diese env-Namen vor dem Laden der Runtime kennen sollen, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Kanal-Runtime-`envVars` oder lokale
Konstanten nur für operatorgerichtete Texte.

Wenn Ihr Kanal in `status`, `channels list`, `channels status` oder
SecretRef-Scans erscheinen kann, bevor die Plugin-Runtime startet, fügen Sie `openclaw.setupEntry` in
`package.json` hinzu. Dieser Einstiegspunkt sollte in schreibgeschützten Befehls-
pfaden importsicher sein und die Kanalmetadaten, den setup-sicheren Konfigurationsadapter, den Status-
Adapter und die Secret-Target-Metadaten des Kanals zurückgeben, die für diese Zusammenfassungen benötigt werden. Starten Sie
keine Clients, Listener oder Transport-Runtimes aus dem Setup-Eintrag.

Halten Sie auch den Importpfad des Haupteinstiegs des Kanals eng. Discovery kann den
Eintrag und das Kanal-Plugin-Modul auswerten, um Capabilities zu registrieren, ohne den
Kanal zu aktivieren. Dateien wie `channel-plugin-api.ts` sollten das Kanal-
Plugin-Objekt exportieren, ohne Setup-Assistenten, Transport-Clients, Socket-
Listener, Subprozess-Starter oder Dienststartmodule zu importieren. Legen Sie diese Runtime-
Teile in Module, die aus `registerFull(...)`, Runtime-Settern oder lazy
Capability-Adaptern geladen werden.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere `openclaw/plugin-sdk/setup`-Schnittstelle nur, wenn Sie auch die
  umfangreicheren geteilten Setup-/Konfigurationshelfer wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen

Wenn Ihr Kanal in Setup-Oberflächen nur „installieren Sie dieses Plugin zuerst“ anzeigen soll,
bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung geschlossen fehl und verwendet
dieselbe installationspflichtige Nachricht über Validierung, Finalisierung und Docs-Link-
Text hinweg wieder.

Für andere heiße Kanalpfade bevorzugen Sie die engen Helfer gegenüber breiteren Legacy-
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
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus ausgehende
  Identitäts-/Sende-Delegates und Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route eine
  explizite `replyToId`/`threadId` erhalten oder die aktuelle `:thread:`-Session
  wiederherstellen soll, nachdem der Basis-Session-Schlüssel weiterhin übereinstimmt. Provider-Plugins können
  Priorität, Suffix-Verhalten und Thread-ID-Normalisierung überschreiben, wenn ihre Plattform
  native Thread-Zustellsemantik hat.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von Thread-Bindings
  und Adapterregistrierung
- `openclaw/plugin-sdk/agent-media-payload` nur, wenn ein Legacy-Agent-/Media-
  Payload-Feldlayout weiterhin erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für die Normalisierung benutzerdefinierter Telegram-Befehle,
  Duplikat-/Konfliktvalidierung und einen fallback-stabilen Befehls-
  Konfigurationsvertrag

Kanäle nur mit Authentifizierung können meist beim Standardpfad bleiben: Core verarbeitet Genehmigungen, und das Plugin stellt nur Outbound-/Auth-Capabilities bereit. Native Genehmigungskanäle wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die geteilten nativen Helfer verwenden, statt ihren eigenen Genehmigungslebenszyklus zu bauen.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Behandlung eingehender Erwähnungen in zwei Ebenen getrennt:

- Plugin-eigene Evidenzerfassung
- geteilte Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur, wenn Sie das breitere Barrel für eingehende
Helfer benötigen.

Gut geeignet für Plugin-lokale Logik:

- Reply-to-Bot-Erkennung
- Quoted-Bot-Erkennung
- Thread-Teilnahmeprüfungen
- Ausschlüsse von Dienst-/Systemnachrichten
- plattformnative Caches, die zum Nachweis der Bot-Teilnahme erforderlich sind

Gut geeignet für den geteilten Helfer:

- `requireMention`
- Ergebnis der expliziten Erwähnung
- Allowlist für implizite Erwähnungen
- Befehls-Bypass
- endgültige Überspringentscheidung

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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungs-Hilfsfunktionen für
gebündelte Channel-Plugins bereit, die bereits von Runtime-Injektion abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht verwandter Inbound-
Runtime-Hilfsfunktionen zu vermeiden.

Die älteren `resolveMentionGating*`-Hilfsfunktionen bleiben auf
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitätsexporte erhalten. Neuer Code
sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json` ist
    der Grund, warum dies ein Channel-Plugin ist. Den vollständigen Bereich der Paketmetadaten
    finden Sie unter [Plugin-Setup und Konfiguration](/de/plugins/sdk-setup#openclaw-channel):

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
    Plugin-eigene Einstellungen, die nicht zur Channel-Kontokonfiguration gehören. `channelConfigs`
    validiert `channels.acme-chat` und ist die Cold-Path-Quelle, die von Konfigurationsschema,
    Setup und UI-Oberflächen verwendet wird, bevor die Plugin-Runtime lädt.

  </Step>

  <Step title="Channel-Plugin-Objekt erstellen">
    Die Schnittstelle `ChannelPlugin` hat viele optionale Adapter-Oberflächen. Beginnen Sie mit
    dem Minimum - `id` und `setup` - und fügen Sie Adapter hinzu, sobald Sie sie benötigen.

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

    Für Channels, die sowohl kanonische DM-Schlüssel auf oberster Ebene als auch ältere verschachtelte Schlüssel akzeptieren, verwenden Sie die Hilfsfunktionen aus `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` und `normalizeChannelDmPolicy` halten kontolokale Werte vor geerbten Root-Werten. Kombinieren Sie denselben Resolver über `normalizeLegacyDmAliases` mit der Doctor-Reparatur, damit Runtime und Migration denselben Kontrakt lesen.

    <Accordion title="Was createChatChannelPlugin für Sie erledigt">
      Statt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was sie einbindet |
      | --- | --- |
      | `security.dm` | Bereichsgebundener DM-Sicherheitsresolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Codeaustausch |
      | `threading` | Resolver für den Antwortmodus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten (Nachrichten-IDs) zurückgeben |

      Sie können auch direkte Adapterobjekte statt der deklarativen Optionen übergeben,
      wenn Sie volle Kontrolle benötigen.

      Direkte Outbound-Adapter können eine Funktion `chunker(text, limit, ctx)` definieren.
      Das optionale `ctx.formatting` enthält Formatierungsentscheidungen zum Auslieferungszeitpunkt
      wie `maxLinesPerMessage`; wenden Sie es vor dem Senden an, damit Antwort-Threading
      und Chunk-Grenzen einmalig durch die gemeinsame Outbound-Auslieferung aufgelöst werden.
      Sendekontexte enthalten außerdem `replyToIdSource` (`implicit` oder `explicit`),
      wenn ein natives Antwortziel aufgelöst wurde, damit Payload-Hilfsfunktionen
      explizite Antwort-Tags beibehalten können, ohne einen impliziten, einmalig verwendbaren Antwortslot zu verbrauchen.
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

    Legen Sie Channel-eigene CLI-Deskriptoren in `registerCliMetadata(...)` ab, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Runtime zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Befehlsregistrierung übernehmen.
    Behalten Sie `registerFull(...)` für reine Runtime-Arbeiten bei.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    Plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` verarbeitet die Aufteilung nach Registrierungsmodus automatisch. Siehe
    [Einstiegspunkte](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Setup-Einstiegspunkt hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt diesen statt des vollständigen Einstiegspunkts, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. Dadurch wird verhindert, dass in Setup-Abläufen schwerer Runtime-Code geladen wird.
    Siehe [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry) für Details.

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-
    Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen
    expliziten Runtime-Setter für die Setup-Zeit benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an OpenClaw
    weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
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
      Die Verarbeitung eingehender Nachrichten ist kanalspezifisch. Jedes Channel-Plugin besitzt
      seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Channel-Plugins
      (zum Beispiel das Microsoft Teams- oder Google Chat-Plugin-Paket) für reale Muster an.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie kolokierte Tests in `src/channel.test.ts`:

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

    Gemeinsame Test-Helfer finden Sie unter [Testing](/de/plugins/sdk-testing).

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
  <Card title="Nachrichten-Tool-Integration" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Aktionserkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Helfer" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
  <Card title="Channel-Turn-Kernel" icon="bolt" href="/de/plugins/sdk-channel-turn">
    Gemeinsamer Lebenszyklus eingehender Turns: erfassen, auflösen, aufzeichnen, dispatchen, abschließen
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Seams existieren weiterhin für die Wartung gebündelter Plugins und
für Kompatibilität. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen channel/setup/reply/runtime-Unterpfade aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten diese gebündelte Plugin-Familie direkt.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Übersicht](/de/plugins/sdk-overview) - vollständige Importreferenz für Unterpfade
- [SDK-Testing](/de/plugins/sdk-testing) - Test-Hilfsprogramme und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) - vollständiges Manifest-Schema

## Verwandt

- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
