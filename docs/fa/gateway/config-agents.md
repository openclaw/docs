---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعاملی
    - تنظیم رفتار نشست، تحویل پیام و حالت مکالمه
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-07-16T16:03:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی مختص عامل در `agents.*`، `multiAgent.*`، `session.*`،
`messages.*` و `talk.*`. برای کانال‌ها، ابزارها، زمان اجرای Gateway و دیگر
کلیدهای سطح‌بالا، به [مرجع پیکربندی](/fa/gateway/configuration-reference) مراجعه کنید.

## پیش‌فرض‌های عامل

### `agents.defaults.workspace`

پیش‌فرض: در صورت تنظیم بودن، `OPENCLAW_WORKSPACE_DIR`؛ در غیر این صورت، `~/.openclaw/workspace` (یا وقتی `OPENCLAW_PROFILE` روی یک نمایه غیراپیش‌فرض تنظیم شده باشد، `~/.openclaw/workspace-<profile>`).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

مقدار صریح `agents.defaults.workspace` بر
`OPENCLAW_WORKSPACE_DIR` اولویت دارد. وقتی نمی‌خواهید مسیر را در پیکربندی بنویسید، از متغیر محیطی برای هدایت عامل‌های پیش‌فرض
به یک فضای کاری سوارشده استفاده کنید.

### `agents.defaults.repoRoot`

ریشه اختیاری مخزن که در خط Runtime پرامپت سیستم نمایش داده می‌شود. اگر تنظیم نشده باشد، OpenClaw با پیمایش روبه‌بالا از فضای کاری، آن را به‌طور خودکار تشخیص می‌دهد.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

