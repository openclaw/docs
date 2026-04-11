---
read_when:
    - Sie erstellen ein neues Messaging-Kanal-Plugin.
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden.
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen.
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Erstellen von Kanal-Plugins
x-i18n:
    generated_at: "2026-04-11T02:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a026e924f9ae8a3ddd46287674443bcfccb0247be504261522b078e1f440aef
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Erstellen von Kanal-Plugins

Diese Anleitung führt Sie durch das Erstellen eines Kanal-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Kanal mit DM-Sicherheit,
Pairing, Antwort-Threading und ausgehenden Nachrichten.

<Info>
  Wenn Sie noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Getting Started](/de/plugins/building-plugins) für die grundlegende Paket-
  struktur und Manifest-Einrichtung.
</Info>

## So funktionieren Kanal-Plugins

Kanal-Plugins benötigen keine eigenen Tools zum Senden/Bearbeiten/Reagieren. OpenClaw behält ein
gemeinsames `message`-Tool im Core. Ihr Plugin besitzt:

- **Konfiguration** — Kontenauflösung und Einrichtungsassistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Pairing** — DM-Genehmigungsablauf
- **Sitzungsgrammatik** — wie anbieterspezifische Gesprächs-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden

Der Core besitzt das gemeinsame Message-Tool, die Prompt-Verdrahtung, die äußere Sitzungs-
schlüsselform, generische `:thread:`-Buchführung und Dispatch.

Wenn Ihre Plattform zusätzlichen Geltungsbereich in Gesprächs-IDs speichert, behalten Sie dieses Parsen
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook zum Zuordnen von `rawId` zur Basis-Gesprächs-ID, optionalen Thread-
ID, expliziten `baseConversationId` und beliebigen `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie diese von
dem engsten Parent bis zum breitesten/Basis-Gespräch sortiert.

Gebündelte Plugins, die dasselbe Parsen benötigen, bevor die Kanalregistrierung startet,
können außerdem eine Datei `session-key-api.ts` der obersten Ebene mit einem passenden
Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese bootstrap-sichere Oberfläche
nur dann, wenn die Laufzeit-Plugin-Registrierung noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich
zur generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet der Core
zuerst `resolveSessionConversation(...).parentConversationCandidates` und fällt nur
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie weglässt.

## Genehmigungen und Kanalfähigkeiten

Die meisten Kanal-Plugins benötigen keinen genehmigungsspezifischen Code.

- Der Core besitzt dasselbe Chat-`/approve`, gemeinsame Payloads für Genehmigungsschaltflächen und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes Objekt `approvalCapability` im Kanal-Plugin, wenn der Kanal genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung/nativem Verhalten/Rendering/Auth unter `approvalCapability` ab.
- `plugin.auth` ist nur für Login/Logout; der Core liest Genehmigungs-Auth-Hooks nicht mehr aus diesem Objekt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Nahtstelle für Genehmigungs-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit der Genehmigungs-Auth im selben Chat.
- Wenn Ihr Kanal native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Zustand von auslösender Oberfläche/nativem Client, wenn er sich von der Genehmigungs-Auth im selben Chat unterscheidet. Der Core verwendet diesen Exec-spezifischen Hook, um zwischen `enabled` und `disabled` zu unterscheiden, zu entscheiden, ob der auslösende Kanal native Exec-Genehmigungen unterstützt, und den Kanal in die Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den üblichen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für kanalspezifisches Payload-Lebenszyklusverhalten, etwa zum Ausblenden doppelter lokaler Genehmigungs-Prompts oder zum Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.nativeRuntime` für kanaleigene Fakten zu nativen Genehmigungen. Halten Sie es auf häufig genutzten Kanal-Einstiegspunkten lazy mit `createLazyChannelApprovalNativeRuntimeAdapter(...)`, das Ihr Laufzeitmodul bei Bedarf importieren kann, während der Core weiterhin den Lebenszyklus der Genehmigung zusammensetzen kann.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Kanal wirklich benutzerdefinierte Genehmigungs-Payloads statt des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Kanal möchte, dass die Antwort im deaktivierten Pfad die genauen Konfigurationsoptionen erklärt, die zum Aktivieren nativer Exec-Genehmigungen erforderlich sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Kanäle mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Standardwerte auf oberster Ebene rendern.
- Wenn ein Kanal aus bestehender Konfiguration stabile DM-Identitäten mit Besitzercharakter ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um dasselbe Chat-`/approve` einzuschränken, ohne genehmigungsspezifische Core-Logik hinzuzufügen.
- Wenn ein Kanal native Genehmigungszustellung benötigt, konzentrieren Sie den Kanalcode auf Zielnormalisierung sowie Transport-/Präsentationsfakten. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die kanalspezifischen Fakten hinter `approvalCapability.nativeRuntime` ab, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit der Core den Handler zusammensetzen und Anforderungsfilterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise zu anderweitiger Zustellung besitzen kann. `nativeRuntime` ist in einige kleinere Nahtstellen aufgeteilt:
- `availability` — ob das Konto konfiguriert ist und ob eine Anfrage verarbeitet werden sollte
- `presentation` — Zuordnung des gemeinsamen View-Modells für Genehmigungen zu nativen Payloads oder finalen Aktionen für ausstehend/aufgelöst/abgelaufen
- `transport` — Vorbereiten von Zielen sowie Senden/Aktualisieren/Löschen nativer Genehmigungsnachrichten
- `interactions` — optionale Hooks zum Binden/Lösen/Löschen von Aktionen für native Schaltflächen oder Reaktionen
- `observe` — optionale Hooks für Zustellungsdiagnostik
- Wenn der Kanal laufzeitbezogene Objekte wie einen Client, Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie sie über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Laufzeitkontext-Registry erlaubt es dem Core, fähigkeitsgesteuerte Handler aus dem Kanalstartzustand zu bootstrappen, ohne genehmigungsspezifischen Wrapper-Kleber hinzuzufügen.
- Greifen Sie nur dann zu dem Low-Level-`createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die fähigkeitsgesteuerte Nahtstelle noch nicht ausdrucksstark genug ist.
- Native Genehmigungskanäle müssen sowohl `accountId` als auch `approvalKind` durch diese Helfer routen. `accountId` hält die Richtlinie für Genehmigungen bei mehreren Konten auf das richtige Bot-Konto begrenzt, und `approvalKind` hält Exec- gegenüber Plugin-Genehmigungsverhalten für den Kanal verfügbar, ohne fest kodierte Verzweigungen im Core.
- Der Core besitzt jetzt auch Hinweise zur Umleitung von Genehmigungen. Kanal-Plugins sollten keine eigenen Follow-up-Nachrichten wie „Genehmigung ging an DMs / einen anderen Kanal“ aus `createChannelNativeApprovalRuntime` senden; stattdessen sollten Sie korrektes Ursprungs- + Approver-DM-Routing über die gemeinsamen Helfer für Genehmigungsfähigkeiten bereitstellen und den Core die tatsächlichen Zustellungen aggregieren lassen, bevor Hinweise in den auslösenden Chat gepostet werden.
- Bewahren Sie die Art der zugestellten Genehmigungs-ID Ende-zu-Ende. Native Clients sollten Exec- gegenüber Plugin-Genehmigungsrouting nicht aus kanallokalem Zustand erraten oder umschreiben.
- Unterschiedliche Arten von Genehmigungen können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Kanalrouting und dieselbe Reaktions-UX für Exec- und Plugin-Genehmigungen bei, lässt aber Auth weiterhin je nach Genehmigungsart unterschiedlich sein.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` im Plugin bereitstellen.

