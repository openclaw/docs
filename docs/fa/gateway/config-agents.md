---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و پیوندهای چندعامله
    - تنظیم رفتار نشست، تحویل پیام و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها، و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-05-04T02:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d339b82b8b3b82e55820ca6568b3ed569fe64135e698515fa7f316c3afbbfd9
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

ریشهٔ اختیاری مخزن که در خط Runtime اعلان سیستم نمایش داده می‌شود. اگر تنظیم نشود، OpenClaw با پیمایش رو به بالا از workspace آن را به‌صورت خودکار تشخیص می‌دهد.

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
- برای ارث‌بری پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
- برای نداشتن Skills، مقدار `agents.list[].skills: []` را تنظیم کنید.
- فهرست غیرخالی `agents.list[].skills` مجموعهٔ نهایی برای آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های bootstrap در workspace را غیرفعال می‌کند (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شدهٔ workspace را رد می‌کند، در حالی که همچنان فایل‌های bootstrap الزامی را می‌نویسد. مقادیر معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند فایل‌های bootstrap مربوط به workspace چه زمانی در اعلان سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامهٔ امن (پس از پاسخ کامل دستیار) تزریق دوبارهٔ bootstrap مربوط به workspace را رد می‌کنند و اندازهٔ اعلان را کاهش می‌دهند. اجرای Heartbeat و تلاش‌های دوباره پس از Compaction همچنان context را بازسازی می‌کنند.
- `"never"`: تزریق bootstrap مربوط به workspace و فایل‌های context را در هر نوبت غیرفعال می‌کند. این گزینه را فقط برای عامل‌هایی استفاده کنید که چرخهٔ عمر اعلان خود را کامل در اختیار دارند (موتورهای context سفارشی، runtimeهای بومی که context خود را می‌سازند، یا workflowهای تخصصی بدون bootstrap). نوبت‌های Heartbeat و بازیابی پس از Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

حداکثر تعداد نویسه برای هر فایل bootstrap مربوط به workspace پیش از کوتاه‌سازی. پیش‌فرض: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده در همهٔ فایل‌های bootstrap مربوط به workspace. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

اعلان قابل‌مشاهده برای عامل در اعلان سیستم را هنگام کوتاه‌سازی context مربوط به bootstrap کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن اعلان کوتاه‌سازی را در اعلان سیستم تزریق نکن.
- `"once"`: برای هر امضای کوتاه‌سازی یکتا، یک‌بار یک اعلان کوتاه تزریق کن (توصیه‌شده).
- `"always"`: هر بار که کوتاه‌سازی وجود دارد، در هر اجرا یک اعلان کوتاه تزریق کن.

شمارش‌های دقیق خام/تزریق‌شده و فیلدهای تنظیم پیکربندی در تشخیص‌هایی مانند
گزارش‌های context/status و لاگ‌ها باقی می‌مانند؛ context معمول کاربر/زمان اجرای WebChat فقط
اعلان کوتاه بازیابی را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشهٔ مالکیت بودجهٔ context

OpenClaw چندین بودجهٔ اعلان/context با حجم بالا دارد، و این بودجه‌ها
عمداً به‌جای عبور همگی از یک کنترل عمومی، بر اساس زیرسیستم جدا شده‌اند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق معمول bootstrap مربوط به workspace.
- `agents.defaults.startupContext.*`:
  پیش‌درآمد یک‌بارهٔ اجرای مدل در reset/startup، شامل فایل‌های اخیر روزانهٔ
  `memory/*.md`. فرمان‌های چت سادهٔ `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشردهٔ Skills تزریق‌شده در اعلان سیستم.
- `agents.defaults.contextLimits.*`:
  گزیده‌های محدودشدهٔ runtime و بلوک‌های تزریق‌شده با مالکیت runtime.
- `memory.qmd.limits.*`:
  اندازه‌بندی قطعهٔ memory-search نمایه‌شده و تزریق.

فقط زمانی از override متناظر به‌ازای هر عامل استفاده کنید که یک عامل به
بودجهٔ متفاوتی نیاز داشته باشد:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد startup نوبت اول را که در اجراهای مدل reset/startup تزریق می‌شود کنترل می‌کند.
فرمان‌های چت سادهٔ `/new` و `/reset`، reset را بدون فراخوانی مدل تأیید می‌کنند،
بنابراین این پیش‌درآمد را بارگذاری نمی‌کنند.

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

پیش‌فرض‌های مشترک برای سطوح context محدودشدهٔ runtime.

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

- `memoryGetMaxChars`: سقف پیش‌فرض گزیدهٔ `memory_get` پیش از افزوده‌شدن
  metadata کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجرهٔ خط پیش‌فرض `memory_get` زمانی که `lines`
  حذف شده باشد.
- `toolResultMaxChars`: سقف زندهٔ نتیجهٔ ابزار که برای نتایج ماندگار و
  بازیابی سرریز استفاده می‌شود.
- `postCompactionMaxChars`: سقف گزیدهٔ AGENTS.md که هنگام تزریق refresh پس از Compaction
  استفاده می‌شود.

#### `agents.list[].contextLimits`

override به‌ازای هر عامل برای کنترل‌های مشترک `contextLimits`. فیلدهای حذف‌شده از
`agents.defaults.contextLimits` ارث‌بری می‌کنند.

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

سقف سراسری برای فهرست فشردهٔ Skills که در اعلان سیستم تزریق می‌شود. این
بر خواندن فایل‌های `SKILL.md` در صورت نیاز اثری ندارد.

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

override به‌ازای هر عامل برای بودجهٔ اعلان Skills.

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

حداکثر اندازهٔ پیکسلی برای بلندترین ضلع تصویر در بلوک‌های تصویر transcript/tool پیش از فراخوانی‌های provider.
پیش‌فرض: `1200`.

مقادیر کمتر معمولاً مصرف tokenهای بینایی و اندازهٔ payload درخواست را برای اجراهای پر از screenshot کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

منطقهٔ زمانی برای context اعلان سیستم (نه timestampهای پیام). به منطقهٔ زمانی میزبان fallback می‌کند.

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
  - قالب رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - قالب شیء، مدل اصلی را همراه با مدل‌های failover مرتب‌شده تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط مسیر ابزار `image` به‌عنوان پیکربندی مدل بینایی آن استفاده می‌شود.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نتواند ورودی تصویر را بپذیرد، برای مسیریابی fallback استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های خام برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه خام به‌صورت یکتا با یک ورودی پیکربندی‌شده و دارای قابلیت تصویر در `models.providers.*.models` منطبق شود، OpenClaw آن را به همان provider مقید می‌کند. تطابق‌های پیکربندی‌شده مبهم به پیشوند صریح provider نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده که تصویر تولید می‌کند استفاده می‌شود.
  - مقادیر معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینه شفاف در OpenAI.
  - اگر مستقیما یک provider/model انتخاب می‌کنید، احراز هویت provider متناظر را هم پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس باقی providerهای ثبت‌شده تولید تصویر را به‌ترتیب شناسه provider امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` استفاده می‌شود.
  - مقادیر معمول: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس باقی providerهای ثبت‌شده تولید موسیقی را به‌ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیما یک provider/model انتخاب می‌کنید، احراز هویت/کلید API provider متناظر را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط قابلیت مشترک تولید ویدیو و ابزار داخلی `video_generate` استفاده می‌شود.
  - مقادیر معمول: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس باقی providerهای ثبت‌شده تولید ویدیو را به‌ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیما یک provider/model انتخاب می‌کنید، احراز هویت/کلید API provider متناظر را هم پیکربندی کنید.
  - provider تولید ویدیوی Qwen که همراه بسته ارائه می‌شود، حداکثر ۱ ویدیوی خروجی، ۱ تصویر ورودی، ۴ ویدیوی ورودی، مدت‌زمان ۱۰ ثانیه، و گزینه‌های سطح provider یعنی `size`، `aspectRatio`، `resolution`، `audio`، و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) می‌پذیرد.
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض fallback می‌کند.
- `pdfMaxBytesMb`: محدودیت پیش‌فرض اندازه PDF برای ابزار `pdf` وقتی `maxBytesMb` در زمان فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: بیشینه صفحات پیش‌فرض که در حالت fallback استخراج در ابزار `pdf` در نظر گرفته می‌شود.
- `verboseDefault`: سطح verbose پیش‌فرض برای agentها. مقادیر: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خطوط ابزار پیش‌نویس پیشرفت. مقادیر: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (افزودن دستور/جزئیات خام در صورت موجود بودن). مقدار `agents.list[].toolProgressDetail` برای هر agent این پیش‌فرض را override می‌کند.
- `reasoningDefault`: نمایانی reasoning پیش‌فرض برای agentها. مقادیر: `"off"`، `"on"`، `"stream"`. مقدار `agents.list[].reasoningDefault` برای هر agent این پیش‌فرض را override می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای owners، فرستنده‌های مجاز، یا زمینه‌های operator-admin در Gateway اعمال می‌شوند، آن هم وقتی override برای reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح پیش‌فرض خروجی elevated برای agentها. مقادیر: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلا `openai/gpt-5.5` برای دسترسی با کلید API یا `openai-codex/gpt-5.5` برای Codex OAuth). اگر provider را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس برای همان شناسه دقیق مدل به‌دنبال یک تطابق یکتای provider پیکربندی‌شده می‌گردد، و فقط بعد از آن به provider پیش‌فرض پیکربندی‌شده fallback می‌کند (رفتار سازگاری منسوخ‌شده، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن provider دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نشان دادن پیش‌فرض کهنه مربوط به provider حذف‌شده، به اولین provider/model پیکربندی‌شده fallback می‌کند.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میانبر) و `params` (مختص provider، برای مثال `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های موجود allowlist را حذف کنند نمی‌پذیرد، مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های پیکربندی/onboarding با محدوده provider، مدل‌های provider انتخاب‌شده را در این map ادغام می‌کنند و providerهای نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌صورت خودکار فعال می‌شود. برای توقف تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای override کردن آستانه از `params.responsesCompactThreshold` استفاده کنید. [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض عمومی provider که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلا `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه عمومی) توسط `agents.defaults.models["provider/model"].params` (مختص مدل) override می‌شود، سپس `agents.list[].params` (شناسه agent مطابق) کلیدبه‌کلید override می‌کند. برای جزئیات [Prompt Caching](/fa/reference/prompt-caching) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON پیشرفته pass-through که در بدنه‌های درخواست `api: "openai-completions"` برای proxyهای سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده برخورد داشته باشد، بدنه اضافی برنده می‌شود؛ مسیرهای completions غیربومی همچنان پس از آن `store` مخصوص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح‌بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` وقتی thinking خاموش است، Plugin داخلی vLLM به‌صورت خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح پیش‌فرض‌های تولیدشده را override می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی را دارد. برای کنترل‌های thinking در vLLM Qwen، روی همان ورودی مدل، `params.qwenThinkingFormat` را به `"chat-template"` یا `"top-level"` تنظیم کنید.
- `compat.supportedReasoningEfforts`: فهرست reasoning effort سازگار با OpenAI برای هر مدل. برای endpointهای سفارشی که واقعا آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw برای آن provider/model پیکربندی‌شده، `/think xhigh` را در منوهای دستور، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی agent در CLI، و اعتبارسنجی `llm-task` ارائه می‌کند. وقتی backend برای یک سطح canonical به مقدار مختص provider نیاز دارد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: گزینه opt-in فقط برای Z.AI جهت حفظ thinking. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ [thinking و thinking حفظ‌شده در Z.AI](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `agentRuntime`: سیاست پیش‌فرض runtime سطح‌پایین agent. شناسه حذف‌شده به‌صورت پیش‌فرض OpenClaw Pi است. از `id: "pi"` برای اجبار harness داخلی PI استفاده کنید، از `id: "auto"` برای اینکه harnessهای Plugin ثبت‌شده مدل‌های پشتیبانی‌شده را claim کنند و وقتی هیچ تطابقی نبود از PI استفاده شود، از شناسه harness ثبت‌شده مانند `id: "codex"` برای الزام همان harness، یا از یک alias پشتیبانی‌شده backend در CLI مانند `id: "claude-cli"` استفاده کنید. runtimeهای Plugin صریح وقتی harness در دسترس نباشد یا fail شود، fail closed می‌شوند. ارجاع‌های مدل را به‌صورت canonical یعنی `provider/model` نگه دارید؛ Codex، Claude CLI، Gemini CLI، و backendهای اجرایی دیگر را به‌جای پیشوندهای legacy runtime provider از طریق پیکربندی runtime انتخاب کنید. برای تفاوت این مورد با انتخاب provider/model، [runtimeهای agent](/fa/concepts/agent-runtimes) را ببینید.
- نویسندگان پیکربندی که این فیلدها را mutate می‌کنند (برای مثال `/models set`، `/models set-image`، و دستورهای افزودن/حذف fallback)، قالب canonical شیء را ذخیره می‌کنند و فهرست‌های fallback موجود را در صورت امکان حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجرای موازی agent در میان نشست‌ها (هر نشست همچنان سریالی است). پیش‌فرض: ۴.

### `agents.defaults.agentRuntime`

`agentRuntime` کنترل می‌کند کدام اجراکننده سطح‌پایین نوبت‌های agent را اجرا کند. بیشتر
استقرارها باید runtime پیش‌فرض OpenClaw Pi را نگه دارند. وقتی یک Plugin قابل اعتماد
یک harness بومی ارائه می‌کند، مانند harness همراه بسته برای app-server در Codex،
یا وقتی یک backend پشتیبانی‌شده CLI مانند Claude CLI می‌خواهید، از آن استفاده کنید. برای مدل ذهنی،
[runtimeهای agent](/fa/concepts/agent-runtimes) را ببینید.

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

- `id`: `"auto"`، `"pi"`، یک شناسه harness ثبت‌شده Plugin، یا یک alias پشتیبانی‌شده backend در CLI. Plugin داخلی Codex مقدار `codex` را ثبت می‌کند؛ Plugin داخلی Anthropic backend CLI با نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` اجازه می‌دهد harnessهای Plugin ثبت‌شده نوبت‌های پشتیبانی‌شده را claim کنند و وقتی هیچ harnessی منطبق نباشد از PI استفاده می‌کند. یک runtime صریح Plugin مانند `id: "codex"` همان harness را الزامی می‌کند و اگر در دسترس نباشد یا fail شود، fail closed می‌شود.
- override محیطی: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` مقدار `id` را برای آن process override می‌کند.
- برای استقرارهای فقط Codex، `model: "openai/gpt-5.5"` و `agentRuntime.id: "codex"` را تنظیم کنید.
- برای استقرارهای Claude CLI، `model: "anthropic/claude-opus-4-7"` را همراه با `agentRuntime.id: "claude-cli"` ترجیح دهید. ارجاع‌های مدل legacy مانند `claude-cli/claude-opus-4-7` هنوز برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب provider/model را canonical نگه دارد و backend اجرایی را در `agentRuntime.id` قرار دهد.
- کلیدهای قدیمی‌تر سیاست runtime توسط `openclaw doctor --fix` به `agentRuntime` بازنویسی می‌شوند.
- انتخاب harness پس از اولین اجرای embedded برای هر شناسه نشست pin می‌شود. تغییرات پیکربندی/محیط روی نشست‌های جدید یا resetشده اثر می‌گذارند، نه روی transcript موجود. نشست‌های legacy که تاریخچه transcript دارند اما pin ثبت‌شده ندارند، PI-pinned در نظر گرفته می‌شوند. `/status` runtime مؤثر را گزارش می‌کند، برای مثال `Runtime: OpenClaw Pi Default` یا `Runtime: OpenAI Codex`.
- این فقط اجرای نوبت agent متنی را کنترل می‌کند. تولید رسانه، vision، PDF، موسیقی، ویدیو، و TTS همچنان از تنظیمات provider/model خود استفاده می‌کنند.

**میانبرهای alias داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

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

aliasهای پیکربندی‌شده شما همیشه بر پیش‌فرض‌ها مقدم هستند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌طور پیش‌فرض `tool_stream` را برای جریان‌دهی فراخوانی ابزار فعال می‌کنند. برای غیرفعال کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

بک‌اندهای CLI اختیاری برای اجرای‌های جایگزینِ فقط متنی (بدون فراخوانی ابزار). به‌عنوان پشتیبان هنگام شکست ارائه‌دهندگان API مفید است.

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
- وقتی `imageArg` مسیرهای فایل را بپذیرد، عبور تصویر پشتیبانی می‌شود.

### `agents.defaults.systemPromptOverride`

کل پرامپت سیستمِ ساخته‌شده توسط OpenClaw را با یک رشته ثابت جایگزین کنید. آن را در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقادیر مختص عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شده پرامپت مفید است.

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

لایه‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانواده مدل اعمال می‌شوند. شناسه‌های مدل خانواده GPT-5 قرارداد رفتاری مشترک را میان ارائه‌دهندگان دریافت می‌کنند؛ `personality` فقط لایه سبک تعامل دوستانه را کنترل می‌کند.

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

اجرای‌های دوره‌ای Heartbeat.

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

- `every`: رشته مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال کردن، آن را روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستم حذف می‌کند و تزریق `HEARTBEAT.md` به زمینه راه‌اندازی اولیه را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را در طول اجرای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: حداکثر زمان مجاز بر حسب ثانیه برای یک نوبت عامل Heartbeat پیش از لغو شدن. برای استفاده از `agents.defaults.timeoutSeconds` تنظیم‌نشده رهایش کنید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` را منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجرای‌های Heartbeat از زمینه راه‌اندازی اولیه سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی اولیه فضای کاری نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه بدون تاریخچه گفت‌وگوی قبلی اجرا می‌شود. همان الگوی ایزوله‌سازی cron `sessionTarget: "isolated"`. هزینه توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجرای‌های Heartbeat در مسیرهای شلوغ اضافه به تعویق می‌افتند: کار زیرعامل یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
- مختص عامل: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر عاملی `heartbeat` را تعریف کند، **فقط همان عامل‌ها** Heartbeatها را اجرا می‌کنند.
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
- `timeoutSeconds`: حداکثر ثانیه‌های مجاز برای یک عملیات Compaction پیش از آنکه OpenClaw آن را لغو کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجه نقطه برش Pi برای نگه داشتن دنباله جدیدترین transcript به‌صورت عین‌به‌عین. `/compact` دستی وقتی به‌طور صریح تنظیم شده باشد از این پیروی می‌کند؛ در غیر این صورت Compaction دستی یک checkpoint سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` راهنمای داخلی نگهداری شناسه مات را هنگام خلاصه‌سازی Compaction در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش مجدد هنگام خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌طور پیش‌فرض فعال است؛ برای رد کردن audit، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از افزوده شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش فعلی را پیش از ارسال پرامپت لغو می‌کند و برای کوتاه کردن نتایج ابزار یا compact و تلاش دوباره، مسیر بازیابی precheck موجود را دوباره به‌کار می‌گیرد. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا به‌طور صریح روی همان جفت پیش‌فرض تنظیم شده باشد، سرفصل‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان fallback قدیمی پذیرفته می‌شوند.
- `model`: بازنویسی اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه اختیاری بایت (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه بگذرد، پیش از اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به transcript جانشین کوچک‌تری بچرخد. وقتی تنظیم نشده یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و تکمیل Compaction اعلان‌های کوتاهی به کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). به‌طور پیش‌فرض غیرفعال است تا Compaction بی‌صدا بماند.
- `memoryFlush`: نوبت agentic بی‌صدا پیش از Compaction خودکار برای ذخیره حافظه‌های پایدار. وقتی این نوبت نگهداری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیره fallback نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

### `agents.defaults.contextPruning`

**نتایج ابزار قدیمی** را پیش از ارسال به LLM از زمینه درون حافظه هرس می‌کند. تاریخچه نشست روی دیسک را تغییر **نمی‌دهد**.

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
- `ttl` کنترل می‌کند که هرس هر چند وقت یک‌بار بتواند دوباره اجرا شود (پس از آخرین تماس cache).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را به‌صورت نرم کوتاه می‌کند، سپس در صورت نیاز نتایج ابزار قدیمی‌تر را به‌صورت سخت پاک می‌کند.

**کوتاه‌سازی نرم** آغاز + پایان را نگه می‌دارد و در میانه `...` درج می‌کند.

**پاک‌سازی سخت** کل نتیجه ابزار را با placeholder جایگزین می‌کند.

نکته‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها بر پایه نویسه هستند (تقریبی)، نه شمارش دقیق توکن.
- اگر کمتر از `keepLastAssistants` پیام assistant وجود داشته باشد، هرس رد می‌شود.

</Accordion>

برای جزئیات رفتار، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### جریان‌دهی بلوکی

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

- کانال‌های غیر Telegram برای فعال کردن پاسخ‌های بلوکی به `*.blockStreaming: true` صریح نیاز دارند.
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های مختص هر حساب). Signal/Slack/Discord/Google Chat به‌طور پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. بازنویسی مختص عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار + قطعه‌بندی، [جریان‌دهی](/fa/concepts/streaming) را ببینید.

### نشانگرهای در حال تایپ

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

<Accordion title="Sandbox details">

**بک‌اند:**

- `docker`: زمان اجرای محلی Docker (پیش‌فرض)
- `ssh`: زمان اجرای راه دور عمومی مبتنی بر SSH
- `openshell`: زمان اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات ویژه زمان اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی بک‌اند SSH:**

- `target`: هدف SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه مطلق راه دور که برای فضاهای کاری هر دامنه استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH پاس داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefهایی که OpenClaw هنگام اجرا در فایل‌های موقت مادی‌سازی می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: گزینه‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` اولویت دارد
- `certificateData` بر `certificateFile` اولویت دارد
- `knownHostsData` بر `knownHostsFile` اولویت دارد
- مقدارهای `*Data` مبتنی بر SecretRef پیش از شروع نشست سندباکس، از اسنپ‌شات فعال زمان اجرای اسرار resolve می‌شوند

**رفتار بک‌اند SSH:**

- پس از ایجاد یا ایجاد دوباره، فضای کاری راه دور را یک بار seed می‌کند
- سپس فضای کاری SSH راه دور را مرجع اصلی نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه دور را به‌صورت خودکار به میزبان همگام‌سازی نمی‌کند
- از کانتینرهای مرورگر سندباکس پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری سندباکس هر دامنه زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری سندباکس در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent` mount می‌شود
- `rw`: فضای کاری عامل با دسترسی خواندن/نوشتن در `/workspace` mount می‌شود

**دامنه:**

- `session`: کانتینر + فضای کاری برای هر نشست
- `agent`: یک کانتینر + فضای کاری برای هر عامل (پیش‌فرض)
- `shared`: کانتینر و فضای کاری مشترک (بدون جداسازی میان‌نشستی)

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

- `mirror`: پیش از اجرا، محیط دوردست را از محلی مقداردهی اولیه می‌کند و پس از اجرا دوباره همگام‌سازی می‌کند؛ فضای کاری محلی مرجع اصلی می‌ماند
- `remote`: هنگام ایجاد سندباکس، محیط دوردست را یک‌بار مقداردهی اولیه می‌کند و سپس فضای کاری دوردست را مرجع اصلی نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که بیرون از OpenClaw انجام می‌شوند، پس از مرحله مقداردهی اولیه به‌طور خودکار در سندباکس همگام‌سازی نمی‌شوند.
انتقال از طریق SSH به سندباکس OpenShell انجام می‌شود، اما Plugin مالک چرخه عمر سندباکس و همگام‌سازی اختیاری mirror است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل‌نوشتن و کاربر root نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است، مگر اینکه صراحتاً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` را تنظیم کنید (حالت اضطراری).

**پیوست‌های ورودی** در `media/inbound/*` داخل فضای کاری فعال آماده‌سازی می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان اضافی را mount می‌کند؛ bindهای سراسری و مختص عامل با هم ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. نشانی noVNC در system prompt تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر منتشر می‌کند (به‌جای افشای گذرواژه در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) نشست‌های سندباکس‌شده را از هدف‌گرفتن مرورگر میزبان بازمی‌دارد.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط وقتی صراحتاً اتصال bridge سراسری می‌خواهید، آن را روی `bridge` تنظیم کنید.
- `cdpSourceRange` می‌تواند به‌صورت اختیاری ورود CDP در لبه کانتینر را به یک بازه CIDR محدود کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` فقط دایرکتوری‌های میزبان اضافی را داخل کانتینر مرورگر سندباکس mount می‌کند. وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
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
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu`
    به‌طور پیش‌فرض فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد،
    می‌توان آن‌ها را با `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` افزونه‌ها را در صورت وابستگی گردش‌کارتان
    به آن‌ها دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از
    محدودیت فرایند پیش‌فرض Chromium مقدار `0` را تنظیم کنید.
  - به‌علاوه، وقتی `noSandbox` فعال باشد، `--no-sandbox`.
  - پیش‌فرض‌ها خط مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر، از تصویر مرورگر سفارشی با
    entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکس‌سازی مرورگر و `sandbox.docker.binds` فقط مختص Docker هستند.

