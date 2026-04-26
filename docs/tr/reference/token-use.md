---
read_when:
    - Token kullanımı, maliyetler veya bağlam pencerelerini açıklama
    - Bağlam büyümesini veya Compaction davranışını hata ayıklama
summary: OpenClaw'ın istem bağlamını nasıl oluşturduğu ve token kullanımı + maliyetleri nasıl raporladığı
title: Token kullanımı ve maliyetler
x-i18n:
    generated_at: "2026-04-26T11:40:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# Token kullanımı ve maliyetler

OpenClaw **karakterleri değil**, **token**ları izler. Token'lar modele özeldir,
ancak çoğu OpenAI tarzı model İngilizce metin için ortalama token başına ~4 karaktere sahiptir.

## Sistem istemi nasıl oluşturulur

OpenClaw her çalıştırmada kendi sistem istemini oluşturur. Şunları içerir:

- Araç listesi + kısa açıklamalar
- Skills listesi (yalnızca metadata; yönergeler gerektiğinde `read` ile yüklenir).
  Sıkıştırılmış Skills bloğu `skills.limits.maxSkillsPromptChars` ile sınırlandırılır,
  isteğe bağlı ajan başına geçersiz kılma ise
  `agents.list[].skillsLimits.maxSkillsPromptChars` altındadır.
- Kendi kendini güncelleme yönergeleri
- Çalışma alanı + bootstrap dosyaları (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, yeni olduğunda `BOOTSTRAP.md`, ayrıca varsa `MEMORY.md`). Küçük harfli kök `memory.md` eklenmez; `MEMORY.md` ile eşlendiğinde `openclaw doctor --fix` için eski onarım girdisidir. Büyük dosyalar `agents.defaults.bootstrapMaxChars` ile kırpılır (varsayılan: 12000) ve toplam bootstrap eklemesi `agents.defaults.bootstrapTotalMaxChars` ile sınırlandırılır (varsayılan: 60000). `memory/*.md` günlük dosyaları normal bootstrap isteminin parçası değildir; normal dönüşlerde bellek araçları üzerinden isteğe bağlı kalırlar, ancak çıplak `/new` ve `/reset` ilk dönüş için son günlük belleği içeren tek seferlik bir başlangıç bağlamı bloğunu başa ekleyebilir. Bu başlangıç ön eki `agents.defaults.startupContext` ile denetlenir.
- Zaman (UTC + kullanıcı saat dilimi)
- Yanıt etiketleri + Heartbeat davranışı
- Çalışma zamanı metadata'sı (host/OS/model/thinking)

Tam döküm için [System Prompt](/tr/concepts/system-prompt) belgesine bakın.

## Bağlam penceresinde ne sayılır

Modelin aldığı her şey bağlam sınırına sayılır:

- Sistem istemi (yukarıda listelenen tüm bölümler)
- Konuşma geçmişi (kullanıcı + asistan mesajları)
- Araç çağrıları ve araç sonuçları
- Ekler/transkriptler (görseller, ses, dosyalar)
- Compaction özetleri ve budama artefaktları
- Sağlayıcı sarmalayıcıları veya güvenlik başlıkları (görünmezler, ama yine de sayılırlar)

Bazı çalışma zamanı açısından ağır yüzeylerin kendi açık sınırları vardır:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ajan başına geçersiz kılmalar `agents.list[].contextLimits` altında bulunur. Bu
ayarlar sınırlandırılmış çalışma zamanı alıntıları ve eklenen çalışma zamanı
sahipli bloklar içindir. Bootstrap sınırlarından, startup-context sınırlarından
ve Skills istem sınırlarından ayrıdırlar.

Görseller için OpenClaw, sağlayıcı çağrılarından önce transkript/araç görsel
yüklerini küçültür. Bunu ayarlamak için `agents.defaults.imageMaxDimensionPx`
(varsayılan: `1200`) kullanın:

- Daha düşük değerler genellikle vision-token kullanımını ve yük boyutunu azaltır.
- Daha yüksek değerler OCR/UI ağırlıklı ekran görüntülerinde daha fazla görsel ayrıntıyı korur.

