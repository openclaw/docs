---
read_when:
    - Yeni bir model sağlayıcı Plugin oluşturuyorsunuz
    - OpenClaw'a OpenAI uyumlu bir proxy veya özel LLM eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı kancalarını anlamanız gerekir
sidebarTitle: Provider plugins
summary: OpenClaw için model sağlayıcı Plugin oluşturmaya yönelik adım adım kılavuz
title: Sağlayıcı Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-04-30T09:37:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Bu kılavuz, OpenClaw'a bir model sağlayıcısı (LLM) ekleyen bir provider Plugin oluşturmayı adım adım gösterir. Sonunda model kataloğu, API anahtarı kimlik doğrulaması ve dinamik model çözümlemesi olan bir sağlayıcınız olacak.

<Info>
  Daha önce hiç OpenClaw Plugin oluşturmadıysanız, temel paket yapısı ve manifest kurulumu için önce
  [Başlarken](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

<Tip>
  Provider Plugin'ler, OpenClaw'ın normal çıkarım döngüsüne modeller ekler. Modelin iş parçacıklarını, Compaction'ı veya araç olaylarını sahiplenen yerel bir agent daemon üzerinden çalışması gerekiyorsa, daemon protokolü ayrıntılarını core'a koymak yerine sağlayıcıyı bir [agent harness](/tr/plugins/sdk-agent-harness) ile eşleştirin.
</Tip>

## İzlenecek yol

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

    Manifest, OpenClaw'ın Plugin çalışma zamanınızı yüklemeden kimlik bilgilerini algılayabilmesi için `providerAuthEnvVars` bildirir. Bir sağlayıcı varyantı başka bir sağlayıcı kimliğinin kimlik doğrulamasını yeniden kullanmalıysa `providerAuthAliases` ekleyin. `modelSupport` isteğe bağlıdır ve çalışma zamanı hook'ları var olmadan önce OpenClaw'ın sağlayıcı Plugin'inizi `acme-large` gibi kısa model kimliklerinden otomatik yüklemesini sağlar. Sağlayıcıyı ClawHub üzerinde yayımlarsanız, bu `openclaw.compat` ve `openclaw.build` alanları `package.json` içinde zorunludur.

  </Step>

  <Step title="Sağlayıcıyı kaydedin">
    Minimal bir sağlayıcının `id`, `label`, `auth` ve `catalog` alanlarına ihtiyacı vardır:

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
    `openclaw onboard --acme-ai-api-key <key>` çalıştırabilir ve modelleri olarak
    `acme-ai/acme-large` seçebilir.

    Upstream sağlayıcı OpenClaw'dan farklı denetim token'ları kullanıyorsa, akış yolunu değiştirmek yerine küçük bir çift yönlü metin dönüşümü ekleyin:

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

    `input`, taşıma öncesinde nihai sistem istemini ve metin mesajı içeriğini yeniden yazar. `output`, OpenClaw kendi denetim işaretleyicilerini veya kanal teslimini ayrıştırmadan önce asistan metin deltalarını ve nihai metni yeniden yazar.

    Yalnızca API anahtarı kimlik doğrulaması ve tek bir katalog destekli çalışma zamanı ile bir metin sağlayıcısı kaydeden paketli sağlayıcılar için daha dar kapsamlı
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

    `buildProvider`, OpenClaw gerçek sağlayıcı kimlik doğrulamasını çözümleyebildiğinde kullanılan canlı katalog yoludur. Sağlayıcıya özel keşif yapabilir. `buildStaticProvider` öğesini yalnızca kimlik doğrulama yapılandırılmadan önce gösterilmesi güvenli olan çevrimdışı satırlar için kullanın; kimlik bilgileri gerektirmemeli veya ağ isteği yapmamalıdır. OpenClaw'ın `models list --all` görünümü şu anda statik katalogları yalnızca paketli provider Plugin'ler için, boş yapılandırma, boş env ve agent/çalışma alanı yolları olmadan çalıştırır.

    Kimlik doğrulama akışınızın onboarding sırasında `models.providers.*`, takma adlar ve agent varsayılan modelini de yamaması gerekiyorsa, `openclaw/plugin-sdk/provider-onboard` içindeki preset yardımcılarını kullanın. En dar yardımcılar
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` ve
    `createModelCatalogPresetAppliers(...)` öğeleridir.

    Bir sağlayıcının yerel endpoint'i normal `openai-completions` taşıması üzerinde akışlı kullanım bloklarını destekliyorsa, sağlayıcı kimliği denetimlerini sabit kodlamak yerine `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan katalog yardımcılarını tercih edin. `supportsNativeStreamingUsageCompat(...)` ve
    `applyProviderNativeStreamingUsageCompat(...)`, desteği endpoint yetenek haritasından algılar; bu nedenle yerel Moonshot/DashScope tarzı endpoint'ler, bir Plugin özel bir sağlayıcı kimliği kullansa bile yine de etkinleştirilir.

  </Step>

  <Step title="Dinamik model çözümlemesi ekleyin">
    Sağlayıcınız rastgele model kimliklerini kabul ediyorsa (proxy veya router gibi),
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

    Çözümleme bir ağ çağrısı gerektiriyorsa, async warm-up için `prepareDynamicModel` kullanın — tamamlandıktan sonra `resolveDynamicModel` yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı hook'ları ekleyin (gerektiğinde)">
    Çoğu sağlayıcının yalnızca `catalog` + `resolveDynamicModel` öğelerine ihtiyacı vardır. Sağlayıcınız gerektirdikçe hook'ları kademeli olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın replay/tool-compat ailelerini kapsar; bu nedenle Plugin'lerin genellikle her hook'u tek tek elle bağlaması gerekmez:

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

    | Aile | Neyi bağlar | Paketli örnekler |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI uyumlu taşımalar için, tool-call-id temizliği, assistant-first sıralama düzeltmeleri ve taşımanın ihtiyaç duyduğu yerlerde genel Gemini-turn doğrulaması dahil paylaşılan OpenAI tarzı replay policy | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` tarafından seçilen Claude farkındalıklı replay policy; böylece Anthropic-message taşımaları, yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda Claude'a özel thinking-block temizliği alır | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Yerel Gemini replay policy ile bootstrap replay temizliği ve etiketli reasoning-output modu | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI uyumlu proxy taşımaları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizliği; yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Tek bir Plugin içinde Anthropic-message ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit policy; isteğe bağlı Claude-only thinking-block bırakma, Anthropic tarafıyla sınırlı kalır | `minimax` |

    Bugün kullanılabilen stream aileleri:

    | Aile | Neyi bağlar | Birlikte gelen örnekler |
    | --- | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini düşünme yükü normalleştirmesi | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo akıl yürütme sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy akıl yürütme kimlikleri enjekte edilen düşünmeyi atlar | `kilocode` |
    | `moonshot-thinking` | Yapılandırmadan + `/think` düzeyinden Moonshot ikili yerel düşünme yükü eşlemesi | `moonshot` |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax hızlı mod model yeniden yazımı | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: ilişkilendirme üstbilgileri, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması, akıl yürütme uyumluluğu yük şekillendirmesi ve Responses bağlam yönetimi | `openai`, `openai-codex` |
    | `openrouter-thinking` | Proxy rotaları için OpenRouter akıl yürütme sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak işlenir | `openrouter` |
    | `tool-stream-default-on` | Açıkça devre dışı bırakılmadığı sürece araç akışı isteyen Z.AI gibi sağlayıcılar için varsayılan olarak açık `tool_stream` sarmalayıcısı | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Her aile oluşturucu, aynı paketten dışa aktarılan daha düşük düzeyli herkese açık yardımcılarla oluşturulur; bir sağlayıcının ortak kalıbın dışına çıkması gerektiğinde bunları kullanabilirsiniz:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` ve ham yeniden oynatma oluşturucuları (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Ayrıca Gemini yeniden oynatma yardımcılarını (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ve uç nokta/model yardımcılarını (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`) dışa aktarır.
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`; ayrıca paylaşılan OpenAI/Codex sarmalayıcıları (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI uyumlu sarmalayıcısı (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages düşünme ön doldurma temizliği (`createAnthropicThinkingPrefillPayloadWrapper`) ve paylaşılan proxy/sağlayıcı sarmalayıcıları (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, temel Gemini şema yardımcıları (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) ve xAI uyumluluk yardımcıları (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Birlikte gelen xAI Plugin'i, xAI kurallarını sağlayıcıya ait tutmak için bunlarla birlikte `normalizeResolvedModel` + `contributeResolvedModelCompat` kullanır.

      Bazı akış yardımcıları özellikle sağlayıcı yerelinde kalır. `@openclaw/anthropic-provider`, Claude OAuth beta işlemeyi ve `context1m` kapısını kodladıkları için `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha düşük düzeyli Anthropic sarmalayıcı oluşturucularını kendi herkese açık `api.ts` / `contract-api.ts` sınırında tutar. Benzer şekilde xAI Plugin'i, yerel xAI Responses şekillendirmesini kendi `wrapStreamFn` içinde tutar (`/fast` takma adları, varsayılan `tool_stream`, desteklenmeyen katı araç temizliği, xAI'ye özgü akıl yürütme yükü kaldırma).

      Aynı paket kökü kalıbı `@openclaw/openai-provider` (sağlayıcı oluşturucuları, varsayılan model yardımcıları, gerçek zamanlı sağlayıcı oluşturucuları) ve `@openclaw/openrouter-provider` (sağlayıcı oluşturucu ve işe başlatma/yapılandırma yardımcıları) için de temel sağlar.
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
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
      <Tab title="Custom headers">
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
      <Tab title="Native transport identity">
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
      <Tab title="Usage and billing">
        Kullanım/faturalama verisi sunan sağlayıcılar için:

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

    <Accordion title="All available provider hooks">
      OpenClaw hook'ları bu sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır:
      OpenClaw'ın artık çağırmadığı, `ProviderPlugin.capabilities` ve
      `suppressBuiltInModel` gibi yalnızca uyumluluk amaçlı sağlayıcı alanları
      burada listelenmez.

      | # | Hook | Ne zaman kullanılır |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya temel URL varsayılanları |
      | 2 | `applyConfigDefaults` | Yapılandırma somutlaştırması sırasında sağlayıcıya ait küresel varsayılanlar |
      | 3 | `normalizeModelId` | Aramadan önce eski/önizleme model kimliği takma adı temizliği |
      | 4 | `normalizeTransport` | Genel model montajından önce sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalleştir |
      | 6 | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel akış kullanımı uyumluluk yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcıya ait env işaretçisi kimlik doğrulama çözümlemesi |
      | 8 | `resolveSyntheticAuth` | Yerel/kendi barındırılan veya yapılandırma destekli sentetik kimlik doğrulama |
      | 9 | `shouldDeferSyntheticProfileAuth` | Env/yapılandırma kimlik doğrulamasının arkasında sentetik depolanmış profil yer tutucularını düşür |
      | 10 | `resolveDynamicModel` | Rastgele upstream model kimliklerini kabul et |
      | 11 | `prepareDynamicModel` | Çözümlemeden önce eşzamansız meta veri getirme |
      | 12 | `normalizeResolvedModel` | Çalıştırıcıdan önce aktarım yeniden yazımları |
      | 13 | `contributeResolvedModelCompat` | Başka bir uyumlu aktarımın arkasındaki satıcı modelleri için uyumluluk bayrakları |
      | 14 | `normalizeToolSchemas` | Kayıttan önce sağlayıcıya ait araç şeması temizliği |
      | 15 | `inspectToolSchemas` | Sağlayıcıya ait araç şeması tanıları |
      | 16 | `resolveReasoningOutputMode` | Etiketli ve yerel akıl yürütme çıktısı sözleşmesi |
      | 17 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 18 | `createStreamFn` | Tamamen özel StreamFn aktarımı |
      | 19 | `wrapStreamFn` | Normal akış yolunda özel üstbilgi/gövde sarmalayıcıları |
      | 20 | `resolveTransportTurnState` | Yerel dönüş başına üstbilgiler/meta veriler |
      | 21 | `resolveWebSocketSessionPolicy` | Yerel WS oturum üstbilgileri/soğuma süresi |
      | 22 | `formatApiKey` | Özel çalışma zamanı belirteç şekli |
      | 23 | `refreshOAuth` | Özel OAuth yenileme |
      | 24 | `buildAuthDoctorHint` | Kimlik doğrulama onarım rehberliği |
      | 25 | `matchesContextOverflowError` | Sağlayıcıya ait taşma algılama |
      | 26 | `classifyFailoverReason` | Sağlayıcıya ait hız sınırı/aşırı yük sınıflandırması |
      | 27 | `isCacheTtlEligible` | İstem önbelleği TTL kapısı |
      | 28 | `buildMissingAuthMessage` | Özel eksik kimlik doğrulama ipucu |
      | 29 | `augmentModelCatalog` | Sentetik ileri uyumluluk satırları |
      | 30 | `resolveThinkingProfile` | Modele özgü `/think` seçenek kümesi |
      | 31 | `isBinaryThinking` | İkili düşünme açık/kapalı uyumluluğu |
      | 32 | `supportsXHighThinking` | `xhigh` akıl yürütme desteği uyumluluğu |
      | 33 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi uyumluluğu |
      | 34 | `isModernModelRef` | Canlı/smoke model eşleştirme |
      | 35 | `prepareRuntimeAuth` | Çıkarımdan önce belirteç değişimi |
      | 36 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırma |
      | 37 | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | 38 | `createEmbeddingProvider` | Bellek/arama için sağlayıcıya ait embedding bağdaştırıcısı |
      | 39 | `buildReplayPolicy` | Özel konuşma metni yeniden oynatma/Compaction ilkesi |
      | 40 | `sanitizeReplayHistory` | Genel temizlikten sonra sağlayıcıya özgü yeniden oynatma yeniden yazımları |
      | 41 | `validateReplayTurns` | Gömülü çalıştırıcıdan önce katı yeniden oynatma dönüşü doğrulaması |
      | 42 | `onModelSelected` | Seçim sonrası geri çağırma (örn. telemetri) |

      Çalışma zamanı geri dönüş notları:

      - `normalizeConfig` önce eşleşen sağlayıcıyı, ardından yapılandırmayı gerçekten değiştirene kadar hook destekli diğer sağlayıcı Plugin'lerini kontrol eder. Hiçbir sağlayıcı hook'u desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa, birlikte gelen Google yapılandırma normalleştiricisi yine de uygulanır.
      - `resolveConfigApiKey`, sunulduğunda sağlayıcı hook'unu kullanır. Birlikte gelen `amazon-bedrock` yolunda burada yerleşik bir AWS env işaretçisi çözümleyicisi de vardır; Bedrock çalışma zamanı kimlik doğrulamasının kendisi hâlâ AWS SDK varsayılan zincirini kullansa bile.
      - `resolveSystemPromptContribution`, bir sağlayıcının bir model ailesi için önbellek duyarlı sistem istemi rehberliği enjekte etmesine olanak tanır. Davranış tek bir sağlayıcı/model ailesine ait olduğunda ve kararlı/dinamik önbellek ayrımını koruması gerektiğinde bunu `before_prompt_build` yerine tercih edin.

      Ayrıntılı açıklamalar ve gerçek dünya örnekleri için bkz. [İç Yapı: Sağlayıcı Çalışma Zamanı Hook'ları](/tr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    Bir sağlayıcı Plugin'i, metin çıkarımının yanı sıra konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
    ses, medya anlama, görüntü oluşturma, video oluşturma, web getirme
    ve web araması kaydedebilir. OpenClaw bunu bir
    **hibrit yetenek** Plugin'i olarak sınıflandırır; şirket Plugin'leri
    için önerilen kalıp budur (satıcı başına bir Plugin). Bkz.
    [İç Yapı: Yetenek Sahipliği](/tr/plugins/architecture#capability-ownership-model).

    Her yeteneği mevcut `api.registerProvider(...)` çağrınızla birlikte `register(api)` içinde kaydedin. Yalnızca ihtiyacınız olan sekmeleri seçin:

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
        plugin’ler sınırlı hata gövdesi okumalarını, JSON hata ayrıştırmayı ve
        istek kimliği soneklerini paylaşır.
      </Tab>
      <Tab title="Gerçek zamanlı transkripsiyon">
        `createRealtimeTranscriptionWebSocketSession(...)` tercih edin — paylaşılan
        yardımcı proxy yakalamayı, yeniden bağlanma geri çekilmesini, kapanış boşaltmayı, hazır
        el sıkışmalarını, ses kuyruğa almayı ve kapanış olayı tanılamalarını yönetir. Plugin’iniz
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

        Çok parçalı ses POST eden toplu STT sağlayıcıları,
        `openclaw/plugin-sdk/provider-http` içindeki
        `buildAudioTranscriptionFormData(...)` işlevini kullanmalıdır. Yardımcı,
        uyumlu transkripsiyon API’leri için M4A tarzı dosya adına ihtiyaç duyan
        AAC yüklemeleri de dahil olmak üzere yükleme dosya adlarını normalleştirir.
      </Tab>
      <Tab title="Gerçek zamanlı ses">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
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
      <Tab title="Görüntü ve video üretimi">
        Video yetenekleri **mod farkında** bir şekil kullanır: `generate`,
        `imageToVideo` ve `videoToVideo`. `maxInputImages` / `maxInputVideos` /
        `maxDurationSeconds` gibi düz toplu alanlar, dönüştürme modu desteğini
        veya devre dışı modları temiz biçimde duyurmak için yeterli değildir.
        Müzik üretimi de açık `generate` / `edit` bloklarıyla aynı örüntüyü izler.

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

  <Step title="Test">
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

## ClawHub’a yayımlama

Sağlayıcı plugin’leri, diğer tüm harici kod plugin’leriyle aynı şekilde yayımlanır:

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

`catalog.order`, kataloğunuzun yerleşik sağlayıcılara göre ne zaman birleştirileceğini
denetler:

| Sıra      | Ne zaman     | Kullanım durumu                               |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | İlk geçiş    | Düz API anahtarı sağlayıcıları                |
| `profile` | simple sonrası | Kimlik doğrulama profillerine bağlı sağlayıcılar |
| `paired`  | profile sonrası | Birden fazla ilişkili girdiyi sentezleme      |
| `late`    | Son geçiş    | Mevcut sağlayıcıları geçersiz kılma (çakışmada kazanır) |

## Sonraki adımlar

- [Kanal Plugin’leri](/tr/plugins/sdk-channel-plugins) — plugin’iniz ayrıca bir kanal sağlıyorsa
- [SDK Runtime](/tr/plugins/sdk-runtime) — `api.runtime` yardımcıları (TTS, arama, alt aracı)
- [SDK Genel Bakış](/tr/plugins/sdk-overview) — tam alt yol içe aktarma referansı
- [Plugin İç Yapısı](/tr/plugins/architecture-internals#provider-runtime-hooks) — hook ayrıntıları ve paketli örnekler

## İlgili

- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Kanal plugin’leri oluşturma](/tr/plugins/sdk-channel-plugins)
