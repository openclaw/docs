---
read_when:
    - Je bouwt een nieuwe Plugin voor modelproviders
    - Je wilt een OpenAI-compatibele proxy of aangepaste LLM aan OpenClaw toevoegen
    - Je moet provider-authenticatie, catalogi en runtime-hooks begrijpen
sidebarTitle: Provider plugins
summary: Stapsgewijze handleiding voor het bouwen van een Plugin voor modelproviders voor OpenClaw
title: Providerplugins bouwen
x-i18n:
    generated_at: "2026-05-01T11:21:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Deze handleiding legt uit hoe u een provider-Plugin bouwt die een modelprovider
(LLM) aan OpenClaw toevoegt. Aan het einde hebt u een provider met een modelcatalogus,
API-sleutelauthenticatie en dynamische modelresolutie.

<Info>
  Als u nog nooit een OpenClaw-Plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basispakketstructuur
  en manifestconfiguratie.
</Info>

<Tip>
  Provider-Plugins voegen modellen toe aan de normale inference-loop van OpenClaw. Als het model
  via een native agent-daemon moet draaien die threads, Compaction of tool-events beheert,
  combineer de provider dan met een [agent-harnas](/nl/plugins/sdk-agent-harness)
  in plaats van daemon-protocoldetails in core te plaatsen.
</Tip>

## Stapsgewijze uitleg

