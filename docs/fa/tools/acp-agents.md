---
read_when:
    - اجرای هارنس‌های کدنویسی از طریق ACP
    - راه‌اندازی نشست‌های ACP وابسته به گفت‌وگو در کانال‌های پیام‌رسانی
    - پیوند دادن یک گفت‌وگوی کانال پیام‌رسانی به یک نشست پایدار ACP
    - عیب‌یابی بک‌اند ACP، اتصال‌دهی Plugin، یا تحویل تکمیل
    - اجرای دستورهای /acp از طریق چت
sidebarTitle: ACP agents
summary: هارنس‌های کدنویسی خارجی (Claude Code، Cursor، Gemini CLI، Codex ACP صریح، OpenClaw ACP، OpenCode) را از طریق بک‌اند ACP اجرا کنید
title: عامل‌های ACP
x-i18n:
    generated_at: "2026-05-06T09:44:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[نشست‌های پروتکل عامل-کلاینت (ACP)](https://agentclientprotocol.com/)
به OpenClaw اجازه می‌دهند هارنس‌های کدنویسی خارجی (برای مثال Pi، Claude Code،
Cursor، Copilot، Droid، OpenClaw ACP، OpenCode، Gemini CLI، و دیگر
هارنس‌های ACPX پشتیبانی‌شده) را از طریق یک Plugin بک‌اند ACP اجرا کند.

هر ایجاد نشست ACP به‌عنوان یک [وظیفه پس‌زمینه](/fa/automation/tasks) ردیابی می‌شود.

<Note>
**ACP مسیر هارنس خارجی است، نه مسیر پیش‌فرض Codex.** Plugin
بومی سرور برنامه Codex کنترل‌های `/codex ...` و runtime توکار
`agentRuntime.id: "codex"` را مالکیت می‌کند؛ ACP مالک کنترل‌های
`/acp ...` و نشست‌های `sessions_spawn({ runtime: "acp" })` است.

اگر می‌خواهید Codex یا Claude Code به‌عنوان یک کلاینت MCP خارجی
مستقیما به گفتگوهای کانال موجود OpenClaw وصل شود، به‌جای ACP از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.
</Note>

## کدام صفحه را می‌خواهم؟

| می‌خواهید…                                                                                      | از این استفاده کنید                    | یادداشت‌ها                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex را در گفتگوی فعلی متصل یا کنترل کنید                                                       | `/codex bind`, `/codex threads`       | مسیر بومی سرور برنامه Codex وقتی Plugin `codex` فعال است؛ شامل پاسخ‌های چت متصل، ارسال تصویر، مدل/سریع/مجوزها، توقف، و کنترل‌های هدایت. ACP یک جایگزین صریح است |
| Claude Code، Gemini CLI، Codex ACP صریح، یا هارنس خارجی دیگری را _از طریق_ OpenClaw اجرا کنید | این صفحه                              | نشست‌های متصل به چت، `/acp spawn`، `sessions_spawn({ runtime: "acp" })`، وظایف پس‌زمینه، کنترل‌های runtime                                                                                   |
| یک نشست OpenClaw Gateway را _به‌عنوان_ سرور ACP برای یک ویرایشگر یا کلاینت ارائه کنید          | [`openclaw acp`](/fa/cli/acp)            | حالت پل. IDE/کلاینت از طریق stdio/WebSocket با ACP به OpenClaw صحبت می‌کند                                                                                                                    |
| از یک CLI هوش مصنوعی محلی به‌عنوان مدل جایگزین فقط-متن دوباره استفاده کنید                     | [بک‌اندهای CLI](/fa/gateway/cli-backends) | ACP نیست. بدون ابزارهای OpenClaw، بدون کنترل‌های ACP، بدون runtime هارنس                                                                                                                      |

## آیا این بلافاصله پس از نصب کار می‌کند؟

بله، پس از نصب Plugin رسمی runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

نسخه‌های سورس می‌توانند پس از `pnpm install` از Plugin فضای کاری محلی
`extensions/acpx` استفاده کنند. برای بررسی آمادگی، `/acp doctor` را اجرا کنید.

OpenClaw فقط وقتی به عامل‌ها درباره ایجاد ACP آموزش می‌دهد که ACP **واقعا
قابل استفاده** باشد: ACP باید فعال باشد، dispatch نباید غیرفعال باشد، نشست
فعلی نباید توسط sandbox مسدود شده باشد، و یک بک‌اند runtime باید بارگذاری
شده باشد. اگر این شرایط برقرار نباشند، Skills مربوط به Plugin ACP و
راهنمای ACP برای `sessions_spawn` پنهان می‌مانند تا عامل یک بک‌اند
در دسترس‌نبودنی را پیشنهاد نکند.

<AccordionGroup>
  <Accordion title="نکات مهم اجرای نخست">
    - اگر `plugins.allow` تنظیم شده باشد، یک فهرست محدودکننده Plugin است و **باید** شامل `acpx` باشد؛ در غیر این صورت بک‌اند ACP نصب‌شده عمدا مسدود می‌شود و `/acp doctor` ورودی گمشده allowlist را گزارش می‌کند.
    - آداپتر Codex ACP همراه با Plugin `acpx` آماده‌سازی می‌شود و در صورت امکان به‌صورت محلی راه‌اندازی می‌شود.
    - آداپترهای دیگر هارنس هدف ممکن است همچنان در نخستین استفاده، بنا به نیاز با `npx` دریافت شوند.
    - احراز هویت فروشنده همچنان باید برای آن هارنس روی میزبان وجود داشته باشد.
    - اگر میزبان npm یا دسترسی شبکه نداشته باشد، دریافت‌های آداپتر در اجرای نخست تا زمانی که کش‌ها از قبل آماده شوند یا آداپتر از راه دیگری نصب شود، شکست می‌خورند.

  </Accordion>
  <Accordion title="پیش‌نیازهای runtime">
    ACP یک فرایند هارنس خارجی واقعی را راه‌اندازی می‌کند. OpenClaw مالک مسیریابی،
    وضعیت وظیفه پس‌زمینه، تحویل، اتصال‌ها، و سیاست است؛ هارنس مالک ورود ارائه‌دهنده،
    کاتالوگ مدل، رفتار فایل‌سیستم، و ابزارهای بومی خودش است.

    پیش از مقصر دانستن OpenClaw، بررسی کنید:

    - `/acp doctor` یک بک‌اند فعال و سالم را گزارش می‌کند.
    - شناسه هدف وقتی آن allowlist تنظیم شده باشد توسط `acp.allowedAgents` مجاز است.
    - دستور هارنس می‌تواند روی میزبان Gateway شروع شود.
    - احراز هویت ارائه‌دهنده برای آن هارنس وجود دارد (`claude`, `codex`, `gemini`, `opencode`, `droid`, و غیره).
    - مدل انتخاب‌شده برای آن هارنس وجود دارد - شناسه‌های مدل میان هارنس‌ها قابل حمل نیستند.
    - `cwd` درخواست‌شده وجود دارد و قابل دسترسی است، یا `cwd` را حذف کنید و اجازه دهید بک‌اند از پیش‌فرض خودش استفاده کند.
    - حالت مجوز با کار سازگار است. نشست‌های غیرتعاملی نمی‌توانند روی اعلان‌های مجوز بومی کلیک کنند، بنابراین اجراهای کدنویسی سنگین از نظر نوشتن/اجرا معمولا به یک پروفایل مجوز ACPX نیاز دارند که بتواند بدون رابط تعاملی ادامه دهد.

  </Accordion>
