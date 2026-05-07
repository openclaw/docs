---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعاملی
    - تنظیم رفتار نشست، تحویل پیام و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعامله، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-05-07T13:18:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی با دامنهٔ عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
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

ریشهٔ مخزن اختیاری که در خط Runtime پرامپت سیستم نشان داده می‌شود. اگر تنظیم نشود، OpenClaw با حرکت رو به بالا از workspace آن را به‌طور خودکار تشخیص می‌دهد.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

فهرست مجاز پیش‌فرض و اختیاری Skills برای عامل‌هایی که
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

- برای نامحدود بودن Skills به‌صورت پیش‌فرض، `agents.defaults.skills` را حذف کنید.
- برای ارث‌بری پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
- برای نداشتن Skills، `agents.list[].skills: []` را تنظیم کنید.
- فهرست غیرخالی `agents.list[].skills` مجموعهٔ نهایی برای آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های bootstrap در workspace (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شدهٔ workspace را نادیده می‌گیرد، در حالی که همچنان فایل‌های bootstrap ضروری نوشته می‌شوند. مقدارهای معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند فایل‌های bootstrap workspace چه زمانی در پرامپت سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامهٔ ایمن (پس از پاسخ کامل دستیار) تزریق مجدد bootstrap مربوط به workspace را نادیده می‌گیرند و اندازهٔ پرامپت را کاهش می‌دهند. اجراهای Heartbeat و تلاش‌های دوبارهٔ پس از Compaction همچنان زمینه را بازسازی می‌کنند.
- `"never"`: تزریق bootstrap مربوط به workspace و فایل‌های زمینه را در هر نوبت غیرفعال می‌کند. این گزینه را فقط برای عامل‌هایی استفاده کنید که چرخهٔ عمر پرامپت خود را کامل در اختیار دارند (موتورهای زمینهٔ سفارشی، runtimeهای بومی که زمینهٔ خود را می‌سازند، یا workflowهای تخصصی بدون bootstrap). نوبت‌های Heartbeat و بازیابی پس از Compaction نیز تزریق را نادیده می‌گیرند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

بیشینهٔ نویسه‌ها برای هر فایل bootstrap مربوط به workspace پیش از برش. پیش‌فرض: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

بیشینهٔ مجموع نویسه‌های تزریق‌شده در همهٔ فایل‌های bootstrap مربوط به workspace. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

اعلان قابل‌مشاهده برای عامل در پرامپت سیستم را هنگام برش زمینهٔ bootstrap کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن اعلان برش را در پرامپت سیستم تزریق نکن.
- `"once"`: برای هر امضای برش یکتا، یک‌بار یک اعلان کوتاه تزریق کن (توصیه‌شده).
- `"always"`: در هر اجرا وقتی برش وجود دارد، یک اعلان کوتاه تزریق کن.

شمارش‌های خام/تزریق‌شدهٔ دقیق و فیلدهای تنظیم پیکربندی در diagnostics مانند
گزارش‌های context/status و logها باقی می‌مانند؛ زمینهٔ معمول WebChat کاربر/runtime فقط
اعلان کوتاه بازیابی را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشهٔ مالکیت بودجهٔ زمینه

OpenClaw چندین بودجهٔ پرحجم پرامپت/زمینه دارد، و این بودجه‌ها
عمداً به‌جای عبور همه‌چیز از یک تنظیم عمومی، بر اساس زیرسامانه جدا شده‌اند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق معمول bootstrap مربوط به workspace.
- `agents.defaults.startupContext.*`:
  مقدمهٔ یک‌بارهٔ اجرای مدل هنگام reset/startup، شامل فایل‌های روزانهٔ اخیر
  `memory/*.md`. دستورهای bare chat مانند `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشردهٔ Skills که در پرامپت سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  گزیده‌های محدود runtime و بلوک‌های تزریق‌شده‌ای که مالکیت آن‌ها با runtime است.
- `memory.qmd.limits.*`:
  اندازه‌بندی قطعهٔ جست‌وجوی حافظهٔ نمایه‌شده و تزریق.

فقط زمانی از override متناظر برای هر عامل استفاده کنید که یک عامل به بودجهٔ متفاوتی نیاز داشته باشد:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

مقدمهٔ startup نوبت اول را که در اجراهای مدل هنگام reset/startup تزریق می‌شود کنترل می‌کند.
دستورهای bare chat مانند `/new` و `/reset`، reset را بدون فراخوانی مدل تأیید می‌کنند،
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

پیش‌فرض‌های مشترک برای سطح‌های محدود زمینهٔ runtime.

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

- `memoryGetMaxChars`: سقف پیش‌فرض گزیدهٔ `memory_get` پیش از افزودن metadata برش
  و اعلان ادامه.
- `memoryGetDefaultLines`: پنجرهٔ خط پیش‌فرض `memory_get` وقتی `lines` حذف شده باشد.
- `toolResultMaxChars`: سقف نتیجهٔ ابزار زنده که برای نتایج پایدارشده و
  بازیابی overflow استفاده می‌شود.
- `postCompactionMaxChars`: سقف گزیدهٔ AGENTS.md که هنگام تزریق تازه‌سازی پس از Compaction
  استفاده می‌شود.

#### `agents.list[].contextLimits`

override برای هر عامل برای تنظیم‌های مشترک `contextLimits`. فیلدهای حذف‌شده
از `agents.defaults.contextLimits` ارث‌بری می‌کنند.

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

سقف سراسری برای فهرست فشردهٔ Skills که در پرامپت سیستم تزریق می‌شود. این
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

override برای هر عامل برای بودجهٔ پرامپت Skills.

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

بیشینهٔ اندازهٔ پیکسلی برای بلندترین ضلع تصویر در بلوک‌های تصویر transcript/tool پیش از فراخوانی‌های provider.
پیش‌فرض: `1200`.

مقادیر پایین‌تر معمولاً مصرف توکن‌های بینایی و اندازهٔ payload درخواست را برای اجراهای پر از screenshot کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

منطقهٔ زمانی برای زمینهٔ پرامپت سیستم (نه timestamp پیام‌ها). در صورت نبود، به منطقهٔ زمانی میزبان fallback می‌کند.

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

- `model`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - فرم رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - فرم شیء، مدل اصلی به‌همراه مدل‌های failover مرتب‌شده را تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط مسیر ابزار `image` به‌عنوان پیکربندی مدل بینایی آن استفاده می‌شود.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر را بپذیرد، برای مسیریابی fallback استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های تنها برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه تنها به‌طور یکتا با یک ورودی پیکربندی‌شده با قابلیت تصویر در `models.providers.*.models` مطابقت داشته باشد، OpenClaw آن را به آن ارائه‌دهنده نسبت می‌دهد. مطابقت‌های پیکربندی‌شده مبهم به پیشوند صریح ارائه‌دهنده نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده که تصویر تولید می‌کند استفاده می‌شود.
  - مقادیر معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینه شفاف OpenAI.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت ارائه‌دهنده منطبق را نیز پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید تصویر را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` استفاده می‌شود.
  - مقادیر معمول: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید موسیقی را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده منطبق را نیز پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید ویدئو و ابزار داخلی `video_generate` استفاده می‌شود.
  - مقادیر معمول: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده دارای احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس ارائه‌دهندگان ثبت‌شده باقی‌مانده تولید ویدئو را به‌ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده منطبق را نیز پیکربندی کنید.
  - ارائه‌دهنده تولید ویدئوی Qwen همراه‌شده، حداکثر از ۱ ویدئوی خروجی، ۱ تصویر ورودی، ۴ ویدئوی ورودی، مدت ۱۰ ثانیه، و گزینه‌های سطح ارائه‌دهنده `size`، `aspectRatio`، `resolution`، `audio` و `watermark` پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض fallback می‌کند.
- `pdfMaxBytesMb`: محدودیت پیش‌فرض اندازه PDF برای ابزار `pdf` وقتی `maxBytesMb` هنگام فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: حداکثر تعداد صفحات پیش‌فرض که در حالت fallback استخراج در ابزار `pdf` در نظر گرفته می‌شود.
- `verboseDefault`: سطح verbose پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خط‌های ابزار پیش‌نویس پیشرفت. مقادیر: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (افزودن فرمان/جزئیات خام در صورت وجود). `agents.list[].toolProgressDetail` هر عامل این پیش‌فرض را override می‌کند.
- `reasoningDefault`: نمایانی استدلال پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"stream"`. `agents.list[].reasoningDefault` هر عامل این پیش‌فرض را override می‌کند. پیش‌فرض‌های استدلال پیکربندی‌شده فقط برای مالکان، فرستندگان مجاز، یا زمینه‌های Gateway مدیر-اپراتور اعمال می‌شوند، آن هم وقتی override استدلال در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح خروجی elevated پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلاً `openai/gpt-5.5` برای دسترسی با کلید API OpenAI یا Codex OAuth). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس یک مطابقت یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه مدل دقیق، و فقط بعد از آن به ارائه‌دهنده پیش‌فرض پیکربندی‌شده fallback می‌کند (رفتار سازگاری منسوخ‌شده، پس `provider/model` صریح را ترجیح دهید). اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نشان دادن یک پیش‌فرض قدیمی مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده fallback می‌کند.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (ویژه ارائه‌دهنده، برای مثال `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های allowlist موجود را حذف کنند رد می‌کند، مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های پیکربندی/onboarding محدود به ارائه‌دهنده، مدل‌های ارائه‌دهنده انتخاب‌شده را در این نقشه merge می‌کنند و ارائه‌دهندگان نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌طور خودکار فعال است. از `params.responsesServerCompaction: false` برای متوقف کردن تزریق `context_management`، یا از `params.responsesCompactThreshold` برای override کردن آستانه استفاده کنید. [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری ارائه‌دهنده که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلاً `{ cacheRetention: "long" }`).
- تقدم merge در `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (در سطح مدل) override می‌شود، سپس `agents.list[].params` (شناسه عامل منطبق) بر اساس کلید override می‌کند. برای جزئیات [Prompt Caching](/fa/reference/prompt-caching) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON پیشرفته pass-through که در بدنه‌های درخواست `api: "openai-completions"` برای پراکسی‌های سازگار با OpenAI merge می‌شود. اگر با کلیدهای درخواست تولیدشده تداخل داشته باشد، بدنه اضافی برنده می‌شود؛ مسیرهای completions غیربومی همچنان بعداً `store` مخصوص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` merge می‌شوند. برای `vllm/nemotron-3-*` وقتی thinking خاموش است، Plugin همراه‌شده vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح، پیش‌فرض‌های تولیدشده را override می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. برای کنترل‌های thinking در vLLM Qwen، `params.qwenThinkingFormat` را روی `"chat-template"` یا `"top-level"` در آن ورودی مدل تنظیم کنید.
- `compat.supportedReasoningEfforts`: فهرست reasoning effort سازگار با OpenAI در سطح مدل. برای endpointهای سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw گزینه `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی CLI عامل، و اعتبارسنجی `llm-task` برای آن ارائه‌دهنده/مدل پیکربندی‌شده نمایش می‌دهد. وقتی backend برای یک سطح canonical به مقدار ویژه ارائه‌دهنده نیاز دارد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: opt-in فقط مخصوص Z.AI برای thinking حفظ‌شده. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ [thinking و thinking حفظ‌شده در Z.AI](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `agentRuntime`: سیاست پیش‌فرض runtime سطح پایین عامل. شناسه حذف‌شده به‌طور پیش‌فرض به OpenClaw Pi می‌رود. از `id: "pi"` برای اجبار harness داخلی PI استفاده کنید، از `id: "auto"` برای اینکه harnessهای Plugin ثبت‌شده مدل‌های پشتیبانی‌شده را claim کنند و وقتی هیچ‌کدام مطابق نبود از PI استفاده شود، از شناسه harness ثبت‌شده‌ای مثل `id: "codex"` برای الزام آن harness، یا از alias backend CLI پشتیبانی‌شده‌ای مثل `id: "claude-cli"` استفاده کنید. runtimeهای Plugin صریح وقتی harness در دسترس نباشد یا شکست بخورد fail closed می‌شوند. ارجاع‌های مدل را به‌صورت canonical یعنی `provider/model` نگه دارید؛ Codex، Claude CLI، Gemini CLI و دیگر backendهای اجرا را از طریق پیکربندی runtime انتخاب کنید، نه از طریق پیشوندهای legacy ارائه‌دهنده runtime. برای تفاوت این مورد با انتخاب ارائه‌دهنده/مدل، [runtimeهای عامل](/fa/concepts/agent-runtimes) را ببینید.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`، `/models set-image`، و فرمان‌های افزودن/حذف fallback) فرم شیء canonical را ذخیره می‌کنند و در صورت امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجراهای موازی عامل در نشست‌ها (هر نشست همچنان serialized است). پیش‌فرض: ۴.

### `agents.defaults.agentRuntime`

`agentRuntime` کنترل می‌کند کدام اجراکننده سطح پایین نوبت‌های عامل را اجرا کند. بیشتر
استقرارها باید runtime پیش‌فرض OpenClaw Pi را نگه دارند. وقتی یک Plugin مورد اعتماد
یک harness بومی ارائه می‌دهد، مثل harness app-server همراه‌شده Codex،
یا وقتی یک backend CLI پشتیبانی‌شده مثل Claude CLI می‌خواهید، از آن استفاده کنید. برای مدل ذهنی،
[runtimeهای عامل](/fa/concepts/agent-runtimes) را ببینید.

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

- `id`: `"auto"`، `"pi"`، یک شناسه harness Plugin ثبت‌شده، یا یک alias backend CLI پشتیبانی‌شده. Plugin همراه‌شده Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه‌شده Anthropic، backend CLI با نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` اجازه می‌دهد harnessهای Plugin ثبت‌شده نوبت‌های پشتیبانی‌شده را claim کنند و وقتی هیچ harnessای مطابق نباشد از PI استفاده می‌کند. یک runtime صریح Plugin مانند `id: "codex"` به آن harness نیاز دارد و اگر در دسترس نباشد یا شکست بخورد fail closed می‌شود.
- override محیطی: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` مقدار `id` را برای آن پردازه override می‌کند.
- مدل‌های عامل OpenAI به‌طور پیش‌فرض از harness Codex استفاده می‌کنند؛ وقتی می‌خواهید این را صریح کنید، `agentRuntime.id: "codex"` همچنان معتبر است.
- برای استقرارهای Claude CLI، `model: "anthropic/claude-opus-4-7"` به‌همراه `agentRuntime.id: "claude-cli"` را ترجیح دهید. ارجاع‌های مدل legacy مانند `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را canonical نگه دارد و backend اجرا را در `agentRuntime.id` قرار دهد.
- کلیدهای قدیمی‌تر سیاست runtime توسط `openclaw doctor --fix` به `agentRuntime` بازنویسی می‌شوند.
- انتخاب harness پس از اولین اجرای embedded برای هر شناسه نشست pin می‌شود. تغییرات پیکربندی/محیط روی نشست‌های جدید یا resetشده اثر می‌گذارند، نه روی transcript موجود. نشست‌های legacy OpenAI با تاریخچه transcript اما بدون pin ثبت‌شده از Codex استفاده می‌کنند؛ pinهای قدیمی OpenAI PI را می‌توان با `openclaw doctor --fix` تعمیر کرد. `/status` runtime مؤثر را گزارش می‌کند، برای مثال `Runtime: OpenClaw Pi Default` یا `Runtime: OpenAI Codex`.
- این فقط اجرای نوبت‌های عامل متنی را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدئو، و TTS همچنان از تنظیمات ارائه‌دهنده/مدل خود استفاده می‌کنند.

**میان‌برهای alias داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

| نام مستعار         | مدل                                    |
| ------------------ | -------------------------------------- |
| `opus`             | `anthropic/claude-opus-4-6`            |
| `sonnet`           | `anthropic/claude-sonnet-4-6`          |
| `gpt`              | `openai/gpt-5.5`                       |
| `gpt-mini`         | `openai/gpt-5.4-mini`                  |
| `gpt-nano`         | `openai/gpt-5.4-nano`                  |
| `gemini`           | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`     | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

aliasهای پیکربندی‌شده شما همیشه بر پیش‌فرض‌ها اولویت دارند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌صورت پیش‌فرض `tool_stream` را برای پخش جریانی فراخوانی ابزار فعال می‌کنند. برای غیرفعال‌کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌صورت پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

بک‌اندهای اختیاری CLI برای اجراهای جایگزین فقط-متن (بدون فراخوانی ابزار). وقتی ارائه‌دهندگان API شکست می‌خورند، به‌عنوان پشتیبان مفید است.

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

- بک‌اندهای CLI متن‌محور هستند؛ ابزارها همیشه غیرفعال‌اند.
- وقتی `sessionArg` تنظیم شده باشد، نشست‌ها پشتیبانی می‌شوند.
- وقتی `imageArg` مسیرهای فایل را بپذیرد، عبور مستقیم تصویر پشتیبانی می‌شود.

### `agents.defaults.systemPromptOverride`

کل پرامپت سیستم ساخته‌شده توسط OpenClaw را با یک رشته ثابت جایگزین کنید. در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقدارهای هر عامل اولویت دارند؛ مقدار خالی یا فقط شامل فضای خالی نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شده پرامپت مفید است.

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
- وقتی این تنظیم مشترک تنظیم نشده باشد، `plugins.entries.openai.config.personality` قدیمی همچنان خوانده می‌شود.

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

- `every`: رشته مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال‌کردن، آن را روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستم حذف می‌کند و تزریق `HEARTBEAT.md` به زمینه بوت‌استرپ را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را در طول اجراهای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: حداکثر زمان مجاز بر حسب ثانیه برای یک نوبت عامل Heartbeat پیش از لغو آن. برای استفاده از `agents.defaults.timeoutSeconds` آن را تنظیم‌نشده بگذارید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به هدف مستقیم را مجاز می‌کند. `block` تحویل به هدف مستقیم را سرکوب می‌کند و `reason=dm-blocked` منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینه بوت‌استرپ سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های بوت‌استرپ فضای کاری نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه بدون تاریخچه گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی cron `sessionTarget: "isolated"`. هزینه توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در مسیرهای مشغول اضافی به تعویق می‌افتند: کار زیرعامل یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را حتی بدون این پرچم به تعویق می‌اندازند.
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
- `provider`: شناسه یک Plugin ارائه‌دهنده Compaction ثبت‌شده. وقتی تنظیم شود، به‌جای خلاصه‌سازی LLM داخلی، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به حالت داخلی برمی‌گردد. تنظیم یک ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: حداکثر ثانیه‌های مجاز برای یک عملیات Compaction پیش از اینکه OpenClaw آن را لغو کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجه نقطه برش Pi برای نگه‌داشتن دم جدیدترین رونوشت به‌صورت لفظ‌به‌لفظ. `/compact` دستی وقتی صراحتا تنظیم شده باشد، این را رعایت می‌کند؛ در غیر این صورت Compaction دستی یک چک‌پوینت سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` در طول خلاصه‌سازی Compaction، راهنمایی داخلی نگهداشت شناسه‌های مات را در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش مجدد در خروجی بدفرم برای خلاصه‌های safeguard. در حالت safeguard به‌صورت پیش‌فرض فعال است؛ برای ردکردن بازرسی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از اضافه‌شدن نتایج ابزار و پیش از فراخوانی مدل بعدی، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش جاری را پیش از ارسال پرامپت لغو می‌کند و از مسیر بازیابی precheck موجود برای کوتاه‌کردن نتایج ابزار یا compact و تلاش مجدد استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های بخش H2/H3 اختیاری AGENTS.md برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال‌کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا صراحتا روی همان جفت پیش‌فرض تنظیم شده باشد، سرفصل‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان fallback قدیمی پذیرفته می‌شوند.
- `model`: بازنویسی اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه بایت اختیاری (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از اجرا Compaction محلی عادی را راه‌اندازی می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به رونوشت جانشین کوچک‌تری بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و تکمیل Compaction اعلان‌های کوتاه برای کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). برای ساکت نگه‌داشتن Compaction، به‌صورت پیش‌فرض غیرفعال است.
- `memoryFlush`: نوبت عامل خاموش پیش از Compaction خودکار برای ذخیره خاطره‌های پایدار. وقتی این نوبت نگهداری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیره fallback نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

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
- `ttl` کنترل می‌کند هرس هر چند وقت یک‌بار دوباره اجرا شود (پس از آخرین لمس cache).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را به‌صورت نرم کوتاه می‌کند، سپس در صورت نیاز نتایج ابزار قدیمی‌تر را به‌صورت سخت پاک می‌کند.

**کوتاه‌سازی نرم** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**پاک‌سازی سخت** کل نتیجه ابزار را با placeholder جایگزین می‌کند.

یادداشت‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها بر پایه نویسه‌اند (تقریبی)، نه شمارش دقیق توکن.
- اگر تعداد پیام‌های دستیار کمتر از `keepLastAssistants` باشد، هرس رد می‌شود.

</Accordion>

برای جزئیات رفتار، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### پخش جریانی بلوکی

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
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های هر حساب). Signal/Slack/Discord/Google Chat به‌صورت پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. بازنویسی برای هر عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار + قطعه‌بندی، [پخش جریانی](/fa/concepts/streaming) را ببینید.

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

[نشانگرهای تایپ](/fa/concepts/typing-indicators) را ببینید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

سندباکس اختیاری برای عامل تعبیه‌شده. برای راهنمای کامل، [سندباکس‌سازی](/fa/gateway/sandboxing) را ببینید.

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

**Backend:**

- `docker`: زمان اجرای Docker محلی (پیش‌فرض)
- `ssh`: زمان اجرای ریموت عمومی با پشتوانه SSH
- `openshell`: زمان اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات ویژه زمان اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی Backend برای SSH:**

- `target`: هدف SSH به فرم `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه ریموت مطلق که برای فضاهای کاری هر دامنه استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH پاس داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefهایی که OpenClaw هنگام اجرا در فایل‌های موقت مادی‌سازی می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: کنترل‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` اولویت دارد
- `certificateData` بر `certificateFile` اولویت دارد
- `knownHostsData` بر `knownHostsFile` اولویت دارد
- مقدارهای `*Data` با پشتوانه SecretRef پیش از شروع نشست سندباکس از اسنپ‌شات فعال زمان اجرای رازها resolve می‌شوند

**رفتار Backend برای SSH:**

- فضای کاری ریموت را یک بار پس از ایجاد یا ایجاد دوباره seed می‌کند
- سپس فضای کاری SSH ریموت را canonical نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات ریموت را به‌طور خودکار به میزبان همگام‌سازی نمی‌کند
- از کانتینرهای مرورگر سندباکس پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری سندباکس هر دامنه زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری سندباکس در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent` mount شده
- `rw`: فضای کاری عامل به‌صورت خواندن/نوشتن در `/workspace` mount شده

**دامنه:**

- `session`: کانتینر + فضای کاری برای هر نشست
- `agent`: یک کانتینر + فضای کاری برای هر عامل (پیش‌فرض)
- `shared`: کانتینر و فضای کاری مشترک (بدون ایزولاسیون بین نشست‌ها)

**پیکربندی Plugin برای OpenShell:**

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

- `mirror`: پیش از exec، ریموت را از محلی seed می‌کند و پس از exec به عقب همگام‌سازی می‌کند؛ فضای کاری محلی canonical می‌ماند
- `remote`: هنگام ایجاد سندباکس، ریموت را یک بار seed می‌کند و سپس فضای کاری ریموت را canonical نگه می‌دارد

در حالت `remote`، ویرایش‌های محلیِ میزبان که خارج از OpenClaw انجام می‌شوند پس از مرحله seed به‌طور خودکار به سندباکس همگام‌سازی نمی‌شوند.
انتقال از طریق SSH به سندباکس OpenShell است، اما Plugin مالک چرخه عمر سندباکس و همگام‌سازی اختیاری mirror است.

**`setupCommand`** پس از ایجاد کانتینر یک بار اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل نوشتن، و کاربر root نیاز دارد.

**کانتینرها به‌صورت پیش‌فرض `network: "none"` هستند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌صورت پیش‌فرض مسدود است مگر اینکه صراحتا
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (حالت اضطراری) را تنظیم کنید.

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال stage می‌شوند.

**`docker.binds`** دایرکتوری‌های اضافی میزبان را mount می‌کند؛ bindهای سراسری و هر عامل با هم ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL مربوط به noVNC در system prompt تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌صورت پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای اینکه گذرواژه را در URL مشترک افشا کند).

- `allowHostControl: false` (پیش‌فرض) نشست‌های سندباکس‌شده را از هدف‌گیری مرورگر میزبان بازمی‌دارد.
- `network` به‌صورت پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط زمانی آن را روی `bridge` بگذارید که صراحتا اتصال bridge سراسری می‌خواهید.
- `cdpSourceRange` به‌صورت اختیاری ورود CDP را در لبه کانتینر به یک محدوده CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های اضافی میزبان را فقط در کانتینر مرورگر سندباکس mount می‌کند. وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
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
  - `--disable-extensions` (به‌صورت پیش‌فرض فعال است)
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu` به‌صورت
    پیش‌فرض فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توان آن‌ها را با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - اگر گردش کار شما به افزونه‌ها وابسته است، `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` افزونه‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از حد فرایند
    پیش‌فرض Chromium، مقدار `0` را تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها baseline تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر از یک تصویر مرورگر سفارشی با entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکس‌سازی مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصویرها (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build`، [سندباکس‌سازی § تصویرها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) را ببینید.

### `agents.list` (بازنویسی‌های هر عامل)

از `agents.list[].tts` استفاده کنید تا به یک عامل ارائه‌دهنده TTS، صدا، مدل،
سبک، یا حالت TTS خودکار اختصاصی بدهید. بلوک عامل روی
`messages.tts` سراسری deep-merge می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک محل بمانند در حالی که عامل‌های منفرد فقط فیلدهای صدا یا ارائه‌دهنده‌ای را که نیاز دارند بازنویسی کنند. بازنویسی عامل فعال روی پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و
ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و اولویت‌ها، [تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides)
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

