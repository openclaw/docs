---
read_when:
    - می‌خواهید کارهای زمان‌بندی‌شده و بیدارسازی‌ها داشته باشید
    - در حال اشکال‌زدایی اجرای Cron و لاگ‌ها هستید
summary: مرجع CLI برای `openclaw cron` (زمان‌بندی و اجرای کارهای پس‌زمینه)
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:23:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

کارهای Cron را برای زمان‌بند Gateway مدیریت کنید.

<Tip>
برای دیدن سطح کامل فرمان، `openclaw cron --help` را اجرا کنید. برای راهنمای مفهومی، [کارهای Cron](/fa/automation/cron-jobs) را ببینید.
</Tip>

## ساخت سریع کارها

`openclaw cron create` نام مستعار `openclaw cron add` است. برای کارهای جدید، ابتدا زمان‌بندی و سپس پرامپت را قرار دهید:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

وقتی کار باید به‌جای تحویل به یک مقصد چت، payload نهایی را POST کند، از `--webhook <url>` استفاده کنید:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

برای کارهای قطعی به سبک shell که باید داخل Cron در OpenClaw بدون شروع یک اجرای جداافتاده agent/model اجرا شوند، از `--command` استفاده کنید:

<Note>
کارهای Cron فرمانی، اتوماسیون‌های Gateway هستند که مدیر نوشته است. ساخت، ویرایش،
حذف، یا اجرای دستی آن‌ها به `operator.admin` نیاز دارد؛ اجرای زمان‌بندی‌شده
بعدا در فرایند Gateway اجرا می‌شود، نه به‌عنوان یک فراخوانی ابزار agent `tools.exec`.
`tools.exec.*` و تاییدهای exec همچنان ابزارهای exec قابل مشاهده برای مدل را کنترل می‌کنند.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` مقدار `argv: ["sh", "-lc", <shell>]` را ذخیره می‌کند. برای اجرای دقیق argv از `--command-argv '["node","scripts/report.mjs"]'` استفاده کنید. کارهای فرمانی stdout/stderr را ثبت می‌کنند، تاریخچه عادی Cron را ضبط می‌کنند، و خروجی را از طریق همان حالت‌های تحویل `announce`، `webhook`، یا `none` مثل کارهای جداافتاده مسیریابی می‌کنند. فرمانی که فقط `NO_REPLY` را چاپ کند سرکوب می‌شود.

## نشست‌ها

`--session` مقدارهای `main`، `isolated`، `current`، یا `session:<id>` را می‌پذیرد.

<AccordionGroup>
  <Accordion title="کلیدهای نشست">
    - `main` به نشست اصلی agent متصل می‌شود.
    - `isolated` برای هر اجرا یک transcript و شناسه نشست تازه می‌سازد.
    - `current` در زمان ساخت به نشست فعال متصل می‌شود.
    - `session:<id>` به یک کلید نشست پایدار صریح سنجاق می‌شود.

  </Accordion>
  <Accordion title="معناشناسی نشست جداافتاده">
    اجراهای جداافتاده context محیطی گفتگو را بازنشانی می‌کنند. مسیریابی channel و گروه، سیاست ارسال/صف، ارتقا، مبدا، و اتصال runtime مربوط به ACP برای اجرای جدید بازنشانی می‌شوند. ترجیحات امن و overrideهای صریح مدل یا auth که کاربر انتخاب کرده است می‌توانند بین اجراها منتقل شوند.
  </Accordion>
</AccordionGroup>

## تحویل

`openclaw cron list` و `openclaw cron show <job-id>` مسیر تحویل resolve‌شده را پیش‌نمایش می‌کنند. برای `channel: "last"`، پیش‌نمایش نشان می‌دهد مسیر از نشست اصلی یا فعلی resolve شده است، یا به‌صورت fail closed شکست می‌خورد.

مقصدهای دارای پیشوند ارائه‌دهنده می‌توانند channelهای announce حل‌نشده را رفع ابهام کنند. برای مثال، `to: "telegram:123"` زمانی Telegram را انتخاب می‌کند که `delivery.channel` حذف شده باشد یا `last` باشد. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام می‌کند selectorهای ارائه‌دهنده هستند. اگر `delivery.channel` صریح باشد، پیشوند باید با همان channel مطابقت داشته باشد؛ `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود. پیشوندهای سرویس مانند `imessage:` و `sms:` همچنان نحو مقصد تحت مالکیت channel باقی می‌مانند.

