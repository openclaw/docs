---
read_when:
    - Önbellek saklama ile istem token maliyetlerini azaltmak istiyorsunuz
    - Çok aracılı kurulumlarda aracı başına önbellek davranışına ihtiyacınız vardır
    - Heartbeat ve önbellek TTL temizlemesini birlikte ayarlıyorsunuz
summary: İstem önbelleğe alma ayarları, birleştirme sırası, sağlayıcı davranışı ve ince ayar kalıpları
title: İstem önbelleğe alma
x-i18n:
    generated_at: "2026-07-16T17:56:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

Prompt önbelleğe alma, bir model sağlayıcısının değişmemiş bir istem önekini (sistem/geliştirici talimatları, araç tanımları ve diğer kararlı bağlam) her istekte yeniden işlemek yerine turlar arasında yeniden kullanmasına olanak tanır. Bu, tekrarlanan bağlam içeren uzun süreli oturumlarda token maliyetini ve gecikmeyi azaltır.

OpenClaw, yukarı akış API'sinin bu sayaçları sunduğu her yerde sağlayıcı kullanımını `cacheRead` ve `cacheWrite` olarak normalleştirir. Kullanım özetleri (`/status` ve benzerleri), canlı oturum anlık görüntüsünde önbellek sayaçları bulunmadığında son transkript kullanım girdisine geri döner; sıfır olmayan canlı değer her zaman geri dönüş değerine üstün gelir.

Sağlayıcı referansları:

- [Anthropic istem önbelleğe alma](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI istem önbelleğe alma](https://developers.openai.com/api/docs/guides/prompt-caching)

## Birincil ayarlar

### `cacheRetention`

Değerler: `"none" | "short" | "long"`. Genel varsayılan olarak, model başına ve ajan başına yapılandırılabilir.
`"standard"` bir takma ad değildir; sağlayıcının varsayılan önbellek penceresi için `"short"` kullanın. Geçersiz değerler bir uyarıyla yok sayılır.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # bu model için genel varsayılanı geçersiz kılar
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # bu ajan için her iki varsayılanı da geçersiz kılar
```

Birleştirme sırası (sonraki üstün gelir):

1. `agents.defaults.params` - tüm modeller için genel varsayılan
2. `agents.defaults.models["provider/model"].params` - model başına geçersiz kılma
3. `agents.list[].params` - ajan kimliğine göre eşleştirilen ajan başına geçersiz kılma

Kaynak: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Önbellek TTL penceresi dolduktan sonra eski araç sonucu bağlamını budar; böylece boşta kalma sonrasındaki bir istek, aşırı büyük geçmişi yeniden önbelleğe almaz.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Tam davranış için [Oturum budama](/tr/concepts/session-pruning) bölümüne bakın.

### Heartbeat ile sıcak tutma

Heartbeat, önbellek pencerelerini sıcak tutabilir ve boşta kalma aralıklarından sonra tekrarlanan önbellek yazımlarını azaltabilir. Genel olarak (`agents.defaults.heartbeat`) veya ajan başına (`agents.list[].heartbeat`) yapılandırılabilir.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Sağlayıcı davranışı

### Anthropic (doğrudan API ve Vertex AI)

- `cacheRetention`; `anthropic` ve `anthropic-vertex` sağlayıcılarının yanı sıra `amazon-bedrock` üzerindeki Claude modelleri ve `cacheRetention` açıkça ayarlandığında özel `anthropic-messages` uyumlu uç noktalar için desteklenir.
- Ayarlanmadığında OpenClaw, doğrudan Anthropic için `cacheRetention: "short"` değerini başlangıç olarak kullanır (yalnızca `anthropic` ve `anthropic-vertex` sağlayıcıları; diğer Anthropic ailesi rotaları açık bir değer gerektirir).
- Yerel Anthropic Messages yanıtları, `cacheRead` ve `cacheWrite` değerlerine eşlenen `cache_read_input_tokens` ve `cache_creation_input_tokens` alanlarını sunar.
- `cacheRetention: "short"`, varsayılan 5 dakikalık geçici önbelleğe eşlenir. `cacheRetention: "long"`, açıkça ayarlandığında 1 saatlik TTL'yi (`cache_control: { type: "ephemeral", ttl: "1h" }`) ister. Örtük/ortam değişkeniyle belirlenen uzun saklama (`OPENCLAW_CACHE_RETENTION=long`, açık bir `cacheRetention` olmadan) yalnızca `api.anthropic.com` veya Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) ana makinelerinde 1 saatlik TTL'ye yükseltilir; diğer ana makineler 5 dakikalık önbelleği korur.

Kaynak: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (doğrudan API)

- İstem önbelleğe alma, desteklenen güncel modellerde otomatiktir; OpenClaw blok düzeyinde önbellek işaretçileri eklemez.
- OpenClaw, önbellek yönlendirmesini turlar arasında kararlı tutmak için `prompt_cache_key` gönderir. Doğrudan `api.openai.com` ana makineleri bunu otomatik olarak alır. OpenAI uyumlu proxy'lerin (oMLX, llama.cpp, özel uç noktalar) katılmak için model yapılandırmasında `compat.supportsPromptCacheKey: true` değerine ihtiyacı vardır; bu, bir proxy için hiçbir zaman otomatik olarak algılanmaz.
- `prompt_cache_retention: "24h"` yalnızca `cacheRetention: "long"` seçildiğinde ve çözümlenen uç nokta hem önbellek anahtarını hem de uzun süreli saklamayı desteklediğinde eklenir (`compat.supportsLongCacheRetention`, varsayılan olarak true; Together AI ve Cloudflare uyumluluk profilleri bunu devre dışı bırakır). `cacheRetention: "none"` her iki alanı da engeller.
- Önbellek isabetleri, `cacheRead` değerine eşlenen `usage.prompt_tokens_details.cached_tokens` (Chat Completions) veya `input_tokens_details.cached_tokens` (Responses API) üzerinden gösterilir.
- Responses API yükleri ayrıca `cacheWrite` değerine eşlenen ve modelin önbellek yazma oranıyla fiyatlandırılan `input_tokens_details.cache_write_tokens` alanını sunabilir; alanı içermeyen Responses yükleri `cacheWrite` değerini `0` olarak tutar. OpenAI'ın Chat Completions API'si bir `cache_write_tokens` sayacını belgelemez veya üretmez; ancak OpenClaw, ayrı bir yazma sayısı bildiren OpenRouter uyumlu ve DeepSeek tarzı proxy'ler için burada yine de `prompt_tokens_details.cache_write_tokens` alanını okur.
- Pratikte OpenAI, Anthropic'in hareketli tam geçmiş yeniden kullanımından çok başlangıç öneki önbelleği gibi davranır; aşağıdaki [OpenAI canlı beklentileri](#openai-live-expectations) bölümüne bakın.

### Amazon Bedrock

- Anthropic Claude model referansları (`amazon-bedrock/*anthropic.claude*` ile AWS sistem çıkarım profili önekleri `us.`/`eu.`/`global.anthropic.claude*`), açık `cacheRetention` aktarımını destekler.
- Anthropic dışındaki Bedrock modelleri (örneğin `amazon.nova-*`), yapılandırılmış herhangi bir `cacheRetention` değerinden bağımsız olarak çalışma zamanında önbellek saklaması olmayacak şekilde çözümlenir.
- Belirsiz Bedrock uygulama çıkarım profili ARN'leri (`claude` içermeyen profil kimlikleri) de `cacheRetention` açıkça ayarlanmadıkça önbellek saklaması olmayacak şekilde çözümlenir; çünkü model ailesi yalnızca ARN'den çıkarılamaz.

### OpenRouter

`openrouter/anthropic/*` model referansları için OpenClaw, sistem/geliştirici istem bloklarına Anthropic `cache_control` işaretçileri ekler; ancak yalnızca istek hâlâ doğrulanmış bir OpenRouter rotasını hedeflediğinde (`openrouter` varsayılan uç noktasında veya `openrouter.ai` olarak çözümlenen herhangi bir sağlayıcı/temel URL) bunu yapar. Modeli rastgele bir OpenAI uyumlu proxy URL'sine yeniden yönlendirmek bu eklemeyi durdurur.

`contextPruning.mode: "cache-ttl"`; `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` ve `openrouter/zai/*` model referansları için kullanılabilir; çünkü bu rotalar, OpenClaw'ın eklediği işaretçilere ihtiyaç duymadan sağlayıcı tarafında istem önbelleğe almayı işler.

Kaynak: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

OpenRouter üzerinde DeepSeek önbellek oluşturma en iyi çaba esasına dayanır ve birkaç saniye sürebilir; hemen ardından yapılan bir istek hâlâ `cached_tokens: 0` gösterebilir. Önbellek isabeti sinyali olarak `usage.prompt_tokens_details.cached_tokens` kullanarak kısa bir gecikmeden sonra aynı önekle tekrarlanan bir istekle doğrulayın.

### Google Gemini (doğrudan API)

- Doğrudan Gemini aktarımı (`api: "google-generative-ai"`), önbellek isabetlerini `cacheRead` değerine eşlenen yukarı akış `cachedContentTokenCount` alanı üzerinden bildirir.
- Uygun model aileleri: `gemini-2.5*` ve `gemini-3*` (bu önek eşleşmesinin dışındaki Live/önizleme varyantları hariç; örneğin `gemini-live-2.5-flash-preview`).
- Uygun bir modelde `cacheRetention` ayarlandığında OpenClaw, sistem istemi için otomatik olarak bir `cachedContents` kaynağı oluşturur, yeniden kullanır ve yeniler; elle önbelleğe alınmış içerik tanıtıcısı gerekmez. TTL, `cacheRetention: "short"` için `300s` ve `"long"` için `3600s` değeridir.
- Önceden var olan bir Gemini önbelleğe alınmış içerik tanıtıcısını `params.cachedContent` (veya eski `params.cached_content`) olarak yine de aktarabilirsiniz; açık bir tanıtıcı, otomatik önbellek yönetimi yolunu tamamen atlar.
- Bu, Anthropic/OpenAI istem öneki önbelleğe almadan ayrıdır: OpenClaw, satır içi önbellek işaretçileri eklemek yerine Gemini için sağlayıcıya özgü bir `cachedContents` kaynağını yönetir.

Kaynak: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### CLI çalışma çerçevesi sağlayıcıları (Claude Code, Gemini CLI)

JSONL kullanım olayları (`jsonlDialect: "claude-stream-json"` veya `"gemini-stream-json"`) üreten CLI arka uçları, `cacheRead` değerine eşlenen düz bir `cached` sayacı dâhil olmak üzere çeşitli alan adı varyantlarını tanıyan ortak bir kullanım ayrıştırıcısından geçer. CLI'ın JSON yükü doğrudan bir giriş token alanını içermediğinde OpenClaw bunu `input_tokens - cached` olarak türetir. Bu yalnızca kullanım normalleştirmesidir; CLI tarafından çalıştırılan bu modeller için Anthropic/OpenAI tarzı istem önbelleği işaretçileri oluşturmaz.

Kaynak: `src/agents/cli-output.ts` (`toCliUsage`).

### Diğer sağlayıcılar

Bir sağlayıcı yukarıdaki önbellek modlarından hiçbirini desteklemiyorsa `cacheRetention` etkisizdir.

## Sistem istemi önbellek sınırı

OpenClaw, sistem istemini dahili bir önbellek öneki sınırında **kararlı önek** ve **değişken sonek** olarak böler. Sınırın üzerindeki içerik (araç tanımları, Skills meta verileri, çalışma alanı dosyaları), turlar arasında bayt düzeyinde aynı kalacak biçimde sıralanır. Sınırın altındaki içerik (örneğin `HEARTBEAT.md`, çalışma zamanı zaman damgaları ve tur başına diğer meta veriler), önbelleğe alınmış öneki geçersiz kılmadan değişebilir.

Temel tasarım tercihleri:

- Kararlı çalışma alanı proje bağlamı dosyaları `HEARTBEAT.md` öncesinde sıralanır; böylece Heartbeat değişimleri kararlı öneki bozmaz.
- Sınır, Anthropic ailesi, OpenAI ailesi, Google ve CLI aktarım biçimlendirmesinin tamamında uygulanır; böylece desteklenen tüm sağlayıcılar aynı önek kararlılığından yararlanır.
- Codex Responses ve Anthropic Vertex istekleri, önbelleğin yeniden kullanımı sağlayıcıların gerçekte aldığı içerikle uyumlu kalsın diye sınır farkındalıklı önbellek biçimlendirmesi üzerinden yönlendirilir.
- Sistem istemi parmak izleri (boşluklar, satır sonları, hook tarafından eklenen bağlam ve çalışma zamanı yetenek sıralaması) normalleştirilir; böylece anlamsal olarak değişmemiş istemler turlar arasında aynı önbelleği paylaşır.

Bir yapılandırma veya çalışma alanı değişikliğinden sonra beklenmedik `cacheWrite` artışları görürseniz, değişikliğin önbellek sınırının üstüne mi yoksa altına mı geldiğini kontrol edin. Değişken içeriği sınırın altına taşımak (veya kararlı hâle getirmek) genellikle sorunu çözer.

## OpenClaw önbellek kararlılığı korumaları

- Paketle birlikte gelen MCP araç katalogları, araç kaydından önce belirlenimsel olarak (önce sunucu adına, ardından araç adına göre) sıralanır; böylece `listTools()` sıra değişiklikleri araçlar bloğunda değişim oluşturup istem önbelleği öneklerini bozmaz.
- Kalıcı görüntü blokları içeren eski oturumlar, **tamamlanmış en son 3 turu** eksiksiz tutar (yalnızca görüntü içerenler değil, tamamlanmış tüm turlar sayılır). Daha eski ve işlenmiş görüntü blokları bir metin işaretçisiyle değiştirilir; böylece görüntü ağırlıklı takip istekleri büyük ve eski yükleri tekrar tekrar göndermez.

## Ayarlama kalıpları

### Karma trafik (önerilen varsayılan)

Ana ajanınızda uzun ömürlü bir temel yapılandırmayı koruyun, ani yoğunluk yaşayan bildirim ajanlarında önbelleğe almayı devre dışı bırakın:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Önce maliyet temel yapılandırması

- Temel `cacheRetention: "short"` değerini ayarlayın.
- `contextPruning.mode: "cache-ttl"` özelliğini etkinleştirin.
- Heartbeat aralığını yalnızca sıcak önbelleklerden yararlanan ajanlar için TTL'nizin altında tutun.

## Canlı regresyon testleri

OpenClaw; tekrarlanan önekleri, araç turlarını, görüntü turlarını, MCP tarzı araç transkriptlerini ve bir Anthropic önbelleksiz kontrolünü kapsayan birleşik bir canlı önbellek regresyon kapısı çalıştırır.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Şununla çalıştırın:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Temel dosya, en son gözlemlenen canlı sayıları ve testin karşılaştırma yaptığı sağlayıcıya özgü regresyon alt sınırlarını saklar. Önceki önbellek durumunun geçerli örneklemi etkilememesi için her çalıştırma yeni, çalıştırmaya özgü oturum kimlikleri ve istem ad alanları kullanır. Anthropic ve OpenAI farklı yaptırım uygular: Anthropic alt sınırının karşılanmaması kesin bir regresyondur (test başarısız olur), OpenAI alt sınırının karşılanmaması ise yalnızca izleme amaçlıdır (uyarı olarak kaydedilir, çalıştırmayı başarısız kılmaz). Sağlayıcılar arası tek bir eşiği paylaşmazlar.

### Anthropic canlı ortam beklentileri

- `cacheWrite` aracılığıyla açık ısınma yazımları beklenir.
- Tekrarlanan turlarda geçmişin neredeyse tamamının yeniden kullanılması beklenir; çünkü Anthropic'in önbellek denetimi, önbellek kesme noktasını konuşma boyunca ilerletir.
- Kararlı, araç, görüntü ve MCP tarzı hatların temel alt sınırları kesin regresyon geçitleridir.

### OpenAI canlı ortam beklentileri

- Yalnızca `cacheRead` beklenir; `cacheWrite`, Chat Completions üzerinde `0` olarak kalır.
- Tekrarlanan turlardaki önbellek yeniden kullanımını, Anthropic tarzı hareketli tam geçmiş yeniden kullanımı olarak değil, sağlayıcıya özgü bir plato olarak değerlendirin.
- Alt sınırlar yalnızca izleme amaçlıdır (karşılanmaması test hatası değil, uyarı olarak günlüğe kaydedilir) ve `gpt-5.4-mini` üzerindeki gözlemlenmiş canlı davranıştan türetilmiştir:

| Senaryo              | `cacheRead` alt sınırı | İsabet oranı alt sınırı |
| -------------------- | ----------------: | -------------: |
| Kararlı ön ek        |             4,608 |           0.90 |
| Araç transkripti     |             4,096 |           0.85 |
| Görüntü transkripti  |             3,840 |           0.82 |
| MCP tarzı transkript |             4,096 |           0.85 |

En son gözlemlenen temel sayılar (`live-cache-regression-baseline.ts` kaynağından) şu değerlere ulaştı: kararlı ön ek `cacheRead=4864`, isabet oranı `0.966`; araç transkripti `cacheRead=4608`, isabet oranı `0.896`; görüntü transkripti `cacheRead=4864`, isabet oranı `0.954`; MCP tarzı transkript `cacheRead=4608`, isabet oranı `0.891`.

Doğrulamaların farklı olmasının nedeni: Anthropic açık önbellek kesme noktaları ve hareketli konuşma geçmişi yeniden kullanımı sunarken, OpenAI'ın canlı trafikteki etkin yeniden kullanılabilir ön eki tam istemden daha önce bir platoya ulaşabilir. İki sağlayıcıyı sağlayıcılar arası tek bir yüzde eşiğiyle karşılaştırmak yanlış regresyonlara yol açar.

## `diagnostics.cacheTrace` yapılandırması

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # isteğe bağlı
    includeMessages: false # varsayılan true
    includePrompt: false # varsayılan true
    includeSystem: false # varsayılan true
```

Varsayılanlar:

| Anahtar            | Varsayılan                                   |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Ortam değişkeni anahtarları (tek seferlik hata ayıklama)

| Değişken                             | Etki                                 |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | Önbellek izlemeyi etkinleştirir      |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Çıktı yolunu geçersiz kılar          |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Tam mesaj yükü yakalamayı açıp kapatır |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | İstem metni yakalamayı açıp kapatır  |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Sistem istemi yakalamayı açıp kapatır |

### İncelenecekler

- Önbellek izleme olayları; `session:loaded`, `prompt:before`, `stream:context` ve `session:after` gibi aşamalı anlık görüntüler içeren JSONL biçimindedir.
- Tur başına önbellek belirteci etkisi normal kullanım yüzeylerinde görülebilir: `cacheRead` ve `cacheWrite`; `/usage tokens`, `/status`, oturum kullanım özetleri ve özel `messages.usageTemplate` düzenlerinde görünür.
- Anthropic için önbelleğe alma etkinken hem `cacheRead` hem de `cacheWrite` beklenir.
- OpenAI için önbellek isabetlerinde `cacheRead` beklenir; `cacheWrite` yalnızca bunu içeren Responses API yüklerinde doldurulur (yukarıdaki [OpenAI](#openai-direct-api) bölümüne bakın).
- OpenAI ayrıca `x-request-id`, `openai-processing-ms` ve `x-ratelimit-*` gibi izleme ve hız sınırı üstbilgileri döndürür; bunları istek izleme için kullanın, ancak önbellek isabeti hesaplaması yine üstbilgilerden değil kullanım yükünden gelmelidir.

## Hızlı sorun giderme

- **Çoğu turda yüksek `cacheWrite`**: değişken sistem istemi girdilerini kontrol edin; modelin/sağlayıcının önbellek ayarlarınızı desteklediğini doğrulayın.
- **Anthropic'te yüksek `cacheWrite`**: genellikle önbellek kesme noktasının her istekte değişen içeriğe denk geldiği anlamına gelir.
- **Düşük OpenAI `cacheRead`**: kararlı ön ekin başta olduğunu, tekrarlanan ön ekin en az 1024 belirteç olduğunu ve önbelleği paylaşması gereken turlarda aynı `prompt_cache_key` değerinin yeniden kullanıldığını doğrulayın.
- **`cacheRetention` herhangi bir etki oluşturmuyor**: model anahtarının `agents.defaults.models["provider/model"]` ile eşleştiğini doğrulayın.
- **Önbellek ayarları içeren Bedrock Nova istekleri**: beklenen bir durumdur; bunlar çalışma zamanında önbellek tutulmamasına çözümlenir.

İlgili belgeler:

- [Anthropic](/tr/providers/anthropic)
- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [Oturum budama](/tr/concepts/session-pruning)
- [Gateway yapılandırma başvurusu](/tr/gateway/configuration-reference)

## İlgili

- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