Pratik bir döküm için (eklenen dosya başına, araçlar, Skills ve sistem istemi boyutu),
`/context list` veya `/context detail` kullanın. Bkz. [Context](/tr/concepts/context).

## Geçerli token kullanımını nasıl görürsünüz

Sohbette şunları kullanın:

- `/status` → oturum modelini, bağlam kullanımını,
  son yanıt giriş/çıkış token'larını ve **tahmini maliyeti** (yalnızca API anahtarı) içeren
  **emoji açısından zengin durum kartı**.
- `/usage off|tokens|full` → her yanıta **yanıt başına kullanım alt bilgisi** ekler.
  - Oturum başına kalıcıdır (`responseUsage` olarak saklanır).
  - OAuth auth **maliyeti gizler** (yalnızca token'lar).
- `/usage cost` → OpenClaw oturum günlüklerinden yerel maliyet özeti gösterir.

Diğer yüzeyler:

- **TUI/Web TUI:** `/status` + `/usage` desteklenir.
- **CLI:** `openclaw status --usage` ve `openclaw channels list`
  normalleştirilmiş sağlayıcı kota pencerelerini gösterir (`X% left`, yanıt başına maliyet değil).
  Geçerli kullanım-penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.

Kullanım yüzeyleri, görüntülemeden önce yaygın sağlayıcı-yerel alan takma adlarını normalleştirir.
OpenAI ailesi Responses trafiği için buna hem `input_tokens` /
`output_tokens` hem de `prompt_tokens` / `completion_tokens` dahildir; böylece
aktarıma özgü alan adları `/status`, `/usage` veya oturum özetlerini değiştirmez.
Gemini CLI JSON kullanımı da normalleştirilir: yanıt metni `response` içinden gelir ve
CLI açık bir `stats.input` alanını atladığında `stats.cached`, `cacheRead` olarak eşlenir,
`stats.input_tokens - stats.cached` kullanılır.
Yerel OpenAI ailesi Responses trafiği için WebSocket/SSE kullanım takma adları da aynı şekilde
normalleştirilir ve `total_tokens` eksik olduğunda veya `0` olduğunda toplamlar
normalleştirilmiş giriş + çıkıştan geri düşer.
Geçerli oturum anlık görüntüsü seyrek olduğunda `/status` ve `session_status`,
en son transkript kullanım günlüğünden token/cache sayaçlarını ve etkin çalışma zamanı
model etiketini de kurtarabilir. Mevcut sıfır olmayan canlı değerler yine de transkript
geri dönüş değerlerinden önceliklidir ve saklanan toplamlar eksik veya daha küçük olduğunda,
istem odaklı daha büyük transkript toplamları kazanabilir.
Sağlayıcı kota pencereleri için kullanım auth'u, varsa sağlayıcıya özgü kancalardan gelir;
aksi halde OpenClaw, auth profile'larından, env'den veya config'den eşleşen
OAuth/API-key kimlik bilgilerine geri döner.
Asistan transkript girdileri, etkin model için fiyatlandırma yapılandırılmışsa ve
sağlayıcı kullanım metadata'sı döndürüyorsa `usage.cost` dahil aynı normalleştirilmiş
kullanım şeklini kalıcılaştırır. Bu, canlı çalışma zamanı durumu ortadan kalktıktan sonra bile
`/usage cost` ve transkript destekli oturum durumuna kararlı bir kaynak sağlar.

OpenClaw, sağlayıcı kullanım muhasebesini geçerli bağlam anlık görüntüsünden ayrı tutar.
Sağlayıcı `usage.total`, önbelleğe alınmış girişi, çıktıyı ve birden çok araç döngüsü model
çağrısını içerebilir; bu nedenle maliyet ve telemetri için yararlıdır ama canlı bağlam
penceresini olduğundan büyük gösterebilir. Bağlam görüntüleri ve tanılamalar,
`context.used` için en son istem anlık görüntüsünü (`promptTokens`, veya istem anlık görüntüsü
yoksa son model çağrısını) kullanır.

## Maliyet tahmini (gösterildiğinde)

Maliyetler model fiyatlandırma yapılandırmanızdan tahmin edilir:

```
models.providers.<provider>.models[].cost
```

Bunlar `input`, `output`, `cacheRead` ve
`cacheWrite` için **1M token başına USD** değerleridir. Fiyatlandırma eksikse
OpenClaw yalnızca token'ları gösterir. OAuth token'ları hiçbir zaman dolar maliyeti göstermez.

## Önbellek TTL ve budama etkisi

Sağlayıcı istem önbelleklemesi yalnızca önbellek TTL penceresi içinde uygulanır. OpenClaw
isteğe bağlı olarak **cache-ttl budaması** çalıştırabilir: önbellek TTL süresi dolduğunda
oturumu budar, sonra önbellek penceresini sıfırlar; böylece sonraki istekler tüm geçmişi
yeniden önbelleğe almak yerine yeni önbelleğe alınmış bağlamı yeniden kullanabilir.
Bu, bir oturum TTL sonrasında boşta kaldığında önbellek yazma maliyetlerini düşük tutar.

Bunu [Gateway configuration](/tr/gateway/configuration) içinde yapılandırın ve
davranış ayrıntıları için [Session pruning](/tr/concepts/session-pruning) belgesine bakın.

Heartbeat, önbelleği boşta kalma aralıkları boyunca **sıcak** tutabilir. Model önbellek TTL'niz
`1h` ise, Heartbeat aralığını bunun biraz altına ayarlamak (ör. `55m`) tüm istemi
yeniden önbelleğe almayı önleyebilir ve önbellek yazma maliyetlerini azaltabilir.

Çok ajanlı kurulumlarda, paylaşılan bir model config'i tutup önbellek davranışını
ajan başına `agents.list[].params.cacheRetention` ile ayarlayabilirsiniz.

Tüm ayarları tek tek açıklayan rehber için [Prompt Caching](/tr/reference/prompt-caching) belgesine bakın.

Anthropic API fiyatlandırmasında önbellek okumaları giriş token'larından çok daha ucuzdur,
önbellek yazmaları ise daha yüksek bir çarpanla faturalandırılır. En güncel ücretler ve TTL çarpanları için
Anthropic'in istem önbellekleme fiyatlandırmasına bakın:
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

### Örnek: ajan başına önbellek stratejili karışık trafik

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

`agents.list[].params`, seçili modelin `params` değeri üzerine birleştirilir; böylece
yalnızca `cacheRetention` değerini geçersiz kılıp diğer model varsayılanlarını değiştirmeden devralabilirsiniz.

### Örnek: Anthropic 1M bağlam beta başlığını etkinleştirme

Anthropic'in 1M bağlam penceresi şu anda beta kapısı arkasındadır. OpenClaw,
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

Bu yalnızca o model girdisinde `context1m: true` ayarlandığında uygulanır.

Gereksinim: kimlik bilgisinin uzun bağlam kullanımı için uygun olması gerekir. Değilse,
Anthropic bu istek için sağlayıcı taraflı hız sınırı hatası döndürür.

Anthropic kimlik doğrulamasını OAuth/abonelik token'larıyla (`sk-ant-oat-*`) yapıyorsanız,
OpenClaw `context-1m-*` beta başlığını atlar çünkü Anthropic şu anda bu birleşimi
HTTP 401 ile reddeder.

## Token baskısını azaltma ipuçları

- Uzun oturumları özetlemek için `/compact` kullanın.
- İş akışlarınızda büyük araç çıktıları kırpın.
- Ekran görüntüsü ağırlıklı oturumlarda `agents.defaults.imageMaxDimensionPx` değerini düşürün.
- Skill açıklamalarını kısa tutun (Skill listesi isteme eklenir).
- Ayrıntılı, keşif odaklı işler için daha küçük modelleri tercih edin.

Tam Skill listesi ek yük formülü için [Skills](/tr/tools/skills) belgesine bakın.

## İlgili

- [API kullanımı ve maliyetler](/tr/reference/api-usage-costs)
- [İstem önbellekleme](/tr/reference/prompt-caching)
- [Kullanım izleme](/tr/concepts/usage-tracking)
