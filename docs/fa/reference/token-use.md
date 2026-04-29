---
read_when:
    - توضیح مصرف توکن، هزینه‌ها یا پنجره‌های زمینه
    - اشکال‌زدایی رشد زمینه یا رفتار Compaction
summary: OpenClaw چگونه زمینهٔ پرامپت را می‌سازد و مصرف توکن + هزینه‌ها را گزارش می‌کند
title: استفاده از توکن و هزینه‌ها
x-i18n:
    generated_at: "2026-04-29T23:35:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# مصرف و هزینه‌های توکن

OpenClaw **توکن‌ها** را ردیابی می‌کند، نه نویسه‌ها را. توکن‌ها وابسته به مدل هستند، اما بیشتر مدل‌های سبک OpenAI برای متن انگلیسی به‌طور میانگین حدود ۴ نویسه به‌ازای هر توکن دارند.

## نحوه ساخت system prompt

OpenClaw در هر اجرا system prompt خودش را می‌سازد. این شامل موارد زیر است:

- فهرست ابزارها + توضیحات کوتاه
- فهرست Skills (فقط فراداده؛ دستورالعمل‌ها در صورت نیاز با `read` بارگذاری می‌شوند).
  بلوک فشرده Skills با `skills.limits.maxSkillsPromptChars` محدود می‌شود،
  همراه با بازنویسی اختیاری برای هر عامل در
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- دستورالعمل‌های خودبه‌روزرسانی
- Workspace + فایل‌های راه‌اندازی (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md` وقتی جدید باشد، به‌علاوه `MEMORY.md` وقتی موجود باشد). ریشه با حروف کوچک `memory.md` تزریق نمی‌شود؛ این ورودی تعمیر قدیمی برای `openclaw doctor --fix` است وقتی همراه با `MEMORY.md` باشد. فایل‌های بزرگ با `agents.defaults.bootstrapMaxChars` کوتاه می‌شوند (پیش‌فرض: 12000)، و کل تزریق راه‌اندازی با `agents.defaults.bootstrapTotalMaxChars` محدود می‌شود (پیش‌فرض: 60000). فایل‌های روزانه `memory/*.md` بخشی از prompt راه‌اندازی معمول نیستند؛ در نوبت‌های عادی از طریق ابزارهای حافظه به‌صورت درخواستی باقی می‌مانند، اما اجراهای reset/startup مدل می‌توانند برای همان نوبت اول یک بلوک یک‌باره startup-context با حافظه روزانه اخیر را پیشوند کنند. فرمان‌های چت خام `/new` و `/reset` بدون فراخوانی مدل تأیید می‌شوند. پیش‌درآمد startup با `agents.defaults.startupContext` کنترل می‌شود.
- زمان (UTC + منطقه زمانی کاربر)
- برچسب‌های پاسخ + رفتار Heartbeat
- فراداده runtime (میزبان/سیستم‌عامل/مدل/thinking)

جزئیات کامل را در [System Prompt](/fa/concepts/system-prompt) ببینید.

## چه چیزهایی در پنجره context حساب می‌شوند

هر چیزی که مدل دریافت می‌کند در محدودیت context حساب می‌شود:

- system prompt (همه بخش‌های فهرست‌شده بالا)
- تاریخچه گفتگو (پیام‌های کاربر + assistant)
- فراخوانی‌های ابزار و نتایج ابزار
- پیوست‌ها/رونوشت‌ها (تصاویر، صدا، فایل‌ها)
- خلاصه‌های Compaction و مصنوعات هرس
- wrapperهای provider یا headerهای ایمنی (قابل مشاهده نیستند، اما همچنان حساب می‌شوند)

برخی سطوح پرمصرف runtime سقف‌های صریح خود را دارند:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

بازنویسی‌های هر عامل زیر `agents.list[].contextLimits` قرار دارند. این تنظیم‌ها
برای بریده‌های runtime محدود و بلوک‌های تزریق‌شده تحت مالکیت runtime هستند. آن‌ها
از محدودیت‌های راه‌اندازی، محدودیت‌های startup-context و محدودیت‌های prompt
مربوط به Skills جدا هستند.

برای تصاویر، OpenClaw پیش از فراخوانی‌های provider، payloadهای تصویر transcript/tool را کوچک‌مقیاس می‌کند.
برای تنظیم این رفتار از `agents.defaults.imageMaxDimensionPx` استفاده کنید (پیش‌فرض: `1200`):

- مقدارهای کمتر معمولاً مصرف توکن بینایی و اندازه payload را کاهش می‌دهند.
- مقدارهای بالاتر جزئیات بصری بیشتری را برای OCR/اسکرین‌شات‌های سنگین UI حفظ می‌کنند.

برای یک تفکیک کاربردی (برای هر فایل تزریق‌شده، ابزارها، Skills، و اندازه system prompt)، از `/context list` یا `/context detail` استفاده کنید. [Context](/fa/concepts/context) را ببینید.

## نحوه دیدن مصرف توکن فعلی

در چت از این‌ها استفاده کنید:

- `/status` → **کارت وضعیت سرشار از ایموجی** با مدل session، مصرف context،
  توکن‌های ورودی/خروجی آخرین پاسخ، و **هزینه برآوردی** (فقط API key).
- `/usage off|tokens|full` → یک **پانویس مصرف برای هر پاسخ** به هر پاسخ اضافه می‌کند.
  - برای هر session پایدار می‌ماند (به‌صورت `responseUsage` ذخیره می‌شود).
  - احراز هویت OAuth **هزینه را پنهان می‌کند** (فقط توکن‌ها).
- `/usage cost` → یک خلاصه هزینه محلی از لاگ‌های session OpenClaw نشان می‌دهد.

سطوح دیگر:

- **TUI/Web TUI:** `/status` + `/usage` پشتیبانی می‌شوند.
- **CLI:** `openclaw status --usage` و `openclaw channels list`
  پنجره‌های سهمیه provider نرمال‌سازی‌شده را نشان می‌دهند (`X% left`، نه هزینه‌های هر پاسخ).
  providerهای فعلی پنجره مصرف: Anthropic، GitHub Copilot، Gemini CLI،
  OpenAI Codex، MiniMax، Xiaomi، و z.ai.

سطوح مصرف، نام‌های مستعار رایج فیلدهای بومی provider را پیش از نمایش نرمال‌سازی می‌کنند.
برای ترافیک Responses خانواده OpenAI، این شامل هر دو `input_tokens` /
`output_tokens` و `prompt_tokens` / `completion_tokens` است، بنابراین نام‌های فیلد
وابسته به transport، `/status`، `/usage` یا خلاصه‌های session را تغییر نمی‌دهند.
مصرف JSON در Gemini CLI نیز نرمال‌سازی می‌شود: متن پاسخ از `response` می‌آید، و
`stats.cached` به `cacheRead` نگاشت می‌شود و وقتی CLI فیلد صریح `stats.input` را حذف می‌کند،
از `stats.input_tokens - stats.cached` استفاده می‌شود.
برای ترافیک Responses بومی خانواده OpenAI، نام‌های مستعار مصرف WebSocket/SSE نیز
به همین شکل نرمال‌سازی می‌شوند، و وقتی `total_tokens` وجود ندارد یا `0` است،
مجموع‌ها به ورودی + خروجی نرمال‌سازی‌شده fallback می‌کنند.
وقتی snapshot فعلی session کم‌داده باشد، `/status` و `session_status` می‌توانند
شمارنده‌های توکن/cache و برچسب مدل runtime فعال را از تازه‌ترین لاگ مصرف transcript
بازیابی کنند. مقدارهای live غیرصفر موجود همچنان بر مقدارهای fallback transcript
اولویت دارند، و مجموع‌های بزرگ‌تر transcript که به prompt مربوط‌اند می‌توانند وقتی
مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند برنده شوند.
احراز هویت مصرف برای پنجره‌های سهمیه provider، وقتی موجود باشد، از hookهای
ویژه provider می‌آید؛ در غیر این صورت OpenClaw به اعتبارنامه‌های OAuth/API-key
مطابق از auth profileها، env یا config fallback می‌کند.
ورودی‌های transcript مربوط به assistant همان شکل مصرف نرمال‌سازی‌شده را پایدار می‌کنند، از جمله
`usage.cost` وقتی مدل فعال pricing پیکربندی‌شده دارد و provider
فراداده مصرف برمی‌گرداند. این به `/usage cost` و وضعیت session مبتنی بر transcript
حتی پس از از بین رفتن وضعیت live runtime یک منبع پایدار می‌دهد.

OpenClaw حسابداری مصرف provider را از snapshot فعلی context جدا نگه می‌دارد.
`usage.total` مربوط به provider می‌تواند شامل ورودی cache‌شده، خروجی، و چندین
فراخوانی مدل در tool-loop باشد، بنابراین برای هزینه و telemetry مفید است اما می‌تواند
پنجره context زنده را بیش‌برآورد کند. نمایش‌ها و diagnostics مربوط به Context از آخرین
snapshot prompt (`promptTokens`، یا آخرین فراخوانی مدل وقتی snapshot prompt موجود نیست)
برای `context.used` استفاده می‌کنند.

## برآورد هزینه (وقتی نمایش داده شود)

هزینه‌ها از config قیمت‌گذاری مدل شما برآورد می‌شوند:

```
models.providers.<provider>.models[].cost
```

این‌ها **USD به‌ازای 1M توکن** برای `input`، `output`، `cacheRead` و
`cacheWrite` هستند. اگر قیمت‌گذاری موجود نباشد، OpenClaw فقط توکن‌ها را نشان می‌دهد. توکن‌های OAuth
هرگز هزینه دلاری را نشان نمی‌دهند.

راه‌اندازی Gateway همچنین یک bootstrap اختیاری قیمت‌گذاری در پس‌زمینه برای
model refهای پیکربندی‌شده‌ای انجام می‌دهد که هنوز pricing محلی ندارند. آن bootstrap
کاتالوگ‌های pricing ریموت OpenRouter و LiteLLM را دریافت می‌کند. برای رد کردن دریافت آن
کاتالوگ‌ها هنگام راه‌اندازی در شبکه‌های آفلاین یا محدود، `models.pricing.enabled: false` را تنظیم کنید؛
ورودی‌های صریح `models.providers.*.models[].cost` همچنان
برآوردهای هزینه محلی را هدایت می‌کنند.

## اثر TTL کش و هرس

کش prompt در provider فقط داخل پنجره TTL کش اعمال می‌شود. OpenClaw می‌تواند
به‌صورت اختیاری **cache-ttl pruning** اجرا کند: پس از انقضای TTL کش، session را هرس می‌کند،
سپس پنجره کش را reset می‌کند تا درخواست‌های بعدی بتوانند به‌جای کش‌کردن دوباره کل تاریخچه،
از context تازه کش‌شده دوباره استفاده کنند. این کار وقتی یک session بعد از TTL idle می‌شود،
هزینه‌های cache write را پایین‌تر نگه می‌دارد.

آن را در [پیکربندی Gateway](/fa/gateway/configuration) پیکربندی کنید و جزئیات رفتار را در
[هرس session](/fa/concepts/session-pruning) ببینید.

Heartbeat می‌تواند cache را در فاصله‌های idle **گرم** نگه دارد. اگر TTL کش مدل شما
`1h` است، تنظیم فاصله heartbeat کمی کمتر از آن (مثلاً `55m`) می‌تواند از
کش‌کردن دوباره prompt کامل جلوگیری کند و هزینه‌های cache write را کاهش دهد.

در چیدمان‌های چندعاملی، می‌توانید یک config مدل مشترک نگه دارید و رفتار کش را
برای هر عامل با `agents.list[].params.cacheRetention` تنظیم کنید.

برای راهنمای کامل تک‌به‌تک تنظیم‌ها، [Prompt Caching](/fa/reference/prompt-caching) را ببینید.

برای pricing API Anthropic، خواندن‌های کش به‌طور معناداری ارزان‌تر از توکن‌های ورودی هستند،
در حالی که cache writeها با ضریب بالاتری صورت‌حساب می‌شوند. برای تازه‌ترین نرخ‌ها و ضرایب TTL،
pricing مربوط به prompt caching در Anthropic را ببینید:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### مثال: گرم نگه داشتن کش 1h با heartbeat

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

### مثال: ترافیک ترکیبی با راهبرد کش برای هر عامل

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

### مثال: فعال‌سازی header بتای context 1M در Anthropic

پنجره context 1M در Anthropic در حال حاضر پشت گیت بتا قرار دارد. OpenClaw می‌تواند
وقتی `context1m` را روی مدل‌های پشتیبانی‌شده Opus یا Sonnet فعال می‌کنید، مقدار لازم
`anthropic-beta` را تزریق کند.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

این به header بتای `context-1m-2025-08-07` در Anthropic نگاشت می‌شود.

این فقط زمانی اعمال می‌شود که `context1m: true` روی آن ورودی مدل تنظیم شده باشد.

الزام: اعتبارنامه باید واجد شرایط استفاده از long-context باشد. اگر نباشد،
Anthropic برای آن درخواست با خطای rate limit سمت provider پاسخ می‌دهد.

اگر با توکن‌های OAuth/subscription (`sk-ant-oat-*`) در Anthropic احراز هویت کنید،
OpenClaw از header بتای `context-1m-*` صرف‌نظر می‌کند، چون Anthropic در حال حاضر
این ترکیب را با HTTP 401 رد می‌کند.

## نکاتی برای کاهش فشار توکن

- برای خلاصه‌سازی sessionهای طولانی از `/compact` استفاده کنید.
- خروجی‌های بزرگ ابزار را در workflowهای خود کوتاه کنید.
- برای sessionهای سنگین از نظر اسکرین‌شات، `agents.defaults.imageMaxDimensionPx` را کاهش دهید.
- توضیحات skill را کوتاه نگه دارید (فهرست skill در prompt تزریق می‌شود).
- برای کارهای پرحجم و اکتشافی، مدل‌های کوچک‌تر را ترجیح دهید.

برای فرمول دقیق سربار فهرست skill، [Skills](/fa/tools/skills) را ببینید.

## مرتبط

- [مصرف و هزینه‌های API](/fa/reference/api-usage-costs)
- [Prompt caching](/fa/reference/prompt-caching)
- [ردیابی مصرف](/fa/concepts/usage-tracking)
