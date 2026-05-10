---
read_when:
    - Ajan varsayılanlarını ayarlama (modeller, düşünme, çalışma alanı, Heartbeat, medya, Skills)
    - Çoklu ajan yönlendirmesini ve bağlamaları yapılandırma
    - Oturum, mesaj teslimi ve konuşma modu davranışını ayarlama
summary: Ajan varsayılanları, çok ajanlı yönlendirme, oturum, mesajlar ve konuşma yapılandırması
title: Yapılandırma — ajanlar
x-i18n:
    generated_at: "2026-05-10T19:35:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 455c4f0db2ab42b699f920f90639f18d0d370ed4f98a5fa664f154318db99a11
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`, `messages.*` ve `talk.*` altındaki aracı kapsamlı yapılandırma anahtarları. Kanallar, araçlar, Gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz. [Yapılandırma referansı](/tr/gateway/configuration-reference).

## Aracı varsayılanları

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

`agents.list[].skills` ayarlamayan aracılar için isteğe bağlı varsayılan skill izin listesi.

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

- Varsayılan olarak kısıtlamasız skills için `agents.defaults.skills` öğesini atlayın.
- Varsayılanları devralmak için `agents.list[].skills` öğesini atlayın.
- Skills olmaması için `agents.list[].skills: []` olarak ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o aracı için nihai kümedir; varsayılanlarla birleştirilmez.

### `agents.defaults.skipBootstrap`

Çalışma alanı önyükleme dosyalarının (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) otomatik oluşturulmasını devre dışı bırakır.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Gerekli önyükleme dosyalarını yazmaya devam ederken seçili isteğe bağlı çalışma alanı dosyalarının oluşturulmasını atlar. Geçerli değerler: `SOUL.md`, `USER.md`, `HEARTBEAT.md` ve `IDENTITY.md`.

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

- `"continuation-skip"`: güvenli devam turları (tamamlanmış bir assistant yanıtından sonra) çalışma alanı önyüklemesinin yeniden enjeksiyonunu atlayarak istem boyutunu azaltır. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler yine de bağlamı yeniden oluşturur.
- `"never"`: her turda çalışma alanı önyüklemesini ve bağlam dosyası enjeksiyonunu devre dışı bırakır. Bunu yalnızca istem yaşam döngüsünü tamamen kendisi yöneten aracılar için kullanın (özel bağlam motorları, kendi bağlamını oluşturan yerel çalışma zamanları veya önyüklemesiz özel iş akışları). Heartbeat ve Compaction kurtarma turları da enjeksiyonu atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Kesmeden önce çalışma alanı önyükleme dosyası başına azami karakter sayısı. Varsayılan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı önyükleme dosyaları genelinde enjekte edilen azami toplam karakter sayısı. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Önyükleme bağlamı kesildiğinde aracının görebileceği sistem istemi bildirimini denetler.
Varsayılan: `"once"`.

- `"off"`: kesme bildirimi metnini sistem istemine hiçbir zaman enjekte etmez.
- `"once"`: her benzersiz kesme imzası için bir kez kısa bir bildirim enjekte eder (önerilir).
- `"always"`: kesme olduğunda her çalıştırmada kısa bir bildirim enjekte eder.

Ayrıntılı ham/enjekte edilmiş sayımlar ve yapılandırma ayarlama alanları; bağlam/durum raporları ve günlükler gibi tanılamalarda kalır. Rutin WebChat kullanıcı/çalışma zamanı bağlamı yalnızca kısa kurtarma bildirimini alır.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw, birden çok yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar bilerek tek bir genel düğmeden akmak yerine alt sisteme göre ayrılmıştır.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı önyükleme enjeksiyonu.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil olmak üzere tek seferlik reset/startup model çalıştırma başlangıcı. Yalın sohbet `/new` ve `/reset` komutları, modeli çağırmadan onaylanır.
- `skills.limits.*`:
  sistem istemine enjekte edilen kompakt skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve enjekte edilen çalışma zamanı sahipli bloklar.
- `memory.qmd.limits.*`:
  dizinlenmiş bellek arama parçacığı ve enjeksiyon boyutlandırması.

Yalnızca bir aracı farklı bir bütçeye ihtiyaç duyduğunda eşleşen aracı başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Reset/startup model çalıştırmalarında enjekte edilen ilk tur başlangıcını denetler.
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
- `postCompactionMaxChars`: Compaction sonrası yenileme enjeksiyonu sırasında kullanılan AGENTS.md alıntı sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` düğmeleri için aracı başına geçersiz kılma. Atlanan alanlar `agents.defaults.contextLimits` değerinden devralınır.

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

Sağlayıcı çağrılarından önce transcript/araç görüntü bloklarında en uzun görüntü kenarı için azami piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü yoğun çalıştırmalarda vision-token kullanımını ve istek yükü boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Sistem istemi bağlamı için saat dilimi (mesaj zaman damgaları değil). Konak saat dilimine geri döner.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Sistem istemindeki zaman biçimi. Varsayılan: `auto` (işletim sistemi tercihi).

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
  - `image` araç yolu tarafından görsel model yapılandırması olarak kullanılır.
  - Seçilen/varsayılan model görüntü girdisini kabul edemediğinde yedek yönlendirme olarak da kullanılır.
  - Açık `provider/model` başvurularını tercih edin. Yalın kimlikler uyumluluk için kabul edilir; yalın bir kimlik `models.providers.*.models` içinde yapılandırılmış görüntü destekli bir girişle benzersiz biçimde eşleşirse OpenClaw bunu o provider ile nitelendirir. Belirsiz yapılandırılmış eşleşmeler açık bir provider öneki gerektirir.
