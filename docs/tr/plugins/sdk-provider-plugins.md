---
read_when:
    - Yeni bir model sağlayıcı plugin'i oluşturuyorsunuz
    - OpenClaw'a OpenAI uyumlu bir proxy veya özel bir LLM eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı kancalarını anlamanız gerekiyor
sidebarTitle: Provider Plugins
summary: OpenClaw için bir model sağlayıcı plugin'i oluşturma adım adım kılavuzu
title: Sağlayıcı Plugin'leri Oluşturma
x-i18n:
    generated_at: "2026-04-22T04:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99376d2abfc968429ed19f03451beb0f3597d57c703f2ce60c6c51220656e850
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Sağlayıcı Plugin'leri Oluşturma

Bu kılavuz, OpenClaw'a bir model sağlayıcı
(LLM) ekleyen bir sağlayıcı plugin'ini adım adım oluşturmayı anlatır. Sonunda model kataloğu,
API anahtarı kimlik doğrulaması ve dinamik model çözümlemesi olan bir sağlayıcınız olacak.

<Info>
  Daha önce hiç OpenClaw plugin'i oluşturmadıysanız, önce temel paket
  yapısı ve manifest kurulumu için [Başlangıç](/tr/plugins/building-plugins) belgesini okuyun.
</Info>

<Tip>
  Sağlayıcı plugin'leri, OpenClaw'ın normal çıkarım döngüsüne modeller ekler. Modelin
  ileti dizileri, Compaction veya araç
  olaylarının sahibi olan yerel bir agent daemon üzerinden çalışması gerekiyorsa, daemon protokol ayrıntılarını core içine koymak yerine
  sağlayıcıyı bir [agent harness](/tr/plugins/sdk-agent-harness) ile eşleştirin.
</Tip>

