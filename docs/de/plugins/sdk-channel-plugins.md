---
read_when:
    - Sie erstellen ein neues Messaging-Kanal-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Kanal-Plugins erstellen
x-i18n:
    generated_at: "2026-04-25T13:52:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Diese Anleitung führt Sie durch das Erstellen eines Kanal-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Kanal mit DM-Sicherheit,
Kopplung, Antwort-Threading und ausgehenden Nachrichten.

<Info>
  Wenn Sie noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Getting Started](/de/plugins/building-plugins) für die grundlegende Paket-
  Struktur und die Einrichtung des Manifests.
</Info>

## So funktionieren Kanal-Plugins

Kanal-Plugins benötigen keine eigenen Send/Edit/React-Tools. OpenClaw behält ein
gemeinsames `message`-Tool im Core. Ihr Plugin verwaltet:

- **Konfiguration** — Kontoauflösung und Setup-Assistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Kopplung** — Freigabefluss für DMs
- **Sitzungsgrammatik** — wie providerspezifische Gesprächs-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden
- **Heartbeat-Typing** — optionale Typing-/Busy-Signale für Heartbeat-Zustellziele

Der Core verwaltet das gemeinsame Nachrichtentool, die Prompt-Verdrahtung, die äußere Form des Sitzungsschlüssels,
die generische Buchführung von `:thread:` und die Dispatch.

Wenn Ihr Kanal Tippindikatoren außerhalb eingehender Antworten unterstützt,
stellen Sie `heartbeat.sendTyping(...)` auf dem Kanal-Plugin bereit. Der Core ruft
es mit dem aufgelösten Heartbeat-Zustellziel auf, bevor der Heartbeat-Modelllauf startet, und
verwendet den gemeinsamen Lebenszyklus für Typing-Keepalive/Bereinigung. Fügen Sie `heartbeat.clearTyping(...)`
hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

Wenn Ihr Kanal Parameter zum Nachrichtentool hinzufügt, die Medienquellen enthalten,
stellen Sie diese Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit.
Der Core verwendet diese explizite Liste für die Pfadnormalisierung in der Sandbox und für die Richtlinie zum Zugriff auf ausgehende Medien, sodass Plugins keine Sonderfälle im gemeinsamen Core für providerspezifische Avatar-, Anhangs- oder Cover-Image-Parameter benötigen.
Geben Sie bevorzugt eine aktionsbezogene Map zurück, etwa
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, sodass nicht zusammenhängende Aktionen nicht
die Medienargumente einer anderen Aktion erben. Ein flaches Array funktioniert weiterhin für Parameter, die absichtlich über alle exponierten Aktionen hinweg gemeinsam verwendet werden.

