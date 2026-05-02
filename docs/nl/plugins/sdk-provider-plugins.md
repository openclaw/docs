---
read_when:
    - Je bouwt een nieuwe Plugin voor een modelprovider
    - Je wilt een OpenAI-compatibele proxy of aangepaste LLM aan OpenClaw toevoegen
    - Je moet provider-authenticatie, catalogi en runtime-hooks begrijpen
sidebarTitle: Provider plugins
summary: Stapsgewijze handleiding voor het bouwen van een modelprovider-Plugin voor OpenClaw
title: Providerplugins bouwen
x-i18n:
    generated_at: "2026-05-02T22:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Deze handleiding begeleidt je bij het bouwen van een provider-Plugin die een modelprovider
(LLM) aan OpenClaw toevoegt. Aan het einde heb je een provider met een modelcatalogus,
API-sleutelauthenticatie en dynamische modelresolutie.

<Info>
  Als je nog nooit eerder een OpenClaw-Plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basisstructuur van het pakket
  en het instellen van het manifest.
</Info>

<Tip>
  Provider-Plugins voegen modellen toe aan de normale inferentielus van OpenClaw. Als het model
  via een native agent-daemon moet lopen die eigenaar is van threads, Compaction of tool-
  gebeurtenissen, combineer de provider dan met een [agent-harnas](/nl/plugins/sdk-agent-harness)
  in plaats van daemonprotocol-details in core te plaatsen.
</Tip>

## Stapsgewijze handleiding

