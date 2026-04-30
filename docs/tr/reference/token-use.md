---
read_when:
    - Token kullanımını, maliyetleri veya bağlam pencerelerini açıklama
    - Bağlam büyümesi veya Compaction davranışında hata ayıklama
summary: OpenClaw istem bağlamını nasıl oluşturur ve token kullanımı + maliyetleri nasıl raporlar
title: Belirteç kullanımı ve maliyetler
x-i18n:
    generated_at: "2026-04-30T09:45:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Token kullanımı ve maliyetler

OpenClaw **tokenları** izler, karakterleri değil. Tokenlar modele özgüdür, ancak çoğu
OpenAI tarzı model İngilizce metin için token başına ortalama ~4 karakter kullanır.

## Sistem prompt'u nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem prompt'unu birleştirir. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca metadata; talimatlar gerektiğinde `read` ile yüklenir).
  Kompakt Skills bloğu `skills.limits.maxSkillsPromptChars` ile sınırlandırılır,
  isteğe bağlı aracı başına geçersiz kılma
  `agents.list[].skillsLimits.maxSkillsPromptChars` konumundadır.
- Kendi kendini güncelleme talimatları
- Çalışma alanı + önyükleme dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` yeni olduğunda, ayrıca varsa `MEMORY.md`). Küçük harfli kök `memory.md` enjekte edilmez; `MEMORY.md` ile eşleştirildiğinde `openclaw doctor --fix` için eski onarım girdisidir. Büyük dosyalar `agents.defaults.bootstrapMaxChars` ile kısaltılır (varsayılan: 12000) ve toplam önyükleme enjeksiyonu `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). `memory/*.md` günlük dosyaları normal önyükleme prompt'unun parçası değildir; sıradan turlarda bellek araçları üzerinden gerektiğinde kullanılabilir kalırlar, ancak sıfırlama/başlatma model çalıştırmaları ilk tur için son günlük belleği içeren tek seferlik bir başlangıç bağlamı bloğunu başa ekleyebilir. Yalın sohbet `/new` ve `/reset` komutları model çağrılmadan onaylanır. Başlangıç girişi `agents.defaults.startupContext` tarafından kontrol edilir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + Heartbeat davranışı
- Çalışma zamanı metadatası (host/işletim sistemi/model/düşünme)

Tam dökümü [Sistem Prompt'u](/tr/concepts/system-prompt) bölümünde görün.

## Bağlam penceresinde neler sayılır

Modelin aldığı her şey bağlam sınırına dahil edilir:

- Sistem prompt'u (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/transkriptler (görüntüler, ses, dosyalar)
- Compaction özetleri ve budama artefaktları
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünmez, ancak yine de sayılır)

Çalışma zamanı açısından yoğun bazı yüzeylerin kendi açık sınırları vardır:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Aracı başına geçersiz kılmalar `agents.list[].contextLimits` altında bulunur. Bu ayarlar
sınırlandırılmış çalışma zamanı alıntıları ve çalışma zamanı sahibindeki enjekte edilen bloklar içindir.
Önyükleme sınırlarından, başlangıç bağlamı sınırlarından ve Skills prompt
sınırlarından ayrıdırlar.

Görüntüler için OpenClaw, sağlayıcı çağrılarından önce transkript/araç görüntü yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` kullanın (varsayılan: `1200`):

- Daha düşük değerler genellikle görsel token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntüleri için daha fazla görsel ayrıntı korur.

Pratik bir döküm için (enjekte edilen dosya başına, araçlar, Skills ve sistem prompt boyutu), `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Geçerli token kullanımını nasıl görürsünüz

Sohbette şunları kullanın:

- `/status` → oturum modeli, bağlam kullanımı,
  son yanıt girdi/çıktı tokenları ve **tahmini maliyet** (yalnızca API anahtarı) içeren **emoji açısından zengin durum kartı**.
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım alt bilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - OAuth kimlik doğrulaması **maliyeti gizler** (yalnızca tokenlar).
- `/usage cost` → OpenClaw oturum günlüklerinden yerel maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`,
  normalize edilmiş sağlayıcı kota pencerelerini gösterir (`X% left`, yanıt başına maliyetleri değil).
  Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, görüntülemeden önce yaygın sağlayıcı yerel alan takma adlarını normalize eder.
OpenAI ailesi Responses trafiği için bu hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` alanlarını içerir; bu nedenle aktarıma özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI JSON kullanımı da normalize edilir: yanıt metni `response` alanından gelir ve
CLI açık bir `stats.input` alanı atladığında `stats.cached`, `cacheRead` alanına eşlenir;
`stats.input_tokens - stats.cached` kullanılır.
Yerel OpenAI ailesi Responses trafiği için WebSocket/SSE kullanım takma adları da
aynı şekilde normalize edilir ve `total_tokens` eksik veya `0` olduğunda toplamlar
normalize edilmiş girdi + çıktıya geri döner.
Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` ve `session_status`,
en son transkript kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini de
kurtarabilir. Mevcut sıfır olmayan canlı değerler yine de
transkript geri dönüş değerlerine göre önceliklidir ve saklanan toplamlar eksik veya daha küçük olduğunda
daha büyük prompt odaklı transkript toplamları kazanabilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, mevcut olduğunda
sağlayıcıya özgü kancalardan gelir; aksi takdirde OpenClaw auth profilleri, env veya config içinden
eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
Asistan transkript girişleri, etkin model için fiyatlandırma yapılandırılmışsa ve sağlayıcı
kullanım metadatası döndürüyorsa `usage.cost` dahil aynı normalize edilmiş kullanım şeklini kalıcı hale getirir.
Bu, canlı çalışma zamanı durumu ortadan kalktıktan sonra bile `/usage cost` ve transkript destekli oturum
durumu için kararlı bir kaynak sağlar.

OpenClaw, sağlayıcı kullanım muhasebesini geçerli bağlam anlık görüntüsünden ayrı tutar.
Sağlayıcı `usage.total`, önbelleğe alınmış girdiyi, çıktıyı ve birden çok
araç döngüsü model çağrısını içerebilir; bu nedenle maliyet ve telemetri için yararlıdır, ancak
canlı bağlam penceresini olduğundan yüksek gösterebilir. Bağlam görüntülemeleri ve tanılamalar,
`context.used` için en son prompt anlık görüntüsünü (`promptTokens` veya prompt anlık görüntüsü
yoksa son model çağrısını) kullanır.

## Maliyet tahmini (gösterildiğinde)

Maliyetler model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1 milyon token başına USD** değerleridir. Fiyatlandırma eksikse OpenClaw yalnızca tokenları gösterir. OAuth tokenları
asla dolar maliyeti göstermez.

Gateway başlangıcı, henüz yerel fiyatlandırması olmayan
yapılandırılmış model ref'leri için isteğe bağlı bir arka plan fiyatlandırma önyüklemesi de gerçekleştirir. Bu önyükleme,
uzak OpenRouter ve LiteLLM fiyatlandırma kataloglarını getirir. Çevrimdışı
veya kısıtlı ağlarda bu başlangıç katalog getirmelerini atlamak için
`models.pricing.enabled: false` ayarlayın; açık `models.providers.*.models[].cost` girişleri
yerel maliyet tahminlerini yönlendirmeye devam eder.

## Önbellek TTL'si ve budama etkisi

Sağlayıcı prompt önbelleğe alma yalnızca önbellek TTL penceresi içinde geçerlidir. OpenClaw
isteğe bağlı olarak **önbellek TTL budaması** çalıştırabilir: önbellek TTL'si
sona erdiğinde oturumu budar, ardından önbellek penceresini sıfırlar; böylece sonraki istekler
tam geçmişi yeniden önbelleğe almak yerine yeni önbelleğe alınmış bağlamı yeniden kullanabilir. Bu, bir oturum TTL'yi aşacak kadar boşta kaldığında
önbellek yazma maliyetlerini düşük tutar.

Bunu [Gateway yapılandırması](/tr/gateway/configuration) içinde yapılandırın ve
davranış ayrıntılarını [Oturum budama](/tr/concepts/session-pruning) bölümünde görün.

Heartbeat, boşta kalma aralıkları boyunca önbelleği **sıcak** tutabilir. Model önbellek TTL'niz
`1h` ise, heartbeat aralığını bunun hemen altına ayarlamak (ör. `55m`) tam prompt'un
yeniden önbelleğe alınmasını önleyerek önbellek yazma maliyetlerini azaltabilir.

Çok aracılı kurulumlarda, tek bir paylaşılan model yapılandırması tutabilir ve önbellek davranışını
`agents.list[].params.cacheRetention` ile aracı başına ayarlayabilirsiniz.

Tam ayar bazında kılavuz için bkz. [Prompt Önbelleğe Alma](/tr/reference/prompt-caching).

Anthropic API fiyatlandırması için önbellek okumaları girdi
tokenlarından önemli ölçüde daha ucuzdur, önbellek yazmaları ise daha yüksek bir çarpanla ücretlendirilir. En son oranlar ve TTL çarpanları için Anthropic’in
prompt önbelleğe alma fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: 1 saatlik önbelleği heartbeat ile sıcak tutun

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

`agents.list[].params`, seçilen modelin `params` değerlerinin üzerine birleştirilir; böylece
yalnızca `cacheRetention` değerini geçersiz kılıp diğer model varsayılanlarını değiştirmeden devralabilirsiniz.

### Örnek: Anthropic 1M bağlam beta başlığını etkinleştirin

Anthropic'in 1M bağlam penceresi şu anda beta geçidi arkasındadır. OpenClaw, desteklenen Opus
veya Sonnet modellerinde `context1m` etkinleştirildiğinde gerekli
`anthropic-beta` değerini enjekte edebilir.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Bu, Anthropic'in `context-1m-2025-08-07` beta başlığına eşlenir.

Bu yalnızca ilgili model girişinde `context1m: true` ayarlandığında geçerlidir.

Gereksinim: kimlik bilgisi uzun bağlam kullanımı için uygun olmalıdır. Değilse,
Anthropic bu istek için sağlayıcı tarafında bir hız sınırı hatasıyla yanıt verir.

Anthropic için OAuth/abonelik tokenlarıyla (`sk-ant-oat-*`) kimlik doğrulaması yaparsanız,
OpenClaw `context-1m-*` beta başlığını atlar çünkü Anthropic şu anda
bu kombinasyonu HTTP 401 ile reddeder.

## Token baskısını azaltmaya yönelik ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızdaki büyük araç çıktılarını kırpın.
- Ekran görüntüsü yoğun oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skill açıklamalarını kısa tutun (Skill listesi prompt'a enjekte edilir).
- Ayrıntılı, keşif amaçlı çalışma için daha küçük modelleri tercih edin.

Tam Skill listesi ek yük formülü için bkz. [Skills](/tr/tools/skills).

## İlgili

- [API kullanımı ve maliyetleri](/tr/reference/api-usage-costs)
- [Prompt önbelleğe alma](/tr/reference/prompt-caching)
- [Kullanım izleme](/tr/concepts/usage-tracking)
