---
read_when:
    - به یک راهنمای مرحله‌به‌مرحلهٔ دقیق از حلقهٔ عامل یا رویدادهای چرخهٔ عمر نیاز دارید
    - شما در حال تغییر صف‌بندی نشست، نوشتن رونوشت، یا رفتار قفل نوشتن نشست هستید
summary: چرخهٔ حیات حلقهٔ عامل، جریان‌ها و معناشناسی انتظار
title: حلقه عامل
x-i18n:
    generated_at: "2026-04-30T18:38:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

حلقهٔ عامل‌محور اجرای کامل و «واقعی» یک عامل است: دریافت → مونتاژ زمینه → استنتاج مدل →
اجرای ابزار → پاسخ‌های جریانی → پایدارسازی. این مسیر مرجع است که یک پیام را
به کنش‌ها و یک پاسخ نهایی تبدیل می‌کند، در حالی که وضعیت نشست را سازگار نگه می‌دارد.

در OpenClaw، یک حلقه یک اجرای واحد و سریال‌شده برای هر نشست است که هم‌زمان با فکر کردن مدل،
فراخوانی ابزارها و جریان‌دهی خروجی، رویدادهای چرخه‌عمر و جریان را منتشر می‌کند. این سند توضیح می‌دهد
که این حلقهٔ اصیل چگونه از ابتدا تا انتها سیم‌کشی شده است.

## نقاط ورود

- RPC در Gateway: `agent` و `agent.wait`.
- CLI: فرمان `agent`.

## نحوهٔ کارکرد (سطح بالا)

1. RPC با نام `agent` پارامترها را اعتبارسنجی می‌کند، نشست را حل می‌کند (sessionKey/sessionId)، فرادادهٔ نشست را پایدار می‌کند و بلافاصله `{ runId, acceptedAt }` را برمی‌گرداند.
2. `agentCommand` عامل را اجرا می‌کند:
   - مدل و پیش‌فرض‌های thinking/verbose/trace را حل می‌کند
   - snapshot مربوط به skills را بارگذاری می‌کند
   - `runEmbeddedPiAgent` را فراخوانی می‌کند (زمان اجرای pi-agent-core)
   - اگر حلقهٔ تعبیه‌شده آن را منتشر نکند، **پایان/خطای چرخه‌عمر** را منتشر می‌کند
3. `runEmbeddedPiAgent`:
   - اجراها را از طریق صف‌های سراسری و مخصوص هر نشست سریال‌سازی می‌کند
   - مدل و پروفایل احراز هویت را حل می‌کند و نشست pi را می‌سازد
   - مشترک رویدادهای pi می‌شود و دلتاهای دستیار/ابزار را جریان‌دهی می‌کند
   - timeout را اعمال می‌کند -> اگر از حد بگذرد اجرا را abort می‌کند
   - برای نوبت‌های app-server در Codex، نوبت پذیرفته‌شده‌ای را که پیش از یک رویداد پایانی از تولید پیشرفت app-server بازمی‌ایستد abort می‌کند
   - payloadها و فرادادهٔ usage را برمی‌گرداند
4. `subscribeEmbeddedPiSession` رویدادهای pi-agent-core را به جریان `agent` در OpenClaw پل می‌زند:
   - رویدادهای ابزار => `stream: "tool"`
   - دلتاهای دستیار => `stream: "assistant"`
   - رویدادهای چرخه‌عمر => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` از `waitForAgentRun` استفاده می‌کند:
   - برای **پایان/خطای چرخه‌عمر** مربوط به `runId` منتظر می‌ماند
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` را برمی‌گرداند

## صف‌بندی + هم‌روندی

- اجراها بر اساس کلید نشست (lane نشست) و به‌صورت اختیاری از طریق یک lane سراسری سریال‌سازی می‌شوند.
- این کار از raceهای ابزار/نشست جلوگیری می‌کند و تاریخچهٔ نشست را سازگار نگه می‌دارد.
- کانال‌های پیام‌رسانی می‌توانند حالت‌های صف (collect/steer/followup) را انتخاب کنند که این سامانهٔ lane را تغذیه می‌کنند.
  [صف فرمان](/fa/concepts/queue) را ببینید.
- نوشتن transcript نیز با یک قفل نوشتن نشست روی فایل نشست محافظت می‌شود. این قفل
  آگاه از فرایند و مبتنی بر فایل است، بنابراین نویسندگانی را که صف درون‌فرایندی را دور می‌زنند یا از
  فرایندی دیگر می‌آیند هم شناسایی می‌کند.
- قفل‌های نوشتن نشست به‌صورت پیش‌فرض بازدرآیند نیستند. اگر یک helper عمداً دریافت همان قفل را
  به‌صورت تو در تو انجام دهد و در عین حال یک نویسندهٔ منطقی واحد را حفظ کند، باید صریحاً با
  `allowReentrant: true` این رفتار را فعال کند.

## آماده‌سازی نشست + workspace

- workspace حل و ساخته می‌شود؛ اجراهای sandbox شده ممکن است به ریشهٔ sandbox workspace هدایت شوند.
- Skills بارگذاری می‌شوند (یا از یک snapshot دوباره استفاده می‌شوند) و به env و prompt تزریق می‌شوند.
- فایل‌های bootstrap/context حل می‌شوند و به گزارش system prompt تزریق می‌شوند.
- یک قفل نوشتن نشست گرفته می‌شود؛ `SessionManager` پیش از شروع جریان‌دهی باز و آماده می‌شود. هر
  مسیر بعدی برای بازنویسی transcript، Compaction یا کوتاه‌سازی باید پیش از باز کردن یا
  تغییر فایل transcript همان قفل را بگیرد.

## مونتاژ prompt + system prompt

- system prompt از prompt پایهٔ OpenClaw، prompt مربوط به skills، زمینهٔ bootstrap و بازنویسی‌های مخصوص هر اجرا ساخته می‌شود.
- محدودیت‌های مخصوص مدل و توکن‌های رزرو Compaction اعمال می‌شوند.
- برای آنچه مدل می‌بیند، [System prompt](/fa/concepts/system-prompt) را ببینید.

## نقاط hook (جایی که می‌توانید مداخله کنید)

OpenClaw دو سامانهٔ hook دارد:

- **hookهای داخلی** (hookهای Gateway): اسکریپت‌های رویدادمحور برای فرمان‌ها و رویدادهای چرخه‌عمر.
- **hookهای Plugin**: نقاط گسترش داخل چرخه‌عمر عامل/ابزار و pipeline مربوط به Gateway.

### hookهای داخلی (hookهای Gateway)

- **`agent:bootstrap`**: هنگام ساخت فایل‌های bootstrap و پیش از نهایی شدن system prompt اجرا می‌شود.
  از این مورد برای افزودن/حذف فایل‌های زمینهٔ bootstrap استفاده کنید.
- **hookهای فرمان**: `/new`، `/reset`، `/stop` و رویدادهای فرمان دیگر (سند Hooks را ببینید).

برای راه‌اندازی و نمونه‌ها، [Hooks](/fa/automation/hooks) را ببینید.

### hookهای Plugin (چرخه‌عمر عامل + gateway)

این‌ها داخل حلقهٔ عامل یا pipeline مربوط به gateway اجرا می‌شوند:

- **`before_model_resolve`**: پیش از نشست اجرا می‌شود (بدون `messages`) تا provider/model را پیش از حل مدل به‌صورت قطعی بازنویسی کند.
- **`before_prompt_build`**: پس از بارگذاری نشست (با `messages`) اجرا می‌شود تا پیش از ارسال prompt، `prependContext`، `systemPrompt`، `prependSystemContext` یا `appendSystemContext` را تزریق کند. از `prependContext` برای متن پویای مخصوص هر نوبت و از فیلدهای system-context برای راهنمایی پایدار که باید در فضای system prompt قرار بگیرد استفاده کنید.
- **`before_agent_start`**: hook سازگاری قدیمی که ممکن است در هر یک از دو phase اجرا شود؛ hookهای صریح بالا را ترجیح دهید.
- **`before_agent_reply`**: پس از کنش‌های inline و پیش از فراخوانی LLM اجرا می‌شود و به یک plugin اجازه می‌دهد نوبت را claim کند و یک پاسخ مصنوعی برگرداند یا نوبت را کاملاً ساکت کند.
- **`agent_end`**: فهرست نهایی پیام‌ها و فرادادهٔ اجرا را پس از تکمیل بررسی می‌کند.
- **`before_compaction` / `after_compaction`**: چرخه‌های Compaction را مشاهده یا حاشیه‌نویسی می‌کند.
- **`before_tool_call` / `after_tool_call`**: پارامترها/نتایج ابزار را intercept می‌کند.
- **`before_install`**: یافته‌های اسکن داخلی را بررسی می‌کند و در صورت نیاز نصب skill یا plugin را مسدود می‌کند.
- **`tool_result_persist`**: نتایج ابزار را پیش از نوشته شدن در transcript نشست متعلق به OpenClaw، به‌صورت همگام transform می‌کند.
- **`message_received` / `message_sending` / `message_sent`**: hookهای پیام ورودی + خروجی.
- **`session_start` / `session_end`**: مرزهای چرخه‌عمر نشست.
- **`gateway_start` / `gateway_stop`**: رویدادهای چرخه‌عمر gateway.

قواعد تصمیم‌گیری hook برای محافظ‌های خروجی/ابزار:

- `before_tool_call`: مقدار `{ block: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_tool_call`: مقدار `{ block: false }` هیچ کاری انجام نمی‌دهد و block قبلی را پاک نمی‌کند.
- `before_install`: مقدار `{ block: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `before_install`: مقدار `{ block: false }` هیچ کاری انجام نمی‌دهد و block قبلی را پاک نمی‌کند.
- `message_sending`: مقدار `{ cancel: true }` پایانی است و handlerهای با اولویت پایین‌تر را متوقف می‌کند.
- `message_sending`: مقدار `{ cancel: false }` هیچ کاری انجام نمی‌دهد و cancel قبلی را پاک نمی‌کند.

برای API مربوط به hook و جزئیات ثبت، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

harnessها ممکن است این hookها را متفاوت تطبیق دهند. harness مربوط به Codex app-server
hookهای Plugin در OpenClaw را به‌عنوان قرارداد سازگاری برای سطح‌های mirror شدهٔ مستندشده نگه می‌دارد،
در حالی که hookهای بومی Codex یک سازوکار Codex سطح پایین‌تر و جداگانه باقی می‌مانند.

## جریان‌دهی + پاسخ‌های جزئی

- دلتاهای دستیار از pi-agent-core جریان‌دهی می‌شوند و به‌صورت رویدادهای `assistant` منتشر می‌شوند.
- جریان‌دهی block می‌تواند پاسخ‌های جزئی را یا روی `text_end` یا روی `message_end` منتشر کند.
- جریان‌دهی reasoning می‌تواند به‌صورت یک stream جداگانه یا به‌صورت پاسخ‌های block منتشر شود.
- برای رفتار chunking و پاسخ block، [Streaming](/fa/concepts/streaming) را ببینید.

## اجرای ابزار + ابزارهای پیام‌رسانی

- رویدادهای شروع/به‌روزرسانی/پایان ابزار روی stream مربوط به `tool` منتشر می‌شوند.
- نتایج ابزار پیش از ثبت/انتشار، از نظر اندازه و payloadهای تصویری پاک‌سازی می‌شوند.
- ارسال‌های ابزار پیام‌رسانی ردیابی می‌شوند تا تأییدهای تکراری دستیار سرکوب شوند.

## شکل‌دهی پاسخ + سرکوب

- payloadهای نهایی از این موارد مونتاژ می‌شوند:
  - متن دستیار (و reasoning اختیاری)
  - خلاصه‌های inline ابزار (وقتی verbose + مجاز باشد)
  - متن خطای دستیار وقتی مدل خطا می‌دهد
- توکن سکوت دقیق `NO_REPLY` / `no_reply` از payloadهای خروجی
  فیلتر می‌شود.
- تکرارهای ابزار پیام‌رسانی از فهرست payload نهایی حذف می‌شوند.
- اگر هیچ payload قابل render باقی نماند و یک ابزار خطا داده باشد، یک پاسخ fallback خطای ابزار منتشر می‌شود
  (مگر اینکه یک ابزار پیام‌رسانی قبلاً یک پاسخ قابل مشاهده برای کاربر ارسال کرده باشد).

## Compaction + retryها

- Compaction خودکار رویدادهای stream مربوط به `compaction` را منتشر می‌کند و می‌تواند یک retry را trigger کند.
- در retry، bufferهای درون حافظه و خلاصه‌های ابزار reset می‌شوند تا از خروجی تکراری جلوگیری شود.
- برای pipeline مربوط به Compaction، [Compaction](/fa/concepts/compaction) را ببینید.

## جریان‌های رویداد (امروز)

- `lifecycle`: توسط `subscribeEmbeddedPiSession` منتشر می‌شود (و به‌عنوان fallback توسط `agentCommand`)
- `assistant`: دلتاهای جریان‌یافته از pi-agent-core
- `tool`: رویدادهای ابزار جریان‌یافته از pi-agent-core

## رسیدگی به کانال chat

- دلتاهای دستیار در پیام‌های `delta` مربوط به chat بافر می‌شوند.
- یک `final` مربوط به chat روی **پایان/خطای چرخه‌عمر** منتشر می‌شود.

## timeoutها

- پیش‌فرض `agent.wait`: 30s (فقط انتظار). پارامتر `timeoutMs` آن را بازنویسی می‌کند.
- runtime عامل: پیش‌فرض `agents.defaults.timeoutSeconds` برابر با 172800s (48 ساعت) است؛ در تایمر abort مربوط به `runEmbeddedPiAgent` اعمال می‌شود.
- runtime مربوط به Cron: مقدار `timeoutSeconds` برای agent-turn ایزوله متعلق به cron است. scheduler این تایمر را هنگام شروع اجرا آغاز می‌کند، اجرای زیرین را در deadline پیکربندی‌شده abort می‌کند، سپس پیش از ثبت timeout پاک‌سازی محدود را اجرا می‌کند تا یک نشست فرزند stale نتواند lane را گیر بیندازد.
- بازیابی نشست گیرکرده: با فعال بودن diagnostics، `diagnostics.stuckSessionWarnMs` نشست‌های طولانی‌مدت با وضعیت `processing` را تشخیص می‌دهد. اجراهای تعبیه‌شدهٔ فعال، عملیات پاسخ فعال و کارهای فعال session-lane به‌صورت پیش‌فرض فقط هشدار می‌مانند؛ اگر diagnostics هیچ کار فعالی برای نشست نشان ندهد، watchdog lane نشست متأثر را آزاد می‌کند تا کارهای startup صف‌شده تخلیه شوند.
- timeout بیکاری مدل: OpenClaw وقتی پیش از پنجرهٔ بیکاری هیچ response chunkی نرسد، یک درخواست مدل را abort می‌کند. `models.providers.<id>.timeoutSeconds` این idle watchdog را برای providerهای محلی/خودمیزبان کند گسترش می‌دهد؛ در غیر این صورت OpenClaw وقتی `agents.defaults.timeoutSeconds` پیکربندی شده باشد از آن استفاده می‌کند که به‌صورت پیش‌فرض روی 120s سقف دارد. اجراهای trigger شده توسط Cron که timeout صریح مدل یا عامل ندارند، idle watchdog را غیرفعال می‌کنند و به timeout بیرونی cron تکیه می‌کنند.
- timeout درخواست HTTP مربوط به provider: `models.providers.<id>.timeoutSeconds` روی fetchهای HTTP مدل آن provider اعمال می‌شود، از جمله connect، headers، body، timeout درخواست SDK، رسیدگی به abort کل guarded-fetch و idle watchdog مربوط به stream مدل. پیش از افزایش timeout کل runtime عامل، از این گزینه برای providerهای محلی/خودمیزبان کند مانند Ollama استفاده کنید.

## جاهایی که کار می‌تواند زود پایان یابد

- timeout عامل (abort)
- AbortSignal (cancel)
- قطع اتصال Gateway یا timeout مربوط به RPC
- timeout مربوط به `agent.wait` (فقط انتظار، عامل را متوقف نمی‌کند)

## مرتبط

- [ابزارها](/fa/tools) — ابزارهای عامل موجود
- [Hooks](/fa/automation/hooks) — اسکریپت‌های رویدادمحور که با رویدادهای چرخه‌عمر عامل trigger می‌شوند
- [Compaction](/fa/concepts/compaction) — نحوهٔ خلاصه‌سازی گفت‌وگوهای طولانی
- [تأییدهای Exec](/fa/tools/exec-approvals) — دروازه‌های تأیید برای فرمان‌های shell
- [Thinking](/fa/tools/thinking) — پیکربندی سطح thinking/reasoning
