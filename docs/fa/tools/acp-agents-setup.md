---
read_when:
    - نصب یا پیکربندی چارچوب acpx برای Claude Code / Codex / Gemini CLI
    - فعال‌سازی پل MCP برای plugin-tools یا OpenClaw-tools
    - پیکربندی حالت‌های مجوز ACP
summary: 'راه‌اندازی عامل‌های ACP: پیکربندی هارنس acpx، راه‌اندازی Plugin، مجوزها'
title: عامل‌های ACP — راه‌اندازی
x-i18n:
    generated_at: "2026-07-16T17:47:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

برای نمای کلی، راهنمای عملیاتی اپراتور و مفاهیم، به [عامل‌های ACP](/fa/tools/acp-agents) مراجعه کنید.

این صفحه پیکربندی هارنس acpx، راه‌اندازی Plugin برای پل‌های MCP و پیکربندی مجوزها را پوشش می‌دهد.

فقط زمانی از این صفحه استفاده کنید که در حال راه‌اندازی مسیر ACP/acpx هستید. برای پیکربندی زمان اجرای بومی app-server مربوط به Codex، از [هارنس Codex](/fa/plugins/codex-harness) استفاده کنید. برای کلیدهای OpenAI API یا پیکربندی ارائه‌دهنده مدل Codex OAuth، از [OpenAI](/fa/providers/openai) استفاده کنید.

Codex دو مسیر OpenClaw دارد:

| مسیر                       | پیکربندی/فرمان                                         | صفحه راه‌اندازی                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| app-server بومی Codex      | ارجاع‌های عامل `/codex ...`، `openai/gpt-*` | [هارنس Codex](/fa/plugins/codex-harness)   |
| آداپتور صریح Codex ACP     | `/acp spawn codex`، `runtime: "acp", agentId: "codex"`                 | این صفحه                                |

مگر اینکه صراحتاً به رفتار ACP/acpx نیاز داشته باشید، مسیر بومی را ترجیح دهید.

## پشتیبانی هارنس acpx (فعلی)

نام‌های مستعار داخلی هارنس acpx (از وابستگی پین‌شده `acpx`):

| نام مستعار            | پوشش‌دهنده                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `claude`    | [Claude Code](https://claude.ai/code)                                                                          |
| `codex`    | [Codex CLI](https://codex.openai.com)                                                                          |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`    | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                             |
| `droid`    | [Factory Droid](https://www.factory.ai)                                                                        |
| `fast-agent`    | [fast-agent](https://fast-agent.ai)                                                                            |
| `gemini`    | [Gemini CLI](https://github.com/google/gemini-cli)                                                             |
| `iflow`    | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                             |
| `kilocode`    | [Kilocode](https://kilocode.ai)                                                                                |
| `kimi`    | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                             |
| `kiro`    | [Kiro CLI](https://kiro.dev)                                                                                   |
| `mux`    | [Mux](https://mux.coder.com)                                                                                   |
| `opencode`    | [OpenCode](https://opencode.ai)                                                                                |
| `openclaw`    | پل OpenClaw ACP (`openclaw acp` بومی)                                                                      |
| `pi`    | [عامل کدنویسی Pi](https://github.com/mariozechner/pi)                                                          |
| `qoder`    | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                    |
| `qwen`    | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                               |
| `trae`    | [Trae CLI](https://docs.trae.cn/cli)                                                                           |

`factory-droid` و `factorydroid` نیز به آداپتور داخلی `droid` نگاشت می‌شوند.

وقتی OpenClaw از بک‌اند acpx استفاده می‌کند، مقادیر زیر را برای `agentId` ترجیح دهید، مگر اینکه پیکربندی acpx شما نام‌های مستعار سفارشی عامل تعریف کرده باشد.
اگر نصب محلی Cursor شما همچنان ACP را به‌صورت `agent acp` ارائه می‌کند، به‌جای تغییر پیش‌فرض داخلی، فرمان عامل `cursor` را در پیکربندی acpx خود بازنویسی کنید.

استفاده مستقیم از acpx CLI می‌تواند از طریق `--agent <command>` آداپتورهای دلخواه را نیز هدف قرار دهد، اما این راه گریز خام، ویژگی acpx CLI است (نه مسیر معمول `agentId` در OpenClaw).

کنترل مدل به قابلیت‌های آداپتور وابسته است. ارجاع‌های مدل Codex ACP پیش از راه‌اندازی توسط OpenClaw نرمال‌سازی می‌شوند. هارنس‌های دیگر به پشتیبانی ACP `models` به‌همراه `session/set_model` نیاز دارند؛ اگر هارنسی نه آن قابلیت ACP و نه پرچم مدل راه‌اندازی خودش را ارائه کند، OpenClaw/acpx نمی‌تواند انتخاب مدل را تحمیل کند.

## پیکربندی الزامی

خط مبنای اصلی ACP:

```json5
{
  acp: {
    enabled: true,
    // اختیاری است. پیش‌فرض true است؛ برای توقف ارسال ACP در حالی که کنترل‌های /acp حفظ می‌شوند، آن را false کنید.
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
      // پیش‌فرض‌ها coalesceIdleMs: 350 و maxChunkChars: 1800 هستند؛ در اینجا صراحتاً نمایش داده شده‌اند.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

پیکربندی اتصال رشته به آداپتور کانال وابسته است. نمونه‌ای برای Discord:

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

اگر ایجاد ACP متصل به رشته کار نمی‌کند، ابتدا پرچم ویژگی آداپتور را بررسی کنید:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

اتصال‌های مکالمه فعلی به ایجاد رشته فرزند نیاز ندارند. آن‌ها به زمینه مکالمه فعال و آداپتور کانالی نیاز دارند که اتصال‌های مکالمه ACP را ارائه کند.

به [مرجع پیکربندی](/fa/gateway/configuration-reference) مراجعه کنید.

## راه‌اندازی Plugin برای بک‌اند acpx

نصب‌های بسته‌بندی‌شده از Plugin رسمی زمان اجرای `@openclaw/acpx` برای ACP استفاده می‌کنند.
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

اگر `acpx` را غیرفعال کرده‌اید، آن را از طریق `plugins.allow` / `plugins.deny` رد کرده‌اید، یا می‌خواهید به Plugin بسته‌بندی‌شده بازگردید، از مسیر صریح بسته استفاده کنید:

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

Plugin مربوط به `acpx` زمان اجرای ACP را مستقیماً درون خود جای می‌دهد (هیچ فایل اجرایی یا نسخه جداگانه `acpx` برای پیکربندی وجود ندارد). به‌طور پیش‌فرض، بک‌اند تعبیه‌شده را هنگام راه‌اندازی Gateway ثبت می‌کند و پیش از سیگنال `ready` در Gateway منتظر کاوش راه‌اندازی می‌ماند. `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` یا `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` را فقط برای اسکریپت‌ها یا محیط‌هایی تنظیم کنید که عمداً کاوش راه‌اندازی را غیرفعال نگه می‌دارند. برای یک کاوش صریحِ درخواستی، `/acp doctor` را اجرا کنید.

وقتی یک مسیر یا مقدار پرچم باید به‌صورت یک توکن argv باقی بماند، فرمان یک عامل ACP را با آرگومان‌های ساختاریافته بازنویسی کنید:

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
- `agents.<id>.args` اختیاری است. هر عضو آرایه پیش از آنکه OpenClaw آن را از رجیستری فعلی رشته فرمان acpx عبور دهد، برای پوسته نقل‌قول‌گذاری می‌شود.

به [Pluginها](/fa/tools/plugin) مراجعه کنید.

### دانلود خودکار آداپتور

`acpx` آداپتورهای ACP (برای نمونه پل‌های Claude و Codex ACP) را در نخستین استفاده از طریق `npx` به‌طور خودکار دانلود می‌کند. نیازی نیست بسته‌های آداپتور را دستی نصب کنید و برای خود OpenClaw نیز مرحله postinstall جداگانه‌ای وجود ندارد. اگر دانلود یا ایجاد آداپتور ناموفق باشد، `/acp doctor` خطا را گزارش می‌کند.

### پل MCP ابزارهای Plugin

به‌طور پیش‌فرض، نشست‌های ACPX ابزارهای ثبت‌شده توسط Pluginهای OpenClaw را در اختیار هارنس ACP قرار **نمی‌دهند**.

اگر می‌خواهید عامل‌های ACP مانند Codex یا Claude Code بتوانند ابزارهای Plugin نصب‌شده OpenClaw مانند بازیابی/ذخیره‌سازی حافظه را فراخوانی کنند، پل اختصاصی را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

کارکرد آن:

- یک سرور داخلی MCP با نام `openclaw-plugin-tools` را به راه‌اندازی اولیه نشست ACPX تزریق می‌کند.
- ابزارهای Plugin را که از قبل توسط Pluginهای نصب‌شده و فعال OpenClaw ثبت شده‌اند، ارائه می‌کند.
- هویت نشست فعال ACP را به کارخانه‌های ابزار Plugin می‌فرستد تا ابزارهای مختص عامل در فضای نام همان عامل باقی بمانند.
- این قابلیت را صریح و به‌طور پیش‌فرض غیرفعال نگه می‌دارد.

نکات امنیتی و اعتماد:

- این کار سطح ابزار هارنس ACP را گسترش می‌دهد.
- عامل‌های ACP فقط به ابزارهای Plugin که از قبل در Gateway فعال‌اند دسترسی پیدا می‌کنند.
- این مورد را همان مرز اعتمادی در نظر بگیرید که اجازه اجرای آن Pluginها در خود OpenClaw را می‌دهد.
- پیش از فعال‌سازی، Pluginهای نصب‌شده را بررسی کنید.

`mcpServers`های سفارشی مانند قبل کار می‌کنند. پل داخلی ابزارهای Plugin یک قابلیت اختیاری افزوده است، نه جایگزینی برای پیکربندی عمومی سرور MCP.

### پل MCP ابزارهای OpenClaw

به‌طور پیش‌فرض، نشست‌های ACPX ابزارهای داخلی OpenClaw را نیز از طریق MCP ارائه **نمی‌کنند**. وقتی یک عامل ACP به ابزارهای داخلی منتخب مانند `cron` نیاز دارد، پل جداگانه ابزارهای هسته را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

کارکرد آن:

- یک سرور داخلی MCP با نام `openclaw-tools` را به راه‌اندازی اولیه نشست ACPX تزریق می‌کند.
- ابزارهای داخلی منتخب OpenClaw را ارائه می‌کند. سرور اولیه `cron` را ارائه می‌کند.
- ارائه ابزارهای هسته را صریح و به‌طور پیش‌فرض غیرفعال نگه می‌دارد.

### پیکربندی مهلت عملیات زمان اجرا

Plugin مربوط به `acpx` به‌طور پیش‌فرض 120 ثانیه به عملیات راه‌اندازی و کنترل زمان اجرای تعبیه‌شده فرصت می‌دهد. این زمان به هارنس‌های کندتر مانند Gemini CLI اجازه می‌دهد راه‌اندازی و مقداردهی اولیه ACP را کامل کنند. اگر میزبان شما به محدودیت عملیاتی دیگری نیاز دارد، آن را بازنویسی کنید:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

نوبت‌های زمان اجرا از مهلت‌های عامل/اجرای OpenClaw، از جمله `/acp timeout`، استفاده می‌کنند.
`sessions_spawn` بازنویسی مهلت برای هر فراخوانی را نمی‌پذیرد؛ مسیر اپراتور `agents.defaults.subagents.runTimeoutSeconds` است. پس از تغییر `timeoutSeconds`، Gateway را مجدداً راه‌اندازی کنید.

### پیکربندی عامل کاوش سلامت

وقتی `/acp doctor` یا کاوش راه‌اندازی بک‌اند را بررسی می‌کند، Plugin همراه `acpx` یک عامل هارنس را کاوش می‌کند. اگر `acp.allowedAgents` تنظیم شده باشد، مقدار پیش‌فرض آن نخستین عامل مجاز است؛ در غیر این صورت مقدار پیش‌فرض `codex` خواهد بود. اگر استقرار شما برای بررسی‌های سلامت به عامل ACP دیگری نیاز دارد، عامل کاوش را صراحتاً تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

پس از تغییر این مقدار، Gateway را مجدداً راه‌اندازی کنید.

## پیکربندی مجوزها

نشست‌های ACP به‌صورت غیرتعاملی اجرا می‌شوند — هیچ TTY برای تأیید یا رد درخواست‌های مجوز نوشتن فایل و اجرای پوسته وجود ندارد. Plugin ‏acpx دو کلید پیکربندی ارائه می‌دهد که نحوه مدیریت مجوزها را کنترل می‌کنند:

این مجوزهای هارنس ACPX از تأییدهای اجرای OpenClaw و پرچم‌های دور زدن محدودیت‌های عرضه‌کننده در بک‌اند CLI، مانند Claude CLI ‏`--permission-mode bypassPermissions`، جدا هستند. ‏ACPX ‏`approve-all` کلید اضطراری سطح هارنس برای نشست‌های ACP است.

برای مقایسه گسترده‌تر میان OpenClaw ‏`tools.exec.mode`، تأییدهای Codex Guardian
و مجوزهای هارنس ACPX، به
[حالت‌های مجوز](/fa/tools/permission-modes) مراجعه کنید.

### `permissionMode`

کنترل می‌کند عامل هارنس کدام عملیات را می‌تواند بدون درخواست تأیید انجام دهد.

| مقدار           | رفتار                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | همه نوشتن‌های فایل و فرمان‌های پوسته را به‌طور خودکار تأیید می‌کند.          |
| `approve-reads` | فقط خواندن‌ها را به‌طور خودکار تأیید می‌کند؛ نوشتن و اجرا به درخواست تأیید نیاز دارند. |
| `deny-all`      | همه درخواست‌های مجوز را رد می‌کند.                              |

### `nonInteractivePermissions`

کنترل می‌کند وقتی باید درخواست مجوز نمایش داده شود اما TTY تعاملی در دسترس نیست، چه اتفاقی بیفتد (که در نشست‌های ACP همیشه چنین است).

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
مقادیر پیش‌فرض OpenClaw عبارت‌اند از `permissionMode=approve-reads` و `nonInteractivePermissions=fail`. در نشست‌های غیرتعاملی ACP، هر عملیات نوشتن یا اجرایی که درخواست مجوز ایجاد کند، ممکن است با `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` ناموفق شود.

اگر باید مجوزها را محدود کنید، `nonInteractivePermissions` را روی `deny` تنظیم کنید تا نشست‌ها به‌جای از کار افتادن، با کاهش تدریجی قابلیت‌ها ادامه دهند.
</Warning>

## مرتبط

- [عامل‌های ACP](/fa/tools/acp-agents) — نمای کلی، راهنمای عملیاتی اپراتور، مفاهیم
- [عامل‌های فرعی](/fa/tools/subagents)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
