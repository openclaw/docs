---
read_when:
    - Je bouwt een nieuwe modelprovider-Plugin
    - Je wilt een OpenAI-compatibele proxy of aangepaste LLM toevoegen aan OpenClaw
    - Je moet providerauthenticatie, catalogi en runtime-hooks begrijpen
sidebarTitle: Provider plugins
summary: Stapsgewijze handleiding voor het bouwen van een modelprovider-Plugin voor OpenClaw
title: Providerplugins bouwen
x-i18n:
    generated_at: "2026-05-06T09:26:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Deze gids behandelt het bouwen van een provider-Plugin die een modelprovider
(LLM) toevoegt aan OpenClaw. Aan het einde heb je een provider met een modelcatalogus,
API-sleutelauthenticatie en dynamische modelresolutie.

<Info>
  Als je nog niet eerder een OpenClaw-Plugin hebt gebouwd, lees dan eerst
  [Aan de slag](/nl/plugins/building-plugins) voor de basispakketstructuur
  en manifestconfiguratie.
</Info>

<Tip>
  Provider-Plugins voegen modellen toe aan de normale inferentielus van OpenClaw. Als het model
  via een native agentdaemon moet draaien die eigenaar is van threads, Compaction of tool-
  events, combineer de provider dan met een [agent-harnas](/nl/plugins/sdk-agent-harness)
  in plaats van daemonprotocolgegevens in core te plaatsen.
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

    Het manifest declareert `providerAuthEnvVars`, zodat OpenClaw
    referenties kan detecteren zonder je Plugin-runtime te laden. Voeg `providerAuthAliases`
    toe wanneer een providervariant de authenticatie van een andere provider-id moet hergebruiken. `modelSupport`
    is optioneel en laat OpenClaw je provider-Plugin automatisch laden op basis van korte
    model-id's zoals `acme-large` voordat runtime-hooks bestaan. Als je de
    provider publiceert op ClawHub, zijn die velden `openclaw.compat` en `openclaw.build`
    verplicht in `package.json`.

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

    Dit is een werkende provider. Gebruikers kunnen nu
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
    OpenClaw zijn eigen controlemarkeringen of kanaalbezorging parseert.

    Voor gebundelde providers die slechts één tekstprovider met API-sleutel-
    authenticatie plus één door catalogus ondersteunde runtime registreren, geef je de voorkeur aan de specifiekere
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
    providerauthenticatie kan oplossen. Het mag providerspecifieke ontdekking uitvoeren. Gebruik
    `buildStaticProvider` alleen voor offline rijen die veilig kunnen worden getoond voordat authenticatie
    is geconfigureerd; het mag geen referenties vereisen of netwerkverzoeken doen.
    De weergave `models list --all` van OpenClaw voert momenteel statische catalogi
    alleen uit voor gebundelde provider-Plugins, met een lege config, lege env en geen
    agent-/werkruimtepaden.

    Als je authenticatiestroom ook `models.providers.*`, aliassen en
    het standaardmodel van de agent tijdens onboarding moet patchen, gebruik dan de presethelpers uit
    `openclaw/plugin-sdk/provider-onboard`. De smalste helpers zijn
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` en
    `createModelCatalogPresetAppliers(...)`.

    Wanneer het native endpoint van een provider gestreamde usage-blokken ondersteunt op het
    normale `openai-completions`-transport, geef je de voorkeur aan de gedeelde catalogushelpers in
    `openclaw/plugin-sdk/provider-catalog-shared` in plaats van provider-id-controles
    hard te coderen. `supportsNativeStreamingUsageCompat(...)` en
    `applyProviderNativeStreamingUsageCompat(...)` detecteren ondersteuning uit de
    endpoint-capabilitymap, zodat native Moonshot-/DashScope-achtige endpoints nog steeds
    opt-in gebruiken, zelfs wanneer een Plugin een aangepaste provider-id gebruikt.

  </Step>

  <Step title="Dynamische modelresolutie toevoegen">
    Als je provider willekeurige model-id's accepteert (zoals een proxy of router),
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

    Als resolutie een netwerkoproep vereist, gebruik dan `prepareDynamicModel` voor asynchrone
    opwarming - `resolveDynamicModel` wordt opnieuw uitgevoerd nadat dit is voltooid.

  </Step>

  <Step title="Runtime-hooks toevoegen (indien nodig)">
    De meeste providers hebben alleen `catalog` + `resolveDynamicModel` nodig. Voeg hooks
    incrementeel toe wanneer je provider ze vereist.

    Gedeelde helperbouwers dekken nu de meest voorkomende replay-/toolcompatibiliteits-
    families, dus Plugins hoeven elke hook meestal niet één voor één handmatig te bedraden:

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

    Vandaag beschikbare replayfamilies:

    | Familie | Wat er wordt aangesloten | Gebundelde voorbeelden |
    | --- | --- | --- |
    | `openai-compatible` | Gedeeld replaybeleid in OpenAI-stijl voor OpenAI-compatibele transports, inclusief sanering van tool-call-id's, correcties voor assistant-first-volgorde en generieke Gemini-turnvalidatie waar het transport dat nodig heeft | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewust replaybeleid gekozen op basis van `modelId`, zodat Anthropic-berichttransports alleen Claude-specifieke opschoning van thinking-blokken krijgen wanneer het opgeloste model daadwerkelijk een Claude-id is | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-replaybeleid plus bootstrap-replaysanering en getagde modus voor reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanering van Gemini thought-signatures voor Gemini-modellen die via OpenAI-compatibele proxytransports draaien; schakelt native Gemini-replayvalidatie of bootstrap-herschrijvingen niet in | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride beleid voor providers die Anthropic-bericht- en OpenAI-compatibele modeloppervlakken in één Plugin combineren; optioneel Claude-only verwijderen van thinking-blokken blijft beperkt tot de Anthropic-kant | `minimax` |

    Beschikbare streamfamilies vandaag:

    | Familie | Wat ermee wordt aangesloten | Meegeleverde voorbeelden |
    | --- | --- | --- |
    | `google-thinking` | Normalisatie van Gemini-denkpayloads op het gedeelde streampad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-redeneerwrapper op het gedeelde proxy-streampad, waarbij `kilo/auto` en niet-ondersteunde proxy-redeneer-id's geïnjecteerd denken overslaan | `kilocode` |
    | `moonshot-thinking` | Moonshot binaire native-thinking-payloadmapping vanuit configuratie + `/think`-niveau | `moonshot` |
    | `minimax-fast-mode` | MiniMax fast-mode-modelherschrijving op het gedeelde streampad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gedeelde native OpenAI/Codex Responses-wrappers: attributieheaders, `/fast`/`serviceTier`, tekstuitvoerigheid, native Codex-webzoekfunctie, reasoning-compat-payloadvorming en Responses-contextbeheer | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter-redeneerwrapper voor proxyroutes, met centraal afgehandelde skips voor niet-ondersteunde modellen/`auto` | `openrouter` |
    | `tool-stream-default-on` | Standaard ingeschakelde `tool_stream`-wrapper voor providers zoals Z.AI die toolstreaming willen tenzij dit expliciet is uitgeschakeld | `zai` |

    <Accordion title="SDK-seams die de familiebouwers aandrijven">
      Elke familiebouwer is opgebouwd uit publieke helpers op lager niveau die uit hetzelfde pakket worden geëxporteerd, waarop je kunt terugvallen wanneer een provider moet afwijken van het gemeenschappelijke patroon:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` en de ruwe replaybouwers (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporteert ook Gemini-replayhelpers (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) en endpoint-/modelhelpers (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus de gedeelde OpenAI/Codex-wrappers (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI-compatibele wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages-opruiming van thinking-prefill (`createAnthropicThinkingPrefillPayloadWrapper`) en gedeelde proxy-/providerwrappers (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, onderliggende Gemini-schemahelpers (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) en xAI-compathelpers (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). De meegeleverde xAI-Plugin gebruikt `normalizeResolvedModel` + `contributeResolvedModelCompat` hiermee om xAI-regels eigendom van de provider te houden.

      Sommige streamhelpers blijven bewust provider-lokaal. `@openclaw/anthropic-provider` houdt `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` en de Anthropic-wrapperbouwers op lager niveau in zijn eigen publieke `api.ts` / `contract-api.ts`-seam omdat ze Claude OAuth-betaverwerking en `context1m`-gating coderen. De xAI-Plugin houdt native xAI Responses-vorming op vergelijkbare wijze in zijn eigen `wrapStreamFn` (`/fast`-aliassen, standaard `tool_stream`, opschoning van niet-ondersteunde strikte tools, xAI-specifieke verwijdering van redeneerpayloads).

      Hetzelfde pakketrootpatroon ondersteunt ook `@openclaw/openai-provider` (providerbouwers, helpers voor standaardmodellen, realtime-providerbouwers) en `@openclaw/openrouter-provider` (providerbouwer plus onboarding-/configuratiehelpers).
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
        Voor providers die aangepaste aanvraagheaders of body-aanpassingen nodig hebben:

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
        Voor providers die native aanvraag-/sessieheaders of metadata nodig hebben op
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
      OpenClaw roept hooks in deze volgorde aan. De meeste providers gebruiken er slechts 2-3:
      Provider-velden alleen voor compatibiliteit die OpenClaw niet meer aanroept, zoals
      `ProviderPlugin.capabilities` en `suppressBuiltInModel`, worden hier niet vermeld.

      | # | Hook | Wanneer te gebruiken |
      | --- | --- | --- |
      | 1 | `catalog` | Modelcatalogus of standaardwaarden voor base-URL |
      | 2 | `applyConfigDefaults` | Globale provider-eigen standaardwaarden tijdens configuratiematerialisatie |
      | 3 | `normalizeModelId` | Opschoning van legacy-/preview-model-id-aliassen vóór lookup |
      | 4 | `normalizeTransport` | Opschoning van providerfamilie-`api` / `baseUrl` vóór generieke modelassemblage |
      | 5 | `normalizeConfig` | `models.providers.<id>`-configuratie normaliseren |
      | 6 | `applyNativeStreamingUsageCompat` | Native streaminggebruik-compat-herschrijvingen voor configuratieproviders |
      | 7 | `resolveConfigApiKey` | Provider-eigen env-marker-authenticatieresolutie |
      | 8 | `resolveSyntheticAuth` | Lokale/self-hosted of configuratie-ondersteunde synthetische authenticatie |
      | 9 | `shouldDeferSyntheticProfileAuth` | Synthetische opgeslagen-profielplaceholders achter env-/configuratieauthenticatie plaatsen |
      | 10 | `resolveDynamicModel` | Willekeurige upstream-model-id's accepteren |
      | 11 | `prepareDynamicModel` | Asynchrone metadatafetch vóór resolutie |
      | 12 | `normalizeResolvedModel` | Transportherschrijvingen vóór de runner |
      | 13 | `contributeResolvedModelCompat` | Compat-flags voor vendormodellen achter een ander compatibel transport |
      | 14 | `normalizeToolSchemas` | Provider-eigen opschoning van toolschema's vóór registratie |
      | 15 | `inspectToolSchemas` | Provider-eigen toolschema-diagnostiek |
      | 16 | `resolveReasoningOutputMode` | Contract voor getagde versus native redeneeruitvoer |
      | 17 | `prepareExtraParams` | Standaard aanvraagparams |
      | 18 | `createStreamFn` | Volledig aangepast StreamFn-transport |
      | 19 | `wrapStreamFn` | Aangepaste header-/bodywrappers op het normale streampad |
      | 20 | `resolveTransportTurnState` | Native headers/metadata per beurt |
      | 21 | `resolveWebSocketSessionPolicy` | Native WS-sessieheaders/cooldown |
      | 22 | `formatApiKey` | Aangepaste runtimetokenvorm |
      | 23 | `refreshOAuth` | Aangepaste OAuth-vernieuwing |
      | 24 | `buildAuthDoctorHint` | Richtlijnen voor auth-herstel |
      | 25 | `matchesContextOverflowError` | Provider-eigen overflowdetectie |
      | 26 | `classifyFailoverReason` | Provider-eigen classificatie van rate-limit/overbelasting |
      | 27 | `isCacheTtlEligible` | Promptcache-TTL-gating |
      | 28 | `buildMissingAuthMessage` | Aangepaste hint voor ontbrekende authenticatie |
      | 29 | `augmentModelCatalog` | Synthetische forward-compat-rijen |
      | 30 | `resolveThinkingProfile` | Modelspecifieke `/think`-optieset |
      | 31 | `isBinaryThinking` | Compatibiliteit voor binair denken aan/uit |
      | 32 | `supportsXHighThinking` | Compatibiliteit voor `xhigh`-redeneerondersteuning |
      | 33 | `resolveDefaultThinkingLevel` | Compatibiliteit voor standaard `/think`-beleid |
      | 34 | `isModernModelRef` | Live-/smoke-modelmatching |
      | 35 | `prepareRuntimeAuth` | Tokenuitwisseling vóór inference |
      | 36 | `resolveUsageAuth` | Aangepaste parsing van gebruiksreferenties |
      | 37 | `fetchUsageSnapshot` | Aangepast gebruiksendpoint |
      | 38 | `createEmbeddingProvider` | Provider-eigen embeddingadapter voor geheugen/zoeken |
      | 39 | `buildReplayPolicy` | Aangepast beleid voor transcriptreplay/Compaction |
      | 40 | `sanitizeReplayHistory` | Provider-specifieke replayherschrijvingen na generieke opschoning |
      | 41 | `validateReplayTurns` | Strikte replay-beurtvalidatie vóór de ingesloten runner |
      | 42 | `onModelSelected` | Callback na selectie (bijv. telemetrie) |

      Runtime-fallbacknotities:

      - `normalizeConfig` controleert eerst de gematchte provider en daarna andere hook-capabele providerplugins totdat één daarvan de configuratie daadwerkelijk wijzigt. Als geen providerhook een ondersteunde Google-familieconfiguratie-entry herschrijft, wordt de meegeleverde Google-configuratienormalizer alsnog toegepast.
      - `resolveConfigApiKey` gebruikt de providerhook wanneer die beschikbaar is. Het meegeleverde `amazon-bedrock`-pad heeft hier ook een ingebouwde AWS env-marker-resolver, ook al gebruikt Bedrock-runtimeauthenticatie zelf nog steeds de standaardketen van de AWS SDK.
      - `resolveSystemPromptContribution` laat een provider cachebewuste systeemprompt-richtlijnen injecteren voor een modelfamilie. Gebruik dit bij voorkeur boven `before_prompt_build` wanneer het gedrag bij één provider-/modelfamilie hoort en de stabiele/dynamische cachesplitsing moet behouden.

      Zie [Internals: Provider Runtime Hooks](/nl/plugins/architecture-internals#provider-runtime-hooks) voor gedetailleerde beschrijvingen en praktijkvoorbeelden.
    </Accordion>

  </Step>

  <Step title="Extra mogelijkheden toevoegen (optioneel)">
    ### Stap 5: Extra mogelijkheden toevoegen

    Een providerplugin kan spraak, realtime transcriptie, realtime
    stem, mediabegrip, beeldgeneratie, videogeneratie, webfetch,
    en webzoekfunctie registreren naast tekstinference. OpenClaw classificeert dit als een
    **hybrid-capability**-Plugin - het aanbevolen patroon voor bedrijfsplugins
    (één Plugin per vendor). Zie
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
        plugins dezelfde begrensde verwerking van foutbody's, JSON-foutparsing en
        request-id-achtervoegsels gebruiken.
      </Tab>
      <Tab title="Realtime transcriptie">
        Geef de voorkeur aan `createRealtimeTranscriptionWebSocketSession(...)` - de gedeelde
        helper handelt proxy-capture, reconnect-backoff, close-flushing, ready-handshakes,
        audiowachtrijen en diagnostiek van close-events af. Je plugin
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
        `openclaw/plugin-sdk/provider-http` gebruiken. De helper normaliseert uploadbestandsnamen,
        inclusief AAC-uploads die voor compatibele transcriptie-API's een M4A-achtige bestandsnaam
        nodig hebben.
      </Tab>
      <Tab title="Realtime-spraak">
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

        Declareer `capabilities`, zodat `talk.catalog` geldige modi,
        transports, audioformaten en featureflags kan tonen aan browser- en native Talk-
        clients. Implementeer `handleBargeIn` wanneer een transport kan detecteren dat een
        mens het afspelen door de assistent onderbreekt en de provider ondersteuning biedt voor
        het inkorten of wissen van de actieve audiorespons.
      </Tab>
      <Tab title="Mediabegrip">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Afbeeldings- en videogeneratie">
        Videomogelijkheden gebruiken een **modusbewuste** structuur: `generate`,
        `imageToVideo` en `videoToVideo`. Platte aggregatievelden zoals
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` zijn niet
        genoeg om ondersteuning voor transformatiemodi of uitgeschakelde modi netjes te
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
      <Tab title="Web ophalen en zoeken">
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

Providerplugins worden op dezelfde manier gepubliceerd als elke andere externe codeplugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Gebruik hier niet de verouderde publish-alias voor alleen Skills; pluginpakketten moeten
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

| Volgorde  | Wanneer      | Gebruiksscenario                              |
| --------- | ------------ | --------------------------------------------- |
| `simple`  | Eerste ronde | Gewone providers met API-sleutel              |
| `profile` | Na simple    | Providers die afhankelijk zijn van authenticatieprofielen |
| `paired`  | Na profile   | Meerdere gerelateerde vermeldingen samenstellen |
| `late`    | Laatste ronde | Bestaande providers overschrijven (wint bij conflict) |

## Volgende stappen

- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - als je plugin ook een kanaal aanbiedt
- [SDK-runtime](/nl/plugins/sdk-runtime) - `api.runtime`-helpers (TTS, zoeken, subagent)
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige referentie voor subpath-imports
- [Interne Plugin-details](/nl/plugins/architecture-internals#provider-runtime-hooks) - hookdetails en gebundelde voorbeelden

## Gerelateerd

- [Plugin SDK instellen](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Kanaalplugins bouwen](/nl/plugins/sdk-channel-plugins)
