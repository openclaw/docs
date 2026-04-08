---
read_when:
    - Sağlayıcı bazında model kurulumu için bir başvuruya ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI ilk kurulum komutları istiyorsunuz
summary: Örnek yapılandırmalar ve CLI akışlarıyla model sağlayıcısı genel bakışı
title: Model Sağlayıcıları
x-i18n:
    generated_at: "2026-04-08T06:02:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 558ac9e34b67fcc3dd6791a01bebc17e1c34152fa6c5611593d681e8cfa532d9
    source_path: concepts/model-providers.md
    workflow: 15
---

# Model sağlayıcıları

Bu sayfa **LLM/model sağlayıcılarını** kapsar (WhatsApp/Telegram gibi sohbet kanalları değil).
Model seçimi kuralları için bkz. [/concepts/models](/tr/concepts/models).

## Hızlı kurallar

- Model başvuruları `provider/model` kullanır (örnek: `opencode/claude-opus-4-6`).
- `agents.defaults.models` ayarlarsanız, bu allowlist olur.
- CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Geri dönüş çalışma zamanı kuralları, cooldown probları ve oturum geçersiz kılma kalıcılığı
  [/concepts/model-failover](/tr/concepts/model-failover) içinde belgelenmiştir.
- `models.providers.*.models[].contextWindow` yerel model meta verisidir;
  `models.providers.*.models[].contextTokens` ise etkili çalışma zamanı sınırıdır.
- Sağlayıcı eklentileri `registerProvider({ catalog })` aracılığıyla model katalogları ekleyebilir;
  OpenClaw, `models.json` yazılmadan önce bu çıktıyı `models.providers` içine birleştirir.
- Sağlayıcı manifest dosyaları `providerAuthEnvVars` bildirebilir; böylece genel env tabanlı
  kimlik doğrulama problarının eklenti çalışma zamanını yüklemesi gerekmez. Kalan çekirdek env-var
  haritası artık yalnızca eklenti olmayan/çekirdek sağlayıcılar ve Anthropic API-key-first ilk kurulum gibi
  birkaç genel öncelik durumu içindir.
