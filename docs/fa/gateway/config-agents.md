---
read_when:
    - تنظیم پیش‌فرض‌های عامل (مدل‌ها، تفکر، فضای کاری، Heartbeat، رسانه، Skills)
    - پیکربندی مسیریابی و اتصال‌های چندعامله
    - تنظیم رفتار نشست، تحویل پیام و حالت گفت‌وگو
summary: پیش‌فرض‌های عامل، مسیریابی چندعاملی، نشست، پیام‌ها و پیکربندی گفت‌وگو
title: پیکربندی — عامل‌ها
x-i18n:
    generated_at: "2026-05-12T23:30:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08ddc1b36f4b9408ebaa5f071693b1c1333cedc9b00f75df93f12e73081e1033
    source_path: gateway/config-agents.md
    workflow: 16
---

کلیدهای پیکربندی در محدودهٔ عامل زیر `agents.*`، `multiAgent.*`، `session.*`،
`messages.*` و `talk.*`. برای کانال‌ها، ابزارها، runtime مربوط به Gateway و سایر
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

ریشهٔ اختیاری مخزن که در خط Runtime پرامپت سیستم نمایش داده می‌شود. اگر تنظیم نشود، OpenClaw با حرکت رو به بالا از فضای کاری آن را به‌صورت خودکار تشخیص می‌دهد.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

فهرست مجاز پیش‌فرض و اختیاری Skills برای عامل‌هایی که
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
- فهرست غیرخالی `agents.list[].skills` مجموعهٔ نهایی برای آن عامل است؛ با پیش‌فرض‌ها
  ادغام نمی‌شود.

### `agents.defaults.skipBootstrap`

