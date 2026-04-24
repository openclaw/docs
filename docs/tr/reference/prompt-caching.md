---
read_when:
    - Önbellek tutma ile prompt token maliyetlerini azaltmak istiyorsunuz
    - Çok agent'li kurulumlarda agent başına önbellek davranışına ihtiyacınız var
    - Heartbeat ve cache-ttl budamayı birlikte ayarlıyorsunuz
summary: Prompt önbellekleme düğmeleri, birleştirme sırası, sağlayıcı davranışı ve ayarlama desenleri
title: Prompt önbellekleme
x-i18n:
    generated_at: "2026-04-24T09:29:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

Prompt önbellekleme, model sağlayıcısının her turda değişmeyen prompt öneklerini (genellikle sistem/geliştirici talimatları ve diğer kararlı bağlam) her seferinde yeniden işlemeden tekrar kullanabilmesi anlamına gelir. OpenClaw, yukarı akış API bu sayaçları doğrudan sunduğunda sağlayıcı kullanımını `cacheRead` ve `cacheWrite` olarak normalize eder.

Durum yüzeyleri ayrıca, canlı oturum anlık görüntüsünde bu sayaçlar eksik olduğunda, en son döküm kullanım günlüğünden önbellek sayaçlarını geri yükleyebilir; böylece `/status`, kısmi oturum meta veri kaybından sonra da bir önbellek satırı göstermeye devam edebilir. Mevcut sıfır olmayan canlı önbellek değerleri yine de döküm fallback değerlerine göre önceliklidir.

Bunun önemi şudur: daha düşük token maliyeti, daha hızlı yanıtlar ve uzun süre çalışan oturumlar için daha öngörülebilir performans. Önbellekleme olmadan, çoğu girdi değişmese bile yinelenen prompt'lar her turda tam prompt maliyetini öder.

Bu sayfa, prompt yeniden kullanımını ve token maliyetini etkileyen tüm önbellek düğmelerini kapsar.

Sağlayıcı başvuruları:

- Anthropic prompt önbellekleme: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt önbellekleme: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API başlıkları ve istek kimlikleri: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic istek kimlikleri ve hatalar: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Birincil düğmeler

### `cacheRetention` (genel varsayılan, model ve agent başına)

Tüm modeller için önbellek tutmayı genel varsayılan olarak ayarlayın:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Model başına geçersiz kılma:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Agent başına geçersiz kılma:

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
3. `agents.list[].params` (eşleşen agent kimliği; anahtara göre geçersiz kılar)

### `contextPruning.mode: "cache-ttl"`

Eski araç-sonuç bağlamını önbellek TTL pencerelerinden sonra budar; böylece boşta kalma sonrası istekler aşırı büyük geçmişi yeniden önbelleğe almaz.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Tam davranış için bkz. [Session Pruning](/tr/concepts/session-pruning).

### Heartbeat sıcak tutma

Heartbeat, önbellek pencerelerini sıcak tutabilir ve boşta kalma aralarından sonra yinelenen önbellek yazımlarını azaltabilir.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Agent başına Heartbeat, `agents.list[].heartbeat` konumunda desteklenir.

## Sağlayıcı davranışı

### Anthropic (doğrudan API)

- `cacheRetention` desteklenir.
- Anthropic API anahtarı auth profilleriyle OpenClaw, ayarlanmamışsa Anthropic model ref'leri için `cacheRetention: "short"` değeri ekler.
- Anthropic yerel Messages yanıtları hem `cache_read_input_tokens` hem de `cache_creation_input_tokens` alanlarını açığa çıkarır; böylece OpenClaw hem `cacheRead` hem de `cacheWrite` gösterebilir.
- Yerel Anthropic isteklerinde `cacheRetention: "short"`, varsayılan 5 dakikalık geçici önbelleğe eşlenir ve `cacheRetention: "long"` yalnızca doğrudan `api.anthropic.com` host'larında 1 saatlik TTL'ye yükselir.

### OpenAI (doğrudan API)

