---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعاملی
    - تنظیم رفتار جلسه، تحویل پیام، و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-05-12T12:51:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 517aec30ff6c65a269c7e5c8baefb5dc371dabe52d4c38a47a41cae1a1a785e1
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی محدود به عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
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

ریشه اختیاری مخزن که در خط Runtime پرامپت سیستم نمایش داده می‌شود. اگر تنظیم نشده باشد، OpenClaw آن را با پیمایش رو به بالا از workspace به‌صورت خودکار تشخیص می‌دهد.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

فهرست مجاز پیش‌فرض اختیاری برای Skills برای عامل‌هایی که
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
- برای نداشتن Skills، `agents.list[].skills: []` را تنظیم کنید.
- فهرست غیرخالی `agents.list[].skills` مجموعه نهایی برای آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های bootstrap در workspace را غیرفعال می‌کند (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شده workspace را رد می‌کند، در حالی که همچنان فایل‌های bootstrap الزامی نوشته می‌شوند. مقادیر معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند فایل‌های bootstrap مربوط به workspace چه زمانی در پرامپت سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامه ایمن (پس از پاسخ کامل‌شده دستیار) تزریق دوباره bootstrap مربوط به workspace را رد می‌کنند و اندازه پرامپت را کاهش می‌دهند. اجرای Heartbeat و تلاش‌های مجدد پس از Compaction همچنان context را دوباره می‌سازند.
- `"never"`: تزریق bootstrap مربوط به workspace و فایل‌های context را در هر نوبت غیرفعال می‌کند. این گزینه را فقط برای عامل‌هایی به کار ببرید که چرخه عمر پرامپت خود را کاملا در اختیار دارند (موتورهای context سفارشی، زمان‌های اجرای بومی که context خود را می‌سازند، یا گردش‌کارهای تخصصی بدون bootstrap). نوبت‌های Heartbeat و بازیابی پس از Compaction نیز تزریق را رد می‌کنند.

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

حداکثر تعداد کل نویسه‌های تزریق‌شده در همه فایل‌های bootstrap مربوط به workspace. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

اعلان قابل مشاهده برای عامل در پرامپت سیستم را هنگام کوتاه شدن context مربوط به bootstrap کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن اعلان کوتاه‌سازی را در پرامپت سیستم تزریق نکن.
- `"once"`: برای هر امضای یکتای کوتاه‌سازی، یک بار یک اعلان کوتاه تزریق کن (توصیه می‌شود).
- `"always"`: هر بار که کوتاه‌سازی وجود دارد، در هر اجرا یک اعلان کوتاه تزریق کن.

شمارش‌های خام/تزریق‌شده دقیق و فیلدهای تنظیم پیکربندی در diagnostics مانند
گزارش‌های context/status و لاگ‌ها باقی می‌مانند؛ context معمول کاربر/زمان اجرای WebChat فقط
اعلان کوتاه بازیابی را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشه مالکیت بودجه context

OpenClaw چند بودجه پرحجم پرامپت/context دارد، و این بودجه‌ها عمدا به‌جای
عبور همگی از یک تنظیم عمومی، بر اساس زیرسیستم تقسیم شده‌اند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق معمول bootstrap مربوط به workspace.
- `agents.defaults.startupContext.*`:
  پیش‌درآمد یک‌باره اجرای مدل در reset/startup، شامل فایل‌های روزانه اخیر
  `memory/*.md`. فرمان‌های چت خام `/new` و `/reset`
  بدون فراخوانی مدل تایید می‌شوند.
- `skills.limits.*`:
  فهرست فشرده Skills که در پرامپت سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  گزیده‌های محدود زمان اجرا و بلوک‌های تزریق‌شده تحت مالکیت زمان اجرا.
- `memory.qmd.limits.*`:
  قطعه‌های جست‌وجوی memory نمایه‌شده و اندازه تزریق.

فقط زمانی از بازنویسی متناظر برای هر عامل استفاده کنید که یک عامل به بودجه‌ای متفاوت
نیاز داشته باشد:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد startup نوبت اول را که در اجرای مدل هنگام reset/startup تزریق می‌شود کنترل می‌کند.
فرمان‌های چت خام `/new` و `/reset`، reset را بدون فراخوانی
مدل تایید می‌کنند، بنابراین این پیش‌درآمد را بارگذاری نمی‌کنند.

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

پیش‌فرض‌های مشترک برای سطوح محدود context زمان اجرا.

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

- `memoryGetMaxChars`: سقف پیش‌فرض گزیده `memory_get` پیش از اضافه شدن
  فراداده کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجره خط پیش‌فرض `memory_get` هنگامی که `lines`
  حذف شده باشد.
- `toolResultMaxChars`: سقف زنده نتیجه ابزار که برای نتایج پایدارشده و
  بازیابی overflow استفاده می‌شود.
- `postCompactionMaxChars`: سقف گزیده AGENTS.md که در تزریق refresh پس از Compaction
  استفاده می‌شود.

#### `agents.list[].contextLimits`

بازنویسی برای هر عامل برای تنظیم‌های مشترک `contextLimits`. فیلدهای حذف‌شده از
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

بازنویسی بودجه پرامپت Skills برای هر عامل.

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

حداکثر اندازه پیکسلی بلندترین ضلع تصویر در بلوک‌های تصویر transcript/tool پیش از فراخوانی provider.
پیش‌فرض: `1200`.

مقادیر کمتر معمولا مصرف vision-token و اندازه payload درخواست را در اجراهای پر از screenshot کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

منطقه زمانی برای context پرامپت سیستم (نه timestamp پیام‌ها). به منطقه زمانی میزبان fallback می‌کند.

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
  - شکل رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - شکل شیء، مدل اصلی به‌همراه مدل‌های failover مرتب‌شده را تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط مسیر ابزار `image` به‌عنوان پیکربندی مدل بینایی آن استفاده می‌شود.
  - همچنین زمانی که مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر را بپذیرد، برای مسیریابی fallback استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های bare برای سازگاری پذیرفته می‌شوند؛ اگر یک bare ID به‌طور یکتا با یک ورودی پیکربندی‌شده و دارای قابلیت تصویر در `models.providers.*.models` مطابقت داشته باشد، OpenClaw آن را به همان provider منتسب می‌کند. مطابقت‌های پیکربندی‌شده و مبهم به پیشوند صریح provider نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده‌ای که تصویر تولید می‌کند استفاده می‌شود.
  - مقدارهای رایج: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی OpenAI PNG/WebP با پس‌زمینه شفاف.
  - اگر مستقیما یک provider/model را انتخاب می‌کنید، auth متناظر provider را هم پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر auth را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید تصویر را به‌ترتیب provider-id.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` استفاده می‌شود.
  - مقدارهای رایج: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر auth را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید موسیقی را به‌ترتیب provider-id.
  - اگر مستقیما یک provider/model را انتخاب می‌کنید، auth/API key متناظر provider را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید ویدیو و ابزار داخلی `video_generate` استفاده می‌شود.
  - مقدارهای رایج: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر auth را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید ویدیو را به‌ترتیب provider-id.
  - اگر مستقیما یک provider/model را انتخاب می‌کنید، auth/API key متناظر provider را هم پیکربندی کنید.
  - provider تولید ویدیوی Qwen که همراه بسته ارائه می‌شود، حداکثر ۱ ویدیوی خروجی، ۱ تصویر ورودی، ۴ ویدیوی ورودی، مدت ۱۰ ثانیه، و گزینه‌های سطح provider یعنی `size`، `aspectRatio`، `resolution`، `audio`، و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل resolved نشست/پیش‌فرض fallback می‌کند.
- `pdfMaxBytesMb`: محدودیت اندازه پیش‌فرض PDF برای ابزار `pdf` زمانی که `maxBytesMb` در زمان فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: حداکثر تعداد صفحات پیش‌فرض که در حالت fallback استخراج در ابزار `pdf` در نظر گرفته می‌شود.
- `verboseDefault`: سطح verbose پیش‌فرض برای agentها. مقدارها: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خطوط ابزار پیش‌نویس پیشرفت. مقدارها: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (افزودن command/detail خام در صورت وجود). `agents.list[].toolProgressDetail` در سطح هر agent این پیش‌فرض را override می‌کند.
- `reasoningDefault`: نمایانی reasoning پیش‌فرض برای agentها. مقدارها: `"off"`، `"on"`، `"stream"`. `agents.list[].reasoningDefault` در سطح هر agent این پیش‌فرض را override می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای ownerها، فرستنده‌های مجاز، یا contextهای operator-admin gateway اعمال می‌شوند، آن هم زمانی که override reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح پیش‌فرض خروجی elevated برای agentها. مقدارها: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلا `openai/gpt-5.5` برای دسترسی با OpenAI API-key یا Codex OAuth). اگر provider را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس برای همان model id دقیق، یک مطابقت یکتای configured-provider را، و فقط پس از آن به provider پیش‌فرض پیکربندی‌شده fallback می‌کند (رفتار سازگاری منسوخ، پس `provider/model` صریح را ترجیح دهید). اگر آن provider دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض کهنه از provider حذف‌شده، به نخستین provider/model پیکربندی‌شده fallback می‌کند.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (مختص provider، برای مثال `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - از ورودی‌های `provider/*` مانند `"openai-codex/*": {}` یا `"vllm/*": {}` استفاده کنید تا همه مدل‌های کشف‌شده برای providerهای منتخب بدون فهرست‌کردن دستی هر model id نمایش داده شوند.
  - ویرایش‌های ایمن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که باعث حذف ورودی‌های موجود allowlist شوند رد می‌کند، مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های configure/onboarding با scope provider، مدل‌های provider انتخاب‌شده را در این map ادغام می‌کنند و providerهای نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌صورت خودکار فعال می‌شود. برای توقف تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای override کردن آستانه از `params.responsesCompactThreshold`. [OpenAI server-side compaction](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری provider که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلا `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (config): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (برای هر مدل) override می‌شود، سپس `agents.list[].params` (شناسه agent متناظر) بر اساس کلید override می‌کند. برای جزئیات، [Prompt Caching](/fa/reference/prompt-caching) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON pass-through پیشرفته که در بدنه‌های درخواست `api: "openai-completions"` برای proxyهای سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای تولیدشده درخواست تداخل داشته باشد، extra body برنده می‌شود؛ مسیرهای completions غیر native همچنان پس از آن `store` مخصوص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin همراه vLLM به‌صورت خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح پیش‌فرض‌های تولیدشده را override می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. برای کنترل‌های thinking در vLLM Qwen، روی همان ورودی مدل، `params.qwenThinkingFormat` را به `"chat-template"` یا `"top-level"` تنظیم کنید.
- `compat.thinkingFormat`: سبک payload مربوط به thinking سازگار با OpenAI. برای `enable_thinking` سطح بالای سبک Qwen از `"qwen"` استفاده کنید، یا برای `chat_template_kwargs.enable_thinking` روی backendهای خانواده Qwen که request-level chat-template kwargs را پشتیبانی می‌کنند، مانند vLLM، از `"qwen-chat-template"` استفاده کنید. OpenClaw thinking غیرفعال را به `false` و thinking فعال را به `true` نگاشت می‌کند.
- `compat.supportedReasoningEfforts`: فهرست reasoning effort سازگار با OpenAI در سطح هر مدل. برای endpointهای سفارشی که واقعا آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw، `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی agent CLI، و اعتبارسنجی `llm-task` برای آن provider/model پیکربندی‌شده نمایش می‌دهد. زمانی از `compat.reasoningEffortMap` استفاده کنید که backend برای یک سطح canonical مقدار مختص provider می‌خواهد.
- `params.preserveThinking`: opt-in مخصوص Z.AI برای thinking حفظ‌شده. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را دوباره پخش می‌کند؛ [Z.AI thinking and preserved thinking](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `localService`: مدیر فرایند اختیاری در سطح provider برای سرورهای مدل local/self-hosted. وقتی مدل انتخاب‌شده متعلق به آن provider باشد، OpenClaw، `healthUrl` (یا `baseUrl + "/models"`) را probe می‌کند، اگر endpoint down باشد `command` را با `args` شروع می‌کند، تا `readyTimeoutMs` منتظر می‌ماند، سپس درخواست مدل را ارسال می‌کند. `command` باید یک مسیر مطلق باشد. `idleStopMs: 0` فرایند را تا خروج OpenClaw زنده نگه می‌دارد؛ مقدار مثبت، فرایندی را که OpenClaw راه‌اندازی کرده پس از همان تعداد میلی‌ثانیه idle متوقف می‌کند. [Local model services](/fa/gateway/local-model-services) را ببینید.
- سیاست runtime به providerها یا مدل‌ها تعلق دارد، نه به `agents.defaults`. برای قوانین گسترده provider از `models.providers.<provider>.agentRuntime` استفاده کنید، یا برای قوانین مختص مدل از `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`. مدل‌های agent OpenAI روی provider رسمی OpenAI به‌صورت پیش‌فرض Codex را انتخاب می‌کنند.
- نویسنده‌های config که این فیلدها را تغییر می‌دهند (برای مثال `/models set`، `/models set-image`، و commandهای افزودن/حذف fallback) شکل object canonical را ذخیره می‌کنند و تا حد امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجرای agent موازی در میان نشست‌ها (هر نشست همچنان سریالی می‌ماند). پیش‌فرض: ۴.

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
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`، `"pi"`، یک شناسه harness ثبت‌شده Plugin، یا یک alias پشتیبانی‌شده CLI backend. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic، backend مربوط به `claude-cli` CLI را فراهم می‌کند.
- `id: "auto"` اجازه می‌دهد harnessهای ثبت‌شده Plugin، turnهای پشتیبانی‌شده را claim کنند و وقتی هیچ harnessی مطابقت نداشته باشد از PI استفاده می‌کند. یک runtime صریح Plugin مانند `id: "codex"` به همان harness نیاز دارد و اگر در دسترس نباشد یا fail شود، به‌شکل بسته fail می‌کند.
- کلیدهای runtime در سطح کل agent legacy هستند. `agents.defaults.agentRuntime`، `agents.list[].agentRuntime`، pinهای runtime نشست، و `OPENCLAW_AGENT_RUNTIME` در انتخاب runtime نادیده گرفته می‌شوند. برای حذف مقدارهای stale، `openclaw doctor --fix` را اجرا کنید.
- مدل‌های agent OpenAI به‌صورت پیش‌فرض از harness Codex استفاده می‌کنند؛ وقتی می‌خواهید این را صریح کنید، `agentRuntime.id: "codex"` در سطح provider/model همچنان معتبر است.
- برای deploymentهای Claude CLI، `model: "anthropic/claude-opus-4-7"` به‌همراه `agentRuntime.id: "claude-cli"` با scope مدل را ترجیح دهید. ارجاع‌های مدل legacy مانند `claude-cli/claude-opus-4-7` هنوز برای سازگاری کار می‌کنند، اما config جدید باید انتخاب provider/model را canonical نگه دارد و backend اجرا را در سیاست runtime سطح provider/model قرار دهد.
- این فقط اجرای turn متنی agent را کنترل می‌کند. تولید رسانه، vision، PDF، موسیقی، ویدیو، و TTS همچنان از تنظیمات provider/model خود استفاده می‌کنند.

**میان‌برهای alias داخلی** (فقط زمانی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

| نام مستعار        | مدل                                    |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

نام‌های مستعار پیکربندی‌شدهٔ شما همیشه بر پیش‌فرض‌ها غلبه می‌کنند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌طور پیش‌فرض `tool_stream` را برای جریان‌دهی فراخوانی ابزار فعال می‌کنند. برای غیرفعال کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

بک‌اندهای CLI اختیاری برای اجراهای جایگزین فقط‌متنی (بدون فراخوانی ابزار). به‌عنوان پشتیبان هنگام شکست ارائه‌دهندگان API مفید است.

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
- `reseedFromRawTranscriptWhenUncompacted: true` به یک بک‌اند اجازه می‌دهد نشست‌های نامعتبرشدهٔ امن را، پیش از وجود نخستین خلاصهٔ Compaction، از دنبالهٔ محدود رونوشت خام OpenClaw بازیابی کند. تغییرات پروفایل احراز هویت یا دورهٔ اعتبارنامه همچنان هرگز با خام‌کاشتن دوباره انجام نمی‌شوند.

### `agents.defaults.systemPromptOverride`

کل پرامپت سیستمی ساخته‌شده توسط OpenClaw را با یک رشتهٔ ثابت جایگزین کنید. آن را در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقدارهای مختص عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شدهٔ پرامپت مفید است.

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

لایه‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانوادهٔ مدل اعمال می‌شوند. شناسه‌های مدل خانوادهٔ GPT-5 قرارداد رفتاری مشترک را در سراسر ارائه‌دهندگان دریافت می‌کنند؛ `personality` فقط لایهٔ سبک تعامل دوستانه را کنترل می‌کند.

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
- `"off"` فقط لایهٔ دوستانه را غیرفعال می‌کند؛ قرارداد رفتاری GPT-5 برچسب‌خورده فعال می‌ماند.
- مقدار قدیمی `plugins.entries.openai.config.personality` هنوز زمانی خوانده می‌شود که این تنظیم مشترک تنظیم نشده باشد.

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

- `every`: رشتهٔ مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال کردن، روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستم حذف می‌کند و تزریق `HEARTBEAT.md` به زمینهٔ راه‌اندازی را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، محموله‌های هشدار خطای ابزار را هنگام اجراهای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: بیشترین زمان مجاز، بر حسب ثانیه، برای یک نوبت عامل Heartbeat پیش از قطع شدن آن. برای استفاده از `agents.defaults.timeoutSeconds` تنظیم‌نشده رها کنید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` را منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینهٔ راه‌اندازی سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی فضای کاری نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه بدون سابقهٔ گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی مانند cron `sessionTarget: "isolated"`. هزینهٔ توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در مسیرهای شلوغ اضافی به تعویق می‌افتند: کار زیربرنامهٔ عامل یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
- مختص عامل: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر عاملی `heartbeat` را تعریف کند، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
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

- `mode`: `default` یا `safeguard` (خلاصه‌سازی تکه‌ای برای تاریخچه‌های طولانی). [Compaction](/fa/concepts/compaction) را ببینید.
- `provider`: شناسهٔ Plugin ارائه‌دهندهٔ Compaction ثبت‌شده. وقتی تنظیم شود، به‌جای خلاصه‌سازی LLM داخلی، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به داخلی بازمی‌گردد. تنظیم ارائه‌دهنده `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: بیشترین ثانیهٔ مجاز برای یک عملیات Compaction منفرد پیش از آنکه OpenClaw آن را قطع کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجهٔ نقطهٔ برش Pi برای نگه‌داشتن دنبالهٔ جدیدترین رونوشت به‌صورت عین‌به‌عین. `/compact` دستی وقتی صریحاً تنظیم شده باشد به آن احترام می‌گذارد؛ در غیر این صورت Compaction دستی یک نقطهٔ بازرسی سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` هنگام خلاصه‌سازی Compaction، راهنمای داخلی نگه‌داری شناسه‌های مات را در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش مجدد در خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌طور پیش‌فرض فعال است؛ برای رد کردن ممیزی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقهٔ ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از پیوست شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش جاری را پیش از ارسال پرامپت قطع می‌کند و مسیر بازیابی پیش‌بررسی موجود را برای کوتاه‌کردن نتایج ابزار یا فشرده‌سازی و تلاش دوباره بازاستفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا صریحاً روی همان جفت پیش‌فرض تنظیم شود، سرفصل‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان جایگزین میراثی پذیرفته می‌شوند.
- `model`: بازنویسی اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانهٔ بایت اختیاری (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به یک رونوشت جانشین کوچک‌تر بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و پایان Compaction اعلان‌های کوتاه به کاربر می‌فرستد (برای مثال، «در حال فشرده‌سازی زمینه...» و «Compaction کامل شد»). برای ساکت نگه‌داشتن Compaction به‌طور پیش‌فرض غیرفعال است.
- `memoryFlush`: نوبت عاملی بی‌صدا پیش از Compaction خودکار برای ذخیرهٔ حافظه‌های پایدار. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیرهٔ جایگزین نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

### `agents.defaults.runRetries`

مرزهای تکرار تلاش مجدد حلقهٔ اجرای بیرونی برای اجراکنندهٔ Pi جاسازی‌شده، به‌منظور جلوگیری از حلقه‌های اجرای بی‌نهایت هنگام بازیابی از شکست. توجه کنید که این تنظیم در حال حاضر فقط برای زمان‌اجرای عامل جاسازی‌شده اعمال می‌شود، نه زمان‌اجراهای ACP یا CLI.

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

- `base`: تعداد پایهٔ تکرارهای تلاش مجدد اجرا برای حلقهٔ اجرای بیرونی. پیش‌فرض: `24`.
- `perProfile`: تکرارهای تلاش مجدد اجرای اضافی که به‌ازای هر نامزد پروفایل جایگزین اعطا می‌شود. پیش‌فرض: `8`.
- `min`: حداقل حد مطلق برای تکرارهای تلاش مجدد اجرا. پیش‌فرض: `32`.
- `max`: حداکثر حد مطلق برای تکرارهای تلاش مجدد اجرا برای جلوگیری از اجرای مهارنشده. پیش‌فرض: `160`.

### `agents.defaults.contextPruning`

**نتایج قدیمی ابزار** را پیش از ارسال به LLM از زمینهٔ درون‌حافظه‌ای هرس می‌کند. تاریخچهٔ نشست روی دیسک را **تغییر نمی‌دهد**.

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
- `ttl` کنترل می‌کند هرس هر چند وقت یک‌بار می‌تواند دوباره اجرا شود (پس از آخرین تماس با کش).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را به‌صورت نرم کوتاه می‌کند، سپس در صورت نیاز نتایج قدیمی‌تر ابزار را به‌صورت سخت پاک می‌کند.

**کوتاه‌سازی نرم** ابتدا + انتها را نگه می‌دارد و `...` را در وسط درج می‌کند.

**پاک‌سازی سخت** کل نتیجه ابزار را با جانگه‌دار جایگزین می‌کند.

نکات:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها مبتنی بر نویسه هستند (تقریبی)، نه شمارش دقیق توکن.
- اگر تعداد پیام‌های دستیار کمتر از `keepLastAssistants` باشد، هرس رد می‌شود.

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

- کانال‌های غیر از Telegram برای فعال‌سازی پاسخ‌های بلوکی به `*.blockStreaming: true` صریح نیاز دارند.
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های مخصوص هر حساب). Signal/Slack/Discord/Google Chat به‌صورت پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. بازنویسی مخصوص هر عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار + قطعه‌بندی، [جریان‌دهی](/fa/concepts/streaming) را ببینید.

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
- بازنویسی‌های مخصوص هر نشست: `session.typingMode`، `session.typingIntervalSeconds`.

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

**Backend:**

- `docker`: زمان‌اجرای Docker محلی (پیش‌فرض)
- `ssh`: زمان‌اجرای راه‌دور عمومی مبتنی بر SSH
- `openshell`: زمان‌اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات مخصوص زمان‌اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی Backend نوع SSH:**

- `target`: مقصد SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه راه‌دور مطلق که برای فضاهای کاری مخصوص هر دامنه استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتواهای درون‌خطی یا SecretRefهایی که OpenClaw هنگام اجرا در فایل‌های موقت مادی‌سازی می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: پیچ‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` مقدم است
- `certificateData` بر `certificateFile` مقدم است
- `knownHostsData` بر `knownHostsFile` مقدم است
- مقدارهای `*Data` مبتنی بر SecretRef پیش از شروع نشست سندباکس از اسنپ‌شات زمان‌اجرای اسرار فعال حل می‌شوند

**رفتار Backend نوع SSH:**

- فضای کاری راه‌دور را پس از ایجاد یا ایجاد مجدد، یک‌بار بذرگذاری می‌کند
- سپس فضای کاری SSH راه‌دور را مرجع اصلی نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه‌دور را به‌صورت خودکار به میزبان همگام نمی‌کند
- از کانتینرهای مرورگر سندباکس پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری سندباکس مخصوص هر دامنه زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری سندباکس در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent` سوار می‌شود
- `rw`: فضای کاری عامل به‌صورت خواندن/نوشتن در `/workspace` سوار می‌شود

**دامنه:**

- `session`: کانتینر + فضای کاری مخصوص هر نشست
- `agent`: یک کانتینر + فضای کاری برای هر عامل (پیش‌فرض)
- `shared`: کانتینر و فضای کاری مشترک (بدون جداسازی بین‌نشستی)

**پیکربندی Plugin نوع OpenShell:**

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

- `mirror`: پیش از exec، راه‌دور را از محلی بذرگذاری می‌کند و پس از exec دوباره همگام می‌کند؛ فضای کاری محلی مرجع اصلی می‌ماند
- `remote`: هنگام ایجاد سندباکس، راه‌دور را یک‌بار بذرگذاری می‌کند، سپس فضای کاری راه‌دور را مرجع اصلی نگه می‌دارد

در حالت `remote`، ویرایش‌های محلیِ میزبان که بیرون از OpenClaw انجام می‌شوند پس از مرحله بذرگذاری به‌صورت خودکار در سندباکس همگام نمی‌شوند.
انتقال از طریق SSH به سندباکس OpenShell انجام می‌شود، اما Plugin مالک چرخه‌عمر سندباکس و همگام‌سازی آینه‌ای اختیاری است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروج شبکه، ریشه قابل‌نوشتن، و کاربر root نیاز دارد.

**کانتینرها به‌صورت پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌صورت پیش‌فرض مسدود است مگر اینکه به‌صورت صریح
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (اقدام اضطراری) را تنظیم کنید.

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال آماده‌سازی می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان اضافی را سوار می‌کند؛ bindهای سراسری و مخصوص هر عامل ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL نوع noVNC در prompt سیستم تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌صورت پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای گذرواژه در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) نشست‌های سندباکس‌شده را از هدف‌گیری مرورگر میزبان منع می‌کند.
- `network` به‌صورت پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط زمانی آن را روی `bridge` تنظیم کنید که صریحاً اتصال bridge سراسری می‌خواهید.
- `cdpSourceRange` به‌صورت اختیاری ورود CDP را در لبه کانتینر به یک بازه CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های میزبان اضافی را فقط در کانتینر مرورگر سندباکس سوار می‌کند. وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
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
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu` به‌صورت پیش‌فرض
    فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توان آن‌ها را با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - اگر گردش‌کار شما به افزونه‌ها وابسته است، `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    افزونه‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از حد پیش‌فرض
    فرایند Chromium، مقدار `0` را تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها خط مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر از یک تصویر مرورگر سفارشی با یک
    entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکس‌سازی مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصویرها (از checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build` به [سندباکس‌سازی § تصویرها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

### `agents.list` (بازنویسی‌های مخصوص هر عامل)

از `agents.list[].tts` برای دادن ارائه‌دهنده TTS، صدا، مدل، سبک یا حالت خودکار TTS اختصاصی به یک عامل استفاده کنید. بلوک عامل روی `messages.tts` سراسری به‌صورت عمیق ادغام می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک جا بمانند، در حالی که عامل‌های جداگانه فقط فیلدهای صدا یا ارائه‌دهنده‌ای را که نیاز دارند بازنویسی می‌کنند. بازنویسی عامل فعال روی پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status` و ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و تقدم، [تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides) را ببینید.

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

- `id`: شناسه پایدار عامل (الزامی).
- `default`: وقتی چند مورد تنظیم شده باشد، اولین مورد برنده می‌شود (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین ورودی فهرست پیش‌فرض است.
- `model`: شکل رشته‌ای یک مدل اصلی سخت‌گیرانه برای هر عامل و بدون مدل جایگزین تنظیم می‌کند؛ شکل شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. از `{ primary, fallbacks: [...] }` استفاده کنید تا آن عامل را وارد حالت جایگزین کنید، یا از `{ primary, fallbacks: [] }` استفاده کنید تا رفتار سخت‌گیرانه را صریح کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند همچنان جایگزین‌های پیش‌فرض را به ارث می‌برند، مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان مختص هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های مختص عامل مانند `cacheRetention`، `temperature` یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده مشترک و سیاست جایگزین را در `messages.tts` نگه دارید و فقط مقدارهای مختص شخصیت مانند ارائه‌دهنده، صدا، مدل، سبک یا حالت خودکار را اینجا تنظیم کنید.
- `skills`: فهرست مجاز Skills اختیاری برای هر عامل. اگر حذف شود، عامل در صورت تنظیم بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح تفکر پیش‌فرض اختیاری برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. نمایه ارائه‌دهنده/مدل انتخاب‌شده تعیین می‌کند کدام مقدارها معتبر هستند؛ برای Google Gemini، مقدار `adaptive` تفکر پویا و تحت مالکیت ارائه‌دهنده را حفظ می‌کند (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی پیش‌فرض اختیاری استدلال برای هر عامل (`on | off | stream`). وقتی هیچ بازنویسی استدلال پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری برای حالت سریع در هر عامل (`true | false`). وقتی هیچ بازنویسی حالت سریع پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `models`: بازنویسی‌های اختیاری کاتالوگ مدل/زمان اجرا برای هر عامل که با شناسه‌های کامل `provider/model` کلیدگذاری شده‌اند. از `models["provider/model"].agentRuntime` برای استثناهای زمان اجرای مختص عامل استفاده کنید.
- `runtime`: توصیفگر زمان اجرای اختیاری برای هر عامل. وقتی عامل باید به‌طور پیش‌فرض از نشست‌های ACP harness استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی نسبت به فضای کاری، نشانی `http(s)`، یا URI از نوع `data:`.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` خودهدف‌گیر باید مجاز باشند، شناسه درخواست‌کننده را اضافه کنید.
- محافظ ارث‌بری sandbox: اگر نشست درخواست‌کننده sandbox شده باشد، `sessions_spawn` هدف‌هایی را که بدون sandbox اجرا می‌شوند رد می‌کند.
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

### فیلدهای تطبیق اتصال

- `type` (اختیاری): `route` برای مسیریابی عادی (نوع حذف‌شده به‌طور پیش‌فرض route است)، `acp` برای اتصال‌های گفت‌وگوی پایدار ACP.
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
5. `match.accountId: "*"` (سراسری برای کانال)
6. عامل پیش‌فرض

در هر سطح، اولین ورودی مطابق در `bindings` برنده می‌شود.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) حل می‌کند و از ترتیب سطح‌های اتصال مسیر در بالا استفاده نمی‌کند.

### نمایه‌های دسترسی برای هر عامل

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
  - `per-sender` (پیش‌فرض): هر فرستنده در یک زمینهٔ کانال، نشست ایزولهٔ خودش را دریافت می‌کند.
  - `global`: همهٔ شرکت‌کنندگان در یک زمینهٔ کانال یک نشست مشترک دارند (فقط وقتی استفاده کنید که زمینهٔ مشترک مدنظر است).
- **`dmScope`**: نحوهٔ گروه‌بندی DMها.
  - `main`: همهٔ DMها نشست اصلی را به‌اشتراک می‌گذارند.
  - `per-peer`: بر اساس شناسهٔ فرستنده، در سراسر کانال‌ها ایزوله می‌کند.
  - `per-channel-peer`: بر اساس کانال + فرستنده ایزوله می‌کند (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: بر اساس حساب + کانال + فرستنده ایزوله می‌کند (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: نگاشتی از شناسه‌های کانونی به همتایان دارای پیشوند ارائه‌دهنده برای اشتراک‌گذاری نشست میان کانال‌ها. فرمان‌های داک مانند `/dock_discord` از همین نگاشت استفاده می‌کنند تا مسیر پاسخ نشست فعال را به همتای کانال لینک‌شدهٔ دیگری تغییر دهند؛ [داک‌کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در زمان محلی `atHour` بازنشانی می‌شود؛ `idle` پس از `idleMinutes` بازنشانی می‌شود. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بیکاری از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارسازی‌های Cron، اعلان‌های exec، و حسابداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بیکار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های برحسب نوع (`direct`، `group`، `thread`). مقدار قدیمی `dm` به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. زمان اجرا همیشه برای سطل اصلی گفت‌وگوی مستقیم از `"main"` استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینهٔ نوبت‌های پاسخ‌وبرگشت بین عامل‌ها هنگام تبادل عامل‌به‌عامل (عدد صحیح، بازه: `0`-`20`، پیش‌فرض: `5`). مقدار `0` زنجیره‌سازی پینگ‌پنگ را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. نخستین منع، برنده است.
- **`maintenance`**: پاک‌سازی مخزن نشست + کنترل‌های نگه‌داری.
  - `mode`: مقدار `warn` فقط هشدار منتشر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: حد سنی برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: بیشینهٔ تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). زمان اجرا پاک‌سازی دسته‌ای را با یک بافر کوچک سقف بالای آب برای سقف‌های مناسب تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را فوراً اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگه‌داری برای بایگانی‌های رونوشت `*.reset.<timestamp>`. پیش‌فرض آن `pruneAfter` است؛ برای غیرفعال‌کردن، `false` تنظیم کنید.
  - `maxDiskBytes`: بودجهٔ اختیاری دیسک برای پوشهٔ نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین مصنوعات/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض آن `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های نشست متصل به رشته.
  - `enabled`: سوییچ پیش‌فرض اصلی (ارائه‌دهندگان می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: خروج خودکار پیش‌فرض از تمرکز در صورت عدم فعالیت، برحسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینهٔ عمر سخت پیش‌فرض، برحسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `spawnSessions`: گیت پیش‌فرض برای ایجاد نشست‌های کاری متصل به رشته از `sessions_spawn` و ایجاد رشته‌های ACP. وقتی اتصال‌های رشته فعال باشند، پیش‌فرض آن `true` است؛ ارائه‌دهندگان/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینهٔ بومی پیش‌فرض زیرعامل برای ایجادهای متصل به رشته (`"fork"` یا `"isolated"`). پیش‌فرض آن `"fork"` است.

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

بازنویسی‌های برحسب کانال/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

حل‌وفصل (مشخص‌ترین مورد برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و آبشار را متوقف می‌کند. `"auto"` مقدار `[{identity.name}]` را استخراج می‌کند.

**متغیرهای الگو:**

| متغیر             | توضیح                  | مثال                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل          | `claude-opus-4-6`           |
| `{modelFull}`     | شناسهٔ کامل مدل        | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده        | `anthropic`                 |
| `{thinkingLevel}` | سطح فکرکردن فعلی       | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل          | (همانند `"auto"`)           |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- پیش‌فرض آن `identity.emoji` عامل فعال است، در غیر این صورت `"👀"`. برای غیرفعال‌کردن، `""` تنظیم کنید.
- بازنویسی‌های برحسب کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل‌وفصل: حساب → کانال → `messages.ackReaction` → جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: پس از پاسخ، تأیید را در کانال‌های دارای قابلیت واکنش مانند Slack، Discord، Telegram، WhatsApp، و iMessage حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخهٔ عمر را در Slack، Discord، و Telegram فعال می‌کند.
  در Slack و Discord، تنظیم‌نشده‌بودن باعث می‌شود وقتی واکنش‌های تأیید فعال هستند، واکنش‌های وضعیت فعال بمانند.
  در Telegram، برای فعال‌کردن واکنش‌های وضعیت چرخهٔ عمر، آن را صریحاً روی `true` تنظیم کنید.

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

- `auto` حالت پیش‌فرض TTS خودکار را کنترل می‌کند: `off`، `always`، `inbound`، یا `tagged`. `/tts on|off` می‌تواند تنظیمات محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصهٔ خودکار بازنویسی می‌کند.
- `modelOverrides` به‌طور پیش‌فرض فعال است؛ پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند انتخاب آگاهانه).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` برمی‌گردند.
- ارائه‌دهندگان گفتار همراه، تحت مالکیت Plugin هستند. اگر `plugins.allow` تنظیم شده باشد، هر Plugin ارائه‌دهندهٔ TTS را که می‌خواهید استفاده کنید وارد کنید، برای نمونه `microsoft` برای TTS Edge. شناسهٔ قدیمی ارائه‌دهندهٔ `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطهٔ پایانی TTS مربوط به OpenAI را بازنویسی می‌کند. ترتیب حل‌وفصل: پیکربندی، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1`.
- وقتی `providers.openai.baseUrl` به نقطهٔ پایانی غیر OpenAI اشاره کند، OpenClaw آن را به‌عنوان سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌گیرانه‌تر می‌کند.

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

- `talk.provider` وقتی چند ارائه‌دهندهٔ گفت‌وگو پیکربندی شده‌اند، باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی گفت‌وگو (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند. `openclaw doctor --fix` را اجرا کنید تا پیکربندی ماندگارشده به `talk.providers.<provider>` بازنویسی شود.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` برمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- جایگزین `ELEVENLABS_API_KEY` فقط وقتی اعمال می‌شود که هیچ کلید API گفت‌وگو پیکربندی نشده باشد.
- `providers.*.voiceAliases` اجازه می‌دهد دستورالعمل‌های گفت‌وگو از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face مورد استفادهٔ کمک‌کار محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS از طریق کمک‌کار همراه `openclaw-mlx-tts` هنگام وجود، یا یک فایل اجرایی در `PATH` اجرا می‌شود؛ `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌کار را برای توسعه بازنویسی می‌کند.
- `consultThinkingLevel` سطح فکرکردن را برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های `openclaw_agent_consult` بی‌درنگ گفت‌وگوی Control UI کنترل می‌کند. برای حفظ رفتار عادی نشست/مدل، آن را تنظیم‌نشده بگذارید.
- `consultFastMode` یک بازنویسی یک‌بارهٔ حالت سریع را برای مشاوره‌های بی‌درنگ گفت‌وگوی Control UI تنظیم می‌کند، بدون اینکه تنظیم عادی حالت سریع نشست را تغییر دهد.
- `speechLocale` شناسهٔ محلی BCP 47 مورد استفادهٔ تشخیص گفتار گفت‌وگوی iOS/macOS را تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت گفت‌وگو پس از سکوت کاربر چه مدت صبر کند پیش از اینکه رونوشت را بفرستد. تنظیم‌نشده‌بودن، پنجرهٔ مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` دستورالعمل‌های سیستمی روبه‌ارائه‌دهنده را به پرامپت بی‌درنگ داخلی OpenClaw اضافه می‌کند، تا سبک صدا بدون از دست‌دادن راهنمای پیش‌فرض `openclaw_agent_consult` پیکربندی شود.

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همهٔ کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
