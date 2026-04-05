---
read_when:
    - Önbellek saklamayla istem belirteci maliyetlerini azaltmak istiyorsunuz
    - Çoklu aracı kurulumlarında aracı başına önbellek davranışına ihtiyacınız var
    - Heartbeat ve cache-ttl budamayı birlikte ayarlıyorsunuz
summary: İstem önbellekleme ayarları, birleştirme sırası, sağlayıcı davranışı ve ayarlama kalıpları
title: İstem Önbellekleme
x-i18n:
    generated_at: "2026-04-05T14:07:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# İstem önbellekleme

İstem önbellekleme, model sağlayıcısının her turda değişmeyen istem öneklerini (genellikle sistem/geliştirici talimatları ve diğer kararlı bağlam) her seferinde yeniden işlemlemek yerine turlar arasında yeniden kullanabilmesi anlamına gelir. OpenClaw, yukarı akış API bu sayaçları doğrudan sunduğunda sağlayıcı kullanımını `cacheRead` ve `cacheWrite` olarak normalize eder.

Canlı oturum anlık görüntüsünde bunlar eksik olduğunda durum yüzeyleri en son transkript kullanım
günlüğünden önbellek sayaçlarını da geri alabilir; böylece `/status`, oturum meta verilerinin kısmen
kaybolmasından sonra bile bir önbellek satırı göstermeye devam edebilir. Mevcut sıfır olmayan canlı
önbellek değerleri yine de transkript geri dönüş değerlerine göre önceliklidir.

Bunun neden önemli olduğu: daha düşük belirteç maliyeti, daha hızlı yanıtlar ve uzun süre çalışan oturumlar için daha öngörülebilir performans. Önbellekleme olmadan, tekrar eden istemler girdinin büyük kısmı değişmemiş olsa bile her turda tam istem maliyetini öder.

Bu sayfa, istem yeniden kullanımını ve belirteç maliyetini etkileyen tüm önbellekle ilgili ayarları kapsar.

Sağlayıcı başvuruları:

- Anthropic istem önbellekleme: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI istem önbellekleme: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API üstbilgileri ve istek kimlikleri: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic istek kimlikleri ve hatalar: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Birincil ayarlar

### `cacheRetention` (genel varsayılan, model ve aracı başına)

Tüm modeller için önbellek saklamayı genel varsayılan olarak ayarlayın:

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

Aracı başına geçersiz kılma:

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
3. `agents.list[].params` (eşleşen aracı kimliği; anahtara göre geçersiz kılar)

### `contextPruning.mode: "cache-ttl"`

Boşta kalma sonrası isteklerin aşırı büyük geçmişi yeniden önbelleğe almaması için, önbellek TTL pencerelerinden sonra eski araç-sonucu bağlamını budar.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Tam davranış için [Oturum Budama](/tr/concepts/session-pruning) bölümüne bakın.

### Heartbeat sıcak tutma

Heartbeat, önbellek pencerelerini sıcak tutabilir ve boşta kalma aralıklarından sonra tekrar eden önbellek yazımlarını azaltabilir.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Aracı başına heartbeat, `agents.list[].heartbeat` altında desteklenir.

## Sağlayıcı davranışı

### Anthropic (doğrudan API)

- `cacheRetention` desteklenir.
- Anthropic API anahtarı kimlik doğrulama profilleriyle, OpenClaw ayarlanmamış Anthropic model başvuruları için `cacheRetention: "short"` ekler.
- Anthropic yerel Messages yanıtları hem `cache_read_input_tokens` hem de `cache_creation_input_tokens` değerlerini sunar; bu nedenle OpenClaw hem `cacheRead` hem de `cacheWrite` gösterebilir.
- Yerel Anthropic isteklerinde, `cacheRetention: "short"` varsayılan 5 dakikalık geçici önbelleğe eşlenir ve `cacheRetention: "long"` yalnızca doğrudan `api.anthropic.com` ana bilgisayarlarında 1 saatlik TTL'ye yükseltilir.

