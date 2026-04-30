---
read_when:
    - Sie erstellen ein neues Plugin für einen Messaging-Kanal
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Schnittstelle von ChannelPlugin verstehen.
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Channel-Plugins erstellen
x-i18n:
    generated_at: "2026-04-30T07:06:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Dieser Leitfaden beschreibt, wie Sie ein Kanal-Plugin erstellen, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Kanal mit DM-Sicherheit,
Pairing, Antwort-Threading und ausgehenden Nachrichten.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins), um die grundlegende Paketstruktur
  und die Manifest-Einrichtung kennenzulernen.
</Info>

## So funktionieren Kanal-Plugins

Kanal-Plugins benötigen keine eigenen Tools zum Senden, Bearbeiten oder Reagieren. OpenClaw verwaltet ein
gemeinsames `message`-Tool im Kern. Ihr Plugin ist zuständig für:

- **Konfiguration** — Kontoauflösung und Einrichtungsassistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Pairing** — DM-Freigabefluss
- **Sitzungsgrammatik** — wie provider-spezifische Konversations-IDs auf Basis-Chats, Thread-IDs und übergeordnete Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden
- **Heartbeat-Typing** — optionale Tipp-/Beschäftigt-Signale für Heartbeat-Zustellziele

Der Kern ist zuständig für das gemeinsame Nachrichtentool, die Prompt-Verdrahtung, die äußere Sitzungs-Schlüsselform,
generische `:thread:`-Buchführung und Dispatch.

Wenn Ihr Kanal Tippindikatoren außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` im Kanal-Plugin bereit. Der Kern ruft es mit dem
aufgelösten Heartbeat-Zustellziel auf, bevor der Heartbeat-Modelllauf startet, und
verwendet den gemeinsamen Lebenszyklus für Typing-Keepalive und -Bereinigung. Fügen Sie `heartbeat.clearTyping(...)`
hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

Wenn Ihr Kanal Parameter für das Nachrichtentool ergänzt, die Medienquellen enthalten, stellen Sie diese
Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit. Der Kern verwendet
diese explizite Liste für die Normalisierung von Sandbox-Pfaden und die Richtlinie für ausgehenden Medienzugriff,
sodass Plugins keine gemeinsamen Kern-Sonderfälle für provider-spezifische
Avatar-, Anhangs- oder Titelbildparameter benötigen.
Bevorzugen Sie eine nach Aktionen geschlüsselte Map wie
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit unabhängige Aktionen nicht
die Medienargumente einer anderen Aktion übernehmen. Ein flaches Array funktioniert weiterhin für Parameter, die
absichtlich über alle bereitgestellten Aktionen hinweg geteilt werden.

Wenn Ihre Plattform zusätzlichen Scope in Konversations-IDs speichert, belassen Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook, um `rawId` auf die Basis-Konversations-ID, eine optionale Thread-ID,
eine explizite `baseConversationId` und etwaige `parentConversationCandidates` abzubilden.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie sie vom
engsten Parent bis zur breitesten/Basis-Konversation sortiert.

Verwenden Sie `openclaw/plugin-sdk/channel-route`, wenn Plugin-Code routenartige
Felder normalisieren, einen untergeordneten Thread mit seiner Parent-Route vergleichen oder einen
stabilen Deduplizierungsschlüssel aus `{ channel, to, accountId, threadId }` erstellen muss. Der Helper
normalisiert numerische Thread-IDs genauso wie der Kern, daher sollten Plugins ihn
Ad-hoc-Vergleichen mit `String(threadId)` vorziehen.
Plugins mit provider-spezifischer Zielgrammatik können ihren Parser in
`resolveChannelRouteTargetWithParser(...)` injizieren und trotzdem dieselbe Routenziel-Form
und Thread-Fallback-Semantik erhalten, die der Kern verwendet.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Kanal-Registry startet,
können außerdem eine `session-key-api.ts`-Datei auf oberster Ebene mit einem passenden
`resolveSessionConversation(...)`-Export bereitstellen. Der Kern verwendet diese bootstrap-sichere Oberfläche
nur, wenn die Runtime-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
Legacy-Kompatibilitätsfallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich
zur generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet der Kern zuerst
`resolveSessionConversation(...).parentConversationCandidates` und fällt nur dann auf
`resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie auslässt.