- Prompt önbellekleme desteklenen yeni modellerde otomatiktir. OpenClaw'ın blok düzeyinde önbellek işaretçileri enjekte etmesi gerekmez.
- OpenClaw, turlar arasında önbellek yönlendirmesini kararlı tutmak için `prompt_cache_key` kullanır ve `cacheRetention: "long"` yalnızca doğrudan OpenAI host'larında seçildiğinde `prompt_cache_retention: "24h"` kullanır.
- OpenAI, önbelleğe alınmış prompt token'larını `usage.prompt_tokens_details.cached_tokens` (veya Responses API olaylarında `input_tokens_details.cached_tokens`) üzerinden açığa çıkarır. OpenClaw bunu `cacheRead` olarak eşler.
- OpenAI ayrı bir önbellek-yazma token sayacı açığa çıkarmaz; bu nedenle sağlayıcı önbelleği ısıtıyor olsa bile OpenAI yollarında `cacheWrite` `0` kalır.
- OpenAI, `x-request-id`, `openai-processing-ms` ve `x-ratelimit-*` gibi faydalı izleme ve hız sınırı başlıkları döndürür, ancak önbellek isabet hesaplaması başlıklardan değil kullanım payload'undan gelmelidir.
- Pratikte OpenAI, Anthropic tarzı kayan tam geçmiş yeniden kullanımından çok ilk-önek önbelleği gibi davranır. Kararlı uzun önekli metin turları mevcut canlı probe'larda `4864` önbelleğe alınmış token platosuna yaklaşabilirken, araç ağırlıklı veya MCP tarzı dökümler tam tekrar durumunda bile çoğu zaman `4608` önbelleğe alınmış token civarında plato yapar.

### Anthropic Vertex

- Vertex AI üzerindeki Anthropic modelleri (`anthropic-vertex/*`), `cacheRetention` desteğini doğrudan Anthropic ile aynı şekilde sunar.
- `cacheRetention: "long"`, Vertex AI uç noktalarında gerçek 1 saatlik prompt-cache TTL'ye eşlenir.
- `anthropic-vertex` için varsayılan önbellek tutma, doğrudan Anthropic varsayılanlarıyla eşleşir.
- Vertex istekleri, önbellek yeniden kullanımının sağlayıcıların gerçekte aldığı içerikle hizalı kalması için sınır farkındalıklı önbellek şekillendirme üzerinden yönlendirilir.

### Amazon Bedrock

- Anthropic Claude model ref'leri (`amazon-bedrock/*anthropic.claude*`) açık `cacheRetention` geçiş desteği sunar.
- Anthropic olmayan Bedrock modelleri çalışma zamanında `cacheRetention: "none"` olmaya zorlanır.

### OpenRouter Anthropic modelleri

`openrouter/anthropic/*` model ref'leri için OpenClaw, istek hâlâ doğrulanmış bir OpenRouter rotasını
hedefliyorsa yalnızca sistem/geliştirici prompt bloklarına Anthropic
`cache_control` enjekte eder; böylece prompt-cache
yeniden kullanımı iyileşir (`openrouter` varsayılan uç noktasında veya `openrouter.ai`'ye çözümlenen herhangi bir sağlayıcı/base URL'de).

Modeli keyfi bir OpenAI uyumlu proxy URL'sine yeniden yönlendirirseniz OpenClaw,
bu OpenRouter'a özgü Anthropic önbellek işaretçilerini enjekte etmeyi durdurur.

### Diğer sağlayıcılar

Sağlayıcı bu önbellek modunu desteklemiyorsa `cacheRetention` etkisizdir.

### Google Gemini doğrudan API

- Doğrudan Gemini taşıması (`api: "google-generative-ai"`), önbellek isabetlerini
  yukarı akış `cachedContentTokenCount` üzerinden raporlar; OpenClaw bunu `cacheRead` olarak eşler.
- Doğrudan bir Gemini modeli üzerinde `cacheRetention` ayarlandığında OpenClaw,
  Google AI Studio çalıştırmalarında sistem prompt'ları için `cachedContents` kaynaklarını otomatik olarak
  oluşturur, yeniden kullanır ve yeniler. Bu, artık
  önceden elle önbelleğe alınmış içerik tanıtıcısı oluşturmanız gerekmediği anlamına gelir.
- Önceden var olan bir Gemini önbelleğe alınmış içerik tanıtıcısını
  yapılandırılmış model üzerinde `params.cachedContent` (veya eski `params.cached_content`) olarak yine de geçebilirsiniz.
- Bu, Anthropic/OpenAI prompt-önek önbelleklemesinden ayrıdır. Gemini için
  OpenClaw, isteğe önbellek işaretçileri enjekte etmek yerine sağlayıcıya özgü yerel bir `cachedContents` kaynağını yönetir.

### Gemini CLI JSON kullanımı

- Gemini CLI JSON çıktısı ayrıca önbellek isabetlerini `stats.cached` üzerinden gösterebilir;
  OpenClaw bunu `cacheRead` olarak eşler.
- CLI doğrudan bir `stats.input` değeri vermezse OpenClaw giriş token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.
- Bu yalnızca kullanım normalizasyonudur. OpenClaw'ın
  Gemini CLI için Anthropic/OpenAI tarzı prompt-cache işaretçileri oluşturduğu anlamına gelmez.

## Sistem prompt'u önbellek sınırı