- `imageGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görüntü üretme yeteneği ve görüntü üreten gelecekteki tüm araç/plugin yüzeyleri tarafından kullanılır.
  - Tipik değerler: yerel Gemini görüntü üretimi için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev`, OpenAI Images için `openai/gpt-image-2` veya saydam arka planlı OpenAI PNG/WebP çıktısı için `openai/gpt-image-1.5`.
  - Doğrudan bir provider/model seçerseniz eşleşen provider kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir provider varsayılanını çıkarabilir. Önce geçerli varsayılan provider'ı, ardından kalan kayıtlı görüntü üretme provider'larını provider kimliği sırasıyla dener.
- `musicGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik üretme yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir provider varsayılanını çıkarabilir. Önce geçerli varsayılan provider'ı, ardından kalan kayıtlı müzik üretme provider'larını provider kimliği sırasıyla dener.
  - Doğrudan bir provider/model seçerseniz eşleşen provider kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video üretme yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir provider varsayılanını çıkarabilir. Önce geçerli varsayılan provider'ı, ardından kalan kayıtlı video üretme provider'larını provider kimliği sırasıyla dener.
  - Doğrudan bir provider/model seçerseniz eşleşen provider kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Paketle gelen Qwen video üretme provider'ı en fazla 1 çıktı videosunu, 1 girdi görüntüsünü, 4 girdi videosunu, 10 saniye süreyi ve provider düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirmesi için `pdf` aracı tarafından kullanılır.
  - Atlanırsa PDF aracı `imageModel` değerine, ardından çözümlenmiş oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı sırasında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyut sınırı.
- `pdfMaxPages`: `pdf` aracında çıkarma yedeği modu tarafından dikkate alınan varsayılan en fazla sayfa sayısı.
- `verboseDefault`: aracılar için varsayılan ayrıntılılık düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `toolProgressDetail`: `/verbose` araç özetleri ve ilerleme taslağı araç satırları için ayrıntı modu. Değerler: `"explain"` (varsayılan, kompakt insan etiketleri) veya `"raw"` (varsa ham komutu/ayrıntıyı ekler). Aracı başına `agents.list[].toolProgressDetail` bu varsayılanı geçersiz kılar.
- `reasoningDefault`: aracılar için varsayılan muhakeme görünürlüğü. Değerler: `"off"`, `"on"`, `"stream"`. Aracı başına `agents.list[].reasoningDefault` bu varsayılanı geçersiz kılar. Yapılandırılmış muhakeme varsayılanları, ileti veya oturum başına bir muhakeme geçersiz kılması ayarlanmadığında yalnızca sahipler, yetkili gönderenler veya operatör-yönetici Gateway bağlamları için uygulanır.
- `elevatedDefault`: aracılar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (ör. OpenAI API anahtarı veya Codex OAuth erişimi için `openai/gpt-5.5`). Provider'ı atlarsanız OpenClaw önce bir alias'ı, ardından tam model kimliği için benzersiz bir yapılandırılmış-provider eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan provider'a geri döner (kullanımdan kaldırılmış uyumluluk davranışı; bu yüzden açık `provider/model` tercih edin). Bu provider artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw eskimiş kaldırılmış-provider varsayılanını göstermek yerine ilk yapılandırılmış provider/model değerine geri döner.
- `models`: `/model` için yapılandırılmış model kataloğu ve izin listesi. Her giriş `alias` (kısayol) ve `params` (provider'a özgü; örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`) içerebilir.
  - Her model kimliğini elle listelemeden seçili provider'lar için keşfedilen tüm modelleri göstermek üzere `"openai-codex/*": {}` veya `"vllm/*": {}` gibi `provider/*` girişlerini kullanın.
  - Güvenli düzenlemeler: giriş eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçmediğiniz sürece mevcut izin listesi girişlerini kaldıracak değiştirmeleri reddeder.
  - Provider kapsamlı yapılandırma/ilk kurulum akışları seçilen provider modellerini bu haritaya birleştirir ve zaten yapılandırılmış alakasız provider'ları korur.
  - Doğrudan OpenAI Responses modelleri için sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` eklemeyi durdurmak için `params.responsesServerCompaction: false`, eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI sunucu tarafı compaction](/tr/providers/openai#server-side-compaction-responses-api).
- `params`: tüm modellere uygulanan global varsayılan provider parametreleri. `agents.defaults.params` içinde ayarlanır (ör. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (global temel), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır; ardından `agents.list[].params` (eşleşen aracı kimliği) anahtara göre geçersiz kılar. Ayrıntılar için [Prompt Önbelleğe Alma](/tr/reference/prompt-caching) bölümüne bakın.
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu proxy'ler için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş JSON geçişi. Üretilen istek anahtarlarıyla çakışırsa ek gövde kazanır; yerel olmayan completions rotaları yine de sonrasında yalnızca OpenAI'ye özgü `store` değerini çıkarır.
- `params.chat_template_kwargs`: üst düzey `api: "openai-completions"` istek gövdelerine birleştirilen vLLM/OpenAI uyumlu sohbet şablonu argümanları. Düşünme kapalıyken `vllm/nemotron-3-*` için paketle gelen vLLM plugin'i otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir; açık `chat_template_kwargs` üretilen varsayılanları geçersiz kılar ve `extra_body.chat_template_kwargs` yine son önceliğe sahiptir. vLLM Qwen düşünme denetimleri için bu model girişinde `params.qwenThinkingFormat` değerini `"chat-template"` veya `"top-level"` olarak ayarlayın.
- `compat.thinkingFormat`: OpenAI uyumlu düşünme yükü stili. Qwen tarzı üst düzey `enable_thinking` için `"qwen"` veya vLLM gibi istek düzeyi sohbet şablonu kwargs destekleyen Qwen ailesi arka uçlarda `chat_template_kwargs.enable_thinking` için `"qwen-chat-template"` kullanın. OpenClaw devre dışı düşünmeyi `false`, etkin düşünmeyi `true` olarak eşler.
- `compat.supportedReasoningEfforts`: model başına OpenAI uyumlu muhakeme eforu listesi. Gerçekten kabul eden özel uç noktalar için `"xhigh"` ekleyin; OpenClaw ardından bu yapılandırılmış provider/model için komut menülerinde, Gateway oturum satırlarında, oturum yama doğrulamasında, aracı CLI doğrulamasında ve `llm-task` doğrulamasında `/think xhigh` değerini sunar. Arka uç kanonik bir düzey için provider'a özgü bir değer istiyorsa `compat.reasoningEffortMap` kullanın.
- `params.preserveThinking`: korunmuş düşünme için yalnızca Z.AI'ye özgü katılım. Etkinleştirildiğinde ve düşünme açık olduğunda OpenClaw `thinking.clear_thinking: false` gönderir ve önceki `reasoning_content` değerini yeniden oynatır; bkz. [Z.AI düşünme ve korunmuş düşünme](/tr/providers/zai#thinking-and-preserved-thinking).
- `localService`: yerel/kendi barındırılan model sunucuları için isteğe bağlı provider düzeyinde süreç yöneticisi. Seçilen model bu provider'a ait olduğunda OpenClaw `healthUrl` değerini (veya `baseUrl + "/models"`) yoklar, uç nokta kapalıysa `command` komutunu `args` ile başlatır, `readyTimeoutMs` süresine kadar bekler ve ardından model isteğini gönderir. `command` mutlak yol olmalıdır. `idleStopMs: 0`, OpenClaw çıkana kadar süreci canlı tutar; pozitif bir değer, OpenClaw tarafından başlatılan süreci o kadar boş milisaniye sonra durdurur. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- Çalışma zamanı ilkesi `agents.defaults` üzerinde değil, provider'lar veya modeller üzerinde olmalıdır. Provider genelindeki kurallar için `models.providers.<provider>.agentRuntime` veya modele özgü kurallar için `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` kullanın. Resmi OpenAI provider'ındaki OpenAI aracı modelleri varsayılan olarak Codex'i seçer.
- Bu alanları değiştiren yapılandırma yazıcıları (örneğin `/models set`, `/models set-image` ve yedek ekleme/kaldırma komutları) kanonik nesne biçimini kaydeder ve mümkün olduğunda mevcut yedek listelerini korur.
- `maxConcurrent`: oturumlar genelinde en fazla paralel aracı çalıştırma sayısı (her oturum yine de sıralı yürütülür). Varsayılan: 4.

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

- `id`: `"auto"`, `"pi"`, kayıtlı bir plugin harness kimliği veya desteklenen bir CLI arka uç alias'ı. Paketle gelen Codex Plugin'i `codex` kaydeder; paketle gelen Anthropic Plugin'i `claude-cli` CLI arka ucunu sağlar.
- `id: "auto"` kayıtlı plugin harness'larının desteklenen turları sahiplenmesine izin verir ve eşleşen harness olmadığında PI kullanır. `id: "codex"` gibi açık bir plugin çalışma zamanı o harness'ı gerektirir ve kullanılamıyorsa veya başarısız olursa kapalı biçimde başarısız olur.
- Tüm aracıya ait çalışma zamanı anahtarları eskidir. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, oturum çalışma zamanı pinleri ve `OPENCLAW_AGENT_RUNTIME`, çalışma zamanı seçimi tarafından yok sayılır. Eskimiş değerleri kaldırmak için `openclaw doctor --fix` çalıştırın.
- OpenAI aracı modelleri varsayılan olarak Codex harness'ını kullanır; provider/model `agentRuntime.id: "codex"` bunu açık hale getirmek istediğinizde geçerli kalır.
- Claude CLI dağıtımları için `model: "anthropic/claude-opus-4-7"` ile model kapsamlı `agentRuntime.id: "claude-cli"` tercih edin. Eski `claude-cli/claude-opus-4-7` model başvuruları uyumluluk için hâlâ çalışır, ancak yeni yapılandırma provider/model seçimini kanonik tutmalı ve yürütme arka ucunu provider/model çalışma zamanı ilkesine koymalıdır.
- Bu yalnızca metin aracı-turu yürütmesini denetler. Medya üretimi, görsel, PDF, müzik, video ve TTS yine de kendi provider/model ayarlarını kullanır.

**Yerleşik alias kısaltmaları** (yalnızca model `agents.defaults.models` içinde olduğunda uygulanır):

| Takma Ad           | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Yapılandırdığınız takma adlar her zaman varsayılanlara üstün gelir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarlamadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece düşünme modunu otomatik olarak etkinleştirir.
Z.AI modelleri, araç çağrısı akışı için varsayılan olarak `tool_stream` değerini etkinleştirir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
Anthropic Claude 4.6 modelleri, açık bir düşünme seviyesi ayarlanmadığında varsayılan olarak `adaptive` düşünmeyi kullanır.

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
- `reseedFromRawTranscriptWhenUncompacted: true`, ilk Compaction özeti oluşmadan önce sınırlı bir ham OpenClaw transkript kuyruğundan bir arka ucun güvenli geçersizleştirilmiş oturumları kurtarmasına izin verir. Kimlik doğrulama profili veya kimlik bilgisi epoch değişiklikleri yine de hiçbir zaman ham yeniden tohumlama yapmaz.

### `agents.defaults.systemPromptOverride`

OpenClaw tarafından birleştirilen sistem prompt'unun tamamını sabit bir dizeyle değiştirir. Varsayılan düzeyde (`agents.defaults.systemPromptOverride`) veya ajan başına (`agents.list[].systemPromptOverride`) ayarlayın. Ajan başına değerler önceliklidir; boş veya yalnızca boşluk içeren bir değer yok sayılır. Kontrollü prompt deneyleri için kullanışlıdır.

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

Model ailesine göre uygulanan, sağlayıcıdan bağımsız prompt katmanları. GPT-5 ailesi model kimlikleri, sağlayıcılar genelinde paylaşılan davranış sözleşmesini alır; `personality` yalnızca arkadaşça etkileşim stili katmanını denetler.

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

- `"friendly"` (varsayılan) ve `"on"` arkadaşça etkileşim stili katmanını etkinleştirir.
- `"off"` yalnızca arkadaşça katmanı devre dışı bırakır; etiketlenmiş GPT-5 davranış sözleşmesi etkin kalır.
- Eski `plugins.entries.openai.config.personality`, bu paylaşılan ayar belirlenmemişse hâlâ okunur.

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
- `includeSystemPromptSection`: false olduğunda, Heartbeat bölümünü sistem prompt'undan çıkarır ve `HEARTBEAT.md` dosyasının bootstrap bağlamına enjekte edilmesini atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda, Heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.
- `timeoutSeconds`: bir Heartbeat ajan turunun durdurulmadan önce izin verilen en fazla süresi, saniye cinsinden. `agents.defaults.timeoutSeconds` kullanmak için ayarsız bırakın.
- `directPolicy`: doğrudan/DM teslim politikası. `allow` (varsayılan) doğrudan hedef teslimine izin verir. `block` doğrudan hedef teslimini bastırır ve `reason=dm-blocked` yayar.
- `lightContext`: true olduğunda, Heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her Heartbeat önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı izolasyon deseni. Heartbeat başına token maliyetini yaklaşık 100K'dan yaklaşık 2-5K token'a düşürür.
- `skipWhenBusy`: true olduğunda, Heartbeat çalıştırmaları ek meşgul hatlarda ertelenir: alt ajan veya iç içe komut işi. Cron hatları, bu bayrak olmadan bile Heartbeat'leri her zaman erteler.
- Ajan başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir ajan `heartbeat` tanımladığında, **yalnızca bu ajanlar** Heartbeat çalıştırır.
- Heartbeat'ler tam ajan turları çalıştırır — daha kısa aralıklar daha fazla token tüketir.

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
- `provider`: kayıtlı bir Compaction sağlayıcı Plugin kimliği. Ayarlandığında, yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` çağrılır. Başarısızlıkta yerleşiğe geri döner. Bir sağlayıcı ayarlamak `mode: "safeguard"` değerini zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw durdurmadan önce tek bir Compaction işlemi için izin verilen en fazla saniye. Varsayılan: `900`.
- `keepRecentTokens`: en son transkript kuyruğunu birebir tutmak için Pi kesme noktası bütçesi. Manuel `/compact`, açıkça ayarlandığında buna uyar; aksi halde manuel Compaction katı bir kontrol noktasıdır.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, Compaction özetlemesi sırasında yerleşik opak tanımlayıcı koruma yönergesini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: safeguard özetleri için hatalı biçimli çıktı durumunda yeniden deneme kontrolleri. Safeguard modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` olarak ayarlayın.
- `midTurnPrecheck`: isteğe bağlı Pi araç döngüsü baskısı kontrolü. `enabled: true` olduğunda, OpenClaw araç sonuçları eklendikten sonra ve bir sonraki model çağrısından önce bağlam baskısını kontrol eder. Bağlam artık sığmıyorsa, prompt'u göndermeden önce mevcut denemeyi durdurur ve araç sonuçlarını kısaltmak veya Compaction yapıp yeniden denemek için mevcut ön kontrol kurtarma yolunu yeniden kullanır. Hem `default` hem de `safeguard` Compaction modlarıyla çalışır. Varsayılan: devre dışı.
- `postCompactionSections`: Compaction sonrasında yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Varsayılan `["Session Startup", "Red Lines"]`; yeniden enjeksiyonu devre dışı bırakmak için `[]` ayarlayın. Ayarsız olduğunda veya açıkça bu varsayılan çifte ayarlandığında, eski `Every Session`/`Safety` başlıkları da eskiye dönük yedek olarak kabul edilir.
- `model`: yalnızca Compaction özetlemesi için isteğe bağlı `provider/model-id` geçersiz kılması. Ana oturumun bir modeli koruması, ancak Compaction özetlerinin başka bir modelde çalışması gerektiğinde bunu kullanın; ayarsız olduğunda Compaction, oturumun birincil modelini kullanır.
- `maxActiveTranscriptBytes`: etkin JSONL eşiği aştığında bir çalıştırma öncesinde normal yerel Compaction tetikleyen isteğe bağlı bayt eşiği (`number` veya `"20mb"` gibi dizeler). Başarılı Compaction'ın daha küçük bir ardıl transkripte dönebilmesi için `truncateAfterCompaction` gerektirir. Ayarsızken veya `0` olduğunda devre dışıdır.
- `notifyUser`: `true` olduğunda, Compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin, "Bağlam compact ediliyor..." ve "Compaction tamamlandı"). Compaction'ı sessiz tutmak için varsayılan olarak devre dışıdır.
- `memoryFlush`: otomatik Compaction öncesinde kalıcı anıları depolamak için sessiz ajan turu. Bu bakım turunun yerel bir modelde kalması gerektiğinde `model` değerini `ollama/qwen3:8b` gibi tam bir sağlayıcı/model olarak ayarlayın; geçersiz kılma, etkin oturum yedek zincirini devralmaz. Çalışma alanı salt okunur olduğunda atlanır.

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
- `ttl`, budamanın ne sıklıkla tekrar çalışabileceğini denetler (son önbellek temasından sonra).
- Budama önce aşırı büyük araç sonuçlarını yumuşak biçimde kısaltır, ardından gerekirse daha eski araç sonuçlarını sert biçimde temizler.

**Yumuşak kısaltma** başlangıcı + sonu tutar ve ortaya `...` ekler.

**Sert temizleme** tüm araç sonucunu yer tutucuyla değiştirir.

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

- Telegram dışı kanallar, blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerektirir.
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına varyantlar). Signal/Slack/Discord/Google Chat varsayılanı `minChars: 1500`.
- `humanDelay`: blok yanıtları arasında rastgele duraklama. `natural` = 800-2500 ms. Ajan başına geçersiz kılma: `agents.list[].humanDelay`.

Davranış ve parçalara ayırma ayrıntıları için [Streaming](/tr/concepts/streaming) bölümüne bakın.

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
- Oturum başına geçersiz kılmalar: `session.typingMode`, `session.typingIntervalSeconds`.

[Typing Indicators](/tr/concepts/typing-indicators) bölümüne bakın.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü ajan için isteğe bağlı sandboxing. Tam kılavuz için [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.

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
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw'ın çalışma zamanında geçici dosyalara dönüştürdüğü satır içi içerikler veya SecretRef'ler
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host-key ilkesi düğmeleri

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` değerine göre önceliklidir
- `certificateData`, `certificateFile` değerine göre önceliklidir
- `knownHostsData`, `knownHostsFile` değerine göre önceliklidir
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce etkin gizli değerler çalışma zamanı anlık görüntüsünden çözümlenir

