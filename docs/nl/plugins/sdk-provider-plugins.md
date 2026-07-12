---
read_when:
    - Je bouwt een nieuwe Plugin voor een modelprovider
    - Je wilt een OpenAI-compatibele proxy of aangepast LLM aan OpenClaw toevoegen
    - Je moet inzicht hebben in providerauthenticatie, catalogi en runtimehooks
sidebarTitle: Provider plugins
summary: Stapsgewijze handleiding voor het bouwen van een modelproviderplugin voor OpenClaw
title: Providerplugins bouwen
x-i18n:
    generated_at: "2026-07-12T09:10:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Bouw een provider-Plugin om een modelprovider (LLM) aan OpenClaw toe te voegen: een modelcatalogus, authenticatie met een API-sleutel en dynamische modelresolutie.

<Info>
  Nieuw met OpenClaw-plugins? Lees eerst [Aan de slag](/nl/plugins/building-plugins)
  voor de pakketstructuur en het instellen van het manifest.
</Info>

<Tip>
  Provider-plugins voegen modellen toe aan de normale inferentielus van OpenClaw. Als het
  model moet worden uitgevoerd via een systeemeigen agentdaemon die threads, Compaction
  of toolgebeurtenissen beheert, combineer de provider dan met een [agent-
  harness](/nl/plugins/sdk-agent-harness) in plaats van details van het daemonprotocol
  in de kern op te nemen.
</Tip>