Wenn Ihre Plattform zusätzlichen Scope in Gesprächs-IDs speichert, belassen Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Dies ist der
kanonische Hook für die Abbildung von `rawId` auf die Basis-Gesprächs-ID, optionale Thread-
ID, explizite `baseConversationId` und etwaige `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie diese Reihenfolge von
dem engsten Parent bis zum breitesten/Basis-Gespräch ein.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor das Kanal-Registry gestartet ist,
können auch eine Top-Level-Datei `session-key-api.ts` mit einem passenden
Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese bootstrap-sichere Oberfläche
nur, wenn das Plugin-Registry zur Laufzeit noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
veralteter Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich
zur generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet der Core
zuerst `resolveSessionConversation(...).parentConversationCandidates` und greift nur
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie auslässt.

## Genehmigungen und Kanal-Fähigkeiten

Die meisten Kanal-Plugins benötigen keinen kanalspezifischen Code für Genehmigungen.

- Der Core verwaltet same-chat `/approve`, gemeinsame Payloads für Genehmigungs-Buttons und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes Objekt `approvalCapability` auf dem Kanal-Plugin, wenn der Kanal genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` ist entfernt. Legen Sie Fakten zu Genehmigungszustellung/nativem Verhalten/Rendering/Auth in `approvalCapability` ab.
- `plugin.auth` ist nur für login/logout; der Core liest keine Auth-Hooks für Genehmigungen mehr aus diesem Objekt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Nahtstelle für Genehmigungs-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit der Authentifizierung für Genehmigungen im selben Chat.
- Wenn Ihr Kanal native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Zustand der auslösenden Oberfläche/des nativen Clients, wenn er sich von der Authentifizierung für Genehmigungen im selben Chat unterscheidet. Der Core verwendet diesen exec-spezifischen Hook, um zwischen `enabled` und `disabled` zu unterscheiden, zu entscheiden, ob der auslösende Kanal native Exec-Genehmigungen unterstützt, und den Kanal in Hinweise zum Fallback für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den häufigen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für kanalspezifisches Verhalten im Payload-Lebenszyklus, etwa das Ausblenden doppelter lokaler Genehmigungs-Prompts oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungs-Routing oder die Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.nativeRuntime` für kanalverwaltete Fakten zu nativen Genehmigungen. Halten Sie es an heißen Kanal-Entrypoints lazy mit `createLazyChannelApprovalNativeRuntimeAdapter(...)`, das Ihr Laufzeitmodul bei Bedarf importieren kann, während der Core dennoch den Genehmigungslebenszyklus zusammensetzen kann.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Kanal wirklich benutzerdefinierte Payloads für Genehmigungen anstelle des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Kanal möchte, dass die Antwort im deaktivierten Pfad die genauen Konfigurationsschalter erläutert, die zum Aktivieren nativer Exec-Genehmigungen benötigt werden. Der Hook erhält `{ channel, channelLabel, accountId }`; Kanäle mit benannten Konten sollen kontoabhängige Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Top-Level-Standards darstellen.
- Wenn ein Kanal aus bestehender Konfiguration stabile DM-Identitäten ähnlich einem Eigentümer ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne genehmigungsspezifische Core-Logik hinzuzufügen.
- Wenn ein Kanal native Genehmigungszustellung benötigt, konzentrieren Sie den Kanalcode auf Zielnormalisierung sowie Fakten zu Transport/Darstellung. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Platzieren Sie die kanalspezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sodass der Core den Handler zusammensetzen und Request-Filterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise „anderswo geroutet“ verwalten kann. `nativeRuntime` ist in einige kleinere Nahtstellen aufgeteilt:
- `availability` — ob das Konto konfiguriert ist und ob eine Anfrage verarbeitet werden soll
- `presentation` — das gemeinsame View-Model für Genehmigungen auf ausstehende/aufgelöste/abgelaufene native Payloads oder finale Aktionen abbilden
- `transport` — Ziele vorbereiten sowie native Genehmigungsnachrichten senden/aktualisieren/löschen
- `interactions` — optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Buttons oder Reaktionen
- `observe` — optionale Diagnostik-Hooks für die Zustellung
- Wenn der Kanal laufzeitverwaltete Objekte wie einen Client, ein Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie diese über `openclaw/plugin-sdk/channel-runtime-context`. Das generische Laufzeitkontext-Registry ermöglicht dem Core, handler mit fähigkeitsgesteuertem Verhalten aus dem Startup-Zustand des Kanals zu bootstrappen, ohne genehmigungsspezifischen Wrapper-Code hinzuzufügen.
- Greifen Sie nur dann zu den Low-Level-Funktionen `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die fähigkeitsgesteuerte Nahtstelle noch nicht ausdrucksstark genug ist.
- Kanäle mit nativen Genehmigungen müssen sowohl `accountId` als auch `approvalKind` durch diese Helper routen. `accountId` hält die Richtlinie für Genehmigungen bei mehreren Konten auf das richtige Bot-Konto begrenzt, und `approvalKind` hält das Verhalten für Exec- vs. Plugin-Genehmigungen für den Kanal verfügbar, ohne hartcodierte Verzweigungen im Core.
- Der Core verwaltet jetzt auch Hinweise zum Umrouten von Genehmigungen. Kanal-Plugins sollen aus `createChannelNativeApprovalRuntime` keine eigenen Folge-Nachrichten wie „Genehmigung ging an DMs / einen anderen Kanal“ senden; stattdessen exaktes Routing von Ursprung + Approver-DM über die gemeinsamen Helper für Genehmigungs-Fähigkeiten exponieren und den Core die tatsächlichen Zustellungen aggregieren lassen, bevor Hinweise zurück in den auslösenden Chat gepostet werden.
- Die Art der zugestellten Genehmigungs-ID durchgängig beibehalten. Native Clients sollen Exec- vs. Plugin-Genehmigungsrouting nicht
  aus kanal lokalem Zustand erraten oder umschreiben.