<Note>
کارهای جداافتاده `cron add` به‌صورت پیش‌فرض تحویل `--announce` دارند. برای داخلی نگه داشتن خروجی از `--no-deliver` استفاده کنید. `--deliver` به‌عنوان نام مستعار منسوخ‌شده برای `--announce` باقی می‌ماند.
</Note>

### مالکیت تحویل

تحویل چت Cron جداافتاده بین agent و runner مشترک است:

- وقتی مسیر چت موجود باشد، agent می‌تواند مستقیما با ابزار `message` ارسال کند.
- `announce` فقط وقتی agent مستقیما به مقصد resolve‌شده ارسال نکرده باشد، پاسخ نهایی را به‌صورت fallback تحویل می‌دهد.
- `webhook` payload نهایی را به یک URL ارسال می‌کند.
- `none` تحویل fallback توسط runner را غیرفعال می‌کند.

برای تنظیم تحویل Webhook از `cron add|create --webhook <url>` یا `cron edit <job-id> --webhook <url>` استفاده کنید. `--webhook` را با flagهای تحویل چت مانند `--announce`، `--no-deliver`، `--channel`، `--to`، `--thread-id`، یا `--account` ترکیب نکنید.

`cron edit <job-id>` می‌تواند فیلدهای جداگانه مسیریابی تحویل را با `--clear-channel`، `--clear-to`، `--clear-thread-id`، و `--clear-account` unset کند (هرکدام هنگام ترکیب با flag تنظیم متناظر خودش رد می‌شود). برخلاف `--no-deliver` که فقط تحویل fallback توسط runner را غیرفعال می‌کند، این‌ها فیلد ذخیره‌شده را حذف می‌کنند تا کار دوباره آن بخش از مسیر خود را از پیش‌فرض‌ها resolve کند.

`--announce` تحویل fallback توسط runner برای پاسخ نهایی است. `--no-deliver` آن fallback را غیرفعال می‌کند اما وقتی مسیر چت موجود باشد ابزار `message` مربوط به agent را حذف نمی‌کند.

یادآورهایی که از یک چت فعال ساخته می‌شوند، مقصد تحویل چت زنده را برای تحویل announce fallback حفظ می‌کنند. کلیدهای نشست داخلی ممکن است حروف کوچک باشند؛ از آن‌ها به‌عنوان منبع حقیقت برای شناسه‌های ارائه‌دهنده حساس به بزرگی و کوچکی حروف، مانند شناسه اتاق‌های Matrix، استفاده نکنید.

### تحویل شکست

اعلان‌های شکست به این ترتیب resolve می‌شوند:

1. `delivery.failureDestination` روی کار.
2. `cron.failureDestination` سراسری.
3. مقصد announce اصلی کار (وقتی مقصد شکست صریحی تنظیم نشده باشد).

<Note>
کارهای نشست اصلی فقط وقتی می‌توانند از `delivery.failureDestination` استفاده کنند که حالت تحویل اصلی `webhook` باشد. کارهای جداافتاده آن را در همه حالت‌ها می‌پذیرند.
</Note>

نکته: اجراهای Cron جداافتاده، شکست‌های agent در سطح اجرا را حتی وقتی
payload پاسخی تولید نشود، خطای کار محسوب می‌کنند؛ بنابراین شکست‌های مدل/ارائه‌دهنده همچنان شمارنده‌های خطا را افزایش می‌دهند
و اعلان‌های شکست را فعال می‌کنند.

