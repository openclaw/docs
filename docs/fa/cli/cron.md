---
read_when:
    - می‌خواهید کارهای زمان‌بندی‌شده و بیدارباش‌ها داشته باشید
    - در حال اشکال‌زدایی اجرای Cron و گزارش‌ها هستید
summary: مرجع CLI برای `openclaw cron` (زمان‌بندی و اجرای کارهای پس‌زمینه)
title: Cron
x-i18n:
    generated_at: "2026-07-01T08:20:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

کارهای Cron را برای زمان‌بند Gateway مدیریت کنید.

<Tip>
برای مشاهدهٔ سطح کامل فرمان، `openclaw cron --help` را اجرا کنید. برای راهنمای مفهومی، [کارهای Cron](/fa/automation/cron-jobs) را ببینید.
</Tip>

## ایجاد سریع کارها

`openclaw cron create` نام مستعار `openclaw cron add` است. برای کارهای جدید، ابتدا زمان‌بندی و سپس prompt را قرار دهید:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

وقتی کار باید به‌جای تحویل به یک مقصد چت، محمولهٔ نهایی را POST کند، از `--webhook <url>` استفاده کنید:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

برای کارهای قطعی به سبک shell که باید بدون شروع یک اجرای ایزولهٔ عامل/مدل، داخل Cron در OpenClaw اجرا شوند، از `--command` استفاده کنید:

<Note>
کارهای Cron فرمانی، اتوماسیون Gateway هستند که مدیر نوشته است. ایجاد، ویرایش،
حذف، یا اجرای دستی آن‌ها به `operator.admin` نیاز دارد؛ اجرای زمان‌بندی‌شدهٔ
بعدی در فرایند Gateway اجرا می‌شود، نه به‌عنوان فراخوانی ابزار `tools.exec` عامل.
`tools.exec.*` و تأییدهای exec همچنان ابزارهای exec قابل مشاهده برای مدل را کنترل می‌کنند.
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

`--command <shell>` مقدار `argv: ["sh", "-lc", <shell>]` را ذخیره می‌کند. برای اجرای دقیق argv از `--command-argv '["node","scripts/report.mjs"]'` استفاده کنید. کارهای فرمانی stdout/stderr را ضبط می‌کنند، تاریخچهٔ عادی Cron را ثبت می‌کنند، و خروجی را از همان حالت‌های تحویل `announce`، `webhook`، یا `none` که برای کارهای ایزوله استفاده می‌شود عبور می‌دهند. فرمانی که فقط `NO_REPLY` چاپ کند سرکوب می‌شود.

## نشست‌ها

`--session` مقادیر `main`، `isolated`، `current`، یا `session:<id>` را می‌پذیرد.

<AccordionGroup>
  <Accordion title="کلیدهای نشست">
    - `main` به نشست اصلی عامل متصل می‌شود.
    - `isolated` برای هر اجرا یک رونوشت و شناسهٔ نشست تازه ایجاد می‌کند.
    - `current` در زمان ایجاد به نشست فعال متصل می‌شود.
    - `session:<id>` به یک کلید نشست پایدار صریح سنجاق می‌شود.

  </Accordion>
  <Accordion title="معنای نشست ایزوله">
    اجراهای ایزوله زمینهٔ گفت‌وگوی محیطی را بازنشانی می‌کنند. مسیریابی کانال و گروه، سیاست ارسال/صف، ارتقا، مبدأ، و اتصال زمان‌اجرای ACP برای اجرای جدید بازنشانی می‌شوند. ترجیح‌های امن و overrideهای صریح مدل یا احراز هویت انتخاب‌شده توسط کاربر می‌توانند بین اجراها منتقل شوند.
  </Accordion>
</AccordionGroup>

## تحویل

`openclaw cron list` و `openclaw cron show <job-id>` مسیر تحویل حل‌شده را پیش‌نمایش می‌کنند. برای `channel: "last"`، پیش‌نمایش نشان می‌دهد که آیا مسیر از نشست اصلی یا فعلی حل شده است، یا به‌صورت fail closed شکست خواهد خورد.

