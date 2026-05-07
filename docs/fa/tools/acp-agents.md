---
read_when:
    - اجرای هارنس‌های کدنویسی از طریق ACP
    - راه‌اندازی نشست‌های ACP وابسته به مکالمه در کانال‌های پیام‌رسانی
    - پیوند دادن یک گفت‌وگوی کانال پیام به یک نشست پایدار ACP
    - عیب‌یابی بک‌اند ACP، اتصال‌دهی Plugin، یا تحویل تکمیل‌ها
    - اجرای فرمان‌های /acp از چت
sidebarTitle: ACP agents
summary: هارنس‌های کدنویسی خارجی (Claude Code، Cursor، Gemini CLI، Codex ACP صریح، OpenClaw ACP، OpenCode) را از طریق بک‌اند ACP اجرا کنید
title: عامل‌های ACP
x-i18n:
    generated_at: "2026-05-07T13:32:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[نشست‌های Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
به OpenClaw اجازه می‌دهند harnessهای کدنویسی خارجی (برای مثال Pi، Claude Code،
Cursor، Copilot، Droid، OpenClaw ACP، OpenCode، Gemini CLI و دیگر
harnessهای ACPX پشتیبانی‌شده) را از طریق یک Plugin پشتیبان ACP اجرا کند.

هر spawn نشست ACP به‌عنوان یک [وظیفه پس‌زمینه](/fa/automation/tasks) ردیابی می‌شود.

<Note>
**ACP مسیر harness خارجی است، نه مسیر پیش‌فرض Codex.** Plugin
بومی سرور برنامه Codex کنترل‌های `/codex ...` و runtime تعبیه‌شده
`agentRuntime.id: "codex"` را در اختیار دارد؛ ACP کنترل‌های
`/acp ...` و نشست‌های `sessions_spawn({ runtime: "acp" })` را در اختیار دارد.

اگر می‌خواهید Codex یا Claude Code به‌عنوان یک کلاینت MCP خارجی
مستقیما به گفتگوهای کانال موجود OpenClaw متصل شود، به‌جای ACP از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.
</Note>

## کدام صفحه را می‌خواهم؟

| می‌خواهید…                                                                                    | از این استفاده کنید                              | یادداشت‌ها                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex را در گفتگوی فعلی متصل یا کنترل کنید                                               | `/codex bind`, `/codex threads`       | مسیر بومی سرور برنامه Codex وقتی Plugin `codex` فعال است؛ شامل پاسخ‌های گفتگوی متصل‌شده، ارسال تصویر، مدل/سریع/مجوزها، توقف و کنترل‌های هدایت است. ACP یک fallback صریح است |
| Claude Code، Gemini CLI، Codex ACP صریح، یا harness خارجی دیگری را _از طریق_ OpenClaw اجرا کنید | این صفحه                             | نشست‌های متصل به گفتگو، `/acp spawn`، `sessions_spawn({ runtime: "acp" })`، وظایف پس‌زمینه، کنترل‌های runtime                                                                                   |
| یک نشست OpenClaw Gateway را _به‌عنوان_ سرور ACP برای یک ویرایشگر یا کلاینت ارائه کنید                   | [`openclaw acp`](/fa/cli/acp)            | حالت پل. IDE/کلاینت از طریق stdio/WebSocket با ACP با OpenClaw صحبت می‌کند                                                                                                                            |
| یک CLI هوش مصنوعی محلی را به‌عنوان مدل fallback فقط‌متنی دوباره استفاده کنید                                              | [پشتیبان‌های CLI](/fa/gateway/cli-backends) | ACP نیست. بدون ابزارهای OpenClaw، بدون کنترل‌های ACP، بدون runtime harness                                                                                                                               |

## آیا این بدون تنظیمات اضافی کار می‌کند؟

بله، پس از نصب Plugin رسمی runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

checkoutهای سورس می‌توانند پس از `pnpm install` از Plugin workspace محلی
`extensions/acpx` استفاده کنند. برای بررسی آمادگی، `/acp doctor` را اجرا کنید.

OpenClaw فقط زمانی spawn کردن ACP را به عامل‌ها آموزش می‌دهد که ACP **واقعا
قابل استفاده** باشد: ACP باید فعال باشد، dispatch نباید غیرفعال باشد، نشست فعلی
نباید توسط sandbox مسدود شده باشد، و یک پشتیبان runtime باید
بارگذاری شده باشد. اگر این شرایط برقرار نباشد، Skillsهای Plugin ACP و
راهنمای ACP مربوط به `sessions_spawn` پنهان می‌مانند تا عامل یک پشتیبان
غیرقابل‌دسترس را پیشنهاد نکند.

<AccordionGroup>
  <Accordion title="نکات مهم اجرای نخست">
    - اگر `plugins.allow` تنظیم شده باشد، یک فهرست محدودکننده Plugin است و **باید** شامل `acpx` باشد؛ در غیر این صورت پشتیبان ACP نصب‌شده عمدا مسدود می‌شود و `/acp doctor` ورودی گم‌شده allowlist را گزارش می‌کند.
    - adapter مربوط به Codex ACP همراه با Plugin `acpx` آماده می‌شود و در صورت امکان به‌صورت محلی اجرا می‌شود.
    - Codex ACP با یک `CODEX_HOME` ایزوله اجرا می‌شود؛ OpenClaw فقط ورودی‌های پروژه مورد اعتماد را از پیکربندی Codex میزبان کپی می‌کند و به workspace فعال اعتماد می‌کند، در حالی که auth، اعلان‌ها و hookها را روی پیکربندی میزبان باقی می‌گذارد.
    - adapterهای harness هدف دیگر ممکن است همچنان در اولین استفاده با `npx` در صورت نیاز دریافت شوند.
    - auth فروشنده همچنان باید روی میزبان برای آن harness وجود داشته باشد.
    - اگر میزبان npm یا دسترسی شبکه نداشته باشد، دریافت adapter در اجرای نخست تا زمانی که cacheها از قبل گرم شوند یا adapter به روش دیگری نصب شود شکست می‌خورد.

  </Accordion>
  <Accordion title="پیش‌نیازهای runtime">
    ACP یک فرایند harness خارجی واقعی را راه‌اندازی می‌کند. OpenClaw مالک مسیریابی،
    وضعیت وظیفه پس‌زمینه، تحویل، اتصال‌ها و سیاست است؛ harness
    مالک ورود provider، کاتالوگ مدل، رفتار filesystem و
    ابزارهای بومی خود است.

    پیش از مقصر دانستن OpenClaw، بررسی کنید:

    - `/acp doctor` یک پشتیبان فعال و سالم را گزارش می‌کند.
    - وقتی allowlist تنظیم شده است، شناسه هدف توسط `acp.allowedAgents` مجاز است.
    - دستور harness می‌تواند روی میزبان Gateway شروع شود.
    - auth provider برای آن harness وجود دارد (`claude`, `codex`, `gemini`, `opencode`, `droid`, و غیره).
    - مدل انتخاب‌شده برای آن harness وجود دارد - شناسه‌های مدل بین harnessها قابل انتقال نیستند.
    - `cwd` درخواست‌شده وجود دارد و در دسترس است، یا `cwd` را حذف کنید و اجازه دهید پشتیبان از پیش‌فرض خود استفاده کند.
    - حالت مجوز با کار مطابقت دارد. نشست‌های غیرتعاملی نمی‌توانند روی promptهای مجوز بومی کلیک کنند، بنابراین اجراهای کدنویسی سنگین از نظر نوشتن/اجرا معمولا به یک پروفایل مجوز ACPX نیاز دارند که بتواند بدون headless شدن پیش برود.

  </Accordion>
</AccordionGroup>

ابزارهای Plugin OpenClaw و ابزارهای داخلی OpenClaw به‌صورت پیش‌فرض در اختیار
harnessهای ACP قرار نمی‌گیرند. پل‌های MCP صریح را در
[عامل‌های ACP - setup](/fa/tools/acp-agents-setup) فقط زمانی فعال کنید که harness
باید مستقیما آن ابزارها را فراخوانی کند.

## هدف‌های harness پشتیبانی‌شده

با پشتیبان `acpx`، از این شناسه‌های harness به‌عنوان هدف‌های `/acp spawn <id>`
یا `sessions_spawn({ runtime: "acp", agentId: "<id>" })` استفاده کنید:

| شناسه harness | پشتیبان معمول                                | یادداشت‌ها                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | adapter مربوط به Claude Code ACP                        | به auth مربوط به Claude Code روی میزبان نیاز دارد.                                              |
| `codex`    | adapter مربوط به Codex ACP                              | fallback صریح ACP فقط وقتی `/codex` بومی در دسترس نیست یا ACP درخواست شده است. |
| `copilot`  | adapter مربوط به GitHub Copilot ACP                     | به auth مربوط به Copilot CLI/runtime نیاز دارد.                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | اگر نصب محلی entrypoint متفاوتی برای ACP ارائه می‌کند، دستور acpx را override کنید.    |
| `droid`    | Factory Droid CLI                              | به auth مربوط به Factory/Droid یا `FACTORY_API_KEY` در محیط harness نیاز دارد.        |
| `gemini`   | adapter مربوط به Gemini CLI ACP                         | به auth مربوط به Gemini CLI یا تنظیم کلید API نیاز دارد.                                          |
| `iflow`    | iFlow CLI                                      | دسترس‌پذیری adapter و کنترل مدل به CLI نصب‌شده بستگی دارد.                 |
| `kilocode` | Kilo Code CLI                                  | دسترس‌پذیری adapter و کنترل مدل به CLI نصب‌شده بستگی دارد.                 |
| `kimi`     | Kimi/Moonshot CLI                              | به auth مربوط به Kimi/Moonshot روی میزبان نیاز دارد.                                            |
| `kiro`     | Kiro CLI                                       | دسترس‌پذیری adapter و کنترل مدل به CLI نصب‌شده بستگی دارد.                 |
| `opencode` | adapter مربوط به OpenCode ACP                           | به auth مربوط به OpenCode CLI/provider نیاز دارد.                                                |
| `openclaw` | پل OpenClaw Gateway از طریق `openclaw acp` | به یک harness آگاه از ACP اجازه می‌دهد به یک نشست OpenClaw Gateway پاسخ دهد.                 |
| `pi`       | runtime تعبیه‌شده OpenClaw/Pi                   | برای آزمایش‌های harness بومی OpenClaw استفاده می‌شود.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | به auth سازگار با Qwen روی میزبان نیاز دارد.                                          |

aliasهای سفارشی عامل acpx می‌توانند در خود acpx پیکربندی شوند، اما سیاست OpenClaw
همچنان `acp.allowedAgents` و هر نگاشت
`agents.list[].runtime.acp.agent` را پیش از dispatch بررسی می‌کند.

## runbook اپراتور

