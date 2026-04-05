---
read_when:
    - Sağlayıcı bazında bir model kurulum başvurusuna ihtiyaç duyduğunuzda
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI onboarding komutları istediğinizde
summary: Örnek yapılandırmalar ve CLI akışlarıyla model sağlayıcısı genel bakışı
title: Model Providers
x-i18n:
    generated_at: "2026-04-05T13:52:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d8f56a2a5319de03f7b86e7b19b9a89e7023f757930b5b5949568f680352a3a
    source_path: concepts/model-providers.md
    workflow: 15
---

# Model Providers

Bu sayfa **LLM/model sağlayıcılarını** kapsar (WhatsApp/Telegram gibi sohbet kanallarını değil).
Model seçim kuralları için bkz. [/concepts/models](/concepts/models).

## Hızlı kurallar

- Model referansları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
- `agents.defaults.models` ayarlarsanız, bu izin listesi olur.
- CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Yedek çalışma zamanı kuralları, cooldown yoklamaları ve oturum geçersiz kılma kalıcılığı
  [/concepts/model-failover](/concepts/model-failover) altında belgelenmiştir.
- `models.providers.*.models[].contextWindow` doğal model meta verisidir;
  `models.providers.*.models[].contextTokens` etkin çalışma zamanı sınırıdır.
- Sağlayıcı eklentileri `registerProvider({ catalog })` aracılığıyla model katalogları ekleyebilir;
  OpenClaw bu çıktıyı `models.providers` içine birleştirir ve ardından
  `models.json` yazar.
- Sağlayıcı manifestleri `providerAuthEnvVars` bildirebilir; böylece genel ortam tabanlı
  kimlik doğrulama yoklamalarının eklenti çalışma zamanını yüklemesi gerekmez. Kalan çekirdek env-var
  eşlemesi artık yalnızca eklenti olmayan/çekirdek sağlayıcılar ve Anthropic API-key-first onboarding gibi
  birkaç genel öncelik durumu içindir.
