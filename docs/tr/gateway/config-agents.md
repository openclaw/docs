---
read_when:
    - Aracı varsayılanlarını ayarlama (modeller, düşünme, çalışma alanı, Heartbeat, medya, Skills)
    - Çoklu ajan yönlendirmesini ve bağlamalarını yapılandırma
    - Oturum, ileti teslimi ve konuşma modu davranışını ayarlama
summary: Aracı varsayılanları, çok aracılı yönlendirme, oturum, mesajlar ve konuşma yapılandırması
title: Yapılandırma — ajanlar
x-i18n:
    generated_at: "2026-06-28T00:33:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`, `messages.*` ve `talk.*` altındaki ajan kapsamlı yapılandırma anahtarları. Kanallar, araçlar, Gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Ajan varsayılanları

### `agents.defaults.workspace`

Varsayılan: ayarlanmışsa `OPENCLAW_WORKSPACE_DIR`, aksi halde `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Açık bir `agents.defaults.workspace` değeri, `OPENCLAW_WORKSPACE_DIR` değerine göre önceliklidir. Bu yolu yapılandırmaya yazmak istemediğinizde varsayılan ajanları bağlanmış bir çalışma alanına yönlendirmek için ortam değişkenini kullanın.

### `agents.defaults.repoRoot`

Sistem isteminin Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmazsa OpenClaw, çalışma alanından yukarı doğru ilerleyerek otomatik algılar.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` ayarlamayan ajanlar için isteğe bağlı varsayılan Skills izin listesi.

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

- Varsayılan olarak sınırsız Skills için `agents.defaults.skills` değerini atlayın.
- Varsayılanları devralmak için `agents.list[].skills` değerini atlayın.
- Skills olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o ajan için nihai kümedir; varsayılanlarla birleştirilmez.

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

Çalışma alanı bootstrap dosyalarının sistem istemine ne zaman enjekte edileceğini denetler. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam turları (tamamlanmış bir asistan yanıtından sonra), çalışma alanı bootstrap yeniden enjeksiyonunu atlayarak istem boyutunu azaltır. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler yine de bağlamı yeniden oluşturur.
- `"never"`: her turda çalışma alanı bootstrap ve bağlam dosyası enjeksiyonunu devre dışı bırakır. Bunu yalnızca istem yaşam döngüsünü tamamen kendisi yöneten ajanlar için kullanın (özel bağlam motorları, kendi bağlamını oluşturan yerel çalışma zamanları veya bootstrap gerektirmeyen özelleşmiş iş akışları). Heartbeat ve Compaction kurtarma turları da enjeksiyonu atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Ajan başına geçersiz kılma: `agents.list[].contextInjection`. Atlanan değerler `agents.defaults.contextInjection` değerini devralır.

### `agents.defaults.bootstrapMaxChars`

Kesmeden önce çalışma alanı bootstrap dosyası başına en fazla karakter sayısı. Varsayılan: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Ajan başına geçersiz kılma: `agents.list[].bootstrapMaxChars`. Atlanan değerler `agents.defaults.bootstrapMaxChars` değerini devralır.

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı bootstrap dosyaları genelinde enjekte edilen toplam en fazla karakter sayısı. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Ajan başına geçersiz kılma: `agents.list[].bootstrapTotalMaxChars`. Atlanan değerler `agents.defaults.bootstrapTotalMaxChars` değerini devralır.

### Ajan başına bootstrap profili geçersiz kılmaları

Bir ajanın paylaşılan varsayılanlardan farklı istem enjeksiyonu davranışına ihtiyacı olduğunda ajan başına bootstrap profili geçersiz kılmalarını kullanın. Atlanan alanlar `agents.defaults` değerinden devralınır.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bootstrap bağlamı kesildiğinde ajanın görebildiği sistem istemi bildirimini denetler. Varsayılan: `"always"`.

- `"off"`: kesme bildirimi metnini sistem istemine hiçbir zaman enjekte etmez.
- `"once"`: her benzersiz kesme imzası için kısa bir bildirimi bir kez enjekte eder.
- `"always"`: kesme olduğunda her çalıştırmada kısa bir bildirim enjekte eder (önerilir).

Ayrıntılı ham/enjekte edilmiş sayımlar ve yapılandırma ayarlama alanları, bağlam/durum raporları ve günlükler gibi tanılarda kalır; rutin WebChat kullanıcı/çalışma zamanı bağlamı yalnızca kısa kurtarma bildirimini alır.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw, birden çok yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar bilinçli olarak tek bir genel ayar düğmesinden akıtılmak yerine alt sistemlere göre bölünmüştür.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı bootstrap enjeksiyonu.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil olmak üzere tek seferlik sıfırlama/başlatma model çalıştırması başlangıç bölümü. Yalın sohbet `/new` ve `/reset` komutları, modeli çağırmadan onaylanır.
- `skills.limits.*`:
  sistem istemine enjekte edilen kompakt Skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipli bloklar.
- `memory.qmd.limits.*`:
  indekslenmiş bellek arama parçacığı ve enjeksiyon boyutlandırması.

Yalnızca bir ajan farklı bir bütçeye ihtiyaç duyduğunda eşleşen ajan başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Sıfırlama/başlatma model çalıştırmalarında enjekte edilen ilk tur başlatma başlangıç bölümünü denetler. Yalın sohbet `/new` ve `/reset` komutları, modeli çağırmadan sıfırlamayı onaylar; bu nedenle bu başlangıç bölümünü yüklemezler.

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: kesme meta verileri ve devam bildirimi eklenmeden önceki varsayılan `memory_get` alıntı sınırı.
- `memoryGetDefaultLines`: `lines` atlandığında varsayılan `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcı hale getirilen sonuçlar ve taşma kurtarma için kullanılan gelişmiş canlı araç sonucu tavanı. Model bağlamı otomatik sınırı için ayarlamadan bırakın: 100K token altındayken `16000` karakter, 100K+ token olduğunda `32000` karakter ve 200K+ token olduğunda `64000` karakter. Uzun bağlamlı modeller için `1000000` değerine kadar açık değerler kabul edilir, ancak etkili sınır yine de model bağlam penceresinin yaklaşık %30'u ile sınırlıdır. `openclaw doctor --deep` etkili sınırı yazdırır ve doctor yalnızca açık bir geçersiz kılma bayat olduğunda veya etkisi olmadığında uyarır.
- `postCompactionMaxChars`: Compaction sonrası yenileme enjeksiyonu sırasında kullanılan AGENTS.md alıntı sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` ayarları için ajan başına geçersiz kılma. Atlanan alanlar `agents.defaults.contextLimits` değerinden devralınır.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Sistem istemine enjekte edilen kompakt Skills listesi için genel sınır. Bu, `SKILL.md` dosyalarının gerektiğinde okunmasını etkilemez.

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

Sağlayıcı çağrılarından önce transkript/araç görsel bloklarında en uzun görsel kenarı için en fazla piksel boyutu. Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü yoğun çalıştırmalar için görüntü token kullanımını ve istek yükü boyutunu azaltır. Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Dosya yollarından, URL'lerden ve medya referanslarından yüklenen görseller için görsel aracı sıkıştırma/ayrıntı tercihi. Varsayılan: `auto`.

OpenClaw, yeniden boyutlandırma basamağını seçili görsel modeline uyarlar. Örneğin Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL ve barındırılan Llama 4 görme modelleri, eski/varsayılan yüksek ayrıntılı görme yollarına göre daha büyük görseller kullanabilir; çoklu görsel turları ise token ve gecikme maliyetini denetlemek için `auto` modunda daha agresif biçimde sıkıştırılır.

Değerler:

- `auto`: model sınırlarına ve görsel sayısına uyarla.
- `efficient`: daha düşük token ve bayt kullanımı için daha küçük görselleri tercih et.
- `balanced`: standart orta yol basamağını kullan.
- `high`: ekran görüntüleri, diyagramlar ve belge görselleri için daha fazla ayrıntıyı koru.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Sistem istemi bağlamı için saat dilimi (mesaj zaman damgaları değil). Ana makine saat dilimine geri döner.

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

- `model`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Dize biçimi yalnızca birincil modeli ayarlar.
  - Nesne biçimi birincil modeli ve sıralı yük devretme modellerini ayarlar.
- `imageModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - `image` araç yolu tarafından görsel-model yapılandırması olarak kullanılır.
  - Seçilen/varsayılan model görüntü girdisi kabul edemediğinde yedek yönlendirme olarak da kullanılır.
  - Açık `provider/model` başvurularını tercih edin. Yalın kimlikler uyumluluk için kabul edilir; yalın kimlik, `models.providers.*.models` içinde yapılandırılmış görüntü destekli bir girişle benzersiz biçimde eşleşirse OpenClaw bunu o sağlayıcıyla niteler. Belirsiz yapılandırılmış eşleşmeler açık bir sağlayıcı öneki gerektirir.
- `imageGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görüntü üretimi yeteneği ve görüntü üreten gelecekteki tüm araç/Plugin yüzeyleri tarafından kullanılır.
  - Tipik değerler: yerel Gemini görüntü üretimi için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev`, OpenAI Images için `openai/gpt-image-2` veya şeffaf arka planlı OpenAI PNG/WebP çıktısı için `openai/gpt-image-1.5`.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı görüntü üretimi sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
- `musicGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik üretimi yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı müzik üretimi sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video üretimi yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı video üretimi sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Resmi Qwen video üretimi Plugin'i en fazla 1 çıktı videosunu, 1 girdi görüntüsünü, 4 girdi videosunu, 10 saniye süreyi ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirmesi için `pdf` aracı tarafından kullanılır.
  - Atlanırsa PDF aracı `imageModel` değerine, ardından çözümlenen oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı sırasında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyutu sınırı.
- `pdfMaxPages`: `pdf` aracındaki çıkarma yedek modunda dikkate alınan varsayılan azami sayfa sayısı.
- `verboseDefault`: ajanlar için varsayılan ayrıntılı çıktı düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `toolProgressDetail`: `/verbose` araç özetleri ve ilerleme taslağı araç satırları için ayrıntı modu. Değerler: `"explain"` (varsayılan, kısa insan etiketleri) veya `"raw"` (varsa ham komut/ayrıntıyı ekler). Ajan başına `agents.list[].toolProgressDetail` bu varsayılanı geçersiz kılar.
- `reasoningDefault`: ajanlar için varsayılan akıl yürütme görünürlüğü. Değerler: `"off"`, `"on"`, `"stream"`. Ajan başına `agents.list[].reasoningDefault` bu varsayılanı geçersiz kılar. Yapılandırılmış akıl yürütme varsayılanları yalnızca sahipler, yetkili gönderenler veya operatör-yönetici Gateway bağlamları için ve ileti ya da oturum bazında akıl yürütme geçersiz kılması ayarlanmadığında uygulanır.
- `elevatedDefault`: ajanlar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (ör. OpenAI API anahtarı veya Codex OAuth erişimi için `openai/gpt-5.5`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, ardından tam model kimliği için benzersiz bir yapılandırılmış-sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner (kullanımdan kaldırılmış uyumluluk davranışı; bu nedenle açık `provider/model` tercih edin). Bu sağlayıcı yapılandırılmış varsayılan modeli artık sunmuyorsa OpenClaw eski ve kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models`: `/model` için yapılandırılmış model kataloğu ve izin listesi. Her giriş `alias` (kısayol) ve `params` (sağlayıcıya özgü; örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider` yönlendirmesi, `chat_template_kwargs`, `extra_body`/`extraBody`) içerebilir.
  - Her model kimliğini elle listelemeden seçili sağlayıcılar için keşfedilen tüm modelleri göstermek üzere `"openai/*": {}` veya `"vllm/*": {}` gibi `provider/*` girişlerini kullanın.
  - O sağlayıcı için dinamik olarak keşfedilen her model aynı çalışma zamanını kullanmalıysa bir `provider/*` girişine `agentRuntime` ekleyin. Tam `provider/model` çalışma zamanı politikası yine de joker karaktere göre önceliklidir.
  - Güvenli düzenlemeler: giriş eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece mevcut izin listesi girişlerini kaldıracak değiştirmeleri reddeder.
  - Sağlayıcı kapsamlı yapılandırma/ilk kurulum akışları seçili sağlayıcı modellerini bu haritaya birleştirir ve zaten yapılandırılmış ilgisiz sağlayıcıları korur.
  - Doğrudan OpenAI Responses modelleri için sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` eklemeyi durdurmak için `params.responsesServerCompaction: false` kullanın veya eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI sunucu tarafı Compaction](/tr/providers/openai#server-side-compaction-responses-api).
- `params`: tüm modellere uygulanan küresel varsayılan sağlayıcı parametreleri. `agents.defaults.params` altında ayarlanır (ör. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (küresel taban), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır; ardından `agents.list[].params` (eşleşen ajan kimliği) anahtar bazında geçersiz kılar. Ayrıntılar için [Prompt Önbelleğe Alma](/tr/reference/prompt-caching) bölümüne bakın.
- `models.providers.openrouter.params.provider`: OpenRouter genelinde varsayılan sağlayıcı-yönlendirme politikası. OpenClaw bunu OpenRouter'ın istek `provider` nesnesine iletir; model başına `agents.defaults.models["openrouter/<model>"].params.provider` ve ajan parametreleri anahtar bazında geçersiz kılar. Bkz. [OpenRouter sağlayıcı yönlendirmesi](/tr/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu proxy'ler için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş geçiş JSON'u. Üretilen istek anahtarlarıyla çakışırsa ek gövde kazanır; yerel olmayan completions rotaları yine de sonrasında yalnızca OpenAI'ye özgü `store` alanını çıkarır.
- `params.chat_template_kwargs`: üst düzey `api: "openai-completions"` istek gövdelerine birleştirilen vLLM/OpenAI uyumlu sohbet şablonu bağımsız değişkenleri. Düşünme kapalıyken `vllm/nemotron-3-*` için paketli vLLM Plugin'i otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir; açık `chat_template_kwargs` üretilen varsayılanları geçersiz kılar ve `extra_body.chat_template_kwargs` yine son önceliğe sahiptir. Yapılandırılmış vLLM Qwen ve Nemotron düşünme modelleri, çok düzeyli efor merdiveni yerine ikili `/think` seçimleri (`off`, `on`) sunar.
- `compat.thinkingFormat`: OpenAI uyumlu düşünme yükü stili. Together tarzı `reasoning.enabled` için `"together"`, Qwen tarzı üst düzey `enable_thinking` için `"qwen"` veya vLLM gibi istek düzeyinde sohbet şablonu kwargs destekleyen Qwen ailesi arka uçlarda `chat_template_kwargs.enable_thinking` için `"qwen-chat-template"` kullanın. OpenClaw devre dışı düşünmeyi `false`, etkin düşünmeyi `true` değerine eşler ve yapılandırılmış vLLM Qwen modelleri bu biçimler için ikili `/think` seçimleri sunar.
- `compat.supportedReasoningEfforts`: model başına OpenAI uyumlu akıl yürütme eforu listesi. Gerçekten kabul eden özel uç noktalar için `"xhigh"` ekleyin; OpenClaw daha sonra bu yapılandırılmış sağlayıcı/model için komut menülerinde, Gateway oturum satırlarında, oturum yaması doğrulamasında, ajan CLI doğrulamasında ve `llm-task` doğrulamasında `/think xhigh` seçeneğini sunar. Arka uç, kanonik bir düzey için sağlayıcıya özgü bir değer istiyorsa `compat.reasoningEffortMap` kullanın.
- `params.preserveThinking`: korunan düşünme için yalnızca Z.AI'ye özgü katılım seçeneği. Etkinleştirildiğinde ve düşünme açıkken OpenClaw `thinking.clear_thinking: false` gönderir ve önceki `reasoning_content` içeriğini yeniden oynatır; bkz. [Z.AI düşünme ve korunan düşünme](/tr/providers/zai#thinking-and-preserved-thinking).
- `localService`: yerel/kendi barındırılan model sunucuları için isteğe bağlı sağlayıcı düzeyinde süreç yöneticisi. Seçilen model o sağlayıcıya ait olduğunda OpenClaw `healthUrl` değerini (veya `baseUrl + "/models"` değerini) yoklar, uç nokta kapalıysa `command` komutunu `args` ile başlatır, `readyTimeoutMs` kadar bekler ve ardından model isteğini gönderir. `command` mutlak yol olmalıdır. `idleStopMs: 0` süreci OpenClaw çıkana kadar canlı tutar; pozitif bir değer, OpenClaw tarafından başlatılan süreci bu kadar boşta milisaniyeden sonra durdurur. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- Çalışma zamanı politikası `agents.defaults` üzerinde değil, sağlayıcılar veya modeller üzerinde olmalıdır. Sağlayıcı geneli kurallar için `models.providers.<provider>.agentRuntime`, modele özgü kurallar için `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` kullanın. Resmi OpenAI sağlayıcısındaki OpenAI ajan modelleri varsayılan olarak Codex seçer.
- Bu alanları değiştiren yapılandırma yazıcıları (örneğin `/models set`, `/models set-image` ve yedek ekleme/kaldırma komutları) kanonik nesne biçimini kaydeder ve mümkün olduğunda mevcut yedek listeleri korur.
- `maxConcurrent`: oturumlar genelinde en fazla paralel ajan çalıştırması (her oturum yine de sıralı işlenir). Varsayılan: 4.

### Çalışma zamanı politikası

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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, kayıtlı bir Plugin harness kimliği veya desteklenen bir CLI arka uç alias'ı. Paketle gelen Codex Plugin `codex` kaydeder; paketle gelen Anthropic Plugin `claude-cli` CLI arka ucunu sağlar.
- `id: "auto"`, kayıtlı Plugin harness'larının desteklenen turn'leri üstlenmesine izin verir ve hiçbir harness eşleşmediğinde OpenClaw kullanır. `id: "codex"` gibi açık bir Plugin runtime'ı bu harness'ı gerektirir ve kullanılamıyorsa ya da başarısız olursa kapalı başarısız olur.
- `id: "pi"`, yalnızca v2026.5.22 ve öncesinden yayımlanmış config'leri korumak için `openclaw` için kullanımdan kaldırılmış bir alias olarak kabul edilir. Yeni config `openclaw` kullanmalıdır.
- Runtime önceliği önce tam model politikasıdır (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` veya `models.providers.<provider>.models[]`), ardından `agents.list[]` / `agents.defaults.models["provider/*"]`, ardından `models.providers.<provider>.agentRuntime` içindeki provider genelindeki politika gelir.
- Tüm agent runtime anahtarları legacy'dir. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, oturum runtime pin'leri ve `OPENCLAW_AGENT_RUNTIME`, runtime seçimi tarafından yok sayılır. Eski değerleri kaldırmak için `openclaw doctor --fix` çalıştırın.
- OpenAI agent modelleri varsayılan olarak Codex harness'ını kullanır; bunu açık hale getirmek istediğinizde provider/model `agentRuntime.id: "codex"` geçerli kalır.
- Claude CLI dağıtımları için `model: "anthropic/claude-opus-4-8"` ile model kapsamlı `agentRuntime.id: "claude-cli"` kullanmayı tercih edin. Legacy `claude-cli/claude-opus-4-7` model ref'leri uyumluluk için hâlâ çalışır, ancak yeni config provider/model seçimini canonical tutmalı ve yürütme arka ucunu provider/model runtime politikasına koymalıdır.
- Bu yalnızca metin agent-turn yürütmesini kontrol eder. Medya üretimi, vision, PDF, müzik, video ve TTS yine kendi provider/model ayarlarını kullanır.

**Yerleşik alias kısaltmaları** (yalnızca model `agents.defaults.models` içinde olduğunda uygulanır):

| Alias               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Yapılandırdığınız alias'lar her zaman varsayılanlara üstün gelir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarlamadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece thinking modunu otomatik olarak etkinleştirir.
Z.AI modelleri, tool call streaming için varsayılan olarak `tool_stream` etkinleştirir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
Anthropic Claude Opus 4.8, OpenClaw içinde thinking'i varsayılan olarak kapalı tutar; adaptive thinking açıkça etkinleştirildiğinde Anthropic'in provider'a ait effort varsayılanı `high` olur. Claude 4.6 modelleri, açık bir thinking düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.

### `agents.defaults.cliBackends`

Yalnızca metin fallback çalışmaları için isteğe bağlı CLI arka uçları (tool call yok). API provider'ları başarısız olduğunda yedek olarak kullanışlıdır.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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
- `sessionArg` ayarlandığında oturumlar desteklenir.
- `imageArg` dosya yollarını kabul ettiğinde görüntü geçişi desteklenir.
- `reseedFromRawTranscriptWhenUncompacted: true`, bir arka ucun ilk Compaction özeti var olmadan önce sınırlı bir ham OpenClaw transcript kuyruğundan güvenli
  geçersiz kılınmış oturumları kurtarmasına izin verir. Auth profili veya credential-epoch değişiklikleri
  yine de hiçbir zaman ham yeniden tohumlama yapmaz.

### `agents.defaults.promptOverlays`

OpenClaw tarafından birleştirilmiş prompt yüzeylerinde model ailesine göre uygulanan provider'dan bağımsız prompt overlay'leri. GPT-5 ailesi model kimlikleri OpenClaw/provider rotaları genelinde paylaşılan davranış sözleşmesini alır; `personality` yalnızca dostane etkileşim stili katmanını kontrol eder. Yerel Codex app-server rotaları bu OpenClaw GPT-5 overlay'i yerine Codex'e ait base/model yönergelerini korur ve OpenClaw, yerel thread'ler için Codex'in yerleşik personality özelliğini devre dışı bırakır.

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

- `"friendly"` (varsayılan) ve `"on"` dostane etkileşim stili katmanını etkinleştirir.
- `"off"` yalnızca dostane katmanı devre dışı bırakır; etiketli GPT-5 davranış sözleşmesi etkin kalır.
- Bu paylaşılan ayar unset olduğunda legacy `plugins.entries.openai.config.personality` hâlâ okunur.

### `agents.defaults.heartbeat`

Periyodik Heartbeat çalışmaları.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

- `every`: süre dizesi (ms/s/m/h). Varsayılan: `30m` (API-key auth) veya `1h` (OAuth auth). Devre dışı bırakmak için `0m` olarak ayarlayın.
- `includeSystemPromptSection`: false olduğunda, sistem prompt'undan Heartbeat bölümünü çıkarır ve bootstrap bağlamına `HEARTBEAT.md` enjeksiyonunu atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda, heartbeat çalışmaları sırasında araç hatası uyarı payload'larını bastırır.
- `timeoutSeconds`: bir heartbeat agent turn'ü durdurulmadan önce izin verilen saniye cinsinden en fazla süre. Ayarlanmışsa `agents.defaults.timeoutSeconds` değerini kullanmak için unset bırakın; aksi halde heartbeat temposu 600 saniyeyle sınırlandırılır.
- `directPolicy`: doğrudan/DM teslimat politikası. `allow` (varsayılan) doğrudan hedef teslimatına izin verir. `block` doğrudan hedef teslimatını bastırır ve `reason=dm-blocked` yayar.
- `lightContext`: true olduğunda, heartbeat çalışmaları hafif bootstrap bağlamı kullanır ve workspace bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her heartbeat önceki konuşma geçmişi olmayan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı izolasyon deseni. Heartbeat başına token maliyetini ~100K'den ~2-5K token'a düşürür.
- `skipWhenBusy`: true olduğunda, heartbeat çalışmaları ilgili agent'ın ek meşgul şeritlerinde ertelenir: kendi session-keyed subagent'ı veya iç içe komut işi. Cron şeritleri bu bayrak olmadan bile heartbeat'leri her zaman erteler.
- Agent başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir agent `heartbeat` tanımladığında, **yalnızca bu agent'lar** heartbeat çalıştırır.
- Heartbeat'ler tam agent turn'leri çalıştırır — daha kısa aralıklar daha fazla token tüketir.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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
- `provider`: kayıtlı bir compaction sağlayıcı plugin kimliği. Ayarlandığında, yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` işlevi çağrılır. Hata durumunda yerleşik olana geri döner. Sağlayıcı ayarlamak `mode: "safeguard"` kullanımını zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw işlemi durdurmadan önce tek bir compaction işlemi için izin verilen en fazla saniye. Varsayılan: `180`.
- `keepRecentTokens`: en son transkript kuyruğunu birebir tutmak için ajan kesme noktası bütçesi. Elle `/compact`, açıkça ayarlandığında buna uyar; aksi halde elle compaction katı bir denetim noktasıdır.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, compaction özetlemesi sırasında yerleşik opak tanımlayıcı koruma yönergelerini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: safeguard özetleri için hatalı biçimli çıktıda yeniden deneme denetimleri. Safeguard modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` ayarlayın.
- `midTurnPrecheck`: isteğe bağlı araç döngüsü baskı denetimi. `enabled: true` olduğunda OpenClaw, araç sonuçları eklendikten sonra ve bir sonraki model çağrısından önce bağlam baskısını denetler. Bağlam artık sığmıyorsa, istemi göndermeden önce mevcut denemeyi durdurur ve araç sonuçlarını kısaltmak veya compact edip yeniden denemek için mevcut ön denetim kurtarma yolunu yeniden kullanır. Hem `default` hem de `safeguard` compaction modlarıyla çalışır. Varsayılan: devre dışı.
- `postCompactionSections`: compaction sonrasında yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Ayarlanmamışsa veya `[]` olarak ayarlanmışsa yeniden enjeksiyon devre dışıdır. Açıkça `["Session Startup", "Red Lines"]` ayarlamak bu çifti etkinleştirir ve eski `Every Session`/`Safety` geri dönüşünü korur. Bunu yalnızca ek bağlam, compaction özetinde zaten yakalanmış proje yönergelerini çoğaltma riskine değdiğinde etkinleştirin.
- `model`: yalnızca compaction özetlemesi için isteğe bağlı `provider/model-id` veya `agents.defaults.models` içinden yalın takma ad. Yalın takma adlar gönderimden önce çözümlenir; yapılandırılmış düz model kimlikleri çakışmalarda önceliğini korur. Ana oturum bir modeli korumalı ancak compaction özetleri başka bir modelde çalışmalıysa bunu kullanın; ayarlanmamışsa compaction oturumun birincil modelini kullanır.
- `maxActiveTranscriptBytes`: aktif JSONL eşiği geçtiğinde çalıştırmadan önce normal yerel compaction tetikleyen isteğe bağlı bayt eşiği (`number` veya `"20mb"` gibi dizeler). Başarılı compaction işleminin daha küçük bir ardıl transkripte dönebilmesi için `truncateAfterCompaction` gerektirir. Ayarlanmamışsa veya `0` ise devre dışıdır.
- `notifyUser`: `true` olduğunda, compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin, "Bağlam compact ediliyor..." ve "Compaction tamamlandı"). Compaction işlemini sessiz tutmak için varsayılan olarak devre dışıdır.
- `memoryFlush`: kalıcı anıları depolamak için otomatik compaction öncesinde sessiz ajanlı tur. Bu bakım turu yerel bir modelde kalmalıysa `model` değerini `ollama/qwen3:8b` gibi tam bir sağlayıcı/model olarak ayarlayın; geçersiz kılma, aktif oturum geri dönüş zincirini devralmaz. Çalışma alanı salt okunur olduğunda atlanır.

