---
read_when:
    - نصب یا پیکربندی چارچوب acpx برای Claude Code / Codex / Gemini CLI
    - فعال‌سازی پل MCP ابزارهای Plugin یا ابزارهای OpenClaw
    - پیکربندی حالت‌های مجوز ACP
summary: 'راه‌اندازی عامل‌های ACP: پیکربندی مهار acpx، راه‌اندازی Plugin و مجوزها'
title: راه‌اندازی عامل‌های ACP
x-i18n:
    generated_at: "2026-07-12T10:49:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

برای نمای کلی، راهنمای عملیاتی اپراتور و مفاهیم، به [عامل‌های ACP](/fa/tools/acp-agents) مراجعه کنید.

این صفحه پیکربندی هارنس acpx، راه‌اندازی Plugin برای پل‌های MCP و پیکربندی مجوزها را پوشش می‌دهد.

فقط زمانی از این صفحه استفاده کنید که در حال راه‌اندازی مسیر ACP/acpx هستید. برای پیکربندی زمان اجرای بومی app-server در Codex، از [هارنس Codex](/fa/plugins/codex-harness) استفاده کنید. برای کلیدهای API در OpenAI یا پیکربندی ارائه‌دهنده مدل با OAuth در Codex، به [OpenAI](/fa/providers/openai) مراجعه کنید.

Codex دو مسیر در OpenClaw دارد:

| مسیر                       | پیکربندی/فرمان                                          | صفحه راه‌اندازی                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| app-server بومی Codex      | `/codex ...`، ارجاع‌های عامل `openai/gpt-*`           | [هارنس Codex](/fa/plugins/codex-harness)   |
| آداپتور صریح ACP در Codex  | `/acp spawn codex`، `runtime: "acp", agentId: "codex"` | این صفحه                                |

مگر اینکه صراحتاً به رفتار ACP/acpx نیاز داشته باشید، مسیر بومی را ترجیح دهید.

## پشتیبانی فعلی هارنس acpx

نام‌های مستعار داخلی هارنس acpx (از وابستگی سنجاق‌شده `acpx`):

