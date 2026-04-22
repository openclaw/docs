---
read_when:
    - Sie erstellen ein neues Messaging-Channel-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Channel-Plugins für OpenClaw
title: Erstellen von Channel-Plugins
x-i18n:
    generated_at: "2026-04-22T04:24:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Erstellen von Channel-Plugins

Dieser Leitfaden führt Sie durch die Erstellung eines Channel-Plugins, das OpenClaw mit einer Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Channel mit DM-Sicherheit, Pairing, Antwort-Threading und ausgehender Nachrichtenübermittlung.

<Info>
  Wenn Sie noch nie zuvor ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Getting Started](/de/plugins/building-plugins) für die grundlegende
  Paketstruktur und die Manifest-Einrichtung.
</Info>

## So funktionieren Channel-Plugins

Channel-Plugins benötigen keine eigenen Send/Edit/React-Tools. OpenClaw verwaltet ein gemeinsames `message`-Tool im Core. Ihr Plugin verantwortet:

- **Konfiguration** — Kontenauflösung und Einrichtungsassistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Pairing** — DM-Genehmigungsablauf
- **Sitzungsgrammatik** — wie provider-spezifische Unterhaltungs-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden

Core verantwortet das gemeinsame Message-Tool, Prompt-Wiring, die äußere Session-Key-Form, generische `:thread:`-Buchführung und Dispatch.

Wenn Ihr Channel Message-Tool-Parameter hinzufügt, die Medienquellen tragen, stellen Sie diese Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit. Core verwendet diese explizite Liste für die Normalisierung von Sandbox-Pfaden und die Richtlinie für ausgehenden Medienzugriff, sodass Plugins keine Shared-Core-Sonderfälle für provider-spezifische Avatar-, Attachment- oder Cover-Image-Parameter benötigen.
Geben Sie bevorzugt eine aktionsbasierte Map zurück, etwa
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht verwandte Aktionen nicht die Medienargumente einer anderen Aktion erben. Ein flaches Array funktioniert weiterhin für Parameter, die absichtlich über alle bereitgestellten Aktionen hinweg geteilt werden.

