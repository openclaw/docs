---
read_when:
    - Yeni bir model sağlayıcı plugini oluşturuyorsunuz
    - OpenClaw'a OpenAI uyumlu bir proxy veya özel LLM eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı kancalarını anlamanız gerekir
sidebarTitle: Provider plugins
summary: OpenClaw için model sağlayıcı Plugin'i oluşturmaya yönelik adım adım kılavuz
title: Sağlayıcı Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-07-12T12:36:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

OpenClaw'a bir model sağlayıcısı (LLM) eklemek için bir sağlayıcı Plugin'i oluşturun: model
kataloğu, API anahtarıyla kimlik doğrulama ve dinamik model çözümleme.

<Info>
  OpenClaw Plugin'lerinde yeni misiniz? Paket yapısı ve manifest kurulumu için
  önce [Başlarken](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

<Tip>
  Sağlayıcı Plugin'leri, OpenClaw'ın normal çıkarım döngüsüne modeller ekler.
  Modelin iş parçacıklarını, Compaction'ı veya araç olaylarını yöneten yerel bir
  aracı daemon üzerinden çalışması gerekiyorsa daemon protokolü ayrıntılarını
  çekirdeğe koymak yerine sağlayıcıyı bir [aracı
  çalışma altyapısıyla](/tr/plugins/sdk-agent-harness) eşleştirin.
</Tip>

## Adım adım anlatım

<Steps>
  <Step title="Paket ve manifest">
    ### 1. Adım: Paket ve manifest

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

    `setup.providers[].envVars`, OpenClaw'ın Plugin çalışma zamanınızı
    yüklemeden kimlik bilgilerini algılamasını sağlar. Bir sağlayıcı varyantının
    başka bir sağlayıcı kimliğinin kimlik doğrulamasını yeniden kullanması
    gerektiğinde `providerAuthAliases` ekleyin. `modelSupport` isteğe bağlıdır
    ve çalışma zamanı kancaları bulunmadan önce OpenClaw'ın sağlayıcı
    Plugin'inizi `acme-large` gibi kısa model kimliklerinden otomatik olarak
    yüklemesini sağlar. `package.json` içindeki `openclaw.compat` ve
    `openclaw.build`, ClawHub'da yayımlama için gereklidir
    (`openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gerekli iki
    alandır; `minGatewayVersion` belirtilmediğinde
    `openclaw.install.minHostVersion` değerine geri döner).

  </Step>

  <Step title="Sağlayıcıyı kaydetme">
    Minimal bir metin sağlayıcısı için `id`, `label`, `auth` ve `catalog`
    gerekir. `catalog`, sağlayıcının sahip olduğu çalışma zamanı/yapılandırma
    kancasıdır; canlı sağlayıcı API'lerini çağırabilir ve `models.providers`
    girdileri döndürür.

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

    `registerModelCatalogProvider`, liste/yardım/seçici kullanıcı arayüzü için
    `text`, `voice`, `image_generation`, `video_generation` ve
    `music_generation` satırlarını kapsayan daha yeni kontrol düzlemi katalog
    yüzeyidir. Sağlayıcı uç noktası çağrılarını ve yanıt eşlemesini Plugin'de
    tutun; paylaşılan satır biçiminin, kaynak etiketlerinin ve yardım
    oluşturmanın sahibi OpenClaw'dır.

    Bu, çalışan bir sağlayıcıdır. Kullanıcılar artık
    `openclaw onboard --acme-ai-api-key <key>` komutunu çalıştırabilir ve model
    olarak `acme-ai/acme-large` seçebilir.

    ### Canlı model keşfi

    Sağlayıcınız `/models` tarzı bir API sunuyorsa sağlayıcıya özgü uç noktayı
    ve satır yansıtmayı Plugin'inizde tutun ve paylaşılan getirme yaşam döngüsü
    için `openclaw/plugin-sdk/provider-catalog-live-runtime` kullanın. Yardımcı,
    sağlayıcı politikasını OpenClaw çekirdeğine koymadan korumalı HTTP
    getirmeleri, sağlayıcı kimlik doğrulama üst bilgileri, yapılandırılmış HTTP
    hataları, TTL önbelleğe alma ve statik geri dönüş davranışı sağlar.

    Canlı API yalnızca sağlayıcının sahip olduğu statik katalog satırlarından
    hangilerinin şu anda kullanılabilir olduğunu bildiriyorsa
    `buildLiveModelProviderConfig` kullanın:

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

    Sağlayıcı API'si daha zengin meta veriler döndürüyor ve Plugin'in satırları
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

    `run`, kimlik doğrulama denetimli kalmalı ve kullanılabilir kimlik bilgisi
    bulunmadığında `null` döndürmelidir. Kurulum, belgeler, testler ve seçici
    yüzeylerin canlı ağ erişimine bağlı olmaması için çevrimdışı bir
    `staticRun` veya statik geri dönüş bulundurun. Model listesinin güncellik
    gereksinimine uygun bir TTL kullanın, istek sırasında dosya sistemi
    yoklamasından kaçının ve yalnızca üst kaynak yanıtı OpenAI uyumlu
    `{ data: [{ id, object }] }` biçiminde değilse sağlayıcıya özgü bir
    `readRows` / `readModelId` iletin.

    Üst kaynak sağlayıcı OpenClaw'dan farklı kontrol belirteçleri kullanıyorsa
    akış yolunu değiştirmek yerine küçük, çift yönlü bir metin dönüşümü ekleyin:

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

    `input`, aktarımdan önce son sistem istemini ve metin mesajı içeriğini
    yeniden yazar. `output`, OpenClaw kendi kontrol işaretçilerini ayrıştırmadan
    veya kanal teslimatı yapılmadan önce asistan metin deltalarını ve son metni
    yeniden yazar.

    Yalnızca API anahtarıyla kimlik doğrulanan tek bir metin sağlayıcısını ve
    katalog destekli tek bir çalışma zamanını kaydeden paketlenmiş sağlayıcılar
    için daha dar kapsamlı `defineSingleProviderPluginEntry(...)` yardımcısını
    tercih edin:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model sağlayıcısı",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API anahtarı",
            hint: "Acme AI kontrol panelinizden alınan API anahtarı",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Acme AI API anahtarınızı girin",
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

    `buildProvider`, OpenClaw gerçek sağlayıcı kimlik doğrulamasını çözümleyebildiğinde
    kullanılan canlı katalog yoludur. Sağlayıcıya özgü keşif işlemleri gerçekleştirebilir.
    `buildStaticProvider` öğesini yalnızca kimlik doğrulama yapılandırılmadan önce
    güvenle gösterilebilen çevrimdışı satırlar için kullanın; kimlik bilgileri
    gerektirmemeli veya ağ istekleri yapmamalıdır. OpenClaw'ın `models list --all`
    görünümü şu anda statik katalogları yalnızca paketlenmiş sağlayıcı Plugin'leri için;
    boş bir yapılandırma, boş ortam ve hiçbir aracı/çalışma alanı yolu olmadan yürütür.

    Kimlik doğrulama akışınızın ilk katılım sırasında `models.providers.*` öğesini,
    takma adları ve aracının varsayılan modelini de yamaması gerekiyorsa
    `openclaw/plugin-sdk/provider-onboard` içindeki ön ayar yardımcılarını kullanın.
    En dar kapsamlı yardımcılar `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` ve
    `createModelCatalogPresetAppliers(...)` öğeleridir.

    Bir sağlayıcının yerel uç noktası normal `openai-completions` aktarımında
    akışlı kullanım bloklarını destekliyorsa sağlayıcı kimliği denetimlerini sabit
    kodlamak yerine `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan
    katalog yardımcılarını tercih edin. `supportsNativeStreamingUsageCompat(...)` ve
    `applyProviderNativeStreamingUsageCompat(...)`, desteği uç nokta yetenek
    eşlemesinden algılar; böylece yerel Moonshot/DashScope tarzı uç noktalar, bir
    Plugin özel bir sağlayıcı kimliği kullandığında bile özelliği etkinleştirebilir.

    Yukarıdaki canlı keşif örnekleri `/models` tarzı sağlayıcı API'lerini kapsar.
    Bu keşfi kullanılabilir kimlik doğrulamasıyla sınırlandırılmış biçimde
    `catalog.run` içinde tutun ve çevrimdışı katalog oluşturma için `staticRun`
    öğesinin ağ kullanmamasını sağlayın.

  </Step>

  <Step title="Dinamik model çözümleme ekleyin">
    Sağlayıcınız isteğe bağlı model kimliklerini kabul ediyorsa (bir proxy veya
    yönlendirici gibi), `resolveDynamicModel` ekleyin:

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

    Çözümleme bir ağ çağrısı gerektiriyorsa eşzamansız ön hazırlık için
    `prepareDynamicModel` kullanın; tamamlandıktan sonra `resolveDynamicModel`
    yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı kancaları ekleyin (gerektiğinde)">
    Çoğu sağlayıcı yalnızca `catalog` + `resolveDynamicModel` gerektirir.
    Sağlayıcınız ihtiyaç duydukça kancaları kademeli olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın yeniden oynatma/araç uyumluluğu
    ailelerini kapsadığından Plugin'lerin genellikle her kancayı tek tek elle
    bağlaması gerekmez:

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

    Günümüzde kullanılabilen yeniden oynatma aileleri:

    | Aile | Bağladığı işlevler | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `openai-compatible` | Araç çağrısı kimliği temizliği, önce yardımcı sıralamasına yönelik düzeltmeler ve aktarımın gerektirdiği yerlerde genel Gemini dönüşü doğrulaması dâhil, OpenAI uyumlu aktarımlar için paylaşılan OpenAI tarzı yeniden oynatma ilkesi | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` tarafından seçilen Claude uyumlu yeniden oynatma ilkesi; böylece Anthropic ileti aktarımları, yalnızca çözümlenen model gerçekten bir Claude kimliğiyse Claude'a özgü düşünme bloğu temizliğini alır | `amazon-bedrock` |
    | `native-anthropic-by-model` | `anthropic-by-model` ile aynı modele göre Claude ilkesi; buna ek olarak, üreticiye özgü kimlikleri koruması gereken aktarımlar için araç çağrısı kimliği temizliği ve yerel Anthropic araç kullanımı kimliği koruması | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Yerel Gemini yeniden oynatma ilkesi ve başlangıç yeniden oynatma temizliği. Paylaşılan aile, metin çıktılı Gemini CLI'da etiketli akıl yürütmeyi korur; doğrudan `google` sağlayıcısı ise Gemini API düşünme içeriği yerel düşünce parçaları olarak geldiği için `resolveReasoningOutputMode` öğesini `native` olarak geçersiz kılar. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI uyumlu proxy aktarımları üzerinden çalışan Gemini modelleri için Gemini düşünce imzası temizliği; yerel Gemini yeniden oynatma doğrulamasını veya başlangıç yeniden yazımlarını etkinleştirmez | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Anthropic ileti ve OpenAI uyumlu model yüzeylerini tek bir Plugin'de birleştiren sağlayıcılar için karma ilke; isteğe bağlı, yalnızca Claude'a özgü düşünme bloğu kaldırma işlemi Anthropic tarafıyla sınırlı kalır | `minimax` |

    Günümüzde kullanılabilen akış aileleri:

    | Aile | Bağladığı işlevler | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini düşünme yükü normalleştirmesi | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo akıl yürütme sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy akıl yürütme kimlikleri eklenen düşünme işlemini atlar | `kilocode` |
    | `moonshot-thinking` | Yapılandırma ve `/think` düzeyinden Moonshot ikili yerel düşünme yükü eşlemesi | `moonshot` |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax hızlı mod modelini yeniden yazma | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: ilişkilendirme üst bilgileri, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması, akıl yürütme uyumluluğu yükü şekillendirme ve Responses bağlam yönetimi | `openai` |
    | `openrouter-thinking` | Proxy rotaları için OpenRouter akıl yürütme sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak işlenir | `openrouter` |
    | `tool-stream-default-on` | Açıkça devre dışı bırakılmadığı sürece araç akışı isteyen Z.AI gibi sağlayıcılar için varsayılan olarak etkin `tool_stream` sarmalayıcısı | `zai` |

    <Accordion title="Aile oluşturucuları destekleyen SDK bağlantı noktaları">
      Her aile oluşturucu, aynı paketten dışa aktarılan daha alt düzey genel
      yardımcılardan oluşturulur. Bir sağlayıcının yaygın kalıbın dışına çıkması
      gerektiğinde bunları kullanabilirsiniz:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` ve ham yeniden oynatma oluşturucuları (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Ayrıca Gemini yeniden oynatma yardımcılarını (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ve uç nokta/model yardımcılarını (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`) dışa aktarır.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`; ayrıca paylaşılan OpenAI/Codex sarmalayıcıları (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI uyumlu sarmalayıcısı (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages düşünme ön doldurma temizliği (`createAnthropicThinkingPrefillPayloadWrapper`), düz metin araç çağrısı uyumluluğu (`createPlainTextToolCallCompatWrapper`) ve paylaşılan proxy/sağlayıcı sarmalayıcıları (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` ve `setQwenChatTemplateThinking(...)` dâhil, yoğun kullanılan sağlayıcı yolları için hafif yük ve olay sarmalayıcıları.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` ve temel sağlayıcı şeması yardımcıları.

      Gemini ailesindeki sağlayıcılar için akıl yürütme çıktı modunu aktarımla
      uyumlu tutun. Doğrudan Google Gemini API sağlayıcıları, OpenClaw'ın
      `<think>` / `<final>` istem yönergeleri eklemeden yerel düşünce parçalarını
      kullanabilmesi için `native` akıl yürütme çıktısını kullanmalıdır. Son bir
      JSON/metin yanıtını ayrıştıran yalnızca metin kullanan Gemini CLI tarzı arka
      uçlar, paylaşılan `google-gemini` etiketli sözleşmesini koruyabilir.

      Bazı akış yardımcıları bilinçli olarak sağlayıcıya özel kalır.
      `@openclaw/anthropic-provider`; `wrapAnthropicProviderStream`,
      `resolveAnthropicBetas`, `resolveAnthropicFastMode`,
      `resolveAnthropicServiceTier` ve daha alt düzey Anthropic sarmalayıcı
      oluşturucularını kendi genel `api.ts` / `contract-api.ts` bağlantı noktasında
      tutar; çünkü bunlar Claude OAuth beta işleme ve `context1m` sınırlamasını
      kodlar. xAI Plugin'i de benzer şekilde yerel xAI Responses şekillendirmesini
      kendi `wrapStreamFn` öğesinde tutar (`/fast` takma adları, varsayılan
      `tool_stream`, desteklenmeyen katı araç temizliği, xAI'ye özgü akıl yürütme
      yükü kaldırma).

      Aynı paket kökü kalıbı ayrıca `@openclaw/openai-provider` (sağlayıcı
      oluşturucuları, varsayılan model yardımcıları, gerçek zamanlı sağlayıcı
      oluşturucuları) ve `@openclaw/openrouter-provider` (sağlayıcı oluşturucusu
      ile ilk katılım/yapılandırma yardımcıları) için de kullanılır.
    </Accordion>

    <Tabs>
      <Tab title="Belirteç değişimi">
        Her çıkarım çağrısından önce belirteç değişimi gerektiren sağlayıcılar için:

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
      <Tab title="Özel üst bilgiler">
        Özel istek üst bilgileri veya gövde değişiklikleri gerektiren sağlayıcılar için:

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
      <Tab title="Yerel aktarım kimliği">
        Genel HTTP veya WebSocket aktarımlarında yerel istek/oturum üst bilgileri
        ya da meta veriler gerektiren sağlayıcılar için:

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
        Kullanım/faturalandırma verilerini sunan sağlayıcılar için:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` üç olası sonuç verir. Sağlayıcının bir
        kullanım/faturalandırma kimlik bilgisi olduğunda
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` döndürün
        (isteğe bağlı alanlar, çözümlenen profildeki gizli olmayan plan meta
        verilerini `fetchUsageSnapshot` içine taşır). Yalnızca sağlayıcı kullanım
        kimlik doğrulamasını kesin olarak işlediyse ancak kullanılabilir bir
        kullanım belirteci yoksa ve OpenClaw genel API anahtarı/OAuth geri dönüşünü
        atlamalıysa `{ handled: true }` döndürün. Sağlayıcı isteği işlemediyse ve
        OpenClaw genel geri dönüşle devam etmeliyse `null` veya `undefined`
        döndürün.

        Sağlayıcı kimliğini `contracts.usageProviders` içinde bildirin. Bu manifest
        sözleşmesi ve **her iki** kanca da mevcut olduğunda OpenClaw, ilgisiz
        sağlayıcı Plugin'lerini yüklemeden sağlayıcıyı otomatik olarak kullanım
        verisi toplamaya dahil eder. Çekirdek izin listesinin güncellenmesi
        gerekmez.
        `fetchUsageSnapshot`, sağlayıcıdan bağımsız ortak biçimi döndürür:

        - `plan`: sağlayıcının bildirdiği abonelik veya anahtar etiketi
        - `windows`: kullanılan yüzdeler olarak sıfırlanabilir kota pencereleri
        - `billing`: türü belirtilmiş `balance`, `spend` veya `budget` girdileri;
          `unit`, bir ISO para birimi ya da `credits` gibi bir sağlayıcı birimi olabilir
        - `summary`: bu yapılandırılmış alanlara sığmayan, sağlayıcıya özgü kısa bağlam

        Para birimi anlamlarını tam olarak koruyun. Üst kaynak sözleşmesi öyle
        olduğunu belirtmediği sürece bir sağlayıcı kredisi USD değildir. Yalnızca
        `fetchUsageSnapshot` uygulayan bir Plugin, açık/sentetik çağıranlar için
        kullanılabilir olmaya devam eder ancak OpenClaw kullanım kimlik bilgisini
        çözümleyemediği için otomatik olarak keşfedilmez.
      </Tab>
    </Tabs>

    <Accordion title="Yaygın sağlayıcı kancaları">
      OpenClaw, model/sağlayıcı Plugin'leri için kancaları yaklaşık olarak bu
      sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır. Bu,
      `ProviderPlugin` sözleşmesinin tamamı değildir; eksiksiz ve güncel kanca
      listesi ile geri dönüş notları için [İç Yapı: Sağlayıcı Çalışma Zamanı
      Kancaları](/tr/plugins/architecture-internals#provider-runtime-hooks) bölümüne
      bakın. OpenClaw'ın artık çağırmadığı, yalnızca uyumluluk amaçlı
      `ProviderPlugin.capabilities` ve `suppressBuiltInModel` gibi sağlayıcı
      alanları burada listelenmemiştir.

      | Kanca | Ne zaman kullanılmalı |
      | --- | --- |
      | `catalog` | Model kataloğu veya temel URL varsayılanları |
      | `applyConfigDefaults` | Yapılandırma somutlaştırılırken sağlayıcının sahip olduğu genel varsayılanlar |
      | `normalizeModelId` | Aramadan önce eski/önizleme model kimliği takma adlarını temizleme |
      | `normalizeTransport` | Genel model birleştirmesinden önce sağlayıcı ailesine ait `api` / `baseUrl` temizliği |
      | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalleştirme |
      | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel akış kullanımı uyumluluk yeniden yazımları |
      | `resolveConfigApiKey` | Sağlayıcının sahip olduğu ortam işaretçisi kimlik doğrulama çözümlemesi |
      | `resolveSyntheticAuth` | Yerel/kendi sunucusunda barındırılan veya yapılandırma destekli sentetik kimlik doğrulama |
      | `resolveExternalAuthProfiles` | CLI/uygulama tarafından yönetilen kimlik bilgileri için sağlayıcının sahip olduğu harici kimlik doğrulama profillerini katmanlama |
      | `shouldDeferSyntheticProfileAuth` | Sentetik kayıtlı profil yer tutucularını ortam/yapılandırma kimlik doğrulamasının arkasına alma |
      | `resolveDynamicModel` | İsteğe bağlı üst kaynak model kimliklerini kabul etme |
      | `prepareDynamicModel` | Çözümlemeden önce eşzamansız meta veri getirme |
      | `normalizeResolvedModel` | Çalıştırıcıdan önce aktarım yeniden yazımları |
      | `normalizeToolSchemas` | Kayıttan önce sağlayıcının sahip olduğu araç şeması temizliği |
      | `inspectToolSchemas` | Sağlayıcının sahip olduğu araç şeması tanılamaları |
      | `resolveReasoningOutputMode` | Etiketli ve yerel akıl yürütme çıktısı sözleşmesi |
      | `prepareExtraParams` | Varsayılan istek parametreleri |
      | `createStreamFn` | Tamamen özel StreamFn aktarımı |
      | `wrapStreamFn` | Normal akış yolundaki özel üstbilgi/gövde sarmalayıcıları |
      | `resolveTransportTurnState` | Her tur için yerel üstbilgiler/meta veriler |
      | `resolveWebSocketSessionPolicy` | Yerel WS oturum üstbilgileri/bekleme süresi |
      | `formatApiKey` | Özel çalışma zamanı belirteci biçimi |
      | `refreshOAuth` | Özel OAuth yenilemesi |
      | `buildAuthDoctorHint` | Kimlik doğrulama onarım rehberliği |
      | `matchesContextOverflowError` | Sağlayıcının sahip olduğu taşma algılama |
      | `classifyFailoverReason` | Sağlayıcının sahip olduğu hız sınırı/aşırı yük sınıflandırması |
      | `isCacheTtlEligible` | İstem önbelleği TTL geçiş denetimi |
      | `buildMissingAuthMessage` | Özel eksik kimlik doğrulama ipucu |
      | `augmentModelCatalog` | Sentetik ileriye dönük uyumluluk satırları (kullanımdan kaldırıldı; `registerModelCatalogProvider` tercih edin) |
      | `resolveThinkingProfile` | Modele özgü `/think` seçenek kümesi |
      | `isBinaryThinking` | İkili düşünme açık/kapalı uyumluluğu (kullanımdan kaldırıldı; `resolveThinkingProfile` tercih edin) |
      | `supportsXHighThinking` | `xhigh` akıl yürütme desteği uyumluluğu (kullanımdan kaldırıldı; `resolveThinkingProfile` tercih edin) |
      | `resolveDefaultThinkingLevel` | Varsayılan `/think` politikası uyumluluğu (kullanımdan kaldırıldı; `resolveThinkingProfile` tercih edin) |
      | `isModernModelRef` | Canlı/duman testi modeli eşleştirme |
      | `prepareRuntimeAuth` | Çıkarımdan önce belirteç değişimi |
      | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırma |
      | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | `createEmbeddingProvider` | Bellek/arama için sağlayıcının sahip olduğu gömme bağdaştırıcısı |
      | `buildReplayPolicy` | Özel döküm yeniden oynatma/Compaction politikası |
      | `sanitizeReplayHistory` | Genel temizlikten sonra sağlayıcıya özgü yeniden oynatma yazımları |
      | `validateReplayTurns` | Gömülü çalıştırıcıdan önce katı yeniden oynatma turu doğrulaması |
      | `onModelSelected` | Seçim sonrası geri çağırma (ör. telemetri) |

      Çalışma zamanı geri dönüş notları:

      - `normalizeConfig`, her sağlayıcı kimliği için bir sahip Plugin'i çözümler
        (önce paketlenmiş sağlayıcılar, ardından eşleşen çalışma zamanı Plugin'i)
        ve yalnızca bu kancayı çağırır; diğer sağlayıcılar arasında tarama
        yapılmaz. `google` / `google-vertex` / `google-antigravity` yapılandırma
        girdilerini normalleştiren, Google'ın kendi `normalizeConfig` kancasıdır;
        bu ayrı bir çekirdek geri dönüşü değildir.
      - `resolveConfigApiKey`, sunulduğunda sağlayıcı kancasını kullanır. Amazon
        Bedrock, AWS ortam işaretçisi çözümlemesini kendi sağlayıcı Plugin'inde
        tutar; çalışma zamanı kimlik doğrulamasının kendisi, `auth: "aws-sdk"`
        ile yapılandırıldığında AWS SDK varsayılan zincirini kullanmaya devam eder.
      - `resolveThinkingProfile(ctx)` seçili `provider`, `modelId`, isteğe bağlı
        birleştirilmiş `reasoning` katalog ipucunu ve isteğe bağlı birleştirilmiş
        model `compat` bilgilerini alır. `compat` değerini yalnızca sağlayıcının
        düşünme kullanıcı arayüzünü/profilini seçmek için kullanın.
      - `resolveSystemPromptContribution`, bir sağlayıcının bir model ailesi için
        önbellek duyarlı sistem istemi rehberliği eklemesine olanak tanır. Davranış
        tek bir sağlayıcı/model ailesine ait olduğunda ve kararlı/dinamik önbellek
        ayrımını koruması gerektiğinde eski, Plugin genelindeki
        `before_prompt_build` kancası yerine bunu tercih edin.

    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekleyin (isteğe bağlı)">
    ### Adım 5: Ek yetenekler ekleyin

    Bir sağlayıcı Plugin'i; metin çıkarımının yanı sıra gömmeler, konuşma, gerçek
    zamanlı transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü oluşturma,
    video oluşturma, web'den getirme ve web aramayı kaydedebilir. OpenClaw bunu
    bir **hibrit yetenek** Plugin'i olarak sınıflandırır; şirket Plugin'leri için
    önerilen kalıp budur (satıcı başına bir Plugin). Bkz.
    [İç Yapı: Yetenek Sahipliği](/tr/plugins/architecture#capability-ownership-model).

    Her yeteneği, mevcut `api.registerProvider(...)` çağrınızın yanında
    `register(api)` içinde kaydedin. Yalnızca ihtiyaç duyduğunuz sekmeleri seçin:

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

        Sağlayıcı HTTP hataları için `assertOkOrThrowProviderError(...)` kullanın;
        böylece Plugin'ler sınırlı hata gövdesi okumalarını, JSON hata
        ayrıştırmasını ve istek kimliği son eklerini paylaşır.
      </Tab>
      <Tab title="Gerçek zamanlı transkripsiyon">
        `createRealtimeTranscriptionWebSocketSession(...)` kullanmayı tercih edin;
        paylaşılan yardımcı, proxy yakalamayı, yeniden bağlanma geri çekilmesini,
        kapanış temizlemesini, hazır el sıkışmalarını, ses kuyruğa almayı ve
        kapanış olayı tanılamalarını yönetir. Plugin'iniz yalnızca üst kaynak
        olaylarını eşler.

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

        Çok parçalı sesi POST ile gönderen toplu STT sağlayıcıları,
        `openclaw/plugin-sdk/provider-http` içindeki
        `buildAudioTranscriptionFormData(...)` yardımcısını kullanmalıdır. Yardımcı,
        uyumlu transkripsiyon API'leri için M4A tarzı bir dosya adına ihtiyaç
        duyan AAC yüklemeleri dahil olmak üzere yükleme dosya adlarını normalleştirir.
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

        `talk.catalog` öğesinin tarayıcı ve yerel Talk istemcilerine geçerli
        modları, aktarımları, ses biçimlerini ve özellik bayraklarını sunabilmesi
        için `capabilities` bildirin. Bir aktarım, bir kişinin asistanın ses
        oynatımını kestiğini algılayabiliyorsa ve sağlayıcı etkin ses yanıtını
        kısaltmayı veya temizlemeyi destekliyorsa `handleBargeIn` uygulayın.
        `submitToolResult`, eşzamanlı gönderim için `void` veya sağlayıcı
        köprüsünün sunabileceği eşzamansız bir tamamlanma sınırı için
        `Promise<void>` döndürebilir. Gateway aktarma oturumları, nihai sonucu
        onaylamadan veya bağlantılı çalıştırmayı temizlemeden önce bu sözü
        bekler; gönderim başarısız olduğunda sözü reddedin.
        Sağlayıcı `options.suppressResponse` seçeneğine uyamıyorsa
        `supportsToolResultSuppression: false` ayarlayın. OpenClaw böylece
        dahili zorunlu danışma ve iptal sonuçlarında bastırmadan kaçınır ve
        sessizce yanıt başlatmak yerine doğrudan bastırılmış sonuç isteklerini
        reddeder. `createRealtimeVoiceBridgeSession` tüketicileri de benzer
        şekilde `onToolCall` içinden bir söz döndürebilir; eşzamanlı fırlatmalar
        ve reddetmeler oturumun `onError` geri çağrısına yönlendirilir.
        `handlesInputAudioBargeIn` seçeneğini yalnızca sağlayıcı VAD'si,
        `onClearAudio("barge-in")` çağrısıyla bir kesintiyi doğruladığında
        ayarlayın. Bayrağı belirtmeyen sağlayıcılar OpenClaw'ın yerel giriş sesi
        yedek algılamasını kullanır.
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
        barındırılan medya sağlayıcıları `resolveAuth` sunabilir ve
        `kind: "none"` döndürebilir. OpenClaw, açıkça katılım sağlamayan
        sağlayıcılar için normal kimlik doğrulama geçidini korumaya devam eder.
        Mevcut sağlayıcılar `req.apiKey` okumayı sürdürebilir; yeni sağlayıcılar
        `req.auth` seçeneğini tercih etmelidir.

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
      <Tab title="Gömmeler">
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

        Aynı kimliği `contracts.embeddingProviders` içinde bildirin. Bu,
        bellek araması dahil olmak üzere yeniden kullanılabilir vektör üretimi
        için genel gömme sözleşmesidir. `registerMemoryEmbeddingProvider(...)`,
        mevcut belleğe özgü bağdaştırıcılar için kullanım dışı bırakılmış
        uyumluluktur.
      </Tab>
      <Tab title="Görüntü ve video üretimi">
        Görüntü ve video yetenekleri **mod duyarlı** bir yapı kullanır. Görüntü
        sağlayıcıları gerekli `generate` ve `edit` yetenek bloklarını; video
        sağlayıcıları ise `generate`, `imageToVideo` ve `videoToVideo`
        bloklarını bildirir. `maxInputImages` / `maxInputVideos` /
        `maxDurationSeconds` gibi düz toplu alanlar, dönüştürme modu desteğini
        veya devre dışı modları açık biçimde duyurmak için yeterli değildir.
        Müzik üretimi de aynı `generate` / `edit` kalıbını izler.

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

        `capabilities` her iki sağlayıcı türünde de zorunludur; `edit` ve video
        dönüştürme blokları (`imageToVideo`, `videoToVideo`) her zaman açık bir
        `enabled` bayrağı gerektirir.

        Listelenen bir modelin statik modları veya yetenekleri sağlayıcı
        varsayılanlarından farklıysa `catalogByModel` kullanın. Bu meta veriler,
        sağlayıcı kodunu çağırmadan `video_generate action=list` ve model
        kataloglarının doğru kalmasını sağlar. İstek zamanındaki yetenek arama
        ve uygulama işlemleri yine `resolveModelCapabilities` ve
        `generateVideo` içinde yer alır; mümkün olduğunda her iki yol için de
        aynı yetenek sabitini yeniden kullanın.
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

        Her iki sağlayıcı türü de aynı kimlik bilgisi bağlantı yapısını
        paylaşır: `hint`, `envVars`, `placeholder`, `signupUrl`,
        `credentialPath`, `getCredentialValue`, `setCredentialValue` ve
        `createTool` alanlarının tümü zorunludur.
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

## ClawHub'da yayımlama

Sağlayıcı plugin'leri diğer tüm harici kod plugin'leriyle aynı şekilde
yayımlanır:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>`, bir plugin paketi değil, bir skill klasörü
yayımlamak için kullanılan farklı bir komuttur; burada kullanmayın.

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

`catalog.order`, kataloğunuzun yerleşik sağlayıcılara göre ne zaman
birleştirileceğini denetler:

| Sıra      | Zaman          | Kullanım alanı                                        |
| --------- | -------------- | ----------------------------------------------------- |
| `simple`  | İlk geçiş      | Yalnızca API anahtarı kullanan sağlayıcılar           |
| `profile` | simple sonrası | Kimlik doğrulama profillerine bağlı sağlayıcılar      |
| `paired`  | profile sonrası| Birbiriyle ilişkili birden fazla girdiyi sentezleme   |
| `late`    | Son geçiş      | Mevcut sağlayıcıları geçersiz kılma (çakışmada kazanır) |

## Sonraki adımlar

- [Kanal Pluginleri](/tr/plugins/sdk-channel-plugins) - Plugininiz ayrıca bir kanal sağlıyorsa
- [SDK Çalışma Zamanı](/tr/plugins/sdk-runtime) - `api.runtime` yardımcıları (TTS, arama, alt ajan)
- [SDK'ya Genel Bakış](/tr/plugins/sdk-overview) - alt yol içe aktarımlarının tam başvuru kaynağı
- [Plugin İç Yapısı](/tr/plugins/architecture-internals#provider-runtime-hooks) - kanca ayrıntıları ve paketlenmiş örnekler

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Kanal Pluginleri oluşturma](/tr/plugins/sdk-channel-plugins)