OpenClaw, sistem prompt'unu iç bir önbellek-önek sınırıyla ayrılmış **kararlı bir önek** ve **değişken
bir sonek** olarak böler. Sınırın üstündeki içerik
(araç tanımları, Skills meta verileri, çalışma alanı dosyaları ve diğer
nispeten statik bağlam), turlar arasında bayt düzeyinde aynı kalacak şekilde sıralanır.
Sınırın altındaki içerik (`HEARTBEAT.md`, çalışma zamanı zaman damgaları ve
diğer tur başına meta veriler gibi) önbelleğe alınmış öneki geçersiz kılmadan
değişebilir.

Temel tasarım tercihleri:

- Kararlı çalışma alanı proje-bağlam dosyaları `HEARTBEAT.md` dosyasından önce sıralanır; böylece
  Heartbeat dalgalanması kararlı öneki bozmaz.
- Sınır, Anthropic ailesi, OpenAI ailesi, Google ve
  CLI taşıma şekillendirmesi genelinde uygulanır; böylece desteklenen tüm sağlayıcılar aynı önek
  kararlılığından yararlanır.
- Codex Responses ve Anthropic Vertex istekleri
  sınır farkındalıklı önbellek şekillendirme üzerinden yönlendirilir; böylece önbellek yeniden kullanımı sağlayıcıların gerçekten aldığı içerikle hizalı kalır.
- Sistem prompt'u parmak izleri normalize edilir (boşluk, satır sonları,
  hook eklenmiş bağlam, çalışma zamanı yetenek sıralaması); böylece anlamsal olarak değişmemiş
  prompt'lar turlar arasında KV/önbellek paylaşır.

Bir yapılandırma veya çalışma alanı değişikliğinden sonra beklenmedik `cacheWrite` sıçramaları görürseniz,
değişikliğin önbellek sınırının üstüne mi altına mı geldiğini kontrol edin. Değişken içeriği sınırın altına taşımak
(veya onu kararlı hale getirmek) çoğu zaman sorunu çözer.

## OpenClaw önbellek kararlılığı korumaları

OpenClaw ayrıca istek sağlayıcıya ulaşmadan önce önbelleğe duyarlı birkaç payload şeklini de deterministik tutar:

- Bundle MCP araç katalogları, araç
  kaydından önce deterministik olarak sıralanır; böylece `listTools()` sırası değişiklikleri araç bloğunu dalgalandırıp
  prompt-cache öneklerini bozmaz.
- Kalıcılaştırılmış görüntü blokları olan eski oturumlar **en son 3 tamamlanmış
  turu** olduğu gibi korur; daha eski, zaten işlenmiş görüntü blokları
  bir işaretleyiciyle değiştirilebilir; böylece görüntü ağırlıklı takipler büyük
  eski payload'ları sürekli yeniden göndermez.

## Ayarlama desenleri

### Karışık trafik (önerilen varsayılan)

Ana agent'inizde uzun ömürlü bir temel tutun, patlamalı bildirimci agent'lerde önbelleği devre dışı bırakın:

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

- Temel çizgi olarak `cacheRetention: "short"` ayarlayın.
- `contextPruning.mode: "cache-ttl"` etkinleştirin.
- Heartbeat'i TTL'nizin altında yalnızca sıcak önbellekten fayda gören agent'ler için tutun.

## Önbellek tanılamaları

OpenClaw, gömülü agent çalıştırmaları için özel önbellek-iz tanılamaları açığa çıkarır.

Normal kullanıcıya dönük tanılamalar için `/status` ve diğer kullanım özetleri,
canlı oturum girdisinde bu sayaçlar yoksa `cacheRead` /
`cacheWrite` için fallback kaynak olarak en son döküm kullanım girdisini kullanabilir.

## Canlı regresyon testleri

OpenClaw; yinelenen önekler, araç turları, görüntü turları, MCP tarzı araç dökümleri ve Anthropic önbelleksiz kontrol için birleşik bir canlı önbellek regresyon geçidi tutar.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Dar canlı geçidi şu komutla çalıştırın:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Temel çizgi dosyası, en son gözlemlenen canlı sayıları ve testin kullandığı sağlayıcıya özgü regresyon taban eşiklerini saklar.
Çalıştırıcı ayrıca önceki önbellek durumunun mevcut regresyon örneğini kirletmemesi için
çalıştırma başına yeni oturum kimlikleri ve prompt ad alanları kullanır.

Bu testler bilerek sağlayıcılar arasında özdeş başarı ölçütleri kullanmaz.

### Anthropic canlı beklentileri

- `cacheWrite` üzerinden açık ısınma yazımları bekleyin.
- Yinelenen turlarda neredeyse tam geçmiş yeniden kullanımını bekleyin; çünkü Anthropic önbellek denetimi önbellek kırılma noktasını konuşma boyunca ilerletir.
- Geçerli canlı doğrulamalar kararlı, araç ve görüntü yolları için hâlâ yüksek isabet oranı eşikleri kullanır.

### OpenAI canlı beklentileri

