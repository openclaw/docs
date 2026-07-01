---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و پیوندهای چندعاملی
    - تنظیم رفتار نشست، تحویل پیام و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-07-01T13:12:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی در محدوده عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
`messages.*` و `talk.*`. برای کانال‌ها، ابزارها، زمان اجرای Gateway و دیگر
کلیدهای سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## پیش‌فرض‌های عامل

### `agents.defaults.workspace`

پیش‌فرض: وقتی تنظیم شده باشد `OPENCLAW_WORKSPACE_DIR`، در غیر این صورت `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

مقدار صریح `agents.defaults.workspace` بر
`OPENCLAW_WORKSPACE_DIR` اولویت دارد. از متغیر محیطی برای اشاره عامل‌های پیش‌فرض
به یک فضای کاری mount شده استفاده کنید، وقتی نمی‌خواهید آن مسیر را در config بنویسید.

### `agents.defaults.repoRoot`

ریشه اختیاری repository که در خط Runtime پرامپت سیستم نشان داده می‌شود. اگر تنظیم نشده باشد، OpenClaw با حرکت رو به بالا از فضای کاری آن را خودکار تشخیص می‌دهد.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist پیش‌فرض و اختیاری Skills برای عامل‌هایی که
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
- برای نداشتن Skills، مقدار `agents.list[].skills: []` را تنظیم کنید.
- فهرست غیرخالی `agents.list[].skills` مجموعه نهایی برای آن عامل است؛ با
  پیش‌فرض‌ها ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های راه‌اندازی اولیه فضای کاری (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شده فضای کاری را رد می‌کند، در حالی که فایل‌های راه‌اندازی اولیه الزامی همچنان نوشته می‌شوند. مقدارهای معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند فایل‌های راه‌اندازی اولیه فضای کاری چه زمانی در پرامپت سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامه امن (پس از پاسخ کامل‌شده دستیار) تزریق دوباره راه‌اندازی اولیه فضای کاری را رد می‌کنند و اندازه پرامپت را کاهش می‌دهند. اجراهای Heartbeat و تلاش‌های دوباره پس از Compaction همچنان context را دوباره می‌سازند.
- `"never"`: راه‌اندازی اولیه فضای کاری و تزریق فایل context را در هر نوبت غیرفعال می‌کند. این را فقط برای عامل‌هایی استفاده کنید که چرخه عمر پرامپت خود را کاملا مالک هستند (موتورهای context سفارشی، runtimeهای native که context خودشان را می‌سازند، یا workflowهای تخصصی بدون bootstrap). نوبت‌های Heartbeat و بازیابی پس از Compaction نیز تزریق را رد می‌کنند.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

override برای هر عامل: `agents.list[].contextInjection`. مقدارهای حذف‌شده از
`agents.defaults.contextInjection` به ارث می‌برند.

### `agents.defaults.bootstrapMaxChars`

حداکثر تعداد نویسه برای هر فایل راه‌اندازی اولیه فضای کاری پیش از کوتاه‌سازی. پیش‌فرض: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

override برای هر عامل: `agents.list[].bootstrapMaxChars`. مقدارهای حذف‌شده از
`agents.defaults.bootstrapMaxChars` به ارث می‌برند.

### `agents.defaults.bootstrapTotalMaxChars`

حداکثر مجموع نویسه‌های تزریق‌شده در همه فایل‌های راه‌اندازی اولیه فضای کاری. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

override برای هر عامل: `agents.list[].bootstrapTotalMaxChars`. مقدارهای حذف‌شده
از `agents.defaults.bootstrapTotalMaxChars` به ارث می‌برند.

### overrideهای پروفایل راه‌اندازی اولیه برای هر عامل

وقتی یک عامل به رفتار تزریق پرامپت متفاوتی نسبت به پیش‌فرض‌های مشترک نیاز دارد،
از overrideهای پروفایل راه‌اندازی اولیه برای هر عامل استفاده کنید. فیلدهای حذف‌شده از
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

اعلان قابل‌مشاهده برای عامل در پرامپت سیستم را هنگام کوتاه شدن context راه‌اندازی اولیه کنترل می‌کند.
پیش‌فرض: `"always"`.

- `"off"`: هرگز متن اعلان کوتاه‌سازی را در پرامپت سیستم تزریق نکن.
- `"once"`: برای هر امضای کوتاه‌سازی یکتا، یک اعلان کوتاه را یک‌بار تزریق کن.
- `"always"`: وقتی کوتاه‌سازی وجود دارد، در هر اجرا یک اعلان کوتاه تزریق کن (توصیه‌شده).

شمارش‌های raw/injected دقیق و فیلدهای تنظیم config در diagnosticsهایی مانند
گزارش‌های context/status و logها می‌مانند؛ context معمول کاربر/runtime در WebChat فقط
اعلان کوتاه بازیابی را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### نقشه مالکیت بودجه context

OpenClaw چندین بودجه پرحجم prompt/context دارد و آن‌ها عمدا بر اساس زیرسیستم
جدا شده‌اند، نه اینکه همه از یک knob عمومی عبور کنند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق معمول راه‌اندازی اولیه فضای کاری.
- `agents.defaults.startupContext.*`:
  پیش‌درآمد یک‌باره اجرای مدل هنگام reset/startup، شامل فایل‌های روزانه اخیر
  `memory/*.md`. فرمان‌های ساده chat `/new` و `/reset` بدون فراخوانی مدل
  تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشرده Skills که در پرامپت سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  بریده‌های bounded runtime و بلوک‌های تزریق‌شده تحت مالکیت runtime.
- `memory.qmd.limits.*`:
  sizing تزریق و snippet جست‌وجوی memory ایندکس‌شده.

فقط وقتی یک عامل به بودجه متفاوتی نیاز دارد، از override متناظر برای هر عامل
استفاده کنید:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

پیش‌درآمد startup نوبت اول را کنترل می‌کند که در اجراهای مدل reset/startup تزریق می‌شود.
فرمان‌های ساده chat `/new` و `/reset`، reset را بدون فراخوانی مدل تأیید می‌کنند،
پس این پیش‌درآمد را بارگذاری نمی‌کنند.

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

پیش‌فرض‌های مشترک برای سطح‌های bounded runtime context.

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

- `memoryGetMaxChars`: سقف پیش‌فرض بریده `memory_get` پیش از اضافه شدن
  metadata کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجره خط پیش‌فرض `memory_get` وقتی `lines` حذف شده باشد.
- `toolResultMaxChars`: سقف پیشرفته نتیجه ابزار live که برای نتایج پایدارشده
  و بازیابی overflow استفاده می‌شود. برای سقف خودکار model-context آن را unset بگذارید:
  `16000` نویسه زیر 100K توکن، `32000` نویسه در 100K+ توکن، و `64000`
  نویسه در 200K+ توکن. مقدارهای صریح تا `1000000` برای
  مدل‌های long-context پذیرفته می‌شوند، اما سقف مؤثر همچنان به حدود 30٪ از
  پنجره context مدل محدود است. `openclaw doctor --deep` سقف مؤثر را چاپ می‌کند،
  و doctor فقط وقتی هشدار می‌دهد که یک override صریح stale باشد یا اثری نداشته باشد.
- `postCompactionMaxChars`: سقف بریده AGENTS.md که هنگام تزریق refresh پس از Compaction
  استفاده می‌شود.

#### `agents.list[].contextLimits`

override برای هر عامل برای knobهای مشترک `contextLimits`. فیلدهای حذف‌شده از
`agents.defaults.contextLimits` به ارث می‌برند.

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

سقف سراسری برای فهرست فشرده Skills که در پرامپت سیستم تزریق می‌شود. این
خواندن فایل‌های `SKILL.md` در زمان نیاز را تحت تأثیر قرار نمی‌دهد.

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

override برای هر عامل برای بودجه پرامپت Skills.

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

حداکثر اندازه پیکسلی برای طولانی‌ترین ضلع تصویر در بلوک‌های تصویر transcript/tool پیش از فراخوانی provider.
پیش‌فرض: `1200`.

مقادیر پایین‌تر معمولا مصرف vision-token و اندازه payload درخواست را برای اجراهای screenshot-heavy کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ترجیح compression/detail ابزار تصویر برای تصویرهایی که از مسیرهای فایل، URLها و media referenceها بارگذاری می‌شوند.
پیش‌فرض: `auto`.

OpenClaw نردبان resize را با مدل تصویر انتخاب‌شده تطبیق می‌دهد. برای مثال، Claude Opus 4.8، OpenAI GPT-5.5، Qwen VL و مدل‌های vision میزبانی‌شده Llama 4 می‌توانند از تصویرهای بزرگ‌تر نسبت به مسیرهای vision قدیمی‌تر/پیش‌فرض high-detail استفاده کنند، در حالی که نوبت‌های چندتصویری در حالت `auto` فشرده‌سازی تهاجمی‌تری دارند تا هزینه token و latency کنترل شود.

مقادیر:

- `auto`: با محدودیت‌های مدل و تعداد تصویرها تطبیق بده.
- `efficient`: تصویرهای کوچک‌تر را برای مصرف token و byte کمتر ترجیح بده.
- `balanced`: از نردبان استاندارد میانه استفاده کن.
- `high`: جزئیات بیشتری را برای screenshotها، diagramها و تصویرهای document حفظ کن.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

timezone برای context پرامپت سیستم (نه timestampهای پیام). به timezone میزبان fallback می‌کند.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

فرمت زمان در پرامپت سیستم. پیش‌فرض: `auto` (ترجیح OS).

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
  - قالب رشته فقط مدل اصلی را تنظیم می‌کند.
  - قالب شیء، مدل اصلی به‌همراه مدل‌های جایگزین مرتب‌شده برای جایگزینی هنگام خرابی را تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - مسیر ابزار `image` از آن به‌عنوان پیکربندی مدل بینایی استفاده می‌کند.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نمی‌تواند ورودی تصویر را بپذیرد، برای مسیریابی جایگزین استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های بدون پیشوند برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه بدون پیشوند به‌طور یکتا با یک ورودی پیکربندی‌شده و دارای قابلیت تصویر در `models.providers.*.models` منطبق باشد، OpenClaw آن را به همان ارائه‌دهنده نسبت می‌دهد. تطابق‌های پیکربندی‌شده مبهم به پیشوند صریح ارائه‌دهنده نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده که تصویر تولید کند از آن استفاده می‌کند.
  - مقادیر معمول: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini، `fal/fal-ai/flux/dev` برای fal، `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینه شفاف از OpenAI.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت ارائه‌دهنده مطابق را هم پیکربندی کنید (برای نمونه `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`، `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`، و `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده مبتنی بر احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهندگان ثبت‌شده تولید تصویر را به ترتیب شناسه ارائه‌دهنده.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` از آن استفاده می‌کند.
  - مقادیر معمول: `google/lyria-3-clip-preview`، `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده مبتنی بر احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهندگان ثبت‌شده تولید موسیقی را به ترتیب شناسه ارائه‌دهنده.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده مطابق را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - قابلیت مشترک تولید ویدئو و ابزار داخلی `video_generate` از آن استفاده می‌کند.
  - مقادیر معمول: `qwen/wan2.6-t2v`، `qwen/wan2.6-i2v`، `qwen/wan2.6-r2v`، `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده مبتنی بر احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهندگان ثبت‌شده تولید ویدئو را به ترتیب شناسه ارائه‌دهنده.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده مطابق را هم پیکربندی کنید.
  - Plugin رسمی تولید ویدئوی Qwen تا ۱ ویدئوی خروجی، ۱ تصویر ورودی، ۴ ویدئوی ورودی، مدت ۱۰ ثانیه، و گزینه‌های سطح ارائه‌دهنده `size`، `aspectRatio`، `resolution`، `audio` و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - ابزار `pdf` از آن برای مسیریابی مدل استفاده می‌کند.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شده جلسه/پیش‌فرض برمی‌گردد.
- `pdfMaxBytesMb`: محدودیت اندازه پیش‌فرض PDF برای ابزار `pdf` وقتی `maxBytesMb` هنگام فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: حداکثر تعداد صفحات پیش‌فرض که حالت جایگزین استخراج در ابزار `pdf` در نظر می‌گیرد.
- `verboseDefault`: سطح پرگویی پیش‌فرض برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خط‌های ابزار پیش‌نویس پیشرفت. مقادیر: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (افزودن فرمان/جزئیات خام هنگام موجود بودن). `agents.list[].toolProgressDetail` مخصوص هر عامل، این پیش‌فرض را بازنویسی می‌کند.
- `reasoningDefault`: نمایانی پیش‌فرض استدلال برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"stream"`. `agents.list[].reasoningDefault` مخصوص هر عامل، این پیش‌فرض را بازنویسی می‌کند. پیش‌فرض‌های استدلال پیکربندی‌شده فقط برای مالکان، فرستندگان مجاز، یا زمینه‌های Gateway مدیر-اپراتور اعمال می‌شوند، آن هم وقتی هیچ بازنویسی استدلال در سطح پیام یا جلسه تنظیم نشده باشد.
- `elevatedDefault`: سطح پیش‌فرض خروجی ارتقایافته برای عامل‌ها. مقادیر: `"off"`، `"on"`، `"ask"`، `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (مثلاً `openai/gpt-5.5` برای دسترسی با کلید API OpenAI یا Codex OAuth). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک نام مستعار را امتحان می‌کند، سپس یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط پس از آن به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد (رفتار سازگاری منسوخ‌شده، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را عرضه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض کهنه مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
- `models`: کاتالوگ مدل پیکربندی‌شده و فهرست مجاز برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (ویژه ارائه‌دهنده، برای نمونه `temperature`، `maxTokens`، `cacheRetention`، `context1m`، `responsesServerCompaction`، `responsesCompactThreshold`، مسیریابی `provider` در OpenRouter، `chat_template_kwargs`، `extra_body`/`extraBody`) باشد.
  - از ورودی‌های `provider/*` مانند `"openai/*": {}` یا `"vllm/*": {}` استفاده کنید تا همه مدل‌های کشف‌شده برای ارائه‌دهندگان انتخاب‌شده را بدون فهرست‌کردن دستی تک‌تک شناسه‌های مدل نشان دهید.
  - وقتی همه مدل‌های کشف‌شده پویا برای آن ارائه‌دهنده باید از Runtime یکسان استفاده کنند، `agentRuntime` را به یک ورودی `provider/*` اضافه کنید. سیاست Runtime دقیق `provider/model` همچنان بر wildcard اولویت دارد.
  - ویرایش‌های امن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که ورودی‌های موجود فهرست مجاز را حذف کنند رد می‌کند، مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های پیکربندی/راه‌اندازی اولیه محدود به ارائه‌دهنده، مدل‌های ارائه‌دهنده انتخاب‌شده را در این نقشه ادغام می‌کنند و ارائه‌دهندگان نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses، Compaction سمت سرور به‌صورت خودکار فعال است. برای توقف تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای بازنویسی آستانه از `params.responsesCompactThreshold` استفاده کنید. [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) را ببینید.
- `params`: پارامترهای پیش‌فرض سراسری ارائه‌دهنده که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (مثلاً `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (مخصوص مدل) بازنویسی می‌شود، سپس `agents.list[].params` (شناسه عامل مطابق) بر اساس کلید بازنویسی می‌کند. برای جزئیات، [کش کردن پرامپت](/fa/reference/prompt-caching) را ببینید.
- `models.providers.openrouter.params.provider`: سیاست پیش‌فرض سراسری OpenRouter برای مسیریابی ارائه‌دهنده. OpenClaw این را به شیء `provider` درخواست OpenRouter ارسال می‌کند؛ `agents.defaults.models["openrouter/<model>"].params.provider` مخصوص هر مدل و پارامترهای عامل بر اساس کلید بازنویسی می‌کنند. [مسیریابی ارائه‌دهنده OpenRouter](/fa/providers/openrouter#advanced-configuration) را ببینید.
- `params.extra_body`/`params.extraBody`: JSON عبوری پیشرفته که در بدنه‌های درخواست `api: "openai-completions"` برای پراکسی‌های سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده برخورد کند، بدنه اضافی برنده است؛ مسیرهای تکمیل غیربومی همچنان پس از آن `store` ویژه OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های الگوی گفت‌وگوی سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با تفکر خاموش، Plugin داخلی vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح پیش‌فرض‌های تولیدشده را بازنویسی می‌کند، و `extra_body.chat_template_kwargs` همچنان اولویت نهایی را دارد. مدل‌های تفکر Qwen و Nemotron پیکربندی‌شده در vLLM، به‌جای نردبان تلاش چندسطحی، گزینه‌های دودویی `/think` (`off`، `on`) را ارائه می‌کنند.
- `compat.thinkingFormat`: سبک بار مفید تفکر سازگار با OpenAI. از `"together"` برای `reasoning.enabled` به سبک Together، از `"qwen"` برای `enable_thinking` سطح بالای Qwen، یا از `"qwen-chat-template"` برای `chat_template_kwargs.enable_thinking` در بک‌اندهای خانواده Qwen که kwargs الگوی گفت‌وگوی سطح درخواست را پشتیبانی می‌کنند، مانند vLLM، استفاده کنید. OpenClaw تفکر غیرفعال را به `false` و تفکر فعال را به `true` نگاشت می‌کند، و مدل‌های Qwen پیکربندی‌شده در vLLM برای این قالب‌ها گزینه‌های دودویی `/think` را ارائه می‌کنند.
- `compat.supportedReasoningEfforts`: فهرست تلاش استدلال سازگار با OpenAI در سطح هر مدل. برای نقاط پایانی سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw گزینه `/think xhigh` را در منوهای فرمان، ردیف‌های جلسه Gateway، اعتبارسنجی وصله جلسه، اعتبارسنجی CLI عامل، و اعتبارسنجی `llm-task` برای آن ارائه‌دهنده/مدل پیکربندی‌شده نمایش می‌دهد. وقتی بک‌اند برای یک سطح کانونی مقدار ویژه ارائه‌دهنده می‌خواهد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: گزینه فعال‌سازی ویژه Z.AI برای حفظ تفکر. وقتی فعال باشد و تفکر روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را دوباره پخش می‌کند؛ [تفکر Z.AI و تفکر حفظ‌شده](/fa/providers/zai#thinking-and-preserved-thinking) را ببینید.
- `localService`: مدیر فرایند اختیاری در سطح ارائه‌دهنده برای سرورهای مدل محلی/خودمیزبان. وقتی مدل انتخاب‌شده به آن ارائه‌دهنده تعلق داشته باشد، OpenClaw نشانی `healthUrl` (یا `baseUrl + "/models"`) را بررسی می‌کند، اگر نقطه پایانی پایین باشد `command` را با `args` شروع می‌کند، تا `readyTimeoutMs` صبر می‌کند، سپس درخواست مدل را می‌فرستد. `command` باید یک مسیر مطلق باشد. `idleStopMs: 0` فرایند را تا خروج OpenClaw زنده نگه می‌دارد؛ مقدار مثبت، فرایندی را که OpenClaw ایجاد کرده پس از آن تعداد میلی‌ثانیه بیکاری متوقف می‌کند. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- سیاست Runtime به ارائه‌دهندگان یا مدل‌ها تعلق دارد، نه به `agents.defaults`. برای قوانین سراسری ارائه‌دهنده از `models.providers.<provider>.agentRuntime` استفاده کنید، یا برای قوانین ویژه مدل از `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` استفاده کنید. مدل‌های عامل OpenAI روی ارائه‌دهنده رسمی OpenAI به‌طور پیش‌فرض Codex را انتخاب می‌کنند.
- نویسنده‌های پیکربندی که این فیلدها را تغییر می‌دهند (برای نمونه `/models set`، `/models set-image` و فرمان‌های افزودن/حذف جایگزین)، قالب شیء کانونی را ذخیره می‌کنند و در صورت امکان فهرست‌های جایگزین موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجرای موازی عامل در میان جلسه‌ها (هر جلسه همچنان ترتیبی اجرا می‌شود). پیش‌فرض: ۴.

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

- `id`: `"auto"`، `"openclaw"`، شناسهٔ ثبت‌شدهٔ harness یک Plugin، یا یک نام مستعار پشتیبانی‌شده برای بک‌اند CLI. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic بک‌اند CLI با نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` اجازه می‌دهد harnessهای ثبت‌شدهٔ Plugin نوبت‌های پشتیبانی‌شده را در اختیار بگیرند و وقتی هیچ harnessی مطابق نباشد از OpenClaw استفاده می‌کند. runtime صریح یک Plugin مانند `id: "codex"` به همان harness نیاز دارد و اگر در دسترس نباشد یا شکست بخورد، بسته شکست می‌خورد.
- `id: "pi"` فقط به‌عنوان نام مستعار منسوخ برای `openclaw` پذیرفته می‌شود تا پیکربندی‌های منتشرشده از v2026.5.22 و قدیمی‌تر حفظ شوند. پیکربندی جدید باید از `openclaw` استفاده کند.
- تقدم runtime ابتدا سیاست دقیق مدل است (`agents.list[].models["provider/model"]`، `agents.defaults.models["provider/model"]`، یا `models.providers.<provider>.models[]`)، سپس `agents.list[]` / `agents.defaults.models["provider/*"]`، و سپس سیاست سراسری provider در `models.providers.<provider>.agentRuntime`.
- کلیدهای runtime در سطح کل agent قدیمی هستند. `agents.defaults.agentRuntime`، `agents.list[].agentRuntime`، پین‌های runtime نشست، و `OPENCLAW_AGENT_RUNTIME` در انتخاب runtime نادیده گرفته می‌شوند. برای حذف مقادیر کهنه، `openclaw doctor --fix` را اجرا کنید.
- مدل‌های agent مربوط به OpenAI به‌صورت پیش‌فرض از harness مربوط به Codex استفاده می‌کنند؛ وقتی می‌خواهید این موضوع را صریح کنید، `agentRuntime.id: "codex"` برای provider/model همچنان معتبر است.
- برای استقرارهای Claude CLI، از `model: "anthropic/claude-opus-4-8"` به‌همراه `agentRuntime.id: "claude-cli"` در محدودهٔ مدل استفاده کنید. ارجاع‌های مدل قدیمی `claude-cli/claude-opus-4-7` هنوز برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب provider/model را canonical نگه دارد و بک‌اند اجرا را در سیاست runtime مربوط به provider/model قرار دهد.
- این فقط اجرای نوبت agent متنی را کنترل می‌کند. تولید رسانه، vision، PDF، موسیقی، ویدئو، و TTS همچنان از تنظیمات provider/model خود استفاده می‌کنند.

**میان‌برهای نام مستعار داخلی** (فقط وقتی اعمال می‌شوند که مدل در `agents.defaults.models` باشد):

| نام مستعار         | مدل                             |
| ------------------ | ------------------------------- |
| `opus`             | `anthropic/claude-opus-4-8`     |
| `sonnet`           | `anthropic/claude-sonnet-4-6`   |
| `gpt`              | `openai/gpt-5.4`                |
| `gpt-mini`         | `openai/gpt-5.4-mini`           |
| `gpt-nano`         | `openai/gpt-5.4-nano`           |
| `gemini`           | `google/gemini-3.1-pro-preview` |
| `gemini-flash`     | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

نام‌های مستعار پیکربندی‌شدهٔ شما همیشه بر پیش‌فرض‌ها مقدم هستند.

مدل‌های Z.AI GLM-4.x به‌صورت خودکار حالت thinking را فعال می‌کنند، مگر اینکه `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌صورت پیش‌فرض `tool_stream` را برای جریان‌دهی فراخوانی ابزار فعال می‌کنند. برای غیرفعال کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
Anthropic Claude Opus 4.8 در OpenClaw به‌صورت پیش‌فرض thinking را خاموش نگه می‌دارد؛ وقتی adaptive thinking صریحاً فعال شود، پیش‌فرض effort تحت مالکیت provider در Anthropic برابر `high` است. مدل‌های Claude 4.6 وقتی سطح thinking صریحی تنظیم نشده باشد، به‌صورت پیش‌فرض روی `adaptive` قرار می‌گیرند.

### `agents.defaults.cliBackends`

بک‌اندهای CLI اختیاری برای اجراهای fallback فقط‌متنی (بدون فراخوانی ابزار). به‌عنوان پشتیبان وقتی API providerها شکست می‌خورند مفید است.

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
- وقتی `imageArg` مسیر فایل‌ها را بپذیرد، عبور تصویر پشتیبانی می‌شود.
- `reseedFromRawTranscriptWhenUncompacted: true` اجازه می‌دهد یک بک‌اند نشست‌های باطل‌شدهٔ امن را
  پیش از وجود نخستین خلاصهٔ Compaction، از دنبالهٔ محدود transcript خام OpenClaw بازیابی کند.
  تغییرات نمایهٔ auth یا credential-epoch
  همچنان هرگز raw-reseed نمی‌شوند.

### `agents.defaults.promptOverlays`

لایه‌های prompt مستقل از provider که بر اساس خانوادهٔ مدل روی سطح‌های prompt مونتاژشده توسط OpenClaw اعمال می‌شوند. شناسه‌های مدل خانوادهٔ GPT-5 قرارداد رفتاری مشترک را در مسیرهای OpenClaw/provider دریافت می‌کنند؛ `personality` فقط لایهٔ سبک تعامل دوستانه را کنترل می‌کند. مسیرهای بومی app-server مربوط به Codex به‌جای این لایهٔ OpenClaw GPT-5، دستورهای پایه/مدل تحت مالکیت Codex را نگه می‌دارند، و OpenClaw شخصیت داخلی Codex را برای threadهای بومی غیرفعال می‌کند.

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
- `"off"` فقط لایهٔ دوستانه را غیرفعال می‌کند؛ قرارداد رفتاری برچسب‌خوردهٔ GPT-5 فعال می‌ماند.
- اگر این تنظیم مشترک تنظیم نشده باشد، `plugins.entries.openai.config.personality` قدیمی همچنان خوانده می‌شود.

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

- `every`: رشتهٔ مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال کردن، آن را روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از system prompt حذف می‌کند و تزریق `HEARTBEAT.md` به context راه‌اندازی را رد می‌کند. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را در اجراهای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: حداکثر زمان مجاز بر حسب ثانیه برای یک نوبت Heartbeat agent پیش از abort شدن. برای استفاده از `agents.defaults.timeoutSeconds` در صورت تنظیم بودن، وگرنه cadence مربوط به Heartbeat با سقف ۶۰۰ ثانیه، آن را تنظیم‌نشده بگذارید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` صادر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از context راه‌اندازی سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی workspace نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در نشستی تازه و بدون تاریخچهٔ گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی cron `sessionTarget: "isolated"`. هزینهٔ توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در laneهای مشغول اضافی همان agent به تعویق می‌افتند: کار subagent با کلید نشست خودش یا کار دستور nested. laneهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
- برای هر agent: `agents.list[].heartbeat` را تنظیم کنید. وقتی هر agent مقدار `heartbeat` را تعریف کند، **فقط همان agentها** Heartbeat اجرا می‌کنند.
- Heartbeatها نوبت‌های کامل agent را اجرا می‌کنند — بازه‌های کوتاه‌تر توکن‌های بیشتری مصرف می‌کنند.

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
- `provider`: شناسه‌ی یک Plugin ثبت‌شده‌ی ارائه‌دهنده‌ی Compaction. وقتی تنظیم شود، به‌جای خلاصه‌سازی LLM داخلی، `summarize()` ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به داخلی بازمی‌گردد. تنظیم ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: حداکثر ثانیه‌های مجاز برای یک عملیات Compaction منفرد پیش از آن‌که OpenClaw آن را متوقف کند. پیش‌فرض: `180`.
- `keepRecentTokens`: بودجه‌ی نقطه‌ی برش عامل برای نگه‌داشتن انتهای جدیدترین رونوشت به‌صورت عین‌به‌عین. `/compact` دستی وقتی صریحاً تنظیم شده باشد به این احترام می‌گذارد؛ در غیر این صورت Compaction دستی یک نقطه‌ی وارسی سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` هنگام خلاصه‌سازی Compaction راهنمای داخلی حفظ شناسه‌های مات را در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش دوباره هنگام خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌صورت پیش‌فرض فعال است؛ برای رد کردن ممیزی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقه‌ی ابزار. وقتی `enabled: true` باشد، OpenClaw پس از افزوده شدن نتایج ابزار و پیش از فراخوانی مدل بعدی، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، پیش از ارسال پرامپت تلاش فعلی را متوقف می‌کند و از مسیر بازیابی پیش‌بررسی موجود برای کوتاه‌سازی نتایج ابزار یا Compaction و تلاش دوباره استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش‌های H2/H3 در AGENTS.md برای تزریق دوباره پس از Compaction. وقتی تنظیم نشده باشد یا روی `[]` تنظیم شود، تزریق دوباره غیرفعال است. تنظیم صریح `["Session Startup", "Red Lines"]` آن جفت را فعال می‌کند و fallback قدیمی `Every Session`/`Safety` را حفظ می‌کند. این را فقط وقتی فعال کنید که زمینه‌ی اضافی ارزش خطر تکرار راهنمای پروژه‌ای را داشته باشد که از قبل در خلاصه‌ی Compaction ثبت شده است.
- `model`: `provider/model-id` اختیاری یا نام مستعار ساده از `agents.defaults.models` فقط برای خلاصه‌سازی Compaction. نام‌های مستعار ساده پیش از ارسال resolve می‌شوند؛ شناسه‌های لفظی پیکربندی‌شده‌ی مدل در برخوردها اولویت خود را حفظ می‌کنند. وقتی نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند، از این استفاده کنید؛ وقتی تنظیم نشود، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانه‌ی بایت اختیاری (`number` یا رشته‌هایی مانند `"20mb"`) که وقتی JSONL فعال از آستانه عبور کند، پیش از اجرای run، Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به یک رونوشت جانشین کوچک‌تر بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و تکمیل Compaction اعلان‌های کوتاه به کاربر می‌فرستد (برای مثال، "Compacting context..." و "Compaction complete"). برای بی‌صدا ماندن Compaction به‌صورت پیش‌فرض غیرفعال است.
- `memoryFlush`: نوبت عامل‌محور بی‌صدا پیش از Compaction خودکار برای ذخیره‌ی حافظه‌های بادوام. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این override زنجیره‌ی fallback نشست فعال را به ارث نمی‌برد. وقتی workspace فقط‌خواندنی باشد رد می‌شود.

### `agents.defaults.runRetries`

مرزهای تکرار تلاش دوباره‌ی حلقه‌ی اجرای بیرونی برای runtime عامل تعبیه‌شده، جهت جلوگیری از حلقه‌های اجرای بی‌نهایت هنگام بازیابی از شکست. توجه داشته باشید که این تنظیم در حال حاضر فقط برای runtime عامل تعبیه‌شده اعمال می‌شود، نه runtimeهای ACP یا CLI.

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

- `base`: تعداد پایه‌ی تکرارهای تلاش دوباره‌ی run برای حلقه‌ی run بیرونی. پیش‌فرض: `24`.
- `perProfile`: تکرارهای تلاش دوباره‌ی run اضافی که به‌ازای هر نامزد پروفایل fallback اعطا می‌شود. پیش‌فرض: `8`.
- `min`: حد مطلق حداقل برای تکرارهای تلاش دوباره‌ی run. پیش‌فرض: `32`.
- `max`: حد مطلق حداکثر برای تکرارهای تلاش دوباره‌ی run جهت جلوگیری از اجرای مهارنشده. پیش‌فرض: `160`.

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
- `ttl` کنترل می‌کند هرس هر چند وقت یک‌بار می‌تواند دوباره اجرا شود (پس از آخرین لمس cache).
- هرس ابتدا نتایج ابزار بزرگ‌ازحد را نرم کوتاه می‌کند، سپس در صورت نیاز نتایج ابزار قدیمی‌تر را سخت پاک می‌کند.
- `softTrimRatio` و `hardClearRatio` مقدارهای از `0.0` تا `1.0` را می‌پذیرند؛ اعتبارسنجی پیکربندی مقدارهای خارج از این بازه را رد می‌کند.

**کوتاه‌سازی نرم** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**پاک‌سازی سخت** کل نتیجه‌ی ابزار را با placeholder جایگزین می‌کند.

نکته‌ها:

- بلوک‌های تصویر هرگز کوتاه/پاک نمی‌شوند.
- نسبت‌ها مبتنی بر کاراکتر هستند (تقریبی)، نه تعداد دقیق توکن.
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

- کانال‌های غیر Telegram برای فعال کردن پاسخ‌های بلوکی به `*.blockStreaming: true` صریح نیاز دارند.
- overrideهای کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های به‌ازای هر حساب). Signal/Slack/Discord/Google Chat به‌صورت پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. override به‌ازای هر عامل: `agents.list[].humanDelay`.

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

- پیش‌فرض‌ها: `instant` برای چت‌های مستقیم/mentionها، `message` برای چت‌های گروهی بدون mention.
- overrideهای به‌ازای هر نشست: `session.typingMode`، `session.typingIntervalSeconds`.

[نشانگرهای تایپ](/fa/concepts/typing-indicators) را ببینید.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

sandboxing اختیاری برای عامل تعبیه‌شده. برای راهنمای کامل، [Sandboxing](/fa/gateway/sandboxing) را ببینید.

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

**پیکربندی backend SSH:**

- `target`: هدف SSH در قالب `user@host[:port]`
- `command`: دستور کارخواه SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشه‌ی راه‌دور مطلق که برای workspaceهای به‌ازای هر scope استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH پاس داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتواهای درون‌خطی یا SecretRefهایی که OpenClaw هنگام runtime به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: کنترل‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` مقدم است
- `certificateData` بر `certificateFile` مقدم است
- `knownHostsData` بر `knownHostsFile` مقدم است
- مقدارهای `*Data` مبتنی بر SecretRef پیش از شروع نشست sandbox از snapshot فعال runtime اسرار resolve می‌شوند

**رفتار backend SSH:**

- workspace راه‌دور را یک‌بار پس از ایجاد یا ایجاد دوباره seed می‌کند
- سپس workspace راه‌دور SSH را canonical نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه‌دور را به‌صورت خودکار به میزبان همگام‌سازی نمی‌کند
- از کانتینرهای مرورگر sandbox پشتیبانی نمی‌کند

**دسترسی workspace:**

- `none`: workspace sandbox به‌ازای هر scope زیر `~/.openclaw/sandboxes`
- `ro`: workspace sandbox در `/workspace`، workspace عامل به‌صورت فقط‌خواندنی در `/agent` mount می‌شود
- `rw`: workspace عامل به‌صورت خواندن/نوشتن در `/workspace` mount می‌شود

**Scope:**

- `session`: کانتینر + workspace به‌ازای هر نشست
- `agent`: یک کانتینر + workspace به‌ازای هر عامل (پیش‌فرض)
- `shared`: کانتینر و workspace مشترک (بدون جداسازی میان‌نشستی)

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
          gateway: "lab", // اختیاری
          gatewayEndpoint: "https://lab.example", // اختیاری
          policy: "strict", // شناسه سیاست اختیاری OpenShell
          providers: ["openai"], // اختیاری
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**حالت OpenShell:**

- `mirror`: پیش از اجرا، راه‌دور را از محلی مقداردهی اولیه می‌کند و پس از اجرا دوباره همگام‌سازی می‌کند؛ فضای کاری محلی مرجع canonical باقی می‌ماند
- `remote`: هنگام ایجاد sandbox، راه‌دور را یک‌بار مقداردهی اولیه می‌کند، سپس فضای کاری راه‌دور را canonical نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که خارج از OpenClaw انجام شده‌اند، پس از مرحله مقداردهی اولیه به‌طور خودکار در sandbox همگام‌سازی نمی‌شوند.
انتقال از طریق SSH به sandbox OpenShell انجام می‌شود، اما Plugin مالک چرخه عمر sandbox و همگام‌سازی mirror اختیاری است.

**`setupCommand`** یک‌بار پس از ایجاد کانتینر اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، root قابل‌نوشتن و کاربر root نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکه bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است، مگر اینکه صراحتاً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` را تنظیم کنید (break-glass).
نوبت‌های app-server مربوط به Codex در یک sandbox فعال OpenClaw از همین تنظیم خروجی برای دسترسی شبکه code-mode بومی خود استفاده می‌کنند.

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال مرحله‌بندی می‌شوند.

**`docker.binds`** دایرکتوری‌های اضافی میزبان را mount می‌کند؛ bindهای سراسری و per-agent با هم ادغام می‌شوند.

**مرورگر sandboxشده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL مربوط به noVNC در system prompt تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی مشاهده‌گر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای گذرواژه در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) جلوی هدف‌گیری مرورگر میزبان توسط نشست‌های sandboxشده را می‌گیرد.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکه bridge اختصاصی). فقط وقتی آن را روی `bridge` تنظیم کنید که صراحتاً اتصال bridge سراسری می‌خواهید.
- `cdpSourceRange` می‌تواند به‌صورت اختیاری ورود CDP را در لبه کانتینر به یک بازه CIDR محدود کند (برای مثال `172.21.0.1/32`).
- `sandbox.browser.binds` فقط دایرکتوری‌های اضافی میزبان را در کانتینر مرورگر sandbox mount می‌کند. وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود.
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
  - `--disable-3d-apis`، `--disable-software-rasterizer` و `--disable-gpu`
    به‌طور پیش‌فرض فعال هستند و اگر استفاده از WebGL/3D به آن نیاز داشته باشد، می‌توان آن‌ها را با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال کرد.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` اگر گردش‌کار شما به افزونه‌ها
    وابسته باشد، آن‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از محدودیت پردازش
    پیش‌فرض Chromium، مقدار `0` را تنظیم کنید.
  - به‌علاوه `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها baseline تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر از یک تصویر مرورگر سفارشی با
    entrypoint سفارشی استفاده کنید.

</Accordion>

sandbox کردن مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصویرها (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای دستورهای inline `docker build` به [Sandboxing § تصویرها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

### `agents.list` (بازنویسی‌های per-agent)

از `agents.list[].tts` استفاده کنید تا برای یک عامل، ارائه‌دهنده TTS، صدا، مدل،
سبک یا حالت auto-TTS اختصاصی تعیین کنید. بلوک عامل روی
`messages.tts` سراسری به‌صورت deep-merge اعمال می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک‌جا بمانند و عامل‌های جداگانه
فقط فیلدهای صدا یا ارائه‌دهنده موردنیازشان را بازنویسی کنند. بازنویسی عامل فعال برای پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status` و
ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و تقدم، [متن به گفتار](/fa/tools/tts#per-agent-voice-overrides)
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
- `default`: وقتی چند مورد تنظیم شده باشد، اولین مورد برنده می‌شود (هشدار ثبت می‌شود). اگر هیچ‌کدام تنظیم نشده باشد، اولین ورودی فهرست پیش‌فرض است.
- `model`: فرم رشته‌ای یک primary سخت‌گیرانه per-agent بدون fallback مدل تنظیم می‌کند؛ فرم شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` اضافه کنید. از `{ primary, fallbacks: [...] }` برای وارد کردن آن عامل به fallback استفاده کنید، یا از `{ primary, fallbacks: [] }` برای صریح کردن رفتار سخت‌گیرانه استفاده کنید. کارهای Cron که فقط `primary` را بازنویسی می‌کنند، همچنان fallbackهای پیش‌فرض را به ارث می‌برند مگر اینکه `fallbacks: []` تنظیم کنید.
- `params`: پارامترهای stream per-agent که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` ادغام می‌شوند. از این برای بازنویسی‌های ویژه عامل مانند `cacheRetention`، `temperature` یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: بازنویسی‌های اختیاری متن به گفتار per-agent. این بلوک روی `messages.tts` به‌صورت deep-merge اعمال می‌شود، پس اعتبارنامه‌های ارائه‌دهنده و سیاست fallback مشترک را در `messages.tts` نگه دارید و فقط مقادیر ویژه persona مانند ارائه‌دهنده، صدا، مدل، سبک یا حالت خودکار را اینجا تنظیم کنید.
- `skills`: allowlist اختیاری Skills برای هر عامل. اگر حذف شود، عامل وقتی `agents.defaults.skills` تنظیم شده باشد، آن را به ارث می‌برد؛ یک فهرست صریح به‌جای ادغام، پیش‌فرض‌ها را جایگزین می‌کند و `[]` یعنی هیچ Skillsای وجود ندارد.
- `thinkingDefault`: سطح پیش‌فرض اختیاری تفکر per-agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ بازنویسی per-message یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل بازنویسی می‌کند. پروفایل ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند کدام مقادیر معتبر هستند؛ برای Google Gemini، `adaptive` تفکر پویا تحت مالکیت ارائه‌دهنده را نگه می‌دارد (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی پیش‌فرض اختیاری reasoning per-agent (`on | off | stream`). وقتی هیچ بازنویسی reasoning مربوط به per-message یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل بازنویسی می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری per-agent برای حالت سریع (`"auto" | true | false`). وقتی هیچ بازنویسی per-message یا نشست برای حالت سریع تنظیم نشده باشد، اعمال می‌شود.
- `models`: بازنویسی‌های اختیاری کاتالوگ مدل/زمان اجرا per-agent که با شناسه‌های کامل `provider/model` کلیدگذاری شده‌اند. از `models["provider/model"].agentRuntime` برای استثناهای زمان اجرای per-agent استفاده کنید.
- `runtime`: توصیف‌گر اختیاری زمان اجرای per-agent. وقتی عامل باید به‌طور پیش‌فرض از نشست‌های harness مربوط به ACP استفاده کند، از `type: "acp"` با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به فضای کاری، URL از نوع `http(s)` یا URI از نوع `data:`.
- فایل‌های تصویر محلی `identity.avatar` که نسبت به فضای کاری هستند، به ۲ مگابایت محدودند. URLهای `http(s)` و URIهای `data:` با محدودیت اندازه فایل محلی بررسی نمی‌شوند.
- `identity` پیش‌فرض‌ها را مشتق می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: allowlist شناسه‌های عامل پیکربندی‌شده برای هدف‌های صریح `sessions_spawn.agentId` (`["*"]` = هر هدف پیکربندی‌شده؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` با هدف خود عامل باید مجاز باشند، شناسه درخواست‌کننده را اضافه کنید. ورودی‌های کهنه‌ای که پیکربندی عاملشان حذف شده، توسط `sessions_spawn` رد می‌شوند و از `agents_list` حذف می‌شوند؛ برای پاک‌سازی آن‌ها `openclaw doctor --fix` را اجرا کنید، یا اگر آن هدف باید در حالی که پیش‌فرض‌ها را به ارث می‌برد همچنان قابل spawn باشد، یک ورودی حداقلی `agents.list[]` اضافه کنید.
- نگهبان وراثت sandbox: اگر نشست درخواست‌کننده sandboxشده باشد، `sessions_spawn` هدف‌هایی را که unsandboxed اجرا می‌شوند رد می‌کند.
- `subagents.requireAgentId`: وقتی true باشد، فراخوانی‌های `sessions_spawn` را که `agentId` را حذف می‌کنند مسدود می‌کند (انتخاب صریح پروفایل را اجبار می‌کند؛ پیش‌فرض: false).

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

- `type` (اختیاری): `route` برای مسیریابی معمولی (type حذف‌شده به‌طور پیش‌فرض route است)، `acp` برای bindingهای گفت‌وگوی پایدار ACP.
- `match.channel` (الزامی)
- `match.accountId` (اختیاری؛ `*` = هر حساب؛ حذف‌شده = حساب پیش‌فرض)
- `match.peer` (اختیاری؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختیاری؛ ویژه channel)
- `acp` (اختیاری؛ فقط برای `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتیب تطبیق قطعی:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (دقیق، بدون peer/guild/team)
5. `match.accountId: "*"` (در سطح channel)
6. عامل پیش‌فرض

در هر سطح، اولین ورودی مطابق در `bindings` برنده می‌شود.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) resolve می‌کند و از ترتیب سطح binding مسیریابی بالا استفاده نمی‌کند.

### پروفایل‌های دسترسی per-agent

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
  - `per-sender` (پیش‌فرض): هر فرستنده درون یک زمینه کانال، نشست ایزوله خودش را می‌گیرد.
  - `global`: همه شرکت‌کنندگان در یک زمینه کانال، یک نشست مشترک دارند؛ فقط وقتی استفاده کنید که زمینه مشترک مدنظر باشد.
- **`dmScope`**: نحوه گروه‌بندی پیام‌های مستقیم.
  - `main`: همه پیام‌های مستقیم نشست اصلی را مشترکاً استفاده می‌کنند.
  - `per-peer`: بر اساس شناسه فرستنده در همه کانال‌ها ایزوله می‌کند.
  - `per-channel-peer`: به ازای هر کانال + فرستنده ایزوله می‌کند؛ برای صندوق‌های ورودی چندکاربره توصیه می‌شود.
  - `per-account-channel-peer`: به ازای هر حساب + کانال + فرستنده ایزوله می‌کند؛ برای چندحسابی توصیه می‌شود.
- **`identityLinks`**: شناسه‌های کانونی را برای اشتراک نشست بین‌کانالی به همتایان دارای پیشوند ارائه‌دهنده نگاشت می‌کند. فرمان‌های داک مانند `/dock_discord` از همان نگاشت استفاده می‌کنند تا مسیر پاسخ نشست فعال را به همتای کانالی لینک‌شده دیگری تغییر دهند؛ [داک‌کردن کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در زمان محلی `atHour` بازنشانی می‌کند؛ `idle` پس از `idleMinutes` بازنشانی می‌کند. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بیکاری از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویداد سیستمی مانند Heartbeat، بیدارباش‌های Cron، اعلان‌های اجرا و دفترداری Gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بیکار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های به‌ازای نوع (`direct`، `group`، `thread`). مقدار قدیمی `dm` به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. زمان اجرا همیشه از `"main"` برای سطل اصلی گفت‌وگوی مستقیم استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: بیشینه نوبت‌های پاسخ‌برگشتی بین عامل‌ها در تبادل‌های عامل‌به‌عامل (عدد صحیح، بازه: `0`-`20`، پیش‌فرض: `5`). مقدار `0` زنجیره‌سازی پینگ‌پنگ را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix` یا `rawKeyPrefix`. نخستین منع برنده می‌شود.
- **`maintenance`**: کنترل‌های پاک‌سازی + نگه‌داری مخزن نشست.
  - `mode`: مقدار `enforce` پاک‌سازی را اعمال می‌کند و پیش‌فرض است؛ `warn` فقط هشدارها را منتشر می‌کند.
  - `pruneAfter`: حد سنی برای مدخل‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: بیشینه تعداد مدخل‌ها در `sessions.json` (پیش‌فرض `500`). زمان اجرا پاک‌سازی دسته‌ای را با یک بافر کوچک سطح بالا برای سقف‌های در اندازه تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را بی‌درنگ اعمال می‌کند.
  - نشست‌های کوتاه‌عمر کاوش اجرای مدل Gateway از نگه‌داری ثابت `24h` استفاده می‌کنند، اما پاک‌سازی با فشار دروازه‌گذاری می‌شود: فقط وقتی فشار نگه‌داری/سقف مدخل نشست به حد برسد، ردیف‌های کهنه کاوش اجرای مدل سخت‌گیرانه را حذف می‌کند. فقط کلیدهای کاوش صریح و سخت‌گیرانه مطابق `agent:*:explicit:model-run-<uuid>` واجد شرایط هستند؛ نشست‌های عادی مستقیم، گروه، رشته، Cron، قلاب، Heartbeat، ACP و زیرعامل این نگه‌داری ۲۴ ساعته را به ارث نمی‌برند. وقتی پاک‌سازی اجرای مدل اجرا شود، پیش از پاک‌سازی گسترده‌تر مدخل‌های کهنه `pruneAfter` و سقف `maxEntries` اجرا می‌شود.
  - `rotateBytes`: منسوخ است و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگه‌داری برای آرشیوهای رونوشت `*.reset.<timestamp>`. پیش‌فرض آن `pruneAfter` است؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
  - `maxDiskBytes`: بودجه اختیاری دیسک برای پوشه نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین مصنوعات/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض آن `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های نشست وابسته به رشته.
  - `enabled`: کلید پیش‌فرض اصلی؛ ارائه‌دهندگان می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند
  - `idleHours`: عدم‌تمرکز خودکار پیش‌فرض در اثر بی‌فعالیتی، بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `maxAgeHours`: بیشینه سن سخت پیش‌فرض، بر حسب ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازه پیش‌فرض برای ساخت نشست‌های کاری وابسته به رشته از `sessions_spawn` و ایجاد رشته ACP. وقتی اتصال‌های رشته فعال باشند، پیش‌فرض آن `true` است؛ ارائه‌دهندگان/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینه زیرعامل بومی پیش‌فرض برای ایجادهای وابسته به رشته (`"fork"` یا `"isolated"`). پیش‌فرض آن `"fork"` است.

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

بازنویسی‌های به‌ازای کانال/حساب: `channels.<channel>.responsePrefix`، `channels.<channel>.accounts.<id>.responsePrefix`.

حل‌وفصل (خاص‌ترین برنده می‌شود): حساب → کانال → سراسری. `""` غیرفعال می‌کند و زنجیره را متوقف می‌کند. `"auto"` مقدار `[{identity.name}]` را استخراج می‌کند.

**متغیرهای قالب:**

| متغیر             | توضیح                 | مثال                        |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل         | `claude-opus-4-6`           |
| `{modelFull}`     | شناسه کامل مدل        | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده       | `anthropic`                 |
| `{thinkingLevel}` | سطح تفکر فعلی         | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل         | (همانند `"auto"`)           |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- پیش‌فرض آن `identity.emoji` عامل فعال است، وگرنه `"👀"`. برای غیرفعال‌سازی روی `""` تنظیم کنید.
- بازنویسی‌های به‌ازای کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل‌وفصل: حساب → کانال → `messages.ackReaction` → بازگشت به هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: پس از پاسخ، تأیید را در کانال‌های دارای قابلیت واکنش مانند Slack، Discord، Telegram، WhatsApp و iMessage حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخه‌عمر را در Slack، Discord، Telegram و WhatsApp فعال می‌کند.
  در Slack و Discord، مقدار تنظیم‌نشده وقتی واکنش‌های تأیید فعال باشند واکنش‌های وضعیت را فعال نگه می‌دارد.
  در Telegram و WhatsApp، برای فعال‌سازی واکنش‌های وضعیت چرخه‌عمر، آن را صراحتاً روی `true` تنظیم کنید.
- `messages.statusReactions.emojis`: کلیدهای ایموجی چرخه‌عمر را بازنویسی می‌کند:
  `queued`، `thinking`، `compacting`، `tool`، `coding`، `web`، `deploy`، `build`،
  `concierge`، `done`، `error`، `stallSoft` و `stallHard`.
  Telegram فقط یک مجموعه واکنش ثابت را مجاز می‌داند، بنابراین ایموجی پیکربندی‌شده پشتیبانی‌نشده
  به نزدیک‌ترین گونه وضعیت پشتیبانی‌شده برای آن گفت‌وگو بازمی‌گردد.

### debounce ورودی

پیام‌های سریع و فقط متنی از یک فرستنده را در یک نوبت عامل واحد دسته‌بندی می‌کند. رسانه/پیوست‌ها بی‌درنگ تخلیه می‌شوند. فرمان‌های کنترلی debounce را دور می‌زنند.

### TTS (متن به گفتار)

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

- `auto` حالت پیش‌فرض auto-TTS را کنترل می‌کند: `off`، `always`، `inbound`، یا `tagged`. `/tts on|off` می‌تواند ترجیحات محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصه‌سازی خودکار بازنویسی می‌کند.
- `modelOverrides` به‌طور پیش‌فرض فعال است؛ مقدار پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند opt-in).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` بازمی‌گردند.
- ارائه‌دهندگان گفتار همراه، در مالکیت plugin هستند. اگر `plugins.allow` تنظیم شده است، هر plugin ارائه‌دهنده TTS را که می‌خواهید استفاده کنید اضافه کنید، برای مثال `microsoft` برای Edge TTS. شناسه ارائه‌دهنده قدیمی `edge` به‌عنوان نام مستعار برای `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطه پایانی OpenAI TTS را بازنویسی می‌کند. ترتیب تفکیک این است: config، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1`.
- وقتی `providers.openai.baseUrl` به یک نقطه پایانی غیر OpenAI اشاره می‌کند، OpenClaw آن را به‌عنوان یک سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌گیرانه‌تر می‌کند.

---

## گفتگو

پیش‌فرض‌های حالت Talk (macOS/iOS/Android).

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

- وقتی چند ارائه‌دهنده Talk پیکربندی شده‌اند، `talk.provider` باید با یکی از کلیدهای `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی Talk (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند. برای بازنویسی config ذخیره‌شده به `talk.providers.<provider>`، `openclaw doctor --fix` را اجرا کنید.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` بازمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- بازگشت به `ELEVENLABS_API_KEY` فقط زمانی اعمال می‌شود که هیچ کلید API برای Talk پیکربندی نشده باشد.
- `providers.*.voiceAliases` به دستورالعمل‌های Talk اجازه می‌دهد از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face مورد استفاده helper محلی MLX در macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS از طریق helper همراه `openclaw-mlx-tts`، در صورت وجود، یا یک فایل اجرایی در `PATH` اجرا می‌شود؛ `OPENCLAW_MLX_TTS_BIN` مسیر helper را برای توسعه بازنویسی می‌کند.
- `consultThinkingLevel` سطح تفکر را برای اجرای کامل عامل OpenClaw پشت تماس‌های Control UI Talk realtime `openclaw_agent_consult` کنترل می‌کند. برای حفظ رفتار عادی نشست/مدل، آن را تنظیم‌نشده بگذارید.
- `consultFastMode` برای consultهای Control UI Talk realtime، بدون تغییر تنظیم عادی fast-mode نشست، یک بازنویسی یک‌باره fast-mode تنظیم می‌کند.
- `speechLocale` شناسه locale در قالب BCP 47 را تنظیم می‌کند که توسط تشخیص گفتار Talk در iOS/macOS استفاده می‌شود. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت Talk پس از سکوت کاربر چه مدت منتظر بماند پیش از آنکه transcript را ارسال کند. تنظیم‌نشده بودن، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` دستورالعمل‌های سیستمی روبه‌ارائه‌دهنده را به prompt بی‌درنگ داخلی OpenClaw اضافه می‌کند، بنابراین سبک صدا را می‌توان بدون از دست دادن راهنمایی پیش‌فرض `openclaw_agent_consult` پیکربندی کرد.
- `realtime.consultRouting` بازگشت relay مربوط به Gateway را کنترل می‌کند وقتی ارائه‌دهنده بی‌درنگ یک transcript نهایی کاربر را بدون `openclaw_agent_consult` تولید می‌کند: `provider-direct` پاسخ‌های مستقیم ارائه‌دهنده را حفظ می‌کند، در حالی که `force-agent-consult` درخواست نهایی‌شده را از طریق OpenClaw مسیریابی می‌کند.

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همه کلیدهای config دیگر
- [پیکربندی](/fa/gateway/configuration) — وظایف رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
