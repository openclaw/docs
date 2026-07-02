---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارباش‌ها
    - اتصال محرک‌های خارجی (Webhookها، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhookها و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: کارهای زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-07-02T08:34:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. کارها را پایدار می‌کند، عامل را در زمان درست بیدار می‌کند، و می‌تواند خروجی را به یک کانال چت یا نقطه پایانی Webhook برساند.

## شروع سریع

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## نحوه کار Cron

- Cron **داخل فرایند Gateway** اجرا می‌شود (نه داخل مدل).
- تعریف‌های کار، وضعیت زمان اجرا، و تاریخچه اجرا در پایگاه داده وضعیت SQLite مشترک OpenClaw پایدار می‌مانند تا راه‌اندازی‌های مجدد باعث از دست رفتن زمان‌بندی‌ها نشوند.
- هنگام ارتقا، `openclaw doctor --fix` را اجرا کنید تا فایل‌های قدیمی `~/.openclaw/cron/jobs.json`، `jobs-state.json`، و `runs/*.jsonl` به SQLite وارد شوند و با پسوند `.migrated` تغییر نام پیدا کنند. ردیف‌های بدشکل کار از زمان اجرا رد می‌شوند و برای تعمیر یا بررسی بعدی در `jobs-quarantine.json` کپی می‌شوند.
- `cron.store` همچنان کلید منطقی فروشگاه Cron و مسیر واردسازی doctor را نام‌گذاری می‌کند. پس از واردسازی، ویرایش آن فایل JSON دیگر کارهای فعال Cron را تغییر نمی‌دهد؛ به‌جای آن از `openclaw cron add|edit|remove` یا متدهای RPC مربوط به Cron در Gateway استفاده کنید.
- همه اجراهای Cron رکوردهای [کار پس‌زمینه](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام شروع Gateway، کارهای عقب‌افتاده گردش عامل ایزوله به‌جای بازپخش فوری، بیرون از پنجره اتصال کانال دوباره زمان‌بندی می‌شوند تا راه‌اندازی Discord/Telegram و تنظیم فرمان‌های بومی پس از راه‌اندازی مجدد پاسخ‌گو بمانند.
- کارهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت خودکار حذف می‌شوند.
- اجراهای ایزوله Cron پس از تکمیل اجرا، با بهترین تلاش زبانه‌ها/فرایندهای مرورگر ردیابی‌شده را برای نشست `cron:<jobId>` خود می‌بندند، تا خودکارسازی مرورگر جداشده فرایندهای بی‌صاحب باقی نگذارد.
- اجراهای ایزوله Cron که مجوز محدود خودپاک‌سازی Cron را دریافت می‌کنند همچنان می‌توانند وضعیت زمان‌بند، فهرست خودفیلترشده‌ای از کار فعلی خود، و تاریخچه اجرای همان کار را بخوانند، بنابراین بررسی‌های وضعیت/Heartbeat می‌توانند بدون دسترسی گسترده‌تر به تغییر Cron، زمان‌بندی خودشان را بررسی کنند.
- اجراهای ایزوله Cron همچنین در برابر پاسخ‌های تأیید قدیمی محافظت می‌کنند. اگر نتیجه نخست فقط یک به‌روزرسانی وضعیت موقت باشد (`on it`، `pulling everything together`، و نشانه‌های مشابه) و هیچ اجرای فرزند subagent همچنان مسئول پاسخ نهایی نباشد، OpenClaw پیش از تحویل یک بار دیگر برای نتیجه واقعی prompt می‌دهد.
- اجراهای ایزوله Cron از فراداده ساختاریافته رد اجرا از اجرای جاسازی‌شده استفاده می‌کنند، از جمله پوشش‌های node-host با `UNAVAILABLE` که پیام خطای تودرتویشان با `SYSTEM_RUN_DENIED` یا `INVALID_REQUEST` شروع می‌شود، تا یک فرمان مسدودشده به‌عنوان اجرای سبز گزارش نشود، در حالی که نثر عادی دستیار به‌عنوان رد اجرا تلقی نشود.
- اجراهای ایزوله Cron همچنین شکست‌های عامل در سطح اجرا را حتی وقتی هیچ payload پاسخی تولید نشده باشد خطای کار در نظر می‌گیرند، بنابراین شکست‌های مدل/ارائه‌دهنده شمارنده‌های خطا را افزایش می‌دهند و اعلان‌های شکست را فعال می‌کنند، به‌جای اینکه کار را موفق پاک کنند.
- وقتی یک کار گردش عامل ایزوله به `timeoutSeconds` می‌رسد، Cron اجرای عامل زیربنایی را لغو می‌کند و یک پنجره کوتاه پاک‌سازی به آن می‌دهد. اگر اجرا تخلیه نشود، پاک‌سازی تحت مالکیت Gateway پیش از اینکه Cron وقفه زمانی را ثبت کند، مالکیت نشست آن اجرا را به‌اجبار پاک می‌کند، تا کار چت صف‌شده پشت یک نشست پردازشی قدیمی جا نماند.
- اگر یک گردش عامل ایزوله پیش از شروع runner یا پیش از نخستین فراخوانی مدل متوقف شود، Cron یک وقفه زمانی مخصوص فاز مانند `setup timed out before runner start` یا `stalled before first model call (last phase: context-engine)` ثبت می‌کند. این watchdogها ارائه‌دهندگان جاسازی‌شده و ارائه‌دهندگان مبتنی بر CLI را پیش از اینکه فرایند CLI خارجی آن‌ها واقعاً شروع شود پوشش می‌دهند، و مستقل از مقادیر طولانی `timeoutSeconds` سقف‌گذاری می‌شوند تا شکست‌های cold-start/auth/context به‌جای انتظار برای کل بودجه کار، سریع آشکار شوند.
- اگر از system cron یا زمان‌بند خارجی دیگری برای اجرای `openclaw agent` استفاده می‌کنید، آن را با تشدید hard-kill بپیچید، حتی با اینکه CLI، `SIGTERM`/`SIGINT` را مدیریت می‌کند. اجراهای مبتنی بر Gateway از Gateway می‌خواهند اجراهای پذیرفته‌شده را لغو کند؛ اجراهای محلی و fallback جاسازی‌شده همان سیگنال لغو را دریافت می‌کنند. برای GNU `timeout`، `timeout -k 60 600 openclaw agent ...` را به `timeout 600 ...` ساده ترجیح دهید؛ مقدار `-k` پشتیبان supervisor است اگر فرایند نتواند تخلیه شود. برای واحدهای systemd، همین شکل را با استفاده از سیگنال توقف `SIGTERM` همراه با یک پنجره مهلت مانند `TimeoutStopSec` پیش از هر kill نهایی حفظ کنید. اگر یک تلاش مجدد از `--run-id` استفاده کند در حالی که اجرای اصلی Gateway هنوز فعال است، نسخه تکراری به‌جای شروع اجرای دوم، درحال‌اجرا گزارش می‌شود.

<a id="maintenance"></a>

<Note>
آشتی کار برای Cron ابتدا تحت مالکیت زمان اجرا و سپس متکی به تاریخچه پایدار است: یک کار فعال Cron تا زمانی زنده می‌ماند که زمان اجرای Cron هنوز آن کار را در حال اجرا ردیابی کند، حتی اگر یک ردیف نشست فرزند قدیمی هنوز وجود داشته باشد. وقتی زمان اجرا دیگر مالک کار نباشد و پنجره مهلت ۵ دقیقه‌ای منقضی شود، نگهداری لاگ‌های اجرای پایدار و وضعیت کار را برای اجرای متناظر `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن تاریخچه پایدار نتیجه‌ای پایانی نشان دهد، دفتر کل کار از آن نهایی می‌شود؛ در غیر این صورت نگهداری تحت مالکیت Gateway می‌تواند کار را `lost` علامت‌گذاری کند. ممیزی CLI آفلاین می‌تواند از تاریخچه پایدار بازیابی کند، اما مجموعه خالی کارهای فعال درون‌فرایندی خودش را به‌عنوان اثبات ناپدید شدن یک اجرای Cron تحت مالکیت Gateway تلقی نمی‌کند.
</Note>

## انواع زمان‌بندی

| نوع     | پرچم CLI  | توضیح                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | مهر زمانی یک‌باره (ISO 8601 یا نسبی مثل `20m`)         |
| `every` | `--every` | بازه ثابت                                               |
| `cron`  | `--cron`  | عبارت Cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری     |

مهرهای زمانی بدون منطقه زمانی به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی بر اساس ساعت محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشونده ابتدای ساعت به‌طور خودکار تا ۵ دقیقه پخش می‌شوند تا جهش‌های بار کاهش یابد. برای اجبار زمان‌بندی دقیق از `--exact` یا برای یک پنجره صریح از `--stagger 30s` استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) تحلیل می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته غیر wildcard باشند، croner زمانی تطبیق می‌دهد که **هرکدام** از فیلدها تطبیق داشته باشد، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw در اینجا از رفتار پیش‌فرض OR در Croner استفاده می‌کند. برای الزام هر دو شرط، از modifier روز هفته `+` در Croner (`0 9 15 * +1`) استفاده کنید، یا زمان‌بندی را روی یک فیلد انجام دهید و فیلد دیگر را در prompt یا فرمان کار خود guard کنید.

## سبک‌های اجرا

| سبک           | مقدار `--session`   | اجرا در                  | مناسب برای                      |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| نشست اصلی    | `main`              | خط بیدارباش اختصاصی Cron | یادآورها، رویدادهای سیستم      |
| ایزوله        | `isolated`          | `cron:<jobId>` اختصاصی   | گزارش‌ها، کارهای پس‌زمینه       |
| نشست فعلی    | `current`           | مقید در زمان ایجاد       | کار تکرارشونده آگاه از زمینه    |
| نشست سفارشی  | `session:custom-id` | نشست نام‌دار پایدار      | گردش‌کارهایی که بر تاریخچه بنا می‌شوند |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    کارهای **نشست اصلی** یک رویداد سیستمی را در خط اجرای تحت مالکیت Cron صف می‌کنند و به‌صورت اختیاری Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن‌ها می‌توانند از آخرین زمینه تحویل نشست اصلی هدف برای پاسخ‌ها استفاده کنند، اما گردش‌های معمول Cron را به خط چت انسانی اضافه نمی‌کنند و تازگی reset روزانه/بی‌کاری را برای نشست هدف تمدید نمی‌کنند. کارهای **ایزوله** یک گردش عامل اختصاصی را با نشست تازه اجرا می‌کنند. **نشست‌های سفارشی** (`session:xxx`) زمینه را بین اجراها پایدار نگه می‌دارند و گردش‌کارهایی مانند standupهای روزانه را ممکن می‌کنند که بر خلاصه‌های قبلی بنا می‌شوند.

    رویدادهای Cron نشست اصلی یادآورهای رویداد سیستمی خودبسنده هستند. آن‌ها
    به‌طور خودکار دستور "Read HEARTBEAT.md" مربوط به prompt پیش‌فرض Heartbeat را
    شامل نمی‌شوند. اگر یک یادآور تکرارشونده باید به
    `HEARTBEAT.md` مراجعه کند، آن را صریحاً در متن رویداد Cron یا در
    دستورالعمل‌های خود عامل بگویید.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    برای کارهای ایزوله، «نشست تازه» یعنی یک شناسه transcript/نشست جدید برای هر اجرا. OpenClaw ممکن است ترجیح‌های امنی مانند تنظیمات thinking/fast/verbose، برچسب‌ها، و overrideهای صریحاً انتخاب‌شده توسط کاربر برای مدل/auth را حمل کند، اما زمینه مکالمه محیطی را از یک ردیف Cron قدیمی به ارث نمی‌برد: مسیریابی کانال/گروه، سیاست ارسال یا صف، ارتقا، مبدأ، یا binding زمان اجرای ACP. وقتی یک کار تکرارشونده باید عمداً بر همان زمینه مکالمه بنا شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="Runtime cleanup">
    برای کارهای ایزوله، teardown زمان اجرا اکنون شامل پاک‌سازی مرورگر با بهترین تلاش برای آن نشست Cron است. شکست‌های پاک‌سازی نادیده گرفته می‌شوند تا نتیجه واقعی Cron همچنان اولویت داشته باشد.

    اجراهای ایزوله Cron همچنین هر نمونه زمان اجرای MCP بسته‌بندی‌شده‌ای را که برای کار ایجاد شده، از مسیر پاک‌سازی مشترک زمان اجرا dispose می‌کنند. این با نحوه teardown کلاینت‌های MCP در نشست اصلی و نشست سفارشی هم‌خوان است، بنابراین کارهای ایزوله Cron فرایندهای فرزند stdio یا اتصال‌های MCP بلندمدت را بین اجراها نشت نمی‌دهند.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    وقتی اجراهای ایزوله Cron، subagentها را هماهنگ می‌کنند، تحویل نیز خروجی نهایی فرزند را به متن موقت قدیمی والد ترجیح می‌دهد. اگر فرزندان هنوز در حال اجرا باشند، OpenClaw به‌جای اعلام آن، آن به‌روزرسانی جزئی والد را سرکوب می‌کند.

    برای هدف‌های اعلام Discord فقط‌متنی، OpenClaw متن نهایی canonical دستیار را یک بار ارسال می‌کند، به‌جای اینکه هم payloadهای متنی streamed/میانی و هم پاسخ نهایی را بازپخش کند. payloadهای رسانه و ساختاریافته Discord همچنان به‌صورت payloadهای جداگانه تحویل داده می‌شوند تا پیوست‌ها و کامپوننت‌ها حذف نشوند.

  </Accordion>
</AccordionGroup>

### payloadهای فرمان

از payloadهای فرمان برای اسکریپت‌های قطعی استفاده کنید که باید داخل زمان‌بند Gateway بدون شروع یک گردش عامل ایزوله مبتنی بر مدل اجرا شوند. کارهای فرمان روی میزبان Gateway اجرا می‌شوند، stdout/stderr را capture می‌کنند، اجرا را در تاریخچه Cron ثبت می‌کنند، و همان حالت‌های تحویل `announce`، `webhook`، و `none` را مانند کارهای ایزوله دوباره استفاده می‌کنند.

<Note>
Command cron یک سطح خودکارسازی Gateway برای operator-admin است، نه یک فراخوانی
`tools.exec` عامل. ایجاد، به‌روزرسانی، حذف، یا اجرای دستی کارهای Cron
به `operator.admin` نیاز دارد؛ اجراهای فرمان زمان‌بندی‌شده بعداً داخل
فرایند Gateway به‌عنوان آن خودکارسازی نوشته‌شده توسط admin اجرا می‌شوند. سیاست exec عامل مانند
`tools.exec.mode`، promptهای تأیید، و allowlistهای ابزار به‌ازای عامل بر
ابزارهای exec قابل مشاهده برای مدل حاکم است، نه payloadهای command cron.
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

`--command <shell>` مقدار `argv: ["sh", "-lc", <shell>]` را ذخیره می‌کند. وقتی اجرای دقیق argv را بدون تحلیل shell می‌خواهید، از `--command-argv '["node","scripts/report.mjs"]'` استفاده کنید. فیلدهای اختیاری `--command-env KEY=VALUE`، `--command-input`، `--timeout-seconds`، `--no-output-timeout-seconds`، و `--output-max-bytes` محیط فرایند، stdin، و حدود خروجی را کنترل می‌کنند.

اگر stdout خالی نباشد، همان متن نتیجهٔ تحویل‌شده است. اگر stdout خالی باشد و stderr خالی نباشد، stderr تحویل داده می‌شود. اگر هر دو جریان وجود داشته باشند، Cron یک بلوک کوچک `stdout:` / `stderr:` تحویل می‌دهد. کد خروج صفر، اجرا را به‌صورت `ok` ثبت می‌کند؛ خروج غیرصفر، سیگنال، وقفهٔ زمانی، یا وقفهٔ زمانیِ بدون خروجی، `error` ثبت می‌کند و می‌تواند هشدارهای شکست را فعال کند. فرمانی که فقط `NO_REPLY` چاپ کند، از سرکوب عادی توکنِ بی‌صدای Cron استفاده می‌کند و چیزی به چت ارسال نمی‌کند.

### گزینه‌های بار برای کارهای ایزوله

<ParamField path="--message" type="string" required>
  متن اعلان؛ برای حالت ایزوله الزامی است.
</ParamField>
<ParamField path="--model" type="string">
  بازنویسی مدل؛ از مدل مجاز انتخاب‌شده برای کار استفاده می‌کند.
</ParamField>
<ParamField path="--fallbacks" type="string">
  فهرست مدل‌های پشتیبان برای هر کار، برای نمونه `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. برای اجرای سخت‌گیرانه بدون پشتیبان، `--fallbacks ""` را پاس دهید.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  در `cron edit`، بازنویسی پشتیبانِ مخصوص کار را حذف می‌کند تا کار از تقدم پشتیبان پیکربندی‌شده پیروی کند. نمی‌تواند با `--fallbacks` ترکیب شود.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  در `cron edit`، بازنویسی مدلِ مخصوص کار را حذف می‌کند تا کار از تقدم عادی انتخاب مدل Cron پیروی کند؛ اگر بازنویسی ذخیره‌شدهٔ نشست Cron تنظیم شده باشد همان، وگرنه مدل عامل/پیش‌فرض. نمی‌تواند با `--model` ترکیب شود.
</ParamField>
<ParamField path="--thinking" type="string">
  بازنویسی سطح تفکر.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  در `cron edit`، بازنویسی تفکرِ مخصوص کار را حذف می‌کند تا کار از تقدم عادی تفکر Cron پیروی کند. نمی‌تواند با `--thinking` ترکیب شود.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تزریق فایل راه‌اندازی فضای کاری را رد کن.
</ParamField>
<ParamField path="--tools" type="string">
  ابزارهایی را که کار می‌تواند استفاده کند محدود کن، برای نمونه `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی همان کار استفاده می‌کند. این با بازنویسی `/model` در نشست چت یکسان نیست: زنجیره‌های پشتیبان پیکربندی‌شده همچنان وقتی مدل اصلی کار شکست بخورد اعمال می‌شوند. اگر مدل درخواست‌شده مجاز نباشد یا قابل حل نباشد، Cron به‌جای بازگشت بی‌صدای مدل انتخابی عامل/پیش‌فرضِ کار، اجرا را با خطای اعتبارسنجی صریح شکست می‌دهد.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح بار داشته باشند. وقتی وجود داشته باشد، آن فهرست زنجیرهٔ پشتیبان پیکربندی‌شده برای کار را جایگزین می‌کند. وقتی اجرای Cron سخت‌گیرانه‌ای می‌خواهید که فقط مدل انتخاب‌شده را امتحان کند، در بار کار/API از `fallbacks: []` استفاده کنید. اگر کاری `--model` داشته باشد اما نه پشتیبانِ بار و نه پشتیبانِ پیکربندی‌شده، OpenClaw یک بازنویسی پشتیبانِ خالیِ صریح پاس می‌دهد تا مدل اصلی عامل به‌عنوان هدف تلاش مجددِ اضافی و پنهان افزوده نشود.

بررسی‌های پیش‌پرواز ارائه‌دهندهٔ محلی پیش از علامت‌گذاری اجرای Cron به‌صورت `skipped`، پشتیبان‌های پیکربندی‌شده را پیمایش می‌کنند؛ `fallbacks: []` آن مسیر پیش‌پرواز را سخت‌گیرانه نگه می‌دارد.

تقدم انتخاب مدل برای کارهای ایزوله چنین است:

1. بازنویسی مدل هوک Gmail، وقتی اجرا از Gmail آمده باشد و آن بازنویسی مجاز باشد
2. `model` در بار مخصوص کار
3. بازنویسی مدل نشست Cron ذخیره‌شدهٔ انتخاب‌شده توسط کاربر
4. انتخاب مدل عامل/پیش‌فرض

حالت سریع نیز از انتخاب زندهٔ حل‌شده پیروی می‌کند. اگر پیکربندی مدل انتخاب‌شده `params.fastMode` داشته باشد، Cron ایزوله به‌صورت پیش‌فرض از آن استفاده می‌کند. بازنویسی `fastMode` نشست ذخیره‌شده همچنان در هر دو جهت بر پیکربندی مقدم است. حالت خودکار، وقتی موجود باشد، از آستانهٔ `params.fastAutoOnSeconds` مدل انتخاب‌شده استفاده می‌کند و پیش‌فرض آن ۶۰ ثانیه است.

اگر اجرای ایزوله به واگذاریِ تغییر مدل زنده برسد، Cron با ارائه‌دهنده/مدل تغییریافته دوباره تلاش می‌کند و پیش از تلاش مجدد، آن انتخاب زنده را برای اجرای فعال پایدار می‌کند. وقتی تغییر، پروفایل احراز هویت جدیدی هم داشته باشد، Cron بازنویسی آن پروفایل احراز هویت را نیز برای اجرای فعال پایدار می‌کند. تلاش‌های مجدد محدود هستند: پس از تلاش اولیه به‌علاوهٔ ۲ تلاش مجدد تغییر، Cron به‌جای حلقهٔ بی‌پایان متوقف می‌شود.

پیش از آنکه اجرای Cron ایزوله وارد اجراکنندهٔ عامل شود، OpenClaw نقاط پایانی قابل دسترس ارائه‌دهندهٔ محلی را برای ارائه‌دهنده‌های پیکربندی‌شدهٔ `api: "ollama"` و `api: "openai-completions"` بررسی می‌کند که `baseUrl` آن‌ها loopback، شبکهٔ خصوصی، یا `.local` باشد. اگر آن نقطهٔ پایانی خاموش باشد، اجرا به‌جای شروع فراخوانی مدل، به‌صورت `skipped` همراه با خطای روشنِ ارائه‌دهنده/مدل ثبت می‌شود. نتیجهٔ نقطهٔ پایانی برای ۵ دقیقه کش می‌شود، بنابراین کارهای موعددارِ زیادی که از همان سرور محلیِ خاموشِ Ollama، vLLM، SGLang، یا LM Studio استفاده می‌کنند، به‌جای ایجاد طوفان درخواست، یک کاوش کوچک مشترک دارند. اجراهای ردشدهٔ پیش‌پرواز ارائه‌دهنده، پس‌روی خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های ردشدن تکراری می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | چه اتفاقی می‌افتد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر عامل ارسال نکرده باشد، متن نهایی را با پشتیبان به مقصد تحویل می‌دهد |
| `webhook`  | بار رویداد پایان‌یافته را به یک URL با POST ارسال می‌کند                                |
| `none`     | تحویل پشتیبان اجراکننده ندارد                                         |

برای تحویل کانال، از `--announce --channel telegram --to "-1001234567890"` استفاده کنید. برای موضوع‌های انجمن Telegram، از `-1001234567890:topic:123` استفاده کنید؛ OpenClaw همچنین کوتاه‌نویسی متعلق به Telegram یعنی `-1001234567890:123` را می‌پذیرد. فراخواننده‌های مستقیم RPC/پیکربندی می‌توانند `delivery.threadId` را به‌صورت رشته یا عدد پاس دهند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند؛ از شناسهٔ دقیق اتاق یا قالب `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل اعلام از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، مقصدی با پیشوند ارائه‌دهنده مانند `telegram:123` می‌تواند پیش از بازگشت Cron به تاریخچهٔ نشست یا یک کانال پیکربندی‌شده، کانال را انتخاب کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است انتخابگر ارائه‌دهنده هستند. اگر `delivery.channel` صریح باشد، پیشوند مقصد باید همان ارائه‌دهنده را نام ببرد؛ برای نمونه، `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود، نه اینکه به WhatsApp اجازه داده شود شناسهٔ Telegram را به‌عنوان شماره تلفن تفسیر کند. پیشوندهای نوع مقصد و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>`، و `sms:<number>` همچنان نحو مقصد متعلق به کانال هستند، نه انتخابگر ارائه‌دهنده.

برای کارهای ایزوله، تحویل چت مشترک است. اگر مسیر چت در دسترس باشد، عامل می‌تواند حتی وقتی کار از `--no-deliver` استفاده می‌کند، از ابزار `message` استفاده کند. اگر عامل به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلام پشتیبان را رد می‌کند. در غیر این صورت `announce`، `webhook`، و `none` فقط کنترل می‌کنند اجراکننده پس از نوبت عامل با پاسخ نهایی چه کند.

وقتی عاملی از یک چت فعال یادآور ایزوله ایجاد می‌کند، OpenClaw مقصد تحویل زندهٔ حفظ‌شده را برای مسیر اعلام پشتیبان ذخیره می‌کند. کلیدهای نشست داخلی ممکن است حروف کوچک باشند؛ وقتی زمینهٔ چت فعلی در دسترس است، مقصدهای تحویل ارائه‌دهنده از آن کلیدها بازسازی نمی‌شوند.

تحویل اعلام ضمنی از فهرست‌های مجاز کانال پیکربندی‌شده برای اعتبارسنجی و مسیردهی دوبارهٔ مقصدهای کهنه استفاده می‌کند. تأییدهای انبار جفت‌سازی پیام مستقیم، گیرندگان اتوماسیون پشتیبان نیستند؛ وقتی یک کار زمان‌بندی‌شده باید فعالانه به یک پیام مستقیم ارسال کند، `delivery.to` را تنظیم کنید یا ورودی `allowFrom` کانال را پیکربندی کنید.

## زبان خروجی

کارهای Cron زبان پاسخ را از کانال، محل، یا پیام‌های قبلی استنباط نمی‌کنند. قانون زبان را در پیام زمان‌بندی‌شده یا الگو بگذارید:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

برای فایل‌های الگو، دستور زبان را در اعلان رندرشده نگه دارید و پیش از اجرای کار بررسی کنید جای‌نگهدارهایی مانند `{{language}}` پر شده باشند. اگر خروجی زبان‌ها را ترکیب می‌کند، قانون را صریح کنید، برای نمونه: "Use Chinese for narrative text and keep technical terms in English."

اعلان‌های شکست از مسیر مقصد جداگانه‌ای پیروی می‌کنند:

- `cron.failureDestination` یک پیش‌فرض جهانی برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و کار از پیش از طریق `announce` تحویل بدهد، اعلان‌های شکست اکنون به همان مقصد اعلام اصلی بازمی‌گردند.
- `delivery.failureDestination` فقط روی کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار Cron جهانی را وارد هشدارهای تکراریِ اجرای ردشده می‌کند. اجراهای ردشده شمارندهٔ ردشدن متوالی جداگانه‌ای دارند، بنابراین بر پس‌روی خطای اجرا اثر نمی‌گذارند.

## نمونه‌های CLI

<Tabs>
  <Tab title="یادآور یک‌باره">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="کار ایزولهٔ تکرارشونده">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="بازنویسی مدل و تفکر">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="خروجی Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="خروجی فرمان">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhookها

Gateway می‌تواند نقاط پایانی HTTP Webhook را برای محرک‌های خارجی در معرض بگذارد. در پیکربندی فعال کنید:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### احراز هویت

هر درخواست باید توکن هوک را از طریق سرآیند شامل کند:

- `Authorization: Bearer <token>`؛ توصیه‌شده
- `x-openclaw-token: <token>`

توکن‌های رشتهٔ پرس‌وجو رد می‌شوند.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    یک رویداد سامانه را برای نشست اصلی در صف بگذارید:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      شرح رویداد.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` یا `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    یک نوبت عامل ایزوله را اجرا کنید:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    فیلدها: `message`؛ الزامی، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="هوک‌های نگاشت‌شده (POST /hooks/<name>)">
    نام‌های سفارشی هوک از طریق `hooks.mappings` در پیکربندی حل می‌شوند. نگاشت‌ها می‌توانند بارهای دلخواه را با الگوها یا تبدیل‌های کد به کنش‌های `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
نقاط پایانی هوک را پشت loopback، tailnet، یا پراکسی معکوس معتمد نگه دارید.

- از یک توکن قلاب اختصاصی استفاده کنید؛ توکن‌های احراز هویت gateway را دوباره استفاده نکنید.
- `hooks.path` را روی یک زیربرنامه اختصاصی نگه دارید؛ `/` رد می‌شود.
- `hooks.allowedAgentIds` را تنظیم کنید تا محدود شود یک قلاب کدام عامل مؤثر را می‌تواند هدف بگیرد، از جمله عامل پیش‌فرض وقتی `agentId` حذف شده است.
- `hooks.allowRequestSessionKey=false` را نگه دارید مگر اینکه به نشست‌های انتخاب‌شده توسط فراخواننده نیاز داشته باشید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را نیز تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- محموله‌های قلاب به‌طور پیش‌فرض با مرزهای ایمنی پوشانده می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

محرک‌های صندوق ورودی Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، قلاب‌های فعال‌شده OpenClaw، Tailscale برای نقطه پایانی عمومی HTTPS.
</Note>

### راه‌اندازی جادوگر (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این پیکربندی `hooks.gmail` را می‌نویسد، پیش‌تنظیم Gmail را فعال می‌کند، و از Tailscale Funnel برای نقطه پایانی push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` باشد و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام راه‌اندازی `gog gmail watch serve` را شروع می‌کند و ناظر را به‌طور خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="انتخاب پروژه GCP">
    پروژه GCP مالک کلاینت OAuth مورد استفاده `gog` را انتخاب کنید:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="ایجاد topic و اعطای دسترسی push به Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="شروع ناظر">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### بازنویسی مدل Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## مدیریت کارها

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` پس از صف‌کردن اجرای دستی برمی‌گردد. برای قلاب‌های خاموش‌سازی، اسکریپت‌های نگهداری، یا خودکارسازی دیگری که باید تا پایان اجرای صف‌شده مسدود بماند، از `--wait` استفاده کنید. حالت انتظار دقیقاً همان `runId` بازگشتی را نظرسنجی می‌کند؛ برای وضعیت `ok` با `0` خارج می‌شود و برای `error`، `skipped`، یا پایان مهلت انتظار با مقدار غیرصفر.

ابزار عامل `cron` خلاصه‌های فشرده کار (`id`، `name`، `enabled`، `nextRunAtMs`، `scheduleKind`، `lastRunStatus`) را از `cron(action: "list")` برمی‌گرداند؛ برای تعریف کامل یک کار از `cron(action: "get", jobId: "...")` استفاده کنید. فراخواننده‌های مستقیم Gateway می‌توانند `compact: true` را به `cron.list` بدهند؛ حذف آن پاسخ کامل موجود را با پیش‌نمایش‌های تحویل حفظ می‌کند.

`openclaw cron create` نام مستعار `openclaw cron add` است، و کارهای جدید می‌توانند از یک زمان‌بندی مکانی (`"0 9 * * 1"`، `"every 1h"`، `"20m"`، یا یک timestamp با ISO) و پس از آن یک پیام عامل مکانی استفاده کنند. روی `cron add|create` یا `cron edit` از `--webhook <url>` استفاده کنید تا محموله اجرای پایان‌یافته به یک نقطه پایانی HTTP با POST ارسال شود. تحویل Webhook را نمی‌توان با پرچم‌های تحویل چت مانند `--announce`، `--channel`، `--to`، `--thread-id`، یا `--account` ترکیب کرد. در `cron edit`، `--clear-channel`، `--clear-to`، `--clear-thread-id`، و `--clear-account` آن فیلدهای مسیریابی را به‌صورت جداگانه unset می‌کنند (هرکدام همراه با پرچم تنظیم متناظر خود رد می‌شود)، که با غیرفعال‌کردن تحویل fallback اجراکننده توسط `--no-deliver` تفاوت دارد.

<Note>
یادداشت بازنویسی مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شده کار را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان provider/model دقیق به اجرای عامل ایزوله می‌رسد.
- اگر مجاز نباشد یا قابل resolve نباشد، Cron اجرا را با یک خطای اعتبارسنجی صریح ناموفق می‌کند.
- وصله‌های محموله API `cron.update` می‌توانند `model: null` را تنظیم کنند تا بازنویسی مدل ذخیره‌شده کار پاک شود.
- `openclaw cron edit <job-id> --clear-model` آن بازنویسی را از CLI پاک می‌کند (همان اثر وصله `model: null`) و نمی‌تواند با `--model` ترکیب شود.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در Cron مدل اصلی کار است، نه بازنویسی `/model` نشست.
- `openclaw cron add|edit --fallbacks ...` محموله `fallbacks` را تنظیم می‌کند و fallbackهای پیکربندی‌شده برای آن کار را جایگزین می‌کند؛ `--fallbacks ""` fallback را غیرفعال می‌کند و اجرا را strict می‌سازد. `openclaw cron edit <job-id> --clear-fallbacks` بازنویسی مختص هر کار را پاک می‌کند.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان یک هدف تلاش مجدد اضافی و بی‌صدا به مدل اصلی عامل سقوط نمی‌کند.

</Note>

## پیکربندی

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` هم ارسال Cron زمان‌بندی‌شده و هم اجرای نوبت عامل ایزوله را محدود می‌کند، و مقدار پیش‌فرض آن 8 است. نوبت‌های عامل Cron ایزوله به‌صورت داخلی از مسیر اجرای اختصاصی `cron-nested` صف استفاده می‌کنند، بنابراین افزایش این مقدار باعث می‌شود اجراهای مستقل LLM در Cron به‌جای اینکه فقط wrapperهای بیرونی Cron خود را شروع کنند، به‌صورت موازی پیش بروند. مسیر مشترک غیر-Cron `nested` با این تنظیم گسترش داده نمی‌شود.

`cron.store` یک کلید ذخیره منطقی و مسیر ورود doctor قدیمی است. برای واردکردن storeهای JSON موجود به SQLite و بایگانی آن‌ها، `openclaw doctor --fix` را اجرا کنید؛ تغییرات آینده Cron باید از طریق CLI یا API Gateway انجام شوند.

غیرفعال‌کردن Cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="رفتار تلاش دوباره">
    **تلاش دوباره یک‌باره**: خطاهای گذرا (rate limit، overload، network، server error) تا 3 بار با backoff نمایی دوباره تلاش می‌شوند. خطاهای دائمی فوراً غیرفعال می‌شوند.

    **تلاش دوباره تکرارشونده**: backoff نمایی (30s تا 60m) بین تلاش‌های دوباره. backoff پس از اجرای موفق بعدی بازنشانی می‌شود.

  </Accordion>
  <Accordion title="نگهداری">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های نشست اجرای ایزوله را هرس می‌کند. `cron.runLog.keepLines` ردیف‌های تاریخچه اجرای SQLite نگه‌داری‌شده برای هر کار را محدود می‌کند؛ `maxBytes` برای سازگاری پیکربندی با گزارش‌های اجرای قدیمی متکی بر فایل حفظ شده است.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

### نردبان فرمان‌ها

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron اجرا نمی‌شود">
    - متغیر محیطی `cron.enabled` و `OPENCLAW_SKIP_CRON` را بررسی کنید.
    - تأیید کنید که Gateway به‌صورت پیوسته در حال اجراست.
    - برای زمان‌بندی‌های `cron`، timezone (`--tz`) را در برابر timezone میزبان بررسی کنید.
    - `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شد و زمان انجام کار هنوز نرسیده بود.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویلی انجام نشد">
    - حالت تحویل `none` یعنی ارسال fallback اجراکننده انتظار نمی‌رود. عامل همچنان می‌تواند وقتی مسیر چت موجود است، مستقیماً با ابزار `message` ارسال کند.
    - هدف تحویل گمشده/نامعتبر (`channel`/`to`) یعنی خروجی رد شد.
    - برای Matrix، کارهای کپی‌شده یا قدیمی با شناسه‌های اتاق `delivery.to` که کوچک‌حرف شده‌اند ممکن است ناموفق شوند، چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند. کار را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی تحویل به‌دلیل اعتبارنامه‌ها مسدود شد.
    - اگر اجرای ایزوله فقط توکن بی‌صدا (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل خروجی مستقیم را سرکوب می‌کند و مسیر خلاصه صف‌شده fallback را نیز سرکوب می‌کند، بنابراین چیزی به چت ارسال نمی‌شود.
    - اگر عامل باید خودش به کاربر پیام بدهد، بررسی کنید که کار یک مسیر قابل‌استفاده دارد (`channel: "last"` با یک چت قبلی، یا کانال/هدف صریح).

  </Accordion>
  <Accordion title="به نظر می‌رسد Cron یا heartbeat از rollover سبک /new جلوگیری می‌کند">
    - تازگی بازنشانی روزانه و بیکار مبتنی بر `updatedAt` نیست؛ [مدیریت نشست](/fa/concepts/session#session-lifecycle) را ببینید.
    - بیدارباش‌های Cron، اجراهای Heartbeat، اعلان‌های exec، و دفترداری gateway ممکن است ردیف نشست را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی ایجادشده پیش از وجود این فیلدها، OpenClaw می‌تواند `sessionStartedAt` را از سرآیند نشست transcript JSONL بازیابی کند، وقتی فایل هنوز موجود باشد. ردیف‌های بیکار قدیمی بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان مبنای بیکاری خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات مهم timezone">
    - Cron بدون `--tz` از timezone میزبان gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند.
    - `activeHours` در Heartbeat از resolve کردن timezone پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [خودکارسازی](/fa/automation) — همه سازوکارهای خودکارسازی در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — دفتر کارها برای اجراهای Cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای نشست اصلی
- [Timezone](/fa/concepts/timezone) — پیکربندی timezone