جریان سریع `/acp` از گفتگو:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، یا
    `/acp spawn codex --bind here` صریح.
  </Step>
  <Step title="کار">
    در گفتگوی یا thread متصل‌شده ادامه دهید (یا کلید نشست را
    به‌صراحت هدف بگیرید).
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
  <Accordion title="جزئیات چرخه عمر">
    - Spawn یک نشست runtime ACP ایجاد یا ازسرگیری می‌کند، metadata مربوط به ACP را در store نشست OpenClaw ثبت می‌کند، و وقتی اجرا مالک والد دارد ممکن است یک وظیفه پس‌زمینه ایجاد کند.
    - نشست‌های ACP با مالک والد حتی وقتی نشست runtime پایدار است به‌عنوان کار پس‌زمینه در نظر گرفته می‌شوند؛ تکمیل و تحویل میان‌سطحی به‌جای رفتار مثل یک نشست گفتگوی عادیِ روبه‌کاربر، از طریق اعلان‌دهنده وظیفه والد انجام می‌شود.
    - نگهداری وظیفه نشست‌های ACP یک‌باره با مالک والد را که terminal یا orphaned هستند می‌بندد. نشست‌های ACP پایدار تا وقتی یک اتصال گفتگوی فعال باقی بماند حفظ می‌شوند؛ نشست‌های پایدار stale بدون اتصال فعال بسته می‌شوند تا پس از اتمام وظیفه مالک یا حذف رکورد وظیفه آن، بی‌سروصدا ازسرگرفته نشوند.
    - پیام‌های پیگیری متصل‌شده تا زمانی که اتصال بسته، unfocus، reset یا منقضی نشده است مستقیما به نشست ACP می‌روند.
    - دستورهای Gateway محلی می‌مانند. `/acp ...`، `/status` و `/unfocus` هرگز به‌عنوان متن prompt عادی به یک harness ACP متصل‌شده ارسال نمی‌شوند.
    - `cancel` وقتی پشتیبان از لغو پشتیبانی کند turn فعال را abort می‌کند؛ binding یا metadata نشست را حذف نمی‌کند.
    - `close` نشست ACP را از دید OpenClaw پایان می‌دهد و binding را حذف می‌کند. اگر یک harness از resume پشتیبانی کند، ممکن است همچنان تاریخچه upstream خودش را نگه دارد.
    - Plugin acpx پس از `close` درخت‌های فرایند wrapper و adapter متعلق به OpenClaw را پاک‌سازی می‌کند و orphanهای ACPX stale متعلق به OpenClaw را هنگام startup Gateway جمع‌آوری می‌کند.
    - workerهای runtime بیکار پس از `acp.runtime.ttlMinutes` واجد شرایط پاک‌سازی هستند؛ metadata نشست ذخیره‌شده برای `/acp sessions` در دسترس می‌ماند.

  </Accordion>
  <Accordion title="قواعد مسیریابی بومی Codex">
    triggerهای زبان طبیعی که وقتی فعال است باید به **Plugin بومی Codex**
    مسیریابی شوند:

    - "این کانال Discord را به Codex متصل کن."
    - "این گفتگو را به thread `<id>` مربوط به Codex attach کن."
    - "threadهای Codex را نشان بده، سپس این یکی را bind کن."

    اتصال بومی مکالمهٔ Codex مسیر پیش‌فرض کنترل چت است.
    ابزارهای پویای OpenClaw همچنان از طریق OpenClaw اجرا می‌شوند، در حالی که
    ابزارهای بومی Codex مانند shell/apply-patch داخل Codex اجرا می‌شوند.
    برای رویدادهای ابزار بومی Codex، OpenClaw در هر نوبت یک بازپخش‌کنندهٔ
    hook بومی تزریق می‌کند تا hookهای Plugin بتوانند `before_tool_call` را مسدود کنند، `after_tool_call` را مشاهده کنند، و رویدادهای Codex `PermissionRequest` را
    از طریق تأییدهای OpenClaw مسیریابی کنند. hookهای Codex `Stop` به
    `before_agent_finalize` در OpenClaw بازپخش می‌شوند؛ جایی که Pluginها می‌توانند پیش از نهایی‌سازی پاسخ توسط Codex، یک
    عبور دیگر مدل را درخواست کنند. این بازپخش‌کننده عامدانه
    محافظه‌کار می‌ماند: آرگومان‌های ابزار بومی Codex را تغییر نمی‌دهد
    و رکوردهای رشتهٔ Codex را بازنویسی نمی‌کند. فقط زمانی از ACP صریح استفاده کنید
    که مدل runtime/session مربوط به ACP را می‌خواهید. مرز پشتیبانی Codex
    تعبیه‌شده در
    [قرارداد پشتیبانی Codex harness v1](/fa/plugins/codex-harness#v1-support-contract) مستند شده است.

  </Accordion>
  <Accordion title="Model / provider / runtime selection cheat sheet">
    - `openai-codex/*` - مسیر مدل قدیمی OAuth/اشتراک Codex که با doctor تعمیر می‌شود.
    - `openai/*` - runtime تعبیه‌شدهٔ app-server بومی Codex برای نوبت‌های agent در OpenAI.
    - `/codex ...` - کنترل مکالمهٔ بومی Codex.
    - `/acp ...` یا `runtime: "acp"` - کنترل صریح ACP/acpx.

  </Accordion>
  <Accordion title="ACP-routing natural-language triggers">
    محرک‌هایی که باید به runtime مربوط به ACP مسیریابی شوند:

    - "این را به‌عنوان یک نشست یک‌بارهٔ Claude Code ACP اجرا کن و نتیجه را خلاصه کن."
    - "برای این کار از Gemini CLI در یک رشته استفاده کن، سپس پیگیری‌ها را در همان رشته نگه دار."
    - "Codex را از طریق ACP در یک رشتهٔ پس‌زمینه اجرا کن."

    OpenClaw مقدار `runtime: "acp"` را انتخاب می‌کند، `agentId` مربوط به harness را حل می‌کند،
    در صورت پشتیبانی به مکالمه یا رشتهٔ فعلی متصل می‌شود، و
    پیگیری‌ها را تا زمان بستن/انقضا به همان نشست مسیریابی می‌کند. Codex فقط
    زمانی این مسیر را دنبال می‌کند که ACP/acpx صریح باشد یا Plugin بومی Codex
    برای عملیات درخواستی در دسترس نباشد.

    برای `sessions_spawn`، مقدار `runtime: "acp"` فقط زمانی اعلام می‌شود که ACP
    فعال باشد، درخواست‌دهنده sandbox نشده باشد، و یک backend مربوط به runtime
    در ACP بارگذاری شده باشد. `acp.dispatch.enabled=false` ارسال خودکار رشتهٔ
    ACP را متوقف می‌کند، اما فراخوانی‌های صریح
    `sessions_spawn({ runtime: "acp" })` را پنهان یا مسدود نمی‌کند. این مورد شناسه‌های ACP harness مانند `codex`,
    `claude`, `droid`, `gemini` یا `opencode` را هدف می‌گیرد. یک شناسهٔ agent پیکربندی معمولی
    OpenClaw از `agents_list` را ارسال نکنید، مگر اینکه آن ورودی
    صراحتاً با `agents.list[].runtime.type="acp"` پیکربندی شده باشد؛
    در غیر این صورت از runtime پیش‌فرض sub-agent استفاده کنید. وقتی یک agent در OpenClaw
    با `runtime.type="acp"` پیکربندی شده باشد، OpenClaw از
    `runtime.acp.agent` به‌عنوان شناسهٔ harness زیربنایی استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## ACP در برابر sub-agentها

زمانی از ACP استفاده کنید که یک runtime مربوط به harness خارجی می‌خواهید. برای اتصال/کنترل مکالمهٔ Codex، وقتی Plugin
`codex` فعال است، از **app-server بومی Codex**
استفاده کنید. وقتی اجراهای واگذارشدهٔ بومی OpenClaw
می‌خواهید، از **sub-agentها** استفاده کنید.

| حوزه          | نشست ACP                           | اجرای sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin مربوط به backend در ACP (برای مثال acpx) | runtime بومی sub-agent در OpenClaw  |
| کلید نشست   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| دستورهای اصلی | `/acp ...`                            | `/subagents ...`                   |
| ابزار spawn    | `sessions_spawn` با `runtime:"acp"` | `sessions_spawn` (runtime پیش‌فرض) |

همچنین [Sub-agents](/fa/tools/subagents) را ببینید.

## ACP چگونه Claude Code را اجرا می‌کند

برای Claude Code از طریق ACP، پشته چنین است:

1. صفحهٔ کنترل نشست ACP در OpenClaw.
2. Plugin رسمی runtime با نام `@openclaw/acpx`.
3. آداپتور Claude ACP.
4. سازوکار runtime/session در سمت Claude.

ACP Claude یک **نشست harness** با کنترل‌های ACP، ازسرگیری نشست،
ردیابی کار پس‌زمینه، و اتصال اختیاری به مکالمه/رشته است.

backendهای CLI runtimeهای fallback محلی فقط‌متنی جداگانه هستند - [Backendهای CLI](/fa/gateway/cli-backends) را ببینید.

برای اپراتورها، قاعدهٔ عملی این است:

- **`/acp spawn`، نشست‌های قابل اتصال، کنترل‌های runtime، یا کار پایدار harness می‌خواهید؟** از ACP استفاده کنید.
- **fallback متنی محلی ساده از طریق CLI خام می‌خواهید؟** از backendهای CLI استفاده کنید.

## نشست‌های متصل

### مدل ذهنی

- **سطح چت** - جایی که افراد به گفت‌وگو ادامه می‌دهند (کانال Discord، موضوع Telegram، چت iMessage).
- **نشست ACP** - وضعیت پایدار runtime در Codex/Claude/Gemini که OpenClaw به آن مسیریابی می‌کند.
- **رشته/موضوع فرزند** - یک سطح پیام‌رسانی اضافی اختیاری که فقط با `--thread ...` ساخته می‌شود.
- **فضای کاری runtime** - مکان filesystem (`cwd`، checkout مخزن، فضای کاری backend) که harness در آن اجرا می‌شود. مستقل از سطح چت است.

### اتصال‌های مکالمهٔ فعلی

`/acp spawn <harness> --bind here` مکالمهٔ فعلی را به نشست ACP
ایجادشده سنجاق می‌کند - بدون رشتهٔ فرزند، با همان سطح چت. OpenClaw همچنان
مالکیت انتقال، احراز هویت، ایمنی و تحویل را حفظ می‌کند. پیام‌های پیگیری در آن
مکالمه به همان نشست مسیریابی می‌شوند؛ `/new` و `/reset` نشست را در همان‌جا
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
    - `--bind here` و `--thread ...` با هم ناسازگارند.
    - `--bind here` فقط روی کانال‌هایی کار می‌کند که اتصال مکالمهٔ فعلی را اعلام می‌کنند؛ در غیر این صورت OpenClaw پیام روشنِ پشتیبانی‌نشدن برمی‌گرداند. اتصال‌ها پس از راه‌اندازی مجدد gateway پایدار می‌مانند.
    - در Discord، `spawnSessions` ایجاد رشتهٔ فرزند برای `--thread auto|here` را کنترل می‌کند - نه `--bind here`.
    - اگر بدون `--cwd` به یک agent متفاوت در ACP spawn کنید، OpenClaw به‌طور پیش‌فرض فضای کاری **agent هدف** را به ارث می‌برد. مسیرهای ارث‌بری‌شدهٔ ناموجود (`ENOENT`/`ENOTDIR`) به پیش‌فرض backend fallback می‌کنند؛ خطاهای دسترسی دیگر (مثلاً `EACCES`) به‌عنوان خطاهای spawn نمایش داده می‌شوند.
    - دستورهای مدیریتی Gateway در مکالمه‌های متصل محلی می‌مانند - دستورهای `/acp ...` توسط OpenClaw پردازش می‌شوند، حتی وقتی متن پیگیری معمولی به نشست ACP متصل مسیریابی می‌شود؛ `/status` و `/unfocus` نیز هر زمان پردازش دستور برای آن سطح فعال باشد محلی می‌مانند.

  </Accordion>
  <Accordion title="Thread-bound sessions">
    وقتی اتصال‌های رشته برای یک آداپتور کانال فعال باشند:

    - OpenClaw یک رشته را به یک نشست ACP هدف متصل می‌کند.
    - پیام‌های پیگیری در آن رشته به نشست ACP متصل مسیریابی می‌شوند.
    - خروجی ACP به همان رشته برگردانده می‌شود.
    - unfocus/close/archive/idle-timeout یا انقضای max-age اتصال را حذف می‌کند.
    - `/acp close`، `/acp cancel`، `/acp status`، `/status` و `/unfocus` دستورهای Gateway هستند، نه promptهایی برای ACP harness.

    feature flagهای لازم برای ACP متصل به رشته:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` به‌طور پیش‌فرض روشن است (برای توقف ارسال خودکار رشتهٔ ACP مقدار `false` بگذارید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند).
    - ایجاد نشست رشته در آداپتور کانال فعال باشد (پیش‌فرض: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    پشتیبانی از اتصال رشته به آداپتور وابسته است. اگر آداپتور کانال فعال
    از اتصال رشته پشتیبانی نکند، OpenClaw پیام روشنِ
    پشتیبانی‌نشدن/در دسترس نبودن برمی‌گرداند.

  </Accordion>
  <Accordion title="Thread-supporting channels">
    - هر آداپتور کانالی که قابلیت اتصال session/thread را ارائه کند.
    - پشتیبانی توکار فعلی: رشته‌ها/کانال‌های **Discord**، موضوع‌های **Telegram** (موضوع‌های انجمن در گروه‌ها/supergroupها و موضوع‌های DM).
    - کانال‌های Plugin می‌توانند از طریق همان رابط اتصال پشتیبانی اضافه کنند.

  </Accordion>
</AccordionGroup>

## اتصال‌های پایدار کانال

برای workflowهای غیرفانی، اتصال‌های پایدار ACP را در
ورودی‌های سطح‌بالای `bindings[]` پیکربندی کنید.

### مدل اتصال

<ParamField path="bindings[].type" type='"acp"'>
  یک اتصال مکالمهٔ پایدار ACP را علامت‌گذاری می‌کند.
</ParamField>
<ParamField path="bindings[].match" type="object">
  مکالمهٔ هدف را شناسایی می‌کند. شکل‌ها بر اساس کانال:

- **کانال/رشتهٔ Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **موضوع انجمن Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/گروه BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های پایدار گروهی، `chat_id:*` یا `chat_identifier:*` را ترجیح دهید.
- **DM/گروه iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های پایدار گروهی، `chat_id:*` را ترجیح دهید.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  شناسهٔ agent مالک در OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  override اختیاری ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  برچسب اختیاری برای اپراتور.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  دایرکتوری کاری اختیاری runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  override اختیاری backend.
</ParamField>

### پیش‌فرض‌های runtime برای هر agent

از `agents.list[].runtime` برای تعریف یک‌بارهٔ پیش‌فرض‌های ACP برای هر agent استفاده کنید:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (شناسهٔ harness، مثلاً `codex` یا `claude`)
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

- OpenClaw پیش از استفاده اطمینان می‌دهد جلسه ACP پیکربندی‌شده وجود دارد.
- پیام‌ها در آن کانال یا موضوع به جلسه ACP پیکربندی‌شده هدایت می‌شوند.
- در گفتگوهای متصل، `/new` و `/reset` همان کلید جلسه ACP را درجا بازنشانی می‌کنند.
- اتصال‌های موقت زمان اجرا، برای مثال اتصال‌هایی که توسط جریان‌های تمرکز بر رشته ایجاد شده‌اند، همچنان هرجا موجود باشند اعمال می‌شوند.
- برای راه‌اندازی‌های ACP میان‌عاملی بدون `cwd` صریح، OpenClaw فضای کاری عامل مقصد را از پیکربندی عامل به ارث می‌برد.
- مسیرهای فضای کاری به‌ارث‌رسیده‌ی مفقود به cwd پیش‌فرض بک‌اند بازمی‌گردند؛ شکست‌های دسترسی غیرمفقود به‌صورت خطاهای راه‌اندازی نمایش داده می‌شوند.

## شروع جلسه‌های ACP

دو روش برای شروع یک جلسه ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    برای شروع یک جلسه ACP از نوبت عامل یا فراخوانی ابزار، از
    `runtime: "acp"` استفاده کنید.

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
    مقدار پیش‌فرض `runtime` برابر `subagent` است، پس برای جلسه‌های ACP
    صراحتا `runtime: "acp"` را تنظیم کنید. اگر `agentId` حذف شود، OpenClaw
    در صورت پیکربندی، از `acp.defaultAgent` استفاده می‌کند. `mode: "session"`
    برای نگه‌داشتن یک گفتگوی متصل پایدار به `thread: true` نیاز دارد.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    برای کنترل صریح اپراتور از چت، از `/acp spawn` استفاده کنید.

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
  پرامپت اولیه‌ای که به جلسه ACP ارسال می‌شود.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  برای جلسه‌های ACP باید `"acp"` باشد.
</ParamField>
<ParamField path="agentId" type="string">
  شناسه هارنس مقصد ACP. اگر `acp.defaultAgent` تنظیم شده باشد، به آن بازمی‌گردد.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  در صورت پشتیبانی، جریان اتصال رشته را درخواست می‌کند.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` یک‌باره است؛ `"session"` پایدار است. اگر `thread: true` باشد و
  `mode` حذف شود، OpenClaw ممکن است بسته به مسیر زمان اجرا، رفتار پایدار را
  به‌عنوان پیش‌فرض انتخاب کند. `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cwd" type="string">
  دایرکتوری کاری زمان اجرای درخواست‌شده (که توسط سیاست بک‌اند/زمان اجرا
  اعتبارسنجی می‌شود). اگر حذف شود، راه‌اندازی ACP در صورت پیکربندی، فضای کاری
  عامل مقصد را به ارث می‌برد؛ مسیرهای به‌ارث‌رسیده‌ی مفقود به پیش‌فرض‌های
  بک‌اند بازمی‌گردند، درحالی‌که خطاهای واقعی دسترسی برگردانده می‌شوند.
</ParamField>
<ParamField path="label" type="string">
  برچسب رو‌به‌اپراتور که در متن جلسه/بنر استفاده می‌شود.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  به‌جای ایجاد یک جلسه جدید، یک جلسه ACP موجود را از سر بگیرید. عامل تاریخچه
  گفتگوی خود را از طریق `session/load` بازپخش می‌کند. به `runtime: "acp"` نیاز دارد.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` خلاصه‌های پیشرفت اجرای اولیه ACP را به‌صورت رویدادهای سیستمی
  به جلسه درخواست‌کننده برمی‌گرداند. پاسخ‌های پذیرفته‌شده شامل `streamLogPath`
  هستند که به یک لاگ JSONL محدود به جلسه اشاره می‌کند
  (`<sessionId>.acp-stream.jsonl`) و می‌توانید آن را برای تاریخچه کامل رله دنبال کنید.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  نوبت فرزند ACP را پس از N ثانیه لغو می‌کند. `0` نوبت را روی مسیر بدون
  مهلت Gateway نگه می‌دارد. همین مقدار روی اجرای Gateway و زمان اجرای ACP
  اعمال می‌شود تا هارنس‌های گیرکرده یا تمام‌شده از نظر سهمیه، مسیر عامل والد را
  برای همیشه اشغال نکنند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی صریح مدل برای جلسه فرزند ACP. راه‌اندازی‌های Codex ACP ارجاع‌های
  OpenClaw Codex مانند `openai-codex/gpt-5.4` را پیش از `session/new` به
  پیکربندی شروع Codex ACP نرمال‌سازی می‌کنند؛ شکل‌های اسلش مانند
  `openai-codex/gpt-5.4/high` همچنین تلاش استدلال Codex ACP را تنظیم می‌کنند.
  هارنس‌های دیگر باید ACP `models` را اعلام کنند و از `session/set_model`
  پشتیبانی کنند؛ در غیر این صورت OpenClaw/acpx به‌جای بازگشت خاموش به پیش‌فرض
  عامل مقصد، با خطایی روشن شکست می‌خورد.
</ParamField>
<ParamField path="thinking" type="string">
  تلاش صریح برای فکرکردن/استدلال. برای Codex ACP، `minimal` به تلاش پایین
  نگاشت می‌شود، `low`/`medium`/`high`/`xhigh` مستقیم نگاشت می‌شوند، و `off`
  بازنویسی شروعِ تلاش استدلال را حذف می‌کند.
</ParamField>

## حالت‌های اتصال راه‌اندازی و رشته

<Tabs>
  <Tab title="--bind here|off">
    | حالت   | رفتار                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | گفتگوی فعال فعلی را درجا متصل می‌کند؛ اگر هیچ گفتگوی فعالی نباشد شکست می‌خورد. |
    | `off`  | اتصال گفتگوی فعلی ایجاد نمی‌کند.                          |

    نکته‌ها:

    - `--bind here` ساده‌ترین مسیر اپراتور برای «پشتوانه‌دار کردن این کانال یا چت با Codex» است.
    - `--bind here` رشته فرزند ایجاد نمی‌کند.
    - `--bind here` فقط روی کانال‌هایی در دسترس است که پشتیبانی اتصال گفتگوی فعلی را ارائه می‌کنند.
    - `--bind` و `--thread` را نمی‌توان در یک فراخوانی `/acp spawn` ترکیب کرد.

  </Tab>
  <Tab title="--thread auto|here|off">
    | حالت   | رفتار                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | در یک رشته فعال: همان رشته را متصل می‌کند. بیرون از رشته: در صورت پشتیبانی، یک رشته فرزند ایجاد/متصل می‌کند. |
    | `here` | به رشته فعال فعلی نیاز دارد؛ اگر داخل یک رشته نباشد شکست می‌خورد.                                                  |
    | `off`  | بدون اتصال. جلسه بدون اتصال شروع می‌شود.                                                                 |

    نکته‌ها:

    - روی سطح‌هایی که اتصال رشته ندارند، رفتار پیش‌فرض عملا `off` است.
    - راه‌اندازی متصل به رشته به پشتیبانی سیاست کانال نیاز دارد:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - وقتی می‌خواهید گفتگوی فعلی را بدون ایجاد رشته فرزند ثابت کنید، از `--bind here` استفاده کنید.

  </Tab>
</Tabs>

## مدل تحویل

جلسه‌های ACP می‌توانند یا فضای کاری تعاملی باشند یا کار پس‌زمینه تحت مالکیت والد.
مسیر تحویل به همین شکل بستگی دارد.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    جلسه‌های تعاملی برای ادامه گفتگو روی یک سطح چت قابل مشاهده طراحی شده‌اند:

    - `/acp spawn ... --bind here` گفتگوی فعلی را به جلسه ACP متصل می‌کند.
    - `/acp spawn ... --thread ...` یک رشته/موضوع کانال را به جلسه ACP متصل می‌کند.
    - `bindings[].type="acp"` پیکربندی‌شده و پایدار، گفتگوهای مطابق را به همان جلسه ACP هدایت می‌کند.

    پیام‌های بعدی در گفتگوی متصل مستقیما به جلسه ACP هدایت می‌شوند، و خروجی ACP
    به همان کانال/رشته/موضوع برگردانده می‌شود.

    آنچه OpenClaw به هارنس ارسال می‌کند:

    - پیگیری‌های متصل معمولی به‌صورت متن پرامپت ارسال می‌شوند، به‌علاوه پیوست‌ها فقط وقتی هارنس/بک‌اند از آن‌ها پشتیبانی کند.
    - دستورهای مدیریتی `/acp` و دستورهای محلی Gateway پیش از ارسال ACP رهگیری می‌شوند.
    - رویدادهای تکمیل تولیدشده در زمان اجرا برای هر مقصد مادی‌سازی می‌شوند. عامل‌های OpenClaw پاکت زمینه زمان اجرای داخلی OpenClaw را دریافت می‌کنند؛ هارنس‌های ACP خارجی یک پرامپت ساده با نتیجه فرزند و دستورالعمل دریافت می‌کنند. پاکت خام `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` هرگز نباید به هارنس‌های خارجی ارسال شود یا به‌عنوان متن رونوشت کاربر ACP پایدار شود.
    - ورودی‌های رونوشت ACP از متن ماشه قابل مشاهده برای کاربر یا پرامپت تکمیل ساده استفاده می‌کنند. فراداده رویداد داخلی تا جای ممکن در OpenClaw ساختاریافته می‌ماند و به‌عنوان محتوای چت نوشته‌شده توسط کاربر تلقی نمی‌شود.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    جلسه‌های ACP یک‌باره که توسط اجرای عامل دیگری راه‌اندازی می‌شوند، فرزندهای
    پس‌زمینه هستند، مشابه زیرعامل‌ها:

    - والد با `sessions_spawn({ runtime: "acp", mode: "run" })` درخواست کار می‌کند.
    - فرزند در جلسه هارنس ACP خودش اجرا می‌شود.
    - نوبت‌های فرزند روی همان مسیر پس‌زمینه‌ای اجرا می‌شوند که راه‌اندازی‌های زیرعامل بومی از آن استفاده می‌کنند، پس یک هارنس ACP کند کار نامرتبط جلسه اصلی را مسدود نمی‌کند.
    - گزارش تکمیل از مسیر اعلام تکمیل وظیفه برمی‌گردد. OpenClaw پیش از ارسال به هارنس خارجی، فراداده تکمیل داخلی را به یک پرامپت ACP ساده تبدیل می‌کند، بنابراین هارنس‌ها نشانگرهای زمینه زمان اجرای مخصوص OpenClaw را نمی‌بینند.
    - وقتی پاسخ رو‌به‌کاربر مفید باشد، والد نتیجه فرزند را با صدای عادی دستیار بازنویسی می‌کند.

    این مسیر را به‌عنوان چت همتابه‌همتا میان والد و فرزند تلقی نکنید. فرزند از قبل
    یک کانال تکمیل برای بازگشت به والد دارد.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` می‌تواند پس از راه‌اندازی، جلسه دیگری را هدف بگیرد. برای
    جلسه‌های همتای معمولی، OpenClaw پس از تزریق پیام از یک مسیر پیگیری
    عامل‌به‌عامل (A2A) استفاده می‌کند:

    - منتظر پاسخ جلسه مقصد بماند.
    - در صورت نیاز اجازه دهد درخواست‌کننده و مقصد تعداد محدودی نوبت پیگیری ردوبدل کنند.
    - از مقصد بخواهد یک پیام اعلام تولید کند.
    - آن اعلام را به کانال یا رشته قابل مشاهده تحویل دهد.

    این مسیر A2A یک جایگزین برای ارسال‌های همتاست که فرستنده در آن‌ها به یک
    پیگیری قابل مشاهده نیاز دارد. وقتی یک جلسه نامرتبط بتواند مقصد ACP را ببیند
    و به آن پیام بدهد، مثلا تحت تنظیمات گسترده `tools.sessions.visibility`،
    همچنان فعال می‌ماند.

    OpenClaw فقط زمانی پیگیری A2A را رد می‌کند که درخواست‌کننده والد فرزند
    ACP یک‌باره و تحت مالکیت والد خودش باشد. در آن حالت، اجرای A2A روی تکمیل
    وظیفه می‌تواند والد را با نتیجه فرزند بیدار کند، پاسخ والد را دوباره به
    فرزند بفرستد، و یک حلقه پژواک والد/فرزند ایجاد کند. نتیجه `sessions_send`
    برای این مورد فرزندِ تحت مالکیت، `delivery.status="skipped"` را گزارش می‌کند،
    چون مسیر تکمیل از قبل مسئول نتیجه است.

  </Accordion>
  <Accordion title="Resume an existing session">
    برای ادامه یک جلسه ACP قبلی به‌جای شروع تازه، از `resumeSessionId` استفاده کنید.
    عامل تاریخچه گفتگوی خود را از طریق `session/load` بازپخش می‌کند، پس با زمینه
    کامل آنچه پیش‌تر اتفاق افتاده ادامه می‌دهد.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    موارد استفاده رایج:

    - انتقال یک جلسه Codex از لپ‌تاپ به تلفن - به عامل خود بگویید از همان‌جایی که رها کرده‌اید ادامه دهد.
    - ادامه یک جلسه کدنویسی که به‌صورت تعاملی در CLI شروع کرده‌اید، اکنون به‌صورت بدون رابط از طریق عامل خود.
    - ادامه کاری که با راه‌اندازی مجدد Gateway یا پایان مهلت بیکاری قطع شده بود.

    نکته‌ها:

    - `resumeSessionId` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ زمان اجرای پیش‌فرض زیرعامل این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `streamTo` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ زمان اجرای پیش‌فرض زیرعامل این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `resumeSessionId` یک شناسه ازسرگیری ACP/هارنس محلیِ میزبان است، نه کلید جلسه کانال OpenClaw؛ OpenClaw همچنان پیش از ارسال، سیاست راه‌اندازی ACP و سیاست عامل مقصد را بررسی می‌کند، درحالی‌که بک‌اند یا هارنس ACP مالک مجوزدهی برای بارگذاری آن شناسه بالادستی است.
    - `resumeSessionId` تاریخچه گفتگوی ACP بالادستی را بازیابی می‌کند؛ `thread` و `mode` همچنان طبق معمول روی جلسه OpenClaw جدیدی که ایجاد می‌کنید اعمال می‌شوند، پس `mode: "session"` همچنان به `thread: true` نیاز دارد.
    - عامل مقصد باید از `session/load` پشتیبانی کند (Codex و Claude Code این کار را می‌کنند).
    - اگر شناسه جلسه پیدا نشود، راه‌اندازی با خطایی روشن شکست می‌خورد - بدون بازگشت خاموش به جلسه جدید.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    پس از استقرار Gateway، به‌جای اعتماد به تست‌های واحد، یک بررسی زنده سرتاسری اجرا کنید:

    1. نسخه و commit مربوط به Gateway مستقرشده را روی میزبان هدف بررسی کنید.
    2. یک نشست موقت پل ACPX به یک عامل زنده باز کنید.
    3. از آن عامل بخواهید `sessions_spawn` را با `runtime: "acp"`، `agentId: "codex"`، `mode: "run"`، و وظیفه `Reply with exactly LIVE-ACP-SPAWN-OK` فراخوانی کند.
    4. `accepted=yes`، یک `childSessionKey` واقعی، و نبود خطای اعتبارسنج را بررسی کنید.
    5. نشست موقت پل را پاک‌سازی کنید.

    gate را روی `mode: "run"` نگه دارید و `streamTo: "parent"` را نادیده بگیرید -
    `mode: "session"` متصل به رشته و مسیرهای stream-relay گذرهای یکپارچه‌سازی
    غنی‌تر و جداگانه‌ای هستند.

  </Accordion>
</AccordionGroup>

## سازگاری sandbox

نشست‌های ACP در حال حاضر روی runtime میزبان اجرا می‌شوند، **نه** داخل
sandbox مربوط به OpenClaw.

<Warning>
**مرز امنیتی:**

- harness خارجی می‌تواند مطابق مجوزهای CLI خودش و `cwd` انتخاب‌شده خواندن/نوشتن انجام دهد.
- سیاست sandbox مربوط به OpenClaw اجرای harness مربوط به ACP را پوشش **نمی‌دهد**.
- OpenClaw همچنان gateهای قابلیت ACP، عامل‌های مجاز، مالکیت نشست، اتصال‌های کانال، و سیاست تحویل Gateway را اعمال می‌کند.
- برای کار OpenClaw-native که با sandbox اعمال می‌شود از `runtime: "subagent"` استفاده کنید.

</Warning>

محدودیت‌های فعلی:

- اگر نشست درخواست‌کننده sandbox شده باشد، spawnهای ACP هم برای `sessions_spawn({ runtime: "acp" })` و هم برای `/acp spawn` مسدود می‌شوند.
- `sessions_spawn` با `runtime: "acp"` از `sandbox: "require"` پشتیبانی نمی‌کند.

## تشخیص هدف نشست

بیشتر کنش‌های `/acp` یک هدف نشست اختیاری (`session-key`،
`session-id`، یا `session-label`) می‌پذیرند.

**ترتیب تشخیص:**

1. آرگومان هدف صریح (یا `--session` برای `/acp steer`)
   - ابتدا کلید را امتحان می‌کند
   - سپس شناسه نشست با شکل UUID
   - سپس برچسب
2. اتصال رشته فعلی (اگر این گفتگو/رشته به یک نشست ACP متصل باشد).
3. fallback به نشست درخواست‌کننده فعلی.

اتصال‌های گفتگوی فعلی و اتصال‌های رشته هر دو در
مرحله 2 مشارکت دارند.

اگر هیچ هدفی تشخیص داده نشود، OpenClaw یک خطای روشن برمی‌گرداند
(`Unable to resolve session target: ...`).

## کنترل‌های ACP

| فرمان              | کاری که انجام می‌دهد                                              | مثال                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | نشست ACP ایجاد می‌کند؛ با اتصال فعلی یا اتصال رشته اختیاری. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | نوبت در حال اجرا را برای نشست هدف لغو می‌کند.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | دستور هدایت را به نشست در حال اجرا می‌فرستد.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | نشست را می‌بندد و هدف‌های رشته را جدا می‌کند.                  | `/acp close`                                                  |
| `/acp status`        | backend، حالت، وضعیت، گزینه‌های runtime، و قابلیت‌ها را نشان می‌دهد. | `/acp status`                                                 |
| `/acp set-mode`      | حالت runtime را برای نشست هدف تنظیم می‌کند.                      | `/acp set-mode plan`                                          |
| `/acp set`           | گزینه پیکربندی runtime عمومی را می‌نویسد.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | override دایرکتوری کاری runtime را تنظیم می‌کند.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | پروفایل سیاست تأیید را تنظیم می‌کند.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | timeout مربوط به runtime را تنظیم می‌کند (ثانیه).                            | `/acp timeout 120`                                            |
| `/acp model`         | override مدل runtime را تنظیم می‌کند.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | overrideهای گزینه runtime نشست را حذف می‌کند.                  | `/acp reset-options`                                          |
| `/acp sessions`      | نشست‌های اخیر ACP را از store فهرست می‌کند.                      | `/acp sessions`                                               |
| `/acp doctor`        | سلامت backend، قابلیت‌ها، و اصلاحات قابل اقدام را نشان می‌دهد.           | `/acp doctor`                                                 |
| `/acp install`       | مراحل نصب و فعال‌سازی قطعی را چاپ می‌کند.             | `/acp install`                                                |

`/acp status` گزینه‌های runtime مؤثر به‌همراه شناسه‌های نشست در سطح runtime و
سطح backend را نشان می‌دهد. وقتی یک backend قابلیتی نداشته باشد، خطاهای
کنترل پشتیبانی‌نشده به‌روشنی نمایش داده می‌شوند. `/acp sessions`
store را برای نشست فعلی متصل یا درخواست‌کننده می‌خواند؛ tokenهای هدف
(`session-key`، `session-id`، یا `session-label`) از طریق
کشف نشست Gateway تشخیص داده می‌شوند، از جمله ریشه‌های سفارشی `session.store`
به‌ازای هر عامل.

### نگاشت گزینه‌های runtime

`/acp` فرمان‌های میان‌بر و یک setter عمومی دارد. عملیات معادل:

| فرمان                      | به این نگاشت می‌شود                              | نکات                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | کلید پیکربندی runtime با نام `model`           | برای Codex ACP، OpenClaw مقدار `openai-codex/<model>` را به شناسه مدل adapter نرمال‌سازی می‌کند و suffixهای reasoning با slash مانند `openai-codex/gpt-5.4/high` را به `reasoning_effort` نگاشت می‌کند. |
| `/acp set thinking <level>`  | کلید پیکربندی runtime با نام `thinking`        | برای Codex ACP، OpenClaw در جایی که adapter پشتیبانی کند `reasoning_effort` متناظر را می‌فرستد.                                                                             |
| `/acp permissions <profile>` | کلید پیکربندی runtime با نام `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | کلید پیکربندی runtime با نام `timeout`         | -                                                                                                                                                                              |
| `/acp cwd <path>`            | override مربوط به cwd در runtime                 | به‌روزرسانی مستقیم.                                                                                                                                                                 |
| `/acp set <key> <value>`     | عمومی                              | `key=cwd` از مسیر override مربوط به cwd استفاده می‌کند.                                                                                                                                          |
| `/acp reset-options`         | همه overrideهای runtime را پاک می‌کند         | -                                                                                                                                                                              |

## harness مربوط به acpx، راه‌اندازی plugin، و مجوزها

برای پیکربندی harness مربوط به acpx (aliasهای Claude Code / Codex / Gemini CLI)،
پل‌های MCP مربوط به plugin-tools و OpenClaw-tools، و حالت‌های مجوز ACP، ببینید
[عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup).

## عیب‌یابی

| نشانه                                                                     | علت محتمل                                                                                                           | راه‌حل                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin بک‌اند وجود ندارد، غیرفعال است، یا توسط `plugins.allow` مسدود شده است.                                                       | Plugin بک‌اند را نصب و فعال کنید، وقتی این فهرست مجاز تنظیم شده است `acpx` را در `plugins.allow` بگنجانید، سپس `/acp doctor` را اجرا کنید.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP به‌صورت سراسری غیرفعال شده است.                                                                                                 | `acp.enabled=true` را تنظیم کنید.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | ارسال خودکار از پیام‌های عادی رشته غیرفعال است.                                                               | برای ازسرگیری مسیریابی خودکار رشته، `acp.dispatch.enabled=true` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent در فهرست مجاز نیست.                                                                                                | از `agentId` مجاز استفاده کنید یا `acp.allowedAgents` را به‌روزرسانی کنید.                                                                                                                     |
| `/acp doctor` بلافاصله پس از راه‌اندازی آماده نبودن بک‌اند را گزارش می‌دهد                 | Plugin بک‌اند وجود ندارد، غیرفعال است، توسط سیاست اجازه/رد مسدود شده است، یا فایل اجرایی پیکربندی‌شده آن در دسترس نیست.        | Plugin بک‌اند را نصب/فعال کنید، `/acp doctor` را دوباره اجرا کنید، و اگر همچنان ناسالم بود خطای نصب بک‌اند یا سیاست را بررسی کنید.                                           |
| فرمان هارنس پیدا نشد                                                   | CLI آداپتور نصب نیست، Plugin خارجی وجود ندارد، یا دریافت نخستین اجرای `npx` برای یک آداپتور غیر Codex شکست خورده است. | `/acp doctor` را اجرا کنید، آداپتور را روی میزبان Gateway نصب/از پیش آماده کنید، یا فرمان agent در acpx را به‌صراحت پیکربندی کنید.                                                      |
| خطای model-not-found از هارنس                                            | شناسه مدل برای ارائه‌دهنده/هارنس دیگری معتبر است، اما برای این هدف ACP معتبر نیست.                                                | از مدلی استفاده کنید که آن هارنس فهرست کرده است، مدل را در هارنس پیکربندی کنید، یا بازنویسی را حذف کنید.                                                                            |
| خطای احراز هویت فروشنده از هارنس                                          | OpenClaw سالم است، اما CLI/ارائه‌دهنده هدف وارد نشده است.                                                     | وارد شوید یا کلید ارائه‌دهنده موردنیاز را در محیط میزبان Gateway فراهم کنید.                                                                                             |
| `Unable to resolve session target: ...`                                     | توکن کلید/شناسه/برچسب نادرست است.                                                                                                | `/acp sessions` را اجرا کنید، کلید/برچسب دقیق را کپی کنید، و دوباره تلاش کنید.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` بدون یک گفت‌وگوی فعال قابل اتصال استفاده شده است.                                                            | به چت/کانال هدف بروید و دوباره تلاش کنید، یا از spawn بدون اتصال استفاده کنید.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | آداپتور قابلیت اتصال ACP برای گفت‌وگوی فعلی را ندارد.                                                             | در صورت پشتیبانی، از `/acp spawn ... --thread ...` استفاده کنید، `bindings[]` سطح بالا را پیکربندی کنید، یا به یک کانال پشتیبانی‌شده بروید.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` خارج از زمینه رشته استفاده شده است.                                                                         | به رشته هدف بروید یا از `--thread auto`/`off` استفاده کنید.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | کاربر دیگری مالک هدف اتصال فعال است.                                                                           | به‌عنوان مالک دوباره متصل کنید یا از گفت‌وگو یا رشته دیگری استفاده کنید.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | آداپتور قابلیت اتصال رشته را ندارد.                                                                               | از `--thread off` استفاده کنید یا به آداپتور/کانال پشتیبانی‌شده بروید.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | runtime در ACP سمت میزبان است؛ جلسه درخواست‌کننده sandbox شده است.                                                              | از `runtime="subagent"` در جلسه‌های sandbox شده استفاده کنید، یا ACP spawn را از یک جلسه غیر sandbox شده اجرا کنید.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` برای runtime در ACP درخواست شده است.                                                                         | برای sandboxing الزامی از `runtime="subagent"` استفاده کنید، یا ACP را با `sandbox="inherit"` از یک جلسه غیر sandbox شده به کار ببرید.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | هارنس هدف جابه‌جایی عمومی مدل ACP را در معرض قرار نمی‌دهد.                                                        | از هارنسی استفاده کنید که ACP `models`/`session/set_model` را اعلام می‌کند، از ارجاع‌های مدل ACP در Codex استفاده کنید، یا اگر هارنس پرچم راه‌اندازی خودش را دارد، مدل را مستقیما در همان هارنس پیکربندی کنید. |
| فراداده ACP برای جلسه متصل‌شده وجود ندارد                                      | فراداده جلسه ACP قدیمی/حذف‌شده است.                                                                                    | با `/acp spawn` دوباره ایجاد کنید، سپس رشته را دوباره متصل/متمرکز کنید.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` نوشتن/اجرا را در جلسه ACP غیرتعاملی مسدود می‌کند.                                                    | `plugins.entries.acpx.config.permissionMode` را روی `approve-all` تنظیم کنید و Gateway را بازراه‌اندازی کنید. [پیکربندی مجوز](/fa/tools/acp-agents-setup#permission-configuration) را ببینید. |
| جلسه ACP زودهنگام و با خروجی کم شکست می‌خورد                                  | درخواست‌های مجوز توسط `permissionMode`/`nonInteractivePermissions` مسدود شده‌اند.                                        | لاگ‌های Gateway را برای `AcpRuntimeError` بررسی کنید. برای مجوزهای کامل، `permissionMode=approve-all` را تنظیم کنید؛ برای کاهش قابلیت با رفتار مناسب، `nonInteractivePermissions=deny` را تنظیم کنید.        |
| جلسه ACP پس از تکمیل کار برای همیشه متوقف می‌ماند                       | فرایند هارنس تمام شده، اما جلسه ACP تکمیل را گزارش نکرده است.                                                    | OpenClaw را به‌روزرسانی کنید؛ پاک‌سازی فعلی acpx فرایندهای wrapper و آداپتور قدیمی متعلق به OpenClaw را هنگام بستن و راه‌اندازی Gateway جمع‌آوری می‌کند.                                             |
| هارنس `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` را می‌بیند                        | پوش رویداد داخلی از مرز ACP نشت کرده است.                                                                | OpenClaw را به‌روزرسانی کنید و جریان تکمیل را دوباره اجرا کنید؛ هارنس‌های خارجی باید فقط promptهای تکمیل ساده دریافت کنند.                                                          |

## مرتبط

- [agentهای ACP - راه‌اندازی](/fa/tools/acp-agents-setup)
- [ارسال agent](/fa/tools/agent-send)
- [بک‌اندهای CLI](/fa/gateway/cli-backends)
- [هارنس Codex](/fa/plugins/codex-harness)
- [ابزارهای sandbox چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (حالت bridge)](/fa/cli/acp)
- [Sub-agentها](/fa/tools/subagents)
