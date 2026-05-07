---
read_when:
    - می‌خواهید کار پس‌زمینه‌ای یا موازی از طریق عامل انجام شود
    - شما در حال تغییر سیاست ابزار sessions_spawn یا زیرعامل هستید
    - شما در حال پیاده‌سازی یا عیب‌یابی نشست‌های زیرعاملِ مقید به رشته هستید
sidebarTitle: Sub-agents
summary: اجراهای ایزولهٔ عامل در پس‌زمینه را ایجاد کنید که نتایج را به گفت‌وگوی درخواست‌دهنده اعلام می‌کنند
title: عامل‌های فرعی
x-i18n:
    generated_at: "2026-05-07T13:33:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agentها اجراهای agent پس‌زمینه هستند که از یک اجرای agent موجود ساخته می‌شوند.
آن‌ها در session خودشان (`agent:<agentId>:subagent:<uuid>`) اجرا می‌شوند و،
پس از پایان، نتیجه خود را به channel گفت‌وگوی requester **اعلام** می‌کنند.
هر اجرای sub-agent به‌عنوان یک
[وظیفه پس‌زمینه](/fa/automation/tasks) ردیابی می‌شود.

اهداف اصلی:

- موازی‌سازی کارهای «پژوهش / وظیفه طولانی / ابزار کند» بدون مسدود کردن اجرای اصلی.
- ایزوله نگه داشتن sub-agentها به‌صورت پیش‌فرض (جداسازی session + sandboxing اختیاری).
- سخت کردن سوءاستفاده از سطح ابزار: sub-agentها به‌صورت پیش‌فرض ابزارهای session را دریافت نمی‌کنند.
- پشتیبانی از عمق nesting قابل‌پیکربندی برای الگوهای orchestrator.

<Note>
**نکته هزینه:** هر sub-agent به‌صورت پیش‌فرض context و مصرف token خودش را دارد.
برای وظایف سنگین یا تکراری، یک model ارزان‌تر برای sub-agentها تنظیم کنید
و agent اصلی خود را روی model باکیفیت‌تر نگه دارید. از طریق
`agents.defaults.subagents.model` یا overrideهای هر agent پیکربندی کنید. وقتی یک child
    واقعا به transcript فعلی requester نیاز دارد، agent می‌تواند برای همان spawn
    مقدار `context: "fork"` را درخواست کند. sessionهای subagent وابسته به thread به‌صورت پیش‌فرض
    `context: "fork"` دارند، چون گفت‌وگوی فعلی را به یک thread پیگیری منشعب می‌کنند.
</Note>

## دستور Slash

از `/subagents` برای بررسی یا کنترل اجراهای sub-agent برای **session فعلی** استفاده کنید:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

از [`/steer <message>`](/fa/tools/steer) سطح بالا برای هدایت اجرای فعال session فعلی requester استفاده کنید. وقتی هدف یک اجرای child است، از `/subagents steer <id|#> <message>` استفاده کنید.

`/subagents info` metadata اجرا را نشان می‌دهد (status، timestampها، session id،
مسیر transcript، cleanup). برای نمای recall محدود و safety-filtered از `sessions_history` استفاده کنید؛ وقتی به transcript خام و کامل نیاز دارید، مسیر transcript روی disk را بررسی کنید.

### کنترل‌های binding به thread