### `agents.defaults.runRetries`

Hata kurtarma sırasında sonsuz yürütme döngülerini önlemek için gömülü ajan çalışma zamanı için dış çalıştırma döngüsü yeniden deneme yineleme sınırları. Bu ayarın şu anda ACP veya CLI çalışma zamanları için değil, yalnızca gömülü ajan çalışma zamanı için geçerli olduğunu unutmayın.

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
- `perProfile`: her geri dönüş profili adayı için verilen ek çalıştırma yeniden deneme yinelemeleri. Varsayılan: `8`.
- `min`: çalıştırma yeniden deneme yinelemeleri için en düşük mutlak sınır. Varsayılan: `32`.
- `max`: kontrolden çıkan yürütmeyi önlemek için çalıştırma yeniden deneme yinelemeleri için en yüksek mutlak sınır. Varsayılan: `160`.

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
- `ttl`, budamanın ne sıklıkla tekrar çalışabileceğini denetler (son önbellek temasından sonra).
- Budama önce fazla büyük araç sonuçlarını yumuşak kırpar, ardından gerekirse daha eski araç sonuçlarını sert temizler.
- `softTrimRatio` ve `hardClearRatio`, `0.0` ile `1.0` arasındaki değerleri kabul eder; yapılandırma doğrulaması bu aralığın dışındaki değerleri reddeder.

**Yumuşak kırpma** başı + sonu tutar ve ortaya `...` ekler.

**Sert temizleme** tüm araç sonucunu yer tutucuyla değiştirir.

Notlar:

- Görüntü blokları asla kırpılmaz/temizlenmez.
- Oranlar karakter tabanlıdır (yaklaşık), kesin token sayıları değildir.
- `keepLastAssistants` değerinden daha az asistan mesajı varsa budama atlanır.

</Accordion>

Davranış ayrıntıları için bkz. [Oturum Budama](/tr/concepts/session-pruning).

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

- Telegram dışı kanallar blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerektirir.
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına varyantlar). Signal/Slack/Discord/Google Chat varsayılanı `minChars: 1500`.
- `humanDelay`: blok yanıtları arasında rastgele duraklama. `natural` = 800-2500 ms. Ajan başına geçersiz kılma: `agents.list[].humanDelay`.

Davranış + parçalama ayrıntıları için bkz. [Akış](/tr/concepts/streaming).

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

Bkz. [Yazıyor Göstergeleri](/tr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü ajan için isteğe bağlı sandbox kullanımı. Tam kılavuz için bkz. [Sandboxing](/tr/gateway/sandboxing).

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
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH'ye iletilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw tarafından çalışma zamanında geçici dosyalara materyalize edilen satır içi içerikler veya SecretRef'ler
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ana makine anahtarı ilkesi ayar düğmeleri

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` üzerine önceliklidir
- `certificateData`, `certificateFile` üzerine önceliklidir
- `knownHostsData`, `knownHostsFile` üzerine önceliklidir
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce aktif gizli bilgiler çalışma zamanı anlık görüntüsünden çözümlenir

**SSH arka uç davranışı:**

- oluşturma veya yeniden oluşturmadan sonra uzak çalışma alanını bir kez hazırlar
- ardından uzak SSH çalışma alanını kanonik tutar
- `exec`, dosya araçları ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri ana makineye otomatik olarak geri eşitlemez
- sandbox tarayıcı kapsayıcılarını desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox çalışma alanı
- `ro`: `/workspace` konumunda sandbox çalışma alanı, `/agent` konumunda salt okunur bağlanan ajan çalışma alanı
- `rw`: `/workspace` konumunda okuma/yazma olarak bağlanan ajan çalışma alanı

**Kapsam:**

- `session`: oturum başına kapsayıcı + çalışma alanı
- `agent`: ajan başına bir kapsayıcı + çalışma alanı (varsayılan)
- `shared`: paylaşılan kapsayıcı ve çalışma alanı (oturumlar arası yalıtım yok)

**OpenShell plugin yapılandırması:**

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

- `mirror`: çalıştırmadan önce uzak ortamı yerelden başlatır, çalıştırmadan sonra geri eşitler; yerel çalışma alanı kanonik kalır
- `remote`: korumalı alan oluşturulduğunda uzak ortamı bir kez başlatır, ardından uzak çalışma alanını kanonik tutar

`remote` modunda, OpenClaw dışında yapılan ana makine yerelindeki düzenlemeler, başlatma adımından sonra korumalı alana otomatik olarak eşitlenmez.
Taşıma, OpenShell korumalı alanına SSH ile yapılır, ancak korumalı alan yaşam döngüsüne ve isteğe bağlı mirror eşitlemesine Plugin sahiptir.

**`setupCommand`**, konteyner oluşturulduktan sonra bir kez çalışır (`sh -lc` üzerinden). Ağ çıkışı, yazılabilir kök dizin ve root kullanıcısı gerektirir.

**Konteynerlerin varsayılanı `network: "none"`** — ajanın dışarı erişime ihtiyacı varsa `"bridge"` olarak ayarlayın (veya özel bir bridge ağı kullanın).
`"host"` engellenir. `"container:<id>"`, açıkça
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` ayarlamadığınız sürece varsayılan olarak engellenir (acil durum).
Etkin bir OpenClaw korumalı alanındaki Codex uygulama sunucusu turları, yerel kod modu ağ erişimleri için aynı çıkış ayarını kullanır.

**Gelen ekler**, etkin çalışma alanında `media/inbound/*` içine hazırlanır.

**`docker.binds`**, ek ana makine dizinlerini bağlar; genel ve ajan başına bağlamalar birleştirilir.

**Korumalı alan tarayıcısı** (`sandbox.browser.enabled`): bir konteyner içinde Chromium + CDP. noVNC URL'si sistem istemine enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulaması kullanır ve OpenClaw, parolayı paylaşılan URL'de göstermek yerine kısa ömürlü bir token URL'si üretir.

- `allowHostControl: false` (varsayılan), korumalı alan oturumlarının ana makine tarayıcısını hedeflemesini engeller.
- `network` varsayılanı `openclaw-sandbox-browser` olur (özel bridge ağı). Yalnızca genel bridge bağlantısını açıkça istediğinizde `bridge` olarak ayarlayın.
- `cdpSourceRange`, isteğe bağlı olarak konteyner sınırındaki CDP girişini bir CIDR aralığıyla sınırlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek ana makine dizinlerini yalnızca korumalı alan tarayıcı konteynerine bağlar. Ayarlandığında (`[]` dahil), tarayıcı konteyneri için `docker.binds` değerinin yerini alır.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlanır ve konteyner ana makineleri için ayarlanmıştır:
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
  - İş akışınız bunlara bağlıysa `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    uzantıları yeniden etkinleştirir.
  - `--renderer-process-limit=2`, `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`
    ile değiştirilebilir; Chromium'un varsayılan işlem sınırını kullanmak için `0` ayarlayın.
  - ayrıca `noSandbox` etkin olduğunda `--no-sandbox`.
  - Varsayılanlar konteyner imajı temelidir; konteyner varsayılanlarını değiştirmek için özel
    giriş noktası olan özel bir tarayıcı imajı kullanın.

</Accordion>

Tarayıcı korumalı alanı ve `sandbox.docker.binds` yalnızca Docker içindir.

İmajları derleyin (kaynak checkout üzerinden):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Kaynak checkout olmadan npm kurulumları için satır içi `docker build` komutları adına [Korumalı Alan § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

### `agents.list` (ajan başına geçersiz kılmalar)

Bir ajana kendi TTS sağlayıcısını, sesini, modelini,
stilini veya otomatik TTS modunu vermek için `agents.list[].tts` kullanın. Ajan bloğu, genel
`messages.tts` üzerine derin birleştirme yapar; böylece paylaşılan kimlik bilgileri tek yerde kalabilir ve tekil
ajanlar yalnızca ihtiyaç duydukları ses veya sağlayıcı alanlarını geçersiz kılar. Etkin ajanın
geçersiz kılması otomatik sesli yanıtlara, `/tts audio`, `/tts status` komutlarına ve
`tts` ajan aracına uygulanır. Sağlayıcı örnekleri ve öncelik sırası için [Metinden sese](/tr/tools/tts#per-agent-voice-overrides)
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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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

- `id`: kararlı ajan kimliği (zorunlu).
- `default`: birden fazla ayarlanırsa ilki kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa listedeki ilk giriş varsayılan olur.
- `model`: dize biçimi, model yedeği olmayan katı bir ajan başına birincil model ayarlar; nesne biçimi `{ primary }` de `fallbacks` eklemediğiniz sürece katıdır. O ajanı yedeğe dahil etmek için `{ primary, fallbacks: [...] }` kullanın veya katı davranışı açık hale getirmek için `{ primary, fallbacks: [] }` kullanın. Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamadığınız sürece varsayılan yedekleri devralmaya devam eder.
- `params`: ajan başına akış parametreleri, `agents.defaults.models` içindeki seçili model girdisinin üzerine birleştirilir. Bunu, model kataloğunun tamamını çoğaltmadan `cacheRetention`, `temperature` veya `maxTokens` gibi ajana özgü geçersiz kılmalar için kullanın.
- `tts`: isteğe bağlı ajan başına metinden sese geçersiz kılmaları. Blok `messages.tts` üzerine derin birleştirme yapar; bu nedenle paylaşılan sağlayıcı kimlik bilgilerini ve yedek politikasını `messages.tts` içinde tutun, burada yalnızca sağlayıcı, ses, model, stil veya otomatik mod gibi kişiliğe özgü değerleri ayarlayın.
- `skills`: isteğe bağlı ajan başına Skills izin listesi. Atlanırsa ajan, ayarlandığında `agents.defaults.skills` değerini devralır; açık bir liste, birleştirme yapmak yerine varsayılanların yerini alır ve `[]` Skills olmadığı anlamına gelir.
- `thinkingDefault`: isteğe bağlı ajan başına varsayılan düşünme düzeyi (`off | minimal | low | medium | high | xhigh | adaptive | max`). İleti veya oturum başına geçersiz kılma ayarlanmadığında bu ajan için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Seçili sağlayıcı/model profili hangi değerlerin geçerli olduğunu denetler; Google Gemini için `adaptive`, sağlayıcıya ait dinamik düşünmeyi korur (Gemini 3/3.1'de `thinkingLevel` atlanır, Gemini 2.5'te `thinkingBudget: -1`).
- `reasoningDefault`: isteğe bağlı ajan başına varsayılan akıl yürütme görünürlüğü (`on | off | stream`). İleti veya oturum başına akıl yürütme geçersiz kılması ayarlanmadığında bu ajan için `agents.defaults.reasoningDefault` değerini geçersiz kılar.
- `fastModeDefault`: hızlı mod için isteğe bağlı ajan başına varsayılan (`"auto" | true | false`). İleti veya oturum başına hızlı mod geçersiz kılması ayarlanmadığında uygulanır.
- `models`: tam `provider/model` kimlikleriyle anahtarlanan isteğe bağlı ajan başına model kataloğu/çalışma zamanı geçersiz kılmaları. Ajan başına çalışma zamanı istisnaları için `models["provider/model"].agentRuntime` kullanın.
- `runtime`: isteğe bağlı ajan başına çalışma zamanı tanımlayıcısı. Ajanın varsayılan olarak ACP harness oturumlarını kullanması gerektiğinde `runtime.acp` varsayılanları (`agent`, `backend`, `mode`, `cwd`) ile `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göreli yol, `http(s)` URL'si veya `data:` URI'si.
- Yerel, çalışma alanına göreli `identity.avatar` görsel dosyaları 2 MB ile sınırlıdır. `http(s)` URL'leri ve `data:` URI'leri yerel dosya boyutu sınırıyla denetlenmez.
- `identity` varsayılanları türetir: `emoji` üzerinden `ackReaction`, `name`/`emoji` üzerinden `mentionPatterns`.
- `subagents.allowAgents`: açık `sessions_spawn.agentId` hedefleri için yapılandırılmış ajan kimliklerinin izin listesi (`["*"]` = yapılandırılmış herhangi bir hedef; varsayılan: yalnızca aynı ajan). Kendi kendini hedefleyen `agentId` çağrılarına izin verilmesi gerekiyorsa istekte bulunan kimliği dahil edin. Ajan yapılandırması silinmiş eski girdiler `sessions_spawn` tarafından reddedilir ve `agents_list` içinden çıkarılır; bunları temizlemek için `openclaw doctor --fix` çalıştırın veya bu hedefin varsayılanları devralırken spawn edilebilir kalması gerekiyorsa en az bir `agents.list[]` girdisi ekleyin.
- Korumalı alan devralma koruması: istekte bulunan oturum korumalı alandaysa, `sessions_spawn` korumasız çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda, `agentId` değerini atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar; varsayılan: false).

