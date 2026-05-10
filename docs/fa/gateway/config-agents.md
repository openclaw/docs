---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و پیوندهای چندعاملی
    - تنظیم رفتار نشست، تحویل پیام و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها، و پیکربندی talk
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-05-10T19:39:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 455c4f0db2ab42b699f920f90639f18d0d370ed4f98a5fa664f154318db99a11
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی در محدودهٔ عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
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

ریشهٔ مخزن اختیاری که در خط Runtime اعلان سیستم نمایش داده می‌شود. اگر تنظیم نشده باشد، OpenClaw با پیمایش رو به بالا از فضای کاری آن را خودکار تشخیص می‌دهد.

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
- برای ارث‌بری از پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
- برای نداشتن Skills، مقدار `agents.list[].skills: []` را تنظیم کنید.
- فهرست غیرخالی `agents.list[].skills` مجموعهٔ نهایی برای آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ساخت خودکار فایل‌های راه‌انداز فضای کاری (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ساخت فایل‌های اختیاری انتخاب‌شدهٔ فضای کاری را رد می‌کند، درحالی‌که همچنان فایل‌های راه‌انداز الزامی را می‌نویسد. مقدارهای معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند فایل‌های راه‌انداز فضای کاری چه زمانی به اعلان سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامهٔ امن (پس از پاسخ کامل‌شدهٔ دستیار) تزریق دوبارهٔ راه‌انداز فضای کاری را رد می‌کنند و اندازهٔ اعلان را کاهش می‌دهند. اجراهای Heartbeat و تلاش‌های دوباره پس از Compaction همچنان زمینه را بازسازی می‌کنند.
- `"never"`: راه‌انداز فضای کاری و تزریق فایل زمینه را در هر نوبت غیرفعال می‌کند. این را فقط برای عامل‌هایی استفاده کنید که چرخهٔ عمر اعلان خود را کاملاً مالک هستند (موتورهای زمینهٔ سفارشی، زمان‌های اجرای بومی که زمینهٔ خودشان را می‌سازند، یا گردش‌کارهای تخصصی بدون راه‌انداز). نوبت‌های Heartbeat و بازیابی Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

حداکثر تعداد نویسه برای هر فایل راه‌انداز فضای کاری پیش از کوتاه‌سازی. پیش‌فرض: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده در همهٔ فایل‌های راه‌انداز فضای کاری. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

اعلان قابل‌مشاهده برای عامل در اعلان سیستم را هنگام کوتاه شدن زمینهٔ راه‌انداز کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن اعلان کوتاه‌سازی را به اعلان سیستم تزریق نکن.
- `"once"`: برای هر امضای کوتاه‌سازی یکتا، یک بار اعلان کوتاهی تزریق کن (توصیه‌شده).
- `"always"`: هر بار که کوتاه‌سازی وجود دارد، در هر اجرا اعلان کوتاهی تزریق کن.

شمارش‌های خام/تزریق‌شدهٔ دقیق و فیلدهای تنظیم پیکربندی در تشخیص‌هایی مانند
گزارش‌های زمینه/وضعیت و گزارش‌ها باقی می‌مانند؛ زمینهٔ معمول کاربر/زمان اجرای WebChat فقط
اعلان کوتاه بازیابی را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشهٔ مالکیت بودجهٔ زمینه

OpenClaw چندین بودجهٔ اعلان/زمینهٔ پرحجم دارد و این بودجه‌ها
عمداً بر اساس زیرسامانه جدا شده‌اند، نه اینکه همه از طریق یک
تنظیم عمومی عبور کنند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق معمول راه‌انداز فضای کاری.
- `agents.defaults.startupContext.*`:
  پیش‌درآمد یک‌بارهٔ اجرای مدل برای بازنشانی/راه‌اندازی، شامل فایل‌های روزانهٔ اخیر
  `memory/*.md`. فرمان‌های گفت‌وگوی سادهٔ `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشردهٔ Skills که به اعلان سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  بریده‌های محدود زمان اجرا و بلوک‌های تزریق‌شدهٔ متعلق به زمان اجرا.
- `memory.qmd.limits.*`:
  اندازه‌گذاری قطعهٔ جست‌وجوی حافظهٔ نمایه‌شده و تزریق.

فقط زمانی از بازنویسی متناظر هر عامل استفاده کنید که یک عامل به بودجهٔ متفاوتی
نیاز داشته باشد:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد راه‌اندازی نوبت اول را که در اجراهای مدل بازنشانی/راه‌اندازی تزریق می‌شود کنترل می‌کند.
فرمان‌های گفت‌وگوی سادهٔ `/new` و `/reset` بازنشانی را بدون فراخوانی
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

پیش‌فرض‌های مشترک برای سطح‌های زمینهٔ زمان اجرای محدود.

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

- `memoryGetMaxChars`: سقف پیش‌فرض بریدهٔ `memory_get` پیش از اضافه شدن
  فرادادهٔ کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجرهٔ خط پیش‌فرض `memory_get` وقتی `lines` حذف
  شده باشد.
- `toolResultMaxChars`: سقف زندهٔ نتیجهٔ ابزار که برای نتایج پایدارشده و
  بازیابی سرریز استفاده می‌شود.
- `postCompactionMaxChars`: سقف بریدهٔ AGENTS.md که هنگام تزریق نوسازی
  پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

بازنویسی هر عامل برای تنظیمات مشترک `contextLimits`. فیلدهای حذف‌شده از
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

سقف سراسری برای فهرست فشردهٔ Skills که به اعلان سیستم تزریق می‌شود. این
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

بازنویسی هر عامل برای بودجهٔ اعلان Skills.

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

حداکثر اندازهٔ پیکسل برای بلندترین ضلع تصویر در بلوک‌های تصویر رونوشت/ابزار پیش از فراخوانی‌های ارائه‌دهنده.
پیش‌فرض: `1200`.

مقادیر پایین‌تر معمولاً مصرف توکن بینایی و اندازهٔ بار درخواست را برای اجراهای سنگین از نظر اسکرین‌شات کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

منطقهٔ زمانی برای زمینهٔ اعلان سیستم (نه مهرهای زمانی پیام). به منطقهٔ زمانی میزبان بازمی‌گردد.

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

- `model`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - فرم رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - فرم شیء، مدل اصلی به‌همراه مدل‌های جایگزین مرتب‌شده برای failover را تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط مسیر ابزار `image` به‌عنوان پیکربندی مدل بینایی آن استفاده می‌شود.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نتواند ورودی تصویر را بپذیرد، برای مسیریابی جایگزین استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های تنها برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه تنها به‌طور یکتا با یک ورودی پیکربندی‌شده با قابلیت تصویر در `models.providers.*.models` مطابقت داشته باشد، OpenClaw آن را به آن provider نسبت می‌دهد. مطابقت‌های پیکربندی‌شده مبهم به پیشوند صریح provider نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده‌ای که تصویر تولید کند استفاده می‌شود.
  - مقادیر رایج: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini،‏ `fal/fal-ai/flux/dev` برای fal،‏ `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینه شفاف در OpenAI.
  - اگر مستقیماً یک provider/model را انتخاب می‌کنید، احراز هویت provider متناظر را هم پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`،‏ `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`،‏ `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض provider متکی به احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید تصویر را به‌ترتیب شناسه provider امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` استفاده می‌شود.
  - مقادیر رایج: `google/lyria-3-clip-preview`،‏ `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض provider متکی به احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید موسیقی را به‌ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیماً یک provider/model را انتخاب می‌کنید، احراز هویت/کلید API provider متناظر را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید ویدئو و ابزار داخلی `video_generate` استفاده می‌شود.
  - مقادیر رایج: `qwen/wan2.6-t2v`،‏ `qwen/wan2.6-i2v`،‏ `qwen/wan2.6-r2v`،‏ `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض provider متکی به احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید ویدئو را به‌ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیماً یک provider/model را انتخاب می‌کنید، احراز هویت/کلید API provider متناظر را هم پیکربندی کنید.
  - provider تولید ویدئوی Qwen همراه بسته، حداکثر ۱ ویدئوی خروجی، ۱ تصویر ورودی، ۴ ویدئوی ورودی، مدت ۱۰ ثانیه، و گزینه‌های سطح provider یعنی `size`،‏ `aspectRatio`،‏ `resolution`،‏ `audio` و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل resolveشده نشست/پیش‌فرض fallback می‌کند.
- `pdfMaxBytesMb`: حد پیش‌فرض اندازه PDF برای ابزار `pdf` وقتی `maxBytesMb` هنگام فراخوانی پاس داده نشده باشد.
- `pdfMaxPages`: حداکثر صفحات پیش‌فرضی که در حالت fallback استخراج در ابزار `pdf` در نظر گرفته می‌شوند.
- `verboseDefault`: سطح verbose پیش‌فرض برای agentها. مقادیر: `"off"`،‏ `"on"`،‏ `"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خط‌های ابزار پیش‌نویس پیشرفت. مقادیر: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (در صورت وجود، دستور/جزئیات خام را اضافه می‌کند). مقدار `agents.list[].toolProgressDetail` مخصوص هر agent این پیش‌فرض را override می‌کند.
- `reasoningDefault`: نمایانی reasoning پیش‌فرض برای agentها. مقادیر: `"off"`،‏ `"on"`،‏ `"stream"`. مقدار `agents.list[].reasoningDefault` مخصوص هر agent این پیش‌فرض را override می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای مالکان، فرستنده‌های مجاز، یا زمینه‌های Gateway با operator-admin اعمال می‌شوند، آن هم وقتی هیچ override برای reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح پیش‌فرض خروجی elevated برای agentها. مقادیر: `"off"`،‏ `"on"`،‏ `"ask"`،‏ `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلاً `openai/gpt-5.5` برای دسترسی با کلید API OpenAI یا Codex OAuth). اگر provider را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس یک مطابقت یکتای provider پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط بعد از آن به provider پیش‌فرض پیکربندی‌شده fallback می‌کند (رفتار سازگاری منسوخ‌شده، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن provider دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض قدیمی مربوط به provider حذف‌شده، به اولین provider/model پیکربندی‌شده fallback می‌کند.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (خاص provider، برای مثال `temperature`،‏ `maxTokens`،‏ `cacheRetention`،‏ `context1m`،‏ `responsesServerCompaction`،‏ `responsesCompactThreshold`،‏ `chat_template_kwargs`،‏ `extra_body`/`extraBody`) باشد.
  - برای نمایش همه مدل‌های کشف‌شده برای providerهای انتخاب‌شده بدون فهرست‌کردن دستی تک‌تک شناسه‌های مدل، از ورودی‌های `provider/*` مانند `"openai-codex/*": {}` یا `"vllm/*": {}` استفاده کنید.
  - ویرایش‌های ایمن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های allowlist موجود را حذف کنند رد می‌کند، مگر اینکه `--replace` را پاس دهید.
  - جریان‌های پیکربندی/onboarding محدود به provider، مدل‌های provider انتخاب‌شده را در این map ادغام می‌کنند و providerهای نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌طور خودکار فعال می‌شود. برای توقف تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای override کردن آستانه از `params.responsesCompactThreshold` استفاده کنید. [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری provider که به همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلاً `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (در سطح مدل) override می‌شود، سپس `agents.list[].params` (شناسه agent مطابق) بر اساس کلید override می‌کند. برای جزئیات، [Prompt Caching](/fa/reference/prompt-caching) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON پیشرفته pass-through که در بدنه‌های درخواست `api: "openai-completions"` برای proxyهای سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده برخورد کند، extra body برنده می‌شود؛ مسیرهای completions غیربومی همچنان پس از آن `store` مخصوص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` وقتی thinking خاموش است، Plugin همراه vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح، پیش‌فرض‌های تولیدشده را override می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. برای کنترل‌های thinking در Qwen با vLLM، روی آن ورودی مدل `params.qwenThinkingFormat` را به `"chat-template"` یا `"top-level"` تنظیم کنید.
- `compat.thinkingFormat`: سبک payload thinking سازگار با OpenAI. برای `enable_thinking` سطح بالای سبک Qwen از `"qwen"` استفاده کنید، یا برای `chat_template_kwargs.enable_thinking` در backendهای خانواده Qwen که kwargs سطح درخواست chat-template را پشتیبانی می‌کنند، مانند vLLM، از `"qwen-chat-template"` استفاده کنید. OpenClaw، thinking غیرفعال را به `false` و thinking فعال را به `true` نگاشت می‌کند.
- `compat.supportedReasoningEfforts`: فهرست effortهای reasoning سازگار با OpenAI در سطح مدل. برای endpointهای سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw،‏ `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی CLI مربوط به agent، و اعتبارسنجی `llm-task` برای آن provider/model پیکربندی‌شده نمایش می‌دهد. وقتی backend برای یک سطح canonical به مقدار خاص provider نیاز دارد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: opt-in مخصوص Z.AI برای thinking حفظ‌شده. وقتی فعال باشد و thinking روشن باشد، OpenClaw،‏ `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ [thinking در Z.AI و thinking حفظ‌شده](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `localService`: مدیر فرایند اختیاری در سطح provider برای سرورهای مدل محلی/self-hosted. وقتی مدل انتخاب‌شده به آن provider تعلق داشته باشد، OpenClaw،‏ `healthUrl` (یا `baseUrl + "/models"`) را probe می‌کند، اگر endpoint down باشد `command` را با `args` شروع می‌کند، تا `readyTimeoutMs` منتظر می‌ماند، سپس درخواست مدل را ارسال می‌کند. `command` باید یک مسیر مطلق باشد. `idleStopMs: 0` فرایند را تا خروج OpenClaw زنده نگه می‌دارد؛ مقدار مثبت، فرایندی را که OpenClaw ایجاد کرده پس از همان تعداد میلی‌ثانیه idle متوقف می‌کند. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- سیاست زمان اجرا باید روی providerها یا مدل‌ها باشد، نه روی `agents.defaults`. برای قوانین سطح provider از `models.providers.<provider>.agentRuntime` استفاده کنید یا برای قوانین خاص مدل از `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` استفاده کنید. مدل‌های agent OpenAI روی provider رسمی OpenAI، به‌طور پیش‌فرض Codex را انتخاب می‌کنند.
- نویسندگان پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`،‏ `/models set-image`، و فرمان‌های افزودن/حذف fallback)، فرم شیء canonical را ذخیره می‌کنند و تا حد امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجرای موازی agentها در میان نشست‌ها (هر نشست همچنان سریالی اجرا می‌شود). پیش‌فرض: ۴.

### سیاست زمان اجرا

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

- `id`: `"auto"`،‏ `"pi"`، یک شناسه harness ثبت‌شده Plugin، یا یک alias پشتیبانی‌شده backend برای CLI. Plugin همراه Codex،‏ `codex` را ثبت می‌کند؛ Plugin همراه Anthropic، backend CLI با نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` اجازه می‌دهد harnessهای ثبت‌شده Plugin، turnهای پشتیبانی‌شده را claim کنند و وقتی هیچ harnessی مطابق نباشد از PI استفاده می‌کند. یک runtime صریح Plugin مانند `id: "codex"` به همان harness نیاز دارد و اگر در دسترس نباشد یا شکست بخورد، به‌صورت بسته fail می‌کند.
- کلیدهای runtime در سطح کل agent قدیمی هستند. `agents.defaults.agentRuntime`،‏ `agents.list[].agentRuntime`، pinهای runtime نشست، و `OPENCLAW_AGENT_RUNTIME` در انتخاب runtime نادیده گرفته می‌شوند. برای حذف مقادیر قدیمی، `openclaw doctor --fix` را اجرا کنید.
- مدل‌های agent OpenAI به‌طور پیش‌فرض از harness Codex استفاده می‌کنند؛ وقتی می‌خواهید این موضوع را صریح کنید، `agentRuntime.id: "codex"` در سطح provider/model همچنان معتبر است.
- برای استقرارهای Claude CLI، ترکیب `model: "anthropic/claude-opus-4-7"` به‌همراه `agentRuntime.id: "claude-cli"` محدود به مدل را ترجیح دهید. ارجاع‌های مدل قدیمی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب provider/model را canonical نگه دارد و backend اجرا را در سیاست runtime مربوط به provider/model قرار دهد.
- این فقط اجرای turn متنی agent را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدئو، و TTS همچنان از تنظیمات provider/model خود استفاده می‌کنند.

**میان‌برهای alias داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

| نام مستعار         | مدل                                    |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

نام‌های مستعار پیکربندی‌شده‌ی شما همیشه بر پیش‌فرض‌ها اولویت دارند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌طور پیش‌فرض `tool_stream` را برای پخش جریانی فراخوانی ابزار فعال می‌کنند. برای غیرفعال کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

بک‌اندهای CLI اختیاری برای اجراهای جایگزین فقط متنی (بدون فراخوانی ابزار). وقتی ارائه‌دهندگان API شکست می‌خورند، به‌عنوان پشتیبان مفید است.

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
- `reseedFromRawTranscriptWhenUncompacted: true` به بک‌اند اجازه می‌دهد نشست‌های نامعتبرشده‌ی ایمن را از انتهای محدود رونویس خام OpenClaw پیش از وجود نخستین خلاصه‌ی Compaction بازیابی کند. تغییرات پروفایل احراز هویت یا دوره‌ی اعتبارنامه همچنان هرگز از خام بازکاشت نمی‌شوند.

### `agents.defaults.systemPromptOverride`

کل پرامپت سیستمی مونتاژشده توسط OpenClaw را با یک رشته‌ی ثابت جایگزین کنید. آن را در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقادیر سطح عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شده‌ی پرامپت مفید است.

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

هم‌پوشانی‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانواده‌ی مدل اعمال می‌شوند. شناسه‌های مدل خانواده‌ی GPT-5 قرارداد رفتاری مشترک را در همه‌ی ارائه‌دهندگان دریافت می‌کنند؛ `personality` فقط لایه‌ی سبک تعامل دوستانه را کنترل می‌کند.

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
- `"off"` فقط لایه‌ی دوستانه را غیرفعال می‌کند؛ قرارداد رفتاری برچسب‌خورده‌ی GPT-5 همچنان فعال می‌ماند.
- اگر این تنظیم مشترک تعیین نشده باشد، `plugins.entries.openai.config.personality` قدیمی همچنان خوانده می‌شود.

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

- `every`: رشته‌ی مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال کردن، روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستم حذف می‌کند و تزریق `HEARTBEAT.md` به زمینه‌ی بوت‌استرپ را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را در طول اجراهای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: بیشینه‌ی زمان مجاز بر حسب ثانیه برای یک نوبت عامل Heartbeat پیش از لغو شدن آن. اگر تنظیم نشود، از `agents.defaults.timeoutSeconds` استفاده می‌شود.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینه‌ی بوت‌استرپ سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های بوت‌استرپ فضای کاری نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه و بدون هیچ تاریخچه‌ی مکالمه‌ی قبلی اجرا می‌شود. همان الگوی ایزوله‌سازی cron `sessionTarget: "isolated"`. هزینه‌ی توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در مسیرهای مشغول اضافی به تعویق می‌افتند: کار زیرعامل یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
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

- `mode`: `default` یا `safeguard` (خلاصه‌سازی تکه‌ای برای تاریخچه‌های طولانی). [Compaction](/fa/concepts/compaction) را ببینید.
- `provider`: شناسه‌ی یک Plugin ثبت‌شده‌ی ارائه‌دهنده‌ی Compaction. وقتی تنظیم شود، به‌جای خلاصه‌سازی داخلی LLM، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به داخلی برمی‌گردد. تنظیم ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: بیشینه‌ی ثانیه‌های مجاز برای یک عملیات Compaction پیش از آنکه OpenClaw آن را لغو کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجه‌ی نقطه‌ی برش Pi برای نگه داشتن انتهای تازه‌تر رونویس به‌صورت کلمه‌به‌کلمه. `/compact` دستی وقتی صریحاً تنظیم شده باشد از این پیروی می‌کند؛ در غیر این صورت Compaction دستی یک چک‌پوینت سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` راهنمای داخلی حفظ شناسه‌های مبهم را در طول خلاصه‌سازی Compaction در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش دوباره هنگام خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌طور پیش‌فرض فعال است؛ برای رد کردن ممیزی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه‌ی ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از افزوده شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش جاری را پیش از ارسال پرامپت لغو می‌کند و از مسیر بازیابی precheck موجود برای کوتاه کردن نتایج ابزار یا Compaction و تلاش دوباره استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا صریحاً روی همان جفت پیش‌فرض تنظیم شده باشد، عنوان‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان fallback سازگاری پذیرفته می‌شوند.
- `model`: بازنویسی اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه‌ی اختیاری بایت (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به یک رونویس جانشین کوچک‌تر بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و پایان Compaction اعلان‌های کوتاهی برای کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). به‌طور پیش‌فرض غیرفعال است تا Compaction بی‌صدا بماند.
- `memoryFlush`: نوبت عاملی بی‌صدا پیش از Compaction خودکار برای ذخیره‌ی حافظه‌های پایدار. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیره‌ی fallback نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

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
- `ttl` کنترل می‌کند هرس هر چند وقت یک‌بار می‌تواند دوباره اجرا شود (پس از آخرین تماس cache).
- هرس ابتدا نتایج بیش‌ازحد بزرگ ابزار را به‌صورت نرم کوتاه می‌کند، سپس در صورت نیاز نتایج قدیمی‌تر ابزار را سخت پاک می‌کند.

**کوتاه‌سازی نرم** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**پاک‌سازی سخت** کل نتیجه‌ی ابزار را با placeholder جایگزین می‌کند.

نکات:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها مبتنی بر نویسه‌اند (تقریبی)، نه شمارش دقیق توکن.
- اگر کمتر از `keepLastAssistants` پیام دستیار وجود داشته باشد، هرس رد می‌شود.

</Accordion>

برای جزئیات رفتار، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### پخش جریانی بلوک

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

- کانال‌های غیر از Telegram برای فعال‌کردن پاسخ‌های بلوکی به `*.blockStreaming: true` صریح نیاز دارند.
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های مخصوص هر حساب). Signal/Slack/Discord/Google Chat به‌طور پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. بازنویسی مخصوص هر عامل: `agents.list[].humanDelay`.

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

- پیش‌فرض‌ها: `instant` برای گفتگوهای مستقیم/اشاره‌ها، `message` برای گفتگوهای گروهی بدون اشاره.
- بازنویسی‌های مخصوص نشست: `session.typingMode`، `session.typingIntervalSeconds`.

[نشانگرهای تایپ](/fa/concepts/typing-indicators) را ببینید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

جعبه‌شن اختیاری برای عامل تعبیه‌شده. برای راهنمای کامل، [جعبه‌شن](/fa/gateway/sandboxing) را ببینید.

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

<Accordion title="جزئیات جعبه‌شن">

**بک‌اند:**

- `docker`: زمان‌اجرای محلی Docker (پیش‌فرض)
- `ssh`: زمان‌اجرای راه‌دور عمومی مبتنی بر SSH
- `openshell`: زمان‌اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات مخصوص زمان‌اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی بک‌اند SSH:**

- `target`: مقصد SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه مطلق راه‌دور که برای فضاهای کاری هر دامنه استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH پاس داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefهایی که OpenClaw در زمان اجرا به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: تنظیمات سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` اولویت دارد
- `certificateData` بر `certificateFile` اولویت دارد
- `knownHostsData` بر `knownHostsFile` اولویت دارد
- مقدارهای `*Data` مبتنی بر SecretRef پیش از شروع نشست جعبه‌شن از عکس‌فوری زمان‌اجرای اسرار فعال حل می‌شوند

**رفتار بک‌اند SSH:**

- پس از ایجاد یا بازایجاد، فضای کاری راه‌دور را یک‌بار مقداردهی اولیه می‌کند
- سپس فضای کاری SSH راه‌دور را مرجع نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه‌دور را به‌طور خودکار به میزبان همگام نمی‌کند
- از کانتینرهای مرورگر جعبه‌شن پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری جعبه‌شن مخصوص دامنه زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری جعبه‌شن در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent` سوار می‌شود
- `rw`: فضای کاری عامل به‌صورت خواندنی/نوشتنی در `/workspace` سوار می‌شود

**دامنه:**

- `session`: کانتینر و فضای کاری مخصوص هر نشست
- `agent`: یک کانتینر و فضای کاری برای هر عامل (پیش‌فرض)
- `shared`: کانتینر و فضای کاری مشترک (بدون جداسازی بین‌نشستی)

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

- `mirror`: پیش از exec، راه‌دور را از محلی مقداردهی اولیه می‌کند و پس از exec همگام‌سازی برگشتی انجام می‌دهد؛ فضای کاری محلی مرجع می‌ماند
- `remote`: هنگام ایجاد جعبه‌شن، راه‌دور را یک‌بار مقداردهی اولیه می‌کند و سپس فضای کاری راه‌دور را مرجع نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که خارج از OpenClaw انجام شوند، پس از مرحله مقداردهی اولیه به‌طور خودکار به جعبه‌شن همگام نمی‌شوند.
انتقال از طریق SSH به جعبه‌شن OpenShell انجام می‌شود، اما Plugin مالک چرخه‌عمر جعبه‌شن و همگام‌سازی آینه‌ای اختیاری است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل‌نوشتن، و کاربر ریشه نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است، مگر اینکه به‌صراحت
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` را تنظیم کنید (راهکار اضطراری).

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال آماده‌سازی می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان اضافی را سوار می‌کند؛ اتصال‌های سراسری و مخصوص هر عامل ادغام می‌شوند.

**مرورگر جعبه‌شن‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. نشانی noVNC در اعلان سیستم تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک نشانی توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای رمز عبور در نشانی مشترک).

- `allowHostControl: false` (پیش‌فرض) نشست‌های جعبه‌شن‌شده را از هدف‌گرفتن مرورگر میزبان منع می‌کند.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط وقتی آن را روی `bridge` تنظیم کنید که صراحتا اتصال bridge سراسری می‌خواهید.
- `cdpSourceRange` به‌صورت اختیاری ورود CDP در لبه کانتینر را به یک بازه CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های میزبان اضافی را فقط در کانتینر مرورگر جعبه‌شن سوار می‌کند. وقتی تنظیم شود (حتی `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
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
    فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توان آن‌ها را با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - اگر گردش‌کار شما به افزونه‌ها وابسته است، `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` آن‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از
    حد پیش‌فرض فرایند Chromium، مقدار `0` را تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها خط پایه تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر از یک تصویر مرورگر سفارشی با
    نقطه‌ورود سفارشی استفاده کنید.

</Accordion>

جعبه‌شن مرورگر و `sandbox.docker.binds` فقط مختص Docker هستند.

ساخت تصویرها (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، فرمان‌های درون‌خطی `docker build` را در [جعبه‌شن § تصویرها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) ببینید.

### `agents.list` (بازنویسی‌های مخصوص هر عامل)

از `agents.list[].tts` استفاده کنید تا به یک عامل ارائه‌دهنده TTS، صدا، مدل،
سبک، یا حالت TTS خودکار اختصاصی بدهید. بلوک عامل روی
`messages.tts` سراسری به‌صورت ادغام عمیق اعمال می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک جا بمانند و عامل‌های جداگانه
فقط فیلدهای صدا یا ارائه‌دهنده‌ای را که نیاز دارند بازنویسی کنند. بازنویسی عامل فعال روی پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و
ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و اولویت، [تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides)
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
- `default`: وقتی چند مورد تنظیم شده باشند، اولی برنده می‌شود (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، نخستین ورودی فهرست پیش‌فرض است.
- `model`: شکل رشته‌ای، یک مدل اصلی سخت‌گیرانه برای هر عامل بدون مدل جایگزین تنظیم می‌کند؛ شکل شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. از `{ primary, fallbacks: [...] }` برای فعال کردن جایگزین برای آن عامل استفاده کنید، یا از `{ primary, fallbacks: [] }` برای صریح کردن رفتار سخت‌گیرانه استفاده کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند، همچنان جایگزین‌های پیش‌فرض را به ارث می‌برند مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان مخصوص هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های اختصاصی عامل مانند `cacheRetention`، `temperature` یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده مشترک و سیاست جایگزین را در `messages.tts` نگه دارید و اینجا فقط مقدارهای مخصوص پرسونا مانند ارائه‌دهنده، صدا، مدل، سبک یا حالت خودکار را تنظیم کنید.
- `skills`: فهرست مجاز اختیاری Skills برای هر عامل. اگر حذف شود، عامل هنگام تنظیم بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح تفکر پیش‌فرض اختیاری برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. پروفایل ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند کدام مقدارها معتبر هستند؛ برای Google Gemini، مقدار `adaptive` تفکر پویا تحت مالکیت ارائه‌دهنده را نگه می‌دارد (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، و `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی استدلال پیش‌فرض اختیاری برای هر عامل (`on | off | stream`). وقتی هیچ بازنویسی استدلال برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری برای حالت سریع در هر عامل (`true | false`). وقتی هیچ بازنویسی حالت سریع برای هر پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `models`: کاتالوگ مدل/بازنویسی‌های زمان اجرای اختیاری برای هر عامل، کلیدگذاری‌شده با شناسه‌های کامل `provider/model`. برای استثناهای زمان اجرای هر عامل از `models["provider/model"].agentRuntime` استفاده کنید.
- `runtime`: توصیف‌گر زمان اجرای اختیاری برای هر عامل. وقتی عامل باید به‌صورت پیش‌فرض از نشست‌های هارنس ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به فضای کاری، URL با `http(s)`، یا URI با `data:`.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هر مورد؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` که خودشان را هدف می‌گیرند باید مجاز باشند، شناسه درخواست‌کننده را اضافه کنید.
- محافظت از وراثت سندباکس: اگر نشست درخواست‌کننده سندباکس شده باشد، `sessions_spawn` هدف‌هایی را که بدون سندباکس اجرا می‌شوند رد می‌کند.
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

### فیلدهای تطبیق اتصال

- `type` (اختیاری): `route` برای مسیریابی عادی (نبودن type به‌صورت پیش‌فرض route است)، `acp` برای اتصال‌های مکالمه پایدار ACP.
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

در هر رده، نخستین ورودی منطبق در `bindings` برنده می‌شود.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق مکالمه (`match.channel` + حساب + `match.peer.id`) حل می‌کند و از ترتیب رده‌های اتصال مسیر در بالا استفاده نمی‌کند.

### پروفایل‌های دسترسی برای هر عامل

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

- **`scope`**: راهبرد پایهٔ گروه‌بندی جلسه برای زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده درون یک زمینهٔ کانال، جلسه‌ای ایزوله دریافت می‌کند.
  - `global`: همهٔ شرکت‌کنندگان در یک زمینهٔ کانال، یک جلسهٔ واحد را به‌اشتراک می‌گذارند (فقط وقتی استفاده کنید که زمینهٔ مشترک مدنظر است).
- **`dmScope`**: نحوهٔ گروه‌بندی پیام‌های مستقیم.
  - `main`: همهٔ پیام‌های مستقیم، جلسهٔ اصلی را به‌اشتراک می‌گذارند.
  - `per-peer`: بر اساس شناسهٔ فرستنده در سراسر کانال‌ها ایزوله می‌کند.
  - `per-channel-peer`: به‌ازای هر کانال + فرستنده ایزوله می‌کند (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: به‌ازای هر حساب + کانال + فرستنده ایزوله می‌کند (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: نگاشتی از شناسه‌های کانونی به همتایان دارای پیشوند ارائه‌دهنده برای اشتراک‌گذاری جلسه بین کانال‌ها. دستورهای dock مانند `/dock_discord` از همان نگاشت برای تغییر مسیر پاسخ جلسهٔ فعال به یک همتای کانال پیوندشدهٔ دیگر استفاده می‌کنند؛ [داک‌کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در ساعت محلی `atHour` بازنشانی می‌کند؛ `idle` پس از `idleMinutes` بازنشانی می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف جلسه استفاده می‌کند؛ تازگی بازنشانی بیکاری از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارباش‌های Cron، اعلان‌های اجرا، و دفترداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما جلسه‌های روزانه/بیکار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های به‌ازای نوع (`direct`، `group`، `thread`). مقدار قدیمی `dm` به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. زمان اجرا همیشه برای سطل اصلی گفت‌وگوی مستقیم از `"main"` استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینهٔ نوبت‌های پاسخ‌وبرگشت بین عامل‌ها هنگام تبادل عامل‌به‌عامل (عدد صحیح، بازه: `0` تا `5`). `0` زنجیره‌سازی پینگ‌پونگ را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. نخستین ردکردن برنده است.
- **`maintenance`**: پاک‌سازی انبار جلسه + کنترل‌های نگهداشت.
  - `mode`: مقدار `warn` فقط هشدار صادر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: آستانهٔ سن برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: بیشینهٔ تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). زمان اجرا پاک‌سازی دسته‌ای را با یک بافر کوچک سطح بالا برای سقف‌های اندازهٔ تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را بلافاصله اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگهداشت برای آرشیوهای رونوشت `*.reset.<timestamp>`. به‌صورت پیش‌فرض برابر `pruneAfter` است؛ برای غیرفعال‌کردن، `false` تنظیم کنید.
  - `maxDiskBytes`: بودجهٔ اختیاری دیسک برای دایرکتوری جلسه‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین مصنوعات/جلسه‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. به‌صورت پیش‌فرض `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های جلسهٔ وابسته به رشته.
  - `enabled`: کلید پیش‌فرض اصلی (ارائه‌دهنده‌ها می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: خارج‌کردن خودکار پیش‌فرض از تمرکز پس از عدم فعالیت، بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینهٔ سن سخت پیش‌فرض بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازهٔ پیش‌فرض برای ساخت جلسه‌های کاری وابسته به رشته از `sessions_spawn` و ایجادهای رشتهٔ ACP. وقتی اتصال‌های رشته فعال باشند به‌صورت پیش‌فرض `true` است؛ ارائه‌دهنده‌ها/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینهٔ زیرعامل بومی پیش‌فرض برای ایجادهای وابسته به رشته (`"fork"` یا `"isolated"`). به‌صورت پیش‌فرض `"fork"` است.

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

حل‌وفصل (مشخص‌ترین مورد برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و آبشار را متوقف می‌کند. `"auto"` از `[{identity.name}]` مشتق می‌شود.

**متغیرهای الگو:**

| متغیر            | توضیح                    | مثال                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل           | `claude-opus-4-6`           |
| `{modelFull}`     | شناسهٔ کامل مدل         | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده         | `anthropic`                 |
| `{thinkingLevel}` | سطح تفکر فعلی           | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل           | (همانند `"auto"`)           |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- به‌صورت پیش‌فرض برابر `identity.emoji` عامل فعال است، وگرنه `"👀"`. برای غیرفعال‌کردن، `""` تنظیم کنید.
- بازنویسی‌های به‌ازای کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل‌وفصل: حساب → کانال → `messages.ackReaction` → جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: تأیید را پس از پاسخ در کانال‌های دارای قابلیت واکنش مانند Slack، Discord، Telegram، WhatsApp، و iMessage حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخهٔ عمر را در Slack، Discord، و Telegram فعال می‌کند.
  در Slack و Discord، تنظیم‌نشده بودن باعث می‌شود وقتی واکنش‌های تأیید فعال‌اند، واکنش‌های وضعیت نیز فعال بمانند.
  در Telegram، برای فعال‌کردن واکنش‌های وضعیت چرخهٔ عمر، آن را صراحتاً روی `true` تنظیم کنید.

### وقفهٔ ورودی

پیام‌های سریع فقط-متن از همان فرستنده را در یک نوبت عامل واحد دسته‌بندی می‌کند. رسانه/پیوست‌ها بلافاصله تخلیه می‌شوند. دستورهای کنترلی از وقفه عبور می‌کنند.

### TTS (متن‌به‌گفتار)

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

- `auto` حالت پیش‌فرض TTS خودکار را کنترل می‌کند: `off`، `always`، `inbound`، یا `tagged`. `/tts on|off` می‌تواند تنظیمات ترجیحی محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصهٔ خودکار بازنویسی می‌کند.
- `modelOverrides` به‌صورت پیش‌فرض فعال است؛ `modelOverrides.allowProvider` به‌صورت پیش‌فرض `false` است (نیازمند انتخاب صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` بازمی‌گردند.
- ارائه‌دهندگان گفتار همراه، متعلق به Plugin هستند. اگر `plugins.allow` تنظیم شده است، هر Plugin ارائه‌دهندهٔ TTS را که می‌خواهید استفاده کنید وارد کنید، برای مثال `microsoft` برای Edge TTS. شناسهٔ قدیمی ارائه‌دهندهٔ `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطهٔ پایانی OpenAI TTS را بازنویسی می‌کند. ترتیب حل‌وفصل، نخست پیکربندی، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1` است.
- وقتی `providers.openai.baseUrl` به یک نقطهٔ پایانی غیر OpenAI اشاره کند، OpenClaw آن را به‌عنوان سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌گیرانه‌تر می‌کند.

---

## گفت‌وگو

پیش‌فرض‌ها برای حالت Talk (macOS/iOS/Android).

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

- وقتی چند ارائه‌دهندهٔ Talk پیکربندی شده باشند، `talk.provider` باید با یک کلید در `talk.providers` مطابقت داشته باشد.
- کلیدهای مسطح قدیمی Talk (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند. `openclaw doctor --fix` را اجرا کنید تا پیکربندی پایدارشده به `talk.providers.<provider>` بازنویسی شود.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` بازمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- جایگزین `ELEVENLABS_API_KEY` فقط وقتی اعمال می‌شود که هیچ کلید API برای Talk پیکربندی نشده باشد.
- `providers.*.voiceAliases` به دستورهای Talk اجازه می‌دهد از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face استفاده‌شده توسط دستیار محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS از طریق دستیار همراه `openclaw-mlx-tts` در صورت وجود اجرا می‌شود، یا از یک فایل اجرایی در `PATH`؛ `OPENCLAW_MLX_TTS_BIN` مسیر دستیار را برای توسعه بازنویسی می‌کند.
- `consultThinkingLevel` سطح تفکر را برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های Control UI Talk realtime `openclaw_agent_consult` کنترل می‌کند. برای حفظ رفتار عادی جلسه/مدل، تنظیم‌نشده رها کنید.
- `consultFastMode` یک بازنویسی یک‌بارهٔ حالت سریع برای مشاوره‌های Control UI Talk realtime تنظیم می‌کند، بدون تغییر تنظیم عادی حالت سریع جلسه.
- `speechLocale` شناسهٔ locale در قالب BCP 47 را که تشخیص گفتار Talk در iOS/macOS استفاده می‌کند تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، تنظیم‌نشده رها کنید.
- `silenceTimeoutMs` کنترل می‌کند حالت Talk پس از سکوت کاربر چه مدت منتظر بماند پیش از آنکه رونوشت را ارسال کند. تنظیم‌نشده بودن، پنجرهٔ مکث پیش‌فرض پلتفرم را حفظ می‌کند (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` دستورالعمل‌های سیستمی روبه‌ارائه‌دهنده را به پرامپت realtime داخلی OpenClaw اضافه می‌کند، تا سبک صدا بدون از دست‌دادن راهنمایی پیش‌فرض `openclaw_agent_consult` قابل پیکربندی باشد.

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همهٔ کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
