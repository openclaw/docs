---
read_when:
    - Yeni bir model sağlayıcı Plugin oluşturuyorsunuz
    - OpenClaw'a OpenAI uyumlu bir proxy veya özel bir LLM eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı kancalarını anlamanız gerekir
sidebarTitle: Provider plugins
summary: OpenClaw için model sağlayıcı Plugin oluşturmaya yönelik adım adım kılavuz
title: Sağlayıcı Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-05-06T09:25:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Bu kılavuz, OpenClaw'a bir model sağlayıcısı (LLM) ekleyen bir sağlayıcı Plugin'i oluşturmayı adım adım açıklar. Sonunda model kataloğu, API anahtarı kimlik doğrulaması ve dinamik model çözümlemesi olan bir sağlayıcınız olacak.

<Info>
  Daha önce herhangi bir OpenClaw Plugin'i oluşturmadıysanız, temel paket yapısı ve manifest kurulumu için önce [Başlarken](/tr/plugins/building-plugins) sayfasını okuyun.
</Info>

<Tip>
  Sağlayıcı Plugin'leri, OpenClaw'ın normal çıkarım döngüsüne modeller ekler. Model, thread'leri, Compaction'ı veya araç olaylarını sahiplenen yerel bir ajan daemon'ı üzerinden çalışmak zorundaysa daemon protokol ayrıntılarını core'a koymak yerine sağlayıcıyı bir [ajan harness'i](/tr/plugins/sdk-agent-harness) ile eşleştirin.
</Tip>

## Adım Adım Kılavuz

<Steps>
  <Step title="Paket ve manifest">
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

    Manifest, OpenClaw'ın Plugin çalışma zamanınızı yüklemeden kimlik bilgilerini algılayabilmesi için `providerAuthEnvVars` bildirir. Bir sağlayıcı varyantının başka bir sağlayıcı kimliğinin kimlik doğrulamasını yeniden kullanması gerektiğinde `providerAuthAliases` ekleyin. `modelSupport` isteğe bağlıdır ve OpenClaw'ın çalışma zamanı hook'ları var olmadan önce `acme-large` gibi kısa model kimliklerinden sağlayıcı Plugin'inizi otomatik yüklemesini sağlar. Sağlayıcıyı ClawHub'da yayımlarsanız bu `openclaw.compat` ve `openclaw.build` alanları `package.json` içinde zorunludur.

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

    Bu, çalışan bir sağlayıcıdır. Kullanıcılar artık `openclaw onboard --acme-ai-api-key <key>` çalıştırabilir ve model olarak `acme-ai/acme-large` seçebilir.

    Upstream sağlayıcı OpenClaw'dan farklı denetim token'ları kullanıyorsa akış yolunu değiştirmek yerine küçük bir çift yönlü metin dönüşümü ekleyin:

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

    `input`, aktarım öncesinde son sistem prompt'unu ve metin mesajı içeriğini yeniden yazar. `output`, OpenClaw kendi denetim işaretleyicilerini veya kanal teslimini ayrıştırmadan önce asistan metin deltalarını ve son metni yeniden yazar.

    Yalnızca API anahtarı kimlik doğrulamasına sahip tek bir metin sağlayıcısı ve tek bir katalog destekli çalışma zamanı kaydeden paketlenmiş sağlayıcılar için daha dar kapsamlı `defineSingleProviderPluginEntry(...)` yardımcısını tercih edin:

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

    `buildProvider`, OpenClaw gerçek sağlayıcı kimlik doğrulamasını çözebildiğinde kullanılan canlı katalog yoludur. Sağlayıcıya özgü keşif gerçekleştirebilir. `buildStaticProvider` yalnızca kimlik doğrulaması yapılandırılmadan önce gösterilmesi güvenli olan çevrimdışı satırlar için kullanılmalıdır; kimlik bilgisi gerektirmemeli veya ağ isteği yapmamalıdır. OpenClaw'ın `models list --all` gösterimi şu anda statik katalogları yalnızca paketlenmiş sağlayıcı Plugin'leri için, boş config, boş env ve ajan/çalışma alanı yolları olmadan çalıştırır.

    Kimlik doğrulama akışınızın onboarding sırasında `models.providers.*`, alias'lar ve ajan varsayılan modelini de yamaması gerekiyorsa `openclaw/plugin-sdk/provider-onboard` içindeki preset yardımcılarını kullanın. En dar yardımcılar `createDefaultModelPresetAppliers(...)`, `createDefaultModelsPresetAppliers(...)` ve `createModelCatalogPresetAppliers(...)` öğeleridir.

    Bir sağlayıcının yerel endpoint'i normal `openai-completions` aktarımında akışlı kullanım bloklarını desteklediğinde sağlayıcı kimliği denetimlerini hardcode etmek yerine `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan katalog yardımcılarını tercih edin. `supportsNativeStreamingUsageCompat(...)` ve `applyProviderNativeStreamingUsageCompat(...)` desteği endpoint yetenek haritasından algılar; böylece yerel Moonshot/DashScope tarzı endpoint'ler, bir Plugin özel sağlayıcı kimliği kullanıyor olsa bile yine de opt in yapar.

  </Step>

  <Step title="Dinamik model çözümlemesi ekleyin">
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

    Çözümleme bir ağ çağrısı gerektiriyorsa async ısınma için `prepareDynamicModel` kullanın; `resolveDynamicModel` tamamlandıktan sonra yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı hook'ları ekleyin (gerektiği kadar)">
    Çoğu sağlayıcı yalnızca `catalog` + `resolveDynamicModel` gerektirir. Sağlayıcınız gerektirdikçe hook'ları kademeli olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın replay/araç uyumluluğu ailelerini kapsar; bu nedenle Plugin'lerin genellikle her hook'u tek tek elle bağlaması gerekmez:

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

    Bugün kullanılabilir replay aileleri:

    | Aile | Bağladığı şey | Paketlenmiş örnekler |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI uyumlu aktarımlar için paylaşılan OpenAI tarzı replay politikası; araç çağrısı kimliği temizleme, asistan-öncelikli sıralama düzeltmeleri ve aktarımın ihtiyaç duyduğu yerlerde genel Gemini-turn doğrulaması dahil | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` ile seçilen Claude farkındalıklı replay politikası; böylece Anthropic-message aktarımları yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda Claude'a özgü düşünme bloğu temizliği alır | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Yerel Gemini replay politikası, bootstrap replay temizliği ve etiketli reasoning-output modu | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI uyumlu proxy aktarımları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizliği; yerel Gemini replay doğrulamasını veya bootstrap yeniden yazmalarını etkinleştirmez | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Tek bir Plugin içinde Anthropic-message ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit politika; isteğe bağlı yalnızca Claude düşünme bloğu düşürme işlemi Anthropic tarafıyla sınırlı kalır | `minimax` |

    Bugün kullanılabilen akış aileleri:

    | Aile | Neyi bağlar | Paketli örnekler |
    | --- | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini düşünme yükü normalizasyonu | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo akıl yürütme sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy akıl yürütme kimlikleri enjekte edilen düşünmeyi atlar | `kilocode` |
    | `moonshot-thinking` | Yapılandırma + `/think` düzeyinden Moonshot ikili yerel düşünme yükü eşlemesi | `moonshot` |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax hızlı mod model yeniden yazımı | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: atıf üstbilgileri, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması, akıl yürütme uyumluluğu yük şekillendirmesi ve Responses bağlam yönetimi | `openai`, `openai-codex` |
    | `openrouter-thinking` | Proxy rotaları için OpenRouter akıl yürütme sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak işlenir | `openrouter` |
    | `tool-stream-default-on` | Açıkça devre dışı bırakılmadıkça araç akışı isteyen Z.AI gibi sağlayıcılar için varsayılan olarak açık `tool_stream` sarmalayıcısı | `zai` |

    <Accordion title="Aile oluşturucuları destekleyen SDK sınırları">
      Her aile oluşturucu, aynı paketten dışa aktarılan daha düşük düzeyli herkese açık yardımcılarla oluşturulur. Bir sağlayıcının ortak kalıbın dışına çıkması gerektiğinde bunları kullanabilirsiniz:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` ve ham yeniden oynatma oluşturucuları (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Ayrıca Gemini yeniden oynatma yardımcılarını (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ve uç nokta/model yardımcılarını (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`) dışa aktarır.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`; ayrıca paylaşılan OpenAI/Codex sarmalayıcıları (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI uyumlu sarmalayıcı (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages düşünme ön doldurma temizliği (`createAnthropicThinkingPrefillPayloadWrapper`) ve paylaşılan proxy/sağlayıcı sarmalayıcıları (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, alttaki Gemini şema yardımcıları (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) ve xAI uyumluluk yardımcıları (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Paketli xAI Plugin, xAI kurallarını sağlayıcıya ait tutmak için bunlarla birlikte `normalizeResolvedModel` + `contributeResolvedModelCompat` kullanır.

      Bazı akış yardımcıları bilinçli olarak sağlayıcıya yerel kalır. `@openclaw/anthropic-provider`, Claude OAuth beta işleme ve `context1m` geçidini kodladıkları için `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha düşük düzeyli Anthropic sarmalayıcı oluşturucularını kendi herkese açık `api.ts` / `contract-api.ts` sınırında tutar. xAI Plugin de yerel xAI Responses şekillendirmesini benzer şekilde kendi `wrapStreamFn` içinde tutar (`/fast` takma adları, varsayılan `tool_stream`, desteklenmeyen katı araç temizliği, xAI'ye özgü akıl yürütme yükü kaldırma).

      Aynı paket kökü kalıbı ayrıca `@openclaw/openai-provider` (sağlayıcı oluşturucuları, varsayılan model yardımcıları, gerçek zamanlı sağlayıcı oluşturucuları) ve `@openclaw/openrouter-provider` (sağlayıcı oluşturucu artı alıştırma/yapılandırma yardımcıları) için de temel oluşturur.
    </Accordion>

    <Tabs>
      <Tab title="Token değişimi">
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
      <Tab title="Özel üstbilgiler">
        Özel istek üstbilgileri veya gövde değişiklikleri gerektiren sağlayıcılar için:

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
        Genel HTTP veya WebSocket aktarımlarında yerel istek/oturum üstbilgileri
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
        Kullanım/faturalandırma verileri sunan sağlayıcılar için:

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
      OpenClaw'ın artık çağırmadığı `ProviderPlugin.capabilities` ve `suppressBuiltInModel`
      gibi yalnızca uyumluluk amaçlı sağlayıcı alanları burada listelenmez.

      | # | Hook | Ne zaman kullanılır |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya temel URL varsayılanları |
      | 2 | `applyConfigDefaults` | Yapılandırma maddeleştirme sırasında sağlayıcıya ait küresel varsayılanlar |
      | 3 | `normalizeModelId` | Arama öncesi eski/önizleme model kimliği takma adı temizliği |
      | 4 | `normalizeTransport` | Genel model derlemesi öncesi sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalleştir |
      | 6 | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel akış kullanım uyumluluğu yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcıya ait env işaretçisi kimlik doğrulama çözümlemesi |
      | 8 | `resolveSyntheticAuth` | Yerel/kendi barındırılan veya yapılandırma destekli sentetik kimlik doğrulama |
      | 9 | `shouldDeferSyntheticProfileAuth` | Sentetik saklanan profil yer tutucularını env/yapılandırma kimlik doğrulamasının arkasına indir |
      | 10 | `resolveDynamicModel` | Rastgele yukarı akış model kimliklerini kabul et |
      | 11 | `prepareDynamicModel` | Çözümleme öncesi asenkron meta veri getirme |
      | 12 | `normalizeResolvedModel` | Çalıştırıcıdan önce aktarım yeniden yazımları |
      | 13 | `contributeResolvedModelCompat` | Başka bir uyumlu aktarımın arkasındaki satıcı modelleri için uyumluluk bayrakları |
      | 14 | `normalizeToolSchemas` | Kayıt öncesi sağlayıcıya ait araç şeması temizliği |
      | 15 | `inspectToolSchemas` | Sağlayıcıya ait araç şeması tanılamaları |
      | 16 | `resolveReasoningOutputMode` | Etiketli ve yerel akıl yürütme çıktısı sözleşmesi |
      | 17 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 18 | `createStreamFn` | Tamamen özel StreamFn aktarımı |
      | 19 | `wrapStreamFn` | Normal akış yolunda özel üstbilgi/gövde sarmalayıcıları |
      | 20 | `resolveTransportTurnState` | Yerel tur başına üstbilgiler/meta veriler |
      | 21 | `resolveWebSocketSessionPolicy` | Yerel WS oturum üstbilgileri/soğuma süresi |
      | 22 | `formatApiKey` | Özel çalışma zamanı token şekli |
      | 23 | `refreshOAuth` | Özel OAuth yenileme |
      | 24 | `buildAuthDoctorHint` | Kimlik doğrulama onarım rehberliği |
      | 25 | `matchesContextOverflowError` | Sağlayıcıya ait taşma algılama |
      | 26 | `classifyFailoverReason` | Sağlayıcıya ait hız sınırı/aşırı yük sınıflandırması |
      | 27 | `isCacheTtlEligible` | İstem önbelleği TTL geçidi |
      | 28 | `buildMissingAuthMessage` | Özel eksik kimlik doğrulama ipucu |
      | 29 | `augmentModelCatalog` | Sentetik ileriye dönük uyumluluk satırları |
      | 30 | `resolveThinkingProfile` | Modele özgü `/think` seçenek kümesi |
      | 31 | `isBinaryThinking` | İkili düşünme açık/kapalı uyumluluğu |
      | 32 | `supportsXHighThinking` | `xhigh` akıl yürütme desteği uyumluluğu |
      | 33 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi uyumluluğu |
      | 34 | `isModernModelRef` | Canlı/smoke model eşleştirme |
      | 35 | `prepareRuntimeAuth` | Çıkarım öncesi token değişimi |
      | 36 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırma |
      | 37 | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | 38 | `createEmbeddingProvider` | Bellek/arama için sağlayıcıya ait embedding adaptörü |
      | 39 | `buildReplayPolicy` | Özel transkript yeniden oynatma/Compaction ilkesi |
      | 40 | `sanitizeReplayHistory` | Genel temizlik sonrası sağlayıcıya özgü yeniden oynatma yeniden yazımları |
      | 41 | `validateReplayTurns` | Gömülü çalıştırıcı öncesi katı yeniden oynatma turu doğrulaması |
      | 42 | `onModelSelected` | Seçim sonrası geri çağırma (ör. telemetri) |

      Çalışma zamanı geri dönüş notları:

      - `normalizeConfig` önce eşleşen sağlayıcıyı, ardından yapılandırmayı gerçekten değiştiren biri olana kadar hook destekli diğer sağlayıcı Plugin'lerini denetler. Hiçbir sağlayıcı hook'u desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa paketli Google yapılandırma normalleştiricisi yine de uygulanır.
      - `resolveConfigApiKey`, açık olduğunda sağlayıcı hook'unu kullanır. Paketli `amazon-bedrock` yolu da burada yerleşik bir AWS env işaretçisi çözümleyicisine sahiptir; Bedrock çalışma zamanı kimlik doğrulamasının kendisi hâlâ AWS SDK varsayılan zincirini kullansa bile.
      - `resolveSystemPromptContribution`, bir sağlayıcının bir model ailesi için önbellek duyarlı sistem istemi rehberliği enjekte etmesine olanak tanır. Davranış tek bir sağlayıcı/model ailesine ait olduğunda ve kararlı/dinamik önbellek ayrımını koruması gerektiğinde bunu `before_prompt_build` yerine tercih edin.

      Ayrıntılı açıklamalar ve gerçek dünyadan örnekler için bkz. [İç Yapılar: Sağlayıcı Çalışma Zamanı Hook'ları](/tr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekle (isteğe bağlı)">
    ### 5. Adım: Ek yetenekler ekle

    Bir sağlayıcı Plugin'i metin çıkarımının yanı sıra konuşma, gerçek zamanlı
    transkripsiyon, gerçek zamanlı ses, medya anlama, görüntü üretimi, video
    üretimi, web getirme ve web araması kaydedebilir. OpenClaw bunu bir
    **hibrit yetenek** Plugin'i olarak sınıflandırır; şirket Plugin'leri için
    önerilen kalıp budur (satıcı başına bir Plugin). Bkz.
    [İç Yapılar: Yetenek Sahipliği](/tr/plugins/architecture#capability-ownership-model).

    Her yeteneği, mevcut `api.registerProvider(...)` çağrınızın yanında
    `register(api)` içinde kaydedin. Yalnızca ihtiyacınız olan sekmeleri seçin:

    <Tabs>
      <Tab title="Speech (TTS)">
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

        Sağlayıcı HTTP hataları için `assertOkOrThrowProviderError(...)`
        kullanın; böylece Plugin'ler sınırlandırılmış hata gövdesi okumalarını,
        JSON hata ayrıştırmasını ve istek kimliği son eklerini paylaşır.
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` tercih edin - paylaşılan
        yardımcı proxy yakalamayı, yeniden bağlanma geri çekilmesini, kapanış boşaltmayı,
        hazır el sıkışmalarını, ses kuyruklamayı ve kapanış olayı tanılamasını yönetir.
        Plugin'iniz yalnızca üst akış olaylarını eşler.

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

        Çok parçalı sesi POST eden toplu STT sağlayıcıları
        `openclaw/plugin-sdk/provider-http` üzerinden
        `buildAudioTranscriptionFormData(...)` kullanmalıdır. Yardımcı,
        uyumlu transkripsiyon API'leri için M4A tarzı dosya adı gerektiren
        AAC yüklemeleri dahil olmak üzere yükleme dosya adlarını normalleştirir.
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

        `talk.catalog` tarayıcı ve yerel Talk istemcilerine geçerli modları,
        aktarımları, ses biçimlerini ve özellik bayraklarını sunabilsin diye
        `capabilities` bildirin. Bir aktarım, bir insanın asistan oynatmasını
        böldüğünü algılayabildiğinde ve sağlayıcı etkin ses yanıtını kısaltmayı
        veya temizlemeyi desteklediğinde `handleBargeIn` uygulayın.
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
      </Tab>
      <Tab title="Image and video generation">
        Video yetenekleri **mod duyarlı** bir yapı kullanır: `generate`,
        `imageToVideo` ve `videoToVideo`. `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` gibi düz toplu alanlar,
        dönüştürme modu desteğini veya devre dışı modları temiz biçimde
        duyurmak için yeterli değildir. Müzik üretimi de açık `generate` /
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

## ClawHub'da yayımlama

Sağlayıcı Plugin'leri, diğer tüm harici kod Plugin'leriyle aynı şekilde yayımlanır:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Burada eski yalnızca skill yayımlama takma adını kullanmayın; Plugin paketleri
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

## Katalog sırası başvurusu

`catalog.order`, kataloğunuzun yerleşik sağlayıcılara göre ne zaman birleştirileceğini denetler:

| Sıra      | Zaman         | Kullanım durumu                                |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | İlk geçiş     | Düz API anahtarlı sağlayıcılar                  |
| `profile` | simple sonrası | Kimlik doğrulama profillerine bağlı sağlayıcılar |
| `paired`  | profile sonrası | Birden çok ilişkili girdi sentezleme            |
| `late`    | Son geçiş     | Mevcut sağlayıcıları geçersiz kılma (çakışmada kazanır) |

## Sonraki adımlar

- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) - Plugin'iniz bir kanal da sağlıyorsa
- [SDK Runtime](/tr/plugins/sdk-runtime) - `api.runtime` yardımcıları (TTS, arama, alt aracı)
- [SDK Genel Bakış](/tr/plugins/sdk-overview) - tam alt yol içe aktarma başvurusu
- [Plugin İç Yapıları](/tr/plugins/architecture-internals#provider-runtime-hooks) - hook ayrıntıları ve paketlenmiş örnekler

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Kanal Plugin'leri oluşturma](/tr/plugins/sdk-channel-plugins)
