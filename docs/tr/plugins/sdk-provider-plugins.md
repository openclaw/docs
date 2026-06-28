---
read_when:
    - Yeni bir model sağlayıcı Plugin’i oluşturuyorsunuz
    - OpenClaw'a OpenAI uyumlu bir proxy veya özel LLM eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı kancalarını anlamanız gerekir
sidebarTitle: Provider plugins
summary: OpenClaw için model sağlayıcı Plugin'i oluşturmaya yönelik adım adım kılavuz
title: Sağlayıcı Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-06-28T01:05:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Bu kılavuz, OpenClaw'a bir model sağlayıcısı (LLM) ekleyen bir sağlayıcı Plugin'i
oluşturmayı adım adım anlatır. Sonunda model kataloğu, API anahtarı kimlik
doğrulaması ve dinamik model çözümlemesi olan bir sağlayıcınız olacak.

<Info>
  Daha önce herhangi bir OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Başlarken](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

<Tip>
  Sağlayıcı Plugin'leri, OpenClaw'ın normal çıkarım döngüsüne model ekler.
  Modelin iş parçacıklarını, Compaction'ı veya araç olaylarını sahiplenen yerel
  bir ajan arka plan hizmeti üzerinden çalışması gerekiyorsa, arka plan hizmeti
  protokol ayrıntılarını çekirdeğe koymak yerine sağlayıcıyı bir
  [ajan harness'ı](/tr/plugins/sdk-agent-harness) ile eşleştirin.
</Tip>

## İzlenecek yol

<Steps>
  <Step title="Package and manifest">
    ### Adım 1: Paket ve manifest

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

    Manifest, OpenClaw'ın Plugin çalışma zamanınızı yüklemeden kimlik bilgilerini
    algılayabilmesi için `setup.providers[].envVars` bildirir. Bir sağlayıcı
    varyantının başka bir sağlayıcı kimliğinin kimlik doğrulamasını yeniden
    kullanması gerektiğinde `providerAuthAliases` ekleyin. `modelSupport`
    isteğe bağlıdır ve çalışma zamanı hook'ları mevcut olmadan önce OpenClaw'ın
    sağlayıcı Plugin'inizi `acme-large` gibi kısaltılmış model kimliklerinden
    otomatik yüklemesini sağlar. Sağlayıcıyı ClawHub'da yayımlarsanız,
    `package.json` içinde bu `openclaw.compat` ve `openclaw.build` alanları
    zorunludur.

  </Step>

  <Step title="Register the provider">
    En küçük metin sağlayıcısının bir `id`, `label`, `auth` ve `catalog`
    değerine ihtiyacı vardır. `catalog`, sağlayıcıya ait çalışma
    zamanı/yapılandırma hook'udur; canlı tedarikçi API'lerini çağırabilir ve
    `models.providers` girdileri döndürür.

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

    `registerModelCatalogProvider`, liste/yardım/seçici arayüzü için daha yeni
    kontrol düzlemi katalog yüzeyidir. Bunu metin, görüntü oluşturma,
    video oluşturma ve müzik oluşturma satırları için kullanın. Tedarikçi uç
    nokta çağrılarını ve yanıt eşlemesini Plugin içinde tutun; ortak satır
    biçiminin, kaynak etiketlerinin ve yardım işleme mantığının sahibi
    OpenClaw'dır.

    Bu, çalışan bir sağlayıcıdır. Kullanıcılar artık
    `openclaw onboard --acme-ai-api-key <key>` çalıştırabilir ve model olarak
    `acme-ai/acme-large` seçebilir.

    ### Canlı model keşfi

    Sağlayıcınız `/models` tarzı bir API sunuyorsa, sağlayıcıya özgü uç noktayı
    ve satır izdüşümünü Plugin'inizde tutun ve ortak fetch yaşam döngüsü için
    `openclaw/plugin-sdk/provider-catalog-live-runtime` kullanın. Yardımcı,
    sağlayıcı ilkesini OpenClaw çekirdeğine koymadan size korumalı HTTP
    fetch'leri, sağlayıcı kimlik doğrulama başlıkları, yapılandırılmış HTTP
    hataları, TTL önbellekleme ve statik geri dönüş davranışı sağlar.

    Canlı API yalnızca sağlayıcıya ait hangi statik katalog satırlarının o anda
    kullanılabilir olduğunu söylüyorsa `buildLiveModelProviderConfig` kullanın:

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

    Sağlayıcı API'si daha zengin metadata döndürüyorsa ve Plugin'in satırları
    OpenClaw model tanımlarına kendisinin yansıtması gerekiyorsa
    `getCachedLiveProviderModelRows` kullanın:

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

    `run`, kimlik doğrulama kapılı kalmalı ve kullanılabilir kimlik bilgisi
    olmadığında `null` döndürmelidir. Kurulum, dokümanlar, testler ve seçici
    yüzeylerinin canlı ağ erişimine bağlı olmaması için çevrimdışı bir
    `staticRun` veya statik geri dönüş bulundurun. Model listesi güncelliğine
    uygun bir TTL kullanın, istek zamanında dosya sistemi polling'inden kaçının
    ve sağlayıcıya özgü `readRows` / `readModelId` değerlerini yalnızca upstream
    yanıtı OpenAI uyumlu `{ data: [{ id, object }] }` biçiminde değilse geçirin.

    Upstream sağlayıcı OpenClaw'dan farklı kontrol token'ları kullanıyorsa, akış
    yolunu değiştirmek yerine küçük bir çift yönlü metin dönüştürmesi ekleyin:

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

    `input`, taşıma öncesinde son sistem prompt'unu ve metin mesajı içeriğini
    yeniden yazar. `output`, OpenClaw kendi kontrol işaretlerini ayrıştırmadan
    veya kanala teslim etmeden önce asistan metin deltalarını ve son metni
    yeniden yazar.

    Yalnızca API anahtarı kimlik doğrulaması ve tek katalog destekli çalışma
    zamanı ile bir metin sağlayıcısı kaydeden paketli sağlayıcılar için daha dar
    `defineSingleProviderPluginEntry(...)` yardımcısını tercih edin:

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

    `buildProvider`, OpenClaw gerçek sağlayıcı kimlik doğrulamasını çözebildiğinde kullanılan canlı katalog yoludur. Sağlayıcıya özgü keşif gerçekleştirebilir. `buildStaticProvider` yalnızca kimlik doğrulama yapılandırılmadan önce gösterilmesi güvenli olan çevrimdışı satırlar için kullanılmalıdır; kimlik bilgisi gerektirmemeli veya ağ isteği yapmamalıdır. OpenClaw'ın `models list --all` gösterimi şu anda statik katalogları yalnızca paketlenmiş sağlayıcı Plugin'leri için, boş yapılandırma, boş ortam ve agent/workspace yolları olmadan çalıştırır.

    Kimlik doğrulama akışınızın onboarding sırasında `models.providers.*`, alias'lar ve agent varsayılan modelini de yamaması gerekiyorsa `openclaw/plugin-sdk/provider-onboard` içindeki preset yardımcılarını kullanın. En dar kapsamlı yardımcılar `createDefaultModelPresetAppliers(...)`, `createDefaultModelsPresetAppliers(...)` ve `createModelCatalogPresetAppliers(...)` şeklindedir.

    Bir sağlayıcının yerel uç noktası normal `openai-completions` taşımasında akışlı kullanım bloklarını destekliyorsa sağlayıcı kimliği kontrollerini sabit kodlamak yerine `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan katalog yardımcılarını tercih edin. `supportsNativeStreamingUsageCompat(...)` ve `applyProviderNativeStreamingUsageCompat(...)` desteği uç nokta yetenek haritasından algılar; böylece yerel Moonshot/DashScope tarzı uç noktalar, bir Plugin özel sağlayıcı kimliği kullanıyor olsa bile yine de opt in yapar.

    Yukarıdaki canlı keşif örnekleri `/models` tarzı sağlayıcı API'lerini kapsar. Bu keşfi kullanılabilir kimlik doğrulamayla sınırlandırarak `catalog.run` içinde tutun ve çevrimdışı katalog üretimi için `staticRun` yolunu ağsız bırakın.

  </Step>

  <Step title="Dinamik model çözümlemesi ekle">
    Sağlayıcınız rastgele model kimliklerini kabul ediyorsa (proxy veya router gibi), `resolveDynamicModel` ekleyin:

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

    Çözümleme bir ağ çağrısı gerektiriyorsa eşzamansız ısınma için `prepareDynamicModel` kullanın; tamamlandıktan sonra `resolveDynamicModel` yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı hook'ları ekle (gerektiğinde)">
    Çoğu sağlayıcı yalnızca `catalog` + `resolveDynamicModel` gerektirir. Sağlayıcınız ihtiyaç duydukça hook'ları kademeli olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın replay/tool-compat ailelerini kapsıyor; bu nedenle Plugin'lerin genellikle her hook'u tek tek elle bağlaması gerekmez:

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

    Bugün kullanılabilen replay aileleri:

    | Aile | Neyi bağlar | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI uyumlu taşımalar için paylaşılan OpenAI tarzı replay ilkesi; tool-call-id temizleme, assistant-first sıralama düzeltmeleri ve taşımanın ihtiyaç duyduğu yerlerde genel Gemini-turn doğrulaması dahil | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` tarafından seçilen Claude duyarlı replay ilkesi; böylece Anthropic-message taşımaları yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda Claude'a özgü thinking-block temizliği alır | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Yerel Gemini replay ilkesi ve bootstrap replay temizliği. Paylaşılan aile, metin çıktılı Gemini CLI'yi etiketli reasoning üzerinde tutar; doğrudan `google` sağlayıcısı Gemini API thinking'i yerel thought parçaları olarak geldiği için `resolveReasoningOutputMode` değerini `native` olarak override eder. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI uyumlu proxy taşımaları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizliği; yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Tek bir Plugin içinde Anthropic-message ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit ilke; isteğe bağlı yalnızca Claude thinking-block düşürme Anthropic tarafıyla sınırlı kalır | `minimax` |

    Bugün kullanılabilen stream aileleri:

    | Aile | Neyi bağlar | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `google-thinking` | Paylaşılan stream yolunda Gemini thinking payload normalizasyonu | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Paylaşılan proxy stream yolunda Kilo reasoning sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy reasoning kimlikleri enjekte edilen thinking'i atlar | `kilocode` |
    | `moonshot-thinking` | Yapılandırma + `/think` seviyesinden Moonshot ikili yerel-thinking payload eşlemesi | `moonshot` |
    | `minimax-fast-mode` | Paylaşılan stream yolunda MiniMax fast-mode model yeniden yazımı | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: atıf üstbilgileri, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması, reasoning-compat payload biçimlendirme ve Responses bağlam yönetimi | `openai` |
    | `openrouter-thinking` | Proxy rotaları için OpenRouter reasoning sarmalayıcısı; desteklenmeyen-model/`auto` atlamaları merkezi olarak ele alınır | `openrouter` |
    | `tool-stream-default-on` | Açıkça devre dışı bırakılmadıkça tool streaming isteyen Z.AI gibi sağlayıcılar için varsayılan olarak açık `tool_stream` sarmalayıcısı | `zai` |

    <Accordion title="Aile oluşturucuları destekleyen SDK sınırları">
      Her aile oluşturucu, aynı paketten dışa aktarılan daha düşük düzeyli genel yardımcıların bileşiminden oluşur; bir sağlayıcının ortak kalıbın dışına çıkması gerektiğinde bunları kullanabilirsiniz:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` ve ham replay oluşturucuları (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Ayrıca Gemini replay yardımcılarını (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ve uç nokta/model yardımcılarını (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`) dışa aktarır.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ayrıca paylaşılan OpenAI/Codex sarmalayıcıları (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI uyumlu sarmalayıcısı (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages thinking prefill temizliği (`createAnthropicThinkingPrefillPayloadWrapper`), düz metin tool-call compat (`createPlainTextToolCallCompatWrapper`) ve paylaşılan proxy/sağlayıcı sarmalayıcıları (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - sıcak sağlayıcı yolları için hafif payload ve olay sarmalayıcıları; `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` ve `setQwenChatTemplateThinking(...)` dahil.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` ve temel sağlayıcı şema yardımcıları.

      Gemini ailesi sağlayıcıları için reasoning-output modunu taşıma ile uyumlu tutun. Doğrudan Google Gemini API sağlayıcıları `native` reasoning çıktısı kullanmalıdır; böylece OpenClaw yerel thought parçalarını `<think>` / `<final>` prompt yönergeleri eklemeden tüketir. Son JSON/metin yanıtını ayrıştıran yalnızca metin Gemini CLI tarzı backend'ler paylaşılan `google-gemini` etiketli sözleşmesini koruyabilir.

      Bazı stream yardımcıları bilerek sağlayıcıya yerel kalır. `@openclaw/anthropic-provider`, `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha düşük düzeyli Anthropic sarmalayıcı oluşturucularını kendi genel `api.ts` / `contract-api.ts` sınırında tutar; çünkü bunlar Claude OAuth beta işleme ve `context1m` kapılamasını kodlar. xAI Plugin'i de yerel xAI Responses biçimlendirmesini kendi `wrapStreamFn` içinde tutar (`/fast` alias'ları, varsayılan `tool_stream`, desteklenmeyen strict-tool temizliği, xAI'ye özgü reasoning-payload kaldırma).

      Aynı paket kökü kalıbı `@openclaw/openai-provider` (sağlayıcı oluşturucular, varsayılan model yardımcıları, realtime sağlayıcı oluşturucuları) ve `@openclaw/openrouter-provider` (sağlayıcı oluşturucu ve onboarding/yapılandırma yardımcıları) için de temel oluşturur.
    </Accordion>

    <Tabs>
      <Tab title="Token değişimi">
        Her çıkarım çağrısından önce token değişimine ihtiyaç duyan sağlayıcılar için:

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
      <Tab title="Özel üstbilgiler">
        Özel istek üstbilgilerine veya gövde değişikliklerine ihtiyaç duyan sağlayıcılar için:

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
      <Tab title="Yerel taşıma kimliği">
        Genel HTTP veya WebSocket taşımalarında yerel istek/oturum üstbilgilerine ya da metadata'ya ihtiyaç duyan sağlayıcılar için:

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
      <Tab title="Kullanım ve faturalandırma">
        Kullanım/faturalandırma verisi sunan sağlayıcılar için:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` üç sonuca sahiptir. Sağlayıcının kullanım/faturalandırma kimlik bilgisi olduğunda `{ token, accountId? }` döndürün. Yalnızca sağlayıcı kullanım kimlik doğrulamasını kesin olarak işlemiş ancak kullanılabilir bir kullanım belirteci yoksa ve OpenClaw genel API anahtarı/OAuth geri dönüşünü atlamalıysa `{ handled: true }` döndürün. Sağlayıcı isteği işlemediyse ve OpenClaw genel geri dönüşle devam etmeliyse `null` veya `undefined` döndürün.
      </Tab>
    </Tabs>

    <Accordion title="Kullanılabilir tüm sağlayıcı hook'ları">
      OpenClaw hook'ları bu sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır:
      OpenClaw'ın artık çağırmadığı, `ProviderPlugin.capabilities` ve `suppressBuiltInModel` gibi yalnızca uyumluluk amaçlı sağlayıcı alanları burada listelenmez.

      | # | Hook | Ne zaman kullanılır |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya temel URL varsayılanları |
      | 2 | `applyConfigDefaults` | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel varsayılanlar |
      | 3 | `normalizeModelId` | Aramadan önce eski/önizleme model kimliği takma ad temizliği |
      | 4 | `normalizeTransport` | Genel model birleştirmesinden önce sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalleştirme |
      | 6 | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel akış kullanım uyumluluğu yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcıya ait env-marker kimlik doğrulaması çözümleme |
      | 8 | `resolveSyntheticAuth` | Yerel/kendi barındırılan veya yapılandırma destekli sentetik kimlik doğrulama |
      | 9 | `shouldDeferSyntheticProfileAuth` | Env/yapılandırma kimlik doğrulamasının arkasındaki sentetik saklanan profil yer tutucularını düşürme |
      | 10 | `resolveDynamicModel` | Rastgele upstream model kimliklerini kabul etme |
      | 11 | `prepareDynamicModel` | Çözümlemeden önce zaman uyumsuz metadata getirme |
      | 12 | `normalizeResolvedModel` | Çalıştırıcıdan önce taşıma yeniden yazımları |
      | 13 | `normalizeToolSchemas` | Kayıttan önce sağlayıcıya ait araç şeması temizliği |
      | 14 | `inspectToolSchemas` | Sağlayıcıya ait araç şeması tanılamaları |
      | 15 | `resolveReasoningOutputMode` | Etiketli ve yerel reasoning çıktısı sözleşmesi |
      | 16 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 17 | `createStreamFn` | Tamamen özel StreamFn taşıması |
      | 19 | `wrapStreamFn` | Normal akış yolunda özel header/body sarmalayıcıları |
      | 20 | `resolveTransportTurnState` | Her turn için yerel header/metadata |
      | 21 | `resolveWebSocketSessionPolicy` | Yerel WS oturum header'ları/bekleme süresi |
      | 22 | `formatApiKey` | Özel çalışma zamanı belirteç biçimi |
      | 23 | `refreshOAuth` | Özel OAuth yenileme |
      | 24 | `buildAuthDoctorHint` | Kimlik doğrulama onarım rehberliği |
      | 25 | `matchesContextOverflowError` | Sağlayıcıya ait overflow algılama |
      | 26 | `classifyFailoverReason` | Sağlayıcıya ait hız sınırı/aşırı yük sınıflandırması |
      | 27 | `isCacheTtlEligible` | Prompt önbelleği TTL geçidi |
      | 28 | `buildMissingAuthMessage` | Özel eksik kimlik doğrulama ipucu |
      | 29 | `augmentModelCatalog` | Sentetik ileriye dönük uyumluluk satırları |
      | 30 | `resolveThinkingProfile` | Modele özgü `/think` seçenek kümesi |
      | 31 | `isBinaryThinking` | İkili düşünme açık/kapalı uyumluluğu |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning desteği uyumluluğu |
      | 33 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi uyumluluğu |
      | 34 | `isModernModelRef` | Canlı/smoke model eşleştirme |
      | 35 | `prepareRuntimeAuth` | Çıkarımdan önce belirteç değişimi |
      | 36 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırma |
      | 37 | `fetchUsageSnapshot` | Özel kullanım endpoint'i |
      | 38 | `createEmbeddingProvider` | Bellek/arama için sağlayıcıya ait embedding adaptörü |
      | 39 | `buildReplayPolicy` | Özel transcript yeniden oynatma/Compaction ilkesi |
      | 40 | `sanitizeReplayHistory` | Genel temizlikten sonra sağlayıcıya özgü yeniden oynatma yeniden yazımları |
      | 41 | `validateReplayTurns` | Gömülü çalıştırıcıdan önce katı yeniden oynatma turn doğrulaması |
      | 42 | `onModelSelected` | Seçim sonrası callback (örn. telemetri) |

      Çalışma zamanı geri dönüş notları:

      - `normalizeConfig` önce eşleşen sağlayıcıyı, ardından biri yapılandırmayı gerçekten değiştirene kadar hook destekli diğer sağlayıcı Plugin'lerini kontrol eder. Hiçbir sağlayıcı hook'u desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa, paketlenmiş Google yapılandırma normalleştiricisi yine de uygulanır.
      - `resolveConfigApiKey`, sunulduğunda sağlayıcı hook'unu kullanır. Amazon Bedrock AWS env-marker çözümlemesini kendi sağlayıcı Plugin'inde tutar; çalışma zamanı kimlik doğrulamasının kendisi `auth: "aws-sdk"` ile yapılandırıldığında hâlâ AWS SDK varsayılan zincirini kullanır.
      - `resolveThinkingProfile(ctx)`, seçilen `provider`, `modelId`, isteğe bağlı birleştirilmiş `reasoning` katalog ipucu ve isteğe bağlı birleştirilmiş model `compat` bilgilerini alır. `compat` değerini yalnızca sağlayıcının düşünme UI/profilini seçmek için kullanın.
      - `resolveSystemPromptContribution`, bir sağlayıcının bir model ailesi için önbellek duyarlı sistem prompt rehberliği enjekte etmesine olanak tanır. Davranış tek bir sağlayıcı/model ailesine ait olduğunda ve kararlı/dinamik önbellek ayrımını koruması gerektiğinde `before_prompt_build` yerine bunu tercih edin.

      Ayrıntılı açıklamalar ve gerçek dünya örnekleri için bkz. [İç Mekanizmalar: Sağlayıcı Çalışma Zamanı Hook'ları](/tr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekleyin (isteğe bağlı)">
    ### Adım 5: Ek yetenekler ekleyin

    Bir sağlayıcı Plugin'i metin çıkarımının yanında embedding'ler, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü oluşturma, video oluşturma, web getirme ve web arama kaydedebilir. OpenClaw bunu bir **hibrit-yetenek** Plugin'i olarak sınıflandırır; şirket Plugin'leri için önerilen kalıp budur (satıcı başına bir Plugin). Bkz. [İç Mekanizmalar: Yetenek Sahipliği](/tr/plugins/architecture#capability-ownership-model).

    Her yeteneği mevcut `api.registerProvider(...)` çağrınızın yanında `register(api)` içinde kaydedin. Yalnızca ihtiyacınız olan sekmeleri seçin:

    <Tabs>
      <Tab title="Konuşma (TTS)">
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

        Provider HTTP hataları için `assertOkOrThrowProviderError(...)` kullanın; böylece Plugin'ler sınırlandırılmış hata gövdesi okumalarını, JSON hata ayrıştırmasını ve istek kimliği son eklerini paylaşır.
      </Tab>
      <Tab title="Gerçek zamanlı transkripsiyon">
        `createRealtimeTranscriptionWebSocketSession(...)` tercih edin; paylaşılan yardımcı proxy yakalamayı, yeniden bağlanma backoff'unu, kapatma flush'ını, hazır el sıkışmalarını, ses kuyruğa almayı ve kapatma olayı tanılamalarını yönetir. Plugin'iniz yalnızca upstream olaylarını eşler.

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

        Çok parçalı sesi POST eden toplu STT sağlayıcıları `openclaw/plugin-sdk/provider-http` içindeki `buildAudioTranscriptionFormData(...)` kullanmalıdır. Yardımcı, uyumlu transkripsiyon API'leri için M4A tarzı dosya adı gerektiren AAC yüklemeleri dahil olmak üzere yükleme dosya adlarını normalleştirir.
      </Tab>
      <Tab title="Gerçek zamanlı ses">
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
            // Bunu yalnızca sağlayıcı tek bir çağrı için birden fazla araç yanıtını
            // kabul ediyorsa ayarlayın; örneğin anında verilen bir "working" yanıtının
            // ardından nihai sonuç.
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

        `talk.catalog` öğesinin tarayıcı ve yerel Talk istemcilerine geçerli modları,
        aktarımları, ses biçimlerini ve özellik bayraklarını gösterebilmesi için
        `capabilities` bildirin. Bir aktarım, bir insanın asistan oynatımını
        böldüğünü algılayabildiğinde ve provider etkin ses yanıtını kısaltmayı
        ya da temizlemeyi desteklediğinde `handleBargeIn` uygulayın.
      </Tab>
      <Tab title="Medya anlama">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Kimlik bilgilerini kasıtlı olarak gerektirmeyen yerel veya kendi
        barındırdığınız medya provider'ları `resolveAuth` açığa çıkarabilir ve
        `kind: "none"` döndürebilir. OpenClaw, açıkça dahil olmayan provider'lar
        için normal kimlik doğrulama geçidini yine de korur. Mevcut provider'lar
        `req.apiKey` okumaya devam edebilir; yeni provider'lar `req.auth` tercih
        etmelidir.

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

        Aynı id'yi `contracts.embeddingProviders` içinde bildirin. Bu,
        bellek araması dahil yeniden kullanılabilir vektör üretimi için genel
        embedding sözleşmesidir. `registerMemoryEmbeddingProvider(...)`, mevcut
        belleğe özgü adaptörler için kullanımdan kaldırılmış uyumluluktur.
      </Tab>
      <Tab title="Görüntü ve video oluşturma">
        Video yetenekleri **moda duyarlı** bir yapı kullanır: `generate`,
        `imageToVideo` ve `videoToVideo`. `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` gibi düz toplu alanlar,
        dönüşüm modu desteğini veya devre dışı bırakılmış modları temiz biçimde
        duyurmak için yeterli değildir. Müzik oluşturma da açık `generate` /
        `edit` bloklarıyla aynı deseni izler.

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
      <Tab title="Web getirme ve arama">
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
    ### Adım 6: Test

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

## ClawHub'a yayımlama

Provider plugin'leri, diğer harici kod plugin'leriyle aynı şekilde yayımlanır:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Burada eski yalnızca skill yayımlama takma adını kullanmayın; plugin paketleri
`clawhub package publish` kullanmalıdır.

## Dosya yapısı

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Katalog sırası referansı

`catalog.order`, kataloğunuzun yerleşik provider'lara göre ne zaman
birleştirileceğini kontrol eder:

| Sıra      | Ne zaman       | Kullanım durumu                               |
| --------- | -------------- | --------------------------------------------- |
| `simple`  | İlk geçiş      | Düz API anahtarlı provider'lar                |
| `profile` | simple sonrası | Kimlik doğrulama profillerine bağlı provider'lar |
| `paired`  | profile sonrası | Birden fazla ilgili girdiyi sentezle          |
| `late`    | Son geçiş      | Mevcut provider'ları geçersiz kıl (çakışmada kazanır) |

## Sonraki adımlar

- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) - plugin'iniz bir kanal da sağlıyorsa
- [SDK Runtime](/tr/plugins/sdk-runtime) - `api.runtime` yardımcıları (TTS, arama, alt ajan)
- [SDK Genel Bakış](/tr/plugins/sdk-overview) - tam alt yol içe aktarma referansı
- [Plugin İçleri](/tr/plugins/architecture-internals#provider-runtime-hooks) - hook ayrıntıları ve paketle gelen örnekler

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Kanal plugin'leri oluşturma](/tr/plugins/sdk-channel-plugins)
