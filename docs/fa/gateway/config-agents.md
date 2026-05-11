---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه‌ها، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعاملی
    - تنظیم رفتار نشست، تحویل پیام و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-05-11T20:33:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbc8f9ff61cb1780dc038c71e3b2f2dd2d5d9fe6582ddf76d44a7dba21d13908
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی محدود به عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
`messages.*`، و `talk.*`. برای کانال‌ها، ابزارها، زمان اجرای Gateway، و دیگر
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

ریشه مخزن اختیاری که در خط Runtime پرامپت سیستم نشان داده می‌شود. اگر تنظیم نشود، OpenClaw با پیمایش رو به بالا از فضای کاری، آن را به‌صورت خودکار تشخیص می‌دهد.

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
- برای به‌ارث‌بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
- برای بدون Skills بودن، `agents.list[].skills: []` را تنظیم کنید.
- یک فهرست غیرخالی `agents.list[].skills` مجموعه نهایی برای آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های بوت‌استرپ فضای کاری (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری منتخب فضای کاری را رد می‌کند، در حالی که همچنان فایل‌های بوت‌استرپ الزامی نوشته می‌شوند. مقادیر معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md`، و `IDENTITY.md`.

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

کنترل می‌کند فایل‌های بوت‌استرپ فضای کاری چه زمانی در پرامپت سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامه امن (پس از پاسخ کامل‌شده دستیار) تزریق دوباره بوت‌استرپ فضای کاری را رد می‌کنند و اندازه پرامپت را کاهش می‌دهند. اجرای Heartbeat و تلاش‌های دوباره پس از Compaction همچنان زمینه را بازسازی می‌کنند.
- `"never"`: بوت‌استرپ فضای کاری و تزریق فایل زمینه را در هر نوبت غیرفعال می‌کند. این گزینه را فقط برای عامل‌هایی استفاده کنید که چرخه عمر پرامپت خود را کاملا در اختیار دارند (موتورهای زمینه سفارشی، زمان‌های اجرای بومی که زمینه خود را می‌سازند، یا گردش‌کارهای تخصصی بدون بوت‌استرپ). نوبت‌های Heartbeat و بازیابی Compaction نیز تزریق را رد می‌کنند.

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

اعلان قابل‌مشاهده برای عامل در پرامپت سیستم را هنگام کوتاه‌سازی زمینه بوت‌استرپ کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن اعلان کوتاه‌سازی را در پرامپت سیستم تزریق نکن.
- `"once"`: برای هر امضای کوتاه‌سازی یکتا، یک‌بار یک اعلان کوتاه تزریق کن (توصیه‌شده).
- `"always"`: هر بار که کوتاه‌سازی وجود دارد، در هر اجرا یک اعلان کوتاه تزریق کن.

شمارش‌های خام/تزریق‌شده دقیق و فیلدهای تنظیم پیکربندی در عیب‌یابی‌هایی مانند
گزارش‌های زمینه/وضعیت و لاگ‌ها باقی می‌مانند؛ زمینه معمول کاربر/زمان اجرای WebChat فقط
اعلان کوتاه بازیابی را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نگاشت مالکیت بودجه زمینه

OpenClaw چندین بودجه پرحجم پرامپت/زمینه دارد، و آن‌ها عمدا به‌جای عبور همگی از یک
تنظیم عمومی، بر اساس زیرسامانه جدا شده‌اند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق معمول بوت‌استرپ فضای کاری.
- `agents.defaults.startupContext.*`:
  پیش‌درآمد یک‌باره اجرای مدل در بازنشانی/راه‌اندازی، شامل فایل‌های روزانه اخیر
  `memory/*.md`. دستورهای چت خام `/new` و `/reset` بدون فراخوانی مدل
  تایید می‌شوند.
- `skills.limits.*`:
  فهرست فشرده Skills تزریق‌شده در پرامپت سیستم.
- `agents.defaults.contextLimits.*`:
  گزیده‌های زمان اجرا با حد مشخص و بلوک‌های تزریق‌شده تحت مالکیت زمان اجرا.
- `memory.qmd.limits.*`:
  قطعه جست‌وجوی حافظه نمایه‌شده و اندازه‌گذاری تزریق.

فقط زمانی از بازنویسی متناظر برای هر عامل استفاده کنید که یک عامل به بودجه متفاوتی
نیاز دارد:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد راه‌اندازی نوبت اول را که در اجراهای مدل هنگام بازنشانی/راه‌اندازی تزریق می‌شود کنترل می‌کند.
دستورهای چت خام `/new` و `/reset` بازنشانی را بدون فراخوانی
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

پیش‌فرض‌های مشترک برای سطوح زمینه زمان اجرا با حد مشخص.

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

- `memoryGetMaxChars`: سقف پیش‌فرض گزیده `memory_get` پیش از افزوده‌شدن
  فراداده کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجره خطی پیش‌فرض `memory_get` وقتی `lines` حذف شده باشد.
- `toolResultMaxChars`: سقف زنده نتیجه ابزار که برای نتایج پایدارشده و
  بازیابی سرریز استفاده می‌شود.
- `postCompactionMaxChars`: سقف گزیده AGENTS.md که هنگام تزریق بازآوری
  پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

بازنویسی هر عامل برای تنظیم‌های مشترک `contextLimits`. فیلدهای حذف‌شده از
`agents.defaults.contextLimits` به ارث می‌رسند.

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

حداکثر اندازه پیکسلی برای بلندترین ضلع تصویر در بلوک‌های تصویر رونوشت/ابزار پیش از فراخوانی‌های ارائه‌دهنده.
پیش‌فرض: `1200`.

مقادیر کمتر معمولا مصرف توکن بینایی و اندازه بار درخواست را برای اجراهای پر از اسکرین‌شات کاهش می‌دهند.
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
  - شکل شیء، مدل اصلی به‌همراه مدل‌های جایگزین مرتب‌شده برای خرابی‌گردانی را تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - مسیر ابزار `image` از آن به‌عنوان پیکربندی مدل بینایی استفاده می‌کند.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر را بپذیرد، برای مسیریابی جایگزین استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های تنها برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسهٔ تنها به‌طور یکتا با یک ورودی پیکربندی‌شدهٔ دارای قابلیت تصویر در `models.providers.*.models` منطبق شود، OpenClaw آن را به همان provider وابسته می‌کند. تطابق‌های پیکربندی‌شدهٔ مبهم به پیشوند صریح provider نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده‌ای که تصویر تولید کند استفاده می‌شود.
  - مقادیر معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، ‏`fal/fal-ai/flux/dev` برای fal، ‏`openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP شفاف‌پس‌زمینهٔ OpenAI.
  - اگر provider/model را مستقیم انتخاب می‌کنید، احراز هویت provider متناظر را هم پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، ‏`OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک provider پیش‌فرضِ دارای پشتوانهٔ احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شدهٔ باقی‌ماندهٔ تولید تصویر را به‌ترتیب شناسهٔ provider امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید موسیقی و ابزار توکار `music_generate` استفاده می‌شود.
  - مقادیر معمول: `google/lyria-3-clip-preview`، ‏`google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک provider پیش‌فرضِ دارای پشتوانهٔ احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شدهٔ باقی‌ماندهٔ تولید موسیقی را به‌ترتیب شناسهٔ provider امتحان می‌کند.
  - اگر provider/model را مستقیم انتخاب می‌کنید، احراز هویت/کلید API provider متناظر را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید ویدئو و ابزار توکار `video_generate` استفاده می‌شود.
  - مقادیر معمول: `qwen/wan2.6-t2v`، ‏`qwen/wan2.6-i2v`، ‏`qwen/wan2.6-r2v`، ‏`qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک provider پیش‌فرضِ دارای پشتوانهٔ احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شدهٔ باقی‌ماندهٔ تولید ویدئو را به‌ترتیب شناسهٔ provider امتحان می‌کند.
  - اگر provider/model را مستقیم انتخاب می‌کنید، احراز هویت/کلید API provider متناظر را هم پیکربندی کنید.
  - provider توکار تولید ویدئوی Qwen تا ۱ ویدئوی خروجی، ۱ تصویر ورودی، ۴ ویدئوی ورودی، مدت‌زمان ۱۰ ثانیه، و گزینه‌های سطح provider شامل `size`، ‏`aspectRatio`، ‏`resolution`، ‏`audio` و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF به `imageModel` و سپس به مدل حل‌شدهٔ نشست/پیش‌فرض برمی‌گردد.
- `pdfMaxBytesMb`: حد اندازهٔ پیش‌فرض PDF برای ابزار `pdf` وقتی `maxBytesMb` هنگام فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: حداکثر تعداد صفحهٔ پیش‌فرض که در حالت جایگزین استخراج در ابزار `pdf` در نظر گرفته می‌شود.
- `verboseDefault`: سطح verbose پیش‌فرض برای agentها. مقادیر: `"off"`، ‏`"on"`، ‏`"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خطوط ابزار پیش‌نویس پیشرفت. مقادیر: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (افزودن فرمان/جزئیات خام در صورت دسترس بودن). مقدار `agents.list[].toolProgressDetail` برای هر agent این پیش‌فرض را بازنویسی می‌کند.
- `reasoningDefault`: نمایش پیش‌فرض reasoning برای agentها. مقادیر: `"off"`، ‏`"on"`، ‏`"stream"`. مقدار `agents.list[].reasoningDefault` برای هر agent این پیش‌فرض را بازنویسی می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای مالکان، فرستندگان مجاز، یا زمینه‌های Gateway مدیرِ اپراتور اعمال می‌شوند، آن هم وقتی هیچ بازنویسی reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح پیش‌فرض خروجی elevated برای agentها. مقادیر: `"off"`، ‏`"on"`، ‏`"ask"`، ‏`"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلاً `openai/gpt-5.5` برای کلید API ‏OpenAI یا دسترسی Codex OAuth). اگر provider را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس یک تطابق یکتای provider پیکربندی‌شده برای همان شناسهٔ دقیق مدل، و فقط بعد از آن به provider پیش‌فرض پیکربندی‌شده برمی‌گردد (رفتار سازگاری منسوخ‌شده، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن provider دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش پیش‌فرض منقضیِ provider حذف‌شده، به اولین provider/model پیکربندی‌شده برمی‌گردد.
- `models`: کاتالوگ مدل پیکربندی‌شده و فهرست مجاز برای `/model`. هر ورودی می‌تواند شامل `alias` (میانبر) و `params` (ویژهٔ provider، برای مثال `temperature`، ‏`maxTokens`، ‏`cacheRetention`، ‏`context1m`، ‏`responsesServerCompaction`، ‏`responsesCompactThreshold`، ‏`chat_template_kwargs`، ‏`extra_body`/`extraBody`) باشد.
  - از ورودی‌های `provider/*` مانند `"openai-codex/*": {}` یا `"vllm/*": {}` استفاده کنید تا همهٔ مدل‌های کشف‌شده برای providerهای انتخاب‌شده بدون فهرست‌کردن دستی تک‌تک شناسه‌های مدل نمایش داده شوند.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های موجود فهرست مجاز را حذف کنند رد می‌کند، مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های پیکربندی/آنبوردینگِ محدود به provider، مدل‌های provider انتخاب‌شده را در این map ادغام می‌کنند و providerهای نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌طور خودکار فعال می‌شود. برای جلوگیری از تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای بازنویسی آستانه از `params.responsesCompactThreshold` استفاده کنید. به [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) مراجعه کنید.
- `params`: پارامترهای پیش‌فرض سراسری provider که روی همهٔ مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلاً `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایهٔ سراسری) توسط `agents.defaults.models["provider/model"].params` (برای هر مدل) بازنویسی می‌شود، سپس `agents.list[].params` (شناسهٔ agent منطبق) بر اساس کلید بازنویسی می‌کند. برای جزئیات به [Prompt Caching](/fa/reference/prompt-caching) مراجعه کنید.
- `params.extra_body`/`params.extraBody`: JSON عبوری پیشرفته که در بدنه‌های درخواست `api: "openai-completions"` برای proxyهای سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده تداخل داشته باشد، بدنهٔ اضافی برنده می‌شود؛ مسیرهای completions غیربومی همچنان بعداً `store` مخصوص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin توکار vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح پیش‌فرض‌های تولیدشده را بازنویسی می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. برای کنترل‌های thinking در Qwen vLLM، مقدار `params.qwenThinkingFormat` را روی `"chat-template"` یا `"top-level"` در همان ورودی مدل تنظیم کنید.
- `compat.thinkingFormat`: سبک payload مربوط به thinking سازگار با OpenAI. از `"qwen"` برای `enable_thinking` سطح بالای سبک Qwen، یا از `"qwen-chat-template"` برای `chat_template_kwargs.enable_thinking` روی backendهای خانوادهٔ Qwen که kwargs مربوط به chat-template در سطح درخواست را پشتیبانی می‌کنند، مانند vLLM، استفاده کنید. OpenClaw thinking غیرفعال را به `false` و thinking فعال را به `true` نگاشت می‌کند.
- `compat.supportedReasoningEfforts`: فهرست effortهای reasoning سازگار با OpenAI برای هر مدل. برای endpointهای سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw گزینهٔ `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی CLI agent، و اعتبارسنجی `llm-task` برای آن provider/model پیکربندی‌شده نمایش می‌دهد. وقتی backend برای یک سطح استاندارد به مقدار ویژهٔ provider نیاز دارد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: گزینهٔ فقط مخصوص Z.AI برای حفظ thinking. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ به [thinking و thinking حفظ‌شده در Z.AI](/fa/providers/zai#thinking-and-preserved-thinking) مراجعه کنید.
- `localService`: مدیر فرایند اختیاری در سطح provider برای سرورهای مدل محلی/خودمیزبان. وقتی مدل انتخاب‌شده متعلق به آن provider باشد، OpenClaw ‏`healthUrl` (یا `baseUrl + "/models"`) را probe می‌کند، اگر endpoint پایین باشد `command` را با `args` شروع می‌کند، تا `readyTimeoutMs` منتظر می‌ماند، سپس درخواست مدل را ارسال می‌کند. `command` باید مسیر مطلق باشد. `idleStopMs: 0` فرایند را تا خروج OpenClaw زنده نگه می‌دارد؛ مقدار مثبت، فرایند راه‌اندازی‌شده توسط OpenClaw را پس از آن تعداد میلی‌ثانیهٔ بیکاری متوقف می‌کند. به [سرویس‌های مدل محلی](/fa/gateway/local-model-services) مراجعه کنید.
- سیاست زمان اجرا متعلق به providerها یا مدل‌هاست، نه `agents.defaults`. برای قواعد سراسری provider از `models.providers.<provider>.agentRuntime` استفاده کنید، یا برای قواعد ویژهٔ مدل از `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` استفاده کنید. مدل‌های agent ‏OpenAI روی provider رسمی OpenAI به‌طور پیش‌فرض Codex را انتخاب می‌کنند.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`، ‏`/models set-image`، و فرمان‌های افزودن/حذف fallback) شکل شیء استاندارد را ذخیره می‌کنند و تا حد امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجرای موازی agentها در نشست‌ها (هر نشست همچنان سریالی می‌ماند). پیش‌فرض: 4.

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

- `id`: ‏`"auto"`، ‏`"pi"`، شناسهٔ harness ثبت‌شدهٔ Plugin، یا یک alias پشتیبانی‌شدهٔ backend ‏CLI. Plugin توکار Codex مقدار `codex` را ثبت می‌کند؛ Plugin توکار Anthropic، backend ‏CLI با نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` اجازه می‌دهد harnessهای ثبت‌شدهٔ Plugin نوبت‌های پشتیبانی‌شده را claim کنند و وقتی هیچ harness منطبق نباشد از PI استفاده می‌کند. یک زمان اجرای صریح Plugin مانند `id: "codex"` به همان harness نیاز دارد و اگر در دسترس نباشد یا شکست بخورد، به‌صورت بسته شکست می‌خورد.
- کلیدهای زمان اجرای کل agent قدیمی هستند. `agents.defaults.agentRuntime`، ‏`agents.list[].agentRuntime`، pinهای زمان اجرای نشست، و `OPENCLAW_AGENT_RUNTIME` در انتخاب زمان اجرا نادیده گرفته می‌شوند. برای حذف مقادیر منسوخ، `openclaw doctor --fix` را اجرا کنید.
- مدل‌های agent ‏OpenAI به‌طور پیش‌فرض از harness ‏Codex استفاده می‌کنند؛ وقتی بخواهید این را صریح کنید، `agentRuntime.id: "codex"` در سطح provider/model همچنان معتبر است.
- برای استقرارهای Claude CLI، ‏`model: "anthropic/claude-opus-4-7"` به‌همراه `agentRuntime.id: "claude-cli"` در سطح مدل را ترجیح دهید. ارجاع‌های مدل قدیمی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب provider/model را استاندارد نگه دارد و backend اجرا را در سیاست زمان اجرای provider/model قرار دهد.
- این فقط اجرای نوبت agent متنی را کنترل می‌کند. تولید رسانه، vision، ‏PDF، موسیقی، ویدئو، و TTS همچنان از تنظیمات provider/model خودشان استفاده می‌کنند.

**میانبرهای alias توکار** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

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

نام‌های مستعار پیکربندی‌شده شما همیشه بر پیش‌فرض‌ها اولویت دارند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌طور پیش‌فرض `tool_stream` را برای جریان‌دهی فراخوانی ابزار فعال می‌کنند. برای غیرفعال کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

پشتانه‌های اختیاری CLI برای اجراهای جایگزین فقط‌متنی (بدون فراخوانی ابزار). به‌عنوان پشتیبان زمانی مفید است که ارائه‌دهندگان API از کار بیفتند.

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
- `reseedFromRawTranscriptWhenUncompacted: true` به یک پشتانه اجازه می‌دهد نشست‌های نامعتبرشده امن را
  پیش از وجود نخستین خلاصه Compaction، از دنباله محدود رونوشت خام OpenClaw بازیابی کند.
  تغییرات پروفایل احراز هویت یا دوره اعتبارنامه همچنان هرگز بازبذرگذاری خام نمی‌شوند.

### `agents.defaults.systemPromptOverride`

کل پرامپت سیستمی ساخته‌شده توسط OpenClaw را با یک رشته ثابت جایگزین می‌کند. در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقدارهای مخصوص هر عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شده پرامپت مفید است.

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
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستمی حذف می‌کند و تزریق `HEARTBEAT.md` به زمینه بوت‌استرپ را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، محموله‌های هشدار خطای ابزار را در طول اجراهای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: بیشینه زمان مجاز برحسب ثانیه برای یک نوبت عامل Heartbeat پیش از لغو شدن. برای استفاده از `agents.defaults.timeoutSeconds` تنظیم نکنید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینه بوت‌استرپ سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های بوت‌استرپ فضای کاری نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در نشستی تازه و بدون تاریخچه گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی cron `sessionTarget: "isolated"`. هزینه توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در مسیرهای مشغول اضافی به تعویق می‌افتند: کار عامل فرعی یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
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
- `provider`: شناسه یک Plugin ارائه‌دهنده Compaction ثبت‌شده. وقتی تنظیم شود، به‌جای خلاصه‌سازی داخلی LLM، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست به سازوکار داخلی برمی‌گردد. تنظیم یک ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: بیشینه ثانیه‌های مجاز برای یک عملیات Compaction پیش از اینکه OpenClaw آن را لغو کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجه نقطه برش Pi برای نگه‌داشتن جدیدترین دنباله رونوشت به‌صورت کلمه‌به‌کلمه. `/compact` دستی وقتی به‌صراحت تنظیم شده باشد آن را رعایت می‌کند؛ در غیر این صورت Compaction دستی یک نقطه بازرسی سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` راهنمای داخلی نگه‌داری شناسه‌های مات را هنگام خلاصه‌سازی Compaction در ابتدای متن اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه‌ها که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش دوباره در خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌طور پیش‌فرض فعال است؛ برای رد کردن حسابرسی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از افزوده شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش فعلی را پیش از ارسال پرامپت لغو می‌کند و از مسیر بازیابی پیش‌بررسی موجود برای کوتاه کردن نتایج ابزار یا compact و تلاش دوباره استفاده می‌کند. با هر دو حالت Compaction، یعنی `default` و `safeguard`، کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا به‌صراحت روی همان جفت پیش‌فرض تنظیم شده باشد، عنوان‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان سازگاری قدیمی پذیرفته می‌شوند.
- `model`: بازنویسی اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه اختیاری بایت (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه بگذرد، پیش از اجرا Compaction محلی عادی را تحریک می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به رونوشت جانشین کوچک‌تری بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و تکمیل Compaction اعلان‌های کوتاهی برای کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). به‌طور پیش‌فرض غیرفعال است تا Compaction بی‌صدا بماند.
- `memoryFlush`: نوبت عاملی بی‌صدا پیش از Compaction خودکار برای ذخیره حافظه‌های پایدار. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیره جایگزین نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

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
- `ttl` کنترل می‌کند که هرس هر چند وقت یک بار می‌تواند دوباره اجرا شود (پس از آخرین لمس cache).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را به‌صورت نرم کوتاه می‌کند، سپس در صورت نیاز نتایج ابزار قدیمی‌تر را به‌صورت سخت پاک می‌کند.

**کوتاه‌سازی نرم** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**پاک‌سازی سخت** کل نتیجه ابزار را با placeholder جایگزین می‌کند.

یادداشت‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها بر پایه نویسه‌اند (تقریبی)، نه شمارش دقیق توکن.
- اگر کمتر از `keepLastAssistants` پیام دستیار وجود داشته باشد، هرس رد می‌شود.

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

- کانال‌های غیر از Telegram برای فعال‌کردن پاسخ‌های بلوکی به `*.blockStreaming: true` صریح نیاز دارند.
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های مخصوص هر حساب). Signal/Slack/Discord/Google Chat به‌طور پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. بازنویسی مخصوص هر عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار و قطعه‌بندی، [استریمینگ](/fa/concepts/streaming) را ببینید.

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

سندباکسینگ اختیاری برای عامل تعبیه‌شده. برای راهنمای کامل، [سندباکسینگ](/fa/gateway/sandboxing) را ببینید.

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

- `docker`: زمان اجرای Docker محلی (پیش‌فرض)
- `ssh`: زمان اجرای راه‌دور عمومی مبتنی بر SSH
- `openshell`: زمان اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات مخصوص زمان اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی بک‌اند SSH:**

- `target`: مقصد SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه مطلق راه‌دور که برای فضاهای کاری مخصوص هر دامنه استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefهایی که OpenClaw در زمان اجرا به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: کنترل‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` مقدم است
- `certificateData` بر `certificateFile` مقدم است
- `knownHostsData` بر `knownHostsFile` مقدم است
- مقدارهای `*Data` مبتنی بر SecretRef پیش از شروع نشست سندباکس، از اسنپ‌شات فعال زمان اجرای اسرار حل می‌شوند

**رفتار بک‌اند SSH:**

- پس از ایجاد یا بازایجاد، فضای کاری راه‌دور را یک بار مقداردهی اولیه می‌کند
- سپس فضای کاری SSH راه‌دور را مرجع نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه‌دور را به‌طور خودکار به میزبان همگام‌سازی نمی‌کند
- از کانتینرهای مرورگر سندباکس پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری سندباکس مخصوص هر دامنه زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری سندباکس در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent` مانت می‌شود
- `rw`: فضای کاری عامل به‌صورت خواندنی/نوشتنی در `/workspace` مانت می‌شود

**دامنه:**

- `session`: کانتینر + فضای کاری مخصوص هر نشست
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

- `mirror`: پیش از exec، راه‌دور را از محلی مقداردهی اولیه می‌کند و پس از exec همگام‌سازی معکوس انجام می‌دهد؛ فضای کاری محلی مرجع می‌ماند
- `remote`: هنگام ایجاد سندباکس، راه‌دور را یک بار مقداردهی اولیه می‌کند، سپس فضای کاری راه‌دور را مرجع نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که خارج از OpenClaw انجام شوند، پس از مرحله مقداردهی اولیه به‌طور خودکار به سندباکس همگام‌سازی نمی‌شوند.
انتقال از طریق SSH به سندباکس OpenShell انجام می‌شود، اما Plugin مالک چرخه‌عمر سندباکس و همگام‌سازی آینه‌ای اختیاری است.

**`setupCommand`** یک بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل‌نوشتن، و کاربر root نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است، مگر اینکه صریحاً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass) را تنظیم کنید.

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال مرحله‌بندی می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان اضافی را مانت می‌کند؛ bindهای سراسری و مخصوص هر عامل ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL مربوط به noVNC به پرامپت سیستم تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای گذرواژه در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) جلوی هدف‌گرفتن مرورگر میزبان توسط نشست‌های سندباکس‌شده را می‌گیرد.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط زمانی روی `bridge` تنظیم کنید که صریحاً اتصال bridge سراسری می‌خواهید.
- `cdpSourceRange` می‌تواند به‌صورت اختیاری ورود CDP در لبه کانتینر را به یک محدوده CIDR محدود کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های میزبان اضافی را فقط در کانتینر مرورگر سندباکس مانت می‌کند. وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
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
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu`
    به‌طور پیش‌فرض فعال‌اند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توانند با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال شوند.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` اگر گردش‌کار شما به افزونه‌ها وابسته باشد، افزونه‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از محدودیت پیش‌فرض پردازش Chromium مقدار `0` را تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها خط مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر از یک تصویر مرورگر سفارشی با entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکسینگ مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصویرها (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build` بخش [سندباکسینگ § تصویرها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) را ببینید.

### `agents.list` (بازنویسی‌های مخصوص هر عامل)

از `agents.list[].tts` استفاده کنید تا برای یک عامل ارائه‌دهنده TTS، صدا، مدل،
سبک، یا حالت auto-TTS اختصاصی تعیین کنید. بلوک عامل روی
`messages.tts` سراسری deep-merge می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک جا بمانند و عامل‌های جداگانه فقط فیلدهای صدا یا ارائه‌دهنده‌ای را که نیاز دارند بازنویسی کنند. بازنویسی عامل فعال روی پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و
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
- `default`: وقتی چند مورد تنظیم شده باشند، اولین مورد برنده است (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین ورودی فهرست پیش‌فرض است.
- `model`: شکل رشته‌ای، یک مدل اصلی سخت‌گیرانهٔ مخصوص عامل را بدون مدل جایگزین تنظیم می‌کند؛ شکل شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. از `{ primary, fallbacks: [...] }` استفاده کنید تا آن عامل را وارد fallback کنید، یا از `{ primary, fallbacks: [] }` استفاده کنید تا رفتار سخت‌گیرانه صریح شود. کارهای Cron که فقط `primary` را بازنویسی می‌کنند همچنان fallbackهای پیش‌فرض را به ارث می‌برند، مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان مخصوص عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های ویژهٔ عامل مانند `cacheRetention`، `temperature` یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری متن‌به‌گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهندهٔ مشترک و سیاست fallback را در `messages.tts` نگه دارید و اینجا فقط مقدارهای ویژهٔ پرسونا مانند ارائه‌دهنده، صدا، مدل، سبک یا حالت خودکار را تنظیم کنید.
- `skills`: فهرست مجاز اختیاری Skillها برای هر عامل. اگر حذف شود، عامل هنگام تنظیم بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح پیش‌فرض اختیاری تفکر برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. نمایهٔ ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند کدام مقدارها معتبر هستند؛ برای Google Gemini، مقدار `adaptive` تفکر پویای تحت مالکیت ارائه‌دهنده را نگه می‌دارد (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، و `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی پیش‌فرض اختیاری استدلال برای هر عامل (`on | off | stream`). وقتی هیچ بازنویسی استدلال برای هر پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری برای حالت سریع در هر عامل (`true | false`). وقتی هیچ بازنویسی حالت سریع برای هر پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `models`: بازنویسی‌های اختیاری کاتالوگ مدل/زمان اجرا برای هر عامل، با کلید شناسه‌های کامل `provider/model`. برای استثناهای زمان اجرای مخصوص عامل از `models["provider/model"].agentRuntime` استفاده کنید.
- `runtime`: توصیف‌گر اختیاری زمان اجرا برای هر عامل. وقتی عامل باید به‌طور پیش‌فرض از نشست‌های چارچوب ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی نسبت به فضای کاری، URL از نوع `http(s)`، یا URI از نوع `data:`.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هر مورد؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` با هدف‌گیری خود باید مجاز باشند، شناسهٔ درخواست‌کننده را وارد کنید.
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

### فیلدهای تطبیق اتصال

- `type` (اختیاری): `route` برای مسیریابی عادی (نوع حذف‌شده به‌طور پیش‌فرض route است)، `acp` برای اتصال‌های گفت‌وگوی پایدار ACP.
- `match.channel` (الزامی)
- `match.accountId` (اختیاری؛ `*` = هر حساب؛ حذف‌شده = حساب پیش‌فرض)
- `match.peer` (اختیاری؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختیاری؛ ویژهٔ کانال)
- `acp` (اختیاری؛ فقط برای `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتیب تطبیق قطعی:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (دقیق، بدون peer/guild/team)
5. `match.accountId: "*"` (در سطح کانال)
6. عامل پیش‌فرض

در هر سطح، اولین ورودی منطبق در `bindings` برنده است.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) resolve می‌کند و از ترتیب سطح‌بندی اتصال route در بالا استفاده نمی‌کند.

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

<Accordion title="بدون دسترسی به سامانهٔ فایل (فقط پیام‌رسانی)">

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

- **`scope`**: راهبرد پایهٔ گروه‌بندی جلسه برای زمینه‌های چت گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده در یک زمینهٔ کانال، جلسهٔ جداگانه‌ای دریافت می‌کند.
  - `global`: همهٔ شرکت‌کنندگان در یک زمینهٔ کانال یک جلسهٔ مشترک دارند (فقط وقتی استفاده کنید که زمینهٔ مشترک مدنظر است).
- **`dmScope`**: نحوهٔ گروه‌بندی پیام‌های مستقیم.
  - `main`: همهٔ پیام‌های مستقیم جلسهٔ اصلی را به اشتراک می‌گذارند.
  - `per-peer`: جداسازی بر اساس شناسهٔ فرستنده در میان کانال‌ها.
  - `per-channel-peer`: جداسازی به‌ازای کانال + فرستنده (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: جداسازی به‌ازای حساب + کانال + فرستنده (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: شناسه‌های کانونی را برای اشتراک‌گذاری جلسه بین کانال‌ها به همتایان دارای پیشوند ارائه‌دهنده نگاشت می‌کند. دستورهای Dock مانند `/dock_discord` از همین نگاشت استفاده می‌کنند تا مسیر پاسخ جلسهٔ فعال را به همتای کانال پیوندخوردهٔ دیگری تغییر دهند؛ [داک‌کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در ساعت محلی `atHour` بازنشانی می‌شود؛ `idle` پس از `idleMinutes` بازنشانی می‌شود. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف جلسه استفاده می‌کند؛ تازگی بازنشانی بیکار از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند heartbeat، بیدارباش‌های cron، اعلان‌های exec، و نگهداری دفتری gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما جلسه‌های روزانه/بیکار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های به‌ازای نوع (`direct`، `group`، `thread`). مقدار قدیمی `dm` به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. زمان اجرا همیشه از `"main"` برای سطل اصلی چت مستقیم استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینهٔ نوبت‌های پاسخ‌وبرگشت بین عامل‌ها هنگام تبادل‌های عامل‌به‌عامل (عدد صحیح، بازه: `0`-`20`، پیش‌فرض: `5`). مقدار `0` زنجیره‌سازی ping-pong را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. نخستین رد اعمال می‌شود.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگهداری ذخیره‌گاه جلسه.
  - `mode`: مقدار `warn` فقط هشدار منتشر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: حد سن برای ورودی‌های مانده (پیش‌فرض `30d`).
  - `maxEntries`: بیشینهٔ تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). زمان اجرا پاک‌سازی دسته‌ای را با یک بافر کوچک high-water برای سقف‌های در اندازهٔ تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را فوری اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی حذف می‌کند.
  - `resetArchiveRetention`: نگهداری برای آرشیوهای رونوشت `*.reset.<timestamp>`. پیش‌فرض برابر `pruneAfter` است؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
  - `maxDiskBytes`: بودجهٔ اختیاری دیسک برای دایرکتوری جلسه‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین مصنوعات/جلسه‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های جلسهٔ مقید به رشته.
  - `enabled`: کلید اصلی پیش‌فرض (ارائه‌دهنده‌ها می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: خارج‌کردن خودکار از تمرکز پس از بی‌فعالیتی پیش‌فرض بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینهٔ سن سخت پیش‌فرض بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازهٔ پیش‌فرض برای ایجاد جلسه‌های کاری مقید به رشته از `sessions_spawn` و ایجاد رشته‌های ACP. وقتی اتصال‌های رشته‌ای فعال باشند، پیش‌فرض `true` است؛ ارائه‌دهنده‌ها/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینهٔ بومی پیش‌فرض زیرعامل برای ایجادهای مقید به رشته (`"fork"` یا `"isolated"`). پیش‌فرض `"fork"` است.

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

حل‌وفصل (خاص‌ترین مورد برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و زنجیره را متوقف می‌کند. `"auto"` از `[{identity.name}]` مشتق می‌شود.

**متغیرهای الگو:**

| متغیر            | توضیح                     | مثال                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل            | `claude-opus-4-6`           |
| `{modelFull}`     | شناسهٔ کامل مدل          | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده          | `anthropic`                 |
| `{thinkingLevel}` | سطح تفکر فعلی           | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل           | (همانند `"auto"`)           |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- پیش‌فرض برابر `identity.emoji` عامل فعال است، وگرنه `"👀"`. برای غیرفعال‌سازی روی `""` تنظیم کنید.
- بازنویسی‌های به‌ازای کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل‌وفصل: حساب → کانال → `messages.ackReaction` → جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: تأیید را پس از پاسخ در کانال‌های دارای قابلیت واکنش مانند Slack، Discord، Telegram، WhatsApp و iMessage حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخهٔ حیات را در Slack، Discord و Telegram فعال می‌کند.
  در Slack و Discord، مقدار تنظیم‌نشده وقتی واکنش‌های تأیید فعال باشند، واکنش‌های وضعیت را فعال نگه می‌دارد.
  در Telegram، برای فعال‌کردن واکنش‌های وضعیت چرخهٔ حیات، آن را صراحتاً روی `true` تنظیم کنید.

### حذف نویز ورودی

پیام‌های متنی سریع از یک فرستنده را در یک نوبت عامل دسته‌بندی می‌کند. رسانه/پیوست‌ها فوری تخلیه می‌شوند. دستورهای کنترلی حذف نویز را دور می‌زنند.

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

- `auto` حالت خودکار پیش‌فرض TTS را کنترل می‌کند: `off`، `always`، `inbound`، یا `tagged`. `/tts on|off` می‌تواند ترجیحات محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصه‌سازی خودکار بازنویسی می‌کند.
- `modelOverrides` به‌طور پیش‌فرض فعال است؛ پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند پذیرش صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` برمی‌گردند.
- ارائه‌دهنده‌های گفتار همراه، متعلق به Plugin هستند. اگر `plugins.allow` تنظیم شده باشد، هر Plugin ارائه‌دهندهٔ TTS را که می‌خواهید استفاده کنید اضافه کنید، برای مثال `microsoft` برای Edge TTS. شناسهٔ ارائه‌دهندهٔ قدیمی `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطهٔ پایانی TTS OpenAI را بازنویسی می‌کند. ترتیب حل‌وفصل پیکربندی، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1` است.
- وقتی `providers.openai.baseUrl` به یک نقطهٔ پایانی غیر OpenAI اشاره کند، OpenClaw آن را به‌عنوان سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آزادتر می‌کند.

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

- وقتی چند ارائه‌دهندهٔ گفت‌وگو پیکربندی شده باشند، `talk.provider` باید با یک کلید در `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی گفت‌وگو (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند. `openclaw doctor --fix` را اجرا کنید تا پیکربندی ماندگارشده به `talk.providers.<provider>` بازنویسی شود.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` برمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- جایگزین `ELEVENLABS_API_KEY` فقط وقتی اعمال می‌شود که هیچ کلید API گفت‌وگو پیکربندی نشده باشد.
- `providers.*.voiceAliases` به دستورهای گفت‌وگو اجازه می‌دهد از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face استفاده‌شده توسط کمک‌کنندهٔ محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS از طریق کمک‌کنندهٔ همراه `openclaw-mlx-tts`، وقتی موجود باشد، یا یک فایل اجرایی روی `PATH` اجرا می‌شود؛ `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌کننده را برای توسعه بازنویسی می‌کند.
- `consultThinkingLevel` سطح تفکر را برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های `openclaw_agent_consult` بلادرنگ گفت‌وگوی UI کنترل تنظیم می‌کند. برای حفظ رفتار معمول جلسه/مدل، آن را تنظیم‌نشده بگذارید.
- `consultFastMode` یک بازنویسی یک‌بارهٔ حالت سریع برای مشاوره‌های بلادرنگ گفت‌وگوی UI کنترل تنظیم می‌کند، بدون اینکه تنظیم معمول حالت سریع جلسه را تغییر دهد.
- `speechLocale` شناسهٔ محلی BCP 47 استفاده‌شده توسط تشخیص گفتار گفت‌وگوی iOS/macOS را تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت گفت‌وگو پس از سکوت کاربر چه مدت منتظر بماند تا رونوشت را ارسال کند. مقدار تنظیم‌نشده پنجرهٔ مکث پیش‌فرض پلتفرم را حفظ می‌کند (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` دستورالعمل‌های سیستمی روبه‌ارائه‌دهنده را به اعلان بلادرنگ داخلی OpenClaw اضافه می‌کند، تا سبک صدا بدون از دست‌دادن راهنمایی پیش‌فرض `openclaw_agent_consult` پیکربندی شود.

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همهٔ کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
