---
read_when:
    - عیب‌یابی چرخش پروفایل احراز هویت، دوره‌های وقفه، یا رفتار بازگشت به مدل جایگزین
    - به‌روزرسانی قواعد جابه‌جایی هنگام خرابی برای نمایه‌های احراز هویت یا مدل‌ها
    - درک نحوهٔ تعامل بازتعریف‌های مدل نشست با تلاش‌های مجدد جایگزین
sidebarTitle: Model failover
summary: OpenClaw چگونه از نمایه‌های احراز هویت به‌صورت چرخشی استفاده می‌کند و بین مدل‌ها به گزینه‌های جایگزین می‌رود
title: جابه‌جایی خودکار مدل هنگام خرابی
x-i18n:
    generated_at: "2026-04-29T22:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw خرابی‌ها را در دو مرحله مدیریت می‌کند:

1. **چرخش پروفایل احراز هویت** در ارائه‌دهندهٔ فعلی.
2. **fallback مدل** به مدل بعدی در `agents.defaults.model.fallbacks`.

این سند قواعد زمان اجرا و داده‌هایی را توضیح می‌دهد که پشتوانهٔ آن‌ها هستند.

## جریان زمان اجرا

برای یک اجرای متنی عادی، OpenClaw نامزدها را به این ترتیب ارزیابی می‌کند:

<Steps>
  <Step title="Resolve session state">
    مدل فعال نشست و ترجیح پروفایل احراز هویت را resolve می‌کند.
  </Step>
  <Step title="Build candidate chain">
    زنجیرهٔ نامزدهای مدل را از انتخاب مدل فعلی و سیاست fallback برای منبع آن انتخاب می‌سازد. پیش‌فرض‌های پیکربندی‌شده، مدل‌های اصلی Cron job و مدل‌های fallback انتخاب‌شده به‌صورت خودکار می‌توانند از fallbackهای پیکربندی‌شده استفاده کنند؛ انتخاب‌های صریح نشست کاربر سخت‌گیرانه هستند.
  </Step>
  <Step title="Try the current provider">
    ارائه‌دهندهٔ فعلی را با قواعد چرخش/دورهٔ انتظار پروفایل احراز هویت امتحان می‌کند.
  </Step>
  <Step title="Advance on failover-worthy errors">
    اگر آن ارائه‌دهنده با خطایی که شایستهٔ failover است تمام شود، به نامزد مدل بعدی می‌رود.
  </Step>
  <Step title="Persist fallback override">
    پیش از شروع تلاش مجدد، override انتخاب‌شدهٔ fallback را پایدار می‌کند تا خواننده‌های دیگر نشست همان ارائه‌دهنده/مدلی را ببینند که runner در آستانهٔ استفاده از آن است. override پایدارشدهٔ مدل با `modelOverrideSource: "auto"` علامت‌گذاری می‌شود.
  </Step>
  <Step title="Roll back narrowly on failure">
    اگر نامزد fallback شکست بخورد، فقط فیلدهای override نشست متعلق به fallback را، هنگامی که هنوز با همان نامزد شکست‌خورده مطابقت دارند، برمی‌گرداند.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    اگر همهٔ نامزدها شکست بخورند، یک `FallbackSummaryError` با جزئیات هر تلاش و نزدیک‌ترین زمان پایان دورهٔ انتظار، وقتی معلوم باشد، پرتاب می‌کند.
  </Step>
</Steps>

این عمداً محدودتر از «ذخیره و بازیابی کل نشست» است. reply runner فقط فیلدهای انتخاب مدل را که برای fallback مالک آن‌هاست پایدار می‌کند:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

این کار از این جلوگیری می‌کند که یک تلاش مجدد fallback ناموفق، جهش‌های نامرتبط و جدیدتر نشست مثل تغییرات دستی `/model` یا به‌روزرسانی‌های چرخش نشست را که هنگام اجرای تلاش رخ داده‌اند، بازنویسی کند.

## سیاست منبع انتخاب

OpenClaw ارائه‌دهنده/مدل انتخاب‌شده را از دلیل انتخاب آن جدا می‌کند. آن منبع تعیین می‌کند که آیا زنجیرهٔ fallback مجاز است یا نه:

- **پیش‌فرض پیکربندی‌شده**: `agents.defaults.model.primary` از `agents.defaults.model.fallbacks` استفاده می‌کند.
- **مدل اصلی Agent**: `agents.list[].model` سخت‌گیرانه است مگر اینکه شیء مدل آن agent شامل `fallbacks` خودش باشد. برای صریح کردن رفتار سخت‌گیرانه از `fallbacks: []` استفاده کنید، یا برای فعال کردن model fallback برای آن agent یک فهرست غیرخالی ارائه کنید.
- **override خودکار fallback**: یک fallback زمان اجرا پیش از تلاش مجدد، `providerOverride`، `modelOverride` و `modelOverrideSource: "auto"` را می‌نویسد. آن override خودکار می‌تواند به پیمایش زنجیرهٔ fallback پیکربندی‌شده ادامه دهد و با `/new`، `/reset` و `sessions.reset` پاک می‌شود.
- **override نشست کاربر**: `/model`، انتخاب‌گر مدل، `session_status(model=...)` و `sessions.patch` مقدار `modelOverrideSource: "user"` را می‌نویسند. این یک انتخاب دقیق نشست است. اگر ارائه‌دهنده/مدل انتخاب‌شده پیش از تولید پاسخ شکست بخورد، OpenClaw به‌جای پاسخ دادن از یک fallback پیکربندی‌شدهٔ نامرتبط، خرابی را گزارش می‌کند.
- **override نشست legacy**: ورودی‌های نشست قدیمی‌تر ممکن است `modelOverride` را بدون `modelOverrideSource` داشته باشند. OpenClaw با آن‌ها مثل overrideهای کاربر رفتار می‌کند تا یک انتخاب صریح قدیمی بی‌سروصدا به رفتار fallback تبدیل نشود.
- **مدل payload در Cron**: یک Cron job با `payload.model` / `--model` مدل اصلی job است، نه override نشست کاربر. مگر اینکه job مقدار `payload.fallbacks` را ارائه کند، از fallbackهای پیکربندی‌شده استفاده می‌کند؛ `payload.fallbacks: []` اجرای Cron را سخت‌گیرانه می‌کند.

## ذخیره‌سازی احراز هویت (کلیدها + OAuth)

OpenClaw برای هر دو نوع کلیدهای API و توکن‌های OAuth از **پروفایل‌های احراز هویت** استفاده می‌کند.

- Secretها در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارند (legacy: `~/.openclaw/agent/auth-profiles.json`).
- وضعیت مسیریابی احراز هویت زمان اجرا در `~/.openclaw/agents/<agentId>/agent/auth-state.json` قرار دارد.
- پیکربندی `auth.profiles` / `auth.order` فقط **فراداده + مسیریابی** است (بدون secret).
- فایل OAuth فقط برای import در حالت legacy: `~/.openclaw/credentials/oauth.json` (در اولین استفاده به `auth-profiles.json` import می‌شود).

جزئیات بیشتر: [OAuth](/fa/concepts/oauth)

انواع credential:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` برای برخی ارائه‌دهنده‌ها)

## شناسه‌های پروفایل

ورودهای OAuth پروفایل‌های متمایز می‌سازند تا چندین حساب بتوانند هم‌زمان وجود داشته باشند.

- پیش‌فرض: `provider:default` وقتی ایمیلی در دسترس نیست.
- OAuth با ایمیل: `provider:<email>` (برای مثال `google-antigravity:user@gmail.com`).

پروفایل‌ها در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` زیر `profiles` قرار دارند.

## ترتیب چرخش

