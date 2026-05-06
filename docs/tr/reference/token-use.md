---
read_when:
    - Token kullanımını, maliyetleri veya bağlam pencerelerini açıklama
    - Bağlam büyümesi veya Compaction davranışında hata ayıklama
summary: OpenClaw'ın istem bağlamını nasıl oluşturduğu ve token kullanımı + maliyetleri nasıl raporladığı
title: Token kullanımı ve maliyetler
x-i18n:
    generated_at: "2026-05-06T09:30:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw **karakterleri** değil, **tokenları** izler. Tokenlar modele özgüdür, ancak çoğu OpenAI tarzı model İngilizce metin için token başına ortalama ~4 karakter kullanır.

## Sistem istemi nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem istemini birleştirir. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca meta veriler; yönergeler gerektiğinde `read` ile yüklenir).
  Kompakt Skills bloğu `skills.limits.maxSkillsPromptChars` ile sınırlandırılır,
  isteğe bağlı ajan başına geçersiz kılma ise
  `agents.list[].skillsLimits.maxSkillsPromptChars` altında bulunur.
- Kendini güncelleme yönergeleri
- Çalışma alanı + önyükleme dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, yeni olduğunda `BOOTSTRAP.md`, ayrıca mevcutsa `MEMORY.md`). Küçük harfli kök `memory.md` enjekte edilmez; `MEMORY.md` ile eşleştirildiğinde `openclaw doctor --fix` için eski onarım girdisidir. Büyük dosyalar `agents.defaults.bootstrapMaxChars` (varsayılan: 12000) ile kısaltılır ve toplam önyükleme enjeksiyonu `agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile sınırlandırılır. `memory/*.md` günlük dosyaları normal önyükleme isteminin parçası değildir; sıradan turlarda bellek araçları üzerinden isteğe bağlı kalırlar, ancak sıfırlama/başlangıç model çalıştırmaları ilk tur için son günlük belleği içeren tek seferlik bir başlangıç-bağlam bloğunu başa ekleyebilir. Düz sohbet `/new` ve `/reset` komutları model çağrılmadan onaylanır. Başlangıç ön girişi `agents.defaults.startupContext` ile denetlenir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + Heartbeat davranışı
- Çalışma zamanı meta verileri (ana makine/OS/model/düşünme)

Tam dökümü [Sistem İstemi](/tr/concepts/system-prompt) içinde görün.

## Bağlam penceresinde neler sayılır

Modelin aldığı her şey bağlam sınırına dahil edilir:

- Sistem istemi (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/transkriptler (görüntüler, ses, dosyalar)
- Compaction özetleri ve budama yapıtları
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünmez, ancak yine de sayılır)

Bazı çalışma zamanı açısından ağır yüzeylerin kendi açık sınırları vardır:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ajan başına geçersiz kılmalar `agents.list[].contextLimits` altında bulunur. Bu düğmeler
sınırlandırılmış çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipli bloklar içindir. Bunlar
önyükleme sınırlarından, başlangıç-bağlam sınırlarından ve Skills istemi
sınırlarından ayrıdır.

Görüntüler için OpenClaw, sağlayıcı çağrılarından önce transkript/araç görüntü yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` (varsayılan: `1200`) kullanın:

- Daha düşük değerler genellikle görüntü-token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntüleri için daha fazla görsel ayrıntıyı korur.

Pratik bir döküm (enjekte edilen dosya, araçlar, Skills ve sistem istemi boyutu başına) için `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Geçerli token kullanımını görme

Sohbette şunları kullanın:

- `/status` → oturum modeli, bağlam kullanımı,
  son yanıt giriş/çıkış tokenları ve **tahmini maliyet** (yalnızca API anahtarı) içeren **emoji açısından zengin durum kartı**.
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım alt bilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - OAuth kimlik doğrulaması **maliyeti gizler** (yalnızca tokenlar).
- `/usage cost` → OpenClaw oturum günlüklerinden yerel bir maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`,
  normalleştirilmiş sağlayıcı kota pencerelerini gösterir (`X% kaldı`, yanıt başına maliyetler değil).
  Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, görüntülemeden önce yaygın sağlayıcıya özgü alan takma adlarını normalleştirir.
OpenAI ailesi Responses trafiği için bu, hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` alanlarını içerir; bu nedenle aktarıma özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI JSON kullanımı da normalleştirilir: yanıt metni `response` içinden gelir ve
`stats.cached`, CLI açık bir `stats.input` alanını atladığında kullanılan
`stats.input_tokens - stats.cached` ile birlikte `cacheRead` değerine eşlenir.
Yerel OpenAI ailesi Responses trafiği için WebSocket/SSE kullanım takma adları da
aynı şekilde normalleştirilir ve `total_tokens` eksik ya da `0` olduğunda toplamlar
normalleştirilmiş giriş + çıkış değerine geri döner.
Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` ve `session_status`,
en son transkript kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı modeli etiketini de
kurtarabilir. Mevcut sıfır olmayan canlı değerler, transkript geri dönüş değerlerine göre
öncelikli olmaya devam eder ve saklanan toplamlar eksik ya da daha küçük olduğunda daha büyük istem odaklı
transkript toplamları kazanabilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, kullanılabilir olduğunda
sağlayıcıya özgü kancalardan gelir; aksi takdirde OpenClaw, kimlik doğrulama profillerinden,
env veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
Asistan transkript girdileri, etkin model için fiyatlandırma yapılandırılmışsa ve sağlayıcı
kullanım meta verisi döndürüyorsa `usage.cost` dahil aynı normalleştirilmiş kullanım biçimini kalıcı hale getirir.
Bu, canlı çalışma zamanı durumu kaybolduktan sonra bile `/usage cost` ve transkript destekli oturum
durumu için kararlı bir kaynak sağlar.

OpenClaw, sağlayıcı kullanım muhasebesini geçerli bağlam anlık görüntüsünden ayrı tutar.
Sağlayıcı `usage.total`, önbelleğe alınmış girdi, çıktı ve birden çok
araç döngüsü model çağrısını içerebilir; bu nedenle maliyet ve telemetri için kullanışlıdır, ancak
canlı bağlam penceresini olduğundan büyük gösterebilir. Bağlam görüntüleri ve tanılamalar,
`context.used` için en son istem anlık görüntüsünü (`promptTokens`, veya istem anlık görüntüsü
yoksa son model çağrısı) kullanır.

## Maliyet tahmini (gösterildiğinde)

Maliyetler model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1 milyon token başına USD** değerleridir. Fiyatlandırma eksikse OpenClaw yalnızca tokenları gösterir. OAuth tokenları
asla dolar maliyeti göstermez.

Sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan sonra OpenClaw, henüz yerel fiyatlandırması olmayan yapılandırılmış model referansları için isteğe bağlı bir arka plan fiyatlandırma önyüklemesi başlatır. Bu önyükleme, uzak OpenRouter ve LiteLLM fiyatlandırma kataloglarını getirir. Çevrimdışı veya kısıtlı ağlarda bu katalog getirmelerini atlamak için `models.pricing.enabled: false` ayarlayın; açık `models.providers.*.models[].cost` girdileri yerel maliyet tahminlerini yönlendirmeye devam eder.

## Önbellek TTL'si ve budama etkisi

Sağlayıcı istem önbelleğe alma yalnızca önbellek TTL penceresi içinde uygulanır. OpenClaw isteğe bağlı olarak **cache-ttl pruning** çalıştırabilir: önbellek TTL'si dolduğunda oturumu budar, ardından önbellek penceresini sıfırlayarak sonraki isteklerin tüm geçmişi yeniden önbelleğe almak yerine yeni önbelleğe alınmış bağlamı yeniden kullanabilmesini sağlar. Bu, bir oturum TTL süresini aşacak şekilde boşta kaldığında önbellek yazma maliyetlerini daha düşük tutar.

Bunu [Gateway yapılandırması](/tr/gateway/configuration) içinde yapılandırın ve davranış ayrıntılarını [Oturum budama](/tr/concepts/session-pruning) bölümünde görün.

Heartbeat, boşta kalma aralıkları boyunca önbelleği **sıcak** tutabilir. Model önbelleği TTL'niz `1h` ise, heartbeat aralığını bunun hemen altına ayarlamak (ör. `55m`) tüm istemin yeniden önbelleğe alınmasını önleyerek önbellek yazma maliyetlerini azaltabilir.

Çok aracılı kurulumlarda, tek bir paylaşılan model yapılandırmasını koruyabilir ve önbellek davranışını aracı başına `agents.list[].params.cacheRetention` ile ayarlayabilirsiniz.

Tam, ayar ayar bir kılavuz için [İstem Önbelleğe Alma](/tr/reference/prompt-caching) bölümüne bakın.

Anthropic API fiyatlandırmasında önbellek okumaları, giriş token'larından önemli ölçüde daha ucuzdur; önbellek yazmaları ise daha yüksek bir çarpanla faturalandırılır. En güncel ücretler ve TTL çarpanları için Anthropic'in istem önbelleğe alma fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: 1 saatlik önbelleği heartbeat ile sıcak tutma

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
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params`, seçili modelin `params` değerlerinin üzerine birleştirilir; böylece yalnızca `cacheRetention` değerini geçersiz kılıp diğer model varsayılanlarını değişmeden devralabilirsiniz.

### Örnek: Anthropic 1M bağlam beta başlığını etkinleştirme

Anthropic'in 1M bağlam penceresi şu anda beta kapısı arkasındadır. OpenClaw, desteklenen Opus veya Sonnet modellerinde `context1m` etkinleştirildiğinde gerekli `anthropic-beta` değerini enjekte edebilir.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Bu, Anthropic'in `context-1m-2025-08-07` beta başlığına eşlenir.

Bu yalnızca ilgili model girdisinde `context1m: true` ayarlandığında uygulanır.

Gereksinim: kimlik bilgisinin uzun bağlam kullanımı için uygun olması gerekir. Uygun değilse Anthropic, bu istek için sağlayıcı taraflı bir hız sınırı hatasıyla yanıt verir.

Anthropic ile OAuth/abonelik token'ları (`sk-ant-oat-*`) kullanarak kimlik doğrulaması yaparsanız, OpenClaw `context-1m-*` beta başlığını atlar çünkü Anthropic şu anda bu birleşimi HTTP 401 ile reddeder.

## Token baskısını azaltma ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızdaki büyük araç çıktılarını kırpın.
- Ekran görüntüsü ağırlıklı oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skill açıklamalarını kısa tutun (skill listesi isteme enjekte edilir).
- Ayrıntılı, keşif amaçlı çalışma için daha küçük modelleri tercih edin.

Tam skill listesi ek yük formülü için [Skills](/tr/tools/skills) bölümüne bakın.

## İlgili

- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
- [İstem önbelleğe alma](/tr/reference/prompt-caching)
- [Kullanım izleme](/tr/concepts/usage-tracking)