ایجاد خودکار فایل‌های بوت‌استرپ فضای کاری (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`) را غیرفعال می‌کند.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ایجاد فایل‌های اختیاری انتخاب‌شدهٔ فضای کاری را رد می‌کند، در حالی که همچنان فایل‌های بوت‌استرپ الزامی نوشته می‌شوند. مقدارهای معتبر: `SOUL.md`، `USER.md`، `HEARTBEAT.md` و `IDENTITY.md`.

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

کنترل می‌کند فایل‌های بوت‌استرپ فضای کاری چه زمانی به پرامپت سیستم تزریق شوند. پیش‌فرض: `"always"`.

- `"continuation-skip"`: نوبت‌های ادامهٔ امن (پس از پاسخ تکمیل‌شدهٔ assistant) تزریق دوبارهٔ بوت‌استرپ فضای کاری را رد می‌کنند و اندازهٔ پرامپت را کاهش می‌دهند. اجرای Heartbeat و تلاش‌های دوبارهٔ پس از Compaction همچنان context را دوباره می‌سازند.
- `"never"`: تزریق بوت‌استرپ فضای کاری و فایل‌های context را در هر نوبت غیرفعال می‌کند. این را فقط برای عامل‌هایی استفاده کنید که چرخهٔ عمر پرامپت خود را کاملاً مالک هستند (موتورهای context سفارشی، runtimeهای بومی که context خود را می‌سازند، یا workflowهای تخصصی بدون بوت‌استرپ). نوبت‌های Heartbeat و بازیابی از Compaction نیز تزریق را رد می‌کنند.

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

حداکثر مجموع نویسه‌های تزریق‌شده در همهٔ فایل‌های بوت‌استرپ فضای کاری. پیش‌فرض: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

اعلان قابل مشاهده برای عامل در پرامپت سیستم را هنگام کوتاه شدن context بوت‌استرپ کنترل می‌کند.
پیش‌فرض: `"once"`.

- `"off"`: هرگز متن اعلان کوتاه‌سازی را به پرامپت سیستم تزریق نکن.
- `"once"`: برای هر امضای کوتاه‌سازی یکتا، یک بار اعلان کوتاه تزریق کن (توصیه‌شده).
- `"always"`: هر بار که کوتاه‌سازی وجود دارد، در هر اجرا یک اعلان کوتاه تزریق کن.

شمارش‌های خام/تزریق‌شدهٔ دقیق و فیلدهای تنظیم پیکربندی در diagnostics مانند
گزارش‌های context/status و لاگ‌ها باقی می‌مانند؛ context معمول کاربر/runtime در WebChat فقط
اعلان کوتاه بازیابی را دریافت می‌کند.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### نقشهٔ مالکیت بودجهٔ context

OpenClaw چندین بودجهٔ حجیم برای پرامپت/context دارد و آن‌ها
عمداً به‌جای عبور همگی از یک knob عمومی، بر اساس زیرسیستم جدا شده‌اند.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  تزریق معمول بوت‌استرپ فضای کاری.
- `agents.defaults.startupContext.*`:
  مقدمهٔ یک‌بارهٔ اجرای مدل هنگام reset/startup، شامل فایل‌های روزانهٔ اخیر
  `memory/*.md`. فرمان‌های سادهٔ chat یعنی `/new` و `/reset`
  بدون فراخوانی مدل تأیید می‌شوند.
- `skills.limits.*`:
  فهرست فشردهٔ Skills که به پرامپت سیستم تزریق می‌شود.
- `agents.defaults.contextLimits.*`:
  excerptهای runtime محدود و بلوک‌های تزریق‌شدهٔ متعلق به runtime.
- `memory.qmd.limits.*`:
  sizing مربوط به snippet جست‌وجوی حافظهٔ indexشده و تزریق.

فقط وقتی یک عامل به بودجه‌ای متفاوت نیاز دارد، override متناظر در سطح عامل را استفاده کنید:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

مقدمهٔ startup نوبت اول را که در اجرای مدل هنگام reset/startup تزریق می‌شود کنترل می‌کند.
فرمان‌های سادهٔ chat یعنی `/new` و `/reset` بدون فراخوانی مدل reset را تأیید می‌کنند،
بنابراین این مقدمه را load نمی‌کنند.

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

پیش‌فرض‌های مشترک برای سطح‌های context runtime محدود.

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

- `memoryGetMaxChars`: سقف پیش‌فرض excerpt در `memory_get` پیش از افزودن
  metadata کوتاه‌سازی و اعلان ادامه.
- `memoryGetDefaultLines`: پنجرهٔ خط پیش‌فرض `memory_get` وقتی `lines` حذف شده باشد.
- `toolResultMaxChars`: سقف live نتیجهٔ ابزار که برای نتایج persisted و
  بازیابی overflow استفاده می‌شود.
- `postCompactionMaxChars`: سقف excerpt مربوط به AGENTS.md که هنگام تزریق refresh
  پس از Compaction استفاده می‌شود.

#### `agents.list[].contextLimits`

override در سطح عامل برای knobهای مشترک `contextLimits`. فیلدهای حذف‌شده از
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

سقف سراسری برای فهرست فشردهٔ Skills که به پرامپت سیستم تزریق می‌شود. این
خواندن فایل‌های `SKILL.md` را به‌صورت درخواستی تحت تأثیر قرار نمی‌دهد.

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

override در سطح عامل برای بودجهٔ پرامپت Skills.

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

حداکثر اندازهٔ پیکسل برای بلندترین ضلع تصویر در بلوک‌های تصویر transcript/tool پیش از فراخوانی provider.
پیش‌فرض: `1200`.

مقادیر پایین‌تر معمولاً مصرف vision-token و اندازهٔ payload درخواست را برای اجراهای سنگین از نظر screenshot کاهش می‌دهند.
مقادیر بالاتر جزئیات بصری بیشتری را حفظ می‌کنند.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
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
  - شکل رشته‌ای فقط مدل اصلی را تنظیم می‌کند.
  - شکل شیء، مدل اصلی را به‌همراه مدل‌های جایگزینِ مرتب‌شده برای failover تنظیم می‌کند.
- `imageModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط مسیر ابزار `image` به‌عنوان پیکربندی مدل بینایی آن استفاده می‌شود.
  - همچنین وقتی مدل انتخاب‌شده/پیش‌فرض نتواند ورودی تصویر را بپذیرد، برای مسیریابی جایگزین استفاده می‌شود.
  - ارجاع‌های صریح `provider/model` را ترجیح دهید. شناسه‌های خام برای سازگاری پذیرفته می‌شوند؛ اگر یک شناسه خام به‌طور یکتا با یک ورودی پیکربندی‌شده دارای قابلیت تصویر در `models.providers.*.models` تطبیق داشته باشد، OpenClaw آن را به همان ارائه‌دهنده منتسب می‌کند. تطبیق‌های پیکربندی‌شده مبهم به یک پیشوند ارائه‌دهنده صریح نیاز دارند.
- `imageGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید تصویر و هر سطح ابزار/Plugin آینده که تصویر تولید می‌کند استفاده می‌شود.
  - مقدارهای رایج: `google/gemini-3.1-flash-image-preview` برای تولید تصویر بومی Gemini،‏ `fal/fal-ai/flux/dev` برای fal،‏ `openai/gpt-image-2` برای OpenAI Images، یا `openai/gpt-image-1.5` برای خروجی PNG/WebP با پس‌زمینه شفاف از OpenAI.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت ارائه‌دهنده متناظر را هم پیکربندی کنید (برای مثال `GEMINI_API_KEY` یا `GOOGLE_API_KEY` برای `google/*`،‏ `OPENAI_API_KEY` یا OpenAI Codex OAuth برای `openai/gpt-image-2` / `openai/gpt-image-1.5`،‏ `FAL_KEY` برای `fal/*`).
  - اگر حذف شود، `image_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده مبتنی بر احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهنده‌های ثبت‌شده تولید تصویر را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
- `musicGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید موسیقی و ابزار داخلی `music_generate` استفاده می‌شود.
  - مقدارهای رایج: `google/lyria-3-clip-preview`،‏ `google/lyria-3-pro-preview`، یا `minimax/music-2.6`.
  - اگر حذف شود، `music_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده مبتنی بر احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهنده‌های ثبت‌شده تولید موسیقی را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
- `videoGenerationModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط قابلیت مشترک تولید ویدیو و ابزار داخلی `video_generate` استفاده می‌شود.
  - مقدارهای رایج: `qwen/wan2.6-t2v`،‏ `qwen/wan2.6-i2v`،‏ `qwen/wan2.6-r2v`،‏ `qwen/wan2.6-r2v-flash`، یا `qwen/wan2.7-r2v`.
  - اگر حذف شود، `video_generate` همچنان می‌تواند یک پیش‌فرض ارائه‌دهنده مبتنی بر احراز هویت را استنباط کند. ابتدا ارائه‌دهنده پیش‌فرض فعلی را امتحان می‌کند، سپس باقی ارائه‌دهنده‌های ثبت‌شده تولید ویدیو را به ترتیب شناسه ارائه‌دهنده امتحان می‌کند.
  - اگر مستقیماً یک ارائه‌دهنده/مدل را انتخاب می‌کنید، احراز هویت/کلید API ارائه‌دهنده متناظر را هم پیکربندی کنید.
  - ارائه‌دهنده همراه تولید ویدیوی Qwen تا ۱ ویدیوی خروجی، ۱ تصویر ورودی، ۴ ویدیوی ورودی، مدت ۱۰ ثانیه، و گزینه‌های سطح ارائه‌دهنده `size`،‏ `aspectRatio`،‏ `resolution`،‏ `audio`، و `watermark` را پشتیبانی می‌کند.
- `pdfModel`: یا یک رشته (`"provider/model"`) یا یک شیء (`{ primary, fallbacks }`) را می‌پذیرد.
  - توسط ابزار `pdf` برای مسیریابی مدل استفاده می‌شود.
  - اگر حذف شود، ابزار PDF ابتدا به `imageModel` و سپس به مدل حل‌شده نشست/پیش‌فرض برمی‌گردد.
- `pdfMaxBytesMb`: محدودیت اندازه PDF پیش‌فرض برای ابزار `pdf` وقتی `maxBytesMb` در زمان فراخوانی ارسال نشده باشد.
- `pdfMaxPages`: حداکثر صفحات پیش‌فرض که در حالت جایگزین استخراج در ابزار `pdf` در نظر گرفته می‌شوند.
- `verboseDefault`: سطح verbose پیش‌فرض برای agentها. مقدارها: `"off"`،‏ `"on"`،‏ `"full"`. پیش‌فرض: `"off"`.
- `toolProgressDetail`: حالت جزئیات برای خلاصه‌های ابزار `/verbose` و خطوط ابزار پیش‌نویس پیشرفت. مقدارها: `"explain"` (پیش‌فرض، برچسب‌های انسانی فشرده) یا `"raw"` (افزودن فرمان/جزئیات خام وقتی در دسترس باشد). مقدار `agents.list[].toolProgressDetail` برای هر agent این پیش‌فرض را بازنویسی می‌کند.
- `reasoningDefault`: نمایانی reasoning پیش‌فرض برای agentها. مقدارها: `"off"`،‏ `"on"`،‏ `"stream"`. مقدار `agents.list[].reasoningDefault` برای هر agent این پیش‌فرض را بازنویسی می‌کند. پیش‌فرض‌های reasoning پیکربندی‌شده فقط برای مالکان، فرستنده‌های مجاز، یا زمینه‌های Gateway مدیر-اپراتور اعمال می‌شوند، آن هم وقتی هیچ بازنویسی reasoning در سطح پیام یا نشست تنظیم نشده باشد.
- `elevatedDefault`: سطح خروجی elevated پیش‌فرض برای agentها. مقدارها: `"off"`،‏ `"on"`،‏ `"ask"`،‏ `"full"`. پیش‌فرض: `"on"`.
- `model.primary`: قالب `provider/model` (برای مثال `openai/gpt-5.5` برای دسترسی با کلید API یا Codex OAuth از OpenAI). اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا یک alias را امتحان می‌کند، سپس تطبیق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه مدل دقیق را، و فقط بعد از آن به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد (رفتار سازگاری منسوخ، بنابراین `provider/model` صریح را ترجیح دهید). اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw به‌جای نمایش یک پیش‌فرض قدیمیِ ارائه‌دهنده حذف‌شده، به نخستین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
- `models`: کاتالوگ مدل پیکربندی‌شده و allowlist برای `/model`. هر ورودی می‌تواند شامل `alias` (میان‌بر) و `params` (ویژه ارائه‌دهنده، برای مثال `temperature`،‏ `maxTokens`،‏ `cacheRetention`،‏ `context1m`،‏ `responsesServerCompaction`،‏ `responsesCompactThreshold`،‏ `chat_template_kwargs`،‏ `extra_body`/`extraBody`) باشد.
  - از ورودی‌های `provider/*` مانند `"openai-codex/*": {}` یا `"vllm/*": {}` استفاده کنید تا همه مدل‌های کشف‌شده برای ارائه‌دهنده‌های انتخاب‌شده بدون فهرست‌کردن دستی هر شناسه مدل نمایش داده شوند.
  - ویرایش‌های ایمن: برای افزودن ورودی‌ها از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌هایی را که باعث حذف ورودی‌های allowlist موجود شوند رد می‌کند، مگر اینکه `--replace` را ارسال کنید.
  - جریان‌های configure/onboarding محدود به ارائه‌دهنده، مدل‌های ارائه‌دهنده انتخاب‌شده را در این map ادغام می‌کنند و ارائه‌دهنده‌های نامرتبطی را که از قبل پیکربندی شده‌اند حفظ می‌کنند.
  - برای مدل‌های مستقیم OpenAI Responses،‏ Compaction سمت سرور به‌طور خودکار فعال می‌شود. برای توقف تزریق `context_management` از `params.responsesServerCompaction: false` استفاده کنید، یا برای بازنویسی آستانه از `params.responsesCompactThreshold` استفاده کنید. به [Compaction سمت سرور OpenAI](/fa/providers/openai#server-side-compaction-responses-api) مراجعه کنید.
- `params`: پارامترهای سراسری پیش‌فرض ارائه‌دهنده که روی همه مدل‌ها اعمال می‌شوند. در `agents.defaults.params` تنظیم می‌شود (برای مثال `{ cacheRetention: "long" }`).
- تقدم ادغام `params` (پیکربندی): `agents.defaults.params` (پایه سراسری) توسط `agents.defaults.models["provider/model"].params` (برای هر مدل) بازنویسی می‌شود، سپس `agents.list[].params` (شناسه agent مطابق) بر اساس کلید بازنویسی می‌کند. برای جزئیات به [کش‌کردن پرامپت](/fa/reference/prompt-caching) مراجعه کنید.
- `params.extra_body`/`params.extraBody`: JSON پیشرفته pass-through که در بدنه‌های درخواست `api: "openai-completions"` برای پروکسی‌های سازگار با OpenAI ادغام می‌شود. اگر با کلیدهای درخواست تولیدشده تداخل داشته باشد، بدنه اضافی برنده است؛ مسیرهای completions غیربومی همچنان بعداً `store` مخصوص OpenAI را حذف می‌کنند.
- `params.chat_template_kwargs`: آرگومان‌های chat-template سازگار با vLLM/OpenAI که در بدنه‌های درخواست سطح بالای `api: "openai-completions"` ادغام می‌شوند. برای `vllm/nemotron-3-*` با thinking خاموش، Plugin همراه vLLM به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند؛ `chat_template_kwargs` صریح، پیش‌فرض‌های تولیدشده را بازنویسی می‌کند، و `extra_body.chat_template_kwargs` همچنان تقدم نهایی دارد. برای کنترل‌های thinking در vLLM Qwen، مقدار `params.qwenThinkingFormat` را روی `"chat-template"` یا `"top-level"` در همان ورودی مدل تنظیم کنید.
- `compat.thinkingFormat`: سبک payload برای thinking سازگار با OpenAI. برای `enable_thinking` سطح بالای سبک Qwen از `"qwen"` استفاده کنید، یا برای `chat_template_kwargs.enable_thinking` روی backendهای خانواده Qwen که kwargs سطح درخواست برای chat-template را پشتیبانی می‌کنند، مانند vLLM، از `"qwen-chat-template"` استفاده کنید. OpenClaw، thinking غیرفعال را به `false` و thinking فعال را به `true` نگاشت می‌کند.
- `compat.supportedReasoningEfforts`: فهرست reasoning effort سازگار با OpenAI برای هر مدل. برای endpointهای سفارشی که واقعاً آن را می‌پذیرند، `"xhigh"` را اضافه کنید؛ سپس OpenClaw دستور `/think xhigh` را در منوهای فرمان، ردیف‌های نشست Gateway، اعتبارسنجی patch نشست، اعتبارسنجی agent CLI، و اعتبارسنجی `llm-task` برای آن ارائه‌دهنده/مدل پیکربندی‌شده نمایش می‌دهد. وقتی backend برای یک سطح canonical مقدار ویژه ارائه‌دهنده می‌خواهد، از `compat.reasoningEffortMap` استفاده کنید.
- `params.preserveThinking`: گزینه opt-in فقط برای Z.AI جهت حفظ thinking. وقتی فعال باشد و thinking روشن باشد، OpenClaw مقدار `thinking.clear_thinking: false` را ارسال می‌کند و `reasoning_content` قبلی را بازپخش می‌کند؛ به [thinking و thinking حفظ‌شده در Z.AI](/fa/providers/zai#thinking-and-preserved-thinking) مراجعه کنید.
- `localService`: مدیر فرایند اختیاری در سطح ارائه‌دهنده برای سرورهای مدل محلی/خودمیزبان. وقتی مدل انتخاب‌شده متعلق به آن ارائه‌دهنده باشد، OpenClaw نشانی `healthUrl` (یا `baseUrl + "/models"`) را بررسی می‌کند، اگر endpoint پایین باشد `command` را با `args` شروع می‌کند، تا `readyTimeoutMs` منتظر می‌ماند، سپس درخواست مدل را ارسال می‌کند. `command` باید یک مسیر مطلق باشد. `idleStopMs: 0` فرایند را تا خروج OpenClaw زنده نگه می‌دارد؛ مقدار مثبت، فرایندی را که OpenClaw راه‌اندازی کرده پس از همان تعداد میلی‌ثانیه بیکاری متوقف می‌کند. به [سرویس‌های مدل محلی](/fa/gateway/local-model-services) مراجعه کنید.
- سیاست زمان اجرا روی ارائه‌دهنده‌ها یا مدل‌ها قرار می‌گیرد، نه روی `agents.defaults`. برای قواعد گسترده در سطح ارائه‌دهنده از `models.providers.<provider>.agentRuntime` استفاده کنید یا برای قواعد مخصوص مدل از `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` استفاده کنید. مدل‌های agent متعلق به OpenAI روی ارائه‌دهنده رسمی OpenAI به‌طور پیش‌فرض Codex را انتخاب می‌کنند.
- نویسندگان پیکربندی که این فیلدها را تغییر می‌دهند (برای مثال `/models set`،‏ `/models set-image`، و فرمان‌های افزودن/حذف جایگزین) شکل شیء canonical را ذخیره می‌کنند و در صورت امکان فهرست‌های جایگزین موجود را حفظ می‌کنند.
- `maxConcurrent`: حداکثر اجراهای موازی agent در سراسر نشست‌ها (هر نشست همچنان serialized است). پیش‌فرض: ۴.

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

- `id`:‏ `"auto"`،‏ `"pi"`، شناسه harness یک Plugin ثبت‌شده، یا یک alias پشتیبانی‌شده برای backend CLI. Plugin همراه Codex مقدار `codex` را ثبت می‌کند؛ Plugin همراه Anthropic،‏ backend CLI به نام `claude-cli` را فراهم می‌کند.
- `id: "auto"` به harnessهای Plugin ثبت‌شده اجازه می‌دهد turnهای پشتیبانی‌شده را claim کنند و وقتی هیچ harness مطابقی نباشد از PI استفاده می‌کند. یک runtime صریح Plugin مانند `id: "codex"` به همان harness نیاز دارد و اگر در دسترس نباشد یا شکست بخورد، به‌صورت بسته fail می‌کند.
- کلیدهای runtime در سطح کل agent میراثی هستند. `agents.defaults.agentRuntime`،‏ `agents.list[].agentRuntime`،‏ pinهای runtime نشست، و `OPENCLAW_AGENT_RUNTIME` توسط انتخاب runtime نادیده گرفته می‌شوند. برای حذف مقدارهای قدیمی `openclaw doctor --fix` را اجرا کنید.
- مدل‌های agent متعلق به OpenAI به‌طور پیش‌فرض از harness مربوط به Codex استفاده می‌کنند؛ وقتی می‌خواهید این موضوع را صریح کنید، `agentRuntime.id: "codex"` در سطح ارائه‌دهنده/مدل همچنان معتبر است.
- برای استقرارهای Claude CLI، مقدار `model: "anthropic/claude-opus-4-7"` به‌همراه `agentRuntime.id: "claude-cli"` محدود به مدل را ترجیح دهید. ارجاع‌های مدل میراثی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را canonical نگه دارد و backend اجرا را در سیاست runtime ارائه‌دهنده/مدل قرار دهد.
- این فقط اجرای turnهای agent متنی را کنترل می‌کند. تولید رسانه، بینایی، PDF، موسیقی، ویدیو، و TTS همچنان از تنظیمات ارائه‌دهنده/مدل خود استفاده می‌کنند.

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

نام‌های مستعار پیکربندی‌شدهٔ شما همیشه بر پیش‌فرض‌ها اولویت دارند.

مدل‌های Z.AI GLM-4.x به‌طور خودکار حالت تفکر را فعال می‌کنند، مگر این‌که `--thinking off` را تنظیم کنید یا خودتان `agents.defaults.models["zai/<model>"].params.thinking` را تعریف کنید.
مدل‌های Z.AI به‌طور پیش‌فرض `tool_stream` را برای جریان‌دهی فراخوانی ابزار فعال می‌کنند. برای غیرفعال کردن آن، `agents.defaults.models["zai/<model>"].params.tool_stream` را روی `false` تنظیم کنید.
مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

### `agents.defaults.cliBackends`

پشتوانه‌های CLI اختیاری برای اجراهای جایگزینِ فقط‌متنی (بدون فراخوانی ابزار). زمانی مفید است که ارائه‌دهندگان API از کار بیفتند.

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

- پشتوانه‌های CLI متن‌محور هستند؛ ابزارها همیشه غیرفعال‌اند.
- وقتی `sessionArg` تنظیم شده باشد، نشست‌ها پشتیبانی می‌شوند.
- وقتی `imageArg` مسیر فایل‌ها را بپذیرد، عبوردهی تصویر پشتیبانی می‌شود.
- `reseedFromRawTranscriptWhenUncompacted: true` به یک پشتوانه اجازه می‌دهد پیش از آن‌که نخستین خلاصهٔ Compaction وجود داشته باشد، نشست‌های نامعتبرشدهٔ امن را از دنبالهٔ محدودِ رونوشت خام OpenClaw بازیابی کند. تغییرات نمایهٔ احراز هویت یا دورهٔ اعتبارنامه همچنان هرگز بازبذرگذاری خام انجام نمی‌دهند.

### `agents.defaults.systemPromptOverride`

کل پرامپت سیستمیِ ساخته‌شده توسط OpenClaw را با یک رشتهٔ ثابت جایگزین می‌کند. در سطح پیش‌فرض (`agents.defaults.systemPromptOverride`) یا برای هر عامل (`agents.list[].systemPromptOverride`) تنظیم کنید. مقدارهای هر عامل اولویت دارند؛ مقدار خالی یا فقط شامل فاصله نادیده گرفته می‌شود. برای آزمایش‌های کنترل‌شدهٔ پرامپت مفید است.

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

پوشش‌های پرامپت مستقل از ارائه‌دهنده که بر اساس خانوادهٔ مدل اعمال می‌شوند. شناسه‌های مدل خانوادهٔ GPT-5 قرارداد رفتار مشترک را در میان ارائه‌دهندگان دریافت می‌کنند؛ `personality` فقط لایهٔ سبک تعامل دوستانه را کنترل می‌کند.

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
- `"off"` فقط لایهٔ دوستانه را غیرفعال می‌کند؛ قرارداد رفتار GPT-5 برچسب‌خورده همچنان فعال می‌ماند.
- `plugins.entries.openai.config.personality` قدیمی همچنان وقتی این تنظیم مشترک تنظیم نشده باشد خوانده می‌شود.

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

- `every`: رشتهٔ مدت‌زمان (ms/s/m/h). پیش‌فرض: `30m` (احراز هویت با کلید API) یا `1h` (احراز هویت OAuth). برای غیرفعال کردن، روی `0m` تنظیم کنید.
- `includeSystemPromptSection`: وقتی false باشد، بخش Heartbeat را از پرامپت سیستمی حذف می‌کند و تزریق `HEARTBEAT.md` به زمینهٔ بوت‌استرپ را نادیده می‌گیرد. پیش‌فرض: `true`.
- `suppressToolErrorWarnings`: وقتی true باشد، payloadهای هشدار خطای ابزار را هنگام اجراهای Heartbeat سرکوب می‌کند.
- `timeoutSeconds`: بیشترین زمان مجاز بر حسب ثانیه برای یک نوبت عامل Heartbeat پیش از لغو شدن آن. برای استفاده از `agents.defaults.timeoutSeconds` تنظیم‌نشده رها کنید.
- `directPolicy`: سیاست تحویل مستقیم/DM. `allow` (پیش‌فرض) تحویل به مقصد مستقیم را مجاز می‌کند. `block` تحویل به مقصد مستقیم را سرکوب می‌کند و `reason=dm-blocked` را منتشر می‌کند.
- `lightContext`: وقتی true باشد، اجراهای Heartbeat از زمینهٔ بوت‌استرپ سبک استفاده می‌کنند و از فایل‌های بوت‌استرپ فضای کاری فقط `HEARTBEAT.md` را نگه می‌دارند.
- `isolatedSession`: وقتی true باشد، هر Heartbeat در یک نشست تازه و بدون تاریخچهٔ گفت‌وگوی قبلی اجرا می‌شود. همان الگوی جداسازی Cron با `sessionTarget: "isolated"`. هزینهٔ توکن هر Heartbeat را از حدود 100K به حدود 2-5K توکن کاهش می‌دهد.
- `skipWhenBusy`: وقتی true باشد، اجراهای Heartbeat در مسیرهای مشغول اضافی آن عامل به تعویق می‌افتند: کار subagent کلیدخورده با نشست خودش یا کار فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم.
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
- `provider`: شناسهٔ یک Plugin ارائه‌دهندهٔ Compaction ثبت‌شده. وقتی تنظیم شود، به‌جای خلاصه‌سازی LLM داخلی، `summarize()` آن ارائه‌دهنده فراخوانی می‌شود. در صورت شکست، به حالت داخلی برمی‌گردد. تنظیم ارائه‌دهنده، `mode: "safeguard"` را اجباری می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
- `timeoutSeconds`: بیشترین ثانیه‌های مجاز برای یک عملیات Compaction پیش از آن‌که OpenClaw آن را لغو کند. پیش‌فرض: `900`.
- `keepRecentTokens`: بودجهٔ نقطهٔ برش Pi برای نگه‌داشتن دنبالهٔ اخیر رونوشت به‌صورت کلمه‌به‌کلمه. `/compact` دستی وقتی صریحاً تنظیم شده باشد از این مقدار پیروی می‌کند؛ در غیر این صورت Compaction دستی یک نقطهٔ بازرسی سخت است.
- `identifierPolicy`: `strict` (پیش‌فرض)، `off`، یا `custom`. `strict` هنگام خلاصه‌سازی Compaction، راهنمای داخلی برای حفظ شناسه‌های مات را در ابتدا اضافه می‌کند.
- `identifierInstructions`: متن سفارشی اختیاری برای حفظ شناسه‌ها که وقتی `identifierPolicy=custom` باشد استفاده می‌شود.
- `qualityGuard`: بررسی‌های تلاش دوباره هنگام خروجی بدشکل برای خلاصه‌های safeguard. در حالت safeguard به‌طور پیش‌فرض فعال است؛ برای رد کردن ممیزی، `enabled: false` را تنظیم کنید.
- `midTurnPrecheck`: بررسی اختیاری فشار حلقهٔ ابزار Pi. وقتی `enabled: true` باشد، OpenClaw پس از افزوده شدن نتایج ابزار و پیش از فراخوانی بعدی مدل، فشار زمینه را بررسی می‌کند. اگر زمینه دیگر جا نشود، تلاش جاری را پیش از ارسال پرامپت لغو می‌کند و از مسیر بازیابی precheck موجود برای کوتاه‌سازی نتایج ابزار یا Compaction و تلاش دوباره استفاده می‌کند. با هر دو حالت Compaction یعنی `default` و `safeguard` کار می‌کند. پیش‌فرض: غیرفعال.
- `postCompactionSections`: نام‌های اختیاری بخش AGENTS.md H2/H3 برای تزریق دوباره پس از Compaction. پیش‌فرض `["Session Startup", "Red Lines"]` است؛ برای غیرفعال کردن تزریق دوباره، `[]` را تنظیم کنید. وقتی تنظیم نشده باشد یا صریحاً روی همان جفت پیش‌فرض تنظیم شود، عنوان‌های قدیمی‌تر `Every Session`/`Safety` نیز به‌عنوان جایگزین سازگاری پذیرفته می‌شوند.
- `model`: بازنویسی اختیاری `provider/model-id` فقط برای خلاصه‌سازی Compaction. زمانی از این استفاده کنید که نشست اصلی باید یک مدل را نگه دارد اما خلاصه‌های Compaction باید روی مدل دیگری اجرا شوند؛ وقتی تنظیم نشده باشد، Compaction از مدل اصلی نشست استفاده می‌کند.
- `maxActiveTranscriptBytes`: آستانهٔ بایتی اختیاری (`number` یا رشته‌هایی مثل `"20mb"`) که وقتی JSONL فعال از آستانه بزرگ‌تر شود، پیش از اجرا Compaction محلی عادی را فعال می‌کند. به `truncateAfterCompaction` نیاز دارد تا Compaction موفق بتواند به یک رونوشت جانشین کوچک‌تر بچرخد. وقتی تنظیم نشده باشد یا `0` باشد غیرفعال است.
- `notifyUser`: وقتی `true` باشد، هنگام شروع و تکمیل Compaction اعلان‌های کوتاهی به کاربر می‌فرستد (برای مثال، «در حال فشرده‌سازی زمینه...» و «Compaction کامل شد»). برای بی‌صدا نگه‌داشتن Compaction، به‌طور پیش‌فرض غیرفعال است.
- `memoryFlush`: نوبت عامل‌محور بی‌صدا پیش از Compaction خودکار برای ذخیرهٔ حافظه‌های پایدار. وقتی این نوبت نگه‌داری باید روی یک مدل محلی بماند، `model` را روی یک ارائه‌دهنده/مدل دقیق مانند `ollama/qwen3:8b` تنظیم کنید؛ این بازنویسی زنجیرهٔ fallback نشست فعال را به ارث نمی‌برد. وقتی فضای کاری فقط‌خواندنی باشد رد می‌شود.

### `agents.defaults.runRetries`

مرزهای تکرار تلاش دوبارهٔ حلقهٔ اجرای بیرونی برای اجراکنندهٔ Pi جاسازی‌شده، برای جلوگیری از حلقه‌های اجرای بی‌نهایت هنگام بازیابی از شکست. توجه کنید که این تنظیم در حال حاضر فقط برای runtime عامل جاسازی‌شده اعمال می‌شود، نه runtimeهای ACP یا CLI.

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

- `base`: تعداد پایهٔ تکرارهای تلاش دوبارهٔ اجرا برای حلقهٔ اجرای بیرونی. پیش‌فرض: `24`.
- `perProfile`: تکرارهای اضافی تلاش دوبارهٔ اجرا که به‌ازای هر نامزد نمایهٔ fallback اعطا می‌شود. پیش‌فرض: `8`.
- `min`: حد مطلق کمینه برای تکرارهای تلاش دوبارهٔ اجرا. پیش‌فرض: `32`.
- `max`: حد مطلق بیشینه برای تکرارهای تلاش دوبارهٔ اجرا برای جلوگیری از اجرای مهارنشده. پیش‌فرض: `160`.

### `agents.defaults.contextPruning`

**نتایج ابزار قدیمی** را پیش از ارسال به LLM از زمینهٔ درون‌حافظه‌ای هرس می‌کند. تاریخچهٔ نشست روی دیسک را **تغییر نمی‌دهد**.

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
- `ttl` کنترل می‌کند هرس هر چند وقت یک‌بار بتواند دوباره اجرا شود (پس از آخرین لمس کش).
- هرس ابتدا نتایج بیش‌ازحد بزرگ ابزار را نرم‌برش می‌دهد، سپس در صورت نیاز نتایج قدیمی‌تر ابزار را پاک‌سازی سخت می‌کند.

**نرم‌برش** ابتدا + انتها را نگه می‌دارد و `...` را در میانه درج می‌کند.

**پاک‌سازی سخت** کل نتیجهٔ ابزار را با جای‌نگهدار جایگزین می‌کند.

نکات:

- بلوک‌های تصویر هرگز برش/پاک‌سازی نمی‌شوند.
- نسبت‌ها بر پایهٔ نویسه هستند (تقریبی)، نه شمارش دقیق توکن‌ها.
- اگر کمتر از `keepLastAssistants` پیام دستیار وجود داشته باشد، هرس رد می‌شود.

</Accordion>

برای جزئیات رفتار، [هرس نشست](/fa/concepts/session-pruning) را ببینید.

### پخش جریانی بلوکی

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
- بازنویسی‌های کانال: `channels.<channel>.blockStreamingCoalesce` (و گونه‌های هر حساب). Signal/Slack/Discord/Google Chat به‌طور پیش‌فرض `minChars: 1500` دارند.
- `humanDelay`: مکث تصادفی بین پاسخ‌های بلوکی. `natural` = 800–2500ms. بازنویسی برای هر عامل: `agents.list[].humanDelay`.

برای جزئیات رفتار + قطعه‌بندی، [پخش جریانی](/fa/concepts/streaming) را ببینید.

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

سندباکس اختیاری برای عامل تعبیه‌شده. برای راهنمای کامل، [سندباکس‌سازی](/fa/gateway/sandboxing) را ببینید.

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

- `docker`: زمان‌اجرای محلی Docker (پیش‌فرض)
- `ssh`: زمان‌اجرای راه‌دور عمومی مبتنی بر SSH
- `openshell`: زمان‌اجرای OpenShell

وقتی `backend: "openshell"` انتخاب شود، تنظیمات ویژهٔ زمان‌اجرا به
`plugins.entries.openshell.config` منتقل می‌شوند.

**پیکربندی بک‌اند SSH:**

- `target`: مقصد SSH در قالب `user@host[:port]`
- `command`: فرمان کلاینت SSH (پیش‌فرض: `ssh`)
- `workspaceRoot`: ریشهٔ مطلق راه‌دور که برای فضاهای کاری هر دامنه استفاده می‌شود
- `identityFile` / `certificateFile` / `knownHostsFile`: فایل‌های محلی موجود که به OpenSSH داده می‌شوند
- `identityData` / `certificateData` / `knownHostsData`: محتواهای درون‌خطی یا SecretRefهایی که OpenClaw در زمان اجرا به فایل‌های موقت تبدیل می‌کند
- `strictHostKeyChecking` / `updateHostKeys`: کنترل‌های سیاست کلید میزبان OpenSSH

**اولویت احراز هویت SSH:**

- `identityData` بر `identityFile` اولویت دارد
- `certificateData` بر `certificateFile` اولویت دارد
- `knownHostsData` بر `knownHostsFile` اولویت دارد
- مقدارهای `*Data` مبتنی بر SecretRef پیش از شروع نشست سندباکس از اسنپ‌شات فعال زمان‌اجرای رازها حل می‌شوند

**رفتار بک‌اند SSH:**

- فضای کاری راه‌دور را پس از ایجاد یا ایجاد دوباره یک‌بار بذرگذاری می‌کند
- سپس فضای کاری SSH راه‌دور را مرجع نگه می‌دارد
- `exec`، ابزارهای فایل، و مسیرهای رسانه را از طریق SSH مسیریابی می‌کند
- تغییرات راه‌دور را به‌طور خودکار به میزبان همگام‌سازی نمی‌کند
- از کانتینرهای مرورگر سندباکس پشتیبانی نمی‌کند

**دسترسی فضای کاری:**

- `none`: فضای کاری سندباکس برای هر دامنه زیر `~/.openclaw/sandboxes`
- `ro`: فضای کاری سندباکس در `/workspace`، فضای کاری عامل به‌صورت فقط‌خواندنی در `/agent` سوار می‌شود
- `rw`: فضای کاری عامل به‌صورت خواندن/نوشتن در `/workspace` سوار می‌شود

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

- `mirror`: پیش از exec از محلی به راه‌دور بذرگذاری می‌کند، پس از exec همگام‌سازی برگشتی انجام می‌دهد؛ فضای کاری محلی مرجع می‌ماند
- `remote`: هنگام ایجاد سندباکس یک‌بار راه‌دور را بذرگذاری می‌کند، سپس فضای کاری راه‌دور را مرجع نگه می‌دارد

در حالت `remote`، ویرایش‌های محلی میزبان که بیرون از OpenClaw انجام می‌شوند، پس از مرحلهٔ بذرگذاری به‌طور خودکار به سندباکس همگام‌سازی نمی‌شوند.
انتقال از طریق SSH به سندباکس OpenShell انجام می‌شود، اما Plugin چرخهٔ عمر سندباکس و همگام‌سازی آینه‌ای اختیاری را مالک است.

**`setupCommand`** پس از ایجاد کانتینر یک‌بار اجرا می‌شود (از طریق `sh -lc`). به خروجی شبکه، ریشهٔ قابل‌نوشتن، و کاربر ریشه نیاز دارد.

**کانتینرها به‌طور پیش‌فرض `network: "none"` دارند** — اگر عامل به دسترسی خروجی نیاز دارد، آن را روی `"bridge"` (یا یک شبکهٔ bridge سفارشی) تنظیم کنید.
`"host"` مسدود است. `"container:<id>"` به‌طور پیش‌فرض مسدود است، مگر اینکه صراحتاً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` را تنظیم کنید (راه‌حل اضطراری).

**پیوست‌های ورودی** در `media/inbound/*` در فضای کاری فعال مرحله‌بندی می‌شوند.

**`docker.binds`** دایرکتوری‌های میزبان اضافی را سوار می‌کند؛ bindهای سراسری و هر عامل با هم ادغام می‌شوند.

**مرورگر سندباکس‌شده** (`sandbox.browser.enabled`): Chromium + CDP در یک کانتینر. URL noVNC به اعلان سیستم تزریق می‌شود. به `browser.enabled` در `openclaw.json` نیاز ندارد.
دسترسی ناظر noVNC به‌طور پیش‌فرض از احراز هویت VNC استفاده می‌کند و OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند (به‌جای افشای گذرواژه در URL مشترک).

- `allowHostControl: false` (پیش‌فرض) نشست‌های سندباکس‌شده را از هدف‌گرفتن مرورگر میزبان منع می‌کند.
- `network` به‌طور پیش‌فرض `openclaw-sandbox-browser` است (شبکهٔ bridge اختصاصی). فقط وقتی صراحتاً اتصال bridge سراسری می‌خواهید، آن را روی `bridge` تنظیم کنید.
- `cdpSourceRange` می‌تواند ورود CDP در لبهٔ کانتینر را به یک بازهٔ CIDR محدود کند (برای مثال `172.21.0.1/32`).
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
  - `--disable-extensions` (به‌طور پیش‌فرض فعال)
  - `--disable-3d-apis`، `--disable-software-rasterizer`، و `--disable-gpu`
    به‌طور پیش‌فرض فعال هستند و اگر استفاده از WebGL/3D آن را لازم داشته باشد، می‌توانند با
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` غیرفعال شوند.
  - اگر گردش‌کار شما به افزونه‌ها وابسته است، `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` آن‌ها را دوباره فعال می‌کند.
  - `--renderer-process-limit=2` را می‌توان با
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` تغییر داد؛ برای استفاده از محدودیت فرایند پیش‌فرض Chromium، `0` را تنظیم کنید.
  - به‌علاوهٔ `--no-sandbox` وقتی `noSandbox` فعال باشد.
  - پیش‌فرض‌ها خط مبنای تصویر کانتینر هستند؛ برای تغییر پیش‌فرض‌های کانتینر از یک تصویر مرورگر سفارشی با entrypoint سفارشی استفاده کنید.

</Accordion>

سندباکس‌سازی مرورگر و `sandbox.docker.binds` فقط مخصوص Docker هستند.

ساخت تصاویر (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build` به [سندباکس‌سازی § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

### `agents.list` (بازنویسی‌های هر عامل)

از `agents.list[].tts` برای دادن ارائه‌دهنده TTS، صدا، مدل، سبک، یا حالت TTS خودکار اختصاصی به یک عامل استفاده کنید. بلوک عامل روی `messages.tts` سراسری deep-merge می‌شود، بنابراین اعتبارنامه‌های مشترک می‌توانند در یک مکان بمانند، در حالی که عامل‌های جداگانه فقط فیلدهای صدا یا ارائه‌دهنده‌ای را که نیاز دارند override می‌کنند. override عامل فعال برای پاسخ‌های گفتاری خودکار، `/tts audio`، `/tts status`، و ابزار عامل `tts` اعمال می‌شود. برای نمونه‌های ارائه‌دهنده و ترتیب تقدم، [تبدیل متن به گفتار](/fa/tools/tts#per-agent-voice-overrides) را ببینید.

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
- `model`: فرم رشته‌ای یک primary سخت‌گیرانه برای هر عامل و بدون fallback مدل تنظیم می‌کند؛ فرم شیء `{ primary }` نیز سخت‌گیرانه است مگر اینکه `fallbacks` اضافه کنید. از `{ primary, fallbacks: [...] }` استفاده کنید تا آن عامل fallback داشته باشد، یا از `{ primary, fallbacks: [] }` استفاده کنید تا رفتار سخت‌گیرانه صریح شود. کارهای Cron که فقط `primary` را override می‌کنند همچنان fallbackهای پیش‌فرض را به ارث می‌برند، مگر اینکه `fallbacks: []` را تنظیم کنید.
- `params`: پارامترهای stream برای هر عامل که روی ورودی مدل انتخاب‌شده در `agents.defaults.models` merge می‌شوند. از این برای overrideهای اختصاصی عامل مانند `cacheRetention`، `temperature`، یا `maxTokens` بدون تکرار کل کاتالوگ مدل استفاده کنید.
- `tts`: overrideهای اختیاری تبدیل متن به گفتار برای هر عامل. این بلوک روی `messages.tts` به‌صورت deep-merge اعمال می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده و سیاست fallback مشترک را در `messages.tts` نگه دارید و اینجا فقط مقدارهای اختصاصی پرسونا مانند ارائه‌دهنده، صدا، مدل، سبک، یا حالت خودکار را تنظیم کنید.
- `skills`: فهرست مجاز اختیاری Skills برای هر عامل. اگر حذف شود، عامل در صورت تنظیم بودن `agents.defaults.skills` آن را به ارث می‌برد؛ یک فهرست صریح به‌جای merge کردن، پیش‌فرض‌ها را جایگزین می‌کند، و `[]` یعنی بدون Skills.
- `thinkingDefault`: سطح پیش‌فرض اختیاری تفکر برای هر عامل (`off | minimal | low | medium | high | xhigh | adaptive | max`). وقتی هیچ override در سطح پیام یا نشست تنظیم نشده باشد، `agents.defaults.thinkingDefault` را برای این عامل override می‌کند. پروفایل ارائه‌دهنده/مدل انتخاب‌شده کنترل می‌کند که کدام مقدارها معتبر هستند؛ برای Google Gemini، `adaptive` تفکر پویای متعلق به ارائه‌دهنده را نگه می‌دارد (`thinkingLevel` در Gemini 3/3.1 حذف می‌شود، `thinkingBudget: -1` در Gemini 2.5).
- `reasoningDefault`: نمایانی پیش‌فرض اختیاری reasoning برای هر عامل (`on | off | stream`). وقتی هیچ override برای reasoning در سطح پیام یا نشست تنظیم نشده باشد، `agents.defaults.reasoningDefault` را برای این عامل override می‌کند.
- `fastModeDefault`: پیش‌فرض اختیاری برای حالت سریع برای هر عامل (`true | false`). وقتی هیچ override حالت سریع در سطح پیام یا نشست تنظیم نشده باشد اعمال می‌شود.
- `models`: overrideهای اختیاری کاتالوگ مدل/Runtime برای هر عامل که با شناسه‌های کامل `provider/model` کلیدگذاری شده‌اند. از `models["provider/model"].agentRuntime` برای استثناهای Runtime مختص عامل استفاده کنید.
- `runtime`: توصیف‌گر Runtime اختیاری برای هر عامل. وقتی عامل باید به‌طور پیش‌فرض از نشست‌های harness مربوط به ACP استفاده کند، از `type: "acp"` همراه با پیش‌فرض‌های `runtime.acp` (`agent`، `backend`، `mode`، `cwd`) استفاده کنید.
- `identity.avatar`: مسیر نسبی به workspace، نشانی `http(s)`، یا URI از نوع `data:`.
- `identity` پیش‌فرض‌ها را استخراج می‌کند: `ackReaction` از `emoji`، و `mentionPatterns` از `name`/`emoji`.
- `subagents.allowAgents`: فهرست مجاز شناسه‌های عامل برای targetهای صریح `sessions_spawn.agentId` (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل). وقتی فراخوانی‌های `agentId` با target خودِ درخواست‌کننده باید مجاز باشند، شناسه درخواست‌کننده را درج کنید.
- محافظ ارث‌بری sandbox: اگر نشست درخواست‌کننده sandbox شده باشد، `sessions_spawn` targetهایی را که بدون sandbox اجرا می‌شوند رد می‌کند.
- `subagents.requireAgentId`: وقتی true باشد، فراخوانی‌های `sessions_spawn` را که `agentId` را حذف می‌کنند مسدود می‌کند (انتخاب صریح پروفایل را اجباری می‌کند؛ پیش‌فرض: false).

---

## مسیریابی چندعاملی

چند عامل جداشده را داخل یک Gateway اجرا کنید. [چندعاملی](/fa/concepts/multi-agent) را ببینید.

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

- `type` (اختیاری): `route` برای مسیریابی عادی (نبودن type به‌طور پیش‌فرض route است)، `acp` برای bindingهای گفت‌وگوی پایدار ACP.
- `match.channel` (الزامی)
- `match.accountId` (اختیاری؛ `*` = هر حساب؛ حذف‌شده = حساب پیش‌فرض)
- `match.peer` (اختیاری؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختیاری؛ وابسته به کانال)
- `acp` (اختیاری؛ فقط برای `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتیب تطبیق قطعی:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (دقیق، بدون peer/guild/team)
5. `match.accountId: "*"` (در سطح کانال)
6. عامل پیش‌فرض

در هر سطح، اولین ورودی مطابق در `bindings` برنده می‌شود.

برای ورودی‌های `type: "acp"`، OpenClaw بر اساس هویت دقیق گفت‌وگو (`match.channel` + حساب + `match.peer.id`) resolve می‌کند و از ترتیب سطحی binding مسیریابی بالا استفاده نمی‌کند.

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

- **`scope`**: راهبرد پایهٔ گروه‌بندی نشست برای زمینه‌های گفت‌وگوی گروهی.
  - `per-sender` (پیش‌فرض): هر فرستنده یک نشست جداگانه درون زمینهٔ یک کانال دریافت می‌کند.
  - `global`: همهٔ شرکت‌کنندگان در زمینهٔ یک کانال، یک نشست واحد را به اشتراک می‌گذارند (فقط وقتی استفاده کنید که زمینهٔ مشترک مدنظر است).
- **`dmScope`**: نحوهٔ گروه‌بندی پیام‌های مستقیم.
  - `main`: همهٔ پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند.
  - `per-peer`: جداسازی بر اساس شناسهٔ فرستنده در سراسر کانال‌ها.
  - `per-channel-peer`: جداسازی بر اساس کانال + فرستنده (برای صندوق‌های ورودی چندکاربره توصیه می‌شود).
  - `per-account-channel-peer`: جداسازی بر اساس حساب + کانال + فرستنده (برای چندحسابی توصیه می‌شود).
- **`identityLinks`**: نگاشت شناسه‌های متعارف به همتایان دارای پیشوند ارائه‌دهنده برای اشتراک‌گذاری نشست میان کانال‌ها. فرمان‌های Dock مانند `/dock_discord` از همان نگاشت برای تغییر مسیر پاسخ نشست فعال به همتای کانال پیوندخوردهٔ دیگر استفاده می‌کنند؛ [داکینگ کانال](/fa/concepts/channel-docking) را ببینید.
- **`reset`**: سیاست اصلی بازنشانی. `daily` در زمان محلی `atHour` بازنشانی می‌شود؛ `idle` پس از `idleMinutes` بازنشانی می‌شود. وقتی هر دو پیکربندی شده باشند، هرکدام زودتر منقضی شود اعمال می‌شود. تازگی بازنشانی روزانه از `sessionStartedAt` ردیف نشست استفاده می‌کند؛ تازگی بازنشانی بی‌کاری از `lastInteractionAt` استفاده می‌کند. نوشتن‌های پس‌زمینه/رویدادهای سیستمی مانند heartbeat، بیدارباش‌های cron، اعلان‌های exec، و حسابداری gateway می‌توانند `updatedAt` را به‌روزرسانی کنند، اما نشست‌های روزانه/بی‌کار را تازه نگه نمی‌دارند.
- **`resetByType`**: بازنویسی‌های مبتنی بر نوع (`direct`، `group`، `thread`). مقدار قدیمی `dm` به‌عنوان نام مستعار `direct` پذیرفته می‌شود.
- **`mainKey`**: فیلد قدیمی. Runtime همیشه از `"main"` برای سطل اصلی گفت‌وگوی مستقیم استفاده می‌کند.
- **`agentToAgent.maxPingPongTurns`**: حداکثر نوبت‌های پاسخ برگشتی بین عامل‌ها هنگام تبادل‌های عامل‌به‌عامل (عدد صحیح، بازه: `0`-`20`، پیش‌فرض: `5`). `0` زنجیره‌سازی ping-pong را غیرفعال می‌کند.
- **`sendPolicy`**: تطبیق بر اساس `channel`، `chatType` (`direct|group|channel`، با نام مستعار قدیمی `dm`)، `keyPrefix`، یا `rawKeyPrefix`. نخستین ردکردن برنده است.
- **`maintenance`**: پاک‌سازی انبار نشست + کنترل‌های نگهداشت.
  - `mode`: مقدار `warn` فقط هشدار منتشر می‌کند؛ `enforce` پاک‌سازی را اعمال می‌کند.
  - `pruneAfter`: حد سنی برای ورودی‌های کهنه (پیش‌فرض `30d`).
  - `maxEntries`: حداکثر تعداد ورودی‌ها در `sessions.json` (پیش‌فرض `500`). Runtime پاک‌سازی دسته‌ای را با یک بافر کوچک سقف بالا برای محدودیت‌های اندازهٔ تولید می‌نویسد؛ `openclaw sessions cleanup --enforce` سقف را بلافاصله اعمال می‌کند.
  - `rotateBytes`: منسوخ شده و نادیده گرفته می‌شود؛ `openclaw doctor --fix` آن را از پیکربندی‌های قدیمی‌تر حذف می‌کند.
  - `resetArchiveRetention`: نگهداشت برای بایگانی‌های رونوشت `*.reset.<timestamp>`. پیش‌فرض برابر `pruneAfter` است؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
  - `maxDiskBytes`: بودجهٔ اختیاری دیسک برای پوشهٔ نشست‌ها. در حالت `warn` هشدارها را ثبت می‌کند؛ در حالت `enforce` ابتدا قدیمی‌ترین مصنوعات/نشست‌ها را حذف می‌کند.
  - `highWaterBytes`: هدف اختیاری پس از پاک‌سازی بودجه. پیش‌فرض برابر `80%` از `maxDiskBytes` است.
- **`threadBindings`**: پیش‌فرض‌های سراسری برای قابلیت‌های نشست متصل به رشته.
  - `enabled`: کلید اصلی پیش‌فرض (ارائه‌دهندگان می‌توانند بازنویسی کنند؛ Discord از `channels.discord.threadBindings.enabled` استفاده می‌کند)
  - `idleHours`: خارج‌کردن خودکار از تمرکز به‌دلیل عدم فعالیت، به ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `maxAgeHours`: حداکثر سن سخت‌گیرانهٔ پیش‌فرض به ساعت (`0` غیرفعال می‌کند؛ ارائه‌دهندگان می‌توانند بازنویسی کنند)
  - `spawnSessions`: دروازهٔ پیش‌فرض برای ایجاد نشست‌های کاری متصل به رشته از `sessions_spawn` و ایجاد رشتهٔ ACP. وقتی اتصال‌های رشته فعال باشند، پیش‌فرض `true` است؛ ارائه‌دهندگان/حساب‌ها می‌توانند بازنویسی کنند.
  - `defaultSpawnContext`: زمینهٔ پیش‌فرض زیرعامل بومی برای ایجادهای متصل به رشته (`"fork"` یا `"isolated"`). پیش‌فرض `"fork"` است.

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

حل مقدار (خاص‌ترین برنده است): حساب → کانال → سراسری. `""` غیرفعال می‌کند و آبشار را متوقف می‌کند. `"auto"` مقدار `[{identity.name}]` را استخراج می‌کند.

**متغیرهای قالب:**

| متغیر            | توضیح                 | مثال                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | نام کوتاه مدل          | `claude-opus-4-6`           |
| `{modelFull}`     | شناسهٔ کامل مدل        | `anthropic/claude-opus-4-6` |
| `{provider}`      | نام ارائه‌دهنده        | `anthropic`                 |
| `{thinkingLevel}` | سطح تفکر فعلی          | `high`, `low`, `off`        |
| `{identity.name}` | نام هویت عامل          | (همانند `"auto"`)           |

متغیرها به بزرگی و کوچکی حروف حساس نیستند. `{think}` نام مستعار `{thinkingLevel}` است.

### واکنش تأیید

- پیش‌فرض، `identity.emoji` عامل فعال است، وگرنه `"👀"`. برای غیرفعال‌سازی روی `""` تنظیم کنید.
- بازنویسی‌های هر کانال: `channels.<channel>.ackReaction`، `channels.<channel>.accounts.<id>.ackReaction`.
- ترتیب حل مقدار: حساب → کانال → `messages.ackReaction` → جایگزین هویت.
- دامنه: `group-mentions` (پیش‌فرض)، `group-all`، `direct`، `all`.
- `removeAckAfterReply`: تأیید را پس از پاسخ در کانال‌هایی که از واکنش پشتیبانی می‌کنند مانند Slack، Discord، Telegram، WhatsApp، و iMessage حذف می‌کند.
- `messages.statusReactions.enabled`: واکنش‌های وضعیت چرخهٔ عمر را در Slack، Discord، و Telegram فعال می‌کند.
  در Slack و Discord، تنظیم‌نشدن باعث می‌شود وقتی واکنش‌های تأیید فعال هستند، واکنش‌های وضعیت هم فعال بمانند.
  در Telegram، آن را صراحتاً روی `true` تنظیم کنید تا واکنش‌های وضعیت چرخهٔ عمر فعال شوند.

### تأخیر ورودی

پیام‌های سریعِ فقط‌متنی از یک فرستنده را در یک نوبت عامل واحد دسته‌بندی می‌کند. رسانه/پیوست‌ها بلافاصله تخلیه می‌شوند. فرمان‌های کنترلی تأخیر را دور می‌زنند.

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

- `auto` حالت پیش‌فرض TTS خودکار را کنترل می‌کند: `off`، `always`، `inbound`، یا `tagged`. `/tts on|off` می‌تواند ترجیحات محلی را بازنویسی کند، و `/tts status` وضعیت مؤثر را نشان می‌دهد.
- `summaryModel` مقدار `agents.defaults.model.primary` را برای خلاصه‌سازی خودکار بازنویسی می‌کند.
- `modelOverrides` به‌صورت پیش‌فرض فعال است؛ پیش‌فرض `modelOverrides.allowProvider` برابر `false` است (نیازمند انتخاب صریح).
- کلیدهای API به `ELEVENLABS_API_KEY`/`XI_API_KEY` و `OPENAI_API_KEY` برمی‌گردند.
- ارائه‌دهندگان گفتار همراه، در مالکیت Plugin هستند. اگر `plugins.allow` تنظیم شده باشد، هر Plugin ارائه‌دهندهٔ TTS را که می‌خواهید استفاده کنید وارد کنید، برای مثال `microsoft` برای Edge TTS. شناسهٔ ارائه‌دهندهٔ قدیمی `edge` به‌عنوان نام مستعار `microsoft` پذیرفته می‌شود.
- `providers.openai.baseUrl` نقطهٔ پایانی OpenAI TTS را بازنویسی می‌کند. ترتیب حل مقدار: ابتدا پیکربندی، سپس `OPENAI_TTS_BASE_URL`، سپس `https://api.openai.com/v1`.
- وقتی `providers.openai.baseUrl` به یک نقطهٔ پایانی غیر OpenAI اشاره کند، OpenClaw آن را به‌عنوان یک سرور TTS سازگار با OpenAI در نظر می‌گیرد و اعتبارسنجی مدل/صدا را آسان‌تر می‌کند.

---

## Talk

پیش‌فرض‌های حالت Talk (macOS/iOS/Android).

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

- `talk.provider` باید وقتی چند ارائه‌دهندهٔ Talk پیکربندی شده‌اند، با یک کلید در `talk.providers` مطابقت داشته باشد.
- کلیدهای تخت قدیمی Talk (`talk.voiceId`، `talk.voiceAliases`، `talk.modelId`، `talk.outputFormat`، `talk.apiKey`) فقط برای سازگاری هستند. `openclaw doctor --fix` را اجرا کنید تا پیکربندی ذخیره‌شده به `talk.providers.<provider>` بازنویسی شود.
- شناسه‌های صدا به `ELEVENLABS_VOICE_ID` یا `SAG_VOICE_ID` برمی‌گردند.
- `providers.*.apiKey` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرد.
- جایگزین `ELEVENLABS_API_KEY` فقط وقتی اعمال می‌شود که هیچ کلید API برای Talk پیکربندی نشده باشد.
- `providers.*.voiceAliases` اجازه می‌دهد دستورهای Talk از نام‌های دوستانه استفاده کنند.
- `providers.mlx.modelId` مخزن Hugging Face مورد استفادهٔ کمک‌کنندهٔ MLX محلی macOS را انتخاب می‌کند. اگر حذف شود، macOS از `mlx-community/Soprano-80M-bf16` استفاده می‌کند.
- پخش MLX در macOS از طریق کمک‌کنندهٔ همراه `openclaw-mlx-tts`، در صورت وجود، یا یک فایل اجرایی در `PATH` اجرا می‌شود؛ `OPENCLAW_MLX_TTS_BIN` مسیر کمک‌کننده را برای توسعه بازنویسی می‌کند.
- `consultThinkingLevel` سطح تفکر را برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های Control UI Talk realtime `openclaw_agent_consult` کنترل می‌کند. برای حفظ رفتار عادی نشست/مدل، آن را تنظیم‌نشده بگذارید.
- `consultFastMode` یک بازنویسی یک‌بارهٔ حالت سریع را برای مشورت‌های Control UI Talk realtime بدون تغییر تنظیم عادی حالت سریع نشست تنظیم می‌کند.
- `speechLocale` شناسهٔ محل BCP 47 مورد استفادهٔ تشخیص گفتار Talk در iOS/macOS را تنظیم می‌کند. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `silenceTimeoutMs` کنترل می‌کند حالت Talk پس از سکوت کاربر چه مدت منتظر بماند پیش از اینکه رونوشت را ارسال کند. تنظیم‌نشدن، پنجرهٔ مکث پیش‌فرض پلتفرم را حفظ می‌کند (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` دستورهای سیستمی روبه‌ارائه‌دهنده را به اعلان realtime داخلی OpenClaw اضافه می‌کند، تا سبک صدا بدون از دست دادن راهنمای پیش‌فرض `openclaw_agent_consult` قابل پیکربندی باشد.

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — همهٔ کلیدهای پیکربندی دیگر
- [پیکربندی](/fa/gateway/configuration) — کارهای رایج و راه‌اندازی سریع
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
