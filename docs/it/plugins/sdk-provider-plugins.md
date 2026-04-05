---
read_when:
    - Stai creando un nuovo plugin provider di modelli
    - Vuoi aggiungere a OpenClaw un proxy compatibile con OpenAI o un LLM personalizzato
    - Hai bisogno di comprendere auth provider, cataloghi e hook runtime
sidebarTitle: Provider Plugins
summary: Guida passo passo per creare un plugin provider di modelli per OpenClaw
title: Creare plugin provider
x-i18n:
    generated_at: "2026-04-05T14:01:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9411ebf96c1eef0baecee9b743925440edc6714a8947da7712fed2b9ef1405cb
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Creare plugin provider

Questa guida spiega come creare un plugin provider che aggiunge a OpenClaw un provider di modelli
(LLM). Alla fine avrai un provider con un catalogo di modelli,
autenticazione tramite chiave API e risoluzione dinamica dei modelli.

<Info>
  Se non hai mai creato prima alcun plugin OpenClaw, leggi prima
  [Per iniziare](/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
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

    Il manifest dichiara `providerAuthEnvVars` così OpenClaw può rilevare
    le credenziali senza caricare il runtime del tuo plugin. `modelSupport` è facoltativo
    e permette a OpenClaw di caricare automaticamente il tuo plugin provider a partire da ID modello abbreviati
    come `acme-large` prima che esistano hook runtime. Se pubblichi il
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
      description: "Provider di modelli Acme AI",
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
              label: "Chiave API Acme AI",
              hint: "Chiave API dalla tua dashboard Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Inserisci la tua chiave API Acme AI",
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

    Questo è un provider funzionante. Gli utenti possono ora
    eseguire `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come proprio modello.

    Per provider bundled che registrano solo un provider testuale con autenticazione tramite chiave API
    più un singolo runtime basato su catalogo, preferisci l'helper più ristretto
    `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provider di modelli Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Chiave API Acme AI",
            hint: "Chiave API dalla tua dashboard Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Inserisci la tua chiave API Acme AI",
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

    Se il tuo flusso auth deve anche aggiornare `models.providers.*`, alias e
    il modello predefinito dell'agente durante l'onboarding, usa gli helper preset di
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più mirati sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando l'endpoint nativo di un provider supporta blocchi di utilizzo in streaming sul
    trasporto normale `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di codificare controlli
    specifici dell'ID provider. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla mappa delle capacità
    dell'endpoint, così endpoint nativi in stile Moonshot/DashScope possono comunque
    aderire anche quando un plugin usa un ID provider personalizzato.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica dei modelli">
    Se il tuo provider accetta ID modello arbitrari (come un proxy o router),
    aggiungi `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth e catalog di cui sopra

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
    warm-up asincrono: `resolveDynamicModel` verrà eseguito di nuovo dopo il completamento.

  </Step>

  <Step title="Aggiungi hook runtime (se necessario)">
    La maggior parte dei provider richiede solo `catalog` + `resolveDynamicModel`. Aggiungi gli hook
    in modo incrementale, a seconda delle esigenze del tuo provider.

    I builder di helper condivisi ora coprono le famiglie più comuni di replay/compatibilità strumenti,
    quindi di solito i plugin non devono collegare manualmente ogni hook uno per uno:

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

    Famiglie replay disponibili oggi:

    | Family | Cosa collega |
    | --- | --- |
    | `openai-compatible` | Policy replay condivisa in stile OpenAI per trasporti compatibili OpenAI, inclusi pulizia tool-call-id, correzioni dell'ordine assistant-first e validazione generica dei turni Gemini dove il trasporto lo richiede |
    | `anthropic-by-model` | Policy replay compatibile con Claude scelta in base a `modelId`, così i trasporti Anthropic-message ricevono la pulizia specifica dei blocchi di thinking di Claude solo quando il modello risolto è effettivamente un ID Claude |
    | `google-gemini` | Policy replay nativa Gemini più sanitizzazione del replay bootstrap e modalità output reasoning etichettata |
    | `passthrough-gemini` | Sanitizzazione della firma di thought Gemini per modelli Gemini in esecuzione tramite trasporti proxy compatibili OpenAI; non abilita validazione replay Gemini nativa né riscritture bootstrap |
    | `hybrid-anthropic-openai` | Policy ibrida per provider che combinano superfici di modelli Anthropic-message e compatibili OpenAI in un unico plugin; l'eventuale rimozione dei blocchi di thinking solo-Claude resta limitata al lato Anthropic |

    Esempi bundled reali:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famiglie stream disponibili oggi:

    | Family | Cosa collega |
    | --- | --- |
    | `google-thinking` | Normalizzazione del payload di thinking Gemini nel percorso stream condiviso |
    | `kilocode-thinking` | Wrapper reasoning Kilo nel percorso stream proxy condiviso, con `kilo/auto` e ID reasoning proxy non supportati che saltano il thinking iniettato |
    | `moonshot-thinking` | Mappatura del payload native-thinking binario Moonshot da config + livello `/think` |
    | `minimax-fast-mode` | Riscrittura del modello fast-mode MiniMax nel percorso stream condiviso |
    | `openai-responses-defaults` | Wrapper condivisi nativi OpenAI/Codex Responses: header di attribuzione, `/fast`/`serviceTier`, verbosity del testo, web search Codex nativa, model shaping del payload di compatibilità reasoning e gestione del contesto Responses |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter per route proxy, con skip centralizzati per modelli non supportati/`auto` |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo di default per provider come Z.AI che vogliono lo streaming degli strumenti salvo disabilitazione esplicita |

    Esempi bundled reali:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` esporta anche l'enum delle
    famiglie replay più gli helper condivisi su cui si basano queste famiglie. Le esportazioni pubbliche
    comuni includono:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builder replay condivisi come `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)`, e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helper replay Gemini come `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - helper endpoint/model come `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)`, e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` espone sia il builder di famiglie sia
    i wrapper helper pubblici riutilizzati da queste famiglie. Le esportazioni pubbliche comuni
    includono:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrapper condivisi OpenAI/Codex come
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)`, e
      `createCodexNativeWebSearchWrapper(...)`
    - wrapper condivisi proxy/provider come `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)`, e `createMinimaxFastModeWrapper(...)`

    Alcuni helper stream restano volutamente locali al provider. Esempio bundled
    attuale: `@openclaw/anthropic-provider` esporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, e i
    builder wrapper Anthropic di livello inferiore tramite il suo seam pubblico `api.ts` /
    `contract-api.ts`. Quegli helper restano specifici di Anthropic perché
    codificano anche la gestione delle beta OAuth Claude e il gating `context1m`.

    Anche altri provider bundled mantengono wrapper specifici del trasporto in locale quando
    il comportamento non è condivisibile in modo pulito tra famiglie. Esempio attuale: il
    plugin xAI bundled mantiene nel proprio
    `wrapStreamFn` il model shaping nativo xAI Responses, inclusi riscritture di alias `/fast`, `tool_stream` predefinito,
    pulizia dei strict-tool non supportati e rimozione
    del payload reasoning specifica xAI.

    `openclaw/plugin-sdk/provider-tools` attualmente espone una famiglia condivisa
    di schemi degli strumenti più helper condivisi per schema/compatibilità:

    - `ProviderToolCompatFamily` documenta oggi l'inventario delle famiglie condivise.
    - `buildProviderToolCompatFamilyHooks("gemini")` collega la
      pulizia dello schema Gemini + diagnostica per provider che necessitano di schemi strumenti sicuri per Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      sono gli helper pubblici sottostanti per gli schemi Gemini.
    - `resolveXaiModelCompatPatch()` restituisce la patch di compatibilità xAI bundled:
      `toolSchemaProfile: "xai"`, keyword di schema non supportate, supporto nativo
      `web_search`, e decodifica delle argomentazioni delle tool-call con entità HTML.
    - `applyXaiModelCompat(model)` applica la stessa patch di compatibilità xAI a un
      modello risolto prima che arrivi al runner.

    Esempio bundled reale: il plugin xAI usa `normalizeResolvedModel` più
    `contributeResolvedModelCompat` per mantenere quei metadati di compatibilità
    di proprietà del provider invece di codificare in core regole specifiche di xAI.

    Lo stesso schema del package root supporta anche altri provider bundled:

    - `@openclaw/openai-provider`: `api.ts` esporta builder provider,
      helper per modelli predefiniti e builder realtime provider
    - `@openclaw/openrouter-provider`: `api.ts` esporta il builder provider
      più helper di onboarding/config

    <Tabs>
      <Tab title="Scambio token">
        Per provider che necessitano di uno scambio token prima di ogni chiamata di inferenza:

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
        // wrapStreamFn restituisce una StreamFn derivata da ctx.streamFn
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
      <Tab title="Identità nativa del trasporto">
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
      | 1 | `catalog` | Catalogo modelli o valori predefiniti di base URL |
      | 2 | `applyConfigDefaults` | Valori globali predefiniti di proprietà del provider durante la materializzazione della config |
      | 3 | `normalizeModelId` | Pulizia di alias legacy/preview per model-id prima del lookup |
      | 4 | `normalizeTransport` | Pulizia di `api` / `baseUrl` della famiglia provider prima dell'assemblaggio del modello generico |
      | 5 | `normalizeConfig` | Normalizza la config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità per utilizzo streaming nativo per i provider config |
      | 7 | `resolveConfigApiKey` | Risoluzione auth con env-marker di proprietà del provider |
      | 8 | `resolveSyntheticAuth` | Auth sintetica locale/self-hosted o basata su config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Sposta i placeholder sintetici di profili memorizzati dietro auth env/config |
      | 10 | `resolveDynamicModel` | Accetta ID modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |

    Note sul fallback runtime:

    - `normalizeConfig` controlla prima il provider corrispondente, poi altri
      plugin provider con hook finché uno non modifica davvero la config.
      Se nessun hook provider riscrive una voce config supportata della famiglia Google, si
      applica comunque il normalizzatore config Google bundled.
    - `resolveConfigApiKey` usa l'hook del provider quando esposto. Il percorso bundled
      `amazon-bedrock` include qui anche un resolver built-in di marker env AWS,
      anche se l'auth runtime Bedrock stesso continua a usare la chain predefinita AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli vendor dietro un altro trasporto compatibile |
      | 14 | `capabilities` | Bag statica di capacità legacy; solo compatibilità |
      | 15 | `normalizeToolSchemas` | Pulizia degli schemi strumenti di proprietà del provider prima della registrazione |
      | 16 | `inspectToolSchemas` | Diagnostica degli schemi strumenti di proprietà del provider |
      | 17 | `resolveReasoningOutputMode` | Contratto output reasoning etichettato vs nativo |
      | 18 | `prepareExtraParams` | Parametri predefiniti della richiesta |
      | 19 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 20 | `wrapStreamFn` | Wrapper personalizzati di header/body nel normale percorso stream |
      | 21 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 22 | `resolveWebSocketSessionPolicy` | Header sessione WS nativi/cool-down |
      | 23 | `formatApiKey` | Forma personalizzata del token runtime |
      | 24 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 25 | `buildAuthDoctorHint` | Guida alla riparazione dell'auth |
      | 26 | `matchesContextOverflowError` | Rilevamento overflow di proprietà del provider |
      | 27 | `classifyFailoverReason` | Classificazione rate-limit/sovraccarico di proprietà del provider |
      | 28 | `isCacheTtlEligible` | Gating TTL per prompt cache |
      | 29 | `buildMissingAuthMessage` | Suggerimento personalizzato per auth mancante |
      | 30 | `suppressBuiltInModel` | Nasconde righe upstream obsolete |
      | 31 | `augmentModelCatalog` | Righe sintetiche per forward-compat |
      | 32 | `isBinaryThinking` | Thinking binario on/off |
      | 33 | `supportsXHighThinking` | Supporto reasoning `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Policy predefinita `/think` |
      | 35 | `isModernModelRef` | Corrispondenza del modello live/smoke |
      | 36 | `prepareRuntimeAuth` | Scambio token prima dell'inferenza |
      | 37 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 38 | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | 39 | `createEmbeddingProvider` | Adapter embedding di proprietà del provider per memory/search |
      | 40 | `buildReplayPolicy` | Policy personalizzata di replay/compattazione delle trascrizioni |
      | 41 | `sanitizeReplayHistory` | Riscritture replay specifiche del provider dopo la pulizia generica |
      | 42 | `validateReplayTurns` | Validazione rigorosa dei turni replay prima del runner embedded |
      | 43 | `onModelSelected` | Callback post-selezione (ad esempio telemetria) |

      Nota sul tuning dei prompt:

      - `resolveSystemPromptContribution` permette a un provider di iniettare
        indicazioni sul prompt di sistema consapevoli della cache per una famiglia di modelli. Preferiscilo a
        `before_prompt_build` quando il comportamento appartiene a una sola famiglia provider/modello
        e dovrebbe preservare la separazione stabile/dinamica della cache.

      Per descrizioni dettagliate ed esempi reali, vedi
      [Internals: Hook runtime provider](/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capacità extra (facoltativo)">
    <a id="step-5-add-extra-capabilities"></a>
    Un plugin provider può registrare speech, trascrizione realtime, voce realtime,
    comprensione media, generazione di immagini, generazione video, web fetch
    e web search oltre all'inferenza di testo:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* dati PCM */),
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
        describeImage: async (req) => ({ text: "Una foto di..." }),
        transcribeAudio: async (req) => ({ text: "Trascrizione..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* risultato immagine */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Recupera pagine tramite il backend di rendering di Acme.",
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
          description: "Recupera una pagina tramite Acme Fetch.",
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

    OpenClaw lo classifica come plugin a **capacità ibride**. Questo è il
    modello consigliato per i plugin aziendali (un plugin per vendor). Vedi
    [Internals: Proprietà delle capacità](/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Test">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Esporta il tuo oggetto di config provider da index.ts o da un file dedicato
    import { acmeProvider } from "./provider.js";

    describe("provider acme-ai", () => {
      it("risolve modelli dinamici", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("restituisce il catalogo quando è disponibile una chiave", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("restituisce catalogo null quando non c'è una chiave", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Pubblica su ClawHub

I plugin provider si pubblicano allo stesso modo di qualsiasi altro plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui l'alias legacy di pubblicazione solo-Skill; i pacchetti plugin devono usare
`clawhub package publish`.

## Struttura dei file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadati openclaw.providers
├── openclaw.plugin.json      # Manifest con providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Test
    └── usage.ts              # Endpoint di utilizzo (facoltativo)
```

## Riferimento ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai
provider integrati:

| Order     | Quando        | Caso d'uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primo passaggio | Provider semplici con chiave API              |
| `profile` | Dopo simple   | Provider vincolati ai profili auth              |
| `paired`  | Dopo profile  | Sintetizza più voci correlate                   |
| `late`    | Ultimo passaggio | Sovrascrive provider esistenti (vince in caso di collisione) |

## Passi successivi

- [Plugin canale](/plugins/sdk-channel-plugins) — se il tuo plugin fornisce anche un canale
- [SDK Runtime](/plugins/sdk-runtime) — helper `api.runtime` (TTS, search, subagent)
- [Panoramica SDK](/plugins/sdk-overview) — riferimento completo agli import subpath
- [Internals dei plugin](/plugins/architecture#provider-runtime-hooks) — dettagli degli hook ed esempi bundled
