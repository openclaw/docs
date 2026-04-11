---
read_when:
    - Sie erstellen ein neues Modell-Provider-Plugin
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen
    - Sie müssen Provider-Authentifizierung, Kataloge und Runtime-Hooks verstehen
sidebarTitle: Provider Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Erstellen von Provider-Plugins
x-i18n:
    generated_at: "2026-04-11T02:46:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d7c5da6556dc3d9673a31142ff65eb67ddc97fc0c1a6f4826a2c7693ecd5e3
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Erstellen von Provider-Plugins

Diese Anleitung führt Sie Schritt für Schritt durch das Erstellen eines Provider-Plugins, das einen Modell-Provider
(LLM) zu OpenClaw hinzufügt. Am Ende haben Sie einen Provider mit Modellkatalog,
API-Key-Authentifizierung und dynamischer Modellauflösung.

<Info>
  Wenn Sie noch nie zuvor ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Getting Started](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und das Manifest-Setup.
</Info>

<Tip>
  Provider-Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das Modell
  über einen nativen Agent-Daemon laufen muss, der Threads, Verdichtung oder Tool-
  Ereignisse verwaltet, kombinieren Sie den Provider mit einem [Agent-Harness](/de/plugins/sdk-agent-harness),
  statt Details des Daemon-Protokolls in den Core zu legen.
</Tip>

## Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Das Manifest deklariert `providerAuthEnvVars`, damit OpenClaw
    Anmeldedaten erkennen kann, ohne die Laufzeit Ihres Plugins zu laden. Fügen Sie `providerAuthAliases`
    hinzu, wenn eine Provider-Variante die Authentifizierung einer anderen Provider-ID wiederverwenden soll. `modelSupport`
    ist optional und ermöglicht es OpenClaw, Ihr Provider-Plugin automatisch aus Kurzform-
    Modell-IDs wie `acme-large` zu laden, bevor Runtime-Hooks existieren. Wenn Sie den
    Provider auf ClawHub veröffentlichen, sind diese Felder `openclaw.compat` und `openclaw.build`
    in `package.json` erforderlich.

  </Step>

  <Step title="Den Provider registrieren">
    Ein minimaler Provider benötigt `id`, `label`, `auth` und `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    Das ist ein funktionierender Provider. Benutzer können jetzt
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als Modell auswählen.

    Wenn der Upstream-Provider andere Steuertokens als OpenClaw verwendet, fügen Sie eine
    kleine bidirektionale Texttransformation hinzu, statt den Stream-Pfad zu ersetzen:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` schreibt den endgültigen System-Prompt und den Textnachrichteninhalt vor
    dem Transport um. `output` schreibt Text-Deltas des Assistenten und den endgültigen Text um, bevor
    OpenClaw seine eigenen Kontrollmarker oder die Kanalauslieferung verarbeitet.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Key-
    Authentifizierung plus eine einzelne kataloggestützte Runtime registrieren, verwenden Sie bevorzugt den enger gefassten
    Helper `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    Wenn Ihr Auth-Flow außerdem `models.providers.*`, Aliasse und
    das Standard-Agentenmodell während des Onboardings patchen muss, verwenden Sie die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn ein nativer Endpunkt eines Providers gestreamte Usage-Blöcke auf dem
    normalen `openai-completions`-Transport unterstützt, verwenden Sie bevorzugt die gemeinsamen Katalog-Helper in
    `openclaw/plugin-sdk/provider-catalog-shared`, statt Prüfungen auf Provider-IDs fest zu verdrahten.
    `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen die Unterstützung über die Endpoint-Fähigkeitszuordnung,
    sodass native Moonshot-/DashScope-artige Endpunkte sich weiterhin aktivieren lassen, selbst wenn ein Plugin eine
    benutzerdefinierte Provider-ID verwendet.

  </Step>

  <Step title="Dynamische Modellauflösung hinzufügen">
    Wenn Ihr Provider beliebige Modell-IDs akzeptiert (wie ein Proxy oder Router),
    fügen Sie `resolveDynamicModel` hinzu:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog von oben

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Wenn die Auflösung einen Netzwerkaufruf erfordert, verwenden Sie `prepareDynamicModel` für asynchrones
    Warm-up — `resolveDynamicModel` wird erneut ausgeführt, nachdem dieses abgeschlossen ist.

  </Step>

  <Step title="Runtime-Hooks hinzufügen (nach Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, je nachdem, was Ihr Provider benötigt.

    Gemeinsam genutzte Helper-Builder decken jetzt die häufigsten Replay-/Tool-Kompatibilitäts-
    Familien ab, sodass Plugins normalerweise nicht jeden Hook einzeln verdrahten müssen:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Verfügbare Replay-Familien derzeit:

    | Familie | Was sie verdrahtet |
    | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen für Assistant-First-Reihenfolge und generischer Gemini-Turn-Validierung, wo der Transport sie benötigt |
    | `anthropic-by-model` | Claude-spezifische Replay-Richtlinie, ausgewählt nach `modelId`, sodass Anthropic-Message-Transporte nur dann Claude-spezifische Thinking-Block-Bereinigung erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bootstrap-Replay-Bereinigung und markierter Reasoning-Output-Modus |
    | `passthrough-gemini` | Bereinigung von Gemini-Thought-Signaturen für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert keine native Gemini-Replay-Validierung oder Bootstrap-Umschreibungen |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die Anthropic-Message- und OpenAI-kompatible Modelloberflächen in einem Plugin mischen; optionales Entfernen von Claude-spezifischen Thinking-Blöcken bleibt auf die Anthropic-Seite begrenzt |

    Echte gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` und `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` und `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` und `zai`: `openai-compatible`

    Verfügbare Stream-Familien derzeit:

    | Familie | Was sie verdrahtet |
    | --- | --- |
    | `google-thinking` | Normalisierung von Gemini-Thinking-Payloads auf dem gemeinsamen Stream-Pfad |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs injiziertes Thinking überspringen |
    | `moonshot-thinking` | Moonshot-Binärzuordnung nativer Thinking-Payloads aus Konfiguration + `/think`-Level |
    | `minimax-fast-mode` | Umschreibung von MiniMax-Fast-Mode-Modellen auf dem gemeinsamen Stream-Pfad |
    | `openai-responses-defaults` | Gemeinsame native OpenAI-/Codex-Responses-Wrapper: Attributions-Header, `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche, Reasoning-Kompatibilitäts-Payload-Shaping und Responses-Kontextverwaltung |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, mit zentral behandeltem Überspringen für nicht unterstützte Modelle/`auto` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming möchten, sofern es nicht explizit deaktiviert wird |

    Echte gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` und `minimax-portal`: `minimax-fast-mode`
    - `openai` und `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exportiert außerdem das Replay-Familien-
    Enum sowie die gemeinsamen Helper, aus denen diese Familien aufgebaut sind. Häufige öffentliche
    Exporte sind:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - gemeinsame Replay-Builder wie `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` und
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini-Replay-Helper wie `sanitizeGoogleGeminiReplayHistory(...)`
      und `resolveTaggedReasoningOutputMode()`
    - Endpoint-/Modell-Helper wie `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` und
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` stellt sowohl den Familien-Builder als auch
    die öffentlichen Wrapper-Helper bereit, die diese Familien wiederverwenden. Häufige öffentliche Exporte
    sind:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - gemeinsame OpenAI-/Codex-Wrapper wie
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` und
      `createCodexNativeWebSearchWrapper(...)`
    - gemeinsame Proxy-/Provider-Wrapper wie `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` und `createMinimaxFastModeWrapper(...)`

    Manche Stream-Helper bleiben absichtlich Provider-lokal. Aktuelles gebündeltes
    Beispiel: `@openclaw/anthropic-provider` exportiert
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die
    niedrigeren Anthropic-Wrapper-Builder über sein öffentliches `api.ts`- /
    `contract-api.ts`-Interface. Diese Helper bleiben Anthropic-spezifisch, weil
    sie außerdem Claude-OAuth-Beta-Handling und `context1m`-Gating codieren.

    Andere gebündelte Provider behalten transportbezogene Wrapper ebenfalls lokal,
    wenn das Verhalten sich nicht sauber familienübergreifend teilen lässt. Aktuelles Beispiel: das
    gebündelte xAI-Plugin behält natives xAI-Responses-Shaping in seinem eigenen
    `wrapStreamFn`, einschließlich Umschreibungen von `/fast`-Aliasen, standardmäßigem `tool_stream`,
    Bereinigung nicht unterstützter Strict-Tool-Konfigurationen und Entfernung von xAI-spezifischen Reasoning-Payloads.

    `openclaw/plugin-sdk/provider-tools` stellt derzeit eine gemeinsame
    Tool-Schema-Familie plus gemeinsame Schema-/Kompatibilitäts-Helper bereit:

    - `ProviderToolCompatFamily` dokumentiert das heutige gemeinsame Familieninventar.
    - `buildProviderToolCompatFamilyHooks("gemini")` verdrahtet die Bereinigung von Gemini-Schemata
      + Diagnosefunktionen für Provider, die Gemini-sichere Tool-Schemata benötigen.
    - `normalizeGeminiToolSchemas(...)` und `inspectGeminiToolSchemas(...)`
      sind die zugrunde liegenden öffentlichen Gemini-Schema-Helper.
    - `resolveXaiModelCompatPatch()` gibt den gebündelten xAI-Kompatibilitäts-Patch zurück:
      `toolSchemaProfile: "xai"`, nicht unterstützte Schema-Schlüsselwörter, native
      `web_search`-Unterstützung und Dekodierung von Tool-Call-Argumenten mit HTML-Entities.
    - `applyXaiModelCompat(model)` wendet denselben xAI-Kompatibilitäts-Patch auf ein
      aufgelöstes Modell an, bevor es den Runner erreicht.

    Echtes gebündeltes Beispiel: Das xAI-Plugin verwendet `normalizeResolvedModel` plus
    `contributeResolvedModelCompat`, damit diese Kompatibilitätsmetadaten dem
    Provider gehören, statt xAI-Regeln im Core fest zu verdrahten.

    Dasselbe Paket-Root-Muster unterstützt auch andere gebündelte Provider:

    - `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
      Helper für Standardmodelle und Realtime-Provider-Builder
    - `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder
      sowie Onboarding-/Konfigurations-Helper

    <Tabs>
      <Tab title="Token-Austausch">
        Für Provider, die vor jedem Inferenzaufruf einen Token-Austausch benötigen:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Benutzerdefinierte Header">
        Für Provider, die benutzerdefinierte Request-Header oder Änderungen am Body benötigen:

        ```typescript
        // wrapStreamFn gibt eine aus ctx.streamFn abgeleitete StreamFn zurück
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Native Transportidentität">
        Für Provider, die native Request-/Sitzungs-Header oder Metadaten auf
        generischen HTTP- oder WebSocket-Transporten benötigen:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Nutzung und Abrechnung">
        Für Provider, die Nutzungs-/Abrechnungsdaten bereitstellen:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="Alle verfügbaren Provider-Hooks">
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Provider verwenden nur 2-3:

      | # | Hook | Wann verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Modellkatalog oder Standardwerte für `baseUrl` |
      | 2 | `applyConfigDefaults` | Provider-eigene globale Standardwerte während der Materialisierung der Konfiguration |
      | 3 | `normalizeModelId` | Bereinigung von Legacy-/Preview-Modell-ID-Aliasen vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` für Provider-Familien vor der generischen Modellerstellung |
      | 5 | `normalizeConfig` | `models.providers.<id>`-Konfiguration normalisieren |
      | 6 | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitäts-Umschreibungen für Konfigurations-Provider |
      | 7 | `resolveConfigApiKey` | Provider-eigene Auflösung von Env-Marker-Authentifizierung |
      | 8 | `resolveSyntheticAuth` | Synthetische Authentifizierung für lokal/self-hosted oder konfigurationsgestützte Setups |
      | 9 | `shouldDeferSyntheticProfileAuth` | Platzhalter für synthetische gespeicherte Profile hinter Env-/Konfigurations-Authentifizierung zurückstufen |
      | 10 | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchroner Metadatenabruf vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |

    Hinweise zu Runtime-Fallbacks:

    - `normalizeConfig` prüft zuerst den passenden Provider und danach andere
      Hook-fähige Provider-Plugins, bis eines die Konfiguration tatsächlich ändert.
      Wenn kein Provider-Hook einen unterstützten Google-Familien-Konfigurationseintrag umschreibt, wird weiterhin
      der gebündelte Google-Konfigurations-Normalisierer angewendet.
    - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er verfügbar ist. Der gebündelte
      `amazon-bedrock`-Pfad hat hier außerdem einen eingebauten AWS-Env-Marker-Resolver,
      obwohl die Bedrock-Runtime-Authentifizierung selbst weiterhin die Standardkette des AWS SDK verwendet.
      | 13 | `contributeResolvedModelCompat` | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | Legacy-statische Capabilities-Sammlung; nur aus Kompatibilitätsgründen |
      | 15 | `normalizeToolSchemas` | Provider-eigene Bereinigung von Tool-Schemata vor der Registrierung |
      | 16 | `inspectToolSchemas` | Provider-eigene Diagnose von Tool-Schemata |
      | 17 | `resolveReasoningOutputMode` | Vertrag für markierten vs. nativen Reasoning-Output |
      | 18 | `prepareExtraParams` | Standard-Request-Parameter |
      | 19 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 20 | `wrapStreamFn` | Benutzerdefinierte Header-/Body-Wrapper auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 22 | `resolveWebSocketSessionPolicy` | Native WS-Sitzungs-Header/Cool-down |
      | 23 | `formatApiKey` | Benutzerdefinierte Runtime-Token-Form |
      | 24 | `refreshOAuth` | Benutzerdefiniertes OAuth-Refresh |
      | 25 | `buildAuthDoctorHint` | Hinweise zur Reparatur der Authentifizierung |
      | 26 | `matchesContextOverflowError` | Provider-eigene Erkennung von Context Overflow |
      | 27 | `classifyFailoverReason` | Provider-eigene Klassifizierung von Rate-Limit-/Überlastungsgründen |
      | 28 | `isCacheTtlEligible` | TTL-Gating für Prompt-Cache |
      | 29 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Authentifizierung |
      | 30 | `suppressBuiltInModel` | Veraltete Upstream-Zeilen ausblenden |
      | 31 | `augmentModelCatalog` | Synthetische Forward-Compat-Zeilen |
      | 32 | `isBinaryThinking` | Binäres Thinking ein/aus |
      | 33 | `supportsXHighThinking` | Unterstützung für `xhigh`-Reasoning |
      | 34 | `resolveDefaultThinkingLevel` | Standardrichtlinie für `/think` |
      | 35 | `isModernModelRef` | Abgleich für Live-/Smoke-Modelle |
      | 36 | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | 37 | `resolveUsageAuth` | Benutzerdefiniertes Parsen von Nutzungsanmeldedaten |
      | 38 | `fetchUsageSnapshot` | Benutzerdefinierter Usage-Endpoint |
      | 39 | `createEmbeddingProvider` | Provider-eigener Embedding-Adapter für Memory/Suche |
      | 40 | `buildReplayPolicy` | Benutzerdefinierte Replay-/Verdichtungsrichtlinie für Transkripte |
      | 41 | `sanitizeReplayHistory` | Provider-spezifische Replay-Umschreibungen nach generischer Bereinigung |
      | 42 | `validateReplayTurns` | Strikte Validierung von Replay-Turns vor dem eingebetteten Runner |
      | 43 | `onModelSelected` | Callback nach Modellauswahl (z. B. Telemetrie) |

      Hinweis zur Prompt-Abstimmung:

      - `resolveSystemPromptContribution` ermöglicht es einem Provider, Cache-bewusste
        System-Prompt-Anweisungen für eine Modellfamilie einzuspeisen. Bevorzugen Sie dies gegenüber
        `before_prompt_build`, wenn das Verhalten zu einer Provider-/Modellfamilie gehört
        und die stabile/dynamische Cache-Aufteilung erhalten bleiben soll.

      Detaillierte Beschreibungen und Beispiele aus der Praxis finden Sie unter
      [Internals: Provider Runtime Hooks](/de/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Capabilities hinzufügen (optional)">
    <a id="step-5-add-extra-capabilities"></a>
    Ein Provider-Plugin kann neben Textinferenz auch Speech, Realtime-Transkription, Realtime-
    Voice, Media Understanding, Bilderzeugung, Videoerzeugung, Web Fetch
    und Websuche registrieren:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Realtime Voice",
        isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
        createBridge: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          setMediaTimestamp: () => {},
          submitToolResult: () => {},
          acknowledgeMark: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Seiten über das Rendering-Backend von Acme abrufen.",
        envVars: ["ACME_FETCH_API_KEY"],
        placeholder: "acme-...",
        signupUrl: "https://acme.example.com/fetch",
        credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
        getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
        setCredentialValue: (fetchConfigTarget, value) => {
          const acme = (fetchConfigTarget.acme ??= {});
          acme.apiKey = value;
        },
        createTool: () => ({
          description: "Eine Seite über Acme Fetch abrufen.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    OpenClaw stuft dies als **hybrid-capability**-Plugin ein. Das ist das
    empfohlene Muster für Unternehmens-Plugins (ein Plugin pro Anbieter). Siehe
    [Internals: Capability Ownership](/de/plugins/architecture#capability-ownership-model).

    Für Videoerzeugung bevorzugen Sie die oben gezeigte modusbewusste Capability-Form:
    `generate`, `imageToVideo` und `videoToVideo`. Flache aggregierte Felder wie
    `maxInputImages`, `maxInputVideos` und `maxDurationSeconds` reichen nicht aus,
    um Unterstützung für Transformationsmodi oder deaktivierte Modi sauber auszuweisen.

    Provider für Musikerzeugung sollten demselben Muster folgen:
    `generate` für rein promptbasierte Erzeugung und `edit` für referenzbildbasierte
    Erzeugung. Flache aggregierte Felder wie `maxInputImages`,
    `supportsLyrics` und `supportsFormat` reichen nicht aus, um `edit`-
    Unterstützung auszuweisen; explizite `generate`- / `edit`-Blöcke sind der erwartete Vertrag.

  </Step>

  <Step title="Testen">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportieren Sie Ihr Provider-Konfigurationsobjekt aus index.ts oder einer eigenen Datei
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("löst dynamische Modelle auf", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("gibt den Katalog zurück, wenn ein Schlüssel verfügbar ist", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("gibt `null` für den Katalog zurück, wenn kein Schlüssel vorhanden ist", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## In ClawHub veröffentlichen

Provider-Plugins werden genauso veröffentlicht wie jedes andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den veralteten Alias nur für Skills; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-Metadaten
├── openclaw.plugin.json      # Manifest mit Provider-Authentifizierungsmetadaten
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage-Endpoint (optional)
```

## Referenz für die Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog relativ zu integrierten
Providern zusammengeführt wird:

| Reihenfolge | Wann | Anwendungsfall |
| ----------- | ---- | -------------- |
| `simple`    | Erster Durchlauf | Einfache API-Key-Provider |
| `profile`   | Nach `simple` | Provider, die von Auth-Profilen abhängen |
| `paired`    | Nach `profile` | Mehrere zusammengehörige Einträge synthetisieren |
| `late`      | Letzter Durchlauf | Vorhandene Provider überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Channel Plugins](/de/plugins/sdk-channel-plugins) — wenn Ihr Plugin auch einen Kanal bereitstellt
- [SDK Runtime](/de/plugins/sdk-runtime) — `api.runtime`-Helper (TTS, Suche, Subagent)
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [Plugin Internals](/de/plugins/architecture#provider-runtime-hooks) — Hook-Details und gebündelte Beispiele
