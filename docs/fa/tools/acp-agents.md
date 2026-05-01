---
read_when:
    - اجرای هارنس‌های کدنویسی از طریق ACP
    - راه‌اندازی نشست‌های ACP وابسته به گفتگو در کانال‌های پیام‌رسانی
    - پیوند دادن یک گفت‌وگوی کانال پیام به یک نشست پایدار ACP
    - عیب‌یابی بک‌اند ACP، اتصال‌دهی Plugin، یا تحویل تکمیل‌ها
    - اجرای فرمان‌های /acp از چت
sidebarTitle: ACP agents
summary: هارنس‌های کدنویسی خارجی (Claude Code، Cursor، Gemini CLI، Codex ACP صریح، OpenClaw ACP، OpenCode) را از طریق بک‌اند ACP اجرا کنید
title: عامل‌های ACP
x-i18n:
    generated_at: "2026-05-01T11:54:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb4164208571799f2d78d324f86c9b2fb72c60489ac2c367256f222495c74dbf
    source_path: tools/acp-agents.md
    workflow: 16
---

نشست‌های [پروتکل کلاینت عامل (ACP)](https://agentclientprotocol.com/)
به OpenClaw امکان می‌دهند چارچوب‌های اجرایی کدنویسی خارجی (برای مثال Pi، Claude Code،
Cursor، Copilot، Droid، OpenClaw ACP، OpenCode، Gemini CLI و دیگر چارچوب‌های اجرایی
ACPX پشتیبانی‌شده) را از طریق یک Plugin پس‌زمینه ACP اجرا کند.

هر ایجاد نشست ACP به‌عنوان یک [وظیفه پس‌زمینه](/fa/automation/tasks) ردیابی می‌شود.

<Note>
**ACP مسیر چارچوب اجرایی خارجی است، نه مسیر پیش‌فرض Codex.** Plugin
بومی سرور برنامه Codex کنترل‌های `/codex ...` و runtime تعبیه‌شده
`agentRuntime.id: "codex"` را در اختیار دارد؛ ACP کنترل‌های
`/acp ...` و نشست‌های `sessions_spawn({ runtime: "acp" })` را در اختیار دارد.

اگر می‌خواهید Codex یا Claude Code به‌عنوان کلاینت MCP خارجی
مستقیما به مکالمه‌های کانال موجود OpenClaw وصل شود، به‌جای ACP از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.
</Note>

## کدام صفحه را می‌خواهم؟

| شما می‌خواهید…                                                                                  | از این استفاده کنید                   | یادداشت‌ها                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex را در مکالمه فعلی متصل یا کنترل کنید                                                     | `/codex bind`, `/codex threads`       | مسیر بومی سرور برنامه Codex زمانی که Plugin `codex` فعال است؛ شامل پاسخ‌های گفت‌وگوی متصل، ارسال تصویر، مدل/سریع/مجوزها، توقف، و کنترل‌های هدایت. ACP یک جایگزین صریح است |
| Claude Code، Gemini CLI، Codex ACP صریح، یا یک چارچوب اجرایی خارجی دیگر را _از طریق_ OpenClaw اجرا کنید | این صفحه                             | نشست‌های متصل به گفت‌وگو، `/acp spawn`، `sessions_spawn({ runtime: "acp" })`، وظایف پس‌زمینه، کنترل‌های runtime                                                                               |
| یک نشست OpenClaw Gateway را _به‌عنوان_ سرور ACP برای ویرایشگر یا کلاینت ارائه کنید             | [`openclaw acp`](/fa/cli/acp)            | حالت پل. IDE/کلاینت از طریق stdio/WebSocket با ACP به OpenClaw صحبت می‌کند                                                                                                                   |
| یک CLI هوش مصنوعی محلی را به‌عنوان مدل جایگزین فقط متنی دوباره استفاده کنید                    | [پس‌زمینه‌های CLI](/fa/gateway/cli-backends) | ACP نیست. بدون ابزارهای OpenClaw، بدون کنترل‌های ACP، بدون runtime چارچوب اجرایی                                                                                                             |

## آیا این از ابتدا کار می‌کند؟

معمولا بله. نصب‌های تازه، Plugin runtime همراه `acpx` را به‌صورت پیش‌فرض فعال دارند
و همراه با یک باینری `acpx` سنجاق‌شده محلیِ Plugin ارائه می‌شوند که OpenClaw آن را
بررسی می‌کند و بلافاصله پس از زنده شدن شنونده HTTP Gateway خودترمیم می‌کند. برای
بررسی آمادگی، `/acp doctor` را اجرا کنید.

OpenClaw فقط وقتی ایجاد ACP را به عامل‌ها آموزش می‌دهد که ACP **واقعا
قابل استفاده** باشد: ACP باید فعال باشد، dispatch نباید غیرفعال باشد، نشست فعلی
نباید توسط sandbox مسدود شده باشد، و یک پس‌زمینه runtime باید بارگذاری شده باشد.
اگر این شرط‌ها برقرار نباشند، Skills مربوط به ACP Plugin و راهنمای ACP برای
`sessions_spawn` پنهان می‌مانند تا عامل یک پس‌زمینه دردسترس‌نبودنی را پیشنهاد نکند.

<AccordionGroup>
  <Accordion title="نکات دردسرساز اجرای نخست">
    - اگر `plugins.allow` تنظیم شده باشد، یک فهرست محدودکننده Plugin است و **باید** شامل `acpx` باشد؛ در غیر این صورت پیش‌فرض همراه عمدا مسدود می‌شود و `/acp doctor` ورودی allowlist گمشده را گزارش می‌کند.
    - مبدل همراه Codex ACP همراه با Plugin `acpx` آماده‌سازی می‌شود و در صورت امکان به‌صورت محلی اجرا می‌شود.
    - مبدل‌های دیگر چارچوب‌های اجرایی هدف ممکن است همچنان در نخستین استفاده با `npx` بر اساس نیاز واکشی شوند.
    - احراز هویت فروشنده همچنان باید برای آن چارچوب اجرایی روی میزبان وجود داشته باشد.
    - اگر میزبان npm یا دسترسی شبکه نداشته باشد، واکشی‌های مبدل در اجرای نخست شکست می‌خورند تا زمانی که کش‌ها از پیش گرم شوند یا مبدل از راه دیگری نصب شود.

  </Accordion>
  <Accordion title="پیش‌نیازهای runtime">
    ACP یک فرایند واقعی چارچوب اجرایی خارجی را اجرا می‌کند. OpenClaw مالک مسیریابی،
    وضعیت وظیفه پس‌زمینه، تحویل، اتصال‌ها، و سیاست است؛ چارچوب اجرایی
    مالک ورود ارائه‌دهنده، کاتالوگ مدل، رفتار فایل‌سیستم، و ابزارهای بومی خود است.

    پیش از مقصر دانستن OpenClaw، این موارد را بررسی کنید:

    - `/acp doctor` یک پس‌زمینه فعال و سالم را گزارش کند.
    - وقتی allowlist مربوط به `acp.allowedAgents` تنظیم شده است، شناسه هدف توسط آن مجاز باشد.
    - فرمان چارچوب اجرایی بتواند روی میزبان Gateway شروع شود.
    - احراز هویت ارائه‌دهنده برای آن چارچوب اجرایی موجود باشد (`claude`, `codex`, `gemini`, `opencode`, `droid`, و غیره).
    - مدل انتخاب‌شده برای آن چارچوب اجرایی وجود داشته باشد — شناسه‌های مدل بین چارچوب‌های اجرایی قابل حمل نیستند.
    - `cwd` درخواست‌شده وجود داشته باشد و در دسترس باشد، یا `cwd` را حذف کنید و اجازه دهید پس‌زمینه از پیش‌فرض خود استفاده کند.
    - حالت مجوز با کار هم‌خوان باشد. نشست‌های غیرتعاملی نمی‌توانند روی اعلان‌های مجوز بومی کلیک کنند، بنابراین اجراهای کدنویسی سنگین از نظر نوشتن/اجرا معمولا به یک نمایه مجوز ACPX نیاز دارند که بتواند بدون رابط تعاملی پیش برود.

  </Accordion>
</AccordionGroup>

ابزارهای Plugin در OpenClaw و ابزارهای داخلی OpenClaw به‌صورت پیش‌فرض در معرض
چارچوب‌های اجرایی ACP قرار نمی‌گیرند. پل‌های MCP صریح را در
[عامل‌های ACP — راه‌اندازی](/fa/tools/acp-agents-setup) فقط زمانی فعال کنید که چارچوب اجرایی
باید مستقیما آن ابزارها را فراخوانی کند.

## چارچوب‌های اجرایی هدف پشتیبانی‌شده

با پس‌زمینه همراه `acpx`، از این شناسه‌های چارچوب اجرایی به‌عنوان هدف‌های `/acp spawn <id>`
یا `sessions_spawn({ runtime: "acp", agentId: "<id>" })` استفاده کنید:

| شناسه چارچوب اجرایی | پس‌زمینه معمول                                  | یادداشت‌ها                                                                          |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | مبدل Claude Code ACP                           | به احراز هویت Claude Code روی میزبان نیاز دارد.                                     |
| `codex`    | مبدل Codex ACP                                 | فقط زمانی جایگزین صریح ACP است که `/codex` بومی دردسترس نباشد یا ACP درخواست شده باشد. |
| `copilot`  | مبدل GitHub Copilot ACP                        | به احراز هویت CLI/runtime مربوط به Copilot نیاز دارد.                               |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | اگر نصب محلی entrypoint متفاوتی برای ACP ارائه می‌کند، فرمان acpx را بازنویسی کنید. |
| `droid`    | Factory Droid CLI                              | به احراز هویت Factory/Droid یا `FACTORY_API_KEY` در محیط چارچوب اجرایی نیاز دارد.   |
| `gemini`   | مبدل Gemini CLI ACP                            | به احراز هویت Gemini CLI یا راه‌اندازی کلید API نیاز دارد.                          |
| `iflow`    | iFlow CLI                                      | دردسترس‌بودن مبدل و کنترل مدل به CLI نصب‌شده وابسته است.                           |
| `kilocode` | Kilo Code CLI                                  | دردسترس‌بودن مبدل و کنترل مدل به CLI نصب‌شده وابسته است.                           |
| `kimi`     | Kimi/Moonshot CLI                              | به احراز هویت Kimi/Moonshot روی میزبان نیاز دارد.                                  |
| `kiro`     | Kiro CLI                                       | دردسترس‌بودن مبدل و کنترل مدل به CLI نصب‌شده وابسته است.                           |
| `opencode` | مبدل OpenCode ACP                              | به احراز هویت OpenCode CLI/ارائه‌دهنده نیاز دارد.                                  |
| `openclaw` | پل OpenClaw Gateway از طریق `openclaw acp`     | به یک چارچوب اجرایی آگاه از ACP امکان می‌دهد با یک نشست OpenClaw Gateway صحبت کند. |
| `pi`       | runtime تعبیه‌شده Pi/OpenClaw                  | برای آزمایش‌های چارچوب اجرایی بومی OpenClaw استفاده می‌شود.                        |
| `qwen`     | Qwen Code / Qwen CLI                           | به احراز هویت سازگار با Qwen روی میزبان نیاز دارد.                                 |

نام‌های مستعار سفارشی عامل acpx را می‌توان در خود acpx پیکربندی کرد، اما سیاست OpenClaw
همچنان `acp.allowedAgents` و هر نگاشت `agents.list[].runtime.acp.agent` را پیش از dispatch
بررسی می‌کند.

## راهنمای اجرای اپراتور

جریان سریع `/acp` از گفت‌وگو:

<Steps>
  <Step title="ایجاد">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، یا
    `/acp spawn codex --bind here` صریح.
  </Step>
  <Step title="کار">
    در مکالمه یا رشته متصل ادامه دهید (یا کلید نشست را صریحا هدف بگیرید).
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
    بدون جایگزین کردن زمینه: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="توقف">
    `/acp cancel` (نوبت فعلی) یا `/acp close` (نشست + اتصال‌ها).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="جزئیات چرخه عمر">
    - ایجاد، یک نشست runtime ACP را می‌سازد یا از سر می‌گیرد، فراداده ACP را در مخزن نشست OpenClaw ثبت می‌کند، و وقتی اجرا متعلق به والد باشد ممکن است یک وظیفه پس‌زمینه بسازد.
    - نشست‌های ACP متعلق به والد، حتی وقتی نشست runtime پایدار است، به‌عنوان کار پس‌زمینه در نظر گرفته می‌شوند؛ تکمیل و تحویل میان‌سطحی به‌جای رفتار مانند یک نشست گفت‌وگوی عادی روبه‌کاربر، از طریق آگاه‌ساز وظیفه والد انجام می‌شود.
    - نگه‌داری وظیفه، نشست‌های ACP یک‌باره متعلق به والد را که پایانی یا یتیم هستند می‌بندد. نشست‌های ACP پایدار تا زمانی که اتصال مکالمه فعال باقی بماند حفظ می‌شوند؛ نشست‌های پایدار کهنه بدون اتصال فعال بسته می‌شوند تا نتوانند پس از اتمام وظیفه مالک یا حذف رکورد وظیفه آن، بی‌صدا از سر گرفته شوند.
    - پیام‌های پیگیری متصل تا زمانی که اتصال بسته، از تمرکز خارج، بازنشانی، یا منقضی شود مستقیما به نشست ACP می‌روند.
    - فرمان‌های Gateway محلی می‌مانند. `/acp ...`، `/status`، و `/unfocus` هرگز به‌عنوان متن prompt عادی به یک چارچوب اجرایی ACP متصل ارسال نمی‌شوند.
    - `cancel` وقتی پس‌زمینه از لغو پشتیبانی کند نوبت فعال را لغو می‌کند؛ اتصال یا فراداده نشست را حذف نمی‌کند.
    - `close` نشست ACP را از نگاه OpenClaw پایان می‌دهد و اتصال را حذف می‌کند. اگر چارچوب اجرایی از ازسرگیری پشتیبانی کند، ممکن است همچنان تاریخچه بالادستی خودش را نگه دارد.
    - کارگرهای runtime بیکار پس از `acp.runtime.ttlMinutes` واجد شرایط پاک‌سازی هستند؛ فراداده نشست ذخیره‌شده برای `/acp sessions` دردسترس می‌ماند.

  </Accordion>
  <Accordion title="قواعد مسیریابی بومی Codex">
    محرک‌های زبان طبیعی که باید به **Plugin بومی Codex**
    مسیریابی شوند، وقتی فعال است:

    - "این کانال Discord را به Codex متصل کن."
    - "این گفت‌وگو را به رشته Codex با شناسه `<id>` پیوست کن."
    - "رشته‌های Codex را نشان بده، سپس این یکی را متصل کن."

    اتصال مکالمه بومی Codex مسیر پیش‌فرض کنترل گفت‌وگو است.
    ابزارهای پویای OpenClaw همچنان از طریق OpenClaw اجرا می‌شوند، در حالی که
    ابزارهای بومی Codex مانند shell/apply-patch داخل Codex اجرا می‌شوند.
    برای رویدادهای ابزار بومی Codex، OpenClaw یک relay قلاب بومی به‌ازای هر نوبت
    تزریق می‌کند تا قلاب‌های Plugin بتوانند `before_tool_call` را مسدود کنند،
    `after_tool_call` را مشاهده کنند، و رویدادهای Codex `PermissionRequest` را
    از طریق تاییدهای OpenClaw مسیریابی کنند. قلاب‌های Codex `Stop` به
    OpenClaw `before_agent_finalize` relay می‌شوند، جایی که Pluginها می‌توانند پیش از
    نهایی‌سازی پاسخ توسط Codex یک گذر مدل دیگر درخواست کنند. relay عمدا
    محافظه‌کار باقی می‌ماند: آرگومان‌های ابزار بومی Codex را تغییر نمی‌دهد
    یا رکوردهای رشته Codex را بازنویسی نمی‌کند. از ACP صریح فقط زمانی استفاده کنید
    که مدل runtime/نشست ACP را می‌خواهید. مرز پشتیبانی تعبیه‌شده Codex در
    [قرارداد پشتیبانی چارچوب اجرایی Codex v1](/fa/plugins/codex-harness#v1-support-contract)
    مستند شده است.

  </Accordion>
  <Accordion title="برگه تقلب انتخاب مدل / ارائه‌دهنده / زمان اجرا">
    - `openai-codex/*` — مسیر OAuth/اشتراک PI Codex.
    - `openai/*` به‌همراه `agentRuntime.id: "codex"` — زمان اجرای جاسازی‌شده بومی Codex app-server.
    - `/codex ...` — کنترل گفت‌وگوی بومی Codex.
    - `/acp ...` یا `runtime: "acp"` — کنترل صریح ACP/acpx.

  </Accordion>
  <Accordion title="محرک‌های زبان طبیعی مسیریابی ACP">
    محرک‌هایی که باید به زمان اجرای ACP مسیریابی شوند:

    - "این را به‌صورت یک نشست یک‌باره Claude Code ACP اجرا کن و نتیجه را خلاصه کن."
    - "برای این کار در یک رشته از Gemini CLI استفاده کن، سپس پیگیری‌ها را در همان رشته نگه دار."
    - "Codex را از طریق ACP در یک رشته پس‌زمینه اجرا کن."

    OpenClaw مقدار `runtime: "acp"` را انتخاب می‌کند، چارچوب `agentId` را
    resolve می‌کند، در صورت پشتیبانی به گفت‌وگو یا رشته فعلی متصل می‌شود، و
    پیگیری‌ها را تا زمان بستن/انقضا به همان نشست مسیریابی می‌کند. Codex فقط
    وقتی این مسیر را دنبال می‌کند که ACP/acpx صریح باشد یا Plugin بومی Codex
    برای عملیات درخواستی در دسترس نباشد.

    برای `sessions_spawn`، مقدار `runtime: "acp"` فقط زمانی اعلام می‌شود که ACP
    فعال باشد، درخواست‌کننده sandbox نشده باشد، و یک backend زمان اجرای ACP
    بارگذاری شده باشد. `acp.dispatch.enabled=false` ارسال خودکار رشته ACP
    را متوقف می‌کند اما فراخوانی‌های صریح
    `sessions_spawn({ runtime: "acp" })` را پنهان یا مسدود نمی‌کند. این فراخوانی شناسه‌های چارچوب ACP مانند `codex`،
    `claude`، `droid`، `gemini`، یا `opencode` را هدف می‌گیرد. یک شناسه عامل
    عادی پیکربندی OpenClaw از `agents_list` را ارسال نکنید، مگر اینکه آن ورودی
    صراحتا با `agents.list[].runtime.type="acp"` پیکربندی شده باشد؛
    در غیر این صورت از زمان اجرای پیش‌فرض زیرعامل استفاده کنید. وقتی یک عامل OpenClaw
    با `runtime.type="acp"` پیکربندی شده باشد، OpenClaw از
    `runtime.acp.agent` به‌عنوان شناسه چارچوب زیربنایی استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## ACP در برابر زیرعامل‌ها

وقتی زمان اجرای یک چارچوب خارجی می‌خواهید، از ACP استفاده کنید. وقتی Plugin
`codex` فعال است، برای اتصال/کنترل گفت‌وگوی Codex از **Codex
app-server بومی** استفاده کنید. وقتی اجراهای واگذارشده بومی OpenClaw
می‌خواهید، از **زیرعامل‌ها** استفاده کنید.

| حوزه          | نشست ACP                           | اجرای زیرعامل                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| زمان اجرا       | Plugin backend ACP (برای مثال acpx) | زمان اجرای زیرعامل بومی OpenClaw  |
| کلید نشست   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| فرمان‌های اصلی | `/acp ...`                            | `/subagents ...`                   |
| ابزار ایجاد    | `sessions_spawn` با `runtime:"acp"` | `sessions_spawn` (زمان اجرای پیش‌فرض) |

همچنین [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

## ACP چگونه Claude Code را اجرا می‌کند

برای Claude Code از طریق ACP، پشته چنین است:

1. صفحه کنترل نشست ACP در OpenClaw.
2. Plugin زمان اجرای همراه `acpx`.
3. آداپتور Claude ACP.
4. سازوکار زمان اجرا/نشست در سمت Claude.

ACP Claude یک **نشست چارچوب** با کنترل‌های ACP، ادامه نشست،
رهگیری وظیفه پس‌زمینه، و اتصال اختیاری گفت‌وگو/رشته است.

Backendهای CLI زمان‌های اجرای fallback محلی جداگانه و فقط‌متنی هستند — ببینید
[Backendهای CLI](/fa/gateway/cli-backends).

برای اپراتورها، قاعده عملی این است:

- **`/acp spawn`، نشست‌های قابل اتصال، کنترل‌های زمان اجرا، یا کار پایدار چارچوب می‌خواهید؟** از ACP استفاده کنید.
- **fallback متنی محلی ساده از طریق CLI خام می‌خواهید؟** از backendهای CLI استفاده کنید.

## نشست‌های متصل

### مدل ذهنی

- **سطح چت** — جایی که افراد به گفت‌وگو ادامه می‌دهند (کانال Discord، موضوع Telegram، چت iMessage).
- **نشست ACP** — وضعیت پایدار زمان اجرای Codex/Claude/Gemini که OpenClaw به آن مسیریابی می‌کند.
- **رشته/موضوع فرزند** — یک سطح پیام‌رسانی اضافی اختیاری که فقط با `--thread ...` ایجاد می‌شود.
- **فضای کاری زمان اجرا** — مکان فایل‌سیستم (`cwd`، checkout مخزن، فضای کاری backend) که چارچوب در آن اجرا می‌شود. مستقل از سطح چت است.

### اتصال‌های گفت‌وگوی فعلی

`/acp spawn <harness> --bind here` گفت‌وگوی فعلی را به نشست ACP
ایجادشده pin می‌کند — بدون رشته فرزند، همان سطح چت. OpenClaw همچنان
مالک انتقال، احراز هویت، ایمنی، و تحویل می‌ماند. پیام‌های پیگیری در همان
گفت‌وگو به همان نشست مسیریابی می‌شوند؛ `/new` و `/reset` نشست را درجا
بازنشانی می‌کنند؛ `/acp close` اتصال را حذف می‌کند.

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
  <Accordion title="قواعد اتصال و انحصار">
    - `--bind here` و `--thread ...` ناسازگارند و نمی‌توانند هم‌زمان استفاده شوند.
    - `--bind here` فقط روی کانال‌هایی کار می‌کند که اتصال گفت‌وگوی فعلی را اعلام می‌کنند؛ در غیر این صورت OpenClaw پیام واضحی درباره پشتیبانی‌نشدن برمی‌گرداند. اتصال‌ها در میان restartهای Gateway پایدار می‌مانند.
    - در Discord، `spawnAcpSessions` فقط وقتی لازم است که OpenClaw نیاز داشته باشد برای `--thread auto|here` یک رشته فرزند ایجاد کند — نه برای `--bind here`.
    - اگر بدون `--cwd` به یک عامل ACP متفاوت spawn کنید، OpenClaw به‌طور پیش‌فرض فضای کاری **عامل هدف** را به ارث می‌برد. مسیرهای موروثی گمشده (`ENOENT`/`ENOTDIR`) به پیش‌فرض backend fallback می‌کنند؛ خطاهای دسترسی دیگر (مثلا `EACCES`) به‌صورت خطاهای spawn نمایش داده می‌شوند.
    - فرمان‌های مدیریت Gateway در گفت‌وگوهای متصل محلی می‌مانند — فرمان‌های `/acp ...` توسط OpenClaw پردازش می‌شوند حتی وقتی متن پیگیری عادی به نشست ACP متصل مسیریابی می‌شود؛ هرگاه پردازش فرمان برای آن سطح فعال باشد، `/status` و `/unfocus` نیز محلی می‌مانند.

  </Accordion>
  <Accordion title="نشست‌های متصل به رشته">
    وقتی اتصال‌های رشته برای یک آداپتور کانال فعال باشند:

    - OpenClaw یک رشته را به نشست ACP هدف متصل می‌کند.
    - پیام‌های پیگیری در آن رشته به نشست ACP متصل مسیریابی می‌شوند.
    - خروجی ACP به همان رشته برگردانده می‌شود.
    - unfocus/close/archive/idle-timeout یا انقضای max-age اتصال را حذف می‌کند.
    - `/acp close`، `/acp cancel`، `/acp status`، `/status`، و `/unfocus` فرمان‌های Gateway هستند، نه promptهایی برای چارچوب ACP.

    پرچم‌های ویژگی لازم برای ACP متصل به رشته:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` به‌طور پیش‌فرض روشن است (`false` تنظیم کنید تا ارسال خودکار رشته ACP متوقف شود؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند).
    - پرچم thread-spawn ACP آداپتور کانال فعال باشد (وابسته به آداپتور):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    پشتیبانی از اتصال رشته وابسته به آداپتور است. اگر آداپتور کانال فعال
    از اتصال‌های رشته پشتیبانی نکند، OpenClaw یک پیام واضح
    unsupported/unavailable برمی‌گرداند.

  </Accordion>
  <Accordion title="کانال‌های پشتیبان رشته">
    - هر آداپتور کانالی که قابلیت اتصال نشست/رشته را expose کند.
    - پشتیبانی داخلی فعلی: رشته‌ها/کانال‌های **Discord**، موضوع‌های **Telegram** (موضوع‌های forum در گروه‌ها/supergroupها و موضوع‌های DM).
    - کانال‌های Plugin می‌توانند از طریق همان رابط اتصال پشتیبانی اضافه کنند.

  </Accordion>
</AccordionGroup>

## اتصال‌های پایدار کانال

برای گردش‌کارهای غیرزودگذر، اتصال‌های پایدار ACP را در
ورودی‌های سطح‌بالای `bindings[]` پیکربندی کنید.

### مدل اتصال

<ParamField path="bindings[].type" type='"acp"'>
  یک اتصال گفت‌وگوی پایدار ACP را مشخص می‌کند.
</ParamField>
<ParamField path="bindings[].match" type="object">
  گفت‌وگوی هدف را شناسایی می‌کند. شکل‌های هر کانال:

- **کانال/رشته Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **موضوع forum در Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/گروه BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های پایدار گروهی، `chat_id:*` یا `chat_identifier:*` را ترجیح دهید.
- **DM/گروه iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های پایدار گروهی، `chat_id:*` را ترجیح دهید.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  شناسه عامل OpenClaw مالک.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  بازنویسی اختیاری ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  برچسب اختیاری روبه‌اپراتور.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  دایرکتوری کاری اختیاری زمان اجرا.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  بازنویسی اختیاری backend.
</ParamField>

### پیش‌فرض‌های زمان اجرا برای هر عامل

از `agents.list[].runtime` برای تعریف پیش‌فرض‌های ACP، یک‌بار برای هر عامل استفاده کنید:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (شناسه چارچوب، مثلا `codex` یا `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**اولویت بازنویسی برای نشست‌های متصل ACP:**

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

- OpenClaw پیش از استفاده مطمئن می‌شود نشست ACP پیکربندی‌شده وجود دارد.
- پیام‌ها در آن کانال یا موضوع به نشست ACP پیکربندی‌شده مسیریابی می‌شوند.
- در گفت‌وگوهای متصل، `/new` و `/reset` همان کلید نشست ACP را درجا بازنشانی می‌کنند.
- اتصال‌های موقت زمان اجرا (برای مثال اتصال‌هایی که با جریان‌های thread-focus ایجاد شده‌اند) همچنان در محل حضور اعمال می‌شوند.
- برای spawnهای ACP میان‌عاملی بدون `cwd` صریح، OpenClaw فضای کاری عامل هدف را از پیکربندی عامل به ارث می‌برد.
- مسیرهای فضای کاری موروثی گمشده به cwd پیش‌فرض backend fallback می‌کنند؛ خطاهای دسترسی برای مسیرهای موجود به‌صورت خطاهای spawn نمایش داده می‌شوند.

## شروع نشست‌های ACP

دو راه برای شروع یک نشست ACP وجود دارد:

<Tabs>
  <Tab title="از sessions_spawn">
    از `runtime: "acp"` برای شروع یک نشست ACP از turn عامل یا
    فراخوانی ابزار استفاده کنید.

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
    `runtime` به‌طور پیش‌فرض `subagent` است، پس برای نشست‌های ACP به‌صورت صریح
    `runtime: "acp"` را تنظیم کنید. اگر `agentId` حذف شود، OpenClaw در صورت
    پیکربندی‌شدن از `acp.defaultAgent` استفاده می‌کند. `mode: "session"` به
    `thread: true` نیاز دارد تا یک گفت‌وگوی متصل و پایدار حفظ شود.
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

    [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

  </Tab>
</Tabs>

### پارامترهای `sessions_spawn`

<ParamField path="task" type="string" required>
  اعلان اولیه‌ای که به نشست ACP ارسال می‌شود.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  برای نشست‌های ACP باید `"acp"` باشد.
</ParamField>
<ParamField path="agentId" type="string">
  شناسه هارنس هدف ACP. اگر `acp.defaultAgent` تنظیم شده باشد، به آن برمی‌گردد.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  جریان اتصال thread را در جاهایی که پشتیبانی می‌شود درخواست می‌کند.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` یک‌باره است؛ `"session"` پایدار است. اگر `thread: true` باشد و
  `mode` حذف شود، OpenClaw ممکن است بر اساس مسیر runtime به‌طور پیش‌فرض رفتار
  پایدار را انتخاب کند. `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cwd" type="string">
  دایرکتوری کاری runtime درخواستی (بر اساس سیاست backend/runtime اعتبارسنجی
  می‌شود). اگر حذف شود، ACP spawn در صورت پیکربندی‌شدن، workspace عامل هدف را
  به ارث می‌برد؛ مسیرهای ارث‌بری‌شده ناموجود به پیش‌فرض‌های backend برمی‌گردند،
  در حالی‌که خطاهای واقعی دسترسی برگردانده می‌شوند.
</ParamField>
<ParamField path="label" type="string">
  برچسب روبه‌روی اپراتور که در متن نشست/بنر استفاده می‌شود.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  به‌جای ایجاد نشست جدید، یک نشست ACP موجود را از سر می‌گیرد. عامل تاریخچه
  گفت‌وگوی خود را از طریق `session/load` بازپخش می‌کند. به `runtime: "acp"`
  نیاز دارد.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` خلاصه‌های پیشرفت اجرای اولیه ACP را به‌صورت رویدادهای سیستمی به
  نشست درخواست‌کننده بازپخش می‌کند. پاسخ‌های پذیرفته‌شده شامل `streamLogPath`
  هستند که به یک گزارش JSONL در محدوده نشست اشاره می‌کند
  (`<sessionId>.acp-stream.jsonl`) و می‌توانید برای تاریخچه کامل رله آن را tail کنید.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  نوبت فرزند ACP را پس از N ثانیه لغو می‌کند. `0` نوبت را در مسیر بدون timeout
  Gateway نگه می‌دارد. همان مقدار روی اجرای Gateway و runtime ACP اعمال می‌شود
  تا هارنس‌های متوقف‌شده یا تمام‌شده از نظر سهمیه، مسیر عامل والد را به‌طور
  نامحدود اشغال نکنند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی صریح مدل برای نشست فرزند ACP. ACP spawn های Codex ارجاع‌های Codex
  در OpenClaw مانند `openai-codex/gpt-5.4` را پیش از `session/new` به پیکربندی
  شروع ACP در Codex نرمال‌سازی می‌کنند؛ فرم‌های اسلش مانند
  `openai-codex/gpt-5.4/high` همچنین تلاش استدلالی ACP در Codex را تنظیم می‌کنند.
  هارنس‌های دیگر باید `models` در ACP را اعلام کنند و از `session/set_model`
  پشتیبانی کنند؛ در غیر این صورت OpenClaw/acpx به‌جای برگشت بی‌صدا به پیش‌فرض
  عامل هدف، با خطای روشن شکست می‌خورد.
</ParamField>
<ParamField path="thinking" type="string">
  تلاش صریح تفکر/استدلال. برای ACP در Codex، `minimal` به تلاش کم نگاشت می‌شود،
  `low`/`medium`/`high`/`xhigh` مستقیما نگاشت می‌شوند، و `off` بازنویسی شروع
  تلاش استدلالی را حذف می‌کند.
</ParamField>

## حالت‌های اتصال spawn و thread

<Tabs>
  <Tab title="--bind here|off">
    | حالت   | رفتار                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | گفت‌وگوی فعال فعلی را در همان‌جا متصل می‌کند؛ اگر هیچ‌کدام فعال نباشد شکست می‌خورد. |
    | `off`  | اتصال گفت‌وگوی فعلی ایجاد نمی‌کند.                          |

    نکات:

    - `--bind here` ساده‌ترین مسیر اپراتور برای «این کانال یا چت را با پشتوانه Codex کن» است.
    - `--bind here` یک thread فرزند ایجاد نمی‌کند.
    - `--bind here` فقط در کانال‌هایی در دسترس است که پشتیبانی از اتصال گفت‌وگوی فعلی را ارائه می‌کنند.
    - `--bind` و `--thread` را نمی‌توان در یک فراخوانی `/acp spawn` با هم ترکیب کرد.

  </Tab>
  <Tab title="--thread auto|here|off">
    | حالت   | رفتار                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | در یک thread فعال: همان thread را متصل می‌کند. بیرون از thread: در صورت پشتیبانی، یک thread فرزند ایجاد/متصل می‌کند. |
    | `here` | وجود thread فعال فعلی را الزامی می‌کند؛ اگر داخل یکی نباشد شکست می‌خورد.                                                  |
    | `off`  | بدون اتصال. نشست بدون اتصال شروع می‌شود.                                                                 |

    نکات:

    - روی سطح‌هایی که اتصال thread ندارند، رفتار پیش‌فرض عملا `off` است.
    - spawn متصل به thread به پشتیبانی سیاست کانال نیاز دارد:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - وقتی می‌خواهید گفت‌وگوی فعلی را بدون ایجاد thread فرزند ثابت کنید، از `--bind here` استفاده کنید.

  </Tab>
</Tabs>

## مدل تحویل

نشست‌های ACP می‌توانند workspace های تعاملی یا کار پس‌زمینه تحت مالکیت والد
باشند. مسیر تحویل به این شکل بستگی دارد.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    نشست‌های تعاملی برای ادامه گفت‌وگو روی یک سطح چت قابل‌مشاهده هستند:

    - `/acp spawn ... --bind here` گفت‌وگوی فعلی را به نشست ACP متصل می‌کند.
    - `/acp spawn ... --thread ...` یک thread/topic کانال را به نشست ACP متصل می‌کند.
    - `bindings[].type="acp"` پیکربندی‌شده و پایدار، گفت‌وگوهای مطابق را به همان نشست ACP مسیر‌دهی می‌کند.

    پیام‌های بعدی در گفت‌وگوی متصل مستقیما به نشست ACP مسیر‌دهی می‌شوند، و
    خروجی ACP به همان channel/thread/topic بازتحویل داده می‌شود.

    آنچه OpenClaw به هارنس می‌فرستد:

    - پیگیری‌های عادی متصل به‌صورت متن اعلان ارسال می‌شوند، همراه با پیوست‌ها فقط وقتی هارنس/backend از آن‌ها پشتیبانی کند.
    - دستورهای مدیریتی `/acp` و دستورهای محلی Gateway پیش از ارسال به ACP رهگیری می‌شوند.
    - رویدادهای تکمیل تولیدشده توسط runtime برای هر هدف مادی‌سازی می‌شوند. عامل‌های OpenClaw پاکت runtime-context داخلی OpenClaw را دریافت می‌کنند؛ هارنس‌های ACP خارجی یک اعلان ساده همراه با نتیجه فرزند و دستورالعمل دریافت می‌کنند. پاکت خام `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` هرگز نباید به هارنس‌های خارجی ارسال شود یا به‌عنوان متن transcript کاربر ACP پایدار شود.
    - ورودی‌های transcript در ACP از متن trigger قابل‌مشاهده برای کاربر یا اعلان تکمیل ساده استفاده می‌کنند. فراداده رویداد داخلی تا حد امکان به‌صورت ساختاریافته در OpenClaw می‌ماند و به‌عنوان محتوای چت نوشته‌شده توسط کاربر در نظر گرفته نمی‌شود.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    نشست‌های ACP یک‌باره که توسط اجرای عامل دیگری spawn می‌شوند، فرزندان
    پس‌زمینه هستند، شبیه sub-agent ها:

    - والد با `sessions_spawn({ runtime: "acp", mode: "run" })` درخواست کار می‌کند.
    - فرزند در نشست هارنس ACP خودش اجرا می‌شود.
    - نوبت‌های فرزند روی همان مسیر پس‌زمینه‌ای اجرا می‌شوند که spawn های sub-agent بومی استفاده می‌کنند، بنابراین یک هارنس ACP کند کار نامرتبط نشست اصلی را مسدود نمی‌کند.
    - گزارش تکمیل از طریق مسیر اعلام تکمیل کار برمی‌گردد. OpenClaw پیش از ارسال به یک هارنس خارجی، فراداده تکمیل داخلی را به یک اعلان ACP ساده تبدیل می‌کند، بنابراین هارنس‌ها نشانگرهای runtime context مخصوص OpenClaw را نمی‌بینند.
    - والد وقتی پاسخ روبه‌روی کاربر مفید باشد، نتیجه فرزند را با صدای عادی assistant بازنویسی می‌کند.

    این مسیر را به‌عنوان چت همتا‌به‌همتا بین والد و فرزند در نظر **نگیرید**.
    فرزند از قبل یک کانال تکمیل به سمت والد دارد.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` می‌تواند پس از spawn نشست دیگری را هدف بگیرد. برای نشست‌های
    همتای عادی، OpenClaw پس از تزریق پیام از یک مسیر پیگیری عامل‌به‌عامل (A2A)
    استفاده می‌کند:

    - منتظر پاسخ نشست هدف بمانید.
    - به‌صورت اختیاری اجازه دهید درخواست‌کننده و هدف تعداد محدودی نوبت پیگیری ردوبدل کنند.
    - از هدف بخواهید یک پیام اعلام تولید کند.
    - آن اعلام را به کانال یا thread قابل‌مشاهده تحویل دهید.

    آن مسیر A2A برای ارسال‌های همتا که فرستنده در آن‌ها به یک پیگیری
    قابل‌مشاهده نیاز دارد، یک fallback است. وقتی یک نشست نامرتبط بتواند یک هدف
    ACP را ببیند و به آن پیام بدهد، مثلا تحت تنظیمات گسترده
    `tools.sessions.visibility`، فعال می‌ماند.

    OpenClaw فقط وقتی پیگیری A2A را رد می‌کند که درخواست‌کننده والد فرزند ACP
    یک‌باره تحت مالکیت والد خودش باشد. در آن حالت، اجرای A2A روی تکمیل کار
    می‌تواند والد را با نتیجه فرزند بیدار کند، پاسخ والد را دوباره به فرزند
    بفرستد، و یک حلقه پژواک والد/فرزند ایجاد کند. نتیجه `sessions_send` برای
    این حالت فرزندِ تحت مالکیت `delivery.status="skipped"` را گزارش می‌کند،
    چون مسیر تکمیل از قبل مسئول نتیجه است.

  </Accordion>
  <Accordion title="Resume an existing session">
    برای ادامه یک نشست ACP قبلی به‌جای شروع تازه، از `resumeSessionId` استفاده
    کنید. عامل تاریخچه گفت‌وگوی خود را از طریق `session/load` بازپخش می‌کند،
    بنابراین با زمینه کامل آنچه قبل‌تر آمده ادامه می‌دهد.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    موارد استفاده رایج:

    - یک نشست Codex را از لپ‌تاپ به گوشی خود واگذار کنید — به عامل خود بگویید از همان‌جایی که رها کردید ادامه دهد.
    - یک نشست کدنویسی را که به‌صورت تعاملی در CLI شروع کرده‌اید، اکنون به‌صورت headless از طریق عامل خود ادامه دهید.
    - کاری را که با راه‌اندازی مجدد gateway یا timeout بیکاری قطع شده بود ادامه دهید.

    نکات:

    - `resumeSessionId` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض sub-agent این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `streamTo` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض sub-agent این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `resumeSessionId` یک شناسه ازسرگیری ACP/harness محلی میزبان است، نه کلید نشست کانال OpenClaw؛ OpenClaw همچنان پیش از dispatch، سیاست ACP spawn و سیاست عامل هدف را بررسی می‌کند، در حالی‌که backend یا هارنس ACP مالک مجوزدهی برای بارگذاری آن شناسه upstream است.
    - `resumeSessionId` تاریخچه گفت‌وگوی ACP upstream را بازیابی می‌کند؛ `thread` و `mode` همچنان به‌طور عادی روی نشست جدید OpenClaw که ایجاد می‌کنید اعمال می‌شوند، پس `mode: "session"` همچنان به `thread: true` نیاز دارد.
    - عامل هدف باید از `session/load` پشتیبانی کند (Codex و Claude Code پشتیبانی می‌کنند).
    - اگر شناسه نشست پیدا نشود، spawn با خطایی روشن شکست می‌خورد — بدون fallback بی‌صدا به یک نشست جدید.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    پس از استقرار gateway، به‌جای اعتماد به تست‌های واحد، یک بررسی زنده end-to-end
    اجرا کنید:

    1. نسخه و commit gateway مستقرشده را روی میزبان هدف بررسی کنید.
    2. یک نشست موقت پل ACPX به یک عامل زنده باز کنید.
    3. از آن عامل بخواهید `sessions_spawn` را با `runtime: "acp"`، `agentId: "codex"`، `mode: "run"`، و task با مقدار `Reply with exactly LIVE-ACP-SPAWN-OK` فراخوانی کند.
    4. `accepted=yes`، یک `childSessionKey` واقعی، و نبود خطای validator را بررسی کنید.
    5. نشست موقت پل را پاک‌سازی کنید.

    gate را روی `mode: "run"` نگه دارید و `streamTo: "parent"` را رد کنید —
    `mode: "session"` متصل به thread و مسیرهای stream-relay گذرهای یکپارچه‌سازی
    جداگانه و غنی‌تری هستند.

  </Accordion>
</AccordionGroup>

## سازگاری sandbox

نشست‌های ACP در حال حاضر روی runtime میزبان اجرا می‌شوند، **نه** داخل
sandbox OpenClaw.

<Warning>
**مرز امنیتی:**

- هارنس خارجی می‌تواند مطابق مجوزهای CLI خودش و `cwd` انتخاب‌شده بخواند/بنویسد.
- سیاست sandbox در OpenClaw اجرای هارنس ACP را **دربر نمی‌گیرد**.
- OpenClaw همچنان دروازه‌های قابلیت ACP، عامل‌های مجاز، مالکیت نشست، اتصال‌های کانال، و سیاست تحویل Gateway را اعمال می‌کند.
- برای کار بومی OpenClaw با اعمال sandbox از `runtime: "subagent"` استفاده کنید.

</Warning>

محدودیت‌های فعلی:

- اگر نشست درخواست‌دهنده در sandbox باشد، ایجاد ACP هم برای `sessions_spawn({ runtime: "acp" })` و هم برای `/acp spawn` مسدود می‌شود.
- `sessions_spawn` با `runtime: "acp"` از `sandbox: "require"` پشتیبانی نمی‌کند.

## تعیین هدف نشست

بیشتر کنش‌های `/acp` یک هدف نشست اختیاری (`session-key`،
`session-id`، یا `session-label`) می‌پذیرند.

**ترتیب تعیین:**

1. آرگومان هدف صریح (یا `--session` برای `/acp steer`)
   - ابتدا کلید را امتحان می‌کند
   - سپس شناسه نشست با شکل UUID
   - سپس برچسب
2. اتصال رشته جاری (اگر این مکالمه/رشته به یک نشست ACP متصل باشد).
3. بازگشت به نشست درخواست‌دهنده جاری.

اتصال‌های مکالمه جاری و اتصال‌های رشته هر دو در
گام 2 مشارکت می‌کنند.

اگر هیچ هدفی تعیین نشود، OpenClaw خطایی روشن برمی‌گرداند
(`Unable to resolve session target: ...`).

## کنترل‌های ACP

| فرمان                | کارکرد                                                     | مثال                                                          |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | نشست ACP ایجاد می‌کند؛ با اتصال اختیاری جاری یا اتصال رشته. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | نوبت در حال اجرا را برای نشست هدف لغو می‌کند.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | دستور هدایت را به نشست در حال اجرا می‌فرستد.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | نشست را می‌بندد و اتصال هدف‌های رشته را قطع می‌کند.        | `/acp close`                                                  |
| `/acp status`        | بک‌اند، حالت، وضعیت، گزینه‌های زمان اجرا، قابلیت‌ها را نشان می‌دهد. | `/acp status`                                                 |
| `/acp set-mode`      | حالت زمان اجرا را برای نشست هدف تنظیم می‌کند.              | `/acp set-mode plan`                                          |
| `/acp set`           | گزینه پیکربندی عمومی زمان اجرا را می‌نویسد.                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | بازنویسی مسیر کاری زمان اجرا را تنظیم می‌کند.              | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | نمایه سیاست تأیید را تنظیم می‌کند.                         | `/acp permissions strict`                                     |
| `/acp timeout`       | زمان پایان مهلت زمان اجرا را تنظیم می‌کند (ثانیه).         | `/acp timeout 120`                                            |
| `/acp model`         | بازنویسی مدل زمان اجرا را تنظیم می‌کند.                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | بازنویسی‌های گزینه زمان اجرای نشست را حذف می‌کند.          | `/acp reset-options`                                          |
| `/acp sessions`      | نشست‌های اخیر ACP را از ذخیره‌گاه فهرست می‌کند.            | `/acp sessions`                                               |
| `/acp doctor`        | سلامت بک‌اند، قابلیت‌ها، و اصلاحات قابل اقدام را نشان می‌دهد. | `/acp doctor`                                                 |
| `/acp install`       | گام‌های نصب و فعال‌سازی قطعی را چاپ می‌کند.                | `/acp install`                                                |

`/acp status` گزینه‌های مؤثر زمان اجرا به‌همراه شناسه‌های نشست در سطح زمان اجرا و
سطح بک‌اند را نشان می‌دهد. خطاهای کنترل پشتیبانی‌نشده وقتی یک بک‌اند قابلیتی ندارد
به‌روشنی نمایش داده می‌شوند. `/acp sessions` ذخیره‌گاه نشست متصل جاری یا نشست درخواست‌دهنده را می‌خواند؛ توکن‌های هدف
(`session-key`، `session-id`، یا `session-label`) از طریق کشف نشست gateway تعیین می‌شوند، از جمله ریشه‌های سفارشی `session.store` برای هر عامل.

### نگاشت گزینه‌های زمان اجرا

`/acp` فرمان‌های میان‌بر و یک تنظیم‌کننده عمومی دارد. عملیات معادل:

| فرمان                        | نگاشت می‌شود به                       | یادداشت‌ها                                                                                                                                                                     |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | کلید پیکربندی زمان اجرا `model`       | برای Codex ACP، OpenClaw مقدار `openai-codex/<model>` را به شناسه مدل آداپتور نرمال‌سازی می‌کند و پسوندهای استدلالی اسلش‌دار مانند `openai-codex/gpt-5.4/high` را به `reasoning_effort` نگاشت می‌کند. |
| `/acp set thinking <level>`  | کلید پیکربندی زمان اجرا `thinking`    | برای Codex ACP، OpenClaw در جایی که آداپتور پشتیبانی کند مقدار متناظر `reasoning_effort` را می‌فرستد.                                                                        |
| `/acp permissions <profile>` | کلید پیکربندی زمان اجرا `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | کلید پیکربندی زمان اجرا `timeout`     | —                                                                                                                                                                              |
| `/acp cwd <path>`            | بازنویسی cwd زمان اجرا                | به‌روزرسانی مستقیم.                                                                                                                                                           |
| `/acp set <key> <value>`     | عمومی                                 | `key=cwd` از مسیر بازنویسی cwd استفاده می‌کند.                                                                                                                                |
| `/acp reset-options`         | همه بازنویسی‌های زمان اجرا را پاک می‌کند | —                                                                                                                                                                              |

## هارنس acpx، راه‌اندازی Plugin، و مجوزها

برای پیکربندی هارنس acpx (نام‌های مستعار Claude Code / Codex / Gemini CLI)،
پل‌های MCP مربوط به plugin-tools و OpenClaw-tools، و حالت‌های مجوز ACP، ببینید:
[عامل‌های ACP — راه‌اندازی](/fa/tools/acp-agents-setup).

## عیب‌یابی

| نشانه                                                                      | علت محتمل                                                                                                             | رفع مشکل                                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin بک‌اند وجود ندارد، غیرفعال است، یا توسط `plugins.allow` مسدود شده است.                                         | Plugin بک‌اند را نصب و فعال کنید، وقتی این فهرست مجاز تنظیم شده است `acpx` را در `plugins.allow` بگنجانید، سپس `/acp doctor` را اجرا کنید.                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP به‌صورت سراسری غیرفعال است.                                                                                       | `acp.enabled=true` را تنظیم کنید.                                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | ارسال خودکار از پیام‌های عادی رشته غیرفعال شده است.                                                                    | برای ازسرگیری مسیریابی خودکار رشته، `acp.dispatch.enabled=true` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند.                                |
| `ACP agent "<id>" is not allowed by policy`                                 | عامل در فهرست مجاز نیست.                                                                                              | از `agentId` مجاز استفاده کنید یا `acp.allowedAgents` را به‌روزرسانی کنید.                                                                                                                |
| `/acp doctor` reports backend not ready right after startup                 | بررسی وابستگی Plugin یا خودترمیمی هنوز در حال اجرا است.                                                               | کمی صبر کنید و دوباره `/acp doctor` را اجرا کنید؛ اگر همچنان ناسالم ماند، خطای نصب بک‌اند و سیاست مجاز/ممنوع Plugin را بررسی کنید.                                                     |
| Harness command not found                                                   | CLI آداپتر نصب نشده است، وابستگی‌های Plugin آماده‌سازی‌شده وجود ندارند، یا دریافت `npx` در اجرای اول برای یک آداپتر غیر Codex شکست خورده است. | `/acp doctor` را اجرا کنید، وابستگی‌های Plugin را تعمیر کنید، آداپتر را روی میزبان Gateway نصب/پیش‌گرم کنید، یا فرمان عامل acpx را صریح پیکربندی کنید.                                  |
| Model-not-found from the harness                                            | شناسه مدل برای ارائه‌دهنده/هارنس دیگری معتبر است اما برای این هدف ACP معتبر نیست.                                    | از مدلی که همان هارنس فهرست کرده است استفاده کنید، مدل را در هارنس پیکربندی کنید، یا override را حذف کنید.                                                                              |
| Vendor auth error from the harness                                          | OpenClaw سالم است، اما CLI/ارائه‌دهنده هدف وارد نشده است.                                                             | وارد شوید یا کلید ارائه‌دهنده لازم را در محیط میزبان Gateway فراهم کنید.                                                                                                                 |
| `Unable to resolve session target: ...`                                     | توکن کلید/شناسه/برچسب نادرست است.                                                                                     | `/acp sessions` را اجرا کنید، کلید/برچسب دقیق را کپی کنید و دوباره تلاش کنید.                                                                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` بدون یک گفت‌وگوی فعال قابل اتصال استفاده شده است.                                                       | به چت/کانال هدف بروید و دوباره تلاش کنید، یا spawn بدون اتصال استفاده کنید.                                                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | آداپتر قابلیت اتصال ACP برای گفت‌وگوی فعلی را ندارد.                                                                  | در صورت پشتیبانی، از `/acp spawn ... --thread ...` استفاده کنید، `bindings[]` سطح بالا را پیکربندی کنید، یا به یک کانال پشتیبانی‌شده بروید.                                            |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` خارج از زمینه رشته استفاده شده است.                                                                   | به رشته هدف بروید یا از `--thread auto`/`off` استفاده کنید.                                                                                                                              |
| `Only <user-id> can rebind this channel/conversation/thread.`               | کاربر دیگری مالک هدف اتصال فعال است.                                                                                  | به‌عنوان مالک دوباره متصل کنید یا از گفت‌وگو یا رشته دیگری استفاده کنید.                                                                                                                 |
| `Thread bindings are unavailable for <channel>.`                            | آداپتر قابلیت اتصال رشته را ندارد.                                                                                    | از `--thread off` استفاده کنید یا به آداپتر/کانال پشتیبانی‌شده بروید.                                                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | runtime ACP سمت میزبان است؛ نشست درخواست‌کننده sandbox شده است.                                                       | از نشست‌های sandbox شده، `runtime="subagent"` را استفاده کنید، یا ACP spawn را از یک نشست غیر sandbox شده اجرا کنید.                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` برای runtime ACP درخواست شده است.                                                                  | برای sandbox اجباری از `runtime="subagent"` استفاده کنید، یا ACP را با `sandbox="inherit"` از یک نشست غیر sandbox شده به‌کار ببرید.                                                     |
| `Cannot apply --model ... did not advertise model support`                  | هارنس هدف تعویض مدل عمومی ACP را در دسترس نمی‌گذارد.                                                                  | از هارنسی استفاده کنید که ACP `models`/`session/set_model` را اعلام می‌کند، از مرجع‌های مدل ACP در Codex استفاده کنید، یا اگر هارنس پرچم راه‌اندازی خودش را دارد، مدل را مستقیما در هارنس پیکربندی کنید. |
| Missing ACP metadata for bound session                                      | فراداده نشست ACP کهنه/حذف شده است.                                                                                    | با `/acp spawn` دوباره ایجاد کنید، سپس رشته را دوباره متصل/متمرکز کنید.                                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` نوشتن/اجرا را در نشست ACP غیرتعاملی مسدود می‌کند.                                                    | `plugins.entries.acpx.config.permissionMode` را روی `approve-all` تنظیم کنید و Gateway را بازراه‌اندازی کنید. [پیکربندی مجوز](/fa/tools/acp-agents-setup#permission-configuration) را ببینید. |
| ACP session fails early with little output                                  | اعلان‌های مجوز توسط `permissionMode`/`nonInteractivePermissions` مسدود شده‌اند.                                       | لاگ‌های gateway را برای `AcpRuntimeError` بررسی کنید. برای مجوزهای کامل، `permissionMode=approve-all` را تنظیم کنید؛ برای افت کارکرد کنترل‌شده، `nonInteractivePermissions=deny` را تنظیم کنید. |
| ACP session stalls indefinitely after completing work                       | فرایند هارنس پایان یافته، اما نشست ACP تکمیل را گزارش نکرده است.                                                     | با `ps aux \| grep acpx` پایش کنید؛ فرایندهای کهنه را دستی بکشید.                                                                                                                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | پوشش رویداد داخلی از مرز ACP نشت کرده است.                                                                            | OpenClaw را به‌روزرسانی کنید و جریان تکمیل را دوباره اجرا کنید؛ هارنس‌های خارجی باید فقط پرامپت‌های تکمیل ساده دریافت کنند.                                                            |

## مرتبط

- [عامل‌های ACP — راه‌اندازی](/fa/tools/acp-agents-setup)
- [ارسال عامل](/fa/tools/agent-send)
- [بک‌اندهای CLI](/fa/gateway/cli-backends)
- [هارنس Codex](/fa/plugins/codex-harness)
- [ابزارهای sandbox چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (حالت پل)](/fa/cli/acp)
- [عامل‌های فرعی](/fa/tools/subagents)
