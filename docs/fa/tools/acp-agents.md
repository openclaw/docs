---
read_when:
    - اجرای هارنس‌های کدنویسی از طریق ACP
    - راه‌اندازی نشست‌های ACP مقید به گفت‌وگو در کانال‌های پیام‌رسانی
    - پیوند دادن یک گفت‌وگوی کانال پیام به یک نشست پایدار ACP
    - عیب‌یابی بک‌اند ACP، اتصال‌دهی Plugin یا تحویل تکمیل
    - کار با دستورهای /acp از چت
sidebarTitle: ACP agents
summary: هارنس‌های کدنویسی خارجی (Claude Code، Cursor، Gemini CLI، Codex ACP صریح، OpenClaw ACP، OpenCode) را از طریق بک‌اند ACP اجرا کنید
title: عامل‌های ACP
x-i18n:
    generated_at: "2026-05-02T12:04:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

جلسات [پروتکل کلاینت عامل (ACP)](https://agentclientprotocol.com/)
به OpenClaw اجازه می‌دهند مهارهای کدنویسی خارجی (برای مثال Pi، Claude Code،
Cursor، Copilot، Droid، OpenClaw ACP، OpenCode، Gemini CLI و دیگر
مهارهای پشتیبانی‌شده ACPX) را از طریق یک Plugin پشتیبان ACP اجرا کند.

هر ایجاد جلسه ACP به‌عنوان یک [وظیفه پس‌زمینه](/fa/automation/tasks) ردیابی می‌شود.

<Note>
**ACP مسیر مهار خارجی است، نه مسیر پیش‌فرض Codex.** Plugin
بومی سرور برنامه Codex کنترل‌های `/codex ...` و runtime توکار
`agentRuntime.id: "codex"` را در اختیار دارد؛ ACP کنترل‌های
`/acp ...` و جلسه‌های `sessions_spawn({ runtime: "acp" })` را در اختیار دارد.

اگر می‌خواهید Codex یا Claude Code به‌عنوان یک کلاینت خارجی MCP
مستقیماً به گفتگوهای کانال موجود OpenClaw وصل شود، به‌جای ACP از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.
</Note>

## کدام صفحه را می‌خواهم؟

| می‌خواهید…                                                                                   | از این استفاده کنید                    | یادداشت‌ها                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex را در گفتگوی فعلی متصل یا کنترل کنید                                                    | `/codex bind`, `/codex threads`        | مسیر بومی سرور برنامه Codex وقتی Plugin `codex` فعال است؛ شامل پاسخ‌های گفتگوی متصل، ارسال تصویر، مدل/سریع/مجوزها، توقف و کنترل‌های هدایت است. ACP یک جایگزین صریح است |
| Claude Code، Gemini CLI، Codex ACP صریح، یا مهار خارجی دیگری را _از طریق_ OpenClaw اجرا کنید | این صفحه                               | جلسه‌های متصل به گفتگو، `/acp spawn`، `sessions_spawn({ runtime: "acp" })`، وظایف پس‌زمینه، کنترل‌های runtime                                                                                   |
| یک جلسه OpenClaw Gateway را _به‌عنوان_ یک سرور ACP برای ویرایشگر یا کلاینت ارائه کنید        | [`openclaw acp`](/fa/cli/acp)             | حالت پل. IDE/کلاینت از طریق stdio/WebSocket با ACP به OpenClaw صحبت می‌کند                                                                                                                        |
| یک CLI هوش مصنوعی محلی را به‌عنوان مدل جایگزین فقط‌متنی دوباره استفاده کنید                  | [پشتبان‌های CLI](/fa/gateway/cli-backends) | ACP نیست. بدون ابزارهای OpenClaw، بدون کنترل‌های ACP، بدون runtime مهار                                                                                                                           |

## آیا این آماده استفاده است؟

بله، پس از نصب Plugin رسمی runtime مربوط به ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

checkoutهای منبع می‌توانند پس از `pnpm install` از Plugin فضای کاری محلی
`extensions/acpx` استفاده کنند. برای بررسی آمادگی، `/acp doctor` را اجرا کنید.

OpenClaw فقط زمانی عامل‌ها را درباره ایجاد ACP آموزش می‌دهد که ACP
**واقعاً قابل استفاده** باشد: ACP باید فعال باشد، dispatch نباید غیرفعال
باشد، جلسه فعلی نباید توسط sandbox مسدود شده باشد، و یک پشتیبان runtime
باید بارگذاری شده باشد. اگر این شرایط برقرار نباشند، Skills مربوط به
ACP Plugin و راهنمایی ACP برای `sessions_spawn` پنهان می‌مانند تا عامل
یک پشتیبان در دسترس نبودنی را پیشنهاد نکند.

<AccordionGroup>
  <Accordion title="نکات حساس اجرای اول">
    - اگر `plugins.allow` تنظیم شده باشد، یک فهرست محدودکننده Plugin است و **باید** شامل `acpx` باشد؛ در غیر این صورت پشتیبان ACP نصب‌شده عمداً مسدود می‌شود و `/acp doctor` ورودی allowlist گمشده را گزارش می‌کند.
    - آداپتور Codex ACP همراه با Plugin `acpx` آماده‌سازی می‌شود و در صورت امکان به‌صورت محلی راه‌اندازی می‌شود.
    - دیگر آداپتورهای مهار هدف ممکن است همچنان در اولین استفاده با `npx` بنا به درخواست دریافت شوند.
    - احراز هویت فروشنده همچنان باید برای آن مهار روی میزبان وجود داشته باشد.
    - اگر میزبان npm یا دسترسی شبکه نداشته باشد، دریافت آداپتور در اجرای اول تا زمان پیش‌گرم شدن کش‌ها یا نصب آداپتور از راهی دیگر شکست می‌خورد.

  </Accordion>
  <Accordion title="پیش‌نیازهای runtime">
    ACP یک فرایند مهار خارجی واقعی را راه‌اندازی می‌کند. OpenClaw مالک مسیریابی،
    وضعیت وظیفه پس‌زمینه، تحویل، اتصال‌ها و سیاست است؛ مهار مالک ورود ارائه‌دهنده،
    فهرست مدل‌ها، رفتار فایل‌سیستم و ابزارهای بومی خودش است.

    پیش از مقصر دانستن OpenClaw، بررسی کنید:

    - `/acp doctor` یک پشتیبان فعال و سالم را گزارش می‌کند.
    - وقتی allowlist مربوطه تنظیم شده است، شناسه هدف توسط `acp.allowedAgents` مجاز است.
    - فرمان مهار می‌تواند روی میزبان Gateway شروع شود.
    - احراز هویت ارائه‌دهنده برای آن مهار حاضر است (`claude`, `codex`, `gemini`, `opencode`, `droid`, و غیره).
    - مدل انتخاب‌شده برای آن مهار وجود دارد — شناسه‌های مدل بین مهارها قابل حمل نیستند.
    - `cwd` درخواست‌شده وجود دارد و قابل دسترسی است، یا `cwd` را حذف کنید و اجازه دهید پشتیبان از پیش‌فرض خود استفاده کند.
    - حالت مجوز با کار همخوان است. جلسه‌های غیرتعاملی نمی‌توانند روی اعلان‌های مجوز بومی کلیک کنند، بنابراین اجراهای کدنویسی سنگین از نظر نوشتن/اجرا معمولاً به پروفایل مجوز ACPX نیاز دارند که بتواند بدون رابط تعاملی ادامه دهد.

  </Accordion>
</AccordionGroup>

ابزارهای OpenClaw Plugin و ابزارهای داخلی OpenClaw به‌طور پیش‌فرض در معرض
مهارهای ACP قرار نمی‌گیرند. پل‌های صریح MCP را در
[عامل‌های ACP — راه‌اندازی](/fa/tools/acp-agents-setup) فقط زمانی فعال کنید
که مهار باید آن ابزارها را مستقیماً فراخوانی کند.

## هدف‌های مهار پشتیبانی‌شده

با پشتیبان `acpx`، از این شناسه‌های مهار به‌عنوان هدف‌های `/acp spawn <id>`
یا `sessions_spawn({ runtime: "acp", agentId: "<id>" })` استفاده کنید:

| شناسه مهار | پشتیبان معمول                                  | یادداشت‌ها                                                                         |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | آداپتور Claude Code ACP                        | به احراز هویت Claude Code روی میزبان نیاز دارد.                                    |
| `codex`    | آداپتور Codex ACP                              | فقط زمانی جایگزین صریح ACP است که `/codex` بومی در دسترس نباشد یا ACP درخواست شده باشد. |
| `copilot`  | آداپتور GitHub Copilot ACP                     | به احراز هویت Copilot CLI/runtime نیاز دارد.                                       |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | اگر نصب محلی نقطه ورود ACP متفاوتی ارائه می‌کند، فرمان acpx را override کنید.      |
| `droid`    | Factory Droid CLI                              | به احراز هویت Factory/Droid یا `FACTORY_API_KEY` در محیط مهار نیاز دارد.           |
| `gemini`   | آداپتور Gemini CLI ACP                         | به احراز هویت Gemini CLI یا راه‌اندازی کلید API نیاز دارد.                         |
| `iflow`    | iFlow CLI                                      | دسترس‌پذیری آداپتور و کنترل مدل به CLI نصب‌شده بستگی دارد.                         |
| `kilocode` | Kilo Code CLI                                  | دسترس‌پذیری آداپتور و کنترل مدل به CLI نصب‌شده بستگی دارد.                         |
| `kimi`     | Kimi/Moonshot CLI                              | به احراز هویت Kimi/Moonshot روی میزبان نیاز دارد.                                  |
| `kiro`     | Kiro CLI                                       | دسترس‌پذیری آداپتور و کنترل مدل به CLI نصب‌شده بستگی دارد.                         |
| `opencode` | آداپتور OpenCode ACP                           | به احراز هویت OpenCode CLI/ارائه‌دهنده نیاز دارد.                                  |
| `openclaw` | پل OpenClaw Gateway از طریق `openclaw acp`     | به یک مهار آگاه از ACP اجازه می‌دهد با یک جلسه OpenClaw Gateway صحبت کند.          |
| `pi`       | runtime توکار Pi/OpenClaw                      | برای آزمایش‌های مهار بومی OpenClaw استفاده می‌شود.                                 |
| `qwen`     | Qwen Code / Qwen CLI                           | به احراز هویت سازگار با Qwen روی میزبان نیاز دارد.                                 |

نام‌های مستعار عامل سفارشی acpx را می‌توان در خود acpx پیکربندی کرد، اما
سیاست OpenClaw همچنان `acp.allowedAgents` و هر نگاشت
`agents.list[].runtime.acp.agent` را پیش از dispatch بررسی می‌کند.

## راهنمای اجرای اپراتور

جریان سریع `/acp` از گفتگو:

<Steps>
  <Step title="ایجاد">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، یا
    `/acp spawn codex --bind here` صریح.
  </Step>
  <Step title="کار">
    در گفتگو یا رشته متصل ادامه دهید (یا کلید جلسه را صریحاً هدف بگیرید).
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
    `/acp cancel` (نوبت فعلی) یا `/acp close` (جلسه + اتصال‌ها).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="جزئیات چرخه عمر">
    - ایجاد، یک جلسه runtime ACP را می‌سازد یا از سر می‌گیرد، فراداده ACP را در ذخیره‌ساز جلسه OpenClaw ثبت می‌کند، و وقتی اجرا متعلق به والد باشد ممکن است یک وظیفه پس‌زمینه بسازد.
    - جلسه‌های ACP متعلق به والد حتی وقتی جلسه runtime پایدار است به‌عنوان کار پس‌زمینه در نظر گرفته می‌شوند؛ تکمیل و تحویل بین سطح‌ها از طریق اعلان‌گر وظیفه والد انجام می‌شود، نه مثل یک جلسه گفتگوی عادی رو به کاربر.
    - نگهداری وظیفه، جلسه‌های یک‌باره ACP متعلق به والد را که پایانی یا orphaned هستند می‌بندد. جلسه‌های ACP پایدار تا زمانی که یک اتصال گفتگوی فعال باقی بماند حفظ می‌شوند؛ جلسه‌های پایدار قدیمی بدون اتصال فعال بسته می‌شوند تا پس از پایان وظیفه مالک یا حذف رکورد وظیفه آن، بی‌صدا از سر گرفته نشوند.
    - پیام‌های پیگیری متصل تا زمانی که اتصال بسته، از تمرکز خارج، بازنشانی، یا منقضی شود مستقیماً به جلسه ACP می‌روند.
    - فرمان‌های Gateway محلی می‌مانند. `/acp ...`، `/status`، و `/unfocus` هرگز به‌عنوان متن prompt عادی به یک مهار ACP متصل ارسال نمی‌شوند.
    - وقتی پشتیبان از لغو پشتیبانی می‌کند، `cancel` نوبت فعال را لغو می‌کند؛ اتصال یا فراداده جلسه را حذف نمی‌کند.
    - `close` از دید OpenClaw جلسه ACP را پایان می‌دهد و اتصال را حذف می‌کند. اگر مهار از resume پشتیبانی کند، ممکن است همچنان تاریخچه بالادستی خودش را نگه دارد.
    - workerهای runtime بیکار پس از `acp.runtime.ttlMinutes` واجد شرایط پاک‌سازی هستند؛ فراداده جلسه ذخیره‌شده همچنان برای `/acp sessions` در دسترس می‌ماند.

  </Accordion>
  <Accordion title="قواعد مسیریابی Codex بومی">
    محرک‌های زبان طبیعی که وقتی فعال است باید به **Plugin بومی Codex**
    مسیریابی شوند:

    - "این کانال Discord را به Codex متصل کن."
    - "این گفتگو را به رشته Codex با شناسه `<id>` وصل کن."
    - "رشته‌های Codex را نشان بده، سپس این یکی را متصل کن."

    اتصال گفتگوی Codex بومی مسیر پیش‌فرض کنترل گفتگو است.
    ابزارهای پویای OpenClaw همچنان از طریق OpenClaw اجرا می‌شوند، در حالی که
    ابزارهای بومی Codex مانند shell/apply-patch داخل Codex اجرا می‌شوند.
    برای رویدادهای ابزار بومی Codex، OpenClaw در هر نوبت یک رله hook بومی
    تزریق می‌کند تا hookهای Plugin بتوانند `before_tool_call` را مسدود کنند،
    `after_tool_call` را مشاهده کنند، و رویدادهای Codex `PermissionRequest`
    را از طریق تأییدهای OpenClaw مسیریابی کنند. hookهای Codex `Stop` به
    `before_agent_finalize` در OpenClaw رله می‌شوند، جایی که Pluginها می‌توانند
    پیش از نهایی‌سازی پاسخ توسط Codex، یک عبور مدل دیگر درخواست کنند. رله عمداً
    محافظه‌کار می‌ماند: آرگومان‌های ابزار بومی Codex را تغییر نمی‌دهد و رکوردهای
    رشته Codex را بازنویسی نمی‌کند. فقط زمانی از ACP صریح استفاده کنید که مدل
    runtime/جلسه ACP را می‌خواهید. مرز پشتیبانی Codex توکار در
    [قرارداد پشتیبانی مهار Codex نسخه ۱](/fa/plugins/codex-harness#v1-support-contract) مستند شده است.

  </Accordion>
  <Accordion title="برگه تقلب انتخاب مدل / ارائه‌دهنده / runtime">
    - `openai-codex/*` — مسیر PI Codex OAuth/اشتراک.
    - `openai/*` به‌همراه `agentRuntime.id: "codex"` — runtime تعبیه‌شده بومی Codex app-server.
    - `/codex ...` — کنترل گفت‌وگوی بومی Codex.
    - `/acp ...` یا `runtime: "acp"` — کنترل صریح ACP/acpx.

  </Accordion>
  <Accordion title="محرک‌های زبان طبیعی برای مسیریابی ACP">
    محرک‌هایی که باید به runtime ACP مسیریابی شوند:

    - "این را به‌عنوان یک نشست یک‌باره Claude Code ACP اجرا کن و نتیجه را خلاصه کن."
    - "برای این کار از Gemini CLI در یک رشته استفاده کن، سپس پیگیری‌ها را در همان رشته نگه دار."
    - "Codex را از طریق ACP در یک رشته پس‌زمینه اجرا کن."

    OpenClaw مقدار `runtime: "acp"` را انتخاب می‌کند، harness `agentId` را resolve می‌کند،
    در صورت پشتیبانی به گفت‌وگو یا رشته فعلی bind می‌شود، و
    پیگیری‌ها را تا زمان بسته‌شدن/انقضا به همان نشست مسیریابی می‌کند. Codex فقط
    زمانی این مسیر را دنبال می‌کند که ACP/acpx صریح باشد یا Plugin بومی Codex
    برای عملیات درخواستی در دسترس نباشد.

    برای `sessions_spawn`، `runtime: "acp"` فقط زمانی اعلام می‌شود که ACP
    فعال باشد، درخواست‌کننده sandbox نشده باشد، و یک بک‌اند runtime
    ACP بارگذاری شده باشد. `acp.dispatch.enabled=false` ارسال خودکار
    رشته ACP را موقتاً متوقف می‌کند، اما فراخوانی‌های صریح
    `sessions_spawn({ runtime: "acp" })` را پنهان یا مسدود نمی‌کند. این مورد شناسه‌های harness ACP مانند `codex`،
    `claude`، `droid`، `gemini` یا `opencode` را هدف می‌گیرد. یک شناسه عادی
    عامل پیکربندی OpenClaw از `agents_list` را ارسال نکنید، مگر اینکه آن ورودی
    صریحاً با `agents.list[].runtime.type="acp"` پیکربندی شده باشد؛
    در غیر این صورت از runtime پیش‌فرض sub-agent استفاده کنید. وقتی یک عامل OpenClaw
    با `runtime.type="acp"` پیکربندی می‌شود، OpenClaw از
    `runtime.acp.agent` به‌عنوان شناسه harness زیربنایی استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## ACP در برابر sub-agentها

وقتی یک runtime harness خارجی می‌خواهید از ACP استفاده کنید. برای bind/کنترل گفت‌وگوی Codex وقتی Plugin
`codex` فعال است، از **Codex app-server بومی** استفاده کنید. وقتی اجراهای واگذارشده بومی OpenClaw
می‌خواهید، از **sub-agentها** استفاده کنید.

| حوزه          | نشست ACP                           | اجرای sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin بک‌اند ACP (برای مثال acpx) | runtime بومی sub-agent در OpenClaw  |
| کلید نشست   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| فرمان‌های اصلی | `/acp ...`                            | `/subagents ...`                   |
| ابزار spawn    | `sessions_spawn` با `runtime:"acp"` | `sessions_spawn` (runtime پیش‌فرض) |

همچنین ببینید [Sub-agents](/fa/tools/subagents).

## ACP چگونه Claude Code را اجرا می‌کند

برای Claude Code از طریق ACP، stack این است:

1. سطح کنترل نشست ACP در OpenClaw.
2. Plugin runtime رسمی `@openclaw/acpx`.
3. آداپتور Claude ACP.
4. سازوکار runtime/نشست سمت Claude.

ACP Claude یک **نشست harness** با کنترل‌های ACP، ازسرگیری نشست،
ردیابی کار پس‌زمینه، و bind اختیاری گفت‌وگو/رشته است.

بک‌اندهای CLI runtimeهای fallback محلی جداگانه و فقط متنی هستند — ببینید
[بک‌اندهای CLI](/fa/gateway/cli-backends).

برای اپراتورها، قاعده عملی این است:

- **`/acp spawn`، نشست‌های قابل bind، کنترل‌های runtime، یا کار پایدار harness می‌خواهید؟** از ACP استفاده کنید.
- **fallback متنی محلی ساده از طریق CLI خام می‌خواهید؟** از بک‌اندهای CLI استفاده کنید.

## نشست‌های bind شده

### مدل ذهنی

- **سطح چت** — جایی که افراد به صحبت ادامه می‌دهند (کانال Discord، موضوع Telegram، چت iMessage).
- **نشست ACP** — وضعیت runtime پایدار Codex/Claude/Gemini که OpenClaw به آن مسیریابی می‌کند.
- **رشته/موضوع فرزند** — یک سطح پیام‌رسانی اضافی اختیاری که فقط با `--thread ...` ایجاد می‌شود.
- **فضای کاری runtime** — محل filesystem (`cwd`، checkout مخزن، فضای کاری بک‌اند) که harness در آن اجرا می‌شود. مستقل از سطح چت.

### Bindهای گفت‌وگوی فعلی

`/acp spawn <harness> --bind here` گفت‌وگوی فعلی را به نشست ACP
spawn شده pin می‌کند — بدون رشته فرزند، همان سطح چت. OpenClaw همچنان
مالک transport، auth، safety و delivery می‌ماند. پیام‌های پیگیری در آن
گفت‌وگو به همان نشست مسیریابی می‌شوند؛ `/new` و `/reset` نشست را
درجا reset می‌کنند؛ `/acp close` binding را حذف می‌کند.

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
  <Accordion title="قواعد Binding و انحصاری‌بودن">
    - `--bind here` و `--thread ...` با هم ناسازگارند.
    - `--bind here` فقط روی کانال‌هایی کار می‌کند که binding گفت‌وگوی فعلی را اعلام می‌کنند؛ در غیر این صورت OpenClaw یک پیام واضحِ پشتیبانی‌نشده برمی‌گرداند. Bindingها پس از restart شدن gateway هم باقی می‌مانند.
    - در Discord، `spawnSessions` ایجاد رشته فرزند را برای `--thread auto|here` کنترل می‌کند — نه `--bind here`.
    - اگر بدون `--cwd` به یک عامل ACP متفاوت spawn کنید، OpenClaw به‌طور پیش‌فرض فضای کاری **عامل هدف** را inherit می‌کند. مسیرهای inherit شده گمشده (`ENOENT`/`ENOTDIR`) به پیش‌فرض بک‌اند fallback می‌کنند؛ خطاهای دسترسی دیگر (مثلاً `EACCES`) به‌صورت خطاهای spawn نمایش داده می‌شوند.
    - فرمان‌های مدیریت Gateway در گفت‌وگوهای bind شده محلی می‌مانند — فرمان‌های `/acp ...` توسط OpenClaw پردازش می‌شوند، حتی وقتی متن معمولی پیگیری به نشست ACP bind شده مسیریابی می‌شود؛ `/status` و `/unfocus` نیز هر زمان که پردازش فرمان برای آن سطح فعال باشد، محلی می‌مانند.

  </Accordion>
  <Accordion title="نشست‌های bind شده به رشته">
    وقتی bindingهای رشته برای یک آداپتور کانال فعال باشند:

    - OpenClaw یک رشته را به یک نشست ACP هدف bind می‌کند.
    - پیام‌های پیگیری در آن رشته به نشست ACP bind شده مسیریابی می‌شوند.
    - خروجی ACP به همان رشته برگردانده می‌شود.
    - Unfocus/close/archive/idle-timeout یا انقضای max-age binding را حذف می‌کند.
    - `/acp close`، `/acp cancel`، `/acp status`، `/status` و `/unfocus` فرمان‌های Gateway هستند، نه promptهایی برای harness ACP.

    feature flagهای لازم برای ACP bind شده به رشته:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` به‌طور پیش‌فرض روشن است (برای توقف موقت ارسال خودکار رشته ACP، مقدار `false` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند).
    - spawn نشست رشته آداپتور کانال فعال باشد (پیش‌فرض: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    پشتیبانی از binding رشته به آداپتور وابسته است. اگر آداپتور کانال فعال
    از binding رشته پشتیبانی نکند، OpenClaw یک پیام واضحِ
    پشتیبانی‌نشده/ناموجود برمی‌گرداند.

  </Accordion>
  <Accordion title="کانال‌های پشتیبان رشته">
    - هر آداپتور کانالی که قابلیت binding نشست/رشته را ارائه کند.
    - پشتیبانی داخلی فعلی: رشته‌ها/کانال‌های **Discord**، موضوع‌های **Telegram** (موضوع‌های forum در گروه‌ها/supergroupها و موضوع‌های DM).
    - کانال‌های Plugin می‌توانند از طریق همان رابط binding پشتیبانی اضافه کنند.

  </Accordion>
</AccordionGroup>

## Bindingهای کانال پایدار

برای workflowهای غیرموقتی، bindingهای پایدار ACP را در
ورودی‌های سطح بالای `bindings[]` پیکربندی کنید.

### مدل Binding

<ParamField path="bindings[].type" type='"acp"'>
  یک binding گفت‌وگوی ACP پایدار را مشخص می‌کند.
</ParamField>
<ParamField path="bindings[].match" type="object">
  گفت‌وگوی هدف را شناسایی می‌کند. شکل‌ها بر اساس کانال:

- **کانال/رشته Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **موضوع forum در Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/گروه BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای bindingهای گروه پایدار، `chat_id:*` یا `chat_identifier:*` را ترجیح دهید.
- **DM/گروه iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای bindingهای گروه پایدار، `chat_id:*` را ترجیح دهید.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  شناسه عامل مالک OpenClaw.
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
  override اختیاری بک‌اند.
</ParamField>

### پیش‌فرض‌های runtime برای هر عامل

برای تعریف پیش‌فرض‌های ACP یک‌بار برای هر عامل، از `agents.list[].runtime` استفاده کنید:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (شناسه harness، مثلاً `codex` یا `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ترتیب تقدم override برای نشست‌های ACP bind شده:**

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

- OpenClaw پیش از استفاده اطمینان می‌دهد که نشست ACP پیکربندی‌شده وجود دارد.
- پیام‌ها در آن کانال یا موضوع به نشست ACP پیکربندی‌شده مسیریابی می‌شوند.
- در گفت‌وگوهای bind شده، `/new` و `/reset` همان کلید نشست ACP را درجا reset می‌کنند.
- Bindingهای runtime موقت (برای مثال آن‌هایی که توسط جریان‌های focus رشته ایجاد شده‌اند) همچنان در صورت وجود اعمال می‌شوند.
- برای spawnهای ACP بین‌عاملی بدون `cwd` صریح، OpenClaw فضای کاری عامل هدف را از پیکربندی عامل inherit می‌کند.
- مسیرهای فضای کاری inherit شده گمشده به cwd پیش‌فرض بک‌اند fallback می‌کنند؛ خطاهای دسترسی برای مسیرهای موجود به‌صورت خطاهای spawn نمایش داده می‌شوند.

## شروع نشست‌های ACP

دو روش برای شروع یک نشست ACP وجود دارد:

<Tabs>
  <Tab title="از sessions_spawn">
    برای شروع یک نشست ACP از یک turn عامل یا
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
    مقدار پیش‌فرض `runtime` برابر `subagent` است، پس برای نشست‌های ACP مقدار `runtime: "acp"` را صریح تنظیم کنید. اگر `agentId` حذف شود، OpenClaw در صورت پیکربندی از `acp.defaultAgent` استفاده می‌کند. `mode: "session"` برای نگه داشتن یک گفت‌وگوی متصل و ماندگار به `thread: true` نیاز دارد.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    برای کنترل صریح اپراتور از داخل گفت‌وگو، از `/acp spawn` استفاده کنید.

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
  اعلان اولیه‌ای که به نشست ACP فرستاده می‌شود.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  برای نشست‌های ACP باید `"acp"` باشد.
</ParamField>
<ParamField path="agentId" type="string">
  شناسه هارنس مقصد ACP. اگر `acp.defaultAgent` تنظیم شده باشد، به آن بازمی‌گردد.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  در جاهایی که پشتیبانی می‌شود، جریان اتصال رشته را درخواست می‌کند.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` تک‌مرحله‌ای است؛ `"session"` ماندگار است. اگر `thread: true` باشد و `mode` حذف شود، OpenClaw ممکن است بسته به مسیر runtime به‌طور پیش‌فرض رفتار ماندگار را انتخاب کند. `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cwd" type="string">
  دایرکتوری کاری runtime درخواستی (طبق سیاست backend/runtime اعتبارسنجی می‌شود). اگر حذف شود، ACP spawn در صورت پیکربندی، فضای کاری عامل مقصد را به ارث می‌برد؛ مسیرهای ارث‌بری‌شده‌ی گمشده به پیش‌فرض‌های backend بازمی‌گردند، در حالی که خطاهای واقعی دسترسی برگردانده می‌شوند.
</ParamField>
<ParamField path="label" type="string">
  برچسب روبه‌روی اپراتور که در متن نشست/بنر استفاده می‌شود.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  به‌جای ساخت یک نشست جدید، یک نشست ACP موجود را از سر می‌گیرد. عامل تاریخچه گفت‌وگوی خود را از طریق `session/load` بازپخش می‌کند. به `runtime: "acp"` نیاز دارد.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` خلاصه‌های پیشرفت اجرای اولیه ACP را به‌صورت رویدادهای سیستم به نشست درخواست‌کننده برمی‌گرداند. پاسخ‌های پذیرفته‌شده شامل `streamLogPath` هستند که به یک گزارش JSONL با دامنه نشست اشاره می‌کند (`<sessionId>.acp-stream.jsonl`) و می‌توانید آن را برای تاریخچه کامل relay دنبال کنید.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  نوبت فرزند ACP را پس از N ثانیه لغو می‌کند. `0` نوبت را روی مسیر بدون مهلت زمانی Gateway نگه می‌دارد. همان مقدار به اجرای Gateway و runtime ACP اعمال می‌شود تا هارنس‌های متوقف‌شده یا دارای سهمیه تمام‌شده، خط عامل والد را برای مدت نامحدود اشغال نکنند.
</ParamField>
<ParamField path="model" type="string">
  بازنویسی صریح مدل برای نشست فرزند ACP. Codex ACP spawnها ارجاع‌های Codex در OpenClaw مانند `openai-codex/gpt-5.4` را پیش از `session/new` به پیکربندی راه‌اندازی Codex ACP نرمال می‌کنند؛ فرم‌های slash مانند `openai-codex/gpt-5.4/high` تلاش استدلال Codex ACP را نیز تنظیم می‌کنند. هارنس‌های دیگر باید `models` در ACP را اعلام کنند و از `session/set_model` پشتیبانی کنند؛ در غیر این صورت OpenClaw/acpx به‌جای بازگشت بی‌صدا به پیش‌فرض عامل مقصد، با خطایی روشن شکست می‌خورد.
</ParamField>
<ParamField path="thinking" type="string">
  تلاش صریح فکر/استدلال. برای Codex ACP، `minimal` به تلاش کم نگاشت می‌شود، `low`/`medium`/`high`/`xhigh` مستقیما نگاشت می‌شوند، و `off` بازنویسی راه‌اندازی تلاش استدلال را حذف می‌کند.
</ParamField>

## حالت‌های اتصال spawn و رشته

<Tabs>
  <Tab title="--bind here|off">
    | حالت   | رفتار                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | گفت‌وگوی فعال فعلی را درجا متصل می‌کند؛ اگر هیچ‌کدام فعال نباشد شکست می‌خورد. |
    | `off`  | اتصال گفت‌وگوی فعلی ایجاد نمی‌کند.                          |

    نکته‌ها:

    - `--bind here` ساده‌ترین مسیر اپراتور برای «این کانال یا گفت‌وگو را با پشتیبانی Codex بساز» است.
    - `--bind here` رشته فرزند ایجاد نمی‌کند.
    - `--bind here` فقط در کانال‌هایی در دسترس است که پشتیبانی اتصال گفت‌وگوی فعلی را ارائه می‌کنند.
    - `--bind` و `--thread` را نمی‌توان در یک فراخوانی `/acp spawn` با هم ترکیب کرد.

  </Tab>
  <Tab title="--thread auto|here|off">
    | حالت   | رفتار                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | در یک رشته فعال: همان رشته را متصل می‌کند. بیرون از رشته: در صورت پشتیبانی، یک رشته فرزند ایجاد/متصل می‌کند. |
    | `here` | به رشته فعال فعلی نیاز دارد؛ اگر داخل یکی نباشد شکست می‌خورد.                                                  |
    | `off`  | بدون اتصال. نشست بدون اتصال شروع می‌شود.                                                                 |

    نکته‌ها:

    - روی سطوح اتصال غیررشته‌ای، رفتار پیش‌فرض عملا `off` است.
    - spawn متصل به رشته به پشتیبانی سیاست کانال نیاز دارد:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - وقتی می‌خواهید گفت‌وگوی فعلی را بدون ایجاد رشته فرزند پین کنید، از `--bind here` استفاده کنید.

  </Tab>
</Tabs>

## مدل تحویل

نشست‌های ACP می‌توانند یا فضاهای کاری تعاملی باشند یا کار پس‌زمینه‌ای که در مالکیت والد است. مسیر تحویل به آن شکل وابسته است.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    نشست‌های تعاملی برای ادامه گفت‌وگو روی یک سطح گفت‌وگوی قابل مشاهده در نظر گرفته شده‌اند:

    - `/acp spawn ... --bind here` گفت‌وگوی فعلی را به نشست ACP متصل می‌کند.
    - `/acp spawn ... --thread ...` یک رشته/موضوع کانال را به نشست ACP متصل می‌کند.
    - `bindings[].type="acp"` پیکربندی‌شده و ماندگار، گفت‌وگوهای منطبق را به همان نشست ACP مسیریابی می‌کند.

    پیام‌های پیگیری در گفت‌وگوی متصل مستقیما به نشست ACP مسیریابی می‌شوند، و خروجی ACP به همان کانال/رشته/موضوع برگردانده می‌شود.

    آنچه OpenClaw به هارنس می‌فرستد:

    - پیگیری‌های متصل عادی به‌صورت متن اعلان فرستاده می‌شوند، به‌علاوه پیوست‌ها فقط وقتی هارنس/backend از آن‌ها پشتیبانی کند.
    - دستورهای مدیریتی `/acp` و دستورهای محلی Gateway پیش از ارسال ACP رهگیری می‌شوند.
    - رویدادهای تکمیل تولیدشده توسط runtime برای هر مقصد materialize می‌شوند. عامل‌های OpenClaw پوشش runtime-context داخلی OpenClaw را دریافت می‌کنند؛ هارنس‌های ACP خارجی یک اعلان ساده با نتیجه فرزند و دستورالعمل دریافت می‌کنند. پوشش خام `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` هرگز نباید به هارنس‌های خارجی فرستاده شود یا به‌عنوان متن رونوشت کاربر ACP پایدار شود.
    - ورودی‌های رونوشت ACP از متن محرک قابل مشاهده برای کاربر یا اعلان تکمیل ساده استفاده می‌کنند. فراداده رویداد داخلی تا جای ممکن در OpenClaw ساخت‌یافته می‌ماند و به‌عنوان محتوای گفت‌وگوی نوشته‌شده توسط کاربر تلقی نمی‌شود.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    نشست‌های ACP تک‌مرحله‌ای که توسط اجرای عامل دیگری spawn می‌شوند، فرزندان پس‌زمینه هستند، شبیه به زیرعامل‌ها:

    - والد کار را با `sessions_spawn({ runtime: "acp", mode: "run" })` درخواست می‌کند.
    - فرزند در نشست هارنس ACP خودش اجرا می‌شود.
    - نوبت‌های فرزند روی همان خط پس‌زمینه‌ای اجرا می‌شوند که spawnهای زیرعامل بومی از آن استفاده می‌کنند، پس یک هارنس ACP کند، کار نامرتبط نشست اصلی را مسدود نمی‌کند.
    - گزارش تکمیل از مسیر اعلام تکمیل وظیفه برمی‌گردد. OpenClaw پیش از فرستادن فراداده تکمیل داخلی به یک هارنس خارجی، آن را به یک اعلان ACP ساده تبدیل می‌کند، پس هارنس‌ها نشانگرهای context مخصوص runtime OpenClaw را نمی‌بینند.
    - والد وقتی پاسخ روبه‌روی کاربر مفید باشد، نتیجه فرزند را با صدای معمول دستیار بازنویسی می‌کند.

    این مسیر را به‌عنوان گفت‌وگوی همتابه‌همتا میان والد و فرزند تلقی **نکنید**. فرزند از قبل یک کانال تکمیل برای بازگشت به والد دارد.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` می‌تواند پس از spawn نشست دیگری را هدف بگیرد. برای نشست‌های همتای عادی، OpenClaw پس از تزریق پیام از مسیر پیگیری عامل‌به‌عامل (A2A) استفاده می‌کند:

    - منتظر پاسخ نشست مقصد بمانید.
    - به‌صورت اختیاری اجازه دهید درخواست‌کننده و مقصد تعداد محدودی نوبت پیگیری تبادل کنند.
    - از مقصد بخواهید یک پیام اعلام تولید کند.
    - آن اعلام را به کانال یا رشته قابل مشاهده تحویل دهید.

    آن مسیر A2A یک fallback برای ارسال‌های همتاست که فرستنده در آن‌ها به یک پیگیری قابل مشاهده نیاز دارد. وقتی یک نشست نامرتبط بتواند یک مقصد ACP را ببیند و به آن پیام بدهد، مثلا تحت تنظیمات گسترده `tools.sessions.visibility`، فعال می‌ماند.

    OpenClaw پیگیری A2A را فقط وقتی رد می‌کند که درخواست‌کننده، والد فرزند ACP تک‌مرحله‌ای خودش باشد که در مالکیت والد است. در این حالت، اجرای A2A روی تکمیل وظیفه می‌تواند والد را با نتیجه فرزند بیدار کند، پاسخ والد را دوباره به فرزند منتقل کند، و یک حلقه echo والد/فرزند بسازد. نتیجه `sessions_send` برای آن حالت فرزندِ مالکیت‌شده، `delivery.status="skipped"` را گزارش می‌دهد، چون مسیر تکمیل از قبل مسئول نتیجه است.

  </Accordion>
  <Accordion title="Resume an existing session">
    برای ادامه یک نشست ACP قبلی به‌جای شروع از ابتدا، از `resumeSessionId` استفاده کنید. عامل تاریخچه گفت‌وگوی خود را از طریق `session/load` بازپخش می‌کند، پس با context کامل آنچه پیش‌تر آمده ادامه می‌دهد.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    کاربردهای رایج:

    - واگذاری یک نشست Codex از لپ‌تاپتان به تلفنتان؛ به عاملتان بگویید از همان‌جا که متوقف شده‌اید ادامه دهد.
    - ادامه یک نشست کدنویسی که به‌صورت تعاملی در CLI شروع کرده‌اید، اکنون به‌صورت headless از طریق عاملتان.
    - ادامه کاری که با راه‌اندازی مجدد gateway یا مهلت زمانی بی‌کاری قطع شده بود.

    نکته‌ها:

    - `resumeSessionId` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض زیرعامل این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `streamTo` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض زیرعامل این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `resumeSessionId` یک شناسه ازسرگیری ACP/هارنس محلی میزبان است، نه کلید نشست کانال OpenClaw؛ OpenClaw همچنان پیش از dispatch، سیاست spawn ACP و سیاست عامل مقصد را بررسی می‌کند، در حالی که backend یا هارنس ACP مالک مجوزدهی برای بارگذاری آن شناسه upstream است.
    - `resumeSessionId` تاریخچه گفت‌وگوی ACP upstream را بازیابی می‌کند؛ `thread` و `mode` همچنان به‌طور عادی روی نشست OpenClaw جدیدی که ایجاد می‌کنید اعمال می‌شوند، پس `mode: "session"` همچنان به `thread: true` نیاز دارد.
    - عامل مقصد باید از `session/load` پشتیبانی کند (Codex و Claude Code پشتیبانی می‌کنند).
    - اگر شناسه نشست پیدا نشود، spawn با خطایی روشن شکست می‌خورد؛ هیچ fallback بی‌صدایی به نشست جدید انجام نمی‌شود.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    پس از استقرار gateway، به‌جای اعتماد به آزمون‌های واحد، یک بررسی زنده end-to-end اجرا کنید:

    1. نسخه و commit gateway مستقرشده را روی میزبان مقصد بررسی کنید.
    2. یک نشست موقت پل ACPX به یک عامل زنده باز کنید.
    3. از آن عامل بخواهید `sessions_spawn` را با `runtime: "acp"`، `agentId: "codex"`، `mode: "run"`، و وظیفه `Reply with exactly LIVE-ACP-SPAWN-OK` فراخوانی کند.
    4. `accepted=yes`، یک `childSessionKey` واقعی، و نبود خطای validator را بررسی کنید.
    5. نشست موقت پل را پاک‌سازی کنید.

    گیت را روی `mode: "run"` نگه دارید و از `streamTo: "parent"` صرف‌نظر کنید؛ مسیرهای `mode: "session"` متصل به رشته و stream-relay گذرهای یکپارچه‌سازی غنی‌تر و جداگانه‌ای هستند.

  </Accordion>
</AccordionGroup>

## سازگاری sandbox

نشست‌های ACP در حال حاضر روی runtime میزبان اجرا می‌شوند، **نه** داخل sandbox OpenClaw.

<Warning>
**مرز امنیتی:**

- هارنس خارجی می‌تواند مطابق مجوزهای CLI خودش و `cwd` انتخاب‌شده بخواند/بنویسد.
- سیاست سندباکس OpenClaw اجرای هارنس ACP را **در بر نمی‌گیرد**.
- OpenClaw همچنان گیت‌های قابلیت ACP، عامل‌های مجاز، مالکیت نشست، اتصال‌های کانال، و سیاست تحویل Gateway را اعمال می‌کند.
- برای کار بومی OpenClaw که با سندباکس اعمال می‌شود، از `runtime: "subagent"` استفاده کنید.

</Warning>

محدودیت‌های فعلی:

- اگر نشست درخواست‌کننده سندباکس شده باشد، ایجادهای ACP هم برای `sessions_spawn({ runtime: "acp" })` و هم برای `/acp spawn` مسدود می‌شوند.
- `sessions_spawn` با `runtime: "acp"` از `sandbox: "require"` پشتیبانی نمی‌کند.

## تشخیص هدف نشست

بیشتر کنش‌های `/acp` یک هدف نشست اختیاری (`session-key`،
`session-id`، یا `session-label`) می‌پذیرند.

**ترتیب تشخیص:**

1. آرگومان هدف صریح (یا `--session` برای `/acp steer`)
   - ابتدا کلید را امتحان می‌کند
   - سپس شناسه نشست با شکل UUID
   - سپس برچسب را
2. اتصال گفت‌وگوی فعلی (اگر این گفت‌وگو/رشته به یک نشست ACP متصل باشد).
3. جایگزین نشست درخواست‌کننده فعلی.

اتصال‌های گفت‌وگوی فعلی و اتصال‌های رشته هر دو در
مرحله 2 مشارکت دارند.

اگر هیچ هدفی تشخیص داده نشود، OpenClaw خطایی روشن برمی‌گرداند
(`Unable to resolve session target: ...`).

## کنترل‌های ACP

| فرمان               | کاری که انجام می‌دهد                                      | نمونه                                                        |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`        | نشست ACP ایجاد می‌کند؛ اتصال فعلی یا اتصال رشته اختیاری. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`       | نوبت در جریان را برای نشست هدف لغو می‌کند.                | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`        | دستور هدایت را به نشست در حال اجرا می‌فرستد.              | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`        | نشست را می‌بندد و هدف‌های رشته را جدا می‌کند.             | `/acp close`                                                 |
| `/acp status`       | بک‌اند، حالت، وضعیت، گزینه‌های زمان اجرا و قابلیت‌ها را نشان می‌دهد. | `/acp status`                                                |
| `/acp set-mode`     | حالت زمان اجرا را برای نشست هدف تنظیم می‌کند.             | `/acp set-mode plan`                                         |
| `/acp set`          | گزینه پیکربندی عمومی زمان اجرا را می‌نویسد.               | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`          | بازنویسی دایرکتوری کاری زمان اجرا را تنظیم می‌کند.        | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`  | پروفایل سیاست تایید را تنظیم می‌کند.                      | `/acp permissions strict`                                    |
| `/acp timeout`      | مهلت زمان اجرا را تنظیم می‌کند (ثانیه).                   | `/acp timeout 120`                                           |
| `/acp model`        | بازنویسی مدل زمان اجرا را تنظیم می‌کند.                   | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | بازنویسی‌های گزینه زمان اجرای نشست را حذف می‌کند.        | `/acp reset-options`                                         |
| `/acp sessions`     | نشست‌های اخیر ACP را از انباره فهرست می‌کند.              | `/acp sessions`                                              |
| `/acp doctor`       | سلامت بک‌اند، قابلیت‌ها، و اصلاح‌های قابل اقدام را نشان می‌دهد. | `/acp doctor`                                                |
| `/acp install`      | مراحل نصب و فعال‌سازی قطعی را چاپ می‌کند.                 | `/acp install`                                               |

`/acp status` گزینه‌های موثر زمان اجرا به‌همراه شناسه‌های نشست در سطح زمان اجرا و
سطح بک‌اند را نشان می‌دهد. وقتی یک بک‌اند قابلیتی ندارد، خطاهای کنترل پشتیبانی‌نشده
به‌روشنی نمایش داده می‌شوند. `/acp sessions` انباره را برای نشست متصل فعلی یا نشست درخواست‌کننده می‌خواند؛ توکن‌های هدف
(`session-key`، `session-id`، یا `session-label`) از طریق کشف نشست gateway تشخیص داده می‌شوند، از جمله ریشه‌های سفارشی `session.store` برای هر عامل.

### نگاشت گزینه‌های زمان اجرا

`/acp` فرمان‌های ساده و یک تنظیم‌کننده عمومی دارد. عملیات‌های معادل:

| فرمان                       | به این نگاشت می‌شود                   | یادداشت‌ها                                                                                                                                                                      |
| --------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`           | کلید پیکربندی زمان اجرا `model`       | برای Codex ACP، OpenClaw مقدار `openai-codex/<model>` را به شناسه مدل آداپتر نرمال‌سازی می‌کند و پسوندهای استدلال اسلش‌دار مانند `openai-codex/gpt-5.4/high` را به `reasoning_effort` نگاشت می‌کند. |
| `/acp set thinking <level>` | کلید پیکربندی زمان اجرا `thinking`    | برای Codex ACP، OpenClaw در جایی که آداپتر پشتیبانی کند، `reasoning_effort` متناظر را می‌فرستد.                                                                                |
| `/acp permissions <profile>` | کلید پیکربندی زمان اجرا `approval_policy` | —                                                                                                                                                                               |
| `/acp timeout <seconds>`    | کلید پیکربندی زمان اجرا `timeout`     | —                                                                                                                                                                               |
| `/acp cwd <path>`           | بازنویسی cwd زمان اجرا                | به‌روزرسانی مستقیم.                                                                                                                                                            |
| `/acp set <key> <value>`    | عمومی                                 | `key=cwd` از مسیر بازنویسی cwd استفاده می‌کند.                                                                                                                                 |
| `/acp reset-options`        | همه بازنویسی‌های زمان اجرا را پاک می‌کند | —                                                                                                                                                                               |

## هارنس acpx، راه‌اندازی Plugin، و مجوزها

برای پیکربندی هارنس acpx (نام‌های مستعار Claude Code / Codex / Gemini CLI)،
پل‌های MCP مربوط به plugin-tools و OpenClaw-tools، و حالت‌های مجوز ACP،
ببینید:
[عامل‌های ACP — راه‌اندازی](/fa/tools/acp-agents-setup).

## عیب‌یابی

| نشانه                                                                      | علت احتمالی                                                                                                            | رفع مشکل                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin پشتانه وجود ندارد، غیرفعال است، یا توسط `plugins.allow` مسدود شده است.                                           | Plugin پشتانه را نصب و فعال کنید، وقتی آن فهرست مجاز تنظیم شده است `acpx` را در `plugins.allow` بگنجانید، سپس `/acp doctor` را اجرا کنید.                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP به‌صورت سراسری غیرفعال شده است.                                                                                   | `acp.enabled=true` را تنظیم کنید.                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | dispatch خودکار از پیام‌های thread معمولی غیرفعال شده است.                                                            | برای ازسرگیری مسیریابی خودکار thread، `acp.dispatch.enabled=true` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند.             |
| `ACP agent "<id>" is not allowed by policy`                                 | عامل در فهرست مجاز نیست.                                                                                              | از `agentId` مجاز استفاده کنید یا `acp.allowedAgents` را به‌روزرسانی کنید.                                                                                                |
| `/acp doctor` reports backend not ready right after startup                 | Plugin پشتانه وجود ندارد، غیرفعال است، توسط سیاست مجاز/غیرمجاز مسدود شده است، یا فایل اجرایی پیکربندی‌شده آن در دسترس نیست. | Plugin پشتانه را نصب/فعال کنید، `/acp doctor` را دوباره اجرا کنید، و اگر همچنان ناسالم ماند خطای نصب پشتانه یا سیاست را بررسی کنید.                                    |
| فرمان هارنس پیدا نشد                                                       | CLI آداپتور نصب نیست، Plugin خارجی وجود ندارد، یا دریافت اولین اجرای `npx` برای یک آداپتور غیر Codex ناموفق شده است.   | `/acp doctor` را اجرا کنید، آداپتور را روی میزبان Gateway نصب/پیش‌گرم کنید، یا فرمان عامل acpx را صریح پیکربندی کنید.                                                  |
| مدل توسط هارنس پیدا نشد                                                    | شناسه مدل برای ارائه‌دهنده/هارنس دیگری معتبر است، اما برای این هدف ACP معتبر نیست.                                    | از مدلی که آن هارنس فهرست کرده استفاده کنید، مدل را در هارنس پیکربندی کنید، یا override را حذف کنید.                                                                    |
| خطای احراز هویت فروشنده از هارنس                                           | OpenClaw سالم است، اما CLI/ارائه‌دهنده هدف وارد نشده است.                                                            | وارد شوید یا کلید ارائه‌دهنده لازم را در محیط میزبان Gateway فراهم کنید.                                                                                                  |
| `Unable to resolve session target: ...`                                     | توکن کلید/شناسه/برچسب نامعتبر است.                                                                                   | `/acp sessions` را اجرا کنید، کلید/برچسب دقیق را کپی کنید، و دوباره تلاش کنید.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` بدون گفت‌وگوی فعال قابل اتصال استفاده شده است.                                                          | به چت/کانال هدف بروید و دوباره تلاش کنید، یا spawn بدون اتصال استفاده کنید.                                                                                              |
| `Conversation bindings are unavailable for <channel>.`                      | آداپتور قابلیت اتصال ACP به گفت‌وگوی فعلی را ندارد.                                                                   | در صورت پشتیبانی از `/acp spawn ... --thread ...` استفاده کنید، `bindings[]` سطح بالا را پیکربندی کنید، یا به یک کانال پشتیبانی‌شده بروید.                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` بیرون از زمینه thread استفاده شده است.                                                                | به thread هدف بروید یا از `--thread auto`/`off` استفاده کنید.                                                                                                            |
| `Only <user-id> can rebind this channel/conversation/thread.`               | کاربر دیگری مالک هدف اتصال فعال است.                                                                                  | به‌عنوان مالک دوباره اتصال دهید یا از گفت‌وگو یا thread دیگری استفاده کنید.                                                                                              |
| `Thread bindings are unavailable for <channel>.`                            | آداپتور قابلیت اتصال thread را ندارد.                                                                                 | از `--thread off` استفاده کنید یا به آداپتور/کانال پشتیبانی‌شده بروید.                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | runtime مربوط به ACP سمت میزبان است؛ نشست درخواست‌کننده sandbox شده است.                                             | از نشست‌های sandbox شده، `runtime="subagent"` را استفاده کنید، یا ACP spawn را از یک نشست غیر sandbox شده اجرا کنید.                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` برای runtime مربوط به ACP درخواست شده است.                                                        | برای sandboxing اجباری از `runtime="subagent"` استفاده کنید، یا ACP را با `sandbox="inherit"` از یک نشست غیر sandbox شده استفاده کنید.                                  |
| `Cannot apply --model ... did not advertise model support`                  | هارنس هدف، تغییر عمومی مدل ACP را ارائه نمی‌کند.                                                                      | از هارنسی استفاده کنید که `models`/`session/set_model` مربوط به ACP را اعلام می‌کند، از ارجاع‌های مدل ACP در Codex استفاده کنید، یا اگر هارنس پرچم راه‌اندازی خودش را دارد مدل را مستقیما در آن پیکربندی کنید. |
| فراداده ACP برای نشست متصل وجود ندارد                                      | فراداده نشست ACP کهنه/حذف شده است.                                                                                    | با `/acp spawn` دوباره ایجاد کنید، سپس thread را دوباره متصل/متمرکز کنید.                                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` نوشتن/اجرا را در نشست ACP غیرتعاملی مسدود می‌کند.                                                    | `plugins.entries.acpx.config.permissionMode` را روی `approve-all` تنظیم کنید و gateway را دوباره راه‌اندازی کنید. [پیکربندی مجوز](/fa/tools/acp-agents-setup#permission-configuration) را ببینید. |
| نشست ACP زود و با خروجی اندک ناموفق می‌شود                                 | درخواست‌های مجوز توسط `permissionMode`/`nonInteractivePermissions` مسدود شده‌اند.                                      | گزارش‌های gateway را برای `AcpRuntimeError` بررسی کنید. برای مجوزهای کامل، `permissionMode=approve-all` را تنظیم کنید؛ برای افت تدریجی، `nonInteractivePermissions=deny` را تنظیم کنید. |
| نشست ACP پس از تکمیل کار، نامحدود متوقف می‌ماند                            | فرایند هارنس پایان یافته اما نشست ACP تکمیل را گزارش نکرده است.                                                      | با `ps aux \| grep acpx` پایش کنید؛ فرایندهای کهنه را دستی متوقف کنید.                                                                                                  |
| هارنس `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` را می‌بیند                    | پاکت رویداد داخلی از مرز ACP نشت کرده است.                                                                            | OpenClaw را به‌روزرسانی کنید و جریان تکمیل را دوباره اجرا کنید؛ هارنس‌های خارجی باید فقط promptهای تکمیل ساده دریافت کنند.                                             |

## مرتبط

- [عامل‌های ACP — راه‌اندازی](/fa/tools/acp-agents-setup)
- [ارسال عامل](/fa/tools/agent-send)
- [پشتانه‌های CLI](/fa/gateway/cli-backends)
- [هارنس Codex](/fa/plugins/codex-harness)
- [ابزارهای sandbox چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (حالت پل)](/fa/cli/acp)
- [زیرعامل‌ها](/fa/tools/subagents)
