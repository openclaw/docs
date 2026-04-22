---
read_when:
    - Sie erstellen ein neues Messaging-Channel-Plugin.
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden.
    - Sie müssen die Adapteroberfläche von `ChannelPlugin` verstehen.
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Channel-Plugins für OpenClaw
title: Erstellen von Channel-Plugins
x-i18n:
    generated_at: "2026-04-22T06:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Erstellen von Channel-Plugins

Dieser Leitfaden führt Sie durch das Erstellen eines Channel-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende verfügen Sie über einen funktionierenden Channel mit DM-Sicherheit,
Pairing, Antwort-Threading und ausgehender Nachrichtenübermittlung.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Manifest-Einrichtung.
</Info>

## So funktionieren Channel-Plugins

Channel-Plugins benötigen keine eigenen Send/Edit/React-Tools. OpenClaw behält ein
gemeinsam genutztes `message`-Tool im Core. Ihr Plugin ist verantwortlich für:

- **Konfiguration** — Kontoauflösung und Einrichtungsassistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Pairing** — DM-Freigabefluss
- **Sitzungsgrammatik** — wie providerspezifische Konversations-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads eingeordnet werden
- **Heartbeat-Typing** — optionale Tipp-/Beschäftigt-Signale für Heartbeat-Zustellungsziele

Der Core ist verantwortlich für das gemeinsam genutzte Message-Tool, Prompt-Verdrahtung, die äußere Sitzungs-Schlüsselstruktur,
generische `:thread:`-Verwaltung und Dispatch.

Wenn Ihr Channel Tippindikatoren außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` im Channel-Plugin bereit. Der Core ruft dies mit dem
aufgelösten Heartbeat-Zustellungsziel auf, bevor der Heartbeat-Modelllauf startet, und
verwendet den gemeinsamen Typing-Keepalive-/Cleanup-Lebenszyklus. Fügen Sie `heartbeat.clearTyping(...)`
hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

Wenn Ihr Channel Message-Tool-Parameter hinzufügt, die Medienquellen transportieren, stellen Sie diese
Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit. Der Core verwendet
diese explizite Liste für die Normalisierung von Sandbox-Pfaden und die Richtlinie für ausgehenden Medienzugriff,
sodass Plugins keine Spezialfälle im gemeinsamen Core für providerspezifische
Avatar-, Anhangs- oder Cover-Image-Parameter benötigen.
Geben Sie bevorzugt eine aktionsbezogene Map zurück, z. B.
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht zusammenhängende Aktionen nicht
die Medienargumente einer anderen Aktion übernehmen. Ein flaches Array funktioniert weiterhin für Parameter, die
bewusst über alle bereitgestellten Aktionen hinweg gemeinsam genutzt werden.

Wenn Ihre Plattform zusätzlichen Geltungsbereich in Konversations-IDs speichert, behalten Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Dies ist der
kanonische Hook für die Zuordnung von `rawId` zur Basis-Konversations-ID, optionalen Thread-ID,
expliziten `baseConversationId` und allen `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie diese in einer Reihenfolge vom
engsten Parent bis zur breitesten/Basis-Konversation.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Channel-Registry startet,
können zusätzlich eine Top-Level-Datei `session-key-api.ts` mit einem passenden
Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese bootstrap-sichere Oberfläche
nur dann, wenn die Runtime-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich
zur generischen/rohen ID benötigt. Wenn beide Hooks vorhanden sind, verwendet der Core
zuerst `resolveSessionConversation(...).parentConversationCandidates` und greift nur
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
diese auslässt.

## Freigaben und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen freigabespezifischen Code.