## Freigaben und Kanalfunktionen

Die meisten Kanal-Plugins benötigen keinen freigabespezifischen Code.

- Der Kern ist zuständig für same-chat `/approve`, gemeinsame Freigabe-Button-Payloads und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt im Kanal-Plugin, wenn der Kanal freigabespezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Freigabezustellung, nativem Verhalten, Rendering und Authentifizierung in `approvalCapability` ab.
- `plugin.auth` ist nur Login/Logout; der Kern liest aus diesem Objekt keine Freigabe-Auth-Hooks mehr.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind der kanonische Seam für Freigabe-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit von same-chat Freigabe-Auth.
- Wenn Ihr Kanal native Exec-Freigaben bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Status der initiierenden Oberfläche/des nativen Clients, wenn er sich von same-chat Freigabe-Auth unterscheidet. Der Kern verwendet diesen exec-spezifischen Hook, um `enabled` von `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Kanal native Exec-Freigaben unterstützt, und den Kanal in Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` ergänzt dies für den üblichen Fall.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für kanalspezifisches Verhalten im Payload-Lebenszyklus, etwa zum Ausblenden doppelter lokaler Freigabe-Prompts oder zum Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Freigabe-Routing oder Fallback-Unterdrückung.
- Verwenden Sie `approvalCapability.nativeRuntime` für kanaleigene Fakten zu nativen Freigaben. Halten Sie es auf heißen Kanal-Einstiegspunkten mit `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy; dadurch kann Ihr Runtime-Modul bei Bedarf importiert werden, während der Kern weiterhin den Freigabe-Lebenszyklus zusammensetzen kann.
- Verwenden Sie `approvalCapability.render` nur, wenn ein Kanal wirklich eigene Freigabe-Payloads statt des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Kanal in der Antwort für den deaktivierten Pfad die exakten Konfigurationsregler erklären soll, die zum Aktivieren nativer Exec-Freigaben benötigt werden. Der Hook erhält `{ channel, channelLabel, accountId }`; Kanäle mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Defaults auf oberster Ebene ausgeben.
- Wenn ein Kanal stabile besitzerähnliche DM-Identitäten aus vorhandener Konfiguration ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um same-chat `/approve` einzuschränken, ohne freigabespezifische Kernlogik hinzuzufügen.
- Wenn ein Kanal native Freigabezustellung benötigt, konzentrieren Sie den Kanalcode auf Zielnormalisierung sowie Transport-/Präsentationsfakten. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die kanalspezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit der Kern den Handler zusammensetzen und Request-Filterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise auf anderweitiges Routing übernehmen kann. `nativeRuntime` ist in einige kleinere Seams aufgeteilt:
- `createChannelNativeOriginTargetResolver` verwendet standardmäßig den gemeinsamen Channel-Route-Matcher für `{ to, accountId, threadId }`-Ziele. Übergeben Sie `targetsMatch` nur, wenn ein Kanal provider-spezifische Äquivalenzregeln hat, etwa Slack-Zeitstempelpräfix-Matching.
- Übergeben Sie `normalizeTargetForMatch` an `createChannelNativeOriginTargetResolver`, wenn der Kanal Provider-IDs kanonisieren muss, bevor der Standard-Routenmatcher oder ein eigener `targetsMatch`-Callback ausgeführt wird, während das ursprüngliche Ziel für die Zustellung erhalten bleibt. Verwenden Sie `normalizeTarget` nur, wenn das aufgelöste Zustellziel selbst kanonisiert werden soll.
- `availability` — ob das Konto konfiguriert ist und ob eine Anfrage verarbeitet werden soll
- `presentation` — ordnet das gemeinsame Freigabe-View-Model nativen ausstehenden/aufgelösten/abgelaufenen Payloads oder finalen Aktionen zu
- `transport` — bereitet Ziele vor und sendet/aktualisiert/löscht native Freigabenachrichten
- `interactions` — optionale Bind-/Unbind-/Clear-Action-Hooks für native Buttons oder Reaktionen
- `observe` — optionale Hooks für Zustellungsdiagnosen
- Wenn der Kanal Runtime-eigene Objekte wie einen Client, ein Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie sie über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry erlaubt dem Kern, funktionsgetriebene Handler aus dem Kanal-Startzustand zu bootstrappen, ohne freigabespezifischen Wrapper-Code hinzuzufügen.
- Greifen Sie nur dann zu den niedrigeren Ebenen `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn der funktionsgetriebene Seam noch nicht ausdrucksstark genug ist.
- Kanäle mit nativen Freigaben müssen sowohl `accountId` als auch `approvalKind` durch diese Helper routen. `accountId` hält die Freigaberichtlinie für mehrere Konten auf das richtige Bot-Konto beschränkt, und `approvalKind` hält Exec- gegenüber Plugin-Freigabeverhalten für den Kanal verfügbar, ohne hartcodierte Verzweigungen im Kern.
- Der Kern ist jetzt auch für Hinweise zur Freigabe-Umleitung zuständig. Kanal-Plugins sollten keine eigenen Follow-up-Nachrichten der Art „Freigabe ging an DMs / einen anderen Kanal“ aus `createChannelNativeApprovalRuntime` senden; stellen Sie stattdessen genaue Origin- und Approver-DM-Routen über die gemeinsamen Freigabefunktions-Helper bereit und lassen Sie den Kern tatsächliche Zustellungen aggregieren, bevor er einen Hinweis zurück in den initiierenden Chat postet.
- Bewahren Sie die Art der zugestellten Freigabe-ID durchgängig. Native Clients sollten
  Exec- gegenüber Plugin-Freigabe-Routing nicht aus kanal-lokalem Zustand erraten oder umschreiben.
