---
read_when:
    - تشخیص رفتار چرخش پروفایل احراز هویت، دوره‌های انتظار، یا بازگشت به مدل جایگزین
    - به‌روزرسانی قواعد جایگزینی خودکار برای پروفایل‌های احراز هویت یا مدل‌ها
    - درک نحوهٔ تعامل بازتعریف‌های مدل نشست با تلاش‌های مجددِ گزینهٔ پشتیبان
sidebarTitle: Model failover
summary: OpenClaw چگونه پروفایل‌های احراز هویت را چرخش می‌دهد و میان مدل‌ها به گزینه‌های جایگزین برمی‌گردد
title: جایگزینی اضطراری مدل
x-i18n:
    generated_at: "2026-05-06T09:11:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw خرابی‌ها را در دو مرحله مدیریت می‌کند:

1. **چرخش پروفایل احراز هویت** درون provider فعلی.
2. **fallback مدل** به مدل بعدی در `agents.defaults.model.fallbacks`.

این سند قواعد زمان اجرا و داده‌هایی را که پشتوانهٔ آن‌ها هستند توضیح می‌دهد.

## جریان زمان اجرا

برای یک اجرای متنی عادی، OpenClaw گزینه‌ها را به این ترتیب ارزیابی می‌کند:

<Steps>
  <Step title="Resolve session state">
    مدل نشست فعال و ترجیح پروفایل احراز هویت را حل می‌کند.
  </Step>
  <Step title="Build candidate chain">
    زنجیرهٔ گزینه‌های مدل را از انتخاب مدل فعلی و سیاست fallback برای منبع آن انتخاب می‌سازد. پیش‌فرض‌های پیکربندی‌شده، مدل‌های اصلی کارهای cron، و مدل‌های fallback که به‌صورت خودکار انتخاب شده‌اند می‌توانند از fallbackهای پیکربندی‌شده استفاده کنند؛ انتخاب‌های صریح نشست کاربر سخت‌گیرانه هستند.
  </Step>
  <Step title="Try the current provider">
    provider فعلی را با قواعد چرخش/دورهٔ انتظار پروفایل احراز هویت امتحان می‌کند.
  </Step>
  <Step title="Advance on failover-worthy errors">
    اگر آن provider با خطایی شایستهٔ failover تمام شود، به گزینهٔ مدل بعدی می‌رود.
  </Step>
  <Step title="Persist fallback override">
    بازنویسی fallback انتخاب‌شده را پیش از شروع تلاش دوباره پایدار می‌کند تا خواننده‌های دیگر نشست همان provider/model را ببینند که runner قرار است استفاده کند. بازنویسی مدل پایدارشده با `modelOverrideSource: "auto"` علامت‌گذاری می‌شود.
  </Step>
  <Step title="Roll back narrowly on failure">
    اگر گزینهٔ fallback شکست بخورد، فقط فیلدهای بازنویسی نشست متعلق به fallback را زمانی برمی‌گرداند که هنوز با همان گزینهٔ شکست‌خورده مطابقت داشته باشند.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    اگر همهٔ گزینه‌ها شکست بخورند، یک `FallbackSummaryError` با جزئیات هر تلاش و نزدیک‌ترین زمان پایان دورهٔ انتظار، اگر معلوم باشد، پرتاب می‌کند.
  </Step>
</Steps>

این عمداً محدودتر از «ذخیره و بازیابی کل نشست» است. runner پاسخ فقط فیلدهای انتخاب مدل را که برای fallback مالک آن‌هاست پایدار می‌کند:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

این کار مانع می‌شود تلاش دوبارهٔ fallback شکست‌خورده، تغییرات نامرتبط و جدیدتر نشست مانند تغییرات دستی `/model` یا به‌روزرسانی‌های چرخش نشست را که هنگام اجرای تلاش رخ داده‌اند بازنویسی کند.

## سیاست منبع انتخاب

OpenClaw مدل/provider انتخاب‌شده را از دلیل انتخاب آن جدا می‌کند. آن منبع تعیین می‌کند که آیا زنجیرهٔ fallback مجاز است یا نه:

- **پیش‌فرض پیکربندی‌شده**: `agents.defaults.model.primary` از `agents.defaults.model.fallbacks` استفاده می‌کند.
- **مدل اصلی agent**: `agents.list[].model` سخت‌گیرانه است مگر اینکه شیء مدل آن agent شامل `fallbacks` خودش باشد. از `fallbacks: []` استفاده کنید تا رفتار سخت‌گیرانه صریح شود، یا یک فهرست غیرخالی بدهید تا fallback مدل برای آن agent فعال شود.
- **بازنویسی fallback خودکار**: یک fallback زمان اجرا پیش از تلاش دوباره، `providerOverride`، `modelOverride`، و `modelOverrideSource: "auto"` را می‌نویسد. آن بازنویسی خودکار می‌تواند زنجیرهٔ fallback پیکربندی‌شده را ادامه دهد و با `/new`، `/reset`، و `sessions.reset` پاک می‌شود.
- **بازنویسی نشست کاربر**: `/model`، انتخاب‌گر مدل، `session_status(model=...)`، و `sessions.patch` مقدار `modelOverrideSource: "user"` را می‌نویسند. این یک انتخاب دقیق برای نشست است. اگر provider/model انتخاب‌شده پیش از تولید پاسخ شکست بخورد، OpenClaw به‌جای پاسخ دادن از یک fallback پیکربندی‌شدهٔ نامرتبط، خرابی را گزارش می‌کند.
- **بازنویسی نشست قدیمی**: ورودی‌های قدیمی‌تر نشست ممکن است `modelOverride` را بدون `modelOverrideSource` داشته باشند. OpenClaw آن‌ها را بازنویسی‌های کاربر در نظر می‌گیرد تا یک انتخاب صریح قدیمی بی‌صدا به رفتار fallback تبدیل نشود.
- **مدل payload مربوط به Cron**: مقدار `payload.model` / `--model` در یک کار cron، مدل اصلی کار است، نه بازنویسی نشست کاربر. مگر اینکه کار `payload.fallbacks` ارائه کند، از fallbackهای پیکربندی‌شده استفاده می‌کند؛ `payload.fallbacks: []` اجرای cron را سخت‌گیرانه می‌کند.

## ذخیره‌سازی احراز هویت (کلیدها + OAuth)

OpenClaw هم برای کلیدهای API و هم برای توکن‌های OAuth از **پروفایل‌های احراز هویت** استفاده می‌کند.

- secretها در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارند (قدیمی: `~/.openclaw/agent/auth-profiles.json`).
- وضعیت مسیریابی احراز هویت زمان اجرا در `~/.openclaw/agents/<agentId>/agent/auth-state.json` قرار دارد.
- پیکربندی `auth.profiles` / `auth.order` فقط **فراداده + مسیریابی** هستند (بدون secret).
- فایل OAuth قدیمیِ فقط برای import: `~/.openclaw/credentials/oauth.json` (در اولین استفاده به `auth-profiles.json` import می‌شود).

جزئیات بیشتر: [OAuth](/fa/concepts/oauth)

انواع credential:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` برای بعضی providerها)

## شناسه‌های پروفایل

ورودهای OAuth پروفایل‌های جداگانه می‌سازند تا چند حساب بتوانند هم‌زمان وجود داشته باشند.

- پیش‌فرض: `provider:default` وقتی ایمیلی در دسترس نیست.
- OAuth با ایمیل: `provider:<email>` (برای مثال `google-antigravity:user@gmail.com`).

پروفایل‌ها در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` زیر `profiles` قرار دارند.

## ترتیب چرخش

