---
read_when:
    - نصب یا پیکربندی هارنس acpx برای Claude Code / Codex / Gemini CLI
    - فعال‌سازی پل MCP مربوط به plugin-tools یا OpenClaw-tools
    - پیکربندی حالت‌های مجوز ACP
summary: 'راه‌اندازی عامل‌های ACP: پیکربندی هارنس acpx، راه‌اندازی Plugin، مجوزها'
title: عامل‌های ACP — راه‌اندازی
x-i18n:
    generated_at: "2026-06-27T18:54:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

برای نمای کلی، راهنمای عملیاتی اپراتور، و مفاهیم، به [عامل‌های ACP](/fa/tools/acp-agents) مراجعه کنید.

بخش‌های زیر پیکربندی چارچوب اجرایی acpx، راه‌اندازی Plugin برای پل‌های MCP، و پیکربندی مجوزها را پوشش می‌دهند.

از این صفحه فقط زمانی استفاده کنید که مسیر ACP/acpx را راه‌اندازی می‌کنید. برای پیکربندی runtime بومی app-server مربوط به Codex، از [چارچوب اجرایی Codex](/fa/plugins/codex-harness) استفاده کنید. برای کلیدهای API مربوط به OpenAI یا پیکربندی model-provider مربوط به Codex OAuth، از
[OpenAI](/fa/providers/openai) استفاده کنید.

Codex دو مسیر OpenClaw دارد:

| مسیر                       | پیکربندی/فرمان                                         | صفحه راه‌اندازی                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| app-server بومی Codex      | `/codex ...`, `openai/gpt-*` agent refs                | [چارچوب اجرایی Codex](/fa/plugins/codex-harness) |
| آداپتور صریح Codex ACP     | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | این صفحه                                |

مسیر بومی را ترجیح دهید، مگر اینکه صراحتا به رفتار ACP/acpx نیاز داشته باشید.

## پشتیبانی چارچوب اجرایی acpx (فعلی)

نام‌های مستعار داخلی فعلی چارچوب اجرایی acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `qwen`

وقتی OpenClaw از backend مربوط به acpx استفاده می‌کند، این مقادیر را برای `agentId` ترجیح دهید، مگر اینکه پیکربندی acpx شما نام‌های مستعار سفارشی برای عامل تعریف کرده باشد.
اگر نصب محلی Cursor شما هنوز ACP را به شکل `agent acp` ارائه می‌کند، به‌جای تغییر پیش‌فرض داخلی، فرمان عامل `cursor` را در پیکربندی acpx خود بازنویسی کنید.

استفاده مستقیم از acpx CLI همچنین می‌تواند از طریق `--agent <command>` آداپتورهای دلخواه را هدف بگیرد، اما این راه خروج خام یک قابلیت acpx CLI است (نه مسیر معمول OpenClaw برای `agentId`).

کنترل مدل به قابلیت آداپتور وابسته است. ارجاع‌های مدل Codex ACP پیش از راه‌اندازی توسط OpenClaw نرمال‌سازی می‌شوند. چارچوب‌های اجرایی دیگر به ACP `models` به‌همراه پشتیبانی `session/set_model` نیاز دارند؛ اگر یک چارچوب اجرایی نه آن قابلیت ACP را ارائه کند و نه پرچم مدل راه‌اندازی خودش را، OpenClaw/acpx نمی‌تواند انتخاب مدل را اجباری کند.

## پیکربندی لازم

خط پایه اصلی ACP:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
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
      "openclaw",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
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
        spawnSessions: true,
      },
    },
  },
}
```

اگر ایجاد ACP وابسته به رشته کار نمی‌کند، ابتدا پرچم قابلیت آداپتور را بررسی کنید:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

اتصال‌های گفت‌وگوی فعلی به ایجاد رشته فرزند نیاز ندارند. آن‌ها به یک بافت گفت‌وگوی فعال و یک آداپتور کانال نیاز دارند که اتصال‌های گفت‌وگوی ACP را ارائه کند.

به [مرجع پیکربندی](/fa/gateway/configuration-reference) مراجعه کنید.

## راه‌اندازی Plugin برای backend مربوط به acpx

نصب‌های بسته‌بندی‌شده از Plugin runtime رسمی `@openclaw/acpx` برای ACP استفاده می‌کنند.
پیش از استفاده از نشست‌های چارچوب اجرایی ACP، آن را نصب و فعال کنید:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

checkoutهای منبع نیز می‌توانند پس از `pnpm install` از Plugin فضای کاری محلی استفاده کنند.

با این شروع کنید:

```text
/acp doctor
```

اگر `acpx` را غیرفعال کرده‌اید، آن را از طریق `plugins.allow` / `plugins.deny` رد کرده‌اید، یا می‌خواهید به Plugin بسته‌بندی‌شده برگردید، از مسیر بسته صریح استفاده کنید:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

نصب فضای کاری محلی هنگام توسعه:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

سپس سلامت backend را بررسی کنید:

```text
/acp doctor
```

### فرمان acpx و پیکربندی نسخه

به‌طور پیش‌فرض، Plugin `acpx` هنگام راه‌اندازی Gateway، backend توکار ACP را ثبت می‌کند و پیش از سیگنال `ready` مربوط به gateway منتظر probe راه‌اندازی runtime توکار می‌ماند. `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` یا
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` را فقط برای اسکریپت‌ها یا محیط‌هایی تنظیم کنید که عمدا probe راه‌اندازی را غیرفعال نگه می‌دارند. برای یک probe صریح در زمان نیاز، `/acp doctor` را اجرا کنید.

