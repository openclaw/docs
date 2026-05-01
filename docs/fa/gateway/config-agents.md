---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعامله
    - تنظیم رفتار نشست، تحویل پیام و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-05-01T11:45:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b27cfb3776d4e770cde4c91543c4ebcf4ca678cc55d689d7b3fbcef1d48c3d1
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی محدود به عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
`messages.*` و `talk.*`. برای کانال‌ها، ابزارها، زمان اجرای Gateway و دیگر
کلیدهای سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## پیش‌فرض‌های عامل

### `agents.defaults.workspace`

پیش‌فرض: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

ریشه مخزن اختیاری که در خط Runtime پرامپت سیستم نشان داده می‌شود. اگر تنظیم نشود، OpenClaw با پیمایش رو به بالا از فضای کاری آن را به‌صورت خودکار تشخیص می‌دهد.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

فهرست مجاز Skills پیش‌فرض اختیاری برای عامل‌هایی که
`agents.list[].skills` را تنظیم نمی‌کنند.

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

- برای Skills نامحدود به‌صورت پیش‌فرض، `agents.defaults.skills` را حذف کنید.
- برای به ارث بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
- برای نداشتن Skills، `agents.list[].skills: []` را تنظیم کنید.
- یک فهرست غیرخالی `agents.list[].skills` مجموعه نهایی برای آن عامل است؛ با پیش‌فرض‌ها
  ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های راه‌اندازی فضای کاری (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شده فضای کاری را رد می‌کند، در حالی که همچنان فایل‌های راه‌اندازی ضروری را می‌نویسد. مقادیر معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند که چه زمانی فایل‌های راه‌اندازی فضای کاری به پرامپت سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامه امن (پس از یک پاسخ کامل‌شده دستیار) تزریق دوباره راه‌اندازی فضای کاری را رد می‌کنند و اندازه پرامپت را کاهش می‌دهند. اجراهای Heartbeat و تلاش‌های دوباره پس از Compaction همچنان زمینه را بازسازی می‌کنند.
- `"never"`: راه‌اندازی فضای کاری و تزریق فایل‌های زمینه را در هر نوبت غیرفعال می‌کند. این گزینه را فقط برای عامل‌هایی به‌کار ببرید که چرخه عمر پرامپت خود را کاملا مالک هستند (موتورهای زمینه سفارشی، زمان‌های اجرای بومی که زمینه خود را می‌سازند، یا گردش‌کارهای تخصصی بدون راه‌اندازی). نوبت‌های Heartbeat و بازیابی پس از Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

حداکثر نویسه برای هر فایل راه‌اندازی فضای کاری پیش از کوتاه‌سازی. پیش‌فرض: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده در همه فایل‌های راه‌اندازی فضای کاری. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

متن هشدار قابل مشاهده برای عامل را هنگام کوتاه شدن زمینه راه‌اندازی کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن هشدار را به پرامپت سیستم تزریق نکن.
- `"once"`: هشدار را برای هر امضای کوتاه‌سازی یکتا یک‌بار تزریق کن (توصیه‌شده).
- `"always"`: هر بار که کوتاه‌سازی وجود دارد، هشدار را در هر اجرا تزریق کن.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشه مالکیت بودجه زمینه

OpenClaw چندین بودجه پرحجم پرامپت/زمینه دارد و آن‌ها
عمدا بر اساس زیرسیستم جدا شده‌اند، نه اینکه همگی از طریق یک
گزینه عمومی عبور کنند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق عادی راه‌اندازی فضای کاری.
- `agents.defaults.startupContext.*`:
  پیش‌درآمد یک‌باره اجرای مدل هنگام بازنشانی/راه‌اندازی، شامل فایل‌های روزانه اخیر
  `memory/*.md`. دستورهای گفت‌وگوی ساده `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشرده Skills که به پرامپت سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  گزیده‌های محدود زمان اجرا و بلوک‌های تزریق‌شده تحت مالکیت زمان اجرا.
- `memory.qmd.limits.*`:
  اندازه‌گذاری قطعه جست‌وجوی حافظه نمایه‌شده و تزریق.

فقط زمانی از بازنویسی متناظر برای هر عامل استفاده کنید که یک عامل به بودجه متفاوتی
نیاز داشته باشد:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد راه‌اندازی نوبت اول را که در اجراهای مدل هنگام بازنشانی/راه‌اندازی تزریق می‌شود کنترل می‌کند.
دستورهای گفت‌وگوی ساده `/new` و `/reset` بازنشانی را بدون فراخوانی
مدل تأیید می‌کنند، بنابراین این پیش‌درآمد را بارگذاری نمی‌کنند.

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

پیش‌فرض‌های مشترک برای سطوح محدود زمینه زمان اجرا.

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

- `memoryGetMaxChars`: سقف پیش‌فرض گزیده `memory_get` پیش از افزودن
  فراداده کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجره خط پیش‌فرض `memory_get` هنگامی که `lines`
  حذف شده باشد.
- `toolResultMaxChars`: سقف نتیجه زنده ابزار که برای نتایج پایدارشده و
  بازیابی سرریز استفاده می‌شود.
- `postCompactionMaxChars`: سقف گزیده AGENTS.md که هنگام تزریق بازآوری
  پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

بازنویسی برای هر عامل برای گزینه‌های مشترک `contextLimits`. فیلدهای حذف‌شده
از `agents.defaults.contextLimits` به ارث می‌برند.

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

سقف جهانی برای فهرست فشرده Skills که به پرامپت سیستم تزریق می‌شود. این
بر خواندن فایل‌های `SKILL.md` هنگام نیاز اثری ندارد.

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

بازنویسی برای هر عامل برای بودجه پرامپت Skills.

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

حداکثر اندازه پیکسل برای بلندترین ضلع تصویر در بلوک‌های تصویر رونویس/ابزار پیش از فراخوانی ارائه‌دهنده.
پیش‌فرض: `1200`.

مقادیر پایین‌تر معمولا مصرف توکن‌های بینایی و اندازه محموله درخواست را برای اجراهای سنگین از نظر اسکرین‌شات کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

منطقه زمانی برای زمینه پرامپت سیستم (نه مُهرهای زمانی پیام). به منطقه زمانی میزبان بازمی‌گردد.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

قالب زمان در پرامپت سیستم. پیش‌فرض: `auto` (ترجیح سیستم‌عامل).

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
        fallback: "pi", // pi | none
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

- `model`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - شکل رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - شکل شیء، مدل اصلی به‌همراه مدل‌های failover مرتب‌شده را تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط مسیر ابزار `image` به‌عنوان پیکربندی مدل بینایی آن استفاده می‌شود.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر را بپذیرد، برای مسیریابی جایگزین استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های خام برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه خام به‌طور یکتا با یک ورودی پیکربندی‌شده دارای قابلیت تصویر در `models.providers.*.models` مطابقت داشته باشد، OpenClaw آن را به همان ارائه‌دهنده نسبت می‌دهد. مطابقت‌های پیکربندی‌شده مبهم به پیشوند صریح ارائه‌دهنده نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده‌ای که تصویر تولید می‌کند استفاده می‌شود.
  - مقادیر معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینه شفاف OpenAI.
  - اگر مستقیما یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت ارائه‌دهنده متناظر را هم پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس سایر ارائه‌دهندگان ثبت‌شده تولید تصویر را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` استفاده می‌شود.
  - مقادیر معمول: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس سایر ارائه‌دهندگان ثبت‌شده تولید موسیقی را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیما یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید ویدئو و ابزار داخلی `video_generate` استفاده می‌شود.
  - مقادیر معمول: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس سایر ارائه‌دهندگان ثبت‌شده تولید ویدئو را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیما یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
  - ارائه‌دهنده تولید ویدئوی همراه Qwen حداکثر از 1 ویدئوی خروجی، 1 تصویر ورودی، 4 ویدئوی ورودی، مدت 10 ثانیه، و گزینه‌های سطح ارائه‌دهنده `size`، `aspectRatio`، `resolution`، `audio`، و `watermark` پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض برمی‌گردد.
- `pdfMaxBytesMb`: محدودیت اندازه پیش‌فرض PDF برای ابزار `pdf` وقتی `maxBytesMb` هنگام فراخوانی پاس داده نشده باشد.
- `pdfMaxPages`: حداکثر تعداد صفحه پیش‌فرض که در حالت جایگزین استخراج در ابزار `pdf` در نظر گرفته می‌شود.
- `verboseDefault`: سطح verbose پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `reasoningDefault`: نمایانی reasoning پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"stream"`. مقدار `agents.list[].reasoningDefault` مخصوص هر عامل این پیش‌فرض را بازنویسی می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای مالک‌ها، فرستنده‌های مجاز، یا زمینه‌های Gateway مدیر-اپراتور اعمال می‌شوند، آن هم وقتی هیچ بازنویسی reasoning برای پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح خروجی elevated پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلا `openai/gpt-5.5` برای دسترسی با کلید API یا `openai-codex/gpt-5.5` برای Codex OAuth). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس یک مطابقت یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه مدل دقیق، و فقط بعد از آن به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد (رفتار سازگاری منسوخ‌شده، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش پیش‌فرض کهنه مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (مختص ارائه‌دهنده، برای مثال `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - ویرایش‌های ایمن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های allowlist موجود را حذف می‌کنند رد می‌کند، مگر اینکه `--replace` را پاس دهید.
  - جریان‌های پیکربندی/onboarding با محدوده ارائه‌دهنده، مدل‌های ارائه‌دهنده انتخاب‌شده را در این نگاشت ادغام می‌کنند و ارائه‌دهندگان نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌طور خودکار فعال است. از `params.responsesServerCompaction: false` برای توقف تزریق `context_management`، یا از `params.responsesCompactThreshold` برای بازنویسی آستانه استفاده کنید. [OpenAI server-side compaction](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری ارائه‌دهنده که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلا `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (مختص مدل) بازنویسی می‌شود، سپس `agents.list[].params` (شناسه عامل مطابق) بر اساس کلید بازنویسی می‌کند. برای جزئیات، [Prompt Caching](/fa/reference/prompt-caching) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON عبوری پیشرفته که در بدنه‌های درخواست `api: "openai-completions"` برای پراکسی‌های سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده تداخل داشته باشد، بدنه اضافی برنده می‌شود؛ مسیرهای completions غیر بومی همچنان بعدا `store` مخصوص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin همراه vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را می‌فرستد؛ `chat_template_kwargs` صریح، پیش‌فرض‌های تولیدشده را بازنویسی می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی را دارد. برای کنترل‌های thinking مدل‌های vLLM Qwen، مقدار `params.qwenThinkingFormat` را روی `"chat-template"` یا `"top-level"` در ورودی همان مدل تنظیم کنید.
- `compat.supportedReasoningEfforts`: فهرست تلاش reasoning سازگار با OpenAI برای هر مدل. برای endpointهای سفارشی که واقعا آن را می‌پذیرند، `"xhigh"` را وارد کنید؛ سپس OpenClaw برای آن ارائه‌دهنده/مدل پیکربندی‌شده، `/think xhigh` را در منوهای دستور، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی CLI عامل، و اعتبارسنجی `llm-task` ارائه می‌کند. وقتی backend برای یک سطح canonical مقدار مختص ارائه‌دهنده می‌خواهد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: opt-in فقط برای Z.AI جهت حفظ thinking. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را می‌فرستد و `reasoning_content` قبلی را دوباره پخش می‌کند؛ [Z.AI thinking and preserved thinking](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `agentRuntime`: سیاست پیش‌فرض runtime سطح پایین عامل. شناسه حذف‌شده به‌طور پیش‌فرض OpenClaw Pi است. از `id: "pi"` برای اجبار harness داخلی PI، از `id: "auto"` برای اینکه harnessهای ثبت‌شده Plugin مدل‌های پشتیبانی‌شده را claim کنند، از یک شناسه harness ثبت‌شده مانند `id: "codex"`، یا از یک alias پشتیبانی‌شده backend CLI مانند `id: "claude-cli"` استفاده کنید. برای غیرفعال کردن fallback خودکار PI مقدار `fallback: "none"` را تنظیم کنید. Runtimeهای صریح Plugin مانند `codex` به‌طور پیش‌فرض fail closed هستند، مگر اینکه در همان محدوده بازنویسی `fallback: "pi"` را تنظیم کنید. ارجاع‌های مدل را به‌صورت canonical `provider/model` نگه دارید؛ Codex، Claude CLI، Gemini CLI، و سایر backendهای اجرا را به‌جای پیشوندهای legacy ارائه‌دهنده runtime از طریق پیکربندی runtime انتخاب کنید. برای اینکه ببینید این با انتخاب ارائه‌دهنده/مدل چه تفاوتی دارد، [Agent runtimes](/fa/concepts/agent-runtimes) را ببینید.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`، `/models set-image`، و دستورهای افزودن/حذف fallback) شکل شیء canonical را ذخیره می‌کنند و تا حد امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجرای موازی عامل در سراسر نشست‌ها (هر نشست همچنان به‌صورت سری اجرا می‌شود). پیش‌فرض: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` کنترل می‌کند کدام اجراکننده سطح پایین turnهای عامل را اجرا کند. بیشتر
استقرارها باید runtime پیش‌فرض OpenClaw Pi را حفظ کنند. وقتی یک
Plugin مورد اعتماد harness بومی فراهم می‌کند، مانند harness همراه app-server مربوط به Codex،
یا وقتی یک backend پشتیبانی‌شده CLI مانند Claude CLI می‌خواهید، از آن استفاده کنید. برای مدل ذهنی،
[Agent runtimes](/fa/concepts/agent-runtimes) را ببینید.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`، `"pi"`، یک شناسه harness ثبت‌شده Plugin، یا یک alias پشتیبانی‌شده backend CLI. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic، backend CLI با نام `claude-cli` را فراهم می‌کند.
- `fallback`: `"pi"` یا `"none"`. در `id: "auto"`، fallback حذف‌شده به‌طور پیش‌فرض `"pi"` است تا پیکربندی‌های قدیمی بتوانند وقتی هیچ harness مربوط به Plugin اجرای موردی را claim نمی‌کند همچنان از PI استفاده کنند. در حالت runtime صریح Plugin، مانند `id: "codex"`، fallback حذف‌شده به‌طور پیش‌فرض `"none"` است تا نبودن harness به‌جای استفاده بی‌صدای PI باعث شکست شود. بازنویسی‌های runtime، fallback را از محدوده گسترده‌تر به ارث نمی‌برند؛ وقتی عمدا آن fallback سازگاری را می‌خواهید، `fallback: "pi"` را در کنار runtime صریح تنظیم کنید. شکست‌های harness انتخاب‌شده Plugin همیشه مستقیما نمایش داده می‌شوند.
- بازنویسی‌های محیطی: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` مقدار `id` را بازنویسی می‌کند؛ `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` مقدار fallback را برای همان فرایند بازنویسی می‌کند.
- برای استقرارهای فقط Codex، مقدار `model: "openai/gpt-5.5"` و `agentRuntime.id: "codex"` را تنظیم کنید. می‌توانید برای خوانایی `agentRuntime.fallback: "none"` را هم صریح تنظیم کنید؛ این مقدار برای runtimeهای صریح Plugin پیش‌فرض است.
- برای استقرارهای Claude CLI، `model: "anthropic/claude-opus-4-7"` به‌همراه `agentRuntime.id: "claude-cli"` را ترجیح دهید. ارجاع‌های legacy مدل `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را canonical نگه دارد و backend اجرا را در `agentRuntime.id` قرار دهد.
- کلیدهای قدیمی‌تر سیاست runtime توسط `openclaw doctor --fix` به `agentRuntime` بازنویسی می‌شوند.
- انتخاب harness پس از اولین اجرای embedded برای هر شناسه نشست pin می‌شود. تغییرات پیکربندی/محیط روی نشست‌های جدید یا resetشده اثر می‌گذارند، نه روی transcript موجود. نشست‌های legacy که تاریخچه transcript دارند اما pin ثبت‌شده ندارند، PI-pinned در نظر گرفته می‌شوند. `/status`، runtime موثر را گزارش می‌کند، برای مثال `Runtime: OpenClaw Pi Default` یا `Runtime: OpenAI Codex`.
- این فقط اجرای turn عامل متنی را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدئو، و TTS همچنان از تنظیمات ارائه‌دهنده/مدل خودشان استفاده می‌کنند.

**خلاصه‌های alias داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

| نام مستعار         | مدل                                       |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

نام‌های مستعار پیکربندی‌شده‌ی شما همیشه بر پیش‌فرض‌ها مقدم هستند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌طور پیش‌فرض `tool_stream` را برای جریان‌سازی فراخوانی ابزار فعال می‌کنند. برای غیرفعال‌کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

پشتانه‌های اختیاری CLI برای اجراهای جایگزین فقط‌متنی (بدون فراخوانی ابزار). وقتی ارائه‌دهندگان API شکست می‌خورند، به‌عنوان پشتیبان مفید است.

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

- پشتانه‌های CLI متن‌محور هستند؛ ابزارها همیشه غیرفعال‌اند.
- وقتی `sessionArg` تنظیم شده باشد، نشست‌ها پشتیبانی می‌شوند.
- وقتی `imageArg` مسیرهای فایل را بپذیرد، عبور مستقیم تصویر پشتیبانی می‌شود.

### `agents.defaults.systemPromptOverride`

کل پرامپت سیستم ساخته‌شده توسط OpenClaw را با یک رشته ثابت جایگزین می‌کند. در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقدارهای اختصاصی هر عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شده‌ی پرامپت مفید است.

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

لایه‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانواده مدل اعمال می‌شوند. شناسه‌های مدل خانواده GPT-5 قرارداد رفتاری مشترک را در میان ارائه‌دهندگان دریافت می‌کنند؛ `personality` فقط لایه سبک تعامل دوستانه را کنترل می‌کند.

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

- `"friendly"` (پیش‌فرض) و `"on"` لایه سبک تعامل دوستانه را فعال می‌کنند.
- `"off"` فقط لایه دوستانه را غیرفعال می‌کند؛ قرارداد رفتاری برچسب‌خورده GPT-5 همچنان فعال می‌ماند.
- مقدار قدیمی `plugins.entries.openai.config.personality` همچنان زمانی خوانده می‌شود که این تنظیم مشترک تنظیم نشده باشد.

### `agents.defaults.heartbeat`

اجراهای دوره‌ای Heartbeat.

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

- `every`: رشته مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال‌کردن، روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستم حذف می‌کند و تزریق `HEARTBEAT.md` به زمینه راه‌اندازی را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را در طول اجراهای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: حداکثر زمان مجاز بر حسب ثانیه برای یک نوبت عامل Heartbeat پیش از لغو آن. برای استفاده از `agents.defaults.timeoutSeconds` تنظیم‌نشده باقی بگذارید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` را منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینه راه‌اندازی سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی فضای کاری نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه و بدون تاریخچه گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی cron با `sessionTarget: "isolated"`. هزینه توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در مسیرهای مشغول اضافی به تعویق می‌افتند: کار عامل فرعی یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
- برای هر عامل: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر عاملی `heartbeat` را تعریف کند، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند — فاصله‌های کوتاه‌تر توکن بیشتری مصرف می‌کنند.

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

- `mode`: `default` یا `safeguard` (خلاصه‌سازی بخش‌بندی‌شده برای تاریخچه‌های طولانی). [Compaction](/fa/concepts/compaction) را ببینید.
- `provider`: شناسه یک Plugin ارائه‌دهنده Compaction ثبت‌شده. وقتی تنظیم شود، به‌جای خلاصه‌سازی LLM داخلی، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به حالت داخلی برمی‌گردد. تنظیم یک ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: حداکثر ثانیه‌های مجاز برای یک عملیات Compaction پیش از اینکه OpenClaw آن را لغو کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجه نقطه برش Pi برای نگه‌داشتن انتهای تازه‌ترین رونوشت به‌صورت عین‌به‌عین. `/compact` دستی وقتی این مقدار صراحتا تنظیم شده باشد آن را رعایت می‌کند؛ در غیر این صورت Compaction دستی یک checkpoint سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` راهنمای داخلی نگهداری شناسه‌های مبهم را هنگام خلاصه‌سازی Compaction پیشوند می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه‌ها که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش مجدد در برابر خروجی بدفرم برای خلاصه‌های safeguard. در حالت safeguard به‌طور پیش‌فرض فعال است؛ برای ردکردن audit، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از افزوده‌شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش فعلی را پیش از ارسال پرامپت لغو می‌کند و از مسیر بازیابی precheck موجود برای کوتاه‌کردن نتایج ابزار یا compact و تلاش دوباره استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال‌کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا صراحتا روی همان جفت پیش‌فرض تنظیم شود، عنوان‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان fallback قدیمی پذیرفته می‌شوند.
- `model`: override اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه بایت اختیاری (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به رونوشت جانشین کوچک‌تری بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و تکمیل Compaction اعلان‌های کوتاه به کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). برای بی‌صدا نگه‌داشتن Compaction، به‌طور پیش‌فرض غیرفعال است.
- `memoryFlush`: نوبت عامل‌محور بی‌صدا پیش از Compaction خودکار برای ذخیره حافظه‌های بادوام. وقتی این نوبت نگهداری باید روی یک مدل محلی بماند، `model` را روی ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ override زنجیره fallback نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

### `agents.defaults.contextPruning`

**نتایج ابزار قدیمی** را پیش از ارسال به LLM از زمینه درون‌حافظه‌ای هرس می‌کند. تاریخچه نشست روی دیسک را تغییر **نمی‌دهد**.

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

<Accordion title="رفتار حالت cache-ttl">

- `mode: "cache-ttl"` گذرهای هرس را فعال می‌کند.
- `ttl` کنترل می‌کند که هرس هر چند وقت یک‌بار می‌تواند دوباره اجرا شود (پس از آخرین لمس cache).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را نرم‌کوتاه می‌کند، سپس در صورت نیاز نتایج ابزار قدیمی‌تر را سخت‌پاک می‌کند.

**نرم‌کوتاه‌کردن** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**سخت‌پاک‌کردن** کل نتیجه ابزار را با placeholder جایگزین می‌کند.

یادداشت‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها بر پایه نویسه هستند (تقریبی)، نه شمارش دقیق توکن.
- اگر کمتر از `keepLastAssistants` پیام دستیار وجود داشته باشد، هرس رد می‌شود.

</Accordion>

برای جزئیات رفتار، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### جریان‌سازی بلوک

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

- کانال‌های غیر از Telegram برای فعال‌سازی پاسخ‌های بلوکی به `*.blockStreaming: true` صریح نیاز دارند.
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های مخصوص هر حساب). Signal/Slack/Discord/Google Chat به‌صورت پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. بازنویسی برای هر عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار و قطعه‌بندی، [جریان‌دهی](/fa/concepts/streaming) را ببینید.

