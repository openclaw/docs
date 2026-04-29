---
read_when:
    - زمان‌بندی کارهای پس‌زمینه یا بیدارسازی‌ها
    - اتصال محرک‌های خارجی (Webhookها، Gmail) به OpenClaw
    - تصمیم‌گیری میان Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Scheduled tasks
summary: کارهای زمان‌بندی‌شده، Webhook‌ها و محرک‌های Gmail PubSub برای زمان‌بند Gateway
title: وظایف زمان‌بندی‌شده
x-i18n:
    generated_at: "2026-04-29T22:23:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron زمان‌بند داخلی Gateway است. Jobها را ماندگار می‌کند، agent را در زمان درست بیدار می‌کند، و می‌تواند خروجی را به یک channel چت یا endpoint Webhook برساند.

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
  <Step title="بررسی jobها">
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

- Cron **داخل فرایند Gateway** اجرا می‌شود (نه داخل model).
- تعریف‌های job در `~/.openclaw/cron/jobs.json` ماندگار می‌شوند تا restartها scheduleها را از بین نبرند.
- وضعیت اجرای runtime کنار آن در `~/.openclaw/cron/jobs-state.json` ماندگار می‌شود. اگر تعریف‌های cron را در git دنبال می‌کنید، `jobs.json` را دنبال کنید و `jobs-state.json` را در gitignore قرار دهید.
- پس از جداسازی، نسخه‌های قدیمی‌تر OpenClaw می‌توانند `jobs.json` را بخوانند اما ممکن است jobها را تازه در نظر بگیرند، چون فیلدهای runtime اکنون در `jobs-state.json` قرار دارند.
- وقتی `jobs.json` هنگام اجرا بودن یا متوقف بودن Gateway ویرایش می‌شود، OpenClaw فیلدهای schedule تغییریافته را با metadata اسلات runtime در انتظار مقایسه می‌کند و مقدارهای کهنه `nextRunAtMs` را پاک می‌کند. بازنویسی‌هایی که فقط formatting یا فقط ترتیب keyها را تغییر می‌دهند، اسلات در انتظار را حفظ می‌کنند.
- همه اجراهای cron رکوردهای [background task](/fa/automation/tasks) ایجاد می‌کنند.
- هنگام startup Gateway، jobهای overdue از نوع isolated agent-turn به‌جای replay فوری، بیرون از بازه اتصال channel دوباره schedule می‌شوند تا startup در Discord/Telegram و setup فرمان‌های native پس از restartها پاسخ‌گو بماند.
- jobهای یک‌باره (`--at`) به‌طور پیش‌فرض پس از موفقیت auto-delete می‌شوند.
- اجراهای isolated cron پس از کامل شدن run، tabها/فرایندهای browser ردیابی‌شده را برای session `cron:<jobId>` خود به‌صورت best-effort می‌بندند تا automation جداشده browser فرایندهای orphan باقی نگذارد.
- اجراهای isolated cron همچنین در برابر پاسخ‌های acknowledgement کهنه guard می‌کنند. اگر اولین نتیجه فقط یک status update موقت باشد (`on it`، `pulling everything together` و hintهای مشابه) و هیچ اجرای subagent نواده هنوز مسئول پاسخ نهایی نباشد، OpenClaw یک بار دیگر برای نتیجه واقعی پیش از delivery prompt می‌دهد.
- اجراهای isolated cron ابتدا metadata ساختاریافته execution-denial را از embedded run ترجیح می‌دهند، سپس به markerهای final summary/output شناخته‌شده مانند `SYSTEM_RUN_DENIED` و `INVALID_REQUEST` fallback می‌کنند، تا یک command مسدودشده به‌عنوان run سبز گزارش نشود.
- اجراهای isolated cron همچنین failureهای سطح run مربوط به agent را حتی وقتی هیچ reply payload تولید نشده باشد، به‌عنوان خطای job در نظر می‌گیرند، تا failureهای model/provider شمارنده‌های error را افزایش دهند و notificationهای failure را trigger کنند، نه اینکه job را موفق پاک کنند.
- وقتی یک job از نوع isolated agent-turn به `timeoutSeconds` می‌رسد، cron اجرای agent زیرین را abort می‌کند و یک بازه کوتاه cleanup به آن می‌دهد. اگر run تخلیه نشود، cleanup مالک Gateway پیش از اینکه cron timeout را ثبت کند، مالکیت session آن run را force-clear می‌کند تا کار چت صف‌شده پشت یک session پردازش کهنه باقی نماند.

