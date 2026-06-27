---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعاملی
    - تنظیم رفتار جلسه، تحویل پیام، و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-06-27T17:40:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی با دامنهٔ عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
`messages.*`، و `talk.*`. برای کانال‌ها، ابزارها، runtime مربوط به Gateway، و دیگر
کلیدهای سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## پیش‌فرض‌های عامل

### `agents.defaults.workspace`

پیش‌فرض: وقتی `OPENCLAW_WORKSPACE_DIR` تنظیم شده باشد، همان مقدار؛ در غیر این صورت `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

یک مقدار صریح برای `agents.defaults.workspace` بر
`OPENCLAW_WORKSPACE_DIR` اولویت دارد. وقتی نمی‌خواهید آن مسیر را در پیکربندی بنویسید،
از متغیر محیطی برای اشارهٔ عامل‌های پیش‌فرض به یک workspace متصل‌شده استفاده کنید.

### `agents.defaults.repoRoot`

ریشهٔ اختیاری مخزن که در خط Runtime در system prompt نشان داده می‌شود. اگر تنظیم نشده باشد، OpenClaw با پیمایش رو به بالا از workspace آن را خودکار تشخیص می‌دهد.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

فهرست مجاز اختیاری و پیش‌فرض Skills برای عامل‌هایی که
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
- یک فهرست غیرخالی `agents.list[].skills` مجموعهٔ نهایی برای آن عامل است؛
  با پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های bootstrap مربوط به workspace را غیرفعال می‌کند (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شدهٔ workspace را رد می‌کند، در حالی که همچنان فایل‌های bootstrap الزامی نوشته می‌شوند. مقادیر معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md`، و `IDENTITY.md`.

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

کنترل می‌کند فایل‌های bootstrap مربوط به workspace چه زمانی در system prompt تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامهٔ امن (پس از یک پاسخ کامل‌شدهٔ assistant) تزریق دوبارهٔ bootstrap مربوط به workspace را رد می‌کنند و اندازهٔ prompt را کاهش می‌دهند. اجرای Heartbeat و تلاش‌های مجدد پس از Compaction همچنان context را دوباره می‌سازند.
- `"never"`: تزریق bootstrap مربوط به workspace و فایل context را در هر نوبت غیرفعال می‌کند. این را فقط برای عامل‌هایی استفاده کنید که مالک کامل چرخهٔ عمر prompt خود هستند (موتورهای context سفارشی، runtimeهای بومی که context خود را می‌سازند، یا workflowهای تخصصی بدون bootstrap). نوبت‌های Heartbeat و بازیابی پس از Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

بازنویسی برای هر عامل: `agents.list[].contextInjection`. مقادیر حذف‌شده از
`agents.defaults.contextInjection` ارث‌بری می‌کنند.

### `agents.defaults.bootstrapMaxChars`

حداکثر نویسه برای هر فایل bootstrap مربوط به workspace پیش از کوتاه‌سازی. پیش‌فرض: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

بازنویسی برای هر عامل: `agents.list[].bootstrapMaxChars`. مقادیر حذف‌شده از
`agents.defaults.bootstrapMaxChars` ارث‌بری می‌کنند.

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده در همهٔ فایل‌های bootstrap مربوط به workspace. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

بازنویسی برای هر عامل: `agents.list[].bootstrapTotalMaxChars`. مقادیر حذف‌شده
از `agents.defaults.bootstrapTotalMaxChars` ارث‌بری می‌کنند.

### بازنویسی‌های پروفایل bootstrap برای هر عامل

وقتی یک عامل به رفتار تزریق prompt متفاوتی نسبت به پیش‌فرض‌های مشترک نیاز دارد،
از بازنویسی‌های پروفایل bootstrap برای هر عامل استفاده کنید. فیلدهای حذف‌شده از
`agents.defaults` ارث‌بری می‌کنند.

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

اعلان قابل‌مشاهده برای عامل در system prompt را هنگام کوتاه شدن context مربوط به bootstrap کنترل می‌کند.
پیش‌فرض: `"always"`.

- `"off"`: هرگز متن اعلان کوتاه‌سازی را در system prompt تزریق نکن.
- `"once"`: برای هر امضای کوتاه‌سازی یکتا، یک اعلان خلاصه را یک‌بار تزریق کن.
- `"always"`: وقتی کوتاه‌سازی وجود دارد، در هر اجرا یک اعلان خلاصه تزریق کن (توصیه‌شده).

شمارش‌های خام/تزریق‌شدهٔ دقیق و فیلدهای تنظیم پیکربندی در diagnostics مانند
گزارش‌های context/status و logها باقی می‌مانند؛ context معمول کاربر/runtime در WebChat فقط
اعلان خلاصهٔ بازیابی را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### نقشهٔ مالکیت بودجهٔ context

