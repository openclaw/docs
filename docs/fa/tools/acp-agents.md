---
read_when:
    - اجرای هارنس‌های کدنویسی از طریق ACP
    - راه‌اندازی نشست‌های ACP وابسته به مکالمه در کانال‌های پیام‌رسانی
    - پیوند دادن یک مکالمهٔ کانال پیام به یک نشست پایدار ACP
    - عیب‌یابی بک‌اند ACP، سیم‌کشی Plugin، یا تحویل تکمیل
    - اجرای دستورهای ‎/acp از چت
sidebarTitle: ACP agents
summary: اجرای هارنس‌های کدنویسی خارجی (Claude Code، Cursor، Gemini CLI، Codex ACP صریح، OpenClaw ACP، OpenCode) از طریق بک‌اند ACP
title: عامل‌های ACP
x-i18n:
    generated_at: "2026-06-30T14:19:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

نشست‌های [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
به OpenClaw اجازه می‌دهند ابزارهای کدنویسی خارجی (برای مثال Claude Code،
Cursor، Copilot، Droid، OpenClaw ACP، OpenCode، Gemini CLI و دیگر ابزارهای
ACPX پشتیبانی‌شده) را از طریق یک Plugin پشتیبان ACP اجرا کند.

هر ایجاد نشست ACP به‌عنوان یک [وظیفه پس‌زمینه](/fa/automation/tasks) ردیابی می‌شود.

<Note>
**ACP مسیر ابزار خارجی است، نه مسیر پیش‌فرض Codex.** Plugin بومی app-server
برای Codex کنترل‌های `/codex ...` و runtime توکار پیش‌فرض `openai/gpt-*`
را برای نوبت‌های عامل در اختیار دارد؛ ACP کنترل‌های `/acp ...` و نشست‌های
`sessions_spawn({ runtime: "acp" })` را در اختیار دارد.

اگر می‌خواهید Codex یا Claude Code به‌عنوان یک کلاینت MCP خارجی مستقیماً
به گفت‌وگوهای کانال موجود OpenClaw وصل شود، به‌جای ACP از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.
</Note>

## کدام صفحه را می‌خواهم؟

| می‌خواهید…                                                                                     | از این استفاده کنید                    | یادداشت‌ها                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex را در گفت‌وگوی فعلی متصل یا کنترل کنید                                                    | `/codex bind`, `/codex threads`         | مسیر بومی app-server برای Codex وقتی Plugin `codex` فعال است؛ شامل پاسخ‌های چت متصل، ارسال تصویر، مدل/سریع/مجوزها، توقف و کنترل‌های هدایت. ACP یک fallback صریح است |
| Claude Code، Gemini CLI، Codex ACP صریح، یا ابزار خارجی دیگری را _از طریق_ OpenClaw اجرا کنید | این صفحه                                | نشست‌های متصل به چت، `/acp spawn`، `sessions_spawn({ runtime: "acp" })`، وظایف پس‌زمینه، کنترل‌های runtime                                                                                         |
| یک نشست OpenClaw Gateway را _به‌عنوان_ سرور ACP برای یک ویرایشگر یا کلاینت در معرض بگذارید       | [`openclaw acp`](/fa/cli/acp)              | حالت پل. IDE/کلاینت از طریق stdio/WebSocket با ACP به OpenClaw صحبت می‌کند                                                                                                                         |
| یک CLI هوش مصنوعی محلی را به‌عنوان مدل fallback فقط متنی دوباره استفاده کنید                   | [پشتیبان‌های CLI](/fa/gateway/cli-backends) | ACP نیست. بدون ابزارهای OpenClaw، بدون کنترل‌های ACP، بدون runtime ابزار                                                                                                                           |

## آیا این از ابتدا کار می‌کند؟

بله، پس از نصب Plugin رسمی runtime برای ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

checkoutهای منبع می‌توانند پس از `pnpm install` از Plugin workspace محلی
`extensions/acpx` استفاده کنند. برای بررسی آمادگی، `/acp doctor` را اجرا کنید.

OpenClaw فقط زمانی عامل‌ها را با ایجاد ACP آشنا می‌کند که ACP **واقعاً
قابل استفاده** باشد: ACP باید فعال باشد، dispatch نباید غیرفعال شده باشد،
نشست فعلی نباید توسط sandbox مسدود شده باشد، و یک پشتیبان runtime باید
بارگذاری شده باشد. اگر این شرایط برقرار نباشند، Skills مربوط به Plugin ACP
و راهنمای ACP در `sessions_spawn` پنهان می‌مانند تا عامل یک پشتیبان
غیرقابل‌دسترس را پیشنهاد نکند.

<AccordionGroup>
  <Accordion title="نکات رایج در اجرای نخست">
    - اگر `plugins.allow` تنظیم شده باشد، یک فهرست محدودکننده Plugin است و **باید** شامل `acpx` باشد؛ در غیر این صورت پشتیبان ACP نصب‌شده عمداً مسدود می‌شود و `/acp doctor` ورودی گم‌شده allowlist را گزارش می‌کند.
    - آداپتور Codex ACP همراه Plugin `acpx` آماده‌سازی می‌شود و در صورت امکان به‌صورت محلی اجرا می‌شود.
    - Codex ACP با یک `CODEX_HOME` ایزوله اجرا می‌شود؛ OpenClaw ورودی‌های پروژه مورداعتماد به‌همراه پیکربندی امن مسیریابی مدل/ارائه‌دهنده را از پیکربندی Codex میزبان کپی می‌کند، در حالی که احراز هویت، اعلان‌ها و hookها روی پیکربندی میزبان باقی می‌مانند.
    - سایر آداپتورهای ابزار هدف ممکن است همچنان نخستین بار که از آن‌ها استفاده می‌کنید، بنا به نیاز با `npx` دریافت شوند.
    - احراز هویت فروشنده همچنان باید روی میزبان برای آن ابزار وجود داشته باشد.
    - اگر میزبان npm یا دسترسی شبکه نداشته باشد، دریافت‌های آداپتور در اجرای نخست تا زمانی که cacheها از قبل آماده شوند یا آداپتور به روش دیگری نصب شود، شکست می‌خورند.

  </Accordion>
  <Accordion title="پیش‌نیازهای runtime">
    ACP یک فرایند ابزار خارجی واقعی را اجرا می‌کند. OpenClaw مالک مسیریابی،
    وضعیت وظیفه پس‌زمینه، تحویل، اتصال‌ها و policy است؛ ابزار مالک ورود
    ارائه‌دهنده، کاتالوگ مدل، رفتار فایل‌سیستم و ابزارهای بومی خودش است.

    پیش از مقصر دانستن OpenClaw، بررسی کنید:

    - `/acp doctor` یک پشتیبان فعال و سالم را گزارش می‌کند.
    - وقتی allowlist مربوطه تنظیم شده است، شناسه هدف توسط `acp.allowedAgents` مجاز باشد.
    - فرمان ابزار بتواند روی میزبان Gateway شروع شود.
    - احراز هویت ارائه‌دهنده برای آن ابزار حاضر باشد (`claude`, `codex`, `gemini`, `opencode`, `droid`, و غیره).
    - مدل انتخاب‌شده برای آن ابزار وجود داشته باشد - شناسه‌های مدل میان ابزارها قابل انتقال نیستند.
    - `cwd` درخواست‌شده وجود داشته باشد و قابل دسترسی باشد، یا `cwd` را حذف کنید و اجازه دهید پشتیبان از پیش‌فرض خودش استفاده کند.
    - حالت مجوز با کار هماهنگ باشد. نشست‌های غیرتعاملی نمی‌توانند روی promptهای مجوز بومی کلیک کنند، بنابراین اجراهای کدنویسی با نوشتن/اجرای زیاد معمولاً به یک پروفایل مجوز ACPX نیاز دارند که بتواند بدون رابط تعاملی ادامه دهد.

  </Accordion>
</AccordionGroup>

ابزارهای Plugin در OpenClaw و ابزارهای داخلی OpenClaw به‌صورت پیش‌فرض در
اختیار ابزارهای ACP قرار نمی‌گیرند. فقط زمانی پل‌های MCP صریح را در
[عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup) فعال کنید که ابزار
باید مستقیماً آن ابزارها را فراخوانی کند.

## اهداف ابزار پشتیبانی‌شده

با پشتیبان `acpx`، از این شناسه‌های ابزار به‌عنوان هدف‌های `/acp spawn <id>`
یا `sessions_spawn({ runtime: "acp", agentId: "<id>" })` استفاده کنید:

| شناسه ابزار | پشتیبان معمول                                  | یادداشت‌ها                                                                           |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `claude`     | آداپتور Claude Code ACP                        | به احراز هویت Claude Code روی میزبان نیاز دارد.                                      |
| `codex`      | آداپتور Codex ACP                              | فقط fallback صریح ACP وقتی `/codex` بومی در دسترس نیست یا ACP درخواست شده است.      |
| `copilot`    | آداپتور GitHub Copilot ACP                     | به احراز هویت Copilot CLI/runtime نیاز دارد.                                         |
| `cursor`     | Cursor CLI ACP (`cursor-agent acp`)            | اگر نصب محلی entrypoint متفاوتی برای ACP ارائه می‌دهد، فرمان acpx را override کنید. |
| `droid`      | Factory Droid CLI                              | به احراز هویت Factory/Droid یا `FACTORY_API_KEY` در محیط ابزار نیاز دارد.            |
| `gemini`     | آداپتور Gemini CLI ACP                         | به احراز هویت Gemini CLI یا راه‌اندازی کلید API نیاز دارد.                           |
| `iflow`      | iFlow CLI                                      | دسترس‌پذیری آداپتور و کنترل مدل به CLI نصب‌شده بستگی دارد.                          |
| `kilocode`   | Kilo Code CLI                                  | دسترس‌پذیری آداپتور و کنترل مدل به CLI نصب‌شده بستگی دارد.                          |
| `kimi`       | Kimi/Moonshot CLI                              | به احراز هویت Kimi/Moonshot روی میزبان نیاز دارد.                                    |
| `kiro`       | Kiro CLI                                       | دسترس‌پذیری آداپتور و کنترل مدل به CLI نصب‌شده بستگی دارد.                          |
| `opencode`   | آداپتور OpenCode ACP                           | به احراز هویت OpenCode CLI/ارائه‌دهنده نیاز دارد.                                    |
| `openclaw`   | پل OpenClaw Gateway از طریق `openclaw acp`     | اجازه می‌دهد یک ابزار سازگار با ACP به یک نشست OpenClaw Gateway پاسخ دهد.           |
| `qwen`       | Qwen Code / Qwen CLI                           | به احراز هویت سازگار با Qwen روی میزبان نیاز دارد.                                   |

نام‌های مستعار سفارشی عامل acpx را می‌توان در خود acpx پیکربندی کرد، اما
policy OpenClaw همچنان پیش از dispatch، `acp.allowedAgents` و هر mapping
در `agents.list[].runtime.acp.agent` را بررسی می‌کند.

## runbook اپراتور

جریان سریع `/acp` از چت:

<Steps>
  <Step title="ایجاد">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، یا
    `/acp spawn codex --bind here` صریح.
  </Step>
  <Step title="کار">
    در گفت‌وگو یا thread متصل ادامه دهید (یا کلید نشست را صریحاً هدف بگیرید).
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
    بدون جایگزینی زمینه: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="توقف">
    `/acp cancel` (نوبت فعلی) یا `/acp close` (نشست + اتصال‌ها).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="جزئیات چرخه عمر">
    - ایجاد، یک نشست runtime برای ACP می‌سازد یا از سر می‌گیرد، فراداده ACP را در انبار نشست OpenClaw ثبت می‌کند، و وقتی اجرا متعلق به والد است ممکن است یک وظیفه پس‌زمینه ایجاد کند.
    - نشست‌های ACP متعلق به والد حتی وقتی نشست runtime پایدار است، به‌عنوان کار پس‌زمینه در نظر گرفته می‌شوند؛ تکمیل و تحویل میان سطح‌ها از طریق اعلان‌دهنده وظیفه والد انجام می‌شود، نه مانند یک نشست چت عادی رو به کاربر.
    - نگهداری وظیفه، نشست‌های ACP یک‌باره متعلق به والد را که نهایی یا یتیم شده‌اند می‌بندد. نشست‌های ACP پایدار تا زمانی که اتصال گفت‌وگوی فعال باقی باشد حفظ می‌شوند؛ نشست‌های پایدار قدیمی بدون اتصال فعال بسته می‌شوند تا پس از اتمام وظیفه مالک یا حذف رکورد وظیفه آن، بی‌صدا از سر گرفته نشوند.
    - پیام‌های پیگیری متصل تا زمان بسته، unfocus، reset یا منقضی شدن اتصال، مستقیماً به نشست ACP می‌روند.
    - فرمان‌های Gateway محلی می‌مانند. `/acp ...`، `/status` و `/unfocus` هرگز به‌عنوان متن prompt عادی به یک ابزار ACP متصل ارسال نمی‌شوند.
    - `cancel` وقتی پشتیبان از لغو پشتیبانی کند، نوبت فعال را لغو می‌کند؛ اتصال یا فراداده نشست را حذف نمی‌کند.
    - `close` نشست ACP را از دید OpenClaw پایان می‌دهد و اتصال را حذف می‌کند. اگر ابزار از resume پشتیبانی کند، ممکن است همچنان تاریخچه بالادستی خودش را نگه دارد.
    - Plugin acpx پس از `close` درخت‌های فرایندی wrapper و آداپتور تحت مالکیت OpenClaw را پاک‌سازی می‌کند، و یتیم‌های ACPX قدیمی تحت مالکیت OpenClaw را هنگام شروع Gateway جمع‌آوری می‌کند.
    - workerهای runtime بی‌کار پس از `acp.runtime.ttlMinutes` واجد شرایط پاک‌سازی هستند؛ فراداده نشست ذخیره‌شده برای `/acp sessions` در دسترس می‌ماند.

  </Accordion>
  <Accordion title="قواعد مسیریابی بومی Codex">
    محرک‌های زبان طبیعی که وقتی فعال هستند باید به **Plugin بومی Codex**
    مسیریابی شوند:

    - «این کانال Discord را به Codex متصل کن.»
    - «این چت را به thread Codex با شناسه `<id>` پیوست کن.»
    - «threadهای Codex را نشان بده، سپس این یکی را متصل کن.»

    مسیر پیش‌فرض کنترل چت، اتصال گفت‌وگوی بومی Codex است.
    ابزارهای پویای OpenClaw همچنان از طریق OpenClaw اجرا می‌شوند، در حالی که
    ابزارهای بومی Codex مانند shell/apply-patch داخل Codex اجرا می‌شوند.
    برای رویدادهای ابزار بومی Codex، OpenClaw در هر نوبت یک رلهٔ قلاب بومی
    تزریق می‌کند تا قلاب‌های Plugin بتوانند `before_tool_call` را مسدود کنند، `after_tool_call` را مشاهده کنند، و رویدادهای Codex `PermissionRequest` را
    از طریق تأییدهای OpenClaw مسیریابی کنند. قلاب‌های Codex `Stop` به
    OpenClaw `before_agent_finalize` رله می‌شوند؛ جایی که Pluginها می‌توانند پیش از نهایی‌سازی پاسخ توسط Codex، یک گذر مدل دیگر درخواست کنند. این رله
    عمداً محافظه‌کار باقی می‌ماند: آرگومان‌های ابزار بومی Codex را تغییر نمی‌دهد
    و رکوردهای رشتهٔ Codex را بازنویسی نمی‌کند. فقط زمانی از ACP صریح استفاده کنید
    که مدل زمان‌اجرا/نشست ACP را می‌خواهید. مرز پشتیبانی Codex تعبیه‌شده در
    [قرارداد پشتیبانی نسخهٔ ۱ هارنس Codex](/fa/plugins/codex-harness-runtime#v1-support-contract) مستند شده است.

  </Accordion>
  <Accordion title="Model / provider / runtime selection cheat sheet">
    - ارجاع‌های مدل قدیمی Codex - مسیر مدل OAuth/اشتراک قدیمی Codex که توسط doctor ترمیم می‌شود.
    - `openai/*` - زمان‌اجرای تعبیه‌شدهٔ بومی app-server Codex برای نوبت‌های عامل OpenAI.
    - `/codex ...` - کنترل گفت‌وگوی بومی Codex.
    - `/acp ...` یا `runtime: "acp"` - کنترل صریح ACP/acpx.

  </Accordion>
  <Accordion title="ACP-routing natural-language triggers">
    محرک‌هایی که باید به زمان‌اجرای ACP مسیریابی شوند:

    - «این را به‌عنوان یک نشست یک‌بارهٔ Claude Code ACP اجرا کن و نتیجه را خلاصه کن.»
    - «برای این وظیفه از Gemini CLI در یک رشته استفاده کن، سپس پیگیری‌ها را در همان رشته نگه دار.»
    - «Codex را از طریق ACP در یک رشتهٔ پس‌زمینه اجرا کن.»

    OpenClaw مقدار `runtime: "acp"` را انتخاب می‌کند، `agentId` هارنس را حل می‌کند،
    در صورت پشتیبانی به گفت‌وگو یا رشتهٔ فعلی متصل می‌شود، و
    پیگیری‌ها را تا زمان بستن/انقضا به آن نشست مسیریابی می‌کند. Codex فقط
    زمانی این مسیر را دنبال می‌کند که ACP/acpx صریح باشد یا Plugin بومی Codex
    برای عملیات درخواستی در دسترس نباشد.

    برای `sessions_spawn`، مقدار `runtime: "acp"` فقط زمانی اعلام می‌شود که ACP
    فعال باشد، درخواست‌دهنده sandbox نشده باشد، و یک backend زمان‌اجرای ACP
    بارگذاری شده باشد. `acp.dispatch.enabled=false` ارسال خودکار
    رشتهٔ ACP را متوقف می‌کند اما فراخوانی‌های صریح
    `sessions_spawn({ runtime: "acp" })` را پنهان یا مسدود نمی‌کند. این گزینه شناسه‌های هارنس ACP مانند `codex`،
    `claude`، `droid`، `gemini` یا `opencode` را هدف می‌گیرد. یک شناسهٔ عامل پیکربندی عادی
    OpenClaw از `agents_list` را ارسال نکنید مگر آنکه آن ورودی
    صراحتاً با `agents.list[].runtime.type="acp"` پیکربندی شده باشد؛
    در غیر این صورت از زمان‌اجرای زیرعامل پیش‌فرض استفاده کنید. وقتی یک عامل OpenClaw
    با `runtime.type="acp"` پیکربندی شده باشد، OpenClaw از
    `runtime.acp.agent` به‌عنوان شناسهٔ هارنس زیربنایی استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## ACP در برابر زیرعامل‌ها

وقتی یک زمان‌اجرای هارنس خارجی می‌خواهید از ACP استفاده کنید. وقتی Plugin
`codex` فعال است، برای اتصال/کنترل گفت‌وگوی Codex از **app-server بومی Codex**
استفاده کنید. وقتی اجراهای واگذارشدهٔ بومی OpenClaw می‌خواهید از **زیرعامل‌ها** استفاده کنید.

| حوزه          | نشست ACP                           | اجرای زیرعامل                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| زمان‌اجرا       | Plugin backend ACP (برای مثال acpx) | زمان‌اجرای زیرعامل بومی OpenClaw  |
| کلید نشست   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| فرمان‌های اصلی | `/acp ...`                            | `/subagents ...`                   |
| ابزار spawn    | `sessions_spawn` با `runtime:"acp"` | `sessions_spawn` (زمان‌اجرای پیش‌فرض) |

همچنین [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

## ACP چگونه Claude Code را اجرا می‌کند

برای Claude Code از طریق ACP، پشته چنین است:

1. صفحهٔ کنترل نشست ACP در OpenClaw.
2. Plugin رسمی زمان‌اجرای `@openclaw/acpx`.
3. آداپتور Claude ACP.
4. سازوکار زمان‌اجرا/نشست در سمت Claude.

ACP Claude یک **نشست هارنس** با کنترل‌های ACP، ازسرگیری نشست،
ردیابی وظیفهٔ پس‌زمینه، و اتصال اختیاری گفت‌وگو/رشته است.

backendهای CLI زمان‌اجراهای fallback محلی جداگانه و فقط متنی هستند - ببینید
[backendهای CLI](/fa/gateway/cli-backends).

برای اپراتورها، قاعدهٔ عملی این است:

- **`/acp spawn`، نشست‌های قابل اتصال، کنترل‌های زمان‌اجرا، یا کار پایدار هارنس می‌خواهید؟** از ACP استفاده کنید.
- **fallback متنی محلی ساده از طریق CLI خام می‌خواهید؟** از backendهای CLI استفاده کنید.

## نشست‌های متصل

### مدل ذهنی

- **سطح چت** - جایی که افراد به گفت‌وگو ادامه می‌دهند (کانال Discord، موضوع Telegram، چت iMessage).
- **نشست ACP** - وضعیت پایدار زمان‌اجرای Codex/Claude/Gemini که OpenClaw به آن مسیریابی می‌کند.
- **رشته/موضوع فرزند** - یک سطح پیام‌رسانی اضافی اختیاری که فقط توسط `--thread ...` ایجاد می‌شود.
- **فضای کاری زمان‌اجرا** - محل فایل‌سیستم (`cwd`، checkout مخزن، فضای کاری backend) که هارنس در آن اجرا می‌شود. مستقل از سطح چت است.

### اتصال‌های گفت‌وگوی فعلی

`/acp spawn <harness> --bind here` گفت‌وگوی فعلی را به
نشست ACP ایجادشده سنجاق می‌کند - بدون رشتهٔ فرزند، همان سطح چت. OpenClaw
همچنان مالک transport، احراز هویت، ایمنی و تحویل است. پیام‌های پیگیری در همان
گفت‌وگو به همان نشست مسیریابی می‌شوند؛ `/new` و `/reset` نشست را در همان‌جا
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
  <Accordion title="Binding rules and exclusivity">
    - `--bind here` و `--thread ...` ناسازگارند و نمی‌توانند هم‌زمان استفاده شوند.
    - `--bind here` فقط روی کانال‌هایی کار می‌کند که اتصال گفت‌وگوی فعلی را اعلام می‌کنند؛ در غیر این صورت OpenClaw یک پیام روشنِ پشتیبانی‌نشدن برمی‌گرداند. اتصال‌ها پس از راه‌اندازی مجدد Gateway باقی می‌مانند.
    - در Discord، `spawnSessions` ایجاد رشتهٔ فرزند را برای `--thread auto|here` کنترل می‌کند - نه `--bind here`.
    - اگر بدون `--cwd` به یک عامل ACP متفاوت spawn کنید، OpenClaw به‌طور پیش‌فرض فضای کاری **عامل هدف** را به ارث می‌برد. مسیرهای به‌ارث‌رسیدهٔ مفقود (`ENOENT`/`ENOTDIR`) به مقدار پیش‌فرض backend برمی‌گردند؛ خطاهای دسترسی دیگر (مثلاً `EACCES`) به‌عنوان خطاهای spawn نمایش داده می‌شوند.
    - فرمان‌های مدیریتی Gateway در گفت‌وگوهای متصل محلی می‌مانند - فرمان‌های `/acp ...` توسط OpenClaw مدیریت می‌شوند حتی وقتی متن پیگیری عادی به نشست ACP متصل‌شده مسیریابی می‌شود؛ `/status` و `/unfocus` نیز هرگاه مدیریت فرمان برای آن سطح فعال باشد محلی می‌مانند.

  </Accordion>
  <Accordion title="Thread-bound sessions">
    وقتی اتصال‌های رشته برای یک آداپتور کانال فعال باشند:

    - OpenClaw یک رشته را به نشست ACP هدف متصل می‌کند.
    - پیام‌های پیگیری در آن رشته به نشست ACP متصل‌شده مسیریابی می‌شوند.
    - خروجی ACP به همان رشته تحویل داده می‌شود.
    - unfocus/close/archive/idle-timeout یا انقضای max-age اتصال را حذف می‌کند.
    - `/acp close`، `/acp cancel`، `/acp status`، `/status` و `/unfocus` فرمان‌های Gateway هستند، نه promptهایی برای هارنس ACP.

    feature flagهای لازم برای ACP متصل به رشته:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` به‌طور پیش‌فرض روشن است (برای توقف ارسال خودکار رشتهٔ ACP مقدار `false` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند).
    - ایجاد نشست رشته توسط آداپتور کانال فعال باشد (پیش‌فرض: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    پشتیبانی از اتصال رشته مخصوص هر آداپتور است. اگر آداپتور کانال فعال
    از اتصال‌های رشته پشتیبانی نکند، OpenClaw یک پیام روشنِ
    پشتیبانی‌نشدن/در دسترس نبودن برمی‌گرداند.

  </Accordion>
  <Accordion title="Thread-supporting channels">
    - هر آداپتور کانالی که قابلیت اتصال نشست/رشته را ارائه کند.
    - پشتیبانی داخلی فعلی: رشته‌ها/کانال‌های **Discord**، موضوع‌های **Telegram** (موضوع‌های forum در گروه‌ها/ابرگروه‌ها و موضوع‌های DM).
    - کانال‌های Plugin می‌توانند از طریق همان رابط اتصال پشتیبانی اضافه کنند.

  </Accordion>
</AccordionGroup>

## اتصال‌های پایدار کانال

برای workflowهای غیرموقت، اتصال‌های پایدار ACP را در
ورودی‌های سطح‌بالای `bindings[]` پیکربندی کنید.

### مدل اتصال

<ParamField path="bindings[].type" type='"acp"'>
  یک اتصال گفت‌وگوی پایدار ACP را علامت‌گذاری می‌کند.
</ParamField>
<ParamField path="bindings[].match" type="object">
  گفت‌وگوی هدف را شناسایی می‌کند. شکل‌ها برای هر کانال:

- **کانال/رشتهٔ Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **کانال/DM در Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. شناسه‌های پایدار Slack را ترجیح دهید؛ اتصال‌های کانال همچنین پاسخ‌های داخل رشته‌های همان کانال را تطبیق می‌دهند.
- **موضوع forum در Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/گروه WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. برای چت‌های مستقیم از شماره‌های E.164 مانند `+15555550123` و برای گروه‌ها از JIDهای گروه WhatsApp مانند `120363424282127706@g.us` استفاده کنید.
- **DM/گروه iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های پایدار گروهی `chat_id:*` را ترجیح دهید.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  شناسهٔ عامل مالک OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  override اختیاری ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  برچسب اختیاری روبه‌روی اپراتور.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  پوشهٔ کاری اختیاری زمان‌اجرا.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  override اختیاری backend.
</ParamField>

### پیش‌فرض‌های زمان‌اجرا برای هر عامل

از `agents.list[].runtime` برای تعریف یک‌بارهٔ پیش‌فرض‌های ACP برای هر عامل استفاده کنید:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (شناسهٔ هارنس، مثلاً `codex` یا `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**اولویت override برای نشست‌های متصل ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. پیش‌فرض‌های سراسری ACP (مثلاً `acp.backend`)

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

- OpenClaw مطمئن می‌شود نشست ACP پیکربندی‌شده پس از پذیرش مخصوص کانال و پیش از استفاده وجود دارد.
- پیام‌ها در آن کانال، موضوع یا گفت‌وگو به نشست ACP پیکربندی‌شده هدایت می‌شوند.
- اتصال‌های ACP پیکربندی‌شده مالک مسیر نشست خود هستند. انتشار همگانی کانال، نشست ACP پیکربندی‌شده را برای یک اتصال منطبق جایگزین نمی‌کند.
- در گفت‌وگوهای متصل، `/new` و `/reset` همان کلید نشست ACP را درجا بازنشانی می‌کنند.
- اتصال‌های موقت زمان اجرا، برای مثال اتصال‌هایی که توسط جریان‌های تمرکز روی رشته ایجاد می‌شوند، همچنان هرجا موجود باشند اعمال می‌شوند.
- برای اجرای ACP میان‌عامل بدون `cwd` صریح، OpenClaw فضای کاری عامل هدف را از پیکربندی عامل به ارث می‌برد.
- مسیرهای فضای کاری ارث‌بری‌شده‌ای که وجود ندارند به cwd پیش‌فرض backend بازمی‌گردند؛ خطاهای دسترسی در مسیرهای موجود به‌صورت خطای اجرا نمایش داده می‌شوند.

## شروع نشست‌های ACP

دو روش برای شروع یک نشست ACP:

<Tabs>
  <Tab title="از sessions_spawn">
    از `runtime: "acp"` برای شروع یک نشست ACP از یک نوبت عامل یا
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
    مقدار پیش‌فرض `runtime` برابر `subagent` است، بنابراین برای نشست‌های ACP
    به‌صورت صریح `runtime: "acp"` را تنظیم کنید. اگر `agentId` حذف شود، OpenClaw هنگام پیکربندی از
    `acp.defaultAgent` استفاده می‌کند. `mode: "session"` به
    `thread: true` نیاز دارد تا یک گفت‌وگوی متصل پایدار نگه داشته شود.
    </Note>

  </Tab>
  <Tab title="از دستور /acp">
    از `/acp spawn` برای کنترل صریح اپراتور از گفت‌وگو استفاده کنید.

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
  پرامپت اولیه‌ای که به نشست ACP فرستاده می‌شود.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  برای نشست‌های ACP باید `"acp"` باشد.
</ParamField>
<ParamField path="agentId" type="string">
  شناسه هارنس هدف ACP. اگر `acp.defaultAgent` تنظیم شده باشد، به آن بازمی‌گردد.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  درخواست جریان اتصال رشته در جاهایی که پشتیبانی می‌شود.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` یک‌باره است؛ `"session"` پایدار است. اگر `thread: true` باشد و
  `mode` حذف شود، OpenClaw ممکن است بسته به مسیر زمان اجرا به‌صورت پیش‌فرض از رفتار پایدار استفاده کند.
  `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cwd" type="string">
  دایرکتوری کاری زمان اجرای درخواستی، که توسط سیاست backend/زمان اجرا
  اعتبارسنجی می‌شود. اگر حذف شود، اجرای ACP در صورت پیکربندی، فضای کاری عامل هدف را
  به ارث می‌برد؛ مسیرهای ارث‌بری‌شده ناموجود به پیش‌فرض‌های backend
  بازمی‌گردند، در حالی که خطاهای واقعی دسترسی برگردانده می‌شوند.
</ParamField>
<ParamField path="label" type="string">
  برچسب روبه‌روی اپراتور که در متن نشست/بنر استفاده می‌شود.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  به‌جای ایجاد نشست تازه، یک نشست ACP موجود را از سر بگیرید. عامل
  تاریخچه گفت‌وگوی خود را از طریق `session/load` بازپخش می‌کند. به
  `runtime: "acp"` نیاز دارد.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` خلاصه‌های پیشرفت اجرای اولیه ACP را به‌صورت رویدادهای سیستمی
  به نشست درخواست‌کننده بازپخش می‌کند. پاسخ‌های پذیرفته‌شده شامل
  `streamLogPath` هستند که به یک لاگ JSONL در محدوده نشست اشاره می‌کند
  (`<sessionId>.acp-stream.jsonl`) و می‌توانید آن را برای تاریخچه کامل رله دنبال کنید.
  جریان‌های پیشرفت والد به‌صورت پیش‌فرض دیدگاه‌های دستیار و پیشرفت وضعیت ACP را نشان می‌دهند،
  مگر اینکه `streaming.progress.commentary=false` باشد. Discord نیز وقتی هیچ حالت جریانی پیکربندی نشده باشد،
  پیش‌نمایش‌های والد را به‌صورت پیش‌فرض روی حالت پیشرفت می‌گذارد. پیشرفت وضعیت
  همچنان از `acp.stream.tagVisibility` پیروی می‌کند، بنابراین برچسب‌هایی مانند `plan`
  پنهان می‌مانند مگر اینکه به‌صورت صریح فعال شوند.
</ParamField>

اجرای ACP با `sessions_spawn` برای محدودیت پیش‌فرض نوبت فرزند خود از
`agents.defaults.subagents.runTimeoutSeconds` استفاده می‌کند. این ابزار
بازنویسی مهلت زمانی به‌ازای هر فراخوانی را نمی‌پذیرد.

<ParamField path="model" type="string">
  بازنویسی صریح مدل برای نشست فرزند ACP. اجراهای Codex ACP
  ارجاع‌های OpenAI مانند `openai/gpt-5.4` را پیش از `session/new` به پیکربندی شروع
  Codex ACP نرمال می‌کنند؛ فرم‌های اسلش مانند `openai/gpt-5.4/high`
  همچنین میزان تلاش استدلال Codex ACP را تنظیم می‌کنند.
  در صورت حذف، `sessions_spawn({ runtime: "acp" })` هنگام پیکربندی از
  پیش‌فرض‌های مدل subagent موجود (`agents.defaults.subagents.model` یا
  `agents.list[].subagents.model`) استفاده می‌کند؛ در غیر این صورت اجازه می‌دهد
  هارنس ACP از مدل پیش‌فرض خودش استفاده کند.
  هارنس‌های دیگر باید ACP `models` را اعلام کنند و از
  `session/set_model` پشتیبانی کنند؛ در غیر این صورت OpenClaw/acpx به‌جای
  بازگشت خاموش به پیش‌فرض عامل هدف، به‌روشنی شکست می‌خورد.
</ParamField>
<ParamField path="thinking" type="string">
  میزان صریح فکرکردن/استدلال. برای Codex ACP، `minimal` به تلاش کم نگاشت می‌شود،
  `low`/`medium`/`high`/`xhigh` مستقیماً نگاشت می‌شوند، و `off`
  بازنویسی شروع reasoning-effort را حذف می‌کند.
  در صورت حذف، اجراهای ACP از پیش‌فرض‌های فکرکردن subagent موجود و
  `agents.defaults.models["provider/model"].params.thinking` به‌ازای مدل انتخاب‌شده استفاده می‌کنند.
</ParamField>

## حالت‌های اتصال و رشته در اجرا

<Tabs>
  <Tab title="--bind here|off">
    | حالت   | رفتار                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | گفت‌وگوی فعال فعلی را درجا متصل می‌کند؛ اگر هیچ‌کدام فعال نباشد شکست می‌خورد. |
    | `off`  | اتصال گفت‌وگوی فعلی ایجاد نمی‌کند.                          |

    نکته‌ها:

    - `--bind here` ساده‌ترین مسیر اپراتور برای «پشتیبانی این کانال یا گفت‌وگو با Codex» است.
    - `--bind here` رشته فرزند ایجاد نمی‌کند.
    - `--bind here` فقط روی کانال‌هایی در دسترس است که پشتیبانی اتصال گفت‌وگوی فعلی را ارائه می‌کنند.
    - `--bind` و `--thread` را نمی‌توان در یک فراخوانی `/acp spawn` ترکیب کرد.

  </Tab>
  <Tab title="--thread auto|here|off">
    | حالت   | رفتار                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | در یک رشته فعال: همان رشته را متصل می‌کند. بیرون از رشته: در صورت پشتیبانی، یک رشته فرزند ایجاد/متصل می‌کند. |
    | `here` | وجود رشته فعال فعلی را الزامی می‌کند؛ اگر داخل رشته نباشد شکست می‌خورد.                                                  |
    | `off`  | بدون اتصال. نشست بدون اتصال شروع می‌شود.                                                                 |

    نکته‌ها:

    - روی سطح‌های اتصال بدون رشته، رفتار پیش‌فرض عملاً `off` است.
    - اجرای متصل به رشته به پشتیبانی سیاست کانال نیاز دارد:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - وقتی می‌خواهید گفت‌وگوی فعلی را بدون ایجاد رشته فرزند ثابت کنید، از `--bind here` استفاده کنید.

  </Tab>
</Tabs>

## مدل تحویل

نشست‌های ACP می‌توانند یا فضای کاری تعاملی باشند یا کار پس‌زمینه
متعلق به والد. مسیر تحویل به آن شکل وابسته است.

<AccordionGroup>
  <Accordion title="نشست‌های ACP تعاملی">
    نشست‌های تعاملی برای ادامه مکالمه روی یک سطح گفت‌وگوی قابل مشاهده
    در نظر گرفته شده‌اند:

    - `/acp spawn ... --bind here` گفت‌وگوی فعلی را به نشست ACP متصل می‌کند.
    - `/acp spawn ... --thread ...` یک رشته/موضوع کانال را به نشست ACP متصل می‌کند.
    - `bindings[].type="acp"` پیکربندی‌شده پایدار، گفت‌وگوهای منطبق را به همان نشست ACP هدایت می‌کند.

    پیام‌های بعدی در گفت‌وگوی متصل مستقیماً به نشست ACP هدایت می‌شوند،
    و خروجی ACP به همان کانال/رشته/موضوع بازگردانده می‌شود.

    آنچه OpenClaw به هارنس می‌فرستد:

    - پیگیری‌های متصل عادی به‌صورت متن پرامپت ارسال می‌شوند، به‌همراه پیوست‌ها فقط وقتی هارنس/backend از آن‌ها پشتیبانی کند.
    - دستورهای مدیریتی `/acp` و دستورهای local Gateway پیش از اعزام ACP رهگیری می‌شوند.
    - رویدادهای تکمیل تولیدشده توسط زمان اجرا به‌ازای هر هدف مادی‌سازی می‌شوند. عامل‌های OpenClaw پاکت runtime-context داخلی OpenClaw را دریافت می‌کنند؛ هارنس‌های ACP خارجی یک پرامپت ساده همراه نتیجه و دستور فرزند دریافت می‌کنند. پاکت خام `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` هرگز نباید به هارنس‌های خارجی فرستاده شود یا به‌عنوان متن رونوشت کاربر ACP پایدار شود.
    - ورودی‌های رونوشت ACP از متن محرک قابل مشاهده برای کاربر یا پرامپت تکمیل ساده استفاده می‌کنند. فراداده رویداد داخلی، تا جای ممکن، در OpenClaw ساخت‌یافته می‌ماند و به‌عنوان محتوای گفت‌وگوی نوشته‌شده توسط کاربر تلقی نمی‌شود.

  </Accordion>
  <Accordion title="نشست‌های ACP یک‌باره متعلق به والد">
    نشست‌های ACP یک‌باره که توسط اجرای عامل دیگری ایجاد می‌شوند، فرزندان
    پس‌زمینه هستند، مشابه sub-agentها:

    - والد با `sessions_spawn({ runtime: "acp", mode: "run" })` درخواست کار می‌کند.
    - فرزند در نشست هارنس ACP خودش اجرا می‌شود.
    - نوبت‌های فرزند روی همان مسیر پس‌زمینه‌ای اجرا می‌شوند که اجرای sub-agent بومی از آن استفاده می‌کند، بنابراین یک هارنس ACP کند، کار نامرتبط نشست اصلی را مسدود نمی‌کند.
    - گزارش تکمیل از طریق مسیر اعلام تکمیل وظیفه بازمی‌گردد. OpenClaw پیش از فرستادن فراداده تکمیل داخلی به یک هارنس خارجی، آن را به یک پرامپت ACP ساده تبدیل می‌کند، بنابراین هارنس‌ها نشانگرهای زمینه زمان اجرای مخصوص OpenClaw را نمی‌بینند.
    - والد وقتی پاسخ قابل مشاهده برای کاربر مفید باشد، نتیجه فرزند را با صدای عادی دستیار بازنویسی می‌کند.

    این مسیر را به‌عنوان گفت‌وگوی همتابه‌همتا بین والد
    و فرزند تلقی نکنید. فرزند از قبل یک کانال تکمیل برای بازگشت به
    والد دارد.

  </Accordion>
  <Accordion title="sessions_send و تحویل A2A">
    `sessions_send` می‌تواند پس از اجرا، نشست دیگری را هدف بگیرد. برای نشست‌های همتای عادی،
    OpenClaw پس از تزریق پیام از مسیر پیگیری عامل‌به‌عامل (A2A)
    استفاده می‌کند:

    - منتظر پاسخ نشست هدف می‌ماند.
    - به‌صورت اختیاری اجازه می‌دهد درخواست‌کننده و هدف تعداد محدودی نوبت پیگیری تبادل کنند.
    - از هدف می‌خواهد یک پیام اعلام تولید کند.
    - آن اعلام را به کانال یا رشته قابل مشاهده تحویل می‌دهد.

    آن مسیر A2A یک fallback برای ارسال‌های همتاست که در آن فرستنده به
    یک پیگیری قابل مشاهده نیاز دارد. این مسیر وقتی نشست نامرتبطی بتواند
    یک هدف ACP را ببیند و به آن پیام بدهد، برای مثال تحت تنظیمات گسترده
    `tools.sessions.visibility`، فعال می‌ماند.

    OpenClaw پیگیری A2A را فقط زمانی رد می‌کند که درخواست‌کننده
    والدِ فرزند یک‌باره ACP متعلق به والد خودش باشد. در آن حالت،
    اجرای A2A روی تکمیل وظیفه می‌تواند والد را با نتیجه فرزند بیدار کند، پاسخ والد را دوباره به فرزند بفرستد، و
    یک حلقه بازتاب والد/فرزند ایجاد کند. نتیجه `sessions_send` برای این حالت فرزندِ متعلق‌شده
    `delivery.status="skipped"` را گزارش می‌کند، چون مسیر تکمیل از قبل مسئول نتیجه است.

  </Accordion>
  <Accordion title="ازسرگیری یک نشست موجود">
    برای ادامه دادن یک نشست ACP قبلی به‌جای شروع تازه، از `resumeSessionId` استفاده کنید.
    عامل تاریخچه گفت‌وگوی خود را از طریق
    `session/load` بازپخش می‌کند، بنابراین با زمینه کامل آنچه پیش‌تر آمده ادامه می‌دهد.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    موارد استفاده رایج:

    - یک نشست Codex را از لپ‌تاپ به تلفن خود واگذار کنید - به عامل خود بگویید از جایی که متوقف شده‌اید ادامه دهد.
    - یک نشست کدنویسی را که به‌صورت تعاملی در CLI شروع کرده‌اید، اکنون به‌صورت بدون‌سر از طریق عامل خود ادامه دهید.
    - کاری را ادامه دهید که با راه‌اندازی مجدد Gateway یا وقفه ناشی از بیکاری قطع شده بود.

    نکته‌ها:

    - `resumeSessionId` فقط زمانی اعمال می‌شود که `runtime: "acp"` باشد؛ زمان اجرای پیش‌فرض زیرعامل این فیلد مختص ACP را نادیده می‌گیرد.
    - `streamTo` فقط زمانی اعمال می‌شود که `runtime: "acp"` باشد؛ زمان اجرای پیش‌فرض زیرعامل این فیلد مختص ACP را نادیده می‌گیرد.
    - `resumeSessionId` یک شناسه ازسرگیری ACP/هارنس محلی میزبان است، نه کلید نشست کانال OpenClaw؛ OpenClaw همچنان پیش از ارسال، سیاست ایجاد ACP و سیاست عامل مقصد را بررسی می‌کند، در حالی که پشتوانه ACP یا هارنس مسئولیت مجوزدهی برای بارگذاری آن شناسه بالادستی را بر عهده دارد.
    - `resumeSessionId` تاریخچه گفت‌وگوی ACP بالادستی را بازیابی می‌کند؛ `thread` و `mode` همچنان به‌صورت معمول برای نشست OpenClaw جدیدی که ایجاد می‌کنید اعمال می‌شوند، بنابراین `mode: "session"` همچنان به `thread: true` نیاز دارد.
    - عامل مقصد باید از `session/load` پشتیبانی کند (Codex و Claude Code پشتیبانی می‌کنند).
    - اگر شناسه نشست پیدا نشود، ایجاد با خطایی روشن شکست می‌خورد - بدون بازگشت بی‌صدا به یک نشست جدید.

  </Accordion>
  <Accordion title="آزمون دود پس از استقرار">
    پس از استقرار Gateway، به‌جای اعتماد به آزمون‌های واحد، یک بررسی زنده انتهابه‌انتها اجرا کنید:

    1. نسخه و commit مربوط به Gateway مستقرشده را روی میزبان مقصد تأیید کنید.
    2. یک نشست پل ACPX موقت به یک عامل زنده باز کنید.
    3. از آن عامل بخواهید `sessions_spawn` را با `runtime: "acp"`، `agentId: "codex"`، `mode: "run"`، و وظیفه `Reply with exactly LIVE-ACP-SPAWN-OK` فراخوانی کند.
    4. `accepted=yes`، یک `childSessionKey` واقعی، و نبود خطای اعتبارسنجی را تأیید کنید.
    5. نشست پل موقت را پاک‌سازی کنید.

    گیت را روی `mode: "run"` نگه دارید و از `streamTo: "parent"` صرف‌نظر کنید -
    `mode: "session"` وابسته به رشته و مسیرهای رله جریان، گذرهای ادغام جداگانه و غنی‌تری هستند.

  </Accordion>
</AccordionGroup>

## سازگاری سندباکس

نشست‌های ACP در حال حاضر روی زمان اجرای میزبان اجرا می‌شوند، **نه** داخل سندباکس
OpenClaw.

<Warning>
**مرز امنیتی:**

- هارنس خارجی می‌تواند مطابق مجوزهای CLI خودش و `cwd` انتخاب‌شده بخواند/بنویسد.
- سیاست سندباکس OpenClaw اجرای هارنس ACP را **پوشش نمی‌دهد**.
- OpenClaw همچنان گیت‌های قابلیت ACP، عامل‌های مجاز، مالکیت نشست، اتصال‌های کانال، و سیاست تحویل Gateway را اعمال می‌کند.
- برای کار بومی OpenClaw که با سندباکس اعمال می‌شود، از `runtime: "subagent"` استفاده کنید.

</Warning>

محدودیت‌های فعلی:

- اگر نشست درخواست‌کننده سندباکس‌شده باشد، ایجادهای ACP برای هر دو `sessions_spawn({ runtime: "acp" })` و `/acp spawn` مسدود می‌شوند.
- `sessions_spawn` با `runtime: "acp"` از `sandbox: "require"` پشتیبانی نمی‌کند.

## حل مقصد نشست

بیشتر کنش‌های `/acp` یک مقصد نشست اختیاری می‌پذیرند (`session-key`،
`session-id`، یا `session-label`).

**ترتیب حل:**

1. آرگومان مقصد صریح (یا `--session` برای `/acp steer`)
   - کلید را امتحان می‌کند
   - سپس شناسه نشست با شکل UUID
   - سپس برچسب
2. اتصال رشته فعلی (اگر این گفت‌وگو/رشته به یک نشست ACP متصل باشد).
3. بازگشت به نشست درخواست‌کننده فعلی.

اتصال‌های گفت‌وگوی فعلی و اتصال‌های رشته هر دو در
گام 2 مشارکت می‌کنند.

اگر هیچ مقصدی حل نشود، OpenClaw خطایی روشن برمی‌گرداند
(`Unable to resolve session target: ...`).

## کنترل‌های ACP

| فرمان                | کاری که انجام می‌دهد                                      | مثال                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | نشست ACP ایجاد می‌کند؛ اتصال فعلی یا اتصال رشته اختیاری. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | نوبت در حال اجرا را برای نشست مقصد لغو می‌کند.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | دستور راهبری را به نشست در حال اجرا می‌فرستد.             | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | نشست را می‌بندد و مقصدهای رشته را جدا می‌کند.             | `/acp close`                                                  |
| `/acp status`        | پشتوانه، حالت، وضعیت، گزینه‌های زمان اجرا، و قابلیت‌ها را نشان می‌دهد. | `/acp status`                                                 |
| `/acp set-mode`      | حالت زمان اجرا را برای نشست مقصد تنظیم می‌کند.            | `/acp set-mode plan`                                          |
| `/acp set`           | گزینه پیکربندی عمومی زمان اجرا را می‌نویسد.               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | بازنویسی دایرکتوری کاری زمان اجرا را تنظیم می‌کند.        | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | نمایه سیاست تأیید را تنظیم می‌کند.                        | `/acp permissions strict`                                     |
| `/acp timeout`       | زمان‌پایان زمان اجرا را تنظیم می‌کند (ثانیه).             | `/acp timeout 120`                                            |
| `/acp model`         | بازنویسی مدل زمان اجرا را تنظیم می‌کند.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | بازنویسی‌های گزینه زمان اجرای نشست را حذف می‌کند.         | `/acp reset-options`                                          |
| `/acp sessions`      | نشست‌های اخیر ACP را از ذخیره‌گاه فهرست می‌کند.           | `/acp sessions`                                               |
| `/acp doctor`        | سلامت پشتوانه، قابلیت‌ها، و اصلاح‌های قابل اقدام.         | `/acp doctor`                                                 |
| `/acp install`       | گام‌های نصب و فعال‌سازی قطعی را چاپ می‌کند.               | `/acp install`                                                |

کنترل‌های زمان اجرا (`spawn`، `cancel`، `steer`، `close`، `status`، `set-mode`،
`set`، `cwd`، `permissions`، `timeout`، `model`، و `reset-options`) به
هویت مالک از کانال‌های خارجی و `operator.admin` از کلاینت‌های داخلی Gateway
نیاز دارند. فرستندگان مجاز غیرمالک همچنان می‌توانند از `sessions`، `doctor`،
`install`، و `help` استفاده کنند.

`/acp status` گزینه‌های مؤثر زمان اجرا به‌همراه شناسه‌های نشست در سطح زمان اجرا و
سطح پشتوانه را نشان می‌دهد. خطاهای کنترل پشتیبانی‌نشده زمانی که یک پشتوانه فاقد قابلیتی باشد
به‌روشنی نمایش داده می‌شوند. `/acp sessions` ذخیره‌گاه را برای نشست متصل فعلی یا درخواست‌کننده
می‌خواند؛ توکن‌های مقصد
(`session-key`، `session-id`، یا `session-label`) از طریق کشف نشست
gateway حل می‌شوند، از جمله ریشه‌های سفارشی `session.store` به‌ازای هر عامل.

### نگاشت گزینه‌های زمان اجرا

`/acp` فرمان‌های راحت و یک تنظیم‌کننده عمومی دارد. عملیات معادل:

| فرمان                       | نگاشت به                              | نکته‌ها                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | کلید پیکربندی زمان اجرا `model`      | برای Codex ACP، OpenClaw مقدار `openai/<model>` را به شناسه مدل آداپتر نرمال‌سازی می‌کند و پسوندهای استدلالی اسلش‌دار مانند `openai/gpt-5.4/high` را به `reasoning_effort` نگاشت می‌کند.                |
| `/acp set thinking <level>`  | گزینه canonical `thinking`           | OpenClaw معادل اعلام‌شده توسط پشتوانه را، در صورت وجود، می‌فرستد و به‌ترتیب `thinking`، سپس `effort`، `reasoning_effort`، یا `thought_level` را ترجیح می‌دهد. برای Codex ACP، آداپتر مقدارها را به `reasoning_effort` نگاشت می‌کند. |
| `/acp permissions <profile>` | گزینه canonical `permissionProfile`  | OpenClaw معادل اعلام‌شده توسط پشتوانه را، در صورت وجود، می‌فرستد، مانند `approval_policy`، `permission_profile`، `permissions`، یا `permission_mode`.                                                     |
| `/acp timeout <seconds>`     | گزینه canonical `timeoutSeconds`     | OpenClaw معادل اعلام‌شده توسط پشتوانه را، در صورت وجود، می‌فرستد، مانند `timeout` یا `timeout_seconds`.                                                                                                   |
| `/acp cwd <path>`            | بازنویسی cwd زمان اجرا               | به‌روزرسانی مستقیم.                                                                                                                                                                                        |
| `/acp set <key> <value>`     | عمومی                                | `key=cwd` از مسیر بازنویسی cwd استفاده می‌کند.                                                                                                                                                            |
| `/acp reset-options`         | همه بازنویسی‌های زمان اجرا را پاک می‌کند | -                                                                                                                                                                                                          |

## هارنس acpx، راه‌اندازی plugin، و مجوزها

برای پیکربندی هارنس acpx (نام‌های مستعار Claude Code / Codex / Gemini CLI)،
پل‌های MCP مربوط به plugin-tools و OpenClaw-tools، و حالت‌های مجوز ACP، ببینید
[عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup).

## عیب‌یابی

| نشانه                                                                      | علت محتمل                                                                                                             | راه‌حل                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin بک‌اند وجود ندارد، غیرفعال است، یا توسط `plugins.allow` مسدود شده است.                                                       | Plugin بک‌اند را نصب و فعال کنید، وقتی آن فهرست مجاز تنظیم شده است `acpx` را در `plugins.allow` قرار دهید، سپس `/acp doctor` را اجرا کنید.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP به‌صورت سراسری غیرفعال شده است.                                                                                                 | `acp.enabled=true` را تنظیم کنید.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | ارسال خودکار از پیام‌های عادی رشته غیرفعال شده است.                                                               | برای ازسرگیری مسیریابی خودکار رشته، `acp.dispatch.enabled=true` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | عامل در فهرست مجاز نیست.                                                                                                | از `agentId` مجاز استفاده کنید یا `acp.allowedAgents` را به‌روزرسانی کنید.                                                                                                                     |
| `/acp doctor` بلافاصله پس از راه‌اندازی آماده نبودن بک‌اند را گزارش می‌کند                 | Plugin بک‌اند وجود ندارد، غیرفعال است، توسط سیاست مجاز/غیرمجاز مسدود شده، یا فایل اجرایی پیکربندی‌شده آن در دسترس نیست.        | Plugin بک‌اند را نصب/فعال کنید، دوباره `/acp doctor` را اجرا کنید، و اگر همچنان ناسالم ماند خطای نصب یا سیاست بک‌اند را بررسی کنید.                                           |
| فرمان هارنس پیدا نشد                                                   | CLI آداپتور نصب نشده است، Plugin خارجی وجود ندارد، یا دریافت نخستین اجرای `npx` برای یک آداپتور غیر Codex ناموفق بوده است. | `/acp doctor` را اجرا کنید، آداپتور را روی میزبان Gateway نصب/ازپیش‌گرم کنید، یا فرمان عامل acpx را صراحتا پیکربندی کنید.                                                      |
| مدل از هارنس پیدا نشد                                            | شناسه مدل برای ارائه‌دهنده/هارنس دیگری معتبر است، اما برای این هدف ACP معتبر نیست.                                                | از مدلی استفاده کنید که توسط آن هارنس فهرست شده است، مدل را در هارنس پیکربندی کنید، یا بازنویسی را حذف کنید.                                                                            |
| خطای احراز هویت فروشنده از هارنس                                          | OpenClaw سالم است، اما CLI/ارائه‌دهنده هدف وارد نشده است.                                                     | وارد شوید یا کلید ارائه‌دهنده لازم را در محیط میزبان Gateway فراهم کنید.                                                                                             |
| `Unable to resolve session target: ...`                                     | توکن کلید/شناسه/برچسب نامعتبر است.                                                                                                | `/acp sessions` را اجرا کنید، کلید/برچسب دقیق را کپی کنید و دوباره تلاش کنید.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` بدون یک گفت‌وگوی فعال قابل اتصال استفاده شده است.                                                            | به چت/کانال هدف بروید و دوباره تلاش کنید، یا از ایجاد بدون اتصال استفاده کنید.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | آداپتور قابلیت اتصال ACP به گفت‌وگوی فعلی را ندارد.                                                             | در صورت پشتیبانی از `/acp spawn ... --thread ...` استفاده کنید، `bindings[]` سطح بالا را پیکربندی کنید، یا به یک کانال پشتیبانی‌شده بروید.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` خارج از زمینه رشته استفاده شده است.                                                                         | به رشته هدف بروید یا از `--thread auto`/`off` استفاده کنید.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | کاربر دیگری مالک هدف اتصال فعال است.                                                                           | به‌عنوان مالک دوباره متصل کنید یا از گفت‌وگو یا رشته دیگری استفاده کنید.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | آداپتور قابلیت اتصال رشته را ندارد.                                                                               | از `--thread off` استفاده کنید یا به آداپتور/کانال پشتیبانی‌شده بروید.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | زمان اجرای ACP سمت میزبان است؛ نشست درخواست‌کننده sandbox شده است.                                                              | از نشست‌های sandbox شده `runtime="subagent"` را استفاده کنید، یا ایجاد ACP را از یک نشست غیر sandbox شده اجرا کنید.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` برای زمان اجرای ACP درخواست شده است.                                                                         | برای sandbox الزامی از `runtime="subagent"` استفاده کنید، یا ACP را با `sandbox="inherit"` از یک نشست غیر sandbox شده استفاده کنید.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | هارنس هدف تعویض عمومی مدل ACP را عرضه نمی‌کند.                                                        | از هارنسی استفاده کنید که ACP `models`/`session/set_model` را عرضه می‌کند، از ارجاع‌های مدل Codex ACP استفاده کنید، یا اگر هارنس پرچم راه‌اندازی خودش را دارد، مدل را مستقیم در همان هارنس پیکربندی کنید. |
| فراداده ACP برای نشست متصل‌شده وجود ندارد                                      | فراداده نشست ACP قدیمی/حذف‌شده است.                                                                                    | با `/acp spawn` دوباره ایجاد کنید، سپس رشته را دوباره متصل/متمرکز کنید.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` نوشتن/اجرا را در نشست ACP غیرتعاملی مسدود می‌کند.                                                    | `plugins.entries.acpx.config.permissionMode` را روی `approve-all` تنظیم کنید و Gateway را راه‌اندازی مجدد کنید. [پیکربندی مجوز](/fa/tools/acp-agents-setup#permission-configuration) را ببینید. |
| نشست ACP زود و با خروجی کم ناموفق می‌شود                                  | درخواست‌های مجوز توسط `permissionMode`/`nonInteractivePermissions` مسدود شده‌اند.                                        | لاگ‌های Gateway را برای `AcpRuntimeError` بررسی کنید. برای مجوزهای کامل، `permissionMode=approve-all` را تنظیم کنید؛ برای افت تدریجی، `nonInteractivePermissions=deny` را تنظیم کنید.        |
| نشست ACP پس از تکمیل کار برای همیشه متوقف می‌ماند                       | فرایند هارنس تمام شده اما نشست ACP تکمیل را گزارش نکرده است.                                                    | OpenClaw را به‌روزرسانی کنید؛ پاک‌سازی فعلی acpx فرایندهای wrapper و آداپتور قدیمی متعلق به OpenClaw را هنگام بستن و راه‌اندازی Gateway جمع‌آوری می‌کند.                                             |
| هارنس `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` را می‌بیند                        | پوشش رویداد داخلی از مرز ACP نشت کرده است.                                                                | OpenClaw را به‌روزرسانی کنید و جریان تکمیل را دوباره اجرا کنید؛ هارنس‌های خارجی باید فقط اعلان‌های تکمیل ساده دریافت کنند.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` به
رله hook بومی Codex مربوط است، نه ACP/acpx. در یک چت Codex متصل‌شده، یک نشست تازه
با `/new` یا `/reset` شروع کنید؛ اگر یک‌بار کار کرد و سپس در فراخوانی ابزار بومی بعدی برگشت،
به‌جای تکرار `/new`، app-server مربوط به Codex یا OpenClaw Gateway را راه‌اندازی مجدد کنید.
[عیب‌یابی هارنس Codex](/fa/plugins/codex-harness#troubleshooting) را ببینید.
</Note>

## مرتبط

- [عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup)
- [ارسال عامل](/fa/tools/agent-send)
- [بک‌اندهای CLI](/fa/gateway/cli-backends)
- [هارنس Codex](/fa/plugins/codex-harness)
- [زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime)
- [ابزارهای sandbox چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (حالت پل)](/fa/cli/acp)
- [زیرعامل‌ها](/fa/tools/subagents)
