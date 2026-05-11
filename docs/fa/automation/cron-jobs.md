---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارسازی‌ها
    - اتصال محرک‌های خارجی (Webhookها، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhookها و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-05-11T20:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. کارها را پایدار نگه می‌دارد، عامل را در زمان درست بیدار می‌کند و می‌تواند خروجی را به یک کانال چت یا نقطه پایانی Webhook برساند.

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
  <Step title="بررسی کارهایتان">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
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

- Cron **درون فرایند Gateway** اجرا می‌شود (نه درون مدل).
- تعریف‌های کار در `~/.openclaw/cron/jobs.json` پایدار می‌مانند تا راه‌اندازی‌های مجدد زمان‌بندی‌ها را از بین نبرند.
- وضعیت اجرای زمان اجرا کنار آن در `~/.openclaw/cron/jobs-state.json` پایدار می‌ماند. اگر تعریف‌های cron را در git ردیابی می‌کنید، `jobs.json` را ردیابی کنید و `jobs-state.json` را در gitignore بگذارید.
- پس از جداسازی، نسخه‌های قدیمی‌تر OpenClaw می‌توانند `jobs.json` را بخوانند اما ممکن است کارها را تازه تلقی کنند، چون فیلدهای زمان اجرا اکنون در `jobs-state.json` قرار دارند.
- وقتی `jobs.json` در حالی که Gateway در حال اجرا یا متوقف است ویرایش می‌شود، OpenClaw فیلدهای زمان‌بندی تغییرکرده را با فراداده شیار زمان اجرای در انتظار مقایسه می‌کند و مقدارهای کهنه `nextRunAtMs` را پاک می‌کند. بازنویسی‌هایی که فقط قالب‌بندی یا فقط ترتیب کلیدها را تغییر می‌دهند، شیار در انتظار را حفظ می‌کنند.
- همه اجراهای cron رکوردهای [وظیفه پس‌زمینه](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام راه‌اندازی Gateway، کارهای نوبت عامل ایزوله که موعدشان گذشته است، به‌جای بازپخش فوری، بیرون از پنجره اتصال کانال دوباره زمان‌بندی می‌شوند تا راه‌اندازی Discord/Telegram و آماده‌سازی دستورهای بومی پس از راه‌اندازی مجدد پاسخ‌گو بمانند.
- کارهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت خودکار حذف می‌شوند.
- اجراهای cron ایزوله، پس از کامل شدن اجرا، برگه‌ها/فرایندهای مرورگر ردیابی‌شده را برای جلسه `cron:<jobId>` خود به‌صورت best-effort می‌بندند، تا خودکارسازی مرورگر جداشده فرایندهای بی‌سرپرست باقی نگذارد.
- اجراهای cron ایزوله که مجوز محدود پاک‌سازی خودکار cron را دریافت می‌کنند، همچنان می‌توانند وضعیت زمان‌بند، فهرست خودفیلترشده‌ای از کار فعلی خود، و تاریخچه اجرای آن کار را بخوانند، تا بررسی‌های وضعیت/Heartbeat بتوانند بدون دسترسی گسترده‌تر برای تغییر cron، زمان‌بندی خودشان را بررسی کنند.
- اجراهای cron ایزوله همچنین در برابر پاسخ‌های تأیید کهنه محافظت می‌کنند. اگر اولین نتیجه فقط یک به‌روزرسانی موقت وضعیت باشد (`on it`، `pulling everything together`، و نشانه‌های مشابه) و هیچ اجرای زیرعامل فرزند هنوز مسئول پاسخ نهایی نباشد، OpenClaw یک‌بار دیگر برای نتیجه واقعی پیش از تحویل درخواست می‌کند.
- اجراهای cron ایزوله ابتدا فراداده ساختاریافته منع اجرا را از اجرای تعبیه‌شده ترجیح می‌دهند، سپس به نشانگرهای شناخته‌شده خلاصه/خروجی نهایی مانند `SYSTEM_RUN_DENIED` و `INVALID_REQUEST` برمی‌گردند، تا یک دستور مسدودشده به‌عنوان اجرای سبز گزارش نشود.
- اجراهای cron ایزوله همچنین شکست‌های عامل در سطح اجرا را، حتی وقتی هیچ payload پاسخی تولید نشده باشد، خطای کار تلقی می‌کنند؛ بنابراین شکست‌های مدل/ارائه‌دهنده شمارنده‌های خطا را افزایش می‌دهند و اعلان‌های شکست را فعال می‌کنند، به‌جای اینکه کار را موفق پاک کنند.
- وقتی یک کار نوبت عامل ایزوله به `timeoutSeconds` می‌رسد، cron اجرای عامل زیرین را لغو می‌کند و یک پنجره کوتاه پاک‌سازی به آن می‌دهد. اگر اجرا تخلیه نشود، پاک‌سازی تحت مالکیت Gateway، پیش از اینکه cron زمان‌پایان را ثبت کند، مالکیت جلسه آن اجرا را به‌اجبار پاک می‌کند، تا کار چت صف‌شده پشت یک جلسه پردازش کهنه باقی نماند.
- اگر یک نوبت عامل ایزوله پیش از شروع runner یا پیش از اولین فراخوانی مدل متوقف بماند، cron یک زمان‌پایان ویژه فاز مانند `setup timed out before runner start` یا `stalled before first model call (last phase: context-engine)` ثبت می‌کند. این watchdogها ارائه‌دهنده‌های تعبیه‌شده و ارائه‌دهنده‌های متکی بر CLI را پیش از اینکه فرایند CLI خارجی آن‌ها واقعاً شروع شود پوشش می‌دهند، و مستقل از مقدارهای طولانی `timeoutSeconds` محدود می‌شوند تا شکست‌های cold-start/auth/context به‌جای انتظار برای کل بودجه کار، سریع ظاهر شوند.

<a id="maintenance"></a>

<Note>
سازگارسازی وظیفه برای cron ابتدا تحت مالکیت زمان اجرا و در مرحله دوم متکی بر تاریخچه بادوام است: یک وظیفه فعال cron تا زمانی زنده می‌ماند که زمان اجرای cron هنوز آن کار را در حال اجرا ردیابی کند، حتی اگر یک ردیف جلسه فرزند قدیمی هنوز وجود داشته باشد. وقتی زمان اجرا دیگر مالک کار نیست و پنجره مهلت ۵ دقیقه‌ای منقضی می‌شود، بررسی‌های نگهداشت، لاگ‌های اجرای پایدار و وضعیت کار را برای اجرای متناظر `cron:<jobId>:<startedAt>` بررسی می‌کنند. اگر آن تاریخچه بادوام یک نتیجه پایانی نشان دهد، دفتر وظیفه از روی آن نهایی می‌شود؛ در غیر این صورت نگهداشت تحت مالکیت Gateway می‌تواند وظیفه را `lost` علامت‌گذاری کند. ممیزی CLI آفلاین می‌تواند از تاریخچه بادوام بازیابی کند، اما مجموعه خالی کارهای فعال درون‌فرایندی خودش را به‌عنوان دلیل از بین رفتن اجرای cron تحت مالکیت Gateway تلقی نمی‌کند.
</Note>

## انواع زمان‌بندی

| نوع     | پرچم CLI  | توضیح                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp یک‌باره (ISO 8601 یا نسبی مانند `20m`)        |
| `every` | `--every` | بازه ثابت                                               |
| `cron`  | `--cron`  | عبارت cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری      |

timestampهای بدون منطقه زمانی به‌عنوان UTC تلقی می‌شوند. برای زمان‌بندی بر اساس ساعت دیواری محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشونده ابتدای ساعت به‌طور خودکار تا ۵ دقیقه پخش می‌شوند تا جهش‌های بار کاهش یابد. از `--exact` برای اجبار زمان‌بندی دقیق یا از `--stagger 30s` برای یک پنجره صریح استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) parse می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته non-wildcard باشند، croner وقتی **یکی از** فیلدها مطابق باشد match می‌کند، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw اینجا از رفتار OR پیش‌فرض Croner استفاده می‌کند. برای الزام هر دو شرط، از modifier روز هفته `+` در Croner (`0 9 15 * +1`) استفاده کنید یا روی یک فیلد زمان‌بندی کنید و دیگری را در prompt یا command کار خود guard کنید.

## سبک‌های اجرا

| سبک            | مقدار `--session`   | محل اجرا                 | مناسب برای                       |
| -------------- | ------------------- | ------------------------ | -------------------------------- |
| جلسه اصلی      | `main`              | نوبت Heartbeat بعدی      | یادآورها، رویدادهای سیستمی       |
| ایزوله         | `isolated`          | `cron:<jobId>` اختصاصی   | گزارش‌ها، کارهای پس‌زمینه        |
| جلسه فعلی      | `current`           | متصل‌شده هنگام ایجاد     | کارهای تکرارشونده آگاه از زمینه  |
| جلسه سفارشی    | `session:custom-id` | جلسه نام‌دار پایدار      | workflowهایی که بر تاریخچه بنا می‌شوند |

<AccordionGroup>
  <Accordion title="جلسه اصلی در برابر ایزوله در برابر سفارشی">
    کارهای **جلسه اصلی** یک رویداد سیستمی را در صف می‌گذارند و به‌صورت اختیاری Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن رویدادهای سیستمی تازگی reset روزانه/idle را برای جلسه هدف تمدید نمی‌کنند. کارهای **ایزوله** یک نوبت عامل اختصاصی را با یک جلسه تازه اجرا می‌کنند. **جلسه‌های سفارشی** (`session:xxx`) زمینه را در میان اجراها پایدار نگه می‌دارند و workflowهایی مانند standupهای روزانه را ممکن می‌کنند که بر خلاصه‌های قبلی بنا می‌شوند.
  </Accordion>
  <Accordion title="معنای «جلسه تازه» برای کارهای ایزوله">
    برای کارهای ایزوله، «جلسه تازه» یعنی یک شناسه transcript/session جدید برای هر اجرا. OpenClaw ممکن است ترجیح‌های امنی مانند تنظیمات thinking/fast/verbose، برچسب‌ها، و overrideهای مدل/auth صریحاً انتخاب‌شده توسط کاربر را حمل کند، اما زمینه گفت‌وگوی محیطی را از یک ردیف cron قدیمی به ارث نمی‌برد: مسیریابی channel/group، سیاست send یا queue، elevation، origin، یا اتصال زمان اجرای ACP. وقتی یک کار تکرارشونده باید عمداً بر همان زمینه گفت‌وگو بنا شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="پاک‌سازی زمان اجرا">
    برای کارهای ایزوله، teardown زمان اجرا اکنون شامل پاک‌سازی best-effort مرورگر برای آن جلسه cron است. شکست‌های پاک‌سازی نادیده گرفته می‌شوند تا نتیجه واقعی cron همچنان ملاک باشد.

    اجراهای cron ایزوله همچنین هر نمونه زمان اجرای MCP بسته‌بندی‌شده‌ای را که برای کار ایجاد شده باشد از مسیر مشترک پاک‌سازی زمان اجرا dispose می‌کنند. این با روش teardown کلاینت‌های MCP جلسه اصلی و جلسه سفارشی همخوان است، بنابراین کارهای cron ایزوله فرایندهای فرزند stdio یا اتصال‌های MCP بلندمدت را در میان اجراها نشت نمی‌دهند.

  </Accordion>
  <Accordion title="تحویل زیرعامل و Discord">
    وقتی اجراهای cron ایزوله زیرعامل‌ها را orchestrate می‌کنند، تحویل نیز خروجی نهایی فرزند را بر متن موقت والد کهنه ترجیح می‌دهد. اگر فرزندها هنوز در حال اجرا باشند، OpenClaw به‌جای اعلام آن، به‌روزرسانی جزئی والد را suppress می‌کند.

    برای هدف‌های اعلام Discord فقط‌متنی، OpenClaw متن نهایی canonical دستیار را یک‌بار ارسال می‌کند، به‌جای اینکه هم payloadهای متنی stream/intermediate و هم پاسخ نهایی را بازپخش کند. payloadهای رسانه‌ای و ساختاریافته Discord همچنان به‌صورت payloadهای جداگانه تحویل داده می‌شوند تا پیوست‌ها و componentها حذف نشوند.

  </Accordion>
</AccordionGroup>

### گزینه‌های payload برای کارهای ایزوله

<ParamField path="--message" type="string" required>
  متن prompt (برای ایزوله الزامی است).
</ParamField>
<ParamField path="--model" type="string">
  override مدل؛ از مدل مجاز انتخاب‌شده برای کار استفاده می‌کند.
</ParamField>
<ParamField path="--thinking" type="string">
  override سطح thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تزریق فایل bootstrap فضای کاری را رد می‌کند.
</ParamField>
<ParamField path="--tools" type="string">
  محدود می‌کند کار از کدام ابزارها می‌تواند استفاده کند، برای مثال `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی آن کار استفاده می‌کند. این با override `/model` جلسه چت یکسان نیست: زنجیره‌های fallback پیکربندی‌شده همچنان وقتی مدل اصلی کار شکست می‌خورد اعمال می‌شوند. اگر مدل درخواستی مجاز نباشد یا قابل resolve نباشد، cron اجرا را با یک خطای اعتبارسنجی صریح شکست می‌دهد، به‌جای اینکه بی‌صدا به انتخاب مدل عامل/پیش‌فرض کار fallback کند.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. وقتی وجود داشته باشد، آن فهرست جایگزین زنجیره fallback پیکربندی‌شده برای کار می‌شود. وقتی اجرای cron سخت‌گیرانه‌ای می‌خواهید که فقط مدل انتخاب‌شده را امتحان کند، در payload/API کار از `fallbacks: []` استفاده کنید. اگر کاری `--model` داشته باشد اما fallbackهای payload یا پیکربندی‌شده نداشته باشد، OpenClaw یک override fallback خالی صریح می‌فرستد تا مدل اصلی عامل به‌عنوان هدف retry اضافی پنهان اضافه نشود.

اولویت انتخاب مدل برای کارهای ایزوله چنین است:

1. override مدل hook Gmail (وقتی اجرا از Gmail آمده و آن override مجاز است)
2. `model` در payload هر کار
3. override مدل جلسه cron ذخیره‌شده انتخاب‌شده توسط کاربر
4. انتخاب مدل عامل/پیش‌فرض

حالت سریع نیز از انتخاب live resolved پیروی می‌کند. اگر پیکربندی مدل انتخاب‌شده `params.fastMode` داشته باشد، cron ایزوله به‌طور پیش‌فرض از آن استفاده می‌کند. override ذخیره‌شده `fastMode` جلسه همچنان در هر دو جهت بر پیکربندی مقدم است.

اگر یک اجرای ایزوله به handoff تغییر مدل live برسد، cron با ارائه‌دهنده/مدل تغییرکرده دوباره تلاش می‌کند و پیش از retry، آن انتخاب live را برای اجرای فعال پایدار می‌کند. وقتی تغییر همچنین یک پروفایل auth جدید همراه دارد، cron آن override پروفایل auth را نیز برای اجرای فعال پایدار می‌کند. retryها محدودند: پس از تلاش اولیه به‌علاوه ۲ retry تغییر، cron به‌جای حلقه بی‌پایان، اجرا را لغو می‌کند.

پیش از آنکه یک اجرای Cron ایزوله وارد اجراکنندهٔ عامل شود، OpenClaw نقاط پایانی provider محلیِ قابل‌دسترسی را برای providerهای پیکربندی‌شدهٔ `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها loopback، شبکهٔ خصوصی، یا `.local` است بررسی می‌کند. اگر آن نقطهٔ پایانی از کار افتاده باشد، اجرا به‌جای شروع یک فراخوانی مدل، با خطای روشن provider/model به‌صورت `skipped` ثبت می‌شود. نتیجهٔ نقطهٔ پایانی به‌مدت ۵ دقیقه کش می‌شود، بنابراین بسیاری از کارهای موعدرسیده که از همان سرور محلی ازکارافتادهٔ Ollama، vLLM، SGLang، یا LM Studio استفاده می‌کنند، به‌جای ایجاد طوفان درخواست، یک probe کوچک مشترک دارند. اجراهای provider-preflight که رد شده‌اند، backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های تکراری ردشدن را می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | چه اتفاقی می‌افتد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر عامل ارسال نکرده باشد، متن نهایی را به هدف به‌صورت fallback تحویل می‌دهد |
| `webhook`  | بار دادهٔ رویداد پایان‌یافته را به یک URL با POST ارسال می‌کند                                |
| `none`     | تحویل fallback توسط اجراکننده انجام نمی‌شود                                         |

برای تحویل به کانال، از `--announce --channel telegram --to "-1001234567890"` استفاده کنید. برای موضوع‌های انجمن Telegram، از `-1001234567890:topic:123` استفاده کنید؛ فراخوان‌های مستقیم RPC/config نیز می‌توانند `delivery.threadId` را به‌صورت رشته یا عدد ارسال کنند. هدف‌های Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های اتاق Matrix به حروف بزرگ و کوچک حساس‌اند؛ از شناسهٔ دقیق اتاق یا قالب `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل announce از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، هدفی با پیشوند provider مانند `telegram:123` می‌تواند پیش از fallback کردن Cron به تاریخچهٔ نشست یا یک کانال پیکربندی‌شدهٔ واحد، کانال را انتخاب کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است selectorهای provider هستند. اگر `delivery.channel` صریح باشد، پیشوند هدف باید همان provider را نام‌گذاری کند؛ برای مثال، `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود، به‌جای اینکه WhatsApp اجازه داشته باشد شناسهٔ Telegram را به‌عنوان شماره تلفن تفسیر کند. پیشوندهای نوع هدف و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>`، و `sms:<number>` همچنان نحو هدف متعلق به کانال هستند، نه selectorهای provider.

برای کارهای ایزوله، تحویل چت مشترک است. اگر مسیر چت در دسترس باشد، عامل می‌تواند حتی وقتی کار از `--no-deliver` استفاده می‌کند، از ابزار `message` استفاده کند. اگر عامل به هدف پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلان fallback را رد می‌کند. در غیر این صورت `announce`، `webhook`، و `none` فقط کنترل می‌کنند که اجراکننده پس از نوبت عامل با پاسخ نهایی چه کند.

وقتی یک عامل از یک چت فعال یادآور ایزوله ایجاد می‌کند، OpenClaw هدف تحویل زندهٔ حفظ‌شده را برای مسیر اعلان fallback ذخیره می‌کند. کلیدهای نشست داخلی ممکن است حروف کوچک باشند؛ وقتی زمینهٔ چت فعلی در دسترس است، هدف‌های تحویل provider از آن کلیدها بازسازی نمی‌شوند.

تحویل announce ضمنی از allowlistهای کانال پیکربندی‌شده برای اعتبارسنجی و بازمسیر‌دهی هدف‌های قدیمی استفاده می‌کند. تأییدهای DM pairing-store گیرندهٔ خودکارسازی fallback نیستند؛ وقتی یک کار زمان‌بندی‌شده باید به‌صورت پیش‌دستانه به یک DM ارسال کند، `delivery.to` را تنظیم کنید یا ورودی `allowFrom` کانال را پیکربندی کنید.

اعلان‌های شکست مسیر مقصد جداگانه‌ای را دنبال می‌کنند:

- `cron.failureDestination` یک پیش‌فرض سراسری برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و کار از قبل از طریق `announce` تحویل بدهد، اعلان‌های شکست اکنون به همان هدف announce اصلی fallback می‌کنند.
- `delivery.failureDestination` فقط روی کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار سراسری Cron را وارد هشدارهای تکراری اجرای ردشده می‌کند. اجراهای ردشده شمارندهٔ ردشدن پیاپی جداگانه‌ای دارند، بنابراین روی backoff خطای اجرا اثر نمی‌گذارند.

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
  <Tab title="بازنویسی مدل و thinking">
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

Gateway می‌تواند نقاط پایانی Webhook HTTP را برای محرک‌های خارجی ارائه کند. در پیکربندی فعال کنید:

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

هر درخواست باید توکن hook را از طریق header شامل شود:

- `Authorization: Bearer <token>` (توصیه‌شده)
- `x-openclaw-token: <token>`

توکن‌های query-string رد می‌شوند.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    یک رویداد سیستم را برای نشست اصلی در صف قرار می‌دهد:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      توضیح رویداد.
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
    نام‌های hook سفارشی از طریق `hooks.mappings` در پیکربندی resolve می‌شوند. نگاشت‌ها می‌توانند بارهای دادهٔ دلخواه را با templateها یا تبدیل‌های کد به کنش‌های `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
نقاط پایانی hook را پشت loopback، tailnet، یا reverse proxy مورداعتماد نگه دارید.

- از یک توکن hook اختصاصی استفاده کنید؛ توکن‌های احراز هویت Gateway را دوباره استفاده نکنید.
- `hooks.path` را روی یک زیربخش اختصاصی نگه دارید؛ `/` رد می‌شود.
- `hooks.allowedAgentIds` را تنظیم کنید تا مسیر‌دهی صریح `agentId` محدود شود.
- `hooks.allowRequestSessionKey=false` را نگه دارید، مگر اینکه به نشست‌های انتخاب‌شده توسط فراخوان نیاز داشته باشید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را نیز تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- بارهای دادهٔ hook به‌صورت پیش‌فرض با مرزهای ایمنی بسته‌بندی می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

محرک‌های صندوق ورودی Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، hookهای OpenClaw فعال، Tailscale برای نقطهٔ پایانی عمومی HTTPS.
</Note>

### راه‌اندازی Wizard (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این دستور پیکربندی `hooks.gmail` را می‌نویسد، preset مربوط به Gmail را فعال می‌کند، و از Tailscale Funnel برای نقطهٔ پایانی push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` باشد و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام بوت `gog gmail watch serve` را شروع می‌کند و watch را به‌صورت خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="انتخاب پروژهٔ GCP">
    پروژهٔ GCP مالک OAuth client استفاده‌شده توسط `gog` را انتخاب کنید:

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
نکتهٔ بازنویسی مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شدهٔ کار را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان provider/model دقیق به اجرای عامل ایزوله می‌رسد.
- اگر مجاز نباشد یا resolve نشود، Cron اجرا را با خطای اعتبارسنجی صریح ناموفق می‌کند.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، زیرا `--model` در Cron مدل اصلی کار است، نه بازنویسی `/model` نشست.
- بار دادهٔ `fallbacks` fallbackهای پیکربندی‌شده را برای آن کار جایگزین می‌کند؛ `fallbacks: []` fallback را غیرفعال می‌کند و اجرا را سخت‌گیرانه می‌سازد.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان هدف تلاش دوبارهٔ اضافی و بی‌صدا به مدل اصلی عامل fall through نمی‌کند.

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

`maxConcurrentRuns` هم dispatch زمان‌بندی‌شدهٔ Cron و هم اجرای نوبت عامل ایزوله را محدود می‌کند. نوبت‌های عامل Cron ایزوله در داخل از lane اجرای اختصاصی `cron-nested` صف استفاده می‌کنند، بنابراین افزایش این مقدار اجازه می‌دهد اجراهای LLM مستقل Cron به‌جای فقط شروع wrapperهای بیرونی Cron خود، به‌صورت موازی پیش بروند. lane مشترک غیر-Cron با نام `nested` با این تنظیم گسترش داده نمی‌شود.

sidecar وضعیت runtime از `cron.store` مشتق می‌شود: یک store با پسوند `.json` مانند `~/clawd/cron/jobs.json` از `~/clawd/cron/jobs-state.json` استفاده می‌کند، درحالی‌که مسیر store بدون پسوند `.json`، `-state.json` را اضافه می‌کند.

اگر `jobs.json` را دستی ویرایش می‌کنید، `jobs-state.json` را خارج از کنترل نسخه نگه دارید. OpenClaw از آن sidecar برای slotهای pending، markerهای فعال، metadata آخرین اجرا، و هویت زمان‌بندی استفاده می‌کند که به scheduler می‌گوید چه زمانی یک کار ویرایش‌شدهٔ خارجی به `nextRunAtMs` تازه نیاز دارد.

غیرفعال کردن Cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="رفتار تلاش دوباره">
    **تلاش دوبارهٔ یک‌باره**: خطاهای گذرا (محدودیت نرخ، overload، شبکه، خطای سرور) تا ۳ بار با backoff نمایی دوباره تلاش می‌شوند. خطاهای دائمی بلافاصله غیرفعال می‌شوند.

    **تلاش دوبارهٔ تکرارشونده**: backoff نمایی (۳۰ ثانیه تا ۶۰ دقیقه) بین تلاش‌ها. backoff پس از اجرای موفق بعدی بازنشانی می‌شود.

  </Accordion>
  <Accordion title="نگهداری">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های جداافتادهٔ run-session را پاک‌سازی می‌کند. `cron.runLog.maxBytes` / `cron.runLog.keepLines` فایل‌های run-log را به‌صورت خودکار پاک‌سازی می‌کنند.
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
    - تأیید کنید که Gateway به‌طور پیوسته در حال اجرا است.
    - برای زمان‌بندی‌های `cron`، منطقهٔ زمانی (`--tz`) را در برابر منطقهٔ زمانی میزبان بررسی کنید.
    - `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و job هنوز سررسید نشده بود.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویلی انجام نشد">
    - حالت تحویل `none` یعنی انتظار نمی‌رود ارسال جایگزین runner انجام شود. وقتی مسیر گفت‌وگو در دسترس باشد، agent همچنان می‌تواند مستقیماً با ابزار `message` ارسال کند.
    - نبودن/نامعتبر بودن مقصد تحویل (`channel`/`to`) یعنی خروجی نادیده گرفته شد.
    - برای Matrix، jobهای کپی‌شده یا قدیمی با شناسه‌های اتاق `delivery.to` با حروف کوچک می‌توانند شکست بخورند، چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند. job را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی تحویل توسط credentials مسدود شده است.
    - اگر اجرای جداافتاده فقط توکن سکوت (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل خروجی مستقیم را سرکوب می‌کند و مسیر جایگزین خلاصهٔ صف‌شده را هم سرکوب می‌کند، بنابراین چیزی به گفت‌وگو ارسال نمی‌شود.
    - اگر agent باید خودش به کاربر پیام بدهد، بررسی کنید که job یک مسیر قابل استفاده داشته باشد (`channel: "last"` با یک گفت‌وگوی قبلی، یا یک کانال/مقصد صریح).

  </Accordion>
  <Accordion title="به نظر می‌رسد Cron یا Heartbeat مانع rollover به /new-style می‌شود">
    - تازگی بازنشانی روزانه و بیکار بر اساس `updatedAt` نیست؛ [مدیریت نشست](/fa/concepts/session#session-lifecycle) را ببینید.
    - بیدارباش‌های Cron، اجراهای heartbeat، اعلان‌های exec، و دفترداری Gateway ممکن است ردیف نشست را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی که پیش از وجود این فیلدها ایجاد شده‌اند، OpenClaw می‌تواند `sessionStartedAt` را از سرآیند نشست JSONL رونوشت بازیابی کند، وقتی فایل هنوز در دسترس باشد. ردیف‌های بیکار قدیمی بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان مبنای بیکاری استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات ظریف منطقهٔ زمانی">
    - Cron بدون `--tz` از منطقهٔ زمانی میزبان gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون منطقهٔ زمانی به‌عنوان UTC در نظر گرفته می‌شوند.
    - Heartbeat `activeHours` از تفکیک منطقهٔ زمانی پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [اتوماسیون و وظایف](/fa/automation) — همهٔ سازوکارهای اتوماسیون در یک نگاه
- [وظایف پس‌زمینه](/fa/automation/tasks) — دفتر ثبت task برای اجراهای cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای نشست اصلی
- [منطقهٔ زمانی](/fa/concepts/timezone) — پیکربندی منطقهٔ زمانی