**SSH arka uç davranışı:**

- oluşturma veya yeniden oluşturma sonrasında uzak çalışma alanını bir kez tohumlar
- ardından uzak SSH çalışma alanını kanonik tutar
- `exec`, dosya araçları ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri otomatik olarak host'a geri eşitlemez
- sandbox tarayıcı container'larını desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox çalışma alanı
- `ro`: `/workspace` konumunda sandbox çalışma alanı, `/agent` konumuna salt okunur bağlanmış ajan çalışma alanı
- `rw`: `/workspace` konumuna okuma/yazma olarak bağlanmış ajan çalışma alanı

**Kapsam:**

- `session`: oturum başına container + çalışma alanı
- `agent`: ajan başına bir container + çalışma alanı (varsayılan)
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

- `mirror`: exec öncesinde uzağı yerelden tohumlar, exec sonrasında geri eşitler; yerel çalışma alanı kanonik kalır
- `remote`: sandbox oluşturulduğunda uzağı bir kez tohumlar, ardından uzak çalışma alanını kanonik tutar

`remote` modunda, OpenClaw dışında yapılan host-yerel düzenlemeler tohumlama adımından sonra sandbox'a otomatik olarak eşitlenmez.
Taşıma, OpenShell sandbox'ına SSH üzerinden yapılır, ancak sandbox yaşam döngüsünün ve isteğe bağlı ayna eşitlemesinin sahibi Plugin'dir.

