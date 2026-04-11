---
read_when:
    - Sağlayıcı bazında bir model kurulum başvurusuna ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalara veya CLI katılım komutlarına ihtiyacınız var
summary: Örnek yapılandırmalar + CLI akışlarıyla model sağlayıcısı genel bakışı
title: Model Sağlayıcıları
x-i18n:
    generated_at: "2026-04-11T02:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 910ea7895e74c03910757d9d3e02825754b779b204eca7275b28422647ed0151
    source_path: concepts/model-providers.md
    workflow: 15
---

# Model sağlayıcıları

Bu sayfa **LLM/model sağlayıcılarını** kapsar (WhatsApp/Telegram gibi sohbet kanallarını değil).
Model seçimi kuralları için bkz. [/concepts/models](/tr/concepts/models).

## Hızlı kurallar

- Model başvuruları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
- `agents.defaults.models` ayarlarsanız, bu izin listesi haline gelir.
- CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Geriye dönüş çalışma zamanı kuralları, bekleme süresi sondaları ve oturum geçersiz kılma kalıcılığı
  [/concepts/model-failover](/tr/concepts/model-failover) içinde belgelenmiştir.
- `models.providers.*.models[].contextWindow` doğal model meta verisidir;
  `models.providers.*.models[].contextTokens` ise etkili çalışma zamanı sınırıdır.
- Sağlayıcı eklentileri `registerProvider({ catalog })` aracılığıyla model katalogları ekleyebilir;
  OpenClaw bu çıktıyı `models.providers` içine birleştirir ve ardından
  `models.json` dosyasını yazar.
- Sağlayıcı bildirimleri `providerAuthEnvVars` ve
  `providerAuthAliases` tanımlayabilir; böylece genel env tabanlı kimlik doğrulama yoklamaları ve sağlayıcı varyantlarının
  eklenti çalışma zamanını yüklemesi gerekmez. Çekirdekte kalan env değişkeni eşlemesi artık
  yalnızca eklenti olmayan/çekirdek sağlayıcılar ve birkaç genel öncelik durumu içindir; örneğin
  Anthropic için önce API anahtarı kullanan katılım akışı.
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
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, ve
  `onModelSelected`.
