---
read_when:
    - Je bouwt een nieuwe Plugin voor een modelprovider
    - Je wilt een OpenAI-compatibele proxy of aangepaste LLM aan OpenClaw toevoegen
    - Je moet provider-authenticatie, catalogi en runtime-hooks begrijpen
sidebarTitle: Provider plugins
summary: Stapsgewijze handleiding voor het bouwen van een modelprovider-Plugin voor OpenClaw
title: Provider-plugins bouwen
x-i18n:
    generated_at: "2026-06-27T18:06:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Deze gids doorloopt het bouwen van een provider-Plugin die een modelprovider
(LLM) aan OpenClaw toevoegt. Aan het einde heb je een provider met een modelcatalogus,
API-sleutel-authenticatie en dynamische modelresolutie.

<Info>
  Als je nog niet eerder een OpenClaw-Plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basispakketstructuur
  en manifestconfiguratie.
</Info>

<Tip>
  Provider-Plugins voegen modellen toe aan de normale inferentielus van OpenClaw. Als het model
  moet draaien via een native agent-daemon die threads, Compaction of tool-
  events beheert, koppel de provider dan aan een [agent-harnas](/nl/plugins/sdk-agent-harness)
  in plaats van daemonprotocoldetails in de kern te plaatsen.
</Tip>

## Stapsgewijze handleiding