- `id`: شناسه پایدار عامل (الزامی).
- `default`: وقتی چند مورد تنظیم شده باشد، اولین مورد برنده است (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین مدخل فهرست پیش‌فرض است.
- `model`: شکل رشته‌ای، یک مدل اصلی سخت‌گیرانه برای هر عامل تنظیم می‌کند، بدون جایگزین مدل؛ شکل آبجکت `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. از `{ primary, fallbacks: [...] }` استفاده کنید تا آن عامل را وارد استفاده از جایگزین کنید، یا از `{ primary, fallbacks: [] }` استفاده کنید تا رفتار سخت‌گیرانه را صریح کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند همچنان جایگزین‌های پیش‌فرض را به ارث می‌برند مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان برای هر عامل که روی مدخل مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های ویژه عامل مانند `cacheRetention`، `temperature` یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، پس اعتبارنامه‌های ارائه‌دهنده مشترک و سیاست جایگزین را در `messages.tts` نگه دارید و اینجا فقط مقدارهای ویژه شخصیت مانند ارائه‌دهنده، صدا، مدل، سبک یا حالت خودکار را تنظیم کنید.
- `skills`: فهرست مجاز اختیاری Skills برای هر عامل. اگر حذف شود، عامل در صورت تنظیم بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح پیش‌فرض اختیاری تفکر برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. نمایه ارائه‌دهنده/مدل انتخاب‌شده تعیین می‌کند کدام مقدارها معتبر هستند؛ برای Google Gemini، `adaptive` تفکر پویای تحت مالکیت ارائه‌دهنده را نگه می‌دارد (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی پیش‌فرض اختیاری استدلال برای هر عامل (`on | off | stream`). وقتی هیچ بازنویسی استدلال برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری برای هر عامل در حالت سریع (`true | false`). وقتی هیچ بازنویسی حالت سریع برای هر پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `agentRuntime`: بازنویسی اختیاری سیاست زمان اجرای سطح پایین برای هر عامل. از `{ id: "codex" }` استفاده کنید تا یک عامل فقط Codex باشد، در حالی که عامل‌های دیگر جایگزین پیش‌فرض PI را در حالت `auto` نگه می‌دارند.
- `runtime`: توصیف‌گر اختیاری زمان اجرا برای هر عامل. وقتی عامل باید به‌طور پیش‌فرض از نشست‌های هارنس ACP استفاده کند، از `type: "acp"` با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به فضای کاری، URL از نوع `http(s)`، یا URI از نوع `data:`.
- `identity` پیش‌فرض‌ها را استخراج می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های خودهدف‌گیر `agentId` باید مجاز باشند، شناسه درخواست‌کننده را شامل کنید.
- محافظ وراثت سندباکس: اگر نشست درخواست‌کننده سندباکس‌شده باشد، `sessions_spawn` هدف‌هایی را که بدون سندباکس اجرا می‌شوند رد می‌کند.
- `subagents.requireAgentId`: وقتی true باشد، فراخوانی‌های `sessions_spawn` را که `agentId` را حذف می‌کنند مسدود می‌کند (انتخاب صریح نمایه را اجباری می‌کند؛ پیش‌فرض: false).

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

- `type` (اختیاری): `route` برای مسیریابی عادی (type حذف‌شده به‌طور پیش‌فرض route است)، `acp` برای bindingهای پایدار گفت‌وگوی ACP.
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
5. `match.accountId: "*"` (در سطح کانال)
6. عامل پیش‌فرض

در هر سطح، اولین مدخل مطابق در `bindings` برنده است.

برای مدخل‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) حل می‌کند و از ترتیب سطح‌های binding مسیر در بالا استفاده نمی‌کند.

### نمایه‌های دسترسی برای هر عامل

<Accordion title="دسترسی کامل (بدون سندباکس)">

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

<Accordion title="ابزارهای فقط‌خواندنی + فضای کاری">

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

<Accordion title="دسترسی نداشتن به فایل‌سیستم (فقط پیام‌رسانی)">

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

<Accordion title="جزئیات فیلدهای نشست">

- **`scope`**: راهبرد پایه برای گروه‌بندی نشست‌ها در زمینه‌های گپ گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده درون زمینه یک کانال، یک نشست جداگانه می‌گیرد.
  - `global`: همه شرکت‌کنندگان در زمینه یک کانال، یک نشست مشترک دارند (فقط وقتی استفاده کنید که زمینه مشترک مدنظر باشد).
- **`dmScope`**: شیوه گروه‌بندی پیام‌های مستقیم.
  - `main`: همه پیام‌های مستقیم از نشست اصلی مشترک استفاده می‌کنند.
  - `per-peer`: بر اساس شناسه فرستنده در همه کانال‌ها جدا می‌کند.
  - `per-channel-peer`: برای هر کانال + فرستنده جدا می‌کند (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: برای هر حساب + کانال + فرستنده جدا می‌کند (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: شناسه‌های canonical را برای اشتراک نشست میان کانال‌ها به همتایان دارای پیشوند provider نگاشت می‌کند. فرمان‌های dock مانند `/dock_discord` از همین نگاشت استفاده می‌کنند تا مسیر پاسخ نشست فعال را به همتای کانال پیوندخورده دیگری تغییر دهند؛ [داک‌کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در زمان محلی `atHour` بازنشانی می‌کند؛ `idle` پس از `idleMinutes` بازنشانی می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود برنده است. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بی‌کاری از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویدادهای سیستمی مانند Heartbeat، بیدارباش‌های Cron، اعلان‌های exec و دفترداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بی‌کار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های مخصوص هر نوع (`direct`، `group`، `thread`). `dm` قدیمی به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. runtime همیشه از `"main"` برای مخزن اصلی گپ مستقیم استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینه نوبت‌های پاسخ‌وبرگشت بین عامل‌ها هنگام تبادل عامل‌به‌عامل (عدد صحیح، بازه: `0` تا `5`). `0` زنجیره‌سازی پینگ‌پنگ را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix` یا `rawKeyPrefix`. نخستین منع برنده است.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگهداشت مخزن نشست.
  - `mode`: مقدار `warn` فقط هشدار صادر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: آستانه سنی برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: بیشینه تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). runtime پاک‌سازی دسته‌ای را با یک بافر کوچک سطح بالا برای سقف‌های در اندازه تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را بلافاصله اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگهداشت بایگانی‌های رونوشت `*.reset.<timestamp>`. به‌طور پیش‌فرض برابر `pruneAfter` است؛ برای غیرفعال‌سازی روی `false` بگذارید.
  - `maxDiskBytes`: بودجه اختیاری دیسک برای پوشه نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین artifactها/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. به‌طور پیش‌فرض `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای ویژگی‌های نشست وابسته به thread.
  - `enabled`: سوییچ پیش‌فرض اصلی (providerها می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: auto-unfocus پیش‌فرض هنگام بی‌کاری، بر حسب ساعت (`0` غیرفعال می‌کند؛ providerها می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینه سن سخت پیش‌فرض، بر حسب ساعت (`0` غیرفعال می‌کند؛ providerها می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازه پیش‌فرض برای ساخت نشست‌های کاری وابسته به thread از `sessions_spawn` و spawnهای thread در ACP. وقتی پیوندهای thread فعال باشند، پیش‌فرض `true` است؛ providerها/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینه subagent بومی پیش‌فرض برای spawnهای وابسته به thread (`"fork"` یا `"isolated"`). پیش‌فرض `"fork"` است.

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

بازنویسی‌های مخصوص هر کانال/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

تفکیک (خاص‌ترین مورد برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و آبشار را متوقف می‌کند. `"auto"` مقدار `[{identity.name}]` را استخراج می‌کند.

**متغیرهای قالب:**

| متغیر             | توضیح                 | مثال                        |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل         | `claude-opus-4-6`           |
| `{modelFull}`     | شناسه کامل مدل        | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده       | `anthropic`                 |
| `{thinkingLevel}` | سطح تفکر فعلی         | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل         | (همانند `"auto"`)           |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید دریافت

- به‌طور پیش‌فرض از `identity.emoji` عامل فعال استفاده می‌کند، وگرنه `"👀"`. برای غیرفعال کردن، `""` را تنظیم کنید.
- بازنویسی‌های مخصوص هر کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب تفکیک: حساب → کانال → `messages.ackReaction` → جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: تأیید دریافت را پس از پاسخ در کانال‌های دارای قابلیت واکنش مانند Slack، Discord، Telegram، WhatsApp و BlueBubbles حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخه عمر را در Slack، Discord و Telegram فعال می‌کند.
  در Slack و Discord، تنظیم‌نشدن آن واکنش‌های وضعیت را زمانی که واکنش‌های تأیید دریافت فعال هستند، فعال نگه می‌دارد.
  در Telegram، آن را صراحتاً روی `true` تنظیم کنید تا واکنش‌های وضعیت چرخه عمر فعال شوند.

### دیبانس ورودی

پیام‌های متنی سریع و پشت‌سرهم از همان فرستنده را در یک نوبت عامل واحد دسته‌بندی می‌کند. رسانه/پیوست‌ها بلافاصله صف را تخلیه می‌کنند. فرمان‌های کنترلی دیبانس را دور می‌زنند.

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
- `modelOverrides` به‌طور پیش‌فرض فعال است؛ مقدار پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند انتخاب صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` بازمی‌گردند.
- ارائه‌دهندگان گفتار همراه، متعلق به Plugin هستند. اگر `plugins.allow` تنظیم شده است، هر Plugin ارائه‌دهنده TTS را که می‌خواهید استفاده کنید وارد کنید، برای مثال `microsoft` برای TTS در Edge. شناسه ارائه‌دهنده قدیمی `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطه پایانی TTS مربوط به OpenAI را بازنویسی می‌کند. ترتیب تفکیک ابتدا پیکربندی، سپس `OPENAI_TTS_BASE_URL`، و سپس `https://api.openai.com/v1` است.
- وقتی `providers.openai.baseUrl` به یک نقطه پایانی غیر OpenAI اشاره کند، OpenClaw آن را به‌عنوان سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌گیرانه‌تر می‌کند.

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

- وقتی چند ارائه‌دهنده گفت‌وگو پیکربندی شده‌اند، `talk.provider` باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی گفت‌وگو (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند. `openclaw doctor --fix` را اجرا کنید تا پیکربندی ذخیره‌شده به `talk.providers.<provider>` بازنویسی شود.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` بازمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- بازگشت به `ELEVENLABS_API_KEY` فقط زمانی اعمال می‌شود که هیچ کلید API برای گفت‌وگو پیکربندی نشده باشد.
- `providers.*.voiceAliases` به دستورهای گفت‌وگو امکان می‌دهد از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face مورد استفاده دستیار محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS از طریق دستیار همراه `openclaw-mlx-tts` در صورت وجود، یا یک فایل اجرایی در `PATH` اجرا می‌شود؛ `OPENCLAW_MLX_TTS_BIN` مسیر دستیار را برای توسعه بازنویسی می‌کند.
- `speechLocale` شناسه محلی BCP 47 مورد استفاده تشخیص گفتار گفت‌وگو در iOS/macOS را تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت گفت‌وگو پس از سکوت کاربر چه مدت منتظر بماند قبل از اینکه رونوشت را ارسال کند. تنظیم‌نشدن آن پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`).

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همه کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
