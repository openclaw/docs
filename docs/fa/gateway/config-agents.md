---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعاملی
    - تنظیم رفتار نشست، تحویل پیام و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها، و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-04-29T22:49:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71ffa1a7315a9f12b9685ca4aeef1414a5da994105f4466718fea56f3c53fbc2
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

ریشهٔ اختیاری مخزن که در خط Runtime پرامپت سیستم نمایش داده می‌شود. اگر تنظیم نشده باشد، OpenClaw با حرکت رو به بالا از workspace آن را به‌طور خودکار تشخیص می‌دهد.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

فهرست مجاز پیش‌فرض اختیاری skills برای عامل‌هایی که
`agents.list[].skills` را تنظیم نمی‌کنند.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github و weather را به ارث می‌برد
      { id: "docs", skills: ["docs-search"] }, // پیش‌فرض‌ها را جایگزین می‌کند
      { id: "locked-down", skills: [] }, // بدون skills
    ],
  },
}
```

- برای skills نامحدود به‌صورت پیش‌فرض، `agents.defaults.skills` را حذف کنید.
- برای به ارث بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
- برای نداشتن skills، `agents.list[].skills: []` را تنظیم کنید.
- فهرست غیرخالی `agents.list[].skills` مجموعهٔ نهایی برای آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های راه‌اندازی اولیهٔ workspace را غیرفعال می‌کند (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

کنترل می‌کند فایل‌های راه‌اندازی اولیهٔ workspace چه زمانی در پرامپت سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامهٔ ایمن (پس از پاسخ کامل‌شدهٔ assistant) تزریق دوبارهٔ راه‌اندازی اولیهٔ workspace را رد می‌کنند و اندازهٔ پرامپت را کاهش می‌دهند. اجرای Heartbeat و تلاش‌های دوبارهٔ پس از Compaction همچنان زمینه را بازسازی می‌کنند.
- `"never"`: راه‌اندازی اولیهٔ workspace و تزریق فایل زمینه را در هر نوبت غیرفعال می‌کند. این را فقط برای عامل‌هایی استفاده کنید که چرخهٔ عمر پرامپت خود را کاملاً مالک هستند (موتورهای زمینهٔ سفارشی، زمان‌های اجرای بومی که زمینهٔ خود را می‌سازند، یا گردش‌کارهای تخصصی بدون راه‌اندازی اولیه). نوبت‌های Heartbeat و بازیابی پس از Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

حداکثر نویسه‌ها برای هر فایل راه‌اندازی اولیهٔ workspace پیش از کوتاه‌سازی. پیش‌فرض: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده در همهٔ فایل‌های راه‌اندازی اولیهٔ workspace. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

متن هشدار قابل‌مشاهده برای عامل را هنگام کوتاه‌سازی زمینهٔ راه‌اندازی اولیه کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن هشدار را در پرامپت سیستم تزریق نکن.
- `"once"`: هشدار را برای هر امضای کوتاه‌سازی یکتا یک‌بار تزریق کن (توصیه‌شده).
- `"always"`: وقتی کوتاه‌سازی وجود دارد، هشدار را در هر اجرا تزریق کن.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشهٔ مالکیت بودجهٔ زمینه

OpenClaw چندین بودجهٔ پرحجم پرامپت/زمینه دارد و این بودجه‌ها
عمداً بر اساس زیرسیستم جدا شده‌اند، نه اینکه همه از یک تنظیم عمومی
عبور کنند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق عادی راه‌اندازی اولیهٔ workspace.
- `agents.defaults.startupContext.*`:
  پیش‌درآمد یک‌بارهٔ اجرای مدل برای reset/startup، شامل فایل‌های روزانهٔ اخیر
  `memory/*.md`. فرمان‌های chat خام `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشردهٔ skills تزریق‌شده در پرامپت سیستم.
- `agents.defaults.contextLimits.*`:
  گزیده‌های زمان اجرای محدود و بلوک‌های تزریق‌شدهٔ مالک‌شده توسط runtime.
- `memory.qmd.limits.*`:
  اندازه‌گذاری قطعهٔ جست‌وجوی حافظهٔ نمایه‌شده و تزریق.

فقط زمانی از override متناظر برای هر عامل استفاده کنید که یک عامل به بودجهٔ
متفاوتی نیاز دارد:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد startup نوبت اول را که در اجرای مدل reset/startup تزریق می‌شود کنترل می‌کند.
فرمان‌های chat خام `/new` و `/reset`، reset را بدون فراخوانی مدل تأیید می‌کنند،
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

- `memoryGetMaxChars`: سقف پیش‌فرض گزیدهٔ `memory_get` پیش از افزوده شدن
  فرادادهٔ کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجرهٔ خط پیش‌فرض `memory_get` وقتی `lines` حذف شده
  باشد.
- `toolResultMaxChars`: سقف زندهٔ نتیجهٔ ابزار که برای نتایج پایدارشده و
  بازیابی overflow استفاده می‌شود.
- `postCompactionMaxChars`: سقف گزیدهٔ AGENTS.md که هنگام تزریق refresh پس از Compaction
  استفاده می‌شود.

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

سقف سراسری برای فهرست فشردهٔ skills که در پرامپت سیستم تزریق می‌شود. این
خواندن فایل‌های `SKILL.md` را در صورت نیاز تحت تأثیر قرار نمی‌دهد.

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

override برای هر عامل برای بودجهٔ پرامپت skills.

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

حداکثر اندازهٔ پیکسلی برای بلندترین ضلع تصویر در بلوک‌های تصویر transcript/tool پیش از فراخوانی provider.
پیش‌فرض: `1200`.

مقادیر کمتر معمولاً مصرف vision-token و اندازهٔ payload درخواست را برای اجراهای پر از screenshot کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

منطقهٔ زمانی برای زمینهٔ پرامپت سیستم (نه timestampهای پیام). به منطقهٔ زمانی میزبان fallback می‌کند.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

قالب زمان در پرامپت سیستم. پیش‌فرض: `auto` (ترجیح OS).

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
      params: { cacheRetention: "long" }, // پارامترهای provider پیش‌فرض سراسری
      agentRuntime: {
        id: "pi", // pi | auto | شناسهٔ harness ثبت‌شده، برای نمونه codex
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

- `model`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - شکل رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - شکل شیء، مدل اصلی به‌همراه مدل‌های failover مرتب‌شده را تنظیم می‌کند.
- `imageModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط مسیر ابزار `image` به‌عنوان پیکربندی مدل بینایی آن استفاده می‌شود.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر را بپذیرد، برای مسیریابی fallback استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های تنها برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه تنها به‌طور یکتا با یک ورودی پیکربندی‌شده دارای قابلیت تصویر در `models.providers.*.models` مطابقت داشته باشد، OpenClaw آن را به همان provider منتسب می‌کند. مطابقت‌های پیکربندی‌شده مبهم به پیشوند صریح provider نیاز دارند.
- `imageGenerationModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده‌ای که تصویر تولید می‌کند استفاده می‌شود.
  - مقدارهای معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینه شفاف OpenAI.
  - اگر مستقیماً یک provider/model را انتخاب می‌کنید، احراز هویت provider متناظر را نیز پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید تصویر را به ترتیب شناسه provider امتحان می‌کند.
- `musicGenerationModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` استفاده می‌شود.
  - مقدارهای معمول: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید موسیقی را به ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیماً یک provider/model را انتخاب می‌کنید، احراز هویت provider/API key متناظر را نیز پیکربندی کنید.
- `videoGenerationModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید ویدئو و ابزار داخلی `video_generate` استفاده می‌شود.
  - مقدارهای معمول: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر احراز هویت را استنباط کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس providerهای ثبت‌شده باقی‌مانده تولید ویدئو را به ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیماً یک provider/model را انتخاب می‌کنید، احراز هویت provider/API key متناظر را نیز پیکربندی کنید.
  - provider تولید ویدئوی Qwen همراه بسته تا ۱ ویدئوی خروجی، ۱ تصویر ورودی، ۴ ویدئوی ورودی، مدت ۱۰ ثانیه، و گزینه‌های سطح provider شامل `size`، `aspectRatio`، `resolution`، `audio` و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض fallback می‌کند.
- `pdfMaxBytesMb`: محدودیت اندازه PDF پیش‌فرض برای ابزار `pdf` وقتی `maxBytesMb` هنگام فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: بیشینه تعداد صفحه‌های پیش‌فرض که در حالت fallback استخراج در ابزار `pdf` در نظر گرفته می‌شود.
- `verboseDefault`: سطح verbose پیش‌فرض برای عامل‌ها. مقدارها: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `reasoningDefault`: نمایش reasoning پیش‌فرض برای عامل‌ها. مقدارها: `"off"`، `"on"`، `"stream"`. `agents.list[].reasoningDefault` مخصوص هر عامل این پیش‌فرض را override می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای مالکان، فرستندگان مجاز، یا زمینه‌های gateway operator-admin اعمال می‌شوند، آن هم وقتی هیچ override reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح خروجی elevated پیش‌فرض برای عامل‌ها. مقدارها: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلاً `openai/gpt-5.5` برای دسترسی API-key یا `openai-codex/gpt-5.5` برای Codex OAuth). اگر provider را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس برای همان شناسه دقیق مدل یک مطابقت یکتای provider پیکربندی‌شده را بررسی می‌کند، و فقط بعد از آن به provider پیش‌فرض پیکربندی‌شده fallback می‌کند (رفتار سازگاری منسوخ‌شده، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن provider دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض provider حذف‌شده قدیمی، به نخستین provider/model پیکربندی‌شده fallback می‌کند.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (مختص provider، برای مثال `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های allowlist موجود را حذف کنند رد می‌کند، مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های configure/onboarding محدود به provider، مدل‌های provider انتخاب‌شده را در این map ادغام می‌کنند و providerهای نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌طور خودکار فعال می‌شود. برای توقف تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای override کردن آستانه از `params.responsesCompactThreshold` استفاده کنید. [OpenAI server-side compaction](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری provider که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلاً `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (برای هر مدل) override می‌شود، سپس `agents.list[].params` (شناسه عامل مطابق) بر اساس کلید override می‌کند. برای جزئیات [Prompt Caching](/fa/reference/prompt-caching) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON عبوری پیشرفته که در بدنه درخواست‌های `api: "openai-completions"` برای proxyهای سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده تداخل داشته باشد، بدنه اضافی برنده می‌شود؛ مسیرهای completions غیربومی همچنان پس از آن `store` مختص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin همراه vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح پیش‌فرض‌های تولیدشده را override می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. برای کنترل‌های thinking در vLLM Qwen، `params.qwenThinkingFormat` را روی آن ورودی مدل به `"chat-template"` یا `"top-level"` تنظیم کنید.
- `compat.supportedReasoningEfforts`: فهرست تلاش reasoning سازگار با OpenAI برای هر مدل. برای endpointهای سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw، `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی CLI عامل، و اعتبارسنجی `llm-task` برای آن provider/model پیکربندی‌شده ارائه می‌کند. وقتی backend برای یک سطح canonical مقدار مختص provider می‌خواهد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: انتخاب صریح فقط برای Z.AI جهت حفظ thinking. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ [Z.AI thinking and preserved thinking](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `agentRuntime`: سیاست پیش‌فرض سطح پایین runtime عامل. شناسه حذف‌شده به‌طور پیش‌فرض OpenClaw Pi است. برای اجبار به harness داخلی PI از `id: "pi"` استفاده کنید، برای اینکه harnessهای Plugin ثبت‌شده مدل‌های پشتیبانی‌شده را claim کنند از `id: "auto"` استفاده کنید، از یک شناسه harness ثبت‌شده مانند `id: "codex"`، یا از یک alias backend CLI پشتیبانی‌شده مانند `id: "claude-cli"` استفاده کنید. برای غیرفعال کردن fallback خودکار PI، `fallback: "none"` را تنظیم کنید. runtimeهای Plugin صریح مانند `codex` به‌طور پیش‌فرض fail closed می‌شوند مگر اینکه در همان محدوده override مقدار `fallback: "pi"` را تنظیم کنید. ارجاع‌های مدل را به‌صورت canonical یعنی `provider/model` نگه دارید؛ Codex، Claude CLI، Gemini CLI و دیگر backendهای اجرا را به‌جای پیشوندهای provider runtime قدیمی، از طریق پیکربندی runtime انتخاب کنید. برای تفاوت این مورد با انتخاب provider/model، [Agent runtimes](/fa/concepts/agent-runtimes) را ببینید.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`، `/models set-image`، و فرمان‌های افزودن/حذف fallback) شکل شیء canonical را ذخیره می‌کنند و تا حد امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: بیشینه اجرای موازی عامل‌ها در نشست‌ها (هر نشست همچنان سریالی اجرا می‌شود). پیش‌فرض: ۴.

### `agents.defaults.agentRuntime`

`agentRuntime` کنترل می‌کند کدام اجراکننده سطح پایین turnهای عامل را اجرا کند. بیشتر
استقرارها باید runtime پیش‌فرض OpenClaw Pi را نگه دارند. وقتی یک Plugin قابل اعتماد
یک harness بومی ارائه می‌دهد، مانند harness app-server همراه Codex،
یا وقتی یک backend CLI پشتیبانی‌شده مانند Claude CLI می‌خواهید، از آن استفاده کنید. برای مدل ذهنی،
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

- `id`: `"auto"`، `"pi"`، یک شناسه harness ثبت‌شده Plugin، یا یک alias backend CLI پشتیبانی‌شده. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic، backend CLI به نام `claude-cli` را فراهم می‌کند.
- `fallback`: `"pi"` یا `"none"`. در `id: "auto"`، fallback حذف‌شده به‌طور پیش‌فرض `"pi"` است تا پیکربندی‌های قدیمی بتوانند وقتی هیچ harness Plugin یک اجرا را claim نمی‌کند همچنان از PI استفاده کنند. در حالت runtime صریح Plugin، مانند `id: "codex"`، fallback حذف‌شده به‌طور پیش‌فرض `"none"` است تا harness گمشده به‌جای استفاده بی‌صدای PI، با شکست روبه‌رو شود. overrideهای runtime، fallback را از محدوده گسترده‌تر به ارث نمی‌برند؛ وقتی عمداً آن fallback سازگاری را می‌خواهید، `fallback: "pi"` را کنار runtime صریح تنظیم کنید. شکست‌های harness Plugin انتخاب‌شده همیشه مستقیماً نمایش داده می‌شوند.
- overrideهای محیطی: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` مقدار `id` را override می‌کند؛ `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` مقدار fallback را برای آن فرایند override می‌کند.
- برای استقرارهای فقط Codex، `model: "openai/gpt-5.5"` و `agentRuntime.id: "codex"` را تنظیم کنید. همچنین می‌توانید برای خوانایی، `agentRuntime.fallback: "none"` را صراحتاً تنظیم کنید؛ این مقدار برای runtimeهای صریح Plugin پیش‌فرض است.
- برای استقرارهای Claude CLI، `model: "anthropic/claude-opus-4-7"` به‌همراه `agentRuntime.id: "claude-cli"` را ترجیح دهید. ارجاع‌های مدل قدیمی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب provider/model را canonical نگه دارد و backend اجرا را در `agentRuntime.id` قرار دهد.
- کلیدهای قدیمی‌تر سیاست runtime توسط `openclaw doctor --fix` به `agentRuntime` بازنویسی می‌شوند.
- انتخاب harness پس از نخستین اجرای embedded برای هر شناسه نشست pin می‌شود. تغییرات config/env بر نشست‌های جدید یا resetشده اثر می‌گذارند، نه بر transcript موجود. نشست‌های قدیمی با سابقه transcript اما بدون pin ثبت‌شده، PI-pinned در نظر گرفته می‌شوند. `/status` runtime مؤثر را گزارش می‌کند، برای مثال `Runtime: OpenClaw Pi Default` یا `Runtime: OpenAI Codex`.
- این فقط اجرای turn عامل متنی را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدئو، و TTS همچنان از تنظیمات provider/model خود استفاده می‌کنند.

**میان‌برهای alias داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

| نام مستعار         | مدل                                        |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

نام‌های مستعاری که پیکربندی کرده‌اید همیشه بر پیش‌فرض‌ها اولویت دارند.

مدل‌های Z.AI GLM-4.x به‌صورت خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌صورت پیش‌فرض `tool_stream` را برای جریان‌سازی فراخوانی ابزار فعال می‌کنند. برای غیرفعال‌کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` بگذارید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌صورت پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

بک‌اندهای اختیاری CLI برای اجراهای جایگزین فقط‌متنی (بدون فراخوانی ابزار). وقتی ارائه‌دهندگان API شکست می‌خورند، به‌عنوان پشتیبان مفید است.

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
- عبور مستقیم تصویر وقتی `imageArg` مسیر فایل‌ها را بپذیرد پشتیبانی می‌شود.

### `agents.defaults.systemPromptOverride`

کل پرامپت سیستمی ساخته‌شده توسط OpenClaw را با یک رشته ثابت جایگزین کنید. آن را در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقدارهای هر عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شده پرامپت مفید است.

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

هم‌پوشانی‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانواده مدل اعمال می‌شوند. شناسه‌های مدل خانواده GPT-5 قرارداد رفتاری مشترک را در میان ارائه‌دهندگان دریافت می‌کنند؛ `personality` فقط لایه سبک تعامل دوستانه را کنترل می‌کند.

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

- `every`: رشته مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال‌کردن، روی `0m` بگذارید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستمی حذف می‌کند و تزریق `HEARTBEAT.md` به زمینه راه‌اندازی را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را هنگام اجرای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: بیشینه زمان مجاز بر حسب ثانیه برای یک نوبت عامل Heartbeat پیش از اینکه متوقف شود. برای استفاده از `agents.defaults.timeoutSeconds` تنظیم‌نشده رها کنید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به هدف مستقیم را مجاز می‌کند. `block` تحویل به هدف مستقیم را سرکوب می‌کند و `reason=dm-blocked` منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینه راه‌اندازی سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی فضای کاری نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه بدون تاریخچه گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی مانند cron `sessionTarget: "isolated"`. هزینه توکن هر Heartbeat را از حدود ۱۰۰ هزار به حدود ۲ تا ۵ هزار توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در مسیرهای شلوغ اضافی به تعویق می‌افتند: کار عامل فرعی یا دستور تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
- برای هر عامل: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر عاملی `heartbeat` را تعریف کند، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
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
- `provider`: شناسه یک Plugin ثبت‌شده ارائه‌دهنده Compaction. وقتی تنظیم شود، به‌جای خلاصه‌سازی داخلی LLM، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به حالت داخلی بازمی‌گردد. تنظیم یک ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: بیشینه ثانیه‌های مجاز برای یک عملیات Compaction پیش از اینکه OpenClaw آن را متوقف کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجه نقطه برش Pi برای نگه‌داشتن دنباله اخیر رونویس به‌صورت لفظ‌به‌لفظ. `/compact` دستی وقتی صریحا تنظیم شده باشد به این احترام می‌گذارد؛ در غیر این صورت Compaction دستی یک نقطه وارسی سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` راهنمایی داخلی حفظ شناسه‌های مبهم را هنگام خلاصه‌سازی Compaction در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش دوباره هنگام خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌صورت پیش‌فرض فعال است؛ برای رد کردن ممیزی، `enabled: false` را تنظیم کنید.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال‌کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا صریحا روی همان جفت پیش‌فرض تنظیم شده باشد، سرعنوان‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان جایگزین قدیمی پذیرفته می‌شوند.
- `model`: بازنویسی اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه اختیاری بایت (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به یک رونویس جانشین کوچک‌تر بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و پایان Compaction اعلان‌های کوتاه برای کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). به‌صورت پیش‌فرض غیرفعال است تا Compaction بی‌صدا بماند.
- `memoryFlush`: نوبت عاملی بی‌صدا پیش از Compaction خودکار برای ذخیره حافظه‌های پایدار. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیره جایگزین نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

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

<Accordion title="رفتار حالت cache-ttl">

- `mode: "cache-ttl"` گذرهای هرس را فعال می‌کند.
- `ttl` کنترل می‌کند که هرس هر چند وقت یک‌بار دوباره می‌تواند اجرا شود (پس از آخرین لمس cache).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را نرم‌کوتاه می‌کند، سپس در صورت نیاز نتایج ابزار قدیمی‌تر را سخت‌پاک می‌کند.

**نرم‌کوتاه‌سازی** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**سخت‌پاک‌سازی** کل نتیجه ابزار را با جای‌نگهدار جایگزین می‌کند.

یادداشت‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها مبتنی بر نویسه هستند (تقریبی)، نه شمارش دقیق توکن.
- اگر کمتر از `keepLastAssistants` پیام دستیار وجود داشته باشد، هرس رد می‌شود.

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
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های هر حساب). Signal/Slack/Discord/Google Chat به‌صورت پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = ۸۰۰ تا ۲۵۰۰ms. بازنویسی هر عامل: `agents.list[].humanDelay`.

برای رفتار + جزئیات تکه‌بندی، [جریان‌سازی](/fa/concepts/streaming) را ببینید.

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

- پیش‌فرض‌ها: `instant` برای گفت‌وگوها/منشن‌های مستقیم، `message` برای گفت‌وگوهای گروهی بدون منشن.
- بازنویسی‌های هر نشست: `session.typingMode`، `session.typingIntervalSeconds`.

[نشانگرهای تایپ](/fa/concepts/typing-indicators) را ببینید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

سندباکس‌گذاری اختیاری برای عامل تعبیه‌شده. برای راهنمای کامل، [سندباکس‌گذاری](/fa/gateway/sandboxing) را ببینید.

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

وقتی `backend: "openshell"` انتخاب شود، تنظیمات ویژه زمان‌اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی بک‌اند SSH:**

- `target`: هدف SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه مطلق راه‌دور که برای فضاهای کاری هر دامنه استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefهایی که OpenClaw هنگام اجرا به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: کنترل‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` مقدم است
- `certificateData` بر `certificateFile` مقدم است
- `knownHostsData` بر `knownHostsFile` مقدم است
- مقادیر `*Data` با پشتوانه SecretRef پیش از شروع نشست سندباکس از اسنپ‌شات فعال زمان‌اجرای رازها resolve می‌شوند

**رفتار بک‌اند SSH:**

- فضای کاری راه‌دور را یک بار پس از ایجاد یا ایجاد دوباره seed می‌کند
- سپس فضای کاری SSH راه‌دور را canonical نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه‌دور را به‌صورت خودکار به میزبان sync نمی‌کند
- از کانتینرهای مرورگر سندباکس پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری سندباکس هر دامنه زیر `~/.openclaw/sandboxes`
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

- `mirror`: پیش از exec راه‌دور را از محلی seed می‌کند، پس از exec به عقب sync می‌کند؛ فضای کاری محلی canonical می‌ماند
- `remote`: هنگام ایجاد سندباکس یک بار راه‌دور را seed می‌کند، سپس فضای کاری راه‌دور را canonical نگه می‌دارد

در حالت `remote`، ویرایش‌های محلیِ میزبان که خارج از OpenClaw انجام شوند، پس از مرحله seed به‌صورت خودکار وارد سندباکس sync نمی‌شوند.
انتقال از طریق SSH به داخل سندباکس OpenShell انجام می‌شود، اما Plugin مالک چرخه عمر سندباکس و sync آینه‌ای اختیاری است.

**`setupCommand`** یک بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل نوشتن، و کاربر root نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) بگذارید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است مگر اینکه صریحاً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass) را تنظیم کنید.

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال stage می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان اضافی را mount می‌کند؛ bindهای سراسری و هر عامل با هم ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL مربوط به noVNC در system prompt تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای گذرواژه در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) نشست‌های سندباکس‌شده را از هدف‌گرفتن مرورگر میزبان بازمی‌دارد.
- مقدار پیش‌فرض `network` برابر `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط وقتی می‌خواهید اتصال bridge سراسری داشته باشید، آن را روی `bridge` بگذارید.
- `cdpSourceRange` می‌تواند ورودی CDP را در لبه کانتینر به یک بازه CIDR محدود کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های میزبان اضافی را فقط در کانتینر مرورگر سندباکس mount می‌کند. وقتی تنظیم شود (حتی `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
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
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu`
    به‌طور پیش‌فرض فعال‌اند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد،
    می‌توان آن‌ها را با `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` اگر گردش‌کار شما
    به افزونه‌ها وابسته باشد، آن‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از
    حد پیش‌فرض فرایندهای Chromium، `0` را تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها baseline تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر، از یک تصویر مرورگر سفارشی با
    entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکس‌گذاری مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصاویر:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (بازنویسی‌های هر عامل)

از `agents.list[].tts` استفاده کنید تا به یک عامل ارائه‌دهنده TTS، صدا، مدل،
سبک، یا حالت auto-TTS خودش را بدهید. بلوک عامل به‌صورت deep-merge روی
`messages.tts` سراسری اعمال می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک جا بمانند و عامل‌های جداگانه
فقط فیلدهای صدا یا ارائه‌دهنده‌ای را که نیاز دارند بازنویسی کنند. بازنویسی عامل فعال
برای پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و
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
- `default`: وقتی چند مورد تنظیم شده باشند، اولین مورد برنده است (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین ورودی فهرست پیش‌فرض است.
- `model`: فرم رشته‌ای، یک مدل اصلی سخت‌گیرانه برای هر عامل تنظیم می‌کند و هیچ fallback مدلی ندارد؛ فرم شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. از `{ primary, fallbacks: [...] }` استفاده کنید تا آن عامل fallback داشته باشد، یا از `{ primary, fallbacks: [] }` استفاده کنید تا رفتار سخت‌گیرانه را صریح کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند همچنان fallbackهای پیش‌فرض را به ارث می‌برند، مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان برای هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های مخصوص عامل مانند `cacheRetention`، `temperature` یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، پس اعتبارنامه‌های ارائه‌دهندهٔ مشترک و سیاست fallback را در `messages.tts` نگه دارید و اینجا فقط مقدارهای مخصوص persona مانند ارائه‌دهنده، صدا، مدل، سبک یا حالت خودکار را تنظیم کنید.
- `skills`: allowlist اختیاری Skills برای هر عامل. اگر حذف شود، عامل وقتی `agents.defaults.skills` تنظیم شده باشد آن را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح تفکر پیش‌فرض اختیاری برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی بازنویسی برای هر پیام یا session تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. پروفایل ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند کدام مقدارها معتبرند؛ برای Google Gemini، `adaptive` تفکر پویا و متعلق به ارائه‌دهنده را نگه می‌دارد (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، و `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی reasoning پیش‌فرض اختیاری برای هر عامل (`on | off | stream`). وقتی بازنویسی reasoning برای هر پیام یا session تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری حالت سریع برای هر عامل (`true | false`). وقتی بازنویسی حالت سریع برای هر پیام یا session تنظیم نشده باشد اعمال می‌شود.
- `agentRuntime`: بازنویسی اختیاری سیاست runtime سطح پایین برای هر عامل. از `{ id: "codex" }` استفاده کنید تا یک عامل فقط Codex باشد، درحالی‌که عامل‌های دیگر fallback پیش‌فرض PI را در حالت `auto` نگه می‌دارند.
- `runtime`: توصیف‌گر اختیاری runtime برای هر عامل. وقتی عامل باید به‌طور پیش‌فرض از sessionهای harness مربوط به ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به workspace، نشانی `http(s)`، یا URI از نوع `data:`.
- `identity` پیش‌فرض‌ها را استخراج می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: allowlist شناسه‌های عامل برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هر مورد؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` با هدف خود عامل باید مجاز باشند، شناسهٔ درخواست‌کننده را اضافه کنید.
- محافظ وراثت sandbox: اگر session درخواست‌کننده sandbox شده باشد، `sessions_spawn` هدف‌هایی را که بدون sandbox اجرا می‌شوند رد می‌کند.
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

- `type` (اختیاری): `route` برای مسیریابی عادی (نوعِ حذف‌شده به‌صورت پیش‌فرض route است)، `acp` برای bindingهای پایدار گفت‌وگوی ACP.
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

در هر رده، اولین ورودی منطبق در `bindings` برنده است.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) resolve می‌کند و از ترتیب رده‌های route binding در بالا استفاده نمی‌کند.

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

## Session

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

<Accordion title="جزئیات فیلدهای session">

- **`scope`**: راهبرد پایهٔ گروه‌بندی session برای زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده در یک زمینهٔ کانال، session ایزولهٔ خودش را می‌گیرد.
  - `global`: همهٔ مشارکت‌کنندگان در یک زمینهٔ کانال یک session مشترک دارند (فقط وقتی استفاده کنید که زمینهٔ مشترک مدنظر است).
- **`dmScope`**: نحوهٔ گروه‌بندی DMها.
  - `main`: همهٔ DMها session اصلی را به اشتراک می‌گذارند.
  - `per-peer`: بر اساس شناسهٔ فرستنده در کانال‌ها ایزوله می‌کند.
  - `per-channel-peer`: به‌ازای هر کانال + فرستنده ایزوله می‌کند (برای inboxهای چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: به‌ازای هر حساب + کانال + فرستنده ایزوله می‌کند (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: نگاشت شناسه‌های canonical به peerهای دارای پیشوند ارائه‌دهنده برای اشتراک‌گذاری session میان کانال‌ها. فرمان‌های Dock مانند `/dock_discord` از همین نگاشت استفاده می‌کنند تا مسیر پاسخ session فعال را به peer کانال لینک‌شدهٔ دیگری تغییر دهند؛ [داکینگ کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست reset اصلی. `daily` در ساعت محلی `atHour` reset می‌کند؛ `idle` پس از `idleMinutes` reset می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود برنده است. تازگی reset روزانه از `sessionStartedAt` ردیف session استفاده می‌کند؛ تازگی reset بیکار از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستم مانند heartbeat، بیدارباش‌های cron، اعلان‌های exec و bookkeeping مربوط به gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما sessionهای daily/idle را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های مخصوص نوع (`direct`، `group`، `thread`). مقدار legacy `dm` به‌عنوان alias برای `direct` پذیرفته می‌شود.
- **`parentForkMaxTokens`**: بیشینهٔ `totalTokens` مجاز برای session والد هنگام ایجاد یک session رشته‌ای fork شده (پیش‌فرض `100000`).
  - اگر `totalTokens` والد بالاتر از این مقدار باشد، OpenClaw به‌جای به‌ارث‌بردن تاریخچهٔ transcript والد، یک session رشته‌ای تازه شروع می‌کند.
  - برای غیرفعال کردن این محافظ و اجازهٔ همیشگی به fork کردن از والد، `0` را تنظیم کنید.
- **`mainKey`**: فیلد legacy. Runtime همیشه برای سطل اصلی گفت‌وگوی مستقیم از `"main"` استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینهٔ نوبت‌های پاسخ برگشتی بین عامل‌ها هنگام تبادل‌های عامل‌به‌عامل (عدد صحیح، بازه: `0`–`5`). `0` زنجیره‌سازی ping-pong را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با alias legacy `dm`)، `keyPrefix`، یا `rawKeyPrefix`. اولین deny برنده است.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگه‌داری session-store.
  - `mode`: مقدار `warn` فقط هشدار صادر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: حد سن برای ورودی‌های stale (پیش‌فرض `30d`).
  - `maxEntries`: حداکثر تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). Runtime برای سقف‌های در اندازهٔ production پاک‌سازی دسته‌ای را با یک بافر high-water کوچک می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را فوراً اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگه‌داری آرشیوهای transcript از نوع `*.reset.<timestamp>`. پیش‌فرض برابر `pruneAfter` است؛ برای غیرفعال کردن `false` را تنظیم کنید.
  - `maxDiskBytes`: بودجهٔ اختیاری دیسک برای دایرکتوری sessionها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین artifactها/sessionها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های session متصل به رشته.
  - `enabled`: کلید پیش‌فرض اصلی (ارائه‌دهنده‌ها می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: پیش‌فرض auto-unfocus هنگام عدم فعالیت بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینهٔ سن سخت‌گیرانهٔ پیش‌فرض بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهنده‌ها می‌توانند بازنویسی کنند)

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
      mode: "steer", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
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

حل‌وفصل (خاص‌ترین مورد برنده است): حساب → کانال → سراسری. `""` آن را غیرفعال می‌کند و آبشار را متوقف می‌کند. `"auto"` مقدار `[{identity.name}]` را استخراج می‌کند.

**متغیرهای الگو:**

| متغیر             | توضیح                  | مثال                       |
| ----------------- | ---------------------- | -------------------------- |
| `{model}`         | نام کوتاه مدل          | `claude-opus-4-6`          |
| `{modelFull}`     | شناسه کامل مدل         | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده        | `anthropic`                |
| `{thinkingLevel}` | سطح تفکر فعلی          | `high`, `low`, `off`       |
| `{identity.name}` | نام هویت عامل          | (همان `"auto"`)            |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- مقدار پیش‌فرض، `identity.emoji` عامل فعال است؛ در غیر این صورت `"👀"`. برای غیرفعال‌سازی، `""` تنظیم کنید.
- بازنویسی‌های مخصوص هر کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل‌وفصل: حساب → کانال → `messages.ackReaction` → جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: پس از پاسخ، تأیید را در کانال‌هایی که از واکنش پشتیبانی می‌کنند، مانند Slack، Discord، Telegram، WhatsApp و BlueBubbles حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخه عمر را در Slack، Discord و Telegram فعال می‌کند.
  در Slack و Discord، تنظیم‌نشده‌بودن باعث می‌شود وقتی واکنش‌های تأیید فعال‌اند، واکنش‌های وضعیت هم فعال بمانند.
  در Telegram، برای فعال‌سازی واکنش‌های وضعیت چرخه عمر، آن را به‌صراحت روی `true` تنظیم کنید.

### تجمیع ورودی

پیام‌های متنی سریع از همان فرستنده را در یک نوبت واحد عامل دسته‌بندی می‌کند. رسانه/پیوست‌ها بلافاصله ارسال را کامل می‌کنند. فرمان‌های کنترلی تجمیع را دور می‌زنند.

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

- `auto` حالت پیش‌فرض TTS خودکار را کنترل می‌کند: `off`، `always`، `inbound` یا `tagged`. `/tts on|off` می‌تواند ترجیحات محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصه‌سازی خودکار بازنویسی می‌کند.
- `modelOverrides` به‌صورت پیش‌فرض فعال است؛ مقدار پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند انتخاب صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` برمی‌گردند.
- ارائه‌دهندگان گفتار همراه، تحت مالکیت Plugin هستند. اگر `plugins.allow` تنظیم شده است، هر Plugin ارائه‌دهنده TTS را که می‌خواهید استفاده کنید وارد کنید؛ برای مثال `microsoft` برای Edge TTS. شناسه ارائه‌دهنده قدیمی `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطه پایانی TTS مربوط به OpenAI را بازنویسی می‌کند. ترتیب حل‌وفصل: پیکربندی، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1`.
- وقتی `providers.openai.baseUrl` به یک نقطه پایانی غیر OpenAI اشاره کند، OpenClaw آن را یک سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌تر می‌کند.

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

- وقتی چند ارائه‌دهنده گفت‌وگو پیکربندی شده‌اند، `talk.provider` باید با یک کلید در `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی گفت‌وگو (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند و به‌طور خودکار به `talk.providers.<provider>` مهاجرت داده می‌شوند.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` برمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- جایگزین `ELEVENLABS_API_KEY` فقط زمانی اعمال می‌شود که هیچ کلید API گفت‌وگو پیکربندی نشده باشد.
- `providers.*.voiceAliases` اجازه می‌دهد دستورهای گفت‌وگو از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face استفاده‌شده توسط کمک‌کننده MLX محلی macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS، وقتی کمک‌کننده همراه `openclaw-mlx-tts` موجود باشد، از طریق آن اجرا می‌شود؛ در غیر این صورت از یک فایل اجرایی در `PATH` استفاده می‌کند. `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌کننده را برای توسعه بازنویسی می‌کند.
- `speechLocale` شناسه locale مطابق BCP 47 را که توسط تشخیص گفتار گفت‌وگوی iOS/macOS استفاده می‌شود تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت گفت‌وگو پس از سکوت کاربر، پیش از ارسال رونوشت، چه مدت منتظر بماند. تنظیم‌نشده‌بودن، پنجره مکث پیش‌فرض پلتفرم را حفظ می‌کند (`700 ms on macOS and Android, 900 ms on iOS`).

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همه کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
