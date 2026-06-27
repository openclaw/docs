---
read_when:
    - تنظیم تجزیه یا پیش‌فرض‌های اندیشیدن، حالت سریع، یا دستورالعمل مفصل‌گویی
summary: دستورزبان دایرکتیو برای /think، /fast، /verbose، /trace و نمایانی استدلال
title: سطوح تفکر
x-i18n:
    generated_at: "2026-06-27T19:05:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## چه کاری انجام می‌دهد

- دستور درون‌خطی در هر بدنه ورودی: `/t <level>`، `/think:<level>` یا `/thinking <level>`.
- سطح‌ها (نام‌های مستعار): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → «فکر کن»
  - low → «عمیق فکر کن»
  - medium → «عمیق‌تر فکر کن»
  - high → «بسیار عمیق فکر کن» (بیشینه بودجه)
  - xhigh → «بسیار عمیق فکر کن+» (مدل‌های GPT-5.2+ و Codex، به‌علاوه effort در Anthropic Claude Opus 4.7+)
  - adaptive → تفکر تطبیقی مدیریت‌شده توسط ارائه‌دهنده (برای Claude 4.6 روی Anthropic/Bedrock، Anthropic Claude Opus 4.7+ و تفکر پویا در Google Gemini پشتیبانی می‌شود)
  - max → بیشینه reasoning ارائه‌دهنده (Anthropic Claude Opus 4.7+؛ Ollama این را به بالاترین effort بومی `think` خود نگاشت می‌کند)
  - `x-high`، `x_high`، `extra-high`، `extra high` و `extra_high` به `xhigh` نگاشت می‌شوند.
  - `highest` به `high` نگاشت می‌شود.
