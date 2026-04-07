---
read_when:
    - Stai creando un nuovo plugin provider di modelli
    - Vuoi aggiungere un proxy compatibile con OpenAI o un LLM personalizzato a OpenClaw
    - Devi comprendere autenticazione del provider, cataloghi e hook di runtime
sidebarTitle: Provider Plugins
summary: Guida passo passo per creare un plugin provider di modelli per OpenClaw
title: Creazione di plugin provider
x-i18n:
    generated_at: "2026-04-07T08:16:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4da82a353e1bf4fe6dc09e14b8614133ac96565679627de51415926014bd3990
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Creazione di plugin provider

Questa guida illustra come creare un plugin provider che aggiunge un provider di modelli
(LLM) a OpenClaw. Alla fine avrai un provider con un catalogo modelli,
autenticazione tramite chiave API e risoluzione dinamica dei modelli.

<Info>
  Se non hai mai creato prima un plugin OpenClaw, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e l'impostazione del manifest.
</Info>

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
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
      "description": "Provider di modelli Acme AI",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Chiave API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Chiave API Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Il manifest dichiara `providerAuthEnvVars` in modo che OpenClaw possa rilevare
    le credenziali senza caricare il runtime del tuo plugin. `modelSupport` è facoltativo
    e consente a OpenClaw di caricare automaticamente il tuo plugin provider a partire da ID di modello abbreviati
    come `acme-large` prima che esistano hook di runtime. Se pubblichi il
    provider su ClawHub, quei campi `openclaw.compat` e `openclaw.build`
    sono obbligatori in `package.json`.

  </Step>

  <Step title="Registra il provider">
    Un provider minimo richiede `id`, `label`, `auth` e `catalog`:

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

    Questo è un provider funzionante. Gli utenti ora possono
    `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come modello.

    Per i provider inclusi che registrano solo un provider di testo con
    autenticazione tramite chiave API più un singolo runtime basato su catalogo, preferisci l'helper più ristretto
    `defineSingleProviderPluginEntry(...)`:

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

    Se il tuo flusso auth deve anche correggere `models.providers.*`, alias e
    il modello predefinito dell'agente durante l'onboarding, usa gli helper preset da
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più specifici sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando l'endpoint nativo di un provider supporta blocchi di utilizzo in streaming sul
    normale trasporto `openai-completions`, preferisci gli helper catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di codificare controlli sul provider-id. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla mappa delle capacità dell'endpoint, quindi endpoint nativi in stile Moonshot/DashScope continuano a
    aderire anche quando un plugin usa un provider id personalizzato.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica dei modelli">
    Se il tuo provider accetta ID modello arbitrari (come un proxy o un router),
    aggiungi `resolveDynamicModel`:

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

    Se la risoluzione richiede una chiamata di rete, usa `prepareDynamicModel` per un
    warm-up asincrono — `resolveDynamicModel` viene eseguito di nuovo al completamento.

  </Step>

  <Step title="Aggiungi hook di runtime (se necessario)">
    La maggior parte dei provider richiede solo `catalog` + `resolveDynamicModel`. Aggiungi gli hook
    in modo incrementale in base alle esigenze del tuo provider.

    I builder helper condivisi ora coprono le famiglie più comuni di replay/compatibilità strumenti,
    quindi in genere i plugin non devono cablare manualmente ogni hook uno per uno:

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

    Famiglie di replay disponibili oggi:

    | Family | Cosa collega |
    | --- | --- |
    | `openai-compatible` | Criterio di replay condiviso in stile OpenAI per trasporti compatibili OpenAI, inclusa la sanificazione dei tool-call-id, correzioni di ordinamento assistant-first e validazione generica dei turni Gemini dove il trasporto la richiede |
    | `anthropic-by-model` | Criterio di replay compatibile con Claude scelto da `modelId`, così i trasporti Anthropic-message ricevono la pulizia specifica dei thinking block di Claude solo quando il modello risolto è effettivamente un ID Claude |
    | `google-gemini` | Criterio di replay Gemini nativo più sanificazione del replay bootstrap e modalità tagged reasoning-output |
    | `passthrough-gemini` | Sanificazione della thought-signature Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili OpenAI; non abilita la validazione nativa del replay Gemini né riscritture bootstrap |
    | `hybrid-anthropic-openai` | Criterio ibrido per provider che mescolano superfici di modelli Anthropic-message e OpenAI-compatible in un solo plugin; l'eliminazione facoltativa dei thinking block solo-Claude resta limitata al lato Anthropic |

    Esempi reali inclusi:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famiglie stream disponibili oggi:

    | Family | Cosa collega |
    | --- | --- |
    | `google-thinking` | Normalizzazione del payload thinking Gemini sul percorso stream condiviso |
    | `kilocode-thinking` | Wrapper di reasoning Kilo sul percorso stream proxy condiviso, con `kilo/auto` e ID di reasoning proxy non supportati che saltano il thinking iniettato |
    | `moonshot-thinking` | Mappatura del payload native-thinking binario Moonshot da config + livello `/think` |
    | `minimax-fast-mode` | Riscrittura del modello fast-mode MiniMax sul percorso stream condiviso |
    | `openai-responses-defaults` | Wrapper nativi condivisi OpenAI/Codex Responses: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, web search nativa Codex, modellazione del payload compatibile con il reasoning e gestione del contesto Responses |
    | `openrouter-thinking` | Wrapper di reasoning OpenRouter per percorsi proxy, con skip di modelli non supportati/`auto` gestiti centralmente |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo per impostazione predefinita per provider come Z.AI che vogliono lo streaming degli strumenti salvo disattivazione esplicita |

    Esempi reali inclusi:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` esporta anche l'enum delle famiglie di replay
    più gli helper condivisi da cui quelle famiglie sono costruite. Le esportazioni pubbliche comuni
    includono:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builder replay condivisi come `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helper replay Gemini come `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - helper endpoint/modello come `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` espone sia il builder di famiglia sia
    gli helper wrapper pubblici che quelle famiglie riutilizzano. Le esportazioni pubbliche comuni
    includono:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrapper condivisi OpenAI/Codex come
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` e
      `createCodexNativeWebSearchWrapper(...)`
    - wrapper proxy/provider condivisi come `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` e `createMinimaxFastModeWrapper(...)`

    Alcuni helper stream restano volutamente locali al provider. Esempio attuale incluso:
    `@openclaw/anthropic-provider` esporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i
    builder wrapper Anthropic di livello inferiore dal suo seam pubblico `api.ts` /
    `contract-api.ts`. Quegli helper restano specifici di Anthropic perché
    codificano anche la gestione beta di Claude OAuth e il gating `context1m`.

    Anche altri provider inclusi mantengono wrapper specifici del trasporto locali quando
    il comportamento non è condivisibile in modo pulito tra famiglie. Esempio attuale: il
    plugin xAI incluso mantiene la modellazione nativa xAI Responses nel proprio
    `wrapStreamFn`, inclusi riscritture alias `/fast`, `tool_stream` predefinito,
    pulizia degli strict-tool non supportati e rimozione del payload di reasoning
    specifico xAI.

    `openclaw/plugin-sdk/provider-tools` attualmente espone una famiglia condivisa
    di schema strumenti più helper condivisi per schema/compatibilità:

    - `ProviderToolCompatFamily` documenta oggi l'inventario condiviso delle famiglie.
    - `buildProviderToolCompatFamilyHooks("gemini")` collega
      pulizia dello schema Gemini + diagnostica per provider che richiedono schemi di strumenti sicuri per Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      sono gli helper pubblici Gemini sottostanti per gli schemi.
    - `resolveXaiModelCompatPatch()` restituisce la patch di compatibilità xAI inclusa:
      `toolSchemaProfile: "xai"`, parole chiave di schema non supportate, supporto nativo
      `web_search` e decodifica degli argomenti tool-call con entità HTML.
    - `applyXaiModelCompat(model)` applica la stessa patch di compatibilità xAI a un
      modello risolto prima che raggiunga il runner.

    Esempio reale incluso: il plugin xAI usa `normalizeResolvedModel` più
    `contributeResolvedModelCompat` per mantenere quei metadati di compatibilità di proprietà del
    provider invece di codificare regole xAI nel core.

    Lo stesso schema package-root supporta anche altri provider inclusi:

    - `@openclaw/openai-provider`: `api.ts` esporta builder provider,
      helper per modelli predefiniti e builder realtime provider
    - `@openclaw/openrouter-provider`: `api.ts` esporta il builder provider
      più helper di onboarding/config

    <Tabs>
      <Tab title="Scambio token">
        Per provider che richiedono uno scambio token prima di ogni chiamata di inferenza:

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
      <Tab title="Header personalizzati">
        Per provider che richiedono header di richiesta personalizzati o modifiche al body:

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
      <Tab title="Identità del trasporto nativo">
        Per provider che richiedono header o metadati nativi di richiesta/sessione su
        trasporti HTTP o WebSocket generici:

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
      <Tab title="Utilizzo e fatturazione">
        Per provider che espongono dati di utilizzo/fatturazione:

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

    <Accordion title="Tutti gli hook provider disponibili">
      OpenClaw chiama gli hook in questo ordine. La maggior parte dei provider ne usa solo 2-3:

      | # | Hook | Quando usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogo modelli o valori predefiniti base URL |
      | 2 | `applyConfigDefaults` | Valori predefiniti globali di proprietà del provider durante la materializzazione della configurazione |
      | 3 | `normalizeModelId` | Pulizia di alias legacy/preview degli ID modello prima della ricerca |
      | 4 | `normalizeTransport` | Pulizia della famiglia provider di `api` / `baseUrl` prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizza la configurazione `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità native dello streaming-usage per provider di configurazione |
      | 7 | `resolveConfigApiKey` | Risoluzione auth env-marker di proprietà del provider |
      | 8 | `resolveSyntheticAuth` | Auth sintetica locale/self-hosted o basata su configurazione |
      | 9 | `shouldDeferSyntheticProfileAuth` | Posiziona i placeholder sintetici dei profili memorizzati sotto l'auth env/config |
      | 10 | `resolveDynamicModel` | Accetta ID di modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |

    Note sul fallback runtime:

    - `normalizeConfig` controlla prima il provider corrispondente, poi altri
      plugin provider con hook finché uno non modifica davvero la configurazione.
      Se nessun hook provider riscrive una voce di configurazione supportata della famiglia Google, continua ad applicarsi
      il normalizzatore di configurazione Google incluso.
    - `resolveConfigApiKey` usa l'hook provider quando esposto. Il percorso
      `amazon-bedrock` incluso ha anche un resolver integrato di env-marker AWS qui,
      anche se l'auth runtime Bedrock continua comunque a usare la catena predefinita AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli vendor dietro un altro trasporto compatibile |
      | 14 | `capabilities` | Legacy static capability bag; solo compatibilità |
      | 15 | `normalizeToolSchemas` | Pulizia degli schemi strumenti di proprietà del provider prima della registrazione |
      | 16 | `inspectToolSchemas` | Diagnostica degli schemi strumenti di proprietà del provider |
      | 17 | `resolveReasoningOutputMode` | Contratto di reasoning-output tagged vs native |
      | 18 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 19 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 20 | `wrapStreamFn` | Wrapper personalizzati di header/body sul normale percorso stream |
      | 21 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 22 | `resolveWebSocketSessionPolicy` | Header sessione WS nativi/cool-down |
      | 23 | `formatApiKey` | Formato personalizzato del token runtime |
      | 24 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 25 | `buildAuthDoctorHint` | Indicazioni per la riparazione auth |
      | 26 | `matchesContextOverflowError` | Rilevamento overflow di proprietà del provider |
      | 27 | `classifyFailoverReason` | Classificazione rate-limit/sovraccarico di proprietà del provider |
      | 28 | `isCacheTtlEligible` | Gating TTL della cache prompt |
      | 29 | `buildMissingAuthMessage` | Suggerimento personalizzato per auth mancante |
      | 30 | `suppressBuiltInModel` | Nasconde righe upstream obsolete |
      | 31 | `augmentModelCatalog` | Righe sintetiche di forward-compat |
      | 32 | `isBinaryThinking` | Thinking binario acceso/spento |
      | 33 | `supportsXHighThinking` | Supporto del reasoning `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Criterio predefinito `/think` |
      | 35 | `isModernModelRef` | Corrispondenza di modelli live/smoke |
      | 36 | `prepareRuntimeAuth` | Scambio token prima dell'inferenza |
      | 37 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 38 | `fetchUsageSnapshot` | Endpoint personalizzato di utilizzo |
      | 39 | `createEmbeddingProvider` | Adapter embedding di proprietà del provider per memoria/ricerca |
      | 40 | `buildReplayPolicy` | Criterio personalizzato di replay/compattazione della trascrizione |
      | 41 | `sanitizeReplayHistory` | Riscritture di replay specifiche del provider dopo la pulizia generica |
      | 42 | `validateReplayTurns` | Validazione rigorosa dei turni replay prima del runner incorporato |
      | 43 | `onModelSelected` | Callback post-selezione (ad es. telemetria) |

      Nota sulla regolazione del prompt:

      - `resolveSystemPromptContribution` consente a un provider di iniettare
        indicazioni del prompt di sistema cache-aware per una famiglia di modelli. Preferiscilo rispetto a
        `before_prompt_build` quando il comportamento appartiene a una singola famiglia provider/modello
        e deve preservare la suddivisione stabile/dinamica della cache.

      Per descrizioni dettagliate ed esempi reali, vedi
      [Interni: hook di runtime del provider](/it/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capacità extra (facoltativo)">
    <a id="step-5-add-extra-capabilities"></a>
    Un plugin provider può registrare speech, trascrizione realtime, voce
    realtime, media understanding, image generation, video generation, web fetch
    e web search insieme all'inferenza testuale:

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
    }
    ```

    OpenClaw classifica questo come un plugin **hybrid-capability**. Questo è il
    modello consigliato per i plugin aziendali (un plugin per vendor). Vedi
    [Interni: appartenenza delle capacità](/it/plugins/architecture#capability-ownership-model).

    Per la generazione video, preferisci la forma di capacità consapevole della modalità mostrata sopra:
    `generate`, `imageToVideo` e `videoToVideo`. Campi aggregati piatti come
    `maxInputImages`, `maxInputVideos` e `maxDurationSeconds` non
    bastano per pubblicizzare in modo pulito il supporto delle modalità di trasformazione o le modalità disabilitate.

    I provider di generazione musicale dovrebbero seguire lo stesso schema:
    `generate` per la generazione basata solo su prompt e `edit` per la generazione
    basata su immagine di riferimento. Campi aggregati piatti come `maxInputImages`,
    `supportsLyrics` e `supportsFormat` non bastano per pubblicizzare il supporto `edit`;
    i blocchi espliciti `generate` / `edit` sono il contratto previsto.

  </Step>

  <Step title="Test">
    <a id="step-6-test"></a>
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

## Pubblicazione su ClawHub

I plugin provider si pubblicano come qualsiasi altro plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui il vecchio alias di pubblicazione solo-Skills; i pacchetti plugin devono usare
`clawhub package publish`.

## Struttura dei file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Riferimento dell'ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai
provider integrati:

| Order     | Quando        | Caso d'uso                                     |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Primo passaggio | Provider semplici con chiave API              |
| `profile` | Dopo simple   | Provider vincolati a profili auth              |
| `paired`  | Dopo profile  | Sintetizzare più voci correlate                |
| `late`    | Ultimo passaggio | Sostituire provider esistenti (vince in caso di collisione) |

## Prossimi passi

- [Plugin canale](/it/plugins/sdk-channel-plugins) — se il tuo plugin fornisce anche un canale
- [SDK Runtime](/it/plugins/sdk-runtime) — helper `api.runtime` (TTS, ricerca, subagent)
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento completo degli import subpath
- [Interni dei plugin](/it/plugins/architecture#provider-runtime-hooks) — dettagli degli hook ed esempi inclusi
