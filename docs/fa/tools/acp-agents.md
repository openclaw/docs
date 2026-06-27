---
read_when:
    - اجرای هارنس‌های کدنویسی از طریق ACP
    - راه‌اندازی نشست‌های ACP وابسته به گفت‌وگو در کانال‌های پیام‌رسانی
    - اتصال مکالمهٔ کانال پیام به یک نشست پایدار ACP
    - عیب‌یابی بک‌اند ACP، اتصال Plugin، یا تحویل تکمیل
    - اجرای دستورهای ‎/acp از چت
sidebarTitle: ACP agents
summary: اجرای هارنس‌های کدنویسی خارجی (Claude Code، Cursor، Gemini CLI، Codex ACP صریح، OpenClaw ACP، OpenCode) از طریق بک‌اند ACP
title: عامل‌های ACP
x-i18n:
    generated_at: "2026-06-27T18:55:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[جلسات Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
به OpenClaw اجازه می‌دهند harnessهای کدنویسی خارجی (برای مثال Claude Code،
Cursor، Copilot، Droid، OpenClaw ACP، OpenCode، Gemini CLI و دیگر
harnessهای پشتیبانی‌شده ACPX) را از طریق یک Plugin بک‌اند ACP اجرا کند.

هر spawn جلسه ACP به‌عنوان یک [وظیفه پس‌زمینه](/fa/automation/tasks) ردیابی می‌شود.

<Note>
**ACP مسیر harness خارجی است، نه مسیر پیش‌فرض Codex.** Plugin بومی app-server مربوط به Codex کنترل‌های `/codex ...` و runtime تعبیه‌شده پیش‌فرض
`openai/gpt-*` را برای نوبت‌های agent در اختیار دارد؛ ACP کنترل‌های
`/acp ...` و جلسات `sessions_spawn({ runtime: "acp" })` را در اختیار دارد.

اگر می‌خواهید Codex یا Claude Code به‌عنوان یک کلاینت MCP خارجی
مستقیماً به مکالمه‌های کانال موجود OpenClaw وصل شود، به‌جای ACP از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.
</Note>

## کدام صفحه را می‌خواهم؟

| می‌خواهید…                                                                                      | از این استفاده کنید                  | یادداشت‌ها                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex را در مکالمه فعلی bind یا کنترل کنید                                                      | `/codex bind`, `/codex threads`       | مسیر بومی app-server مربوط به Codex وقتی Plugin `codex` فعال است؛ شامل پاسخ‌های چت bindشده، ارسال تصویر، مدل/سریع/مجوزها، توقف و کنترل‌های steer است. ACP یک fallback صریح است |
| Claude Code، Gemini CLI، Codex ACP صریح یا یک harness خارجی دیگر را _از طریق_ OpenClaw اجرا کنید | این صفحه                              | جلسات bindشده به چت، `/acp spawn`، `sessions_spawn({ runtime: "acp" })`، وظایف پس‌زمینه، کنترل‌های runtime                                                                                   |
| یک جلسه OpenClaw Gateway را _به‌عنوان_ سرور ACP برای یک ویرایشگر یا کلاینت ارائه کنید           | [`openclaw acp`](/fa/cli/acp)            | حالت bridge. IDE/کلاینت از طریق stdio/WebSocket با ACP به OpenClaw صحبت می‌کند                                                                                                                |
| از یک AI CLI محلی به‌عنوان مدل fallback فقط متنی دوباره استفاده کنید                            | [بک‌اندهای CLI](/fa/gateway/cli-backends) | ACP نیست. بدون ابزارهای OpenClaw، بدون کنترل‌های ACP، بدون runtime harness                                                                                                                    |

## آیا این بدون تنظیم اضافی کار می‌کند؟

بله، پس از نصب Plugin رسمی runtime مربوط به ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

checkoutهای سورس می‌توانند پس از `pnpm install` از Plugin فضای کاری محلی
`extensions/acpx` استفاده کنند. برای بررسی آمادگی، `/acp doctor` را اجرا کنید.

OpenClaw فقط زمانی spawn کردن ACP را به agentها آموزش می‌دهد که ACP **واقعاً
قابل استفاده** باشد: ACP باید فعال باشد، dispatch نباید غیرفعال شده باشد، جلسه فعلی
نباید توسط sandbox مسدود شده باشد، و یک بک‌اند runtime باید
بارگذاری شده باشد. اگر این شرایط برقرار نباشند، Skillsهای Plugin مربوط به ACP و
راهنمای ACP برای `sessions_spawn` پنهان می‌مانند تا agent یک بک‌اند
غیرقابل‌دسترس را پیشنهاد نکند.

<AccordionGroup>
  <Accordion title="نکات مشکل‌ساز اجرای اول">
    - اگر `plugins.allow` تنظیم شده باشد، یک موجودی محدودکننده Plugin است و **باید** شامل `acpx` باشد؛ در غیر این صورت بک‌اند ACP نصب‌شده عمداً مسدود می‌شود و `/acp doctor` ورودی گمشده allowlist را گزارش می‌کند.
    - آداپتر Codex ACP همراه با Plugin `acpx` آماده‌سازی می‌شود و در صورت امکان به‌صورت محلی اجرا می‌شود.
    - Codex ACP با یک `CODEX_HOME` ایزوله اجرا می‌شود؛ OpenClaw ورودی‌های پروژه معتمد به‌علاوه پیکربندی امن routing مدل/ارائه‌دهنده را از پیکربندی Codex میزبان کپی می‌کند، در حالی که auth، اعلان‌ها و hookها روی پیکربندی میزبان می‌مانند.
    - آداپترهای harness هدف دیگر ممکن است همچنان در اولین استفاده با `npx` به‌صورت درخواستی دریافت شوند.
    - auth فروشنده همچنان باید برای آن harness روی میزبان وجود داشته باشد.
    - اگر میزبان npm یا دسترسی شبکه نداشته باشد، دریافت آداپتر در اجرای اول تا زمانی که cacheها از قبل گرم شوند یا آداپتر به روش دیگری نصب شود، شکست می‌خورد.

  </Accordion>
  <Accordion title="پیش‌نیازهای runtime">
    ACP یک پردازش harness خارجی واقعی را راه‌اندازی می‌کند. OpenClaw مالک routing،
    وضعیت وظیفه پس‌زمینه، تحویل، bindingها و policy است؛ harness
    مالک ورود ارائه‌دهنده، کاتالوگ مدل، رفتار filesystem و
    ابزارهای بومی خودش است.

    پیش از مقصر دانستن OpenClaw، بررسی کنید:

    - `/acp doctor` یک بک‌اند فعال و سالم گزارش می‌کند.
    - وقتی allowlist مربوطه تنظیم شده است، شناسه هدف توسط `acp.allowedAgents` مجاز است.
    - فرمان harness می‌تواند روی میزبان Gateway شروع شود.
    - auth ارائه‌دهنده برای آن harness حاضر است (`claude`, `codex`, `gemini`, `opencode`, `droid` و غیره).
    - مدل انتخاب‌شده برای آن harness وجود دارد - شناسه‌های مدل بین harnessها قابل حمل نیستند.
    - `cwd` درخواستی وجود دارد و قابل دسترسی است، یا `cwd` را حذف کنید و بگذارید بک‌اند از مقدار پیش‌فرض خود استفاده کند.
    - حالت مجوز با کار سازگار است. جلسات غیرتعاملی نمی‌توانند روی promptهای مجوز بومی کلیک کنند، بنابراین اجراهای کدنویسی سنگین از نظر نوشتن/exec معمولاً به یک پروفایل مجوز ACPX نیاز دارند که بتواند بدون رابط تعاملی ادامه دهد.

  </Accordion>
</AccordionGroup>

ابزارهای Plugin OpenClaw و ابزارهای داخلی OpenClaw به‌صورت پیش‌فرض در اختیار
harnessهای ACP قرار نمی‌گیرند. bridgeهای MCP صریح را در
[agentهای ACP - راه‌اندازی](/fa/tools/acp-agents-setup) فقط زمانی فعال کنید که harness
باید آن ابزارها را مستقیماً فراخوانی کند.

## هدف‌های harness پشتیبانی‌شده

با بک‌اند `acpx`، از این شناسه‌های harness به‌عنوان هدف‌های `/acp spawn <id>`
یا `sessions_spawn({ runtime: "acp", agentId: "<id>" })` استفاده کنید:

| شناسه harness | بک‌اند رایج                                    | یادداشت‌ها                                                                          |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | آداپتر Claude Code ACP                         | به auth مربوط به Claude Code روی میزبان نیاز دارد.                                  |
| `codex`    | آداپتر Codex ACP                               | فقط fallback صریح ACP وقتی `/codex` بومی در دسترس نیست یا ACP درخواست شده است.      |
| `copilot`  | آداپتر GitHub Copilot ACP                      | به auth مربوط به Copilot CLI/runtime نیاز دارد.                                     |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | اگر نصب محلی entrypoint متفاوتی برای ACP ارائه می‌دهد، فرمان acpx را override کنید. |
| `droid`    | Factory Droid CLI                              | به auth مربوط به Factory/Droid یا `FACTORY_API_KEY` در محیط harness نیاز دارد.       |
| `gemini`   | آداپتر Gemini CLI ACP                          | به auth مربوط به Gemini CLI یا راه‌اندازی کلید API نیاز دارد.                       |
| `iflow`    | iFlow CLI                                      | دسترس‌پذیری آداپتر و کنترل مدل به CLI نصب‌شده وابسته است.                           |
| `kilocode` | Kilo Code CLI                                  | دسترس‌پذیری آداپتر و کنترل مدل به CLI نصب‌شده وابسته است.                           |
| `kimi`     | Kimi/Moonshot CLI                              | به auth مربوط به Kimi/Moonshot روی میزبان نیاز دارد.                                |
| `kiro`     | Kiro CLI                                       | دسترس‌پذیری آداپتر و کنترل مدل به CLI نصب‌شده وابسته است.                           |
| `opencode` | آداپتر OpenCode ACP                            | به auth مربوط به OpenCode CLI/ارائه‌دهنده نیاز دارد.                                |
| `openclaw` | bridge مربوط به OpenClaw Gateway از طریق `openclaw acp` | به یک harness آگاه از ACP اجازه می‌دهد با یک جلسه OpenClaw Gateway صحبت کند.       |
| `qwen`     | Qwen Code / Qwen CLI                           | به auth سازگار با Qwen روی میزبان نیاز دارد.                                        |

نام‌های مستعار agent سفارشی acpx را می‌توان در خود acpx پیکربندی کرد، اما policy
OpenClaw همچنان پیش از dispatch، `acp.allowedAgents` و هر نگاشت
`agents.list[].runtime.acp.agent` را بررسی می‌کند.

## runbook اپراتور