- نکته‌های ارائه‌دهنده:
  - منوها و انتخاب‌گرهای تفکر بر اساس پروفایل ارائه‌دهنده هدایت می‌شوند. Pluginهای ارائه‌دهنده مجموعه سطح دقیق را برای مدل انتخاب‌شده، از جمله برچسب‌هایی مانند `on` دودویی، اعلام می‌کنند.
  - `adaptive`، `xhigh` و `max` فقط برای پروفایل‌های ارائه‌دهنده/مدلی نمایش داده می‌شوند که از آن‌ها پشتیبانی می‌کنند. دستورهای تایپ‌شده برای سطح‌های پشتیبانی‌نشده با گزینه‌های معتبر همان مدل رد می‌شوند.
  - سطح‌های پشتیبانی‌نشده ذخیره‌شده موجود بر اساس رتبه پروفایل ارائه‌دهنده دوباره نگاشت می‌شوند. `adaptive` در مدل‌های غیرتطبیقی به `medium` برمی‌گردد، در حالی که `xhigh` و `max` به بزرگ‌ترین سطح غیر `off` پشتیبانی‌شده برای مدل انتخاب‌شده برمی‌گردند.
  - مدل‌های Anthropic Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد به‌طور پیش‌فرض روی `adaptive` قرار می‌گیرند.
  - Anthropic Claude Opus 4.8 و Opus 4.7 تفکر را خاموش نگه می‌دارند مگر اینکه صراحتاً سطح تفکر تنظیم کنید. پیش‌فرض effort تحت مالکیت ارائه‌دهنده در Opus 4.8 پس از فعال شدن تفکر تطبیقی `high` است.
  - Anthropic Claude Opus 4.7+ دستور `/think xhigh` را به تفکر تطبیقی به‌همراه `output_config.effort: "xhigh"` نگاشت می‌کند، چون `/think` دستور تفکر است و `xhigh` تنظیم effort در Opus است.
  - Anthropic Claude Opus 4.7+ همچنین `/think max` را ارائه می‌کند؛ این دستور به همان مسیر بیشینه effort تحت مالکیت ارائه‌دهنده نگاشت می‌شود.
  - مدل‌های مستقیم DeepSeek V4 دستور `/think xhigh|max` را ارائه می‌کنند؛ هر دو به `reasoning_effort: "max"` در DeepSeek نگاشت می‌شوند، در حالی که سطح‌های پایین‌تر غیر `off` به `high` نگاشت می‌شوند.
  - مدل‌های DeepSeek V4 مسیریابی‌شده از طریق OpenRouter دستور `/think xhigh` را ارائه می‌کنند و مقدارهای `reasoning_effort` پشتیبانی‌شده توسط OpenRouter را ارسال می‌کنند. overrideهای ذخیره‌شده `max` به `xhigh` برمی‌گردند.
  - مدل‌های Ollama دارای قابلیت تفکر دستور `/think low|medium|high|max` را ارائه می‌کنند؛ `max` به `think: "high"` بومی نگاشت می‌شود چون API بومی Ollama رشته‌های effort `low`، `medium` و `high` را می‌پذیرد.
  - مدل‌های OpenAI GPT دستور `/think` را از طریق پشتیبانی effort اختصاصی مدل در Responses API نگاشت می‌کنند. `/think off` فقط زمانی `reasoning.effort: "none"` را ارسال می‌کند که مدل هدف از آن پشتیبانی کند؛ در غیر این صورت OpenClaw به‌جای ارسال مقدار پشتیبانی‌نشده، payload reasoning غیرفعال‌شده را حذف می‌کند.
  - ورودی‌های کاتالوگ سازگار با OpenAI سفارشی می‌توانند با تنظیم `models.providers.<provider>.models[].compat.supportedReasoningEfforts` برای شامل کردن `"xhigh"`، در `/think xhigh` شرکت کنند. این از همان فراداده compat استفاده می‌کند که payloadهای خروجی effort reasoning در OpenAI را نگاشت می‌کند، بنابراین منوها، اعتبارسنجی نشست، agent CLI و `llm-task` با رفتار انتقال هم‌راستا هستند.
  - refهای پیکربندی‌شده قدیمی OpenRouter Hunter Alpha تزریق reasoning پروکسی را رد می‌کنند، چون آن مسیر بازنشسته می‌توانست متن پاسخ نهایی را از طریق فیلدهای reasoning برگرداند.
  - Google Gemini دستور `/think adaptive` را به تفکر پویای تحت مالکیت ارائه‌دهنده Gemini نگاشت می‌کند. درخواست‌های Gemini 3 یک `thinkingLevel` ثابت را حذف می‌کنند، در حالی که درخواست‌های Gemini 2.5 مقدار `thinkingBudget: -1` را ارسال می‌کنند؛ سطح‌های ثابت همچنان به نزدیک‌ترین `thinkingLevel` یا بودجه Gemini برای آن خانواده مدل نگاشت می‌شوند.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) در مسیر streaming سازگار با Anthropic به‌طور پیش‌فرض روی `thinking: { type: "disabled" }` قرار می‌گیرد مگر اینکه تفکر را صراحتاً در پارامترهای مدل یا پارامترهای درخواست تنظیم کنید. این از نشت دلتاهای `reasoning_content` از قالب stream غیر بومی Anthropic در M2.x جلوگیری می‌کند. MiniMax-M3 (و M3.x) مستثنا است: M3 بلوک‌های تفکر درست Anthropic را منتشر می‌کند و وقتی تفکر غیرفعال باشد محتوای خالی برمی‌گرداند، بنابراین OpenClaw، M3 را روی مسیر تفکر حذف‌شده/تطبیقی ارائه‌دهنده نگه می‌دارد.
  - Z.AI (`zai/*`) برای بیشتر مدل‌های GLM دودویی (`on`/`off`) است. GLM-5.2 استثنا است: `/think off|low|high|max` را ارائه می‌کند، `low` و `high` را به `reasoning_effort: "high"` در Z.AI نگاشت می‌کند، و `max` را به `reasoning_effort: "max"` نگاشت می‌کند.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) همیشه فکر می‌کند. پروفایل آن فقط `on` را ارائه می‌کند، و OpenClaw فیلد خروجی `thinking` را طبق الزام Moonshot حذف می‌کند. مدل‌های دیگر `moonshot/*` دستور `/think off` را به `thinking: { type: "disabled" }` و هر سطح غیر `off` را به `thinking: { type: "enabled" }` نگاشت می‌کنند. وقتی تفکر فعال باشد، Moonshot فقط `tool_choice` با مقدار `auto|none` را می‌پذیرد؛ OpenClaw مقدارهای ناسازگار را به `auto` عادی‌سازی می‌کند.

## ترتیب Resolution

1. دستور درون‌خطی روی پیام (فقط روی همان پیام اعمال می‌شود).
2. override نشست (با ارسال یک پیام فقط شامل دستور تنظیم می‌شود).
3. پیش‌فرض هر agent (`agents.list[].thinkingDefault` در پیکربندی).
4. پیش‌فرض سراسری (`agents.defaults.thinkingDefault` در پیکربندی).
5. fallback: پیش‌فرض اعلام‌شده توسط ارائه‌دهنده، وقتی موجود باشد؛ در غیر این صورت مدل‌های دارای قابلیت reasoning به `medium` یا نزدیک‌ترین سطح غیر `off` پشتیبانی‌شده برای آن مدل resolve می‌شوند، و مدل‌های بدون reasoning روی `off` می‌مانند.

## تنظیم پیش‌فرض نشست

- پیامی بفرستید که **فقط** شامل دستور باشد (فاصله مجاز است)، برای مثال `/think:medium` یا `/t high`.
- این تنظیم برای نشست فعلی باقی می‌ماند (به‌طور پیش‌فرض به‌ازای هر فرستنده). برای پاک کردن override نشست و ارث‌بری از پیش‌فرض پیکربندی‌شده/ارائه‌دهنده از `/think default` استفاده کنید؛ نام‌های مستعار شامل `inherit`، `clear`، `reset` و `unpin` هستند.
- `/think off` یک override صریح خاموش ذخیره می‌کند. تا زمانی که override نشست را تغییر دهید یا پاک کنید، تفکر را غیرفعال می‌کند.
- پاسخ تأیید ارسال می‌شود (`Thinking level set to high.` / `Thinking disabled.`). اگر سطح نامعتبر باشد (مثلاً `/thinking big`)، فرمان با یک راهنما رد می‌شود و وضعیت نشست بدون تغییر می‌ماند.
- برای دیدن سطح تفکر فعلی، `/think` (یا `/think:`) را بدون آرگومان ارسال کنید.

## اعمال بر اساس agent

- **OpenClaw جاسازی‌شده**: سطح resolveشده به runtime داخلی agent در OpenClaw پاس داده می‌شود.
- **backend مربوط به Claude CLI**: هنگام استفاده از `claude-cli`، سطح‌های غیر خاموش به‌صورت `--effort` به Claude Code پاس داده می‌شوند؛ [backendهای CLI](/fa/gateway/cli-backends) را ببینید.

## حالت سریع (/fast)

- سطح‌ها: `auto|on|off|default`.
- پیام فقط شامل دستور، override حالت سریع نشست را تغییر می‌دهد و با `Fast mode set to auto.`، `Fast mode enabled.` یا `Fast mode disabled.` پاسخ می‌دهد. برای پاک کردن override نشست و ارث‌بری از پیش‌فرض پیکربندی‌شده از `/fast default` استفاده کنید؛ نام‌های مستعار شامل `inherit`، `clear`، `reset` و `unpin` هستند.
- برای دیدن وضعیت مؤثر فعلی حالت سریع، `/fast` (یا `/fast status`) را بدون mode ارسال کنید.
- OpenClaw حالت سریع را با این ترتیب resolve می‌کند:
  1. override درون‌خطی/فقط‌دستور `/fast auto|on|off` (`/fast default` این لایه را پاک می‌کند)
  2. override نشست
  3. پیش‌فرض هر agent (`agents.list[].fastModeDefault`)
  4. پیکربندی هر مدل: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. fallback: `off`
- `auto` حالت نشست/پیکربندی را به‌صورت auto نگه می‌دارد اما هر فراخوانی جدید مدل را مستقل resolve می‌کند. فراخوانی‌هایی که پیش از زمان قطع auto شروع شوند، حالت سریع را فعال دارند؛ فراخوانی‌های retry، fallback، نتیجه ابزار یا continuation بعدی با حالت سریع غیرفعال شروع می‌شوند. زمان قطع به‌طور پیش‌فرض ۶۰ ثانیه است؛ برای تغییر آن، `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` را روی مدل فعال تنظیم کنید.
- برای `openai/*`، حالت سریع با ارسال `service_tier=priority` در درخواست‌های Responses پشتیبانی‌شده به پردازش اولویت‌دار OpenAI نگاشت می‌شود.
- برای مدل‌های `openai/*` / `openai-codex/*` پشتیبانی‌شده توسط Codex، حالت سریع همان پرچم `service_tier=priority` را در Codex Responses ارسال می‌کند. نوبت‌های app-server بومی Codex این tier را فقط در `turn/start` یا شروع/ازسرگیری thread دریافت می‌کنند، بنابراین `auto` نمی‌تواند tier یک نوبت app-server از قبل در حال اجرا را دوباره تنظیم کند؛ این حالت روی نوبت مدل بعدی که OpenClaw شروع می‌کند اعمال می‌شود.
- برای درخواست‌های مستقیم عمومی `anthropic/*`، از جمله ترافیک احراز هویت‌شده با OAuth که به `api.anthropic.com` ارسال می‌شود، حالت سریع به service tierهای Anthropic نگاشت می‌شود: `/fast on` مقدار `service_tier=auto` را تنظیم می‌کند، `/fast off` مقدار `service_tier=standard_only` را تنظیم می‌کند.
- برای `minimax/*` در مسیر سازگار با Anthropic، `/fast on` (یا `params.fastMode: true`) مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.
- پارامترهای مدل `serviceTier` / `service_tier` صریح Anthropic وقتی هر دو تنظیم شده باشند، پیش‌فرض حالت سریع را override می‌کنند. OpenClaw همچنان تزریق service-tier مربوط به Anthropic را برای URLهای پایه پروکسی غیر Anthropic رد می‌کند.
- `/status` وقتی حالت سریع فعال باشد `Fast` و وقتی حالت پیکربندی‌شده auto باشد `Fast:auto` را نشان می‌دهد.

## دستورهای verbose (/verbose یا /v)

- سطح‌ها: `on` (حداقلی) | `full` | `off` (پیش‌فرض).
- پیام فقط شامل دستور، verbose نشست را تغییر می‌دهد و با `Verbose logging enabled.` / `Verbose logging disabled.` پاسخ می‌دهد؛ سطح‌های نامعتبر بدون تغییر وضعیت، یک راهنما برمی‌گردانند.
- `/verbose off` یک override صریح نشست ذخیره می‌کند؛ از طریق UI نشست‌ها با انتخاب `inherit` آن را پاک کنید.
- فرستنده‌های مجاز کانال خارجی می‌توانند override verbose نشست را پایدار کنند. کلاینت‌های داخلی gateway/webchat برای پایدار کردن آن به `operator.admin` نیاز دارند.
- دستور درون‌خطی فقط روی همان پیام اثر می‌گذارد؛ در غیر این صورت پیش‌فرض‌های نشست/سراسری اعمال می‌شوند.
- برای دیدن سطح verbose فعلی، `/verbose` (یا `/verbose:`) را بدون آرگومان ارسال کنید.
- وقتی verbose روشن باشد، agentهایی که نتایج ابزار ساخت‌یافته منتشر می‌کنند، هر فراخوانی ابزار را به‌صورت پیام جداگانه فقط شامل metadata و با پیشوند `<emoji> <tool-name>: <arg>` در صورت موجود بودن، برمی‌گردانند. این خلاصه‌های ابزار به‌محض شروع هر ابزار ارسال می‌شوند (حباب‌های جداگانه)، نه به‌صورت دلتاهای streaming.
- خلاصه‌های شکست ابزار در حالت عادی قابل مشاهده می‌مانند، اما پسوندهای جزئیات خطای خام پنهان می‌شوند مگر اینکه verbose برابر `full` باشد.
- وقتی verbose برابر `full` باشد، خروجی‌های ابزار نیز پس از اتمام ارسال می‌شوند (حباب جداگانه، کوتاه‌شده تا طول امن). اگر هنگام اجرای یک run در حال انجام، `/verbose on|full|off` را تغییر دهید، حباب‌های ابزار بعدی تنظیم جدید را رعایت می‌کنند.
- `agents.defaults.toolProgressDetail` شکل خلاصه‌های ابزار `/verbose` و خطوط ابزار پیش‌نویس پیشرفت را کنترل می‌کند. از `"explain"` (پیش‌فرض) برای برچسب‌های انسانی فشرده مانند `🛠️ Exec: checking JS syntax` استفاده کنید؛ وقتی می‌خواهید فرمان/جزئیات خام نیز برای اشکال‌زدایی پیوست شود، از `"raw"` استفاده کنید. مقدار هر agent در `agents.list[].toolProgressDetail` پیش‌فرض را override می‌کند.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## دستورهای trace مربوط به Plugin (/trace)

- سطح‌ها: `on` | `off` (پیش‌فرض).
- پیام فقط شامل دستور، خروجی trace مربوط به Plugin در نشست را تغییر می‌دهد و با `Plugin trace enabled.` / `Plugin trace disabled.` پاسخ می‌دهد.
- دستور درون‌خطی فقط روی همان پیام اثر می‌گذارد؛ در غیر این صورت پیش‌فرض‌های نشست/سراسری اعمال می‌شوند.
- برای دیدن سطح trace فعلی، `/trace` (یا `/trace:`) را بدون آرگومان ارسال کنید.
- `/trace` محدودتر از `/verbose` است: فقط خط‌های trace/debug تحت مالکیت Plugin مانند خلاصه‌های debug مربوط به Active Memory را آشکار می‌کند.
- خط‌های trace می‌توانند در `/status` و به‌صورت پیام تشخیصی پیگیری پس از پاسخ عادی assistant ظاهر شوند.

## نمایانی reasoning (/reasoning)

- سطح‌ها: `on|off|stream`.
- پیام فقط شامل دستور، نمایش بلوک‌های تفکر در پاسخ‌ها را تغییر می‌دهد.
- وقتی فعال باشد، reasoning به‌صورت **پیام جداگانه** با پیشوند `Thinking` ارسال می‌شود.
- `stream`: وقتی کانال فعال از پیش‌نمایش reasoning پشتیبانی کند، هنگام تولید پاسخ reasoning را stream می‌کند، سپس پاسخ نهایی را بدون reasoning ارسال می‌کند.
- نام مستعار: `/reason`.
- برای دیدن سطح reasoning فعلی، `/reasoning` (یا `/reasoning:`) را بدون آرگومان ارسال کنید.
- ترتیب Resolution: دستور درون‌خطی، سپس override نشست، سپس پیش‌فرض هر agent (`agents.list[].reasoningDefault`)، سپس پیش‌فرض سراسری (`agents.defaults.reasoningDefault`)، سپس fallback (`off`).

تگ‌های استدلال مدل محلی که بدشکل هستند با احتیاط مدیریت می‌شوند. بلوک‌های بستهٔ `<think>...</think>` در پاسخ‌های عادی پنهان می‌مانند، و استدلال بسته‌نشده پس از متنی که از قبل قابل مشاهده است نیز پنهان می‌شود. اگر پاسخ به‌طور کامل در یک تگ آغازین بسته‌نشده قرار گرفته باشد و در غیر این صورت به‌صورت متن خالی تحویل داده شود، OpenClaw تگ آغازین بدشکل را حذف می‌کند و متن باقی‌مانده را تحویل می‌دهد.

## مرتبط

- مستندات حالت ارتقایافته در [حالت ارتقایافته](/fa/tools/elevated) قرار دارد.

## Heartbeatها

- بدنهٔ کاوش Heartbeat همان پرامپت Heartbeat پیکربندی‌شده است (پیش‌فرض: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). دستورهای درون‌خطی در پیام Heartbeat طبق معمول اعمال می‌شوند (اما از تغییر پیش‌فرض‌های نشست از طریق Heartbeatها خودداری کنید).
- تحویل Heartbeat به‌طور پیش‌فرض فقط به محمولهٔ نهایی محدود است. برای ارسال پیام جداگانهٔ `Thinking` نیز (در صورت موجود بودن)، `agents.defaults.heartbeat.includeReasoning: true` یا برای هر عامل `agents.list[].heartbeat.includeReasoning: true` را تنظیم کنید.

## رابط کاربری چت وب

- انتخابگر تفکر در چت وب هنگام بارگذاری صفحه، سطح ذخیره‌شدهٔ نشست را از ذخیره‌ساز/پیکربندی نشست ورودی بازتاب می‌دهد.
- انتخاب سطحی دیگر، بازنویسی نشست را بلافاصله از طریق `sessions.patch` می‌نویسد؛ منتظر ارسال بعدی نمی‌ماند و یک بازنویسی یک‌بارهٔ `thinkingOnce` نیست.
- گزینهٔ اول همیشه انتخاب پاک‌کردن بازنویسی است. این گزینه `Inherited: <resolved level>` را نشان می‌دهد، از جمله `Inherited: Off` وقتی تفکر به‌ارث‌رسیده غیرفعال باشد.
- انتخاب‌های صریح انتخابگر از برچسب‌های سطح مستقیم خود استفاده می‌کنند و در صورت وجود، برچسب‌های ارائه‌دهنده را حفظ می‌کنند (برای مثال `Maximum` برای گزینهٔ `max` با برچسب ارائه‌دهنده).
- انتخابگر از `thinkingLevels` بازگردانده‌شده توسط ردیف/پیش‌فرض‌های نشست Gateway استفاده می‌کند، و `thinkingOptions` به‌عنوان فهرست برچسب‌های قدیمی نگه داشته می‌شود. رابط کاربری مرورگر فهرست regex ارائه‌دهندهٔ خودش را نگه نمی‌دارد؛ Pluginها مجموعه‌سطح‌های مخصوص مدل را مالکیت می‌کنند.
- `/think:<level>` همچنان کار می‌کند و همان سطح ذخیره‌شدهٔ نشست را به‌روزرسانی می‌کند، بنابراین دستورهای چت و انتخابگر همگام می‌مانند.

## پروفایل‌های ارائه‌دهنده

- Pluginهای ارائه‌دهنده می‌توانند `resolveThinkingProfile(ctx)` را برای تعریف سطح‌های پشتیبانی‌شده و پیش‌فرض مدل در دسترس قرار دهند.
- Pluginهای ارائه‌دهنده‌ای که مدل‌های Claude را پراکسی می‌کنند باید از `resolveClaudeThinkingProfile(modelId)` در `openclaw/plugin-sdk/provider-model-shared` دوباره استفاده کنند تا کاتالوگ‌های مستقیم Anthropic و پراکسی هم‌راستا بمانند.
- هر سطح پروفایل یک `id` کانونی ذخیره‌شده دارد (`off`، `minimal`، `low`، `medium`، `high`، `xhigh`، `adaptive`، یا `max`) و ممکن است یک `label` نمایشی داشته باشد. ارائه‌دهندگان دودویی از `{ id: "low", label: "on" }` استفاده می‌کنند.
- قلاب‌های پروفایل، در صورت موجود بودن، واقعیت‌های ادغام‌شدهٔ کاتالوگ را دریافت می‌کنند، از جمله `reasoning`، `compat.thinkingFormat`، و `compat.supportedReasoningEfforts`. از این واقعیت‌ها برای ارائهٔ پروفایل‌های دودویی یا سفارشی فقط زمانی استفاده کنید که قرارداد درخواست پیکربندی‌شده از محمولهٔ متناظر پشتیبانی کند.
- Pluginهای ابزاری که نیاز دارند یک بازنویسی صریح تفکر را اعتبارسنجی کنند، باید از `api.runtime.agent.resolveThinkingPolicy({ provider, model })` به‌همراه `api.runtime.agent.normalizeThinkingLevel(...)` استفاده کنند؛ آن‌ها نباید فهرست‌های سطح ارائه‌دهنده/مدل خودشان را نگه دارند.
- Pluginهای ابزاری که به فرادادهٔ مدل سفارشی پیکربندی‌شده دسترسی دارند، می‌توانند `catalog` را به `resolveThinkingPolicy` بدهند تا opt-inهای `compat.supportedReasoningEfforts` در اعتبارسنجی سمت Plugin بازتاب داده شوند.
- قلاب‌های قدیمی منتشرشده (`supportsXHighThinking`، `isBinaryThinking`، و `resolveDefaultThinkingLevel`) به‌عنوان آداپتورهای سازگاری باقی می‌مانند، اما مجموعه‌سطح‌های سفارشی جدید باید از `resolveThinkingProfile` استفاده کنند.
- ردیف‌ها/پیش‌فرض‌های Gateway، `thinkingLevels`، `thinkingOptions`، و `thinkingDefault` را در دسترس می‌گذارند تا کلاینت‌های ACP/چت همان شناسه‌ها و برچسب‌های پروفایلی را نمایش دهند که اعتبارسنجی زمان اجرا استفاده می‌کند.