| نام مستعار   | پوشش‌دهنده                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | پل ACP در OpenClaw (`openclaw acp` بومی)                                                                        |
| `pi`         | [عامل کدنویسی Pi](https://github.com/mariozechner/pi)                                                          |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` و `factorydroid` نیز به آداپتور داخلی `droid` نگاشت می‌شوند.

هنگامی که OpenClaw از بک‌اند acpx استفاده می‌کند، این مقادیر را برای `agentId` ترجیح دهید، مگر اینکه پیکربندی acpx شما نام‌های مستعار سفارشی برای عامل‌ها تعریف کرده باشد.
اگر نصب محلی Cursor شما همچنان ACP را به‌صورت `agent acp` ارائه می‌کند، به‌جای تغییر مقدار پیش‌فرض داخلی، فرمان عامل `cursor` را در پیکربندی acpx خود بازنویسی کنید.

استفاده مستقیم از CLI در acpx همچنین می‌تواند با `--agent <command>` آداپتورهای دلخواه را هدف قرار دهد، اما این راه گریز خام، قابلیتی از CLI در acpx است و مسیر معمول `agentId` در OpenClaw نیست.

کنترل مدل به قابلیت‌های آداپتور وابسته است. ارجاع‌های مدل ACP در Codex پیش از راه‌اندازی توسط OpenClaw عادی‌سازی می‌شوند. سایر هارنس‌ها به `models` در ACP به‌همراه پشتیبانی از `session/set_model` نیاز دارند؛ اگر یک هارنس نه این قابلیت ACP و نه پرچم راه‌اندازی مدل مختص خود را ارائه کند، OpenClaw/acpx نمی‌تواند انتخاب مدل را تحمیل کند.

## پیکربندی الزامی

خط مبنای اصلی ACP:

```json5
{
  acp: {
    enabled: true,
    // اختیاری است. مقدار پیش‌فرض true است؛ برای توقف ارسال ACP در حالی که کنترل‌های /acp حفظ می‌شوند، آن را false کنید.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // مقادیر پیش‌فرض coalesceIdleMs: 350 و maxChunkChars: 1800 هستند؛ در اینجا صراحتاً نمایش داده شده‌اند.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

پیکربندی اتصال رشته به آداپتور کانال وابسته است. نمونه برای Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        // مقدار پیش‌فرض از قبل true است؛ در اینجا صراحتاً نمایش داده شده است.
        spawnSessions: true,
      },
    },
  },
}
```

اگر ایجاد ACP متصل به رشته کار نمی‌کند، ابتدا پرچم قابلیت آداپتور را بررسی کنید:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

اتصال‌های مکالمه جاری به ایجاد رشته فرزند نیاز ندارند. آن‌ها به یک بافت مکالمه فعال و آداپتور کانالی نیاز دارند که اتصال‌های مکالمه ACP را ارائه کند.

به [مرجع پیکربندی](/fa/gateway/configuration-reference) مراجعه کنید.

## راه‌اندازی Plugin برای بک‌اند acpx

نصب‌های بسته‌بندی‌شده برای ACP از Plugin رسمی زمان اجرای `@openclaw/acpx` استفاده می‌کنند.
پیش از استفاده از نشست‌های هارنس ACP، آن را نصب و فعال کنید:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

نسخه‌های دریافت‌شده از منبع نیز می‌توانند پس از `pnpm install` از Plugin فضای کاری محلی استفاده کنند.

با این مورد شروع کنید:

```text
/acp doctor
```

اگر `acpx` را غیرفعال کرده‌اید، دسترسی آن را از طریق `plugins.allow` / `plugins.deny` رد کرده‌اید، یا می‌خواهید دوباره به Plugin بسته‌بندی‌شده برگردید، از مسیر صریح بسته استفاده کنید:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

نصب فضای کاری محلی هنگام توسعه:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

سپس سلامت بک‌اند را تأیید کنید:

```text
/acp doctor
```

### کاوش راه‌اندازی زمان اجرای acpx

Plugin مربوط به `acpx` زمان اجرای ACP را مستقیماً در خود جای می‌دهد و هیچ فایل اجرایی یا نسخه جداگانه‌ای از `acpx` برای پیکربندی وجود ندارد. به‌طور پیش‌فرض، این Plugin هنگام راه‌اندازی Gateway بک‌اند تعبیه‌شده را ثبت می‌کند و پیش از سیگنال `ready` در Gateway، منتظر یک کاوش راه‌اندازی می‌ماند. فقط برای اسکریپت‌ها یا محیط‌هایی که عمداً کاوش راه‌اندازی را غیرفعال نگه می‌دارند، `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` یا `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` را تنظیم کنید. برای اجرای صریح کاوش در زمان تقاضا، `/acp doctor` را اجرا کنید.

هنگامی که یک مسیر یا مقدار پرچم باید به‌عنوان یک توکن argv باقی بماند، فرمان یک عامل ACP را با آرگومان‌های ساخت‌یافته بازنویسی کنید:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` فایل اجرایی یا رشته فرمان موجود برای آن عامل ACP است.
- `agents.<id>.args` اختیاری است. پیش از آنکه OpenClaw هر عضو آرایه را از طریق رجیستری رشته فرمان فعلی acpx عبور دهد، آن عضو برای پوسته نقل‌قول‌گذاری می‌شود.

به [Pluginها](/fa/tools/plugin) مراجعه کنید.

### دانلود خودکار آداپتور

`acpx` آداپتورهای ACP، برای مثال پل‌های ACP در Claude و Codex، را هنگام نخستین استفاده از طریق `npx` به‌طور خودکار دانلود می‌کند. نیازی نیست بسته‌های آداپتور را دستی نصب کنید و برای خود OpenClaw نیز مرحله جداگانه‌ای پس از نصب وجود ندارد. اگر دانلود یا ایجاد یک آداپتور ناموفق باشد، `/acp doctor` خطا را گزارش می‌کند.

### پل MCP ابزارهای Plugin

به‌طور پیش‌فرض، نشست‌های ACPX ابزارهای ثبت‌شده توسط Pluginهای OpenClaw را در اختیار هارنس ACP قرار **نمی‌دهند**.

اگر می‌خواهید عامل‌های ACP مانند Codex یا Claude Code بتوانند ابزارهای Plugin نصب‌شده در OpenClaw، مانند بازیابی/ذخیره حافظه، را فراخوانی کنند، پل اختصاصی را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

کارکرد این تنظیم:

- یک سرور داخلی MCP با نام `openclaw-plugin-tools` را به راه‌اندازی اولیه نشست ACPX تزریق می‌کند.
- ابزارهای Plugin را که از قبل توسط Pluginهای نصب‌شده و فعال OpenClaw ثبت شده‌اند، ارائه می‌کند.
- این قابلیت را صریح و به‌طور پیش‌فرض غیرفعال نگه می‌دارد.

نکات امنیتی و اعتماد:

- این کار سطح ابزار هارنس ACP را گسترش می‌دهد.
- عامل‌های ACP فقط به ابزارهای Plugin دسترسی می‌یابند که از قبل در Gateway فعال هستند.
- این مورد را هم‌مرز با اعتمادی در نظر بگیرید که برای اجازه اجرای همان Pluginها در خود OpenClaw لازم است.
- پیش از فعال‌سازی، Pluginهای نصب‌شده را بررسی کنید.

`mcpServers` سفارشی همچنان مانند قبل کار می‌کنند. پل داخلی ابزارهای Plugin یک امکان اختیاری و افزوده است، نه جایگزینی برای پیکربندی عمومی سرور MCP.

### پل MCP ابزارهای OpenClaw

به‌طور پیش‌فرض، نشست‌های ACPX ابزارهای داخلی OpenClaw را نیز از طریق MCP ارائه **نمی‌کنند**. هنگامی که یک عامل ACP به ابزارهای داخلی منتخب مانند `cron` نیاز دارد، پل جداگانه ابزارهای هسته را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

کارکرد این تنظیم:

- یک سرور داخلی MCP با نام `openclaw-tools` را به راه‌اندازی اولیه نشست ACPX تزریق می‌کند.
- ابزارهای داخلی منتخب OpenClaw را ارائه می‌کند. سرور اولیه `cron` را ارائه می‌دهد.
- ارائه ابزارهای هسته را صریح و به‌طور پیش‌فرض غیرفعال نگه می‌دارد.

### پیکربندی مهلت عملیات زمان اجرا

Plugin مربوط به `acpx` به‌طور پیش‌فرض برای عملیات راه‌اندازی و کنترل زمان اجرای تعبیه‌شده ۱۲۰ ثانیه زمان در نظر می‌گیرد. این مقدار به هارنس‌های کندتر مانند Gemini CLI زمان کافی می‌دهد تا راه‌اندازی و مقداردهی اولیه ACP را تکمیل کنند. اگر میزبان شما به محدودیت عملیاتی متفاوتی نیاز دارد، آن را بازنویسی کنید:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

نوبت‌های زمان اجرا از مهلت‌های agent/run در OpenClaw، از جمله `/acp timeout`، استفاده می‌کنند.
`sessions_spawn` بازنویسی مهلت برای هر فراخوانی را نمی‌پذیرد؛ مسیر اپراتور `agents.defaults.subagents.runTimeoutSeconds` است. پس از تغییر `timeoutSeconds`، Gateway را دوباره راه‌اندازی کنید.

### پیکربندی عامل کاوش سلامت

هنگامی که `/acp doctor` یا کاوش راه‌اندازی بک‌اند را بررسی می‌کند، Plugin همراه `acpx` یکی از عامل‌های هارنس را کاوش می‌کند. اگر `acp.allowedAgents` تنظیم شده باشد، مقدار پیش‌فرض نخستین عامل مجاز است؛ در غیر این صورت، مقدار پیش‌فرض `codex` خواهد بود. اگر استقرار شما برای بررسی‌های سلامت به عامل ACP دیگری نیاز دارد، عامل کاوش را صراحتاً تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

پس از تغییر این مقدار، Gateway را دوباره راه‌اندازی کنید.

## پیکربندی مجوزها

نشست‌های ACP به‌صورت غیرتعاملی اجرا می‌شوند؛ هیچ TUI برای تأیید یا رد درخواست‌های مجوز نوشتن فایل و اجرای پوسته وجود ندارد. Plugin مربوط به acpx دو کلید پیکربندی برای کنترل نحوه رسیدگی به مجوزها ارائه می‌کند:

این مجوزهای هارنس ACPX از تأییدهای اجرای OpenClaw و پرچم‌های دور زدن فروشنده در بک‌اند CLI مانند `--permission-mode bypassPermissions` در Claude CLI جدا هستند. `approve-all` در ACPX کلید اضطراری سطح هارنس برای نشست‌های ACP است.

برای مقایسه گسترده‌تر میان `tools.exec.mode` در OpenClaw، تأییدهای Codex Guardian و مجوزهای هارنس ACPX، به [حالت‌های مجوز](/fa/tools/permission-modes) مراجعه کنید.

### `permissionMode`

کنترل می‌کند که عامل هارنس کدام عملیات را بدون درخواست تأیید انجام دهد.

| مقدار           | رفتار                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | همهٔ نوشتن‌های فایل و فرمان‌های پوسته را به‌طور خودکار تأیید می‌کند.          |
| `approve-reads` | فقط خواندن‌ها را به‌طور خودکار تأیید می‌کند؛ نوشتن و اجرا به درخواست تأیید نیاز دارند. |
| `deny-all`      | همهٔ درخواست‌های مجوز را رد می‌کند.                              |

### `nonInteractivePermissions`

کنترل می‌کند وقتی باید درخواست مجوزی نمایش داده شود اما TTY تعاملی در دسترس نیست، چه اتفاقی بیفتد (که برای نشست‌های ACP همیشه چنین است).

| مقدار  | رفتار                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | نشست را با `PermissionPromptUnavailableError` متوقف می‌کند. **(پیش‌فرض)** |
| `deny` | مجوز را بی‌سروصدا رد می‌کند و ادامه می‌دهد (کاهش تدریجی قابلیت‌ها).        |

### پیکربندی

از طریق پیکربندی Plugin تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

پس از تغییر این مقادیر، Gateway را راه‌اندازی مجدد کنید.

<Warning>
مقادیر پیش‌فرض OpenClaw عبارت‌اند از `permissionMode=approve-reads` و `nonInteractivePermissions=fail`. در نشست‌های غیرتعاملی ACP، هرگونه نوشتن یا اجرایی که درخواست مجوز را فعال کند، ممکن است با خطای `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` مواجه شود.

اگر لازم است مجوزها را محدود کنید، `nonInteractivePermissions` را روی `deny` تنظیم کنید تا نشست‌ها به‌جای ازکارافتادن، با کاهش تدریجی قابلیت‌ها به کار ادامه دهند.
</Warning>

## مرتبط

- [عامل‌های ACP](/fa/tools/acp-agents) — نمای کلی، راهنمای عملیاتی اپراتور، مفاهیم
- [عامل‌های فرعی](/fa/tools/subagents)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
