---
read_when:
    - Agent varsayılanlarını ayarlama (modeller, düşünme, çalışma alanı, Heartbeat, medya, Skills)
    - Çok ajanlı yönlendirmeyi ve bağlamaları yapılandırma
    - Oturum, ileti teslimi ve konuşma modu davranışını ayarlama
summary: Ajan varsayılanları, çoklu ajan yönlendirmesi, oturum, mesajlar ve talk yapılandırması
title: Yapılandırma — aracılar
x-i18n:
    generated_at: "2026-05-06T09:12:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b864cc3985db2f3ab2e82b18bcd1b1590a387d7474f5f0d0da3a1d36d9a276b9
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*` ve `talk.*` altındaki ajan kapsamlı yapılandırma anahtarları. Kanallar, araçlar, Gateway çalışma zamanı ve diğer
üst düzey anahtarlar için bkz. [Yapılandırma referansı](/tr/gateway/configuration-reference).

## Ajan varsayılanları

### `agents.defaults.workspace`

Varsayılan: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Sistem isteminin Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmamışsa OpenClaw, çalışma alanından yukarı doğru yürüyerek otomatik algılar.

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
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Varsayılan olarak sınırsız skills için `agents.defaults.skills` alanını atlayın.
- Varsayılanları devralmak için `agents.list[].skills` alanını atlayın.
- Hiç skills olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o ajan için son kümedir; varsayılanlarla birleştirilmez.

### `agents.defaults.skipBootstrap`

Çalışma alanı bootstrap dosyalarının (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) otomatik oluşturulmasını devre dışı bırakır.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Gerekli bootstrap dosyalarını yazmaya devam ederken seçili isteğe bağlı çalışma alanı dosyalarının oluşturulmasını atlar. Geçerli değerler: `SOUL.md`, `USER.md`, `HEARTBEAT.md` ve `IDENTITY.md`.

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

Çalışma alanı bootstrap dosyalarının sistem istemine ne zaman ekleneceğini denetler. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam dönüşleri (tamamlanmış bir assistant yanıtından sonra) çalışma alanı bootstrap yeniden eklemesini atlayarak istem boyutunu azaltır. Heartbeat çalışmaları ve Compaction sonrası yeniden denemeler yine de bağlamı yeniden oluşturur.
- `"never"`: her dönüşte çalışma alanı bootstrap ve bağlam dosyası eklemesini devre dışı bırakır. Bunu yalnızca istem yaşam döngüsünün tümüne sahip ajanlar için kullanın (özel bağlam motorları, kendi bağlamını oluşturan yerel çalışma zamanları veya bootstrap gerektirmeyen özel iş akışları). Heartbeat ve Compaction kurtarma dönüşleri de eklemeyi atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Kesmeden önce çalışma alanı bootstrap dosyası başına en fazla karakter sayısı. Varsayılan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı bootstrap dosyaları genelinde eklenecek en fazla toplam karakter sayısı. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bootstrap bağlamı kesildiğinde ajanın görebileceği sistem istemi bildirimini denetler.
Varsayılan: `"once"`.

- `"off"`: sistem istemine hiçbir zaman kesme bildirimi metni ekleme.
- `"once"`: benzersiz kesme imzası başına bir kez kısa bir bildirim ekle (önerilir).
- `"always"`: kesme varsa her çalıştırmada kısa bir bildirim ekle.

Ayrıntılı ham/eklenen sayımlar ve yapılandırma ayarlama alanları, bağlam/durum raporları ve günlükler gibi tanılarda kalır; rutin WebChat kullanıcı/çalışma zamanı bağlamı yalnızca kısa kurtarma bildirimini alır.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw birden çok yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar kasıtlı olarak tek bir genel düğmeden akmak yerine alt sisteme göre ayrılır.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı bootstrap eklemesi.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil tek seferlik sıfırlama/başlangıç model çalıştırma ön bölümü. Yalın sohbet `/new` ve `/reset` komutları modeli çağırmadan onaylanır.
- `skills.limits.*`:
  sistem istemine eklenen kompakt skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve eklenen çalışma zamanı sahipli bloklar.
- `memory.qmd.limits.*`:
  dizinlenmiş bellek arama parçacığı ve ekleme boyutlandırması.

Yalnızca bir ajanın farklı bir bütçeye ihtiyacı olduğunda eşleşen ajan başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Sıfırlama/başlangıç model çalıştırmalarında eklenen ilk dönüş başlangıç ön bölümünü denetler.
Yalın sohbet `/new` ve `/reset` komutları, modeli çağırmadan sıfırlamayı onaylar; bu nedenle bu ön bölümü yüklemezler.

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

Sınırlı çalışma zamanı bağlam yüzeyleri için paylaşılan varsayılanlar.

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
- `postCompactionMaxChars`: Compaction sonrası yenileme eklemesi sırasında kullanılan AGENTS.md alıntı sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` düğmeleri için ajan başına geçersiz kılma. Atlanan alanlar `agents.defaults.contextLimits` değerlerinden devralınır.

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

Sistem istemine eklenen kompakt skills listesi için genel sınır. Bu, istendiğinde `SKILL.md` dosyalarını okumayı etkilemez.

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

Sağlayıcı çağrılarından önce transcript/araç görsel bloklarında en uzun görsel kenarı için en büyük piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision-token kullanımını ve istek yükü boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Sistem istemi bağlamı için saat dilimi (ileti zaman damgaları değil). Ana makine saat dilimine geri döner.

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
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
      },
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
  - Nesne biçimi birincil modeli ve sıralı yük devretme modellerini ayarlar.
- `imageModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - `image` araç yolu tarafından görüntü modeli yapılandırması olarak kullanılır.
  - Seçili/varsayılan model görsel girdiyi kabul edemediğinde yedek yönlendirme olarak da kullanılır.
  - Açık `provider/model` başvurularını tercih edin. Yalın ID'ler uyumluluk için kabul edilir; yalın bir ID, `models.providers.*.models` içinde yapılandırılmış, görsel destekli tek bir girişle benzersiz olarak eşleşirse OpenClaw bunu ilgili sağlayıcıyla niteler. Belirsiz yapılandırılmış eşleşmeler açık bir sağlayıcı ön eki gerektirir.
- `imageGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görsel oluşturma yeteneği ve görsel oluşturan gelecekteki tüm araç/Plugin yüzeyleri tarafından kullanılır.
  - Tipik değerler: yerel Gemini görsel oluşturma için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev`, OpenAI Images için `openai/gpt-image-2` veya şeffaf arka planlı OpenAI PNG/WebP çıktısı için `openai/gpt-image-1.5`.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kalan kayıtlı görsel oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
- `musicGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik oluşturma yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kalan kayıtlı müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video oluşturma yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra kalan kayıtlı video oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Paketle gelen Qwen video oluşturma sağlayıcısı en fazla 1 çıktı videosu, 1 girdi görseli, 4 girdi videosu, 10 saniye süre ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirme için `pdf` aracı tarafından kullanılır.
  - Atlanırsa PDF aracı önce `imageModel`'e, sonra çözümlenen oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı sırasında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyutu sınırı.
