---
read_when:
    - Ajan varsayılanlarını ayarlama (modeller, düşünme, çalışma alanı, Heartbeat, medya, Skills)
    - Çok aracılı yönlendirmeyi ve bağlamaları yapılandırma
    - Oturum, ileti teslimi ve konuşma modu davranışını ayarlama
summary: Ajan varsayılanları, çoklu ajan yönlendirmesi, oturum, mesajlar ve konuşma yapılandırması
title: Yapılandırma — ajanlar
x-i18n:
    generated_at: "2026-07-03T17:36:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

Aracı kapsamlı yapılandırma anahtarları `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` ve `talk.*` altındadır. Kanallar, araçlar, Gateway çalışma zamanı ve diğer
üst düzey anahtarlar için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Aracı varsayılanları

### `agents.defaults.workspace`

Varsayılan: ayarlandığında `OPENCLAW_WORKSPACE_DIR`, aksi halde `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Açık bir `agents.defaults.workspace` değeri
`OPENCLAW_WORKSPACE_DIR` değerinden önceliklidir. Bu yolu yapılandırmaya yazmak istemediğinizde
varsayılan aracıları bağlı bir çalışma alanına yönlendirmek için ortam değişkenini kullanın.

### `agents.defaults.repoRoot`

Sistem isteminin Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmazsa OpenClaw, çalışma alanından yukarı doğru ilerleyerek otomatik algılar.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` ayarlamayan aracılar için isteğe bağlı varsayılan Skills izin listesi.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
      { id: "locked-down", skills: [] }, // skills yok
    ],
  },
}
```

- Varsayılan olarak sınırsız skills için `agents.defaults.skills` öğesini atlayın.
- Varsayılanları devralmak için `agents.list[].skills` öğesini atlayın.
- Skills olmaması için `agents.list[].skills: []` olarak ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o aracı için son kümedir;
  varsayılanlarla birleştirilmez.

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

- `"continuation-skip"`: güvenli devam dönüşleri (tamamlanmış bir asistan yanıtından sonra) çalışma alanı bootstrap yeniden enjeksiyonunu atlayarak istem boyutunu azaltır. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler yine de bağlamı yeniden oluşturur.
- `"never"`: her dönüşte çalışma alanı bootstrap ve bağlam dosyası enjeksiyonunu devre dışı bırakır. Bunu yalnızca istem yaşam döngüsünün tamamına sahip olan aracılar için kullanın (özel bağlam motorları, kendi bağlamlarını oluşturan yerel çalışma zamanları veya özel bootstrap gerektirmeyen iş akışları). Heartbeat ve Compaction kurtarma dönüşleri de enjeksiyonu atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Aracı başına geçersiz kılma: `agents.list[].contextInjection`. Atlanan değerler
`agents.defaults.contextInjection` değerini devralır.

### `agents.defaults.bootstrapMaxChars`

Kısaltmadan önce çalışma alanı bootstrap dosyası başına en fazla karakter. Varsayılan: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Aracı başına geçersiz kılma: `agents.list[].bootstrapMaxChars`. Atlanan değerler
`agents.defaults.bootstrapMaxChars` değerini devralır.

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı bootstrap dosyaları genelinde enjekte edilen en fazla toplam karakter. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Aracı başına geçersiz kılma: `agents.list[].bootstrapTotalMaxChars`. Atlanan değerler
`agents.defaults.bootstrapTotalMaxChars` değerini devralır.

### Aracı başına bootstrap profili geçersiz kılmaları

Bir aracının paylaşılan varsayılanlardan farklı istem enjeksiyonu davranışına
ihtiyacı olduğunda aracı başına bootstrap profili geçersiz kılmalarını kullanın. Atlanan alanlar
`agents.defaults` değerinden devralır.

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

Bootstrap bağlamı kısaltıldığında aracıya görünür sistem istemi bildirimini denetler.
Varsayılan: `"always"`.

- `"off"`: kısaltma bildirimi metnini sistem istemine asla enjekte etmez.
- `"once"`: benzersiz kısaltma imzası başına kısa bir bildirimi bir kez enjekte eder.
- `"always"`: kısaltma varsa her çalıştırmada kısa bir bildirim enjekte eder (önerilir).

Ayrıntılı ham/enjekte edilmiş sayımlar ve yapılandırma ayarlama alanları,
bağlam/durum raporları ve günlükler gibi tanılarda kalır; rutin WebChat kullanıcı/çalışma zamanı bağlamı yalnızca
kısa kurtarma bildirimini alır.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw'da birden fazla yüksek hacimli istem/bağlam bütçesi vardır ve bunlar
tek bir genel düğmeden akmak yerine kasıtlı olarak alt sisteme göre bölünmüştür.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı bootstrap enjeksiyonu.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil olmak üzere tek seferlik reset/startup model çalıştırma başlangıcı. Çıplak sohbet `/new` ve `/reset` komutları,
  modeli çağırmadan onaylanır.
- `skills.limits.*`:
  sistem istemine enjekte edilen kompakt skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipli bloklar.
- `memory.qmd.limits.*`:
  dizinlenmiş bellek arama parçacığı ve enjeksiyon boyutlandırması.

Yalnızca bir aracının farklı bir bütçeye ihtiyacı olduğunda eşleşen aracı başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Reset/startup model çalıştırmalarında enjekte edilen ilk dönüş startup başlangıcını denetler.
Çıplak sohbet `/new` ve `/reset` komutları, modeli çağırmadan reset işlemini onaylar,
bu nedenle bu başlangıcı yüklemezler.

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

- `memoryGetMaxChars`: kısaltma meta verileri ve devam bildirimi eklenmeden önce varsayılan `memory_get` alıntı sınırı.
- `memoryGetDefaultLines`: `lines` atlandığında varsayılan `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcı sonuçlar ve taşma kurtarması için kullanılan gelişmiş canlı araç sonucu tavanı. Model bağlamı otomatik sınırı için ayarlamadan bırakın:
  100K token altı için `16000` karakter, 100K+ token için `32000` karakter ve 200K+ token için `64000`
  karakter. Uzun bağlamlı modeller için `1000000` değerine kadar açık değerler kabul edilir,
  ancak etkili sınır yine de model bağlam penceresinin yaklaşık %30'u ile sınırlıdır. `openclaw doctor --deep` etkili sınırı yazdırır
  ve doctor yalnızca açık bir geçersiz kılma bayat olduğunda veya etkisiz olduğunda uyarır.
