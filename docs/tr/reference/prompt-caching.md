---
read_when:
    - İstem belirteci maliyetlerini önbellek tutma ile azaltmak istiyorsunuz
    - Çok aracılı kurulumlarda aracı başına önbellek davranışına ihtiyacınız var
    - Heartbeat ve cache-ttl budamasını birlikte ayarlıyorsunuz
summary: İstem önbelleğe alma ayarları, birleştirme sırası, sağlayıcı davranışı ve ayarlama kalıpları
title: İstem önbelleğe alma
x-i18n:
    generated_at: "2026-06-28T01:15:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

İstem önbelleğe alma, model sağlayıcısının değişmeyen istem öneklerini (genellikle sistem/geliştirici talimatları ve diğer kararlı bağlam) her seferinde yeniden işlemek yerine turlar arasında yeniden kullanabilmesi anlamına gelir. OpenClaw, yukarı akış API bu sayaçları doğrudan sunduğunda sağlayıcı kullanımını `cacheRead` ve `cacheWrite` olarak normalleştirir.

Durum yüzeyleri, canlı oturum anlık görüntüsünde eksik olduklarında en son transkript
kullanım günlüğünden önbellek sayaçlarını da kurtarabilir; böylece `/status`, kısmi
oturum meta verisi kaybından sonra bir önbellek satırı göstermeye devam edebilir. Mevcut sıfır olmayan canlı
önbellek değerleri, transkript yedek değerlerine göre yine önceliklidir.

Bu neden önemli: daha düşük token maliyeti, daha hızlı yanıtlar ve uzun süre çalışan oturumlar için daha öngörülebilir performans. Önbelleğe alma olmadan, tekrarlanan istemler, girdinin çoğu değişmemiş olsa bile her turda tam istem maliyetini öder.

Aşağıdaki bölümler, istem yeniden kullanımını ve token maliyetini etkileyen önbellekle ilgili her ayarı kapsar.

Sağlayıcı referansları:

- Anthropic istem önbelleğe alma: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI istem önbelleğe alma: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API başlıkları ve istek kimlikleri: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic istek kimlikleri ve hataları: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Birincil ayarlar

### `cacheRetention` (genel varsayılan, model ve ajan başına)

Önbellek saklamayı tüm modeller için genel varsayılan olarak ayarlayın:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Model başına geçersiz kılın:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Ajan başına geçersiz kılma:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Yapılandırma birleştirme sırası:

1. `agents.defaults.params` (genel varsayılan — tüm modellere uygulanır)
2. `agents.defaults.models["provider/model"].params` (model başına geçersiz kılma)
3. `agents.list[].params` (eşleşen ajan kimliği; anahtara göre geçersiz kılar)

### `contextPruning.mode: "cache-ttl"`

Boşta kalma sonrası isteklerin aşırı büyük geçmişi yeniden önbelleğe almaması için eski araç sonucu bağlamını önbellek TTL pencerelerinden sonra budar.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Tam davranış için [Oturum Budama](/tr/concepts/session-pruning) bölümüne bakın.

### Heartbeat sıcak tutma

Heartbeat, önbellek pencerelerini sıcak tutabilir ve boşta kalma aralıklarından sonra tekrarlanan önbellek yazmalarını azaltabilir.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Ajan başına Heartbeat `agents.list[].heartbeat` konumunda desteklenir.

## Sağlayıcı davranışı

### Anthropic (doğrudan API)

- `cacheRetention` desteklenir.
- Anthropic API anahtarı kimlik doğrulama profillerinde OpenClaw, ayarlanmamış Anthropic model referansları için `cacheRetention: "short"` değerini başlatır.
- Anthropic yerel Messages yanıtları hem `cache_read_input_tokens` hem de `cache_creation_input_tokens` değerlerini sunar; bu nedenle OpenClaw hem `cacheRead` hem de `cacheWrite` gösterebilir.
- Yerel Anthropic istekleri için `cacheRetention: "short"` varsayılan 5 dakikalık geçici önbelleğe eşlenir ve `cacheRetention: "long"` yalnızca doğrudan `api.anthropic.com` ana bilgisayarlarında 1 saatlik TTL'ye yükseltilir.

### OpenAI (doğrudan API)

