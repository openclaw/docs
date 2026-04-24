---
read_when:
    - Yeni bir model sağlayıcı Plugin'i oluşturuyorsunuz
    - OpenClaw'a OpenAI uyumlu bir proxy veya özel bir LLM eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı kancalarını anlamanız gerekir
sidebarTitle: Provider plugins
summary: OpenClaw için model sağlayıcı Plugin'i oluşturma adım adım kılavuzu
title: Sağlayıcı Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-04-24T09:22:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Bu kılavuz, OpenClaw'a bir model sağlayıcısı (LLM) ekleyen bir sağlayıcı Plugin'i oluşturmayı adım adım açıklar. Sonunda model kataloğu, API anahtarı kimlik doğrulaması ve dinamik model çözümlemesine sahip bir sağlayıcınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce [Başlarken](/tr/plugins/building-plugins)
  bölümünü okuyun.
</Info>

<Tip>
  Sağlayıcı Plugin'leri, OpenClaw'ın normal çıkarım döngüsüne modeller ekler. Modelin
  iş parçacıklarını, Compaction'ı veya araç olaylarını yöneten yerel bir ajan daemon'ı üzerinden
  çalışması gerekiyorsa, daemon protokol ayrıntılarını çekirdeğe koymak yerine
  sağlayıcıyı bir [ajan harness](/tr/plugins/sdk-agent-harness) ile eşleştirin.
</Tip>

## Adım Adım İnceleme