- Der Core ist verantwortlich für `/approve` im selben Chat, gemeinsam genutzte Payloads für Freigabe-Schaltflächen und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt im Channel-Plugin, wenn der Channel freigabespezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Platzieren Sie Fakten zu Freigabezustellung, nativer Freigabe, Rendering und Auth in `approvalCapability`.
- `plugin.auth` ist nur für Login/Logout zuständig; der Core liest keine Auth-Hooks für Freigaben mehr aus diesem Objekt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Oberfläche für Freigabe-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit der Freigabe-Auth im selben Chat.
- Wenn Ihr Channel native Exec-Freigaben bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Zustand der initiierenden Oberfläche/des nativen Clients, wenn er sich von der Freigabe-Auth im selben Chat unterscheidet. Der Core verwendet diesen exec-spezifischen Hook, um zwischen `enabled` und `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Channel native Exec-Freigaben unterstützt, und den Channel in die native-Client-Fallback-Anleitung aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den üblichen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für channelspezifisches Payload-Lebenszyklusverhalten wie das Ausblenden doppelter lokaler Freigabe-Prompts oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Freigabe-Routing oder die Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.nativeRuntime` für channel-eigene Fakten zur nativen Freigabe. Halten Sie es auf Hot-Channel-Einstiegspunkten lazy mit `createLazyChannelApprovalNativeRuntimeAdapter(...)`, das Ihr Runtime-Modul bei Bedarf importieren kann und dem Core trotzdem erlaubt, den Freigabe-Lebenszyklus zusammenzustellen.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Channel wirklich benutzerdefinierte Freigabe-Payloads statt des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Channel in der Antwort des deaktivierten Pfads die genauen Konfigurationsschalter erklären soll, die zum Aktivieren nativer Exec-Freigaben erforderlich sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Channels mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Defaults auf oberster Ebene rendern.
- Wenn ein Channel stabile eigentümerähnliche DM-Identitäten aus vorhandener Konfiguration ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat zu beschränken, ohne freigabespezifische Core-Logik hinzuzufügen.
- Wenn ein Channel native Freigabezustellung benötigt, halten Sie den Channel-Code auf Zielnormalisierung sowie Transport-/Darstellungsfakten fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Platzieren Sie die channelspezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit der Core den Handler zusammenstellen und Anforderungsfilterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise auf anderweitiges Routing übernehmen kann. `nativeRuntime` ist in einige kleinere Oberflächen aufgeteilt:
- `availability` — ob das Konto konfiguriert ist und ob eine Anforderung verarbeitet werden soll
- `presentation` — Zuordnung des gemeinsam genutzten Freigabe-View-Modells zu nativen Payloads oder finalen Aktionen für ausstehend/aufgelöst/abgelaufen
- `transport` — Ziele vorbereiten sowie native Freigabenachrichten senden/aktualisieren/löschen
- `interactions` — optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Schaltflächen oder Reaktionen
- `observe` — optionale Hooks für Zustellungsdiagnostik
- Wenn der Channel Runtime-eigene Objekte wie einen Client, Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie sie über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry ermöglicht es dem Core, fähigkeitsgesteuerte Handler aus dem Channel-Startzustand zu bootstrappen, ohne freigabespezifischen Wrapper-Glue hinzuzufügen.
- Greifen Sie nur dann zur Low-Level-Variante `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die fähigkeitsgesteuerte Oberfläche noch nicht ausdrucksstark genug ist.
- Native Freigabe-Channels müssen sowohl `accountId` als auch `approvalKind` durch diese Hilfsfunktionen leiten. `accountId` hält die Richtlinie für Freigaben mit mehreren Konten auf das richtige Bot-Konto beschränkt, und `approvalKind` hält Exec- gegenüber Plugin-Freigabeverhalten für den Channel verfügbar, ohne fest codierte Verzweigungen im Core.
- Der Core ist jetzt auch für Hinweise zur Umleitung von Freigaben verantwortlich. Channel-Plugins sollten keine eigenen Folgenachrichten wie „Freigabe ging an DMs / einen anderen Channel“ aus `createChannelNativeApprovalRuntime` senden; stattdessen sollten sie korrektes Routing für Ursprung + Freigeber-DM über die gemeinsamen Hilfsfunktionen für Freigabe-Fähigkeiten bereitstellen und den Core tatsächliche Zustellungen aggregieren lassen, bevor irgendein Hinweis zurück in den initiierenden Chat gepostet wird.
- Behalten Sie die Art der zugestellten Freigabe-ID Ende-zu-Ende bei. Native Clients sollten das Routing für Exec- gegenüber Plugin-Freigaben nicht aus channel-lokalem Zustand erraten oder umschreiben.
- Unterschiedliche Freigabearten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Freigabe-Routing sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Channel-Routing und dieselbe Reaktions-UX für Exec- und Plugin-Freigaben bei und erlaubt trotzdem, dass sich die Auth nach Freigabeart unterscheidet.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, neuer Code sollte jedoch den Capability-Builder bevorzugen und `approvalCapability` im Plugin bereitstellen.

Für Hot-Channel-Einstiegspunkte sollten Sie die schmaleren Runtime-Unterpfade bevorzugen, wenn Sie nur
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

Bevorzugen Sie ebenso `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere Dachoberfläche
nicht benötigen.

