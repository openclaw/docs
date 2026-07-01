---
read_when:
    - Prompt token maliyetlerini önbellek korumasıyla azaltmak istiyorsunuz
    - Çok ajanlı kurulumlarda ajan başına önbellek davranışına ihtiyacınız var
    - Heartbeat ve cache-ttl budamasını birlikte ayarlıyorsunuz
summary: Prompt önbelleğe alma ayarları, birleştirme sırası, sağlayıcı davranışı ve ayarlama kalıpları
title: İstem önbelleğe alma
x-i18n:
    generated_at: "2026-07-01T18:18:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

İstem önbelleğe alma, model sağlayıcısının değişmeyen istem öneklerini (genellikle sistem/geliştirici talimatları ve diğer kararlı bağlam) her seferinde yeniden işlemek yerine turlar arasında yeniden kullanabilmesi anlamına gelir. OpenClaw, üst API bu sayaçları doğrudan sunduğunda sağlayıcı kullanımını `cacheRead` ve `cacheWrite` olarak normalleştirir.

Durum yüzeyleri, canlı oturum anlık görüntüsünde eksik olduklarında en son transkript
kullanım günlüğünden önbellek sayaçlarını da kurtarabilir; böylece `/status`, kısmi oturum
meta verisi kaybından sonra da bir önbellek satırı göstermeye devam edebilir. Mevcut sıfır olmayan canlı
önbellek değerleri, transkript geri dönüş değerlerine göre yine önceliklidir.

Bunun neden önemli olduğu: daha düşük token maliyeti, daha hızlı yanıtlar ve uzun süre çalışan oturumlar için daha öngörülebilir performans. Önbelleğe alma olmadan, girdinin çoğu değişmese bile tekrarlanan istemler her turda tam istem maliyetini öder.

Aşağıdaki bölümler, istem yeniden kullanımını ve token maliyetini etkileyen önbellekle ilgili her ayarı kapsar.

Sağlayıcı başvuruları:

- Anthropic istem önbelleğe alma: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI istem önbelleğe alma: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API üst bilgileri ve istek kimlikleri: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
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

Ajan başına heartbeat `agents.list[].heartbeat` konumunda desteklenir.

## Sağlayıcı davranışı

### Anthropic (doğrudan API)

- `cacheRetention` desteklenir.
- Anthropic API anahtarı kimlik doğrulama profilleriyle, ayarlanmamışsa OpenClaw Anthropic model referansları için `cacheRetention: "short"` tohumlar.
- Anthropic yerel Messages yanıtları hem `cache_read_input_tokens` hem de `cache_creation_input_tokens` değerlerini sunar; bu nedenle OpenClaw hem `cacheRead` hem de `cacheWrite` gösterebilir.
- Yerel Anthropic isteklerinde `cacheRetention: "short"` varsayılan 5 dakikalık geçici önbelleğe eşlenir ve `cacheRetention: "long"` yalnızca doğrudan `api.anthropic.com` hostlarında 1 saatlik TTL’ye yükseltilir.

### OpenAI (doğrudan API)