- `pdfMaxPages`: `pdf` aracındaki çıkarma yedek modunun dikkate aldığı varsayılan en fazla sayfa sayısı.
- `verboseDefault`: ajanlar için varsayılan ayrıntı düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `toolProgressDetail`: `/verbose` araç özetleri ve ilerleme taslağı araç satırları için ayrıntı modu. Değerler: `"explain"` (varsayılan, kısa insan okunur etiketler) veya `"raw"` (varsa ham komutu/ayrıntıyı ekler). Ajan başına `agents.list[].toolProgressDetail` bu varsayılanı geçersiz kılar.
- `reasoningDefault`: ajanlar için varsayılan akıl yürütme görünürlüğü. Değerler: `"off"`, `"on"`, `"stream"`. Ajan başına `agents.list[].reasoningDefault` bu varsayılanı geçersiz kılar. Yapılandırılmış akıl yürütme varsayılanları yalnızca sahipler, yetkili gönderenler veya operatör-yönetici Gateway bağlamları için, ileti ya da oturum başına akıl yürütme geçersiz kılması ayarlanmadığında uygulanır.
- `elevatedDefault`: ajanlar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (örn. API anahtarı erişimi için `openai/gpt-5.5` veya Codex OAuth için `openai-codex/gpt-5.5`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, sonra tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner (kullanımdan kaldırılmış uyumluluk davranışı, bu nedenle açık `provider/model` tercih edin). Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eskimiş kaldırılmış-sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models`: yapılandırılmış model kataloğu ve `/model` için izin listesi. Her giriş `alias` (kısayol) ve `params` (sağlayıcıya özgü, örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`) içerebilir.
  - Güvenli düzenlemeler: giriş eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece mevcut izin listesi girişlerini kaldıracak değiştirmeleri reddeder.
  - Sağlayıcı kapsamlı yapılandırma/onboarding akışları seçili sağlayıcı modellerini bu haritaya birleştirir ve zaten yapılandırılmış ilgisiz sağlayıcıları korur.
  - Doğrudan OpenAI Responses modelleri için sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` eklemeyi durdurmak için `params.responsesServerCompaction: false`, eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI sunucu tarafı Compaction](/tr/providers/openai#server-side-compaction-responses-api).
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` içinde ayarlanır (örn. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (genel temel), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır; ardından `agents.list[].params` (eşleşen ajan kimliği) anahtar bazında geçersiz kılar. Ayrıntılar için bkz. [İstem Önbelleğe Alma](/tr/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu proxy'ler için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş geçiş JSON'u. Oluşturulan istek anahtarlarıyla çakışırsa ek gövde kazanır; yerel olmayan completions rotaları yine de sonrasında yalnızca OpenAI'ye özgü `store` alanını çıkarır.
- `params.chat_template_kwargs`: üst düzey `api: "openai-completions"` istek gövdelerine birleştirilen vLLM/OpenAI uyumlu sohbet şablonu argümanları. Düşünme kapalıyken `vllm/nemotron-3-*` için paketle gelen vLLM Plugin'i otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir; açık `chat_template_kwargs` oluşturulan varsayılanları geçersiz kılar ve `extra_body.chat_template_kwargs` yine son önceliğe sahiptir. vLLM Qwen düşünme denetimleri için ilgili model girişinde `params.qwenThinkingFormat` değerini `"chat-template"` veya `"top-level"` olarak ayarlayın.
- `compat.supportedReasoningEfforts`: model başına OpenAI uyumlu akıl yürütme çabası listesi. Bunu gerçekten kabul eden özel uç noktalar için `"xhigh"` ekleyin; OpenClaw ardından yapılandırılmış sağlayıcı/model için komut menülerinde, Gateway oturum satırlarında, oturum yaması doğrulamasında, ajan CLI doğrulamasında ve `llm-task` doğrulamasında `/think xhigh` gösterir. Arka uç kanonik bir düzey için sağlayıcıya özgü değer istediğinde `compat.reasoningEffortMap` kullanın.
- `params.preserveThinking`: korunmuş düşünme için yalnızca Z.AI'ye özgü isteğe bağlı etkinleştirme. Etkinleştirildiğinde ve düşünme açık olduğunda OpenClaw `thinking.clear_thinking: false` gönderir ve önceki `reasoning_content` içeriğini yeniden oynatır; bkz. [Z.AI düşünme ve korunmuş düşünme](/tr/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: varsayılan düşük düzey ajan çalışma zamanı ilkesi. Atlanan kimlik varsayılan olarak OpenClaw Pi olur. Yerleşik PI çalıştırma takımını zorlamak için `id: "pi"`, kayıtlı Plugin çalıştırma takımlarının desteklenen modelleri üstlenmesine izin vermek ve eşleşme olmadığında PI kullanmak için `id: "auto"`, bu çalıştırma takımını zorunlu kılmak için `id: "codex"` gibi kayıtlı bir çalıştırma takımı kimliği veya `id: "claude-cli"` gibi desteklenen bir CLI arka uç takma adı kullanın. Açık Plugin çalışma zamanları, çalıştırma takımı kullanılamadığında veya başarısız olduğunda kapalı hata verir. Model başvurularını `provider/model` olarak kanonik tutun; Codex, Claude CLI, Gemini CLI ve diğer yürütme arka uçlarını eski çalışma zamanı sağlayıcı ön ekleri yerine çalışma zamanı yapılandırması üzerinden seçin. Bunun sağlayıcı/model seçiminden nasıl farklı olduğunu görmek için bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes).
- Bu alanları değiştiren yapılandırma yazıcıları (örneğin `/models set`, `/models set-image` ve yedek ekleme/kaldırma komutları) kanonik nesne biçimini kaydeder ve mümkün olduğunda mevcut yedek listelerini korur.
- `maxConcurrent`: oturumlar genelinde en fazla paralel ajan çalıştırması (her oturum yine serileştirilir). Varsayılan: 4.

### `agents.defaults.agentRuntime`

`agentRuntime`, ajan turlarını hangi düşük düzey yürütücünün çalıştırdığını denetler. Çoğu dağıtım varsayılan OpenClaw Pi çalışma zamanını korumalıdır. Güvenilir bir Plugin yerel bir çalıştırma takımı sağladığında, örneğin paketle gelen Codex uygulama sunucusu çalıştırma takımı, ya da Claude CLI gibi desteklenen bir CLI arka ucu istediğinizde bunu kullanın. Zihinsel model için bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, kayıtlı bir Plugin çalıştırma takımı kimliği veya desteklenen bir CLI arka uç takma adı. Paketle gelen Codex Plugin'i `codex` kaydeder; paketle gelen Anthropic Plugin'i `claude-cli` CLI arka ucunu sağlar.
- `id: "auto"` kayıtlı Plugin çalıştırma takımlarının desteklenen turları üstlenmesine izin verir ve eşleşen çalıştırma takımı olmadığında PI kullanır. `id: "codex"` gibi açık bir Plugin çalışma zamanı bu çalıştırma takımını gerektirir ve kullanılamazsa veya başarısız olursa kapalı hata verir.
- Ortam geçersiz kılması: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` bu süreç için `id` değerini geçersiz kılar.
- Yalnızca Codex dağıtımları için `model: "openai/gpt-5.5"` ve `agentRuntime.id: "codex"` ayarlayın.
- Claude CLI dağıtımları için `model: "anthropic/claude-opus-4-7"` ile birlikte `agentRuntime.id: "claude-cli"` tercih edin. Eski `claude-cli/claude-opus-4-7` model başvuruları uyumluluk için hâlâ çalışır, ancak yeni yapılandırma sağlayıcı/model seçimini kanonik tutmalı ve yürütme arka ucunu `agentRuntime.id` içine koymalıdır.
- Eski çalışma zamanı ilkesi anahtarları `openclaw doctor --fix` tarafından `agentRuntime` olarak yeniden yazılır.
- Çalıştırma takımı seçimi, ilk gömülü çalıştırmadan sonra oturum kimliği başına sabitlenir. Yapılandırma/ortam değişiklikleri mevcut bir transkripti değil, yeni veya sıfırlanmış oturumları etkiler. Transkript geçmişi olan ancak kayıtlı sabitlemesi bulunmayan eski oturumlar PI sabitlenmiş kabul edilir. `/status` etkin çalışma zamanını bildirir; örneğin `Runtime: OpenClaw Pi Default` veya `Runtime: OpenAI Codex`.
- Bu yalnızca metin ajan turu yürütmesini denetler. Medya oluşturma, görüntü, PDF, müzik, video ve TTS yine sağlayıcı/model ayarlarını kullanır.

**Yerleşik takma ad kısayolları** (yalnızca model `agents.defaults.models` içindeyse uygulanır):

| Takma ad            | Model                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Yapılandırılmış takma adlarınız her zaman varsayılanlara göre önceliklidir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarını yapmadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece düşünme modunu otomatik olarak etkinleştirir.
Z.AI modelleri, araç çağrısı akışı için varsayılan olarak `tool_stream` özelliğini etkinleştirir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` düşünmeyi kullanır.

### `agents.defaults.cliBackends`

Yalnızca metin tabanlı yedek çalıştırmalar için isteğe bağlı CLI arka uçları (araç çağrısı yok). API sağlayıcıları başarısız olduğunda yedek olarak kullanışlıdır.

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
- Oturumlar, `sessionArg` ayarlandığında desteklenir.
- Görüntü aktarımı, `imageArg` dosya yollarını kabul ettiğinde desteklenir.

### `agents.defaults.systemPromptOverride`

OpenClaw tarafından birleştirilen sistem isteminin tamamını sabit bir dizeyle değiştirin. Varsayılan düzeyde (`agents.defaults.systemPromptOverride`) veya aracı başına (`agents.list[].systemPromptOverride`) ayarlayın. Aracı başına değerler önceliklidir; boş veya yalnızca boşluk karakterlerinden oluşan değerler yok sayılır. Kontrollü istem deneyleri için kullanışlıdır.

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

Model ailesine göre uygulanan, sağlayıcıdan bağımsız istem kaplamaları. GPT-5 ailesi model kimlikleri, sağlayıcılar arasında paylaşılan davranış sözleşmesini alır; `personality` yalnızca arkadaşça etkileşim tarzı katmanını kontrol eder.

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

- `"friendly"` (varsayılan) ve `"on"` arkadaşça etkileşim tarzı katmanını etkinleştirir.
- `"off"` yalnızca arkadaşça katmanı devre dışı bırakır; etiketlenmiş GPT-5 davranış sözleşmesi etkin kalır.
- Eski `plugins.entries.openai.config.personality`, bu paylaşılan ayar belirlenmediğinde hâlâ okunur.

### `agents.defaults.heartbeat`

Düzenli Heartbeat çalıştırmaları.

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
- `includeSystemPromptSection`: false olduğunda, sistem isteminden Heartbeat bölümünü çıkarır ve `HEARTBEAT.md` dosyasının başlangıç bağlamına eklenmesini atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda, Heartbeat çalıştırmaları sırasında araç hata uyarı yüklerini bastırır.
- `timeoutSeconds`: bir Heartbeat aracı dönüşü iptal edilmeden önce izin verilen en uzun süre, saniye cinsinden. `agents.defaults.timeoutSeconds` kullanmak için ayarlanmamış bırakın.
- `directPolicy`: doğrudan/DM teslim ilkesi. `allow` (varsayılan) doğrudan hedefe teslimata izin verir. `block` doğrudan hedefe teslimatı bastırır ve `reason=dm-blocked` üretir.
- `lightContext`: true olduğunda, Heartbeat çalıştırmaları hafif başlangıç bağlamı kullanır ve çalışma alanı başlangıç dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her Heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım kalıbı. Heartbeat başına token maliyetini ~100K'dan ~2-5K tokene düşürür.
- `skipWhenBusy`: true olduğunda, Heartbeat çalıştırmaları ek meşgul kanallarda ertelenir: alt aracı veya iç içe komut çalışması. Cron kanalları, bu bayrak olmasa bile Heartbeat çalıştırmalarını her zaman erteler.
- Aracı başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir aracı `heartbeat` tanımladığında, Heartbeat çalıştırmalarını **yalnızca bu aracılar** yapar.
- Heartbeat çalıştırmaları tam aracı dönüşleri çalıştırır; daha kısa aralıklar daha fazla token tüketir.

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
- `provider`: kayıtlı bir Compaction sağlayıcı Plugin kimliği. Ayarlandığında, yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` işlevi çağrılır. Başarısızlık durumunda yerleşik olana geri döner. Sağlayıcı ayarlamak `mode: "safeguard"` kullanımını zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw bir Compaction işlemini iptal etmeden önce tek bir Compaction işlemi için izin verilen en uzun süre, saniye cinsinden. Varsayılan: `900`.
- `keepRecentTokens`: en güncel konuşma dökümü kuyruğunu birebir tutmak için Pi kesme noktası bütçesi. Elle `/compact`, açıkça ayarlandığında buna uyar; aksi halde elle Compaction katı bir kontrol noktasıdır.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, Compaction özetlemesi sırasında yerleşik opak tanımlayıcı saklama yönergelerini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: safeguard özetleri için bozuk biçimli çıktı durumunda yeniden deneme denetimleri. safeguard modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` olarak ayarlayın.
- `midTurnPrecheck`: isteğe bağlı Pi araç döngüsü basınç denetimi. `enabled: true` olduğunda, OpenClaw araç sonuçları eklendikten sonra ve bir sonraki model çağrısından önce bağlam basıncını denetler. Bağlam artık sığmıyorsa, istemi göndermeden önce mevcut denemeyi iptal eder ve araç sonuçlarını kısaltmak veya Compaction yapıp yeniden denemek için mevcut ön denetim kurtarma yolunu yeniden kullanır. Hem `default` hem de `safeguard` Compaction modlarıyla çalışır. Varsayılan: devre dışı.
- `postCompactionSections`: Compaction sonrasında yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Varsayılan olarak `["Session Startup", "Red Lines"]`; yeniden enjeksiyonu devre dışı bırakmak için `[]` olarak ayarlayın. Ayarlanmadığında veya açıkça bu varsayılan çifte ayarlandığında, eski `Every Session`/`Safety` başlıkları da eski uyumluluk geri dönüşü olarak kabul edilir.
- `model`: yalnızca Compaction özetlemesi için isteğe bağlı `provider/model-id` geçersiz kılması. Ana oturumun bir modeli kullanmaya devam etmesi, ancak Compaction özetlerinin başka bir modelde çalışması gerektiğinde bunu kullanın; ayarlanmadığında Compaction oturumun birincil modelini kullanır.
- `maxActiveTranscriptBytes`: aktif JSONL eşiği aştığında bir çalıştırmadan önce normal yerel Compaction'ı tetikleyen isteğe bağlı bayt eşiği (`number` veya `"20mb"` gibi dizeler). Başarılı Compaction'ın daha küçük bir ardıl konuşma dökümüne geçebilmesi için `truncateAfterCompaction` gerektirir. Ayarlanmadığında veya `0` olduğunda devre dışıdır.
- `notifyUser`: `true` olduğunda, Compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin, "Bağlam sıkıştırılıyor..." ve "Compaction tamamlandı"). Compaction'ı sessiz tutmak için varsayılan olarak devre dışıdır.
- `memoryFlush`: dayanıklı bellekleri saklamak için otomatik Compaction öncesinde sessiz aracı dönüşü. Bu bakım dönüşünün yerel bir modelde kalması gerektiğinde `model` değerini `ollama/qwen3:8b` gibi kesin bir sağlayıcı/model olarak ayarlayın; geçersiz kılma, aktif oturumun geri dönüş zincirini devralmaz. Çalışma alanı salt okunur olduğunda atlanır.

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

<Accordion title="cache-ttl modu davranışı">

- `mode: "cache-ttl"` budama geçişlerini etkinleştirir.
- `ttl`, budamanın ne sıklıkla yeniden çalışabileceğini kontrol eder (son önbellek temasından sonra).
- Budama önce aşırı büyük araç sonuçlarını yumuşak biçimde kısaltır, ardından gerekirse daha eski araç sonuçlarını tamamen temizler.

**Yumuşak kısaltma** başlangıcı + sonu tutar ve ortaya `...` ekler.

**Tam temizleme** araç sonucunun tamamını yer tutucuyla değiştirir.

Notlar:

- Görüntü blokları hiçbir zaman kısaltılmaz/temizlenmez.
- Oranlar karakter tabanlıdır (yaklaşık), kesin token sayıları değildir.
- `keepLastAssistants` sayısından daha az asistan iletisi varsa budama atlanır.

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

- Telegram dışındaki kanallar, blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerektirir.
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına değişkenler). Signal/Slack/Discord/Google Chat varsayılanı `minChars: 1500`.
- `humanDelay`: blok yanıtları arasında rastgele duraklama. `natural` = 800-2500ms. Aracı başına geçersiz kılma: `agents.list[].humanDelay`.