Speziell für Setup:

- `openclaw/plugin-sdk/setup-runtime` deckt die runtime-sicheren Setup-Hilfsfunktionen ab:
  import-sichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die schmale env-bewusste Adapter-
  Oberfläche für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die Setup-Builder für optionale Installation
  sowie einige Setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Channel env-gesteuertes Setup oder Auth unterstützt und generische Start-/Konfigurations-
Abläufe diese Env-Namen kennen sollen, bevor die Runtime geladen wird, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Runtime-`envVars` des Channels oder lokale
Konstanten nur für operatorseitigen Text bei.

Wenn Ihr Channel in `status`, `channels list`, `channels status` oder SecretRef-Scans erscheinen kann, bevor die Plugin-Runtime startet, fügen Sie `openclaw.setupEntry` in `package.json` hinzu. Dieser Einstiegspunkt sollte in schreibgeschützten Befehlspfaden sicher importierbar sein und die Channel-Metadaten, den setup-sicheren Konfigurationsadapter, den Statusadapter und die Metadaten des Channel-Secret-Ziels zurückgeben, die für diese Zusammenfassungen erforderlich sind. Starten Sie aus dem Setup-Einstieg keine Clients, Listener oder Transport-Runtimes.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere Oberfläche `openclaw/plugin-sdk/setup` nur dann, wenn Sie zusätzlich die
  schwereren gemeinsam genutzten Setup-/Konfigurationshilfen wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen

Wenn Ihr Channel in Setup-Oberflächen nur „installieren Sie zuerst dieses Plugin“ anzeigen soll, bevorzugen Sie
`createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung fehl geschlossen fehl und verwendet
dieselbe Installationshinweis-Nachricht für Validierung, Finalisierung und Text mit Docs-Link wieder.

Für andere Hot-Channel-Pfade sollten Sie die schmalen Hilfsfunktionen gegenüber breiteren Legacy-
Oberflächen bevorzugen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Default-Account-Fallback
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehendes Route-/Envelope- und
  Record-and-Dispatch-Wiring
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Matching
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen sowie ausgehende
  Identitäts-/Sende-Delegates und Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route ein
  explizites `replyToId`/`threadId` beibehalten oder die aktuelle `:thread:`-Sitzung
  wiederherstellen soll, nachdem der Basis-Sitzungsschlüssel weiterhin übereinstimmt.
  Provider-Plugins können Priorität, Suffix-Verhalten und Thread-ID-Normalisierung überschreiben, wenn ihre Plattform native Thread-Zustellungssemantik hat.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von Thread-Bindings
  und Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein Legacy-Feldlayout
  für Agent-/Medien-Payloads erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Normalisierung benutzerdefinierter Befehle,
  Validierung von Duplikaten/Konflikten und einen fallback-stabilen Befehls-
  Konfigurationsvertrag

Reine Auth-Channels können normalerweise beim Standardpfad bleiben: Der Core verwaltet Freigaben, und das Plugin stellt nur Outbound-/Auth-Fähigkeiten bereit. Native Freigabe-Channels wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Hilfsfunktionen verwenden, statt ihren eigenen Freigabe-Lebenszyklus zu entwickeln.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Verarbeitung eingehender Erwähnungen in zwei Ebenen getrennt:

- plugin-eigene Evidenzermittlung
- gemeinsam genutzte Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur dann, wenn Sie das breitere Barrel
für eingehende Hilfsfunktionen benötigen.

Geeignet für plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung von Zitaten des Bots
- Prüfungen der Thread-Beteiligung
- Ausschlüsse von Service-/Systemnachrichten
- plattformnative Caches, die erforderlich sind, um Bot-Beteiligung nachzuweisen

Geeignet für die gemeinsam genutzte Hilfsfunktion:

- `requireMention`
- explizites Erwähnungsergebnis
- Allowlist für implizite Erwähnungen
- Befehl-Bypass
- endgültige Skip-Entscheidung

Bevorzugter Ablauf:

1. Lokale Erwähnungsfakten berechnen.
2. Diese Fakten an `resolveInboundMentionDecision({ facts, policy })` übergeben.
3. `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und `decision.shouldSkip` in Ihrem Eingangs-Gate verwenden.

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