---

## Çok ajanlı yönlendirme

Tek bir Gateway içinde birden fazla yalıtılmış ajan çalıştırın. [Çok Ajanlı](/tr/concepts/multi-agent) bölümüne bakın.

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

- `type` (isteğe bağlı): normal yönlendirme için `route` (eksik type varsayılan olarak route olur), kalıcı ACP konuşma bağlamaları için `acp`.
- `match.channel` (zorunlu)
- `match.accountId` (isteğe bağlı; `*` = herhangi bir hesap; atlanırsa = varsayılan hesap)
- `match.peer` (isteğe bağlı; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özgü)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Deterministik eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam, peer/guild/team yok)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan ajan

Her katmanda, eşleşen ilk `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw, tam konuşma kimliğine göre çözümler (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki route bağlama katman sırasını kullanmaz.

### Ajan başına erişim profilleri

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

Öncelik ayrıntıları için [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

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
      mode: "enforce", // enforce (default) | warn
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
  - `per-sender` (varsayılan): her gönderici, bir kanal bağlamı içinde yalıtılmış bir oturum alır.
  - `global`: bir kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam amaçlandığında kullanın).
- **`dmScope`**: DM'lerin nasıl gruplandığı.
  - `main`: tüm DM'ler ana oturumu paylaşır.
  - `per-peer`: kanallar genelinde gönderici kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderici başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderici başına yalıtır (çok hesaplı kullanım için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kanonik kimlikleri sağlayıcı önekli eşlerle eşler. `/dock_discord` gibi dock komutları, etkin oturumun yanıt rotasını başka bir bağlı kanal eşine geçirmek için aynı eşlemeyi kullanır; bkz. [Kanal yerleştirme](/tr/concepts/channel-docking).
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saatle `atHour` değerinde sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. İkisi de yapılandırıldığında, önce süresi dolan kazanır. Günlük sıfırlama güncelliği oturum satırının `sessionStartedAt` değerini kullanır; boşta sıfırlama güncelliği `lastInteractionAt` değerini kullanır. Heartbeat, Cron uyanmaları, exec bildirimleri ve Gateway kayıt tutma gibi arka plan/sistem olayı yazımları `updatedAt` değerini güncelleyebilir, ancak günlük/boşta oturumları güncel tutmaz.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`mainKey`**: eski alan. Çalışma zamanı, ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: ajandan ajana alışverişler sırasında ajanlar arasındaki en fazla karşılıklı yanıt turu sayısı (tam sayı, aralık: `0`-`20`, varsayılan: `5`). `0`, ping-pong zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleştirir. İlk deny kazanır.
- **`maintenance`**: oturum deposu temizleme + saklama denetimleri.
  - `mode`: `enforce` temizlemeyi uygular ve varsayılandır; `warn` yalnızca uyarı yayar.
  - `pruneAfter`: eski girdiler için yaş kesme sınırı (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki en fazla girdi sayısı (varsayılan `500`). Çalışma zamanı, üretim boyutundaki sınırlar için küçük bir yüksek su tamponuyla toplu temizleme yazar; `openclaw sessions cleanup --enforce` sınırı hemen uygular.
  - Kısa ömürlü Gateway model çalıştırma yoklama oturumları sabit `24h` saklama kullanır, ancak temizleme baskıya bağlıdır: yalnızca oturum girdisi bakım/sınır baskısına ulaşıldığında eski katı model çalıştırma yoklama satırlarını kaldırır. Yalnızca `agent:*:explicit:model-run-<uuid>` ile eşleşen katı açık yoklama anahtarları uygundur; normal doğrudan, grup, iş parçacığı, Cron, hook, Heartbeat, ACP ve alt ajan oturumları bu 24h saklamayı devralmaz. Model çalıştırma temizliği çalıştığında, daha geniş `pruneAfter` eski girdi temizliğinden ve `maxEntries` sınırından önce çalışır.
  - `rotateBytes`: kullanımdan kaldırılmıştır ve yok sayılır; `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.
  - `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama. Varsayılan olarak `pruneAfter`; devre dışı bırakmak için `false` olarak ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturumlar dizini disk bütçesi. `warn` modunda uyarıları günlüğe yazar; `enforce` modunda önce en eski yapıtları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonraki isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `%80`'i.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan hareketsizlikte otomatik odaktan çıkarma (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan katı en yüksek yaş (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `spawnSessions`: `sessions_spawn` ve ACP iş parçacığı spawn'larından iş parçacığına bağlı çalışma oturumları oluşturmak için varsayılan kapı. İş parçacığı bağlamaları etkinleştirildiğinde varsayılan olarak `true`; sağlayıcılar/hesaplar geçersiz kılabilir.
  - `defaultSpawnContext`: iş parçacığına bağlı spawn'lar için varsayılan yerel alt ajan bağlamı (`"fork"` veya `"isolated"`). Varsayılan olarak `"fork"`.

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

Çözümleme (en özel olan kazanır): hesap → kanal → genel. `""` devre dışı bırakır ve kademeyi durdurur. `"auto"`, `[{identity.name}]` türetir.

**Şablon değişkenleri:**

| Değişken          | Açıklama                  | Örnek                       |
| ----------------- | ------------------------- | --------------------------- |
| `{model}`         | Kısa model adı            | `claude-opus-4-6`           |
| `{modelFull}`     | Tam model tanımlayıcısı   | `anthropic/claude-opus-4-6` |
| `{provider}`      | Sağlayıcı adı             | `anthropic`                 |
| `{thinkingLevel}` | Geçerli düşünme düzeyi    | `high`, `low`, `off`        |
| `{identity.name}` | Ajan kimliği adı          | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarsızdır. `{think}`, `{thinkingLevel}` için bir takma addır.

### Ack tepkisi

- Varsayılan olarak etkin ajanın `identity.emoji` değeri, aksi halde `"👀"`. Devre dışı bırakmak için `""` olarak ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik yedeği.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram, WhatsApp ve iMessage gibi tepki destekli kanallarda yanıttan sonra ack tepkisini kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord, Telegram ve WhatsApp üzerinde yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord üzerinde, ayarlanmamışsa ack tepkileri etkin olduğunda durum tepkileri etkin kalır.
  Telegram ve WhatsApp üzerinde, yaşam döngüsü durum tepkilerini etkinleştirmek için açıkça `true` olarak ayarlayın.
- `messages.statusReactions.emojis`: yaşam döngüsü emoji anahtarlarını geçersiz kılar:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` ve `stallHard`.
  Telegram yalnızca sabit bir tepki kümesine izin verir, bu nedenle desteklenmeyen yapılandırılmış emojiler
  o sohbet için en yakın desteklenen durum çeşidine geri döner.

