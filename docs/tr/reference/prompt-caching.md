---
read_when:
    - Önbellek tutmayı koruyarak prompt token maliyetlerini azaltmak istiyorsunuz
    - Çok aracılı kurulumlarda ajan başına önbellek davranışına ihtiyacınız vardır
    - Heartbeat ve cache-ttl budamasını birlikte ayarlıyorsunuz
summary: İstem önbelleğe alma ayarları, birleştirme sırası, sağlayıcı davranışı ve ayarlama kalıpları
title: İstem önbelleğe alma
x-i18n:
    generated_at: "2026-07-01T08:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

İstem önbelleğe alma, model sağlayıcısının değişmeyen istem öneklerini (genellikle sistem/geliştirici talimatları ve diğer kararlı bağlam) her seferinde yeniden işlemek yerine turlar arasında yeniden kullanabilmesi anlamına gelir. OpenClaw, üst API bu sayaçları doğrudan sunduğunda sağlayıcı kullanımını `cacheRead` ve `cacheWrite` olarak normalleştirir.

Durum yüzeyleri, canlı oturum anlık görüntüsünde eksik olduklarında en son döküm
kullanım günlüğünden önbellek sayaçlarını da kurtarabilir; böylece `/status`,
kısmi oturum meta veri kaybından sonra bir önbellek satırı göstermeyi sürdürebilir.
Mevcut sıfır olmayan canlı önbellek değerleri, döküm geri dönüş değerlerine göre
önceliğini korur.

Bunun önemi: daha düşük token maliyeti, daha hızlı yanıtlar ve uzun süre çalışan oturumlar için daha öngörülebilir performans. Önbelleğe alma olmadan, girdinin çoğu değişmemiş olsa bile tekrarlanan istemler her turda tam istem maliyetini öder.

Aşağıdaki bölümler, istem yeniden kullanımını ve token maliyetini etkileyen önbellekle ilgili her ayarı kapsar.

Sağlayıcı başvuruları:

- Anthropic istem önbelleğe alma: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI istem önbelleğe alma: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API üstbilgileri ve istek kimlikleri: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic istek kimlikleri ve hataları: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Birincil ayarlar

### `cacheRetention` (genel varsayılan, model ve ajan başına)

Önbellek saklama süresini tüm modeller için genel varsayılan olarak ayarlayın:

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

Boşta kalma sonrası isteklerin aşırı büyük geçmişi yeniden önbelleğe almaması için önbellek TTL pencerelerinden sonra eski araç sonucu bağlamını budar.

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
- Anthropic API anahtarı kimlik doğrulama profilleriyle, ayarlanmamışsa OpenClaw Anthropic model referansları için `cacheRetention: "short"` başlangıç değeri verir.
- Anthropic yerel Messages yanıtları hem `cache_read_input_tokens` hem de `cache_creation_input_tokens` değerlerini sunar; bu nedenle OpenClaw hem `cacheRead` hem de `cacheWrite` gösterebilir.
- Yerel Anthropic istekleri için `cacheRetention: "short"` varsayılan 5 dakikalık geçici önbelleğe eşlenir ve `cacheRetention: "long"` yalnızca doğrudan `api.anthropic.com` ana makinelerinde 1 saatlik TTL'ye yükseltilir.

### OpenAI (doğrudan API)

