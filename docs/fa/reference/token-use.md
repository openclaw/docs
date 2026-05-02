---
read_when:
    - توضیح استفاده از توکن، هزینه‌ها یا پنجره‌های زمینه
    - اشکال‌زدایی رشد زمینه یا رفتار Compaction
summary: OpenClaw چگونه زمینهٔ پرامپت را می‌سازد و مصرف توکن + هزینه‌ها را گزارش می‌کند
title: مصرف توکن و هزینه‌ها
x-i18n:
    generated_at: "2026-05-02T12:02:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# مصرف توکن و هزینه‌ها

OpenClaw **توکن‌ها** را ردیابی می‌کند، نه نویسه‌ها را. توکن‌ها به مدل وابسته‌اند، اما بیشتر مدل‌های سبک OpenAI به‌طور میانگین برای متن انگلیسی حدود ۴ نویسه به‌ازای هر توکن دارند.

## system prompt چگونه ساخته می‌شود

OpenClaw در هر اجرا system prompt خودش را می‌سازد. این شامل موارد زیر است:

- فهرست ابزارها + توضیحات کوتاه
- فهرست Skills (فقط فراداده؛ دستورالعمل‌ها هنگام نیاز با `read` بارگذاری می‌شوند).
  بلوک فشرده Skills با `skills.limits.maxSkillsPromptChars` محدود می‌شود،
  با بازنویسی اختیاری برای هر agent در
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- دستورالعمل‌های خودبه‌روزرسانی
- Workspace + فایل‌های bootstrap (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md` هنگام جدید بودن، به‌علاوه `MEMORY.md` هنگام وجود). ریشه‌ی حروف‌کوچک `memory.md` تزریق نمی‌شود؛ این ورودی ترمیم قدیمی برای `openclaw doctor --fix` است، وقتی با `MEMORY.md` همراه باشد. فایل‌های بزرگ با `agents.defaults.bootstrapMaxChars` کوتاه می‌شوند (پیش‌فرض: 12000)، و کل تزریق bootstrap با `agents.defaults.bootstrapTotalMaxChars` محدود می‌شود (پیش‌فرض: 60000). فایل‌های روزانه‌ی `memory/*.md` بخشی از prompt عادی bootstrap نیستند؛ در نوبت‌های معمول از طریق ابزارهای memory به‌صورت عندالنیاز باقی می‌مانند، اما اجراهای reset/startup مدل می‌توانند برای همان نوبت اول یک بلوک startup-context یک‌باره با memory روزانه‌ی اخیر در ابتدا اضافه کنند. فرمان‌های چت ساده‌ی `/new` و `/reset` بدون فراخوانی مدل تأیید می‌شوند. پیش‌درآمد startup با `agents.defaults.startupContext` کنترل می‌شود.
- زمان (UTC + منطقه زمانی کاربر)
- برچسب‌های پاسخ + رفتار Heartbeat
- فراداده runtime (میزبان/سیستم‌عامل/مدل/تفکر)

جزئیات کامل را در [System Prompt](/fa/concepts/system-prompt) ببینید.

## چه چیزهایی در پنجره context حساب می‌شود

هر چیزی که مدل دریافت می‌کند در محدودیت context حساب می‌شود:

- system prompt (همه بخش‌های فهرست‌شده در بالا)
- تاریخچه گفت‌وگو (پیام‌های کاربر + assistant)
- فراخوانی‌های ابزار و نتایج ابزار
- پیوست‌ها/رونوشت‌ها (تصاویر، صدا، فایل‌ها)
- خلاصه‌های Compaction و مصنوعات هرس
- wrapperهای provider یا headerهای ایمنی (قابل مشاهده نیستند، اما همچنان حساب می‌شوند)

برخی سطح‌های سنگین از نظر runtime سقف‌های صریح خودشان را دارند:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

بازنویسی‌های هر agent زیر `agents.list[].contextLimits` قرار دارند. این کنترل‌ها
برای بریده‌های runtime محدود و بلوک‌های تزریقی متعلق به runtime هستند. آن‌ها
از محدودیت‌های bootstrap، محدودیت‌های startup-context، و محدودیت‌های prompt مربوط به Skills
جدا هستند.

برای تصاویر، OpenClaw پیش از فراخوانی‌های provider، payloadهای تصویر transcript/tool را کوچک‌مقیاس می‌کند.
برای تنظیم این مورد از `agents.defaults.imageMaxDimensionPx` (پیش‌فرض: `1200`) استفاده کنید:

- مقادیر کمتر معمولاً مصرف vision-token و اندازه payload را کاهش می‌دهند.
- مقادیر بالاتر جزئیات بصری بیشتری را برای OCR/اسکرین‌شات‌های سنگین از نظر UI حفظ می‌کنند.

برای یک تفکیک عملی (برای هر فایل تزریق‌شده، ابزارها، Skills، و اندازه system prompt)، از `/context list` یا `/context detail` استفاده کنید. [Context](/fa/concepts/context) را ببینید.

## چگونه مصرف فعلی توکن را ببینید

در چت از این‌ها استفاده کنید:

- `/status` → **کارت وضعیت غنی از ایموجی** با مدل نشست، مصرف context،
  توکن‌های ورودی/خروجی آخرین پاسخ، و **هزینه برآوردی** (فقط کلید API).
- `/usage off|tokens|full` → یک **پاورقی مصرف برای هر پاسخ** به هر پاسخ اضافه می‌کند.
  - برای هر نشست پایدار می‌ماند (به‌صورت `responseUsage` ذخیره می‌شود).
  - احراز هویت OAuth **هزینه را پنهان می‌کند** (فقط توکن‌ها).
- `/usage cost` → یک خلاصه هزینه محلی از لاگ‌های نشست OpenClaw نشان می‌دهد.

سطح‌های دیگر:

- **TUI/Web TUI:** `/status` + `/usage` پشتیبانی می‌شوند.
- **CLI:** `openclaw status --usage` و `openclaw channels list`
  پنجره‌های سهمیه provider نرمال‌سازی‌شده را نشان می‌دهند (`X% left`، نه هزینه‌های هر پاسخ).
  providerهای فعلی پنجره مصرف: Anthropic، GitHub Copilot، Gemini CLI،
  OpenAI Codex، MiniMax، Xiaomi، و z.ai.

سطح‌های مصرف، aliasهای رایج فیلدهای native هر provider را پیش از نمایش نرمال‌سازی می‌کنند.
برای ترافیک Responses خانواده OpenAI، این شامل هر دو `input_tokens` /
`output_tokens` و `prompt_tokens` / `completion_tokens` می‌شود، بنابراین نام‌های فیلد وابسته به transport
`/status`، `/usage`، یا خلاصه‌های نشست را تغییر نمی‌دهند.
مصرف JSON در Gemini CLI هم نرمال‌سازی می‌شود: متن پاسخ از `response` می‌آید، و
`stats.cached` به `cacheRead` نگاشت می‌شود و وقتی CLI فیلد صریح `stats.input` را حذف کند
از `stats.input_tokens - stats.cached` استفاده می‌شود.
برای ترافیک native Responses خانواده OpenAI، aliasهای مصرف WebSocket/SSE به همان روش
نرمال‌سازی می‌شوند، و وقتی `total_tokens` وجود نداشته باشد یا `0` باشد، totals به ورودی + خروجی نرمال‌شده
برمی‌گردند.
وقتی snapshot نشست فعلی کم‌اطلاعات باشد، `/status` و `session_status` همچنین می‌توانند
شمارنده‌های token/cache و برچسب مدل فعال runtime را از جدیدترین لاگ مصرف transcript
بازیابی کنند. مقدارهای live غیرصفر موجود همچنان نسبت به مقدارهای fallback از transcript
اولویت دارند، و totals بزرگ‌تر transcript که promptمحور هستند می‌توانند وقتی totals ذخیره‌شده موجود نیستند یا کوچک‌ترند غالب شوند.
احراز هویت مصرف برای پنجره‌های سهمیه provider، وقتی در دسترس باشد، از hookهای اختصاصی provider می‌آید؛
در غیر این صورت OpenClaw به credentials هم‌خوان OAuth/API-key
از auth profiles، env، یا config fallback می‌کند.
ورودی‌های transcript مربوط به assistant همان شکل مصرف نرمال‌سازی‌شده را پایدار نگه می‌دارند، از جمله
`usage.cost` وقتی مدل فعال pricing پیکربندی‌شده داشته باشد و provider
فراداده مصرف برگرداند. این به `/usage cost` و وضعیت نشست متکی بر transcript
یک منبع پایدار می‌دهد، حتی پس از اینکه وضعیت live runtime از بین رفته باشد.

OpenClaw حسابداری مصرف provider را از snapshot فعلی context جدا نگه می‌دارد.
`usage.total` مربوط به provider می‌تواند شامل ورودی cacheشده، خروجی، و چندین
فراخوانی مدل در tool-loop باشد، بنابراین برای هزینه و telemetry مفید است اما می‌تواند
پنجره live context را بیش‌ازحد نشان دهد. نمایش‌ها و عیب‌یابی‌های context از آخرین snapshot
prompt (`promptTokens`، یا آخرین فراخوانی مدل وقتی snapshot prompt موجود نیست)
برای `context.used` استفاده می‌کنند.

## برآورد هزینه (وقتی نمایش داده شود)

هزینه‌ها از پیکربندی pricing مدل شما برآورد می‌شوند:

```
models.providers.<provider>.models[].cost
```

این‌ها **دلار آمریکا به‌ازای ۱ میلیون توکن** برای `input`، `output`، `cacheRead`، و
`cacheWrite` هستند. اگر pricing وجود نداشته باشد، OpenClaw فقط توکن‌ها را نشان می‌دهد. توکن‌های OAuth
هرگز هزینه دلاری نشان نمی‌دهند.

پس از آنکه sidecarها و channelها به مسیر آماده Gateway برسند، OpenClaw یک
bootstrap اختیاری pricing پس‌زمینه را برای refهای مدل پیکربندی‌شده‌ای که هنوز
pricing محلی ندارند شروع می‌کند. آن bootstrap، catalogهای pricing راه‌دور OpenRouter و LiteLLM
را fetch می‌کند. برای رد کردن fetch این catalogها در شبکه‌های آفلاین یا محدود، `models.pricing.enabled: false` را تنظیم کنید؛ ورودی‌های صریح
`models.providers.*.models[].cost` همچنان برآوردهای هزینه محلی را
پیش می‌برند.

## TTL کش و اثر هرس

کش prompt در provider فقط درون پنجره TTL کش اعمال می‌شود. OpenClaw می‌تواند
به‌صورت اختیاری **هرس cache-ttl** را اجرا کند: پس از منقضی شدن TTL کش،
نشست را هرس می‌کند، سپس پنجره کش را reset می‌کند تا درخواست‌های بعدی بتوانند به‌جای cache کردن دوباره کل تاریخچه،
از context تازه cacheشده دوباره استفاده کنند. این کار وقتی یک نشست بیش از TTL بی‌کار می‌ماند،
هزینه‌های cache write را پایین‌تر نگه می‌دارد.

آن را در [پیکربندی Gateway](/fa/gateway/configuration) پیکربندی کنید و جزئیات رفتار را در
[هرس نشست](/fa/concepts/session-pruning) ببینید.

Heartbeat می‌تواند کش را در فاصله‌های بی‌کاری **گرم** نگه دارد. اگر TTL کش مدل شما
`1h` است، تنظیم فاصله Heartbeat درست کمتر از آن (مثلاً `55m`) می‌تواند از
cache کردن دوباره کل prompt جلوگیری کند و هزینه‌های cache write را کاهش دهد.

در چیدمان‌های چند-agent، می‌توانید یک پیکربندی مدل مشترک نگه دارید و رفتار کش را
برای هر agent با `agents.list[].params.cacheRetention` تنظیم کنید.

برای راهنمای کامل کنترل‌به‌کنترل، [Prompt Caching](/fa/reference/prompt-caching) را ببینید.

برای pricing مربوط به Anthropic API، خواندن‌های کش به‌شکل چشمگیری ارزان‌تر از توکن‌های ورودی هستند،
در حالی که نوشتن‌های کش با ضریب بالاتری محاسبه می‌شوند. برای آخرین نرخ‌ها و ضریب‌های TTL، pricing کش prompt در Anthropic را ببینید:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### مثال: گرم نگه داشتن کش 1h با Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### مثال: ترافیک ترکیبی با راهبرد کش برای هر agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` روی `params` مدل انتخاب‌شده merge می‌شود، بنابراین می‌توانید
فقط `cacheRetention` را بازنویسی کنید و سایر پیش‌فرض‌های مدل را بدون تغییر به ارث ببرید.

### مثال: فعال کردن header بتای context 1M در Anthropic

پنجره context 1M در Anthropic در حال حاضر پشت beta-gate است. OpenClaw می‌تواند
وقتی `context1m` را روی مدل‌های پشتیبانی‌شده Opus یا Sonnet فعال کنید،
مقدار لازم `anthropic-beta` را تزریق کند.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

این به header بتای `context-1m-2025-08-07` در Anthropic نگاشت می‌شود.

این فقط وقتی اعمال می‌شود که `context1m: true` روی همان ورودی مدل تنظیم شده باشد.

الزام: credential باید برای مصرف long-context واجد شرایط باشد. اگر نباشد،
Anthropic برای آن درخواست با خطای rate limit سمت provider پاسخ می‌دهد.

اگر Anthropic را با توکن‌های OAuth/subscription (`sk-ant-oat-*`) احراز هویت کنید،
OpenClaw header بتای `context-1m-*` را رد می‌کند، چون Anthropic در حال حاضر
این ترکیب را با HTTP 401 رد می‌کند.

## نکته‌هایی برای کاهش فشار توکن

- برای خلاصه کردن نشست‌های طولانی از `/compact` استفاده کنید.
- خروجی‌های بزرگ ابزار را در workflowهای خود کوتاه کنید.
- برای نشست‌های سنگین از نظر اسکرین‌شات، `agents.defaults.imageMaxDimensionPx` را پایین بیاورید.
- توضیحات Skills را کوتاه نگه دارید (فهرست Skill به prompt تزریق می‌شود).
- برای کارهای پرحرف و اکتشافی، مدل‌های کوچک‌تر را ترجیح دهید.

برای فرمول دقیق سربار فهرست Skill، [Skills](/fa/tools/skills) را ببینید.

## مرتبط

- [مصرف API و هزینه‌ها](/fa/reference/api-usage-costs)
- [کش prompt](/fa/reference/prompt-caching)
- [ردیابی مصرف](/fa/concepts/usage-tracking)