## Stapsgewijze uitleg

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

    Met `setup.providers[].envVars` kan OpenClaw aanmeldgegevens detecteren zonder
    de runtime van je Plugin te laden. Voeg `providerAuthAliases` toe wanneer een provider-
    variant de authenticatie van een andere provider-id moet hergebruiken. `modelSupport` is
    optioneel en laat OpenClaw je provider-Plugin automatisch laden op basis van verkorte
    model-id's zoals `acme-large`, voordat runtimehooks bestaan. `openclaw.compat`
    en `openclaw.build` in `package.json` zijn vereist voor publicatie op ClawHub
    (`openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`
    zijn de twee vereiste velden; `minGatewayVersion` valt terug op
    `openclaw.install.minHostVersion` wanneer het is weggelaten).

  </Step>

  <Step title="De provider registreren">
    Een minimale tekstprovider heeft een `id`, `label`, `auth` en `catalog` nodig.
    `catalog` is de runtime-/configuratiehook die eigendom is van de provider; deze kan live
    leveranciers-API's aanroepen en retourneert vermeldingen voor `models.providers`.

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

    `registerModelCatalogProvider` is het nieuwere catalogusoppervlak van het besturingsvlak
    voor de UI voor lijsten, hulp en keuzelijsten, met rijen voor `text`, `voice`, `image_generation`,
    `video_generation` en `music_generation`. Houd aanroepen naar leveranciersendpoints
    en responstoewijzing in de Plugin; OpenClaw beheert de gedeelde rijstructuur,
    bronlabels en hulpweergave.

    Dit is een werkende provider. Gebruikers kunnen nu
    `openclaw onboard --acme-ai-api-key <key>` uitvoeren en
    `acme-ai/acme-large` als hun model selecteren.

    ### Live modeldetectie

    Als je provider een API in `/models`-stijl aanbiedt, houd dan het providerspecifieke
    endpoint en de projectie van rijen in je Plugin en gebruik
    `openclaw/plugin-sdk/provider-catalog-live-runtime` voor de gedeelde ophaal-
    levenscyclus. De helper biedt beveiligde HTTP-ophaalacties, headers voor provider-authenticatie,
    gestructureerde HTTP-fouten, TTL-caching en statisch terugvalgedrag zonder
    providerbeleid in de OpenClaw-kern op te nemen.

    Gebruik `buildLiveModelProviderConfig` wanneer de live-API je alleen vertelt welke
    statische catalogusrijen van de provider momenteel beschikbaar zijn:

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
    metagegevens retourneert en de Plugin zelf rijen naar OpenClaw-
    modeldefinities moet projecteren:

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

    `run` moet door authenticatie afgeschermd blijven en `null` retourneren wanneer geen bruikbaar
    aanmeldgegeven beschikbaar is. Behoud een offline `staticRun` of statische terugvaloptie, zodat installatie, documentatie,
    tests en keuzeoppervlakken niet afhankelijk zijn van live netwerktoegang. Gebruik een TTL
    die geschikt is voor de actualiteit van de modellenlijst, vermijd bestandssysteempolling tijdens aanvragen
    en geef alleen een providerspecifieke `readRows` / `readModelId` door wanneer de
    upstreamrespons niet de OpenAI-compatibele structuur `{ data: [{ id, object }] }`
    heeft.

    Als de upstreamprovider andere besturingstokens gebruikt dan OpenClaw, voeg dan een
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

    `input` herschrijft de uiteindelijke systeemprompt en de inhoud van tekstberichten vóór
    het transport. `output` herschrijft tekstuele delta's van de assistent en de uiteindelijke tekst voordat
    OpenClaw zijn eigen besturingsmarkeringen parseert of levering via het kanaal uitvoert.

    Voor meegeleverde providers die slechts één tekstprovider registreren met authenticatie via een API-sleutel
    plus één runtime op basis van een catalogus, geef je de voorkeur aan de beperktere
    helper `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI-modelprovider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API-sleutel",
            hint: "API-sleutel uit je Acme AI-dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Voer je Acme AI API-sleutel in",
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

    `buildProvider` is het live cataloguspad dat wordt gebruikt wanneer OpenClaw
    echte providerauthenticatie kan vinden. Het mag providerspecifieke detectie
    uitvoeren. Gebruik `buildStaticProvider` alleen voor offlineregels die veilig
    kunnen worden weergegeven voordat authenticatie is geconfigureerd; hiervoor
    mogen geen inloggegevens of netwerkverzoeken nodig zijn. De weergave van
    OpenClaws `models list --all` voert statische catalogi momenteel alleen uit
    voor meegeleverde providerplugins, met een lege configuratie, lege
    omgevingsvariabelen en zonder agent-/werkruimtepaden.

    Als je authenticatiestroom tijdens de onboarding ook `models.providers.*`,
    aliassen en het standaardmodel van de agent moet aanpassen, gebruik je de
    vooraf ingestelde helpers uit `openclaw/plugin-sdk/provider-onboard`. De
    meest specifieke helpers zijn `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` en
    `createModelCatalogPresetAppliers(...)`.

    Wanneer het systeemeigen eindpunt van een provider gestreamde
    gebruiksblokken ondersteunt via het normale `openai-completions`-transport,
    geef je de voorkeur aan de gedeelde catalogushelpers in
    `openclaw/plugin-sdk/provider-catalog-shared` in plaats van controles op
    provider-id's hard te coderen. `supportsNativeStreamingUsageCompat(...)` en
    `applyProviderNativeStreamingUsageCompat(...)` detecteren ondersteuning via
    de mogelijkhedenkaart van het eindpunt, zodat systeemeigen eindpunten in
    Moonshot-/DashScope-stijl zich nog steeds kunnen aanmelden, zelfs wanneer
    een plugin een aangepaste provider-id gebruikt.

    De bovenstaande voorbeelden voor live detectie behandelen provider-API's in
    `/models`-stijl. Houd die detectie binnen `catalog.run`, laat deze alleen
    plaatsvinden bij bruikbare authenticatie en houd `staticRun` vrij van
    netwerkverkeer voor het offline genereren van catalogi.

  </Step>

  <Step title="Dynamische modelresolutie toevoegen">
    Als je provider willekeurige model-id's accepteert (zoals een proxy of
    router), voeg je `resolveDynamicModel` toe:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog van hierboven

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

    Als voor de resolutie een netwerkoproep nodig is, gebruik je
    `prepareDynamicModel` voor asynchrone opwarming; `resolveDynamicModel` wordt
    opnieuw uitgevoerd nadat deze is voltooid.

  </Step>

  <Step title="Runtime-hooks toevoegen (indien nodig)">
    De meeste providers hebben alleen `catalog` + `resolveDynamicModel` nodig.
    Voeg hooks stapsgewijs toe wanneer je provider ze nodig heeft.

    Gedeelde helperbouwers ondersteunen nu de meest voorkomende families voor
    herhaling en toolcompatibiliteit, zodat plugins doorgaans niet elke hook
    afzonderlijk hoeven te koppelen:

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

    Momenteel beschikbare herhalingsfamilies:

    | Familie | Wat wordt gekoppeld | Meegeleverde voorbeelden |
    | --- | --- | --- |
    | `openai-compatible` | Gedeeld herhalingsbeleid in OpenAI-stijl voor OpenAI-compatibele transporten, inclusief opschoning van tooloproep-id's, correcties voor volgorde met de assistent als eerste en algemene validatie van Gemini-beurten waar het transport dit nodig heeft | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewust herhalingsbeleid dat wordt gekozen op basis van `modelId`, zodat transporten voor Anthropic-berichten alleen Claude-specifieke opschoning van denkblokken krijgen wanneer het opgeloste model daadwerkelijk een Claude-id is | `amazon-bedrock` |
    | `native-anthropic-by-model` | Hetzelfde Claude-per-modelbeleid als `anthropic-by-model`, plus opschoning van tooloproep-id's en behoud van systeemeigen Anthropic-id's voor toolgebruik bij transporten die systeemeigen leveranciers-id's moeten behouden | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Systeemeigen Gemini-herhalingsbeleid plus opschoning van bootstrapherhalingen. De gedeelde familie behoudt uitvoer met tags voor redeneringen voor de Gemini CLI met tekstuitvoer; de directe `google`-provider overschrijft `resolveReasoningOutputMode` met `native`, omdat denkstappen van de Gemini API als systeemeigen gedachteonderdelen binnenkomen. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Opschoning van Gemini-gedachtehandtekeningen voor Gemini-modellen die via OpenAI-compatibele proxytransporten worden uitgevoerd; schakelt geen systeemeigen Gemini-herhalingsvalidatie of herschrijving van bootstrapgegevens in | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride beleid voor providers die oppervlakken voor Anthropic-berichten en OpenAI-compatibele modellen in één plugin combineren; optioneel verwijderen van denkblokken uitsluitend voor Claude blijft beperkt tot de Anthropic-zijde | `minimax` |

    Momenteel beschikbare streamfamilies:

    | Familie | Wat wordt gekoppeld | Meegeleverde voorbeelden |
    | --- | --- | --- |
    | `google-thinking` | Normalisatie van Gemini-denkpayloads op het gedeelde streampad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-redeneringswrapper op het gedeelde proxystreampad, waarbij `kilo/auto` en niet-ondersteunde proxy-id's voor redeneringen geïnjecteerde denkstappen overslaan | `kilocode` |
    | `moonshot-thinking` | Binaire toewijzing van systeemeigen denkpayloads voor Moonshot op basis van configuratie + `/think`-niveau | `moonshot` |
    | `minimax-fast-mode` | Herschrijving van MiniMax-modellen voor snelle modus op het gedeelde streampad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gedeelde systeemeigen wrappers voor OpenAI/Codex Responses: attributieheaders, `/fast`/`serviceTier`, tekstuitgebreidheid, systeemeigen Codex-webzoekopdrachten, vormgeving van payloads voor compatibiliteit met redeneringen en contextbeheer voor Responses | `openai` |
    | `openrouter-thinking` | OpenRouter-redeneringswrapper voor proxyroutes, waarbij overslaan voor niet-ondersteunde modellen/`auto` centraal wordt afgehandeld | `openrouter` |
    | `tool-stream-default-on` | Standaard ingeschakelde `tool_stream`-wrapper voor providers zoals Z.AI die toolstreaming willen, tenzij dit expliciet is uitgeschakeld | `zai` |

    <Accordion title="SDK-koppelvlakken waarop de familiebouwers zijn gebaseerd">
      Elke familiebouwer is samengesteld uit openbare helpers op een lager niveau
      die vanuit hetzelfde pakket worden geëxporteerd en die je kunt gebruiken
      wanneer een provider van het gebruikelijke patroon moet afwijken:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` en de onbewerkte herhalingsbouwers (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporteert ook Gemini-herhalingshelpers (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) en eindpunt-/modelhelpers (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus de gedeelde OpenAI/Codex-wrappers (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), de OpenAI-compatibele DeepSeek V4-wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), opschoning van de voorinvulling van denkstappen voor Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), compatibiliteit voor tooloproepen in platte tekst (`createPlainTextToolCallCompatWrapper`) en gedeelde proxy-/providerwrappers (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - lichtgewicht payload- en gebeurteniswrappers voor intensief gebruikte providerpaden, waaronder `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` en `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` en onderliggende schemahelpers voor providers.

      Houd voor providers uit de Gemini-familie de uitvoermodus voor redeneringen
      afgestemd op het transport. Directe providers voor de Google Gemini API
      moeten `native`-uitvoer voor redeneringen gebruiken, zodat OpenClaw
      systeemeigen gedachteonderdelen verwerkt zonder `<think>`-/
      `<final>`-promptinstructies toe te voegen. Backends in Gemini CLI-stijl die
      uitsluitend tekst verwerken en een definitief JSON-/tekstantwoord
      parseren, kunnen het gedeelde `google-gemini`-contract met tags behouden.

      Sommige streamhelpers blijven bewust lokaal bij de provider.
      `@openclaw/anthropic-provider` behoudt `wrapAnthropicProviderStream`,
      `resolveAnthropicBetas`, `resolveAnthropicFastMode`,
      `resolveAnthropicServiceTier` en de Anthropic-wrapperbouwers op lager
      niveau in zijn eigen openbare `api.ts`-/`contract-api.ts`-koppelvlak, omdat
      deze de afhandeling van Claude OAuth-bètafuncties en `context1m`-begrenzing
      coderen. De xAI-plugin behoudt op vergelijkbare wijze de vormgeving van
      systeemeigen xAI Responses in zijn eigen `wrapStreamFn` (`/fast`-aliassen,
      standaard `tool_stream`, opschoning van niet-ondersteunde strikte tools en
      xAI-specifieke verwijdering van redeneringspayloads).

      Hetzelfde patroon voor pakketwortels ondersteunt ook
      `@openclaw/openai-provider` (providerbouwers, helpers voor standaardmodellen,
      realtime-providerbouwers) en `@openclaw/openrouter-provider`
      (providerbouwer plus helpers voor onboarding/configuratie).
    </Accordion>

    <Tabs>
      <Tab title="Tokenuitwisseling">
        Voor providers die vóór elke inferentieoproep een tokenuitwisseling nodig
        hebben:

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
        Voor providers die aangepaste aanvraagheaders of wijzigingen in de
        aanvraagbody nodig hebben:

        ```typescript
        // wrapStreamFn retourneert een StreamFn die is afgeleid van ctx.streamFn
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
      <Tab title="Systeemeigen transportidentiteit">
        Voor providers die systeemeigen aanvraag-/sessieheaders of metagegevens
        nodig hebben op algemene HTTP- of WebSocket-transporten:

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
        Voor providers die gebruiks- en factureringsgegevens beschikbaar stellen:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` heeft drie mogelijke uitkomsten. Retourneer
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` wanneer de
        provider een referentie voor gebruik/facturering heeft (de optionele velden geven
        niet-geheime abonnementsmetadata uit het opgeloste profiel door aan
        `fetchUsageSnapshot`). Retourneer
        `{ handled: true }` alleen wanneer de provider de gebruiksauthenticatie
        definitief heeft afgehandeld, maar geen bruikbaar gebruikstoken heeft, en OpenClaw
        de algemene terugval op een API-sleutel/OAuth moet overslaan. Retourneer `null` of
        `undefined` wanneer de provider het verzoek niet heeft afgehandeld en OpenClaw
        moet doorgaan met de algemene terugval.

        Declareer de provider-id in `contracts.usageProviders`. Wanneer dat manifestcontract
        en **beide** hooks aanwezig zijn, neemt OpenClaw de provider automatisch op
        in de gebruiksverzameling zonder niet-gerelateerde providerplugins te laden.
        De toestemmingslijst in de kern hoeft niet te worden bijgewerkt.
        `fetchUsageSnapshot` retourneert de gedeelde providerneutrale structuur:

        - `plan`: door de provider gerapporteerd abonnement of sleutellabel
        - `windows`: opnieuw instelbare quotavensters als gebruikte percentages
        - `billing`: getypeerde vermeldingen voor `balance`, `spend` of `budget`; `unit` kan
          een ISO-valuta of een providereenheid zoals `credits` zijn
        - `summary`: compacte providerspecifieke context die niet in deze
          gestructureerde velden past

        Houd de valutabetekenis exact. Een providertegoed is geen USD, tenzij het
        bovenliggende contract dat aangeeft. Een plugin die alleen
        `fetchUsageSnapshot` implementeert, blijft beschikbaar voor expliciete/synthetische
        aanroepers, maar wordt niet automatisch gedetecteerd, omdat OpenClaw de
        gebruiksreferentie ervan niet kan oplossen.
      </Tab>
    </Tabs>

    <Accordion title="Algemene providerhooks">
      OpenClaw roept hooks voor model-/providerplugins ongeveer in deze volgorde aan.
      De meeste providers gebruiken er slechts 2-3. Dit is niet het volledige
      `ProviderPlugin`-contract - zie [Interne werking: runtimehooks voor
      providers](/nl/plugins/architecture-internals#provider-runtime-hooks) voor de
      volledige, momenteel actuele lijst met hooks en opmerkingen over terugvalgedrag.
      Providervelden die alleen voor compatibiliteit bestaan en die OpenClaw niet meer
      aanroept, zoals `ProviderPlugin.capabilities` en `suppressBuiltInModel`, worden
      hier niet vermeld.

      | Hook | Wanneer te gebruiken |
      | --- | --- |
      | `catalog` | Modelcatalogus of standaardwaarden voor de basis-URL |
      | `applyConfigDefaults` | Algemene standaardwaarden van de provider tijdens het materialiseren van de configuratie |
      | `normalizeModelId` | Aliassen van verouderde/preview-model-id's opschonen vóór het opzoeken |
      | `normalizeTransport` | `api` / `baseUrl` van de providerfamilie opschonen vóór algemene modelsamenstelling |
      | `normalizeConfig` | Configuratie van `models.providers.<id>` normaliseren |
      | `applyNativeStreamingUsageCompat` | Compatibiliteitsherschrijvingen voor systeemeigen streaminggebruik bij configuratieproviders |
      | `resolveConfigApiKey` | Authenticatieresolutie van omgevingsmarkeringen door de provider |
      | `resolveSyntheticAuth` | Synthetische authenticatie voor lokale/zelfgehoste of configuratiegestuurde providers |
      | `resolveExternalAuthProfiles` | Externe authenticatieprofielen van de provider als overlay toepassen voor referenties die door de CLI/app worden beheerd |
      | `shouldDeferSyntheticProfileAuth` | Synthetische tijdelijke aanduidingen voor opgeslagen profielen onder authenticatie via omgeving/configuratie plaatsen |
      | `resolveDynamicModel` | Willekeurige bovenliggende model-id's accepteren |
      | `prepareDynamicModel` | Asynchroon metadata ophalen vóór het oplossen |
      | `normalizeResolvedModel` | Transportherschrijvingen vóór de runner |
      | `normalizeToolSchemas` | Opschoning van toolschema's door de provider vóór registratie |
      | `inspectToolSchemas` | Diagnose van toolschema's door de provider |
      | `resolveReasoningOutputMode` | Contract voor getagde versus systeemeigen redeneeruitvoer |
      | `prepareExtraParams` | Standaardverzoekparameters |
      | `createStreamFn` | Volledig aangepast StreamFn-transport |
      | `wrapStreamFn` | Aangepaste wrappers voor headers/body in het normale streampad |
      | `resolveTransportTurnState` | Systeemeigen headers/metadata per beurt |
      | `resolveWebSocketSessionPolicy` | Systeemeigen WS-sessieheaders/afkoelperiode |
      | `formatApiKey` | Aangepaste vorm van het runtimetoken |
      | `refreshOAuth` | Aangepaste OAuth-vernieuwing |
      | `buildAuthDoctorHint` | Richtlijnen voor authenticatieherstel |
      | `matchesContextOverflowError` | Overloopdetectie door de provider |
      | `classifyFailoverReason` | Classificatie van frequentielimieten/overbelasting door de provider |
      | `isCacheTtlEligible` | TTL-toelating voor de promptcache |
      | `buildMissingAuthMessage` | Aangepaste hint voor ontbrekende authenticatie |
      | `augmentModelCatalog` | Synthetische rijen voor voorwaartse compatibiliteit (verouderd - geef de voorkeur aan `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Modelspecifieke optieset voor `/think` |
      | `isBinaryThinking` | Compatibiliteit voor binair in-/uitschakelen van denken (verouderd - geef de voorkeur aan `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Compatibiliteit voor ondersteuning van `xhigh`-redenering (verouderd - geef de voorkeur aan `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Compatibiliteit voor standaardbeleid van `/think` (verouderd - geef de voorkeur aan `resolveThinkingProfile`) |
      | `isModernModelRef` | Modelovereenkomst voor live-/rooktests |
      | `prepareRuntimeAuth` | Tokenuitwisseling vóór inferentie |
      | `resolveUsageAuth` | Aangepaste verwerking van gebruiksreferenties |
      | `fetchUsageSnapshot` | Aangepast gebruikseindpunt |
      | `createEmbeddingProvider` | Embeddingadapter van de provider voor geheugen/zoeken |
      | `buildReplayPolicy` | Aangepast beleid voor transcriptreplay/Compaction |
      | `sanitizeReplayHistory` | Providerspecifieke replayherschrijvingen na algemene opschoning |
      | `validateReplayTurns` | Strikte validatie van replaybeurten vóór de ingesloten runner |
      | `onModelSelected` | Callback na selectie (bijv. telemetrie) |

      Opmerkingen over runtime-terugval:

      - `normalizeConfig` bepaalt één eigenaarplugin per provider-id (eerst gebundelde providers, daarna de overeenkomende runtimeplugin) en roept alleen die hook aan - er wordt niet langs andere providers gescand. Google's eigen `normalizeConfig`-hook normaliseert de configuratievermeldingen voor `google` / `google-vertex` / `google-antigravity`; dit is geen afzonderlijke terugval in de kern.
      - `resolveConfigApiKey` gebruikt de providerhook wanneer die beschikbaar is. Amazon Bedrock behoudt de resolutie van AWS-omgevingsmarkeringen in zijn providerplugin; de runtime-authenticatie zelf gebruikt nog steeds de standaardketen van de AWS SDK wanneer deze is geconfigureerd met `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` ontvangt de geselecteerde `provider`, `modelId`, een optionele samengevoegde `reasoning`-catalogushint en optionele samengevoegde `compat`-gegevens van het model. Gebruik `compat` alleen om de denkinterface/het denkprofiel van de provider te selecteren.
      - `resolveSystemPromptContribution` laat een provider cachebewuste richtlijnen voor de systeemprompt injecteren voor een modelfamilie. Geef hieraan de voorkeur boven de verouderde pluginbrede hook `before_prompt_build` wanneer het gedrag bij één provider/modelfamilie hoort en de stabiele/dynamische cachesplitsing moet behouden.

    </Accordion>

  </Step>

  <Step title="Extra mogelijkheden toevoegen (optioneel)">
    ### Stap 5: Extra mogelijkheden toevoegen

    Een providerplugin kan naast tekstinferentie ook embeddings, spraak, realtime-transcriptie,
    realtime-spraak, mediabegrip, afbeeldingsgeneratie, videogeneratie,
    webophaling en zoeken op het web registreren. OpenClaw classificeert dit als een
    plugin met **hybride mogelijkheden** - het aanbevolen patroon voor bedrijfsplugins
    (één plugin per leverancier). Zie
    [Interne werking: eigenaarschap van mogelijkheden](/nl/plugins/architecture#capability-ownership-model).

    Registreer elke mogelijkheid binnen `register(api)` naast je bestaande aanroep
    van `api.registerProvider(...)`. Kies alleen de tabbladen die je nodig hebt:

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

        Gebruik `assertOkOrThrowProviderError(...)` voor HTTP-fouten van de provider,
        zodat plugins begrensde uitlezing van foutteksten, verwerking van JSON-fouten
        en achtervoegsels met verzoek-id's delen.
      </Tab>
      <Tab title="Realtime-transcriptie">
        Geef de voorkeur aan `createRealtimeTranscriptionWebSocketSession(...)` - de gedeelde
        helper verwerkt proxyvastlegging, exponentiële wachttijd bij opnieuw verbinden, legen bij sluiten,
        gereedheidshandshakes, audiowachtrijen en diagnose van sluitingsgebeurtenissen. Je plugin
        wijst alleen bovenliggende gebeurtenissen toe.

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

        Batch-STT-providers die multipart-audio via POST verzenden, moeten
        `buildAudioTranscriptionFormData(...)` uit
        `openclaw/plugin-sdk/provider-http` gebruiken. De helper normaliseert
        bestandsnamen voor uploads, waaronder AAC-uploads die voor compatibele
        transcriptie-API's een bestandsnaam in M4A-stijl nodig hebben.
      </Tab>
      <Tab title="Realtime spraak">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Stel dit alleen in als de provider meerdere toolreacties voor
            // één aanroep accepteert, bijvoorbeeld een onmiddellijke reactie
            // "bezig" gevolgd door het uiteindelijke resultaat.
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
        transporten, audioformaten en functievlaggen beschikbaar kan stellen
        aan browser- en native Talk-clients. Implementeer `handleBargeIn`
        wanneer een transport kan detecteren dat een mens het afspelen door de
        assistent onderbreekt en de provider het afkappen of wissen van de
        actieve audioreactie ondersteunt.
        `submitToolResult` mag `void` retourneren voor synchrone indiening, of
        een `Promise<void>` voor een asynchrone voltooiingsgrens die de
        providerbridge beschikbaar kan stellen. Gateway-relaysessies wachten
        op die promise voordat ze een eindresultaat bevestigen of de gekoppelde
        uitvoering wissen; wijs deze af wanneer de indiening mislukt.
        Stel `supportsToolResultSuppression: false` in wanneer de provider
        `options.suppressResponse` niet kan respecteren. OpenClaw vermijdt dan
        onderdrukking voor interne resultaten van gedwongen raadpleging en
        annulering, en wijst directe aanvragen voor onderdrukte resultaten af
        in plaats van stilzwijgend een reactie te starten.
        Gebruikers van `createRealtimeVoiceBridgeSession` mogen eveneens een
        promise retourneren vanuit `onToolCall`; synchrone throws en
        afwijzingen worden doorgestuurd naar de callback `onError` van de
        sessie.
        Stel `handlesInputAudioBargeIn` alleen in wanneer provider-VAD een
        onderbreking bevestigt door `onClearAudio("barge-in")` aan te roepen.
        Providers die de vlag weglaten, gebruiken OpenClaws lokale
        terugvaldetectie voor invoeraudio.
      </Tab>
      <Tab title="Media-interpretatie">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Lokale of zelfgehoste mediaproviders die bewust geen
        aanmeldgegevens vereisen, kunnen `resolveAuth` beschikbaar stellen en
        `kind: "none"` retourneren. OpenClaw behoudt de normale
        authenticatiecontrole voor providers die zich niet expliciet
        aanmelden. Bestaande providers kunnen `req.apiKey` blijven lezen;
        nieuwe providers moeten bij voorkeur `req.auth` gebruiken.

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
        algemene embeddingcontract voor herbruikbare vectorgeneratie,
        waaronder zoeken in het geheugen.
        `registerMemoryEmbeddingProvider(...)` is verouderde compatibiliteit
        voor bestaande geheugenspecifieke adapters.
      </Tab>
      <Tab title="Afbeeldings- en videogeneratie">
        Afbeeldings- en videomogelijkheden gebruiken een **modusbewuste**
        structuur. Afbeeldingsproviders declareren verplichte
        mogelijkhedenblokken `generate` en `edit`; videoproviders declareren
        `generate`, `imageToVideo` en `videoToVideo`. Platte
        aggregaatvelden zoals `maxInputImages` / `maxInputVideos` /
        `maxDurationSeconds` volstaan niet om ondersteuning voor
        transformatiemodi of uitgeschakelde modi duidelijk kenbaar te maken.
        Muziekgeneratie volgt hetzelfde patroon met `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` is verplicht voor beide providertypen; `edit` en de
        videotransformatieblokken (`imageToVideo`, `videoToVideo`) vereisen
        altijd een expliciete vlag `enabled`.

        Gebruik `catalogByModel` wanneer de statische modi of mogelijkheden
        van een vermeld model afwijken van de standaardwaarden van de
        provider. Deze metadata houden `video_generate action=list` en
        modelcatalogi nauwkeurig zonder providercode aan te roepen. Het
        opzoeken en afdwingen van mogelijkheden tijdens aanvragen blijft
        thuishoren in `resolveModelCapabilities` en `generateVideo`; hergebruik
        waar mogelijk dezelfde mogelijkhedenconstante voor beide paden.
      </Tab>
      <Tab title="Webinhoud ophalen en zoeken">
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
          hint: "Search the web through Acme's search backend.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Beide providertypen gebruiken dezelfde structuur voor het koppelen van
        aanmeldgegevens: `hint`, `envVars`, `placeholder`, `signupUrl`,
        `credentialPath`, `getCredentialValue`, `setCredentialValue` en
        `createTool` zijn allemaal verplicht.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Testen">
    ### Stap 6: Testen

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exporteer uw providerconfiguratieobject vanuit index.ts of een afzonderlijk bestand
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

Providerplugins worden op dezelfde manier gepubliceerd als elke andere externe
codeplugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` is een andere opdracht voor het publiceren van
een skillmap, niet van een pluginpakket; gebruik deze hier niet.

## Bestandsstructuur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-metadata
├── openclaw.plugin.json      # Manifest met metadata voor providerauthenticatie
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Gebruikseindpunt (optioneel)
```

## Naslaginformatie voor catalogusvolgorde

`catalog.order` bepaalt wanneer uw catalogus wordt samengevoegd ten opzichte
van ingebouwde providers:

| Volgorde  | Wanneer       | Toepassing                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Eerste ronde  | Providers met alleen een API-sleutel            |
| `profile` | Na simple     | Providers waarvoor authenticatieprofielen vereist zijn |
| `paired`  | Na profile    | Meerdere gerelateerde vermeldingen samenstellen |
| `late`    | Laatste ronde | Bestaande providers overschrijven (wint bij conflicten) |

## Volgende stappen

- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - als je plugin ook een kanaal aanbiedt
- [SDK-runtime](/nl/plugins/sdk-runtime) - `api.runtime`-hulpfuncties (TTS, zoeken, subagent)
- [SDK-overzicht](/nl/plugins/sdk-overview) - volledige referentie voor imports uit subpaden
- [Interne werking van plugins](/nl/plugins/architecture-internals#provider-runtime-hooks) - details over hooks en meegeleverde voorbeelden

## Gerelateerd

- [Plugin SDK instellen](/nl/plugins/sdk-setup)
- [Plugins bouwen](/nl/plugins/building-plugins)
- [Kanaalplugins bouwen](/nl/plugins/sdk-channel-plugins)