## Adım adım anlatım

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
      "description": "Acme AI model sağlayıcısı",
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
          "choiceLabel": "Acme AI API anahtarı",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API anahtarı"
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
    plugin çalışma zamanınızı yüklemeden kimlik bilgilerini algılayabilmesi için `providerAuthEnvVars` bildirir.
    Bir sağlayıcı varyantı başka bir sağlayıcı kimliğinin kimlik doğrulamasını yeniden kullanacaksa `providerAuthAliases` ekleyin. `modelSupport`
    isteğe bağlıdır ve çalışma zamanı kancaları henüz yokken OpenClaw'ın
    `acme-large` gibi kısa model kimliklerinden sağlayıcı plugin'inizi otomatik yüklemesini sağlar. Sağlayıcıyı
    ClawHub üzerinde yayımlarsanız `package.json` içindeki bu `openclaw.compat` ve `openclaw.build`
    alanları zorunludur.

  </Step>

  <Step title="Sağlayıcıyı kaydedin">
    En küçük bir sağlayıcı için `id`, `label`, `auth` ve `catalog` gerekir:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model sağlayıcısı",
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
              label: "Acme AI API anahtarı",
              hint: "Acme AI panonuzdan API anahtarı",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Acme AI API anahtarınızı girin",
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
    `openclaw onboard --acme-ai-api-key <key>` komutunu çalıştırabilir ve
    model olarak `acme-ai/acme-large` seçebilir.

    Üst akış sağlayıcısı OpenClaw'dan farklı kontrol belirteçleri kullanıyorsa, akış yolunu değiştirmek yerine
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

    `input`, taşımadan önce son sistem prompt'unu ve metin mesaj içeriğini yeniden yazar. `output`,
    OpenClaw kendi kontrol işaretleyicilerini veya kanal teslimini ayrıştırmadan önce
    assistant metin delta'larını ve son metni yeniden yazar.

    Yalnızca API anahtarı
    kimlik doğrulamasına sahip tek bir metin sağlayıcısı ve katalog destekli tek bir çalışma zamanı kaydeden paketlenmiş sağlayıcılar için,
    daha dar olan
    `defineSingleProviderPluginEntry(...)` yardımcısını tercih edin:

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
            hint: "Acme AI panonuzdan API anahtarı",
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

    `buildProvider`, OpenClaw gerçek
    sağlayıcı kimlik doğrulamasını çözümleyebildiğinde kullanılan canlı katalog yoludur.
    Sağlayıcıya özgü keşif yapabilir.
    Kimlik doğrulama yapılandırılmadan önce gösterilmesi güvenli çevrim dışı satırlar için yalnızca `buildStaticProvider` kullanın;
    kimlik bilgisi gerektirmemeli veya ağ isteği yapmamalıdır.
    OpenClaw'ın `models list --all` görünümü şu anda statik katalogları
    yalnızca paketlenmiş sağlayıcı plugin'leri için, boş yapılandırma, boş env ve agent/çalışma alanı yolları olmadan çalıştırır.

    Kimlik doğrulama akışınız onboarding sırasında ayrıca `models.providers.*`,
    takma adlar ve agent varsayılan modelini yamalamayı gerektiriyorsa,
    `openclaw/plugin-sdk/provider-onboard` içindeki hazır yardımcıları kullanın. En dar yardımcılar
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` ve
    `createModelCatalogPresetAppliers(...)` öğeleridir.

    Bir sağlayıcının yerel uç noktası normal
    `openai-completions` taşıması üzerinde akışlı kullanım bloklarını destekliyorsa, sağlayıcı kimliği kontrollerini sabit kodlamak yerine
    `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan katalog yardımcılarını tercih edin.
    `supportsNativeStreamingUsageCompat(...)` ve
    `applyProviderNativeStreamingUsageCompat(...)`, desteği
    uç nokta yetenek eşleminden algılar; böylece yerel Moonshot/DashScope tarzı uç noktalar bir plugin özel bir sağlayıcı kimliği kullanıyor olsa bile
    yine de katılabilir.

  </Step>

  <Step title="Dinamik model çözümlemesi ekleyin">
    Sağlayıcınız rastgele model kimliklerini kabul ediyorsa (proxy veya router gibi),
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

    Çözümleme ağ çağrısı gerektiriyorsa eşzamansız
    ısınma için `prepareDynamicModel` kullanın — tamamlandıktan sonra `resolveDynamicModel` yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı kancaları ekleyin (gerektiğinde)">
    Çoğu sağlayıcı için yalnızca `catalog` + `resolveDynamicModel` gerekir. Kancaları,
    sağlayıcınız gerektirdikçe aşamalı olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın replay/tool-compat
    ailelerini kapsar; bu yüzden plugin'lerin genelde her kancayı tek tek elle bağlamasına gerek kalmaz:

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

    | Aile | Bağladığı şey |
    | --- | --- |
    | `openai-compatible` | OpenAI uyumlu taşıma katmanları için paylaşılan OpenAI tarzı replay ilkesi; buna araç çağrısı kimliği temizleme, assistant-first sıralama düzeltmeleri ve taşıma katmanının ihtiyaç duyduğu durumlarda genel Gemini-turn doğrulaması dahildir |
    | `anthropic-by-model` | `modelId` ile seçilen Claude farkında replay ilkesi; böylece Anthropic-message taşıma katmanları Claude'a özgü düşünme bloğu temizliğini yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda alır |
    | `google-gemini` | Yerel Gemini replay ilkesi ile bootstrap replay temizleme ve etiketli reasoning-output modu |
    | `passthrough-gemini` | OpenAI uyumlu proxy taşıma katmanları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizleme; yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez |
    | `hybrid-anthropic-openai` | Tek plugin içinde Anthropic-message ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit ilke; isteğe bağlı yalnızca Claude düşünme bloğu bırakma davranışı Anthropic tarafında kapsamlı kalır |

    Gerçek paketlenmiş örnekler:

    - `google` ve `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` ve `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` ve `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` ve `zai`: `openai-compatible`

    Bugün kullanılabilen akış aileleri:

    | Aile | Bağladığı şey |
    | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini düşünme payload normalizasyonu |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo reasoning sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy reasoning kimlikleri eklenmiş düşünmeyi atlar |
    | `moonshot-thinking` | Yapılandırma + `/think` düzeyinden Moonshot ikili yerel düşünme payload eşlemesi |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax fast-mode model yeniden yazımı |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: attribution header'ları, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web search, reasoning-compat payload biçimlendirmesi ve Responses bağlam yönetimi |
    | `openrouter-thinking` | Proxy rotaları için OpenRouter reasoning sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak işlenir |
    | `tool-stream-default-on` | Z.AI gibi açıkça devre dışı bırakılmadıkça araç akışı isteyen sağlayıcılar için varsayılan açık `tool_stream` sarmalayıcısı |

    Gerçek paketlenmiş örnekler:

    - `google` ve `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` ve `minimax-portal`: `minimax-fast-mode`
    - `openai` ve `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared`, replay-family
    enum'unu ve bu ailelerin oluşturulduğu paylaşılan yardımcıları da dışa aktarır. Yaygın herkese açık
    dışa aktarımlar şunları içerir:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` ve
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)` gibi paylaşılan replay oluşturucuları
    - `sanitizeGoogleGeminiReplayHistory(...)`
      ve `resolveTaggedReasoningOutputMode()` gibi Gemini replay yardımcıları
    - `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` ve
      `normalizeNativeXaiModelId(...)` gibi uç nokta/model yardımcıları

    `openclaw/plugin-sdk/provider-stream`, hem aile oluşturucuyu hem de
    bu ailelerin yeniden kullandığı herkese açık sarmalayıcı yardımcılarını açığa çıkarır. Yaygın herkese açık dışa aktarımlar
    şunları içerir:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` ve
      `createCodexNativeWebSearchWrapper(...)` gibi paylaşılan OpenAI/Codex sarmalayıcıları
    - `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` ve `createMinimaxFastModeWrapper(...)` gibi paylaşılan proxy/sağlayıcı sarmalayıcıları

    Bazı akış yardımcıları bilerek sağlayıcı yerelinde kalır. Güncel paketlenmiş
    örnek: `@openclaw/anthropic-provider`,
    herkese açık `api.ts` /
    `contract-api.ts` seam'i üzerinden `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve
    daha alt seviye Anthropic sarmalayıcı oluşturucularını dışa aktarır. Bu yardımcılar
    Anthropic'e özgü kalır; çünkü aynı zamanda Claude OAuth beta işleme ve
    `context1m` geçitlemesini de kodlarlar.

    Diğer paketlenmiş sağlayıcılar da davranış aileler arasında temiz biçimde paylaşılmadığında
    taşıma katmanına özgü sarmalayıcıları yerelde tutar. Güncel örnek: paketlenmiş xAI plugin'i,
    `wrapStreamFn` içinde yerel xAI Responses biçimlendirmesini kendi içinde tutar; buna
    `/fast` takma ad yeniden yazımları, varsayılan `tool_stream`,
    desteklenmeyen strict-tool temizliği ve xAI'ye özgü reasoning-payload
    kaldırımı dahildir.

    `openclaw/plugin-sdk/provider-tools`, şu anda bir paylaşılan
    tool-schema ailesini ve paylaşılan şema/uyumluluk yardımcılarını açığa çıkarır:

    - `ProviderToolCompatFamily`, bugün paylaşılan aile envanterini belgelendirir.
    - `buildProviderToolCompatFamilyHooks("gemini")`, Gemini-safe araç şemalarına ihtiyaç duyan sağlayıcılar için Gemini şema
      temizliği + tanılamayı bağlar.
    - `normalizeGeminiToolSchemas(...)` ve `inspectGeminiToolSchemas(...)`,
      alttaki herkese açık Gemini şema yardımcılarıdır.
    - `resolveXaiModelCompatPatch()`, paketlenmiş xAI uyumluluk yamasını döndürür:
      `toolSchemaProfile: "xai"`, desteklenmeyen şema anahtar sözcükleri, yerel
      `web_search` desteği ve HTML entity araç çağrısı argüman çözümleme.
    - `applyXaiModelCompat(model)`, aynı xAI uyumluluk yamasını
      çözümlenmiş bir modele runner'a ulaşmadan önce uygular.

    Gerçek paketlenmiş örnek: xAI plugin'i,
    bu uyumluluk meta verisini core içine xAI kurallarını sabit kodlamak yerine sağlayıcının sahipliğinde tutmak için `normalizeResolvedModel` ile birlikte
    `contributeResolvedModelCompat` kullanır.

    Aynı paket kökü deseni diğer paketlenmiş sağlayıcıları da destekler:

    - `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucuları,
      varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır
    - `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucuyu
      ve onboarding/yapılandırma yardımcılarını dışa aktarır

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
      <Tab title="Özel header'lar">
        Özel istek header'ları veya gövde değişiklikleri gerektiren sağlayıcılar için:

        ```typescript
        // wrapStreamFn, ctx.streamFn'den türetilmiş bir StreamFn döndürür
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
        Genel HTTP veya WebSocket taşıma katmanlarında yerel istek/oturum header'ları ya da meta verileri gereken sağlayıcılar için:

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

    <Accordion title="Kullanılabilen tüm sağlayıcı kancaları">
      OpenClaw kancaları şu sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır:

      | # | Kanca | Ne zaman kullanılır |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya base URL varsayılanları |
      | 2 | `applyConfigDefaults` | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel varsayılanlar |
      | 3 | `normalizeModelId` | Aramadan önce eski/preview model kimliği takma adı temizliği |
      | 4 | `normalizeTransport` | Genel model oluşturmasından önce sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalize et |
      | 6 | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel streaming-usage uyumluluk yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcıya ait env-marker kimlik doğrulama çözümlemesi |
      | 8 | `resolveSyntheticAuth` | Yerel/self-hosted veya yapılandırma destekli sentetik kimlik doğrulama |
      | 9 | `shouldDeferSyntheticProfileAuth` | Sentetik saklanmış profil yer tutucularını env/yapılandırma kimlik doğrulamasının arkasına al |
      | 10 | `resolveDynamicModel` | Rastgele üst akış model kimliklerini kabul et |
      | 11 | `prepareDynamicModel` | Çözümlemeden önce eşzamansız meta veri getirme |
      | 12 | `normalizeResolvedModel` | Runner'dan önce taşıma yeniden yazımları |

    Çalışma zamanı geri dönüş notları:

    - `normalizeConfig`, önce eşleşen sağlayıcıyı, sonra diğer
      kanca yetenekli sağlayıcı plugin'lerini, gerçekten yapılandırmayı değiştirene kadar kontrol eder.
      Hiçbir sağlayıcı kancası desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa,
      paketlenmiş Google yapılandırma normalizer'ı yine de uygulanır.
    - `resolveConfigApiKey`, açığa çıkarılmışsa sağlayıcı kancasını kullanır. Paketlenmiş
      `amazon-bedrock` yolu ayrıca burada yerleşik bir AWS env-marker çözümleyicisine sahiptir;
      Bedrock çalışma zamanı kimlik doğrulaması yine de AWS SDK varsayılan
      zincirini kullanıyor olsa da.
      | 13 | `contributeResolvedModelCompat` | Başka bir uyumlu taşıma katmanı arkasındaki vendor modelleri için uyumluluk bayrakları |
      | 14 | `capabilities` | Eski statik yetenek torbası; yalnızca uyumluluk |
      | 15 | `normalizeToolSchemas` | Kayıttan önce sağlayıcıya ait tool-schema temizliği |
      | 16 | `inspectToolSchemas` | Sağlayıcıya ait tool-schema tanılaması |
      | 17 | `resolveReasoningOutputMode` | Etiketli ile yerel reasoning-output sözleşmesi |
      | 18 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 19 | `createStreamFn` | Tamamen özel StreamFn taşıma katmanı |
      | 20 | `wrapStreamFn` | Normal akış yolunda özel header/gövde sarmalayıcıları |
      | 21 | `resolveTransportTurnState` | Yerel tur başına header'lar/meta veriler |
      | 22 | `resolveWebSocketSessionPolicy` | Yerel WS oturum header'ları/bekleme süresi |
      | 23 | `formatApiKey` | Özel çalışma zamanı belirteç biçimi |
      | 24 | `refreshOAuth` | Özel OAuth yenileme |
      | 25 | `buildAuthDoctorHint` | Kimlik doğrulama onarım yönlendirmesi |
      | 26 | `matchesContextOverflowError` | Sağlayıcıya ait taşma algılama |
      | 27 | `classifyFailoverReason` | Sağlayıcıya ait hız sınırı/aşırı yük sınıflandırması |
      | 28 | `isCacheTtlEligible` | Prompt önbelleği TTL geçitlemesi |
      | 29 | `buildMissingAuthMessage` | Özel eksik kimlik doğrulama ipucu |
      | 30 | `suppressBuiltInModel` | Eski üst akış satırlarını gizle |
      | 31 | `augmentModelCatalog` | Sentetik ileri uyumluluk satırları |
      | 32 | `resolveThinkingProfile` | Modele özgü `/think` seçenek kümesi |
      | 33 | `isBinaryThinking` | İkili düşünme açık/kapalı uyumluluğu |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning desteği uyumluluğu |
      | 35 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi uyumluluğu |
      | 36 | `isModernModelRef` | Canlı/smoke model eşleştirme |
      | 37 | `prepareRuntimeAuth` | Çıkarımdan önce belirteç değişimi |
      | 38 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırması |
      | 39 | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | 40 | `createEmbeddingProvider` | Bellek/arama için sağlayıcıya ait embedding bağdaştırıcısı |
      | 41 | `buildReplayPolicy` | Özel transcript replay/Compaction ilkesi |
      | 42 | `sanitizeReplayHistory` | Genel temizlemeden sonra sağlayıcıya özgü replay yeniden yazımları |
      | 43 | `validateReplayTurns` | Gömülü runner'dan önce strict replay-turn doğrulaması |
      | 44 | `onModelSelected` | Seçim sonrası geri çağırım (ör. telemetri) |

      Prompt ayarlama notu:

      - `resolveSystemPromptContribution`, bir sağlayıcının bir model ailesi için önbellek farkında
        sistem prompt yönlendirmesi eklemesine izin verir. Davranış tek bir sağlayıcı/model
        ailesine aitse ve kararlı/dinamik önbellek ayrımını koruması gerekiyorsa
        `before_prompt_build` yerine bunu tercih edin.

      Ayrıntılı açıklamalar ve gerçek dünya örnekleri için
      bkz. [İç Yapılar: Sağlayıcı Çalışma Zamanı Kancaları](/tr/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekleyin (isteğe bağlı)">
    <a id="step-5-add-extra-capabilities"></a>
    Bir sağlayıcı plugin'i, metin çıkarımının yanında konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
    ses, medya anlama, görsel oluşturma, video oluşturma, web getirme
    ve web arama kaydedebilir:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM verisi */),
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
        describeImage: async (req) => ({ text: "Bir fotoğraf..." }),
        transcribeAudio: async (req) => ({ text: "Döküm..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* görsel sonucu */ }),
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
        hint: "Sayfaları Acme'in rendering backend'i üzerinden getir.",
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
          description: "Bir sayfayı Acme Fetch üzerinden getir.",
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
    şirket plugin'leri için önerilen desendir (satıcı başına bir plugin). Bkz.
    [İç Yapılar: Yetenek Sahipliği](/tr/plugins/architecture#capability-ownership-model).

    Video oluşturma için yukarıda gösterilen kip farkında yetenek biçimini tercih edin:
    `generate`, `imageToVideo` ve `videoToVideo`. `maxInputImages`, `maxInputVideos` ve `maxDurationSeconds` gibi
    düz toplu alanlar,
    dönüştürme kipi desteğini veya devre dışı kipleri temiz biçimde duyurmak için
    yeterli değildir.

    Müzik oluşturma sağlayıcıları da aynı deseni izlemelidir:
    yalnızca prompt ile oluşturma için `generate` ve başvuru görseli tabanlı
    oluşturma için `edit`. `maxInputImages`,
    `supportsLyrics` ve `supportsFormat` gibi düz toplu alanlar düzenleme
    desteğini duyurmak için yeterli değildir; açık `generate` / `edit` blokları
    beklenen sözleşmedir.

  </Step>

  <Step title="Test">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Sağlayıcı yapılandırma nesnenizi index.ts'ten veya özel bir dosyadan dışa aktarın
    import { acmeProvider } from "./provider.js";

    describe("acme-ai sağlayıcısı", () => {
      it("dinamik modelleri çözümler", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("anahtar mevcut olduğunda katalog döndürür", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("anahtar yoksa null katalog döndürür", async () => {
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

Sağlayıcı plugin'leri, diğer tüm harici kod plugin'leriyle aynı şekilde yayımlanır:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Burada eski yalnızca skill yayımlama takma adını kullanmayın; plugin paketleri
`clawhub package publish` kullanmalıdır.

## Dosya yapısı

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers meta verisi
├── openclaw.plugin.json      # Sağlayıcı kimlik doğrulama meta verili manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testler
    └── usage.ts              # Kullanım uç noktası (isteğe bağlı)
```

## Katalog sırası başvurusu

`catalog.order`, kataloğunuzun yerleşik
sağlayıcılara göre ne zaman birleştirileceğini denetler:

| Sıra      | Ne zaman     | Kullanım durumu                                |
| --------- | ------------ | ---------------------------------------------- |
| `simple`  | İlk geçiş    | Düz API anahtarlı sağlayıcılar                 |
| `profile` | `simple` sonrası | Kimlik doğrulama profilleriyle geçitlenen sağlayıcılar |
| `paired`  | `profile` sonrası | Birden çok ilişkili girdiyi sentezleme        |
| `late`    | Son geçiş    | Mevcut sağlayıcıları geçersiz kılma (çakışmada kazanır) |

## Sonraki adımlar

- [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — plugin'iniz ayrıca bir kanal da sağlıyorsa
- [SDK Runtime](/tr/plugins/sdk-runtime) — `api.runtime` yardımcıları (TTS, arama, alt agent)
- [SDK Genel Bakışı](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Plugin İç Yapıları](/tr/plugins/architecture#provider-runtime-hooks) — kanca ayrıntıları ve paketlenmiş örnekler
