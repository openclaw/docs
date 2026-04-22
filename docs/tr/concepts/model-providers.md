---
read_when:
    - Sağlayıcı bazında bir model kurulum başvuru kaynağına ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI onboarding komutları istiyorsunuz
summary: Örnek yapılandırmalar + CLI akışlarıyla model sağlayıcısı genel görünümü
title: Model Sağlayıcıları
x-i18n:
    generated_at: "2026-04-22T04:22:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# Model sağlayıcıları

Bu sayfa **LLM/model sağlayıcılarını** kapsar (WhatsApp/Telegram gibi sohbet kanallarını değil).
Model seçim kuralları için bkz. [/concepts/models](/tr/concepts/models).

## Hızlı kurallar

- Model başvuruları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
- `agents.defaults.models` ayarlarsanız, bu izin listesi olur.
- CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Yedek çalışma zamanı kuralları, cooldown yoklamaları ve oturum geçersiz kılma kalıcılığı [/concepts/model-failover](/tr/concepts/model-failover) içinde belgelenmiştir.
- `models.providers.*.models[].contextWindow` yerel model meta verisidir;
  `models.providers.*.models[].contextTokens` etkili çalışma zamanı sınırıdır.
- Sağlayıcı plugin’leri, `registerProvider({ catalog })` aracılığıyla model katalogları enjekte edebilir;
  OpenClaw bu çıktıyı `models.providers` içine birleştirip ardından
  `models.json` dosyasını yazar.
- Sağlayıcı manifestleri `providerAuthEnvVars` ve
  `providerAuthAliases` bildirebilir; böylece genel env tabanlı kimlik doğrulama yoklamaları ve sağlayıcı varyantlarının
  plugin çalışma zamanını yüklemesi gerekmez. Kalan çekirdek env-var eşlemesi artık yalnızca plugin olmayan/çekirdek sağlayıcılar ve Anthropic için API anahtarı öncelikli onboarding gibi birkaç genel öncelik durumu içindir.