`api.runtime.channel.mentions` stellt dieselben gemeinsam genutzten Erwähnungs-Hilfsfunktionen für
gebündelte Channel-Plugins bereit, die bereits von Runtime-Injection abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht zusammenhängender
Hilfsfunktionen für eingehende Runtime zu vermeiden.

Die älteren Hilfsfunktionen `resolveMentionGating*` bleiben auf
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitäts-Exporte erhalten. Neuer Code
sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json`
    macht dies zu einem Channel-Plugin. Die vollständige Oberfläche der Paketmetadaten
    finden Sie unter [Plugin-Setup und -Konfiguration](/de/plugins/sdk-setup#openclaw-channel):

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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Das Channel-Plugin-Objekt erstellen">
    Das Interface `ChannelPlugin` hat viele optionale Adapteroberflächen. Beginnen Sie mit
    dem Minimum — `id` und `setup` — und fügen Sie Adapter nach Bedarf hinzu.

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

    <Accordion title="Was `createChatChannelPlugin` für Sie erledigt">
      Statt Low-Level-Adapter-Interfaces manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Bereichsbezogener DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Fluss mit Codeaustausch |
      | `threading` | Resolver für Reply-to-Modi (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können auch rohe Adapterobjekte anstelle der deklarativen Optionen übergeben,
      wenn Sie vollständige Kontrolle benötigen.
    </Accordion>

  </Step>

  <Step title="Den Einstiegspunkt verdrahten">
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

    Platzieren Sie channel-eigene CLI-Deskriptoren in `registerCliMetadata(...)`, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Runtime zu aktivieren,
    während normale vollständige Ladevorgänge weiterhin dieselben Deskriptoren für die echte Befehls-
    Registrierung übernehmen. Behalten Sie `registerFull(...)` für nur runtimebezogene Arbeit.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung des Registrierungsmodus automatisch. Siehe
    [Einstiegspunkte](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Einen Setup-Einstieg hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies anstelle des vollständigen Einstiegs, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, dass schwerer Runtime-Code während von Setup-Abläufen geladen wird.
    Siehe [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry) für Details.

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-
    Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen
    expliziten runtimebezogenen Setter zur Setup-Zeit benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Inbound-Handler Ihres Channels weiterleitet:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-verwaltete Auth (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Inbound-Handler leitet die Nachricht an OpenClaw weiter.
          // Das genaue Wiring hängt von Ihrem Plattform-SDK ab —
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
      Die Verarbeitung eingehender Nachrichten ist channelspezifisch. Jedes Channel-Plugin verwaltet
      seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Channel-Plugins
      an (zum Beispiel das Plugin-Paket für Microsoft Teams oder Google Chat), um reale Muster zu sehen.
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

    Gemeinsame Test-Hilfsfunktionen finden Sie unter [Testing](/de/plugins/sdk-testing).

  </Step>
</Steps>

## Dateistruktur

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel-Metadaten
├── openclaw.plugin.json      # Manifest mit Konfigurationsschema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Öffentliche Exporte (optional)
├── runtime-api.ts            # Interne Runtime-Exporte (optional)
└── src/
    ├── channel.ts            # ChannelPlugin über createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Plattform-API-Client
    └── runtime.ts            # Runtime-Store (falls erforderlich)
```

## Erweiterte Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Message-Tools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Aktionserkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Oberflächen existieren weiterhin für die Wartung gebündelter Plugins und
zur Kompatibilität. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen Unterpfade für Channel/Setup/Reply/Runtime aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten direkt diese Familie gebündelter Plugins.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [SDK Testing](/de/plugins/sdk-testing) — Test-Utilities und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema
