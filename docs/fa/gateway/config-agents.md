---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و پیوندهای چندعامله
    - تنظیم رفتار نشست، تحویل پیام، و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-05-02T11:44:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559bb427555768c91720bac10ee60bf2ba5a081117b741a02c140b14267ce1bf
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی در محدوده عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
`messages.*` و `talk.*`. برای کانال‌ها، ابزارها، زمان اجرای Gateway، و سایر
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

ریشه مخزن اختیاری که در خط Runtime پرامپت سیستم نمایش داده می‌شود. اگر تنظیم نشده باشد، OpenClaw با پیمایش رو به بالا از فضای کاری، آن را به‌طور خودکار شناسایی می‌کند.

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
- برای نداشتن Skills، مقدار `agents.list[].skills: []` را تنظیم کنید.
- فهرست غیرخالی `agents.list[].skills` مجموعه نهایی آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های بوت‌استرپ فضای کاری (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شده فضای کاری را رد می‌کند، در حالی که همچنان فایل‌های بوت‌استرپ الزامی را می‌نویسد. مقادیر معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند چه زمانی فایل‌های بوت‌استرپ فضای کاری به پرامپت سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامه امن (پس از پاسخ کامل‌شده دستیار) تزریق دوباره بوت‌استرپ فضای کاری را رد می‌کنند و اندازه پرامپت را کاهش می‌دهند. اجراهای Heartbeat و تلاش‌های دوباره پس از Compaction همچنان زمینه را بازسازی می‌کنند.
- `"never"`: تزریق بوت‌استرپ فضای کاری و فایل زمینه را در هر نوبت غیرفعال می‌کند. این گزینه را فقط برای عامل‌هایی استفاده کنید که مالک کامل چرخه عمر پرامپت خود هستند (موتورهای زمینه سفارشی، زمان‌های اجرای بومی که زمینه خودشان را می‌سازند، یا گردش‌کارهای تخصصی بدون بوت‌استرپ). نوبت‌های Heartbeat و بازیابی از Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

حداکثر نویسه‌ها برای هر فایل بوت‌استرپ فضای کاری پیش از کوتاه‌سازی. پیش‌فرض: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده در همه فایل‌های بوت‌استرپ فضای کاری. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

متن هشدار قابل مشاهده برای عامل را هنگام کوتاه شدن زمینه بوت‌استرپ کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن هشدار را به پرامپت سیستم تزریق نکن.
- `"once"`: هشدار را یک بار برای هر امضای کوتاه‌سازی یکتا تزریق کن (توصیه می‌شود).
- `"always"`: وقتی کوتاه‌سازی وجود دارد، هشدار را در هر اجرا تزریق کن.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشه مالکیت بودجه زمینه

OpenClaw چندین بودجه پرحجم برای پرامپت/زمینه دارد، و این بودجه‌ها
عمداً به‌جای عبور همگی از یک کنترل عمومی، بر اساس زیرسامانه تفکیک شده‌اند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق عادی بوت‌استرپ فضای کاری.
- `agents.defaults.startupContext.*`:
  مقدمه یک‌باره اجرای مدل هنگام بازنشانی/راه‌اندازی، شامل فایل‌های روزانه اخیر
  `memory/*.md`. دستورهای چت ساده `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشرده Skills که به پرامپت سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  گزیده‌های محدود زمان اجرا و بلوک‌های تزریق‌شده متعلق به زمان اجرا.
- `memory.qmd.limits.*`:
  اندازه‌گذاری قطعه جست‌وجوی حافظه نمایه‌شده و تزریق.

فقط وقتی یک عامل به بودجه متفاوتی نیاز دارد، از بازنویسی متناظر برای هر عامل استفاده کنید:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

مقدمه راه‌اندازی نوبت اول را که در اجراهای مدل هنگام بازنشانی/راه‌اندازی تزریق می‌شود کنترل می‌کند.
دستورهای چت ساده `/new` و `/reset` بازنشانی را بدون فراخوانی مدل تأیید می‌کنند،
بنابراین این مقدمه را بارگذاری نمی‌کنند.

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
- `memoryGetDefaultLines`: پنجره خط پیش‌فرض `memory_get` وقتی `lines` حذف
  شده باشد.
- `toolResultMaxChars`: سقف نتیجه ابزار زنده که برای نتایج پایدارشده و
  بازیابی سرریز استفاده می‌شود.
- `postCompactionMaxChars`: سقف گزیده AGENTS.md که هنگام تزریق نوسازی
  پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

بازنویسی هر عامل برای کنترل‌های مشترک `contextLimits`. فیلدهای حذف‌شده از
`agents.defaults.contextLimits` به ارث برده می‌شوند.

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

سقف سراسری برای فهرست فشرده Skills که به پرامپت سیستم تزریق می‌شود. این
بر خواندن فایل‌های `SKILL.md` در صورت نیاز اثر نمی‌گذارد.

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

بازنویسی هر عامل برای بودجه پرامپت Skills.

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

حداکثر اندازه پیکسلی برای بلندترین ضلع تصویر در بلوک‌های تصویر رونوشت/ابزار پیش از فراخوانی ارائه‌دهنده.
پیش‌فرض: `1200`.

مقادیر پایین‌تر معمولاً مصرف توکن بینایی و اندازه بار درخواست را برای اجراهای پر از اسکرین‌شات کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

منطقه زمانی برای زمینه پرامپت سیستم (نه برچسب‌های زمانی پیام). در نبود مقدار، به منطقه زمانی میزبان بازمی‌گردد.

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

- `model`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - فرم رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - فرم شیء، مدل اصلی را به‌همراه مدل‌های جایگزین ترتیبی برای خطایابی تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - مسیر ابزار `image` از آن به‌عنوان پیکربندی مدل بینایی استفاده می‌کند.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر را بپذیرد، برای مسیریابی جایگزین استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های تنها برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه تنها به‌طور یکتا با یک ورودی پیکربندی‌شده و پشتیبان تصویر در `models.providers.*.models` مطابقت داشته باشد، OpenClaw آن را به همان ارائه‌دهنده وابسته می‌کند. تطابق‌های پیکربندی‌شده مبهم به پیشوند صریح ارائه‌دهنده نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده‌ای که تصویر تولید کند از آن استفاده می‌کند.
  - مقدارهای رایج: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini،‏ `fal/fal-ai/flux/dev` برای fal،‏ `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP شفاف OpenAI.
  - اگر یک ارائه‌دهنده/مدل را مستقیم انتخاب می‌کنید، احراز هویت ارائه‌دهنده متناظر را هم پیکربندی کنید (برای نمونه `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`،‏ `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`،‏ `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهندگان ثبت‌شده تولید تصویر را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` از آن استفاده می‌کنند.
  - مقدارهای رایج: `google/lyria-3-clip-preview`،‏ `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهندگان ثبت‌شده تولید موسیقی را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر یک ارائه‌دهنده/مدل را مستقیم انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - قابلیت مشترک تولید ویدئو و ابزار داخلی `video_generate` از آن استفاده می‌کنند.
  - مقدارهای رایج: `qwen/wan2.6-t2v`،‏ `qwen/wan2.6-i2v`،‏ `qwen/wan2.6-r2v`،‏ `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهندگان ثبت‌شده تولید ویدئو را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر یک ارائه‌دهنده/مدل را مستقیم انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
  - ارائه‌دهنده تولید ویدئوی Qwen همراه، تا 1 ویدئوی خروجی، 1 تصویر ورودی، 4 ویدئوی ورودی، مدت 10 ثانیه، و گزینه‌های سطح ارائه‌دهنده `size`،‏ `aspectRatio`،‏ `resolution`،‏ `audio` و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - ابزار `pdf` از آن برای مسیریابی مدل استفاده می‌کند.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل جلسه/پیش‌فرض حل‌شده برمی‌گردد.
- `pdfMaxBytesMb`: حد اندازه پیش‌فرض PDF برای ابزار `pdf` وقتی `maxBytesMb` هنگام فراخوانی پاس داده نشده باشد.
- `pdfMaxPages`: بیشینه صفحات پیش‌فرضی که حالت جایگزین استخراج در ابزار `pdf` در نظر می‌گیرد.
- `verboseDefault`: سطح verbose پیش‌فرض برای عامل‌ها. مقدارها: `"off"`،‏ `"on"`،‏ `"full"`. پیش‌فرض: `"off"`.
- `reasoningDefault`: نمایانی استدلال پیش‌فرض برای عامل‌ها. مقدارها: `"off"`،‏ `"on"`،‏ `"stream"`. مقدار `agents.list[].reasoningDefault` برای هر عامل این پیش‌فرض را بازنویسی می‌کند. پیش‌فرض‌های استدلال پیکربندی‌شده فقط برای مالکان، فرستندگان مجاز، یا زمینه‌های Gateway مدیر-اپراتور اعمال می‌شوند، آن هم وقتی هیچ بازنویسی استدلال برای هر پیام یا جلسه تنظیم نشده باشد.
- `elevatedDefault`: سطح خروجی elevated پیش‌فرض برای عامل‌ها. مقدارها: `"off"`،‏ `"on"`،‏ `"ask"`،‏ `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلاً `openai/gpt-5.5` برای دسترسی با کلید API یا `openai-codex/gpt-5.5` برای Codex OAuth). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل را، و فقط پس از آن به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد (رفتار سازگاری منسوخ، پس ارجاع صریح `provider/model` را ترجیح دهید). اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش پیش‌فرض قدیمیِ ارائه‌دهنده حذف‌شده، به نخستین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
- `models`: کاتالوگ مدل پیکربندی‌شده و فهرست مجاز برای `/model`. هر ورودی می‌تواند شامل `alias` (میانبر) و `params` (ویژه ارائه‌دهنده، برای نمونه `temperature`،‏ `maxTokens`،‏ `cacheRetention`،‏ `context1m`،‏ `responsesServerCompaction`،‏ `responsesCompactThreshold`،‏ `chat_template_kwargs`،‏ `extra_body`/`extraBody`) باشد.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های موجود فهرست مجاز را حذف کنند، رد می‌کند مگر اینکه `--replace` را پاس دهید.
  - جریان‌های پیکربندی/راه‌اندازی محدود به ارائه‌دهنده، مدل‌های ارائه‌دهنده انتخاب‌شده را در این نگاشت ادغام می‌کنند و ارائه‌دهندگان نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses،‏ Compaction سمت سرور به‌طور خودکار فعال می‌شود. برای توقف تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای بازنویسی آستانه از `params.responsesCompactThreshold` استفاده کنید. [OpenAI server-side compaction](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری ارائه‌دهنده که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم کنید (مثلاً `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (برای هر مدل) بازنویسی می‌شود، سپس `agents.list[].params` (شناسه عامل متناظر) به‌ازای هر کلید بازنویسی می‌کند. برای جزئیات [Prompt Caching](/fa/reference/prompt-caching) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON عبوری پیشرفته که در بدنه درخواست‌های `api: "openai-completions"` برای پراکسی‌های سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده تداخل داشته باشد، بدنه اضافی برنده می‌شود؛ مسیرهای completions غیربومی همچنان پس از آن `store` مخصوص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های قالب گفت‌وگوی سازگار با vLLM/OpenAI که در سطح بالای بدنه درخواست‌های `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin همراه vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح پیش‌فرض‌های تولیدشده را بازنویسی می‌کند و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. برای کنترل‌های thinking در vLLM Qwen، مقدار `params.qwenThinkingFormat` را روی `"chat-template"` یا `"top-level"` در همان ورودی مدل تنظیم کنید.
- `compat.supportedReasoningEfforts`: فهرست effort استدلال سازگار با OpenAI برای هر مدل. برای endpointهای سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw مقدار `/think xhigh` را در منوهای فرمان، ردیف‌های جلسه Gateway، اعتبارسنجی patch جلسه، اعتبارسنجی CLI عامل، و اعتبارسنجی `llm-task` برای آن ارائه‌دهنده/مدل پیکربندی‌شده نمایش می‌دهد. وقتی backend برای یک سطح استاندارد مقدار ویژه ارائه‌دهنده می‌خواهد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: انتخاب اختیاری فقط برای Z.AI جهت حفظ thinking. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ [Z.AI thinking and preserved thinking](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `agentRuntime`: سیاست پیش‌فرض سطح پایین زمان اجرای عامل. شناسه حذف‌شده به‌طور پیش‌فرض OpenClaw Pi است. از `id: "pi"` برای اجبار harness داخلی PI، از `id: "auto"` برای اینکه harnessهای Plugin ثبت‌شده مدل‌های پشتیبانی‌شده را claim کنند، از یک شناسه harness ثبت‌شده مانند `id: "codex"`، یا از یک نام مستعار backend پشتیبانی‌شده CLI مانند `id: "claude-cli"` استفاده کنید. برای غیرفعال کردن fallback خودکار PI مقدار `fallback: "none"` را تنظیم کنید. زمان‌های اجرای صریح Plugin مانند `codex` به‌طور پیش‌فرض fail-closed هستند، مگر اینکه در همان scope بازنویسی مقدار `fallback: "pi"` را تنظیم کنید. ارجاع‌های مدل را به‌شکل استاندارد `provider/model` نگه دارید؛ Codex،‏ Claude CLI،‏ Gemini CLI و backendهای اجرایی دیگر را از طریق پیکربندی runtime انتخاب کنید، نه از طریق پیشوندهای قدیمی ارائه‌دهنده runtime. برای تفاوت این مورد با انتخاب ارائه‌دهنده/مدل، [Agent runtimes](/fa/concepts/agent-runtimes) را ببینید.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای نمونه `/models set`،‏ `/models set-image`، و فرمان‌های افزودن/حذف fallback) فرم شیء استاندارد را ذخیره می‌کنند و تا حد امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: بیشینه اجرای موازی عامل‌ها در سراسر جلسه‌ها (هر جلسه همچنان به‌صورت سری اجرا می‌شود). پیش‌فرض: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` کنترل می‌کند کدام اجراکننده سطح پایین نوبت‌های عامل را اجرا کند. بیشتر
استقرارها باید runtime پیش‌فرض OpenClaw Pi را نگه دارند. وقتی یک Plugin مورد اعتماد
یک harness بومی فراهم می‌کند، مانند harness app-server همراه Codex،
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

- `id`:‏ `"auto"`،‏ `"pi"`، یک شناسه harness ثبت‌شده Plugin، یا یک نام مستعار backend پشتیبانی‌شده CLI. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic،‏ backend‏ CLI با نام `claude-cli` را فراهم می‌کند.
- `fallback`:‏ `"pi"` یا `"none"`. در `id: "auto"`، مقدار fallback حذف‌شده به‌طور پیش‌فرض `"pi"` است تا پیکربندی‌های قدیمی وقتی هیچ harness‏ Plugin اجرای موردی را claim نمی‌کند، همچنان بتوانند از PI استفاده کنند. در حالت runtime صریح Plugin، مانند `id: "codex"`، مقدار fallback حذف‌شده به‌طور پیش‌فرض `"none"` است تا harness گمشده به‌جای استفاده بی‌صدا از PI شکست بخورد. بازنویسی‌های runtime، fallback را از scope گسترده‌تر به ارث نمی‌برند؛ وقتی عمداً آن fallback سازگاری را می‌خواهید، `fallback: "pi"` را کنار runtime صریح تنظیم کنید. شکست‌های harness انتخاب‌شده Plugin همیشه مستقیم نمایش داده می‌شوند.
- بازنویسی‌های محیط: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` مقدار `id` را بازنویسی می‌کند؛ `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` مقدار fallback را برای همان فرایند بازنویسی می‌کند.
- برای استقرارهای فقط Codex، مقدار `model: "openai/gpt-5.5"` و `agentRuntime.id: "codex"` را تنظیم کنید. همچنین می‌توانید برای خوانایی، `agentRuntime.fallback: "none"` را صریح تنظیم کنید؛ این مقدار برای runtimeهای صریح Plugin پیش‌فرض است.
- برای استقرارهای Claude CLI،‏ `model: "anthropic/claude-opus-4-7"` به‌همراه `agentRuntime.id: "claude-cli"` را ترجیح دهید. ارجاع‌های مدل قدیمی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را استاندارد نگه دارد و backend اجرایی را در `agentRuntime.id` قرار دهد.
- کلیدهای قدیمی‌تر سیاست runtime توسط `openclaw doctor --fix` به `agentRuntime` بازنویسی می‌شوند.
- انتخاب harness پس از نخستین اجرای embedded برای هر شناسه جلسه pin می‌شود. تغییرات پیکربندی/محیط روی جلسه‌های جدید یا reset‌شده اثر می‌گذارند، نه روی transcript موجود. جلسه‌های قدیمی با تاریخچه transcript اما بدون pin ثبت‌شده، به‌عنوان pin‌شده به PI در نظر گرفته می‌شوند. `/status` runtime مؤثر را گزارش می‌کند، برای مثال `Runtime: OpenClaw Pi Default` یا `Runtime: OpenAI Codex`.
- این فقط اجرای نوبت‌های متنی عامل را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدئو و TTS همچنان از تنظیمات ارائه‌دهنده/مدل خود استفاده می‌کنند.

**میانبرهای نام مستعار داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

| نام مستعار          | مدل                                        |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

نام‌های مستعار پیکربندی‌شده‌ی شما همیشه بر پیش‌فرض‌ها اولویت دارند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI برای استریم فراخوانی ابزار، به‌طور پیش‌فرض `tool_stream` را فعال می‌کنند. برای غیرفعال‌کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

پشتانه‌های اختیاری CLI برای اجراهای بازگشتی فقط‌متنی (بدون فراخوانی ابزار). وقتی ارائه‌دهندگان API شکست می‌خورند، به‌عنوان پشتیبان مفید است.

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
- وقتی `imageArg` مسیرهای فایل را بپذیرد، عبوردهی تصویر پشتیبانی می‌شود.

### `agents.defaults.systemPromptOverride`

کل پرامپت سیستمی ساخته‌شده توسط OpenClaw را با یک رشته‌ی ثابت جایگزین کنید. در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقادیر مخصوص عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شده‌ی پرامپت مفید است.

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

لایه‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانواده‌ی مدل اعمال می‌شوند. شناسه‌های مدل خانواده‌ی GPT-5 قرارداد رفتاری مشترک را در سراسر ارائه‌دهندگان دریافت می‌کنند؛ `personality` فقط لایه‌ی سبک تعامل دوستانه را کنترل می‌کند.

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

- `"friendly"` (پیش‌فرض) و `"on"` لایه‌ی سبک تعامل دوستانه را فعال می‌کنند.
- `"off"` فقط لایه‌ی دوستانه را غیرفعال می‌کند؛ قرارداد رفتاری GPT-5 برچسب‌خورده همچنان فعال می‌ماند.
- وقتی این تنظیم مشترک تنظیم نشده باشد، `plugins.entries.openai.config.personality` قدیمی همچنان خوانده می‌شود.

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

- `every`: رشته‌ی مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال‌کردن، روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستمی حذف می‌کند و تزریق `HEARTBEAT.md` به زمینه‌ی راه‌اندازی اولیه را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را هنگام اجرای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: حداکثر زمان مجاز بر حسب ثانیه برای نوبت عامل Heartbeat پیش از لغو آن. برای استفاده از `agents.defaults.timeoutSeconds`، آن را تنظیم‌نشده رها کنید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` را منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجرای Heartbeat از زمینه‌ی سبک راه‌اندازی اولیه استفاده می‌کند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی اولیه‌ی workspace نگه می‌دارد.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه و بدون تاریخچه‌ی گفت‌وگوی قبلی اجرا می‌شود. همان الگوی ایزوله‌سازی cron `sessionTarget: "isolated"`. هزینه‌ی توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجرای Heartbeat در مسیرهای مشغول اضافی به تعویق می‌افتد: کار subagent یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
- برای هر عامل: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر عاملی `heartbeat` را تعریف کند، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند — بازه‌های کوتاه‌تر توکن بیشتری مصرف می‌کنند.

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

- `mode`: `default` یا `safeguard` (خلاصه‌سازی قطعه‌ای برای تاریخچه‌های طولانی). [Compaction](/fa/concepts/compaction) را ببینید.
- `provider`: شناسه‌ی Plugin ارائه‌دهنده‌ی Compaction ثبت‌شده. وقتی تنظیم شود، به‌جای خلاصه‌سازی LLM داخلی، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به حالت داخلی بازمی‌گردد. تنظیم ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: حداکثر ثانیه‌های مجاز برای یک عملیات Compaction پیش از آنکه OpenClaw آن را لغو کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجه‌ی نقطه‌ی برش Pi برای نگه‌داشتن انتهای جدیدتر رونوشت به‌صورت عین‌به‌عین. `/compact` دستی وقتی صریحاً تنظیم شده باشد، آن را رعایت می‌کند؛ در غیر این صورت Compaction دستی یک نقطه‌ی وارسی سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` هنگام خلاصه‌سازی Compaction، راهنمای داخلی نگه‌داری شناسه‌های مبهم را در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه‌ها که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش دوباره هنگام خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌طور پیش‌فرض فعال است؛ برای رد کردن ممیزی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه‌ی ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از افزوده‌شدن نتایج ابزار و پیش از فراخوانی مدل بعدی، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش فعلی را پیش از ارسال پرامپت لغو می‌کند و برای کوتاه‌کردن نتایج ابزار یا انجام Compaction و تلاش دوباره، از مسیر بازیابی precheck موجود استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. مقدار پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال‌کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا صریحاً روی همان جفت پیش‌فرض تنظیم شده باشد، عنوان‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان fallback قدیمی پذیرفته می‌شوند.
- `model`: بازنویسی اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه‌ی بایتی اختیاری (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از اجرا Compaction محلی معمولی را آغاز می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به رونوشت جانشین کوچک‌تری بچرخد. وقتی تنظیم نشده باشد یا `0` باشد، غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و تکمیل Compaction اعلان‌های کوتاه برای کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). به‌طور پیش‌فرض غیرفعال است تا Compaction بی‌صدا بماند.
- `memoryFlush`: نوبت عامل‌محور بی‌صدا پیش از Compaction خودکار برای ذخیره‌ی حافظه‌های پایدار. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیره‌ی fallback نشست فعال را به ارث نمی‌برد. وقتی workspace فقط‌خواندنی باشد، رد می‌شود.

### `agents.defaults.contextPruning`

**نتایج قدیمی ابزار** را پیش از ارسال به LLM از زمینه‌ی درون‌حافظه‌ای هرس می‌کند. تاریخچه‌ی نشست روی دیسک را **تغییر نمی‌دهد**.

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
- `ttl` کنترل می‌کند هرس هر چند وقت یک‌بار می‌تواند دوباره اجرا شود (پس از آخرین تماس cache).
- هرس ابتدا نتایج بیش‌ازحد بزرگ ابزار را نرم‌کوتاه می‌کند، سپس در صورت نیاز نتایج قدیمی‌تر ابزار را سخت‌پاک می‌کند.

**نرم‌کوتاه‌کردن** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**سخت‌پاک‌کردن** کل نتیجه‌ی ابزار را با placeholder جایگزین می‌کند.

یادداشت‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها مبتنی بر نویسه‌اند (تقریبی)، نه شمارش دقیق توکن.
- اگر کمتر از `keepLastAssistants` پیام assistant وجود داشته باشد، هرس رد می‌شود.

</Accordion>

برای جزئیات رفتار، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### استریم بلوکی

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

- کانال‌های غیر از Telegram برای فعال کردن پاسخ‌های بلوکی به `*.blockStreaming: true` صریح نیاز دارند.
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های هر حساب). Signal/Slack/Discord/Google Chat به‌طور پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. بازنویسی برای هر عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار + قطعه‌بندی، [Streaming](/fa/concepts/streaming) را ببینید.

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

- پیش‌فرض‌ها: `instant` برای چت‌های مستقیم/اشاره‌ها، `message` برای چت‌های گروهی بدون اشاره.
- بازنویسی‌های هر نشست: `session.typingMode`، `session.typingIntervalSeconds`.

[Typing Indicators](/fa/concepts/typing-indicators) را ببینید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

سندباکس اختیاری برای عامل جاسازی‌شده. برای راهنمای کامل، [Sandboxing](/fa/gateway/sandboxing) را ببینید.

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

- `docker`: زمان‌اجرای Docker محلی (پیش‌فرض)
- `ssh`: زمان‌اجرای راه دور عمومی مبتنی بر SSH
- `openshell`: زمان‌اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شده باشد، تنظیمات ویژه زمان‌اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی Backend SSH:**

- `target`: مقصد SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه مطلق راه دور که برای فضاهای کاری هر دامنه استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتواهای درون‌خطی یا SecretRefهایی که OpenClaw در زمان اجرا به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: کنترل‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` اولویت دارد
- `certificateData` بر `certificateFile` اولویت دارد
- `knownHostsData` بر `knownHostsFile` اولویت دارد
- مقدارهای `*Data` مبتنی بر SecretRef پیش از شروع نشست سندباکس از اسنپ‌شات فعال زمان‌اجرای اسرار حل می‌شوند

**رفتار Backend SSH:**

- پس از ایجاد یا بازایجاد، فضای کاری راه دور را یک‌بار مقداردهی اولیه می‌کند
- سپس فضای کاری SSH راه دور را مرجع اصلی نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه دور را به‌طور خودکار به میزبان همگام‌سازی نمی‌کند
- از کانتینرهای مرورگر سندباکس پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری سندباکس برای هر دامنه زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری سندباکس در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent` mount می‌شود
- `rw`: فضای کاری عامل به‌صورت خواندنی/نوشتنی در `/workspace` mount می‌شود

**دامنه:**

- `session`: کانتینر + فضای کاری برای هر نشست
- `agent`: یک کانتینر + فضای کاری برای هر عامل (پیش‌فرض)
- `shared`: کانتینر و فضای کاری مشترک (بدون جداسازی بین نشست‌ها)

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

- `mirror`: پیش از exec راه دور را از محلی مقداردهی اولیه می‌کند و پس از exec به عقب همگام‌سازی می‌کند؛ فضای کاری محلی مرجع اصلی می‌ماند
- `remote`: هنگام ایجاد سندباکس، راه دور را یک‌بار مقداردهی اولیه می‌کند و سپس فضای کاری راه دور را مرجع اصلی نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که بیرون از OpenClaw انجام می‌شوند پس از مرحله مقداردهی اولیه به‌طور خودکار به سندباکس همگام‌سازی نمی‌شوند.
انتقال از طریق SSH به سندباکس OpenShell انجام می‌شود، اما Plugin مالک چرخه عمر سندباکس و همگام‌سازی آینه‌ای اختیاری است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل‌نوشتن، و کاربر root نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است مگر اینکه صریحاً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` را تنظیم کنید (حالت اضطراری).

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال آماده‌سازی می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان اضافی را mount می‌کند؛ bindهای سراسری و هر عامل با هم ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL noVNC به system prompt تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای رمز عبور در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) نشست‌های سندباکس‌شده را از هدف‌گیری مرورگر میزبان مسدود می‌کند.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط وقتی آن را روی `bridge` تنظیم کنید که صریحاً اتصال bridge سراسری می‌خواهید.
- `cdpSourceRange` به‌صورت اختیاری ورود CDP را در لبه کانتینر به یک بازه CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` فقط دایرکتوری‌های میزبان اضافی را در کانتینر مرورگر سندباکس mount می‌کند. وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
- پیش‌فرض‌های اجرا در `scripts/sandbox-browser-entrypoint.sh` تعریف شده‌اند و برای میزبان‌های کانتینری تنظیم شده‌اند:
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
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu` به‌طور
    پیش‌فرض فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توانند با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال شوند.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` اگر گردش کار شما به افزونه‌ها
    وابسته باشد، افزونه‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از حد پیش‌فرض فرایند Chromium مقدار `0` را تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها خط مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر، از یک تصویر مرورگر سفارشی با entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکس مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصویرها (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build`، [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) را ببینید.

### `agents.list` (بازنویسی‌های هر عامل)

از `agents.list[].tts` استفاده کنید تا به یک عامل ارائه‌دهنده TTS، صدا، مدل،
سبک، یا حالت TTS خودکار خودش را بدهید. بلوک عامل روی
`messages.tts` سراسری به‌صورت deep-merge ادغام می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک مکان بمانند در حالی که عامل‌های جداگانه
فقط فیلدهای صدا یا ارائه‌دهنده مورد نیازشان را بازنویسی می‌کنند. بازنویسی عامل فعال
روی پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و
ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و اولویت، [Text-to-speech](/fa/tools/tts#per-agent-voice-overrides)
را ببینید.

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
- `default`: وقتی چند مورد تنظیم شده باشند، اولین مورد برنده می‌شود (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین ورودی فهرست پیش‌فرض است.
- `model`: شکل رشته‌ای، یک مدل اصلی سخت‌گیرانه برای هر عامل بدون جایگزین مدل تنظیم می‌کند؛ شکل شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. از `{ primary, fallbacks: [...] }` استفاده کنید تا آن عامل از جایگزین استفاده کند، یا از `{ primary, fallbacks: [] }` استفاده کنید تا رفتار سخت‌گیرانه را صریح کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند همچنان جایگزین‌های پیش‌فرض را به ارث می‌برند، مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان برای هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های ویژه عامل مثل `cacheRetention`، `temperature`، یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده مشترک و سیاست جایگزین را در `messages.tts` نگه دارید و فقط مقادیر ویژه شخصیت مانند ارائه‌دهنده، صدا، مدل، سبک، یا حالت خودکار را اینجا تنظیم کنید.
- `skills`: فهرست مجاز اختیاری Skill برای هر عامل. اگر حذف شود، عامل در صورت تنظیم بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح تفکر پیش‌فرض اختیاری برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. پروفایل ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند کدام مقادیر معتبر هستند؛ برای Google Gemini، مقدار `adaptive` تفکر پویا تحت مالکیت ارائه‌دهنده را حفظ می‌کند (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، و `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایش پیش‌فرض اختیاری reasoning برای هر عامل (`on | off | stream`). وقتی هیچ بازنویسی reasoning برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری برای حالت سریع برای هر عامل (`true | false`). وقتی هیچ بازنویسی حالت سریع برای هر پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `agentRuntime`: بازنویسی اختیاری سیاست runtime سطح پایین برای هر عامل. از `{ id: "codex" }` استفاده کنید تا یک عامل فقط Codex باشد، در حالی که عامل‌های دیگر fallback پیش‌فرض PI را در حالت `auto` حفظ کنند.
- `runtime`: توصیف‌گر اختیاری runtime برای هر عامل. وقتی عامل باید به‌صورت پیش‌فرض از نشست‌های چارچوب ACP استفاده کند، از `type: "acp"` با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به workspace، URL از نوع `http(s)`، یا URI از نوع `data:`.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای مقصدهای صریح `sessions_spawn.agentId` (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` با مقصد خود عامل باید مجاز باشند، شناسه درخواست‌دهنده را اضافه کنید.
- محافظ ارث‌بری sandbox: اگر نشست درخواست‌دهنده sandbox شده باشد، `sessions_spawn` مقصدهایی را که بدون sandbox اجرا می‌شوند رد می‌کند.
- `subagents.requireAgentId`: وقتی true باشد، فراخوانی‌های `sessions_spawn` که `agentId` را حذف کنند مسدود می‌شوند (انتخاب صریح پروفایل را اجباری می‌کند؛ پیش‌فرض: false).

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

- `type` (اختیاری): `route` برای مسیریابی عادی (نوع حذف‌شده به‌صورت پیش‌فرض route است)، `acp` برای bindingهای مکالمه پایدار ACP.
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
5. `match.accountId: "*"` (در سراسر کانال)
6. عامل پیش‌فرض

در هر سطح، اولین ورودی مطابق در `bindings` برنده می‌شود.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق مکالمه (`match.channel` + account + `match.peer.id`) resolve می‌کند و از ترتیب سطحی binding مسیر در بالا استفاده نمی‌کند.

### پروفایل‌های دسترسی برای هر عامل

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

برای جزئیات تقدم، [Sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) را ببینید.

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

- **`scope`**: راهبرد پایهٔ گروه‌بندی نشست برای زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده درون زمینهٔ یک کانال، نشست جداگانه‌ای می‌گیرد.
  - `global`: همهٔ شرکت‌کنندگان در زمینهٔ یک کانال، یک نشست مشترک دارند (فقط وقتی استفاده کنید که زمینهٔ مشترک مدنظر است).
- **`dmScope`**: نحوهٔ گروه‌بندی پیام‌های مستقیم.
  - `main`: همهٔ پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند.
  - `per-peer`: جداسازی بر اساس شناسهٔ فرستنده در همهٔ کانال‌ها.
  - `per-channel-peer`: جداسازی به‌ازای کانال + فرستنده (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: جداسازی به‌ازای حساب + کانال + فرستنده (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: نگاشت شناسه‌های متعارف به همتایان دارای پیشوند ارائه‌دهنده برای اشتراک‌گذاری نشست بین کانال‌ها. فرمان‌های داک مانند `/dock_discord` از همین نگاشت استفاده می‌کنند تا مسیر پاسخ نشست فعال را به همتای کانال لینک‌شدهٔ دیگری تغییر دهند؛ [داک کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در ساعت محلی `atHour` بازنشانی می‌کند؛ `idle` پس از `idleMinutes` بازنشانی می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بیکاری از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارباش‌های Cron، اعلان‌های exec، و حسابداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بیکاری را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های به‌ازای نوع (`direct`، `group`، `thread`). مقدار قدیمی `dm` به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. زمان اجرا همیشه از `"main"` برای سطل اصلی گفت‌وگوی مستقیم استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینهٔ نوبت‌های پاسخ‌رفت‌وبرگشت بین عامل‌ها در تبادل‌های عامل‌به‌عامل (عدد صحیح، بازه: `0` تا `5`). `0` زنجیره‌سازی پینگ‌پنگ را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. نخستین ردکردن برنده است.
- **`maintenance`**: پاک‌سازی انبارهٔ نشست + کنترل‌های نگه‌داری.
  - `mode`: مقدار `warn` فقط هشدارها را منتشر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: آستانهٔ سن برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: بیشینهٔ تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). زمان اجرا پاک‌سازی دسته‌ای را با یک بافر کوچک سقف بالا برای محدودیت‌های اندازهٔ تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` این سقف را بلافاصله اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگه‌داری بایگانی‌های رونوشت `*.reset.<timestamp>`. پیش‌فرض آن `pruneAfter` است؛ برای غیرفعال‌سازی روی `false` بگذارید.
  - `maxDiskBytes`: بودجهٔ اختیاری دیسک برای پوشهٔ نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین مصنوعات/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض آن `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های نشست وابسته به رشته.
  - `enabled`: کلید اصلی پیش‌فرض (ارائه‌دهندگان می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: خروج خودکار از تمرکز پس از بی‌فعالیتی به ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینهٔ سن سخت‌گیرانهٔ پیش‌فرض به ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازهٔ پیش‌فرض برای ایجاد نشست‌های کاری وابسته به رشته از `sessions_spawn` و اسپاون‌های رشتهٔ ACP. وقتی اتصال‌های رشته فعال باشند پیش‌فرض آن `true` است؛ ارائه‌دهندگان/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینهٔ پیش‌فرض زیرعامل بومی برای اسپاون‌های وابسته به رشته (`"fork"` یا `"isolated"`). پیش‌فرض آن `"fork"` است.

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

حل‌وفصل (خاص‌ترین مورد برنده است): حساب ← کانال ← سراسری. `""` غیرفعال می‌کند و زنجیرهٔ ارث‌بری را متوقف می‌کند. `"auto"` از `[{identity.name}]` مشتق می‌شود.

**متغیرهای قالب:**

| متغیر             | توضیح                  | مثال                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل          | `claude-opus-4-6`           |
| `{modelFull}`     | شناسهٔ کامل مدل        | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده        | `anthropic`                 |
| `{thinkingLevel}` | سطح تفکر فعلی          | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل          | (همانند `"auto"`)           |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- پیش‌فرض روی `identity.emoji` عامل فعال است، وگرنه `"👀"`. برای غیرفعال‌سازی روی `""` بگذارید.
- بازنویسی‌های به‌ازای کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل‌وفصل: حساب ← کانال ← `messages.ackReaction` ← جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: پس از پاسخ، تأیید را در کانال‌هایی که از واکنش پشتیبانی می‌کنند، مانند Slack، Discord، Telegram، WhatsApp، و BlueBubbles حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخهٔ حیات را در Slack، Discord، و Telegram فعال می‌کند.
  در Slack و Discord، تنظیم‌نشدن آن وقتی واکنش‌های تأیید فعال باشند، واکنش‌های وضعیت را فعال نگه می‌دارد.
  در Telegram، برای فعال‌سازی واکنش‌های وضعیت چرخهٔ حیات، آن را صراحتاً روی `true` بگذارید.

### دیبانس ورودی

پیام‌های سریع فقط‌متنی از همان فرستنده را در یک نوبت عامل دسته‌بندی می‌کند. رسانه/پیوست‌ها فوراً تخلیه می‌شوند. فرمان‌های کنترلی از دیبانس عبور می‌کنند.

### TTS (متن به گفتار)

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
- `modelOverrides` به‌طور پیش‌فرض فعال است؛ پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند اعلام صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` بازمی‌گردند.
- ارائه‌دهندگان گفتار همراه، تحت مالکیت Plugin هستند. اگر `plugins.allow` تنظیم شده باشد، هر Plugin ارائه‌دهندهٔ TTS را که می‌خواهید استفاده کنید وارد کنید، برای مثال `microsoft` برای Edge TTS. شناسهٔ ارائه‌دهندهٔ قدیمی `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطهٔ پایانی OpenAI TTS را بازنویسی می‌کند. ترتیب حل‌وفصل، ابتدا پیکربندی، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1` است.
- وقتی `providers.openai.baseUrl` به نقطهٔ پایانی غیر OpenAI اشاره کند، OpenClaw آن را به‌عنوان سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌گیرتر می‌کند.

---

## گفت‌وگو

پیش‌فرض‌های حالت گفت‌وگو (macOS/iOS/Android).

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

- `talk.provider` وقتی چند ارائه‌دهندهٔ گفت‌وگو پیکربندی شده باشند، باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی گفت‌وگو (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند و به‌طور خودکار به `talk.providers.<provider>` مهاجرت داده می‌شوند.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` بازمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- جایگزین `ELEVENLABS_API_KEY` فقط وقتی اعمال می‌شود که هیچ کلید API گفت‌وگویی پیکربندی نشده باشد.
- `providers.*.voiceAliases` اجازه می‌دهد دستورهای گفت‌وگو از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face مورد استفادهٔ کمک‌کار محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS از طریق کمک‌کار همراه `openclaw-mlx-tts` در صورت وجود، یا یک فایل اجرایی روی `PATH` اجرا می‌شود؛ `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌کار را برای توسعه بازنویسی می‌کند.
- `speechLocale` شناسهٔ locale در قالب BCP 47 را که تشخیص گفتار گفت‌وگوی iOS/macOS استفاده می‌کند تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند که حالت گفت‌وگو پس از سکوت کاربر چه مدت صبر کند پیش از آنکه رونوشت را ارسال کند. تنظیم‌نشدن آن پنجرهٔ مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms در macOS و Android، 900 ms در iOS`).

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همهٔ کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