- Sağlayıcı plugin’leri ayrıca sağlayıcı çalışma zamanı davranışına da sahip olabilir:
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
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` ve
  `onModelSelected`.
- Not: sağlayıcı çalışma zamanı `capabilities`, paylaşılan çalıştırıcı meta verisidir (sağlayıcı ailesi, transcript/araçlama farklılıkları, taşıma/önbellek ipuçları). Bu, bir plugin’in ne kaydettiğini tanımlayan [public capability model](/tr/plugins/architecture#public-capability-model) ile aynı şey değildir (metin çıkarımı, konuşma vb.).
- Paketlenmiş `codex` sağlayıcısı, paketlenmiş Codex aracı koşumuyla eşleştirilir.
  Codex’in sahip olduğu oturum açma, model keşfi, yerel iş parçacığı sürdürme ve uygulama sunucusu yürütmesini istediğinizde `codex/gpt-*` kullanın. Düz `openai/gpt-*` başvuruları OpenAI sağlayıcısını ve normal OpenClaw sağlayıcı taşımasını kullanmaya devam eder.
  Yalnızca Codex kullanan dağıtımlar, otomatik PI yedeğini
  `agents.defaults.embeddedHarness.fallback: "none"` ile devre dışı bırakabilir; bkz.
  [Codex Harness](/tr/plugins/codex-harness).

## Plugin sahipli sağlayıcı davranışı

Sağlayıcı plugin’leri artık sağlayıcıya özgü mantığın çoğuna sahip olabilirken, OpenClaw genel çıkarım döngüsünü korur.

Tipik ayrım:

- `auth[].run` / `auth[].runNonInteractive`: sağlayıcı,
  `openclaw onboard`, `openclaw models auth` ve başsız kurulum için onboarding/oturum açma
  akışlarına sahip olur
- `wizard.setup` / `wizard.modelPicker`: sağlayıcı kimlik doğrulama seçim etiketlerine,
  eski takma adlara, onboarding izin listesi ipuçlarına ve onboarding/model seçicilerindeki kurulum girdilerine sahip olur
- `catalog`: sağlayıcı `models.providers` içinde görünür
- `normalizeModelId`: sağlayıcı, arama veya
  kanonikleştirme öncesinde eski/önizleme model kimliklerini normalleştirir
- `normalizeTransport`: sağlayıcı, genel model derlemesinden önce
  taşıma ailesi `api` / `baseUrl` değerlerini normalleştirir; OpenClaw önce eşleşen sağlayıcıyı,
  ardından taşıma üzerinde gerçekten değişiklik yapanı bulana kadar hook destekli diğer sağlayıcı plugin’lerini kontrol eder
- `normalizeConfig`: sağlayıcı, çalışma zamanı kullanmadan önce `models.providers.<id>` yapılandırmasını
  normalleştirir; OpenClaw önce eşleşen sağlayıcıyı, sonra da
  yapılandırmayı gerçekten değiştiren hook destekli diğer sağlayıcı plugin’lerini kontrol eder. Hiçbir
  sağlayıcı hook’u yapılandırmayı yeniden yazmazsa, paketlenmiş Google ailesi yardımcıları yine de
  desteklenen Google sağlayıcı girdilerini normalleştirir.
- `applyNativeStreamingUsageCompat`: sağlayıcı, yapılandırma sağlayıcıları için uç nokta odaklı yerel streaming-usage uyumluluk yeniden yazımlarını uygular
- `resolveConfigApiKey`: sağlayıcı, tam çalışma zamanı kimlik doğrulamasını yüklemeye zorlamadan
  yapılandırma sağlayıcıları için env-marker kimlik doğrulamasını çözümler.
  `amazon-bedrock` da burada yerleşik bir AWS env-marker çözücüsüne sahiptir; Bedrock çalışma zamanı kimlik doğrulaması AWS SDK varsayılan zincirini kullansa da böyledir.
- `resolveSyntheticAuth`: sağlayıcı, düz metin sırları kalıcılaştırmadan
  yerel/self-hosted veya diğer yapılandırma destekli kimlik doğrulama kullanılabilirliğini sunabilir
- `shouldDeferSyntheticProfileAuth`: sağlayıcı, depolanan sentetik profil
  yer tutucularını env/config destekli kimlik doğrulamadan daha düşük öncelikli olarak işaretleyebilir
- `resolveDynamicModel`: sağlayıcı, yerel
  statik katalogda henüz bulunmayan model kimliklerini kabul eder
- `prepareDynamicModel`: sağlayıcı, dinamik çözümlemeyi
  yeniden denemeden önce meta veri yenilemesi gerektirir
- `normalizeResolvedModel`: sağlayıcı, taşıma veya base URL yeniden yazımları gerektirir
- `contributeResolvedModelCompat`: sağlayıcı,
  başka bir uyumlu taşıma üzerinden gelseler bile kendi satıcı modelleri için uyumluluk işaretleri sağlar
- `capabilities`: sağlayıcı transcript/araçlama/sağlayıcı-ailesi farklılıklarını yayımlar
- `normalizeToolSchemas`: sağlayıcı, gömülü
  çalıştırıcı görmeden önce araç şemalarını temizler
- `inspectToolSchemas`: sağlayıcı, normalleştirmeden sonra
  taşımaya özgü şema uyarılarını ortaya çıkarır
- `resolveReasoningOutputMode`: sağlayıcı, yerel mi yoksa etiketli mi
  reasoning-output sözleşmelerinin kullanılacağını seçer
- `prepareExtraParams`: sağlayıcı, model başına istek parametrelerini varsayılanlaştırır veya normalleştirir
- `createStreamFn`: sağlayıcı, normal akış yolunu
  tamamen özel bir taşımayla değiştirir
- `wrapStreamFn`: sağlayıcı istek başlıkları/gövdesi/model uyumluluk sarmalayıcıları uygular
- `resolveTransportTurnState`: sağlayıcı, tur başına yerel taşıma
  başlıkları veya meta verileri sağlar
- `resolveWebSocketSessionPolicy`: sağlayıcı, yerel WebSocket oturum
  başlıkları veya oturum cooldown ilkesi sağlar
- `createEmbeddingProvider`: sağlayıcı, çekirdek embedding anahtarlayıcısı yerine
  sağlayıcı plugin’iyle birlikte olması gereken bellek embedding davranışına sahip olur
- `formatApiKey`: sağlayıcı, depolanan kimlik doğrulama profillerini
  taşımanın beklediği çalışma zamanı `apiKey` dizgesine biçimlendirir
- `refreshOAuth`: sağlayıcı, paylaşılan `pi-ai`
  yenileyicileri yeterli olmadığında OAuth yenilemeye sahip olur
- `buildAuthDoctorHint`: sağlayıcı, OAuth yenilemesi
  başarısız olduğunda onarım rehberliği ekler
- `matchesContextOverflowError`: sağlayıcı, genel sezgilerin
  kaçıracağı sağlayıcıya özgü bağlam penceresi taşması hatalarını tanır
- `classifyFailoverReason`: sağlayıcı, sağlayıcıya özgü ham taşıma/API
  hatalarını hız sınırı veya aşırı yük gibi yedekleme nedenlerine eşler
- `isCacheTtlEligible`: sağlayıcı, hangi upstream model kimliklerinin prompt-cache TTL desteklediğine karar verir
- `buildMissingAuthMessage`: sağlayıcı, genel auth-store hatasını
  sağlayıcıya özgü bir kurtarma ipucuyla değiştirir
- `suppressBuiltInModel`: sağlayıcı, bayat upstream satırlarını gizler ve
  doğrudan çözümleme hataları için satıcı sahipli bir hata döndürebilir
- `augmentModelCatalog`: sağlayıcı, keşif ve yapılandırma birleştirmesinden sonra
  sentetik/nihai katalog satırları ekler
- `resolveThinkingProfile`: sağlayıcı, seçilen bir model için tam `/think` seviye kümesine,
  isteğe bağlı görüntüleme etiketlerine ve varsayılan seviyeye sahip olur
- `isBinaryThinking`: ikili açık/kapalı thinking UX için uyumluluk hook’u
- `supportsXHighThinking`: seçilen `xhigh` modelleri için uyumluluk hook’u
- `resolveDefaultThinkingLevel`: varsayılan `/think` ilkesi için uyumluluk hook’u
- `applyConfigDefaults`: sağlayıcı, kimlik doğrulama modu, env veya model ailesine bağlı olarak
  yapılandırma somutlaştırması sırasında sağlayıcıya özgü genel varsayılanları uygular
- `isModernModelRef`: sağlayıcı, live/smoke tercih edilen model eşleştirmesine sahip olur
- `prepareRuntimeAuth`: sağlayıcı, yapılandırılmış bir kimlik bilgisini
  kısa ömürlü bir çalışma zamanı token’ına dönüştürür
- `resolveUsageAuth`: sağlayıcı, `/usage`
  ve ilgili durum/raporlama yüzeyleri için kullanım/kota kimlik bilgilerini çözümler
- `fetchUsageSnapshot`: sağlayıcı, kullanım uç noktası alma/ayrıştırma işine sahip olurken
  çekirdek özet kabuğuna ve biçimlendirmeye sahip olmaya devam eder
- `onModelSelected`: sağlayıcı, telemetri veya sağlayıcıya ait oturum kayıt tutma gibi
  seçim sonrası yan etkileri çalıştırır

Mevcut paketlenmiş örnekler:

- `anthropic`: Claude 4.6 ileri uyumluluk yedeği, kimlik doğrulama onarım ipuçları, kullanım uç noktası alma, cache-TTL/sağlayıcı-ailesi meta verileri ve kimlik doğrulamaya duyarlı genel yapılandırma varsayılanları
- `amazon-bedrock`: Bedrock’a özgü throttle/hazır değil hataları için sağlayıcı sahipli bağlam taşması eşleştirmesi ve yedekleme nedeni sınıflandırması; ayrıca Anthropic trafiğinde yalnızca Claude için replay-policy guard’ları sağlayan paylaşılan `anthropic-by-model` replay ailesi
- `anthropic-vertex`: Anthropic-message trafiğinde yalnızca Claude için replay-policy guard’ları
- `openrouter`: doğrudan model kimlikleri, istek sarmalayıcıları, sağlayıcı yetenek ipuçları, proxy Gemini trafiğinde Gemini thought-signature temizleme, `openrouter-thinking` akış ailesi üzerinden proxy reasoning ekleme, yönlendirme meta verisi iletimi ve cache-TTL ilkesi
- `github-copilot`: onboarding/cihaz oturum açma, ileri uyumluluk model yedeği, Claude-thinking transcript ipuçları, çalışma zamanı token değişimi ve kullanım uç noktası alma
- `openai`: GPT-5.4 ileri uyumluluk yedeği, doğrudan OpenAI taşıma normalizasyonu, Codex farkındalıklı eksik kimlik doğrulama ipuçları, Spark bastırma, sentetik OpenAI/Codex katalog satırları, thinking/live-model ilkesi, kullanım token takma ad normalizasyonu (`input` / `output` ve `prompt` / `completion` aileleri), yerel OpenAI/Codex sarmalayıcıları için paylaşılan `openai-responses-defaults` akış ailesi, sağlayıcı-ailesi meta verileri, `gpt-image-2` için paketlenmiş görsel üretim sağlayıcısı kaydı ve `sora-2` için paketlenmiş video üretim sağlayıcısı kaydı
- `google` ve `google-gemini-cli`: Gemini 3.1 ileri uyumluluk yedeği, yerel Gemini replay doğrulaması, bootstrap replay temizleme, etiketli reasoning-output modu, modern model eşleştirme, Gemini image-preview modelleri için paketlenmiş görsel üretim sağlayıcısı kaydı ve Veo modelleri için paketlenmiş video üretim sağlayıcısı kaydı; Gemini CLI OAuth ayrıca kullanım yüzeyleri için kimlik doğrulama profili token biçimlendirme, usage-token ayrıştırma ve kota uç noktası alımına da sahiptir
- `moonshot`: paylaşılan taşıma, plugin sahipli thinking payload normalizasyonu
- `kilocode`: paylaşılan taşıma, plugin sahipli istek başlıkları, reasoning payload normalizasyonu, proxy-Gemini thought-signature temizleme ve cache-TTL ilkesi
- `zai`: GLM-5 ileri uyumluluk yedeği, `tool_stream` varsayılanları, cache-TTL ilkesi, ikili-thinking/live-model ilkesi ve kullanım kimlik doğrulaması + kota alma; bilinmeyen `glm-5*` kimlikleri paketlenmiş `glm-4.7` şablonundan sentezlenir
- `xai`: yerel Responses taşıma normalizasyonu, Grok hızlı varyantları için `/fast` takma ad yeniden yazımları, varsayılan `tool_stream`, xAI’ye özgü tool-schema / reasoning-payload temizleme ve `grok-imagine-video` için paketlenmiş video üretim sağlayıcısı kaydı
- `mistral`: plugin sahipli yetenek meta verileri
- `opencode` ve `opencode-go`: plugin sahipli yetenek meta verileri ile proxy-Gemini thought-signature temizleme
- `alibaba`: `alibaba/wan2.6-t2v` gibi doğrudan Wan model başvuruları için plugin sahipli video üretim kataloğu
- `byteplus`: plugin sahipli kataloglar ve Seedance text-to-video/image-to-video modelleri için paketlenmiş video üretim sağlayıcısı kaydı
- `fal`: barındırılan üçüncü taraf video modelleri için paketlenmiş video üretim sağlayıcısı kaydı; FLUX görsel modelleri için barındırılan üçüncü taraf görsel üretim sağlayıcısı kaydı ve ayrıca barındırılan üçüncü taraf video modelleri için paketlenmiş video üretim sağlayıcısı kaydı
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`, `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` ve `volcengine`: yalnızca plugin sahipli kataloglar
- `qwen`: metin modelleri için plugin sahipli kataloglar ve çok modlu yüzeyleri için paylaşılan medya-anlama ve video üretim sağlayıcısı kayıtları; Qwen video üretimi, `wan2.6-t2v` ve `wan2.7-r2v` gibi paketlenmiş Wan modelleriyle Standard DashScope video uç noktalarını kullanır
- `runway`: `gen4.5` gibi yerel Runway görev tabanlı modeller için plugin sahipli video üretim sağlayıcısı kaydı
- `minimax`: plugin sahipli kataloglar, Hailuo video modelleri için paketlenmiş video üretim sağlayıcısı kaydı, `image-01` için paketlenmiş görsel üretim sağlayıcısı kaydı, hibrit Anthropic/OpenAI replay-policy seçimi ve kullanım kimlik doğrulama/anlık görüntü mantığı
- `together`: plugin sahipli kataloglar ve Wan video modelleri için paketlenmiş video üretim sağlayıcısı kaydı
- `xiaomi`: plugin sahipli kataloglar ve kullanım kimlik doğrulama/anlık görüntü mantığı

