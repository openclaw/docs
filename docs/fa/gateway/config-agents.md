---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعاملی
    - تنظیم رفتار نشست، تحویل پیام و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها، و پیکربندی گفتگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-04-30T16:28:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6a38f42c35c6c6e46d6d00ad710c6c80d78703e0b7e3388f5631cf91eb17084
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی با دامنه عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
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

ریشه مخزن اختیاری که در خط Runtime پرامپت سیستم نمایش داده می‌شود. اگر تنظیم نشده باشد، OpenClaw با پیمایش رو به بالا از فضای کاری آن را خودکار تشخیص می‌دهد.

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
- برای نداشتن Skills، `agents.list[].skills: []` را تنظیم کنید.
- یک فهرست غیرخالی `agents.list[].skills` مجموعه نهایی برای آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ساخت خودکار فایل‌های بوت‌استرپ فضای کاری (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

کنترل می‌کند فایل‌های بوت‌استرپ فضای کاری چه زمانی در پرامپت سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامه امن (پس از پاسخ تکمیل‌شده دستیار) تزریق دوباره بوت‌استرپ فضای کاری را رد می‌کنند و اندازه پرامپت را کاهش می‌دهند. اجراهای Heartbeat و تلاش‌های مجدد پس از Compaction همچنان زمینه را بازسازی می‌کنند.
- `"never"`: بوت‌استرپ فضای کاری و تزریق فایل زمینه را در هر نوبت غیرفعال می‌کند. این را فقط برای عامل‌هایی استفاده کنید که چرخه عمر پرامپت خود را کاملاً مالک هستند (موتورهای زمینه سفارشی، زمان‌های اجرای بومی که زمینه خودشان را می‌سازند، یا گردش‌کارهای تخصصی بدون بوت‌استرپ). نوبت‌های Heartbeat و بازیابی Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

حداکثر نویسه برای هر فایل بوت‌استرپ فضای کاری پیش از کوتاه‌سازی. پیش‌فرض: `12000`.

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

- `"off"`: هرگز متن هشدار را در پرامپت سیستم تزریق نکن.
- `"once"`: برای هر امضای کوتاه‌سازی یکتا، هشدار را یک‌بار تزریق کن (توصیه‌شده).
- `"always"`: هر بار که کوتاه‌سازی وجود دارد، هشدار را در هر اجرا تزریق کن.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشه مالکیت بودجه زمینه

OpenClaw چندین بودجه پرحجم پرامپت/زمینه دارد و آن‌ها به‌عمد بر اساس زیرسامانه
جدا شده‌اند، نه اینکه همگی از یک تنظیم عمومی عبور کنند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق عادی بوت‌استرپ فضای کاری.
- `agents.defaults.startupContext.*`:
  پیش‌درآمد یک‌باره اجرای مدل هنگام بازنشانی/شروع، شامل فایل‌های روزانه اخیر
  `memory/*.md`. فرمان‌های گفت‌وگوی ساده `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشرده Skills که در پرامپت سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  بریده‌های محدود زمان اجرا و بلوک‌های تزریق‌شده تحت مالکیت زمان اجرا.
- `memory.qmd.limits.*`:
  قطعه جست‌وجوی حافظه نمایه‌شده و اندازه‌گذاری تزریق.

فقط وقتی یک عامل به بودجه متفاوتی نیاز دارد، از بازنویسی متناظر برای هر عامل
استفاده کنید:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد شروع نوبت اول را که در اجراهای مدل هنگام بازنشانی/شروع تزریق می‌شود کنترل می‌کند.
فرمان‌های گفت‌وگوی ساده `/new` و `/reset` بازنشانی را بدون فراخوانی مدل تأیید
می‌کنند، بنابراین این پیش‌درآمد را بارگذاری نمی‌کنند.

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

- `memoryGetMaxChars`: سقف پیش‌فرض بریده `memory_get` پیش از افزودن
  فراداده کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجره خط پیش‌فرض `memory_get` وقتی `lines` حذف
  شده باشد.
- `toolResultMaxChars`: سقف نتیجه ابزار زنده که برای نتایج ماندگارشده و
  بازیابی سرریز استفاده می‌شود.
- `postCompactionMaxChars`: سقف بریده AGENTS.md که هنگام تزریق تازه‌سازی
  پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

بازنویسی برای هر عامل برای تنظیم‌های مشترک `contextLimits`. فیلدهای حذف‌شده از
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

سقف سراسری برای فهرست فشرده Skills که در پرامپت سیستم تزریق می‌شود. این
روی خواندن فایل‌های `SKILL.md` در صورت نیاز اثری ندارد.

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

حداکثر اندازه پیکسلی برای بلندترین ضلع تصویر در بلوک‌های تصویر رونوشت/ابزار پیش از فراخوانی‌های ارائه‌دهنده.
پیش‌فرض: `1200`.

مقادیر پایین‌تر معمولاً مصرف توکن‌های بینایی و اندازه بار درخواست را برای اجراهای سنگینِ اسکرین‌شات کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

منطقه زمانی برای زمینه پرامپت سیستم (نه مهرزمان‌های پیام). در صورت نبود، به منطقه زمانی میزبان برمی‌گردد.

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

- `model`: یا یک رشته (`"provider/model"`) را می‌پذیرد یا یک شیء (`{ primary, fallbacks }`).
  - فرم رشته فقط مدل اصلی را تنظیم می‌کند.
  - فرم شیء، مدل اصلی به‌علاوه مدل‌های failover مرتب‌شده را تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) را می‌پذیرد یا یک شیء (`{ primary, fallbacks }`).
  - توسط مسیر ابزار `image` به‌عنوان پیکربندی مدل بینایی آن استفاده می‌شود.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر را بپذیرد، برای مسیریابی fallback استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های تنها برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه تنها به‌طور یکتا با یک ورودی پیکربندی‌شده دارای قابلیت تصویر در `models.providers.*.models` مطابقت داشته باشد، OpenClaw آن را به آن provider منتسب می‌کند. مطابقت‌های پیکربندی‌شده مبهم به پیشوند صریح provider نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) را می‌پذیرد یا یک شیء (`{ primary, fallbacks }`).
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده‌ای که تصویر تولید می‌کند استفاده می‌شود.
  - مقادیر معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی OpenAI PNG/WebP با پس‌زمینه شفاف.
  - اگر مستقیما یک provider/model را انتخاب می‌کنید، احراز هویت provider متناظر را نیز پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض provider پشتیبانی‌شده با احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید تصویر را به ترتیب شناسه provider امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) را می‌پذیرد یا یک شیء (`{ primary, fallbacks }`).
  - توسط قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` استفاده می‌شود.
  - مقادیر معمول: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض provider پشتیبانی‌شده با احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید موسیقی را به ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیما یک provider/model را انتخاب می‌کنید، احراز هویت/کلید API provider متناظر را نیز پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) را می‌پذیرد یا یک شیء (`{ primary, fallbacks }`).
  - توسط قابلیت مشترک تولید ویدئو و ابزار داخلی `video_generate` استفاده می‌شود.
  - مقادیر معمول: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض provider پشتیبانی‌شده با احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید ویدئو را به ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیما یک provider/model را انتخاب می‌کنید، احراز هویت/کلید API provider متناظر را نیز پیکربندی کنید.
  - provider تولید ویدئوی Qwen همراه، تا ۱ ویدئوی خروجی، ۱ تصویر ورودی، ۴ ویدئوی ورودی، مدت ۱۰ ثانیه، و گزینه‌های سطح provider یعنی `size`، `aspectRatio`، `resolution`، `audio` و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) را می‌پذیرد یا یک شیء (`{ primary, fallbacks }`).
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض fallback می‌کند.
- `pdfMaxBytesMb`: محدودیت اندازه پیش‌فرض PDF برای ابزار `pdf` وقتی `maxBytesMb` در زمان فراخوانی پاس داده نشده باشد.
- `pdfMaxPages`: حداکثر صفحات پیش‌فرضی که در حالت fallback استخراج در ابزار `pdf` در نظر گرفته می‌شوند.
- `verboseDefault`: سطح verbose پیش‌فرض برای agentها. مقادیر: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `reasoningDefault`: نمایانی reasoning پیش‌فرض برای agentها. مقادیر: `"off"`، `"on"`، `"stream"`. مقدار `agents.list[].reasoningDefault` مخصوص هر agent این پیش‌فرض را override می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای مالکان، فرستندگان مجاز، یا زمینه‌های Gateway اپراتور-مدیر اعمال می‌شوند، آن هم وقتی override مربوط به reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح خروجی elevated پیش‌فرض برای agentها. مقادیر: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (برای نمونه `openai/gpt-5.5` برای دسترسی با کلید API یا `openai-codex/gpt-5.5` برای Codex OAuth). اگر provider را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس یک مطابقت یکتای provider پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط بعد از آن به provider پیش‌فرض پیکربندی‌شده fallback می‌کند (رفتار سازگاری منسوخ، پس `provider/model` صریح را ترجیح دهید). اگر آن provider دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض قدیمی مربوط به provider حذف‌شده، به نخستین provider/model پیکربندی‌شده fallback می‌کند.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (ویژه provider، برای مثال `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های allowlist موجود را حذف می‌کنند رد می‌کند، مگر اینکه `--replace` را پاس دهید.
  - جریان‌های configure/onboarding با دامنه provider، مدل‌های provider انتخاب‌شده را در این map ادغام می‌کنند و providerهای نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌طور خودکار فعال می‌شود. از `params.responsesServerCompaction: false` برای توقف تزریق `context_management`، یا از `params.responsesCompactThreshold` برای override آستانه استفاده کنید. [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای provider پیش‌فرض سراسری که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (برای مثال `{ cacheRetention: "long" }`).
- اولویت ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (مخصوص مدل) override می‌شود، سپس `agents.list[].params` (شناسه agent متناظر) بر اساس کلید override می‌کند. برای جزئیات [کش کردن prompt](/fa/reference/prompt-caching) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON pass-through پیشرفته که در بدنه‌های درخواست `api: "openai-completions"` برای proxyهای سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده برخورد کند، extra body برنده می‌شود؛ مسیرهای completions غیر بومی همچنان بعد از آن `store` مخصوص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin همراه vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح، پیش‌فرض‌های تولیدشده را override می‌کند، و `extra_body.chat_template_kwargs` همچنان اولویت نهایی را دارد. برای کنترل‌های thinking مربوط به vLLM Qwen، روی آن ورودی مدل `params.qwenThinkingFormat` را به `"chat-template"` یا `"top-level"` تنظیم کنید.
- `compat.supportedReasoningEfforts`: فهرست effortهای reasoning سازگار با OpenAI برای هر مدل. برای endpointهای سفارشی که واقعا آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw گزینه `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی CLI agent، و اعتبارسنجی `llm-task` برای آن provider/model پیکربندی‌شده نمایش می‌دهد. وقتی backend برای یک سطح canonical مقدار ویژه provider می‌خواهد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: opt-in مخصوص Z.AI برای thinking حفظ‌شده. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را دوباره پخش می‌کند؛ [thinking و thinking حفظ‌شده در Z.AI](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `agentRuntime`: سیاست پیش‌فرض runtime سطح پایین agent. شناسه حذف‌شده به‌طور پیش‌فرض OpenClaw Pi است. از `id: "pi"` برای اجبار harness داخلی PI، از `id: "auto"` برای اینکه harnessهای Plugin ثبت‌شده مدل‌های پشتیبانی‌شده را claim کنند، از شناسه harness ثبت‌شده‌ای مثل `id: "codex"`، یا از alias یک backend CLI پشتیبانی‌شده مثل `id: "claude-cli"` استفاده کنید. برای غیرفعال کردن fallback خودکار PI مقدار `fallback: "none"` را تنظیم کنید. runtimeهای Plugin صریح مثل `codex` به‌طور پیش‌فرض fail closed می‌شوند مگر اینکه در همان دامنه override مقدار `fallback: "pi"` را تنظیم کنید. ارجاع‌های مدل را به شکل canonical یعنی `provider/model` نگه دارید؛ Codex، Claude CLI، Gemini CLI و backendهای اجرایی دیگر را از طریق پیکربندی runtime انتخاب کنید، نه از طریق پیشوندهای provider runtime قدیمی. برای اینکه بدانید این موضوع چه تفاوتی با انتخاب provider/model دارد، [runtimeهای agent](/fa/concepts/agent-runtimes) را ببینید.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`، `/models set-image` و فرمان‌های افزودن/حذف fallback) فرم شیء canonical را ذخیره می‌کنند و در صورت امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجرای موازی agent در میان نشست‌ها (هر نشست همچنان سریالی می‌ماند). پیش‌فرض: ۴.

### `agents.defaults.agentRuntime`

`agentRuntime` کنترل می‌کند کدام executor سطح پایین نوبت‌های agent را اجرا کند. بیشتر
استقرارها باید runtime پیش‌فرض OpenClaw Pi را نگه دارند. وقتی یک Plugin مورد اعتماد
یک harness بومی فراهم می‌کند، مانند harness همراه app-server متعلق به Codex،
یا وقتی یک backend CLI پشتیبانی‌شده مثل Claude CLI می‌خواهید، از آن استفاده کنید. برای مدل ذهنی،
[runtimeهای agent](/fa/concepts/agent-runtimes) را ببینید.

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

- `id`: `"auto"`، `"pi"`، شناسه harness یک Plugin ثبت‌شده، یا alias یک backend CLI پشتیبانی‌شده. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic، backend CLI یعنی `claude-cli` را فراهم می‌کند.
- `fallback`: `"pi"` یا `"none"`. در `id: "auto"`، fallback حذف‌شده به‌طور پیش‌فرض `"pi"` است تا پیکربندی‌های قدیمی وقتی هیچ harness مربوط به Plugin یک اجرا را claim نمی‌کند بتوانند همچنان از PI استفاده کنند. در حالت runtime صریح Plugin، مانند `id: "codex"`، fallback حذف‌شده به‌طور پیش‌فرض `"none"` است تا harness گم‌شده به‌جای استفاده بی‌صدای PI شکست بخورد. overrideهای runtime مقدار fallback را از دامنه گسترده‌تر به ارث نمی‌برند؛ وقتی عمدا آن fallback سازگاری را می‌خواهید، همراه runtime صریح `fallback: "pi"` را تنظیم کنید. خرابی‌های harness انتخاب‌شده Plugin همیشه مستقیما نمایش داده می‌شوند.
- overrideهای محیطی: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` مقدار `id` را override می‌کند؛ `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` مقدار fallback را برای آن فرایند override می‌کند.
- برای استقرارهای فقط Codex، مقدار `model: "openai/gpt-5.5"` و `agentRuntime.id: "codex"` را تنظیم کنید. همچنین می‌توانید برای خوانایی، `agentRuntime.fallback: "none"` را صریح تنظیم کنید؛ این مقدار پیش‌فرض runtimeهای Plugin صریح است.
- برای استقرارهای Claude CLI، `model: "anthropic/claude-opus-4-7"` به‌علاوه `agentRuntime.id: "claude-cli"` را ترجیح دهید. ارجاع‌های مدل قدیمی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب provider/model را canonical نگه دارد و backend اجرایی را در `agentRuntime.id` قرار دهد.
- کلیدهای قدیمی‌تر سیاست runtime توسط `openclaw doctor --fix` به `agentRuntime` بازنویسی می‌شوند.
- انتخاب harness بعد از نخستین اجرای embedded برای هر شناسه نشست pin می‌شود. تغییرات پیکربندی/محیط روی نشست‌های جدید یا reset شده اثر می‌گذارند، نه transcript موجود. نشست‌های قدیمی با سابقه transcript اما بدون pin ثبت‌شده، PI-pinned تلقی می‌شوند. `/status` runtime مؤثر را گزارش می‌کند، برای مثال `Runtime: OpenClaw Pi Default` یا `Runtime: OpenAI Codex`.
- این فقط اجرای نوبت‌های متنی agent را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدئو و TTS همچنان از تنظیمات provider/model خود استفاده می‌کنند.

**میان‌برهای alias داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

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

نام‌های مستعار پیکربندی‌شده شما همیشه بر پیش‌فرض‌ها مقدم هستند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI برای جریان‌سازی فراخوانی ابزار، به‌طور پیش‌فرض `tool_stream` را فعال می‌کنند. برای غیرفعال کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

پشتانه‌های اختیاری CLI برای اجراهای جایگزین فقط‌متنی (بدون فراخوانی ابزار). زمانی مفید است که ارائه‌دهندگان API شکست بخورند.

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

کل پرامپت سیستمی ساخته‌شده توسط OpenClaw را با یک رشته ثابت جایگزین کنید. در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقادیر مختص عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شده پرامپت مفید است.

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

پوشش‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانواده مدل اعمال می‌شوند. شناسه‌های مدل خانواده GPT-5 قرارداد رفتاری مشترک را در همه ارائه‌دهندگان دریافت می‌کنند؛ `personality` فقط لایه سبک تعامل دوستانه را کنترل می‌کند.

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

- `every`: رشته مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال کردن، روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستمی حذف می‌کند و تزریق `HEARTBEAT.md` به زمینه آغازین را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را در طول اجراهای heartbeat سرکوب می‌کند.
- `timeoutSeconds`: حداکثر زمان مجاز بر حسب ثانیه برای یک نوبت عامل heartbeat پیش از لغو شدن. برای استفاده از `agents.defaults.timeoutSeconds` تنظیم‌نشده بگذارید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای heartbeat از زمینه آغازین سبک استفاده می‌کنند و از میان فایل‌های آغازین فضای کاری فقط `HEARTBEAT.md` را نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر heartbeat در یک نشست تازه بدون تاریخچه گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی cron `sessionTarget: "isolated"`. هزینه توکن هر heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای heartbeat در مسیرهای مشغول اضافی به تعویق می‌افتند: کارهای زیرفعامل یا فرمان‌های تو در تو. مسیرهای Cron همیشه heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
- برای هر عامل: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر عاملی `heartbeat` را تعریف کند، **فقط همان عامل‌ها** heartbeat اجرا می‌کنند.
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
- `provider`: شناسه یک Plugin ارائه‌دهنده Compaction ثبت‌شده. وقتی تنظیم شود، به‌جای خلاصه‌سازی داخلی LLM، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به حالت داخلی بازمی‌گردد. تنظیم ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: حداکثر ثانیه‌های مجاز برای یک عملیات Compaction پیش از آنکه OpenClaw آن را لغو کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجه نقطه برش Pi برای نگه داشتن دنباله اخیر رونوشت به‌صورت عین به عین. `/compact` دستی وقتی صریحا تنظیم شده باشد از این مقدار تبعیت می‌کند؛ در غیر این صورت Compaction دستی یک checkpoint سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` راهنمای داخلی نگه‌داری شناسه‌های مبهم را در طول خلاصه‌سازی Compaction به ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه‌ها که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش مجدد هنگام خروجی بدشکل برای خلاصه‌های safeguard. به‌طور پیش‌فرض در حالت safeguard فعال است؛ برای رد کردن ممیزی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار چرخه ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از افزوده شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش جاری را پیش از ارسال پرامپت لغو می‌کند و از مسیر بازیابی precheck موجود برای کوتاه کردن نتایج ابزار یا compact و تلاش مجدد استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا صریحا روی همان جفت پیش‌فرض تنظیم شده باشد، عنوان‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان جایگزین legacy پذیرفته می‌شوند.
- `model`: بازنویسی اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. زمانی از این استفاده کنید که نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه اختیاری بایت (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به یک رونوشت جانشین کوچک‌تر بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و تکمیل Compaction اعلان‌های کوتاهی برای کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). به‌طور پیش‌فرض غیرفعال است تا Compaction بی‌صدا بماند.
- `memoryFlush`: نوبت عامل‌محور بی‌صدا پیش از Compaction خودکار برای ذخیره حافظه‌های پایدار. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیره جایگزین نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

### `agents.defaults.contextPruning`

**نتایج قدیمی ابزار** را پیش از ارسال به LLM از زمینه درون‌حافظه‌ای هرس می‌کند. تاریخچه نشست روی دیسک را تغییر **نمی‌دهد**.

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
- `ttl` کنترل می‌کند که هرس هر چند وقت یک‌بار دوباره اجرا شود (پس از آخرین لمس cache).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را به‌صورت نرم کوتاه می‌کند، سپس در صورت نیاز نتایج قدیمی‌تر ابزار را پاک‌سازی سخت می‌کند.

**کوتاه‌سازی نرم** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**پاک‌سازی سخت** کل نتیجه ابزار را با placeholder جایگزین می‌کند.

نکات:

- بلوک‌های تصویر هرگز کوتاه/پاک‌سازی نمی‌شوند.
- نسبت‌ها مبتنی بر نویسه‌اند (تقریبی)، نه شمارش دقیق توکن.
- اگر تعداد پیام‌های دستیار کمتر از `keepLastAssistants` باشد، هرس رد می‌شود.

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
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های جداگانه برای هر حساب). Signal/Slack/Discord/Google Chat به‌طور پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = ۸۰۰ تا ۲۵۰۰ میلی‌ثانیه. بازنویسی برای هر عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار و قطعه‌بندی، [جریان‌سازی](/fa/concepts/streaming) را ببینید.

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

**بک‌اند:**

- `docker`: زمان‌اجرای Docker محلی (پیش‌فرض)
- `ssh`: زمان‌اجرای راه‌دور عمومی با پشتوانه SSH
- `openshell`: زمان‌اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات اختصاصی زمان‌اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی بک‌اند SSH:**

- `target`: هدف SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه مطلق راه‌دور که برای فضاهای کاری هر محدوده استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefهایی که OpenClaw در زمان اجرا به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: کنترل‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` اولویت دارد
- `certificateData` بر `certificateFile` اولویت دارد
- `knownHostsData` بر `knownHostsFile` اولویت دارد
- مقدارهای `*Data` با پشتوانه SecretRef پیش از شروع نشست سندباکس از اسنپ‌شات زمان‌اجرای اسرار فعال حل می‌شوند

**رفتار بک‌اند SSH:**

- فضای کاری راه‌دور را پس از ایجاد یا ایجاد دوباره، یک‌بار مقداردهی اولیه می‌کند
- سپس فضای کاری SSH راه‌دور را مرجع اصلی نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه‌دور را به‌طور خودکار به میزبان همگام‌سازی نمی‌کند
- از کانتینرهای مرورگر سندباکس پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری سندباکس برای هر محدوده زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری سندباکس در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent` سوار می‌شود
- `rw`: فضای کاری عامل به‌صورت خواندنی/نوشتنی در `/workspace` سوار می‌شود

**محدوده:**

- `session`: کانتینر و فضای کاری برای هر نشست
- `agent`: یک کانتینر و فضای کاری برای هر عامل (پیش‌فرض)
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

- `mirror`: پیش از exec از محلی به راه‌دور مقداردهی اولیه می‌کند، پس از exec به عقب همگام‌سازی می‌کند؛ فضای کاری محلی مرجع اصلی می‌ماند
- `remote`: هنگام ایجاد سندباکس، راه‌دور را یک‌بار مقداردهی اولیه می‌کند، سپس فضای کاری راه‌دور را مرجع اصلی نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که خارج از OpenClaw انجام شوند پس از مرحله مقداردهی اولیه به‌طور خودکار داخل سندباکس همگام‌سازی نمی‌شوند.
انتقال از طریق SSH به سندباکس OpenShell انجام می‌شود، اما Plugin مالک چرخه عمر سندباکس و همگام‌سازی mirror اختیاری است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل نوشتن، و کاربر ریشه نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است مگر اینکه به‌صراحت
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (حالت اضطراری) را تنظیم کنید.

**پیوست‌های ورودی** در `media/inbound/*` داخل فضای کاری فعال قرار داده می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان اضافی را سوار می‌کند؛ bindهای سراسری و هر عامل با هم ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL مربوط به noVNC داخل پرامپت سیستم تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی مشاهده‌گر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای گذرواژه در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) جلوی هدف‌گرفتن مرورگر میزبان توسط نشست‌های سندباکس‌شده را می‌گیرد.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط وقتی به‌صراحت اتصال bridge سراسری می‌خواهید، آن را روی `bridge` تنظیم کنید.
- `cdpSourceRange` به‌صورت اختیاری ورود CDP را در لبه کانتینر به یک محدوده CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های میزبان اضافی را فقط داخل کانتینر مرورگر سندباکس سوار می‌کند. وقتی تنظیم شود (از جمله `[]`)، جایگزین `docker.binds` برای کانتینر مرورگر می‌شود.
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
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu` به‌طور پیش‌فرض
    فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توانند با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال شوند.
  - اگر گردش کار شما به افزونه‌ها وابسته است، `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    آن‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از سقف
    پیش‌فرض فرایند Chromium، `0` تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها خط مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر از یک تصویر مرورگر سفارشی با
    entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکس‌سازی مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصویرها:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (بازنویسی‌های هر عامل)

از `agents.list[].tts` استفاده کنید تا به یک عامل ارائه‌دهنده TTS، صدا، مدل،
سبک، یا حالت TTS خودکار اختصاصی بدهید. بلوک عامل به‌صورت deep-merge روی
`messages.tts` سراسری اعمال می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک مکان بمانند درحالی‌که عامل‌های جداگانه
فقط فیلدهای صدا یا ارائه‌دهنده موردنیاز خود را بازنویسی می‌کنند. بازنویسی عامل فعال
برای پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و
ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و اولویت‌بندی، [متن‌به‌گفتار](/fa/tools/tts#per-agent-voice-overrides) را ببینید.

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

- `id`: شناسهٔ پایدار عامل (الزامی).
- `default`: وقتی چند مورد تنظیم شده باشد، اولین مورد برنده می‌شود (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین ورودی فهرست پیش‌فرض است.
- `model`: فرم رشته‌ای، یک مدل اصلی سخت‌گیرانهٔ مختص هر عامل را بدون مدل جایگزین تنظیم می‌کند؛ فرم شیء `{ primary }` نیز سخت‌گیرانه است، مگر اینکه `fallbacks` را اضافه کنید. از `{ primary, fallbacks: [...] }` استفاده کنید تا آن عامل را وارد جایگزینی کنید، یا از `{ primary, fallbacks: [] }` استفاده کنید تا رفتار سخت‌گیرانه را صریح کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند همچنان جایگزین‌های پیش‌فرض را به ارث می‌برند، مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان مختص هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های مختص عامل مانند `cacheRetention`، `temperature` یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار مختص هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهندهٔ مشترک و سیاست جایگزینی را در `messages.tts` نگه دارید و فقط مقدارهای مختص پرسونا مانند ارائه‌دهنده، صدا، مدل، سبک یا حالت خودکار را اینجا تنظیم کنید.
- `skills`: فهرست مجاز اختیاری Skills مختص هر عامل. اگر حذف شود، عامل وقتی `agents.defaults.skills` تنظیم شده باشد آن را به ارث می‌برد؛ یک فهرست صریح، پیش‌فرض‌ها را به‌جای ادغام جایگزین می‌کند، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح تفکر پیش‌فرض اختیاری مختص هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی مختص پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. نمایهٔ ارائه‌دهنده/مدل انتخاب‌شده تعیین می‌کند کدام مقدارها معتبر هستند؛ برای Google Gemini، `adaptive` تفکر پویا و متعلق به ارائه‌دهنده را حفظ می‌کند (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی استدلال پیش‌فرض اختیاری مختص هر عامل (`on | off | stream`). وقتی هیچ بازنویسی استدلال مختص پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری مختص هر عامل برای حالت سریع (`true | false`). وقتی هیچ بازنویسی حالت سریع مختص پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `agentRuntime`: بازنویسی اختیاری سیاست runtime سطح پایین مختص هر عامل. از `{ id: "codex" }` استفاده کنید تا یک عامل فقط Codex باشد، در حالی که عامل‌های دیگر جایگزینی پیش‌فرض PI را در حالت `auto` نگه می‌دارند.
- `runtime`: توصیفگر runtime اختیاری مختص هر عامل. وقتی عامل باید به‌صورت پیش‌فرض از نشست‌های مهار ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی نسبت به workspace، نشانی `http(s)`، یا URI از نوع `data:`.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای اهداف صریح `sessions_spawn.agentId` (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های خودهدف‌گیر `agentId` باید مجاز باشند، شناسهٔ درخواست‌کننده را وارد کنید.
- محافظ وراثت sandbox: اگر نشست درخواست‌کننده sandbox شده باشد، `sessions_spawn` هدف‌هایی را که بدون sandbox اجرا می‌شوند رد می‌کند.
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

### فیلدهای تطبیق binding

- `type` (اختیاری): `route` برای مسیریابی عادی (نوعِ حذف‌شده به‌صورت پیش‌فرض route است)، `acp` برای bindingهای گفت‌وگوی پایدار ACP.
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

برای ورودی‌های `type: "acp"`، OpenClaw بر پایهٔ هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) resolve می‌کند و از ترتیب سطح‌های route binding در بالا استفاده نمی‌کند.

### نمایه‌های دسترسی مختص هر عامل

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

<Accordion title="Session field details">

- **`scope`**: راهبرد پایهٔ گروه‌بندی نشست برای زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده درون زمینهٔ یک کانال، نشست جداگانهٔ خودش را می‌گیرد.
  - `global`: همهٔ شرکت‌کنندگان در زمینهٔ یک کانال یک نشست واحد را به اشتراک می‌گذارند (فقط وقتی استفاده کنید که زمینهٔ مشترک مدنظر است).
- **`dmScope`**: شیوهٔ گروه‌بندی پیام‌های مستقیم.
  - `main`: همهٔ پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند.
  - `per-peer`: جداسازی بر اساس شناسهٔ فرستنده در همهٔ کانال‌ها.
  - `per-channel-peer`: جداسازی به‌ازای کانال + فرستنده (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: جداسازی به‌ازای حساب + کانال + فرستنده (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: نگاشت شناسه‌های canonical به peerهای دارای پیشوند provider برای اشتراک‌گذاری نشست بین کانال‌ها. دستورهای dock مانند `/dock_discord` از همین نگاشت استفاده می‌کنند تا مسیر پاسخ نشست فعال را به peer کانالِ لینک‌شدهٔ دیگری تغییر دهند؛ [داک کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در ساعت محلی `atHour` بازنشانی می‌کند؛ `idle` پس از `idleMinutes` بازنشانی می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود برنده است. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی idle از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارباش‌های Cron، اعلان‌های exec و حسابداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/idle را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های به‌ازای نوع (`direct`، `group`، `thread`). مقدار قدیمی `dm` به‌عنوان alias برای `direct` پذیرفته می‌شود.
- **`parentForkMaxTokens`**: بیشینهٔ `totalTokens` مجازِ نشست والد هنگام ساخت نشست thread منشعب‌شده (پیش‌فرض `100000`).
  - اگر `totalTokens` والد بالاتر از این مقدار باشد، OpenClaw به‌جای به‌ارث‌بردن تاریخچهٔ transcript والد، یک نشست thread تازه شروع می‌کند.
  - برای غیرفعال‌کردن این محافظ و همیشه مجاز کردن fork از والد، مقدار را `0` بگذارید.
- **`mainKey`**: فیلد قدیمی. Runtime همیشه برای باکت اصلی گفت‌وگوی مستقیم از `"main"` استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینهٔ نوبت‌های پاسخ‌برگشتی بین agentها در تبادل‌های agent-to-agent (عدد صحیح، بازه: `0` تا `5`). مقدار `0` زنجیره‌سازی ping-pong را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، همراه با alias قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. اولین deny برنده است.
- **`maintenance`**: پاک‌سازی session-store + کنترل‌های نگهداشت.
  - `mode`: مقدار `warn` فقط هشدارها را منتشر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: آستانهٔ سن برای ورودی‌های stale (پیش‌فرض `30d`).
  - `maxEntries`: بیشینهٔ تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). Runtime پاک‌سازی batch را با یک بافر high-water کوچک برای سقف‌های در اندازهٔ production می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را فوری اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از configهای قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگهداشت برای آرشیوهای transcript با الگوی `*.reset.<timestamp>`. پیش‌فرض برابر `pruneAfter` است؛ برای غیرفعال‌کردن، `false` بگذارید.
  - `maxDiskBytes`: بودجهٔ اختیاری دیسک برای پوشهٔ نشست‌ها. در حالت `warn` هشدارها را log می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین artifactها/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای ویژگی‌های نشست‌های وابسته به thread.
  - `enabled`: سوییچ پیش‌فرض اصلی (providerها می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: auto-unfocus پیش‌فرض پس از بی‌فعالیتی، برحسب ساعت (`0` غیرفعال می‌کند؛ providerها می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینهٔ عمر سخت پیش‌فرض، برحسب ساعت (`0` غیرفعال می‌کند؛ providerها می‌توانند بازنویسی کنند)

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

حل مقدار (خاص‌ترین برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و cascade را متوقف می‌کند. `"auto"` مقدار را از `[{identity.name}]` می‌سازد.

**متغیرهای قالب:**

| متغیر            | توضیح              | مثال                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل       | `claude-opus-4-6`           |
| `{modelFull}`     | شناسهٔ کامل مدل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام provider          | `anthropic`                 |
| `{thinkingLevel}` | سطح thinking فعلی | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت agent    | (همانند `"auto"`)          |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` یک alias برای `{thinkingLevel}` است.

### واکنش تأیید

- پیش‌فرض برابر `identity.emoji` متعلق به agent فعال است، وگرنه `"👀"`. برای غیرفعال‌کردن، `""` بگذارید.
- بازنویسی‌های به‌ازای کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل مقدار: حساب → کانال → `messages.ackReaction` → fallback هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: پس از پاسخ، ack را در کانال‌هایی که از reaction پشتیبانی می‌کنند، مانند Slack، Discord، Telegram، WhatsApp و BlueBubbles حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخهٔ عمر را در Slack، Discord و Telegram فعال می‌کند.
  در Slack و Discord، مقدار تنظیم‌نشده وقتی واکنش‌های ack فعال باشند، واکنش‌های وضعیت را فعال نگه می‌دارد.
  در Telegram، برای فعال‌کردن واکنش‌های وضعیت چرخهٔ عمر، آن را صراحتاً روی `true` بگذارید.

### debounce ورودی

پیام‌های سریعِ فقط‌متنی از همان فرستنده را در یک نوبت agent واحد دسته‌بندی می‌کند. رسانه/پیوست‌ها فوری flush می‌شوند. دستورهای کنترلی debounce را دور می‌زنند.

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

- `auto` حالت پیش‌فرض auto-TTS را کنترل می‌کند: `off`، `always`، `inbound`، یا `tagged`. `/tts on|off` می‌تواند prefs محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای auto-summary بازنویسی می‌کند.
- `modelOverrides` به‌صورت پیش‌فرض فعال است؛ مقدار پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (opt-in).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` fallback می‌کنند.
- providerهای speech همراه، متعلق به Plugin هستند. اگر `plugins.allow` تنظیم شده باشد، هر Plugin provider مربوط به TTS را که می‌خواهید استفاده کنید اضافه کنید، برای مثال `microsoft` برای Edge TTS. شناسهٔ provider قدیمی `edge` به‌عنوان alias برای `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` endpoint مربوط به OpenAI TTS را بازنویسی می‌کند. ترتیب حل مقدار config است، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1`.
- وقتی `providers.openai.baseUrl` به endpoint غیر OpenAI اشاره کند، OpenClaw آن را یک سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی model/voice را آسان‌گیرتر می‌کند.

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

- وقتی چند provider گفت‌وگو پیکربندی شده باشد، `talk.provider` باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای flat قدیمی گفت‌وگو (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند و به‌صورت خودکار به `talk.providers.<provider>` مهاجرت داده می‌شوند.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` fallback می‌کنند.
- `providers.*.apiKey` رشته‌های plaintext یا اشیای SecretRef را می‌پذیرد.
- fallback مربوط به `ELEVENLABS_API_KEY` فقط وقتی اعمال می‌شود که هیچ کلید API گفت‌وگو پیکربندی نشده باشد.
- `providers.*.voiceAliases` اجازه می‌دهد directiveهای گفت‌وگو از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` repo مربوط به Hugging Face را که helper محلی MLX در macOS استفاده می‌کند انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS از طریق helper همراه `openclaw-mlx-tts` هنگام وجود آن اجرا می‌شود، یا از یک فایل اجرایی در `PATH`؛ `OPENCLAW_MLX_TTS_BIN` مسیر helper را برای توسعه بازنویسی می‌کند.
- `speechLocale` شناسهٔ locale از نوع BCP 47 را که تشخیص گفتار گفت‌وگوی iOS/macOS استفاده می‌کند تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت گفت‌وگو پس از سکوت کاربر چه مدت منتظر بماند تا transcript را ارسال کند. مقدار تنظیم‌نشده پنجرهٔ مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms در macOS و Android، 900 ms در iOS`).

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همهٔ کلیدهای config دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