Davranış ve parçalara ayırma ayrıntıları için [Akış](/tr/concepts/streaming) bölümüne bakın.

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

Bkz. [Yazma Göstergeleri](/tr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü agent için isteğe bağlı korumalı alan kullanımı. Tam kılavuz için bkz. [Korumalı Alan Kullanımı](/tr/gateway/sandboxing).

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

`backend: "openshell"` seçildiğinde, çalışma zamanına özel ayarlar
`plugins.entries.openshell.config` konumuna taşınır.

**SSH arka uç yapılandırması:**

- `target`: `user@host[:port]` biçiminde SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam başına çalışma alanları için kullanılan mutlak uzak kök
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH'ye geçirilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw'ın çalışma zamanında geçici dosyalara somutlaştırdığı satır içi içerikler veya SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ana makine anahtarı ilkesi düğmeleri

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` yerine geçer
- `certificateData`, `certificateFile` yerine geçer
- `knownHostsData`, `knownHostsFile` yerine geçer
- SecretRef destekli `*Data` değerleri, korumalı alan oturumu başlamadan önce etkin gizli bilgiler çalışma zamanı anlık görüntüsünden çözümlenir

**SSH arka uç davranışı:**

- oluşturma veya yeniden oluşturma sonrasında uzak çalışma alanını bir kez tohumlar
- ardından uzak SSH çalışma alanını kanonik tutar
- `exec`, dosya araçları ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri otomatik olarak ana makineye geri eşitlemez
- korumalı alan tarayıcı container'larını desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına korumalı alan çalışma alanı
- `ro`: `/workspace` konumunda korumalı alan çalışma alanı, `/agent` konumunda salt okunur bağlanmış agent çalışma alanı
- `rw`: `/workspace` konumunda okuma/yazma olarak bağlanmış agent çalışma alanı

**Kapsam:**

- `session`: oturum başına container + çalışma alanı
- `agent`: agent başına bir container + çalışma alanı (varsayılan)
- `shared`: paylaşılan container ve çalışma alanı (oturumlar arası yalıtım yok)

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

- `mirror`: exec öncesinde uzak alanı yerelden tohumlar, exec sonrasında geri eşitler; yerel çalışma alanı kanonik kalır
- `remote`: korumalı alan oluşturulduğunda uzak alanı bir kez tohumlar, ardından uzak çalışma alanını kanonik tutar

`remote` modunda, OpenClaw dışında ana makinede yerel olarak yapılan düzenlemeler tohumlama adımından sonra korumalı alana otomatik olarak eşitlenmez.
Taşıma, OpenShell korumalı alanına SSH ile yapılır; ancak korumalı alan yaşam döngüsü ve isteğe bağlı ayna eşitlemesi Plugin'e aittir.

**`setupCommand`**, container oluşturulduktan sonra bir kez çalışır (`sh -lc` ile). Ağ çıkışı, yazılabilir kök ve root kullanıcısı gerektirir.

**Container'lar varsayılan olarak `network: "none"` kullanır** — agent dışarı erişime ihtiyaç duyuyorsa `"bridge"` olarak (veya özel bir köprü ağı olarak) ayarlayın.
`"host"` engellenir. `"container:<id>"`, açıkça
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` ayarlamadığınız sürece varsayılan olarak engellenir (acil durum).

**Gelen ekler**, etkin çalışma alanında `media/inbound/*` konumuna hazırlanır.

**`docker.binds`** ek ana makine dizinlerini bağlar; genel ve agent başına bağlamalar birleştirilir.

**Korumalı alan tarayıcısı** (`sandbox.browser.enabled`): Bir container içinde Chromium + CDP. noVNC URL'si sistem istemine enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulaması kullanır ve OpenClaw, paylaşılan URL'de parolayı açığa çıkarmak yerine kısa ömürlü bir token URL'si üretir.

- `allowHostControl: false` (varsayılan), korumalı alan oturumlarının ana makine tarayıcısını hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` kullanır (ayrılmış köprü ağı). Yalnızca genel köprü bağlantısını açıkça istediğinizde `bridge` olarak ayarlayın.
- `cdpSourceRange`, isteğe bağlı olarak container kenarında CDP girişini bir CIDR aralığıyla sınırlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek ana makine dizinlerini yalnızca korumalı alan tarayıcı container'ına bağlar. Ayarlandığında (`[]` dahil), tarayıcı container'ı için `docker.binds` değerinin yerini alır.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlanır ve container ana makineleri için ayarlanmıştır:
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`, iş akışınız bunlara
    bağlıysa uzantıları yeniden etkinleştirir.
  - `--renderer-process-limit=2`,
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium'un
    varsayılan süreç sınırını kullanmak için `0` ayarlayın.
  - ayrıca `noSandbox` etkinleştirildiğinde `--no-sandbox`.
  - Varsayılanlar container imajı tabanıdır; container varsayılanlarını değiştirmek için özel
    entrypoint'e sahip özel bir tarayıcı imajı kullanın.

</Accordion>

Tarayıcı korumalı alanı ve `sandbox.docker.binds` yalnızca Docker içindir.

İmajları derleyin (bir kaynak checkout'undan):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Kaynak checkout'u olmadan npm kurulumları için, satır içi `docker build` komutları konusunda bkz. [Korumalı Alan Kullanımı § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup).

### `agents.list` (agent başına geçersiz kılmalar)

Bir agent'a kendi TTS sağlayıcısını, sesini, modelini,
stilini veya otomatik TTS modunu vermek için `agents.list[].tts` kullanın. Agent bloğu, genel
`messages.tts` üzerine derin birleştirme yapar; böylece paylaşılan kimlik bilgileri tek bir yerde kalırken tek tek
agent'lar yalnızca ihtiyaç duydukları ses veya sağlayıcı alanlarını geçersiz kılabilir. Etkin agent'ın
geçersiz kılması otomatik sesli yanıtlara, `/tts audio`, `/tts status` komutlarına ve
`tts` agent aracına uygulanır. Sağlayıcı örnekleri ve öncelik için bkz. [Metinden sese](/tr/tools/tts#per-agent-voice-overrides).

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
        agentRuntime: { id: "auto" },
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

- `id`: sabit ajan kimliği (gerekli).
- `default`: birden fazlası ayarlandığında ilk olan kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa listedeki ilk giriş varsayılan olur.
- `model`: dize biçimi, model geri dönüşü olmadan ajan başına katı bir birincil model ayarlar; nesne biçimi `{ primary }` de `fallbacks` eklemediğiniz sürece katıdır. O ajanı geri dönüşe dahil etmek için `{ primary, fallbacks: [...] }`, katı davranışı açık hale getirmek için `{ primary, fallbacks: [] }` kullanın. Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamadığınız sürece varsayılan geri dönüşleri yine devralır.
- `params`: `agents.defaults.models` içindeki seçili model girdisinin üzerine birleştirilen ajan başına akış parametreleri. Tüm model kataloğunu çoğaltmadan `cacheRetention`, `temperature` veya `maxTokens` gibi ajana özel geçersiz kılmalar için bunu kullanın.
- `tts`: isteğe bağlı ajan başına metinden konuşmaya geçersiz kılmaları. Blok, `messages.tts` üzerine derinlemesine birleştirilir; bu nedenle paylaşılan sağlayıcı kimlik bilgilerini ve geri dönüş ilkesini `messages.tts` içinde tutun ve burada yalnızca sağlayıcı, ses, model, stil veya otomatik mod gibi kişiye özgü değerleri ayarlayın.
- `skills`: isteğe bağlı ajan başına beceri izin listesi. Atlanırsa ajan, ayarlandığında `agents.defaults.skills` değerini devralır; açık bir liste varsayılanlarla birleştirmek yerine onların yerini alır ve `[]` beceri yok anlamına gelir.
- `thinkingDefault`: isteğe bağlı ajan başına varsayılan düşünme düzeyi (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mesaj başına veya oturum düzeyinde geçersiz kılma ayarlanmadığında bu ajan için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Seçilen sağlayıcı/model profili hangi değerlerin geçerli olduğunu denetler; Google Gemini için `adaptive`, sağlayıcının sahip olduğu dinamik düşünmeyi korur (Gemini 3/3.1 üzerinde `thinkingLevel` atlanır, Gemini 2.5 üzerinde `thinkingBudget: -1`).
- `reasoningDefault`: isteğe bağlı ajan başına varsayılan akıl yürütme görünürlüğü (`on | off | stream`). Mesaj başına veya oturum düzeyinde akıl yürütme geçersiz kılması ayarlanmadığında bu ajan için `agents.defaults.reasoningDefault` değerini geçersiz kılar.
- `fastModeDefault`: hızlı mod için isteğe bağlı ajan başına varsayılan (`true | false`). Mesaj başına veya oturum düzeyinde hızlı mod geçersiz kılması ayarlanmadığında uygulanır.
- `agentRuntime`: isteğe bağlı ajan başına düşük düzeyli çalışma zamanı ilkesi geçersiz kılması. Diğer ajanlar `auto` modunda varsayılan PI geri dönüşünü korurken bir ajanı yalnızca Codex yapmak için `{ id: "codex" }` kullanın.
- `runtime`: isteğe bağlı ajan başına çalışma zamanı tanımlayıcısı. Ajanın varsayılan olarak ACP harness oturumlarını kullanması gerektiğinde `runtime.acp` varsayılanlarıyla (`agent`, `backend`, `mode`, `cwd`) birlikte `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göreli yol, `http(s)` URL'si veya `data:` URI'si.
- `identity` varsayılanları türetir: `emoji` değerinden `ackReaction`, `name`/`emoji` değerinden `mentionPatterns`.
- `subagents.allowAgents`: açık `sessions_spawn.agentId` hedefleri için ajan kimliklerinin izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı ajan). Kendini hedefleyen `agentId` çağrılarına izin verilmesi gerekiyorsa istekte bulunan kimliği dahil edin.
- Sandbox devralma koruması: istekte bulunan oturum sandbox içindeyse `sessions_spawn`, sandbox dışında çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda, `agentId` değerini atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar; varsayılan: false).

---

## Çok ajanlı yönlendirme

Tek bir Gateway içinde birden fazla yalıtılmış ajan çalıştırın. Bkz. [Çok Ajanlı](/tr/concepts/multi-agent).

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
- `match.channel` (gerekli)
- `match.accountId` (isteğe bağlı; `*` = herhangi bir hesap; atlanırsa = varsayılan hesap)
- `match.peer` (isteğe bağlı; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özgü)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Deterministik eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam eşleşme, peer/guild/team yok)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan ajan

Her katmanda, ilk eşleşen `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw, tam konuşma kimliğine göre çözümler (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki route bağlama katmanı sırasını kullanmaz.

### Ajan başına erişim profilleri

<Accordion title="Full access (no sandbox)">

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

<Accordion title="Read-only tools + workspace">

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

<Accordion title="No filesystem access (messaging only)">

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

Öncelik ayrıntıları için [Çoklu Aracı Sandbox ve Araçları](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

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

<Accordion title="Session field details">

- **`scope`**: grup sohbeti bağlamları için temel oturum gruplama stratejisi.
  - `per-sender` (varsayılan): her gönderen, bir kanal bağlamı içinde yalıtılmış bir oturum alır.
  - `global`: bir kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam amaçlandığında kullanın).
- **`dmScope`**: DM'lerin nasıl gruplandığı.
  - `main`: tüm DM'ler ana oturumu paylaşır.
  - `per-peer`: kanallar arasında gönderen kimliğine göre yalıt.
  - `per-channel-peer`: kanal + gönderen başına yalıt (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderen başına yalıt (çok hesaplı kullanım için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kurallı kimlikleri sağlayıcı önekli eşlerle eşleyin. `/dock_discord` gibi dock komutları, etkin oturumun yanıt rotasını başka bir bağlı kanal eşine geçirmek için aynı eşlemeyi kullanır; bkz. [Kanal yerleştirme](/tr/concepts/channel-docking).
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saatte `atHour` değerinde sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. İkisi de yapılandırıldığında, önce süresi dolan kazanır. Günlük sıfırlama güncelliği oturum satırının `sessionStartedAt` değerini kullanır; boşta sıfırlama güncelliği `lastInteractionAt` değerini kullanır. Heartbeat, Cron uyandırmaları, exec bildirimleri ve Gateway defter tutma gibi arka plan/sistem olayı yazımları `updatedAt` değerini güncelleyebilir, ancak günlük/boşta oturumları güncel tutmaz.
- **`resetByType`**: türe göre geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`mainKey`**: eski alan. Runtime, ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: aracıdan aracıya değiş tokuşlar sırasında aracılar arasındaki en fazla yanıt dönüşü sayısı (tamsayı, aralık: `0`–`5`). `0`, ping-pong zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleştir. İlk deny kazanır.
- **`maintenance`**: oturum deposu temizliği + saklama denetimleri.
  - `mode`: `warn` yalnızca uyarı yayar; `enforce` temizlik uygular.
  - `pruneAfter`: bayat girdiler için yaş sınırı (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki en fazla girdi sayısı (varsayılan `500`). Runtime, üretim boyutlu sınırlar için küçük bir üst seviye tamponuyla toplu temizlik yazar; `openclaw sessions cleanup --enforce` sınırı hemen uygular.
  - `rotateBytes`: kullanım dışı ve yok sayılır; `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript arşivleri için saklama süresi. Varsayılan olarak `pruneAfter`; devre dışı bırakmak için `false` olarak ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturumlar dizini disk bütçesi. `warn` modunda uyarıları günlüğe yazar; `enforce` modunda önce en eski yapıtları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliği sonrasında isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `%80`'i.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için global varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan hareketsizlikte otomatik odak kaldırma (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan katı en fazla yaş (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `spawnSessions`: `sessions_spawn` ve ACP iş parçacığı başlatmalarından iş parçacığına bağlı çalışma oturumları oluşturmak için varsayılan geçit. İş parçacığı bağları etkin olduğunda varsayılan olarak `true`; sağlayıcılar/hesaplar geçersiz kılabilir.
  - `defaultSpawnContext`: iş parçacığına bağlı başlatmalar için varsayılan yerel alt aracı bağlamı (`"fork"` veya `"isolated"`). Varsayılan olarak `"fork"`.

</Accordion>

---

## İletiler

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

Çözümleme (en özel olan kazanır): hesap → kanal → global. `""` devre dışı bırakır ve kademeli aramayı durdurur. `"auto"` `[{identity.name}]` değerini türetir.

**Şablon değişkenleri:**

| Değişken          | Açıklama                | Örnek                       |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Kısa model adı          | `claude-opus-4-6`           |
| `{modelFull}`     | Tam model tanımlayıcısı | `anthropic/claude-opus-4-6` |
| `{provider}`      | Sağlayıcı adı           | `anthropic`                 |
| `{thinkingLevel}` | Geçerli düşünme düzeyi  | `high`, `low`, `off`        |
| `{identity.name}` | Ajan kimliği adı        | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarlı değildir. `{think}`, `{thinkingLevel}` için bir takma addır.

### Onay tepkisi

- Varsayılan olarak etkin ajanın `identity.emoji` değerini, aksi halde `"👀"` değerini kullanır. Devre dışı bırakmak için `""` olarak ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik yedeği.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram, WhatsApp ve BlueBubbles gibi tepki destekli kanallarda yanıttan sonra onayı kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord ve Telegram üzerinde yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord üzerinde, ayarlanmamış olması, onay tepkileri etkin olduğunda durum tepkilerini etkin tutar.
  Telegram üzerinde, yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` olarak ayarlayın.

### Gelen ileti bekletmesi

Aynı gönderenden hızla gelen yalnızca metin içeren iletileri tek bir ajan turunda toplar. Medya/ekler hemen gönderilir. Kontrol komutları bekletmeyi atlar.

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

- `auto`, varsayılan otomatik TTS modunu denetler: `off`, `always`, `inbound` veya `tagged`. `/tts on|off` yerel tercihleri geçersiz kılabilir ve `/tts status` geçerli durumu gösterir.
- `summaryModel`, otomatik özet için `agents.defaults.model.primary` değerini geçersiz kılar.
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılanı `false` değeridir (katılım gerektirir).
- API anahtarları `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine geri döner.
- Paketlenmiş konuşma sağlayıcıları Plugin tarafından sahiplenilir. `plugins.allow` ayarlanmışsa kullanmak istediğiniz her TTS sağlayıcı Plugin'ini, örneğin Edge TTS için `microsoft` değerini ekleyin. Eski `edge` sağlayıcı kimliği, `microsoft` için bir takma ad olarak kabul edilir.
- `providers.openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası yapılandırma, ardından `OPENAI_TTS_BASE_URL`, ardından `https://api.openai.com/v1` şeklindedir.
- `providers.openai.baseUrl` OpenAI olmayan bir uç noktayı gösterdiğinde OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak değerlendirir ve model/ses doğrulamasını gevşetir.

---

## Talk

Talk modu için varsayılanlar (macOS/iOS/Android).

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- Birden çok Talk sağlayıcısı yapılandırıldığında `talk.provider`, `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Talk anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir ve otomatik olarak `talk.providers.<provider>` içine geçirilir.
- Ses kimlikleri `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerine geri döner.
- `providers.*.apiKey`, düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` yedeği yalnızca hiçbir Talk API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Talk yönergelerinin kolay adlar kullanmasını sağlar.
- `providers.mlx.modelId`, macOS yerel MLX yardımcısı tarafından kullanılan Hugging Face reposunu seçer. Atlanırsa macOS `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatması, varsa paketlenmiş `openclaw-mlx-tts` yardımcısı üzerinden veya `PATH` üzerindeki bir çalıştırılabilir dosya üzerinden çalışır; `OPENCLAW_MLX_TTS_BIN`, geliştirme için yardımcı yolunu geçersiz kılar.
- `speechLocale`, iOS/macOS Talk konuşma tanıma tarafından kullanılan BCP 47 yerel ayar kimliğini ayarlar. Aygıt varsayılanını kullanmak için ayarlamadan bırakın.
- `silenceTimeoutMs`, kullanıcı sessiz kaldıktan sonra Talk modunun transkripti göndermeden önce ne kadar bekleyeceğini denetler. Ayarlanmamış olması platformun varsayılan duraklama penceresini korur (`macOS ve Android üzerinde 700 ms, iOS üzerinde 900 ms`).

---

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer tüm yapılandırma anahtarları
- [Yapılandırma](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
