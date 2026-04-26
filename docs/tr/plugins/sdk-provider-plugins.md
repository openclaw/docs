---
read_when:
    - Yeni bir model sağlayıcı Plugin'i oluşturuyorsunuz
    - OpenClaw'a OpenAI uyumlu bir proxy veya özel LLM eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı hook'larını anlamanız gerekiyor
sidebarTitle: Provider plugins
summary: OpenClaw için bir model sağlayıcı Plugin'i oluşturmak üzere adım adım kılavuz
title: Sağlayıcı Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-04-26T11:37:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Bu kılavuz, OpenClaw'a bir model sağlayıcı
(LLM) ekleyen bir sağlayıcı Plugin'i oluşturmayı adım adım açıklar. Sonunda model kataloğu,
API anahtarı kimlik doğrulaması ve dinamik model çözümlemesi olan bir sağlayıcınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce [Getting Started](/tr/plugins/building-plugins) sayfasını okuyun.
</Info>

<Tip>
  Sağlayıcı Plugin'leri, OpenClaw'ın normal çıkarım döngüsüne modeller ekler. Modelin
  thread'lerin, Compaction'ın veya tool olaylarının sahibi olan yerel bir agent daemon'u üzerinden çalışması gerekiyorsa,
  daemon protokolü ayrıntılarını core içine koymak yerine sağlayıcıyı bir [agent harness](/tr/plugins/sdk-agent-harness)
  ile eşleştirin.
</Tip>

## Adım adım kılavuz

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

    Manifest, OpenClaw'ın
    Plugin çalışma zamanınızı yüklemeden kimlik bilgilerini algılayabilmesi için `providerAuthEnvVars` tanımlar. Bir sağlayıcı varyantı başka bir sağlayıcı kimliğinin kimlik doğrulamasını yeniden kullanacaksa `providerAuthAliases`
    ekleyin. `modelSupport`
    isteğe bağlıdır ve çalışma zamanı hook'ları oluşmadan önce OpenClaw'ın `acme-large` gibi kısaltılmış
    model kimliklerinden sağlayıcı Plugin'inizi otomatik yüklemesine izin verir. Sağlayıcıyı
    ClawHub üzerinde yayımlıyorsanız, bu `openclaw.compat` ve `openclaw.build` alanları
    `package.json` içinde zorunludur.

  </Step>

  <Step title="Sağlayıcıyı kaydedin">
    En küçük sağlayıcı için `id`, `label`, `auth` ve `catalog` gerekir:

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
    modelleri olarak `acme-ai/acme-large` seçebilir.

    Yukarı akış sağlayıcı OpenClaw'dan farklı denetim token'ları kullanıyorsa, akış yolunu değiştirmek yerine
    küçük bir çift yönlü metin dönüşümü ekleyin:

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

    `input`, son sistem istemini ve metin mesaj içeriğini
    taşımadan önce yeniden yazar. `output`, assistant metin deltalarını ve son metni OpenClaw kendi denetim işaretçilerini ayrıştırmadan veya kanal teslimini yapmadan önce
    yeniden yazar.

    Yalnızca API anahtarı
    kimlik doğrulamasına sahip tek bir metin sağlayıcı ve tek bir katalog destekli çalışma zamanı kaydeden paketlenmiş sağlayıcılar için, daha dar kapsamlı
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

    `buildProvider`, OpenClaw gerçek
    sağlayıcı kimlik doğrulamasını çözebildiğinde kullanılan canlı katalog yoludur. Sağlayıcıya özgü keşif yapabilir. `buildStaticProvider` değerini yalnızca kimlik doğrulama
    yapılandırılmadan önce gösterilmesi güvenli olan çevrimdışı satırlar için kullanın; kimlik bilgisi gerektirmemeli veya ağ isteği yapmamalıdır.
    OpenClaw'ın `models list --all` görüntüsü şu anda statik katalogları
    yalnızca paketlenmiş sağlayıcı Plugin'leri için, boş config, boş env ve
    agent/workspace yolları olmadan yürütür.

    Kimlik doğrulama akışınızın onboarding sırasında `models.providers.*`, takma adlar ve
    agent varsayılan modelini de yamalaması gerekiyorsa
    `openclaw/plugin-sdk/provider-onboard` içindeki hazır ayar yardımcılarını kullanın. En dar yardımcılar
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` ve
    `createModelCatalogPresetAppliers(...)`'dır.

    Bir sağlayıcının yerel uç noktası normal
    `openai-completions` taşıması üzerinde akışlı kullanım bloklarını destekliyorsa, sağlayıcı kimliği denetimlerini sabit kodlamak yerine
    `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan katalog yardımcılarını tercih edin.
    `supportsNativeStreamingUsageCompat(...)` ve
    `applyProviderNativeStreamingUsageCompat(...)`, uç nokta yetenek eşleminden desteği algılar; böylece yerel Moonshot/DashScope tarzı uç noktalar, bir Plugin özel bir sağlayıcı kimliği kullansa bile
    katılımlı etkinleştirme yapar.

  </Step>

  <Step title="Dinamik model çözümlemesi ekleyin">
    Sağlayıcınız keyfi model kimliklerini kabul ediyorsa (proxy veya yönlendirici gibi),
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

    Çözümleme ağ çağrısı gerektiriyorsa, eşzamanlı olmayan
    ön ısıtma için `prepareDynamicModel` kullanın — `resolveDynamicModel`, bu tamamlandıktan sonra yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı hook'ları ekleyin (gerektiğinde)">
    Çoğu sağlayıcı için yalnızca `catalog` + `resolveDynamicModel` gerekir. Sağlayıcınız gerektirdikçe
    hook'ları aşamalı olarak ekleyin.

    Paylaşılan yardımcı üreticiler artık en yaygın replay/tool-compat
    ailelerini kapsıyor; bu nedenle Plugin'lerin genellikle her hook'u tek tek elle bağlamasına gerek kalmaz:

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

    Bugün mevcut replay aileleri:

    | Aile | Bağladığı şey | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI uyumlu taşımalar için paylaşılan OpenAI tarzı replay ilkesi; tool-call-id temizliği, assistant-first sıralama düzeltmeleri ve taşımanın ihtiyaç duyduğu yerlerde genel Gemini-turn doğrulaması dahil | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` ile seçilen Claude farkındalıklı replay ilkesi; böylece Anthropic-message taşımaları yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda Claude'a özgü thinking-block temizliği alır | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Yerel Gemini replay ilkesi artı bootstrap replay temizliği ve etiketli reasoning-output modu | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI uyumlu proxy taşımaları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizliği; yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Tek bir Plugin içinde Anthropic-message ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit ilke; isteğe bağlı yalnızca-Claude thinking-block düşürme Anthropic tarafıyla sınırlı kalır | `minimax` |

    Bugün mevcut akış aileleri:

    | Aile | Bağladığı şey | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini thinking payload normalizasyonu | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo reasoning sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy reasoning kimlikleri enjekte edilmiş thinking'i atlar | `kilocode` |
    | `moonshot-thinking` | Config + `/think` düzeyinden Moonshot ikili native-thinking payload eşlemesi | `moonshot` |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax hızlı mod model yeniden yazımı | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: attribution üstbilgileri, `/fast`/`serviceTier`, metin verbosity, yerel Codex web arama, reasoning-compat payload biçimlendirme ve Responses bağlam yönetimi | `openai`, `openai-codex` |
    | `openrouter-thinking` | Proxy yolları için OpenRouter reasoning sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak işlenir | `openrouter` |
    | `tool-stream-default-on` | Z.AI gibi açıkça devre dışı bırakılmadıkça tool akışı isteyen sağlayıcılar için varsayılan açık `tool_stream` sarmalayıcısı | `zai` |

    <Accordion title="Aile üreticilerini güçlendiren SDK yüzeyleri">
      Her aile üreticisi, sağlayıcının ortak kalıbın dışına çıkması gerektiğinde erişebileceğiniz, aynı paketten dışa aktarılan daha düşük düzeyli genel yardımcıların birleşiminden oluşur:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` ve ham replay üreticileri (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Ayrıca Gemini replay yardımcılarını (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ve uç nokta/model yardımcılarını (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`) da dışa aktarır.
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` ve paylaşılan OpenAI/Codex sarmalayıcıları (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI uyumlu sarmalayıcısı (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) ve paylaşılan proxy/sağlayıcı sarmalayıcıları (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, alttaki Gemini şema yardımcıları (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) ve xAI uyumluluk yardımcıları (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Paketlenmiş xAI Plugin'i, xAI kurallarını sağlayıcı sahipli tutmak için bunlarla birlikte `normalizeResolvedModel` + `contributeResolvedModelCompat` kullanır.

      Bazı akış yardımcıları kasıtlı olarak sağlayıcı yerelinde kalır. `@openclaw/anthropic-provider`; `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha düşük düzeyli Anthropic sarmalayıcı üreticilerini kendi genel `api.ts` / `contract-api.ts` yüzeyinde tutar; çünkü bunlar Claude OAuth beta işleme ve `context1m` geçitlemesini kodlar. xAI Plugin'i de benzer şekilde yerel xAI Responses biçimlendirmesini kendi `wrapStreamFn` içinde tutar (`/fast` takma adları, varsayılan `tool_stream`, desteklenmeyen strict-tool temizliği, xAI'ye özgü reasoning-payload kaldırma).

      Aynı paket kökü kalıbı `@openclaw/openai-provider` (sağlayıcı üreticileri, default-model yardımcıları, gerçek zamanlı sağlayıcı üreticileri) ve `@openclaw/openrouter-provider` (sağlayıcı üreticisi artı onboarding/config yardımcıları) için de temel oluşturur.
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Her çıkarım çağrısından önce token exchange gerektiren sağlayıcılar için:

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
        Özel istek üstbilgileri veya gövde değişiklikleri gerektiren sağlayıcılar için:

        ```typescript
        // wrapStreamFn, ctx.streamFn değerinden türetilmiş bir StreamFn döndürür
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
        Genel HTTP veya WebSocket taşımalarında yerel istek/oturum üstbilgileri ya da metadata gerektiren sağlayıcılar için:

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
        Kullanım/faturalandırma verisi açığa çıkaran sağlayıcılar için:

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

    <Accordion title="Kullanılabilir tüm sağlayıcı hook'ları">
      OpenClaw hook'ları bu sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır:

      | # | Hook | Ne zaman kullanılır |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya base URL varsayılanları |
      | 2 | `applyConfigDefaults` | Config somutlaştırması sırasında sağlayıcı sahipli genel varsayılanlar |
      | 3 | `normalizeModelId` | Aramadan önce eski/önizleme model kimliği takma adı temizliği |
      | 4 | `normalizeTransport` | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` config'ini normalize etme |
      | 6 | `applyNativeStreamingUsageCompat` | Config sağlayıcıları için yerel akışlı kullanım uyumluluk yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcı sahipli env-marker kimlik doğrulama çözümlemesi |
      | 8 | `resolveSyntheticAuth` | Yerel/kendi barındırılan veya config destekli sentetik kimlik doğrulama |
      | 9 | `shouldDeferSyntheticProfileAuth` | Sentetik saklanmış profil yer tutucularını env/config kimlik doğrulamasının gerisine atma |
      | 10 | `resolveDynamicModel` | Keyfi yukarı akış model kimliklerini kabul etme |
      | 11 | `prepareDynamicModel` | Çözümlemeden önce eşzamanlı olmayan metadata getirme |
      | 12 | `normalizeResolvedModel` | Çalıştırıcıdan önce taşıma yeniden yazımları |
      | 13 | `contributeResolvedModelCompat` | Başka bir uyumlu taşımanın arkasındaki sağlayıcı modelleri için uyumluluk bayrakları |
      | 14 | `capabilities` | Eski statik yetenek çantası; yalnızca uyumluluk |
      | 15 | `normalizeToolSchemas` | Kayıttan önce sağlayıcı sahipli tool şeması temizliği |
      | 16 | `inspectToolSchemas` | Sağlayıcı sahipli tool şeması tanılamaları |
      | 17 | `resolveReasoningOutputMode` | Etiketli ve yerel reasoning-output sözleşmesi |
      | 18 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 19 | `createStreamFn` | Tam özel StreamFn taşıması |
      | 20 | `wrapStreamFn` | Normal akış yolunda özel üstbilgi/gövde sarmalayıcıları |
      | 21 | `resolveTransportTurnState` | Yerel tur başına üstbilgiler/metadata |
      | 22 | `resolveWebSocketSessionPolicy` | Yerel WS oturum üstbilgileri/cool-down |
      | 23 | `formatApiKey` | Özel çalışma zamanı token biçimi |
      | 24 | `refreshOAuth` | Özel OAuth yenileme |
      | 25 | `buildAuthDoctorHint` | Kimlik doğrulama onarım rehberliği |
      | 26 | `matchesContextOverflowError` | Sağlayıcı sahipli taşma algılama |
      | 27 | `classifyFailoverReason` | Sağlayıcı sahipli hız sınırı/aşırı yük sınıflandırması |
      | 28 | `isCacheTtlEligible` | Prompt cache TTL geçitlemesi |
      | 29 | `buildMissingAuthMessage` | Özel eksik kimlik doğrulama ipucu |
      | 30 | `suppressBuiltInModel` | Bayat yukarı akış satırlarını gizleme |
      | 31 | `augmentModelCatalog` | Sentetik ileri uyumluluk satırları |
      | 32 | `resolveThinkingProfile` | Modele özgü `/think` seçenek kümesi |
      | 33 | `isBinaryThinking` | İkili thinking açık/kapalı uyumluluğu |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning desteği uyumluluğu |
      | 35 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi uyumluluğu |
      | 36 | `isModernModelRef` | Canlı/smoke model eşleşmesi |
      | 37 | `prepareRuntimeAuth` | Çıkarımdan önce token exchange |
      | 38 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırma |
      | 39 | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | 40 | `createEmbeddingProvider` | memory/search için sağlayıcı sahipli embedding bağdaştırıcısı |
      | 41 | `buildReplayPolicy` | Özel transcript replay/Compaction ilkesi |
      | 42 | `sanitizeReplayHistory` | Genel temizlikten sonra sağlayıcıya özgü replay yeniden yazımları |
      | 43 | `validateReplayTurns` | Gömülü çalıştırıcıdan önce katı replay-turn doğrulaması |
      | 44 | `onModelSelected` | Seçim sonrası geri çağırım (örn. telemetri) |

      Çalışma zamanı fallback notları:

      - `normalizeConfig` önce eşleşen sağlayıcıyı, sonra gerçekten config'i değiştiren biri bulunana kadar diğer hook yetenekli sağlayıcı Plugin'lerini denetler. Hiçbir sağlayıcı hook'u desteklenen Google ailesi config girdisini yeniden yazmazsa, paketlenmiş Google config normalleştiricisi yine uygulanır.
      - `resolveConfigApiKey`, açığa çıkarıldığında sağlayıcı hook'unu kullanır. Paketlenmiş `amazon-bedrock` yolu da burada yerleşik bir AWS env-marker çözücüsüne sahiptir, ancak Bedrock çalışma zamanı kimlik doğrulamasının kendisi hâlâ AWS SDK varsayılan zincirini kullanır.
      - `resolveSystemPromptContribution`, bir sağlayıcının model ailesi için cache farkındalıklı sistem istemi rehberliği enjekte etmesine izin verir. Davranış tek bir sağlayıcı/model ailesine ait olduğunda ve kararlı/dinamik cache ayrımını koruması gerektiğinde bunu `before_prompt_build` yerine tercih edin.

      Ayrıntılı açıklamalar ve gerçek dünya örnekleri için bkz. [Internals: Provider Runtime Hooks](/tr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekleyin (isteğe bağlı)">
    Bir sağlayıcı Plugin'i, metin çıkarımının yanında konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
    ses, medya anlama, görsel oluşturma, video oluşturma, web getirme
    ve web arama kaydedebilir. OpenClaw bunu
    **hybrid-capability** Plugin olarak sınıflandırır — şirket Plugin'leri için önerilen kalıp budur
    (sağlayıcı başına bir Plugin). Bkz.
    [Internals: Capability Ownership](/tr/plugins/architecture#capability-ownership-model).

    Mevcut `api.registerProvider(...)` çağrınızın yanına her yeteneği
    `register(api)` içinde kaydedin. Yalnızca ihtiyacınız olan sekmeleri seçin:

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

        Sağlayıcı HTTP hataları için `assertOkOrThrowProviderError(...)` kullanın; böylece
        Plugin'ler sınırlı hata gövdesi okumalarını, JSON hata ayrıştırmasını ve
        request-id son eklerini paylaşır.
      </Tab>
      <Tab title="Gerçek zamanlı transkripsiyon">
        `createRealtimeTranscriptionWebSocketSession(...)` tercih edin — paylaşılan
        yardımcı; proxy yakalama, yeniden bağlanma backoff'u, kapatma flush'ı, hazır
        el sıkışmaları, ses kuyruğa alma ve close-event tanılamalarını işler. Plugin'iniz
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
        `openclaw/plugin-sdk/provider-http` içinden
        `buildAudioTranscriptionFormData(...)` kullanmalıdır. Bu yardımcı yükleme
        dosya adlarını normalize eder; buna, uyumlu transkripsiyon API'leri için
        M4A tarzı dosya adı gerektiren AAC yüklemeleri de dahildir.
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
      <Tab title="Görsel ve video oluşturma">
        Video yetenekleri **mod farkındalıklı** bir biçim kullanır: `generate`,
        `imageToVideo` ve `videoToVideo`. `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` gibi
        düz toplu alanlar, dönüşüm modu desteğini veya devre dışı modları temiz biçimde bildirmek için
        yeterli değildir.
        Müzik oluşturma da açık `generate` /
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

  <Step title="Test edin">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Sağlayıcı config nesnenizi index.ts veya özel bir dosyadan dışa aktarın
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

Sağlayıcı Plugin'leri, diğer tüm dış kod Plugin'leriyle aynı şekilde yayımlanır:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Burada eski yalnızca-Skills yayınlama takma adını kullanmayın; Plugin paketleri
`clawhub package publish` kullanmalıdır.

## Dosya yapısı

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Sağlayıcı kimlik doğrulama metadata'sı içeren manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testler
    └── usage.ts              # Kullanım uç noktası (isteğe bağlı)
```

## Katalog sırası referansı

`catalog.order`, kataloğunuzun yerleşik
sağlayıcılara göre ne zaman birleştirileceğini denetler:

| Sıra      | Ne zaman      | Kullanım durumu                                |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | İlk geçiş     | Düz API anahtarı sağlayıcıları                 |
| `profile` | simple sonrası | Kimlik doğrulama profilleriyle kapılanan sağlayıcılar |
| `paired`  | profile sonrası | Birden çok ilişkili girdiyi sentezleme        |
| `late`    | Son geçiş     | Mevcut sağlayıcıları geçersiz kılma (çakışmada kazanır) |

## Sonraki adımlar

- [Channel Plugins](/tr/plugins/sdk-channel-plugins) — Plugin'iniz bir kanal da sağlıyorsa
- [SDK Runtime](/tr/plugins/sdk-runtime) — `api.runtime` yardımcıları (TTS, arama, subagent)
- [SDK Overview](/tr/plugins/sdk-overview) — tam alt yol içe aktarma referansı
- [Plugin Internals](/tr/plugins/architecture-internals#provider-runtime-hooks) — hook ayrıntıları ve paketlenmiş örnekler

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Kanal Plugin'leri oluşturma](/tr/plugins/sdk-channel-plugins)