### نشانگرهای تایپ

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

- پیش‌فرض‌ها: `instant` برای گفت‌وگوهای مستقیم/اشاره‌ها، `message` برای گفت‌وگوهای گروهی بدون اشاره.
- بازنویسی‌های هر نشست: `session.typingMode`، `session.typingIntervalSeconds`.

[نشانگرهای تایپ](/fa/concepts/typing-indicators) را ببینید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

سندباکس‌سازی اختیاری برای عامل تعبیه‌شده. برای راهنمای کامل، [سندباکس‌سازی](/fa/gateway/sandboxing) را ببینید.

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

<Accordion title="جزئیات سندباکس">

**پشتوانه:**

- `docker`: زمان اجرای محلی Docker (پیش‌فرض)
- `ssh`: زمان اجرای راه دور عمومی با پشتوانه SSH
- `openshell`: زمان اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات مخصوص زمان اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی پشتوانه SSH:**

- `target`: هدف SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه مطلق راه دور که برای فضاهای کاری هر محدوده استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefs که OpenClaw در زمان اجرا به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: تنظیمات سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` مقدم است
- `certificateData` بر `certificateFile` مقدم است
- `knownHostsData` بر `knownHostsFile` مقدم است
- مقدارهای `*Data` با پشتوانه SecretRef پیش از شروع نشست سندباکس از اسنپ‌شات فعال زمان اجرای رازها حل می‌شوند

**رفتار پشتوانه SSH:**

- فضای کاری راه دور را یک‌بار پس از ایجاد یا ایجاد دوباره آماده می‌کند
- سپس فضای کاری SSH راه دور را مرجع نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه دور را به‌صورت خودکار با میزبان همگام نمی‌کند
- از کانتینرهای مرورگر سندباکس پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری سندباکس برای هر محدوده زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری سندباکس در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent` mount می‌شود
- `rw`: فضای کاری عامل به‌صورت خواندنی/نوشتنی در `/workspace` mount می‌شود

**محدوده:**

- `session`: کانتینر + فضای کاری برای هر نشست
- `agent`: یک کانتینر + فضای کاری برای هر عامل (پیش‌فرض)
- `shared`: کانتینر و فضای کاری مشترک (بدون ایزوله‌سازی بین نشست‌ها)

**پیکربندی Plugin OpenShell:**

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

**حالت OpenShell:**

- `mirror`: پیش از exec، راه دور را از محلی آماده می‌کند و پس از exec همگام‌سازی برگشتی انجام می‌دهد؛ فضای کاری محلی مرجع می‌ماند
- `remote`: هنگام ایجاد سندباکس، راه دور را یک‌بار آماده می‌کند و سپس فضای کاری راه دور را مرجع نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که خارج از OpenClaw انجام شده‌اند پس از مرحله آماده‌سازی به‌صورت خودکار وارد سندباکس همگام نمی‌شوند.
انتقال از طریق SSH به سندباکس OpenShell انجام می‌شود، اما Plugin مالک چرخه عمر سندباکس و همگام‌سازی mirror اختیاری است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل نوشتن، و کاربر root نیاز دارد.

**کانتینرها به‌صورت پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌صورت پیش‌فرض مسدود است، مگر اینکه صریحا
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (برای مواقع اضطراری) را تنظیم کنید.

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال آماده می‌شوند.