<Steps>
  <Step title="Package and manifest">
    ### Stap 1: Pakket en manifest

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

    Het manifest declareert `setup.providers[].envVars` zodat OpenClaw
    referenties kan detecteren zonder je Plugin-runtime te laden. Voeg
    `providerAuthAliases` toe wanneer een providervariant de authenticatie van
    een andere provider-id moet hergebruiken. `modelSupport` is optioneel en laat
    OpenClaw je provider-Plugin automatisch laden vanuit verkorte model-id's
    zoals `acme-large` voordat runtime-hooks bestaan. Als je de provider op
    ClawHub publiceert, zijn die velden `openclaw.compat` en `openclaw.build`
    verplicht in `package.json`.

  </Step>

  <Step title="Register the provider">
    Een minimale tekstprovider heeft een `id`, `label`, `auth` en `catalog`
    nodig. `catalog` is de runtime-/configuratiehook die eigendom is van de
    provider; deze kan live vendor-API's aanroepen en retourneert
    `models.providers`-items.

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

    `registerModelCatalogProvider` is het nieuwere control-plane catalogusvlak
    voor lijst-, help- en picker-UI. Gebruik het voor rijen voor tekst,
    beeldgeneratie, videogeneratie en muziekgeneratie. Houd vendor-eindpunt-
    aanroepen en response-mapping in de Plugin; OpenClaw beheert de gedeelde
    rijvorm, bronlabels en helpweergave.

    Dat is een werkende provider. Gebruikers kunnen nu
    `openclaw onboard --acme-ai-api-key <key>` uitvoeren en
    `acme-ai/acme-large` als hun model selecteren.

    ### Live modeldetectie

    Als je provider een `/models`-achtige API aanbiedt, houd dan het
    providerspecifieke eindpunt en de rijprojectie in je Plugin en gebruik
    `openclaw/plugin-sdk/provider-catalog-live-runtime` voor de gedeelde
    fetch-levenscyclus. De helper geeft je bewaakte HTTP-fetches,
    provider-auth-headers, gestructureerde HTTP-fouten, TTL-caching en statisch
    fallbackgedrag zonder providerbeleid in de OpenClaw-kern te plaatsen.

    Gebruik `buildLiveModelProviderConfig` wanneer de live API alleen aangeeft
    welke statische catalogusrijen die eigendom zijn van de provider momenteel
    beschikbaar zijn:

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

    Gebruik `getCachedLiveProviderModelRows` wanneer de provider-API rijkere
    metadata retourneert en de Plugin zelf rijen naar OpenClaw-modeldefinities
    moet projecteren:

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

    `run` moet door authenticatie bewaakt blijven en `null` retourneren wanneer
    er geen bruikbare referentie beschikbaar is. Houd een offline `staticRun` of
    statische fallback aan zodat installatie, docs, tests en picker-oppervlakken
    niet afhankelijk zijn van live netwerktoegang. Gebruik een TTL die passend is
    voor de versheid van de modellenlijst, vermijd filesystem-polling tijdens
    requests en geef alleen een providerspecifieke `readRows` / `readModelId`
    door wanneer de upstreamrespons geen OpenAI-compatibele
    `{ data: [{ id, object }] }`-vorm heeft.

    Als de upstreamprovider andere controletokens gebruikt dan OpenClaw, voeg dan
    een kleine bidirectionele teksttransformatie toe in plaats van het streampad
    te vervangen:

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

    `input` herschrijft de uiteindelijke systeemprompt en tekstberichtinhoud
    vóór transport. `output` herschrijft assistent-tekstdelta's en de finale
    tekst voordat OpenClaw zijn eigen controlemarkers of kanaalbezorging parseert.

    Voor gebundelde providers die slechts één tekstprovider registreren met
    API-sleutel-authenticatie plus één catalogusgestuurde runtime, geef de
    voorkeur aan de smallere helper `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` is het live cataloguspad dat wordt gebruikt wanneer OpenClaw echte
    provider-auth kan oplossen. Het mag providerspecifieke detectie uitvoeren. Gebruik
    `buildStaticProvider` alleen voor offline rijen die veilig zijn om te tonen voordat auth
    is geconfigureerd; het mag geen referenties vereisen of netwerkverzoeken doen.
    De weergave `models list --all` van OpenClaw voert momenteel statische catalogi
    alleen uit voor gebundelde providerplugins, met een lege config, lege env en geen
    agent-/werkruimtepaden.

    Als je auth-flow ook `models.providers.*`, aliassen en
    het standaardmodel van de agent tijdens onboarding moet patchen, gebruik dan de presethelpers uit
    `openclaw/plugin-sdk/provider-onboard`. De smalste helpers zijn
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` en
    `createModelCatalogPresetAppliers(...)`.

    Wanneer een native endpoint van een provider gestreamde gebruiksblokken ondersteunt op het
    normale `openai-completions`-transport, geef dan de voorkeur aan de gedeelde catalogushelpers in
    `openclaw/plugin-sdk/provider-catalog-shared` in plaats van
    provider-id-controles hard te coderen. `supportsNativeStreamingUsageCompat(...)` en
    `applyProviderNativeStreamingUsageCompat(...)` detecteren ondersteuning vanuit de
    endpoint-capabilitymap, zodat native Moonshot-/DashScope-achtige endpoints nog steeds
    aanmelden, zelfs wanneer een plugin een aangepaste provider-id gebruikt.

    De live detectievoorbeelden hierboven behandelen provider-API's in `/models`-stijl. Houd
    die detectie binnen `catalog.run`, afgeschermd op bruikbare auth, en houd
    `staticRun` netwerkvrij voor offline catalogusgeneratie.

  </Step>

  <Step title="Dynamische modelresolutie toevoegen">
    Als je provider willekeurige model-ID's accepteert (zoals een proxy of router),
    voeg dan `resolveDynamicModel` toe:

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

    Als oplossen een netwerkoproep vereist, gebruik dan `prepareDynamicModel` voor asynchrone
    warming-up - `resolveDynamicModel` draait opnieuw nadat dit is voltooid.

  </Step>

  <Step title="Runtime-hooks toevoegen (waar nodig)">
    De meeste providers hebben alleen `catalog` + `resolveDynamicModel` nodig. Voeg hooks
    stapsgewijs toe wanneer je provider ze vereist.

    Gedeelde helperbuilders dekken nu de meest voorkomende replay-/tool-compat-
    families, dus plugins hoeven meestal niet elke hook een voor een handmatig te verbinden:

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

    Vandaag beschikbare replay-families:

    | Familie | Wat ermee wordt verbonden | Gebundelde voorbeelden |
    | --- | --- | --- |
    | `openai-compatible` | Gedeeld OpenAI-stijl replaybeleid voor OpenAI-compatibele transporten, inclusief opschoning van tool-call-id's, fixes voor assistant-first-volgorde en generieke Gemini-turnvalidatie waar het transport die nodig heeft | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewust replaybeleid gekozen op basis van `modelId`, zodat Anthropic-message-transporten alleen Claude-specifieke opschoning van thinking-blokken krijgen wanneer het opgeloste model daadwerkelijk een Claude-id is | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-replaybeleid plus bootstrap-replayopschoning. De gedeelde familie houdt de tekstuitvoer Gemini CLI op tagged reasoning; de directe `google`-provider overschrijft `resolveReasoningOutputMode` naar `native` omdat Gemini API-thinking aankomt als native thought parts. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Opschoning van Gemini-thought-signatures voor Gemini-modellen die via OpenAI-compatibele proxytransporten draaien; schakelt geen native Gemini-replayvalidatie of bootstrap-herschrijvingen in | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride beleid voor providers die Anthropic-message- en OpenAI-compatibele modeloppervlakken in één plugin combineren; optioneel Claude-only verwijderen van thinking-blokken blijft beperkt tot de Anthropic-kant | `minimax` |

    Vandaag beschikbare stream-families:

    | Familie | Wat ermee wordt verbonden | Gebundelde voorbeelden |
    | --- | --- | --- |
    | `google-thinking` | Normalisatie van Gemini-thinking-payloads op het gedeelde streampad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-reasoningwrapper op het gedeelde proxystreampad, waarbij `kilo/auto` en niet-ondersteunde proxy-reasoning-id's injected thinking overslaan | `kilocode` |
    | `moonshot-thinking` | Moonshot binaire native-thinking-payloadmapping vanuit config + `/think`-niveau | `moonshot` |
    | `minimax-fast-mode` | MiniMax fast-mode modelherschrijving op het gedeelde streampad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gedeelde native OpenAI/Codex Responses-wrappers: attributieheaders, `/fast`/`serviceTier`, tekstverboseheid, native Codex-webzoekfunctie, vormgeving van reasoning-compat-payloads en Responses-contextbeheer | `openai` |
    | `openrouter-thinking` | OpenRouter reasoningwrapper voor proxyroutes, waarbij overslaan voor niet-ondersteunde modellen/`auto` centraal wordt afgehandeld | `openrouter` |
    | `tool-stream-default-on` | Standaard ingeschakelde `tool_stream`-wrapper voor providers zoals Z.AI die toolstreaming willen tenzij dit expliciet is uitgeschakeld | `zai` |

    <Accordion title="SDK-seams die de familiebuilders aandrijven">
      Elke familiebuilder is samengesteld uit lagere openbare helpers die uit hetzelfde pakket worden geëxporteerd, die je kunt gebruiken wanneer een provider van het algemene patroon moet afwijken:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` en de ruwe replaybuilders (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporteert ook Gemini-replayhelpers (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) en endpoint-/modelhelpers (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus de gedeelde OpenAI/Codex-wrappers (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI-compatibele wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages thinking prefill cleanup (`createAnthropicThinkingPrefillPayloadWrapper`), plain-text tool-call compat (`createPlainTextToolCallCompatWrapper`) en gedeelde proxy-/providerwrappers (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - lichte payload- en eventwrappers voor hete providerpaden, inclusief `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` en `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` en onderliggende providerschemahelpers.

      Houd voor Gemini-familieproviders de reasoning-uitvoermodus afgestemd op
      het transport. Directe Google Gemini API-providers moeten `native`
      reasoning-uitvoer gebruiken, zodat OpenClaw native thought parts verbruikt zonder
      `<think>`- / `<final>`-promptdirectieven toe te voegen. Tekst-only Gemini CLI-achtige
      backends die een finale JSON-/tekstrespons parsen, kunnen het gedeelde
      `google-gemini` tagged contract behouden.

      Sommige streamhelpers blijven bewust provider-lokaal. `@openclaw/anthropic-provider` houdt `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` en de lagere Anthropic-wrapperbuilders in zijn eigen openbare `api.ts`- / `contract-api.ts`-seam omdat ze Claude OAuth-betabehandeling en `context1m`-gating coderen. De xAI-plugin houdt native xAI Responses-vormgeving op vergelijkbare wijze in zijn eigen `wrapStreamFn` (`/fast`-aliassen, standaard `tool_stream`, opschoning van niet-ondersteunde strict-tools, xAI-specifieke verwijdering van reasoning-payloads).

      Hetzelfde package-root-patroon ondersteunt ook `@openclaw/openai-provider` (providerbuilders, standaardmodelhelpers, realtime providerbuilders) en `@openclaw/openrouter-provider` (providerbuilder plus onboarding-/confighelpers).
    </Accordion>

    <Tabs>
      <Tab title="Tokenuitwisseling">
        Voor providers die vóór elke inference-aanroep een tokenuitwisseling nodig hebben:

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
      <Tab title="Aangepaste headers">
        Voor providers die aangepaste requestheaders of bodywijzigingen nodig hebben:

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
      <Tab title="Native transportidentiteit">
        Voor providers die native request-/sessieheaders of metadata nodig hebben op
        generieke HTTP- of WebSocket-transporten:

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
      <Tab title="Gebruik en facturering">
        Voor providers die gebruiks-/factureringsgegevens beschikbaar stellen:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` heeft drie uitkomsten. Retourneer `{ token, accountId? }`
        wanneer de provider een gebruiks-/factureringsreferentie heeft. Retourneer
        `{ handled: true }` alleen wanneer de provider gebruiksauth definitief heeft
        afgehandeld maar geen bruikbare gebruikstoken heeft, en OpenClaw generieke
        API-sleutel-/OAuth-fallback moet overslaan. Retourneer `null` of `undefined`
        wanneer de provider de aanvraag niet heeft afgehandeld en OpenClaw moet
        doorgaan met generieke fallback.
      </Tab>
    </Tabs>

    <Accordion title="Alle beschikbare provider-hooks">
      OpenClaw roept hooks in deze volgorde aan. De meeste providers gebruiken er slechts 2-3:
      Alleen-compatibiliteit-provider-velden die OpenClaw niet meer aanroept, zoals
      `ProviderPlugin.capabilities` en `suppressBuiltInModel`, worden hier niet
      vermeld.

      | # | Hook | Wanneer te gebruiken |
      | --- | --- | --- |
      | 1 | `catalog` | Modelcatalogus of standaardinstellingen voor basis-URL |
      | 2 | `applyConfigDefaults` | Provider-eigen globale standaardwaarden tijdens configmaterialisatie |
      | 3 | `normalizeModelId` | Opschoning van legacy-/preview-model-id-aliassen vóór lookup |
      | 4 | `normalizeTransport` | Opschoning van providerfamilie-`api` / `baseUrl` vóór generieke modelsamenstelling |
      | 5 | `normalizeConfig` | `models.providers.<id>`-config normaliseren |
      | 6 | `applyNativeStreamingUsageCompat` | Compat-herschrijvingen voor native streaminggebruik voor configproviders |
      | 7 | `resolveConfigApiKey` | Provider-eigen env-marker-authresolutie |
      | 8 | `resolveSyntheticAuth` | Lokale/zelfgehoste of config-onderbouwde synthetische auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | Synthetische opgeslagen-profiel-placeholders lager zetten achter env-/config-auth |
      | 10 | `resolveDynamicModel` | Willekeurige upstream-model-ID's accepteren |
      | 11 | `prepareDynamicModel` | Asynchrone metadatafetch vóór resolutie |
      | 12 | `normalizeResolvedModel` | Transportherschrijvingen vóór de runner |
      | 13 | `normalizeToolSchemas` | Provider-eigen opschoning van tool-schema's vóór registratie |
      | 14 | `inspectToolSchemas` | Provider-eigen diagnostiek voor tool-schema's |
      | 15 | `resolveReasoningOutputMode` | Tagged versus native contract voor reasoning-output |
      | 16 | `prepareExtraParams` | Standaard aanvraagparameters |
      | 17 | `createStreamFn` | Volledig aangepaste StreamFn-transport |
      | 19 | `wrapStreamFn` | Aangepaste headers/body-wrappers op het normale streampad |
      | 20 | `resolveTransportTurnState` | Native headers/metadata per beurt |
      | 21 | `resolveWebSocketSessionPolicy` | Native WS-sessieheaders/cooldown |
      | 22 | `formatApiKey` | Aangepaste runtimetokenvorm |
      | 23 | `refreshOAuth` | Aangepaste OAuth-refresh |
      | 24 | `buildAuthDoctorHint` | Richtlijnen voor authherstel |
      | 25 | `matchesContextOverflowError` | Provider-eigen overflowdetectie |
      | 26 | `classifyFailoverReason` | Provider-eigen classificatie van rate-limits/overbelasting |
      | 27 | `isCacheTtlEligible` | TTL-gating voor promptcache |
      | 28 | `buildMissingAuthMessage` | Aangepaste hint voor ontbrekende auth |
      | 29 | `augmentModelCatalog` | Synthetische forward-compat-rijen |
      | 30 | `resolveThinkingProfile` | Modelspecifieke `/think`-optieset |
      | 31 | `isBinaryThinking` | Compatibiliteit voor binair denken aan/uit |
      | 32 | `supportsXHighThinking` | Compatibiliteit voor ondersteuning van `xhigh`-redeneren |
      | 33 | `resolveDefaultThinkingLevel` | Compatibiliteit voor standaardbeleid van `/think` |
      | 34 | `isModernModelRef` | Live-/smoke-modelmatching |
      | 35 | `prepareRuntimeAuth` | Tokenuitwisseling vóór inferentie |
      | 36 | `resolveUsageAuth` | Aangepaste parsing van gebruiksreferenties |
      | 37 | `fetchUsageSnapshot` | Aangepast gebruikseindpunt |
      | 38 | `createEmbeddingProvider` | Provider-eigen embedding-adapter voor geheugen/zoekfunctie |
      | 39 | `buildReplayPolicy` | Aangepast beleid voor transcript-replay/Compaction |
      | 40 | `sanitizeReplayHistory` | Provider-specifieke replay-herschrijvingen na generieke opschoning |
      | 41 | `validateReplayTurns` | Strikte validatie van replay-beurten vóór de embedded runner |
      | 42 | `onModelSelected` | Callback na selectie (bijv. telemetrie) |

      Opmerkingen over runtimefallback:

      - `normalizeConfig` controleert eerst de gematchte provider en daarna andere providerplugins met hookmogelijkheden totdat er één de config daadwerkelijk wijzigt. Als geen providerhook een ondersteunde Google-familieconfig-entry herschrijft, wordt de gebundelde Google-confignormalizer nog steeds toegepast.
      - `resolveConfigApiKey` gebruikt de providerhook wanneer die beschikbaar is. Amazon Bedrock houdt AWS env-marker-resolutie in zijn providerplugin; runtime-auth zelf gebruikt nog steeds de standaardketen van de AWS SDK wanneer geconfigureerd met `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` ontvangt de geselecteerde `provider`, `modelId`, optionele samengevoegde `reasoning`-catalogushint en optionele samengevoegde model-`compat`-feiten. Gebruik `compat` alleen om de thinking-UI/het thinking-profiel van de provider te selecteren.
      - `resolveSystemPromptContribution` laat een provider cachebewuste system-prompt-richtlijnen injecteren voor een modelfamilie. Geef hier de voorkeur aan boven `before_prompt_build` wanneer het gedrag bij één provider/modelfamilie hoort en de stabiele/dynamische cachesplitsing moet behouden.

      Zie [Internals: Provider Runtime Hooks](/nl/plugins/architecture-internals#provider-runtime-hooks) voor gedetailleerde beschrijvingen en praktijkvoorbeelden.
    </Accordion>

  </Step>

  <Step title="Extra mogelijkheden toevoegen (optioneel)">
    ### Stap 5: Extra mogelijkheden toevoegen

    Een providerplugin kan embeddings, spraak, realtime transcriptie,
    realtime stem, media-understanding, beeldgeneratie, videogeneratie,
    webfetch en webzoekfunctie naast tekstinferentie registreren. OpenClaw classificeert dit als een
    **hybrid-capability**-plugin - het aanbevolen patroon voor bedrijfsplugins
    (één plugin per leverancier). Zie
    [Internals: Capability Ownership](/nl/plugins/architecture#capability-ownership-model).

    Registreer elke mogelijkheid binnen `register(api)` naast je bestaande
    `api.registerProvider(...)`-aanroep. Kies alleen de tabs die je nodig hebt:

    <Tabs>
      <Tab title="Spraak (TTS)">
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

        Gebruik `assertOkOrThrowProviderError(...)` voor provider-HTTP-fouten zodat
        plugins afgetopte reads van error-body's, JSON-error-parsing en
        request-id-suffixen delen.
      </Tab>
      <Tab title="Realtime transcriptie">
        Geef de voorkeur aan `createRealtimeTranscriptionWebSocketSession(...)` - de gedeelde
        helper verwerkt proxycapture, reconnect-backoff, close-flushing, ready-
        handshakes, audioqueueing en diagnostiek voor close-events. Je plugin
        mapt alleen upstream-events.

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

        Batch-STT-providers die multipart-audio POSTen, moeten
        `buildAudioTranscriptionFormData(...)` uit
        `openclaw/plugin-sdk/provider-http` gebruiken. De helper normaliseert upload-
        bestandsnamen, inclusief AAC-uploads die een M4A-achtige bestandsnaam nodig
        hebben voor compatibele transcriptie-API's.
      </Tab>
      <Tab title="Realtime stem">
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
            // Stel dit alleen in als de provider meerdere tool responses voor
            // één call accepteert, bijvoorbeeld een onmiddellijke "working"-response gevolgd door
            // het uiteindelijke resultaat.
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

        Declareer `capabilities` zodat `talk.catalog` geldige modi,
        transports, audio-indelingen en feature flags kan tonen aan browser- en native Talk-
        clients. Implementeer `handleBargeIn` wanneer een transport kan detecteren dat een
        mens het afspelen door de assistant onderbreekt en de provider het inkorten
        of wissen van de actieve audioreactie ondersteunt.
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Lokale of zelfgehoste mediaproviders die bewust geen
        referenties vereisen, kunnen `resolveAuth` beschikbaar maken en `kind: "none"`
        retourneren. OpenClaw behoudt nog steeds de normale auth-gate voor providers die zich
        niet expliciet aanmelden. Bestaande providers kunnen `req.apiKey` blijven lezen;
        nieuwe providers gebruiken bij voorkeur `req.auth`.

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

        Declareer dezelfde id in `contracts.embeddingProviders`. Dit is het
        algemene embeddingcontract voor herbruikbare vectorgeneratie, inclusief
        zoeken in geheugen. `registerMemoryEmbeddingProvider(...)` is verouderde
        compatibiliteit voor bestaande geheugenspecifieke adapters.
      </Tab>
      <Tab title="Image and video generation">
        Videocapabilities gebruiken een **modusbewuste** vorm: `generate`,
        `imageToVideo` en `videoToVideo`. Platte verzamelvelden zoals
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` zijn niet
        genoeg om ondersteuning voor transformatiemodi of uitgeschakelde modi duidelijk
        te adverteren. Muziekgeneratie volgt hetzelfde patroon met expliciete `generate`- /
        `edit`-blokken.

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
      <Tab title="Web fetch and search">
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

  <Step title="Test">
    ### Stap 6: Testen

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

## Publiceren naar ClawHub

Provider-plugins worden op dezelfde manier gepubliceerd als elke andere externe codeplugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Gebruik hier niet de verouderde publicatiealias die alleen voor skills is; pluginpakketten moeten
`clawhub package publish` gebruiken.

## Bestandsstructuur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Referentie voor catalogusvolgorde

`catalog.order` bepaalt wanneer je catalogus wordt samengevoegd ten opzichte van ingebouwde
providers:

| Volgorde  | Wanneer       | Gebruiksscenario                                |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Eerste pass   | Gewone API-sleutelproviders                     |
| `profile` | Na simple     | Providers afgeschermd door auth-profielen       |
| `paired`  | Na profile    | Meerdere gerelateerde entries synthetiseren     |
| `late`    | Laatste pass  | Bestaande providers overschrijven (wint bij botsing) |

## Volgende stappen

- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - als je plugin ook een kanaal levert
- [SDK Runtime](/nl/plugins/sdk-runtime) - `api.runtime`-helpers (TTS, zoeken, subagent)
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige importreferentie voor subpaden
- [Plugin-internals](/nl/plugins/architecture-internals#provider-runtime-hooks) - hookdetails en gebundelde voorbeelden

## Gerelateerd

- [Plugin SDK instellen](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Kanaalplugins bouwen](/nl/plugins/sdk-channel-plugins)