### Gelen debounce

Aynı göndericiden gelen hızlı, yalnızca metin mesajlarını tek bir ajan turunda toplar. Medya/ekler hemen boşaltılır. Denetim komutları debounce işlemini atlar.

### TTS (metinden konuşmaya)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` varsayılan otomatik TTS modunu denetler: `off`, `always`, `inbound` veya `tagged`. `/tts on|off` yerel tercihleri geçersiz kılabilir ve `/tts status` etkin durumu gösterir.
- `summaryModel`, otomatik özet için `agents.defaults.model.primary` değerini geçersiz kılar.
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılanı `false` değeridir (katılım gerektirir).
- API anahtarları yedek olarak `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` kullanır.
- Birlikte gelen konuşma sağlayıcıları Plugin sahibidir. `plugins.allow` ayarlanmışsa, kullanmak istediğiniz her TTS sağlayıcı Plugin'ini ekleyin; örneğin Edge TTS için `microsoft`. Eski `edge` sağlayıcı kimliği, `microsoft` için takma ad olarak kabul edilir.
- `providers.openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası yapılandırma, ardından `OPENAI_TTS_BASE_URL`, ardından `https://api.openai.com/v1` şeklindedir.
- `providers.openai.baseUrl` OpenAI dışı bir uç noktayı gösterdiğinde, OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak değerlendirir ve model/ses doğrulamasını gevşetir.

---

## Konuşma

Konuşma modu için varsayılanlar (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
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
          speakerVoice: "cedar",
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

- Birden çok Konuşma sağlayıcısı yapılandırıldığında, `talk.provider` `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Konuşma anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir. Kalıcı yapılandırmayı `talk.providers.<provider>` biçimine yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- Ses kimlikleri yedek olarak `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` kullanır.
- `providers.*.apiKey`, düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` yedeği yalnızca hiçbir Konuşma API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Konuşma yönergelerinin kullanıcı dostu adlar kullanmasını sağlar.
- `providers.mlx.modelId`, macOS yerel MLX yardımcısı tarafından kullanılan Hugging Face deposunu seçer. Atlanırsa macOS `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatma, mevcut olduğunda birlikte gelen `openclaw-mlx-tts` yardımcısı üzerinden veya `PATH` üzerinde bulunan bir yürütülebilir dosya üzerinden çalışır; `OPENCLAW_MLX_TTS_BIN` geliştirme için yardımcı yolunu geçersiz kılar.
- `consultThinkingLevel`, Control UI Talk gerçek zamanlı `openclaw_agent_consult` çağrılarının arkasındaki tam OpenClaw ajan çalıştırması için düşünme seviyesini denetler. Normal oturum/model davranışını korumak için ayarlanmamış bırakın.
- `consultFastMode`, oturumun normal hızlı mod ayarını değiştirmeden Control UI Talk gerçek zamanlı danışmaları için tek seferlik hızlı mod geçersiz kılması ayarlar.
- `speechLocale`, iOS/macOS Konuşma konuşma tanıma tarafından kullanılan BCP 47 yerel ayar kimliğini ayarlar. Cihaz varsayılanını kullanmak için ayarlanmamış bırakın.
- `silenceTimeoutMs`, Konuşma modunun kullanıcı sessizliğinden sonra dökümü göndermeden önce ne kadar bekleyeceğini denetler. Ayarlanmamışsa platform varsayılan duraklama penceresi korunur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`).
- `realtime.instructions`, sağlayıcıya yönelik sistem yönergelerini OpenClaw'ın yerleşik gerçek zamanlı istemine ekler; böylece varsayılan `openclaw_agent_consult` rehberliği kaybedilmeden ses tarzı yapılandırılabilir.
- `realtime.consultRouting`, gerçek zamanlı sağlayıcı `openclaw_agent_consult` olmadan nihai bir kullanıcı dökümü ürettiğinde Gateway aktarma yedeğini denetler: `provider-direct` doğrudan sağlayıcı yanıtlarını korurken, `force-agent-consult` sonlandırılmış isteği OpenClaw üzerinden yönlendirir.

---

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer tüm yapılandırma anahtarları
- [Yapılandırma](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
