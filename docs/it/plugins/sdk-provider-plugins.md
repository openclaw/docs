---
read_when:
    - Stai creando un nuovo plugin per provider di modelli
    - Vuoi aggiungere a OpenClaw un proxy compatibile con OpenAI o un LLM personalizzato
    - Devi comprendere l'autenticazione dei provider, i cataloghi e gli hook di runtime
sidebarTitle: Provider plugins
summary: Guida passo passo alla creazione di un Plugin provider di modelli per OpenClaw
title: Creazione di Plugin per fornitori
x-i18n:
    generated_at: "2026-05-02T22:21:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Questa guida illustra come creare un plugin provider che aggiunge un provider di modelli
(LLM) a OpenClaw. Alla fine avrai un provider con un catalogo di modelli,
autenticazione tramite chiave API e risoluzione dinamica dei modelli.

<Info>
  Se non hai mai creato un plugin OpenClaw, leggi prima
  [Introduzione](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

<Tip>
  I plugin provider aggiungono modelli al normale ciclo di inferenza di OpenClaw. Se il modello
  deve essere eseguito tramite un daemon agente nativo che possiede thread, Compaction o eventi
  degli strumenti, abbina il provider a un [harness agente](/it/plugins/sdk-agent-harness)
  invece di inserire i dettagli del protocollo del daemon nel core.
</Tip>

## Procedura guidata

<Steps>
  <Step title="Pacchetto e manifest">
    ### Passaggio 1: Pacchetto e manifest

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

    Il manifest dichiara `providerAuthEnvVars` in modo che OpenClaw possa rilevare
    le credenziali senza caricare il runtime del tuo plugin. Aggiungi `providerAuthAliases`
    quando una variante del provider deve riutilizzare l'autenticazione dell'id di un altro provider. `modelSupport`
    è opzionale e consente a OpenClaw di caricare automaticamente il tuo plugin provider da id di modello
    abbreviati come `acme-large` prima che esistano gli hook di runtime. Se pubblichi il
    provider su ClawHub, quei campi `openclaw.compat` e `openclaw.build`
    sono obbligatori in `package.json`.

  </Step>

  <Step title="Registra il provider">
    Un provider minimale richiede un `id`, una `label`, `auth` e `catalog`:

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

    Questo è un provider funzionante. Ora gli utenti possono eseguire
    `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come modello.

    Se il provider upstream usa token di controllo diversi da OpenClaw, aggiungi una
    piccola trasformazione di testo bidirezionale invece di sostituire il percorso dello stream:

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

    `input` riscrive il prompt di sistema finale e il contenuto dei messaggi di testo prima
    del trasporto. `output` riscrive i delta di testo dell'assistente e il testo finale prima che
    OpenClaw analizzi i propri marcatori di controllo o la consegna del canale.

    Per i provider inclusi che registrano solo un provider di testo con autenticazione tramite chiave API
    più un singolo runtime basato su catalogo, preferisci l'helper più ristretto
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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` è il percorso del catalogo live usato quando OpenClaw può risolvere una reale
    autenticazione del provider. Può eseguire discovery specifica del provider. Usa
    `buildStaticProvider` solo per righe offline che è sicuro mostrare prima che l'autenticazione
    sia configurata; non deve richiedere credenziali né effettuare richieste di rete.
    La visualizzazione `models list --all` di OpenClaw attualmente esegue cataloghi statici
    solo per i plugin provider inclusi, con config vuota, env vuoto e nessun
    percorso di agente/workspace.

    Se il tuo flusso di autenticazione deve anche applicare patch a `models.providers.*`, alias e
    al modello predefinito dell'agente durante l'onboarding, usa gli helper predefiniti da
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più ristretti sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando l'endpoint nativo di un provider supporta blocchi di utilizzo in streaming sul
    normale trasporto `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di codificare controlli
    specifici per id del provider. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla
    mappa delle capacità dell'endpoint, quindi gli endpoint nativi in stile Moonshot/DashScope
    aderiscono comunque anche quando un plugin usa un id provider personalizzato.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica dei modelli">
    Se il tuo provider accetta ID modello arbitrari (come un proxy o router),
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

    Se la risoluzione richiede una chiamata di rete, usa `prepareDynamicModel` per il warm-up
    asincrono: `resolveDynamicModel` viene eseguito di nuovo al completamento.

  </Step>

  <Step title="Aggiungi hook di runtime (secondo necessità)">
    La maggior parte dei provider richiede solo `catalog` + `resolveDynamicModel`. Aggiungi hook
    in modo incrementale quando il tuo provider li richiede.

    I builder helper condivisi ora coprono le famiglie più comuni di replay/compatibilità strumenti,
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

    Famiglie di replay disponibili oggi:

    | Famiglia | Cosa collega | Esempi inclusi |
    | --- | --- | --- |
    | `openai-compatible` | Criterio di replay condiviso in stile OpenAI per trasporti compatibili con OpenAI, inclusi sanificazione dei tool-call-id, correzioni dell'ordinamento assistant-first e validazione generica dei turni Gemini dove il trasporto ne ha bisogno | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Criterio di replay consapevole di Claude scelto da `modelId`, quindi i trasporti di messaggi Anthropic ricevono pulizia dei blocchi di pensiero specifica per Claude solo quando il modello risolto è effettivamente un id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Criterio di replay Gemini nativo più sanificazione del replay di bootstrap e modalità di output di ragionamento con tag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanificazione della thought-signature Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili con OpenAI; non abilita la validazione del replay Gemini nativa né le riscritture di bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Criterio ibrido per provider che combinano superfici modello con messaggi Anthropic e compatibili con OpenAI in un unico plugin; l'eliminazione opzionale dei blocchi di pensiero solo Claude resta limitata al lato Anthropic | `minimax` |

    Famiglie di stream disponibili oggi:

    | Famiglia | Cosa collega | Esempi inclusi |
    | --- | --- | --- |
    | `google-thinking` | Normalizzazione dei payload di ragionamento Gemini sul percorso di stream condiviso | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper di ragionamento Kilo sul percorso di stream proxy condiviso, con `kilo/auto` e ID di ragionamento proxy non supportati che saltano il thinking iniettato | `kilocode` |
    | `moonshot-thinking` | Mappatura dei payload di native-thinking binari Moonshot dalla configurazione + livello `/think` | `moonshot` |
    | `minimax-fast-mode` | Riscrittura del modello fast-mode MiniMax sul percorso di stream condiviso | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper Responses OpenAI/Codex nativi condivisi: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa Codex, modellazione dei payload compatibili con il ragionamento e gestione del contesto Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper di ragionamento OpenRouter per route proxy, con salti per modello non supportato/`auto` gestiti centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo per impostazione predefinita per provider come Z.AI che vogliono lo streaming degli strumenti salvo disabilitazione esplicita | `zai` |

    <Accordion title="Seam SDK che alimentano i builder di famiglie">
      Ogni builder di famiglia è composto da helper pubblici di livello inferiore esportati dallo stesso pacchetto, che puoi usare quando un provider deve deviare dal pattern comune:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e i builder di replay grezzi (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Esporta anche helper di replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helper per endpoint/modelli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, oltre ai wrapper OpenAI/Codex condivisi (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), al wrapper compatibile con OpenAI per DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), alla pulizia del prefill di thinking per Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) e ai wrapper proxy/provider condivisi (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helper di schema Gemini sottostanti (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e helper di compatibilità xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Il Plugin xAI incluso usa `normalizeResolvedModel` + `contributeResolvedModelCompat` con questi helper per mantenere le regole xAI di proprietà del provider.

      Alcuni helper di stream restano intenzionalmente locali al provider. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder di wrapper Anthropic di livello inferiore nel proprio seam pubblico `api.ts` / `contract-api.ts` perché codificano la gestione beta di Claude OAuth e il gating `context1m`. Il Plugin xAI mantiene in modo analogo la modellazione nativa di xAI Responses nel proprio `wrapStreamFn` (alias `/fast`, `tool_stream` predefinito, pulizia degli strumenti strict non supportati, rimozione del payload di ragionamento specifica di xAI).

      Lo stesso pattern di radice pacchetto supporta anche `@openclaw/openai-provider` (builder di provider, helper per modello predefinito, builder di provider realtime) e `@openclaw/openrouter-provider` (builder di provider più helper di onboarding/configurazione).
    </Accordion>

    <Tabs>
      <Tab title="Scambio token">
        Per i provider che richiedono uno scambio token prima di ogni chiamata di inferenza:

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
        Per i provider che richiedono header di richiesta personalizzati o modifiche al corpo:

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
      <Tab title="Identità di trasporto nativa">
        Per i provider che richiedono header o metadati nativi di richiesta/sessione sui
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
        Per i provider che espongono dati di utilizzo/fatturazione:

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
      I campi provider solo per compatibilità che OpenClaw non chiama più, come
      `ProviderPlugin.capabilities` e `suppressBuiltInModel`, non sono elencati
      qui.

      | # | Hook | Quando usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogo modelli o URL di base predefiniti |
      | 2 | `applyConfigDefaults` | Valori globali predefiniti di proprietà del provider durante la materializzazione della configurazione |
      | 3 | `normalizeModelId` | Pulizia degli alias di ID modello legacy/preview prima della ricerca |
      | 4 | `normalizeTransport` | Pulizia `api` / `baseUrl` della famiglia provider prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizza la configurazione `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità dell'utilizzo in streaming nativo per provider di configurazione |
      | 7 | `resolveConfigApiKey` | Risoluzione dell'autenticazione con marker env di proprietà del provider |
      | 8 | `resolveSyntheticAuth` | Autenticazione sintetica locale/self-hosted o basata su configurazione |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abbassa i placeholder sintetici del profilo salvato dietro l'autenticazione env/config |
      | 10 | `resolveDynamicModel` | Accetta ID modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli vendor dietro un altro trasporto compatibile |
      | 14 | `normalizeToolSchemas` | Pulizia degli schemi degli strumenti di proprietà del provider prima della registrazione |
      | 15 | `inspectToolSchemas` | Diagnostica degli schemi degli strumenti di proprietà del provider |
      | 16 | `resolveReasoningOutputMode` | Contratto di output di ragionamento tagged vs nativo |
      | 17 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 18 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 19 | `wrapStreamFn` | Wrapper personalizzati di header/corpo sul percorso di stream normale |
      | 20 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 21 | `resolveWebSocketSessionPolicy` | Header/cooldown di sessione WS nativi |
      | 22 | `formatApiKey` | Forma token runtime personalizzata |
      | 23 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 24 | `buildAuthDoctorHint` | Guida alla riparazione dell'autenticazione |
      | 25 | `matchesContextOverflowError` | Rilevamento overflow di proprietà del provider |
      | 26 | `classifyFailoverReason` | Classificazione rate-limit/overload di proprietà del provider |
      | 27 | `isCacheTtlEligible` | Gating TTL della cache dei prompt |
      | 28 | `buildMissingAuthMessage` | Suggerimento personalizzato per autenticazione mancante |
      | 29 | `augmentModelCatalog` | Righe sintetiche di compatibilità futura |
      | 30 | `resolveThinkingProfile` | Set di opzioni `/think` specifico del modello |
      | 31 | `isBinaryThinking` | Compatibilità thinking binario on/off |
      | 32 | `supportsXHighThinking` | Compatibilità del supporto al ragionamento `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilità della policy `/think` predefinita |
      | 34 | `isModernModelRef` | Corrispondenza di modelli live/smoke |
      | 35 | `prepareRuntimeAuth` | Scambio token prima dell'inferenza |
      | 36 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 37 | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | 38 | `createEmbeddingProvider` | Adattatore embedding di proprietà del provider per memoria/ricerca |
      | 39 | `buildReplayPolicy` | Policy personalizzata di replay/Compaction della trascrizione |
      | 40 | `sanitizeReplayHistory` | Riscritture di replay specifiche del provider dopo la pulizia generica |
      | 41 | `validateReplayTurns` | Validazione strict dei turni di replay prima del runner incorporato |
      | 42 | `onModelSelected` | Callback post-selezione (ad es. telemetria) |

      Note sul fallback runtime:

      - `normalizeConfig` controlla prima il provider corrispondente, poi gli altri Plugin provider con hook finché uno modifica effettivamente la configurazione. Se nessun hook provider riscrive una voce di configurazione supportata della famiglia Google, viene comunque applicato il normalizzatore di configurazione Google incluso.
      - `resolveConfigApiKey` usa l'hook del provider quando esposto. Il percorso `amazon-bedrock` incluso ha anche qui un resolver integrato per marker env AWS, anche se l'autenticazione runtime Bedrock continua a usare la catena predefinita dell'SDK AWS.
      - `resolveSystemPromptContribution` consente a un provider di iniettare linee guida per il prompt di sistema sensibili alla cache per una famiglia di modelli. Preferiscilo a `before_prompt_build` quando il comportamento appartiene a una famiglia provider/modello e deve preservare la separazione stabile/dinamica della cache.

      Per descrizioni dettagliate ed esempi reali, vedi [Internals: hook runtime provider](/it/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capacità extra (facoltativo)">
    ### Passaggio 5: aggiungi capacità extra

    Un Plugin provider può registrare speech, trascrizione realtime, voce realtime,
    comprensione dei media, generazione di immagini, generazione di video, fetch web
    e ricerca web insieme all'inferenza di testo. OpenClaw classifica questo come
    Plugin **hybrid-capability**: il pattern consigliato per i Plugin aziendali
    (un Plugin per vendor). Vedi
    [Internals: proprietà delle capacità](/it/plugins/architecture#capability-ownership-model).

    Registra ogni capacità dentro `register(api)` insieme alla tua chiamata
    `api.registerProvider(...)` esistente. Scegli solo le schede di cui hai bisogno:

    <Tabs>
      <Tab title="Sintesi vocale (TTS)">
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

        Usa `assertOkOrThrowProviderError(...)` per gli errori HTTP del provider, così
        i plugin condividono letture limitate del corpo dell'errore, parsing degli errori JSON e
        suffissi request-id.
      </Tab>
      <Tab title="Trascrizione in tempo reale">
        Preferisci `createRealtimeTranscriptionWebSocketSession(...)`: l'helper condiviso
        gestisce acquisizione del proxy, backoff di riconnessione, flush alla chiusura, handshake
        di pronto, accodamento audio e diagnostica degli eventi di chiusura. Il tuo plugin
        mappa solo gli eventi upstream.

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

        I provider STT batch che inviano audio multipart con POST devono usare
        `buildAudioTranscriptionFormData(...)` da
        `openclaw/plugin-sdk/provider-http`. L'helper normalizza i nomi file di upload,
        inclusi gli upload AAC che richiedono un nome file in stile M4A per
        API di trascrizione compatibili.
      </Tab>
      <Tab title="Voce in tempo reale">
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

        Implementa `handleBargeIn` quando un trasporto può rilevare che una persona sta
        interrompendo la riproduzione dell'assistente e il provider supporta il troncamento o
        la cancellazione della risposta audio attiva.
      </Tab>
      <Tab title="Comprensione dei media">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Generazione di immagini e video">
        Le capacità video usano una struttura **consapevole della modalità**: `generate`,
        `imageToVideo` e `videoToVideo`. Campi aggregati semplici come
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` non sono
        sufficienti per dichiarare il supporto della modalità di trasformazione o le modalità disabilitate in modo pulito.
        La generazione musicale segue lo stesso schema con blocchi `generate` /
        `edit` espliciti.

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
      <Tab title="Recupero web e ricerca">
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
    ### Passaggio 6: test

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

## Pubblicare su ClawHub

I plugin provider si pubblicano nello stesso modo di qualsiasi altro plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui l'alias di pubblicazione legacy solo per skill; i pacchetti plugin devono usare
`clawhub package publish`.

## Struttura dei file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Riferimento sull'ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai provider
integrati:

| Ordine    | Quando        | Caso d'uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primo passaggio | Provider con semplice chiave API                |
| `profile` | Dopo simple   | Provider vincolati ai profili di autenticazione |
| `paired`  | Dopo profile  | Sintetizzare più voci correlate                 |
| `late`    | Ultimo passaggio | Sovrascrivere provider esistenti (vince in caso di collisione) |

## Passaggi successivi

- [Plugin di canale](/it/plugins/sdk-channel-plugins) — se il tuo plugin fornisce anche un canale
- [Runtime SDK](/it/plugins/sdk-runtime) — helper `api.runtime` (TTS, ricerca, subagent)
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo agli import dei sottopercorsi
- [Internals dei Plugin](/it/plugins/architecture-internals#provider-runtime-hooks) — dettagli degli hook ed esempi integrati

## Correlati

- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creare plugin](/it/plugins/building-plugins)
- [Creare plugin di canale](/it/plugins/sdk-channel-plugins)