- İstem önbelleğe alma, desteklenen güncel modellerde otomatiktir. OpenClaw'ın blok düzeyinde önbellek işaretleyicileri enjekte etmesi gerekmez.
- OpenClaw, önbellek yönlendirmesini turlar arasında kararlı tutmak için `prompt_cache_key` kullanır. Doğrudan OpenAI ana makineleri, `cacheRetention: "long"` seçildiğinde `prompt_cache_retention: "24h"` kullanır.
- OpenAI uyumlu Completions sağlayıcıları yalnızca model yapılandırmaları açıkça `compat.supportsPromptCacheKey: true` ayarladığında `prompt_cache_key` alır. Uzun saklama iletimi ayrı bir yetenektir: açık `cacheRetention: "long"` yalnızca ilgili compat girdisi uzun önbellek saklamayı da desteklediğinde `prompt_cache_retention: "24h"` gönderir. Mistral gibi sağlayıcılar, uzun saklama alanını bastırmak için `compat.supportsLongCacheRetention: false` ayarlarken önbellek anahtarlarına katılabilir. `cacheRetention: "none"` her iki alanı da bastırır.
- OpenAI yanıtları, önbelleğe alınmış istem token'larını `usage.prompt_tokens_details.cached_tokens` (veya Responses API olaylarında `input_tokens_details.cached_tokens`) üzerinden sunar. OpenClaw bunu `cacheRead` değerine eşler.
- GPT-5.6 Responses kullanımı ayrıca `input_tokens_details.cache_write_tokens` değerini sunabilir. OpenClaw bunu `cacheWrite` değerine eşler ve modelin önbellek yazma ücretine göre fiyatlandırır; alanı atlayan Responses, `cacheWrite` değerini `0` olarak tutar.
- OpenAI `x-request-id`, `openai-processing-ms` ve `x-ratelimit-*` gibi kullanışlı izleme ve hız sınırı üstbilgileri döndürür; ancak önbellek isabeti muhasebesi üstbilgilerden değil, kullanım yükünden gelmelidir.
- Pratikte OpenAI çoğu zaman Anthropic tarzı hareketli tam geçmiş yeniden kullanımı yerine başlangıç öneki önbelleği gibi davranır. Kararlı uzun önekli metin turları mevcut canlı sondalarda `4864` önbelleğe alınmış token platosuna yakın sonuç verebilirken, araç ağırlıklı veya MCP tarzı dökümler tam tekrarlarda bile çoğunlukla `4608` önbelleğe alınmış token civarında plato yapar.

### Anthropic Vertex

- Vertex AI üzerindeki Anthropic modelleri (`anthropic-vertex/*`), doğrudan Anthropic ile aynı şekilde `cacheRetention` destekler.
- `cacheRetention: "long"`, Vertex AI uç noktalarında gerçek 1 saatlik istem önbelleği TTL'sine eşlenir.
- `anthropic-vertex` için varsayılan önbellek saklama süresi, doğrudan Anthropic varsayılanlarıyla eşleşir.
- Vertex istekleri, önbellek yeniden kullanımının sağlayıcıların gerçekten aldığı içerikle hizalı kalması için sınır duyarlı önbellek şekillendirme üzerinden yönlendirilir.

### Amazon Bedrock

- Anthropic Claude model referansları (`amazon-bedrock/*anthropic.claude*`) açık `cacheRetention` geçişini destekler.
- Anthropic olmayan Bedrock modelleri çalışma zamanında `cacheRetention: "none"` olarak zorlanır.

### OpenRouter modelleri

`openrouter/anthropic/*` model referansları için OpenClaw, yalnızca istek doğrulanmış bir OpenRouter rotasını
(`openrouter` varsayılan uç noktasında veya `openrouter.ai` adresine çözümlenen herhangi bir sağlayıcı/temel URL) hedeflemeyi sürdürdüğünde istem önbelleği
yeniden kullanımını iyileştirmek için sistem/geliştirici istem bloklarına Anthropic
`cache_control` enjekte eder.

`openrouter/deepseek/*`, `openrouter/moonshot*/*` ve `openrouter/zai/*`
model referansları için `contextPruning.mode: "cache-ttl"` kullanılabilir, çünkü OpenRouter
sağlayıcı tarafı istem önbelleğe almayı otomatik olarak işler. OpenClaw bu isteklere
Anthropic `cache_control` işaretleyicileri enjekte etmez.

DeepSeek önbellek oluşturma en iyi çaba esasına dayanır ve birkaç saniye sürebilir. Hemen yapılan
bir takip isteği yine de `cached_tokens: 0` gösterebilir; kısa bir gecikmeden sonra tekrarlanan
aynı önekli istekle doğrulayın ve önbellek isabeti sinyali olarak `usage.prompt_tokens_details.cached_tokens`
kullanın.