- Verschiedene Freigabearten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Freigabe-Routing für Exec- und Plugin-IDs verfügbar.
  - Matrix behält für Exec- und Plugin-Freigaben dasselbe native DM-/Kanal-Routing und dieselbe Reaktions-UX bei,
    während sich Authentifizierung weiterhin je nach Freigabeart unterscheiden kann.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, neuer Code sollte jedoch den Capability-Builder bevorzugen und `approvalCapability` im Plugin bereitstellen.

Für heiße Kanal-Einstiegspunkte bevorzugen Sie die engeren Runtime-Unterpfade, wenn Sie nur
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
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere Umbrella-
Oberfläche nicht benötigen.

Speziell für die Einrichtung:

- `openclaw/plugin-sdk/setup-runtime` umfasst die runtime-sicheren Setup-Helper:
  import-sichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Lookup-Note-Ausgabe,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist der schmale env-bewusste Adapter-
  Seam für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` umfasst die Optional-Install-Setup-
  Builder plus einige setup-sichere Primitive:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Kanal env-gesteuerte Einrichtung oder Authentifizierung unterstützt und generische Startup-/Konfigurations-
Flows diese env-Namen kennen sollten, bevor die Runtime geladen wird, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Runtime-`envVars` des Kanals oder lokale
Konstanten nur für operatorbezogene Texte.

Wenn Ihr Kanal in `status`, `channels list`, `channels status` oder
SecretRef-Scans erscheinen kann, bevor die Plugin-Laufzeit startet, fügen Sie
`openclaw.setupEntry` in `package.json` hinzu. Dieser Einstiegspunkt sollte in
schreibgeschützten Befehlspfaden sicher importierbar sein und die Kanalmetadaten,
den setup-sicheren Konfigurationsadapter, den Statusadapter und die
Secret-Zielmetadaten des Kanals zurückgeben, die für diese Zusammenfassungen
erforderlich sind. Starten Sie keine Clients, Listener oder Transport-Laufzeiten
aus dem Setup-Eintrag.

Halten Sie auch den Importpfad des Haupteintrags des Kanals schmal. Die Erkennung
kann den Eintrag und das Kanal-Plugin-Modul auswerten, um Fähigkeiten zu
registrieren, ohne den Kanal zu aktivieren. Dateien wie `channel-plugin-api.ts`
sollten das Kanal-Plugin-Objekt exportieren, ohne Setup-Assistenten,
Transport-Clients, Socket-Listener, Subprozess-Starter oder
Dienststartmodule zu importieren. Legen Sie diese Laufzeitteile in Module, die
aus `registerFull(...)`, Laufzeit-Settern oder lazy Fähigkeitsadaptern geladen
werden.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere Schnittstelle `openclaw/plugin-sdk/setup` nur, wenn
  Sie auch die umfangreicheren gemeinsamen Setup-/Konfigurationshelfer wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen

Wenn Ihr Kanal in Setup-Oberflächen nur „installieren Sie zuerst dieses Plugin“
anzeigen soll, bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der
generierte Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und der
Finalisierung geschlossen fehl und verwendet dieselbe Installationspflicht-Meldung
für Validierung, Finalisierung und Dokumentationslink-Text.

Für andere heiße Kanalpfade bevorzugen Sie die schmalen Helfer gegenüber
breiteren Legacy-Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Fallback auf das Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehende Route/Envelope und
  Record-and-Dispatch-Verdrahtung
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Abgleich
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für das Laden von Medien sowie
  ausgehende Identitäts-/Sende-Delegates und Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route eine explizite
  `replyToId`/`threadId` beibehalten oder die aktuelle `:thread:`-Sitzung
  wiederherstellen soll, nachdem der Basis-Sitzungsschlüssel weiterhin passt.
  Provider-Plugins können Priorität, Suffix-Verhalten und
  Thread-ID-Normalisierung überschreiben, wenn ihre Plattform native Semantik für
  Thread-Zustellung hat.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von
  Thread-Bindings und Adapterregistrierung
- `openclaw/plugin-sdk/agent-media-payload` nur, wenn ein Legacy-Agent-/Medien-
  Payload-Feldlayout weiterhin erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für die Normalisierung von
  benutzerdefinierten Telegram-Befehlen, Duplikat-/Konfliktvalidierung und einen
  fallback-stabilen Befehls-Konfigurationsvertrag

Auth-only-Kanäle können in der Regel beim Standardpfad bleiben: Der Core behandelt Genehmigungen, und das Plugin stellt nur ausgehende/Auth-Fähigkeiten bereit. Native Genehmigungskanäle wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Helfer verwenden, statt ihren eigenen Genehmigungslebenszyklus zu implementieren.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Verarbeitung eingehender Erwähnungen in zwei Ebenen getrennt:

- Plugin-eigene Erfassung von Nachweisen
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur
Erwähnungsrichtlinie. Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur,
wenn Sie das breitere Helfer-Barrel für eingehende Nachrichten benötigen.

Gut geeignet für Plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung von Zitaten des Bots
- Prüfungen der Thread-Teilnahme
- Ausschlüsse von Dienst-/Systemnachrichten
- plattformeigene Caches, die nötig sind, um Bot-Teilnahme nachzuweisen

Gut geeignet für den gemeinsamen Helfer:

- `requireMention`
- explizites Erwähnungsergebnis
- Allowlist für implizite Erwähnungen
- Befehls-Bypass
- endgültige Überspringentscheidung

Bevorzugter Ablauf:

1. Berechnen Sie lokale Erwähnungsfakten.
2. Übergeben Sie diese Fakten an `resolveInboundMentionDecision({ facts, policy })`.
3. Verwenden Sie `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und `decision.shouldSkip` in Ihrem Gate für eingehende Nachrichten.

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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungshelfer für
gebündelte Kanal-Plugins bereit, die bereits von Laufzeit-Injektion abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht verwandter
Laufzeithelfer für eingehende Nachrichten zu vermeiden.

