---
read_when:
    - Yeni bir model sağlayıcı plugin'i oluşturuyorsunuz
    - OpenClaw'a OpenAI uyumlu bir proxy veya özel bir LLM eklemek istiyorsunuz
    - Sağlayıcı kimlik doğrulamasını, katalogları ve çalışma zamanı hook'larını anlamanız gerekiyor
sidebarTitle: Provider Plugins
summary: OpenClaw için model sağlayıcı plugin'i oluşturmaya yönelik adım adım rehber
title: Sağlayıcı Plugin'leri Oluşturma
x-i18n:
    generated_at: "2026-04-11T02:46:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d7c5da6556dc3d9673a31142ff65eb67ddc97fc0c1a6f4826a2c7693ecd5e3
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Sağlayıcı Plugin'leri Oluşturma

Bu rehber, OpenClaw'a bir model sağlayıcısı
(LLM) ekleyen bir sağlayıcı plugin'i oluşturmayı adım adım açıklar. Rehberin sonunda model kataloğu,
API anahtarı kimlik doğrulaması ve dinamik model çözümleme içeren bir sağlayıcınız olacak.

<Info>
  Daha önce hiç OpenClaw plugin'i oluşturmadıysanız, temel paket
  yapısı ve manifest kurulumu için önce [Getting Started](/tr/plugins/building-plugins) bölümünü okuyun.
</Info>

<Tip>
  Sağlayıcı plugin'leri, OpenClaw'un normal inference döngüsüne modeller ekler. Modelin
  thread'leri, sıkıştırmayı veya araç olaylarını yöneten yerel bir agent daemon üzerinden
  çalışması gerekiyorsa, daemon protokol ayrıntılarını core'a koymak yerine
  sağlayıcıyı bir [agent harness](/tr/plugins/sdk-agent-harness) ile eşleştirin.