Wenn Ihre Plattform zusätzlichen Scope in Unterhaltungs-IDs speichert, behalten Sie dieses Parsing mit `messaging.resolveSessionConversation(...)` im Plugin. Das ist der kanonische Hook für das Mapping von `rawId` auf die Basis-Unterhaltungs-ID, optionale Thread-ID, explizite `baseConversationId` und etwaige `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie diese von dem engsten Parent bis zur breitesten/Basis-Unterhaltung geordnet.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Channel-Registry gebootet wird, können außerdem eine Top-Level-Datei `session-key-api.ts` mit einem passenden Export `resolveSessionConversation(...)` bereitstellen. Core verwendet diese bootstrap-sichere Oberfläche nur dann, wenn die Runtime-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich zur generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet Core zuerst `resolveSessionConversation(...).parentConversationCandidates` und fällt nur dann auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook sie auslässt.

## Genehmigungen und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen genehmigungsspezifischen Code.

- Core verantwortet `/approve` im selben Chat, gemeinsame Payloads für Genehmigungsbuttons und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes Objekt `approvalCapability` auf dem Channel-Plugin, wenn der Channel genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung/nativer Darstellung/Rendering/Auth in `approvalCapability` ab.
- `plugin.auth` ist nur für Login/Logout; Core liest aus diesem Objekt keine Approval-Auth-Hooks mehr.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind der kanonische Seam für Approval-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit von Approval-Auth im selben Chat.
- Wenn Ihr Channel native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Status der initiierenden Oberfläche/des nativen Clients, wenn er sich von Approval-Auth im selben Chat unterscheidet. Core verwendet diesen exec-spezifischen Hook, um `enabled` vs. `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Channel native Exec-Genehmigungen unterstützt, und den Channel in Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den häufigen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für channel-spezifisches Payload-Lifecycle-Verhalten wie das Ausblenden doppelter lokaler Genehmigungs-Prompts oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Approval-Routing oder die Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.nativeRuntime` für channel-eigene Fakten zu nativen Genehmigungen. Halten Sie es auf heißen Channel-Entrypoints mit `createLazyChannelApprovalNativeRuntimeAdapter(...)` lazy, das Ihr Runtime-Modul bei Bedarf importieren kann und Core trotzdem ermöglicht, den Approval-Lifecycle zusammenzusetzen.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Channel wirklich benutzerdefinierte Approval-Payloads anstelle des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Channel in der Antwort für den deaktivierten Pfad die genauen Konfigurationsschalter erklären soll, die zum Aktivieren nativer Exec-Genehmigungen nötig sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Channels mit benannten Konten sollten kontospezifische Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Top-Level-Standards rendern.
- Wenn ein Channel aus bestehender Konfiguration stabile DM-Identitäten mit eigentümerähnlichem Charakter ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne Approval-spezifische Core-Logik hinzuzufügen.
- Wenn ein Channel native Approval-Zustellung benötigt, halten Sie den Channel-Code auf Zielnormalisierung plus Transport-/Präsentationsfakten fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Platzieren Sie die channel-spezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit Core den Handler zusammensetzen und Request-Filterung, Routing, Dedupe, Ablauf, Gateway-Subscription und Hinweise „anderswo geroutet“ verantworten kann. `nativeRuntime` ist in einige kleinere Seams aufgeteilt:
- `availability` — ob das Konto konfiguriert ist und ob eine Anfrage verarbeitet werden soll
- `presentation` — Mapping des gemeinsamen Approval-View-Models auf ausstehende/aufgelöste/abgelaufene native Payloads oder finale Aktionen
- `transport` — Ziele vorbereiten sowie native Approval-Nachrichten senden/aktualisieren/löschen
- `interactions` — optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Buttons oder Reaktionen
- `observe` — optionale Hooks für Zustellungsdiagnostik
- Wenn der Channel Runtime-eigene Objekte wie einen Client, Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie diese über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry ermöglicht es Core, fähigkeitsgesteuerte Handler aus dem Startup-Status des Channels zu bootstrappen, ohne Approval-spezifischen Wrapper-Glue hinzuzufügen.
- Greifen Sie nur dann zu dem Low-Level-`createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn der capability-gesteuerte Seam noch nicht ausdrucksstark genug ist.
- Native Approval-Channels müssen sowohl `accountId` als auch `approvalKind` durch diese Helfer routen. `accountId` hält die Multi-Account-Approval-Richtlinie auf das richtige Bot-Konto begrenzt, und `approvalKind` hält Exec- vs. Plugin-Approval-Verhalten für den Channel verfügbar, ohne hartcodierte Verzweigungen im Core.
- Core verantwortet jetzt auch Hinweise zur Umleitung von Genehmigungen. Channel-Plugins sollten aus `createChannelNativeApprovalRuntime` keine eigenen Follow-up-Nachrichten vom Typ „Genehmigung ging in DMs / einen anderen Channel“ mehr senden; stattdessen sollten sie präzises Origin- + Approver-DM-Routing über die gemeinsamen Approval-Capability-Helfer bereitstellen und Core die tatsächlichen Zustellungen aggregieren lassen, bevor ein Hinweis an den initiierenden Chat zurückgesendet wird.
- Behalten Sie die Art der zugestellten Approval-ID durchgängig bei. Native Clients sollten Exec- vs. Plugin-Approval-Routing nicht aus channel-lokalem Zustand erraten oder umschreiben.
- Unterschiedliche Approval-Arten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Approval-Routing sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix hält dasselbe native DM-/Channel-Routing und dieselbe Reaktions-UX für Exec- und Plugin-Approvals bei, während sich Auth weiterhin nach Approval-Art unterscheiden kann.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte bevorzugt den Capability-Builder verwenden und `approvalCapability` auf dem Plugin bereitstellen.