- İstem önbelleğe alma, desteklenen güncel modellerde otomatiktir. OpenClaw’ın blok düzeyinde önbellek işaretleyicileri enjekte etmesi gerekmez.
- OpenClaw, önbellek yönlendirmesini turlar arasında kararlı tutmak için `prompt_cache_key` kullanır. Doğrudan OpenAI hostları, `cacheRetention: "long"` seçildiğinde `prompt_cache_retention: "24h"` kullanır.
- OpenAI uyumlu Completions sağlayıcıları, `prompt_cache_key` değerini yalnızca model yapılandırmaları açıkça `compat.supportsPromptCacheKey: true` ayarladığında alır. Uzun saklama iletimi ayrı bir yetenektir: açık `cacheRetention: "long"`, `prompt_cache_retention: "24h"` değerini yalnızca ilgili uyumluluk girdisi uzun önbellek saklamayı da desteklediğinde gönderir. Mistral gibi sağlayıcılar, uzun saklama alanını bastırmak için `compat.supportsLongCacheRetention: false` ayarlarken önbellek anahtarlarına katılabilir. `cacheRetention: "none"` her iki alanı da bastırır.
- OpenAI yanıtları, önbelleğe alınmış istem tokenlarını `usage.prompt_tokens_details.cached_tokens` üzerinden (veya Responses API olaylarında `input_tokens_details.cached_tokens` üzerinden) sunar. OpenClaw bunu `cacheRead` değerine eşler.
- GPT-5.6 Responses kullanımı ayrıca `input_tokens_details.cache_write_tokens` sunabilir. OpenClaw bunu `cacheWrite` değerine eşler ve modelin önbellek yazma oranıyla fiyatlandırır; alanı atlayan Responses, `cacheWrite` değerini `0` olarak tutar.
- OpenAI, `x-request-id`, `openai-processing-ms` ve `x-ratelimit-*` gibi yararlı izleme ve hız sınırı üst bilgileri döndürür; ancak önbellek isabeti muhasebesi üst bilgilerden değil, kullanım yükünden gelmelidir.
- Pratikte OpenAI çoğu zaman Anthropic tarzı hareketli tam geçmiş yeniden kullanımı yerine ilk önek önbelleği gibi davranır. Kararlı uzun önekli metin turları mevcut canlı problarda `4864` önbelleğe alınmış token platosuna yaklaşabilirken, araç ağırlıklı veya MCP tarzı transkriptler tam tekrarlarda bile genellikle `4608` önbelleğe alınmış token civarında plato yapar.

### Anthropic Vertex

- Vertex AI üzerindeki Anthropic modelleri (`anthropic-vertex/*`), doğrudan Anthropic ile aynı şekilde `cacheRetention` destekler.
- `cacheRetention: "long"`, Vertex AI uç noktalarında gerçek 1 saatlik istem önbelleği TTL’sine eşlenir.
- `anthropic-vertex` için varsayılan önbellek saklama, doğrudan Anthropic varsayılanlarıyla eşleşir.
- Vertex istekleri, önbellek yeniden kullanımının sağlayıcıların gerçekten aldığı içerikle hizalı kalması için sınır farkındalıklı önbellek şekillendirmesinden geçirilir.

### Amazon Bedrock

- Anthropic Claude model referansları (`amazon-bedrock/*anthropic.claude*`) açık `cacheRetention` iletimini destekler.
- Anthropic olmayan Bedrock modelleri çalışma zamanında `cacheRetention: "none"` değerine zorlanır.

### OpenRouter modelleri

`openrouter/anthropic/*` model referansları için OpenClaw, istem önbelleği
yeniden kullanımını iyileştirmek amacıyla sistem/geliştirici istem bloklarına Anthropic
`cache_control` enjekte eder; bunu yalnızca istek hâlâ doğrulanmış bir OpenRouter rotasını
hedefliyorsa yapar (`openrouter` varsayılan uç noktasında veya `openrouter.ai` adresine
çözümlenen herhangi bir sağlayıcı/temel URL).

`openrouter/deepseek/*`, `openrouter/moonshot*/*` ve `openrouter/zai/*`
model referansları için `contextPruning.mode: "cache-ttl"` izinlidir, çünkü OpenRouter
sağlayıcı tarafı istem önbelleğe almayı otomatik olarak yönetir. OpenClaw bu isteklere
Anthropic `cache_control` işaretleyicileri enjekte etmez.

DeepSeek önbellek oluşturma en iyi çaba esasına dayanır ve birkaç saniye sürebilir. Anında
gelen takip isteği yine de `cached_tokens: 0` gösterebilir; kısa bir gecikmeden sonra
tekrarlanan aynı önekli bir istekle doğrulayın ve önbellek isabeti sinyali olarak
`usage.prompt_tokens_details.cached_tokens` değerini kullanın.

Modeli rastgele bir OpenAI uyumlu proxy URL’sine yeniden yönlendirirseniz OpenClaw
bu OpenRouter’a özgü Anthropic önbellek işaretleyicilerini enjekte etmeyi durdurur.

