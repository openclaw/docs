---
read_when:
    - Token kullanımını, maliyetleri veya bağlam pencerelerini açıklama
    - Bağlam büyümesini veya Compaction davranışını hata ayıklama
summary: OpenClaw prompt bağlamını nasıl oluşturur ve token kullanımını + maliyetleri nasıl raporlar
title: Belirteç kullanımı ve maliyetler
x-i18n:
    generated_at: "2026-07-01T18:18:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw karakterleri değil, **tokenları** izler. Tokenlar modele özeldir, ancak çoğu
OpenAI tarzı model İngilizce metin için token başına ortalama ~4 karakter kullanır.

## Sistem istemi nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem istemini birleştirir. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca meta veriler; talimatlar gerektiğinde `read` ile yüklenir).
  Yerel Codex turları, kompakt Skills bloğunu tur kapsamlı
  iş birliği geliştirici talimatları olarak alır; diğer harness'lar bunu normal
  istem yüzeyinde alır. Bu, `skills.limits.maxSkillsPromptChars` ile sınırlandırılır ve
  `agents.list[].skillsLimits.maxSkillsPromptChars` konumunda isteğe bağlı ajan bazlı geçersiz kılma içerir.
- Kendi kendini güncelleme talimatları
- Çalışma alanı + bootstrap dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` yeni olduğunda, ayrıca mevcut olduğunda `MEMORY.md`). Yerel Codex turları, bu çalışma alanı için bellek araçları kullanılabildiğinde yapılandırılmış ajan çalışma alanından ham `MEMORY.md` yapıştırmaz; bunun yerine tur kapsamlı iş birliği geliştirici talimatlarına küçük bir bellek işaretçisi ekler ve gerektiğinde bellek araçlarını kullanır. Araçlar devre dışıysa, bellek araması kullanılamıyorsa veya etkin çalışma alanı ajan bellek çalışma alanından farklıysa, `MEMORY.md` normal sınırlı tur bağlamı yolunu kullanır. Küçük harfli kök `memory.md` enjekte edilmez; `MEMORY.md` ile eşleştirildiğinde `openclaw doctor --fix` için eski onarım girdisidir. Büyük enjekte edilen dosyalar `agents.defaults.bootstrapMaxChars` (varsayılan: 20000) tarafından kısaltılır ve toplam bootstrap enjeksiyonu `agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile sınırlandırılır. `memory/*.md` günlük dosyaları normal bootstrap isteminin parçası değildir; sıradan turlarda bellek araçları üzerinden isteğe bağlı kalırlar, ancak sıfırlama/başlatma model çalıştırmaları, o ilk tur için yakın tarihli günlük bellek içeren tek seferlik bir başlatma bağlamı bloğunu başa ekleyebilir. Yalın sohbet `/new` ve `/reset` komutları model çağrılmadan onaylanır. Başlatma girişi `agents.defaults.startupContext` tarafından kontrol edilir. Compaction sonrası AGENTS.md alıntıları ayrıdır ve açık `agents.defaults.compaction.postCompactionSections` katılımı gerektirir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + Heartbeat davranışı
- Çalışma zamanı meta verileri (host/OS/model/thinking)

Tam dökümü [Sistem İstemi](/tr/concepts/system-prompt) bölümünde görün.

Kimlik bilgilerini veya kimlik doğrulama parçacıklarını belgelendirirken, yalnızca dokümantasyon değişikliklerinde
secret-scanner hatalı pozitiflerini önlemek için
[Gizli Yer Tutucu Kuralları](/tr/reference/secret-placeholder-conventions) kullanın.

## Bağlam penceresinde neler sayılır

Modelin aldığı her şey bağlam sınırına dahil edilir:

- Sistem istemi (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/transkriptler (görüntüler, ses, dosyalar)
- Compaction özetleri ve budama yapıtları
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünür değildir, ancak yine de sayılır)

Bazı çalışma zamanı açısından ağır yüzeylerin kendi açık sınırları vardır:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ajan bazlı geçersiz kılmalar `agents.list[].contextLimits` altında bulunur. Bu ayarlar,
sınırlı çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipli bloklar içindir.
Bootstrap sınırlarından, başlatma bağlamı sınırlarından ve Skills istem
sınırlarından ayrıdır.

`toolResultMaxChars` gelişmiş bir üst sınırdır (`1000000` karaktere kadar). Ayarlanmadığında OpenClaw,
etkin model bağlam penceresinden canlı araç sonucu sınırını seçer: 100K tokenın
altında `16000` karakter, 100K+ tokenda `32000` karakter ve 200K+
tokenda `64000` karakter; yine de çalışma zamanı bağlam payı korumasıyla sınırlıdır.

