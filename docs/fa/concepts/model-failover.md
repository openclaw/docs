---
read_when:
    - تشخیص چرخش نمایهٔ احراز هویت، دوره‌های انتظار، یا رفتار بازگشت جایگزین مدل
    - به‌روزرسانی قواعد جابه‌جایی خودکار هنگام خرابی برای پروفایل‌های احراز هویت یا مدل‌ها
    - درک نحوهٔ تعامل بازنویسی‌های مدل نشست با تلاش‌های مجدد جایگزین
sidebarTitle: Model failover
summary: OpenClaw چگونه پروفایل‌های احراز هویت را به‌صورت چرخشی استفاده می‌کند و میان مدل‌ها به گزینه‌های جایگزین برمی‌گردد
title: جایگزینی مدل هنگام خرابی
x-i18n:
    generated_at: "2026-05-11T20:30:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw خرابی‌ها را در دو مرحله مدیریت می‌کند:

1. **چرخش نمایه احراز هویت** در ارائه‌دهنده فعلی.
2. **بازگشت مدل** به مدل بعدی در `agents.defaults.model.fallbacks`.

این سند قوانین زمان اجرا و داده‌هایی را که پشتوانه آن‌ها هستند توضیح می‌دهد.

## جریان زمان اجرا

برای یک اجرای متنی معمولی، OpenClaw نامزدها را به این ترتیب ارزیابی می‌کند:

<Steps>
  <Step title="Resolve session state">
    وضعیت مدل نشست فعال و ترجیح نمایه احراز هویت را تعیین می‌کند.
  </Step>
  <Step title="Build candidate chain">
    زنجیره نامزدهای مدل را از انتخاب مدل فعلی و سیاست بازگشت برای منبع آن انتخاب می‌سازد. پیش‌فرض‌های پیکربندی‌شده، مدل‌های اصلی کارهای cron، و مدل‌های بازگشتی انتخاب‌شده به‌صورت خودکار می‌توانند از بازگشت‌های پیکربندی‌شده استفاده کنند؛ انتخاب‌های صریح نشست کاربر سخت‌گیرانه هستند.
  </Step>
  <Step title="Try the current provider">
    ارائه‌دهنده فعلی را با قوانین چرخش/دوره انتظار نمایه احراز هویت امتحان می‌کند.
  </Step>
  <Step title="Advance on failover-worthy errors">
    اگر آن ارائه‌دهنده با خطایی شایسته تغییر مسیر تمام شود، به نامزد مدل بعدی می‌رود.
  </Step>
  <Step title="Persist fallback override">
    پیش از شروع تلاش دوباره، جایگزینی بازگشت انتخاب‌شده را پایدار می‌کند تا دیگر خوانندگان نشست همان ارائه‌دهنده/مدلی را ببینند که اجراکننده قرار است استفاده کند. جایگزینی مدل پایدارشده با `modelOverrideSource: "auto"` علامت‌گذاری می‌شود.
  </Step>
  <Step title="Roll back narrowly on failure">
    اگر نامزد بازگشتی شکست بخورد، فقط فیلدهای جایگزینی نشست متعلق به بازگشت را، وقتی هنوز با همان نامزد شکست‌خورده مطابقت دارند، برمی‌گرداند.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    اگر همه نامزدها شکست بخورند، یک `FallbackSummaryError` با جزئیات هر تلاش و نزدیک‌ترین زمان پایان دوره انتظار، وقتی معلوم باشد، پرتاب می‌کند.
  </Step>
</Steps>

این عمداً محدودتر از «ذخیره و بازیابی کل نشست» است. اجراکننده پاسخ فقط فیلدهای انتخاب مدل را که برای بازگشت مالک آن‌هاست پایدار می‌کند:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

این کار مانع می‌شود تلاش دوباره ناموفقِ بازگشت، تغییرات نامرتبط جدیدتر نشست را بازنویسی کند؛ مثل تغییرهای دستی `/model` یا به‌روزرسانی‌های چرخش نشست که هنگام اجرای تلاش رخ داده‌اند.

## سیاست منبع انتخاب

OpenClaw ارائه‌دهنده/مدل انتخاب‌شده را از دلیل انتخاب آن جدا می‌کند. همان منبع کنترل می‌کند که آیا زنجیره بازگشت مجاز است یا نه:

- **پیش‌فرض پیکربندی‌شده**: `agents.defaults.model.primary` از `agents.defaults.model.fallbacks` استفاده می‌کند.
- **مدل اصلی عامل**: `agents.list[].model` سخت‌گیرانه است، مگر اینکه شیء مدل آن عامل `fallbacks` خودش را داشته باشد. برای صریح کردن رفتار سخت‌گیرانه از `fallbacks: []` استفاده کنید، یا برای وارد کردن آن عامل به بازگشت مدل، یک فهرست غیرخالی بدهید.
- **جایگزینی بازگشت خودکار**: یک بازگشت زمان اجرا پیش از تلاش دوباره، `providerOverride`، `modelOverride`، `modelOverrideSource: "auto"`، و مدل مبدأ انتخاب‌شده را می‌نویسد. آن جایگزینی خودکار می‌تواند همچنان در زنجیره بازگشت پیکربندی‌شده پیش برود و با `/new`، `/reset`، و `sessions.reset` پاک می‌شود. اجراهای Heartbeat بدون `heartbeat.model` صریح نیز وقتی مبدأ دیگر با پیش‌فرض پیکربندی‌شده فعلی مطابقت نداشته باشد، یک جایگزینی خودکار مستقیم را پاک می‌کنند.
- **جایگزینی نشست کاربر**: `/model`، انتخابگر مدل، `session_status(model=...)`، و `sessions.patch` مقدار `modelOverrideSource: "user"` را می‌نویسند. این یک انتخاب دقیق نشست است. اگر ارائه‌دهنده/مدل انتخاب‌شده پیش از تولید پاسخ شکست بخورد، OpenClaw به‌جای پاسخ دادن از یک بازگشت پیکربندی‌شده نامرتبط، خرابی را گزارش می‌کند.
- **جایگزینی نشست قدیمی**: ورودی‌های قدیمی‌تر نشست ممکن است `modelOverride` بدون `modelOverrideSource` داشته باشند. OpenClaw آن‌ها را به‌عنوان جایگزینی‌های کاربر در نظر می‌گیرد تا یک انتخاب صریح قدیمی بی‌سروصدا به رفتار بازگشتی تبدیل نشود.
- **مدل بار Cron**: یک `payload.model` / `--model` برای کار cron، مدل اصلی کار است، نه جایگزینی نشست کاربر. این از بازگشت‌های پیکربندی‌شده استفاده می‌کند مگر اینکه کار `payload.fallbacks` بدهد؛ `payload.fallbacks: []` اجرای cron را سخت‌گیرانه می‌کند.

## ذخیره‌سازی احراز هویت (کلیدها + OAuth)

OpenClaw از **نمایه‌های احراز هویت** هم برای کلیدهای API و هم برای توکن‌های OAuth استفاده می‌کند.

- رازها در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارند (قدیمی: `~/.openclaw/agent/auth-profiles.json`).
- وضعیت مسیریابی احراز هویت زمان اجرا در `~/.openclaw/agents/<agentId>/agent/auth-state.json` قرار دارد.
- پیکربندی `auth.profiles` / `auth.order` فقط **فراداده + مسیریابی** هستند (بدون راز).
- فایل OAuth فقط برای واردسازی قدیمی: `~/.openclaw/credentials/oauth.json` (در اولین استفاده به `auth-profiles.json` وارد می‌شود).

جزئیات بیشتر: [OAuth](/fa/concepts/oauth)

انواع اعتبارنامه:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` برای بعضی ارائه‌دهنده‌ها)

## شناسه‌های نمایه

ورودهای OAuth نمایه‌های جداگانه می‌سازند تا چند حساب بتوانند کنار هم وجود داشته باشند.

- پیش‌فرض: `provider:default` وقتی ایمیلی در دسترس نیست.
- OAuth با ایمیل: `provider:<email>` (برای مثال `google-antigravity:user@gmail.com`).

نمایه‌ها در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` زیر `profiles` قرار دارند.

## ترتیب چرخش

وقتی یک ارائه‌دهنده چند نمایه دارد، OpenClaw ترتیبی مثل این انتخاب می‌کند:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (اگر تنظیم شده باشد).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` که بر اساس ارائه‌دهنده فیلتر شده‌اند.
  </Step>
  <Step title="Stored profiles">
    ورودی‌های `auth-profiles.json` برای ارائه‌دهنده.
  </Step>
</Steps>

اگر ترتیب صریحی پیکربندی نشده باشد، OpenClaw از ترتیب round-robin استفاده می‌کند:

- **کلید اصلی:** نوع نمایه (**OAuth پیش از کلیدهای API**).
- **کلید ثانویه:** `usageStats.lastUsed` (قدیمی‌ترین اول، درون هر نوع).
- **نمایه‌های در دوره انتظار/غیرفعال** به انتها منتقل می‌شوند و بر اساس نزدیک‌ترین زمان پایان مرتب می‌شوند.

### چسبندگی نشست (سازگار با کش)

OpenClaw **نمایه احراز هویت انتخاب‌شده را برای هر نشست ثابت می‌کند** تا کش‌های ارائه‌دهنده گرم بمانند. در هر درخواست **چرخش انجام نمی‌دهد**. نمایه ثابت‌شده دوباره استفاده می‌شود تا وقتی که:

- نشست بازنشانی شود (`/new` / `/reset`)
- یک Compaction کامل شود (شمارنده Compaction افزایش یابد)
- نمایه در دوره انتظار/غیرفعال باشد

انتخاب دستی از طریق `/model …@<profileId>` یک **جایگزینی کاربر** برای آن نشست تنظیم می‌کند و تا آغاز یک نشست جدید به‌صورت خودکار چرخش نمی‌یابد.

<Note>
نمایه‌های ثابت‌شده خودکار (که توسط مسیریاب نشست انتخاب شده‌اند) به‌عنوان یک **ترجیح** در نظر گرفته می‌شوند: ابتدا امتحان می‌شوند، اما OpenClaw ممکن است هنگام محدودیت نرخ/timeout به نمایه دیگری بچرخد. وقتی نمایه اصلی دوباره در دسترس شود، اجراهای جدید می‌توانند دوباره آن را ترجیح دهند بدون اینکه مدل یا زمان اجرای انتخاب‌شده تغییر کند. نمایه‌های ثابت‌شده توسط کاربر روی همان نمایه قفل می‌مانند؛ اگر شکست بخورد و بازگشت‌های مدل پیکربندی شده باشند، OpenClaw به‌جای تعویض نمایه‌ها به مدل بعدی می‌رود.
</Note>

### اشتراک OpenAI Codex به‌همراه پشتیبان کلید API

برای مدل‌های عامل OpenAI، احراز هویت و زمان اجرا جدا هستند. `openai/gpt-*` روی
harness Codex می‌ماند، در حالی که احراز هویت می‌تواند بین یک نمایه اشتراک Codex و
یک پشتیبان کلید API OpenAI بچرخد.

برای ترتیب قابل مشاهده برای کاربر از `auth.order.openai` استفاده کنید:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

نمایه‌های موجود اشتراک Codex ممکن است همچنان از شناسه نمایه قدیمی
`openai-codex:*` استفاده کنند. پشتیبان کلید API مرتب‌شده می‌تواند یک نمایه کلید API
معمولی `openai:*` باشد. وقتی اشتراک به محدودیت مصرف Codex می‌رسد،
OpenClaw زمان دقیق بازنشانی را، اگر Codex ارائه کند، ثبت می‌کند، نمایه احراز هویت
مرتب‌شده بعدی را امتحان می‌کند، و اجرا را داخل harness Codex نگه می‌دارد. پس از عبور زمان
بازنشانی، نمایه اشتراک دوباره واجد شرایط است و انتخاب خودکار بعدی می‌تواند به آن برگردد.

فقط وقتی از نمایه ثابت‌شده توسط کاربر استفاده کنید که می‌خواهید یک حساب/کلید را برای آن
نشست اجبار کنید. نمایه‌های ثابت‌شده توسط کاربر عمداً سخت‌گیرانه هستند و بی‌سروصدا
به نمایه دیگری نمی‌پرند.

## دوره‌های انتظار

وقتی یک نمایه به‌دلیل خطاهای احراز هویت/محدودیت نرخ (یا timeoutی که شبیه محدودیت نرخ به نظر می‌رسد) شکست بخورد، OpenClaw آن را در دوره انتظار علامت‌گذاری می‌کند و به نمایه بعدی می‌رود.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    آن سطل محدودیت نرخ گسترده‌تر از `429` ساده است: پیام‌های ارائه‌دهنده مثل `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، `throttled`، `resource exhausted`، و محدودیت‌های دوره‌ای پنجره مصرف مثل `weekly/monthly limit reached` را نیز شامل می‌شود.

    خطاهای قالب/درخواست نامعتبر معمولاً نهایی هستند، چون تلاش دوباره با همان بار به همان شکل شکست می‌خورد؛ بنابراین OpenClaw به‌جای چرخاندن نمایه‌های احراز هویت، آن‌ها را نمایش می‌دهد. مسیرهای شناخته‌شده تعمیر با تلاش دوباره می‌توانند صریحاً وارد شوند: برای مثال خرابی‌های اعتبارسنجی شناسه فراخوانی ابزار Cloud Code Assist پاک‌سازی می‌شوند و یک‌بار از طریق سیاست `allowFormatRetry` دوباره امتحان می‌شوند. خطاهای دلیل توقف سازگار با OpenAI مثل `Unhandled stop reason: error`، `stop reason: error`، و `reason: error` به‌عنوان سیگنال‌های timeout/تغییر مسیر طبقه‌بندی می‌شوند.

    متن عمومی سرور نیز وقتی منبع با یک الگوی گذرای شناخته‌شده مطابقت داشته باشد، می‌تواند در همان سطل timeout قرار بگیرد. برای مثال، پیام ساده پوشش‌دهنده جریان pi-ai یعنی `An unknown error occurred` برای هر ارائه‌دهنده شایسته تغییر مسیر در نظر گرفته می‌شود، چون pi-ai وقتی جریان‌های ارائه‌دهنده با `stopReason: "aborted"` یا `stopReason: "error"` بدون جزئیات مشخص پایان می‌یابند آن را منتشر می‌کند. بارهای JSON `api_error` با متن گذرای سرور مثل `internal server error`، `unknown error, 520`، `upstream error`، یا `backend error` نیز به‌عنوان timeoutهای شایسته تغییر مسیر در نظر گرفته می‌شوند.

    متن عمومی بالادستی ویژه OpenRouter مثل `Provider returned error` ساده فقط وقتی به‌عنوان timeout در نظر گرفته می‌شود که زمینه ارائه‌دهنده واقعاً OpenRouter باشد. متن عمومی بازگشت داخلی مثل `LLM request failed with an unknown error.` محافظه‌کارانه باقی می‌ماند و به‌تنهایی تغییر مسیر را فعال نمی‌کند.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    برخی SDKهای ارائه‌دهنده ممکن است در غیر این صورت پیش از بازگرداندن کنترل به OpenClaw برای یک پنجره طولانی `Retry-After` بخوابند. برای SDKهای مبتنی بر Stainless مثل Anthropic و OpenAI، OpenClaw به‌صورت پیش‌فرض انتظارهای داخلی SDK برای `retry-after-ms` / `retry-after` را به ۶۰ ثانیه محدود می‌کند و پاسخ‌های قابل تلاش دوباره طولانی‌تر را فوراً نمایش می‌دهد تا این مسیر تغییر مسیر بتواند اجرا شود. با `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` این سقف را تنظیم یا غیرفعال کنید؛ [رفتار تلاش دوباره](/fa/concepts/retry) را ببینید.
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    دوره‌های انتظار محدودیت نرخ می‌توانند محدود به مدل نیز باشند:

    - OpenClaw برای خرابی‌های محدودیت نرخ، وقتی شناسه مدل شکست‌خورده معلوم باشد، `cooldownModel` را ثبت می‌کند.
    - وقتی دوره انتظار به مدل دیگری محدود شده باشد، یک مدل هم‌خانواده روی همان ارائه‌دهنده همچنان می‌تواند امتحان شود.
    - پنجره‌های صورت‌حساب/غیرفعال همچنان کل نمایه را در همه مدل‌ها مسدود می‌کنند.

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

## غیرفعال‌سازی‌های صورت‌حساب

خرابی‌های صورت‌حساب/اعتبار (برای مثال "insufficient credits" / "credit balance too low") شایسته تغییر مسیر در نظر گرفته می‌شوند، اما معمولاً گذرا نیستند. OpenClaw به‌جای یک دوره انتظار کوتاه، نمایه را **غیرفعال** علامت‌گذاری می‌کند (با backoff طولانی‌تر) و به نمایه/ارائه‌دهنده بعدی می‌چرخد.

<Note>
هر پاسخ شبیه صورت‌حسابی `402` نیست، و هر HTTP `402` هم اینجا قرار نمی‌گیرد. OpenClaw متن صریح صورت‌حساب را حتی وقتی ارائه‌دهنده به‌جای آن `401` یا `403` برگرداند، در مسیر صورت‌حساب نگه می‌دارد، اما تطبیق‌دهنده‌های ویژه ارائه‌دهنده محدود به همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `403 Key limit exceeded`).

در همین حال، خطاهای موقت `402` مربوط به پنجره استفاده و سقف هزینه سازمان/فضای کاری، وقتی پیام retryable به نظر برسد (برای مثال `weekly usage limit exhausted`، `daily limit reached, resets tomorrow`، یا `organization spending limit exceeded`) به‌عنوان `rate_limit` طبقه‌بندی می‌شوند. این موارد به‌جای مسیر طولانی غیرفعال‌سازی به‌دلیل صورت‌حساب، روی مسیر cooldown/failover کوتاه باقی می‌مانند.
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

- backoff مربوط به صورت‌حساب از **5 ساعت** شروع می‌شود، با هر شکست صورت‌حساب دو برابر می‌شود، و در **24 ساعت** سقف دارد.
- اگر profile برای **24 ساعت** شکست نخورده باشد، شمارنده‌های backoff بازنشانی می‌شوند (قابل پیکربندی).
- تلاش‌های دوباره برای حالت overloaded اجازه **1 چرخش profile در همان provider** را پیش از model fallback می‌دهند.
- تلاش‌های دوباره برای حالت overloaded به‌طور پیش‌فرض از **0 ms backoff** استفاده می‌کنند.

## Model fallback

اگر همه profileهای یک provider شکست بخورند، OpenClaw به مدل بعدی در `agents.defaults.model.fallbacks` می‌رود. این برای شکست‌های احراز هویت، rate limitها، و timeoutهایی اعمال می‌شود که چرخش profile را تمام کرده‌اند (خطاهای دیگر fallback را جلو نمی‌برند). خطاهای provider که جزئیات کافی نشان نمی‌دهند همچنان در وضعیت fallback با برچسب دقیق مشخص می‌شوند: `empty_response` یعنی provider هیچ پیام یا وضعیت قابل استفاده‌ای برنگردانده است، `no_error_details` یعنی provider صراحتا `Unknown error (no error details in response)` را برگردانده است، و `unclassified` یعنی OpenClaw پیش‌نمایش خام را حفظ کرده اما هنوز هیچ classifierای با آن منطبق نشده است.

خطاهای overloaded و rate-limit تهاجمی‌تر از cooldownهای صورت‌حساب مدیریت می‌شوند. به‌طور پیش‌فرض، OpenClaw اجازه یک تلاش دوباره با auth-profile همان provider را می‌دهد، سپس بدون انتظار به fallback مدل پیکربندی‌شده بعدی تغییر می‌کند. سیگنال‌های provider-busy مانند `ModelNotReadyException` در همان دسته overloaded قرار می‌گیرند. این رفتار را با `auth.cooldowns.overloadedProfileRotations`، `auth.cooldowns.overloadedBackoffMs`، و `auth.cooldowns.rateLimitedProfileRotations` تنظیم کنید.

وقتی یک اجرا از primary پیش‌فرض پیکربندی‌شده، primary مربوط به Cron job، primary یک agent با fallbackهای صریح، یا یک fallback override انتخاب‌شده خودکار شروع شود، OpenClaw می‌تواند زنجیره fallback پیکربندی‌شده متناظر را طی کند. primaryهای agent بدون fallback صریح و انتخاب‌های صریح کاربر (برای مثال `/model ollama/qwen3.5:27b`، model picker، `sessions.patch`، یا overrideهای یک‌باره provider/model در CLI) سخت‌گیرانه هستند: اگر آن provider/model در دسترس نباشد یا پیش از تولید پاسخ شکست بخورد، OpenClaw به‌جای پاسخ دادن از یک fallback نامرتبط، شکست را گزارش می‌کند.

### قواعد زنجیره candidate

OpenClaw فهرست candidate را از `provider/model` درخواست‌شده فعلی به‌همراه fallbackهای پیکربندی‌شده می‌سازد.

<AccordionGroup>
  <Accordion title="Rules">
    - مدل درخواست‌شده همیشه اولین مورد است.
    - fallbackهای پیکربندی‌شده صریح deduplicate می‌شوند اما با allowlist مدل فیلتر نمی‌شوند. آن‌ها به‌عنوان قصد صریح operator در نظر گرفته می‌شوند.
    - اگر اجرای فعلی از قبل روی یک fallback پیکربندی‌شده در همان خانواده provider باشد، OpenClaw همچنان از زنجیره پیکربندی‌شده کامل استفاده می‌کند.
    - وقتی fallback override صریحی ارائه نشده باشد، fallbackهای پیکربندی‌شده پیش از primary پیکربندی‌شده امتحان می‌شوند، حتی اگر مدل درخواست‌شده از provider دیگری استفاده کند.
    - وقتی fallback override صریحی به fallback runner ارائه نشده باشد، primary پیکربندی‌شده در انتها اضافه می‌شود تا زنجیره بتواند پس از تمام شدن candidateهای قبلی دوباره روی پیش‌فرض عادی مستقر شود.
    - وقتی caller مقدار `fallbacksOverride` را ارائه می‌کند، runner دقیقا از مدل درخواست‌شده به‌همراه همان فهرست override استفاده می‌کند. فهرست خالی model fallback را غیرفعال می‌کند و از اضافه شدن primary پیکربندی‌شده به‌عنوان هدف retry پنهان جلوگیری می‌کند.

  </Accordion>
</AccordionGroup>

### کدام خطاها fallback را جلو می‌برند

<Tabs>
  <Tab title="Continues on">
    - شکست‌های احراز هویت
    - rate limitها و تمام شدن cooldown
    - خطاهای overloaded/provider-busy
    - خطاهای failover با شکل timeout
    - غیرفعال‌سازی‌های صورت‌حساب
    - `LiveSessionModelSwitchError` که به یک مسیر failover نرمال‌سازی می‌شود تا یک مدل persisted قدیمی باعث ایجاد outer retry loop نشود
    - خطاهای ناشناخته دیگر وقتی هنوز candidate باقی مانده باشد

  </Tab>
  <Tab title="Does not continue on">
    - abortهای صریحی که شکل timeout/failover ندارند
    - خطاهای context overflow که باید داخل منطق compaction/retry باقی بمانند (برای مثال `request_too_large`، `INVALID_ARGUMENT: input exceeds the maximum number of tokens`، `input token count exceeds the maximum number of input tokens`، `The input is too long for the model`، یا `ollama error: context length exceeded`)
    - خطای نهایی ناشناخته وقتی candidate دیگری باقی نمانده باشد

  </Tab>
</Tabs>

### رفتار عبور از cooldown در برابر probe

وقتی همه auth profileهای یک provider از قبل در cooldown باشند، OpenClaw به‌طور خودکار آن provider را برای همیشه رد نمی‌کند. برای هر candidate جداگانه تصمیم می‌گیرد:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - شکست‌های پایدار احراز هویت بلافاصله کل provider را رد می‌کنند.
    - غیرفعال‌سازی‌های صورت‌حساب معمولا رد می‌شوند، اما candidate اصلی همچنان می‌تواند با throttle probe شود تا بازیابی بدون restart ممکن باشد.
    - candidate اصلی ممکن است نزدیک انقضای cooldown، با throttle مختص هر provider، probe شود.
    - siblingهای fallback در همان provider می‌توانند با وجود cooldown امتحان شوند، وقتی شکست گذرا به نظر برسد (`rate_limit`، `overloaded`، یا ناشناخته). این به‌ویژه وقتی rate limit در سطح مدل باشد و یک sibling model همچنان بتواند فورا بازیابی شود مهم است.
    - probeهای cooldown گذرا به یکی برای هر provider در هر اجرای fallback محدود می‌شوند تا یک provider منفرد fallback بین providerها را متوقف نکند.

  </Accordion>
</AccordionGroup>

## overrideهای session و live model switching

تغییرات مدل session وضعیت مشترک هستند. runner فعال، فرمان `/model`، به‌روزرسانی‌های compaction/session، و live-session reconciliation همگی بخش‌هایی از همان entry مربوط به session را می‌خوانند یا می‌نویسند.

این یعنی retryهای fallback باید با live model switching هماهنگ شوند:

- فقط تغییرات مدل صریح و کاربرمحور یک live switch در انتظار را علامت‌گذاری می‌کنند. این شامل `/model`، `session_status(model=...)`، و `sessions.patch` است.
- تغییرات مدل سیستم‌محور مانند fallback rotation، overrideهای Heartbeat، یا Compaction هرگز به‌تنهایی یک live switch در انتظار را علامت‌گذاری نمی‌کنند.
- overrideهای مدل کاربرمحور برای سیاست fallback به‌عنوان انتخاب‌های دقیق در نظر گرفته می‌شوند، بنابراین provider انتخاب‌شده‌ای که در دسترس نیست به‌جای پنهان شدن پشت `agents.defaults.model.fallbacks` به‌صورت شکست نشان داده می‌شود.
- پیش از شروع retry fallback، reply runner فیلدهای fallback override انتخاب‌شده را در entry مربوط به session persist می‌کند.
- auto fallback overrideها در نوبت‌های بعدی انتخاب‌شده باقی می‌مانند تا OpenClaw در هر پیام یک primary شناخته‌شده خراب را probe نکند. `/new`، `/reset`، و `sessions.reset` overrideهای auto-sourced را پاک می‌کنند و session را به پیش‌فرض پیکربندی‌شده برمی‌گردانند.
- `/status` مدل انتخاب‌شده را نشان می‌دهد و وقتی وضعیت fallback متفاوت باشد، مدل fallback فعال و دلیل را نیز نشان می‌دهد.
- live-session reconciliation، overrideهای persisted در session را به فیلدهای runtime model قدیمی ترجیح می‌دهد.
- اگر خطای live-switch به candidate بعدی در زنجیره fallback فعال اشاره کند، OpenClaw به‌جای طی کردن candidateهای نامرتبط، مستقیما به همان مدل انتخاب‌شده می‌پرد.
- اگر تلاش fallback شکست بخورد، runner فقط فیلدهای overrideای را که نوشته است rollback می‌کند، و فقط اگر آن‌ها هنوز با همان candidate شکست‌خورده منطبق باشند.

این از race کلاسیک جلوگیری می‌کند:

<Steps>
  <Step title="Primary fails">
    مدل primary انتخاب‌شده شکست می‌خورد.
  </Step>
  <Step title="Fallback chosen in memory">
    candidate fallback در memory انتخاب می‌شود.
  </Step>
  <Step title="Session store still says old primary">
    session store همچنان primary قدیمی را منعکس می‌کند.
  </Step>
  <Step title="Live reconciliation reads stale state">
    live-session reconciliation وضعیت stale در session را می‌خواند.
  </Step>
  <Step title="Retry snapped back">
    پیش از شروع تلاش fallback، retry به مدل قدیمی برگردانده می‌شود.
  </Step>
</Steps>

fallback override persisted این بازه را می‌بندد، و rollback محدود تغییرات جدیدتر دستی یا runtime session را دست‌نخورده نگه می‌دارد.

## مشاهده‌پذیری و خلاصه‌های شکست

`runWithModelFallback(...)` جزئیات هر تلاش را ثبت می‌کند که خوراک logها و پیام‌رسانی cooldown کاربرمحور می‌شود:

- provider/model امتحان‌شده
- دلیل (`rate_limit`، `overloaded`، `billing`، `auth`، `model_not_found`، و دلیل‌های failover مشابه)
- status/code اختیاری
- خلاصه خطای قابل خواندن برای انسان

logهای ساختاریافته `model_fallback_decision` همچنین وقتی یک candidate شکست می‌خورد، رد می‌شود، یا fallback بعدی موفق می‌شود، فیلدهای تخت `fallbackStep*` را نیز شامل می‌شوند. این فیلدها گذار امتحان‌شده را صریح می‌کنند (`fallbackStepFromModel`، `fallbackStepToModel`، `fallbackStepFromFailureReason`، `fallbackStepFromFailureDetail`، `fallbackStepFinalOutcome`) تا صادرکننده‌های log و diagnostics بتوانند شکست primary را بازسازی کنند، حتی وقتی fallback پایانی نیز شکست بخورد.

وقتی همه candidateها شکست بخورند، OpenClaw خطای `FallbackSummaryError` را پرتاب می‌کند. outer reply runner می‌تواند از آن برای ساخت پیام مشخص‌تری مانند «همه مدل‌ها موقتا rate-limited هستند» استفاده کند و وقتی نزدیک‌ترین زمان انقضای cooldown مشخص باشد، آن را نیز درج کند.

آن خلاصه cooldown از مدل آگاه است:

- rate limitهای مدل‌محور نامرتبط برای زنجیره provider/model امتحان‌شده نادیده گرفته می‌شوند
- اگر block باقی‌مانده یک rate limit مدل‌محور منطبق باشد، OpenClaw آخرین expiry منطبق را که هنوز آن مدل را مسدود می‌کند گزارش می‌کند

## پیکربندی مرتبط

برای موارد زیر [پیکربندی Gateway](/fa/gateway/configuration) را ببینید:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- مسیریابی `agents.defaults.imageModel`

برای نمای کلی گسترده‌تر انتخاب مدل و fallback، [مدل‌ها](/fa/concepts/models) را ببینید.