این دستورها روی channelهایی کار می‌کنند که از bindingهای پایدار thread پشتیبانی می‌کنند.
پایین‌تر [کانال‌های پشتیبان thread](#thread-supporting-channels) را ببینید.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### رفتار spawn

`/subagents spawn` یک sub-agent پس‌زمینه را به‌عنوان دستور user شروع می‌کند (نه یک relay داخلی)
و وقتی اجرا پایان یافت، یک به‌روزرسانی نهایی completion به گفت‌وگوی requester می‌فرستد.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - دستور spawn غیرمسدودکننده است؛ بلافاصله یک run id برمی‌گرداند.
    - هنگام completion، sub-agent یک پیام summary/result به channel گفت‌وگوی requester اعلام می‌کند.
    - completion به‌صورت push-based است. پس از spawn شدن، فقط برای انتظار پایان آن، `/subagents list`، `sessions_list` یا `sessions_history` را در یک loop poll نکنید؛ status را فقط هنگام نیاز برای debugging یا intervention بررسی کنید.
    - هنگام completion، OpenClaw به‌صورت best-effort tabها/processهای browser ردیابی‌شده‌ای را که آن session sub-agent باز کرده است می‌بندد، سپس جریان announce cleanup ادامه می‌یابد.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw completionها را از طریق یک turn از نوع `agent` با کلید idempotency پایدار به session requester برمی‌گرداند.
    - اگر اجرای requester هنوز active باشد، OpenClaw ابتدا تلاش می‌کند به‌جای شروع مسیر پاسخ visible دوم، همان اجرا را wake/steer کند.
    - اگر handoff تکمیل requester-agent شکست بخورد یا خروجی visible تولید نکند، OpenClaw delivery را failed در نظر می‌گیرد و به queue routing/retry fallback می‌کند. نتیجه child را مستقیما به external chat raw-send نمی‌کند.
    - اگر direct handoff قابل استفاده نباشد، به queue routing fallback می‌کند.
    - اگر queue routing همچنان در دسترس نباشد، announce با یک exponential backoff کوتاه دوباره تلاش می‌شود و سپس نهایتا give-up انجام می‌شود.
    - delivery تکمیل، مسیر requester حل‌شده را نگه می‌دارد: routeهای completion وابسته به thread یا conversation وقتی در دسترس باشند برنده می‌شوند؛ اگر origin تکمیل فقط یک channel ارائه کند، OpenClaw target/account گمشده را از route حل‌شده session requester (`lastChannel` / `lastTo` / `lastAccountId`) پر می‌کند تا direct delivery همچنان کار کند.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    handoff تکمیل به session requester، context داخلی تولیدشده در runtime است
    (نه متن نوشته‌شده توسط user) و شامل این موارد است:

    - `Result` — آخرین متن reply visible از `assistant`، در غیر این صورت آخرین متن tool/toolResult پاک‌سازی‌شده. اجراهای terminal failed از متن reply ثبت‌شده دوباره استفاده نمی‌کنند.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - آمار compact runtime/token.
    - یک instruction مربوط به delivery که به agent requester می‌گوید با صدای معمول assistant بازنویسی کند (نه اینکه metadata داخلی خام را forward کند).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` و `--thinking` مقدارهای پیش‌فرض را برای همان اجرای خاص override می‌کنند.
    - برای بررسی جزئیات و خروجی پس از completion از `info`/`log` استفاده کنید.
    - `/subagents spawn` حالت one-shot است (`mode: "run"`). برای sessionهای پایدار وابسته به thread، از `sessions_spawn` با `thread: true` و `mode: "session"` استفاده کنید.
    - برای sessionهای ACP harness (Claude Code، Gemini CLI، OpenCode، یا Codex ACP/acpx صریح)، وقتی ابزار آن runtime را advertise می‌کند از `sessions_spawn` با `runtime: "acp"` استفاده کنید. هنگام debugging completionها یا loopهای agent-to-agent، [مدل delivery ACP](/fa/tools/acp-agents#delivery-model) را ببینید. وقتی Plugin `codex` فعال است، کنترل chat/thread مربوط به Codex باید `/codex ...` را به ACP ترجیح دهد، مگر اینکه user صریحا ACP/acpx بخواهد.
    - OpenClaw مقدار `runtime: "acp"` را تا زمانی پنهان می‌کند که ACP فعال باشد، requester sandboxed نباشد، و یک Plugin backend مانند `acpx` load شده باشد. `runtime: "acp"` انتظار یک ACP harness id خارجی، یا یک entry در `agents.list[]` با `runtime.type="acp"` را دارد؛ برای agentهای عادی پیکربندی OpenClaw از `agents_list` از runtime پیش‌فرض sub-agent استفاده کنید.

  </Accordion>
</AccordionGroup>

## حالت‌های context

sub-agentهای native به‌صورت ایزوله شروع می‌شوند، مگر اینکه caller صریحا درخواست fork کردن transcript فعلی را بدهد.

| حالت       | چه زمانی از آن استفاده کنید                                                                                                                         | رفتار                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | پژوهش تازه، پیاده‌سازی مستقل، کار با ابزار کند، یا هر چیزی که می‌توان آن را در متن task brief کرد                           | یک transcript پاک برای child ایجاد می‌کند. این مقدار پیش‌فرض است و مصرف token را پایین‌تر نگه می‌دارد.  |
| `fork`     | کاری که به گفت‌وگوی فعلی، نتایج قبلی tool، یا دستورالعمل‌های ظریفی که از قبل در transcript requester وجود دارند وابسته است | transcript requester را پیش از شروع child به session child منشعب می‌کند. |

از `fork` به‌ندرت استفاده کنید. این برای delegation حساس به context است، نه جایگزینی برای نوشتن prompt شفاف task.

## ابزار: `sessions_spawn`

یک اجرای sub-agent را با `deliver: false` روی lane سراسری `subagent` شروع می‌کند،
سپس یک مرحله announce اجرا می‌کند و reply اعلان را به channel گفت‌وگوی requester
post می‌کند.

در دسترس بودن به policy مؤثر tool برای caller بستگی دارد. profileهای `coding` و
`full` به‌صورت پیش‌فرض `sessions_spawn` را expose می‌کنند. profile `messaging`
این کار را نمی‌کند؛ برای agentهایی که باید کار را delegate کنند،
`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` را اضافه کنید یا از `tools.profile: "coding"` استفاده کنید.
policyهای allow/deny مربوط به channel/group، provider، sandbox و هر agent همچنان می‌توانند
پس از مرحله profile ابزار را حذف کنند. برای تأیید فهرست مؤثر toolها، از همان
session دستور `/tools` را اجرا کنید.

**پیش‌فرض‌ها:**

- **Model:** از caller ارث‌بری می‌کند، مگر اینکه `agents.defaults.subagents.model` را تنظیم کنید (یا `agents.list[].subagents.model` برای هر agent)؛ مقدار صریح `sessions_spawn.model` همچنان اولویت دارد.
- **Thinking:** از caller ارث‌بری می‌کند، مگر اینکه `agents.defaults.subagents.thinking` را تنظیم کنید (یا `agents.list[].subagents.thinking` برای هر agent)؛ مقدار صریح `sessions_spawn.thinking` همچنان اولویت دارد.
- **Run timeout:** اگر `sessions_spawn.runTimeoutSeconds` حذف شود، OpenClaw در صورت تنظیم بودن از `agents.defaults.subagents.runTimeoutSeconds` استفاده می‌کند؛ در غیر این صورت به `0` fallback می‌کند (بدون timeout).

### پارامترهای ابزار

<ParamField path="task" type="string" required>
  توضیح task برای sub-agent.
</ParamField>
<ParamField path="label" type="string">
  label اختیاری و قابل‌خواندن برای انسان.
</ParamField>
<ParamField path="agentId" type="string">
  وقتی `subagents.allowAgents` اجازه دهد، زیر agent id دیگری spawn کنید.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` فقط برای ACP harnessهای خارجی (`claude`، `droid`، `gemini`، `opencode`، یا Codex ACP/acpx که صریحا درخواست شده است) و برای entryهای `agents.list[]` است که `runtime.type` آن‌ها `acp` است.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  فقط ACP. وقتی `runtime: "acp"` باشد یک session موجود ACP harness را resume می‌کند؛ برای spawnهای native sub-agent نادیده گرفته می‌شود.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  فقط ACP. وقتی `runtime: "acp"` باشد خروجی اجرای ACP را به session parent stream می‌کند؛ برای spawnهای native sub-agent حذف کنید.
</ParamField>
<ParamField path="model" type="string">
  مدل sub-agent را override کنید. مقدارهای نامعتبر رد می‌شوند و sub-agent روی مدل پیش‌فرض با یک warning در نتیجه tool اجرا می‌شود.
</ParamField>
<ParamField path="thinking" type="string">
  سطح thinking را برای اجرای sub-agent override کنید.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  در صورت تنظیم بودن، مقدار پیش‌فرض `agents.defaults.subagents.runTimeoutSeconds` است، در غیر این صورت `0`. وقتی تنظیم شود، اجرای sub-agent پس از N ثانیه abort می‌شود.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  وقتی `true` باشد، binding به thread channel را برای این session sub-agent درخواست می‌کند.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  اگر `thread: true` باشد و `mode` حذف شود، مقدار پیش‌فرض `session` می‌شود. `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` بلافاصله پس از announce بایگانی می‌کند (همچنان transcript را از طریق rename نگه می‌دارد).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` spawn را رد می‌کند مگر اینکه runtime child هدف sandboxed باشد.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` transcript فعلی requester را به session child منشعب می‌کند. فقط sub-agentهای native. spawnهای وابسته به thread به‌صورت پیش‌فرض `fork` هستند؛ spawnهای غیر thread به‌صورت پیش‌فرض `isolated` هستند.
</ParamField>

<Warning>
`sessions_spawn` پارامترهای delivery به channel (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) را نمی‌پذیرد. برای delivery، از
`message`/`sessions_send` از اجرای spawn‌شده استفاده کنید.
</Warning>

## sessionهای وابسته به thread

وقتی bindingهای thread برای یک channel فعال باشند، یک sub-agent می‌تواند به یک thread وابسته بماند تا پیام‌های پیگیری user در آن thread همچنان به همان session sub-agent route شوند.

### کانال‌های پشتیبان thread

**Discord** در حال حاضر تنها channel پشتیبانی‌شده است. این channel از
sessionهای پایدار subagent وابسته به thread (`sessions_spawn` با
`thread: true`)، کنترل‌های دستی thread (`/focus`، `/unfocus`، `/agents`،
`/session idle`، `/session max-age`) و کلیدهای adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`، و
`channels.discord.threadBindings.spawnSessions` پشتیبانی می‌کند.

### جریان سریع

<Steps>
  <Step title="Spawn">
    `sessions_spawn` با `thread: true` (و در صورت نیاز `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw یک رشته را برای آن هدف نشست در کانال فعال ایجاد یا به آن متصل می‌کند.
  </Step>
  <Step title="Route follow-ups">
    پاسخ‌ها و پیام‌های پیگیری در آن رشته به نشست متصل‌شده مسیردهی می‌شوند.
  </Step>
  <Step title="Inspect timeouts">
    از `/session idle` برای بررسی/به‌روزرسانی خروج خودکار از تمرکز پس از بی‌فعالیتی و
    از `/session max-age` برای کنترل سقف سخت استفاده کنید.
  </Step>
  <Step title="Detach">
    از `/unfocus` برای جدا کردن دستی استفاده کنید.
  </Step>
</Steps>

### کنترل‌های دستی

| فرمان             | اثر                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | رشته فعلی را (یا یک رشته جدید ایجاد می‌کند و آن را) به هدف زیرعامل/نشست متصل می‌کند |
| `/unfocus`         | اتصال رشته متصل فعلی را حذف می‌کند                                  |
| `/agents`          | اجراهای فعال و وضعیت اتصال را فهرست می‌کند (`thread:<id>` یا `unbound`) |
| `/session idle`    | خروج خودکار از تمرکز در حالت بی‌کار را بررسی/به‌روزرسانی می‌کند (فقط رشته‌های متصل و متمرکز) |
| `/session max-age` | سقف سخت را بررسی/به‌روزرسانی می‌کند (فقط رشته‌های متصل و متمرکز)     |

### کلیدهای پیکربندی

- **پیش‌فرض سراسری:** `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
- **کلیدهای بازنویسی کانال و اتصال خودکار هنگام ایجاد نشست** وابسته به آداپتور هستند. بخش [کانال‌های پشتیبان رشته](#thread-supporting-channels) را در بالا ببینید.

برای جزئیات فعلی آداپتور، [مرجع پیکربندی](/fa/gateway/configuration-reference) و
[فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

### فهرست مجاز

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  فهرست شناسه‌های عامل که می‌توانند از طریق `agentId` صریح هدف قرار گیرند (`["*"]` هر موردی را مجاز می‌کند). پیش‌فرض: فقط عامل درخواست‌کننده. اگر فهرستی تنظیم می‌کنید و همچنان می‌خواهید درخواست‌کننده با `agentId` خودش را ایجاد کند، شناسه درخواست‌کننده را در فهرست قرار دهید.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  فهرست مجاز پیش‌فرض عامل‌های هدف که وقتی عامل درخواست‌کننده `subagents.allowAgents` خودش را تنظیم نکرده باشد استفاده می‌شود.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  فراخوانی‌های `sessions_spawn` را که `agentId` را حذف می‌کنند مسدود می‌کند (انتخاب صریح پروفایل را اجباری می‌کند). بازنویسی برای هر عامل: `agents.list[].subagents.requireAgentId`.
</ParamField>

اگر نشست درخواست‌کننده در sandbox باشد، `sessions_spawn` هدف‌هایی را رد می‌کند
که بدون sandbox اجرا می‌شوند.

### کشف

از `agents_list` استفاده کنید تا ببینید کدام شناسه‌های عامل در حال حاضر برای
`sessions_spawn` مجاز هستند. پاسخ شامل مدل مؤثر هر عامل فهرست‌شده
و فراداده runtime تعبیه‌شده است تا فراخوان‌ها بتوانند PI، سرور برنامه Codex
و runtimeهای بومی پیکربندی‌شده دیگر را از هم تشخیص دهند.

### بایگانی خودکار

- نشست‌های زیرعامل پس از `agents.defaults.subagents.archiveAfterMinutes` به‌طور خودکار بایگانی می‌شوند (پیش‌فرض `60`).
- بایگانی از `sessions.delete` استفاده می‌کند و رونوشت را به `*.deleted.<timestamp>` تغییر نام می‌دهد (در همان پوشه).
- `cleanup: "delete"` بلافاصله پس از اعلان بایگانی می‌کند (همچنان رونوشت را از طریق تغییر نام نگه می‌دارد).
- بایگانی خودکار بهترین تلاش است؛ اگر Gateway دوباره راه‌اندازی شود، timerهای در انتظار از بین می‌روند.
- `runTimeoutSeconds` بایگانی خودکار انجام نمی‌دهد؛ فقط اجرا را متوقف می‌کند. نشست تا زمان بایگانی خودکار باقی می‌ماند.
- بایگانی خودکار به یک اندازه روی نشست‌های عمق ۱ و عمق ۲ اعمال می‌شود.
- پاک‌سازی مرورگر جدا از پاک‌سازی بایگانی است: تب‌ها/فرآیندهای مرورگر ردیابی‌شده با بهترین تلاش پس از پایان اجرا بسته می‌شوند، حتی اگر رونوشت/رکورد نشست نگه داشته شود.

## زیرعامل‌های تو در تو

به‌طور پیش‌فرض، زیرعامل‌ها نمی‌توانند زیرعامل‌های خودشان را ایجاد کنند
(`maxSpawnDepth: 1`). `maxSpawnDepth: 2` را تنظیم کنید تا یک سطح
تو در تو فعال شود — **الگوی ارکستراتور**: اصلی → زیرعامل ارکستراتور →
زیرزیرعامل‌های worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### سطح‌های عمق

| عمق | شکل کلید نشست                                | نقش                                          | می‌تواند ایجاد کند؟          |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | عامل اصلی                                    | همیشه                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | زیرعامل (ارکستراتور وقتی عمق ۲ مجاز باشد)   | فقط اگر `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | زیرزیرعامل (worker برگ)                      | هرگز                         |

### زنجیره اعلان

نتایج در زنجیره به بالا برمی‌گردند:

1. worker عمق ۲ تمام می‌شود → به والد خود (ارکستراتور عمق ۱) اعلان می‌کند.
2. ارکستراتور عمق ۱ اعلان را دریافت می‌کند، نتایج را ترکیب می‌کند، تمام می‌شود → به اصلی اعلان می‌کند.
3. عامل اصلی اعلان را دریافت می‌کند و به کاربر تحویل می‌دهد.

هر سطح فقط اعلان‌های فرزندان مستقیم خود را می‌بیند.

<Note>
**راهنمای عملیاتی:** کار فرزند را یک بار شروع کنید و به‌جای ساختن حلقه‌های polling پیرامون `sessions_list`،
`sessions_history`، `/subagents list` یا فرمان‌های sleep در `exec`، منتظر رویدادهای تکمیل بمانید.
`sessions_list` و `/subagents list` رابطه‌های نشست فرزند را
روی کار زنده متمرکز نگه می‌دارند — فرزندان زنده متصل می‌مانند، فرزندان پایان‌یافته
برای یک پنجره کوتاه اخیر قابل مشاهده می‌مانند، و پیوندهای فرزند فقط-ذخیره‌ای که کهنه شده‌اند
پس از پنجره تازگی‌شان نادیده گرفته می‌شوند. این کار جلوی زنده شدن دوباره فرزندان ghost پس از
راه‌اندازی دوباره را از طریق فراداده قدیمی `spawnedBy` /
`parentSessionKey` می‌گیرد. اگر پس از اینکه پاسخ نهایی را فرستاده‌اید رویداد تکمیل فرزند برسد،
پیگیری درست، توکن دقیق بی‌صدا
`NO_REPLY` / `no_reply` است.
</Note>

### سیاست ابزار بر اساس عمق

- نقش و دامنه کنترل هنگام ایجاد نشست در فراداده نشست نوشته می‌شوند. این کار جلوی آن را می‌گیرد که کلیدهای نشست مسطح یا بازیابی‌شده به‌طور تصادفی امتیازهای ارکستراتور را دوباره به دست آورند.
- **عمق ۱ (ارکستراتور، وقتی `maxSpawnDepth >= 2`):** `sessions_spawn`، `subagents`، `sessions_list`، `sessions_history` را دریافت می‌کند تا بتواند فرزندانش را مدیریت کند. ابزارهای نشست/سیستم دیگر همچنان رد می‌شوند.
- **عمق ۱ (برگ، وقتی `maxSpawnDepth == 1`):** هیچ ابزار نشستی ندارد (رفتار پیش‌فرض فعلی).
- **عمق ۲ (worker برگ):** هیچ ابزار نشستی ندارد — `sessions_spawn` همیشه در عمق ۲ رد می‌شود. نمی‌تواند فرزندان بیشتری ایجاد کند.

### محدودیت ایجاد برای هر عامل

هر نشست عامل (در هر عمقی) می‌تواند هم‌زمان حداکثر `maxChildrenPerAgent`
فرزند فعال داشته باشد (پیش‌فرض `5`). این جلوی fan-out مهارنشده
از یک ارکستراتور واحد را می‌گیرد.

### توقف آبشاری

متوقف کردن ارکستراتور عمق ۱ به‌طور خودکار همه فرزندان عمق ۲ آن را
متوقف می‌کند:

- `/stop` در چت اصلی همه عامل‌های عمق ۱ را متوقف می‌کند و به فرزندان عمق ۲ آن‌ها آبشار می‌شود.
- `/subagents kill <id>` یک زیرعامل مشخص را متوقف می‌کند و به فرزندانش آبشار می‌شود.
- `/subagents kill all` همه زیرعامل‌های درخواست‌کننده را متوقف می‌کند و آبشار می‌شود.

## احراز هویت

احراز هویت زیرعامل بر اساس **شناسه عامل** حل می‌شود، نه بر اساس نوع نشست:

- کلید نشست زیرعامل `agent:<agentId>:subagent:<uuid>` است.
- مخزن احراز هویت از `agentDir` آن عامل بارگذاری می‌شود.
- پروفایل‌های احراز هویت عامل اصلی به‌عنوان **fallback** ادغام می‌شوند؛ پروفایل‌های عامل در صورت تعارض، پروفایل‌های اصلی را بازنویسی می‌کنند.

ادغام افزایشی است، بنابراین پروفایل‌های اصلی همیشه به‌عنوان
fallback در دسترس هستند. احراز هویت کاملا جداگانه برای هر عامل هنوز پشتیبانی نمی‌شود.

## اعلان

زیرعامل‌ها از طریق یک مرحله اعلان گزارش می‌دهند:

- مرحله اعلان داخل نشست زیرعامل اجرا می‌شود (نه نشست درخواست‌کننده).
- اگر زیرعامل دقیقا `ANNOUNCE_SKIP` پاسخ دهد، چیزی ارسال نمی‌شود.
- اگر آخرین متن assistant توکن دقیق بی‌صدای `NO_REPLY` / `no_reply` باشد، خروجی اعلان سرکوب می‌شود حتی اگر پیشرفت قابل مشاهده قبلی وجود داشته باشد.

تحویل به عمق درخواست‌کننده بستگی دارد:

- نشست‌های درخواست‌کننده سطح بالا از یک فراخوانی پیگیری `agent` با تحویل خارجی (`deliver=true`) استفاده می‌کنند.
- نشست‌های زیرعامل درخواست‌کننده تو در تو یک تزریق پیگیری داخلی دریافت می‌کنند (`deliver=false`) تا ارکستراتور بتواند نتایج فرزند را درون نشست ترکیب کند.
- اگر نشست زیرعامل درخواست‌کننده تو در تو از بین رفته باشد، OpenClaw در صورت در دسترس بودن به درخواست‌کننده آن نشست fallback می‌کند.

برای نشست‌های درخواست‌کننده سطح بالا، تحویل مستقیم در حالت تکمیل ابتدا
هر مسیر مکالمه/رشته متصل و بازنویسی hook را حل می‌کند، سپس
فیلدهای گم‌شده هدف کانال را از مسیر ذخیره‌شده نشست درخواست‌کننده پر می‌کند.
این کار تکمیل‌ها را روی چت/موضوع درست نگه می‌دارد، حتی وقتی مبدأ تکمیل
فقط کانال را مشخص می‌کند.

تجمیع تکمیل فرزند هنگام ساخت یافته‌های تکمیل تو در تو به اجرای درخواست‌کننده فعلی محدود می‌شود و
از نشت خروجی‌های فرزند مربوط به اجرای قبلی کهنه به اعلان فعلی جلوگیری می‌کند. پاسخ‌های اعلان
وقتی در آداپتورهای کانال در دسترس باشند، مسیردهی رشته/موضوع را حفظ می‌کنند.

### زمینه اعلان

زمینه اعلان به یک بلوک رویداد داخلی پایدار نرمال‌سازی می‌شود:

| فیلد          | منبع                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| منبع           | `subagent` یا `cron`                                                                                          |
| شناسه‌های نشست | کلید/شناسه نشست فرزند                                                                                        |
| نوع            | نوع اعلان + برچسب کار                                                                                        |
| وضعیت         | مشتق‌شده از نتیجه runtime (`success`، `error`، `timeout` یا `unknown`) — **نه** استنتاج‌شده از متن مدل       |
| محتوای نتیجه  | آخرین متن قابل مشاهده assistant، در غیر این صورت آخرین متن پاک‌سازی‌شده tool/toolResult                      |
| پیگیری         | دستورالعملی که توضیح می‌دهد چه زمانی پاسخ داده شود و چه زمانی بی‌صدا بماند                                  |

اجراهای ناموفق پایانی، وضعیت شکست را بدون بازپخش متن پاسخ ثبت‌شده
گزارش می‌کنند. هنگام timeout، اگر فرزند فقط تا فراخوانی‌های ابزار پیش رفته باشد، اعلان
می‌تواند آن تاریخچه را به‌جای بازپخش خروجی خام ابزار، به یک خلاصه کوتاه از پیشرفت جزئی
فشرده کند.

### خط آمار

payloadهای اعلان در پایان شامل یک خط آمار هستند (حتی وقتی wrap شده باشند):

- runtime (مانند `runtime 5m12s`).
- مصرف token (input/output/total).
- هزینه تخمینی وقتی قیمت‌گذاری مدل پیکربندی شده باشد (`models.providers.*.models[].cost`).
- `sessionKey`، `sessionId` و مسیر رونوشت تا عامل اصلی بتواند تاریخچه را از طریق `sessions_history` بگیرد یا فایل روی دیسک را بررسی کند.

فراداده داخلی فقط برای ارکستراسیون در نظر گرفته شده است؛ پاسخ‌های کاربرپسند
باید با صدای معمول assistant بازنویسی شوند.

### چرا `sessions_history` ترجیح داده می‌شود

`sessions_history` مسیر ارکستراسیون امن‌تری است:

- یادآوری assistant ابتدا نرمال‌سازی می‌شود: برچسب‌های thinking حذف می‌شوند؛ داربست `<relevant-memories>` / `<relevant_memories>` حذف می‌شود؛ بلوک‌های payload فراخوانی ابزار XML در متن ساده (`<tool_call>`، `<function_call>`، `<tool_calls>`، `<function_calls>`) حذف می‌شوند، از جمله payloadهای بریده‌شده‌ای که هرگز تمیز بسته نمی‌شوند؛ داربست فراخوانی ابزار/نتیجه تنزل‌یافته و نشانگرهای زمینه تاریخی حذف می‌شوند؛ توکن‌های کنترل مدل نشت‌کرده (`<|assistant|>`، سایر ASCII `<|...|>`، تمام‌عرض `<｜...｜>`) حذف می‌شوند؛ XML بدشکل فراخوانی ابزار MiniMax حذف می‌شود.
- متن‌های شبیه credential/token حذف یا پوشانده می‌شوند.
- بلوک‌های طولانی می‌توانند کوتاه شوند.
- تاریخچه‌های بسیار بزرگ می‌توانند ردیف‌های قدیمی‌تر را حذف کنند یا یک ردیف بیش از حد بزرگ را با `[sessions_history omitted: message too large]` جایگزین کنند.
- بررسی رونوشت خام روی دیسک fallback است، وقتی به رونوشت کامل byte-for-byte نیاز دارید.

## سیاست ابزار

زیرعامل‌ها ابتدا از همان پروفایل و خط لوله سیاست ابزارِ عامل والد یا
عامل هدف استفاده می‌کنند. پس از آن، OpenClaw لایه محدودیت زیرعامل را
اعمال می‌کند.

بدون `tools.profile` محدودکننده، زیرعامل‌ها **همه ابزارها به‌جز
ابزارهای نشست** و ابزارهای سیستمی را دریافت می‌کنند:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` اینجا نیز یک نمای یادآوری محدود و پالایش‌شده باقی می‌ماند —
dump خام رونوشت نیست.

وقتی `maxSpawnDepth >= 2` باشد، زیرعامل‌های هماهنگ‌کننده عمق ۱ علاوه بر این
`sessions_spawn`، `subagents`، `sessions_list` و
`sessions_history` را دریافت می‌کنند تا بتوانند فرزندان خود را مدیریت کنند.

### بازنویسی از طریق پیکربندی

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` یک فیلتر نهایی فقط-مجاز است. می‌تواند
مجموعه ابزار ازپیش‌حل‌شده را محدودتر کند، اما نمی‌تواند ابزاری را که
توسط `tools.profile` حذف شده است **دوباره اضافه کند**. برای مثال،
`tools.profile: "coding"` شامل `web_search`/`web_fetch` است اما ابزار
`browser` را شامل نمی‌شود. برای اینکه زیرعامل‌های پروفایل کدنویسی بتوانند
از خودکارسازی مرورگر استفاده کنند، browser را در مرحله پروفایل اضافه کنید:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

وقتی فقط یک عامل باید خودکارسازی مرورگر دریافت کند، از
`agents.list[].tools.alsoAllow: ["browser"]` برای هر عامل استفاده کنید.

## هم‌روندی

زیرعامل‌ها از یک مسیر صف اختصاصی درون‌پردازشی استفاده می‌کنند:

- **نام مسیر:** `subagent`
- **هم‌روندی:** `agents.defaults.subagents.maxConcurrent` (پیش‌فرض `8`)

## زنده‌بودن و بازیابی

OpenClaw نبودِ `endedAt` را به‌عنوان اثبات دائمی زنده بودن یک
زیرعامل در نظر نمی‌گیرد. اجراهای پایان‌نیافته‌ای که از پنجره اجرای کهنه
قدیمی‌تر هستند، دیگر در `/subagents list`، خلاصه‌های وضعیت،
دروازه تکمیل نوادگان، و بررسی‌های هم‌روندی هر نشست، فعال/درانتظار
شمرده نمی‌شوند.

پس از راه‌اندازی دوباره Gateway، اجراهای بازیابی‌شده کهنه و پایان‌نیافته حذف می‌شوند، مگر اینکه
نشست فرزندشان با `abortedLastRun: true` علامت‌گذاری شده باشد. آن
نشست‌های فرزند که در زمان راه‌اندازی دوباره قطع شده‌اند، از طریق جریان
بازیابی یتیم زیرعامل همچنان قابل بازیابی می‌مانند؛ این جریان پیش از
پاک کردن نشانگر قطع‌شده، یک پیام ازسرگیری ساختگی ارسال می‌کند.

بازیابی خودکار پس از راه‌اندازی دوباره برای هر نشست فرزند محدود است. اگر همان
فرزند زیرعامل به‌طور مکرر در پنجره re-wedge سریع برای بازیابی یتیم پذیرفته شود،
OpenClaw یک tombstone بازیابی روی آن نشست پایدار می‌کند و در راه‌اندازی‌های دوباره بعدی
دیگر آن را به‌طور خودکار از سر نمی‌گیرد. برای همسوسازی رکورد وظیفه،
`openclaw tasks maintenance --apply` را اجرا کنید، یا برای پاک کردن پرچم‌های
بازیابی قطع‌شده کهنه روی نشست‌های tombstoned، `openclaw doctor --fix` را اجرا کنید.

<Note>
اگر ایجاد زیرعامل با Gateway `PAIRING_REQUIRED` /
`scope-upgrade` شکست خورد، پیش از ویرایش وضعیت pairing، فراخوان RPC را بررسی کنید.
هماهنگی داخلی `sessions_spawn` باید با
`client.id: "gateway-client"` و `client.mode: "backend"` از طریق
احراز هویت shared-token/password روی loopback مستقیم متصل شود؛ این مسیر به
خط مبنای scope دستگاه جفت‌شده CLI وابسته نیست. فراخوان‌های راه‌دور، مسیرهای
صریح `deviceIdentity`، مسیرهای صریح device-token، و کلاینت‌های browser/node
همچنان برای ارتقای scope به تأیید عادی دستگاه نیاز دارند.
</Note>

## توقف

- ارسال `/stop` در گفت‌وگوی درخواست‌کننده، نشست درخواست‌کننده را قطع می‌کند و هر اجرای زیرعامل فعالی را که از آن ایجاد شده باشد متوقف می‌کند، و این توقف به فرزندان تودرتو نیز سرایت می‌کند.
- `/subagents kill <id>` یک زیرعامل مشخص را متوقف می‌کند و این توقف به فرزندان آن نیز سرایت می‌کند.

## محدودیت‌ها

- اعلام زیرعامل **بر مبنای بهترین تلاش** است. اگر Gateway دوباره راه‌اندازی شود، کارهای درانتظار "announce back" از دست می‌روند.
- زیرعامل‌ها همچنان منابع همان فرایند Gateway را به‌اشتراک می‌گذارند؛ `maxConcurrent` را به‌عنوان یک سوپاپ اطمینان در نظر بگیرید.
- `sessions_spawn` همیشه غیرمسدودکننده است: بلافاصله `{ status: "accepted", runId, childSessionKey }` را برمی‌گرداند.
- زمینه زیرعامل فقط `AGENTS.md` + `TOOLS.md` را تزریق می‌کند (بدون `SOUL.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md` یا `BOOTSTRAP.md`).
- بیشینه عمق تودرتویی 5 است (بازه `maxSpawnDepth`: 1–5). عمق 2 برای بیشتر موارد استفاده توصیه می‌شود.
- `maxChildrenPerAgent` تعداد فرزندان فعال برای هر نشست را محدود می‌کند (پیش‌فرض `5`، بازه `1–20`).

## مرتبط

- [عامل‌های ACP](/fa/tools/acp-agents)
- [ارسال عامل](/fa/tools/agent-send)
- [وظایف پس‌زمینه](/fa/automation/tasks)
- [ابزارهای sandbox چندعاملی](/fa/tools/multi-agent-sandbox-tools)