کارهای Cron فرمانی یک نوبت agent جداافتاده را شروع نمی‌کنند. کد خروج صفر
`ok` را ثبت می‌کند؛ خروج غیرصفر، سیگنال، timeout، یا timeout بدون خروجی `error` را ثبت می‌کند و
می‌تواند همان مسیر اعلان شکست را فعال کند.

اگر یک اجرای جداافتاده پیش از نخستین درخواست مدل timeout شود، `openclaw cron show`
و `openclaw cron runs` یک خطای ویژه phase مانند
`setup timed out before runner start` یا
`stalled before first model call (last phase: context-engine)` را شامل می‌شوند.
برای ارائه‌دهنده‌های مبتنی بر CLI، watchdog پیش از مدل تا زمان شروع نوبت CLI خارجی
فعال می‌ماند، بنابراین توقف‌های lookup نشست، hook، auth، prompt، و setup مربوط به CLI
به‌عنوان شکست‌های Cron پیش از مدل گزارش می‌شوند.

## زمان‌بندی

### کارهای یک‌باره

`--at <datetime>` یک اجرای یک‌باره را زمان‌بندی می‌کند. datetimeهای بدون offset به‌عنوان UTC در نظر گرفته می‌شوند مگر اینکه `--tz <iana>` را هم بدهید، که زمان wall-clock را در timezone داده‌شده تفسیر می‌کند.

<Note>
کارهای یک‌باره به‌صورت پیش‌فرض پس از موفقیت حذف می‌شوند. برای حفظ آن‌ها از `--keep-after-run` استفاده کنید.
</Note>

### کارهای تکرارشونده

کارهای تکرارشونده پس از خطاهای پیاپی از backoff نمایی برای retry استفاده می‌کنند: 30s، 1m، 5m، 15m، 60m. زمان‌بندی پس از اجرای موفق بعدی به حالت عادی برمی‌گردد.

اجراهای skip‌شده جدا از خطاهای اجرا ردیابی می‌شوند. آن‌ها بر retry backoff اثر نمی‌گذارند، اما `openclaw cron edit <job-id> --failure-alert-include-skipped` می‌تواند هشدارهای شکست را برای اعلان‌های تکراری اجرای skip‌شده فعال کند.

برای کارهای جداافتاده‌ای که یک ارائه‌دهنده مدل پیکربندی‌شده محلی را هدف می‌گیرند، Cron پیش از شروع نوبت agent یک preflight سبک ارائه‌دهنده اجرا می‌کند. ارائه‌دهنده‌های loopback، private-network، و `.local` با `api: "ollama"` در `/api/tags` probe می‌شوند؛ ارائه‌دهنده‌های محلی سازگار با OpenAI مانند vLLM، SGLang، و LM Studio در `/models` probe می‌شوند. اگر endpoint دسترس‌ناپذیر باشد، اجرا به‌عنوان `skipped` ثبت می‌شود و در زمان‌بندی بعدی دوباره تلاش می‌شود؛ endpointهای مرده منطبق برای 5 دقیقه cache می‌شوند تا تعداد زیادی کار یک server محلی را hammer نکنند.

نکته: کارهای Cron، state در انتظار runtime، و تاریخچه اجرا در پایگاه‌داده state مشترک SQLite زندگی می‌کنند. فایل‌های قدیمی `jobs.json`، `jobs-state.json`، و `runs/*.jsonl` یک بار import می‌شوند و با پسوند `.migrated` تغییر نام می‌دهند. پس از import، زمان‌بندی‌ها را به‌جای ویرایش فایل‌های JSON با `openclaw cron add|edit|remove` ویرایش کنید.

### اجراهای دستی

`openclaw cron run <job-id>` به‌صورت پیش‌فرض اجرای اجباری انجام می‌دهد و به‌محض صف شدن اجرای دستی برمی‌گردد. پاسخ‌های موفق شامل `{ ok: true, enqueued: true, runId }` هستند. برای بررسی نتیجه بعدی از `runId` برگشتی استفاده کنید:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

وقتی یک script باید تا زمانی که همان اجرای صف‌شده دقیق یک وضعیت پایانی ثبت کند block شود، `--wait` را اضافه کنید:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

با `--wait`، CLI همچنان ابتدا `cron.run` را فراخوانی می‌کند، سپس `cron.runs` را برای `runId` برگشتی poll می‌کند. فرمان فقط زمانی با `0` خارج می‌شود که اجرا با وضعیت `ok` پایان یابد. وقتی اجرا با `error` یا `skipped` پایان یابد، وقتی پاسخ Gateway شامل `runId` نباشد، یا وقتی `--wait-timeout` منقضی شود، با مقدار غیرصفر خارج می‌شود. `--poll-interval` باید بزرگ‌تر از صفر باشد.

<Note>
وقتی می‌خواهید فرمان دستی فقط در صورتی اجرا شود که کار در حال حاضر due باشد، از `--due` استفاده کنید. اگر `--due --wait` اجرایی را enqueue نکند، فرمان به‌جای polling پاسخ عادی بدون اجرا را برمی‌گرداند.
</Note>

## مدل‌ها

`cron add|edit --model <ref>` یک مدل مجاز را برای کار انتخاب می‌کند. `cron add|edit --fallbacks <list>` مدل‌های fallback هر کار را تنظیم می‌کند، برای مثال `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`؛ برای اجرای strict بدون fallback مقدار `--fallbacks ""` را بدهید. `cron edit <job-id> --clear-fallbacks` override fallback هر کار را حذف می‌کند. `cron edit <job-id> --clear-model` override مدل هر کار را حذف می‌کند تا کار از تقدم عادی انتخاب مدل Cron پیروی کند (override ذخیره‌شده نشست Cron اگر وجود داشته باشد، وگرنه مدل agent/default)؛ نمی‌توان آن را با `--model` ترکیب کرد.

<Warning>
اگر مدل مجاز نباشد یا قابل resolve نباشد، Cron اجرا را با یک خطای validation صریح fail می‌کند، نه اینکه به انتخاب مدل agent یا پیش‌فرض کار fallback کند.
</Warning>

Cron `--model` یک **مدل اصلی کار** است، نه override نشست چت `/model`. یعنی:

- fallbackهای مدل پیکربندی‌شده همچنان وقتی مدل انتخاب‌شده کار شکست بخورد اعمال می‌شوند.
- payload هر کار با `fallbacks` در صورت وجود، فهرست fallback پیکربندی‌شده را جایگزین می‌کند.
- فهرست fallback خالی هر کار (`--fallbacks ""` یا `fallbacks: []` در payload/API کار) اجرای Cron را strict می‌کند.
- وقتی کاری `--model` دارد اما هیچ فهرست fallback پیکربندی نشده است، OpenClaw یک override fallback خالی صریح پاس می‌دهد تا مدل اصلی agent به‌عنوان مقصد retry پنهان اضافه نشود.
- بررسی‌های preflight ارائه‌دهنده محلی، پیش از علامت‌گذاری اجرای Cron به‌عنوان `skipped`، fallbackهای پیکربندی‌شده را طی می‌کنند.

`openclaw doctor` کارهایی را گزارش می‌کند که از قبل `payload.model` تنظیم‌شده دارند، از جمله شمارش‌های namespace ارائه‌دهنده و mismatchها در برابر `agents.defaults.model`. وقتی رفتار auth، ارائه‌دهنده، یا billing بین چت زنده و کارهای زمان‌بندی‌شده متفاوت به نظر می‌رسد، از آن بررسی استفاده کنید.

### تقدم مدل Cron جداافتاده

Cron جداافتاده مدل فعال را به این ترتیب resolve می‌کند:

1. override مربوط به Gmail-hook.
2. `--model` هر کار.
3. override مدل ذخیره‌شده نشست Cron (وقتی کاربر یکی را انتخاب کرده باشد).
4. انتخاب مدل agent یا پیش‌فرض.

### حالت سریع

حالت سریع Cron جداافتاده از انتخاب مدل زنده resolve‌شده پیروی می‌کند. پیکربندی مدل `params.fastMode` به‌صورت پیش‌فرض اعمال می‌شود، اما override نشست ذخیره‌شده `fastMode` همچنان بر config مقدم است. وقتی حالت resolve‌شده `auto` باشد، cutoff از مقدار `params.fastAutoOnSeconds` مدل انتخاب‌شده استفاده می‌کند، با پیش‌فرض 60 ثانیه.

### retryهای تغییر مدل زنده

اگر اجرای جداافتاده `LiveSessionModelSwitchError` پرتاب کند، Cron پیش از retry ارائه‌دهنده و مدل تغییرکرده (و override پروفایل auth تغییرکرده در صورت وجود) را برای اجرای فعال persist می‌کند. حلقه retry بیرونی پس از تلاش اولیه به دو retry تغییر محدود است، سپس به‌جای loop بی‌پایان abort می‌کند.

## خروجی اجرا و ردها

### سرکوب acknowledgement کهنه

نوبت‌های Cron جداافتاده پاسخ‌های فقط acknowledgement کهنه را سرکوب می‌کنند. اگر نخستین نتیجه فقط یک به‌روزرسانی وضعیت موقت باشد و هیچ اجرای subagent فرزندی مسئول پاسخ نهایی نباشد، Cron یک بار دیگر برای نتیجه واقعی پیش از تحویل re-prompt می‌کند.

### سرکوب توکن خاموش

اگر اجرای Cron جداافتاده فقط توکن خاموش (`NO_REPLY` یا `no_reply`) را برگرداند، Cron هم تحویل outbound مستقیم و هم مسیر خلاصه fallback صف‌شده را سرکوب می‌کند، بنابراین چیزی به چت ارسال نمی‌شود.

### ردهای ساختاریافته

اجرای Cron ایزوله از فرادادهٔ ساختاریافتهٔ رد اجرای موجود در اجرای تعبیه‌شده، به‌عنوان سیگنال معتبر رد، استفاده می‌کند. همچنین وقتی پیام خطای ساختاریافتهٔ تودرتو با `SYSTEM_RUN_DENIED` یا `INVALID_REQUEST` شروع شود، پوشش‌های `UNAVAILABLE` میزبان Node را نیز رعایت می‌کند.

Cron نثر خروجی نهایی یا عبارت‌های امتناع شبیه تأیید را به‌عنوان رد طبقه‌بندی نمی‌کند، مگر اینکه اجرای تعبیه‌شده فرادادهٔ ساختاریافتهٔ رد را نیز ارائه کند؛ بنابراین متن معمول دستیار به‌عنوان فرمان مسدودشده در نظر گرفته نمی‌شود.

`cron list` و تاریخچهٔ اجرا، به‌جای گزارش کردن فرمان مسدودشده به‌صورت `ok`، دلیل رد را نمایش می‌دهند.

## نگهداشت

نگهداشت و هرس در پیکربندی کنترل می‌شوند:

- `cron.sessionRetention` (پیش‌فرض `24h`) نشست‌های تکمیل‌شدهٔ اجرای ایزوله را هرس می‌کند.
- `cron.runLog.keepLines` ردیف‌های نگه‌داشته‌شدهٔ تاریخچهٔ اجرای SQLite را برای هر کار هرس می‌کند. `cron.runLog.maxBytes` همچنان برای سازگاری با گزارش‌های اجرای قدیمی‌ترِ مبتنی بر فایل پذیرفته می‌شود.

## مهاجرت کارهای قدیمی‌تر

<Note>
اگر از قبل از قالب فعلی تحویل و ذخیره‌سازی، کارهای Cron دارید، `openclaw doctor --fix` را اجرا کنید. Doctor فیلدهای قدیمی Cron را عادی‌سازی می‌کند (`jobId`،‏ `schedule.cron`، فیلدهای تحویل سطح بالا از جمله `threadId` قدیمی، نام‌های مستعار تحویل `provider` در payload) و کارهای fallback مربوط به Webhook با `notify: true` را از `cron.webhook` به تحویل صریح Webhook مهاجرت می‌دهد. کارهایی که از قبل به یک گفتگو اعلان می‌فرستند، همان تحویل را نگه می‌دارند و یک مقصد Webhook برای تکمیل دریافت می‌کنند. وقتی `cron.webhook` تنظیم نشده باشد، نشانگر بی‌اثر سطح بالای `notify` برای کارهایی که هدف مهاجرت ندارند حذف می‌شود (تحویل موجود بدون تغییر حفظ می‌شود)، بنابراین `doctor --fix` دیگر دربارهٔ آن‌ها دوباره هشدار نمی‌دهد.
</Note>

## ویرایش‌های رایج

تنظیمات تحویل را بدون تغییر پیام به‌روزرسانی کنید:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

تحویل را برای یک کار ایزوله غیرفعال کنید:

```bash
openclaw cron edit <job-id> --no-deliver
```

زمینهٔ راه‌اندازی سبک را برای یک کار ایزوله فعال کنید:

```bash
openclaw cron edit <job-id> --light-context
```

به یک کانال مشخص اعلان بفرستید:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

به یک موضوع انجمن Telegram اعلان بفرستید:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

یک کار ایزوله با زمینهٔ راه‌اندازی سبک ایجاد کنید:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` فقط برای کارهای ایزولهٔ نوبت عامل اعمال می‌شود. برای اجراهای Cron، حالت سبک به‌جای تزریق مجموعهٔ کامل راه‌اندازی فضای کاری، زمینهٔ راه‌اندازی را خالی نگه می‌دارد.

یک کار فرمانی با argv، cwd، env، stdin، و محدودیت‌های خروجی دقیق ایجاد کنید:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## فرمان‌های رایج مدیریتی

اجرای دستی و بررسی:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` به‌صورت پیش‌فرض همهٔ کارهای مطابق را نشان می‌دهد. `--agent <id>` را بدهید تا فقط کارهایی نمایش داده شوند که شناسهٔ عامل نرمال‌شدهٔ مؤثرشان مطابقت دارد؛ کارهایی که شناسهٔ عامل ذخیره‌شده ندارند، به‌عنوان عامل پیش‌فرض پیکربندی‌شده محسوب می‌شوند.

`openclaw cron get <job-id>` JSON ذخیره‌شدهٔ کار را مستقیماً برمی‌گرداند. وقتی نمای خوانا برای انسان همراه با پیش‌نمایش مسیر تحویل را می‌خواهید، از `cron show <job-id>` استفاده کنید.

`cron list --json` و `cron show <job-id> --json` برای هر کار یک فیلد سطح‌بالای `status` دارند که از `enabled`، `state.runningAtMs`، و `state.lastRunStatus` محاسبه می‌شود. مقدارها: `disabled`، `running`، `ok`، `error`، `skipped`، یا `idle`. این همان ستون وضعیت خوانا برای انسان را بازتاب می‌دهد تا ابزارهای خارجی بتوانند وضعیت کار را بدون محاسبهٔ دوباره بخوانند.

ورودی‌های `cron runs` شامل عیب‌یابی‌های تحویل با هدف Cron موردنظر، هدف حل‌شده، ارسال‌های ابزار پیام، استفاده از مسیر جایگزین، و وضعیت تحویل‌شده هستند.

هدف‌گذاری دوبارهٔ عامل و نشست:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` وقتی `--agent` در کارهای نوبت عامل حذف شده باشد هشدار می‌دهد و به عامل پیش‌فرض (`main`) برمی‌گردد. برای ثابت‌کردن یک عامل مشخص، هنگام ایجاد `--agent <id>` را بدهید.

تنظیمات تحویل:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [کارهای زمان‌بندی‌شده](/fa/automation/cron-jobs)