Für heiße Channel-Entrypoints bevorzugen Sie die schmaleren Runtime-Unterpfade, wenn Sie nur einen Teil dieser Familie benötigen:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Ebenso sollten Sie `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking` bevorzugen, wenn Sie die breitere übergreifende Oberfläche nicht benötigen.

Speziell für Setup:

- `openclaw/plugin-sdk/setup-runtime` deckt die runtime-sicheren Setup-Helfer ab:
  import-sichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist der schmale env-fähige Adapter-Seam
  für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die Setup-Builder für optionale Installationen
  plus einige setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Channel env-gesteuertes Setup oder Auth unterstützt und generische Startup-/Konfigurationsabläufe diese env-Namen kennen sollen, bevor die Runtime geladen wird, deklarieren Sie sie im Plugin-Manifest mit `channelEnvVars`. Behalten Sie Runtime-`envVars` des Channels oder lokale Konstanten nur für operatorseitige Texte.

Wenn Ihr Channel in `status`, `channels list`, `channels status` oder SecretRef-Scans erscheinen kann, bevor die Plugin-Runtime startet, fügen Sie `openclaw.setupEntry` in `package.json` hinzu. Dieser Entrypoint sollte in schreibgeschützten Befehlsabläufen sicher importierbar sein und die Channel-Metadaten, den setup-sicheren Konfigurations-Adapter, den Status-Adapter und die Metadaten der Channel-Secret-Ziele zurückgeben, die für diese Übersichten benötigt werden. Starten Sie aus dem Setup-Entry keine Clients, Listener oder Transport-Runtimes.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie den breiteren `openclaw/plugin-sdk/setup`-Seam nur dann, wenn Sie auch die
  schwereren gemeinsamen Setup-/Konfigurationshelfer benötigen, wie etwa
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Channel nur „installieren Sie zuerst dieses Plugin“ in Setup-Oberflächen bewerben möchte, bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung fail-closed fehl, und er verwendet dieselbe Meldung „Installation erforderlich“ für Validierung, Finalisierung und Docs-Link-Text erneut.

Für andere heiße Channel-Pfade sollten Sie die schmalen Helfer gegenüber breiteren Legacy-Oberflächen bevorzugen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Fallback auf das Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehendes Routing/Envelope und
  Record-and-Dispatch-Wiring
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Matching
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus ausgehende
  Identitäts-/Sende-Delegates und Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route eine explizite
  `replyToId`/`threadId` beibehalten oder die aktuelle `:thread:`-Sitzung
  wiederherstellen soll, nachdem der Basis-Session-Key weiterhin passt.
  Provider-Plugins können Vorrang, Suffix-Verhalten und Thread-ID-Normalisierung
  überschreiben, wenn ihre Plattform native Thread-Zustellsemantik hat.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Thread-Binding-Lifecycle
  und die Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein
  Legacy-Feldlayout für Agent-/Medien-Payloads erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Normalisierung
  benutzerdefinierter Befehle, Validierung von Duplikaten/Konflikten und einen
  fallback-stabilen Command-Config-Contract

Channels nur mit Auth können normalerweise beim Standardpfad stehen bleiben: Core verarbeitet Genehmigungen, und das Plugin stellt nur Outbound-/Auth-Fähigkeiten bereit. Native Approval-Channels wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Helfer verwenden, statt ihren eigenen Approval-Lifecycle zu bauen.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Verarbeitung eingehender Erwähnungen in zwei Ebenen getrennt:

- plugin-eigene Evidenzgewinnung
- gemeinsame Auswertung der Richtlinie

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur dann, wenn Sie das breitere
Helper-Barrel für eingehend benötigen.

Gute Kandidaten für plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung von Zitaten des Bots
- Prüfungen auf Thread-Beteiligung
- Ausschlüsse von Service-/Systemnachrichten
- plattformspezifische Caches, die nötig sind, um Bot-Beteiligung nachzuweisen