- İstem önbelleğe alma, desteklenen yeni modellerde otomatiktir. OpenClaw'ın blok düzeyinde önbellek işaretleri eklemesi gerekmez.
- OpenClaw, turlar arasında önbellek yönlendirmesini kararlı tutmak için `prompt_cache_key` kullanır. Doğrudan OpenAI ana bilgisayarları, `cacheRetention: "long"` seçildiğinde `prompt_cache_retention: "24h"` kullanır.
- OpenAI uyumlu Completions sağlayıcıları, yalnızca model yapılandırmaları açıkça `compat.supportsPromptCacheKey: true` ayarladığında `prompt_cache_key` alır. Uzun saklama iletimi ayrı bir kabiliyettir: açık `cacheRetention: "long"`, yalnızca ilgili compat girdisi uzun önbellek saklamayı da desteklediğinde `prompt_cache_retention: "24h"` gönderir. Mistral gibi sağlayıcılar, `compat.supportsLongCacheRetention: false` ayarlayarak uzun saklama alanını bastırırken önbellek anahtarlarına katılabilir. `cacheRetention: "none"` her iki alanı da bastırır.
- OpenAI yanıtları, önbelleğe alınmış istem tokenlerini `usage.prompt_tokens_details.cached_tokens` üzerinden (veya Responses API olaylarında `input_tokens_details.cached_tokens` üzerinden) sunar. OpenClaw bunu `cacheRead` değerine eşler.
- OpenAI ayrı bir önbellek yazma token sayacı sunmaz; bu nedenle sağlayıcı bir önbelleği ısıtıyor olsa bile OpenAI yollarında `cacheWrite` `0` kalır.
- OpenAI, `x-request-id`, `openai-processing-ms` ve `x-ratelimit-*` gibi yararlı izleme ve hız sınırı başlıkları döndürür; ancak önbellek isabeti hesaplaması başlıklardan değil kullanım yükünden gelmelidir.
- Pratikte OpenAI çoğu zaman Anthropic tarzı hareketli tam geçmiş yeniden kullanımından çok ilk önek önbelleği gibi davranır. Kararlı uzun önek metin turları mevcut canlı problarda `4864` önbelleğe alınmış token platosuna yakın sonuçlanabilirken, araç yoğun veya MCP tarzı transkriptler tam tekrarlarda bile genellikle `4608` önbelleğe alınmış token civarında plato yapar.

### Anthropic Vertex

- Vertex AI üzerindeki Anthropic modelleri (`anthropic-vertex/*`), doğrudan Anthropic ile aynı şekilde `cacheRetention` destekler.
- `cacheRetention: "long"`, Vertex AI uç noktalarında gerçek 1 saatlik istem önbelleği TTL'sine eşlenir.
- `anthropic-vertex` için varsayılan önbellek saklama, doğrudan Anthropic varsayılanlarıyla eşleşir.
- Vertex istekleri, önbellek yeniden kullanımının sağlayıcıların fiilen aldığı şeyle hizalı kalması için sınır farkındalıklı önbellek şekillendirme üzerinden yönlendirilir.

### Amazon Bedrock

- Anthropic Claude model referansları (`amazon-bedrock/*anthropic.claude*`) açık `cacheRetention` iletimini destekler.
- Anthropic dışı Bedrock modelleri çalışma zamanında zorunlu olarak `cacheRetention: "none"` değerine ayarlanır.

### OpenRouter modelleri

`openrouter/anthropic/*` model referansları için OpenClaw, istem önbelleği
yeniden kullanımını iyileştirmek amacıyla sistem/geliştirici istem bloklarına Anthropic
`cache_control` ekler; bunu yalnızca istek hâlâ doğrulanmış bir OpenRouter rotasını
hedeflediğinde yapar (`openrouter` varsayılan uç noktasında veya `openrouter.ai` değerine çözümlenen
herhangi bir sağlayıcı/temel URL).

`openrouter/deepseek/*`, `openrouter/moonshot*/*` ve `openrouter/zai/*`
model referansları için `contextPruning.mode: "cache-ttl"` izinlidir; çünkü OpenRouter
sağlayıcı tarafı istem önbelleğe almayı otomatik olarak işler. OpenClaw bu isteklere
Anthropic `cache_control` işaretleri eklemez.

