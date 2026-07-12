---
read_when:
    - Stai sviluppando un nuovo plugin per un provider di modelli
    - Vuoi aggiungere a OpenClaw un proxy compatibile con OpenAI o un LLM personalizzato
    - Devi comprendere l'autenticazione dei provider, i cataloghi e gli hook di runtime
sidebarTitle: Provider plugins
summary: Guida dettagliata alla creazione di un Plugin provider di modelli per OpenClaw
title: Creazione di Plugin per provider
x-i18n:
    generated_at: "2026-07-12T07:21:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Crea un Plugin provider per aggiungere un provider di modelli (LLM) a OpenClaw: un
catalogo di modelli, autenticazione tramite chiave API e risoluzione dinamica dei modelli.

<Info>
  Non conosci ancora i Plugin di OpenClaw? Leggi prima la [Guida
  introduttiva](/it/plugins/building-plugins) per la struttura del pacchetto e la
  configurazione del manifesto.
</Info>

<Tip>
  I Plugin provider aggiungono modelli al normale ciclo di inferenza di
  OpenClaw. Se il modello deve essere eseguito tramite un demone agente nativo
  che gestisce thread, Compaction o eventi degli strumenti, abbina al provider
  un [harness per agenti](/it/plugins/sdk-agent-harness), anziché inserire nel core
  i dettagli del protocollo del demone.
</Tip>

## Procedura guidata

