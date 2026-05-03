---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و پیوندهای چندعاملی
    - تنظیم رفتار جلسه، تحویل پیام، و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-05-03T11:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b25371c34b9f8b0cacce021879e43e6a65b86d626dc87d5bfa05dcae80ac32e4
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی با دامنه عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
`messages.*` و `talk.*`. برای کانال‌ها، ابزارها، زمان اجرای Gateway و سایر
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

ریشه اختیاری مخزن که در خط Runtime اعلان سیستم نمایش داده می‌شود. اگر تنظیم نشود، OpenClaw با پیمایش رو به بالا از فضای کاری، آن را به‌صورت خودکار تشخیص می‌دهد.

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
- برای به ارث بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
- برای نداشتن Skills، مقدار `agents.list[].skills: []` را تنظیم کنید.
- فهرست غیرخالی `agents.list[].skills` مجموعه نهایی برای آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های راه‌اندازی فضای کاری (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شده فضای کاری را رد می‌کند، در حالی که همچنان فایل‌های راه‌اندازی الزامی را می‌نویسد. مقادیر معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند چه زمانی فایل‌های راه‌اندازی فضای کاری به اعلان سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامه امن (پس از پاسخ کامل‌شده دستیار) تزریق دوباره راه‌اندازی فضای کاری را رد می‌کنند و اندازه اعلان را کاهش می‌دهند. اجرای Heartbeat و تلاش‌های دوباره پس از Compaction همچنان زمینه را از نو می‌سازند.
- `"never"`: تزریق راه‌اندازی فضای کاری و فایل زمینه را در هر نوبت غیرفعال کنید. این گزینه را فقط برای عامل‌هایی استفاده کنید که چرخه عمر اعلان خود را کاملا مالکیت می‌کنند (موتورهای زمینه سفارشی، زمان‌اجراهای بومی که زمینه خودشان را می‌سازند، یا گردش‌کارهای تخصصی بدون راه‌اندازی). نوبت‌های Heartbeat و بازیابی Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

حداکثر تعداد نویسه برای هر فایل راه‌اندازی فضای کاری پیش از کوتاه‌سازی. پیش‌فرض: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده در تمام فایل‌های راه‌اندازی فضای کاری. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

متن هشدار قابل مشاهده برای عامل را هنگام کوتاه شدن زمینه راه‌اندازی کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن هشدار را به اعلان سیستم تزریق نکنید.
- `"once"`: هشدار را برای هر امضای کوتاه‌سازی یکتا یک بار تزریق کنید (توصیه‌شده).
- `"always"`: وقتی کوتاه‌سازی وجود دارد، هشدار را در هر اجرا تزریق کنید.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشه مالکیت بودجه زمینه

OpenClaw چندین بودجه اعلان/زمینه با حجم بالا دارد و آن‌ها
عمدا بر اساس زیرسامانه جدا شده‌اند، نه اینکه همگی از یک تنظیم عمومی
عبور کنند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق معمول راه‌اندازی فضای کاری.
- `agents.defaults.startupContext.*`:
  پیش‌درآمد یک‌باره اجرای مدل هنگام reset/startup، شامل فایل‌های روزانه اخیر
  `memory/*.md`. فرمان‌های گفت‌وگوی خام `/new` و `/reset`
  بدون فراخوانی مدل تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشرده Skills که به اعلان سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  گزیده‌های محدود زمان اجرا و بلوک‌های تزریق‌شده متعلق به زمان اجرا.
- `memory.qmd.limits.*`:
  اندازه‌بندی تزریق و قطعه جست‌وجوی حافظه نمایه‌شده.

فقط زمانی از override متناظر برای هر عامل استفاده کنید که یک عامل به
بودجه متفاوتی نیاز داشته باشد:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد راه‌اندازی نوبت اول را که در اجراهای مدل هنگام reset/startup تزریق می‌شود کنترل می‌کند.
فرمان‌های گفت‌وگوی خام `/new` و `/reset` بازنشانی را بدون فراخوانی
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
- `memoryGetDefaultLines`: پنجره خط پیش‌فرض `memory_get` وقتی `lines` حذف شده باشد.
- `toolResultMaxChars`: سقف زنده نتیجه ابزار که برای نتایج پایدارشده و
  بازیابی سرریز استفاده می‌شود.
- `postCompactionMaxChars`: سقف گزیده AGENTS.md که هنگام تزریق بازآوری پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

override برای هر عامل برای تنظیمات مشترک `contextLimits`. فیلدهای حذف‌شده از
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

سقف سراسری برای فهرست فشرده Skills که به اعلان سیستم تزریق می‌شود. این
بر خواندن فایل‌های `SKILL.md` بنا به درخواست تأثیری ندارد.

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

override برای هر عامل برای بودجه اعلان Skills.

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

حداکثر اندازه پیکسلی برای بلندترین ضلع تصویر در بلوک‌های تصویر transcript/tool پیش از فراخوانی provider.
پیش‌فرض: `1200`.

مقادیر کمتر معمولا مصرف توکن‌های بینایی و اندازه payload درخواست را برای اجراهای سنگین از نظر screenshot کاهش می‌دهند.
مقادیر بیشتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

منطقه زمانی برای زمینه اعلان سیستم (نه timestamp پیام‌ها). در صورت نبود، به منطقه زمانی میزبان برمی‌گردد.

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

- `model`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - شکل رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - شکل شیء، مدل اصلی را به‌همراه مدل‌های failover مرتب‌شده تنظیم می‌کند.
- `imageModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط مسیر ابزار `image` به‌عنوان پیکربندی مدل بینایی آن استفاده می‌شود.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر را بپذیرد، برای مسیریابی fallback استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های تنها برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه تنها، به‌صورت یکتا با یک ورودی پیکربندی‌شده دارای قابلیت تصویر در `models.providers.*.models` منطبق شود، OpenClaw آن را به همان ارائه‌دهنده نسبت می‌دهد. انطباق‌های پیکربندی‌شده مبهم به پیشوند صریح ارائه‌دهنده نیاز دارند.
- `imageGenerationModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده‌ای که تصویر تولید می‌کند استفاده می‌شود.
  - مقادیر معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینه شفاف OpenAI.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت ارائه‌دهنده متناظر را هم پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده‌ای دارای احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهندگان ثبت‌شده تولید تصویر را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
- `musicGenerationModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` استفاده می‌شود.
  - مقادیر معمول: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده‌ای دارای احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهندگان ثبت‌شده تولید موسیقی را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
- `videoGenerationModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط قابلیت مشترک تولید ویدیو و ابزار داخلی `video_generate` استفاده می‌شود.
  - مقادیر معمول: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده‌ای دارای احراز هویت را استنتاج کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهندگان ثبت‌شده تولید ویدیو را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
  - ارائه‌دهنده تولید ویدیوی Qwen که همراه بسته ارائه می‌شود تا ۱ ویدیوی خروجی، ۱ تصویر ورودی، ۴ ویدیوی ورودی، مدت ۱۰ ثانیه، و گزینه‌های سطح ارائه‌دهنده `size`، `aspectRatio`، `resolution`، `audio`، و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل resolved نشست/پیش‌فرض fallback می‌کند.
- `pdfMaxBytesMb`: محدودیت اندازه پیش‌فرض PDF برای ابزار `pdf` وقتی `maxBytesMb` در زمان فراخوانی پاس داده نشده باشد.
- `pdfMaxPages`: حداکثر تعداد صفحات پیش‌فرضی که حالت fallback استخراج در ابزار `pdf` در نظر می‌گیرد.
- `verboseDefault`: سطح verbose پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `reasoningDefault`: نمایانی reasoning پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"stream"`. مقدار `agents.list[].reasoningDefault` در سطح هر عامل این پیش‌فرض را بازنویسی می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای مالکان، فرستندگان مجاز، یا زمینه‌های Gateway مدیر-اپراتور اعمال می‌شوند، آن هم وقتی هیچ بازنویسی reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح خروجی elevated پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلاً `openai/gpt-5.5` برای دسترسی با کلید API یا `openai-codex/gpt-5.5` برای Codex OAuth). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس یک انطباق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل را، و فقط بعد از آن به ارائه‌دهنده پیش‌فرض پیکربندی‌شده fallback می‌کند (رفتار سازگاری منسوخ، پس `provider/model` صریح را ترجیح دهید). اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض قدیمی مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده fallback می‌کند.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میانبر) و `params` (ویژه ارائه‌دهنده، برای مثال `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های allowlist موجود را حذف کنند رد می‌کند، مگر اینکه `--replace` را پاس دهید.
  - جریان‌های پیکربندی/onboarding محدود به ارائه‌دهنده، مدل‌های انتخاب‌شده ارائه‌دهنده را در این map ادغام می‌کنند و ارائه‌دهندگان نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌صورت خودکار فعال می‌شود. برای توقف تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای بازنویسی آستانه از `params.responsesCompactThreshold` استفاده کنید. [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری ارائه‌دهنده که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلاً `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (در سطح مدل) بازنویسی می‌شود، سپس `agents.list[].params` (شناسه عامل منطبق) به‌ازای هر کلید بازنویسی می‌کند. برای جزئیات [Prompt Caching](/fa/reference/prompt-caching) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON پیشرفته pass-through که در بدنه درخواست‌های `api: "openai-completions"` برای پراکسی‌های سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده برخورد داشته باشد، extra body برنده می‌شود؛ مسیرهای completions غیربومی همچنان بعداً `store` فقط-OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه درخواست‌های سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin همراه vLLM به‌صورت خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح پیش‌فرض‌های تولیدشده را بازنویسی می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. برای کنترل‌های thinking در vLLM Qwen، در ورودی همان مدل `params.qwenThinkingFormat` را روی `"chat-template"` یا `"top-level"` تنظیم کنید.
- `compat.supportedReasoningEfforts`: فهرست تلاش reasoning سازگار با OpenAI در سطح هر مدل. برای endpointهای سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را شامل کنید؛ سپس OpenClaw در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی CLI عامل، و اعتبارسنجی `llm-task` برای همان ارائه‌دهنده/مدل پیکربندی‌شده، `/think xhigh` را نمایش می‌دهد. وقتی backend برای یک سطح canonical مقدار ویژه ارائه‌دهنده می‌خواهد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: opt-in فقط مخصوص Z.AI برای thinking حفظ‌شده. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ [thinking و thinking حفظ‌شده در Z.AI](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `agentRuntime`: سیاست پیش‌فرض runtime سطح پایین عامل. شناسه حذف‌شده به‌صورت پیش‌فرض به OpenClaw Pi تبدیل می‌شود. از `id: "pi"` برای اجبار به harness داخلی PI، از `id: "auto"` برای اینکه harnessهای Plugin ثبت‌شده مدل‌های پشتیبانی‌شده را claim کنند و وقتی هیچ‌کدام منطبق نیست از PI استفاده شود، از شناسه harness ثبت‌شده‌ای مثل `id: "codex"` برای الزام همان harness، یا از alias backend CLI پشتیبانی‌شده‌ای مثل `id: "claude-cli"` استفاده کنید. runtimeهای Plugin صریح وقتی harness در دسترس نباشد یا شکست بخورد به‌صورت fail closed عمل می‌کنند. ارجاع‌های مدل را به‌شکل canonical یعنی `provider/model` نگه دارید؛ Codex، Claude CLI، Gemini CLI، و دیگر backendهای اجرا را از طریق پیکربندی runtime انتخاب کنید، نه با پیشوندهای legacy ارائه‌دهنده runtime. برای تفاوت این مورد با انتخاب ارائه‌دهنده/مدل، [runtimeهای عامل](/fa/concepts/agent-runtimes) را ببینید.
- نویسندگان پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`، `/models set-image`، و فرمان‌های افزودن/حذف fallback) شکل canonical شیء را ذخیره می‌کنند و وقتی ممکن باشد فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجراهای موازی عامل در میان نشست‌ها (هر نشست همچنان ترتیبی اجرا می‌شود). پیش‌فرض: ۴.

### `agents.defaults.agentRuntime`

`agentRuntime` کنترل می‌کند کدام executor سطح پایین turnهای عامل را اجرا کند. بیشتر
استقرارها باید runtime پیش‌فرض OpenClaw Pi را نگه دارند. وقتی یک
Plugin مورد اعتماد یک harness بومی فراهم می‌کند، مثل harness app-server همراه Codex،
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

- `id`: `"auto"`، `"pi"`، شناسه harness یک Plugin ثبت‌شده، یا alias یک backend CLI پشتیبانی‌شده. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic backend CLI به نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` اجازه می‌دهد harnessهای Plugin ثبت‌شده turnهای پشتیبانی‌شده را claim کنند و وقتی هیچ harness منطبق نیست از PI استفاده می‌کند. runtime صریح Plugin مثل `id: "codex"` به همان harness نیاز دارد و اگر در دسترس نباشد یا شکست بخورد به‌صورت fail closed عمل می‌کند.
- بازنویسی محیطی: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` مقدار `id` را برای آن فرایند بازنویسی می‌کند.
- برای استقرارهای فقط Codex، مقدار `model: "openai/gpt-5.5"` و `agentRuntime.id: "codex"` را تنظیم کنید.
- برای استقرارهای Claude CLI، `model: "anthropic/claude-opus-4-7"` به‌همراه `agentRuntime.id: "claude-cli"` را ترجیح دهید. ارجاع‌های مدل legacy مثل `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را canonical نگه دارد و backend اجرا را در `agentRuntime.id` قرار دهد.
- کلیدهای قدیمی‌تر سیاست runtime توسط `openclaw doctor --fix` به `agentRuntime` بازنویسی می‌شوند.
- انتخاب harness بعد از اولین اجرای embedded برای هر شناسه نشست pin می‌شود. تغییرات پیکربندی/محیط روی نشست‌های جدید یا resetشده اثر می‌گذارد، نه روی transcript موجود. نشست‌های legacy که تاریخچه transcript دارند اما pin ثبت‌شده ندارند، PI-pinned در نظر گرفته می‌شوند. `/status` runtime مؤثر را گزارش می‌کند، برای مثال `Runtime: OpenClaw Pi Default` یا `Runtime: OpenAI Codex`.
- این فقط اجرای turn متنی عامل را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدیو، و TTS همچنان از تنظیمات ارائه‌دهنده/مدل خود استفاده می‌کنند.

**میانبرهای alias داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

| Alias               | مدل                                       |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

aliasهای پیکربندی‌شده شما همیشه بر پیش‌فرض‌ها مقدم‌اند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌طور پیش‌فرض `tool_stream` را برای استریم فراخوانی ابزار فعال می‌کنند. برای غیرفعال‌کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

بک‌اندهای CLI اختیاری برای اجراهای جایگزین فقط-متن (بدون فراخوانی ابزار). وقتی ارائه‌دهندگان API شکست می‌خورند، به‌عنوان پشتیبان مفید است.

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

کل پرامپت سیستم ساخته‌شده توسط OpenClaw را با یک رشته ثابت جایگزین کنید. در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقدارهای مختص عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شده پرامپت مفید است.

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

لایه‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانواده مدل اعمال می‌شوند. شناسه‌های مدل خانواده GPT-5 قرارداد رفتاری مشترک را در سراسر ارائه‌دهندگان دریافت می‌کنند؛ `personality` فقط لایه سبک تعامل دوستانه را کنترل می‌کند.

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
- `plugins.entries.openai.config.personality` قدیمی هنوز وقتی این تنظیم مشترک تنظیم نشده باشد خوانده می‌شود.

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
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستم حذف می‌کند و تزریق `HEARTBEAT.md` به زمینه راه‌اندازی اولیه را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را هنگام اجراهای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: بیشینه زمان مجاز بر حسب ثانیه برای یک نوبت عامل Heartbeat پیش از لغو آن. برای استفاده از `agents.defaults.timeoutSeconds` تنظیم‌نشده رها کنید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینه راه‌اندازی اولیه سبک استفاده می‌کنند و از میان فایل‌های راه‌اندازی اولیه فضای کاری فقط `HEARTBEAT.md` را نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه و بدون تاریخچه گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی cron با `sessionTarget: "isolated"`. هزینه توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در مسیرهای مشغول اضافی به تعویق می‌افتند: کار زیرعامل یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
- برای هر عامل: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر عاملی `heartbeat` تعریف کند، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند — فاصله‌های کوتاه‌تر توکن‌های بیشتری مصرف می‌کنند.

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
- `provider`: شناسه یک Plugin ارائه‌دهنده Compaction ثبت‌شده. وقتی تنظیم شود، به‌جای خلاصه‌سازی LLM داخلی، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به حالت داخلی بازمی‌گردد. تنظیم یک ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: بیشینه ثانیه‌های مجاز برای یک عملیات Compaction منفرد پیش از اینکه OpenClaw آن را لغو کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجه نقطه برش Pi برای نگه‌داشتن دنباله تازه‌ترین transcript به‌صورت عین‌به‌عین. `/compact` دستی وقتی صریحا تنظیم شده باشد به این احترام می‌گذارد؛ در غیر این صورت Compaction دستی یک checkpoint سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` هنگام خلاصه‌سازی Compaction، راهنمای داخلی برای حفظ شناسه‌های opaque را در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش دوباره در صورت خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌طور پیش‌فرض فعال است؛ برای ردکردن audit، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از افزوده‌شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش جاری را پیش از ارسال پرامپت لغو می‌کند و از مسیر بازیابی precheck موجود برای کوتاه‌کردن نتایج ابزار یا compact کردن و تلاش دوباره استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال‌کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا صریحا روی همان جفت پیش‌فرض تنظیم شده باشد، عنوان‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان fallback قدیمی پذیرفته می‌شوند.
- `model`: override اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه اختیاری بایت (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از اجرا Compaction محلی عادی را آغاز می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به transcript جانشین کوچک‌تری بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام آغاز و پایان Compaction اعلان‌های کوتاه به کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). به‌طور پیش‌فرض غیرفعال است تا Compaction بی‌صدا بماند.
- `memoryFlush`: نوبت عاملی بی‌صدا پیش از Compaction خودکار برای ذخیره حافظه‌های پایدار. وقتی این نوبت نگهداری باید روی یک مدل محلی بماند، `model` را روی ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این override زنجیره fallback نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

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
- `ttl` کنترل می‌کند هرس هر چند وقت یک‌بار می‌تواند دوباره اجرا شود (پس از آخرین لمس cache).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را نرم-کوتاه می‌کند، سپس در صورت نیاز نتایج ابزار قدیمی‌تر را سخت-پاک می‌کند.

**نرم-کوتاه‌کردن** ابتدا + انتها را نگه می‌دارد و در میانه `...` درج می‌کند.

**سخت-پاک‌کردن** کل نتیجه ابزار را با placeholder جایگزین می‌کند.

یادداشت‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها بر پایه نویسه هستند (تقریبی)، نه تعداد دقیق توکن.
- اگر کمتر از `keepLastAssistants` پیام assistant وجود داشته باشد، هرس رد می‌شود.

</Accordion>

برای جزئیات رفتار، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### استریمینگ بلوکی

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
- overrideهای کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های مختص هر حساب). Signal/Slack/Discord/Google Chat به‌طور پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی میان پاسخ‌های بلوکی. `natural` = 800–2500ms. override مختص عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار + قطعه‌بندی، [استریمینگ](/fa/concepts/streaming) را ببینید.

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

- پیش‌فرض‌ها: `instant` برای گفت‌وگوها/اشاره‌های مستقیم، `message` برای گفت‌وگوهای گروهی بدون اشاره.
- بازنویسی‌های هر نشست: `session.typingMode`، `session.typingIntervalSeconds`.

[نشانگرهای تایپ](/fa/concepts/typing-indicators) را ببینید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

ایزوله‌سازی اختیاری برای عامل توکار. برای راهنمای کامل، [ایزوله‌سازی](/fa/gateway/sandboxing) را ببینید.

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

- `docker`: زمان اجرای محلی Docker (پیش‌فرض)
- `ssh`: زمان اجرای راه دور عمومی مبتنی بر SSH
- `openshell`: زمان اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات ویژه زمان اجرا به
`plugins.entries.openshell.config` منتقل می‌شود.

**پیکربندی Backend SSH:**

- `target`: مقصد SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه مطلق راه دور که برای فضاهای کاری هر محدوده استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefهایی که OpenClaw هنگام اجرا به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: کنترل‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` اولویت دارد
- `certificateData` بر `certificateFile` اولویت دارد
- `knownHostsData` بر `knownHostsFile` اولویت دارد
- مقدارهای `*Data` پشتیبانی‌شده با SecretRef پیش از شروع نشست sandbox از اسنپ‌شات فعال زمان اجرای اسرار resolve می‌شوند

**رفتار Backend SSH:**

- فضای کاری راه دور را یک‌بار پس از ایجاد یا ایجاد دوباره seed می‌کند
- سپس فضای کاری SSH راه دور را مرجع نگه می‌دارد
- `exec`، ابزارهای فایل و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه دور را به‌طور خودکار به میزبان sync نمی‌کند
- از کانتینرهای مرورگر sandbox پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری sandbox هر محدوده زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری sandbox در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی روی `/agent` mount شده
- `rw`: فضای کاری عامل به‌صورت خواندنی/نوشتنی روی `/workspace` mount شده

**محدوده:**

- `session`: کانتینر + فضای کاری برای هر نشست
- `agent`: یک کانتینر + فضای کاری برای هر عامل (پیش‌فرض)
- `shared`: کانتینر و فضای کاری مشترک (بدون ایزوله‌سازی بین‌نشستی)

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

- `mirror`: پیش از exec راه دور را از محلی seed می‌کند و پس از exec به عقب sync می‌کند؛ فضای کاری محلی مرجع می‌ماند
- `remote`: هنگام ایجاد sandbox راه دور را یک‌بار seed می‌کند و سپس فضای کاری راه دور را مرجع نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که بیرون از OpenClaw انجام می‌شوند پس از مرحله seed به‌طور خودکار وارد sandbox sync نمی‌شوند.
انتقال از طریق SSH به sandbox OpenShell انجام می‌شود، اما Plugin مالک چرخه عمر sandbox و sync اختیاری mirror است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل نوشتن و کاربر root نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است، مگر اینکه صراحتا
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` را تنظیم کنید (break-glass).

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال stage می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان بیشتری را mount می‌کند؛ bindهای سراسری و هر عامل با هم ادغام می‌شوند.

**مرورگر sandbox‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL noVNC در پرامپت سیستم تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی مشاهده‌گر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای رمز عبور در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) نشست‌های sandbox‌شده را از هدف‌گیری مرورگر میزبان منع می‌کند.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط وقتی آن را روی `bridge` تنظیم کنید که صراحتا اتصال bridge سراسری می‌خواهید.
- `cdpSourceRange` به‌صورت اختیاری ورود CDP را در مرز کانتینر به یک بازه CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های میزبان بیشتری را فقط در کانتینر مرورگر sandbox mount می‌کند. وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
- پیش‌فرض‌های راه‌اندازی در `scripts/sandbox-browser-entrypoint.sh` تعریف شده‌اند و برای میزبان‌های کانتینر تنظیم شده‌اند:
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
  - `--disable-3d-apis`، `--disable-software-rasterizer` و `--disable-gpu` به‌طور پیش‌فرض
    فعال‌اند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توان آن‌ها را با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` اگر گردش کار شما به افزونه‌ها
    وابسته باشد، آن‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ `0` را برای استفاده از محدودیت
    پیش‌فرض پردازه Chromium تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها خط مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر، از یک تصویر مرورگر سفارشی با
    entrypoint سفارشی استفاده کنید.

</Accordion>

ایزوله‌سازی مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصویرها (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build` به [ایزوله‌سازی § تصویرها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

### `agents.list` (بازنویسی‌های هر عامل)

از `agents.list[].tts` استفاده کنید تا یک ارائه‌دهنده TTS، صدا، مدل،
سبک یا حالت TTS خودکار اختصاصی به عامل بدهید. بلوک عامل روی
`messages.tts` سراسری deep-merge می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک جا بمانند، در حالی که عامل‌های جداگانه
فقط فیلدهای صدا یا ارائه‌دهنده موردنیازشان را بازنویسی می‌کنند. بازنویسی عامل فعال
روی پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status` و
ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و ترتیب اولویت، [تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides)
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
- `default`: وقتی چند مورد تنظیم شده باشد، اولین مورد برنده است (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین ورودی فهرست پیش‌فرض است.
- `model`: قالب رشته‌ای یک مدل اصلی سخت‌گیرانه برای هر عامل، بدون مدل جایگزین، تنظیم می‌کند؛ قالب شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. برای وارد کردن آن عامل به جایگزینی از `{ primary, fallbacks: [...] }` استفاده کنید، یا برای صریح کردن رفتار سخت‌گیرانه از `{ primary, fallbacks: [] }` استفاده کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند همچنان جایگزین‌های پیش‌فرض را به ارث می‌برند مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان مخصوص هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های مخصوص عامل مانند `cacheRetention`، `temperature` یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده مشترک و سیاست جایگزینی را در `messages.tts` نگه دارید و اینجا فقط مقدارهای مخصوص شخصیت، مانند ارائه‌دهنده، صدا، مدل، سبک یا حالت خودکار را تنظیم کنید.
- `skills`: فهرست مجاز اختیاری Skills برای هر عامل. اگر حذف شود، عامل در صورت تنظیم بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح تفکر پیش‌فرض اختیاری برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی مخصوص پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. نمایه ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند کدام مقدارها معتبر هستند؛ برای Google Gemini، مقدار `adaptive` تفکر پویا و متعلق به ارائه‌دهنده را حفظ می‌کند (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، و `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایش پیش‌فرض اختیاری استدلال برای هر عامل (`on | off | stream`). وقتی هیچ بازنویسی استدلال مخصوص پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری حالت سریع برای هر عامل (`true | false`). وقتی هیچ بازنویسی حالت سریع مخصوص پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `agentRuntime`: بازنویسی اختیاری سیاست سطح پایین زمان اجرا برای هر عامل. از `{ id: "codex" }` استفاده کنید تا یک عامل فقط Codex باشد، در حالی‌که عامل‌های دیگر جایگزین پیش‌فرض PI را در حالت `auto` حفظ می‌کنند.
- `runtime`: توصیف‌گر اختیاری زمان اجرا برای هر عامل. وقتی عامل باید به‌صورت پیش‌فرض از نشست‌های مهار ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به فضای کاری، URL با `http(s)`، یا URI با `data:`.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` خودهدف باید مجاز باشند، شناسه درخواست‌کننده را هم وارد کنید.
- محافظ وراثت سندباکس: اگر نشست درخواست‌کننده سندباکس‌شده باشد، `sessions_spawn` هدف‌هایی را که بدون سندباکس اجرا می‌شوند رد می‌کند.
- `subagents.requireAgentId`: وقتی true باشد، فراخوانی‌های `sessions_spawn` را که `agentId` را حذف کرده‌اند مسدود می‌کند (انتخاب صریح نمایه را اجباری می‌کند؛ پیش‌فرض: false).

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

### فیلدهای تطبیق پیوند

- `type` (اختیاری): `route` برای مسیریابی عادی (نوع حذف‌شده به‌صورت پیش‌فرض route است)، `acp` برای پیوندهای مکالمه پایدار ACP.
- `match.channel` (الزامی)
- `match.accountId` (اختیاری؛ `*` = هر حساب؛ حذف‌شده = حساب پیش‌فرض)
- `match.peer` (اختیاری؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختیاری؛ مخصوص کانال)
- `acp` (اختیاری؛ فقط برای `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتیب تطبیق قطعی:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (دقیق، بدون peer/guild/team)
5. `match.accountId: "*"` (در سطح کانال)
6. عامل پیش‌فرض

در هر سطح، اولین ورودی مطابق در `bindings` برنده است.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق مکالمه (`match.channel` + حساب + `match.peer.id`) حل می‌کند و از ترتیب سطح‌های پیوند مسیر در بالا استفاده نمی‌کند.

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

برای جزئیات تقدم، [جعبه شنی و ابزارهای چندعامله](/fa/tools/multi-agent-sandbox-tools) را ببینید.

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

- **`scope`**: راهبرد پایه برای گروه‌بندی نشست در زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده درون یک زمینه کانال، یک نشست جداگانه می‌گیرد.
  - `global`: همه مشارکت‌کنندگان در یک زمینه کانال، یک نشست مشترک دارند (فقط زمانی استفاده کنید که زمینه مشترک مدنظر است).
- **`dmScope`**: شیوه گروه‌بندی پیام‌های مستقیم.
  - `main`: همه پیام‌های مستقیم، نشست اصلی را به اشتراک می‌گذارند.
  - `per-peer`: بر اساس شناسه فرستنده در همه کانال‌ها جدا می‌کند.
  - `per-channel-peer`: برای هر کانال + فرستنده جدا می‌کند (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: برای هر حساب + کانال + فرستنده جدا می‌کند (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: شناسه‌های معیار را برای اشتراک‌گذاری نشست میان‌کانالی، به همتایان دارای پیشوند ارائه‌دهنده نگاشت می‌کند. فرمان‌های Dock مانند `/dock_discord` از همان نگاشت استفاده می‌کنند تا مسیر پاسخ نشست فعال را به یک همتای کانال پیوندخورده دیگر تغییر دهند؛ [Dock کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در ساعت محلی `atHour` بازنشانی می‌کند؛ `idle` پس از `idleMinutes` بازنشانی می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بیکار از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارباش‌های Cron، اعلان‌های exec، و حسابداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بیکار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های نوع‌به‌نوع (`direct`، `group`، `thread`). `dm` قدیمی به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. زمان اجرا همیشه برای سطل اصلی گفت‌وگوی مستقیم از `"main"` استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: حداکثر نوبت‌های پاسخ رفت‌وبرگشتی بین عامل‌ها در تبادل‌های عامل‌به‌عامل (عدد صحیح، بازه: `0` تا `5`). `0` زنجیره‌سازی رفت‌وبرگشتی را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، همراه با نام مستعار قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. نخستین رد، برنده است.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگهداشت مخزن نشست.
  - `mode`: `warn` فقط هشدار منتشر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: حد سن برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: حداکثر تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). زمان اجرا برای سقف‌های اندازه تولید، پاک‌سازی دسته‌ای را با یک بافر کوچک سطح بالا می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را بلافاصله اعمال می‌کند.
  - `rotateBytes`: منسوخ و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگهداشت آرشیوهای رونوشت `*.reset.<timestamp>`. پیش‌فرض آن `pruneAfter` است؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
  - `maxDiskBytes`: بودجه اختیاری دیسک برای پوشه نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین مصنوعات/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض آن `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های نشست وابسته به رشته.
  - `enabled`: کلید پیش‌فرض اصلی (ارائه‌دهندگان می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: پیش‌فرض لغو تمرکز خودکار در صورت نبود فعالیت، بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `maxAgeHours`: پیش‌فرض حداکثر سن سخت، بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازه پیش‌فرض برای ایجاد نشست‌های کاری وابسته به رشته از `sessions_spawn` و ایجاد رشته‌های ACP. وقتی پیوندهای رشته فعال باشند، پیش‌فرض آن `true` است؛ ارائه‌دهندگان/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینه پیش‌فرض زیرعامل بومی برای ایجادهای وابسته به رشته (`"fork"` یا `"isolated"`). پیش‌فرض آن `"fork"` است.

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

نادیده‌گیری‌های هر کانال/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

ترتیب تعیین مقدار (مشخص‌ترین مورد برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و زنجیره را متوقف می‌کند. `"auto"` مقدار را از `[{identity.name}]` استخراج می‌کند.

**متغیرهای الگو:**

| متغیر             | توضیح                 | نمونه                      |
| ----------------- | --------------------- | -------------------------- |
| `{model}`         | نام کوتاه مدل         | `claude-opus-4-6`          |
| `{modelFull}`     | شناسه کامل مدل        | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده       | `anthropic`                |
| `{thinkingLevel}` | سطح فعلی تفکر         | `high`, `low`, `off`       |
| `{identity.name}` | نام هویت عامل         | (همانند `"auto"`)          |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- به‌طور پیش‌فرض از `identity.emoji` عامل فعال استفاده می‌کند، وگرنه `"👀"`. برای غیرفعال‌سازی روی `""` تنظیم کنید.
- نادیده‌گیری‌های هر کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب تعیین مقدار: حساب → کانال → `messages.ackReaction` → مقدار جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: واکنش تأیید را پس از پاسخ در کانال‌های پشتیبان واکنش مانند Slack، Discord، Telegram، WhatsApp و BlueBubbles حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخه عمر را در Slack، Discord و Telegram فعال می‌کند.
  در Slack و Discord، تنظیم‌نشدن آن وقتی واکنش‌های تأیید فعال هستند، واکنش‌های وضعیت را فعال نگه می‌دارد.
  در Telegram، برای فعال‌سازی واکنش‌های وضعیت چرخه عمر، آن را صراحتاً روی `true` تنظیم کنید.

### رفع جهش پیام‌های ورودی

پیام‌های متنی سریع از یک فرستنده را در یک نوبت واحد عامل دسته‌بندی می‌کند. رسانه/پیوست‌ها بلافاصله ارسال دسته را انجام می‌دهند. فرمان‌های کنترلی از رفع جهش عبور می‌کنند.

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

- `auto` حالت پیش‌فرض TTS خودکار را کنترل می‌کند: `off`، `always`، `inbound` یا `tagged`. `/tts on|off` می‌تواند تنظیمات محلی را نادیده بگیرد، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصه‌سازی خودکار نادیده می‌گیرد.
- `modelOverrides` به‌طور پیش‌فرض فعال است؛ مقدار پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند انتخاب صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` برمی‌گردند.
- ارائه‌دهندگان گفتار همراه، در مالکیت Plugin هستند. اگر `plugins.allow` تنظیم شده باشد، هر Plugin ارائه‌دهنده TTS را که می‌خواهید استفاده کنید اضافه کنید، برای مثال `microsoft` برای Edge TTS. شناسه ارائه‌دهنده قدیمی `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطه پایانی OpenAI TTS را نادیده می‌گیرد. ترتیب تعیین مقدار عبارت است از پیکربندی، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1`.
- وقتی `providers.openai.baseUrl` به نقطه پایانی غیر OpenAI اشاره کند، OpenClaw آن را به‌عنوان سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌تر می‌کند.

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

- `talk.provider` وقتی چند ارائه‌دهنده گفت‌وگو پیکربندی شده‌اند، باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی گفت‌وگو (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند و به‌صورت خودکار به `talk.providers.<provider>` مهاجرت داده می‌شوند.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` برمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- مقدار جایگزین `ELEVENLABS_API_KEY` فقط زمانی اعمال می‌شود که هیچ کلید API گفت‌وگو پیکربندی نشده باشد.
- `providers.*.voiceAliases` به دستورهای گفت‌وگو اجازه می‌دهد از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face مورد استفاده توسط کمک‌کننده محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS در صورت وجود از طریق کمک‌کننده همراه `openclaw-mlx-tts` اجرا می‌شود، یا از یک فایل اجرایی در `PATH`؛ `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌کننده را برای توسعه نادیده می‌گیرد.
- `speechLocale` شناسه محلی BCP 47 مورد استفاده برای تشخیص گفتار گفت‌وگوی iOS/macOS را تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت گفت‌وگو پس از سکوت کاربر چه مدت پیش از ارسال رونوشت منتظر بماند. تنظیم‌نشدن آن پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`).

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همه کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
