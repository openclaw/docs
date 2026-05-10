---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارسازی‌ها
    - اتصال تریگرهای خارجی (Webhookها، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhookها، و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-05-10T19:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. کارها را ماندگار می‌کند، عامل را در زمان مناسب بیدار می‌کند، و می‌تواند خروجی را دوباره به یک کانال چت یا نقطه پایانی Webhook تحویل دهد.

## شروع سریع

<Steps>
  <Step title="افزودن یک یادآور یک‌باره">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="بررسی کارهای شما">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="دیدن تاریخچه اجرا">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron چگونه کار می‌کند

- Cron **داخل فرایند Gateway** اجرا می‌شود (نه داخل مدل).
- تعریف‌های کار در `~/.openclaw/cron/jobs.json` ماندگار می‌شوند تا راه‌اندازی‌های مجدد زمان‌بندی‌ها را از دست ندهند.
- وضعیت اجرای زمان اجرا در کنار آن، در `~/.openclaw/cron/jobs-state.json` ماندگار می‌شود. اگر تعریف‌های Cron را در git پیگیری می‌کنید، `jobs.json` را پیگیری کنید و `jobs-state.json` را در gitignore بگذارید.
- پس از این جداسازی، نسخه‌های قدیمی‌تر OpenClaw می‌توانند `jobs.json` را بخوانند، اما ممکن است کارها را تازه در نظر بگیرند چون فیلدهای زمان اجرا اکنون در `jobs-state.json` قرار دارند.
- وقتی `jobs.json` در حالی ویرایش می‌شود که Gateway در حال اجراست یا متوقف است، OpenClaw فیلدهای زمان‌بندی تغییرکرده را با فراداده شکاف زمان اجرای در انتظار مقایسه می‌کند و مقدارهای کهنه `nextRunAtMs` را پاک می‌کند. بازنویسی‌هایی که فقط قالب‌بندی یا ترتیب کلیدها را تغییر می‌دهند، شکاف در انتظار را حفظ می‌کنند.
- همه اجراهای Cron رکوردهای [وظیفه پس‌زمینه](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام راه‌اندازی Gateway، کارهای نوبت عامل ایزوله که موعدشان گذشته است به‌جای پخش مجدد فوری، بیرون از پنجره اتصال کانال دوباره زمان‌بندی می‌شوند، تا راه‌اندازی Discord/Telegram و تنظیم فرمان‌های بومی پس از راه‌اندازی مجدد پاسخ‌گو بماند.
- کارهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت خودکار حذف می‌شوند.
- اجراهای ایزوله Cron با بهترین تلاش، زبانه‌ها/فرایندهای مرورگر پیگیری‌شده را برای نشست `cron:<jobId>` خود هنگام تکمیل اجرا می‌بندند، تا خودکارسازی جداشده مرورگر فرایندهای یتیم باقی نگذارد.
- اجراهای ایزوله Cron که مجوز محدود خودپاک‌سازی Cron را دریافت می‌کنند همچنان می‌توانند وضعیت زمان‌بند، فهرست خودفیلترشده‌ای از کار فعلی خود، و تاریخچه اجرای همان کار را بخوانند، بنابراین بررسی‌های وضعیت/Heartbeat می‌توانند بدون به‌دست‌آوردن دسترسی گسترده‌تر برای تغییر Cron، زمان‌بندی خودشان را بررسی کنند.
- اجراهای ایزوله Cron همچنین در برابر پاسخ‌های تأیید کهنه محافظت می‌کنند. اگر نتیجه اول فقط یک به‌روزرسانی موقت وضعیت باشد (`on it`، `pulling everything together`، و نشانه‌های مشابه) و هیچ اجرای زیرعامل فرزند هنوز مسئول پاسخ نهایی نباشد، OpenClaw پیش از تحویل، یک‌بار دیگر برای نتیجه واقعی درخواست می‌دهد.
- اجراهای ایزوله Cron ابتدا فراداده ساختاریافته انکار اجرا را از اجرای جاسازی‌شده ترجیح می‌دهند، سپس به نشانگرهای شناخته‌شده خلاصه/خروجی نهایی مانند `SYSTEM_RUN_DENIED` و `INVALID_REQUEST` بازمی‌گردند، تا یک فرمان مسدودشده به‌عنوان اجرای سبز گزارش نشود.
- اجراهای ایزوله Cron همچنین شکست‌های عامل در سطح اجرا را حتی وقتی هیچ بار پاسخ تولید نشده باشد به‌عنوان خطاهای کار در نظر می‌گیرند، بنابراین شکست‌های مدل/ارائه‌دهنده شمارنده‌های خطا را افزایش می‌دهند و به‌جای پاک‌کردن کار به‌عنوان موفق، اعلان‌های شکست را فعال می‌کنند.
- وقتی یک کار نوبت عامل ایزوله به `timeoutSeconds` می‌رسد، Cron اجرای عامل زیربنایی را لغو می‌کند و یک پنجره کوتاه پاک‌سازی به آن می‌دهد. اگر اجرا تخلیه نشود، پاک‌سازی تحت مالکیت Gateway پیش از آنکه Cron وقفه زمانی را ثبت کند مالکیت نشست آن اجرا را به‌اجبار پاک می‌کند، تا کار چت صف‌شده پشت یک نشست پردازش کهنه باقی نماند.
- اگر یک نوبت عامل ایزوله پیش از شروع اجراکننده یا پیش از نخستین فراخوانی مدل متوقف شود، Cron یک وقفه زمانی ویژه مرحله مانند `setup timed out before runner start` یا `stalled before first model call (last phase: context-engine)` ثبت می‌کند. این ناظرها ارائه‌دهندگان جاسازی‌شده و ارائه‌دهندگان متکی به CLI را پیش از آنکه فرایند CLI خارجی آن‌ها واقعاً شروع شود پوشش می‌دهند، و مستقل از مقدارهای طولانی `timeoutSeconds` محدود می‌شوند تا شکست‌های شروع سرد/احراز هویت/زمینه به‌جای انتظار برای کل بودجه کار، سریع آشکار شوند.

<a id="maintenance"></a>

<Note>
سازگارسازی وظیفه برای Cron در درجه نخست تحت مالکیت زمان اجراست و در درجه دوم بر تاریخچه پایدار تکیه دارد: یک وظیفه فعال Cron تا زمانی زنده می‌ماند که زمان اجرای Cron هنوز آن کار را در حال اجرا پیگیری کند، حتی اگر یک ردیف نشست فرزند قدیمی همچنان وجود داشته باشد. وقتی زمان اجرا دیگر مالک کار نباشد و پنجره ارفاق ۵ دقیقه‌ای منقضی شود، نگه‌داری، گزارش‌های اجرای ماندگار و وضعیت کار را برای اجرای متناظر `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن تاریخچه پایدار یک نتیجه نهایی نشان دهد، دفتر وظیفه از آن نهایی می‌شود؛ در غیر این صورت نگه‌داری تحت مالکیت Gateway می‌تواند وظیفه را `lost` علامت‌گذاری کند. حسابرسی CLI آفلاین می‌تواند از تاریخچه پایدار بازیابی کند، اما مجموعه خالی کارهای فعال درون‌فرایندی خودش را به‌عنوان اثبات از بین رفتن یک اجرای Cron تحت مالکیت Gateway در نظر نمی‌گیرد.
</Note>

## انواع زمان‌بندی

| نوع    | پرچم CLI  | توضیح                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | برچسب زمانی یک‌باره (ISO 8601 یا نسبی مانند `20m`)    |
| `every` | `--every` | بازه ثابت                                          |
| `cron`  | `--cron`  | عبارت Cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری |

برچسب‌های زمانی بدون منطقه زمانی به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی بر اساس ساعت دیواری محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشونده سرِ ساعت به‌طور خودکار تا ۵ دقیقه پخش می‌شوند تا جهش‌های بار کاهش یابد. برای اجبار زمان‌بندی دقیق از `--exact` یا برای یک پنجره صریح از `--stagger 30s` استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) تجزیه می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته غیر wildcard باشند، croner زمانی تطبیق می‌دهد که **یکی از** فیلدها تطبیق داشته باشد، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه فعال می‌شود. OpenClaw اینجا از رفتار پیش‌فرض OR در Croner استفاده می‌کند. برای الزام هر دو شرط، از اصلاح‌گر روز هفته `+` در Croner (`0 9 15 * +1`) استفاده کنید یا روی یک فیلد زمان‌بندی کنید و فیلد دیگر را در اعلان یا فرمان کار خود نگهبانی کنید.

## سبک‌های اجرا

| سبک           | مقدار `--session`   | اجرا می‌شود در                  | مناسب برای                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| نشست اصلی    | `main`              | نوبت بعدی Heartbeat      | یادآورها، رویدادهای سیستمی        |
| ایزوله        | `isolated`          | `cron:<jobId>` اختصاصی | گزارش‌ها، کارهای پس‌زمینه      |
| نشست فعلی | `current`           | متصل‌شده هنگام ایجاد   | کار تکرارشونده آگاه از زمینه    |
| نشست سفارشی  | `session:custom-id` | نشست نام‌دار ماندگار | گردش‌کارهایی که روی تاریخچه ساخته می‌شوند |

<AccordionGroup>
  <Accordion title="نشست اصلی در برابر ایزوله در برابر سفارشی">
    کارهای **نشست اصلی** یک رویداد سیستمی را در صف می‌گذارند و در صورت تمایل Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن رویدادهای سیستمی تازگی بازنشانی روزانه/بیکاری را برای نشست هدف تمدید نمی‌کنند. کارهای **ایزوله** یک نوبت عامل اختصاصی را با نشستی تازه اجرا می‌کنند. **نشست‌های سفارشی** (`session:xxx`) زمینه را بین اجراها ماندگار می‌کنند و گردش‌کارهایی مانند استندآپ‌های روزانه را که بر خلاصه‌های قبلی بنا می‌شوند ممکن می‌سازند.
  </Accordion>
  <Accordion title="«نشست تازه» برای کارهای ایزوله چه معنایی دارد">
    برای کارهای ایزوله، «نشست تازه» یعنی یک شناسه رونوشت/نشست جدید برای هر اجرا. OpenClaw ممکن است ترجیحات امنی مانند تنظیمات thinking/fast/verbose، برچسب‌ها، و بازنویسی‌های صریح مدل/احراز هویت انتخاب‌شده توسط کاربر را حمل کند، اما زمینه مکالمه محیطی را از یک ردیف قدیمی Cron به ارث نمی‌برد: مسیریابی کانال/گروه، سیاست ارسال یا صف، ارتقا، مبدأ، یا اتصال زمان اجرای ACP. وقتی یک کار تکرارشونده باید عمداً روی همان زمینه مکالمه ساخته شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="پاک‌سازی زمان اجرا">
    برای کارهای ایزوله، برچیدن زمان اجرا اکنون شامل پاک‌سازی مرورگر با بهترین تلاش برای آن نشست Cron است. شکست‌های پاک‌سازی نادیده گرفته می‌شوند تا نتیجه واقعی Cron همچنان اولویت داشته باشد.

    اجراهای ایزوله Cron همچنین هر نمونه زمان اجرای MCP بسته‌بندی‌شده را که برای کار ایجاد شده باشد، از مسیر مشترک پاک‌سازی زمان اجرا دور می‌اندازند. این با نحوه برچیدن کلاینت‌های MCP نشست اصلی و نشست سفارشی هم‌خوان است، بنابراین کارهای ایزوله Cron فرایندهای فرزند stdio یا اتصال‌های MCP بلندعمر را بین اجراها نشت نمی‌دهند.

  </Accordion>
  <Accordion title="تحویل زیرعامل و Discord">
    وقتی اجراهای ایزوله Cron زیرعامل‌ها را هماهنگ می‌کنند، تحویل همچنین خروجی نهایی فرزند را بر متن موقت کهنه والد ترجیح می‌دهد. اگر فرزندان هنوز در حال اجرا باشند، OpenClaw به‌جای اعلام آن، آن به‌روزرسانی جزئی والد را سرکوب می‌کند.

    برای هدف‌های اعلان Discord فقط‌متن، OpenClaw متن نهایی و مرجع‌دار دستیار را یک‌بار می‌فرستد، به‌جای اینکه هم بارهای متنی استریم‌شده/میانی و هم پاسخ نهایی را بازپخش کند. رسانه‌ها و بارهای ساختاریافته Discord همچنان به‌عنوان بارهای جداگانه تحویل داده می‌شوند تا پیوست‌ها و مؤلفه‌ها حذف نشوند.

  </Accordion>
</AccordionGroup>

### گزینه‌های بار برای کارهای ایزوله

<ParamField path="--message" type="string" required>
  متن اعلان (برای ایزوله الزامی است).
</ParamField>
<ParamField path="--model" type="string">
  بازنویسی مدل؛ از مدل مجاز انتخاب‌شده برای کار استفاده می‌کند.
</ParamField>
<ParamField path="--thinking" type="string">
  بازنویسی سطح Thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تزریق فایل راه‌اندازی فضای کاری را رد کن.
</ParamField>
<ParamField path="--tools" type="string">
  ابزارهایی را که کار می‌تواند استفاده کند محدود کن، برای مثال `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی آن کار استفاده می‌کند. این با بازنویسی `/model` نشست چت یکسان نیست: زنجیره‌های fallback پیکربندی‌شده همچنان وقتی مدل اصلی کار شکست بخورد اعمال می‌شوند. اگر مدل درخواست‌شده مجاز نباشد یا قابل حل نباشد، Cron به‌جای بازگشت بی‌صدا به انتخاب مدل عامل/پیش‌فرض کار، اجرا را با یک خطای اعتبارسنجی صریح ناموفق می‌کند.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح بار داشته باشند. وقتی وجود داشته باشد، آن فهرست زنجیره fallback پیکربندی‌شده را برای کار جایگزین می‌کند. وقتی یک اجرای سخت‌گیرانه Cron می‌خواهید که فقط مدل انتخاب‌شده را امتحان کند، در بار/API کار از `fallbacks: []` استفاده کنید. اگر کاری `--model` داشته باشد اما نه fallbackهای بار و نه fallbackهای پیکربندی‌شده داشته باشد، OpenClaw یک بازنویسی fallback خالی صریح می‌فرستد تا مدل اصلی عامل به‌عنوان هدف تلاش مجدد اضافی پنهان اضافه نشود.

اولویت انتخاب مدل برای کارهای ایزوله چنین است:

1. بازنویسی مدل hook در Gmail (وقتی اجرا از Gmail آمده باشد و آن بازنویسی مجاز باشد)
2. `model` در بار هر کار
3. بازنویسی مدل نشست ذخیره‌شده Cron که کاربر انتخاب کرده است
4. انتخاب مدل عامل/پیش‌فرض

حالت سریع نیز از انتخاب زنده حل‌شده پیروی می‌کند. اگر پیکربندی مدل انتخاب‌شده `params.fastMode` داشته باشد، Cron ایزوله به‌طور پیش‌فرض از آن استفاده می‌کند. بازنویسی `fastMode` نشست ذخیره‌شده همچنان در هر دو جهت بر پیکربندی اولویت دارد.

اگر یک اجرای ایزوله به واگذاری تغییر مدل زنده برخورد کند، Cron با ارائه‌دهنده/مدل تغییرکرده دوباره تلاش می‌کند و آن انتخاب زنده را پیش از تلاش مجدد برای اجرای فعال ماندگار می‌کند. وقتی تغییر همچنین یک پروفایل احراز هویت جدید حمل می‌کند، Cron آن بازنویسی پروفایل احراز هویت را نیز برای اجرای فعال ماندگار می‌کند. تلاش‌های مجدد محدودند: پس از تلاش اولیه به‌علاوه ۲ تلاش مجدد تغییر، Cron به‌جای حلقه بی‌پایان، لغو می‌کند.

پیش از آنکه یک اجرای Cron ایزوله وارد runner عامل شود، OpenClaw endpointهای provider محلیِ قابل دسترس را برای providerهای پیکربندی‌شدهٔ `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها loopback، شبکهٔ خصوصی، یا `.local` است بررسی می‌کند. اگر آن endpoint از کار افتاده باشد، اجرا به‌جای شروع یک فراخوانی مدل، با یک خطای روشن provider/model به‌صورت `skipped` ثبت می‌شود. نتیجهٔ endpoint به‌مدت ۵ دقیقه cache می‌شود، بنابراین تعداد زیادی job موعددار که از همان سرور محلی ازکارافتادهٔ Ollama، vLLM، SGLang، یا LM Studio استفاده می‌کنند، به‌جای ایجاد طوفان درخواست، یک probe کوچک مشترک خواهند داشت. اجراهای provider-preflight که skip شده‌اند backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های skip تکراری می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | چه اتفاقی می‌افتد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر عامل ارسال نکرده باشد، متن نهایی را با fallback به مقصد تحویل می‌دهد |
| `webhook`  | payload رویداد تکمیل‌شده را با POST به یک URL می‌فرستد                                |
| `none`     | runner هیچ تحویل fallback انجام نمی‌دهد                                         |

برای تحویل channel از `--announce --channel telegram --to "-1001234567890"` استفاده کنید. برای topicهای forum در Telegram، از `-1001234567890:topic:123` استفاده کنید؛ فراخوان‌های مستقیم RPC/config همچنین می‌توانند `delivery.threadId` را به‌صورت string یا number ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های room در Matrix به حروف کوچک و بزرگ حساس‌اند؛ از شناسهٔ دقیق room یا فرم `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل announce از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، یک مقصد دارای پیشوند provider مانند `telegram:123` می‌تواند پیش از آنکه cron به تاریخچهٔ session یا یک channel پیکربندی‌شدهٔ واحد fallback کند، channel را انتخاب کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است selectorهای provider هستند. اگر `delivery.channel` صریح باشد، پیشوند مقصد باید همان provider را نام ببرد؛ برای مثال، `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود، به‌جای اینکه به WhatsApp اجازه دهد شناسهٔ Telegram را به‌عنوان شماره تلفن تفسیر کند. پیشوندهای نوع مقصد و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>`، و `sms:<number>` همچنان syntax مقصد متعلق به channel هستند، نه selectorهای provider.

برای jobهای ایزوله، تحویل chat مشترک است. اگر مسیر chat در دسترس باشد، عامل می‌تواند حتی وقتی job از `--no-deliver` استفاده می‌کند از ابزار `message` استفاده کند. اگر عامل به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلان fallback را skip می‌کند. در غیر این صورت `announce`، `webhook`، و `none` فقط کنترل می‌کنند runner پس از turn عامل با پاسخ نهایی چه کار کند.

وقتی یک عامل از یک chat فعال یک یادآور ایزوله ایجاد می‌کند، OpenClaw مقصد تحویل زندهٔ حفظ‌شده را برای مسیر announce fallback ذخیره می‌کند. کلیدهای session داخلی ممکن است حروف کوچک باشند؛ وقتی context فعلی chat در دسترس است، مقصدهای تحویل provider از آن کلیدها بازسازی نمی‌شوند.

تحویل announce ضمنی از allowlistهای channel پیکربندی‌شده برای اعتبارسنجی و reroute کردن مقصدهای stale استفاده می‌کند. تأییدیه‌های pairing-store مربوط به DM گیرندگان automation fallback نیستند؛ وقتی یک job زمان‌بندی‌شده باید به‌صورت proactive به یک DM ارسال کند، `delivery.to` را تنظیم کنید یا entry مربوط به `allowFrom` در channel را پیکربندی کنید.

اعلان‌های failure مسیر مقصد جداگانه‌ای را دنبال می‌کنند:

- `cron.failureDestination` پیش‌فرض سراسری اعلان‌های failure را تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر job override می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و job از قبل از طریق `announce` تحویل می‌دهد، اعلان‌های failure اکنون به مقصد اصلی announce fallback می‌کنند.
- `delivery.failureDestination` فقط روی jobهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک job یا سیاست هشدار cron سراسری را وارد اعلان‌های تکراری اجرای skip‌شده می‌کند. اجراهای skip‌شده یک شمارندهٔ skip متوالی جداگانه نگه می‌دارند، بنابراین روی backoff خطای اجرا اثر نمی‌گذارند.

## نمونه‌های CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model and thinking override">
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
</Tabs>

## Webhookها

Gateway می‌تواند endpointهای HTTP Webhook را برای triggerهای خارجی در معرض دسترس قرار دهد. در config فعال کنید:

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

هر درخواست باید token مربوط به hook را از طریق header شامل شود:

- `Authorization: Bearer <token>` (پیشنهادی)
- `x-openclaw-token: <token>`

tokenهای query-string رد می‌شوند.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    یک رویداد system را برای session اصلی وارد صف می‌کند:

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
    یک turn عامل ایزوله اجرا می‌کند:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    فیلدها: `message` (الزامی)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    نام‌های hook سفارشی از طریق `hooks.mappings` در config resolve می‌شوند. mappingها می‌توانند payloadهای دلخواه را با templateها یا transformهای کد به actionهای `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
endpointهای hook را پشت loopback، tailnet، یا reverse proxy مورد اعتماد نگه دارید.

- از یک token اختصاصی برای hook استفاده کنید؛ tokenهای auth مربوط به Gateway را دوباره استفاده نکنید.
- `hooks.path` را روی یک subpath اختصاصی نگه دارید؛ `/` رد می‌شود.
- برای محدود کردن routing صریح `agentId`، `hooks.allowedAgentIds` را تنظیم کنید.
- مگر اینکه به sessionهای انتخاب‌شده توسط caller نیاز دارید، `hooks.allowRequestSessionKey=false` را نگه دارید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را نیز تنظیم کنید تا شکل‌های مجاز کلید session محدود شوند.
- payloadهای hook به‌صورت پیش‌فرض با مرزهای ایمنی wrap می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

triggerهای inbox در Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، hookهای OpenClaw فعال، Tailscale برای endpoint عمومی HTTPS.
</Note>

### راه‌اندازی wizard (پیشنهادی)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این دستور config مربوط به `hooks.gmail` را می‌نویسد، preset مربوط به Gmail را فعال می‌کند، و از Tailscale Funnel برای endpoint push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام boot کردن `gog gmail watch serve` را شروع می‌کند و watch را خودکار renew می‌کند. برای opt out، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="Select the GCP project">
    پروژهٔ GCP مالک OAuth client استفاده‌شده توسط `gog` را انتخاب کنید:

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

### override مدل Gmail

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

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
نکتهٔ override مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شدهٔ job را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان provider/model دقیق به اجرای عامل ایزوله می‌رسد.
- اگر مجاز نباشد یا resolve نشود، cron اجرا را با خطای اعتبارسنجی صریح fail می‌کند.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در cron مدل اصلی job است، نه override مربوط به `/model` در session.
- payload مربوط به `fallbacks`، fallbackهای پیکربندی‌شده را برای آن job جایگزین می‌کند؛ `fallbacks: []` fallback را غیرفعال می‌کند و اجرا را سخت‌گیرانه می‌کند.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان یک retry target اضافیِ خاموش به مدل اصلی عامل fall through نمی‌کند.

</Note>

## پیکربندی

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
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

`maxConcurrentRuns` هم dispatch زمان‌بندی‌شدهٔ cron و هم اجرای turn عامل ایزوله را محدود می‌کند. turnهای عامل cron ایزوله در داخل از lane اختصاصی اجرای `cron-nested` در صف استفاده می‌کنند، بنابراین افزایش این مقدار به اجراهای مستقل LLM مربوط به cron اجازه می‌دهد به‌صورت موازی پیش بروند، به‌جای اینکه فقط wrapperهای بیرونی cron آن‌ها شروع شوند. lane مشترک و غیر cron به نام `nested` با این تنظیم گسترده‌تر نمی‌شود.

sidecar وضعیت runtime از `cron.store` مشتق می‌شود: یک store با پسوند `.json` مانند `~/clawd/cron/jobs.json` از `~/clawd/cron/jobs-state.json` استفاده می‌کند، در حالی که یک مسیر store بدون پسوند `.json`، `-state.json` را به انتهای آن اضافه می‌کند.

اگر `jobs.json` را دستی ویرایش می‌کنید، `jobs-state.json` را خارج از source control نگه دارید. OpenClaw از آن sidecar برای slotهای pending، markerهای active، metadata آخرین اجرا، و هویت schedule که به scheduler می‌گوید چه زمانی یک job ویرایش‌شده از بیرون به `nextRunAtMs` تازه نیاز دارد استفاده می‌کند.

غیرفعال کردن cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **retry یک‌باره**: خطاهای گذرا (rate limit، overload، network، server error) تا ۳ بار با backoff نمایی retry می‌شوند. خطاهای دائمی فوراً غیرفعال می‌شوند.

    **retry تکرارشونده**: backoff نمایی (۳۰ ثانیه تا ۶۰ دقیقه) بین retryها. backoff پس از اجرای موفق بعدی reset می‌شود.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (پیش‌فرض `24h`) entryهای session اجرای ایزوله را prune می‌کند. `cron.runLog.maxBytes` / `cron.runLog.keepLines` فایل‌های run-log را خودکار prune می‌کنند.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

### نردبان command

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
    - `cron.enabled` و متغیر محیطی `OPENCLAW_SKIP_CRON` را بررسی کنید.
    - تأیید کنید که Gateway به‌صورت پیوسته در حال اجرا است.
    - برای زمان‌بندی‌های `cron`، منطقه زمانی (`--tz`) را در برابر منطقه زمانی میزبان بررسی کنید.
    - `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و زمان اجرای کار هنوز نرسیده بوده است.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویلی انجام نشد">
    - حالت تحویل `none` یعنی انتظار نمی‌رود ارسال جایگزین اجراکننده انجام شود. وقتی مسیر چت در دسترس باشد، عامل همچنان می‌تواند مستقیماً با ابزار `message` ارسال کند.
    - نبودن یا نامعتبر بودن مقصد تحویل (`channel`/`to`) یعنی خروجی نادیده گرفته شده است.
    - برای Matrix، کارهای کپی‌شده یا قدیمی با شناسه‌های اتاق `delivery.to` که به حروف کوچک تبدیل شده‌اند ممکن است شکست بخورند، چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند. کار را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی تحویل به‌دلیل اعتبارنامه‌ها مسدود شده است.
    - اگر اجرای ایزوله فقط توکن سکوت (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل خروجی مستقیم را سرکوب می‌کند و مسیر جایگزین خلاصه صف‌شده را نیز سرکوب می‌کند، بنابراین چیزی دوباره به چت ارسال نمی‌شود.
    - اگر عامل باید خودش به کاربر پیام بدهد، بررسی کنید که کار یک مسیر قابل استفاده داشته باشد (`channel: "last"` با یک چت قبلی، یا یک کانال/مقصد صریح).

  </Accordion>
  <Accordion title="به‌نظر می‌رسد Cron یا Heartbeat از چرخش /new-style جلوگیری می‌کند">
    - تازگی بازنشانی روزانه و بیکار بر اساس `updatedAt` نیست؛ [مدیریت نشست](/fa/concepts/session#session-lifecycle) را ببینید.
    - بیدارباش‌های Cron، اجراهای Heartbeat، اعلان‌های اجرا، و دفترنگهداری Gateway ممکن است ردیف نشست را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی که پیش از وجود این فیلدها ساخته شده‌اند، OpenClaw می‌تواند وقتی فایل هنوز در دسترس است، `sessionStartedAt` را از سرآیند نشست در JSONL رونوشت بازیابی کند. ردیف‌های بیکار قدیمی بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان خط پایه بیکاری استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات ظریف منطقه زمانی">
    - Cron بدون `--tz` از منطقه زمانی میزبان Gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون منطقه زمانی به‌عنوان UTC در نظر گرفته می‌شوند.
    - `activeHours` در Heartbeat از تفکیک منطقه زمانی پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [اتوماسیون و کارها](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — دفتر ثبت کار برای اجراهای Cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای نشست اصلی
- [منطقه زمانی](/fa/concepts/timezone) — پیکربندی منطقه زمانی
