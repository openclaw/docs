---
read_when:
    - Token kullanımını, maliyetleri veya bağlam pencerelerini açıklama
    - Bağlam büyümesini veya Compaction davranışını hata ayıklama
summary: OpenClaw istem bağlamını nasıl oluşturur ve token kullanımını + maliyetleri nasıl raporlar
title: Token kullanımı ve maliyetler
x-i18n:
    generated_at: "2026-06-28T01:17:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw **tokenları** izler, karakterleri değil. Tokenlar modele özeldir, ancak çoğu
OpenAI tarzı model İngilizce metin için token başına ortalama yaklaşık 4 karakter kullanır.

## Sistem istemi nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem istemini derler. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca meta veriler; talimatlar gerektiğinde `read` ile yüklenir).
  Yerel Codex turları, kompakt Skills bloğunu tur kapsamlı
  iş birliği geliştirici talimatları olarak alır; diğer harness'lar bunu normal
  istem yüzeyinde alır. `skills.limits.maxSkillsPromptChars` ile sınırlandırılır;
  isteğe bağlı ajan başına geçersiz kılma `agents.list[].skillsLimits.maxSkillsPromptChars` üzerinden yapılır.
- Kendi kendini güncelleme talimatları
- Çalışma alanı + bootstrap dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, yeniyse `BOOTSTRAP.md`, ayrıca varsa `MEMORY.md`). Yerel Codex turları, o çalışma alanı için bellek araçları kullanılabiliyorsa yapılandırılmış ajan çalışma alanından ham `MEMORY.md` yapıştırmaz; tur kapsamlı iş birliği geliştirici talimatlarına küçük bir bellek işaretçisi ekler ve gerektiğinde bellek araçlarını kullanır. Araçlar devre dışıysa, bellek araması kullanılamıyorsa veya etkin çalışma alanı ajan bellek çalışma alanından farklıysa `MEMORY.md` normal sınırlandırılmış tur bağlamı yolunu kullanır. Küçük harfli kök `memory.md` enjekte edilmez; `MEMORY.md` ile eşlendiğinde `openclaw doctor --fix` için eski onarım girdisidir. Büyük enjekte edilen dosyalar `agents.defaults.bootstrapMaxChars` (varsayılan: 20000) ile kısaltılır ve toplam bootstrap enjeksiyonu `agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile sınırlandırılır. `memory/*.md` günlük dosyaları normal bootstrap isteminin parçası değildir; sıradan turlarda bellek araçları üzerinden isteğe bağlı kalırlar, ancak sıfırlama/başlatma model çalıştırmaları ilk tur için yakın tarihli günlük belleği içeren tek seferlik bir başlatma bağlamı bloğunu başa ekleyebilir. Yalın sohbet `/new` ve `/reset` komutları modeli çağırmadan onaylanır. Başlatma başlangıç bölümü `agents.defaults.startupContext` tarafından kontrol edilir. Compaction sonrası AGENTS.md alıntıları ayrıdır ve açık `agents.defaults.compaction.postCompactionSections` tercihinin etkinleştirilmesini gerektirir.
- Saat (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + Heartbeat davranışı
- Çalışma zamanı meta verileri (ana makine/OS/model/düşünme)

Tam dökümü [Sistem İstemi](/tr/concepts/system-prompt) bölümünde görün.

Kimlik bilgilerini veya kimlik doğrulama parçacıklarını belgelendirirken, yalnızca dokümantasyon değişikliklerinde
gizli tarayıcı yanlış pozitiflerinden kaçınmak için
[Gizli Yer Tutucu Kuralları](/tr/reference/secret-placeholder-conventions) bölümünü kullanın.

## Bağlam penceresinde neler sayılır

Modelin aldığı her şey bağlam sınırına dahil edilir:

- Sistem istemi (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/transkriptler (görseller, ses, dosyalar)
- Compaction özetleri ve budama yapıtları
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünmez, ancak yine de sayılır)

Bazı çalışma zamanı ağırlıklı yüzeylerin kendi açık sınırları vardır:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ajan başına geçersiz kılmalar `agents.list[].contextLimits` altında bulunur. Bu düğmeler
sınırlandırılmış çalışma zamanı alıntıları ve çalışma zamanı sahibindeki enjekte edilmiş bloklar içindir.
Bootstrap sınırlarından, başlatma bağlamı sınırlarından ve Skills istemi
sınırlarından ayrıdırlar.

`toolResultMaxChars` gelişmiş bir üst sınırdır (`1000000` karaktere kadar). Ayarlanmamışsa OpenClaw,
etkili model bağlam penceresinden canlı araç sonucu sınırını seçer: 100K tokenın
altında `16000` karakter, 100K+ tokenda `32000` karakter ve 200K+
tokenda `64000` karakter; yine de çalışma zamanı bağlam payı korumasıyla sınırlandırılır.

Görseller için OpenClaw, sağlayıcı çağrılarından önce transkript/araç görsel yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` (varsayılan: `1200`) kullanın:

- Daha düşük değerler genellikle görme token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntüleri için daha fazla görsel ayrıntıyı korur.

Pratik bir döküm için (enjekte edilen dosya başına, araçlar, Skills ve sistem istemi boyutu), `/context list` veya `/context detail` kullanın. [Bağlam](/tr/concepts/context) bölümüne bakın.

## Geçerli token kullanımı nasıl görülür

Sohbette şunları kullanın:

- `/status` → oturum modeli, bağlam kullanımı,
  son yanıt girdi/çıktı tokenları ve etkin model için yerel fiyatlandırma
  yapılandırılmışsa **tahmini maliyet** içeren **emoji ağırlıklı durum kartı**.
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım alt bilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - `/usage reset` (takma adlar: `inherit`, `clear`, `default`) — oturum
    geçersiz kılmasını temizler, böylece oturum yapılandırılmış varsayılanı yeniden devralır.
  - `/usage full`, tahmini maliyeti yalnızca OpenClaw kullanım meta verilerine ve
    etkin model için yerel fiyatlandırmaya sahipse gösterir. Aksi takdirde yalnızca tokenları gösterir.
- `/usage cost` → OpenClaw oturum günlüklerinden yerel bir maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`,
  normalleştirilmiş sağlayıcı kota pencerelerini gösterir (`%X kaldı`, yanıt başına maliyet değil).
  Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, görüntülemeden önce yaygın sağlayıcıya özgü alan takma adlarını normalleştirir.
OpenAI ailesi Responses trafiği için bu hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` alanlarını içerir; böylece aktarıma özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI kullanımı da normalleştirilir: varsayılan `stream-json` ayrıştırıcı
asistan `message` olaylarını okur ve CLI açık bir
`stats.input` alanını atladığında `stats.cached`, `cacheRead` değerine eşlenir;
`stats.input_tokens - stats.cached` kullanılır. Eski JSON geçersiz kılmaları yanıt metnini hâlâ
`response` alanından okur.
Yerel OpenAI ailesi Responses trafiği için WebSocket/SSE kullanım takma adları da
aynı şekilde normalleştirilir ve `total_tokens` eksikse veya `0` ise toplamlar
normalleştirilmiş girdi + çıktıya geri döner.
Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` ve `session_status`,
en son transkript kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini de
kurtarabilir. Mevcut sıfır olmayan canlı değerler transkript yedek değerlerine göre
önceliğini korur ve saklanan toplamlar eksik ya da daha küçük olduğunda daha büyük istem odaklı
transkript toplamları kazanabilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, varsa sağlayıcıya özgü hook'lardan
gelir; aksi takdirde OpenClaw, kimlik doğrulama profillerinden, ortamdan veya yapılandırmadan
eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
Asistan transkript girdileri, etkin model için fiyatlandırma yapılandırılmışsa ve sağlayıcı
kullanım meta verileri döndürüyorsa `usage.cost` dahil olmak üzere aynı normalleştirilmiş kullanım şeklini kalıcılaştırır. Bu, canlı çalışma zamanı durumu kaybolduktan sonra bile `/usage cost` ve transkript destekli oturum durumuna kararlı bir kaynak sağlar.

OpenClaw, sağlayıcı kullanım muhasebesini geçerli bağlam anlık görüntüsünden ayrı tutar.
Sağlayıcı `usage.total`, önbelleğe alınmış girdiyi, çıktıyı ve birden çok
araç döngüsü model çağrısını içerebilir; bu yüzden maliyet ve telemetri için kullanışlıdır ancak
canlı bağlam penceresini olduğundan yüksek gösterebilir. Bağlam gösterimleri ve tanılama,
`context.used` için en son istem anlık görüntüsünü (`promptTokens`, veya istem anlık görüntüsü
yoksa son model çağrısını) kullanır.

## Maliyet tahmini (gösterildiğinde)

Maliyetler model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1M token başına USD** değerleridir. Fiyatlandırma eksikse OpenClaw yalnızca tokenları gösterir. Maliyet gösterimi
API anahtarı kimlik doğrulamasıyla sınırlı değildir: `aws-sdk` gibi API anahtarı olmayan sağlayıcılar,
yapılandırılmış model girdileri yerel fiyatlandırma içerdiğinde ve sağlayıcı
kullanım meta verileri döndürdüğünde tahmini maliyet gösterebilir.

Yan araçlar ve kanallar Gateway hazır yoluna ulaştıktan sonra OpenClaw,
henüz yerel fiyatlandırması olmayan yapılandırılmış model başvuruları için
isteğe bağlı bir arka plan fiyatlandırma bootstrap'ı başlatır. Bu bootstrap uzak OpenRouter ve LiteLLM
fiyatlandırma kataloglarını getirir. Çevrimdışı veya kısıtlı ağlarda bu katalog
getirmelerini atlamak için `models.pricing.enabled: false` ayarlayın; açık
`models.providers.*.models[].cost` girdileri yerel maliyet
tahminlerini yönlendirmeye devam eder.

## Önbellek TTL'si ve budama etkisi

Sağlayıcı istem önbelleğe alma yalnızca önbellek TTL penceresi içinde geçerlidir. OpenClaw
isteğe bağlı olarak **cache-ttl budama** çalıştırabilir: önbellek TTL'si
sona erdiğinde oturumu budar, ardından önbellek penceresini sıfırlar; böylece sonraki istekler
tam geçmişi yeniden önbelleğe almak yerine yeni önbelleğe alınmış bağlamı yeniden kullanabilir. Bu, bir oturum TTL'yi geçecek kadar boşta kaldığında önbellek
yazma maliyetlerini daha düşük tutar.

Bunu [Gateway yapılandırması](/tr/gateway/configuration) içinde yapılandırın ve
davranış ayrıntıları için [Oturum budama](/tr/concepts/session-pruning) bölümüne bakın.

Heartbeat, boşta kalma aralıkları boyunca önbelleği **sıcak** tutabilir. Model önbellek TTL'niz
`1h` ise heartbeat aralığını bunun hemen altına (ör. `55m`) ayarlamak,
tam istemin yeniden önbelleğe alınmasını önleyerek önbellek yazma maliyetlerini azaltabilir.

Çok ajanlı kurulumlarda, tek bir paylaşılan model yapılandırması tutabilir ve önbellek davranışını
ajan başına `agents.list[].params.cacheRetention` ile ayarlayabilirsiniz.

Tam ayar bazlı rehber için [İstem Önbelleğe Alma](/tr/reference/prompt-caching) bölümüne bakın.

Anthropic API fiyatlandırması için önbellek okumaları girdi
tokenlarından önemli ölçüde ucuzdur, önbellek yazmaları ise daha yüksek bir çarpanla ücretlendirilir. En güncel oranlar ve TTL çarpanları için Anthropic'in
istem önbelleğe alma fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: 1s önbelleği heartbeat ile sıcak tutma

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
yalnızca `cacheRetention` değerini geçersiz kılıp diğer model varsayılanlarını değişmeden devralabilirsiniz.

### Anthropic 1M bağlam

OpenClaw, Opus 4.8, Opus 4.7, Opus 4.6 ve
Sonnet 4.6 gibi GA destekli Claude 4.x modellerini Anthropic'in 1M bağlam penceresiyle boyutlandırır. Bu modeller için
`params.context1m: true` gerekmez.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Eski yapılandırmalar `context1m: true` değerini tutabilir, ancak OpenClaw artık bu ayar için
Anthropic'in emekli edilmiş `context-1m-2025-08-07` beta başlığını göndermez ve
desteklenmeyen eski Claude modellerini 1M'e genişletmez.

Gereksinim: kimlik bilgisinin uzun bağlam kullanımına uygun olması gerekir. Değilse,
Anthropic bu istek için sağlayıcı taraflı bir hız sınırı hatasıyla yanıt verir.

Anthropic'i OAuth/abonelik tokenları (`sk-ant-oat-*`) ile doğrularsanız,
OpenClaw OAuth için gereken Anthropic beta başlıklarını korurken, eski yapılandırmada kalmışsa
emekli edilmiş `context-1m-*` beta başlığını çıkarır.

## Token baskısını azaltmaya yönelik ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızdaki büyük araç çıktılarını kırpın.
- Ekran görüntüsü ağırlıklı oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skill açıklamalarını kısa tutun (skill listesi isteme enjekte edilir).
- Ayrıntılı, keşif amaçlı çalışma için daha küçük modelleri tercih edin.

Tam skill listesi ek yük formülü için [Skills](/tr/tools/skills) bölümüne bakın.

## İlgili

- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
- [Prompt önbelleğe alma](/tr/reference/prompt-caching)
- [Kullanım takibi](/tr/concepts/usage-tracking)