Modeli rastgele bir OpenAI uyumlu proxy URL'sine yeniden yönlendirirseniz, OpenClaw
bu OpenRouter'a özgü Anthropic önbellek işaretleyicilerini enjekte etmeyi durdurur.

### Diğer sağlayıcılar

Sağlayıcı bu önbellek modunu desteklemiyorsa `cacheRetention` etkisizdir.

### Google Gemini doğrudan API

- Doğrudan Gemini aktarımı (`api: "google-generative-ai"`), önbellek isabetlerini
  üst kaynak `cachedContentTokenCount` üzerinden bildirir; OpenClaw bunu `cacheRead` değerine eşler.
- Doğrudan Gemini modelinde `cacheRetention` ayarlandığında OpenClaw, Google AI Studio
  çalıştırmaları için sistem istemlerine yönelik `cachedContents` kaynaklarını otomatik olarak
  oluşturur, yeniden kullanır ve yeniler. Bu, artık önbelleğe alınmış içerik tanıtıcısını
  manuel olarak önceden oluşturmanız gerekmediği anlamına gelir.
- Önceden var olan bir Gemini önbelleğe alınmış içerik tanıtıcısını yapılandırılmış
  modelde `params.cachedContent` (veya eski `params.cached_content`) olarak yine de geçirebilirsiniz.
- Bu, Anthropic/OpenAI istem öneki önbelleğe almadan ayrıdır. Gemini için
  OpenClaw, isteğe önbellek işaretleyicileri enjekte etmek yerine sağlayıcıya özgü bir
  `cachedContents` kaynağını yönetir.

### Gemini CLI kullanımı

- Gemini CLI `stream-json` çıktısı, önbellek isabetlerini `stats.cached` üzerinden gösterebilir;
  OpenClaw bunu `cacheRead` değerine eşler. Eski `--output-format json` geçersiz kılmaları
  aynı kullanım normalleştirmesini kullanır.
- CLI doğrudan bir `stats.input` değeri atlıyorsa OpenClaw girdi token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.
- Bu yalnızca kullanım normalleştirmesidir. OpenClaw'ın Gemini CLI için
  Anthropic/OpenAI tarzı istem önbelleği işaretleyicileri oluşturduğu anlamına gelmez.

## Sistem istemi önbellek sınırı

OpenClaw, sistem istemini dahili bir önbellek öneki sınırıyla ayrılan **kararlı önek** ve **değişken
sonek** olarak böler. Sınırın üzerindeki içerik (araç tanımları, Skills meta verileri, çalışma alanı dosyaları ve diğer
görece statik bağlam), turlar arasında bayt bayt aynı kalacak şekilde sıralanır.
Sınırın altındaki içeriğin (örneğin `HEARTBEAT.md`, çalışma zamanı zaman damgaları ve
diğer tur başına meta veriler), önbelleğe alınmış öneki geçersiz kılmadan değişmesine izin verilir.

Temel tasarım seçimleri:

- Kararlı çalışma alanı proje bağlamı dosyaları `HEARTBEAT.md` öncesinde sıralanır; böylece
  Heartbeat değişkenliği kararlı öneki bozmaz.
- Sınır, Anthropic ailesi, OpenAI ailesi, Google ve
  CLI aktarım şekillendirmesi genelinde uygulanır; böylece desteklenen tüm sağlayıcılar aynı önek
  kararlılığından yararlanır.
- Codex Responses ve Anthropic Vertex istekleri,
  önbellek yeniden kullanımının sağlayıcıların gerçekten aldığı içerikle hizalı kalması için
  sınır duyarlı önbellek şekillendirme üzerinden yönlendirilir.
- Sistem istemi parmak izleri normalleştirilir (boşluklar, satır sonları,
  hook ile eklenen bağlam, çalışma zamanı yetenek sıralaması); böylece anlamsal olarak değişmeyen
  istemler turlar arasında KV/önbelleği paylaşır.

