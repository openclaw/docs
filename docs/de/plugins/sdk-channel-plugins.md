---
read_when:
    - Sie erstellen ein neues Messaging-Channel-Plugin.
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden.
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen.
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Channel-Plugin für OpenClaw
title: Erstellen von Channel-Plugins
x-i18n:
    generated_at: "2026-04-18T06:12:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3dda53c969bc7356a450c2a5bf49fb82bf1283c23e301dec832d8724b11e724b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Erstellen von Channel-Plugins

Dieser Leitfaden führt Sie durch das Erstellen eines Channel-Plugin, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Channel mit DM-Sicherheit,
Pairing, Reply-Threading und ausgehender Nachrichtenübermittlung.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Getting Started](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Manifest-Einrichtung.
</Info>

## So funktionieren Channel-Plugins

Channel-Plugins benötigen keine eigenen Send/Edit/React-Tools. OpenClaw verwaltet ein
gemeinsam genutztes `message`-Tool im Core. Ihr Plugin besitzt:

- **Konfiguration** — Kontenauflösung und Setup-Assistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Pairing** — DM-Genehmigungsablauf
- **Sitzungsgrammatik** — wie provider-spezifische Konversations-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads eingeordnet werden

Der Core besitzt das gemeinsame Message-Tool, die Prompt-Verdrahtung, die äußere Form des Sitzungsschlüssels,
das generische `:thread:`-Bookkeeping und den Versand.

Wenn Ihr Channel Message-Tool-Parameter hinzufügt, die Medienquellen enthalten, legen Sie diese
Parameternamen über `describeMessageTool(...).mediaSourceParams` offen. Der Core verwendet
diese explizite Liste für die Normalisierung von Sandbox-Pfaden und die Richtlinie für ausgehenden Medienzugriff,
sodass Plugins keine speziellen Shared-Core-Sonderfälle für provider-spezifische
Avatar-, Anhangs- oder Cover-Image-Parameter benötigen.
Geben Sie vorzugsweise eine aktionsbezogene Map zurück wie
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht zusammenhängende Aktionen nicht
die Medienargumente einer anderen Aktion übernehmen. Ein flaches Array funktioniert weiterhin für Parameter, die
absichtlich über jede bereitgestellte Aktion hinweg gemeinsam genutzt werden.

Wenn Ihre Plattform zusätzlichen Scope innerhalb von Konversations-IDs speichert, behalten Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook für die Zuordnung von `rawId` zur Basis-Konversations-ID, optionalen Thread-ID,
expliziten `baseConversationId` und möglichen `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, behalten Sie deren Reihenfolge von
dem engsten Parent bis zur breitesten/Basis-Konversation bei.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Channel-Registry gebootet ist,
können auch eine Top-Level-Datei `session-key-api.ts` mit einem passenden
Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese bootstrap-sichere Oberfläche
nur dann, wenn die Runtime-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
älterer Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich
zur generischen/rohen ID benötigt. Wenn beide Hooks vorhanden sind, verwendet der Core
zuerst `resolveSessionConversation(...).parentConversationCandidates` und greift nur auf
`resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie auslässt.

## Genehmigungen und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen Genehmigungs-spezifischen Code.

- Der Core besitzt dasselbe Chat-`/approve`, gemeinsam genutzte Genehmigungs-Button-Payloads und die generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt auf dem Channel-Plugin, wenn der Channel Genehmigungs-spezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung/Native/Rendering/Auth auf `approvalCapability`.
- `plugin.auth` ist nur für Login/Logout; der Core liest keine Genehmigungs-Auth-Hooks mehr aus diesem Objekt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind der kanonische Seam für Genehmigungs-Authentifizierung.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit der Genehmigungs-Authentifizierung im selben Chat.
- Wenn Ihr Channel native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Zustand der auslösenden Oberfläche/des nativen Clients, wenn dieser sich von der Genehmigungs-Authentifizierung im selben Chat unterscheidet. Der Core verwendet diesen exec-spezifischen Hook, um `enabled` von `disabled` zu unterscheiden, zu entscheiden, ob der auslösende Channel native Exec-Genehmigungen unterstützt, und den Channel in die Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den häufigen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für Channel-spezifisches Payload-Lifecycle-Verhalten wie das Ausblenden doppelter lokaler Genehmigungs-Prompts oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungs-Routing oder die Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.nativeRuntime` für Channel-eigene Fakten zu nativen Genehmigungen. Halten Sie dies auf heißen Channel-Einstiegspunkten lazy mit `createLazyChannelApprovalNativeRuntimeAdapter(...)`, das Ihr Runtime-Modul bei Bedarf importieren kann, während der Core weiterhin den Genehmigungs-Lifecycle zusammensetzen kann.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Channel wirklich benutzerdefinierte Genehmigungs-Payloads anstelle des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Channel in der Antwort für den deaktivierten Pfad die genauen Konfigurationsschalter erklären soll, die nötig sind, um native Exec-Genehmigungen zu aktivieren. Der Hook erhält `{ channel, channelLabel, accountId }`; Channels mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Top-Level-Standards rendern.
- Wenn ein Channel aus vorhandener Konfiguration stabile DM-Identitäten vom Typ Eigentümer ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um dasselbe Chat-`/approve` einzuschränken, ohne Genehmigungs-spezifische Core-Logik hinzuzufügen.
- Wenn ein Channel native Genehmigungszustellung benötigt, konzentrieren Sie den Channel-Code auf Zielnormalisierung sowie Fakten zu Transport/Präsentation. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die Channel-spezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit der Core den Handler zusammensetzen und Anforderungsfilterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise zu anderweitigem Routing verwalten kann. `nativeRuntime` ist in einige kleinere Seams aufgeteilt:
- `availability` — ob das Konto konfiguriert ist und ob eine Anfrage verarbeitet werden soll
- `presentation` — Zuordnung des gemeinsamen Genehmigungs-View-Models zu ausstehenden/aufgelösten/abgelaufenen nativen Payloads oder finalen Aktionen
- `transport` — Vorbereitung von Zielen sowie Senden/Aktualisieren/Löschen nativer Genehmigungsnachrichten
- `interactions` — optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Buttons oder Reaktionen
- `observe` — optionale Hooks für Zustellungsdiagnostik
- Wenn der Channel Runtime-eigene Objekte wie einen Client, Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie diese über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry ermöglicht es dem Core, fähigkeitsgesteuerte Handler aus dem Channel-Startzustand zu bootstrappen, ohne Genehmigungs-spezifischen Wrapper-Glue hinzuzufügen.
- Greifen Sie nur auf das Low-Level-`createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime` zurück, wenn der fähigkeitsgesteuerte Seam noch nicht ausdrucksstark genug ist.
- Native Genehmigungs-Channels müssen sowohl `accountId` als auch `approvalKind` durch diese Helfer leiten. `accountId` hält Richtlinien für Multi-Account-Genehmigungen auf das richtige Bot-Konto beschränkt, und `approvalKind` hält Exec- gegenüber Plugin-Genehmigungsverhalten für den Channel verfügbar, ohne hartcodierte Verzweigungen im Core.
- Der Core besitzt jetzt auch Hinweise zur Umleitung von Genehmigungen. Channel-Plugins sollten keine eigenen Folge-Nachrichten wie „Genehmigung ging an DMs / einen anderen Channel“ aus `createChannelNativeApprovalRuntime` senden; stattdessen sollten sie korrektes Routing für Ursprung + DM des Genehmigenden über die gemeinsamen Helfer für Genehmigungs-Fähigkeiten bereitstellen, und der Core sollte tatsächliche Zustellungen aggregieren, bevor irgendein Hinweis an den auslösenden Chat zurückgesendet wird.
- Bewahren Sie den Typ der zugestellten Genehmigungs-ID End-to-End. Native Clients sollten Exec- versus Plugin-Genehmigungs-Routing nicht
  aus Channel-lokalem Zustand erraten oder umschreiben.
- Verschiedene Genehmigungsarten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungs-Routing sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Channel-Routing und dieselbe Reaktions-UX für Exec-
    und Plugin-Genehmigungen bei und erlaubt dennoch, dass sich Auth je nach Genehmigungsart unterscheiden kann.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` auf dem Plugin bereitstellen.

Für heiße Channel-Einstiegspunkte bevorzugen Sie die schmaleren Runtime-Subpfade, wenn Sie nur
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
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere
übergreifende Oberfläche nicht benötigen.

Speziell für Setup:

- `openclaw/plugin-sdk/setup-runtime` deckt die Runtime-sicheren Setup-Helfer ab:
  import-sichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe für Lookup-Hinweise,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist der schmale umgebungsbewusste Adapter-
  Seam für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die Setup-Builder für optionale Installation
  plus einige Setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Channel env-gesteuertes Setup oder Auth unterstützt und generische Start-/Konfigurationsabläufe
diese Env-Namen kennen sollen, bevor die Runtime geladen wird, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Channel-Runtime-`envVars` oder lokale
Konstanten nur für operatorseitigen Text.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie den breiteren Seam `openclaw/plugin-sdk/setup` nur dann, wenn Sie außerdem die
  schwergewichtigeren gemeinsam genutzten Setup-/Konfigurations-Helfer benötigen wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Channel in Setup-Oberflächen nur „dieses Plugin zuerst installieren“ bewerben möchte,
bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung geschlossen fehl, und sie verwenden
dieselbe Meldung „Installation erforderlich“ über Validierung, Finalisierung und Texte mit Docs-Link hinweg.

Für andere heiße Channel-Pfade bevorzugen Sie die schmalen Helfer gegenüber breiteren älteren
Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Standardkonto-Fallback
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für Verdrahtung von eingehender Route/Envelope
  und Record-and-Dispatch
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Matching
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus Delegates für ausgehende
  Identität/Senden
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Thread-Binding-Lifecycle
  und die Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein älteres Feldlayout für Agent-/Medien-Payloads erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Normalisierung benutzerdefinierter Befehle, Validierung von Duplikaten/Konflikten und einen fallback-stabilen Vertrag für Befehlskonfiguration

Channels mit nur Auth können in der Regel beim Standardpfad bleiben: Der Core verarbeitet Genehmigungen, und das Plugin stellt lediglich Ausgehend-/Auth-Fähigkeiten bereit. Native Genehmigungs-Channels wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Helfer verwenden, statt ihren eigenen Genehmigungs-Lifecycle zu implementieren.

## Richtlinie für eingehende Erwähnungen

Behalten Sie die Verarbeitung eingehender Erwähnungen in zwei Schichten getrennt:

- plugin-eigene Ermittlung von Nachweisen
- gemeinsame Auswertung der Richtlinie

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur dann, wenn Sie die breitere
Helper-Barrel für eingehende Verarbeitung benötigen.

Gute Kandidaten für plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung von Zitaten des Bots
- Prüfungen auf Thread-Beteiligung
- Ausschlüsse von Service-/Systemnachrichten
- plattformnative Caches, die zur Bestätigung der Bot-Beteiligung benötigt werden

Gute Kandidaten für den gemeinsamen Helfer:

- `requireMention`
- explizites Erwähnungsergebnis
- Allowlist für implizite Erwähnungen
- Umgehung für Befehle
- endgültige Überspring-Entscheidung

Bevorzugter Ablauf:

1. Lokale Fakten zur Erwähnung berechnen.
2. Diese Fakten an `resolveInboundMentionDecision({ facts, policy })` übergeben.
3. `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und `decision.shouldSkip` in Ihrem Inbound-Gate verwenden.

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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Helfer für Erwähnungen für
gebündelte Channel-Plugins bereit, die bereits von Runtime-Injektion abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht zusammenhängender
Runtime-Helfer für eingehende Verarbeitung zu vermeiden.

Die älteren Helfer `resolveMentionGating*` bleiben auf
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitätsexporte erhalten. Neuer Code
sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standarddateien für das Plugin. Das Feld `channel` in `package.json`
    macht daraus ein Channel-Plugin. Die vollständige Oberfläche für Paketmetadaten finden Sie
    unter [Plugin Setup and Config](/de/plugins/sdk-setup#openclaw-channel):

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
    Die Schnittstelle `ChannelPlugin` hat viele optionale Adapter-Oberflächen. Beginnen Sie mit
    dem Minimum — `id` und `setup` — und fügen Sie Adapter nach Bedarf hinzu.

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

      // DM-Sicherheit: wer dem Bot Nachrichten senden darf
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: Genehmigungsablauf für neue DM-Kontakte
      pairing: {
        text: {
          idLabel: "Acme Chat-Benutzername",
          message: "Senden Sie diesen Code, um Ihre Identität zu bestätigen:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: wie Antworten zugestellt werden
      threading: { topLevelReplyToMode: "reply" },

      // Ausgehend: Nachrichten an die Plattform senden
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

    <Accordion title="Was createChatChannelPlugin für Sie erledigt">
      Anstatt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Bereichsbezogener DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Codeaustausch |
      | `threading` | Resolver für Reply-to-Modus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können auch rohe Adapter-Objekte statt deklarativer Optionen übergeben,
      wenn Sie die vollständige Kontrolle benötigen.
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

    Legen Sie CLI-Deskriptoren, die dem Channel gehören, in `registerCliMetadata(...)` ab, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Runtime zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Befehls-
    Registrierung übernehmen. Behalten Sie `registerFull(...)` für Arbeiten nur zur Runtime.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und
    werden immer zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung nach Registrierungsmodus automatisch. Siehe
    [Entry Points](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Einen Setup-Einstieg hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt diesen Einstiegspunkt anstelle des vollständigen Entry, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. So wird vermieden, während Setup-Abläufen schweren Runtime-Code nachzuladen.
    Siehe [Setup and Config](/de/plugins/sdk-setup#setup-entry) für Details.

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-
    Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem
    einen expliziten Runtime-Setter zur Setup-Zeit benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie durch den Inbound-Handler Ihres Channels weiterleitet:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // vom Plugin verwaltete Auth (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Inbound-Handler leitet die Nachricht an OpenClaw weiter.
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
      Die Verarbeitung eingehender Nachrichten ist channelspezifisch. Jedes Channel-Plugin besitzt
      seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Channel-Plugins an
      (zum Beispiel das Microsoft Teams- oder Google Chat-Plugin-Paket) für reale Muster.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie colocated Tests in `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("löst das Konto aus der Konfiguration auf", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("prüft das Konto, ohne Geheimnisse zu materialisieren", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("meldet fehlende Konfiguration", () => {
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
    └── runtime.ts            # Runtime-Speicher (falls erforderlich)
```

## Erweiterte Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Fest, kontobezogen oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Message-Tools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Aktions-Erkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Helper" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Seams existieren weiterhin für die Pflege gebündelter Plugins und
aus Kompatibilitätsgründen. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen Subpfade channel/setup/reply/runtime aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie pflegen direkt diese Familie gebündelter Plugins.
</Note>

## Nächste Schritte

- [Provider Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Importe
- [SDK Testing](/de/plugins/sdk-testing) — Test-Utilities und Vertragstests
- [Plugin Manifest](/de/plugins/manifest) — vollständiges Manifestschema