</AccordionGroup>

ابزارهای Plugin OpenClaw و ابزارهای داخلی OpenClaw به‌صورت پیش‌فرض در اختیار
هارنس‌های ACP قرار نمی‌گیرند. پل‌های MCP صریح را در
[عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup) فقط وقتی فعال کنید که هارنس
باید آن ابزارها را مستقیما فراخوانی کند.

## هدف‌های هارنس پشتیبانی‌شده

با بک‌اند `acpx`، از این شناسه‌های هارنس به‌عنوان هدف‌های `/acp spawn <id>`
یا `sessions_spawn({ runtime: "acp", agentId: "<id>" })` استفاده کنید:

| شناسه هارنس | بک‌اند معمول                                  | یادداشت‌ها                                                                          |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | آداپتر Claude Code ACP                        | به احراز هویت Claude Code روی میزبان نیاز دارد.                                    |
| `codex`    | آداپتر Codex ACP                              | فقط وقتی `/codex` بومی در دسترس نیست یا ACP درخواست شده است، جایگزین صریح ACP است. |
| `copilot`  | آداپتر GitHub Copilot ACP                     | به احراز هویت Copilot CLI/runtime نیاز دارد.                                       |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | اگر نصب محلی نقطه ورود ACP متفاوتی ارائه می‌کند، دستور acpx را بازنویسی کنید.     |
| `droid`    | Factory Droid CLI                              | به احراز هویت Factory/Droid یا `FACTORY_API_KEY` در محیط هارنس نیاز دارد.          |
| `gemini`   | آداپتر Gemini CLI ACP                         | به احراز هویت Gemini CLI یا تنظیم کلید API نیاز دارد.                              |
| `iflow`    | iFlow CLI                                      | در دسترس بودن آداپتر و کنترل مدل به CLI نصب‌شده بستگی دارد.                       |
| `kilocode` | Kilo Code CLI                                  | در دسترس بودن آداپتر و کنترل مدل به CLI نصب‌شده بستگی دارد.                       |
| `kimi`     | Kimi/Moonshot CLI                              | به احراز هویت Kimi/Moonshot روی میزبان نیاز دارد.                                  |
| `kiro`     | Kiro CLI                                       | در دسترس بودن آداپتر و کنترل مدل به CLI نصب‌شده بستگی دارد.                       |
| `opencode` | آداپتر OpenCode ACP                           | به احراز هویت OpenCode CLI/ارائه‌دهنده نیاز دارد.                                  |
| `openclaw` | پل OpenClaw Gateway از طریق `openclaw acp` | به هارنس آگاه از ACP اجازه می‌دهد با یک نشست OpenClaw Gateway ارتباط برگشتی برقرار کند. |
| `pi`       | runtime توکار OpenClaw/Pi                   | برای آزمایش‌های هارنس بومی OpenClaw استفاده می‌شود.                               |
| `qwen`     | Qwen Code / Qwen CLI                           | به احراز هویت سازگار با Qwen روی میزبان نیاز دارد.                                 |

نام‌های مستعار عامل acpx سفارشی را می‌توان در خود acpx پیکربندی کرد، اما سیاست OpenClaw
همچنان پیش از dispatch، `acp.allowedAgents` و هر نگاشت
`agents.list[].runtime.acp.agent` را بررسی می‌کند.

## دستورالعمل اجرایی اپراتور

جریان سریع `/acp` از چت:

<Steps>
  <Step title="ایجاد">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، یا
    `/acp spawn codex --bind here` صریح.
  </Step>
  <Step title="کار">
    در گفتگو یا رشته متصل ادامه دهید (یا کلید نشست را صریحا هدف بگیرید).
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
    - ایجاد، یک نشست runtime ACP را ایجاد یا از سر می‌گیرد، فراداده ACP را در مخزن نشست OpenClaw ثبت می‌کند، و ممکن است وقتی اجرا تحت مالکیت والد است یک وظیفه پس‌زمینه ایجاد کند.
    - نشست‌های ACP تحت مالکیت والد حتی وقتی نشست runtime پایدار است به‌عنوان کار پس‌زمینه در نظر گرفته می‌شوند؛ تکمیل و تحویل میان‌سطحی به‌جای رفتار کردن مانند یک نشست چت عادی روبه‌کاربر، از طریق اعلان‌کننده وظیفه والد انجام می‌شود.
    - نگهداری وظیفه، نشست‌های ACP یک‌باره پایانی یا یتیم تحت مالکیت والد را می‌بندد. نشست‌های ACP پایدار تا وقتی یک اتصال گفتگوی فعال باقی بماند حفظ می‌شوند؛ نشست‌های پایدار قدیمی بدون اتصال فعال بسته می‌شوند تا پس از پایان وظیفه مالک یا حذف رکورد وظیفه آن، بی‌صدا از سر گرفته نشوند.
    - پیام‌های پیگیری متصل تا زمان بسته شدن، خارج شدن از تمرکز، بازنشانی، یا انقضای اتصال مستقیما به نشست ACP می‌روند.
    - فرمان‌های Gateway محلی می‌مانند. `/acp ...`، `/status`، و `/unfocus` هرگز به‌عنوان متن اعلان عادی به یک هارنس ACP متصل ارسال نمی‌شوند.
    - `cancel` وقتی بک‌اند از لغو پشتیبانی می‌کند نوبت فعال را متوقف می‌کند؛ اتصال یا فراداده نشست را حذف نمی‌کند.
    - `close` نشست ACP را از دید OpenClaw پایان می‌دهد و اتصال را حذف می‌کند. اگر هارنس از ازسرگیری پشتیبانی کند، ممکن است همچنان تاریخچه بالادستی خودش را نگه دارد.
    - workerهای runtime بیکار پس از `acp.runtime.ttlMinutes` واجد شرایط پاک‌سازی هستند؛ فراداده نشست ذخیره‌شده برای `/acp sessions` در دسترس می‌ماند.

  </Accordion>
  <Accordion title="قواعد مسیریابی Codex بومی">
    محرک‌های زبان طبیعی که وقتی فعال است باید به **Plugin بومی Codex**
    مسیریابی شوند:

    - «این کانال Discord را به Codex متصل کن.»
    - «این چت را به رشته Codex با شناسه `<id>` پیوست کن.»
    - «رشته‌های Codex را نشان بده، سپس این یکی را متصل کن.»

    اتصال گفتگوی Codex بومی مسیر پیش‌فرض کنترل چت است.
    ابزارهای پویای OpenClaw همچنان از طریق OpenClaw اجرا می‌شوند، در حالی که
    ابزارهای بومی Codex مانند shell/apply-patch داخل Codex اجرا می‌شوند.
    برای رویدادهای ابزار بومی Codex، OpenClaw در هر نوبت یک رله hook بومی
    تزریق می‌کند تا hookهای Plugin بتوانند `before_tool_call` را مسدود کنند،
    `after_tool_call` را مشاهده کنند، و رویدادهای Codex `PermissionRequest` را
    از طریق تاییدهای OpenClaw مسیریابی کنند. hookهای Codex `Stop` به
    `before_agent_finalize` در OpenClaw منتقل می‌شوند، جایی که Pluginها می‌توانند
    پیش از نهایی‌سازی پاسخ توسط Codex، یک عبور مدل دیگر درخواست کنند. رله عمدا
    محافظه‌کار باقی می‌ماند: آرگومان‌های ابزار بومی Codex را تغییر نمی‌دهد و
    رکوردهای رشته Codex را بازنویسی نمی‌کند. فقط وقتی ACP صریح را استفاده کنید
    که مدل runtime/نشست ACP را می‌خواهید. مرز پشتیبانی Codex توکار در
    [قرارداد پشتیبانی هارنس Codex نسخه ۱](/fa/plugins/codex-harness#v1-support-contract) مستند شده است.

  </Accordion>
  <Accordion title="برگه تقلب انتخاب مدل / ارائه‌دهنده / زمان اجرا">
    - `openai-codex/*` - مسیر PI Codex OAuth/اشتراک.
    - `openai/*` به‌علاوه `agentRuntime.id: "codex"` - زمان اجرای تعبیه‌شده بومی سرور برنامه Codex.
    - `/codex ...` - کنترل گفت‌وگوی بومی Codex.
    - `/acp ...` یا `runtime: "acp"` - کنترل صریح ACP/acpx.

  </Accordion>
  <Accordion title="محرک‌های زبان طبیعی برای مسیریابی ACP">
    محرک‌هایی که باید به زمان اجرای ACP مسیریابی شوند:

    - "این را به‌صورت یک نشست یک‌باره Claude Code ACP اجرا کن و نتیجه را خلاصه کن."
    - "برای این کار از Gemini CLI در یک رشته استفاده کن، سپس پیگیری‌ها را در همان رشته نگه دار."
    - "Codex را از طریق ACP در یک رشته پس‌زمینه اجرا کن."

    OpenClaw مقدار `runtime: "acp"` را انتخاب می‌کند، هارنس `agentId` را حل می‌کند،
    در صورت پشتیبانی به گفت‌وگو یا رشته فعلی متصل می‌شود، و
    پیگیری‌ها را تا زمان بستن/انقضا به همان نشست مسیریابی می‌کند. Codex فقط
    وقتی این مسیر را دنبال می‌کند که ACP/acpx صریح باشد یا Plugin بومی Codex
    برای عملیات درخواستی در دسترس نباشد.

    برای `sessions_spawn`، مقدار `runtime: "acp"` فقط وقتی اعلام می‌شود که ACP
    فعال باشد، درخواست‌کننده در sandbox نباشد، و یک backend زمان اجرای ACP
    بارگذاری شده باشد. `acp.dispatch.enabled=false` ارسال خودکار
    رشته ACP را موقتاً متوقف می‌کند اما فراخوانی‌های صریح
    `sessions_spawn({ runtime: "acp" })` را پنهان یا مسدود نمی‌کند. این مقدار شناسه‌های هارنس ACP مانند `codex`،
    `claude`، `droid`، `gemini`، یا `opencode` را هدف می‌گیرد. یک شناسه عامل پیکربندی عادی
    OpenClaw از `agents_list` را ارسال نکنید مگر اینکه آن ورودی
    به‌طور صریح با `agents.list[].runtime.type="acp"` پیکربندی شده باشد؛
    در غیر این صورت از زمان اجرای زیرعامل پیش‌فرض استفاده کنید. وقتی یک عامل OpenClaw
    با `runtime.type="acp"` پیکربندی شده باشد، OpenClaw از
    `runtime.acp.agent` به‌عنوان شناسه هارنس زیربنایی استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## ACP در برابر زیرعامل‌ها

وقتی زمان اجرای هارنس خارجی می‌خواهید از ACP استفاده کنید. برای اتصال/کنترل گفت‌وگوی Codex، وقتی Plugin
`codex` فعال است، از **سرور برنامه بومی Codex**
استفاده کنید. وقتی اجراهای واگذارشده بومی OpenClaw می‌خواهید از **زیرعامل‌ها** استفاده کنید.

| حوزه          | نشست ACP                           | اجرای زیرعامل                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| زمان اجرا       | Plugin backend ACP (برای مثال acpx) | زمان اجرای زیرعامل بومی OpenClaw  |
| کلید نشست   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| فرمان‌های اصلی | `/acp ...`                            | `/subagents ...`                   |
| ابزار راه‌اندازی    | `sessions_spawn` با `runtime:"acp"` | `sessions_spawn` (زمان اجرای پیش‌فرض) |

همچنین [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

## ACP چگونه Claude Code را اجرا می‌کند

برای Claude Code از طریق ACP، پشته چنین است:

1. صفحه کنترل نشست ACP در OpenClaw.
2. Plugin زمان اجرای رسمی `@openclaw/acpx`.
3. آداپتور ACP برای Claude.
4. سازوکار زمان اجرا/نشست در سمت Claude.

ACP Claude یک **نشست هارنس** با کنترل‌های ACP، ازسرگیری نشست،
ردیابی کار پس‌زمینه، و اتصال اختیاری گفت‌وگو/رشته است.

backendهای CLI زمان‌های اجرای fallback محلی فقط متنی جداگانه هستند - ببینید
[backendهای CLI](/fa/gateway/cli-backends).

برای اپراتورها، قاعده عملی این است:

- **`/acp spawn`، نشست‌های قابل اتصال، کنترل‌های زمان اجرا، یا کار پایدار هارنس می‌خواهید؟** از ACP استفاده کنید.
- **fallback متنی محلی ساده از طریق CLI خام می‌خواهید؟** از backendهای CLI استفاده کنید.

## نشست‌های متصل

### مدل ذهنی

- **سطح چت** - جایی که افراد به گفتگو ادامه می‌دهند (کانال Discord، موضوع Telegram، چت iMessage).
- **نشست ACP** - وضعیت پایدار زمان اجرای Codex/Claude/Gemini که OpenClaw به آن مسیریابی می‌کند.
- **رشته/موضوع فرزند** - سطح پیام‌رسانی اضافی اختیاری که فقط توسط `--thread ...` ایجاد می‌شود.
- **فضای کاری زمان اجرا** - مکان فایل‌سیستم (`cwd`، checkout مخزن، فضای کاری backend) که هارنس در آن اجرا می‌شود. مستقل از سطح چت است.

### اتصال‌های گفت‌وگوی فعلی

`/acp spawn <harness> --bind here` گفت‌وگوی فعلی را به
نشست ACP ایجادشده سنجاق می‌کند - بدون رشته فرزند، همان سطح چت. OpenClaw همچنان
مالک انتقال، احراز هویت، ایمنی، و تحویل باقی می‌ماند. پیام‌های پیگیری در همان
گفت‌وگو به همان نشست مسیریابی می‌شوند؛ `/new` و `/reset` نشست را
در همان‌جا بازنشانی می‌کنند؛ `/acp close` اتصال را حذف می‌کند.

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
    - `--bind here` و `--thread ...` با هم ناسازگارند.
    - `--bind here` فقط روی کانال‌هایی کار می‌کند که اتصال گفت‌وگوی فعلی را اعلام می‌کنند؛ در غیر این صورت OpenClaw پیام روشنِ پشتیبانی‌نشدن برمی‌گرداند. اتصال‌ها در راه‌اندازی‌های مجدد Gateway پایدار می‌مانند.
    - در Discord، `spawnSessions` ایجاد رشته فرزند را برای `--thread auto|here` کنترل می‌کند - نه `--bind here`.
    - اگر بدون `--cwd` به یک عامل ACP متفاوت راه‌اندازی کنید، OpenClaw به‌طور پیش‌فرض فضای کاری **عامل هدف** را به ارث می‌برد. مسیرهای به‌ارث‌رسیده ناموجود (`ENOENT`/`ENOTDIR`) به پیش‌فرض backend fallback می‌کنند؛ خطاهای دسترسی دیگر (مثلاً `EACCES`) به‌صورت خطاهای راه‌اندازی نمایش داده می‌شوند.
    - فرمان‌های مدیریت Gateway در گفت‌وگوهای متصل محلی می‌مانند - فرمان‌های `/acp ...` حتی وقتی متن پیگیری عادی به نشست ACP متصل مسیریابی می‌شود توسط OpenClaw رسیدگی می‌شوند؛ `/status` و `/unfocus` نیز هر زمان رسیدگی به فرمان برای آن سطح فعال باشد محلی می‌مانند.

  </Accordion>
  <Accordion title="نشست‌های متصل به رشته">
    وقتی اتصال‌های رشته برای یک آداپتور کانال فعال باشند:

    - OpenClaw یک رشته را به نشست ACP هدف متصل می‌کند.
    - پیام‌های پیگیری در آن رشته به نشست ACP متصل مسیریابی می‌شوند.
    - خروجی ACP به همان رشته تحویل داده می‌شود.
    - Unfocus/close/archive/idle-timeout یا انقضای max-age اتصال را حذف می‌کند.
    - `/acp close`، `/acp cancel`، `/acp status`، `/status`، و `/unfocus` فرمان‌های Gateway هستند، نه promptهایی برای هارنس ACP.

    feature flagهای لازم برای ACP متصل به رشته:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` به‌طور پیش‌فرض روشن است (برای توقف موقت ارسال خودکار رشته ACP آن را روی `false` بگذارید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند).
    - راه‌اندازی نشست‌های رشته آداپتور کانال فعال باشد (پیش‌فرض: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    پشتیبانی اتصال رشته وابسته به آداپتور است. اگر آداپتور کانال فعال
    از اتصال‌های رشته پشتیبانی نکند، OpenClaw پیام روشن
    پشتیبانی‌نشدن/در دسترس نبودن برمی‌گرداند.

  </Accordion>
  <Accordion title="کانال‌های پشتیبان رشته">
    - هر آداپتور کانالی که قابلیت اتصال نشست/رشته را ارائه کند.
    - پشتیبانی داخلی فعلی: رشته‌ها/کانال‌های **Discord**، موضوع‌های **Telegram** (موضوع‌های forum در گروه‌ها/supergroupها و موضوع‌های DM).
    - کانال‌های Plugin می‌توانند از طریق همان رابط اتصال، پشتیبانی اضافه کنند.

  </Accordion>
</AccordionGroup>

## اتصال‌های پایدار کانال

برای گردش‌کارهای غیرزودگذر، اتصال‌های پایدار ACP را در
ورودی‌های سطح بالای `bindings[]` پیکربندی کنید.

### مدل اتصال

<ParamField path="bindings[].type" type='"acp"'>
  یک اتصال گفت‌وگوی پایدار ACP را مشخص می‌کند.
</ParamField>
<ParamField path="bindings[].match" type="object">
  گفت‌وگوی هدف را شناسایی می‌کند. شکل‌ها بر اساس کانال:

- **کانال/رشته Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **موضوع forum در Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/گروه BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های پایدار گروهی، `chat_id:*` یا `chat_identifier:*` را ترجیح دهید.
- **DM/گروه iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های پایدار گروهی، `chat_id:*` را ترجیح دهید.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  شناسه عامل مالک در OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  override اختیاری ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  برچسب اختیاری رو به اپراتور.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  دایرکتوری کاری اختیاری زمان اجرا.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  override اختیاری backend.
</ParamField>

### پیش‌فرض‌های زمان اجرا برای هر عامل

برای تعریف پیش‌فرض‌های ACP یک‌بار برای هر عامل، از `agents.list[].runtime` استفاده کنید:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (شناسه هارنس، مثلاً `codex` یا `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ترتیب تقدم override برای نشست‌های متصل ACP:**

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

- OpenClaw مطمئن می‌شود نشست ACP پیکربندی‌شده پیش از استفاده وجود دارد.
- پیام‌های آن کانال یا موضوع به نشست ACP پیکربندی‌شده مسیریابی می‌شوند.
- در گفت‌وگوهای متصل، `/new` و `/reset` همان کلید نشست ACP را در همان‌جا بازنشانی می‌کنند.
- اتصال‌های موقت زمان اجرا (برای مثال ایجادشده توسط جریان‌های focus رشته) همچنان هرجا وجود داشته باشند اعمال می‌شوند.
- برای راه‌اندازی‌های ACP بین‌عاملی بدون `cwd` صریح، OpenClaw فضای کاری عامل هدف را از پیکربندی عامل به ارث می‌برد.
- مسیرهای فضای کاری به‌ارث‌رسیده ناموجود به cwd پیش‌فرض backend fallback می‌کنند؛ خطاهای دسترسی مربوط به مسیرهای موجود به‌صورت خطاهای راه‌اندازی نمایش داده می‌شوند.

## شروع نشست‌های ACP

دو روش برای شروع یک نشست ACP وجود دارد:

<Tabs>
  <Tab title="از sessions_spawn">
    برای شروع یک نشست ACP از نوبت عامل یا
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
    مقدار پیش‌فرض `runtime` برابر `subagent` است، بنابراین برای نشست‌های ACP باید
    `runtime: "acp"` را صریح تنظیم کنید. اگر `agentId` حذف شود، OpenClaw در صورت
    پیکربندی بودن از `acp.defaultAgent` استفاده می‌کند. `mode: "session"` برای
    حفظ یک گفت‌وگوی مقید پایدار به `thread: true` نیاز دارد.
    </Note>

  </Tab>
  <Tab title="از دستور /acp">
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
  اعلان اولیه‌ای که به نشست ACP فرستاده می‌شود.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  برای نشست‌های ACP باید `"acp"` باشد.
</ParamField>
<ParamField path="agentId" type="string">
  شناسه harness هدف ACP. اگر تنظیم شده باشد، به `acp.defaultAgent` بازمی‌گردد.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  جریان اتصال رشته را در جایی که پشتیبانی شود درخواست می‌کند.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` یک‌باره است؛ `"session"` پایدار است. اگر `thread: true` باشد و
  `mode` حذف شود، OpenClaw ممکن است بسته به مسیر runtime به‌طور پیش‌فرض از رفتار
  پایدار استفاده کند. `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cwd" type="string">
  پوشه کاری runtime درخواست‌شده (توسط سیاست backend/runtime اعتبارسنجی می‌شود).
  اگر حذف شود، ACP spawn در صورت پیکربندی بودن، فضای کاری عامل هدف را به ارث
  می‌برد؛ مسیرهای به‌ارث‌رسیدهِ ناموجود به پیش‌فرض‌های backend بازمی‌گردند، در
  حالی که خطاهای واقعی دسترسی برگردانده می‌شوند.
</ParamField>
<ParamField path="label" type="string">
  برچسب قابل مشاهده برای اپراتور که در متن نشست/بنر استفاده می‌شود.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  به‌جای ایجاد نشست جدید، یک نشست ACP موجود را از سر می‌گیرد. عامل تاریخچه
  گفت‌وگوی خود را از طریق `session/load` بازپخش می‌کند. به `runtime: "acp"` نیاز
  دارد.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` خلاصه‌های پیشرفت اجرای اولیه ACP را به‌صورت رویدادهای سیستمی به
  نشست درخواست‌کننده برمی‌گرداند. پاسخ‌های پذیرفته‌شده شامل `streamLogPath` هستند
  که به یک گزارش JSONL محدود به نشست اشاره می‌کند
  (`<sessionId>.acp-stream.jsonl`) و می‌توانید آن را برای تاریخچه کامل relay
  دنبال کنید.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  نوبت فرزند ACP را پس از N ثانیه قطع می‌کند. `0` نوبت را روی مسیر بدون مهلت
  Gateway نگه می‌دارد. همان مقدار روی اجرای Gateway و runtime ACP اعمال می‌شود
  تا harnessهای متوقف‌شده یا تمام‌شده از نظر سهمیه، مسیر عامل والد را به‌طور
  نامحدود اشغال نکنند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی صریح مدل برای نشست فرزند ACP. Codex ACP spawnها ارجاع‌های Codex در
  OpenClaw مانند `openai-codex/gpt-5.4` را پیش از `session/new` به پیکربندی
  راه‌اندازی Codex ACP عادی‌سازی می‌کنند؛ فرم‌های اسلش مانند
  `openai-codex/gpt-5.4/high` همچنین سطح تلاش استدلال Codex ACP را تنظیم می‌کنند.
  harnessهای دیگر باید ACP `models` را اعلام کنند و از `session/set_model`
  پشتیبانی کنند؛ در غیر این صورت OpenClaw/acpx به‌جای بازگشت بی‌صدا به پیش‌فرض
  عامل هدف، با خطای روشن شکست می‌خورد.
</ParamField>
<ParamField path="thinking" type="string">
  تلاش صریح thinking/reasoning. برای Codex ACP، `minimal` به تلاش کم نگاشت
  می‌شود، `low`/`medium`/`high`/`xhigh` مستقیما نگاشت می‌شوند، و `off` بازنویسی
  تلاش استدلال در راه‌اندازی را حذف می‌کند.
</ParamField>

## حالت‌های اتصال و رشته spawn

<Tabs>
  <Tab title="--bind here|off">
    | حالت   | رفتار                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | گفت‌وگوی فعال فعلی را در همان‌جا متصل می‌کند؛ اگر گفت‌وگوی فعالی نباشد شکست می‌خورد. |
    | `off`  | اتصال گفت‌وگوی فعلی ایجاد نمی‌کند.                          |

    نکته‌ها:

    - `--bind here` ساده‌ترین مسیر اپراتور برای «این کانال یا چت را با پشتوانه Codex بساز» است.
    - `--bind here` رشته فرزند ایجاد نمی‌کند.
    - `--bind here` فقط در کانال‌هایی در دسترس است که پشتیبانی اتصال گفت‌وگوی فعلی را ارائه می‌کنند.
    - `--bind` و `--thread` را نمی‌توان در یک فراخوانی `/acp spawn` با هم ترکیب کرد.

  </Tab>
  <Tab title="--thread auto|here|off">
    | حالت   | رفتار                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل یک رشته فعال: همان رشته را متصل می‌کند. بیرون از رشته: در صورت پشتیبانی، یک رشته فرزند ایجاد/متصل می‌کند. |
    | `here` | رشته فعال فعلی را الزامی می‌کند؛ اگر داخل رشته نباشد شکست می‌خورد.                                                  |
    | `off`  | بدون اتصال. نشست بدون اتصال شروع می‌شود.                                                                 |

    نکته‌ها:

    - روی سطح‌هایی که اتصال رشته ندارند، رفتار پیش‌فرض عملا `off` است.
    - spawn متصل به رشته به پشتیبانی سیاست کانال نیاز دارد:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - وقتی می‌خواهید گفت‌وگوی فعلی را بدون ایجاد رشته فرزند ثابت کنید، از `--bind here` استفاده کنید.

  </Tab>
</Tabs>

## مدل تحویل

نشست‌های ACP می‌توانند یا فضاهای کاری تعاملی باشند یا کار پس‌زمینه تحت مالکیت
والد. مسیر تحویل به همین شکل بستگی دارد.

<AccordionGroup>
  <Accordion title="نشست‌های ACP تعاملی">
    نشست‌های تعاملی برای ادامه گفت‌وگو روی یک سطح چت قابل مشاهده در نظر گرفته شده‌اند:

    - `/acp spawn ... --bind here` گفت‌وگوی فعلی را به نشست ACP متصل می‌کند.
    - `/acp spawn ... --thread ...` یک رشته/موضوع کانال را به نشست ACP متصل می‌کند.
    - اتصال‌های پایدار پیکربندی‌شده `bindings[].type="acp"` گفت‌وگوهای منطبق را به همان نشست ACP مسیر‌دهی می‌کنند.

    پیام‌های پیگیری در گفت‌وگوی متصل مستقیما به نشست ACP مسیر‌دهی می‌شوند، و
    خروجی ACP به همان کانال/رشته/موضوع برگردانده می‌شود.

    آنچه OpenClaw به harness می‌فرستد:

    - پیگیری‌های متصل عادی به‌صورت متن اعلان فرستاده می‌شوند، همراه با پیوست‌ها فقط وقتی harness/backend از آن‌ها پشتیبانی کند.
    - دستورهای مدیریتی `/acp` و دستورهای محلی Gateway پیش از ارسال به ACP رهگیری می‌شوند.
    - رویدادهای تکمیل تولیدشده توسط runtime بر اساس هدف مادی‌سازی می‌شوند. عامل‌های OpenClaw پوشش runtime-context داخلی OpenClaw را دریافت می‌کنند؛ harnessهای ACP خارجی یک اعلان ساده با نتیجه فرزند و دستورالعمل دریافت می‌کنند. پوشش خام `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` هرگز نباید به harnessهای خارجی فرستاده شود یا به‌عنوان متن رونوشت کاربر ACP پایدار شود.
    - ورودی‌های رونوشت ACP از متن trigger قابل مشاهده برای کاربر یا اعلان تکمیل ساده استفاده می‌کنند. فراداده رویداد داخلی، هر جا ممکن باشد، در OpenClaw به‌صورت ساخت‌یافته باقی می‌ماند و به‌عنوان محتوای چت نوشته‌شده توسط کاربر تلقی نمی‌شود.

  </Accordion>
  <Accordion title="نشست‌های ACP یک‌باره تحت مالکیت والد">
    نشست‌های ACP یک‌باره که توسط اجرای عامل دیگری spawn می‌شوند، فرزندان پس‌زمینه
    هستند، مشابه sub-agentها:

    - والد با `sessions_spawn({ runtime: "acp", mode: "run" })` درخواست کار می‌دهد.
    - فرزند در نشست harness ACP خودش اجرا می‌شود.
    - نوبت‌های فرزند روی همان مسیر پس‌زمینه‌ای اجرا می‌شوند که spawnهای sub-agent بومی از آن استفاده می‌کنند، بنابراین یک harness کند ACP کار نامرتبط نشست اصلی را مسدود نمی‌کند.
    - تکمیل از مسیر اعلام تکمیل وظیفه گزارش می‌شود. OpenClaw پیش از فرستادن به یک harness خارجی، فراداده تکمیل داخلی را به اعلان ACP ساده تبدیل می‌کند، بنابراین harnessها نشانگرهای زمینه runtime اختصاصی OpenClaw را نمی‌بینند.
    - وقتی پاسخ قابل مشاهده برای کاربر مفید باشد، والد نتیجه فرزند را با صدای عادی assistant بازنویسی می‌کند.

    با این مسیر به‌عنوان چت همتا‌به‌همتا بین والد و فرزند رفتار نکنید. فرزند از
    قبل یک کانال تکمیل بازگشتی به والد دارد.

  </Accordion>
  <Accordion title="sessions_send و تحویل A2A">
    `sessions_send` می‌تواند پس از spawn نشست دیگری را هدف بگیرد. برای نشست‌های
    همتای عادی، OpenClaw پس از تزریق پیام از مسیر پیگیری عامل‌به‌عامل (A2A)
    استفاده می‌کند:

    - منتظر پاسخ نشست هدف بمانید.
    - به‌صورت اختیاری اجازه دهید درخواست‌کننده و هدف تعداد محدودی از نوبت‌های پیگیری را تبادل کنند.
    - از هدف بخواهید یک پیام اعلام تولید کند.
    - آن اعلام را به کانال یا رشته قابل مشاهده تحویل دهید.

    آن مسیر A2A برای ارسال‌های همتا که فرستنده به پیگیری قابل مشاهده نیاز دارد
    یک fallback است. وقتی یک نشست نامرتبط بتواند هدف ACP را ببیند و به آن پیام
    بدهد، برای مثال تحت تنظیمات گسترده `tools.sessions.visibility`، فعال باقی
    می‌ماند.

    OpenClaw پیگیری A2A را فقط وقتی رد می‌کند که درخواست‌کننده والد فرزند ACP
    یک‌باره تحت مالکیت والد خودش باشد. در آن حالت، اجرای A2A روی تکمیل وظیفه
    می‌تواند والد را با نتیجه فرزند بیدار کند، پاسخ والد را دوباره به فرزند
    بفرستد، و یک حلقه پژواک والد/فرزند ایجاد کند. نتیجه `sessions_send` برای آن
    حالت فرزند تحت مالکیت، `delivery.status="skipped"` را گزارش می‌کند، چون مسیر
    تکمیل از قبل مسئول نتیجه است.

  </Accordion>
  <Accordion title="ازسرگیری یک نشست موجود">
    برای ادامه یک نشست ACP قبلی به‌جای شروع از ابتدا، از `resumeSessionId`
    استفاده کنید. عامل تاریخچه گفت‌وگوی خود را از طریق `session/load` بازپخش
    می‌کند، بنابراین با زمینه کامل آنچه قبلا رخ داده ادامه می‌دهد.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    موارد استفاده رایج:

    - انتقال یک نشست Codex از لپ‌تاپ به گوشی - به عامل خود بگویید از همان‌جایی که متوقف شده بودید ادامه دهد.
    - ادامه یک نشست کدنویسی که به‌صورت تعاملی در CLI شروع کرده بودید، اکنون به‌صورت headless از طریق عامل خود.
    - ادامه کاری که با راه‌اندازی دوباره gateway یا idle timeout قطع شده بود.

    نکته‌ها:

    - `resumeSessionId` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض sub-agent این فیلد فقط مخصوص ACP را نادیده می‌گیرد.
    - `streamTo` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض sub-agent این فیلد فقط مخصوص ACP را نادیده می‌گیرد.
    - `resumeSessionId` یک شناسه ازسرگیری ACP/harness محلیِ میزبان است، نه کلید نشست کانال OpenClaw؛ OpenClaw همچنان پیش از dispatch، سیاست spawn ACP و سیاست عامل هدف را بررسی می‌کند، در حالی که backend یا harness ACP مالک مجوزدهی برای بارگذاری آن شناسه upstream است.
    - `resumeSessionId` تاریخچه گفت‌وگوی ACP upstream را بازیابی می‌کند؛ `thread` و `mode` همچنان به‌طور عادی روی نشست جدید OpenClaw که ایجاد می‌کنید اعمال می‌شوند، بنابراین `mode: "session"` همچنان به `thread: true` نیاز دارد.
    - عامل هدف باید از `session/load` پشتیبانی کند (Codex و Claude Code پشتیبانی می‌کنند).
    - اگر شناسه نشست پیدا نشود، spawn با خطای روشن شکست می‌خورد - هیچ fallback بی‌صدایی به نشست جدید انجام نمی‌شود.

  </Accordion>
  <Accordion title="آزمون smoke پس از استقرار">
    پس از استقرار gateway، به‌جای اعتماد به آزمون‌های واحد، یک بررسی end-to-end
    زنده اجرا کنید:

    1. نسخه gateway مستقرشده و commit را روی میزبان هدف بررسی کنید.
    2. یک نشست پل ACPX موقت به یک عامل زنده باز کنید.
    3. از آن عامل بخواهید `sessions_spawn` را با `runtime: "acp"`، `agentId: "codex"`، `mode: "run"`، و وظیفه `Reply with exactly LIVE-ACP-SPAWN-OK` فراخوانی کند.
    4. `accepted=yes`، یک `childSessionKey` واقعی، و نبود خطای اعتبارسنجی را بررسی کنید.
    5. نشست پل موقت را پاک‌سازی کنید.

    دروازه را روی `mode: "run"` نگه دارید و `streamTo: "parent"` را رد کنید -
    `mode: "session"` متصل به رشته و مسیرهای stream-relay گذرهای یکپارچه‌سازی
    جداگانه و غنی‌تری هستند.

  </Accordion>
</AccordionGroup>

## سازگاری sandbox

نشست‌های ACP در حال حاضر روی runtime میزبان اجرا می‌شوند، **نه** داخل sandbox
OpenClaw.

<Warning>
**مرز امنیتی:**

- هارنس خارجی می‌تواند مطابق مجوزهای CLI خودش و `cwd` انتخاب‌شده بخواند/بنویسد.
- سیاست سندباکس OpenClaw اجرای هارنس ACP را **پوشش نمی‌دهد**.
- OpenClaw همچنان دروازه‌های قابلیت ACP، عامل‌های مجاز، مالکیت نشست، اتصال‌های کانال، و سیاست تحویل Gateway را اعمال می‌کند.
- برای کار بومی OpenClaw که با سندباکس اعمال می‌شود، از `runtime: "subagent"` استفاده کنید.

</Warning>

محدودیت‌های فعلی:

- اگر نشست درخواست‌کننده سندباکس شده باشد، ایجاد ACP هم برای `sessions_spawn({ runtime: "acp" })` و هم برای `/acp spawn` مسدود می‌شود.
- `sessions_spawn` با `runtime: "acp"` از `sandbox: "require"` پشتیبانی نمی‌کند.

## حل هدف نشست

بیشتر کنش‌های `/acp` یک هدف نشست اختیاری (`session-key`،
`session-id`، یا `session-label`) می‌پذیرند.

**ترتیب حل:**

1. آرگومان هدف صریح (یا `--session` برای `/acp steer`)
   - ابتدا کلید را امتحان می‌کند
   - سپس شناسه نشست با شکل UUID را امتحان می‌کند
   - سپس برچسب را امتحان می‌کند
2. اتصال نخ فعلی (اگر این گفتگو/نخ به یک نشست ACP متصل باشد).
3. بازگشت به نشست درخواست‌کننده فعلی.

اتصال‌های گفتگوی فعلی و اتصال‌های نخ هر دو در
مرحله ۲ مشارکت دارند.

اگر هیچ هدفی حل نشود، OpenClaw خطایی روشن برمی‌گرداند
(`Unable to resolve session target: ...`).

## کنترل‌های ACP

| فرمان               | کاری که انجام می‌دهد                                      | مثال                                                          |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | نشست ACP ایجاد می‌کند؛ اتصال فعلی یا اتصال نخ اختیاری.   | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | نوبت درحال‌اجرا را برای نشست هدف لغو می‌کند.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | دستور هدایت را به نشست درحال‌اجرا می‌فرستد.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | نشست را می‌بندد و هدف‌های نخ را جدا می‌کند.               | `/acp close`                                                  |
| `/acp status`        | بک‌اند، حالت، وضعیت، گزینه‌های زمان اجرا و قابلیت‌ها را نشان می‌دهد. | `/acp status`                                                 |
| `/acp set-mode`      | حالت زمان اجرا را برای نشست هدف تنظیم می‌کند.             | `/acp set-mode plan`                                          |
| `/acp set`           | نوشتن گزینه پیکربندی عمومی زمان اجرا.                     | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | بازنویسی پوشه کاری زمان اجرا را تنظیم می‌کند.             | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | پروفایل سیاست تأیید را تنظیم می‌کند.                      | `/acp permissions strict`                                     |
| `/acp timeout`       | زمان پایان زمان اجرا را تنظیم می‌کند (ثانیه).             | `/acp timeout 120`                                            |
| `/acp model`         | بازنویسی مدل زمان اجرا را تنظیم می‌کند.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | بازنویسی‌های گزینه زمان اجرای نشست را حذف می‌کند.         | `/acp reset-options`                                          |
| `/acp sessions`      | نشست‌های اخیر ACP را از ذخیره‌گاه فهرست می‌کند.           | `/acp sessions`                                               |
| `/acp doctor`        | سلامت بک‌اند، قابلیت‌ها و اصلاحات قابل اقدام.             | `/acp doctor`                                                 |
| `/acp install`       | مراحل نصب قطعی و فعال‌سازی را چاپ می‌کند.                 | `/acp install`                                                |

`/acp status` گزینه‌های مؤثر زمان اجرا به‌همراه شناسه‌های نشست در سطح زمان اجرا و
در سطح بک‌اند را نشان می‌دهد. وقتی بک‌اند فاقد قابلیتی باشد، خطاهای کنترل پشتیبانی‌نشده
به‌روشنی نمایش داده می‌شوند. `/acp sessions` ذخیره‌گاه نشست متصل فعلی یا نشست درخواست‌کننده را می‌خواند؛ توکن‌های هدف
(`session-key`، `session-id`، یا `session-label`) از طریق
کشف نشست Gateway، شامل ریشه‌های سفارشی `session.store` برای هر عامل،
حل می‌شوند.

### نگاشت گزینه‌های زمان اجرا

`/acp` فرمان‌های میان‌بر و یک تنظیم‌کننده عمومی دارد. عملیات‌های
معادل:

| فرمان                       | نگاشت می‌شود به                      | یادداشت‌ها                                                                                                                                                                          |
| --------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | کلید پیکربندی زمان اجرا `model`      | برای Codex ACP، OpenClaw مقدار `openai-codex/<model>` را به شناسه مدل سازگارگر نرمال‌سازی می‌کند و پسوندهای استدلال اسلش‌دار مانند `openai-codex/gpt-5.4/high` را به `reasoning_effort` نگاشت می‌کند. |
| `/acp set thinking <level>`  | کلید پیکربندی زمان اجرا `thinking`   | برای Codex ACP، OpenClaw در جایی که سازگارگر از آن پشتیبانی کند، `reasoning_effort` متناظر را می‌فرستد.                                                                            |
| `/acp permissions <profile>` | کلید پیکربندی زمان اجرا `approval_policy` | -                                                                                                                                                                                   |
| `/acp timeout <seconds>`     | کلید پیکربندی زمان اجرا `timeout`    | -                                                                                                                                                                                   |
| `/acp cwd <path>`            | بازنویسی cwd زمان اجرا               | به‌روزرسانی مستقیم.                                                                                                                                                                |
| `/acp set <key> <value>`     | عمومی                                | `key=cwd` از مسیر بازنویسی cwd استفاده می‌کند.                                                                                                                                     |
| `/acp reset-options`         | همه بازنویسی‌های زمان اجرا را پاک می‌کند | -                                                                                                                                                                                   |

## هارنس acpx، راه‌اندازی Plugin و مجوزها

برای پیکربندی هارنس acpx (نام‌های مستعار Claude Code / Codex / Gemini CLI)،
پل‌های MCP ابزارهای Plugin و ابزارهای OpenClaw، و حالت‌های مجوز ACP،
به
[عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup)
مراجعه کنید.

## عیب‌یابی

| نشانه                                                                      | علت محتمل                                                                                                             | رفع مشکل                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin بک‌اند موجود نیست، غیرفعال است، یا توسط `plugins.allow` مسدود شده است.                                        | Plugin بک‌اند را نصب و فعال کنید، وقتی آن فهرست مجاز تنظیم شده است `acpx` را در `plugins.allow` قرار دهید، سپس `/acp doctor` را اجرا کنید.                              |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP به‌صورت سراسری غیرفعال شده است.                                                                                   | `acp.enabled=true` را تنظیم کنید.                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | ارسال خودکار از پیام‌های عادی رشته غیرفعال شده است.                                                                  | برای ازسرگیری مسیریابی خودکار رشته، `acp.dispatch.enabled=true` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند.              |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent در فهرست مجاز نیست.                                                                                             | از `agentId` مجاز استفاده کنید یا `acp.allowedAgents` را به‌روزرسانی کنید.                                                                                              |
| `/acp doctor` reports backend not ready right after startup                 | Plugin بک‌اند موجود نیست، غیرفعال است، توسط سیاست مجاز/ممنوع مسدود شده است، یا فایل اجرایی پیکربندی‌شدهٔ آن در دسترس نیست. | Plugin بک‌اند را نصب/فعال کنید، `/acp doctor` را دوباره اجرا کنید، و اگر همچنان ناسالم ماند خطای نصب بک‌اند یا سیاست را بررسی کنید.                                  |
| Harness command not found                                                   | CLI آداپتور نصب نشده است، Plugin خارجی وجود ندارد، یا دریافت `npx` در اجرای نخست برای یک آداپتور غیر Codex ناموفق بوده است. | `/acp doctor` را اجرا کنید، آداپتور را روی میزبان Gateway نصب/از پیش گرم کنید، یا فرمان agent مربوط به acpx را صریح پیکربندی کنید.                                    |
| Model-not-found from the harness                                            | شناسهٔ مدل برای ارائه‌دهنده/هارنس دیگری معتبر است، اما برای این هدف ACP معتبر نیست.                                | از مدلی استفاده کنید که توسط آن هارنس فهرست شده است، مدل را در هارنس پیکربندی کنید، یا override را حذف کنید.                                                          |
| Vendor auth error from the harness                                          | OpenClaw سالم است، اما CLI/ارائه‌دهندهٔ هدف وارد نشده است.                                                          | وارد شوید یا کلید ارائه‌دهندهٔ لازم را در محیط میزبان Gateway فراهم کنید.                                                                                                |
| `Unable to resolve session target: ...`                                     | توکن کلید/شناسه/برچسب نامعتبر است.                                                                                   | `/acp sessions` را اجرا کنید، کلید/برچسب دقیق را کپی کنید، و دوباره تلاش کنید.                                                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` بدون یک گفت‌وگوی فعال قابل اتصال استفاده شده است.                                                     | به چت/کانال هدف بروید و دوباره تلاش کنید، یا spawn بدون اتصال استفاده کنید.                                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | آداپتور قابلیت اتصال ACP به گفت‌وگوی فعلی را ندارد.                                                                  | در صورت پشتیبانی از `/acp spawn ... --thread ...` استفاده کنید، `bindings[]` سطح بالا را پیکربندی کنید، یا به کانال پشتیبانی‌شده بروید.                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` خارج از زمینهٔ رشته استفاده شده است.                                                                 | به رشتهٔ هدف بروید یا از `--thread auto`/`off` استفاده کنید.                                                                                                           |
| `Only <user-id> can rebind this channel/conversation/thread.`               | کاربر دیگری مالک هدف اتصال فعال است.                                                                                  | به‌عنوان مالک دوباره متصل کنید یا از گفت‌وگو یا رشتهٔ دیگری استفاده کنید.                                                                                              |
| `Thread bindings are unavailable for <channel>.`                            | آداپتور قابلیت اتصال رشته را ندارد.                                                                                  | از `--thread off` استفاده کنید یا به آداپتور/کانال پشتیبانی‌شده بروید.                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | زمان اجرای ACP سمت میزبان است؛ نشست درخواست‌کننده sandbox شده است.                                                  | از نشست‌های sandbox شده از `runtime="subagent"` استفاده کنید، یا ACP spawn را از یک نشست غیر sandbox اجرا کنید.                                                       |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` برای زمان اجرای ACP درخواست شده است.                                                             | برای sandbox الزامی از `runtime="subagent"` استفاده کنید، یا ACP را با `sandbox="inherit"` از یک نشست غیر sandbox به کار ببرید.                                        |
| `Cannot apply --model ... did not advertise model support`                  | هارنس هدف تعویض عمومی مدل ACP را ارائه نمی‌کند.                                                                      | از هارنسی استفاده کنید که ACP `models`/`session/set_model` را اعلام می‌کند، از ارجاع‌های مدل Codex ACP استفاده کنید، یا اگر هارنس پرچم راه‌اندازی خودش را دارد مدل را مستقیم در آن پیکربندی کنید. |
| Missing ACP metadata for bound session                                      | فرادادهٔ نشست ACP کهنه/حذف شده است.                                                                                   | با `/acp spawn` دوباره ایجاد کنید، سپس رشته را دوباره متصل/متمرکز کنید.                                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` نوشتن/اجرا را در نشست ACP غیرتعاملی مسدود می‌کند.                                                  | `plugins.entries.acpx.config.permissionMode` را روی `approve-all` تنظیم کنید و gateway را بازراه‌اندازی کنید. [پیکربندی مجوز](/fa/tools/acp-agents-setup#permission-configuration) را ببینید. |
| ACP session fails early with little output                                  | درخواست‌های مجوز توسط `permissionMode`/`nonInteractivePermissions` مسدود شده‌اند.                                  | لاگ‌های gateway را برای `AcpRuntimeError` بررسی کنید. برای مجوزهای کامل، `permissionMode=approve-all` را تنظیم کنید؛ برای افت تدریجی و کنترل‌شده، `nonInteractivePermissions=deny` را تنظیم کنید. |
| ACP session stalls indefinitely after completing work                       | فرایند هارنس پایان یافته اما نشست ACP تکمیل را گزارش نکرده است.                                                     | با `ps aux \| grep acpx` پایش کنید؛ فرایندهای کهنه را دستی بکشید.                                                                                                     |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | پاکت رویداد داخلی از مرز ACP نشت کرده است.                                                                            | OpenClaw را به‌روزرسانی کنید و جریان تکمیل را دوباره اجرا کنید؛ هارنس‌های خارجی باید فقط promptهای تکمیل ساده دریافت کنند.                                          |

## مرتبط

- [agentهای ACP - راه‌اندازی](/fa/tools/acp-agents-setup)
- [ارسال agent](/fa/tools/agent-send)
- [بک‌اندهای CLI](/fa/gateway/cli-backends)
- [هارنس Codex](/fa/plugins/codex-harness)
- [ابزارهای sandbox چند-agent](/fa/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (حالت پل)](/fa/cli/acp)
- [زیر-agentها](/fa/tools/subagents)
