---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارباش‌ها
    - اتصال محرک‌های خارجی (Webhookها، Gmail) به OpenClaw
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، وب‌هوک‌ها و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-07-02T01:04:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. این قابلیت jobها را ماندگار می‌کند، agent را در زمان مناسب بیدار می‌کند، و می‌تواند خروجی را به یک کانال chat یا endpoint مربوط به webhook تحویل دهد.

## شروع سریع

<Steps>
  <Step title="افزودن یک یادآور یک‌باره">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="بررسی jobهای خود">
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

## شیوهٔ کار Cron

- Cron **داخل فرایند Gateway** اجرا می‌شود (نه داخل model).
- تعریف jobها، وضعیت runtime، و تاریخچهٔ اجرا در پایگاه‌دادهٔ وضعیت SQLite مشترک OpenClaw ماندگار می‌شوند تا restartها زمان‌بندی‌ها را از بین نبرند.
- هنگام upgrade، `openclaw doctor --fix` را اجرا کنید تا فایل‌های قدیمی `~/.openclaw/cron/jobs.json`، `jobs-state.json`، و `runs/*.jsonl` به SQLite وارد شوند و با پسوند `.migrated` تغییر نام پیدا کنند. ردیف‌های job بدشکل از runtime رد می‌شوند و برای تعمیر یا بازبینی بعدی در `jobs-quarantine.json` کپی می‌شوند.
- `cron.store` همچنان کلید منطقی cron store و مسیر import مربوط به doctor را نام‌گذاری می‌کند. پس از import، ویرایش آن فایل JSON دیگر jobهای فعال cron را تغییر نمی‌دهد؛ به‌جای آن از `openclaw cron add|edit|remove` یا روش‌های RPC مربوط به cron در Gateway استفاده کنید.
- همهٔ اجراهای cron رکوردهای [background task](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام startup مربوط به Gateway، jobهای عقب‌افتادهٔ isolated agent-turn به‌جای اجرای فوری، بیرون از بازهٔ channel-connect دوباره زمان‌بندی می‌شوند تا startup در Discord/Telegram و تنظیم native-command پس از restartها پاسخ‌گو بماند.
- jobهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت به‌صورت خودکار حذف می‌شوند.
- اجراهای isolated cron، tabها/processهای مرورگر ردیابی‌شده برای session مربوط به `cron:<jobId>` خود را هنگام تکمیل اجرا، به‌صورت best-effort می‌بندند تا اتوماسیون مرورگر جداشده فرایندهای orphaned باقی نگذارد.
- اجراهای isolated cron که مجوز محدود self-cleanup مربوط به cron را دریافت می‌کنند همچنان می‌توانند وضعیت scheduler، فهرست self-filtered مربوط به job فعلی خود، و تاریخچهٔ اجرای آن job را بخوانند، تا بررسی‌های status/heartbeat بتوانند بدون دسترسی گسترده‌تر به mutationهای cron زمان‌بندی خودشان را بررسی کنند.
- اجراهای isolated cron همچنین در برابر پاسخ‌های تأیید stale محافظت می‌کنند. اگر نتیجهٔ نخست فقط یک به‌روزرسانی وضعیت موقت باشد (`on it`، `pulling everything together`، و hintهای مشابه) و هیچ اجرای subagent فرزند همچنان مسئول پاسخ نهایی نباشد، OpenClaw یک‌بار دیگر برای نتیجهٔ واقعی پیش از تحویل prompt می‌کند.
- اجراهای isolated cron از metadata ساختاریافتهٔ execution-denial مربوط به اجرای embedded استفاده می‌کنند، از جمله wrapperهای node-host با `UNAVAILABLE` که پیام خطای nested آن‌ها با `SYSTEM_RUN_DENIED` یا `INVALID_REQUEST` شروع می‌شود، تا یک command مسدودشده به‌عنوان اجرای سبز گزارش نشود، در حالی که نثر معمول assistant به‌عنوان denial تلقی نمی‌شود.
- اجراهای isolated cron همچنین failureهای agent در سطح اجرا را حتی وقتی هیچ payload پاسخی تولید نشده باشد، به‌عنوان خطای job در نظر می‌گیرند، تا failureهای model/provider شمارنده‌های خطا را افزایش دهند و notificationهای failure را فعال کنند، نه اینکه job را موفق پاک کنند.
- وقتی یک job از نوع isolated agent-turn به `timeoutSeconds` می‌رسد، cron اجرای agent زیرین را abort می‌کند و یک بازهٔ کوتاه cleanup به آن می‌دهد. اگر اجرا تخلیه نشود، cleanup تحت مالکیت Gateway پیش از اینکه cron timeout را ثبت کند، مالکیت session آن اجرا را force-clear می‌کند، تا کار chat در صف پشت یک session پردازشی stale باقی نماند.
- اگر یک isolated agent-turn پیش از شروع runner یا پیش از نخستین فراخوانی model متوقف شود، cron یک timeout ویژهٔ phase مانند `setup timed out before runner start` یا `stalled before first model call (last phase: context-engine)` ثبت می‌کند. این watchdogها providerهای embedded و providerهای مبتنی بر CLI را پیش از آنکه فرایند CLI خارجی‌شان واقعاً شروع شود پوشش می‌دهند، و مستقل از مقادیر بلند `timeoutSeconds` محدود می‌شوند تا failureهای cold-start/auth/context سریع نمایان شوند، به‌جای اینکه تا کل budget job منتظر بمانند.
- اگر از cron سیستمی یا scheduler خارجی دیگری برای اجرای `openclaw agent` استفاده می‌کنید، آن را با hard-kill escalation بپیچید، حتی اگر CLI با `SIGTERM`/`SIGINT` کار می‌کند. اجراهای پشتیبانی‌شده با Gateway از Gateway می‌خواهند اجراهای پذیرفته‌شده را abort کند؛ اجراهای local و embedded fallback همان signal مربوط به abort را دریافت می‌کنند. برای GNU `timeout`، به‌جای `timeout 600 ...` ساده، `timeout -k 60 600 openclaw agent ...` را ترجیح دهید؛ مقدار `-k` backstop مربوط به supervisor است اگر process نتواند تخلیه شود. برای unitهای systemd، همین شکل را با استفاده از stop signal نوع `SIGTERM` به‌همراه یک grace window مانند `TimeoutStopSec` پیش از هر kill نهایی حفظ کنید. اگر یک retry در حالی که اجرای اصلی Gateway هنوز فعال است دوباره از `--run-id` استفاده کند، duplicate به‌جای شروع اجرای دوم به‌عنوان in-flight گزارش می‌شود.

<a id="maintenance"></a>

<Note>
آشتی‌دهی Task برای cron ابتدا runtime-owned است و سپس durable-history-backed: یک task فعال cron تا زمانی که runtime مربوط به cron همچنان آن job را در حال اجرا ردیابی می‌کند، زنده می‌ماند، حتی اگر یک ردیف session فرزند قدیمی هنوز وجود داشته باشد. وقتی runtime مالکیت job را متوقف می‌کند و grace window پنج‌دقیقه‌ای منقضی می‌شود، maintenance لاگ‌های اجرای ماندگار و وضعیت job را برای اجرای مطابق `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن تاریخچهٔ ماندگار یک نتیجهٔ terminal نشان دهد، task ledger از روی آن نهایی می‌شود؛ در غیر این صورت maintenance تحت مالکیت Gateway می‌تواند task را `lost` علامت‌گذاری کند. audit آفلاین CLI می‌تواند از تاریخچهٔ ماندگار بازیابی کند، اما مجموعهٔ active-job خالی درون‌فرایندی خودش را به‌عنوان اثبات ناپدید شدن یک اجرای cron تحت مالکیت Gateway در نظر نمی‌گیرد.
</Note>

## انواع زمان‌بندی

| نوع     | پرچم CLI  | توضیح                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp یک‌باره (ISO 8601 یا نسبی مانند `20m`)        |
| `every` | `--every` | فاصلهٔ ثابت                                             |
| `cron`  | `--cron`  | عبارت cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری     |

timestampهای بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند. برای زمان‌بندی بر اساس ساعت دیواری local، `--tz America/New_York` را اضافه کنید.

عبارت‌های تکرارشوندهٔ ابتدای هر ساعت به‌طور خودکار تا ۵ دقیقه پراکنده می‌شوند تا spikeهای load کاهش یابد. از `--exact` برای اجبار زمان‌بندی دقیق یا از `--stagger 30s` برای یک بازهٔ صریح استفاده کنید.

### روز ماه و روز هفته از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) parse می‌شوند. وقتی هر دو فیلد روز ماه و روز هفته non-wildcard باشند، croner زمانی match می‌کند که **هرکدام** از فیلدها match شوند — نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این به‌جای ۰ تا ۱ بار در ماه، حدود ۵ تا ۶ بار در ماه اجرا می‌شود. OpenClaw اینجا از رفتار OR پیش‌فرض Croner استفاده می‌کند. برای الزام هر دو شرط، از modifier روز هفتهٔ `+` در Croner استفاده کنید (`0 9 15 * +1`) یا روی یک فیلد زمان‌بندی کنید و فیلد دیگر را در prompt یا command مربوط به job خود guard کنید.

## سبک‌های اجرا

| سبک            | مقدار `--session`   | در کجا اجرا می‌شود      | مناسب برای                         |
| -------------- | ------------------- | ------------------------ | ---------------------------------- |
| session اصلی   | `main`              | lane اختصاصی cron wake   | یادآورها، system eventها           |
| isolated       | `isolated`          | `cron:<jobId>` اختصاصی   | گزارش‌ها، کارهای پس‌زمینه          |
| session فعلی   | `current`           | اجرای detached cron      | کار تکرارشوندهٔ context-aware      |
| session سفارشی | `session:custom-id` | اجرای detached cron      | هدف‌گیری یک chat/session شناخته‌شده |

<AccordionGroup>
  <Accordion title="session اصلی در برابر isolated و سفارشی">
    jobهای **session اصلی** یک system event را در lane اجرای تحت مالکیت cron enqueue می‌کنند و به‌صورت اختیاری heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن‌ها می‌توانند برای replyها از آخرین delivery context مربوط به session اصلی هدف استفاده کنند، اما turnهای routine مربوط به cron را به lane چت انسانی append نمی‌کنند و freshness مربوط به reset روزانه/idle را برای session هدف تمدید نمی‌کنند. jobهای **isolated** یک agent turn اختصاصی را با session تازه اجرا می‌کنند. jobهای session **فعلی** و **سفارشی** (`current`، `session:xxx`) می‌توانند از chat/session انتخاب‌شده برای delivery context و preference seeding ایمن استفاده کنند، اما هر اجرا همچنان در یک session جداشدهٔ cron اجرا می‌شود تا کار زمان‌بندی‌شده مکالمهٔ زنده را مسدود یا transcript آن را آلوده نکند.

    رویدادهای cron مربوط به main-session یادآورهای system-event خودبسنده هستند. آن‌ها
    به‌طور خودکار instruction مربوط به "Read
    HEARTBEAT.md" در prompt پیش‌فرض heartbeat را شامل نمی‌شوند. اگر یک یادآور تکرارشونده باید
    با `HEARTBEAT.md` مشورت کند، این را صراحتاً در متن event مربوط به cron یا در
    instructionهای خود agent بگویید.

  </Accordion>
  <Accordion title="معنای «session تازه» برای jobهای detached">
    برای jobهای isolated، current-session، و custom-session، «session تازه» یعنی یک transcript/session id جدید برای هر اجرا. OpenClaw ممکن است preferenceهای ایمنی مانند تنظیمات thinking/fast/verbose، labelها، و overrideهای model/auth انتخاب‌شدهٔ صریح توسط کاربر را حمل کند. اجراهای detached، context مکالمهٔ محیطی را از یک ردیف cron قدیمی به ارث نمی‌برند: channel/group routing، policy مربوط به send یا queue، elevation، origin، یا binding runtime مربوط به ACP. وضعیت ماندگار recurring-work را در prompt، فایل‌های workspace، tools، یا سیستمی که job روی آن عمل می‌کند قرار دهید، به‌جای اینکه به transcript یک chat زنده به‌عنوان حافظهٔ cron تکیه کنید.
  </Accordion>
  <Accordion title="cleanup در runtime">
    برای jobهای isolated، teardown مربوط به runtime اکنون cleanup مرورگر به‌صورت best-effort را برای آن session cron شامل می‌شود. failureهای cleanup نادیده گرفته می‌شوند تا نتیجهٔ واقعی cron همچنان غالب بماند.

    اجراهای isolated cron همچنین هر نمونهٔ runtime مربوط به MCP bundled را که از طریق مسیر shared runtime-cleanup برای job ایجاد شده dispose می‌کنند. این با شیوهٔ tear down شدن clientهای MCP مربوط به main-session و custom-session مطابقت دارد، بنابراین jobهای isolated cron فرایندهای فرزند stdio یا اتصال‌های MCP بلندمدت را بین اجراها leak نمی‌کنند.

  </Accordion>
  <Accordion title="تحویل subagent و Discord">
    وقتی اجراهای isolated cron، subagentها را orchestration می‌کنند، delivery همچنین خروجی نهایی descendant را بر متن موقت stale والد ترجیح می‌دهد. اگر descendantها هنوز در حال اجرا باشند، OpenClaw آن به‌روزرسانی جزئی والد را به‌جای اعلام کردن suppress می‌کند.

    برای announce targetهای Discord فقط‌متنی، OpenClaw متن نهایی canonical assistant را یک‌بار می‌فرستد، به‌جای اینکه هم payloadهای متن streamed/intermediate و هم پاسخ نهایی را replay کند. payloadهای media و structured مربوط به Discord همچنان به‌عنوان payloadهای جداگانه تحویل داده می‌شوند تا attachmentها و componentها حذف نشوند.

  </Accordion>
</AccordionGroup>

### payloadهای command

از payloadهای command برای scriptهای deterministic استفاده کنید که باید داخل scheduler مربوط به Gateway اجرا شوند، بدون اینکه یک isolated agent turn پشتیبانی‌شده با model را شروع کنند. jobهای command روی host مربوط به Gateway اجرا می‌شوند، stdout/stderr را capture می‌کنند، اجرا را در تاریخچهٔ cron ثبت می‌کنند، و از همان حالت‌های delivery یعنی `announce`، `webhook`، و `none` مانند jobهای isolated دوباره استفاده می‌کنند.

<Note>
Command cron یک سطح اتوماسیون operator-admin مربوط به Gateway است، نه یک فراخوانی
`tools.exec` مربوط به agent. ایجاد، به‌روزرسانی، حذف، یا اجرای دستی jobهای cron
به `operator.admin` نیاز دارد؛ اجراهای command زمان‌بندی‌شده بعداً داخل فرایند
Gateway به‌عنوان همان اتوماسیون نوشته‌شده توسط admin اجرا می‌شوند. policy مربوط به exec در agent مانند
`tools.exec.mode`، promptهای approval، و allowlistهای tool برای هر agent بر
toolهای exec قابل مشاهده برای model حاکم است، نه بر payloadهای command cron.
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

`--command <shell>` مقدار `argv: ["sh", "-lc", <shell>]` را ذخیره می‌کند. وقتی اجرای دقیق argv بدون shell parsing می‌خواهید، از `--command-argv '["node","scripts/report.mjs"]'` استفاده کنید. فیلدهای اختیاری `--command-env KEY=VALUE`، `--command-input`، `--timeout-seconds`، `--no-output-timeout-seconds`، و `--output-max-bytes` محیط process، stdin، و حدود خروجی را کنترل می‌کنند.

اگر stdout غیرخالی باشد، همان متن نتیجهٔ تحویل‌شده است. اگر stdout خالی و stderr غیرخالی باشد، stderr تحویل داده می‌شود. اگر هر دو جریان وجود داشته باشند، cron یک بلوک کوچک `stdout:` / `stderr:` تحویل می‌دهد. کد خروج صفر اجرای کار را به‌عنوان `ok` ثبت می‌کند؛ خروج غیرصفر، سیگنال، timeout، یا timeout بدون خروجی، `error` ثبت می‌کند و می‌تواند هشدارهای شکست را فعال کند. دستوری که فقط `NO_REPLY` چاپ کند از سرکوب معمول token خاموش cron استفاده می‌کند و چیزی به چت ارسال نمی‌کند.

### گزینه‌های payload برای کارهای ایزوله

<ParamField path="--message" type="string" required>
  متن prompt (برای ایزوله الزامی است).
</ParamField>
<ParamField path="--model" type="string">
  بازنویسی مدل؛ از مدل مجاز انتخاب‌شده برای کار استفاده می‌کند.
</ParamField>
<ParamField path="--fallbacks" type="string">
  فهرست مدل‌های fallback برای هر کار، برای نمونه `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. برای اجرای سخت‌گیرانه بدون fallback، `--fallbacks ""` را ارسال کنید.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  در `cron edit`، بازنویسی fallback مخصوص کار را حذف می‌کند تا کار از تقدم fallback پیکربندی‌شده پیروی کند. نمی‌تواند با `--fallbacks` ترکیب شود.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  در `cron edit`، بازنویسی مدل مخصوص کار را حذف می‌کند تا کار از تقدم عادی انتخاب مدل cron پیروی کند (اگر تنظیم شده باشد، بازنویسی ذخیره‌شدهٔ cron-session، وگرنه مدل agent/default). نمی‌تواند با `--model` ترکیب شود.
</ParamField>
<ParamField path="--thinking" type="string">
  بازنویسی سطح thinking.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  در `cron edit`، بازنویسی thinking مخصوص کار را حذف می‌کند تا کار از تقدم عادی thinking در cron پیروی کند. نمی‌تواند با `--thinking` ترکیب شود.
</ParamField>
<ParamField path="--light-context" type="boolean">
  تزریق فایل bootstrap workspace را رد کنید.
</ParamField>
<ParamField path="--tools" type="string">
  محدود کنید کار از کدام ابزارها می‌تواند استفاده کند، برای نمونه `--tools exec,read`.
</ParamField>

`--model` از مدل مجاز انتخاب‌شده به‌عنوان مدل اصلی آن کار استفاده می‌کند. این با بازنویسی `/model` در chat-session یکسان نیست: زنجیره‌های fallback پیکربندی‌شده همچنان وقتی مدل اصلی کار شکست بخورد اعمال می‌شوند. اگر مدل درخواست‌شده مجاز نباشد یا قابل resolve نباشد، cron اجرا را با خطای اعتبارسنجی صریح شکست می‌دهد، به‌جای اینکه بی‌صدا به انتخاب مدل agent/default آن کار fallback کند.

کارهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. وقتی وجود داشته باشد، آن فهرست جایگزین زنجیرهٔ fallback پیکربندی‌شده برای کار می‌شود. وقتی اجرای Cron سخت‌گیرانه‌ای می‌خواهید که فقط مدل انتخاب‌شده را امتحان کند، در payload/API کار از `fallbacks: []` استفاده کنید. اگر کاری `--model` داشته باشد اما نه payload و نه fallbackهای پیکربندی‌شده داشته باشد، OpenClaw یک بازنویسی fallback خالی صریح ارسال می‌کند تا مدل اصلی agent به‌عنوان یک هدف retry اضافی پنهان اضافه نشود.

بررسی‌های preflight ارائه‌دهندهٔ محلی، fallbackهای پیکربندی‌شده را پیش از علامت‌گذاری اجرای Cron به‌عنوان `skipped` پیمایش می‌کنند؛ `fallbacks: []` آن مسیر preflight را سخت‌گیرانه نگه می‌دارد.

تقدم انتخاب مدل برای کارهای ایزوله چنین است:

1. بازنویسی مدل Gmail hook (وقتی اجرا از Gmail آمده باشد و آن بازنویسی مجاز باشد)
2. `model` در payload مخصوص کار
3. بازنویسی ذخیره‌شدهٔ مدل cron session انتخاب‌شده توسط کاربر
4. انتخاب مدل agent/default

حالت سریع نیز از انتخاب live نهایی پیروی می‌کند. اگر پیکربندی مدل انتخاب‌شده `params.fastMode` داشته باشد، cron ایزوله به‌طور پیش‌فرض از آن استفاده می‌کند. بازنویسی `fastMode` ذخیره‌شده در session همچنان در هر دو جهت بر پیکربندی مقدم است. حالت خودکار وقتی موجود باشد از آستانهٔ `params.fastAutoOnSeconds` مدل انتخاب‌شده استفاده می‌کند و مقدار پیش‌فرض آن ۶۰ ثانیه است.

اگر یک اجرای ایزوله به handoff تغییر مدل live برسد، cron با provider/model تغییریافته retry می‌کند و پیش از retry آن انتخاب live را برای اجرای فعال پایدار می‌کند. وقتی تغییر همچنین یک پروفایل auth جدید حمل کند، cron آن بازنویسی پروفایل auth را نیز برای اجرای فعال پایدار می‌کند. retryها محدود هستند: پس از تلاش اولیه به‌اضافهٔ ۲ retry تغییر، cron به‌جای حلقهٔ بی‌پایان abort می‌کند.

پیش از اینکه یک اجرای Cron ایزوله وارد agent runner شود، OpenClaw endpointهای قابل‌دسترسی provider محلی را برای providerهای پیکربندی‌شدهٔ `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها loopback، شبکهٔ خصوصی، یا `.local` است بررسی می‌کند. اگر آن endpoint down باشد، اجرا به‌جای شروع model call، به‌عنوان `skipped` با خطای روشن provider/model ثبت می‌شود. نتیجهٔ endpoint برای ۵ دقیقه cache می‌شود، بنابراین بسیاری از کارهای موعدرسیده که از همان سرور محلی خراب Ollama، vLLM، SGLang، یا LM Studio استفاده می‌کنند، به‌جای ایجاد طوفان درخواست، یک probe کوچک مشترک دارند. اجراهای ردشدهٔ provider-preflight، backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی اعلان‌های تکراری skip می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## تحویل و خروجی

| حالت       | چه اتفاقی می‌افتد                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر agent ارسال نکرده باشد، متن نهایی را با fallback به مقصد تحویل می‌دهد |
| `webhook`  | payload رویداد پایان‌یافته را به یک URL با POST ارسال می‌کند                                |
| `none`     | تحویل fallback توسط runner انجام نمی‌شود                                         |

برای تحویل کانال از `--announce --channel telegram --to "-1001234567890"` استفاده کنید. برای topicهای forum در Telegram، از `-1001234567890:topic:123` استفاده کنید؛ OpenClaw همچنین shorthand متعلق به Telegram یعنی `-1001234567890:123` را می‌پذیرد. فراخوان‌های مستقیم RPC/config می‌توانند `delivery.threadId` را به‌صورت string یا number ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از prefixهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های room در Matrix به بزرگی و کوچکی حروف حساس‌اند؛ از شناسهٔ دقیق room یا فرم `room:!room:server` از Matrix استفاده کنید.

وقتی تحویل announce از `channel: "last"` استفاده می‌کند یا `channel` را حذف می‌کند، مقصدی با prefix provider مانند `telegram:123` می‌تواند پیش از آنکه cron به تاریخچهٔ session یا یک کانال پیکربندی‌شدهٔ واحد fallback کند، کانال را انتخاب کند. فقط prefixهایی که Plugin بارگذاری‌شده advertise می‌کند selectorهای provider هستند. اگر `delivery.channel` صریح باشد، prefix مقصد باید همان provider را نام ببرد؛ برای نمونه، `channel: "whatsapp"` همراه با `to: "telegram:123"` رد می‌شود، به‌جای اینکه اجازه دهد WhatsApp شناسهٔ Telegram را به‌عنوان شماره تلفن تفسیر کند. prefixهای نوع مقصد و service مانند `channel:<id>`، `user:<id>`، `imessage:<handle>`، و `sms:<number>` همچنان syntax مقصد متعلق به کانال هستند، نه selectorهای provider.

برای کارهای ایزوله، تحویل چت مشترک است. اگر route چت در دسترس باشد، agent می‌تواند حتی وقتی کار از `--no-deliver` استفاده می‌کند، از ابزار `message` استفاده کند. اگر agent به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw announce fallback را رد می‌کند. در غیر این صورت `announce`، `webhook`، و `none` فقط کنترل می‌کنند runner پس از turn agent با پاسخ نهایی چه کند.

وقتی یک agent از یک چت فعال reminder ایزوله ایجاد می‌کند، OpenClaw مقصد live delivery حفظ‌شده را برای route announce fallback ذخیره می‌کند. کلیدهای داخلی session ممکن است lowercase باشند؛ وقتی context چت فعلی در دسترس است، مقصدهای delivery provider از آن کلیدها بازسازی نمی‌شوند.

تحویل announce ضمنی از allowlistهای کانال پیکربندی‌شده برای اعتبارسنجی و reroute کردن مقصدهای stale استفاده می‌کند. تأییدهای pairing-store در DM گیرندهٔ fallback automation نیستند؛ وقتی یک scheduled job باید proactive به DM ارسال کند، `delivery.to` را تنظیم کنید یا entry کانال `allowFrom` را پیکربندی کنید.

## زبان خروجی

کارهای Cron زبان پاسخ را از کانال، locale، یا پیام‌های قبلی استنباط نمی‌کنند. قانون زبان را در پیام یا template زمان‌بندی‌شده قرار دهید:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

برای فایل‌های template، دستور زبان را در prompt رندرشده نگه دارید و
بررسی کنید placeholderهایی مانند `{{language}}` پیش از اجرای کار پر شده باشند. اگر
خروجی زبان‌ها را مخلوط می‌کند، قانون را صریح کنید، برای نمونه: "Use Chinese
for narrative text and keep technical terms in English."

اعلان‌های شکست مسیر مقصد جداگانه‌ای را دنبال می‌کنند:

- `cron.failureDestination` پیش‌فرض global را برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و کار از قبل از طریق `announce` تحویل دهد، اعلان‌های شکست اکنون به همان مقصد اصلی announce fallback می‌کنند.
- `delivery.failureDestination` فقط روی کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار global cron را وارد اعلان‌های تکراری اجرای ردشده می‌کند. اجراهای ردشده یک شمارندهٔ skip متوالی جداگانه نگه می‌دارند، بنابراین بر backoff خطای اجرا اثر نمی‌گذارند.

## مثال‌های CLI

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
  <Tab title="خروجی Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="خروجی command">
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

Gateway می‌تواند endpointهای HTTP webhook را برای triggerهای خارجی expose کند. در config فعال کنید:

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

هر request باید token hook را از طریق header شامل کند:

- `Authorization: Bearer <token>` (توصیه‌شده)
- `x-openclaw-token: <token>`

tokenهای query-string رد می‌شوند.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    یک system event را برای session اصلی enqueue کنید:

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
    یک turn ایزولهٔ agent را اجرا کنید:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    فیلدها: `message` (الزامی)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `fallbacks`، `thinking`، `timeoutSeconds`.

  </Accordion>
  <Accordion title="hookهای نگاشت‌شده (POST /hooks/<name>)">
    نام‌های سفارشی hook از طریق `hooks.mappings` در config resolve می‌شوند. نگاشت‌ها می‌توانند payloadهای دلخواه را با templateها یا transformهای کد به actionهای `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
endpointهای hook را پشت loopback، tailnet، یا reverse proxy معتمد نگه دارید.

- از یک توکن اختصاصی برای hook استفاده کنید؛ توکن‌های احراز هویت gateway را دوباره به‌کار نبرید.
- `hooks.path` را روی یک زیرمسیر اختصاصی نگه دارید؛ `/` رد می‌شود.
- `hooks.allowedAgentIds` را تنظیم کنید تا مشخص شود یک hook کدام عامل مؤثر را می‌تواند هدف بگیرد، از جمله عامل پیش‌فرض وقتی `agentId` حذف شده باشد.
- `hooks.allowRequestSessionKey=false` را نگه دارید مگر اینکه به نشست‌های انتخاب‌شده توسط فراخواننده نیاز داشته باشید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را هم تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- payloadهای hook به‌صورت پیش‌فرض با مرزهای ایمنی پوشش داده می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

تریگرهای صندوق ورودی Gmail را از طریق Google PubSub به OpenClaw وصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، hookهای فعال‌شده OpenClaw، Tailscale برای endpoint عمومی HTTPS.
</Note>

### راه‌اندازی ویزاردی (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این دستور پیکربندی `hooks.gmail` را می‌نویسد، preset مربوط به Gmail را فعال می‌کند و از Tailscale Funnel برای endpoint نوع push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` باشد و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام boot، `gog gmail watch serve` را شروع می‌کند و watch را به‌صورت خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

### راه‌اندازی دستی یک‌باره

<Steps>
  <Step title="Select the GCP project">
    پروژه GCP را انتخاب کنید که مالک OAuth client استفاده‌شده توسط `gog` است:

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

`openclaw cron run <jobId>` پس از در صف گذاشتن اجرای دستی برمی‌گردد. برای hookهای shutdown، اسکریپت‌های نگه‌داری، یا هر automation دیگری که باید تا پایان اجرای صف‌شده مسدود بماند، از `--wait` استفاده کنید. حالت wait دقیقاً همان `runId` برگشتی را poll می‌کند؛ برای وضعیت `ok` با `0` خارج می‌شود و برای `error`، `skipped`، یا timeout انتظار، با مقدار غیرصفر خارج می‌شود.

ابزار `cron` عامل از `cron(action: "list")` خلاصه‌های فشرده job (`id`، `name`، `enabled`، `nextRunAtMs`، `scheduleKind`، `lastRunStatus`) را برمی‌گرداند؛ برای تعریف کامل یک job از `cron(action: "get", jobId: "...")` استفاده کنید. فراخواننده‌های مستقیم Gateway می‌توانند `compact: true` را به `cron.list` پاس بدهند؛ حذف آن پاسخ کامل موجود همراه با previewهای تحویل را حفظ می‌کند.

`openclaw cron create` یک alias برای `openclaw cron add` است، و jobهای جدید می‌توانند از یک زمان‌بندی positional (`"0 9 * * 1"`، `"every 1h"`، `"20m"`، یا یک timestamp از نوع ISO) و سپس prompt positional عامل استفاده کنند. روی `cron add|create` یا `cron edit` از `--webhook <url>` استفاده کنید تا payload اجرای تمام‌شده به یک endpoint HTTP با POST ارسال شود. تحویل Webhook را نمی‌توان با flagهای تحویل chat مانند `--announce`، `--channel`، `--to`، `--thread-id`، یا `--account` ترکیب کرد. در `cron edit`، گزینه‌های `--clear-channel`، `--clear-to`، `--clear-thread-id`، و `--clear-account` آن فیلدهای routing را جداگانه unset می‌کنند (هرکدام در کنار flag تنظیم متناظر خودش رد می‌شود)، که با غیرفعال‌کردن تحویل fallback runner توسط `--no-deliver` فرق دارد.

<Note>
نکته override مدل:

- `openclaw cron add|edit --model ...` مدل انتخاب‌شده job را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان provider/model دقیق به اجرای عامل isolated می‌رسد.
- اگر مجاز نباشد یا resolve نشود، cron اجرا را با یک خطای اعتبارسنجی صریح ناموفق می‌کند.
- patchهای payload مربوط به API `cron.update` می‌توانند `model: null` را برای پاک‌کردن override مدل ذخیره‌شده job تنظیم کنند.
- `openclaw cron edit <job-id> --clear-model` آن override را از CLI پاک می‌کند (همان اثر patch با `model: null`) و نمی‌تواند با `--model` ترکیب شود.
- زنجیره‌های fallback پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در cron مدل اصلی job است، نه override نشست `/model`.
- `openclaw cron add|edit --fallbacks ...` مقدار `fallbacks` در payload را تنظیم می‌کند و fallbackهای پیکربندی‌شده برای آن job را جایگزین می‌کند؛ `--fallbacks ""` fallback را غیرفعال می‌کند و اجرا را strict می‌سازد. `openclaw cron edit <job-id> --clear-fallbacks` override مخصوص job را پاک می‌کند.
- یک `--model` ساده بدون فهرست fallback صریح یا پیکربندی‌شده، به‌عنوان یک هدف retry اضافی و بی‌صدا به مدل اصلی عامل fall through نمی‌کند.

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

`maxConcurrentRuns` هم dispatch زمان‌بندی‌شده cron و هم اجرای turn عامل isolated را محدود می‌کند و مقدار پیش‌فرض آن 8 است. turnهای عامل isolated مربوط به cron به‌صورت داخلی از lane اجرای اختصاصی `cron-nested` در queue استفاده می‌کنند، بنابراین افزایش این مقدار باعث می‌شود اجراهای مستقل LLM مربوط به cron به‌جای اینکه فقط wrapperهای بیرونی cron خود را شروع کنند، به‌صورت موازی پیش بروند. lane مشترک غیر cron با نام `nested` با این تنظیم گسترده‌تر نمی‌شود.

`cron.store` یک کلید store منطقی و مسیر import قدیمی doctor است. برای import کردن storeهای JSON موجود به SQLite و archive کردن آن‌ها، `openclaw doctor --fix` را اجرا کنید؛ تغییرات آینده cron باید از طریق CLI یا API Gateway انجام شوند.

غیرفعال‌کردن cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **retry یک‌باره**: خطاهای گذرا (rate limit، overload، network، server error) تا 3 بار با backoff نمایی retry می‌شوند. خطاهای دائمی فوراً غیرفعال می‌شوند.

    **retry تکرارشونده**: backoff نمایی (30s تا 60m) بین retryها. backoff پس از اجرای موفق بعدی reset می‌شود.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (پیش‌فرض `24h`) entryهای نشست اجرای isolated را prune می‌کند. `cron.runLog.keepLines` تعداد rowهای نگه‌داری‌شده تاریخچه اجرای SQLite را برای هر job محدود می‌کند؛ `maxBytes` برای سازگاری پیکربندی با run logهای قدیمی مبتنی بر فایل حفظ شده است.
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
  <Accordion title="Cron not firing">
    - متغیر env مربوط به `cron.enabled` و `OPENCLAW_SKIP_CRON` را بررسی کنید.
    - تأیید کنید Gateway به‌صورت پیوسته در حال اجراست.
    - برای زمان‌بندی‌های `cron`، timezone (`--tz`) را در برابر timezone میزبان بررسی کنید.
    - وجود `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و job هنوز due نبوده است.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - حالت تحویل `none` یعنی هیچ ارسال fallback از runner انتظار نمی‌رود. عامل همچنان می‌تواند وقتی مسیر chat موجود است، مستقیماً با ابزار `message` ارسال کند.
    - نبودن یا نامعتبر بودن هدف تحویل (`channel`/`to`) یعنی outbound رد شده است.
    - برای Matrix، jobهای کپی‌شده یا قدیمی با room IDهای `delivery.to` که lowercase شده‌اند ممکن است fail شوند، چون room IDهای Matrix به حروف بزرگ و کوچک حساس‌اند. job را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت channel (`unauthorized`، `Forbidden`) یعنی تحویل توسط credentials مسدود شده است.
    - اگر اجرای isolated فقط توکن silent (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل outbound مستقیم را suppress می‌کند و مسیر summary صف‌شده fallback را هم suppress می‌کند، بنابراین چیزی به chat ارسال نمی‌شود.
    - اگر عامل باید خودش به کاربر پیام بدهد، بررسی کنید job یک مسیر قابل استفاده داشته باشد (`channel: "last"` با یک chat قبلی، یا channel/target صریح).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - تازگی reset روزانه و idle بر پایه `updatedAt` نیست؛ [مدیریت نشست](/fa/concepts/session#session-lifecycle) را ببینید.
    - wakeupهای Cron، اجرای heartbeat، اعلان‌های exec، و bookkeeping مربوط به gateway ممکن است row نشست را برای routing/status به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای rowهای قدیمی که پیش از وجود آن فیلدها ساخته شده‌اند، OpenClaw وقتی فایل هنوز در دسترس باشد می‌تواند `sessionStartedAt` را از header نشست transcript JSONL بازیابی کند. rowهای idle قدیمی بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان baseline idle خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron بدون `--tz` از timezone میزبان gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند.
    - `activeHours` مربوط به Heartbeat از resolution پیکربندی‌شده timezone استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [Automation](/fa/automation) — همه سازوکارهای automation در یک نگاه
- [Background Tasks](/fa/automation/tasks) — دفتر task برای اجراهای cron
- [Heartbeat](/fa/gateway/heartbeat) — turnهای دوره‌ای نشست اصلی
- [Timezone](/fa/concepts/timezone) — پیکربندی timezone
