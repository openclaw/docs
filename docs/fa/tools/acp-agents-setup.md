---
read_when:
    - نصب یا پیکربندی هارنس acpx برای Claude Code / Codex / Gemini CLI
    - فعال‌سازی پل MCP برای plugin-tools یا OpenClaw-tools
    - پیکربندی حالت‌های مجوز ACP
summary: 'راه‌اندازی عامل‌های ACP: پیکربندی هارنس acpx، راه‌اندازی Plugin، مجوزها'
title: عامل‌های ACP — راه‌اندازی
x-i18n:
    generated_at: "2026-05-10T20:08:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

برای نمای کلی، راهنمای عملیاتی اپراتور، و مفاهیم، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

بخش‌های زیر پیکربندی هارنس acpx، راه‌اندازی Plugin برای پل‌های MCP، و پیکربندی مجوزها را پوشش می‌دهند.

از این صفحه فقط زمانی استفاده کنید که در حال راه‌اندازی مسیر ACP/acpx هستید. برای پیکربندی زمان اجرای بومی app-server در Codex، از [هارنس Codex](/fa/plugins/codex-harness) استفاده کنید. برای کلیدهای OpenAI API یا پیکربندی تأمین‌کننده مدل OAuth در Codex، از
[OpenAI](/fa/providers/openai) استفاده کنید.

Codex دو مسیر OpenClaw دارد:

| مسیر                       | پیکربندی/فرمان                                          | صفحه راه‌اندازی                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| app-server بومی Codex      | `/codex ...`, `openai/gpt-*` agent refs                | [هارنس Codex](/fa/plugins/codex-harness) |
| آداپتور صریح ACP برای Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | این صفحه                                |

مسیر بومی را ترجیح دهید، مگر اینکه به‌طور صریح به رفتار ACP/acpx نیاز داشته باشید.

## پشتیبانی هارنس acpx (فعلی)

نام‌های مستعار هارنس داخلی فعلی acpx:

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
- `pi`
- `qwen`

وقتی OpenClaw از backend acpx استفاده می‌کند، برای `agentId` این مقادیر را ترجیح دهید، مگر اینکه پیکربندی acpx شما نام‌های مستعار عامل سفارشی تعریف کرده باشد.
اگر نصب محلی Cursor شما هنوز ACP را به‌صورت `agent acp` ارائه می‌کند، به‌جای تغییر مقدار پیش‌فرض داخلی، فرمان عامل `cursor` را در پیکربندی acpx خود override کنید.

استفاده مستقیم از acpx CLI همچنین می‌تواند با `--agent <command>` آداپتورهای دلخواه را هدف بگیرد، اما این راه فرار خام یک قابلیت acpx CLI است (نه مسیر معمول `agentId` در OpenClaw).

کنترل مدل به قابلیت آداپتور وابسته است. ارجاع‌های مدل ACP در Codex پیش از شروع توسط OpenClaw نرمال‌سازی می‌شوند. هارنس‌های دیگر به ACP `models` به‌همراه پشتیبانی `session/set_model` نیاز دارند؛ اگر یک هارنس نه آن قابلیت ACP را ارائه کند و نه flag مدل راه‌اندازی خودش را، OpenClaw/acpx نمی‌تواند انتخاب مدل را اجبار کند.

## پیکربندی لازم

مبنای اصلی ACP:

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
      "pi",
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

پیکربندی اتصال thread به آداپتور کانال وابسته است. نمونه برای Discord:

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

اگر ACP spawn متصل به thread کار نمی‌کند، ابتدا flag قابلیت آداپتور را بررسی کنید:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

اتصال‌های گفت‌وگوی فعلی به ایجاد child-thread نیاز ندارند. آن‌ها به یک زمینه گفت‌وگوی فعال و یک آداپتور کانال نیاز دارند که اتصال‌های گفت‌وگوی ACP را ارائه کند.

[مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## راه‌اندازی Plugin برای backend acpx

نصب‌های بسته‌بندی‌شده از Plugin رسمی زمان اجرای `@openclaw/acpx` برای ACP استفاده می‌کنند.
پیش از استفاده از نشست‌های هارنس ACP، آن را نصب و فعال کنید:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

checkoutهای سورس نیز می‌توانند پس از `pnpm install` از Plugin فضای کاری محلی استفاده کنند.

با این شروع کنید:

```text
/acp doctor
```

اگر `acpx` را غیرفعال کرده‌اید، آن را از طریق `plugins.allow` / `plugins.deny` رد کرده‌اید، یا می‌خواهید به Plugin بسته‌بندی‌شده برگردید، از مسیر صریح بسته استفاده کنید:

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

### پیکربندی فرمان و نسخه acpx

به‌طور پیش‌فرض، Plugin `acpx` در زمان راه‌اندازی Gateway، backend جاسازی‌شده ACP را probe می‌کند و پیش از سیگنال `ready` در gateway منتظر آن probe می‌ماند. برای رد کردن probe راه‌اندازی و ثبت تنبل backend به‌جای آن، `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` را تنظیم کنید. برای یک probe صریح بر اساس تقاضا، `/acp doctor` را اجرا کنید.

فرمان یا نسخه را در پیکربندی Plugin override کنید:

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

- `command` یک مسیر مطلق، مسیر نسبی (حل‌شده از فضای کاری OpenClaw)، یا نام فرمان را می‌پذیرد.
- `expectedVersion: "any"` تطبیق سخت‌گیرانه نسخه را غیرفعال می‌کند.
- مسیرهای سفارشی `command` نصب خودکار محلی Plugin را غیرفعال می‌کنند.

وقتی یک مسیر یا مقدار flag باید به‌صورت یک توکن argv باقی بماند، فرمان یک عامل ACP را با آرگومان‌های ساختاریافته override کنید:

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
- `agents.<id>.args` اختیاری است. هر آیتم آرایه پیش از اینکه OpenClaw آن را از طریق رجیستری رشته فرمان فعلی acpx عبور دهد، shell-quote می‌شود.

[Plugins](/fa/tools/plugin) را ببینید.

### نصب خودکار وابستگی‌ها

وقتی OpenClaw را به‌صورت سراسری با `npm install -g openclaw` نصب می‌کنید، وابستگی‌های زمان اجرای acpx (باینری‌های مخصوص پلتفرم) به‌طور خودکار از طریق یک hook پس‌ازنصب نصب می‌شوند. اگر نصب خودکار شکست بخورد، gateway همچنان به‌طور عادی شروع می‌شود و وابستگی ازدست‌رفته را از طریق `openclaw acp doctor` گزارش می‌کند.

### پل MCP ابزارهای Plugin

به‌طور پیش‌فرض، نشست‌های ACPX ابزارهای ثبت‌شده توسط Plugin در OpenClaw را در اختیار هارنس ACP قرار **نمی‌دهند**.

اگر می‌خواهید عامل‌های ACP مانند Codex یا Claude Code بتوانند ابزارهای Plugin نصب‌شده در OpenClaw، مانند memory recall/store، را فراخوانی کنند، پل اختصاصی را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

این کار چه می‌کند:

- یک سرور MCP داخلی با نام `openclaw-plugin-tools` را به bootstrap نشست ACPX تزریق می‌کند.
- ابزارهای Plugin را که از پیش توسط Pluginهای نصب‌شده و فعال OpenClaw ثبت شده‌اند، ارائه می‌کند.
- این قابلیت را صریح و به‌طور پیش‌فرض خاموش نگه می‌دارد.

نکات امنیت و اعتماد:

- این کار سطح ابزار هارنس ACP را گسترش می‌دهد.
- عامل‌های ACP فقط به ابزارهای Plugin که از پیش در gateway فعال هستند دسترسی می‌گیرند.
- این را همان مرز اعتماد در نظر بگیرید که اجازه می‌دهد آن Pluginها در خود OpenClaw اجرا شوند.
- پیش از فعال‌سازی، Pluginهای نصب‌شده را بازبینی کنید.

`mcpServers` سفارشی همچنان مانند قبل کار می‌کنند. پل داخلی plugin-tools یک امکان opt-in اضافی است، نه جایگزینی برای پیکربندی عمومی سرور MCP.

### پل MCP ابزارهای OpenClaw

به‌طور پیش‌فرض، نشست‌های ACPX ابزارهای داخلی OpenClaw را نیز از طریق MCP ارائه **نمی‌دهند**. وقتی یک عامل ACP به ابزارهای داخلی منتخب مانند `cron` نیاز دارد، پل جداگانه core-tools را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

این کار چه می‌کند:

- یک سرور MCP داخلی با نام `openclaw-tools` را به bootstrap نشست ACPX تزریق می‌کند.
- ابزارهای داخلی منتخب OpenClaw را ارائه می‌کند. سرور اولیه `cron` را ارائه می‌کند.
- ارائه ابزارهای هسته را صریح و به‌طور پیش‌فرض خاموش نگه می‌دارد.

### پیکربندی timeout زمان اجرا

Plugin `acpx` به‌طور پیش‌فرض برای turnهای زمان اجرای جاسازی‌شده timeout برابر ۱۲۰ ثانیه دارد. این به هارنس‌های کندتر مانند Gemini CLI زمان کافی می‌دهد تا راه‌اندازی و مقداردهی اولیه ACP را کامل کنند. اگر میزبان شما به حد زمان اجرای متفاوتی نیاز دارد، آن را override کنید:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

پس از تغییر این مقدار، gateway را restart کنید.

### پیکربندی عامل probe سلامت

وقتی `/acp doctor` یا probe راه‌اندازی backend را بررسی می‌کند، Plugin بسته‌شده `acpx` یک عامل هارنس را probe می‌کند. اگر `acp.allowedAgents` تنظیم شده باشد، پیش‌فرض آن اولین عامل مجاز است؛ در غیر این صورت پیش‌فرض آن `codex` است. اگر استقرار شما برای بررسی‌های سلامت به عامل ACP متفاوتی نیاز دارد، عامل probe را صریح تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

پس از تغییر این مقدار، gateway را restart کنید.

## پیکربندی مجوزها

نشست‌های ACP به‌صورت غیرتعاملی اجرا می‌شوند — هیچ TTYای برای تأیید یا رد promptهای مجوز file-write و shell-exec وجود ندارد. Plugin acpx دو کلید پیکربندی ارائه می‌کند که نحوه مدیریت مجوزها را کنترل می‌کنند:

این مجوزهای هارنس ACPX از تأییدیه‌های exec در OpenClaw جدا هستند و از flagهای bypass فروشنده backendهای CLI مانند Claude CLI `--permission-mode bypassPermissions` نیز جدا هستند. ACPX `approve-all` کلید break-glass در سطح هارنس برای نشست‌های ACP است.

### `permissionMode`

کنترل می‌کند عامل هارنس کدام عملیات را بدون prompt می‌تواند انجام دهد.

| مقدار           | رفتار                                                    |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | همه نوشتن‌های فایل و فرمان‌های shell را خودکار تأیید می‌کند. |
| `approve-reads` | فقط خواندن‌ها را خودکار تأیید می‌کند؛ نوشتن‌ها و exec به prompt نیاز دارند. |
| `deny-all`      | همه promptهای مجوز را رد می‌کند.                         |

### `nonInteractivePermissions`

کنترل می‌کند وقتی قرار است یک prompt مجوز نشان داده شود اما TTY تعاملی در دسترس نیست چه اتفاقی می‌افتد (که برای نشست‌های ACP همیشه همین‌طور است).

| مقدار  | رفتار                                                             |
| ------ | ----------------------------------------------------------------- |
| `fail` | نشست را با `AcpRuntimeError` متوقف می‌کند. **(پیش‌فرض)**          |
| `deny` | مجوز را بی‌صدا رد می‌کند و ادامه می‌دهد (افت کیفیت graceful).     |

### پیکربندی

از طریق پیکربندی Plugin تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

پس از تغییر این مقادیر، gateway را restart کنید.

<Warning>
OpenClaw به‌طور پیش‌فرض از `permissionMode=approve-reads` و `nonInteractivePermissions=fail` استفاده می‌کند. در نشست‌های ACP غیرتعاملی، هر write یا exec که prompt مجوز را فعال کند می‌تواند با `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` شکست بخورد.

اگر باید مجوزها را محدود کنید، `nonInteractivePermissions` را روی `deny` تنظیم کنید تا نشست‌ها به‌جای crash کردن، graceful degradation داشته باشند.
</Warning>

## مرتبط

- [عامل‌های ACP](/fa/tools/acp-agents) — نمای کلی، راهنمای عملیاتی اپراتور، مفاهیم
- [زیرعامل‌ها](/fa/tools/subagents)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
