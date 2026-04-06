---
read_when:
    - Sie erstellen ein neues Messaging-Kanal-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Kanal-Plugins erstellen
x-i18n:
    generated_at: "2026-04-06T03:09:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66b52c10945a8243d803af3bf7e1ea0051869ee92eda2af5718d9bb24fbb8552
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal-Plugins erstellen

Diese Anleitung führt Sie durch die Erstellung eines Kanal-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Kanal mit DM-Sicherheit,
Pairing, Antwort-Threading und ausgehender Nachrichtenübermittlung.

<Info>
  Wenn Sie noch nie ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paket-
  Struktur und das Manifest-Setup.
</Info>

## So funktionieren Kanal-Plugins

Kanal-Plugins benötigen keine eigenen Werkzeuge zum Senden/Bearbeiten/Reagieren. OpenClaw behält ein
gemeinsames `message`-Tool im Kern. Ihr Plugin besitzt:

- **Konfiguration** — Kontenauflösung und Setup-Assistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Pairing** — DM-Genehmigungsablauf
- **Sitzungsgrammatik** — wie provider-spezifische Konversations-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden

Der Kern besitzt das gemeinsame `message`-Tool, die Prompt-Verkabelung, die äußere Form des Sitzungsschlüssels,
generisches `:thread:`-Bookkeeping und Dispatch.

Wenn Ihre Plattform zusätzlichen Geltungsbereich in Konversations-IDs speichert, behalten Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook für die Zuordnung von `rawId` zur Basis-Konversations-ID, optionalen Thread-
ID, expliziten `baseConversationId` und beliebigen `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie sie in der Reihenfolge vom
engsten Parent bis zur breitesten/Basis-Konversation.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Kanalregistrierung startet,
können zusätzlich eine Datei `session-key-api.ts` auf oberster Ebene mit einem passenden
Export `resolveSessionConversation(...)` bereitstellen. Der Kern verwendet diese bootstrap-sichere Oberfläche
nur dann, wenn die Laufzeit-Plugin-Registrierung noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
veralteter Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich
zur generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet der Kern
zuerst `resolveSessionConversation(...).parentConversationCandidates` und greift nur
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie auslässt.

## Genehmigungen und Kanal-Fähigkeiten

Die meisten Kanal-Plugins benötigen keinen genehmigungsspezifischen Code.

- Der Kern besitzt `/approve` im selben Chat, gemeinsame Payloads für Genehmigungsschaltflächen und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt auf dem Kanal-Plugin, wenn der Kanal genehmigungsspezifisches Verhalten benötigt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Auth-Naht für Genehmigungen.
- Wenn Ihr Kanal native Exec-Genehmigungen bereitstellt, implementieren Sie `approvalCapability.getActionAvailabilityState`, selbst wenn der native Transport vollständig unter `approvalCapability.native` lebt. Der Kern verwendet diesen Verfügbarkeits-Hook, um `enabled` von `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Kanal native Genehmigungen unterstützt, und den Kanal in Fallback-Hinweisen für native Clients einzuschließen.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für kanalspezifisches Verhalten im Payload-Lebenszyklus, etwa zum Ausblenden doppelter lokaler Genehmigungsaufforderungen oder zum Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder die Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Kanal wirklich benutzerdefinierte Genehmigungs-Payloads anstelle des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Kanal in der Antwort für den deaktivierten Pfad genau erklären soll, welche Konfigurationsoptionen nötig sind, um native Exec-Genehmigungen zu aktivieren. Der Hook empfängt `{ channel, channelLabel, accountId }`; Kanäle mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Standardwerten auf oberster Ebene rendern.
- Wenn ein Kanal aus vorhandener Konfiguration stabile owner-ähnliche DM-Identitäten ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne genehmigungsspezifische Kernlogik hinzuzufügen.
- Wenn ein Kanal native Genehmigungszustellung benötigt, halten Sie den Kanalcode auf Zielnormalisierung und Transport-Hooks fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` und `createChannelNativeApprovalRuntime` aus `openclaw/plugin-sdk/approval-runtime`, damit der Kern Request-Filterung, Routing, Deduplizierung, Ablauf und Gateway-Abonnement besitzt.
- Kanäle mit nativen Genehmigungen müssen sowohl `accountId` als auch `approvalKind` durch diese Hilfsfunktionen leiten. `accountId` hält die Richtlinie für Genehmigungen mit mehreren Konten auf das richtige Bot-Konto beschränkt, und `approvalKind` hält das Verhalten für Exec- vs. Plugin-Genehmigungen im Kanal verfügbar, ohne fest codierte Verzweigungen im Kern.
- Bewahren Sie die Art der ausgelieferten Genehmigungs-ID Ende-zu-Ende. Native Clients sollten
  das Routing von Exec- vs. Plugin-Genehmigungen nicht aus kanal lokalem Zustand erraten oder umschreiben.
- Unterschiedliche Genehmigungsarten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für Exec- als auch Plugin-IDs verfügbar.
  - Matrix hält natives DM-/Kanal-Routing nur für Exec-Genehmigungen aufrecht und belässt
    Plugin-Genehmigungen auf dem gemeinsamen `/approve`-Pfad im selben Chat.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` auf dem Plugin bereitstellen.