- Yalnızca `cacheRead` bekleyin. `cacheWrite` `0` kalır.
- Yinelenen tur önbellek yeniden kullanımını Anthropic tarzı kayan tam geçmiş yeniden kullanımı olarak değil, sağlayıcıya özgü bir plato olarak değerlendirin.
- Geçerli canlı doğrulamalar `gpt-5.4-mini` üzerinde gözlemlenen canlı davranıştan türetilmiş muhafazakâr taban denetimleri kullanır:
  - kararlı önek: `cacheRead >= 4608`, isabet oranı `>= 0.90`
  - araç dökümü: `cacheRead >= 4096`, isabet oranı `>= 0.85`
  - görüntü dökümü: `cacheRead >= 3840`, isabet oranı `>= 0.82`
  - MCP tarzı döküm: `cacheRead >= 4096`, isabet oranı `>= 0.85`

2026-04-04 tarihli yeni birleşik canlı doğrulama şu değere ulaştı:

- kararlı önek: `cacheRead=4864`, isabet oranı `0.966`
- araç dökümü: `cacheRead=4608`, isabet oranı `0.896`
- görüntü dökümü: `cacheRead=4864`, isabet oranı `0.954`
- MCP tarzı döküm: `cacheRead=4608`, isabet oranı `0.891`

Birleşik geçit için son yerel duvar saati süresi yaklaşık `88s` idi.

Doğrulamaların neden farklı olduğu:

- Anthropic açık önbellek kırılma noktaları ve kayan konuşma-geçmişi yeniden kullanımı açığa çıkarır.
- OpenAI prompt önbelleklemesi hâlâ tam önek duyarlıdır, ancak canlı Responses trafiğinde etkili yeniden kullanılabilir önek tam prompt'tan daha erken plato yapabilir.
- Bu nedenle Anthropic ve OpenAI'yi sağlayıcılar arası tek bir yüzde eşiğiyle karşılaştırmak yanlış regresyonlar üretir.

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

### Env geçişleri (tek seferlik hata ayıklama)

- `OPENCLAW_CACHE_TRACE=1` önbellek izlemesini etkinleştirir.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` çıktı yolunu geçersiz kılar.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` tam mesaj payload'u yakalamayı açar/kapatır.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` prompt metni yakalamayı açar/kapatır.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` sistem prompt'u yakalamayı açar/kapatır.

### Neye bakılmalı

- Önbellek iz olayları JSONL biçimindedir ve `session:loaded`, `prompt:before`, `stream:context` ve `session:after` gibi aşamalı anlık görüntüler içerir.
- Tur başına önbellek token etkisi normal kullanım yüzeylerinde `cacheRead` ve `cacheWrite` üzerinden görünür (örneğin `/usage full` ve oturum kullanım özetleri).
- Anthropic için önbellekleme etkin olduğunda hem `cacheRead` hem de `cacheWrite` bekleyin.
- OpenAI için önbellek isabetlerinde `cacheRead` bekleyin ve `cacheWrite` değerinin `0` kalmasını bekleyin; OpenAI ayrı bir önbellek-yazma token alanı yayımlamaz.
- İstek izlemesine ihtiyacınız varsa istek kimliklerini ve hız sınırı başlıklarını önbellek ölçümlerinden ayrı günlüğe alın. OpenClaw'ın geçerli cache-trace çıktısı, ham sağlayıcı yanıt başlıklarından çok prompt/oturum şekli ve normalize edilmiş token kullanımına odaklanır.

## Hızlı sorun giderme

- Çoğu turda yüksek `cacheWrite`: değişken sistem prompt girdilerini kontrol edin ve modelin/sağlayıcının önbellek ayarlarınızı desteklediğini doğrulayın.
- Anthropic üzerinde yüksek `cacheWrite`: çoğu zaman önbellek kırılma noktasının her istekte değişen içeriğe denk geldiği anlamına gelir.
- Düşük OpenAI `cacheRead`: kararlı önekin başta olduğunu, yinelenen önekin en az 1024 token olduğunu ve önbelleği paylaşması gereken turlar için aynı `prompt_cache_key` değerinin yeniden kullanıldığını doğrulayın.
- `cacheRetention` etkisiz: model anahtarının `agents.defaults.models["provider/model"]` ile eşleştiğini doğrulayın.
- Önbellek ayarlı Bedrock Nova/Mistral istekleri: çalışma zamanında `none` değerine zorlanması beklenir.

İlgili belgeler:

- [Anthropic](/tr/providers/anthropic)
- [Token Use and Costs](/tr/reference/token-use)
- [Session Pruning](/tr/concepts/session-pruning)
- [Gateway Configuration Reference](/tr/gateway/configuration-reference)

## İlgili

- [Token use and costs](/tr/reference/token-use)
- [API usage and costs](/tr/reference/api-usage-costs)