وقتی یک provider چند پروفایل دارد، OpenClaw ترتیب را به این شکل انتخاب می‌کند:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (اگر تنظیم شده باشد).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` که بر اساس provider فیلتر شده است.
  </Step>
  <Step title="Stored profiles">
    ورودی‌های موجود در `auth-profiles.json` برای آن provider.
  </Step>
</Steps>

اگر ترتیب صریحی پیکربندی نشده باشد، OpenClaw از ترتیب round-robin استفاده می‌کند:

- **کلید اصلی:** نوع پروفایل (**OAuth پیش از کلیدهای API**).
- **کلید ثانویه:** `usageStats.lastUsed` (قدیمی‌ترین ابتدا، درون هر نوع).
- **پروفایل‌های در دورهٔ انتظار/غیرفعال** به انتها منتقل می‌شوند و بر اساس نزدیک‌ترین زمان پایان مرتب می‌شوند.

### چسبندگی نشست (سازگار با cache)

OpenClaw برای گرم نگه داشتن cacheهای provider، **پروفایل احراز هویت انتخاب‌شده را برای هر نشست pin می‌کند**. در هر درخواست چرخش انجام نمی‌دهد. پروفایل pin‌شده دوباره استفاده می‌شود تا زمانی که:

- نشست reset شود (`/new` / `/reset`)
- یک Compaction کامل شود (شمارندهٔ Compaction افزایش یابد)
- پروفایل در دورهٔ انتظار/غیرفعال باشد

انتخاب دستی از طریق `/model …@<profileId>` یک **بازنویسی کاربر** برای آن نشست تنظیم می‌کند و تا شروع نشست جدید به‌صورت خودکار چرخش نمی‌کند.

<Note>
پروفایل‌های auto-pinned (که router نشست انتخاب کرده است) به‌عنوان یک **ترجیح** در نظر گرفته می‌شوند: ابتدا آن‌ها امتحان می‌شوند، اما OpenClaw ممکن است در صورت rate limit یا timeout به پروفایل دیگری بچرخد. پروفایل‌های user-pinned روی همان پروفایل قفل می‌مانند؛ اگر شکست بخورد و fallbackهای مدل پیکربندی شده باشند، OpenClaw به‌جای تغییر پروفایل، به مدل بعدی می‌رود.
</Note>

### چرا OAuth ممکن است «گم‌شده به نظر برسد»

اگر برای یک provider هم پروفایل OAuth و هم پروفایل کلید API داشته باشید، round-robin می‌تواند بین پیام‌ها میان آن‌ها جابه‌جا شود مگر اینکه pin شده باشد. برای اجبار به یک پروفایل واحد:

- با `auth.order[provider] = ["provider:profileId"]` آن را pin کنید، یا
- از بازنویسی هر نشست از طریق `/model …` همراه با بازنویسی پروفایل استفاده کنید (وقتی سطح UI/چت شما پشتیبانی کند).

## دوره‌های انتظار

وقتی یک پروفایل به‌دلیل خطاهای احراز هویت/rate-limit (یا timeoutی که شبیه rate limiting است) شکست بخورد، OpenClaw آن را در دورهٔ انتظار علامت‌گذاری می‌کند و به پروفایل بعدی می‌رود.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    آن bucket مربوط به rate-limit گسترده‌تر از `429` ساده است: پیام‌های provider مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، `throttled`، `resource exhausted`، و محدودیت‌های دوره‌ای پنجرهٔ مصرف مانند `weekly/monthly limit reached` را هم شامل می‌شود.

    خطاهای format/invalid-request (برای مثال خرابی‌های اعتبارسنجی شناسهٔ tool call در Cloud Code Assist) به‌عنوان شایستهٔ failover در نظر گرفته می‌شوند و از همان دوره‌های انتظار استفاده می‌کنند. خطاهای stop-reason سازگار با OpenAI مانند `Unhandled stop reason: error`، `stop reason: error`، و `reason: error` به‌عنوان سیگنال‌های timeout/failover دسته‌بندی می‌شوند.

    متن عمومی server هم وقتی منبع با یک الگوی transient شناخته‌شده مطابقت داشته باشد، می‌تواند در آن bucket مربوط به timeout قرار بگیرد. برای مثال، پیام سادهٔ stream-wrapper مربوط به pi-ai یعنی `An unknown error occurred` برای هر provider شایستهٔ failover در نظر گرفته می‌شود، چون pi-ai وقتی streamهای provider با `stopReason: "aborted"` یا `stopReason: "error"` بدون جزئیات مشخص پایان می‌یابند، آن را منتشر می‌کند. payloadهای JSON از نوع `api_error` با متن transient server مانند `internal server error`، `unknown error, 520`، `upstream error`، یا `backend error` نیز به‌عنوان timeoutهای شایستهٔ failover در نظر گرفته می‌شوند.

    متن عمومی upstream مخصوص OpenRouter مانند `Provider returned error` فقط وقتی به‌عنوان timeout در نظر گرفته می‌شود که زمینهٔ provider واقعاً OpenRouter باشد. متن عمومی fallback داخلی مانند `LLM request failed with an unknown error.` محافظه‌کارانه باقی می‌ماند و به‌خودی‌خود failover را فعال نمی‌کند.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    بعضی SDKهای provider ممکن است در غیر این صورت پیش از بازگرداندن کنترل به OpenClaw برای یک پنجرهٔ طولانی `Retry-After` بخوابند. برای SDKهای مبتنی بر Stainless مانند Anthropic و OpenAI، OpenClaw به‌صورت پیش‌فرض انتظارهای داخلی SDK از نوع `retry-after-ms` / `retry-after` را به ۶۰ ثانیه محدود می‌کند و پاسخ‌های retryable طولانی‌تر را فوراً سطح‌دهی می‌کند تا این مسیر failover بتواند اجرا شود. سقف را با `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` تنظیم یا غیرفعال کنید؛ [رفتار retry](/fa/concepts/retry) را ببینید.
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    دوره‌های انتظار rate-limit می‌توانند به مدل نیز محدود باشند:

    - OpenClaw برای خرابی‌های rate-limit وقتی شناسهٔ مدل شکست‌خورده معلوم باشد، `cooldownModel` را ثبت می‌کند.
    - یک مدل sibling روی همان provider همچنان می‌تواند امتحان شود وقتی دورهٔ انتظار به مدل دیگری محدود شده باشد.
    - پنجره‌های billing/disabled همچنان کل پروفایل را در همهٔ مدل‌ها مسدود می‌کنند.

  </Accordion>
</AccordionGroup>

دوره‌های انتظار از backoff نمایی استفاده می‌کنند:

- ۱ دقیقه
- ۵ دقیقه
- ۲۵ دقیقه
- ۱ ساعت (سقف)

وضعیت در `auth-state.json` زیر `usageStats` ذخیره می‌شود:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## غیرفعال‌سازی‌های billing

خرابی‌های billing/credit (برای مثال "insufficient credits" / "credit balance too low") به‌عنوان شایستهٔ failover در نظر گرفته می‌شوند، اما معمولاً transient نیستند. به‌جای یک دورهٔ انتظار کوتاه، OpenClaw پروفایل را **غیرفعال** علامت‌گذاری می‌کند (با backoff طولانی‌تر) و به پروفایل/provider بعدی می‌چرخد.

<Note>
هر پاسخ شبیه billing الزاماً `402` نیست، و هر HTTP `402` اینجا قرار نمی‌گیرد. OpenClaw متن billing صریح را حتی وقتی provider به‌جای آن `401` یا `403` برگرداند، در مسیر billing نگه می‌دارد، اما matcherهای مخصوص provider محدود به همان providerی می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `403 Key limit exceeded`).

در همین حال، خطاهای موقتی `402` مربوط به پنجرهٔ مصرف و محدودیت هزینهٔ سازمان/workspace وقتی پیام retryable به نظر برسد (برای مثال `weekly usage limit exhausted`، `daily limit reached, resets tomorrow`، یا `organization spending limit exceeded`) به‌عنوان `rate_limit` دسته‌بندی می‌شوند. آن‌ها به‌جای مسیر طولانی غیرفعال‌سازی billing، در مسیر کوتاه دورهٔ انتظار/failover باقی می‌مانند.
</Note>

وضعیت در `auth-state.json` ذخیره می‌شود:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

پیش‌فرض‌ها:

- backoff مربوط به billing از **۵ ساعت** شروع می‌شود، با هر خرابی billing دو برابر می‌شود، و در **۲۴ ساعت** سقف می‌خورد.
- اگر پروفایل برای **۲۴ ساعت** شکست نخورده باشد، شمارنده‌های backoff reset می‌شوند (قابل پیکربندی).
- retryهای overload پیش از fallback مدل، **۱ چرخش پروفایل در همان provider** را مجاز می‌کنند.
- retryهای overload به‌صورت پیش‌فرض از **۰ ms backoff** استفاده می‌کنند.

## fallback مدل

اگر همهٔ پروفایل‌های یک provider شکست بخورند، OpenClaw به مدل بعدی در `agents.defaults.model.fallbacks` می‌رود. این برای خرابی‌های احراز هویت، rate limitها، و timeoutهایی اعمال می‌شود که چرخش پروفایل را تمام کرده‌اند (خطاهای دیگر fallback را جلو نمی‌برند). خطاهای provider که جزئیات کافی ارائه نمی‌کنند همچنان در وضعیت fallback دقیقاً برچسب‌گذاری می‌شوند: `empty_response` یعنی provider هیچ پیام یا status قابل استفاده‌ای برنگردانده است، `no_error_details` یعنی provider صراحتاً `Unknown error (no error details in response)` را برگردانده است، و `unclassified` یعنی OpenClaw پیش‌نمایش خام را حفظ کرده اما هنوز هیچ classifierی با آن منطبق نشده است.

خطاهای اضافه‌بار و محدودیت نرخ با شدت بیشتری نسبت به cooldownهای صورتحساب مدیریت می‌شوند. به‌طور پیش‌فرض، OpenClaw اجازه می‌دهد یک بار auth-profile همان ارائه‌دهنده دوباره امتحان شود، سپس بدون انتظار به fallback مدل پیکربندی‌شده بعدی جابه‌جا می‌شود. سیگنال‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` در همان دسته اضافه‌بار قرار می‌گیرند. این رفتار را با `auth.cooldowns.overloadedProfileRotations`، `auth.cooldowns.overloadedBackoffMs` و `auth.cooldowns.rateLimitedProfileRotations` تنظیم کنید.

وقتی یک اجرا از primary پیش‌فرض پیکربندی‌شده، primary یک cron job، primary یک عامل با fallbackهای صریح، یا یک override fallback انتخاب‌شده به‌صورت خودکار شروع می‌شود، OpenClaw می‌تواند زنجیره fallback پیکربندی‌شده مطابق را طی کند. primaryهای عامل بدون fallbackهای صریح و انتخاب‌های صریح کاربر (برای مثال `/model ollama/qwen3.5:27b`، انتخابگر مدل، `sessions.patch`، یا overrideهای یک‌باره ارائه‌دهنده/مدل در CLI) سخت‌گیرانه‌اند: اگر آن ارائه‌دهنده/مدل در دسترس نباشد یا پیش از تولید پاسخ شکست بخورد، OpenClaw به‌جای پاسخ‌دادن از یک fallback نامرتبط، شکست را گزارش می‌کند.

### قواعد زنجیره نامزدها

OpenClaw فهرست نامزدها را از `provider/model` درخواستی فعلی به‌علاوه fallbackهای پیکربندی‌شده می‌سازد.

<AccordionGroup>
  <Accordion title="قواعد">
    - مدل درخواستی همیشه اول است.
    - fallbackهای صریح پیکربندی‌شده deduplicate می‌شوند اما بر اساس allowlist مدل فیلتر نمی‌شوند. آن‌ها به‌عنوان قصد صریح اپراتور در نظر گرفته می‌شوند.
    - اگر اجرای فعلی از قبل روی یک fallback پیکربندی‌شده در همان خانواده ارائه‌دهنده باشد، OpenClaw همچنان از زنجیره کامل پیکربندی‌شده استفاده می‌کند.
    - اگر اجرای فعلی روی ارائه‌دهنده‌ای متفاوت از پیکربندی باشد و آن مدل فعلی از قبل بخشی از زنجیره fallback پیکربندی‌شده نباشد، OpenClaw fallbackهای پیکربندی‌شده نامرتبط از ارائه‌دهنده‌ای دیگر را اضافه نمی‌کند.
    - وقتی override fallback صریحی به fallback runner داده نشده باشد، primary پیکربندی‌شده در انتها اضافه می‌شود تا زنجیره بتواند پس از تمام‌شدن نامزدهای قبلی به پیش‌فرض معمول برگردد.
    - وقتی فراخواننده `fallbacksOverride` را ارائه می‌کند، runner دقیقاً از مدل درخواستی به‌علاوه همان فهرست override استفاده می‌کند. فهرست خالی، fallback مدل را غیرفعال می‌کند و مانع از آن می‌شود که primary پیکربندی‌شده به‌عنوان هدف retry پنهان اضافه شود.

  </Accordion>
</AccordionGroup>

### کدام خطاها fallback را پیش می‌برند

<Tabs>
  <Tab title="ادامه می‌دهد روی">
    - شکست‌های احراز هویت
    - محدودیت‌های نرخ و تمام‌شدن cooldown
    - خطاهای اضافه‌بار/مشغول‌بودن ارائه‌دهنده
    - خطاهای failover با شکل timeout
    - غیرفعال‌سازی‌های صورتحساب
    - `LiveSessionModelSwitchError`، که به مسیر failover نرمال‌سازی می‌شود تا یک مدل persistشده قدیمی باعث ایجاد حلقه retry بیرونی نشود
    - خطاهای ناشناخته دیگر وقتی هنوز نامزدهایی باقی مانده‌اند

  </Tab>
  <Tab title="ادامه نمی‌دهد روی">
    - abortهای صریحی که شکل timeout/failover ندارند
    - خطاهای سرریز context که باید داخل منطق compaction/retry بمانند (برای مثال `request_too_large`، `INVALID_ARGUMENT: input exceeds the maximum number of tokens`، `input token count exceeds the maximum number of input tokens`، `The input is too long for the model`، یا `ollama error: context length exceeded`)
    - خطای ناشناخته نهایی وقتی هیچ نامزدی باقی نمانده است

  </Tab>
</Tabs>

### رفتار ردکردن cooldown در برابر probe

وقتی همه auth profileهای یک ارائه‌دهنده از قبل در cooldown باشند، OpenClaw به‌طور خودکار آن ارائه‌دهنده را برای همیشه رد نمی‌کند. برای هر نامزد جداگانه تصمیم می‌گیرد:

<AccordionGroup>
  <Accordion title="تصمیم‌های هر نامزد">
    - شکست‌های پایدار احراز هویت فوراً کل ارائه‌دهنده را رد می‌کنند.
    - غیرفعال‌سازی‌های صورتحساب معمولاً رد می‌شوند، اما نامزد primary همچنان می‌تواند با throttle probe شود تا بازیابی بدون راه‌اندازی مجدد ممکن باشد.
    - نامزد primary ممکن است نزدیک زمان انقضای cooldown، با یک throttle برای هر ارائه‌دهنده probe شود.
    - siblingهای fallback همان ارائه‌دهنده می‌توانند با وجود cooldown امتحان شوند، وقتی شکست گذرا به نظر برسد (`rate_limit`، `overloaded`، یا ناشناخته). این موضوع به‌ویژه وقتی محدودیت نرخ در سطح مدل باشد و یک مدل sibling ممکن است همچنان فوراً بازیابی شود، اهمیت دارد.
    - probeهای cooldown گذرا به یک مورد برای هر ارائه‌دهنده در هر اجرای fallback محدود می‌شوند تا یک ارائه‌دهنده واحد fallback بین ارائه‌دهنده‌ها را متوقف نکند.

  </Accordion>
</AccordionGroup>

## overrideهای نشست و جابه‌جایی زنده مدل

تغییرات مدل نشست state مشترک هستند. runner فعال، دستور `/model`، به‌روزرسانی‌های compaction/session، و reconciliation نشست زنده همگی بخش‌هایی از همان entry نشست را می‌خوانند یا می‌نویسند.

این یعنی retryهای fallback باید با جابه‌جایی زنده مدل هماهنگ شوند:

- فقط تغییرات مدل صریح و کاربرمحور یک جابه‌جایی زنده pending را علامت‌گذاری می‌کنند. این شامل `/model`، `session_status(model=...)` و `sessions.patch` است.
- تغییرات مدل سیستم‌محور مانند چرخش fallback، overrideهای Heartbeat، یا Compaction به‌تنهایی هیچ‌وقت یک جابه‌جایی زنده pending را علامت‌گذاری نمی‌کنند.
- overrideهای مدل کاربرمحور برای سیاست fallback به‌عنوان انتخاب‌های دقیق در نظر گرفته می‌شوند، بنابراین ارائه‌دهنده انتخاب‌شده‌ای که در دسترس نیست به‌جای اینکه توسط `agents.defaults.model.fallbacks` پنهان شود، به‌صورت شکست نمایش داده می‌شود.
- پیش از شروع retry fallback، reply runner فیلدهای override fallback انتخاب‌شده را در entry نشست persist می‌کند.
- overrideهای fallback خودکار در turnهای بعدی انتخاب‌شده باقی می‌مانند تا OpenClaw در هر پیام یک primary شناخته‌شده خراب را probe نکند. `/new`، `/reset` و `sessions.reset` overrideهای auto-sourced را پاک می‌کنند و نشست را به پیش‌فرض پیکربندی‌شده برمی‌گردانند.
- `/status` مدل انتخاب‌شده را نشان می‌دهد و وقتی state fallback متفاوت باشد، مدل fallback فعال و دلیل آن را نیز نشان می‌دهد.
- reconciliation نشست زنده overrideهای persistشده نشست را به فیلدهای مدل runtime قدیمی ترجیح می‌دهد.
- اگر خطای live-switch به نامزد بعدی در زنجیره fallback فعال اشاره کند، OpenClaw به‌جای طی‌کردن نامزدهای نامرتبط، مستقیماً به همان مدل انتخاب‌شده می‌پرد.
- اگر تلاش fallback شکست بخورد، runner فقط فیلدهای overrideی را که خودش نوشته rollback می‌کند، و فقط اگر هنوز با همان نامزد شکست‌خورده مطابقت داشته باشند.

این از race کلاسیک جلوگیری می‌کند:

<Steps>
  <Step title="Primary شکست می‌خورد">
    مدل primary انتخاب‌شده شکست می‌خورد.
  </Step>
  <Step title="Fallback در حافظه انتخاب می‌شود">
    نامزد fallback در حافظه انتخاب می‌شود.
  </Step>
  <Step title="Session store هنوز primary قدیمی را نشان می‌دهد">
    session store هنوز primary قدیمی را منعکس می‌کند.
  </Step>
  <Step title="Live reconciliation state قدیمی را می‌خواند">
    reconciliation نشست زنده state قدیمی نشست را می‌خواند.
  </Step>
  <Step title="Retry به عقب برگردانده می‌شود">
    retry پیش از شروع تلاش fallback به مدل قدیمی برگردانده می‌شود.
  </Step>
</Steps>

override fallback persistشده این بازه را می‌بندد، و rollback محدود تغییرات دستی یا runtime جدیدتر نشست را دست‌نخورده نگه می‌دارد.

## مشاهده‌پذیری و خلاصه‌های شکست

`runWithModelFallback(...)` جزئیات هر تلاش را ثبت می‌کند که خوراک logها و پیام‌رسانی cooldown قابل‌نمایش به کاربر می‌شود:

- ارائه‌دهنده/مدل امتحان‌شده
- دلیل (`rate_limit`، `overloaded`، `billing`، `auth`، `model_not_found`، و دلایل مشابه failover)
- status/code اختیاری
- خلاصه خطای خوانا برای انسان

logهای ساختاریافته `model_fallback_decision` همچنین وقتی یک نامزد شکست می‌خورد، رد می‌شود، یا fallback بعدی موفق می‌شود، فیلدهای flat `fallbackStep*` را شامل می‌شوند. این فیلدها گذار تلاش‌شده را صریح می‌کنند (`fallbackStepFromModel`، `fallbackStepToModel`، `fallbackStepFromFailureReason`، `fallbackStepFromFailureDetail`، `fallbackStepFinalOutcome`) تا صادرکننده‌های log و diagnostic بتوانند شکست primary را بازسازی کنند، حتی وقتی fallback نهایی هم شکست بخورد.

وقتی همه نامزدها شکست بخورند، OpenClaw خطای `FallbackSummaryError` را throw می‌کند. reply runner بیرونی می‌تواند از آن برای ساختن پیامی مشخص‌تر مانند «همه مدل‌ها به‌طور موقت rate-limited هستند» استفاده کند و اگر نزدیک‌ترین زمان انقضای cooldown معلوم باشد، آن را اضافه کند.

آن خلاصه cooldown از مدل آگاه است:

- محدودیت‌های نرخ model-scoped نامرتبط برای زنجیره ارائه‌دهنده/مدل امتحان‌شده نادیده گرفته می‌شوند
- اگر block باقی‌مانده یک محدودیت نرخ model-scoped مطابق باشد، OpenClaw آخرین expiry مطابقی را گزارش می‌کند که هنوز آن مدل را block می‌کند

## پیکربندی مرتبط

برای موارد زیر، [پیکربندی Gateway](/fa/gateway/configuration) را ببینید:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing مربوط به `agents.defaults.imageModel`

برای نمای کلی گسترده‌تر انتخاب مدل و fallback، [مدل‌ها](/fa/concepts/models) را ببینید.