OpenClaw چندین بودجهٔ prompt/context با حجم بالا دارد، و آن‌ها عمداً
بر اساس زیرسامانه جدا شده‌اند، نه این‌که همگی از یک knob عمومی عبور کنند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق عادی bootstrap مربوط به workspace.
- `agents.defaults.startupContext.*`:
  prelude یک‌بارهٔ model-run برای reset/startup، شامل فایل‌های روزانهٔ اخیر
  `memory/*.md`. فرمان‌های چت خام `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشردهٔ Skills که در system prompt تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  excerptهای محدود runtime و بلوک‌های تزریق‌شده با مالکیت runtime.
- `memory.qmd.limits.*`:
  sizing مربوط به snippet جست‌وجوی حافظهٔ نمایه‌شده و تزریق.

فقط وقتی یک عامل به بودجهٔ متفاوتی نیاز دارد، از بازنویسی متناظر برای هر عامل
استفاده کنید:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

prelude راه‌اندازی نوبت اول را که در model runهای reset/startup تزریق می‌شود کنترل می‌کند.
فرمان‌های چت خام `/new` و `/reset` بدون فراخوانی مدل reset را تأیید می‌کنند،
بنابراین این prelude را بارگذاری نمی‌کنند.

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

پیش‌فرض‌های مشترک برای سطح‌های context محدود runtime.

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

- `memoryGetMaxChars`: سقف پیش‌فرض excerpt برای `memory_get` پیش از اضافه شدن
  metadata کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجرهٔ خطی پیش‌فرض `memory_get` وقتی `lines` حذف شده است.
- `toolResultMaxChars`: سقف پیشرفتهٔ live tool-result که برای نتایج ماندگارشده
  و بازیابی overflow استفاده می‌شود. برای سقف خودکار model-context آن را تنظیم‌نشده بگذارید:
  `16000` نویسه زیر 100K توکن، `32000` نویسه در 100K+ توکن، و `64000`
  نویسه در 200K+ توکن. مقادیر صریح تا `1000000` برای
  مدل‌های long-context پذیرفته می‌شوند، اما سقف مؤثر همچنان به حدود 30٪ از
  پنجرهٔ context مدل محدود است. `openclaw doctor --deep` سقف مؤثر را چاپ می‌کند،
  و doctor فقط وقتی هشدار می‌دهد که یک بازنویسی صریح قدیمی باشد یا اثری نداشته باشد.
- `postCompactionMaxChars`: سقف excerpt مربوط به AGENTS.md که هنگام تزریق تازه‌سازی
  پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

بازنویسی برای هر عامل برای knobهای مشترک `contextLimits`. فیلدهای حذف‌شده از
`agents.defaults.contextLimits` ارث‌بری می‌کنند.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

سقف سراسری برای فهرست فشردهٔ Skills که در system prompt تزریق می‌شود. این
بر خواندن فایل‌های `SKILL.md` در زمان نیاز اثر نمی‌گذارد.

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

بازنویسی برای هر عامل برای بودجهٔ prompt مربوط به Skills.

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

مقادیر پایین‌تر معمولاً مصرف vision-token و اندازهٔ payload درخواست را برای اجراهای پر از screenshot کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ترجیح compression/detail ابزار تصویر برای تصویرهایی که از مسیرهای فایل، URLها، و ارجاع‌های رسانه‌ای بارگذاری می‌شوند.
پیش‌فرض: `auto`.

OpenClaw نردبان resize را با مدل تصویر انتخاب‌شده سازگار می‌کند. برای نمونه، مدل‌های Claude Opus 4.8، OpenAI GPT-5.5، Qwen VL، و hosted Llama 4 vision می‌توانند از تصویرهای بزرگ‌تری نسبت به مسیرهای vision قدیمی‌تر/پیش‌فرض با جزئیات بالا استفاده کنند، در حالی که نوبت‌های چندتصویری در حالت `auto` برای کنترل هزینهٔ توکن و تأخیر، فشرده‌تر می‌شوند.

مقادیر:

- `auto`: با محدودیت‌های مدل و تعداد تصویر سازگار شو.
- `efficient`: تصویرهای کوچک‌تر را برای مصرف کمتر توکن و بایت ترجیح بده.
- `balanced`: از نردبان استاندارد میانه استفاده کن.
- `high`: برای screenshotها، diagramها، و تصویرهای سند جزئیات بیشتری را حفظ کن.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

منطقهٔ زمانی برای context در system prompt (نه timestampهای پیام). به منطقهٔ زمانی host بازمی‌گردد.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

قالب زمان در system prompt. پیش‌فرض: `auto` (ترجیح OS).

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
  - شکل شیء، مدل اصلی را به‌همراه مدل‌های failover مرتب‌شده تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - مسیر ابزار `image` از آن به‌عنوان پیکربندی مدل بینایی استفاده می‌کند.
  - همچنین زمانی که مدل انتخاب‌شده/پیش‌فرض نتواند ورودی تصویر را بپذیرد، برای مسیریابی جایگزین استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های تنها برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه تنها به‌صورت یکتا با یک ورودی پیکربندی‌شده و دارای قابلیت تصویر در `models.providers.*.models` منطبق شود، OpenClaw آن را به همان provider منسوب می‌کند. تطبیق‌های پیکربندی‌شده مبهم به پیشوند صریح provider نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده که تصویر تولید کند از آن استفاده می‌کند.
  - مقدارهای رایج: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini،‏ `fal/fal-ai/flux/dev` برای fal،‏ `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینه شفاف در OpenAI.
  - اگر مستقیما یک provider/model را انتخاب می‌کنید، احراز هویت provider متناظر را هم پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`،‏ `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`،‏ `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر احراز هویت را استنتاج کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس باقی providerهای ثبت‌شده تولید تصویر را به ترتیب شناسه provider امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` از آن استفاده می‌کنند.
  - مقدارهای رایج: `google/lyria-3-clip-preview`،‏ `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر احراز هویت را استنتاج کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس باقی providerهای ثبت‌شده تولید موسیقی را به ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیما یک provider/model را انتخاب می‌کنید، احراز هویت provider/API key متناظر را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - قابلیت مشترک تولید ویدئو و ابزار داخلی `video_generate` از آن استفاده می‌کنند.
  - مقدارهای رایج: `qwen/wan2.6-t2v`،‏ `qwen/wan2.6-i2v`،‏ `qwen/wan2.6-r2v`،‏ `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض provider مبتنی بر احراز هویت را استنتاج کند. ابتدا provider پیش‌فرض فعلی را امتحان می‌کند، سپس باقی providerهای ثبت‌شده تولید ویدئو را به ترتیب شناسه provider امتحان می‌کند.
  - اگر مستقیما یک provider/model را انتخاب می‌کنید، احراز هویت provider/API key متناظر را هم پیکربندی کنید.
  - Plugin رسمی تولید ویدئوی Qwen تا 1 ویدئوی خروجی، 1 تصویر ورودی، 4 ویدئوی ورودی، مدت 10 ثانیه، و گزینه‌های سطح provider شامل `size`،‏ `aspectRatio`،‏ `resolution`،‏ `audio` و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - ابزار `pdf` از آن برای مسیریابی مدل استفاده می‌کند.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض برمی‌گردد.
- `pdfMaxBytesMb`: محدودیت اندازه PDF پیش‌فرض برای ابزار `pdf` وقتی `maxBytesMb` در زمان فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: حداکثر تعداد صفحه پیش‌فرض که حالت جایگزین استخراج در ابزار `pdf` در نظر می‌گیرد.
- `verboseDefault`: سطح پرگویی پیش‌فرض برای عامل‌ها. مقدارها: `"off"`،‏ `"on"`،‏ `"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خطوط ابزار پیش‌نویس پیشرفت. مقدارها: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (افزودن فرمان/جزئیات خام در صورت وجود). مقدار `agents.list[].toolProgressDetail` مخصوص هر عامل، این پیش‌فرض را بازنویسی می‌کند.
- `reasoningDefault`: نمایش reasoning پیش‌فرض برای عامل‌ها. مقدارها: `"off"`،‏ `"on"`،‏ `"stream"`. مقدار `agents.list[].reasoningDefault` مخصوص هر عامل، این پیش‌فرض را بازنویسی می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای مالکان، فرستنده‌های مجاز، یا زمینه‌های operator-admin Gateway اعمال می‌شوند، آن هم وقتی هیچ بازنویسی reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح پیش‌فرض خروجی elevated برای عامل‌ها. مقدارها: `"off"`،‏ `"on"`،‏ `"ask"`،‏ `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلا `openai/gpt-5.5` برای دسترسی با OpenAI API-key یا Codex OAuth). اگر provider را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطبیق یکتای provider پیکربندی‌شده برای همان شناسه مدل دقیق، و فقط بعد از آن به provider پیش‌فرض پیکربندی‌شده برمی‌گردد (رفتار سازگاری منسوخ‌شده، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن provider دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض provider حذف‌شده و قدیمی، به اولین provider/model پیکربندی‌شده برمی‌گردد.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (مختص provider، برای مثال `temperature`،‏ `maxTokens`،‏ `cacheRetention`،‏ `context1m`،‏ `responsesServerCompaction`،‏ `responsesCompactThreshold`، مسیریابی `provider` در OpenRouter،‏ `chat_template_kwargs`،‏ `extra_body`/`extraBody`) باشد.
  - برای نمایش همه مدل‌های کشف‌شده برای providerهای انتخاب‌شده بدون فهرست‌کردن دستی تک‌تک شناسه‌های مدل، از ورودی‌های `provider/*` مانند `"openai/*": {}` یا `"vllm/*": {}` استفاده کنید.
  - وقتی همه مدل‌های کشف‌شده پویا برای آن provider باید از همان runtime استفاده کنند، `agentRuntime` را به یک ورودی `provider/*` اضافه کنید. سیاست runtime دقیق `provider/model` همچنان بر wildcard اولویت دارد.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های allowlist موجود را حذف کنند، رد می‌کند مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های پیکربندی/راه‌اندازی اولیه در محدوده provider، مدل‌های provider انتخاب‌شده را در این map ادغام می‌کنند و providerهای نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses،‏ Compaction سمت سرور به‌صورت خودکار فعال می‌شود. برای متوقف‌کردن تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای بازنویسی آستانه از `params.responsesCompactThreshold` استفاده کنید. به [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) مراجعه کنید.
- `params`: پارامترهای provider پیش‌فرض سراسری که به همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلا `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (مختص مدل) بازنویسی می‌شود، سپس `agents.list[].params` (شناسه عامل مطابق) بر اساس کلید بازنویسی می‌کند. برای جزئیات به [Prompt Caching](/fa/reference/prompt-caching) مراجعه کنید.
- `models.providers.openrouter.params.provider`: سیاست پیش‌فرض مسیریابی provider در سطح OpenRouter. OpenClaw این را به شیء `provider` درخواست OpenRouter ارسال می‌کند؛ `agents.defaults.models["openrouter/<model>"].params.provider` مختص هر مدل و پارامترهای عامل بر اساس کلید بازنویسی می‌کنند. به [مسیریابی provider در OpenRouter](/fa/providers/openrouter#advanced-configuration) مراجعه کنید.
- `params.extra_body`/`params.extraBody`: JSON عبوری پیشرفته که در بدنه‌های درخواست `api: "openai-completions"` برای پراکسی‌های سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده تداخل داشته باشد، بدنه اضافی برنده می‌شود؛ مسیرهای completions غیربومی همچنان بعدا `store` مختص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin همراه vLLM به‌صورت خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح پیش‌فرض‌های تولیدشده را بازنویسی می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. مدل‌های thinking پیکربندی‌شده vLLM Qwen و Nemotron به‌جای نردبان effort چندسطحی، گزینه‌های دودویی `/think` (`off`،‏ `on`) را ارائه می‌کنند.
- `compat.thinkingFormat`: سبک payload مربوط به thinking سازگار با OpenAI. از `"together"` برای `reasoning.enabled` به سبک Together، از `"qwen"` برای `enable_thinking` سطح بالای سبک Qwen، یا از `"qwen-chat-template"` برای `chat_template_kwargs.enable_thinking` روی backendهای خانواده Qwen که kwargs سطح درخواست chat-template را پشتیبانی می‌کنند، مانند vLLM، استفاده کنید. OpenClaw thinking غیرفعال را به `false` و thinking فعال را به `true` نگاشت می‌کند، و مدل‌های Qwen پیکربندی‌شده vLLM برای این قالب‌ها گزینه‌های دودویی `/think` را ارائه می‌کنند.
- `compat.supportedReasoningEfforts`: فهرست effort reasoning سازگار با OpenAI برای هر مدل. برای endpointهای سفارشی که واقعا آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ در این حالت OpenClaw گزینه `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی CLI عامل، و اعتبارسنجی `llm-task` برای همان provider/model پیکربندی‌شده ارائه می‌کند. وقتی backend برای یک سطح متعارف مقدار مختص provider می‌خواهد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: گزینه Z.AI فقط با opt-in برای thinking حفظ‌شده. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ به [thinking و thinking حفظ‌شده در Z.AI](/fa/providers/zai#thinking-and-preserved-thinking) مراجعه کنید.
- `localService`: مدیر فرایند اختیاری در سطح provider برای سرورهای مدل محلی/خودمیزبان. وقتی مدل انتخاب‌شده به آن provider تعلق داشته باشد، OpenClaw نشانی `healthUrl` (یا `baseUrl + "/models"`) را probe می‌کند، اگر endpoint پایین باشد `command` را با `args` اجرا می‌کند، تا `readyTimeoutMs` منتظر می‌ماند، سپس درخواست مدل را ارسال می‌کند. `command` باید یک مسیر مطلق باشد. `idleStopMs: 0` فرایند را تا خروج OpenClaw زنده نگه می‌دارد؛ مقدار مثبت، فرایند ایجادشده توسط OpenClaw را پس از همان تعداد میلی‌ثانیه بیکاری متوقف می‌کند. به [سرویس‌های مدل محلی](/fa/gateway/local-model-services) مراجعه کنید.
- سیاست runtime روی providerها یا مدل‌ها قرار می‌گیرد، نه روی `agents.defaults`. برای قوانین سراسری provider از `models.providers.<provider>.agentRuntime` استفاده کنید، یا برای قوانین مختص مدل از `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` استفاده کنید. مدل‌های عامل OpenAI روی provider رسمی OpenAI به‌صورت پیش‌فرض Codex را انتخاب می‌کنند.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`،‏ `/models set-image`، و فرمان‌های افزودن/حذف fallback) شکل شیء canonical را ذخیره می‌کنند و در صورت امکان فهرست‌های fallback موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجراهای موازی عامل در میان نشست‌ها (هر نشست همچنان سریالی اجرا می‌شود). پیش‌فرض: 4.

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

- `id`: `"auto"`، `"openclaw"`، شناسهٔ هارنس Plugin ثبت‌شده، یا نام مستعار بک‌اند CLI پشتیبانی‌شده. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic بک‌اند CLI با نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` به هارنس‌های Plugin ثبت‌شده اجازه می‌دهد نوبت‌های پشتیبانی‌شده را در اختیار بگیرند و وقتی هیچ هارنسی منطبق نباشد از OpenClaw استفاده می‌کند. یک زمان اجرای Plugin صریح مانند `id: "codex"` به آن هارنس نیاز دارد و اگر در دسترس نباشد یا شکست بخورد، با حالت بسته شکست می‌خورد.
- `id: "pi"` فقط به‌عنوان نام مستعار منسوخ برای `openclaw` پذیرفته می‌شود تا پیکربندی‌های منتشرشده از نسخهٔ v2026.5.22 و قبل‌تر حفظ شوند. پیکربندی جدید باید از `openclaw` استفاده کند.
- اولویت زمان اجرا ابتدا سیاست دقیق مدل است (`agents.list[].models["provider/model"]`، `agents.defaults.models["provider/model"]`، یا `models.providers.<provider>.models[]`)، سپس `agents.list[]` / `agents.defaults.models["provider/*"]`، و سپس سیاست سراسری ارائه‌دهنده در `models.providers.<provider>.agentRuntime`.
- کلیدهای زمان اجرای کل عامل قدیمی هستند. `agents.defaults.agentRuntime`، `agents.list[].agentRuntime`، پین‌های زمان اجرای نشست، و `OPENCLAW_AGENT_RUNTIME` در انتخاب زمان اجرا نادیده گرفته می‌شوند. برای حذف مقادیر کهنه، `openclaw doctor --fix` را اجرا کنید.
- مدل‌های عامل OpenAI به‌طور پیش‌فرض از هارنس Codex استفاده می‌کنند؛ وقتی می‌خواهید این را صریح کنید، `agentRuntime.id: "codex"` برای ارائه‌دهنده/مدل همچنان معتبر است.
- برای استقرارهای Claude CLI، `model: "anthropic/claude-opus-4-8"` به‌همراه `agentRuntime.id: "claude-cli"` در محدودهٔ مدل را ترجیح دهید. ارجاع‌های مدل قدیمی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را canonical نگه دارد و بک‌اند اجرا را در سیاست زمان اجرای ارائه‌دهنده/مدل قرار دهد.
- این فقط اجرای نوبت عامل متنی را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدئو، و TTS همچنان از تنظیمات ارائه‌دهنده/مدل خود استفاده می‌کنند.

**میان‌برهای نام مستعار داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

| نام مستعار         | مدل                             |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

نام‌های مستعار پیکربندی‌شدهٔ شما همیشه بر پیش‌فرض‌ها اولویت دارند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌طور پیش‌فرض `tool_stream` را برای استریم فراخوانی ابزار فعال می‌کنند. برای غیرفعال‌کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
Anthropic Claude Opus 4.8 در OpenClaw به‌طور پیش‌فرض تفکر را خاموش نگه می‌دارد؛ وقتی تفکر تطبیقی صریحاً فعال شود، پیش‌فرض تلاشِ تحت مالکیت ارائه‌دهندهٔ Anthropic مقدار `high` است. مدل‌های Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض روی `adaptive` قرار می‌گیرند.

### `agents.defaults.cliBackends`

بک‌اندهای CLI اختیاری برای اجراهای جایگزین فقط‌متنی (بدون فراخوانی ابزار). به‌عنوان پشتیبان هنگام شکست ارائه‌دهندگان API مفید است.

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
- `reseedFromRawTranscriptWhenUncompacted: true` به یک بک‌اند اجازه می‌دهد نشست‌های نامعتبرشدهٔ امن را از انتهای محدود رونوشت خام OpenClaw، پیش از وجود نخستین خلاصهٔ Compaction، بازیابی کند. تغییرات پروفایل احراز هویت یا دورهٔ اعتبارنامه همچنان هرگز با خام‌کاشت دوباره انجام نمی‌شوند.

### `agents.defaults.promptOverlays`

هم‌پوشانی‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانوادهٔ مدل روی سطح‌های پرامپت مونتاژشده توسط OpenClaw اعمال می‌شوند. شناسه‌های مدل خانوادهٔ GPT-5 قرارداد رفتار مشترک را در مسیرهای OpenClaw/ارائه‌دهنده دریافت می‌کنند؛ `personality` فقط لایهٔ سبک تعامل دوستانه را کنترل می‌کند. مسیرهای بومی سرور برنامهٔ Codex به‌جای این هم‌پوشانی GPT-5 مربوط به OpenClaw، دستورالعمل‌های پایه/مدل تحت مالکیت Codex را نگه می‌دارند، و OpenClaw شخصیت داخلی Codex را برای رشته‌های بومی غیرفعال می‌کند.

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
- `"off"` فقط لایهٔ دوستانه را غیرفعال می‌کند؛ قرارداد رفتار برچسب‌خوردهٔ GPT-5 فعال می‌ماند.
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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

- `every`: رشتهٔ مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال‌کردن روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستم حذف می‌کند و تزریق `HEARTBEAT.md` به زمینهٔ bootstrap را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را طی اجراهای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: بیشینهٔ زمان مجاز به ثانیه برای یک نوبت عامل Heartbeat پیش از لغو شدن. اگر تنظیم نشود، در صورت تنظیم از `agents.defaults.timeoutSeconds` استفاده می‌کند، و در غیر این صورت cadence Heartbeat با سقف ۶۰۰ ثانیه اعمال می‌شود.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` را منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینهٔ bootstrap سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های bootstrap فضای کاری نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه و بدون تاریخچهٔ گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی cron `sessionTarget: "isolated"`. هزینهٔ توکن هر Heartbeat را از حدود ۱۰۰K به حدود ۲ تا ۵K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat روی مسیرهای مشغول اضافی آن عامل به تعویق می‌افتند: زیرعامل مبتنی بر کلید نشست خودش یا کار فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
- برای هر عامل: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر عاملی `heartbeat` را تعریف کند، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند — بازه‌های کوتاه‌تر توکن‌های بیشتری مصرف می‌کنند.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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
- `provider`: شناسه‌ی یک plugin ثبت‌شده‌ی ارائه‌دهنده‌ی Compaction. وقتی تنظیم شود، به‌جای خلاصه‌سازی داخلی LLM، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به حالت داخلی برمی‌گردد. تنظیم ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: بیشینه‌ی ثانیه‌های مجاز برای یک عملیات Compaction منفرد پیش از آنکه OpenClaw آن را متوقف کند. پیش‌فرض: `180`.
- `keepRecentTokens`: بودجه‌ی نقطه‌ی برش عامل برای نگه‌داشتن جدیدترین دنباله‌ی رونوشت به‌صورت لفظ‌به‌لفظ. `/compact` دستی وقتی صریحاً تنظیم شده باشد آن را رعایت می‌کند؛ در غیر این صورت Compaction دستی یک نقطه‌ی وارسی سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` هنگام خلاصه‌سازی Compaction، راهنمای داخلی نگه‌داری شناسه‌های مبهم را در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه‌ها که هنگام `identifierPolicy=custom` استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش دوباره در خروجی بدشکل برای خلاصه‌های safeguard. به‌طور پیش‌فرض در حالت safeguard فعال است؛ برای رد کردن بازبینی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه‌ی ابزار. وقتی `enabled: true` باشد، OpenClaw پس از افزوده شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش جاری را پیش از ارسال پرامپت متوقف می‌کند و مسیر بازیابی پیش‌بررسی موجود را برای کوتاه‌سازی نتایج ابزار یا Compaction و تلاش دوباره بازاستفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. وقتی تنظیم نشده باشد یا روی `[]` تنظیم شود، تزریق دوباره غیرفعال است. تنظیم صریح `["Session Startup", "Red Lines"]` آن جفت را فعال می‌کند و fallback قدیمی `Every Session`/`Safety` را حفظ می‌کند. این را فقط وقتی فعال کنید که زمینه‌ی اضافی ارزش خطر تکرار راهنمایی پروژه‌ای را داشته باشد که از قبل در خلاصه‌ی Compaction ثبت شده است.
- `model`: `provider/model-id` اختیاری یا alias ساده از `agents.defaults.models` فقط برای خلاصه‌سازی Compaction. aliasهای ساده پیش از dispatch resolve می‌شوند؛ شناسه‌های مدل literal پیکربندی‌شده هنگام برخورد، اولویت خود را حفظ می‌کنند. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه‌ی اختیاری بایت (`number` یا رشته‌هایی مثل `"20mb"`) که وقتی JSONL فعال از آستانه بگذرد، پیش از یک اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به رونوشت جانشین کوچک‌تری بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و تکمیل Compaction اعلان‌های کوتاهی برای کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). به‌طور پیش‌فرض غیرفعال است تا Compaction بی‌صدا بماند.
- `memoryFlush`: نوبت عاملانه‌ی بی‌صدا پیش از Compaction خودکار برای ذخیره‌ی حافظه‌های ماندگار. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مثل `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیره‌ی fallback نشست فعال را به ارث نمی‌برد. وقتی workspace فقط‌خواندنی باشد رد می‌شود.

### `agents.defaults.runRetries`

مرزهای تکرار تلاش دوباره‌ی حلقه‌ی اجرای بیرونی برای runtime عامل توکار، برای جلوگیری از حلقه‌های اجرای بی‌نهایت هنگام بازیابی از شکست. توجه کنید که این تنظیم در حال حاضر فقط روی runtime عامل توکار اعمال می‌شود، نه runtimeهای ACP یا CLI.

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

- `base`: تعداد پایه‌ی تکرارهای تلاش دوباره برای حلقه‌ی اجرای بیرونی. پیش‌فرض: `24`.
- `perProfile`: تکرارهای تلاش دوباره‌ی اضافی که به ازای هر نامزد پروفایل fallback اعطا می‌شود. پیش‌فرض: `8`.
- `min`: حد مطلق کمینه برای تکرارهای تلاش دوباره‌ی اجرا. پیش‌فرض: `32`.
- `max`: حد مطلق بیشینه برای تکرارهای تلاش دوباره‌ی اجرا برای جلوگیری از اجرای مهارنشده. پیش‌فرض: `160`.

### `agents.defaults.contextPruning`

**نتایج ابزار قدیمی** را پیش از ارسال به LLM از زمینه‌ی درون‌حافظه‌ای هرس می‌کند. تاریخچه‌ی نشست روی دیسک را تغییر **نمی‌دهد**.

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
- `ttl` کنترل می‌کند هرس چند وقت یک‌بار می‌تواند دوباره اجرا شود (پس از آخرین لمس cache).
- هرس ابتدا نتایج ابزار بیش‌ازحد بزرگ را soft-trim می‌کند، سپس در صورت نیاز نتایج ابزار قدیمی‌تر را hard-clear می‌کند.
- `softTrimRatio` و `hardClearRatio` مقدارهای `0.0` تا `1.0` را می‌پذیرند؛ اعتبارسنجی پیکربندی مقدارهای خارج از این بازه را رد می‌کند.

**Soft-trim** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**Hard-clear** کل نتیجه‌ی ابزار را با placeholder جایگزین می‌کند.

نکته‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها مبتنی بر نویسه‌اند (تقریبی)، نه تعداد دقیق token.
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
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های به‌ازای حساب). Signal/Slack/Discord/Google Chat به‌طور پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. بازنویسی به‌ازای عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار + تکه‌بندی، [جریان‌دهی](/fa/concepts/streaming) را ببینید.

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

- پیش‌فرض‌ها: `instant` برای گفت‌وگوهای مستقیم/mentionها، `message` برای گفت‌وگوهای گروهی بدون mention.
- بازنویسی‌های به‌ازای نشست: `session.typingMode`، `session.typingIntervalSeconds`.

[نشانگرهای تایپ](/fa/concepts/typing-indicators) را ببینید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

sandboxing اختیاری برای عامل توکار. برای راهنمای کامل، [Sandboxing](/fa/gateway/sandboxing) را ببینید.

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

- `docker`: runtime محلی Docker (پیش‌فرض)
- `ssh`: runtime راه‌دور عمومی مبتنی بر SSH
- `openshell`: runtime OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات ویژه‌ی runtime به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی backend مربوط به SSH:**

- `target`: هدف SSH در قالب `user@host[:port]`
- `command`: فرمان سرویس‌گیرنده‌ی SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه‌ی راه‌دور مطلق که برای workspaceهای به‌ازای scope استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH پاس داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتوای inline یا SecretRefها که OpenClaw هنگام runtime به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: تنظیمات policy کلید میزبان OpenSSH

**اولویت auth در SSH:**

- `identityData` بر `identityFile` مقدم است
- `certificateData` بر `certificateFile` مقدم است
- `knownHostsData` بر `knownHostsFile` مقدم است
- مقدارهای `*Data` پشتیبانی‌شده با SecretRef پیش از شروع نشست sandbox از snapshot فعال runtime رازها resolve می‌شوند

**رفتار backend مربوط به SSH:**

- پس از create یا recreate، workspace راه‌دور را یک‌بار seed می‌کند
- سپس workspace راه‌دور SSH را canonical نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه‌دور را به‌طور خودکار به میزبان sync نمی‌کند
- از containerهای مرورگر sandbox پشتیبانی نمی‌کند

**دسترسی workspace:**

- `none`: workspace sandbox به‌ازای scope زیر `~/.openclaw/sandboxes`
- `ro`: workspace sandbox در `/workspace`، workspace عامل به‌صورت فقط‌خواندنی در `/agent` mount شده
- `rw`: workspace عامل به‌صورت خواندنی/نوشتنی در `/workspace` mount شده

**Scope:**

- `session`: container + workspace به‌ازای نشست
- `agent`: یک container + workspace به‌ازای هر عامل (پیش‌فرض)
- `shared`: container و workspace مشترک (بدون جداسازی میان‌نشستی)

**پیکربندی plugin مربوط به OpenShell:**

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

- `mirror`: پیش از اجرا محیط دوردست را از محلی مقداردهی اولیه می‌کند، پس از اجرا دوباره همگام‌سازی می‌کند؛ محیط کاری محلی مرجع اصلی می‌ماند
- `remote`: هنگام ایجاد سندباکس، محیط دوردست را یک‌بار مقداردهی اولیه می‌کند، سپس محیط کاری دوردست را مرجع اصلی نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که بیرون از OpenClaw انجام می‌شوند، پس از مرحله مقداردهی اولیه به‌صورت خودکار داخل سندباکس همگام‌سازی نمی‌شوند.
انتقال از طریق SSH به سندباکس OpenShell انجام می‌شود، اما Plugin مالک چرخه عمر سندباکس و همگام‌سازی آینه‌ای اختیاری است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشه قابل نوشتن، و کاربر root نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) بگذارید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است، مگر اینکه به‌صراحت
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` را تنظیم کنید (حالت اضطراری).
نوبت‌های app-server در Codex داخل یک سندباکس فعال OpenClaw از همین تنظیم خروجی برای دسترسی شبکه بومی حالت کد خود استفاده می‌کنند.

**پیوست‌های ورودی** در `media/inbound/*` در محیط کاری فعال آماده‌سازی می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان بیشتری را mount می‌کند؛ bindهای سراسری و مختص هر عامل با هم ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL مربوط به noVNC در پرامپت سیستم تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی مشاهده‌گر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای گذرواژه در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) نشست‌های سندباکس‌شده را از هدف‌گرفتن مرورگر میزبان منع می‌کند.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط وقتی آن را روی `bridge` بگذارید که صراحتا اتصال bridge سراسری می‌خواهید.
- `cdpSourceRange` به‌صورت اختیاری ورود CDP در لبه کانتینر را به یک بازه CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` دایرکتوری‌های میزبان بیشتری را فقط داخل کانتینر مرورگر سندباکس mount می‌کند. وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
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
    به‌طور پیش‌فرض فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توان آن‌ها را با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` اگر گردش‌کار شما به افزونه‌ها وابسته باشد، آن‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ مقدار `0` را تنظیم کنید تا از محدودیت پیش‌فرض پردازش Chromium استفاده شود.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها خط پایه تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر از یک تصویر مرورگر سفارشی با entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکس‌سازی مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصاویر (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build` به [سندباکس‌سازی § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

### `agents.list` (بازنویسی‌های مختص هر عامل)

از `agents.list[].tts` استفاده کنید تا به یک عامل ارائه‌دهنده TTS، صدا، مدل،
سبک، یا حالت TTS خودکار اختصاصی بدهید. بلوک عامل به‌صورت عمیق روی
`messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک جای واحد بمانند و عامل‌های جداگانه
فقط فیلدهای صدا یا ارائه‌دهنده مورد نیاز خود را بازنویسی کنند. بازنویسی عامل فعال
روی پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و
ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و تقدم، [تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides)
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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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
- `model`: شکل رشته‌ای یک primary سخت‌گیرانه مختص هر عامل و بدون fallback مدل تنظیم می‌کند؛ شکل شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` را اضافه کنید. از `{ primary, fallbacks: [...] }` استفاده کنید تا آن عامل را وارد fallback کنید، یا از `{ primary, fallbacks: [] }` استفاده کنید تا رفتار سخت‌گیرانه را صریح کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند همچنان fallbackهای پیش‌فرض را به ارث می‌برند، مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای جریان مختص هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های مختص عامل مانند `cacheRetention`، `temperature`، یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری تبدیل متن به گفتار مختص هر عامل. این بلوک به‌صورت عمیق روی `messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده و سیاست fallback مشترک را در `messages.tts` نگه دارید و فقط مقدارهای مختص persona مانند ارائه‌دهنده، صدا، مدل، سبک، یا حالت خودکار را اینجا تنظیم کنید.
- `skills`: allowlist اختیاری Skills مختص هر عامل. اگر حذف شود، عامل در صورت تنظیم بودن `agents.defaults.skills` را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، جایگزین پیش‌فرض‌ها می‌شود، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح پیش‌فرض thinking اختیاری مختص هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی مختص پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. پروفایل ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند کدام مقدارها معتبر هستند؛ برای Google Gemini، مقدار `adaptive` thinking پویای تحت مالکیت ارائه‌دهنده را حفظ می‌کند (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی پیش‌فرض reasoning اختیاری مختص هر عامل (`on | off | stream`). وقتی هیچ بازنویسی reasoning مختص پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری مختص هر عامل برای حالت سریع (`"auto" | true | false`). وقتی هیچ بازنویسی حالت سریع مختص پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `models`: کاتالوگ مدل/بازنویسی‌های runtime اختیاری مختص هر عامل که با شناسه‌های کامل `provider/model` کلیدگذاری شده‌اند. برای استثناهای runtime مختص هر عامل از `models["provider/model"].agentRuntime` استفاده کنید.
- `runtime`: توصیفگر runtime اختیاری مختص هر عامل. وقتی عامل باید به‌طور پیش‌فرض از نشست‌های harness مربوط به ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی نسبت به محیط کاری، URL از نوع `http(s)`، یا URI از نوع `data:`.
- فایل‌های تصویر محلی `identity.avatar` که نسبت به محیط کاری هستند به ۲ مگابایت محدودند. URLهای `http(s)` و URIهای `data:` با محدودیت اندازه فایل محلی بررسی نمی‌شوند.
- `identity` پیش‌فرض‌ها را استخراج می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: allowlist شناسه‌های عامل پیکربندی‌شده برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هر هدف پیکربندی‌شده؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های خودهدف‌گیر `agentId` باید مجاز باشند، شناسه درخواست‌دهنده را وارد کنید. ورودی‌های کهنه‌ای که پیکربندی عاملشان حذف شده است توسط `sessions_spawn` رد می‌شوند و از `agents_list` حذف می‌شوند؛ برای پاک‌سازی آن‌ها `openclaw doctor --fix` را اجرا کنید، یا اگر آن هدف باید درحالی‌که پیش‌فرض‌ها را به ارث می‌برد همچنان قابل spawn باشد، یک ورودی حداقلی `agents.list[]` اضافه کنید.
- محافظ ارث‌بری سندباکس: اگر نشست درخواست‌دهنده سندباکس‌شده باشد، `sessions_spawn` هدف‌هایی را که بدون سندباکس اجرا می‌شوند رد می‌کند.
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

- `type` (اختیاری): `route` برای مسیریابی عادی (نوعِ حذف‌شده به‌طور پیش‌فرض route است)، `acp` برای bindingهای گفت‌وگوی پایدار ACP.
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

در هر سطح، اولین ورودی منطبق در `bindings` برنده می‌شود.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) resolve می‌کند و از ترتیب سطح‌های route binding بالا استفاده نمی‌کند.

### پروفایل‌های دسترسی مختص هر عامل

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

برای جزئیات تقدم، [سندباکس و ابزارهای چندعامله](/fa/tools/multi-agent-sandbox-tools) را ببینید.

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
      mode: "enforce", // enforce (default) | warn
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

- **`scope`**: راهبرد پایه گروه‌بندی نشست برای زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده در یک زمینه کانال، نشست ایزوله خودش را می‌گیرد.
  - `global`: همه شرکت‌کنندگان در یک زمینه کانال، یک نشست مشترک دارند؛ فقط وقتی استفاده کنید که زمینه مشترک مدنظر است.
- **`dmScope`**: نحوه گروه‌بندی پیام‌های مستقیم.
  - `main`: همه پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند.
  - `per-peer`: بر اساس شناسه فرستنده در همه کانال‌ها ایزوله می‌کند.
  - `per-channel-peer`: برای هر کانال + فرستنده ایزوله می‌کند؛ برای صندوق‌های ورودی چندکاربره توصیه می‌شود.
  - `per-account-channel-peer`: برای هر حساب + کانال + فرستنده ایزوله می‌کند؛ برای چندحسابی توصیه می‌شود.
- **`identityLinks`**: شناسه‌های canonical را برای اشتراک‌گذاری نشست بین‌کانالی به همتایان دارای پیشوند provider نگاشت می‌کند. فرمان‌های dock مانند `/dock_discord` از همین نگاشت برای تغییر مسیر پاسخ نشست فعال به یک همتای کانالی پیوندشده دیگر استفاده می‌کنند؛ [داک‌کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در زمان محلی `atHour` بازنشانی می‌کند؛ `idle` پس از `idleMinutes` بازنشانی می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود برنده است. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بیکار از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارباش‌های Cron، اعلان‌های exec، و bookkeeping مربوط به Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بیکار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های نوع‌به‌نوع (`direct`، `group`، `thread`). `dm` قدیمی به‌عنوان alias برای `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. runtime همیشه برای باکت اصلی گفت‌وگوی مستقیم از `"main"` استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینه نوبت‌های پاسخ‌برگشتی بین عامل‌ها در تبادل‌های عامل‌به‌عامل (عدد صحیح، بازه: `0` تا `20`، پیش‌فرض: `5`). `0` زنجیره‌سازی رفت‌وبرگشتی را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با alias قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. نخستین deny برنده است.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگهداشت ذخیره نشست.
  - `mode`: `enforce` پاک‌سازی را اعمال می‌کند و پیش‌فرض است؛ `warn` فقط هشدارها را منتشر می‌کند.
  - `pruneAfter`: مرز سنی برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: بیشینه تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). runtime پاک‌سازی دسته‌ای را با یک بافر کوچک high-water برای سقف‌های در اندازه تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را بلافاصله اعمال می‌کند.
  - نشست‌های کوتاه‌عمر probe اجرای مدل Gateway از نگهداشت ثابت `24h` استفاده می‌کنند، اما پاک‌سازی با فشار کنترل می‌شود: فقط وقتی فشار نگهداشت/سقف ورودی نشست برسد، ردیف‌های probe اجرای مدل strict و کهنه را حذف می‌کند. فقط کلیدهای probe صریح strict که با `agent:*:explicit:model-run-<uuid>` مطابقت دارند واجد شرایط‌اند؛ نشست‌های عادی direct، group، thread، Cron، hook، Heartbeat، ACP، و sub-agent این نگهداشت ۲۴ ساعته را به ارث نمی‌برند. وقتی پاک‌سازی اجرای مدل اجرا می‌شود، پیش از پاک‌سازی گسترده‌تر ورودی‌های کهنه `pruneAfter` و سقف `maxEntries` اجرا می‌شود.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگهداشت برای آرشیوهای رونوشت `*.reset.<timestamp>`. به‌طور پیش‌فرض برابر `pruneAfter` است؛ برای غیرفعال‌کردن، روی `false` تنظیم کنید.
  - `maxDiskBytes`: بودجه اختیاری دیسک دایرکتوری نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` قدیمی‌ترین artifactها/نشست‌ها را اول حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض آن `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های نشست مقید به thread.
  - `enabled`: سوییچ پیش‌فرض اصلی؛ providerها می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند
  - `idleHours`: auto-unfocus پیش‌فرض در اثر نبود فعالیت، به ساعت (`0` غیرفعال می‌کند؛ providerها می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینه سن سخت پیش‌فرض، به ساعت (`0` غیرفعال می‌کند؛ providerها می‌توانند بازنویسی کنند)
  - `spawnSessions`: gate پیش‌فرض برای ساخت نشست‌های کاری مقید به thread از `sessions_spawn` و spawnهای thread در ACP. وقتی thread bindingها فعال باشند، پیش‌فرض آن `true` است؛ providerها/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینه پیش‌فرض native برای subagent در spawnهای مقید به thread (`"fork"` یا `"isolated"`). پیش‌فرض آن `"fork"` است.

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

حل مقدار (خاص‌ترین برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و cascade را متوقف می‌کند. `"auto"` از `[{identity.name}]` مشتق می‌شود.

**متغیرهای قالب:**

| متغیر             | توضیح                  | مثال                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل          | `claude-opus-4-6`           |
| `{modelFull}`     | شناسه کامل مدل         | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام provider           | `anthropic`                 |
| `{thinkingLevel}` | سطح thinking فعلی      | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل          | (همانند `"auto"`)           |

متغیرها به حروف بزرگ و کوچک حساس نیستند. `{think}` یک alias برای `{thinkingLevel}` است.

### واکنش تأیید

- به‌طور پیش‌فرض برابر `identity.emoji` عامل فعال است، و در غیر این صورت `"👀"`. برای غیرفعال‌کردن روی `""` تنظیم کنید.
- بازنویسی‌های هر کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل مقدار: حساب → کانال → `messages.ackReaction` → fallback هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: پس از پاسخ، ack را در کانال‌هایی که از واکنش پشتیبانی می‌کنند مانند Slack، Discord، Telegram، WhatsApp، و iMessage حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخه‌عمر را در Slack، Discord، Telegram، و WhatsApp فعال می‌کند.
  در Slack و Discord، تنظیم‌نشدن باعث می‌شود وقتی واکنش‌های ack فعال‌اند، واکنش‌های وضعیت هم فعال بمانند.
  در Telegram و WhatsApp، آن را صریحاً روی `true` تنظیم کنید تا واکنش‌های وضعیت چرخه‌عمر فعال شوند.
- `messages.statusReactions.emojis`: کلیدهای ایموجی چرخه‌عمر را بازنویسی می‌کند:
  `queued`، `thinking`، `compacting`، `tool`، `coding`، `web`، `deploy`، `build`،
  `concierge`، `done`، `error`، `stallSoft`، و `stallHard`.
  Telegram فقط یک مجموعه واکنش ثابت را مجاز می‌داند، بنابراین ایموجی‌های پیکربندی‌شده و پشتیبانی‌نشده
  برای آن گفت‌وگو به نزدیک‌ترین گونه وضعیت پشتیبانی‌شده fallback می‌کنند.

### debounce ورودی

پیام‌های فقط‌متنی سریع از یک فرستنده را در یک نوبت عامل واحد دسته‌بندی می‌کند. رسانه/پیوست‌ها بلافاصله flush می‌شوند. فرمان‌های کنترلی debouncing را دور می‌زنند.

### TTS (تبدیل متن به گفتار)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` حالت پیش‌فرض TTS خودکار را کنترل می‌کند: `off`، `always`، `inbound` یا `tagged`. `/tts on|off` می‌تواند ترجیحات محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصه‌سازی خودکار بازنویسی می‌کند.
- `modelOverrides` به‌صورت پیش‌فرض فعال است؛ مقدار پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند فعال‌سازی صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` بازمی‌گردند.
- ارائه‌دهندگان گفتار همراه، متعلق به Plugin هستند. اگر `plugins.allow` تنظیم شده است، هر Plugin ارائه‌دهنده TTS را که می‌خواهید استفاده کنید وارد کنید؛ برای نمونه `microsoft` برای Edge TTS. شناسه ارائه‌دهنده قدیمی `edge` به‌عنوان نام مستعار برای `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطه پایانی OpenAI TTS را بازنویسی می‌کند. ترتیب تفکیک ابتدا پیکربندی، سپس `OPENAI_TTS_BASE_URL` و سپس `https://api.openai.com/v1` است.
- وقتی `providers.openai.baseUrl` به یک نقطه پایانی غیر OpenAI اشاره می‌کند، OpenClaw آن را به‌عنوان سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌تر می‌کند.

---

## گفتگو

پیش‌فرض‌های حالت گفتگو (macOS/iOS/Android).

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
          speakerVoice: "cedar",
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

- وقتی چند ارائه‌دهنده گفتگو پیکربندی شده‌اند، `talk.provider` باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی گفتگو (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند. `openclaw doctor --fix` را اجرا کنید تا پیکربندی ذخیره‌شده به `talk.providers.<provider>` بازنویسی شود.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` بازمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- بازگشت به `ELEVENLABS_API_KEY` فقط زمانی اعمال می‌شود که هیچ کلید API گفتگویی پیکربندی نشده باشد.
- `providers.*.voiceAliases` به دستورهای گفتگو اجازه می‌دهد از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face مورد استفاده کمک‌کننده محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS از طریق کمک‌کننده همراه `openclaw-mlx-tts` در صورت وجود اجرا می‌شود، یا از یک فایل اجرایی در `PATH`؛ `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌کننده را برای توسعه بازنویسی می‌کند.
- `consultThinkingLevel` سطح تفکر را برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های realtime `openclaw_agent_consult` گفتگوی رابط کاربری Control کنترل می‌کند. برای حفظ رفتار عادی نشست/مدل، آن را تنظیم‌نشده بگذارید.
- `consultFastMode` برای مشاوره‌های realtime گفتگوی رابط کاربری Control، بدون تغییر دادن تنظیم عادی حالت سریع نشست، یک بازنویسی یک‌باره حالت سریع تنظیم می‌کند.
- `speechLocale` شناسه locale استاندارد BCP 47 را که تشخیص گفتار گفتگوی iOS/macOS استفاده می‌کند تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت گفتگو پس از سکوت کاربر چه مدت منتظر بماند تا رونوشت را ارسال کند. تنظیم‌نشده بودن، پنجره مکث پیش‌فرض پلتفرم را حفظ می‌کند (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` دستورالعمل‌های سیستمی روبه‌ارائه‌دهنده را به اعلان realtime داخلی OpenClaw اضافه می‌کند، تا سبک صدا بدون از دست دادن راهنمایی پیش‌فرض `openclaw_agent_consult` قابل پیکربندی باشد.
- `realtime.consultRouting` بازگشت رله Gateway را زمانی کنترل می‌کند که ارائه‌دهنده realtime رونوشت نهایی کاربر را بدون `openclaw_agent_consult` تولید کند: `provider-direct` پاسخ‌های مستقیم ارائه‌دهنده را حفظ می‌کند، در حالی که `force-agent-consult` درخواست نهایی‌شده را از طریق OpenClaw مسیریابی می‌کند.

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همه کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
