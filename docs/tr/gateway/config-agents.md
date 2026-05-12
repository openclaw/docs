---
read_when:
    - Ajan varsayılanlarını ayarlama (modeller, düşünme, çalışma alanı, Heartbeat, medya, Skills)
    - Çok ajanlı yönlendirme ve bağlamaları yapılandırma
    - Oturum, mesaj teslimi ve konuşma modu davranışını ayarlama
summary: Ajan varsayılanları, çok ajanlı yönlendirme, oturum, mesajlar ve konuşma yapılandırması
title: Yapılandırma — ajanlar
x-i18n:
    generated_at: "2026-05-12T12:50:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 517aec30ff6c65a269c7e5c8baefb5dc371dabe52d4c38a47a41cae1a1a785e1
    source_path: gateway/config-agents.md
    workflow: 16
---

Ajan kapsamlı yapılandırma anahtarları `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` ve `talk.*` altındadır. Kanallar, araçlar, Gateway çalışma zamanı ve diğer
üst düzey anahtarlar için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) bölümüne bakın.

## Ajan varsayılanları

### `agents.defaults.workspace`

Varsayılan: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Sistem istemindeki Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmazsa OpenClaw, çalışma alanından yukarı doğru yürüyerek otomatik algılar.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` ayarlamayan ajanlar için isteğe bağlı varsayılan skill izin listesi.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather değerlerini devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
      { id: "locked-down", skills: [] }, // skill yok
    ],
  },
}
```

- Varsayılan olarak sınırsız skills için `agents.defaults.skills` öğesini atlayın.
- Varsayılanları devralmak için `agents.list[].skills` öğesini atlayın.
- Skill olmaması için `agents.list[].skills: []` olarak ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o ajan için nihai kümedir; varsayılanlarla birleştirilmez.

### `agents.defaults.skipBootstrap`

Çalışma alanı önyükleme dosyalarının (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) otomatik oluşturulmasını devre dışı bırakır.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Gerekli önyükleme dosyaları yazılmaya devam ederken seçili isteğe bağlı çalışma alanı dosyalarının oluşturulmasını atlar. Geçerli değerler: `SOUL.md`, `USER.md`, `HEARTBEAT.md` ve `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Çalışma alanı önyükleme dosyalarının sistem istemine ne zaman enjekte edileceğini denetler. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam turları (tamamlanmış bir asistan yanıtından sonra) çalışma alanı önyüklemesinin yeniden enjeksiyonunu atlayarak istem boyutunu azaltır. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler bağlamı yine yeniden oluşturur.
- `"never"`: her turda çalışma alanı önyüklemesini ve bağlam dosyası enjeksiyonunu devre dışı bırakır. Bunu yalnızca istem yaşam döngüsünün tamamına sahip olan ajanlar için kullanın (özel bağlam motorları, kendi bağlamını oluşturan yerel çalışma zamanları veya önyüklemesiz özel iş akışları). Heartbeat ve Compaction kurtarma turları da enjeksiyonu atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Kesme öncesinde çalışma alanı önyükleme dosyası başına en fazla karakter sayısı. Varsayılan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı önyükleme dosyaları genelinde enjekte edilen en fazla toplam karakter sayısı. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Önyükleme bağlamı kesildiğinde ajanın görebildiği sistem istemi bildirimini denetler.
Varsayılan: `"once"`.

- `"off"`: kesme bildirim metnini sistem istemine hiçbir zaman enjekte etme.
- `"once"`: benzersiz kesme imzası başına bir kez kısa bir bildirim enjekte et (önerilir).
- `"always"`: kesme bulunduğunda her çalıştırmada kısa bir bildirim enjekte et.

Ayrıntılı ham/enjekte edilmiş sayımlar ve yapılandırma ayarlama alanları, bağlam/durum raporları ve günlükler gibi tanılamalarda kalır; rutin WebChat kullanıcı/çalışma zamanı bağlamı yalnızca kısa kurtarma bildirimini alır.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw birden fazla yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar
bilerek tek bir genel düğmeden geçirmek yerine alt sisteme göre ayrılmıştır.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı önyükleme enjeksiyonu.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil tek seferlik sıfırlama/başlatma model çalıştırması başlangıcı. Yalın sohbet `/new` ve `/reset` komutları modeli çağırmadan onaylanır.
- `skills.limits.*`:
  sistem istemine enjekte edilen kompakt skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlandırılmış çalışma zamanı alıntıları ve enjekte edilen çalışma zamanına ait bloklar.
- `memory.qmd.limits.*`:
  dizinlenmiş bellek arama parçacığı ve enjeksiyon boyutlandırması.

Yalnızca bir ajan farklı bir bütçeye ihtiyaç duyduğunda eşleşen ajan başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Sıfırlama/başlatma model çalıştırmalarında enjekte edilen ilk tur başlatma başlangıcını denetler.
Yalın sohbet `/new` ve `/reset` komutları, modeli çağırmadan sıfırlamayı onaylar; bu nedenle bu başlangıcı yüklemezler.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Sınırlandırılmış çalışma zamanı bağlam yüzeyleri için paylaşılan varsayılanlar.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: kesme meta verileri ve devam bildirimi eklenmeden önce varsayılan `memory_get` alıntı sınırı.
- `memoryGetDefaultLines`: `lines` atlandığında varsayılan `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcı sonuçlar ve taşma kurtarması için kullanılan canlı araç sonucu sınırı.
- `postCompactionMaxChars`: Compaction sonrası yenileme enjeksiyonu sırasında kullanılan AGENTS.md alıntı sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` düğmeleri için ajan başına geçersiz kılma. Atlanan alanlar `agents.defaults.contextLimits` öğesinden devralınır.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Sistem istemine enjekte edilen kompakt skills listesi için genel sınır. Bu, `SKILL.md` dosyalarının gerektiğinde okunmasını etkilemez.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills istem bütçesi için ajan başına geçersiz kılma.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Sağlayıcı çağrılarından önce döküm/araç görüntü bloklarında en uzun görüntü kenarı için en fazla piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda görsel token kullanımını ve istek yükü boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Sistem istemi bağlamı için saat dilimi (mesaj zaman damgaları için değil). Ana makine saat dilimine geri döner.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Sistem istemindeki saat biçimi. Varsayılan: `auto` (işletim sistemi tercihi).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // genel varsayılan sağlayıcı parametreleri
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Dize biçimi yalnızca birincil modeli ayarlar.
  - Nesne biçimi, birincil modele ek olarak sıralı devretme modellerini ayarlar.
- `imageModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - `image` araç yolu tarafından görsel modeli yapılandırması olarak kullanılır.
  - Seçilen/varsayılan model görsel girdisini kabul edemediğinde yedek yönlendirme olarak da kullanılır.
  - Açık `provider/model` referanslarını tercih edin. Çıplak kimlikler uyumluluk için kabul edilir; çıplak bir kimlik `models.providers.*.models` içinde yapılandırılmış görsel destekli bir girişle benzersiz biçimde eşleşirse OpenClaw bunu o sağlayıcıyla niteler. Belirsiz yapılandırılmış eşleşmeler açık bir sağlayıcı ön eki gerektirir.
