---
read_when:
    - Belirteç kullanımı, maliyetler veya bağlam pencerelerini açıklama
    - Bağlam büyümesini veya sıkıştırma davranışını hata ayıklama
summary: OpenClaw'ın istem bağlamını nasıl oluşturduğu ve belirteç kullanımını + maliyetleri nasıl raporladığı
title: Belirteç Kullanımı ve Maliyetler
x-i18n:
    generated_at: "2026-04-05T14:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e7a0ac0311298cf1484d663799a3f5a9687dd5afc9702233e983aba1979f1d
    source_path: reference/token-use.md
    workflow: 15
---

# Belirteç kullanımı ve maliyetler

OpenClaw **karakterleri** değil, **belirteçleri** izler. Belirteçler modele özgüdür, ancak
çoğu OpenAI tarzı model İngilizce metin için belirteç başına ortalama ~4 karakter kullanır.

## Sistem istemi nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem istemini oluşturur. Buna şunlar dahildir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca meta veriler; yönergeler gerektiğinde `read` ile yüklenir)
- Kendi kendini güncelleme yönergeleri
- Çalışma alanı + önyükleme dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, yeniyken `BOOTSTRAP.md`, ayrıca mevcutsa `MEMORY.md` veya küçük harfli geri dönüş olarak `memory.md`). Büyük dosyalar `agents.defaults.bootstrapMaxChars` ile kırpılır (varsayılan: 20000) ve toplam önyükleme ekleme miktarı `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 150000). `memory/*.md` dosyaları bellek araçları üzerinden isteğe bağlıdır ve otomatik olarak eklenmez.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + heartbeat davranışı
- Çalışma zamanı meta verileri (host/OS/model/thinking)

Tam döküm için bkz. [System Prompt](/tr/concepts/system-prompt).

## Bağlam penceresinde neler sayılır

Modelin aldığı her şey bağlam sınırına dahil edilir:

- Sistem istemi (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/dökümler (görseller, ses, dosyalar)
- Sıkıştırma özetleri ve budama yapıtları
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünmez, ancak yine de sayılır)

Görseller için OpenClaw, sağlayıcı çağrılarından önce döküm/araç görsel yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` kullanın (varsayılan: `1200`):

- Daha düşük değerler genellikle vision belirteci kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntüleri için daha fazla görsel ayrıntıyı korur.

Pratik bir döküm için (eklenen dosya başına, araçlar, Skills ve sistem istemi boyutu), `/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Geçerli belirteç kullanımı nasıl görülür

Sohbette şunları kullanın:

- `/status` → oturum modeli, bağlam kullanımı,
  son yanıtın giriş/çıkış belirteçleri ve **tahmini maliyeti** (yalnızca API anahtarı) ile
  **emoji açısından zengin durum kartı**.
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım altbilgisi**
  ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - OAuth kimlik doğrulaması **maliyeti gizler** (yalnızca belirteçler).
- `/usage cost` → OpenClaw oturum günlüklerinden yerel bir maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`,
  normalleştirilmiş sağlayıcı kota pencerelerini gösterir (`%X kaldı`, yanıt başına maliyet değil).
  Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, göstermeden önce yaygın sağlayıcıya özgü alan takma adlarını normalleştirir.
OpenAI ailesi Responses trafiği için buna hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` dahildir; böylece taşımaya özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI JSON kullanımı da normalleştirilir: yanıt metni `response` içinden gelir ve
CLI açık bir `stats.input` alanını atladığında `stats.cached`, `cacheRead` olarak eşlenir; ayrıca
`stats.input_tokens - stats.cached` kullanılır.
Yerel OpenAI ailesi Responses trafiği için WebSocket/SSE kullanım takma adları da
aynı şekilde normalleştirilir ve `total_tokens` eksik olduğunda veya `0` olduğunda toplamlar,
normalleştirilmiş giriş + çıkışa geri döner.
Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` ve `session_status`
en son döküm kullanım günlüğünden belirteç/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini de
geri kazanabilir.
Mevcut sıfır olmayan canlı değerler yine de döküm geri dönüş değerlerine göre önceliklidir ve
saklanan toplamlar eksik veya daha küçük olduğunda, istem odaklı daha büyük
döküm toplamları kazanabilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü kancalardan gelir;
aksi takdirde OpenClaw, kimlik doğrulama profilleri, env veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

## Maliyet tahmini (gösterildiğinde)

Maliyetler, model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1 milyon belirteç başına USD** cinsindendir. Fiyatlandırma eksikse OpenClaw yalnızca belirteçleri gösterir. OAuth belirteçleri
asla dolar maliyeti göstermez.

## Önbellek TTL'si ve budamanın etkisi

Sağlayıcı istem önbelleklemesi yalnızca önbellek TTL penceresi içinde geçerlidir. OpenClaw,
isteğe bağlı olarak **cache-ttl pruning** çalıştırabilir: önbellek TTL'si
sona erdiğinde oturumu budar, ardından önbellek penceresini sıfırlar; böylece sonraki istekler,
tüm geçmişi yeniden önbelleğe almak yerine yeni önbelleğe alınmış bağlamı yeniden kullanabilir.
Bu, bir oturum TTL'yi aşacak kadar boşta kaldığında önbellek yazma
maliyetlerini daha düşük tutar.

Bunu [Gateway configuration](/tr/gateway/configuration) bölümünde yapılandırın ve
davranış ayrıntıları için [Session pruning](/tr/concepts/session-pruning) bölümüne bakın.

Heartbeat, boşta kalma aralıkları boyunca önbelleği **sıcak**
tutabilir. Model önbellek TTL'niz `1h` ise, heartbeat aralığını bunun hemen altına ayarlamak
(örneğin `55m`), tam istemin yeniden önbelleğe alınmasını önleyebilir; bu da önbellek yazma maliyetlerini azaltır.

Çok ajanlı kurulumlarda, tek bir ortak model yapılandırması tutabilir ve önbellek davranışını
ajan başına `agents.list[].params.cacheRetention` ile ayarlayabilirsiniz.

Ayarların her biri için tam kılavuz için bkz. [Prompt Caching](/reference/prompt-caching).

Anthropic API fiyatlandırmasında, önbellek okumaları giriş
belirteçlerinden önemli ölçüde daha ucuzdur; önbellek yazmaları ise daha yüksek bir çarpanla ücretlendirilir.
En güncel oranlar ve TTL çarpanları için Anthropic'in
prompt caching fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: heartbeat ile 1 saatlik önbelleği sıcak tutun

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Örnek: ajan başına önbellek stratejisiyle karma trafik

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # çoğu ajan için varsayılan temel çizgi
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # derin oturumlar için uzun önbelleği sıcak tut
    - id: "alerts"
      params:
        cacheRetention: "none" # ani bildirimler için önbellek yazımlarını önle
```

`agents.list[].params`, seçili modelin `params` değerlerinin üstüne birleştirilir; böylece
yalnızca `cacheRetention` değerini geçersiz kılabilir ve diğer model varsayılanlarını değiştirmeden devralabilirsiniz.

### Örnek: Anthropic 1M bağlam beta başlığını etkinleştirme

Anthropic'in 1M bağlam penceresi şu anda beta ile sınırlıdır. OpenClaw,
desteklenen Opus veya Sonnet modellerinde `context1m` etkinleştirildiğinde gerekli
`anthropic-beta` değerini ekleyebilir.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Bu, Anthropic'in `context-1m-2025-08-07` beta başlığına eşlenir.

Bu yalnızca ilgili model girdisinde `context1m: true` ayarlandığında geçerlidir.

Gereksinim: kimlik bilgisinin uzun bağlam kullanımı için uygun olması gerekir (API anahtarı
faturalandırması veya OpenClaw'ın Extra Usage etkin Claude-login yolu). Aksi halde,
Anthropic şu yanıtı verir:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Anthropic'i OAuth/abonelik belirteçleriyle (`sk-ant-oat-*`) doğrularsanız,
Anthropic şu anda bu birleşimi HTTP 401 ile reddettiği için OpenClaw
`context-1m-*` beta başlığını atlar.

## Belirteç baskısını azaltmaya yönelik ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızda büyük araç çıktılarını kırpın.
- Ekran görüntüsü ağırlıklı oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Yetenek açıklamalarını kısa tutun (Skill listesi isteme eklenir).
- Ayrıntılı, keşif amaçlı işler için daha küçük modelleri tercih edin.

Tam Skill listesi ek yükü formülü için bkz. [Skills](/tools/skills).