DeepSeek önbellek oluşturma en iyi çaba esaslıdır ve birkaç saniye sürebilir. Hemen
ardından gelen bir takip isteği hâlâ `cached_tokens: 0` gösterebilir; kısa bir gecikmeden sonra
tekrarlanan aynı önekli istekle doğrulayın ve önbellek isabeti sinyali olarak
`usage.prompt_tokens_details.cached_tokens` kullanın.

Modeli rastgele bir OpenAI uyumlu proxy URL'sine yeniden yönlendirirseniz OpenClaw
OpenRouter'a özgü bu Anthropic önbellek işaretlerini eklemeyi durdurur.

### Diğer sağlayıcılar

Sağlayıcı bu önbellek modunu desteklemiyorsa `cacheRetention` etkisizdir.

### Google Gemini doğrudan API

- Doğrudan Gemini aktarımı (`api: "google-generative-ai"`), önbellek isabetlerini
  yukarı akış `cachedContentTokenCount` üzerinden raporlar; OpenClaw bunu `cacheRead` değerine eşler.
- Doğrudan Gemini modelinde `cacheRetention` ayarlandığında OpenClaw, Google AI Studio çalıştırmalarında sistem istemleri için otomatik olarak
  `cachedContents` kaynakları oluşturur, yeniden kullanır ve yeniler. Bu, artık önceden
  bir önbelleğe alınmış içerik tanıtıcısını elle oluşturmanız gerekmediği anlamına gelir.
- Önceden var olan bir Gemini önbelleğe alınmış içerik tanıtıcısını yapılandırılmış
  modelde `params.cachedContent` (veya eski `params.cached_content`) olarak yine de geçirebilirsiniz.
- Bu, Anthropic/OpenAI istem öneki önbelleğe almadan ayrıdır. Gemini için
  OpenClaw, isteğe önbellek işaretleri eklemek yerine sağlayıcıya özgü bir
  `cachedContents` kaynağı yönetir.

### Gemini CLI kullanımı

- Gemini CLI `stream-json` çıktısı, önbellek isabetlerini `stats.cached` üzerinden gösterebilir;
  OpenClaw bunu `cacheRead` değerine eşler. Eski `--output-format json` geçersiz kılmaları
  aynı kullanım normalleştirmesini kullanır.
- CLI doğrudan `stats.input` değeri atlıyorsa OpenClaw girdi tokenlerini
  `stats.input_tokens - stats.cached` değerinden türetir.
- Bu yalnızca kullanım normalleştirmesidir. OpenClaw'ın Gemini CLI için
  Anthropic/OpenAI tarzı istem önbelleği işaretleri oluşturduğu anlamına gelmez.

## Sistem istemi önbellek sınırı

OpenClaw, sistem istemini dahili bir önbellek öneki sınırıyla ayrılmış **kararlı önek** ve **değişken
sonek** olarak böler. Sınırın üstündeki içerik
(araç tanımları, Skills meta verileri, çalışma alanı dosyaları ve diğer
nispeten statik bağlam), turlar arasında bayt düzeyinde aynı kalacak şekilde sıralanır.
Sınırın altındaki içeriğin (örneğin `HEARTBEAT.md`, çalışma zamanı zaman damgaları ve
diğer tur başına meta veriler) önbelleğe alınmış
öneki geçersiz kılmadan değişmesine izin verilir.

Temel tasarım tercihleri:

- Kararlı çalışma alanı proje bağlamı dosyaları `HEARTBEAT.md` öncesinde sıralanır; böylece
  Heartbeat değişkenliği kararlı öneki bozmaz.
- Sınır, Anthropic ailesi, OpenAI ailesi, Google ve
  CLI aktarım şekillendirmesi genelinde uygulanır; böylece desteklenen tüm sağlayıcılar aynı önek
  kararlılığından yararlanır.
- Codex Responses ve Anthropic Vertex istekleri,
  önbellek yeniden kullanımının sağlayıcıların fiilen aldığı şeyle hizalı kalması için
  sınır farkındalıklı önbellek şekillendirme üzerinden yönlendirilir.
- Sistem istemi parmak izleri normalleştirilir (boşluk, satır sonları,
  hook ile eklenen bağlam, çalışma zamanı kabiliyet sıralaması); böylece anlamsal olarak değişmemiş
  istemler turlar arasında KV/önbellek paylaşır.