- `postCompactionMaxChars`: Compaction sonrası yenileme enjeksiyonu sırasında kullanılan AGENTS.md alıntı sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` düğmeleri için aracı başına geçersiz kılma. Atlanan alanlar
`agents.defaults.contextLimits` değerinden devralır.

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
          toolResultMaxChars: 8000, // bu aracı için gelişmiş tavan
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Sistem istemine enjekte edilen kompakt skills listesi için genel sınır. Bu,
`SKILL.md` dosyalarının istek üzerine okunmasını etkilemez.

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

Skills istem bütçesi için aracı başına geçersiz kılma.

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

Sağlayıcı çağrılarından önce transcript/araç görüntü bloklarında en uzun görüntü kenarı için en fazla piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision-token kullanımını ve istek yükü boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Dosya yollarından, URL'lerden ve medya referanslarından yüklenen görüntüler için görüntü aracı sıkıştırma/ayrıntı tercihi.
Varsayılan: `auto`.

OpenClaw, yeniden boyutlandırma basamağını seçilen görüntü modeline uyarlar. Örneğin Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL ve barındırılan Llama 4 vision modelleri, eski/varsayılan yüksek ayrıntılı vision yollarına göre daha büyük görüntüler kullanabilir; çok görüntülü dönüşler ise token ve gecikme maliyetini denetlemek için `auto` modunda daha agresif sıkıştırılır.

Değerler:

- `auto`: model sınırlarına ve görüntü sayısına uyarlanır.
- `efficient`: daha düşük token ve bayt kullanımı için daha küçük görüntüleri tercih eder.
- `balanced`: standart orta yol basamağını kullanır.
- `high`: ekran görüntüleri, diyagramlar ve belge görüntüleri için daha fazla ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
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

Sistem istemindeki saat biçimi. Varsayılan: `auto` (OS tercihi).

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
  - Nesne biçimi, birincil modeli ve sıralı yük devretme modellerini ayarlar.
- `imageModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - `image` araç yolu tarafından vision-model yapılandırması olarak kullanılır.
  - Seçilen/varsayılan model görüntü girdisi kabul edemediğinde yedek yönlendirme olarak da kullanılır.
  - Açık `provider/model` başvurularını tercih edin. Çıplak kimlikler uyumluluk için kabul edilir; çıplak bir kimlik `models.providers.*.models` içinde yapılandırılmış görüntü destekli bir girdiye benzersiz şekilde eşleşirse, OpenClaw bunu o sağlayıcıya niteler. Belirsiz yapılandırılmış eşleşmeler açık bir sağlayıcı öneki gerektirir.
- `imageGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görüntü oluşturma yeteneği ve görüntü oluşturan gelecekteki herhangi bir araç/Plugin yüzeyi tarafından kullanılır.
  - Tipik değerler: yerel Gemini görüntü oluşturma için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev`, OpenAI Images için `openai/gpt-image-2` veya saydam arka planlı OpenAI PNG/WebP çıktısı için `openai/gpt-image-1.5`.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Atlanırsa, `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı görüntü oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
- `musicGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik oluşturma yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Atlanırsa, `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video oluşturma yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa, `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanını çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı video oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Resmi Qwen video oluşturma Plugin'i en fazla 1 çıktı videosu, 1 girdi görüntüsü, 4 girdi videosu, 10 saniye süre ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirmesi için `pdf` aracı tarafından kullanılır.
  - Atlanırsa, PDF aracı önce `imageModel`'e, ardından çözümlenmiş oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı sırasında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyutu sınırı.