</Tip>

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

    Manifest, OpenClaw'un plugin çalışma zamanınızı yüklemeden
    kimlik bilgilerini algılayabilmesi için `providerAuthEnvVars` tanımlar. Bir sağlayıcı varyantının
    başka bir sağlayıcı kimliğinin kimlik doğrulamasını yeniden kullanması gerekiyorsa `providerAuthAliases` ekleyin. `modelSupport`
    isteğe bağlıdır ve OpenClaw'un çalışma zamanı hook'ları oluşmadan önce `acme-large` gibi kısa
    model kimliklerinden sağlayıcı plugin'inizi otomatik yüklemesine olanak tanır. Sağlayıcıyı
    ClawHub üzerinde yayımlıyorsanız, bu `openclaw.compat` ve `openclaw.build` alanları
    `package.json` içinde zorunludur.

  </Step>

  <Step title="Sağlayıcıyı kaydetme">
    Minimum bir sağlayıcının `id`, `label`, `auth` ve `catalog` alanlarına ihtiyacı vardır:

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
    `openclaw onboard --acme-ai-api-key <key>` çalıştırabilir ve
    modelleri olarak `acme-ai/acme-large` seçebilir.

    Üst akış sağlayıcısı OpenClaw'dan farklı kontrol token'ları kullanıyorsa, akış yolunu
    değiştirmek yerine küçük bir çift yönlü metin dönüşümü ekleyin:

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

    `input`, son sistem istemini ve metin mesaj içeriğini taşıma öncesinde yeniden yazar.
    `output`, assistant metin delta'larını ve son metni, OpenClaw kendi
    kontrol işaretlerini ayrıştırmadan veya kanal teslimi yapmadan önce yeniden yazar.

    Yalnızca API anahtarı kimlik doğrulamasıyla bir metin sağlayıcısı ve tek katalog destekli çalışma zamanı kaydeden
    paketlenmiş sağlayıcılar için daha dar kapsamlı
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
    takma adları ve agent varsayılan modelini de yamalaması gerekiyorsa
    `openclaw/plugin-sdk/provider-onboard` içindeki preset yardımcılarını kullanın. En dar kapsamlı yardımcılar
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` ve
    `createModelCatalogPresetAppliers(...)` yardımcılarıdır.

    Bir sağlayıcının yerel uç noktası normal `openai-completions` aktarımında
    akışlı kullanım bloklarını destekliyorsa, sağlayıcı kimliği denetimlerini sabit kodlamak yerine
    `openclaw/plugin-sdk/provider-catalog-shared` içindeki paylaşılan katalog yardımcılarını tercih edin.
    `supportsNativeStreamingUsageCompat(...)` ve
    `applyProviderNativeStreamingUsageCompat(...)`, desteği uç nokta yetenek haritasından algılar; böylece
    yerel Moonshot/DashScope tarzı uç noktalar, plugin özel bir sağlayıcı kimliği kullansa bile
    katılabilir.

  </Step>

  <Step title="Dinamik model çözümleme ekleme">
    Sağlayıcınız keyfi model kimliklerini kabul ediyorsa (proxy veya router gibi),
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
    ön ısıtma için `prepareDynamicModel` kullanın — tamamlandıktan sonra `resolveDynamicModel` yeniden çalışır.

  </Step>

  <Step title="Çalışma zamanı hook'ları ekleme (gerektikçe)">
    Çoğu sağlayıcının yalnızca `catalog` + `resolveDynamicModel` alanına ihtiyacı vardır. Hook'ları
    sağlayıcınız gerektirdikçe kademeli olarak ekleyin.

    Paylaşılan yardımcı oluşturucular artık en yaygın replay/tool-compat
    ailelerini kapsıyor, bu nedenle plugin'lerin genellikle her hook'u tek tek elle bağlaması gerekmez:

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

    | Aile | Bağladıkları |
    | --- | --- |
    | `openai-compatible` | OpenAI uyumlu aktarımlar için paylaşılan OpenAI tarzı replay ilkesi; buna araç çağrısı kimliği temizliği, assistant-first sıralama düzeltmeleri ve aktarımın ihtiyaç duyduğu yerlerde genel Gemini tur doğrulaması dahildir |
    | `anthropic-by-model` | `modelId` tarafından seçilen Claude farkındalıklı replay ilkesi; böylece Anthropic message aktarımları yalnızca çözümlenen model gerçekten bir Claude kimliği olduğunda Claude'a özgü thinking-block temizliği alır |
    | `google-gemini` | Yerel Gemini replay ilkesi ile bootstrap replay temizliği ve etiketli reasoning-output modu |
    | `passthrough-gemini` | OpenAI uyumlu proxy aktarımları üzerinden çalışan Gemini modelleri için Gemini thought-signature temizliği; yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez |
    | `hybrid-anthropic-openai` | Tek bir plugin içinde Anthropic-message ve OpenAI uyumlu model yüzeylerini karıştıran sağlayıcılar için hibrit ilke; isteğe bağlı yalnızca Claude'a özel thinking-block kaldırma Anthropic tarafıyla sınırlı kalır |

    Gerçek paketlenmiş örnekler:

    - `google` ve `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` ve `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` ve `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` ve `zai`: `openai-compatible`

    Bugün kullanılabilir stream aileleri:

    | Aile | Bağladıkları |
    | --- | --- |
    | `google-thinking` | Paylaşılan akış yolunda Gemini thinking yükü normalleştirmesi |
    | `kilocode-thinking` | Paylaşılan proxy akış yolunda Kilo reasoning sarmalayıcısı; `kilo/auto` ve desteklenmeyen proxy reasoning kimlikleri eklenen thinking'i atlayacak şekilde |
    | `moonshot-thinking` | Yapılandırma + `/think` düzeyinden Moonshot ikili yerel-thinking yük eşlemesi |
    | `minimax-fast-mode` | Paylaşılan akış yolunda MiniMax fast-mode model yeniden yazımı |
    | `openai-responses-defaults` | Paylaşılan yerel OpenAI/Codex Responses sarmalayıcıları: attribution başlıkları, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması, reasoning-compat yük şekillendirmesi ve Responses bağlam yönetimi |
    | `openrouter-thinking` | Proxy yolları için OpenRouter reasoning sarmalayıcısı; desteklenmeyen model/`auto` atlamaları merkezi olarak ele alınır |
    | `tool-stream-default-on` | Z.AI gibi, açıkça devre dışı bırakılmadığı sürece tool streaming isteyen sağlayıcılar için varsayılan açık `tool_stream` sarmalayıcısı |

    Gerçek paketlenmiş örnekler:

    - `google` ve `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` ve `minimax-portal`: `minimax-fast-mode`
    - `openai` ve `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared`, replay-family
    enum'unu ve bu ailelerin üzerine kurulduğu paylaşılan yardımcıları da dışa aktarır. Yaygın herkese açık
    dışa aktarımlar şunları içerir:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` ve
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)` gibi paylaşılan replay oluşturucular
    - `sanitizeGoogleGeminiReplayHistory(...)`
      ve `resolveTaggedReasoningOutputMode()` gibi Gemini replay yardımcıları
    - `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` ve
      `normalizeNativeXaiModelId(...)` gibi uç nokta/model yardımcıları

    `openclaw/plugin-sdk/provider-stream`, hem family builder'ı hem de
    bu ailelerin yeniden kullandığı herkese açık sarmalayıcı yardımcılarını sunar. Yaygın herkese açık dışa aktarımlar
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

    Bazı stream yardımcıları kasıtlı olarak sağlayıcıya yerel kalır. Mevcut paketlenmiş
    örnek: `@openclaw/anthropic-provider`,
    herkese açık `api.ts` /
    `contract-api.ts` sınırı üzerinden `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve
    daha düşük düzey Anthropic sarmalayıcı oluşturucularını dışa aktarır. Bu yardımcılar Anthropic'e özgü kalır çünkü
    Claude OAuth beta işleme ve `context1m` geçitlemesini de kodlar.

    Diğer paketlenmiş sağlayıcılar da davranış aileler arasında temiz biçimde paylaşılmadığında
    aktarıma özgü sarmalayıcıları yerel tutar. Mevcut örnek: paketlenmiş
    xAI plugin'i, yerel xAI Responses şekillendirmesini kendi
    `wrapStreamFn` içinde tutar; buna `/fast` takma ad yeniden yazımları, varsayılan `tool_stream`,
    desteklenmeyen strict-tool temizliği ve xAI'ye özgü reasoning-payload
    kaldırma dahildir.

    `openclaw/plugin-sdk/provider-tools` şu anda bir paylaşılan
    tool-schema ailesi ile paylaşılan schema/compat yardımcılarını sunar:

    - `ProviderToolCompatFamily`, bugün paylaşılan aile envanterini belgelendirir.
    - `buildProviderToolCompatFamilyHooks("gemini")`, Gemini-güvenli araç şemalarına ihtiyaç duyan sağlayıcılar için Gemini şema
      temizliği + tanılamayı bağlar.
    - `normalizeGeminiToolSchemas(...)` ve `inspectGeminiToolSchemas(...)`
      temel herkese açık Gemini şema yardımcılarıdır.
    - `resolveXaiModelCompatPatch()`, paketlenmiş xAI compat yamasını döndürür:
      `toolSchemaProfile: "xai"`, desteklenmeyen şema anahtar sözcükleri, yerel
      `web_search` desteği ve HTML entity araç çağrısı argümanı çözümleme.
    - `applyXaiModelCompat(model)`, aynı xAI compat yamasını
      çözümlenen modele çalıştırıcıya ulaşmadan önce uygular.

    Gerçek paketlenmiş örnek: xAI plugin'i, bu compat meta verisinin
    core içinde xAI kurallarını sabit kodlamak yerine sağlayıcıya ait kalmasını sağlamak için `normalizeResolvedModel` ile birlikte
    `contributeResolvedModelCompat` kullanır.

    Aynı paket kökü deseni diğer paketlenmiş sağlayıcıları da destekler:

    - `@openclaw/openai-provider`: `api.ts`, sağlayıcı oluşturucularını,
      varsayılan model yardımcılarını ve gerçek zamanlı sağlayıcı oluşturucularını dışa aktarır
    - `@openclaw/openrouter-provider`: `api.ts`, sağlayıcı oluşturucusunu
      ve onboarding/yapılandırma yardımcılarını dışa aktarır

    <Tabs>
      <Tab title="Token değişimi">
        Her inference çağrısından önce token değişimi gerektiren sağlayıcılar için:

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
      <Tab title="Yerel aktarım kimliği">
        Genel HTTP veya WebSocket aktarımlarında yerel istek/oturum başlıklarına ya da meta verilere ihtiyaç duyan sağlayıcılar için:

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

    <Accordion title="Kullanılabilir tüm sağlayıcı hook'ları">
      OpenClaw hook'ları bu sırayla çağırır. Çoğu sağlayıcı yalnızca 2-3 tanesini kullanır:

      | # | Hook | Ne zaman kullanılır |
      | --- | --- | --- |
      | 1 | `catalog` | Model kataloğu veya temel URL varsayılanları |
      | 2 | `applyConfigDefaults` | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel varsayılanlar |
      | 3 | `normalizeModelId` | Aramadan önce eski/önizleme model kimliği takma ad temizliği |
      | 4 | `normalizeTransport` | Genel model oluşturmasından önce sağlayıcı ailesi `api` / `baseUrl` temizliği |
      | 5 | `normalizeConfig` | `models.providers.<id>` yapılandırmasını normalleştirme |
      | 6 | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcıları için yerel streaming-usage compat yeniden yazımları |
      | 7 | `resolveConfigApiKey` | Sağlayıcıya ait env-marker kimlik doğrulama çözümlemesi |
      | 8 | `resolveSyntheticAuth` | Yerel/self-hosted veya yapılandırma destekli sentetik kimlik doğrulama |
      | 9 | `shouldDeferSyntheticProfileAuth` | Sentetik kayıtlı profil yer tutucularını env/config kimlik doğrulamasının altına düşürme |
      | 10 | `resolveDynamicModel` | Keyfi üst akış model kimliklerini kabul etme |
      | 11 | `prepareDynamicModel` | Çözümlemeden önce eşzamansız meta veri getirme |
      | 12 | `normalizeResolvedModel` | Çalıştırıcıdan önce aktarım yeniden yazımları |

    Çalışma zamanı fallback notları:

    - `normalizeConfig`, önce eşleşen sağlayıcıyı, ardından gerçekten
      yapılandırmayı değiştiren bir sağlayıcı bulunana kadar hook destekli diğer sağlayıcı plugin'lerini denetler.
      Hiçbir sağlayıcı hook'u desteklenen bir Google ailesi yapılandırma girdisini yeniden yazmazsa,
      paketlenmiş Google yapılandırma normalleştiricisi yine de uygulanır.
    - `resolveConfigApiKey`, sağlanıyorsa sağlayıcı hook'unu kullanır. Paketlenmiş
      `amazon-bedrock` yolunda burada ayrıca yerleşik bir AWS env-marker çözümleyicisi bulunur;
      ancak Bedrock çalışma zamanı kimlik doğrulamasının kendisi hâlâ AWS SDK varsayılan
      zincirini kullanır.
      | 13 | `contributeResolvedModelCompat` | Başka bir uyumlu aktarım arkasındaki satıcı modelleri için compat işaretleri |
      | 14 | `capabilities` | Eski statik yetenek çantası; yalnızca uyumluluk |
      | 15 | `normalizeToolSchemas` | Kayıttan önce sağlayıcıya ait tool-schema temizliği |
      | 16 | `inspectToolSchemas` | Sağlayıcıya ait tool-schema tanılaması |
      | 17 | `resolveReasoningOutputMode` | Etiketli veya yerel reasoning-output sözleşmesi |
      | 18 | `prepareExtraParams` | Varsayılan istek parametreleri |
      | 19 | `createStreamFn` | Tamamen özel StreamFn aktarımı |
      | 20 | `wrapStreamFn` | Normal akış yolunda özel başlık/gövde sarmalayıcıları |
      | 21 | `resolveTransportTurnState` | Yerel tur başına başlıklar/meta veriler |
      | 22 | `resolveWebSocketSessionPolicy` | Yerel WS oturum başlıkları/bekleme süresi |
      | 23 | `formatApiKey` | Özel çalışma zamanı token biçimi |
      | 24 | `refreshOAuth` | Özel OAuth yenileme |
      | 25 | `buildAuthDoctorHint` | Kimlik doğrulama onarım rehberliği |
      | 26 | `matchesContextOverflowError` | Sağlayıcıya ait taşma algılama |
      | 27 | `classifyFailoverReason` | Sağlayıcıya ait oran sınırı/aşırı yük sınıflandırması |
      | 28 | `isCacheTtlEligible` | İstem önbelleği TTL geçitlemesi |
      | 29 | `buildMissingAuthMessage` | Özel eksik kimlik doğrulama ipucu |
      | 30 | `suppressBuiltInModel` | Bayat üst akış satırlarını gizleme |
      | 31 | `augmentModelCatalog` | Sentetik ileri uyumluluk satırları |
      | 32 | `isBinaryThinking` | İkili thinking açık/kapalı |
      | 33 | `supportsXHighThinking` | `xhigh` reasoning desteği |
      | 34 | `resolveDefaultThinkingLevel` | Varsayılan `/think` ilkesi |
      | 35 | `isModernModelRef` | Canlı/smoke model eşleştirmesi |
      | 36 | `prepareRuntimeAuth` | Inference öncesi token değişimi |
      | 37 | `resolveUsageAuth` | Özel kullanım kimlik bilgisi ayrıştırması |
      | 38 | `fetchUsageSnapshot` | Özel kullanım uç noktası |
      | 39 | `createEmbeddingProvider` | Bellek/arama için sağlayıcıya ait embedding bağdaştırıcısı |
      | 40 | `buildReplayPolicy` | Özel döküm replay/sıkıştırma ilkesi |
      | 41 | `sanitizeReplayHistory` | Genel temizlik sonrası sağlayıcıya özgü replay yeniden yazımları |
      | 42 | `validateReplayTurns` | Gömülü çalıştırıcıdan önce katı replay-turn doğrulaması |
      | 43 | `onModelSelected` | Seçim sonrası geri çağırım (ör. telemetri) |

      İstem ayarlama notu:

      - `resolveSystemPromptContribution`, bir sağlayıcının model ailesi için önbellek farkındalıklı
        sistem istemi rehberliği eklemesine olanak tanır. Davranış tek bir sağlayıcı/model
        ailesine ait olduğunda ve kararlı/dinamik önbellek ayrımını koruması gerektiğinde,
        `before_prompt_build` yerine bunu tercih edin.

      Ayrıntılı açıklamalar ve gerçek dünya örnekleri için
      [Internals: Provider Runtime Hooks](/tr/plugins/architecture#provider-runtime-hooks) bölümüne bakın.
    </Accordion>

  </Step>

  <Step title="Ek yetenekler ekleme (isteğe bağlı)">
    <a id="step-5-add-extra-capabilities"></a>
    Bir sağlayıcı plugin'i, metin inference'ına ek olarak konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı
    ses, medya anlama, görsel oluşturma, video oluşturma, web getirme
    ve web araması kaydedebilir:

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
        hint: "Sayfaları Acme'in render backend'i üzerinden getir.",
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
    şirket plugin'leri için önerilen kalıptır (satıcı başına bir plugin). Bkz.
    [Internals: Capability Ownership](/tr/plugins/architecture#capability-ownership-model).

    Video oluşturma için yukarıda gösterilen mod farkındalıklı yetenek biçimini tercih edin:
    `generate`, `imageToVideo` ve `videoToVideo`. `maxInputImages`, `maxInputVideos`
    ve `maxDurationSeconds` gibi düz toplu alanlar, dönüştürme modu desteğini
    veya devre dışı modları temiz biçimde duyurmak için yeterli değildir.

    Müzik oluşturma sağlayıcıları da aynı kalıbı izlemelidir:
    yalnızca istemle oluşturma için `generate` ve referans görsel tabanlı
    oluşturma için `edit`. `maxInputImages`,
    `supportsLyrics` ve `supportsFormat` gibi düz toplu alanlar düzenleme
    desteğini duyurmak için yeterli değildir; beklenen sözleşme açık
    `generate` / `edit` bloklarıdır.

  </Step>

  <Step title="Test">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Sağlayıcı yapılandırma nesnenizi index.ts veya ayrı bir dosyadan dışa aktarın
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
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

Burada eski, yalnızca skill için olan yayımlama takma adını kullanmayın; plugin paketleri
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
sağlayıcılara göre ne zaman birleştirileceğini denetler:

| Sıra      | Ne zaman     | Kullanım durumu                                |
| --------- | ------------ | ---------------------------------------------- |
| `simple`  | İlk geçiş    | Düz API anahtarlı sağlayıcılar                 |
| `profile` | `simple` sonrası | Kimlik doğrulama profilleriyle geçitlenen sağlayıcılar |
| `paired`  | `profile` sonrası | Birden çok ilişkili girdiyi sentezleme      |
| `late`    | Son geçiş    | Mevcut sağlayıcıların üzerine yazma (çakışmada kazanır) |

## Sonraki adımlar

- [Channel Plugins](/tr/plugins/sdk-channel-plugins) — plugin'iniz bir kanal da sağlıyorsa
- [SDK Runtime](/tr/plugins/sdk-runtime) — `api.runtime` yardımcıları (TTS, arama, subagent)
- [SDK Overview](/tr/plugins/sdk-overview) — tam alt yol içe aktarma başvurusu
- [Plugin Internals](/tr/plugins/architecture#provider-runtime-hooks) — hook ayrıntıları ve paketlenmiş örnekler