ساخت تصاویر (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build` به [سندباکس‌سازی § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

### `agents.list` (بازنویسی‌های مختص هر عامل)

از `agents.list[].tts` استفاده کنید تا به یک عامل ارائه‌دهنده TTS، صدا، مدل،
سبک یا حالت TTS خودکار اختصاصی بدهید. بلوک عامل به‌صورت deep-merge روی
`messages.tts` سراسری اعمال می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک محل بمانند، در حالی که عامل‌های جداگانه فقط
فیلدهای صدا یا ارائه‌دهنده موردنیاز خود را بازنویسی می‌کنند. بازنویسی عامل فعال برای پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و
ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و اولویت‌بندی، به [تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides)
مراجعه کنید.

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
- `model`: قالب رشته‌ای، یک مدل اصلی سخت‌گیرانه برای هر عامل تنظیم می‌کند، بدون fallback مدل؛ قالب شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. برای فعال‌کردن fallback برای آن عامل از `{ primary, fallbacks: [...] }` استفاده کنید، یا برای صریح‌کردن رفتار سخت‌گیرانه از `{ primary, fallbacks: [] }`. کارهای Cron که فقط `primary` را بازنویسی می‌کنند، همچنان fallbackهای پیش‌فرض را به ارث می‌برند مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان مخصوص هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های مخصوص عامل مانند `cacheRetention`، `temperature` یا `maxTokens` استفاده کنید، بدون اینکه کل کاتالوگ مدل را تکرار کنید.
- `tts`: بازنویسی‌های اختیاری متن‌به‌گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، پس اعتبارنامه‌های ارائه‌دهنده مشترک و سیاست fallback را در `messages.tts` نگه دارید و اینجا فقط مقدارهای مخصوص پرسونا مانند ارائه‌دهنده، صدا، مدل، سبک، یا حالت خودکار را تنظیم کنید.
- `skills`: فهرست مجاز Skills اختیاری برای هر عامل. اگر حذف شود، عامل در صورت تنظیم‌بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح، به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند، و `[]` یعنی بدون skills.
- `thinkingDefault`: سطح پیش‌فرض اختیاری تفکر برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی بازنویسی مخصوص پیام یا نشست تنظیم نشده باشد، برای این عامل `agents.defaults.thinkingDefault` را بازنویسی می‌کند. پروفایل ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند کدام مقدارها معتبر هستند؛ برای Google Gemini، مقدار `adaptive` تفکر پویای تحت مالکیت ارائه‌دهنده را حفظ می‌کند (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی پیش‌فرض اختیاری استدلال برای هر عامل (`on | off | stream`). وقتی بازنویسی استدلال مخصوص پیام یا نشست تنظیم نشده باشد، برای این عامل `agents.defaults.reasoningDefault` را بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری حالت سریع برای هر عامل (`true | false`). وقتی بازنویسی حالت سریع مخصوص پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `agentRuntime`: بازنویسی اختیاری سیاست runtime سطح‌پایین برای هر عامل. از `{ id: "codex" }` استفاده کنید تا یک عامل فقط Codex باشد درحالی‌که عامل‌های دیگر fallback پیش‌فرض PI را در حالت `auto` نگه می‌دارند.
- `runtime`: توصیف‌گر اختیاری runtime برای هر عامل. وقتی عامل باید به‌صورت پیش‌فرض از نشست‌های هارنس ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی نسبت به workspace، نشانی `http(s)`، یا URI از نوع `data:`.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` که خودشان را هدف می‌گیرند باید مجاز باشند، شناسه درخواست‌کننده را وارد کنید.
- محافظ وراثت sandbox: اگر نشست درخواست‌کننده sandbox شده باشد، `sessions_spawn` هدف‌هایی را که بدون sandbox اجرا می‌شوند رد می‌کند.
- `subagents.requireAgentId`: وقتی true باشد، فراخوانی‌های `sessions_spawn` را که `agentId` را حذف کرده‌اند مسدود می‌کند (انتخاب صریح پروفایل را اجباری می‌کند؛ پیش‌فرض: false).

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
- `match.guildId` / `match.teamId` (اختیاری؛ مخصوص کانال)
- `acp` (اختیاری؛ فقط برای `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتیب تطبیق قطعی:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (دقیق، بدون peer/guild/team)
5. `match.accountId: "*"` (در سطح کانال)
6. عامل پیش‌فرض

در هر سطح، اولین ورودی منطبق در `bindings` برنده است.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) resolve می‌کند و از ترتیب سطح‌های binding مسیر در بالا استفاده نمی‌کند.

### پروفایل‌های دسترسی برای هر عامل

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

<Accordion title="ابزارهای فقط‌خواندنی + workspace">

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

برای جزئیات اولویت، [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) را ببینید.

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

- **`scope`**: راهبرد پایه برای گروه‌بندی نشست‌ها در زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده در یک زمینه کانال، نشست ایزوله خودش را می‌گیرد.
  - `global`: همه شرکت‌کنندگان در یک زمینه کانال، یک نشست مشترک دارند (فقط وقتی استفاده کنید که زمینه مشترک مدنظر است).
- **`dmScope`**: نحوه گروه‌بندی پیام‌های خصوصی.
  - `main`: همه پیام‌های خصوصی نشست اصلی را به اشتراک می‌گذارند.
  - `per-peer`: بر اساس شناسه فرستنده در همه کانال‌ها ایزوله می‌کند.
  - `per-channel-peer`: برای هر کانال + فرستنده ایزوله می‌کند (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: برای هر حساب + کانال + فرستنده ایزوله می‌کند (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: شناسه‌های کانونی را به همتایان دارای پیشوند ارائه‌دهنده نگاشت می‌کند تا نشست‌ها بین کانال‌ها مشترک شوند. فرمان‌های dock مانند `/dock_discord` از همین نگاشت استفاده می‌کنند تا مسیر پاسخ نشست فعال را به همتای کانال پیوندخورده دیگری تغییر دهند؛ [داک کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در زمان محلی `atHour` بازنشانی می‌کند؛ `idle` پس از `idleMinutes` بازنشانی می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بیکاری از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارسازی‌های Cron، اعلان‌های exec، و حسابداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بیکار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های مخصوص هر نوع (`direct`، `group`، `thread`). `dm` قدیمی به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. زمان اجرا همیشه از `"main"` برای سطل اصلی گفت‌وگوی مستقیم استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینه نوبت‌های پاسخ‌وبرگشت بین عامل‌ها هنگام تبادل عامل‌به‌عامل (عدد صحیح، بازه: `0` تا `5`). `0` زنجیره‌سازی پینگ‌پنگ را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. اولین deny برنده است.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگهداشت مخزن نشست.
  - `mode`: `warn` فقط هشدارها را صادر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: حد سن برای ورودی‌های مانده (پیش‌فرض `30d`).
  - `maxEntries`: بیشینه تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). زمان اجرا پاک‌سازی دسته‌ای را با یک بافر کوچک high-water برای سقف‌های اندازه تولیدی می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را بلافاصله اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگهداشت آرشیوهای رونوشت `*.reset.<timestamp>`. پیش‌فرض آن `pruneAfter` است؛ برای غیرفعال کردن، روی `false` تنظیم کنید.
  - `maxDiskBytes`: بودجه اختیاری دیسک برای پوشه نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین artifactها/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض آن `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های نشست وابسته به thread.
  - `enabled`: کلید اصلی پیش‌فرض (ارائه‌دهنده‌ها می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: پیش‌فرض auto-unfocus هنگام نبود فعالیت بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)
  - `maxAgeHours`: پیش‌فرض حداکثر سن سخت بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازه پیش‌فرض برای ایجاد نشست‌های کاری وابسته به thread از `sessions_spawn` و spawnهای thread در ACP. وقتی اتصال‌های thread فعال باشند، پیش‌فرض آن `true` است؛ ارائه‌دهنده‌ها/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینه پیش‌فرض زیرعامل بومی برای spawnهای وابسته به thread (`"fork"` یا `"isolated"`). پیش‌فرض آن `"fork"` است.

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

بازنویسی‌های هر کانال/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

حل‌وفصل (مشخص‌ترین مورد اولویت دارد): حساب → کانال → سراسری. `""` غیرفعال می‌کند و آبشار را متوقف می‌کند. `"auto"` مقدار `[{identity.name}]` را مشتق می‌کند.

**متغیرهای قالب:**

| متغیر             | توضیح               | مثال                        |
| ----------------- | ------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل       | `claude-opus-4-6`           |
| `{modelFull}`     | شناسه کامل مدل      | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده     | `anthropic`                 |
| `{thinkingLevel}` | سطح تفکر فعلی       | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل       | (همانند `"auto"`)           |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- پیش‌فرض، `identity.emoji` عامل فعال است؛ در غیر این صورت `"👀"`. برای غیرفعال‌سازی، `""` تنظیم کنید.
- بازنویسی‌های هر کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل‌وفصل: حساب → کانال → `messages.ackReaction` → جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: در کانال‌هایی که از واکنش پشتیبانی می‌کنند، مانند Slack، Discord، Telegram، WhatsApp و BlueBubbles، پس از پاسخ واکنش تأیید را حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخه عمر را در Slack، Discord و Telegram فعال می‌کند.
  در Slack و Discord، اگر تنظیم نشده باشد، هنگام فعال بودن واکنش‌های تأیید، واکنش‌های وضعیت همچنان فعال می‌مانند.
  در Telegram، برای فعال‌سازی واکنش‌های وضعیت چرخه عمر، آن را صریحاً روی `true` تنظیم کنید.

### تأخیر تجمیع ورودی

پیام‌های متنی سریع از همان فرستنده را در یک نوبت عامل واحد دسته‌بندی می‌کند. رسانه/پیوست‌ها بلافاصله تخلیه می‌شوند. دستورهای کنترلی تأخیر تجمیع را دور می‌زنند.

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

- `auto` حالت خودکار پیش‌فرض TTS را کنترل می‌کند: `off`، `always`، `inbound` یا `tagged`. `/tts on|off` می‌تواند ترجیحات محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصه‌سازی خودکار بازنویسی می‌کند.
- `modelOverrides` به‌صورت پیش‌فرض فعال است؛ مقدار پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (فعال‌سازی اختیاری).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` برمی‌گردند.
- ارائه‌دهندگان گفتار همراه، متعلق به Plugin هستند. اگر `plugins.allow` تنظیم شده باشد، هر Plugin ارائه‌دهنده TTS را که می‌خواهید استفاده کنید، درج کنید؛ برای مثال `microsoft` برای Edge TTS. شناسه قدیمی ارائه‌دهنده `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطه پایانی OpenAI TTS را بازنویسی می‌کند. ترتیب حل‌وفصل: پیکربندی، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1`.
- وقتی `providers.openai.baseUrl` به نقطه پایانی غیر OpenAI اشاره کند، OpenClaw آن را یک سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌گیرانه‌تر می‌کند.

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

- وقتی چند ارائه‌دهنده گفت‌وگو پیکربندی شده باشند، `talk.provider` باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای مسطح قدیمی گفت‌وگو (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند و به‌صورت خودکار به `talk.providers.<provider>` مهاجرت داده می‌شوند.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` برمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- بازگشت به `ELEVENLABS_API_KEY` فقط وقتی اعمال می‌شود که هیچ کلید API گفت‌وگو پیکربندی نشده باشد.
- `providers.*.voiceAliases` اجازه می‌دهد دستورالعمل‌های گفت‌وگو از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face استفاده‌شده توسط کمک‌برنامه محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS، وقتی کمک‌برنامه همراه `openclaw-mlx-tts` موجود باشد، از طریق آن اجرا می‌شود؛ در غیر این صورت از یک فایل اجرایی در `PATH` استفاده می‌کند. `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌برنامه را برای توسعه بازنویسی می‌کند.
- `speechLocale` شناسه locale بر پایه BCP 47 را که توسط تشخیص گفتار گفت‌وگوی iOS/macOS استفاده می‌شود تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت گفت‌وگو پس از سکوت کاربر چه مدت منتظر بماند پیش از آنکه متن گفتار را ارسال کند. اگر تنظیم نشود، پنجره مکث پیش‌فرض پلتفرم حفظ می‌شود (`700 ms on macOS and Android, 900 ms on iOS`).

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همه کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