<Steps>
  <Step title="Package and manifest">
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

    Het manifest declareert `providerAuthEnvVars`, zodat OpenClaw
    credentials kan detecteren zonder de runtime van uw Plugin te laden. Voeg `providerAuthAliases`
    toe wanneer een providervariant de authenticatie van een andere provider-id moet hergebruiken. `modelSupport`
    is optioneel en laat OpenClaw uw provider-Plugin automatisch laden vanuit verkorte
    model-id's zoals `acme-large` voordat runtime-hooks bestaan. Als u de
    provider op ClawHub publiceert, zijn de velden `openclaw.compat` en `openclaw.build`
    vereist in `package.json`.

  </Step>

  <Step title="Register the provider">
    Een minimale provider heeft een `id`, `label`, `auth` en `catalog` nodig:

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

    Dat is een werkende provider. Gebruikers kunnen nu
    `openclaw onboard --acme-ai-api-key <key>` uitvoeren en
    `acme-ai/acme-large` als hun model selecteren.

    Als de upstream-provider andere controletokens gebruikt dan OpenClaw, voeg dan een
    kleine bidirectionele teksttransformatie toe in plaats van het streampad te vervangen:

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

    `input` herschrijft de uiteindelijke systeemprompt en tekstberichtinhoud vóór
    transport. `output` herschrijft assistent-tekstdelta's en uiteindelijke tekst voordat
    OpenClaw zijn eigen controlemarkeringen of kanaalaflevering verwerkt.

    Voor gebundelde providers die slechts één tekstprovider met API-sleutel-
    authenticatie plus één door catalogus ondersteunde runtime registreren, geeft u de voorkeur aan de beperktere
    helper `defineSingleProviderPluginEntry(...)`:

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
    provider-authenticatie kan oplossen. Het kan providerspecifieke ontdekking uitvoeren. Gebruik
    `buildStaticProvider` alleen voor offline rijen die veilig kunnen worden getoond voordat authenticatie
    is geconfigureerd; het mag geen credentials vereisen of netwerkverzoeken doen.
    De weergave `models list --all` van OpenClaw voert momenteel statische catalogi
    alleen uit voor gebundelde provider-Plugins, met een lege configuratie, lege env en geen
    agent-/workspacepaden.

    Als uw authenticatiestroom ook `models.providers.*`, aliassen en
    het standaardmodel van de agent tijdens onboarding moet patchen, gebruik dan de preset-helpers uit
    `openclaw/plugin-sdk/provider-onboard`. De smalste helpers zijn
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` en
    `createModelCatalogPresetAppliers(...)`.

    Wanneer de native endpoint van een provider gestreamde usage-blokken ondersteunt op het
    normale `openai-completions`-transport, geeft u de voorkeur aan de gedeelde catalogushelpers in
    `openclaw/plugin-sdk/provider-catalog-shared` in plaats van provider-id-controles
    hard te coderen. `supportsNativeStreamingUsageCompat(...)` en
    `applyProviderNativeStreamingUsageCompat(...)` detecteren ondersteuning via de
    endpoint-capabilitymap, zodat native Moonshot/DashScope-achtige endpoints nog steeds
    opt-in gebruiken, ook wanneer een Plugin een aangepaste provider-id gebruikt.

  </Step>

  <Step title="Add dynamic model resolution">
    Als uw provider willekeurige model-id's accepteert (zoals een proxy of router),
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

    Als resolutie een netwerkoproep vereist, gebruik dan `prepareDynamicModel` voor async
    warming-up — `resolveDynamicModel` wordt opnieuw uitgevoerd nadat dit is voltooid.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    De meeste providers hebben alleen `catalog` + `resolveDynamicModel` nodig. Voeg hooks
    stapsgewijs toe wanneer uw provider ze vereist.

    Gedeelde helperbuilders dekken nu de meest voorkomende families voor replay/tool-compat,
    dus Plugins hoeven meestal niet elke hook een voor een handmatig te bedraden:

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

    | Familie | Wat het aansluit | Gebundelde voorbeelden |
    | --- | --- | --- |
    | `openai-compatible` | Gedeeld OpenAI-achtig replaybeleid voor OpenAI-compatibele transports, inclusief opschoning van tool-call-id's, fixes voor assistant-first-volgorde en generieke Gemini-turn-validatie waar het transport dit nodig heeft | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewust replaybeleid gekozen door `modelId`, zodat Anthropic-message-transports alleen Claude-specifieke thinking-block-opschoning krijgen wanneer het opgeloste model daadwerkelijk een Claude-id is | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-replaybeleid plus bootstrap-replayopschoning en getagde reasoning-outputmodus | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Opschoning van Gemini thought-signatures voor Gemini-modellen die via OpenAI-compatibele proxytransports draaien; schakelt geen native Gemini-replayvalidatie of bootstrap-herschrijvingen in | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride beleid voor providers die Anthropic-message- en OpenAI-compatibele modeloppervlakken in één Plugin combineren; optioneel verwijderen van Claude-only thinking-blocks blijft beperkt tot de Anthropic-kant | `minimax` |

    Vandaag beschikbare streamfamilies:

    | Familie | Wat het koppelt | Meegeleverde voorbeelden |
    | --- | --- | --- |
    | `google-thinking` | Normalisatie van Gemini-thinking-payloads op het gedeelde streampad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-redeneringswrapper op het gedeelde proxystreampad, waarbij `kilo/auto` en niet-ondersteunde proxy-redenerings-id's geïnjecteerde thinking overslaan | `kilocode` |
    | `moonshot-thinking` | Moonshot binaire native-thinking-payloadmapping vanuit configuratie + `/think`-niveau | `moonshot` |
    | `minimax-fast-mode` | MiniMax fast-mode modelherschrijving op het gedeelde streampad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gedeelde native OpenAI/Codex Responses-wrappers: attributieheaders, `/fast`/`serviceTier`, tekstuitgebreidheid, native Codex-webzoekopdracht, reasoning-compat-payloadvorming en Responses-contextbeheer | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter-redeneringswrapper voor proxyroutes, waarbij overslaan voor niet-ondersteunde modellen/`auto` centraal wordt afgehandeld | `openrouter` |
    | `tool-stream-default-on` | Standaard ingeschakelde `tool_stream`-wrapper voor providers zoals Z.AI die toolstreaming willen tenzij dit expliciet is uitgeschakeld | `zai` |

    <Accordion title="SDK-naden die de familiebouwers aandrijven">
      Elke familiebouwer is samengesteld uit lagere openbare helpers die vanuit hetzelfde pakket worden geëxporteerd, waarnaar je kunt grijpen wanneer een provider moet afwijken van het algemene patroon:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` en de ruwe replaybouwers (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporteert ook Gemini-replayhelpers (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) en endpoint-/modelhelpers (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus de gedeelde OpenAI/Codex-wrappers (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI-compatibele wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages-thinking-prefillopschoning (`createAnthropicThinkingPrefillPayloadWrapper`) en gedeelde proxy-/providerwrappers (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, onderliggende Gemini-schemahelpers (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) en xAI-compathelpers (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). De meegeleverde xAI-plugin gebruikt `normalizeResolvedModel` + `contributeResolvedModelCompat` hiermee om xAI-regels eigendom van de provider te houden.

      Sommige streamhelpers blijven bewust provider-lokaal. `@openclaw/anthropic-provider` houdt `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` en de lagere Anthropic-wrapperbouwers in zijn eigen openbare `api.ts` / `contract-api.ts`-naad omdat ze Claude OAuth-bèta-afhandeling en `context1m`-gating coderen. De xAI-plugin houdt native xAI Responses-vorming op dezelfde manier in zijn eigen `wrapStreamFn` (`/fast`-aliassen, standaard `tool_stream`, opschoning van niet-ondersteunde strikte tools, xAI-specifieke verwijdering van reasoning-payloads).

      Hetzelfde pakketrootpatroon ondersteunt ook `@openclaw/openai-provider` (providerbouwers, standaardmodelhelpers, realtime-providerbouwers) en `@openclaw/openrouter-provider` (providerbouwer plus onboarding-/configuratiehelpers).
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
        Voor providers die aangepaste requestheaders of body-aanpassingen nodig hebben:

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
        generieke HTTP- of WebSocket-transports:

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
      </Tab>
    </Tabs>

    <Accordion title="Alle beschikbare providerhooks">
      OpenClaw roept hooks in deze volgorde aan. De meeste providers gebruiken er maar 2-3:
      Provider-velden die alleen voor compatibiliteit bestaan en die OpenClaw niet meer aanroept, zoals
      `ProviderPlugin.capabilities` en `suppressBuiltInModel`, staan
      hier niet vermeld.

      | # | Hook | Wanneer te gebruiken |
      | --- | --- | --- |
      | 1 | `catalog` | Modelcatalogus of standaardwaarden voor basis-URL |
      | 2 | `applyConfigDefaults` | Provider-eigen globale standaardwaarden tijdens configuratiematerialisatie |
      | 3 | `normalizeModelId` | Opschoning van legacy-/preview-model-id-aliassen vóór lookup |
      | 4 | `normalizeTransport` | Opschoning van providerfamilie-`api` / `baseUrl` vóór generieke modelsamenstelling |
      | 5 | `normalizeConfig` | Normaliseer `models.providers.<id>`-configuratie |
      | 6 | `applyNativeStreamingUsageCompat` | Native streaming-usage-compat-herschrijvingen voor configuratieproviders |
      | 7 | `resolveConfigApiKey` | Provider-eigen env-marker-auth-resolutie |
      | 8 | `resolveSyntheticAuth` | Lokale/zelfgehoste of configuratiegestuurde synthetische auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | Verlaag synthetische opgeslagen-profiel-placeholders achter env-/configuratie-auth |
      | 10 | `resolveDynamicModel` | Accepteer willekeurige upstream-model-ID's |
      | 11 | `prepareDynamicModel` | Asynchrone metadata-fetch vóór resolutie |
      | 12 | `normalizeResolvedModel` | Transportherschrijvingen vóór de runner |
      | 13 | `contributeResolvedModelCompat` | Compatflags voor vendormodellen achter een ander compatibel transport |
      | 14 | `normalizeToolSchemas` | Provider-eigen opschoning van toolschema's vóór registratie |
      | 15 | `inspectToolSchemas` | Provider-eigen diagnostiek voor toolschema's |
      | 16 | `resolveReasoningOutputMode` | Contract voor tagged versus native reasoning-output |
      | 17 | `prepareExtraParams` | Standaard requestparameters |
      | 18 | `createStreamFn` | Volledig aangepast StreamFn-transport |
      | 19 | `wrapStreamFn` | Aangepaste header-/body-wrappers op het normale streampad |
      | 20 | `resolveTransportTurnState` | Native headers/metadata per beurt |
      | 21 | `resolveWebSocketSessionPolicy` | Native WS-sessieheaders/cooldown |
      | 22 | `formatApiKey` | Aangepaste runtime-tokenvorm |
      | 23 | `refreshOAuth` | Aangepaste OAuth-refresh |
      | 24 | `buildAuthDoctorHint` | Auth-reparatieadvies |
      | 25 | `matchesContextOverflowError` | Provider-eigen overflowdetectie |
      | 26 | `classifyFailoverReason` | Provider-eigen classificatie van rate-limit/overbelasting |
      | 27 | `isCacheTtlEligible` | Prompt-cache-TTL-gating |
      | 28 | `buildMissingAuthMessage` | Aangepaste hint voor ontbrekende auth |
      | 29 | `augmentModelCatalog` | Synthetische forward-compat-rijen |
      | 30 | `resolveThinkingProfile` | Modelspecifieke `/think`-optieset |
      | 31 | `isBinaryThinking` | Compatibiliteit voor binaire thinking aan/uit |
      | 32 | `supportsXHighThinking` | Compatibiliteit voor `xhigh`-redeneringsondersteuning |
      | 33 | `resolveDefaultThinkingLevel` | Compatibiliteit voor standaard `/think`-beleid |
      | 34 | `isModernModelRef` | Matching van live-/smokemodellen |
      | 35 | `prepareRuntimeAuth` | Tokenuitwisseling vóór inference |
      | 36 | `resolveUsageAuth` | Aangepaste parsing van gebruiksreferenties |
      | 37 | `fetchUsageSnapshot` | Aangepast gebruiksendpoint |
      | 38 | `createEmbeddingProvider` | Provider-eigen embeddingadapter voor memory/zoeken |
      | 39 | `buildReplayPolicy` | Aangepast transcriptreplay-/Compaction-beleid |
      | 40 | `sanitizeReplayHistory` | Providerspecifieke replayherschrijvingen na generieke opschoning |
      | 41 | `validateReplayTurns` | Strikte validatie van replaybeurten vóór de embedded runner |
      | 42 | `onModelSelected` | Callback na selectie (bijv. telemetrie) |

      Runtime fallback-opmerkingen:

      - `normalizeConfig` controleert eerst de gematchte provider en daarna andere hook-capabele providerplugins totdat er daadwerkelijk één de configuratie wijzigt. Als geen providerhook een ondersteunde Google-familieconfiguratie-entry herschrijft, wordt de meegeleverde Google-configuratienormalizer nog steeds toegepast.
      - `resolveConfigApiKey` gebruikt de providerhook wanneer die beschikbaar is. Het meegeleverde `amazon-bedrock`-pad heeft hier ook een ingebouwde AWS env-marker-resolver, hoewel Bedrock-runtimeauth zelf nog steeds de standaardketen van de AWS SDK gebruikt.
      - `resolveSystemPromptContribution` laat een provider cachebewuste system-promptbegeleiding injecteren voor een modelfamilie. Geef hier de voorkeur aan boven `before_prompt_build` wanneer het gedrag bij één provider-/modelfamilie hoort en de stabiele/dynamische cachesplitsing moet behouden.

      Zie [Internals: Provider Runtime Hooks](/nl/plugins/architecture-internals#provider-runtime-hooks) voor gedetailleerde beschrijvingen en praktijkvoorbeelden.
    </Accordion>

  </Step>

  <Step title="Voeg extra capabilities toe (optioneel)">
    Een providerplugin kan spraak, realtime transcriptie, realtime
    spraak, mediabegrip, beeldgeneratie, videogeneratie, webfetch,
    en webzoeken registreren naast tekstinference. OpenClaw classificeert dit als een
    **hybrid-capability**-plugin — het aanbevolen patroon voor bedrijfsplugins
    (één plugin per vendor). Zie
    [Internals: Capability Ownership](/nl/plugins/architecture#capability-ownership-model).

    Registreer elke capability binnen `register(api)` naast je bestaande
    `api.registerProvider(...)`-aanroep. Kies alleen de tabs die je nodig hebt:

    <Tabs>
      <Tab title="Speech (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
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

        Gebruik `assertOkOrThrowProviderError(...)` voor HTTP-fouten van providers, zodat
        plugins gedeelde afgekapt gelezen foutberichten, JSON-foutparsing en
        request-id-achtervoegsels gebruiken.
      </Tab>
      <Tab title="Realtime transcription">
        Geef de voorkeur aan `createRealtimeTranscriptionWebSocketSession(...)`: de gedeelde
        helper handelt proxyvastlegging, reconnect-backoff, flushen bij sluiten, ready-
        handshakes, audiowachtrijen en diagnostiek voor close-events af. Je plugin
        koppelt alleen upstream-events.

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
        bestandsnamen, inclusief AAC-uploads die een M4A-achtige bestandsnaam nodig hebben voor
        compatibele transcriptie-API's.
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
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

        Implementeer `handleBargeIn` wanneer een transport kan detecteren dat een mens
        het afspelen door de assistent onderbreekt en de provider het afkappen of
        wissen van de actieve audiorespons ondersteunt.
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
      </Tab>
      <Tab title="Image and video generation">
        Videomogelijkheden gebruiken een **modusbewuste** vorm: `generate`,
        `imageToVideo` en `videoToVideo`. Platte aggregatievelden zoals
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` zijn niet
        voldoende om ondersteuning voor transformatiemodi of uitgeschakelde modi helder te
        adverteren. Muziekgeneratie volgt hetzelfde patroon met expliciete `generate` /
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

Providerplugins worden op dezelfde manier gepubliceerd als elke andere externe codeplugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Gebruik hier niet de verouderde alias voor alleen Skills; pluginpakketten moeten
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

| Volgorde  | Wanneer       | Gebruiksscenario                              |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | Eerste pass   | Eenvoudige API-key-providers                  |
| `profile` | Na simple     | Providers die afhankelijk zijn van auth-profielen |
| `paired`  | Na profile    | Meerdere gerelateerde vermeldingen samenstellen |
| `late`    | Laatste pass  | Bestaande providers overschrijven (wint bij botsing) |

## Volgende stappen

- [Channelplugins](/nl/plugins/sdk-channel-plugins) — als je plugin ook een kanaal biedt
- [SDK-runtime](/nl/plugins/sdk-runtime) — `api.runtime`-helpers (TTS, zoeken, subagent)
- [SDK-overzicht](/nl/plugins/sdk-overview) — volledige referentie voor subpad-imports
- [Plugin-internals](/nl/plugins/architecture-internals#provider-runtime-hooks) — hookdetails en gebundelde voorbeelden

## Gerelateerd

- [Plugin SDK-installatie](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Channelplugins bouwen](/nl/plugins/sdk-channel-plugins)