- `imageGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görsel oluşturma yeteneği ve görsel oluşturan gelecekteki herhangi bir araç/Plugin yüzeyi tarafından kullanılır.
  - Tipik değerler: yerel Gemini görsel oluşturma için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev`, OpenAI Images için `openai/gpt-image-2` veya şeffaf arka planlı OpenAI PNG/WebP çıktısı için `openai/gpt-image-1.5`.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Atlanırsa `image_generate` yine de kimlik doğrulaması destekli bir sağlayıcı varsayılanını çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kalan kayıtlı görsel oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
- `musicGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik oluşturma yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Atlanırsa `music_generate` yine de kimlik doğrulaması destekli bir sağlayıcı varsayılanını çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kalan kayıtlı müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video oluşturma yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa `video_generate` yine de kimlik doğrulaması destekli bir sağlayıcı varsayılanını çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kalan kayıtlı video oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Paketle gelen Qwen video oluşturma sağlayıcısı en fazla 1 çıktı videosunu, 1 girdi görselini, 4 girdi videosunu, 10 saniyelik süreyi ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirmesi için `pdf` aracı tarafından kullanılır.
  - Atlanırsa PDF aracı `imageModel` değerine, ardından çözümlenmiş oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı sırasında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyutu sınırı.
- `pdfMaxPages`: `pdf` aracındaki ayıklama yedek modunun değerlendirdiği varsayılan maksimum sayfa sayısı.
- `verboseDefault`: aracılar için varsayılan ayrıntılı çıktı düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `toolProgressDetail`: `/verbose` araç özetleri ve ilerleme taslağı araç satırları için ayrıntı modu. Değerler: `"explain"` (varsayılan, kompakt insan etiketleri) veya `"raw"` (varsa ham komutu/ayrıntıyı ekler). Aracı başına `agents.list[].toolProgressDetail` bu varsayılanı geçersiz kılar.
- `reasoningDefault`: aracılar için varsayılan akıl yürütme görünürlüğü. Değerler: `"off"`, `"on"`, `"stream"`. Aracı başına `agents.list[].reasoningDefault` bu varsayılanı geçersiz kılar. Yapılandırılmış akıl yürütme varsayılanları, mesaj başına veya oturum akıl yürütme geçersiz kılması ayarlanmadığında yalnızca sahipler, yetkilendirilmiş gönderenler veya operatör yöneticisi Gateway bağlamları için uygulanır.
- `elevatedDefault`: aracılar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (ör. OpenAI API anahtarı veya Codex OAuth erişimi için `openai/gpt-5.5`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, ardından tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner (kullanımı önerilmeyen uyumluluk davranışı; bu nedenle açık `provider/model` kullanmayı tercih edin). Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eski, kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcıya/modele geri döner.
- `models`: `/model` için yapılandırılmış model kataloğu ve izin listesi. Her giriş `alias` (kısayol) ve `params` (sağlayıcıya özgü; örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`) içerebilir.
  - Her model kimliğini elle listelemeden seçili sağlayıcılar için keşfedilen tüm modelleri göstermek üzere `"openai-codex/*": {}` veya `"vllm/*": {}` gibi `provider/*` girişleri kullanın.
  - Güvenli düzenlemeler: giriş eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçirmediğiniz sürece mevcut izin listesi girişlerini kaldıracak değiştirmeleri reddeder.
  - Sağlayıcı kapsamlı yapılandırma/ilk kurulum akışları, seçilen sağlayıcı modellerini bu haritaya birleştirir ve önceden yapılandırılmış ilgisiz sağlayıcıları korur.
  - Doğrudan OpenAI Responses modelleri için sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` eklemeyi durdurmak için `params.responsesServerCompaction: false`, eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI sunucu tarafı Compaction](/tr/providers/openai#server-side-compaction-responses-api).
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` içinde ayarlanır (ör. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (genel taban), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır; ardından `agents.list[].params` (eşleşen aracı kimliği) anahtar bazında geçersiz kılar. Ayrıntılar için bkz. [İstem Önbelleğe Alma](/tr/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu vekiller için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş geçiş JSON'u. Üretilen istek anahtarlarıyla çakışırsa ek gövde kazanır; yerel olmayan tamamlama rotaları yine de sonrasında yalnızca OpenAI'ye özgü `store` değerini çıkarır.
- `params.chat_template_kwargs`: vLLM/OpenAI uyumlu sohbet şablonu argümanları, üst düzey `api: "openai-completions"` istek gövdelerine birleştirilir. Düşünme kapalıyken `vllm/nemotron-3-*` için paketle gelen vLLM Plugin otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir; açık `chat_template_kwargs` üretilen varsayılanları geçersiz kılar ve `extra_body.chat_template_kwargs` yine nihai önceliğe sahiptir. vLLM Qwen düşünme denetimleri için o model girişinde `params.qwenThinkingFormat` değerini `"chat-template"` veya `"top-level"` olarak ayarlayın.
- `compat.thinkingFormat`: OpenAI uyumlu düşünme yükü stili. Qwen tarzı üst düzey `enable_thinking` için `"qwen"` veya vLLM gibi istek düzeyinde sohbet şablonu kwargs destekleyen Qwen ailesi arka uçlarda `chat_template_kwargs.enable_thinking` için `"qwen-chat-template"` kullanın. OpenClaw devre dışı bırakılmış düşünmeyi `false`, etkinleştirilmiş düşünmeyi `true` değerine eşler.
- `compat.supportedReasoningEfforts`: model başına OpenAI uyumlu akıl yürütme çabası listesi. Bunu gerçekten kabul eden özel uç noktalar için `"xhigh"` ekleyin; OpenClaw daha sonra bu yapılandırılmış sağlayıcı/model için komut menülerinde, Gateway oturum satırlarında, oturum yaması doğrulamasında, aracı CLI doğrulamasında ve `llm-task` doğrulamasında `/think xhigh` seçeneğini gösterir. Arka uç kanonik bir düzey için sağlayıcıya özgü bir değer istiyorsa `compat.reasoningEffortMap` kullanın.
- `params.preserveThinking`: korunmuş düşünme için yalnızca Z.AI'ye özgü katılım seçeneği. Etkinleştirildiğinde ve düşünme açık olduğunda OpenClaw `thinking.clear_thinking: false` gönderir ve önceki `reasoning_content` içeriğini yeniden yürütür; bkz. [Z.AI düşünme ve korunmuş düşünme](/tr/providers/zai#thinking-and-preserved-thinking).
- `localService`: yerel/kendi barındırılan model sunucuları için isteğe bağlı sağlayıcı düzeyinde süreç yöneticisi. Seçilen model bu sağlayıcıya ait olduğunda OpenClaw `healthUrl` değerini (veya `baseUrl + "/models"` değerini) yoklar, uç nokta kapalıysa `args` ile `command` komutunu başlatır, `readyTimeoutMs` süresine kadar bekler ve ardından model isteğini gönderir. `command` mutlak bir yol olmalıdır. `idleStopMs: 0`, süreçleri OpenClaw çıkana kadar canlı tutar; pozitif bir değer, OpenClaw tarafından başlatılan süreci bu kadar boşta geçen milisaniyeden sonra durdurur. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- Çalışma zamanı ilkesi `agents.defaults` üzerinde değil, sağlayıcılar veya modeller üzerinde yer alır. Sağlayıcı genelindeki kurallar için `models.providers.<provider>.agentRuntime`, modele özgü kurallar için `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` kullanın. Resmi OpenAI sağlayıcısındaki OpenAI aracı modelleri varsayılan olarak Codex'i seçer.
- Bu alanları değiştiren yapılandırma yazarları (örneğin `/models set`, `/models set-image` ve yedek ekleme/kaldırma komutları), kanonik nesne biçimini kaydeder ve mümkün olduğunda mevcut yedek listelerini korur.
- `maxConcurrent`: oturumlar genelinde maksimum paralel aracı çalışması (her oturum yine seri çalışır). Varsayılan: 4.

### Çalışma zamanı ilkesi

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, kayıtlı bir Plugin harness kimliği veya desteklenen bir CLI arka uç takma adı. Paketle gelen Codex Plugin `codex` kaydını yapar; paketle gelen Anthropic Plugin, `claude-cli` CLI arka ucunu sağlar.
- `id: "auto"`, kayıtlı Plugin harness'lerinin desteklenen dönüşleri üstlenmesine izin verir ve eşleşen harness yoksa PI kullanır. `id: "codex"` gibi açık bir Plugin çalışma zamanı bu harness'i gerektirir ve kullanılamıyorsa veya başarısız olursa kapalı şekilde başarısız olur.
- Tüm aracı çalışma zamanı anahtarları mirastır. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, oturum çalışma zamanı sabitlemeleri ve `OPENCLAW_AGENT_RUNTIME`, çalışma zamanı seçimi tarafından yok sayılır. Eski değerleri kaldırmak için `openclaw doctor --fix` çalıştırın.
- OpenAI aracı modelleri varsayılan olarak Codex harness'ini kullanır; bunu açık hale getirmek istediğinizde sağlayıcı/model `agentRuntime.id: "codex"` geçerli kalır.
- Claude CLI dağıtımları için `model: "anthropic/claude-opus-4-7"` ile model kapsamlı `agentRuntime.id: "claude-cli"` kullanmayı tercih edin. Eski `claude-cli/claude-opus-4-7` model referansları uyumluluk için çalışmaya devam eder, ancak yeni yapılandırma sağlayıcı/model seçimini kanonik tutmalı ve yürütme arka ucunu sağlayıcı/model çalışma zamanı ilkesine koymalıdır.
- Bu yalnızca metin aracı dönüşü yürütmesini denetler. Medya oluşturma, görsel işleme, PDF, müzik, video ve TTS yine kendi sağlayıcı/model ayarlarını kullanır.

**Yerleşik takma ad kısayolları** (yalnızca model `agents.defaults.models` içinde olduğunda uygulanır):

| Takma ad            | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Yapılandırılmış takma adlarınız her zaman varsayılanlara göre önceliklidir.

Z.AI GLM-4.x modelleri, siz `--thinking off` ayarlamadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece düşünme modunu otomatik olarak etkinleştirir.
Z.AI modelleri, araç çağrısı akışı için varsayılan olarak `tool_stream` özelliğini etkinleştirir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` düşünmeyi kullanır.

### `agents.defaults.cliBackends`

Yalnızca metin yedek çalıştırmaları için isteğe bağlı CLI arka uçları (araç çağrısı yok). API sağlayıcıları başarısız olduğunda yedek olarak kullanışlıdır.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI arka uçları metin önceliklidir; araçlar her zaman devre dışıdır.
- Oturumlar `sessionArg` ayarlandığında desteklenir.
- `imageArg` dosya yollarını kabul ettiğinde görsel geçişi desteklenir.
- `reseedFromRawTranscriptWhenUncompacted: true`, bir arka ucun ilk Compaction özeti mevcut olmadan önce sınırlı bir ham OpenClaw döküm kuyruğundan güvenli şekilde geçersiz kılınmış oturumları kurtarmasına izin verir. Kimlik doğrulama profili veya kimlik bilgisi dönemi değişiklikleri yine de hiçbir zaman ham yeniden tohumlama yapmaz.

### `agents.defaults.systemPromptOverride`

OpenClaw tarafından birleştirilen sistem isteminin tamamını sabit bir dizeyle değiştirin. Varsayılan düzeyde (`agents.defaults.systemPromptOverride`) veya ajan başına (`agents.list[].systemPromptOverride`) ayarlayın. Ajan başına değerler önceliklidir; boş veya yalnızca boşluk içeren değer yok sayılır. Kontrollü istem deneyleri için kullanışlıdır.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Model ailesine göre uygulanan sağlayıcıdan bağımsız istem katmanları. GPT-5 ailesi model kimlikleri, sağlayıcılar genelinde paylaşılan davranış sözleşmesini alır; `personality` yalnızca samimi etkileşim stili katmanını denetler.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (varsayılan) ve `"on"` samimi etkileşim stili katmanını etkinleştirir.
- `"off"` yalnızca samimi katmanı devre dışı bırakır; etiketlenmiş GPT-5 davranış sözleşmesi etkin kalır.
- Eski `plugins.entries.openai.config.personality`, bu paylaşılan ayar yapılmadığında hâlâ okunur.

### `agents.defaults.heartbeat`

Periyodik Heartbeat çalıştırmaları.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: süre dizesi (ms/s/m/h). Varsayılan: `30m` (API anahtarı kimlik doğrulaması) veya `1h` (OAuth kimlik doğrulaması). Devre dışı bırakmak için `0m` olarak ayarlayın.
- `includeSystemPromptSection`: false olduğunda, Heartbeat bölümünü sistem isteminden çıkarır ve `HEARTBEAT.md` öğesinin önyükleme bağlamına eklenmesini atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda, Heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.
- `timeoutSeconds`: bir Heartbeat ajan turu iptal edilmeden önce izin verilen azami süre (saniye cinsinden). `agents.defaults.timeoutSeconds` kullanmak için ayarlamayın.
- `directPolicy`: doğrudan/DM teslim politikası. `allow` (varsayılan) doğrudan hedefe teslimata izin verir. `block` doğrudan hedefe teslimatı bastırır ve `reason=dm-blocked` yayar.
- `lightContext`: true olduğunda, Heartbeat çalıştırmaları hafif önyükleme bağlamı kullanır ve çalışma alanı önyükleme dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her Heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım deseni. Heartbeat başına token maliyetini yaklaşık 100K'den yaklaşık 2-5K tokene düşürür.
- `skipWhenBusy`: true olduğunda, Heartbeat çalıştırmaları ek meşgul hatlarda ertelenir: alt ajan veya iç içe komut işi. Cron hatları, bu bayrak olmadan bile Heartbeat'leri her zaman erteler.
- Ajan başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir ajan `heartbeat` tanımladığında, **yalnızca bu ajanlar** Heartbeat çalıştırır.
- Heartbeat'ler tam ajan turları çalıştırır; daha kısa aralıklar daha fazla token tüketir.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` veya `safeguard` (uzun geçmişler için parçalı özetleme). Bkz. [Compaction](/tr/concepts/compaction).
- `provider`: kayıtlı bir Compaction sağlayıcı Plugin'inin kimliği. Ayarlandığında, yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` işlevi çağrılır. Başarısız olursa yerleşik olana geri döner. Bir sağlayıcı ayarlamak `mode: "safeguard"` değerini zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw iptal etmeden önce tek bir Compaction işlemi için izin verilen azami saniye. Varsayılan: `900`.
- `keepRecentTokens`: en yeni döküm kuyruğunu birebir tutmak için Pi kesme noktası bütçesi. Manuel `/compact`, açıkça ayarlandığında buna uyar; aksi takdirde manuel Compaction sert bir kontrol noktasıdır.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, Compaction özetlemesi sırasında yerleşik opak tanımlayıcı koruma rehberliğini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: safeguard özetleri için hatalı biçimlendirilmiş çıktı durumunda yeniden deneme kontrolleri. Safeguard modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` ayarlayın.
- `midTurnPrecheck`: isteğe bağlı Pi araç döngüsü baskısı kontrolü. `enabled: true` olduğunda OpenClaw, araç sonuçları eklendikten sonra ve sonraki model çağrısından önce bağlam baskısını denetler. Bağlam artık sığmıyorsa, istemi göndermeden önce mevcut denemeyi iptal eder ve araç sonuçlarını kırpmak veya Compaction yapıp yeniden denemek için mevcut ön kontrol kurtarma yolunu yeniden kullanır. Hem `default` hem de `safeguard` Compaction modlarıyla çalışır. Varsayılan: devre dışı.
- `postCompactionSections`: Compaction sonrasında yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Varsayılan olarak `["Session Startup", "Red Lines"]`; yeniden enjeksiyonu devre dışı bırakmak için `[]` ayarlayın. Ayarlanmamışsa veya açıkça bu varsayılan çift olarak ayarlanmışsa, eski `Every Session`/`Safety` başlıkları da geriye dönük uyumluluk yedeği olarak kabul edilir.
- `model`: yalnızca Compaction özetlemesi için isteğe bağlı `provider/model-id` geçersiz kılması. Ana oturumun bir modeli koruması, ancak Compaction özetlerinin başka bir modelde çalışması gerektiğinde bunu kullanın; ayarlanmadığında Compaction oturumun birincil modelini kullanır.
- `maxActiveTranscriptBytes`: etkin JSONL eşiği aştığında bir çalıştırmadan önce normal yerel Compaction'ı tetikleyen isteğe bağlı bayt eşiği (`number` veya `"20mb"` gibi dizeler). Başarılı Compaction'ın daha küçük bir ardıl döküme dönebilmesi için `truncateAfterCompaction` gerektirir. Ayarlanmadığında veya `0` olduğunda devre dışıdır.
- `notifyUser`: `true` olduğunda, Compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin, "Bağlam sıkıştırılıyor..." ve "Compaction tamamlandı"). Compaction'ı sessiz tutmak için varsayılan olarak devre dışıdır.
- `memoryFlush`: kalıcı anıları saklamak için otomatik Compaction öncesinde sessiz ajansal tur. Bu bakım turunun yerel bir modelde kalması gerektiğinde `model` değerini `ollama/qwen3:8b` gibi tam bir sağlayıcı/model olarak ayarlayın; geçersiz kılma etkin oturum geri dönüş zincirini devralmaz. Çalışma alanı salt okunur olduğunda atlanır.

### `agents.defaults.runRetries`

Hata kurtarma sırasında sonsuz yürütme döngülerini önlemek için gömülü Pi çalıştırıcısına yönelik dış çalıştırma döngüsü yeniden deneme yineleme sınırları. Bu ayarın şu anda ACP veya CLI çalışma zamanlarına değil, yalnızca gömülü ajan çalışma zamanına uygulandığını unutmayın.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: dış çalıştırma döngüsü için temel çalıştırma yeniden deneme yineleme sayısı. Varsayılan: `24`.
- `perProfile`: her geri dönüş profili adayı başına verilen ek çalıştırma yeniden deneme yinelemesi. Varsayılan: `8`.
- `min`: çalıştırma yeniden deneme yinelemeleri için asgari mutlak sınır. Varsayılan: `32`.
- `max`: kontrolden çıkan yürütmeyi önlemek için çalıştırma yeniden deneme yinelemeleri için azami mutlak sınır. Varsayılan: `160`.

### `agents.defaults.contextPruning`

LLM'ye göndermeden önce bellek içi bağlamdan **eski araç sonuçlarını** budar. Diskteki oturum geçmişini **değiştirmez**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` budama geçişlerini etkinleştirir.
- `ttl`, budamanın ne sıklıkla yeniden çalışabileceğini denetler (son önbellek dokunuşundan sonra).
- Budama önce aşırı büyük araç sonuçlarını yumuşak kırpar, ardından gerekirse daha eski araç sonuçlarını sert temizler.

**Yumuşak kırpma** başlangıcı + sonu korur ve ortaya `...` ekler.

**Sert temizleme** tüm araç sonucunu yer tutucuyla değiştirir.

Notlar:

- Görsel blokları hiçbir zaman kırpılmaz/temizlenmez.
- Oranlar karakter tabanlıdır (yaklaşık), kesin belirteç sayıları değildir.
- `keepLastAssistants` değerinden daha az asistan mesajı varsa budama atlanır.

</Accordion>

Davranış ayrıntıları için [Oturum Budama](/tr/concepts/session-pruning) bölümüne bakın.

### Blok akışı

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram dışındaki kanallar, blok yanıtları etkinleştirmek için açıkça `*.blockStreaming: true` gerektirir.
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına değişkenler). Signal/Slack/Discord/Google Chat varsayılanı `minChars: 1500`.
- `humanDelay`: blok yanıtlar arasında rastgele duraklama. `natural` = 800–2500ms. Ajan başına geçersiz kılma: `agents.list[].humanDelay`.

Davranış + parçalama ayrıntıları için [Akış](/tr/concepts/streaming) bölümüne bakın.

### Yazıyor göstergeleri

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Varsayılanlar: doğrudan sohbetler/bahsetmeler için `instant`, bahsedilmeyen grup sohbetleri için `message`.
- Oturum başına geçersiz kılmalar: `session.typingMode`, `session.typingIntervalSeconds`.

[Yazıyor Göstergeleri](/tr/concepts/typing-indicators) bölümüne bakın.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Yerleşik ajan için isteğe bağlı sandbox kullanımı. Tam kılavuz için [Sandbox Kullanımı](/tr/gateway/sandboxing) bölümüne bakın.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**Arka uç:**

- `docker`: yerel Docker çalışma zamanı (varsayılan)
- `ssh`: genel SSH destekli uzak çalışma zamanı
- `openshell`: OpenShell çalışma zamanı

`backend: "openshell"` seçildiğinde, çalışma zamanına özgü ayarlar
`plugins.entries.openshell.config` konumuna taşınır.

**SSH arka uç yapılandırması:**

- `target`: `user@host[:port]` biçiminde SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam başına çalışma alanları için kullanılan mutlak uzak kök
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH'ye geçirilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw'ın çalışma zamanında geçici dosyalara materyalize ettiği satır içi içerikler veya SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ana makine anahtarı politikası ayar düğmeleri

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` üzerinde önceliklidir
- `certificateData`, `certificateFile` üzerinde önceliklidir
- `knownHostsData`, `knownHostsFile` üzerinde önceliklidir
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce etkin gizli değerler çalışma zamanı anlık görüntüsünden çözümlenir

**SSH arka uç davranışı:**

- oluşturma veya yeniden oluşturma sonrasında uzak çalışma alanını bir kez tohumlar
- ardından uzak SSH çalışma alanını kanonik tutar
- `exec`, dosya araçları ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri ana makineye otomatik olarak geri eşitlemez
- sandbox tarayıcı kapsayıcılarını desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox çalışma alanı
- `ro`: `/workspace` konumunda sandbox çalışma alanı, `/agent` konumunda salt okunur bağlanmış ajan çalışma alanı
- `rw`: `/workspace` konumunda okuma/yazma olarak bağlanmış ajan çalışma alanı

**Kapsam:**

- `session`: oturum başına kapsayıcı + çalışma alanı
- `agent`: ajan başına bir kapsayıcı + çalışma alanı (varsayılan)
- `shared`: paylaşılan kapsayıcı ve çalışma alanı (oturumlar arası yalıtım yok)

**OpenShell Plugin yapılandırması:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell modu:**

- `mirror`: exec öncesinde uzağı yerelden tohumla, exec sonrasında geri eşitle; yerel çalışma alanı kanonik kalır
- `remote`: sandbox oluşturulduğunda uzağı bir kez tohumla, ardından uzak çalışma alanını kanonik tut

`remote` modunda, OpenClaw dışında yapılan ana makine-yerel düzenlemeler tohumlama adımından sonra sandbox içine otomatik olarak eşitlenmez.
Aktarım, OpenShell sandbox içine SSH ile yapılır; ancak sandbox yaşam döngüsünün ve isteğe bağlı ayna eşitlemenin sahibi Plugin'dir.

**`setupCommand`** kapsayıcı oluşturulduktan sonra bir kez çalışır (`sh -lc` aracılığıyla). Ağ çıkışı, yazılabilir kök ve root kullanıcı gerektirir.

**Kapsayıcıların varsayılanı `network: "none"`** — ajan dışarı erişime ihtiyaç duyuyorsa `"bridge"` (veya özel bir köprü ağı) olarak ayarlayın.
`"host"` engellenir. `"container:<id>"`, açıkça
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (son çare) ayarlamadığınız sürece varsayılan olarak engellenir.

**Gelen ekler**, etkin çalışma alanında `media/inbound/*` içine yerleştirilir.

**`docker.binds`** ek ana makine dizinlerini bağlar; genel ve ajan başına bağlamalar birleştirilir.

**Sandbox'lı tarayıcı** (`sandbox.browser.enabled`): bir kapsayıcı içinde Chromium + CDP. noVNC URL'si sistem istemine enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulaması kullanır ve OpenClaw, parolayı paylaşılan URL'de açığa çıkarmak yerine kısa ömürlü bir belirteç URL'si yayar.

- `allowHostControl: false` (varsayılan), sandbox'lı oturumların ana makine tarayıcısını hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` olur (ayrılmış köprü ağı). Yalnızca genel köprü bağlantısını açıkça istediğinizde `bridge` olarak ayarlayın.
- `cdpSourceRange`, kapsayıcı kenarında CDP girişini isteğe bağlı olarak bir CIDR aralığıyla sınırlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek ana makine dizinlerini yalnızca sandbox tarayıcı kapsayıcısına bağlar. Ayarlandığında (`[]` dahil), tarayıcı kapsayıcısı için `docker.binds` değerinin yerini alır.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlanır ve kapsayıcı ana makineleri için ayarlanmıştır:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (varsayılan olarak etkin)
  - `--disable-3d-apis`, `--disable-software-rasterizer` ve `--disable-gpu`
    varsayılan olarak etkindir ve WebGL/3D kullanımı gerektiriyorsa
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ile devre dışı bırakılabilir.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`, iş akışınız
    bunlara bağlıysa uzantıları yeniden etkinleştirir.
  - `--renderer-process-limit=2`,
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium'un
    varsayılan işlem sınırını kullanmak için `0` olarak ayarlayın.
  - ayrıca `noSandbox` etkin olduğunda `--no-sandbox`.
  - Varsayılanlar kapsayıcı imajı temelidir; kapsayıcı varsayılanlarını değiştirmek için özel
    giriş noktasına sahip özel bir tarayıcı imajı kullanın.

</Accordion>

Tarayıcı sandbox kullanımı ve `sandbox.docker.binds` yalnızca Docker'a özeldir.

İmajları oluşturun (kaynak checkout'tan):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Kaynak checkout olmadan npm kurulumları için, satır içi `docker build` komutları için [Sandbox Kullanımı § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

### `agents.list` (ajan başına geçersiz kılmalar)

Bir aracıya kendi TTS sağlayıcısını, sesini, modelini,
stilini veya otomatik TTS modunu vermek için `agents.list[].tts` kullanın. Aracı bloğu, genel
`messages.tts` üzerine derin birleştirme uygular; böylece paylaşılan kimlik bilgileri tek bir yerde kalırken tek tek
aracılar yalnızca ihtiyaç duydukları ses veya sağlayıcı alanlarını geçersiz kılar. Etkin aracının
geçersiz kılması otomatik sesli yanıtlara, `/tts audio`, `/tts status` ve
`tts` aracı aracına uygulanır. Sağlayıcı örnekleri ve öncelik sırası için [Metinden konuşmaya](/tr/tools/tts#per-agent-voice-overrides)
bölümüne bakın.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: kararlı aracı kimliği (zorunlu).
- `default`: birden fazla ayarlandığında ilk olan kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa, ilk liste girdisi varsayılan olur.
- `model`: dize biçimi, model geri dönüşü olmayan katı bir aracı başına birincil model ayarlar; nesne biçimi `{ primary }` de `fallbacks` eklemediğiniz sürece katıdır. O aracıyı geri dönüşe dahil etmek için `{ primary, fallbacks: [...] }` veya katı davranışı açık hale getirmek için `{ primary, fallbacks: [] }` kullanın. Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamadığınız sürece varsayılan geri dönüşleri yine de devralır.
- `params`: `agents.defaults.models` içindeki seçili model girdisinin üzerine birleştirilen aracı başına akış parametreleri. Tüm model kataloğunu yinelemeden `cacheRetention`, `temperature` veya `maxTokens` gibi aracıya özgü geçersiz kılmalar için bunu kullanın.
- `tts`: isteğe bağlı aracı başına metinden konuşmaya geçersiz kılmaları. Blok, `messages.tts` üzerine derin birleştirme uygular; bu nedenle paylaşılan sağlayıcı kimlik bilgilerini ve geri dönüş politikasını `messages.tts` içinde tutun ve burada yalnızca sağlayıcı, ses, model, stil veya otomatik mod gibi kişiye özgü değerleri ayarlayın.
- `skills`: isteğe bağlı aracı başına Skills izin listesi. Atlanırsa aracı, ayarlandığında `agents.defaults.skills` değerini devralır; açık bir liste varsayılanlarla birleştirmek yerine onların yerini alır ve `[]` beceri olmadığı anlamına gelir.
- `thinkingDefault`: isteğe bağlı aracı başına varsayılan düşünme düzeyi (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mesaj başına veya oturum geçersiz kılması ayarlanmadığında bu aracı için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Seçili sağlayıcı/model profili hangi değerlerin geçerli olduğunu kontrol eder; Google Gemini için `adaptive`, sağlayıcının sahip olduğu dinamik düşünmeyi korur (Gemini 3/3.1 üzerinde `thinkingLevel` atlanır, Gemini 2.5 üzerinde `thinkingBudget: -1`).
- `reasoningDefault`: isteğe bağlı aracı başına varsayılan akıl yürütme görünürlüğü (`on | off | stream`). Mesaj başına veya oturum akıl yürütme geçersiz kılması ayarlanmadığında bu aracı için `agents.defaults.reasoningDefault` değerini geçersiz kılar.
- `fastModeDefault`: hızlı mod için isteğe bağlı aracı başına varsayılan (`true | false`). Mesaj başına veya oturum hızlı mod geçersiz kılması ayarlanmadığında uygulanır.
- `models`: tam `provider/model` kimliklerine göre anahtarlanan isteğe bağlı aracı başına model kataloğu/çalışma zamanı geçersiz kılmaları. Aracı başına çalışma zamanı istisnaları için `models["provider/model"].agentRuntime` kullanın.
- `runtime`: isteğe bağlı aracı başına çalışma zamanı tanımlayıcısı. Aracı varsayılan olarak ACP koşum oturumlarını kullanmalıysa `runtime.acp` varsayılanlarıyla (`agent`, `backend`, `mode`, `cwd`) birlikte `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göreli yol, `http(s)` URL'si veya `data:` URI'si.
- `identity` varsayılanları türetir: `emoji` değerinden `ackReaction`, `name`/`emoji` değerinden `mentionPatterns`.
- `subagents.allowAgents`: açık `sessions_spawn.agentId` hedefleri için aracı kimliklerinin izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı aracı). Kendini hedefleyen `agentId` çağrılarına izin verilecekse istekte bulunan kimliği dahil edin.
- Korumalı alan devralma koruması: istekte bulunan oturum korumalı alandaysa `sessions_spawn`, korumasız çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda, `agentId` değerini atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar; varsayılan: false).

---

## Çok aracılı yönlendirme

Tek bir Gateway içinde birden fazla yalıtılmış aracı çalıştırın. [Çok Aracılı](/tr/concepts/multi-agent) bölümüne bakın.

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Bağlama eşleşme alanları

- `type` (isteğe bağlı): normal yönlendirme için `route` (eksik tür varsayılan olarak route olur), kalıcı ACP konuşma bağlamaları için `acp`.
- `match.channel` (zorunlu)
- `match.accountId` (isteğe bağlı; `*` = herhangi bir hesap; atlanırsa = varsayılan hesap)
- `match.peer` (isteğe bağlı; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özgü)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Belirleyici eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam eşleşme, peer/guild/team yok)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan aracı

Her kademede, eşleşen ilk `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw, tam konuşma kimliğine göre (`match.channel` + hesap + `match.peer.id`) çözümler ve yukarıdaki rota bağlama kademe sırasını kullanmaz.

### Aracı başına erişim profilleri

<Accordion title="Tam erişim (korumalı alan yok)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Salt okunur araçlar + çalışma alanı">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Dosya sistemi erişimi yok (yalnızca mesajlaşma)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Öncelik ayrıntıları için [Çok Aracılı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

---

## Oturum

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Oturum alanı ayrıntıları">

- **`scope`**: grup sohbeti bağlamları için temel oturum gruplama stratejisi.
  - `per-sender` (varsayılan): her gönderen, bir kanal bağlamı içinde yalıtılmış bir oturum alır.
  - `global`: bir kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam amaçlandığında kullanın).
- **`dmScope`**: DM'lerin nasıl gruplandığı.
  - `main`: tüm DM'ler ana oturumu paylaşır.
  - `per-peer`: kanallar genelinde gönderen kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderen başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderen başına yalıtır (çok hesaplı kullanım için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kanonik kimlikleri provider önekli eşlerle eşler. `/dock_discord` gibi Dock komutları, etkin oturumun yanıt rotasını başka bir bağlı kanal eşine geçirmek için aynı eşlemeyi kullanır; bkz. [Kanal sabitleme](/tr/concepts/channel-docking).
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saatte `atHour` zamanında sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. İkisi de yapılandırıldığında, hangisinin süresi önce dolarsa o kazanır. Günlük sıfırlama güncelliği oturum satırının `sessionStartedAt` değerini kullanır; boşta sıfırlama güncelliği `lastInteractionAt` değerini kullanır. Heartbeat, cron uyandırmaları, exec bildirimleri ve gateway muhasebesi gibi arka plan/sistem olayı yazımları `updatedAt` değerini güncelleyebilir, ancak günlük/boşta oturumları güncel tutmaz.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`mainKey`**: eski alan. Runtime, ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: ajandan ajana alışverişler sırasında ajanlar arasındaki en fazla karşılıklı yanıt turu (tam sayı, aralık: `0`-`20`, varsayılan: `5`). `0`, ping-pong zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleştir. İlk reddetme kazanır.
- **`maintenance`**: oturum deposu temizliği + saklama denetimleri.
  - `mode`: `warn` yalnızca uyarılar yayınlar; `enforce` temizliği uygular.
  - `pruneAfter`: eski girdiler için yaş eşiği (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki en fazla girdi sayısı (varsayılan `500`). Runtime, üretim boyutundaki sınırlar için küçük bir yüksek su tamponuyla toplu temizlik yazar; `openclaw sessions cleanup --enforce` sınırı hemen uygular.
  - `rotateBytes`: kullanımdan kaldırıldı ve yok sayılır; `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.
  - `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama. Varsayılan olarak `pruneAfter` kullanılır; devre dışı bırakmak için `false` olarak ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturum dizini disk bütçesi. `warn` modunda uyarıları günlüğe yazar; `enforce` modunda önce en eski yapıtları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonra isteğe bağlı hedef. Varsayılan, `maxDiskBytes` değerinin `%80`'idir.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (provider'lar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan hareketsizlikte otomatik odak kaldırma (`0` devre dışı bırakır; provider'lar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan katı maksimum yaş (`0` devre dışı bırakır; provider'lar geçersiz kılabilir)
  - `spawnSessions`: `sessions_spawn` ve ACP iş parçacığı başlatmalarından iş parçacığına bağlı çalışma oturumları oluşturmak için varsayılan kapı. İş parçacığı bağlamaları etkin olduğunda varsayılan olarak `true`; provider'lar/hesaplar geçersiz kılabilir.
  - `defaultSpawnContext`: iş parçacığına bağlı başlatmalar için varsayılan yerel alt ajan bağlamı (`"fork"` veya `"isolated"`). Varsayılan `"fork"`.

</Accordion>

---

## Mesajlar

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Yanıt öneki

Kanal/hesap başına geçersiz kılmalar: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Çözümleme (en özeli kazanır): hesap → kanal → genel. `""` devre dışı bırakır ve basamaklamayı durdurur. `"auto"`, `[{identity.name}]` değerini türetir.

**Şablon değişkenleri:**

| Değişken          | Açıklama            | Örnek                       |
| ----------------- | ------------------- | --------------------------- |
| `{model}`         | Kısa model adı      | `claude-opus-4-6`           |
| `{modelFull}`     | Tam model tanımlayıcısı | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider adı        | `anthropic`                 |
| `{thinkingLevel}` | Geçerli düşünme düzeyi | `high`, `low`, `off`        |
| `{identity.name}` | Ajan kimlik adı     | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarsızdır. `{think}`, `{thinkingLevel}` için bir takma addır.

### Ack tepkisi

- Varsayılan olarak etkin ajanın `identity.emoji` değeri, yoksa `"👀"` kullanılır. Devre dışı bırakmak için `""` olarak ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik yedeği.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram, WhatsApp ve iMessage gibi tepki destekleyen kanallarda yanıttan sonra ack'i kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord ve Telegram üzerinde yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord üzerinde, ayarlanmamışsa ack tepkileri etkin olduğunda durum tepkileri etkin kalır.
  Telegram üzerinde, yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` olarak ayarlayın.

### Gelen debounce

Aynı gönderenden hızlı gelen yalnızca metin mesajlarını tek bir ajan turunda toplar. Medya/ekler hemen flush edilir. Denetim komutları debouncing'i atlar.

### TTS (metinden konuşmaya)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto`, varsayılan otomatik TTS modunu denetler: `off`, `always`, `inbound` veya `tagged`. `/tts on|off` yerel tercihleri geçersiz kılabilir ve `/tts status` etkin durumu gösterir.
- `summaryModel`, otomatik özet için `agents.defaults.model.primary` değerini geçersiz kılar.
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılan olarak `false` değerindedir (katılım gerektirir).
- API anahtarları `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine geri döner.
- Paketle gelen konuşma provider'ları Plugin'e aittir. `plugins.allow` ayarlanmışsa, kullanmak istediğiniz her TTS provider Plugin'ini ekleyin; örneğin Edge TTS için `microsoft`. Eski `edge` provider kimliği, `microsoft` için takma ad olarak kabul edilir.
- `providers.openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası yapılandırma, ardından `OPENAI_TTS_BASE_URL`, ardından `https://api.openai.com/v1` şeklindedir.
- `providers.openai.baseUrl` OpenAI olmayan bir uç noktaya işaret ettiğinde, OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak ele alır ve model/ses doğrulamasını gevşetir.

---

## Talk

Talk modu (macOS/iOS/Android) için varsayılanlar.

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- Birden çok Talk provider'ı yapılandırıldığında `talk.provider`, `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Talk anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir. Kalıcı yapılandırmayı `talk.providers.<provider>` içine yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- Ses kimlikleri `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerlerine geri döner.
- `providers.*.apiKey`, düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` yedeği yalnızca Talk API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Talk yönergelerinin kolay adlar kullanmasına izin verir.
- `providers.mlx.modelId`, macOS local MLX yardımcısı tarafından kullanılan Hugging Face deposunu seçer. Atlanırsa macOS `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatma, mevcut olduğunda paketle gelen `openclaw-mlx-tts` yardımcısı üzerinden veya `PATH` üzerindeki bir yürütülebilir dosya üzerinden çalışır; `OPENCLAW_MLX_TTS_BIN`, geliştirme için yardımcı yolunu geçersiz kılar.
- `consultThinkingLevel`, Control UI Talk realtime `openclaw_agent_consult` çağrılarının arkasındaki tam OpenClaw ajan çalıştırması için düşünme düzeyini denetler. Normal oturum/model davranışını korumak için ayarlamadan bırakın.
- `consultFastMode`, oturumun normal hızlı mod ayarını değiştirmeden Control UI Talk realtime danışmaları için tek seferlik bir hızlı mod geçersiz kılması ayarlar.
- `speechLocale`, iOS/macOS Talk konuşma tanıma tarafından kullanılan BCP 47 yerel ayar kimliğini belirler. Cihaz varsayılanını kullanmak için ayarlamadan bırakın.
- `silenceTimeoutMs`, Talk modunun dökümü göndermeden önce kullanıcı sessizliğinden sonra ne kadar bekleyeceğini denetler. Ayarlanmamışsa platform varsayılan duraklama penceresi korunur (`macOS ve Android'de 700 ms, iOS'te 900 ms`).
- `realtime.instructions`, provider'a yönelik sistem yönergelerini OpenClaw'ın yerleşik realtime istemine ekler; böylece varsayılan `openclaw_agent_consult` rehberliği kaybedilmeden ses stili yapılandırılabilir.

---

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference) — diğer tüm yapılandırma anahtarları
- [Yapılandırma](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