Bir yapılandırma veya çalışma alanı değişikliğinden sonra beklenmeyen `cacheWrite` sıçramaları görürseniz,
değişikliğin önbellek sınırının üstüne mi altına mı düştüğünü kontrol edin. Değişken
içeriği sınırın altına taşımak (veya kararlı hale getirmek) çoğu zaman
sorunu çözer.

## OpenClaw önbellek kararlılığı korumaları

OpenClaw ayrıca istek sağlayıcıya ulaşmadan önce önbelleğe duyarlı birkaç yük şeklini deterministik tutar:

- Paket MCP araç katalogları, araç kaydından önce deterministik olarak sıralanır; böylece
  `listTools()` sırası değişiklikleri araçlar bloğunu dalgalandırmaz ve
  istem önbelleği öneklerini bozmaz.
- Kalıcı görüntü blokları içeren eski oturumlar, **en son 3
  tamamlanmış turu** olduğu gibi tutar; daha eski ve zaten işlenmiş görüntü blokları,
  görüntü yoğun takiplerin büyük ve bayat yükleri yeniden göndermeye devam etmemesi için
  bir işaretle değiştirilebilir.

## Ayarlama kalıpları

### Karma trafik (önerilen varsayılan)

Ana ajanınızda uzun ömürlü bir temel çizgi tutun, ani bildirim yapan ajanlarda önbelleği devre dışı bırakın:

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

### Önce maliyet temel çizgisi

- Temel `cacheRetention: "short"` ayarlayın.
- `contextPruning.mode: "cache-ttl"` etkinleştirin.
- Heartbeat'i yalnızca sıcak önbelleklerden yararlanan ajanlar için TTL değerinizin altında tutun.

## Önbellek tanılamaları

OpenClaw, gömülü ajan çalıştırmaları için özel önbellek izleme tanılamaları sunar.

Normal kullanıcıya dönük tanılamalar için `/status` ve diğer kullanım özetleri,
canlı oturum girdisinde bu sayaçlar yoksa `cacheRead` /
`cacheWrite` için yedek kaynak olarak en son transkript kullanım girdisini kullanabilir.

## Canlı regresyon testleri

OpenClaw, tekrarlanan önekler, araç turları, görüntü turları, MCP tarzı araç transkriptleri ve Anthropic önbelleksiz kontrolü için tek bir birleşik canlı önbellek regresyon kapısı tutar.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Dar canlı kapıyı şununla çalıştırın:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Temel çizgi dosyası, en son gözlemlenen canlı sayıları ve test tarafından kullanılan sağlayıcıya özgü regresyon tabanlarını saklar.
Çalıştırıcı ayrıca, önceki önbellek durumunun mevcut regresyon örneğini kirletmemesi için her çalıştırmada yeni oturum kimlikleri ve istem ad alanları kullanır.

Bu testler, sağlayıcılar arasında kasıtlı olarak aynı başarı ölçütlerini kullanmaz.

### Anthropic canlı beklentileri

- `cacheWrite` aracılığıyla açık ısınma yazmaları bekleyin.
- Anthropic önbellek denetimi, önbellek kesme noktasını konuşma boyunca ilerlettiği için tekrarlanan dönüşlerde neredeyse tam geçmiş yeniden kullanımını bekleyin.
- Geçerli canlı doğrulamalar, kararlı, araç ve görüntü yolları için hâlâ yüksek isabet oranı eşiklerini kullanır.

### OpenAI canlı beklentileri

- Yalnızca `cacheRead` bekleyin. `cacheWrite` `0` olarak kalır.
- Tekrarlanan dönüş önbellek yeniden kullanımını, Anthropic tarzı hareketli tam geçmiş yeniden kullanımı olarak değil, sağlayıcıya özgü bir plato olarak ele alın.
- Geçerli canlı doğrulamalar, `gpt-5.4-mini` üzerinde gözlemlenen canlı davranıştan türetilmiş muhafazakar taban kontrollerini kullanır:
  - kararlı önek: `cacheRead >= 4608`, isabet oranı `>= 0.90`
  - araç transkripti: `cacheRead >= 4096`, isabet oranı `>= 0.85`
  - görüntü transkripti: `cacheRead >= 3840`, isabet oranı `>= 0.82`
  - MCP tarzı transkript: `cacheRead >= 4096`, isabet oranı `>= 0.85`