Görüntüler için OpenClaw, sağlayıcı çağrılarından önce transkript/araç görüntü yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` (varsayılan: `1200`) kullanın:

- Daha düşük değerler genellikle görsel token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntüleri için daha fazla görsel ayrıntıyı korur.

Pratik bir döküm için (enjekte edilen dosya, araçlar, Skills ve sistem istemi boyutu başına), `/context list` veya `/context detail` kullanın. Bkz. [Bağlam](/tr/concepts/context).

## Geçerli token kullanımını görme

Sohbette şunları kullanın:

- `/status` → oturum modeli, bağlam kullanımı,
  son yanıt giriş/çıkış tokenları ve etkin model için yerel fiyatlandırma
  yapılandırıldığında **tahmini maliyet** içeren **emoji ağırlıklı durum kartı**.
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım alt bilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - `/usage reset` (takma adlar: `inherit`, `clear`, `default`) — oturumun
    yapılandırılmış varsayılanı yeniden devralması için oturum geçersiz kılmasını temizler.
  - `/usage tokens` tur token/önbellek ayrıntılarını gösterir.
  - `/usage full` kompakt model/bağlam/maliyet ayrıntılarını gösterir; tahmini maliyet
    yalnızca OpenClaw kullanım meta verilerine ve etkin model için yerel fiyatlandırmaya sahip olduğunda görünür.
    Özel `messages.usageTemplate` düzenleri token/önbellek alanlarını içerebilir.
- `/usage cost` → OpenClaw oturum günlüklerinden yerel bir maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`,
  normalleştirilmiş sağlayıcı kota pencerelerini gösterir (`X% left`, yanıt başına maliyetleri değil).
  Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, görüntülemeden önce yaygın sağlayıcıya özgü alan takma adlarını normalleştirir.
OpenAI ailesi Responses trafiği için bu hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` içerir; böylece taşıma katmanına özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI kullanımı da normalleştirilir: varsayılan `stream-json` ayrıştırıcı
asistan `message` olaylarını okur ve CLI açık bir
`stats.input` alanı sağlamadığında `stats.cached`, `cacheRead` alanına eşlenir ve
`stats.input_tokens - stats.cached` kullanılır. Eski JSON geçersiz kılmaları yanıt metnini hâlâ
`response` üzerinden okur.
Yerel OpenAI ailesi Responses trafiği için WebSocket/SSE kullanım takma adları da
aynı şekilde normalleştirilir ve `total_tokens` eksik veya `0` olduğunda toplamlar
normalleştirilmiş giriş + çıkış değerine geri döner.
Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` ve `session_status`
en son transkript kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini
de kurtarabilir. Mevcut sıfır olmayan canlı değerler yine de
transkript geri dönüş değerlerine göre önceliklidir ve saklanan toplamlar eksik veya daha küçük olduğunda
daha büyük istem odaklı transkript toplamları kazanabilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, kullanılabildiğinde
sağlayıcıya özgü hook'lardan gelir; aksi takdirde OpenClaw, auth profillerinden,
env'den veya yapılandırmadan eşleşen OAuth/API-key kimlik bilgilerine geri döner.
Asistan transkript girdileri, etkin model için fiyatlandırma yapılandırıldığında ve sağlayıcı
kullanım meta verileri döndürdüğünde `usage.cost` dahil olmak üzere aynı normalleştirilmiş kullanım şeklini kalıcılaştırır.
Bu, canlı çalışma zamanı durumu ortadan kalktıktan sonra bile `/usage cost` ve transkript destekli oturum
durumu için kararlı bir kaynak sağlar.

OpenClaw sağlayıcı kullanım muhasebesini geçerli bağlam anlık görüntüsünden ayrı tutar.
Sağlayıcı `usage.total`, önbelleğe alınmış giriş, çıkış ve birden fazla
araç döngüsü model çağrısını içerebilir; bu yüzden maliyet ve telemetri için yararlıdır ancak
canlı bağlam penceresini olduğundan fazla gösterebilir. Bağlam görünümleri ve tanılamalar,
`context.used` için en son istem anlık görüntüsünü (`promptTokens` veya istem anlık görüntüsü
yoksa son model çağrısını) kullanır.

## Maliyet tahmini (gösterildiğinde)

Maliyetler model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1M token başına USD** değerleridir. Fiyatlandırma eksikse `/usage full` maliyeti atlar; her
yanıtta token/önbellek ayrıntılarına ihtiyacınız olduğunda `/usage tokens`
veya özel bir `messages.usageTemplate` kullanın. Maliyet görünümü API-key auth ile sınırlı değildir: `aws-sdk` gibi
API-key dışı sağlayıcılar, yapılandırılmış model girdileri yerel fiyatlandırma içerdiğinde
ve sağlayıcı kullanım meta verileri döndürdüğünde tahmini maliyet gösterebilir.