- Sağlayıcı eklentileri ayrıca sağlayıcı çalışma zamanı davranışını da şu yollarla sahiplenebilir:
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
- Not: sağlayıcı çalışma zamanı `capabilities`, paylaşılan çalıştırıcı meta verisidir (sağlayıcı
  ailesi, transcript/tooling özellikleri, transport/cache ipuçları). Bu,
  bir eklentinin ne kaydettiğini açıklayan [public capability model](/tr/plugins/architecture#public-capability-model)
  ile aynı şey değildir (metin çıkarımı, konuşma vb.).

## Eklenti sahipliğinde sağlayıcı davranışı

Sağlayıcı eklentileri artık OpenClaw genel çıkarım döngüsünü korurken
sağlayıcıya özgü mantığın çoğunu sahiplenebilir.

Tipik ayrım:

- `auth[].run` / `auth[].runNonInteractive`: sağlayıcı, `openclaw onboard`, `openclaw models auth` ve başsız kurulum için ilk kurulum/giriş
  akışlarını sahiplenir
- `wizard.setup` / `wizard.modelPicker`: sağlayıcı, auth-choice etiketlerini,
  eski takma adları, ilk kurulum allowlist ipuçlarını ve ilk kurulum/model seçicilerindeki kurulum girdilerini sahiplenir
- `catalog`: sağlayıcı `models.providers` içinde görünür
- `normalizeModelId`: sağlayıcı, arama veya kanonikleştirme öncesinde eski/önizleme model kimliklerini normalleştirir
- `normalizeTransport`: sağlayıcı, genel model birleştirmesinden önce transport-family `api` / `baseUrl`
  değerlerini normalleştirir; OpenClaw önce eşleşen sağlayıcıyı,
  ardından transport'u gerçekten değiştiren bir tane bulunana kadar kanca yetenekli diğer sağlayıcı eklentilerini kontrol eder
- `normalizeConfig`: sağlayıcı, çalışma zamanı kullanmadan önce `models.providers.<id>` yapılandırmasını
  normalleştirir; OpenClaw önce eşleşen sağlayıcıyı, ardından
  yapılandırmayı gerçekten değiştiren bir tane bulunana kadar kanca yetenekli diğer sağlayıcı eklentilerini kontrol eder. Eğer hiçbir
  sağlayıcı kancası yapılandırmayı yeniden yazmazsa, paketlenmiş Google ailesi yardımcıları
  desteklenen Google sağlayıcı girdilerini yine de normalleştirir.
- `applyNativeStreamingUsageCompat`: sağlayıcı, yapılandırma sağlayıcıları için endpoint kaynaklı yerel streaming-usage uyumluluk yeniden yazımlarını uygular
- `resolveConfigApiKey`: sağlayıcı, tam çalışma zamanı auth yüklemesini zorlamadan yapılandırma sağlayıcıları için env-marker auth'u çözümler.
  `amazon-bedrock` ayrıca burada yerleşik bir AWS env-marker çözücüsüne sahiptir; Bedrock çalışma zamanı auth'u
  AWS SDK varsayılan zincirini kullanmasına rağmen.
- `resolveSyntheticAuth`: sağlayıcı, düz metin sırları kalıcı hale getirmeden yerel/self-hosted veya
  diğer yapılandırma destekli auth kullanılabilirliğini gösterebilir
- `shouldDeferSyntheticProfileAuth`: sağlayıcı, depolanmış sentetik profil
  yer tutucularını env/config destekli auth'tan daha düşük öncelikli olarak işaretleyebilir
- `resolveDynamicModel`: sağlayıcı, henüz yerel statik katalogda bulunmayan model kimliklerini kabul eder
- `prepareDynamicModel`: sağlayıcının, dinamik çözümlemeyi yeniden denemeden önce meta veri yenilemesine ihtiyacı vardır
- `normalizeResolvedModel`: sağlayıcının transport veya temel URL yeniden yazımlarına ihtiyacı vardır
- `contributeResolvedModelCompat`: sağlayıcı, sağlayıcıya ait modeller başka bir uyumlu transport üzerinden
  gelse bile onlar için compat bayrakları ekler
- `capabilities`: sağlayıcı transcript/tooling/provider-family özelliklerini yayımlar
- `normalizeToolSchemas`: sağlayıcı, gömülü çalıştırıcı bunları görmeden önce araç şemalarını temizler
- `inspectToolSchemas`: sağlayıcı, normalleştirmeden sonra transport'a özgü şema uyarılarını ortaya çıkarır
- `resolveReasoningOutputMode`: sağlayıcı, yerel veya etiketli reasoning-output sözleşmelerini seçer
- `prepareExtraParams`: sağlayıcı, model başına istek parametreleri için varsayılanları ayarlar veya normalleştirir
- `createStreamFn`: sağlayıcı, normal akış yolunu tamamen özel bir transport ile değiştirir
- `wrapStreamFn`: sağlayıcı, istek başlık/gövde/model compat sarmalayıcıları uygular
- `resolveTransportTurnState`: sağlayıcı, tur başına yerel transport
  başlıkları veya meta verisi sağlar
- `resolveWebSocketSessionPolicy`: sağlayıcı, yerel WebSocket oturum
  başlıkları veya oturum cool-down ilkesi sağlar
- `createEmbeddingProvider`: sağlayıcı, çekirdek embedding anahtarlayıcısı yerine
  sağlayıcı eklentisiyle birlikte olması gerektiğinde bellek embedding davranışını sahiplenir
- `formatApiKey`: sağlayıcı, depolanmış auth profillerini transport'un beklediği çalışma zamanı
  `apiKey` dizesi biçimine dönüştürür
- `refreshOAuth`: sağlayıcı, paylaşılan `pi-ai`
  yenileyiciler yeterli olmadığında OAuth yenilemeyi sahiplenir
- `buildAuthDoctorHint`: sağlayıcı, OAuth yenileme
  başarısız olduğunda onarım rehberliği ekler
- `matchesContextOverflowError`: sağlayıcı, genel sezgilerin kaçıracağı
  sağlayıcıya özgü context-window taşma hatalarını tanır
- `classifyFailoverReason`: sağlayıcı, sağlayıcıya özgü ham transport/API
  hatalarını rate limit veya overload gibi geri dönüş nedenlerine eşler
- `isCacheTtlEligible`: sağlayıcı, hangi upstream model kimliklerinin prompt-cache TTL'yi desteklediğine karar verir
- `buildMissingAuthMessage`: sağlayıcı, genel auth-store hatasını
  sağlayıcıya özgü bir kurtarma ipucuyla değiştirir
- `suppressBuiltInModel`: sağlayıcı, eski upstream satırlarını gizler ve doğrudan çözümleme başarısızlıkları için
  sağlayıcıya ait bir hata döndürebilir
- `augmentModelCatalog`: sağlayıcı, keşif ve yapılandırma birleştirmesinden sonra
  sentetik/nihai katalog satırları ekler
- `isBinaryThinking`: sağlayıcı, ikili açık/kapalı düşünme UX'ini sahiplenir
- `supportsXHighThinking`: sağlayıcı, seçili modelleri `xhigh` içine alır
- `resolveDefaultThinkingLevel`: sağlayıcı, bir model ailesi için varsayılan `/think` ilkesini sahiplenir
- `applyConfigDefaults`: sağlayıcı, auth modu, env veya model ailesine göre
  yapılandırma somutlaştırması sırasında sağlayıcıya özgü genel varsayılanları uygular
- `isModernModelRef`: sağlayıcı, live/smoke tercih edilen model eşleştirmesini sahiplenir
- `prepareRuntimeAuth`: sağlayıcı, yapılandırılmış bir kimlik bilgisini kısa ömürlü bir
  çalışma zamanı belirtecine dönüştürür
- `resolveUsageAuth`: sağlayıcı, `/usage`
  ve ilgili durum/raporlama yüzeyleri için kullanım/kota kimlik bilgilerini çözümler
- `fetchUsageSnapshot`: sağlayıcı, kullanım endpoint'inin getirilmesini/ayrıştırılmasını sahiplenirken
  çekirdek özet kabuğu ve biçimlendirmeyi sahiplenmeye devam eder
- `onModelSelected`: sağlayıcı, telemetri veya sağlayıcıya ait oturum kayıt işlemleri gibi
  seçim sonrası yan etkileri çalıştırır

Mevcut paketlenmiş örnekler:

- `anthropic`: Claude 4.6 ileriye dönük uyumlu geri dönüş, auth onarım ipuçları, kullanım
  endpoint getirme, cache-TTL/provider-family meta verisi ve auth farkındalığına sahip genel
  yapılandırma varsayılanları
- `amazon-bedrock`: Bedrock'a özgü throttle/not-ready hataları için sağlayıcı sahipliğinde context-overflow eşleştirmesi ve failover
  nedeni sınıflandırması, ayrıca Anthropic trafiğinde Claude'a özel replay-policy
  korumaları için paylaşılan `anthropic-by-model` replay ailesi
- `anthropic-vertex`: Anthropic-message
  trafiğinde Claude'a özel replay-policy korumaları
- `openrouter`: doğrudan model kimlikleri, istek sarmalayıcıları, sağlayıcı capability
  ipuçları, proxy Gemini trafiğinde Gemini thought-signature temizleme,
  `openrouter-thinking` akış ailesi üzerinden proxy reasoning ekleme, yönlendirme
  meta verisi iletme ve cache-TTL ilkesi
- `github-copilot`: ilk kurulum/cihaz girişi, ileriye dönük uyumlu model geri dönüşü,
  Claude-thinking transcript ipuçları, çalışma zamanı token değişimi ve kullanım endpoint'i
  getirme
- `openai`: GPT-5.4 ileriye dönük uyumlu geri dönüş, doğrudan OpenAI transport
  normalizasyonu, Codex farkındalığına sahip eksik auth ipuçları, Spark bastırma, sentetik
  OpenAI/Codex katalog satırları, thinking/live-model ilkesi, kullanım belirteci takma adı
  normalizasyonu (`input` / `output` ve `prompt` / `completion` aileleri), yerel OpenAI/Codex
  sarmalayıcıları için paylaşılan `openai-responses-defaults` akış ailesi,
  provider-family meta verisi, `gpt-image-1` için paketlenmiş görüntü oluşturma sağlayıcısı
  kaydı ve `sora-2` için paketlenmiş video oluşturma sağlayıcısı
  kaydı
- `google` ve `google-gemini-cli`: Gemini 3.1 ileriye dönük uyumlu geri dönüş,
  yerel Gemini replay doğrulaması, bootstrap replay temizleme, etiketli
  reasoning-output modu, modern-model eşleştirme, Gemini image-preview modelleri için paketlenmiş görüntü oluşturma
  sağlayıcısı kaydı ve Veo modelleri için paketlenmiş
  video oluşturma sağlayıcısı kaydı; Gemini CLI OAuth ayrıca
  kullanım yüzeyleri için auth-profile token biçimlendirmesi, usage-token ayrıştırması ve kota endpoint'i
  getirmeyi de sahiplenir
- `moonshot`: paylaşılan transport, eklenti sahipliğinde thinking payload normalizasyonu
- `kilocode`: paylaşılan transport, eklenti sahipliğinde istek başlıkları, reasoning payload
  normalizasyonu, proxy-Gemini thought-signature temizleme ve cache-TTL
  ilkesi
- `zai`: GLM-5 ileriye dönük uyumlu geri dönüş, `tool_stream` varsayılanları, cache-TTL
  ilkesi, binary-thinking/live-model ilkesi ve kullanım auth + kota getirme;
  bilinmeyen `glm-5*` kimlikleri, paketlenmiş `glm-4.7` şablonundan sentetik olarak üretilir
- `xai`: yerel Responses transport normalizasyonu, Grok hızlı varyantları için `/fast` takma ad yeniden yazımları,
  varsayılan `tool_stream`, xAI'ye özgü tool-schema /
  reasoning-payload temizliği ve `grok-imagine-video` için paketlenmiş video oluşturma sağlayıcısı
  kaydı
- `mistral`: eklenti sahipliğinde capability meta verisi
- `opencode` ve `opencode-go`: eklenti sahipliğinde capability meta verisi ve ayrıca
  proxy-Gemini thought-signature temizleme
- `alibaba`: `alibaba/wan2.6-t2v` gibi doğrudan Wan model başvuruları için eklenti sahipliğinde video oluşturma kataloğu
- `byteplus`: eklenti sahipliğinde kataloglar ve ayrıca Seedance text-to-video/image-to-video modelleri için paketlenmiş video oluşturma sağlayıcısı
  kaydı
- `fal`: barındırılan üçüncü taraf görüntü oluşturma sağlayıcısı
  kaydı ile FLUX görüntü modelleri için birlikte, ayrıca barındırılan üçüncü taraf video modelleri için paketlenmiş
  video oluşturma sağlayıcısı kaydı
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` ve `volcengine`:
  yalnızca eklenti sahipliğinde kataloglar
- `qwen`: metin modelleri için eklenti sahipliğinde kataloglar ve ayrıca
  çok modlu yüzeyleri için paylaşılan
  media-understanding ve video oluşturma sağlayıcısı kayıtları; Qwen video üretimi,
  `wan2.6-t2v` ve `wan2.7-r2v` gibi paketlenmiş Wan modelleriyle Standart DashScope video
  endpoint'lerini kullanır
- `runway`: `gen4.5` gibi yerel
  Runway görev tabanlı modeller için eklenti sahipliğinde video oluşturma sağlayıcısı kaydı
- `minimax`: eklenti sahipliğinde kataloglar, Hailuo video modelleri için paketlenmiş video oluşturma sağlayıcısı
  kaydı, `image-01` için paketlenmiş görüntü oluşturma sağlayıcısı
  kaydı, hibrit Anthropic/OpenAI replay-policy
  seçimi ve kullanım auth/snapshot mantığı
- `together`: eklenti sahipliğinde kataloglar ve ayrıca Wan video modelleri için paketlenmiş video oluşturma sağlayıcısı
  kaydı
- `xiaomi`: eklenti sahipliğinde kataloglar ve ayrıca kullanım auth/snapshot mantığı

Paketlenmiş `openai` eklentisi artık her iki sağlayıcı kimliğini de sahipleniyor: `openai` ve
`openai-codex`.

Bu, hâlâ OpenClaw'ın normal transport'larına uyan sağlayıcıları kapsar. Tamamen
özel bir istek yürütücüsü gerektiren bir sağlayıcı, ayrı ve daha derin bir genişletme
yüzeyidir.

## API anahtarı rotasyonu

- Seçili sağlayıcılar için genel sağlayıcı rotasyonunu destekler.
- Birden çok anahtarı şu yollarla yapılandırın:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek live override, en yüksek öncelik)
  - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
  - `<PROVIDER>_API_KEY` (birincil anahtar)
  - `<PROVIDER>_API_KEY_*` (numaralı liste, örn. `<PROVIDER>_API_KEY_1`)
- Google sağlayıcıları için `GOOGLE_API_KEY` de geri dönüş olarak dahildir.
- Anahtar seçimi sırası önceliği korur ve değerlerin yinelenmesini kaldırır.
- İstekler yalnızca rate-limit yanıtlarında bir sonraki anahtarla yeniden denenir (örneğin
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` veya dönemsel kullanım sınırı mesajları).
- Rate-limit dışı hatalar hemen başarısız olur; anahtar rotasyonu denenmez.
- Tüm aday anahtarlar başarısız olduğunda, son hata son denemeden döndürülür.

