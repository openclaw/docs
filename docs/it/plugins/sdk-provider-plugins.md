---
read_when:
    - Stai creando un nuovo Plugin provider di modelli
    - Vuoi aggiungere a OpenClaw un proxy compatibile con OpenAI o un LLM personalizzato
    - Hai bisogno di capire autenticazione del provider, cataloghi e hook di runtime
sidebarTitle: Provider Plugins
summary: Guida passo passo per creare un Plugin provider di modelli per OpenClaw
title: Creare plugin provider
x-i18n:
    generated_at: "2026-04-23T08:33:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Creare plugin provider

Questa guida illustra passo dopo passo come creare un Plugin provider che aggiunge un provider di modelli
(LLM) a OpenClaw. Alla fine avrai un provider con catalogo modelli,
autenticazione con API key e risoluzione dinamica dei modelli.

<Info>
  Se non hai mai creato prima un Plugin OpenClaw, leggi prima
  [Getting Started](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e la configurazione del manifest.
</Info>

<Tip>
  I plugin provider aggiungono modelli al normale ciclo di inferenza di OpenClaw. Se il modello
  deve essere eseguito tramite un daemon agente nativo che gestisce thread, compaction o eventi
  degli strumenti, abbina il provider a un [agent harness](/it/plugins/sdk-agent-harness)
  invece di inserire i dettagli del protocollo del daemon nel core.
</Tip>

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

    Il manifest dichiara `providerAuthEnvVars` così OpenClaw può rilevare le
    credenziali senza caricare il runtime del tuo Plugin. Aggiungi `providerAuthAliases`
    quando una variante provider deve riutilizzare l'autenticazione di un altro id provider. `modelSupport`
    è facoltativo e consente a OpenClaw di caricare automaticamente il tuo Plugin provider da ID
    modello abbreviati come `acme-large` prima che esistano hook di runtime. Se pubblichi il
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

    Questo è un provider funzionante. Gli utenti ora possono usare
    `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come modello.

    Se il provider upstream usa token di controllo diversi da quelli di OpenClaw, aggiungi una
    piccola trasformazione testuale bidirezionale invece di sostituire il percorso di streaming:

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

    `input` riscrive il prompt di sistema finale e il contenuto del messaggio testuale prima del
    trasporto. `output` riscrive i delta testuali dell'assistente e il testo finale prima che
    OpenClaw analizzi i propri marker di controllo o la consegna sul canale.

    Per i provider inclusi che registrano solo un provider testuale con autenticazione tramite API key
    più un singolo runtime supportato da catalogo, preferisci l'helper più specifico
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
    reale del provider. Può eseguire scoperta specifica del provider. Usa
    `buildStaticProvider` solo per righe offline sicure da mostrare prima che l'autenticazione sia
    configurata; non deve richiedere credenziali né effettuare richieste di rete.
    La visualizzazione `models list --all` di OpenClaw attualmente esegue cataloghi statici
    solo per plugin provider inclusi, con config vuota, env vuoto e nessun
    percorso agente/workspace.

    Se il tuo flusso di autenticazione deve anche modificare `models.providers.*`, alias e
    il modello predefinito dell'agente durante l'onboarding, usa gli helper preset di
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più specifici sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando l'endpoint nativo di un provider supporta blocchi d'uso in streaming sul
    normale trasporto `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di codificare controlli sull'id del
    provider. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla mappa delle capacità
    dell'endpoint, quindi anche endpoint nativi in stile Moonshot/DashScope possono aderire
    quando un Plugin usa un id provider personalizzato.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica dei modelli">
    Se il tuo provider accetta ID modello arbitrari (come un proxy o un router),
    aggiungi `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog dall'esempio sopra

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
    warm-up asincrono — `resolveDynamicModel` viene eseguito di nuovo al completamento.

  </Step>

  <Step title="Aggiungi hook di runtime (se necessario)">
    La maggior parte dei provider richiede solo `catalog` + `resolveDynamicModel`. Aggiungi gli hook
    in modo incrementale man mano che il tuo provider li richiede.

    I builder helper condivisi ora coprono le famiglie più comuni di replay/compatibilità
    degli strumenti, quindi i plugin di solito non devono collegare a mano ogni hook uno per uno:

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
    | `openai-compatible` | Policy replay condivisa in stile OpenAI per trasporti compatibili con OpenAI, inclusa sanitizzazione di tool-call-id, correzioni dell'ordinamento assistant-first e validazione generica dei turni Gemini dove il trasporto ne ha bisogno |
    | `anthropic-by-model` | Policy replay consapevole di Claude scelta da `modelId`, così i trasporti di messaggi Anthropic ricevono la pulizia specifica dei blocchi thinking di Claude solo quando il modello risolto è davvero un id Claude |
    | `google-gemini` | Policy replay Gemini nativa più sanitizzazione del bootstrap replay e modalità di output del ragionamento con tag |
    | `passthrough-gemini` | Sanitizzazione della firma di thinking Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili con OpenAI; non abilita la validazione replay Gemini nativa né le riscritture bootstrap |
    | `hybrid-anthropic-openai` | Policy ibrida per provider che mescolano superfici di modelli con messaggi Anthropic e compatibili con OpenAI in un unico Plugin; l'eliminazione facoltativa dei blocchi thinking solo Claude resta limitata al lato Anthropic |

    Esempi reali inclusi:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famiglie stream disponibili oggi:

    | Family | Cosa collega |
    | --- | --- |
    | `google-thinking` | Normalizzazione del payload di thinking Gemini sul percorso stream condiviso |
    | `kilocode-thinking` | Wrapper di reasoning Kilo sul percorso stream proxy condiviso, con `kilo/auto` e ID di reasoning proxy non supportati che saltano il thinking iniettato |
    | `moonshot-thinking` | Mappatura del payload di native-thinking binario Moonshot da config + livello `/think` |
    | `minimax-fast-mode` | Riscrittura del modello fast-mode MiniMax sul percorso stream condiviso |
    | `openai-responses-defaults` | Wrapper condivisi per Responses OpenAI/Codex native: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, web search Codex nativa, modellazione del payload di reasoning-compat e gestione del contesto Responses |
    | `openrouter-thinking` | Wrapper di reasoning OpenRouter per percorsi proxy, con skip di modello non supportato/`auto` gestiti centralmente |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo per impostazione predefinita per provider come Z.AI che vogliono lo streaming degli strumenti salvo disattivazione esplicita |

    Esempi reali inclusi:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` esporta anche l'enum della
    famiglia replay più gli helper condivisi da cui queste famiglie sono costruite. Gli
    export pubblici comuni includono:

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
    gli helper wrapper pubblici che queste famiglie riutilizzano. Gli export pubblici comuni
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
    - wrapper condivisi proxy/provider come `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` e `createMinimaxFastModeWrapper(...)`

    Alcuni helper stream restano volutamente locali al provider. Esempio incluso
    attuale: `@openclaw/anthropic-provider` esporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i
    builder wrapper Anthropic di livello più basso dalla sua seam pubblica `api.ts` /
    `contract-api.ts`. Questi helper restano specifici di Anthropic perché
    codificano anche la gestione beta OAuth di Claude e il gating `context1m`.

    Anche altri provider inclusi mantengono locali i wrapper specifici del trasporto quando
    il comportamento non è condivisibile in modo pulito tra le famiglie. Esempio attuale: il
    Plugin xAI incluso mantiene nel proprio
    `wrapStreamFn` la modellazione nativa delle Responses xAI, inclusi riscritture alias `/fast`, `tool_stream`
    predefinito, pulizia degli strict-tool non supportati e rimozione del
    payload di reasoning specifico xAI.

    `openclaw/plugin-sdk/provider-tools` attualmente espone una famiglia condivisa
    di schema degli strumenti più helper condivisi per schema/compatibilità:

    - `ProviderToolCompatFamily` documenta oggi l'inventario delle famiglie condivise.
    - `buildProviderToolCompatFamilyHooks("gemini")` collega la pulizia
      dello schema Gemini + la diagnostica per provider che necessitano di schemi di strumenti sicuri per Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      sono gli helper pubblici sottostanti per gli schemi Gemini.
    - `resolveXaiModelCompatPatch()` restituisce la patch di compatibilità xAI inclusa:
      `toolSchemaProfile: "xai"`, parole chiave di schema non supportate, supporto nativo
      `web_search` e decodifica degli argomenti delle chiamate agli strumenti con entità HTML.
    - `applyXaiModelCompat(model)` applica quella stessa patch di compatibilità xAI a un
      modello risolto prima che raggiunga il runner.

    Esempio reale incluso: il Plugin xAI usa `normalizeResolvedModel` più
    `contributeResolvedModelCompat` per mantenere quei metadati di compatibilità gestiti dal
    provider invece di codificare regole xAI nel core.

    Lo stesso pattern di root del pacchetto supporta anche altri provider inclusi:

    - `@openclaw/openai-provider`: `api.ts` esporta builder di provider,
      helper per modelli predefiniti e builder di provider realtime
    - `@openclaw/openrouter-provider`: `api.ts` esporta il builder del provider
      più helper per onboarding/config

    <Tabs>
      <Tab title="Scambio di token">
        Per provider che richiedono uno scambio di token prima di ogni chiamata di inferenza:

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
        // wrapStreamFn restituisce uno StreamFn derivato da ctx.streamFn
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
      <Tab title="Uso e fatturazione">
        Per provider che espongono dati di uso/fatturazione:

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
      | 2 | `applyConfigDefaults` | Valori predefiniti globali gestiti dal provider durante la materializzazione della config |
      | 3 | `normalizeModelId` | Pulizia degli alias legacy/preview degli ID modello prima della lookup |
      | 4 | `normalizeTransport` | Pulizia `api` / `baseUrl` della famiglia provider prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizza la config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità native dello streaming-usage per provider config |
      | 7 | `resolveConfigApiKey` | Risoluzione dell'autenticazione con marker env gestita dal provider |
      | 8 | `resolveSyntheticAuth` | Autenticazione sintetica locale/self-hosted o supportata da config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Fa retrocedere i placeholder di profilo memorizzato sintetico dietro l'autenticazione env/config |
      | 10 | `resolveDynamicModel` | Accetta ID modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |

    Note sul fallback di runtime:

    - `normalizeConfig` controlla prima il provider corrispondente, poi altri
      plugin provider capaci di hook finché uno non modifica davvero la config.
      Se nessun hook provider riscrive una voce config supportata della famiglia Google, il
      normalizzatore config Google incluso viene comunque applicato.
    - `resolveConfigApiKey` usa l'hook provider quando esposto. Il percorso incluso
      `amazon-bedrock` ha anche qui un resolver integrato di marker env AWS,
      anche se l'autenticazione runtime di Bedrock continua a usare la chain predefinita
      dell'AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli vendor dietro un altro trasporto compatibile |
      | 14 | `capabilities` | Bag statico di capacità legacy; solo compatibilità |
      | 15 | `normalizeToolSchemas` | Pulizia dello schema degli strumenti gestita dal provider prima della registrazione |
      | 16 | `inspectToolSchemas` | Diagnostica dello schema degli strumenti gestita dal provider |
      | 17 | `resolveReasoningOutputMode` | Contratto di output del reasoning con tag o nativo |
      | 18 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 19 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 20 | `wrapStreamFn` | Wrapper personalizzati di header/body sul normale percorso stream |
      | 21 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 22 | `resolveWebSocketSessionPolicy` | Header sessione WS nativi/cool-down |
      | 23 | `formatApiKey` | Forma del token runtime personalizzata |
      | 24 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 25 | `buildAuthDoctorHint` | Indicazioni per la riparazione dell'autenticazione |
      | 26 | `matchesContextOverflowError` | Rilevamento overflow del contesto gestito dal provider |
      | 27 | `classifyFailoverReason` | Classificazione di rate-limit/sovraccarico gestita dal provider |
      | 28 | `isCacheTtlEligible` | Gating TTL della cache dei prompt |
      | 29 | `buildMissingAuthMessage` | Suggerimento personalizzato per autenticazione mancante |
      | 30 | `suppressBuiltInModel` | Nasconde righe upstream obsolete |
      | 31 | `augmentModelCatalog` | Righe sintetiche di forward-compat |
      | 32 | `resolveThinkingProfile` | Insieme di opzioni `/think` specifico del modello |
      | 33 | `isBinaryThinking` | Compatibilità on/off del thinking binario |
      | 34 | `supportsXHighThinking` | Compatibilità del supporto al reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilità della policy `/think` predefinita |
      | 36 | `isModernModelRef` | Corrispondenza modello live/smoke |
      | 37 | `prepareRuntimeAuth` | Scambio di token prima dell'inferenza |
      | 38 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 39 | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | 40 | `createEmbeddingProvider` | Adapter di embedding gestito dal provider per memoria/ricerca |
      | 41 | `buildReplayPolicy` | Policy personalizzata di replay/Compaction della trascrizione |
      | 42 | `sanitizeReplayHistory` | Riscritture replay specifiche del provider dopo la pulizia generica |
      | 43 | `validateReplayTurns` | Validazione rigorosa dei turni replay prima del runner incorporato |
      | 44 | `onModelSelected` | Callback post-selezione (ad esempio telemetria) |

      Nota sulla regolazione del prompt:

      - `resolveSystemPromptContribution` consente a un provider di iniettare
        indicazioni per il prompt di sistema consapevoli della cache per una famiglia
        provider/modello. Preferiscilo a
        `before_prompt_build` quando il comportamento appartiene a una singola famiglia
        provider/modello e deve preservare la suddivisione stabile/dinamica della cache.

      Per descrizioni dettagliate ed esempi reali, vedi
      [Internals: Provider Runtime Hooks](/it/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capacità extra (facoltativo)">
    <a id="step-5-add-extra-capabilities"></a>
    Un Plugin provider può registrare parlato, trascrizione realtime, voce
    realtime, comprensione dei media, generazione di immagini, generazione di video, recupero web
    e ricerca web insieme all'inferenza testuale:

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

    OpenClaw lo classifica come Plugin a **capacità ibride**. Questo è il
    pattern consigliato per i plugin aziendali (un Plugin per vendor). Vedi
    [Internals: Capability Ownership](/it/plugins/architecture#capability-ownership-model).

    Per la generazione video, preferisci la struttura delle capacità consapevole della modalità mostrata sopra:
    `generate`, `imageToVideo` e `videoToVideo`. Campi aggregati piatti come
    `maxInputImages`, `maxInputVideos` e `maxDurationSeconds` non sono
    sufficienti per pubblicizzare in modo pulito il supporto alle modalità di trasformazione o le modalità disabilitate.

    Preferisci l'helper WebSocket condiviso per i provider STT in streaming. Mantiene
    coerenti tra provider cattura proxy, backoff di riconnessione, flush in chiusura, handshake di prontezza, accodamento audio e diagnostica degli eventi di chiusura, lasciando
    al codice del provider solo la mappatura degli eventi upstream.

    I provider STT batch che fanno POST di audio multipart dovrebbero usare
    `buildAudioTranscriptionFormData(...)` da
    `openclaw/plugin-sdk/provider-http` insieme agli helper di richiesta HTTP del
    provider. L'helper form normalizza i nomi file di upload, inclusi upload AAC
    che richiedono un nome file in stile M4A per API di trascrizione compatibili.

    I provider di generazione musicale dovrebbero seguire lo stesso pattern:
    `generate` per generazione dal solo prompt e `edit` per generazione basata su
    immagine di riferimento. Campi aggregati piatti come `maxInputImages`,
    `supportsLyrics` e `supportsFormat` non sono sufficienti per pubblicizzare il
    supporto a edit; i blocchi espliciti `generate` / `edit` sono il contratto atteso.

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

      it("restituisce il catalogo quando la chiave è disponibile", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("restituisce catalog null quando non c'è alcuna chiave", async () => {
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

I plugin provider si pubblicano come qualsiasi altro Plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui l'alias legacy di pubblicazione solo skill; i pacchetti Plugin dovrebbero usare
`clawhub package publish`.

## Struttura dei file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadati openclaw.providers
├── openclaw.plugin.json      # Manifest con metadati di autenticazione del provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Test
    └── usage.ts              # Endpoint di utilizzo (facoltativo)
```

## Riferimento ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai
provider integrati:

| Ordine    | Quando        | Caso d'uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primo passaggio | Provider semplici con API key                  |
| `profile` | Dopo simple   | Provider vincolati a profili auth               |
| `paired`  | Dopo profile  | Sintetizzare più voci correlate                 |
| `late`    | Ultimo passaggio | Sovrascrivere provider esistenti (vince in caso di collisione) |

## Prossimi passi

- [Channel Plugins](/it/plugins/sdk-channel-plugins) — se il tuo Plugin fornisce anche un canale
- [SDK Runtime](/it/plugins/sdk-runtime) — helper `api.runtime` (TTS, search, subagent)
- [SDK Overview](/it/plugins/sdk-overview) — riferimento completo agli import del sotto-percorso
- [Plugin Internals](/it/plugins/architecture#provider-runtime-hooks) — dettagli sugli hook ed esempi inclusi