### OpenAI (doğrudan API)

- İstem önbellekleme desteklenen yeni modellerde otomatiktir. OpenClaw'ın blok düzeyinde önbellek işaretçileri eklemesi gerekmez.
- OpenClaw, turlar arasında önbellek yönlendirmesini kararlı tutmak için `prompt_cache_key` kullanır ve `prompt_cache_retention: "24h"` değerini yalnızca doğrudan OpenAI ana bilgisayarlarında `cacheRetention: "long"` seçildiğinde kullanır.
- OpenAI yanıtları, önbelleğe alınmış istem belirteçlerini `usage.prompt_tokens_details.cached_tokens` aracılığıyla gösterir (veya Responses API olaylarında `input_tokens_details.cached_tokens`). OpenClaw bunu `cacheRead` değerine eşler.
- OpenAI ayrı bir önbellek-yazma belirteç sayacı sunmaz; bu nedenle sağlayıcı önbelleği ısıtıyor olsa bile OpenAI yollarında `cacheWrite` `0` olarak kalır.
- OpenAI, `x-request-id`, `openai-processing-ms` ve `x-ratelimit-*` gibi yararlı izleme ve hız sınırı üstbilgileri döndürür, ancak önbellek isabeti hesaplaması üstbilgilerden değil kullanım yükünden alınmalıdır.
- Pratikte OpenAI, Anthropic tarzı hareketli tam geçmiş yeniden kullanımı yerine genellikle ilk önek önbelleği gibi davranır. Kararlı uzun önekli metin turları, mevcut canlı problarda `4864` önbelleğe alınmış belirteç platosuna yaklaşabilirken, araç ağırlıklı veya MCP tarzı transkriptler tam tekrar durumunda bile genellikle `4608` önbelleğe alınmış belirteç civarında plato yapar.

### Anthropic Vertex

- Vertex AI üzerindeki Anthropic modelleri (`anthropic-vertex/*`) `cacheRetention` özelliğini doğrudan Anthropic ile aynı şekilde destekler.
- `cacheRetention: "long"`, Vertex AI uç noktalarında gerçek 1 saatlik istem önbelleği TTL'sine eşlenir.
- `anthropic-vertex` için varsayılan önbellek saklama, doğrudan Anthropic varsayılanlarıyla aynıdır.
- Vertex istekleri, önbellek yeniden kullanımının sağlayıcıların gerçekte aldıklarıyla uyumlu kalması için sınır farkındalıklı önbellek şekillendirme üzerinden yönlendirilir.

### Amazon Bedrock

- Anthropic Claude model başvuruları (`amazon-bedrock/*anthropic.claude*`) açık `cacheRetention` geçişini destekler.
- Anthropic olmayan Bedrock modelleri çalışma zamanında `cacheRetention: "none"` değerine zorlanır.

### OpenRouter Anthropic modelleri

`openrouter/anthropic/*` model başvurularında OpenClaw, istem önbelleği
yeniden kullanımını iyileştirmek için sistem/geliştirici istem bloklarına Anthropic
`cache_control` enjekte eder; ancak bunu yalnızca istek hâlâ doğrulanmış bir OpenRouter rotasını
hedefliyorsa yapar (`openrouter` varsayılan uç noktasında veya `openrouter.ai`
çözümlenen herhangi bir sağlayıcı/base URL üzerinde).

Modeli rastgele bir OpenAI uyumlu proxy URL'sine yeniden yönlendirirseniz, OpenClaw
bu OpenRouter'a özgü Anthropic önbellek işaretçilerini enjekte etmeyi durdurur.

### Diğer sağlayıcılar

Sağlayıcı bu önbellek modunu desteklemiyorsa `cacheRetention` etkisizdir.

### Google Gemini doğrudan API

