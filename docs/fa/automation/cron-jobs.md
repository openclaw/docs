---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارسازی‌ها
    - اتصال محرک‌های خارجی (Webhook‌ها، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhookها، و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-05-07T01:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. کارها را پایدار نگه می‌دارد، agent را در زمان درست بیدار می‌کند و می‌تواند خروجی را به یک کانال چت یا نقطه پایانی Webhook تحویل دهد.

## شروع سریع

<Steps>
  <Step title="Add a one-shot reminder">
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
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron چگونه کار می‌کند

- Cron **داخل فرایند Gateway** اجرا می‌شود (نه داخل مدل).
- تعریف‌های کار در `~/.openclaw/cron/jobs.json` پایدار می‌مانند تا با راه‌اندازی دوباره، زمان‌بندی‌ها از دست نروند.
- وضعیت اجرای زمان اجرا در کنار آن، در `~/.openclaw/cron/jobs-state.json` پایدار می‌ماند. اگر تعریف‌های cron را در git دنبال می‌کنید، `jobs.json` را دنبال کنید و `jobs-state.json` را در gitignore بگذارید.
- پس از جداسازی، نسخه‌های قدیمی‌تر OpenClaw می‌توانند `jobs.json` را بخوانند، اما ممکن است کارها را تازه در نظر بگیرند چون فیلدهای زمان اجرا اکنون در `jobs-state.json` قرار دارند.
- وقتی `jobs.json` در حالی ویرایش می‌شود که Gateway در حال اجرا یا متوقف است، OpenClaw فیلدهای زمان‌بندی تغییرکرده را با فراداده اسلات زمان اجرای در انتظار مقایسه می‌کند و مقدارهای کهنه `nextRunAtMs` را پاک می‌کند. بازنویسی‌های صرفا مربوط به قالب‌بندی یا فقط ترتیب کلیدها، اسلات در انتظار را حفظ می‌کنند.
- همه اجرای‌های cron رکوردهای [کار پس‌زمینه](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام راه‌اندازی Gateway، کارهای agent-turn ایزوله که موعدشان گذشته است، به‌جای بازپخش فوری، خارج از پنجره اتصال کانال دوباره زمان‌بندی می‌شوند تا راه‌اندازی Discord/Telegram و تنظیم فرمان‌های بومی پس از راه‌اندازی‌های دوباره پاسخ‌گو بماند.
- کارهای تک‌مرحله‌ای (`--at`) به‌طور پیش‌فرض پس از موفقیت، خودکار حذف می‌شوند.
- اجرای‌های cron ایزوله پس از کامل شدن اجرا، به‌صورت بهترین تلاش تب‌ها/فرایندهای مرورگر رهگیری‌شده را برای نشست `cron:<jobId>` خود می‌بندند تا اتوماسیون مرورگر جداشده فرایندهای بی‌صاحب باقی نگذارد.
- اجرای‌های cron ایزوله که مجوز محدود پاک‌سازی خودکار cron را دریافت می‌کنند، همچنان می‌توانند وضعیت زمان‌بند و فهرست خودفیلترشده‌ای از کار فعلی خود را بخوانند؛ بنابراین بررسی‌های وضعیت/Heartbeat می‌توانند زمان‌بندی خودشان را بدون دسترسی گسترده‌تر برای تغییر cron بررسی کنند.
- اجرای‌های cron ایزوله همچنین در برابر پاسخ‌های تأیید کهنه محافظت می‌کنند. اگر نتیجه اول فقط یک به‌روزرسانی وضعیت موقت باشد (`on it`، `pulling everything together` و راهنماهای مشابه) و هیچ اجرای subagent فرزند همچنان مسئول پاسخ نهایی نباشد، OpenClaw پیش از تحویل، یک‌بار دیگر برای نتیجه واقعی درخواست می‌دهد.
- اجرای‌های cron ایزوله ابتدا فراداده ساختاریافته انکار اجرا را از اجرای درون‌ساخت ترجیح می‌دهند، سپس به نشانگرهای شناخته‌شده خلاصه/خروجی نهایی مانند `SYSTEM_RUN_DENIED` و `INVALID_REQUEST` برمی‌گردند؛ بنابراین یک فرمان مسدودشده به‌عنوان اجرای موفق گزارش نمی‌شود.
- اجرای‌های cron ایزوله همچنین خطاهای agent در سطح اجرا را حتی وقتی هیچ payload پاسخی تولید نشده باشد، خطای کار تلقی می‌کنند؛ بنابراین خطاهای مدل/ارائه‌دهنده شمارنده‌های خطا را افزایش می‌دهند و به‌جای پاک کردن کار به‌عنوان موفق، اعلان‌های شکست را فعال می‌کنند.
- وقتی یک کار agent-turn ایزوله به `timeoutSeconds` می‌رسد، cron اجرای agent زیرین را لغو می‌کند و یک پنجره کوتاه برای پاک‌سازی به آن می‌دهد. اگر اجرا تخلیه نشود، پاک‌سازیِ متعلق به Gateway پیش از ثبت timeout توسط cron، مالکیت نشست آن اجرا را به‌اجبار پاک می‌کند تا کار چت صف‌شده پشت یک نشست پردازش کهنه باقی نماند.

<a id="maintenance"></a>

<Note>
آشتی‌دهی کار برای cron ابتدا متعلق به زمان اجرا و سپس متکی به تاریخچه پایدار است: یک کار cron فعال تا زمانی زنده می‌ماند که زمان اجرای cron همچنان آن کار را در حال اجرا رهگیری کند، حتی اگر یک ردیف نشست فرزند قدیمی هنوز وجود داشته باشد. وقتی زمان اجرا دیگر مالک کار نباشد و پنجره مهلت ۵ دقیقه‌ای منقضی شود، نگه‌داری لاگ‌های اجرای پایدارشده و وضعیت کار را برای اجرای متناظر `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن تاریخچه پایدار یک نتیجه پایانی نشان دهد، دفتر کار از روی آن نهایی می‌شود؛ در غیر این صورت نگه‌داریِ متعلق به Gateway می‌تواند کار را `lost` علامت‌گذاری کند. ممیزی CLI آفلاین می‌تواند از تاریخچه پایدار بازیابی کند، اما مجموعه خالی کارهای فعال درون‌فرایندی خودش را به‌عنوان اثبات از بین رفتن اجرای cron متعلق به Gateway تلقی نمی‌کند.
</Note>

## انواع زمان‌بندی

| نوع     | پرچم CLI  | توضیح                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp تک‌مرحله‌ای (ISO 8601 یا نسبی مانند `20m`)    |
| `every` | `--every` | بازه ثابت                                               |
| `cron`  | `--cron`  | عبارت cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری      |

timestampهای بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی بر اساس ساعت دیواری محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشونده ابتدای ساعت به‌طور خودکار تا حداکثر ۵ دقیقه پخش می‌شوند تا جهش‌های بار کاهش یابد. برای اجبار زمان‌بندی دقیق از `--exact` یا برای یک پنجره صریح از `--stagger 30s` استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) تجزیه می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته غیر wildcard باشند، croner زمانی تطبیق می‌دهد که **هرکدام** از فیلدها تطبیق کند، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این کار به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw در اینجا از رفتار پیش‌فرض OR در Croner استفاده می‌کند. برای الزام هر دو شرط، از اصلاح‌گر روز هفته `+` در Croner (`0 9 15 * +1`) استفاده کنید، یا روی یک فیلد زمان‌بندی کنید و فیلد دیگر را در prompt یا فرمان کار خود guard کنید.

## سبک‌های اجرا

| سبک             | مقدار `--session`   | اجرا در                  | مناسب برای                     |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| نشست اصلی       | `main`              | نوبت Heartbeat بعدی      | یادآورها، رویدادهای سیستم      |
| ایزوله          | `isolated`          | `cron:<jobId>` اختصاصی   | گزارش‌ها، کارهای پس‌زمینه      |
| نشست فعلی       | `current`           | متصل‌شده هنگام ایجاد     | کارهای تکرارشونده آگاه از زمینه |
| نشست سفارشی     | `session:custom-id` | نشست نام‌دار پایدار      | workflowهایی که بر تاریخچه بنا می‌شوند |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    کارهای **نشست اصلی** یک رویداد سیستم را در صف می‌گذارند و به‌صورت اختیاری Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). این رویدادهای سیستم تازگی بازنشانی روزانه/بیکار را برای نشست هدف تمدید نمی‌کنند. کارهای **ایزوله** یک نوبت agent اختصاصی را با نشستی تازه اجرا می‌کنند. **نشست‌های سفارشی** (`session:xxx`) زمینه را در میان اجراها پایدار نگه می‌دارند و workflowهایی مانند standupهای روزانه را ممکن می‌کنند که بر خلاصه‌های قبلی بنا می‌شوند.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    برای کارهای ایزوله، «نشست تازه» یعنی یک transcript/session id جدید برای هر اجرا. OpenClaw ممکن است ترجیح‌های ایمن مانند تنظیمات thinking/fast/verbose، برچسب‌ها، و overrideهای مدل/auth صریحا انتخاب‌شده توسط کاربر را همراه ببرد، اما زمینه مکالمه محیطی را از یک ردیف cron قدیمی به ارث نمی‌برد: مسیریابی channel/group، سیاست send یا queue، elevation، origin، یا اتصال زمان اجرای ACP. وقتی یک کار تکرارشونده باید عمدا بر همان زمینه مکالمه بنا شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="Runtime cleanup">
    برای کارهای ایزوله، teardown زمان اجرا اکنون شامل پاک‌سازی مرورگر به‌صورت بهترین تلاش برای آن نشست cron است. شکست‌های پاک‌سازی نادیده گرفته می‌شوند تا نتیجه واقعی cron همچنان اولویت داشته باشد.

    اجرای‌های cron ایزوله همچنین هر نمونه زمان اجرای MCP همراه‌شده را که برای کار از مسیر مشترک پاک‌سازی زمان اجرا ایجاد شده است، dispose می‌کنند. این با نحوه tear down شدن clientهای MCP نشست اصلی و نشست سفارشی هم‌خوان است، بنابراین کارهای cron ایزوله فرایندهای فرزند stdio یا اتصال‌های MCP دیرپا را بین اجراها نشت نمی‌دهند.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    وقتی اجرای‌های cron ایزوله subagentها را هماهنگ می‌کنند، تحویل نیز خروجی نهایی فرزند را بر متن موقت کهنه والد ترجیح می‌دهد. اگر فرزندان هنوز در حال اجرا باشند، OpenClaw آن به‌روزرسانی ناقص والد را به‌جای اعلام کردن، سرکوب می‌کند.

    برای هدف‌های اعلام Discord فقط متنی، OpenClaw متن نهایی canonical دستیار را یک‌بار ارسال می‌کند، به‌جای اینکه هم payloadهای متنی streamed/intermediate و هم پاسخ نهایی را بازپخش کند. payloadهای رسانه‌ای و ساختاریافته Discord همچنان به‌صورت payloadهای جداگانه تحویل داده می‌شوند تا پیوست‌ها و مؤلفه‌ها حذف نشوند.

  </Accordion>
</AccordionGroup>

### گزینه‌های payload برای کارهای ایزوله

<ParamField path="--message" type="string" required>
  متن prompt (برای ایزوله لازم است).
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
  ابزارهایی را که کار می‌تواند استفاده کند محدود می‌کند، برای نمونه `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی آن کار استفاده می‌کند. این با override `/model` نشست چت یکسان نیست: زنجیره‌های fallback پیکربندی‌شده همچنان وقتی مدل اصلی کار شکست بخورد اعمال می‌شوند. اگر مدل درخواست‌شده مجاز نباشد یا قابل resolve نباشد، cron اجرا را با یک خطای اعتبارسنجی صریح شکست می‌دهد، به‌جای اینکه بی‌صدا به انتخاب مدل agent/پیش‌فرض کار fallback کند.

اگر ورودی‌های قدیمی‌تر یا دستی‌ویرایش‌شده `jobs.json` مقدار `payload.model` را به‌صورت `"default"`، `"null"`، یک رشته خالی، یا JSON `null` ذخیره کرده‌اند، `openclaw doctor --fix` را اجرا کنید. Doctor این sentinelهای override پایدارشده نامعتبر را حذف می‌کند؛ زمان اجرا از آن‌ها به‌عنوان aliasهای fallback پشتیبانی نمی‌کند. برای استفاده از انتخاب عادی مدل agent/پیش‌فرض، فیلد مدل را حذف کنید.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. وقتی وجود داشته باشد، آن فهرست زنجیره fallback پیکربندی‌شده برای کار را جایگزین می‌کند. وقتی یک اجرای cron سخت‌گیرانه می‌خواهید که فقط مدل انتخاب‌شده را امتحان کند، از `fallbacks: []` در payload/API کار استفاده کنید. اگر کاری `--model` داشته باشد اما fallbackهای payload یا پیکربندی‌شده نداشته باشد، OpenClaw یک override fallback خالی صریح پاس می‌دهد تا مدل اصلی agent به‌عنوان هدف retry اضافی پنهان اضافه نشود.

اولویت انتخاب مدل برای کارهای ایزوله چنین است:

1. override مدل hook جیمیل (وقتی اجرا از جیمیل آمده باشد و آن override مجاز باشد)
2. `model` در payload هر کار
3. override مدل ذخیره‌شده نشست cron انتخاب‌شده توسط کاربر
4. انتخاب مدل agent/پیش‌فرض

حالت سریع نیز از انتخاب زنده resolveشده پیروی می‌کند. اگر پیکربندی مدل انتخاب‌شده `params.fastMode` داشته باشد، cron ایزوله به‌طور پیش‌فرض از آن استفاده می‌کند. override ذخیره‌شده `fastMode` نشست همچنان در هر دو جهت بر پیکربندی مقدم است.

اگر یک اجرای ایزوله به handoff تعویض مدل زنده برخورد کند، cron با provider/model تعویض‌شده retry می‌کند و پیش از retry، آن انتخاب زنده را برای اجرای فعال پایدار می‌کند. وقتی تعویض یک نمایه auth جدید هم همراه داشته باشد، cron آن override نمایه auth را نیز برای اجرای فعال پایدار می‌کند. retryها محدودند: پس از تلاش اولیه به‌اضافه ۲ retry تعویض، cron به‌جای حلقه بی‌پایان abort می‌کند.

پیش از ورود یک اجرای cron ایزوله به runner agent، OpenClaw نقطه‌های پایانی ارائه‌دهنده محلی قابل دسترس را برای ارائه‌دهنده‌های پیکربندی‌شده `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها loopback، شبکه خصوصی، یا `.local` است بررسی می‌کند. اگر آن نقطه پایانی قطع باشد، اجرا به‌جای شروع یک فراخوانی مدل، با خطای روشن provider/model به‌صورت `skipped` ثبت می‌شود. نتیجه نقطه پایانی به مدت ۵ دقیقه cache می‌شود، بنابراین بسیاری از کارهای موعددار که از همان سرور محلی Ollama، vLLM، SGLang، یا LM Studio خاموش استفاده می‌کنند، به‌جای ایجاد طوفان درخواست، یک probe کوچک مشترک دارند. اجراهای provider-preflight ردشده backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های رد شدن تکراری می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | چه اتفاقی می‌افتد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر عامل ارسال نکرده باشد، متن نهایی را به‌عنوان تحویل پشتیبان به مقصد می‌رساند |
| `webhook`  | بار دادهٔ رویداد پایان‌یافته را با POST به یک URL می‌فرستد                                |
| `none`     | هیچ تحویل پشتیبان از سوی اجراکننده انجام نمی‌شود                                         |

برای تحویل کانالی از `--announce --channel telegram --to "-1001234567890"` استفاده کنید. برای موضوعات انجمن Telegram، از `-1001234567890:topic:123` استفاده کنید؛ فراخوان‌های مستقیم RPC/config همچنین می‌توانند `delivery.threadId` را به‌صورت رشته یا عدد ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند؛ از شناسهٔ دقیق اتاق یا شکل `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل اعلام از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، مقصدی با پیشوند ارائه‌دهنده مانند `telegram:123` می‌تواند پیش از آنکه cron به تاریخچهٔ نشست یا یک کانال پیکربندی‌شدهٔ واحد برگردد، کانال را انتخاب کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است، انتخاب‌گر ارائه‌دهنده هستند. اگر `delivery.channel` صریح باشد، پیشوند مقصد باید همان ارائه‌دهنده را نام ببرد؛ برای مثال، `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود، نه اینکه به WhatsApp اجازه دهد شناسهٔ Telegram را به‌عنوان شمارهٔ تلفن تفسیر کند. پیشوندهای نوع مقصد و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>` و `sms:<number>` همچنان نحو مقصد تحت مالکیت کانال هستند، نه انتخاب‌گر ارائه‌دهنده.

برای کارهای ایزوله، تحویل چت مشترک است. اگر یک مسیر چت در دسترس باشد، عامل حتی وقتی کار از `--no-deliver` استفاده می‌کند می‌تواند از ابزار `message` استفاده کند. اگر عامل به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلام پشتیبان را رد می‌کند. در غیر این صورت `announce`، `webhook` و `none` فقط کنترل می‌کنند اجراکننده پس از نوبت عامل با پاسخ نهایی چه می‌کند.

وقتی یک عامل از یک چت فعال یک یادآور ایزوله ایجاد می‌کند، OpenClaw مقصد تحویل زندهٔ حفظ‌شده را برای مسیر اعلام پشتیبان ذخیره می‌کند. کلیدهای نشست داخلی ممکن است با حروف کوچک باشند؛ وقتی زمینهٔ چت فعلی در دسترس است، مقصدهای تحویل ارائه‌دهنده از آن کلیدها بازسازی نمی‌شوند.

تحویل اعلام ضمنی از فهرست‌های مجاز کانال پیکربندی‌شده برای اعتبارسنجی و مسیریابی دوبارهٔ مقصدهای قدیمی استفاده می‌کند. تأییدهای مخزن جفت‌سازی DM گیرندگان اتوماسیون پشتیبان نیستند؛ وقتی یک کار زمان‌بندی‌شده باید به‌صورت پیش‌دستانه به یک DM ارسال کند، `delivery.to` را تنظیم کنید یا ورودی `allowFrom` کانال را پیکربندی کنید.

اعلان‌های شکست از مسیر مقصد جداگانه‌ای پیروی می‌کنند:

- `cron.failureDestination` یک پیش‌فرض سراسری برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و کار از قبل از طریق `announce` تحویل دهد، اعلان‌های شکست اکنون به همان مقصد اصلی اعلام برمی‌گردند.
- `delivery.failureDestination` فقط در کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار سراسری cron را وارد هشدارهای تکراری اجرای ردشده می‌کند. اجراهای ردشده شمارندهٔ رد متوالی جداگانه‌ای نگه می‌دارند، بنابراین بر عقب‌نشینی خطای اجرا اثر نمی‌گذارند.

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

## Webhooks

Gateway می‌تواند نقطه‌های پایانی HTTP Webhook را برای محرک‌های خارجی در معرض قرار دهد. در پیکربندی فعال کنید:

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

هر درخواست باید توکن hook را از طریق سربرگ شامل کند:

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
      شرح رویداد.
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

    فیلدها: `message` (ضروری)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hookهای نگاشت‌شده (POST /hooks/<name>)">
    نام‌های hook سفارشی از طریق `hooks.mappings` در پیکربندی حل می‌شوند. نگاشت‌ها می‌توانند بار داده‌های دلخواه را با قالب‌ها یا تبدیل‌های کد به کنش‌های `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
نقطه‌های پایانی hook را پشت loopback، tailnet یا reverse proxy معتمد نگه دارید.

- از یک توکن hook اختصاصی استفاده کنید؛ توکن‌های احراز هویت Gateway را دوباره استفاده نکنید.
- `hooks.path` را روی یک زیرمسیر اختصاصی نگه دارید؛ `/` رد می‌شود.
- برای محدود کردن مسیریابی صریح `agentId`، `hooks.allowedAgentIds` را تنظیم کنید.
- مگر اینکه به نشست‌های انتخاب‌شده توسط فراخوان نیاز دارید، `hooks.allowRequestSessionKey=false` را نگه دارید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را هم تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- بار داده‌های hook به‌طور پیش‌فرض با مرزهای ایمنی پوشانده می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

محرک‌های صندوق ورودی Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، hookهای OpenClaw فعال، Tailscale برای نقطهٔ پایانی HTTPS عمومی.
</Note>

### راه‌اندازی جادویی (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این کار پیکربندی `hooks.gmail` را می‌نویسد، پیش‌تنظیم Gmail را فعال می‌کند، و از Tailscale Funnel برای نقطهٔ پایانی push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام راه‌اندازی `gog gmail watch serve` را شروع می‌کند و watch را به‌صورت خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="انتخاب پروژهٔ GCP">
    پروژهٔ GCP مالک OAuth client مورد استفادهٔ `gog` را انتخاب کنید:

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
نکتهٔ بازنویسی مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شدهٔ کار را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان provider/model دقیق به اجرای عامل ایزوله می‌رسد.
- اگر مجاز نباشد یا قابل حل نباشد، cron اجرا را با خطای اعتبارسنجی صریح ناموفق می‌کند.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در cron مدل اصلی کار است، نه بازنویسی `/model` نشست.
- بار دادهٔ `fallbacks` جایگزین fallbackهای پیکربندی‌شده برای آن کار می‌شود؛ `fallbacks: []` fallback را غیرفعال می‌کند و اجرا را سخت‌گیرانه می‌کند.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان مقصد تلاش مجدد اضافی خاموش به مدل اصلی عامل سقوط نمی‌کند.

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

`maxConcurrentRuns` هم اعزام cron زمان‌بندی‌شده و هم اجرای نوبت عامل ایزوله را محدود می‌کند. نوبت‌های عامل cron ایزوله به‌صورت داخلی از خط اجرای اختصاصی `cron-nested` صف استفاده می‌کنند، بنابراین افزایش این مقدار اجازه می‌دهد اجراهای مستقل LLM متعلق به cron به‌صورت موازی پیش بروند، نه اینکه فقط wrapperهای بیرونی cron آن‌ها شروع شوند. خط مشترک غیر cron یعنی `nested` با این تنظیم گسترش داده نمی‌شود.

وضعیت زمان اجرای sidecar از `cron.store` مشتق می‌شود: یک store با پسوند `.json` مانند `~/clawd/cron/jobs.json` از `~/clawd/cron/jobs-state.json` استفاده می‌کند، در حالی که مسیر store بدون پسوند `.json`، `-state.json` را اضافه می‌کند.

اگر `jobs.json` را دستی ویرایش می‌کنید، `jobs-state.json` را از کنترل نسخه بیرون نگه دارید. OpenClaw از آن sidecar برای شکاف‌های معلق، نشانگرهای فعال، فرادادهٔ آخرین اجرا، و هویت زمان‌بندی استفاده می‌کند که به زمان‌بند می‌گوید چه زمانی یک کار ویرایش‌شدهٔ خارجی به `nextRunAtMs` تازه نیاز دارد.

غیرفعال کردن cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="رفتار تلاش مجدد">
    **تلاش مجدد یک‌باره**: خطاهای گذرا (محدودیت نرخ، بار بیش از حد، شبکه، خطای سرور) تا ۳ بار با عقب‌نشینی نمایی دوباره امتحان می‌شوند. خطاهای دائمی بلافاصله غیرفعال می‌شوند.

    **تلاش مجدد تکرارشونده**: عقب‌نشینی نمایی (۳۰ ثانیه تا ۶۰ دقیقه) بین تلاش‌های مجدد. عقب‌نشینی پس از اجرای موفق بعدی بازنشانی می‌شود.

  </Accordion>
  <Accordion title="نگهداری">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های نشست اجرای ایزوله را هرس می‌کند. `cron.runLog.maxBytes` / `cron.runLog.keepLines` فایل‌های گزارش اجرا را به‌صورت خودکار هرس می‌کنند.
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
    - متغیر محیطی `cron.enabled` و `OPENCLAW_SKIP_CRON` را بررسی کنید.
    - تأیید کنید Gateway به‌صورت پیوسته در حال اجراست.
    - برای زمان‌بندی‌های `cron`، منطقهٔ زمانی (`--tz`) را در برابر منطقهٔ زمانی میزبان بررسی کنید.
    - `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و موعد کار هنوز نرسیده بود.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویلی انجام نشد">
    - حالت تحویل `none` یعنی انتظار نمی‌رود ارسال جایگزین اجراکننده انجام شود. وقتی مسیر چت در دسترس باشد، agent همچنان می‌تواند مستقیماً با ابزار `message` ارسال کند.
    - نبودن/نامعتبر بودن مقصد تحویل (`channel`/`to`) یعنی ارسال خروجی نادیده گرفته شد.
    - برای Matrix، jobهای کپی‌شده یا قدیمی با شناسه‌های اتاق `delivery.to` که به حروف کوچک تبدیل شده‌اند ممکن است شکست بخورند، چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند. job را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی تحویل به‌دلیل credentials مسدود شده است.
    - اگر اجرای ایزوله فقط توکن بی‌صدا (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل خروجی مستقیم را سرکوب می‌کند و مسیر جایگزین خلاصهٔ صف‌شده را هم سرکوب می‌کند، بنابراین چیزی دوباره به چت ارسال نمی‌شود.
    - اگر agent باید خودش به کاربر پیام بدهد، بررسی کنید که job یک مسیر قابل استفاده داشته باشد (`channel: "last"` با یک چت قبلی، یا یک کانال/مقصد صریح).

  </Accordion>
  <Accordion title="به نظر می‌رسد Cron یا Heartbeat مانع چرخش /new-style می‌شود">
    - تازگی بازنشانی روزانه و idle بر اساس `updatedAt` نیست؛ [مدیریت session](/fa/concepts/session#session-lifecycle) را ببینید.
    - بیدارباش‌های Cron، اجرای Heartbeat، اعلان‌های exec و bookkeeping Gateway ممکن است ردیف session را برای routing/status به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی که پیش از وجود این فیلدها ایجاد شده‌اند، OpenClaw می‌تواند وقتی فایل هنوز در دسترس است، `sessionStartedAt` را از سربرگ session در transcript JSONL بازیابی کند. ردیف‌های idle قدیمی بدون `lastInteractionAt` از آن زمان شروع بازیابی‌شده به‌عنوان مبنای idle خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات دردسرساز timezone">
    - Cron بدون `--tz` از timezone میزبان Gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند.
    - `activeHours` در Heartbeat از تفکیک timezone پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [اتوماسیون و Taskها](/fa/automation) — همهٔ سازوکارهای اتوماسیون در یک نگاه
- [Taskهای پس‌زمینه](/fa/automation/tasks) — دفتر ثبت task برای اجرای cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای session اصلی
- [Timezone](/fa/concepts/timezone) — پیکربندی timezone
