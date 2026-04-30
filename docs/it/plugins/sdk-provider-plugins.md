---
read_when:
    - Stai sviluppando un nuovo Plugin provider di modelli
    - Vuoi aggiungere un proxy compatibile con OpenAI o un LLM personalizzato a OpenClaw
    - È necessario comprendere l'autenticazione dei provider, i cataloghi e gli hook di runtime
sidebarTitle: Provider plugins
summary: Guida passo passo alla creazione di un Plugin di provider di modelli per OpenClaw
title: Creazione di Plugin provider
x-i18n:
    generated_at: "2026-04-30T09:05:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Questa guida illustra come creare un plugin provider che aggiunge un provider di modelli
(LLM) a OpenClaw. Alla fine avrai un provider con un catalogo di modelli,
autenticazione tramite chiave API e risoluzione dinamica dei modelli.

<Info>
  Se non hai mai creato un Plugin OpenClaw, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

<Tip>
  I plugin provider aggiungono modelli al normale ciclo di inferenza di OpenClaw. Se il modello
  deve essere eseguito tramite un daemon agente nativo che gestisce thread, compaction o eventi
  degli strumenti, abbina il provider a un [harness agente](/it/plugins/sdk-agent-harness)
  invece di inserire i dettagli del protocollo del daemon nel core.
</Tip>

## Procedura guidata