<a id="maintenance"></a>

<Note>
reconciliation تسک برای cron ابتدا مالک runtime است و در مرحله دوم پشتوانه durable-history دارد: یک تسک cron فعال تا وقتی cron runtime هنوز آن job را در حال اجرا دنبال می‌کند، live می‌ماند، حتی اگر یک ردیف child session قدیمی هنوز وجود داشته باشد. وقتی runtime دیگر مالک job نباشد و بازه grace پنج‌دقیقه‌ای منقضی شود، maintenance لاگ‌های run ماندگار و وضعیت job را برای run منطبق `cron:<jobId>:<startedAt>` بررسی می‌کند. اگر آن durable history یک نتیجه terminal نشان دهد، task ledger از آن نهایی می‌شود؛ در غیر این صورت maintenance مالک Gateway می‌تواند task را `lost` علامت‌گذاری کند. audit آفلاین CLI می‌تواند از durable history بازیابی کند، اما مجموعه active-job خالی خودش در فرایند را به‌عنوان proof اینکه یک run cron مالک Gateway از بین رفته است در نظر نمی‌گیرد.
</Note>

## انواع schedule

| نوع     | flag در CLI | توضیح                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp یک‌باره (ISO 8601 یا relative مانند `20m`)   |
| `every` | `--every` | interval ثابت                                           |
| `cron`  | `--cron`  | عبارت cron پنج‌فیلدی یا شش‌فیلدی با `--tz` اختیاری     |

timestampهای بدون timezone به‌عنوان UTC در نظر گرفته می‌شوند. برای schedule بر اساس ساعت دیواری محلی، `--tz America/New_York` را اضافه کنید.

عبارت‌های recurring سر ساعت به‌صورت خودکار تا 5 دقیقه stagger می‌شوند تا spikeهای load کاهش یابد. برای timing دقیق از `--exact` استفاده کنید یا برای یک window صریح از `--stagger 30s`.

### day-of-month و day-of-week از منطق OR استفاده می‌کنند

