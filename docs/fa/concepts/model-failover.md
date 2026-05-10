---
read_when:
    - عیب‌یابی چرخش پروفایل احراز هویت، دوره‌های انتظار، یا رفتار بازگشت به مدل پشتیبان
    - به‌روزرسانی قواعد انتقال در خرابی برای پروفایل‌های احراز هویت یا مدل‌ها
    - درک اینکه بازنویسی‌های مدل نشست چگونه با تلاش‌های مجدد مسیر پشتیبان تعامل دارند
sidebarTitle: Model failover
summary: OpenClaw چگونه پروفایل‌های احراز هویت را به‌صورت چرخشی استفاده می‌کند و بین مدل‌ها به گزینه‌های جایگزین بازمی‌گردد
title: جایگزینی مدل هنگام خرابی
x-i18n:
    generated_at: "2026-05-10T19:36:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw خرابی‌ها را در دو مرحله مدیریت می‌کند:

1. **چرخش نمایه احراز هویت** در ارائه‌دهنده فعلی.
2. **پس‌افت مدل** به مدل بعدی در `agents.defaults.model.fallbacks`.

این سند قواعد زمان اجرا و داده‌هایی را توضیح می‌دهد که پشتوانه آن‌ها هستند.

## جریان زمان اجرا

برای یک اجرای متنی معمولی، OpenClaw گزینه‌ها را به این ترتیب ارزیابی می‌کند:

<Steps>
  <Step title="Resolve session state">
    مدل نشست فعال و ترجیح نمایه احراز هویت را resolve می‌کند.
  </Step>
  <Step title="Build candidate chain">
    زنجیره گزینه‌های مدل را از انتخاب مدل فعلی و سیاست پس‌افت برای منبع آن انتخاب می‌سازد. پیش‌فرض‌های پیکربندی‌شده، مدل‌های اصلی کار cron، و مدل‌های پس‌افتِ انتخاب‌شده به‌صورت خودکار می‌توانند از پس‌افت‌های پیکربندی‌شده استفاده کنند؛ انتخاب‌های صریح کاربر برای نشست سخت‌گیرانه‌اند.
  </Step>
  <Step title="Try the current provider">
    ارائه‌دهنده فعلی را با قواعد چرخش/خنک‌سازی نمایه احراز هویت امتحان می‌کند.
  </Step>
  <Step title="Advance on failover-worthy errors">
    اگر آن ارائه‌دهنده با خطایی که شایسته failover است به پایان برسد، به گزینه مدل بعدی می‌رود.
  </Step>
  <Step title="Persist fallback override">
    override پس‌افت انتخاب‌شده را پیش از شروع تلاش دوباره ماندگار می‌کند تا خواننده‌های دیگر نشست همان ارائه‌دهنده/مدلی را ببینند که اجراکننده در آستانه استفاده از آن است. override ماندگارشده مدل با `modelOverrideSource: "auto"` علامت‌گذاری می‌شود.
  </Step>
  <Step title="Roll back narrowly on failure">
    اگر گزینه پس‌افت شکست بخورد، فقط فیلدهای override نشست متعلق به پس‌افت را، زمانی که هنوز با همان گزینه شکست‌خورده مطابقت دارند، برمی‌گرداند.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    اگر همه گزینه‌ها شکست بخورند، یک `FallbackSummaryError` با جزئیات هر تلاش و نزدیک‌ترین زمان پایان خنک‌سازی، وقتی معلوم باشد، پرتاب می‌کند.
  </Step>
</Steps>

این عمداً محدودتر از «ذخیره و بازیابی کل نشست» است. اجراکننده پاسخ فقط فیلدهای انتخاب مدل را که برای پس‌افت مالک آن‌هاست ماندگار می‌کند:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

این کار مانع می‌شود که تلاش دوباره ناموفقِ پس‌افت، تغییرات جدیدتر و نامرتبط نشست را بازنویسی کند؛ مثل تغییرات دستی `/model` یا به‌روزرسانی‌های چرخش نشست که هنگام اجرای تلاش رخ داده‌اند.

## سیاست منبع انتخاب

OpenClaw ارائه‌دهنده/مدل انتخاب‌شده را از دلیل انتخاب آن جدا می‌کند. همان منبع تعیین می‌کند آیا زنجیره پس‌افت مجاز است یا نه:

- **پیش‌فرض پیکربندی‌شده**: `agents.defaults.model.primary` از `agents.defaults.model.fallbacks` استفاده می‌کند.
- **مدل اصلی عامل**: `agents.list[].model` سخت‌گیرانه است، مگر اینکه شیء مدل همان عامل `fallbacks` خودش را داشته باشد. برای صریح‌کردن رفتار سخت‌گیرانه از `fallbacks: []` استفاده کنید، یا برای فعال‌کردن پس‌افت مدل برای آن عامل، یک فهرست غیرخالی ارائه دهید.
- **override پس‌افت خودکار**: یک پس‌افت زمان اجرا پیش از تلاش دوباره، `providerOverride`، `modelOverride`، `modelOverrideSource: "auto"`، و مدل مبدأ انتخاب‌شده را می‌نویسد. آن override خودکار می‌تواند زنجیره پس‌افت پیکربندی‌شده را ادامه دهد و با `/new`، `/reset` و `sessions.reset` پاک می‌شود. اجراهای Heartbeat بدون `heartbeat.model` صریح نیز وقتی مبدأ آن دیگر با پیش‌فرض پیکربندی‌شده فعلی مطابقت نداشته باشد، یک override خودکار مستقیم را پاک می‌کنند.
- **override نشست کاربر**: `/model`، انتخاب‌گر مدل، `session_status(model=...)` و `sessions.patch` مقدار `modelOverrideSource: "user"` را می‌نویسند. این یک انتخاب دقیق برای نشست است. اگر ارائه‌دهنده/مدل انتخاب‌شده پیش از تولید پاسخ شکست بخورد، OpenClaw به‌جای پاسخ‌دادن از یک پس‌افت پیکربندی‌شده نامرتبط، خرابی را گزارش می‌کند.
- **override نشست قدیمی**: ورودی‌های قدیمی‌تر نشست ممکن است `modelOverride` را بدون `modelOverrideSource` داشته باشند. OpenClaw آن‌ها را override کاربر در نظر می‌گیرد تا یک انتخاب صریح قدیمی بی‌صدا به رفتار پس‌افت تبدیل نشود.
- **مدل payload مربوط به Cron**: مقدار `payload.model` / `--model` در یک کار cron مدل اصلی کار است، نه override نشست کاربر. از پس‌افت‌های پیکربندی‌شده استفاده می‌کند مگر اینکه کار `payload.fallbacks` ارائه دهد؛ `payload.fallbacks: []` اجرای cron را سخت‌گیرانه می‌کند.

## ذخیره‌سازی احراز هویت (کلیدها + OAuth)

OpenClaw برای کلیدهای API و توکن‌های OAuth از **نمایه‌های احراز هویت** استفاده می‌کند.

- رازها در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارند (قدیمی: `~/.openclaw/agent/auth-profiles.json`).
- وضعیت مسیریابی احراز هویت زمان اجرا در `~/.openclaw/agents/<agentId>/agent/auth-state.json` قرار دارد.
- پیکربندی `auth.profiles` / `auth.order` فقط **فراداده + مسیریابی** است (بدون راز).
- فایل OAuth قدیمی فقط برای import: `~/.openclaw/credentials/oauth.json` (در نخستین استفاده به `auth-profiles.json` import می‌شود).

جزئیات بیشتر: [OAuth](/fa/concepts/oauth)

انواع اعتبارنامه:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` برای بعضی ارائه‌دهنده‌ها)

## شناسه‌های نمایه

ورودهای OAuth نمایه‌های متمایز ایجاد می‌کنند تا چند حساب بتوانند هم‌زمان وجود داشته باشند.

- پیش‌فرض: `provider:default` وقتی ایمیلی در دسترس نباشد.
- OAuth با ایمیل: `provider:<email>` (مثلاً `google-antigravity:user@gmail.com`).

نمایه‌ها در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` زیر `profiles` قرار دارند.

## ترتیب چرخش

وقتی یک ارائه‌دهنده چند نمایه دارد، OpenClaw ترتیب را این‌گونه انتخاب می‌کند:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (اگر تنظیم شده باشد).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` فیلترشده بر اساس ارائه‌دهنده.
  </Step>
  <Step title="Stored profiles">
    ورودی‌های موجود در `auth-profiles.json` برای ارائه‌دهنده.
  </Step>
</Steps>

اگر ترتیب صریحی پیکربندی نشده باشد، OpenClaw از ترتیب round-robin استفاده می‌کند:

- **کلید اصلی:** نوع نمایه (**OAuth پیش از کلیدهای API**).
- **کلید ثانویه:** `usageStats.lastUsed` (قدیمی‌ترین در ابتدا، درون هر نوع).
- **نمایه‌های در حالت خنک‌سازی/غیرفعال** به انتها منتقل می‌شوند و بر اساس نزدیک‌ترین زمان پایان مرتب می‌شوند.

### چسبندگی نشست (سازگار با cache)

OpenClaw برای گرم نگه‌داشتن cacheهای ارائه‌دهنده، **نمایه احراز هویت انتخاب‌شده را برای هر نشست pin می‌کند**. در هر درخواست آن را نمی‌چرخاند. نمایه pinشده دوباره استفاده می‌شود تا زمانی که:

- نشست reset شود (`/new` / `/reset`)
- یک Compaction کامل شود (شمارنده compaction افزایش یابد)
- نمایه در خنک‌سازی/غیرفعال باشد

انتخاب دستی از طریق `/model …@<profileId>` یک **override کاربر** برای آن نشست تنظیم می‌کند و تا شروع نشست جدید به‌صورت خودکار چرخانده نمی‌شود.

<Note>
نمایه‌های pinشده خودکار (انتخاب‌شده توسط مسیریاب نشست) به‌عنوان یک **ترجیح** در نظر گرفته می‌شوند: ابتدا امتحان می‌شوند، اما OpenClaw ممکن است در صورت محدودیت نرخ/timeout به نمایه دیگری بچرخد. نمایه‌های pinشده توسط کاربر به همان نمایه قفل می‌مانند؛ اگر شکست بخورد و پس‌افت‌های مدل پیکربندی شده باشند، OpenClaw به‌جای تعویض نمایه‌ها به مدل بعدی می‌رود.
</Note>

### چرا OAuth ممکن است «گم‌شده به نظر برسد»

اگر برای یک ارائه‌دهنده هم نمایه OAuth داشته باشید و هم نمایه کلید API، round-robin می‌تواند بین پیام‌ها میان آن‌ها جابه‌جا شود مگر اینکه pin شده باشد. برای اجبار به یک نمایه واحد:

- با `auth.order[provider] = ["provider:profileId"]` pin کنید، یا
- از override هر نشست از طریق `/model …` همراه با override نمایه استفاده کنید (وقتی توسط سطح UI/chat شما پشتیبانی شود).

## خنک‌سازی‌ها

وقتی یک نمایه به‌دلیل خطاهای احراز هویت/محدودیت نرخ شکست می‌خورد (یا timeoutی که شبیه محدودیت نرخ است)، OpenClaw آن را در حالت خنک‌سازی علامت‌گذاری می‌کند و به نمایه بعدی می‌رود.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    آن bucket محدودیت نرخ گسترده‌تر از `429` ساده است: پیام‌های ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، `throttled`، `resource exhausted`، و محدودیت‌های دوره‌ای پنجره مصرف مانند `weekly/monthly limit reached` را هم شامل می‌شود.

    خطاهای قالب/درخواست نامعتبر معمولاً نهایی هستند، چون تلاش دوباره با همان payload به همان شکل شکست می‌خورد؛ بنابراین OpenClaw به‌جای چرخاندن نمایه‌های احراز هویت آن‌ها را نمایش می‌دهد. مسیرهای شناخته‌شده retry-repair می‌توانند صریحاً opt in کنند: برای مثال خرابی‌های اعتبارسنجی شناسه tool call در Cloud Code Assist پاک‌سازی می‌شوند و یک‌بار از طریق سیاست `allowFormatRetry` دوباره امتحان می‌شوند. خطاهای stop-reason سازگار با OpenAI مانند `Unhandled stop reason: error`، `stop reason: error` و `reason: error` به‌عنوان سیگنال‌های timeout/failover طبقه‌بندی می‌شوند.

    متن عمومی سرور نیز وقتی منبع با یک الگوی گذرای شناخته‌شده مطابقت داشته باشد، می‌تواند وارد همان bucket timeout شود. برای مثال پیام ساده stream-wrapper مربوط به pi-ai یعنی `An unknown error occurred` برای همه ارائه‌دهنده‌ها شایسته failover در نظر گرفته می‌شود، چون pi-ai وقتی streamهای ارائه‌دهنده بدون جزئیات مشخص با `stopReason: "aborted"` یا `stopReason: "error"` پایان می‌یابند، آن را منتشر می‌کند. payloadهای JSON با `api_error` و متن گذرای سرور مانند `internal server error`، `unknown error, 520`، `upstream error` یا `backend error` نیز به‌عنوان timeoutهای شایسته failover در نظر گرفته می‌شوند.

    متن عمومی upstream ویژه OpenRouter مانند `Provider returned error` فقط زمانی timeout در نظر گرفته می‌شود که زمینه ارائه‌دهنده واقعاً OpenRouter باشد. متن عمومی fallback داخلی مانند `LLM request failed with an unknown error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی failover را فعال نمی‌کند.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    بعضی SDKهای ارائه‌دهنده ممکن است پیش از بازگرداندن کنترل به OpenClaw، برای یک پنجره طولانی `Retry-After` بخوابند. برای SDKهای مبتنی بر Stainless مانند Anthropic و OpenAI، OpenClaw به‌صورت پیش‌فرض انتظارهای داخلی SDK برای `retry-after-ms` / `retry-after` را به ۶۰ ثانیه محدود می‌کند و پاسخ‌های retryable طولانی‌تر را فوراً نمایش می‌دهد تا این مسیر failover اجرا شود. این سقف را با `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` تنظیم یا غیرفعال کنید؛ [رفتار تلاش دوباره](/fa/concepts/retry) را ببینید.
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    خنک‌سازی‌های محدودیت نرخ می‌توانند در محدوده مدل نیز باشند:

    - OpenClaw برای خرابی‌های محدودیت نرخ، وقتی شناسه مدل شکست‌خورده معلوم باشد، `cooldownModel` را ثبت می‌کند.
    - وقتی خنک‌سازی به مدل دیگری محدود شده باشد، یک مدل هم‌خانواده روی همان ارائه‌دهنده هنوز می‌تواند امتحان شود.
    - پنجره‌های billing/غیرفعال هنوز کل نمایه را در سراسر مدل‌ها مسدود می‌کنند.

  </Accordion>
</AccordionGroup>

خنک‌سازی‌ها از backoff نمایی استفاده می‌کنند:

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

خرابی‌های billing/اعتبار (برای مثال "insufficient credits" / "credit balance too low") شایسته failover در نظر گرفته می‌شوند، اما معمولاً گذرا نیستند. OpenClaw به‌جای خنک‌سازی کوتاه، نمایه را **غیرفعال** علامت‌گذاری می‌کند (با backoff طولانی‌تر) و به نمایه/ارائه‌دهنده بعدی می‌چرخد.

<Note>
هر پاسخ با شکل billing الزاماً `402` نیست، و هر HTTP `402` به این مسیر نمی‌رسد. OpenClaw متن صریح billing را حتی وقتی ارائه‌دهنده به‌جای آن `401` یا `403` برمی‌گرداند، در مسیر billing نگه می‌دارد، اما matcherهای ویژه ارائه‌دهنده محدود به همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `403 Key limit exceeded`).

در همین حال، خطاهای موقت `402` مربوط به پنجره مصرف و سقف هزینه سازمان/فضای کاری وقتی پیام retryable به نظر برسد به‌عنوان `rate_limit` طبقه‌بندی می‌شوند (برای مثال `weekly usage limit exhausted`، `daily limit reached, resets tomorrow`، یا `organization spending limit exceeded`). آن‌ها به‌جای مسیر طولانی غیرفعال‌سازی billing، روی مسیر خنک‌سازی/پس‌افت کوتاه باقی می‌مانند.
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

- backoff مربوط به billing از **۵ ساعت** شروع می‌شود، به‌ازای هر خرابی billing دوبرابر می‌شود، و در **۲۴ ساعت** سقف می‌خورد.
- اگر نمایه به مدت **۲۴ ساعت** شکست نخورده باشد، شمارنده‌های backoff reset می‌شوند (قابل پیکربندی).
- تلاش‌های overloaded اجازه **۱ چرخش نمایه در همان ارائه‌دهنده** را پیش از پس‌افت مدل می‌دهند.
- تلاش‌های overloaded به‌صورت پیش‌فرض از backoff برابر با **۰ ms** استفاده می‌کنند.

## پس‌افت مدل

اگر همهٔ پروفایل‌های یک provider شکست بخورند، OpenClaw به مدل بعدی در `agents.defaults.model.fallbacks` می‌رود. این موضوع برای شکست‌های احراز هویت، محدودیت‌های نرخ، و timeoutهایی صدق می‌کند که چرخش پروفایل را تمام کرده‌اند (خطاهای دیگر fallback را جلو نمی‌برند). خطاهای provider که جزئیات کافی را در معرض نمی‌گذارند همچنان در وضعیت fallback با برچسب دقیق مشخص می‌شوند: `empty_response` یعنی provider هیچ پیام یا وضعیتی قابل‌استفاده برنگردانده است، `no_error_details` یعنی provider به‌صراحت `Unknown error (no error details in response)` را برگردانده است، و `unclassified` یعنی OpenClaw پیش‌نمایش خام را حفظ کرده اما هنوز هیچ دسته‌بندی‌کننده‌ای با آن منطبق نشده است.

خطاهای بار بیش‌ازحد و محدودیت نرخ تهاجمی‌تر از cooldownهای billing مدیریت می‌شوند. به‌صورت پیش‌فرض، OpenClaw یک تلاش دوباره با auth-profile همان provider را مجاز می‌داند، سپس بدون انتظار به fallback مدل پیکربندی‌شدهٔ بعدی می‌رود. سیگنال‌های مشغول‌بودن provider مانند `ModelNotReadyException` در همان دستهٔ بار بیش‌ازحد قرار می‌گیرند. این رفتار را با `auth.cooldowns.overloadedProfileRotations`، `auth.cooldowns.overloadedBackoffMs`، و `auth.cooldowns.rateLimitedProfileRotations` تنظیم کنید.

وقتی یک اجرا از primary پیش‌فرض پیکربندی‌شده، primary یک cron job، primary یک agent با fallbackهای صریح، یا یک fallback override انتخاب‌شدهٔ خودکار شروع شود، OpenClaw می‌تواند زنجیرهٔ fallback پیکربندی‌شدهٔ متناظر را طی کند. primaryهای agent بدون fallbackهای صریح و انتخاب‌های صریح کاربر (برای مثال `/model ollama/qwen3.5:27b`، انتخابگر مدل، `sessions.patch`، یا overrideهای یک‌بارهٔ provider/model در CLI) سخت‌گیرانه هستند: اگر آن provider/model دردسترس نباشد یا پیش از تولید پاسخ شکست بخورد، OpenClaw به‌جای پاسخ‌دادن از یک fallback نامرتبط، شکست را گزارش می‌کند.

### قواعد زنجیرهٔ نامزدها

OpenClaw فهرست نامزدها را از `provider/model` درخواست‌شدهٔ فعلی به‌همراه fallbackهای پیکربندی‌شده می‌سازد.

<AccordionGroup>
  <Accordion title="قواعد">
    - مدل درخواست‌شده همیشه نخستین مورد است.
    - fallbackهای پیکربندی‌شدهٔ صریح deduplicate می‌شوند اما با allowlist مدل فیلتر نمی‌شوند. آن‌ها به‌عنوان قصد صریح operator در نظر گرفته می‌شوند.
    - اگر اجرای فعلی از قبل روی یک fallback پیکربندی‌شده در همان خانوادهٔ provider باشد، OpenClaw همچنان از کل زنجیرهٔ پیکربندی‌شده استفاده می‌کند.
    - اگر اجرای فعلی روی provider متفاوتی نسبت به config باشد و آن مدل فعلی از قبل بخشی از زنجیرهٔ fallback پیکربندی‌شده نباشد، OpenClaw fallbackهای پیکربندی‌شدهٔ نامرتبط از provider دیگر را اضافه نمی‌کند.
    - وقتی هیچ fallback override صریحی به fallback runner داده نشود، primary پیکربندی‌شده در انتهای زنجیره اضافه می‌شود تا پس از تمام‌شدن نامزدهای قبلی، زنجیره بتواند دوباره روی پیش‌فرض عادی مستقر شود.
    - وقتی فراخواننده `fallbacksOverride` را ارائه کند، runner دقیقاً از مدل درخواست‌شده به‌علاوهٔ همان فهرست override استفاده می‌کند. یک فهرست خالی fallback مدل را غیرفعال می‌کند و مانع می‌شود primary پیکربندی‌شده به‌عنوان هدف پنهان تلاش دوباره اضافه شود.

  </Accordion>
</AccordionGroup>

### کدام خطاها fallback را جلو می‌برند

<Tabs>
  <Tab title="در این موارد ادامه می‌دهد">
    - شکست‌های احراز هویت
    - محدودیت‌های نرخ و تمام‌شدن cooldown
    - خطاهای بار بیش‌ازحد/مشغول‌بودن provider
    - خطاهای failover با شکل timeout
    - غیرفعال‌سازی‌های billing
    - `LiveSessionModelSwitchError`، که به مسیر failover نرمال‌سازی می‌شود تا یک مدل پایدارشدهٔ stale باعث ایجاد حلقهٔ retry بیرونی نشود
    - خطاهای ناشناختهٔ دیگر وقتی هنوز نامزدهایی باقی مانده‌اند

  </Tab>
  <Tab title="در این موارد ادامه نمی‌دهد">
    - abortهای صریحی که شکل timeout/failover ندارند
    - خطاهای overflow زمینه که باید داخل منطق Compaction/retry باقی بمانند (برای مثال `request_too_large`، `INVALID_ARGUMENT: input exceeds the maximum number of tokens`، `input token count exceeds the maximum number of input tokens`، `The input is too long for the model`، یا `ollama error: context length exceeded`)
    - خطای ناشناختهٔ نهایی وقتی هیچ نامزدی باقی نمانده است

  </Tab>
</Tabs>

### رفتار ردکردن cooldown در برابر probe

وقتی همهٔ auth profileهای یک provider از قبل در cooldown باشند، OpenClaw آن provider را به‌طور خودکار برای همیشه رد نمی‌کند. این تصمیم را برای هر نامزد جداگانه می‌گیرد:

<AccordionGroup>
  <Accordion title="تصمیم‌ها برای هر نامزد">
    - شکست‌های پایدار احراز هویت کل provider را بلافاصله رد می‌کنند.
    - غیرفعال‌سازی‌های billing معمولاً رد می‌شوند، اما نامزد primary همچنان می‌تواند با یک throttle probe شود تا بازیابی بدون restart ممکن باشد.
    - نامزد primary ممکن است نزدیک انقضای cooldown، با throttle مختص هر provider، probe شود.
    - siblingهای fallback همان provider می‌توانند با وجود cooldown امتحان شوند، وقتی شکست گذرا به نظر برسد (`rate_limit`، `overloaded`، یا ناشناخته). این موضوع به‌ویژه وقتی مهم است که محدودیت نرخ در سطح مدل باشد و یک مدل sibling شاید همچنان بتواند بلافاصله بازیابی شود.
    - probeهای cooldown گذرا به یک مورد برای هر provider در هر اجرای fallback محدود می‌شوند تا یک provider منفرد fallback بین providerها را متوقف نکند.

  </Accordion>
</AccordionGroup>

## overrideهای session و تغییر زندهٔ مدل

تغییرات مدل session وضعیت مشترک هستند. runner فعال، دستور `/model`، به‌روزرسانی‌های Compaction/session، و reconciliation مربوط به live-session همگی بخش‌هایی از همان ورودی session را می‌خوانند یا می‌نویسند.

این یعنی retryهای fallback باید با تغییر زندهٔ مدل هماهنگ شوند:

- فقط تغییرات مدل که صریحاً توسط کاربر هدایت شده‌اند، یک تغییر زندهٔ pending را علامت‌گذاری می‌کنند. این شامل `/model`، `session_status(model=...)`، و `sessions.patch` است.
- تغییرات مدل که توسط سیستم هدایت می‌شوند، مانند چرخش fallback، overrideهای Heartbeat، یا Compaction، به‌خودی‌خود هرگز تغییر زندهٔ pending را علامت‌گذاری نمی‌کنند.
- overrideهای مدل که توسط کاربر هدایت می‌شوند برای policy fallback به‌عنوان انتخاب‌های دقیق در نظر گرفته می‌شوند، بنابراین provider انتخاب‌شده‌ای که دردسترس نیست به‌جای پنهان‌شدن پشت `agents.defaults.model.fallbacks` به‌صورت شکست ظاهر می‌شود.
- پیش از شروع retry fallback، reply runner فیلدهای fallback override انتخاب‌شده را در ورودی session پایدار می‌کند.
- overrideهای fallback خودکار در turnهای بعدی انتخاب‌شده باقی می‌مانند تا OpenClaw در هر پیام یک primary معلوم‌بد را probe نکند. `/new`، `/reset`، و `sessions.reset` overrideهای auto-sourced را پاک می‌کنند و session را به پیش‌فرض پیکربندی‌شده برمی‌گردانند.
- `/status` مدل انتخاب‌شده را نشان می‌دهد و، وقتی وضعیت fallback متفاوت باشد، مدل fallback فعال و دلیل را نیز نشان می‌دهد.
- reconciliation مربوط به live-session، overrideهای session پایدارشده را بر فیلدهای stale مدل runtime ترجیح می‌دهد.
- اگر خطای live-switch به نامزد بعدی در زنجیرهٔ fallback فعال اشاره کند، OpenClaw به‌جای طی‌کردن نامزدهای نامرتبط، مستقیماً به همان مدل انتخاب‌شده می‌پرد.
- اگر تلاش fallback شکست بخورد، runner فقط فیلدهای overrideی را که خودش نوشته است برمی‌گرداند، آن هم فقط اگر همچنان با همان نامزد شکست‌خورده منطبق باشند.

این از race کلاسیک جلوگیری می‌کند:

<Steps>
  <Step title="Primary شکست می‌خورد">
    مدل primary انتخاب‌شده شکست می‌خورد.
  </Step>
  <Step title="Fallback در حافظه انتخاب می‌شود">
    نامزد fallback در حافظه انتخاب می‌شود.
  </Step>
  <Step title="session store همچنان primary قدیمی را نشان می‌دهد">
    session store همچنان primary قدیمی را منعکس می‌کند.
  </Step>
  <Step title="Live reconciliation وضعیت stale را می‌خواند">
    reconciliation مربوط به live-session وضعیت stale session را می‌خواند.
  </Step>
  <Step title="Retry به عقب برگردانده می‌شود">
    retry پیش از شروع تلاش fallback به مدل قدیمی برگردانده می‌شود.
  </Step>
</Steps>

fallback override پایدارشده این پنجره را می‌بندد، و rollback محدود تغییرات دستی یا runtime جدیدتر session را دست‌نخورده نگه می‌دارد.

## مشاهده‌پذیری و خلاصه‌های شکست

`runWithModelFallback(...)` جزئیات هر تلاش را ثبت می‌کند که به logها و پیام‌های cooldown قابل‌مشاهده برای کاربر خوراک می‌دهند:

- provider/model تلاش‌شده
- دلیل (`rate_limit`، `overloaded`، `billing`، `auth`، `model_not_found`، و دلیل‌های failover مشابه)
- status/code اختیاری
- خلاصهٔ خطای قابل‌فهم برای انسان

logهای ساخت‌یافتهٔ `model_fallback_decision` همچنین وقتی یک نامزد شکست می‌خورد، رد می‌شود، یا fallback بعدی موفق می‌شود، فیلدهای تخت `fallbackStep*` را شامل می‌شوند. این فیلدها انتقال تلاش‌شده را صریح می‌کنند (`fallbackStepFromModel`، `fallbackStepToModel`، `fallbackStepFromFailureReason`، `fallbackStepFromFailureDetail`، `fallbackStepFinalOutcome`) تا صادرکننده‌های log و diagnostic بتوانند شکست primary را حتی وقتی fallback پایانی هم شکست می‌خورد بازسازی کنند.

وقتی همهٔ نامزدها شکست بخورند، OpenClaw خطای `FallbackSummaryError` را throw می‌کند. reply runner بیرونی می‌تواند از آن برای ساختن پیام مشخص‌تری مانند «همهٔ مدل‌ها موقتاً rate-limited هستند» استفاده کند و، اگر زودترین انقضای cooldown شناخته شده باشد، آن را هم شامل کند.

آن خلاصهٔ cooldown نسبت به مدل آگاه است:

- محدودیت‌های نرخ model-scoped نامرتبط برای زنجیرهٔ provider/model تلاش‌شده نادیده گرفته می‌شوند
- اگر block باقی‌مانده یک محدودیت نرخ model-scoped منطبق باشد، OpenClaw آخرین expiry منطبقی را گزارش می‌کند که همچنان آن مدل را block می‌کند

## config مرتبط

برای موارد زیر، [پیکربندی Gateway](/fa/gateway/configuration) را ببینید:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- مسیریابی `agents.defaults.imageModel`

برای نمای کلی گسترده‌تر از انتخاب مدل و fallback، [مدل‌ها](/fa/concepts/models) را ببینید.