### Diğer sağlayıcılar

Sağlayıcı bu önbellek modunu desteklemiyorsa `cacheRetention` etkisizdir.

### Google Gemini doğrudan API

- Doğrudan Gemini aktarımı (`api: "google-generative-ai"`), önbellek isabetlerini
  üst kaynak `cachedContentTokenCount` üzerinden bildirir; OpenClaw bunu `cacheRead` değerine eşler.
- Doğrudan Gemini modelinde `cacheRetention` ayarlandığında OpenClaw, Google AI Studio çalıştırmalarındaki sistem istemleri için
  `cachedContents` kaynaklarını otomatik olarak oluşturur, yeniden kullanır ve yeniler. Bu, artık
  önbelleğe alınmış içerik tanıtıcısını elle önceden oluşturmanız gerekmediği anlamına gelir.
- Yine de önceden var olan bir Gemini önbelleğe alınmış içerik tanıtıcısını yapılandırılmış
  modelde `params.cachedContent` (veya eski `params.cached_content`) olarak geçirebilirsiniz.
- Bu, Anthropic/OpenAI istem öneki önbelleğe almadan ayrıdır. Gemini için
  OpenClaw, isteğe önbellek işaretleyicileri enjekte etmek yerine sağlayıcıya özgü bir
  `cachedContents` kaynağını yönetir.

### Gemini CLI kullanımı

- Gemini CLI `stream-json` çıktısı, önbellek isabetlerini `stats.cached` üzerinden gösterebilir;
  OpenClaw bunu `cacheRead` değerine eşler. Eski `--output-format json` geçersiz kılmaları
  aynı kullanım normalleştirmesini kullanır.
- CLI doğrudan bir `stats.input` değerini atlıyorsa OpenClaw giriş tokenlarını
  `stats.input_tokens - stats.cached` değerinden türetir.
- Bu yalnızca kullanım normalleştirmesidir. OpenClaw’ın Gemini CLI için
  Anthropic/OpenAI tarzı istem önbelleği işaretleyicileri oluşturduğu anlamına gelmez.

## Sistem istemi önbellek sınırı

OpenClaw, sistem istemini dahili bir önbellek öneki sınırıyla ayrılan **kararlı önek** ve **değişken
sonek** olarak böler. Sınırın üstündeki içerik (araç tanımları, Skills meta verileri, çalışma alanı dosyaları ve diğer
görece statik bağlam), turlar arasında byte düzeyinde aynı kalacak şekilde sıralanır.
Sınırın altındaki içeriğin (örneğin `HEARTBEAT.md`, çalışma zamanı zaman damgaları ve
diğer tur başına meta veriler), önbelleğe alınmış öneki geçersiz kılmadan değişmesine izin verilir.

Temel tasarım seçimleri:

- Kararlı çalışma alanı proje bağlamı dosyaları `HEARTBEAT.md` öncesinde sıralanır; böylece
  heartbeat değişkenliği kararlı öneki bozmaz.
- Sınır, Anthropic ailesi, OpenAI ailesi, Google ve
  CLI aktarım şekillendirmesi genelinde uygulanır; böylece desteklenen tüm sağlayıcılar aynı önek
  kararlılığından yararlanır.
- Codex Responses ve Anthropic Vertex istekleri,
  önbellek yeniden kullanımının sağlayıcıların gerçekten aldığı içerikle hizalı kalması için
  sınır farkındalıklı önbellek şekillendirmesinden geçirilir.
- Sistem istemi parmak izleri normalleştirilir (boşluk, satır sonları,
  hook ile eklenen bağlam, çalışma zamanı yetenek sıralaması); böylece anlamsal olarak değişmeyen
  istemler turlar arasında KV/önbellek paylaşır.

Bir yapılandırma veya çalışma alanı değişikliğinden sonra beklenmeyen `cacheWrite` sıçramaları görürseniz,
değişikliğin önbellek sınırının üstüne mi altına mı düştüğünü kontrol edin. Değişken
içeriği sınırın altına taşımak (veya kararlı hâle getirmek) çoğu zaman
sorunu çözer.