- Not: sağlayıcı çalışma zamanı `capabilities` değeri, paylaşılan çalıştırıcı meta verisidir (sağlayıcı
  ailesi, döküm/araç farklılıkları, taşıma/önbellek ipuçları). Bu,
  bir eklentinin ne kaydettiğini açıklayan [genel yetenek modeli](/tr/plugins/architecture#public-capability-model)
  ile aynı şey değildir (metin çıkarımı, konuşma vb.).
- Paketlenmiş `codex` sağlayıcısı, paketlenmiş Codex aracı koşumuyla eşleştirilmiştir.
  Codex'e ait oturum açma, model keşfi, doğal iş parçacığı sürdürme ve
  uygulama sunucusu yürütmesi istediğinizde `codex/gpt-*` kullanın. Düz `openai/gpt-*` başvuruları ise
  OpenAI sağlayıcısını ve normal OpenClaw sağlayıcı taşımasını kullanmaya devam eder.
  Yalnızca Codex dağıtımları otomatik PI geri dönüşünü
  `agents.defaults.embeddedHarness.fallback: "none"` ile devre dışı bırakabilir; bkz.
  [Codex Harness](/tr/plugins/codex-harness).

## Eklentiye ait sağlayıcı davranışı

Sağlayıcı eklentileri artık sağlayıcıya özgü mantığın çoğuna sahip olabilirken, OpenClaw
genel çıkarım döngüsünü korur.

Tipik ayrım:

- `auth[].run` / `auth[].runNonInteractive`: sağlayıcı, `openclaw onboard`, `openclaw models auth` ve etkileşimsiz kurulum için
  katılım/oturum açma akışlarına sahip olur
- `wizard.setup` / `wizard.modelPicker`: sağlayıcı, kimlik doğrulama seçimi etiketlerine,
  eski takma adlara, katılım izin listesi ipuçlarına ve katılım/model seçicilerindeki kurulum girdilerine sahip olur
- `catalog`: sağlayıcı `models.providers` içinde görünür
- `normalizeModelId`: sağlayıcı, arama veya kurallı hale getirme öncesinde
  eski/önizleme model kimliklerini normalleştirir
- `normalizeTransport`: sağlayıcı, genel model derlemesi öncesinde taşıma ailesi `api` / `baseUrl` değerlerini
  normalleştirir; OpenClaw önce eşleşen sağlayıcıyı,
  ardından taşıma üzerinde gerçekten değişiklik yapana kadar kanca özellikli diğer sağlayıcı eklentilerini denetler
- `normalizeConfig`: sağlayıcı, çalışma zamanı kullanmadan önce `models.providers.<id>` yapılandırmasını
  normalleştirir; OpenClaw önce eşleşen sağlayıcıyı,
  ardından yapılandırmayı gerçekten değiştirene kadar kanca özellikli diğer sağlayıcı eklentilerini denetler. Eğer hiçbir
  sağlayıcı kancası yapılandırmayı yeniden yazmazsa, paketlenmiş Google ailesi yardımcıları yine de
  desteklenen Google sağlayıcı girdilerini normalleştirir.
- `applyNativeStreamingUsageCompat`: sağlayıcı, yapılandırma sağlayıcıları için uç nokta güdümlü doğal akış kullanım uyumluluğu yeniden yazımlarını uygular
- `resolveConfigApiKey`: sağlayıcı, yapılandırma sağlayıcıları için tam çalışma zamanı kimlik doğrulamasını yüklemeye zorlamadan
  env işaretleyici kimlik doğrulamasını çözümler.
  `amazon-bedrock` burada ayrıca yerleşik bir AWS env işaretleyici çözümleyicisine sahiptir; Bedrock çalışma zamanı kimlik doğrulaması
  AWS SDK varsayılan zincirini kullansa da böyledir.
- `resolveSyntheticAuth`: sağlayıcı, düz metin gizli anahtarları kalıcı hale getirmeden
  yerel/self-hosted veya diğer yapılandırma destekli kimlik doğrulama kullanılabilirliğini açığa çıkarabilir
- `shouldDeferSyntheticProfileAuth`: sağlayıcı, saklanan sentetik profil
  yer tutucularını env/yapılandırma destekli kimlik doğrulamadan daha düşük öncelikli olarak işaretleyebilir
- `resolveDynamicModel`: sağlayıcı, yerel statik katalogda henüz bulunmayan model kimliklerini kabul eder
- `prepareDynamicModel`: sağlayıcının, dinamik çözümlemeyi yeniden denemeden önce meta veri yenilemesine ihtiyacı vardır
- `normalizeResolvedModel`: sağlayıcının taşıma veya temel URL yeniden yazımlarına ihtiyacı vardır
- `contributeResolvedModelCompat`: sağlayıcı, satıcıya ait modeller başka bir uyumlu taşıma üzerinden geldiğinde bile
  bunlar için uyumluluk bayrakları sağlar
- `capabilities`: sağlayıcı, döküm/araç/sağlayıcı ailesi farklılıklarını yayımlar
- `normalizeToolSchemas`: sağlayıcı, gömülü çalıştırıcı bunları görmeden önce araç şemalarını temizler
- `inspectToolSchemas`: sağlayıcı, normalleştirmeden sonra taşıma özelindeki şema uyarılarını ortaya çıkarır
- `resolveReasoningOutputMode`: sağlayıcı, doğal ve etiketli
  akıl yürütme çıktısı sözleşmeleri arasında seçim yapar
- `prepareExtraParams`: sağlayıcı, model başına istek parametreleri için varsayılanları ayarlar veya bunları normalleştirir
- `createStreamFn`: sağlayıcı, normal akış yolunu tamamen
  özel bir taşıma ile değiştirir
- `wrapStreamFn`: sağlayıcı, istek üstbilgisi/gövdesi/model uyumluluk sarmalayıcıları uygular
- `resolveTransportTurnState`: sağlayıcı, tur başına doğal taşıma
  üstbilgileri veya meta verileri sağlar
- `resolveWebSocketSessionPolicy`: sağlayıcı, doğal WebSocket oturumu
  üstbilgileri veya oturum bekleme politikası sağlar
- `createEmbeddingProvider`: sağlayıcı, çekirdek embedding yönlendirme panosu yerine sağlayıcı eklentisine ait olduğunda
  bellek embedding davranışına sahip olur
- `formatApiKey`: sağlayıcı, depolanan kimlik doğrulama profillerini taşımanın beklediği çalışma zamanı
  `apiKey` dizesine dönüştürür
- `refreshOAuth`: paylaşılan `pi-ai`
  yenileyicileri yeterli olmadığında OAuth yenilemesine sağlayıcı sahip olur
- `buildAuthDoctorHint`: OAuth yenilemesi
  başarısız olduğunda sağlayıcı onarım rehberi ekler
- `matchesContextOverflowError`: sağlayıcı, genel sezgilerin gözden kaçıracağı
  sağlayıcıya özgü bağlam penceresi taşma hatalarını tanır
- `classifyFailoverReason`: sağlayıcı, sağlayıcıya özgü ham taşıma/API
  hatalarını oran sınırı veya aşırı yük gibi geri dönüş nedenlerine eşler
- `isCacheTtlEligible`: sağlayıcı, hangi üst akış model kimliklerinin istem önbelleği TTL'sini desteklediğine karar verir
- `buildMissingAuthMessage`: sağlayıcı, genel kimlik doğrulama deposu hatasını
  sağlayıcıya özgü bir kurtarma ipucuyla değiştirir
- `suppressBuiltInModel`: sağlayıcı, eski üst akış satırlarını gizler ve
  doğrudan çözümleme başarısızlıkları için satıcıya ait bir hata döndürebilir
- `augmentModelCatalog`: sağlayıcı, keşif ve yapılandırma birleştirmesinden sonra
  sentetik/nihai katalog satırları ekler
- `isBinaryThinking`: sağlayıcı, ikili açık/kapalı düşünme deneyimine sahip olur
- `supportsXHighThinking`: sağlayıcı, seçili modelleri `xhigh` için etkinleştirir
- `resolveDefaultThinkingLevel`: sağlayıcı, bir
  model ailesi için varsayılan `/think` politikasına sahip olur
- `applyConfigDefaults`: sağlayıcı, kimlik doğrulama modu, env veya model ailesine göre
  yapılandırma somutlaştırması sırasında sağlayıcıya özgü genel varsayılanları uygular
- `isModernModelRef`: sağlayıcı, canlı/smoke tercih edilen model eşleşmesine sahip olur
- `prepareRuntimeAuth`: sağlayıcı, yapılandırılmış bir kimlik bilgisini kısa ömürlü
  bir çalışma zamanı belirtecine dönüştürür
- `resolveUsageAuth`: sağlayıcı, `/usage`
  ve ilgili durum/raporlama yüzeyleri için kullanım/kota kimlik bilgilerini çözümler
- `fetchUsageSnapshot`: sağlayıcı, kullanım uç noktası getirme/ayrıştırmasına sahip olurken
  çekirdek yine de özet kabuğuna ve biçimlendirmeye sahip olur
- `onModelSelected`: sağlayıcı, telemetri veya sağlayıcıya ait oturum kayıtları gibi
  seçim sonrası yan etkilere sahip olur

Mevcut paketlenmiş örnekler:

- `anthropic`: Claude 4.6 ileri uyumluluk geri dönüşü, kimlik doğrulama onarım ipuçları, kullanım
  uç noktası getirme, cache-TTL/sağlayıcı ailesi meta verisi ve kimlik doğrulamaya duyarlı genel
  yapılandırma varsayılanları
- `amazon-bedrock`: Bedrock'a özgü boğma/hazır değil hataları için sağlayıcıya ait bağlam taşması eşleştirme ve geri dönüş
  nedeni sınıflandırması; ayrıca Anthropic trafiğinde yalnızca Claude geri oynatma ilkesi
  korumaları için paylaşılan `anthropic-by-model` yeniden oynatma ailesi
- `anthropic-vertex`: Anthropic-message
  trafiğinde yalnızca Claude geri oynatma ilkesi korumaları
- `openrouter`: doğrudan geçen model kimlikleri, istek sarmalayıcıları, sağlayıcı yetenek
  ipuçları, proxy Gemini trafiğinde Gemini thought-signature temizleme, `openrouter-thinking` akış ailesi üzerinden proxy
  akıl yürütme ekleme, yönlendirme meta verisi iletimi ve cache-TTL ilkesi
- `github-copilot`: katılım/cihaz oturum açma, ileri uyumluluk model geri dönüşü,
  Claude düşünme döküm ipuçları, çalışma zamanı belirteç değişimi ve kullanım uç noktası
  getirme
- `openai`: GPT-5.4 ileri uyumluluk geri dönüşü, doğrudan OpenAI taşıma
  normalleştirmesi, Codex farkındalıklı eksik kimlik doğrulama ipuçları, Spark bastırma, sentetik
  OpenAI/Codex katalog satırları, düşünme/canlı model ilkesi, kullanım belirteci takma ad
  normalleştirmesi (`input` / `output` ve `prompt` / `completion` aileleri), doğal OpenAI/Codex
  sarmalayıcıları için paylaşılan `openai-responses-defaults` akış ailesi, sağlayıcı ailesi meta verisi, paketlenmiş görsel oluşturma sağlayıcısı
  kaydı `gpt-image-1` için ve paketlenmiş video oluşturma sağlayıcısı
  kaydı `sora-2` için
- `google` ve `google-gemini-cli`: Gemini 3.1 ileri uyumluluk geri dönüşü,
  doğal Gemini yeniden oynatma doğrulaması, bootstrap yeniden oynatma temizleme, etiketli
  akıl yürütme çıktısı modu, modern model eşleştirme, Gemini image-preview modelleri için paketlenmiş görsel oluşturma
  sağlayıcısı kaydı ve Veo modelleri için paketlenmiş
  video oluşturma sağlayıcısı kaydı; ayrıca Gemini CLI OAuth,
  kullanım yüzeyleri için kimlik doğrulama profili belirteç biçimlendirmesine, kullanım belirteci ayrıştırmasına ve kota uç noktası
  getirmesine de sahiptir
- `moonshot`: paylaşılan taşıma, eklentiye ait düşünme yükü normalleştirmesi
- `kilocode`: paylaşılan taşıma, eklentiye ait istek üstbilgileri, akıl yürütme yükü
  normalleştirmesi, proxy-Gemini thought-signature temizleme ve cache-TTL
  ilkesi
- `zai`: GLM-5 ileri uyumluluk geri dönüşü, `tool_stream` varsayılanları, cache-TTL
  ilkesi, ikili düşünme/canlı model ilkesi ve kullanım kimlik doğrulaması + kota getirme;
  bilinmeyen `glm-5*` kimlikleri paketlenmiş `glm-4.7` şablonundan sentetik olarak oluşturulur
- `xai`: doğal Responses taşıma normalleştirmesi, Grok hızlı varyantları için `/fast` takma ad yeniden yazımları,
  varsayılan `tool_stream`, xAI'ye özgü araç şeması /
  akıl yürütme yükü temizliği ve `grok-imagine-video` için paketlenmiş video oluşturma sağlayıcısı
  kaydı
- `mistral`: eklentiye ait yetenek meta verisi
- `opencode` ve `opencode-go`: eklentiye ait yetenek meta verisi ve ayrıca
  proxy-Gemini thought-signature temizleme
- `alibaba`: `alibaba/wan2.6-t2v` gibi doğrudan Wan model başvuruları için eklentiye ait video oluşturma kataloğu
- `byteplus`: eklentiye ait kataloglar ve ayrıca Seedance metinden videoya/görselden videoya modelleri için paketlenmiş video oluşturma sağlayıcısı
  kaydı
- `fal`: barındırılan üçüncü taraf görüntü modelleri için paketlenmiş görsel oluşturma sağlayıcısı
  kaydı ve ayrıca barındırılan üçüncü taraf video modelleri için paketlenmiş
  video oluşturma sağlayıcısı kaydı
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` ve `volcengine`:
  yalnızca eklentiye ait kataloglar
- `qwen`: metin modelleri için eklentiye ait kataloglar ve ayrıca
  çok kipli yüzeyleri için paylaşılan media-understanding ve video oluşturma sağlayıcısı kayıtları;
  Qwen video oluşturma, `wan2.6-t2v` ve `wan2.7-r2v` gibi paketlenmiş Wan modelleriyle Standard DashScope video
  uç noktalarını kullanır
- `runway`: `gen4.5` gibi doğal
  Runway görev tabanlı modeller için eklentiye ait video oluşturma sağlayıcısı kaydı
- `minimax`: eklentiye ait kataloglar, Hailuo video modelleri için paketlenmiş video oluşturma sağlayıcısı
  kaydı, `image-01` için paketlenmiş görsel oluşturma sağlayıcısı
  kaydı, hibrit Anthropic/OpenAI yeniden oynatma ilkesi
  seçimi ve kullanım kimlik doğrulaması/anlık görüntü mantığı
- `together`: eklentiye ait kataloglar ve ayrıca Wan video modelleri için paketlenmiş video oluşturma sağlayıcısı
  kaydı
- `xiaomi`: eklentiye ait kataloglar ve ayrıca kullanım kimlik doğrulaması/anlık görüntü mantığı

Paketlenmiş `openai` eklentisi artık her iki sağlayıcı kimliğine de sahiptir: `openai` ve
`openai-codex`.

Bu, hâlâ OpenClaw'ın normal taşımalarına uyan sağlayıcıları kapsar. Tamamen
özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı ise ayrı, daha derin bir genişletme yüzeyidir.

## API anahtarı rotasyonu

- Seçili sağlayıcılar için genel sağlayıcı rotasyonunu destekler.
- Birden fazla anahtarı şununla yapılandırın:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
  - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
  - `<PROVIDER>_API_KEY` (birincil anahtar)
  - `<PROVIDER>_API_KEY_*` (numaralandırılmış liste, ör. `<PROVIDER>_API_KEY_1`)
- Google sağlayıcıları için `GOOGLE_API_KEY` da geri dönüş olarak dahil edilir.
- Anahtar seçim sırası önceliği korur ve değerlerin tekrarını kaldırır.
- İstekler yalnızca oran sınırı yanıtlarında bir sonraki anahtarla yeniden denenir (
  örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` veya dönemsel kullanım sınırı mesajları).