Gute Kandidaten für den gemeinsamen Helper:

- `requireMention`
- explizites Erwähnungsergebnis
- Allowlist für implizite Erwähnungen
- Command-Bypass
- endgültige Skip-Entscheidung

Bevorzugter Ablauf:

1. Lokale Erwähnungsfakten berechnen.
2. Diese Fakten an `resolveInboundMentionDecision({ facts, policy })` übergeben.
3. `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und `decision.shouldSkip` in Ihrem eingehenden Gate verwenden.

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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungs-Helper für
gebündelte Channel-Plugins bereit, die bereits von Runtime-Injection abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht verwandter
eingehender Runtime-Helper zu vermeiden.

Die älteren Helper `resolveMentionGating*` bleiben auf
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitäts-Exporte erhalten. Neuer
Code sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Durchgang

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standarddateien des Plugins. Das Feld `channel` in `package.json`
    macht dieses Plugin zu einem Channel-Plugin. Für die vollständige Oberfläche
    der Paketmetadaten siehe [Plugin Setup and Config](/de/plugins/sdk-setup#openclaw-channel):

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
    Das Interface `ChannelPlugin` besitzt viele optionale Adapter-Oberflächen. Beginnen Sie mit
    dem Minimum — `id` und `setup` — und fügen Sie bei Bedarf weitere Adapter hinzu.

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

    <Accordion title="Was `createChatChannelPlugin` für Sie übernimmt">
      Statt Low-Level-Adapter-Interfaces manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Scoped-DM-Sicherheitsauflösung aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Codeaustausch |
      | `threading` | Auflösung des Reply-to-Modus (fest, kontoabhängig oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können statt der deklarativen Optionen auch rohe Adapter-Objekte übergeben,
      wenn Sie die vollständige Kontrolle benötigen.
    </Accordion>

  </Step>

  <Step title="Den Entrypoint verdrahten">
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
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte
    Befehlsregistrierung übernehmen. Behalten Sie `registerFull(...)` für Runtime-only-Arbeit bei.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung nach Registrierungsmodus automatisch. Siehe
    [Entry Points](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Einen Setup-Entry hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies anstelle des vollständigen Entrypoints, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. So wird verhindert, dass während der Setup-Abläufe schwerer
    Runtime-Code geladen wird. Siehe [Setup and Config](/de/plugins/sdk-setup#setup-entry) für Details.

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-Modulen
    aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen
    expliziten setupzeitigen Runtime-Setter benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Inbound-Handler Ihres Channels dispatcht:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-verwaltete Auth (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Inbound-Handler dispatcht die Nachricht an OpenClaw.
          // Die genaue Verdrahtung hängt von Ihrem Plattform-SDK ab —
          // ein echtes Beispiel finden Sie im gebündelten Microsoft Teams- oder Google Chat-Plugin-Paket.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Die Verarbeitung eingehender Nachrichten ist channel-spezifisch. Jedes Channel-Plugin
      besitzt seine eigene Inbound-Pipeline. Schauen Sie sich gebündelte Channel-Plugins an
      (zum Beispiel das Microsoft Teams- oder Google Chat-Plugin-Paket), um echte Muster zu sehen.
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

    Für gemeinsame Test-Helper siehe [Testing](/de/plugins/sdk-testing).

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
    Feste, kontoabhängige oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Message-Tools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Action-Discovery
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Helper" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Seams existieren weiterhin für die Wartung gebündelter Plugins und
zur Kompatibilität. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen Channel-/Setup-/Reply-/Runtime-Unterpfade aus der gemeinsamen SDK-
Oberfläche, sofern Sie nicht direkt diese Familie gebündelter Plugins warten.
</Note>

## Nächste Schritte

- [Provider Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [SDK Testing](/de/plugins/sdk-testing) — Test-Utilities und Contract-Tests
- [Plugin Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema
