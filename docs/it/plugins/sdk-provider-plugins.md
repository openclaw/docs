---
read_when:
    - Stai creando un nuovo Plugin provider di modelli
    - Vuoi aggiungere un proxy compatibile OpenAI o un LLM personalizzato a OpenClaw
    - Devi capire autenticazione provider, cataloghi e hook runtime
sidebarTitle: Provider plugins
summary: Guida passo passo per creare un Plugin provider di modelli per OpenClaw
title: Creazione di Plugin provider
x-i18n:
    generated_at: "2026-04-24T08:53:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Questa guida illustra passo dopo passo come creare un Plugin provider che aggiunge un provider di modelli
(LLM) a OpenClaw. Alla fine avrai un provider con catalogo dei modelli,
autenticazione con API key e risoluzione dinamica del modello.

<Info>
  Se non hai mai creato prima alcun Plugin OpenClaw, leggi prima
  [Getting Started](/it/plugins/building-plugins) per la struttura base del pacchetto
  e la configurazione del manifest.
</Info>

<Tip>
  I Plugin provider aggiungono modelli al normale ciclo di inferenza di OpenClaw. Se il modello
  deve essere eseguito tramite un daemon agente nativo che gestisce thread, Compaction o eventi degli strumenti,
  abbina il provider a un [agent harness](/it/plugins/sdk-agent-harness)
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
      "description": "Provider di modelli Acme AI",
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
          "choiceLabel": "API key Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "API key Acme AI"
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
    quando una variante di provider deve riusare l'auth di un altro id provider. `modelSupport`
    è facoltativo e permette a OpenClaw di caricare automaticamente il tuo Plugin provider da
    id modello abbreviati come `acme-large` prima che esistano hook runtime. Se pubblichi il
    provider su ClawHub, i campi `openclaw.compat` e `openclaw.build`
    in `package.json` sono obbligatori.

  </Step>

  <Step title="Registra il provider">
    Un provider minimale ha bisogno di `id`, `label`, `auth` e `catalog`:

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
              label: "API key Acme AI",
              hint: "API key dalla tua dashboard Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Inserisci la tua API key Acme AI",
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
    `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come proprio modello.

    Se il provider upstream usa token di controllo diversi da OpenClaw, aggiungi una
    piccola trasformazione bidirezionale del testo invece di sostituire il percorso dello stream:

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

    `input` riscrive il prompt di sistema finale e il contenuto dei messaggi di testo prima del
    trasporto. `output` riscrive i delta di testo dell'assistente e il testo finale prima che
    OpenClaw analizzi i propri marcatori di controllo o la consegna ai canali.

    Per i provider integrati che registrano solo un provider di testo con autenticazione
    API key più un singolo runtime supportato da catalogo, preferisci l'helper più ristretto
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
            label: "API key Acme AI",
            hint: "API key dalla tua dashboard Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Inserisci la tua API key Acme AI",
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

    `buildProvider` è il percorso del catalogo live usato quando OpenClaw può risolvere
    l'autenticazione reale del provider. Può eseguire discovery specifico del provider. Usa
    `buildStaticProvider` solo per righe offline che è sicuro mostrare prima che l'autenticazione
    sia configurata; non deve richiedere credenziali né fare richieste di rete.
    La visualizzazione `models list --all` di OpenClaw attualmente esegue cataloghi statici
    solo per i Plugin provider integrati, con config vuota, env vuoto e senza
    percorsi agente/spazio di lavoro.

    Se il tuo flusso auth deve anche applicare patch a `models.providers.*`, alias e
    al modello predefinito dell'agente durante l'onboarding, usa gli helper preset da
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più ristretti sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando un endpoint nativo del provider supporta blocchi di utilizzo in streaming sul
    normale trasporto `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di hardcodare controlli sull'id del
    provider. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla mappa delle capability dell'endpoint,
    così endpoint nativi in stile Moonshot/DashScope continuano a optare
    anche quando un Plugin usa un id provider personalizzato.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica del modello">
    Se il tuo provider accetta id modello arbitrari (come un proxy o router),
    aggiungi `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog come sopra

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

    Se la risoluzione richiede una chiamata di rete, usa `prepareDynamicModel` per il
    warm-up asincrono — `resolveDynamicModel` viene eseguito di nuovo dopo il completamento.

  </Step>

  <Step title="Aggiungi hook runtime (se necessario)">
    La maggior parte dei provider ha bisogno solo di `catalog` + `resolveDynamicModel`. Aggiungi gli hook
    in modo incrementale secondo le esigenze del tuo provider.

    Gli helper builder condivisi ora coprono le famiglie più comuni di replay/tool-compat,
    quindi i Plugin di solito non hanno bisogno di collegare a mano ogni hook uno per uno:

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

    | Famiglia | Cosa collega | Esempi integrati |
    | --- | --- | --- |
    | `openai-compatible` | Policy condivisa di replay in stile OpenAI per trasporti compatibili OpenAI, inclusa sanitizzazione di tool-call-id, correzioni dell'ordine assistant-first e validazione generica del turno Gemini dove il trasporto lo richiede | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Policy di replay compatibile con Claude scelta tramite `modelId`, così i trasporti Anthropic-message ricevono la pulizia dei blocchi di thinking specifica di Claude solo quando il modello risolto è effettivamente un id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Policy nativa di replay Gemini più sanitizzazione del bootstrap replay e modalità di output del reasoning con tag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitizzazione della thought-signature Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili OpenAI; non abilita validazione nativa del replay Gemini né riscritture del bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Policy ibrida per provider che mescolano superfici modello Anthropic-message e OpenAI-compatible in un solo Plugin; l'eventuale eliminazione dei blocchi di thinking solo-Claude resta limitata al lato Anthropic | `minimax` |

    Famiglie di stream disponibili oggi:

    | Famiglia | Cosa collega | Esempi integrati |
    | --- | --- | --- |
    | `google-thinking` | Normalizzazione del payload di thinking Gemini sul percorso di stream condiviso | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper di reasoning Kilo sul percorso di stream proxy condiviso, con `kilo/auto` e id di proxy reasoning non supportati che saltano il thinking iniettato | `kilocode` |
    | `moonshot-thinking` | Mappatura Moonshot del payload binary native-thinking da config + livello `/think` | `moonshot` |
    | `minimax-fast-mode` | Riscrittura del modello MiniMax fast-mode sul percorso di stream condiviso | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper nativi condivisi OpenAI/Codex Responses: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, web search Codex nativo, modellazione del payload reasoning-compat e gestione del contesto Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper di reasoning OpenRouter per percorsi proxy, con skip di `auto` e dei modelli non supportati gestiti centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo di default per provider come Z.AI che vogliono lo streaming degli strumenti salvo disabilitazione esplicita | `zai` |

    <Accordion title="SDK seam che alimentano i family builder">
      Ogni family builder è composto da helper pubblici di livello più basso esportati dallo stesso pacchetto, che puoi usare quando un provider deve uscire dal pattern comune:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e i builder raw di replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Esporta anche helper di replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helper per endpoint/modelli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, più i wrapper condivisi OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) e i wrapper condivisi proxy/provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helper sottostanti per schema Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e helper compat xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Il Plugin xAI integrato usa `normalizeResolvedModel` + `contributeResolvedModelCompat` con questi per mantenere le regole xAI sotto la responsabilità del provider.

      Alcuni helper di stream restano intenzionalmente locali al provider. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder wrapper Anthropic di livello più basso nei propri seam pubblici `api.ts` / `contract-api.ts` perché codificano la gestione beta di Claude OAuth e il gating `context1m`. In modo simile, il Plugin xAI mantiene nel proprio `wrapStreamFn` la modellazione nativa delle Responses xAI (alias `/fast`, `tool_stream` predefinito, cleanup di strict-tool non supportati, rimozione del payload di reasoning specifica xAI).

      Lo stesso pattern package-root supporta anche `@openclaw/openai-provider` (builder provider, helper per modello predefinito, builder provider realtime) e `@openclaw/openrouter-provider` (builder provider più helper di onboarding/configurazione).
    </Accordion>

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
        Per provider che necessitano di header personalizzati della richiesta o modifiche al body:

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
        Per provider che necessitano di header o metadati nativi di richiesta/sessione su
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
      OpenClaw chiama gli hook in quest'ordine. La maggior parte dei provider ne usa solo 2-3:

      | # | Hook | Quando usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogo dei modelli o valori predefiniti dell'URL base |
      | 2 | `applyConfigDefaults` | Valori predefiniti globali gestiti dal provider durante la materializzazione della configurazione |
      | 3 | `normalizeModelId` | Pulizia degli alias di id modello legacy/preview prima della ricerca |
      | 4 | `normalizeTransport` | Pulizia di `api` / `baseUrl` della famiglia provider prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizza la configurazione `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità native per streaming-usage dei provider di configurazione |
      | 7 | `resolveConfigApiKey` | Risoluzione auth di env-marker gestita dal provider |
      | 8 | `resolveSyntheticAuth` | Auth sintetica locale/self-hosted o supportata da configurazione |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abbassa i placeholder del profilo memorizzato sintetico dietro auth env/config |
      | 10 | `resolveDynamicModel` | Accetta id modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono di metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli vendor dietro un altro trasporto compatibile |
      | 14 | `capabilities` | Legacy static capability bag; solo per compatibilità |
      | 15 | `normalizeToolSchemas` | Pulizia dello schema degli strumenti gestita dal provider prima della registrazione |
      | 16 | `inspectToolSchemas` | Diagnostica dello schema degli strumenti gestita dal provider |
      | 17 | `resolveReasoningOutputMode` | Contratto di output del reasoning con tag vs nativo |
      | 18 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 19 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 20 | `wrapStreamFn` | Wrapper personalizzati di header/body sul normale percorso di stream |
      | 21 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 22 | `resolveWebSocketSessionPolicy` | Header di sessione WS nativi / cooldown |
      | 23 | `formatApiKey` | Forma personalizzata del token runtime |
      | 24 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 25 | `buildAuthDoctorHint` | Guida alla riparazione auth |
      | 26 | `matchesContextOverflowError` | Rilevamento overflow gestito dal provider |
      | 27 | `classifyFailoverReason` | Classificazione rate-limit/sovraccarico gestita dal provider |
      | 28 | `isCacheTtlEligible` | Gating TTL della prompt cache |
      | 29 | `buildMissingAuthMessage` | Suggerimento personalizzato per auth mancante |
      | 30 | `suppressBuiltInModel` | Nasconde righe upstream obsolete |
      | 31 | `augmentModelCatalog` | Righe sintetiche forward-compat |
      | 32 | `resolveThinkingProfile` | Set di opzioni `/think` specifico del modello |
      | 33 | `isBinaryThinking` | Compatibilità thinking binario on/off |
      | 34 | `supportsXHighThinking` | Compatibilità del reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilità della policy predefinita `/think` |
      | 36 | `isModernModelRef` | Corrispondenza live/smoke del modello |
      | 37 | `prepareRuntimeAuth` | Scambio token prima dell'inferenza |
      | 38 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 39 | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | 40 | `createEmbeddingProvider` | Adapter di embedding gestito dal provider per memoria/ricerca |
      | 41 | `buildReplayPolicy` | Policy personalizzata di replay/Compaction della trascrizione |
      | 42 | `sanitizeReplayHistory` | Riscritture di replay specifiche del provider dopo la pulizia generica |
      | 43 | `validateReplayTurns` | Validazione strict dei turni di replay prima del runner incorporato |
      | 44 | `onModelSelected` | Callback post-selezione (ad esempio telemetria) |

      Note sui fallback runtime:

      - `normalizeConfig` controlla prima il provider corrispondente, poi altri Plugin provider con hook-capable finché uno non modifica effettivamente la configurazione. Se nessun hook provider riscrive una voce di configurazione supportata della famiglia Google, si applica comunque il normalizzatore integrato di configurazione Google.
      - `resolveConfigApiKey` usa l'hook provider quando esposto. Il percorso integrato `amazon-bedrock` ha qui anche un resolver integrato di env-marker AWS, anche se l'autenticazione runtime Bedrock stessa usa ancora la catena predefinita dell'AWS SDK.
      - `resolveSystemPromptContribution` permette a un provider di iniettare guida al prompt di sistema consapevole della cache per una famiglia di modelli. Preferiscilo a `before_prompt_build` quando il comportamento appartiene a un solo provider/famiglia di modelli e dovrebbe preservare la divisione cache stable/dynamic.

      Per descrizioni dettagliate ed esempi reali, vedi [Internals: Provider Runtime Hooks](/it/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capability extra (facoltativo)">
    Un Plugin provider può registrare voce, trascrizione realtime, voce realtime,
    comprensione dei media, generazione di immagini, generazione video, web fetch
    e web search insieme all'inferenza testuale. OpenClaw classifica questo come
    Plugin **hybrid-capability** — il pattern consigliato per i Plugin aziendali
    (un Plugin per vendor). Vedi
    [Internals: Capability Ownership](/it/plugins/architecture#capability-ownership-model).

    Registra ogni capability dentro `register(api)` accanto alla tua chiamata
    esistente `api.registerProvider(...)`. Scegli solo le schede che ti servono:

    <Tabs>
      <Tab title="Voce (TTS)">
        ```typescript
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
        ```
      </Tab>
      <Tab title="Trascrizione realtime">
        Preferisci `createRealtimeTranscriptionWebSocketSession(...)` — l'helper condiviso
        gestisce acquisizione proxy, reconnect backoff, flush in chiusura, handshake ready,
        queue dell'audio e diagnostica degli eventi di chiusura. Il tuo Plugin
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

        I provider STT batch che inviano audio multipart via POST dovrebbero usare
        `buildAudioTranscriptionFormData(...)` da
        `openclaw/plugin-sdk/provider-http`. L'helper normalizza i nomi file di upload,
        inclusi gli upload AAC che necessitano di un nome file in stile M4A per
        API di trascrizione compatibili.
      </Tab>
      <Tab title="Voce realtime">
        ```typescript
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
        ```
      </Tab>
      <Tab title="Comprensione dei media">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Una foto di..." }),
          transcribeAudio: async (req) => ({ text: "Trascrizione..." }),
        });
        ```
      </Tab>
      <Tab title="Generazione di immagini e video">
        Le capability video usano una forma **consapevole della modalità**: `generate`,
        `imageToVideo` e `videoToVideo`. Campi aggregati piatti come
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` non
        bastano per dichiarare chiaramente supporto alla modalità di trasformazione o modalità disabilitate.
        La generazione musicale segue lo stesso schema con blocchi espliciti `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* risultato immagine */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch e search">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Recupera pagine tramite il backend di rendering Acme.",
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Esporta l'oggetto di configurazione del provider da index.ts o da un file dedicato
    import { acmeProvider } from "./provider.js";

    describe("provider acme-ai", () => {
      it("risolve modelli dinamici", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("restituisce il catalogo quando la chiave è disponibile", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("restituisce catalogo nullo quando non c'è chiave", async () => {
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

I Plugin provider si pubblicano allo stesso modo di qualsiasi altro Plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui l'alias legacy di pubblicazione solo-Skills; i pacchetti Plugin dovrebbero usare
`clawhub package publish`.

## Struttura dei file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifest con metadati auth del provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Test
    └── usage.ts              # Endpoint di utilizzo (facoltativo)
```

## Riferimento per l'ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai
provider integrati:

| Ordine    | Quando        | Caso d'uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primo passaggio | Provider semplici con API key                |
| `profile` | Dopo simple   | Provider controllati da profili auth            |
| `paired`  | Dopo profile  | Sintetizza più voci correlate                   |
| `late`    | Ultimo passaggio | Sovrascrive provider esistenti (vince in caso di collisione) |

## Passi successivi

- [Channel Plugins](/it/plugins/sdk-channel-plugins) — se il tuo Plugin fornisce anche un canale
- [SDK Runtime](/it/plugins/sdk-runtime) — helper `api.runtime` (TTS, search, sottoagente)
- [SDK Overview](/it/plugins/sdk-overview) — riferimento completo agli import subpath
- [Plugin Internals](/it/plugins/architecture-internals#provider-runtime-hooks) — dettagli sugli hook ed esempi integrati

## Correlati

- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Creazione di Plugin di canale](/it/plugins/sdk-channel-plugins)