## OpenClaw önbellek kararlılığı korumaları

OpenClaw ayrıca istek sağlayıcıya ulaşmadan önce önbelleğe duyarlı birkaç yük şeklini deterministik tutar:

- Bundle MCP araç katalogları, araç kaydından önce deterministik olarak sıralanır; böylece
  `listTools()` sıra değişiklikleri araçlar bloğunu değiştirmez ve istem önbelleği öneklerini
  bozmaz.
- Kalıcı görüntü blokları olan eski oturumlar **en son tamamlanan 3 turu**
  olduğu gibi tutar; daha eski, zaten işlenmiş görüntü blokları bir işaretleyiciyle
  değiştirilebilir, böylece görüntü ağırlıklı takip istekleri büyük
  eski yükleri yeniden göndermeye devam etmez.

## Ayarlama örüntüleri

### Karma trafik (önerilen varsayılan)

Ana ajanınızda uzun ömürlü bir taban çizgisi tutun, ani bildirim ajanlarında önbelleğe almayı devre dışı bırakın:

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

### Önce maliyet taban çizgisi

- Taban çizgisi `cacheRetention: "short"` ayarlayın.
- `contextPruning.mode: "cache-ttl"` etkinleştirin.
- Heartbeat değerini yalnızca sıcak önbelleklerden yararlanan ajanlar için TTL’nizin altında tutun.

## Önbellek tanılama

OpenClaw, gömülü ajan çalıştırmaları için özel önbellek izleme tanılamaları sunar.

Normal kullanıcıya dönük tanılamalarda `/status` ve diğer kullanım özetleri,
canlı oturum girdisinde bu sayaçlar olmadığında `cacheRead` /
`cacheWrite` için geri dönüş kaynağı olarak en son transkript kullanım girdisini kullanabilir.

## Canlı regresyon testleri

OpenClaw, tekrarlanan önekler, araç turları, görüntü turları, MCP tarzı araç transkriptleri ve Anthropic önbelleksiz kontrol için tek bir birleşik canlı önbellek regresyon kapısı tutar.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Dar canlı kapıyı şu komutla çalıştırın:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Temel dosya, en son gözlemlenen canlı sayıları ve test tarafından kullanılan sağlayıcıya özgü regresyon tabanlarını saklar.
Çalıştırıcı ayrıca her çalıştırma için yeni oturum kimlikleri ve istem ad alanları kullanır; böylece önceki önbellek durumu geçerli regresyon örneğini kirletmez.

Bu testler, sağlayıcılar arasında kasıtlı olarak aynı başarı ölçütlerini kullanmaz.

### Anthropic canlı beklentileri

- `cacheWrite` üzerinden açık ısınma yazmaları bekleyin.
- Anthropic önbellek denetimi, önbellek kesme noktasını konuşma boyunca ilerlettiği için tekrarlanan turlarda geçmişin neredeyse tamamının yeniden kullanılmasını bekleyin.
- Geçerli canlı doğrulamalar, kararlı, araç ve görüntü yolları için hâlâ yüksek isabet oranı eşiklerini kullanır.

### OpenAI canlı beklentileri

- Yalnızca `cacheRead` bekleyin. `cacheWrite` `0` olarak kalır.
- Tekrarlanan tur önbellek yeniden kullanımını, Anthropic tarzı hareketli tam geçmiş yeniden kullanımı olarak değil, sağlayıcıya özgü bir plato olarak ele alın.
- Geçerli canlı doğrulamalar, `gpt-5.4-mini` üzerinde gözlemlenen canlı davranıştan türetilmiş ihtiyatlı taban denetimleri kullanır:
  - kararlı önek: `cacheRead >= 4608`, isabet oranı `>= 0.90`
  - araç transkripti: `cacheRead >= 4096`, isabet oranı `>= 0.85`
  - görüntü transkripti: `cacheRead >= 3840`, isabet oranı `>= 0.82`
  - MCP tarzı transkript: `cacheRead >= 4096`, isabet oranı `>= 0.85`