- Unterschiedliche Arten von Genehmigungen können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix hält dasselbe native DM-/Kanal-Routing und dieselbe Reaktions-UX für Exec-
    und Plugin-Genehmigungen bereit, während sich Auth je nach Art der Genehmigung unterscheiden darf.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` im Plugin bereitstellen.

Für heiße Kanal-Entrypoints bevorzugen Sie die schmaleren Laufzeit-Subpfade, wenn Sie nur
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
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere Umbrella-
Oberfläche nicht benötigen.

Speziell für Setup:

- `openclaw/plugin-sdk/setup-runtime` deckt die laufzeitsicheren Setup-Helper ab:
  import-sichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Builder für Setup-Proxys
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die schmale env-bewusste Adapter-
  Nahtstelle für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die Builder für optional installierbares Setup
  plus einige setupsichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Kanal env-gesteuertes Setup oder Auth unterstützt und generische Startup-/Konfigurations-
Flows diese Env-Namen kennen sollen, bevor die Laufzeit geladen wird, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Env-Variablen der Kanal-Laufzeit `envVars` oder lokale
Konstanten nur für operatorseitige Texte.

Wenn Ihr Kanal in `status`, `channels list`, `channels status` oder SecretRef-Scans erscheinen kann,
bevor die Plugin-Laufzeit startet, fügen Sie `openclaw.setupEntry` in `package.json` hinzu. Dieser Entry-Point soll sicher in schreibgeschützten Befehls-Pfaden importiert werden können und die Kanal-Metadaten, den setupsicheren Konfigurations-Adapter, den Status-Adapter und die Metadaten für geheime Kanalziele zurückgeben, die für diese Zusammenfassungen benötigt werden. Starten Sie aus dem Setup-Entry keine Clients, Listener oder Transport-Laufzeiten.

Halten Sie auch den Importpfad des Haupt-Kanal-Entry schmal. Discovery kann den Entry und das Kanal-Plugin-Modul auswerten, um Fähigkeiten zu registrieren, ohne den Kanal zu aktivieren. Dateien wie `channel-plugin-api.ts` sollen das Kanal-Plugin-Objekt exportieren, ohne Setup-Assistenten, Transport-Clients, Socket-Listener, Launcher für Unterprozesse oder Module für den Start von Diensten zu importieren. Legen Sie diese Laufzeitteile in Module, die aus `registerFull(...)`, Laufzeit-Settern oder lazy Capability-Adaptern geladen werden.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere Nahtstelle `openclaw/plugin-sdk/setup` nur dann, wenn Sie außerdem die
  schwereren gemeinsam genutzten Setup-/Konfigurations-Helper benötigen, etwa
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Kanal in Setup-Oberflächen nur „dieses Plugin zuerst installieren“ bewerben soll,
bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der erzeugte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung fail-closed fehl und verwendet
dieselbe Meldung „Installation erforderlich“ für Validierung, Finalisierung und
Text mit Docs-Link erneut.

Für andere heiße Kanalpfade bevorzugen Sie die schmalen Helper gegenüber breiteren veralteten
Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Fallback auf das Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für Routing/Umschlag eingehender Nachrichten und
  Verdrahtung von Record-and-Dispatch
- `openclaw/plugin-sdk/messaging-targets` für Parsing/Matching von Zielen
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus ausgehende
  Delegates für Identität/Senden und Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route ein
  explizites `replyToId`/`threadId` erhalten oder die aktuelle `:thread:`-Sitzung
  wiederherstellen soll, nachdem der Basis-Sitzungsschlüssel weiterhin passt.
  Provider-Plugins können Priorität, Suffix-Verhalten und Normalisierung der Thread-ID überschreiben, wenn ihre Plattform native Thread-Zustellsemantik hat.
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von Thread-Bindings
  und die Registrierung von Adaptern
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn noch ein veraltetes Feldlayout
  für Agent-/Medien-Payloads erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Normalisierung benutzerdefinierter Telegram-Befehle,
  Validierung von Duplikaten/Konflikten und einen fallback-stabilen Vertrag für die Befehls-
  Konfiguration

Kanäle nur mit Auth können meist beim Standardpfad stehen bleiben: Der Core verwaltet Genehmigungen, und das Plugin exponiert nur Outbound-/Auth-Fähigkeiten. Kanäle mit nativen Genehmigungen wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Helper verwenden, statt ihren eigenen Lebenszyklus für Genehmigungen zu bauen.

## Richtlinie für eingehende Erwähnungen

Die Behandlung eingehender Erwähnungen weiterhin in zwei Schichten aufteilen:

- pluginverwaltete Erfassung von Evidenz
- gemeinsame Auswertung der Richtlinie

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur dann, wenn Sie die breitere
Helper-Sammeloberfläche für eingehende Nachrichten benötigen.

Gute Kandidaten für pluginlokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung von Zitaten des Bots
- Prüfungen auf Beteiligung in Threads
- Ausschlüsse von Service-/Systemnachrichten
- plattformnative Caches, die nötig sind, um die Beteiligung des Bots nachzuweisen

Gute Kandidaten für den gemeinsamen Helper:

- `requireMention`
- explizites Ergebnis einer Erwähnung
- Allowlist für implizite Erwähnungen
- Umgehung für Befehle
- endgültige Entscheidung zum Überspringen

Bevorzugter Ablauf:

1. Lokale Fakten zu Erwähnungen berechnen.
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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Helper für Erwähnungen für
gebündelte Kanal-Plugins bereit, die bereits von Runtime-Injection abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie diese aus
`openclaw/plugin-sdk/channel-mention-gating`, um keine nicht zusammenhängenden Inbound-
Runtime-Helper zu laden.

Die älteren Helper `resolveMentionGating*` bleiben auf
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitäts-Exporte bestehen. Neuer Code
soll `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Walkthrough

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standarddateien des Plugins. Das Feld `channel` in `package.json`
    macht dies zu einem Kanal-Plugin. Die vollständige Oberfläche der Paket-Metadaten
    finden Sie unter [Plugin Setup and Config](/de/plugins/sdk-setup#openclaw-channel):

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
    pluginverwaltete Einstellungen, die nicht zur Kanal-Kontokonfiguration gehören. `channelConfigs`
    validiert `channels.acme-chat` und ist die Quelle im Cold-Path, die von Konfigurations-
    Schema, Setup und UI-Oberflächen verwendet wird, bevor die Plugin-Laufzeit geladen wird.

  </Step>

  <Step title="Das Kanal-Plugin-Objekt erstellen">
    Die Schnittstelle `ChannelPlugin` hat viele optionale Adapter-Oberflächen. Beginnen Sie mit
    dem Minimum — `id` und `setup` — und fügen Sie Adapter nach Bedarf hinzu.

    Erstellen Sie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // Ihr API-Client für die Plattform

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

      // DM-Sicherheit: Wer dem Bot schreiben darf
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Kopplung: Freigabefluss für neue DM-Kontakte
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: Wie Antworten zugestellt werden
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
      | `security.dm` | Bereichsgebundener DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Kopplungsfluss mit Code-Austausch |
      | `threading` | Resolver für den Reply-to-Modus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sende-Funktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können statt der deklarativen Optionen auch rohe Adapterobjekte übergeben,
      wenn Sie vollständige Kontrolle benötigen.

      Rohe Outbound-Adapter können eine Funktion `chunker(text, limit, ctx)` definieren.
      Das optionale `ctx.formatting` trägt Formatierungsentscheidungen zur Zustellzeit
      wie `maxLinesPerMessage`; wenden Sie diese vor dem Senden an, damit Reply-Threading
      und Chunk-Grenzen einmalig durch die gemeinsame Outbound-Zustellung aufgelöst werden.
      Sende-Kontexte enthalten außerdem `replyToIdSource` (`implicit` oder `explicit`),
      wenn ein natives Antwortziel aufgelöst wurde, sodass Payload-Helper explizite
      Reply-Tags beibehalten können, ohne einen impliziten Single-Use-Antwort-Slot zu verbrauchen.
    </Accordion>

  </Step>

  <Step title="Den Entry-Point verdrahten">
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

    Legen Sie kanalverwaltete CLI-Deskriptoren in `registerCliMetadata(...)` ab, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Kanal-Laufzeit zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Befehls-
    Registrierung übernehmen. Behalten Sie `registerFull(...)` für reine Laufzeitarbeit.
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

    OpenClaw lädt dies anstelle des vollständigen Entry, wenn der Kanal deaktiviert
    oder nicht konfiguriert ist. Dadurch wird verhindert, dass während Setup-Flows
    schwerer Laufzeitcode geladen wird. Siehe [Setup and Config](/de/plugins/sdk-setup#setup-entry) für Details.

    Gebündelte Workspace-Kanäle, die setupsichere Exporte in Sidecar-
    Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen
    expliziten Laufzeit-Setter zur Setup-Zeit benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Inbound-Handler Ihres Kanals weiterleitet:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // pluginverwaltete Authentifizierung (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Inbound-Handler leitet die Nachricht an OpenClaw weiter.
          // Die genaue Verdrahtung hängt von Ihrem Plattform-SDK ab —
          // ein reales Beispiel finden Sie im gebündelten Microsoft-Teams- oder Google-Chat-Plugin-Paket.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Die Verarbeitung eingehender Nachrichten ist kanalspezifisch. Jedes Kanal-Plugin verwaltet
      seine eigene Inbound-Pipeline. Schauen Sie sich gebündelte Kanal-Plugins an
      (zum Beispiel das Microsoft-Teams- oder Google-Chat-Plugin-Paket) für reale Muster.
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
├── runtime-api.ts            # Interne Laufzeit-Exporte (optional)
└── src/
    ├── channel.ts            # ChannelPlugin über createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # API-Client der Plattform
    └── runtime.ts            # Laufzeit-Store (falls benötigt)
```

## Erweiterte Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Nachrichtentools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    `describeMessageTool` und Erkennung von Aktionen
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture-internals#channel-target-resolution">
    `inferTargetChatType`, `looksLikeId`, `resolveTarget`
  </Card>
  <Card title="Laufzeit-Helper" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über `api.runtime`
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Nähte existieren weiterhin für die Pflege gebündelter Plugins und
für Kompatibilität. Sie sind nicht das empfohlene Muster für neue Kanal-Plugins;
bevorzugen Sie die generischen Kanal-/Setup-/Reply-/Runtime-Subpfade aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie pflegen direkt diese Familie gebündelter Plugins.
</Note>

## Nächste Schritte

- [Provider Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [SDK Testing](/de/plugins/sdk-testing) — Test-Utilities und Vertragstests
- [Plugin Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema

## Verwandt

- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
- [Agent harness plugins](/de/plugins/sdk-agent-harness)