<Steps>
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

    Manifest, OpenClaw'ın Plugin çalışma zamanınızı yüklemeden
    kimlik bilgilerini algılayabilmesi için `providerAuthEnvVars` tanımlar.
    Bir sağlayıcı varyantının başka bir sağlayıcı kimliğinin kimlik doğrulamasını yeniden kullanması
    gerekiyorsa `providerAuthAliases` ekleyin. `modelSupport`
    isteğe bağlıdır ve çalışma zamanı kancaları oluşmadan önce OpenClaw'ın
    `acme-large` gibi kısa model kimliklerinden sağlayıcı Plugin'inizi otomatik olarak yüklemesini sağlar.
    Sağlayıcıyı ClawHub üzerinde yayımlıyorsanız, `package.json`
    içinde bu `openclaw.compat` ve `openclaw.build` alanları zorunludur.

  </Step>

  <Step title="Sağlayıcıyı kaydedin">
    En az düzeyde bir sağlayıcının `id`, `label`, `auth` ve `catalog` alanlarına ihtiyacı vardır:

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

    Bu çalışan bir sağlayıcıdır. Kullanıcılar artık
    `openclaw onboard --acme-ai-api-key <key>` komutunu çalıştırabilir ve
    model olarak `acme-ai/acme-large` seçebilir.

    Yukarı akış sağlayıcı OpenClaw'dan farklı kontrol belirteçleri kullanıyorsa,
    akış yolunu değiştirmek yerine küçük bir çift yönlü metin dönüşümü ekleyin:

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

    `input`, taşıma öncesinde son sistem istemini ve metin mesajı içeriğini yeniden yazar.
    `output`, OpenClaw kendi kontrol işaretleyicilerini veya kanal teslimini ayrıştırmadan önce
    asistan metin deltalarını ve son metni yeniden yazar.

    Sadece API anahtarı kimlik doğrulamasına sahip bir metin sağlayıcısı ve katalog destekli tek bir çalışma zamanı
    kaydeden paketlenmiş sağlayıcılar için, daha dar kapsamlı
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

    `buildProvider`, OpenClaw gerçek sağlayıcı kimlik doğrulamasını çözümleyebildiğinde kullanılan canlı katalog yoludur.
    Sağlayıcıya özgü keşif işlemleri gerçekleştirebilir. `buildStaticProvider` yalnızca kimlik doğrulaması
    yapılandırılmadan önce gösterilmesi güvenli olan çevrimdışı satırlar için kullanılmalıdır;
    kimlik bilgileri gerektirmemeli ve ağ istekleri yapmamalıdır.
    OpenClaw'ın `models list --all` görünümü şu anda statik katalogları
    yalnızca paketlenmiş sağlayıcı Plugin'leri için, boş bir yapılandırma, boş ortam ve
    ajan/çalışma alanı yolları olmadan yürütür.

    Kimlik doğrulama akışınızın ayrıca onboarding sırasında `models.providers.*`,
    takma adları ve ajanın varsayılan modelini yamalaması gerekiyorsa,
    `openclaw/plugin-sdk/provider-onboard` içindeki hazır yardımcıları kullanın. En dar kapsamlı yardımcılar
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` ve
    `createModelCatalogPresetAppliers(...)` yardımcılarıdır.

    Bir sağlayıcının yerel uç noktası normal `openai-completions` taşıması üzerinde
    akışlı kullanım bloklarını destekliyorsa, sağlayıcı kimliği denetimlerini sabit kodlamak yerine
    `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan katalog yardımcılarını tercih edin.
    `supportsNativeStreamingUsageCompat(...)` ve
    `applyProviderNativeStreamingUsageCompat(...)`, desteği uç nokta yetenek eşlemesinden algılar;
    böylece yerel Moonshot/DashScope tarzı uç noktalar, bir Plugin özel bir sağlayıcı kimliği kullanıyor olsa bile
    yine de dahil olur.

  </Step>

  <Step title="Dinamik model çözümlemesi ekleyin">
    Sağlayıcınız rastgele model kimliklerini kabul ediyorsa (bir proxy veya yönlendirici gibi),
    `resolveDynamicModel` ekleyin:

    ```typescript
    api.registerProvider({
      // ... yukarıdaki id, label, auth, catalog

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

    Çözümleme bir ağ çağrısı gerektiriyorsa, eşzamansız
    ön hazırlık için `prepareDynamicModel` kullanın — tamamlandıktan sonra `resolveDynamicModel` yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı kancaları ekleyin (gerektiğinde)">
    Çoğu sağlayıcının yalnızca `catalog` + `resolveDynamicModel` alanlarına ihtiyacı vardır. Sağlayıcınız gerektirdikçe
    kancaları kademeli olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın replay/tool-compat
    ailelerini kapsıyor, bu nedenle Plugin'lerin genellikle her kancayı tek tek elle bağlaması gerekmez:

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

    Günümüzde kullanılabilen replay aileleri:

    | Aile | Bağladığı bileşenler | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI uyumlu taşımalar için paylaşılan OpenAI tarzı replay ilkesi; buna araç çağrısı kimliği temizleme, asistan-önce sıralama düzeltmeleri ve taşımanın ihtiyaç duyduğu yerlerde genel Gemini dönüş doğrulaması dahildir | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` tarafından seçilen Claude farkında replay ilkesi; böylece Anthropic-mesaj taşımaları yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda Claude'a özgü düşünme bloğu temizliğini alır | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Yerel Gemini replay ilkesi ile bootstrap replay temizliği ve etiketli reasoning-output modu | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI uyumlu proxy taşımaları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizliği; yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Tek bir Plugin içinde Anthropic-mesaj ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit ilke; isteğe bağlı olarak yalnızca Claude'a özgü düşünme bloğu bırakma işlemi Anthropic tarafıyla sınırlı kalır | `minimax` |

    Günümüzde kullanılabilen akış aileleri:

    | Aile | Bağladığı bileşenler | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini düşünme yükü normalizasyonu | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo reasoning sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy reasoning kimlikleri enjekte edilen düşünmeyi atlar | `kilocode` |
    | `moonshot-thinking` | Yapılandırma + `/think` düzeyinden Moonshot ikili yerel düşünme yükü eşlemesi | `moonshot` |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax hızlı mod model yeniden yazımı | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: atıf başlıkları, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması, reasoning-compat yük şekillendirme ve Responses bağlam yönetimi | `openai`, `openai-codex` |
    | `openrouter-thinking` | Proxy rotaları için OpenRouter reasoning sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak ele alınır | `openrouter` |
    | `tool-stream-default-on` | Açıkça devre dışı bırakılmadığı sürece araç akışı isteyen Z.AI gibi sağlayıcılar için varsayılan olarak açık `tool_stream` sarmalayıcısı | `zai` |

    <Accordion title="Aile oluşturucularını destekleyen SDK seam'leri">
      Her aile oluşturucusu, aynı paketten dışa aktarılan daha alt düzey genel yardımcılar kullanılarak oluşturulur; bir sağlayıcının ortak kalıbın dışına çıkması gerektiğinde bunlara başvurabilirsiniz:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` ve ham replay oluşturucuları (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Ayrıca Gemini replay yardımcılarını (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ve uç nokta/model yardımcılarını (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`) dışa aktarır.
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` ve paylaşılan OpenAI/Codex sarmalayıcıları (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) ile paylaşılan proxy/sağlayıcı sarmalayıcıları (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, temel Gemini şema yardımcıları (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) ve xAI uyumluluk yardımcıları (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Paketlenmiş xAI Plugin'i, xAI kurallarının sağlayıcıya ait kalmasını sağlamak için bunlarla birlikte `normalizeResolvedModel` + `contributeResolvedModelCompat` kullanır.

      Bazı akış yardımcıları bilerek sağlayıcıya yerel tutulur. `@openclaw/anthropic-provider`, Claude OAuth beta işleme ve `context1m` geçitlemesini kodladıkları için `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha alt düzey Anthropic sarmalayıcı oluşturucularını kendi genel `api.ts` / `contract-api.ts` seam'inde tutar. xAI Plugin'i de benzer şekilde yerel xAI Responses şekillendirmesini kendi `wrapStreamFn` içinde tutar (`/fast` takma adları, varsayılan `tool_stream`, desteklenmeyen strict-tool temizliği, xAI'ye özgü reasoning yükü kaldırma).

      Aynı paket kökü kalıbı `@openclaw/openai-provider` (sağlayıcı oluşturucuları, varsayılan model yardımcıları, gerçek zamanlı sağlayıcı oluşturucuları) ve `@openclaw/openrouter-provider` (sağlayıcı oluşturucu artı onboarding/yapılandırma yardımcıları) için de temel oluşturur.
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
      <Tab title="Özel başlıklar">
        Özel istek başlıkları veya gövde değişiklikleri gerektiren sağlayıcılar için:

        ```typescript
        // wrapStreamFn, ctx.streamFn'den türetilen bir StreamFn döndürür
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
        Genel HTTP veya WebSocket taşımalarında yerel istek/oturum başlıkları ya da meta veriler gerektiren sağlayıcılar için:

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
      <Tab title="Kullanım ve faturalama">
        Kullanım/faturalama verileri sunan sağlayıcılar için:

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

    <Accordion title="Kullanılabilir tüm sağlayıcı kancaları">
      OpenClaw kancaları bu sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır:

      | # | Kanca | Ne zaman kullanılır |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya temel URL varsayılanları |
      | 2 | `applyConfigDefaults` | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel varsayılanlar |
      | 3 | `normalizeModelId` | Aramadan önce eski/önizleme model kimliği takma adlarını temizleme |
      | 4 | `normalizeTransport` | Genel model oluşturmasından önce sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalize etme |
      | 6 | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel akışlı kullanım uyumluluğu yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcıya ait env işaretçisi kimlik doğrulama çözümlemesi |
      | 8 | `resolveSyntheticAuth` | Yerel/self-hosted veya yapılandırma destekli sentetik kimlik doğrulama |
      | 9 | `shouldDeferSyntheticProfileAuth` | Sentetik depolanmış profil yer tutucularını env/yapılandırma kimlik doğrulamasının arkasına alma |
      | 10 | `resolveDynamicModel` | Rastgele yukarı akış model kimliklerini kabul etme |
      | 11 | `prepareDynamicModel` | Çözümlemeden önce eşzamansız meta veri getirme |
      | 12 | `normalizeResolvedModel` | Çalıştırıcıdan önce taşıma yeniden yazımları |
      | 13 | `contributeResolvedModelCompat` | Başka bir uyumlu taşımanın arkasındaki üretici modelleri için uyumluluk bayrakları |
      | 14 | `capabilities` | Eski statik yetenek paketi; yalnızca uyumluluk için |
      | 15 | `normalizeToolSchemas` | Kayıttan önce sağlayıcıya ait araç şeması temizliği |
      | 16 | `inspectToolSchemas` | Sağlayıcıya ait araç şeması tanılamaları |
      | 17 | `resolveReasoningOutputMode` | Etiketli ve yerel reasoning-output sözleşmesi |
      | 18 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 19 | `createStreamFn` | Tamamen özel StreamFn taşıması |
      | 20 | `wrapStreamFn` | Normal akış yolunda özel başlık/gövde sarmalayıcıları |
      | 21 | `resolveTransportTurnState` | Yerel dönüş başına başlıklar/meta veriler |
      | 22 | `resolveWebSocketSessionPolicy` | Yerel WS oturum başlıkları/soğuma süresi |
      | 23 | `formatApiKey` | Özel çalışma zamanı belirteç biçimi |
      | 24 | `refreshOAuth` | Özel OAuth yenileme |
      | 25 | `buildAuthDoctorHint` | Kimlik doğrulama onarım rehberliği |
      | 26 | `matchesContextOverflowError` | Sağlayıcıya ait taşma algılama |
      | 27 | `classifyFailoverReason` | Sağlayıcıya ait hız sınırı/aşırı yük sınıflandırması |
      | 28 | `isCacheTtlEligible` | İstem önbelleği TTL geçitlemesi |
      | 29 | `buildMissingAuthMessage` | Özel eksik kimlik doğrulama ipucu |
      | 30 | `suppressBuiltInModel` | Eski yukarı akış satırlarını gizleme |
      | 31 | `augmentModelCatalog` | Sentetik ileri uyumluluk satırları |
      | 32 | `resolveThinkingProfile` | Modele özgü `/think` seçenek kümesi |
      | 33 | `isBinaryThinking` | İkili düşünme açık/kapalı uyumluluğu |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning desteği uyumluluğu |
      | 35 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi uyumluluğu |
      | 36 | `isModernModelRef` | Canlı/smoke model eşleştirmesi |
      | 37 | `prepareRuntimeAuth` | Çıkarımdan önce belirteç değişimi |
      | 38 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırma |
      | 39 | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | 40 | `createEmbeddingProvider` | bellek/arama için sağlayıcıya ait embedding bağdaştırıcısı |
      | 41 | `buildReplayPolicy` | Özel transkript replay/Compaction ilkesi |
      | 42 | `sanitizeReplayHistory` | Genel temizlemeden sonra sağlayıcıya özgü replay yeniden yazımları |
      | 43 | `validateReplayTurns` | Gömülü çalıştırıcıdan önce sıkı replay dönüş doğrulaması |
      | 44 | `onModelSelected` | Seçim sonrası geri çağırım (ör. telemetri) |

      Çalışma zamanı fallback notları:

      - `normalizeConfig` önce eşleşen sağlayıcıyı, sonra yapılandırmayı gerçekten değiştiren biri bulunana kadar kanca destekli diğer sağlayıcı Plugin'lerini denetler. Hiçbir sağlayıcı kancası desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa, paketlenmiş Google yapılandırma normalleştiricisi yine de uygulanır.
      - `resolveConfigApiKey`, açığa çıkarıldığında sağlayıcı kancasını kullanır. Paketlenmiş `amazon-bedrock` yolunda burada ayrıca yerleşik bir AWS env işaretçisi çözümleyicisi de vardır; her ne kadar Bedrock çalışma zamanı kimlik doğrulaması hâlâ AWS SDK varsayılan zincirini kullansa da.
      - `resolveSystemPromptContribution`, bir sağlayıcının model ailesi için önbellek farkındalığı olan sistem istemi rehberliği enjekte etmesine izin verir. Davranış tek bir sağlayıcı/model ailesine ait olduğunda ve kararlı/dinamik önbellek ayrımını koruması gerektiğinde bunu `before_prompt_build` yerine tercih edin.

      Ayrıntılı açıklamalar ve gerçek dünyadan örnekler için bkz. [İç Yapılar: Sağlayıcı Çalışma Zamanı Kancaları](/tr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekleyin (isteğe bağlı)">
    Bir sağlayıcı Plugin'i, metin çıkarımının yanında konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
    ses, medya anlama, görsel üretimi, video üretimi, web getirme
    ve web araması kaydedebilir. OpenClaw bunu
    **hybrid-capability** Plugin'i olarak sınıflandırır — şirket Plugin'leri
    için önerilen kalıptır (satıcı başına bir Plugin). Bkz.
    [İç Yapılar: Yetenek Sahipliği](/tr/plugins/architecture#capability-ownership-model).

    Her yeteneği, mevcut
    `api.registerProvider(...)` çağrınızın yanında `register(api)` içinde kaydedin. Yalnızca ihtiyacınız olan sekmeleri seçin:

    <Tabs>
      <Tab title="Konuşma (TTS)">
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
      <Tab title="Gerçek zamanlı transkripsiyon">
        `createRealtimeTranscriptionWebSocketSession(...)` kullanmayı tercih edin — paylaşılan
        yardımcı proxy yakalama, yeniden bağlanma geri çekilmesini, kapatma sırasında flush işlemini, hazır el sıkışmalarını,
        ses kuyruklamayı ve kapatma olayı tanılamalarını yönetir. Plugin'iniz
        yalnızca yukarı akış olaylarını eşler.

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

        Multipart ses POST eden toplu STT sağlayıcıları,
        `openclaw/plugin-sdk/provider-http`
        içindeki `buildAudioTranscriptionFormData(...)`
        yardımcısını kullanmalıdır. Bu yardımcı, uyumlu transkripsiyon API'leri için
        M4A tarzı dosya adı gerektiren AAC yüklemeleri dahil olmak üzere yükleme
        dosya adlarını normalize eder.
      </Tab>
      <Tab title="Gerçek zamanlı ses">
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
      <Tab title="Medya anlama">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Görsel ve video üretimi">
        Video yetenekleri **mod farkında** bir şekil kullanır: `generate`,
        `imageToVideo` ve `videoToVideo`. `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`
        gibi düz toplu alanlar, dönüştürme modu desteğini veya devre dışı bırakılmış modları
        temiz biçimde duyurmak için yeterli değildir.
        Müzik üretimi de açık `generate` /
        `edit` bloklarıyla aynı kalıbı izler.

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
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
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
          hint: "Sayfaları Acme'in rendering arka ucu üzerinden getirin.",
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
            description: "Bir sayfayı Acme Fetch üzerinden getirin.",
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

  <Step title="Test edin">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Sağlayıcı yapılandırma nesnenizi index.ts'ten veya ayrılmış bir dosyadan dışa aktarın
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("dinamik modelleri çözümler", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("anahtar mevcut olduğunda kataloğu döndürür", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("anahtar olmadığında null katalog döndürür", async () => {
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

Sağlayıcı Plugin'leri, diğer tüm harici kod Plugin'leriyle aynı şekilde yayımlanır:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Burada eski yalnızca-Skills yayımlama takma adını kullanmayın; Plugin paketleri
`clawhub package publish` kullanmalıdır.

## Dosya yapısı

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers meta verileri
├── openclaw.plugin.json      # Sağlayıcı kimlik doğrulama meta verilerine sahip manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testler
    └── usage.ts              # Kullanım uç noktası (isteğe bağlı)
```

## Katalog sırası başvurusu

`catalog.order`, kataloğunuzun yerleşik
sağlayıcılara göre ne zaman birleştirileceğini kontrol eder:

| Sıra     | Ne zaman      | Kullanım durumu                                |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | İlk geçiş     | Düz API anahtarı sağlayıcıları                 |
| `profile` | `simple` sonrası | Kimlik doğrulama profilleriyle geçitlenen sağlayıcılar |
| `paired`  | `profile` sonrası | Birden çok ilişkili girdiyi sentezleme         |
| `late`    | Son geçiş     | Mevcut sağlayıcıları geçersiz kılma (çakışmada kazanır) |

## Sonraki adımlar

- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — Plugin'iniz ayrıca bir kanal da sağlıyorsa
- [SDK Runtime](/tr/plugins/sdk-runtime) — `api.runtime` yardımcıları (TTS, arama, alt ajan)
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Plugin İç Yapıları](/tr/plugins/architecture-internals#provider-runtime-hooks) — kanca ayrıntıları ve paketlenmiş örnekler

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Kanal Plugin'leri oluşturma](/tr/plugins/sdk-channel-plugins)