Für heiße Kanal-Einstiegspunkte bevorzugen Sie die engeren Laufzeit-Unterpfade, wenn Sie nur
einen Teil dieser Familie benötigen:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Ebenso bevorzugen Sie `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere übergeordnete
Oberfläche nicht benötigen.

Speziell für Setup gilt:

- `openclaw/plugin-sdk/setup-runtime` deckt die laufzeitsicheren Setup-Hilfen ab:
  importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Notizen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die enge env-bewusste Adapter-
  Naht für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die Setup-Builder für optionale Installation sowie einige setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
  `splitSetupEntries`
- verwenden Sie die breitere Naht `openclaw/plugin-sdk/setup` nur dann, wenn Sie auch die
  schwereren gemeinsamen Setup-/Konfigurationshilfen benötigen, wie etwa
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Kanal in Setup-Oberflächen nur „dieses Plugin zuerst installieren“ bewerben möchte,
bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der erzeugte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung fehlgeschlossen aus und nutzt über Validierung, Finalisierung und Kopie von Docs-Links hinweg dieselbe Meldung „Installation erforderlich“.

Für andere heiße Kanalpfade bevorzugen Sie die engen Hilfen gegenüber breiteren veralteten
Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Konfigurationen mit mehreren Konten und
  Fallback für das Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehende Route/Umschlag und
  Verkabelung von Aufzeichnung und Dispatch
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Abgleich
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus ausgehende
  Identitäts-/Sende-Delegates
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von Thread-Bindings
  und Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein veraltetes Feldlayout für Agent-/Medien-Payloads erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Normalisierung benutzerdefinierter Befehle, Validierung von Duplikaten/Konflikten und einen fallback-stabilen Vertrag für Befehlskonfiguration

Kanäle nur mit Auth können meist beim Standardpfad bleiben: Der Kern verarbeitet Genehmigungen und das Plugin stellt nur ausgehende/Auth-Fähigkeiten bereit. Kanäle mit nativen Genehmigungen wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Hilfen verwenden, statt ihren eigenen Genehmigungslebenszyklus zu implementieren.

## Walkthrough

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standarddateien des Plugins. Das Feld `channel` in `package.json` ist es,
    das dies zu einem Kanal-Plugin macht. Die vollständige Oberfläche für Paketmetadaten
    finden Sie unter [Plugin-Setup und Konfiguration](/de/plugins/sdk-setup#openclawchannel):

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

  <Step title="Das Kanal-Plugin-Objekt erstellen">
    Die Schnittstelle `ChannelPlugin` besitzt viele optionale Adapter-Oberflächen. Beginnen Sie mit
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

    <Accordion title="Was createChatChannelPlugin für Sie übernimmt">
      Statt Low-Level-Adapterschnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was sie verdrahtet |
      | --- | --- |
      | `security.dm` | Aufgelöster DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Code-Austausch |
      | `threading` | Resolver für Reply-to-Modus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnismetadaten zurückgeben (Nachrichten-IDs) |

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

    Legen Sie kanalbesitzte CLI-Deskriptoren in `registerCliMetadata(...)` ab, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Kanallaufzeit zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Befehls-
    Registrierung aufgreifen. Behalten Sie `registerFull(...)` für Arbeiten nur zur Laufzeit bei.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    plugin-spezifisches Präfix. Kern-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung nach Registrierungsmodus automatisch. Alle
    Optionen finden Sie unter [Einstiegspunkte](/de/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Einen Setup-Eintrag hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies statt des vollständigen Einstiegspunkts, wenn der Kanal deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, während Setup-Abläufen schweren Laufzeitcode zu laden.
    Details finden Sie unter [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Eingangs-Handler Ihres Kanals weiterleitet:

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
      Die Verarbeitung eingehender Nachrichten ist kanalspezifisch. Jedes Kanal-Plugin besitzt
      seine eigene Eingangs-Pipeline. Sehen Sie sich gebündelte Kanal-Plugins an
      (zum Beispiel das Paket mit dem Microsoft Teams- oder Google Chat-Plugin) für echte Muster.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie colocierte Tests in `src/channel.test.ts`:

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
├── runtime-api.ts            # Interne Laufzeit-Exporte (optional)
└── src/
    ├── channel.ts            # ChannelPlugin über createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # API-Client der Plattform
    └── runtime.ts            # Laufzeitspeicher (falls nötig)
```

## Erweiterte Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Message-Tools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Action-Discovery
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Laufzeit-Hilfen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Seams existieren weiterhin für Wartung gebündelter Plugins und
Kompatibilität. Sie sind nicht das empfohlene Muster für neue Kanal-Plugins;
bevorzugen Sie die generischen Kanal-/Setup-/Reply-/Laufzeit-Unterpfade aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten diese Familie gebündelter Plugins direkt.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [SDK Testing](/de/plugins/sdk-testing) — Test-Utilities und Vertragstests
- [Plugin Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema
