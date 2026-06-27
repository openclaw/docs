---
read_when:
    - توضیح استفاده از توکن، هزینه‌ها، یا پنجره‌های زمینه
    - اشکال‌زدایی از رشد زمینه یا رفتار Compaction
summary: OpenClaw چگونه زمینهٔ پرامپت را می‌سازد و مصرف توکن + هزینه‌ها را گزارش می‌کند
title: مصرف توکن و هزینه‌ها
x-i18n:
    generated_at: "2026-06-27T18:51:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw **توکن‌ها** را ردیابی می‌کند، نه نویسه‌ها را. توکن‌ها به مدل وابسته‌اند، اما بیشتر مدل‌های سبک OpenAI برای متن انگلیسی به‌طور میانگین حدود ۴ نویسه به‌ازای هر توکن دارند.

## پرامپت سیستمی چگونه ساخته می‌شود

OpenClaw در هر اجرا پرامپت سیستمی خودش را مونتاژ می‌کند. این پرامپت شامل این موارد است:

- فهرست ابزارها + توضیحات کوتاه
- فهرست Skills (فقط فراداده؛ دستورالعمل‌ها در صورت نیاز با `read` بارگذاری می‌شوند).
  نوبت‌های بومی Codex بلوک فشرده Skills را به‌عنوان دستورالعمل‌های توسعه‌دهنده همکاریِ محدود به همان نوبت دریافت می‌کنند؛ harnessهای دیگر آن را در سطح معمول پرامپت دریافت می‌کنند. این بخش با `skills.limits.maxSkillsPromptChars` محدود می‌شود و امکان بازنویسی اختیاری برای هر agent در `agents.list[].skillsLimits.maxSkillsPromptChars` دارد.
- دستورالعمل‌های خودبه‌روزرسانی
- فایل‌های workspace + bootstrap (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md` در صورت جدید بودن، به‌علاوه `MEMORY.md` در صورت وجود). نوبت‌های بومی Codex وقتی ابزارهای حافظه برای workspace پیکربندی‌شده agent در دسترس باشند، `MEMORY.md` خام را از workspace پیکربندی‌شده agent جای‌گذاری نمی‌کنند؛ آن‌ها یک اشاره‌گر کوچک حافظه را در دستورالعمل‌های توسعه‌دهنده همکاریِ محدود به همان نوبت وارد می‌کنند و در صورت نیاز از ابزارهای حافظه استفاده می‌کنند. اگر ابزارها غیرفعال باشند، جست‌وجوی حافظه در دسترس نباشد، یا workspace فعال با workspace حافظه agent تفاوت داشته باشد، `MEMORY.md` از مسیر معمول زمینه نوبتِ محدودشده استفاده می‌کند. ریشه حروف‌کوچک `memory.md` تزریق نمی‌شود؛ این ورودی تعمیر legacy برای `openclaw doctor --fix` است، آن هم وقتی همراه با `MEMORY.md` باشد. فایل‌های تزریق‌شده بزرگ با `agents.defaults.bootstrapMaxChars` کوتاه می‌شوند (پیش‌فرض: 20000)، و کل تزریق bootstrap با `agents.defaults.bootstrapTotalMaxChars` محدود می‌شود (پیش‌فرض: 60000). فایل‌های روزانه `memory/*.md` بخشی از پرامپت bootstrap معمول نیستند؛ در نوبت‌های عادی همچنان در صورت نیاز از طریق ابزارهای حافظه در دسترس می‌مانند، اما اجراهای مدل در reset/startup می‌توانند یک بلوک یک‌باره زمینه startup با حافظه روزانه اخیر را برای همان نوبت اول پیشوند کنند. دستورهای چت ساده `/new` و `/reset` بدون فراخوانی مدل تأیید می‌شوند. پیش‌درآمد startup با `agents.defaults.startupContext` کنترل می‌شود. گزیده‌های AGENTS.md پس از Compaction جدا هستند و به فعال‌سازی صریح `agents.defaults.compaction.postCompactionSections` نیاز دارند.
- زمان (UTC + منطقه زمانی کاربر)
- برچسب‌های پاسخ + رفتار Heartbeat
- فراداده runtime (میزبان/OS/مدل/thinking)

جزئیات کامل را در [پرامپت سیستمی](/fa/concepts/system-prompt) ببینید.

هنگام مستندسازی credentials یا قطعه‌های auth، از
[قراردادهای Placeholder محرمانه](/fa/reference/secret-placeholder-conventions) استفاده کنید تا در تغییرات صرفاً مستنداتی از مثبت‌های کاذب secret-scanner جلوگیری شود.

## چه چیزهایی در پنجره زمینه حساب می‌شوند

هر چیزی که مدل دریافت می‌کند در حد زمینه محاسبه می‌شود:

- پرامپت سیستمی (همه بخش‌های فهرست‌شده بالا)
- تاریخچه گفت‌وگو (پیام‌های کاربر + assistant)
- فراخوانی‌های ابزار و نتایج ابزار
- پیوست‌ها/رونوشت‌ها (تصاویر، صدا، فایل‌ها)
- خلاصه‌های Compaction و مصنوعات pruning
- wrapperهای provider یا سرآیندهای ایمنی (قابل مشاهده نیستند، اما همچنان حساب می‌شوند)

برخی سطح‌های سنگین از نظر runtime سقف‌های صریح خودشان را دارند:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

بازنویسی‌های هر agent زیر `agents.list[].contextLimits` قرار دارند. این تنظیمات برای گزیده‌های runtime محدودشده و بلوک‌های تزریق‌شده متعلق به runtime هستند. آن‌ها از محدودیت‌های bootstrap، محدودیت‌های زمینه startup، و محدودیت‌های پرامپت Skills جدا هستند.

`toolResultMaxChars` یک سقف پیشرفته است (تا `1000000` نویسه). وقتی تنظیم نشده باشد، OpenClaw سقف زنده نتیجه ابزار را از پنجره زمینه مؤثر مدل انتخاب می‌کند: `16000` نویسه زیر 100K توکن، `32000` نویسه در 100K+ توکن، و `64000` نویسه در 200K+ توکن، که همچنان با محافظ سهم زمینه runtime محدود می‌شود.

برای تصاویر، OpenClaw payloadهای تصویر رونوشت/ابزار را پیش از فراخوانی provider کوچک‌سازی می‌کند.
برای تنظیم این مورد از `agents.defaults.imageMaxDimensionPx` استفاده کنید (پیش‌فرض: `1200`):

- مقدارهای پایین‌تر معمولاً مصرف توکن‌های بینایی و اندازه payload را کاهش می‌دهند.
- مقدارهای بالاتر جزئیات بصری بیشتری را برای screenshotهای سنگین از نظر OCR/UI حفظ می‌کنند.

برای یک تفکیک عملی (برای هر فایل تزریق‌شده، ابزارها، Skills، و اندازه پرامپت سیستمی)، از `/context list` یا `/context detail` استفاده کنید. [زمینه](/fa/concepts/context) را ببینید.

## چگونه مصرف فعلی توکن را ببینید

در چت از این‌ها استفاده کنید:

- `/status` → **کارت وضعیت پر از emoji** با مدل session، مصرف زمینه،
  توکن‌های ورودی/خروجی آخرین پاسخ، و **هزینه تخمینی** وقتی قیمت‌گذاری محلی برای مدل فعال پیکربندی شده باشد.
- `/usage off|tokens|full` → یک **پانوشت مصرف برای هر پاسخ** به هر پاسخ اضافه می‌کند.
  - برای هر session پایدار می‌ماند (به‌صورت `responseUsage` ذخیره می‌شود).
  - `/usage reset` (نام‌های مستعار: `inherit`، `clear`، `default`) — بازنویسی session را پاک می‌کند تا session دوباره پیش‌فرض پیکربندی‌شده را به ارث ببرد.
  - `/usage full` فقط وقتی OpenClaw فراداده مصرف و قیمت‌گذاری محلی برای مدل فعال داشته باشد، هزینه تخمینی را نشان می‌دهد. در غیر این صورت فقط توکن‌ها را نشان می‌دهد.
- `/usage cost` → یک خلاصه هزینه محلی از لاگ‌های session در OpenClaw نشان می‌دهد.

سطح‌های دیگر:

- **TUI/Web TUI:** `/status` + `/usage` پشتیبانی می‌شوند.
- **CLI:** `openclaw status --usage` و `openclaw channels list` پنجره‌های سهمیه provider نرمال‌شده را نشان می‌دهند (`X% left`، نه هزینه‌های هر پاسخ).
  providerهای فعلی پنجره مصرف: Anthropic، GitHub Copilot، Gemini CLI،
  OpenAI Codex، MiniMax، Xiaomi، و z.ai.

سطح‌های مصرف، نام‌های مستعار رایج فیلدهای بومی provider را پیش از نمایش نرمال‌سازی می‌کنند.
برای ترافیک Responses خانواده OpenAI، این شامل هر دو `input_tokens` /
`output_tokens` و `prompt_tokens` / `completion_tokens` است، بنابراین نام‌های فیلد وابسته به transport، `/status`، `/usage`، یا خلاصه‌های session را تغییر نمی‌دهند.
مصرف Gemini CLI هم نرمال‌سازی می‌شود: parser پیش‌فرض `stream-json` رویدادهای `message` مربوط به assistant را می‌خواند، و `stats.cached` به `cacheRead` نگاشت می‌شود و وقتی CLI فیلد صریح `stats.input` را حذف کند، از `stats.input_tokens - stats.cached` استفاده می‌شود. بازنویسی‌های JSON legacy همچنان متن پاسخ را از `response` می‌خوانند.
برای ترافیک بومی Responses خانواده OpenAI، نام‌های مستعار مصرف WebSocket/SSE به همین روش نرمال‌سازی می‌شوند، و وقتی `total_tokens` وجود نداشته باشد یا `0` باشد، مجموع‌ها به ورودی + خروجی نرمال‌شده fallback می‌کنند.
وقتی snapshot فعلی session کم‌جزئیات باشد، `/status` و `session_status` همچنین می‌توانند شمارنده‌های توکن/cache و برچسب مدل runtime فعال را از تازه‌ترین لاگ مصرف رونوشت بازیابی کنند. مقدارهای زنده غیرصفر موجود همچنان بر مقدارهای fallback رونوشت اولویت دارند، و وقتی مجموع‌های ذخیره‌شده وجود نداشته باشند یا کوچک‌تر باشند، مجموع‌های رونوشت بزرگ‌تر و prompt-oriented می‌توانند برنده شوند.
auth مصرف برای پنجره‌های سهمیه provider از hookهای مخصوص provider می‌آید، وقتی در دسترس باشند؛ در غیر این صورت OpenClaw به تطبیق credentials OAuth/API-key از پروفایل‌های auth، env، یا config fallback می‌کند.
ورودی‌های رونوشت assistant همان شکل مصرف نرمال‌شده را پایدار می‌کنند، از جمله
`usage.cost` وقتی مدل فعال قیمت‌گذاری پیکربندی‌شده داشته باشد و provider فراداده مصرف برگرداند. این به `/usage cost` و وضعیت session مبتنی بر رونوشت حتی پس از از بین رفتن وضعیت runtime زنده، یک منبع پایدار می‌دهد.

OpenClaw حسابداری مصرف provider را از snapshot زمینه فعلی جدا نگه می‌دارد. `usage.total` مربوط به provider می‌تواند ورودی cache‌شده، خروجی، و چندین فراخوانی مدل در حلقه ابزار را شامل شود، بنابراین برای هزینه و telemetry مفید است اما می‌تواند پنجره زمینه زنده را بیش از حد نشان دهد. نمایش‌ها و عیب‌یابی‌های زمینه از آخرین snapshot پرامپت (`promptTokens`، یا آخرین فراخوانی مدل وقتی snapshot پرامپت در دسترس نیست) برای `context.used` استفاده می‌کنند.

## تخمین هزینه (وقتی نمایش داده می‌شود)

هزینه‌ها از config قیمت‌گذاری مدل شما تخمین زده می‌شوند:

```
models.providers.<provider>.models[].cost
```

این‌ها **USD به‌ازای 1M توکن** برای `input`، `output`، `cacheRead`، و
`cacheWrite` هستند. اگر قیمت‌گذاری وجود نداشته باشد، OpenClaw فقط توکن‌ها را نشان می‌دهد. نمایش هزینه به auth با API-key محدود نیست: providerهای بدون API-key مانند `aws-sdk` وقتی ورودی مدل پیکربندی‌شده آن‌ها قیمت‌گذاری محلی داشته باشد و provider فراداده مصرف برگرداند، می‌توانند هزینه تخمینی را نشان دهند.

پس از آنکه sidecarها و channelها به مسیر آماده Gateway برسند، OpenClaw یک bootstrap اختیاری قیمت‌گذاری پس‌زمینه را برای model refهای پیکربندی‌شده‌ای شروع می‌کند که هنوز قیمت‌گذاری محلی ندارند. آن bootstrap کاتالوگ‌های قیمت‌گذاری remote OpenRouter و LiteLLM را دریافت می‌کند. برای رد کردن دریافت آن کاتالوگ‌ها در شبکه‌های آفلاین یا محدود، `models.pricing.enabled: false` را تنظیم کنید؛ ورودی‌های صریح `models.providers.*.models[].cost` همچنان تخمین‌های هزینه محلی را هدایت می‌کنند.

## اثر Cache TTL و pruning

کش‌کردن پرامپت در provider فقط در پنجره cache TTL اعمال می‌شود. OpenClaw می‌تواند به‌صورت اختیاری **cache-ttl pruning** را اجرا کند: پس از منقضی شدن cache TTL، session را prune می‌کند، سپس پنجره cache را بازنشانی می‌کند تا درخواست‌های بعدی بتوانند به‌جای cache کردن دوباره کل تاریخچه، از زمینه تازه cache‌شده دوباره استفاده کنند. این کار وقتی یک session بیشتر از TTL بی‌کار می‌ماند، هزینه‌های cache write را پایین‌تر نگه می‌دارد.

آن را در [پیکربندی Gateway](/fa/gateway/configuration) پیکربندی کنید و جزئیات رفتار را در [هرس session](/fa/concepts/session-pruning) ببینید.

Heartbeat می‌تواند cache را در فاصله‌های بی‌کاری **گرم** نگه دارد. اگر cache TTL مدل شما `1h` باشد، تنظیم فاصله heartbeat کمی کمتر از آن (مثلاً `55m`) می‌تواند از cache کردن دوباره کل پرامپت جلوگیری کند و هزینه‌های cache write را کاهش دهد.

در راه‌اندازی‌های چند agent، می‌توانید یک config مدل مشترک نگه دارید و رفتار cache را برای هر agent با `agents.list[].params.cacheRetention` تنظیم کنید.

برای راهنمای کامل تنظیم به تنظیم، [کش‌کردن پرامپت](/fa/reference/prompt-caching) را ببینید.

برای قیمت‌گذاری Anthropic API، خواندن‌های cache به‌طور معناداری ارزان‌تر از توکن‌های ورودی هستند، در حالی که نوشتن‌های cache با ضریب بالاتری محاسبه می‌شوند. برای تازه‌ترین نرخ‌ها و ضریب‌های TTL، قیمت‌گذاری کش‌کردن پرامپت Anthropic را ببینید:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### مثال: گرم نگه داشتن cache یک‌ساعته با heartbeat

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

### مثال: ترافیک ترکیبی با راهبرد cache برای هر agent

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

`agents.list[].params` روی `params` مدل انتخاب‌شده merge می‌شود، بنابراین می‌توانید فقط `cacheRetention` را بازنویسی کنید و بقیه پیش‌فرض‌های مدل را بدون تغییر به ارث ببرید.

### زمینه 1M Anthropic

OpenClaw اندازه مدل‌های Claude 4.x دارای GA مانند Opus 4.8، Opus 4.7، Opus 4.6، و
Sonnet 4.6 را با پنجره زمینه 1M Anthropic تعیین می‌کند. برای این مدل‌ها به
`params.context1m: true` نیاز ندارید.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

configهای قدیمی‌تر می‌توانند `context1m: true` را نگه دارند، اما OpenClaw دیگر سرآیند beta بازنشسته Anthropic یعنی `context-1m-2025-08-07` را برای این تنظیم ارسال نمی‌کند و مدل‌های Claude قدیمی‌تر پشتیبانی‌نشده را به 1M گسترش نمی‌دهد.

نیازمندی: credential باید واجد شرایط استفاده از زمینه بلند باشد. اگر نباشد،
Anthropic برای آن درخواست یک خطای rate limit سمت provider برمی‌گرداند.

اگر Anthropic را با توکن‌های OAuth/subscription (`sk-ant-oat-*`) احراز هویت کنید،
OpenClaw سرآیندهای beta ضروری برای OAuth در Anthropic را حفظ می‌کند و در عین حال اگر beta بازنشسته `context-1m-*` در config قدیمی‌تر باقی مانده باشد، آن را حذف می‌کند.

## نکته‌هایی برای کاهش فشار توکن

- برای خلاصه‌سازی sessionهای طولانی از `/compact` استفاده کنید.
- خروجی‌های بزرگ ابزار را در workflowهای خود کوتاه کنید.
- برای sessionهای سنگین از نظر screenshot، `agents.defaults.imageMaxDimensionPx` را پایین بیاورید.
- توضیحات skill را کوتاه نگه دارید (فهرست skill در پرامپت تزریق می‌شود).
- برای کارهای طولانی و اکتشافی، مدل‌های کوچک‌تر را ترجیح دهید.

برای فرمول دقیق سربار فهرست skill، [Skills](/fa/tools/skills) را ببینید.

## مرتبط

- [مصرف و هزینه‌های API](/fa/reference/api-usage-costs)
- [کش‌کردن پرامپت](/fa/reference/prompt-caching)
- [ردیابی مصرف](/fa/concepts/usage-tracking)
