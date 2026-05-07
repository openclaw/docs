---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارسازی‌ها
    - اتصال محرک‌های خارجی (Webhookها، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhookها و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-05-07T13:13:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. این زمان‌بند کارها را پایدار نگه می‌دارد، عامل را در زمان درست بیدار می‌کند، و می‌تواند خروجی را به یک کانال چت یا نقطهٔ پایانی Webhook تحویل دهد.

## شروع سریع

<Steps>
  <Step title="افزودن یادآور یک‌باره">
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
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="دیدن تاریخچهٔ اجرا">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron چگونه کار می‌کند

- Cron **داخل فرایند Gateway** اجرا می‌شود (نه داخل مدل).
- تعریف‌های کار در `~/.openclaw/cron/jobs.json` پایدار می‌مانند تا راه‌اندازی‌های دوباره باعث از دست رفتن زمان‌بندی‌ها نشوند.
- وضعیت اجرای زمان اجرا کنار آن در `~/.openclaw/cron/jobs-state.json` پایدار می‌ماند. اگر تعریف‌های cron را در git دنبال می‌کنید، `jobs.json` را دنبال کنید و `jobs-state.json` را در gitignore بگذارید.
- پس از این جداسازی، نسخه‌های قدیمی‌تر OpenClaw می‌توانند `jobs.json` را بخوانند اما ممکن است کارها را تازه در نظر بگیرند، چون فیلدهای زمان اجرا اکنون در `jobs-state.json` قرار دارند.
- وقتی `jobs.json` در حال اجرا یا توقف Gateway ویرایش می‌شود، OpenClaw فیلدهای زمان‌بندی تغییرکرده را با فرادادهٔ slot زمان اجرای معلق مقایسه می‌کند و مقدارهای کهنهٔ `nextRunAtMs` را پاک می‌کند. بازنویسی‌هایی که فقط قالب‌بندی یا فقط ترتیب کلیدها را تغییر می‌دهند، slot معلق را حفظ می‌کنند.
- همهٔ اجراهای cron رکوردهای [کار پس‌زمینه](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام راه‌اندازی Gateway، کارهای جداافتادهٔ نوبت عامل که موعدشان گذشته، به‌جای پخش دوبارهٔ فوری، خارج از پنجرهٔ اتصال کانال دوباره زمان‌بندی می‌شوند تا راه‌اندازی Discord/Telegram و تنظیم فرمان‌های بومی پس از راه‌اندازی دوباره پاسخ‌گو بمانند.
- کارهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت خودکار حذف می‌شوند.
- اجراهای جداافتادهٔ cron پس از پایان اجرا، به‌شکل best-effort زبانه‌ها/فرایندهای مرورگر ردیابی‌شده برای نشست `cron:<jobId>` خود را می‌بندند، تا خودکارسازی مرورگر جداشده فرایندهای یتیم باقی نگذارد.
- اجراهای جداافتادهٔ cron که مجوز محدود پاک‌سازی خودکار cron را دریافت می‌کنند همچنان می‌توانند وضعیت زمان‌بند و فهرست خودفیلترشده‌ای از کار فعلی خود را بخوانند، تا بررسی‌های وضعیت/Heartbeat بتوانند زمان‌بندی خودشان را بدون گرفتن دسترسی گسترده‌تر برای تغییر cron بررسی کنند.
- اجراهای جداافتادهٔ cron همچنین در برابر پاسخ‌های تأیید کهنه محافظت می‌کنند. اگر نتیجهٔ اول فقط یک به‌روزرسانی وضعیت موقت باشد (`on it`، `pulling everything together` و نشانه‌های مشابه) و هیچ اجرای زیرعاملِ فرزند همچنان مسئول پاسخ نهایی نباشد، OpenClaw پیش از تحویل یک‌بار دیگر برای نتیجهٔ واقعی درخواست می‌دهد.
- اجراهای جداافتادهٔ cron ابتدا فرادادهٔ ساختاریافتهٔ رد اجرای فرمان را از اجرای تعبیه‌شده ترجیح می‌دهند، سپس به نشانگرهای شناخته‌شدهٔ خلاصه/خروجی نهایی مانند `SYSTEM_RUN_DENIED` و `INVALID_REQUEST` برمی‌گردند، تا یک فرمان مسدودشده به‌عنوان اجرای سبز گزارش نشود.
- اجراهای جداافتادهٔ cron همچنین خطاهای عامل در سطح اجرا را حتی وقتی payload پاسخ تولید نشده باشد، خطای کار در نظر می‌گیرند؛ بنابراین خطاهای مدل/ارائه‌دهنده شمارنده‌های خطا را افزایش می‌دهند و به‌جای پاک کردن کار به‌عنوان موفق، اعلان‌های شکست را فعال می‌کنند.
- وقتی یک کار جداافتادهٔ نوبت عامل به `timeoutSeconds` می‌رسد، cron اجرای عامل زیرین را لغو می‌کند و یک پنجرهٔ کوتاه پاک‌سازی به آن می‌دهد. اگر اجرا تخلیه نشود، پاک‌سازیِ متعلق به Gateway پیش از ثبت timeout توسط cron، مالکیت نشست آن اجرا را با اجبار پاک می‌کند تا کار چت صف‌شده پشت یک نشست پردازش کهنه باقی نماند.

<a id="maintenance"></a>

<Note>
آشتی وظیفه برای cron نخست متعلق به زمان اجرا و سپس متکی به تاریخچهٔ پایدار است: یک وظیفهٔ cron فعال تا وقتی زنده می‌ماند که زمان اجرای cron همچنان آن کار را در حال اجرا دنبال کند، حتی اگر یک ردیف نشست فرزند قدیمی هنوز وجود داشته باشد. وقتی زمان اجرا دیگر مالک کار نباشد و پنجرهٔ ارفاق ۵ دقیقه‌ای منقضی شود، نگه‌داری لاگ‌های اجرای پایدار و وضعیت کار را برای اجرای متناظر `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن تاریخچهٔ پایدار نتیجهٔ نهایی نشان دهد، دفتر وظیفه از روی آن نهایی می‌شود؛ در غیر این صورت نگه‌داریِ متعلق به Gateway می‌تواند وظیفه را `lost` علامت‌گذاری کند. ممیزی آفلاین CLI می‌تواند از تاریخچهٔ پایدار بازیابی کند، اما مجموعهٔ خالیِ کارهای فعالِ درون‌فرایندی خودش را به‌عنوان اثبات از بین رفتن یک اجرای cron متعلق به Gateway در نظر نمی‌گیرد.
</Note>

## انواع زمان‌بندی

| نوع    | پرچم CLI  | توضیح                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | زمان‌مهر یک‌باره (ISO 8601 یا نسبی مثل `20m`)    |
| `every` | `--every` | فاصلهٔ ثابت                                          |
| `cron`  | `--cron`  | عبارت cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری |

زمان‌مهرهای بدون منطقهٔ زمانی به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی با ساعت دیواری محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشوندهٔ ابتدای ساعت به‌طور خودکار تا ۵ دقیقه جابه‌جا می‌شوند تا جهش‌های بار کاهش یابد. برای اجبار زمان‌بندی دقیق از `--exact` یا برای پنجره‌ای صریح از `--stagger 30s` استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) تجزیه می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته غیر wildcard باشند، croner زمانی مطابقت می‌دهد که **هرکدام** از فیلدها مطابقت داشته باشد، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw اینجا از رفتار OR پیش‌فرض Croner استفاده می‌کند. برای الزام هر دو شرط، از تعدیل‌گر روز هفتهٔ `+` در Croner (`0 9 15 * +1`) استفاده کنید یا روی یک فیلد زمان‌بندی کنید و فیلد دیگر را در prompt یا فرمان کارتان guard کنید.

## سبک‌های اجرا

| سبک           | مقدار `--session`   | در کجا اجرا می‌شود                  | بهترین کاربرد                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| نشست اصلی    | `main`              | نوبت Heartbeat بعدی      | یادآورها، رویدادهای سیستمی        |
| جداافتاده        | `isolated`          | `cron:<jobId>` اختصاصی | گزارش‌ها، کارهای پس‌زمینه      |
| نشست فعلی | `current`           | هنگام ایجاد متصل می‌شود   | کارهای تکرارشوندهٔ وابسته به زمینه    |
| نشست سفارشی  | `session:custom-id` | نشست نام‌دار پایدار | گردش‌کارهایی که روی تاریخچه ساخته می‌شوند |

<AccordionGroup>
  <Accordion title="نشست اصلی در برابر جداافتاده در برابر سفارشی">
    کارهای **نشست اصلی** یک رویداد سیستمی را صف می‌کنند و به‌صورت اختیاری Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن رویدادهای سیستمی تازگی reset روزانه/بیکاری را برای نشست هدف تمدید نمی‌کنند. کارهای **جداافتاده** یک نوبت عامل اختصاصی را با نشست تازه اجرا می‌کنند. **نشست‌های سفارشی** (`session:xxx`) زمینه را در اجراها پایدار نگه می‌دارند و گردش‌کارهایی مثل standupهای روزانه را که بر پایهٔ خلاصه‌های قبلی ساخته می‌شوند ممکن می‌کنند.
  </Accordion>
  <Accordion title="معنای «نشست تازه» برای کارهای جداافتاده">
    برای کارهای جداافتاده، «نشست تازه» یعنی شناسهٔ transcript/session جدید برای هر اجرا. OpenClaw ممکن است ترجیح‌های ایمن مانند تنظیمات thinking/fast/verbose، برچسب‌ها، و overrideهای مدل/auth صریحاً انتخاب‌شده توسط کاربر را همراه ببرد، اما زمینهٔ مکالمهٔ محیطی را از یک ردیف cron قدیمی به ارث نمی‌برد: مسیریابی کانال/گروه، سیاست ارسال یا صف، elevation، origin، یا اتصال زمان اجرای ACP. وقتی یک کار تکرارشونده باید عمداً روی همان زمینهٔ مکالمه ساخته شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="پاک‌سازی زمان اجرا">
    برای کارهای جداافتاده، teardown زمان اجرا اکنون شامل پاک‌سازی best-effort مرورگر برای آن نشست cron است. خطاهای پاک‌سازی نادیده گرفته می‌شوند تا نتیجهٔ واقعی cron همچنان اولویت داشته باشد.

    اجراهای جداافتادهٔ cron همچنین هر نمونهٔ زمان اجرای MCP بسته‌بندی‌شده‌ای را که برای کار ساخته شده باشد، از مسیر مشترک پاک‌سازی زمان اجرا dispose می‌کنند. این با نحوهٔ teardown کلاینت‌های MCP در نشست اصلی و نشست سفارشی همسان است، بنابراین کارهای جداافتادهٔ cron فرایندهای فرزند stdio یا اتصال‌های MCP بلندعمر را بین اجراها نشت نمی‌دهند.

  </Accordion>
  <Accordion title="تحویل زیرعامل و Discord">
    وقتی اجراهای جداافتادهٔ cron زیرعامل‌ها را هماهنگ می‌کنند، تحویل همچنین خروجی نهایی فرزند را به متن موقت والد کهنه ترجیح می‌دهد. اگر فرزندها همچنان در حال اجرا باشند، OpenClaw آن به‌روزرسانی جزئی والد را به‌جای اعلام کردن، سرکوب می‌کند.

    برای هدف‌های announce متنی Discord، OpenClaw متن نهایی canonical دستیار را یک‌بار می‌فرستد، به‌جای اینکه هم payloadهای متنی streamed/intermediate و هم پاسخ نهایی را دوباره پخش کند. payloadهای رسانه‌ای و ساختاریافتهٔ Discord همچنان به‌صورت payloadهای جداگانه تحویل داده می‌شوند تا پیوست‌ها و کامپوننت‌ها حذف نشوند.

  </Accordion>
</AccordionGroup>

### گزینه‌های payload برای کارهای جداافتاده

<ParamField path="--message" type="string" required>
  متن prompt (برای جداافتاده الزامی است).
</ParamField>
<ParamField path="--model" type="string">
  override مدل؛ از مدل مجاز انتخاب‌شده برای کار استفاده می‌کند.
</ParamField>
<ParamField path="--thinking" type="string">
  override سطح تفکر.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تزریق فایل bootstrap فضای کاری را رد کن.
</ParamField>
<ParamField path="--tools" type="string">
  محدود کن که کار بتواند از کدام ابزارها استفاده کند، برای مثال `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی آن کار استفاده می‌کند. این همان override نشست چت `/model` نیست: زنجیره‌های fallback پیکربندی‌شده همچنان وقتی مدل اصلی کار شکست بخورد اعمال می‌شوند. اگر مدل درخواستی مجاز نباشد یا قابل resolve نباشد، cron اجرا را با خطای اعتبارسنجی صریح ناموفق می‌کند، نه اینکه بی‌صدا به انتخاب مدل agent/default کار fallback کند.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. وقتی وجود داشته باشد، آن فهرست جایگزین زنجیرهٔ fallback پیکربندی‌شده برای کار می‌شود. وقتی اجرای cron سخت‌گیرانه‌ای می‌خواهید که فقط مدل انتخاب‌شده را امتحان کند، در payload/API کار از `fallbacks: []` استفاده کنید. اگر یک کار `--model` داشته باشد اما نه fallbackهای payload و نه fallbackهای پیکربندی‌شده، OpenClaw یک override fallback خالی صریح پاس می‌دهد تا مدل اصلی عامل به‌عنوان هدف تلاش دوبارهٔ اضافی پنهان اضافه نشود.

اولویت انتخاب مدل برای کارهای جداافتاده این است:

1. override مدل hook Gmail (وقتی اجرا از Gmail آمده باشد و آن override مجاز باشد)
2. `model` در payload هر کار
3. override ذخیره‌شدهٔ مدل نشست cron انتخاب‌شده توسط کاربر
4. انتخاب مدل agent/default

حالت سریع هم از انتخاب زندهٔ resolve‌شده پیروی می‌کند. اگر پیکربندی مدل انتخاب‌شده `params.fastMode` داشته باشد، cron جداافتاده به‌طور پیش‌فرض از آن استفاده می‌کند. override ذخیره‌شدهٔ `fastMode` نشست همچنان در هر دو جهت بر پیکربندی غلبه می‌کند.

اگر یک اجرای جداافتاده به handoff تعویض مدل زنده برسد، cron با ارائه‌دهنده/مدل تعویض‌شده دوباره تلاش می‌کند و آن انتخاب زنده را پیش از تلاش دوباره برای اجرای فعال پایدار می‌کند. وقتی تعویض یک پروفایل auth جدید هم همراه داشته باشد، cron آن override پروفایل auth را هم برای اجرای فعال پایدار می‌کند. تلاش‌های دوباره محدود هستند: پس از تلاش اولیه به‌علاوهٔ ۲ تلاش دوبارهٔ تعویض، cron به‌جای چرخیدن بی‌پایان لغو می‌کند.

پیش از اینکه یک اجرای جداافتادهٔ cron وارد agent runner شود، OpenClaw نقاط پایانی ارائه‌دهندهٔ محلی قابل‌دسترسی را برای ارائه‌دهنده‌های پیکربندی‌شدهٔ `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها loopback، شبکهٔ خصوصی، یا `.local` است بررسی می‌کند. اگر آن نقطهٔ پایانی down باشد، اجرا به‌جای شروع یک فراخوانی مدل، با خطای روشن provider/model به‌عنوان `skipped` ثبت می‌شود. نتیجهٔ نقطهٔ پایانی ۵ دقیقه cache می‌شود، بنابراین کارهای موعدرسیدهٔ زیاد که از همان سرور محلی مردهٔ Ollama، vLLM، SGLang، یا LM Studio استفاده می‌کنند، به‌جای ایجاد طوفان درخواست، یک probe کوچک مشترک دارند. اجراهای provider-preflight ردشده backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های skip تکراری می‌خواهید `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | چه رخ می‌دهد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر عامل ارسال نکرده باشد، متن نهایی را با fallback به هدف تحویل می‌دهد |
| `webhook`  | payload رویداد پایان‌یافته را به یک URL POST می‌کند                                |
| `none`     | تحویل fallback runner انجام نمی‌شود                                         |

از `--announce --channel telegram --to "-1001234567890"` برای تحویل به کانال استفاده کنید. برای موضوع‌های انجمنی Telegram، از `-1001234567890:topic:123` استفاده کنید؛ فراخوان‌های مستقیم RPC/پیکربندی همچنین می‌توانند `delivery.threadId` را به‌صورت رشته یا عدد ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند؛ از شناسهٔ دقیق اتاق یا فرم `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل announce از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، یک مقصد با پیشوند ارائه‌دهنده مانند `telegram:123` می‌تواند کانال را پیش از آنکه Cron به تاریخچهٔ نشست یا یک کانال پیکربندی‌شدهٔ واحد برگردد، انتخاب کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است انتخابگر ارائه‌دهنده هستند. اگر `delivery.channel` صریح باشد، پیشوند مقصد باید همان ارائه‌دهنده را نام ببرد؛ برای مثال، `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود، به‌جای اینکه به WhatsApp اجازه دهد شناسهٔ Telegram را به‌عنوان شماره تلفن تفسیر کند. پیشوندهای نوع مقصد و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>` و `sms:<number>` همچنان نحو مقصد متعلق به کانال هستند، نه انتخابگرهای ارائه‌دهنده.

برای کارهای ایزوله، تحویل گفتگو مشترک است. اگر مسیر گفتگو در دسترس باشد، عامل می‌تواند حتی وقتی کار از `--no-deliver` استفاده می‌کند از ابزار `message` استفاده کند. اگر عامل به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلام جایگزین را نادیده می‌گیرد. در غیر این صورت `announce`، `webhook` و `none` فقط کنترل می‌کنند اجراکننده پس از نوبت عامل با پاسخ نهایی چه کند.

وقتی یک عامل از یک گفتگوی فعال یک یادآور ایزوله ایجاد می‌کند، OpenClaw مقصد تحویل زندهٔ حفظ‌شده را برای مسیر اعلام جایگزین ذخیره می‌کند. کلیدهای نشست داخلی ممکن است با حروف کوچک باشند؛ وقتی زمینهٔ گفتگوی فعلی در دسترس است، مقصدهای تحویل ارائه‌دهنده از آن کلیدها بازسازی نمی‌شوند.

تحویل announce ضمنی از allowlistهای کانال پیکربندی‌شده برای اعتبارسنجی و بازمسیر‌دهی مقصدهای منسوخ استفاده می‌کند. تأییدهای فروشگاه جفت‌سازی پیام خصوصی گیرنده‌های خودکار جایگزین نیستند؛ وقتی یک کار زمان‌بندی‌شده باید به‌صورت پیش‌دستانه به پیام خصوصی ارسال کند، `delivery.to` را تنظیم کنید یا ورودی `allowFrom` کانال را پیکربندی کنید.

اعلان‌های شکست مسیر مقصد جداگانه‌ای را دنبال می‌کنند:

- `cron.failureDestination` یک پیش‌فرض سراسری برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و کار از قبل از طریق `announce` تحویل داده شود، اعلان‌های شکست اکنون به همان مقصد announce اصلی برمی‌گردند.
- `delivery.failureDestination` فقط در کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار سراسری Cron را وارد هشدارهای تکراری اجرای ردشده می‌کند. اجراهای ردشده شمارندهٔ ردشدن متوالی جداگانه‌ای نگه می‌دارند، بنابراین بر backoff خطای اجرا اثر نمی‌گذارند.

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

Gateway می‌تواند endpointهای HTTP Webhook را برای محرک‌های خارجی در دسترس قرار دهد. در پیکربندی فعال کنید:

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
    یک رویداد سیستم را برای نشست اصلی در صف قرار دهید:

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
    یک نوبت عامل ایزوله اجرا کنید:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    فیلدها: `message` (الزامی)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hookهای نگاشت‌شده (POST /hooks/<name>)">
    نام‌های hook سفارشی از طریق `hooks.mappings` در پیکربندی resolve می‌شوند. نگاشت‌ها می‌توانند payloadهای دلخواه را با templateها یا transformهای کد به کنش‌های `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
endpointهای hook را پشت loopback، tailnet یا reverse proxy مورداعتماد نگه دارید.

- از یک توکن hook اختصاصی استفاده کنید؛ توکن‌های احراز هویت Gateway را دوباره استفاده نکنید.
- `hooks.path` را روی یک زیرمسیر اختصاصی نگه دارید؛ `/` رد می‌شود.
- برای محدود کردن مسیریابی صریح `agentId`، `hooks.allowedAgentIds` را تنظیم کنید.
- مگر اینکه به نشست‌های انتخاب‌شده توسط فراخوان نیاز داشته باشید، `hooks.allowRequestSessionKey=false` را نگه دارید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، همچنین `hooks.allowedSessionKeyPrefixes` را تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- payloadهای hook به‌صورت پیش‌فرض با مرزهای ایمنی بسته‌بندی می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

محرک‌های inbox در Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، hookهای OpenClaw فعال، Tailscale برای endpoint عمومی HTTPS.
</Note>

### راه‌اندازی با ویزارد (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این کار پیکربندی `hooks.gmail` را می‌نویسد، preset Gmail را فعال می‌کند، و از Tailscale Funnel برای endpoint push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام boot، `gog gmail watch serve` را شروع می‌کند و watch را خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="انتخاب پروژهٔ GCP">
    پروژهٔ GCP مالک کلاینت OAuth استفاده‌شده توسط `gog` را انتخاب کنید:

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
یادداشت بازنویسی مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شدهٔ کار را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان ارائه‌دهنده/مدل دقیق به اجرای عامل ایزوله می‌رسد.
- اگر مجاز نباشد یا قابل resolve نباشد، Cron اجرا را با یک خطای اعتبارسنجی صریح ناموفق می‌کند.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در Cron مدل اصلی کار است، نه بازنویسی `/model` نشست.
- payload `fallbacks`، fallbackهای پیکربندی‌شده برای آن کار را جایگزین می‌کند؛ `fallbacks: []` fallback را غیرفعال می‌کند و اجرا را strict می‌سازد.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان یک مقصد retry اضافی خاموش به مدل اصلی عامل سقوط نمی‌کند.

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

`maxConcurrentRuns` هم dispatch زمان‌بندی‌شدهٔ Cron و هم اجرای نوبت عامل ایزوله را محدود می‌کند. نوبت‌های عامل Cron ایزوله در داخل از lane اجرای اختصاصی `cron-nested` صف استفاده می‌کنند، بنابراین افزایش این مقدار به اجراهای مستقل LLM در Cron اجازه می‌دهد به‌جای اینکه فقط wrapperهای بیرونی Cron خود را شروع کنند، به‌صورت موازی پیش بروند. lane مشترک غیر Cron با نام `nested` با این تنظیم گسترش داده نمی‌شود.

sidecar وضعیت runtime از `cron.store` مشتق می‌شود: یک store با پسوند `.json` مانند `~/clawd/cron/jobs.json` از `~/clawd/cron/jobs-state.json` استفاده می‌کند، در حالی‌که یک مسیر store بدون پسوند `.json`، `-state.json` را اضافه می‌کند.

اگر `jobs.json` را دستی ویرایش می‌کنید، `jobs-state.json` را خارج از کنترل نسخه نگه دارید. OpenClaw از آن sidecar برای slotهای در انتظار، markerهای فعال، metadata آخرین اجرا، و هویت زمان‌بندی استفاده می‌کند که به scheduler می‌گوید چه زمانی یک کار ویرایش‌شدهٔ خارجی به `nextRunAtMs` تازه نیاز دارد.

غیرفعال کردن Cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="رفتار retry">
    **retry یک‌باره**: خطاهای گذرا (rate limit، overload، network، server error) تا ۳ بار با exponential backoff دوباره تلاش می‌شوند. خطاهای دائمی بلافاصله غیرفعال می‌کنند.

    **retry تکرارشونده**: exponential backoff (۳۰ ثانیه تا ۶۰ دقیقه) بین retryها. backoff پس از اجرای موفق بعدی reset می‌شود.

  </Accordion>
  <Accordion title="نگهداری">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های نشست اجرای ایزوله را prune می‌کند. `cron.runLog.maxBytes` / `cron.runLog.keepLines` فایل‌های run-log را به‌صورت خودکار prune می‌کنند.
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
    - `cron.enabled` و متغیر محیطی `OPENCLAW_SKIP_CRON` را بررسی کنید.
    - تأیید کنید Gateway به‌طور پیوسته در حال اجراست.
    - برای زمان‌بندی‌های `cron`، منطقهٔ زمانی (`--tz`) را نسبت به منطقهٔ زمانی میزبان بررسی کنید.
    - `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و کار هنوز موعد اجرا نداشته است.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویلی انجام نشد">
    - حالت تحویل `none` یعنی ارسال جایگزین اجراکننده مورد انتظار نیست. وقتی مسیر چت در دسترس باشد، عامل همچنان می‌تواند مستقیما با ابزار `message` ارسال کند.
    - نبودن یا نامعتبر بودن هدف تحویل (`channel`/`to`) یعنی ارسال خروجی نادیده گرفته شد.
    - برای Matrix، کارهای کپی‌شده یا قدیمی با شناسه‌های اتاق `delivery.to` که با حروف کوچک شده‌اند ممکن است شکست بخورند، چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند. کار را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی تحویل توسط اعتبارنامه‌ها مسدود شده است.
    - اگر اجرای ایزوله فقط توکن سکوت (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل خروجی مستقیم را سرکوب می‌کند و مسیر خلاصهٔ صف‌شدهٔ جایگزین را نیز سرکوب می‌کند، بنابراین چیزی به چت ارسال نمی‌شود.
    - اگر عامل باید خودش به کاربر پیام بدهد، بررسی کنید که کار یک مسیر قابل استفاده داشته باشد (`channel: "last"` با یک چت قبلی، یا یک کانال/هدف صریح).

  </Accordion>
  <Accordion title="به نظر می‌رسد Cron یا Heartbeat از چرخش /new-style جلوگیری می‌کند">
    - تازگی بازنشانی روزانه و بی‌کاری بر پایهٔ `updatedAt` نیست؛ [مدیریت نشست](/fa/concepts/session#session-lifecycle) را ببینید.
    - بیدارباش‌های Cron، اجراهای Heartbeat، اعلان‌های exec و حسابداری Gateway ممکن است ردیف نشست را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی که پیش از وجود این فیلدها ایجاد شده‌اند، OpenClaw می‌تواند وقتی فایل هنوز در دسترس است، `sessionStartedAt` را از سربرگ نشست JSONL رونوشت بازیابی کند. ردیف‌های بی‌کار قدیمی بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان خط پایهٔ بی‌کاری خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات مهم منطقهٔ زمانی">
    - Cron بدون `--tz` از منطقهٔ زمانی میزبان Gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون منطقهٔ زمانی، UTC در نظر گرفته می‌شوند.
    - `activeHours` در Heartbeat از تفکیک منطقهٔ زمانی پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [اتوماسیون و کارها](/fa/automation) — همهٔ سازوکارهای اتوماسیون در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — دفتر ثبت کار برای اجراهای cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای نشست اصلی
- [منطقهٔ زمانی](/fa/concepts/timezone) — پیکربندی منطقهٔ زمانی
