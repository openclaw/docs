---
read_when:
    - اجرای هارنس‌های کدنویسی از طریق ACP
    - راه‌اندازی نشست‌های ACP وابسته به مکالمه در کانال‌های پیام‌رسانی
    - پیوند دادن یک گفت‌وگوی کانال پیام به یک نشست پایدار ACP
    - عیب‌یابی بک‌اند ACP، اتصال‌دهی Plugin، یا تحویل تکمیل
    - اجرای فرمان‌های /acp از طریق چت
sidebarTitle: ACP agents
summary: هارنس‌های کدنویسی خارجی (Claude Code، Cursor، Gemini CLI، ACP صریح Codex، OpenClaw ACP، OpenCode) را از طریق بک‌اند ACP اجرا کنید
title: عامل‌های ACP
x-i18n:
    generated_at: "2026-05-10T20:08:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

[جلسات Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
به OpenClaw اجازه می‌دهند هارنس‌های کدنویسی خارجی (برای مثال Pi، Claude Code،
Cursor، Copilot، Droid، OpenClaw ACP، OpenCode، Gemini CLI و دیگر
هارنس‌های ACPX پشتیبانی‌شده) را از طریق یک Plugin بک‌اند ACP اجرا کند.

هر ایجاد جلسه ACP به‌عنوان یک [وظیفه پس‌زمینه](/fa/automation/tasks) ردیابی می‌شود.

<Note>
**ACP مسیر هارنس خارجی است، نه مسیر پیش‌فرض Codex.** Plugin
سرور برنامه بومی Codex کنترل‌های `/codex ...` و runtime تعبیه‌شده پیش‌فرض
`openai/gpt-*` برای نوبت‌های عامل را مالک است؛ ACP کنترل‌های
`/acp ...` و جلسات `sessions_spawn({ runtime: "acp" })` را مالک است.

اگر می‌خواهید Codex یا Claude Code به‌عنوان یک کلاینت MCP خارجی
مستقیماً به گفتگوهای کانال موجود OpenClaw وصل شود، به‌جای ACP از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.
</Note>

## کدام صفحه را می‌خواهم؟

| می‌خواهید…                                                                                      | از این استفاده کنید                    | یادداشت‌ها                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex را در گفتگوی فعلی متصل یا کنترل کنید                                                     | `/codex bind`, `/codex threads`       | مسیر سرور برنامه بومی Codex وقتی Plugin `codex` فعال است؛ شامل پاسخ‌های چت متصل، ارسال تصویر، model/fast/permissions، توقف، و کنترل‌های هدایت. ACP یک جایگزین صریح است |
| Claude Code، Gemini CLI، Codex ACP صریح، یا هارنس خارجی دیگری را _از طریق_ OpenClaw اجرا کنید | این صفحه                             | جلسات متصل به چت، `/acp spawn`، `sessions_spawn({ runtime: "acp" })`، وظایف پس‌زمینه، کنترل‌های runtime                                                                                   |
| یک جلسه OpenClaw Gateway را _به‌عنوان_ یک سرور ACP برای ویرایشگر یا کلاینت ارائه کنید          | [`openclaw acp`](/fa/cli/acp)            | حالت پل. IDE/کلاینت از طریق stdio/WebSocket با ACP به OpenClaw صحبت می‌کند                                                                                                                            |
| از یک CLI هوش مصنوعی محلی به‌عنوان مدل جایگزین فقط‌متنی استفاده کنید                          | [بک‌اندهای CLI](/fa/gateway/cli-backends) | ACP نیست. بدون ابزارهای OpenClaw، بدون کنترل‌های ACP، بدون runtime هارنس                                                                                                                               |

## آیا این به‌صورت آماده کار می‌کند؟

بله، پس از نصب Plugin رسمی runtime مربوط به ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

checkoutهای منبع می‌توانند پس از `pnpm install` از Plugin فضای کاری محلی
`extensions/acpx` استفاده کنند. برای بررسی آمادگی، `/acp doctor` را اجرا کنید.

OpenClaw فقط زمانی ایجاد ACP را به عامل‌ها آموزش می‌دهد که ACP **واقعاً
قابل استفاده** باشد: ACP باید فعال باشد، dispatch نباید غیرفعال باشد، جلسه فعلی
نباید توسط sandbox مسدود شده باشد، و یک بک‌اند runtime باید
بارگذاری شده باشد. اگر این شرایط برقرار نباشند، Skills مربوط به Plugin ACP و
راهنمای ACP در `sessions_spawn` پنهان می‌مانند تا عامل یک بک‌اند
غیرقابل‌دسترس را پیشنهاد نکند.

<AccordionGroup>
  <Accordion title="نکات مهم اجرای نخست">
    - اگر `plugins.allow` تنظیم شده باشد، یک فهرست محدودکننده Plugin است و **باید** شامل `acpx` باشد؛ در غیر این صورت بک‌اند ACP نصب‌شده عمداً مسدود می‌شود و `/acp doctor` ورودی allowlist گمشده را گزارش می‌کند.
    - آداپتور Codex ACP همراه با Plugin `acpx` آماده‌سازی می‌شود و در صورت امکان به‌صورت محلی اجرا می‌شود.
    - Codex ACP با یک `CODEX_HOME` جداگانه اجرا می‌شود؛ OpenClaw فقط ورودی‌های پروژه مورد اعتماد را از پیکربندی Codex میزبان کپی می‌کند و به فضای کاری فعال اعتماد می‌کند، در حالی که auth، اعلان‌ها و hookها را روی پیکربندی میزبان نگه می‌دارد.
    - آداپتورهای دیگر هارنس مقصد ممکن است همچنان در نخستین استفاده با `npx` در صورت نیاز دریافت شوند.
    - auth فروشنده همچنان باید برای آن هارنس روی میزبان وجود داشته باشد.
    - اگر میزبان npm یا دسترسی شبکه نداشته باشد، دریافت آداپتور در اجرای نخست تا زمانی که cacheها از قبل آماده شوند یا آداپتور به روش دیگری نصب شود شکست می‌خورد.

  </Accordion>
  <Accordion title="پیش‌نیازهای runtime">
    ACP یک فرایند هارنس خارجی واقعی را اجرا می‌کند. OpenClaw مالک مسیریابی،
    وضعیت وظیفه پس‌زمینه، تحویل، اتصال‌ها و policy است؛ هارنس
    مالک ورود provider، کاتالوگ مدل، رفتار فایل‌سیستم و
    ابزارهای بومی خود است.

    پیش از مقصر دانستن OpenClaw، بررسی کنید:

    - `/acp doctor` یک بک‌اند فعال و سالم گزارش می‌کند.
    - وقتی allowlist تنظیم شده باشد، شناسه مقصد توسط `acp.allowedAgents` مجاز است.
    - فرمان هارنس می‌تواند روی میزبان Gateway شروع شود.
    - auth provider برای آن هارنس وجود دارد (`claude`, `codex`, `gemini`, `opencode`, `droid`, و غیره).
    - مدل انتخاب‌شده برای آن هارنس وجود دارد - شناسه‌های مدل بین هارنس‌ها قابل حمل نیستند.
    - `cwd` درخواستی وجود دارد و قابل دسترسی است، یا `cwd` را حذف کنید و بگذارید بک‌اند از پیش‌فرض خود استفاده کند.
    - حالت مجوز با کار سازگار است. جلسات غیرتعاملی نمی‌توانند روی promptهای مجوز بومی کلیک کنند، بنابراین اجرای کدنویسی سنگین از نظر نوشتن/اجرا معمولاً به یک پروفایل مجوز ACPX نیاز دارد که بتواند بدون حضور کاربر ادامه دهد.

  </Accordion>
</AccordionGroup>

ابزارهای Plugin OpenClaw و ابزارهای داخلی OpenClaw به‌صورت پیش‌فرض در معرض
هارنس‌های ACP قرار نمی‌گیرند. پل‌های MCP صریح را در
[عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup) فقط زمانی فعال کنید که هارنس
باید آن ابزارها را مستقیماً فراخوانی کند.

## اهداف هارنس پشتیبانی‌شده

با بک‌اند `acpx`، از این شناسه‌های هارنس به‌عنوان هدف‌های `/acp spawn <id>`
یا `sessions_spawn({ runtime: "acp", agentId: "<id>" })` استفاده کنید:

| شناسه هارنس | بک‌اند معمول                                  | یادداشت‌ها                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | آداپتور Claude Code ACP                        | به auth مربوط به Claude Code روی میزبان نیاز دارد.                                              |
| `codex`    | آداپتور Codex ACP                              | فقط وقتی `/codex` بومی در دسترس نیست یا ACP درخواست شده است، جایگزین صریح ACP است. |
| `copilot`  | آداپتور GitHub Copilot ACP                     | به auth مربوط به Copilot CLI/runtime نیاز دارد.                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | اگر نصب محلی entrypoint متفاوتی برای ACP ارائه می‌کند، فرمان acpx را بازنویسی کنید.    |
| `droid`    | Factory Droid CLI                              | به auth مربوط به Factory/Droid یا `FACTORY_API_KEY` در محیط هارنس نیاز دارد.        |
| `gemini`   | آداپتور Gemini CLI ACP                         | به auth مربوط به Gemini CLI یا راه‌اندازی کلید API نیاز دارد.                                          |
| `iflow`    | iFlow CLI                                      | دسترس‌پذیری آداپتور و کنترل مدل به CLI نصب‌شده بستگی دارد.                 |
| `kilocode` | Kilo Code CLI                                  | دسترس‌پذیری آداپتور و کنترل مدل به CLI نصب‌شده بستگی دارد.                 |
| `kimi`     | Kimi/Moonshot CLI                              | به auth مربوط به Kimi/Moonshot روی میزبان نیاز دارد.                                            |
| `kiro`     | Kiro CLI                                       | دسترس‌پذیری آداپتور و کنترل مدل به CLI نصب‌شده بستگی دارد.                 |
| `opencode` | آداپتور OpenCode ACP                           | به auth مربوط به OpenCode CLI/provider نیاز دارد.                                                |
| `openclaw` | پل OpenClaw Gateway از طریق `openclaw acp` | به یک هارنس سازگار با ACP اجازه می‌دهد با یک جلسه OpenClaw Gateway صحبت کند.                 |
| `pi`       | runtime تعبیه‌شده Pi/OpenClaw                   | برای آزمایش‌های هارنس بومی OpenClaw استفاده می‌شود.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | به auth سازگار با Qwen روی میزبان نیاز دارد.                                          |

نام‌های مستعار سفارشی عامل acpx می‌توانند در خود acpx پیکربندی شوند، اما policy
OpenClaw همچنان `acp.allowedAgents` و هر نگاشت
`agents.list[].runtime.acp.agent` را پیش از dispatch بررسی می‌کند.

## runbook اپراتور

جریان سریع `/acp` از چت:

<Steps>
  <Step title="ایجاد">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، یا به‌صورت صریح
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="کار">
    در گفتگوی متصل یا thread ادامه دهید (یا کلید جلسه را
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
    `/acp cancel` (نوبت فعلی) یا `/acp close` (جلسه + اتصال‌ها).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="جزئیات چرخه عمر">
    - ایجاد، یک جلسه runtime مربوط به ACP را می‌سازد یا از سر می‌گیرد، metadata مربوط به ACP را در store جلسه OpenClaw ثبت می‌کند، و ممکن است وقتی اجرا متعلق به والد است یک وظیفه پس‌زمینه بسازد.
    - جلسات ACP متعلق به والد حتی وقتی جلسه runtime پایدار است به‌عنوان کار پس‌زمینه در نظر گرفته می‌شوند؛ تکمیل و تحویل میان سطحی از طریق اعلان‌دهنده وظیفه والد انجام می‌شود، نه مانند یک جلسه چت معمولی رو به کاربر.
    - نگهداری وظیفه، جلسات ACP یک‌باره متعلق به والد را که terminal یا orphaned هستند می‌بندد. جلسات ACP پایدار تا وقتی یک اتصال گفتگوی فعال باقی بماند حفظ می‌شوند؛ جلسات پایدار قدیمی بدون اتصال فعال بسته می‌شوند تا پس از پایان وظیفه مالک یا حذف رکورد وظیفه آن، بی‌صدا از سر گرفته نشوند.
    - پیام‌های پیگیری متصل تا زمانی که اتصال بسته، از فوکوس خارج، reset، یا منقضی شود مستقیماً به جلسه ACP می‌روند.
    - فرمان‌های Gateway محلی می‌مانند. `/acp ...`، `/status` و `/unfocus` هرگز به‌عنوان متن prompt معمولی به هارنس ACP متصل ارسال نمی‌شوند.
    - `cancel` وقتی بک‌اند از لغو پشتیبانی کند نوبت فعال را متوقف می‌کند؛ metadata اتصال یا جلسه را حذف نمی‌کند.
    - `close` از دید OpenClaw جلسه ACP را پایان می‌دهد و اتصال را حذف می‌کند. اگر هارنس از resume پشتیبانی کند، ممکن است همچنان تاریخچه بالادستی خودش را نگه دارد.
    - Plugin acpx پس از `close` درخت‌های فرایند wrapper و آداپتور متعلق به OpenClaw را پاک‌سازی می‌کند، و هنگام راه‌اندازی Gateway فرایندهای orphaned قدیمی ACPX متعلق به OpenClaw را جمع‌آوری می‌کند.
    - workerهای runtime بیکار پس از `acp.runtime.ttlMinutes` واجد شرایط پاک‌سازی هستند؛ metadata ذخیره‌شده جلسه برای `/acp sessions` در دسترس می‌ماند.

  </Accordion>
  <Accordion title="قواعد مسیریابی Codex بومی">
    triggerهای زبان طبیعی که باید وقتی فعال است به **Plugin بومی Codex**
    مسیریابی شوند:

    - «این کانال Discord را به Codex متصل کن.»
    - «این چت را به thread `<id>` در Codex وصل کن.»
    - «threadهای Codex را نشان بده، سپس این یکی را متصل کن.»

    اتصال مکالمه بومی Codex مسیر پیش‌فرض کنترل چت است.
    ابزارهای پویای OpenClaw همچنان از طریق OpenClaw اجرا می‌شوند، در حالی که
    ابزارهای بومی Codex مانند shell/apply-patch داخل Codex اجرا می‌شوند.
    برای رویدادهای ابزار بومی Codex، OpenClaw در هر نوبت یک رله hook بومی
    تزریق می‌کند تا hookهای plugin بتوانند `before_tool_call` را مسدود کنند،
    `after_tool_call` را مشاهده کنند، و رویدادهای `PermissionRequest` در Codex را
    از طریق تأییدهای OpenClaw مسیریابی کنند. hookهای `Stop` در Codex به
    `before_agent_finalize` در OpenClaw رله می‌شوند، جایی که pluginها می‌توانند پیش از
    نهایی‌سازی پاسخ توسط Codex، یک گذر دیگر مدل را درخواست کنند. این رله
    عمداً محافظه‌کار می‌ماند: آرگومان‌های ابزار بومی Codex را تغییر نمی‌دهد
    یا رکوردهای thread در Codex را بازنویسی نمی‌کند. تنها زمانی از ACP صریح
    استفاده کنید که مدل runtime/session مربوط به ACP را می‌خواهید. مرز پشتیبانی
    Codex تعبیه‌شده در
    [قرارداد پشتیبانی Codex harness v1](/fa/plugins/codex-harness-runtime#v1-support-contract)
    مستند شده است.

  </Accordion>
  <Accordion title="Model / provider / runtime selection cheat sheet">
    - `openai-codex/*` - مسیر مدل قدیمی Codex OAuth/subscription که توسط doctor ترمیم می‌شود.
    - `openai/*` - runtime تعبیه‌شده بومی app-server در Codex برای نوبت‌های عامل OpenAI.
    - `/codex ...` - کنترل مکالمه بومی Codex.
    - `/acp ...` یا `runtime: "acp"` - کنترل صریح ACP/acpx.

  </Accordion>
  <Accordion title="ACP-routing natural-language triggers">
    محرک‌هایی که باید به runtime مربوط به ACP مسیریابی شوند:

    - "این را به‌عنوان یک جلسه یک‌باره Claude Code ACP اجرا کن و نتیجه را خلاصه کن."
    - "برای این کار از Gemini CLI در یک thread استفاده کن، سپس پیگیری‌ها را در همان thread نگه دار."
    - "Codex را از طریق ACP در یک thread پس‌زمینه اجرا کن."

    OpenClaw مقدار `runtime: "acp"` را انتخاب می‌کند، `agentId` مربوط به harness را
    resolve می‌کند، در صورت پشتیبانی به مکالمه یا thread فعلی متصل می‌شود، و
    پیگیری‌ها را تا زمان بستن/انقضا به همان جلسه مسیریابی می‌کند. Codex فقط
    زمانی این مسیر را دنبال می‌کند که ACP/acpx صریح باشد یا plugin بومی Codex
    برای عملیات درخواستی در دسترس نباشد.

    برای `sessions_spawn`، مقدار `runtime: "acp"` تنها زمانی اعلام می‌شود که ACP
    فعال باشد، درخواست‌کننده sandboxed نباشد، و یک backend مربوط به runtime
    ACP بارگذاری شده باشد. `acp.dispatch.enabled=false` ارسال خودکار threadهای
    ACP را متوقف می‌کند اما فراخوانی‌های صریح
    `sessions_spawn({ runtime: "acp" })` را پنهان یا مسدود نمی‌کند. این مقدار شناسه‌های ACP harness مانند `codex`،
    `claude`، `droid`، `gemini`، یا `opencode` را هدف می‌گیرد. یک شناسه عامل معمولی
    پیکربندی OpenClaw از `agents_list` را ارسال نکنید، مگر اینکه آن ورودی
    صریحاً با `agents.list[].runtime.type="acp"` پیکربندی شده باشد؛
    در غیر این صورت از runtime پیش‌فرض sub-agent استفاده کنید. وقتی یک عامل OpenClaw
    با `runtime.type="acp"` پیکربندی شده باشد، OpenClaw از
    `runtime.acp.agent` به‌عنوان شناسه harness زیرین استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## ACP در برابر sub-agentها

وقتی runtime مربوط به harness خارجی می‌خواهید، از ACP استفاده کنید. وقتی plugin
`codex` فعال است، برای اتصال/کنترل مکالمه Codex از **app-server بومی Codex**
استفاده کنید. وقتی اجراهای تفویض‌شده بومی OpenClaw می‌خواهید، از **sub-agentها**
استفاده کنید.

| حوزه          | جلسه ACP                           | اجرای sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | backend plugin مربوط به ACP (برای مثال acpx) | runtime بومی sub-agent در OpenClaw  |
| کلید جلسه   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| فرمان‌های اصلی | `/acp ...`                            | `/subagents ...`                   |
| ابزار spawn    | `sessions_spawn` با `runtime:"acp"` | `sessions_spawn` (runtime پیش‌فرض) |

همچنین [Sub-agents](/fa/tools/subagents) را ببینید.

## نحوه اجرای Claude Code توسط ACP

برای Claude Code از طریق ACP، پشته چنین است:

1. control plane جلسه ACP در OpenClaw.
2. runtime plugin رسمی `@openclaw/acpx`.
3. آداپتور Claude ACP.
4. سازوکارهای runtime/session سمت Claude.

ACP Claude یک **جلسه harness** با کنترل‌های ACP، ازسرگیری جلسه،
ردیابی کار پس‌زمینه، و اتصال اختیاری مکالمه/thread است.

backendهای CLI runtimeهای fallback محلی فقط‌متنی جداگانه هستند - نگاه کنید به
[CLI Backends](/fa/gateway/cli-backends).

برای اپراتورها، قاعده عملی این است:

- **`/acp spawn`، جلسه‌های قابل اتصال، کنترل‌های runtime، یا کار پایدار harness می‌خواهید؟** از ACP استفاده کنید.
- **fallback ساده متن محلی از طریق CLI خام می‌خواهید؟** از backendهای CLI استفاده کنید.

## جلسه‌های متصل

### مدل ذهنی

- **سطح چت** - جایی که افراد به گفتگو ادامه می‌دهند (کانال Discord، موضوع Telegram، چت iMessage).
- **جلسه ACP** - وضعیت پایدار runtime مربوط به Codex/Claude/Gemini که OpenClaw به آن مسیریابی می‌کند.
- **thread/topic فرزند** - سطح پیام‌رسانی اضافی اختیاری که فقط با `--thread ...` ساخته می‌شود.
- **workspace مربوط به runtime** - مکان filesystem (`cwd`، checkout مخزن، workspace مربوط به backend) که harness در آن اجرا می‌شود. مستقل از سطح چت است.

### اتصال‌های مکالمه فعلی

`/acp spawn <harness> --bind here` مکالمه فعلی را به جلسه ACP
spawnشده pin می‌کند - بدون thread فرزند، همان سطح چت. OpenClaw همچنان
مالک transport، auth، safety، و delivery می‌ماند. پیام‌های پیگیری در همان
مکالمه به همان جلسه مسیریابی می‌شوند؛ `/new` و `/reset` جلسه را در همان‌جا
reset می‌کنند؛ `/acp close` اتصال را حذف می‌کند.

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
    - `--bind here` و `--thread ...` ناسازگار و متقابلاً انحصاری هستند.
    - `--bind here` فقط روی کانال‌هایی کار می‌کند که اتصال مکالمه فعلی را اعلام می‌کنند؛ در غیر این صورت OpenClaw پیام واضحی درباره پشتیبانی‌نشدن برمی‌گرداند. اتصال‌ها در restartهای gateway پایدار می‌مانند.
    - در Discord، `spawnSessions` ساخت thread فرزند را برای `--thread auto|here` کنترل می‌کند - نه `--bind here`.
    - اگر بدون `--cwd` به یک عامل ACP متفاوت spawn کنید، OpenClaw به‌طور پیش‌فرض workspace مربوط به **عامل هدف** را به ارث می‌برد. مسیرهای به‌ارث‌رسیده ناموجود (`ENOENT`/`ENOTDIR`) به پیش‌فرض backend fallback می‌کنند؛ خطاهای دسترسی دیگر (مثلاً `EACCES`) به‌صورت خطاهای spawn نمایان می‌شوند.
    - فرمان‌های مدیریت Gateway در مکالمه‌های متصل محلی می‌مانند - فرمان‌های `/acp ...` توسط OpenClaw مدیریت می‌شوند حتی وقتی متن پیگیری عادی به جلسه ACP متصل مسیریابی می‌شود؛ `/status` و `/unfocus` نیز هر زمان مدیریت فرمان برای آن سطح فعال باشد، محلی می‌مانند.

  </Accordion>
  <Accordion title="Thread-bound sessions">
    وقتی اتصال‌های thread برای یک آداپتور کانال فعال باشند:

    - OpenClaw یک thread را به جلسه ACP هدف متصل می‌کند.
    - پیام‌های پیگیری در آن thread به جلسه ACP متصل مسیریابی می‌شوند.
    - خروجی ACP به همان thread برگردانده می‌شود.
    - unfocus/close/archive/idle-timeout یا انقضای max-age اتصال را حذف می‌کند.
    - `/acp close`، `/acp cancel`، `/acp status`، `/status`، و `/unfocus` فرمان‌های Gateway هستند، نه prompt برای ACP harness.

    feature flagهای لازم برای ACP متصل به thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` به‌طور پیش‌فرض روشن است (برای توقف ارسال خودکار threadهای ACP آن را روی `false` تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند).
    - spawn جلسه thread در آداپتور کانال فعال باشد (پیش‌فرض: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    پشتیبانی اتصال thread وابسته به آداپتور است. اگر آداپتور کانال فعال
    از اتصال‌های thread پشتیبانی نکند، OpenClaw پیام واضحی درباره
    پشتیبانی‌نشدن/در دسترس نبودن برمی‌گرداند.

  </Accordion>
  <Accordion title="Thread-supporting channels">
    - هر آداپتور کانالی که قابلیت اتصال session/thread را ارائه کند.
    - پشتیبانی داخلی فعلی: threadها/کانال‌های **Discord**، موضوع‌های **Telegram** (موضوع‌های forum در گروه‌ها/supergroupها و موضوع‌های DM).
    - کانال‌های plugin می‌توانند از طریق همان رابط اتصال، پشتیبانی اضافه کنند.

  </Accordion>
</AccordionGroup>

## اتصال‌های پایدار کانال

برای workflowهای غیرموقتی، اتصال‌های پایدار ACP را در ورودی‌های
سطح‌بالای `bindings[]` پیکربندی کنید.

### مدل اتصال

<ParamField path="bindings[].type" type='"acp"'>
  یک اتصال مکالمه ACP پایدار را علامت‌گذاری می‌کند.
</ParamField>
<ParamField path="bindings[].match" type="object">
  مکالمه هدف را مشخص می‌کند. شکل‌های هر کانال:

- **کانال/thread در Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **کانال/DM در Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. شناسه‌های پایدار Slack را ترجیح دهید؛ اتصال‌های کانال با پاسخ‌های داخل threadهای همان کانال نیز match می‌شوند.
- **موضوع forum در Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/گروه iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های پایدار گروهی، `chat_id:*` را ترجیح دهید.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  شناسه عامل مالک OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  override اختیاری ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  برچسب اختیاری قابل مشاهده برای اپراتور.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  دایرکتوری کاری اختیاری runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  override اختیاری backend.
</ParamField>

### پیش‌فرض‌های runtime برای هر عامل

برای تعریف یک‌باره پیش‌فرض‌های ACP برای هر عامل از `agents.list[].runtime` استفاده کنید:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (شناسه harness، مانند `codex` یا `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**اولویت override برای جلسه‌های متصل ACP:**

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

- OpenClaw تضمین می‌کند که نشست ACP پیکربندی‌شده پیش از استفاده وجود داشته باشد.
- پیام‌های آن کانال یا موضوع به نشست ACP پیکربندی‌شده هدایت می‌شوند.
- در گفتگوهای مقید، `/new` و `/reset` همان کلید نشست ACP را درجا بازنشانی می‌کنند.
- پیوندهای موقت زمان اجرا (برای مثال آن‌هایی که توسط جریان‌های تمرکز روی رشته ایجاد شده‌اند) همچنان هرجا موجود باشند اعمال می‌شوند.
- برای ایجاد ACP میان‌عاملی بدون `cwd` صریح، OpenClaw فضای کاری عامل هدف را از پیکربندی عامل به ارث می‌برد.
- مسیرهای فضای کاری موروثیِ ناموجود به cwd پیش‌فرض بک‌اند برمی‌گردند؛ خطاهای دسترسیِ غیرناموجود به‌صورت خطاهای ایجاد نشست نمایش داده می‌شوند.

## شروع نشست‌های ACP

دو روش برای شروع نشست ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    از `runtime: "acp"` برای شروع یک نشست ACP از نوبت عامل یا
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
    مقدار پیش‌فرض `runtime` برابر `subagent` است، پس برای نشست‌های ACP
    `runtime: "acp"` را صریح تنظیم کنید. اگر `agentId` حذف شود، OpenClaw
    در صورت پیکربندی از `acp.defaultAgent` استفاده می‌کند. `mode: "session"`
    برای نگه داشتن یک گفتگوی مقید پایدار به `thread: true` نیاز دارد.
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
  پرامپت اولیه‌ای که به نشست ACP فرستاده می‌شود.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  برای نشست‌های ACP باید `"acp"` باشد.
</ParamField>
<ParamField path="agentId" type="string">
  شناسه harness هدف ACP. اگر `acp.defaultAgent` تنظیم شده باشد، به آن برمی‌گردد.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  در جاهایی که پشتیبانی می‌شود، جریان اتصال رشته را درخواست می‌کند.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` یک‌باره است؛ `"session"` پایدار است. اگر `thread: true` باشد و
  `mode` حذف شود، OpenClaw ممکن است براساس مسیر زمان اجرا به‌طور پیش‌فرض
  از رفتار پایدار استفاده کند. `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cwd" type="string">
  دایرکتوری کاری درخواست‌شده برای زمان اجرا (که توسط سیاست بک‌اند/زمان اجرا
  اعتبارسنجی می‌شود). اگر حذف شود، ایجاد ACP در صورت پیکربندی، فضای کاری
  عامل هدف را به ارث می‌برد؛ مسیرهای موروثی ناموجود به پیش‌فرض‌های بک‌اند
  برمی‌گردند، درحالی‌که خطاهای دسترسی واقعی برگردانده می‌شوند.
</ParamField>
<ParamField path="label" type="string">
  برچسب قابل‌مشاهده برای اپراتور که در متن نشست/بنر استفاده می‌شود.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  به‌جای ایجاد نشست جدید، یک نشست ACP موجود را از سر می‌گیرد. عامل
  تاریخچه گفتگوی خود را از طریق `session/load` بازپخش می‌کند. به
  `runtime: "acp"` نیاز دارد.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` خلاصه‌های پیشرفت اجرای اولیه ACP را به‌صورت رویدادهای سیستمی
  به نشست درخواست‌کننده برمی‌گرداند. پاسخ‌های پذیرفته‌شده شامل
  `streamLogPath` هستند که به یک لاگ JSONL محدود به نشست اشاره می‌کند
  (`<sessionId>.acp-stream.jsonl`) و می‌توانید برای تاریخچه کامل رله آن را دنبال کنید.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  نوبت فرزند ACP را پس از N ثانیه لغو می‌کند. `0` نوبت را روی مسیر
  بدون مهلت زمانی Gateway نگه می‌دارد. همین مقدار به اجرای Gateway و
  زمان اجرای ACP اعمال می‌شود تا harnessهای متوقف‌شده یا دچار اتمام سهمیه،
  مسیر عامل والد را به‌طور نامحدود اشغال نکنند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی صریح مدل برای نشست فرزند ACP. ایجادهای ACP در Codex ارجاع‌های
  Codex در OpenClaw مانند `openai-codex/gpt-5.4` را پیش از `session/new`
  به پیکربندی آغازین ACP در Codex نرمال‌سازی می‌کنند؛ فرم‌های اسلش مانند
  `openai-codex/gpt-5.4/high` همچنین میزان تلاش استدلال ACP در Codex را تنظیم می‌کنند.
  سایر harnessها باید `models` در ACP را اعلام کنند و از
  `session/set_model` پشتیبانی کنند؛ در غیر این صورت OpenClaw/acpx به‌جای
  بازگشت بی‌سروصدا به پیش‌فرض عامل هدف، به‌صورت شفاف شکست می‌خورد.
</ParamField>
<ParamField path="thinking" type="string">
  تلاش صریح تفکر/استدلال. برای ACP در Codex، `minimal` به تلاش کم نگاشت می‌شود،
  `low`/`medium`/`high`/`xhigh` مستقیماً نگاشت می‌شوند، و `off`
  بازنویسی آغازین تلاش استدلال را حذف می‌کند.
</ParamField>

## حالت‌های bind و thread در ایجاد نشست

<Tabs>
  <Tab title="--bind here|off">
    | حالت   | رفتار                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | گفتگوی فعال فعلی را درجا مقید می‌کند؛ اگر هیچ گفتگوی فعالی نباشد شکست می‌خورد. |
    | `off`  | پیوند گفتگوی فعلی ایجاد نمی‌کند.                          |

    نکته‌ها:

    - `--bind here` ساده‌ترین مسیر اپراتور برای «پشتیبانی این کانال یا چت با Codex» است.
    - `--bind here` رشته فرزند ایجاد نمی‌کند.
    - `--bind here` فقط روی کانال‌هایی در دسترس است که پشتیبانی از اتصال گفتگوی فعلی را ارائه می‌کنند.
    - `--bind` و `--thread` نمی‌توانند در یک فراخوانی `/acp spawn` با هم ترکیب شوند.

  </Tab>
  <Tab title="--thread auto|here|off">
    | حالت   | رفتار                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | در یک رشته فعال: همان رشته را مقید می‌کند. بیرون از رشته: در صورت پشتیبانی، یک رشته فرزند ایجاد/مقید می‌کند. |
    | `here` | به رشته فعال فعلی نیاز دارد؛ اگر داخل یکی نباشد شکست می‌خورد.                                                  |
    | `off`  | بدون پیوند. نشست بدون پیوند شروع می‌شود.                                                                 |

    نکته‌ها:

    - روی سطح‌هایی که اتصال رشته ندارند، رفتار پیش‌فرض عملاً `off` است.
    - ایجاد نشست مقید به رشته به پشتیبانی سیاست کانال نیاز دارد:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - وقتی می‌خواهید گفتگوی فعلی را بدون ایجاد رشته فرزند ثابت کنید، از `--bind here` استفاده کنید.

  </Tab>
</Tabs>

## مدل تحویل

نشست‌های ACP می‌توانند یا فضاهای کاری تعاملی باشند یا کار پس‌زمینه‌ای
تحت مالکیت والد. مسیر تحویل به همین شکل بستگی دارد.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    نشست‌های تعاملی برای ادامه گفتگو روی یک سطح چت قابل‌مشاهده طراحی شده‌اند:

    - `/acp spawn ... --bind here` گفتگوی فعلی را به نشست ACP مقید می‌کند.
    - `/acp spawn ... --thread ...` یک رشته/موضوع کانال را به نشست ACP مقید می‌کند.
    - `bindings[].type="acp"` پیکربندی‌شده و پایدار، گفتگوهای مطابق را به همان نشست ACP هدایت می‌کند.

    پیام‌های بعدی در گفتگوی مقید مستقیماً به نشست ACP هدایت می‌شوند،
    و خروجی ACP به همان کانال/رشته/موضوع برگردانده می‌شود.

    آنچه OpenClaw به harness می‌فرستد:

    - پیگیری‌های عادیِ مقید به‌صورت متن پرامپت فرستاده می‌شوند، به‌علاوه پیوست‌ها فقط وقتی که harness/بک‌اند از آن‌ها پشتیبانی کند.
    - فرمان‌های مدیریتی `/acp` و فرمان‌های محلی Gateway پیش از ارسال به ACP رهگیری می‌شوند.
    - رویدادهای تکمیل تولیدشده توسط زمان اجرا به‌ازای هر هدف عینیت می‌یابند. عامل‌های OpenClaw پوشش داخلی زمینه زمان اجرای OpenClaw را دریافت می‌کنند؛ harnessهای خارجی ACP یک پرامپت ساده همراه با نتیجه فرزند و دستورالعمل دریافت می‌کنند. پوشش خام `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` هرگز نباید به harnessهای خارجی فرستاده شود یا به‌عنوان متن رونوشت کاربر در ACP ذخیره شود.
    - ورودی‌های رونوشت ACP از متن محرک قابل‌مشاهده برای کاربر یا پرامپت ساده تکمیل استفاده می‌کنند. فراداده رویداد داخلی تا حد امکان در OpenClaw به‌صورت ساختاریافته می‌ماند و به‌عنوان محتوای چت نوشته‌شده توسط کاربر تلقی نمی‌شود.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    نشست‌های ACP یک‌باره که توسط اجرای عامل دیگری ایجاد می‌شوند، فرزندان
    پس‌زمینه‌اند، مشابه زیرعامل‌ها:

    - والد با `sessions_spawn({ runtime: "acp", mode: "run" })` کار را درخواست می‌کند.
    - فرزند در نشست harness ACP خودش اجرا می‌شود.
    - نوبت‌های فرزند روی همان مسیر پس‌زمینه‌ای اجرا می‌شوند که برای ایجاد زیرعامل‌های بومی استفاده می‌شود، بنابراین harness کند ACP کار نامرتبط نشست اصلی را مسدود نمی‌کند.
    - گزارش تکمیل از طریق مسیر اعلام تکمیل کار برمی‌گردد. OpenClaw پیش از ارسال به یک harness خارجی، فراداده تکمیل داخلی را به یک پرامپت ساده ACP تبدیل می‌کند، بنابراین harnessها نشانگرهای زمینه زمان اجرای مخصوص OpenClaw را نمی‌بینند.
    - وقتی پاسخ قابل‌نمایش به کاربر مفید باشد، والد نتیجه فرزند را با صدای معمول دستیار بازنویسی می‌کند.

    با این مسیر مانند چت همتا به همتا بین والد و فرزند رفتار نکنید.
    فرزند از قبل یک کانال تکمیل برگشتی به والد دارد.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` می‌تواند پس از ایجاد، نشست دیگری را هدف بگیرد. برای
    نشست‌های همتای عادی، OpenClaw پس از تزریق پیام از یک مسیر پیگیری
    عامل‌به‌عامل (A2A) استفاده می‌کند:

    - منتظر پاسخ نشست هدف بمانید.
    - به‌صورت اختیاری اجازه دهید درخواست‌کننده و هدف تعداد محدودی نوبت پیگیری ردوبدل کنند.
    - از هدف بخواهید یک پیام اعلام تولید کند.
    - آن اعلام را به کانال یا رشته قابل‌مشاهده تحویل دهید.

    این مسیر A2A یک پشتیبان برای ارسال‌های همتاست که در آن فرستنده به
    یک پیگیری قابل‌مشاهده نیاز دارد. وقتی یک نشست نامرتبط بتواند هدف ACP
    را ببیند و به آن پیام بدهد، برای مثال تحت تنظیمات گسترده
    `tools.sessions.visibility`، همچنان فعال می‌ماند.

    OpenClaw فقط زمانی پیگیری A2A را رد می‌کند که درخواست‌کننده، والد
    فرزند ACP یک‌باره و تحت مالکیت خودش باشد. در آن حالت، اجرای A2A روی
    تکمیل کار می‌تواند والد را با نتیجه فرزند بیدار کند، پاسخ والد را
    دوباره به فرزند بفرستد، و یک حلقه پژواک والد/فرزند بسازد. نتیجه
    `sessions_send` برای آن مورد فرزندِ تحت مالکیت، `delivery.status="skipped"`
    را گزارش می‌کند، چون مسیر تکمیل از قبل مسئول نتیجه است.

  </Accordion>
  <Accordion title="Resume an existing session">
    برای ادامه یک نشست ACP قبلی به‌جای شروع تازه، از `resumeSessionId`
    استفاده کنید. عامل تاریخچه گفتگوی خود را از طریق `session/load`
    بازپخش می‌کند، بنابراین با زمینه کامل آنچه پیش‌تر آمده ادامه می‌دهد.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    موارد استفاده رایج:

    - واگذاری یک نشست Codex از لپ‌تاپ به تلفن همراهتان - به عامل خود بگویید از همان‌جایی که رها کردید ادامه دهد.
    - ادامه یک نشست کدنویسی که به‌صورت تعاملی در CLI شروع کرده‌اید، اکنون به‌صورت بدون واسط از طریق عاملتان.
    - از سر گرفتن کاری که با راه‌اندازی مجدد gateway یا پایان مهلت بیکاری قطع شده بود.

    نکته‌ها:

    - `resumeSessionId` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ زمان اجرای پیش‌فرض زیرعامل این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `streamTo` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ زمان اجرای پیش‌فرض زیرعامل این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `resumeSessionId` یک شناسه ازسرگیری ACP/harness محلیِ میزبان است، نه کلید نشست کانال OpenClaw؛ OpenClaw همچنان پیش از ارسال، سیاست ایجاد ACP و سیاست عامل هدف را بررسی می‌کند، درحالی‌که بک‌اند یا harness ACP مالک مجوزدهی برای بارگذاری آن شناسه بالادستی است.
    - `resumeSessionId` تاریخچه گفتگوی بالادستی ACP را بازیابی می‌کند؛ `thread` و `mode` همچنان به‌طور عادی روی نشست جدید OpenClaw که ایجاد می‌کنید اعمال می‌شوند، بنابراین `mode: "session"` همچنان به `thread: true` نیاز دارد.
    - عامل هدف باید از `session/load` پشتیبانی کند (Codex و Claude Code این کار را می‌کنند).
    - اگر شناسه نشست پیدا نشود، ایجاد نشست با خطایی شفاف شکست می‌خورد - بدون بازگشت بی‌سروصدا به نشست جدید.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    پس از استقرار Gateway، به‌جای اتکا به تست‌های واحد، یک بررسی زنده
    سرتاسری اجرا کنید:

    1. نسخه و commit Gateway مستقرشده را روی میزبان هدف تأیید کنید.
    2. یک نشست موقت پل ACPX به یک agent زنده باز کنید.
    3. از آن agent بخواهید `sessions_spawn` را با `runtime: "acp"`، `agentId: "codex"`، `mode: "run"`، و task `Reply with exactly LIVE-ACP-SPAWN-OK` فراخوانی کند.
    4. `accepted=yes`، یک `childSessionKey` واقعی، و نبود خطای اعتبارسنجی را تأیید کنید.
    5. نشست موقت پل را پاک‌سازی کنید.

    گیت را روی `mode: "run"` نگه دارید و `streamTo: "parent"` را رد کنید -
    مسیرهای `mode: "session"` وابسته به thread و stream-relay، گذرهای
    یکپارچه‌سازی غنی‌تر و جداگانه‌ای هستند.

  </Accordion>
</AccordionGroup>

## سازگاری Sandbox

نشست‌های ACP در حال حاضر روی runtime میزبان اجرا می‌شوند، **نه** داخل
sandbox مربوط به OpenClaw.

<Warning>
**مرز امنیتی:**

- harness خارجی می‌تواند مطابق مجوزهای CLI خودش و `cwd` انتخاب‌شده، بخواند/بنویسد.
- سیاست sandbox مربوط به OpenClaw اجرای harness مربوط به ACP را **در بر نمی‌گیرد**.
- OpenClaw همچنان feature gateهای ACP، agentهای مجاز، مالکیت نشست، اتصال‌های channel، و سیاست تحویل Gateway را اعمال می‌کند.
- برای کار OpenClaw-native با اعمال sandbox، از `runtime: "subagent"` استفاده کنید.

</Warning>

محدودیت‌های فعلی:

- اگر نشست درخواست‌کننده sandbox شده باشد، spawnهای ACP هم برای `sessions_spawn({ runtime: "acp" })` و هم برای `/acp spawn` مسدود می‌شوند.
- `sessions_spawn` با `runtime: "acp"` از `sandbox: "require"` پشتیبانی نمی‌کند.

## تشخیص هدف نشست

بیشتر اقدام‌های `/acp` یک هدف نشست اختیاری می‌پذیرند (`session-key`،
`session-id`، یا `session-label`).

**ترتیب تشخیص:**

1. آرگومان هدف صریح (یا `--session` برای `/acp steer`)
   - ابتدا key را امتحان می‌کند
   - سپس شناسه نشست با شکل UUID
   - سپس label
2. اتصال thread فعلی (اگر این conversation/thread به یک نشست ACP متصل باشد).
3. fallback به نشست درخواست‌کننده فعلی.

اتصال‌های conversation فعلی و اتصال‌های thread هر دو در
مرحله ۲ مشارکت دارند.

اگر هیچ هدفی تشخیص داده نشود، OpenClaw خطایی شفاف برمی‌گرداند
(`Unable to resolve session target: ...`).

## کنترل‌های ACP

| فرمان               | کاری که انجام می‌دهد                                      | مثال                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | نشست ACP ایجاد می‌کند؛ با bind فعلی یا thread bind اختیاری. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | turn در حال انجام را برای نشست هدف لغو می‌کند.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | دستور steer را به نشست در حال اجرا می‌فرستد.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | نشست را می‌بندد و هدف‌های thread را unbind می‌کند.         | `/acp close`                                                  |
| `/acp status`        | backend، mode، state، گزینه‌های runtime، و قابلیت‌ها را نشان می‌دهد. | `/acp status`                                                 |
| `/acp set-mode`      | mode مربوط به runtime را برای نشست هدف تنظیم می‌کند.       | `/acp set-mode plan`                                          |
| `/acp set`           | گزینه پیکربندی عمومی runtime را می‌نویسد.                  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | override دایرکتوری کاری runtime را تنظیم می‌کند.           | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | پروفایل سیاست approval را تنظیم می‌کند.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | timeout مربوط به runtime را تنظیم می‌کند (ثانیه).          | `/acp timeout 120`                                            |
| `/acp model`         | override مدل runtime را تنظیم می‌کند.                      | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | overrideهای گزینه runtime نشست را حذف می‌کند.              | `/acp reset-options`                                          |
| `/acp sessions`      | نشست‌های اخیر ACP را از store فهرست می‌کند.                | `/acp sessions`                                               |
| `/acp doctor`        | سلامت backend، قابلیت‌ها، و اصلاح‌های قابل اقدام.          | `/acp doctor`                                                 |
| `/acp install`       | گام‌های نصب و فعال‌سازی قطعی را چاپ می‌کند.                | `/acp install`                                                |

`/acp status` گزینه‌های runtime مؤثر را همراه با شناسه‌های نشست در سطح runtime و
سطح backend نشان می‌دهد. خطاهای کنترل پشتیبانی‌نشده وقتی backend قابلیتی نداشته باشد
به‌روشنی نمایش داده می‌شوند. `/acp sessions`،
store مربوط به نشست متصل فعلی یا نشست درخواست‌کننده را می‌خواند؛ توکن‌های هدف
(`session-key`، `session-id`، یا `session-label`) از طریق
کشف نشست Gateway تشخیص داده می‌شوند، از جمله ریشه‌های سفارشی `session.store`
برای هر agent.

### نگاشت گزینه‌های runtime

`/acp` فرمان‌های میانبر و یک setter عمومی دارد. عملیات معادل:

| فرمان                       | به این مورد نگاشت می‌شود                | نکته‌ها                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | کلید پیکربندی runtime به نام `model`   | برای Codex ACP، OpenClaw مقدار `openai-codex/<model>` را به شناسه مدل adapter نرمال‌سازی می‌کند و suffixهای reasoning اسلش‌دار مانند `openai-codex/gpt-5.4/high` را به `reasoning_effort` نگاشت می‌کند. |
| `/acp set thinking <level>`  | گزینه canonical به نام `thinking`      | OpenClaw معادل اعلام‌شده توسط backend را هنگام وجود می‌فرستد، با ترجیح `thinking`، سپس `effort`، `reasoning_effort`، یا `thought_level`. برای Codex ACP، adapter مقدارها را به `reasoning_effort` نگاشت می‌کند. |
| `/acp permissions <profile>` | گزینه canonical به نام `permissionProfile` | OpenClaw معادل اعلام‌شده توسط backend را هنگام وجود می‌فرستد، مانند `approval_policy`، `permission_profile`، `permissions`، یا `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | گزینه canonical به نام `timeoutSeconds` | OpenClaw معادل اعلام‌شده توسط backend را هنگام وجود می‌فرستد، مانند `timeout` یا `timeout_seconds`.                                                                                                      |
| `/acp cwd <path>`            | override مربوط به cwd در runtime       | به‌روزرسانی مستقیم.                                                                                                                                                                                        |
| `/acp set <key> <value>`     | عمومی                                 | `key=cwd` از مسیر override مربوط به cwd استفاده می‌کند.                                                                                                                                                   |
| `/acp reset-options`         | همه overrideهای runtime را پاک می‌کند  | -                                                                                                                                                                                                          |

## harness مربوط به acpx، راه‌اندازی Plugin، و مجوزها

برای پیکربندی harness مربوط به acpx (aliasهای Claude Code / Codex / Gemini CLI)،
پل‌های MCP مربوط به plugin-tools و OpenClaw-tools، و modeهای مجوز ACP،
ببینید:
[agentهای ACP - راه‌اندازی](/fa/tools/acp-agents-setup).

## عیب‌یابی

| نشانه                                                                     | علت محتمل                                                                                                           | راه‌حل                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin پشتیبان موجود نیست، غیرفعال است، یا توسط `plugins.allow` مسدود شده است.                                                       | Plugin پشتیبان را نصب و فعال کنید، وقتی آن فهرست مجاز تنظیم شده است `acpx` را در `plugins.allow` بگنجانید، سپس `/acp doctor` را اجرا کنید.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP به‌صورت سراسری غیرفعال شده است.                                                                                                 | `acp.enabled=true` را تنظیم کنید.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | ارسال خودکار از پیام‌های معمولی رشته غیرفعال شده است.                                                               | برای ازسرگیری مسیریابی خودکار رشته، `acp.dispatch.enabled=true` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | عامل در فهرست مجاز نیست.                                                                                                | از `agentId` مجاز استفاده کنید یا `acp.allowedAgents` را به‌روزرسانی کنید.                                                                                                                     |
| `/acp doctor` گزارش می‌دهد پشتیبان درست پس از راه‌اندازی آماده نیست                 | Plugin پشتیبان موجود نیست، غیرفعال است، توسط سیاست مجاز/غیرمجاز مسدود شده است، یا فایل اجرایی پیکربندی‌شده آن در دسترس نیست.        | Plugin پشتیبان را نصب/فعال کنید، `/acp doctor` را دوباره اجرا کنید، و اگر همچنان ناسالم ماند خطای نصب یا سیاست پشتیبان را بررسی کنید.                                           |
| فرمان هارنس پیدا نشد                                                   | CLI آداپتور نصب نشده است، Plugin خارجی موجود نیست، یا دریافت `npx` در اجرای نخست برای یک آداپتور غیر Codex شکست خورده است. | `/acp doctor` را اجرا کنید، آداپتور را روی میزبان Gateway نصب/ازپیش‌گرم کنید، یا فرمان عامل acpx را صریحاً پیکربندی کنید.                                                      |
| مدل از هارنس پیدا نشد                                            | شناسه مدل برای ارائه‌دهنده/هارنس دیگری معتبر است اما برای این هدف ACP معتبر نیست.                                                | از مدلی استفاده کنید که توسط آن هارنس فهرست شده است، مدل را در هارنس پیکربندی کنید، یا بازنویسی را حذف کنید.                                                                            |
| خطای احراز هویت فروشنده از هارنس                                          | OpenClaw سالم است، اما CLI/ارائه‌دهنده هدف وارد نشده است.                                                     | وارد شوید یا کلید ارائه‌دهنده لازم را در محیط میزبان Gateway فراهم کنید.                                                                                             |
| `Unable to resolve session target: ...`                                     | توکن کلید/شناسه/برچسب نادرست است.                                                                                                | `/acp sessions` را اجرا کنید، کلید/برچسب دقیق را کپی کنید، و دوباره تلاش کنید.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` بدون یک گفت‌وگوی فعال قابل اتصال استفاده شده است.                                                            | به چت/کانال هدف بروید و دوباره تلاش کنید، یا از ایجاد بدون اتصال استفاده کنید.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | آداپتور قابلیت اتصال ACP برای گفت‌وگوی فعلی را ندارد.                                                             | در صورت پشتیبانی از `/acp spawn ... --thread ...` استفاده کنید، `bindings[]` سطح بالا را پیکربندی کنید، یا به کانال پشتیبانی‌شده بروید.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` خارج از زمینه رشته استفاده شده است.                                                                         | به رشته هدف بروید یا از `--thread auto`/`off` استفاده کنید.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | کاربر دیگری مالک هدف اتصال فعال است.                                                                           | به‌عنوان مالک دوباره متصل کنید یا از گفت‌وگو یا رشته دیگری استفاده کنید.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | آداپتور قابلیت اتصال رشته را ندارد.                                                                               | از `--thread off` استفاده کنید یا به آداپتور/کانال پشتیبانی‌شده بروید.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP در سمت میزبان است؛ نشست درخواست‌کننده sandbox شده است.                                                              | از نشست‌های sandbox شده از `runtime="subagent"` استفاده کنید، یا ایجاد ACP را از یک نشست غیر sandbox شده اجرا کنید.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` برای runtime ACP درخواست شده است.                                                                         | برای sandboxing الزامی از `runtime="subagent"` استفاده کنید، یا ACP را با `sandbox="inherit"` از یک نشست غیر sandbox شده به‌کار ببرید.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | هارنس هدف، تغییر مدل عمومی ACP را ارائه نمی‌کند.                                                        | از هارنسی استفاده کنید که ACP `models`/`session/set_model` را اعلام می‌کند، از ارجاع‌های مدل ACP در Codex استفاده کنید، یا اگر هارنس پرچم راه‌اندازی خودش را دارد، مدل را مستقیماً در هارنس پیکربندی کنید. |
| فراداده ACP برای نشست متصل‌شده وجود ندارد                                      | فراداده نشست ACP قدیمی/حذف‌شده است.                                                                                    | با `/acp spawn` دوباره ایجاد کنید، سپس رشته را دوباره متصل/متمرکز کنید.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` نوشتن/اجرا را در نشست غیرتعاملی ACP مسدود می‌کند.                                                    | `plugins.entries.acpx.config.permissionMode` را روی `approve-all` تنظیم کنید و gateway را بازراه‌اندازی کنید. [پیکربندی مجوز](/fa/tools/acp-agents-setup#permission-configuration) را ببینید. |
| نشست ACP با خروجی کم، زود شکست می‌خورد                                  | اعلان‌های مجوز توسط `permissionMode`/`nonInteractivePermissions` مسدود شده‌اند.                                        | گزارش‌های gateway را برای `AcpRuntimeError` بررسی کنید. برای مجوزهای کامل، `permissionMode=approve-all` را تنظیم کنید؛ برای افت عملکرد کنترل‌شده، `nonInteractivePermissions=deny` را تنظیم کنید.        |
| نشست ACP پس از تکمیل کار، بی‌نهایت متوقف می‌ماند                       | فرایند هارنس تمام شده اما نشست ACP تکمیل را گزارش نکرده است.                                                    | OpenClaw را به‌روزرسانی کنید؛ پاک‌سازی فعلی acpx هنگام بستن و راه‌اندازی Gateway، wrapperهای قدیمی و فرایندهای آداپتور متعلق به OpenClaw را جمع‌آوری می‌کند.                                             |
| هارنس `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` را می‌بیند                        | پاکت رویداد داخلی از مرز ACP نشت کرده است.                                                                | OpenClaw را به‌روزرسانی کنید و جریان تکمیل را دوباره اجرا کنید؛ هارنس‌های خارجی باید فقط اعلان‌های تکمیل ساده دریافت کنند.                                                          |

## مرتبط

- [عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup)
- [ارسال عامل](/fa/tools/agent-send)
- [پشتیبان‌های CLI](/fa/gateway/cli-backends)
- [هارنس Codex](/fa/plugins/codex-harness)
- [Runtime هارنس Codex](/fa/plugins/codex-harness-runtime)
- [ابزارهای sandbox چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (حالت پل)](/fa/cli/acp)
- [زیرعامل‌ها](/fa/tools/subagents)