- Sağlayıcı eklentileri ayrıca sağlayıcı çalışma zamanı davranışına da sahip olabilir:
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` ve
  `onModelSelected`.
- Not: sağlayıcı çalışma zamanı `capabilities`, paylaşılan runner meta verisidir (sağlayıcı
  ailesi, döküm/araç farklılıkları, taşıma/önbellek ipuçları). Bu,
  bir eklentinin ne kaydettiğini açıklayan [genel yetenek modeli](/plugins/architecture#public-capability-model) ile
  aynı şey değildir (metin çıkarımı, konuşma vb.).

## Eklentiye ait sağlayıcı davranışı

Sağlayıcı eklentileri artık sağlayıcıya özgü mantığın çoğuna sahip olabilirken, OpenClaw
genel çıkarım döngüsünü korur.

Tipik ayrım:

- `auth[].run` / `auth[].runNonInteractive`: sağlayıcı, `openclaw onboard`, `openclaw models auth` ve etkileşimsiz kurulum için onboarding/login
  akışlarına sahip olur
- `wizard.setup` / `wizard.modelPicker`: sağlayıcı, auth-choice etiketlerine,
  eski takma adlara, onboarding allowlist ipuçlarına ve onboarding/model seçicilerindeki kurulum girişlerine sahip olur
- `catalog`: sağlayıcı `models.providers` içinde görünür
- `normalizeModelId`: sağlayıcı, arama veya kanonikleştirme öncesinde eski/preview model kimliklerini normalize eder
- `normalizeTransport`: sağlayıcı, genel model oluşturma öncesinde taşıma ailesi `api` / `baseUrl` değerlerini normalize eder; OpenClaw önce eşleşen sağlayıcıyı,
  ardından biri taşıma değerini gerçekten değiştirene kadar hook destekli diğer sağlayıcı eklentilerini kontrol eder
- `normalizeConfig`: sağlayıcı, çalışma zamanı kullanmadan önce `models.providers.<id>` yapılandırmasını normalize eder; OpenClaw önce eşleşen sağlayıcıyı,
  ardından biri yapılandırmayı gerçekten değiştirene kadar hook destekli diğer
  sağlayıcı eklentilerini kontrol eder. Hiçbir sağlayıcı hook'u yapılandırmayı yeniden yazmazsa,
  paketlenmiş Google ailesi yardımcıları desteklenen Google sağlayıcı girdilerini yine de normalize eder.
- `applyNativeStreamingUsageCompat`: sağlayıcı, yapılandırma sağlayıcıları için uç nokta kaynaklı doğal streaming-usage uyumluluk yeniden yazımlarını uygular
- `resolveConfigApiKey`: sağlayıcı, tam çalışma zamanı auth yüklemesini zorlamadan yapılandırma sağlayıcıları için env-marker auth'u çözer. `amazon-bedrock` burada ayrıca yerleşik bir AWS env-marker çözücüsüne de sahiptir; Bedrock çalışma zamanı auth'u AWS SDK varsayılan zincirini kullansa da böyledir.
- `resolveSyntheticAuth`: sağlayıcı, düz metin gizli değerleri kalıcılaştırmadan yerel/self-hosted veya diğer yapılandırma destekli auth kullanılabilirliğini açığa çıkarabilir
- `shouldDeferSyntheticProfileAuth`: sağlayıcı, depolanmış sentetik profil yer tutucularını env/config destekli auth'tan daha düşük öncelikli olarak işaretleyebilir
- `resolveDynamicModel`: sağlayıcı, yerel statik katalogda henüz bulunmayan model kimliklerini kabul eder
- `prepareDynamicModel`: sağlayıcı, dinamik çözümlemeyi yeniden denemeden önce bir meta veri yenilemesine ihtiyaç duyar
- `normalizeResolvedModel`: sağlayıcı, taşıma veya base URL yeniden yazımlarına ihtiyaç duyar
- `contributeResolvedModelCompat`: sağlayıcı, kendi satıcı modelleri başka bir uyumlu taşıma üzerinden gelse bile uyumluluk bayrakları sağlar
- `capabilities`: sağlayıcı döküm/araç/sağlayıcı ailesi farklılıklarını yayımlar
- `normalizeToolSchemas`: sağlayıcı, gömülü runner görmeden önce araç şemalarını temizler
- `inspectToolSchemas`: sağlayıcı, normalizasyondan sonra taşıma-özgü şema uyarılarını ortaya çıkarır
- `resolveReasoningOutputMode`: sağlayıcı, doğal ve etiketli reasoning-output sözleşmeleri arasında seçim yapar
- `prepareExtraParams`: sağlayıcı, model başına istek parametrelerini varsayılanlaştırır veya normalize eder
- `createStreamFn`: sağlayıcı, normal akış yolunu tamamen özel bir taşımayla değiştirir
- `wrapStreamFn`: sağlayıcı, istek başlığı/gövdesi/model uyumluluk sarmalayıcıları uygular
- `resolveTransportTurnState`: sağlayıcı, tur başına doğal taşıma başlıkları veya meta verileri sağlar
- `resolveWebSocketSessionPolicy`: sağlayıcı, doğal WebSocket oturum başlıkları veya oturum cooldown ilkesi sağlar
- `createEmbeddingProvider`: sağlayıcı, bellek embedding davranışı çekirdek embedding switchboard yerine sağlayıcı eklentisine ait olduğunda buna sahip olur
- `formatApiKey`: sağlayıcı, depolanan auth profillerini taşımanın beklediği çalışma zamanı `apiKey` dizesi biçimine dönüştürür
- `refreshOAuth`: paylaşılan `pi-ai` yenileyicileri yeterli olmadığında sağlayıcı OAuth yenilemesine sahip olur
- `buildAuthDoctorHint`: OAuth yenilemesi başarısız olduğunda sağlayıcı onarım yönlendirmesi ekler
- `matchesContextOverflowError`: sağlayıcı, genel sezgilerin kaçıracağı sağlayıcıya özgü context-window aşımı hatalarını tanır
- `classifyFailoverReason`: sağlayıcı, sağlayıcıya özgü ham taşıma/API hatalarını hız sınırı veya aşırı yük gibi failover nedenlerine eşler
- `isCacheTtlEligible`: sağlayıcı, hangi upstream model kimliklerinin prompt-cache TTL desteklediğine karar verir
- `buildMissingAuthMessage`: sağlayıcı, genel auth-store hatasını sağlayıcıya özgü kurtarma ipucuyla değiştirir
- `suppressBuiltInModel`: sağlayıcı, eski upstream satırlarını gizler ve doğrudan çözümleme hataları için satıcıya ait bir hata döndürebilir
- `augmentModelCatalog`: sağlayıcı, keşif ve yapılandırma birleştirmesinden sonra sentetik/nihai katalog satırları ekler
- `isBinaryThinking`: sağlayıcı, ikili açık/kapalı thinking UX'ine sahip olur
- `supportsXHighThinking`: sağlayıcı, seçilen modelleri `xhigh` için etkinleştirir
- `resolveDefaultThinkingLevel`: sağlayıcı, bir model ailesi için varsayılan `/think` ilkesine sahip olur
- `applyConfigDefaults`: sağlayıcı, auth modu, env veya model ailesine göre yapılandırma somutlaştırma sırasında sağlayıcıya özgü genel varsayılanları uygular
- `isModernModelRef`: sağlayıcı, live/smoke preferred-model eşleştirmesine sahip olur
- `prepareRuntimeAuth`: sağlayıcı, yapılandırılmış bir kimlik bilgisini kısa ömürlü bir çalışma zamanı belirtecine dönüştürür
- `resolveUsageAuth`: sağlayıcı, `/usage` ve ilgili durum/raporlama yüzeyleri için kullanım/kota kimlik bilgilerini çözer
- `fetchUsageSnapshot`: sağlayıcı, kullanım uç noktası getirme/ayrıştırma işlemlerine sahip olurken çekirdek özet kabuğu ve biçimlendirmeye sahip olmaya devam eder
- `onModelSelected`: sağlayıcı, telemetri veya sağlayıcıya ait oturum muhasebesi gibi seçim sonrası yan etkileri çalıştırır

Mevcut paketlenmiş örnekler:

- `anthropic`: Claude 4.6 ileri uyumluluk fallback'i, auth onarım ipuçları, kullanım
  uç noktası getirme, cache-TTL/sağlayıcı-aile meta verisi ve auth farkında genel
  yapılandırma varsayılanları
- `amazon-bedrock`: Bedrock'a özgü throttle/not-ready hataları için sağlayıcıya ait context-overflow eşleştirmesi ve failover
  nedeni sınıflandırması, ayrıca Anthropic trafiğinde Claude-only replay-policy
  korumaları için paylaşılan `anthropic-by-model` replay ailesi
- `anthropic-vertex`: Anthropic-message
  trafiğinde Claude-only replay-policy korumaları
- `openrouter`: pass-through model kimlikleri, istek sarmalayıcıları, sağlayıcı yetenek
  ipuçları, proxy Gemini trafiğinde Gemini thought-signature temizliği,
  `openrouter-thinking` akış ailesi üzerinden proxy reasoning ekleme, routing
  meta verisi iletimi ve cache-TTL ilkesi
- `github-copilot`: onboarding/device login, ileri uyumluluk model fallback'i,
  Claude-thinking döküm ipuçları, çalışma zamanı belirteç değişimi ve kullanım uç noktası getirme
- `openai`: GPT-5.4 ileri uyumluluk fallback'i, doğrudan OpenAI taşıma
  normalizasyonu, Codex farkında missing-auth ipuçları, Spark bastırma, sentetik
  OpenAI/Codex katalog satırları, thinking/live-model ilkesi, kullanım belirteci takma ad
  normalizasyonu (`input` / `output` ve `prompt` / `completion` aileleri), doğal OpenAI/Codex sarmalayıcıları için paylaşılan
  `openai-responses-defaults` akış ailesi ve sağlayıcı-aile meta verisi
- `google` ve `google-gemini-cli`: Gemini 3.1 ileri uyumluluk fallback'i,
  doğal Gemini replay doğrulaması, bootstrap replay temizliği, etiketli
  reasoning-output modu ve modern-model eşleştirmesi; Gemini CLI OAuth ayrıca
  auth-profile belirteç biçimlendirme, usage-token ayrıştırma ve kullanım yüzeyleri için
  kota uç noktası getirmeye de sahiptir
- `moonshot`: paylaşılan taşıma, eklentiye ait thinking payload normalizasyonu
- `kilocode`: paylaşılan taşıma, eklentiye ait istek başlıkları, reasoning payload
  normalizasyonu, proxy-Gemini thought-signature temizliği ve cache-TTL
  ilkesi
- `zai`: GLM-5 ileri uyumluluk fallback'i, `tool_stream` varsayılanları, cache-TTL
  ilkesi, binary-thinking/live-model ilkesi ve kullanım auth'u + kota getirme;
  bilinmeyen `glm-5*` kimlikleri paketlenmiş `glm-4.7` şablonundan sentezlenir
- `xai`: doğal Responses taşıma normalizasyonu, Grok fast varyantları için `/fast` takma ad yeniden yazımları, varsayılan `tool_stream` ve xAI'ye özgü tool-schema /
  reasoning-payload temizliği
- `mistral`: eklentiye ait capability meta verisi
- `opencode` ve `opencode-go`: eklentiye ait capability meta verisi artı
  proxy-Gemini thought-signature temizliği
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi`,
  `nvidia`, `qianfan`, `stepfun`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway` ve `volcengine`: yalnızca eklentiye ait kataloglar
- `qwen`: metin modelleri için eklentiye ait kataloglar artı
  çok modlu yüzeyleri için paylaşılan
  media-understanding ve video-generation sağlayıcı kayıtları; Qwen video üretimi,
  `wan2.6-t2v` ve `wan2.7-r2v` gibi paketlenmiş Wan modelleriyle birlikte Standard DashScope video
  uç noktalarını kullanır
- `minimax`: eklentiye ait kataloglar, hibrit Anthropic/OpenAI replay-policy
  seçimi ve kullanım auth/snapshot mantığı
- `xiaomi`: eklentiye ait kataloglar artı kullanım auth/snapshot mantığı

Paketlenmiş `openai` eklentisi artık her iki sağlayıcı kimliğine de sahiptir:
`openai` ve `openai-codex`.

Bu, hâlâ OpenClaw'ın normal taşımalarına uyan sağlayıcıları kapsar. Tamamen
özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı, ayrı ve daha derin bir
uzantı yüzeyidir.

## API anahtarı döndürme

- Seçili sağlayıcılar için genel sağlayıcı döndürmesini destekler.
- Birden fazla anahtarı şunlarla yapılandırın:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek live override, en yüksek öncelik)
  - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
  - `<PROVIDER>_API_KEY` (birincil anahtar)
  - `<PROVIDER>_API_KEY_*` (numaralandırılmış liste, ör. `<PROVIDER>_API_KEY_1`)
- Google sağlayıcıları için `GOOGLE_API_KEY` de fallback olarak dahildir.
- Anahtar seçim sırası önceliği korur ve değerlerin tekrarını kaldırır.
- İstekler yalnızca hız sınırı yanıtlarında bir sonraki anahtarla yeniden denenir (örneğin
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` veya periyodik usage-limit mesajları).
- Hız sınırı dışındaki hatalar hemen başarısız olur; anahtar döndürmesi denenmez.
- Tüm aday anahtarlar başarısız olduğunda, son denemedeki son hata döndürülür.

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla birlikte gelir. Bu sağlayıcılar **hiç**
`models.providers` yapılandırması gerektirmez; yalnızca auth ayarlayıp model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Auth: `OPENAI_API_KEY`
- İsteğe bağlı döndürme: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` ve `OPENCLAW_LIVE_OPENAI_KEY` (tek override)
- Örnek modeller: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan taşıma `auto`'dur (önce WebSocket, sonra SSE fallback)
- Model başına `agents.defaults.models["openai/<model>"].params.transport` ile geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket warm-up varsayılan olarak `params.openaiWsWarmup` (`true`/`false`) ile etkindir
- OpenAI öncelikli işleme, `agents.defaults.models["openai/<model>"].params.serviceTier` ile etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` olacak şekilde eşler
- Paylaşılan `/fast` anahtarı yerine açık bir kademe istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw attribution başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca `api.openai.com` üzerindeki doğal OpenAI trafiğine uygulanır, genel OpenAI uyumlu proxy'lere uygulanmaz
- Doğal OpenAI yolları ayrıca Responses `store`, prompt-cache ipuçlarını ve
  OpenAI reasoning-compat payload şekillendirmesini korur; proxy yolları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API bunu reddettiği için OpenClaw'da kasıtlı olarak bastırılmıştır; Spark yalnızca Codex olarak değerlendirilir

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- İsteğe bağlı döndürme: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` ve `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek override)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey` veya `openclaw onboard --auth-choice anthropic-cli`
- Doğrudan genel Anthropic istekleri, `api.anthropic.com` adresine gönderilen API-key ve OAuth doğrulamalı trafik dahil olmak üzere paylaşılan `/fast` anahtarını ve `params.fastMode` değerini destekler; OpenClaw bunu Anthropic `service_tier` değerine (`auto` ve `standard_only`) eşler
- Faturalandırma notu: Anthropic'in genel Claude Code belgeleri, doğrudan Claude Code terminal kullanımını hâlâ Claude plan sınırlarına dahil eder. Ayrı olarak Anthropic, **4 Nisan 2026 saat 12:00 PM PT / 8:00 PM BST** tarihinde OpenClaw kullanıcılarına, **OpenClaw** Claude-login yolunun üçüncü taraf harness kullanımı olarak sayıldığını ve abonelikten ayrı olarak faturalanan **Extra Usage** gerektirdiğini bildirdi.
- Anthropic setup-token yeniden eski/el ile bir OpenClaw yolu olarak kullanılabilir. Bu yolu, Anthropic'in OpenClaw kullanıcılarına bunun **Extra Usage** gerektirdiğini söylediği beklentisiyle kullanın.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Sağlayıcı: `openai-codex`
- Auth: OAuth (ChatGPT)
- Örnek model: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan taşıma `auto`'dur (önce WebSocket, sonra SSE fallback)
- Model başına `agents.defaults.models["openai-codex/<model>"].params.transport` ile geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier`, doğal Codex Responses isteklerinde (`chatgpt.com/backend-api`) de iletilir
- Gizli OpenClaw attribution başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca `chatgpt.com/backend-api` adresindeki doğal Codex trafiğine eklenir, genel OpenAI uyumlu proxy'lere eklenmez
- Doğrudan `openai/*` ile aynı `/fast` anahtarını ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` olarak eşler
- `openai-codex/gpt-5.3-codex-spark`, Codex OAuth kataloğu bunu sunduğunda kullanılabilir kalır; entitlement'a bağlıdır
- `openai-codex/gpt-5.4`, doğal `contextWindow = 1050000` ve varsayılan çalışma zamanı `contextTokens = 272000` değerlerini korur; çalışma zamanı sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- İlke notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Diğer abonelik tarzı barındırılan seçenekler

- [Qwen Cloud](/providers/qwen): Qwen Cloud sağlayıcı yüzeyi artı Alibaba DashScope ve Coding Plan uç nokta eşlemesi
- [MiniMax](/providers/minimax): MiniMax Coding Plan OAuth veya API anahtarı erişimi
- [GLM Models](/providers/glm): Z.AI Coding Plan veya genel API uç noktaları

### OpenCode

- Auth: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`)
- Zen çalışma zamanı sağlayıcısı: `opencode`
- Go çalışma zamanı sağlayıcısı: `opencode-go`
- Örnek modeller: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API anahtarı)

