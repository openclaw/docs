---
read_when:
    - Sie erstellen ein neues Messaging-Channel-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Channel-Plugins für OpenClaw
title: Erstellen von Channel-Plugins
x-i18n:
    generated_at: "2026-04-21T19:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Erstellen von Channel-Plugins

Dieser Leitfaden führt Sie durch das Erstellen eines Channel-Plugins, das OpenClaw mit einer Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Channel mit DM-Sicherheit, Kopplung, Antwort-Threading und ausgehender Nachrichtenübermittlung.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Manifest-Einrichtung.
</Info>

## So funktionieren Channel-Plugins

Channel-Plugins benötigen keine eigenen Senden-/Bearbeiten-/Reagieren-Tools. OpenClaw hält ein gemeinsames `message`-Tool im Core. Ihr Plugin ist zuständig für:

- **Konfiguration** — Kontenauflösung und Einrichtungsassistent
- **Sicherheit** — DM-Richtlinie und Zulassungslisten
- **Kopplung** — DM-Genehmigungsablauf
- **Sitzungsgrammatik** — wie anbieterspezifische Konversations-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden

Der Core verwaltet das gemeinsame Message-Tool, Prompt-Verkabelung, die äußere Session-Key-Form, generische `:thread:`-Buchführung und Dispatch.

Wenn Ihr Channel Message-Tool-Parameter hinzufügt, die Medienquellen transportieren, legen Sie diese Parameternamen über `describeMessageTool(...).mediaSourceParams` offen. Der Core verwendet diese explizite Liste für die Normalisierung von Sandbox-Pfaden und die Richtlinie für ausgehenden Medienzugriff, sodass Plugins keine Shared-Core-Sonderfälle für anbieterspezifische Avatar-, Anhang- oder Titelbild-Parameter benötigen.
Bevorzugen Sie die Rückgabe einer nach Aktionen sortierten Map wie
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht zusammenhängende Aktionen nicht die Medienargumente anderer Aktionen übernehmen. Ein flaches Array funktioniert weiterhin für Parameter, die absichtlich über alle offengelegten Aktionen hinweg gemeinsam genutzt werden.

