---
read_when:
    - Ajan varsayılanlarını ayarlama (modeller, düşünme, çalışma alanı, Heartbeat, medya, Skills)
    - Çok ajanlı yönlendirmeyi ve bağlamaları yapılandırma
    - Oturum, ileti teslimi ve konuşma modu davranışını ayarlama
summary: Ajan varsayılanları, çoklu ajan yönlendirmesi, oturum, mesajlar ve konuşma yapılandırması
title: Yapılandırma — ajanlar
x-i18n:
    generated_at: "2026-05-03T08:55:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b25371c34b9f8b0cacce021879e43e6a65b86d626dc87d5bfa05dcae80ac32e4
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*` ve `talk.*` altındaki ajan kapsamındaki yapılandırma anahtarları. Kanallar, araçlar, Gateway çalışma zamanı ve diğer
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

Sistem isteminin Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmazsa OpenClaw, çalışma alanından yukarı doğru ilerleyerek otomatik algılar.

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

- Varsayılan olarak sınırsız skills için `agents.defaults.skills` öğesini atlayın.
- Varsayılanları devralmak için `agents.list[].skills` öğesini atlayın.
- Skills olmaması için `agents.list[].skills: []` ayarlayın.
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

Çalışma alanı bootstrap dosyalarının sistem istemine ne zaman enjekte edileceğini denetler. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam turları (tamamlanmış bir asistan yanıtından sonra) çalışma alanı bootstrap yeniden enjeksiyonunu atlayarak istem boyutunu azaltır. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler yine de bağlamı yeniden oluşturur.
- `"never"`: her turda çalışma alanı bootstrap ve bağlam dosyası enjeksiyonunu devre dışı bırakır. Bunu yalnızca istem yaşam döngüsünün tamamını kendisi yöneten ajanlar için kullanın (özel bağlam motorları, kendi bağlamını oluşturan yerel çalışma zamanları veya bootstrap gerektirmeyen özel iş akışları). Heartbeat ve Compaction kurtarma turları da enjeksiyonu atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Kesilmeden önce çalışma alanı bootstrap dosyası başına en fazla karakter sayısı. Varsayılan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı bootstrap dosyaları genelinde enjekte edilen en fazla toplam karakter sayısı. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bootstrap bağlamı kesildiğinde ajan tarafından görülebilen uyarı metnini denetler.
Varsayılan: `"once"`.

- `"off"`: uyarı metnini sistem istemine hiçbir zaman enjekte etme.
- `"once"`: uyarıyı benzersiz kesme imzası başına bir kez enjekte et (önerilir).
- `"always"`: kesme varsa uyarıyı her çalıştırmada enjekte et.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw, birden fazla yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar tek bir genel düğmeden akmak yerine bilerek alt sistemlere göre ayrılmıştır.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı bootstrap enjeksiyonu.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil tek seferlik sıfırlama/başlangıç model çalıştırması girişi. Yalın sohbet `/new` ve `/reset` komutları, modeli çağırmadan onaylanır.
- `skills.limits.*`:
  sistem istemine enjekte edilen kompakt skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipliğindeki bloklar.
- `memory.qmd.limits.*`:
  dizinlenmiş bellek arama parçacığı ve enjeksiyon boyutlandırması.

Yalnızca bir ajan farklı bir bütçeye ihtiyaç duyduğunda eşleşen ajan başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Sıfırlama/başlangıç model çalıştırmalarında enjekte edilen ilk tur başlangıç girişini denetler.
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

- `memoryGetMaxChars`: kesme meta verileri ve devam bildirimi eklenmeden önce varsayılan `memory_get` alıntı sınırı.
- `memoryGetDefaultLines`: `lines` atlandığında varsayılan `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcı sonuçlar ve taşma kurtarma için kullanılan canlı araç sonucu sınırı.
- `postCompactionMaxChars`: Compaction sonrası yenileme enjeksiyonu sırasında kullanılan AGENTS.md alıntı sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` düğmeleri için ajan başına geçersiz kılma. Atlanan alanlar `agents.defaults.contextLimits` değerinden devralır.

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

Sistem istemine enjekte edilen kompakt skills listesi için genel sınır. Bu, `SKILL.md` dosyalarının isteğe bağlı okunmasını etkilemez.

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

Sağlayıcı çağrılarından önce transkript/araç görüntü bloklarındaki görüntünün en uzun kenarı için en büyük piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision-token kullanımını ve istek yükü boyutunu azaltır.
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
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - `image` araç yolu tarafından görüntü modeli yapılandırması olarak kullanılır.
  - Seçilen/varsayılan model görüntü girdisi kabul edemediğinde yedek yönlendirme için de kullanılır.
  - Açık `provider/model` referanslarını tercih edin. Çıplak kimlikler uyumluluk için kabul edilir; çıplak bir kimlik `models.providers.*.models` içinde yapılandırılmış, görüntü destekli bir girişle benzersiz şekilde eşleşirse OpenClaw bunu o sağlayıcıya niteler. Belirsiz yapılandırılmış eşleşmeler açık bir sağlayıcı öneki gerektirir.
- `imageGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görüntü oluşturma yeteneği ve görüntü oluşturan gelecekteki herhangi bir araç/Plugin yüzeyi tarafından kullanılır.
  - Tipik değerler: yerel Gemini görüntü oluşturma için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev`, OpenAI Images için `openai/gpt-image-2` veya saydam arka planlı OpenAI PNG/WebP çıktısı için `openai/gpt-image-1.5`.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı görüntü oluşturma sağlayıcılarını sağlayıcı kimliği sırasına göre dener.
- `musicGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik oluşturma yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasına göre dener.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video oluşturma yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından kalan kayıtlı video oluşturma sağlayıcılarını sağlayıcı kimliği sırasına göre dener.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Paketle gelen Qwen video oluşturma sağlayıcısı en fazla 1 çıktı videosunu, 1 giriş görüntüsünü, 4 giriş videosunu, 10 saniye süreyi ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirme için `pdf` aracı tarafından kullanılır.
  - Atlanırsa PDF aracı `imageModel` değerine, ardından çözümlenen oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı zamanında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyutu sınırı.