Für häufig genutzte Kanal-Einstiegspunkte bevorzugen Sie die engeren Laufzeit-Subpfade, wenn Sie nur
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
Dachoberfläche nicht benötigen.

Speziell für Setup:

- `openclaw/plugin-sdk/setup-runtime` deckt die laufzeitsicheren Setup-Helfer ab:
  importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die schmale umgebungsbewusste Adapter-
  Nahtstelle für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die Setup-Builder für optionale Installation
  plus einige setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Kanal umgebungsgetriebenes Setup oder Auth unterstützt und generische Start-/Konfigurationsabläufe
diese Umgebungsnamen kennen sollen, bevor die Laufzeit geladen wird, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Laufzeit-`envVars` des Kanals oder lokale
Konstanten nur für operatorgerichtete Texte.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere Nahtstelle `openclaw/plugin-sdk/setup` nur dann, wenn Sie auch die
  schwereren gemeinsamen Setup-/Konfigurationshelfer benötigen wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Kanal in Setup-Oberflächen nur „installieren Sie zuerst dieses Plugin“ bewerben möchte, bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung geschlossen fehl und verwendet
dieselbe Meldung „Installation erforderlich“ für Validierung, Finalisierung und Text mit Docs-Link wieder.

Für andere häufig genutzte Kanalpfade bevorzugen Sie die schmalen Helfer gegenüber breiteren Legacy-
Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Konfiguration mit mehreren Konten und
  Fallback auf Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für Verdrahtung von eingehender Route/Umschlag sowie
  Aufzeichnen-und-Dispatch
- `openclaw/plugin-sdk/messaging-targets` für Zielparsen/-abgleich
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus Delegates für ausgehende
  Identität/Senden
- `openclaw/plugin-sdk/thread-bindings-runtime` für Lebenszyklus von Thread-Bindings
  und Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein Legacy-Feldlayout
  für Agent-/Medien-Payload erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Normalisierung benutzerdefinierter Befehle,
  Validierung von Duplikaten/Konflikten und einen fallback-stabilen Vertrag für
  Befehlskonfiguration

