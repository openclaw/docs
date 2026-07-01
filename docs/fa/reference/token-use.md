---
read_when:
    - توضیح استفاده از توکن، هزینه‌ها، یا پنجره‌های زمینه
    - اشکال‌زدایی رشد زمینه یا رفتار Compaction
summary: OpenClaw چگونه زمینهٔ پرامپت را می‌سازد و میزان استفاده از توکن + هزینه‌ها را گزارش می‌کند
title: مصرف توکن و هزینه‌ها
x-i18n:
    generated_at: "2026-07-01T18:17:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw **توکن‌ها** را ردیابی می‌کند، نه نویسه‌ها را. توکن‌ها وابسته به مدل هستند، اما بیشتر مدل‌های سبک OpenAI برای متن انگلیسی به‌طور میانگین حدود ۴ نویسه به‌ازای هر توکن دارند.

## شیوهٔ ساخت system prompt

OpenClaw در هر اجرا system prompt خودش را سرهم‌بندی می‌کند. این شامل موارد زیر است:

- فهرست ابزارها + توضیح‌های کوتاه
- فهرست Skills (فقط فراداده؛ دستورالعمل‌ها در صورت نیاز با `read` بارگذاری می‌شوند).
  نوبت‌های بومی Codex بلوک فشردهٔ Skills را به‌عنوان دستورالعمل‌های توسعه‌دهندهٔ همکاریِ محدود به همان نوبت دریافت می‌کنند؛ harnessهای دیگر آن را در سطح عادی prompt دریافت می‌کنند. این مقدار با `skills.limits.maxSkillsPromptChars` محدود می‌شود و در `agents.list[].skillsLimits.maxSkillsPromptChars` امکان override اختیاری برای هر agent وجود دارد.
- دستورالعمل‌های به‌روزرسانی خودکار
- Workspace + فایل‌های bootstrap (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md` هنگام جدید بودن، به‌همراه `MEMORY.md` در صورت وجود). نوبت‌های بومی Codex وقتی ابزارهای memory برای workspace پیکربندی‌شدهٔ agent در دسترس باشند، `MEMORY.md` خام را از آن workspace تزریق نمی‌کنند؛ آن‌ها یک اشاره‌گر کوچک memory را در دستورالعمل‌های توسعه‌دهندهٔ همکاریِ محدود به نوبت می‌گنجانند و در صورت نیاز از ابزارهای memory استفاده می‌کنند. اگر ابزارها غیرفعال باشند، جست‌وجوی memory در دسترس نباشد، یا workspace فعال با workspace حافظهٔ agent متفاوت باشد، `MEMORY.md` از مسیر عادی و محدودِ context نوبت استفاده می‌کند. ریشهٔ lowercase یعنی `memory.md` تزریق نمی‌شود؛ این ورودی تعمیر legacy برای `openclaw doctor --fix` است، وقتی همراه با `MEMORY.md` باشد. فایل‌های بزرگ تزریق‌شده با `agents.defaults.bootstrapMaxChars` کوتاه می‌شوند (پیش‌فرض: 20000)، و کل تزریق bootstrap با `agents.defaults.bootstrapTotalMaxChars` محدود می‌شود (پیش‌فرض: 60000). فایل‌های روزانهٔ `memory/*.md` بخشی از prompt عادی bootstrap نیستند؛ در نوبت‌های معمول همچنان از طریق ابزارهای memory به‌صورت درخواستی در دسترس می‌مانند، اما اجراهای reset/startup مدل می‌توانند برای همان نوبت اول یک بلوک یک‌بارهٔ startup-context با memory روزانهٔ اخیر را در ابتدا اضافه کنند. دستورهای گفت‌وگوی خام `/new` و `/reset` بدون فراخوانی مدل تأیید می‌شوند. پیش‌درآمد startup با `agents.defaults.startupContext` کنترل می‌شود. گزیده‌های AGENTS.md پس از Compaction جدا هستند و به opt-in صریح `agents.defaults.compaction.postCompactionSections` نیاز دارند.
- زمان (UTC + منطقهٔ زمانی کاربر)
- تگ‌های پاسخ + رفتار Heartbeat
- فرادادهٔ runtime (host/OS/model/thinking)

جزئیات کامل را در [System Prompt](/fa/concepts/system-prompt) ببینید.

هنگام مستندسازی credentialها یا snippetهای auth، از
[Secret Placeholder Conventions](/fa/reference/secret-placeholder-conventions) استفاده کنید تا در تغییرات فقط مستندات، false positiveهای secret-scanner ایجاد نشود.

## چه چیزهایی در پنجرهٔ context حساب می‌شوند

هر چیزی که مدل دریافت می‌کند به‌سمت سقف context شمرده می‌شود:

- System prompt (همهٔ بخش‌های فهرست‌شده در بالا)
- تاریخچهٔ مکالمه (پیام‌های کاربر + assistant)
- فراخوانی‌های ابزار و نتایج ابزار
- پیوست‌ها/transcriptها (تصویر، صدا، فایل)
- خلاصه‌های Compaction و artifactهای pruning
- wrapperهای provider یا headerهای ایمنی (قابل مشاهده نیستند، اما همچنان شمرده می‌شوند)

برخی سطح‌های runtime-heavy سقف‌های صریح خودشان را دارند:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

overrideهای هر agent زیر `agents.list[].contextLimits` قرار دارند. این knobها برای گزیده‌های محدود runtime و بلوک‌های تزریق‌شدهٔ متعلق به runtime هستند. آن‌ها از سقف‌های bootstrap، سقف‌های startup-context و سقف‌های prompt مربوط به Skills جدا هستند.

`toolResultMaxChars` یک سقف پیشرفته است (تا `1000000` نویسه). وقتی تنظیم نشده باشد، OpenClaw سقف زندهٔ نتیجهٔ ابزار را از پنجرهٔ context مؤثر مدل انتخاب می‌کند: `16000` نویسه زیر 100K توکن، `32000` نویسه در 100K+ توکن، و `64000` نویسه در 200K+ توکن، همچنان محدودشده با guard سهم context در runtime.

برای تصویرها، OpenClaw payloadهای تصویر transcript/ابزار را پیش از فراخوانی provider downscale می‌کند.
برای تنظیم این رفتار از `agents.defaults.imageMaxDimensionPx` استفاده کنید (پیش‌فرض: `1200`):

- مقدارهای کمتر معمولاً مصرف vision-token و اندازهٔ payload را کاهش می‌دهند.
- مقدارهای بیشتر جزئیات بصری بیشتری را برای screenshotهای OCR/UI-heavy حفظ می‌کنند.

برای یک تفکیک عملی (به‌ازای هر فایل تزریق‌شده، ابزارها، Skills، و اندازهٔ system prompt)، از `/context list` یا `/context detail` استفاده کنید. [Context](/fa/concepts/context) را ببینید.

## شیوهٔ دیدن مصرف فعلی توکن

در chat از این‌ها استفاده کنید:

- `/status` → **کارت وضعیت پر از emoji** با مدل session، مصرف context،
  توکن‌های input/output آخرین پاسخ، و **هزینهٔ تخمینی** وقتی pricing محلی برای مدل فعال پیکربندی شده باشد.
- `/usage off|tokens|full` → یک **footer مصرف برای هر پاسخ** را به هر پاسخ اضافه می‌کند.
  - برای هر session پایدار می‌ماند (به‌صورت `responseUsage` ذخیره می‌شود).
  - `/usage reset` (aliasها: `inherit`، `clear`، `default`) — override مربوط به session را پاک می‌کند تا session دوباره پیش‌فرض پیکربندی‌شده را به ارث ببرد.
  - `/usage tokens` جزئیات token/cache نوبت را نشان می‌دهد.
  - `/usage full` جزئیات فشردهٔ model/context/cost را نشان می‌دهد؛ هزینهٔ تخمینی فقط وقتی ظاهر می‌شود که OpenClaw فرادادهٔ usage و pricing محلی برای مدل فعال داشته باشد.
    layoutهای سفارشی `messages.usageTemplate` می‌توانند فیلدهای token/cache را شامل شوند.
- `/usage cost` → خلاصهٔ هزینهٔ محلی را از logهای session در OpenClaw نشان می‌دهد.

سطح‌های دیگر:

- **TUI/Web TUI:** `/status` + `/usage` پشتیبانی می‌شوند.
- **CLI:** `openclaw status --usage` و `openclaw channels list` پنجره‌های سهمیهٔ provider نرمال‌سازی‌شده را نشان می‌دهند (`X% left`، نه هزینه‌های هر پاسخ).
  providerهای فعلیِ usage-window: Anthropic، GitHub Copilot، Gemini CLI،
  OpenAI Codex، MiniMax، Xiaomi، و z.ai.

سطح‌های usage پیش از نمایش، aliasهای رایج فیلدهای بومی provider را نرمال‌سازی می‌کنند.
برای ترافیک Responses خانوادهٔ OpenAI، این شامل هر دو `input_tokens` /
`output_tokens` و `prompt_tokens` / `completion_tokens` است، بنابراین نام فیلدهای وابسته به transport، `/status`، `/usage`، یا خلاصه‌های session را تغییر نمی‌دهند.
usage مربوط به Gemini CLI نیز نرمال‌سازی می‌شود: parser پیش‌فرض `stream-json` رویدادهای `message` از assistant را می‌خواند، و `stats.cached` به `cacheRead` نگاشت می‌شود و وقتی CLI فیلد صریح `stats.input` را حذف کند، از `stats.input_tokens - stats.cached` استفاده می‌شود. overrideهای JSON legacy همچنان متن پاسخ را از `response` می‌خوانند.
برای ترافیک بومی Responses خانوادهٔ OpenAI، aliasهای usage در WebSocket/SSE به همین شکل نرمال‌سازی می‌شوند، و وقتی `total_tokens` وجود نداشته باشد یا `0` باشد، مجموع‌ها به input + output نرمال‌سازی‌شده fallback می‌کنند.
وقتی snapshot فعلی session کم‌اطلاعات باشد، `/status` و `session_status` می‌توانند شمارنده‌های token/cache و label مدل runtime فعال را نیز از جدیدترین usage log در transcript بازیابی کنند. مقدارهای زندهٔ nonzero موجود همچنان بر مقدارهای fallback از transcript اولویت دارند، و مجموع‌های بزرگ‌تر transcript که prompt-oriented هستند می‌توانند وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌تر هستند، برنده شوند.
auth مربوط به usage برای پنجره‌های سهمیهٔ provider وقتی در دسترس باشد از hookهای مخصوص provider می‌آید؛ در غیر این صورت OpenClaw به credentialهای OAuth/API-key مطابق از auth profileها، env، یا config fallback می‌کند.
ورودی‌های transcript مربوط به assistant همان شکل usage نرمال‌سازی‌شده را پایدار می‌کنند، از جمله `usage.cost` وقتی مدل فعال pricing پیکربندی‌شده داشته باشد و provider فرادادهٔ usage برگرداند. این به `/usage cost` و وضعیت session مبتنی بر transcript یک منبع پایدار می‌دهد، حتی پس از آنکه وضعیت live runtime از بین رفته باشد.

OpenClaw حسابداری usage مربوط به provider را از snapshot فعلی context جدا نگه می‌دارد. `usage.total` provider می‌تواند شامل input کش‌شده، output، و چندین فراخوانی مدل در tool-loop باشد، بنابراین برای هزینه و telemetry مفید است اما می‌تواند پنجرهٔ context زنده را بیشتر از واقع نشان دهد. نمایش‌ها و diagnosticهای context از آخرین snapshot مربوط به prompt (`promptTokens`، یا آخرین فراخوانی مدل وقتی snapshot prompt در دسترس نیست) برای `context.used` استفاده می‌کنند.

## برآورد هزینه (وقتی نمایش داده می‌شود)

هزینه‌ها از config مربوط به pricing مدل شما برآورد می‌شوند:

```
models.providers.<provider>.models[].cost
```

این‌ها **دلار آمریکا به‌ازای ۱ میلیون توکن** برای `input`، `output`، `cacheRead`، و
`cacheWrite` هستند. اگر pricing وجود نداشته باشد، `/usage full` هزینه را حذف می‌کند؛ وقتی در هر پاسخ به جزئیات token/cache نیاز دارید، از `/usage tokens` یا یک `messages.usageTemplate` سفارشی استفاده کنید. نمایش هزینه به auth از نوع API-key محدود نیست: providerهای غیر API-key مانند `aws-sdk` هم وقتی entry مدل پیکربندی‌شدهٔ آن‌ها شامل pricing محلی باشد و provider فرادادهٔ usage برگرداند، می‌توانند هزینهٔ تخمینی را نشان دهند.

پس از آنکه sidecarها و channelها به مسیر آمادهٔ Gateway برسند، OpenClaw یک bootstrap اختیاری pricing در پس‌زمینه را برای refهای مدل پیکربندی‌شده‌ای شروع می‌کند که از قبل pricing محلی ندارند. آن bootstrap کاتالوگ‌های pricing راه‌دور OpenRouter و LiteLLM را fetch می‌کند. برای رد کردن آن fetchهای کاتالوگ در شبکه‌های آفلاین یا محدود، `models.pricing.enabled: false` را تنظیم کنید؛ entryهای صریح
`models.providers.*.models[].cost` همچنان برآوردهای هزینهٔ محلی را پیش می‌برند.

## اثر Cache TTL و pruning

کش prompt در provider فقط درون پنجرهٔ cache TTL اعمال می‌شود. OpenClaw می‌تواند به‌صورت اختیاری **cache-ttl pruning** را اجرا کند: پس از منقضی شدن cache TTL، session را prune می‌کند، سپس پنجرهٔ cache را reset می‌کند تا requestهای بعدی بتوانند به‌جای cache کردن دوبارهٔ کل تاریخچه، از context تازه cache‌شده دوباره استفاده کنند. این کار وقتی یک session بیشتر از TTL idle می‌ماند، هزینه‌های cache write را پایین‌تر نگه می‌دارد.

آن را در [Gateway configuration](/fa/gateway/configuration) پیکربندی کنید و جزئیات رفتار را در [Session pruning](/fa/concepts/session-pruning) ببینید.

Heartbeat می‌تواند cache را در فاصله‌های idle **گرم** نگه دارد. اگر TTL کش مدل شما `1h` باشد، تنظیم فاصلهٔ heartbeat کمی کمتر از آن (مثلاً `55m`) می‌تواند از cache کردن دوبارهٔ کل prompt جلوگیری کند و هزینه‌های cache write را کاهش دهد.

در setupهای چند-agent، می‌توانید یک config مدل مشترک نگه دارید و رفتار cache را برای هر agent با `agents.list[].params.cacheRetention` تنظیم کنید.

برای راهنمای کامل knob-by-knob، [Prompt Caching](/fa/reference/prompt-caching) را ببینید.

برای pricing API مربوط به Anthropic، cache readها به‌طور چشمگیری از توکن‌های input ارزان‌تر هستند، در حالی که cache writeها با ضریب بالاتری صورت‌حساب می‌شوند. برای آخرین نرخ‌ها و ضریب‌های TTL، pricing کش prompt در Anthropic را ببینید:
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

### مثال: ترافیک ترکیبی با استراتژی cache برای هر agent

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

`agents.list[].params` روی `params` مدل انتخاب‌شده merge می‌شود، بنابراین می‌توانید فقط `cacheRetention` را override کنید و سایر پیش‌فرض‌های مدل را بدون تغییر به ارث ببرید.

### Anthropic 1M context

OpenClaw مدل‌های Claude 4.x با قابلیت GA مانند Opus 4.8، Opus 4.7، Opus 4.6، و
Sonnet 4.6 را با پنجرهٔ context یک‌میلیونی Anthropic اندازه‌گذاری می‌کند. برای این مدل‌ها به `params.context1m: true` نیاز ندارید.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

configهای قدیمی‌تر می‌توانند `context1m: true` را نگه دارند، اما OpenClaw دیگر header بتای بازنشستهٔ Anthropic یعنی `context-1m-2025-08-07` را برای این setting ارسال نمی‌کند و مدل‌های قدیمی‌تر Claude را که پشتیبانی نمی‌شوند به 1M گسترش نمی‌دهد.

نیازمندی: credential باید واجد شرایط استفاده از long-context باشد. در غیر این صورت، Anthropic برای آن request با خطای rate limit سمت provider پاسخ می‌دهد.

اگر برای Anthropic با tokenهای OAuth/subscription (`sk-ant-oat-*`) احراز هویت کنید، OpenClaw headerهای بتای Anthropic موردنیاز OAuth را حفظ می‌کند و همزمان اگر بتای بازنشستهٔ `context-1m-*` در config قدیمی‌تر باقی مانده باشد، آن را حذف می‌کند.

## نکته‌هایی برای کاهش فشار توکن

- از `/compact` برای خلاصه‌سازی نشست‌های طولانی استفاده کنید.
- خروجی‌های بزرگ ابزار را در گردش‌کارهای خود کوتاه کنید.
- برای نشست‌هایی که اسکرین‌شات زیادی دارند، `agents.defaults.imageMaxDimensionPx` را کاهش دهید.
- توضیحات skill را کوتاه نگه دارید (فهرست skill به پرامپت تزریق می‌شود).
- برای کارهای پرشرح و اکتشافی، مدل‌های کوچک‌تر را ترجیح دهید.

برای فرمول دقیق سربار فهرست skill، [Skills](/fa/tools/skills) را ببینید.

## مرتبط

- [مصرف و هزینه‌های API](/fa/reference/api-usage-costs)
- [ذخیره‌سازی پرامپت در کش](/fa/reference/prompt-caching)
- [ردیابی مصرف](/fa/concepts/usage-tracking)
