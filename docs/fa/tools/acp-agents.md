---
read_when:
    - اجرای بسترهای کدنویسی از طریق ACP
    - راه‌اندازی نشست‌های ACP وابسته به مکالمه در کانال‌های پیام‌رسانی
    - متصل کردن گفت‌وگوی کانال پیام به یک نشست پایدار ACP
    - عیب‌یابی بک‌اند ACP، اتصال‌دهی Plugin، یا تحویل تکمیل
    - اجرای فرمان‌های /acp از چت
sidebarTitle: ACP agents
summary: هارنس‌های کدنویسی خارجی (Claude Code، Cursor، Gemini CLI، Codex ACP صریح، OpenClaw ACP، OpenCode) را از طریق بک‌اند ACP اجرا کنید
title: عامل‌های ACP
x-i18n:
    generated_at: "2026-04-29T23:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[نشست‌های پروتکل کلاینت عامل (ACP)](https://agentclientprotocol.com/)
به OpenClaw اجازه می‌دهند harnessهای کدنویسی خارجی (برای نمونه Pi، Claude Code،
Cursor، Copilot، Droid، OpenClaw ACP، OpenCode، Gemini CLI، و دیگر
harnessهای ACPX پشتیبانی‌شده) را از طریق یک Plugin بک‌اند ACP اجرا کند.

هر ایجاد نشست ACP به‌عنوان یک [کار پس‌زمینه](/fa/automation/tasks) ردیابی می‌شود.

<Note>
**ACP مسیر harness خارجی است، نه مسیر پیش‌فرض Codex.** Plugin
اپ‌سرور بومی Codex کنترل‌های `/codex ...` و runtime تعبیه‌شده‌ی
`agentRuntime.id: "codex"` را مالکیت می‌کند؛ ACP مالک کنترل‌های
`/acp ...` و نشست‌های `sessions_spawn({ runtime: "acp" })` است.

اگر می‌خواهید Codex یا Claude Code به‌عنوان یک کلاینت MCP خارجی
مستقیماً به گفتگوهای کانال موجود OpenClaw وصل شود، به‌جای ACP از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.
</Note>

## کدام صفحه را می‌خواهم؟

| می‌خواهید…                                                                                     | از این استفاده کنید                    | یادداشت‌ها                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex را در گفتگوی فعلی متصل یا کنترل کنید                                                     | `/codex bind`, `/codex threads`       | مسیر اپ‌سرور بومی Codex وقتی Plugin `codex` فعال باشد؛ شامل پاسخ‌های چت متصل، فوروارد تصویر، مدل/سریع/مجوزها، توقف، و کنترل‌های هدایت است. ACP یک fallback صریح است |
| Claude Code، Gemini CLI، Codex ACP صریح، یا یک harness خارجی دیگر را _از طریق_ OpenClaw اجرا کنید | این صفحه                             | نشست‌های متصل به چت، `/acp spawn`، `sessions_spawn({ runtime: "acp" })`، کارهای پس‌زمینه، کنترل‌های runtime                                                                                   |
| یک نشست OpenClaw Gateway را _به‌عنوان_ سرور ACP برای یک ویرایشگر یا کلاینت ارائه کنید          | [`openclaw acp`](/fa/cli/acp)            | حالت پل. IDE/کلاینت از طریق stdio/WebSocket با ACP به OpenClaw صحبت می‌کند                                                                                                                   |
| یک CLI هوش مصنوعی محلی را به‌عنوان مدل fallback فقط‌متنی دوباره استفاده کنید                  | [بک‌اندهای CLI](/fa/gateway/cli-backends) | ACP نیست. بدون ابزارهای OpenClaw، بدون کنترل‌های ACP، بدون runtime harness                                                                                                                    |

## آیا این بدون تنظیمات اضافی کار می‌کند؟

معمولاً بله. نصب‌های تازه، Plugin runtime همراه `acpx` را به‌صورت پیش‌فرض فعال
ارسال می‌کنند، همراه با یک باینری `acpx` پین‌شده‌ی محلیِ Plugin که OpenClaw آن را
در شروع کار وارسی و خودترمیم می‌کند. برای بررسی آمادگی، `/acp doctor` را اجرا کنید.

OpenClaw فقط وقتی ایجاد ACP **واقعاً قابل‌استفاده** باشد آن را به عامل‌ها
آموزش می‌دهد: ACP باید فعال باشد، dispatch نباید غیرفعال باشد، نشست فعلی
نباید توسط sandbox مسدود شده باشد، و یک بک‌اند runtime باید بارگذاری شده باشد.
اگر این شرایط برقرار نباشند، Skills مربوط به Plugin ACP و راهنمای ACP برای
`sessions_spawn` پنهان می‌مانند تا عامل یک بک‌اند در دسترس نبودنی را پیشنهاد نکند.

<AccordionGroup>
  <Accordion title="نکات شروع نخستین">
    - اگر `plugins.allow` تنظیم شده باشد، یک موجودی محدودکننده‌ی Plugin است و **باید** شامل `acpx` باشد؛ وگرنه پیش‌فرض همراه عمداً مسدود می‌شود و `/acp doctor` ورودی ازدست‌رفته‌ی allowlist را گزارش می‌کند.
    - آداپتور همراه Codex ACP همراه Plugin `acpx` آماده‌سازی شده و در صورت امکان به‌صورت محلی اجرا می‌شود.
    - آداپتورهای دیگر harness هدف ممکن است همچنان نخستین بار که از آن‌ها استفاده می‌کنید، در صورت نیاز با `npx` دریافت شوند.
    - احراز هویت فروشنده همچنان باید برای آن harness روی میزبان وجود داشته باشد.
    - اگر میزبان npm یا دسترسی شبکه نداشته باشد، دریافت آداپتور در نخستین اجرا شکست می‌خورد تا وقتی cacheها از پیش گرم شوند یا آداپتور به روش دیگری نصب شود.

  </Accordion>
  <Accordion title="پیش‌نیازهای runtime">
    ACP یک فرایند harness خارجی واقعی را اجرا می‌کند. OpenClaw مالک مسیریابی،
    وضعیت کار پس‌زمینه، تحویل، اتصال‌ها، و سیاست است؛ harness
    مالک ورود provider، کاتالوگ مدل، رفتار فایل‌سیستم، و
    ابزارهای بومی خودش است.

    پیش از مقصر دانستن OpenClaw، بررسی کنید:

    - `/acp doctor` یک بک‌اند فعال و سالم گزارش می‌کند.
    - وقتی allowlist مربوطه تنظیم شده باشد، شناسه‌ی هدف توسط `acp.allowedAgents` مجاز است.
    - فرمان harness می‌تواند روی میزبان Gateway شروع شود.
    - احراز هویت provider برای آن harness حاضر است (`claude`, `codex`, `gemini`, `opencode`, `droid`, و غیره).
    - مدل انتخاب‌شده برای آن harness وجود دارد — شناسه‌های مدل میان harnessها قابل‌انتقال نیستند.
    - `cwd` درخواستی وجود دارد و قابل‌دسترسی است، یا `cwd` را حذف کنید و بگذارید بک‌اند از پیش‌فرض خود استفاده کند.
    - حالت مجوز با کار مطابقت دارد. نشست‌های غیرتعاملی نمی‌توانند روی promptهای مجوز بومی کلیک کنند، بنابراین اجراهای کدنویسی سنگین از نظر نوشتن/اجرا معمولاً به یک پروفایل مجوز ACPX نیاز دارند که بتواند بدون واسط تعاملی پیش برود.

  </Accordion>
</AccordionGroup>

ابزارهای Plugin OpenClaw و ابزارهای داخلی OpenClaw به‌صورت پیش‌فرض در اختیار
harnessهای ACP قرار نمی‌گیرند. پل‌های MCP صریح را در
[عامل‌های ACP — راه‌اندازی](/fa/tools/acp-agents-setup) فقط وقتی فعال کنید که harness
باید آن ابزارها را مستقیماً فراخوانی کند.

## اهداف harness پشتیبانی‌شده

با بک‌اند همراه `acpx`، از این شناسه‌های harness به‌عنوان اهداف `/acp spawn <id>`
یا `sessions_spawn({ runtime: "acp", agentId: "<id>" })` استفاده کنید:

| شناسه‌ی harness | بک‌اند معمول                                  | یادداشت‌ها                                                                          |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | آداپتور Claude Code ACP                        | به احراز هویت Claude Code روی میزبان نیاز دارد.                                     |
| `codex`    | آداپتور Codex ACP                              | فقط وقتی `/codex` بومی در دسترس نیست یا ACP درخواست شده، fallback صریح ACP است. |
| `copilot`  | آداپتور GitHub Copilot ACP                     | به احراز هویت Copilot CLI/runtime نیاز دارد.                                        |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | اگر نصب محلی entrypoint متفاوتی برای ACP ارائه می‌کند، فرمان acpx را override کنید. |
| `droid`    | Factory Droid CLI                              | به احراز هویت Factory/Droid یا `FACTORY_API_KEY` در محیط harness نیاز دارد.        |
| `gemini`   | آداپتور Gemini CLI ACP                         | به احراز هویت Gemini CLI یا تنظیم API key نیاز دارد.                                |
| `iflow`    | iFlow CLI                                      | دردسترس‌بودن آداپتور و کنترل مدل به CLI نصب‌شده وابسته است.                         |
| `kilocode` | Kilo Code CLI                                  | دردسترس‌بودن آداپتور و کنترل مدل به CLI نصب‌شده وابسته است.                         |
| `kimi`     | Kimi/Moonshot CLI                              | به احراز هویت Kimi/Moonshot روی میزبان نیاز دارد.                                   |
| `kiro`     | Kiro CLI                                       | دردسترس‌بودن آداپتور و کنترل مدل به CLI نصب‌شده وابسته است.                         |
| `opencode` | آداپتور OpenCode ACP                           | به احراز هویت OpenCode CLI/provider نیاز دارد.                                      |
| `openclaw` | پل OpenClaw Gateway از طریق `openclaw acp` | به یک harness آگاه از ACP اجازه می‌دهد به یک نشست OpenClaw Gateway پاسخ دهد.       |
| `pi`       | runtime تعبیه‌شده‌ی Pi/OpenClaw                | برای آزمایش‌های harness بومی OpenClaw استفاده می‌شود.                               |
| `qwen`     | Qwen Code / Qwen CLI                           | به احراز هویت سازگار با Qwen روی میزبان نیاز دارد.                                  |

aliasهای سفارشی عامل acpx را می‌توان در خود acpx پیکربندی کرد، اما سیاست OpenClaw
همچنان `acp.allowedAgents` و هر نگاشت `agents.list[].runtime.acp.agent`
را پیش از dispatch بررسی می‌کند.

## runbook اپراتور

جریان سریع `/acp` از چت:

<Steps>
  <Step title="ایجاد">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، یا صریحاً
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="کار">
    در گفتگوی یا thread متصل ادامه دهید (یا کلید نشست را
    صریحاً هدف بگیرید).
  </Step>
  <Step title="بررسی وضعیت">
    `/acp status`
  </Step>
  <Step title="تنظیم">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="هدایت">
    بدون جایگزین کردن context: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="توقف">
    `/acp cancel` (turn فعلی) یا `/acp close` (نشست + اتصال‌ها).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="جزئیات چرخه‌ی حیات">
    - ایجاد، یک نشست runtime ACP را می‌سازد یا از سر می‌گیرد، فراداده‌ی ACP را در مخزن نشست OpenClaw ثبت می‌کند، و وقتی اجرا مالک والد داشته باشد ممکن است یک کار پس‌زمینه بسازد.
    - نشست‌های ACP با مالک والد حتی وقتی نشست runtime ماندگار باشد به‌عنوان کار پس‌زمینه رفتار می‌شوند؛ تکمیل و تحویل میان‌سطحی از طریق اعلان‌کننده‌ی کار والد انجام می‌شود، نه مانند یک نشست چت معمولِ روبه‌کاربر.
    - نگهداری کار، نشست‌های ACP تک‌مرحله‌ایِ پایانی یا orphaned با مالک والد را می‌بندد. نشست‌های ACP ماندگار تا وقتی اتصال گفتگوی فعال باقی بماند حفظ می‌شوند؛ نشست‌های ماندگار کهنه بدون اتصال فعال بسته می‌شوند تا پس از پایان کار مالک یا حذف رکورد کار آن، بی‌صدا از سر گرفته نشوند.
    - پیام‌های پیگیری متصل مستقیماً تا زمانی که اتصال بسته، unfocus، reset، یا منقضی شود به نشست ACP می‌روند.
    - فرمان‌های Gateway محلی می‌مانند. `/acp ...`، `/status`، و `/unfocus` هرگز به‌عنوان متن prompt عادی به یک harness ACP متصل ارسال نمی‌شوند.
    - `cancel` وقتی بک‌اند از لغو پشتیبانی کند، turn فعال را abort می‌کند؛ فراداده‌ی اتصال یا نشست را حذف نمی‌کند.
    - `close` نشست ACP را از دید OpenClaw پایان می‌دهد و اتصال را حذف می‌کند. اگر harness از resume پشتیبانی کند، ممکن است همچنان تاریخچه‌ی upstream خودش را نگه دارد.
    - workerهای runtime بیکار پس از `acp.runtime.ttlMinutes` واجد cleanup می‌شوند؛ فراداده‌ی نشست ذخیره‌شده برای `/acp sessions` همچنان در دسترس می‌ماند.

  </Accordion>
  <Accordion title="قواعد مسیریابی بومی Codex">
    محرک‌های زبان طبیعی که باید وقتی فعال است به **Plugin بومی Codex**
    مسیریابی شوند:

    - «این کانال Discord را به Codex متصل کن.»
    - «این چت را به thread شماره‌ی `<id>` در Codex وصل کن.»
    - «threadهای Codex را نشان بده، سپس این یکی را متصل کن.»

    اتصال گفتگوی بومی Codex مسیر پیش‌فرض کنترل چت است.
    ابزارهای پویای OpenClaw همچنان از طریق OpenClaw اجرا می‌شوند، در حالی که
    ابزارهای بومی Codex مانند shell/apply-patch داخل Codex اجرا می‌شوند.
    برای رویدادهای ابزار بومی Codex، OpenClaw یک relay hook بومی
    per-turn تزریق می‌کند تا hookهای Plugin بتوانند `before_tool_call` را مسدود کنند،
    `after_tool_call` را مشاهده کنند، و رویدادهای Codex `PermissionRequest` را
    از طریق تأییدهای OpenClaw مسیریابی کنند. hookهای Codex `Stop` به
    OpenClaw `before_agent_finalize` relay می‌شوند، جایی که Pluginها می‌توانند پیش از
    نهایی‌سازی پاسخ توسط Codex، یک pass مدل دیگر درخواست کنند. relay عمداً
    محافظه‌کار می‌ماند: آرگومان‌های ابزار بومی Codex را تغییر نمی‌دهد
    یا رکوردهای thread در Codex را بازنویسی نمی‌کند. ACP صریح را فقط وقتی استفاده کنید
    که مدل runtime/نشست ACP را می‌خواهید. مرز پشتیبانی تعبیه‌شده‌ی Codex
    در [قرارداد پشتیبانی harness نسخه‌ی ۱ Codex](/fa/plugins/codex-harness#v1-support-contract) مستند شده است.

  </Accordion>
  <Accordion title="برگه تقلب انتخاب مدل / ارائه‌دهنده / runtime">
    - `openai-codex/*` — مسیر اشتراک/OAuth مربوط به PI Codex.
    - `openai/*` به‌همراه `agentRuntime.id: "codex"` — runtime جاسازی‌شده بومی Codex app-server.
    - `/codex ...` — کنترل مکالمه بومی Codex.
    - `/acp ...` یا `runtime: "acp"` — کنترل صریح ACP/acpx.

  </Accordion>
  <Accordion title="محرک‌های زبان طبیعی برای مسیریابی ACP">
    محرک‌هایی که باید به runtime مربوط به ACP مسیریابی شوند:

    - "این را به‌صورت یک نشست یک‌باره Claude Code ACP اجرا کن و نتیجه را خلاصه کن."
    - "برای این کار از Gemini CLI در یک thread استفاده کن، سپس پیگیری‌ها را در همان thread نگه دار."
    - "Codex را از طریق ACP در یک thread پس‌زمینه اجرا کن."

    OpenClaw مقدار `runtime: "acp"` را انتخاب می‌کند، harness `agentId` را resolve می‌کند،
    در صورت پشتیبانی به مکالمه یا thread فعلی متصل می‌شود، و
    پیگیری‌ها را تا زمان بستن/انقضا به همان نشست مسیریابی می‌کند. Codex فقط
    زمانی این مسیر را دنبال می‌کند که ACP/acpx صریح باشد یا Plugin بومی Codex
    برای عملیات درخواستی در دسترس نباشد.

    برای `sessions_spawn`، مقدار `runtime: "acp"` فقط زمانی اعلام می‌شود که ACP
    فعال باشد، درخواست‌کننده sandbox نشده باشد، و یک backend مربوط به ACP runtime
    بارگذاری شده باشد. `acp.dispatch.enabled=false` ارسال خودکار ACP thread را
    متوقف می‌کند، اما فراخوانی‌های صریح
    `sessions_spawn({ runtime: "acp" })` را پنهان یا مسدود نمی‌کند. این مقدار شناسه‌های ACP harness مانند `codex`،
    `claude`، `droid`، `gemini`، یا `opencode` را هدف می‌گیرد. شناسه عادی
    عامل پیکربندی OpenClaw را از `agents_list` ارسال نکنید، مگر اینکه آن ورودی
    صراحتا با `agents.list[].runtime.type="acp"` پیکربندی شده باشد؛
    در غیر این صورت از runtime پیش‌فرض sub-agent استفاده کنید. وقتی یک عامل OpenClaw
    با `runtime.type="acp"` پیکربندی شده باشد، OpenClaw از
    `runtime.acp.agent` به‌عنوان شناسه harness زیرین استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## ACP در برابر sub-agentها

وقتی یک runtime مربوط به harness خارجی می‌خواهید از ACP استفاده کنید. برای اتصال/کنترل مکالمه Codex، وقتی Plugin
مربوط به `codex` فعال است از **Codex
app-server بومی** استفاده کنید. وقتی اجراهای واگذارشده بومی OpenClaw
می‌خواهید از **sub-agentها** استفاده کنید.

| حوزه          | نشست ACP                           | اجرای sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | backend Plugin مربوط به ACP (برای مثال acpx) | runtime بومی sub-agent در OpenClaw  |
| کلید نشست   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| فرمان‌های اصلی | `/acp ...`                            | `/subagents ...`                   |
| ابزار spawn    | `sessions_spawn` با `runtime:"acp"` | `sessions_spawn` (runtime پیش‌فرض) |

همچنین [Sub-agents](/fa/tools/subagents) را ببینید.

## ACP چگونه Claude Code را اجرا می‌کند

برای Claude Code از طریق ACP، stack چنین است:

1. صفحه کنترل نشست ACP در OpenClaw.
2. Plugin runtime بسته‌بندی‌شده `acpx`.
3. آداپتور Claude ACP.
4. سازوکار runtime/نشست در سمت Claude.

ACP Claude یک **نشست harness** با کنترل‌های ACP، ازسرگیری نشست،
ردیابی وظیفه پس‌زمینه، و اتصال اختیاری مکالمه/thread است.

backendهای CLI، runtimeهای fallback محلیِ فقط‌متنی جداگانه‌ای هستند — [CLI Backends](/fa/gateway/cli-backends) را ببینید.

برای operatorها، قاعده عملی این است:

- **`/acp spawn`، نشست‌های قابل اتصال، کنترل‌های runtime، یا کار پایدار harness می‌خواهید؟** از ACP استفاده کنید.
- **fallback متنی محلی ساده از طریق CLI خام می‌خواهید؟** از backendهای CLI استفاده کنید.

## نشست‌های متصل

### مدل ذهنی

- **سطح گفت‌وگو** — جایی که افراد به صحبت ادامه می‌دهند (کانال Discord، موضوع Telegram، چت iMessage).
- **نشست ACP** — وضعیت پایدار runtime مربوط به Codex/Claude/Gemini که OpenClaw به آن مسیریابی می‌کند.
- **thread/topic فرزند** — یک سطح پیام‌رسانی اضافی اختیاری که فقط با `--thread ...` ایجاد می‌شود.
- **فضای کاری runtime** — محل فایل‌سیستم (`cwd`، checkout مخزن، فضای کاری backend) که harness در آن اجرا می‌شود. مستقل از سطح گفت‌وگو است.

### اتصال‌های مکالمه فعلی

`/acp spawn <harness> --bind here` مکالمه فعلی را به نشست ACP
spawn‌شده متصل می‌کند — بدون thread فرزند، همان سطح گفت‌وگو. OpenClaw همچنان
مالک transport، احراز هویت، ایمنی، و تحویل می‌ماند. پیام‌های پیگیری در آن
مکالمه به همان نشست مسیریابی می‌شوند؛ `/new` و `/reset` نشست را
درجا reset می‌کنند؛ `/acp close` اتصال را حذف می‌کند.

نمونه‌ها:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="قواعد اتصال و انحصاری‌بودن">
    - `--bind here` و `--thread ...` با هم ناسازگارند.
    - `--bind here` فقط روی کانال‌هایی کار می‌کند که اتصال مکالمه فعلی را اعلام می‌کنند؛ در غیر این صورت OpenClaw پیام روشنِ عدم پشتیبانی برمی‌گرداند. اتصال‌ها پس از راه‌اندازی مجدد Gateway پایدار می‌مانند.
    - در Discord، `spawnAcpSessions` فقط زمانی لازم است که OpenClaw نیاز داشته باشد برای `--thread auto|here` یک thread فرزند ایجاد کند — نه برای `--bind here`.
    - اگر بدون `--cwd` به یک عامل ACP متفاوت spawn کنید، OpenClaw به‌طور پیش‌فرض فضای کاری **عامل هدف** را به ارث می‌برد. مسیرهای موروثیِ مفقود (`ENOENT`/`ENOTDIR`) به پیش‌فرض backend fallback می‌کنند؛ خطاهای دسترسی دیگر (مثلا `EACCES`) به‌صورت خطاهای spawn نمایش داده می‌شوند.
    - فرمان‌های مدیریت Gateway در مکالمه‌های متصل محلی می‌مانند — فرمان‌های `/acp ...` توسط OpenClaw مدیریت می‌شوند حتی وقتی متن پیگیری عادی به نشست ACP متصل‌شده مسیریابی می‌شود؛ هر زمان مدیریت فرمان برای آن سطح فعال باشد، `/status` و `/unfocus` نیز محلی می‌مانند.

  </Accordion>
  <Accordion title="نشست‌های متصل به thread">
    وقتی اتصال‌های thread برای یک آداپتور کانال فعال باشند:

    - OpenClaw یک thread را به نشست ACP هدف متصل می‌کند.
    - پیام‌های پیگیری در آن thread به نشست ACP متصل‌شده مسیریابی می‌شوند.
    - خروجی ACP به همان thread برگردانده می‌شود.
    - unfocus/close/archive/idle-timeout یا انقضای max-age اتصال را حذف می‌کند.
    - `/acp close`، `/acp cancel`، `/acp status`، `/status`، و `/unfocus` فرمان‌های Gateway هستند، نه promptهایی برای ACP harness.

    پرچم‌های قابلیت لازم برای ACP متصل به thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` به‌طور پیش‌فرض روشن است (برای توقف ارسال خودکار ACP thread مقدار `false` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند).
    - پرچم thread-spawn مربوط به ACP در آداپتور کانال فعال باشد (وابسته به آداپتور):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    پشتیبانی از اتصال thread وابسته به آداپتور است. اگر آداپتور کانال فعال
    از اتصال‌های thread پشتیبانی نکند، OpenClaw یک پیام روشنِ
    unsupported/unavailable برمی‌گرداند.

  </Accordion>
  <Accordion title="کانال‌های پشتیبان thread">
    - هر آداپتور کانالی که قابلیت اتصال نشست/thread را expose کند.
    - پشتیبانی داخلی فعلی: threadها/کانال‌های **Discord**، topicهای **Telegram** (forum topicها در گروه‌ها/supergroupها و DM topicها).
    - کانال‌های Plugin می‌توانند از طریق همان interface اتصال، پشتیبانی اضافه کنند.

  </Accordion>
</AccordionGroup>

## اتصال‌های پایدار کانال

برای workflowهای غیرموقتی، اتصال‌های پایدار ACP را در ورودی‌های سطح‌بالای
`bindings[]` پیکربندی کنید.

### مدل اتصال

<ParamField path="bindings[].type" type='"acp"'>
  یک اتصال مکالمه ACP پایدار را علامت‌گذاری می‌کند.
</ParamField>
<ParamField path="bindings[].match" type="object">
  مکالمه هدف را شناسایی می‌کند. شکل‌ها به‌ازای هر کانال:

- **کانال/thread در Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **forum topic در Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/گروه BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های گروهی پایدار، `chat_id:*` یا `chat_identifier:*` را ترجیح دهید.
- **DM/گروه iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های گروهی پایدار، `chat_id:*` را ترجیح دهید.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  شناسه عامل مالک در OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  override اختیاری ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  برچسب اختیاری قابل مشاهده برای operator.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  دایرکتوری کاری اختیاری runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  override اختیاری backend.
</ParamField>

### پیش‌فرض‌های runtime به‌ازای هر عامل

از `agents.list[].runtime` برای تعریف یک‌باره پیش‌فرض‌های ACP به‌ازای هر عامل استفاده کنید:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (شناسه harness، مثلا `codex` یا `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ترتیب تقدم override برای نشست‌های متصل ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. پیش‌فرض‌های سراسری ACP (مثلا `acp.backend`)

### نمونه

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### رفتار

- OpenClaw اطمینان می‌دهد نشست ACP پیکربندی‌شده پیش از استفاده وجود دارد.
- پیام‌ها در آن کانال یا topic به نشست ACP پیکربندی‌شده مسیریابی می‌شوند.
- در مکالمه‌های متصل، `/new` و `/reset` همان کلید نشست ACP را درجا reset می‌کنند.
- اتصال‌های runtime موقت (برای مثال آن‌هایی که توسط جریان‌های thread-focus ایجاد شده‌اند) همچنان هر جا وجود داشته باشند اعمال می‌شوند.
- برای spawnهای ACP بین عامل‌ها بدون `cwd` صریح، OpenClaw فضای کاری عامل هدف را از پیکربندی عامل به ارث می‌برد.
- مسیرهای فضای کاری موروثیِ مفقود به cwd پیش‌فرض backend fallback می‌کنند؛ شکست‌های دسترسیِ غیرمفقود به‌صورت خطاهای spawn نمایش داده می‌شوند.

## شروع نشست‌های ACP

دو روش برای شروع یک نشست ACP:

<Tabs>
  <Tab title="از sessions_spawn">
    برای شروع یک نشست ACP از turn عامل یا
    فراخوانی ابزار، از `runtime: "acp"` استفاده کنید.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` به‌طور پیش‌فرض `subagent` است، بنابراین برای نشست‌های ACP،
    `runtime: "acp"` را صراحتا تنظیم کنید. اگر `agentId` حذف شود، OpenClaw
    در صورت پیکربندی از `acp.defaultAgent` استفاده می‌کند. `mode: "session"`
    برای نگه‌داشتن یک گفت‌وگوی متصل و پایدار به `thread: true` نیاز دارد.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    برای کنترل صریح اپراتور از داخل چت، از `/acp spawn` استفاده کنید.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    پرچم‌های کلیدی:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

  </Tab>
</Tabs>

### پارامترهای `sessions_spawn`

<ParamField path="task" type="string" required>
  پرامپت اولیه‌ای که به نشست ACP فرستاده می‌شود.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  برای نشست‌های ACP باید `"acp"` باشد.
</ParamField>
<ParamField path="agentId" type="string">
  شناسه هارنس هدف ACP. اگر `acp.defaultAgent` تنظیم شده باشد، به آن برمی‌گردد.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  در صورت پشتیبانی، جریان اتصال رشته را درخواست می‌کند.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` یک‌باره است؛ `"session"` پایدار است. اگر `thread: true` باشد و
  `mode` حذف شود، OpenClaw ممکن است بسته به مسیر runtime به‌طور پیش‌فرض از
  رفتار پایدار استفاده کند. `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cwd" type="string">
  دایرکتوری کاری runtime درخواست‌شده (توسط سیاست backend/runtime اعتبارسنجی
  می‌شود). اگر حذف شود، ACP spawn در صورت پیکربندی، فضای کاری عامل هدف را
  به ارث می‌برد؛ مسیرهای به‌ارث‌رسیده ناموجود به پیش‌فرض‌های backend
  برمی‌گردند، در حالی که خطاهای واقعی دسترسی برگردانده می‌شوند.
</ParamField>
<ParamField path="label" type="string">
  برچسب قابل مشاهده برای اپراتور که در متن نشست/بنر استفاده می‌شود.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  به‌جای ساختن نشست جدید، یک نشست ACP موجود را از سر بگیرید. عامل تاریخچه
  گفت‌وگوی خود را از طریق `session/load` بازپخش می‌کند. به `runtime: "acp"`
  نیاز دارد.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` خلاصه‌های پیشرفت اجرای اولیه ACP را به‌صورت رویدادهای سیستمی
  به نشست درخواست‌کننده بازپخش می‌کند. پاسخ‌های پذیرفته‌شده شامل
  `streamLogPath` هستند که به یک لاگ JSONL محدود به نشست اشاره می‌کند
  (`<sessionId>.acp-stream.jsonl`) و می‌توانید آن را برای تاریخچه کامل
  رله دنبال کنید.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  نوبت فرزند ACP را پس از N ثانیه لغو می‌کند. `0` نوبت را روی مسیر بدون
  timeout مربوط به Gateway نگه می‌دارد. همان مقدار روی اجرای Gateway و
  runtime ACP اعمال می‌شود تا هارنس‌های متوقف‌شده یا تمام‌شده از نظر سهمیه،
  مسیر عامل والد را به‌طور نامحدود اشغال نکنند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی صریح مدل برای نشست فرزند ACP. Codex ACP spawns ارجاع‌های
  OpenClaw Codex مانند `openai-codex/gpt-5.4` را پیش از `session/new` به
  پیکربندی راه‌اندازی Codex ACP نرمال‌سازی می‌کنند؛ فرم‌های slash مانند
  `openai-codex/gpt-5.4/high` نیز میزان تلاش استدلال Codex ACP را تنظیم
  می‌کنند. هارنس‌های دیگر باید ACP `models` را اعلام کنند و از
  `session/set_model` پشتیبانی کنند؛ در غیر این صورت OpenClaw/acpx به‌جای
  بازگشت بی‌صدای به پیش‌فرض عامل هدف، با خطایی روشن شکست می‌خورد.
</ParamField>
<ParamField path="thinking" type="string">
  تلاش صریح برای تفکر/استدلال. برای Codex ACP، `minimal` به تلاش کم نگاشت
  می‌شود، `low`/`medium`/`high`/`xhigh` مستقیما نگاشت می‌شوند، و `off`
  بازنویسی راه‌اندازی reasoning-effort را حذف می‌کند.
</ParamField>

## حالت‌های اتصال و رشته برای Spawn

<Tabs>
  <Tab title="--bind here|off">
    | حالت   | رفتار                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | گفت‌وگوی فعال فعلی را در همان‌جا متصل می‌کند؛ اگر هیچ گفت‌وگوی فعالی نباشد، شکست می‌خورد. |
    | `off`  | اتصال گفت‌وگوی فعلی ایجاد نمی‌کند.                          |

    یادداشت‌ها:

    - `--bind here` ساده‌ترین مسیر اپراتور برای «این کانال یا چت را با پشتوانه Codex بساز» است.
    - `--bind here` رشته فرزند ایجاد نمی‌کند.
    - `--bind here` فقط در کانال‌هایی در دسترس است که پشتیبانی اتصال گفت‌وگوی فعلی را ارائه می‌کنند.
    - `--bind` و `--thread` را نمی‌توان در یک فراخوانی `/acp spawn` با هم ترکیب کرد.

  </Tab>
  <Tab title="--thread auto|here|off">
    | حالت   | رفتار                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | در یک رشته فعال: همان رشته را متصل می‌کند. بیرون از رشته: در صورت پشتیبانی، یک رشته فرزند ایجاد/متصل می‌کند. |
    | `here` | به رشته فعال فعلی نیاز دارد؛ اگر داخل رشته نباشد شکست می‌خورد.                                                  |
    | `off`  | بدون اتصال. نشست بدون اتصال آغاز می‌شود.                                                                 |

    یادداشت‌ها:

    - روی سطح‌های اتصال غیررشته‌ای، رفتار پیش‌فرض عملا `off` است.
    - spawn متصل به رشته به پشتیبانی سیاست کانال نیاز دارد:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - وقتی می‌خواهید گفت‌وگوی فعلی را بدون ایجاد رشته فرزند سنجاق کنید، از `--bind here` استفاده کنید.

  </Tab>
</Tabs>

## مدل تحویل

نشست‌های ACP می‌توانند یا فضاهای کاری تعاملی باشند یا کار پس‌زمینه‌ای که
مالک آن والد است. مسیر تحویل به این شکل بستگی دارد.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    نشست‌های تعاملی برای ادامه گفت‌وگو روی یک سطح چت قابل مشاهده طراحی شده‌اند:

    - `/acp spawn ... --bind here` گفت‌وگوی فعلی را به نشست ACP متصل می‌کند.
    - `/acp spawn ... --thread ...` یک رشته/موضوع کانال را به نشست ACP متصل می‌کند.
    - پیکربندی‌های پایدار `bindings[].type="acp"` گفت‌وگوهای منطبق را به همان نشست ACP هدایت می‌کنند.

    پیام‌های بعدی در گفت‌وگوی متصل مستقیما به نشست ACP هدایت می‌شوند، و
    خروجی ACP به همان کانال/رشته/موضوع برگردانده می‌شود.

    آنچه OpenClaw به هارنس می‌فرستد:

    - پیگیری‌های متصل معمولی به‌صورت متن پرامپت فرستاده می‌شوند، همراه با پیوست‌ها فقط وقتی هارنس/backend از آن‌ها پشتیبانی کند.
    - دستورهای مدیریتی `/acp` و دستورهای محلی Gateway پیش از ارسال به ACP رهگیری می‌شوند.
    - رویدادهای تکمیل تولیدشده توسط runtime برای هر هدف مادی‌سازی می‌شوند. عامل‌های OpenClaw پوش runtime-context داخلی OpenClaw را دریافت می‌کنند؛ هارنس‌های ACP خارجی یک پرامپت ساده همراه با نتیجه فرزند و دستور دریافت می‌کنند. پوش خام `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` هرگز نباید به هارنس‌های خارجی فرستاده شود یا به‌عنوان متن transcript کاربر ACP پایدار شود.
    - ورودی‌های transcript ACP از متن محرک قابل مشاهده برای کاربر یا پرامپت تکمیل ساده استفاده می‌کنند. فراداده رویداد داخلی تا جای ممکن در OpenClaw به‌صورت ساختاریافته باقی می‌ماند و به‌عنوان محتوای چت نوشته‌شده توسط کاربر تلقی نمی‌شود.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    نشست‌های یک‌باره ACP که توسط اجرای عامل دیگری ایجاد می‌شوند، فرزندان
    پس‌زمینه‌ای هستند، مشابه sub-agents:

    - والد با `sessions_spawn({ runtime: "acp", mode: "run" })` درخواست کار می‌دهد.
    - فرزند در نشست هارنس ACP خودش اجرا می‌شود.
    - نوبت‌های فرزند روی همان مسیر پس‌زمینه‌ای اجرا می‌شوند که spawnهای sub-agent بومی استفاده می‌کنند، بنابراین یک هارنس ACP کند کار نامرتبط نشست اصلی را مسدود نمی‌کند.
    - گزارش تکمیل از مسیر اعلام تکمیل کار برمی‌گردد. OpenClaw پیش از فرستادن فراداده تکمیل داخلی به یک هارنس خارجی، آن را به پرامپت ACP ساده تبدیل می‌کند، بنابراین هارنس‌ها نشانگرهای زمینه runtime مخصوص OpenClaw را نمی‌بینند.
    - وقتی پاسخ قابل مشاهده برای کاربر مفید باشد، والد نتیجه فرزند را با صدای عادی assistant بازنویسی می‌کند.

    با این مسیر مانند یک چت همتا‌به‌همتا بین والد و فرزند رفتار **نکنید**.
    فرزند از قبل یک کانال تکمیل برای بازگشت به والد دارد.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` می‌تواند پس از spawn نشست دیگری را هدف بگیرد. برای نشست‌های
    همتای معمولی، OpenClaw پس از تزریق پیام از مسیر پیگیری عامل‌به‌عامل
    (A2A) استفاده می‌کند:

    - منتظر پاسخ نشست هدف بمانید.
    - به‌صورت اختیاری اجازه دهید درخواست‌کننده و هدف تعداد محدودی نوبت پیگیری ردوبدل کنند.
    - از هدف بخواهید یک پیام اعلام تولید کند.
    - آن اعلام را به کانال یا رشته قابل مشاهده تحویل دهید.

    آن مسیر A2A یک fallback برای ارسال‌های همتا است که فرستنده در آن‌ها به
    پیگیری قابل مشاهده نیاز دارد. وقتی یک نشست نامرتبط بتواند هدف ACP را
    ببیند و به آن پیام بدهد، مثلا زیر تنظیمات گسترده
    `tools.sessions.visibility`، فعال باقی می‌ماند.

    OpenClaw پیگیری A2A را فقط زمانی رد می‌کند که درخواست‌کننده والد فرزند
    ACP یک‌باره و متعلق به خودش باشد. در آن حالت، اجرای A2A روی تکمیل کار
    می‌تواند والد را با نتیجه فرزند بیدار کند، پاسخ والد را دوباره به فرزند
    بفرستد، و یک حلقه پژواک والد/فرزند بسازد. نتیجه `sessions_send` برای
    این حالت فرزند متعلق‌شده `delivery.status="skipped"` را گزارش می‌کند،
    چون مسیر تکمیل از قبل مسئول نتیجه است.

  </Accordion>
  <Accordion title="Resume an existing session">
    برای ادامه دادن یک نشست ACP قبلی به‌جای شروع تازه، از `resumeSessionId`
    استفاده کنید. عامل تاریخچه گفت‌وگوی خود را از طریق `session/load`
    بازپخش می‌کند، بنابراین با زمینه کامل آنچه قبلا رخ داده ادامه می‌دهد.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    موارد استفاده رایج:

    - یک نشست Codex را از لپ‌تاپ خود به تلفنتان تحویل دهید — به عامل خود بگویید از همان‌جایی که رها کرده بودید ادامه دهد.
    - یک نشست کدنویسی را که به‌صورت تعاملی در CLI شروع کرده بودید، اکنون به‌صورت headless از طریق عامل خود ادامه دهید.
    - کاری را که به‌دلیل راه‌اندازی مجدد Gateway یا idle timeout قطع شده بود، ادامه دهید.

    یادداشت‌ها:

    - `resumeSessionId` فقط زمانی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض sub-agent این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `streamTo` فقط زمانی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض sub-agent این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `resumeSessionId` یک شناسه ازسرگیری ACP/harness محلی میزبان است، نه کلید نشست کانال OpenClaw؛ OpenClaw همچنان پیش از ارسال، سیاست spawn ACP و سیاست عامل هدف را بررسی می‌کند، در حالی که backend یا هارنس ACP مالک مجوزدهی برای بارگذاری آن شناسه upstream است.
    - `resumeSessionId` تاریخچه گفت‌وگوی ACP upstream را بازیابی می‌کند؛ `thread` و `mode` همچنان به‌طور معمول روی نشست جدید OpenClaw که ایجاد می‌کنید اعمال می‌شوند، بنابراین `mode: "session"` همچنان به `thread: true` نیاز دارد.
    - عامل هدف باید از `session/load` پشتیبانی کند (Codex و Claude Code پشتیبانی می‌کنند).
    - اگر شناسه نشست پیدا نشود، spawn با خطایی روشن شکست می‌خورد — هیچ fallback بی‌صدایی به نشست جدید انجام نمی‌شود.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    پس از استقرار Gateway، به‌جای اعتماد به آزمون‌های واحد، یک بررسی زنده
    end-to-end اجرا کنید:

    1. نسخه و commit مربوط به Gateway مستقرشده را روی میزبان هدف بررسی کنید.
    2. یک نشست موقت پل ACPX به یک عامل زنده باز کنید.
    3. از آن عامل بخواهید `sessions_spawn` را با `runtime: "acp"`، `agentId: "codex"`، `mode: "run"`، و task `Reply with exactly LIVE-ACP-SPAWN-OK` فراخوانی کند.
    4. `accepted=yes`، یک `childSessionKey` واقعی، و نبود خطای اعتبارسنجی را بررسی کنید.
    5. نشست موقت پل را پاک‌سازی کنید.

    gate را روی `mode: "run"` نگه دارید و `streamTo: "parent"` را رد کنید —
    `mode: "session"` متصل به رشته و مسیرهای stream-relay گذرهای یکپارچه‌سازی
    غنی‌تر و جداگانه‌ای هستند.

  </Accordion>
</AccordionGroup>

## سازگاری sandbox

نشست‌های ACP در حال حاضر روی runtime میزبان اجرا می‌شوند، **نه** داخل
sandbox OpenClaw.

<Warning>
**مرز امنیتی:**

- هارنس خارجی می‌تواند طبق مجوزهای CLI خودش و `cwd` انتخاب‌شده بخواند/بنویسد.
- سیاست sandbox در OpenClaw اجرای هارنس ACP را **پوشش نمی‌دهد**.
- OpenClaw همچنان دروازه‌های قابلیت ACP، عامل‌های مجاز، مالکیت نشست، اتصال‌های کانال، و سیاست تحویل Gateway را اعمال می‌کند.
- برای کار بومی OpenClaw با اجرای sandbox، از `runtime: "subagent"` استفاده کنید.

</Warning>

محدودیت‌های فعلی:

- اگر نشست درخواست‌کننده sandbox شده باشد، ایجاد ACP هم برای `sessions_spawn({ runtime: "acp" })` و هم برای `/acp spawn` مسدود می‌شود.
- `sessions_spawn` با `runtime: "acp"` از `sandbox: "require"` پشتیبانی نمی‌کند.

## تعیین مقصد نشست

بیشتر کنش‌های `/acp` یک مقصد نشست اختیاری می‌پذیرند (`session-key`،
`session-id`، یا `session-label`).

**ترتیب تعیین مقصد:**

1. آرگومان مقصد صریح (یا `--session` برای `/acp steer`)
   - ابتدا کلید را امتحان می‌کند
   - سپس شناسه نشست با شکل UUID را
   - سپس برچسب را
2. اتصال رشته فعلی (اگر این گفتگو/رشته به یک نشست ACP متصل باشد).
3. بازگشت به نشست درخواست‌کننده فعلی.

اتصال‌های گفتگوی فعلی و اتصال‌های رشته هر دو در
مرحله 2 مشارکت دارند.

اگر هیچ مقصدی تعیین نشود، OpenClaw یک خطای روشن برمی‌گرداند
(`Unable to resolve session target: ...`).

## کنترل‌های ACP

| فرمان               | کارکرد                                                    | مثال                                                          |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`        | نشست ACP ایجاد می‌کند؛ اتصال فعلی یا اتصال رشته اختیاری است. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`       | نوبت در حال اجرای نشست مقصد را لغو می‌کند.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`        | دستور هدایت را به نشست در حال اجرا می‌فرستد.              | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`        | نشست را می‌بندد و مقصدهای رشته را از اتصال خارج می‌کند.  | `/acp close`                                                  |
| `/acp status`       | پشتانه، حالت، وضعیت، گزینه‌های زمان اجرا، و قابلیت‌ها را نشان می‌دهد. | `/acp status`                                                 |
| `/acp set-mode`     | حالت زمان اجرا را برای نشست مقصد تنظیم می‌کند.            | `/acp set-mode plan`                                          |
| `/acp set`          | نوشتن گزینه پیکربندی عمومی زمان اجرا.                    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`          | بازنویسی پوشه کاری زمان اجرا را تنظیم می‌کند.             | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`  | نمایه سیاست تأیید را تنظیم می‌کند.                       | `/acp permissions strict`                                     |
| `/acp timeout`      | مهلت زمان اجرا را تنظیم می‌کند (ثانیه).                  | `/acp timeout 120`                                            |
| `/acp model`        | بازنویسی مدل زمان اجرا را تنظیم می‌کند.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | بازنویسی‌های گزینه زمان اجرای نشست را حذف می‌کند.        | `/acp reset-options`                                          |
| `/acp sessions`     | نشست‌های اخیر ACP را از ذخیره‌گاه فهرست می‌کند.           | `/acp sessions`                                               |
| `/acp doctor`       | سلامت پشتانه، قابلیت‌ها، و اصلاح‌های قابل اقدام.          | `/acp doctor`                                                 |
| `/acp install`      | مراحل نصب و فعال‌سازی قطعی را چاپ می‌کند.                 | `/acp install`                                                |

`/acp status` گزینه‌های مؤثر زمان اجرا به‌همراه شناسه‌های نشست در سطح زمان اجرا و
سطح پشتانه را نشان می‌دهد. خطاهای کنترل پشتیبانی‌نشده وقتی پشتانه فاقد قابلیتی باشد
به‌روشنی نمایش داده می‌شوند. `/acp sessions` ذخیره‌گاه را برای نشست متصل فعلی یا نشست درخواست‌کننده می‌خواند؛ توکن‌های مقصد
(`session-key`، `session-id`، یا `session-label`) از طریق کشف نشست
Gateway تعیین می‌شوند، از جمله ریشه‌های سفارشی `session.store` به‌ازای هر عامل.

### نگاشت گزینه‌های زمان اجرا

`/acp` فرمان‌های میانبر و یک تنظیم‌کننده عمومی دارد. عملیات‌های معادل:

| فرمان                       | نگاشت به                             | یادداشت‌ها                                                                                                                                                                      |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`           | کلید پیکربندی زمان اجرا `model`      | برای ACP مربوط به Codex، OpenClaw مقدار `openai-codex/<model>` را به شناسه مدل آداپتور عادی‌سازی می‌کند و پسوندهای استدلالی اسلش‌دار مانند `openai-codex/gpt-5.4/high` را به `reasoning_effort` نگاشت می‌کند. |
| `/acp set thinking <level>` | کلید پیکربندی زمان اجرا `thinking`   | برای ACP مربوط به Codex، OpenClaw مقدار متناظر `reasoning_effort` را، هرجا آداپتور از آن پشتیبانی کند، ارسال می‌کند.                                                           |
| `/acp permissions <profile>` | کلید پیکربندی زمان اجرا `approval_policy` | —                                                                                                                                                                               |
| `/acp timeout <seconds>`    | کلید پیکربندی زمان اجرا `timeout`    | —                                                                                                                                                                               |
| `/acp cwd <path>`           | بازنویسی cwd زمان اجرا               | به‌روزرسانی مستقیم.                                                                                                                                                            |
| `/acp set <key> <value>`    | عمومی                                | `key=cwd` از مسیر بازنویسی cwd استفاده می‌کند.                                                                                                                                  |
| `/acp reset-options`        | همه بازنویسی‌های زمان اجرا را پاک می‌کند | —                                                                                                                                                                               |

## هارنس acpx، راه‌اندازی Plugin، و مجوزها

برای پیکربندی هارنس acpx (نام‌های مستعار CLI برای Claude Code / Codex / Gemini)، پل‌های MCP مربوط به plugin-tools و OpenClaw-tools، و حالت‌های مجوز ACP، ببینید
[عامل‌های ACP — راه‌اندازی](/fa/tools/acp-agents-setup).

## عیب‌یابی

| نشانه                                                                     | علت محتمل                                                                                                           | رفع                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin بک‌اند وجود ندارد، غیرفعال است، یا توسط `plugins.allow` مسدود شده است.                                                       | Plugin بک‌اند را نصب و فعال کنید، وقتی این فهرست مجاز تنظیم شده است `acpx` را در `plugins.allow` بگنجانید، سپس `/acp doctor` را اجرا کنید.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP به‌صورت سراسری غیرفعال شده است.                                                                                                 | `acp.enabled=true` را تنظیم کنید.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | dispatch خودکار از پیام‌های عادی thread غیرفعال شده است.                                                               | برای ازسرگیری مسیریابی خودکار thread، `acp.dispatch.enabled=true` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | عامل در فهرست مجاز نیست.                                                                                                | از `agentId` مجاز استفاده کنید یا `acp.allowedAgents` را به‌روزرسانی کنید.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | بررسی وابستگی Plugin یا خودترمیمی هنوز در حال اجراست.                                                               | کمی صبر کنید و دوباره `/acp doctor` را اجرا کنید؛ اگر همچنان ناسالم بود، خطای نصب بک‌اند و سیاست مجاز/غیرمجاز Plugin را بررسی کنید.                                             |
| Harness command not found                                                   | CLI آداپتر نصب نشده است، وابستگی‌های Plugin آماده‌سازی‌شده وجود ندارند، یا دریافت بار اول `npx` برای یک آداپتر غیر Codex شکست خورده است. | `/acp doctor` را اجرا کنید، وابستگی‌های Plugin را تعمیر کنید، آداپتر را روی میزبان Gateway نصب/پیش‌گرم کنید، یا فرمان عامل acpx را به‌صورت صریح پیکربندی کنید.                          |
| Model-not-found from the harness                                            | شناسه مدل برای ارائه‌دهنده/هارنس دیگری معتبر است اما برای این هدف ACP معتبر نیست.                                                | از مدلی که همان هارنس فهرست کرده است استفاده کنید، مدل را در هارنس پیکربندی کنید، یا override را حذف کنید.                                                                            |
| Vendor auth error from the harness                                          | OpenClaw سالم است، اما CLI/ارائه‌دهنده هدف وارد نشده است.                                                     | وارد شوید یا کلید ارائه‌دهنده لازم را در محیط میزبان Gateway فراهم کنید.                                                                                             |
| `Unable to resolve session target: ...`                                     | توکن کلید/شناسه/برچسب نامعتبر است.                                                                                                | `/acp sessions` را اجرا کنید، کلید/برچسب دقیق را کپی کنید، دوباره تلاش کنید.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` بدون یک گفت‌وگوی فعال قابل bind استفاده شده است.                                                            | به chat/channel هدف بروید و دوباره تلاش کنید، یا spawn بدون bind استفاده کنید.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | آداپتر قابلیت bind گفت‌وگوی فعلی ACP را ندارد.                                                             | در صورت پشتیبانی، از `/acp spawn ... --thread ...` استفاده کنید، `bindings[]` سطح بالا را پیکربندی کنید، یا به channel پشتیبانی‌شده بروید.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` بیرون از زمینه thread استفاده شده است.                                                                         | به thread هدف بروید یا از `--thread auto`/`off` استفاده کنید.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | کاربر دیگری مالک هدف bind فعال است.                                                                           | به‌عنوان مالک rebind کنید یا از گفت‌وگو یا thread دیگری استفاده کنید.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | آداپتر قابلیت bind کردن thread را ندارد.                                                                               | از `--thread off` استفاده کنید یا به آداپتر/channel پشتیبانی‌شده بروید.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | runtime ACP سمت میزبان است؛ نشست درخواست‌دهنده sandbox شده است.                                                              | از نشست‌های sandbox شده `runtime="subagent"` را استفاده کنید، یا spawn ACP را از یک نشست غیر sandbox شده اجرا کنید.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` برای runtime ACP درخواست شده است.                                                                         | برای sandbox الزامی از `runtime="subagent"` استفاده کنید، یا ACP را با `sandbox="inherit"` از یک نشست غیر sandbox شده به‌کار ببرید.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | هارنس هدف تعویض مدل عمومی ACP را ارائه نمی‌کند.                                                        | از هارنسی استفاده کنید که ACP `models`/`session/set_model` را ارائه می‌کند، از ارجاع‌های مدل ACP در Codex استفاده کنید، یا اگر هارنس flag راه‌اندازی خودش را دارد، مدل را مستقیماً در هارنس پیکربندی کنید. |
| Missing ACP metadata for bound session                                      | فراداده نشست ACP قدیمی/حذف‌شده است.                                                                                    | با `/acp spawn` دوباره ایجاد کنید، سپس thread را دوباره bind/focus کنید.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` در نشست غیرتعاملی ACP، write/exec را مسدود می‌کند.                                                    | `plugins.entries.acpx.config.permissionMode` را روی `approve-all` تنظیم کنید و gateway را دوباره راه‌اندازی کنید. [پیکربندی مجوز](/fa/tools/acp-agents-setup#permission-configuration) را ببینید. |
| ACP session fails early with little output                                  | promptهای مجوز توسط `permissionMode`/`nonInteractivePermissions` مسدود شده‌اند.                                        | لاگ‌های gateway را برای `AcpRuntimeError` بررسی کنید. برای مجوزهای کامل، `permissionMode=approve-all` را تنظیم کنید؛ برای تنزل graceful، `nonInteractivePermissions=deny` را تنظیم کنید.        |
| ACP session stalls indefinitely after completing work                       | فرایند هارنس پایان یافته اما نشست ACP تکمیل را گزارش نکرده است.                                                    | با `ps aux \| grep acpx` پایش کنید؛ فرایندهای قدیمی را دستی kill کنید.                                                                                                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | envelope رویداد داخلی از مرز ACP نشت کرده است.                                                                | OpenClaw را به‌روزرسانی کنید و جریان تکمیل را دوباره اجرا کنید؛ هارنس‌های خارجی باید فقط promptهای تکمیل ساده دریافت کنند.                                                          |

## مرتبط

- [عامل‌های ACP — راه‌اندازی](/fa/tools/acp-agents-setup)
- [ارسال عامل](/fa/tools/agent-send)
- [بک‌اندهای CLI](/fa/gateway/cli-backends)
- [هارنس Codex](/fa/plugins/codex-harness)
- [ابزارهای sandbox چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (حالت bridge)](/fa/cli/acp)
- [زیرعامل‌ها](/fa/tools/subagents)
