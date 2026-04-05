---
read_when:
    - Yeni bir model sağlayıcı plugin'i oluşturuyorsunuz
    - OpenAI uyumlu bir proxy veya özel LLM'yi OpenClaw'a eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı hook'larını anlamanız gerekiyor
sidebarTitle: Provider Plugins
summary: OpenClaw için model sağlayıcı plugin'i oluşturma adım adım rehberi
title: Building Provider Plugins
x-i18n:
    generated_at: "2026-04-05T14:03:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9411ebf96c1eef0baecee9b743925440edc6714a8947da7712fed2b9ef1405cb
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Building Provider Plugins

Bu rehber, OpenClaw'a bir model sağlayıcısı
(LLM) ekleyen bir sağlayıcı plugin'i oluşturmayı adım adım açıklar. Rehberin sonunda model kataloğu,
API anahtarı kimlik doğrulaması ve dinamik model çözümlemesi olan bir sağlayıcıya sahip olacaksınız.

<Info>
  Daha önce hiç OpenClaw plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce
  [Getting Started](/plugins/building-plugins) sayfasını okuyun.
</Info>

## Adım adım rehber

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket ve manifest">
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

    Manifest, `providerAuthEnvVars` değerini bildirir; böylece OpenClaw,
    plugin çalışma zamanınızı yüklemeden kimlik bilgilerini algılayabilir. `modelSupport`
    isteğe bağlıdır ve çalışma zamanı hook'ları mevcut olmadan önce OpenClaw'ın
    `acme-large` gibi kısa model kimliklerinden sağlayıcı plugin'inizi otomatik yüklemesine izin verir.
    Sağlayıcıyı ClawHub üzerinde yayımlıyorsanız,
    bu `openclaw.compat` ve `openclaw.build` alanları
    `package.json` içinde zorunludur.

  </Step>

  <Step title="Sağlayıcıyı kaydedin">
    Minimal bir sağlayıcı için `id`, `label`, `auth` ve `catalog` gerekir:

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

    Bu, çalışan bir sağlayıcıdır. Kullanıcılar artık
    `openclaw onboard --acme-ai-api-key <key>` komutunu çalıştırabilir ve model olarak
    `acme-ai/acme-large` seçebilir.

    Yalnızca API anahtarı kimlik doğrulaması ve tek bir katalog destekli çalışma zamanı
    kaydeden paketlenmiş sağlayıcılar için daha dar kapsamlı
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
        },
      },
    });
    ```

    Kimlik doğrulama akışınızın onboarding sırasında `models.providers.*`,
    takma adları ve agent varsayılan modelini de düzeltmesi gerekiyorsa,
    `openclaw/plugin-sdk/provider-onboard` içindeki hazır yardımcıları kullanın.
    En dar kapsamlı yardımcılar şunlardır:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` ve
    `createModelCatalogPresetAppliers(...)`.

    Bir sağlayıcının yerel uç noktası normal `openai-completions` aktarımı üzerinde
    akışlı kullanım bloklarını destekliyorsa, sağlayıcı kimliği kontrollerini
    sabit kodlamak yerine `openclaw/plugin-sdk/provider-catalog-shared` içindeki
    paylaşılan katalog yardımcılarını tercih edin. `supportsNativeStreamingUsageCompat(...)`
    ve `applyProviderNativeStreamingUsageCompat(...)`, desteği uç nokta
    yetenek haritasından algılar; böylece eklenti özel bir sağlayıcı kimliği
    kullandığında bile yerel Moonshot/DashScope tarzı uç noktalar katılım sağlayabilir.

  </Step>

  <Step title="Dinamik model çözümlemesi ekleyin">
    Sağlayıcınız keyfi model kimliklerini kabul ediyorsa (proxy veya router gibi),
    `resolveDynamicModel` ekleyin:

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

    Çözümleme bir ağ çağrısı gerektiriyorsa, async ön ısınma için
    `prepareDynamicModel` kullanın — tamamlandıktan sonra `resolveDynamicModel`
    yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı hook'ları ekleyin (gerektiğinde)">
    Çoğu sağlayıcı yalnızca `catalog` + `resolveDynamicModel` gerektirir. Hook'ları
    sağlayıcınızın ihtiyacına göre kademeli olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın replay/tool-compat
    ailelerini kapsıyor, bu nedenle plugin'lerin genellikle her hook'u tek tek
    elle bağlaması gerekmez:

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

    Günümüzde mevcut replay aileleri:

    | Aile | Bağladığı şey |
    | --- | --- |
    | `openai-compatible` | OpenAI uyumlu aktarımlar için, tool-call-id temizleme, assistant-first sıralama düzeltmeleri ve aktarımın gerektirdiği durumlarda genel Gemini dönüş doğrulaması dahil paylaşılan OpenAI tarzı replay ilkesi |
    | `anthropic-by-model` | `modelId` ile seçilen Claude farkındalıklı replay ilkesi; böylece Anthropic-message aktarımları, yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda Claude'a özgü thinking-block temizliğini alır |
    | `google-gemini` | Yerel Gemini replay ilkesi ile bootstrap replay temizliği ve etiketli reasoning-output modu |
    | `passthrough-gemini` | OpenAI uyumlu proxy aktarımları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizliği; yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez |
    | `hybrid-anthropic-openai` | Tek bir plugin içinde Anthropic-message ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit ilke; isteğe bağlı yalnızca-Claude thinking-block bırakma işlemi Anthropic tarafında sınırlı kalır |

    Gerçek paketlenmiş örnekler:

    - `google` ve `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` ve `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` ve `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` ve `zai`: `openai-compatible`

    Günümüzde mevcut akış aileleri:

    | Aile | Bağladığı şey |
    | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini düşünme yükü normalizasyonu |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo reasoning sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy reasoning kimlikleri eklenen düşünmeyi atlar |
    | `moonshot-thinking` | Yapılandırma + `/think` düzeyinden Moonshot ikili native-thinking yükü eşlemesi |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax fast-mode model yeniden yazımı |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: attribution üst bilgileri, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması, reasoning-compat yük şekillendirme ve Responses bağlam yönetimi |
    | `openrouter-thinking` | Proxy yolları için OpenRouter reasoning sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak işlenir |
    | `tool-stream-default-on` | Z.AI gibi açıkça devre dışı bırakılmadıkça tool streaming isteyen sağlayıcılar için varsayılan olarak açık `tool_stream` sarmalayıcısı |

    Gerçek paketlenmiş örnekler:

    - `google` ve `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` ve `minimax-portal`: `minimax-fast-mode`
    - `openai` ve `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared`, replay-family enum'unu ve
    bu ailelerin üzerine kurulduğu paylaşılan yardımcıları da dışa aktarır.
    Yaygın genel dışa aktarmalar şunları içerir:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` ve
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
      gibi paylaşılan replay oluşturucuları
    - `sanitizeGoogleGeminiReplayHistory(...)`
      ve `resolveTaggedReasoningOutputMode()`
      gibi Gemini replay yardımcıları
    - `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` ve
      `normalizeNativeXaiModelId(...)`
      gibi uç nokta/model yardımcıları

    `openclaw/plugin-sdk/provider-stream`, hem aile oluşturucusunu
    hem de bu ailelerin yeniden kullandığı genel sarmalayıcı yardımcıları açığa çıkarır.
    Yaygın genel dışa aktarmalar şunları içerir:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` ve
      `createCodexNativeWebSearchWrapper(...)`
      gibi paylaşılan OpenAI/Codex sarmalayıcıları
    - `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` ve `createMinimaxFastModeWrapper(...)`
      gibi paylaşılan proxy/sağlayıcı sarmalayıcıları

    Bazı akış yardımcıları bilinçli olarak sağlayıcıya yerel kalır. Güncel
    paketlenmiş örnek: `@openclaw/anthropic-provider`,
    genel `api.ts` /
    `contract-api.ts` ayrım yüzeyi üzerinden `wrapAnthropicProviderStream`,
    `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve
    daha düşük seviyeli Anthropic sarmalayıcı oluşturucularını dışa aktarır.
    Bu yardımcılar Anthropic'e özgü kalır çünkü Claude OAuth beta işleme ve
    `context1m` kapılama mantığını da içerir.

    Davranış aileler arasında temiz şekilde paylaşılmadığında diğer paketlenmiş
    sağlayıcılar da aktarım odaklı sarmalayıcıları yerel tutar. Güncel örnek:
    paketlenmiş xAI plugin'i yerel xAI Responses şekillendirmeyi kendi
    `wrapStreamFn` içinde tutar; buna `/fast` takma ad yeniden yazımları,
    varsayılan `tool_stream`,
    desteklenmeyen strict-tool temizliği ve xAI'ye özgü reasoning-payload
    kaldırma dahildir.

    `openclaw/plugin-sdk/provider-tools` şu anda bir paylaşılan
    tool-schema ailesi ile paylaşılan schema/compat yardımcılarını açığa çıkarır:

    - `ProviderToolCompatFamily`, bugün paylaşılan aile envanterini belgelendirir.
    - `buildProviderToolCompatFamilyHooks("gemini")`, Gemini-güvenli araç şemalarına ihtiyaç duyan sağlayıcılar için Gemini şema
      temizliği + tanılamaları bağlar.
    - `normalizeGeminiToolSchemas(...)` ve `inspectGeminiToolSchemas(...)`
      temelindeki genel Gemini şema yardımcılarıdır.
    - `resolveXaiModelCompatPatch()`, paketlenmiş xAI uyumluluk yamasını döndürür:
      `toolSchemaProfile: "xai"`, desteklenmeyen şema anahtar sözcükleri, yerel
      `web_search` desteği ve HTML varlık biçimindeki tool-call argümanlarının çözülmesi.
    - `applyXaiModelCompat(model)`, aynı xAI uyumluluk yamasını runner'a ulaşmadan önce
      çözümlenen modele uygular.

    Gerçek paketlenmiş örnek: xAI plugin'i, bu uyumluluk meta verilerinin
    çekirdekte xAI kurallarını sabit kodlamak yerine sağlayıcı sahipliğinde kalması için
    `normalizeResolvedModel` ile `contributeResolvedModelCompat` kullanır.

    Aynı paket kökü deseni diğer paketlenmiş sağlayıcıların da temelini oluşturur:

    - `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucularını,
      varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır
    - `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucusunu
      ve onboarding/yapılandırma yardımcılarını dışa aktarır

    <Tabs>
      <Tab title="Token exchange">
        Her çıkarım çağrısından önce token değişimi gerektiren sağlayıcılar için:

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
        Genel HTTP veya WebSocket aktarımları üzerinde yerel istek/oturum üst bilgileri
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
      </Tab>
    </Tabs>

    <Accordion title="Mevcut tüm sağlayıcı hook'ları">
      OpenClaw hook'ları bu sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır:

      | # | Hook | Kullanım zamanı |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya base URL varsayılanları |
      | 2 | `applyConfigDefaults` | Yapılandırma somutlaştırması sırasında sağlayıcı sahipliğinde genel varsayılanlar |
      | 3 | `normalizeModelId` | Aramadan önce eski/önizleme model kimliği takma adlarını temizleme |
      | 4 | `normalizeTransport` | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalize etme |
      | 6 | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel akış kullanımı uyumluluk yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcı sahipliğinde env-marker kimlik doğrulama çözümlemesi |
      | 8 | `resolveSyntheticAuth` | Yerel/self-hosted veya config destekli sentetik kimlik doğrulama |
      | 9 | `shouldDeferSyntheticProfileAuth` | Sentetik depolanmış profil yer tutucularını env/config kimlik doğrulamasının gerisine alma |
      | 10 | `resolveDynamicModel` | Keyfi upstream model kimliklerini kabul etme |
      | 11 | `prepareDynamicModel` | Çözümlemeden önce async meta veri getirme |
      | 12 | `normalizeResolvedModel` | Runner'dan önce aktarım yeniden yazımları |

      Çalışma zamanı geri dönüş notları:

      - `normalizeConfig` önce eşleşen sağlayıcıyı, sonra diğer
        hook yetenekli sağlayıcı plugin'lerini yalnızca gerçekten yapılandırmayı değiştiren biri olana kadar kontrol eder.
        Hiçbir sağlayıcı hook'u desteklenen Google ailesi yapılandırma girdisini yeniden yazmazsa,
        paketlenmiş Google yapılandırma normalleştiricisi yine de uygulanır.
      - `resolveConfigApiKey`, açıksa sağlayıcı hook'unu kullanır. Paketlenmiş
        `amazon-bedrock` yolu ayrıca burada yerleşik bir AWS env-marker çözümleyicisine sahiptir;
        Bedrock çalışma zamanı kimlik doğrulamasının kendisi hâlâ AWS SDK varsayılan zincirini kullansa da.
      | 13 | `contributeResolvedModelCompat` | Başka bir uyumlu aktarım arkasındaki üretici modelleri için uyumluluk işaretleri |
      | 14 | `capabilities` | Eski statik yetenek çantası; yalnızca uyumluluk |
      | 15 | `normalizeToolSchemas` | Kayıttan önce sağlayıcı sahipliğinde araç şeması temizliği |
      | 16 | `inspectToolSchemas` | Sağlayıcı sahipliğinde araç şeması tanılamaları |
      | 17 | `resolveReasoningOutputMode` | Etiketli ve yerel reasoning-output sözleşmesi |
      | 18 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 19 | `createStreamFn` | Tamamen özel StreamFn aktarımı |
      | 20 | `wrapStreamFn` | Normal akış yolunda özel üst bilgi/gövde sarmalayıcıları |
      | 21 | `resolveTransportTurnState` | Yerel dönüş başına üst bilgi/meta veri |
      | 22 | `resolveWebSocketSessionPolicy` | Yerel WS oturum üst bilgileri/bekleme süresi |
      | 23 | `formatApiKey` | Özel çalışma zamanı token biçimi |
      | 24 | `refreshOAuth` | Özel OAuth yenilemesi |
      | 25 | `buildAuthDoctorHint` | Kimlik doğrulama onarım yönlendirmesi |
      | 26 | `matchesContextOverflowError` | Sağlayıcı sahipliğinde taşma algılama |
      | 27 | `classifyFailoverReason` | Sağlayıcı sahipliğinde hız sınırı/aşırı yük sınıflandırması |
      | 28 | `isCacheTtlEligible` | Prompt cache TTL kapılama |
      | 29 | `buildMissingAuthMessage` | Özel eksik kimlik doğrulama ipucu |
      | 30 | `suppressBuiltInModel` | Eskimiş upstream satırlarını gizleme |
      | 31 | `augmentModelCatalog` | Sentetik ileri uyumluluk satırları |
      | 32 | `isBinaryThinking` | İkili thinking açık/kapalı |
      | 33 | `supportsXHighThinking` | `xhigh` reasoning desteği |
      | 34 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi |
      | 35 | `isModernModelRef` | Canlı/smoke model eşleştirme |
      | 36 | `prepareRuntimeAuth` | Çıkarımdan önce token değişimi |
      | 37 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi çözümleme |
      | 38 | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | 39 | `createEmbeddingProvider` | Bellek/arama için sağlayıcı sahipliğinde embedding bağdaştırıcısı |
      | 40 | `buildReplayPolicy` | Özel transkript replay/sıkıştırma ilkesi |
      | 41 | `sanitizeReplayHistory` | Genel temizlemeden sonra sağlayıcıya özgü replay yeniden yazımları |
      | 42 | `validateReplayTurns` | Gömülü runner'dan önce sıkı replay-turn doğrulaması |
      | 43 | `onModelSelected` | Seçim sonrası geri çağrı (ör. telemetri) |

      Prompt ayarlama notu:

      - `resolveSystemPromptContribution`, bir sağlayıcının model ailesi için
        cache farkındalıklı system-prompt yönlendirmesi eklemesine olanak tanır. Davranış bir sağlayıcı/model ailesine aitse
        ve kararlı/dinamik cache ayrımını koruması gerekiyorsa, bunu
        `before_prompt_build` yerine tercih edin.

      Ayrıntılı açıklamalar ve gerçek örnekler için bkz.
      [Internals: Provider Runtime Hooks](/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekleyin (isteğe bağlı)">
    <a id="step-5-add-extra-capabilities"></a>
    Bir sağlayıcı plugin'i, metin çıkarımının yanında konuşma, gerçek zamanlı transkripsiyon, gerçek
    zamanlı ses, medya anlama, görsel oluşturma, video oluşturma, web getirme
    ve web arama kaydedebilir:

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
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
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

    OpenClaw bunu bir **hybrid-capability** plugin'i olarak sınıflandırır. Bu,
    şirket plugin'leri için önerilen desendir (üretici başına bir plugin). Bkz.
    [Internals: Capability Ownership](/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Test edin">
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

## ClawHub'a yayımlayın

Sağlayıcı plugin'leri, diğer tüm harici kod plugin'leriyle aynı şekilde yayımlanır:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Burada eski, yalnızca Skills için olan yayımlama takma adını kullanmayın;
plugin paketleri `clawhub package publish` kullanmalıdır.

## Dosya yapısı

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers meta verisi
├── openclaw.plugin.json      # providerAuthEnvVars içeren Manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testler
    └── usage.ts              # Kullanım uç noktası (isteğe bağlı)
```

## Katalog sırası başvurusu

`catalog.order`, kataloğunuzun yerleşik sağlayıcılara göre ne zaman birleştirileceğini kontrol eder:

| Sıra      | Ne zaman      | Kullanım durumu                                 |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | İlk geçiş     | Düz API anahtarlı sağlayıcılar                  |
| `profile` | `simple` sonrası | Kimlik doğrulama profillerine bağlı sağlayıcılar |
| `paired`  | `profile` sonrası | Birden çok ilişkili girdiyi sentezleme          |
| `late`    | Son geçiş     | Mevcut sağlayıcıları geçersiz kılma (çakışmada kazanır) |

## Sonraki adımlar

- [Channel Plugins](/plugins/sdk-channel-plugins) — plugin'iniz ayrıca bir kanal da sağlıyorsa
- [SDK Runtime](/plugins/sdk-runtime) — `api.runtime` yardımcıları (TTS, arama, alt agent)
- [SDK Overview](/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Plugin Internals](/plugins/architecture#provider-runtime-hooks) — hook ayrıntıları ve paketlenmiş örnekler