فرمان یا نسخه را در پیکربندی Plugin بازنویسی کنید:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` یک مسیر مطلق، مسیر نسبی (که از فضای کاری OpenClaw resolve می‌شود)، یا نام فرمان را می‌پذیرد.
- `expectedVersion: "any"` تطبیق سخت‌گیرانه نسخه را غیرفعال می‌کند.
- مسیرهای سفارشی `command` نصب خودکار محلی Plugin را غیرفعال می‌کنند.

وقتی یک مسیر یا مقدار پرچم باید یک argv token باقی بماند، فرمان یک عامل ACP را با آرگومان‌های ساخت‌یافته بازنویسی کنید:

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
- `agents.<id>.args` اختیاری است. هر آیتم آرایه پیش از اینکه OpenClaw آن را از طریق رجیستری command-string فعلی acpx عبور دهد، به‌شکل shell-quoted درمی‌آید.

به [Pluginها](/fa/tools/plugin) مراجعه کنید.

### نصب خودکار وابستگی

وقتی OpenClaw را به‌صورت global با `npm install -g openclaw` نصب می‌کنید، وابستگی‌های runtime مربوط به acpx (باینری‌های مخصوص پلتفرم) به‌طور خودکار از طریق postinstall hook نصب می‌شوند. اگر نصب خودکار شکست بخورد، gateway همچنان به‌طور عادی شروع می‌شود و وابستگی گم‌شده را از طریق `openclaw acp doctor` گزارش می‌کند.

### پل MCP ابزارهای Plugin

به‌طور پیش‌فرض، نشست‌های ACPX ابزارهای ثبت‌شده توسط Pluginهای OpenClaw را در اختیار چارچوب اجرایی ACP قرار نمی‌دهند.

اگر می‌خواهید عامل‌های ACP مانند Codex یا Claude Code ابزارهای Plugin نصب‌شده OpenClaw مانند memory recall/store را فراخوانی کنند، پل اختصاصی را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

این کار چه می‌کند:

- یک MCP server داخلی با نام `openclaw-plugin-tools` را به bootstrap نشست ACPX تزریق می‌کند.
- ابزارهای Plugin را که از قبل توسط Pluginهای نصب‌شده و فعال OpenClaw ثبت شده‌اند، ارائه می‌کند.
- این قابلیت را صریح و به‌طور پیش‌فرض خاموش نگه می‌دارد.

نکات امنیت و اعتماد:

- این کار سطح ابزار چارچوب اجرایی ACP را گسترش می‌دهد.
- عامل‌های ACP فقط به ابزارهای Plugin که از قبل در gateway فعال هستند دسترسی پیدا می‌کنند.
- با این مورد مانند همان مرز اعتمادی برخورد کنید که اجازه می‌دهد آن Pluginها در خود OpenClaw اجرا شوند.
- پیش از فعال‌سازی، Pluginهای نصب‌شده را بازبینی کنید.

`mcpServers` سفارشی همچنان مثل قبل کار می‌کند. پل داخلی plugin-tools یک سهولت اختیاری اضافی است، نه جایگزینی برای پیکربندی generic MCP server.

### پل MCP ابزارهای OpenClaw

به‌طور پیش‌فرض، نشست‌های ACPX همچنین ابزارهای داخلی OpenClaw را از طریق MCP ارائه نمی‌کنند. وقتی یک عامل ACP به ابزارهای داخلی منتخب مانند `cron` نیاز دارد، پل جداگانه core-tools را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

این کار چه می‌کند:

- یک MCP server داخلی با نام `openclaw-tools` را به bootstrap نشست ACPX تزریق می‌کند.
- ابزارهای داخلی منتخب OpenClaw را ارائه می‌کند. سرور اولیه `cron` را ارائه می‌کند.
- ارائه ابزارهای core را صریح و به‌طور پیش‌فرض خاموش نگه می‌دارد.

### پیکربندی timeout عملیات runtime

Plugin `acpx` به‌طور پیش‌فرض برای راه‌اندازی runtime توکار و عملیات کنترلی ۱۲۰ ثانیه زمان می‌دهد. این به چارچوب‌های اجرایی کندتر مانند Gemini CLI زمان کافی می‌دهد تا راه‌اندازی و مقداردهی اولیه ACP را کامل کنند. اگر میزبان شما به محدودیت عملیات متفاوتی نیاز دارد، آن را بازنویسی کنید:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

نوبت‌های runtime از timeoutهای agent/run در OpenClaw استفاده می‌کنند، از جمله `/acp timeout`.
`sessions_spawn` بازنویسی timeout برای هر فراخوانی را نمی‌پذیرد. پس از تغییر این مقدار، gateway را restart کنید.

### پیکربندی عامل probe سلامت

وقتی `/acp doctor` یا probe راه‌اندازی backend را بررسی می‌کند، Plugin همراه `acpx` یک عامل چارچوب اجرایی را probe می‌کند. اگر `acp.allowedAgents` تنظیم شده باشد، به‌طور پیش‌فرض از نخستین عامل مجاز استفاده می‌کند؛ در غیر این صورت پیش‌فرض آن `codex` است. اگر استقرار شما برای بررسی‌های سلامت به عامل ACP متفاوتی نیاز دارد، عامل probe را صریحا تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

پس از تغییر این مقدار، gateway را restart کنید.

## پیکربندی مجوزها

نشست‌های ACP به‌صورت غیرتعاملی اجرا می‌شوند — هیچ TUI برای تایید یا رد promptهای مجوز file-write و shell-exec وجود ندارد. Plugin acpx دو کلید پیکربندی ارائه می‌کند که نحوه مدیریت مجوزها را کنترل می‌کنند:

این مجوزهای چارچوب اجرایی ACPX از تاییدهای exec در OpenClaw جدا هستند و از پرچم‌های bypass مربوط به فروشنده CLI-backend مانند Claude CLI `--permission-mode bypassPermissions` نیز جدا هستند. ACPX `approve-all` کلید اضطراری سطح چارچوب اجرایی برای نشست‌های ACP است.

برای مقایسه گسترده‌تر میان OpenClaw `tools.exec.mode`، تاییدهای Codex Guardian، و مجوزهای چارچوب اجرایی ACPX، به
[حالت‌های مجوز](/fa/tools/permission-modes) مراجعه کنید.

### `permissionMode`

کنترل می‌کند عامل چارچوب اجرایی کدام عملیات را بدون prompt می‌تواند انجام دهد.

| مقدار          | رفتار                                                     |
| -------------- | --------------------------------------------------------- |
| `approve-all`  | همه نوشتن‌های فایل و فرمان‌های shell را خودکار تایید می‌کند. |
| `approve-reads` | فقط خواندن‌ها را خودکار تایید می‌کند؛ نوشتن‌ها و exec به prompt نیاز دارند. |
| `deny-all`     | همه promptهای مجوز را رد می‌کند.                          |

### `nonInteractivePermissions`

کنترل می‌کند وقتی قرار است prompt مجوز نمایش داده شود اما TUI تعاملی در دسترس نیست چه اتفاقی بیفتد (که برای نشست‌های ACP همیشه همین‌طور است).

| مقدار  | رفتار                                                           |
| ------ | ---------------------------------------------------------------- |
| `fail` | نشست را با `AcpRuntimeError` متوقف می‌کند. **(پیش‌فرض)**         |
| `deny` | مجوز را بی‌صدا رد می‌کند و ادامه می‌دهد (تنزل graceful).         |

### پیکربندی

از طریق پیکربندی Plugin تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

پس از تغییر این مقادیر، gateway را restart کنید.

<Warning>
پیش‌فرض OpenClaw برابر `permissionMode=approve-reads` و `nonInteractivePermissions=fail` است. در نشست‌های غیرتعاملی ACP، هر نوشتن یا exec که prompt مجوز ایجاد کند می‌تواند با `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` شکست بخورد.

اگر لازم است مجوزها را محدود کنید، `nonInteractivePermissions` را روی `deny` تنظیم کنید تا نشست‌ها به‌جای crash کردن، به‌شکل graceful تنزل پیدا کنند.
</Warning>

## مرتبط

- [عامل‌های ACP](/fa/tools/acp-agents) — نمای کلی، راهنمای عملیاتی اپراتور، مفاهیم
- [زیرعامل‌ها](/fa/tools/subagents)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