Die älteren `resolveMentionGating*`-Helfer verbleiben nur als
Kompatibilitätsexporte auf `openclaw/plugin-sdk/channel-inbound`. Neuer Code
sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Walkthrough

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json`
    macht dies zu einem Kanal-Plugin. Die vollständige Oberfläche für
    Paketmetadaten finden Sie unter [Plugin-Einrichtung und Konfiguration](/de/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` validiert `plugins.entries.acme-chat.config`. Verwenden Sie es
    für Plugin-eigene Einstellungen, die nicht zur Kanal-Kontokonfiguration gehören.
    `channelConfigs` validiert `channels.acme-chat` und ist die Cold-Path-Quelle,
    die von Konfigurationsschema, Setup und UI-Oberflächen verwendet wird, bevor
    die Plugin-Laufzeit geladen wird.

  </Step>

  <Step title="Kanal-Plugin-Objekt erstellen">
    Die Schnittstelle `ChannelPlugin` hat viele optionale Adapter-Oberflächen.
    Beginnen Sie mit dem Minimum - `id` und `setup` - und fügen Sie Adapter nach
    Bedarf hinzu.

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

    Für Kanäle, die sowohl kanonische DM-Schlüssel auf oberster Ebene als auch
    ältere verschachtelte Schlüssel akzeptieren, verwenden Sie die Helfer aus
    `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`,
    `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` und
    `normalizeChannelDmPolicy` halten kontolokale Werte vor geerbten Root-Werten.
    Kombinieren Sie denselben Resolver mit der Doctor-Reparatur über
    `normalizeLegacyDmAliases`, damit Laufzeit und Migration denselben Vertrag
    lesen.

    <Accordion title="Was createChatChannelPlugin für Sie erledigt">
      Statt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben
      Sie deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Bereichsbezogener DM-Sicherheitsresolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Codeaustausch |
      | `threading` | Resolver für Antwortmodus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können statt der deklarativen Optionen auch rohe Adapterobjekte
      übergeben, wenn Sie vollständige Kontrolle benötigen.

      Raw-Outgoing-Adapter können eine Funktion `chunker(text, limit, ctx)` definieren.
      Das optionale `ctx.formatting` enthält Formatierungsentscheidungen zum Zustellzeitpunkt
      wie `maxLinesPerMessage`; wenden Sie es vor dem Senden an, damit Antwort-Threading
      und Chunk-Grenzen einmal durch die gemeinsame Outgoing-Zustellung aufgelöst werden.
      Sendekontexte enthalten außerdem `replyToIdSource` (`implicit` oder `explicit`),
      wenn ein natives Antwortziel aufgelöst wurde, damit Payload-Helfer
      explizite Antwort-Tags beibehalten können, ohne einen impliziten, nur einmal verwendbaren Antwort-Slot zu verbrauchen.
    </Accordion>

  </Step>

  <Step title="Einstiegspunkt verdrahten">
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

    Legen Sie channel-eigene CLI-Deskriptoren in `registerCliMetadata(...)` ab, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Laufzeit zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Befehlsregistrierung übernehmen.
    Behalten Sie `registerFull(...)` für reine Laufzeitarbeit bei.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    Plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung des Registrierungsmodus automatisch. Siehe
    [Einstiegspunkte](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Setup-Eintrag hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies anstelle des vollständigen Eintrags, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, dass während Setup-Abläufen schwergewichtiger Laufzeitcode geladen wird.
    Weitere Details finden Sie unter [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry).

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-
    Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen
    expliziten Laufzeit-Setter für die Setup-Zeit benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
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
          // The exact wiring depends on your platform SDK —
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
      (zum Beispiel das Microsoft Teams- oder Google Chat-Plugin-Paket) für echte Muster an.
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

    Für gemeinsame Test-Helfer siehe [Tests](/de/plugins/sdk-testing).

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

## Erweiterte Themen

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
  <Card title="Laufzeit-Helfer" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
  <Card title="Channel-Turn-Kernel" icon="bolt" href="/de/plugins/sdk-channel-turn">
    Gemeinsamer Inbound-Turn-Lebenszyklus: aufnehmen, auflösen, aufzeichnen, weiterleiten, abschließen
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helfer-Seams existieren weiterhin für die Wartung und
Kompatibilität gebündelter Plugins. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen Channel-/Setup-/Antwort-/Laufzeit-Subpfade aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten diese gebündelte Plugin-Familie direkt.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Übersicht](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [SDK-Tests](/de/plugins/sdk-testing) — Test-Hilfsprogramme und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema

## Verwandte Themen

- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
