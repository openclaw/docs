---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعاملی
    - تنظیم رفتار نشست، تحویل پیام، و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-07-03T17:31:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی محدود به عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
`messages.*` و `talk.*`. برای کانال‌ها، ابزارها، زمان اجرای Gateway و دیگر
کلیدهای سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## پیش‌فرض‌های عامل

### `agents.defaults.workspace`

پیش‌فرض: وقتی `OPENCLAW_WORKSPACE_DIR` تنظیم شده باشد، همان؛ در غیر این صورت `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

یک مقدار صریح `agents.defaults.workspace` بر `OPENCLAW_WORKSPACE_DIR` اولویت دارد. وقتی نمی‌خواهید آن مسیر را در پیکربندی بنویسید، از متغیر محیطی استفاده کنید تا عامل‌های پیش‌فرض را به یک فضای کاری mount‌شده اشاره دهید.

### `agents.defaults.repoRoot`

ریشه اختیاری مخزن که در خط Runtime اعلان سیستم نمایش داده می‌شود. اگر تنظیم نشده باشد، OpenClaw با حرکت رو به بالا از فضای کاری آن را به‌صورت خودکار تشخیص می‌دهد.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

فهرست مجاز پیش‌فرض اختیاری Skills برای عامل‌هایی که
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
- برای به‌ارث‌بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
- برای نداشتن Skills، مقدار `agents.list[].skills: []` را تنظیم کنید.
- یک فهرست غیرخالی `agents.list[].skills` مجموعه نهایی برای آن عامل است؛ با پیش‌فرض‌ها
  ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های راه‌اندازی اولیه فضای کاری (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شده فضای کاری را رد می‌کند، در حالی که همچنان فایل‌های ضروری راه‌اندازی اولیه نوشته می‌شوند. مقادیر معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند چه زمانی فایل‌های راه‌اندازی اولیه فضای کاری در اعلان سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامه امن (پس از پاسخ کامل‌شده دستیار) تزریق دوباره راه‌اندازی اولیه فضای کاری را رد می‌کنند و اندازه اعلان را کاهش می‌دهند. اجراهای Heartbeat و تلاش‌های دوباره پس از Compaction همچنان زمینه را بازسازی می‌کنند.
- `"never"`: راه‌اندازی اولیه فضای کاری و تزریق فایل‌های زمینه را در هر نوبت غیرفعال می‌کند. این را فقط برای عامل‌هایی استفاده کنید که چرخه عمر اعلان خود را کاملا مالک هستند (موتورهای زمینه سفارشی، زمان‌های اجرای بومی که زمینه خود را می‌سازند، یا گردش‌کارهای تخصصی بدون راه‌اندازی اولیه). نوبت‌های Heartbeat و بازیابی از Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

بازنویسی برای هر عامل: `agents.list[].contextInjection`. مقدارهای حذف‌شده از
`agents.defaults.contextInjection` ارث‌بری می‌کنند.

### `agents.defaults.bootstrapMaxChars`

حداکثر نویسه برای هر فایل راه‌اندازی اولیه فضای کاری پیش از کوتاه‌سازی. پیش‌فرض: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

بازنویسی برای هر عامل: `agents.list[].bootstrapMaxChars`. مقدارهای حذف‌شده از
`agents.defaults.bootstrapMaxChars` ارث‌بری می‌کنند.

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده در همه فایل‌های راه‌اندازی اولیه فضای کاری. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

بازنویسی برای هر عامل: `agents.list[].bootstrapTotalMaxChars`. مقدارهای حذف‌شده
از `agents.defaults.bootstrapTotalMaxChars` ارث‌بری می‌کنند.

### بازنویسی‌های پروفایل راه‌اندازی اولیه برای هر عامل

وقتی یک عامل به رفتار تزریق اعلان متفاوتی نسبت به پیش‌فرض‌های مشترک نیاز دارد، از بازنویسی‌های پروفایل راه‌اندازی اولیه برای هر عامل استفاده کنید. فیلدهای حذف‌شده از
`agents.defaults` ارث‌بری می‌کنند.

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

اعلان قابل‌مشاهده برای عامل در اعلان سیستم را هنگام کوتاه‌سازی زمینه راه‌اندازی اولیه کنترل می‌کند.
پیش‌فرض: `"always"`.

- `"off"`: هرگز متن اعلان کوتاه‌سازی را در اعلان سیستم تزریق نکن.
- `"once"`: برای هر امضای یکتای کوتاه‌سازی، یک اعلان مختصر را یک‌بار تزریق کن.
- `"always"`: وقتی کوتاه‌سازی وجود دارد، در هر اجرا یک اعلان مختصر تزریق کن (توصیه‌شده).

شمارش‌های خام/تزریق‌شده دقیق و فیلدهای تنظیم پیکربندی در تشخیص‌هایی مانند
گزارش‌های زمینه/وضعیت و لاگ‌ها باقی می‌مانند؛ زمینه معمول کاربر/زمان اجرای WebChat فقط
اعلان بازیابی مختصر را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### نقشه مالکیت بودجه زمینه

OpenClaw چندین بودجه اعلان/زمینه پرحجم دارد و آن‌ها به‌عمد بر اساس زیرسیستم جدا شده‌اند، به‌جای اینکه همه از یک
تنظیم عمومی عبور کنند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق معمول راه‌اندازی اولیه فضای کاری.
- `agents.defaults.startupContext.*`:
  مقدمه یک‌باره اجرای مدل در reset/startup، شامل فایل‌های روزانه اخیر
  `memory/*.md`. فرمان‌های چت ساده `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشرده Skills که در اعلان سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  گزیده‌های محدود زمان اجرا و بلوک‌های تزریق‌شده تحت مالکیت زمان اجرا.
- `memory.qmd.limits.*`:
  قطعه جست‌وجوی حافظه نمایه‌شده و اندازه‌بندی تزریق.

فقط وقتی یک عامل به بودجه متفاوتی نیاز دارد، از بازنویسی متناظر برای هر عامل استفاده کنید:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

مقدمه startup نوبت اول را که در اجراهای مدل reset/startup تزریق می‌شود کنترل می‌کند.
فرمان‌های چت ساده `/new` و `/reset` بدون فراخوانی
مدل، reset را تأیید می‌کنند؛ بنابراین این مقدمه را بارگذاری نمی‌کنند.

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

پیش‌فرض‌های مشترک برای سطح‌های محدود زمینه زمان اجرا.

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

- `memoryGetMaxChars`: سقف پیش‌فرض گزیده `memory_get` پیش از اضافه شدن
  فراداده کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجره خط پیش‌فرض `memory_get` وقتی `lines` حذف شده باشد.
- `toolResultMaxChars`: سقف پیشرفته نتیجه ابزار زنده که برای نتایج پایدارشده
  و بازیابی سرریز استفاده می‌شود. برای سقف خودکار زمینه مدل، تنظیم‌نشده بگذارید:
  `16000` نویسه زیر 100K توکن، `32000` نویسه در 100K+ توکن، و `64000`
  نویسه در 200K+ توکن. مقدارهای صریح تا `1000000` برای
  مدل‌های با زمینه بلند پذیرفته می‌شوند، اما سقف مؤثر همچنان به حدود 30٪ از
  پنجره زمینه مدل محدود است. `openclaw doctor --deep` سقف مؤثر را چاپ می‌کند،
  و doctor فقط وقتی هشدار می‌دهد که یک بازنویسی صریح قدیمی باشد یا اثری نداشته باشد.
- `postCompactionMaxChars`: سقف گزیده AGENTS.md که هنگام تزریق
  تازه‌سازی پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

بازنویسی برای هر عامل برای تنظیم‌های مشترک `contextLimits`. فیلدهای حذف‌شده از
`agents.defaults.contextLimits` ارث‌بری می‌کنند.

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

سقف سراسری برای فهرست فشرده Skills که در اعلان سیستم تزریق می‌شود. این
بر خواندن فایل‌های `SKILL.md` در زمان نیاز تأثیر نمی‌گذارد.

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

بازنویسی برای هر عامل برای بودجه اعلان Skills.

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

حداکثر اندازه پیکسل برای بلندترین ضلع تصویر در بلوک‌های تصویر transcript/tool پیش از فراخوانی‌های ارائه‌دهنده.
پیش‌فرض: `1200`.

مقادیر پایین‌تر معمولا مصرف توکن بینایی و اندازه payload درخواست را برای اجراهای پر از اسکرین‌شات کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ترجیح فشرده‌سازی/جزئیات ابزار تصویر برای تصویرهایی که از مسیرهای فایل، URLها و ارجاع‌های رسانه بارگذاری می‌شوند.
پیش‌فرض: `auto`.

OpenClaw نردبان تغییر اندازه را با مدل تصویر انتخاب‌شده تطبیق می‌دهد. برای مثال، Claude Opus 4.8، OpenAI GPT-5.5، Qwen VL و مدل‌های بینایی میزبانی‌شده Llama 4 می‌توانند از تصاویر بزرگ‌تری نسبت به مسیرهای بینایی قدیمی‌تر/پیش‌فرض با جزئیات بالا استفاده کنند، در حالی که نوبت‌های چندتصویری در حالت `auto` برای کنترل هزینه توکن و تأخیر، تهاجمی‌تر فشرده می‌شوند.

مقادیر:

- `auto`: تطبیق با محدودیت‌های مدل و تعداد تصویرها.
- `efficient`: ترجیح تصویرهای کوچک‌تر برای مصرف کمتر توکن و بایت.
- `balanced`: استفاده از نردبان استاندارد میانه.
- `high`: حفظ جزئیات بیشتر برای اسکرین‌شات‌ها، نمودارها و تصویرهای سند.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

منطقه زمانی برای زمینه اعلان سیستم (نه برچسب‌های زمانی پیام). به منطقه زمانی میزبان برمی‌گردد.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

قالب زمان در اعلان سیستم. پیش‌فرض: `auto` (ترجیح سیستم‌عامل).

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

- `model`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - فرم رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - فرم شیء، مدل اصلی به‌همراه مدل‌های جایگزین مرتب‌شده برای failover را تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - مسیر ابزار `image` از آن به‌عنوان پیکربندی مدل بینایی استفاده می‌کند.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نتواند ورودی تصویر را بپذیرد، برای مسیریابی جایگزین استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های تنها برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه تنها به‌طور یکتا با یک ورودی پیکربندی‌شده دارای قابلیت تصویر در `models.providers.*.models` مطابقت داشته باشد، OpenClaw آن را به همان ارائه‌دهنده نسبت می‌دهد. مطابقت‌های پیکربندی‌شده مبهم به پیشوند صریح ارائه‌دهنده نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده که تصویر تولید کند از آن استفاده می‌کند.
  - مقادیر معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP شفاف‌پس‌زمینه OpenAI.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت ارائه‌دهنده متناظر را هم پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده دارای پشتوانه احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس سایر ارائه‌دهندگان ثبت‌شده تولید تصویر را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` از آن استفاده می‌کنند.
  - مقادیر معمول: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده دارای پشتوانه احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس سایر ارائه‌دهندگان ثبت‌شده تولید موسیقی را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - قابلیت مشترک تولید ویدیو و ابزار داخلی `video_generate` از آن استفاده می‌کنند.
  - مقادیر معمول: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده دارای پشتوانه احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس سایر ارائه‌دهندگان ثبت‌شده تولید ویدیو را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
  - Plugin رسمی تولید ویدیوی Qwen تا ۱ ویدیوی خروجی، ۱ تصویر ورودی، ۴ ویدیوی ورودی، مدت ۱۰ ثانیه، و گزینه‌های سطح ارائه‌دهنده `size`، `aspectRatio`، `resolution`، `audio`، و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - ابزار `pdf` از آن برای مسیریابی مدل استفاده می‌کند.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض برمی‌گردد.
- `pdfMaxBytesMb`: محدودیت اندازه پیش‌فرض PDF برای ابزار `pdf` وقتی `maxBytesMb` هنگام فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: حداکثر تعداد صفحات پیش‌فرضی که حالت جایگزین استخراج در ابزار `pdf` در نظر می‌گیرد.
- `verboseDefault`: سطح verbose پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خطوط ابزار پیش‌نویس پیشرفت. مقادیر: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (افزودن فرمان/جزئیات خام وقتی موجود باشد). `agents.list[].toolProgressDetail` مختص هر عامل این پیش‌فرض را بازنویسی می‌کند.
- `reasoningDefault`: نمایانی reasoning پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"stream"`. `agents.list[].reasoningDefault` مختص هر عامل این پیش‌فرض را بازنویسی می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای مالکان، فرستندگان مجاز، یا زمینه‌های Gateway مدیر-اپراتور اعمال می‌شوند، آن هم وقتی هیچ بازنویسی reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح خروجی elevated پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلاً `openai/gpt-5.5` برای دسترسی با کلید API OpenAI یا Codex OAuth). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک مطابقت یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط پس از آن به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد (رفتار سازگاری منسوخ، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را عرضه نکند، OpenClaw به‌جای نمایش پیش‌فرض کهنه ارائه‌دهنده حذف‌شده، به نخستین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (مختص ارائه‌دهنده، برای مثال `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، مسیریابی OpenRouter `provider`، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - از ورودی‌های `provider/*` مانند `"openai/*": {}` یا `"vllm/*": {}` استفاده کنید تا همه مدل‌های کشف‌شده برای ارائه‌دهندگان منتخب را بدون فهرست‌کردن دستی هر شناسه مدل نشان دهید.
  - وقتی هر مدل کشف‌شده پویا برای آن ارائه‌دهنده باید از runtime یکسانی استفاده کند، `agentRuntime` را به یک ورودی `provider/*` اضافه کنید. سیاست runtime دقیق `provider/model` همچنان بر wildcard مقدم است.
  - ویرایش‌های ایمن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های allowlist موجود را حذف کنند رد می‌کند، مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های configure/onboarding در محدوده ارائه‌دهنده، مدل‌های ارائه‌دهنده منتخب را در این map ادغام می‌کنند و ارائه‌دهندگان نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌طور خودکار فعال می‌شود. برای توقف تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای بازنویسی آستانه از `params.responsesCompactThreshold` استفاده کنید. [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری ارائه‌دهنده که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلاً `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (مختص مدل) بازنویسی می‌شود، سپس `agents.list[].params` (شناسه عامل مطابق) بر اساس کلید بازنویسی می‌کند. برای جزئیات، [Prompt Caching](/fa/reference/prompt-caching) را ببینید.
- `models.providers.openrouter.params.provider`: سیاست پیش‌فرض مسیریابی ارائه‌دهنده در سراسر OpenRouter. OpenClaw این را به شیء `provider` درخواست OpenRouter ارسال می‌کند؛ `agents.defaults.models["openrouter/<model>"].params.provider` مختص هر مدل و پارامترهای عامل بر اساس کلید بازنویسی می‌کنند. [مسیریابی ارائه‌دهنده OpenRouter](/fa/providers/openrouter#advanced-configuration) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON پیشرفته pass-through که در بدنه‌های درخواست `api: "openai-completions"` برای پراکسی‌های سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای تولیدشده درخواست تداخل داشته باشد، بدنه اضافی برنده می‌شود؛ مسیرهای completions غیربومی همچنان پس از آن `store` مختص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin همراه vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح پیش‌فرض‌های تولیدشده را بازنویسی می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. مدل‌های thinking پیکربندی‌شده vLLM Qwen و Nemotron به‌جای نردبان effort چندسطحی، انتخاب‌های دودویی `/think` (`off`، `on`) ارائه می‌کنند.
- `compat.thinkingFormat`: سبک payload thinking سازگار با OpenAI. برای `reasoning.enabled` به سبک Together از `"together"`، برای `enable_thinking` سطح بالای سبک Qwen از `"qwen"`، یا برای `chat_template_kwargs.enable_thinking` روی backendهای خانواده Qwen که از kwargs سطح درخواست chat-template پشتیبانی می‌کنند، مانند vLLM، از `"qwen-chat-template"` استفاده کنید. OpenClaw thinking غیرفعال را به `false` و thinking فعال را به `true` نگاشت می‌کند، و مدل‌های پیکربندی‌شده vLLM Qwen برای این قالب‌ها انتخاب‌های دودویی `/think` ارائه می‌کنند.
- `compat.supportedReasoningEfforts`: فهرست effortهای reasoning سازگار با OpenAI برای هر مدل. برای endpointهای سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw برای آن ارائه‌دهنده/مدل پیکربندی‌شده، `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی CLI عامل، و اعتبارسنجی `llm-task` نمایش می‌دهد. وقتی backend برای یک سطح کانونی مقدار مختص ارائه‌دهنده می‌خواهد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: opt-in مختص Z.AI برای thinking حفظ‌شده. وقتی فعال باشد و thinking روشن باشد، OpenClaw `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ [thinking و thinking حفظ‌شده Z.AI](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `localService`: مدیر فرایند اختیاری در سطح ارائه‌دهنده برای سرورهای مدل محلی/خودمیزبان. وقتی مدل انتخاب‌شده به آن ارائه‌دهنده تعلق داشته باشد، OpenClaw `healthUrl` (یا `baseUrl + "/models"`) را probe می‌کند، اگر endpoint پایین باشد `command` را با `args` شروع می‌کند، تا `readyTimeoutMs` منتظر می‌ماند، سپس درخواست مدل را ارسال می‌کند. `command` باید یک مسیر مطلق باشد. `idleStopMs: 0` فرایند را تا خروج OpenClaw زنده نگه می‌دارد؛ مقدار مثبت، فرایندی را که OpenClaw ایجاد کرده پس از آن تعداد میلی‌ثانیه بیکاری متوقف می‌کند. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- سیاست runtime به ارائه‌دهندگان یا مدل‌ها تعلق دارد، نه به `agents.defaults`. برای قواعد سراسر ارائه‌دهنده از `models.providers.<provider>.agentRuntime` یا برای قواعد مختص مدل از `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` استفاده کنید. مدل‌های عامل OpenAI روی ارائه‌دهنده رسمی OpenAI به‌طور پیش‌فرض Codex را انتخاب می‌کنند.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`، `/models set-image`، و فرمان‌های افزودن/حذف fallback) فرم شیء کانونی را ذخیره می‌کنند و در صورت امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجرای موازی عامل‌ها در میان نشست‌ها (هر نشست همچنان سریالی است). پیش‌فرض: ۴.

### سیاست runtime

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

- `id`: `"auto"`، `"openclaw"`، شناسهٔ یک harness ثبت‌شدهٔ Plugin، یا نام مستعار پشتیبانی‌شدهٔ backend در CLI. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic backend CLI با نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` به harnessهای ثبت‌شدهٔ Plugin اجازه می‌دهد turnهای پشتیبانی‌شده را claim کنند و وقتی هیچ harnessی مطابق نباشد از OpenClaw استفاده می‌کند. runtime صریح Plugin مانند `id: "codex"` به همان harness نیاز دارد و اگر در دسترس نباشد یا شکست بخورد fail closed می‌شود.
- `id: "pi"` فقط به‌عنوان نام مستعار منسوخ برای `openclaw` پذیرفته می‌شود تا configهای منتشرشده از v2026.5.22 و قبل‌تر حفظ شوند. config جدید باید از `openclaw` استفاده کند.
- تقدم runtime ابتدا policy دقیق model است (`agents.list[].models["provider/model"]`، `agents.defaults.models["provider/model"]`، یا `models.providers.<provider>.models[]`)، سپس `agents.list[]` / `agents.defaults.models["provider/*"]`، سپس policy سراسری provider در `models.providers.<provider>.agentRuntime`.
- کلیدهای runtime در سطح کل agent legacy هستند. `agents.defaults.agentRuntime`، `agents.list[].agentRuntime`، pinهای runtime در session، و `OPENCLAW_AGENT_RUNTIME` در انتخاب runtime نادیده گرفته می‌شوند. برای حذف مقدارهای stale، `openclaw doctor --fix` را اجرا کنید.
- modelهای agent مربوط به OpenAI به‌صورت پیش‌فرض از harness Codex استفاده می‌کنند؛ وقتی می‌خواهید این موضوع را صریح کنید، provider/model `agentRuntime.id: "codex"` همچنان معتبر است.
- برای استقرارهای Claude CLI، `model: "anthropic/claude-opus-4-8"` به‌همراه `agentRuntime.id: "claude-cli"` محدود به model ترجیح داده می‌شود. refهای legacy model مثل `claude-cli/claude-opus-4-7` برای سازگاری همچنان کار می‌کنند، اما config جدید باید انتخاب provider/model را canonical نگه دارد و backend اجرا را در policy runtime مربوط به provider/model قرار دهد.
- این فقط اجرای turnهای agent متنی را کنترل می‌کند. تولید رسانه، vision، PDF، موسیقی، ویدئو، و TTS همچنان از تنظیمات provider/model خودشان استفاده می‌کنند.

**میان‌برهای نام مستعار داخلی** (فقط وقتی اعمال می‌شوند که model در `agents.defaults.models` باشد):

| نام مستعار         | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

نام‌های مستعار پیکربندی‌شدهٔ شما همیشه بر پیش‌فرض‌ها اولویت دارند.

modelهای Z.AI GLM-4.x به‌صورت خودکار حالت thinking را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
modelهای Z.AI به‌صورت پیش‌فرض برای streaming فراخوانی tool، `tool_stream` را فعال می‌کنند. برای غیرفعال‌کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
Anthropic Claude Opus 4.8 در OpenClaw به‌صورت پیش‌فرض thinking را خاموش نگه می‌دارد؛ وقتی adaptive thinking صریحاً فعال شود، پیش‌فرض effort تحت مالکیت provider در Anthropic مقدار `high` است. modelهای Claude 4.6 وقتی سطح thinking صریحی تنظیم نشده باشد، به‌صورت پیش‌فرض `adaptive` هستند.

### `agents.defaults.cliBackends`

backendهای اختیاری CLI برای اجرای fallback فقط متنی (بدون فراخوانی tool). به‌عنوان پشتیبان هنگام شکست providerهای API مفید است.

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

- backendهای CLI متن‌محور هستند؛ toolها همیشه غیرفعال‌اند.
- وقتی `sessionArg` تنظیم شده باشد، sessionها پشتیبانی می‌شوند.
- وقتی `imageArg` مسیرهای فایل را بپذیرد، pass-through تصویر پشتیبانی می‌شود.
- `reseedFromRawTranscriptWhenUncompacted: true` به یک backend اجازه می‌دهد sessionهای امنِ
  نامعتبرشده را از tail محدود transcript خام OpenClaw، پیش از آنکه
  نخستین خلاصهٔ Compaction وجود داشته باشد، بازیابی کند. تغییرهای profile احراز هویت یا credential-epoch
  همچنان هرگز raw-reseed نمی‌شوند.

### `agents.defaults.promptOverlays`

overlayهای prompt مستقل از provider که بر اساس خانوادهٔ model روی سطح‌های prompt مونتاژشده توسط OpenClaw اعمال می‌شوند. شناسه‌های model خانوادهٔ GPT-5 قرارداد رفتاری مشترک را در مسیرهای OpenClaw/provider دریافت می‌کنند؛ `personality` فقط لایهٔ سبک تعامل دوستانه را کنترل می‌کند. مسیرهای app-server بومی Codex به‌جای این overlay مربوط به OpenClaw GPT-5، دستورالعمل‌های پایه/model تحت مالکیت Codex را نگه می‌دارند، و OpenClaw personality داخلی Codex را برای threadهای بومی غیرفعال می‌کند.

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

- `"friendly"` (پیش‌فرض) و `"on"` لایهٔ سبک تعامل دوستانه را فعال می‌کنند.
- `"off"` فقط لایهٔ دوستانه را غیرفعال می‌کند؛ قرارداد رفتاری برچسب‌خوردهٔ GPT-5 همچنان فعال می‌ماند.
- legacy `plugins.entries.openai.config.personality` وقتی این تنظیم مشترک تنظیم نشده باشد همچنان خوانده می‌شود.

### `agents.defaults.heartbeat`

اجرای دوره‌ای Heartbeat.

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

- `every`: رشتهٔ مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال‌سازی روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از system prompt حذف می‌کند و تزریق `HEARTBEAT.md` به context bootstrap را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای tool را هنگام اجرای heartbeat سرکوب می‌کند.
- `timeoutSeconds`: بیشینهٔ زمان مجاز بر حسب ثانیه برای یک turn agent مربوط به heartbeat پیش از abort شدن. اگر تنظیم نشود، وقتی `agents.defaults.timeoutSeconds` تنظیم شده باشد از آن استفاده می‌شود، وگرنه cadence مربوط به heartbeat با سقف 600 ثانیه به‌کار می‌رود.
- `directPolicy`: policy تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به target مستقیم را مجاز می‌کند. `block` تحویل به target مستقیم را سرکوب می‌کند و `reason=dm-blocked` منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجرای heartbeat از context سبک bootstrap استفاده می‌کند و از فایل‌های bootstrap workspace فقط `HEARTBEAT.md` را نگه می‌دارد.
- `isolatedSession`: وقتی true باشد، هر heartbeat در یک session تازه و بدون تاریخچهٔ گفت‌وگوی قبلی اجرا می‌شود. همان الگوی isolation مانند cron `sessionTarget: "isolated"`. هزینهٔ token هر heartbeat را از حدود ~100K به حدود ~2-5K token کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجرای heartbeat روی laneهای مشغول اضافی آن agent به تعویق می‌افتد: subagent خود آن با کلید session یا کار command تو‌در‌تو. laneهای Cron همیشه heartbeatها را به تعویق می‌اندازند، حتی بدون این flag.
- برای هر agent: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر agent مقدار `heartbeat` را تعریف کند، **فقط همان agentها** heartbeat اجرا می‌کنند.
- Heartbeatها turnهای کامل agent را اجرا می‌کنند — بازه‌های کوتاه‌تر tokenهای بیشتری مصرف می‌کنند.

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

- `mode`: ‏`default` یا `safeguard` (خلاصه‌سازی تکه‌ای برای تاریخچه‌های طولانی). [Compaction](/fa/concepts/compaction) را ببینید.
- `provider`: شناسه‌ی یک Plugin ثبت‌شده‌ی ارائه‌دهنده‌ی Compaction. وقتی تنظیم شود، به‌جای خلاصه‌سازی داخلی LLM، تابع `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به روش داخلی برمی‌گردد. تنظیم ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: بیشینه‌ی ثانیه‌های مجاز برای یک عملیات Compaction پیش از آنکه OpenClaw آن را متوقف کند. پیش‌فرض: `180`.
- `keepRecentTokens`: بودجه‌ی نقطه‌ی برش عامل برای نگه‌داشتن دنباله‌ی اخیر رونوشت به‌صورت کلمه‌به‌کلمه. دستور دستی `/compact` وقتی صریحا تنظیم شده باشد به این مقدار احترام می‌گذارد؛ در غیر این صورت Compaction دستی یک نقطه‌ی وارسی سخت است.
- `identifierPolicy`: ‏`strict` (پیش‌فرض)، `off`، یا `custom`. ‏`strict` هنگام خلاصه‌سازی Compaction راهنمای داخلی حفظ شناسه‌های مات را در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه‌ها که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش دوباره هنگام خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌طور پیش‌فرض فعال است؛ برای رد کردن ممیزی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار چرخه‌ی ابزار. وقتی `enabled: true` باشد، OpenClaw پس از افزوده‌شدن نتایج ابزار و پیش از فراخوانی مدل بعدی، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش جاری را پیش از ارسال پرامپت متوقف می‌کند و از مسیر بازیابی پیش‌بررسی موجود برای کوتاه‌سازی نتایج ابزار یا Compaction و تلاش دوباره استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. وقتی تنظیم نشده باشد یا روی `[]` تنظیم شود، تزریق دوباره غیرفعال است. تنظیم صریح `["Session Startup", "Red Lines"]` آن جفت را فعال می‌کند و fallback قدیمی `Every Session`/`Safety` را حفظ می‌کند. این را فقط زمانی فعال کنید که زمینه‌ی اضافی ارزش خطر تکرار راهنمای پروژه‌ای را داشته باشد که پیش‌تر در خلاصه‌ی Compaction ثبت شده است.
- `model`: ‏`provider/model-id` اختیاری یا نام مستعار ساده از `agents.defaults.models` فقط برای خلاصه‌سازی Compaction. نام‌های مستعار ساده پیش از ارسال حل می‌شوند؛ شناسه‌های لفظی پیکربندی‌شده‌ی مدل هنگام برخورد اولویت خود را حفظ می‌کنند. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این گزینه استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه‌ی اختیاری بایت (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از یک اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به رونوشت جانشین کوچک‌تری بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و پایان Compaction اعلان‌های کوتاهی برای کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). برای بی‌صدا نگه‌داشتن Compaction، به‌طور پیش‌فرض غیرفعال است.
- `memoryFlush`: نوبت عاملی بی‌صدا پیش از Compaction خودکار برای ذخیره‌کردن حافظه‌های پایدار. وقتی این نوبت نگهداری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این override زنجیره‌ی fallback نشست فعال را به ارث نمی‌برد. وقتی workspace فقط‌خواندنی باشد رد می‌شود.

### `agents.defaults.runRetries`

مرزهای تکرار تلاش دوباره‌ی چرخه‌ی اجرای بیرونی برای runtime عامل جاسازی‌شده، برای جلوگیری از چرخه‌های اجرای بی‌پایان هنگام بازیابی از شکست. توجه کنید که این تنظیم در حال حاضر فقط برای runtime عامل جاسازی‌شده اعمال می‌شود، نه runtimeهای ACP یا CLI.

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

- `base`: تعداد پایه‌ی تکرارهای تلاش دوباره برای چرخه‌ی اجرای بیرونی. پیش‌فرض: `24`.
- `perProfile`: تکرارهای اضافی تلاش دوباره که به‌ازای هر نامزد پروفایل fallback اعطا می‌شود. پیش‌فرض: `8`.
- `min`: حد مطلق کمینه برای تکرارهای تلاش دوباره. پیش‌فرض: `32`.
- `max`: حد مطلق بیشینه برای تکرارهای تلاش دوباره جهت جلوگیری از اجرای مهارنشده. پیش‌فرض: `160`.

### `agents.defaults.contextPruning`

**نتایج قدیمی ابزار** را پیش از ارسال به LLM از زمینه‌ی درون‌حافظه‌ای هرس می‌کند. تاریخچه‌ی نشست روی دیسک را تغییر **نمی‌دهد**.

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

- `mode: "cache-ttl"` گذرهای هرس را فعال می‌کند.
- `ttl` کنترل می‌کند که هرس هر چند وقت یک‌بار می‌تواند دوباره اجرا شود (پس از آخرین لمس cache).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را نرم‌کوتاه می‌کند، سپس در صورت نیاز نتایج قدیمی‌تر ابزار را سخت‌پاک می‌کند.
- `softTrimRatio` و `hardClearRatio` مقدارهایی از `0.0` تا `1.0` را می‌پذیرند؛ اعتبارسنجی پیکربندی مقدارهای بیرون از این بازه را رد می‌کند.

**کوتاه‌سازی نرم** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**پاک‌سازی سخت** کل نتیجه‌ی ابزار را با placeholder جایگزین می‌کند.

نکته‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها بر پایه‌ی نویسه هستند (تقریبی)، نه شمارش دقیق توکن.
- اگر پیام‌های دستیار کمتر از `keepLastAssistants` باشند، هرس رد می‌شود.

</Accordion>

برای جزئیات رفتار، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### جریان‌سازی بلوکی

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

- کانال‌های غیر Telegram برای فعال‌کردن پاسخ‌های بلوکی به `*.blockStreaming: true` صریح نیاز دارند.
- overrideهای کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های مخصوص هر حساب). Signal/Slack/Discord/Google Chat به‌طور پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = ‏800 تا 2500ms. override برای هر عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار و تکه‌بندی، [جریان‌سازی](/fa/concepts/streaming) را ببینید.

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
- overrideهای هر نشست: `session.typingMode`، `session.typingIntervalSeconds`.

[نشانگرهای تایپ](/fa/concepts/typing-indicators) را ببینید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

سندباکس اختیاری برای عامل جاسازی‌شده. برای راهنمای کامل، [سندباکسینگ](/fa/gateway/sandboxing) را ببینید.

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

**backend:**

- `docker`: runtime محلی Docker (پیش‌فرض)
- `ssh`: runtime راه‌دور عمومی با پشتوانه‌ی SSH
- `openshell`: runtime OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات مخصوص runtime به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی backend ‏SSH:**

- `target`: هدف SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه‌ی مطلق راه‌دور که برای workspaceهای هر scope استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH پاس داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefs که OpenClaw هنگام runtime به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: پیچ‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` غلبه دارد
- `certificateData` بر `certificateFile` غلبه دارد
- `knownHostsData` بر `knownHostsFile` غلبه دارد
- مقدارهای `*Data` با پشتوانه‌ی SecretRef پیش از شروع نشست sandbox از snapshot فعال runtime اسرار حل می‌شوند

**رفتار backend ‏SSH:**

- workspace راه‌دور را یک‌بار پس از ایجاد یا ایجاد دوباره seed می‌کند
- سپس workspace راه‌دور SSH را canonical نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرهای راه‌دور را به‌طور خودکار به میزبان همگام نمی‌کند
- از کانتینرهای مرورگر sandbox پشتیبانی نمی‌کند

**دسترسی workspace:**

- `none`: workspace سندباکس برای هر scope زیر `~/.openclaw/sandboxes`
- `ro`: workspace سندباکس در `/workspace`، workspace عامل به‌صورت فقط‌خواندنی در `/agent` mount شده است
- `rw`: workspace عامل به‌صورت خواندنی/نوشتنی در `/workspace` mount شده است

**scope:**

- `session`: کانتینر + workspace برای هر نشست
- `agent`: یک کانتینر + workspace برای هر عامل (پیش‌فرض)
- `shared`: کانتینر و workspace مشترک (بدون جداسازی بین نشست‌ها)

**پیکربندی Plugin ‏OpenShell:**

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

- `mirror`: پیش از اجرا، محیط راه‌دور را از محیط محلی مقداردهی اولیه می‌کند و پس از اجرا دوباره همگام‌سازی می‌کند؛ فضای کاری محلی مرجع اصلی باقی می‌ماند
- `remote`: هنگام ایجاد sandbox، محیط راه‌دور را یک‌بار مقداردهی اولیه می‌کند، سپس فضای کاری راه‌دور را مرجع اصلی نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که خارج از OpenClaw انجام می‌شوند، پس از مرحله مقداردهی اولیه به‌طور خودکار در sandbox همگام‌سازی نمی‌شوند.
انتقال از طریق SSH به sandbox مربوط به OpenShell انجام می‌شود، اما Plugin مالک چرخه عمر sandbox و همگام‌سازی اختیاری mirror است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، root قابل نوشتن، و کاربر root نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` نیز به‌طور پیش‌فرض مسدود است، مگر این‌که به‌صراحت
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` را تنظیم کنید (حالت اضطراری).
نوبت‌های سرور برنامه Codex در یک sandbox فعال OpenClaw از همین تنظیم خروجی برای دسترسی شبکه بومی حالت کد خود استفاده می‌کنند.

**پیوست‌های ورودی** در `media/inbound/*` داخل فضای کاری فعال آماده‌سازی می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان اضافی را mount می‌کند؛ bindهای سراسری و مختص عامل با هم ادغام می‌شوند.

**مرورگر sandbox‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. نشانی noVNC به system prompt تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL دارای توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای گذرواژه در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) نشست‌های sandbox‌شده را از هدف‌گیری مرورگر میزبان بازمی‌دارد.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط زمانی آن را روی `bridge` تنظیم کنید که به‌صراحت اتصال bridge سراسری می‌خواهید.
- `cdpSourceRange` به‌صورت اختیاری ورود CDP را در لبه کانتینر به یک بازه CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های میزبان اضافی را فقط داخل کانتینر مرورگر sandbox mount می‌کند. وقتی تنظیم شود (حتی `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
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
  - `--disable-extensions` (به‌طور پیش‌فرض فعال)
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu` به‌طور پیش‌فرض فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توان آن‌ها را با `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` اگر گردش‌کار شما به افزونه‌ها وابسته باشد، افزونه‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از محدودیت پیش‌فرض فرایند Chromium، مقدار `0` را تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر، از تصویر مرورگر سفارشی با entrypoint سفارشی استفاده کنید.

</Accordion>

sandbox کردن مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصویرها (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای دستورهای درون‌خطی `docker build` به [sandbox کردن § تصویرها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

### `agents.list` (بازنویسی‌های مختص عامل)

از `agents.list[].tts` استفاده کنید تا یک عامل ارائه‌دهنده TTS، صدا، مدل،
سبک، یا حالت auto-TTS مخصوص خود را داشته باشد. بلوک عامل روی
`messages.tts` سراسری به‌صورت deep-merge اعمال می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک مکان بمانند، در حالی که عامل‌های جداگانه فقط فیلدهای صدا یا ارائه‌دهنده‌ای را که نیاز دارند بازنویسی می‌کنند. بازنویسی عامل فعال برای پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و ترتیب تقدم، [تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides) را ببینید.

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

- `id`: شناسه پایدار عامل (الزامی).
- `default`: وقتی چند مورد تنظیم شده باشد، اولین مورد برنده می‌شود (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین ورودی فهرست پیش‌فرض است.
- `model`: فرم رشته‌ای یک مدل اصلی سخت‌گیرانه مختص عامل را بدون fallback مدل تنظیم می‌کند؛ فرم شیء `{ primary }` نیز سخت‌گیرانه است مگر این‌که `fallbacks` را اضافه کنید. برای فعال کردن fallback برای آن عامل از `{ primary, fallbacks: [...] }` استفاده کنید، یا برای صریح کردن رفتار سخت‌گیرانه از `{ primary, fallbacks: [] }` استفاده کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند، همچنان fallbackهای پیش‌فرض را به ارث می‌برند مگر این‌که `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای stream مختص عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های مختص عامل مانند `cacheRetention`، `temperature`، یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار مختص عامل. این بلوک روی `messages.tts` به‌صورت deep-merge اعمال می‌شود، بنابراین اعتبارنامه‌های مشترک ارائه‌دهنده و سیاست fallback را در `messages.tts` نگه دارید و اینجا فقط مقادیر مختص شخصیت مانند ارائه‌دهنده، صدا، مدل، سبک، یا حالت خودکار را تنظیم کنید.
- `skills`: فهرست مجاز اختیاری مهارت‌ها برای هر عامل. اگر حذف شود، عامل در صورت تنظیم بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند، و `[]` یعنی هیچ Skills وجود ندارد.
- `thinkingDefault`: سطح پیش‌فرض اختیاری تفکر مختص عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی مختص پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. پروفایل ارائه‌دهنده/مدل انتخاب‌شده تعیین می‌کند کدام مقادیر معتبر هستند؛ برای Google Gemini، مقدار `adaptive` تفکر پویا و تحت مالکیت ارائه‌دهنده را حفظ می‌کند (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: قابلیت مشاهده reasoning پیش‌فرض اختیاری مختص عامل (`on | off | stream`). وقتی هیچ بازنویسی reasoning مختص پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری مختص عامل برای حالت سریع (`"auto" | true | false`). وقتی هیچ بازنویسی fast-mode مختص پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `models`: بازنویسی‌های اختیاری کاتالوگ مدل/زمان اجرا مختص عامل که با شناسه‌های کامل `provider/model` کلیدگذاری شده‌اند. برای استثناهای زمان اجرای مختص عامل از `models["provider/model"].agentRuntime` استفاده کنید.
- `runtime`: توصیفگر اختیاری زمان اجرای مختص عامل. وقتی عامل باید به‌طور پیش‌فرض از نشست‌های harness مربوط به ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به فضای کاری، URL با `http(s)`، یا URI از نوع `data:`.
- فایل‌های تصویری محلی `identity.avatar` با مسیر نسبی به فضای کاری به ۲ مگابایت محدود هستند. URLهای `http(s)` و URIهای `data:` با محدودیت اندازه فایل محلی بررسی نمی‌شوند.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل پیکربندی‌شده برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هر هدف پیکربندی‌شده؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های خودهدف‌گیر `agentId` باید مجاز باشند، شناسه درخواست‌کننده را شامل کنید. ورودی‌های منسوخی که پیکربندی عامل آن‌ها حذف شده است، توسط `sessions_spawn` رد می‌شوند و از `agents_list` حذف می‌شوند؛ برای پاک‌سازی آن‌ها `openclaw doctor --fix` را اجرا کنید، یا اگر آن هدف باید هنگام به‌ارث‌بردن پیش‌فرض‌ها همچنان قابل spawn باشد، یک ورودی حداقلی `agents.list[]` اضافه کنید.
- محافظ ارث‌بری sandbox: اگر نشست درخواست‌کننده sandbox‌شده باشد، `sessions_spawn` هدف‌هایی را که بدون sandbox اجرا می‌شوند رد می‌کند.
- `subagents.requireAgentId`: وقتی true باشد، فراخوانی‌های `sessions_spawn` را که `agentId` را حذف می‌کنند مسدود می‌کند (انتخاب صریح پروفایل را اجباری می‌کند؛ پیش‌فرض: false).

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

- `type` (اختیاری): `route` برای مسیریابی عادی (type حذف‌شده به‌طور پیش‌فرض route است)، `acp` برای bindingهای گفت‌وگوی پایدار ACP.
- `match.channel` (الزامی)
- `match.accountId` (اختیاری؛ `*` = هر حساب؛ حذف‌شده = حساب پیش‌فرض)
- `match.peer` (اختیاری؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختیاری؛ مختص کانال)
- `acp` (اختیاری؛ فقط برای `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتیب تطبیق قطعی:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (دقیق، بدون peer/guild/team)
5. `match.accountId: "*"` (در سطح کانال)
6. عامل پیش‌فرض

در هر سطح، اولین ورودی مطابق در `bindings` برنده می‌شود.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) resolve می‌کند و از ترتیب سطحی route binding بالا استفاده نمی‌کند.

### پروفایل‌های دسترسی مختص عامل

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

برای جزئیات تقدم، [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) را ببینید.

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

<Accordion title="Session field details">

- **`scope`**: راهبرد پایهٔ گروه‌بندی نشست برای زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده درون یک زمینهٔ کانال، نشست جداگانه‌ای می‌گیرد.
  - `global`: همهٔ شرکت‌کنندگان در یک زمینهٔ کانال، یک نشست مشترک دارند (فقط زمانی استفاده کنید که زمینهٔ مشترک مدنظر است).
- **`dmScope`**: نحوهٔ گروه‌بندی پیام‌های خصوصی.
  - `main`: همهٔ پیام‌های خصوصی از نشست اصلی مشترک استفاده می‌کنند.
  - `per-peer`: بر اساس شناسهٔ فرستنده در سراسر کانال‌ها جدا می‌کند.
  - `per-channel-peer`: برای هر کانال + فرستنده جدا می‌کند (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: برای هر حساب + کانال + فرستنده جدا می‌کند (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: نگاشتی از شناسه‌های کانونی به همتایان دارای پیشوند ارائه‌دهنده برای اشتراک‌گذاری نشست بین کانال‌ها. فرمان‌های Dock مانند `/dock_discord` از همین نگاشت برای تغییر مسیر پاسخ نشست فعال به همتای کانال پیوندخوردهٔ دیگر استفاده می‌کنند؛ [داک کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در ساعت محلی `atHour` بازنشانی می‌کند؛ `idle` پس از `idleMinutes` بازنشانی می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بی‌کاری از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند heartbeat، بیدارباش‌های cron، اعلان‌های exec، و دفترداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بی‌کار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های جداگانه برای هر نوع (`direct`، `group`، `thread`). `dm` قدیمی به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. Runtime همیشه برای سطل اصلی گفت‌وگوی مستقیم از `"main"` استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: حداکثر نوبت‌های پاسخ برگشتی بین عامل‌ها هنگام تبادل عامل‌به‌عامل (عدد صحیح، بازه: `0`-`20`، پیش‌فرض: `5`). `0` زنجیره‌سازی پینگ‌پونگ را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. نخستین رد، برنده است.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگه‌داری مخزن نشست.
  - `mode`: `enforce` پاک‌سازی را اعمال می‌کند و پیش‌فرض است؛ `warn` فقط هشدارها را منتشر می‌کند.
  - `pruneAfter`: حد سنی برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: حداکثر تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). Runtime پاک‌سازی دسته‌ای را با یک بافر کوچک حد بالای آب برای سقف‌های اندازهٔ تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را فوراً اعمال می‌کند.
  - نشست‌های کوتاه‌عمر پروب اجرای مدل Gateway نگه‌داری ثابت `24h` دارند، اما پاک‌سازی با فشار کنترل می‌شود: فقط وقتی فشار نگه‌داری/سقف ورودی نشست به حد برسد، ردیف‌های کهنهٔ پروب اجرای مدل سخت‌گیرانه را حذف می‌کند. فقط کلیدهای پروب صریح سخت‌گیرانه که با `agent:*:explicit:model-run-<uuid>` تطبیق دارند واجد شرایط‌اند؛ نشست‌های عادی مستقیم، گروهی، رشته، cron، hook، heartbeat، ACP، و زیرعامل این نگه‌داری ۲۴ ساعته را به ارث نمی‌برند. وقتی پاک‌سازی اجرای مدل اجرا می‌شود، پیش از پاک‌سازی گسترده‌تر ورودی‌های کهنهٔ `pruneAfter` و سقف `maxEntries` اجرا می‌شود.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی حذف می‌کند.
  - `resetArchiveRetention`: نگه‌داری برای آرشیوهای رونوشت `*.reset.<timestamp>`. پیش‌فرض آن `pruneAfter` است؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
  - `maxDiskBytes`: بودجهٔ اختیاری دیسک برای پوشهٔ نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین آرتیفکت‌ها/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض آن `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های نشست وابسته به رشته.
  - `enabled`: کلید اصلی پیش‌فرض (ارائه‌دهنده‌ها می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: پیش‌فرض خروج خودکار از تمرکز بر اثر بی‌فعالیتی، بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)
  - `maxAgeHours`: پیش‌فرض حداکثر سن سخت، بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازهٔ پیش‌فرض برای ایجاد نشست‌های کاری وابسته به رشته از `sessions_spawn` و زایش‌های رشتهٔ ACP. وقتی اتصال‌های رشته فعال باشند، پیش‌فرض آن `true` است؛ ارائه‌دهنده‌ها/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینهٔ بومی پیش‌فرض زیرعامل برای زایش‌های وابسته به رشته (`"fork"` یا `"isolated"`). پیش‌فرض آن `"fork"` است.

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

### پیشوند پاسخ

بازنویسی‌های هر کانال/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

حل‌وفصل (مشخص‌ترین مورد برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و آبشار را متوقف می‌کند. `"auto"` مقدار `[{identity.name}]` را استخراج می‌کند.

**متغیرهای الگو:**

| متغیر            | توضیح                   | مثال                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل          | `claude-opus-4-6`           |
| `{modelFull}`     | شناسهٔ کامل مدل        | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده        | `anthropic`                 |
| `{thinkingLevel}` | سطح تفکر فعلی          | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل          | (همانند `"auto"`)          |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- پیش‌فرض، `identity.emoji` عامل فعال است، در غیر این صورت `"👀"`. برای غیرفعال‌سازی روی `""` تنظیم کنید.
- بازنویسی‌های هر کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل‌وفصل: حساب → کانال → `messages.ackReaction` → جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: تأیید را پس از پاسخ در کانال‌هایی که از واکنش پشتیبانی می‌کنند، مانند Slack، Discord، Signal، Telegram، WhatsApp، و iMessage حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخهٔ عمر را در Slack، Discord، Signal، Telegram، و WhatsApp فعال می‌کند.
  در Slack و Discord، تنظیم‌نشده بودن باعث می‌شود وقتی واکنش‌های تأیید فعال هستند، واکنش‌های وضعیت نیز فعال بمانند.
  در Signal، Telegram، و WhatsApp، آن را صریحاً روی `true` تنظیم کنید تا واکنش‌های وضعیت چرخهٔ عمر فعال شوند.
- `messages.statusReactions.emojis`: کلیدهای ایموجی چرخهٔ عمر را بازنویسی می‌کند:
  `queued`، `thinking`، `compacting`، `tool`، `coding`، `web`، `deploy`، `build`،
  `concierge`، `done`، `error`، `stallSoft`، و `stallHard`.
  Telegram فقط یک مجموعهٔ ثابت واکنش را مجاز می‌داند، بنابراین ایموجی پیکربندی‌شدهٔ پشتیبانی‌نشده
  به نزدیک‌ترین گونهٔ وضعیت پشتیبانی‌شده برای آن گفت‌وگو برمی‌گردد.

### debounce ورودی

پیام‌های سریع فقط‌متنی از همان فرستنده را در یک نوبت عامل واحد دسته‌بندی می‌کند. رسانه/پیوست‌ها فوراً تخلیه می‌شوند. فرمان‌های کنترلی debounce را دور می‌زنند.

### TTS (تبدیل متن به گفتار)

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

- `auto` حالت پیش‌فرض auto-TTS را کنترل می‌کند: `off`، `always`، `inbound` یا `tagged`. `/tts on|off` می‌تواند ترجیحات محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصه‌سازی خودکار بازنویسی می‌کند.
- `modelOverrides` به‌صورت پیش‌فرض فعال است؛ مقدار پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند فعال‌سازی صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` بازمی‌گردند.
- ارائه‌دهندگان گفتار همراه متعلق به Plugin هستند. اگر `plugins.allow` تنظیم شده است، هر Plugin ارائه‌دهنده TTS را که می‌خواهید استفاده کنید اضافه کنید، برای مثال `microsoft` برای Edge TTS. شناسه ارائه‌دهنده قدیمی `edge` به‌عنوان نام مستعار برای `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطه پایانی TTS مربوط به OpenAI را بازنویسی می‌کند. ترتیب حل، ابتدا پیکربندی، سپس `OPENAI_TTS_BASE_URL`، و سپس `https://api.openai.com/v1` است.
- وقتی `providers.openai.baseUrl` به یک نقطه پایانی غیر OpenAI اشاره کند، OpenClaw آن را به‌عنوان سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌گیرتر می‌کند.

---

## Talk

پیش‌فرض‌های حالت Talk (macOS/iOS/Android).

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

- وقتی چند ارائه‌دهنده Talk پیکربندی شده باشند، `talk.provider` باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی Talk (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند. `openclaw doctor --fix` را اجرا کنید تا پیکربندی ذخیره‌شده در `talk.providers.<provider>` بازنویسی شود.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` بازمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- بازگشت به `ELEVENLABS_API_KEY` فقط زمانی اعمال می‌شود که هیچ کلید API برای Talk پیکربندی نشده باشد.
- `providers.*.voiceAliases` به دستورهای Talk اجازه می‌دهد از نام‌های خوانا استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face استفاده‌شده توسط کمک‌کننده محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS، در صورت وجود، از طریق کمک‌کننده همراه `openclaw-mlx-tts` اجرا می‌شود، یا از طریق یک فایل اجرایی در `PATH`؛ `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌کننده را برای توسعه بازنویسی می‌کند.
- `consultThinkingLevel` سطح تفکر را برای اجرای کامل عامل OpenClaw در پشت فراخوانی‌های `openclaw_agent_consult` بی‌درنگ Talk در Control UI کنترل می‌کند. برای حفظ رفتار معمول نشست/مدل، آن را تنظیم‌نشده بگذارید.
- `consultFastMode` برای مشاوره‌های بی‌درنگ Talk در Control UI، بدون تغییر تنظیم عادی حالت سریع نشست، یک بازنویسی یک‌باره حالت سریع تنظیم می‌کند.
- `speechLocale` شناسه منطقه‌ای BCP 47 را که تشخیص گفتار Talk در iOS/macOS استفاده می‌کند تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت Talk پس از سکوت کاربر چه مدت منتظر بماند تا رونوشت را ارسال کند. تنظیم‌نشده گذاشتن آن، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` دستورهای سیستمی روبه‌روی ارائه‌دهنده را به اعلان بی‌درنگ داخلی OpenClaw اضافه می‌کند، تا سبک صدا بدون از دست دادن راهنمایی پیش‌فرض `openclaw_agent_consult` قابل پیکربندی باشد.
- `realtime.consultRouting` بازگشت رله Gateway را زمانی کنترل می‌کند که ارائه‌دهنده بی‌درنگ یک رونوشت نهایی کاربر را بدون `openclaw_agent_consult` تولید کند: `provider-direct` پاسخ‌های مستقیم ارائه‌دهنده را حفظ می‌کند، در حالی که `force-agent-consult` درخواست نهایی‌شده را از طریق OpenClaw مسیریابی می‌کند.

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همه کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
