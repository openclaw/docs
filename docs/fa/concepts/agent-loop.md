---
read_when:
    - به یک راهنمای گام‌به‌گام دقیق از حلقهٔ عامل یا رویدادهای چرخهٔ حیات نیاز دارید
    - در حال تغییر صف‌بندی نشست، نوشتن در رونوشت، یا رفتار قفل نوشتن نشست هستید
summary: چرخهٔ حیات حلقهٔ عامل، جریان‌ها و معناشناسی انتظار
title: حلقهٔ عامل
x-i18n:
    generated_at: "2026-05-06T09:08:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

حلقه عامل‌محور اجرای کامل و «واقعی» یک عامل است: دریافت → گردآوری زمینه → استنتاج مدل →
اجرای ابزار → پاسخ‌های جریانی → ماندگاری. این مسیر معتبر است که یک پیام را
به اقدامات و یک پاسخ نهایی تبدیل می‌کند، در حالی که وضعیت نشست را سازگار نگه می‌دارد.

در OpenClaw، یک حلقه یک اجرای واحد و سریالی‌شده برای هر نشست است که رویدادهای چرخه عمر و جریان را
هنگامی که مدل فکر می‌کند، ابزارها را فراخوانی می‌کند، و خروجی را جریان می‌دهد منتشر می‌کند. این سند توضیح می‌دهد آن حلقه اصیل
چگونه از ابتدا تا انتها متصل شده است.

## نقاط ورود

- RPC Gateway: `agent` و `agent.wait`.
- CLI: فرمان `agent`.

## نحوه کار (سطح بالا)

1. RPC `agent` پارامترها را اعتبارسنجی می‌کند، نشست را حل می‌کند (sessionKey/sessionId)، فراداده نشست را ماندگار می‌کند، و بلافاصله `{ runId, acceptedAt }` را برمی‌گرداند.
2. `agentCommand` عامل را اجرا می‌کند:
   - پیش‌فرض‌های مدل + تفکر/جزئیات/ردیابی را حل می‌کند
   - snapshot مربوط به Skills را بارگذاری می‌کند
   - `runEmbeddedPiAgent` را فراخوانی می‌کند (زمان اجرای pi-agent-core)
   - اگر حلقه توکار یکی منتشر نکند، **پایان/خطای چرخه عمر** را منتشر می‌کند
3. `runEmbeddedPiAgent`:
   - اجراها را از طریق صف‌های سراسری + مختص هر نشست سریالی می‌کند
   - مدل + پروفایل احراز هویت را حل می‌کند و نشست Pi را می‌سازد
   - در رویدادهای pi مشترک می‌شود و دلتاهای دستیار/ابزار را جریان می‌دهد
   - timeout را اعمال می‌کند -> اگر از حد بگذرد اجرا را abort می‌کند
   - برای نوبت‌های سرور برنامه Codex، نوبت پذیرفته‌شده‌ای را که پیش از یک رویداد پایانی دیگر پیشرفت سرور برنامه تولید نمی‌کند abort می‌کند
   - payloadها + فراداده مصرف را برمی‌گرداند
4. `subscribeEmbeddedPiSession` رویدادهای pi-agent-core را به جریان `agent` در OpenClaw پل می‌زند:
   - رویدادهای ابزار => `stream: "tool"`
   - دلتاهای دستیار => `stream: "assistant"`
   - رویدادهای چرخه عمر => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` از `waitForAgentRun` استفاده می‌کند:
   - برای **پایان/خطای چرخه عمر** مربوط به `runId` منتظر می‌ماند
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` را برمی‌گرداند

## صف‌بندی + همزمانی

- اجراها برای هر کلید نشست (مسیر نشست) و در صورت نیاز از طریق یک مسیر سراسری سریالی می‌شوند.
- این کار از رقابت‌های ابزار/نشست جلوگیری می‌کند و تاریخچه نشست را سازگار نگه می‌دارد.
- کانال‌های پیام‌رسانی می‌توانند حالت‌های صف (جمع‌آوری/هدایت/پیگیری) را انتخاب کنند که این سامانه مسیر را تغذیه می‌کنند.
  [صف فرمان](/fa/concepts/queue) را ببینید.
- نوشتن transcript نیز با قفل نوشتن نشست روی فایل نشست محافظت می‌شود. قفل
  آگاه از فرایند و مبتنی بر فایل است، بنابراین نویسندگانی را که صف درون‌فرایندی را دور می‌زنند یا از
  فرایند دیگری می‌آیند شناسایی می‌کند. نویسندگان transcript نشست تا `session.writeLock.acquireTimeoutMs`
  منتظر می‌مانند و سپس نشست را مشغول گزارش می‌کنند؛ پیش‌فرض `60000` میلی‌ثانیه است.
- قفل‌های نوشتن نشست به‌صورت پیش‌فرض بازدرون‌رو نیستند. اگر یک helper عمداً acquisition همان قفل را
  در حالی که یک نویسنده منطقی را حفظ می‌کند تو در تو کند، باید صریحاً با
  `allowReentrant: true` opt in کند.

## آماده‌سازی نشست + workspace

- Workspace حل و ایجاد می‌شود؛ اجراهای sandbox ممکن است به ریشه workspace در sandbox هدایت شوند.
- Skills بارگذاری می‌شوند (یا از snapshot دوباره استفاده می‌شوند) و به env و prompt تزریق می‌شوند.
- فایل‌های bootstrap/زمینه حل می‌شوند و در گزارش system prompt تزریق می‌شوند.
- یک قفل نوشتن نشست گرفته می‌شود؛ `SessionManager` پیش از streaming باز و آماده می‌شود. هر
  مسیر بازنویسی transcript، Compaction، یا کوتاه‌سازی بعدی باید پیش از باز کردن یا
  جهش دادن فایل transcript همان قفل را بگیرد.

## مونتاژ prompt + system prompt

- system prompt از prompt پایه OpenClaw، prompt مربوط به Skills، زمینه bootstrap، و overrideهای هر اجرا ساخته می‌شود.
- محدودیت‌های مختص مدل و توکن‌های ذخیره Compaction اعمال می‌شوند.
- برای آنچه مدل می‌بیند، [System prompt](/fa/concepts/system-prompt) را ببینید.

## نقاط hook (جاهایی که می‌توانید مداخله کنید)

OpenClaw دو سامانه hook دارد:

- **hookهای داخلی** (hookهای Gateway): اسکریپت‌های رویدادمحور برای فرمان‌ها و رویدادهای چرخه عمر.
- **hookهای Plugin**: نقاط توسعه درون چرخه عمر عامل/ابزار و pipeline مربوط به gateway.

### hookهای داخلی (hookهای Gateway)

- **`agent:bootstrap`**: هنگام ساخت فایل‌های bootstrap پیش از نهایی شدن system prompt اجرا می‌شود.
  از این برای افزودن/حذف فایل‌های زمینه bootstrap استفاده کنید.
- **hookهای فرمان**: `/new`، `/reset`، `/stop`، و دیگر رویدادهای فرمان (سند Hooks را ببینید).

برای راه‌اندازی و نمونه‌ها، [Hooks](/fa/automation/hooks) را ببینید.

### hookهای Plugin (چرخه عمر عامل + gateway)

این‌ها درون حلقه عامل یا pipeline مربوط به gateway اجرا می‌شوند:

- **`before_model_resolve`**: پیش از نشست اجرا می‌شود (بدون `messages`) تا پیش از حل مدل، provider/model را به‌صورت قطعی override کند.
- **`before_prompt_build`**: پس از بارگذاری نشست (با `messages`) اجرا می‌شود تا پیش از ارسال prompt، `prependContext`، `systemPrompt`، `prependSystemContext`، یا `appendSystemContext` را تزریق کند. از `prependContext` برای متن پویای هر نوبت و از فیلدهای system-context برای راهنمایی پایدار استفاده کنید که باید در فضای system prompt قرار بگیرد.
- **`before_agent_start`**: hook سازگاری قدیمی که ممکن است در هرکدام از دو فاز اجرا شود؛ hookهای صریح بالا را ترجیح دهید.
- **`before_agent_reply`**: پس از اقدام‌های inline و پیش از فراخوانی LLM اجرا می‌شود، و به یک plugin اجازه می‌دهد نوبت را claim کند و یک پاسخ ساختگی برگرداند یا نوبت را کاملاً ساکت کند.
- **`agent_end`**: فهرست نهایی پیام‌ها و فراداده اجرا را پس از تکمیل بررسی کنید.
- **`before_compaction` / `after_compaction`**: چرخه‌های Compaction را مشاهده یا annotate کنید.
- **`before_tool_call` / `after_tool_call`**: پارامترها/نتایج ابزار را رهگیری کنید.
- **`before_install`**: یافته‌های scan داخلی را بررسی کنید و در صورت نیاز نصب Skills یا plugin را مسدود کنید.
- **`tool_result_persist`**: نتایج ابزار را پیش از نوشته شدن در transcript نشست متعلق به OpenClaw به‌صورت همگام تبدیل کنید.
- **`message_received` / `message_sending` / `message_sent`**: hookهای پیام ورودی + خروجی.
- **`session_start` / `session_end`**: مرزهای چرخه عمر نشست.
- **`gateway_start` / `gateway_stop`**: رویدادهای چرخه عمر gateway.

قواعد تصمیم hook برای محافظ‌های خروجی/ابزار:

- `before_tool_call`: `{ block: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` یک no-op است و مسدودسازی قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` یک no-op است و مسدودسازی قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` یک no-op است و لغو قبلی را پاک نمی‌کند.

برای جزئیات API مربوط به hook و ثبت آن، [Plugin hooks](/fa/plugins/hooks) را ببینید.

harnessها ممکن است این hookها را به شکل متفاوتی تطبیق دهند. harness سرور برنامه Codex،
hookهای plugin در OpenClaw را به‌عنوان قرارداد سازگاری برای سطح‌های mirrored مستندشده نگه می‌دارد،
در حالی که hookهای native در Codex همچنان یک سازوکار سطح پایین‌تر جداگانه Codex باقی می‌مانند.

## streaming + پاسخ‌های جزئی

- دلتاهای دستیار از pi-agent-core جریان داده می‌شوند و به‌عنوان رویدادهای `assistant` منتشر می‌شوند.
- streaming بلوک می‌تواند پاسخ‌های جزئی را یا روی `text_end` یا `message_end` منتشر کند.
- streaming استدلال می‌تواند به‌عنوان یک جریان جداگانه یا به‌عنوان پاسخ‌های بلوکی منتشر شود.
- برای رفتار chunking و پاسخ بلوکی، [Streaming](/fa/concepts/streaming) را ببینید.

## اجرای ابزار + ابزارهای پیام‌رسانی

- رویدادهای شروع/به‌روزرسانی/پایان ابزار روی جریان `tool` منتشر می‌شوند.
- نتایج ابزار پیش از ثبت/انتشار از نظر اندازه و payloadهای تصویر پاک‌سازی می‌شوند.
- ارسال‌های ابزار پیام‌رسانی ردیابی می‌شوند تا تأییدهای تکراری دستیار سرکوب شوند.

## شکل‌دهی پاسخ + سرکوب

- payloadهای نهایی از این‌ها مونتاژ می‌شوند:
  - متن دستیار (و استدلال اختیاری)
  - خلاصه‌های inline ابزار (وقتی verbose + مجاز باشد)
  - متن خطای دستیار وقتی مدل خطا می‌دهد
- توکن ساکت دقیق `NO_REPLY` / `no_reply` از payloadهای خروجی
  فیلتر می‌شود.
- موارد تکراری ابزار پیام‌رسانی از فهرست payload نهایی حذف می‌شوند.
- اگر هیچ payload قابل render باقی نماند و ابزاری خطا داده باشد، یک پاسخ جایگزین خطای ابزار منتشر می‌شود
  (مگر اینکه یک ابزار پیام‌رسانی از قبل پاسخی قابل مشاهده برای کاربر ارسال کرده باشد).

## Compaction + retryها

- Compaction خودکار رویدادهای جریان `compaction` را منتشر می‌کند و می‌تواند یک retry را trigger کند.
- هنگام retry، bufferهای درون‌حافظه و خلاصه‌های ابزار reset می‌شوند تا از خروجی تکراری جلوگیری شود.
- برای pipeline مربوط به Compaction، [Compaction](/fa/concepts/compaction) را ببینید.

## جریان‌های رویداد (امروز)

- `lifecycle`: توسط `subscribeEmbeddedPiSession` منتشر می‌شود (و به‌عنوان fallback توسط `agentCommand`)
- `assistant`: دلتاهای جریانی از pi-agent-core
- `tool`: رویدادهای جریانی ابزار از pi-agent-core

## مدیریت کانال chat

- دلتاهای دستیار در پیام‌های `delta` مربوط به chat buffer می‌شوند.
- یک `final` مربوط به chat هنگام **پایان/خطای چرخه عمر** منتشر می‌شود.

## timeoutها

- پیش‌فرض `agent.wait`: 30 ثانیه (فقط انتظار). پارامتر `timeoutMs` override می‌کند.
- زمان اجرای عامل: پیش‌فرض `agents.defaults.timeoutSeconds` برابر 172800 ثانیه (48 ساعت) است؛ در timer مربوط به abort در `runEmbeddedPiAgent` اعمال می‌شود.
- زمان اجرای Cron: `timeoutSeconds` نوبت عامل ایزوله متعلق به cron است. زمان‌سنج وقتی اجرا آغاز می‌شود توسط scheduler شروع می‌شود، اجرای زیرین را در deadline پیکربندی‌شده abort می‌کند، سپس پیش از ثبت timeout پاک‌سازی محدود را اجرا می‌کند تا یک نشست child کهنه نتواند مسیر را گیر بیندازد.
- diagnostics سرزندگی نشست: با فعال بودن diagnostics، `diagnostics.stuckSessionWarnMs` نشست‌های طولانی `processing` را که هیچ پیشرفت مشاهده‌شده‌ای در پاسخ، ابزار، وضعیت، بلوک، یا ACP ندارند طبقه‌بندی می‌کند. اجراهای embedded فعال، فراخوانی‌های مدل، و فراخوانی‌های ابزار به‌عنوان `session.long_running` گزارش می‌شوند؛ کار فعال بدون پیشرفت اخیر به‌عنوان `session.stalled` گزارش می‌شود؛ `session.stuck` برای bookkeeping نشست کهنه بدون کار فعال رزرو شده است. bookkeeping نشست کهنه مسیر نشست آسیب‌دیده را بلافاصله آزاد می‌کند؛ اجراهای embedded متوقف‌شده فقط پس از `diagnostics.stuckSessionAbortMs` (پیش‌فرض: دست‌کم 10 دقیقه و 5 برابر آستانه هشدار) abort-drain می‌شوند تا کارهای صف‌شده بتوانند بدون قطع کردن اجراهای صرفاً کند از سر گرفته شوند. recovery خروجی‌های ساختاریافته requested/completed را منتشر می‌کند، و وضعیت diagnostic فقط اگر همان generation پردازش هنوز current باشد idle علامت‌گذاری می‌شود. diagnostics تکراری `session.stuck` تا زمانی که نشست بدون تغییر بماند back off می‌کند.
- timeout بیکاری مدل: OpenClaw یک درخواست مدل را وقتی پیش از پنجره بیکاری هیچ chunk پاسخی نرسد abort می‌کند. `models.providers.<id>.timeoutSeconds` این idle watchdog را برای providerهای کند محلی/خودمیزبان گسترش می‌دهد؛ در غیر این صورت OpenClaw وقتی پیکربندی شده باشد از `agents.defaults.timeoutSeconds` استفاده می‌کند، که به‌صورت پیش‌فرض در 120 ثانیه capped است. اجراهای triggerشده با Cron بدون timeout صریح مدل یا عامل، idle watchdog را غیرفعال می‌کنند و به timeout بیرونی cron تکیه می‌کنند.
- timeout درخواست HTTP مربوط به provider: `models.providers.<id>.timeoutSeconds` برای fetchهای HTTP مدل آن provider اعمال می‌شود، شامل connect، headers، body، timeout درخواست SDK، کل مدیریت abort برای guarded-fetch، و idle watchdog جریان مدل. از این برای providerهای کند محلی/خودمیزبان مانند Ollama استفاده کنید، پیش از آنکه کل timeout زمان اجرای عامل را افزایش دهید.

## جاهایی که کار می‌تواند زودتر پایان یابد

- timeout عامل (abort)
- AbortSignal (cancel)
- قطع اتصال Gateway یا timeout RPC
- timeout مربوط به `agent.wait` (فقط انتظار، عامل را متوقف نمی‌کند)

## مرتبط

- [ابزارها](/fa/tools) — ابزارهای عامل موجود
- [Hooks](/fa/automation/hooks) — اسکریپت‌های رویدادمحور که با رویدادهای چرخه عمر عامل trigger می‌شوند
- [Compaction](/fa/concepts/compaction) — اینکه گفت‌وگوهای طولانی چگونه خلاصه می‌شوند
- [Exec Approvals](/fa/tools/exec-approvals) — gateهای approval برای فرمان‌های shell
- [Thinking](/fa/tools/thinking) — پیکربندی سطح تفکر/استدلال
