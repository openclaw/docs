---
read_when:
    - Token kullanımı, maliyetler veya bağlam pencerelerini açıklama
    - Bağlam büyümesini veya Compaction davranışını hata ayıklama
summary: OpenClaw’ın istem bağlamını nasıl oluşturduğu ve token kullanımı + maliyetleri nasıl raporladığı
title: Token kullanımı ve maliyetler
x-i18n:
    generated_at: "2026-04-24T09:30:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Token kullanımı ve maliyetler

OpenClaw **karakterleri değil**, **token’ları** izler. Token’lar modele özgüdür, ancak çoğu
OpenAI tarzı model İngilizce metin için ortalama token başına ~4 karakter kullanır.

## Sistem istemi nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem istemini oluşturur. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca metadata; talimatlar gerektiğinde `read` ile yüklenir).
  Sıkıştırılmış skills bloğu `skills.limits.maxSkillsPromptChars` ile sınırlıdır,
  isteğe bağlı aracı başına geçersiz kılma ise
  `agents.list[].skillsLimits.maxSkillsPromptChars` altındadır.
- Kendini güncelleme talimatları
- Çalışma alanı + önyükleme dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, yeniyse `BOOTSTRAP.md`, ayrıca varsa `MEMORY.md`). Küçük harfli kök `memory.md` enjekte edilmez; `MEMORY.md` ile eşleştiğinde `openclaw doctor --fix` için eski onarım girdisidir. Büyük dosyalar `agents.defaults.bootstrapMaxChars` ile kesilir (varsayılan: 12000) ve toplam önyükleme enjeksiyonu `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). `memory/*.md` günlük dosyaları normal önyükleme isteminin parçası değildir; normal turlarda bellek araçlarıyla isteğe bağlı kalırlar, ancak çıplak `/new` ve `/reset` ilk tur için son günlük belleği içeren tek seferlik bir başlangıç bağlamı bloğunu başa ekleyebilir. Bu başlangıç önsözü `agents.defaults.startupContext` tarafından denetlenir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + Heartbeat davranışı
- Çalışma zamanı metaverileri (ana makine/OS/model/thinking)

Tam döküm için bkz. [System Prompt](/tr/concepts/system-prompt).

## Bağlam penceresinde neler sayılır

Modelin aldığı her şey bağlam sınırına dahil olur:

- Sistem istemi (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/transkriptler (görüntüler, ses, dosyalar)
- Compaction özetleri ve budama yapıtları
- Sağlayıcı sarmalayıcıları veya güvenlik üstbilgileri (görünmezler, ama yine de sayılırlar)

Bazı çalışma zamanı ağır yüzeylerin kendi açık sınırları vardır:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Aracı başına geçersiz kılmalar `agents.list[].contextLimits` altında bulunur. Bu ayarlar
sınırlı çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipli bloklar içindir. Bunlar
önyükleme sınırları, başlangıç bağlamı sınırları ve skills istem sınırlarından ayrıdır.

Görüntüler için OpenClaw, sağlayıcı çağrılarından önce transkript/araç görüntü yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` kullanın (varsayılan: `1200`):

- Daha düşük değerler genellikle görsel token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntüleri için daha fazla görsel ayrıntıyı korur.

Pratik bir döküm için (enjekte edilen dosya başına, araçlar, Skills ve sistem istem boyutu), `/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Geçerli token kullanımını nasıl görebilirsiniz

Sohbette şunları kullanın:

- `/status` → oturum modeli, bağlam kullanımı,
  son yanıtın giriş/çıkış token’ları ve **tahmini maliyet**i gösteren **emoji açısından zengin durum kartı**
  (yalnızca API anahtarı).
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım altbilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - OAuth kimlik doğrulaması **maliyeti gizler** (yalnızca token’lar).
- `/usage cost` → OpenClaw oturum günlüklerinden yerel maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`
  normalleştirilmiş sağlayıcı kota pencerelerini gösterir (`%X kaldı`, yanıt başına maliyet değil).
  Mevcut kullanım-penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, görüntülemeden önce yaygın sağlayıcı-yerel alan takma adlarını normalleştirir.
OpenAI ailesi Responses trafiği için bu, hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` alanlarını içerir; böylece taşımaya özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI JSON kullanımı da normalleştirilir: yanıt metni `response` alanından gelir ve
CLI açık bir `stats.input` alanını atladığında `stats.cached`, `cacheRead` olarak eşlenir; `stats.input_tokens - stats.cached`
kullanılır.
Yerel OpenAI ailesi Responses trafiği için WebSocket/SSE kullanım takma adları da
aynı şekilde normalleştirilir ve `total_tokens` eksikse veya `0` ise toplamlar
normalleştirilmiş giriş + çıkışa geri düşer.
Geçerli oturum anlık görüntüsü seyrek olduğunda `/status` ve `session_status`,
en son transkript kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini de
geri kazanabilir. Mevcut sıfır olmayan canlı değerler yine de transkript yedek değerlerine göre önceliklidir ve daha büyük istem odaklı
transkript toplamları, saklanan toplamlar eksik veya daha küçük olduğunda kazanabilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü kancalardan gelir; aksi halde OpenClaw, auth profilleri, ortam veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri düşer.
Asistan transkript girdileri, etkin modelde fiyatlandırma yapılandırılmışsa ve sağlayıcı kullanım metaverisi döndürürse `usage.cost` dahil aynı normalleştirilmiş kullanım şeklini kalıcılaştırır. Bu, canlı çalışma zamanı durumu ortadan kalktıktan sonra bile `/usage cost` ve transkript destekli oturum durumu için kararlı bir kaynak sağlar.

## Maliyet tahmini (gösterildiğinde)

Maliyetler model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1M token başına USD** cinsindendir. Fiyatlandırma eksikse OpenClaw yalnızca token’ları gösterir. OAuth token’ları
asla dolar maliyeti göstermez.

## Önbellek TTL’si ve budamanın etkisi

Sağlayıcı istem önbelleklemesi yalnızca önbellek TTL penceresi içinde uygulanır. OpenClaw
isteğe bağlı olarak **cache-ttl budaması** çalıştırabilir: önbellek TTL’si
sona erdiğinde oturumu budar, ardından önbellek penceresini sıfırlar; böylece sonraki istekler tam geçmişi yeniden önbelleğe almak yerine
yeni önbelleğe alınmış bağlamı yeniden kullanabilir. Bu, oturum TTL sonrasında boşta kaldığında önbellek
yazma maliyetlerini daha düşük tutar.

Bunu [Gateway configuration](/tr/gateway/configuration) içinde yapılandırın ve
davranış ayrıntılarını [Session pruning](/tr/concepts/session-pruning) içinde görün.

Heartbeat, boşta kalma aralıkları boyunca önbelleği **sıcak** tutabilir. Model önbellek TTL’niz
`1h` ise Heartbeat aralığını bunun biraz altına ayarlamak (ör. `55m`) tam istemi yeniden önbelleğe almayı önleyebilir ve önbellek yazma maliyetlerini azaltır.

Çok aracılı kurulumlarda tek bir paylaşılan model yapılandırmasını koruyabilir ve önbellek davranışını
aracı başına `agents.list[].params.cacheRetention` ile ayarlayabilirsiniz.

Tüm ayarların ayrıntılı kılavuzu için bkz. [Prompt Caching](/tr/reference/prompt-caching).

Anthropic API fiyatlandırmasında önbellek okumaları giriş
token’larından belirgin biçimde daha ucuzdur; önbellek yazmaları ise daha yüksek bir çarpanla ücretlendirilir. En güncel oranlar ve TTL çarpanları için Anthropic’in
istem önbellekleme fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: Heartbeat ile 1h önbelleği sıcak tutma

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

### Örnek: aracı başına önbellek stratejisiyle karma trafik

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # çoğu aracı için varsayılan taban çizgisi
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # derin oturumlar için uzun önbelleği sıcak tut
    - id: "alerts"
      params:
        cacheRetention: "none" # patlamalı bildirimler için önbellek yazmalarından kaçın
```

`agents.list[].params`, seçilen modelin `params` değerlerinin üzerine birleşir; böylece yalnızca
`cacheRetention` değerini geçersiz kılıp diğer model varsayılanlarını değiştirmeden devralabilirsiniz.

### Örnek: Anthropic 1M bağlam beta üstbilgisini etkinleştirme

Anthropic’in 1M bağlam penceresi şu anda beta geçitlidir. OpenClaw, desteklenen Opus
veya Sonnet modellerinde `context1m` etkinleştirdiğinizde gerekli
`anthropic-beta` değerini enjekte edebilir.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Bu, Anthropic’in `context-1m-2025-08-07` beta üstbilgisine eşlenir.

Bu yalnızca o model girdisinde `context1m: true` ayarlandığında uygulanır.

Gereksinim: kimlik bilgisinin uzun bağlam kullanımı için uygun olması gerekir. Aksi halde
Anthropic bu istek için sağlayıcı taraflı hız sınırı hatasıyla yanıt verir.

Anthropic’i OAuth/abonelik token’larıyla (`sk-ant-oat-*`) doğrularsanız,
Anthropic şu anda bu birleşimi HTTP 401 ile reddettiği için OpenClaw `context-1m-*` beta üstbilgisini atlar.

## Token baskısını azaltmaya yönelik ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızda büyük araç çıktılarını kırpın.
- Ekran görüntüsü ağırlıklı oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skill açıklamalarını kısa tutun (skill listesi isteme enjekte edilir).
- Ayrıntılı, keşif amaçlı işler için daha küçük modelleri tercih edin.

Tam skill listesi ek yük formülü için bkz. [Skills](/tr/tools/skills).

## İlgili

- [API usage and costs](/tr/reference/api-usage-costs)
- [Prompt caching](/tr/reference/prompt-caching)
- [Usage tracking](/tr/concepts/usage-tracking)