Bir yapılandırma veya çalışma alanı değişikliğinden sonra beklenmeyen `cacheWrite` sıçramaları görürseniz,
değişikliğin önbellek sınırının üstüne mi altına mı düştüğünü kontrol edin. Değişken içeriği
sınırın altına taşımak (veya kararlı hale getirmek) çoğu zaman sorunu çözer.

## OpenClaw önbellek kararlılığı korumaları

OpenClaw ayrıca istek sağlayıcıya ulaşmadan önce önbelleğe duyarlı birkaç yük şeklini deterministik tutar:

- Bundle MCP araç katalogları, araç kaydından önce deterministik olarak sıralanır; böylece
  `listTools()` sıra değişiklikleri araçlar bloğunu dalgalandırmaz ve istem önbelleği öneklerini
  bozmaz.
- Kalıcı görüntü blokları olan eski oturumlar **tamamlanmış en son 3 turu**
  olduğu gibi tutar; daha eski, zaten işlenmiş görüntü blokları bir işaretleyiciyle
  değiştirilebilir, böylece görüntü ağırlıklı takip istekleri büyük ve eski yükleri yeniden göndermeyi sürdürmez.

## Ayarlama kalıpları

### Karma trafik (önerilen varsayılan)

Ana ajanınızda uzun ömürlü bir temel çizgiyi koruyun, ani yük oluşturan bildirim ajanlarında önbelleğe almayı devre dışı bırakın:

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
- Heartbeat'i yalnızca sıcak önbelleklerden yararlanan ajanlar için TTL'nizin altında tutun.

## Önbellek tanılamaları

OpenClaw, gömülü ajan çalıştırmaları için özel önbellek izleme tanılamaları sunar.

Normal kullanıcıya dönük tanılamalar için `/status` ve diğer kullanım özetleri,
canlı oturum girdisinde bu sayaçlar olmadığında `cacheRead` /
`cacheWrite` için geri dönüş kaynağı olarak en son döküm kullanım girdisini kullanabilir.

## Canlı regresyon testleri

OpenClaw, tekrarlanan önekler, araç turları, görüntü turları, MCP tarzı araç dökümleri ve Anthropic önbelleksiz kontrolü için tek bir birleşik canlı önbellek regresyon kapısı tutar.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Dar canlı kapıyı şu komutla çalıştırın:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Temel dosya, en son gözlemlenen canlı sayıları ve test tarafından kullanılan sağlayıcıya özgü regresyon alt sınırlarını depolar.
Çalıştırıcı ayrıca, önceki önbellek durumunun geçerli regresyon örneğini kirletmemesi için her çalıştırma için yeni oturum kimlikleri ve istem ad alanları kullanır.

Bu testler, sağlayıcılar arasında bilerek aynı başarı ölçütlerini kullanmaz.

### Anthropic canlı beklentileri

- `cacheWrite` aracılığıyla açık ısınma yazmaları bekleyin.
- Anthropic önbellek denetimi, önbellek kesme noktasını konuşma boyunca ilerlettiği için tekrarlanan dönüşlerde neredeyse tam geçmiş yeniden kullanımı bekleyin.
- Geçerli canlı doğrulamalar, kararlı, araç ve görüntü yolları için hâlâ yüksek isabet oranı eşiklerini kullanır.

### OpenAI canlı beklentileri

- Yalnızca `cacheRead` bekleyin. `cacheWrite` `0` olarak kalır.
- Tekrarlanan dönüş önbellek yeniden kullanımını, Anthropic tarzı hareketli tam geçmiş yeniden kullanımı olarak değil, sağlayıcıya özgü bir plato olarak ele alın.
- Geçerli canlı doğrulamalar, `gpt-5.4-mini` üzerinde gözlemlenen canlı davranıştan türetilmiş temkinli alt sınır denetimleri kullanır:
  - kararlı önek: `cacheRead >= 4608`, isabet oranı `>= 0.90`
  - araç transkripti: `cacheRead >= 4096`, isabet oranı `>= 0.85`
  - görüntü transkripti: `cacheRead >= 3840`, isabet oranı `>= 0.82`
  - MCP tarzı transkript: `cacheRead >= 4096`, isabet oranı `>= 0.85`