- `pdfMaxPages`: `pdf` aracındaki çıkarma yedek modu tarafından dikkate alınan varsayılan maksimum sayfa sayısı.
- `verboseDefault`: aracılar için varsayılan ayrıntılılık düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `toolProgressDetail`: `/verbose` araç özetleri ve ilerleme taslağı araç satırları için ayrıntı modu. Değerler: `"explain"` (varsayılan, kısa insan okunur etiketler) veya `"raw"` (varsa ham komutu/ayrıntıyı ekler). Aracı başına `agents.list[].toolProgressDetail` bu varsayılanı geçersiz kılar.
- `reasoningDefault`: aracılar için varsayılan akıl yürütme görünürlüğü. Değerler: `"off"`, `"on"`, `"stream"`. Aracı başına `agents.list[].reasoningDefault` bu varsayılanı geçersiz kılar. Yapılandırılmış akıl yürütme varsayılanları yalnızca sahipler, yetkili gönderenler veya operatör-yönetici Gateway bağlamları için, ileti veya oturum başına bir akıl yürütme geçersiz kılması ayarlanmadığında uygulanır.
- `elevatedDefault`: aracılar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (ör. OpenAI API anahtarı veya Codex OAuth erişimi için `openai/gpt-5.5`). Sağlayıcıyı atlarsanız, OpenClaw önce bir takma ad dener, ardından bu tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner (kullanımdan kaldırılmış uyumluluk davranışı; bu nedenle açık `provider/model` tercih edin). Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw eski ve kaldırılmış bir sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models`: `/model` için yapılandırılmış model kataloğu ve izin listesi. Her girdi `alias` (kısayol) ve `params` (sağlayıcıya özgü; örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider` yönlendirmesi, `chat_template_kwargs`, `extra_body`/`extraBody`) içerebilir.
  - Her model kimliğini elle listelemeden seçili sağlayıcılar için keşfedilen tüm modelleri göstermek üzere `"openai/*": {}` veya `"vllm/*": {}` gibi `provider/*` girdileri kullanın.
  - O sağlayıcı için dinamik olarak keşfedilen her model aynı çalışma zamanını kullanmalıysa bir `provider/*` girdisine `agentRuntime` ekleyin. Tam `provider/model` çalışma zamanı ilkesi yine de joker karakterden önce gelir.
  - Güvenli düzenlemeler: girdiler eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece mevcut izin listesi girdilerini kaldıracak değiştirmeleri reddeder.
  - Sağlayıcı kapsamlı yapılandırma/onboarding akışları, seçilen sağlayıcı modellerini bu haritaya birleştirir ve zaten yapılandırılmış ilgisiz sağlayıcıları korur.
  - Doğrudan OpenAI Responses modelleri için sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` eklenmesini durdurmak için `params.responsesServerCompaction: false`, eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI sunucu tarafı Compaction](/tr/providers/openai#server-side-compaction-responses-api).
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` içinde ayarlanır (ör. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (genel temel), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır; ardından `agents.list[].params` (eşleşen aracı kimliği) anahtara göre geçersiz kılar. Ayrıntılar için bkz. [İstem Önbelleğe Alma](/tr/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: OpenRouter genelinde varsayılan sağlayıcı yönlendirme ilkesi. OpenClaw bunu OpenRouter'ın istek `provider` nesnesine iletir; model başına `agents.defaults.models["openrouter/<model>"].params.provider` ve aracı parametreleri anahtara göre geçersiz kılar. Bkz. [OpenRouter sağlayıcı yönlendirmesi](/tr/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu proxy'ler için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş geçiş JSON'u. Oluşturulan istek anahtarlarıyla çakışırsa, ek gövde kazanır; yerel olmayan completions rotaları yine de sonrasında yalnızca OpenAI'ye özgü `store` alanını çıkarır.
- `params.chat_template_kwargs`: üst düzey `api: "openai-completions"` istek gövdelerine birleştirilen vLLM/OpenAI uyumlu chat-template argümanları. Düşünme kapalıyken `vllm/nemotron-3-*` için, paketli vLLM Plugin'i otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir; açık `chat_template_kwargs` oluşturulan varsayılanları geçersiz kılar ve `extra_body.chat_template_kwargs` yine son önceliğe sahiptir. Yapılandırılmış vLLM Qwen ve Nemotron düşünme modelleri, çok düzeyli efor merdiveni yerine ikili `/think` seçenekleri (`off`, `on`) sunar.
- `compat.thinkingFormat`: OpenAI uyumlu düşünme yükü stili. Together tarzı `reasoning.enabled` için `"together"`, Qwen tarzı üst düzey `enable_thinking` için `"qwen"` veya vLLM gibi istek düzeyinde chat-template kwargs destekleyen Qwen ailesi arka uçlarında `chat_template_kwargs.enable_thinking` için `"qwen-chat-template"` kullanın. OpenClaw devre dışı düşünmeyi `false`, etkin düşünmeyi `true` olarak eşler ve yapılandırılmış vLLM Qwen modelleri bu biçimler için ikili `/think` seçenekleri sunar.
- `compat.supportedReasoningEfforts`: model başına OpenAI uyumlu akıl yürütme eforu listesi. Bunu gerçekten kabul eden özel uç noktalar için `"xhigh"` ekleyin; OpenClaw daha sonra bu yapılandırılmış sağlayıcı/model için komut menülerinde, Gateway oturum satırlarında, oturum yaması doğrulamasında, aracı CLI doğrulamasında ve `llm-task` doğrulamasında `/think xhigh` sunar. Arka uç kurallı bir düzey için sağlayıcıya özgü bir değer istiyorsa `compat.reasoningEffortMap` kullanın.
- `params.preserveThinking`: korunmuş düşünme için yalnızca Z.AI'ye özgü isteğe bağlı etkinleştirme. Etkinleştirildiğinde ve düşünme açıksa, OpenClaw `thinking.clear_thinking: false` gönderir ve önceki `reasoning_content` içeriğini yeniden oynatır; bkz. [Z.AI düşünme ve korunmuş düşünme](/tr/providers/zai#thinking-and-preserved-thinking).
- `localService`: yerel/kendi barındırılan model sunucuları için isteğe bağlı sağlayıcı düzeyinde süreç yöneticisi. Seçilen model o sağlayıcıya ait olduğunda, OpenClaw `healthUrl` adresini (veya `baseUrl + "/models"`) yoklar, uç nokta kapalıysa `command` komutunu `args` ile başlatır, en fazla `readyTimeoutMs` kadar bekler ve ardından model isteğini gönderir. `command` mutlak bir yol olmalıdır. `idleStopMs: 0` süreci OpenClaw çıkana kadar canlı tutar; pozitif bir değer, OpenClaw tarafından başlatılan süreci bu kadar boşta milisaniyeden sonra durdurur. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- Çalışma zamanı ilkesi `agents.defaults` üzerinde değil, sağlayıcılar veya modeller üzerinde olmalıdır. Sağlayıcı geneli kurallar için `models.providers.<provider>.agentRuntime`, modele özgü kurallar için `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` kullanın. Resmi OpenAI sağlayıcısındaki OpenAI aracı modelleri varsayılan olarak Codex'i seçer.
- Bu alanları değiştiren yapılandırma yazıcıları (örneğin `/models set`, `/models set-image` ve yedek ekleme/kaldırma komutları) kurallı nesne biçimini kaydeder ve mümkün olduğunda mevcut yedek listelerini korur.
- `maxConcurrent`: oturumlar genelinde en fazla paralel aracı çalıştırması (her oturum yine de seri hale getirilir). Varsayılan: 4.

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

- `id`: `"auto"`, `"openclaw"`, kayıtlı bir Plugin harness kimliği veya desteklenen bir CLI backend takma adı. Paketle gelen Codex Plugin'i `codex` kaydeder; paketle gelen Anthropic Plugin'i `claude-cli` CLI backend'ini sağlar.
- `id: "auto"`, kayıtlı Plugin harness'larının desteklenen turn'leri üstlenmesine izin verir ve hiçbir harness eşleşmediğinde OpenClaw kullanır. `id: "codex"` gibi açık bir Plugin runtime'ı bu harness'ı gerektirir ve kullanılamıyorsa ya da başarısız olursa kapalı şekilde başarısız olur.
- `id: "pi"`, yalnızca v2026.5.22 ve önceki sürümlerden yayımlanmış yapılandırmaları korumak için `openclaw` için kullanımdan kaldırılmış bir takma ad olarak kabul edilir. Yeni yapılandırma `openclaw` kullanmalıdır.
- Runtime önceliği önce tam model politikasıdır (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` veya `models.providers.<provider>.models[]`), ardından `agents.list[]` / `agents.defaults.models["provider/*"]`, ardından `models.providers.<provider>.agentRuntime` konumundaki sağlayıcı geneli politika gelir.
- Tüm ajan runtime anahtarları eski davranıştır. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, oturum runtime pin'leri ve `OPENCLAW_AGENT_RUNTIME`, runtime seçiminde yok sayılır. Eski değerleri kaldırmak için `openclaw doctor --fix` çalıştırın.
- OpenAI ajan modelleri varsayılan olarak Codex harness'ını kullanır; bunu açık hale getirmek istediğinizde provider/model `agentRuntime.id: "codex"` geçerliliğini korur.
- Claude CLI dağıtımları için `model: "anthropic/claude-opus-4-8"` ile birlikte model kapsamlı `agentRuntime.id: "claude-cli"` tercih edin. Eski `claude-cli/claude-opus-4-7` model ref'leri uyumluluk için hâlâ çalışır, ancak yeni yapılandırma provider/model seçimini kanonik tutmalı ve yürütme backend'ini provider/model runtime politikasına koymalıdır.
- Bu yalnızca metin ajan-turn yürütmesini kontrol eder. Medya üretimi, vision, PDF, müzik, video ve TTS hâlâ kendi provider/model ayarlarını kullanır.

**Yerleşik takma ad kısaltmaları** (yalnızca model `agents.defaults.models` içinde olduğunda geçerlidir):

| Takma ad            | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Yapılandırdığınız takma adlar her zaman varsayılanlara üstün gelir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarlamadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece thinking mode'u otomatik olarak etkinleştirir.
Z.AI modelleri, tool call streaming için varsayılan olarak `tool_stream` etkinleştirir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
Anthropic Claude Opus 4.8, OpenClaw içinde varsayılan olarak thinking'i kapalı tutar; adaptive thinking açıkça etkinleştirildiğinde, Anthropic'in sağlayıcıya ait effort varsayılanı `high` olur. Claude 4.6 modelleri, açık bir thinking düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.

### `agents.defaults.cliBackends`

Yalnızca metin fallback çalıştırmaları için isteğe bağlı CLI backend'leri (tool call yok). API sağlayıcıları başarısız olduğunda yedek olarak kullanışlıdır.

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

- CLI backend'leri metin önceliklidir; tool'lar her zaman devre dışıdır.
- Oturumlar `sessionArg` ayarlandığında desteklenir.
- Görsel geçişi, `imageArg` dosya yollarını kabul ettiğinde desteklenir.
- `reseedFromRawTranscriptWhenUncompacted: true`, bir backend'in ilk
  Compaction özeti var olmadan önce, sınırlı bir ham OpenClaw transkript
  kuyruğundan güvenli şekilde geçersiz kılınmış oturumları kurtarmasına izin
  verir. Auth profili veya credential-epoch değişiklikleri yine de asla ham
  yeniden tohumlama yapmaz.

### `agents.defaults.promptOverlays`

OpenClaw tarafından birleştirilmiş prompt yüzeylerine model ailesine göre uygulanan sağlayıcıdan bağımsız prompt overlay'leri. GPT-5 ailesi model kimlikleri, OpenClaw/sağlayıcı rotaları genelinde paylaşılan davranış sözleşmesini alır; `personality` yalnızca dostça etkileşim tarzı katmanını kontrol eder. Yerel Codex app-server rotaları bu OpenClaw GPT-5 overlay'i yerine Codex'e ait temel/model talimatlarını korur ve OpenClaw, yerel thread'ler için Codex'in yerleşik personality özelliğini devre dışı bırakır.

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

- `"friendly"` (varsayılan) ve `"on"` dostça etkileşim tarzı katmanını etkinleştirir.
- `"off"` yalnızca dostça katmanı devre dışı bırakır; etiketlenmiş GPT-5 davranış sözleşmesi etkin kalır.
- Eski `plugins.entries.openai.config.personality`, bu paylaşılan ayar belirlenmediğinde hâlâ okunur.

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

- `every`: süre dizesi (ms/s/m/h). Varsayılan: `30m` (API anahtarı auth) veya `1h` (OAuth auth). Devre dışı bırakmak için `0m` olarak ayarlayın.
- `includeSystemPromptSection`: false olduğunda, system prompt'tan Heartbeat bölümünü çıkarır ve bootstrap context'e `HEARTBEAT.md` enjeksiyonunu atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda, Heartbeat çalıştırmaları sırasında tool hata uyarısı payload'larını bastırır.
- `timeoutSeconds`: bir Heartbeat ajan turn'ü iptal edilmeden önce izin verilen saniye cinsinden en uzun süre. Ayarlanmazsa, ayarlanmışsa `agents.defaults.timeoutSeconds` kullanılır; aksi halde Heartbeat ritmi 600 saniyeyle sınırlandırılır.
- `directPolicy`: doğrudan/DM teslim politikası. `allow` (varsayılan) doğrudan hedef teslimine izin verir. `block` doğrudan hedef teslimini bastırır ve `reason=dm-blocked` üretir.
- `lightContext`: true olduğunda, Heartbeat çalıştırmaları hafif bootstrap context kullanır ve workspace bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her Heartbeat önceki konuşma geçmişi olmayan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı izolasyon kalıbıdır. Heartbeat başına token maliyetini yaklaşık 100K'dan yaklaşık 2-5K token'a düşürür.
- `skipWhenBusy`: true olduğunda, Heartbeat çalıştırmaları o ajanın ek meşgul şeritlerinde ertelenir: kendi session-keyed subagent veya nested command işi. Cron şeritleri bu bayrak olmasa bile Heartbeat'leri her zaman erteler.
- Ajan başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir ajan `heartbeat` tanımladığında, **yalnızca bu ajanlar** Heartbeat çalıştırır.
- Heartbeat'ler tam ajan turn'leri çalıştırır; daha kısa aralıklar daha fazla token tüketir.

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
- `provider`: kayıtlı bir compaction provider plugin kimliği. Ayarlandığında, yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` işlevi çağrılır. Başarısızlıkta yerleşiğe geri döner. Bir provider ayarlamak `mode: "safeguard"` değerini zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw işlemi iptal etmeden önce tek bir compaction işlemi için izin verilen en fazla saniye. Varsayılan: `180`.
- `keepRecentTokens`: en son transcript kuyruğunu olduğu gibi tutmak için agent kesme noktası bütçesi. Manuel `/compact`, açıkça ayarlandığında buna uyar; aksi halde manuel compaction katı bir checkpoint'tir.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, compaction özetlemesi sırasında yerleşik opak tanımlayıcı koruma yönergelerini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: safeguard özetleri için bozuk biçimli çıktı durumunda yeniden deneme kontrolleri. Safeguard modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` ayarlayın.
- `midTurnPrecheck`: isteğe bağlı tool-loop baskı kontrolü. `enabled: true` olduğunda OpenClaw, araç sonuçları eklendikten sonra ve sonraki model çağrısından önce context baskısını kontrol eder. Context artık sığmıyorsa, prompt'u göndermeden önce mevcut denemeyi iptal eder ve araç sonuçlarını kısaltmak veya compact edip yeniden denemek için mevcut ön kontrol kurtarma yolunu yeniden kullanır. Hem `default` hem de `safeguard` compaction modlarıyla çalışır. Varsayılan: devre dışı.
- `postCompactionSections`: compaction sonrasında yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Ayarlanmadığında veya `[]` olarak ayarlandığında yeniden enjeksiyon devre dışıdır. Açıkça `["Session Startup", "Red Lines"]` ayarlamak bu çifti etkinleştirir ve eski `Every Session`/`Safety` geri dönüşünü korur. Bunu yalnızca ek context, compaction özetinde zaten yakalanmış proje yönergelerini çoğaltma riskine değdiğinde etkinleştirin.
- `model`: yalnızca compaction özetlemesi için isteğe bağlı `provider/model-id` veya `agents.defaults.models` içinden yalın alias. Yalın alias'lar dispatch öncesinde çözümlenir; yapılandırılmış literal model kimlikleri çakışmalarda önceliğini korur. Ana oturumun bir modeli koruması, ancak compaction özetlerinin başka bir modelde çalışması gerektiğinde bunu kullanın; ayarlanmadığında compaction, oturumun birincil modelini kullanır.
- `maxActiveTranscriptBytes`: etkin JSONL eşik değerini aştığında bir çalıştırmadan önce normal yerel compaction tetikleyen isteğe bağlı byte eşiği (`number` veya `"20mb"` gibi dizeler). Başarılı compaction'ın daha küçük bir ardıl transcript'e dönebilmesi için `truncateAfterCompaction` gerektirir. Ayarlanmadığında veya `0` olduğunda devre dışıdır.
- `notifyUser`: `true` olduğunda, compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin, "Context compact ediliyor..." ve "Compaction tamamlandı"). Compaction'ı sessiz tutmak için varsayılan olarak devre dışıdır.
- `memoryFlush`: dayanıklı memory'leri depolamak için otomatik compaction öncesinde sessiz agentic turn. Bu bakım turn'ünün yerel bir modelde kalması gerektiğinde `model` değerini `ollama/qwen3:8b` gibi tam bir provider/model olarak ayarlayın; override, etkin oturum geri dönüş zincirini devralmaz. Workspace salt okunur olduğunda atlanır.

### `agents.defaults.runRetries`

Hata kurtarma sırasında sonsuz yürütme döngülerini önlemek için gömülü agent runtime için dış çalıştırma döngüsü yeniden deneme iterasyonu sınırları. Bu ayarın şu anda ACP veya CLI runtime'ları için değil, yalnızca gömülü agent runtime için geçerli olduğunu unutmayın.

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

- `base`: dış çalıştırma döngüsü için temel run retry iterasyonu sayısı. Varsayılan: `24`.
- `perProfile`: fallback profile adayı başına verilen ek run retry iterasyonları. Varsayılan: `8`.
- `min`: run retry iterasyonları için minimum mutlak sınır. Varsayılan: `32`.
- `max`: kaçak yürütmeyi önlemek için run retry iterasyonları için maksimum mutlak sınır. Varsayılan: `160`.

### `agents.defaults.contextPruning`

LLM'ye göndermeden önce bellek içi context'ten **eski araç sonuçlarını** budar. Diskteki oturum geçmişini **değiştirmez**.

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
- `ttl`, budamanın ne sıklıkla yeniden çalışabileceğini denetler (son cache dokunuşundan sonra).
- Budama önce aşırı büyük araç sonuçlarını soft-trim yapar, ardından gerekirse daha eski araç sonuçlarını hard-clear yapar.
- `softTrimRatio` ve `hardClearRatio`, `0.0` ile `1.0` arasındaki değerleri kabul eder; config doğrulaması bu aralığın dışındaki değerleri reddeder.

**Soft-trim** başlangıcı + sonu tutar ve ortaya `...` ekler.

**Hard-clear** tüm araç sonucunu placeholder ile değiştirir.

Notlar:

- Görüntü blokları hiçbir zaman kırpılmaz/temizlenmez.
- Oranlar karakter tabanlıdır (yaklaşık), kesin token sayıları değildir.
- `keepLastAssistants` değerinden daha az assistant mesajı varsa budama atlanır.

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

- Telegram dışı kanallar, blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerektirir.
- Kanal override'ları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına varyantlar). Signal/Slack/Discord/Google Chat varsayılanı `minChars: 1500`.
- `humanDelay`: blok yanıtları arasında rastgele duraklama. `natural` = 800-2500 ms. Agent başına override: `agents.list[].humanDelay`.

Davranış + parçalama ayrıntıları için [Akış](/tr/concepts/streaming) bölümüne bakın.

### Yazma göstergeleri

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

- Varsayılanlar: doğrudan sohbetler/mention'lar için `instant`, mention edilmeyen grup sohbetleri için `message`.
- Oturum başına override'lar: `session.typingMode`, `session.typingIntervalSeconds`.

Bkz. [Yazma Göstergeleri](/tr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü agent için isteğe bağlı sandboxing. Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.

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

<Accordion title="Sandbox ayrıntıları">

**Arka uç:**

- `docker`: yerel Docker runtime (varsayılan)
- `ssh`: genel SSH destekli uzak runtime
- `openshell`: OpenShell runtime

`backend: "openshell"` seçildiğinde, runtime'a özgü ayarlar
`plugins.entries.openshell.config` konumuna taşınır.

**SSH arka uç config'i:**

- `target`: `user@host[:port]` biçiminde SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam başına workspace'ler için kullanılan mutlak uzak kök
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH'ye geçirilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw'ın runtime'da geçici dosyalara somutlaştırdığı satır içi içerikler veya SecretRef'ler
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host-key ilkesi düğmeleri

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` değerine göre önceliklidir
- `certificateData`, `certificateFile` değerine göre önceliklidir
- `knownHostsData`, `knownHostsFile` değerine göre önceliklidir
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce etkin secrets runtime snapshot'ından çözümlenir

**SSH arka uç davranışı:**

- oluşturma veya yeniden oluşturmadan sonra uzak workspace'i bir kez tohumlar
- ardından uzak SSH workspace'ini canonical tutar
- `exec`, dosya araçları ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri otomatik olarak host'a geri eşitlemez
- sandbox browser container'larını desteklemez

**Workspace erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox workspace
- `ro`: `/workspace` konumunda sandbox workspace, `/agent` konumunda salt okunur bağlı agent workspace
- `rw`: `/workspace` konumunda okuma/yazma bağlı agent workspace

**Kapsam:**

- `session`: oturum başına container + workspace
- `agent`: agent başına bir container + workspace (varsayılan)
- `shared`: paylaşılan container ve workspace (oturumlar arası izolasyon yok)

**OpenShell Plugin config'i:**

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

- `mirror`: yürütmeden önce uzak ortamı yerelden başlatır, yürütmeden sonra geri eşitler; yerel çalışma alanı kanonik kalır
- `remote`: korumalı alan oluşturulduğunda uzak ortamı bir kez başlatır, ardından uzak çalışma alanını kanonik tutar

`remote` modunda, OpenClaw dışında yapılan ana makine yerelindeki düzenlemeler başlatma adımından sonra korumalı alana otomatik olarak eşitlenmez.
Aktarım, OpenShell korumalı alanına SSH üzerinden yapılır, ancak Plugin korumalı alan yaşam döngüsünün ve isteğe bağlı ayna eşitlemesinin sahibidir.

**`setupCommand`**, kapsayıcı oluşturulduktan sonra bir kez çalışır (`sh -lc` aracılığıyla). Ağ çıkışı, yazılabilir kök dizin ve root kullanıcısı gerektirir.

**Kapsayıcılar varsayılan olarak `network: "none"` kullanır** — aracı giden erişime ihtiyaç duyuyorsa bunu `"bridge"` (veya özel bir bridge ağı) olarak ayarlayın.
`"host"` engellenir. `"container:<id>"`, açıkça
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` ayarlamadığınız sürece varsayılan olarak engellenir (acil durum).
Etkin bir OpenClaw korumalı alanındaki Codex uygulama sunucusu turları, yerel kod modu ağ erişimi için aynı çıkış ayarını kullanır.

**Gelen ekler**, etkin çalışma alanında `media/inbound/*` altına hazırlanır.

**`docker.binds`** ek ana makine dizinlerini bağlar; genel ve aracı başına bağlamalar birleştirilir.

**Korumalı tarayıcı** (`sandbox.browser.enabled`): Bir kapsayıcı içinde Chromium + CDP. noVNC URL'si sistem istemine enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulaması kullanır ve OpenClaw paylaşılan URL'de parolayı göstermek yerine kısa ömürlü bir belirteç URL'si üretir.

- `allowHostControl: false` (varsayılan), korumalı oturumların ana makine tarayıcısını hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` kullanır (ayrılmış bridge ağı). Yalnızca genel bridge bağlantısını açıkça istediğinizde `bridge` olarak ayarlayın.
- `cdpSourceRange`, isteğe bağlı olarak kapsayıcı kenarında CDP girişini bir CIDR aralığıyla sınırlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek ana makine dizinlerini yalnızca korumalı tarayıcı kapsayıcısına bağlar. Ayarlandığında (`[]` dahil), tarayıcı kapsayıcısı için `docker.binds` değerinin yerini alır.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlıdır ve kapsayıcı ana makineleri için ayarlanmıştır:
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
  - `--renderer-process-limit=2`,
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium'un
    varsayılan işlem sınırını kullanmak için `0` ayarlayın.
  - ayrıca `noSandbox` etkinleştirildiğinde `--no-sandbox`.
  - Varsayılanlar kapsayıcı imajı temelidir; kapsayıcı varsayılanlarını değiştirmek için özel
    giriş noktası olan özel bir tarayıcı imajı kullanın.

</Accordion>

Tarayıcı korumalı alanı ve `sandbox.docker.binds` yalnızca Docker içindir.

İmajları derleyin (kaynak çalışma kopyasından):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Kaynak çalışma kopyası olmadan npm kurulumları için satır içi `docker build` komutlarına yönelik [Korumalı alan § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

### `agents.list` (aracı başına geçersiz kılmalar)

Bir aracıya kendi TTS sağlayıcısını, sesini, modelini,
stilini veya otomatik TTS modunu vermek için `agents.list[].tts` kullanın. Aracı bloğu, genel
`messages.tts` üzerine derin birleştirme yapar; böylece paylaşılan kimlik bilgileri tek bir yerde kalırken tek tek
aracılar yalnızca ihtiyaç duydukları ses veya sağlayıcı alanlarını geçersiz kılar. Etkin aracının
geçersiz kılması otomatik sözlü yanıtlara, `/tts audio`, `/tts status` ve
`tts` aracı aracına uygulanır. Sağlayıcı örnekleri ve öncelik için [Metinden konuşmaya](/tr/tools/tts#per-agent-voice-overrides)
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

- `id`: kararlı aracı kimliği (zorunlu).
- `default`: birden fazla ayarlandığında ilk olan kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa ilk liste girdisi varsayılandır.
- `model`: dize biçimi, model yedeği olmayan katı bir aracı başına birincil değer ayarlar; nesne biçimi `{ primary }` de `fallbacks` eklemediğiniz sürece katıdır. Bu aracıyı yedeğe dahil etmek için `{ primary, fallbacks: [...] }` kullanın veya katı davranışı açıkça belirtmek için `{ primary, fallbacks: [] }` kullanın. Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamadığınız sürece varsayılan yedekleri yine de devralır.
- `params`: `agents.defaults.models` içindeki seçili model girdisi üzerine birleştirilen aracı başına akış parametreleri. Tüm model kataloğunu çoğaltmadan `cacheRetention`, `temperature` veya `maxTokens` gibi aracıya özgü geçersiz kılmalar için bunu kullanın.
- `tts`: isteğe bağlı aracı başına metinden konuşmaya geçersiz kılmaları. Blok, `messages.tts` üzerine derin birleştirme yapar; bu nedenle paylaşılan sağlayıcı kimlik bilgilerini ve yedek politikasını `messages.tts` içinde tutun ve burada yalnızca sağlayıcı, ses, model, stil veya otomatik mod gibi kişiye özgü değerleri ayarlayın.
- `skills`: isteğe bağlı aracı başına Skills izin listesi. Atlanırsa aracı, ayarlandığında `agents.defaults.skills` değerini devralır; açık bir liste, birleştirmek yerine varsayılanların yerini alır ve `[]` skills yok anlamına gelir.
- `thinkingDefault`: isteğe bağlı aracı başına varsayılan düşünme seviyesi (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mesaj başına veya oturum geçersiz kılması ayarlanmadığında bu aracı için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Seçilen sağlayıcı/model profili hangi değerlerin geçerli olduğunu kontrol eder; Google Gemini için `adaptive`, sağlayıcıya ait dinamik düşünmeyi korur (Gemini 3/3.1'de `thinkingLevel` atlanır, Gemini 2.5'te `thinkingBudget: -1`).
- `reasoningDefault`: isteğe bağlı aracı başına varsayılan akıl yürütme görünürlüğü (`on | off | stream`). Mesaj başına veya oturum akıl yürütme geçersiz kılması ayarlanmadığında bu aracı için `agents.defaults.reasoningDefault` değerini geçersiz kılar.
- `fastModeDefault`: hızlı mod için isteğe bağlı aracı başına varsayılan (`"auto" | true | false`). Mesaj başına veya oturum hızlı mod geçersiz kılması ayarlanmadığında uygulanır.
- `models`: tam `provider/model` kimlikleriyle anahtarlanan isteğe bağlı aracı başına model kataloğu/çalışma zamanı geçersiz kılmaları. Aracı başına çalışma zamanı istisnaları için `models["provider/model"].agentRuntime` kullanın.
- `runtime`: isteğe bağlı aracı başına çalışma zamanı tanımlayıcısı. Aracının varsayılan olarak ACP koşum oturumlarını kullanması gerektiğinde `runtime.acp` varsayılanları (`agent`, `backend`, `mode`, `cwd`) ile `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göreli yol, `http(s)` URL'si veya `data:` URI'si.
- Çalışma alanına göreli yerel `identity.avatar` görüntü dosyaları 2 MB ile sınırlıdır. `http(s)` URL'leri ve `data:` URI'leri yerel dosya boyutu sınırıyla denetlenmez.
- `identity` varsayılanları türetir: `emoji` değerinden `ackReaction`, `name`/`emoji` değerinden `mentionPatterns`.
- `subagents.allowAgents`: açık `sessions_spawn.agentId` hedefleri için yapılandırılmış aracı kimliklerinin izin listesi (`["*"]` = herhangi bir yapılandırılmış hedef; varsayılan: yalnızca aynı aracı). Kendini hedefleyen `agentId` çağrılarına izin verilmesi gerekiyorsa istekte bulunan kimliği ekleyin. Aracı yapılandırması silinmiş eski girdiler `sessions_spawn` tarafından reddedilir ve `agents_list` içinden çıkarılır; bunları temizlemek için `openclaw doctor --fix` çalıştırın veya varsayılanları devralırken bu hedefin oluşturulabilir kalması gerekiyorsa en az bir `agents.list[]` girdisi ekleyin.
- Korumalı alan devralma koruması: istekte bulunan oturum korumalı alandaysa, `sessions_spawn` korumasız çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda, `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar; varsayılan: false).

---

## Çok aracılı yönlendirme

Tek bir Gateway içinde birden fazla yalıtılmış aracı çalıştırın. Bkz. [Çok Aracılı](/tr/concepts/multi-agent).

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

**Deterministik eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam, peer/guild/team yok)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan aracı

Her katmanda, eşleşen ilk `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw, tam konuşma kimliğine göre çözümler (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki route bağlama katman sırasını kullanmaz.

### Aracı başına erişim profilleri

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

Öncelik ayrıntıları için [Çoklu Ajan Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

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
  - `per-sender` (varsayılan): her gönderen, kanal bağlamı içinde yalıtılmış bir oturum alır.
  - `global`: kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam amaçlandığında kullanın).
- **`dmScope`**: DM'lerin nasıl gruplandığı.
  - `main`: tüm DM'ler ana oturumu paylaşır.
  - `per-peer`: kanallar genelinde gönderen kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderen başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderen başına yalıtır (çok hesaplı kullanım için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kurallı kimlikleri sağlayıcı önekli eşlerle eşler. `/dock_discord` gibi Dock komutları, etkin oturumun yanıt rotasını başka bir bağlı kanal eşine geçirmek için aynı eşlemeyi kullanır; bkz. [Kanal kenetleme](/tr/concepts/channel-docking).
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saatle `atHour` zamanında sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. İkisi de yapılandırıldığında önce süresi dolan kazanır. Günlük sıfırlama güncelliği oturum satırının `sessionStartedAt` değerini kullanır; boşta sıfırlama güncelliği `lastInteractionAt` değerini kullanır. Heartbeat, Cron uyanmaları, exec bildirimleri ve Gateway kayıt işleri gibi arka plan/sistem olayı yazmaları `updatedAt` değerini güncelleyebilir, ancak günlük/boşta oturumları güncel tutmaz.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`mainKey`**: eski alan. Runtime, ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: ajanlar arası değişimlerde ajanlar arasındaki en fazla karşılıklı yanıt turu (tam sayı, aralık: `0`-`20`, varsayılan: `5`). `0`, karşılıklı zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleştirir. İlk reddetme kazanır.
- **`maintenance`**: oturum deposu temizleme + saklama denetimleri.
  - `mode`: `enforce` temizlemeyi uygular ve varsayılandır; `warn` yalnızca uyarılar üretir.
  - `pruneAfter`: eski girdiler için yaş eşiği (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki en fazla girdi sayısı (varsayılan `500`). Runtime, üretim boyutlu sınırlar için küçük bir yüksek su tamponuyla toplu temizlik yazar; `openclaw sessions cleanup --enforce` sınırı hemen uygular.
  - Kısa ömürlü Gateway model çalıştırma yoklama oturumları sabit `24h` saklama kullanır, ancak temizleme baskı kapılıdır: eski katı model çalıştırma yoklama satırlarını yalnızca oturum girdisi bakım/sınır baskısına ulaşıldığında kaldırır. Yalnızca `agent:*:explicit:model-run-<uuid>` ile eşleşen katı açık yoklama anahtarları uygundur; normal doğrudan, grup, iş parçacığı, Cron, hook, Heartbeat, ACP ve alt ajan oturumları bu 24 saatlik saklamayı devralmaz. Model çalıştırma temizliği çalıştığında, daha geniş `pruneAfter` eski girdi temizliğinden ve `maxEntries` sınırından önce çalışır.
  - `rotateBytes`: kullanımdan kaldırıldı ve yok sayılır; `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.
  - `resetArchiveRetention`: `*.reset.<timestamp>` transkript arşivleri için saklama süresi. Varsayılan olarak `pruneAfter` kullanılır; devre dışı bırakmak için `false` ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturum dizini disk bütçesi. `warn` modunda uyarıları günlüğe yazar; `enforce` modunda önce en eski yapıtları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonra isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `%80`'idir.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan hareketsizlikte otomatik odak kaldırma (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan kesin en yüksek yaş (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `spawnSessions`: `sessions_spawn` ve ACP iş parçacığı başlatmalarından iş parçacığına bağlı çalışma oturumları oluşturmak için varsayılan geçit. İş parçacığı bağlamaları etkin olduğunda varsayılanı `true` olur; sağlayıcılar/hesaplar geçersiz kılabilir.
  - `defaultSpawnContext`: iş parçacığına bağlı başlatmalar için varsayılan yerel alt ajan bağlamı (`"fork"` veya `"isolated"`). Varsayılanı `"fork"` olur.

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

Çözümleme (en özel olan kazanır): hesap → kanal → genel. `""` devre dışı bırakır ve kademeyi durdurur. `"auto"`, `[{identity.name}]` değerini türetir.

**Şablon değişkenleri:**

| Değişken          | Açıklama                | Örnek                       |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Kısa model adı          | `claude-opus-4-6`           |
| `{modelFull}`     | Tam model tanımlayıcısı | `anthropic/claude-opus-4-6` |
| `{provider}`      | Sağlayıcı adı           | `anthropic`                 |
| `{thinkingLevel}` | Geçerli düşünme düzeyi  | `high`, `low`, `off`        |
| `{identity.name}` | Ajan kimlik adı         | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarlı değildir. `{think}`, `{thinkingLevel}` için bir takma addır.

### Onay tepkisi

- Varsayılan olarak etkin ajanın `identity.emoji` değeri, aksi halde `"👀"` kullanılır. Devre dışı bırakmak için `""` ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik yedeği.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Signal, Telegram, WhatsApp ve iMessage gibi tepki destekleyen kanallarda yanıttan sonra onayı kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord, Signal, Telegram ve WhatsApp üzerinde yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord üzerinde, ayarlanmamış değer onay tepkileri etkin olduğunda durum tepkilerini etkin tutar.
  Signal, Telegram ve WhatsApp üzerinde yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` olarak ayarlayın.
- `messages.statusReactions.emojis`: yaşam döngüsü emoji anahtarlarını geçersiz kılar:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` ve `stallHard`.
  Telegram yalnızca sabit bir tepki kümesine izin verir; bu nedenle desteklenmeyen yapılandırılmış emoji, o sohbet için en yakın desteklenen durum varyantına geri döner.

### Gelen debounce

Aynı gönderenden gelen hızlı, yalnızca metin içeren mesajları tek bir ajan turunda toplar. Medya/ekler hemen boşaltılır. Denetim komutları debounce işlemini atlar.

### TTS (metinden sese)

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
- API anahtarları `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine geri döner.
- Paketli konuşma sağlayıcıları Plugin'e aittir. `plugins.allow` ayarlanmışsa, kullanmak istediğiniz her TTS sağlayıcı Plugin'ini ekleyin; örneğin Edge TTS için `microsoft`. Eski `edge` sağlayıcı kimliği, `microsoft` için takma ad olarak kabul edilir.
- `providers.openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası yapılandırma, ardından `OPENAI_TTS_BASE_URL`, ardından `https://api.openai.com/v1` şeklindedir.
- `providers.openai.baseUrl` OpenAI olmayan bir uç noktaya işaret ettiğinde, OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak ele alır ve model/ses doğrulamasını gevşetir.

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

- Birden fazla Konuşma sağlayıcısı yapılandırıldığında `talk.provider`, `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Konuşma anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir. Kalıcı yapılandırmayı `talk.providers.<provider>` biçimine yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- Ses kimlikleri `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerine geri döner.
- `providers.*.apiKey`, düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` geri dönüşü yalnızca yapılandırılmış bir Konuşma API anahtarı yoksa uygulanır.
- `providers.*.voiceAliases`, Konuşma yönergelerinin kullanıcı dostu adlar kullanmasına olanak tanır.
- `providers.mlx.modelId`, macOS yerel MLX yardımcısı tarafından kullanılan Hugging Face deposunu seçer. Atlanırsa, macOS `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatma, mevcut olduğunda paketli `openclaw-mlx-tts` yardımcısı üzerinden veya `PATH` üzerindeki bir çalıştırılabilir dosya üzerinden çalışır; `OPENCLAW_MLX_TTS_BIN`, geliştirme için yardımcı yolunu geçersiz kılar.
- `consultThinkingLevel`, Control UI Konuşma gerçek zamanlı `openclaw_agent_consult` çağrılarının arkasındaki tam OpenClaw ajan çalıştırması için düşünme düzeyini denetler. Normal oturum/model davranışını korumak için ayarsız bırakın.
- `consultFastMode`, oturumun normal hızlı mod ayarını değiştirmeden Control UI Konuşma gerçek zamanlı danışmaları için tek seferlik bir hızlı mod geçersiz kılması ayarlar.
- `speechLocale`, iOS/macOS Konuşma konuşma tanıma tarafından kullanılan BCP 47 yerel ayar kimliğini ayarlar. Cihaz varsayılanını kullanmak için ayarsız bırakın.
- `silenceTimeoutMs`, kullanıcı sessizliğinden sonra Konuşma modunun transkripti göndermeden önce ne kadar bekleyeceğini denetler. Ayarsız bırakılırsa platformun varsayılan duraklama penceresi korunur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`).
- `realtime.instructions`, sağlayıcıya yönelik sistem talimatlarını OpenClaw'ın yerleşik gerçek zamanlı istemine ekler; böylece varsayılan `openclaw_agent_consult` yönlendirmesi kaybedilmeden ses stili yapılandırılabilir.
- `realtime.consultRouting`, gerçek zamanlı sağlayıcı `openclaw_agent_consult` olmadan son bir kullanıcı transkripti ürettiğinde Gateway röle geri dönüşünü denetler: `provider-direct` doğrudan sağlayıcı yanıtlarını korurken, `force-agent-consult` kesinleştirilmiş isteği OpenClaw üzerinden yönlendirir.

---

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference) — diğer tüm yapılandırma anahtarları
- [Yapılandırma](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