2026-04-04 tarihinde yapılan yeni birleşik canlı doğrulama şu değerlere ulaştı:

- kararlı önek: `cacheRead=4864`, isabet oranı `0.966`
- araç transkripti: `cacheRead=4608`, isabet oranı `0.896`
- görüntü transkripti: `cacheRead=4864`, isabet oranı `0.954`
- MCP tarzı transkript: `cacheRead=4608`, isabet oranı `0.891`

Birleşik kapı için yakın tarihli yerel duvar saati süresi yaklaşık `88s` idi.

Doğrulamaların farklı olmasının nedeni:

- Anthropic, açık önbellek kesme noktalarını ve hareketli konuşma geçmişi yeniden kullanımını sunar.
- OpenAI istem önbelleğe alma hâlâ tam önek duyarlıdır, ancak canlı Responses trafiğinde etkili yeniden kullanılabilir önek, tam istemden daha erken bir platoya ulaşabilir.
- Bu nedenle Anthropic ve OpenAI'yi tek bir sağlayıcılar arası yüzde eşiğiyle karşılaştırmak yanlış regresyonlar oluşturur.

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

### Ortam geçişleri (tek seferlik hata ayıklama)

- `OPENCLAW_CACHE_TRACE=1` önbellek izlemeyi etkinleştirir.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` çıktı yolunu geçersiz kılar.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` tam ileti yükü yakalamayı açıp kapatır.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` istem metni yakalamayı açıp kapatır.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` sistem istemi yakalamayı açıp kapatır.

### Neleri incelemeli

- Önbellek izleme olayları JSONL biçimindedir ve `session:loaded`, `prompt:before`, `stream:context` ve `session:after` gibi aşamalı anlık görüntüler içerir.
- Tur başına önbellek belirteci etkisi, normal kullanım yüzeylerinde `cacheRead` ve `cacheWrite` üzerinden görünür (örneğin `/usage tokens`, `/status`, oturum kullanım özetleri ve özel `messages.usageTemplate` düzenleri).
- Anthropic için, önbelleğe alma etkinken hem `cacheRead` hem de `cacheWrite` bekleyin.
- OpenAI için, önbellek isabetlerinde `cacheRead` bekleyin. GPT-5.6 Responses, istem segmentleri yazılırken `cacheWrite` da bildirebilir; yazma sayacını atlayan diğer Responses yükleri bunu `0` olarak tutar.
- İstek izlemeye ihtiyacınız varsa, istek kimliklerini ve hız sınırı başlıklarını önbellek metriklerinden ayrı olarak günlüğe kaydedin. OpenClaw'ın geçerli önbellek izleme çıktısı, ham sağlayıcı yanıt başlıklarından ziyade istem/oturum şekline ve normalleştirilmiş belirteç kullanımına odaklanır.

## Hızlı sorun giderme

- Çoğu turda yüksek `cacheWrite`: değişken sistem istemi girdilerini denetleyin ve modelin/sağlayıcının önbellek ayarlarınızı desteklediğini doğrulayın.
- Anthropic üzerinde yüksek `cacheWrite`: çoğu zaman önbellek kesme noktasının her istekte değişen içeriğe denk geldiği anlamına gelir.
- Düşük OpenAI `cacheRead`: kararlı önekin en başta olduğunu, tekrarlanan önekin en az 1024 belirteç olduğunu ve önbelleği paylaşması gereken turlar için aynı `prompt_cache_key` değerinin yeniden kullanıldığını doğrulayın.
- `cacheRetention` etkisiz: model anahtarının `agents.defaults.models["provider/model"]` ile eşleştiğini doğrulayın.
- Önbellek ayarlarıyla Bedrock Nova/Mistral istekleri: çalışma zamanının `none` değerine zorlaması beklenir.

İlgili belgeler:

- [Anthropic](/tr/providers/anthropic)
- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [Oturum budama](/tr/concepts/session-pruning)
- [Gateway yapılandırma başvurusu](/tr/gateway/configuration-reference)

## İlgili

- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