2026-04-04 tarihli yeni birleşik canlı doğrulama şu sonuçlarla tamamlandı:

- kararlı önek: `cacheRead=4864`, isabet oranı `0.966`
- araç transkripti: `cacheRead=4608`, isabet oranı `0.896`
- görüntü transkripti: `cacheRead=4864`, isabet oranı `0.954`
- MCP tarzı transkript: `cacheRead=4608`, isabet oranı `0.891`

Birleşik kapı için yakın tarihli yerel duvar saati süresi yaklaşık `88s` idi.

Doğrulamaların neden farklı olduğu:

- Anthropic, açık önbellek kesme noktaları ve hareketli konuşma geçmişi yeniden kullanımını ortaya koyar.
- OpenAI istem önbelleğe alma hâlâ tam önek duyarlıdır, ancak canlı Responses trafiğinde etkili yeniden kullanılabilir önek, tam istemden daha erken bir platoya ulaşabilir.
- Bu nedenle, Anthropic ve OpenAI'ı sağlayıcılar arası tek bir yüzde eşiğiyle karşılaştırmak yanlış regresyonlar oluşturur.

### `diagnostics.cacheTrace` yapılandırması

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Varsayılanlar:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Ortam anahtarları (tek seferlik hata ayıklama)

- `OPENCLAW_CACHE_TRACE=1` önbellek izlemeyi etkinleştirir.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` çıktı yolunu geçersiz kılar.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` tam ileti yükü yakalamayı açıp kapatır.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` istem metni yakalamayı açıp kapatır.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` sistem istemi yakalamayı açıp kapatır.

### İncelenecekler

- Önbellek izleme olayları JSONL biçimindedir ve `session:loaded`, `prompt:before`, `stream:context` ve `session:after` gibi aşamalı anlık görüntüler içerir.
- Dönüş başına önbellek belirteci etkisi, normal kullanım yüzeylerinde `cacheRead` ve `cacheWrite` aracılığıyla görünür (örneğin `/usage full` ve oturum kullanım özetleri).
- Anthropic için, önbelleğe alma etkinken hem `cacheRead` hem de `cacheWrite` bekleyin.
- OpenAI için, önbellek isabetlerinde `cacheRead` bekleyin ve `cacheWrite` değerinin `0` kalmasını bekleyin; OpenAI ayrı bir önbellek yazma belirteci alanı yayımlamaz.
- İstek izlemeye ihtiyacınız varsa, istek kimliklerini ve hız sınırı başlıklarını önbellek metriklerinden ayrı olarak günlüğe kaydedin. OpenClaw'ın geçerli önbellek izleme çıktısı, ham sağlayıcı yanıt başlıkları yerine istem/oturum şekline ve normalleştirilmiş belirteç kullanımına odaklanır.

## Hızlı sorun giderme

- Çoğu dönüşte yüksek `cacheWrite`: geçici sistem istemi girdilerini kontrol edin ve modelin/sağlayıcının önbellek ayarlarınızı desteklediğini doğrulayın.
- Anthropic üzerinde yüksek `cacheWrite`: genellikle önbellek kesme noktasının her istekte değişen içeriğe denk geldiği anlamına gelir.
- Düşük OpenAI `cacheRead`: kararlı önekin başta olduğunu, tekrarlanan önekin en az 1024 belirteç olduğunu ve önbellek paylaşması gereken dönüşlerde aynı `prompt_cache_key` değerinin yeniden kullanıldığını doğrulayın.
- `cacheRetention` etkisizse: model anahtarının `agents.defaults.models["provider/model"]` ile eşleştiğini doğrulayın.
- Önbellek ayarlarıyla Bedrock Nova/Mistral istekleri: çalışma zamanında beklenen şekilde `none` değerine zorlanır.

İlgili belgeler:

- [Anthropic](/tr/providers/anthropic)
- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [Oturum budama](/tr/concepts/session-pruning)
- [Gateway yapılandırma başvurusu](/tr/gateway/configuration-reference)

## İlgili

- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
