---
read_when:
    - Ajan varsayılanlarını ayarlama (modeller, düşünme, çalışma alanı, Heartbeat, medya, Skills)
    - Çok ajanlı yönlendirmeyi ve bağlamaları yapılandırma
    - Oturum, mesaj teslimi ve konuşma modu davranışını ayarlama
summary: Ajan varsayılanları, çok ajanlı yönlendirme, oturum, mesajlar ve konuşma yapılandırması
title: Yapılandırma — ajanlar
x-i18n:
    generated_at: "2026-05-04T07:05:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d339b82b8b3b82e55820ca6568b3ed569fe64135e698515fa7f316c3afbbfd9
    source_path: gateway/config-agents.md
    workflow: 16
---

Ajan kapsamlı yapılandırma anahtarları `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` ve `talk.*` altında bulunur. Kanallar, araçlar, Gateway çalışma zamanı ve diğer
üst düzey anahtarlar için bkz. [Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Ajan varsayılanları

### `agents.defaults.workspace`

Varsayılan: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Sistem isteminin Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmazsa OpenClaw, çalışma alanından yukarı doğru yürüyerek otomatik algılar.

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

- Varsayılan olarak kısıtlanmamış skills için `agents.defaults.skills` öğesini atlayın.
- Varsayılanları devralmak için `agents.list[].skills` öğesini atlayın.
- Hiç skills olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o ajan için nihai kümedir; varsayılanlarla birleştirilmez.

### `agents.defaults.skipBootstrap`

Çalışma alanı başlangıç dosyalarının (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) otomatik oluşturulmasını devre dışı bırakır.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Gerekli başlangıç dosyalarını yazmaya devam ederken seçili isteğe bağlı çalışma alanı dosyalarının oluşturulmasını atlar. Geçerli değerler: `SOUL.md`, `USER.md`, `HEARTBEAT.md` ve `IDENTITY.md`.

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

Çalışma alanı başlangıç dosyalarının sistem istemine ne zaman enjekte edileceğini kontrol eder. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam dönüşleri (tamamlanmış bir asistan yanıtından sonra) çalışma alanı başlangıç yeniden enjeksiyonunu atlayarak istem boyutunu azaltır. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler yine de bağlamı yeniden oluşturur.
- `"never"`: her dönüşte çalışma alanı başlangıcını ve bağlam dosyası enjeksiyonunu devre dışı bırakır. Bunu yalnızca istem yaşam döngüsünü tamamen kendisi yöneten ajanlar için kullanın (özel bağlam motorları, kendi bağlamını oluşturan yerel çalışma zamanları veya başlangıçsız özel iş akışları). Heartbeat ve Compaction kurtarma dönüşleri de enjeksiyonu atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Kesmeden önce çalışma alanı başlangıç dosyası başına en fazla karakter sayısı. Varsayılan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı başlangıç dosyaları genelinde enjekte edilen toplam en fazla karakter sayısı. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Başlangıç bağlamı kesildiğinde ajanın görebileceği sistem istemi bildirimini kontrol eder.
Varsayılan: `"once"`.

- `"off"`: kesme bildirimi metnini sistem istemine asla enjekte etme.
- `"once"`: her benzersiz kesme imzası için kısa bir bildirimi bir kez enjekte et (önerilir).
- `"always"`: kesme mevcut olduğunda her çalıştırmada kısa bir bildirim enjekte et.

Ayrıntılı ham/enjekte edilmiş sayımlar ve yapılandırma ayarlama alanları, bağlam/durum raporları ve günlükler gibi tanılarda kalır; rutin WebChat kullanıcı/çalışma zamanı bağlamı yalnızca kısa kurtarma bildirimini alır.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw birden fazla yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar tek bir genel düğmeden geçirmek yerine kasıtlı olarak alt sistemlere göre ayrılmıştır.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı başlangıç enjeksiyonu.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil tek seferlik sıfırlama/başlangıç model çalıştırması girişi. Yalın sohbet `/new` ve `/reset` komutları modeli çağırmadan onaylanır.
- `skills.limits.*`:
  sistem istemine enjekte edilen sıkıştırılmış skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipli bloklar.
- `memory.qmd.limits.*`:
  dizinlenmiş bellek arama parçacığı ve enjeksiyon boyutlandırması.

Yalnızca bir ajan farklı bir bütçeye ihtiyaç duyduğunda eşleşen ajan başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Sıfırlama/başlangıç model çalıştırmalarında enjekte edilen ilk dönüş başlangıç girişini kontrol eder.
Yalın sohbet `/new` ve `/reset` komutları, modeli çağırmadan sıfırlamayı onaylar; bu nedenle bu girişi yüklemezler.

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

- `memoryGetMaxChars`: kesme meta verileri ve devam bildirimi eklenmeden önce varsayılan `memory_get` alıntı üst sınırı.
- `memoryGetDefaultLines`: `lines` atlandığında varsayılan `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcı sonuçlar ve taşma kurtarma için kullanılan canlı araç sonucu üst sınırı.
- `postCompactionMaxChars`: Compaction sonrası yenileme enjeksiyonu sırasında kullanılan AGENTS.md alıntı üst sınırı.

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

Sistem istemine enjekte edilen sıkıştırılmış skills listesi için genel üst sınır. Bu, gerektiğinde `SKILL.md` dosyalarının okunmasını etkilemez.

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

Sağlayıcı çağrılarından önce transkript/araç görüntü bloklarında en uzun görüntü kenarı için en fazla piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda görsel token kullanımını ve istek yükü boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
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

Sistem istemindeki zaman biçimi. Varsayılan: `auto` (OS tercihi).

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
  - `image` araç yolu tarafından görsel model yapılandırması olarak kullanılır.
  - Seçili/varsayılan model görüntü girdisini kabul edemediğinde yedek yönlendirme olarak da kullanılır.
  - Açık `provider/model` başvurularını tercih edin. Çıplak kimlikler uyumluluk için kabul edilir; çıplak kimlik, `models.providers.*.models` içinde yapılandırılmış görüntü destekli bir girdiye benzersiz şekilde eşleşirse OpenClaw bunu o sağlayıcıya niteler. Belirsiz yapılandırılmış eşleşmeler açık bir sağlayıcı öneki gerektirir.
- `imageGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görüntü oluşturma yeteneği ve görüntü oluşturan gelecekteki tüm araç/Plugin yüzeyleri tarafından kullanılır.
  - Tipik değerler: yerel Gemini görüntü oluşturma için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev`, OpenAI Images için `openai/gpt-image-2` veya şeffaf arka planlı OpenAI PNG/WebP çıktısı için `openai/gpt-image-1.5`.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Atlanırsa `image_generate` yine de kimlik doğrulaması destekli bir sağlayıcı varsayılanı çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı görüntü oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
- `musicGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik oluşturma yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Atlanırsa `music_generate` yine de kimlik doğrulaması destekli bir sağlayıcı varsayılanı çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video oluşturma yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa `video_generate` yine de kimlik doğrulaması destekli bir sağlayıcı varsayılanı çıkarımlayabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı video oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Doğrudan bir sağlayıcı/model seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Paketle gelen Qwen video oluşturma sağlayıcısı en fazla 1 çıktı videosu, 1 girdi görüntüsü, 4 girdi videosu, 10 saniye süre ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirme için `pdf` aracı tarafından kullanılır.
  - Atlanırsa PDF aracı `imageModel` değerine, ardından çözümlenen oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı sırasında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyutu sınırı.
- `pdfMaxPages`: `pdf` aracında ayıklama yedek modu tarafından dikkate alınan varsayılan en fazla sayfa sayısı.
- `verboseDefault`: aracılar için varsayılan ayrıntı düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `toolProgressDetail`: `/verbose` araç özetleri ve ilerleme taslağı araç satırları için ayrıntı modu. Değerler: `"explain"` (varsayılan, kısa insan etiketleri) veya `"raw"` (varsa ham komutu/ayrıntıyı ekler). Aracı başına `agents.list[].toolProgressDetail` bu varsayılanı geçersiz kılar.
- `reasoningDefault`: aracılar için varsayılan akıl yürütme görünürlüğü. Değerler: `"off"`, `"on"`, `"stream"`. Aracı başına `agents.list[].reasoningDefault` bu varsayılanı geçersiz kılar. Yapılandırılmış akıl yürütme varsayılanları yalnızca sahipler, yetkili gönderenler veya operatör-yönetici Gateway bağlamları için, ileti veya oturum başına akıl yürütme geçersiz kılması ayarlanmadığında uygulanır.
- `elevatedDefault`: aracılar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (örn. API anahtarı erişimi için `openai/gpt-5.5` veya Codex OAuth için `openai-codex/gpt-5.5`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma ad dener, ardından bu tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner (kullanımdan kaldırılmış uyumluluk davranışı; bu nedenle açık `provider/model` tercih edin). Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eski, kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/model değerine geri döner.
- `models`: yapılandırılmış model kataloğu ve `/model` için izin listesi. Her girdi `alias` (kısayol) ve `params` (sağlayıcıya özel; örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`) içerebilir.
  - Güvenli düzenlemeler: girdi eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçirmediğiniz sürece mevcut izin listesi girdilerini kaldıracak değiştirmeleri reddeder.
  - Sağlayıcı kapsamlı yapılandırma/ilk kurulum akışları, seçili sağlayıcı modellerini bu haritaya birleştirir ve zaten yapılandırılmış ilgisiz sağlayıcıları korur.
  - Doğrudan OpenAI Responses modelleri için sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` eklemeyi durdurmak için `params.responsesServerCompaction: false` kullanın veya eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI sunucu tarafı Compaction](/tr/providers/openai#server-side-compaction-responses-api).
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` altında ayarlanır (örn. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (genel taban), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır; ardından `agents.list[].params` (eşleşen aracı kimliği) anahtara göre geçersiz kılar. Ayrıntılar için [İstem Önbellekleme](/tr/reference/prompt-caching) bölümüne bakın.
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu proxy'ler için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş doğrudan geçişli JSON. Oluşturulan istek anahtarlarıyla çakışırsa ek gövde kazanır; yerel olmayan completions rotaları sonrasında yine de yalnızca OpenAI'ye özgü `store` değerini çıkarır.
- `params.chat_template_kwargs`: üst düzey `api: "openai-completions"` istek gövdelerine birleştirilen vLLM/OpenAI uyumlu sohbet şablonu bağımsız değişkenleri. Düşünme kapalıyken `vllm/nemotron-3-*` için paketle gelen vLLM Plugin'i otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir; açık `chat_template_kwargs` oluşturulan varsayılanları geçersiz kılar ve `extra_body.chat_template_kwargs` yine son önceliğe sahiptir. vLLM Qwen düşünme kontrolleri için bu model girdisinde `params.qwenThinkingFormat` değerini `"chat-template"` veya `"top-level"` olarak ayarlayın.
- `compat.supportedReasoningEfforts`: model başına OpenAI uyumlu akıl yürütme çabası listesi. Bunu gerçekten kabul eden özel uç noktalar için `"xhigh"` ekleyin; OpenClaw sonra bu yapılandırılmış sağlayıcı/model için komut menülerinde, Gateway oturum satırlarında, oturum yama doğrulamasında, aracı CLI doğrulamasında ve `llm-task` doğrulamasında `/think xhigh` sunar. Arka uç kanonik bir düzey için sağlayıcıya özel bir değer istiyorsa `compat.reasoningEffortMap` kullanın.
- `params.preserveThinking`: korunmuş düşünme için yalnızca Z.AI'ye özgü isteğe bağlı etkinleştirme. Etkinleştirildiğinde ve düşünme açık olduğunda OpenClaw `thinking.clear_thinking: false` gönderir ve önceki `reasoning_content` içeriğini tekrar oynatır; bkz. [Z.AI düşünme ve korunmuş düşünme](/tr/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: varsayılan düşük düzey aracı çalışma zamanı ilkesi. Atlanan kimlik varsayılan olarak OpenClaw Pi olur. Yerleşik PI düzeneğini zorlamak için `id: "pi"`, kayıtlı Plugin düzeneklerinin desteklenen modelleri üstlenmesine izin vermek ve hiçbiri eşleşmediğinde PI kullanmak için `id: "auto"`, bu düzeneği zorunlu kılmak için `id: "codex"` gibi kayıtlı bir düzenek kimliği veya `id: "claude-cli"` gibi desteklenen bir CLI arka uç takma adı kullanın. Açık Plugin çalışma zamanları, düzenek kullanılamadığında veya başarısız olduğunda kapalı şekilde başarısız olur. Model başvurularını kanonik `provider/model` olarak tutun; Codex, Claude CLI, Gemini CLI ve diğer yürütme arka uçlarını eski çalışma zamanı sağlayıcı önekleri yerine çalışma zamanı yapılandırması üzerinden seçin. Bunun sağlayıcı/model seçiminden nasıl farklı olduğunu görmek için [Aracı çalışma zamanları](/tr/concepts/agent-runtimes) bölümüne bakın.
- Bu alanları değiştiren yapılandırma yazıcıları (örneğin `/models set`, `/models set-image` ve yedek ekleme/kaldırma komutları) kanonik nesne biçimini kaydeder ve mümkün olduğunda mevcut yedek listelerini korur.
- `maxConcurrent`: oturumlar genelinde en fazla paralel aracı çalıştırması (her oturum yine serileştirilir). Varsayılan: 4.

### `agents.defaults.agentRuntime`

`agentRuntime`, aracı turlarını hangi düşük düzey yürütücünün çalıştıracağını denetler. Çoğu
dağıtım varsayılan OpenClaw Pi çalışma zamanını korumalıdır. Güvenilir bir
Plugin, paketle gelen Codex uygulama sunucusu düzeneği gibi yerel bir düzenek
sağladığında veya Claude CLI gibi desteklenen bir CLI arka ucu istediğinizde bunu
kullanın. Zihinsel model için bkz. [Aracı çalışma zamanları](/tr/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, kayıtlı bir Plugin düzenek kimliği veya desteklenen bir CLI arka uç takma adı. Paketle gelen Codex Plugin'i `codex` kaydeder; paketle gelen Anthropic Plugin'i `claude-cli` CLI arka ucunu sağlar.
- `id: "auto"` kayıtlı Plugin düzeneklerinin desteklenen turları üstlenmesine izin verir ve hiçbir düzenek eşleşmediğinde PI kullanır. `id: "codex"` gibi açık bir Plugin çalışma zamanı bu düzeneği zorunlu kılar ve kullanılamazsa veya başarısız olursa kapalı şekilde başarısız olur.
- Ortam geçersiz kılması: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` bu süreç için `id` değerini geçersiz kılar.
- Yalnızca Codex dağıtımları için `model: "openai/gpt-5.5"` ve `agentRuntime.id: "codex"` ayarlayın.
- Claude CLI dağıtımları için `model: "anthropic/claude-opus-4-7"` ile birlikte `agentRuntime.id: "claude-cli"` tercih edin. Eski `claude-cli/claude-opus-4-7` model başvuruları uyumluluk için hâlâ çalışır, ancak yeni yapılandırma sağlayıcı/model seçimini kanonik tutmalı ve yürütme arka ucunu `agentRuntime.id` içine koymalıdır.
- Eski çalışma zamanı ilkesi anahtarları `openclaw doctor --fix` tarafından `agentRuntime` değerine yeniden yazılır.
- Düzenek seçimi, ilk gömülü çalıştırmadan sonra oturum kimliği başına sabitlenir. Yapılandırma/ortam değişiklikleri mevcut bir konuşma dökümünü değil, yeni veya sıfırlanmış oturumları etkiler. Konuşma dökümü geçmişi olan ancak kaydedilmiş sabitlemesi olmayan eski oturumlar PI sabitlenmiş olarak değerlendirilir. `/status` etkili çalışma zamanını bildirir; örneğin `Runtime: OpenClaw Pi Default` veya `Runtime: OpenAI Codex`.
- Bu yalnızca metin aracı turu yürütmesini denetler. Medya oluşturma, görsel anlama, PDF, müzik, video ve TTS yine kendi sağlayıcı/model ayarlarını kullanır.

**Yerleşik takma ad kısaltmaları** (yalnızca model `agents.defaults.models` içinde olduğunda geçerlidir):

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

Yapılandırdığınız takma adlar her zaman varsayılanlara göre önceliklidir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarını yapmadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece düşünme modunu otomatik olarak etkinleştirir.
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
- `sessionArg` ayarlandığında oturumlar desteklenir.
- `imageArg` dosya yollarını kabul ettiğinde görüntü aktarımı desteklenir.

### `agents.defaults.systemPromptOverride`

OpenClaw tarafından birleştirilen sistem isteminin tamamını sabit bir dizeyle değiştirir. Varsayılan düzeyde (`agents.defaults.systemPromptOverride`) veya ajan başına (`agents.list[].systemPromptOverride`) ayarlayın. Ajan başına değerler önceliklidir; boş veya yalnızca boşluk karakterlerinden oluşan değer yok sayılır. Kontrollü istem denemeleri için kullanışlıdır.

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

Model ailesine göre uygulanan, sağlayıcıdan bağımsız istem katmanları. GPT-5 ailesi model kimlikleri, sağlayıcılar genelinde paylaşılan davranış sözleşmesini alır; `personality` yalnızca dostane etkileşim tarzı katmanını kontrol eder.

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

- `"friendly"` (varsayılan) ve `"on"` dostane etkileşim tarzı katmanını etkinleştirir.
- `"off"` yalnızca dostane katmanı devre dışı bırakır; etiketli GPT-5 davranış sözleşmesi etkin kalır.
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
- `includeSystemPromptSection`: `false` olduğunda, Heartbeat bölümünü sistem isteminden çıkarır ve `HEARTBEAT.md` dosyasının önyükleme bağlamına enjekte edilmesini atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: `true` olduğunda, Heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.
- `timeoutSeconds`: bir Heartbeat ajan turunun iptal edilmeden önce izin verilen azami süresi, saniye cinsinden. `agents.defaults.timeoutSeconds` kullanmak için ayarlamadan bırakın.
- `directPolicy`: doğrudan/DM teslim ilkesi. `allow` (varsayılan) doğrudan hedefe teslimata izin verir. `block`, doğrudan hedefe teslimatı bastırır ve `reason=dm-blocked` üretir.
- `lightContext`: `true` olduğunda, Heartbeat çalıştırmaları hafif önyükleme bağlamı kullanır ve çalışma alanı önyükleme dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: `true` olduğunda, her Heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım desenidir. Heartbeat başına token maliyetini yaklaşık 100K'den yaklaşık 2-5K token'a düşürür.
- `skipWhenBusy`: `true` olduğunda, Heartbeat çalıştırmaları ek meşgul hatlarda ertelenir: alt ajan veya iç içe komut işi. Cron hatları, bu bayrak olmasa bile Heartbeat'leri her zaman erteler.
- Ajan başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir ajan `heartbeat` tanımladığında, Heartbeat'leri **yalnızca bu ajanlar** çalıştırır.
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
- `provider`: kayıtlı bir Compaction sağlayıcı Plugin'inin kimliği. Ayarlandığında, yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` işlevi çağrılır. Başarısızlık durumunda yerleşik yönteme geri döner. Bir sağlayıcı ayarlamak `mode: "safeguard"` kullanımını zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw işlemi iptal etmeden önce tek bir Compaction işlemine izin verilen azami saniye sayısı. Varsayılan: `900`.
- `keepRecentTokens`: en yeni transkript kuyruğunu bire bir korumak için Pi kesme noktası bütçesi. Elle `/compact`, açıkça ayarlandığında buna uyar; aksi halde elle Compaction katı bir kontrol noktasıdır.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, Compaction özetlemesi sırasında yerleşik opak tanımlayıcı saklama rehberliğini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: safeguard özetleri için hatalı biçimli çıktı durumunda yeniden deneme denetimleri. Safeguard modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` olarak ayarlayın.
- `midTurnPrecheck`: isteğe bağlı Pi araç döngüsü baskı denetimi. `enabled: true` olduğunda OpenClaw, araç sonuçları eklendikten sonra ve sonraki model çağrısından önce bağlam baskısını denetler. Bağlam artık sığmıyorsa, istemi göndermeden önce geçerli denemeyi iptal eder ve araç sonuçlarını kısaltmak ya da Compaction yapıp yeniden denemek için mevcut ön denetim kurtarma yolunu yeniden kullanır. Hem `default` hem de `safeguard` Compaction modlarıyla çalışır. Varsayılan: devre dışı.
- `postCompactionSections`: Compaction sonrasında yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Varsayılan `["Session Startup", "Red Lines"]`; yeniden enjeksiyonu devre dışı bırakmak için `[]` olarak ayarlayın. Ayarlanmamışsa veya açıkça bu varsayılan çifte ayarlanmışsa, eski `Every Session`/`Safety` başlıkları da geriye dönük yedek olarak kabul edilir.
- `model`: yalnızca Compaction özetlemesi için isteğe bağlı `provider/model-id` geçersiz kılması. Ana oturum bir modeli korumalı, ancak Compaction özetleri başka bir modelde çalışmalıysa bunu kullanın; ayarlanmamışsa Compaction, oturumun birincil modelini kullanır.
- `maxActiveTranscriptBytes`: aktif JSONL eşik değerini aştığında çalıştırma öncesinde normal yerel Compaction'ı tetikleyen isteğe bağlı bayt eşiği (`number` veya `"20mb"` gibi dizeler). Başarılı Compaction'ın daha küçük bir ardıl transkripte dönebilmesi için `truncateAfterCompaction` gerektirir. Ayarlanmamışsa veya `0` ise devre dışıdır.
- `notifyUser`: `true` olduğunda, Compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin, "Compacting context..." ve "Compaction complete"). Compaction'ı sessiz tutmak için varsayılan olarak devre dışıdır.
- `memoryFlush`: kalıcı anıları saklamak için otomatik Compaction öncesinde sessiz ajanik tur. Bu bakım turu yerel bir modelde kalmalıysa `model` değerini `ollama/qwen3:8b` gibi tam bir sağlayıcı/model olarak ayarlayın; geçersiz kılma, etkin oturum yedek zincirini devralmaz. Çalışma alanı salt okunur olduğunda atlanır.

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
- `ttl`, budamanın ne sıklıkla yeniden çalışabileceğini denetler (son önbellek temasından sonra).
- Budama önce çok büyük araç sonuçlarını yumuşak biçimde kısaltır, ardından gerekirse daha eski araç sonuçlarını tamamen temizler.

**Yumuşak kısaltma** başlangıcı + sonu korur ve ortaya `...` ekler.

**Tam temizleme** araç sonucunun tamamını yer tutucuyla değiştirir.

Notlar:

- Görüntü blokları hiçbir zaman kısaltılmaz/temizlenmez.
- Oranlar karakter tabanlıdır (yaklaşık), kesin token sayıları değildir.
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
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına varyantlar). Signal/Slack/Discord/Google Chat için varsayılan `minChars: 1500`.
- `humanDelay`: blok yanıtları arasında rastgeleleştirilmiş duraklama. `natural` = 800-2500 ms. Ajan başına geçersiz kılma: `agents.list[].humanDelay`.

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

Gömülü agent için isteğe bağlı sandboxlama. Tam kılavuz için bkz. [Sandboxlama](/tr/gateway/sandboxing).

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

**Backend:**

- `docker`: yerel Docker runtime’ı (varsayılan)
- `ssh`: genel SSH destekli uzak runtime
- `openshell`: OpenShell runtime’ı

`backend: "openshell"` seçildiğinde, runtime’a özgü ayarlar
`plugins.entries.openshell.config` konumuna taşınır.

**SSH backend yapılandırması:**

- `target`: `user@host[:port]` biçiminde SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam başına çalışma alanları için kullanılan mutlak uzak kök
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH’ye geçirilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw’ın runtime’da geçici dosyalara dönüştürdüğü satır içi içerikler veya SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host anahtarı ilkesi düğmeleri

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` değerine göre önceliklidir
- `certificateData`, `certificateFile` değerine göre önceliklidir
- `knownHostsData`, `knownHostsFile` değerine göre önceliklidir
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce etkin secrets runtime anlık görüntüsünden çözümlenir

**SSH backend davranışı:**

- oluşturma veya yeniden oluşturma sonrasında uzak çalışma alanını bir kez besler
- ardından uzak SSH çalışma alanını kanonik tutar
- `exec`, dosya araçları ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri otomatik olarak host’a geri eşitlemez
- sandbox tarayıcı container’larını desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox çalışma alanı
- `ro`: `/workspace` konumunda sandbox çalışma alanı, agent çalışma alanı `/agent` konumuna salt okunur olarak bağlanır
- `rw`: agent çalışma alanı `/workspace` konumuna okuma/yazma olarak bağlanır

**Kapsam:**

- `session`: oturum başına container + çalışma alanı
- `agent`: agent başına bir container + çalışma alanı (varsayılan)
- `shared`: paylaşılan container ve çalışma alanı (oturumlar arası izolasyon yok)

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

- `mirror`: exec öncesinde uzağı yerelden besler, exec sonrasında geri eşitler; yerel çalışma alanı kanonik kalır
- `remote`: sandbox oluşturulduğunda uzağı bir kez besler, ardından uzak çalışma alanını kanonik tutar

`remote` modunda, OpenClaw dışında yapılan host-yerel düzenlemeler besleme adımından sonra sandbox’a otomatik olarak eşitlenmez.
Taşıma, OpenShell sandbox’ına SSH üzerinden yapılır; ancak sandbox yaşam döngüsü ve isteğe bağlı ayna eşitleme Plugin’e aittir.

**`setupCommand`**, container oluşturulduktan sonra bir kez çalışır (`sh -lc` aracılığıyla). Ağ çıkışı, yazılabilir kök ve root kullanıcı gerektirir.

**Container’lar varsayılan olarak `network: "none"` kullanır** — agent’ın dışarıya erişmesi gerekiyorsa `"bridge"` (veya özel bir bridge ağı) olarak ayarlayın.
`"host"` engellenir. `"container:<id>"`, açıkça
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (son çare) ayarlamadığınız sürece varsayılan olarak engellenir.

**Gelen ekler**, etkin çalışma alanında `media/inbound/*` içine hazırlanır.

**`docker.binds`**, ek host dizinlerini bağlar; global ve agent başına bind’ler birleştirilir.

**Sandbox’ta çalışan tarayıcı** (`sandbox.browser.enabled`): Bir container içinde Chromium + CDP. noVNC URL’si sistem prompt’una enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulaması kullanır ve OpenClaw, parolayı paylaşılan URL’de açığa çıkarmak yerine kısa ömürlü bir token URL’si üretir.

- `allowHostControl: false` (varsayılan), sandbox oturumlarının host tarayıcısını hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` olur (ayrılmış bridge ağı). Yalnızca açıkça global bridge bağlantısı istediğinizde `bridge` olarak ayarlayın.
- `cdpSourceRange`, isteğe bağlı olarak container kenarında CDP girişini bir CIDR aralığıyla sınırlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek host dizinlerini yalnızca sandbox tarayıcı container’ına bağlar. Ayarlandığında (`[]` dahil), tarayıcı container’ı için `docker.binds` yerine geçer.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlanır ve container host’ları için ayarlanmıştır:
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
  - İş akışınız bunlara bağlıysa `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` uzantıları yeniden etkinleştirir.
  - `--renderer-process-limit=2`,
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium’un
    varsayılan süreç sınırını kullanmak için `0` ayarlayın.
  - ayrıca `noSandbox` etkinleştirildiğinde `--no-sandbox`.
  - Varsayılanlar container image taban çizgisidir; container varsayılanlarını değiştirmek için özel
    entrypoint’e sahip özel bir tarayıcı image’ı kullanın.

</Accordion>

Tarayıcı sandboxlaması ve `sandbox.docker.binds` yalnızca Docker’a özeldir.

Image’ları derleyin (kaynak checkout’tan):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Kaynak checkout olmadan npm kurulumları için satır içi `docker build` komutları hakkında bkz. [Sandboxlama § Image’lar ve kurulum](/tr/gateway/sandboxing#images-and-setup).

### `agents.list` (agent başına geçersiz kılmalar)

Bir agent’a kendi TTS sağlayıcısını, sesini, modelini,
stilini veya otomatik TTS modunu vermek için `agents.list[].tts` kullanın. Agent bloğu global
`messages.tts` üzerine derinlemesine birleştirilir; böylece paylaşılan kimlik bilgileri tek yerde kalabilir ve tek tek
agent’lar yalnızca ihtiyaç duydukları ses veya sağlayıcı alanlarını geçersiz kılar. Etkin agent’ın
geçersiz kılması otomatik sesli yanıtlara, `/tts audio`, `/tts status` ve
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

- `id`: kararlı ajan kimliği (zorunlu).
- `default`: birden fazla ayarlandığında ilk olan kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa, listedeki ilk giriş varsayılan olur.
- `model`: string biçimi, model geri dönüşü olmayan katı bir ajan başına birincil model ayarlar; nesne biçimi `{ primary }` de `fallbacks` eklemediğiniz sürece katıdır. O ajanı geri dönüşe dahil etmek için `{ primary, fallbacks: [...] }` kullanın veya katı davranışı açık hale getirmek için `{ primary, fallbacks: [] }` kullanın. Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamadığınız sürece varsayılan geri dönüşleri devralmaya devam eder.
- `params`: `agents.defaults.models` içindeki seçili model girişinin üzerine birleştirilen ajan başına akış parametreleri. Tüm model kataloğunu çoğaltmadan `cacheRetention`, `temperature` veya `maxTokens` gibi ajana özel geçersiz kılmalar için bunu kullanın.
- `tts`: isteğe bağlı ajan başına metinden sese geçersiz kılmaları. Blok, `messages.tts` üzerine derin birleştirme yapar; bu nedenle paylaşılan sağlayıcı kimlik bilgilerini ve geri dönüş politikasını `messages.tts` içinde tutun ve burada yalnızca sağlayıcı, ses, model, stil veya otomatik mod gibi persona özelindeki değerleri ayarlayın.
- `skills`: isteğe bağlı ajan başına Skills izin listesi. Atlanırsa ajan, ayarlanmış olduğunda `agents.defaults.skills` değerini devralır; açık bir liste, varsayılanlarla birleştirilmek yerine onların yerini alır ve `[]` Skills yok anlamına gelir.
- `thinkingDefault`: isteğe bağlı ajan başına varsayılan düşünme seviyesi (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mesaj başına veya oturum düzeyinde geçersiz kılma ayarlanmadığında bu ajan için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Seçili sağlayıcı/model profili hangi değerlerin geçerli olduğunu denetler; Google Gemini için `adaptive`, sağlayıcının sahip olduğu dinamik düşünmeyi korur (Gemini 3/3.1 üzerinde `thinkingLevel` atlanır, Gemini 2.5 üzerinde `thinkingBudget: -1`).
- `reasoningDefault`: isteğe bağlı ajan başına varsayılan akıl yürütme görünürlüğü (`on | off | stream`). Mesaj başına veya oturum düzeyinde akıl yürütme geçersiz kılması ayarlanmadığında bu ajan için `agents.defaults.reasoningDefault` değerini geçersiz kılar.
- `fastModeDefault`: hızlı mod için isteğe bağlı ajan başına varsayılan (`true | false`). Mesaj başına veya oturum düzeyinde hızlı mod geçersiz kılması ayarlanmadığında uygulanır.
- `agentRuntime`: isteğe bağlı ajan başına düşük düzey çalışma zamanı politikası geçersiz kılması. Diğer ajanlar `auto` modunda varsayılan PI geri dönüşünü korurken bir ajanı yalnızca Codex yapmak için `{ id: "codex" }` kullanın.
- `runtime`: isteğe bağlı ajan başına çalışma zamanı tanımlayıcısı. Ajanın varsayılan olarak ACP donanım oturumlarını kullanması gerektiğinde `runtime.acp` varsayılanlarıyla (`agent`, `backend`, `mode`, `cwd`) birlikte `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göreli yol, `http(s)` URL'si veya `data:` URI'si.
- `identity` varsayılanları türetir: `emoji` değerinden `ackReaction`, `name`/`emoji` değerinden `mentionPatterns`.
- `subagents.allowAgents`: açık `sessions_spawn.agentId` hedefleri için ajan kimliklerinin izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı ajan). Kendi kendini hedefleyen `agentId` çağrılarına izin verilmesi gerekiyorsa istekte bulunanın kimliğini ekleyin.
- Sandbox devralma koruması: istekte bulunan oturum sandbox içindeyse, `sessions_spawn` sandbox dışında çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda, `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar; varsayılan: false).

---

## Çok ajanlı yönlendirme

Tek bir Gateway içinde birden çok yalıtılmış ajan çalıştırın. Bkz. [Çok Ajanlı](/tr/concepts/multi-agent).

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
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özel)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Belirlenimci eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam, peer/guild/team yok)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan ajan

Her kademede, eşleşen ilk `bindings` girişi kazanır.

`type: "acp"` girişleri için OpenClaw, tam konuşma kimliğine göre çözümler (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki route bağlama kademe sırasını kullanmaz.

### Ajan başına erişim profilleri

<Accordion title="Tam erişim (sandbox yok)">

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
  - `per-sender` (varsayılan): her gönderici, kanal bağlamı içinde yalıtılmış bir oturum alır.
  - `global`: kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam amaçlandığında kullanın).
- **`dmScope`**: DM'lerin nasıl gruplandığı.
  - `main`: tüm DM'ler ana oturumu paylaşır.
  - `per-peer`: kanallar arasında gönderici kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderici başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderici başına yalıtır (çok hesaplı kullanım için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kanonik kimlikleri sağlayıcı önekli eşlere eşler. `/dock_discord` gibi dock komutları, etkin oturumun yanıt rotasını bağlantılı başka bir kanal eşine geçirmek için aynı eşlemeyi kullanır; bkz. [Kanal dock işlemi](/tr/concepts/channel-docking).
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saatte `atHour` zamanında sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. İkisi de yapılandırıldığında, önce süresi dolan kazanır. Günlük sıfırlama güncelliği oturum satırının `sessionStartedAt` değerini kullanır; boşta sıfırlama güncelliği `lastInteractionAt` değerini kullanır. Heartbeat, Cron uyanmaları, exec bildirimleri ve Gateway defter tutma gibi arka plan/sistem olayı yazmaları `updatedAt` değerini güncelleyebilir, ancak günlük/boşta oturumları güncel tutmaz.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`mainKey`**: eski alan. Çalışma zamanı, ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: ajanlar arası değişimlerde ajanlar arasındaki en fazla karşılıklı yanıt turu (tam sayı, aralık: `0`–`5`). `0`, ping-pong zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleştirir. İlk reddetme kazanır.
- **`maintenance`**: oturum deposu temizliği + saklama denetimleri.
  - `mode`: `warn` yalnızca uyarı yayınlar; `enforce` temizliği uygular.
  - `pruneAfter`: bayat girdiler için yaş eşiği (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki en fazla girdi sayısı (varsayılan `500`). Çalışma zamanı, üretim boyutundaki sınırlar için küçük bir yüksek su tamponuyla toplu temizlik yazar; `openclaw sessions cleanup --enforce` sınırı hemen uygular.
  - `rotateBytes`: kullanımdan kaldırıldı ve yok sayılır; `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.
  - `resetArchiveRetention`: `*.reset.<timestamp>` konuşma dökümü arşivleri için saklama süresi. Varsayılan olarak `pruneAfter` kullanılır; devre dışı bırakmak için `false` ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturumlar dizini disk bütçesi. `warn` modunda uyarıları günlüğe yazar; `enforce` modunda önce en eski yapıtları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonra isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `%80`'i kullanılır.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için global varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan hareketsizlikte otomatik odak kaldırma (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan katı maksimum yaş (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `spawnSessions`: `sessions_spawn` ve ACP iş parçacığı spawn işlemlerinden iş parçacığına bağlı çalışma oturumları oluşturmak için varsayılan kapı. İş parçacığı bağlamaları etkinken varsayılan olarak `true` olur; sağlayıcılar/hesaplar geçersiz kılabilir.
  - `defaultSpawnContext`: iş parçacığına bağlı spawn işlemleri için varsayılan yerel alt ajan bağlamı (`"fork"` veya `"isolated"`). Varsayılan olarak `"fork"` kullanılır.

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

Çözümleme (en özeli kazanır): hesap → kanal → global. `""` devre dışı bırakır ve kademelendirmeyi durdurur. `"auto"` değeri `[{identity.name}]` türetir.

**Şablon değişkenleri:**

| Değişken          | Açıklama                 | Örnek                       |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Kısa model adı           | `claude-opus-4-6`           |
| `{modelFull}`     | Tam model tanımlayıcısı  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Sağlayıcı adı            | `anthropic`                 |
| `{thinkingLevel}` | Geçerli düşünme düzeyi   | `high`, `low`, `off`        |
| `{identity.name}` | Ajan kimliği adı         | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarlı değildir. `{think}`, `{thinkingLevel}` için bir takma addır.

### Onay reaksiyonu

- Varsayılan olarak etkin ajanın `identity.emoji` değeri kullanılır; yoksa `"👀"` kullanılır. Devre dışı bırakmak için `""` olarak ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik yedeği.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram, WhatsApp ve BlueBubbles gibi reaksiyon destekleyen kanallarda yanıttan sonra onayı kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord ve Telegram üzerinde yaşam döngüsü durum reaksiyonlarını etkinleştirir.
  Slack ve Discord üzerinde ayarlanmamış olması, onay reaksiyonları etkin olduğunda durum reaksiyonlarını etkin tutar.
  Telegram üzerinde yaşam döngüsü durum reaksiyonlarını etkinleştirmek için bunu açıkça `true` olarak ayarlayın.

### Gelen debounce

Aynı gönderenden gelen hızlı, yalnızca metin içeren iletileri tek bir ajan turunda toplar. Medya/ekler hemen boşaltılır. Denetim komutları debounce işleminden geçmez.

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
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılan olarak `false` değerindedir (isteğe bağlı katılım).
- API anahtarları yedek olarak `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine düşer.
- Paketle gelen konuşma sağlayıcıları Plugin sahipliğindedir. `plugins.allow` ayarlanmışsa kullanmak istediğiniz her TTS sağlayıcı Plugin öğesini ekleyin; örneğin Edge TTS için `microsoft`. Eski `edge` sağlayıcı kimliği, `microsoft` için takma ad olarak kabul edilir.
- `providers.openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası config, ardından `OPENAI_TTS_BASE_URL`, ardından `https://api.openai.com/v1` şeklindedir.
- `providers.openai.baseUrl` OpenAI dışı bir uç noktaya işaret ettiğinde OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak ele alır ve model/ses doğrulamasını gevşetir.

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- Birden çok Talk sağlayıcısı yapılandırıldığında `talk.provider`, `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Talk anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir ve otomatik olarak `talk.providers.<provider>` içine geçirilir.
- Ses kimlikleri yedek olarak `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerlerine düşer.
- `providers.*.apiKey`, düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` yedeği yalnızca hiçbir Talk API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Talk yönergelerinin kolay adlar kullanmasını sağlar.
- `providers.mlx.modelId`, macOS yerel MLX yardımcısı tarafından kullanılan Hugging Face deposunu seçer. Atlanırsa macOS `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatma, varsa paketle gelen `openclaw-mlx-tts` yardımcısı üzerinden veya `PATH` üzerindeki bir yürütülebilir dosya üzerinden çalışır; `OPENCLAW_MLX_TTS_BIN`, geliştirme için yardımcı yolunu geçersiz kılar.
- `speechLocale`, iOS/macOS Talk konuşma tanıma tarafından kullanılan BCP 47 yerel ayar kimliğini belirler. Aygıt varsayılanını kullanmak için ayarlamadan bırakın.
- `silenceTimeoutMs`, kullanıcı sessizliğinden sonra Talk modunun dökümü göndermeden önce ne kadar bekleyeceğini denetler. Ayarlanmamışsa platformun varsayılan duraklama penceresi korunur (`macOS ve Android üzerinde 700 ms, iOS üzerinde 900 ms`).

---

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer tüm config anahtarları
- [Yapılandırma](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