Paketlenmiş `openai` plugin’i artık her iki sağlayıcı kimliğine de sahiptir: `openai` ve `openai-codex`.

Bu, hâlâ OpenClaw’un normal taşımalarına uyan sağlayıcıları kapsar. Tamamen özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı, ayrı ve daha derin bir genişletme yüzeyidir.

## API anahtarı döndürme

- Seçili sağlayıcılar için genel sağlayıcı döndürmesini destekler.
- Birden çok anahtarı şu yollarla yapılandırın:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
  - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
  - `<PROVIDER>_API_KEY` (birincil anahtar)
  - `<PROVIDER>_API_KEY_*` (numaralı liste, ör. `<PROVIDER>_API_KEY_1`)
- Google sağlayıcıları için `GOOGLE_API_KEY` de yedek olarak dahildir.
- Anahtar seçim sırası önceliği korur ve değerlerin tekrarını kaldırır.
- İstekler yalnızca hız sınırı yanıtlarında bir sonraki anahtarla yeniden denenir (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` veya dönemsel kullanım sınırı mesajları).
- Hız sınırı dışındaki hatalar hemen başarısız olur; anahtar döndürme denenmez.
- Tüm aday anahtarlar başarısız olduğunda, son hata son denemeden döndürülür.

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla birlikte gelir. Bu sağlayıcılar **hiç**
`models.providers` yapılandırması gerektirmez; yalnızca kimlik doğrulamayı ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Kimlik doğrulama: `OPENAI_API_KEY`
- İsteğe bağlı döndürme: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` ve `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan taşıma `auto`’dur (önce WebSocket, sonra SSE yedeği)
- Model başına geçersiz kılmak için `agents.defaults.models["openai/<model>"].params.transport` kullanın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket warm-up varsayılan olarak `params.openaiWsWarmup` ile etkindir (`true`/`false`)
- OpenAI öncelikli işleme, `agents.defaults.models["openai/<model>"].params.serviceTier` ile etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` biçimine eşler
- Paylaşılan `/fast` anahtarı yerine açık bir kademe istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw ilişkilendirme başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca `api.openai.com` üzerindeki yerel OpenAI trafiğinde uygulanır, genel OpenAI uyumlu proxy’lerde uygulanmaz
- Yerel OpenAI yolları ayrıca Responses `store`, prompt-cache ipuçları ve OpenAI reasoning-compat payload şekillendirmesini korur; proxy yolları bunu yapmaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API bunu reddettiği için OpenClaw’da kasıtlı olarak bastırılır; Spark yalnızca Codex’e özgü kabul edilir

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Kimlik doğrulama: `ANTHROPIC_API_KEY`
- İsteğe bağlı döndürme: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` ve `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek geçersiz kılma)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan genel Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarlı ve OAuth kimlik doğrulamalı trafik dahil olmak üzere paylaşılan `/fast` anahtarını ve `params.fastMode` değerini destekler; OpenClaw bunu Anthropic `service_tier` değerine eşler (`auto` ve `standard_only`)
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu nedenle Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için izinli kabul eder.
- Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak kullanılabilir olmaya devam eder; ancak OpenClaw artık mevcutsa Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Sağlayıcı: `openai-codex`
- Kimlik doğrulama: OAuth (ChatGPT)
- Örnek model: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan taşıma `auto`’dur (önce WebSocket, sonra SSE yedeği)
- Model başına geçersiz kılmak için `agents.defaults.models["openai-codex/<model>"].params.transport` kullanın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier` yerel Codex Responses isteklerinde de iletilir (`chatgpt.com/backend-api`)
- Gizli OpenClaw ilişkilendirme başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca `chatgpt.com/backend-api` üzerindeki yerel Codex trafiğine eklenir, genel OpenAI uyumlu proxy’lere eklenmez
- Doğrudan `openai/*` ile aynı `/fast` anahtarını ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` olarak eşler
- `openai-codex/gpt-5.3-codex-spark`, Codex OAuth kataloğu bunu sunduğunda kullanılabilir kalır; entitlement’e bağlıdır
- `openai-codex/gpt-5.4`, yerel `contextWindow = 1050000` ve varsayılan çalışma zamanı `contextTokens = 272000` değerlerini korur; çalışma zamanı sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
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

- [Qwen Cloud](/tr/providers/qwen): Qwen Cloud sağlayıcı yüzeyi ile Alibaba DashScope ve Coding Plan uç nokta eşlemesi
- [MiniMax](/tr/providers/minimax): MiniMax Coding Plan OAuth veya API anahtarı erişimi
- [GLM Models](/tr/providers/glm): Z.AI Coding Plan veya genel API uç noktaları

### OpenCode

- Kimlik doğrulama: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`)
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
- Kimlik doğrulama: `GEMINI_API_KEY`
- İsteğe bağlı döndürme: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` yedeği ve `OPENCLAW_LIVE_GEMINI_KEY` (tek geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırmaları `google/gemini-3-flash-preview` değerine normalleştirilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Doğrudan Gemini çalıştırmaları ayrıca `agents.defaults.models["google/<model>"].params.cachedContent`
  (veya eski `cached_content`) kabul eder; bu, sağlayıcıya özgü
  `cachedContents/...` tanıtıcısını iletmek içindir; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Kimlik doğrulama: Vertex `gcloud` ADC kullanır; Gemini CLI kendi OAuth akışını kullanır
- Dikkat: OpenClaw içindeki Gemini CLI OAuth resmî olmayan bir entegrasyondur. Bazı kullanıcılar üçüncü taraf istemcileri kullandıktan sonra Google hesap kısıtlamaları bildirmiştir. Devam etmeyi seçerseniz Google şartlarını inceleyin ve kritik olmayan bir hesap kullanın.
- Gemini CLI OAuth, paketlenmiş `google` plugin’inin bir parçası olarak sunulur.
  - Önce Gemini CLI’ı yükleyin:
    - `brew install gemini-cli`
    - veya `npm install -g @google/gemini-cli`
  - Etkinleştirin: `openclaw plugins enable google`
  - Giriş yapın: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
  - Not: bir istemci kimliği veya gizli anahtarı `openclaw.json` içine **yapıştırmazsınız**. CLI oturum açma akışı, token’ları gateway host üzerindeki kimlik doğrulama profillerinde saklar.
  - Giriş yaptıktan sonra istekler başarısız olursa gateway host üzerinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  - Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım verileri `stats` alanına geri düşer ve `stats.cached` OpenClaw `cacheRead` olarak normalleştirilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Kimlik doğrulama: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` olarak normalleştirilir
  - `zai-api-key`, eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorlar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Kimlik doğrulama: `AI_GATEWAY_API_KEY`
- Örnek modeller: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Sağlayıcı: `kilocode`
- Kimlik doğrulama: `KILOCODE_API_KEY`
- Örnek model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Statik yedek katalog `kilocode/kilo/auto` ile gelir; canlı
  `https://api.kilo.ai/api/gateway/models` keşfi çalışma zamanı
  kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam upstream yönlendirme Kilo Gateway’e aittir,
  OpenClaw içinde sabit kodlanmış değildir.

Kurulum ayrıntıları için bkz. [/providers/kilocode](/tr/providers/kilocode).

### Diğer paketlenmiş sağlayıcı plugin’leri

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Örnek modeller: `openrouter/auto`, `openrouter/moonshotai/kimi-k2.6`
- OpenClaw, OpenRouter’ın belgelenmiş uygulama ilişkilendirme başlıklarını yalnızca
  istek gerçekten `openrouter.ai` hedefliyorsa uygular
- OpenRouter’a özgü Anthropic `cache_control` işaretçileri de
  keyfi proxy URL’lerine değil, yalnızca doğrulanmış OpenRouter yollarına uygulanır
- OpenRouter, proxy tarzı OpenAI uyumlu yol üzerinde kalır; bu nedenle
  yerel OpenAI’ye özgü istek şekillendirmesi (`serviceTier`, Responses `store`,
  prompt-cache ipuçları, OpenAI reasoning-compat payload’ları) iletilmez
- Gemini destekli OpenRouter başvuruları yalnızca proxy-Gemini thought-signature temizleme yolunu korur;
  yerel Gemini replay doğrulaması ve bootstrap yeniden yazımları kapalı kalır
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Örnek model: `kilocode/kilo/auto`
- Gemini destekli Kilo başvuruları aynı proxy-Gemini thought-signature
  temizleme yolunu korur; `kilocode/kilo/auto` ve proxy reasoning’i desteklemeyen diğer
  ipuçları proxy reasoning eklemeyi atlar
- MiniMax: `minimax` (API anahtarı) ve `minimax-portal` (OAuth)
- Kimlik doğrulama: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`
- Örnek model: `minimax/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7`
- MiniMax onboarding/API anahtarı kurulumu, açık M2.7 model tanımlarını
  `input: ["text", "image"]` ile yazar; paketlenmiş sağlayıcı kataloğu bu sohbet başvurularını
  sağlayıcı yapılandırması somutlaştırılana kadar yalnızca metin olarak tutar
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Örnek model: `moonshot/kimi-k2.6`
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
  - Yerel paketlenmiş xAI istekleri xAI Responses yolunu kullanır
  - `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`,
    `grok-4` ve `grok-4-0709` değerlerini `*-fast` varyantlarına yeniden yazar
  - `tool_stream` varsayılan olarak açıktır; devre dışı bırakmak için
    `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false`
    olarak ayarlayın
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Örnek model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras üzerindeki GLM modelleri `zai-glm-4.7` ve `zai-glm-4.6` kimliklerini kullanır.
  - OpenAI uyumlu base URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference örnek modeli: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Bkz. [Hugging Face (Inference)](/tr/providers/huggingface).

## `models.providers` üzerinden sağlayıcılar (özel/base URL)

**Özel** sağlayıcılar veya
OpenAI/Anthropic uyumlu proxy’ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketlenmiş sağlayıcı plugin’lerinin çoğu zaten varsayılan bir katalog yayımlar.
Varsayılan base URL, başlıklar veya model listesini geçersiz kılmak istediğinizde yalnızca açık
`models.providers.<id>` girdilerini kullanın.

### Moonshot AI (Kimi)

Moonshot, paketlenmiş bir sağlayıcı plugin’i olarak gelir. Varsayılan olarak yerleşik sağlayıcıyı kullanın ve yalnızca base URL veya model meta verilerini geçersiz kılmanız gerektiğinde açık bir `models.providers.moonshot` girdisi ekleyin:

- Sağlayıcı: `moonshot`
- Kimlik doğrulama: `MOONSHOT_API_KEY`
- Örnek model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` veya `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model kimlikleri:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding, Moonshot AI’nin Anthropic uyumlu uç noktasını kullanır:

- Sağlayıcı: `kimi`
- Kimlik doğrulama: `KIMI_API_KEY`
- Örnek model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Eski `kimi/k2p5` değeri uyumluluk model kimliği olarak kabul edilmeye devam eder.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎), Çin’de Doubao ve diğer modellere erişim sağlar.

- Sağlayıcı: `volcengine` (coding: `volcengine-plan`)
- Kimlik doğrulama: `VOLCANO_ENGINE_API_KEY`
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
kataloğu aynı anda kaydedilir.

Onboarding/yapılandırma model seçicilerinde Volcengine kimlik doğrulama seçeneği hem
`volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

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
- Kimlik doğrulama: `BYTEPLUS_API_KEY`
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
kataloğu aynı anda kaydedilir.

Onboarding/yapılandırma model seçicilerinde BytePlus kimlik doğrulama seçeneği hem
`byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

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

Synthetic, `synthetic` sağlayıcısının arkasında Anthropic uyumlu modeller sunar:

- Sağlayıcı: `synthetic`
- Kimlik doğrulama: `SYNTHETIC_API_KEY`
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

MiniMax, özel uç noktalar kullandığı için `models.providers` üzerinden yapılandırılır:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Global): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (CN): `--auth-choice minimax-cn-api`
- Kimlik doğrulama: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya
  `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçacıkları için bkz. [/providers/minimax](/tr/providers/minimax).

MiniMax’in Anthropic uyumlu akış yolunda OpenClaw, siz açıkça ayarlamadıkça
thinking’i varsayılan olarak devre dışı bırakır ve `/fast on`,
`MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

Plugin sahipli yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görsel üretimi `minimax/image-01` veya `minimax-portal/image-01` şeklindedir
- Görsel anlama, her iki MiniMax kimlik doğrulama yolunda da plugin sahipli `MiniMax-VL-01` modelidir
- Web araması `minimax` sağlayıcı kimliğinde kalır

### LM Studio

LM Studio, yerel API’yi kullanan paketlenmiş bir sağlayıcı plugin’i olarak gelir:

- Sağlayıcı: `lmstudio`
- Kimlik doğrulama: `LM_API_TOKEN`
- Varsayılan çıkarım base URL’si: `http://localhost:1234/v1`

Ardından bir model ayarlayın (`http://localhost:1234/api/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw keşif + otomatik yükleme için LM Studio’nun yerel `/api/v1/models` ve `/api/v1/models/load` uç noktalarını, varsayılan olarak çıkarım için ise `/v1/chat/completions` uç noktasını kullanır.
Kurulum ve sorun giderme için bkz. [/providers/lmstudio](/tr/providers/lmstudio).

### Ollama

Ollama, paketlenmiş bir sağlayıcı plugin’i olarak gelir ve Ollama’nın yerel API’sini kullanır:

- Sağlayıcı: `ollama`
- Kimlik doğrulama: Gerekmez (yerel sunucu)
- Örnek model: `ollama/llama3.3`
- Kurulum: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama'yı yükleyin, ardından bir model çekin:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama, siz `OLLAMA_API_KEY` ile etkinleştirmeyi seçtiğinizde yerelde `http://127.0.0.1:11434` adresinde algılanır ve paketlenmiş sağlayıcı plugin’i Ollama’yı doğrudan `openclaw onboard` ve model seçiciye ekler. Onboarding, bulut/yerel mod ve özel yapılandırma için bkz. [/providers/ollama](/tr/providers/ollama).

### vLLM

vLLM, yerel/self-hosted OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı plugin’i olarak gelir:

- Sağlayıcı: `vllm`
- Kimlik doğrulama: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:8000/v1`

Yerelde otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı zorlamıyorsa herhangi bir değer çalışır):

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

Ayrıntılar için bkz. [/providers/vllm](/tr/providers/vllm).

### SGLang

SGLang, hızlı self-hosted
OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı plugin’i olarak gelir:

- Sağlayıcı: `sglang`
- Kimlik doğrulama: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:30000/v1`

Yerelde otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı
zorlamıyorsa herhangi bir değer çalışır):

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

Ayrıntılar için bkz. [/providers/sglang](/tr/providers/sglang).

### Yerel proxy’ler (LM Studio, vLLM, LiteLLM vb.)

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
        apiKey: "${LM_API_TOKEN}",
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
  Atlandıklarında OpenClaw şu varsayılanları kullanır:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Önerilen: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.
- Yerel olmayan uç noktalardaki `api: "openai-completions"` için (host’u `api.openai.com` olmayan, boş olmayan herhangi bir `baseUrl`), OpenClaw desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarını önlemek amacıyla `compat.supportsDeveloperRole: false` değerini zorlar.
- Proxy tarzı OpenAI uyumlu yollar ayrıca yerel OpenAI’ye özgü istek
  şekillendirmesini de atlar: `service_tier` yok, Responses `store` yok, prompt-cache ipuçları yok,
  OpenAI reasoning-compat payload şekillendirmesi yok ve gizli OpenClaw ilişkilendirme
  başlıkları yok.
- `baseUrl` boşsa/atlanmışsa OpenClaw varsayılan OpenAI davranışını korur (`api.openai.com` adresine çözülür).
- Güvenlik için, açık bir `compat.supportsDeveloperRole: true` değeri bile yerel olmayan `openai-completions` uç noktalarında yine geçersiz kılınır.

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Ayrıca bkz.: tam yapılandırma örnekleri için [/gateway/configuration](/tr/gateway/configuration).

## İlgili

- [Models](/tr/concepts/models) — model yapılandırması ve takma adlar
- [Model Failover](/tr/concepts/model-failover) — yedek zincirleri ve yeniden deneme davranışı
- [Configuration Reference](/tr/gateway/configuration-reference#agent-defaults) — model yapılandırma anahtarları
- [Providers](/tr/providers) — sağlayıcı başına kurulum kılavuzları
