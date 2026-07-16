---
read_when:
    - Aracı varsayılanlarını ayarlama (modeller, düşünme, çalışma alanı, heartbeat, medya, skills)
    - Çoklu ajan yönlendirmesini ve bağlamalarını yapılandırma
    - Oturum, mesaj teslimi ve konuşma modu davranışını ayarlama
summary: Ajan varsayılanları, çoklu ajan yönlendirmesi, oturum, mesajlar ve konuşma yapılandırması
title: Yapılandırma — ajanlar
x-i18n:
    generated_at: "2026-07-16T16:57:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*` ve `talk.*` altındaki ajan kapsamlı yapılandırma anahtarları.
Kanallar, araçlar, Gateway çalışma zamanı ve diğer üst düzey anahtarlar için
[Yapılandırma referansına](/tr/gateway/configuration-reference) bakın.

## Ajan varsayılanları

### `agents.defaults.workspace`

Varsayılan: ayarlanmışsa `OPENCLAW_WORKSPACE_DIR`, aksi takdirde `~/.openclaw/workspace` (`OPENCLAW_PROFILE` varsayılan olmayan bir profile ayarlanmışsa `~/.openclaw/workspace-<profile>`).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Açıkça belirtilen bir `agents.defaults.workspace` değeri,
`OPENCLAW_WORKSPACE_DIR` değerine göre önceliklidir. Bu yolu yapılandırmaya yazmak
istemediğinizde varsayılan ajanları bağlanmış bir çalışma alanına yönlendirmek için
ortam değişkenini kullanın.

### `agents.defaults.repoRoot`

Sistem isteminin Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmamışsa OpenClaw, çalışma alanından yukarı doğru ilerleyerek otomatik olarak algılar.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` değerini ayarlamayan ajanlar için isteğe bağlı varsayılan
beceri izin listesi.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github ve weather değerlerini devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
      { id: "locked-down", skills: [] }, // beceri yok
    ],
  },
}
```

- Varsayılan olarak sınırsız beceriler için `agents.defaults.skills` değerini belirtmeyin.
- Varsayılanları devralmak için `agents.list[].skills` değerini belirtmeyin.
- Hiçbir beceri olmaması için `agents.list[].skills: []` değerini ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, söz konusu ajanın nihai kümesidir;
  varsayılanlarla birleştirilmez.

### `agents.defaults.skipBootstrap`

Çalışma alanı önyükleme dosyalarının (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) otomatik oluşturulmasını devre dışı bırakır.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Gerekli önyükleme dosyaları (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`) yazılmaya devam ederken seçili isteğe bağlı çalışma alanı dosyalarının oluşturulmasını atlar. Geçerli değerler: `SOUL.md`, `USER.md`, `HEARTBEAT.md` ve `IDENTITY.md`.

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

Çalışma alanı önyükleme dosyalarının sistem istemine ne zaman ekleneceğini denetler. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam turları (tamamlanmış bir asistan yanıtından sonra), çalışma alanı önyüklemesinin yeniden eklenmesini atlayarak istem boyutunu küçültür. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler bağlamı yine yeniden oluşturur.
- `"never"`: her turda çalışma alanı önyüklemesini ve bağlam dosyası eklemeyi devre dışı bırakır. Bunu yalnızca istem yaşam döngüsünü tamamen yöneten ajanlar (özel bağlam motorları, kendi bağlamını oluşturan yerel çalışma zamanları veya önyüklemesiz özel iş akışları) için kullanın. Heartbeat ve Compaction kurtarma turları da eklemeyi atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Ajan başına geçersiz kılma: `agents.list[].contextInjection`. Belirtilmeyen değerler
`agents.defaults.contextInjection` değerini devralır.

### `agents.defaults.bootstrapMaxChars`

Kesilmeden önce çalışma alanı önyükleme dosyası başına azami karakter sayısı. Varsayılan: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Ajan başına geçersiz kılma: `agents.list[].bootstrapMaxChars`. Belirtilmeyen değerler
`agents.defaults.bootstrapMaxChars` değerini devralır.

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı önyükleme dosyalarından eklenen toplam azami karakter sayısı. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Ajan başına geçersiz kılma: `agents.list[].bootstrapTotalMaxChars`. Belirtilmeyen değerler
`agents.defaults.bootstrapTotalMaxChars` değerini devralır.

### Ajan başına önyükleme profili geçersiz kılmaları

Bir ajanın paylaşılan varsayılanlardan farklı istem ekleme davranışına
ihtiyacı olduğunda ajan başına önyükleme profili geçersiz kılmalarını kullanın.
Belirtilmeyen alanlar `agents.defaults` değerinden devralınır.

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

Önyükleme bağlamı kesildiğinde ajan tarafından görülebilen sistem istemi bildirimini denetler.
Varsayılan: `"always"`.

- `"off"`: sistem istemine hiçbir zaman kesilme bildirimi metni eklemez.
- `"once"`: her benzersiz kesilme imzası için bir kez kısa bir bildirim ekler.
- `"always"`: kesilme olduğunda her çalıştırmada kısa bir bildirim ekler (önerilir).

Ayrıntılı ham/eklenen sayımlar ve yapılandırma ayarlama alanları, bağlam/durum
raporları ve günlükler gibi tanılama yüzeylerinde kalır; rutin WebChat
kullanıcı/çalışma zamanı bağlamına yalnızca kısa kurtarma bildirimi eklenir.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw birden fazla yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar,
tümü tek bir genel ayardan geçmek yerine kasıtlı olarak alt sistemlere ayrılmıştır.

| Bütçe                                                         | Kapsam                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Normal çalışma alanı önyükleme ekleme                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Son günlük `memory/*.md` dosyaları dahil olmak üzere tek seferlik sıfırlama/başlatma model çalıştırması ön bilgisi. Yalın sohbet `/new` ve `/reset` komutları, model çağrılmadan onaylanır |
| `skills.limits.*`                                              | Sistem istemine eklenen kompakt beceri listesi                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Sınırlandırılmış çalışma zamanı alıntıları ve çalışma zamanının sahip olduğu eklenmiş bloklar                                                                                                      |
| `memory.qmd.limits.*`                                          | Dizinlenmiş bellek arama parçacığı ve ekleme boyutlandırması                                                                                                              |

Eşleşen ajan başına geçersiz kılmalar:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Sıfırlama/başlatma model çalıştırmalarında ilk tura eklenen başlangıç ön bilgisini
denetler. Yalın sohbet `/new` ve `/reset` komutları, model çağrılmadan
sıfırlamayı onayladığından bu ön bilgiyi yüklemez.

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: kesilme meta verileri ve devam bildirimi
  eklenmeden önceki varsayılan `memory_get` alıntı sınırı.
- `memoryGetDefaultLines`: `lines` belirtilmediğinde varsayılan
  `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcı sonuçlar ve taşma kurtarması için kullanılan
  gelişmiş canlı araç sonucu üst sınırı. Model bağlamı otomatik sınırı için ayarlamadan bırakın:
  100K tokenın altında `16000` karakter, 100K+ tokenda `32000` karakter ve 200K+
  tokenda `64000` karakter. Uzun bağlamlı modeller için `1000000` değerine kadar
  açık değerler kabul edilir, ancak etkin sınır yine model bağlam penceresinin
  yaklaşık %30'u ile sınırlıdır. `openclaw doctor --deep` etkin sınırı yazdırır ve doctor
  yalnızca açıkça belirtilen bir geçersiz kılma eskimişse veya etkisizse uyarır.
- `postCompactionMaxChars`: Compaction sonrası yenileme eklemesi sırasında kullanılan
  AGENTS.md alıntı sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` ayarları için ajan başına geçersiz kılma. Belirtilmeyen alanlar
`agents.defaults.contextLimits` değerinden devralınır.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // bu ajan için gelişmiş üst sınır
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Sistem istemine eklenen kompakt beceri listesi için genel sınır. Bu,
`SKILL.md` dosyalarının gerektiğinde okunmasını etkilemez.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Beceri istemi bütçesi için ajan başına geçersiz kılma.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Sağlayıcı çağrılarından önce transkript/araç görüntü bloklarında görüntünün en uzun kenarı için azami piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler, ekran görüntüsü ağırlıklı çalıştırmalarda genellikle görüntü tokenı kullanımını ve istek yükü boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Dosya yollarından, URL'lerden ve medya referanslarından yüklenen görüntüler için görüntü aracı sıkıştırma/ayrıntı tercihi.
Varsayılan: `auto`.

OpenClaw, yeniden boyutlandırma kademesini seçilen görüntü modeline uyarlar. Örneğin Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL ve barındırılan Llama 4 görüntü modelleri eski/varsayılan yüksek ayrıntılı görüntü yollarından daha büyük görüntüler kullanabilirken, token ve gecikme maliyetini denetlemek için çok görüntülü turlar `auto` modunda daha agresif biçimde sıkıştırılır.

Değerler:

- `auto`: model sınırlarına ve görüntü sayısına uyarlanır.
- `efficient`: daha düşük token ve bayt kullanımı için daha küçük görüntüleri tercih eder.
- `balanced`: standart orta yol kademesini kullanır.
- `high`: ekran görüntüleri, diyagramlar ve belge görüntüleri için daha fazla ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Sistem istemi bağlamı için saat dilimi (ileti zaman damgaları için değil). Ana makinenin saat dilimine geri döner.

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
      utilityModel: "openai/gpt-5.4-mini",
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Dize biçimi yalnızca birincil modeli ayarlar.
  - Nesne biçimi, birincil modeli ve sıralı yük devretme modellerini ayarlar.
- `utilityModel`: kısa dahili görevler için isteğe bağlı `provider/model` referansı veya diğer adı. Şu anda oluşturulan Control UI oturum başlıklarını, Telegram DM konu başlıklarını, Discord otomatik ileti dizisi başlıklarını ve [ilerleme taslağı anlatımını](/tr/concepts/progress-drafts#narrated-status) destekler. Ayarlanmadığında OpenClaw, varsa birincil sağlayıcının bildirdiği küçük model varsayılanını türetir (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); aksi durumda başlık görevleri aracının birincil modeline geri döner ve anlatım kapalı kalır. Yardımcı yönlendirmeyi tamamen devre dışı bırakmak için `utilityModel: ""` ayarlayın. `agents.list[].utilityModel` varsayılanı geçersiz kılar (boş bir aracı başına değer, ilgili aracı için bunu devre dışı bırakır) ve işleme özgü model geçersiz kılması her ikisinden de önceliklidir. Yardımcı görevler ayrı model çağrıları yapar ve göreve özgü içeriği seçilen model sağlayıcısına gönderir. Pano başlığı oluşturma, komut olmayan ilk iletinin en fazla ilk 1.000 karakterini gönderir; anlatım ise gelen isteği ve kısa, hassas bilgileri çıkarılmış araç özetlerini gönderir. Maliyet ve veri işleme gereksinimlerinize uygun bir sağlayıcı seçin.
- `imageModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Etkin model görüntüleri kabul edemediğinde, `image` araç yolu tarafından görüntü modeli yapılandırması olarak kullanılır. Bunun yerine yerel görüntü yetenekli modeller, yüklenen görüntü baytlarını doğrudan alır.
  - Seçilen/varsayılan model görüntü girdisini kabul edemediğinde yedek yönlendirme olarak da kullanılır.
  - Açık `provider/model` referanslarını tercih edin. Çıplak kimlikler uyumluluk amacıyla kabul edilir; çıplak bir kimlik, `models.providers.*.models` içinde yapılandırılmış görüntü yetenekli tek bir girişle benzersiz biçimde eşleşirse OpenClaw bunu ilgili sağlayıcıyla niteler. Birden fazla yapılandırılmış eşleşme, açık bir sağlayıcı öneki gerektirir.
- `imageGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görüntü oluşturma yeteneği ve görüntü oluşturan gelecekteki tüm araç/plugin yüzeyleri tarafından kullanılır.
  - Tipik değerler: yerel Gemini görüntü oluşturma için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev`, OpenAI Images için `openai/gpt-image-2` veya şeffaf arka planlı OpenAI PNG/WebP çıktısı için `openai/gpt-image-1.5`.
  - Bir sağlayıcı/modeli doğrudan seçerseniz eşleşen sağlayıcı kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` / `openai/gpt-image-1.5` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Belirtilmezse `image_generate`, kimlik doğrulamasıyla desteklenen bir sağlayıcı varsayılanını yine de belirleyebilir. Önce mevcut varsayılan sağlayıcıyı, ardından kayıtlı diğer görüntü oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
- `musicGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik oluşturma yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Belirtilmezse `music_generate`, kimlik doğrulamasıyla desteklenen bir sağlayıcı varsayılanını yine de belirleyebilir. Önce mevcut varsayılan sağlayıcıyı, ardından kayıtlı diğer müzik oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Bir sağlayıcı/modeli doğrudan seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video oluşturma yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Belirtilmezse `video_generate`, kimlik doğrulamasıyla desteklenen bir sağlayıcı varsayılanını yine de belirleyebilir. Önce mevcut varsayılan sağlayıcıyı, ardından kayıtlı diğer video oluşturma sağlayıcılarını sağlayıcı kimliği sırasıyla dener.
  - Bir sağlayıcı/modeli doğrudan seçerseniz eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Resmî Qwen video oluşturma plugini en fazla 1 çıktı videosunu, 1 girdi görüntüsünü, 4 girdi videosunu, 10 saniye süreyi ve sağlayıcı düzeyindeki `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dizeyi (`"provider/model"`) veya bir nesneyi (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirmesi için `pdf` aracı tarafından kullanılır.
  - Belirtilmezse PDF aracı önce `imageModel` değerine, ardından çözümlenen oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı sırasında `maxBytesMb` iletilmediğinde `pdf` aracı için varsayılan PDF boyutu sınırı.
- `pdfMaxPages`: `pdf` aracındaki ayıklama yedek modunun dikkate aldığı varsayılan azami sayfa sayısı.
- `verboseDefault`: aracılar için varsayılan ayrıntı düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `toolProgressDetail`: `/verbose` araç özetleri ve ilerleme taslağı araç satırları için ayrıntı modu. Değerler: `"explain"` (varsayılan, kısa ve kullanıcı dostu etiketler) veya `"raw"` (mevcut olduğunda ham komutu/ayrıntıyı sona ekler). Aracı başına `agents.list[].toolProgressDetail` bu varsayılanı geçersiz kılar.
- `reasoningDefault`: aracılar için varsayılan akıl yürütme görünürlüğü. Değerler: `"off"`, `"on"`, `"stream"`. Aracı başına `agents.list[].reasoningDefault` bu varsayılanı geçersiz kılar. Yapılandırılmış akıl yürütme varsayılanları, yalnızca ileti veya oturum başına bir akıl yürütme geçersiz kılması ayarlanmamışsa sahipler, yetkili gönderenler veya operatör-yönetici Gateway bağlamları için uygulanır.
- `elevatedDefault`: aracılar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: biçim `provider/model` (ör. Codex OAuth erişimi için `openai/gpt-5.6-sol`). Sağlayıcıyı belirtmezseniz OpenClaw önce bir diğer adı, ardından bu tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner (kullanımdan kaldırılmış uyumluluk davranışı; bu nedenle açık `provider/model` tercih edin). Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, kaldırılmış bir sağlayıcıya ait geçersiz varsayılanı göstermek yerine yapılandırılmış ilk sağlayıcı/modele geri döner.
- `models`: `/model` için yapılandırılmış model kataloğu ve izin listesi. Her giriş `alias` (kısayol) ve `params` (sağlayıcıya özgü; örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, OpenRouter `provider` yönlendirmesi, `chat_template_kwargs`, `extra_body`/`extraBody`) içerebilir.
  - Her model kimliğini elle listelemeden seçilen sağlayıcılar için keşfedilen tüm modelleri göstermek üzere `"openai/*": {}` veya `"vllm/*": {}` gibi `provider/*` girişlerini kullanın.
  - İlgili sağlayıcı için dinamik olarak keşfedilen her modelin aynı çalışma zamanını kullanması gerekiyorsa bir `provider/*` girişine `agentRuntime` ekleyin. Tam `provider/model` çalışma zamanı ilkesi yine de joker karakterden önceliklidir.
  - Güvenli düzenlemeler: giriş eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `--replace` iletmediğiniz sürece `config set`, mevcut izin listesi girişlerini kaldıracak değiştirmeleri reddeder.
  - Sağlayıcı kapsamlı yapılandırma/ilk katılım akışları, seçilen sağlayıcı modellerini bu haritayla birleştirir ve önceden yapılandırılmış ilgisiz sağlayıcıları korur.
  - Doğrudan OpenAI Responses modellerinde sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` eklenmesini durdurmak için `params.responsesServerCompaction: false`, eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI sunucu tarafı Compaction](/tr/providers/openai#advanced-configuration).
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` konumunda ayarlanır (ör. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (genel temel), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır; ardından `agents.list[].params` (eşleşen aracı kimliği) anahtara göre geçersiz kılar. Ayrıntılar için [İstem Önbelleğe Alma](/tr/reference/prompt-caching) bölümüne bakın.
- `models.providers.openrouter.params.provider`: OpenRouter genelindeki varsayılan sağlayıcı yönlendirme ilkesi. OpenClaw bunu OpenRouter isteğinin `provider` nesnesine iletir; model başına `agents.defaults.models["openrouter/<model>"].params.provider` ve aracı parametreleri anahtara göre geçersiz kılar. Bkz. [OpenRouter sağlayıcı yönlendirmesi](/tr/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu proxy'ler için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş doğrudan iletim JSON'u. Oluşturulan istek anahtarlarıyla çakışırsa ek gövde öncelikli olur; yerel olmayan tamamlama yolları daha sonra yalnızca OpenAI'a özgü `store` alanını yine de kaldırır.
- `params.chat_template_kwargs`: üst düzey `api: "openai-completions"` istek gövdelerine birleştirilen vLLM/OpenAI uyumlu sohbet şablonu bağımsız değişkenleri. Düşünme kapalıyken `vllm/nemotron-3-*` için paketlenmiş vLLM plugini otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir; açık `chat_template_kwargs` değerleri oluşturulan varsayılanları geçersiz kılar ve `extra_body.chat_template_kwargs` yine son önceliğe sahiptir. Yapılandırılmış vLLM Qwen ve Nemotron düşünme modelleri, çok düzeyli efor ölçeği yerine ikili `/think` seçenekleri (`off`, `on`) sunar.
- `compat.thinkingFormat`: OpenAI uyumlu düşünme yükü biçimi. Together tarzı `reasoning.enabled` için `"together"`, Qwen tarzı üst düzey `enable_thinking` için `"qwen"` veya vLLM gibi istek düzeyinde sohbet şablonu anahtar sözcük bağımsız değişkenlerini destekleyen Qwen ailesi arka uçlarında `chat_template_kwargs.enable_thinking` için `"qwen-chat-template"` kullanın. OpenClaw, devre dışı bırakılmış düşünmeyi `false`, etkinleştirilmiş düşünmeyi `true` olarak eşler ve yapılandırılmış vLLM Qwen modelleri bu biçimler için ikili `/think` seçenekleri sunar.
- `compat.supportedReasoningEfforts`: model başına OpenAI uyumlu akıl yürütme eforu listesi. Bunu gerçekten kabul eden özel uç noktalar için `"xhigh"` ekleyin; OpenClaw daha sonra ilgili yapılandırılmış sağlayıcı/model için komut menülerinde, Gateway oturum satırlarında, oturum yaması doğrulamasında, aracı CLI doğrulamasında ve `llm-task` doğrulamasında `/think xhigh` seçeneğini sunar. Arka uç, standart bir düzey için sağlayıcıya özgü bir değer istiyorsa `compat.reasoningEffortMap` kullanın.
- `params.preserveThinking`: korunan düşünme için yalnızca Z.AI'a özgü isteğe bağlı etkinleştirme. Etkinleştirildiğinde ve düşünme açık olduğunda OpenClaw `thinking.clear_thinking: false` gönderir ve önceki `reasoning_content` öğelerini yeniden oynatır; bkz. [Z.AI düşünme ve korunan düşünme](/tr/providers/zai#advanced-configuration).
- `localService`: yerel/kendi barındırdığınız model sunucuları için isteğe bağlı sağlayıcı düzeyinde süreç yöneticisi. Seçilen model ilgili sağlayıcıya ait olduğunda OpenClaw `healthUrl` (veya `baseUrl + "/models"`) uç noktasını yoklar; uç nokta çalışmıyorsa `command` öğesini `args` ile başlatır, `readyTimeoutMs` süresine kadar bekler ve ardından model isteğini gönderir. `command` mutlak bir yol olmalıdır. `idleStopMs: 0`, OpenClaw kapanana kadar süreci çalışır durumda tutar; pozitif bir değer, OpenClaw tarafından başlatılan süreci belirtilen sayıda milisaniye boşta kaldıktan sonra durdurur. Bkz. [Yerel model hizmetleri](/tr/gateway/local-model-services).
- Çalışma zamanı politikası `agents.defaults` üzerinde değil, sağlayıcılarda veya modellerde tanımlanmalıdır. Sağlayıcı genelindeki kurallar için `models.providers.<provider>.agentRuntime`, modele özgü kurallar için ise `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` kullanın. Sağlayıcı/model öneki tek başına hiçbir zaman bir harness seçmez. Çalışma zamanı ayarlanmamışsa veya `auto` ise OpenAI, yalnızca kullanıcı tarafından oluşturulmuş bir istek geçersiz kılması bulunmayan tam bir resmî HTTPS Platform Responses veya ChatGPT Responses rotası için Codex'i örtük olarak seçebilir. Bkz. [OpenAI örtük agent çalışma zamanı](/tr/providers/openai#implicit-agent-runtime).
- Bu alanları değiştiren yapılandırma yazıcıları (örneğin `/models set`, `/models set-image` ve fallback ekleme/kaldırma komutları), kurallı nesne biçiminde kaydeder ve mümkün olduğunda mevcut fallback listelerini korur.
- `maxConcurrent`: oturumlar arasındaki maksimum paralel agent çalıştırması sayısı (her oturum yine de seri olarak işlenir). Varsayılan: `4`.

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, kayıtlı bir plugin altyapısı kimliği veya desteklenen bir CLI arka uç diğer adı. Birlikte gelen Codex plugini `codex` değerini kaydeder; birlikte gelen Anthropic plugini `claude-cli` CLI arka ucunu sağlar.
- `id: "auto"`, kayıtlı plugin altyapılarının destek sözleşmelerini bildiren veya başka şekilde karşılayan etkin rotaları üstlenmesine olanak tanır ve hiçbir altyapı eşleşmediğinde OpenClaw kullanır. `id: "codex"` gibi açık bir plugin çalışma zamanı, söz konusu altyapıyı ve uyumlu bir etkin rotayı gerektirir; bunlardan biri kullanılamıyorsa veya yürütme başarısız olursa kapalı biçimde başarısız olur.
- `id: "pi"`, v2026.5.22 ve önceki sürümlerden yayımlanmış yapılandırmaları korumak için yalnızca `openclaw` değerinin kullanımdan kaldırılmış diğer adı olarak kabul edilir. Yeni yapılandırma `openclaw` kullanmalıdır.
- Çalışma zamanı önceliği önce tam model politikası (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` veya `models.providers.<provider>.models[]`), ardından `agents.list[]` / `agents.defaults.models["provider/*"]`, son olarak `models.providers.<provider>.agentRuntime` konumundaki sağlayıcı geneli politikası şeklindedir.
- Tüm ajanı kapsayan çalışma zamanı anahtarları eskidir. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, oturum çalışma zamanı sabitlemeleri ve `OPENCLAW_AGENT_RUNTIME` çalışma zamanı seçiminde yok sayılır. Eski değerleri kaldırmak için `openclaw doctor --fix` komutunu çalıştırın.
- Yazılmış bir istek geçersiz kılması bulunmayan uygun, tam ve resmî HTTPS OpenAI Responses/ChatGPT rotaları Codex altyapısını örtük olarak kullanabilir. Sağlayıcı/model `agentRuntime.id: "codex"`, Codex'i kapalı biçimde başarısız olan bir gereksinim hâline getirir ancak uyumsuz bir rotayı uyumlu hâle getirmez.
- Claude CLI dağıtımları için `model: "anthropic/claude-opus-4-8"` ile model kapsamlı `agentRuntime.id: "claude-cli"` kullanımını tercih edin. Eski `claude-cli/<model>` başvuruları uyumluluk amacıyla çalışmaya devam eder ancak yeni yapılandırma, sağlayıcı/model seçimini standart biçimde tutmalı ve yürütme arka ucunu sağlayıcı/model çalışma zamanı politikasına yerleştirmelidir.
- Bu yalnızca metin ajan turu yürütmesini denetler. Medya üretimi, görsel algılama, PDF, müzik, video ve TTS kendi sağlayıcı/model ayarlarını kullanmaya devam eder.

**Yerleşik diğer ad kısaltmaları** (yalnızca model `agents.defaults.models` içinde olduğunda geçerlidir):

| Diğer ad               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Yapılandırdığınız diğer adlar her zaman varsayılanlardan önceliklidir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarlanmadıkça veya `agents.defaults.models["zai/<model>"].params.thinking` sizin tarafınızdan tanımlanmadıkça düşünme modunu otomatik olarak etkinleştirir.
Z.AI modelleri, araç çağrısı akışı için varsayılan olarak `tool_stream` değerini etkinleştirir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
Anthropic Claude Opus 4.8'de düşünme, OpenClaw içinde varsayılan olarak kapalıdır; uyarlanabilir düşünme açıkça etkinleştirildiğinde Anthropic'in sağlayıcı tarafından yönetilen varsayılan çaba düzeyi `high` olur. Açık bir düşünme düzeyi ayarlanmadığında Claude 4.6 modelleri varsayılan olarak `adaptive` kullanır.

### `agents.defaults.cliBackends`

Yalnızca metin içeren geri dönüş çalıştırmaları için isteğe bağlı CLI arka uçları (araç çağrısı yoktur). API sağlayıcıları başarısız olduğunda yedek olarak kullanışlıdır.

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
          // Veya CLI bir istem dosyası bayrağını kabul ettiğinde systemPromptFileArg kullanın.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI arka uçları öncelikle metin içindir; araçlar her zaman devre dışıdır.
- Oturumlar, `sessionArg` ayarlandığında desteklenir.
- Görüntü aktarımı, `imageArg` dosya yollarını kabul ettiğinde desteklenir.
- `reseedFromRawTranscriptWhenUncompacted: true`, ilk Compaction özeti oluşmadan önce bir arka ucun, sınırlandırılmış ham OpenClaw transkript kuyruğundan güvenli biçimde geçersiz kılınmış oturumları
  kurtarmasına olanak tanır. Kimlik doğrulama profili veya kimlik bilgisi dönemi değişiklikleri
  yine de hiçbir zaman ham veriden yeniden başlangıç yapmaz.

### `agents.defaults.promptOverlays`

OpenClaw tarafından oluşturulan istem yüzeylerine model ailesine göre uygulanan, sağlayıcıdan bağımsız istem katmanları. GPT-5 ailesi model kimlikleri, paylaşılan davranış sözleşmesini OpenClaw/sağlayıcı rotalarının tamamında alır; `personality` yalnızca samimi etkileşim tarzı katmanını denetler. Yerel Codex uygulama sunucusu rotaları, bu OpenClaw GPT-5 katmanı yerine Codex tarafından yönetilen temel/model talimatlarını korur ve OpenClaw, yerel iş parçacıkları için Codex'in yerleşik kişiliğini devre dışı bırakır.

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

- `"friendly"` (varsayılan) ve `"on"`, samimi etkileşim tarzı katmanını etkinleştirir.
- `"off"` yalnızca samimi katmanı devre dışı bırakır; etiketli GPT-5 davranış sözleşmesi etkin kalır.
- Bu paylaşılan ayar yapılandırılmadığında eski `plugins.entries.openai.config.personality` hâlâ okunur.

### `agents.defaults.heartbeat`

Düzenli Heartbeat çalıştırmaları.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m devre dışı bırakır
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // varsayılan: true; false, Heartbeat bölümünü sistem isteminden çıkarır
        lightContext: false, // varsayılan: false; true, çalışma alanı önyükleme dosyalarından yalnızca HEARTBEAT.md dosyasını korur
        isolatedSession: false, // varsayılan: false; true, her Heartbeat'i yeni bir oturumda çalıştırır (konuşma geçmişi yoktur)
        skipWhenBusy: false, // varsayılan: false; true, bu ajanın alt ajan/iç içe hatlarını da bekler
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (varsayılan) | block
        target: "none", // varsayılan: none | seçenekler: last | whatsapp | telegram | discord | ...
        prompt: "Varsa HEARTBEAT.md dosyasını okuyun...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: süre dizesi (ms/s/m/h). Varsayılan: `30m` (API anahtarıyla kimlik doğrulama) veya `1h` (OAuth kimlik doğrulaması). Devre dışı bırakmak için `0m` olarak ayarlayın.
- `includeSystemPromptSection`: false olduğunda Heartbeat bölümünü sistem isteminden çıkarır ve `HEARTBEAT.md` değerinin önyükleme bağlamına eklenmesini atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda Heartbeat çalıştırmaları sırasında araç hatası uyarı yüklerini bastırır.
- `timeoutSeconds`: bir Heartbeat ajan turu durdurulmadan önce izin verilen saniye cinsinden azami süre. Ayarlanmışsa `agents.defaults.timeoutSeconds` değerini kullanmak, aksi takdirde 600 saniyeyle sınırlandırılmış Heartbeat sıklığını kullanmak için ayarlamadan bırakın.
- `directPolicy`: doğrudan/DM teslimat politikası. `allow` (varsayılan), doğrudan hedefe teslimata izin verir. `block`, doğrudan hedefe teslimatı engeller ve `reason=dm-blocked` üretir.
- `lightContext`: true olduğunda Heartbeat çalıştırmaları hafif önyükleme bağlamı kullanır ve çalışma alanı önyükleme dosyalarından yalnızca `HEARTBEAT.md` değerini korur.
- `isolatedSession`: true olduğunda her Heartbeat, önceki konuşma geçmişi olmadan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım düzenidir. Heartbeat başına token maliyetini ~100K'dan ~2-5K tokena düşürür.
- `skipWhenBusy`: true olduğunda Heartbeat çalıştırmaları, söz konusu ajanın ek meşgul hatlarında ertelenir: kendi oturum anahtarlı alt ajanı veya iç içe komut çalışması. Cron hatları, bu bayrak olmasa bile Heartbeat'leri her zaman erteler.
- Ajan başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir ajan `heartbeat` tanımladığında Heartbeat'leri **yalnızca bu ajanlar** çalıştırır.
- Heartbeat'ler tam ajan turlarını çalıştırır — daha kısa aralıklar daha fazla token tüketir.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // kayıtlı bir Compaction sağlayıcı plugininin kimliği (isteğe bağlı)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Dağıtım kimliklerini, destek kaydı kimliklerini ve ana makine:bağlantı noktası çiftlerini aynen koruyun.", // identifierPolicy=custom olduğunda kullanılır
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // isteğe bağlı araç döngüsü baskısı denetimi
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // AGENTS.md bölümlerinin yeniden eklenmesini etkinleştirin
        model: "openrouter/anthropic/claude-sonnet-4-6", // isteğe bağlı, yalnızca Compaction için model geçersiz kılması
        truncateAfterCompaction: true, // Compaction sonrasında daha küçük bir ardıl JSONL dosyasına döndür
        maxActiveTranscriptBytes: "20mb", // isteğe bağlı ön kontrol yerel Compaction tetikleyicisi
        notifyUser: true, // Compaction başladığında/tamamlandığında ve bellek boşaltma bozulmasında bildirimler (varsayılan: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // isteğe bağlı, yalnızca bellek boşaltma için model geçersiz kılması
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Oturum Compaction aşamasına yaklaşıyor. Kalıcı anıları şimdi saklayın.",
          prompt: "Kalıcı notları memory/YYYY-MM-DD.md dosyasına yazın; saklanacak bir şey yoksa tam sessiz token olan NO_REPLY ile yanıt verin.",
        },
      },
    },
  },
}
```

- `mode`: `default` veya `safeguard` (uzun geçmişler için parçalı özetleme). Bkz. [Compaction](/tr/concepts/compaction).
- `provider`: kayıtlı bir Compaction sağlayıcı Plugin'inin kimliği. Ayarlandığında, yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` işlevi çağrılır. Başarısızlık durumunda yerleşik yönteme geri döner. Bir sağlayıcı ayarlamak `mode: "safeguard"` kullanımını zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw'ın tek bir Compaction işlemini iptal etmeden önce izin verdiği azami saniye sayısı. Varsayılan: `180`.
- `reserveTokens`: Compaction sonrasında model çıktısı ve gelecekteki araç sonuçları için kullanılabilir tutulan token payı. Modelin bağlam penceresi biliniyorsa OpenClaw, istem bütçesini tüketmemesi için etkin rezervi sınırlar.
- `reserveTokensFloor`: gömülü çalışma zamanı tarafından uygulanan asgari rezerv. Alt sınırı devre dışı bırakmak için `0` olarak ayarlayın. Alt sınır, etkin bağlam penceresi sınırına tabi olmaya devam eder.
- `keepRecentTokens`: en son transkript son bölümünü kelimesi kelimesine korumaya yönelik agent kesim noktası bütçesi. Açıkça ayarlandığında manuel `/compact` buna uyar; aksi takdirde manuel Compaction katı bir denetim noktasıdır.
- `recentTurnsPreserve`: koruma amaçlı özetlemenin dışında kelimesi kelimesine tutulan en son kullanıcı/asistan konuşma sırası sayısı. Varsayılan: `3`.
- `maxHistoryShare`: Compaction sonrasında korunan geçmiş için izin verilen toplam bağlam bütçesinin azami oranı (`0.1`-`0.9` aralığı).
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, Compaction özetlemesi sırasında yerleşik opak tanımlayıcı koruma yönergelerini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: koruma özetleri için hatalı biçimlendirilmiş çıktıda yeniden deneme kontrolleri. Koruma modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` olarak ayarlayın.
- `midTurnPrecheck`: isteğe bağlı araç döngüsü baskı kontrolü. `enabled: true` olduğunda OpenClaw, araç sonuçları eklendikten sonra ve bir sonraki model çağrısından önce bağlam baskısını kontrol eder. Bağlam artık sığmıyorsa istemi göndermeden önce mevcut denemeyi iptal eder ve araç sonuçlarını kısaltmak ya da Compaction uygulayıp yeniden denemek için mevcut ön kontrol kurtarma yolunu yeniden kullanır. Hem `default` hem de `safeguard` Compaction modlarıyla çalışır. Varsayılan: devre dışı.
- `postIndexSync`: Compaction sonrası oturum belleğini yeniden indeksleme modu. Varsayılan: `"async"`. En yüksek güncellik için `"await"`, daha düşük Compaction gecikmesi için `"async"` veya yalnızca oturum belleği eşitlemesi başka bir yerde gerçekleştiriliyorsa `"off"` kullanın.
- `postCompactionSections`: Compaction sonrasında yeniden eklenecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Ayarlanmadığında veya `[]` olarak ayarlandığında yeniden ekleme devre dışıdır. Açıkça `["Session Startup", "Red Lines"]` olarak ayarlamak bu çifti etkinleştirir ve eski `Every Session`/`Safety` geri dönüşünü korur. Bunu yalnızca ek bağlam, Compaction özetinde zaten yakalanmış proje yönergelerini çoğaltma riskine değiyorsa etkinleştirin.
- `model`: yalnızca Compaction özetlemesi için isteğe bağlı `provider/model-id` veya `agents.defaults.models` içinden yalın takma ad. Yalın takma adlar yönlendirmeden önce çözümlenir; yapılandırılmış değişmez model kimlikleri çakışmalarda önceliğini korur. Ana oturumun bir modeli kullanmaya devam etmesi, ancak Compaction özetlerinin başka bir modelde çalışması gerektiğinde bunu kullanın; ayarlanmadığında Compaction, oturumun birincil modelini kullanır.
- `truncateAfterCompaction`: Compaction sonrasında etkin oturum transkriptini döndürür; böylece gelecekteki konuşma sıraları yalnızca özeti ve özetlenmemiş son bölümü yüklerken önceki tam transkript arşivlenmiş olarak kalır. Uzun süre çalışan oturumlarda etkin transkriptin sınırsız büyümesini önler. Varsayılan: `false`.
- `maxActiveTranscriptBytes`: transkript geçmişi eşiği aştığında bir çalıştırmadan önce normal yerel Compaction işlemini tetikleyen isteğe bağlı bayt eşiği (`number` veya `"20mb"` gibi dizeler). Başarılı Compaction işleminin daha küçük bir ardıl transkripte dönebilmesi için `truncateAfterCompaction` gerekir. Ayarlanmadığında veya `0` olduğunda devre dışıdır.
- `notifyUser`: `true` olduğunda kullanıcıya kısa bağlam bakımı bildirimleri gönderir: Compaction başladığında ve tamamlandığında (örneğin, "Bağlam sıkıştırılıyor..." ve "Compaction tamamlandı") ve Compaction öncesi bellek boşaltma hakkı tükendiğinde, böylece yanıt bozulmuş durumda devam ettiğinde (örneğin, "Bellek bakımı geçici olarak başarısız oldu; yanıtınız sürdürülüyor."). Bu bildirimlerin sessiz kalması için varsayılan olarak devre dışıdır.
- `memoryFlush`: kalıcı anıları depolamak için otomatik Compaction öncesindeki sessiz agent konuşma sırası. Bu bakım konuşma sırasının yerel bir modelde kalması gerektiğinde `model` değerini `ollama/qwen3:8b` gibi tam bir sağlayıcı/model olarak ayarlayın; geçersiz kılma, etkin oturumun geri dönüş zincirini devralmaz. `forceFlushTranscriptBytes`, token sayaçları güncel olmasa bile transkript boyutu eşiğe ulaştığında boşaltmayı zorunlu kılar. Çalışma alanı salt okunur olduğunda atlanır.

### `agents.defaults.runRetries`

Hata kurtarma sırasında sonsuz yürütme döngülerini önlemek amacıyla gömülü agent çalışma zamanının dış çalıştırma döngüsü için yeniden deneme yineleme sınırları. Bu ayar yalnızca gömülü agent çalışma zamanı için geçerlidir; ACP veya CLI çalışma zamanları için geçerli değildir.

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
        runRetries: { max: 50 }, // agent başına isteğe bağlı geçersiz kılmalar
      },
    ],
  },
}
```

- `base`: dış çalıştırma döngüsü için temel yeniden deneme yinelemesi sayısı. Varsayılan: `24`.
- `perProfile`: her geri dönüş profili adayı için verilen ek çalıştırma yeniden deneme yinelemesi sayısı. Varsayılan: `8`.
- `min`: çalıştırma yeniden deneme yinelemeleri için asgari mutlak sınır. Varsayılan: `32`.
- `max`: kontrolden çıkan yürütmeyi önlemek için çalıştırma yeniden deneme yinelemelerine ilişkin azami mutlak sınır. Varsayılan: `160`.

### `agents.defaults.contextPruning`

LLM'ye göndermeden önce bellek içi bağlamdaki **eski araç sonuçlarını** budar. Diskteki oturum geçmişini **değiştirmez**. Varsayılan olarak devre dışıdır; etkinleştirmek için `mode: "cache-ttl"` olarak ayarlayın.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // kapalı (varsayılan) | cache-ttl
        ttl: "1h", // süre (ms/s/m/h), varsayılan birim: dakika; varsayılan: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Eski araç sonucu içeriği temizlendi]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl modunun davranışı">

- `mode: "cache-ttl"`, budama geçişlerini etkinleştirir.
- `ttl`, budamanın ne sıklıkta yeniden çalışabileceğini (son önbellek dokunuşundan sonra) denetler. Varsayılan: `5m`.
- Budama, önce aşırı büyük araç sonuçlarını yumuşak biçimde kısaltır, ardından gerekirse eski araç sonuçlarını tamamen temizler.
- `softTrimRatio` ve `hardClearRatio`, `0.0` ile `1.0` arasındaki değerleri kabul eder; yapılandırma doğrulaması bu aralığın dışındaki değerleri reddeder.

**Yumuşak kısaltma**, başlangıcı + sonu korur ve ortaya `...` ekler.

**Tam temizleme**, araç sonucunun tamamını yer tutucuyla değiştirir.

Notlar:

- Görüntü blokları hiçbir zaman kısaltılmaz/temizlenmez.
- Oranlar tam token sayılarına değil, karakterlere (yaklaşık olarak) dayanır.
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
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (varsayılan) | natural | custom (minMs/maxMs kullanır)
    },
  },
}
```

- Telegram dışındaki kanallarda blok yanıtlarını etkinleştirmek için açıkça `*.streaming.block.enabled: true` gerekir. QQ Bot istisnadır: `streaming.block` anahtarları yoktur ve `channels.qqbot.streaming.mode`, `"off"` olmadığı sürece blok yanıtlarını akış halinde gönderir.
- Kanal geçersiz kılmaları: `channels.<channel>.streaming.block.coalesce` (ve hesap başına değişkenleri). Discord, Google Chat, Mattermost, MS Teams, Signal ve Slack varsayılan olarak `minChars: 1500` / `idleMs: 1000` kullanır.
- `blockStreamingChunk.breakPreference`: tercih edilen parça sınırı (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: blok yanıtları arasındaki rastgele bekleme. Varsayılan: `off`. `natural` = 800-2500ms. `custom`, `minMs`/`maxMs` kullanır (ayarlanmamış sınırlar için doğal aralığa geri döner). Agent başına geçersiz kılma: `agents.list[].humanDelay`.

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

- Varsayılanlar: doğrudan sohbetler/bahsetmeler için `instant`, bahsedilmemiş grup sohbetleri için `message`.
- `typingIntervalSeconds` varsayılanı: `6`.
- Oturum başına geçersiz kılmalar: `session.typingMode`, `session.typingIntervalSeconds`.

Bkz. [Yazıyor Göstergeleri](/tr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü agent için isteğe bağlı korumalı alan kullanımı. Tam kılavuz için [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) bölümüne bakın.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (varsayılan) | non-main | all
        backend: "docker", // docker (varsayılan) | ssh | openshell
        scope: "agent", // session | agent (varsayılan) | shared
        workspaceAccess: "none", // none (varsayılan) | ro | rw
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
          gpus: "all",
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
          // SecretRef'ler / satır içi içerikler de desteklenir:
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

Yukarıda gösterilen varsayılanlar (`off`/`docker`/`agent`/`none`/`bookworm-slim` görüntüsü/`none` ağı/vb.) yalnızca örnek değerler değil, gerçek OpenClaw varsayılanlarıdır.

<Accordion title="Sandbox ayrıntıları">

**Arka uç:**

- `docker`: yerel Docker çalışma zamanı (varsayılan)
- `ssh`: genel SSH destekli uzak çalışma zamanı
- `openshell`: OpenShell çalışma zamanı

`backend: "openshell"` seçildiğinde çalışma zamanına özgü ayarlar
`plugins.entries.openshell.config` konumuna taşınır.

**SSH arka uç yapılandırması:**

- `target`: `user@host[:port]` biçimindeki SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam başına çalışma alanları için kullanılan mutlak uzak kök (varsayılan: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH'ye aktarılan mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw'ın çalışma zamanında geçici dosyalara dönüştürdüğü satır içi içerikler veya SecretRef'ler
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ana makine anahtarı ilkesi ayarları (her ikisinin varsayılanı `true`)

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` değerine göre önceliklidir
- `certificateData`, `certificateFile` değerine göre önceliklidir
- `knownHostsData`, `knownHostsFile` değerine göre önceliklidir
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce etkin gizli bilgiler çalışma zamanı anlık görüntüsünden çözümlenir

**SSH arka uç davranışı:**

- oluşturma veya yeniden oluşturma işleminden sonra uzak çalışma alanını bir kez başlangıç verileriyle doldurur
- ardından uzak SSH çalışma alanını kanonik olarak tutar
- `exec`, dosya araçları ve medya yollarını SSH üzerinden yönlendirir
- uzaktaki değişiklikleri otomatik olarak ana makineye geri eşitlemez
- sandbox tarayıcı konteynerlerini desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox çalışma alanı (varsayılan)
- `ro`: `/workspace` konumundaki sandbox çalışma alanı; ajan çalışma alanı `/agent` konumuna salt okunur olarak bağlanır
- `rw`: ajan çalışma alanı `/workspace` konumuna okuma/yazma erişimiyle bağlanır

**Kapsam:**

- `session`: oturum başına konteyner + çalışma alanı
- `agent`: ajan başına bir konteyner + çalışma alanı (varsayılan)
- `shared`: paylaşılan konteyner ve çalışma alanı (oturumlar arası yalıtım yoktur)

**OpenShell plugin yapılandırması:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (varsayılan) | remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // isteğe bağlı
          gatewayEndpoint: "https://lab.example", // isteğe bağlı
          policy: "strict", // isteğe bağlı OpenShell ilkesi kimliği
          providers: ["openai"], // isteğe bağlı
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell modu:**

- `mirror`: çalıştırmadan önce uzağı yerelden başlangıç verileriyle doldurur, çalıştırmadan sonra geri eşitler; yerel çalışma alanı kanonik kalır
- `remote`: sandbox oluşturulduğunda uzağı bir kez başlangıç verileriyle doldurur, ardından uzak çalışma alanını kanonik olarak tutar

`remote` modunda, OpenClaw dışında ana makinede yapılan yerel düzenlemeler başlangıç verileriyle doldurma adımından sonra sandbox'a otomatik olarak eşitlenmez.
Aktarım, OpenShell sandbox'ına SSH üzerinden yapılır ancak sandbox yaşam döngüsünün ve isteğe bağlı yansıtma eşitlemesinin sahibi plugin'dir.

**`setupCommand`**, konteyner oluşturulduktan sonra (`sh -lc` aracılığıyla) bir kez çalışır. Ağ çıkışı, yazılabilir kök ve root kullanıcısı gerektirir.

**Konteynerler varsayılan olarak `network: "none"` kullanır** — ajanın dışarıya erişmesi gerekiyorsa `"bridge"` (veya özel bir köprü ağı) olarak ayarlayın.
`"host"` engellenir. Açıkça
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (acil durum seçeneği) ayarlanmadığı sürece `"container:<id>"` varsayılan olarak engellenir.
Etkin bir OpenClaw sandbox'ındaki Codex uygulama sunucusu turları, yerel kod modu ağ erişimleri için aynı çıkış ayarını kullanır.

**Gelen ekler**, etkin çalışma alanındaki `media/inbound/*` konumuna hazırlanır.

**`docker.binds`**, ek ana makine dizinlerini bağlar; genel ve ajan başına bağlamalar birleştirilir.

**Sandbox içindeki tarayıcı** (`sandbox.browser.enabled`, varsayılan `false`): Bir konteyner içinde Chromium + CDP. noVNC URL'si sistem istemine eklenir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulamasını kullanır ve OpenClaw, parolayı paylaşılan URL'de göstermek yerine kısa ömürlü bir belirteç URL'si oluşturur.

- `allowHostControl: false` (varsayılan), sandbox içindeki oturumların ana makine tarayıcısını hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` değerini kullanır (ayrılmış köprü ağı). Yalnızca genel köprü bağlantısını açıkça istediğinizde `bridge` olarak ayarlayın. `"host"` burada da engellenir.
- `cdpSourceRange`, isteğe bağlı olarak konteyner sınırındaki CDP girişini bir CIDR aralığıyla (örneğin `172.21.0.1/32`) kısıtlar.
- `sandbox.browser.binds`, ek ana makine dizinlerini yalnızca sandbox tarayıcı konteynerine bağlar. Ayarlandığında (`[]` dâhil), tarayıcı konteyneri için `docker.binds` değerinin yerini alır.
- Sandbox tarayıcı konteynerinin Chromium'u her zaman `--no-sandbox --disable-setuid-sandbox` ile başlatılır (konteynerler, Chrome'un kendi sandbox'ının gerektirdiği çekirdek temel öğelerine sahip değildir); bunun için bir yapılandırma anahtarı yoktur.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlanır ve konteyner ana makineleri için ayarlanmıştır:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` ve `--disable-software-rasterizer`
    varsayılan olarak etkindir ve WebGL/3D kullanımı gerektiriyorsa
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ile devre dışı bırakılabilir.
  - `--disable-extensions` (varsayılan olarak etkin); iş akışınız bunlara bağlıysa `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    uzantıları yeniden etkinleştirir.
  - varsayılan olarak `--renderer-process-limit=2`; `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirin,
    Chromium'un varsayılan işlem sınırını kullanmak için `0` ayarlayın.
  - yalnızca `headless` etkinleştirildiğinde `--headless=new`.
  - Varsayılanlar konteyner görüntüsünün temel değerleridir; konteyner varsayılanlarını değiştirmek için özel
    bir giriş noktasına sahip özel tarayıcı görüntüsü kullanın.

</Accordion>

Tarayıcı sandbox'ı ve `sandbox.docker.binds` yalnızca Docker'da kullanılabilir.

Görüntüleri derleme (kaynak kullanıma alma kopyasından):

```bash
scripts/sandbox-setup.sh           # ana sandbox görüntüsü
scripts/sandbox-browser-setup.sh   # isteğe bağlı tarayıcı görüntüsü
```

Kaynak kullanıma alma kopyası olmadan yapılan npm kurulumları için satır içi `docker build` komutları hakkında [Sandbox § Görüntüler ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

### `agents.list` (ajan başına geçersiz kılmalar)

Bir ajana kendi TTS sağlayıcısını, sesini, modelini, stilini veya otomatik TTS
modunu vermek için `agents.list[].tts` kullanın. Ajan bloğu, genel
`messages.tts` üzerine derin birleştirme uygular; böylece paylaşılan kimlik bilgileri tek bir yerde
kalırken her ajan yalnızca ihtiyaç duyduğu ses veya sağlayıcı alanlarını geçersiz
kılabilir. Etkin ajanın geçersiz kılması otomatik sesli yanıtlara, `/tts audio`, `/tts status` ve
`tts` ajan aracına uygulanır. Sağlayıcı örnekleri ve öncelik sırası için
[Metinden konuşmaya](/tr/tools/tts#per-agent-voice-overrides) bölümüne bakın.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Ana Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // veya { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // agent başına düşünme düzeyi geçersiz kılma ayarı
        reasoningDefault: "on", // agent başına akıl yürütme görünürlüğü geçersiz kılma ayarı
        fastModeDefault: false, // agent başına hızlı mod geçersiz kılma ayarı
        params: { cacheRetention: "none" }, // eşleşen defaults.models parametrelerini anahtara göre geçersiz kılar
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // ayarlandığında agents.defaults.skills değerinin yerini alır
        identity: {
          name: "Samantha",
          theme: "yardımsever tembel hayvan",
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
            mode: "persistent", // persistent | oneshot
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

- `id`: kararlı agent kimliği (zorunlu).
- `default`: birden fazlası ayarlandığında ilki geçerli olur (uyarı günlüğe kaydedilir). Hiçbiri ayarlanmamışsa listedeki ilk girdi varsayılandır.
- `model`: dize biçimi, model geri dönüşü olmayan katı bir agent başına birincil model ayarlar; `{ primary }` nesne biçimi de `fallbacks` eklenmediği sürece katıdır. Bu agent için geri dönüşü etkinleştirmek üzere `{ primary, fallbacks: [...] }`, katı davranışı açıkça belirtmek üzere `{ primary, fallbacks: [] }` kullanın. Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlanmadığı sürece varsayılan geri dönüşleri devralmaya devam eder.
- `utilityModel`: oluşturulan oturum ve ileti dizisi başlıkları gibi kısa dahili görevler için isteğe bağlı agent başına geçersiz kılma ayarı. Sırasıyla `agents.defaults.utilityModel`, birincil sağlayıcının bildirdiği küçük model varsayılanı ve ardından bu agent'ın birincil modeli kullanılır. Boş bir dize, bu agent için yardımcı yönlendirmeyi devre dışı bırakır.
- `params`: `agents.defaults.models` içindeki seçili model girdisinin üzerine birleştirilen agent başına akış parametreleri. Model kataloğunun tamamını çoğaltmadan `cacheRetention`, `temperature` veya `maxTokens` gibi agent'a özgü geçersiz kılmalar için bunu kullanın.
- `tts`: isteğe bağlı agent başına metinden konuşmaya geçersiz kılma ayarları. Blok, `messages.tts` üzerine derinlemesine birleştirilir; bu nedenle paylaşılan sağlayıcı kimlik bilgilerini ve geri dönüş politikasını `messages.tts` içinde tutun ve burada yalnızca sağlayıcı, ses, model, stil veya otomatik mod gibi kişiye özgü değerleri ayarlayın.
- `skills`: isteğe bağlı agent başına Skills izin listesi. Belirtilmezse agent, ayarlanmış olduğunda `agents.defaults.skills` değerini devralır; açık bir liste, varsayılanlarla birleştirilmek yerine onların yerini alır ve `[]` hiçbir Skills olmadığı anlamına gelir.
- `thinkingDefault`: isteğe bağlı agent başına varsayılan düşünme düzeyi (`off | minimal | low | medium | high | xhigh | adaptive | max`). İleti veya oturum başına geçersiz kılma ayarı bulunmadığında bu agent için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Hangi değerlerin geçerli olduğunu seçili sağlayıcı/model profili belirler; Google Gemini için `adaptive`, sağlayıcı tarafından yönetilen dinamik düşünmeyi korur (Gemini 3/3.1'de `thinkingLevel` belirtilmez, Gemini 2.5'te `thinkingBudget: -1`).
- `reasoningDefault`: isteğe bağlı agent başına varsayılan akıl yürütme görünürlüğü (`on | off | stream`). İleti veya oturum başına akıl yürütme geçersiz kılma ayarı bulunmadığında bu agent için `agents.defaults.reasoningDefault` değerini geçersiz kılar.
- `fastModeDefault`: hızlı mod için isteğe bağlı agent başına varsayılan (`"auto" | true | false`). İleti veya oturum başına hızlı mod geçersiz kılma ayarı bulunmadığında uygulanır.
- `models`: tam `provider/model` kimlikleriyle anahtarlanan isteğe bağlı agent başına model kataloğu/çalışma zamanı geçersiz kılmaları. Agent başına çalışma zamanı istisnaları için `models["provider/model"].agentRuntime` kullanın.
- `runtime`: isteğe bağlı agent başına çalışma zamanı tanımlayıcısı. Agent'ın varsayılan olarak ACP yürütme ortamı oturumlarını kullanması gerektiğinde `runtime.acp` varsayılanlarıyla (`agent`, `backend`, `mode`, `cwd`) birlikte `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göreli yol, `http(s)` URL'si veya `data:` URI'si.
- Çalışma alanına göreli yerel `identity.avatar` görüntü dosyaları 2 MB ile sınırlıdır. `http(s)` URL'leri ve `data:` URI'leri yerel dosya boyutu sınırına göre denetlenmez.
- `identity` varsayılanları türetir: `emoji` değerinden `ackReaction`, `name`/`emoji` değerlerinden `mentionPatterns`.
- `subagents.allowAgents`: açık `sessions_spawn.agentId` hedefleri için yapılandırılmış agent kimliklerinin izin listesi (`["*"]` = yapılandırılmış herhangi bir hedef; varsayılan: yalnızca aynı agent). Kendi kendini hedefleyen `agentId` çağrılarına izin verilmesi gerekiyorsa istekte bulunanın kimliğini ekleyin. Agent yapılandırması silinmiş eski girdiler `sessions_spawn` tarafından reddedilir ve `agents_list` içinde gösterilmez; bunları temizlemek için `openclaw doctor --fix` çalıştırın veya bu hedefin varsayılanları devralırken oluşturulabilir kalması gerekiyorsa asgari bir `agents.list[]` girdisi ekleyin.
- Sandbox devralma koruması: istekte bulunan oturum sandbox içindeyse `sessions_spawn`, sandbox dışında çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda, `agentId` belirtmeyen `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar; varsayılan: false).
- `subagents.maxConcurrent`: alt agent yürütmesi genelinde eşzamanlı alt agent çalıştırmalarının azami sayısı. Varsayılan: `8`.
- `subagents.maxChildrenPerAgent`: tek bir agent oturumunun oluşturabileceği etkin alt öğelerin azami sayısı. Varsayılan: `5`.
- `subagents.maxSpawnDepth`: alt agent oluşturma için azami iç içe geçme derinliği (`1`-`5`). Varsayılan: `1` (iç içe geçme yok).
- `subagents.archiveAfterMinutes`: tamamlanmış alt agent durumunun arşivlenmesinden önceki süre. Varsayılan: `60`.

---

## Çoklu agent yönlendirmesi

Tek bir Gateway içinde birden fazla yalıtılmış agent çalıştırın. Bkz. [Çoklu Agent](/tr/concepts/multi-agent).

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
- `match.accountId` (isteğe bağlı; `*` = herhangi bir hesap; belirtilmezse = varsayılan hesap)
- `match.peer` (isteğe bağlı; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özgü)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Belirlenimci eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam, eş/kuruluş/ekip yok)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan agent

Her katmanda, eşleşen ilk `bindings` girdisi geçerli olur.

OpenClaw, `type: "acp"` girdilerini tam konuşma kimliğine (`match.channel` + hesap + `match.peer.id`) göre çözümler ve yukarıdaki yönlendirme bağlama katmanı sırasını kullanmaz.

### Agent başına erişim profilleri

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

Öncelik ayrıntıları için [Çoklu Agent Sandbox ve Araçları](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (varsayılan) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // süre veya false
      maxDiskBytes: "500mb", // isteğe bağlı kesin bütçe
      highWaterBytes: "400mb", // isteğe bağlı temizleme hedefi
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // saat cinsinden varsayılan hareketsizlik sonrası otomatik odaktan çıkarma (`0` devre dışı bırakır)
      maxAgeHours: 0, // saat cinsinden varsayılan kesin azami yaş (`0` devre dışı bırakır)
    },
    mainKey: "main", // eski (çalışma zamanı her zaman "main" kullanır)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Oturum alanı ayrıntıları">

- **`scope`**: grup sohbeti bağlamları için temel oturum gruplandırma stratejisi.
  - `per-sender` (varsayılan): her gönderici, bir kanal bağlamında yalıtılmış bir oturum edinir.
  - `global`: bir kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam amaçlandığında kullanın).
- **`dmScope`**: doğrudan mesajların nasıl gruplandırıldığı.
  - `main`: tüm doğrudan mesajlar ana oturumu paylaşır.
  - `per-peer`: kanallar arasında gönderici kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderici başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderici başına yalıtır (çoklu hesap için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kurallı kimlikleri sağlayıcı ön ekli eşlere eşler. `/dock_discord` gibi sabitleme komutları, etkin oturumun yanıt rotasını başka bir bağlantılı kanal eşine geçirmek için aynı eşlemeyi kullanır; bkz. [Kanal sabitleme](/tr/concepts/channel-docking).
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saatle `atHour` olduğunda sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. Her ikisi de yapılandırıldığında, önce süresi dolan geçerli olur. Günlük sıfırlamanın güncelliği, oturum satırındaki `sessionStartedAt` değerini; boşta kalma sıfırlamasının güncelliği ise `lastInteractionAt` değerini kullanır. Heartbeat, Cron uyandırmaları, yürütme bildirimleri ve Gateway kayıt işlemleri gibi arka plan/sistem olayı yazmaları `updatedAt` değerini güncelleyebilir, ancak günlük/boşta oturumları güncel tutmaz.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`resetByChannel`**: sağlayıcı/kanal kimliğine göre anahtarlanan kanal başına sıfırlama geçersiz kılmaları. Oturumun kanalıyla eşleşen bir girdi bulunduğunda, bu oturum için `resetByType`/`reset` değerlerine doğrudan üstün gelir. Yalnızca bir kanalın tür düzeyindeki ilkeden farklı bir sıfırlama davranışına ihtiyaç duyması durumunda kullanın.
- **`mainKey`**: eski alan. Çalışma zamanı, ana doğrudan sohbet grubu için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: ajanlar arası alışverişlerde ajanlar arasındaki azami karşılıklı yanıt turu sayısı (tam sayı, aralık: `0`-`20`, varsayılan: `5`). `0`, karşılıklı zincirlemeyi devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` değerine göre eşleştirir. İlk ret geçerli olur.
- **`maintenance`**: oturum deposu temizleme + saklama denetimleri.
  - `mode`: `enforce` temizlemeyi uygular ve varsayılan değerdir; `warn` yalnızca uyarılar yayınlar.
  - `pruneAfter`: eski girdiler için yaş sınırı (varsayılan `30d`).
  - `maxEntries`: azami SQLite oturum girdisi sayısı (varsayılan `500`). Çalışma zamanı yazmaları, üretim ölçeğindeki sınırlar için küçük bir üst sınır tamponuyla toplu temizleme yapar; `openclaw sessions cleanup --enforce` sınırı hemen uygular.
  - Kısa ömürlü Gateway model çalıştırma yoklama oturumları sabit `24h` saklama süresini kullanır, ancak temizleme baskıya bağlıdır: yalnızca oturum girdisi bakımı/sınır baskısına ulaşıldığında eski ve katı model çalıştırma yoklama satırlarını kaldırır. Yalnızca `agent:*:explicit:model-run-<uuid>` ile eşleşen açık ve katı yoklama anahtarları uygundur; normal doğrudan, grup, ileti dizisi, Cron, kanca, Heartbeat, ACP ve alt ajan oturumları bu 24 saatlik saklama süresini devralmaz. Model çalıştırma temizliği gerçekleştirildiğinde, daha geniş kapsamlı `pruneAfter` eski girdi temizliğinden ve `maxEntries` sınırından önce çalışır.
  - Eski `rotateBytes`, geçerli şema tarafından reddedilir; `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.
  - `resetArchiveRetention`: sıfırlanmış/silinmiş döküm arşivleri için yaşa dayalı saklama. Varsayılan olarak arşivler disk bütçesi tahliyesine kadar kalır; duvar saati süresine göre silmeyi etkinleştirmek için bir süre ayarlayın veya açıkça devre dışı bırakmak için `false` kullanın.
  - `maxDiskBytes`: isteğe bağlı oturum dizini disk bütçesi. `warn` modunda uyarıları günlüğe kaydeder; `enforce` modunda önce en eski yapıtları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonra isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `80%` kadarıdır.
- **`writeLock`**: oturum dökümü yazma kilidi denetimleri. Yalnızca meşru döküm hazırlama, temizleme, Compaction veya yansıtma çalışmaları varsayılan ilkelerden daha uzun süre çekişmeye neden olduğunda ayarlayın.
  - `acquireTimeoutMs`: oturumun meşgul olduğunu bildirmeden önce kilit alınırken beklenecek milisaniye. Varsayılan: `60000`; ortam değişkeni geçersiz kılması `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: mevcut bir kilidin eski sayılıp geri alınmasından önce geçecek milisaniye. Varsayılan: `1800000`; ortam değişkeni geçersiz kılması `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: süreç içinde tutulan bir kilidin gözetmen tarafından serbest bırakılmadan önce tutulabileceği milisaniye. Varsayılan: `300000`; ortam değişkeni geçersiz kılması `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: ileti dizisine bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan hareketsizlik sonrası otomatik odaktan çıkarma (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan kesin azami yaş (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `spawnSessions`: `sessions_spawn` ve ACP ileti dizisi başlatmalarından ileti dizisine bağlı çalışma oturumları oluşturmak için varsayılan geçit. İleti dizisi bağlamaları etkinleştirildiğinde varsayılan değer `true` olur; sağlayıcılar/hesaplar geçersiz kılabilir.
  - `defaultSpawnContext`: ileti dizisine bağlı başlatmalar için varsayılan yerel alt ajan bağlamı (`"fork"` veya `"isolated"`). Varsayılan değer `"fork"` olur.

</Accordion>

---

## Mesajlar

```json5
{
  messages: {
    responsePrefix: "🦞", // veya "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (varsayılan) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (varsayılan)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 devre dışı bırakır
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

Çözümleme (en özel olan geçerli olur): hesap → kanal → genel. `""` devre dışı bırakır ve basamaklandırmayı durdurur. `"auto"`, `[{identity.name}]` değerini türetir.

**Şablon değişkenleri:**

| Değişken          | Açıklama            | Örnek                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Kısa model adı       | `claude-opus-4-6`           |
| `{modelFull}`     | Tam model tanımlayıcısı  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Sağlayıcı adı          | `anthropic`                 |
| `{thinkingLevel}` | Geçerli düşünme düzeyi | `high`, `low`, `off`        |
| `{identity.name}` | Ajan kimliği adı    | (`"auto"` ile aynı)          |

Değişkenler büyük/küçük harfe duyarlı değildir. `{think}`, `{thinkingLevel}` için bir takma addır.

### Alındı tepkisi

- Varsayılan olarak etkin ajanın `identity.emoji` değeri, aksi takdirde `"👀"` kullanılır. Devre dışı bırakmak için `""` olarak ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik geri dönüşü.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all` veya `off`/`none` (alındı tepkilerini tamamen devre dışı bırakır).
- `removeAckAfterReply`: Slack, Discord, Signal, Telegram, WhatsApp ve iMessage gibi tepki destekli kanallarda yanıttan sonra alındı tepkisini kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord, Signal, Telegram ve WhatsApp üzerinde yaşam döngüsü durum tepkilerini etkinleştirir.
  Discord üzerinde ayarlanmamış olması, alındı tepkileri etkinken durum tepkilerini etkin tutar.
  Slack, Signal, Telegram ve WhatsApp üzerinde yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` olarak ayarlayın.
  Slack, yapılandırılmış alındı tepkisini sabit tutarken ilerleme için varsayılan olarak yerel asistan ileti dizisi durumunu ve dönüşümlü yükleme mesajlarını kullanır.
- `messages.statusReactions.emojis`: yaşam döngüsü emoji anahtarlarını geçersiz kılar:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` ve `stallHard`.
  Telegram yalnızca sabit bir tepki kümesine izin verir; bu nedenle desteklenmeyen yapılandırılmış emojiler
  söz konusu sohbet için en yakın desteklenen durum çeşidine geri döner.

### Kuyruk

- `mode`: bir oturum çalıştırması etkinken gelen iletiler için kuyruk stratejisi. Varsayılan: `"steer"`.
  - `steer`: yeni istemi etkin çalıştırmaya ekler.
  - `followup`: etkin çalıştırma bittikten sonra yeni istemi çalıştırır.
  - `collect`: uyumlu iletileri toplu hâle getirir ve daha sonra birlikte çalıştırır.
  - `interrupt`: en yeni istemi başlatmadan önce etkin çalıştırmayı iptal eder.
- `debounceMs`: kuyruğa alınmış/yönlendirilmiş bir ileti gönderilmeden önceki gecikme. Varsayılan: `500`.
- `cap`: bırakma ilkesi uygulanmadan önceki azami kuyruk iletisi sayısı. Varsayılan: `20`.
- `drop`: sınır aşıldığında uygulanacak strateji. `"summarize"` (varsayılan) en eski girdileri bırakır ancak özetleri kompakt biçimde tutar; `"old"` en eski girdileri özet olmadan bırakır; `"new"` en yeni öğeyi reddeder.
- `byChannel`: sağlayıcı kimliğine göre anahtarlanan kanal başına `mode` geçersiz kılmaları.
- `debounceMsByChannel`: sağlayıcı kimliğine göre anahtarlanan kanal başına `debounceMs` geçersiz kılmaları.

### Gelen ileti bekletmesi

Aynı göndericiden hızlı bir şekilde gelen yalnızca metin içeren iletileri tek bir ajan turunda toplar. Medya/ekler hemen gönderilir. Denetim komutları bekletmeyi atlar. Varsayılan `debounceMs`: `2000`.

### Diğer ileti anahtarları

- `messages.messagePrefix`: gelen kullanıcı iletileri ajan çalışma zamanına ulaşmadan önce başlarına eklenen metin. Kanal bağlamı işaretçileri için ölçülü kullanın.
- `messages.visibleReplies`: doğrudan, grup ve kanal konuşmalarındaki görünür kaynak yanıtlarını denetler (`"message_tool"`, görünür çıktı için `message(action=send)` gerektirir; `"automatic"`, normal yanıtları eskisi gibi yayınlar).
- `messages.usageTemplate` / `messages.responseUsage`: özel `/usage` alt bilgi şablonu ve varsayılan yanıt başına kullanım modu (`off | tokens | full`, ayrıca `tokens` için eski `on` takma adı).
- `messages.groupChat.mentionPatterns` / `historyLimit`: grup iletisi bahsetme tetikleyicileri ve geçmiş penceresi boyutlandırması.
- `messages.suppressToolErrors`: `true` olduğunda, kullanıcıya gösterilen `⚠️` araç hatası uyarılarını engeller (ajan hataları bağlam içinde görmeye devam eder ve yeniden deneyebilir). Varsayılan: `false`.

### TTS (metinden konuşmaya)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (varsayılan) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` varsayılan otomatik TTS modunu denetler: `off`, `always`, `inbound` veya `tagged`. `/tts on|off` yerel tercihleri geçersiz kılabilir ve `/tts status` etkin durumu gösterir.
- `summaryModel`, otomatik özetleme için `agents.defaults.model.primary` değerini geçersiz kılar.
- `modelOverrides` varsayılan olarak etkindir (`enabled !== false`); `modelOverrides.allowProvider` isteğe bağlıdır.
- API anahtarları, `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine geri döner.
- Paketlenmiş konuşma sağlayıcılarının sahibi plugin'lerdir. `plugins.allow` ayarlanmışsa kullanmak istediğiniz her TTS sağlayıcı plugin'ini ekleyin; örneğin Edge TTS için `microsoft`. Eski `edge` sağlayıcı kimliği, `microsoft` için bir diğer ad olarak kabul edilir.
- `providers.openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası yapılandırma, ardından `OPENAI_TTS_BASE_URL`, ardından `https://api.openai.com/v1` şeklindedir.
- `providers.openai.baseUrl`, OpenAI dışı bir uç noktayı gösterdiğinde OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak değerlendirir ve model/ses doğrulamasını gevşetir.

---

## Konuşma

Konuşma modu için varsayılanlar (macOS/iOS/Android ve tarayıcı Denetim Arayüzü).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Sıcak bir üslupla konuş ve yanıtları kısa tut.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- Birden fazla Konuşma sağlayıcısı yapılandırıldığında `talk.provider`, `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Konuşma anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir. Kalıcı yapılandırmayı `talk.providers.<provider>` biçiminde yeniden yazmak için `openclaw doctor --fix` komutunu çalıştırın.
- Ses kimlikleri, `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerlerine geri döner (macOS Konuşma istemcisi davranışı).
- `providers.*.apiKey`, düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` geri dönüşü yalnızca hiçbir Konuşma API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Konuşma yönergelerinde kolay anlaşılır adların kullanılmasını sağlar.
- `providers.mlx.modelId`, macOS yerel MLX yardımcısının kullandığı Hugging Face deposunu seçer. Belirtilmezse macOS, `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatma, mevcutsa paketlenmiş `openclaw-mlx-tts` yardımcısı veya `PATH` üzerindeki bir yürütülebilir dosya üzerinden çalışır; `OPENCLAW_MLX_TTS_BIN`, geliştirme amacıyla yardımcı yolunu geçersiz kılar.
- `consultThinkingLevel`, Denetim Arayüzü Konuşma gerçek zamanlı `openclaw_agent_consult` çağrılarının arkasındaki tam OpenClaw ajan çalıştırmasının düşünme düzeyini denetler. Normal oturum/model davranışını korumak için ayarlamayın.
- `consultFastMode`, oturumun normal hızlı mod ayarını değiştirmeden Denetim Arayüzü Konuşma gerçek zamanlı danışmaları için tek seferlik bir hızlı mod geçersiz kılması ayarlar.
- `speechLocale`, iOS/macOS Konuşma ses tanımanın kullandığı BCP 47 yerel ayar kimliğini belirler. Cihaz varsayılanını kullanmak için ayarlamayın.
- `silenceTimeoutMs`, Konuşma modunun dökümü göndermeden önce kullanıcı sessizliğinden sonra ne kadar bekleyeceğini denetler. Ayarlanmaması, platformun varsayılan duraklama aralığını (`700 ms on macOS and Android, 900 ms on iOS`) korur.
- `realtime.instructions`, sağlayıcıya yönelik sistem yönergelerini OpenClaw'ın yerleşik gerçek zamanlı istemine ekler; böylece varsayılan `openclaw_agent_consult` yönlendirmesi kaybedilmeden ses stili yapılandırılabilir.
- `realtime.vadThreshold`, sağlayıcının ses etkinliği eşiğini `0` (en hassas) ile `1` (en az hassas) arasında ayarlar. Ayarlanmaması, sağlayıcının varsayılanını korur.
- `realtime.silenceDurationMs`, sağlayıcının gerçek zamanlı bir kullanıcı sırasını kesinleştirmesinden önceki pozitif tam sayı sessizlik aralığını ayarlar. Ayarlanmaması, sağlayıcının varsayılanını korur.
- `realtime.prefixPaddingMs`, algılanan konuşma başlamadan önce tutulan negatif olmayan tam sayı ses miktarını ayarlar. Ayarlanmaması, sağlayıcının varsayılanını korur.
- `realtime.reasoningEffort`, gerçek zamanlı oturumlar için sağlayıcıya özgü akıl yürütme düzeyini ayarlar. Ayarlanmaması, sağlayıcının varsayılanını korur.
- `realtime.consultRouting`: `"provider-direct"` (varsayılan), gerçek zamanlı sağlayıcı `openclaw_agent_consult` olmadan nihai bir kullanıcı dökümü ürettiğinde doğrudan sağlayıcı yanıtlarını korur. Bunun yerine `"force-agent-consult"`, kesinleştirilmiş isteği OpenClaw üzerinden yönlendirir.

---

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — diğer tüm yapılandırma anahtarları
- [Yapılandırma](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples)
