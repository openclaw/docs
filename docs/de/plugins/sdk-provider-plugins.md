---
read_when:
    - Sie erstellen ein neues Modell-Provider-Plugin
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen
    - Sie müssen Provider-Authentifizierung, Kataloge und Runtime-Hooks verstehen
sidebarTitle: Provider plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Provider-Plugins erstellen
x-i18n:
    generated_at: "2026-06-27T17:58:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Dieser Leitfaden führt Sie durch den Aufbau eines Provider-Plugins, das OpenClaw einen Modell-Provider
(LLM) hinzufügt. Am Ende haben Sie einen Provider mit einem Modellkatalog,
API-Schlüssel-Authentifizierung und dynamischer Modellauflösung.

<Info>
  Wenn Sie noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Manifest-Einrichtung.
</Info>

<Tip>
  Provider-Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das Modell
  über einen nativen Agent-Daemon laufen muss, der Threads, Compaction oder Tool-
  Events besitzt, kombinieren Sie den Provider mit einem [Agent-Harness](/de/plugins/sdk-agent-harness),
  statt Daemon-Protokolldetails im Core abzulegen.
</Tip>

## Schritt-für-Schritt-Anleitung

<Steps>
  <Step title="Paket und Manifest">
    ### Schritt 1: Paket und Manifest

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
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
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

    Das Manifest deklariert `setup.providers[].envVars`, damit OpenClaw
    Anmeldedaten erkennen kann, ohne die Runtime Ihres Plugins zu laden. Fügen Sie `providerAuthAliases`
    hinzu, wenn eine Provider-Variante die Authentifizierung einer anderen Provider-ID wiederverwenden soll. `modelSupport`
    ist optional und ermöglicht OpenClaw, Ihr Provider-Plugin automatisch anhand von Kurzform-
    Modell-IDs wie `acme-large` zu laden, bevor Runtime-Hooks existieren. Wenn Sie den
    Provider auf ClawHub veröffentlichen, sind diese Felder `openclaw.compat` und `openclaw.build`
    in `package.json` erforderlich.

  </Step>

  <Step title="Provider registrieren">
    Ein minimaler Text-Provider benötigt `id`, `label`, `auth` und `catalog`.
    `catalog` ist der vom Provider besessene Runtime-/Config-Hook; er kann Live-
    Vendor-APIs aufrufen und gibt `models.providers`-Einträge zurück.

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

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` ist die neuere Control-Plane-Katalogoberfläche
    für Listen-/Hilfe-/Picker-UI. Verwenden Sie sie für Text-, Bilderzeugungs-,
    Videoerzeugungs- und Musikerzeugungszeilen. Belassen Sie Vendor-Endpunktaufrufe und
    Response-Mapping im Plugin; OpenClaw besitzt die gemeinsame Zeilenform, Source-
    Labels und Hilfe-Rendering.

    Das ist ein funktionsfähiger Provider. Benutzer können jetzt
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als ihr Modell auswählen.

    ### Live-Modellerkennung

    Wenn Ihr Provider eine API im Stil von `/models` bereitstellt, behalten Sie den Provider-spezifischen
    Endpunkt und die Zeilenprojektion in Ihrem Plugin und verwenden Sie
    `openclaw/plugin-sdk/provider-catalog-live-runtime` für den gemeinsamen Fetch-
    Lebenszyklus. Der Helper bietet Ihnen abgesicherte HTTP-Fetches, Provider-Auth-Header,
    strukturierte HTTP-Fehler, TTL-Caching und statisches Fallback-Verhalten, ohne
    Provider-Policy in den OpenClaw-Core zu legen.

    Verwenden Sie `buildLiveModelProviderConfig`, wenn die Live-API Ihnen nur mitteilt, welche
    vom Provider besessenen statischen Katalogzeilen derzeit verfügbar sind:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
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
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    Verwenden Sie `getCachedLiveProviderModelRows`, wenn die Provider-API umfangreichere
    Metadaten zurückgibt und das Plugin selbst Zeilen in OpenClaw-Modell-
    Definitionen projizieren muss:

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` sollte auth-gated bleiben und `null` zurückgeben, wenn keine nutzbaren Anmeldedaten
    verfügbar sind. Behalten Sie ein Offline-`staticRun` oder einen statischen Fallback bei, damit Setup, Docs,
    Tests und Picker-Oberflächen nicht von Live-Netzwerkzugriff abhängen. Verwenden Sie eine TTL,
    die zur Aktualität der Modellliste passt, vermeiden Sie Filesystem-Polling zur Request-Zeit
    und übergeben Sie provider-spezifisches `readRows` / `readModelId` nur dann, wenn die
    Upstream-Antwort nicht der OpenAI-kompatiblen Form `{ data: [{ id, object }] }`
    entspricht.

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

    `input` schreibt den finalen System-Prompt und den Inhalt von Textnachrichten vor
    dem Transport um. `output` schreibt Assistant-Text-Deltas und finalen Text um, bevor
    OpenClaw seine eigenen Steuermarker parst oder die Channel-Zustellung erfolgt.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Schlüssel-
    Auth plus einer einzelnen kataloggestützten Runtime registrieren, bevorzugen Sie den enger gefassten
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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` ist der Live-Katalogpfad, der verwendet wird, wenn OpenClaw echte
    Provider-Authentifizierung auflösen kann. Er kann Provider-spezifische Erkennung ausführen. Verwenden Sie
    `buildStaticProvider` nur für Offline-Zeilen, die vor der Konfiguration der Authentifizierung
    sicher angezeigt werden können; es darf keine Zugangsdaten erfordern oder Netzwerkanfragen stellen.
    Die Anzeige `models list --all` von OpenClaw führt statische Kataloge derzeit
    nur für gebündelte Provider-Plugins aus, mit leerer Konfiguration, leerer Umgebung und ohne
    Agent-/Arbeitsbereichspfade.

    Wenn Ihr Authentifizierungsablauf während des Onboardings auch `models.providers.*`, Aliasse und
    das Standardmodell des Agents patchen muss, verwenden Sie die Preset-Helfer aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helfer sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn ein nativer Endpunkt eines Providers gestreamte Nutzungsblöcke über den
    normalen `openai-completions`-Transport unterstützt, bevorzugen Sie die gemeinsamen Kataloghelfer in
    `openclaw/plugin-sdk/provider-catalog-shared` statt fest codierter
    Provider-ID-Prüfungen. `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen Unterstützung aus der
    Endpunkt-Capability-Map, sodass native Endpunkte im Moonshot-/DashScope-Stil weiterhin
    opt-in verwenden, auch wenn ein Plugin eine benutzerdefinierte Provider-ID nutzt.

    Die obigen Beispiele für Live-Erkennung decken Provider-APIs im Stil von `/models` ab. Behalten Sie
    diese Erkennung in `catalog.run`, abgesichert durch nutzbare Authentifizierung, und halten Sie
    `staticRun` für die Offline-Kataloggenerierung netzwerkfrei.

  </Step>

  <Step title="Add dynamic model resolution">
    Wenn Ihr Provider beliebige Modell-IDs akzeptiert (wie ein Proxy oder Router),
    fügen Sie `resolveDynamicModel` hinzu:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

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

    Wenn die Auflösung einen Netzwerkaufruf erfordert, verwenden Sie `prepareDynamicModel` für das asynchrone
    Aufwärmen - `resolveDynamicModel` wird nach Abschluss erneut ausgeführt.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, wenn Ihr Provider sie benötigt.

    Gemeinsame Helfer-Builder decken inzwischen die häufigsten Replay-/Tool-Kompatibilitäts-
    Familien ab, sodass Plugins normalerweise nicht jeden Hook einzeln von Hand verdrahten müssen:

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

    Heute verfügbare Replay-Familien:

    | Familie | Was eingebunden wird | Gebündelte Beispiele |
    | --- | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen für Assistant-First-Reihenfolge und generischer Gemini-Turn-Validierung, wo der Transport sie benötigt | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewusste Replay-Richtlinie, ausgewählt nach `modelId`, sodass Anthropic-Message-Transporte Claude-spezifische Thinking-Block-Bereinigung nur erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bootstrap-Replay-Bereinigung. Die gemeinsame Familie hält die Gemini CLI mit Textausgabe bei markiertem Reasoning; der direkte `google`-Provider überschreibt `resolveReasoningOutputMode` zu `native`, weil Gemini API Thinking als native Thought-Parts ankommt. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Bereinigung von Gemini-Thought-Signaturen für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert keine native Gemini-Replay-Validierung oder Bootstrap-Umschreibungen | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die Anthropic-Message- und OpenAI-kompatible Modelloberflächen in einem Plugin mischen; optionales Entfernen von Claude-only-Thinking-Blocks bleibt auf die Anthropic-Seite beschränkt | `minimax` |

    Heute verfügbare Stream-Familien:

    | Familie | Was eingebunden wird | Gebündelte Beispiele |
    | --- | --- | --- |
    | `google-thinking` | Gemini-Thinking-Payload-Normalisierung auf dem gemeinsamen Stream-Pfad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs eingefügtes Thinking überspringen | `kilocode` |
    | `moonshot-thinking` | Moonshot-Binärmapping nativer Thinking-Payloads aus Konfiguration + `/think`-Level | `moonshot` |
    | `minimax-fast-mode` | MiniMax-Fast-Mode-Modellumschreibung auf dem gemeinsamen Stream-Pfad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gemeinsame native OpenAI/Codex-Responses-Wrapper: Attribution-Header, `/fast`/`serviceTier`, Textausführlichkeit, native Codex-Websuche, Reasoning-Kompatibilitäts-Payload-Formung und Responses-Kontextverwaltung | `openai` |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei nicht unterstützte Modelle/`auto` zentral übersprungen werden | `openrouter` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming wünschen, sofern es nicht explizit deaktiviert wurde | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Jeder Familien-Builder setzt sich aus öffentlichen Helfern niedrigerer Ebene zusammen, die aus demselben Paket exportiert werden und die Sie verwenden können, wenn ein Provider vom gemeinsamen Muster abweichen muss:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` und die rohen Replay-Builder (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exportiert außerdem Gemini-Replay-Helfer (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) und Endpunkt-/Modellhelfer (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` sowie die gemeinsamen OpenAI/Codex-Wrapper (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek-V4-OpenAI-kompatibler Wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic-Messages-Thinking-Prefill-Bereinigung (`createAnthropicThinkingPrefillPayloadWrapper`), Plain-Text-Tool-Call-Kompatibilität (`createPlainTextToolCallCompatWrapper`) und gemeinsame Proxy-/Provider-Wrapper (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - leichtgewichtige Payload- und Event-Wrapper für heiße Provider-Pfade, einschließlich `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` und `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` und die zugrunde liegenden Provider-Schema-Helfer.

      Halten Sie bei Providern der Gemini-Familie den Reasoning-Ausgabemodus am
      Transport ausgerichtet. Direkte Google-Gemini-API-Provider sollten `native`
      Reasoning-Ausgabe verwenden, damit OpenClaw native Thought-Parts konsumiert, ohne
      `<think>`- / `<final>`-Prompt-Direktiven hinzuzufügen. Text-only-Backends im Stil der Gemini CLI,
      die eine finale JSON-/Textantwort parsen, können den gemeinsamen
      markierten `google-gemini`-Vertrag beibehalten.

      Einige Stream-Helfer bleiben absichtlich Provider-lokal. `@openclaw/anthropic-provider` behält `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Anthropic-Wrapper-Builder niedrigerer Ebene in seiner eigenen öffentlichen `api.ts`- / `contract-api.ts`-Naht, weil sie Claude-OAuth-Beta-Behandlung und `context1m`-Gating codieren. Das xAI-Plugin behält native xAI-Responses-Formung ähnlich in seinem eigenen `wrapStreamFn` (`/fast`-Aliasse, Standard-`tool_stream`, Bereinigung nicht unterstützter Strict-Tools, xAI-spezifische Entfernung von Reasoning-Payloads).

      Dasselbe Paket-Root-Muster unterstützt auch `@openclaw/openai-provider` (Provider-Builder, Standardmodell-Helfer, Realtime-Provider-Builder) und `@openclaw/openrouter-provider` (Provider-Builder plus Onboarding-/Konfigurationshelfer).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
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
      <Tab title="Custom headers">
        Für Provider, die benutzerdefinierte Anfrage-Header oder Body-Änderungen benötigen:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
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
      <Tab title="Native transport identity">
        Für Provider, die native Anfrage-/Sitzungs-Header oder Metadaten auf
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

        `resolveUsageAuth` hat drei mögliche Ergebnisse. Geben Sie `{ token, accountId? }`
        zurück, wenn der Provider über Anmeldedaten für Nutzung/Abrechnung verfügt.
        Geben Sie `{ handled: true }` nur zurück, wenn der Provider die
        Nutzungs-Authentifizierung definitiv behandelt hat, aber kein nutzbares
        Nutzungstoken vorhanden ist und OpenClaw den generischen API-Key-/OAuth-Fallback
        überspringen muss. Geben Sie `null` oder `undefined` zurück, wenn der Provider
        die Anfrage nicht behandelt hat und OpenClaw mit dem generischen Fallback
        fortfahren soll.
      </Tab>
    </Tabs>

    <Accordion title="Alle verfügbaren Provider-Hooks">
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Provider verwenden nur 2-3:
      Provider-Felder, die nur noch der Kompatibilität dienen und von OpenClaw nicht
      mehr aufgerufen werden, wie `ProviderPlugin.capabilities` und
      `suppressBuiltInModel`, sind hier nicht aufgeführt.

      | # | Hook | Wann verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Modellkatalog oder Standardwerte für die Basis-URL |
      | 2 | `applyConfigDefaults` | Provider-eigene globale Standardwerte während der Konfigurationsmaterialisierung |
      | 3 | `normalizeModelId` | Bereinigung von Legacy-/Preview-Modell-ID-Aliasen vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` der Provider-Familie vor der generischen Modellzusammenstellung |
      | 5 | `normalizeConfig` | `models.providers.<id>`-Konfiguration normalisieren |
      | 6 | `applyNativeStreamingUsageCompat` | Native Streaming-Nutzungs-Kompatibilitätsumschreibungen für Konfigurations-Provider |
      | 7 | `resolveConfigApiKey` | Provider-eigene Authentifizierungsauflösung für Env-Marker |
      | 8 | `resolveSyntheticAuth` | Lokale/selbst gehostete oder konfigurationsgestützte synthetische Authentifizierung |
      | 9 | `shouldDeferSyntheticProfileAuth` | Synthetische gespeicherte Profil-Platzhalter hinter Env-/Config-Authentifizierung zurückstellen |
      | 10 | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchroner Metadatenabruf vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |
      | 13 | `normalizeToolSchemas` | Provider-eigene Tool-Schema-Bereinigung vor der Registrierung |
      | 14 | `inspectToolSchemas` | Provider-eigene Tool-Schema-Diagnose |
      | 15 | `resolveReasoningOutputMode` | Vertrag für getaggte vs. native Reasoning-Ausgabe |
      | 16 | `prepareExtraParams` | Standard-Anfrageparameter |
      | 17 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 19 | `wrapStreamFn` | Benutzerdefinierte Header-/Body-Wrapper auf dem normalen Stream-Pfad |
      | 20 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 21 | `resolveWebSocketSessionPolicy` | Native WS-Session-Header/Cool-down |
      | 22 | `formatApiKey` | Benutzerdefinierte Runtime-Token-Form |
      | 23 | `refreshOAuth` | Benutzerdefinierte OAuth-Aktualisierung |
      | 24 | `buildAuthDoctorHint` | Anleitung zur Authentifizierungsreparatur |
      | 25 | `matchesContextOverflowError` | Provider-eigene Overflow-Erkennung |
      | 26 | `classifyFailoverReason` | Provider-eigene Klassifizierung von Rate-Limit/Überlastung |
      | 27 | `isCacheTtlEligible` | TTL-Gating für Prompt-Cache |
      | 28 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Authentifizierung |
      | 29 | `augmentModelCatalog` | Synthetische Forward-Compat-Zeilen |
      | 30 | `resolveThinkingProfile` | Modellspezifischer `/think`-Optionssatz |
      | 31 | `isBinaryThinking` | Kompatibilität für binäres Thinking ein/aus |
      | 32 | `supportsXHighThinking` | Kompatibilität für `xhigh`-Reasoning-Unterstützung |
      | 33 | `resolveDefaultThinkingLevel` | Kompatibilität der Standard-`/think`-Policy |
      | 34 | `isModernModelRef` | Live-/Smoke-Modellabgleich |
      | 35 | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | 36 | `resolveUsageAuth` | Benutzerdefiniertes Parsen von Nutzungs-Anmeldedaten |
      | 37 | `fetchUsageSnapshot` | Benutzerdefinierter Nutzungs-Endpunkt |
      | 38 | `createEmbeddingProvider` | Provider-eigener Embedding-Adapter für Memory/Suche |
      | 39 | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Transcript-Replay/Compaction |
      | 40 | `sanitizeReplayHistory` | Provider-spezifische Replay-Umschreibungen nach generischer Bereinigung |
      | 41 | `validateReplayTurns` | Strikte Replay-Turn-Validierung vor dem eingebetteten Runner |
      | 42 | `onModelSelected` | Callback nach der Auswahl (z. B. Telemetrie) |

      Hinweise zum Runtime-Fallback:

      - `normalizeConfig` prüft zuerst den passenden Provider und danach andere hook-fähige Provider-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein Provider-Hook einen unterstützten Google-Familien-Konfigurationseintrag umschreibt, wird weiterhin der gebündelte Google-Konfigurationsnormalisierer angewendet.
      - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er bereitgestellt wird. Amazon Bedrock behält die AWS-Env-Marker-Auflösung in seinem Provider-Plugin; die Runtime-Authentifizierung selbst verwendet weiterhin die Standardkette des AWS SDK, wenn sie mit `auth: "aws-sdk"` konfiguriert ist.
      - `resolveThinkingProfile(ctx)` erhält den ausgewählten `provider`, `modelId`, einen optional zusammengeführten `reasoning`-Kataloghinweis und optional zusammengeführte `compat`-Fakten des Modells. Verwenden Sie `compat` nur, um die Thinking-UI/das Thinking-Profil des Providers auszuwählen.
      - `resolveSystemPromptContribution` ermöglicht es einem Provider, cache-bewusste System-Prompt-Hinweise für eine Modellfamilie einzufügen. Bevorzugen Sie dies gegenüber `before_prompt_build`, wenn das Verhalten zu einer Provider-/Modellfamilie gehört und die stabile/dynamische Cache-Trennung beibehalten soll.

      Ausführliche Beschreibungen und Praxisbeispiele finden Sie unter [Interna: Provider-Runtime-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Fähigkeiten hinzufügen (optional)">
    ### Schritt 5: Zusätzliche Fähigkeiten hinzufügen

    Ein Provider-Plugin kann Embeddings, Sprache, Echtzeit-Transkription,
    Echtzeit-Sprache, Medienverständnis, Bildgenerierung, Videogenerierung,
    Web Fetch und Websuche neben Textinferenz registrieren. OpenClaw klassifiziert dies als
    **Hybrid-Capability**-Plugin - das empfohlene Muster für Unternehmens-Plugins
    (ein Plugin pro Anbieter). Siehe
    [Interna: Capability Ownership](/de/plugins/architecture#capability-ownership-model).

    Registrieren Sie jede Fähigkeit innerhalb von `register(api)` neben Ihrem vorhandenen
    `api.registerProvider(...)`-Aufruf. Wählen Sie nur die Tabs aus, die Sie benötigen:

    <Tabs>
      <Tab title="Sprache (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          defaultTimeoutMs: 120_000,
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        Verwenden Sie `assertOkOrThrowProviderError(...)` für Provider-HTTP-Fehler, damit
        Plugins begrenzte Error-Body-Lesevorgänge, JSON-Fehlerparsing und
        Request-ID-Suffixe gemeinsam nutzen.
      </Tab>
      <Tab title="Echtzeit-Transkription">
        Bevorzugen Sie `createRealtimeTranscriptionWebSocketSession(...)` - der gemeinsame
        Helper übernimmt Proxy-Erfassung, Reconnect-Backoff, Close-Flushing, Ready-
        Handshakes, Audio-Queueing und Close-Event-Diagnose. Ihr Plugin
        ordnet nur Upstream-Events zu.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        Batch-STT-Provider, die Multipart-Audio per POST senden, sollten
        `buildAudioTranscriptionFormData(...)` aus
        `openclaw/plugin-sdk/provider-http` verwenden. Der Helper normalisiert Upload-
        Dateinamen, einschließlich AAC-Uploads, die für kompatible Transkriptions-APIs
        einen M4A-artigen Dateinamen benötigen.
      </Tab>
      <Tab title="Echtzeit-Sprache">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        Deklarieren Sie `capabilities`, damit `talk.catalog` gültige Modi,
        Transporte, Audioformate und Feature-Flags für Browser- und native Talk-
        Clients verfügbar machen kann. Implementieren Sie `handleBargeIn`, wenn ein Transport erkennen kann, dass ein
        Mensch die Assistentenwiedergabe unterbricht und der Provider das
        Kürzen oder Löschen der aktiven Audioantwort unterstützt.
      </Tab>
      <Tab title="Medienverständnis">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Lokale oder selbst gehostete Medien-Provider, die absichtlich keine
        Anmeldedaten benötigen, können `resolveAuth` bereitstellen und
        `kind: "none"` zurückgeben. OpenClaw behält weiterhin die normale Auth-
        Sperre für Provider bei, die sich nicht ausdrücklich dafür entscheiden.
        Bestehende Provider können weiterhin `req.apiKey` lesen; neue Provider
        sollten `req.auth` bevorzugen.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Embeddings">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        Deklarieren Sie dieselbe ID in `contracts.embeddingProviders`. Dies ist
        der allgemeine Embedding-Vertrag für wiederverwendbare Vektorgenerierung,
        einschließlich Speichersuche. `registerMemoryEmbeddingProvider(...)` ist
        veraltete Kompatibilität für bestehende speicherspezifische Adapter.
      </Tab>
      <Tab title="Bild- und Videogenerierung">
        Videofunktionen verwenden eine **modusbewusste** Struktur: `generate`,
        `imageToVideo` und `videoToVideo`. Flache Aggregatfelder wie
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` reichen nicht
        aus, um Unterstützung für Transformationsmodi oder deaktivierte Modi
        sauber anzugeben. Musikgenerierung folgt demselben Muster mit expliziten
        `generate`- / `edit`-Blöcken.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Webabruf und Suche">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
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
            description: "Fetch a page through Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Testen">
    ### Schritt 6: Testen

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
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

Provider-Plugins werden genauso veröffentlicht wie jedes andere externe Code-
Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den veralteten Alias nur für Skills; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Referenz zur Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog im Verhältnis zu integrierten
Providern zusammengeführt wird:

| Reihenfolge | Wann             | Anwendungsfall                                  |
| ----------- | ---------------- | ----------------------------------------------- |
| `simple`    | Erster Durchlauf | Einfache API-Key-Provider                       |
| `profile`   | Nach simple      | Provider, die von Auth-Profilen abhängen        |
| `paired`    | Nach profile     | Mehrere zusammengehörige Einträge erzeugen      |
| `late`      | Letzter Durchlauf | Bestehende Provider überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - wenn Ihr Plugin auch einen Channel bereitstellt
- [SDK-Runtime](/de/plugins/sdk-runtime) - `api.runtime`-Hilfsfunktionen (TTS, Suche, Subagent)
- [SDK-Übersicht](/de/plugins/sdk-overview) - vollständige Referenz für Subpath-Imports
- [Plugin-Interna](/de/plugins/architecture-internals#provider-runtime-hooks) - Hook-Details und gebündelte Beispiele

## Verwandt

- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Channel-Plugins erstellen](/de/plugins/sdk-channel-plugins)