- Sağlayıcı: `google`
- Auth: `GEMINI_API_KEY`
- İsteğe bağlı döndürme: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` fallback'i ve `OPENCLAW_LIVE_GEMINI_KEY` (tek override)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` olarak normalize edilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Doğrudan Gemini çalıştırmaları ayrıca `agents.defaults.models["google/<model>"].params.cachedContent`
  (veya eski `cached_content`) değerini de kabul eder; bu, sağlayıcıya özgü
  `cachedContents/...` tanıtıcısını iletir; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Auth: Vertex gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır
- Uyarı: OpenClaw içindeki Gemini CLI OAuth resmî olmayan bir entegrasyondur. Bazı kullanıcılar üçüncü taraf istemcileri kullandıktan sonra Google hesap kısıtlamaları bildirmiştir. Devam etmeyi seçerseniz Google şartlarını gözden geçirin ve kritik olmayan bir hesap kullanın.
- Gemini CLI OAuth, paketlenmiş `google` eklentisinin bir parçası olarak sunulur.
  - Önce Gemini CLI'yi yükleyin:
    - `brew install gemini-cli`
    - veya `npm install -g @google/gemini-cli`
  - Etkinleştirme: `openclaw plugins enable google`
  - Giriş: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Varsayılan model: `google-gemini-cli/gemini-3.1-pro-preview`
  - Not: istemci kimliği veya gizli değeri `openclaw.json` içine **yapıştırmazsınız**. CLI giriş akışı,
    belirteçleri gateway ana makinesindeki auth profillerine kaydeder.
  - Giriş yaptıktan sonra istekler başarısız olursa, gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  - Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım
    `stats` üzerinden fallback yapar ve `stats.cached` OpenClaw `cacheRead` olarak normalize edilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Auth: `ZAI_API_KEY`