- `pdfMaxPages`: `pdf` aracında çıkarma yedek modunun dikkate aldığı varsayılan en yüksek sayfa sayısı.
- `verboseDefault`: ajanlar için varsayılan ayrıntılı çıktı düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `reasoningDefault`: ajanlar için varsayılan akıl yürütme görünürlüğü. Değerler: `"off"`, `"on"`, `"stream"`. Ajan başına `agents.list[].reasoningDefault` bu varsayılanı geçersiz kılar. Yapılandırılmış akıl yürütme varsayılanları, yalnızca mesaj başına veya oturum akıl yürütme geçersiz kılması ayarlanmadığında sahipler, yetkili gönderenler veya operatör-yönetici Gateway bağlamları için uygulanır.
- `elevatedDefault`: ajanlar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (örn. API anahtarı erişimi için `openai/gpt-5.5` veya Codex OAuth için `openai-codex/gpt-5.5`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, ardından tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner (kullanımdan kaldırılmış uyumluluk davranışı; bu nedenle açık `provider/model` tercih edin). Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw güncel olmayan, kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models`: `/model` için yapılandırılmış model kataloğu ve izin listesi. Her giriş `alias` (kısayol) ve `params` (sağlayıcıya özgü, örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`) içerebilir.
  - Güvenli düzenlemeler: giriş eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece mevcut izin listesi girişlerini kaldıracak değiştirmeleri reddeder.
  - Sağlayıcı kapsamlı yapılandırma/başlatma akışları seçilen sağlayıcı modellerini bu haritaya birleştirir ve önceden yapılandırılmış alakasız sağlayıcıları korur.
  - Doğrudan OpenAI Responses modelleri için sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` eklemeyi durdurmak için `params.responsesServerCompaction: false` kullanın veya eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI sunucu tarafı Compaction](/tr/providers/openai#server-side-compaction-responses-api).
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` altında ayarlanır (örn. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (genel taban), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır; ardından `agents.list[].params` (eşleşen ajan kimliği) anahtara göre geçersiz kılar. Ayrıntılar için [İstem Önbelleğe Alma](/tr/reference/prompt-caching) bölümüne bakın.
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu proxy'ler için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş geçiş JSON'u. Oluşturulan istek anahtarlarıyla çakışırsa ek gövde kazanır; yerel olmayan completions rotaları sonrasında yine de yalnızca OpenAI'ye ait `store` değerini çıkarır.
- `params.chat_template_kwargs`: üst düzey `api: "openai-completions"` istek gövdelerine birleştirilen vLLM/OpenAI uyumlu sohbet şablonu bağımsız değişkenleri. Düşünme kapalıyken `vllm/nemotron-3-*` için paketle gelen vLLM Plugin otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir; açık `chat_template_kwargs` oluşturulan varsayılanları geçersiz kılar ve `extra_body.chat_template_kwargs` yine son önceliğe sahiptir. vLLM Qwen düşünme kontrolleri için bu model girişinde `params.qwenThinkingFormat` değerini `"chat-template"` veya `"top-level"` olarak ayarlayın.
- `compat.supportedReasoningEfforts`: model başına OpenAI uyumlu akıl yürütme çabası listesi. Gerçekten kabul eden özel uç noktalar için `"xhigh"` ekleyin; OpenClaw daha sonra bu yapılandırılmış sağlayıcı/model için komut menülerinde, Gateway oturum satırlarında, oturum yaması doğrulamasında, ajan CLI doğrulamasında ve `llm-task` doğrulamasında `/think xhigh` sunar. Arka uç kurallı bir düzey için sağlayıcıya özgü bir değer istiyorsa `compat.reasoningEffortMap` kullanın.
- `params.preserveThinking`: korunmuş düşünme için yalnızca Z.AI'ye özgü açık katılım. Etkinleştirildiğinde ve düşünme açık olduğunda OpenClaw `thinking.clear_thinking: false` gönderir ve önceki `reasoning_content` değerini yeniden oynatır; bkz. [Z.AI düşünme ve korunmuş düşünme](/tr/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: varsayılan düşük düzey ajan çalışma zamanı ilkesi. Atlanan kimlik varsayılan olarak OpenClaw Pi olur. Yerleşik PI donanımını zorlamak için `id: "pi"`, kayıtlı Plugin donanımlarının desteklenen modelleri sahiplenmesine ve hiçbiri eşleşmediğinde PI kullanılmasına izin vermek için `id: "auto"`, bu donanımı zorunlu kılmak için `id: "codex"` gibi kayıtlı bir donanım kimliği veya `id: "claude-cli"` gibi desteklenen bir CLI arka uç takma adı kullanın. Açık Plugin çalışma zamanları, donanım kullanılamadığında veya başarısız olduğunda kapalı şekilde başarısız olur. Model referanslarını `provider/model` olarak kurallı tutun; Codex, Claude CLI, Gemini CLI ve diğer yürütme arka uçlarını eski çalışma zamanı sağlayıcı önekleri yerine çalışma zamanı yapılandırması üzerinden seçin. Bunun sağlayıcı/model seçiminden nasıl farklı olduğunu görmek için [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümüne bakın.
- Bu alanları değiştiren yapılandırma yazıcıları (örneğin `/models set`, `/models set-image` ve yedek ekleme/kaldırma komutları) kurallı nesne biçimini kaydeder ve mümkün olduğunda mevcut yedek listelerini korur.
- `maxConcurrent`: oturumlar arasında en fazla paralel ajan çalıştırması (her oturum yine seri çalışır). Varsayılan: 4.

### `agents.defaults.agentRuntime`

`agentRuntime`, ajan dönüşlerini hangi düşük düzey yürütücünün çalıştıracağını denetler. Çoğu
dağıtım varsayılan OpenClaw Pi çalışma zamanını korumalıdır. Güvenilir bir
Plugin, paketle gelen Codex uygulama sunucusu donanımı gibi yerel bir donanım
sağladığında veya Claude CLI gibi desteklenen bir CLI arka ucu istediğinizde bunu kullanın. Zihinsel
model için bkz. [Ajan çalışma zamanları](/tr/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, kayıtlı bir Plugin donanım kimliği veya desteklenen bir CLI arka uç takma adı. Paketle gelen Codex Plugin `codex` kaydeder; paketle gelen Anthropic Plugin `claude-cli` CLI arka ucunu sağlar.
- `id: "auto"` kayıtlı Plugin donanımlarının desteklenen dönüşleri sahiplenmesine izin verir ve hiçbir donanım eşleşmediğinde PI kullanır. `id: "codex"` gibi açık bir Plugin çalışma zamanı bu donanımı zorunlu kılar ve kullanılamazsa veya başarısız olursa kapalı şekilde başarısız olur.
- Ortam geçersiz kılması: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` bu süreç için `id` değerini geçersiz kılar.
- Yalnızca Codex dağıtımları için `model: "openai/gpt-5.5"` ve `agentRuntime.id: "codex"` ayarlayın.
- Claude CLI dağıtımları için `agentRuntime.id: "claude-cli"` ile birlikte `model: "anthropic/claude-opus-4-7"` tercih edin. Eski `claude-cli/claude-opus-4-7` model referansları uyumluluk için hâlâ çalışır, ancak yeni yapılandırma sağlayıcı/model seçimini kurallı tutmalı ve yürütme arka ucunu `agentRuntime.id` içine koymalıdır.
- Eski çalışma zamanı ilkesi anahtarları `openclaw doctor --fix` tarafından `agentRuntime` olarak yeniden yazılır.
- Donanım seçimi, ilk gömülü çalıştırmadan sonra oturum kimliği başına sabitlenir. Yapılandırma/ortam değişiklikleri mevcut bir dökümü değil, yeni veya sıfırlanmış oturumları etkiler. Döküm geçmişi olan ancak kayıtlı sabitlemesi olmayan eski oturumlar PI sabitlenmiş olarak değerlendirilir. `/status` etkili çalışma zamanını bildirir; örneğin `Runtime: OpenClaw Pi Default` veya `Runtime: OpenAI Codex`.
- Bu yalnızca metin ajan dönüşü yürütmesini denetler. Medya oluşturma, görüntü, PDF, müzik, video ve TTS hâlâ kendi sağlayıcı/model ayarlarını kullanır.

**Yerleşik takma ad kısaltmaları** (yalnızca model `agents.defaults.models` içinde olduğunda uygulanır):

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

Yapılandırılmış takma adlarınız varsayılanlara her zaman üstün gelir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarlamadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece düşünme modunu otomatik olarak etkinleştirir.
Z.AI modelleri, araç çağrısı akışı için varsayılan olarak `tool_stream` özelliğini etkinleştirir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
Anthropic Claude 4.6 modelleri, açık bir düşünme seviyesi ayarlanmadığında varsayılan olarak `adaptive` düşünmeyi kullanır.

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
- `sessionArg` ayarlandığında oturumlar desteklenir.
- `imageArg` dosya yollarını kabul ettiğinde görüntü aktarımı desteklenir.

### `agents.defaults.systemPromptOverride`

OpenClaw tarafından birleştirilen sistem isteminin tamamını sabit bir dizeyle değiştirir. Varsayılan düzeyde (`agents.defaults.systemPromptOverride`) veya ajan başına (`agents.list[].systemPromptOverride`) ayarlayın. Ajan başına değerler önceliklidir; boş veya yalnızca boşluklardan oluşan değer yok sayılır. Kontrollü istem deneyleri için kullanışlıdır.

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

Model ailesine göre uygulanan, sağlayıcıdan bağımsız istem katmanları. GPT-5 ailesi model kimlikleri, sağlayıcılar arasında paylaşılan davranış sözleşmesini alır; `personality` yalnızca dostane etkileşim stili katmanını denetler.

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
- Bu paylaşılan ayar yapılmadığında eski `plugins.entries.openai.config.personality` hâlâ okunur.

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
- `includeSystemPromptSection`: false olduğunda, Heartbeat bölümünü sistem isteminden çıkarır ve `HEARTBEAT.md` dosyasının bootstrap bağlamına eklenmesini atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda, heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.
- `timeoutSeconds`: bir heartbeat ajan dönüşünün iptal edilmeden önce izin verilen en uzun süresi, saniye cinsinden. `agents.defaults.timeoutSeconds` değerini kullanmak için ayarlamadan bırakın.
- `directPolicy`: doğrudan/DM teslim politikası. `allow` (varsayılan) doğrudan hedefe teslimata izin verir. `block` doğrudan hedefe teslimatı bastırır ve `reason=dm-blocked` yayar.
- `lightContext`: true olduğunda, heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım kalıbı. Heartbeat başına token maliyetini ~100K'den ~2-5K token'a düşürür.
- `skipWhenBusy`: true olduğunda, heartbeat çalıştırmaları ek meşgul kanallarda ertelenir: alt ajan veya iç içe komut işi. Cron kanalları, bu bayrak olmadan bile heartbeat'leri her zaman erteler.
- Ajan başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir ajan `heartbeat` tanımladığında, heartbeat'leri **yalnızca bu ajanlar** çalıştırır.
- Heartbeat'ler tam ajan dönüşleri çalıştırır — daha kısa aralıklar daha fazla token tüketir.

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
- `provider`: kayıtlı bir compaction sağlayıcı Plugin kimliği. Ayarlandığında, yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` işlevi çağrılır. Başarısızlık durumunda yerleşik yönteme geri döner. Bir sağlayıcı ayarlamak `mode: "safeguard"` kullanımını zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw işlemi iptal etmeden önce tek bir compaction işlemi için izin verilen en fazla saniye. Varsayılan: `900`.
- `keepRecentTokens`: en son transcript kuyruğunu birebir tutmak için Pi kesme noktası bütçesi. Manuel `/compact`, açıkça ayarlandığında buna uyar; aksi halde manuel compaction katı bir kontrol noktasıdır.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, compaction özetlemesi sırasında yerleşik opak tanımlayıcı saklama rehberliğini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: safeguard özetleri için bozuk biçimli çıktı durumunda yeniden deneme kontrolleri. Safeguard modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` ayarlayın.
- `midTurnPrecheck`: isteğe bağlı Pi araç döngüsü basınç kontrolü. `enabled: true` olduğunda OpenClaw, araç sonuçları eklendikten sonra ve bir sonraki model çağrısından önce bağlam basıncını kontrol eder. Bağlam artık sığmıyorsa, istemi göndermeden önce geçerli denemeyi iptal eder ve araç sonuçlarını kısaltmak veya compact edip yeniden denemek için mevcut ön kontrol kurtarma yolunu yeniden kullanır. Hem `default` hem de `safeguard` compaction modlarıyla çalışır. Varsayılan: devre dışı.
- `postCompactionSections`: compaction sonrasında yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Varsayılan olarak `["Session Startup", "Red Lines"]`; yeniden enjeksiyonu devre dışı bırakmak için `[]` ayarlayın. Ayarlanmamışsa veya açıkça bu varsayılan çifte ayarlanmışsa, eski `Every Session`/`Safety` başlıkları da geriye dönük uyumluluk yedeği olarak kabul edilir.
- `model`: yalnızca compaction özetlemesi için isteğe bağlı `provider/model-id` geçersiz kılması. Ana oturum bir modeli korumalı, ancak compaction özetleri başka bir modelde çalışmalıysa bunu kullanın; ayarlanmadığında compaction oturumun birincil modelini kullanır.
- `maxActiveTranscriptBytes`: etkin JSONL eşik değerini aştığında çalıştırma öncesinde normal yerel compaction tetikleyen isteğe bağlı bayt eşiği (`number` veya `"20mb"` gibi dizeler). Başarılı compaction'ın daha küçük bir ardıl transcript'e dönebilmesi için `truncateAfterCompaction` gerektirir. Ayarlanmamışsa veya `0` ise devre dışıdır.
- `notifyUser`: `true` olduğunda, compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin, "Bağlam compact ediliyor..." ve "Compaction tamamlandı"). Compaction'ı sessiz tutmak için varsayılan olarak devre dışıdır.
- `memoryFlush`: kalıcı anıları saklamak için otomatik compaction öncesinde sessiz ajanik dönüş. Bu bakım dönüşünün yerel bir modelde kalması gerektiğinde `model` değerini `ollama/qwen3:8b` gibi tam bir provider/model olarak ayarlayın; geçersiz kılma etkin oturum yedek zincirini devralmaz. Çalışma alanı salt okunur olduğunda atlanır.

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
- `ttl`, budamanın ne sıklıkla yeniden çalışabileceğini denetler (son önbellek dokunuşundan sonra).
- Budama önce aşırı büyük araç sonuçlarını yumuşak biçimde kısaltır, ardından gerekirse daha eski araç sonuçlarını sert biçimde temizler.

**Yumuşak kısaltma** başlangıcı + sonu tutar ve ortaya `...` ekler.

**Sert temizleme** araç sonucunun tamamını yer tutucuyla değiştirir.

Notlar:

- Görüntü blokları hiçbir zaman kısaltılmaz/temizlenmez.
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

- Telegram dışı kanallar, blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerektirir.
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına varyantlar). Signal/Slack/Discord/Google Chat varsayılanı `minChars: 1500`.
- `humanDelay`: blok yanıtları arasında rastgeleleştirilmiş duraklama. `natural` = 800-2500ms. Ajan başına geçersiz kılma: `agents.list[].humanDelay`.

Davranış + parçalara ayırma ayrıntıları için bkz. [Akış](/tr/concepts/streaming).

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

- Varsayılanlar: doğrudan sohbetler/bahsetmeler için `instant`, bahsedilmeyen grup sohbetleri için `message`.
- Oturum bazında geçersiz kılmalar: `session.typingMode`, `session.typingIntervalSeconds`.

Bkz. [Yazma Göstergeleri](/tr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü ajan için isteğe bağlı korumalı alan. Tam kılavuz için bkz. [Korumalı Alan](/tr/gateway/sandboxing).

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

<Accordion title="Korumalı alan ayrıntıları">

**Arka uç:**

- `docker`: yerel Docker çalışma zamanı (varsayılan)
- `ssh`: genel SSH destekli uzak çalışma zamanı
- `openshell`: OpenShell çalışma zamanı

`backend: "openshell"` seçildiğinde, çalışma zamanına özgü ayarlar
`plugins.entries.openshell.config` konumuna taşınır.

**SSH arka uç yapılandırması:**

- `target`: `user@host[:port]` biçiminde SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam bazlı çalışma alanları için kullanılan mutlak uzak kök
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH'ye iletilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw'ın çalışma zamanında geçici dosyalara materyalize ettiği satır içi içerikler veya SecretRef'ler
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host anahtarı ilkesi ayarları

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` yerine geçer
- `certificateData`, `certificateFile` yerine geçer
- `knownHostsData`, `knownHostsFile` yerine geçer
- SecretRef destekli `*Data` değerleri, korumalı alan oturumu başlamadan önce etkin secrets çalışma zamanı anlık görüntüsünden çözümlenir

**SSH arka uç davranışı:**

- oluşturma veya yeniden oluşturmadan sonra uzak çalışma alanını bir kez tohumlar
- ardından uzak SSH çalışma alanını kanonik tutar
- `exec`, dosya araçları ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri otomatik olarak host'a geri eşitlemez
- korumalı alan tarayıcı container'larını desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam bazlı korumalı alan çalışma alanı
- `ro`: `/workspace` konumunda korumalı alan çalışma alanı, `/agent` konumunda salt okunur bağlanmış ajan çalışma alanı
- `rw`: `/workspace` konumunda okuma/yazma olarak bağlanmış ajan çalışma alanı

**Kapsam:**

- `session`: oturum bazında container + çalışma alanı
- `agent`: ajan başına bir container + çalışma alanı (varsayılan)
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

- `mirror`: exec öncesinde uzağı yerelden tohumlar, exec sonrasında geri eşitler; yerel çalışma alanı kanonik kalır
- `remote`: korumalı alan oluşturulduğunda uzağı bir kez tohumlar, ardından uzak çalışma alanını kanonik tutar

`remote` modunda, OpenClaw dışında yapılan host-yerel düzenlemeler tohumlama adımından sonra korumalı alana otomatik olarak eşitlenmez.
Aktarım, OpenShell korumalı alanına SSH ile yapılır; ancak korumalı alan yaşam döngüsünü ve isteğe bağlı ayna eşitlemeyi Plugin yönetir.

**`setupCommand`**, container oluşturulduktan sonra bir kez çalışır (`sh -lc` aracılığıyla). Ağ çıkışı, yazılabilir root ve root kullanıcısı gerektirir.

**Container'lar varsayılan olarak `network: "none"` kullanır** — ajan dış erişime ihtiyaç duyuyorsa bunu `"bridge"` (veya özel bir bridge ağı) olarak ayarlayın.
`"host"` engellenir. `"container:<id>"`, açıkça
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (son çare) ayarlamadığınız sürece varsayılan olarak engellenir.

**Gelen ekler**, etkin çalışma alanında `media/inbound/*` içine hazırlanır.

**`docker.binds`**, ek host dizinlerini bağlar; genel ve ajan bazlı bağlamalar birleştirilir.

**Korumalı alan tarayıcısı** (`sandbox.browser.enabled`): Container içinde Chromium + CDP. noVNC URL'si sistem prompt'una enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulaması kullanır ve OpenClaw, paylaşılan URL'de parolayı açığa çıkarmak yerine kısa ömürlü bir token URL'si yayar.

- `allowHostControl: false` (varsayılan), korumalı alan oturumlarının host tarayıcıyı hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` olur (adanmış bridge ağı). Yalnızca açıkça genel bridge bağlantısı istediğinizde `bridge` olarak ayarlayın.
- `cdpSourceRange`, isteğe bağlı olarak container kenarında CDP girişini bir CIDR aralığıyla sınırlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek host dizinlerini yalnızca korumalı alan tarayıcı container'ına bağlar. Ayarlandığında (`[]` dahil), tarayıcı container'ı için `docker.binds` yerine geçer.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlanır ve container host'ları için ayarlanmıştır:
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
  - `--renderer-process-limit=2`, `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium'un varsayılan işlem sınırını kullanmak için `0` ayarlayın.
  - ayrıca `noSandbox` etkinleştirildiğinde `--no-sandbox`.
  - Varsayılanlar container imajı temelidir; container varsayılanlarını değiştirmek için özel bir entrypoint içeren özel bir tarayıcı imajı kullanın.

</Accordion>

Tarayıcı korumalı alanı ve `sandbox.docker.binds` yalnızca Docker içindir.

İmajları derleyin (kaynak checkout'tan):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Kaynak checkout olmadan npm kurulumları için satır içi `docker build` komutları adına bkz. [Korumalı Alan § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup).

### `agents.list` (ajan bazında geçersiz kılmalar)

Bir ajana kendi TTS sağlayıcısını, sesini, modelini,
stilini veya otomatik TTS modunu vermek için `agents.list[].tts` kullanın. Ajan bloğu, genel
`messages.tts` üzerinde derin birleştirme yapar; böylece paylaşılan kimlik bilgileri tek bir yerde kalırken tek tek
ajanlar yalnızca ihtiyaç duydukları ses veya sağlayıcı alanlarını geçersiz kılar. Etkin ajanın
geçersiz kılması otomatik sesli yanıtlara, `/tts audio`, `/tts status` ve
`tts` ajan aracına uygulanır. Sağlayıcı örnekleri ve öncelik için bkz. [Metinden konuşmaya](/tr/tools/tts#per-agent-voice-overrides).

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

- `id`: kararlı aracı kimliği (gerekli).
- `default`: birden fazla ayarlandığında ilk olan kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa ilk liste girdisi varsayılan olur.
- `model`: dize biçimi, model geri dönüşü olmayan katı bir aracı başına birincil model ayarlar; nesne biçimi `{ primary }` de `fallbacks` eklemediğiniz sürece katıdır. Bu aracıyı geri dönüşe dahil etmek için `{ primary, fallbacks: [...] }`, katı davranışı açık hale getirmek için `{ primary, fallbacks: [] }` kullanın. Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamadığınız sürece varsayılan geri dönüşleri devralmaya devam eder.
- `params`: `agents.defaults.models` içindeki seçili model girdisinin üzerine birleştirilen aracı başına akış parametreleri. Tüm model kataloğunu çoğaltmadan `cacheRetention`, `temperature` veya `maxTokens` gibi aracıya özgü geçersiz kılmalar için bunu kullanın.
- `tts`: isteğe bağlı aracı başına metinden konuşmaya geçersiz kılmaları. Blok, `messages.tts` üzerine derin birleştirme yapar; bu nedenle paylaşılan sağlayıcı kimlik bilgilerini ve geri dönüş politikasını `messages.tts` içinde tutun ve burada yalnızca sağlayıcı, ses, model, stil veya otomatik mod gibi kişiye özgü değerleri ayarlayın.
- `skills`: isteğe bağlı aracı başına skill izin listesi. Atlanırsa aracı, ayarlandığında `agents.defaults.skills` değerini devralır; açık bir liste varsayılanlarla birleştirilmek yerine onların yerini alır ve `[]` skills yok demektir.
- `thinkingDefault`: isteğe bağlı aracı başına varsayılan düşünme düzeyi (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mesaj veya oturum başına geçersiz kılma ayarlanmadığında bu aracı için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Seçili sağlayıcı/model profili hangi değerlerin geçerli olduğunu denetler; Google Gemini için `adaptive`, sağlayıcıya ait dinamik düşünmeyi korur (Gemini 3/3.1'de `thinkingLevel` atlanır, Gemini 2.5'te `thinkingBudget: -1` kullanılır).
- `reasoningDefault`: isteğe bağlı aracı başına varsayılan akıl yürütme görünürlüğü (`on | off | stream`). Mesaj veya oturum başına akıl yürütme geçersiz kılma ayarlanmadığında bu aracı için `agents.defaults.reasoningDefault` değerini geçersiz kılar.
- `fastModeDefault`: hızlı mod için isteğe bağlı aracı başına varsayılan (`true | false`). Mesaj veya oturum başına hızlı mod geçersiz kılma ayarlanmadığında uygulanır.
- `agentRuntime`: isteğe bağlı aracı başına düşük düzey çalışma zamanı ilkesi geçersiz kılması. Diğer aracılar `auto` modunda varsayılan PI geri dönüşünü korurken bir aracıyı yalnızca Codex yapmak için `{ id: "codex" }` kullanın.
- `runtime`: isteğe bağlı aracı başına çalışma zamanı tanımlayıcısı. Aracının varsayılan olarak ACP koşum oturumlarını kullanması gerektiğinde `runtime.acp` varsayılanlarıyla (`agent`, `backend`, `mode`, `cwd`) birlikte `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göre yol, `http(s)` URL'si veya `data:` URI'si.
- `identity` varsayılanları türetir: `emoji` değerinden `ackReaction`, `name`/`emoji` değerinden `mentionPatterns`.
- `subagents.allowAgents`: açık `sessions_spawn.agentId` hedefleri için aracı kimliklerinin izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı aracı). Kendi kendini hedefleyen `agentId` çağrılarına izin verilmesi gerekiyorsa istekte bulunan kimliğini dahil edin.
- Sandbox devralma koruması: istekte bulunan oturum sandbox içindeyse `sessions_spawn`, sandbox dışında çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: doğru olduğunda `agentId` değerini atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorlar; varsayılan: false).

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
6. Varsayılan aracı

Her katmanda, ilk eşleşen `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw, tam konuşma kimliğine göre çözümler (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki route bağlama katman sırasını kullanmaz.

### Aracı başına erişim profilleri

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

Öncelik ayrıntıları için [Çok Temsilcili Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

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
  - `per-peer`: kanallar arasında gönderen kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderen başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderen başına yalıtır (çok hesaplı kullanım için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kurallı kimlikleri sağlayıcı önekli eşlerle eşler. `/dock_discord` gibi kenetleme komutları, etkin oturumun yanıt rotasını başka bir bağlı kanal eşine geçirmek için aynı eşlemeyi kullanır; bkz. [Kanal kenetleme](/tr/concepts/channel-docking).
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saate göre `atHour` saatinde sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. İkisi de yapılandırıldığında, önce hangisinin süresi dolarsa o geçerli olur. Günlük sıfırlama güncelliği oturum satırının `sessionStartedAt` değerini kullanır; boşta sıfırlama güncelliği `lastInteractionAt` değerini kullanır. Heartbeat, Cron uyanmaları, exec bildirimleri ve Gateway kayıt tutma gibi arka plan/sistem olayı yazımları `updatedAt` değerini güncelleyebilir, ancak günlük/boşta oturumları güncel tutmaz.
- **`resetByType`**: türe göre geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`mainKey`**: eski alan. Çalışma zamanı, ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: temsilciden temsilciye değişimlerde temsilciler arasındaki en fazla karşılıklı yanıt turu sayısı (tam sayı, aralık: `0`-`5`). `0`, karşılıklı zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleştirir. İlk reddetme kazanır.
- **`maintenance`**: oturum deposu temizliği + saklama denetimleri.
  - `mode`: `warn` yalnızca uyarılar yayınlar; `enforce` temizliği uygular.
  - `pruneAfter`: eski girdiler için yaş sınırı (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki en fazla girdi sayısı (varsayılan `500`). Çalışma zamanı, üretim boyutundaki sınırlar için küçük bir yüksek su arabelleğiyle toplu temizlik yazar; `openclaw sessions cleanup --enforce` sınırı hemen uygular.
  - `rotateBytes`: kullanımdan kaldırıldı ve yok sayılır; `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.
  - `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama. Varsayılan olarak `pruneAfter` kullanılır; devre dışı bırakmak için `false` olarak ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturumlar dizini disk bütçesi. `warn` modunda uyarıları günlüğe yazar; `enforce` modunda önce en eski yapıtları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonra isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `%80`'idir.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan etkinliksizlikte otomatik odaktan çıkarma (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan katı azami yaş (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `spawnSessions`: `sessions_spawn` ve ACP iş parçacığı oluşturmalarından iş parçacığına bağlı çalışma oturumları oluşturmak için varsayılan kapı. İş parçacığı bağlamaları etkin olduğunda varsayılan olarak `true` olur; sağlayıcılar/hesaplar geçersiz kılabilir.
  - `defaultSpawnContext`: iş parçacığına bağlı oluşturmalar için varsayılan yerel alt temsilci bağlamı (`"fork"` veya `"isolated"`). Varsayılan değer `"fork"`.

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

Kanal/hesap bazlı geçersiz kılmalar: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Çözümleme (en özel olan kazanır): hesap → kanal → global. `""` devre dışı bırakır ve kademelenmeyi durdurur. `"auto"` `[{identity.name}]` değerini türetir.

**Şablon değişkenleri:**

| Değişken          | Açıklama                 | Örnek                       |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Kısa model adı           | `claude-opus-4-6`           |
| `{modelFull}`     | Tam model tanımlayıcısı  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Sağlayıcı adı            | `anthropic`                 |
| `{thinkingLevel}` | Geçerli düşünme düzeyi   | `high`, `low`, `off`        |
| `{identity.name}` | Agent kimliği adı        | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarsızdır. `{think}`, `{thinkingLevel}` için bir takma addır.

### Onay tepkisi

- Varsayılan olarak etkin agent'ın `identity.emoji` değeri kullanılır, yoksa `"👀"` kullanılır. Devre dışı bırakmak için `""` olarak ayarlayın.
- Kanal bazlı geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik yedeği.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram, WhatsApp ve BlueBubbles gibi tepki destekleyen kanallarda yanıttan sonra onayı kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord ve Telegram'da yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord'da, ayarlanmamış olması onay tepkileri etkinken durum tepkilerini etkin tutar.
  Telegram'da yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` olarak ayarlayın.

### Gelen debounce

Aynı gönderenden gelen hızlı, yalnızca metin içeren mesajları tek bir agent turunda toplar. Medya/ekler hemen boşaltılır. Denetim komutları debounce işlemini atlar.

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

- `auto`, varsayılan otomatik TTS modunu denetler: `off`, `always`, `inbound` veya `tagged`. `/tts on|off` yerel tercihleri geçersiz kılabilir ve `/tts status` etkili durumu gösterir.
- `summaryModel`, otomatik özet için `agents.defaults.model.primary` değerini geçersiz kılar.
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılan olarak `false` olur (isteğe bağlı etkinleştirme).
- API anahtarları `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine geri döner.
- Paketlenmiş konuşma sağlayıcıları Plugin'e aittir. `plugins.allow` ayarlanmışsa, kullanmak istediğiniz her TTS sağlayıcı Plugin'ini ekleyin; örneğin Edge TTS için `microsoft`. Eski `edge` sağlayıcı kimliği, `microsoft` için takma ad olarak kabul edilir.
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

- Birden fazla Konuşma sağlayıcısı yapılandırıldığında `talk.provider`, `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Konuşma anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir ve otomatik olarak `talk.providers.<provider>` altına taşınır.
- Ses kimlikleri `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerine geri döner.
- `providers.*.apiKey` düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` yedeği yalnızca Konuşma API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Konuşma yönergelerinin kolay adlar kullanmasını sağlar.
- `providers.mlx.modelId`, macOS local MLX yardımcısı tarafından kullanılan Hugging Face deposunu seçer. Atlanırsa macOS `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatması, mevcut olduğunda paketlenmiş `openclaw-mlx-tts` yardımcısı üzerinden veya `PATH` üzerindeki bir yürütülebilir dosya üzerinden çalışır; `OPENCLAW_MLX_TTS_BIN`, geliştirme için yardımcı yolunu geçersiz kılar.
- `speechLocale`, iOS/macOS Konuşma konuşma tanıma tarafından kullanılan BCP 47 yerel ayar kimliğini ayarlar. Cihaz varsayılanını kullanmak için ayarlamadan bırakın.
- `silenceTimeoutMs`, kullanıcı sessizliğinden sonra Konuşma modunun transkripti göndermeden önce ne kadar bekleyeceğini denetler. Ayarlanmamış olması platform varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'te 900 ms`).

---

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference) — diğer tüm yapılandırma anahtarları
- [Yapılandırma](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