فهرست مجاز پیش‌فرض و اختیاری مهارت‌ها برای عامل‌هایی که
`agents.list[].skills` را تنظیم نمی‌کنند.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github و weather را به ارث می‌برد
      { id: "docs", skills: ["docs-search"] }, // جایگزین پیش‌فرض‌ها می‌شود
      { id: "locked-down", skills: [] }, // بدون مهارت
    ],
  },
}
```

- برای نامحدود بودن پیش‌فرض مهارت‌ها، `agents.defaults.skills` را حذف کنید.
- برای به‌ارث‌بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
- برای نداشتن مهارت، `agents.list[].skills: []` را تنظیم کنید.
- یک فهرست غیرخالی `agents.list[].skills` مجموعه نهایی آن عامل است؛ این فهرست
  با پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های راه‌اندازی فضای کاری (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

از ایجاد فایل‌های اختیاری منتخب فضای کاری صرف‌نظر می‌کند، اما همچنان فایل‌های الزامی راه‌اندازی (`AGENTS.md`، `TOOLS.md`، `BOOTSTRAP.md`) را می‌نویسد. مقادیر معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

زمان تزریق فایل‌های راه‌اندازی فضای کاری به پرامپت سیستم را کنترل می‌کند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامه ایمن (پس از پاسخ تکمیل‌شده دستیار) از تزریق مجدد راه‌اندازی فضای کاری صرف‌نظر می‌کنند و اندازه پرامپت را کاهش می‌دهند. اجراهای Heartbeat و تلاش‌های مجدد پس از Compaction همچنان زمینه را بازسازی می‌کنند.
- `"never"`: راه‌اندازی فضای کاری و تزریق فایل‌های زمینه را در همه نوبت‌ها غیرفعال می‌کند. این گزینه را فقط برای عامل‌هایی استفاده کنید که چرخه عمر پرامپت خود را کاملاً مدیریت می‌کنند (موتورهای زمینه سفارشی، زمان‌های اجرای بومی که زمینه خود را می‌سازند، یا گردش‌کارهای تخصصی بدون راه‌اندازی). نوبت‌های Heartbeat و بازیابی پس از Compaction نیز از تزریق صرف‌نظر می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

بازنویسی مختص هر عامل: `agents.list[].contextInjection`. مقادیر حذف‌شده،
`agents.defaults.contextInjection` را به ارث می‌برند.

### `agents.defaults.bootstrapMaxChars`

حداکثر تعداد نویسه برای هر فایل راه‌اندازی فضای کاری پیش از کوتاه‌سازی. پیش‌فرض: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

بازنویسی مختص هر عامل: `agents.list[].bootstrapMaxChars`. مقادیر حذف‌شده،
`agents.defaults.bootstrapMaxChars` را به ارث می‌برند.

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده از همه فایل‌های راه‌اندازی فضای کاری. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

بازنویسی مختص هر عامل: `agents.list[].bootstrapTotalMaxChars`. مقادیر حذف‌شده،
`agents.defaults.bootstrapTotalMaxChars` را به ارث می‌برند.

### بازنویسی‌های نمایه راه‌اندازی مختص هر عامل

هنگامی از بازنویسی‌های نمایه راه‌اندازی مختص هر عامل استفاده کنید که یک عامل به رفتار تزریق پرامپتی متفاوت
از پیش‌فرض‌های مشترک نیاز دارد. فیلدهای حذف‌شده از
`agents.defaults` به ارث می‌برند.

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

اعلان قابل‌مشاهده برای عامل در پرامپت سیستم را هنگام کوتاه‌شدن زمینه راه‌اندازی کنترل می‌کند.
پیش‌فرض: `"always"`.

- `"off"`: هرگز متن اعلان کوتاه‌سازی را به پرامپت سیستم تزریق نکنید.
- `"once"`: برای هر امضای کوتاه‌سازی منحصربه‌فرد، یک اعلان مختصر را یک‌بار تزریق کنید.
- `"always"`: هنگام وجود کوتاه‌سازی، در هر اجرا یک اعلان مختصر تزریق کنید (توصیه می‌شود).

تعدادهای خام/تزریق‌شده تفصیلی و فیلدهای تنظیم پیکربندی در اطلاعات تشخیصی، مانند
گزارش‌های زمینه/وضعیت و گزارش‌ها، باقی می‌مانند؛ زمینه معمول کاربر/زمان اجرای WebChat فقط
اعلان مختصر بازیابی را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### نگاشت مالکیت بودجه زمینه

OpenClaw چندین بودجه حجیم پرامپت/زمینه دارد و این بودجه‌ها
عمداً بر اساس زیرسامانه تفکیک شده‌اند، نه اینکه همگی از یک
کنترل عمومی عبور کنند.

| بودجه                                                         | پوشش                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | تزریق عادی راه‌اندازی فضای کاری                                                                                                                            |
| `agents.defaults.startupContext.*`                             | پیش‌درآمد یک‌باره اجرای مدل هنگام بازنشانی/راه‌اندازی، شامل فایل‌های روزانه اخیر `memory/*.md`. فرمان‌های چت مستقل `/new` و `/reset` بدون فراخوانی مدل تأیید می‌شوند |
| `skills.limits.*`                                              | فهرست فشرده مهارت‌ها که به پرامپت سیستم تزریق می‌شود                                                                                                         |
| `agents.defaults.contextLimits.*`                              | گزیده‌های محدود زمان اجرا و بلوک‌های تزریق‌شده تحت مالکیت زمان اجرا                                                                                                      |
| `memory.qmd.limits.*`                                          | اندازه‌گذاری قطعه و تزریق جست‌وجوی حافظه نمایه‌شده                                                                                                              |

بازنویسی‌های متناظر مختص هر عامل:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد راه‌اندازی نوبت نخست را که در اجراهای مدل هنگام بازنشانی/راه‌اندازی تزریق می‌شود، کنترل می‌کند.
فرمان‌های چت مستقل `/new` و `/reset` بازنشانی را بدون فراخوانی
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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: سقف پیش‌فرض گزیده `memory_get` پیش از افزوده‌شدن
  فراداده کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجره خط پیش‌فرض `memory_get` هنگامی که `lines`
  حذف شده باشد.
- `toolResultMaxChars`: سقف پیشرفته نتیجه زنده ابزار که برای نتایج
  ماندگارشده و بازیابی سرریز استفاده می‌شود. برای سقف خودکار زمینه مدل، آن را تنظیم‌نشده باقی بگذارید:
  `16000` نویسه زیر 100K توکن، `32000` نویسه در 100K+ توکن و `64000`
  نویسه در 200K+ توکن. مقادیر صریح تا `1000000` برای
  مدل‌های دارای زمینه طولانی پذیرفته می‌شوند، اما سقف مؤثر همچنان به حدود 30% از
  پنجره زمینه مدل محدود است. `openclaw doctor --deep` سقف مؤثر را چاپ می‌کند
  و doctor فقط زمانی هشدار می‌دهد که یک بازنویسی صریح قدیمی باشد یا اثری نداشته باشد.
- `postCompactionMaxChars`: سقف گزیده AGENTS.md که هنگام تزریق
  تازه‌سازی پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

بازنویسی مختص هر عامل برای کنترل‌های مشترک `contextLimits`. فیلدهای حذف‌شده از
`agents.defaults.contextLimits` به ارث می‌برند.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // سقف پیشرفته برای این عامل
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

سقف سراسری فهرست فشرده مهارت‌ها که به پرامپت سیستم تزریق می‌شود. این مورد
بر خواندن درخواستی فایل‌های `SKILL.md` تأثیری ندارد.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

بازنویسی مختص هر عامل برای بودجه پرامپت مهارت‌ها.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

حداکثر اندازه پیکسلی طولانی‌ترین ضلع تصویر در بلوک‌های تصویر رونوشت/ابزار پیش از فراخوانی ارائه‌دهنده.
پیش‌فرض: `1200`.

مقادیر کمتر معمولاً مصرف توکن بینایی و اندازه بار درخواست را در اجراهای پر از نماگرفت کاهش می‌دهند.
مقادیر بیشتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ترجیح فشرده‌سازی/جزئیات ابزار تصویر برای تصویرهای بارگذاری‌شده از مسیر فایل، نشانی وب و ارجاع رسانه.
پیش‌فرض: `auto`.

OpenClaw نردبان تغییر اندازه را با مدل تصویر انتخاب‌شده تطبیق می‌دهد. برای مثال، Claude Opus 4.8، OpenAI GPT-5.6 Sol، Qwen VL و مدل‌های بینایی میزبانی‌شده Llama 4 می‌توانند از تصاویر بزرگ‌تری نسبت به مسیرهای بینایی قدیمی‌تر/پیش‌فرض با جزئیات بالا استفاده کنند، درحالی‌که نوبت‌های چندتصویری در حالت `auto` با شدت بیشتری فشرده می‌شوند تا هزینه توکن و تأخیر کنترل شود.

مقادیر:

- `auto`: با محدودیت‌های مدل و تعداد تصاویر تطبیق دهید.
- `efficient`: برای کاهش مصرف توکن و بایت، تصاویر کوچک‌تر را ترجیح دهید.
- `balanced`: از نردبان استاندارد میانه‌رو استفاده کنید.
- `high`: جزئیات بیشتری را برای نماگرفت‌ها، نمودارها و تصاویر اسناد حفظ کنید.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

منطقه زمانی زمینه پرامپت سیستم (نه مُهرهای زمانی پیام). در صورت نبود، از منطقه زمانی میزبان استفاده می‌شود.

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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // پارامترهای پیش‌فرض سراسری ارائه‌دهنده
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - فرم رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - فرم شیء، مدل اصلی به‌همراه مدل‌های جایگزین مرتب‌شده را تنظیم می‌کند.
- `utilityModel`: ارجاع یا نام مستعار اختیاری `provider/model` برای وظایف داخلی کوتاه. درحال‌حاضر برای عنوان‌های تولیدشدهٔ نشست Control UI، عنوان‌های موضوع پیام خصوصی Telegram، عنوان‌های رشتهٔ خودکار Discord و [روایت پیش‌نویس پیشرفت](/fa/concepts/progress-drafts#narrated-status) استفاده می‌شود. وقتی تنظیم نشده باشد، OpenClaw در صورت وجود، پیش‌فرض اعلام‌شدهٔ مدل کوچک ارائه‌دهندهٔ اصلی را استخراج می‌کند (OpenAI ← `gpt-5.6-luna`، Anthropic ← `claude-haiku-4-5`)؛ در غیر این صورت، وظایف عنوان به مدل اصلی عامل بازمی‌گردند و روایت غیرفعال می‌ماند. برای غیرفعال‌کردن کامل مسیریابی وظایف کمکی، `utilityModel: ""` را تنظیم کنید. `agents.list[].utilityModel` پیش‌فرض را بازنویسی می‌کند (مقدار خالی برای هر عامل، آن را برای همان عامل غیرفعال می‌کند) و بازنویسی مدل مختص عملیات بر هر دو اولویت دارد. وظایف کمکی فراخوانی‌های مدل جداگانه انجام می‌دهند و محتوای مختص وظیفه را به ارائه‌دهندهٔ مدل انتخاب‌شده می‌فرستند. تولید عنوان داشبورد حداکثر 1,000 نویسهٔ نخست اولین پیام غیر‌دستوری را می‌فرستد؛ روایت، درخواست ورودی را همراه با خلاصه‌های فشرده و ویرایش‌شدهٔ ابزارها می‌فرستد. ارائه‌دهنده‌ای را انتخاب کنید که با الزامات هزینه و نحوهٔ پردازش داده‌های شما مطابقت داشته باشد.
- `imageModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - وقتی مدل فعال نمی‌تواند تصویر بپذیرد، مسیر ابزار `image` از آن به‌عنوان پیکربندی مدل بینایی استفاده می‌کند. در عوض، مدل‌های دارای قابلیت بینایی بومی، بایت‌های تصویر بارگذاری‌شده را مستقیماً دریافت می‌کنند.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر بپذیرد، برای مسیریابی جایگزین استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های بدون پیشوند برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسهٔ بدون پیشوند به‌طور یکتا با یک ورودی پیکربندی‌شدهٔ دارای قابلیت تصویر در `models.providers.*.models` مطابقت داشته باشد، OpenClaw آن را با ارائه‌دهندهٔ مربوطه کامل می‌کند. تطابق‌های پیکربندی‌شدهٔ مبهم به پیشوند صریح ارائه‌دهنده نیاز دارند.
- `imageGenerationModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده که تصویر تولید کند، از آن استفاده می‌کنند.
  - مقادیر معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینهٔ شفاف OpenAI.
  - اگر ارائه‌دهنده/مدلی را مستقیماً انتخاب می‌کنید، احراز هویت ارائه‌دهندهٔ متناظر را نیز پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده‌ای دارای پشتوانهٔ احراز هویت را استنتاج کند. ابتدا ارائه‌دهندهٔ پیش‌فرض فعلی و سپس سایر ارائه‌دهندگان ثبت‌شدهٔ تولید تصویر را به‌ترتیب شناسهٔ ارائه‌دهنده امتحان می‌کند.
- `musicGenerationModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` از آن استفاده می‌کنند.
  - مقادیر معمول: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview` یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده‌ای دارای پشتوانهٔ احراز هویت را استنتاج کند. ابتدا ارائه‌دهندهٔ پیش‌فرض فعلی و سپس سایر ارائه‌دهندگان ثبت‌شدهٔ تولید موسیقی را به‌ترتیب شناسهٔ ارائه‌دهنده امتحان می‌کند.
  - اگر ارائه‌دهنده/مدلی را مستقیماً انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهندهٔ متناظر را نیز پیکربندی کنید.
- `videoGenerationModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - قابلیت مشترک تولید ویدئو و ابزار داخلی `video_generate` از آن استفاده می‌کنند.
  - مقادیر معمول: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash` یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند پیش‌فرض ارائه‌دهنده‌ای دارای پشتوانهٔ احراز هویت را استنتاج کند. ابتدا ارائه‌دهندهٔ پیش‌فرض فعلی و سپس سایر ارائه‌دهندگان ثبت‌شدهٔ تولید ویدئو را به‌ترتیب شناسهٔ ارائه‌دهنده امتحان می‌کند.
  - اگر ارائه‌دهنده/مدلی را مستقیماً انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهندهٔ متناظر را نیز پیکربندی کنید.
  - Plugin رسمی تولید ویدئوی Qwen از حداکثر 1 ویدئوی خروجی، 1 تصویر ورودی، 4 ویدئوی ورودی، مدت‌زمان 10 ثانیه و گزینه‌های سطح ارائه‌دهندهٔ `size`، `aspectRatio`، `resolution`، `audio` و `watermark` پشتیبانی می‌کند.
- `pdfModel`: یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - ابزار `pdf` برای مسیریابی مدل از آن استفاده می‌کند.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شدهٔ نشست/پیش‌فرض بازمی‌گردد.
- `pdfMaxBytesMb`: محدودیت اندازهٔ پیش‌فرض PDF برای ابزار `pdf`، هنگامی که `maxBytesMb` در زمان فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: حداکثر تعداد صفحهٔ پیش‌فرضی که حالت جایگزین استخراج در ابزار `pdf` در نظر می‌گیرد.
- `verboseDefault`: سطح پیش‌فرض جزئیات خروجی برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خطوط ابزار در پیش‌نویس پیشرفت. مقادیر: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (افزودن فرمان/جزئیات خام در صورت وجود). مقدار مختص عامل `agents.list[].toolProgressDetail` این پیش‌فرض را بازنویسی می‌کند.
- `reasoningDefault`: قابلیت مشاهدهٔ پیش‌فرض استدلال برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"stream"`. مقدار مختص عامل `agents.list[].reasoningDefault` این پیش‌فرض را بازنویسی می‌کند. پیش‌فرض‌های پیکربندی‌شدهٔ استدلال فقط برای مالکان، فرستندگان مجاز یا زمینه‌های Gateway با نقش مدیر اپراتور اعمال می‌شوند، مشروط بر اینکه هیچ بازنویسی استدلال برای هر پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح پیش‌فرض خروجی ارتقایافته برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (برای مثال `openai/gpt-5.6-sol` برای دسترسی Codex OAuth). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار، سپس تطابق یکتای ارائه‌دهندهٔ پیکربندی‌شده برای همان شناسهٔ دقیق مدل را امتحان می‌کند و فقط پس از آن به ارائه‌دهندهٔ پیش‌فرض پیکربندی‌شده بازمی‌گردد (رفتار سازگاری منسوخ‌شده است، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را عرضه نکند، OpenClaw به‌جای نمایش پیش‌فرض قدیمیِ ارائه‌دهندهٔ حذف‌شده، به نخستین ارائه‌دهنده/مدل پیکربندی‌شده بازمی‌گردد.
- `models`: فهرست مدل‌های پیکربندی‌شده و فهرست مجاز برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (مختص ارائه‌دهنده، برای مثال `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، مسیریابی `provider` در OpenRouter، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - از ورودی‌های `provider/*` مانند `"openai/*": {}` یا `"vllm/*": {}` استفاده کنید تا همهٔ مدل‌های کشف‌شدهٔ ارائه‌دهندگان انتخابی، بدون فهرست‌کردن دستی تک‌تک شناسه‌های مدل نمایش داده شوند.
  - وقتی همهٔ مدل‌های کشف‌شده به‌صورت پویا برای آن ارائه‌دهنده باید از یک زمان‌اجرای یکسان استفاده کنند، `agentRuntime` را به یک ورودی `provider/*` اضافه کنید. سیاست دقیق زمان‌اجرای `provider/model` همچنان بر نویسهٔ عام اولویت دارد.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های موجود فهرست مجاز را حذف می‌کنند نمی‌پذیرد، مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های پیکربندی/راه‌اندازی اولیهٔ محدود به ارائه‌دهنده، مدل‌های ارائه‌دهندهٔ انتخاب‌شده را در این نگاشت ادغام می‌کنند و ارائه‌دهندگان نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌طور خودکار فعال می‌شود. برای متوقف‌کردن تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای بازنویسی آستانه از `params.responsesCompactThreshold` استفاده کنید. [Compaction سمت سرور OpenAI](/fa/providers/openai#advanced-configuration) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری ارائه‌دهنده که برای همهٔ مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم کنید (برای مثال `{ cacheRetention: "long" }`).
- اولویت ادغام `params` (پیکربندی): `agents.defaults.params` (پایهٔ سراسری) توسط `agents.defaults.models["provider/model"].params` (مختص مدل) بازنویسی می‌شود، سپس `agents.list[].params` (شناسهٔ عامل منطبق) بر اساس کلید بازنویسی می‌کند. برای جزئیات، [ذخیره‌سازی موقت پرامپت](/fa/reference/prompt-caching) را ببینید.
- `models.providers.openrouter.params.provider`: سیاست پیش‌فرض مسیریابی ارائه‌دهنده در سراسر OpenRouter. OpenClaw آن را به شیء `provider` درخواست OpenRouter ارسال می‌کند؛ `agents.defaults.models["openrouter/<model>"].params.provider` مختص مدل و پارامترهای عامل بر اساس کلید بازنویسی می‌کنند. [مسیریابی ارائه‌دهندهٔ OpenRouter](/fa/providers/openrouter#advanced-configuration) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON پیشرفتهٔ عبوری که در بدنه‌های درخواست `api: "openai-completions"` برای پراکسی‌های سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای تولیدشدهٔ درخواست تداخل داشته باشد، بدنهٔ اضافی اولویت دارد؛ مسیرهای تکمیل غیربومی همچنان پس از آن `store` مختص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های قالب چت سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با استدلال غیرفعال، Plugin همراه vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را می‌فرستد؛ `chat_template_kwargs` صریح، پیش‌فرض‌های تولیدشده را بازنویسی می‌کند و `extra_body.chat_template_kwargs` همچنان اولویت نهایی را دارد. مدل‌های استدلال Qwen و Nemotron پیکربندی‌شده در vLLM، به‌جای نردبان تلاش چندسطحی، گزینه‌های دودویی `/think` (`off`، `on`) را ارائه می‌کنند.
- `compat.thinkingFormat`: سبک محمولهٔ استدلال سازگار با OpenAI. از `"together"` برای `reasoning.enabled` به‌سبک Together، از `"qwen"` برای `enable_thinking` سطح بالای به‌سبک Qwen، یا از `"qwen-chat-template"` برای `chat_template_kwargs.enable_thinking` در بک‌اندهای خانوادهٔ Qwen که از آرگومان‌های کلیدی قالب چت در سطح درخواست پشتیبانی می‌کنند، مانند vLLM، استفاده کنید. OpenClaw استدلال غیرفعال را به `false` و استدلال فعال را به `true` نگاشت می‌کند و مدل‌های Qwen پیکربندی‌شده در vLLM، گزینه‌های دودویی `/think` را برای این قالب‌ها ارائه می‌کنند.
- `compat.supportedReasoningEfforts`: فهرست میزان تلاش استدلال سازگار با OpenAI برای هر مدل. برای نقاط پایانی سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را وارد کنید؛ سپس OpenClaw اعتبارسنجی `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی وصلهٔ نشست، اعتبارسنجی CLI عامل و اعتبارسنجی `llm-task` برای آن ارائه‌دهنده/مدل پیکربندی‌شده ارائه می‌کند. وقتی بک‌اند برای یک سطح استاندارد به مقداری مختص ارائه‌دهنده نیاز دارد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: گزینهٔ فعال‌سازی مختص Z.AI برای حفظ استدلال. وقتی فعال باشد و استدلال روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را می‌فرستد و `reasoning_content` قبلی را بازپخش می‌کند؛ [استدلال و حفظ استدلال در Z.AI](/fa/providers/zai#advanced-configuration) را ببینید.
- `localService`: مدیر فرایند اختیاری در سطح ارائه‌دهنده برای سرورهای مدل محلی/خودمیزبان. وقتی مدل انتخاب‌شده به آن ارائه‌دهنده تعلق داشته باشد، OpenClaw آدرس `healthUrl` (یا `baseUrl + "/models"`) را بررسی می‌کند، اگر نقطهٔ پایانی از دسترس خارج باشد `command` را با `args` راه‌اندازی می‌کند، تا `readyTimeoutMs` منتظر می‌ماند و سپس درخواست مدل را می‌فرستد. `command` باید یک مسیر مطلق باشد. `idleStopMs: 0` فرایند را تا خروج OpenClaw زنده نگه می‌دارد؛ یک مقدار مثبت، فرایند راه‌اندازی‌شده توسط OpenClaw را پس از آن تعداد میلی‌ثانیه بیکاری متوقف می‌کند. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- سیاست زمان اجرا به ارائه‌دهندگان یا مدل‌ها تعلق دارد، نه به `agents.defaults`. برای قواعد سراسری ارائه‌دهنده از `models.providers.<provider>.agentRuntime` و برای قواعد مختص مدل از `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` استفاده کنید. پیشوند ارائه‌دهنده/مدل به‌تنهایی هرگز یک هارنس را انتخاب نمی‌کند. وقتی زمان اجرا تنظیم نشده یا `auto` است، OpenAI فقط برای یک مسیر دقیق و رسمی HTTPS مربوط به Platform Responses یا ChatGPT Responses و در نبود بازنویسی درخواست توسط نویسنده، ممکن است Codex را به‌طور ضمنی انتخاب کند. [زمان اجرای ضمنی عامل OpenAI](/fa/providers/openai#implicit-agent-runtime) را ببینید.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`، `/models set-image` و فرمان‌های افزودن/حذف مسیر جایگزین)، فرم متعارف شیء را ذخیره می‌کنند و در صورت امکان فهرست‌های مسیر جایگزین موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجرای موازی عامل‌ها در میان نشست‌ها (هر نشست همچنان به‌صورت سریالی اجرا می‌شود). پیش‌فرض: `4`.

### سیاست Runtime

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`، `"openclaw"`، شناسهٔ ثبت‌شدهٔ مهار Plugin، یا نام مستعار پشتیبانی‌شدهٔ بک‌اند CLI. Plugin همراه Codex، `codex` را ثبت می‌کند؛ Plugin همراه Anthropic بک‌اند CLI با نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` به مهارهای Plugin ثبت‌شده اجازه می‌دهد مسیرهای مؤثری را که قرارداد پشتیبانی خود را اعلام می‌کنند یا به‌نحوی برآورده می‌سازند، در اختیار بگیرند و وقتی هیچ مهاری مطابقت ندارد از OpenClaw استفاده می‌کند. یک Runtime صریح Plugin مانند `id: "codex"` به آن مهار و یک مسیر مؤثر سازگار نیاز دارد؛ اگر هرکدام در دسترس نباشد یا اجرا شکست بخورد، به‌صورت بسته شکست می‌خورد.
- `id: "pi"` فقط به‌عنوان نام مستعار منسوخ‌شدهٔ `openclaw` پذیرفته می‌شود تا پیکربندی‌های منتشرشده از v2026.5.22 و نسخه‌های پیشین حفظ شوند. پیکربندی جدید باید از `openclaw` استفاده کند.
- اولویت Runtime دقیقاً ابتدا سیاست مدل دقیق (`agents.list[].models["provider/model"]`، `agents.defaults.models["provider/model"]` یا `models.providers.<provider>.models[]`) است، سپس `agents.list[]` / `agents.defaults.models["provider/*"]` و بعد سیاست سراسری ارائه‌دهنده در `models.providers.<provider>.agentRuntime`.
- کلیدهای Runtime کل عامل قدیمی هستند. `agents.defaults.agentRuntime`، `agents.list[].agentRuntime`، پین‌های Runtime نشست و `OPENCLAW_AGENT_RUNTIME` در انتخاب Runtime نادیده گرفته می‌شوند. برای حذف مقادیر منسوخ، `openclaw doctor --fix` را اجرا کنید.
- مسیرهای رسمی و واجد شرایط HTTPS برای OpenAI Responses/ChatGPT که تطابق دقیق دارند و فاقد بازنویسی تألیفی درخواست هستند، ممکن است به‌طور ضمنی از مهار Codex استفاده کنند. `agentRuntime.id: "codex"` در سطح ارائه‌دهنده/مدل، Codex را به الزامی با شکست بسته تبدیل می‌کند، اما یک مسیر ناسازگار را سازگار نمی‌کند.
- برای استقرارهای Claude CLI، `model: "anthropic/claude-opus-4-8"` را همراه با `agentRuntime.id: "claude-cli"` در سطح مدل ترجیح دهید. ارجاع‌های قدیمی `claude-cli/<model>` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را متعارف نگه دارد و بک‌اند اجرا را در سیاست Runtime ارائه‌دهنده/مدل قرار دهد.
- این فقط اجرای نوبت عامل متنی را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدئو و TTS همچنان از تنظیمات ارائه‌دهنده/مدل خود استفاده می‌کنند.

**صورت‌های کوتاه نام‌های مستعار داخلی** (فقط وقتی مدل در `agents.defaults.models` باشد اعمال می‌شوند):

| نام مستعار          | مدل                             |
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

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI برای پخش جریانی فراخوانی ابزار، به‌طور پیش‌فرض `tool_stream` را فعال می‌کنند. برای غیرفعال‌کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
در OpenClaw، تفکر برای Anthropic Claude Opus 4.8 به‌طور پیش‌فرض غیرفعال می‌ماند؛ وقتی تفکر تطبیقی صراحتاً فعال شود، پیش‌فرض میزان تلاش متعلق به ارائه‌دهندهٔ Anthropic برابر `high` است. مدل‌های Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

بک‌اندهای اختیاری CLI برای اجراهای جایگزین صرفاً متنی (بدون فراخوانی ابزار). هنگامی که ارائه‌دهندگان API شکست می‌خورند، به‌عنوان پشتیبان مفید هستند.

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
          // یا وقتی CLI پرچم فایل پرامپت را می‌پذیرد، از systemPromptFileArg استفاده کنید.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- بک‌اندهای CLI در درجهٔ اول متنی هستند؛ ابزارها همیشه غیرفعال‌اند.
- وقتی `sessionArg` تنظیم شده باشد، نشست‌ها پشتیبانی می‌شوند.
- وقتی `imageArg` مسیرهای فایل را بپذیرد، عبور مستقیم تصویر پشتیبانی می‌شود.
- `reseedFromRawTranscriptWhenUncompacted: true` به یک بک‌اند اجازه می‌دهد نشست‌های ابطال‌شدهٔ امن را از بخش انتهایی محدودشدهٔ رونوشت خام OpenClaw بازیابی کند، پیش از آنکه
  نخستین خلاصهٔ Compaction وجود داشته باشد. تغییرات نمایهٔ احراز هویت یا دورهٔ اعتبارنامه
  همچنان هرگز باعث بازکاشت خام نمی‌شوند.

### `agents.defaults.promptOverlays`

پوشش‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانوادهٔ مدل روی سطوح پرامپت مونتاژشده توسط OpenClaw اعمال می‌شوند. شناسه‌های مدل خانوادهٔ GPT-5 قرارداد رفتاری مشترک را در مسیرهای OpenClaw/ارائه‌دهنده دریافت می‌کنند؛ `personality` فقط لایهٔ سبک تعامل دوستانه را کنترل می‌کند. مسیرهای بومی کارساز برنامهٔ Codex، دستورالعمل‌های پایه/مدل متعلق به Codex را به‌جای این پوشش GPT-5 متعلق به OpenClaw نگه می‌دارند و OpenClaw شخصیت داخلی Codex را برای رشته‌های بومی غیرفعال می‌کند.

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
- `"off"` فقط لایهٔ دوستانه را غیرفعال می‌کند؛ قرارداد رفتاری برچسب‌خوردهٔ GPT-5 فعال باقی می‌ماند.
- `plugins.entries.openai.config.personality` قدیمی همچنان وقتی این تنظیم مشترک تنظیم نشده باشد خوانده می‌شود.

### `agents.defaults.heartbeat`

اجراهای دوره‌ای Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m غیرفعال می‌کند
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // پیش‌فرض: true؛ false بخش Heartbeat را از پرامپت سیستم حذف می‌کند
        lightContext: false, // پیش‌فرض: false؛ true فقط HEARTBEAT.md را از فایل‌های راه‌انداز فضای کاری نگه می‌دارد
        isolatedSession: false, // پیش‌فرض: false؛ true هر Heartbeat را در یک نشست تازه اجرا می‌کند (بدون تاریخچهٔ مکالمه)
        skipWhenBusy: false, // پیش‌فرض: false؛ true همچنین منتظر مسیرهای عامل فرعی/تودرتوی این عامل می‌ماند
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (پیش‌فرض) | block
        target: "none", // پیش‌فرض: none | گزینه‌ها: last | whatsapp | telegram | discord | ...
        prompt: "اگر HEARTBEAT.md وجود دارد، آن را بخوان...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: رشتهٔ مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال‌کردن، روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستم حذف می‌کند و تزریق `HEARTBEAT.md` به زمینهٔ راه‌انداز را انجام نمی‌دهد. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، محموله‌های هشدار خطای ابزار را هنگام اجرای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: حداکثر زمان مجاز بر حسب ثانیه برای یک نوبت عامل Heartbeat، پیش از آنکه متوقف شود. تنظیم‌نشده بگذارید تا در صورت تنظیم‌بودن `agents.defaults.timeoutSeconds` از آن استفاده شود؛ در غیر این صورت، تناوب Heartbeat با سقف 600 ثانیه استفاده می‌شود.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب و `reason=dm-blocked` را منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینهٔ راه‌انداز سبک استفاده می‌کنند و از میان فایل‌های راه‌انداز فضای کاری فقط `HEARTBEAT.md` را نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در نشستی تازه و بدون تاریخچهٔ مکالمهٔ قبلی اجرا می‌شود. همان الگوی جداسازی Cron در `sessionTarget: "isolated"`. هزینهٔ توکن هر Heartbeat را از ~100K به ~2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در صورت مشغول‌بودن مسیرهای اضافی آن عامل به تعویق می‌افتند: کار عامل فرعی مبتنی بر کلید نشست خود یا کار فرمان تودرتو. مسیرهای Cron حتی بدون این پرچم همیشه Heartbeatها را به تعویق می‌اندازند.
- برای هر عامل: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر عاملی `heartbeat` را تعریف کند، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند — فاصله‌های کوتاه‌تر توکن بیشتری مصرف می‌کنند.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // شناسهٔ یک Plugin ارائه‌دهندهٔ Compaction ثبت‌شده (اختیاری)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "شناسه‌های استقرار، شناسه‌های تیکت و جفت‌های host:port را دقیقاً حفظ کن.", // وقتی identifierPolicy=custom باشد استفاده می‌شود
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // بررسی اختیاری فشار حلقهٔ ابزار
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // انتخاب اختیاری برای تزریق مجدد بخش‌های AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // بازنویسی اختیاری مدل فقط برای Compaction
        truncateAfterCompaction: true, // پس از Compaction به یک JSONL جانشین کوچک‌تر چرخش می‌کند
        maxActiveTranscriptBytes: "20mb", // محرک اختیاری پیش‌اجرای Compaction محلی
        notifyUser: true, // هنگام شروع/تکمیل Compaction و افت عملکرد تخلیهٔ حافظه اعلان می‌دهد (پیش‌فرض: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // بازنویسی اختیاری مدل فقط برای تخلیهٔ حافظه
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "نشست به Compaction نزدیک می‌شود. حافظه‌های ماندگار را اکنون ذخیره کن.",
          prompt: "یادداشت‌های ماندگار را در memory/YYYY-MM-DD.md بنویس؛ اگر چیزی برای ذخیره وجود ندارد، دقیقاً با توکن بی‌صدای NO_REPLY پاسخ بده.",
        },
      },
    },
  },
}
```

- `mode`: `default` یا `safeguard` (خلاصه‌سازی قطعه‌ای برای تاریخچه‌های طولانی). به [Compaction](/fa/concepts/compaction) مراجعه کنید.
- `provider`: شناسه یک Plugin ارائه‌دهنده Compaction ثبت‌شده. وقتی تنظیم شود، به‌جای خلاصه‌سازی داخلی LLM، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به روش داخلی بازمی‌گردد. تنظیم یک ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. به [Compaction](/fa/concepts/compaction) مراجعه کنید.
- `timeoutSeconds`: حداکثر زمان مجاز برحسب ثانیه برای یک عملیات Compaction، پیش از آنکه OpenClaw آن را متوقف کند. پیش‌فرض: `180`.
- `reserveTokens`: فضای توکنی ذخیره‌شده برای خروجی مدل و نتایج آتی ابزارها پس از Compaction. وقتی پنجره زمینه مدل مشخص باشد، OpenClaw ذخیره مؤثر را محدود می‌کند تا بودجه پرامپت را مصرف نکند.
- `reserveTokensFloor`: حداقل ذخیره‌ای که زمان اجرای تعبیه‌شده اعمال می‌کند. برای غیرفعال‌کردن حداقل، `0` را تنظیم کنید. این حداقل همچنان تابع سقف فعال پنجره زمینه است.
- `keepRecentTokens`: بودجه نقطه برش عامل برای نگه‌داشتن جدیدترین دنباله رونوشت به‌صورت عین‌به‌عین. اگر `/compact` دستی صراحتاً تنظیم شده باشد، از این مقدار پیروی می‌کند؛ در غیر این صورت، Compaction دستی یک نقطه بررسی قطعی است.
- `recentTurnsPreserve`: تعداد جدیدترین نوبت‌های کاربر/دستیار که خارج از خلاصه‌سازی حفاظتی به‌صورت عین‌به‌عین نگه داشته می‌شوند. پیش‌فرض: `3`.
- `maxHistoryShare`: حداکثر سهم مجاز از کل بودجه زمینه برای تاریخچه نگه‌داشته‌شده پس از Compaction (بازه `0.1` تا `0.9`).
- `identifierPolicy`: `strict` (پیش‌فرض)، `off` یا `custom`. گزینه `strict` هنگام خلاصه‌سازی Compaction، راهنمای داخلی حفظ شناسه‌های غیرشفاف را در ابتدا می‌افزاید.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه‌ها که هنگام `identifierPolicy=custom` استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش مجدد در صورت خروجی بدقالب برای خلاصه‌های حفاظتی. در حالت حفاظتی به‌طور پیش‌فرض فعال است؛ برای ردکردن ممیزی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه ابزار. وقتی `enabled: true` باشد، OpenClaw پس از افزوده‌شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش جاری را پیش از ارسال پرامپت متوقف می‌کند و از مسیر بازیابی پیش‌بررسی موجود برای کوتاه‌کردن نتایج ابزار یا اجرای Compaction و تلاش مجدد استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postIndexSync`: حالت بازنمایه‌سازی حافظه نشست پس از Compaction. پیش‌فرض: `"async"`. برای بیشترین تازگی از `"await"`، برای تأخیر کمتر Compaction از `"async"`، یا فقط زمانی که همگام‌سازی حافظه نشست در جای دیگری انجام می‌شود از `"off"` استفاده کنید.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق مجدد پس از Compaction. وقتی تنظیم نشده باشد یا روی `[]` تنظیم شود، تزریق مجدد غیرفعال است. تنظیم صریح `["Session Startup", "Red Lines"]` این جفت را فعال می‌کند و مسیر جایگزین قدیمی `Every Session`/`Safety` را حفظ می‌کند. این گزینه را فقط زمانی فعال کنید که زمینه اضافی ارزش خطر تکرار راهنمای پروژه را داشته باشد که پیش‌تر در خلاصه Compaction ثبت شده است.
- `model`: مقدار اختیاری `provider/model-id` یا نام مستعار ساده از `agents.defaults.models`، فقط برای خلاصه‌سازی Compaction. نام‌های مستعار ساده پیش از ارسال حل می‌شوند؛ در صورت تداخل، شناسه‌های صریح مدل در پیکربندی اولویت خود را حفظ می‌کنند. زمانی از این گزینه استفاده کنید که نشست اصلی باید یک مدل را حفظ کند، اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند؛ اگر تنظیم نشود، Compaction از مدل اصلی نشست استفاده می‌کند.
- `truncateAfterCompaction`: رونوشت نشست فعال را پس از Compaction می‌چرخاند تا نوبت‌های آینده فقط خلاصه و دنباله خلاصه‌نشده را بارگذاری کنند، درحالی‌که رونوشت کامل قبلی بایگانی می‌ماند. از رشد نامحدود رونوشت فعال در نشست‌های طولانی‌مدت جلوگیری می‌کند. پیش‌فرض: `false`.
- `maxActiveTranscriptBytes`: آستانه اختیاری بایت (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی تاریخچه رونوشت از آستانه عبور کند، پیش از اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به رونوشت جانشین کوچک‌تری بچرخد. وقتی تنظیم نشده باشد یا `0` باشد، غیرفعال است.
- `notifyUser`: وقتی `true` باشد، اعلان‌های کوتاه نگه‌داری زمینه را برای کاربر می‌فرستد: هنگام آغاز و پایان Compaction (برای مثال، «در حال فشرده‌سازی زمینه...» و «فشرده‌سازی کامل شد») و زمانی که تخلیه حافظه پیش از Compaction به پایان ظرفیت می‌رسد و پاسخ در وضعیت تنزل‌یافته ادامه می‌یابد (برای مثال، «نگه‌داری حافظه موقتاً ناموفق بود؛ پاسخ شما ادامه می‌یابد.»). برای بی‌صدا نگه‌داشتن این اعلان‌ها، به‌طور پیش‌فرض غیرفعال است.
- `memoryFlush`: نوبت عاملی بی‌صدا پیش از Compaction خودکار برای ذخیره خاطرات ماندگار. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی ارائه‌دهنده/مدلی دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیره مسیر جایگزین نشست فعال را به ارث نمی‌برد. `forceFlushTranscriptBytes` حتی اگر شمارنده‌های توکن قدیمی باشند، با رسیدن اندازه رونوشت به آستانه، تخلیه را اجباری می‌کند. وقتی فضای کاری فقط‌خواندنی باشد، نادیده گرفته می‌شود.

### `agents.defaults.runRetries`

مرزهای تکرار تلاش مجدد حلقه اجرای بیرونی برای زمان اجرای عامل تعبیه‌شده، به‌منظور جلوگیری از حلقه‌های اجرای بی‌نهایت هنگام بازیابی از شکست. این تنظیم فقط برای زمان اجرای عامل تعبیه‌شده اعمال می‌شود، نه زمان‌های اجرای ACP یا CLI.

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
        runRetries: { max: 50 }, // بازنویسی‌های اختیاری برای هر عامل
      },
    ],
  },
}
```

- `base`: تعداد پایه تکرارهای تلاش مجدد اجرا برای حلقه اجرای بیرونی. پیش‌فرض: `24`.
- `perProfile`: تکرارهای اضافی تلاش مجدد اجرا که به‌ازای هر گزینه نمایه مسیر جایگزین اعطا می‌شوند. پیش‌فرض: `8`.
- `min`: حداقل مطلق تکرارهای تلاش مجدد اجرا. پیش‌فرض: `32`.
- `max`: حداکثر مطلق تکرارهای تلاش مجدد اجرا برای جلوگیری از اجرای مهارنشده. پیش‌فرض: `160`.

### `agents.defaults.contextPruning`

**نتایج قدیمی ابزارها** را پیش از ارسال به LLM از زمینه درون‌حافظه‌ای هرس می‌کند. تاریخچه نشست روی دیسک را تغییر **نمی‌دهد**. به‌طور پیش‌فرض غیرفعال است؛ برای فعال‌کردن، `mode: "cache-ttl"` را تنظیم کنید.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // خاموش (پیش‌فرض) | cache-ttl
        ttl: "1h", // مدت (ms/s/m/h)، واحد پیش‌فرض: دقیقه؛ پیش‌فرض: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[محتوای نتیجه قدیمی ابزار پاک شد]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="رفتار حالت cache-ttl">

- `mode: "cache-ttl"` گذرهای هرس را فعال می‌کند.
- `ttl` کنترل می‌کند هرس با چه فاصله‌ای می‌تواند دوباره اجرا شود (پس از آخرین دسترسی به حافظه نهان). پیش‌فرض: `5m`.
- هرس ابتدا نتایج بیش‌ازحد بزرگ ابزارها را به‌صورت نرم کوتاه می‌کند، سپس در صورت نیاز نتایج قدیمی‌تر ابزارها را کاملاً پاک می‌کند.
- `softTrimRatio` و `hardClearRatio` مقادیر از `0.0` تا `1.0` را می‌پذیرند؛ اعتبارسنجی پیکربندی مقادیر خارج از این بازه را رد می‌کند.

**کوتاه‌سازی نرم** ابتدا و انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**پاک‌سازی کامل** کل نتیجه ابزار را با متن جای‌نگهدار جایگزین می‌کند.

نکات:

- بلوک‌های تصویر هرگز کوتاه یا پاک نمی‌شوند.
- نسبت‌ها بر پایه نویسه هستند (تقریبی)، نه تعداد دقیق توکن‌ها.
- اگر کمتر از `keepLastAssistants` پیام دستیار وجود داشته باشد، هرس انجام نمی‌شود.

</Accordion>

برای جزئیات رفتار، به [هرس نشست](/fa/concepts/session-pruning) مراجعه کنید.

### پخش جریانی بلوکی

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (پیش‌فرض) | natural | custom (استفاده از minMs/maxMs)
    },
  },
}
```

- کانال‌های غیر Telegram برای فعال‌کردن پاسخ‌های بلوکی به `*.streaming.block.enabled: true` صریح نیاز دارند. QQ Bot استثنا است: کلیدهای `streaming.block` را ندارد و پاسخ‌های بلوکی را به‌صورت جریانی ارسال می‌کند، مگر اینکه `channels.qqbot.streaming.mode` برابر `"off"` باشد.
- بازنویسی‌های کانال: `channels.<channel>.streaming.block.coalesce` (و گونه‌های مختص هر حساب). Discord، Google Chat، Mattermost، MS Teams، Signal و Slack به‌طور پیش‌فرض از `minChars: 1500` / `idleMs: 1000` استفاده می‌کنند.
- `blockStreamingChunk.breakPreference`: مرز ترجیحی قطعه (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: مکث تصادفی میان پاسخ‌های بلوکی. پیش‌فرض: `off`. مقدار `natural` = 800-2500ms. مقدار `custom` از `minMs`/`maxMs` استفاده می‌کند (برای هر کران تنظیم‌نشده به بازه طبیعی بازمی‌گردد). بازنویسی مختص عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار و قطعه‌بندی، به [پخش جریانی](/fa/concepts/streaming) مراجعه کنید.

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
- پیش‌فرض `typingIntervalSeconds`: `6`.
- بازنویسی‌های مختص نشست: `session.typingMode`، `session.typingIntervalSeconds`.

به [نشانگرهای تایپ](/fa/concepts/typing-indicators) مراجعه کنید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

محیط ایزوله اختیاری برای عامل تعبیه‌شده. برای راهنمای کامل به [محیط ایزوله](/fa/gateway/sandboxing) مراجعه کنید.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
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
          gpus: "all",
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

پیش‌فرض‌های نمایش‌داده‌شده در بالا (تصویر `off`/`docker`/`agent`/`none`/`bookworm-slim`، شبکه `none` و غیره) پیش‌فرض‌های واقعی OpenClaw هستند، نه صرفاً مقادیر نمونه.

<Accordion title="جزئیات محیط ایزوله">

**بک‌اند:**

- `docker`: محیط اجرای محلی Docker (پیش‌فرض)
- `ssh`: محیط اجرای راه‌دور عمومی مبتنی بر SSH
- `openshell`: محیط اجرای OpenShell

هنگامی که `backend: "openshell"` انتخاب شود، تنظیمات مختص محیط اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی بک‌اند SSH:**

- `target`: مقصد SSH با قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشهٔ مطلق راه‌دور که برای فضاهای کاری هر دامنه استفاده می‌شود (پیش‌فرض: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای درون‌خطی یا SecretRefهایی که OpenClaw هنگام اجرا در فایل‌های موقت ایجاد می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: گزینه‌های سیاست کلید میزبان OpenSSH (مقدار پیش‌فرض هر دو `true` است)

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` اولویت دارد
- `certificateData` بر `certificateFile` اولویت دارد
- `knownHostsData` بر `knownHostsFile` اولویت دارد
- مقادیر `*Data` مبتنی بر SecretRef، پیش از آغاز نشست محیط ایزوله از اسنپ‌شات فعال محیط اجرای اسرار تفکیک می‌شوند

**رفتار بک‌اند SSH:**

- پس از ایجاد یا ایجاد مجدد، فضای کاری راه‌دور را یک‌بار مقداردهی اولیه می‌کند
- سپس فضای کاری SSH راه‌دور را به‌عنوان فضای کاری مرجع نگه می‌دارد
- `exec`، ابزارهای فایل و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه‌دور را به‌طور خودکار با میزبان همگام نمی‌کند
- از کانتینرهای مرورگر محیط ایزوله پشتیبانی نمی‌کند

**دسترسی به فضای کاری:**

- `none`: فضای کاری محیط ایزوله برای هر دامنه در `~/.openclaw/sandboxes` (پیش‌فرض)
- `ro`: فضای کاری محیط ایزوله در `/workspace`، با اتصال فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent`
- `rw`: اتصال فضای کاری عامل به‌صورت خواندنی/نوشتنی در `/workspace`

**دامنه:**

- `session`: کانتینر و فضای کاری جداگانه برای هر نشست
- `agent`: یک کانتینر و فضای کاری برای هر عامل (پیش‌فرض)
- `shared`: کانتینر و فضای کاری مشترک (بدون جداسازی میان نشست‌ها)

**پیکربندی Plugin ‏OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (default) | remote
          command: "openshell",
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

- `mirror`: پیش از اجرا، فضای راه‌دور را از فضای محلی مقداردهی اولیه می‌کند و پس از اجرا تغییرات را بازمی‌گرداند؛ فضای کاری محلی مرجع باقی می‌ماند
- `remote`: هنگام ایجاد محیط ایزوله، فضای راه‌دور را یک‌بار مقداردهی اولیه می‌کند و سپس فضای کاری راه‌دور را مرجع نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که خارج از OpenClaw انجام شوند، پس از مرحلهٔ مقداردهی اولیه به‌طور خودکار با محیط ایزوله همگام نمی‌شوند.
انتقال از طریق SSH به محیط ایزوله OpenShell انجام می‌شود، اما چرخهٔ حیات محیط ایزوله و همگام‌سازی اختیاری آینه بر عهدهٔ Plugin است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشهٔ قابل‌نوشتن و کاربر ریشه نیاز دارد.

**کانتینرها به‌طور پیش‌فرض از `network: "none"` استفاده می‌کنند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکهٔ پل سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` نیز به‌طور پیش‌فرض مسدود است، مگر اینکه صریحاً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` را تنظیم کنید (راهکار اضطراری).
نوبت‌های app-server ‏Codex در یک محیط ایزولهٔ فعال OpenClaw، برای دسترسی شبکهٔ بومی حالت کد خود از همین تنظیم خروجی استفاده می‌کنند.

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال آماده‌سازی می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان دیگری را متصل می‌کند؛ اتصال‌های سراسری و مختص عامل با یکدیگر ادغام می‌شوند.

**مرورگر محیط ایزوله** (`sandbox.browser.enabled`، پیش‌فرض `false`): ‏Chromium و CDP در یک کانتینر. نشانی noVNC به اعلان سیستمی تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی مشاهده‌گر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw به‌جای افشای گذرواژه در نشانی مشترک، یک نشانی توکن کوتاه‌عمر صادر می‌کند.

- `allowHostControl: false` (پیش‌فرض) مانع می‌شود نشست‌های محیط ایزوله مرورگر میزبان را هدف قرار دهند.
- مقدار پیش‌فرض `network` برابر با `openclaw-sandbox-browser` (شبکهٔ پل اختصاصی) است. تنها زمانی آن را روی `bridge` تنظیم کنید که صریحاً اتصال سراسری پل را می‌خواهید. `"host"` در اینجا نیز مسدود است.
- `cdpSourceRange` می‌تواند ورود CDP در مرز کانتینر را به یک محدودهٔ CIDR محدود کند (برای نمونه `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های میزبان بیشتری را فقط در کانتینر مرورگر محیط ایزوله متصل می‌کند. وقتی تنظیم شود (از جمله روی `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
- مرورگر Chromium کانتینر مرورگر محیط ایزوله همیشه با `--no-sandbox --disable-setuid-sandbox` راه‌اندازی می‌شود (کانتینرها سازوکارهای هسته‌ای موردنیاز محیط ایزولهٔ داخلی Chrome را ندارند)؛ هیچ گزینهٔ پیکربندی برای تغییر آن وجود ندارد.
- پیش‌فرض‌های راه‌اندازی در `scripts/sandbox-browser-entrypoint.sh` تعریف شده‌اند و برای میزبان‌های کانتینری تنظیم شده‌اند:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`، `--disable-gpu` و `--disable-software-rasterizer`
    به‌طور پیش‌فرض فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توان آن‌ها را با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - `--disable-extensions` (به‌طور پیش‌فرض فعال)؛ اگر گردش کار به افزونه‌ها وابسته است، `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    آن‌ها را دوباره فعال می‌کند.
  - به‌طور پیش‌فرض `--renderer-process-limit=2`؛ با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر دهید، یا `0` را تنظیم کنید تا از
    محدودیت پیش‌فرض فرایندهای Chromium استفاده شود.
  - فقط هنگامی که `headless` فعال باشد، `--headless=new`.
  - پیش‌فرض‌ها خط مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر، از یک تصویر مرورگر سفارشی با
    نقطهٔ ورود سفارشی استفاده کنید.

</Accordion>

محیط ایزولهٔ مرورگر و `sandbox.docker.binds` فقط با Docker کار می‌کنند.

ساخت تصاویر (از یک وارسی کد منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون وارسی کد منبع، فرمان‌های درون‌خطی `docker build` را در [محیط ایزوله § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) ببینید.

### `agents.list` (بازنویسی‌های مختص عامل)

از `agents.list[].tts` استفاده کنید تا ارائه‌دهنده، صدا، مدل،
سبک یا حالت خودکار TTS مختص هر عامل را تعیین کنید. بلوک عامل به‌صورت ادغام عمیق روی
`messages.tts` سراسری اعمال می‌شود؛ بنابراین اعتبارنامه‌های مشترک می‌توانند در یک محل باقی بمانند و هر
عامل فقط فیلدهای صدا یا ارائه‌دهندهٔ موردنیاز خود را بازنویسی کند. بازنویسی عامل فعال
برای پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status` و
ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و ترتیب اولویت،
[تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides) را ببینید.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "عامل اصلی",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // یا { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // بازنویسی سطح تفکر برای هر عامل
        reasoningDefault: "on", // بازنویسی قابلیت مشاهده استدلال برای هر عامل
        fastModeDefault: false, // بازنویسی حالت سریع برای هر عامل
        params: { cacheRetention: "none" }, // پارامترهای منطبق defaults.models را بر اساس کلید بازنویسی می‌کند
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // در صورت تنظیم، جایگزین agents.defaults.skills می‌شود
        identity: {
          name: "سامانتا",
          theme: "تنبلِ کمک‌رسان",
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
            mode: "persistent", // persistent | oneshot
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
- `default`: وقتی چند مورد تنظیم شده باشند، اولین مورد اولویت دارد (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، نخستین ورودی فهرست پیش‌فرض است.
- `model`: قالب رشته‌ای یک مدل اصلی سخت‌گیرانه و مختص عامل را بدون مدل جایگزین تنظیم می‌کند؛ قالب شیء `{ primary }` نیز سخت‌گیرانه است، مگر اینکه `fallbacks` را اضافه کنید. برای فعال‌کردن مدل جایگزین برای آن عامل از `{ primary, fallbacks: [...] }` استفاده کنید، یا برای صریح‌کردن رفتار سخت‌گیرانه از `{ primary, fallbacks: [] }` استفاده کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند، همچنان مدل‌های جایگزین پیش‌فرض را به ارث می‌برند، مگر اینکه `fallbacks: []` را تنظیم کنید.
- `utilityModel`: بازنویسی اختیاری برای هر عامل جهت کارهای داخلی کوتاه، مانند عنوان‌های تولیدشده نشست و رشته گفتگو. ابتدا به `agents.defaults.utilityModel`، سپس به مدل کوچک پیش‌فرض اعلام‌شده ارائه‌دهنده اصلی و در نهایت به مدل اصلی این عامل رجوع می‌کند. رشته خالی، مسیریابی کاربردی را برای این عامل غیرفعال می‌کند.
- `params`: پارامترهای جریان مختص هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این مورد برای بازنویسی‌های مختص عامل، مانند `cacheRetention`، `temperature` یا `maxTokens`، بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار برای هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود؛ بنابراین اعتبارنامه‌های مشترک ارائه‌دهنده و سیاست مدل جایگزین را در `messages.tts` نگه دارید و اینجا فقط مقادیر مختص شخصیت، مانند ارائه‌دهنده، صدا، مدل، سبک یا حالت خودکار را تنظیم کنید.
- `skills`: فهرست مجاز اختیاری Skills برای هر عامل. اگر حذف شود، عامل در صورت تنظیم‌بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح، به‌جای ادغام، جایگزین پیش‌فرض‌ها می‌شود و `[]` به‌معنای نبود Skills است.
- `thinkingDefault`: سطح تفکر پیش‌فرض اختیاری برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی در سطح پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. نمایه ارائه‌دهنده/مدل انتخاب‌شده تعیین می‌کند کدام مقادیر معتبرند؛ برای Google Gemini، مقدار `adaptive` تفکر پویای تحت اختیار ارائه‌دهنده را حفظ می‌کند (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود و `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: قابلیت مشاهده پیش‌فرض اختیاری استدلال برای هر عامل (`on | off | stream`). وقتی هیچ بازنویسی استدلال در سطح پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری حالت سریع برای هر عامل (`"auto" | true | false`). وقتی هیچ بازنویسی حالت سریع در سطح پیام یا نشست تنظیم نشده باشد، اعمال می‌شود.
- `models`: بازنویسی‌های اختیاری کاتالوگ مدل/زمان اجرا برای هر عامل که با شناسه‌های کامل `provider/model` کلیدگذاری می‌شوند. برای استثناهای زمان اجرای مختص عامل از `models["provider/model"].agentRuntime` استفاده کنید.
- `runtime`: توصیفگر اختیاری زمان اجرا برای هر عامل. وقتی عامل باید به‌طور پیش‌فرض از نشست‌های چارچوب ACP استفاده کند، از `type: "acp"` با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به فضای کاری، URL از نوع `http(s)` یا URI از نوع `data:`.
- فایل‌های تصویری محلی `identity.avatar` با مسیر نسبی به فضای کاری به 2 MB محدودند. URLهای `http(s)` و URIهای `data:` با محدودیت اندازه فایل محلی بررسی نمی‌شوند.
- `identity` پیش‌فرض‌ها را استخراج می‌کند: `ackReaction` از `emoji` و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل پیکربندی‌شده برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هر هدف پیکربندی‌شده؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های خودهدف‌گیر `agentId` باید مجاز باشند، شناسه درخواست‌کننده را اضافه کنید. ورودی‌های منقضی که پیکربندی عامل آن‌ها حذف شده است، توسط `sessions_spawn` رد و از `agents_list` حذف می‌شوند؛ برای پاک‌سازی آن‌ها `openclaw doctor --fix` را اجرا کنید، یا اگر آن هدف باید ضمن به‌ارث‌بردن پیش‌فرض‌ها همچنان قابل ایجاد بماند، یک ورودی حداقلی `agents.list[]` اضافه کنید.
- محافظ وراثت جعبه شنی: اگر نشست درخواست‌کننده در جعبه شنی باشد، `sessions_spawn` هدف‌هایی را که بدون جعبه شنی اجرا می‌شوند رد می‌کند.
- `subagents.requireAgentId`: وقتی مقدار آن true باشد، فراخوانی‌های `sessions_spawn` را که `agentId` را حذف کرده‌اند مسدود می‌کند (انتخاب صریح نمایه را اجباری می‌کند؛ پیش‌فرض: false).
- `subagents.maxConcurrent`: حداکثر اجرای هم‌زمان عامل‌های فرزند در سراسر اجرای زیرعامل‌ها. پیش‌فرض: `8`.
- `subagents.maxChildrenPerAgent`: حداکثر تعداد فرزندان فعالی که یک نشست عامل می‌تواند ایجاد کند. پیش‌فرض: `5`.
- `subagents.maxSpawnDepth`: حداکثر عمق تودرتویی برای ایجاد زیرعامل (`1`-`5`). پیش‌فرض: `1` (بدون تودرتویی).
- `subagents.archiveAfterMinutes`: مدت‌زمانی که پس از آن وضعیت زیرعامل تکمیل‌شده بایگانی می‌شود. پیش‌فرض: `60`.

---

## مسیریابی چندعاملی

چند عامل ایزوله را درون یک Gateway اجرا کنید. به [چندعاملی](/fa/concepts/multi-agent) مراجعه کنید.

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

- `type` (اختیاری): `route` برای مسیریابی عادی (نوع حذف‌شده به‌طور پیش‌فرض route است) و `acp` برای اتصال‌های پایدار گفتگوی ACP.
- `match.channel` (الزامی)
- `match.accountId` (اختیاری؛ `*` = هر حساب؛ حذف‌شده = حساب پیش‌فرض)
- `match.peer` (اختیاری؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختیاری؛ مختص کانال)
- `acp` (اختیاری؛ فقط برای `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتیب تطبیق قطعی:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (دقیق، بدون همتا/انجمن/تیم)
5. `match.accountId: "*"` (در سراسر کانال)
6. عامل پیش‌فرض

در هر سطح، نخستین ورودی منطبق `bindings` اولویت دارد.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفتگو (`match.channel` + حساب + `match.peer.id`) تفکیک می‌کند و از ترتیب سطوح اتصال مسیریابی بالا استفاده نمی‌کند.

### نمایه‌های دسترسی مختص عامل

<Accordion title="دسترسی کامل (بدون جعبه شنی)">

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

<Accordion title="بدون دسترسی به سیستم فایل (فقط پیام‌رسانی)">

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

برای جزئیات تقدم، به [جعبه شنی و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) مراجعه کنید.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (پیش‌فرض) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // مدت‌زمان یا false
      maxDiskBytes: "500mb", // سقف سخت اختیاری
      highWaterBytes: "400mb", // هدف اختیاری پاک‌سازی
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // لغو تمرکز خودکار پیش‌فرض پس از عدم فعالیت، بر حسب ساعت (`0` غیرفعال می‌کند)
      maxAgeHours: 0, // حداکثر سن سخت پیش‌فرض، بر حسب ساعت (`0` غیرفعال می‌کند)
    },
    mainKey: "main", // قدیمی (زمان اجرا همیشه از "main" استفاده می‌کند)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="جزئیات فیلدهای نشست">

- **`scope`**: راهبرد پایهٔ گروه‌بندی نشست برای زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده در زمینهٔ یک کانال، نشست مجزایی دریافت می‌کند.
  - `global`: همهٔ شرکت‌کنندگان در زمینهٔ یک کانال، یک نشست واحد را به‌اشتراک می‌گذارند (فقط زمانی استفاده شود که زمینهٔ مشترک مدنظر است).
- **`dmScope`**: نحوهٔ گروه‌بندی پیام‌های مستقیم.
  - `main`: همهٔ پیام‌های مستقیم نشست اصلی را به‌اشتراک می‌گذارند.
  - `per-peer`: جداسازی بر اساس شناسهٔ فرستنده در میان کانال‌ها.
  - `per-channel-peer`: جداسازی بر اساس کانال + فرستنده (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: جداسازی بر اساس حساب + کانال + فرستنده (برای حالت چندحسابی توصیه می‌شود).
- **`identityLinks`**: نگاشت شناسه‌های متعارف به همتایان دارای پیشوند ارائه‌دهنده برای اشتراک‌گذاری نشست میان کانال‌ها. فرمان‌های اتصال کانال مانند `/dock_discord` از همین نگاشت استفاده می‌کنند تا مسیر پاسخ نشست فعال را به همتای کانالی پیوندخوردهٔ دیگری تغییر دهند؛ [اتصال کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در ساعت محلی `atHour` بازنشانی می‌شود؛ `idle` پس از `idleMinutes` بازنشانی می‌شود. اگر هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اولویت دارد. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بر اساس بی‌کاری از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارسازی‌های Cron، اعلان‌های exec و ثبت‌های مدیریتی Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بی‌کاری را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های مخصوص هر نوع (`direct`، `group`، `thread`). `dm` قدیمی به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`resetByChannel`**: بازنویسی‌های بازنشانی مخصوص هر کانال که با شناسهٔ ارائه‌دهنده/کانال کلیدگذاری می‌شوند. وقتی کانال نشست ورودی منطبق داشته باشد، برای آن نشست بدون قیدوشرط بر `resetByType`/`reset` اولویت دارد. فقط زمانی استفاده شود که یک کانال به رفتار بازنشانی متفاوتی نسبت به سیاست سطح نوع نیاز دارد.
- **`mainKey`**: فیلد قدیمی. محیط اجرا همیشه برای سطل اصلی گفت‌وگوی مستقیم از `"main"` استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: حداکثر نوبت‌های پاسخ متقابل میان عامل‌ها در تبادل‌های عامل‌به‌عامل (عدد صحیح، بازه: `0`-`20`، پیش‌فرض: `5`). `0` زنجیره‌سازی رفت‌وبرگشتی را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، همراه با نام مستعار قدیمی `dm`)، `keyPrefix` یا `rawKeyPrefix`. نخستین منع اولویت دارد.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگه‌داری مخزن نشست.
  - `mode`: `enforce` پاک‌سازی را اعمال می‌کند و پیش‌فرض است؛ `warn` فقط هشدار صادر می‌کند.
  - `pruneAfter`: آستانهٔ سنی برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: حداکثر تعداد ورودی‌های نشست SQLite (پیش‌فرض `500`). نوشتن‌های محیط اجرا، برای سقف‌های متناسب با مقیاس تولید، پاک‌سازی را به‌صورت دسته‌ای و با یک حاشیهٔ کوچک حد بالای آب انجام می‌دهند؛ `openclaw sessions cleanup --enforce` سقف را بلافاصله اعمال می‌کند.
  - نشست‌های کوتاه‌عمر وارسی اجرای مدل Gateway از دورهٔ نگه‌داری ثابت `24h` استفاده می‌کنند، اما پاک‌سازی وابسته به فشار است: فقط هنگامی ردیف‌های کهنهٔ وارسی صریح اجرای مدل را حذف می‌کند که فشار نگه‌داری/سقف ورودی‌های نشست ایجاد شده باشد. فقط کلیدهای صریح و سخت‌گیرانهٔ وارسی که با `agent:*:explicit:model-run-<uuid>` مطابقت دارند واجد شرایط‌اند؛ نشست‌های عادی مستقیم، گروهی، رشته‌ای، Cron، قلاب، Heartbeat، ACP و عامل فرعی این نگه‌داری 24h را به ارث نمی‌برند. وقتی پاک‌سازی اجرای مدل انجام می‌شود، پیش از پاک‌سازی گسترده‌تر ورودی‌های کهنهٔ `pruneAfter` و سقف `maxEntries` اجرا می‌شود.
  - `rotateBytes` قدیمی توسط طرح‌وارهٔ فعلی رد می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگه‌داری مبتنی بر سن برای بایگانی رونوشت‌های بازنشانی‌شده/حذف‌شده. به‌طور پیش‌فرض، بایگانی‌ها تا زمان بیرون‌رانی بر اساس بودجهٔ دیسک باقی می‌مانند؛ برای فعال‌سازی حذف بر اساس زمان سپری‌شده یک مدت تنظیم کنید، یا برای غیرفعال‌سازی صریح آن `false` را تنظیم کنید.
  - `maxDiskBytes`: بودجهٔ اختیاری دیسک برای پوشهٔ نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین مصنوعات/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. مقدار پیش‌فرض `80%` از `maxDiskBytes` است.
- **`writeLock`**: کنترل‌های قفل نوشتن رونوشت نشست. فقط زمانی تنظیم شوند که آماده‌سازی معتبر رونوشت، پاک‌سازی، Compaction یا عملیات همگام‌سازی، بیش از سیاست‌های پیش‌فرض با هم رقابت کنند.
  - `acquireTimeoutMs`: مدت انتظار بر حسب میلی‌ثانیه هنگام گرفتن قفل، پیش از گزارش نشست به‌عنوان مشغول. پیش‌فرض: `60000`؛ بازنویسی محیطی `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: مدت بر حسب میلی‌ثانیه پیش از آن‌که قفل موجود کهنه تلقی و بازپس‌گیری شود. پیش‌فرض: `1800000`؛ بازنویسی محیطی `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: مدت بر حسب میلی‌ثانیه که یک قفل نگه‌داشته‌شده درون فرایند می‌تواند همچنان نگه‌داشته شود، پیش از آن‌که نگهبان آن را آزاد کند. پیش‌فرض: `300000`؛ بازنویسی محیطی `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های نشست مقید به رشته.
  - `enabled`: کلید اصلی پیش‌فرض (ارائه‌دهندگان می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: خروج خودکار پیش‌فرض از تمرکز پس از بی‌فعالیتی، بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `maxAgeHours`: حداکثر سن قطعی پیش‌فرض بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازهٔ پیش‌فرض برای ایجاد نشست‌های کاری مقید به رشته از `sessions_spawn` و ایجاد رشته‌های ACP. وقتی اتصال‌های رشته فعال باشند، پیش‌فرض `true` است؛ ارائه‌دهندگان/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینهٔ بومی پیش‌فرض عامل فرعی برای ایجادهای مقید به رشته (`"fork"` یا `"isolated"`). پیش‌فرض `"fork"` است.

</Accordion>

---

## پیام‌ها

```json5
{
  messages: {
    responsePrefix: "🦞", // یا "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (پیش‌فرض) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (پیش‌فرض)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 غیرفعال می‌کند
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

ترتیب تعیین مقدار (مشخص‌ترین مورد اولویت دارد): حساب ← کانال ← سراسری. `""` غیرفعال می‌کند و زنجیره را متوقف می‌سازد. `"auto"`، `[{identity.name}]` را استخراج می‌کند.

**متغیرهای الگو:**

| متغیر          | توضیحات            | نمونه                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل       | `claude-opus-4-6`           |
| `{modelFull}`     | شناسهٔ کامل مدل  | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده          | `anthropic`                 |
| `{thinkingLevel}` | سطح فعلی تفکر | `high`، `low`، `off`        |
| `{identity.name}` | نام هویت عامل    | (همان `"auto"`)          |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- مقدار پیش‌فرض، `identity.emoji` عامل فعال و در غیر این صورت `"👀"` است. برای غیرفعال‌سازی، `""` را تنظیم کنید.
- بازنویسی‌های مخصوص هر کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب تعیین مقدار: حساب ← کانال ← `messages.ackReaction` ← مقدار جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`، یا `off`/`none` (واکنش‌های تأیید را کاملاً غیرفعال می‌کند).
- `removeAckAfterReply`: واکنش تأیید را پس از پاسخ در کانال‌های پشتیبان واکنش مانند Slack، Discord، Signal، Telegram، WhatsApp و iMessage حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخهٔ عمر را در Slack، Discord، Signal، Telegram و WhatsApp فعال می‌کند.
  در Discord، تنظیم‌نشدن این گزینه باعث می‌شود وقتی واکنش‌های تأیید فعال‌اند، واکنش‌های وضعیت نیز فعال بمانند.
  در Slack، Signal، Telegram و WhatsApp، برای فعال‌سازی واکنش‌های وضعیت چرخهٔ عمر، آن را صراحتاً روی `true` تنظیم کنید.
  Slack به‌طور پیش‌فرض برای نمایش پیشرفت از وضعیت بومی رشتهٔ دستیار و پیام‌های بارگذاری چرخشی استفاده می‌کند، درحالی‌که واکنش تأیید پیکربندی‌شده را ثابت نگه می‌دارد.
- `messages.statusReactions.emojis`: کلیدهای ایموجی چرخهٔ عمر را بازنویسی می‌کند:
  `queued`، `thinking`، `compacting`، `tool`، `coding`، `web`، `deploy`، `build`،
  `concierge`، `done`، `error`، `stallSoft` و `stallHard`.
  Telegram فقط مجموعهٔ ثابتی از واکنش‌ها را مجاز می‌داند، بنابراین ایموجی‌های پیکربندی‌شدهٔ پشتیبانی‌نشده
  برای آن گفت‌وگو به نزدیک‌ترین گونهٔ وضعیت پشتیبانی‌شده برمی‌گردند.

### صف

- `mode`: راهبرد صف برای پیام‌های ورودی که هنگام فعال‌بودن اجرای نشست می‌رسند. پیش‌فرض: `"steer"`.
  - `steer`: درخواست جدید را به اجرای فعال تزریق می‌کند.
  - `followup`: درخواست جدید را پس از پایان اجرای فعال اجرا می‌کند.
  - `collect`: پیام‌های سازگار را دسته‌بندی می‌کند و بعداً با هم اجرا می‌کند.
  - `interrupt`: پیش از شروع جدیدترین درخواست، اجرای فعال را لغو می‌کند.
- `debounceMs`: تأخیر پیش از ارسال پیام صف‌شده/هدایت‌شده. پیش‌فرض: `500`.
- `cap`: حداکثر پیام‌های صف‌شده پیش از اعمال سیاست حذف. پیش‌فرض: `20`.
- `drop`: راهبرد هنگام عبور از سقف. `"summarize"` (پیش‌فرض) قدیمی‌ترین ورودی‌ها را حذف می‌کند، اما خلاصه‌های فشرده را نگه می‌دارد؛ `"old"` قدیمی‌ترین‌ها را بدون خلاصه حذف می‌کند؛ `"new"` جدیدترین مورد را رد می‌کند.
- `byChannel`: بازنویسی‌های مخصوص هر کانال برای `mode` که با شناسهٔ ارائه‌دهنده کلیدگذاری می‌شوند.
- `debounceMsByChannel`: بازنویسی‌های مخصوص هر کانال برای `debounceMs` که با شناسهٔ ارائه‌دهنده کلیدگذاری می‌شوند.

### رفع جهش ورودی

پیام‌های سریع و صرفاً متنی از یک فرستنده را در یک نوبت عامل دسته‌بندی می‌کند. رسانه‌ها/پیوست‌ها باعث تخلیهٔ فوری می‌شوند. فرمان‌های کنترلی از رفع جهش عبور می‌کنند. مقدار پیش‌فرض `debounceMs`: `2000`.

### سایر کلیدهای پیام

- `messages.messagePrefix`: متن پیشوندی که پیش از رسیدن پیام‌های ورودی کاربر به محیط اجرای عامل، به ابتدای آن‌ها افزوده می‌شود. برای نشانگرهای زمینهٔ کانال با احتیاط استفاده شود.
- `messages.visibleReplies`: پاسخ‌های منبع قابل‌مشاهده را در مکالمه‌های مستقیم، گروهی و کانالی کنترل می‌کند (`"message_tool"` برای خروجی قابل‌مشاهده به `message(action=send)` نیاز دارد؛ `"automatic"` پاسخ‌های عادی را مانند قبل ارسال می‌کند).
- `messages.usageTemplate` / `messages.responseUsage`: الگوی سفارشی پانویس `/usage` و حالت پیش‌فرض استفاده در هر پاسخ (`off | tokens | full`، به‌علاوهٔ نام مستعار قدیمی `on` برای `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: محرک‌های اشاره در پیام گروهی و اندازهٔ پنجرهٔ تاریخچه.
- `messages.suppressToolErrors`: وقتی `true` باشد، هشدارهای خطای ابزار `⚠️` را که به کاربر نمایش داده می‌شوند سرکوب می‌کند (عامل همچنان خطاها را در زمینه می‌بیند و می‌تواند دوباره تلاش کند). پیش‌فرض: `false`.

### TTS (تبدیل متن به گفتار)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (پیش‌فرض) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` حالت پیش‌فرض تبدیل خودکار متن به گفتار را کنترل می‌کند: `off`، `always`، `inbound` یا `tagged`. ‏`/tts on|off` می‌تواند ترجیحات محلی را نادیده بگیرد و `/tts status` وضعیت مؤثر را نمایش می‌دهد.
- `summaryModel` برای خلاصه‌سازی خودکار، `agents.defaults.model.primary` را نادیده می‌گیرد.
- `modelOverrides` به‌طور پیش‌فرض فعال است (`enabled !== false`)؛ `modelOverrides.allowProvider` نیازمند فعال‌سازی صریح است.
- کلیدهای API در صورت نبود مقدار به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` بازمی‌گردند.
- ارائه‌دهندگان گفتار همراه برنامه متعلق به Pluginها هستند. اگر `plugins.allow` تنظیم شده است، هر Plugin ارائه‌دهنده TTS موردنظر را اضافه کنید؛ برای نمونه، `microsoft` برای Edge TTS. شناسه قدیمی ارائه‌دهنده، یعنی `edge`، به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطه پایانی TTS متعلق به OpenAI را نادیده می‌گیرد. ترتیب تفکیک، ابتدا پیکربندی، سپس `OPENAI_TTS_BASE_URL` و پس از آن `https://api.openai.com/v1` است.
- وقتی `providers.openai.baseUrl` به نقطه پایانی غیر OpenAI اشاره می‌کند، OpenClaw آن را سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌گیرانه‌تر می‌کند.

---

## مکالمه

پیش‌فرض‌های حالت مکالمه (macOS/iOS/Android و رابط کنترل مرورگر).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "با لحنی گرم صحبت کنید و پاسخ‌ها را کوتاه نگه دارید.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- وقتی چند ارائه‌دهنده مکالمه پیکربندی شده‌اند، `talk.provider` باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای مسطح قدیمی مکالمه (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند. برای بازنویسی پیکربندی ذخیره‌شده در `talk.providers.<provider>`، دستور `openclaw doctor --fix` را اجرا کنید.
- شناسه‌های صدا در صورت نبود مقدار به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` بازمی‌گردند (رفتار کارخواه مکالمه macOS).
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- بازگشت به `ELEVENLABS_API_KEY` فقط هنگامی اعمال می‌شود که هیچ کلید API مکالمه‌ای پیکربندی نشده باشد.
- `providers.*.voiceAliases` به دستورهای مکالمه اجازه می‌دهد از نام‌های ساده و قابل‌فهم استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face مورداستفاده دستیار محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS، در صورت وجود، از طریق دستیار همراه `openclaw-mlx-tts` اجرا می‌شود؛ در غیر این صورت، یک فایل اجرایی در `PATH` به کار می‌رود. `OPENCLAW_MLX_TTS_BIN` مسیر دستیار را برای توسعه نادیده می‌گیرد.
- `consultThinkingLevel` سطح تفکر را برای اجرای کامل عامل OpenClaw در پشت فراخوانی‌های بلادرنگ `openclaw_agent_consult` مکالمه رابط کنترل تعیین می‌کند. برای حفظ رفتار عادی نشست/مدل، آن را تنظیم‌نشده باقی بگذارید.
- `consultFastMode` یک بازنویسی یک‌باره حالت سریع را برای مشورت‌های بلادرنگ مکالمه رابط کنترل تنظیم می‌کند، بدون آنکه تنظیم عادی حالت سریع نشست را تغییر دهد.
- `speechLocale` شناسه منطقه‌ای BCP 47 مورداستفاده تشخیص گفتار مکالمه در iOS/macOS را تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده باقی بگذارید.
- `silenceTimeoutMs` مدت انتظار حالت مکالمه پس از سکوت کاربر و پیش از ارسال رونوشت را کنترل می‌کند. تنظیم‌نکردن آن، پنجره مکث پیش‌فرض پلتفرم (`700 ms on macOS and Android, 900 ms on iOS`) را حفظ می‌کند.
- `realtime.instructions` دستورالعمل‌های سیستمی روبه‌ارائه‌دهنده را به اعلان بلادرنگ داخلی OpenClaw می‌افزاید تا بتوان سبک صدا را بدون از دست‌دادن راهنمایی پیش‌فرض `openclaw_agent_consult` پیکربندی کرد.
- `realtime.vadThreshold` آستانه فعالیت صوتی ارائه‌دهنده را از `0` (حساس‌ترین) تا `1` (کم‌حساس‌ترین) تنظیم می‌کند. تنظیم‌نکردن آن، پیش‌فرض ارائه‌دهنده را حفظ می‌کند.
- `realtime.silenceDurationMs` پنجره سکوت با عدد صحیح مثبت را پیش از ثبت نوبت بلادرنگ کاربر توسط ارائه‌دهنده تنظیم می‌کند. تنظیم‌نکردن آن، پیش‌فرض ارائه‌دهنده را حفظ می‌کند.
- `realtime.prefixPaddingMs` مقدار صوت نگه‌داری‌شده پیش از آغاز گفتار شناسایی‌شده را به‌صورت عدد صحیح نامنفی تنظیم می‌کند. تنظیم‌نکردن آن، پیش‌فرض ارائه‌دهنده را حفظ می‌کند.
- `realtime.reasoningEffort` سطح استدلال ویژه ارائه‌دهنده را برای نشست‌های بلادرنگ تنظیم می‌کند. تنظیم‌نکردن آن، پیش‌فرض ارائه‌دهنده را حفظ می‌کند.
- `realtime.consultRouting`: ‏`"provider-direct"` (پیش‌فرض) هنگامی‌که ارائه‌دهنده بلادرنگ، رونوشت نهایی کاربر را بدون `openclaw_agent_consult` تولید می‌کند، پاسخ‌های مستقیم ارائه‌دهنده را حفظ می‌کند. در مقابل، `"force-agent-consult"` درخواست نهایی‌شده را از طریق OpenClaw مسیریابی می‌کند.

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همه کلیدهای دیگر پیکربندی
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