جریان سریع `/acp` از چت:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، یا
    `/acp spawn codex --bind here` صریح.
  </Step>
  <Step title="کار">
    در مکالمه یا thread bindشده ادامه دهید (یا کلید جلسه را
    صراحتاً هدف بگیرید).
  </Step>
  <Step title="بررسی وضعیت">
    `/acp status`
  </Step>
  <Step title="تنظیم">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Steer">
    بدون جایگزین کردن context: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="توقف">
    `/acp cancel` (نوبت فعلی) یا `/acp close` (جلسه + bindingها).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="جزئیات چرخه حیات">
    - Spawn یک جلسه runtime مربوط به ACP را ایجاد یا resume می‌کند، metadata مربوط به ACP را در store جلسه OpenClaw ثبت می‌کند، و وقتی اجرا مالک والد دارد ممکن است یک وظیفه پس‌زمینه ایجاد کند.
    - جلسات ACP مالک والد، حتی وقتی جلسه runtime پایدار است، به‌عنوان کار پس‌زمینه در نظر گرفته می‌شوند؛ تکمیل و تحویل بین‌سطحی از طریق اعلان‌دهنده وظیفه والد انجام می‌شود، نه مثل یک جلسه چت عادی رو به کاربر.
    - نگهداری وظیفه، جلسات ACP یک‌باره مالک والد را که terminal یا orphan شده‌اند می‌بندد. جلسات ACP پایدار تا زمانی که یک binding مکالمه فعال باقی بماند حفظ می‌شوند؛ جلسات پایدار stale بدون binding فعال بسته می‌شوند تا پس از تمام شدن وظیفه مالک یا حذف رکورد وظیفه‌اش، بی‌صدا resume نشوند.
    - پیام‌های follow-up مربوط به binding تا زمانی که binding بسته، unfocus، reset یا منقضی شود، مستقیماً به جلسه ACP می‌روند.
    - فرمان‌های Gateway محلی می‌مانند. `/acp ...`، `/status` و `/unfocus` هرگز به‌عنوان متن prompt عادی به یک harness ACP bindشده ارسال نمی‌شوند.
    - `cancel` وقتی بک‌اند از cancellation پشتیبانی می‌کند نوبت فعال را abort می‌کند؛ binding یا metadata جلسه را حذف نمی‌کند.
    - `close` جلسه ACP را از دید OpenClaw پایان می‌دهد و binding را حذف می‌کند. اگر harness از resume پشتیبانی کند، ممکن است همچنان history بالادستی خودش را نگه دارد.
    - Plugin acpx پس از `close` درخت‌های پردازشی wrapper و آداپتر متعلق به OpenClaw را پاک‌سازی می‌کند و orphanهای ACPX متعلق به OpenClaw را هنگام شروع Gateway جمع‌آوری می‌کند.
    - workerهای idle runtime پس از `acp.runtime.ttlMinutes` واجد شرایط پاک‌سازی هستند؛ metadata ذخیره‌شده جلسه برای `/acp sessions` همچنان در دسترس می‌ماند.

  </Accordion>
  <Accordion title="قوانین routing بومی Codex">
    triggerهای زبان طبیعی که وقتی **Plugin بومی Codex**
    فعال است باید به آن route شوند:

    - "این کانال Discord را به Codex bind کن."
    - "این چت را به thread `<id>` در Codex وصل کن."
    - "threadهای Codex را نشان بده، سپس این یکی را bind کن."

    اتصال گفت‌وگوی بومی Codex مسیر پیش‌فرض کنترل چت است.
    ابزارهای پویای OpenClaw همچنان از طریق OpenClaw اجرا می‌شوند، در حالی که
    ابزارهای بومی Codex مانند shell/apply-patch داخل Codex اجرا می‌شوند.
    برای رویدادهای ابزار بومی Codex، OpenClaw در هر نوبت یک
    رله هوک بومی تزریق می‌کند تا هوک‌های Plugin بتوانند `before_tool_call` را مسدود کنند، `after_tool_call` را مشاهده کنند،
    و رویدادهای Codex `PermissionRequest` را
    از مسیر تأییدهای OpenClaw عبور دهند. هوک‌های Codex `Stop` به
    OpenClaw `before_agent_finalize` رله می‌شوند، جایی که Pluginها می‌توانند پیش از نهایی‌سازی پاسخ توسط Codex
    یک گذر مدل دیگر درخواست کنند. این رله عمداً
    محافظه‌کارانه می‌ماند: آرگومان‌های ابزار بومی Codex را تغییر نمی‌دهد
    و رکوردهای رشته Codex را بازنویسی نمی‌کند. ACP صریح را فقط زمانی استفاده کنید
    که مدل runtime/نشست ACP را می‌خواهید. مرز پشتیبانی Codex
    تعبیه‌شده در
    [قرارداد پشتیبانی Codex harness v1](/fa/plugins/codex-harness-runtime#v1-support-contract) مستند شده است.

  </Accordion>
  <Accordion title="برگه تقلب انتخاب مدل / ارائه‌دهنده / runtime">
    - ارجاع‌های مدل Codex قدیمی - مسیر مدل OAuth/اشتراک Codex قدیمی که توسط doctor ترمیم می‌شود.
    - `openai/*` - runtime تعبیه‌شده سرور برنامه بومی Codex برای نوبت‌های عامل OpenAI.
    - `/codex ...` - کنترل گفت‌وگوی بومی Codex.
    - `/acp ...` یا `runtime: "acp"` - کنترل صریح ACP/acpx.

  </Accordion>
  <Accordion title="تریگرهای زبان طبیعی مسیریابی ACP">
    تریگرهایی که باید به runtime ACP مسیریابی شوند:

    - "این را به‌عنوان یک نشست یک‌باره Claude Code ACP اجرا کن و نتیجه را خلاصه کن."
    - "برای این کار از Gemini CLI در یک رشته استفاده کن، سپس پیگیری‌ها را در همان رشته نگه دار."
    - "Codex را از طریق ACP در یک رشته پس‌زمینه اجرا کن."

    OpenClaw مقدار `runtime: "acp"` را انتخاب می‌کند، `agentId` هارنس را resolve می‌کند،
    در صورت پشتیبانی به گفت‌وگو یا رشته فعلی متصل می‌شود، و
    پیگیری‌ها را تا زمان بستن/انقضا به آن نشست مسیریابی می‌کند. Codex فقط
    زمانی این مسیر را دنبال می‌کند که ACP/acpx صریح باشد یا Plugin بومی Codex
    برای عملیات درخواستی در دسترس نباشد.

    برای `sessions_spawn`، مقدار `runtime: "acp"` فقط زمانی اعلام می‌شود که ACP
    فعال باشد، درخواست‌کننده sandbox نشده باشد، و یک backend runtime
    ACP بارگذاری شده باشد. `acp.dispatch.enabled=false` ارسال خودکار
    رشته ACP را متوقف می‌کند اما فراخوانی‌های صریح
    `sessions_spawn({ runtime: "acp" })` را پنهان یا مسدود نمی‌کند. این مقدار شناسه‌های هارنس ACP مانند `codex`،
    `claude`، `droid`، `gemini`، یا `opencode` را هدف می‌گیرد. یک شناسه عامل عادی
    پیکربندی OpenClaw از `agents_list` را ارسال نکنید مگر اینکه آن ورودی
    صریحاً با `agents.list[].runtime.type="acp"` پیکربندی شده باشد؛
    در غیر این صورت از runtime پیش‌فرض زیرعامل استفاده کنید. وقتی یک عامل OpenClaw
    با `runtime.type="acp"` پیکربندی شده باشد، OpenClaw از
    `runtime.acp.agent` به‌عنوان شناسه هارنس زیربنایی استفاده می‌کند.

  </Accordion>
</AccordionGroup>

## ACP در برابر زیرعامل‌ها

وقتی یک runtime هارنس خارجی می‌خواهید از ACP استفاده کنید. برای اتصال/کنترل گفت‌وگوی Codex وقتی Plugin `codex`
فعال است، از **سرور برنامه بومی Codex** استفاده کنید. وقتی اجراهای تفویض‌شده
بومی OpenClaw می‌خواهید از **زیرعامل‌ها** استفاده کنید.

| حوزه          | نشست ACP                           | اجرای زیرعامل                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (برای مثال acpx) | runtime زیرعامل بومی OpenClaw  |
| کلید نشست   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| دستورهای اصلی | `/acp ...`                            | `/subagents ...`                   |
| ابزار spawn    | `sessions_spawn` با `runtime:"acp"` | `sessions_spawn` (runtime پیش‌فرض) |

همچنین [زیرعامل‌ها](/fa/tools/subagents) را ببینید.

## ACP چگونه Claude Code را اجرا می‌کند

برای Claude Code از طریق ACP، پشته این است:

1. صفحه کنترل نشست ACP در OpenClaw.
2. Plugin runtime رسمی `@openclaw/acpx`.
3. آداپتور Claude ACP.
4. سازوکارهای runtime/نشست سمت Claude.

ACP Claude یک **نشست هارنس** با کنترل‌های ACP، ازسرگیری نشست،
رهگیری کار پس‌زمینه، و اتصال اختیاری گفت‌وگو/رشته است.

backendهای CLI، runtimeهای fallback محلی فقط‌متنی جداگانه هستند - به
[backendهای CLI](/fa/gateway/cli-backends) مراجعه کنید.

برای اپراتورها، قاعده عملی این است:

- **`/acp spawn`، نشست‌های قابل اتصال، کنترل‌های runtime، یا کار پایدار هارنس می‌خواهید؟** از ACP استفاده کنید.
- **fallback ساده متن محلی از طریق CLI خام می‌خواهید؟** از backendهای CLI استفاده کنید.

## نشست‌های متصل

### مدل ذهنی

- **سطح چت** - جایی که افراد به گفت‌وگو ادامه می‌دهند (کانال Discord، موضوع Telegram، چت iMessage).
- **نشست ACP** - وضعیت پایدار runtime در Codex/Claude/Gemini که OpenClaw به آن مسیریابی می‌کند.
- **رشته/موضوع فرزند** - یک سطح پیام‌رسانی اضافی اختیاری که فقط توسط `--thread ...` ایجاد می‌شود.
- **فضای کاری runtime** - مکان فایل‌سیستم (`cwd`، checkout مخزن، فضای کاری backend) که هارنس در آن اجرا می‌شود. مستقل از سطح چت.

### اتصال‌های گفت‌وگوی فعلی

`/acp spawn <harness> --bind here` گفت‌وگوی فعلی را به
نشست ACP ایجادشده پین می‌کند - بدون رشته فرزند، همان سطح چت. OpenClaw همچنان
مالک انتقال، auth، ایمنی، و تحویل است. پیام‌های پیگیری در آن
گفت‌وگو به همان نشست مسیریابی می‌شوند؛ `/new` و `/reset` نشست را
درجا بازنشانی می‌کنند؛ `/acp close` اتصال را حذف می‌کند.

مثال‌ها:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="قوانین اتصال و انحصار">
    - `--bind here` و `--thread ...` متقابلاً انحصاری هستند.
    - `--bind here` فقط روی کانال‌هایی کار می‌کند که اتصال گفت‌وگوی فعلی را اعلام می‌کنند؛ در غیر این صورت OpenClaw یک پیام روشنِ پشتیبانی‌نشده برمی‌گرداند. اتصال‌ها پس از راه‌اندازی دوباره Gateway پایدار می‌مانند.
    - در Discord، `spawnSessions` ایجاد رشته فرزند را برای `--thread auto|here` کنترل می‌کند - نه `--bind here`.
    - اگر بدون `--cwd` به یک عامل ACP متفاوت spawn کنید، OpenClaw به‌صورت پیش‌فرض فضای کاری **عامل هدف** را به ارث می‌برد. مسیرهای به‌ارث‌رسیده گمشده (`ENOENT`/`ENOTDIR`) به پیش‌فرض backend fallback می‌شوند؛ خطاهای دسترسی دیگر (مانند `EACCES`) به‌عنوان خطاهای spawn نمایش داده می‌شوند.
    - دستورهای مدیریتی Gateway در گفت‌وگوهای متصل محلی می‌مانند - دستورهای `/acp ...` توسط OpenClaw پردازش می‌شوند حتی وقتی متن پیگیری عادی به نشست ACP متصل مسیریابی می‌شود؛ `/status` و `/unfocus` نیز هر زمان پردازش دستور برای آن سطح فعال باشد محلی می‌مانند.

  </Accordion>
  <Accordion title="نشست‌های متصل به رشته">
    وقتی اتصال‌های رشته برای یک آداپتور کانال فعال باشند:

    - OpenClaw یک رشته را به یک نشست ACP هدف متصل می‌کند.
    - پیام‌های پیگیری در آن رشته به نشست ACP متصل مسیریابی می‌شوند.
    - خروجی ACP به همان رشته تحویل داده می‌شود.
    - unfocus/close/archive/idle-timeout یا انقضای max-age اتصال را حذف می‌کند.
    - `/acp close`، `/acp cancel`، `/acp status`، `/status`، و `/unfocus` دستورهای Gateway هستند، نه prompt برای هارنس ACP.

    feature flagهای لازم برای ACP متصل به رشته:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` به‌صورت پیش‌فرض روشن است (برای توقف ارسال خودکار رشته ACP مقدار `false` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند).
    - spawn نشست رشته در آداپتور کانال فعال باشد (پیش‌فرض: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    پشتیبانی اتصال رشته مخصوص هر آداپتور است. اگر آداپتور کانال فعال
    از اتصال‌های رشته پشتیبانی نکند، OpenClaw یک پیام روشن
    پشتیبانی‌نشده/در دسترس نبودن برمی‌گرداند.

  </Accordion>
  <Accordion title="کانال‌های پشتیبان رشته">
    - هر آداپتور کانالی که قابلیت اتصال نشست/رشته را ارائه کند.
    - پشتیبانی داخلی فعلی: رشته‌ها/کانال‌های **Discord**، موضوع‌های **Telegram** (موضوع‌های forum در گروه‌ها/supergroupها و موضوع‌های DM).
    - کانال‌های Plugin می‌توانند از طریق همان رابط اتصال پشتیبانی اضافه کنند.

  </Accordion>
</AccordionGroup>

## اتصال‌های پایدار کانال

برای گردش‌کارهای غیراپمرال، اتصال‌های پایدار ACP را در
ورودی‌های سطح‌بالای `bindings[]` پیکربندی کنید.

### مدل اتصال

<ParamField path="bindings[].type" type='"acp"'>
  یک اتصال گفت‌وگوی ACP پایدار را مشخص می‌کند.
</ParamField>
<ParamField path="bindings[].match" type="object">
  گفت‌وگوی هدف را شناسایی می‌کند. شکل‌ها به تفکیک کانال:

- **کانال/رشته Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **کانال/DM در Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. شناسه‌های پایدار Slack را ترجیح دهید؛ اتصال‌های کانال همچنین پاسخ‌های داخل رشته‌های همان کانال را match می‌کنند.
- **موضوع forum در Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/گروه WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. برای چت‌های مستقیم از شماره‌های E.164 مانند `+15555550123` و برای گروه‌ها از JIDهای گروه WhatsApp مانند `120363424282127706@g.us` استفاده کنید.
- **DM/گروه iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. برای اتصال‌های پایدار گروه، `chat_id:*` را ترجیح دهید.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  شناسه عامل مالک OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  override اختیاری ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  برچسب اختیاری رو به اپراتور.
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
- `agents.list[].runtime.acp.agent` (شناسه هارنس، مثلاً `codex` یا `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**اولویت override برای نشست‌های متصل ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. پیش‌فرض‌های سراسری ACP (مثلاً `acp.backend`)

### مثال

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

- OpenClaw اطمینان می‌دهد نشست ACP پیکربندی‌شده پس از پذیرش ویژه کانال و پیش از استفاده وجود داشته باشد.
- پیام‌ها در آن کانال، موضوع یا گفت‌وگو به نشست ACP پیکربندی‌شده هدایت می‌شوند.
- اتصال‌های ACP پیکربندی‌شده مالک مسیر نشست خود هستند. پخش گسترده کانال جایگزین نشست ACP پیکربندی‌شده برای یک اتصال منطبق نمی‌شود.
- در گفت‌وگوهای متصل، `/new` و `/reset` همان کلید نشست ACP را درجا بازنشانی می‌کنند.
- اتصال‌های موقت runtime (برای نمونه اتصال‌هایی که توسط جریان‌های تمرکز روی thread ساخته شده‌اند) همچنان در صورت وجود اعمال می‌شوند.
- برای ایجادهای ACP بین‌عاملی بدون `cwd` صریح، OpenClaw فضای کاری عامل مقصد را از پیکربندی عامل به ارث می‌برد.
- مسیرهای فضای کاری به‌ارث‌رسیده که وجود ندارند به cwd پیش‌فرض backend برمی‌گردند؛ خطاهای دسترسی واقعی به‌صورت خطای ایجاد نشست نمایش داده می‌شوند.

## شروع نشست‌های ACP

دو روش برای شروع یک نشست ACP وجود دارد:

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
    مقدار پیش‌فرض `runtime` برابر `subagent` است، بنابراین برای نشست‌های ACP
    `runtime: "acp"` را صریح تنظیم کنید. اگر `agentId` حذف شود، OpenClaw
    در صورت پیکربندی از `acp.defaultAgent` استفاده می‌کند. `mode: "session"`
    برای نگه داشتن یک گفت‌وگوی متصل پایدار به `thread: true` نیاز دارد.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    برای کنترل صریح اپراتور از گفت‌وگو، از `/acp spawn` استفاده کنید.

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
  شناسه harness مقصد ACP. اگر `acp.defaultAgent` تنظیم شده باشد، به آن برمی‌گردد.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  در جاهایی که پشتیبانی می‌شود، جریان اتصال thread را درخواست می‌کند.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` یک‌باره است؛ `"session"` پایدار است. اگر `thread: true` باشد و
  `mode` حذف شود، OpenClaw ممکن است بسته به مسیر runtime به‌طور پیش‌فرض از رفتار پایدار استفاده کند.
  `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cwd" type="string">
  پوشه کاری runtime درخواستی (بر اساس سیاست backend/runtime
  اعتبارسنجی می‌شود). اگر حذف شود، ایجاد ACP در صورت پیکربندی
  فضای کاری عامل مقصد را به ارث می‌برد؛ مسیرهای به‌ارث‌رسیده ناموجود
  به پیش‌فرض‌های backend برمی‌گردند، در حالی که خطاهای دسترسی واقعی بازگردانده می‌شوند.
</ParamField>
<ParamField path="label" type="string">
  برچسب قابل مشاهده برای اپراتور که در متن نشست/بنر استفاده می‌شود.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  به‌جای ایجاد نشست جدید، یک نشست ACP موجود را ادامه دهید. عامل
  تاریخچه گفت‌وگوی خود را از طریق `session/load` بازپخش می‌کند. به
  `runtime: "acp"` نیاز دارد.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` خلاصه‌های پیشرفت اجرای اولیه ACP را به‌صورت رویدادهای سیستمی
  به نشست درخواست‌کننده stream می‌کند. پاسخ‌های پذیرفته‌شده شامل
  `streamLogPath` هستند که به یک گزارش JSONL محدود به نشست اشاره می‌کند
  (`<sessionId>.acp-stream.jsonl`) و می‌توانید برای تاریخچه کامل relay آن را دنبال کنید.
  streamهای پیشرفت والد به‌طور پیش‌فرض commentary دستیار و پیشرفت وضعیت ACP را نشان می‌دهند،
  مگر اینکه `streaming.progress.commentary=false` باشد. Discord نیز وقتی هیچ حالت stream پیکربندی نشده باشد،
  پیش‌نمایش‌های والد را به‌طور پیش‌فرض در حالت پیشرفت قرار می‌دهد. پیشرفت وضعیت
  همچنان به `acp.stream.tagVisibility` احترام می‌گذارد، بنابراین برچسب‌هایی مانند `plan`
  پنهان می‌مانند مگر اینکه صریح فعال شوند.
</ParamField>

اجراهای ACP `sessions_spawn` از `agents.defaults.subagents.runTimeoutSeconds` برای
محدودیت پیش‌فرض نوبت فرزند خود استفاده می‌کنند. این ابزار overrideهای timeout در سطح هر فراخوانی را نمی‌پذیرد.

<ParamField path="model" type="string">
  override صریح مدل برای نشست فرزند ACP. ایجادهای Codex ACP
  ارجاع‌های OpenAI مانند `openai/gpt-5.4` را پیش از `session/new` به پیکربندی
  شروع Codex ACP نرمال‌سازی می‌کنند؛ شکل‌های اسلش مانند `openai/gpt-5.4/high`
  همچنین تلاش reasoning در Codex ACP را تنظیم می‌کنند.
  اگر حذف شود، `sessions_spawn({ runtime: "acp" })` در صورت پیکربندی از
  پیش‌فرض‌های موجود مدل subagent (`agents.defaults.subagents.model` یا
  `agents.list[].subagents.model`) استفاده می‌کند؛ در غیر این صورت اجازه می‌دهد
  harness ACP از مدل پیش‌فرض خودش استفاده کند.
  harnessهای دیگر باید `models` در ACP را اعلام کنند و از
  `session/set_model` پشتیبانی کنند؛ در غیر این صورت OpenClaw/acpx به‌جای
  بازگشت بی‌صدا به پیش‌فرض عامل مقصد، شفاف شکست می‌خورد.
</ParamField>
<ParamField path="thinking" type="string">
  تلاش thinking/reasoning صریح. برای Codex ACP، `minimal` به تلاش کم نگاشت می‌شود،
  `low`/`medium`/`high`/`xhigh` مستقیما نگاشت می‌شوند، و `off`
  override شروع تلاش reasoning را حذف می‌کند.
  اگر حذف شود، ایجادهای ACP از پیش‌فرض‌های thinking موجود subagent و
  `agents.defaults.models["provider/model"].params.thinking` در سطح هر مدل
  برای مدل انتخاب‌شده استفاده می‌کنند.
</ParamField>

## حالت‌های اتصال و thread در ایجاد نشست

<Tabs>
  <Tab title="--bind here|off">
    | حالت   | رفتار                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | گفت‌وگوی فعال فعلی را درجا متصل می‌کند؛ اگر هیچ گفت‌وگویی فعال نباشد شکست می‌خورد. |
    | `off`  | اتصال گفت‌وگوی فعلی ایجاد نمی‌کند.                          |

    نکته‌ها:

    - `--bind here` ساده‌ترین مسیر اپراتور برای «این کانال یا گفت‌وگو را با پشتوانه Codex کن» است.
    - `--bind here` یک thread فرزند ایجاد نمی‌کند.
    - `--bind here` فقط در کانال‌هایی در دسترس است که پشتیبانی اتصال گفت‌وگوی فعلی را ارائه می‌کنند.
    - `--bind` و `--thread` را نمی‌توان در یک فراخوانی `/acp spawn` با هم ترکیب کرد.

  </Tab>
  <Tab title="--thread auto|here|off">
    | حالت   | رفتار                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | در یک thread فعال: همان thread را متصل می‌کند. خارج از thread: در صورت پشتیبانی، یک thread فرزند ایجاد/متصل می‌کند. |
    | `here` | thread فعال فعلی را الزامی می‌کند؛ اگر داخل یکی نباشد شکست می‌خورد.                                                  |
    | `off`  | بدون اتصال. نشست بدون اتصال شروع می‌شود.                                                                 |

    نکته‌ها:

    - روی سطح‌های اتصال غیر thread، رفتار پیش‌فرض عملا `off` است.
    - ایجاد نشست متصل به thread به پشتیبانی سیاست کانال نیاز دارد:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - وقتی می‌خواهید گفت‌وگوی فعلی را بدون ایجاد thread فرزند سنجاق کنید، از `--bind here` استفاده کنید.

  </Tab>
</Tabs>

## مدل تحویل

نشست‌های ACP می‌توانند یا فضاهای کاری تعاملی باشند یا کار پس‌زمینه
متعلق به والد. مسیر تحویل به این شکل بستگی دارد.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    نشست‌های تعاملی برای ادامه گفت‌وگو روی یک سطح گفت‌وگوی قابل مشاهده
    طراحی شده‌اند:

    - `/acp spawn ... --bind here` گفت‌وگوی فعلی را به نشست ACP متصل می‌کند.
    - `/acp spawn ... --thread ...` یک thread/موضوع کانال را به نشست ACP متصل می‌کند.
    - `bindings[].type="acp"` پیکربندی‌شده و پایدار، گفت‌وگوهای منطبق را به همان نشست ACP هدایت می‌کند.

    پیام‌های بعدی در گفت‌وگوی متصل مستقیما به نشست ACP هدایت می‌شوند،
    و خروجی ACP به همان کانال/thread/موضوع برگردانده می‌شود.

    آنچه OpenClaw به harness ارسال می‌کند:

    - پیگیری‌های عادی متصل به‌صورت متن اعلان ارسال می‌شوند، به‌علاوه پیوست‌ها فقط وقتی harness/backend از آن‌ها پشتیبانی کند.
    - دستورهای مدیریتی `/acp` و دستورهای Gateway محلی پیش از ارسال ACP رهگیری می‌شوند.
    - رویدادهای تکمیل تولیدشده توسط runtime برای هر مقصد materialize می‌شوند. عامل‌های OpenClaw پاکت runtime-context داخلی OpenClaw را دریافت می‌کنند؛ harnessهای ACP خارجی یک اعلان ساده همراه با نتیجه فرزند و دستورالعمل دریافت می‌کنند. پاکت خام `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` هرگز نباید به harnessهای خارجی ارسال شود یا به‌عنوان متن transcript کاربر ACP پایدار شود.
    - ورودی‌های transcript ACP از متن trigger قابل مشاهده برای کاربر یا اعلان تکمیل ساده استفاده می‌کنند. فراداده رویداد داخلی تا جای ممکن در OpenClaw ساختاریافته باقی می‌ماند و به‌عنوان محتوای گفت‌وگوی نوشته‌شده توسط کاربر در نظر گرفته نمی‌شود.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    نشست‌های ACP یک‌باره‌ای که توسط اجرای عامل دیگر ایجاد می‌شوند، فرزندهای
    پس‌زمینه هستند، مشابه sub-agentها:

    - والد با `sessions_spawn({ runtime: "acp", mode: "run" })` درخواست کار می‌کند.
    - فرزند در نشست harness ACP خودش اجرا می‌شود.
    - نوبت‌های فرزند روی همان lane پس‌زمینه‌ای اجرا می‌شوند که برای ایجاد sub-agentهای native استفاده می‌شود، بنابراین یک harness کند ACP کار نامرتبط نشست اصلی را مسدود نمی‌کند.
    - گزارش تکمیل از مسیر اعلام تکمیل وظیفه برمی‌گردد. OpenClaw پیش از ارسال آن به یک harness خارجی، فراداده تکمیل داخلی را به یک اعلان ساده ACP تبدیل می‌کند، بنابراین harnessها نشانگرهای runtime context مخصوص OpenClaw را نمی‌بینند.
    - وقتی پاسخ قابل مشاهده برای کاربر مفید باشد، والد نتیجه فرزند را با صدای عادی دستیار بازنویسی می‌کند.

    با این مسیر مانند یک گفت‌وگوی peer-to-peer بین والد
    و فرزند برخورد نکنید. فرزند از قبل یک کانال تکمیل برای بازگشت به
    والد دارد.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` می‌تواند پس از ایجاد، نشست دیگری را هدف بگیرد. برای نشست‌های peer
    عادی، OpenClaw پس از تزریق پیام از مسیر پیگیری عامل به عامل (A2A)
    استفاده می‌کند:

    - منتظر پاسخ نشست مقصد بمانید.
    - به‌صورت اختیاری اجازه دهید درخواست‌کننده و مقصد تعداد محدودی نوبت پیگیری را تبادل کنند.
    - از مقصد بخواهید یک پیام اعلام تولید کند.
    - آن اعلام را به کانال یا thread قابل مشاهده تحویل دهید.

    مسیر A2A برای ارسال‌های peer که فرستنده در آن‌ها به یک پیگیری
    قابل مشاهده نیاز دارد، fallback است. وقتی یک نشست نامرتبط می‌تواند
    مقصد ACP را ببیند و به آن پیام بدهد، مثلا تحت تنظیمات گسترده
    `tools.sessions.visibility`، فعال باقی می‌ماند.

    OpenClaw پیگیری A2A را فقط زمانی رد می‌کند که درخواست‌کننده،
    والدِ فرزند یک‌باره‌ی ACP متعلق به والد خودش باشد. در آن حالت،
    اجرای A2A روی تکمیل وظیفه می‌تواند والد را با نتیجه‌ی فرزند بیدار کند،
    پاسخ والد را دوباره به فرزند بفرستد، و
    یک حلقه‌ی پژواک والد/فرزند ایجاد کند. نتیجه‌ی `sessions_send` برای
    آن حالت فرزندِ متعلق، `delivery.status="skipped"` را گزارش می‌کند، چون
    مسیر تکمیل از قبل مسئول نتیجه است.

  </Accordion>
  <Accordion title="ازسرگیری یک نشست موجود">
    از `resumeSessionId` برای ادامه دادن یک نشست ACP قبلی به‌جای
    شروع از ابتدا استفاده کنید. عامل تاریخچه‌ی گفت‌وگوی خود را از طریق
    `session/load` بازپخش می‌کند، بنابراین با زمینه‌ی کاملِ آنچه قبلا رخ داده ادامه می‌دهد.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    موارد استفاده‌ی رایج:

    - یک نشست Codex را از لپ‌تاپتان به تلفنتان تحویل دهید - به عامل خود بگویید از همان‌جایی که متوقف شدید ادامه دهد.
    - یک نشست کدنویسی را که به‌صورت تعاملی در CLI شروع کرده‌اید، اکنون به‌صورت بدون‌سر از طریق عامل خود ادامه دهید.
    - کاری را که با راه‌اندازی دوباره‌ی Gateway یا پایان مهلت بیکاری قطع شده بود، ادامه دهید.

    نکات:

    - `resumeSessionId` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض زیرعامل این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `streamTo` فقط وقتی اعمال می‌شود که `runtime: "acp"` باشد؛ runtime پیش‌فرض زیرعامل این فیلد مخصوص ACP را نادیده می‌گیرد.
    - `resumeSessionId` یک شناسه‌ی ازسرگیری ACP/harness محلیِ میزبان است، نه کلید نشست کانال OpenClaw؛ OpenClaw همچنان پیش از ارسال، سیاست ایجاد ACP و سیاست عامل هدف را بررسی می‌کند، درحالی‌که backend یا harness مربوط به ACP مالک مجوزدهی برای بارگذاری آن شناسه‌ی بالادستی است.
    - `resumeSessionId` تاریخچه‌ی گفت‌وگوی ACP بالادستی را بازیابی می‌کند؛ `thread` و `mode` همچنان به‌طور معمول برای نشست جدید OpenClaw که ایجاد می‌کنید اعمال می‌شوند، بنابراین `mode: "session"` همچنان به `thread: true` نیاز دارد.
    - عامل هدف باید از `session/load` پشتیبانی کند (Codex و Claude Code پشتیبانی می‌کنند).
    - اگر شناسه‌ی نشست پیدا نشود، ایجاد با خطایی روشن شکست می‌خورد - بدون بازگشت بی‌صدا به یک نشست جدید.

  </Accordion>
  <Accordion title="آزمون دود پس از استقرار">
    پس از استقرار Gateway، به‌جای اعتماد به آزمون‌های واحد،
    یک بررسی زنده‌ی سرتاسری اجرا کنید:

    1. نسخه و commit مربوط به Gateway مستقرشده را روی میزبان هدف بررسی کنید.
    2. یک نشست پل ACPX موقت به یک عامل زنده باز کنید.
    3. از آن عامل بخواهید `sessions_spawn` را با `runtime: "acp"`، `agentId: "codex"`، `mode: "run"`، و وظیفه‌ی `Reply with exactly LIVE-ACP-SPAWN-OK` فراخوانی کند.
    4. `accepted=yes`، یک `childSessionKey` واقعی، و نبود خطای اعتبارسنج را بررسی کنید.
    5. نشست پل موقت را پاک‌سازی کنید.

    gate را روی `mode: "run"` نگه دارید و از `streamTo: "parent"` صرف‌نظر کنید -
    مسیرهای `mode: "session"` وابسته به thread و stream-relay
    گذرهای یکپارچه‌سازی غنی‌تر و جداگانه‌ای هستند.

  </Accordion>
</AccordionGroup>

## سازگاری Sandbox

نشست‌های ACP در حال حاضر روی runtime میزبان اجرا می‌شوند، **نه** داخل
Sandbox مربوط به OpenClaw.

<Warning>
**مرز امنیتی:**

- harness خارجی می‌تواند مطابق با مجوزهای CLI خودش و `cwd` انتخاب‌شده بخواند/بنویسد.
- سیاست Sandbox مربوط به OpenClaw اجرای harness مربوط به ACP را **در بر نمی‌گیرد**.
- OpenClaw همچنان gateهای قابلیت ACP، عامل‌های مجاز، مالکیت نشست، اتصال‌های کانال، و سیاست تحویل Gateway را اعمال می‌کند.
- از `runtime: "subagent"` برای کار بومی OpenClaw با اجبار Sandbox استفاده کنید.

</Warning>

محدودیت‌های فعلی:

- اگر نشست درخواست‌کننده sandbox شده باشد، ایجادهای ACP هم برای `sessions_spawn({ runtime: "acp" })` و هم برای `/acp spawn` مسدود می‌شوند.
- `sessions_spawn` با `runtime: "acp"` از `sandbox: "require"` پشتیبانی نمی‌کند.

## تشخیص هدف نشست

بیشتر کنش‌های `/acp` یک هدف نشست اختیاری (`session-key`،
`session-id`، یا `session-label`) می‌پذیرند.

**ترتیب تشخیص:**

1. آرگومان هدف صریح (یا `--session` برای `/acp steer`)
   - کلید را امتحان می‌کند
   - سپس شناسه‌ی نشست با شکل UUID
   - سپس برچسب
2. اتصال thread فعلی (اگر این گفت‌وگو/thread به یک نشست ACP متصل باشد).
3. بازگشت به نشست درخواست‌کننده‌ی فعلی.

اتصال‌های گفت‌وگوی فعلی و اتصال‌های thread هر دو در
گام 2 مشارکت دارند.

اگر هیچ هدفی تشخیص داده نشود، OpenClaw یک خطای روشن برمی‌گرداند
(`Unable to resolve session target: ...`).

## کنترل‌های ACP

| دستور                | کاری که انجام می‌دهد                                      | مثال                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | نشست ACP ایجاد می‌کند؛ اتصال فعلی یا اتصال thread اختیاری. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | نوبت درحال‌اجرای نشست هدف را لغو می‌کند.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | دستور هدایت را به نشست درحال‌اجرا می‌فرستد.              | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | نشست را می‌بندد و هدف‌های thread را جدا می‌کند.          | `/acp close`                                                  |
| `/acp status`        | backend، حالت، وضعیت، گزینه‌های runtime، و قابلیت‌ها را نشان می‌دهد. | `/acp status`                                                 |
| `/acp set-mode`      | حالت runtime را برای نشست هدف تنظیم می‌کند.              | `/acp set-mode plan`                                          |
| `/acp set`           | نوشتن گزینه‌ی پیکربندی عمومی runtime.                    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | بازنویسی دایرکتوری کاری runtime را تنظیم می‌کند.         | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | نمایه‌ی سیاست تایید را تنظیم می‌کند.                     | `/acp permissions strict`                                     |
| `/acp timeout`       | مهلت runtime را تنظیم می‌کند (ثانیه).                    | `/acp timeout 120`                                            |
| `/acp model`         | بازنویسی مدل runtime را تنظیم می‌کند.                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | بازنویسی‌های گزینه‌ی runtime نشست را حذف می‌کند.         | `/acp reset-options`                                          |
| `/acp sessions`      | نشست‌های اخیر ACP را از store فهرست می‌کند.              | `/acp sessions`                                               |
| `/acp doctor`        | سلامت backend، قابلیت‌ها، و اصلاحات قابل‌اقدام.          | `/acp doctor`                                                 |
| `/acp install`       | گام‌های نصب و فعال‌سازی قطعی را چاپ می‌کند.              | `/acp install`                                                |

`/acp status` گزینه‌های runtime مؤثر به‌همراه شناسه‌های نشست در سطح runtime و
سطح backend را نشان می‌دهد. وقتی یک backend فاقد قابلیتی باشد، خطاهای
کنترلِ پشتیبانی‌نشده به‌روشنی نمایش داده می‌شوند. `/acp sessions`
store را برای نشست متصل فعلی یا نشست درخواست‌کننده می‌خواند؛ توکن‌های هدف
(`session-key`، `session-id`، یا `session-label`) از طریق
کشف نشست Gateway تشخیص داده می‌شوند، از جمله ریشه‌های سفارشی `session.store`
به‌ازای هر عامل.

### نگاشت گزینه‌های Runtime

`/acp` دستورهای میان‌بر و یک تنظیم‌کننده‌ی عمومی دارد. عملیات
معادل:

| دستور                       | به این نگاشت می‌شود                  | نکات                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | کلید پیکربندی runtime به نام `model` | برای Codex ACP، OpenClaw مقدار `openai/<model>` را به شناسه‌ی مدل adapter نرمال‌سازی می‌کند و پسوندهای استدلالی اسلش‌دار مانند `openai/gpt-5.4/high` را به `reasoning_effort` نگاشت می‌کند.              |
| `/acp set thinking <level>`  | گزینه‌ی canonical به نام `thinking`  | OpenClaw معادل اعلام‌شده توسط backend را وقتی موجود باشد می‌فرستد، با ترجیح `thinking`، سپس `effort`، `reasoning_effort`، یا `thought_level`. برای Codex ACP، adapter مقادیر را به `reasoning_effort` نگاشت می‌کند. |
| `/acp permissions <profile>` | گزینه‌ی canonical به نام `permissionProfile` | OpenClaw معادل اعلام‌شده توسط backend را وقتی موجود باشد می‌فرستد، مانند `approval_policy`، `permission_profile`، `permissions`، یا `permission_mode`.                                                   |
| `/acp timeout <seconds>`     | گزینه‌ی canonical به نام `timeoutSeconds` | OpenClaw معادل اعلام‌شده توسط backend را وقتی موجود باشد می‌فرستد، مانند `timeout` یا `timeout_seconds`.                                                                                                  |
| `/acp cwd <path>`            | بازنویسی cwd مربوط به runtime        | به‌روزرسانی مستقیم.                                                                                                                                                                                       |
| `/acp set <key> <value>`     | عمومی                                | `key=cwd` از مسیر بازنویسی cwd استفاده می‌کند.                                                                                                                                                           |
| `/acp reset-options`         | همه‌ی بازنویسی‌های runtime را پاک می‌کند | -                                                                                                                                                                                                          |

## harness مربوط به acpx، راه‌اندازی Plugin، و مجوزها

برای پیکربندی harness مربوط به acpx (نام‌های مستعار Claude Code / Codex / Gemini CLI)،
پل‌های MCP مربوط به plugin-tools و OpenClaw-tools، و حالت‌های
مجوز ACP، ببینید
[عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup).

## عیب‌یابی

| نشانه | علت محتمل | رفع |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | Plugin پشتوانه وجود ندارد، غیرفعال است، یا توسط `plugins.allow` مسدود شده است. | Plugin پشتوانه را نصب و فعال کنید، وقتی این فهرست مجاز تنظیم شده است `acpx` را در `plugins.allow` قرار دهید، سپس `/acp doctor` را اجرا کنید. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP به‌صورت سراسری غیرفعال است. | `acp.enabled=true` را تنظیم کنید. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | ارسال خودکار از پیام‌های رشته عادی غیرفعال است. | برای ازسرگیری مسیریابی خودکار رشته، `acp.dispatch.enabled=true` را تنظیم کنید؛ فراخوانی‌های صریح `sessions_spawn({ runtime: "acp" })` همچنان کار می‌کنند. |
| `ACP agent "<id>" is not allowed by policy` | عامل در فهرست مجاز نیست. | از `agentId` مجاز استفاده کنید یا `acp.allowedAgents` را به‌روزرسانی کنید. |
| `/acp doctor` reports backend not ready right after startup | Plugin پشتوانه وجود ندارد، غیرفعال است، توسط سیاست اجازه/عدم اجازه مسدود شده است، یا فایل اجرایی پیکربندی‌شده آن در دسترس نیست. | Plugin پشتوانه را نصب/فعال کنید، دوباره `/acp doctor` را اجرا کنید، و اگر همچنان ناسالم ماند خطای نصب پشتوانه یا سیاست را بررسی کنید. |
| Harness command not found | CLI آداپتور نصب نشده است، Plugin خارجی وجود ندارد، یا دریافت نخستین اجرای `npx` برای یک آداپتور غیر Codex ناموفق بوده است. | `/acp doctor` را اجرا کنید، آداپتور را روی میزبان Gateway نصب/ازپیش‌گرم کنید، یا فرمان عامل acpx را صریح پیکربندی کنید. |
| Model-not-found from the harness | شناسه مدل برای ارائه‌دهنده/هارنس دیگری معتبر است، اما برای این هدف ACP معتبر نیست. | از مدلی استفاده کنید که آن هارنس فهرست کرده است، مدل را در هارنس پیکربندی کنید، یا بازنویسی را حذف کنید. |
| Vendor auth error from the harness | OpenClaw سالم است، اما CLI/ارائه‌دهنده هدف وارد نشده است. | وارد شوید یا کلید ارائه‌دهنده لازم را در محیط میزبان Gateway فراهم کنید. |
| `Unable to resolve session target: ...` | توکن کلید/شناسه/برچسب نادرست است. | `/acp sessions` را اجرا کنید، کلید/برچسب دقیق را کپی کنید، و دوباره تلاش کنید. |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` بدون گفت‌وگوی قابل اتصال فعال استفاده شده است. | به چت/کانال هدف بروید و دوباره تلاش کنید، یا از ایجاد بدون اتصال استفاده کنید. |
| `Conversation bindings are unavailable for <channel>.` | آداپتور قابلیت اتصال ACP برای گفت‌وگوی فعلی را ندارد. | در صورت پشتیبانی، از `/acp spawn ... --thread ...` استفاده کنید، `bindings[]` سطح بالا را پیکربندی کنید، یا به کانال پشتیبانی‌شده بروید. |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` بیرون از زمینه رشته استفاده شده است. | به رشته هدف بروید یا از `--thread auto`/`off` استفاده کنید. |
| `Only <user-id> can rebind this channel/conversation/thread.` | کاربر دیگری مالک هدف اتصال فعال است. | به‌عنوان مالک دوباره متصل کنید یا از گفت‌وگو یا رشته دیگری استفاده کنید. |
| `Thread bindings are unavailable for <channel>.` | آداپتور قابلیت اتصال رشته را ندارد. | از `--thread off` استفاده کنید یا به آداپتور/کانال پشتیبانی‌شده بروید. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | زمان اجرای ACP سمت میزبان است؛ نشست درخواست‌کننده sandbox شده است. | از نشست‌های sandbox شده `runtime="subagent"` را استفاده کنید، یا ایجاد ACP را از یک نشست غیر sandbox شده اجرا کنید. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | `sandbox="require"` برای زمان اجرای ACP درخواست شده است. | برای sandbox الزامی از `runtime="subagent"` استفاده کنید، یا ACP را با `sandbox="inherit"` از یک نشست غیر sandbox شده به کار ببرید. |
| `Cannot apply --model ... did not advertise model support` | هارنس هدف تعویض مدل عمومی ACP را ارائه نمی‌کند. | از هارنسی استفاده کنید که ACP `models`/`session/set_model` را اعلام می‌کند، از ارجاع‌های مدل Codex ACP استفاده کنید، یا اگر هارنس پرچم راه‌اندازی خودش را دارد، مدل را مستقیماً در هارنس پیکربندی کنید. |
| Missing ACP metadata for bound session | فراداده نشست ACP کهنه/حذف‌شده است. | با `/acp spawn` دوباره ایجاد کنید، سپس رشته را دوباره متصل/متمرکز کنید. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` در نشست ACP غیرتعاملی، نوشتن/اجرا را مسدود می‌کند. | `plugins.entries.acpx.config.permissionMode` را روی `approve-all` تنظیم کنید و Gateway را بازراه‌اندازی کنید. [پیکربندی مجوز](/fa/tools/acp-agents-setup#permission-configuration) را ببینید. |
| ACP session fails early with little output | درخواست‌های مجوز توسط `permissionMode`/`nonInteractivePermissions` مسدود شده‌اند. | لاگ‌های Gateway را برای `AcpRuntimeError` بررسی کنید. برای مجوزهای کامل، `permissionMode=approve-all` را تنظیم کنید؛ برای افت عملکرد کنترل‌شده، `nonInteractivePermissions=deny` را تنظیم کنید. |
| ACP session stalls indefinitely after completing work | فرایند هارنس پایان یافته اما نشست ACP تکمیل را گزارش نکرده است. | OpenClaw را به‌روزرسانی کنید؛ پاک‌سازی فعلی acpx هنگام بستن و راه‌اندازی Gateway، فرایندهای wrapper و آداپتور کهنه متعلق به OpenClaw را جمع‌آوری می‌کند. |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` | پاکت رویداد داخلی از مرز ACP نشت کرده است. | OpenClaw را به‌روزرسانی کنید و جریان تکمیل را دوباره اجرا کنید؛ هارنس‌های خارجی باید فقط اعلان‌های تکمیل ساده دریافت کنند. |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` به
رله هوک بومی Codex تعلق دارد، نه ACP/acpx. در یک چت Codex متصل، یک نشست تازه
با `/new` یا `/reset` شروع کنید؛ اگر یک‌بار کار کرد و سپس در فراخوانی بعدی
ابزار بومی برگشت، به‌جای تکرار `/new`، app-server Codex یا OpenClaw Gateway را بازراه‌اندازی کنید.
[عیب‌یابی هارنس Codex](/fa/plugins/codex-harness#troubleshooting) را ببینید.
</Note>

## مرتبط

- [عامل‌های ACP - راه‌اندازی](/fa/tools/acp-agents-setup)
- [ارسال عامل](/fa/tools/agent-send)
- [پشتوانه‌های CLI](/fa/gateway/cli-backends)
- [هارنس Codex](/fa/plugins/codex-harness)
- [زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime)
- [ابزارهای sandbox چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (حالت پل)](/fa/cli/acp)
- [زیرعامل‌ها](/fa/tools/subagents)
