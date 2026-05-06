---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارسازی‌ها
    - اتصال محرک‌های خارجی (Webhookها، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhookها و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-05-06T17:52:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. کارها را پایدار نگه می‌دارد، agent را در زمان درست بیدار می‌کند، و می‌تواند خروجی را به یک کانال گفت‌وگو یا نقطهٔ پایانی Webhook تحویل دهد.

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
- تعریف‌های کار در `~/.openclaw/cron/jobs.json` پایدار می‌مانند، بنابراین راه‌اندازی‌های دوباره باعث از دست رفتن زمان‌بندی‌ها نمی‌شوند.
- وضعیت اجرای زمان اجرا کنار آن در `~/.openclaw/cron/jobs-state.json` پایدار می‌ماند. اگر تعریف‌های cron را در git پیگیری می‌کنید، `jobs.json` را پیگیری کنید و `jobs-state.json` را در gitignore بگذارید.
- پس از جداسازی، نسخه‌های قدیمی‌تر OpenClaw می‌توانند `jobs.json` را بخوانند اما ممکن است کارها را تازه در نظر بگیرند، چون فیلدهای زمان اجرا اکنون در `jobs-state.json` قرار دارند.
- وقتی `jobs.json` در حالی که Gateway در حال اجراست یا متوقف است ویرایش می‌شود، OpenClaw فیلدهای زمان‌بندی تغییرکرده را با فرادادهٔ slot زمان اجرای در انتظار مقایسه می‌کند و مقادیر کهنهٔ `nextRunAtMs` را پاک می‌کند. بازنویسی‌هایی که فقط قالب‌بندی یا فقط ترتیب کلیدها را تغییر می‌دهند، slot در انتظار را حفظ می‌کنند.
- همهٔ اجراهای cron رکوردهای [وظیفهٔ پس‌زمینه](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام راه‌اندازی Gateway، کارهای agent-turn ایزولهٔ عقب‌افتاده به جای بازپخش فوری، بیرون از پنجرهٔ اتصال کانال دوباره زمان‌بندی می‌شوند، بنابراین راه‌اندازی Discord/Telegram و تنظیم فرمان‌های بومی پس از راه‌اندازی دوباره پاسخ‌گو می‌مانند.
- کارهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت خودکار حذف می‌شوند.
- اجراهای cron ایزوله پس از پایان اجرا، برگه‌ها/فرایندهای مرورگر پیگیری‌شده برای نشست `cron:<jobId>` خود را به‌صورت best-effort می‌بندند، بنابراین خودکارسازی جداشدهٔ مرورگر فرایندهای یتیم باقی نمی‌گذارد.
- اجراهای cron ایزوله‌ای که مجوز محدود خودپاک‌سازی cron را دریافت می‌کنند همچنان می‌توانند وضعیت زمان‌بند و فهرست خودفیلترشده‌ای از کار فعلی خود را بخوانند، بنابراین بررسی‌های وضعیت/Heartbeat می‌توانند بدون به‌دست آوردن دسترسی گسترده‌تر برای تغییر cron، زمان‌بندی خود را بررسی کنند.
- اجراهای cron ایزوله همچنین در برابر پاسخ‌های تأیید کهنه محافظت می‌کنند. اگر نتیجهٔ اول فقط یک به‌روزرسانی وضعیت موقت باشد (`on it`، `pulling everything together`، و اشاره‌های مشابه) و هیچ اجرای subagent فرزند هنوز مسئول پاسخ نهایی نباشد، OpenClaw پیش از تحویل، یک‌بار دیگر برای نتیجهٔ واقعی prompt می‌کند.
- اجراهای cron ایزوله ابتدا فرادادهٔ ساختاریافتهٔ رد اجرا را از اجرای تعبیه‌شده ترجیح می‌دهند، سپس به نشانگرهای شناخته‌شدهٔ خلاصه/خروجی نهایی مانند `SYSTEM_RUN_DENIED` و `INVALID_REQUEST` عقب‌گرد می‌کنند، بنابراین یک فرمان مسدودشده به‌عنوان اجرای سبز گزارش نمی‌شود.
- اجراهای cron ایزوله همچنین شکست‌های agent در سطح اجرا را حتی وقتی هیچ payload پاسخی تولید نشده باشد، خطای کار در نظر می‌گیرند، بنابراین شکست‌های مدل/ارائه‌دهنده شمارنده‌های خطا را افزایش می‌دهند و به‌جای موفق محسوب کردن کار، اعلان‌های شکست را فعال می‌کنند.
- وقتی یک کار agent-turn ایزوله به `timeoutSeconds` می‌رسد، cron اجرای agent زیرین را abort می‌کند و یک پنجرهٔ کوتاه پاک‌سازی به آن می‌دهد. اگر اجرا تخلیه نشود، پاک‌سازی تحت مالکیت Gateway پیش از ثبت timeout توسط cron، مالکیت نشست آن اجرا را به‌اجبار پاک می‌کند، بنابراین کار گفت‌وگوی صف‌شده پشت یک نشست پردازش کهنه باقی نمی‌ماند.

<a id="maintenance"></a>

<Note>
آشتی وظیفه برای cron ابتدا تحت مالکیت زمان اجراست و سپس با پشتوانهٔ تاریخچهٔ پایدار انجام می‌شود: یک وظیفهٔ cron فعال تا زمانی زنده می‌ماند که زمان اجرای cron همچنان آن کار را در حال اجرا پیگیری کند، حتی اگر یک ردیف نشست فرزند قدیمی هنوز وجود داشته باشد. وقتی زمان اجرا مالکیت کار را متوقف کند و پنجرهٔ مهلت ۵ دقیقه‌ای منقضی شود، بررسی‌های نگه‌داری لاگ‌های اجرای پایدار و وضعیت کار را برای اجرای مطابق `cron:<jobId>:<startedAt>` بررسی می‌کنند. اگر آن تاریخچهٔ پایدار نتیجهٔ پایانی نشان دهد، دفتر وظیفه از روی آن نهایی می‌شود؛ در غیر این صورت نگه‌داری تحت مالکیت Gateway می‌تواند وظیفه را `lost` علامت‌گذاری کند. ممیزی آفلاین CLI می‌تواند از تاریخچهٔ پایدار بازیابی کند، اما مجموعهٔ خالی کارهای فعال درون‌فرایندی خودش را دلیل ناپدید شدن یک اجرای cron تحت مالکیت Gateway در نظر نمی‌گیرد.
</Note>

## انواع زمان‌بندی

| نوع     | پرچم CLI  | توضیح                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp یک‌باره (ISO 8601 یا نسبی مثل `20m`)          |
| `every` | `--every` | بازهٔ ثابت                                              |
| `cron`  | `--cron`  | عبارت cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری     |

timestampهای بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی بر اساس ساعت دیواری محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشوندهٔ ابتدای ساعت به‌طور خودکار تا ۵ دقیقه پراکنده می‌شوند تا جهش‌های بار کاهش یابد. برای اجبار زمان‌بندی دقیق از `--exact` یا برای پنجرهٔ صریح از `--stagger 30s` استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) parse می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته non-wildcard باشند، croner وقتی مطابقت می‌دهد که **هرکدام** از فیلدها مطابق باشد، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw اینجا از رفتار OR پیش‌فرض Croner استفاده می‌کند. برای الزام هر دو شرط، از modifier روز هفتهٔ `+` در Croner (`0 9 15 * +1`) استفاده کنید یا روی یک فیلد زمان‌بندی کنید و دیگری را در prompt یا فرمان کارتان guard کنید.

## سبک‌های اجرا

| سبک             | مقدار `--session`   | اجرا در                  | مناسب برای                         |
| --------------- | ------------------- | ------------------------ | ---------------------------------- |
| نشست اصلی       | `main`              | نوبت Heartbeat بعدی      | یادآورها، رویدادهای سیستمی         |
| ایزوله          | `isolated`          | `cron:<jobId>` اختصاصی   | گزارش‌ها، کارهای پس‌زمینه          |
| نشست فعلی       | `current`           | وابسته در زمان ایجاد     | کار تکرارشوندهٔ آگاه از زمینه      |
| نشست سفارشی     | `session:custom-id` | نشست نام‌دار پایدار      | گردش‌کارهایی که بر تاریخچه بنا می‌شوند |

<AccordionGroup>
  <Accordion title="نشست اصلی در برابر ایزوله در برابر سفارشی">
    کارهای **نشست اصلی** یک رویداد سیستمی را در صف می‌گذارند و به‌صورت اختیاری Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن رویدادهای سیستمی تازگی reset روزانه/بیکاری را برای نشست هدف تمدید نمی‌کنند. کارهای **ایزوله** یک agent turn اختصاصی را با نشست تازه اجرا می‌کنند. **نشست‌های سفارشی** (`session:xxx`) زمینه را بین اجراها پایدار نگه می‌دارند و گردش‌کارهایی مانند standupهای روزانه را ممکن می‌کنند که بر خلاصه‌های قبلی بنا می‌شوند.
  </Accordion>
  <Accordion title="معنای «نشست تازه» برای کارهای ایزوله">
    برای کارهای ایزوله، «نشست تازه» یعنی یک transcript/session id جدید برای هر اجرا. OpenClaw ممکن است ترجیح‌های ایمن مانند تنظیمات thinking/fast/verbose، برچسب‌ها، و overrideهای صریح مدل/احراز هویت انتخاب‌شده توسط کاربر را حمل کند، اما زمینهٔ گفت‌وگوی محیطی را از یک ردیف cron قدیمی به ارث نمی‌برد: مسیریابی کانال/گروه، سیاست ارسال یا صف، elevation، origin، یا binding زمان اجرای ACP. وقتی یک کار تکرارشونده باید عمداً بر همان زمینهٔ گفت‌وگو بنا شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="پاک‌سازی زمان اجرا">
    برای کارهای ایزوله، teardown زمان اجرا اکنون شامل پاک‌سازی best-effort مرورگر برای آن نشست cron است. شکست‌های پاک‌سازی نادیده گرفته می‌شوند تا نتیجهٔ واقعی cron همچنان اولویت داشته باشد.

    اجراهای cron ایزوله همچنین هر نمونهٔ زمان اجرای MCP باندل‌شده‌ای را که برای کار ایجاد شده باشد از مسیر مشترک پاک‌سازی زمان اجرا dispose می‌کنند. این با شیوهٔ teardown کلاینت‌های MCP نشست اصلی و نشست سفارشی هم‌خوان است، بنابراین کارهای cron ایزوله فرایندهای فرزند stdio یا اتصال‌های MCP بلندعمر را بین اجراها نشت نمی‌دهند.

  </Accordion>
  <Accordion title="تحویل subagent و Discord">
    وقتی اجراهای cron ایزوله subagentها را هماهنگ می‌کنند، تحویل نیز خروجی نهایی فرزند را بر متن موقت کهنهٔ والد ترجیح می‌دهد. اگر فرزندان هنوز در حال اجرا باشند، OpenClaw به‌جای اعلام آن، آن به‌روزرسانی جزئی والد را سرکوب می‌کند.

    برای هدف‌های اعلان Discord فقط-متن، OpenClaw متن نهایی canonical assistant را یک‌بار می‌فرستد، به‌جای اینکه هم payloadهای متنی streamed/میانی و هم پاسخ نهایی را بازپخش کند. payloadهای رسانه‌ای و ساختاریافتهٔ Discord همچنان به‌عنوان payloadهای جداگانه تحویل داده می‌شوند تا پیوست‌ها و components حذف نشوند.

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
  override سطح تفکر.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تزریق فایل bootstrap فضای کاری را رد کنید.
</ParamField>
<ParamField path="--tools" type="string">
  محدود کنید کار از کدام ابزارها می‌تواند استفاده کند، برای مثال `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی آن کار استفاده می‌کند. این با override نشست گفت‌وگوی `/model` یکسان نیست: زنجیره‌های fallback پیکربندی‌شده همچنان وقتی مدل اصلی کار شکست بخورد اعمال می‌شوند. اگر مدل درخواستی مجاز نباشد یا resolve نشود، cron اجرا را با خطای اعتبارسنجی صریح شکست می‌دهد، به‌جای اینکه بی‌صدا به انتخاب مدل agent/پیش‌فرض کار fallback کند.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. وقتی وجود داشته باشد، آن فهرست جایگزین زنجیرهٔ fallback پیکربندی‌شده برای کار می‌شود. وقتی اجرای cron سخت‌گیرانه‌ای می‌خواهید که فقط مدل انتخاب‌شده را امتحان کند، در payload/API کار از `fallbacks: []` استفاده کنید. اگر کاری `--model` داشته باشد اما نه fallbackهای payload و نه fallbackهای پیکربندی‌شده، OpenClaw یک override fallback خالی صریح پاس می‌دهد تا primary متعلق به agent به‌عنوان هدف retry اضافی پنهان اضافه نشود.

اولویت انتخاب مدل برای کارهای ایزوله چنین است:

1. override مدل hook Gmail (وقتی اجرا از Gmail آمده باشد و آن override مجاز باشد)
2. `model` در payload هر کار
3. override مدل ذخیره‌شدهٔ نشست cron انتخاب‌شده توسط کاربر
4. انتخاب مدل agent/پیش‌فرض

حالت سریع نیز از انتخاب زندهٔ resolve‌شده پیروی می‌کند. اگر پیکربندی مدل انتخاب‌شده `params.fastMode` داشته باشد، cron ایزوله به‌طور پیش‌فرض از آن استفاده می‌کند. override ذخیره‌شدهٔ نشست `fastMode` همچنان در هر دو جهت بر پیکربندی غلبه می‌کند.

اگر یک اجرای ایزوله به handoff تغییر مدل زنده برسد، cron با provider/model تغییریافته retry می‌کند و پیش از retry، آن انتخاب زنده را برای اجرای فعال پایدار می‌کند. وقتی تغییر همچنین یک profile احراز هویت جدید حمل کند، cron آن override profile احراز هویت را نیز برای اجرای فعال پایدار می‌کند. retryها محدود هستند: پس از تلاش اولیه به‌علاوهٔ ۲ retry تغییر، cron به‌جای حلقهٔ بی‌پایان abort می‌کند.

پیش از آنکه یک اجرای cron ایزوله وارد agent runner شود، OpenClaw نقطه‌های پایانی provider محلی قابل‌دسترسی را برای providerهای پیکربندی‌شدهٔ `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها local loopback، private-network، یا `.local` است بررسی می‌کند. اگر آن نقطهٔ پایانی down باشد، اجرا به‌جای شروع فراخوانی مدل، با خطای واضح provider/model به‌عنوان `skipped` ثبت می‌شود. نتیجهٔ نقطهٔ پایانی برای ۵ دقیقه cache می‌شود، بنابراین بسیاری از کارهای موعدرسیده که از همان سرور محلی dead Ollama، vLLM، SGLang، یا LM Studio استفاده می‌کنند به‌جای ایجاد طوفان درخواست، یک probe کوچک مشترک دارند. اجراهای provider-preflight ردشده backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های skip تکراری می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | چه اتفاقی می‌افتد                                                |
| ---------- | ----------------------------------------------------------------- |
| `announce` | اگر agent ارسال نکرد، متن نهایی را به هدف fallback-deliver می‌کند |
| `webhook`  | payload رویداد پایان‌یافته را به یک URL POST می‌کند              |
| `none`     | تحویل fallback runner انجام نمی‌شود                               |

از `--announce --channel telegram --to "-1001234567890"` برای تحویل به کانال استفاده کنید. برای موضوعات انجمن Telegram، از `-1001234567890:topic:123` استفاده کنید؛ فراخوان‌های مستقیم RPC/پیکربندی همچنین می‌توانند `delivery.threadId` را به‌صورت رشته یا عدد ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های اتاق Matrix به حروف بزرگ و کوچک حساس هستند؛ از شناسه دقیق اتاق یا قالب `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل announce از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، یک مقصد دارای پیشوند ارائه‌دهنده مانند `telegram:123` می‌تواند پیش از آن‌که Cron به تاریخچه نشست یا یک کانال پیکربندی‌شده واحد بازگردد، کانال را انتخاب کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است انتخاب‌گر ارائه‌دهنده هستند. اگر `delivery.channel` صریح باشد، پیشوند مقصد باید همان ارائه‌دهنده را نام ببرد؛ برای مثال، `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود، به‌جای آن‌که اجازه دهد WhatsApp شناسه Telegram را به‌عنوان شماره تلفن تفسیر کند. پیشوندهای نوع مقصد و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>`، و `sms:<number>` همچنان نحو مقصد متعلق به کانال هستند، نه انتخاب‌گر ارائه‌دهنده.

برای کارهای ایزوله، تحویل چت مشترک است. اگر مسیر چت در دسترس باشد، عامل می‌تواند حتی وقتی کار از `--no-deliver` استفاده می‌کند از ابزار `message` استفاده کند. اگر عامل به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw announce جایگزین را نادیده می‌گیرد. در غیر این صورت `announce`، `webhook`، و `none` فقط کنترل می‌کنند runner پس از نوبت عامل با پاسخ نهایی چه می‌کند.

وقتی یک عامل از یک چت فعال یک یادآور ایزوله ایجاد می‌کند، OpenClaw مقصد زنده تحویل حفظ‌شده را برای مسیر announce جایگزین ذخیره می‌کند. کلیدهای نشست داخلی ممکن است با حروف کوچک باشند؛ وقتی زمینه چت فعلی در دسترس است، مقصدهای تحویل ارائه‌دهنده از آن کلیدها بازسازی نمی‌شوند.

تحویل announce ضمنی از فهرست‌های مجاز کانال پیکربندی‌شده برای اعتبارسنجی و مسیردهی مجدد مقصدهای کهنه استفاده می‌کند. تاییدهای pairing-store پیام مستقیم دریافت‌کنندگان خودکارسازی جایگزین نیستند؛ وقتی یک کار زمان‌بندی‌شده باید فعالانه به یک پیام مستقیم ارسال کند، `delivery.to` را تنظیم کنید یا ورودی `allowFrom` کانال را پیکربندی کنید.

اعلان‌های شکست مسیر مقصد جداگانه‌ای را دنبال می‌کنند:

- `cron.failureDestination` یک پیش‌فرض سراسری برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشند و کار از قبل از طریق `announce` تحویل دهد، اعلان‌های شکست اکنون به همان مقصد announce اصلی بازمی‌گردند.
- `delivery.failureDestination` فقط روی کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر آن‌که حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` سیاست هشدار Cron سراسری یا یک کار را برای هشدارهای تکراری اجرای ردشده فعال می‌کند. اجراهای ردشده شمارنده ردشدن پیاپی جداگانه‌ای نگه می‌دارند، بنابراین روی backoff خطای اجرا اثر نمی‌گذارند.

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

Gateway می‌تواند نقطه‌های پایانی HTTP Webhook را برای محرک‌های خارجی در معرض دسترس قرار دهد. در پیکربندی فعال کنید:

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
      توضیح رویداد.
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
    نام‌های hook سفارشی از طریق `hooks.mappings` در پیکربندی حل می‌شوند. نگاشت‌ها می‌توانند payloadهای دلخواه را با الگوها یا تبدیل‌های کدی به کنش‌های `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
نقطه‌های پایانی hook را پشت loopback، tailnet، یا reverse proxy مورد اعتماد نگه دارید.

- از یک توکن hook اختصاصی استفاده کنید؛ از توکن‌های احراز هویت gateway دوباره استفاده نکنید.
- `hooks.path` را روی یک زیرمسیر اختصاصی نگه دارید؛ `/` رد می‌شود.
- برای محدود کردن مسیردهی صریح `agentId`، `hooks.allowedAgentIds` را تنظیم کنید.
- مگر آن‌که به نشست‌های انتخاب‌شده توسط فراخوان نیاز دارید، `hooks.allowRequestSessionKey=false` را نگه دارید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، همچنین `hooks.allowedSessionKeyPrefixes` را تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- payloadهای hook به‌طور پیش‌فرض با مرزهای ایمنی بسته‌بندی می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

محرک‌های صندوق ورودی Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، hookهای OpenClaw فعال، Tailscale برای نقطه پایانی عمومی HTTPS.
</Note>

### راه‌اندازی با ویزارد (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این کار پیکربندی `hooks.gmail` را می‌نویسد، preset مربوط به Gmail را فعال می‌کند، و از Tailscale Funnel برای نقطه پایانی push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام راه‌اندازی `gog gmail watch serve` را شروع می‌کند و watch را خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="انتخاب پروژه GCP">
    پروژه GCP مالک کلاینت OAuth استفاده‌شده توسط `gog` را انتخاب کنید:

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
نکته بازنویسی مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شده کار را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان provider/model دقیق به اجرای عامل ایزوله می‌رسد.
- اگر مجاز نباشد یا قابل حل نباشد، Cron اجرا را با یک خطای اعتبارسنجی صریح ناموفق می‌کند.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در Cron مدل اصلی کار است، نه بازنویسی `/model` نشست.
- payload `fallbacks` جایگزین fallbackهای پیکربندی‌شده برای آن کار می‌شود؛ `fallbacks: []` fallback را غیرفعال می‌کند و اجرا را strict می‌سازد.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان یک مقصد retry اضافی خاموش به مدل اصلی عامل سرریز نمی‌کند.

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

`maxConcurrentRuns` هم اعزام Cron زمان‌بندی‌شده و هم اجرای نوبت عامل ایزوله را محدود می‌کند. نوبت‌های عامل Cron ایزوله به‌صورت داخلی از lane اجرای اختصاصی صف با نام `cron-nested` استفاده می‌کنند، بنابراین افزایش این مقدار اجازه می‌دهد اجراهای LLM مستقل Cron به‌صورت موازی پیش بروند، به‌جای آن‌که فقط wrapperهای بیرونی Cron آن‌ها شروع شوند. lane مشترک غیر-Cron با نام `nested` با این تنظیم گسترش نمی‌یابد.

sidecar وضعیت runtime از `cron.store` مشتق می‌شود: یک store با پسوند `.json` مانند `~/clawd/cron/jobs.json` از `~/clawd/cron/jobs-state.json` استفاده می‌کند، در حالی که یک مسیر store بدون پسوند `.json`، `-state.json` را اضافه می‌کند.

اگر `jobs.json` را دستی ویرایش می‌کنید، `jobs-state.json` را از source control بیرون نگه دارید. OpenClaw از آن sidecar برای slotهای pending، نشانگرهای active، فراداده آخرین اجرا، و هویت زمان‌بندی استفاده می‌کند که به scheduler می‌گوید چه زمانی یک کار ویرایش‌شده بیرونی به `nextRunAtMs` تازه نیاز دارد.

غیرفعال کردن Cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="رفتار retry">
    **retry یک‌باره**: خطاهای گذرا (rate limit، overload، network، server error) تا ۳ بار با backoff نمایی retry می‌شوند. خطاهای دائمی بلافاصله غیرفعال می‌شوند.

    **retry تکرارشونده**: backoff نمایی (۳۰ ثانیه تا ۶۰ دقیقه) بین retryها. backoff پس از اجرای موفق بعدی بازنشانی می‌شود.

  </Accordion>
  <Accordion title="نگهداشت">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های نشست اجرای ایزوله را هرس می‌کند. `cron.runLog.maxBytes` / `cron.runLog.keepLines` فایل‌های run-log را خودکار هرس می‌کنند.
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
    - تایید کنید Gateway به‌طور پیوسته در حال اجرا است.
    - برای زمان‌بندی‌های `cron`، timezone (`--tz`) را در برابر timezone میزبان بررسی کنید.
    - `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و کار هنوز سررسید نشده بود.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویلی انجام نشد">
    - حالت تحویل `none` یعنی ارسال جایگزین runner انتظار نمی‌رود. عامل همچنان می‌تواند وقتی مسیر گفت‌وگو در دسترس است، مستقیماً با ابزار `message` ارسال کند.
    - نبودن/نامعتبر بودن مقصد تحویل (`channel`/`to`) یعنی خروجی رد شد.
    - برای Matrix، کارهای کپی‌شده یا قدیمی با شناسه‌های اتاق `delivery.to` که با حروف کوچک نوشته شده‌اند ممکن است شکست بخورند، چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند. کار را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی تحویل توسط اعتبارنامه‌ها مسدود شده است.
    - اگر اجرای ایزوله فقط توکن بی‌صدا (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل خروجی مستقیم و همچنین مسیر خلاصه صف‌شده جایگزین را سرکوب می‌کند، بنابراین چیزی به گفت‌وگو ارسال نمی‌شود.
    - اگر عامل باید خودش به کاربر پیام بدهد، بررسی کنید که کار یک مسیر قابل استفاده داشته باشد (`channel: "last"` با یک گفت‌وگوی قبلی، یا یک کانال/مقصد صریح).

  </Accordion>
  <Accordion title="به نظر می‌رسد Cron یا Heartbeat از چرخش /new-style جلوگیری می‌کند">
    - تازگی بازنشانی روزانه و بیکار بر پایه `updatedAt` نیست؛ [مدیریت نشست](/fa/concepts/session#session-lifecycle) را ببینید.
    - بیدارباش‌های Cron، اجراهای Heartbeat، اعلان‌های exec، و ثبت‌های دفتری gateway ممکن است ردیف نشست را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی که پیش از وجود این فیلدها ساخته شده‌اند، OpenClaw می‌تواند وقتی فایل هنوز در دسترس است، `sessionStartedAt` را از سربرگ نشست transcript JSONL بازیابی کند. ردیف‌های بیکار قدیمی بدون `lastInteractionAt` از آن زمان شروع بازیابی‌شده به‌عنوان مبنای بیکاری خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات دردسرساز منطقه زمانی">
    - Cron بدون `--tz` از منطقه زمانی میزبان gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون منطقه زمانی، UTC در نظر گرفته می‌شوند.
    - `activeHours` در Heartbeat از تفکیک منطقه زمانی پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [اتوماسیون و کارها](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — دفتر کل کار برای اجراهای cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای نشست اصلی
- [منطقه زمانی](/fa/concepts/timezone) — پیکربندی منطقه زمانی