- Örnek model: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` olarak normalize edilir
  - `zai-api-key`, eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorlar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Örnek model: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Sağlayıcı: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Örnek model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Statik fallback kataloğu `kilocode/kilo/auto` ile birlikte gelir; canlı
  `https://api.kilo.ai/api/gateway/models` keşfi çalışma zamanı
  kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam upstream yönlendirmesi OpenClaw'da sabit kodlanmış değildir; Kilo Gateway'e aittir.

Kurulum ayrıntıları için bkz. [/providers/kilocode](/providers/kilocode).

### Diğer paketlenmiş sağlayıcı eklentileri

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Örnek model: `openrouter/auto`
- OpenClaw, OpenRouter'ın belgelenmiş uygulama attribution başlıklarını yalnızca
  istek gerçekten `openrouter.ai` hedefliyorsa uygular
- OpenRouter'a özgü Anthropic `cache_control` işaretçileri de benzer şekilde
  doğrulanmış OpenRouter yollarıyla sınırlıdır, rastgele proxy URL'leriyle değil
- OpenRouter, proxy tarzı OpenAI uyumlu yolda kalır; bu nedenle yalnızca doğal
  OpenAI'ye özgü istek şekillendirmesi (`serviceTier`, Responses `store`,
  prompt-cache ipuçları, OpenAI reasoning-compat payload'ları) iletilmez
