---
read_when:
    - Token kullanımını, maliyetleri veya bağlam pencerelerini açıklama
    - Bağlam büyümesi veya Compaction davranışında hata ayıklama
summary: OpenClaw istem bağlamını nasıl oluşturur ve token kullanımını + maliyetleri nasıl raporlar
title: Token kullanımı ve maliyetler
x-i18n:
    generated_at: "2026-07-12T12:47:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw, karakterleri değil **tokenları** izler. Tokenlar modele özgüdür, ancak
OpenAI tarzı modellerin çoğunda İngilizce metin için token başına ortalama yaklaşık 4 karakter bulunur.

## Sistem istemi nasıl oluşturulur?

OpenClaw her çalıştırmada kendi sistem istemini oluşturur. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca meta veriler; talimatlar gerektiğinde `read` ile yüklenir). Yerel
  Codex dönüşleri, dönüş kapsamlı iş birliği geliştirici talimatları olarak
  kompakt Skills bloğunu alır; diğer çalıştırma düzenekleri bunu normal istem yüzeyinde alır.
  `skills.limits.maxSkillsPromptChars` ile sınırlandırılır ve isteğe bağlı olarak
  `agents.list[].skillsLimits.maxSkillsPromptChars` üzerinden aracı başına
  geçersiz kılınabilir.
- Kendini güncelleme talimatları
- Çalışma alanı + başlangıç dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, yeni olduğunda `BOOTSTRAP.md` ve
  mevcut olduğunda `MEMORY.md`). Eklenen büyük dosyalar
  `agents.defaults.bootstrapMaxChars` (varsayılan: `20000`) ile kırpılır; toplam başlangıç
  eklemesi `agents.defaults.bootstrapTotalMaxChars` (varsayılan:
  `60000`) ile sınırlandırılır.
  - Yerel Codex dönüşleri, ilgili çalışma alanında bellek araçları kullanılabiliyorsa
    ham `MEMORY.md` içeriğini yapıştırmaz; bunun yerine dönüş kapsamlı iş birliği
    geliştirici talimatlarında küçük bir bellek işaretçisi alır ve gerektiğinde bellek
    araçlarını kullanır. Araçlar devre dışıysa, bellek araması kullanılamıyorsa veya
    etkin çalışma alanı aracı bellek çalışma alanından farklıysa `MEMORY.md`,
    normal sınırlandırılmış dönüş bağlamı yoluna geri döner.
  - Kök dizindeki küçük harfli `memory.md` hiçbir zaman eklenmez. Bu dosya,
    onu `MEMORY.md` içine taşıyan `openclaw doctor --fix` için eski biçim onarım girdisidir.
  - Günlük `memory/*.md` dosyaları normal başlangıç isteminin parçası değildir;
    sıradan dönüşlerde bellek araçları üzerinden gerektiğinde kullanılmaya devam ederler.
    Sıfırlama/başlatma model çalıştırmaları, ilk dönüş için yakın tarihli günlük belleği
    içeren tek seferlik bir başlangıç bağlamı bloğunu başa ekleyebilir; bu davranış
    `agents.defaults.startupContext` tarafından denetlenir. Yalın sohbet `/new` ve
    `/reset` komutları model çağrılmadan onaylanır.
  - Compaction sonrası `AGENTS.md` alıntıları ayrıdır ve açıkça
    `agents.defaults.compaction.postCompactionSections` etkinleştirmesi gerektirir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + Heartbeat davranışı
- Çalışma zamanı meta verileri (ana makine/işletim sistemi/model/düşünme)

Tam döküm için [Sistem İstemi](/tr/concepts/system-prompt) bölümüne bakın.

Kimlik bilgilerini veya kimlik doğrulama parçacıklarını belgelendirirken, yalnızca doküman
değişikliklerinde gizli bilgi tarayıcısının yanlış pozitiflerini önlemek için
[Gizli Bilgi Yer Tutucu Kuralları](/tr/reference/secret-placeholder-conventions) bölümünü kullanın.

## Bağlam penceresine neler dâhildir?

Modelin aldığı her şey bağlam sınırına dâhildir:

- Sistem istemi (yukarıdaki tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/dökümler (görüntüler, sesler, dosyalar)
- Compaction özetleri ve budama yapıtları
- Sağlayıcı sarmalayıcıları veya güvenlik üstbilgileri (görünmez ancak yine de hesaba katılır)

Yoğun çalışma zamanı yüzeylerinin `agents.defaults.contextLimits` altında
kendi açık sınırları vardır (aracı başına geçersiz kılmalar
`agents.list[].contextLimits` altındadır):

| Anahtar                  | Amaç                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | `memory_get` tarafından kırpılmadan önce döndürülebilecek en fazla karakter.                |
| `memoryGetDefaultLines`  | İstek `lines` belirtmediğinde varsayılan `memory_get` satır aralığı.                        |
| `toolResultMaxChars`     | Tek bir canlı araç sonucu için gelişmiş üst sınır (`1000000` karaktere kadar).              |
| `postCompactionMaxChars` | Compaction sonrası yenileme sırasında `AGENTS.md` dosyasından korunan en fazla karakter.    |

Bunlar, başlangıç sınırlarından, başlangıç bağlamı sınırlarından ve Skills istemi
sınırlarından ayrı olan, sınırlandırılmış çalışma zamanı alıntıları ve çalışma zamanının
sahip olduğu eklenmiş bloklardır.

`toolResultMaxChars` varsayılan olarak ayarlanmamıştır; bu nedenle OpenClaw canlı
araç sonucu sınırını etkin model bağlam penceresinden türetir: 100 bin tokenın
altında `16000` karakter, 100 bin ve üzeri tokenlarda `32000` karakter, 200 bin
ve üzeri tokenlarda `64000` karakter. Daha büyük bir açık üst sınır yapılandırılmış
olsa bile çalışma zamanı bağlam payı koruması tek bir araç sonucunu bağlam
penceresinin %30'u ile sınırlar.

Görüntüler için OpenClaw, sağlayıcı çağrılarından önce döküm/araç görüntüsü yüklerinin
ölçeğini küçültür. `agents.defaults.imageMaxDimensionPx` (varsayılan:
`1200`) ile ayarlayın:

- Daha düşük değerler, görüntü tokenı kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler, OCR/kullanıcı arayüzü ağırlıklı ekran görüntülerinde daha fazla görsel ayrıntıyı korur.

Pratik bir döküm (eklenen dosya, araçlar, Skills ve sistem istemi boyutu başına) için
`/context list` veya `/context detail` kullanın. [Bağlam](/tr/concepts/context)
bölümüne bakın.

## Geçerli token kullanımı nasıl görülür?

Sohbette:

- `/status` -> oturum modeli, bağlam kullanımı, son yanıtın giriş/çıkış tokenları
  ve etkin model için yerel fiyatlandırma yapılandırıldığında tahmini maliyeti içeren
  emoji açısından zengin durum kartı.
- `/usage off|tokens|full` -> her yanıta yanıt başına kullanım altbilgisi ekler.
  Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - `/usage reset` (diğer adlar: `inherit`, `clear`, `default`), oturum geçersiz
    kılmasını temizleyerek yapılandırılmış varsayılanı yeniden devralmasını sağlar.
  - `/usage tokens`, dönüş tokenı/önbellek ayrıntılarını gösterir.
  - `/usage full`, kompakt model/bağlam/maliyet ayrıntılarını gösterir; tahmini maliyet
    yalnızca OpenClaw etkin model için kullanım meta verilerine ve yerel fiyatlandırmaya
    sahip olduğunda görünür. Özel `messages.usageTemplate` düzenleri token/önbellek
    alanlarını içerebilir.
- `/usage cost` -> OpenClaw oturum günlüklerinden yerel maliyet özeti.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` ve `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`,
  normalleştirilmiş sağlayıcı kota pencerelerini gösterir (`X% left`, yanıt başına
  maliyetleri değil). Geçerli kullanım penceresi sağlayıcıları: Claude (Anthropic),
  ClawRouter, Copilot (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax,
  OpenAI, Xiaomi, Xiaomi Token Plan ve z.ai.

Kullanım yüzeyleri, gösterimden önce yaygın sağlayıcıya özgü alan diğer adlarını
normalleştirir. OpenAI ailesi Responses trafiğinde buna hem
`input_tokens`/`output_tokens` hem de `prompt_tokens`/`completion_tokens` dâhildir;
böylece aktarıma özgü alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI kullanımı da normalleştirilir: varsayılan `stream-json` ayrıştırıcısı,
asistan `message` olaylarını okur ve `stats.cached`, `cacheRead` alanına eşlenir;
CLI açık bir `stats.input` alanı sağlamadığında `stats.input_tokens - stats.cached`
kullanılır. Eski JSON geçersiz kılmaları yanıt metnini hâlâ `response` alanından okur.

Yerel OpenAI ailesi Responses trafiğinde WebSocket/SSE kullanım diğer adları
aynı şekilde normalleştirilir ve `total_tokens` eksik veya `0` olduğunda toplamlar
normalleştirilmiş giriş + çıkış değerlerine geri döner.

Geçerli oturum anlık görüntüsü seyrek olduğunda `/status` ve `session_status`,
en son döküm kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı
modeli etiketini kurtarabilir. Sıfır olmayan mevcut canlı değerler döküm geri dönüş
değerlerinden önce gelmeye devam eder; saklanan toplamlar eksik veya daha küçükse
istem odaklı daha büyük döküm toplamları kullanılabilir.

Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması önce sağlayıcıya özgü
kancalardan gelir; bir sağlayıcının kancası yoksa (veya kanca bir token çözümlemezse)
OpenClaw, kimlik doğrulama profillerinde, ortamda veya yapılandırmada eşleşen
OAuth/API anahtarı kimlik bilgilerine geri döner.

Asistan döküm girdileri, etkin model için fiyatlandırma yapılandırılmışsa ve sağlayıcı
kullanım meta verileri döndürüyorsa `usage.cost` dâhil olmak üzere aynı normalleştirilmiş
kullanım biçimini kalıcı olarak saklar. Bu, canlı çalışma zamanı durumu ortadan kalktıktan
sonra bile `/usage cost` ve döküm destekli oturum durumu için kararlı bir kaynak sağlar.

OpenClaw, sağlayıcı kullanım muhasebesini geçerli bağlam anlık görüntüsünden ayrı tutar.
Sağlayıcı `usage.total` değeri önbelleğe alınmış girdiyi, çıktıyı ve birden fazla araç
döngüsü model çağrısını içerebilir; bu nedenle maliyet ve telemetri için kullanışlıdır,
ancak canlı bağlam penceresini olduğundan büyük gösterebilir. Bağlam gösterimleri ve
tanılamalar, `context.used` için en son istem anlık görüntüsünü (`promptTokens` veya
istem anlık görüntüsü yoksa son model çağrısını) kullanır.

## Maliyet tahmini (gösterildiğinde)

Maliyetler, model fiyatlandırma yapılandırmanızdan tahmin edilir:

```text
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve `cacheWrite` için **1 milyon token başına
ABD dolarıdır**. Fiyatlandırma eksikse `/usage full` maliyeti göstermez; her yanıtta
token/önbellek ayrıntılarına ihtiyacınız olduğunda `/usage tokens` veya özel bir
`messages.usageTemplate` kullanın. Maliyet gösterimi API anahtarıyla kimlik doğrulamayla
sınırlı değildir: `aws-sdk` gibi API anahtarı kullanmayan sağlayıcılar, yapılandırılmış
model girdileri yerel fiyatlandırma içerdiğinde ve sağlayıcı kullanım meta verileri
döndürdüğünde tahmini maliyeti gösterebilir.

Yardımcı süreçler ve kanallar Gateway hazır yoluna ulaştıktan sonra OpenClaw, henüz
yerel fiyatlandırması olmayan yapılandırılmış model başvuruları için isteğe bağlı bir
arka plan fiyatlandırma başlangıcı başlatır. Bu başlangıç, uzak OpenRouter ve LiteLLM
fiyatlandırma kataloglarını getirir. Çevrimdışı veya kısıtlı ağlarda bu katalog getirme
işlemlerini atlamak için `models.pricing.enabled: false` ayarını kullanın; açık
`models.providers.*.models[].cost` girdileri yerel maliyet tahminlerini sağlamaya
devam eder.

## Önbellek TTL'si ve budamanın etkisi

Sağlayıcı istem önbelleğe alma işlemi yalnızca önbellek TTL penceresi içinde geçerlidir.
OpenClaw isteğe bağlı olarak **önbellek TTL budaması** çalıştırabilir: önbellek TTL'si
dolduğunda oturumu budar, ardından önbellek penceresini sıfırlar; böylece sonraki istekler
tüm geçmişi yeniden önbelleğe almak yerine yeni önbelleğe alınmış bağlamı yeniden kullanır.
Bu, oturum TTL süresinden uzun süre boşta kaldığında önbellek yazma maliyetlerini düşürür.

Bunu [Gateway yapılandırması](/tr/gateway/configuration) bölümünde yapılandırın ve davranış
ayrıntıları için [Oturum budama](/tr/concepts/session-pruning) bölümüne bakın.

Heartbeat, boşta kalma aralıkları boyunca önbelleği **sıcak** tutabilir. Model önbelleği
TTL'si `1h` ise Heartbeat aralığını bunun hemen altına (ör. `55m`) ayarlamak, tüm istemin
yeniden önbelleğe alınmasını önleyerek önbellek yazma maliyetlerini azaltabilir.

Çok aracılı kurulumlarda tek bir paylaşılan model yapılandırmasını koruyabilir ve
`agents.list[].params.cacheRetention` ile önbellek davranışını aracı başına ayarlayabilirsiniz.

Tüm ayarları tek tek açıklayan kılavuz için [İstem Önbelleğe Alma](/tr/reference/prompt-caching)
bölümüne bakın.

Anthropic API fiyatlandırmasında önbellek okumaları giriş tokenlarından önemli ölçüde
daha ucuzken, önbellek yazmaları daha yüksek bir çarpanla ücretlendirilir. En güncel
oranlar ve TTL çarpanları için Anthropic'in istem önbelleğe alma fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: Heartbeat ile 1 saatlik önbelleği sıcak tutma

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
          cacheRetention: "long" # çoğu aracı için varsayılan temel değer
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # derin oturumlar için uzun önbelleği sıcak tut
    - id: "alerts"
      params:
        cacheRetention: "none" # ani bildirimler için önbellek yazmalarından kaçın
```

`agents.list[].params`, seçilen modelin `params` değerlerinin üzerine birleştirilir;
böylece yalnızca `cacheRetention` değerini geçersiz kılabilir ve diğer model
varsayılanlarını değiştirmeden devralabilirsiniz.

### Anthropic 1 milyon bağlam

OpenClaw; Opus 4.8, Opus 4.7, Opus 4.6 ve Sonnet 4.6 gibi genel kullanıma sunulmuş
Claude 4.x modellerini Anthropic'in 1 milyonluk bağlam penceresiyle boyutlandırır.
Bu modeller için `params.context1m: true` kullanmanız gerekmez.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Eski yapılandırmalar `context1m: true` değerini koruyabilir, ancak OpenClaw artık
bu ayar için Anthropic'in kullanımdan kaldırılmış `context-1m-2025-08-07` beta
üstbilgisini göndermez ve desteklenmeyen eski Claude modellerini 1 milyona genişletmez.

Gereksinim: kimlik bilgisinin uzun bağlam kullanımı için uygun olması gerekir. Uygun değilse,
Anthropic bu istek için sağlayıcı taraflı bir hız sınırı hatası döndürür.

Anthropic kimlik doğrulamasını OAuth/abonelik belirteçleriyle
(`sk-ant-oat-*`) yaparsanız OpenClaw, OAuth için gerekli Anthropic beta
üst bilgilerini korurken eski yapılandırmada kalmışsa kullanımdan kaldırılan
`context-1m-*` betasını kaldırır.

## Belirteç baskısını azaltmaya yönelik ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızdaki büyük araç çıktılarını kısaltın.
- Ekran görüntüsü ağırlıklı oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skills açıklamalarını kısa tutun (Skills listesi isteme eklenir).
- Ayrıntılı, keşif amaçlı çalışmalar için daha küçük modelleri tercih edin.

Skills listesinin ek yükünü hesaplayan kesin formül için [Skills](/tr/tools/skills) bölümüne bakın.

## İlgili

- [API kullanımı ve maliyetleri](/tr/reference/api-usage-costs)
- [İstem önbelleğe alma](/tr/reference/prompt-caching)
- [Kullanım takibi](/tr/concepts/usage-tracking)