- Oran sınırı dışındaki hatalar hemen başarısız olur; anahtar rotasyonu denenmez.
- Tüm aday anahtarlar başarısız olduğunda, son hata son denemeden döndürülür.

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla birlikte gelir. Bu sağlayıcılar için **hiç**
`models.providers` yapılandırması gerekmez; yalnızca kimlik doğrulamayı ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Kimlik doğrulama: `OPENAI_API_KEY`
- İsteğe bağlı rotasyon: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` ve ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan taşıma `auto`'dur (`WebSocket` önce, `SSE` geri dönüş)
- Model başına şununla geçersiz kılın: `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket ısındırma varsayılan olarak `params.openaiWsWarmup` (`true`/`false`) ile etkindir
- OpenAI öncelikli işleme, `agents.defaults.models["openai/<model>"].params.serviceTier` ile etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` değerine eşler
- Paylaşılan `/fast` anahtarı yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw atıf üstbilgileri (`originator`, `version`,
  `User-Agent`) yalnızca `api.openai.com` adresine giden doğal OpenAI trafiğinde uygulanır,
  genel OpenAI uyumlu proxy'lerde uygulanmaz
- Doğal OpenAI yolları ayrıca Responses `store`, istem önbelleği ipuçları ve
  OpenAI akıl yürütme uyumluluğu yük şekillendirmesini korur; proxy yolları bunu korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API bunu reddettiği için OpenClaw'da kasıtlı olarak bastırılmıştır; Spark yalnızca Codex olarak değerlendirilir

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Kimlik doğrulama: `ANTHROPIC_API_KEY`
- İsteğe bağlı rotasyon: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` ve ayrıca `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek geçersiz kılma)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan genel Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarı ve OAuth kimlik doğrulamalı trafik dahil olmak üzere, paylaşılan `/fast` anahtarını ve `params.fastMode` seçeneğini de destekler; OpenClaw bunu Anthropic `service_tier` değerine (`auto` ve `standard_only`) eşler
- Anthropic notu: Anthropic personeli bize OpenClaw tarzı Claude CLI kullanımına tekrar izin verildiğini söyledi, bu nedenle Anthropic yeni bir ilke yayımlamadıkça OpenClaw bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını izinli kabul eder.
- Anthropic kurulum belirteci, desteklenen bir OpenClaw belirteç yolu olarak kullanılmaya devam eder, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

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
- Varsayılan taşıma `auto`'dur (`WebSocket` önce, `SSE` geri dönüş)
- Model başına şununla geçersiz kılın: `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier` doğal Codex Responses isteklerinde de iletilir (`chatgpt.com/backend-api`)
- Gizli OpenClaw atıf üstbilgileri (`originator`, `version`,
  `User-Agent`) yalnızca `chatgpt.com/backend-api` adresine giden doğal Codex trafiğinde
  eklenir, genel OpenAI uyumlu proxy'lerde eklenmez
- Doğrudan `openai/*` ile aynı `/fast` anahtarını ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` değerine eşler
- `openai-codex/gpt-5.3-codex-spark`, Codex OAuth kataloğu bunu sunduğunda kullanılabilir olmaya devam eder; yetki haklarına bağlıdır
- `openai-codex/gpt-5.4`, doğal `contextWindow = 1050000` ve varsayılan çalışma zamanı `contextTokens = 272000` değerlerini korur; çalışma zamanı sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- İlke notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenmektedir.

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

- [Qwen Cloud](/tr/providers/qwen): Qwen Cloud sağlayıcı yüzeyi ve ayrıca Alibaba DashScope ile Coding Plan uç noktası eşlemesi
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
- İsteğe bağlı rotasyon: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` geri dönüşü ve `OPENCLAW_LIVE_GEMINI_KEY` (tek geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` olarak normalleştirilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Doğrudan Gemini çalıştırmaları ayrıca `agents.defaults.models["google/<model>"].params.cachedContent`
  (veya eski `cached_content`) seçeneğini de kabul eder; bu, sağlayıcıya özgü
  bir `cachedContents/...` tanıtıcısını iletmek içindir; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Kimlik doğrulama: Vertex, gcloud ADC kullanır; Gemini CLI ise kendi OAuth akışını kullanır
- Dikkat: OpenClaw içindeki Gemini CLI OAuth, resmi olmayan bir entegrasyondur. Bazı kullanıcılar üçüncü taraf istemcileri kullandıktan sonra Google hesaplarında kısıtlamalar bildirmiştir. Devam etmeyi seçerseniz Google şartlarını gözden geçirin ve kritik olmayan bir hesap kullanın.
- Gemini CLI OAuth, paketlenmiş `google` eklentisinin bir parçası olarak sunulur.
  - Önce Gemini CLI'yi yükleyin:
    - `brew install gemini-cli`
    - veya `npm install -g @google/gemini-cli`
  - Etkinleştirin: `openclaw plugins enable google`
  - Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
  - Not: bir istemci kimliği veya gizli anahtarı `openclaw.json` içine **yapıştırmazsınız**. CLI oturum açma akışı,
    belirteçleri ağ geçidi ana makinesindeki kimlik doğrulama profillerinde depolar.
  - Oturum açtıktan sonra istekler başarısız olursa, ağ geçidi ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  - Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım için geri dönüş olarak
    `stats` kullanılır ve `stats.cached`, OpenClaw `cacheRead` olarak normalleştirilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Kimlik doğrulama: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` olarak normalleştirilir
  - `zai-api-key`, eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` ise belirli bir yüzeyi zorlar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Kimlik doğrulama: `AI_GATEWAY_API_KEY`
- Örnek model: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Sağlayıcı: `kilocode`
- Kimlik doğrulama: `KILOCODE_API_KEY`
- Örnek model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Temel URL: `https://api.kilo.ai/api/gateway/`
- Statik geri dönüş kataloğu `kilocode/kilo/auto` ile gelir; canlı
  `https://api.kilo.ai/api/gateway/models` keşfi, çalışma zamanı
  kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam üst akış yönlendirmesi, OpenClaw içinde sabit kodlanmış değildir;
  bunun sahibi Kilo Gateway'dir.

Kurulum ayrıntıları için bkz. [/providers/kilocode](/tr/providers/kilocode).

### Diğer paketlenmiş sağlayıcı eklentileri

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Örnek model: `openrouter/auto`
- OpenClaw, OpenRouter'ın belgelenmiş uygulama atıf üstbilgilerini yalnızca
  istek gerçekten `openrouter.ai` adresine yöneliyorsa uygular
- OpenRouter'a özgü Anthropic `cache_control` işaretçileri de
  rastgele proxy URL'lerine değil, yalnızca doğrulanmış OpenRouter rotalarına uygulanır
- OpenRouter, proxy tarzı OpenAI uyumlu yol üzerinde kalır; bu nedenle doğal
  yalnızca-OpenAI istek şekillendirmesi (`serviceTier`, Responses `store`,
  istem önbelleği ipuçları, OpenAI akıl yürütme uyumluluğu yükleri) iletilmez
- Gemini destekli OpenRouter başvuruları yalnızca proxy-Gemini thought-signature temizliğini korur;
  doğal Gemini yeniden oynatma doğrulaması ve bootstrap yeniden yazımları kapalı kalır
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Örnek model: `kilocode/kilo/auto`
- Gemini destekli Kilo başvuruları aynı proxy-Gemini thought-signature
  temizleme yolunu korur; `kilocode/kilo/auto` ve proxy akıl yürütme desteği olmayan diğer
  ipuçları, proxy akıl yürütme eklemeyi atlar
- MiniMax: `minimax` (API anahtarı) ve `minimax-portal` (OAuth)
- Kimlik doğrulama: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`
- Örnek model: `minimax/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7`
- MiniMax katılımı/API anahtarı kurulumu, açık M2.7 model tanımları yazar ve
  `input: ["text", "image"]` kullanır; paketlenmiş sağlayıcı kataloğu, bu sağlayıcı yapılandırması somutlaştırılana kadar
  sohbet başvurularını yalnızca metin olarak tutar
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
    `grok-4` ve `grok-4-0709` modellerini kendi `*-fast` varyantlarına yeniden yazar
  - `tool_stream` varsayılan olarak açıktır; bunu
    devre dışı bırakmak için `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false` yapın
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
Yalnızca varsayılan
base URL, üstbilgiler veya model listesini geçersiz kılmak istediğinizde açık `models.providers.<id>` girdilerini kullanın.

### Moonshot AI (Kimi)

Moonshot, paketlenmiş bir sağlayıcı eklentisi olarak gelir. Varsayılan olarak
yerleşik sağlayıcıyı kullanın ve yalnızca base URL veya model meta verisini geçersiz kılmanız gerektiğinde
açık bir `models.providers.moonshot` girdisi ekleyin:

- Sağlayıcı: `moonshot`
- Kimlik doğrulama: `MOONSHOT_API_KEY`
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

Eski `kimi/k2p5`, uyumluluk model kimliği olarak kabul edilmeye devam eder.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎), Çin'de Doubao ve diğer modellere erişim sağlar.

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

Katılım varsayılan olarak coding yüzeyini kullanır, ancak genel `volcengine/*`
kataloğu da aynı anda kaydedilir.

Katılım/model yapılandırma seçicilerinde, Volcengine kimlik doğrulama seçeneği hem
`volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine
filtrelenmemiş kataloğa geri döner.

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

Katılım varsayılan olarak coding yüzeyini kullanır, ancak genel `byteplus/*`
kataloğu da aynı anda kaydedilir.

Katılım/model yapılandırma seçicilerinde, BytePlus kimlik doğrulama seçeneği hem
`byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine
filtrelenmemiş kataloğa geri döner.

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

MiniMax'ın Anthropic uyumlu akış yolunda, OpenClaw düşünmeyi
siz açıkça ayarlamadığınız sürece varsayılan olarak devre dışı bırakır ve `/fast on`,
`MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

Eklentiye ait yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görsel oluşturma `minimax/image-01` veya `minimax-portal/image-01` olarak yapılır
- Görsel anlama, her iki MiniMax kimlik doğrulama yolunda da eklentiye ait `MiniMax-VL-01` kullanır
- Web araması sağlayıcı kimliği `minimax` üzerinde kalır

### Ollama

Ollama, paketlenmiş bir sağlayıcı eklentisi olarak gelir ve Ollama'nın doğal API'sini kullanır:

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

Ollama, `OLLAMA_API_KEY` ile etkinleştirdiğinizde yerelde `http://127.0.0.1:11434` adresinde algılanır
ve paketlenmiş sağlayıcı eklentisi Ollama'yı doğrudan
`openclaw onboard` ve model seçiciye ekler. Katılım, bulut/yerel mod ve özel yapılandırma için
bkz. [/providers/ollama](/tr/providers/ollama).

### vLLM

vLLM, yerel/self-hosted OpenAI uyumlu
sunucular için paketlenmiş bir sağlayıcı eklentisi olarak gelir:

- Sağlayıcı: `vllm`
- Kimlik doğrulama: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:8000/v1`

Yerelde otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır):

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
- Kimlik doğrulama: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:30000/v1`

Yerelde otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı
zorunlu kılmıyorsa herhangi bir değer çalışır):

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
      models: { "lmstudio/my-local-model": { alias: "Yerel" } },
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
            name: "Yerel Model",
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
- Doğal olmayan uç noktalardaki `api: "openai-completions"` için (ana makinesi `api.openai.com` olmayan boş olmayan herhangi bir `baseUrl`), OpenClaw, desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarından kaçınmak amacıyla `compat.supportsDeveloperRole: false` değerini zorunlu kılar.
- Proxy tarzı OpenAI uyumlu yollar ayrıca doğal yalnızca-OpenAI istek
  şekillendirmesini de atlar: `service_tier` yok, Responses `store` yok, istem önbelleği ipuçları yok,
  OpenAI akıl yürütme uyumluluğu yük şekillendirmesi yok ve gizli OpenClaw atıf
  üstbilgileri yok.
- `baseUrl` boşsa/atlanmışsa, OpenClaw varsayılan OpenAI davranışını korur (`api.openai.com` adresine çözülür).
- Güvenlik için, açıkça belirtilen `compat.supportsDeveloperRole: true` değeri bile doğal olmayan `openai-completions` uç noktalarında yine geçersiz kılınır.

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
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agent-defaults) — model yapılandırma anahtarları
- [Sağlayıcılar](/tr/providers) — sağlayıcı bazında kurulum kılavuzları