Kanäle nur mit Auth können meist beim Standardpfad aufhören: Der Core verarbeitet Genehmigungen und das Plugin stellt nur Fähigkeiten für ausgehend/Auth bereit. Native Genehmigungskanäle wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Helfer nutzen, statt ihren eigenen Genehmigungslebenszyklus zu entwickeln.

## Richtlinie für eingehende Erwähnungen

Behalten Sie die Verarbeitung eingehender Erwähnungen in zwei Ebenen aufgeteilt:

- plugin-eigene Evidenzsammlung
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-inbound` für die gemeinsame Ebene.

Gut passend für plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung zitierter Bot-Nachrichten
- Prüfungen zur Thread-Beteiligung
- Ausschlüsse für Service-/Systemnachrichten
- plattformspezifische native Caches, die zur Bestätigung der Bot-Beteiligung benötigt werden

Gut passend für den gemeinsamen Helfer:

- `requireMention`
- explizites Erwähnungsergebnis
- Allowlist für implizite Erwähnungen
- Befehl-Bypass
- endgültige Überspringen-Entscheidung

Bevorzugter Ablauf:

1. Lokale Erwähnungsfakten berechnen.
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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungshelfer für
gebündelte Kanal-Plugins bereit, die bereits von Laufzeitinjektion abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Die älteren Helfer `resolveMentionGating*` bleiben unter
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitätsexporte bestehen. Neuer Code
sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Schritt-für-Schritt

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json` ist
    das, was dies zu einem Kanal-Plugin macht. Für die vollständige Oberfläche der Paketmetadaten
    siehe [Plugin Setup and Config](/de/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Verbinden Sie OpenClaw mit Acme Chat."
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
      "description": "Acme-Chat-Kanal-Plugin",
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

  <Step title="Das Kanal-Plugin-Objekt erstellen">
    Das Interface `ChannelPlugin` hat viele optionale Adapter-Oberflächen. Beginnen Sie mit
    dem Minimum — `id` und `setup` — und fügen Sie Adapter nach Bedarf hinzu.

    Erstellen Sie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // Ihre Plattform-API-Client

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

      // DM-Sicherheit: wer dem Bot Nachrichten senden kann
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
          idLabel: "Acme-Chat-Benutzername",
          message: "Senden Sie diesen Code, um Ihre Identität zu verifizieren:",
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
      Anstatt Low-Level-Adapter-Interfaces manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Auf Konfigurationsfeldern basierender Resolver für bereichsbezogene DM-Sicherheit |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Codeaustausch |
      | `threading` | Resolver für den Antwortmodus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können auch rohe Adapter-Objekte statt der deklarativen Optionen übergeben,
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

    Platzieren Sie kanaleigene CLI-Deskriptoren in `registerCliMetadata(...)`, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Kanallaufzeit zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Befehls-
    registrierung übernehmen. Behalten Sie `registerFull(...)` für reine Laufzeitarbeit.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung nach Registrierungsmodus automatisch. Siehe
    [Entry Points](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Einen Setup-Eintrag hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies statt des vollständigen Eintrags, wenn der Kanal deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, während Setup-Abläufen schweren Laufzeitcode zu laden.
    Siehe [Setup and Config](/de/plugins/sdk-setup#setup-entry) für Details.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Inbound-Handler Ihres Kanals weiterleitet:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-verwaltete Authentifizierung (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Inbound-Handler leitet die Nachricht an OpenClaw weiter.
          // Die genaue Verdrahtung hängt von Ihrem Plattform-SDK ab —
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
      seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Kanal-Plugins
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

    Gemeinsame Testhelfer finden Sie unter [Testing](/de/plugins/sdk-testing).

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
├── runtime-api.ts            # Interne Laufzeit-Exporte (optional)
└── src/
    ├── channel.ts            # ChannelPlugin über createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Plattform-API-Client
    └── runtime.ts            # Laufzeitspeicher (falls benötigt)
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
  <Card title="Laufzeit-Helfer" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Hilfs-Nahtstellen existieren weiterhin für die Wartung gebündelter Plugins und
Kompatibilität. Sie sind nicht das empfohlene Muster für neue Kanal-Plugins;
bevorzugen Sie die generischen Subpfade für Kanal/Setup/Antwort/Laufzeit aus der gemeinsamen SDK-
Oberfläche, sofern Sie nicht direkt diese gebündelte Plugin-Familie warten.
</Note>

## Nächste Schritte

- [Provider Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Importe
- [SDK Testing](/de/plugins/sdk-testing) — Testdienstprogramme und Vertragstests
- [Plugin Manifest](/de/plugins/manifest) — vollständiges Manifestschema
