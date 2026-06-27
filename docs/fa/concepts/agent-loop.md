---
read_when:
    - به یک راهنمای گام‌به‌گام دقیق از حلقه عامل یا رویدادهای چرخه عمر نیاز دارید
    - شما در حال تغییر صف‌بندی نشست، نوشتن رونوشت، یا رفتار قفل نوشتن نشست هستید
summary: چرخهٔ حیات حلقهٔ عامل، جریان‌ها و معناشناسی انتظار
title: چرخه عامل
x-i18n:
    generated_at: "2026-06-27T17:30:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

حلقه عامل، اجرای کامل و «واقعی» یک عامل است: دریافت → مونتاژ زمینه → استنتاج مدل →
اجرای ابزار → پاسخ‌های جریانی → ماندگاری. این مسیر مرجع است که یک پیام را
به کنش‌ها و یک پاسخ نهایی تبدیل می‌کند، در حالی که وضعیت نشست را سازگار نگه می‌دارد.

در OpenClaw، یک حلقه یک اجرای واحد و سریال‌شده برای هر نشست است که هم‌زمان با فکر کردن مدل،
فراخوانی ابزارها و جریان دادن خروجی، رویدادهای چرخه عمر و جریان را منتشر می‌کند. این سند توضیح می‌دهد که آن حلقه اصیل
چگونه از ابتدا تا انتها سیم‌کشی شده است.

## نقاط ورود

- RPC در Gateway: `agent` و `agent.wait`.
- CLI: دستور `agent`.

## نحوه کارکرد (سطح بالا)

1. RPC `agent` پارامترها را اعتبارسنجی می‌کند، نشست را حل می‌کند (sessionKey/sessionId)، فراداده نشست را پایدار می‌کند و بلافاصله `{ runId, acceptedAt }` را برمی‌گرداند.
2. `agentCommand` عامل را اجرا می‌کند:
   - مدل + پیش‌فرض‌های thinking/verbose/trace را حل می‌کند
   - snapshot مربوط به Skills را بارگذاری می‌کند
   - `runEmbeddedAgent` را فراخوانی می‌کند (زمان‌اجرای عامل OpenClaw)
   - اگر حلقه embedded یکی منتشر نکند، **پایان/خطای چرخه عمر** را منتشر می‌کند
3. `runEmbeddedAgent`:
   - اجراها را از طریق صف‌های سراسری + به‌ازای هر نشست سریال‌سازی می‌کند
   - مدل + پروفایل احراز هویت را حل می‌کند و نشست OpenClaw را می‌سازد
   - مشترک رویدادهای زمان‌اجرا می‌شود و دلتاهای دستیار/ابزار را جریان می‌دهد
   - timeout را اعمال می‌کند -> اگر از حد بگذرد اجرا را abort می‌کند
   - برای نوبت‌های app-server در Codex، نوبت پذیرفته‌شده‌ای را که پیش از یک رویداد پایانی تولید پیشرفت app-server را متوقف می‌کند abort می‌کند
   - payloadها + فراداده مصرف را برمی‌گرداند
4. `subscribeEmbeddedAgentSession` رویدادهای زمان‌اجرای عامل را به جریان `agent` در OpenClaw پل می‌زند:
   - رویدادهای ابزار => `stream: "tool"`
   - دلتاهای دستیار => `stream: "assistant"`
   - رویدادهای چرخه عمر => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` از `waitForAgentRun` استفاده می‌کند:
   - منتظر **پایان/خطای چرخه عمر** برای `runId` می‌ماند
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` را برمی‌گرداند

## صف‌بندی + هم‌زمانی

- اجراها برای هر کلید نشست (مسیر نشست) و به‌صورت اختیاری از طریق یک مسیر سراسری سریال‌سازی می‌شوند.
- این کار از raceهای ابزار/نشست جلوگیری می‌کند و تاریخچه نشست را سازگار نگه می‌دارد.
- کانال‌های پیام‌رسانی می‌توانند حالت‌های صف (steer/followup/collect/interrupt) را انتخاب کنند که به این سیستم مسیر خوراک می‌دهند.
  [صف دستور](/fa/concepts/queue) را ببینید.
- نوشتن transcriptها نیز با یک قفل نوشتن نشست روی فایل نشست محافظت می‌شود. قفل
  از فرایند آگاه و مبتنی بر فایل است، بنابراین نویسندگانی را که صف درون‌فرایندی را دور می‌زنند یا از
  فرایند دیگری می‌آیند شناسایی می‌کند. نویسندگان transcript نشست تا `session.writeLock.acquireTimeoutMs`
  منتظر می‌مانند و سپس نشست را مشغول گزارش می‌کنند؛ مقدار پیش‌فرض `60000` میلی‌ثانیه است.
- قفل‌های نوشتن نشست به‌صورت پیش‌فرض non-reentrant هستند. اگر یک helper عمدا اخذ
  همان قفل را درون خود تودرتو کند و در عین حال یک نویسنده منطقی را حفظ کند، باید صراحتا با
  `allowReentrant: true` وارد این حالت شود.

## آماده‌سازی نشست + workspace

- workspace حل و ساخته می‌شود؛ اجراهای sandboxed ممکن است به ریشه workspace مربوط به sandbox هدایت شوند.
- Skills بارگذاری می‌شود (یا از snapshot دوباره استفاده می‌شود) و به env و prompt تزریق می‌شود.
- فایل‌های bootstrap/context حل می‌شوند و به گزارش system prompt تزریق می‌شوند.
- یک قفل نوشتن نشست اخذ می‌شود؛ `SessionManager` پیش از جریان‌دهی باز و آماده می‌شود. هر
  مسیر بازنویسی transcript، Compaction یا کوتاه‌سازی بعدی باید پیش از باز کردن یا
  تغییر دادن فایل transcript همان قفل را بگیرد.

## مونتاژ prompt + system prompt

- system prompt از prompt پایه OpenClaw، prompt مربوط به Skills، زمینه bootstrap و overrideهای هر اجرا ساخته می‌شود.
- محدودیت‌های ویژه مدل و توکن‌های ذخیره Compaction اعمال می‌شوند.
- برای آنچه مدل می‌بیند، [System prompt](/fa/concepts/system-prompt) را ببینید.

## نقاط hook (جایی که می‌توانید رهگیری کنید)

OpenClaw دو سیستم hook دارد:

- **hookهای داخلی** (hookهای Gateway): اسکریپت‌های رویدادمحور برای دستورها و رویدادهای چرخه عمر.
- **hookهای Plugin**: نقاط توسعه‌پذیری داخل چرخه عمر عامل/ابزار و pipeline در gateway.

### hookهای داخلی (hookهای Gateway)

- **`agent:bootstrap`**: هنگام ساخت فایل‌های bootstrap پیش از نهایی شدن system prompt اجرا می‌شود.
  از این برای افزودن/حذف فایل‌های زمینه bootstrap استفاده کنید.
- **hookهای دستور**: `/new`، `/reset`، `/stop` و دیگر رویدادهای دستور (سند Hooks را ببینید).

برای راه‌اندازی و مثال‌ها [Hooks](/fa/automation/hooks) را ببینید.

### hookهای Plugin (چرخه عمر عامل + gateway)

این‌ها داخل حلقه عامل یا pipeline در gateway اجرا می‌شوند:

- **`before_model_resolve`**: پیش از نشست (بدون `messages`) اجرا می‌شود تا پیش از حل مدل، provider/model را به‌صورت قطعی override کند.
- **`before_prompt_build`**: پس از بارگذاری نشست (با `messages`) اجرا می‌شود تا پیش از ارسال prompt، `prependContext`، `systemPrompt`، `prependSystemContext` یا `appendSystemContext` را تزریق کند. از `prependContext` برای متن پویای هر نوبت و از فیلدهای system-context برای راهنمایی پایدار که باید در فضای system prompt قرار بگیرد استفاده کنید.
- **`before_agent_start`**: hook سازگاری قدیمی که ممکن است در هرکدام از فازها اجرا شود؛ hookهای صریح بالا را ترجیح دهید.
- **`before_agent_reply`**: پس از کنش‌های inline و پیش از فراخوانی LLM اجرا می‌شود و اجازه می‌دهد یک Plugin نوبت را claim کند و یک پاسخ synthetic برگرداند یا کل نوبت را بی‌صدا کند.
- **`agent_end`**: فهرست پیام نهایی و فراداده اجرا را پس از تکمیل بررسی کنید.
- **`before_compaction` / `after_compaction`**: چرخه‌های Compaction را مشاهده یا حاشیه‌نویسی کنید.
- **`before_tool_call` / `after_tool_call`**: پارامترها/نتایج ابزار را رهگیری کنید.
- **`before_install`**: مواد staged نصب skill یا Plugin را پس از اجرای سیاست نصب operator، وقتی hookهای Plugin در فرایند فعلی OpenClaw بارگذاری شده‌اند، بررسی کنید.
- **`tool_result_persist`**: نتایج ابزار را پیش از نوشته شدن در transcript نشست تحت مالکیت OpenClaw، به‌صورت هم‌زمان تبدیل کنید.
- **`message_received` / `message_sending` / `message_sent`**: hookهای پیام ورودی + خروجی.
- **`session_start` / `session_end`**: مرزهای چرخه عمر نشست.
- **`gateway_start` / `gateway_stop`**: رویدادهای چرخه عمر gateway.

قواعد تصمیم hook برای محافظ‌های خروجی/ابزار:

- `before_tool_call`: `{ block: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` no-op است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` no-op است و block قبلی را پاک نمی‌کند.
- برای تصمیم‌های allow/block نصب تحت مالکیت operator که باید مسیرهای نصب و به‌روزرسانی CLI را پوشش دهند، از `security.installPolicy` استفاده کنید، نه `before_install`.
- `message_sending`: `{ cancel: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` no-op است و cancel قبلی را پاک نمی‌کند.

برای API hook و جزئیات ثبت، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

harnessها ممکن است این hookها را به‌شکل متفاوتی سازگار کنند. harness مربوط به app-server در Codex،
hookهای Plugin در OpenClaw را به‌عنوان قرارداد سازگاری برای سطح‌های mirror شده مستند
نگه می‌دارد، در حالی که hookهای native در Codex یک سازوکار جداگانه و سطح‌پایین‌تر Codex باقی می‌مانند.

## جریان‌دهی + پاسخ‌های جزئی

- دلتاهای دستیار از زمان‌اجرای عامل جریان داده می‌شوند و به‌عنوان رویدادهای `assistant` منتشر می‌شوند.
- جریان‌دهی block می‌تواند پاسخ‌های جزئی را یا روی `text_end` یا `message_end` منتشر کند.
- جریان‌دهی استدلال می‌تواند به‌عنوان یک جریان جداگانه یا به‌عنوان پاسخ‌های block منتشر شود.
- برای رفتار chunking و پاسخ block، [Streaming](/fa/concepts/streaming) را ببینید.

## اجرای ابزار + ابزارهای پیام‌رسانی

- رویدادهای شروع/به‌روزرسانی/پایان ابزار روی جریان `tool` منتشر می‌شوند.
- نتایج ابزار پیش از logging/emitting از نظر اندازه و payloadهای تصویر پاک‌سازی می‌شوند.
- ارسال‌های ابزار پیام‌رسانی ردیابی می‌شوند تا تأییدهای تکراری دستیار سرکوب شوند.

## شکل‌دهی پاسخ + سرکوب

- payloadهای نهایی از این‌ها مونتاژ می‌شوند:
  - متن دستیار (و استدلال اختیاری)
  - خلاصه‌های inline ابزار (وقتی verbose + مجاز باشد)
  - متن خطای دستیار وقتی مدل خطا می‌دهد
- توکن silent دقیق `NO_REPLY` / `no_reply` از payloadهای خروجی
  فیلتر می‌شود.
- موارد تکراری ابزار پیام‌رسانی از فهرست payload نهایی حذف می‌شوند.
- اگر هیچ payload قابل render باقی نماند و ابزاری خطا داده باشد، یک پاسخ fallback خطای ابزار منتشر می‌شود
  (مگر اینکه یک ابزار پیام‌رسانی از قبل پاسخی قابل مشاهده برای کاربر فرستاده باشد).

## Compaction + تلاش‌های مجدد

- Auto-compaction رویدادهای جریان `compaction` را منتشر می‌کند و می‌تواند یک تلاش مجدد را trigger کند.
- در تلاش مجدد، bufferهای درون‌حافظه و خلاصه‌های ابزار reset می‌شوند تا از خروجی تکراری جلوگیری شود.
- برای pipeline مربوط به Compaction، [Compaction](/fa/concepts/compaction) را ببینید.

## جریان‌های رویداد (امروز)

- `lifecycle`: توسط `subscribeEmbeddedAgentSession` منتشر می‌شود (و به‌عنوان fallback توسط `agentCommand`)
- `assistant`: دلتاهای جریان‌یافته از زمان‌اجرای عامل
- `tool`: رویدادهای جریان‌یافته ابزار از زمان‌اجرای عامل

## مدیریت کانال chat

- دلتاهای دستیار در پیام‌های `delta` مربوط به chat بافر می‌شوند.
- یک `final` مربوط به chat در **پایان/خطای چرخه عمر** منتشر می‌شود.

## timeoutها

- پیش‌فرض `agent.wait`: ۳۰ ثانیه (فقط انتظار). پارامتر `timeoutMs` override می‌کند.
- زمان‌اجرای عامل: پیش‌فرض `agents.defaults.timeoutSeconds` برابر ۱۷۲۸۰۰ ثانیه (۴۸ ساعت) است؛ در timer مربوط به abort در `runEmbeddedAgent` اعمال می‌شود.
- زمان‌اجرای Cron: `timeoutSeconds` مربوط به نوبت عامل ایزوله‌شده تحت مالکیت cron است. scheduler آن timer را هنگام شروع اجرا آغاز می‌کند، اجرای زیربنایی را در deadline پیکربندی‌شده abort می‌کند، سپس پیش از ثبت timeout پاک‌سازی bounded را اجرا می‌کند تا یک نشست child stale نتواند مسیر را گیر بیندازد.
- diagnostics زنده‌بودن نشست: با فعال بودن diagnostics، `diagnostics.stuckSessionWarnMs` نشست‌های طولانی `processing` را که هیچ پیشرفت مشاهده‌شده‌ای در پاسخ، ابزار، وضعیت، block یا ACP ندارند طبقه‌بندی می‌کند. اجراهای embedded فعال، فراخوانی‌های مدل و فراخوانی‌های ابزار به‌عنوان `session.long_running` گزارش می‌شوند؛ فراخوانی‌های silent مدلِ دارای مالک نیز تا `diagnostics.stuckSessionAbortMs` در `session.long_running` می‌مانند تا providerهای کند یا غیرجریانی خیلی زود stalled گزارش نشوند. کار فعال بدون پیشرفت اخیر به‌عنوان `session.stalled` گزارش می‌شود؛ فراخوانی‌های مدل دارای مالک در آستانه abort یا پس از آن به `session.stalled` تغییر می‌کنند، و فعالیت stale مدل/ابزار بدون مالک به‌عنوان long-running پنهان نمی‌شود. `session.stuck` برای bookkeeping نشست stale قابل بازیابی رزرو شده است، از جمله نشست‌های در صف idle با فعالیت stale مدل/ابزار بدون مالک. bookkeeping نشست stale بلافاصله پس از عبور gateهای بازیابی، مسیر نشست متأثر را آزاد می‌کند؛ اجراهای embedded stalled فقط پس از `diagnostics.stuckSessionAbortMs` (پیش‌فرض: حداقل ۵ دقیقه و ۳ برابر آستانه هشدار) abort-drain می‌شوند تا کارهای در صف بتوانند بدون قطع کردن اجراهای صرفا کند از سر گرفته شوند. بازیابی outcomeهای ساختاریافته requested/completed را منتشر می‌کند، و وضعیت diagnostic فقط اگر همان generation پردازشی هنوز جاری باشد idle علامت‌گذاری می‌شود. diagnosticsهای تکراری `session.stuck` تا وقتی نشست بدون تغییر بماند back off می‌کنند.
- timeout بیکاری مدل: OpenClaw وقتی پیش از پنجره بیکاری هیچ chunk پاسخی نرسد، درخواست مدل را abort می‌کند. `models.providers.<id>.timeoutSeconds` این watchdog بیکاری را برای providerهای local/self-hosted کند تمدید می‌کند، اما همچنان با هر `agents.defaults.timeoutSeconds` پایین‌تر یا timeout ویژه اجرا bounded می‌شود، چون آن‌ها کل اجرای عامل را کنترل می‌کنند. در غیر این صورت OpenClaw وقتی `agents.defaults.timeoutSeconds` پیکربندی شده باشد از آن استفاده می‌کند، با cap پیش‌فرض ۱۲۰ ثانیه. اجراهای مدل ابری trigger شده توسط Cron بدون timeout صریح مدل یا عامل از همان watchdog بیکاری پیش‌فرض استفاده می‌کنند؛ با timeout صریح اجرای cron، stallهای جریان مدل ابری به ۶۰ ثانیه محدود می‌شوند تا fallbackهای مدل پیکربندی‌شده بتوانند پیش از deadline بیرونی cron اجرا شوند. اجراهای مدل local یا self-hosted که توسط Cron trigger شده‌اند، مگر اینکه timeout صریحی پیکربندی شده باشد، watchdog ضمنی را غیرفعال می‌کنند، و timeoutهای صریح اجرای cron همچنان پنجره بیکاری برای providerهای local/self-hosted باقی می‌مانند، بنابراین providerهای local کند باید `models.providers.<id>.timeoutSeconds` را تنظیم کنند.
- timeout درخواست HTTP provider: `models.providers.<id>.timeoutSeconds` برای fetchهای HTTP مدل آن provider اعمال می‌شود، از جمله connect، headers، body، timeout درخواست SDK، مدیریت abort guarded-fetch کل، و watchdog بیکاری جریان مدل. برای providerهای کند local/self-hosted مانند Ollama پیش از بالا بردن timeout کل زمان‌اجرای عامل از این استفاده کنید، و وقتی درخواست مدل باید طولانی‌تر اجرا شود timeout عامل/زمان‌اجرا را دست‌کم به همان اندازه نگه دارید.

## جاهایی که کار می‌تواند زودتر پایان یابد

- پایان مهلت عامل (قطع)
- AbortSignal (لغو)
- قطع اتصال Gateway یا پایان مهلت RPC
- پایان مهلت `agent.wait` (فقط انتظار، عامل را متوقف نمی‌کند)

## مرتبط

- [ابزارها](/fa/tools) — ابزارهای عاملِ در دسترس
- [قلاب‌ها](/fa/automation/hooks) — اسکریپت‌های رویدادمحور که با رویدادهای چرخهٔ عمر عامل فعال می‌شوند
- [Compaction](/fa/concepts/compaction) — نحوهٔ خلاصه‌سازی مکالمه‌های طولانی
- [تأییدهای اجرا](/fa/tools/exec-approvals) — دروازه‌های تأیید برای فرمان‌های shell
- [تفکر](/fa/tools/thinking) — پیکربندی سطح تفکر/استدلال
