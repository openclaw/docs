---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارباش‌ها
    - اتصال محرک‌های خارجی (webhookها، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، webhooks، و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-07-01T08:18:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. کارها را ماندگار می‌کند، عامل را در زمان درست بیدار می‌کند و می‌تواند خروجی را به یک کانال چت یا نقطه پایانی Webhook برگرداند.

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
- تعریف‌های کار، وضعیت زمان اجرا و تاریخچه اجراها در پایگاه داده وضعیت SQLite مشترک OpenClaw ماندگار می‌شوند تا راه‌اندازی‌های دوباره باعث از دست رفتن زمان‌بندی‌ها نشوند.
- هنگام ارتقا، `openclaw doctor --fix` را اجرا کنید تا فایل‌های قدیمی `~/.openclaw/cron/jobs.json`، `jobs-state.json` و `runs/*.jsonl` به SQLite وارد شوند و با پسوند `.migrated` تغییر نام دهند. ردیف‌های کارِ بدشکل از زمان اجرا نادیده گرفته می‌شوند و برای تعمیر یا بازبینی بعدی در `jobs-quarantine.json` کپی می‌شوند.
- `cron.store` همچنان کلید منطقی ذخیره‌گاه Cron و مسیر ورود doctor را نام‌گذاری می‌کند. پس از ورود، ویرایش آن فایل JSON دیگر کارهای فعال Cron را تغییر نمی‌دهد؛ به‌جای آن از `openclaw cron add|edit|remove` یا روش‌های RPC کرون Gateway استفاده کنید.
- همه اجراهای Cron رکوردهای [وظیفه پس‌زمینه](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام راه‌اندازی Gateway، کارهای نوبت عامل ایزوله که موعدشان گذشته است، به‌جای بازپخش فوری، به بیرون از پنجره اتصال کانال زمان‌بندی دوباره می‌شوند تا راه‌اندازی Discord/Telegram و تنظیم فرمان‌های بومی پس از راه‌اندازی دوباره پاسخ‌گو بماند.
- کارهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت به‌صورت خودکار حذف می‌شوند.
- اجراهای ایزوله Cron هنگام تکمیل اجرا، با بهترین تلاش زبانه‌ها/فرایندهای مرورگر ردیابی‌شده برای نشست `cron:<jobId>` خود را می‌بندند تا خودکارسازی مرورگرِ جداشده فرایندهای یتیم باقی نگذارد.
- اجراهای ایزوله Cron که مجوز محدود خودپاک‌سازی Cron را دریافت می‌کنند، همچنان می‌توانند وضعیت زمان‌بند، فهرست خودفیلترشده‌ای از کار فعلی خود و تاریخچه اجرای همان کار را بخوانند؛ بنابراین بررسی‌های وضعیت/Heartbeat می‌توانند بدون به‌دست‌آوردن دسترسی گسترده‌تر به تغییر Cron، زمان‌بندی خود را بررسی کنند.
- اجراهای ایزوله Cron همچنین در برابر پاسخ‌های تأیید قدیمی محافظت می‌کنند. اگر نخستین نتیجه فقط یک به‌روزرسانی وضعیت موقت باشد (`on it`، `pulling everything together` و اشاره‌های مشابه) و هیچ اجرای زیرعاملِ فرزند هنوز مسئول پاسخ نهایی نباشد، OpenClaw پیش از تحویل، یک‌بار دیگر برای نتیجه واقعی درخواست می‌کند.
- اجراهای ایزوله Cron از فراداده ساخت‌یافته منع اجرا از اجرای توکار استفاده می‌کنند، از جمله پوشش‌های node-host با `UNAVAILABLE` که پیام خطای تو در توی آن‌ها با `SYSTEM_RUN_DENIED` یا `INVALID_REQUEST` آغاز می‌شود؛ بنابراین یک فرمان مسدودشده به‌عنوان اجرای سبز گزارش نمی‌شود، در حالی که نثر معمول دستیار به‌عنوان منع اجرا تلقی نمی‌شود.
- اجراهای ایزوله Cron همچنین خرابی‌های سطح اجرای عامل را حتی وقتی هیچ محتوای پاسخی تولید نمی‌شود، خطای کار در نظر می‌گیرند؛ بنابراین خرابی‌های مدل/ارائه‌دهنده شمارنده‌های خطا را افزایش می‌دهند و اعلان‌های شکست را فعال می‌کنند، به‌جای اینکه کار را موفق پاک کنند.
- وقتی یک کار نوبت عامل ایزوله به `timeoutSeconds` می‌رسد، Cron اجرای عامل زیرین را لغو می‌کند و یک پنجره کوتاه پاک‌سازی به آن می‌دهد. اگر اجرا تخلیه نشود، پاک‌سازی متعلق به Gateway پیش از اینکه Cron timeout را ثبت کند مالکیت نشست آن اجرا را با اجبار پاک می‌کند، تا کار چت صف‌شده پشت یک نشست پردازشی قدیمی باقی نماند.
- اگر یک نوبت عامل ایزوله پیش از شروع اجراکننده یا پیش از نخستین فراخوانی مدل متوقف شود، Cron یک timeout ویژه مرحله ثبت می‌کند، مانند `setup timed out before runner start` یا `stalled before first model call (last phase: context-engine)`. این نگهبان‌ها ارائه‌دهنده‌های توکار و ارائه‌دهنده‌های مبتنی بر CLI را پیش از آنکه فرایند CLI خارجی آن‌ها واقعاً شروع شود پوشش می‌دهند و مستقل از مقدارهای طولانی `timeoutSeconds` محدود می‌شوند تا خرابی‌های شروع سرد/احراز هویت/زمینه سریع آشکار شوند، نه اینکه تا کل بودجه کار منتظر بمانند.
- اگر از cron سیستم یا زمان‌بند خارجی دیگری برای اجرای `openclaw agent` استفاده می‌کنید، آن را با یک تشدید hard-kill بپیچید، حتی اگر CLI با `SIGTERM`/`SIGINT` کار می‌کند. اجراهای پشتیبانی‌شده با Gateway از Gateway می‌خواهند اجراهای پذیرفته‌شده را لغو کند؛ اجراهای محلی و fallback توکار همان سیگنال لغو را دریافت می‌کنند. برای GNU `timeout`، به‌جای `timeout 600 ...` ساده، `timeout -k 60 600 openclaw agent ...` را ترجیح دهید؛ مقدار `-k` پشتیبان ناظر است اگر فرایند نتواند تخلیه شود. برای واحدهای systemd، همین شکل را با استفاده از سیگنال توقف `SIGTERM` به‌همراه یک پنجره مهلت مانند `TimeoutStopSec` پیش از هر kill نهایی حفظ کنید. اگر یک تلاش دوباره در حالی از `--run-id` استفاده مجدد کند که اجرای Gateway اصلی هنوز فعال است، مورد تکراری به‌جای شروع اجرای دوم، در حال اجرا گزارش می‌شود.

<a id="maintenance"></a>

<Note>
همگام‌سازی وظیفه برای Cron ابتدا متعلق به زمان اجرا است و در مرحله بعد به تاریخچه پایدار تکیه دارد: یک وظیفه فعال Cron تا وقتی زمان اجرای Cron هنوز آن کار را در حال اجرا ردیابی می‌کند زنده می‌ماند، حتی اگر یک ردیف نشست فرزند قدیمی هنوز وجود داشته باشد. وقتی زمان اجرا دیگر مالک کار نباشد و پنجره مهلت ۵ دقیقه‌ای منقضی شود، نگهداشت، گزارش‌های اجرای ماندگار و وضعیت کار را برای اجرای مطابق `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن تاریخچه پایدار یک نتیجه پایانی نشان دهد، دفتر وظیفه از روی آن نهایی می‌شود؛ در غیر این صورت نگهداشت متعلق به Gateway می‌تواند وظیفه را `lost` علامت‌گذاری کند. ممیزی CLI آفلاین می‌تواند از تاریخچه پایدار بازیابی کند، اما مجموعه خالی کارهای فعال درون‌فرایندی خودش را به‌عنوان اثبات از بین رفتن یک اجرای Cron متعلق به Gateway تلقی نمی‌کند.
</Note>

## نوع‌های زمان‌بندی

| نوع | پرچم CLI | توضیح |
| ------- | --------- | ------------------------------------------------------- |
| `at` | `--at` | مُهر زمانی یک‌باره (ISO 8601 یا نسبی مانند `20m`) |
| `every` | `--every` | بازه ثابت |
| `cron` | `--cron` | عبارت Cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری |

مُهرهای زمانی بدون منطقه زمانی به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی با ساعت محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشونده ابتدای ساعت به‌طور خودکار تا ۵ دقیقه پخش می‌شوند تا جهش‌های بار کاهش یابد. برای اجبار زمان‌بندی دقیق از `--exact` یا برای یک پنجره صریح از `--stagger 30s` استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) تجزیه می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته غیر wildcard باشند، croner زمانی تطبیق می‌دهد که **هرکدام** از فیلدها تطبیق داشته باشند، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این حالت به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw در اینجا از رفتار OR پیش‌فرض Croner استفاده می‌کند. برای الزام هر دو شرط، از اصلاح‌گر روز هفته `+` در Croner استفاده کنید (`0 9 15 * +1`) یا روی یک فیلد زمان‌بندی کنید و فیلد دیگر را در prompt یا فرمان کار خود guard کنید.

## سبک‌های اجرا

| سبک | مقدار `--session` | اجرا در | بهترین کاربرد |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| نشست اصلی | `main` | مسیر بیدارسازی اختصاصی Cron | یادآورها، رویدادهای سیستم |
| ایزوله | `isolated` | `cron:<jobId>` اختصاصی | گزارش‌ها، کارهای پس‌زمینه |
| نشست فعلی | `current` | متصل در زمان ایجاد | کار تکرارشونده آگاه از زمینه |
| نشست سفارشی | `session:custom-id` | نشست نام‌دار ماندگار | گردش‌کارهایی که بر تاریخچه بنا می‌شوند |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    کارهای **نشست اصلی** یک رویداد سیستم را در مسیر اجرای متعلق به Cron صف می‌کنند و به‌صورت اختیاری Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن‌ها می‌توانند از آخرین زمینه تحویل نشست اصلی هدف برای پاسخ‌ها استفاده کنند، اما نوبت‌های معمول Cron را به مسیر چت انسانی اضافه نمی‌کنند و تازگی بازنشانی روزانه/بیکاری را برای نشست هدف تمدید نمی‌کنند. کارهای **ایزوله** یک نوبت عامل اختصاصی را با یک نشست تازه اجرا می‌کنند. **نشست‌های سفارشی** (`session:xxx`) زمینه را میان اجراها ماندگار می‌کنند و گردش‌کارهایی مانند standupهای روزانه را ممکن می‌کنند که بر خلاصه‌های قبلی بنا می‌شوند.

    رویدادهای Cron نشست اصلی، یادآورهای رویداد سیستم خودبسنده هستند. آن‌ها
    به‌طور خودکار دستور «Read HEARTBEAT.md» از prompt پیش‌فرض Heartbeat را شامل
    نمی‌شوند. اگر یک یادآور تکرارشونده باید به `HEARTBEAT.md` مراجعه کند،
    این را به‌صراحت در متن رویداد Cron یا در دستورالعمل‌های خود عامل بگویید.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    برای کارهای ایزوله، «نشست تازه» یعنی یک شناسه transcript/نشست جدید برای هر اجرا. OpenClaw ممکن است ترجیح‌های امنی مانند تنظیمات thinking/fast/verbose، برچسب‌ها و overrideهای صریح مدل/احراز هویت انتخاب‌شده توسط کاربر را حمل کند، اما زمینه گفت‌وگوی محیطی را از یک ردیف قدیمی Cron به ارث نمی‌برد: مسیریابی کانال/گروه، سیاست ارسال یا صف، ارتقا، origin، یا اتصال زمان اجرای ACP. وقتی یک کار تکرارشونده باید عمداً بر همان زمینه گفت‌وگو بنا شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="Runtime cleanup">
    برای کارهای ایزوله، teardown زمان اجرا اکنون شامل پاک‌سازی مرورگر با بهترین تلاش برای آن نشست Cron است. خرابی‌های پاک‌سازی نادیده گرفته می‌شوند تا نتیجه واقعی Cron همچنان غالب باشد.

    اجراهای ایزوله Cron همچنین هر نمونه زمان اجرای MCP همراه را که برای کار ساخته شده است، از مسیر مشترک پاک‌سازی زمان اجرا dispose می‌کنند. این با teardown کلاینت‌های MCP نشست اصلی و نشست سفارشی هم‌خوان است، بنابراین کارهای ایزوله Cron فرایندهای فرزند stdio یا اتصال‌های MCP بلندمدت را میان اجراها نشت نمی‌دهند.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    وقتی اجراهای ایزوله Cron زیرعامل‌ها را هماهنگ می‌کنند، تحویل نیز خروجی نهایی فرزند را به متن موقت قدیمی والد ترجیح می‌دهد. اگر فرزندها هنوز در حال اجرا باشند، OpenClaw به‌جای اعلام آن، آن به‌روزرسانی جزئی والد را سرکوب می‌کند.

    برای هدف‌های اعلام Discord فقط متنی، OpenClaw متن نهایی استاندارد دستیار را یک‌بار ارسال می‌کند، به‌جای اینکه هم payloadهای متنی stream‌شده/میانی و هم پاسخ نهایی را بازپخش کند. رسانه و payloadهای ساخت‌یافته Discord همچنان به‌عنوان payloadهای جداگانه تحویل داده می‌شوند تا پیوست‌ها و مؤلفه‌ها حذف نشوند.

  </Accordion>
</AccordionGroup>

### payloadهای فرمان

از payloadهای فرمان برای اسکریپت‌های قطعی استفاده کنید که باید داخل زمان‌بند Gateway بدون شروع نوبت عامل ایزوله پشتیبانی‌شده با مدل اجرا شوند. کارهای فرمان روی میزبان Gateway اجرا می‌شوند، stdout/stderr را ضبط می‌کنند، اجرا را در تاریخچه Cron ثبت می‌کنند و همان حالت‌های تحویل `announce`، `webhook` و `none` را مانند کارهای ایزوله دوباره استفاده می‌کنند.

<Note>
Cron فرمان یک سطح خودکارسازی operator-admin در Gateway است، نه یک فراخوانی
`tools.exec` عامل. ایجاد، به‌روزرسانی، حذف یا اجرای دستی کارهای Cron
به `operator.admin` نیاز دارد؛ اجراهای فرمان زمان‌بندی‌شده بعداً داخل فرایند
Gateway به‌عنوان همان خودکارسازی نوشته‌شده توسط admin اجرا می‌شوند. سیاست exec عامل مانند
`tools.exec.mode`، درخواست‌های تأیید و allowlistهای ابزار به‌ازای هر عامل،
ابزارهای exec قابل مشاهده برای مدل را کنترل می‌کند، نه payloadهای Cron فرمان.
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

`--command <shell>` مقدار `argv: ["sh", "-lc", <shell>]` را ذخیره می‌کند. وقتی اجرای argv دقیق بدون تجزیه shell می‌خواهید، از `--command-argv '["node","scripts/report.mjs"]'` استفاده کنید. فیلدهای اختیاری `--command-env KEY=VALUE`، `--command-input`، `--timeout-seconds`، `--no-output-timeout-seconds` و `--output-max-bytes` محیط فرایند، stdin و مرزهای خروجی را کنترل می‌کنند.

اگر stdout خالی نباشد، همان متن نتیجه تحویل‌داده‌شده است. اگر stdout خالی و stderr غیرخالی باشد، stderr تحویل داده می‌شود. اگر هر دو جریان وجود داشته باشند، cron یک بلوک کوچک `stdout:` / `stderr:` تحویل می‌دهد. کد خروج صفر، اجرا را به‌صورت `ok` ثبت می‌کند؛ خروج غیرصفر، سیگنال، timeout، یا timeout بدون خروجی، `error` ثبت می‌کند و می‌تواند هشدارهای شکست را فعال کند. فرمانی که فقط `NO_REPLY` چاپ کند از سرکوب عادی توکن سکوت cron استفاده می‌کند و چیزی به چت ارسال نمی‌کند.

### گزینه‌های payload برای کارهای ایزوله

<ParamField path="--message" type="string" required>
  متن prompt (برای ایزوله الزامی است).
</ParamField>
<ParamField path="--model" type="string">
  بازنویسی model؛ از model مجاز انتخاب‌شده برای کار استفاده می‌کند.
</ParamField>
<ParamField path="--fallbacks" type="string">
  فهرست fallback model برای هر کار، برای مثال `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. برای اجرای سخت‌گیرانه بدون fallback، `--fallbacks ""` را ارسال کنید.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  در `cron edit`، بازنویسی fallback مربوط به هر کار را حذف می‌کند تا کار از تقدم fallback پیکربندی‌شده پیروی کند. نمی‌توان آن را با `--fallbacks` ترکیب کرد.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  در `cron edit`، بازنویسی model مربوط به هر کار را حذف می‌کند تا کار از تقدم عادی انتخاب model در cron پیروی کند (اگر بازنویسی ذخیره‌شده cron-session تنظیم شده باشد همان، وگرنه model عامل/پیش‌فرض). نمی‌توان آن را با `--model` ترکیب کرد.
</ParamField>
<ParamField path="--thinking" type="string">
  بازنویسی سطح thinking.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  در `cron edit`، بازنویسی thinking مربوط به هر کار را حذف می‌کند تا کار از تقدم عادی thinking در cron پیروی کند. نمی‌توان آن را با `--thinking` ترکیب کرد.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تزریق فایل bootstrap فضای کاری را رد می‌کند.
</ParamField>
<ParamField path="--tools" type="string">
  ابزارهایی را که کار می‌تواند استفاده کند محدود می‌کند، برای مثال `--tools exec,read`.
</ParamField>

`--model` از model مجاز انتخاب‌شده به‌عنوان model اصلی همان کار استفاده می‌کند. این با بازنویسی `/model` در chat-session یکسان نیست: زنجیره‌های fallback پیکربندی‌شده همچنان وقتی model اصلی کار شکست بخورد اعمال می‌شوند. اگر model درخواست‌شده مجاز نباشد یا قابل resolve نباشد، cron به‌جای fallback بی‌صدا به انتخاب model عامل/پیش‌فرض کار، اجرا را با خطای اعتبارسنجی صریح شکست می‌دهد.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. وقتی وجود داشته باشد، آن فهرست جایگزین زنجیره fallback پیکربندی‌شده برای کار می‌شود. وقتی می‌خواهید یک اجرای cron سخت‌گیرانه داشته باشید که فقط model انتخاب‌شده را امتحان کند، در payload/API کار از `fallbacks: []` استفاده کنید. اگر کاری `--model` داشته باشد اما نه fallback در payload و نه fallback پیکربندی‌شده، OpenClaw یک بازنویسی fallback خالی صریح ارسال می‌کند تا model اصلی عامل به‌عنوان هدف تلاش مجدد پنهان اضافه نشود.

بررسی‌های preflight برای local-provider، قبل از علامت‌گذاری اجرای cron به‌عنوان `skipped`، fallbackهای پیکربندی‌شده را پیمایش می‌کنند؛ `fallbacks: []` این مسیر preflight را سخت‌گیرانه نگه می‌دارد.

تقدم انتخاب model برای کارهای ایزوله چنین است:

1. بازنویسی model در hook Gmail (وقتی اجرا از Gmail آمده باشد و آن بازنویسی مجاز باشد)
2. `model` در payload هر کار
3. بازنویسی ذخیره‌شده model در cron session انتخاب‌شده توسط کاربر
4. انتخاب model عامل/پیش‌فرض

حالت سریع نیز از انتخاب زنده resolve‌شده پیروی می‌کند. اگر پیکربندی model انتخاب‌شده `params.fastMode` داشته باشد، cron ایزوله به‌طور پیش‌فرض از آن استفاده می‌کند. بازنویسی `fastMode` در session ذخیره‌شده همچنان در هر دو جهت بر پیکربندی غالب است. حالت خودکار، وقتی موجود باشد، از آستانه `params.fastAutoOnSeconds` model انتخاب‌شده استفاده می‌کند و مقدار پیش‌فرض آن ۶۰ ثانیه است.

اگر یک اجرای ایزوله به handoff تغییر model زنده برسد، cron با provider/model تغییریافته دوباره تلاش می‌کند و پیش از تلاش مجدد، آن انتخاب زنده را برای اجرای فعال پایدار می‌کند. وقتی تغییر همچنین یک auth profile جدید داشته باشد، cron بازنویسی همان auth profile را نیز برای اجرای فعال پایدار می‌کند. تلاش‌های مجدد محدود هستند: پس از تلاش اولیه به‌علاوه ۲ تلاش مجدد تغییر، cron به‌جای حلقه بی‌پایان متوقف می‌شود.

پیش از آنکه یک اجرای cron ایزوله وارد agent runner شود، OpenClaw endpointهای local provider قابل‌دسترسی را برای providerهای پیکربندی‌شده `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها loopback، شبکه خصوصی، یا `.local` است بررسی می‌کند. اگر آن endpoint پایین باشد، اجرا به‌جای شروع فراخوانی model، به‌صورت `skipped` با خطای روشن provider/model ثبت می‌شود. نتیجه endpoint به‌مدت ۵ دقیقه cache می‌شود، بنابراین بسیاری از کارهای سررسیدشده که از همان سرور محلی ازکارافتاده Ollama، vLLM، SGLang، یا LM Studio استفاده می‌کنند به‌جای ایجاد طوفان درخواست، یک probe کوچک مشترک دارند. اجراهای provider-preflight ردشده، backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های رد شدن تکراری می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | اتفاقی که می‌افتد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر عامل ارسال نکرده باشد، متن نهایی را با fallback به مقصد تحویل می‌دهد |
| `webhook`  | payload رویداد پایان‌یافته را به یک URL POST می‌کند                                |
| `none`     | تحویل fallback در runner انجام نمی‌شود                                         |

برای تحویل به کانال از `--announce --channel telegram --to "-1001234567890"` استفاده کنید. برای topicهای forum در Telegram، از `-1001234567890:topic:123` استفاده کنید؛ OpenClaw همچنین shorthand متعلق به Telegram یعنی `-1001234567890:123` را می‌پذیرد. فراخوان‌های مستقیم RPC/config می‌توانند `delivery.threadId` را به‌صورت string یا number ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های room در Matrix به حروف بزرگ و کوچک حساس هستند؛ از شناسه دقیق room یا فرم `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل announce از `channel: "last"` استفاده کند یا `channel` را حذف کند، یک مقصد دارای پیشوند provider مانند `telegram:123` می‌تواند پیش از fallback cron به تاریخچه session یا یک کانال پیکربندی‌شده، کانال را انتخاب کند. فقط پیشوندهایی که توسط Plugin بارگذاری‌شده اعلام شده‌اند selectorهای provider هستند. اگر `delivery.channel` صریح باشد، پیشوند مقصد باید همان provider را نام ببرد؛ برای مثال، `channel: "whatsapp"` با `to: "telegram:123"` رد می‌شود، به‌جای اینکه اجازه دهد WhatsApp شناسه Telegram را به‌عنوان شماره تلفن تفسیر کند. پیشوندهای نوع مقصد و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>`، و `sms:<number>` همچنان syntax مقصد متعلق به کانال هستند، نه selectorهای provider.

برای کارهای ایزوله، تحویل چت مشترک است. اگر مسیر چت در دسترس باشد، عامل می‌تواند حتی وقتی کار از `--no-deliver` استفاده می‌کند از ابزار `message` استفاده کند. اگر عامل به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلام fallback را رد می‌کند. در غیر این صورت `announce`، `webhook`، و `none` فقط کنترل می‌کنند runner پس از نوبت عامل با پاسخ نهایی چه کند.

وقتی عامل از یک چت فعال یک یادآور ایزوله ایجاد می‌کند، OpenClaw مقصد تحویل زنده حفظ‌شده را برای مسیر اعلام fallback ذخیره می‌کند. کلیدهای داخلی session ممکن است lowercase باشند؛ وقتی context فعلی چت در دسترس است، مقصدهای تحویل provider از آن کلیدها بازسازی نمی‌شوند.

تحویل announce ضمنی از allowlistهای کانال پیکربندی‌شده برای اعتبارسنجی و مسیریابی دوباره مقصدهای stale استفاده می‌کند. تأییدهای pairing-store در DM دریافت‌کننده‌های اتوماسیون fallback نیستند؛ وقتی یک کار زمان‌بندی‌شده باید فعالانه به DM ارسال کند، `delivery.to` را تنظیم کنید یا ورودی `allowFrom` کانال را پیکربندی کنید.

## زبان خروجی

کارهای Cron زبان پاسخ را از کانال، locale، یا پیام‌های قبلی استنباط نمی‌کنند. قانون زبان را در پیام یا template زمان‌بندی‌شده قرار دهید:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

برای فایل‌های template، دستور زبان را در prompt رندرشده نگه دارید و پیش از اجرای کار، بررسی کنید placeholderهایی مانند `{{language}}` پر شده باشند. اگر خروجی زبان‌ها را مخلوط می‌کند، قانون را صریح کنید، برای مثال: "Use Chinese for narrative text and keep technical terms in English."

اعلان‌های شکست از مسیر مقصد جداگانه‌ای پیروی می‌کنند:

- `cron.failureDestination` یک پیش‌فرض سراسری برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و کار از قبل از طریق `announce` تحویل دهد، اعلان‌های شکست اکنون به همان مقصد اصلی announce fallback می‌کنند.
- `delivery.failureDestination` فقط روی کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار سراسری cron را وارد هشدارهای تکراری اجرای ردشده می‌کند. اجراهای ردشده شمارنده skip متوالی جداگانه‌ای نگه می‌دارند، بنابراین بر backoff خطای اجرا اثر نمی‌گذارند.

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
  <Tab title="کار ایزوله تکرارشونده">
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
  <Tab title="بازنویسی model و thinking">
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

Gateway می‌تواند endpointهای HTTP Webhook را برای triggerهای خارجی expose کند. در config فعال کنید:

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

هر درخواست باید token hook را از طریق header شامل شود:

- `Authorization: Bearer <token>` (توصیه‌شده)
- `x-openclaw-token: <token>`

tokenهای query-string رد می‌شوند.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    یک رویداد سیستم را برای session اصلی در صف می‌گذارد:

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
    یک نوبت عامل ایزوله را اجرا می‌کند:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    فیلدها: `message` (الزامی)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="hookهای نگاشت‌شده (POST /hooks/<name>)">
    نام‌های hook سفارشی از طریق `hooks.mappings` در config resolve می‌شوند. نگاشت‌ها می‌توانند payloadهای دلخواه را با templateها یا تبدیل‌های کد به actionهای `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
endpointهای hook را پشت loopback، tailnet، یا reverse proxy قابل‌اعتماد نگه دارید.

- از یک توکن اختصاصی برای hook استفاده کنید؛ توکن‌های احراز هویت Gateway را دوباره به‌کار نبرید.
- `hooks.path` را روی یک زیرمسیر اختصاصی نگه دارید؛ `/` رد می‌شود.
- برای محدود کردن اینکه یک hook کدام عامل مؤثر را می‌تواند هدف بگیرد، `hooks.allowedAgentIds` را تنظیم کنید؛ از جمله عامل پیش‌فرض وقتی `agentId` حذف شده است.
- مگر اینکه به جلسه‌های انتخاب‌شده توسط فراخواننده نیاز دارید، `hooks.allowRequestSessionKey=false` را نگه دارید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را هم تنظیم کنید تا شکل‌های مجاز کلید جلسه محدود شوند.
- payloadهای hook به‌طور پیش‌فرض با مرزهای ایمنی بسته‌بندی می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

تریگرهای صندوق ورودی Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** `gcloud` CLI، `gog` (gogcli)، فعال بودن hookهای OpenClaw، Tailscale برای نقطه پایانی عمومی HTTPS.
</Note>

### راه‌اندازی با ویزارد (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این دستور پیکربندی `hooks.gmail` را می‌نویسد، preset مربوط به Gmail را فعال می‌کند، و از Tailscale Funnel برای نقطه پایانی push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` باشد و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام راه‌اندازی `gog gmail watch serve` را شروع می‌کند و watch را خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="انتخاب پروژه GCP">
    پروژه GCP مالک OAuth client استفاده‌شده توسط `gog` را انتخاب کنید:

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
  <Step title="شروع watch">
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

`openclaw cron run <jobId>` پس از در صف گذاشتن اجرای دستی برمی‌گردد. برای hookهای خاموش‌سازی، اسکریپت‌های نگه‌داری، یا خودکارسازی‌های دیگری که باید تا پایان اجرای صف‌شده مسدود بمانند، از `--wait` استفاده کنید. حالت انتظار دقیقاً همان `runId` برگشتی را poll می‌کند؛ برای وضعیت `ok` با `0` خارج می‌شود و برای `error`، `skipped`، یا timeout انتظار با مقدار غیرصفر خارج می‌شود.

ابزار عامل `cron` از `cron(action: "list")` خلاصه‌های فشرده jobها (`id`، `name`، `enabled`، `nextRunAtMs`، `scheduleKind`، `lastRunStatus`) را برمی‌گرداند؛ برای تعریف کامل یک job از `cron(action: "get", jobId: "...")` استفاده کنید. فراخواننده‌های مستقیم Gateway می‌توانند `compact: true` را به `cron.list` بدهند؛ حذف آن پاسخ کامل موجود همراه با پیش‌نمایش‌های تحویل را حفظ می‌کند.

`openclaw cron create` نام مستعار `openclaw cron add` است، و jobهای جدید می‌توانند از یک زمان‌بندی positional (`"0 9 * * 1"`، `"every 1h"`، `"20m"`، یا یک timestamp با قالب ISO) و سپس یک prompt عامل به‌صورت positional استفاده کنند. برای POST کردن payload اجرای تمام‌شده به یک نقطه پایانی HTTP، از `--webhook <url>` روی `cron add|create` یا `cron edit` استفاده کنید. تحویل Webhook را نمی‌توان با flagهای تحویل chat مانند `--announce`، `--channel`، `--to`، `--thread-id`، یا `--account` ترکیب کرد. در `cron edit`، گزینه‌های `--clear-channel`، `--clear-to`، `--clear-thread-id`، و `--clear-account` این فیلدهای مسیریابی را جداگانه unset می‌کنند (هرکدام در کنار flag تنظیم متناظر خود رد می‌شود)، که با غیرفعال کردن تحویل fallback runner توسط `--no-deliver` متفاوت است.

<Note>
نکته بازنویسی مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شده job را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان provider/model دقیق به اجرای عامل ایزوله می‌رسد.
- اگر مجاز نباشد یا resolve نشود، cron اجرا را با یک خطای validation صریح ناموفق می‌کند.
- patchهای payload در API `cron.update` می‌توانند برای پاک کردن بازنویسی مدل ذخیره‌شده job، `model: null` را تنظیم کنند.
- `openclaw cron edit <job-id> --clear-model` این بازنویسی را از CLI پاک می‌کند (همان اثر patch با `model: null`) و نمی‌تواند با `--model` ترکیب شود.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در cron مدل اصلی job است، نه بازنویسی `/model` جلسه.
- `openclaw cron add|edit --fallbacks ...` مقدار `fallbacks` در payload را تنظیم می‌کند و fallbackهای پیکربندی‌شده برای آن job را جایگزین می‌کند؛ `--fallbacks ""` fallback را غیرفعال می‌کند و اجرا را سخت‌گیرانه می‌سازد. `openclaw cron edit <job-id> --clear-fallbacks` بازنویسی مخصوص job را پاک می‌کند.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان هدف تلاش مجدد اضافی و خاموش به مدل اصلی عامل fall through نمی‌کند.

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

`maxConcurrentRuns` هم dispatch زمان‌بندی‌شده cron و هم اجرای نوبت عامل ایزوله را محدود می‌کند و مقدار پیش‌فرض آن 8 است. نوبت‌های عامل ایزوله cron در داخل از lane اجرای اختصاصی `cron-nested` صف استفاده می‌کنند، بنابراین افزایش این مقدار اجازه می‌دهد اجراهای مستقل LLM مربوط به cron به‌صورت موازی پیش بروند، به‌جای اینکه فقط wrapperهای بیرونی cron شروع شوند. lane مشترک غیر cron با نام `nested` با این تنظیم گسترش داده نمی‌شود.

`cron.store` یک کلید store منطقی و مسیر import قدیمی doctor است. برای import کردن storeهای JSON موجود به SQLite و آرشیو کردن آن‌ها، `openclaw doctor --fix` را اجرا کنید؛ تغییرهای آینده cron باید از طریق CLI یا API Gateway انجام شوند.

غیرفعال کردن cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="رفتار retry">
    **retry یک‌باره**: خطاهای گذرا (rate limit، overload، network، server error) تا 3 بار با backoff نمایی retry می‌شوند. خطاهای دائمی بلافاصله غیرفعال می‌شوند.

    **retry تکرارشونده**: backoff نمایی (30s تا 60m) بین retryها. backoff پس از اجرای موفق بعدی reset می‌شود.

  </Accordion>
  <Accordion title="نگه‌داری">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های جلسه اجرای ایزوله را هرس می‌کند. `cron.runLog.keepLines` تعداد ردیف‌های تاریخچه اجرای SQLite نگه‌داری‌شده به‌ازای هر job را محدود می‌کند؛ `maxBytes` برای سازگاری پیکربندی با run logهای قدیمی مبتنی بر فایل حفظ شده است.
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
  <Accordion title="Cron اجرا نمی‌شود">
    - `cron.enabled` و env var با نام `OPENCLAW_SKIP_CRON` را بررسی کنید.
    - تأیید کنید Gateway به‌طور پیوسته در حال اجراست.
    - برای زمان‌بندی‌های `cron`، timezone (`--tz`) را در برابر timezone میزبان بررسی کنید.
    - وجود `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و هنوز موعد job نرسیده بوده است.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویل انجام نشد">
    - حالت تحویل `none` یعنی ارسال fallback توسط runner انتظار نمی‌رود. عامل همچنان می‌تواند وقتی مسیر chat موجود است، مستقیماً با ابزار `message` ارسال کند.
    - نبودن یا نامعتبر بودن هدف تحویل (`channel`/`to`) یعنی outbound رد شده است.
    - برای Matrix، jobهای کپی‌شده یا قدیمی با شناسه‌های اتاق `delivery.to` که با حروف کوچک ذخیره شده‌اند ممکن است ناموفق شوند، چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند. job را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت channel (`unauthorized`، `Forbidden`) یعنی تحویل توسط credentials مسدود شده است.
    - اگر اجرای ایزوله فقط توکن خاموش (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل مستقیم outbound را سرکوب می‌کند و مسیر خلاصه صف‌شده fallback را هم سرکوب می‌کند، بنابراین چیزی به chat ارسال نمی‌شود.
    - اگر عامل باید خودش به کاربر پیام بدهد، بررسی کنید job یک مسیر قابل استفاده دارد (`channel: "last"` با یک chat قبلی، یا یک channel/target صریح).

  </Accordion>
  <Accordion title="به‌نظر می‌رسد Cron یا heartbeat مانع rollover سبک /new می‌شود">
    - تازگی reset روزانه و idle بر اساس `updatedAt` نیست؛ [مدیریت جلسه](/fa/concepts/session#session-lifecycle) را ببینید.
    - wakeupهای Cron، اجراهای heartbeat، اعلان‌های exec، و bookkeeping مربوط به gateway ممکن است ردیف جلسه را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی که پیش از وجود این فیلدها ایجاد شده‌اند، OpenClaw می‌تواند `sessionStartedAt` را از header جلسه transcript JSONL بازیابی کند، وقتی فایل هنوز در دسترس باشد. ردیف‌های idle قدیمی بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان baseline idle خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات مهم timezone">
    - Cron بدون `--tz` از timezone میزبان gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند.
    - Heartbeat `activeHours` از resolve شدن timezone پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [خودکارسازی](/fa/automation) — همه سازوکارهای خودکارسازی در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — دفتر job برای اجراهای cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای جلسه اصلی
- [Timezone](/fa/concepts/timezone) — پیکربندی timezone