عبارت‌های Cron توسط [croner](https://github.com/Hexagon/croner) parse می‌شوند. وقتی هر دو فیلد day-of-month و day-of-week غیر wildcard باشند، croner زمانی match می‌کند که **هرکدام** از فیلدها match شود، نه هر دو. این رفتار استاندارد Vixie cron است.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

این به‌جای 0 تا 1 بار در ماه، حدود 5 تا 6 بار در ماه fire می‌شود. OpenClaw اینجا از رفتار OR پیش‌فرض Croner استفاده می‌کند. برای الزام به هر دو شرط، از modifier day-of-week با `+` در Croner استفاده کنید (`0 9 15 * +1`) یا روی یک فیلد schedule کنید و دیگری را در prompt یا command job خود guard کنید.

## سبک‌های اجرا

| سبک            | مقدار `--session`   | اجرا در                  | مناسب برای                         |
| --------------- | ------------------- | ------------------------ | ---------------------------------- |
| session اصلی    | `main`              | نوبت Heartbeat بعدی      | یادآورها، system eventها           |
| isolated        | `isolated`          | `cron:<jobId>` اختصاصی   | گزارش‌ها، کارهای پس‌زمینه          |
| session فعلی    | `current`           | بسته‌شده در زمان ایجاد   | کار recurring آگاه از context      |
| session سفارشی  | `session:custom-id` | session نام‌دار ماندگار  | workflowهایی که بر history بنا می‌شوند |

<AccordionGroup>
  <Accordion title="session اصلی در برابر isolated در برابر custom">
    jobهای **session اصلی** یک system event را enqueue می‌کنند و به‌صورت اختیاری Heartbeat را بیدار می‌کنند (`--wake now` یا `--wake next-heartbeat`). آن system eventها freshness مربوط به reset روزانه/idle را برای session هدف extend نمی‌کنند. jobهای **isolated** یک agent turn اختصاصی با session تازه اجرا می‌کنند. **sessionهای سفارشی** (`session:xxx`) context را در runها ماندگار می‌کنند و workflowهایی مانند standupهای روزانه را ممکن می‌سازند که بر summaryهای قبلی بنا می‌شوند.
  </Accordion>
  <Accordion title="معنای «session تازه» برای jobهای isolated">
    برای jobهای isolated، «session تازه» یعنی یک transcript/session id جدید برای هر run. OpenClaw ممکن است preferenceهای safe مانند تنظیمات thinking/fast/verbose، labelها، و overrideهای صریح model/auth انتخاب‌شده توسط کاربر را حمل کند، اما context گفت‌وگوی ambient را از یک ردیف cron قدیمی به ارث نمی‌برد: routing channel/group، policy مربوط به send یا queue، elevation، origin، یا binding runtime ACP. وقتی یک job recurring باید عمدا بر همان context گفت‌وگو بنا شود، از `current` یا `session:<id>` استفاده کنید.
  </Accordion>
  <Accordion title="cleanup در runtime">
    برای jobهای isolated، teardown در runtime اکنون شامل cleanup به‌صورت best-effort برای browser مربوط به آن session cron است. failureهای cleanup نادیده گرفته می‌شوند تا نتیجه واقعی cron همچنان اولویت داشته باشد.

    اجراهای isolated cron همچنین هر نمونه bundled MCP runtime ایجادشده برای job را از مسیر مشترک runtime-cleanup dispose می‌کنند. این با teardown شدن clientهای MCP در main-session و custom-session همخوان است، بنابراین jobهای isolated cron فرایندهای child مربوط به stdio یا connectionهای بلندمدت MCP را در runها leak نمی‌کنند.

  </Accordion>
  <Accordion title="subagent و delivery در Discord">
    وقتی اجراهای isolated cron subagentها را orchestrate می‌کنند، delivery همچنین خروجی نهایی نواده را بر متن موقت parent کهنه ترجیح می‌دهد. اگر نواده‌ها هنوز در حال اجرا باشند، OpenClaw آن update جزئی parent را به‌جای اعلام کردن suppress می‌کند.

    برای targetهای announce در Discord که فقط متن هستند، OpenClaw متن canonical نهایی assistant را یک‌بار می‌فرستد، به‌جای اینکه هم payloadهای متن streamed/intermediate و هم پاسخ نهایی را replay کند. payloadهای media و structured Discord همچنان به‌عنوان payloadهای جداگانه deliver می‌شوند تا attachmentها و componentها drop نشوند.

  </Accordion>
</AccordionGroup>

### گزینه‌های payload برای jobهای isolated

<ParamField path="--message" type="string" required>
  متن prompt (برای isolated الزامی است).
</ParamField>
<ParamField path="--model" type="string">
  override مدل؛ از selected allowed model برای job استفاده می‌کند.
</ParamField>
<ParamField path="--thinking" type="string">
  override سطح thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  injection فایل bootstrap workspace را skip می‌کند.
</ParamField>
<ParamField path="--tools" type="string">
  toolهایی را که job می‌تواند استفاده کند محدود می‌کند، برای مثال `--tools exec,read`.
</ParamField>

`--model` از selected allowed model به‌عنوان model اصلی آن job استفاده می‌کند. این با override مربوط به `/model` در chat-session یکسان نیست: chainهای fallback پیکربندی‌شده هنوز وقتی model اصلی job fail شود اعمال می‌شوند. اگر model درخواست‌شده allowed نباشد یا resolve نشود، cron به‌جای fallback بی‌صدا به انتخاب model مربوط به agent/default job، run را با یک validation error صریح fail می‌کند.

jobهای Cron همچنین می‌توانند `fallbacks` در سطح payload داشته باشند. در صورت وجود، آن list جایگزین chain fallback پیکربندی‌شده برای job می‌شود. وقتی یک run سخت‌گیرانه cron می‌خواهید که فقط selected model را امتحان کند، در payload/API job از `fallbacks: []` استفاده کنید. اگر job دارای `--model` باشد اما نه fallbackهای payload و نه fallbackهای پیکربندی‌شده داشته باشد، OpenClaw یک override fallback خالی صریح pass می‌کند تا agent primary به‌عنوان target retry اضافی و پنهان append نشود.

precedence انتخاب model برای jobهای isolated این است:

1. override مدل hook مربوط به Gmail (وقتی run از Gmail آمده باشد و آن override allowed باشد)
2. `model` در payload هر job
3. override مدل stored cron session انتخاب‌شده توسط کاربر
4. انتخاب model مربوط به Agent/default

Fast mode نیز از resolved live selection پیروی می‌کند. اگر config مربوط به selected model دارای `params.fastMode` باشد، isolated cron به‌صورت پیش‌فرض از آن استفاده می‌کند. override ذخیره‌شده session برای `fastMode` همچنان در هر دو جهت بر config مقدم است.

اگر یک run isolated به handoff live model-switch برسد، cron با provider/model سوییچ‌شده retry می‌کند و آن live selection را پیش از retry برای active run ماندگار می‌کند. وقتی switch همچنین یک auth profile جدید داشته باشد، cron آن override auth profile را نیز برای active run ماندگار می‌کند. retryها محدودند: پس از تلاش اولیه به‌علاوه 2 retry برای switch، cron به‌جای loop بی‌نهایت abort می‌کند.

پیش از اینکه یک run isolated cron وارد agent runner شود، OpenClaw endpointهای provider محلی قابل‌دسترسی را برای providerهای پیکربندی‌شده `api: "ollama"` و `api: "openai-completions"` که `baseUrl` آن‌ها loopback، private-network یا `.local` است بررسی می‌کند. اگر آن endpoint down باشد، run به‌جای شروع یک model call، با یک خطای روشن provider/model به‌صورت `skipped` ثبت می‌شود. نتیجه endpoint برای 5 دقیقه cache می‌شود، بنابراین بسیاری از jobهای due که از همان server محلی مرده Ollama، vLLM، SGLang یا LM Studio استفاده می‌کنند، به‌جای ایجاد storm درخواست، یک probe کوچک مشترک دارند. runهای skipped مربوط به provider-preflight، backoff خطای اجرا را افزایش نمی‌دهند؛ وقتی notificationهای skip تکراری می‌خواهید، `failureAlert.includeSkipped` را فعال کنید.

## delivery و output

| mode       | اتفاقی که می‌افتد                                                  |
| ---------- | ------------------------------------------------------------------- |
| `announce` | اگر agent ارسال نکرده باشد، متن نهایی را به target fallback-deliver می‌کند |
| `webhook`  | payload رویداد finished را به یک URL POST می‌کند                    |
| `none`     | بدون fallback delivery از runner                                    |

از `--announce --channel telegram --to "-1001234567890"` برای تحویل به کانال استفاده کنید. برای موضوع‌های انجمن Telegram، از `-1001234567890:topic:123` استفاده کنید؛ فراخواننده‌های مستقیم RPC/پیکربندی نیز می‌توانند `delivery.threadId` را به‌صورت رشته یا عدد ارسال کنند. مقصدهای Slack/Discord/Mattermost باید از پیشوندهای صریح استفاده کنند (`channel:<id>`، `user:<id>`). شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند؛ از شناسه دقیق اتاق یا قالب `room:!room:server` از Matrix استفاده کنید.

برای کارهای ایزوله، تحویل چت مشترک است. اگر مسیر چت در دسترس باشد، عامل می‌تواند حتی وقتی کار از `--no-deliver` استفاده می‌کند از ابزار `message` استفاده کند. اگر عامل به مقصد پیکربندی‌شده/فعلی ارسال کند، OpenClaw اعلام جایگزین را رد می‌کند. در غیر این صورت `announce`، `webhook`، و `none` فقط کنترل می‌کنند اجراکننده پس از نوبت عامل با پاسخ نهایی چه کند.

وقتی عاملی از یک چت فعال یک یادآور ایزوله ایجاد می‌کند، OpenClaw مقصد تحویل زنده حفظ‌شده را برای مسیر اعلام جایگزین ذخیره می‌کند. کلیدهای نشست داخلی ممکن است حروف کوچک باشند؛ وقتی زمینه چت فعلی در دسترس است، مقصدهای تحویل ارائه‌دهنده از آن کلیدها بازسازی نمی‌شوند.

اعلان‌های شکست مسیر مقصد جداگانه‌ای را دنبال می‌کنند:

- `cron.failureDestination` پیش‌فرض سراسری را برای اعلان‌های شکست تنظیم می‌کند.
- `job.delivery.failureDestination` آن را برای هر کار بازنویسی می‌کند.
- اگر هیچ‌کدام تنظیم نشده باشد و کار از قبل از طریق `announce` تحویل دهد، اعلان‌های شکست اکنون به همان مقصد اصلی اعلام بازمی‌گردند.
- `delivery.failureDestination` فقط در کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه حالت تحویل اصلی `webhook` باشد.
- `failureAlert.includeSkipped: true` یک کار یا سیاست هشدار Cron سراسری را برای هشدارهای تکراری اجرای ردشده فعال می‌کند. اجراهای ردشده شمارنده ردشدن متوالی جداگانه‌ای نگه می‌دارند، بنابراین روی عقب‌نشینی خطای اجرا اثر نمی‌گذارند.

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

Gateway می‌تواند نقاط پایانی HTTP Webhook را برای محرک‌های خارجی ارائه کند. در پیکربندی فعال کنید:

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

هر درخواست باید توکن hook را از طریق سرآیند شامل کند:

- `Authorization: Bearer <token>` (توصیه‌شده)
- `x-openclaw-token: <token>`

توکن‌های رشته پرس‌وجو رد می‌شوند.

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
    نام‌های hook سفارشی از طریق `hooks.mappings` در پیکربندی حل می‌شوند. نگاشت‌ها می‌توانند payloadهای دلخواه را با قالب‌ها یا تبدیل‌های کدی به کنش‌های `wake` یا `agent` تبدیل کنند.
  </Accordion>
</AccordionGroup>

<Warning>
نقاط پایانی hook را پشت loopback، tailnet، یا reverse proxy معتمد نگه دارید.

- از یک توکن اختصاصی hook استفاده کنید؛ توکن‌های احراز هویت gateway را دوباره استفاده نکنید.
- `hooks.path` را روی یک زیرمسیر اختصاصی نگه دارید؛ `/` رد می‌شود.
- `hooks.allowedAgentIds` را تنظیم کنید تا مسیریابی صریح `agentId` محدود شود.
- مگر اینکه به نشست‌های انتخاب‌شده توسط فراخواننده نیاز داشته باشید، `hooks.allowRequestSessionKey=false` را نگه دارید.
- اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، همچنین `hooks.allowedSessionKeyPrefixes` را تنظیم کنید تا شکل‌های مجاز کلید نشست محدود شوند.
- payloadهای hook به‌صورت پیش‌فرض با مرزهای ایمنی پوشانده می‌شوند.

</Warning>

## یکپارچه‌سازی Gmail PubSub

محرک‌های صندوق ورودی Gmail را از طریق Google PubSub به OpenClaw متصل کنید.

<Note>
**پیش‌نیازها:** CLI `gcloud`، `gog` (gogcli)، hookهای OpenClaw فعال، Tailscale برای نقطه پایانی عمومی HTTPS.
</Note>

### راه‌اندازی با ویزارد (توصیه‌شده)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

این دستور پیکربندی `hooks.gmail` را می‌نویسد، preset مربوط به Gmail را فعال می‌کند، و از Tailscale Funnel برای نقطه پایانی push استفاده می‌کند.

### شروع خودکار Gateway

وقتی `hooks.enabled=true` و `hooks.gmail.account` تنظیم شده باشد، Gateway هنگام راه‌اندازی `gog gmail watch serve` را اجرا می‌کند و watch را خودکار تمدید می‌کند. برای انصراف، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.

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

- `openclaw cron add|edit --model ...` مدل انتخاب‌شده کار را تغییر می‌دهد.
- اگر مدل مجاز باشد، همان ارائه‌دهنده/مدل دقیق به اجرای عامل ایزوله می‌رسد.
- اگر مجاز نباشد یا قابل حل نباشد، Cron اجرا را با یک خطای اعتبارسنجی صریح ناموفق می‌کند.
- زنجیره‌های جایگزین پیکربندی‌شده همچنان اعمال می‌شوند، چون `--model` در Cron مدل اصلی کار است، نه بازنویسی `/model` نشست.
- payload `fallbacks` جایگزین fallbackهای پیکربندی‌شده برای آن کار می‌شود؛ `fallbacks: []` fallback را غیرفعال می‌کند و اجرا را سخت‌گیرانه می‌سازد.
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

`maxConcurrentRuns` هم ارسال Cron زمان‌بندی‌شده و هم اجرای نوبت عامل ایزوله را محدود می‌کند. نوبت‌های عامل Cron ایزوله به‌صورت داخلی از مسیر اجرای اختصاصی `cron-nested` صف استفاده می‌کنند، بنابراین افزایش این مقدار باعث می‌شود اجراهای مستقل LLM مربوط به Cron به‌جای اینکه فقط wrapperهای بیرونی Cron شروع شوند، به‌صورت موازی پیش بروند. مسیر مشترک غیر-Cron یعنی `nested` با این تنظیم گسترش نمی‌یابد.

sidecar وضعیت زمان اجرا از `cron.store` مشتق می‌شود: یک store با پسوند `.json` مانند `~/clawd/cron/jobs.json` از `~/clawd/cron/jobs-state.json` استفاده می‌کند، در حالی که مسیر store بدون پسوند `.json` مقدار `-state.json` را به انتهای مسیر اضافه می‌کند.

اگر `jobs.json` را دستی ویرایش می‌کنید، `jobs-state.json` را از کنترل نسخه بیرون نگه دارید. OpenClaw از آن sidecar برای slotهای در انتظار، نشانگرهای فعال، فراداده آخرین اجرا، و هویت زمان‌بندی استفاده می‌کند که به زمان‌بند می‌گوید چه زمانی یک کار ویرایش‌شده خارجی به `nextRunAtMs` تازه نیاز دارد.

غیرفعال کردن Cron: `cron.enabled: false` یا `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="رفتار retry">
    **retry یک‌باره**: خطاهای گذرا (محدودیت نرخ، overload، شبکه، خطای سرور) تا ۳ بار با عقب‌نشینی نمایی retry می‌شوند. خطاهای دائمی بلافاصله غیرفعال می‌شوند.

    **retry تکرارشونده**: عقب‌نشینی نمایی (۳۰ ثانیه تا ۶۰ دقیقه) بین retryها. عقب‌نشینی پس از اجرای موفق بعدی بازنشانی می‌شود.

  </Accordion>
  <Accordion title="نگهداری">
    `cron.sessionRetention` (پیش‌فرض `24h`) ورودی‌های نشست اجرای ایزوله را پاک‌سازی می‌کند. `cron.runLog.maxBytes` / `cron.runLog.keepLines` فایل‌های run-log را خودکار پاک‌سازی می‌کنند.
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
    - تأیید کنید Gateway به‌طور پیوسته در حال اجراست.
    - برای زمان‌بندی‌های `cron`، منطقه زمانی (`--tz`) را در برابر منطقه زمانی میزبان بررسی کنید.
    - `reason: not-due` در خروجی اجرا یعنی اجرای دستی با `openclaw cron run <jobId> --due` بررسی شده و کار هنوز موعدش نرسیده بود.

  </Accordion>
  <Accordion title="Cron اجرا شد اما تحویلی انجام نشد">
    - حالت تحویل `none` یعنی هیچ ارسال جایگزین توسط runner انتظار نمی‌رود. عامل همچنان می‌تواند وقتی مسیر چت در دسترس باشد مستقیماً با ابزار `message` ارسال کند.
    - مقصد تحویل گم‌شده/نامعتبر (`channel`/`to`) یعنی خروجی رد شده است.
    - برای Matrix، کارهای کپی‌شده یا قدیمی با شناسه‌های اتاق `delivery.to` کوچک‌شده ممکن است شکست بخورند چون شناسه‌های اتاق Matrix به بزرگی و کوچکی حروف حساس‌اند. کار را به مقدار دقیق `!room:server` یا `room:!room:server` از Matrix ویرایش کنید.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی تحویل توسط اعتبارنامه‌ها مسدود شده است.
    - اگر اجرای ایزوله فقط توکن سکوت (`NO_REPLY` / `no_reply`) را برگرداند، OpenClaw تحویل خروجی مستقیم را سرکوب می‌کند و همچنین مسیر خلاصه صف‌شده جایگزین را سرکوب می‌کند، بنابراین چیزی به چت ارسال نمی‌شود.
    - اگر عامل باید خودش به کاربر پیام بدهد، بررسی کنید کار یک مسیر قابل استفاده دارد (`channel: "last"` با یک چت قبلی، یا یک کانال/مقصد صریح).

  </Accordion>
  <Accordion title="به نظر می‌رسد Cron یا Heartbeat مانع چرخش /new-style می‌شود">
    - تازگی بازنشانی روزانه و هنگام بی‌کاری بر اساس `updatedAt` نیست؛ [مدیریت نشست](/fa/concepts/session#session-lifecycle) را ببینید.
    - بیدارباش‌های Cron، اجرای Heartbeat، اعلان‌های exec و امور دفترداری Gateway ممکن است ردیف نشست را برای مسیریابی/وضعیت به‌روزرسانی کنند، اما `sessionStartedAt` یا `lastInteractionAt` را تمدید نمی‌کنند.
    - برای ردیف‌های قدیمی که پیش از وجود این فیلدها ایجاد شده‌اند، OpenClaw می‌تواند وقتی فایل هنوز در دسترس است، `sessionStartedAt` را از سرآیند نشست transcript JSONL بازیابی کند. ردیف‌های قدیمیِ بی‌کار بدون `lastInteractionAt` از همان زمان شروع بازیابی‌شده به‌عنوان مبنای بی‌کاری خود استفاده می‌کنند.

  </Accordion>
  <Accordion title="نکات ظریف منطقه زمانی">
    - Cron بدون `--tz` از منطقه زمانی میزبان Gateway استفاده می‌کند.
    - زمان‌بندی‌های `at` بدون منطقه زمانی، UTC در نظر گرفته می‌شوند.
    - `activeHours` در Heartbeat از تفکیک منطقه زمانی پیکربندی‌شده استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [اتوماسیون و وظایف](/fa/automation) — نمای کلی همه سازوکارهای اتوماسیون
- [وظایف پس‌زمینه](/fa/automation/tasks) — دفتر ثبت وظایف برای اجرای cron
- [Heartbeat](/fa/gateway/heartbeat) — نوبت‌های دوره‌ای نشست اصلی
- [منطقه زمانی](/fa/concepts/timezone) — پیکربندی منطقه زمانی