## Yerleşik sağlayıcılar (pi-ai catalog)

OpenClaw, pi‑ai catalog ile birlikte gelir. Bu sağlayıcılar için
`models.providers` yapılandırması gerekmez; yalnızca auth ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Auth: `OPENAI_API_KEY`
- İsteğe bağlı rotasyon: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` ve ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek override)
- Örnek modeller: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan transport `auto`dur (önce WebSocket, sonra SSE geri dönüşü)
- Model başına geçersiz kılma: `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket ısınma varsayılanı `params.openaiWsWarmup` ile etkin gelir (`true`/`false`)
- OpenAI öncelikli işleme `agents.defaults.models["openai/<model>"].params.serviceTier` ile etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` olarak eşler
- Paylaşılan `/fast` geçişi yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw ilişkilendirme başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca `api.openai.com` adresine giden yerel OpenAI trafiğinde uygulanır,
  genel OpenAI uyumlu proxy'lerde uygulanmaz
- Yerel OpenAI rotaları ayrıca Responses `store`, prompt-cache ipuçları ve
  OpenAI reasoning-compat payload şekillendirmesini korur; proxy rotaları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API bunu reddettiği için OpenClaw'da bilinçli olarak bastırılır; Spark yalnızca Codex'e özel kabul edilir

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- İsteğe bağlı rotasyon: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` ve ayrıca `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek override)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan herkese açık Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarı ve OAuth ile kimliği doğrulanmış trafik dahil olmak üzere paylaşılan `/fast` geçişini ve `params.fastMode` değerini destekler; OpenClaw bunu Anthropic `service_tier` (`auto` vs `standard_only`) olarak eşler
- Anthropic notu: Anthropic çalışanları, OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize bildirdi; bu nedenle OpenClaw, Anthropic yeni bir ilke yayımlamadıkça Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylı kabul eder.
- Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak kullanılmaya devam eder, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

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
- Varsayılan transport `auto`dur (önce WebSocket, sonra SSE geri dönüşü)
- Model başına geçersiz kılma: `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier`, yerel Codex Responses isteklerinde (`chatgpt.com/backend-api`) de iletilir
- Gizli OpenClaw ilişkilendirme başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca
  `chatgpt.com/backend-api` adresine giden yerel Codex trafiğine eklenir, genel OpenAI uyumlu proxy'lere eklenmez
- Doğrudan `openai/*` ile aynı `/fast` geçişini ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` olarak eşler
- `openai-codex/gpt-5.3-codex-spark`, Codex OAuth catalog bunu sunduğunda kullanılabilir kalır; entitlement'e bağlıdır
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

- [Qwen Cloud](/tr/providers/qwen): Qwen Cloud sağlayıcı yüzeyi ve ayrıca Alibaba DashScope ile Coding Plan endpoint eşlemesi
- [MiniMax](/tr/providers/minimax): MiniMax Coding Plan OAuth veya API anahtarı erişimi
- [GLM Models](/tr/providers/glm): Z.AI Coding Plan veya genel API endpoint'leri

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
- İsteğe bağlı rotasyon: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` geri dönüşü ve `OPENCLAW_LIVE_GEMINI_KEY` (tek override)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` olarak normalleştirilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Doğrudan Gemini çalıştırmaları ayrıca `agents.defaults.models["google/<model>"].params.cachedContent`
  (veya eski `cached_content`) kabul eder; bu, sağlayıcıya özgü bir
  `cachedContents/...` tanıtıcısını iletmek içindir; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Auth: Vertex, gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır
- Dikkat: OpenClaw içindeki Gemini CLI OAuth resmi olmayan bir entegrasyondur. Bazı kullanıcılar, üçüncü taraf istemciler kullandıktan sonra Google hesaplarında kısıtlamalar bildiriyor. Devam etmeyi seçerseniz Google şartlarını inceleyin ve kritik olmayan bir hesap kullanın.
- Gemini CLI OAuth, paketlenmiş `google` eklentisinin bir parçası olarak gönderilir.
  - Önce Gemini CLI'yi yükleyin:
    - `brew install gemini-cli`
    - veya `npm install -g @google/gemini-cli`
  - Etkinleştirme: `openclaw plugins enable google`
  - Giriş: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
  - Not: `openclaw.json` içine bir istemci kimliği veya sır yapıştırmazsınız. CLI giriş akışı
    belirteçleri gateway host üzerindeki auth profillerinde saklar.
  - Girişten sonra istekler başarısız olursa, gateway host üzerinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  - Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım verisi
    `stats` üzerinden geri döner ve `stats.cached` OpenClaw `cacheRead` olarak normalleştirilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Auth: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` olarak normalleştirilir
  - `zai-api-key`, eşleşen Z.AI endpoint'ini otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorlar

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
- Temel URL: `https://api.kilo.ai/api/gateway/`
- Statik geri dönüş kataloğu `kilocode/kilo/auto` ile gelir; canlı
  `https://api.kilo.ai/api/gateway/models` keşfi çalışma zamanı
  kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam upstream yönlendirme Kilo Gateway'e aittir,
  OpenClaw içinde sabit kodlanmış değildir.

Kurulum ayrıntıları için bkz. [/providers/kilocode](/tr/providers/kilocode).

### Diğer paketlenmiş sağlayıcı eklentileri

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Örnek model: `openrouter/auto`
- OpenClaw, OpenRouter'ın belgelenmiş uygulama ilişkilendirme başlıklarını yalnızca
  istek gerçekten `openrouter.ai` adresine gidiyorsa uygular
- OpenRouter'a özgü Anthropic `cache_control` işaretçileri de aynı şekilde
  doğrulanmış OpenRouter rotalarıyla sınırlıdır, rastgele proxy URL'leriyle değil
- OpenRouter, proxy tarzı OpenAI uyumlu yol üzerinde kalır; bu nedenle yerel
  yalnızca OpenAI istek şekillendirmesi (`serviceTier`, Responses `store`,
  prompt-cache ipuçları, OpenAI reasoning-compat payload'ları) iletilmez
- Gemini tabanlı OpenRouter başvuruları yalnızca proxy-Gemini thought-signature temizliğini korur;
  yerel Gemini replay doğrulaması ve bootstrap yeniden yazımları kapalı kalır
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Örnek model: `kilocode/kilo/auto`
- Gemini tabanlı Kilo başvuruları aynı proxy-Gemini thought-signature
  temizleme yolunu korur; `kilocode/kilo/auto` ve proxy reasoning'i desteklemeyen diğer ipuçları
  proxy reasoning eklemeyi atlar
- MiniMax: `minimax` (API anahtarı) ve `minimax-portal` (OAuth)
- Auth: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`
- Örnek model: `minimax/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7`
- MiniMax ilk kurulumu/API anahtarı kurulumu, `input: ["text", "image"]` ile açık M2.7 model tanımları yazar; paketlenmiş sağlayıcı kataloğu, o sağlayıcı yapılandırması somutlaştırılana kadar sohbet başvurularını yalnızca metin olarak tutar
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
  - Yerel paketlenmiş xAI istekleri xAI Responses yolunu kullanır
  - `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`,
    `grok-4` ve `grok-4-0709` değerlerini `*-fast` varyantlarına yeniden yazar
  - `tool_stream` varsayılan olarak açıktır; kapatmak için
    `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false`
    olarak ayarlayın
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Örnek model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras üzerindeki GLM modelleri `zai-glm-4.7` ve `zai-glm-4.6` kimliklerini kullanır.
  - OpenAI uyumlu temel URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference örnek modeli: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Bkz. [Hugging Face (Inference)](/tr/providers/huggingface).

## `models.providers` üzerinden sağlayıcılar (özel/base URL)

**Özel** sağlayıcılar veya
OpenAI/Anthropic uyumlu proxy'ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketlenmiş sağlayıcı eklentilerinin çoğu zaten varsayılan bir katalog yayımlar.
Varsayılan temel URL'yi, başlıkları veya model listesini geçersiz kılmak istediğinizde
yalnızca açık `models.providers.<id>` girdilerini kullanın.

### Moonshot AI (Kimi)

Moonshot paketlenmiş bir sağlayıcı eklentisi olarak gelir. Varsayılan olarak yerleşik sağlayıcıyı
kullanın ve yalnızca temel URL'yi veya model meta verisini geçersiz kılmanız
gerektiğinde açık bir `models.providers.moonshot` girdisi ekleyin:

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

Kimi Coding, Moonshot AI'nin Anthropic uyumlu endpoint'ini kullanır:

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

- Sağlayıcı: `volcengine` (kodlama: `volcengine-plan`)
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

İlk kurulum varsayılan olarak kodlama yüzeyini kullanır, ancak genel `volcengine/*`
catalog aynı anda kaydedilir.

İlk kurulum/yapılandırma model seçicilerinde, Volcengine auth choice hem
`volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

Kullanılabilir modeller:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Kodlama modelleri (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Uluslararası)

BytePlus ARK, uluslararası kullanıcılar için Volcano Engine ile aynı modellere erişim sağlar.

- Sağlayıcı: `byteplus` (kodlama: `byteplus-plan`)
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

İlk kurulum varsayılan olarak kodlama yüzeyini kullanır, ancak genel `byteplus/*`
catalog aynı anda kaydedilir.

İlk kurulum/yapılandırma model seçicilerinde, BytePlus auth choice hem
`byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

Kullanılabilir modeller:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Kodlama modelleri (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic, `synthetic` sağlayıcısının arkasında Anthropic uyumlu modeller sunar:

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

MiniMax, özel endpoint'ler kullandığı için `models.providers` üzerinden yapılandırılır:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Global): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (CN): `--auth-choice minimax-cn-api`
- Auth: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya
  `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçacıkları için bkz. [/providers/minimax](/tr/providers/minimax).

MiniMax'ın Anthropic uyumlu akış yolunda OpenClaw, siz açıkça ayarlamadığınız sürece
thinking'i varsayılan olarak devre dışı bırakır ve `/fast on`,
`MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

Eklenti sahipliğinde capability ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görüntü oluşturma `minimax/image-01` veya `minimax-portal/image-01` biçimindedir
- Görüntü anlama, her iki MiniMax auth yolunda da eklenti sahipliğinde `MiniMax-VL-01` olur
- Web search sağlayıcı kimliği olarak `minimax` üzerinde kalır

### Ollama

Ollama, paketlenmiş bir sağlayıcı eklentisi olarak gelir ve Ollama'nın yerel API'sini kullanır:

- Sağlayıcı: `ollama`
- Auth: Gerekmez (yerel sunucu)
- Örnek model: `ollama/llama3.3`
- Kurulum: [https://ollama.com/download](https://ollama.com/download)

```bash
# Önce Ollama'yı kurun, ardından bir model çekin:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama, `OLLAMA_API_KEY` ile katılım sağladığınızda yerel olarak `http://127.0.0.1:11434` adresinde
algılanır ve paketlenmiş sağlayıcı eklentisi Ollama'yı doğrudan
`openclaw onboard` ve model seçiciye ekler. İlk kurulum, bulut/yerel mod ve özel yapılandırma için
bkz. [/providers/ollama](/tr/providers/ollama).

### vLLM

vLLM, yerel/self-hosted OpenAI uyumlu
sunucular için paketlenmiş bir sağlayıcı eklentisi olarak gelir:

- Sağlayıcı: `vllm`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:8000/v1`

Yerelde otomatik keşfe katılmak için (sunucunuz auth zorlamıyorsa herhangi bir değer işe yarar):

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
OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı eklentisi olarak gelir:

- Sağlayıcı: `sglang`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:30000/v1`

Yerelde otomatik keşfe katılmak için (sunucunuz auth'u
zorlamıyorsa herhangi bir değer işe yarar):

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
  Atlandıklarında OpenClaw varsayılan olarak şunları kullanır:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Önerilir: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.
- Yerel olmayan endpoint'lerde `api: "openai-completions"` için (`baseUrl` boş olmayan ve ana bilgisayarı `api.openai.com` olmayan her değer), OpenClaw desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarını önlemek amacıyla `compat.supportsDeveloperRole: false` değerini zorlar.
- Proxy tarzı OpenAI uyumlu rotalar ayrıca yalnızca yerel OpenAI istek
  şekillendirmesini atlar: `service_tier` yok, Responses `store` yok, prompt-cache ipuçları yok,
  OpenAI reasoning-compat payload şekillendirmesi yok ve gizli OpenClaw ilişkilendirme
  başlıkları yok.
- `baseUrl` boşsa/atlanmışsa, OpenClaw varsayılan OpenAI davranışını korur (`api.openai.com` adresine çözümlenir).
- Güvenlik için, yerel olmayan `openai-completions` endpoint'lerinde açık `compat.supportsDeveloperRole: true` ayarı bile yine geçersiz kılınır.

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Ayrıca bkz.: tam yapılandırma örnekleri için [/gateway/configuration](/tr/gateway/configuration).

## İlgili

- [Models](/tr/concepts/models) — model yapılandırması ve takma adlar
- [Model Failover](/tr/concepts/model-failover) — geri dönüş zincirleri ve yeniden deneme davranışı
- [Configuration Reference](/tr/gateway/configuration-reference#agent-defaults) — model yapılandırma anahtarları
- [Providers](/tr/providers) — sağlayıcı başına kurulum kılavuzları