<Steps>
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

    Il manifest dichiara `providerAuthEnvVars` così OpenClaw può rilevare
    le credenziali senza caricare il runtime del tuo Plugin. Aggiungi `providerAuthAliases`
    quando una variante del provider deve riutilizzare l'autenticazione dell'id di un altro provider. `modelSupport`
    è facoltativo e consente a OpenClaw di caricare automaticamente il tuo Plugin provider dagli id modello abbreviati
    come `acme-large` prima che esistano gli hook di runtime. Se pubblichi il
    provider su ClawHub, quei campi `openclaw.compat` e `openclaw.build`
    sono obbligatori in `package.json`.

  </Step>

  <Step title="Registra il provider">
    Un provider minimo richiede un `id`, una `label`, `auth` e un `catalog`:

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
    OpenClaw analizzi i propri marker di controllo o la consegna del canale.

    Per i provider inclusi che registrano un solo provider di testo con autenticazione tramite chiave API
    più un singolo runtime basato su catalogo, preferisci l'helper più specifico
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

    `buildProvider` è il percorso del catalogo live usato quando OpenClaw può risolvere l'autenticazione
    reale del provider. Può eseguire discovery specifica del provider. Usa
    `buildStaticProvider` solo per righe offline che sono sicure da mostrare prima che l'autenticazione
    sia configurata; non deve richiedere credenziali né effettuare richieste di rete.
    La visualizzazione `models list --all` di OpenClaw attualmente esegue cataloghi statici
    solo per i Plugin provider inclusi, con configurazione vuota, env vuoto e nessun
    percorso agente/workspace.

    Se il tuo flusso di autenticazione deve anche aggiornare `models.providers.*`, alias e
    il modello predefinito dell'agente durante l'onboarding, usa gli helper preset da
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più specifici sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando l'endpoint nativo di un provider supporta blocchi di usage in streaming sul
    normale trasporto `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di codificare rigidamente
    controlli sugli id provider. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla
    mappa delle capacità dell'endpoint, così gli endpoint nativi in stile Moonshot/DashScope
    continuano ad abilitarsi anche quando un Plugin usa un id provider personalizzato.

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

    Se la risoluzione richiede una chiamata di rete, usa `prepareDynamicModel` per il warm-up asincrono:
    `resolveDynamicModel` viene eseguito di nuovo dopo il completamento.

  </Step>

  <Step title="Aggiungi hook di runtime (se necessari)">
    La maggior parte dei provider richiede solo `catalog` + `resolveDynamicModel`. Aggiungi gli hook
    in modo incrementale man mano che il tuo provider li richiede.

    I builder helper condivisi ora coprono le famiglie più comuni di compatibilità replay/strumenti,
    quindi di solito i Plugin non devono collegare manualmente ogni hook uno per uno:

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

    Famiglie di replay attualmente disponibili:

    | Famiglia | Cosa collega | Esempi inclusi |
    | --- | --- | --- |
    | `openai-compatible` | Policy di replay condivisa in stile OpenAI per trasporti compatibili con OpenAI, inclusi sanificazione dei tool-call-id, correzioni dell'ordinamento assistant-first e validazione generica dei turni Gemini dove il trasporto la richiede | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Policy di replay consapevole di Claude scelta da `modelId`, così i trasporti con messaggi Anthropic ricevono la pulizia dei blocchi thinking specifica di Claude solo quando il modello risolto è effettivamente un id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Policy di replay nativa Gemini più sanificazione del replay di bootstrap e modalità reasoning-output con tag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanificazione delle thought-signature Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili con OpenAI; non abilita la validazione del replay nativo Gemini né le riscritture di bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Policy ibrida per provider che combinano superfici modello con messaggi Anthropic e compatibili con OpenAI in un unico Plugin; l'eliminazione facoltativa dei blocchi thinking solo per Claude resta limitata al lato Anthropic | `minimax` |

    Famiglie di stream attualmente disponibili:

    | Famiglia | Che cosa collega | Esempi inclusi |
    | --- | --- | --- |
    | `google-thinking` | Normalizzazione del payload di ragionamento Gemini nel percorso di stream condiviso | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper di ragionamento Kilo nel percorso di stream proxy condiviso, con `kilo/auto` e gli id di ragionamento proxy non supportati che saltano il ragionamento iniettato | `kilocode` |
    | `moonshot-thinking` | Mappatura del payload binario native-thinking di Moonshot dalla configurazione + livello `/think` | `moonshot` |
    | `minimax-fast-mode` | Riscrittura del modello MiniMax fast-mode nel percorso di stream condiviso | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper Responses OpenAI/Codex nativi condivisi: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa di Codex, modellazione del payload compatibile con il ragionamento e gestione del contesto Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper di ragionamento OpenRouter per le rotte proxy, con salti per modello non supportato/`auto` gestiti centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo per impostazione predefinita per provider come Z.AI che vogliono lo streaming degli strumenti salvo disabilitazione esplicita | `zai` |

    <Accordion title="Punti di integrazione SDK alla base dei builder di famiglia">
      Ogni builder di famiglia è composto da helper pubblici di livello inferiore esportati dallo stesso pacchetto, a cui puoi ricorrere quando un provider deve uscire dal modello comune:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e i builder di replay grezzi (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Esporta anche helper di replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helper per endpoint/modello (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, più i wrapper OpenAI/Codex condivisi (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper compatibile con OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), pulizia del prefill di ragionamento Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) e wrapper proxy/provider condivisi (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helper di schema Gemini sottostanti (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e helper di compatibilità xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Il Plugin xAI incluso usa `normalizeResolvedModel` + `contributeResolvedModelCompat` con questi elementi per mantenere le regole xAI di proprietà del provider.

      Alcuni helper di stream restano intenzionalmente locali al provider. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder di wrapper Anthropic di livello inferiore nel proprio punto di integrazione pubblico `api.ts` / `contract-api.ts` perché codificano la gestione delle beta OAuth Claude e il gating `context1m`. Analogamente, il Plugin xAI mantiene la modellazione nativa di xAI Responses nel proprio `wrapStreamFn` (alias `/fast`, `tool_stream` predefinito, pulizia degli strumenti strict non supportati, rimozione del payload di ragionamento specifica di xAI).

      Lo stesso modello a radice di pacchetto supporta anche `@openclaw/openai-provider` (builder di provider, helper per modello predefinito, builder di provider realtime) e `@openclaw/openrouter-provider` (builder di provider più helper di onboarding/configurazione).
    </Accordion>

    <Tabs>
      <Tab title="Scambio di token">
        Per i provider che richiedono uno scambio di token prima di ogni chiamata di inferenza:

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
        Per i provider che richiedono header o metadati nativi di richiesta/sessione su
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
      | 1 | `catalog` | Catalogo dei modelli o valori predefiniti dell'URL di base |
      | 2 | `applyConfigDefaults` | Valori predefiniti globali di proprietà del provider durante la materializzazione della configurazione |
      | 3 | `normalizeModelId` | Pulizia degli alias degli id modello legacy/preview prima della ricerca |
      | 4 | `normalizeTransport` | Pulizia di `api` / `baseUrl` della famiglia di provider prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizza la configurazione `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità dell'utilizzo in streaming nativo per i provider di configurazione |
      | 7 | `resolveConfigApiKey` | Risoluzione dell'autenticazione tramite marker env di proprietà del provider |
      | 8 | `resolveSyntheticAuth` | Autenticazione sintetica locale/self-hosted o basata su configurazione |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abbassa i segnaposto sintetici del profilo memorizzato dietro autenticazione env/config |
      | 10 | `resolveDynamicModel` | Accetta ID modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli del fornitore dietro un altro trasporto compatibile |
      | 14 | `normalizeToolSchemas` | Pulizia degli schemi degli strumenti di proprietà del provider prima della registrazione |
      | 15 | `inspectToolSchemas` | Diagnostica degli schemi degli strumenti di proprietà del provider |
      | 16 | `resolveReasoningOutputMode` | Contratto dell'output di ragionamento tagged vs nativo |
      | 17 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 18 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 19 | `wrapStreamFn` | Wrapper personalizzati di header/corpo nel percorso di stream normale |
      | 20 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 21 | `resolveWebSocketSessionPolicy` | Header/cool-down di sessione WS nativi |
      | 22 | `formatApiKey` | Forma personalizzata del token a runtime |
      | 23 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 24 | `buildAuthDoctorHint` | Indicazioni per riparare l'autenticazione |
      | 25 | `matchesContextOverflowError` | Rilevamento di overflow di proprietà del provider |
      | 26 | `classifyFailoverReason` | Classificazione di rate limit/sovraccarico di proprietà del provider |
      | 27 | `isCacheTtlEligible` | Gating del TTL della cache del prompt |
      | 28 | `buildMissingAuthMessage` | Suggerimento personalizzato per autenticazione mancante |
      | 29 | `augmentModelCatalog` | Righe sintetiche di compatibilità futura |
      | 30 | `resolveThinkingProfile` | Set di opzioni `/think` specifico del modello |
      | 31 | `isBinaryThinking` | Compatibilità del pensiero binario on/off |
      | 32 | `supportsXHighThinking` | Compatibilità del supporto di ragionamento `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilità della policy `/think` predefinita |
      | 34 | `isModernModelRef` | Corrispondenza del modello live/smoke |
      | 35 | `prepareRuntimeAuth` | Scambio di token prima dell'inferenza |
      | 36 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 37 | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | 38 | `createEmbeddingProvider` | Adattatore embedding di proprietà del provider per memoria/ricerca |
      | 39 | `buildReplayPolicy` | Policy personalizzata di replay/Compaction della trascrizione |
      | 40 | `sanitizeReplayHistory` | Riscritture di replay specifiche del provider dopo la pulizia generica |
      | 41 | `validateReplayTurns` | Validazione rigorosa dei turni di replay prima del runner incorporato |
      | 42 | `onModelSelected` | Callback post-selezione (es. telemetria) |

      Note sul fallback a runtime:

      - `normalizeConfig` controlla prima il provider corrispondente, poi altri Plugin provider capaci di hook finché uno non modifica effettivamente la configurazione. Se nessun hook provider riscrive una voce di configurazione della famiglia Google supportata, si applica comunque il normalizzatore di configurazione Google incluso.
      - `resolveConfigApiKey` usa l'hook provider quando esposto. Anche il percorso `amazon-bedrock` incluso dispone qui di un resolver AWS integrato per marker env, anche se l'autenticazione runtime di Bedrock continua a usare la catena predefinita dell'AWS SDK.
      - `resolveSystemPromptContribution` consente a un provider di iniettare indicazioni di prompt di sistema consapevoli della cache per una famiglia di modelli. Preferiscilo a `before_prompt_build` quando il comportamento appartiene a un provider/una famiglia di modelli e deve preservare la separazione stabile/dinamica della cache.

      Per descrizioni dettagliate ed esempi reali, consulta [Interni: Hook runtime dei provider](/it/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capacità extra (facoltativo)">
    Un Plugin provider può registrare speech, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione di video, web fetch
    e ricerca web insieme all'inferenza testuale. OpenClaw lo classifica come un
    Plugin **hybrid-capability**: il modello consigliato per i Plugin aziendali
    (un Plugin per fornitore). Consulta
    [Interni: Proprietà delle capacità](/it/plugins/architecture#capability-ownership-model).

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
        i plugin condividono letture limitate del corpo dell'errore, analisi degli errori JSON e
        suffissi degli ID richiesta.
      </Tab>
      <Tab title="Trascrizione in tempo reale">
        Preferisci `createRealtimeTranscriptionWebSocketSession(...)`: l'helper
        condiviso gestisce acquisizione del proxy, backoff di riconnessione, flush alla chiusura, handshake
        di disponibilità, accodamento dell'audio e diagnostica degli eventi di chiusura. Il tuo plugin
        deve solo mappare gli eventi upstream.

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

        I provider STT batch che inviano audio multipart tramite POST dovrebbero usare
        `buildAudioTranscriptionFormData(...)` da
        `openclaw/plugin-sdk/provider-http`. L'helper normalizza i nomi dei file di upload,
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
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
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
        Le funzionalità video usano una struttura **consapevole della modalità**: `generate`,
        `imageToVideo` e `videoToVideo`. Campi aggregati piatti come
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` non sono
        sufficienti per dichiarare in modo pulito il supporto alla modalità di trasformazione o le modalità disabilitate.
        La generazione musicale segue lo stesso schema con blocchi espliciti `generate` /
        `edit`.

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
      <Tab title="Recupero e ricerca web">
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

## Pubblicare su ClawHub

I plugin provider si pubblicano nello stesso modo di qualsiasi altro plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui l'alias legacy di pubblicazione solo per skill; i pacchetti plugin dovrebbero usare
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

## Riferimento per l'ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai provider
integrati:

| Ordine    | Quando        | Caso d'uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primo passaggio | Provider con semplice chiave API                |
| `profile` | Dopo simple   | Provider vincolati ai profili di autenticazione |
| `paired`  | Dopo profile  | Sintetizzare più voci correlate                 |
| `late`    | Ultimo passaggio | Sovrascrivere provider esistenti (vince in caso di collisione) |

## Passaggi successivi

- [Plugin canale](/it/plugins/sdk-channel-plugins) — se il tuo plugin fornisce anche un canale
- [Runtime SDK](/it/plugins/sdk-runtime) — helper `api.runtime` (TTS, ricerca, subagent)
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo agli import dei sotto-percorsi
- [Interni dei Plugin](/it/plugins/architecture-internals#provider-runtime-hooks) — dettagli degli hook ed esempi integrati

## Correlati

- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creare plugin](/it/plugins/building-plugins)
- [Creare plugin canale](/it/plugins/sdk-channel-plugins)