**`setupCommand`** container oluşturulduktan sonra bir kez çalışır (`sh -lc` ile). Ağ çıkışı, yazılabilir kök ve root kullanıcısı gerektirir.

**Container'lar varsayılan olarak `network: "none"` kullanır** — ajanın dışarı erişime ihtiyacı varsa `"bridge"` (veya özel bir bridge ağı) olarak ayarlayın.
`"host"` engellenir. `"container:<id>"`, açıkça
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass) ayarlamadığınız sürece varsayılan olarak engellenir.

**Gelen ekler**, etkin çalışma alanındaki `media/inbound/*` içine hazırlanır.

**`docker.binds`**, ek host dizinlerini bağlar; global ve ajan başına bind'ler birleştirilir.

**Sandbox tarayıcı** (`sandbox.browser.enabled`): bir container içinde Chromium + CDP. noVNC URL'si sistem istemine enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulamasını kullanır ve OpenClaw, paylaşılan URL'de parolayı açığa çıkarmak yerine kısa ömürlü bir token URL'si yayar.

- `allowHostControl: false` (varsayılan), sandbox oturumlarının host tarayıcıyı hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` olur (ayrılmış bridge ağı). Yalnızca global bridge bağlantısını açıkça istediğinizde `bridge` olarak ayarlayın.
- `cdpSourceRange`, isteğe bağlı olarak container kenarında CDP girişini bir CIDR aralığıyla sınırlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek host dizinlerini yalnızca sandbox tarayıcı container'ına bağlar. Ayarlandığında (`[]` dahil), tarayıcı container'ı için `docker.binds` değerinin yerine geçer.
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`, iş akışınız
    bunlara bağlıysa uzantıları yeniden etkinleştirir.
  - `--renderer-process-limit=2`,
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium'un
    varsayılan işlem sınırını kullanmak için `0` ayarlayın.
  - ayrıca `noSandbox` etkinken `--no-sandbox`.
  - Varsayılanlar container image taban çizgisidir; container varsayılanlarını değiştirmek için özel
    entrypoint içeren özel bir tarayıcı image'ı kullanın.