2026-04-04 tarihinde yapılan taze birleşik canlı doğrulama şu değerlere ulaştı:

- kararlı önek: `cacheRead=4864`, isabet oranı `0.966`
- araç transkripti: `cacheRead=4608`, isabet oranı `0.896`
- görüntü transkripti: `cacheRead=4864`, isabet oranı `0.954`
- MCP tarzı transkript: `cacheRead=4608`, isabet oranı `0.891`

Birleşik geçit için yakın tarihli yerel duvar saati süresi yaklaşık `88s` idi.

Doğrulamaların neden farklı olduğu:

- Anthropic, açık önbellek kesme noktaları ve hareketli konuşma geçmişi yeniden kullanımını açığa çıkarır.
- OpenAI istem önbelleğe alma hâlâ tam önek duyarlıdır, ancak canlı Responses trafiğinde etkin yeniden kullanılabilir önek, tam istemden daha erken plato yapabilir.
- Bu nedenle, Anthropic ve OpenAI'yi tek bir sağlayıcılar arası yüzde eşiğiyle karşılaştırmak yanlış regresyonlar oluşturur.

### `diagnostics.cacheTrace` yapılandırması

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

### Neler incelenmeli

- Önbellek izleme olayları JSONL biçimindedir ve `session:loaded`, `prompt:before`, `stream:context` ve `session:after` gibi aşamalı anlık görüntüler içerir.
- Dönüş başına önbellek belirteci etkisi, normal kullanım yüzeylerinde `cacheRead` ve `cacheWrite` aracılığıyla görünür (örneğin `/usage full` ve oturum kullanım özetleri).
- Anthropic için, önbelleğe alma etkin olduğunda hem `cacheRead` hem de `cacheWrite` bekleyin.
- OpenAI için, önbellek isabetlerinde `cacheRead` bekleyin. GPT-5.6 Responses, istem bölümleri yazılırken `cacheWrite` da bildirebilir; yazma sayacını atlayan diğer Responses yükleri bunu `0` olarak tutar.
- İstek izlemeye ihtiyacınız varsa, istek kimliklerini ve hız sınırı üst bilgilerini önbellek metriklerinden ayrı olarak günlüğe kaydedin. OpenClaw'ın geçerli önbellek izleme çıktısı, ham sağlayıcı yanıt üst bilgilerinden çok istem/oturum şekline ve normalleştirilmiş belirteç kullanımına odaklanır.

## Hızlı sorun giderme

- Çoğu dönüşte yüksek `cacheWrite`: değişken sistem istemi girdilerini denetleyin ve model/sağlayıcının önbellek ayarlarınızı desteklediğini doğrulayın.
- Anthropic'te yüksek `cacheWrite`: çoğu zaman önbellek kesme noktasının her istekte değişen içeriğe denk geldiği anlamına gelir.
- Düşük OpenAI `cacheRead`: kararlı önekin en başta olduğunu, tekrarlanan önekin en az 1024 belirteç olduğunu ve önbellek paylaşması gereken dönüşler için aynı `prompt_cache_key` değerinin yeniden kullanıldığını doğrulayın.
- `cacheRetention` etkisiz: model anahtarının `agents.defaults.models["provider/model"]` ile eşleştiğini onaylayın.
- Önbellek ayarları içeren Bedrock Nova/Mistral istekleri: çalışma zamanında `none` değerine zorlanması beklenir.

İlgili belgeler:

- [Anthropic](/tr/providers/anthropic)
- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [Oturum budama](/tr/concepts/session-pruning)
- [Gateway yapılandırma başvurusu](/tr/gateway/configuration-reference)

## İlgili

- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