<Steps>
  <Step title="Pacchetto e manifesto">
    ### Passaggio 1: pacchetto e manifesto

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

    `setup.providers[].envVars` consente a OpenClaw di rilevare le credenziali
    senza caricare il runtime del Plugin. Aggiungi `providerAuthAliases` quando
    una variante del provider deve riutilizzare l'autenticazione dell'ID di un
    altro provider. `modelSupport` è facoltativo e consente a OpenClaw di
    caricare automaticamente il Plugin provider da ID abbreviati dei modelli
    come `acme-large`, prima che esistano gli hook di runtime. `openclaw.compat`
    e `openclaw.build` in `package.json` sono obbligatori per la pubblicazione
    su ClawHub (`openclaw.compat.pluginApi` e
    `openclaw.build.openclawVersion` sono i due campi obbligatori;
    `minGatewayVersion` usa come valore di riserva
    `openclaw.install.minHostVersion` quando viene omesso).

  </Step>

  <Step title="Registra il provider">
    Un provider di testo minimale richiede `id`, `label`, `auth` e `catalog`.
    `catalog` è l'hook di runtime/configurazione gestito dal provider; può
    chiamare le API del fornitore in tempo reale e restituisce voci
    `models.providers`.

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

    `registerModelCatalogProvider` è la più recente interfaccia di catalogo del
    piano di controllo per l'interfaccia utente di elenchi, guida e selettori e
    comprende righe `text`, `voice`, `image_generation`, `video_generation` e
    `music_generation`. Mantieni nel Plugin le chiamate agli endpoint del
    fornitore e la mappatura delle risposte; OpenClaw gestisce la struttura
    condivisa delle righe, le etichette delle origini e il rendering della
    guida.

    Questo è un provider funzionante. Ora gli utenti possono eseguire
    `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come modello.

    ### Rilevamento dei modelli in tempo reale

    Se il provider espone un'API in stile `/models`, mantieni nel Plugin
    l'endpoint specifico del provider e la proiezione delle righe e usa
    `openclaw/plugin-sdk/provider-catalog-live-runtime` per il ciclo di
    recupero condiviso. L'helper fornisce richieste HTTP protette, intestazioni
    per l'autenticazione del provider, errori HTTP strutturati, memorizzazione
    nella cache con TTL e comportamento di ripiego statico, senza inserire nel
    core di OpenClaw le regole specifiche del provider.

    Usa `buildLiveModelProviderConfig` quando l'API in tempo reale indica
    soltanto quali righe del catalogo statico gestito dal provider sono
    attualmente disponibili:

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

    Usa `getCachedLiveProviderModelRows` quando l'API del provider restituisce
    metadati più dettagliati e il Plugin deve proiettare autonomamente le righe
    nelle definizioni dei modelli di OpenClaw:

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

    `run` deve restare subordinato all'autenticazione e restituire `null`
    quando non sono disponibili credenziali utilizzabili. Mantieni uno
    `staticRun` offline o un ripiego statico affinché la configurazione, la
    documentazione, i test e le interfacce dei selettori non dipendano
    dall'accesso alla rete in tempo reale. Usa un TTL adeguato alla frequenza di
    aggiornamento dell'elenco dei modelli, evita il polling del file system al
    momento della richiesta e passa valori `readRows` / `readModelId` specifici
    del provider solo quando la risposta upstream non ha una struttura
    compatibile con OpenAI del tipo `{ data: [{ id, object }] }`.

    Se il provider upstream usa token di controllo diversi da OpenClaw,
    aggiungi una piccola trasformazione bidirezionale del testo anziché
    sostituire il percorso dello stream:

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

    `input` riscrive il prompt di sistema finale e il contenuto testuale dei
    messaggi prima del trasporto. `output` riscrive i delta di testo
    dell'assistente e il testo finale prima che OpenClaw analizzi i propri
    marcatori di controllo o effettui la consegna al canale.

    Per i provider inclusi che registrano soltanto un provider di testo con
    autenticazione tramite chiave API e un singolo runtime basato su catalogo,
    preferisci l'helper più specifico `defineSingleProviderPluginEntry(...)`:

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
            hint: "Chiave API dalla dashboard Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Inserisci la chiave API Acme AI",
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

    `buildProvider` è il percorso del catalogo attivo usato quando OpenClaw può risolvere
    l'autenticazione reale del provider. Può eseguire il rilevamento specifico del provider. Usa
    `buildStaticProvider` solo per le righe offline che possono essere mostrate in sicurezza prima
    della configurazione dell'autenticazione; non deve richiedere credenziali né effettuare richieste
    di rete. Attualmente, la visualizzazione `models list --all` di OpenClaw esegue i cataloghi statici
    solo per i Plugin provider inclusi, con configurazione vuota, ambiente vuoto e nessun
    percorso di agente o area di lavoro.

    Se il flusso di autenticazione deve anche modificare `models.providers.*`, gli alias e
    il modello predefinito dell'agente durante la configurazione iniziale, usa le funzioni ausiliarie per le preimpostazioni da
    `openclaw/plugin-sdk/provider-onboard`. Le funzioni ausiliarie più specifiche sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando l'endpoint nativo di un provider supporta blocchi di utilizzo in streaming sul
    normale trasporto `openai-completions`, preferisci le funzioni ausiliarie condivise per i cataloghi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di codificare direttamente
    controlli sull'ID del provider. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla
    mappa delle capacità dell'endpoint, quindi gli endpoint nativi in stile Moonshot/DashScope
    continuano ad aderire anche quando un Plugin usa un ID provider personalizzato.

    Gli esempi di rilevamento attivo precedenti coprono le API dei provider in stile `/models`. Mantieni
    tale rilevamento all'interno di `catalog.run`, subordinato alla disponibilità di un'autenticazione utilizzabile, e mantieni
    `staticRun` privo di accesso alla rete per la generazione offline del catalogo.

  </Step>

  <Step title="Aggiungere la risoluzione dinamica dei modelli">
    Se il provider accetta ID modello arbitrari, come un proxy o un router,
    aggiungi `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, etichetta, autenticazione e catalogo definiti sopra

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

    Se la risoluzione richiede una chiamata di rete, usa `prepareDynamicModel` per la
    preparazione asincrona: `resolveDynamicModel` viene eseguito nuovamente al termine.

  </Step>

  <Step title="Aggiungere gli hook di runtime (se necessari)">
    La maggior parte dei provider richiede solo `catalog` + `resolveDynamicModel`. Aggiungi gli hook
    in modo incrementale, in base alle esigenze del provider.

    Le funzioni di creazione condivise ora coprono le famiglie più comuni per la compatibilità
    con la riproduzione e gli strumenti, quindi in genere i Plugin non devono collegare manualmente ogni hook uno alla volta:

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

    Famiglie di riproduzione attualmente disponibili:

    | Famiglia | Funzionalità collegate | Esempi inclusi |
    | --- | --- | --- |
    | `openai-compatible` | Criteri condivisi di riproduzione in stile OpenAI per i trasporti compatibili con OpenAI, inclusi la normalizzazione degli ID delle chiamate agli strumenti, le correzioni dell'ordine con l'assistente per primo e la convalida generica dei turni Gemini quando richiesta dal trasporto | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Criteri di riproduzione sensibili a Claude, scelti in base a `modelId`, così i trasporti dei messaggi Anthropic ricevono la pulizia dei blocchi di ragionamento specifica per Claude solo quando il modello risolto è effettivamente un ID Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Gli stessi criteri Claude per modello di `anthropic-by-model`, oltre alla normalizzazione degli ID delle chiamate agli strumenti e alla conservazione degli ID nativi di utilizzo degli strumenti Anthropic per i trasporti che devono mantenere gli ID nativi del fornitore | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Criteri nativi di riproduzione Gemini, più la normalizzazione della riproduzione di inizializzazione. La famiglia condivisa mantiene la CLI Gemini con output testuale sul ragionamento con tag; il provider diretto `google` sovrascrive `resolveReasoningOutputMode` con `native`, perché il ragionamento dell'API Gemini arriva come parti di pensiero native. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Normalizzazione delle firme di pensiero Gemini per i modelli Gemini eseguiti tramite trasporti proxy compatibili con OpenAI; non abilita la convalida della riproduzione nativa Gemini né la riscrittura dell'inizializzazione | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Criteri ibridi per i provider che combinano superfici di modelli basate sui messaggi Anthropic e compatibili con OpenAI in un unico Plugin; la rimozione facoltativa dei blocchi di ragionamento solo per Claude rimane limitata al lato Anthropic | `minimax` |

    Famiglie di streaming attualmente disponibili:

    | Famiglia | Funzionalità collegate | Esempi inclusi |
    | --- | --- | --- |
    | `google-thinking` | Normalizzazione del payload di ragionamento Gemini nel percorso di streaming condiviso | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper per il ragionamento Kilo nel percorso di streaming proxy condiviso, con `kilo/auto` e gli ID di ragionamento proxy non supportati che ignorano il ragionamento inserito | `kilocode` |
    | `moonshot-thinking` | Mappatura binaria del payload di ragionamento nativo Moonshot dalla configurazione e dal livello `/think` | `moonshot` |
    | `minimax-fast-mode` | Riscrittura del modello in modalità rapida MiniMax nel percorso di streaming condiviso | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper condivisi nativi per OpenAI/Codex Responses: intestazioni di attribuzione, `/fast`/`serviceTier`, livello di dettaglio del testo, ricerca web nativa di Codex, conformazione del payload per la compatibilità del ragionamento e gestione del contesto di Responses | `openai` |
    | `openrouter-thinking` | Wrapper per il ragionamento OpenRouter per le route proxy, con esclusioni per modelli non supportati/`auto` gestite centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo per impostazione predefinita per provider come Z.AI che richiedono lo streaming degli strumenti salvo disattivazione esplicita | `zai` |

    <Accordion title="Interfacce SDK alla base delle funzioni di creazione delle famiglie">
      Ogni funzione di creazione delle famiglie è composta da funzioni ausiliarie pubbliche di livello inferiore esportate dallo stesso pacchetto, utilizzabili quando un provider deve discostarsi dallo schema comune:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e le funzioni di creazione della riproduzione di base (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Esporta inoltre le funzioni ausiliarie per la riproduzione Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e quelle per endpoint e modelli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, oltre ai wrapper condivisi per OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), al wrapper DeepSeek V4 compatibile con OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), alla pulizia del precompilato di ragionamento per Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), alla compatibilità con le chiamate agli strumenti in testo semplice (`createPlainTextToolCallCompatWrapper`) e ai wrapper condivisi per proxy e provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - wrapper leggeri per payload ed eventi nei percorsi critici dei provider, inclusi `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` e `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` e le funzioni ausiliarie sottostanti per gli schemi dei provider.

      Per i provider della famiglia Gemini, mantieni la modalità di output del ragionamento allineata
      al trasporto. I provider diretti dell'API Google Gemini devono usare l'output di ragionamento `native`,
      affinché OpenClaw elabori le parti di pensiero native senza aggiungere
      direttive di prompt `<think>` / `<final>`. I backend in stile CLI Gemini
      con solo testo, che analizzano una risposta finale JSON o testuale, possono mantenere il contratto condiviso
      con tag `google-gemini`.

      Alcune funzioni ausiliarie per lo streaming restano intenzionalmente locali al provider. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e le funzioni di creazione dei wrapper Anthropic di livello inferiore nella propria interfaccia pubblica `api.ts` / `contract-api.ts`, perché codificano la gestione delle funzionalità beta OAuth di Claude e la subordinazione a `context1m`. Analogamente, il Plugin xAI mantiene la conformazione nativa di xAI Responses nel proprio `wrapStreamFn` (alias `/fast`, `tool_stream` predefinito, pulizia degli strumenti rigorosi non supportati, rimozione del payload di ragionamento specifica per xAI).

      Lo stesso schema basato sulla radice del pacchetto supporta anche `@openclaw/openai-provider` (funzioni di creazione dei provider, funzioni ausiliarie per il modello predefinito, funzioni di creazione dei provider in tempo reale) e `@openclaw/openrouter-provider` (funzione di creazione del provider e funzioni ausiliarie per configurazione iniziale e configurazione).
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
      <Tab title="Intestazioni personalizzate">
        Per i provider che richiedono intestazioni di richiesta personalizzate o modifiche al corpo:

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
      <Tab title="Identità del trasporto nativo">
        Per i provider che richiedono intestazioni o metadati nativi di richiesta/sessione nei
        trasporti HTTP generici o WebSocket:

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

        `resolveUsageAuth` ha tre possibili esiti. Restituisci
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` quando il
        provider dispone di una credenziale per l'utilizzo/la fatturazione (i campi
        facoltativi trasferiscono i metadati non segreti del piano dal profilo risolto
        a `fetchUsageSnapshot`). Restituisci
        `{ handled: true }` solo quando il provider ha gestito in modo definitivo
        l'autenticazione per l'utilizzo ma non dispone di un token di utilizzo valido,
        e OpenClaw deve ignorare il fallback generico tramite chiave API/OAuth.
        Restituisci `null` o `undefined` quando il provider non ha gestito la richiesta
        e OpenClaw deve proseguire con il fallback generico.

        Dichiara l'ID del provider in `contracts.usageProviders`. Quando tale contratto
        del manifesto ed **entrambi** gli hook sono presenti, OpenClaw include
        automaticamente il provider nella raccolta dei dati di utilizzo senza caricare
        Plugin di provider non correlati. Non è necessario aggiornare alcuna lista
        di elementi consentiti nel core.
        `fetchUsageSnapshot` restituisce la struttura condivisa indipendente dal provider:

        - `plan`: abbonamento o etichetta della chiave segnalati dal provider
        - `windows`: finestre di quota reimpostabili espresse come percentuali utilizzate
        - `billing`: voci tipizzate `balance`, `spend` o `budget`; `unit` può essere
          una valuta ISO o un'unità del provider come `credits`
        - `summary`: contesto compatto specifico del provider che non rientra in tali
          campi strutturati

        Mantieni esatta la semantica della valuta. Un credito del provider non equivale
        a USD, a meno che il contratto a monte non lo specifichi. Un Plugin che implementa
        solo `fetchUsageSnapshot` rimane disponibile per chiamanti espliciti/sintetici,
        ma non viene individuato automaticamente, perché OpenClaw non può risolverne
        la credenziale di utilizzo.
      </Tab>
    </Tabs>

    <Accordion title="Hook comuni dei provider">
      OpenClaw chiama gli hook approssimativamente in quest'ordine per i Plugin
      di modelli/provider. La maggior parte dei provider ne utilizza solo 2-3.
      Questo non è il contratto `ProviderPlugin` completo: consulta
      [Aspetti interni: hook di runtime dei provider
      ](/it/plugins/architecture-internals#provider-runtime-hooks) per l'elenco
      completo e attualmente aggiornato degli hook e per le note sui fallback.
      I campi dei provider riservati alla compatibilità che OpenClaw non chiama più,
      come `ProviderPlugin.capabilities` e `suppressBuiltInModel`, non sono elencati
      qui.

      | Hook | Quando utilizzarlo |
      | --- | --- |
      | `catalog` | Catalogo dei modelli o valori predefiniti dell'URL di base |
      | `applyConfigDefaults` | Valori predefiniti globali di proprietà del provider durante la materializzazione della configurazione |
      | `normalizeModelId` | Pulizia degli alias degli ID modello legacy/di anteprima prima della ricerca |
      | `normalizeTransport` | Pulizia di `api` / `baseUrl` della famiglia di provider prima dell'assemblaggio generico del modello |
      | `normalizeConfig` | Normalizzazione della configurazione `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Riscritture native di compatibilità dell'utilizzo in streaming per i provider configurati |
      | `resolveConfigApiKey` | Risoluzione dell'autenticazione tramite marcatori di ambiente di proprietà del provider |
      | `resolveSyntheticAuth` | Autenticazione sintetica locale/autogestita o basata sulla configurazione |
      | `resolveExternalAuthProfiles` | Sovrapposizione dei profili di autenticazione esterni di proprietà del provider per le credenziali gestite dalla CLI/app |
      | `shouldDeferSyntheticProfileAuth` | Posizionamento dei segnaposto sintetici dei profili memorizzati dopo l'autenticazione tramite ambiente/configurazione |
      | `resolveDynamicModel` | Accettazione di ID modello arbitrari del servizio a monte |
      | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | `normalizeResolvedModel` | Riscritture del trasporto prima dell'esecutore |
      | `normalizeToolSchemas` | Pulizia degli schemi degli strumenti di proprietà del provider prima della registrazione |
      | `inspectToolSchemas` | Diagnostica degli schemi degli strumenti di proprietà del provider |
      | `resolveReasoningOutputMode` | Contratto dell'output di ragionamento con tag rispetto a quello nativo |
      | `prepareExtraParams` | Parametri predefiniti della richiesta |
      | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | `wrapStreamFn` | Wrapper personalizzati di intestazioni/corpo nel normale percorso di streaming |
      | `resolveTransportTurnState` | Intestazioni/metadati nativi per ogni turno |
      | `resolveWebSocketSessionPolicy` | Intestazioni/periodo di attesa nativi della sessione WS |
      | `formatApiKey` | Struttura personalizzata del token di runtime |
      | `refreshOAuth` | Aggiornamento OAuth personalizzato |
      | `buildAuthDoctorHint` | Indicazioni per la riparazione dell'autenticazione |
      | `matchesContextOverflowError` | Rilevamento dell'esaurimento del contesto di proprietà del provider |
      | `classifyFailoverReason` | Classificazione dei limiti di frequenza/sovraccarichi di proprietà del provider |
      | `isCacheTtlEligible` | Controllo di ammissibilità del TTL della cache dei prompt |
      | `buildMissingAuthMessage` | Suggerimento personalizzato per l'autenticazione mancante |
      | `augmentModelCatalog` | Righe sintetiche di compatibilità futura (deprecato: preferire `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Insieme di opzioni `/think` specifico del modello |
      | `isBinaryThinking` | Compatibilità dell'attivazione/disattivazione binaria del ragionamento (deprecato: preferire `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Compatibilità del supporto del ragionamento `xhigh` (deprecato: preferire `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Compatibilità dei criteri predefiniti di `/think` (deprecato: preferire `resolveThinkingProfile`) |
      | `isModernModelRef` | Corrispondenza dei modelli per test live/di controllo |
      | `prepareRuntimeAuth` | Scambio di token prima dell'inferenza |
      | `resolveUsageAuth` | Analisi personalizzata delle credenziali di utilizzo |
      | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | `createEmbeddingProvider` | Adattatore di incorporamento di proprietà del provider per memoria/ricerca |
      | `buildReplayPolicy` | Criteri personalizzati di riproduzione/Compaction della trascrizione |
      | `sanitizeReplayHistory` | Riscritture della riproduzione specifiche del provider dopo la pulizia generica |
      | `validateReplayTurns` | Convalida rigorosa dei turni di riproduzione prima dell'esecutore incorporato |
      | `onModelSelected` | Callback successiva alla selezione (ad esempio telemetria) |

      Note sui fallback di runtime:

      - `normalizeConfig` risolve un solo Plugin proprietario per ogni ID provider (prima i provider inclusi, poi il Plugin di runtime corrispondente) e chiama solo quell'hook: non viene eseguita alcuna scansione degli altri provider. È l'hook `normalizeConfig` di Google a normalizzare le voci di configurazione `google` / `google-vertex` / `google-antigravity`; non si tratta di un fallback separato del core.
      - `resolveConfigApiKey` utilizza l'hook del provider quando disponibile. Amazon Bedrock mantiene la risoluzione dei marcatori di ambiente AWS nel proprio Plugin del provider; l'autenticazione di runtime continua invece a utilizzare la catena predefinita dell'SDK AWS quando è configurata con `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` riceve il `provider` selezionato, `modelId`, il suggerimento facoltativo del catalogo `reasoning` unificato e i dati facoltativi `compat` unificati del modello. Usa `compat` solo per selezionare l'interfaccia/il profilo di ragionamento del provider.
      - `resolveSystemPromptContribution` consente a un provider di inserire indicazioni per il prompt di sistema sensibili alla cache per una famiglia di modelli. Preferiscilo all'hook legacy `before_prompt_build` applicato all'intero Plugin quando il comportamento appartiene a una sola famiglia di provider/modelli e deve preservare la separazione tra cache stabile e dinamica.

    </Accordion>

  </Step>

  <Step title="Aggiungere funzionalità aggiuntive (facoltativo)">
    ### Passaggio 5: aggiungere funzionalità aggiuntive

    Un Plugin del provider può registrare incorporamenti, sintesi vocale, trascrizione
    in tempo reale, voce in tempo reale, comprensione dei contenuti multimediali,
    generazione di immagini, generazione di video, recupero web e ricerca web
    insieme all'inferenza testuale. OpenClaw lo classifica come Plugin a
    **funzionalità ibride**, il modello consigliato per i Plugin aziendali
    (un Plugin per fornitore). Consulta
    [Aspetti interni: proprietà delle funzionalità](/it/plugins/architecture#capability-ownership-model).

    Registra ogni funzionalità all'interno di `register(api)` insieme alla chiamata
    `api.registerProvider(...)` esistente. Seleziona solo le schede necessarie:

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

        Usa `assertOkOrThrowProviderError(...)` per gli errori HTTP del provider,
        in modo che i Plugin condividano la lettura limitata del corpo degli errori,
        l'analisi degli errori JSON e i suffissi degli ID richiesta.
      </Tab>
      <Tab title="Trascrizione in tempo reale">
        Preferisci `createRealtimeTranscriptionWebSocketSession(...)`: l'helper
        condiviso gestisce l'acquisizione del proxy, il backoff di riconnessione,
        lo svuotamento alla chiusura, gli handshake di disponibilità,
        l'accodamento dell'audio e la diagnostica degli eventi di chiusura.
        Il tuo Plugin deve solo mappare gli eventi del servizio a monte.

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
        `openclaw/plugin-sdk/provider-http`. L'helper normalizza i nomi dei file
        caricati, inclusi i caricamenti AAC che richiedono un nome file in stile
        M4A per le API di trascrizione compatibili.
      </Tab>
      <Tab title="Realtime voice">
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

        Dichiarare `capabilities` affinché `talk.catalog` possa esporre modalità,
        trasporti, formati audio e flag delle funzionalità validi ai client Talk
        per browser e nativi. Implementare `handleBargeIn` quando un trasporto
        può rilevare che una persona sta interrompendo la riproduzione
        dell'assistente e il provider supporta il troncamento o la cancellazione
        della risposta audio attiva.
        `submitToolResult` può restituire `void` per l'invio sincrono oppure una
        `Promise<void>` come punto di completamento asincrono che il bridge del
        provider può esporre. Le sessioni di inoltro del Gateway attendono tale
        promessa prima di confermare un risultato finale o cancellare
        l'esecuzione collegata; la promessa deve essere rifiutata se l'invio non
        riesce.
        Impostare `supportsToolResultSuppression: false` quando il provider non
        può rispettare `options.suppressResponse`. OpenClaw evita quindi la
        soppressione per i risultati interni di consultazione forzata e
        annullamento e rifiuta le richieste dirette di risultati soppressi,
        anziché avviare implicitamente una risposta.
        Analogamente, i consumer di `createRealtimeVoiceBridgeSession` possono
        restituire una promessa da `onToolCall`; le eccezioni sincrone e i
        rifiuti vengono inoltrati al callback `onError` della sessione.
        Impostare `handlesInputAudioBargeIn` solo quando il VAD del provider
        conferma un'interruzione chiamando `onClearAudio("barge-in")`. I provider
        che omettono il flag usano il rilevamento di ripiego locale di OpenClaw
        per l'audio in ingresso.
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

        I provider multimediali locali o self-hosted che intenzionalmente non
        richiedono credenziali possono esporre `resolveAuth` e restituire
        `kind: "none"`.
        OpenClaw mantiene comunque il normale controllo di autenticazione per i
        provider che non aderiscono esplicitamente. I provider esistenti possono
        continuare a leggere `req.apiKey`; i nuovi provider dovrebbero preferire
        `req.auth`.

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

        Dichiarare lo stesso ID in `contracts.embeddingProviders`. Questo è il
        contratto generale per gli embedding destinati alla generazione
        riutilizzabile di vettori, inclusa la ricerca nella memoria.
        `registerMemoryEmbeddingProvider(...)` è una compatibilità deprecata per
        gli adattatori esistenti specifici per la memoria.
      </Tab>
      <Tab title="Image and video generation">
        Le funzionalità per immagini e video usano una struttura **sensibile
        alla modalità**. I provider di immagini dichiarano i blocchi di
        funzionalità obbligatori `generate` ed `edit`; i provider video
        dichiarano `generate`, `imageToVideo` e `videoToVideo`. I campi aggregati
        piatti come `maxInputImages` / `maxInputVideos` /
        `maxDurationSeconds` non sono sufficienti per indicare in modo chiaro il
        supporto delle modalità di trasformazione o le modalità disabilitate.
        La generazione musicale segue lo stesso schema `generate` / `edit`.

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

        `capabilities` è obbligatorio per entrambi i tipi di provider; `edit` e
        i blocchi di trasformazione video (`imageToVideo`, `videoToVideo`)
        richiedono sempre un flag `enabled` esplicito.

        Usare `catalogByModel` quando le modalità o le funzionalità statiche di
        un modello elencato differiscono dai valori predefiniti del provider.
        Questi metadati mantengono accurati `video_generate action=list` e i
        cataloghi dei modelli senza invocare il codice del provider. La ricerca
        e l'applicazione delle funzionalità al momento della richiesta rimangono
        di competenza di `resolveModelCapabilities` e `generateVideo`; quando
        possibile, riutilizzare la stessa costante delle funzionalità per
        entrambi i percorsi.
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

        Entrambi i tipi di provider condividono la stessa struttura di
        collegamento delle credenziali:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` e `createTool` sono tutti
        obbligatori.
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

## Pubblicazione su ClawHub

I Plugin provider vengono pubblicati allo stesso modo di qualsiasi altro Plugin
di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` è un comando diverso, destinato alla
pubblicazione di una cartella di skill e non di un pacchetto Plugin: non usarlo
qui.

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

`catalog.order` determina quando il catalogo viene unito rispetto ai provider
integrati:

| Ordine    | Quando          | Caso d'uso                                              |
| --------- | --------------- | ------------------------------------------------------- |
| `simple`  | Primo passaggio | Provider con semplice chiave API                        |
| `profile` | Dopo simple     | Provider subordinati ai profili di autenticazione       |
| `paired`  | Dopo profile    | Sintetizzare più voci correlate                          |
| `late`    | Ultimo passaggio | Sovrascrivere i provider esistenti (prevale in caso di conflitto) |

## Passaggi successivi

- [Plugin per canali](/it/plugins/sdk-channel-plugins) - se il Plugin fornisce anche un canale
- [Runtime dell'SDK](/it/plugins/sdk-runtime) - helper `api.runtime` (TTS, ricerca, subagente)
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo alle importazioni dei sottopercorsi
- [Funzionamento interno dei Plugin](/it/plugins/architecture-internals#provider-runtime-hooks) - dettagli sugli hook ed esempi inclusi

## Contenuti correlati

- [Configurazione dell'SDK per Plugin](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Creazione di Plugin per canali](/it/plugins/sdk-channel-plugins)