مقصدهای دارای پیشوند ارائه‌دهنده می‌توانند کانال‌های announce حل‌نشده را رفع ابهام کنند. برای مثال، وقتی `delivery.channel` حذف شده یا `last` باشد، `to: "telegram:123"` گزینهٔ Telegram را انتخاب می‌کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است انتخاب‌گر ارائه‌دهنده هستند. اگر `delivery.channel` صریح باشد، پیشوند باید با همان کانال مطابق باشد؛ `channel: "whatsapp"` با `to: "telegram:123"` رد می‌شود. پیشوندهای سرویس مانند `imessage:` و `sms:` همچنان نحو مقصد تحت مالکیت کانال باقی می‌مانند.

<Note>
کارهای ایزولهٔ `cron add` به‌طور پیش‌فرض از تحویل `--announce` استفاده می‌کنند. برای داخلی نگه داشتن خروجی از `--no-deliver` استفاده کنید. `--deliver` به‌عنوان نام مستعار منسوخ برای `--announce` باقی مانده است.
</Note>

### مالکیت تحویل

تحویل چت Cron ایزوله بین عامل و اجراکننده مشترک است:

- عامل وقتی مسیر چت در دسترس باشد می‌تواند مستقیماً با ابزار `message` ارسال کند.
- `announce` فقط وقتی پاسخ نهایی را به‌صورت fallback تحویل می‌دهد که عامل مستقیماً به مقصد حل‌شده ارسال نکرده باشد.
- `webhook` محمولهٔ نهایی را به یک URL ارسال می‌کند.
- `none` تحویل fallback اجراکننده را غیرفعال می‌کند.

برای تنظیم تحویل Webhook از `cron add|create --webhook <url>` یا `cron edit <job-id> --webhook <url>` استفاده کنید. `--webhook` را با پرچم‌های تحویل چت مانند `--announce`، `--no-deliver`، `--channel`، `--to`، `--thread-id`، یا `--account` ترکیب نکنید.

`cron edit <job-id>` می‌تواند فیلدهای جداگانهٔ مسیریابی تحویل را با `--clear-channel`، `--clear-to`، `--clear-thread-id`، و `--clear-account` حذف کند (هرکدام هنگام ترکیب با پرچم تنظیم متناظر خود رد می‌شوند). برخلاف `--no-deliver` که فقط تحویل fallback اجراکننده را غیرفعال می‌کند، این گزینه‌ها فیلد ذخیره‌شده را حذف می‌کنند تا کار دوباره آن بخش از مسیر خود را از پیش‌فرض‌ها حل کند.

`--announce` تحویل fallback اجراکننده برای پاسخ نهایی است. `--no-deliver` آن fallback را غیرفعال می‌کند اما وقتی مسیر چت در دسترس باشد ابزار `message` عامل را حذف نمی‌کند.

یادآورها که از یک چت فعال ایجاد شده‌اند مقصد زندهٔ تحویل چت را برای تحویل announce به‌صورت fallback حفظ می‌کنند. کلیدهای نشست داخلی ممکن است با حروف کوچک باشند؛ از آن‌ها به‌عنوان منبع حقیقت برای شناسه‌های ارائه‌دهندهٔ حساس به بزرگی و کوچکی حروف، مانند شناسه‌های اتاق Matrix، استفاده نکنید.

### تحویل شکست

اعلان‌های شکست به این ترتیب حل می‌شوند:

1. `delivery.failureDestination` روی کار.
2. `cron.failureDestination` سراسری.
3. مقصد announce اصلی کار (وقتی مقصد شکست صریحی تنظیم نشده باشد).

<Note>
کارهای نشست اصلی فقط وقتی می‌توانند از `delivery.failureDestination` استفاده کنند که حالت تحویل اصلی `webhook` باشد. کارهای ایزوله آن را در همهٔ حالت‌ها می‌پذیرند.
</Note>

نکته: اجراهای Cron ایزوله شکست‌های عامل در سطح اجرا را حتی وقتی
هیچ محمولهٔ پاسخی تولید نشود به‌عنوان خطای کار در نظر می‌گیرند، بنابراین شکست‌های مدل/ارائه‌دهنده همچنان شمارنده‌های خطا را افزایش می‌دهند و اعلان‌های شکست را فعال می‌کنند.

کارهای Cron فرمانی یک turn ایزولهٔ عامل را شروع نمی‌کنند. کد خروج صفر
`ok` را ثبت می‌کند؛ خروج غیرصفر، signal، timeout، یا timeout بدون خروجی، `error` را ثبت می‌کند و
می‌تواند همان مسیر اعلان شکست را فعال کند.

اگر یک اجرای ایزوله پیش از نخستین درخواست مدل timeout شود، `openclaw cron show`
و `openclaw cron runs` یک خطای ویژهٔ فاز مانند
`setup timed out before runner start` یا
`stalled before first model call (last phase: context-engine)` را شامل می‌شوند.
برای ارائه‌دهنده‌های مبتنی بر CLI، watchdog پیش از مدل تا زمان شروع turn خارجی
CLI فعال می‌ماند، بنابراین توقف‌های جست‌وجوی نشست، hook، احراز هویت، prompt، و راه‌اندازی CLI
به‌عنوان شکست‌های Cron پیش از مدل گزارش می‌شوند.

## زمان‌بندی

### کارهای یک‌باره

`--at <datetime>` یک اجرای یک‌باره را زمان‌بندی می‌کند. datetimeهای بدون offset به‌عنوان UTC در نظر گرفته می‌شوند، مگر اینکه `--tz <iana>` را هم پاس دهید، که زمان wall-clock را در timezone داده‌شده تفسیر می‌کند.

<Note>
کارهای یک‌باره به‌طور پیش‌فرض پس از موفقیت حذف می‌شوند. برای حفظ آن‌ها از `--keep-after-run` استفاده کنید.
</Note>

### کارهای تکرارشونده

کارهای تکرارشونده پس از خطاهای پیاپی از backoff نمایی برای تلاش مجدد استفاده می‌کنند: 30s، 1m، 5m، 15m، 60m. پس از اجرای موفق بعدی، زمان‌بندی به حالت عادی برمی‌گردد.

اجراهای skipped جدا از خطاهای اجرا ردیابی می‌شوند. آن‌ها روی backoff تلاش مجدد اثر نمی‌گذارند، اما `openclaw cron edit <job-id> --failure-alert-include-skipped` می‌تواند هشدارهای شکست را در اعلان‌های تکرارشوندهٔ اجرای skipped وارد کند.

برای کارهای ایزوله‌ای که یک ارائه‌دهندهٔ مدل محلی پیکربندی‌شده را هدف می‌گیرند، Cron پیش از شروع turn عامل یک preflight سبک ارائه‌دهنده اجرا می‌کند. ارائه‌دهنده‌های local loopback، شبکهٔ خصوصی، و `.local` با `api: "ollama"` در `/api/tags` بررسی می‌شوند؛ ارائه‌دهنده‌های محلی سازگار با OpenAI مانند vLLM، SGLang، و LM Studio در `/models` بررسی می‌شوند. اگر endpoint در دسترس نباشد، اجرا به‌عنوان `skipped` ثبت می‌شود و در زمان‌بندی بعدی دوباره تلاش می‌شود؛ endpointهای مردهٔ مطابق به‌مدت 5 دقیقه cache می‌شوند تا از کوبیدن تعداد زیادی کار به همان سرور محلی جلوگیری شود.

نکته: کارهای Cron، وضعیت runtime در انتظار، و تاریخچهٔ اجرا در پایگاه‌دادهٔ SQLite وضعیت مشترک زندگی می‌کنند. فایل‌های قدیمی `jobs.json`، `jobs-state.json`، و `runs/*.jsonl` یک بار import می‌شوند و با پسوند `.migrated` تغییر نام می‌دهند. پس از import، به‌جای ویرایش فایل‌های JSON، زمان‌بندی‌ها را با `openclaw cron add|edit|remove` ویرایش کنید.

### اجراهای دستی

`openclaw cron run <job-id>` به‌طور پیش‌فرض اجرای اجباری انجام می‌دهد و به‌محض صف شدن اجرای دستی برمی‌گردد. پاسخ‌های موفق شامل `{ ok: true, enqueued: true, runId }` هستند. برای بررسی نتیجهٔ بعدی از `runId` برگشتی استفاده کنید:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

وقتی یک script باید تا ثبت وضعیت پایانی همان اجرای صف‌شده block شود، `--wait` را اضافه کنید:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

با `--wait`، CLI همچنان ابتدا `cron.run` را فراخوانی می‌کند، سپس برای `runId` برگشتی، `cron.runs` را poll می‌کند. فرمان فقط وقتی با `0` خارج می‌شود که اجرا با وضعیت `ok` تمام شود. وقتی اجرا با `error` یا `skipped` تمام شود، وقتی پاسخ Gateway شامل `runId` نباشد، یا وقتی `--wait-timeout` منقضی شود، با مقدار غیرصفر خارج می‌شود. `--poll-interval` باید بزرگ‌تر از صفر باشد.

<Note>
وقتی می‌خواهید فرمان دستی فقط در صورتی اجرا شود که کار در حال حاضر due باشد، از `--due` استفاده کنید. اگر `--due --wait` اجرایی را صف نکند، فرمان به‌جای polling پاسخ عادی بدون اجرا را برمی‌گرداند.
</Note>

## مدل‌ها

`cron add|edit --model <ref>` یک مدل مجاز را برای کار انتخاب می‌کند. `cron add|edit --fallbacks <list>` مدل‌های fallback برای هر کار را تنظیم می‌کند، برای مثال `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`؛ برای اجرای سخت‌گیرانه بدون fallback، `--fallbacks ""` را پاس دهید. `cron edit <job-id> --clear-fallbacks` override fallback هر کار را حذف می‌کند. `cron edit <job-id> --clear-model` override مدل هر کار را حذف می‌کند تا کار از تقدم عادی انتخاب مدل Cron پیروی کند (اگر override ذخیره‌شدهٔ نشست Cron وجود داشته باشد همان، وگرنه مدل عامل/پیش‌فرض)؛ نمی‌توان آن را با `--model` ترکیب کرد. `cron add|edit --thinking <level>` یک override thinking برای هر کار تنظیم می‌کند؛ `cron edit <job-id> --clear-thinking` آن را حذف می‌کند تا کار از تقدم عادی thinking در Cron پیروی کند، و نمی‌توان آن را با `--thinking` ترکیب کرد.

<Warning>
اگر مدل مجاز نباشد یا نتوان آن را حل کرد، Cron به‌جای fallback به انتخاب مدل عامل کار یا مدل پیش‌فرض، اجرا را با یک خطای اعتبارسنجی صریح ناموفق می‌کند.
</Warning>

`--model` در Cron یک **مدل اصلی کار** است، نه override نشست چت `/model`. یعنی:

- fallbackهای مدل پیکربندی‌شده همچنان وقتی مدل انتخاب‌شدهٔ کار شکست بخورد اعمال می‌شوند.
- `fallbacks` در محمولهٔ هر کار، وقتی وجود داشته باشد، فهرست fallback پیکربندی‌شده را جایگزین می‌کند.
- فهرست fallback خالی برای هر کار (`--fallbacks ""` یا `fallbacks: []` در محموله/API کار) اجرای Cron را سخت‌گیرانه می‌کند.
- وقتی کاری `--model` داشته باشد اما هیچ فهرست fallbackی پیکربندی نشده باشد، OpenClaw یک override fallback خالی صریح پاس می‌دهد تا مدل اصلی عامل به‌عنوان مقصد تلاش مجدد پنهان اضافه نشود.
- بررسی‌های preflight ارائه‌دهندهٔ محلی پیش از علامت‌گذاری اجرای Cron به‌عنوان `skipped`، fallbackهای پیکربندی‌شده را طی می‌کنند.

`openclaw doctor` کارهایی را گزارش می‌کند که از قبل `payload.model` تنظیم‌شده دارند، شامل شمارش namespace ارائه‌دهنده و عدم تطابق‌ها با `agents.defaults.model`. وقتی رفتار احراز هویت، ارائه‌دهنده، یا billing بین چت زنده و کارهای زمان‌بندی‌شده متفاوت به‌نظر می‌رسد، از آن بررسی استفاده کنید.

### تقدم مدل Cron ایزوله

Cron ایزوله مدل فعال را به این ترتیب حل می‌کند:

1. override مربوط به Gmail-hook.
2. `--model` هر کار.
3. override مدل نشست Cron ذخیره‌شده (وقتی کاربر یکی را انتخاب کرده باشد).
4. انتخاب مدل عامل یا پیش‌فرض.

### حالت سریع

حالت سریع Cron ایزوله از انتخاب مدل زندهٔ حل‌شده پیروی می‌کند. پیکربندی مدل `params.fastMode` به‌طور پیش‌فرض اعمال می‌شود، اما override نشست ذخیره‌شدهٔ `fastMode` همچنان بر پیکربندی مقدم است. وقتی حالت حل‌شده `auto` باشد، آستانه از مقدار `params.fastAutoOnSeconds` مدل انتخاب‌شده استفاده می‌کند و پیش‌فرض آن 60 ثانیه است.

### تلاش‌های مجدد پس از تعویض مدل زنده

اگر یک اجرای ایزوله `LiveSessionModelSwitchError` پرتاب کند، Cron ارائه‌دهنده و مدل تعویض‌شده (و override پروفایل احراز هویت تعویض‌شده، وقتی وجود داشته باشد) را پیش از تلاش مجدد برای اجرای فعال persist می‌کند. حلقهٔ تلاش مجدد بیرونی به دو تلاش مجدد تعویض پس از تلاش اولیه محدود است، سپس به‌جای loop شدن برای همیشه abort می‌شود.

## خروجی اجرا و رد شدن‌ها

### سرکوب تأیید stale

turnهای Cron ایزوله پاسخ‌های stale که فقط acknowledgement هستند را سرکوب می‌کنند. اگر نخستین نتیجه فقط یک به‌روزرسانی وضعیت موقت باشد و هیچ اجرای subagent فرزند مسئول پاسخ نهایی نباشد، Cron پیش از تحویل یک بار دیگر برای نتیجهٔ واقعی re-prompt می‌کند.

### سرکوب token خاموش

اگر اجرای cron مجزا فقط توکن سکوت (`NO_REPLY` یا `no_reply`) را برگرداند، cron هم ارسال مستقیم خروجی و هم مسیر جایگزین خلاصه صف‌شده را سرکوب می‌کند، بنابراین هیچ چیزی به چت ارسال نمی‌شود.

### انکارهای ساختاریافته

اجراهای cron مجزا، فراداده انکار اجرای ساختاریافته از اجرای تعبیه‌شده را به‌عنوان سیگنال معتبر انکار استفاده می‌کنند. آن‌ها همچنین پوشش‌دهنده‌های `UNAVAILABLE` میزبان Node را، وقتی پیام خطای ساختاریافته تودرتو با `SYSTEM_RUN_DENIED` یا `INVALID_REQUEST` شروع شود، رعایت می‌کنند.

Cron متن نهایی خروجی یا عبارت‌های امتناع شبیه درخواست تأیید را به‌عنوان انکار طبقه‌بندی نمی‌کند، مگر اینکه اجرای تعبیه‌شده فراداده انکار ساختاریافته نیز ارائه کند؛ بنابراین متن عادی دستیار به‌عنوان فرمان مسدودشده تلقی نمی‌شود.

`cron list` و تاریخچه اجرا، به‌جای گزارش کردن فرمان مسدودشده به‌صورت `ok`، دلیل انکار را نمایش می‌دهند.

## نگهداری

نگهداری و هرس در پیکربندی کنترل می‌شوند:

- `cron.sessionRetention` (پیش‌فرض `24h`) نشست‌های اجرای مجزای کامل‌شده را هرس می‌کند.
- `cron.runLog.keepLines` ردیف‌های نگه‌داری‌شده تاریخچه اجرای SQLite را برای هر کار هرس می‌کند. `cron.runLog.maxBytes` برای سازگاری با گزارش‌های اجرای قدیمی‌تر مبتنی بر فایل همچنان پذیرفته می‌شود.

## مهاجرت کارهای قدیمی‌تر

<Note>
اگر کارهای cron مربوط به قبل از قالب فعلی ارسال و ذخیره دارید، `openclaw doctor --fix` را اجرا کنید. Doctor فیلدهای قدیمی cron (`jobId`، `schedule.cron`، فیلدهای ارسال سطح بالا از جمله `threadId` قدیمی، نام‌های مستعار ارسال `provider` در payload) را نرمال‌سازی می‌کند و کارهای جایگزین webhook با `notify: true` را از `cron.webhook` به ارسال webhook صریح مهاجرت می‌دهد. کارهایی که از قبل در یک چت اعلام می‌شوند همان مسیر ارسال را نگه می‌دارند و یک مقصد webhook تکمیل دریافت می‌کنند. وقتی `cron.webhook` تنظیم نشده باشد، نشانگر بی‌اثر سطح بالای `notify` برای کارهایی که هدف مهاجرت ندارند حذف می‌شود (ارسال موجود بدون تغییر حفظ می‌شود)، بنابراین `doctor --fix` دیگر دوباره درباره آن‌ها هشدار نمی‌دهد.
</Note>

## ویرایش‌های رایج

به‌روزرسانی تنظیمات ارسال بدون تغییر پیام:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

غیرفعال کردن ارسال برای یک کار مجزا:

```bash
openclaw cron edit <job-id> --no-deliver
```

فعال کردن زمینه راه‌اندازی سبک برای یک کار مجزا:

```bash
openclaw cron edit <job-id> --light-context
```

اعلام در یک کانال مشخص:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

اعلام در یک موضوع انجمن Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

ایجاد یک کار مجزا با زمینه راه‌اندازی سبک:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` فقط به کارهای نوبت عامل مجزا اعمال می‌شود. برای اجراهای cron، حالت سبک به‌جای تزریق مجموعه کامل راه‌اندازی workspace، زمینه راه‌اندازی را خالی نگه می‌دارد.

ایجاد یک کار فرمان با argv دقیق، cwd، env، stdin و محدودیت‌های خروجی:

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

اجرای دستی و بازرسی:

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

`openclaw cron list` به‌طور پیش‌فرض همه کارهای مطابق را نشان می‌دهد. برای نمایش فقط کارهایی که شناسه عامل نرمال‌شده مؤثر آن‌ها مطابق است، `--agent <id>` را وارد کنید؛ کارهای بدون شناسه عامل ذخیره‌شده، به‌عنوان عامل پیش‌فرض پیکربندی‌شده شمرده می‌شوند.

`openclaw cron get <job-id>` مستقیماً JSON ذخیره‌شده کار را برمی‌گرداند. وقتی نمای خوانا برای انسان همراه با پیش‌نمایش مسیر ارسال را می‌خواهید، از `cron show <job-id>` استفاده کنید.

`cron list --json` و `cron show <job-id> --json` روی هر کار یک فیلد سطح بالای `status` شامل می‌شوند که از `enabled`، `state.runningAtMs` و `state.lastRunStatus` محاسبه می‌شود. مقادیر: `disabled`، `running`، `ok`، `error`، `skipped` یا `idle`. این همان ستون وضعیت خوانا برای انسان را بازتاب می‌دهد تا ابزارهای خارجی بتوانند وضعیت کار را بدون محاسبه مجدد بخوانند.

ورودی‌های `cron runs` شامل عیب‌یابی‌های ارسال با هدف cron موردنظر، هدف resolve‌شده، ارسال‌های ابزار پیام، استفاده از جایگزین و وضعیت ارسال‌شده هستند.

تغییر هدف عامل و نشست:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` وقتی `--agent` در کارهای نوبت عامل حذف شود هشدار می‌دهد و به عامل پیش‌فرض (`main`) برمی‌گردد. برای ثابت کردن یک عامل مشخص، هنگام ایجاد `--agent <id>` را وارد کنید.

تنظیمات جزئی ارسال:

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
