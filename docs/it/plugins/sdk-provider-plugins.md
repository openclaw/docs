---
read_when:
    - Stai creando un nuovo plugin provider di modelli
    - Vuoi aggiungere a OpenClaw un proxy compatibile con OpenAI o un LLM personalizzato
    - Devi comprendere l'autenticazione dei provider, i cataloghi e gli hook di runtime
sidebarTitle: Provider plugins
summary: Guida passo passo alla creazione di un Plugin provider di modelli per OpenClaw
title: Creazione di Plugin provider
x-i18n:
    generated_at: "2026-06-27T18:01:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Questa guida illustra come creare un Plugin provider che aggiunge un provider di modelli
(LLM) a OpenClaw. Alla fine avrai un provider con un catalogo di modelli,
autenticazione tramite chiave API e risoluzione dinamica dei modelli.

<Info>
  Se non hai mai creato un Plugin OpenClaw prima, leggi prima
  [Introduzione](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

<Tip>
  I Plugin provider aggiungono modelli al normale ciclo di inferenza di OpenClaw. Se il modello
  deve essere eseguito tramite un daemon agente nativo che possiede thread, Compaction o eventi
  degli strumenti, abbina il provider a un [harness agente](/it/plugins/sdk-agent-harness)
  invece di inserire i dettagli del protocollo del daemon nel core.
</Tip>

## Procedura guidata

<Steps>
  <Step title="Package and manifest">
    ### Passaggio 1: pacchetto e manifest

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

    Il manifest dichiara `setup.providers[].envVars` così OpenClaw può rilevare
    le credenziali senza caricare il runtime del tuo Plugin. Aggiungi `providerAuthAliases`
    quando una variante del provider deve riutilizzare l'autenticazione dell'id di un altro provider. `modelSupport`
    è opzionale e consente a OpenClaw di caricare automaticamente il tuo Plugin provider da id
    di modelli abbreviati come `acme-large` prima che esistano gli hook runtime. Se pubblichi il
    provider su ClawHub, quei campi `openclaw.compat` e `openclaw.build`
    sono obbligatori in `package.json`.

  </Step>

  <Step title="Register the provider">
    Un provider testuale minimale richiede un `id`, una `label`, `auth` e `catalog`.
    `catalog` è l'hook runtime/config di proprietà del provider; può chiamare API live
    del vendor e restituisce voci `models.providers`.

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

    `registerModelCatalogProvider` è la superficie di catalogo control-plane più recente
    per interfacce di elenco/aiuto/selettore. Usala per righe di testo, generazione di immagini,
    generazione di video e generazione musicale. Mantieni nel Plugin le chiamate agli endpoint del vendor e
    la mappatura delle risposte; OpenClaw possiede la forma condivisa delle righe, le etichette
    di origine e il rendering dell'aiuto.

    Questo è un provider funzionante. Gli utenti ora possono
    eseguire `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come modello.

    ### Rilevamento live dei modelli

    Se il tuo provider espone un'API in stile `/models`, mantieni nel tuo Plugin
    l'endpoint specifico del provider e la proiezione delle righe e usa
    `openclaw/plugin-sdk/provider-catalog-live-runtime` per il ciclo di vita condiviso
    del fetch. L'helper fornisce fetch HTTP protetti, header di autenticazione del provider,
    errori HTTP strutturati, caching TTL e comportamento di fallback statico senza
    inserire policy del provider nel core di OpenClaw.

    Usa `buildLiveModelProviderConfig` quando l'API live indica solo quali
    righe del catalogo statico di proprietà del provider sono attualmente disponibili:

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

    Usa `getCachedLiveProviderModelRows` quando l'API del provider restituisce metadati
    più ricchi e il Plugin deve proiettare autonomamente le righe nelle definizioni
    dei modelli OpenClaw:

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

    `run` deve restare vincolato all'autenticazione e restituire `null` quando non è
    disponibile alcuna credenziale utilizzabile. Mantieni un `staticRun` offline o un fallback statico in modo che configurazione, documentazione,
    test e superfici di selezione non dipendano dall'accesso alla rete live. Usa un TTL
    appropriato per la freschezza dell'elenco dei modelli, evita il polling del filesystem al momento della richiesta
    e passa un `readRows` / `readModelId` specifico del provider solo quando la
    risposta upstream non ha una forma compatibile con OpenAI `{ data: [{ id, object }] }`.

    Se il provider upstream usa token di controllo diversi da OpenClaw, aggiungi una
    piccola trasformazione testuale bidirezionale invece di sostituire il percorso di stream:

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
    del trasporto. `output` riscrive i delta testuali dell'assistente e il testo finale prima che
    OpenClaw analizzi i propri marker di controllo o la consegna al canale.

    Per provider in bundle che registrano solo un provider testuale con autenticazione tramite chiave API
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

    `buildProvider` è il percorso del catalogo live usato quando OpenClaw può risolvere l'autenticazione
    reale del provider. Può eseguire discovery specifica del provider. Usa
    `buildStaticProvider` solo per righe offline che è sicuro mostrare prima che l'autenticazione
    sia configurata; non deve richiedere credenziali né effettuare richieste di rete.
    La visualizzazione `models list --all` di OpenClaw attualmente esegue i cataloghi statici
    solo per i Plugin provider inclusi, con configurazione vuota, env vuoto e nessun
    percorso agente/workspace.

    Se il tuo flusso di autenticazione deve anche applicare patch a `models.providers.*`, alias e
    al modello predefinito dell'agente durante l'onboarding, usa gli helper preset da
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più specifici sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando l'endpoint nativo di un provider supporta blocchi di utilizzo in streaming sul
    normale trasporto `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di codificare controlli
    provider-id. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla
    mappa delle capability dell'endpoint, quindi gli endpoint nativi in stile Moonshot/DashScope
    si attivano comunque anche quando un Plugin usa un id provider personalizzato.

    Gli esempi di discovery live sopra coprono API provider in stile `/models`. Mantieni
    tale discovery dentro `catalog.run`, vincolata ad autenticazione utilizzabile, e mantieni
    `staticRun` senza rete per la generazione del catalogo offline.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica del modello">
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

    Se la risoluzione richiede una chiamata di rete, usa `prepareDynamicModel` per il
    warm-up asincrono: `resolveDynamicModel` viene eseguito di nuovo al completamento.

  </Step>

  <Step title="Aggiungi hook runtime (secondo necessità)">
    La maggior parte dei provider necessita solo di `catalog` + `resolveDynamicModel`. Aggiungi hook
    in modo incrementale man mano che il tuo provider li richiede.

    I builder helper condivisi ora coprono le famiglie più comuni di compatibilità replay/tool,
    quindi i Plugin di solito non devono collegare manualmente ogni hook uno per uno:

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
    | `openai-compatible` | Policy di replay condivisa in stile OpenAI per trasporti compatibili con OpenAI, inclusa la sanitizzazione dei tool-call-id, correzioni dell'ordinamento con assistente per primo e validazione generica dei turni Gemini dove il trasporto ne ha bisogno | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Policy di replay consapevole di Claude scelta da `modelId`, così i trasporti con messaggi Anthropic ricevono la pulizia dei blocchi di pensiero specifica di Claude solo quando il modello risolto è effettivamente un id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Policy di replay Gemini nativa più sanitizzazione del replay di bootstrap. La famiglia condivisa mantiene la CLI Gemini con output testuale sul ragionamento con tag; il provider diretto `google` sovrascrive `resolveReasoningOutputMode` su `native` perché il pensiero dell'API Gemini arriva come parti di pensiero native. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitizzazione della firma di pensiero Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili con OpenAI; non abilita la validazione del replay Gemini nativa né le riscritture di bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Policy ibrida per provider che combinano superfici modello con messaggi Anthropic e compatibili con OpenAI in un unico Plugin; l'eliminazione opzionale dei blocchi di pensiero solo Claude resta limitata al lato Anthropic | `minimax` |

    Famiglie di stream disponibili oggi:

    | Famiglia | Cosa collega | Esempi inclusi |
    | --- | --- | --- |
    | `google-thinking` | Normalizzazione del payload di pensiero Gemini sul percorso stream condiviso | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper di ragionamento Kilo sul percorso stream proxy condiviso, con `kilo/auto` e id di ragionamento proxy non supportati che saltano il pensiero iniettato | `kilocode` |
    | `moonshot-thinking` | Mapping del payload binario di pensiero nativo Moonshot da config + livello `/think` | `moonshot` |
    | `minimax-fast-mode` | Riscrittura del modello fast-mode MiniMax sul percorso stream condiviso | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper Responses nativi OpenAI/Codex condivisi: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa Codex, modellazione del payload di compatibilità del ragionamento e gestione del contesto Responses | `openai` |
    | `openrouter-thinking` | Wrapper di ragionamento OpenRouter per route proxy, con salti per modelli non supportati/`auto` gestiti centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo per impostazione predefinita per provider come Z.AI che vogliono lo streaming degli strumenti salvo disabilitazione esplicita | `zai` |

    <Accordion title="Punti di integrazione SDK che alimentano i builder di famiglia">
      Ogni builder di famiglia è composto da helper pubblici di livello inferiore esportati dallo stesso pacchetto, che puoi usare quando un provider deve discostarsi dal pattern comune:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e i builder di replay grezzi (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Esporta anche helper di replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helper per endpoint/modello (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, più i wrapper OpenAI/Codex condivisi (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper compatibile con OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), pulizia del prefill di pensiero Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), compatibilità delle chiamate agli strumenti in testo semplice (`createPlainTextToolCallCompatWrapper`) e wrapper proxy/provider condivisi (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - wrapper leggeri per payload ed eventi per percorsi provider caldi, inclusi `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` e `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` e helper sottostanti per gli schemi provider.

      Per i provider della famiglia Gemini, mantieni la modalità di output del ragionamento allineata al
      trasporto. I provider diretti dell'API Google Gemini dovrebbero usare l'output di ragionamento
      `native` così OpenClaw consuma parti di pensiero native senza aggiungere
      direttive di prompt `<think>` / `<final>`. I backend Gemini in stile CLI solo testo
      che analizzano una risposta finale JSON/testo possono mantenere il contratto condiviso
      `google-gemini` con tag.

      Alcuni helper di stream restano locali al provider di proposito. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder di wrapper Anthropic di livello inferiore nel proprio punto di integrazione pubblico `api.ts` / `contract-api.ts` perché codificano la gestione beta OAuth di Claude e il gating `context1m`. Il Plugin xAI mantiene analogamente la modellazione nativa xAI Responses nel proprio `wrapStreamFn` (alias `/fast`, `tool_stream` predefinito, pulizia strict-tool non supportata, rimozione del payload di ragionamento specifica di xAI).

      Lo stesso pattern a radice di pacchetto supporta anche `@openclaw/openai-provider` (builder provider, helper per modello predefinito, builder provider realtime) e `@openclaw/openrouter-provider` (builder provider più helper di onboarding/configurazione).
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
        Per i provider che richiedono header di richiesta personalizzati o modifiche al body:

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

        `resolveUsageAuth` ha tre esiti. Restituisci `{ token, accountId? }`
        quando il provider ha una credenziale di utilizzo/fatturazione. Restituisci
        `{ handled: true }` solo quando il provider ha gestito in modo definitivo
        l'autenticazione per l'utilizzo ma non ha alcun token di utilizzo usabile,
        e OpenClaw deve saltare il fallback generico
        API-key/OAuth. Restituisci `null` o `undefined` quando il provider non ha
        gestito la richiesta e OpenClaw deve continuare con il fallback generico.
      </Tab>
    </Tabs>

    <Accordion title="Tutti gli hook provider disponibili">
      OpenClaw chiama gli hook in questo ordine. La maggior parte dei provider ne usa solo 2-3:
      i campi provider solo per compatibilità che OpenClaw non chiama più, come
      `ProviderPlugin.capabilities` e `suppressBuiltInModel`, non sono elencati
      qui.

      | # | Hook | Quando usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogo dei modelli o valori predefiniti dell'URL di base |
      | 2 | `applyConfigDefaults` | Valori predefiniti globali di proprietà del provider durante la materializzazione della configurazione |
      | 3 | `normalizeModelId` | Pulizia degli alias legacy/preview degli ID modello prima della ricerca |
      | 4 | `normalizeTransport` | Pulizia di `api` / `baseUrl` della famiglia di provider prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizza la configurazione `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità dell'utilizzo dello streaming nativo per i provider di configurazione |
      | 7 | `resolveConfigApiKey` | Risoluzione dell'autenticazione con marker env di proprietà del provider |
      | 8 | `resolveSyntheticAuth` | Autenticazione sintetica locale/self-hosted o basata su configurazione |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abbassa i segnaposto sintetici del profilo memorizzato dietro l'autenticazione env/config |
      | 10 | `resolveDynamicModel` | Accetta ID modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |
      | 13 | `normalizeToolSchemas` | Pulizia degli schemi degli strumenti di proprietà del provider prima della registrazione |
      | 14 | `inspectToolSchemas` | Diagnostica degli schemi degli strumenti di proprietà del provider |
      | 15 | `resolveReasoningOutputMode` | Contratto di output di reasoning con tag rispetto a nativo |
      | 16 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 17 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 19 | `wrapStreamFn` | Wrapper personalizzati di header/body sul percorso di stream normale |
      | 20 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 21 | `resolveWebSocketSessionPolicy` | Header sessione WS/cool-down nativi |
      | 22 | `formatApiKey` | Forma personalizzata del token di runtime |
      | 23 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 24 | `buildAuthDoctorHint` | Guida alla riparazione dell'autenticazione |
      | 25 | `matchesContextOverflowError` | Rilevamento dell'overflow di proprietà del provider |
      | 26 | `classifyFailoverReason` | Classificazione rate-limit/sovraccarico di proprietà del provider |
      | 27 | `isCacheTtlEligible` | Gate TTL della cache dei prompt |
      | 28 | `buildMissingAuthMessage` | Suggerimento personalizzato per autenticazione mancante |
      | 29 | `augmentModelCatalog` | Righe sintetiche di compatibilità futura |
      | 30 | `resolveThinkingProfile` | Set di opzioni `/think` specifico del modello |
      | 31 | `isBinaryThinking` | Compatibilità thinking binario on/off |
      | 32 | `supportsXHighThinking` | Compatibilità del supporto al reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilità della policy `/think` predefinita |
      | 34 | `isModernModelRef` | Corrispondenza modello live/smoke |
      | 35 | `prepareRuntimeAuth` | Scambio del token prima dell'inferenza |
      | 36 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 37 | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | 38 | `createEmbeddingProvider` | Adapter embedding di proprietà del provider per memoria/ricerca |
      | 39 | `buildReplayPolicy` | Policy personalizzata di replay/compaction della trascrizione |
      | 40 | `sanitizeReplayHistory` | Riscritture replay specifiche del provider dopo la pulizia generica |
      | 41 | `validateReplayTurns` | Validazione rigorosa dei turni replay prima del runner incorporato |
      | 42 | `onModelSelected` | Callback post-selezione (ad es. telemetria) |

      Note sul fallback di runtime:

      - `normalizeConfig` controlla prima il provider corrispondente, poi altri Plugin provider con hook finché uno non modifica effettivamente la configurazione. Se nessun hook provider riscrive una voce di configurazione supportata della famiglia Google, si applica comunque il normalizzatore di configurazione Google incluso.
      - `resolveConfigApiKey` usa l'hook provider quando esposto. Amazon Bedrock mantiene la risoluzione del marker env AWS nel proprio Plugin provider; l'autenticazione di runtime in sé usa comunque la catena predefinita dell'AWS SDK quando configurata con `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` riceve il `provider` selezionato, `modelId`, l'hint del catalogo `reasoning` unito facoltativo e i fatti `compat` del modello uniti facoltativi. Usa `compat` solo per selezionare l'interfaccia/profilo thinking del provider.
      - `resolveSystemPromptContribution` consente a un provider di iniettare una guida al prompt di sistema consapevole della cache per una famiglia di modelli. Preferiscilo a `before_prompt_build` quando il comportamento appartiene a una sola famiglia provider/modello e deve preservare la separazione stabile/dinamica della cache.

      Per descrizioni dettagliate ed esempi reali, consulta [Internals: Hook di runtime del provider](/it/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capacità extra (facoltativo)">
    ### Passaggio 5: Aggiungi capacità extra

    Un Plugin provider può registrare embedding, sintesi vocale, trascrizione realtime,
    voce realtime, comprensione dei media, generazione di immagini, generazione di video,
    recupero web e ricerca web insieme all'inferenza testuale. OpenClaw classifica questo come un
    Plugin **hybrid-capability**, il pattern consigliato per i Plugin aziendali
    (un Plugin per vendor). Consulta
    [Internals: Proprietà delle capacità](/it/plugins/architecture#capability-ownership-model).

    Registra ogni capacità dentro `register(api)` insieme alla tua chiamata
    `api.registerProvider(...)` esistente. Scegli solo le schede che ti servono:

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

        Usa `assertOkOrThrowProviderError(...)` per gli errori HTTP del provider, così
        i Plugin condividono letture limitate del corpo d'errore, parsing degli errori JSON e
        suffissi request-id.
      </Tab>
      <Tab title="Trascrizione realtime">
        Preferisci `createRealtimeTranscriptionWebSocketSession(...)`: l'helper condiviso
        gestisce acquisizione proxy, backoff di riconnessione, flush alla chiusura, handshake
        ready, accodamento audio e diagnostica degli eventi di chiusura. Il tuo Plugin
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

        I provider STT batch che inviano audio multipart tramite POST devono usare
        `buildAudioTranscriptionFormData(...)` da
        `openclaw/plugin-sdk/provider-http`. L'helper normalizza i nomi file di upload,
        inclusi gli upload AAC che richiedono un nome file in stile M4A per
        API di trascrizione compatibili.
      </Tab>
      <Tab title="Voce realtime">
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

        Dichiara `capabilities` affinché `talk.catalog` possa esporre modalità,
        trasporti, formati audio e flag di funzionalità validi ai client Talk
        browser e nativi. Implementa `handleBargeIn` quando un trasporto può rilevare che un
        essere umano sta interrompendo la riproduzione dell'assistente e il provider supporta
        il troncamento o la cancellazione della risposta audio attiva.
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

        I provider multimediali locali o self-hosted che intenzionalmente non richiedono
        credenziali possono esporre `resolveAuth` e restituire `kind: "none"`.
        OpenClaw mantiene comunque il normale gate di autenticazione per i provider che non
        effettuano esplicitamente l'opt-in. I provider esistenti possono continuare a leggere `req.apiKey`;
        i nuovi provider dovrebbero preferire `req.auth`.

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
      <Tab title="Embedding">
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

        Dichiara lo stesso id in `contracts.embeddingProviders`. Questo è il
        contratto generale di embedding per la generazione riutilizzabile di vettori, inclusa
        la ricerca nella memoria. `registerMemoryEmbeddingProvider(...)` è compatibilità deprecata
        per gli adapter esistenti specifici della memoria.
      </Tab>
      <Tab title="Generazione di immagini e video">
        Le capacità video usano una forma **sensibile alla modalità**: `generate`,
        `imageToVideo` e `videoToVideo`. Campi aggregati piatti come
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` non sono
        sufficienti per pubblicizzare in modo pulito il supporto alle modalità di trasformazione o le modalità disabilitate.
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
    ### Passaggio 6: Test

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

I Plugin provider vengono pubblicati nello stesso modo di qualsiasi altro Plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui l'alias di pubblicazione legacy solo per Skills; i pacchetti Plugin dovrebbero usare
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

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai
provider integrati:

| Ordine    | Quando        | Caso d'uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primo passaggio | Provider con semplice chiave API              |
| `profile` | Dopo simple   | Provider vincolati ai profili di autenticazione |
| `paired`  | Dopo profile  | Sintetizzare più voci correlate                 |
| `late`    | Ultimo passaggio | Sovrascrivere provider esistenti (vince in caso di collisione) |

## Passaggi successivi

- [Plugin di canale](/it/plugins/sdk-channel-plugins) - se il tuo Plugin fornisce anche un canale
- [Runtime SDK](/it/plugins/sdk-runtime) - helper `api.runtime` (TTS, ricerca, sottoagente)
- [Panoramica SDK](/it/plugins/sdk-overview) - riferimento completo agli import di sottopercorso
- [Internals del Plugin](/it/plugins/architecture-internals#provider-runtime-hooks) - dettagli degli hook ed esempi in bundle

## Correlati

- [Configurazione Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Creazione di Plugin di canale](/it/plugins/sdk-channel-plugins)