</Accordion>

Tarayıcı sandboxing ve `sandbox.docker.binds` yalnızca Docker'a özeldir.

Image'ları derleme (kaynak checkout'tan):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Kaynak checkout olmadan npm kurulumları için satır içi `docker build` komutları için [Sandboxing § Image'lar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

### `agents.list` (ajan başına geçersiz kılmalar)

Bir ajana kendi TTS sağlayıcısını, sesini, modelini,
stilini veya otomatik TTS modunu vermek için `agents.list[].tts` kullanın. Ajan bloğu global
`messages.tts` üzerine derin birleştirilir; böylece paylaşılan kimlik bilgileri tek yerde kalırken tekil
ajanlar yalnızca ihtiyaç duydukları ses veya sağlayıcı alanlarını geçersiz kılabilir. Etkin ajanın
geçersiz kılması otomatik sesli yanıtlara, `/tts audio`, `/tts status` ve
`tts` ajan aracına uygulanır. Sağlayıcı örnekleri ve öncelik için [Text-to-speech](/tr/tools/tts#per-agent-voice-overrides)
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

- `id`: kararlı ajan kimliği (zorunlu).
- `default`: birden fazla ayarlanırsa ilki kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa, listedeki ilk girdi varsayılan olur.
- `model`: dize biçimi, model yedeği olmadan ajan başına katı bir birincil model ayarlar; `{ primary }` nesne biçimi de `fallbacks` eklemediğiniz sürece katıdır. Bu ajanı yedek modele dahil etmek için `{ primary, fallbacks: [...] }` kullanın veya katı davranışı açık hale getirmek için `{ primary, fallbacks: [] }` kullanın. Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamadığınız sürece varsayılan yedekleri devralmaya devam eder.
- `params`: ajan başına akış parametreleri, `agents.defaults.models` içinde seçilen model girdisinin üzerine birleştirilir. Tüm model kataloğunu çoğaltmadan `cacheRetention`, `temperature` veya `maxTokens` gibi ajana özgü geçersiz kılmalar için bunu kullanın.
- `tts`: ajan başına isteğe bağlı metinden konuşmaya geçersiz kılmaları. Blok, `messages.tts` üzerine derin birleştirme uygular; bu nedenle paylaşılan sağlayıcı kimlik bilgilerini ve yedek politikasını `messages.tts` içinde tutun ve burada yalnızca sağlayıcı, ses, model, stil veya otomatik mod gibi persona’ya özgü değerleri ayarlayın.
- `skills`: ajan başına isteğe bağlı Skills izin listesi. Atlanırsa ajan, ayarlandığında `agents.defaults.skills` değerini devralır; açık bir liste, varsayılanlarla birleştirmek yerine onların yerini alır ve `[]` Skills yok anlamına gelir.
- `thinkingDefault`: ajan başına isteğe bağlı varsayılan düşünme düzeyi (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mesaj veya oturum başına geçersiz kılma ayarlanmadığında bu ajan için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Seçilen sağlayıcı/model profili hangi değerlerin geçerli olduğunu denetler; Google Gemini için `adaptive`, sağlayıcıya ait dinamik düşünmeyi korur (Gemini 3/3.1 üzerinde `thinkingLevel` atlanır, Gemini 2.5 üzerinde `thinkingBudget: -1`).
- `reasoningDefault`: ajan başına isteğe bağlı varsayılan akıl yürütme görünürlüğü (`on | off | stream`). Mesaj veya oturum başına akıl yürütme geçersiz kılma ayarlanmadığında bu ajan için `agents.defaults.reasoningDefault` değerini geçersiz kılar.
- `fastModeDefault`: hızlı mod için ajan başına isteğe bağlı varsayılan (`true | false`). Mesaj veya oturum başına hızlı mod geçersiz kılma ayarlanmadığında uygulanır.
- `models`: tam `provider/model` kimliklerine göre anahtarlanan, ajan başına isteğe bağlı model kataloğu/çalışma zamanı geçersiz kılmaları. Ajan başına çalışma zamanı istisnaları için `models["provider/model"].agentRuntime` kullanın.
- `runtime`: ajan başına isteğe bağlı çalışma zamanı tanımlayıcısı. Ajanın varsayılan olarak ACP harness oturumlarını kullanması gerektiğinde `runtime.acp` varsayılanlarıyla (`agent`, `backend`, `mode`, `cwd`) birlikte `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göreli yol, `http(s)` URL’si veya `data:` URI’si.
- `identity` varsayılanları türetir: `emoji` değerinden `ackReaction`, `name`/`emoji` değerlerinden `mentionPatterns`.
- `subagents.allowAgents`: açık `sessions_spawn.agentId` hedefleri için ajan kimliklerinin izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı ajan). Kendi kendini hedefleyen `agentId` çağrılarına izin verilmesi gerekiyorsa istekte bulunan kimliğini dahil edin.
- Sandbox devralma koruması: istekte bulunan oturum sandbox içindeyse, `sessions_spawn` sandbox dışında çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda, `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar; varsayılan: false).

---

## Çok ajanlı yönlendirme

Tek bir Gateway içinde birden fazla yalıtılmış ajan çalıştırın. Bkz. [Multi-Agent](/tr/concepts/multi-agent).

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

- `type` (isteğe bağlı): normal yönlendirme için `route` (eksik type varsayılan olarak route kabul edilir), kalıcı ACP konuşma bağlamaları için `acp`.
- `match.channel` (zorunlu)
- `match.accountId` (isteğe bağlı; `*` = herhangi bir hesap; atlanırsa = varsayılan hesap)
- `match.peer` (isteğe bağlı; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özgü)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Belirleyici eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam, peer/guild/team yok)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan ajan

Her kademede, ilk eşleşen `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw, tam konuşma kimliğine göre çözümler (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki route binding kademe sırasını kullanmaz.

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

Öncelik ayrıntıları için bkz. [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools).

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
  - `per-peer`: kanallar genelinde gönderen kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderen başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderen başına yalıtır (çok hesaplı kullanım için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kurallı kimlikleri sağlayıcı ön ekli eşlerle eşler. `/dock_discord` gibi yerleştirme komutları, etkin oturumun yanıt rotasını başka bir bağlı kanal eşine geçirmek için aynı eşlemeyi kullanır; bkz. [Kanal yerleştirme](/tr/concepts/channel-docking).
- **`reset`**: birincil sıfırlama ilkesi. `daily`, `atHour` yerel saatinde sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. İkisi de yapılandırıldığında, hangisinin süresi önce dolarsa o geçerli olur. Günlük sıfırlama tazeliği, oturum satırının `sessionStartedAt` değerini kullanır; boşta sıfırlama tazeliği `lastInteractionAt` değerini kullanır. Heartbeat, Cron uyandırmaları, exec bildirimleri ve Gateway defter tutma gibi arka plan/sistem olayı yazımları `updatedAt` değerini güncelleyebilir, ancak günlük/boşta oturumları taze tutmaz.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`mainKey`**: eski alan. Çalışma zamanı, ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: aracıdan aracıya alışverişler sırasında aracılar arasındaki azami karşılıklı yanıt turu sayısı (tam sayı, aralık: `0`–`5`). `0`, ping-pong zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleştirir. İlk reddetme kazanır.
- **`maintenance`**: oturum deposu temizliği + saklama denetimleri.
  - `mode`: `warn` yalnızca uyarılar yayar; `enforce` temizliği uygular.
  - `pruneAfter`: bayat girdiler için yaş sınırı (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki azami girdi sayısı (varsayılan `500`). Çalışma zamanı, üretim ölçekli üst sınırlar için küçük bir üst eşik tamponuyla toplu temizlik yazar; `openclaw sessions cleanup --enforce` sınırı hemen uygular.
  - `rotateBytes`: kullanımdan kaldırılmıştır ve yok sayılır; `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.
  - `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama süresi. Varsayılan olarak `pruneAfter`; devre dışı bırakmak için `false` olarak ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturumlar dizini disk bütçesi. `warn` modunda uyarıları günlüğe yazar; `enforce` modunda önce en eski yapıtları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonra isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `%80`'i.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan hareketsizlikte otomatik odak kaldırma (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan katı azami yaş (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `spawnSessions`: `sessions_spawn` ve ACP iş parçacığı başlatmalarından iş parçacığına bağlı çalışma oturumları oluşturmak için varsayılan geçit. İş parçacığı bağlamaları etkinleştirildiğinde varsayılan olarak `true`; sağlayıcılar/hesaplar geçersiz kılabilir.
  - `defaultSpawnContext`: iş parçacığına bağlı başlatmalar için varsayılan yerel alt aracı bağlamı (`"fork"` veya `"isolated"`). Varsayılan olarak `"fork"`.

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

### Yanıt ön eki

Kanal/hesap başına geçersiz kılmalar: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Çözümleme (en özel olan kazanır): hesap → kanal → genel. `""` devre dışı bırakır ve kademelendirmeyi durdurur. `"auto"`, `[{identity.name}]` değerinden türetir.

**Şablon değişkenleri:**

| Değişken          | Açıklama              | Örnek                       |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | Kısa model adı        | `claude-opus-4-6`           |
| `{modelFull}`     | Tam model tanımlayıcısı | `anthropic/claude-opus-4-6` |
| `{provider}`      | Sağlayıcı adı         | `anthropic`                 |
| `{thinkingLevel}` | Geçerli düşünme düzeyi | `high`, `low`, `off`        |
| `{identity.name}` | Aracı kimliği adı     | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarsızdır. `{think}`, `{thinkingLevel}` için bir takma addır.

### Onay tepkisi

- Varsayılan olarak etkin aracının `identity.emoji` değeri, aksi halde `"👀"`. Devre dışı bırakmak için `""` olarak ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik yedeği.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram, WhatsApp ve iMessage gibi tepki destekleyen kanallarda yanıttan sonra onayı kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord ve Telegram üzerinde yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord üzerinde, ayarlanmamış değer onay tepkileri etkin olduğunda durum tepkilerini etkin tutar.
  Telegram üzerinde, yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` olarak ayarlayın.

### Gelen ileti gecikmeli birleştirme

Aynı gönderenden hızla gelen yalnızca metin mesajlarını tek bir aracı turunda toplar. Medya/ekler hemen boşaltılır. Denetim komutları gecikmeli birleştirmeyi atlar.

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
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılanı `false` (isteğe bağlı katılım).
- API anahtarları `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine geri döner.
- Paketle gelen konuşma sağlayıcıları Plugin mülkiyetindedir. `plugins.allow` ayarlanmışsa kullanmak istediğiniz her TTS sağlayıcı Plugin'ini dahil edin; örneğin Edge TTS için `microsoft`. Eski `edge` sağlayıcı kimliği, `microsoft` için takma ad olarak kabul edilir.
- `providers.openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası yapılandırma, ardından `OPENAI_TTS_BASE_URL`, ardından `https://api.openai.com/v1`.
- `providers.openai.baseUrl` OpenAI olmayan bir uç noktaya işaret ettiğinde OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak ele alır ve model/ses doğrulamasını gevşetir.

---

## Konuşma

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

- `talk.provider`, birden çok Talk sağlayıcısı yapılandırıldığında `talk.providers` içinde bir anahtarla eşleşmelidir.
- Eski düz Talk anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir. Kalıcı yapılandırmayı `talk.providers.<provider>` içine yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- Ses kimlikleri `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerlerine geri döner.
- `providers.*.apiKey`, düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` yedeği yalnızca hiçbir Talk API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Talk yönergelerinin anlaşılır adlar kullanmasını sağlar.
- `providers.mlx.modelId`, macOS yerel MLX yardımcısı tarafından kullanılan Hugging Face deposunu seçer. Atlanırsa macOS `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatma, mevcut olduğunda paketle gelen `openclaw-mlx-tts` yardımcısı üzerinden veya `PATH` üzerindeki bir yürütülebilir dosya üzerinden çalışır; `OPENCLAW_MLX_TTS_BIN`, geliştirme için yardımcı yolunu geçersiz kılar.
- `consultThinkingLevel`, Control UI Talk gerçek zamanlı `openclaw_agent_consult` çağrılarının arkasındaki tam OpenClaw aracı çalıştırması için düşünme düzeyini denetler. Normal oturum/model davranışını korumak için ayarlanmamış bırakın.
- `consultFastMode`, oturumun normal hızlı mod ayarını değiştirmeden Control UI Talk gerçek zamanlı danışmaları için tek seferlik hızlı mod geçersiz kılması ayarlar.
- `speechLocale`, iOS/macOS Talk konuşma tanıma tarafından kullanılan BCP 47 yerel ayar kimliğini belirler. Cihaz varsayılanını kullanmak için ayarlanmamış bırakın.
- `silenceTimeoutMs`, Talk modunun kullanıcı sessizliğinden sonra dökümü göndermeden önce ne kadar bekleyeceğini denetler. Ayarlanmamış değer, platform varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`).
- `realtime.instructions`, sağlayıcıya yönelik sistem yönergelerini OpenClaw'ın yerleşik gerçek zamanlı istemine ekler; böylece varsayılan `openclaw_agent_consult` kılavuzu kaybedilmeden ses stili yapılandırılabilir.

---

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer tüm yapılandırma anahtarları
- [Yapılandırma](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