- Gemini tabanlı OpenRouter referansları yalnızca proxy-Gemini thought-signature temizliğini korur; doğal Gemini replay doğrulaması ve bootstrap yeniden yazımları kapalı kalır
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Örnek model: `kilocode/kilo/auto`
- Gemini tabanlı Kilo referansları aynı proxy-Gemini thought-signature
  temizleme yolunu korur; `kilocode/kilo/auto` ve diğer proxy-reasoning-support olmayan
  ipuçları proxy reasoning eklemeyi atlar
- MiniMax: `minimax` (API anahtarı) ve `minimax-portal` (OAuth)
- Auth: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`
- Örnek model: `minimax/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7`
- MiniMax onboarding/API-key kurulumu, `input: ["text", "image"]` ile açık M2.7 model tanımları yazar; paketlenmiş sağlayıcı kataloğu, bu sağlayıcı yapılandırması somutlaştırılana kadar sohbet referanslarını yalnızca metin olarak tutar
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Örnek model: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` (`KIMI_API_KEY` veya `KIMICODE_API_KEY`)
- Örnek model: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Örnek model: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` veya `DASHSCOPE_API_KEY`)
- Örnek model: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Örnek model: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Örnek modeller: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Örnek model: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Örnek model: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Örnek model: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Örnek model: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Doğal paketlenmiş xAI istekleri xAI Responses yolunu kullanır
  - `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`,
    `grok-4` ve `grok-4-0709` modellerini `*-fast` varyantlarına yeniden yazar
  - `tool_stream` varsayılan olarak açıktır;
    devre dışı bırakmak için `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false` yapın
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Örnek model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras üzerindeki GLM modelleri `zai-glm-4.7` ve `zai-glm-4.6` kimliklerini kullanır.
  - OpenAI uyumlu base URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference örnek modeli: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Bkz. [Hugging Face (Inference)](/providers/huggingface).

## `models.providers` ile sağlayıcılar (özel/base URL)

**Özel** sağlayıcılar veya
OpenAI/Anthropic uyumlu proxy'ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketlenmiş sağlayıcı eklentilerinin çoğu zaten varsayılan bir katalog yayınlar.
Varsayılan base URL, başlıklar veya model listesini geçersiz kılmak istediğinizde
yalnızca açık `models.providers.<id>` girdileri kullanın.

### Moonshot AI (Kimi)

Moonshot, paketlenmiş bir sağlayıcı eklentisi olarak gelir. Varsayılan olarak
yerleşik sağlayıcıyı kullanın; base URL veya model meta verisini geçersiz kılmanız gerektiğinde yalnızca açık bir `models.providers.moonshot` girdisi ekleyin:

- Sağlayıcı: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Örnek model: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` veya `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model kimlikleri:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding, Moonshot AI'nin Anthropic uyumlu uç noktasını kullanır:

- Sağlayıcı: `kimi`
- Auth: `KIMI_API_KEY`
- Örnek model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Eski `kimi/k2p5`, uyumluluk model kimliği olarak kabul edilmeye devam eder.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎), Çin'de Doubao ve diğer modellere erişim sağlar.

- Sağlayıcı: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Örnek model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding varsayılan olarak coding yüzeyini kullanır, ancak genel `volcengine/*`
kataloğu da aynı anda kaydedilir.

Onboarding/configure model seçicilerinde, Volcengine auth choice hem
`volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa fallback yapar.

Kullanılabilir modeller:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Coding modelleri (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Uluslararası)

BytePlus ARK, uluslararası kullanıcılar için Volcano Engine ile aynı modellere erişim sağlar.

- Sağlayıcı: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Örnek model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding varsayılan olarak coding yüzeyini kullanır, ancak genel `byteplus/*`
kataloğu da aynı anda kaydedilir.

Onboarding/configure model seçicilerinde, BytePlus auth choice hem
`byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa fallback yapar.

Kullanılabilir modeller:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Coding modelleri (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic, `synthetic` sağlayıcısı arkasında Anthropic uyumlu modeller sağlar:

- Sağlayıcı: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Örnek model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax, özel uç noktalar kullandığı için `models.providers` ile yapılandırılır:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Global): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (CN): `--auth-choice minimax-cn-api`
- Auth: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya
  `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçacıkları için bkz. [/providers/minimax](/providers/minimax).

MiniMax'ın Anthropic uyumlu akış yolunda OpenClaw, açıkça ayarlamadığınız sürece thinking'i
varsayılan olarak devre dışı bırakır ve `/fast on`,
`MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

Eklentiye ait capability ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görsel oluşturma `minimax/image-01` veya `minimax-portal/image-01` olur
- Görsel anlama, her iki MiniMax auth yolunda da eklentiye ait `MiniMax-VL-01` olur
- Web arama sağlayıcı kimliği `minimax` üzerinde kalır

### Ollama

Ollama, paketlenmiş bir sağlayıcı eklentisi olarak gelir ve Ollama'nın doğal API'sini kullanır:

- Sağlayıcı: `ollama`
- Auth: Gerekmez (yerel sunucu)
- Örnek model: `ollama/llama3.3`
- Kurulum: [https://ollama.com/download](https://ollama.com/download)

```bash
# Önce Ollama'yı kurun, sonra bir model çekin:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY` ile açıkça etkinleştirdiğinizde Ollama yerel olarak `http://127.0.0.1:11434` adresinde algılanır ve paketlenmiş sağlayıcı eklentisi Ollama'yı doğrudan
`openclaw onboard` ve model seçiciye ekler. Onboarding, bulut/yerel mod ve özel yapılandırma için bkz. [/providers/ollama](/providers/ollama).

### vLLM

vLLM, yerel/self-hosted OpenAI uyumlu
sunucular için paketlenmiş bir sağlayıcı eklentisi olarak gelir:

- Sağlayıcı: `vllm`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:8000/v1`

Yerel otomatik keşfe katılmak için (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır):

```bash
export VLLM_API_KEY="vllm-local"
```

Ardından bir model ayarlayın (`/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Ayrıntılar için bkz. [/providers/vllm](/providers/vllm).

### SGLang

SGLang, hızlı self-hosted
OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı eklentisi olarak gelir:

- Sağlayıcı: `sglang`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:30000/v1`

Yerel otomatik keşfe katılmak için (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır):

```bash
export SGLANG_API_KEY="sglang-local"
```

Ardından bir model ayarlayın (`/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Ayrıntılar için bkz. [/providers/sglang](/providers/sglang).

### Yerel proxy'ler (LM Studio, vLLM, LiteLLM vb.)

Örnek (OpenAI uyumlu):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Notlar:

- Özel sağlayıcılar için `reasoning`, `input`, `cost`, `contextWindow` ve `maxTokens` isteğe bağlıdır.
  Atlandığında OpenClaw şu varsayılanları kullanır:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Önerilir: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.
- Doğal olmayan uç noktalardaki `api: "openai-completions"` için (`baseUrl` boş olmayan ve ana makinesi `api.openai.com` olmayan her değer), OpenClaw desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarını önlemek amacıyla `compat.supportsDeveloperRole: false` değerini zorlar.
- Proxy tarzı OpenAI uyumlu yollar doğal OpenAI'ye özgü istek
  şekillendirmesini de atlar: `service_tier` yok, Responses `store` yok, prompt-cache ipuçları yok,
  OpenAI reasoning-compat payload şekillendirmesi yok ve gizli OpenClaw attribution
  başlıkları yok.
- `baseUrl` boşsa/atlanırsa OpenClaw varsayılan OpenAI davranışını korur (bu, `api.openai.com` olarak çözülür).
- Güvenlik için, açık bir `compat.supportsDeveloperRole: true` değeri de doğal olmayan `openai-completions` uç noktalarında yine geçersiz kılınır.

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Ayrıca bkz.: tam yapılandırma örnekleri için [/gateway/configuration](/gateway/configuration).

## İlgili

- [Models](/concepts/models) — model yapılandırması ve takma adlar
- [Model Failover](/concepts/model-failover) — fallback zincirleri ve yeniden deneme davranışı
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — model yapılandırma anahtarları
- [Providers](/providers) — sağlayıcı başına kurulum kılavuzları
