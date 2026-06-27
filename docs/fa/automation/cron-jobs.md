---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارباش‌ها
    - اتصال محرک‌های خارجی (webhooks، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhookها، و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-06-27T17:08:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. کارها را ماندگار می‌کند، عامل را در زمان درست بیدار می‌کند، و می‌تواند خروجی را به یک کانال چت یا نقطه پایانی Webhook تحویل دهد.

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

## Cron چگونه کار می‌کند

- Cron **داخل فرایند Gateway** اجرا می‌شود (نه داخل مدل).
- تعریف کارها، وضعیت زمان اجرا، و تاریخچه اجرا در پایگاه داده وضعیت SQLite مشترک OpenClaw ماندگار می‌شوند تا راه‌اندازی‌های دوباره باعث از دست رفتن زمان‌بندی‌ها نشوند.
- هنگام ارتقا، `openclaw doctor --fix` را اجرا کنید تا فایل‌های قدیمی `~/.openclaw/cron/jobs.json`، `jobs-state.json`، و `runs/*.jsonl` به SQLite وارد شوند و با پسوند `.migrated` تغییر نام پیدا کنند. ردیف‌های کارِ بدشکل از زمان اجرا رد می‌شوند و برای تعمیر یا بازبینی بعدی در `jobs-quarantine.json` کپی می‌شوند.
- `cron.store` همچنان کلید منطقی ذخیره‌گاه cron و مسیر ورود doctor را نام‌گذاری می‌کند. پس از ورود، ویرایش آن فایل JSON دیگر کارهای cron فعال را تغییر نمی‌دهد؛ به‌جای آن از `openclaw cron add|edit|remove` یا متدهای RPC کرون Gateway استفاده کنید.
- همه اجراهای cron رکوردهای [کار پس‌زمینه](/fa/automation/tasks) می‌سازند.
- هنگام راه‌اندازی Gateway، کارهای نوبت عامل ایزوله‌ای که موعدشان گذشته است به‌جای بازپخش فوری، خارج از پنجره اتصال کانال دوباره زمان‌بندی می‌شوند تا راه‌اندازی Discord/Telegram و تنظیم فرمان‌های بومی پس از راه‌اندازی دوباره پاسخ‌گو بمانند.
- کارهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت خودکار حذف می‌شوند.
- اجراهای cron ایزوله، هنگام کامل شدن اجرا، به‌صورت best-effort برگه‌ها/فرایندهای مرورگر ردیابی‌شده را برای نشست `cron:<jobId>` خود می‌بندند تا خودکارسازی مرورگر جداشده فرایندهای یتیم باقی نگذارد.
- اجراهای cron ایزوله‌ای که مجوز محدود خودپاک‌سازی cron را دریافت می‌کنند همچنان می‌توانند وضعیت زمان‌بند، فهرست خودفیلترشده‌ای از کار جاری خود، و تاریخچه اجرای همان کار را بخوانند، تا بررسی‌های وضعیت/Heartbeat بتوانند زمان‌بندی خودشان را بدون گرفتن دسترسی گسترده‌تر برای تغییر cron بازرسی کنند.
- اجراهای cron ایزوله در برابر پاسخ‌های تأیید قدیمی نیز محافظت می‌کنند. اگر نتیجه اول فقط یک به‌روزرسانی وضعیت موقت باشد (`on it`، `pulling everything together`، و اشاره‌های مشابه) و هیچ اجرای زیرعاملِ فرزند هنوز مسئول پاسخ نهایی نباشد، OpenClaw پیش از تحویل یک‌بار دیگر برای نتیجه واقعی دوباره پرامپت می‌کند.
- اجراهای cron ایزوله از فراداده ساختاریافته منع اجرا از اجرای جاسازی‌شده استفاده می‌کنند، از جمله پوشش‌دهنده‌های میزبان-گره `UNAVAILABLE` که پیام خطای تو‌در‌توی آن‌ها با `SYSTEM_RUN_DENIED` یا `INVALID_REQUEST` شروع می‌شود، تا یک فرمان مسدودشده به‌عنوان اجرای سبز گزارش نشود، در حالی که نثر معمول دستیار به‌عنوان منع اجرا تلقی نشود.
- اجراهای cron ایزوله همچنین شکست‌های عامل در سطح اجرا را حتی وقتی هیچ محموله پاسخی تولید نشده باشد خطای کار تلقی می‌کنند، تا شکست‌های مدل/ارائه‌دهنده شمارنده‌های خطا را افزایش دهند و اعلان‌های شکست را فعال کنند، نه اینکه کار را موفق پاک کنند.
- وقتی یک کار نوبت عامل ایزوله به `timeoutSeconds` می‌رسد، cron اجرای عامل زیرین را متوقف می‌کند و یک پنجره کوتاه پاک‌سازی به آن می‌دهد. اگر اجرا تخلیه نشود، پاک‌سازی تحت مالکیت Gateway پیش از اینکه cron وقفه را ثبت کند، مالکیت نشست آن اجرا را به‌اجبار پاک می‌کند تا کار چت صف‌شده پشت یک نشست پردازش قدیمی رها نشود.
- اگر یک نوبت عامل ایزوله پیش از شروع اجراکننده یا پیش از نخستین فراخوانی مدل متوقف شود، cron یک وقفه ویژه مرحله مثل `setup timed out before runner start` یا `stalled before first model call (last phase: context-engine)` ثبت می‌کند. این نگهبان‌ها ارائه‌دهنده‌های جاسازی‌شده و ارائه‌دهنده‌های متکی به CLI را پیش از آنکه فرایند CLI خارجی آن‌ها واقعاً شروع شود پوشش می‌دهند، و مستقل از مقدارهای طولانی `timeoutSeconds` سقف‌گذاری می‌شوند تا شکست‌های شروع سرد/احراز هویت/زمینه به‌جای انتظار برای کل بودجه کار، سریع آشکار شوند.
- اگر از cron سیستمی یا زمان‌بند خارجی دیگری برای اجرای `openclaw agent` استفاده می‌کنید، با وجود اینکه CLI سیگنال‌های `SIGTERM`/`SIGINT` را مدیریت می‌کند، آن را با تشدید hard-kill پوشش دهید. اجراهای متکی به Gateway از Gateway می‌خواهند اجراهای پذیرفته‌شده را متوقف کند؛ اجراهای fallback محلی و جاسازی‌شده همان سیگنال توقف را دریافت می‌کنند. برای `timeout` در GNU، `timeout -k 60 600 openclaw agent ...` را به `timeout 600 ...` ساده ترجیح دهید؛ مقدار `-k` پشتیبان ناظر است اگر فرایند نتواند تخلیه شود. برای واحدهای systemd، همین شکل را با استفاده از سیگنال توقف `SIGTERM` به‌علاوه یک پنجره مهلت مانند `TimeoutStopSec` پیش از هر kill نهایی حفظ کنید. اگر یک تلاش دوباره از `--run-id` استفاده مجدد کند در حالی که اجرای اصلی Gateway هنوز فعال است، نسخه تکراری به‌جای شروع اجرای دوم به‌عنوان در جریان گزارش می‌شود.

<a id="maintenance"></a>

<Note>
سازش کار برای cron اول تحت مالکیت زمان اجرا و دوم متکی به تاریخچه بادوام است: یک کار cron فعال تا وقتی زمان اجرای cron هنوز آن کار را در حال اجرا ردیابی می‌کند زنده می‌ماند، حتی اگر یک ردیف نشست فرزند قدیمی هنوز وجود داشته باشد. وقتی زمان اجرا دیگر مالک کار نباشد و پنجره مهلت ۵ دقیقه‌ای منقضی شود، نگه‌داری لاگ‌های اجرای ماندگار و وضعیت کار را برای اجرای مطابق `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن تاریخچه بادوام نتیجه پایانی نشان دهد، دفتر کل کار از آن نهایی می‌شود؛ در غیر این صورت نگه‌داری تحت مالکیت Gateway می‌تواند کار را `lost` علامت‌گذاری کند. حسابرسی آفلاین CLI می‌تواند از تاریخچه بادوام بازیابی کند، اما مجموعه خالی کارهای فعال درون‌فرایندی خودش را به‌عنوان مدرک حذف شدن یک اجرای cron تحت مالکیت Gateway تلقی نمی‌کند.
</Note>

## انواع زمان‌بندی

| نوع     | پرچم CLI  | توضیح                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | برچسب زمانی یک‌باره (ISO 8601 یا نسبی مانند `20m`)     |
| `every` | `--every` | بازه ثابت                                               |
| `cron`  | `--cron`  | عبارت cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری     |

برچسب‌های زمانی بدون منطقه زمانی به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی بر اساس ساعت محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشونده ابتدای ساعت به‌طور خودکار تا سقف ۵ دقیقه پخش می‌شوند تا جهش‌های بار کاهش یابد. برای اجبار زمان‌بندی دقیق از `--exact` یا برای یک پنجره صریح از `--stagger 30s` استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) تجزیه می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته غیر wildcard باشند، croner زمانی تطبیق می‌دهد که **هرکدام** از فیلدها مطابق باشد، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این عبارت به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw اینجا از رفتار پیش‌فرض OR در Croner استفاده می‌کند. برای الزام هر دو شرط، از اصلاح‌گر روز هفته `+` در Croner (`0 9 15 * +1`) استفاده کنید یا بر اساس یک فیلد زمان‌بندی کنید و فیلد دیگر را در پرامپت یا فرمان کار خود محافظت کنید.

## سبک‌های اجرا

| سبک           | مقدار `--session`   | اجرا در                  | بهترین کاربرد                  |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| نشست اصلی    | `main`              | مسیر بیدارسازی اختصاصی cron | یادآورها، رویدادهای سیستم      |
| ایزوله        | `isolated`          | `cron:<jobId>` اختصاصی   | گزارش‌ها، کارهای پس‌زمینه       |
| نشست جاری    | `current`           | متصل‌شده در زمان ایجاد   | کار تکرارشونده آگاه از زمینه   |
| نشست سفارشی  | `session:custom-id` | نشست نام‌دار ماندگار     | گردش‌کارهایی که بر تاریخچه بنا می‌شوند |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    کارهای **نشست اصلی** یک رویداد سیستمی را در یک مسیر اجرای متعلق به cron صف می‌کنند و به‌صورت اختیاری Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن‌ها می‌توانند برای پاسخ‌ها از آخرین زمینه تحویل نشست اصلی هدف استفاده کنند، اما نوبت‌های معمول cron را به مسیر چت انسانی اضافه نمی‌کنند و تازگی بازنشانی روزانه/بیکاری را برای نشست هدف تمدید نمی‌کنند. کارهای **ایزوله** یک نوبت عامل اختصاصی را با نشست تازه اجرا می‌کنند. **نشست‌های سفارشی** (`session:xxx`) زمینه را بین اجراها ماندگار می‌کنند و گردش‌کارهایی مثل ایستاده‌های روزانه را که بر خلاصه‌های قبلی بنا می‌شوند فعال می‌کنند.

    رویدادهای cron نشست اصلی، یادآورهای رویداد سیستمی خودبسنده هستند. آن‌ها
    به‌طور خودکار دستور «Read
    HEARTBEAT.md» پرامپت پیش‌فرض Heartbeat را شامل نمی‌شوند. اگر یک یادآور تکرارشونده باید
    `HEARTBEAT.md` را بررسی کند، این را صریحاً در متن رویداد cron یا در
    دستورهای خود عامل بگویید.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    برای کارهای ایزوله، «نشست تازه» یعنی یک شناسه transcript/نشست جدید برای هر اجرا. OpenClaw ممکن است ترجیح‌های امنی مثل تنظیمات thinking/fast/verbose، برچسب‌ها، و overrideهای صریح مدل/احراز هویت انتخاب‌شده توسط کاربر را حمل کند، اما زمینه مکالمه محیطی را از یک ردیف cron قدیمی به ارث نمی‌برد: مسیریابی کانال/گروه، سیاست ارسال یا صف، ارتقا، مبدا، یا اتصال زمان اجرای ACP. وقتی یک کار تکرارشونده باید عمداً بر همان زمینه مکالمه بنا شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="Runtime cleanup">
    برای کارهای ایزوله، برچیدن زمان اجرا اکنون شامل پاک‌سازی best-effort مرورگر برای آن نشست cron است. شکست‌های پاک‌سازی نادیده گرفته می‌شوند تا نتیجه واقعی cron همچنان تعیین‌کننده باشد.

    اجراهای cron ایزوله هر نمونه زمان اجرای MCP بسته‌بندی‌شده‌ای را هم که برای کار ساخته شده باشد از مسیر پاک‌سازی زمان اجرای مشترک آزاد می‌کنند. این با نحوه برچیده شدن کلاینت‌های MCP نشست اصلی و نشست سفارشی هم‌خوان است، بنابراین کارهای cron ایزوله فرایندهای فرزند stdio یا اتصال‌های MCP بلندمدت را بین اجراها نشت نمی‌دهند.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    وقتی اجراهای cron ایزوله زیرعامل‌ها را هماهنگ می‌کنند، تحویل نیز خروجی نهایی فرزند را به متن موقت قدیمی والد ترجیح می‌دهد. اگر فرزندان هنوز در حال اجرا باشند، OpenClaw به‌جای اعلام آن، به‌روزرسانی جزئی والد را سرکوب می‌کند.

    برای هدف‌های اعلان Discord فقط‌متنی، OpenClaw متن نهایی و canonical دستیار را یک‌بار می‌فرستد، به‌جای اینکه هم محموله‌های متن streamشده/میانی و هم پاسخ نهایی را بازپخش کند. محموله‌های رسانه‌ای و ساختاریافته Discord همچنان به‌عنوان محموله‌های جداگانه تحویل می‌شوند تا پیوست‌ها و مؤلفه‌ها حذف نشوند.

  </Accordion>
</AccordionGroup>

### محموله‌های فرمان

از محموله‌های فرمان برای اسکریپت‌های قطعی استفاده کنید که باید بدون شروع یک نوبت عامل ایزوله متکی به مدل، داخل زمان‌بند Gateway اجرا شوند. کارهای فرمان روی میزبان Gateway اجرا می‌شوند، stdout/stderr را ثبت می‌کنند، اجرا را در تاریخچه cron ثبت می‌کنند، و همان حالت‌های تحویل `announce`، `webhook`، و `none` را مثل کارهای ایزوله دوباره استفاده می‌کنند.

<Note>
Command cron یک سطح خودکارسازی Gateway برای operator-admin است، نه یک فراخوانی
`tools.exec` عامل. ایجاد، به‌روزرسانی، حذف، یا اجرای دستی کارهای cron
به `operator.admin` نیاز دارد؛ اجراهای زمان‌بندی‌شده فرمان بعداً داخل
فرایند Gateway به‌عنوان همان خودکارسازی نوشته‌شده توسط admin اجرا می‌شوند. سیاست exec عامل مثل
`tools.exec.mode`، پرامپت‌های تأیید، و فهرست‌های مجاز ابزار برای هر عامل، ابزارهای exec
قابل مشاهده برای مدل را کنترل می‌کند، نه محموله‌های command cron.
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

`--command <shell>` مقدار `argv: ["sh", "-lc", <shell>]` را ذخیره می‌کند. وقتی اجرای دقیق argv را بدون تجزیه shell می‌خواهید، از `--command-argv '["node","scripts/report.mjs"]'` استفاده کنید. فیلدهای اختیاری `--command-env KEY=VALUE`، `--command-input`، `--timeout-seconds`، `--no-output-timeout-seconds`، و `--output-max-bytes` محیط فرایند، stdin، و کران‌های خروجی را کنترل می‌کنند.

اگر stdout غیرخالی باشد، همان متن نتیجهٔ تحویل‌داده‌شده است. اگر stdout خالی باشد و stderr غیرخالی باشد، stderr تحویل داده می‌شود. اگر هر دو جریان وجود داشته باشند، cron یک بلوک کوچک `stdout:` / `stderr:` تحویل می‌دهد. کد خروج صفر اجرا را به‌عنوان `ok` ثبت می‌کند؛ خروج غیرصفر، سیگنال، timeout، یا timeout بی‌خروجی، `error` ثبت می‌کند و می‌تواند هشدارهای شکست را فعال کند. دستوری که فقط `NO_REPLY` چاپ کند از سرکوب عادی توکن سکوت cron استفاده می‌کند و چیزی به چت ارسال نمی‌کند.

### گزینه‌های payload برای کارهای ایزوله

<ParamField path="--message" type="string" required>
  متن prompt (برای حالت ایزوله ضروری است).
</ParamField>
<ParamField path="--model" type="string">
  بازنویسی مدل؛ از مدل مجاز انتخاب‌شده برای کار استفاده می‌کند.
</ParamField>
<ParamField path="--fallbacks" type="string">
  فهرست مدل‌های fallback مخصوص هر کار، برای مثال `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. برای اجرای سخت‌گیرانه بدون fallback مقدار `--fallbacks ""` را بدهید.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  در `cron edit`، بازنویسی fallback مخصوص کار را حذف می‌کند تا کار از تقدم fallback پیکربندی‌شده پیروی کند. نمی‌تواند با `--fallbacks` ترکیب شود.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  در `cron edit`، بازنویسی مدل مخصوص کار را حذف می‌کند تا کار از تقدم عادی انتخاب مدل cron پیروی کند (اگر تنظیم شده باشد بازنویسی ذخیره‌شدهٔ cron-session، در غیر این صورت مدل agent/default). نمی‌تواند با `--model` ترکیب شود.
</ParamField>
<ParamField path="--thinking" type="string">
  بازنویسی سطح تفکر.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تزریق فایل bootstrap فضای کاری را رد کنید.
</ParamField>
<ParamField path="--tools" type="string">
  ابزارهایی را که کار می‌تواند استفاده کند محدود کنید، برای مثال `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی آن کار استفاده می‌کند. این با بازنویسی `/model` در نشست چت یکسان نیست: زنجیره‌های fallback پیکربندی‌شده همچنان وقتی مدل اصلی کار شکست بخورد اعمال می‌شوند. اگر مدل درخواستی مجاز نباشد یا قابل resolve نباشد، cron اجرا را با خطای اعتبارسنجی صریح شکست می‌دهد، به‌جای اینکه بی‌صدا به انتخاب مدل agent/default کار fallback کند.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. وقتی وجود داشته باشد، آن فهرست جایگزین زنجیرهٔ fallback پیکربندی‌شده برای کار می‌شود. وقتی می‌خواهید اجرای cron سخت‌گیرانه‌ای داشته باشید که فقط مدل انتخاب‌شده را امتحان کند، در payload/API کار از `fallbacks: []` استفاده کنید. اگر کاری `--model` داشته باشد اما نه fallback در payload و نه fallback پیکربندی‌شده، OpenClaw یک بازنویسی fallback خالی صریح ارسال می‌کند تا مدل اصلی agent به‌عنوان هدف تلاش مجدد اضافهٔ پنهان افزوده نشود.

بررسی‌های preflight ارائه‌دهندهٔ محلی، پیش از علامت‌گذاری اجرای cron به‌عنوان `skipped`، fallbackهای پیکربندی‌شده را طی می‌کنند؛ `fallbacks: []` این مسیر preflight را سخت‌گیرانه نگه می‌دارد.

تقدم انتخاب مدل برای کارهای ایزوله این است:

1. بازنویسی مدل hook جیمیل (وقتی اجرا از جیمیل آمده باشد و آن بازنویسی مجاز باشد)
2. `model` در payload مخصوص کار
3. بازنویسی ذخیره‌شدهٔ مدل نشست cron انتخاب‌شده توسط کاربر
4. انتخاب مدل agent/default

حالت سریع نیز از انتخاب زندهٔ resolveشده پیروی می‌کند. اگر پیکربندی مدل انتخاب‌شده `params.fastMode` داشته باشد، cron ایزوله به‌طور پیش‌فرض از آن استفاده می‌کند. بازنویسی `fastMode` نشست ذخیره‌شده همچنان در هر جهت بر پیکربندی غالب است. حالت خودکار، وقتی موجود باشد، از آستانهٔ `params.fastAutoOnSeconds` مدل انتخاب‌شده استفاده می‌کند و مقدار پیش‌فرض آن ۶۰ ثانیه است.

اگر یک اجرای ایزوله به handoff تعویض مدل زنده برسد، cron با ارائه‌دهنده/مدل تعویض‌شده دوباره تلاش می‌کند و پیش از تلاش مجدد آن انتخاب زنده را برای اجرای فعال persist می‌کند. وقتی تعویض یک profile احراز هویت جدید هم همراه داشته باشد، cron آن بازنویسی profile احراز هویت را هم برای اجرای فعال persist می‌کند. تلاش‌های مجدد محدودند: پس از تلاش اولیه به‌علاوهٔ ۲ تلاش مجدد تعویض، cron به‌جای حلقهٔ بی‌پایان abort می‌کند.

پیش از آنکه اجرای cron ایزوله وارد agent runner شود، OpenClaw endpointهای ارائه‌دهندهٔ محلی قابل دسترس را برای ارائه‌دهندگان پیکربندی‌شدهٔ `api: "ollama"` و `api: "openai-completions"` بررسی می‌کند که `baseUrl` آن‌ها loopback، شبکهٔ خصوصی، یا `.local` باشد. اگر آن endpoint از کار افتاده باشد، اجرا به‌جای شروع فراخوانی مدل، با خطای واضح ارائه‌دهنده/مدل به‌عنوان `skipped` ثبت می‌شود. نتیجهٔ endpoint برای ۵ دقیقه cache می‌شود، بنابراین بسیاری از کارهای موعدرسیده که از همان سرور محلی ازکارافتادهٔ Ollama، vLLM، SGLang، یا LM Studio استفاده می‌کنند، به‌جای ایجاد طوفان درخواست، یک probe کوچک مشترک دارند. اجراهای ردشدهٔ provider-preflight، backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های تکراری skip می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | چه اتفاقی می‌افتد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر agent ارسال نکرده باشد، متن نهایی را با fallback به مقصد تحویل می‌دهد |
| `webhook`  | payload رویداد تمام‌شده را به یک URL با POST ارسال می‌کند                                |
| `none`     | تحویل fallback از runner انجام نمی‌شود                                         |

برای تحویل کانال از `--announce --channel telegram --to "-1001234567890"` استفاده کنید. برای topicهای forum در Telegram، از `-1001234567890:topic:123` استفاده کنید؛ OpenClaw همچنین میان‌بر متعلق به Telegram یعنی `-1001234567890:123` را می‌پذیرد. فراخوان‌های مستقیم RPC/پیکربندی می‌توانند `delivery.threadId` را به‌صورت رشته یا عدد ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند؛ از شناسهٔ دقیق اتاق یا فرم `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل announce از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، مقصد دارای پیشوند ارائه‌دهنده مانند `telegram:123` می‌تواند پیش از آنکه cron به تاریخچهٔ نشست یا یک کانال پیکربندی‌شدهٔ واحد fallback کند، کانال را انتخاب کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است selector ارائه‌دهنده هستند. اگر `delivery.channel` صریح باشد، پیشوند مقصد باید همان ارائه‌دهنده را نام ببرد؛ برای مثال، `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود، به‌جای اینکه اجازه دهد WhatsApp شناسهٔ Telegram را به‌عنوان شماره تلفن تفسیر کند. پیشوندهای نوع مقصد و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>`، و `sms:<number>` همچنان syntax مقصد تحت مالکیت کانال هستند، نه selectorهای ارائه‌دهنده.

برای کارهای ایزوله، تحویل چت مشترک است. اگر مسیر چت در دسترس باشد، agent می‌تواند از ابزار `message` استفاده کند حتی وقتی کار از `--no-deliver` استفاده می‌کند. اگر agent به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلان fallback را رد می‌کند. در غیر این صورت `announce`، `webhook`، و `none` فقط کنترل می‌کنند runner پس از نوبت agent با پاسخ نهایی چه کند.

وقتی agent از یک چت فعال یادآور ایزوله‌ای ایجاد می‌کند، OpenClaw مقصد تحویل زندهٔ حفظ‌شده را برای مسیر announce fallback ذخیره می‌کند. کلیدهای داخلی نشست ممکن است حروف کوچک باشند؛ وقتی context چت فعلی در دسترس باشد، مقصدهای تحویل ارائه‌دهنده از آن کلیدها بازسازی نمی‌شوند.

تحویل announce ضمنی از allowlistهای کانال پیکربندی‌شده برای اعتبارسنجی و reroute مقصدهای stale استفاده می‌کند. تأییدهای pairing-store برای DM گیرندهٔ اتوماسیون fallback نیستند؛ وقتی یک کار زمان‌بندی‌شده باید پیش‌دستانه به DM ارسال کند، `delivery.to` را تنظیم کنید یا ورودی `allowFrom` کانال را پیکربندی کنید.

## زبان خروجی

کارهای Cron زبان پاسخ را از کانال، locale، یا پیام‌های قبلی استنباط نمی‌کنند.
قاعدهٔ زبان را در پیام یا template زمان‌بندی‌شده قرار دهید:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

برای فایل‌های template، دستور زبان را در prompt رندرشده نگه دارید و
پیش از اجرای کار بررسی کنید placeholderهایی مانند `{{language}}` پر شده باشند. اگر
خروجی زبان‌ها را مخلوط کرد، قاعده را صریح کنید، برای مثال: «برای متن روایی از چینی استفاده کن
و اصطلاحات فنی را انگلیسی نگه دار.»

اعلان‌های شکست مسیر مقصد جداگانه‌ای را دنبال می‌کنند:

- `cron.failureDestination` پیش‌فرض سراسری اعلان‌های شکست را تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و کار از پیش از طریق `announce` تحویل دهد، اعلان‌های شکست اکنون به همان مقصد announce اصلی fallback می‌کنند.
- `delivery.failureDestination` فقط در کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار سراسری cron را وارد هشدارهای تکراری اجرای ردشده می‌کند. اجراهای ردشده شمارندهٔ skip متوالی جداگانه‌ای نگه می‌دارند، بنابراین بر backoff خطای اجرا اثر نمی‌گذارند.

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
  <Tab title="خروجی دستور">
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

Gateway می‌تواند endpointهای HTTP webhook را برای triggerهای خارجی expose کند. در پیکربندی فعال کنید:

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

هر درخواست باید توکن hook را از طریق header شامل کند:

- `Authorization: Bearer <token>` (توصیه‌شده)
- `x-openclaw-token: <token>`

توکن‌های query-string رد می‌شوند.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    یک رویداد سیستم را برای نشست اصلی در صف قرار دهید:

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
    یک نوبت agent ایزوله اجرا کنید:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    فیلدها: `message` (ضروری)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="hookهای نگاشت‌شده (POST /hooks/<name>)">
    نام‌های hook سفارشی از طریق `hooks.mappings` در پیکربندی resolve می‌شوند. نگاشت‌ها می‌توانند payloadهای دلخواه را با templateها یا transformهای کد به actionهای `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
endpointهای hook را پشت loopback، tailnet، یا reverse proxy مورد اعتماد نگه دارید.

- از یک توکن hook اختصاصی استفاده کنید؛ توکن‌های احراز هویت gateway را دوباره استفاده نکنید.
- `hooks.path` را روی یک زیرمسیر اختصاصی نگه دارید؛ `/` رد می‌شود.
- برای محدود کردن اینکه یک hook کدام agent مؤثر را می‌تواند هدف بگیرد، `hooks.allowedAgentIds` را تنظیم کنید، از جمله agent پیش‌فرض وقتی `agentId` حذف شده است.
- مگر اینکه به نشست‌های انتخاب‌شده توسط فراخواننده نیاز دارید، `hooks.allowRequestSessionKey=false` را نگه دارید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را هم تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- payloadهای hook به‌طور پیش‌فرض با مرزهای ایمنی wrap می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

محرک‌های صندوق ورودی Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، هوک‌های OpenClaw فعال، Tailscale برای نقطه پایانی HTTPS عمومی.
</Note>

### راه‌اندازی با ویزارد (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این دستور پیکربندی `hooks.gmail` را می‌نویسد، preset مربوط به Gmail را فعال می‌کند، و از Tailscale Funnel برای نقطه پایانی push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` باشد و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام بوت `gog gmail watch serve` را اجرا می‌کند و watch را به‌صورت خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="Select the GCP project">
    پروژه GCP را که مالک کلاینت OAuth استفاده‌شده توسط `gog` است انتخاب کنید:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
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

## مدیریت jobها

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

`openclaw cron run <jobId>` پس از صف‌کردن اجرای دستی برمی‌گردد. از `--wait` برای هوک‌های خاموش‌سازی، اسکریپت‌های نگهداشت، یا اتوماسیون‌های دیگری استفاده کنید که باید تا پایان اجرای صف‌شده مسدود بمانند. حالت انتظار دقیقاً همان `runId` برگشتی را poll می‌کند؛ برای وضعیت `ok` با `0` خارج می‌شود و برای `error`، `skipped`، یا timeout انتظار با مقدار غیرصفر خارج می‌شود.

ابزار agent `cron` از `cron(action: "list")` خلاصه‌های فشرده job را (`id`، `name`، `enabled`، `nextRunAtMs`، `scheduleKind`، `lastRunStatus`) برمی‌گرداند؛ برای یک تعریف کامل job از `cron(action: "get", jobId: "...")` استفاده کنید. فراخوان‌های مستقیم Gateway می‌توانند `compact: true` را به `cron.list` پاس بدهند؛ حذف آن، پاسخ کامل موجود همراه با پیش‌نمایش‌های تحویل را حفظ می‌کند.

`openclaw cron create` نام مستعار `openclaw cron add` است، و jobهای جدید می‌توانند از یک زمان‌بندی positional (`"0 9 * * 1"`، `"every 1h"`، `"20m"`، یا یک timestamp به قالب ISO) و پس از آن یک prompt positional برای agent استفاده کنند. از `--webhook <url>` روی `cron add|create` یا `cron edit` استفاده کنید تا payload اجرای تکمیل‌شده با POST به یک نقطه پایانی HTTP ارسال شود. تحویل Webhook را نمی‌توان با flagهای تحویل chat مانند `--announce`، `--channel`، `--to`، `--thread-id`، یا `--account` ترکیب کرد. در `cron edit`، گزینه‌های `--clear-channel`، `--clear-to`، `--clear-thread-id`، و `--clear-account` آن فیلدهای مسیریابی را جداگانه unset می‌کنند (هرکدام در کنار flag تنظیم متناظر خود رد می‌شود)، که با غیرفعال‌کردن تحویل fallback runner توسط `--no-deliver` متفاوت است.

<Note>
نکته بازنویسی مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شده job را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان provider/model دقیق به اجرای agent ایزوله می‌رسد.
- اگر مجاز نباشد یا resolve نشود، Cron اجرای آن را با یک خطای اعتبارسنجی صریح fail می‌کند.
- patchهای payload مربوط به API `cron.update` می‌توانند `model: null` را تنظیم کنند تا بازنویسی مدل ذخیره‌شده برای job پاک شود.
- `openclaw cron edit <job-id> --clear-model` این بازنویسی را از CLI پاک می‌کند (همان اثر patch با `model: null`) و نمی‌تواند با `--model` ترکیب شود.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در Cron مدل primary مربوط به job است، نه بازنویسی `/model` مربوط به session.
- `openclaw cron add|edit --fallbacks ...` مقدار `fallbacks` در payload را تنظیم می‌کند و fallbackهای پیکربندی‌شده برای آن job را جایگزین می‌کند؛ `--fallbacks ""` fallback را غیرفعال می‌کند و اجرا را strict می‌سازد. `openclaw cron edit <job-id> --clear-fallbacks` بازنویسی per-job را پاک می‌کند.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان هدف retry اضافی خاموش به primary agent fall through نمی‌کند.

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

`maxConcurrentRuns` هم dispatch زمان‌بندی‌شده Cron و هم اجرای نوبت agent ایزوله را محدود می‌کند و مقدار پیش‌فرض آن 8 است. نوبت‌های agent ایزوله Cron به‌صورت داخلی از lane اجرای اختصاصی `cron-nested` صف استفاده می‌کنند، بنابراین افزایش این مقدار باعث می‌شود اجراهای مستقل LLM مربوط به Cron به‌جای اینکه فقط wrapperهای بیرونی Cron آن‌ها شروع شود، به‌صورت موازی پیش بروند. lane مشترک غیر Cron یعنی `nested` با این تنظیم گسترده‌تر نمی‌شود.

`cron.store` یک کلید store منطقی و مسیر import قدیمی doctor است. برای import کردن storeهای JSON موجود به SQLite و archive کردن آن‌ها، `openclaw doctor --fix` را اجرا کنید؛ تغییرات آینده Cron باید از طریق CLI یا API Gateway انجام شوند.

غیرفعال‌کردن Cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **retry یک‌باره**: خطاهای گذرا (rate limit، overload، شبکه، خطای server) تا 3 بار با backoff نمایی retry می‌شوند. خطاهای دائمی بلافاصله غیرفعال می‌شوند.

    **retry تکرارشونده**: backoff نمایی (30s تا 60m) بین retryها. Backoff پس از اجرای موفق بعدی reset می‌شود.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های session اجرای ایزوله را prune می‌کند. `cron.runLog.keepLines` ردیف‌های تاریخچه اجرای SQLite نگه‌داشته‌شده برای هر job را محدود می‌کند؛ `maxBytes` برای سازگاری پیکربندی با run logهای قدیمی مبتنی بر فایل حفظ شده است.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

### نردبان فرمان

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
  <Accordion title="Cron not firing">
    - متغیر env مربوط به `cron.enabled` و `OPENCLAW_SKIP_CRON` را بررسی کنید.
    - تأیید کنید Gateway به‌صورت پیوسته در حال اجراست.
    - برای زمان‌بندی‌های `cron`، timezone (`--tz`) را در برابر timezone میزبان بررسی کنید.
    - وجود `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و موعد job هنوز نرسیده است.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - حالت تحویل `none` یعنی ارسال fallback از runner انتظار نمی‌رود. agent همچنان می‌تواند وقتی route چت در دسترس باشد، مستقیماً با ابزار `message` ارسال کند.
    - نبودن یا نامعتبر بودن هدف تحویل (`channel`/`to`) یعنی outbound skipped شده است.
    - برای Matrix، jobهای کپی‌شده یا قدیمی با شناسه‌های room در `delivery.to` که به حروف کوچک تبدیل شده‌اند ممکن است fail شوند، چون شناسه‌های room در Matrix به بزرگی و کوچکی حروف حساس‌اند. job را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای auth کانال (`unauthorized`، `Forbidden`) یعنی تحویل توسط credentials مسدود شده است.
    - اگر اجرای ایزوله فقط token خاموش (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل outbound مستقیم را سرکوب می‌کند و مسیر خلاصه صف‌شده fallback را هم سرکوب می‌کند، بنابراین چیزی به chat برگردانده نمی‌شود.
    - اگر agent باید خودش به کاربر پیام بدهد، بررسی کنید job یک route قابل استفاده دارد (`channel: "last"` همراه با chat قبلی، یا یک channel/target صریح).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - تازگی reset روزانه و idle بر پایه `updatedAt` نیست؛ [مدیریت session](/fa/concepts/session#session-lifecycle) را ببینید.
    - wakeupهای Cron، اجراهای Heartbeat، اعلان‌های exec، و bookkeeping مربوط به gateway ممکن است row مربوط به session را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای rowهای قدیمی که پیش از وجود این فیلدها ایجاد شده‌اند، وقتی فایل همچنان در دسترس باشد، OpenClaw می‌تواند `sessionStartedAt` را از header session در transcript JSONL بازیابی کند. rowهای idle قدیمی بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان baseline idle خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron بدون `--tz` از timezone میزبان gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند.
    - `activeHours` در Heartbeat از resolution مربوط به timezone پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [اتوماسیون](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [وظایف پس‌زمینه](/fa/automation/tasks) — ledger وظیفه برای اجراهای Cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای main-session
- [Timezone](/fa/concepts/timezone) — پیکربندی timezone