**`docker.binds`** پوشه‌های میزبان اضافه را mount می‌کند؛ bindهای سراسری و هر عامل با هم ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. نشانی noVNC در پرامپت سیستم تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌صورت پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw به‌جای افشای گذرواژه در نشانی مشترک، یک نشانی توکن‌دار کوتاه‌عمر صادر می‌کند.

- `allowHostControl: false` (پیش‌فرض) نشست‌های سندباکس‌شده را از هدف‌گیری مرورگر میزبان منع می‌کند.
- `network` به‌صورت پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط وقتی صریحا اتصال bridge سراسری می‌خواهید، آن را روی `bridge` تنظیم کنید.
- `cdpSourceRange` به‌صورت اختیاری ورود CDP را در لبه کانتینر به یک محدوده CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` پوشه‌های میزبان اضافه را فقط در کانتینر مرورگر سندباکس mount می‌کند. وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
- پیش‌فرض‌های راه‌اندازی در `scripts/sandbox-browser-entrypoint.sh` تعریف شده‌اند و برای میزبان‌های کانتینری تنظیم شده‌اند:
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
  - `--disable-extensions` (به‌صورت پیش‌فرض فعال)
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu` به‌صورت پیش‌فرض فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توان آن‌ها را با `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` اگر گردش کار شما به افزونه‌ها وابسته باشد، آن‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از محدودیت فرایند پیش‌فرض Chromium، `0` را تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها خط مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر از تصویر مرورگر سفارشی با entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکس‌سازی مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصاویر (از checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، فرمان‌های درون‌خطی `docker build` را در [سندباکس‌سازی § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) ببینید.

### `agents.list` (بازنویسی‌های هر عامل)

از `agents.list[].tts` استفاده کنید تا به یک عامل ارائه‌دهنده، صدا، مدل،
سبک، یا حالت auto-TTS مخصوص خودش را بدهید. بلوک عامل روی
`messages.tts` سراسری deep-merge می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک جا بمانند و عامل‌های جداگانه فقط فیلدهای صدا یا ارائه‌دهنده‌ای را که نیاز دارند بازنویسی کنند. بازنویسی عامل فعال برای پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و اولویت، [تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides) را ببینید.

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
        agentRuntime: { id: "auto", fallback: "pi" },
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

- `id`: شناسه پایدار عامل (الزامی).
- `default`: وقتی چند مورد تنظیم شده باشد، اولین مورد برنده می‌شود (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین ورودی فهرست پیش‌فرض است.
- `model`: شکل رشته‌ای، یک مدل اصلی سخت‌گیرانه برای هر عامل و بدون جایگزین مدل تنظیم می‌کند؛ شکل شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. از `{ primary, fallbacks: [...] }` استفاده کنید تا آن عامل را وارد جایگزینی کنید، یا از `{ primary, fallbacks: [] }` استفاده کنید تا رفتار سخت‌گیرانه را صریح کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند، همچنان جایگزین‌های پیش‌فرض را به ارث می‌برند مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان برای هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های ویژه عامل مانند `cacheRetention`، `temperature`، یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری متن‌به‌گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده مشترک و سیاست جایگزین را در `messages.tts` نگه دارید و اینجا فقط مقادیر ویژه پرسونا مانند ارائه‌دهنده، صدا، مدل، سبک، یا حالت خودکار را تنظیم کنید.
- `skills`: فهرست مجاز Skills اختیاری برای هر عامل. اگر حذف شود، عامل در صورت تنظیم بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح، پیش‌فرض‌ها را به‌جای ادغام کردن جایگزین می‌کند، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح پیش‌فرض تفکر اختیاری برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. نمایه ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند کدام مقادیر معتبر هستند؛ برای Google Gemini، `adaptive` تفکر پویای متعلق به ارائه‌دهنده را حفظ می‌کند (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی پیش‌فرض اختیاری Reasoning برای هر عامل (`on | off | stream`). وقتی هیچ بازنویسی Reasoning برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری برای حالت سریع برای هر عامل (`true | false`). وقتی هیچ بازنویسی حالت سریع برای هر پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `agentRuntime`: بازنویسی اختیاری سیاست runtime سطح پایین برای هر عامل. از `{ id: "codex" }` استفاده کنید تا یک عامل فقط Codex باشد، درحالی‌که عامل‌های دیگر جایگزین پیش‌فرض PI را در حالت `auto` نگه می‌دارند.
- `runtime`: توصیف‌گر runtime اختیاری برای هر عامل. وقتی عامل باید به‌صورت پیش‌فرض از نشست‌های هارنس ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به workspace، نشانی `http(s)`، یا URI از نوع `data:`.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` خودهدف باید مجاز باشند، شناسه درخواست‌کننده را وارد کنید.
- محافظ وراثت sandbox: اگر نشست درخواست‌کننده sandbox شده باشد، `sessions_spawn` هدف‌هایی را که بدون sandbox اجرا می‌شوند رد می‌کند.
- `subagents.requireAgentId`: وقتی true باشد، فراخوانی‌های `sessions_spawn` که `agentId` را حذف می‌کنند مسدود می‌کند (انتخاب صریح نمایه را اجباری می‌کند؛ پیش‌فرض: false).

---

## مسیریابی چندعاملی

چند عامل ایزوله را داخل یک Gateway اجرا کنید. [چندعاملی](/fa/concepts/multi-agent) را ببینید.

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

### فیلدهای تطبیق binding

- `type` (اختیاری): `route` برای مسیریابی عادی (نبودن type به‌صورت پیش‌فرض route است)، `acp` برای bindingهای گفت‌وگوی پایدار ACP.
- `match.channel` (الزامی)
- `match.accountId` (اختیاری؛ `*` = هر حساب؛ حذف‌شده = حساب پیش‌فرض)
- `match.peer` (اختیاری؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختیاری؛ ویژه کانال)
- `acp` (اختیاری؛ فقط برای `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتیب تطبیق قطعی:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (دقیق، بدون peer/guild/team)
5. `match.accountId: "*"` (در سطح کل کانال)
6. عامل پیش‌فرض

در هر سطح، اولین ورودی مطابق در `bindings` برنده می‌شود.

برای ورودی‌های `type: "acp"`، OpenClaw با هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) حل می‌کند و از ترتیب سطح binding مسیریابی بالا استفاده نمی‌کند.

### نمایه‌های دسترسی برای هر عامل

<Accordion title="دسترسی کامل (بدون sandbox)">

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

<Accordion title="ابزارهای فقط خواندنی + workspace">

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

<Accordion title="بدون دسترسی به فایل‌سیستم (فقط پیام‌رسانی)">

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

برای جزئیات اولویت، [Sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) را ببینید.

---

## نشست

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
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

<Accordion title="جزئیات فیلد نشست">

- **`scope`**: راهبرد پایه گروه‌بندی نشست برای زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده در یک زمینه کانال، نشست جداگانه‌ای می‌گیرد.
  - `global`: همه شرکت‌کنندگان در یک زمینه کانال، یک نشست واحد را به اشتراک می‌گذارند (فقط وقتی استفاده کنید که زمینه مشترک مورد نظر است).
- **`dmScope`**: نحوه گروه‌بندی DMها.
  - `main`: همه DMها نشست اصلی را به اشتراک می‌گذارند.
  - `per-peer`: جداسازی بر اساس شناسه فرستنده در میان کانال‌ها.
  - `per-channel-peer`: جداسازی به ازای کانال + فرستنده (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: جداسازی به ازای حساب + کانال + فرستنده (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: نگاشت شناسه‌های کانونی به همتایان دارای پیشوند ارائه‌دهنده برای اشتراک‌گذاری نشست میان کانال‌ها. دستورهای Dock مانند `/dock_discord` از همین نگاشت استفاده می‌کنند تا مسیر پاسخ نشست فعال را به همتای کانال پیوندخورده دیگری تغییر دهند؛ [اتصال کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در زمان محلی `atHour` بازنشانی می‌شود؛ `idle` پس از `idleMinutes` بازنشانی می‌شود. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بیکار از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارسازی‌های Cron، اعلان‌های exec، و امور دفترداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بیکار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های به‌ازای نوع (`direct`، `group`، `thread`). مقدار قدیمی `dm` به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`parentForkMaxTokens`**: بیشینه `totalTokens` مجاز نشست والد هنگام ساخت نشست رشته منشعب‌شده (پیش‌فرض `100000`).
  - اگر `totalTokens` والد بالاتر از این مقدار باشد، OpenClaw به‌جای به‌ارث‌بردن تاریخچه رونوشت والد، یک نشست رشته تازه آغاز می‌کند.
  - برای غیرفعال‌کردن این محافظ و همیشه مجاز کردن انشعاب از والد، مقدار را `0` بگذارید.
- **`mainKey`**: فیلد قدیمی. زمان اجرا همیشه برای سطل اصلی گفت‌وگوی مستقیم از `"main"` استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینه نوبت‌های پاسخ‌وبرگشت میان عامل‌ها در تبادل‌های عامل‌به‌عامل (عدد صحیح، بازه: `0` تا `5`). `0` زنجیره‌سازی پینگ‌پنگ را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. نخستین رد، برنده است.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگهداشت ذخیره‌گاه نشست.
  - `mode`: مقدار `warn` فقط هشدار منتشر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: آستانه سنی برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: بیشینه تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). زمان اجرا پاک‌سازی دسته‌ای را با یک بافر کوچک سقف بالا برای محدودیت‌های اندازه تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را بلافاصله اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی حذف می‌کند.
  - `resetArchiveRetention`: نگهداشت بایگانی‌های رونوشت `*.reset.<timestamp>`. پیش‌فرض برابر `pruneAfter` است؛ برای غیرفعال‌کردن، مقدار را `false` بگذارید.
  - `maxDiskBytes`: بودجه اختیاری دیسک برای دایرکتوری نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین مصنوع‌ها/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای ویژگی‌های نشست مقید به رشته.
  - `enabled`: کلید پیش‌فرض اصلی (ارائه‌دهندگان می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: عدم‌تمرکز خودکار پیش‌فرض بر اثر عدم فعالیت بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینه سن سخت‌گیرانه پیش‌فرض بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)

</Accordion>

---

## پیام‌ها

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

### پیشوند پاسخ

بازنویسی‌های به‌ازای کانال/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

حل مقدار (مشخص‌ترین برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و آبشار را متوقف می‌کند. `"auto"` مقدار `[{identity.name}]` را استخراج می‌کند.

**متغیرهای الگو:**

| متغیر             | توضیح                | مثال                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل        | `claude-opus-4-6`           |
| `{modelFull}`     | شناسه کامل مدل       | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده      | `anthropic`                 |
| `{thinkingLevel}` | سطح تفکر فعلی        | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل        | (همان `"auto"`)             |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- پیش‌فرض برابر `identity.emoji` عامل فعال است، وگرنه `"👀"`. برای غیرفعال‌کردن، مقدار را `""` بگذارید.
- بازنویسی‌های به‌ازای کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل مقدار: حساب → کانال → `messages.ackReaction` → جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: تأیید را پس از پاسخ در کانال‌های دارای قابلیت واکنش مانند Slack، Discord، Telegram، WhatsApp، و BlueBubbles حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخه عمر را در Slack، Discord، و Telegram فعال می‌کند.
  در Slack و Discord، تنظیم‌نشده بودن باعث می‌شود وقتی واکنش‌های تأیید فعال‌اند، واکنش‌های وضعیت هم فعال بمانند.
  در Telegram، برای فعال‌کردن واکنش‌های وضعیت چرخه عمر، آن را صریحاً روی `true` بگذارید.

### تأخیر ورودی

پیام‌های سریع فقط‌متنی از همان فرستنده را در یک نوبت عامل واحد دسته‌بندی می‌کند. رسانه/پیوست‌ها بلافاصله تخلیه می‌شوند. دستورهای کنترلی از تأخیر عبور می‌کنند.

### TTS (تبدیل متن به گفتار)

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

- `auto` حالت پیش‌فرض TTS خودکار را کنترل می‌کند: `off`، `always`، `inbound`، یا `tagged`. `/tts on|off` می‌تواند ترجیحات محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصه‌سازی خودکار بازنویسی می‌کند.
- `modelOverrides` به‌صورت پیش‌فرض فعال است؛ مقدار پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند انتخاب صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` بازمی‌گردند.
- ارائه‌دهندگان گفتار همراه، متعلق به Plugin هستند. اگر `plugins.allow` تنظیم شده باشد، هر Plugin ارائه‌دهنده TTS را که می‌خواهید استفاده کنید وارد کنید، برای مثال `microsoft` برای Edge TTS. شناسه قدیمی ارائه‌دهنده `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطه پایانی OpenAI TTS را بازنویسی می‌کند. ترتیب حل مقدار پیکربندی، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1` است.
- وقتی `providers.openai.baseUrl` به یک نقطه پایانی غیر OpenAI اشاره کند، OpenClaw آن را سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌تر می‌کند.

---

## گفت‌وگو

پیش‌فرض‌ها برای حالت گفت‌وگو (macOS/iOS/Android).

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

- وقتی چند ارائه‌دهنده Talk پیکربندی شده باشند، `talk.provider` باید با یک کلید در `talk.providers` مطابقت داشته باشد.
- کلیدهای مسطح قدیمی Talk (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند و به‌صورت خودکار به `talk.providers.<provider>` مهاجرت داده می‌شوند.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` بازمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- جایگزین `ELEVENLABS_API_KEY` فقط وقتی اعمال می‌شود که هیچ کلید API برای Talk پیکربندی نشده باشد.
- `providers.*.voiceAliases` به دستورالعمل‌های Talk اجازه می‌دهد از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face استفاده‌شده توسط کمک‌کننده محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS، در صورت وجود، از طریق کمک‌کننده همراه `openclaw-mlx-tts` اجرا می‌شود، یا از یک فایل اجرایی در `PATH`؛ `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌کننده را برای توسعه بازنویسی می‌کند.
- `speechLocale` شناسه محلی BCP 47 مورد استفاده برای تشخیص گفتار Talk در iOS/macOS را تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، تنظیمش نکنید.
- `silenceTimeoutMs` کنترل می‌کند حالت Talk پس از سکوت کاربر چه مدت منتظر بماند و سپس رونوشت را ارسال کند. تنظیم‌نشده بودن، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`).

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همه کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