<Steps>
  <Step title="Pakket en manifest">
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

    Het manifest declareert `providerAuthEnvVars` zodat OpenClaw
    referenties kan detecteren zonder je Plugin-runtime te laden. Voeg `providerAuthAliases`
    toe wanneer een providervariant de authenticatie van een andere provider-id moet hergebruiken. `modelSupport`
    is optioneel en laat OpenClaw je provider-Plugin automatisch laden vanuit verkorte
    model-id's zoals `acme-large` voordat runtime-hooks bestaan. Als je de
    provider op ClawHub publiceert, zijn die velden `openclaw.compat` en `openclaw.build`
    vereist in `package.json`.

  </Step>

  <Step title="De provider registreren">
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

    Als de upstreamprovider andere controletokens gebruikt dan OpenClaw, voeg dan een
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
    transport. `output` herschrijft assistenttekstdelta's en definitieve tekst voordat
    OpenClaw zijn eigen controlemarkeringen of kanaallevering parseert.

    Voor gebundelde providers die slechts één tekstprovider registreren met API-sleutel-
    authenticatie plus één catalogusgebaseerde runtime, geef je de voorkeur aan de smallere
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
    provider-authenticatie kan oplossen. Het mag provider-specifieke ontdekking uitvoeren. Gebruik
    `buildStaticProvider` alleen voor offline rijen die veilig kunnen worden getoond voordat authenticatie
    is geconfigureerd; het mag geen referenties vereisen of netwerkverzoeken doen.
    De weergave `models list --all` van OpenClaw voert momenteel statische catalogi
    alleen uit voor gebundelde provider-Plugins, met een lege configuratie, lege omgeving en geen
    agent-/werkruimtepaden.

    Als je authenticatiestroom ook `models.providers.*`, aliassen en
    het standaardmodel van de agent tijdens onboarding moet aanpassen, gebruik dan de preset-helpers uit
    `openclaw/plugin-sdk/provider-onboard`. De smalste helpers zijn
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` en
    `createModelCatalogPresetAppliers(...)`.

    Wanneer een native endpoint van een provider gestreamde gebruiksblokken ondersteunt op het
    normale `openai-completions`-transport, geef dan de voorkeur aan de gedeelde catalogushelpers in
    `openclaw/plugin-sdk/provider-catalog-shared` in plaats van provider-id-controles
    hard te coderen. `supportsNativeStreamingUsageCompat(...)` en
    `applyProviderNativeStreamingUsageCompat(...)` detecteren ondersteuning vanuit de
    endpoint-capabilitymap, zodat native Moonshot-/DashScope-achtige endpoints nog steeds
    opt-innen, zelfs wanneer een Plugin een aangepaste provider-id gebruikt.

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

    Als resolveren een netwerkoproep vereist, gebruik dan `prepareDynamicModel` voor asynchrone
    warming-up — `resolveDynamicModel` wordt opnieuw uitgevoerd nadat dit is voltooid.

  </Step>

  <Step title="Runtime-hooks toevoegen (indien nodig)">
    De meeste providers hebben alleen `catalog` + `resolveDynamicModel` nodig. Voeg hooks
    incrementeel toe naarmate je provider ze vereist.

    Gedeelde helper-builders dekken nu de meest voorkomende replay-/toolcompatibiliteits-
    families, zodat Plugins meestal niet elke hook één voor één handmatig hoeven te bekabelen:

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

    | Familie | Wat wordt bekabeld | Gebundelde voorbeelden |
    | --- | --- | --- |
    | `openai-compatible` | Gedeeld OpenAI-stijl replaybeleid voor OpenAI-compatibele transporten, inclusief sanering van tool-call-id's, oplossingen voor assistant-first-volgorde en generieke Gemini-turnvalidatie waar het transport die nodig heeft | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewust replaybeleid gekozen door `modelId`, zodat Anthropic-message-transporten alleen Claude-specifieke thinking-block-opschoning krijgen wanneer het opgeloste model daadwerkelijk een Claude-id is | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-replaybeleid plus bootstrap-replaysanering en getagde reasoning-output-modus | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanering van Gemini thought-signatures voor Gemini-modellen die via OpenAI-compatibele proxytransporten draaien; schakelt geen native Gemini-replayvalidatie of bootstrap-herschrijvingen in | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride beleid voor providers die Anthropic-message- en OpenAI-compatibele modeloppervlakken in één Plugin combineren; optioneel Claude-only thinking-block-verwijderen blijft beperkt tot de Anthropic-kant | `minimax` |

    Beschikbare streamfamilies vandaag:

    | Familie | Wat deze aansluit | Meegeleverde voorbeelden |
    | --- | --- | --- |
    | `google-thinking` | Normalisatie van Gemini-denkpayloads op het gedeelde streampad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-redeneerwrapper op het gedeelde proxystreampad, waarbij `kilo/auto` en niet-ondersteunde proxy-redeneer-id's geïnjecteerd denken overslaan | `kilocode` |
    | `moonshot-thinking` | Toewijzing van native binaire denkpayloads van Moonshot vanuit configuratie + `/think`-niveau | `moonshot` |
    | `minimax-fast-mode` | MiniMax-herschrijving van fast-mode-modellen op het gedeelde streampad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gedeelde native OpenAI/Codex Responses-wrappers: attributieheaders, `/fast`/`serviceTier`, tekstuitgebreidheid, native Codex-webzoekfunctie, reasoning-compat-payloadvorming en Responses-contextbeheer | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter-redeneerwrapper voor proxyroutes, waarbij overslaan voor niet-ondersteunde modellen/`auto` centraal wordt afgehandeld | `openrouter` |
    | `tool-stream-default-on` | Standaard ingeschakelde `tool_stream`-wrapper voor providers zoals Z.AI die toolstreaming willen tenzij expliciet uitgeschakeld | `zai` |

    <Accordion title="SDK-seams die de familiebouwers aandrijven">
      Elke familiebouwer is samengesteld uit lagere publieke helpers die vanuit hetzelfde pakket worden geëxporteerd en die je kunt gebruiken wanneer een provider van het algemene patroon moet afwijken:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` en de onbewerkte replaybouwers (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporteert ook Gemini-replayhelpers (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) en endpoint-/modelhelpers (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus de gedeelde OpenAI/Codex-wrappers (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI-compatibele wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), opschoning van Anthropic Messages-denkvoorinvulling (`createAnthropicThinkingPrefillPayloadWrapper`) en gedeelde proxy-/providerwrappers (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, onderliggende Gemini-schemahelpers (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) en xAI-compathelpers (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). De meegeleverde xAI-Plugin gebruikt `normalizeResolvedModel` + `contributeResolvedModelCompat` hiermee om xAI-regels eigendom van de provider te houden.

      Sommige streamhelpers blijven bewust providerlokaal. `@openclaw/anthropic-provider` houdt `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` en de lagere Anthropic-wrapperbouwers in zijn eigen publieke `api.ts` / `contract-api.ts`-seam omdat ze Claude OAuth-bèta-afhandeling en `context1m`-gating coderen. De xAI-Plugin houdt native xAI Responses-vorming eveneens in zijn eigen `wrapStreamFn` (`/fast`-aliassen, standaard `tool_stream`, opschoning van niet-ondersteunde strikte tools, xAI-specifieke verwijdering van redeneerpayloads).

      Hetzelfde pakketrootpatroon ondersteunt ook `@openclaw/openai-provider` (providerbouwers, helpers voor standaardmodellen, realtime providerbouwers) en `@openclaw/openrouter-provider` (providerbouwer plus onboarding-/configuratiehelpers).
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
        Voor providers die gebruiks-/factureringsgegevens beschikbaar maken:

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
      `ProviderPlugin.capabilities` en `suppressBuiltInModel`, staan hier
      niet vermeld.

      | # | Hook | Wanneer gebruiken |
      | --- | --- | --- |
      | 1 | `catalog` | Modelcatalogus of standaardwaarden voor basis-URL |
      | 2 | `applyConfigDefaults` | Provider-eigen globale standaardwaarden tijdens configuratiematerialisatie |
      | 3 | `normalizeModelId` | Opschoning van verouderde/preview-model-id-aliassen vóór lookup |
      | 4 | `normalizeTransport` | Opschoning van providerfamilie-`api` / `baseUrl` vóór generieke modelsamenstelling |
      | 5 | `normalizeConfig` | Normaliseer `models.providers.<id>`-configuratie |
      | 6 | `applyNativeStreamingUsageCompat` | Native compat-herschrijvingen voor streaminggebruik voor configuratieproviders |
      | 7 | `resolveConfigApiKey` | Provider-eigen auth-resolutie van env-markers |
      | 8 | `resolveSyntheticAuth` | Lokale/zelfgehoste of configuratiegedragen synthetische auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | Verlaag synthetische opgeslagen-profiel-placeholders achter env-/configuratie-auth |
      | 10 | `resolveDynamicModel` | Accepteer willekeurige upstream model-ID's |
      | 11 | `prepareDynamicModel` | Asynchrone metadatafetch vóór resolutie |
      | 12 | `normalizeResolvedModel` | Transportherschrijvingen vóór de runner |
      | 13 | `contributeResolvedModelCompat` | Compat-flags voor vendormodellen achter een ander compatibel transport |
      | 14 | `normalizeToolSchemas` | Provider-eigen opschoning van toolschema's vóór registratie |
      | 15 | `inspectToolSchemas` | Provider-eigen diagnostiek voor toolschema's |
      | 16 | `resolveReasoningOutputMode` | Gelabeld versus native contract voor redeneeruitvoer |
      | 17 | `prepareExtraParams` | Standaard requestparameters |
      | 18 | `createStreamFn` | Volledig aangepaste StreamFn-transport |
      | 19 | `wrapStreamFn` | Aangepaste header-/bodywrappers op het normale streampad |
      | 20 | `resolveTransportTurnState` | Native headers/metadata per beurt |
      | 21 | `resolveWebSocketSessionPolicy` | Native WS-sessieheaders/cooldown |
      | 22 | `formatApiKey` | Aangepaste vorm voor runtime-token |
      | 23 | `refreshOAuth` | Aangepaste OAuth-refresh |
      | 24 | `buildAuthDoctorHint` | Richtlijnen voor auth-reparatie |
      | 25 | `matchesContextOverflowError` | Provider-eigen overloopdetectie |
      | 26 | `classifyFailoverReason` | Provider-eigen classificatie van rate-limit/overbelasting |
      | 27 | `isCacheTtlEligible` | TTL-gating voor promptcache |
      | 28 | `buildMissingAuthMessage` | Aangepaste hint voor ontbrekende auth |
      | 29 | `augmentModelCatalog` | Synthetische rijen voor voorwaartse compatibiliteit |
      | 30 | `resolveThinkingProfile` | Modelspecifieke `/think`-optieset |
      | 31 | `isBinaryThinking` | Compatibiliteit voor binair denken aan/uit |
      | 32 | `supportsXHighThinking` | Compatibiliteit voor `xhigh`-redeneerondersteuning |
      | 33 | `resolveDefaultThinkingLevel` | Compatibiliteit voor standaard `/think`-beleid |
      | 34 | `isModernModelRef` | Live-/smoke-modelmatching |
      | 35 | `prepareRuntimeAuth` | Tokenuitwisseling vóór inference |
      | 36 | `resolveUsageAuth` | Aangepaste parsing van gebruiksreferenties |
      | 37 | `fetchUsageSnapshot` | Aangepast gebruiksendpoint |
      | 38 | `createEmbeddingProvider` | Provider-eigen embeddingadapter voor geheugen/zoeken |
      | 39 | `buildReplayPolicy` | Aangepast transcriptreplay-/Compaction-beleid |
      | 40 | `sanitizeReplayHistory` | Provider-specifieke replayherschrijvingen na generieke opschoning |
      | 41 | `validateReplayTurns` | Strikte validatie van replaybeurten vóór de ingebedde runner |
      | 42 | `onModelSelected` | Callback na selectie (bijv. telemetrie) |

      Runtime-fallbacknotities:

      - `normalizeConfig` controleert eerst de gematchte provider, daarna andere hook-capabele providerplugins totdat er één de configuratie daadwerkelijk wijzigt. Als geen providerhook een ondersteunde Google-familieconfiguratievermelding herschrijft, wordt de meegeleverde Google-configuratienormalisator alsnog toegepast.
      - `resolveConfigApiKey` gebruikt de providerhook wanneer die beschikbaar is. Het meegeleverde `amazon-bedrock`-pad heeft hier ook een ingebouwde AWS env-marker-resolver, ook al gebruikt Bedrock runtime-auth zelf nog steeds de standaardketen van de AWS SDK.
      - `resolveSystemPromptContribution` laat een provider cachebewuste systeempropmpt-richtlijnen injecteren voor een modelfamilie. Geef hieraan de voorkeur boven `before_prompt_build` wanneer het gedrag bij één provider-/modelfamilie hoort en de stabiele/dynamische cachesplitsing moet behouden.

      Zie [Internals: Provider Runtime Hooks](/nl/plugins/architecture-internals#provider-runtime-hooks) voor gedetailleerde beschrijvingen en praktijkvoorbeelden.
    </Accordion>

  </Step>

  <Step title="Voeg extra mogelijkheden toe (optioneel)">
    ### Stap 5: Voeg extra mogelijkheden toe

    Een provider-Plugin kan spraak, realtime transcriptie, realtime
    stem, mediabegrip, beeldgeneratie, videogeneratie, webfetch,
    en webzoeken naast tekst-inference registreren. OpenClaw classificeert dit als een
    **hybrid-capability**-Plugin — het aanbevolen patroon voor bedrijfsplugins
    (één Plugin per vendor). Zie
    [Internals: Capability Ownership](/nl/plugins/architecture#capability-ownership-model).

    Registreer elke mogelijkheid binnen `register(api)` naast je bestaande
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
        plugins beperkte reads van foutbody's, JSON-foutparsing en
        request-id-achtervoegsels delen.
      </Tab>
      <Tab title="Realtime transcription">
        Geef de voorkeur aan `createRealtimeTranscriptionWebSocketSession(...)` — de gedeelde
        helper handelt proxy-capture, reconnect-backoff, close-flushing, ready-
        handshakes, audio-queueing en diagnostiek voor close-events af. Je plugin
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
        genoeg om ondersteuning voor transformatiemodi of uitgeschakelde modi netjes te adverteren.
        Muziekgeneratie volgt hetzelfde patroon met expliciete `generate`- /
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

Gebruik hier niet de verouderde alias voor alleen Skills; plugin-pakketten moeten
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

| Volgorde  | Wanneer       | Gebruikssituatie                               |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Eerste pass   | Eenvoudige API-key-providers                    |
| `profile` | Na simple     | Providers die worden afgeschermd door auth-profielen |
| `paired`  | Na profile    | Meerdere gerelateerde items synthetiseren       |
| `late`    | Laatste pass  | Bestaande providers overschrijven (wint bij conflict) |

## Volgende stappen

- [Channel-plugins](/nl/plugins/sdk-channel-plugins) — als je plugin ook een channel biedt
- [SDK-runtime](/nl/plugins/sdk-runtime) — `api.runtime`-helpers (TTS, zoeken, subagent)
- [SDK-overzicht](/nl/plugins/sdk-overview) — volledige importreferentie voor subpaden
- [Plugin-internals](/nl/plugins/architecture-internals#provider-runtime-hooks) — hookdetails en gebundelde voorbeelden

## Gerelateerd

- [Plugin SDK instellen](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Channel-plugins bouwen](/nl/plugins/sdk-channel-plugins)