وقتی یک ارائه‌دهنده چندین پروفایل دارد، OpenClaw ترتیب را به این شکل انتخاب می‌کند:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (اگر تنظیم شده باشد).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` که بر اساس ارائه‌دهنده فیلتر شده است.
  </Step>
  <Step title="Stored profiles">
    ورودی‌های `auth-profiles.json` برای ارائه‌دهنده.
  </Step>
</Steps>

اگر ترتیب صریحی پیکربندی نشده باشد، OpenClaw از ترتیب round‑robin استفاده می‌کند:

- **کلید اصلی:** نوع پروفایل (**OAuth پیش از کلیدهای API**).
- **کلید ثانویه:** `usageStats.lastUsed` (قدیمی‌ترین ابتدا، درون هر نوع).
- **پروفایل‌های در دورهٔ انتظار/غیرفعال** به انتها منتقل می‌شوند و بر اساس نزدیک‌ترین زمان پایان مرتب می‌شوند.

### چسبندگی نشست (سازگار با cache)

OpenClaw برای گرم نگه داشتن cacheهای ارائه‌دهنده، **پروفایل احراز هویت انتخاب‌شده را به ازای هر نشست pin می‌کند**. در هر درخواست نمی‌چرخد. پروفایل pinشده تا زمانی دوباره استفاده می‌شود که:

- نشست reset شود (`/new` / `/reset`)
- یک Compaction کامل شود (شمارندهٔ Compaction افزایش یابد)
- پروفایل در دورهٔ انتظار/غیرفعال باشد

انتخاب دستی از طریق `/model …@<profileId>` یک **override کاربر** برای آن نشست تنظیم می‌کند و تا شروع یک نشست جدید به‌صورت خودکار چرخانده نمی‌شود.

<Note>
پروفایل‌های pinشدهٔ خودکار (که توسط router نشست انتخاب می‌شوند) به‌عنوان یک **ترجیح** در نظر گرفته می‌شوند: ابتدا امتحان می‌شوند، اما OpenClaw ممکن است در صورت rate limit/timeout به پروفایل دیگری بچرخد. پروفایل‌های pinشده توسط کاربر روی همان پروفایل قفل می‌مانند؛ اگر شکست بخورد و fallbackهای مدل پیکربندی شده باشند، OpenClaw به‌جای تغییر پروفایل، به مدل بعدی می‌رود.
</Note>

### چرا OAuth می‌تواند «گم‌شده به نظر برسد»

اگر برای یک ارائه‌دهنده هم پروفایل OAuth و هم پروفایل کلید API داشته باشید، round‑robin می‌تواند بین پیام‌ها میان آن‌ها جابه‌جا شود، مگر اینکه pin شده باشند. برای اجبار به یک پروفایل واحد:

- با `auth.order[provider] = ["provider:profileId"]` pin کنید، یا
- از یک override به ازای نشست از طریق `/model …` همراه با override پروفایل استفاده کنید (وقتی توسط سطح UI/چت شما پشتیبانی می‌شود).

## دوره‌های انتظار

وقتی یک پروفایل به‌دلیل خطاهای احراز هویت/rate-limit شکست می‌خورد (یا timeoutی که شبیه rate limiting است)، OpenClaw آن را در دورهٔ انتظار علامت‌گذاری می‌کند و به پروفایل بعدی می‌رود.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    آن bucket مربوط به rate-limit گسترده‌تر از `429` ساده است: پیام‌های ارائه‌دهنده مثل `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، `throttled`، `resource exhausted` و محدودیت‌های دوره‌ای پنجرهٔ مصرف مثل `weekly/monthly limit reached` را هم شامل می‌شود.

    خطاهای format/invalid-request (برای مثال خرابی‌های اعتبارسنجی شناسهٔ tool call در Cloud Code Assist) به‌عنوان شایستهٔ failover در نظر گرفته می‌شوند و از همان دوره‌های انتظار استفاده می‌کنند. خطاهای stop-reason سازگار با OpenAI مثل `Unhandled stop reason: error`، `stop reason: error` و `reason: error` به‌عنوان سیگنال‌های timeout/failover طبقه‌بندی می‌شوند.

    متن عمومی server هم وقتی منبع با یک الگوی گذرای شناخته‌شده مطابق باشد می‌تواند در آن bucket مربوط به timeout قرار بگیرد. برای مثال، پیام bare stream-wrapper مربوط به pi-ai یعنی `An unknown error occurred` برای هر ارائه‌دهنده‌ای شایستهٔ failover در نظر گرفته می‌شود، چون pi-ai وقتی streamهای ارائه‌دهنده بدون جزئیات مشخص با `stopReason: "aborted"` یا `stopReason: "error"` پایان می‌یابند آن را emit می‌کند. payloadهای JSON با `api_error` و متن server گذرا مثل `internal server error`، `unknown error, 520`، `upstream error` یا `backend error` نیز به‌عنوان timeoutهای شایستهٔ failover در نظر گرفته می‌شوند.

    متن عمومی upstream مخصوص OpenRouter مثل `Provider returned error` فقط وقتی به‌عنوان timeout در نظر گرفته می‌شود که زمینهٔ ارائه‌دهنده واقعاً OpenRouter باشد. متن عمومی fallback داخلی مثل `LLM request failed with an unknown error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی failover را فعال نمی‌کند.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    برخی SDKهای ارائه‌دهنده ممکن است در غیر این صورت پیش از برگرداندن کنترل به OpenClaw برای یک پنجرهٔ طولانی `Retry-After` sleep کنند. برای SDKهای مبتنی بر Stainless مثل Anthropic و OpenAI، OpenClaw به‌صورت پیش‌فرض انتظارهای داخلی SDK مربوط به `retry-after-ms` / `retry-after` را روی ۶۰ ثانیه cap می‌کند و پاسخ‌های retryable طولانی‌تر را فوراً نمایان می‌کند تا این مسیر failover بتواند اجرا شود. cap را با `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` تنظیم یا غیرفعال کنید؛ [رفتار retry](/fa/concepts/retry) را ببینید.
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    دوره‌های انتظار rate-limit می‌توانند scoped به مدل هم باشند:

    - OpenClaw برای خرابی‌های rate-limit وقتی شناسهٔ مدل شکست‌خورده معلوم باشد، `cooldownModel` را ثبت می‌کند.
    - یک مدل هم‌خانواده روی همان ارائه‌دهنده هنوز می‌تواند امتحان شود وقتی دورهٔ انتظار scoped به مدل دیگری باشد.
    - پنجره‌های billing/غیرفعال همچنان کل پروفایل را در همهٔ مدل‌ها مسدود می‌کنند.

  </Accordion>
</AccordionGroup>

دوره‌های انتظار از backoff نمایی استفاده می‌کنند:

- ۱ دقیقه
- ۵ دقیقه
- ۲۵ دقیقه
- ۱ ساعت (cap)

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

خرابی‌های billing/اعتبار (برای مثال "insufficient credits" / "credit balance too low") شایستهٔ failover در نظر گرفته می‌شوند، اما معمولاً گذرا نیستند. OpenClaw به‌جای یک دورهٔ انتظار کوتاه، پروفایل را **غیرفعال** علامت‌گذاری می‌کند (با backoff طولانی‌تر) و به پروفایل/ارائه‌دهندهٔ بعدی می‌چرخد.

<Note>
هر پاسخ شبیه billing الزاماً `402` نیست، و هر HTTP `402` هم اینجا قرار نمی‌گیرد. OpenClaw متن صریح billing را حتی وقتی ارائه‌دهنده به‌جای آن `401` یا `403` برمی‌گرداند در مسیر billing نگه می‌دارد، اما matcherهای مخصوص ارائه‌دهنده scoped به همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `403 Key limit exceeded`).

در همین حال، خطاهای موقت `402` مربوط به پنجرهٔ مصرف و سقف هزینهٔ سازمان/workspace وقتی پیام retryable به نظر برسد (برای مثال `weekly usage limit exhausted`، `daily limit reached, resets tomorrow` یا `organization spending limit exceeded`) به‌عنوان `rate_limit` طبقه‌بندی می‌شوند. آن‌ها به‌جای مسیر طولانی غیرفعال‌سازی billing، روی مسیر کوتاه دورهٔ انتظار/failover باقی می‌مانند.
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

- backoff مربوط به billing از **۵ ساعت** شروع می‌شود، با هر خرابی billing دو برابر می‌شود، و روی **۲۴ ساعت** cap می‌شود.
- شمارنده‌های backoff اگر پروفایل به‌مدت **۲۴ ساعت** شکست نخورده باشد reset می‌شوند (قابل پیکربندی).
- retryهای overloaded اجازهٔ **۱ چرخش پروفایل روی همان ارائه‌دهنده** را پیش از model fallback می‌دهند.
- retryهای overloaded به‌صورت پیش‌فرض از **۰ میلی‌ثانیه backoff** استفاده می‌کنند.

## Model fallback

اگر همهٔ پروفایل‌های یک ارائه‌دهنده شکست بخورند، OpenClaw به مدل بعدی در `agents.defaults.model.fallbacks` می‌رود. این برای خرابی‌های احراز هویت، rate limitها و timeoutهایی اعمال می‌شود که چرخش پروفایل را تمام کرده‌اند (خطاهای دیگر fallback را جلو نمی‌برند). خطاهای ارائه‌دهنده که جزئیات کافی را نمایان نمی‌کنند همچنان در وضعیت fallback با برچسب دقیق ثبت می‌شوند: `empty_response` یعنی ارائه‌دهنده هیچ پیام یا وضعیت قابل استفاده‌ای برنگردانده است، `no_error_details` یعنی ارائه‌دهنده صراحتاً `Unknown error (no error details in response)` را برگردانده است، و `unclassified` یعنی OpenClaw preview خام را حفظ کرده اما هنوز هیچ classifierی با آن مطابق نشده است.

خطاهای بارگذاری بیش از حد و محدودیت نرخ، تهاجمی‌تر از وقفه‌های صورتحساب مدیریت می‌شوند. به‌طور پیش‌فرض، OpenClaw اجازه یک تلاش دوباره برای همان نمایه احراز هویت ارائه‌دهنده را می‌دهد، سپس بدون انتظار به fallback مدل پیکربندی‌شده بعدی می‌رود. سیگنال‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` در همان دسته بارگذاری بیش از حد قرار می‌گیرند. این رفتار را با `auth.cooldowns.overloadedProfileRotations`، `auth.cooldowns.overloadedBackoffMs`، و `auth.cooldowns.rateLimitedProfileRotations` تنظیم کنید.

وقتی یک اجرا از primary پیش‌فرض پیکربندی‌شده، primary یک کار cron، primary یک agent با fallbackهای صریح، یا یک override fallback انتخاب‌شده خودکار شروع می‌شود، OpenClaw می‌تواند زنجیره fallback پیکربندی‌شده متناظر را طی کند. primaryهای agent بدون fallbackهای صریح و انتخاب‌های صریح کاربر (برای مثال `/model ollama/qwen3.5:27b`، انتخاب‌گر مدل، `sessions.patch`، یا overrideهای یک‌باره ارائه‌دهنده/مدل CLI) سخت‌گیرانه هستند: اگر آن ارائه‌دهنده/مدل در دسترس نباشد یا پیش از تولید پاسخ شکست بخورد، OpenClaw به‌جای پاسخ‌دادن از یک fallback نامرتبط، شکست را گزارش می‌کند.

### قواعد زنجیره نامزدها

OpenClaw فهرست نامزدها را از `provider/model` فعلیِ درخواست‌شده به‌علاوه fallbackهای پیکربندی‌شده می‌سازد.

<AccordionGroup>
  <Accordion title="Rules">
    - مدل درخواست‌شده همیشه اول است.
    - fallbackهای پیکربندی‌شده صریح تکرارزدایی می‌شوند اما با allowlist مدل فیلتر نمی‌شوند. آن‌ها به‌عنوان قصد صریح operator در نظر گرفته می‌شوند.
    - اگر اجرای فعلی همین حالا روی یک fallback پیکربندی‌شده در همان خانواده ارائه‌دهنده باشد، OpenClaw همچنان از کل زنجیره پیکربندی‌شده استفاده می‌کند.
    - اگر اجرای فعلی روی ارائه‌دهنده‌ای متفاوت از پیکربندی باشد و آن مدل فعلی از قبل بخشی از زنجیره fallback پیکربندی‌شده نباشد، OpenClaw fallbackهای پیکربندی‌شده نامرتبط از ارائه‌دهنده‌ای دیگر را اضافه نمی‌کند.
    - وقتی هیچ override fallback صریحی به اجراکننده fallback داده نشود، primary پیکربندی‌شده در انتها اضافه می‌شود تا زنجیره بتواند پس از تمام‌شدن نامزدهای قبلی دوباره روی پیش‌فرض عادی قرار بگیرد.
    - وقتی فراخواننده `fallbacksOverride` را فراهم کند، اجراکننده دقیقاً از مدل درخواست‌شده به‌علاوه همان فهرست override استفاده می‌کند. یک فهرست خالی fallback مدل را غیرفعال می‌کند و مانع می‌شود primary پیکربندی‌شده به‌عنوان هدف تلاش دوباره پنهان اضافه شود.

  </Accordion>
</AccordionGroup>

### کدام خطاها fallback را جلو می‌برند

<Tabs>
  <Tab title="Continues on">
    - شکست‌های احراز هویت
    - محدودیت‌های نرخ و اتمام cooldown
    - خطاهای بارگذاری بیش از حد/مشغول‌بودن ارائه‌دهنده
    - خطاهای failover با شکل timeout
    - غیرفعال‌سازی‌های صورتحساب
    - `LiveSessionModelSwitchError`، که به یک مسیر failover نرمال‌سازی می‌شود تا یک مدل پایدارشده قدیمی، حلقه تلاش دوباره بیرونی ایجاد نکند
    - خطاهای ناشناخته دیگر وقتی هنوز نامزدهایی باقی مانده‌اند

  </Tab>
  <Tab title="Does not continue on">
    - abortهای صریحی که شکل timeout/failover ندارند
    - خطاهای سرریز context که باید داخل منطق compaction/تلاش دوباره باقی بمانند (برای مثال `request_too_large`، `INVALID_ARGUMENT: input exceeds the maximum number of tokens`، `input token count exceeds the maximum number of input tokens`، `The input is too long for the model`، یا `ollama error: context length exceeded`)
    - یک خطای ناشناخته نهایی وقتی هیچ نامزدی باقی نمانده است

  </Tab>
</Tabs>

### رفتار پرش cooldown در برابر probe

وقتی همه نمایه‌های احراز هویت برای یک ارائه‌دهنده از قبل در cooldown باشند، OpenClaw آن ارائه‌دهنده را به‌طور خودکار برای همیشه رد نمی‌کند. برای هر نامزد جداگانه تصمیم می‌گیرد:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - شکست‌های پایدار احراز هویت فوراً کل ارائه‌دهنده را رد می‌کنند.
    - غیرفعال‌سازی‌های صورتحساب معمولاً رد می‌شوند، اما نامزد primary همچنان می‌تواند با throttle بررسی شود تا بازیابی بدون راه‌اندازی دوباره ممکن باشد.
    - نامزد primary ممکن است نزدیک به انقضای cooldown، با throttle جداگانه برای هر ارائه‌دهنده، probe شود.
    - siblingهای fallback همان ارائه‌دهنده می‌توانند با وجود cooldown امتحان شوند، وقتی شکست گذرا به نظر می‌رسد (`rate_limit`، `overloaded`، یا ناشناخته). این به‌ویژه زمانی مهم است که محدودیت نرخ scoped به مدل باشد و یک مدل sibling ممکن است همچنان فوراً بازیابی شود.
    - probeهای cooldown گذرا به یکی برای هر ارائه‌دهنده در هر اجرای fallback محدود می‌شوند تا یک ارائه‌دهنده واحد fallback میان‌ارائه‌دهنده‌ای را متوقف نکند.

  </Accordion>
</AccordionGroup>

## overrideهای session و تعویض زنده مدل

تغییرات مدل session وضعیت مشترک هستند. اجراکننده فعال، فرمان `/model`، به‌روزرسانی‌های compaction/session، و سازگاری live-session همگی بخش‌هایی از همان ورودی session را می‌خوانند یا می‌نویسند.

این یعنی تلاش‌های دوباره fallback باید با تعویض زنده مدل هماهنگ شوند:

- فقط تغییرات مدلِ صریحاً کاربرمحور یک live switch معلق را علامت‌گذاری می‌کنند. این شامل `/model`، `session_status(model=...)`، و `sessions.patch` است.
- تغییرات مدلِ سیستم‌محور مانند چرخش fallback، overrideهای Heartbeat، یا Compaction به‌تنهایی هرگز یک live switch معلق را علامت‌گذاری نمی‌کنند.
- overrideهای مدلِ کاربرمحور برای سیاست fallback به‌عنوان انتخاب‌های دقیق در نظر گرفته می‌شوند، بنابراین یک ارائه‌دهنده انتخاب‌شده غیرقابل‌دسترسی به‌جای پنهان‌شدن پشت `agents.defaults.model.fallbacks` به‌صورت شکست نمایش داده می‌شود.
- پیش از شروع یک تلاش دوباره fallback، اجراکننده پاسخ فیلدهای override fallback انتخاب‌شده را در ورودی session پایدار می‌کند.
- overrideهای fallback خودکار در turnهای بعدی انتخاب‌شده باقی می‌مانند تا OpenClaw در هر پیام یک primary شناخته‌شده خراب را probe نکند. `/new`، `/reset`، و `sessions.reset` overrideهای خودکار را پاک می‌کنند و session را به پیش‌فرض پیکربندی‌شده برمی‌گردانند.
- `/status` مدل انتخاب‌شده را نشان می‌دهد و، وقتی وضعیت fallback متفاوت باشد، مدل fallback فعال و دلیل را نیز نشان می‌دهد.
- سازگاری live-session، overrideهای پایدارشده session را به فیلدهای مدل runtime قدیمی ترجیح می‌دهد.
- اگر خطای live-switch به نامزدی بعدی در زنجیره fallback فعال اشاره کند، OpenClaw به‌جای پیمودن ابتدا نامزدهای نامرتبط، مستقیماً به همان مدل انتخاب‌شده می‌پرد.
- اگر تلاش fallback شکست بخورد، اجراکننده فقط فیلدهای overrideی را که خودش نوشته است rollback می‌کند، و فقط اگر هنوز با همان نامزد شکست‌خورده منطبق باشند.

این جلوی race کلاسیک را می‌گیرد:

<Steps>
  <Step title="Primary fails">
    مدل primary انتخاب‌شده شکست می‌خورد.
  </Step>
  <Step title="Fallback chosen in memory">
    نامزد fallback در حافظه انتخاب می‌شود.
  </Step>
  <Step title="Session store still says old primary">
    ذخیره session هنوز primary قدیمی را نشان می‌دهد.
  </Step>
  <Step title="Live reconciliation reads stale state">
    سازگاری live-session وضعیت قدیمی session را می‌خواند.
  </Step>
  <Step title="Retry snapped back">
    پیش از شروع تلاش fallback، تلاش دوباره به مدل قدیمی برگردانده می‌شود.
  </Step>
</Steps>

override fallback پایدارشده این پنجره را می‌بندد، و rollback محدود تغییرات دستی یا runtime جدیدتر session را دست‌نخورده نگه می‌دارد.

## مشاهده‌پذیری و خلاصه‌های شکست

`runWithModelFallback(...)` جزئیات هر تلاش را ثبت می‌کند که خوراک logها و پیام‌رسانی cooldown رو به کاربر هستند:

- ارائه‌دهنده/مدل امتحان‌شده
- دلیل (`rate_limit`، `overloaded`، `billing`، `auth`، `model_not_found`، و دلیل‌های failover مشابه)
- وضعیت/کد اختیاری
- خلاصه خطای خوانا برای انسان

logهای ساخت‌یافته `model_fallback_decision` همچنین وقتی یک نامزد شکست می‌خورد، رد می‌شود، یا یک fallback بعدی موفق می‌شود، فیلدهای تخت `fallbackStep*` را شامل می‌شوند. این فیلدها انتقال امتحان‌شده را صریح می‌کنند (`fallbackStepFromModel`، `fallbackStepToModel`، `fallbackStepFromFailureReason`، `fallbackStepFromFailureDetail`، `fallbackStepFinalOutcome`) تا صادرکننده‌های log و تشخیص بتوانند شکست primary را بازسازی کنند، حتی وقتی fallback پایانی هم شکست می‌خورد.

وقتی همه نامزدها شکست بخورند، OpenClaw خطای `FallbackSummaryError` را پرتاب می‌کند. اجراکننده پاسخ بیرونی می‌تواند از آن برای ساختن پیام مشخص‌تری مانند «همه مدل‌ها به‌طور موقت تحت محدودیت نرخ هستند» استفاده کند و وقتی نزدیک‌ترین زمان انقضای cooldown معلوم باشد، آن را نیز درج کند.

آن خلاصه cooldown آگاه از مدل است:

- محدودیت‌های نرخ scoped به مدلِ نامرتبط برای زنجیره ارائه‌دهنده/مدل امتحان‌شده نادیده گرفته می‌شوند
- اگر مانع باقی‌مانده یک محدودیت نرخ scoped به مدلِ منطبق باشد، OpenClaw آخرین انقضای منطبق را که هنوز آن مدل را مسدود می‌کند گزارش می‌دهد

## پیکربندی مرتبط

برای موارد زیر، [پیکربندی Gateway](/fa/gateway/configuration) را ببینید:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- مسیریابی `agents.defaults.imageModel`

برای نمای کلی گسترده‌تر انتخاب مدل و fallback، [مدل‌ها](/fa/concepts/models) را ببینید.
