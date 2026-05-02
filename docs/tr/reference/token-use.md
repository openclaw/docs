---
read_when:
    - Token kullanımını, maliyetleri veya bağlam pencerelerini açıklama
    - Bağlam büyümesi veya Compaction davranışında hata ayıklama
summary: OpenClaw istem bağlamını nasıl oluşturur ve token kullanımını + maliyetleri nasıl raporlar
title: Belirteç kullanımı ve maliyetleri
x-i18n:
    generated_at: "2026-05-02T21:00:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Token kullanımı ve maliyetler

OpenClaw **tokenleri** izler, karakterleri değil. Tokenler modele özeldir, ancak çoğu
OpenAI tarzı model İngilizce metin için token başına ortalama ~4 karakter kullanır.

## Sistem promptu nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem promptunu birleştirir. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca meta veriler; talimatlar gerektiğinde `read` ile yüklenir).
  Kompakt Skills bloğu `skills.limits.maxSkillsPromptChars` ile sınırlandırılır;
  isteğe bağlı aracı başına geçersiz kılma
  `agents.list[].skillsLimits.maxSkillsPromptChars` konumundadır.
- Kendi kendini güncelleme talimatları
- Çalışma alanı + önyükleme dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, yeni olduğunda `BOOTSTRAP.md`, ayrıca mevcutsa `MEMORY.md`). Küçük harfli kök `memory.md` enjekte edilmez; `MEMORY.md` ile eşlendiğinde `openclaw doctor --fix` için eski onarım girdisidir. Büyük dosyalar `agents.defaults.bootstrapMaxChars` ile kısaltılır (varsayılan: 12000) ve toplam önyükleme enjeksiyonu `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). Günlük `memory/*.md` dosyaları normal önyükleme promptunun parçası değildir; sıradan turlarda bellek araçları üzerinden isteğe bağlı kalırlar, ancak sıfırlama/başlatma model çalıştırmaları ilk tur için yakın tarihli günlük belleği içeren tek seferlik bir başlangıç bağlamı bloğunu başa ekleyebilir. Yalın sohbet `/new` ve `/reset` komutları model çağrılmadan onaylanır. Başlangıç önsözü `agents.defaults.startupContext` ile denetlenir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + Heartbeat davranışı
- Çalışma zamanı meta verileri (ana makine/OS/model/düşünme)

Tam döküm için [Sistem Promptu](/tr/concepts/system-prompt) bölümüne bakın.

## Bağlam penceresinde neler sayılır

Modelin aldığı her şey bağlam sınırına dahil edilir:

- Sistem promptu (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan iletileri)
- Araç çağrıları ve araç sonuçları
- Ekler/transkriptler (görseller, ses, dosyalar)
- Compaction özetleri ve budama artifaktları
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünmez, ancak yine de sayılır)

Çalışma zamanı açısından yoğun bazı yüzeylerin kendi açık sınırları vardır:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Aracı başına geçersiz kılmalar `agents.list[].contextLimits` altında bulunur. Bu ayarlar
sınırlı çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipli bloklar içindir.
Önyükleme sınırlarından, başlangıç bağlamı sınırlarından ve Skills prompt
sınırlarından ayrıdır.

Görseller için OpenClaw, sağlayıcı çağrılarından önce transkript/araç görsel yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` kullanın (varsayılan: `1200`):

- Daha düşük değerler genellikle görüntü token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntüleri için daha fazla görsel ayrıntıyı korur.

Pratik bir döküm için (enjekte edilen dosya, araçlar, Skills ve sistem promptu boyutu başına) `/context list` veya `/context detail` kullanın. [Bağlam](/tr/concepts/context) bölümüne bakın.

## Geçerli token kullanımı nasıl görülür

Sohbette şunları kullanın:

- `/status` → oturum modeli, bağlam kullanımı,
  son yanıt giriş/çıkış tokenleri ve **tahmini maliyet** (yalnızca API anahtarı) içeren **emoji açısından zengin durum kartı**.
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım alt bilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak depolanır).
  - OAuth kimlik doğrulaması **maliyeti gizler** (yalnızca tokenler).
- `/usage cost` → OpenClaw oturum günlüklerinden yerel bir maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`,
  normalleştirilmiş sağlayıcı kota pencerelerini gösterir (`X% left`, yanıt başına maliyetler değil).
  Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, görüntülemeden önce yaygın sağlayıcıya özgü alan takma adlarını normalleştirir.
OpenAI ailesi Responses trafiği için buna hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` dahildir; böylece taşımaya özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI JSON kullanımı da normalleştirilir: yanıt metni `response` alanından gelir ve
`stats.cached`, `cacheRead` ile eşlenir; CLI açık bir `stats.input` alanı atladığında
`stats.input_tokens - stats.cached` kullanılır.
Yerel OpenAI ailesi Responses trafiği için WebSocket/SSE kullanım takma adları da
aynı şekilde normalleştirilir ve `total_tokens` eksik ya da `0` olduğunda toplamlar
normalleştirilmiş giriş + çıkışa geri döner.
Geçerli oturum anlık görüntüsü seyrek olduğunda `/status` ve `session_status`,
en son transkript kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini de
kurtarabilir. Mevcut sıfır olmayan canlı değerler transkript yedek değerlerine göre hâlâ
önceliklidir ve depolanan toplamlar eksik veya daha küçük olduğunda daha büyük prompt odaklı
transkript toplamları kazanabilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, kullanılabilir olduğunda
sağlayıcıya özgü kancalardan gelir; aksi halde OpenClaw, kimlik doğrulama profillerinden,
ortamdan veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
Asistan transkript girdileri, etkin model için fiyatlandırma yapılandırılmışsa ve sağlayıcı
kullanım meta verileri döndürüyorsa `usage.cost` dahil aynı normalleştirilmiş kullanım şeklini kalıcı kılar.
Bu, canlı çalışma zamanı durumu kaybolduktan sonra bile `/usage cost` ve transkript destekli oturum
durumu için kararlı bir kaynak sağlar.

OpenClaw sağlayıcı kullanım muhasebesini geçerli bağlam anlık görüntüsünden ayrı tutar.
Sağlayıcı `usage.total`, önbelleğe alınmış girişi, çıkışı ve birden fazla
araç döngüsü model çağrısını içerebilir; bu nedenle maliyet ve telemetri için kullanışlıdır ancak
canlı bağlam penceresini olduğundan büyük gösterebilir. Bağlam görüntüleri ve tanılamalar,
`context.used` için en son prompt anlık görüntüsünü (`promptTokens` veya prompt anlık görüntüsü
yoksa son model çağrısı) kullanır.

## Maliyet tahmini (gösterildiğinde)

Maliyetler model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1M token başına USD** değerleridir. Fiyatlandırma eksikse OpenClaw yalnızca tokenleri gösterir. OAuth tokenleri
asla dolar maliyeti göstermez.

Sidecar’lar ve kanallar Gateway hazır yoluna ulaştıktan sonra OpenClaw,
yerel fiyatlandırması zaten olmayan yapılandırılmış model referansları için
isteğe bağlı bir arka plan fiyatlandırma önyüklemesi başlatır. Bu önyükleme uzak OpenRouter ve LiteLLM
fiyatlandırma kataloglarını getirir. Çevrimdışı veya kısıtlı ağlarda bu katalog
getirmelerini atlamak için `models.pricing.enabled: false` ayarlayın; açık
`models.providers.*.models[].cost` girdileri yerel maliyet
tahminlerini yönetmeye devam eder.

## Önbellek TTL ve budama etkisi

Sağlayıcı prompt önbelleğe alma yalnızca önbellek TTL penceresi içinde uygulanır. OpenClaw
isteğe bağlı olarak **cache-ttl budaması** çalıştırabilir: önbellek TTL süresi dolduğunda
oturumu budar, ardından önbellek penceresini sıfırlar; böylece sonraki istekler
tam geçmişi yeniden önbelleğe almak yerine yeni önbelleğe alınmış bağlamı yeniden kullanabilir. Bu, bir oturum TTL süresini aşacak kadar boşta kaldığında
önbellek yazma maliyetlerini daha düşük tutar.

Bunu [Gateway yapılandırması](/tr/gateway/configuration) bölümünde yapılandırın ve
davranış ayrıntıları için [Oturum budama](/tr/concepts/session-pruning) bölümüne bakın.

Heartbeat, boşta kalma aralıkları boyunca önbelleği **sıcak** tutabilir. Model önbellek TTL’niz
`1h` ise heartbeat aralığını bunun hemen altına (ör. `55m`) ayarlamak,
tam promptun yeniden önbelleğe alınmasını önleyerek önbellek yazma maliyetlerini azaltabilir.

Çok aracılı kurulumlarda tek bir paylaşılan model yapılandırmasını koruyabilir ve önbellek davranışını
aracı başına `agents.list[].params.cacheRetention` ile ayarlayabilirsiniz.

Tam ayar rehberi için [Prompt Önbelleğe Alma](/tr/reference/prompt-caching) bölümüne bakın.

Anthropic API fiyatlandırması için önbellek okumaları giriş tokenlerinden önemli ölçüde daha ucuzdur,
önbellek yazmaları ise daha yüksek bir çarpanla faturalandırılır. En son oranlar ve TTL çarpanları için Anthropic’in
prompt önbelleğe alma fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: 1h önbelleği heartbeat ile sıcak tutma

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
        cacheRetention: "none" # ani bildirimler için önbellek yazmalarından kaçın
```

`agents.list[].params`, seçilen modelin `params` değerlerinin üzerine birleştirilir; böylece
yalnızca `cacheRetention` değerini geçersiz kılabilir ve diğer model varsayılanlarını değişmeden devralabilirsiniz.

### Örnek: Anthropic 1M bağlam beta başlığını etkinleştirme

Anthropic’in 1M bağlam penceresi şu anda beta geçidine tabidir. OpenClaw,
desteklenen Opus veya Sonnet modellerinde `context1m` etkinleştirildiğinde
gerekli `anthropic-beta` değerini enjekte edebilir.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Bu, Anthropic’in `context-1m-2025-08-07` beta başlığına eşlenir.

Bu yalnızca ilgili model girdisinde `context1m: true` ayarlandığında uygulanır.

Gereksinim: kimlik bilgisinin uzun bağlam kullanımı için uygun olması gerekir. Uygun değilse
Anthropic, bu istek için sağlayıcı taraflı bir oran sınırı hatasıyla yanıt verir.

Anthropic kimlik doğrulamasını OAuth/abonelik tokenleri (`sk-ant-oat-*`) ile yaparsanız
OpenClaw, `context-1m-*` beta başlığını atlar çünkü Anthropic şu anda
bu birleşimi HTTP 401 ile reddeder.

## Token baskısını azaltmaya yönelik ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızdaki büyük araç çıktılarını kırpın.
- Ekran görüntüsü ağırlıklı oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skill açıklamalarını kısa tutun (Skill listesi prompta enjekte edilir).
- Ayrıntılı, keşif amaçlı işler için daha küçük modelleri tercih edin.

Tam Skill listesi ek yük formülü için [Skills](/tr/tools/skills) bölümüne bakın.

## İlgili

- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
- [Prompt önbelleğe alma](/tr/reference/prompt-caching)
- [Kullanım izleme](/tr/concepts/usage-tracking)
