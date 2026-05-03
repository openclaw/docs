---
read_when:
    - به یک راهنمای گام‌به‌گام دقیق از حلقهٔ عامل یا رویدادهای چرخهٔ حیات نیاز دارید
    - شما در حال تغییر صف‌بندی نشست، نوشتن رونوشت، یا رفتار قفل نوشتن نشست هستید
summary: چرخهٔ حیات حلقهٔ عامل، جریان‌ها، و معناشناسی انتظار
title: حلقهٔ عامل
x-i18n:
    generated_at: "2026-05-03T21:29:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

حلقه عامل‌محور اجرای کامل و «واقعی» یک عامل است: دریافت → مونتاژ زمینه → استنتاج مدل →
اجرای ابزار → پاسخ‌های جریانی → ماندگارسازی. این مسیر معتبر است که یک پیام را
به کنش‌ها و یک پاسخ نهایی تبدیل می‌کند، در حالی که وضعیت نشست را سازگار نگه می‌دارد.

در OpenClaw، یک حلقه، اجرای واحد و سریال‌شده برای هر نشست است که هم‌زمان با فکر کردن مدل،
فراخوانی ابزارها و جریان دادن خروجی، رویدادهای چرخه‌عمر و جریان را منتشر می‌کند. این سند توضیح می‌دهد که این حلقه اصیل چگونه
از ابتدا تا انتها سیم‌کشی شده است.

## نقاط ورود

- RPC در Gateway: `agent` و `agent.wait`.
- CLI: فرمان `agent`.

## نحوه کار (سطح بالا)

1. RPC مربوط به `agent` پارامترها را اعتبارسنجی می‌کند، نشست را حل می‌کند (sessionKey/sessionId)، فراداده نشست را ماندگار می‌کند و بلافاصله `{ runId, acceptedAt }` را برمی‌گرداند.
2. `agentCommand` عامل را اجرا می‌کند:
   - مدل و پیش‌فرض‌های فکر کردن/پرگویی/ردیابی را حل می‌کند
   - snapshot مربوط به Skills را بارگذاری می‌کند
   - `runEmbeddedPiAgent` را فراخوانی می‌کند (زمان اجرای pi-agent-core)
   - اگر حلقه embedded یکی منتشر نکند، **پایان/خطای چرخه‌عمر** را منتشر می‌کند
3. `runEmbeddedPiAgent`:
   - اجراها را از طریق صف‌های هر نشست + سراسری سریال‌سازی می‌کند
   - مدل + پروفایل احراز هویت را حل می‌کند و نشست pi را می‌سازد
   - در رویدادهای pi مشترک می‌شود و دلتاهای دستیار/ابزار را جریان می‌دهد
   - timeout را اعمال می‌کند -> اگر از حد بگذرد اجرا را abort می‌کند
   - برای نوبت‌های app-server در Codex، نوبت پذیرفته‌شده‌ای را که پیش از رویداد پایانی تولید پیشرفت app-server را متوقف می‌کند abort می‌کند
   - payloadها + فراداده مصرف را برمی‌گرداند
4. `subscribeEmbeddedPiSession` رویدادهای pi-agent-core را به جریان `agent` در OpenClaw پل می‌زند:
   - رویدادهای ابزار => `stream: "tool"`
   - دلتاهای دستیار => `stream: "assistant"`
   - رویدادهای چرخه‌عمر => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` از `waitForAgentRun` استفاده می‌کند:
   - برای **پایان/خطای چرخه‌عمر** برای `runId` منتظر می‌ماند
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` را برمی‌گرداند

## صف‌بندی + هم‌زمانی

- اجراها برای هر کلید نشست (مسیر نشست) و به‌صورت اختیاری از طریق یک مسیر سراسری سریال‌سازی می‌شوند.
- این کار از رقابت‌های ابزار/نشست جلوگیری می‌کند و تاریخچه نشست را سازگار نگه می‌دارد.
- کانال‌های پیام‌رسانی می‌توانند حالت‌های صف را انتخاب کنند (collect/steer/followup) که به این سامانه مسیرها خوراک می‌دهند.
  [صف فرمان](/fa/concepts/queue) را ببینید.
- نوشتن رونوشت‌ها نیز با قفل نوشتن نشست روی فایل نشست محافظت می‌شود. قفل
  آگاه از فرایند و مبتنی بر فایل است، بنابراین نویسندگانی را که صف درون‌فرایندی را دور می‌زنند یا از
  فرایندی دیگر می‌آیند نیز می‌گیرد. نویسندگان رونوشت نشست تا `session.writeLock.acquireTimeoutMs`
  منتظر می‌مانند و سپس نشست را مشغول گزارش می‌کنند؛ مقدار پیش‌فرض `60000` ms است.
- قفل‌های نوشتن نشست به‌طور پیش‌فرض non-reentrant هستند. اگر یک helper عمداً گرفتن
  همان قفل را در حالی تو در تو می‌کند که یک نویسنده منطقی واحد را حفظ می‌کند، باید صریحاً با
  `allowReentrant: true` آن را فعال کند.

## آماده‌سازی نشست + workspace

- Workspace حل و ایجاد می‌شود؛ اجراهای sandboxed ممکن است به ریشه workspace مربوط به sandbox هدایت شوند.
- Skills بارگذاری می‌شوند (یا از یک snapshot دوباره استفاده می‌شوند) و به env و prompt تزریق می‌شوند.
- فایل‌های bootstrap/context حل شده و به گزارش prompt سامانه تزریق می‌شوند.
- قفل نوشتن نشست گرفته می‌شود؛ `SessionManager` پیش از streaming باز و آماده می‌شود. هر
  مسیر بعدی برای بازنویسی رونوشت، Compaction، یا کوتاه‌سازی باید پیش از باز کردن یا
  تغییر فایل رونوشت همان قفل را بگیرد.

## مونتاژ prompt + prompt سامانه

- prompt سامانه از prompt پایه OpenClaw، prompt مربوط به Skills، زمینه bootstrap و overrideهای هر اجرا ساخته می‌شود.
- محدودیت‌های مخصوص مدل و tokenهای ذخیره Compaction اعمال می‌شوند.
- برای آنچه مدل می‌بیند، [prompt سامانه](/fa/concepts/system-prompt) را ببینید.

## نقاط hook (جایی که می‌توانید intercept کنید)

OpenClaw دو سامانه hook دارد:

- **hookهای داخلی** (hookهای Gateway): اسکریپت‌های رویدادمحور برای فرمان‌ها و رویدادهای چرخه‌عمر.
- **hookهای Plugin**: نقاط توسعه‌پذیری در چرخه‌عمر عامل/ابزار و pipeline مربوط به gateway.

### hookهای داخلی (hookهای Gateway)

- **`agent:bootstrap`**: هنگام ساخت فایل‌های bootstrap پیش از نهایی شدن prompt سامانه اجرا می‌شود.
  از این برای افزودن/حذف فایل‌های زمینه bootstrap استفاده کنید.
- **hookهای فرمان**: `/new`، `/reset`، `/stop`، و دیگر رویدادهای فرمان (سند Hooks را ببینید).

برای راه‌اندازی و مثال‌ها [Hooks](/fa/automation/hooks) را ببینید.

### hookهای Plugin (چرخه‌عمر agent + gateway)

این‌ها داخل حلقه عامل یا pipeline مربوط به gateway اجرا می‌شوند:

- **`before_model_resolve`**: پیش از نشست اجرا می‌شود (بدون `messages`) تا provider/model را پیش از حل مدل به‌صورت قطعی override کند.
- **`before_prompt_build`**: پس از بارگذاری نشست اجرا می‌شود (با `messages`) تا پیش از ارسال prompt، `prependContext`، `systemPrompt`، `prependSystemContext`، یا `appendSystemContext` را تزریق کند. از `prependContext` برای متن پویا در هر نوبت و از فیلدهای system-context برای راهنمایی پایدار که باید در فضای prompt سامانه قرار بگیرد استفاده کنید.
- **`before_agent_start`**: hook سازگاری قدیمی که ممکن است در هر یک از دو فاز اجرا شود؛ hookهای صریح بالا را ترجیح دهید.
- **`before_agent_reply`**: پس از actionهای inline و پیش از فراخوانی LLM اجرا می‌شود و به یک Plugin اجازه می‌دهد نوبت را claim کند و پاسخی synthetic برگرداند یا نوبت را کاملاً ساکت کند.
- **`agent_end`**: فهرست پیام نهایی و فراداده اجرا را پس از تکمیل بررسی می‌کند.
- **`before_compaction` / `after_compaction`**: چرخه‌های Compaction را مشاهده یا annotate می‌کند.
- **`before_tool_call` / `after_tool_call`**: پارامترها/نتایج ابزار را intercept می‌کند.
- **`before_install`**: یافته‌های اسکن built-in را بررسی می‌کند و به‌صورت اختیاری نصب Skills یا Plugin را مسدود می‌کند.
- **`tool_result_persist`**: نتایج ابزار را پیش از نوشته شدن در رونوشت نشست متعلق به OpenClaw به‌صورت همگام transform می‌کند.
- **`message_received` / `message_sending` / `message_sent`**: hookهای پیام ورودی + خروجی.
- **`session_start` / `session_end`**: مرزهای چرخه‌عمر نشست.
- **`gateway_start` / `gateway_stop`**: رویدادهای چرخه‌عمر gateway.

قواعد تصمیم hook برای محافظ‌های خروجی/ابزار:

- `before_tool_call`: `{ block: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: `{ block: false }` هیچ کاری نمی‌کند و یک block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: `{ block: false }` هیچ کاری نمی‌کند و یک block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: `{ cancel: false }` هیچ کاری نمی‌کند و یک cancel قبلی را پاک نمی‌کند.

برای API مربوط به hook و جزئیات ثبت‌نام، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

Harnessها ممکن است این hookها را به‌شکل متفاوتی تطبیق دهند. harness مربوط به app-server در Codex،
hookهای Plugin در OpenClaw را به‌عنوان قرارداد سازگاری برای سطح‌های mirrored مستندسازی‌شده نگه می‌دارد،
در حالی که hookهای native در Codex همچنان سازوکار جداگانه و سطح پایین‌تری در Codex هستند.

## Streaming + پاسخ‌های جزئی

- دلتاهای دستیار از pi-agent-core جریان داده می‌شوند و به‌عنوان رویدادهای `assistant` منتشر می‌شوند.
- Block streaming می‌تواند پاسخ‌های جزئی را یا در `text_end` یا در `message_end` منتشر کند.
- Reasoning streaming می‌تواند به‌عنوان جریانی جداگانه یا به‌صورت پاسخ‌های block منتشر شود.
- برای رفتار chunking و پاسخ block، [Streaming](/fa/concepts/streaming) را ببینید.

## اجرای ابزار + ابزارهای پیام‌رسانی

- رویدادهای شروع/به‌روزرسانی/پایان ابزار روی جریان `tool` منتشر می‌شوند.
- نتایج ابزار پیش از logging/emitting از نظر اندازه و payloadهای تصویر sanitize می‌شوند.
- ارسال‌های ابزار پیام‌رسانی ردیابی می‌شوند تا تأییدهای تکراری دستیار سرکوب شوند.

## شکل‌دهی پاسخ + سرکوب

- payloadهای نهایی از این‌ها مونتاژ می‌شوند:
  - متن دستیار (و reasoning اختیاری)
  - خلاصه‌های inline ابزار (وقتی verbose + مجاز باشد)
  - متن خطای دستیار وقتی مدل خطا می‌دهد
- token ساکت دقیق `NO_REPLY` / `no_reply` از payloadهای خروجی
  فیلتر می‌شود.
- تکراری‌های ابزار پیام‌رسانی از فهرست payload نهایی حذف می‌شوند.
- اگر هیچ payload قابل render باقی نماند و یک ابزار خطا داده باشد، یک پاسخ fallback برای خطای ابزار منتشر می‌شود
  (مگر اینکه یک ابزار پیام‌رسانی قبلاً پاسخی قابل مشاهده برای کاربر فرستاده باشد).

## Compaction + تلاش‌های دوباره

- Auto-compaction رویدادهای جریان `compaction` را منتشر می‌کند و می‌تواند تلاش دوباره را trigger کند.
- در تلاش دوباره، bufferهای درون‌حافظه و خلاصه‌های ابزار reset می‌شوند تا از خروجی تکراری جلوگیری شود.
- برای pipeline مربوط به Compaction، [Compaction](/fa/concepts/compaction) را ببینید.

## جریان‌های رویداد (امروز)

- `lifecycle`: توسط `subscribeEmbeddedPiSession` منتشر می‌شود (و به‌عنوان fallback توسط `agentCommand`)
- `assistant`: دلتاهای جریانی از pi-agent-core
- `tool`: رویدادهای ابزار جریانی از pi-agent-core

## مدیریت کانال chat

- دلتاهای دستیار در پیام‌های `delta` مربوط به chat بافر می‌شوند.
- یک `final` مربوط به chat روی **پایان/خطای چرخه‌عمر** منتشر می‌شود.

## Timeoutها

- پیش‌فرض `agent.wait`: 30s (فقط wait). پارامتر `timeoutMs` آن را override می‌کند.
- زمان اجرای عامل: پیش‌فرض `agents.defaults.timeoutSeconds` برابر 172800s (48 ساعت) است؛ در تایمر abort مربوط به `runEmbeddedPiAgent` اعمال می‌شود.
- زمان اجرای Cron: `timeoutSeconds` برای نوبت عامل isolated متعلق به cron است. زمان‌بند این تایمر را هنگام آغاز اجرا شروع می‌کند، اجرای underlying را در مهلت پیکربندی‌شده abort می‌کند، سپس cleanup محدود را پیش از ثبت timeout اجرا می‌کند تا یک نشست فرزند stale نتواند مسیر را گیر بیندازد.
- تشخیص‌های زنده بودن نشست: با فعال بودن diagnostics، `diagnostics.stuckSessionWarnMs` نشست‌های طولانی `processing` را که هیچ پیشرفت مشاهده‌شده‌ای در پاسخ، ابزار، وضعیت، block، یا ACP ندارند طبقه‌بندی می‌کند. اجراهای embedded فعال، فراخوانی‌های مدل، و فراخوانی‌های ابزار به‌عنوان `session.long_running` گزارش می‌شوند؛ کار فعال بدون پیشرفت اخیر به‌عنوان `session.stalled` گزارش می‌شود؛ `session.stuck` برای bookkeeping مربوط به نشست stale بدون کار فعال رزرو شده است. bookkeeping نشست stale مسیر نشست تحت تأثیر را فوراً آزاد می‌کند؛ اجراهای embedded stalled فقط پس از یک پنجره بدون پیشرفت طولانی (حداقل 10 دقیقه و 5 برابر آستانه warning) abort-drain می‌شوند تا کار صف‌شده بتواند بدون قطع کردن اجراهایی که صرفاً کند هستند از سر گرفته شود. تشخیص‌های تکراری `session.stuck` تا زمانی که نشست بدون تغییر بماند back off می‌کنند.
- Model idle timeout: OpenClaw یک درخواست مدل را وقتی هیچ chunk پاسخ پیش از پنجره idle نرسد abort می‌کند. `models.providers.<id>.timeoutSeconds` این idle watchdog را برای providerهای محلی/خودمیزبان کند گسترش می‌دهد؛ در غیر این صورت OpenClaw وقتی `agents.defaults.timeoutSeconds` پیکربندی شده باشد از آن استفاده می‌کند، که به‌طور پیش‌فرض سقف 120s دارد. اجراهای trigger شده با Cron که هیچ timeout صریحی برای مدل یا عامل ندارند idle watchdog را غیرفعال می‌کنند و به timeout بیرونی cron تکیه می‌کنند.
- Timeout درخواست HTTP مربوط به provider: `models.providers.<id>.timeoutSeconds` روی fetchهای HTTP مدل برای آن provider اعمال می‌شود، از جمله connect، headers، body، SDK request timeout، مدیریت abort برای کل guarded-fetch، و idle watchdog مربوط به model stream. پیش از افزایش timeout کل زمان اجرای عامل، از این برای providerهای محلی/خودمیزبان کند مانند Ollama استفاده کنید.

## جاهایی که کار می‌تواند زود تمام شود

- Timeout عامل (abort)
- AbortSignal (cancel)
- قطع اتصال Gateway یا timeout در RPC
- timeout مربوط به `agent.wait` (فقط wait، عامل را متوقف نمی‌کند)

## مرتبط

- [ابزارها](/fa/tools) — ابزارهای عامل در دسترس
- [Hooks](/fa/automation/hooks) — اسکریپت‌های رویدادمحور که با رویدادهای چرخه‌عمر عامل trigger می‌شوند
- [Compaction](/fa/concepts/compaction) — مکالمه‌های طولانی چگونه خلاصه می‌شوند
- [تأییدهای Exec](/fa/tools/exec-approvals) — gateهای تأیید برای فرمان‌های shell
- [Thinking](/fa/tools/thinking) — پیکربندی سطح فکر کردن/reasoning
