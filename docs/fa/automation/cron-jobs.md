---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارسازی‌ها
    - اتصال محرک‌های خارجی (Webhookها، Gmail) به OpenClaw
    - انتخاب بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhookها و تریگرهای Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-05-02T11:35:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. این زمان‌بند jobها را پایدار نگه می‌دارد، agent را در زمان درست بیدار می‌کند، و می‌تواند خروجی را به یک کانال گفت‌وگو یا endpoint وب‌هوک تحویل دهد.

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
  <Step title="بررسی jobهای خود">
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
- تعریف‌های job در `~/.openclaw/cron/jobs.json` پایدار می‌مانند تا راه‌اندازی‌های مجدد باعث از دست رفتن زمان‌بندی‌ها نشوند.
- وضعیت اجرای runtime کنار آن در `~/.openclaw/cron/jobs-state.json` پایدار می‌ماند. اگر تعریف‌های cron را در git پیگیری می‌کنید، `jobs.json` را پیگیری کنید و `jobs-state.json` را در gitignore قرار دهید.
- پس از جداسازی، نسخه‌های قدیمی‌تر OpenClaw می‌توانند `jobs.json` را بخوانند اما ممکن است jobها را تازه در نظر بگیرند، زیرا فیلدهای runtime اکنون در `jobs-state.json` قرار دارند.
- وقتی `jobs.json` در حال اجرای Gateway یا هنگام توقف آن ویرایش می‌شود، OpenClaw فیلدهای زمان‌بندی تغییرکرده را با فراداده slot زمان اجرای در انتظار مقایسه می‌کند و مقادیر stale `nextRunAtMs` را پاک می‌کند. بازنویسی‌هایی که فقط قالب‌بندی یا فقط ترتیب کلیدها را تغییر می‌دهند، slot در انتظار را حفظ می‌کنند.
- همه اجراهای Cron رکوردهای [background task](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام شروع Gateway، jobهای isolated agent-turn که موعدشان گذشته است به جای پخش مجدد فوری، بیرون از پنجره اتصال کانال دوباره زمان‌بندی می‌شوند، بنابراین راه‌اندازی Discord/Telegram و تنظیم فرمان‌های native پس از راه‌اندازی مجدد پاسخ‌گو می‌مانند.
- jobهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت به‌صورت خودکار حذف می‌شوند.
- اجراهای isolated Cron در پایان اجرا، تا حد امکان تب‌ها/فرایندهای مرورگر پیگیری‌شده را برای session مربوط به `cron:<jobId>` می‌بندند، بنابراین خودکارسازی مرورگر detached فرایندهای یتیم باقی نمی‌گذارد.
- اجراهای isolated Cron همچنین در برابر پاسخ‌های تأیید stale محافظت می‌کنند. اگر نخستین نتیجه فقط یک به‌روزرسانی وضعیت موقت باشد (`on it`، `pulling everything together` و راهنماهای مشابه) و هیچ اجرای subagent فرزند هنوز مسئول پاسخ نهایی نباشد، OpenClaw پیش از تحویل، یک بار دیگر برای نتیجه واقعی prompt می‌کند.
- اجراهای isolated Cron ابتدا فراداده ساختاریافته execution-denial را از اجرای جاسازی‌شده ترجیح می‌دهند، سپس به markerهای شناخته‌شده خلاصه/خروجی نهایی مانند `SYSTEM_RUN_DENIED` و `INVALID_REQUEST` fallback می‌کنند، تا یک فرمان مسدودشده به‌عنوان اجرای موفق گزارش نشود.
- اجراهای isolated Cron همچنین خطاهای agent در سطح اجرا را، حتی وقتی payload پاسخی تولید نشده باشد، خطای job تلقی می‌کنند؛ بنابراین خطاهای مدل/provider شمارنده‌های خطا را افزایش می‌دهند و به جای پاک‌کردن job به‌عنوان موفق، اعلان‌های شکست را فعال می‌کنند.
- وقتی یک job از نوع isolated agent-turn به `timeoutSeconds` می‌رسد، Cron اجرای agent زیرین را abort می‌کند و یک پنجره کوتاه پاک‌سازی به آن می‌دهد. اگر اجرا drain نشود، پاک‌سازی متعلق به Gateway پیش از اینکه Cron timeout را ثبت کند، مالکیت session آن اجرا را با اجبار پاک می‌کند، تا کار گفت‌وگوی صف‌شده پشت یک session پردازش stale باقی نماند.

<a id="maintenance"></a>

<Note>
سازگارسازی task برای Cron ابتدا runtime-owned و سپس durable-history-backed است: یک task فعال Cron تا زمانی که runtime کرون هنوز آن job را در حال اجرا پیگیری می‌کند، زنده می‌ماند، حتی اگر یک ردیف session فرزند قدیمی هنوز وجود داشته باشد. وقتی runtime دیگر مالک job نباشد و پنجره مهلت ۵ دقیقه‌ای منقضی شود، نگه‌داری logهای اجرای پایدار و وضعیت job را برای اجرای متناظر `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن تاریخچه پایدار یک نتیجه terminal نشان دهد، دفتر task بر اساس آن نهایی می‌شود؛ در غیر این صورت نگه‌داری متعلق به Gateway می‌تواند task را `lost` علامت‌گذاری کند. audit آفلاین CLI می‌تواند از تاریخچه پایدار بازیابی کند، اما مجموعه خالی active-job درون‌فرایندی خودش را مدرکی برای از بین رفتن اجرای Cron متعلق به Gateway در نظر نمی‌گیرد.
</Note>

## انواع زمان‌بندی

| نوع    | flag در CLI  | توضیح                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp یک‌باره (ISO 8601 یا نسبی مثل `20m`)    |
| `every` | `--every` | بازه ثابت                                          |
| `cron`  | `--cron`  | عبارت cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری |

timestampهای بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی بر اساس ساعت دیواری محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشونده ابتدای ساعت به‌طور خودکار تا ۵ دقیقه stagger می‌شوند تا جهش‌های بار کاهش یابد. برای اجبار زمان‌بندی دقیق از `--exact` یا برای یک پنجره صریح از `--stagger 30s` استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) parse می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته non-wildcard باشند، croner وقتی match می‌کند که **یکی از** فیلدها match شود، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw در اینجا از رفتار OR پیش‌فرض Croner استفاده می‌کند. برای الزام هر دو شرط، از modifier روز هفته `+` در Croner (`0 9 15 * +1`) استفاده کنید یا بر اساس یک فیلد زمان‌بندی کنید و دیگری را در prompt یا فرمان job خود guard کنید.

## سبک‌های اجرا

| سبک           | مقدار `--session`   | اجرا می‌شود در                  | مناسب برای                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| session اصلی    | `main`              | turn بعدی heartbeat      | یادآورها، رویدادهای سیستم        |
| isolated        | `isolated`          | `cron:<jobId>` اختصاصی | گزارش‌ها، کارهای پس‌زمینه      |
| session فعلی | `current`           | مقید در زمان ایجاد   | کار تکرارشونده آگاه از context    |
| session سفارشی  | `session:custom-id` | session نام‌دار پایدار | Workflowهایی که بر history بنا می‌شوند |

<AccordionGroup>
  <Accordion title="session اصلی در برابر isolated و سفارشی">
    jobهای **session اصلی** یک رویداد سیستم را enqueue می‌کنند و در صورت نیاز heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن رویدادهای سیستم تازگی reset روزانه/idle را برای session هدف تمدید نمی‌کنند. jobهای **isolated** یک turn اختصاصی agent را با session تازه اجرا می‌کنند. **sessionهای سفارشی** (`session:xxx`) context را بین اجراها پایدار نگه می‌دارند و workflowهایی مانند standupهای روزانه را ممکن می‌کنند که بر خلاصه‌های قبلی بنا می‌شوند.
  </Accordion>
  <Accordion title="معنای «session تازه» برای jobهای isolated">
    برای jobهای isolated، «session تازه» یعنی یک transcript/session id جدید برای هر اجرا. OpenClaw ممکن است preferenceهای امنی مانند تنظیمات thinking/fast/verbose، labelها و overrideهای صریح مدل/auth انتخاب‌شده توسط کاربر را حمل کند، اما context گفت‌وگوی محیطی را از یک ردیف Cron قدیمی به ارث نمی‌برد: routing کانال/گروه، policy ارسال یا صف، elevation، origin یا binding runtime در ACP. وقتی یک job تکرارشونده باید عمداً بر همان context گفت‌وگو بنا شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="پاک‌سازی Runtime">
    برای jobهای isolated، teardown runtime اکنون شامل پاک‌سازی بهترین‌تلاش مرورگر برای آن session کرون است. خطاهای پاک‌سازی نادیده گرفته می‌شوند تا نتیجه واقعی Cron همچنان تعیین‌کننده باشد.

    اجراهای isolated Cron همچنین هر نمونه runtime همراه MCP را که برای job ساخته شده باشد، از طریق مسیر مشترک پاک‌سازی runtime dispose می‌کنند. این با teardown کلاینت‌های MCP در main-session و custom-session هم‌خوان است، بنابراین jobهای isolated Cron فرایندهای فرزند stdio یا اتصال‌های MCP بلندمدت را بین اجراها leak نمی‌کنند.

  </Accordion>
  <Accordion title="تحویل subagent و Discord">
    وقتی اجراهای isolated Cron subagentها را orchestrate می‌کنند، تحویل نیز خروجی نهایی فرزند را بر متن موقت stale والد ترجیح می‌دهد. اگر فرزندها هنوز در حال اجرا باشند، OpenClaw آن به‌روزرسانی جزئی والد را به جای اعلام‌کردن، suppress می‌کند.

    برای targetهای announce فقط متنی در Discord، OpenClaw متن نهایی canonical assistant را یک بار ارسال می‌کند، به جای اینکه هم payloadهای متن streamed/intermediate و هم پاسخ نهایی را replay کند. payloadهای رسانه‌ای و ساختاریافته Discord همچنان به‌صورت payloadهای جداگانه تحویل داده می‌شوند تا attachmentها و componentها حذف نشوند.

  </Accordion>
</AccordionGroup>

### گزینه‌های Payload برای jobهای isolated

<ParamField path="--message" type="string" required>
  متن prompt (برای isolated الزامی است).
</ParamField>
<ParamField path="--model" type="string">
  override مدل؛ از مدل مجاز انتخاب‌شده برای job استفاده می‌کند.
</ParamField>
<ParamField path="--thinking" type="string">
  override سطح thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تزریق فایل bootstrap workspace را رد می‌کند.
</ParamField>
<ParamField path="--tools" type="string">
  محدود می‌کند که job از کدام ابزارها می‌تواند استفاده کند، برای مثال `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی آن job استفاده می‌کند. این با override مربوط به `/model` در chat-session یکی نیست: زنجیره‌های fallback پیکربندی‌شده همچنان هنگام شکست مدل اصلی job اعمال می‌شوند. اگر مدل درخواست‌شده مجاز نباشد یا resolve نشود، Cron به جای fallback بی‌صدا به انتخاب agent/default مدل job، اجرا را با خطای اعتبارسنجی صریح fail می‌کند.

jobهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. وقتی وجود داشته باشد، آن فهرست جایگزین زنجیره fallback پیکربندی‌شده برای job می‌شود. وقتی یک اجرای سخت‌گیرانه Cron می‌خواهید که فقط مدل انتخاب‌شده را امتحان کند، در payload/API مربوط به job از `fallbacks: []` استفاده کنید. اگر job دارای `--model` باشد اما نه payload و نه fallbackهای پیکربندی‌شده داشته باشد، OpenClaw یک override fallback خالی صریح ارسال می‌کند تا مدل اصلی agent به‌عنوان هدف retry اضافی پنهان append نشود.

اولویت انتخاب مدل برای jobهای isolated این است:

1. override مدل hook در Gmail (وقتی اجرا از Gmail آمده باشد و آن override مجاز باشد)
2. `model` مربوط به payload هر job
3. override مدل ذخیره‌شده session کرون انتخاب‌شده توسط کاربر
4. انتخاب agent/default مدل

حالت fast نیز از انتخاب live resolve‌شده پیروی می‌کند. اگر config مدل انتخاب‌شده `params.fastMode` داشته باشد، isolated Cron به‌طور پیش‌فرض از آن استفاده می‌کند. override ذخیره‌شده `fastMode` در session همچنان در هر دو جهت بر config غالب است.

اگر یک اجرای isolated به handoff live model-switch برسد، Cron با provider/model تعویض‌شده retry می‌کند و پیش از retry، آن انتخاب live را برای اجرای فعال پایدار می‌کند. وقتی switch یک auth profile جدید نیز حمل کند، Cron آن override auth profile را هم برای اجرای فعال پایدار می‌کند. retryها محدود هستند: پس از تلاش اولیه به‌علاوه ۲ retry مربوط به switch، Cron به جای loop بی‌پایان abort می‌کند.

پیش از اینکه یک اجرای isolated Cron وارد runner مربوط به agent شود، OpenClaw endpointهای provider محلی قابل‌دسترسی را برای providerهای پیکربندی‌شده با `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها loopback، شبکه خصوصی یا `.local` است بررسی می‌کند. اگر آن endpoint پایین باشد، اجرا به‌جای شروع فراخوانی مدل، با خطای شفاف provider/model به‌عنوان `skipped` ثبت می‌شود. نتیجه endpoint به مدت ۵ دقیقه cache می‌شود، بنابراین jobهای موعدرسیده زیادی که از همان سرور محلی مرده Ollama، vLLM، SGLang یا LM Studio استفاده می‌کنند به جای ایجاد طوفان درخواست، یک probe کوچک مشترک دارند. اجراهای ردشده provider-preflight، backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های skip تکراری می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | چه اتفاقی می‌افتد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر agent ارسال نکرده باشد، متن نهایی را به target با fallback تحویل می‌دهد |
| `webhook`  | payload رویداد پایان‌یافته را به یک URL با POST ارسال می‌کند                                |
| `none`     | تحویل fallback از سوی runner انجام نمی‌شود                                         |

برای تحویل به کانال از `--announce --channel telegram --to "-1001234567890"` استفاده کنید. برای موضوع‌های انجمن Telegram، از `-1001234567890:topic:123` استفاده کنید؛ فراخواننده‌های مستقیم RPC/config همچنین می‌توانند `delivery.threadId` را به‌صورت رشته یا عدد ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح (`channel:<id>`، `user:<id>`) استفاده کنند. شناسه‌های اتاق Matrix به حروف بزرگ و کوچک حساس‌اند؛ از شناسه دقیق اتاق یا فرم `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل اعلام از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، مقصدی با پیشوند ارائه‌دهنده مانند `telegram:123` می‌تواند قبل از اینکه Cron به تاریخچه نشست یا یک کانال پیکربندی‌شده واحد برگردد، کانال را انتخاب کند. فقط پیشوندهایی که Plugin بارگذاری‌شده اعلام کرده است انتخابگرهای ارائه‌دهنده هستند. اگر `delivery.channel` صریح باشد، پیشوند مقصد باید همان ارائه‌دهنده را نام ببرد؛ برای مثال، `channel: "whatsapp"` همراه با `to: "telegram:123"` به‌جای اینکه اجازه دهد WhatsApp شناسه Telegram را به‌عنوان شماره تلفن تفسیر کند، رد می‌شود. پیشوندهای نوع مقصد و سرویس مانند `channel:<id>`، `user:<id>`، `imessage:<handle>` و `sms:<number>` همچنان نحو مقصد متعلق به کانال هستند، نه انتخابگرهای ارائه‌دهنده.

برای کارهای ایزوله، تحویل چت مشترک است. اگر مسیر چت در دسترس باشد، عامل می‌تواند حتی زمانی که کار از `--no-deliver` استفاده می‌کند از ابزار `message` استفاده کند. اگر عامل به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلام جایگزین را رد می‌کند. در غیر این صورت `announce`، `webhook` و `none` فقط کنترل می‌کنند که اجراکننده پس از نوبت عامل با پاسخ نهایی چه کاری انجام دهد.

وقتی یک عامل از یک چت فعال یک یادآور ایزوله ایجاد می‌کند، OpenClaw مقصد تحویل زنده حفظ‌شده را برای مسیر اعلام جایگزین ذخیره می‌کند. کلیدهای نشست داخلی ممکن است با حروف کوچک باشند؛ وقتی زمینه چت فعلی در دسترس است، مقصدهای تحویل ارائه‌دهنده از آن کلیدها بازسازی نمی‌شوند.

تحویل اعلام ضمنی از فهرست‌های مجاز کانال پیکربندی‌شده برای اعتبارسنجی و مسیریابی دوباره مقصدهای قدیمی استفاده می‌کند. تأییدهای فروشگاه جفت‌سازی DM گیرنده‌های خودکار جایگزین نیستند؛ وقتی یک کار زمان‌بندی‌شده باید به‌صورت پیش‌دستانه به یک DM ارسال شود، `delivery.to` را تنظیم کنید یا ورودی `allowFrom` کانال را پیکربندی کنید.

اعلان‌های شکست مسیر مقصد جداگانه‌ای را دنبال می‌کنند:

- `cron.failureDestination` یک پیش‌فرض سراسری برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و کار از قبل از طریق `announce` تحویل بدهد، اعلان‌های شکست اکنون به همان مقصد اعلام اصلی برمی‌گردند.
- `delivery.failureDestination` فقط در کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار Cron سراسری را وارد هشدارهای تکراری اجرای ردشده می‌کند. اجراهای ردشده شمارنده ردشدن متوالی جداگانه‌ای نگه می‌دارند، بنابراین بر عقب‌نشینی خطای اجرا اثر نمی‌گذارند.

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

Gateway می‌تواند نقطه‌پایان‌های HTTP Webhook را برای محرک‌های خارجی در معرض بگذارد. در پیکربندی فعال کنید:

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

هر درخواست باید توکن hook را از طریق سرآیند شامل شود:

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
    یک نوبت عامل ایزوله اجرا کنید:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    فیلدها: `message` (الزامی)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="hookهای نگاشت‌شده (POST /hooks/<name>)">
    نام‌های hook سفارشی از طریق `hooks.mappings` در پیکربندی حل می‌شوند. نگاشت‌ها می‌توانند payloadهای دلخواه را با الگوها یا تبدیل‌های کد به کنش‌های `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
نقطه‌پایان‌های hook را پشت loopback، tailnet یا پراکسی معکوس مورد اعتماد نگه دارید.

- از یک توکن hook اختصاصی استفاده کنید؛ توکن‌های احراز هویت Gateway را دوباره استفاده نکنید.
- `hooks.path` را روی یک زیرمسیر اختصاصی نگه دارید؛ `/` رد می‌شود.
- برای محدود کردن مسیریابی صریح `agentId`، `hooks.allowedAgentIds` را تنظیم کنید.
- مگر اینکه به نشست‌های انتخاب‌شده توسط فراخواننده نیاز دارید، `hooks.allowRequestSessionKey=false` را نگه دارید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، همچنین `hooks.allowedSessionKeyPrefixes` را تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- payloadهای hook به‌طور پیش‌فرض با مرزهای ایمنی بسته‌بندی می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

محرک‌های صندوق ورودی Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، hookهای OpenClaw فعال، Tailscale برای نقطه‌پایان HTTPS عمومی.
</Note>

### راه‌اندازی جادوگر (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این دستور پیکربندی `hooks.gmail` را می‌نویسد، preset Gmail را فعال می‌کند، و از Tailscale Funnel برای نقطه‌پایان push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام راه‌اندازی `gog gmail watch serve` را شروع می‌کند و watch را به‌صورت خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="انتخاب پروژه GCP">
    پروژه GCP مالک کلاینت OAuth مورد استفاده توسط `gog` را انتخاب کنید:

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
- اگر مجاز نباشد یا قابل حل نباشد، Cron اجرا را با خطای اعتبارسنجی صریح ناموفق می‌کند.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در Cron مدل اصلی کار است، نه بازنویسی `/model` نشست.
- payload `fallbacks`، fallbackهای پیکربندی‌شده را برای آن کار جایگزین می‌کند؛ `fallbacks: []` fallback را غیرفعال می‌کند و اجرا را سخت‌گیرانه می‌سازد.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان یک مقصد تلاش مجدد اضافی خاموش به مدل اصلی عامل سقوط نمی‌کند.

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

`maxConcurrentRuns` هم ارسال Cron زمان‌بندی‌شده و هم اجرای نوبت عامل ایزوله را محدود می‌کند. نوبت‌های عامل Cron ایزوله به‌صورت داخلی از مسیر اجرای اختصاصی `cron-nested` صف استفاده می‌کنند، بنابراین افزایش این مقدار اجازه می‌دهد اجراهای مستقل LLM در Cron به‌جای اینکه فقط wrapperهای بیرونی Cron خود را شروع کنند، به‌صورت موازی پیش بروند. مسیر مشترک غیر Cron `nested` با این تنظیم گسترده‌تر نمی‌شود.

sidecar وضعیت زمان اجرا از `cron.store` مشتق می‌شود: یک store با پسوند `.json` مانند `~/clawd/cron/jobs.json` از `~/clawd/cron/jobs-state.json` استفاده می‌کند، در حالی که مسیر store بدون پسوند `.json`، `-state.json` را اضافه می‌کند.

اگر `jobs.json` را دستی ویرایش می‌کنید، `jobs-state.json` را از کنترل نسخه بیرون نگه دارید. OpenClaw از آن sidecar برای slotهای معلق، نشانگرهای فعال، فراداده آخرین اجرا و هویت زمان‌بندی‌ای استفاده می‌کند که به زمان‌بند می‌گوید چه زمانی یک کار ویرایش‌شده خارجی به `nextRunAtMs` تازه نیاز دارد.

غیرفعال کردن Cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="رفتار تلاش مجدد">
    **تلاش مجدد یک‌باره**: خطاهای گذرا (محدودیت نرخ، بار بیش از حد، شبکه، خطای سرور) تا ۳ بار با عقب‌نشینی نمایی دوباره تلاش می‌شوند. خطاهای دائمی بلافاصله غیرفعال می‌شوند.

    **تلاش مجدد تکرارشونده**: عقب‌نشینی نمایی (۳۰ ثانیه تا ۶۰ دقیقه) بین تلاش‌های مجدد. عقب‌نشینی پس از اجرای موفق بعدی بازنشانی می‌شود.

  </Accordion>
  <Accordion title="نگهداری">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های نشست اجرای ایزوله را هرس می‌کند. `cron.runLog.maxBytes` / `cron.runLog.keepLines` فایل‌های لاگ اجرا را به‌صورت خودکار هرس می‌کنند.
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
    - تأیید کنید که Gateway به‌صورت پیوسته در حال اجراست.
    - برای زمان‌بندی‌های `cron`، منطقه زمانی (`--tz`) را در برابر منطقه زمانی میزبان بررسی کنید.
    - `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و کار هنوز موعدش نرسیده بوده است.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویلی انجام نشد">
    - حالت تحویل `none` یعنی انتظار نمی‌رود ارسال جایگزین runner انجام شود. عامل همچنان می‌تواند وقتی مسیر گپ در دسترس است، مستقیما با ابزار `message` ارسال کند.
    - نبودن یا نامعتبر بودن مقصد تحویل (`channel`/`to`) یعنی خروجی نادیده گرفته شد.
    - برای Matrix، کارهای کپی‌شده یا قدیمی با شناسه‌های اتاق `delivery.to` که با حروف کوچک شده‌اند ممکن است شکست بخورند، چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند. کار را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی تحویل به‌دلیل اعتبارنامه‌ها مسدود شده است.
    - اگر اجرای ایزوله فقط توکن بی‌صدا (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل مستقیم خروجی را سرکوب می‌کند و مسیر خلاصه صف‌شده جایگزین را نیز سرکوب می‌کند، بنابراین چیزی دوباره در گپ منتشر نمی‌شود.
    - اگر عامل باید خودش به کاربر پیام بدهد، بررسی کنید که کار یک مسیر قابل استفاده داشته باشد (`channel: "last"` با یک گپ قبلی، یا یک کانال/مقصد صریح).

  </Accordion>
  <Accordion title="به نظر می‌رسد Cron یا Heartbeat از rollover مربوط به /new-style جلوگیری می‌کند">
    - تازگی بازنشانی روزانه و بیکاری بر اساس `updatedAt` نیست؛ [مدیریت نشست](/fa/concepts/session#session-lifecycle) را ببینید.
    - بیدارباش‌های Cron، اجراهای Heartbeat، اعلان‌های exec، و ثبت‌وضعیت Gateway ممکن است ردیف نشست را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی‌ای که پیش از وجود این فیلدها ساخته شده‌اند، OpenClaw می‌تواند وقتی فایل هنوز در دسترس است، `sessionStartedAt` را از سرآیند نشست JSONL رونوشت بازیابی کند. ردیف‌های بیکار قدیمی بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان مبنای بیکاری خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات حساس منطقه زمانی">
    - Cron بدون `--tz` از منطقه زمانی میزبان Gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون منطقه زمانی، UTC در نظر گرفته می‌شوند.
    - `activeHours` در Heartbeat از تفکیک منطقه زمانی پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [اتوماسیون و وظایف](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [وظایف پس‌زمینه](/fa/automation/tasks) — دفترکل وظایف برای اجراهای Cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای نشست اصلی
- [منطقه زمانی](/fa/concepts/timezone) — پیکربندی منطقه زمانی
