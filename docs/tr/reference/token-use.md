---
read_when:
    - Token kullanımını, maliyetleri veya bağlam pencerelerini açıklama
    - Bağlam büyümesini veya Compaction davranışını hata ayıklama
summary: OpenClaw'ın istem bağlamını nasıl oluşturduğu ve token kullanımını + maliyetleri nasıl raporladığı
title: Token Kullanımı ve Maliyetler
x-i18n:
    generated_at: "2026-04-15T19:42:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a706d3df8b2ea1136b3535d216c6b358e43aee2a31a4759824385e1345e6fe5
    source_path: reference/token-use.md
    workflow: 15
---

# Token kullanımı ve maliyetler

OpenClaw, karakterleri değil **token**'ları izler. Token'lar modele özeldir, ancak çoğu
OpenAI tarzı model İngilizce metinde ortalama token başına ~4 karakter kullanır.

## Sistem istemi nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem istemini oluşturur. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca meta veri; talimatlar ihtiyaç halinde `read` ile yüklenir).
  Kompakt skills bloğu `skills.limits.maxSkillsPromptChars` ile sınırlandırılır,
  ve ajan başına isteğe bağlı geçersiz kılma
  `agents.list[].skillsLimits.maxSkillsPromptChars` konumundadır.
- Self-update talimatları
- Workspace + önyükleme dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, yeniyse `BOOTSTRAP.md`, ayrıca varsa `MEMORY.md` veya küçük harfli yedek olarak `memory.md`). Büyük dosyalar `agents.defaults.bootstrapMaxChars` ile kesilir (varsayılan: 12000), toplam önyükleme ekleme ise `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). `memory/*.md` günlük dosyaları normal önyükleme isteminin parçası değildir; normal turlarda memory araçları üzerinden ihtiyaç halinde kalırlar, ancak çıplak `/new` ve `/reset` ilk tur için son günlük belleği içeren tek seferlik bir başlangıç bağlamı bloğunu öne ekleyebilir. Bu başlangıç ön eki `agents.defaults.startupContext` tarafından kontrol edilir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + heartbeat davranışı
- Çalışma zamanı meta verileri (host/OS/model/düşünme)

Tam döküm için bkz. [System Prompt](/tr/concepts/system-prompt).

## Bağlam penceresinde neler sayılır

Modele gönderilen her şey bağlam sınırına dahil olur:

- Sistem istemi (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/transkriptler (görseller, ses, dosyalar)
- Compaction özetleri ve budama yapıtları
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünmezler, ama yine de sayılırlar)

Bazı çalışma zamanı açısından ağır yüzeylerin kendi açık sınırları vardır:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ajan başına geçersiz kılmalar `agents.list[].contextLimits` altında bulunur. Bu ayarlar
sınırlı çalışma zamanı alıntıları ve çalışma zamanına ait enjekte edilen bloklar
içindir. Önyükleme sınırlarından, başlangıç bağlamı sınırlarından ve skills istem
sınırlarından ayrıdırlar.

Görseller için OpenClaw, sağlayıcı çağrılarından önce transkript/araç görsel yüklerini küçültür.
Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx` kullanın (varsayılan: `1200`):

- Daha düşük değerler genellikle vision token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntüleri için daha fazla görsel ayrıntıyı korur.

Pratik bir döküm için (enjekte edilen dosya başına, araçlar, Skills ve sistem istemi boyutu), `/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Geçerli token kullanımı nasıl görülür

Sohbette şunları kullanın:

- `/status` → oturum modeli, bağlam kullanımı,
  son yanıt giriş/çıkış token'ları ve **tahmini maliyet** içeren
  **emoji açısından zengin durum kartı** (yalnızca API anahtarı).
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım alt bilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - OAuth kimlik doğrulaması **maliyeti gizler** (yalnızca token'lar).
- `/usage cost` → OpenClaw oturum günlüklerinden yerel bir maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`,
  normalize edilmiş sağlayıcı kota pencerelerini gösterir
  (`%X kaldı`, yanıt başına maliyet değil).
  Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, gösterimden önce yaygın sağlayıcıya özgü alan takma adlarını normalize eder.
OpenAI ailesi Responses trafiği için buna hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` dahildir; böylece iletime özgü
alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI JSON kullanımı da normalize edilir: yanıt metni `response` içinden gelir ve
CLI açık bir `stats.input` alanı vermediğinde `stats.cached`, `cacheRead` olarak eşlenir;
`stats.input_tokens - stats.cached` kullanılır.
Yerel OpenAI ailesi Responses trafiğinde, WebSocket/SSE kullanım takma adları da
aynı şekilde normalize edilir ve `total_tokens` eksikse veya `0` ise toplamlar normalize edilmiş giriş + çıkıştan geri doldurulur.
Geçerli oturum anlık görüntüsü seyrek olduğunda, `/status` ve `session_status`
ayrıca en son transkript kullanım günlüğünden token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini de kurtarabilir.
Mevcut sıfır olmayan canlı değerler yine de transkript geri doldurma değerlerine göre önceliklidir ve depolanan toplamlar eksikse veya daha küçükse
istem odaklı daha büyük transkript toplamları kazanabilir.
Sağlayıcı kota pencereleri için kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü hook'lardan gelir; aksi halde OpenClaw auth profillerinden, ortamdan veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

## Maliyet tahmini (gösterildiğinde)

Maliyetler, model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1M token başına USD** cinsindendir. Fiyatlandırma eksikse OpenClaw yalnızca token'ları gösterir. OAuth token'ları
asla dolar maliyeti göstermez.

## Önbellek TTL ve budama etkisi

Sağlayıcı istem önbelleklemesi yalnızca önbellek TTL penceresi içinde geçerlidir. OpenClaw
isteğe bağlı olarak **cache-ttl pruning** çalıştırabilir: önbellek TTL süresi
dolduğunda oturumu budar, sonra önbellek penceresini sıfırlar; böylece sonraki
istekler tam geçmişi tekrar önbelleğe yazmak yerine yeni önbelleğe alınmış bağlamı yeniden kullanabilir.
Bu, bir oturum TTL sonrasında boşta kaldığında önbellek yazma maliyetlerini
daha düşük tutar.

Bunu [Gateway configuration](/tr/gateway/configuration) içinde yapılandırın ve
davranış ayrıntılarını [Session pruning](/tr/concepts/session-pruning) içinde görün.

Heartbeat, önbelleği boşta geçen aralıklarda **sıcak** tutabilir. Model önbellek TTL'niz
`1h` ise, heartbeat aralığını bunun biraz altına ayarlamak (`55m` gibi)
tam istemin yeniden önbelleğe alınmasını önleyebilir ve önbellek yazma maliyetlerini azaltabilir.

Çok ajanlı kurulumlarda, ortak bir model yapılandırmasını koruyup önbellek davranışını
ajan başına `agents.list[].params.cacheRetention` ile ayarlayabilirsiniz.

Düğme bazında tam kılavuz için bkz. [Prompt Caching](/tr/reference/prompt-caching).

Anthropic API fiyatlandırmasında, önbellek okumaları giriş
token'larından belirgin biçimde daha ucuzdur; önbellek yazmaları ise daha yüksek bir çarpanla ücretlendirilir. En güncel oranlar ve TTL çarpanları için Anthropic’in
istem önbellekleme fiyatlandırmasına bakın:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Örnek: heartbeat ile 1h önbelleği sıcak tutma

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
        cacheRetention: "none" # patlamalı bildirimler için önbellek yazımlarını önle
```

`agents.list[].params`, seçilen modelin `params` alanının üzerine birleştirilir; böylece yalnızca
`cacheRetention` değerini geçersiz kılıp diğer model varsayılanlarını değiştirmeden devralabilirsiniz.

### Örnek: Anthropic 1M bağlam beta başlığını etkinleştirme

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

Bu yalnızca ilgili model girdisinde `context1m: true` ayarlandığında geçerlidir.

Gereksinim: kimlik bilgilerinin uzun bağlam kullanımı için uygun olması gerekir. Aksi halde,
Anthropic o istek için sağlayıcı taraflı hız sınırı hatası döndürür.

Anthropic'e OAuth/abonelik token'larıyla (`sk-ant-oat-*`) kimlik doğrulaması yaparsanız,
OpenClaw `context-1m-*` beta başlığını atlar çünkü Anthropic şu anda
bu birleşimi HTTP 401 ile reddeder.

## Token baskısını azaltma ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızda büyük araç çıktılarını kırpın.
- Ekran görüntüsü ağırlıklı oturumlar için `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skill açıklamalarını kısa tutun (skill listesi isteme enjekte edilir).
- Ayrıntılı, keşif amaçlı işler için daha küçük modelleri tercih edin.

Tam skill listesi ek yükü formülü için bkz. [Skills](/tr/tools/skills).