- Doğrudan Gemini taşıması (`api: "google-generative-ai"`), yukarı akış `cachedContentTokenCount` aracılığıyla önbellek isabetlerini bildirir; OpenClaw bunu `cacheRead` değerine eşler.
- Doğrudan bir Gemini modelinde `cacheRetention` ayarlandığında OpenClaw, Google AI Studio çalıştırmalarında sistem istemleri için `cachedContents` kaynaklarını otomatik olarak oluşturur, yeniden kullanır ve yeniler. Bu, artık önceden elle bir cached-content tanıtıcısı oluşturmanız gerekmediği anlamına gelir.
- Yine de yapılandırılmış modelde `params.cachedContent` (veya eski `params.cached_content`) aracılığıyla önceden var olan bir Gemini cached-content tanıtıcısı geçirebilirsiniz.
- Bu, Anthropic/OpenAI istem-önek önbelleklemesinden ayrıdır. Gemini için OpenClaw, isteğe önbellek işaretçileri enjekte etmek yerine sağlayıcıya özgü bir `cachedContents` kaynağını yönetir.

### Gemini CLI JSON kullanımı

- Gemini CLI JSON çıktısı, önbellek isabetlerini `stats.cached` aracılığıyla da gösterebilir; OpenClaw bunu `cacheRead` değerine eşler.
- CLI doğrudan bir `stats.input` değeri atlıyorsa, OpenClaw giriş belirteçlerini `stats.input_tokens - stats.cached` üzerinden türetir.
- Bu yalnızca kullanım normalizasyonudur. Bu, OpenClaw'ın Gemini CLI için Anthropic/OpenAI tarzı istem önbelleği işaretçileri oluşturduğu anlamına gelmez.

## Sistem istemi önbellek sınırı

OpenClaw, sistem istemini bir iç önbellek öneki sınırıyla ayrılmış **kararlı
önek** ve **değişken sonek** olarak böler. Sınırın üzerindeki içerik
(araç tanımları, Skills meta verileri, çalışma alanı dosyaları ve diğer
nispeten statik bağlam) turlar arasında bayt düzeyinde aynı kalacak şekilde
sıralanır. Sınırın altındaki içeriğin (örneğin `HEARTBEAT.md`, çalışma zamanı zaman damgaları ve
tur başına diğer meta veriler) önbelleğe alınmış
öneki geçersiz kılmadan değişmesine izin verilir.

Temel tasarım tercihleri:

- Kararlı çalışma alanı proje-bağlam dosyaları `HEARTBEAT.md` dosyasından önce sıralanır; böylece
  heartbeat kaynaklı değişim kararlı öneki bozmaz.
- Sınır, Anthropic ailesi, OpenAI ailesi, Google ve
  CLI taşıma şekillendirme genelinde uygulanır; böylece desteklenen tüm sağlayıcılar aynı önek
  kararlılığından yararlanır.
- Codex Responses ve Anthropic Vertex istekleri,
  önbellek yeniden kullanımının sağlayıcıların gerçekten aldıklarıyla uyumlu kalması için
  sınır farkındalıklı önbellek şekillendirme üzerinden yönlendirilir.
- Sistem istemi parmak izleri normalize edilir (boşluk, satır sonları,
  hook ile eklenen bağlam, çalışma zamanı yetenek sıralaması); böylece anlamsal olarak değişmemiş
  istemler turlar arasında KV/önbelleği paylaşır.

Bir yapılandırma veya çalışma alanı değişikliğinden sonra beklenmeyen `cacheWrite` sıçramaları görürseniz,
değişikliğin önbellek sınırının üstüne mi yoksa altına mı geldiğini kontrol edin. Değişken
içeriği sınırın altına taşımak (veya kararlı hâle getirmek) çoğu zaman
sorunu çözer.

## OpenClaw önbellek kararlılığı korumaları

OpenClaw ayrıca, istek sağlayıcıya ulaşmadan önce önbelleğe duyarlı çeşitli yük şekillerini belirlenimci tutar:

- Paket MCP araç katalogları, araç
  kaydından önce belirlenimci biçimde sıralanır; böylece `listTools()` sırasındaki değişiklikler araçlar bloğunu değiştirip
  istem önbelleği öneklerini bozmaz.
- Kalıcı görüntü bloklarına sahip eski oturumlar, **en son 3 tamamlanmış
  turu** bozulmadan korur; daha eski ve zaten işlenmiş görüntü blokları bir
  işaretçiyle değiştirilebilir; böylece görüntü ağırlıklı devam turları büyük
  eski yükleri tekrar tekrar göndermeye devam etmez.

## Ayarlama kalıpları

### Karışık trafik (önerilen varsayılan)

Ana aracınızda uzun ömürlü bir temel tutun, ani bildirim aracıları için önbellekleme devre dışı bırakın:

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

### Önce maliyet temeli

- Temel `cacheRetention: "short"` olarak ayarlayın.
- `contextPruning.mode: "cache-ttl"` etkinleştirin.
- Heartbeat'i yalnızca sıcak önbelleklerden fayda sağlayan aracılar için TTL'nizin altında tutun.

## Önbellek tanılamaları

OpenClaw, gömülü aracı çalıştırmaları için özel önbellek izleme tanılamaları sunar.

Normal kullanıcıya yönelik tanılamalarda, `/status` ve diğer kullanım özetleri
canlı oturum girdisinde bu sayaçlar yoksa `cacheRead` /
`cacheWrite` için geri dönüş kaynağı olarak en son transkript kullanım girdisini kullanabilir.

## Canlı regresyon testleri

OpenClaw; tekrar eden önekler, araç turları, görüntü turları, MCP tarzı araç transkriptleri ve bir Anthropic önbelleksiz kontrolü için tek bir birleşik canlı önbellek regresyon geçidi tutar.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Dar kapsamlı canlı geçidi şu komutla çalıştırın:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Temel dosya, en son gözlemlenen canlı sayıları ve test tarafından kullanılan sağlayıcıya özgü regresyon taban eşiklerini depolar.
Çalıştırıcı ayrıca önceki önbellek durumunun mevcut regresyon örneğini kirletmemesi için her çalıştırmada yeni oturum kimlikleri ve istem ad alanları kullanır.

Bu testler, sağlayıcılar arasında kasıtlı olarak aynı başarı ölçütlerini kullanmaz.

### Anthropic canlı beklentileri

- `cacheWrite` aracılığıyla açık ısınma yazımları beklenir.
- Anthropic önbellek denetimi, önbellek kesme noktasını konuşma boyunca ileri taşıdığı için tekrar eden turlarda neredeyse tam geçmiş yeniden kullanımı beklenir.
- Mevcut canlı doğrulamalar, kararlı, araç ve görüntü yollarında hâlâ yüksek isabet oranı eşiklerini kullanır.

### OpenAI canlı beklentileri

- Yalnızca `cacheRead` beklenir. `cacheWrite` `0` olarak kalır.
- Tekrarlanan tur önbellek yeniden kullanımını, Anthropic tarzı hareketli tam geçmiş yeniden kullanımı olarak değil, sağlayıcıya özgü bir plato olarak değerlendirin.
- Geçerli canlı doğrulamalar, `gpt-5.4-mini` üzerindeki gözlemlenen canlı davranıştan türetilmiş ihtiyatlı taban kontrolleri kullanır:
  - kararlı önek: `cacheRead >= 4608`, isabet oranı `>= 0.90`
  - araç transkripti: `cacheRead >= 4096`, isabet oranı `>= 0.85`
  - görüntü transkripti: `cacheRead >= 3840`, isabet oranı `>= 0.82`
  - MCP tarzı transkript: `cacheRead >= 4096`, isabet oranı `>= 0.85`

2026-04-04 tarihindeki yeni birleşik canlı doğrulama şu değerlerle sonuçlandı:

- kararlı önek: `cacheRead=4864`, isabet oranı `0.966`
- araç transkripti: `cacheRead=4608`, isabet oranı `0.896`
- görüntü transkripti: `cacheRead=4864`, isabet oranı `0.954`
- MCP tarzı transkript: `cacheRead=4608`, isabet oranı `0.891`

Birleşik geçit için yakın tarihli yerel duvar saati süresi yaklaşık `88s` idi.

Doğrulamaların neden farklı olduğu:

- Anthropic, açık önbellek kesme noktaları ve hareketli konuşma geçmişi yeniden kullanımı sunar.
- OpenAI istem önbelleklemesi hâlâ tam önek eşleşmesine duyarlıdır, ancak canlı Responses trafiğinde etkili biçimde yeniden kullanılabilen önek, tam istemden daha erken plato yapabilir.
- Bu nedenle Anthropic ve OpenAI'yi sağlayıcılar arası tek bir yüzde eşiğiyle karşılaştırmak yanlış regresyonlar oluşturur.

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

### Ortam değişkeni geçişleri (tek seferlik hata ayıklama)

- `OPENCLAW_CACHE_TRACE=1` önbellek izlemesini etkinleştirir.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` çıktı yolunu geçersiz kılar.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` tam mesaj yükü yakalamayı açıp kapatır.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` istem metni yakalamayı açıp kapatır.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` sistem istemi yakalamayı açıp kapatır.

### İncelenecekler

- Önbellek izleme olayları JSONL biçimindedir ve `session:loaded`, `prompt:before`, `stream:context` ve `session:after` gibi aşamalı anlık görüntüler içerir.
- Tur başına önbellek belirteci etkisi, normal kullanım yüzeylerinde `cacheRead` ve `cacheWrite` üzerinden görülebilir (örneğin `/usage full` ve oturum kullanım özetleri).
- Anthropic için, önbellekleme etkin olduğunda hem `cacheRead` hem de `cacheWrite` bekleyin.
- OpenAI için, önbellek isabetlerinde `cacheRead` bekleyin ve `cacheWrite` değerinin `0` olarak kalmasını bekleyin; OpenAI ayrı bir önbellek-yazma belirteci alanı yayınlamaz.
- İstek izlemesine ihtiyacınız varsa, istek kimliklerini ve hız sınırı üstbilgilerini önbellek metriklerinden ayrı olarak günlüğe kaydedin. OpenClaw'ın mevcut önbellek izleme çıktısı, ham sağlayıcı yanıt üstbilgilerinden ziyade istem/oturum şekli ve normalize edilmiş belirteç kullanımına odaklanır.

## Hızlı sorun giderme

- Çoğu turda yüksek `cacheWrite`: değişken sistem istemi girdilerini kontrol edin ve modelin/sağlayıcının önbellek ayarlarınızı desteklediğini doğrulayın.
- Anthropic üzerinde yüksek `cacheWrite`: genellikle önbellek kesme noktasının her istekte değişen içeriğe denk geldiği anlamına gelir.
- Düşük OpenAI `cacheRead`: kararlı önekin başta olduğunu, tekrar eden önekin en az 1024 belirteç olduğunu ve aynı `prompt_cache_key` değerinin önbellek paylaşması gereken turlarda yeniden kullanıldığını doğrulayın.
- `cacheRetention` etkisizse: model anahtarının `agents.defaults.models["provider/model"]` ile eşleştiğini doğrulayın.
- Önbellek ayarlarıyla Bedrock Nova/Mistral istekleri: çalışma zamanında `none` değerine zorlanması beklenir.

İlgili belgeler:

- [Anthropic](/tr/providers/anthropic)
- [Belirteç Kullanımı ve Maliyetler](/reference/token-use)
- [Oturum Budama](/tr/concepts/session-pruning)
- [Gateway Yapılandırma Başvurusu](/tr/gateway/configuration-reference)