Sidecar'lar ve kanallar Gateway hazır yoluna ulaştıktan sonra OpenClaw,
henüz yerel fiyatlandırması olmayan yapılandırılmış model referansları için
isteğe bağlı bir arka plan fiyatlandırma bootstrap'i başlatır. Bu bootstrap uzak OpenRouter ve LiteLLM
fiyatlandırma kataloglarını getirir. Çevrimdışı veya kısıtlı ağlarda bu katalog
getirmelerini atlamak için `models.pricing.enabled: false` ayarlayın; açık
`models.providers.*.models[].cost` girdileri yerel maliyet
tahminlerini yönlendirmeye devam eder.

## Önbellek TTL ve budama etkisi

Sağlayıcı istem önbelleğe alma yalnızca önbellek TTL penceresi içinde geçerlidir. OpenClaw
isteğe bağlı olarak **cache-ttl pruning** çalıştırabilir: önbellek TTL süresi
dolduğunda oturumu budar, ardından önbellek penceresini sıfırlar; böylece sonraki istekler
tüm geçmişi yeniden önbelleğe almak yerine yeni önbelleğe alınmış bağlamı yeniden kullanabilir. Bu, bir oturum TTL'yi
aşacak kadar boşta kaldığında önbellek yazma maliyetlerini düşük tutar.

Bunu [Gateway yapılandırması](/tr/gateway/configuration) içinde yapılandırın ve davranış
ayrıntılarını [Oturum budama](/tr/concepts/session-pruning) içinde görün.

Heartbeat boşta kalma aralıklarında önbelleği **sıcak** tutabilir. Model önbellek TTL'niz
`1h` ise Heartbeat aralığını bunun hemen altına (ör. `55m`) ayarlamak, tam istemin
yeniden önbelleğe alınmasını önleyerek önbellek yazma maliyetlerini azaltabilir.

Çok ajanlı kurulumlarda tek bir paylaşılan model yapılandırması tutabilir ve önbellek davranışını
`agents.list[].params.cacheRetention` ile ajan başına ayarlayabilirsiniz.

Tam bir ayar ayar kılavuzu için [İstem Önbelleğe Alma](/tr/reference/prompt-caching) bölümüne bakın.

Anthropic API fiyatlandırması için önbellek okumaları giriş tokenlarından önemli ölçüde daha ucuzdur,
önbellek yazmaları ise daha yüksek bir çarpanla ücretlendirilir. En güncel oranlar ve TTL çarpanları için Anthropic'in
istem önbelleğe alma fiyatlandırmasına bakın:
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

`agents.list[].params`, seçilen modelin `params` değerlerinin üstüne birleştirilir; böylece
yalnızca `cacheRetention` değerini geçersiz kılıp diğer model varsayılanlarını değiştirmeden devralabilirsiniz.

### Anthropic 1M bağlam

OpenClaw, Opus 4.8, Opus 4.7, Opus 4.6 ve
Sonnet 4.6 gibi GA yetenekli Claude 4.x modellerini Anthropic'in 1M bağlam penceresiyle boyutlandırır.
Bu modeller için `params.context1m: true` gerekmez.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Eski yapılandırmalar `context1m: true` değerini tutabilir, ancak OpenClaw artık bu ayar için
Anthropic'in kullanımdan kaldırılmış `context-1m-2025-08-07` beta başlığını göndermez ve
desteklenmeyen eski Claude modellerini 1M'ye genişletmez.

Gereksinim: kimlik bilgisi uzun bağlam kullanımı için uygun olmalıdır. Uygun değilse,
Anthropic bu istek için sağlayıcı taraflı bir hız sınırı hatası döndürür.

Anthropic'i OAuth/abonelik tokenlarıyla (`sk-ant-oat-*`) doğrularsanız,
OpenClaw, eski yapılandırmada kalmışsa kullanımdan kaldırılmış
`context-1m-*` betasını çıkarırken OAuth için gerekli Anthropic beta başlıklarını korur.

## Token baskısını azaltma ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızda büyük araç çıktılarını kısaltın.
- Ekran görüntüsü ağırlıklı oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skills açıklamalarını kısa tutun (skill listesi isteme eklenir).
- Ayrıntılı, keşif odaklı işler için daha küçük modelleri tercih edin.

Tam skill listesi ek yük formülü için [Skills](/tr/tools/skills) bölümüne bakın.

## İlgili

- [API kullanımı ve maliyetleri](/tr/reference/api-usage-costs)
- [İstem önbelleğe alma](/tr/reference/prompt-caching)
- [Kullanım takibi](/tr/concepts/usage-tracking)
