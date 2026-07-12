---
read_when:
    - Önbellek saklama ile istem belirteci maliyetlerini azaltmak istiyorsunuz
    - Çok aracılı kurulumlarda aracı başına önbellek davranışına ihtiyacınız var
    - Heartbeat ile önbellek TTL temizliğini birlikte ayarlıyorsunuz
summary: İstem önbelleğe alma ayarları, birleştirme sırası, sağlayıcı davranışı ve ince ayar kalıpları
title: İstem önbelleğe alma
x-i18n:
    generated_at: "2026-07-12T12:12:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

İstem önbelleğe alma, bir model sağlayıcısının değişmemiş bir istem önekini (sistem/geliştirici talimatları, araç tanımları ve diğer kararlı bağlamlar) her istekte yeniden işlemek yerine turlar arasında yeniden kullanmasını sağlar. Bu, tekrarlanan bağlama sahip uzun süreli oturumlarda token maliyetini ve gecikmeyi azaltır.

OpenClaw, üst API bu sayaçları sunduğu her yerde sağlayıcı kullanımını `cacheRead` ve `cacheWrite` olarak normalleştirir. Kullanım özetleri (`/status` ve benzerleri), canlı oturum anlık görüntüsünde önbellek sayaçları bulunmadığında son transkript kullanım girdisine geri döner; sıfırdan farklı bir canlı değer her zaman geri dönüş değerine üstün gelir.

Sağlayıcı referansları:

- [Anthropic istem önbelleğe alma](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI istem önbelleğe alma](https://developers.openai.com/api/docs/guides/prompt-caching)

## Birincil ayarlar

### `cacheRetention`

Değerler: `"none" | "short" | "long"`. Genel varsayılan olarak, model başına ve aracı başına yapılandırılabilir.

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
        cacheRetention: "none" # bu aracı için her iki varsayılanı da geçersiz kılar
```

Birleştirme sırası (sonraki üstün gelir):

1. `agents.defaults.params` - tüm modeller için genel varsayılan
2. `agents.defaults.models["provider/model"].params` - model başına geçersiz kılma
3. `agents.list[].params` - aracı kimliğine göre eşleştirilen, aracı başına geçersiz kılma

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

Heartbeat, önbellek pencerelerini sıcak tutabilir ve boşta kalma aralarından sonra tekrarlanan önbellek yazmalarını azaltabilir. Genel olarak (`agents.defaults.heartbeat`) veya aracı başına (`agents.list[].heartbeat`) yapılandırılabilir.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Sağlayıcı davranışı

### Anthropic (doğrudan API ve Vertex AI)

- `cacheRetention`, `anthropic` ve `anthropic-vertex` sağlayıcıları için; ayrıca `cacheRetention` açıkça ayarlandığında `amazon-bedrock` üzerindeki Claude modelleri ve özel `anthropic-messages` uyumlu uç noktalar için desteklenir.
- Ayarlanmadığında OpenClaw, doğrudan Anthropic için `cacheRetention: "short"` değerini başlangıç olarak belirler (yalnızca `anthropic` ve `anthropic-vertex` sağlayıcıları; Anthropic ailesindeki diğer rotalar açık bir değer gerektirir).
- Yerel Anthropic Messages yanıtları, `cacheRead` ve `cacheWrite` ile eşlenen `cache_read_input_tokens` ve `cache_creation_input_tokens` değerlerini sunar.
- `cacheRetention: "short"`, varsayılan 5 dakikalık geçici önbelleğe eşlenir. `cacheRetention: "long"` açıkça ayarlandığında 1 saatlik TTL'yi (`cache_control: { type: "ephemeral", ttl: "1h" }`) ister. Örtük/ortam tarafından belirlenen uzun saklama (`OPENCLAW_CACHE_RETENTION=long`, açık bir `cacheRetention` olmadan), yalnızca `api.anthropic.com` veya Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) ana makinelerinde 1 saatlik TTL'ye yükseltilir; diğer ana makineler 5 dakikalık önbelleği korur.

Kaynak: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (doğrudan API)

- İstem önbelleğe alma, desteklenen güncel modellerde otomatiktir; OpenClaw blok düzeyinde önbellek işaretçileri eklemez.
- OpenClaw, önbellek yönlendirmesini turlar arasında kararlı tutmak için `prompt_cache_key` gönderir. Doğrudan `api.openai.com` ana makineleri bunu otomatik olarak alır. OpenAI uyumlu proxy'lerin (oMLX, llama.cpp, özel uç noktalar) katılmak için model yapılandırmasında `compat.supportsPromptCacheKey: true` kullanması gerekir; bu, bir proxy için hiçbir zaman otomatik algılanmaz.
- `prompt_cache_retention: "24h"`, yalnızca `cacheRetention: "long"` seçildiğinde ve çözümlenen uç nokta hem önbellek anahtarını hem de uzun saklamayı desteklediğinde (`compat.supportsLongCacheRetention`, varsayılan olarak `true`; Together AI ve Cloudflare uyumluluk profilleri bunu devre dışı bırakır) eklenir. `cacheRetention: "none"` her iki alanı da engeller.
- Önbellek isabetleri, `cacheRead` ile eşlenen `usage.prompt_tokens_details.cached_tokens` (Chat Completions) veya `input_tokens_details.cached_tokens` (Responses API) aracılığıyla sunulur.
- Responses API yükleri ayrıca `cacheWrite` ile eşlenen ve modelin önbellek yazma ücretine göre fiyatlandırılan `input_tokens_details.cache_write_tokens` değerini sunabilir; alanı içermeyen Responses yüklerinde `cacheWrite`, `0` olarak kalır. OpenAI'ın Chat Completions API'si bir `cache_write_tokens` sayacını belgelemese veya üretmese de OpenClaw, ayrı bir yazma sayısı bildiren OpenRouter uyumlu ve DeepSeek tarzı proxy'ler için buradaki `prompt_tokens_details.cache_write_tokens` değerini yine de okur.
- Uygulamada OpenAI, Anthropic'in hareketli tam geçmiş yeniden kullanımından çok ilk önek önbelleği gibi davranır; aşağıdaki [OpenAI canlı beklentileri](#openai-live-expectations) bölümüne bakın.

### Amazon Bedrock

- Anthropic Claude model referansları (`amazon-bedrock/*anthropic.claude*` ve AWS sistem çıkarım profili önekleri `us.`/`eu.`/`global.anthropic.claude*`) açık `cacheRetention` aktarımını destekler.
- Anthropic olmayan Bedrock modelleri (örneğin `amazon.nova-*`), yapılandırılmış herhangi bir `cacheRetention` değerinden bağımsız olarak çalışma zamanında önbellek saklama olmadan çözümlenir.
- Belirsiz Bedrock uygulama çıkarım profili ARN'leri (`claude` içermeyen profil kimlikleri), model ailesi yalnızca ARN'den çıkarılamadığı için `cacheRetention` açıkça ayarlanmadıkça önbellek saklama olmadan çözümlenir.

### OpenRouter

`openrouter/anthropic/*` model referansları için OpenClaw, sistem/geliştirici istem bloklarına Anthropic `cache_control` işaretçileri ekler; ancak bunu yalnızca istek doğrulanmış bir OpenRouter rotasını hedeflemeye devam ettiğinde (`openrouter`, varsayılan uç noktasında veya `openrouter.ai` olarak çözümlenen herhangi bir sağlayıcı/temel URL) yapar. Modeli rastgele bir OpenAI uyumlu proxy URL'sine yeniden yönlendirmek bu eklemeyi durdurur.

`contextPruning.mode: "cache-ttl"`, `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` ve `openrouter/zai/*` model referansları için kullanılabilir; çünkü bu rotalar, OpenClaw tarafından eklenen işaretçilere ihtiyaç duymadan sağlayıcı tarafında istem önbelleğe almayı yönetir.

Kaynak: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

OpenRouter üzerinde DeepSeek önbellek oluşturma en iyi çaba esasına dayanır ve birkaç saniye sürebilir; hemen ardından gönderilen bir istek yine de `cached_tokens: 0` gösterebilir. Kısa bir gecikmeden sonra aynı öneke sahip isteği yineleyerek ve önbellek isabeti sinyali olarak `usage.prompt_tokens_details.cached_tokens` değerini kullanarak doğrulayın.

### Google Gemini (doğrudan API)

- Doğrudan Gemini aktarımı (`api: "google-generative-ai"`), önbellek isabetlerini `cacheRead` ile eşlenen üst sağlayıcı `cachedContentTokenCount` değeri üzerinden bildirir.
- Uygun model aileleri: `gemini-2.5*` ve `gemini-3*` (bu önek eşleşmesinin dışındaki Live/önizleme varyantlarını hariç tutar; örneğin `gemini-live-2.5-flash-preview`).
- Uygun bir modelde `cacheRetention` ayarlandığında OpenClaw, sistem istemi için bir `cachedContents` kaynağını otomatik olarak oluşturur, yeniden kullanır ve yeniler; elle sağlanan bir önbelleğe alınmış içerik tanıtıcısı gerekmez. TTL, `cacheRetention: "short"` için `300s`, `"long"` için `3600s` değerindedir.
- Önceden var olan bir Gemini önbelleğe alınmış içerik tanıtıcısını yine de `params.cachedContent` (veya eski `params.cached_content`) üzerinden iletebilirsiniz; açıkça belirtilen bir tanıtıcı, otomatik önbellek yönetimi yolunu tamamen atlar.
- Bu, Anthropic/OpenAI istem öneki önbelleğe almadan ayrıdır: OpenClaw, satır içi önbellek işaretçileri eklemek yerine Gemini için sağlayıcıya özgü bir `cachedContents` kaynağını yönetir.

Kaynak: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### CLI çalışma düzeneği sağlayıcıları (Claude Code, Gemini CLI)

JSONL kullanım olayları üreten CLI arka uçları (`jsonlDialect: "claude-stream-json"` veya `"gemini-stream-json"`), `cacheRead` ile eşlenen düz bir `cached` sayacı dahil olmak üzere çeşitli alan adı varyantlarını tanıyan ortak bir kullanım ayrıştırıcısından geçer. CLI'ın JSON yükü doğrudan bir giriş token alanını içermediğinde OpenClaw bunu `input_tokens - cached` olarak türetir. Bu yalnızca kullanım normalleştirmesidir; CLI tarafından çalıştırılan bu modeller için Anthropic/OpenAI tarzı istem önbelleği işaretçileri oluşturmaz.

Kaynak: `src/agents/cli-output.ts` (`toCliUsage`).

### Diğer sağlayıcılar

Bir sağlayıcı yukarıdaki önbellek modlarından hiçbirini desteklemiyorsa `cacheRetention` etkisizdir.

## Sistem istemi önbellek sınırı

OpenClaw, sistem istemini dahili bir önbellek öneki sınırında **kararlı önek** ve **değişken sonek** olarak böler. Sınırın üzerindeki içerik (araç tanımları, Skills meta verileri, çalışma alanı dosyaları), turlar arasında bayt düzeyinde aynı kalacak şekilde sıralanır. Sınırın altındaki içerik (örneğin `HEARTBEAT.md`, çalışma zamanı zaman damgaları ve tur başına diğer meta veriler), önbelleğe alınmış öneki geçersiz kılmadan değişebilir.

Temel tasarım tercihleri:

- Kararlı çalışma alanı proje bağlamı dosyaları `HEARTBEAT.md` dosyasından önce sıralanır; böylece Heartbeat değişimleri kararlı öneki bozmaz.
- Sınır; Anthropic ailesi, OpenAI ailesi, Google ve CLI aktarım biçimlendirmesinin tamamında uygulanır, böylece desteklenen tüm sağlayıcılar aynı önek kararlılığından yararlanır.
- Codex Responses ve Anthropic Vertex istekleri, önbellek yeniden kullanımının sağlayıcıların gerçekte aldığı içerikle uyumlu kalması için sınır farkındalığı olan önbellek biçimlendirmesinden geçirilir.
- Sistem istemi parmak izleri (boşluklar, satır sonları, kancalar tarafından eklenen bağlam ve çalışma zamanı yetenek sıralaması) normalleştirilir; böylece anlamsal olarak değişmemiş istemler turlar arasında önbelleği paylaşır.

Bir yapılandırma veya çalışma alanı değişikliğinden sonra beklenmedik `cacheWrite` artışları görürseniz değişikliğin önbellek sınırının üstüne mi, altına mı düştüğünü kontrol edin. Değişken içeriği sınırın altına taşımak (veya kararlı hâle getirmek) genellikle sorunu çözer.

## OpenClaw önbellek kararlılığı korumaları

- Birlikte sunulan MCP araç katalogları, araç kaydından önce belirlenimsel olarak (önce sunucu adına, ardından araç adına göre) sıralanır; böylece `listTools()` sırası değişiklikleri araçlar bloğunu sürekli değiştirmez ve istem önbelleği öneklerini bozmaz.
- Kalıcı görüntü bloklarına sahip eski oturumlar, **en son tamamlanan 3 turu** olduğu gibi korur (yalnızca görüntü içerenleri değil, tamamlanan tüm turları sayar). Daha eski, önceden işlenmiş görüntü blokları bir metin işaretçisiyle değiştirilir; böylece görüntü ağırlıklı takip istekleri büyük ve eski yükleri sürekli yeniden göndermez.

## Ayarlama örüntüleri

### Karma trafik (önerilen varsayılan)

Ana aracınızda uzun ömürlü bir temel kullanın, yoğun bildirim aracıları için önbelleğe almayı devre dışı bırakın:

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

### Maliyet öncelikli temel

- Temel `cacheRetention: "short"` değerini ayarlayın.
- `contextPruning.mode: "cache-ttl"` seçeneğini etkinleştirin.
- Heartbeat aralığını yalnızca sıcak önbelleklerden yararlanan aracılar için TTL değerinizin altında tutun.

## Canlı regresyon testleri

OpenClaw; tekrarlanan önekleri, araç turlarını, görüntü turlarını, MCP tarzı araç transkriptlerini ve bir Anthropic önbelleksiz kontrolünü kapsayan birleşik bir canlı önbellek regresyon geçidi çalıştırır.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Şununla çalıştırın:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Temel dosyası, en son gözlemlenen canlı sayıları ve testin denetlediği sağlayıcıya özgü regresyon alt sınırlarını saklar. Her çalıştırma, önceki önbellek durumunun geçerli örneği kirletmemesi için çalıştırmaya özgü yeni oturum kimlikleri ve istem ad alanları kullanır. Anthropic ve OpenAI farklı yaptırım yöntemleri kullanır: Anthropic alt sınırının karşılanmaması kesin bir regresyondur (test başarısız olur), OpenAI alt sınırının karşılanmaması ise yalnızca izlemeye yöneliktir (uyarı olarak kaydedilir, çalıştırmayı başarısız kılmaz). Sağlayıcılar arası tek bir ortak eşik kullanmazlar.

### Anthropic canlı beklentileri

- `cacheWrite` aracılığıyla açık ısınma yazmaları bekleyin.
- Anthropic'in önbellek denetimi, önbellek kesme noktasını konuşma boyunca ilerlettiğinden, yinelenen turlarda geçmişin neredeyse tamamının yeniden kullanılmasını bekleyin.
- Kararlı, araç, görüntü ve MCP tarzı hatlar için taban eşikleri kesin regresyon kapılarıdır.

### OpenAI canlı ortam beklentileri

- Yalnızca `cacheRead` bekleyin; Chat Completions'ta `cacheWrite` değeri `0` olarak kalır.
- Yinelenen turlardaki önbellek yeniden kullanımını, Anthropic tarzı hareketli tam geçmiş yeniden kullanımı olarak değil, sağlayıcıya özgü bir plato olarak değerlendirin.
- Eşikler yalnızca izleme amaçlıdır (bir eşik kaçırıldığında test başarısız olmaz, uyarı olarak günlüğe kaydedilir) ve `gpt-5.4-mini` üzerinde gözlemlenen canlı davranıştan türetilmiştir:

| Senaryo                 | `cacheRead` taban eşiği | İsabet oranı taban eşiği |
| ----------------------- | ----------------------: | -----------------------: |
| Kararlı ön ek           |                   4.608 |                     0,90 |
| Araç transkripti        |                   4.096 |                     0,85 |
| Görüntü transkripti     |                   3.840 |                     0,82 |
| MCP tarzı transkript    |                   4.096 |                     0,85 |

En son gözlemlenen temel değerler (`live-cache-regression-baseline.ts` dosyasından) şu şekilde gerçekleşti: kararlı ön ek `cacheRead=4864`, isabet oranı `0.966`; araç transkripti `cacheRead=4608`, isabet oranı `0.896`; görüntü transkripti `cacheRead=4864`, isabet oranı `0.954`; MCP tarzı transkript `cacheRead=4608`, isabet oranı `0.891`.

Doğrulamaların farklı olmasının nedeni: Anthropic açık önbellek kesme noktaları ve hareketli konuşma geçmişi yeniden kullanımı sunarken, OpenAI'ın canlı trafikte etkin biçimde yeniden kullanılabilen ön eki tam istemden daha önce platoya ulaşabilir. İki sağlayıcıyı sağlayıcılar arası tek bir yüzde eşiğine göre karşılaştırmak hatalı regresyonlara yol açar.

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

| Anahtar           | Varsayılan                                   |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Ortam değişkeni anahtarları (tek seferlik hata ayıklama)

| Değişken                             | Etki                                        |
| ------------------------------------ | ------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Önbellek izlemeyi etkinleştirir             |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Çıktı yolunu geçersiz kılar                 |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Tam ileti yükü yakalamayı açar veya kapatır |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | İstem metni yakalamayı açar veya kapatır    |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Sistem istemi yakalamayı açar veya kapatır  |

### İncelenecekler

- Önbellek izleme olayları; `session:loaded`, `prompt:before`, `stream:context` ve `session:after` gibi aşamalı anlık görüntüler içeren JSONL biçimindedir.
- Tur başına önbellek belirteci etkisi normal kullanım yüzeylerinde görülebilir: `cacheRead` ve `cacheWrite`; `/usage tokens`, `/status`, oturum kullanım özetleri ve özel `messages.usageTemplate` düzenlerinde gösterilir.
- Anthropic için önbelleğe alma etkinken hem `cacheRead` hem de `cacheWrite` bekleyin.
- OpenAI için önbellek isabetlerinde `cacheRead` bekleyin; `cacheWrite` yalnızca bunu içeren Responses API yüklerinde doldurulur (yukarıdaki [OpenAI](#openai-direct-api) bölümüne bakın).
- OpenAI ayrıca `x-request-id`, `openai-processing-ms` ve `x-ratelimit-*` gibi izleme ve hız sınırı üstbilgileri döndürür; bunları istek izleme için kullanın, ancak önbellek isabeti hesabı yine üstbilgilerden değil, kullanım yükünden alınmalıdır.

## Hızlı sorun giderme

- **Çoğu turda yüksek `cacheWrite`**: değişken sistem istemi girdilerini denetleyin; modelin/sağlayıcının önbellek ayarlarınızı desteklediğini doğrulayın.
- **Anthropic'te yüksek `cacheWrite`**: genellikle önbellek kesme noktasının her istekte değişen bir içeriğe denk geldiği anlamına gelir.
- **Düşük OpenAI `cacheRead`**: kararlı ön ekin en başta olduğunu, yinelenen ön ekin en az 1024 belirteç olduğunu ve önbelleği paylaşması gereken turlarda aynı `prompt_cache_key` değerinin yeniden kullanıldığını doğrulayın.
- **`cacheRetention` etkisiz**: model anahtarının `agents.defaults.models["provider/model"]` ile eşleştiğini doğrulayın.
- **Önbellek ayarları içeren Bedrock Nova istekleri**: beklenen davranıştır; bunlar çalışma zamanında önbellek saklama olmadan çözümlenir.

İlgili belgeler:

- [Anthropic](/tr/providers/anthropic)
- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [Oturum budama](/tr/concepts/session-pruning)
- [Gateway yapılandırma referansı](/tr/gateway/configuration-reference)

## İlgili

- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