Wenn Ihre Plattform zusätzlichen Geltungsbereich in Konversations-IDs speichert, halten Sie dieses Parsing mit `messaging.resolveSessionConversation(...)` im Plugin. Das ist der kanonische Hook zum Abbilden von `rawId` auf die Basis-Konversations-ID, eine optionale Thread-ID, eine explizite `baseConversationId` und mögliche `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie deren Reihenfolge von dem engsten Parent bis zur breitesten/Basis-Konversation ein.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Channel-Registry startet, können außerdem eine Top-Level-Datei `session-key-api.ts` mit einem passenden Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese Bootstrap-sichere Oberfläche nur dann, wenn die Laufzeit-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich zur generischen/raw ID benötigt. Wenn beide Hooks existieren, verwendet der Core zuerst `resolveSessionConversation(...).parentConversationCandidates` und greift nur auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook sie auslässt.

## Genehmigungen und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen Genehmigungscode.

- Der Core verwaltet `/approve` im selben Chat, gemeinsame Payloads für Genehmigungsbuttons und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt auf dem Channel-Plugin, wenn der Channel genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Zustellung/Native/Rendering/Auth-Fakten für Genehmigungen in `approvalCapability` ab.
- `plugin.auth` ist nur für Login/Logout; der Core liest keine Genehmigungs-Auth-Hooks mehr aus diesem Objekt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Oberfläche für Genehmigungs-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit von Genehmigungs-Auth im selben Chat.
- Wenn Ihr Channel native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Status der initiierenden Oberfläche/des nativen Clients, wenn dieser sich von der Genehmigungs-Auth im selben Chat unterscheidet. Der Core verwendet diesen exec-spezifischen Hook, um `enabled` und `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Channel native Exec-Genehmigungen unterstützt, und den Channel in Guidance für Native-Client-Fallbacks einzubeziehen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den gängigen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für channelspezifisches Verhalten im Payload-Lebenszyklus, etwa das Ausblenden doppelter lokaler Genehmigungs-Prompts oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für native Genehmigungsweiterleitung oder Fallback-Unterdrückung.
- Verwenden Sie `approvalCapability.nativeRuntime` für channel-eigene Fakten zu nativen Genehmigungen. Halten Sie ihn auf Hot-Channel-Entrypoints lazy mit `createLazyChannelApprovalNativeRuntimeAdapter(...)`, das Ihr Runtime-Modul bei Bedarf importieren kann, während der Core weiterhin den Genehmigungslebenszyklus zusammensetzen kann.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Channel wirklich benutzerdefinierte Genehmigungs-Payloads anstelle des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Channel in der Disabled-Antwort genau erläutern soll, welche Konfigurationsregler zum Aktivieren nativer Exec-Genehmigungen erforderlich sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Channels mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Top-Level-Standards rendern.
- Wenn ein Channel stabile DM-Identitäten mit Besitzercharakter aus vorhandener Konfiguration ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne genehmigungsspezifische Core-Logik hinzuzufügen.
- Wenn ein Channel native Genehmigungszustellung benötigt, konzentrieren Sie den Channel-Code auf Zielnormalisierung sowie Transport-/Darstellungsfakten. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die channelspezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sodass der Core den Handler zusammensetzen und Request-Filtering, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise auf anderswo erfolgte Weiterleitung verwalten kann. `nativeRuntime` ist in einige kleinere Oberflächen aufgeteilt:
- `availability` — ob das Konto konfiguriert ist und ob eine Anfrage verarbeitet werden soll
- `presentation` — Zuordnung des gemeinsamen Genehmigungs-View-Models zu nativen Payloads für ausstehend/aufgelöst/abgelaufen oder zu finalen Aktionen
- `transport` — Vorbereiten von Zielen sowie Senden/Aktualisieren/Löschen nativer Genehmigungsnachrichten
- `interactions` — optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Buttons oder Reaktionen
- `observe` — optionale Hooks für Zustellungsdiagnostik
- Wenn der Channel laufzeiteigene Objekte wie einen Client, Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie diese über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry ermöglicht es dem Core, capability-gesteuerte Handler aus dem Startup-Status des Channels zu bootstrappen, ohne genehmigungsspezifischen Wrapper-Glue hinzuzufügen.
- Greifen Sie nur dann zu den Low-Level-Funktionen `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die capability-gesteuerte Oberfläche noch nicht ausdrucksstark genug ist.
- Native Genehmigungs-Channels müssen sowohl `accountId` als auch `approvalKind` durch diese Hilfen routen. `accountId` hält die Richtlinie für Multi-Account-Genehmigungen auf das richtige Bot-Konto beschränkt, und `approvalKind` hält das Verhalten für Exec- vs. Plugin-Genehmigungen für den Channel verfügbar, ohne hartcodierte Verzweigungen im Core.
- Der Core verwaltet jetzt auch Hinweise zur Umleitung von Genehmigungen. Channel-Plugins sollten keine eigenen Follow-up-Nachrichten wie „Genehmigung ging an DMs / einen anderen Channel“ aus `createChannelNativeApprovalRuntime` senden; stattdessen sollten sie korrektes Routing für Ursprung + Approver-DM über die gemeinsamen Hilfen für Genehmigungsfähigkeiten bereitstellen und den Core die tatsächlichen Zustellungen aggregieren lassen, bevor er einen Hinweis zurück in den initiierenden Chat sendet.
- Bewahren Sie die Art der zugestellten Genehmigungs-ID Ende-zu-Ende. Native Clients sollten das Routing für Exec- vs. Plugin-Genehmigungen nicht aus channel-lokalem Zustand erraten oder umschreiben.
- Verschiedene Genehmigungsarten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Channel-Routing und dieselbe Reaktions-UX für Exec- und Plugin-Genehmigungen bei, lässt Auth aber weiterhin je nach Genehmigungsart unterschiedlich sein.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, neuer Code sollte jedoch den Capability-Builder bevorzugen und `approvalCapability` im Plugin offenlegen.

Für Hot-Channel-Entrypoints bevorzugen Sie die schmaleren Runtime-Unterpfade, wenn Sie nur einen Teil dieser Familie benötigen:

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
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die umfassendere Umbrella-Oberfläche nicht benötigen.

Speziell für Setup gilt:

- `openclaw/plugin-sdk/setup-runtime` umfasst die runtime-sicheren Setup-Helfer:
  import-sichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die schmale umgebungsbewusste Adapter-Oberfläche
  für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` umfasst die optionalen Installations-Setup-Builder
  plus einige setup-sichere Primitive:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Channel env-gesteuertes Setup oder Auth unterstützt und generische Startup-/Konfigurationsabläufe diese env-Namen vor dem Laden der Runtime kennen sollen, deklarieren Sie sie im Plugin-Manifest mit `channelEnvVars`. Behalten Sie Runtime-`envVars` des Channels oder lokale Konstanten nur für operatororientierte Texte bei.

Wenn Ihr Channel in `status`, `channels list`, `channels status` oder SecretRef-Scans erscheinen kann, bevor die Plugin-Runtime startet, fügen Sie `openclaw.setupEntry` in `package.json` hinzu. Dieser Entrypoint sollte in schreibgeschützten Befehlspfaden sicher importierbar sein und die für diese Zusammenfassungen benötigten Channel-Metadaten, den setup-sicheren Konfigurationsadapter, den Statusadapter und die Zielmetadaten für Channel-Secrets zurückgeben. Starten Sie aus dem Setup-Entry keine Clients, Listener oder Transportruntimes.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die umfassendere Oberfläche `openclaw/plugin-sdk/setup` nur dann, wenn Sie zusätzlich die
  schwergewichtigeren gemeinsamen Setup-/Konfigurationshelfer wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen

Wenn Ihr Channel in Setup-Oberflächen nur „installieren Sie zuerst dieses Plugin“ anzeigen möchte, bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung fail-closed fehl und verwendet dieselbe Installationsmeldung für Validierung, Finalisierung und Docs-Link-Text erneut.

Für andere Hot-Channel-Pfade bevorzugen Sie die schmalen Helfer gegenüber breiteren Legacy-Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Default-Account-Fallback
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehende Route/Envelope und
  Record-and-Dispatch-Verkabelung
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Matching
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen sowie Delegates für ausgehende
  Identität/Senden und Payload-Planung
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Thread-Binding-Lebenszyklus
  und die Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein Legacy-Agent-/Medien-
  Payload-Feldlayout erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Normalisierung benutzerdefinierter Befehle,
  Validierung von Duplikaten/Konflikten und einen fallback-stabilen
  Befehlskonfigurationsvertrag

Reine Auth-Channels können meist beim Standardpfad bleiben: Der Core verwaltet Genehmigungen, und das Plugin stellt nur Outbound-/Auth-Fähigkeiten bereit. Native Genehmigungs-Channels wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Helfer verwenden, anstatt ihren eigenen Genehmigungslebenszyklus zu implementieren.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Verarbeitung eingehender Erwähnungen in zwei Ebenen getrennt:

- plugin-eigene Belegsammlung
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur dann, wenn Sie das umfassendere Barrel für eingehende
Helfer benötigen.

Gut geeignet für plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung von Zitaten des Bots
- Prüfungen auf Thread-Beteiligung
- Ausschlüsse von Service-/Systemnachrichten
- plattformnative Caches, die benötigt werden, um Bot-Beteiligung nachzuweisen

Gut geeignet für den gemeinsamen Helfer:

- `requireMention`
- explizites Erwähnungsergebnis
- implizite Erwähnungs-Zulassungsliste
- Befehls-Bypass
- endgültige Skip-Entscheidung

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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungshelfer für
gebündelte Channel-Plugins bereit, die bereits von Runtime-Injection abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht zusammenhängender eingehender
Runtime-Helfer zu vermeiden.

Die älteren Helfer `resolveMentionGating*` bleiben auf
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitätsexporte erhalten. Neuer Code
sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Durchgang

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

  <Step title="Erstellen Sie das Channel-Plugin-Objekt">
    Die Schnittstelle `ChannelPlugin` hat viele optionale Adapter-Oberflächen. Beginnen Sie mit
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
      Statt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was es verdrahtet |
      | --- | --- |
      | `security.dm` | Scoped-DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Kopplungsablauf mit Codeaustausch |
      | `threading` | Reply-to-Mode-Resolver (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können auch rohe Adapter-Objekte statt deklarativer Optionen übergeben,
      wenn Sie die vollständige Kontrolle benötigen.
    </Accordion>

  </Step>

  <Step title="Verbinden Sie den Entrypoint">
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
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Runtime zu aktivieren,
    während normale Vollladungen dieselben Deskriptoren weiterhin für die echte Befehls-
    Registrierung übernehmen. Halten Sie `registerFull(...)` für Runtime-Only-Arbeit vor.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    pluginspezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` behandelt die Trennung der Registrierungsmodi automatisch. Alle
    Optionen finden Sie unter [Entrypoints](/de/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Fügen Sie einen Setup-Entry hinzu">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies anstelle des vollständigen Entrypoints, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. So wird vermieden, während Setup-Abläufen schwergewichtigen Runtime-Code zu laden.
    Details finden Sie unter [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry).

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-Module
    aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie zusätzlich einen
    expliziten setupzeitigen Runtime-Setter benötigen.

  </Step>

  <Step title="Verarbeiten Sie eingehende Nachrichten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Inbound-Handler Ihres Channels dispatcht:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // pluginverwaltete Auth (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Inbound-Handler dispatcht die Nachricht an OpenClaw.
          // Die genaue Verdrahtung hängt von Ihrem Plattform-SDK ab —
          // ein echtes Beispiel finden Sie im gebündelten Plugin-Paket für Microsoft Teams oder Google Chat.
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

    Gemeinsame Testhilfen finden Sie unter [Testing](/de/plugins/sdk-testing).

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
    describeMessageTool und Action-Erkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Helfer" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Seams existieren weiterhin für die Wartung gebündelter Plugins und
zur Kompatibilität. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen Unterpfade channel/setup/reply/runtime aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten direkt diese gebündelte Plugin-Familie.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [SDK-Testing](/de/plugins/sdk-testing) — Test-Utilities und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema
