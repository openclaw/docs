---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارسازی‌ها
    - اتصال محرک‌های خارجی (Webhookها، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای کارهای زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhookها و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-05-12T00:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. کارها را پایدار نگه می‌دارد، عامل را در زمان درست بیدار می‌کند، و می‌تواند خروجی را به یک کانال گفت‌وگو یا نقطهٔ پایانی webhook تحویل دهد.

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
  <Step title="بررسی کارهای خود">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
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
- تعریف‌های کارها در `~/.openclaw/cron/jobs.json` پایدار می‌مانند، بنابراین راه‌اندازی‌های دوباره زمان‌بندی‌ها را از دست نمی‌دهند.
- وضعیت اجرای زمان اجرا کنار آن در `~/.openclaw/cron/jobs-state.json` پایدار می‌ماند. اگر تعریف‌های cron را در git ردیابی می‌کنید، `jobs.json` را ردیابی کنید و `jobs-state.json` را در gitignore قرار دهید.
- پس از جداسازی، نسخه‌های قدیمی‌تر OpenClaw می‌توانند `jobs.json` را بخوانند اما ممکن است کارها را تازه در نظر بگیرند، چون فیلدهای زمان اجرا اکنون در `jobs-state.json` قرار دارند.
- وقتی `jobs.json` هنگام اجرا یا توقف Gateway ویرایش شود، OpenClaw فیلدهای زمان‌بندیِ تغییرکرده را با فرادادهٔ خانهٔ زمان اجرای در انتظار مقایسه می‌کند و مقدارهای کهنهٔ `nextRunAtMs` را پاک می‌کند. بازنویسی‌های صرفا مربوط به قالب‌بندی یا فقط ترتیب کلیدها، خانهٔ در انتظار را حفظ می‌کنند.
- همهٔ اجراهای cron رکوردهای [کار پس‌زمینه](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام راه‌اندازی Gateway، کارهای جداافتادهٔ نوبت عامل که موعدشان گذشته است، به‌جای بازپخش فوری، خارج از پنجرهٔ اتصال کانال دوباره زمان‌بندی می‌شوند تا راه‌اندازی Discord/Telegram و تنظیم فرمان‌های بومی پس از راه‌اندازی دوباره پاسخ‌گو بمانند.
- کارهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت خودکار حذف می‌شوند.
- اجراهای جداافتادهٔ cron با بهترین تلاش، برگه‌ها/فرایندهای مرورگرِ ردیابی‌شده را برای نشست `cron:<jobId>` خود هنگام تکمیل اجرا می‌بندند تا خودکارسازی مرورگرِ جداشده فرایندهای یتیم باقی نگذارد.
- اجراهای جداافتادهٔ cron که مجوز محدود پاک‌سازی خودکار cron را دریافت می‌کنند همچنان می‌توانند وضعیت زمان‌بند، فهرست خودفیلترشده‌ای از کار فعلی خود، و تاریخچهٔ اجرای آن کار را بخوانند؛ بنابراین بررسی‌های وضعیت/Heartbeat می‌توانند بدون گرفتن دسترسی گسترده‌تر برای تغییر cron، زمان‌بندی خودشان را بررسی کنند.
- اجراهای جداافتادهٔ cron همچنین در برابر پاسخ‌های تأیید کهنه محافظت می‌کنند. اگر نخستین نتیجه فقط یک به‌روزرسانی وضعیت موقت باشد (`on it`، `pulling everything together`، و اشاره‌های مشابه) و هیچ اجرای عامل فرزند همچنان مسئول پاسخ نهایی نباشد، OpenClaw پیش از تحویل، یک بار دیگر برای نتیجهٔ واقعی درخواست می‌دهد.
- اجراهای جداافتادهٔ cron ابتدا فرادادهٔ ساختاریافتهٔ رد اجرا را از اجرای جاسازی‌شده ترجیح می‌دهند، سپس به نشانگرهای شناخته‌شدهٔ خلاصه/خروجی نهایی مانند `SYSTEM_RUN_DENIED` و `INVALID_REQUEST` برمی‌گردند، تا یک فرمان مسدودشده به‌عنوان اجرای موفق گزارش نشود.
- اجراهای جداافتادهٔ cron همچنین شکست‌های عامل در سطح اجرا را حتی وقتی هیچ محتوای پاسخی تولید نشده باشد، خطای کار در نظر می‌گیرند؛ بنابراین شکست‌های مدل/ارائه‌دهنده شمارنده‌های خطا را افزایش می‌دهند و به‌جای پاک کردن کار به‌عنوان موفق، اعلان شکست را فعال می‌کنند.
- وقتی یک کار جداافتادهٔ نوبت عامل به `timeoutSeconds` برسد، cron اجرای عامل زیربنایی را لغو می‌کند و یک پنجرهٔ کوتاه برای پاک‌سازی به آن می‌دهد. اگر اجرا تخلیه نشود، پاک‌سازی تحت مالکیت Gateway پیش از اینکه cron وقفه را ثبت کند، مالکیت نشست آن اجرا را به‌اجبار پاک می‌کند تا کار گفت‌وگوی صف‌شده پشت یک نشست پردازش کهنه باقی نماند.
- اگر یک نوبت عامل جداافتاده پیش از شروع اجراکننده یا پیش از نخستین فراخوانی مدل متوقف شود، cron یک وقفهٔ ویژهٔ مرحله مانند `setup timed out before runner start` یا `stalled before first model call (last phase: context-engine)` ثبت می‌کند. این نگهبان‌ها ارائه‌دهنده‌های جاسازی‌شده و ارائه‌دهنده‌های متکی به CLI را پیش از اینکه فرایند CLI خارجی آن‌ها واقعا شروع شود پوشش می‌دهند، و مستقل از مقدارهای طولانی `timeoutSeconds` محدود می‌شوند تا شکست‌های شروع سرد/احراز هویت/زمینه به‌جای انتظار برای کل بودجهٔ کار، سریع آشکار شوند.

<a id="maintenance"></a>

<Note>
آشتی‌دهی کارها برای cron ابتدا تحت مالکیت زمان اجرا و سپس با پشتوانهٔ تاریخچهٔ پایدار است: یک کار فعال cron تا وقتی زمان اجرای cron هنوز آن کار را در حال اجرا ردیابی می‌کند، زنده می‌ماند، حتی اگر یک ردیف نشست فرزند قدیمی هنوز وجود داشته باشد. وقتی زمان اجرا مالکیت کار را متوقف کند و پنجرهٔ ارفاق ۵ دقیقه‌ای منقضی شود، نگهداری، گزارش‌های اجرای پایدار و وضعیت کار را برای اجرای مطابق `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن تاریخچهٔ پایدار یک نتیجهٔ پایانی نشان دهد، دفتر کل کار از روی آن نهایی می‌شود؛ در غیر این صورت نگهداری تحت مالکیت Gateway می‌تواند کار را `lost` علامت‌گذاری کند. ممیزی آفلاین CLI می‌تواند از تاریخچهٔ پایدار بازیابی کند، اما مجموعهٔ خالی کارهای فعال درون‌فرایندی خودش را مدرکی برای از بین رفتن اجرای cron تحت مالکیت Gateway در نظر نمی‌گیرد.
</Note>

## انواع زمان‌بندی

| نوع     | پرچم CLI | توضیح                                                   |
| ------- | -------- | ------------------------------------------------------- |
| `at`    | `--at`    | مهر زمانی یک‌باره (ISO 8601 یا نسبی مثل `20m`)          |
| `every` | `--every` | بازهٔ ثابت                                              |
| `cron`  | `--cron`  | عبارت cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری      |

مهرهای زمانی بدون منطقهٔ زمانی به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی بر اساس ساعت دیواری محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشوندهٔ ابتدای ساعت به‌طور خودکار تا ۵ دقیقه پراکنده می‌شوند تا جهش‌های بار کاهش یابد. برای اجبار به زمان‌بندی دقیق از `--exact` یا برای یک پنجرهٔ صریح از `--stagger 30s` استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) تجزیه می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته غیر wildcard باشند، croner زمانی تطبیق می‌دهد که **هرکدام** از فیلدها منطبق باشد، نه هر دو. این رفتار استاندارد cron به سبک Vixie است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw در اینجا از رفتار OR پیش‌فرض Croner استفاده می‌کند. برای الزام هر دو شرط، از تعدیل‌گر روز هفتهٔ `+` در Croner استفاده کنید (`0 9 15 * +1`) یا روی یک فیلد زمان‌بندی کنید و فیلد دیگر را در prompt یا فرمان کار خود محافظت کنید.

## سبک‌های اجرا

| سبک           | مقدار `--session`  | اجرا در                  | مناسب برای                    |
| ------------- | ------------------ | ------------------------ | ----------------------------- |
| نشست اصلی     | `main`             | نوبت Heartbeat بعدی      | یادآورها، رویدادهای سیستم     |
| جداافتاده     | `isolated`         | `cron:<jobId>` اختصاصی   | گزارش‌ها، کارهای پس‌زمینه     |
| نشست فعلی     | `current`          | اتصال در زمان ایجاد      | کار تکرارشوندهٔ وابسته به زمینه |
| نشست سفارشی   | `session:custom-id` | نشست نام‌دار پایدار      | گردش‌کارهایی که بر تاریخچه بنا می‌شوند |

<AccordionGroup>
  <Accordion title="نشست اصلی در برابر جداافتاده در برابر سفارشی">
    کارهای **نشست اصلی** یک رویداد سیستم را در صف می‌گذارند و به‌صورت اختیاری Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن رویدادهای سیستم تازگی بازنشانی روزانه/بی‌کاری را برای نشست هدف تمدید نمی‌کنند. کارهای **جداافتاده** یک نوبت عامل اختصاصی را با نشست تازه اجرا می‌کنند. **نشست‌های سفارشی** (`session:xxx`) زمینه را میان اجراها پایدار نگه می‌دارند و گردش‌کارهایی مانند جلسه‌های روزانه را که بر خلاصه‌های قبلی بنا می‌شوند ممکن می‌کنند.
  </Accordion>
  <Accordion title="معنای «نشست تازه» برای کارهای جداافتاده">
    برای کارهای جداافتاده، «نشست تازه» یعنی برای هر اجرا یک شناسهٔ transcript/نشست جدید. OpenClaw ممکن است ترجیح‌های ایمن مانند تنظیمات thinking/fast/verbose، برچسب‌ها، و overrideهای صریح مدل/احراز هویت انتخاب‌شده توسط کاربر را همراه ببرد، اما زمینهٔ گفت‌وگوی محیطی را از یک ردیف cron قدیمی به ارث نمی‌برد: مسیریابی کانال/گروه، سیاست ارسال یا صف، ارتقا، مبدأ، یا اتصال زمان اجرای ACP. وقتی یک کار تکرارشونده باید عمدا بر همان زمینهٔ گفت‌وگو بنا شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="پاک‌سازی زمان اجرا">
    برای کارهای جداافتاده، teardown زمان اجرا اکنون شامل پاک‌سازی مرورگر با بهترین تلاش برای آن نشست cron است. شکست‌های پاک‌سازی نادیده گرفته می‌شوند تا نتیجهٔ واقعی cron همچنان غالب باشد.

    اجراهای جداافتادهٔ cron همچنین هر نمونهٔ زمان اجرای MCP بسته‌بندی‌شده‌ای را که برای کار ساخته شده باشد از مسیر پاک‌سازی زمان اجرای مشترک dispose می‌کنند. این با نحوهٔ teardown کلاینت‌های MCP نشست اصلی و نشست سفارشی هم‌خوان است، بنابراین کارهای جداافتادهٔ cron فرایندهای فرزند stdio یا اتصال‌های MCP بلندمدت را میان اجراها نشت نمی‌دهند.

  </Accordion>
  <Accordion title="تحویل عامل فرزند و Discord">
    وقتی اجراهای جداافتادهٔ cron عامل‌های فرزند را هماهنگ می‌کنند، تحویل نیز خروجی نهایی فرزند را بر متن موقت کهنهٔ والد ترجیح می‌دهد. اگر فرزندان هنوز در حال اجرا باشند، OpenClaw به‌جای اعلام آن، به‌روزرسانی جزئی والد را سرکوب می‌کند.

    برای هدف‌های اعلان Discord فقط متنی، OpenClaw متن نهایی و canonical دستیار را یک بار ارسال می‌کند، به‌جای اینکه هم محتوای متنی streamed/میانی و هم پاسخ نهایی را بازپخش کند. رسانه و محتوای ساختاریافتهٔ Discord همچنان به‌صورت payloadهای جداگانه تحویل داده می‌شوند تا پیوست‌ها و مؤلفه‌ها حذف نشوند.

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
  تزریق فایل bootstrap فضای کاری را رد می‌کند.
</ParamField>
<ParamField path="--tools" type="string">
  محدود می‌کند کار از کدام ابزارها می‌تواند استفاده کند، برای مثال `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی آن کار استفاده می‌کند. این با override یک نشست گفت‌وگو با `/model` یکسان نیست: زنجیره‌های fallback پیکربندی‌شده همچنان وقتی مدل اصلی کار شکست بخورد اعمال می‌شوند. اگر مدل درخواست‌شده مجاز نباشد یا قابل حل نباشد، cron به‌جای بازگشت بی‌صدا به انتخاب مدل عامل/پیش‌فرض کار، اجرا را با یک خطای اعتبارسنجی صریح شکست می‌دهد.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. در صورت وجود، آن فهرست جایگزین زنجیرهٔ fallback پیکربندی‌شده برای کار می‌شود. وقتی یک اجرای سخت‌گیرانهٔ cron می‌خواهید که فقط مدل انتخاب‌شده را امتحان کند، در payload/API کار از `fallbacks: []` استفاده کنید. اگر یک کار `--model` داشته باشد اما fallbackهای payload یا پیکربندی‌شده نداشته باشد، OpenClaw یک override خالی صریح برای fallback می‌فرستد تا مدل اصلی عامل به‌عنوان هدف تلاش دوبارهٔ پنهان اضافه نشود.

اولویت انتخاب مدل برای کارهای جداافتاده چنین است:

1. override مدل hook در Gmail (وقتی اجرا از Gmail آمده باشد و آن override مجاز باشد)
2. `model` مربوط به payload هر کار
3. override مدل نشست cron ذخیره‌شدهٔ انتخاب‌شده توسط کاربر
4. انتخاب مدل عامل/پیش‌فرض

حالت سریع نیز از انتخاب زندهٔ حل‌شده پیروی می‌کند. اگر پیکربندی مدل انتخاب‌شده `params.fastMode` داشته باشد، cron جداافتاده به‌طور پیش‌فرض از آن استفاده می‌کند. یک override ذخیره‌شدهٔ نشست برای `fastMode` همچنان در هر دو جهت بر پیکربندی غلبه می‌کند.

اگر یک اجرای جداافتاده به واگذاری live model-switch برسد، cron با ارائه‌دهنده/مدل سوئیچ‌شده دوباره تلاش می‌کند و پیش از تلاش دوباره، آن انتخاب زنده را برای اجرای فعال پایدار می‌کند. وقتی سوئیچ یک پروفایل احراز هویت جدید هم همراه داشته باشد، cron override آن پروفایل احراز هویت را نیز برای اجرای فعال پایدار می‌کند. تلاش‌های دوباره محدود هستند: پس از تلاش اولیه به‌علاوهٔ ۲ تلاش دوبارهٔ سوئیچ، cron به‌جای حلقهٔ بی‌پایان، اجرا را لغو می‌کند.

پیش از آنکه یک اجرای Cron ایزوله وارد اجراکنندهٔ عامل شود، OpenClaw نقاط پایانی ارائه‌دهندهٔ محلی قابل‌دسترسی را برای ارائه‌دهنده‌های پیکربندی‌شدهٔ `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها loopback، شبکهٔ خصوصی یا `.local` است بررسی می‌کند. اگر آن نقطهٔ پایانی از کار افتاده باشد، اجرا به‌جای شروع یک فراخوانی مدل، با خطای روشن ارائه‌دهنده/مدل به‌صورت `skipped` ثبت می‌شود. نتیجهٔ نقطهٔ پایانی به‌مدت ۵ دقیقه در حافظهٔ نهان نگه داشته می‌شود، بنابراین بسیاری از کارهای موعددار که از همان سرور محلیِ ازکارافتادهٔ Ollama، vLLM، SGLang یا LM Studio استفاده می‌کنند، به‌جای ایجاد طوفان درخواست، در یک بررسی کوچک مشترک می‌شوند. اجراهای پروازِ پیش از ارائه‌دهنده که رد شده‌اند، backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های تکراریِ رد شدن را می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | آنچه رخ می‌دهد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر عامل ارسال نکرده باشد، متن نهایی را به‌صورت جایگزین به مقصد تحویل می‌دهد |
| `webhook`  | payload رویداد پایان‌یافته را با POST به یک URL می‌فرستد                                |
| `none`     | تحویل جایگزین توسط اجراکننده انجام نمی‌شود                                         |

برای تحویل به کانال، از `--announce --channel telegram --to "-1001234567890"` استفاده کنید. برای موضوعات انجمن Telegram، از `-1001234567890:topic:123` استفاده کنید؛ فراخوان‌های مستقیم RPC/پیکربندی نیز می‌توانند `delivery.threadId` را به‌صورت رشته یا عدد ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند؛ از شناسهٔ دقیق اتاق یا قالب `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل announce از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، یک مقصد با پیشوند ارائه‌دهنده مانند `telegram:123` می‌تواند پیش از آنکه cron به تاریخچهٔ نشست یا یک کانال پیکربندی‌شدهٔ واحد بازگردد، کانال را انتخاب کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است انتخابگر ارائه‌دهنده هستند. اگر `delivery.channel` صریح باشد، پیشوند مقصد باید همان ارائه‌دهنده را نام ببرد؛ برای مثال، `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود، به‌جای اینکه اجازه دهد WhatsApp شناسهٔ Telegram را به‌عنوان شماره تلفن تفسیر کند. پیشوندهای نوع مقصد و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>` و `sms:<number>` همچنان نحو مقصدِ متعلق به کانال هستند، نه انتخابگر ارائه‌دهنده.

برای کارهای ایزوله، تحویل چت مشترک است. اگر مسیر چت در دسترس باشد، عامل حتی وقتی کار از `--no-deliver` استفاده می‌کند می‌تواند از ابزار `message` استفاده کند. اگر عامل به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلام جایگزین را رد می‌کند. در غیر این صورت `announce`، `webhook` و `none` فقط کنترل می‌کنند اجراکننده پس از نوبت عامل با پاسخ نهایی چه کند.

وقتی یک عامل از یک چت فعال یادآور ایزوله می‌سازد، OpenClaw مقصد تحویل زندهٔ حفظ‌شده را برای مسیر اعلام جایگزین ذخیره می‌کند. کلیدهای نشست داخلی ممکن است با حروف کوچک باشند؛ وقتی زمینهٔ چت فعلی در دسترس است، مقصدهای تحویل ارائه‌دهنده از آن کلیدها بازسازی نمی‌شوند.

تحویل announce ضمنی از allowlistهای کانال پیکربندی‌شده برای اعتبارسنجی و تغییرمسیر مقصدهای کهنه استفاده می‌کند. تأییدهای pairing-store پیام مستقیم گیرندهٔ اتوماسیون جایگزین نیستند؛ وقتی یک کار زمان‌بندی‌شده باید به‌صورت پیش‌دستانه به یک پیام مستقیم ارسال شود، `delivery.to` را تنظیم کنید یا ورودی `allowFrom` کانال را پیکربندی کنید.

اعلان‌های شکست مسیر مقصد جداگانه‌ای را دنبال می‌کنند:

- `cron.failureDestination` یک پیش‌فرض سراسری برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشند و کار از قبل از طریق `announce` تحویل بدهد، اعلان‌های شکست اکنون به همان مقصد announce اصلی بازمی‌گردند.
- `delivery.failureDestination` فقط روی کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار Cron سراسری را وارد هشدارهای تکراریِ اجرای ردشده می‌کند. اجراهای ردشده شمارندهٔ رد شدن متوالی جداگانه‌ای نگه می‌دارند، بنابراین روی backoff خطای اجرا اثر نمی‌گذارند.

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
</Tabs>

## Webhookها

Gateway می‌تواند نقاط پایانی HTTP webhook را برای محرک‌های خارجی در معرض دسترس قرار دهد. در پیکربندی فعال کنید:

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
    یک رویداد سیستمی را برای نشست اصلی در صف قرار دهید:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      توصیف رویداد.
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

    فیلدها: `message` (الزامی)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="hookهای نگاشت‌شده (POST /hooks/<name>)">
    نام‌های hook سفارشی از طریق `hooks.mappings` در پیکربندی حل می‌شوند. نگاشت‌ها می‌توانند payloadهای دلخواه را با قالب‌ها یا تبدیل‌های کد به کنش‌های `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
نقاط پایانی hook را پشت loopback، tailnet یا reverse proxy مورداعتماد نگه دارید.

- از یک توکن اختصاصی hook استفاده کنید؛ از توکن‌های احراز هویت Gateway دوباره استفاده نکنید.
- `hooks.path` را روی یک زیرمسیر اختصاصی نگه دارید؛ `/` رد می‌شود.
- برای محدود کردن مسیریابی صریح `agentId`، `hooks.allowedAgentIds` را تنظیم کنید.
- مگر اینکه به نشست‌های انتخاب‌شده توسط فراخوان نیاز دارید، `hooks.allowRequestSessionKey=false` را نگه دارید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را نیز تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- payloadهای hook به‌طور پیش‌فرض با مرزهای ایمنی پوشانده می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

محرک‌های inbox در Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، hookهای فعال‌شدهٔ OpenClaw، Tailscale برای نقطهٔ پایانی HTTPS عمومی.
</Note>

### راه‌اندازی با wizard (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این فرمان پیکربندی `hooks.gmail` را می‌نویسد، preset مربوط به Gmail را فعال می‌کند، و از Tailscale Funnel برای نقطهٔ پایانی push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام boot فرمان `gog gmail watch serve` را شروع می‌کند و watch را خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

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
یادداشت بازنویسی مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شدهٔ کار را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان ارائه‌دهنده/مدل دقیق به اجرای عامل ایزوله می‌رسد.
- اگر مجاز نباشد یا قابل حل نباشد، cron اجرا را با یک خطای اعتبارسنجی صریح ناموفق می‌کند.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در cron مدل اصلیِ کار است، نه بازنویسی `/model` نشست.
- payload `fallbacks`، fallbackهای پیکربندی‌شده را برای آن کار جایگزین می‌کند؛ `fallbacks: []` fallback را غیرفعال می‌کند و اجرا را سخت‌گیرانه می‌سازد.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان یک مقصد تلاش مجدد اضافیِ بی‌صدا به مدل اصلی عامل عبور نمی‌کند.

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

`maxConcurrentRuns` هم dispatch زمان‌بندی‌شدهٔ cron و هم اجرای نوبت عامل ایزوله را محدود می‌کند. نوبت‌های عامل Cron ایزوله به‌صورت داخلی از مسیر اجرای اختصاصی `cron-nested` صف استفاده می‌کنند، بنابراین افزایش این مقدار باعث می‌شود اجراهای مستقل LLM در cron به‌جای اینکه فقط wrapperهای بیرونی cron خود را شروع کنند، به‌صورت موازی پیش بروند. مسیر مشترک غیر cron یعنی `nested` با این تنظیم گسترش داده نمی‌شود.

sidecar وضعیت runtime از `cron.store` مشتق می‌شود: یک store با پسوند `.json` مانند `~/clawd/cron/jobs.json` از `~/clawd/cron/jobs-state.json` استفاده می‌کند، درحالی‌که مسیر store بدون پسوند `.json`، `-state.json` را اضافه می‌کند.

اگر `jobs.json` را دستی ویرایش می‌کنید، `jobs-state.json` را از کنترل نسخه بیرون نگه دارید. OpenClaw از آن sidecar برای slotهای در انتظار، نشانگرهای فعال، فرادادهٔ آخرین اجرا، و هویت زمان‌بندی استفاده می‌کند که به زمان‌بند می‌گوید چه زمانی یک کار ویرایش‌شده از بیرون به `nextRunAtMs` تازه نیاز دارد.

غیرفعال کردن cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="رفتار retry">
    **retry یک‌باره**: خطاهای گذرا (rate limit، overload، network، server error) تا ۳ بار با backoff نمایی retry می‌شوند. خطاهای دائمی فوراً غیرفعال می‌شوند.

    **retry تکرارشونده**: backoff نمایی (۳۰ ثانیه تا ۶۰ دقیقه) بین retryها. backoff پس از اجرای موفق بعدی reset می‌شود.

  </Accordion>
  <Accordion title="نگهداری">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های نشست اجرای ایزوله را پاک‌سازی می‌کند. `cron.runLog.maxBytes` / `cron.runLog.keepLines` فایل‌های گزارش اجرا را به‌صورت خودکار پاک‌سازی می‌کنند.
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
    - مطمئن شوید Gateway به‌طور پیوسته در حال اجرا است.
    - برای زمان‌بندی‌های `cron`، منطقه زمانی (`--tz`) را در برابر منطقه زمانی میزبان بررسی کنید.
    - `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و کار هنوز موعد اجرا نداشته است.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویلی انجام نشد">
    - حالت تحویل `none` یعنی ارسال جایگزین runner انتظار نمی‌رود. عامل همچنان می‌تواند وقتی مسیر گفت‌وگو در دسترس باشد، مستقیماً با ابزار `message` ارسال کند.
    - نبودن یا نامعتبر بودن مقصد تحویل (`channel`/`to`) یعنی ارسال خروجی رد شده است.
    - برای Matrix، کارهای کپی‌شده یا قدیمی که شناسه اتاق `delivery.to` آن‌ها با حروف کوچک ذخیره شده است ممکن است شکست بخورند، چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس هستند. کار را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی تحویل به‌دلیل اعتبارنامه‌ها مسدود شده است.
    - اگر اجرای ایزوله فقط توکن سکوت (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل خروجی مستقیم و همین‌طور مسیر خلاصه صف‌شده جایگزین را سرکوب می‌کند، بنابراین چیزی به گفت‌وگو ارسال نمی‌شود.
    - اگر عامل باید خودش به کاربر پیام بدهد، بررسی کنید که کار یک مسیر قابل استفاده دارد (`channel: "last"` با یک گفت‌وگوی قبلی، یا یک کانال/مقصد صریح).

  </Accordion>
  <Accordion title="به نظر می‌رسد Cron یا Heartbeat مانع چرخش به سبک /new می‌شود">
    - تازگی بازنشانی روزانه و بیکاری بر پایه `updatedAt` نیست؛ [مدیریت نشست](/fa/concepts/session#session-lifecycle) را ببینید.
    - بیدارباش‌های Cron، اجراهای Heartbeat، اعلان‌های exec و حسابداری Gateway ممکن است ردیف نشست را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی که پیش از وجود این فیلدها ساخته شده‌اند، OpenClaw وقتی فایل همچنان در دسترس باشد می‌تواند `sessionStartedAt` را از سرآیند نشست transcript JSONL بازیابی کند. ردیف‌های بیکار قدیمی بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان مبنای بیکاری خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات حساس منطقه زمانی">
    - Cron بدون `--tz` از منطقه زمانی میزبان gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون منطقه زمانی، UTC در نظر گرفته می‌شوند.
    - `activeHours` در Heartbeat از تفکیک منطقه زمانی پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [اتوماسیون](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — دفتر ثبت کار برای اجراهای cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای نشست اصلی
- [منطقه زمانی](/fa/concepts/timezone) — پیکربندی منطقه زمانی
