---
read_when:
    - نصب یا پیکربندی هارنس acpx برای Claude Code / Codex / Gemini CLI
    - فعال‌سازی پل MCP مربوط به plugin-tools یا OpenClaw-tools
    - پیکربندی حالت‌های مجوز ACP
summary: 'راه‌اندازی عامل‌های ACP: پیکربندی هارنس acpx، راه‌اندازی Plugin، مجوزها'
title: عامل‌های ACP — راه‌اندازی
x-i18n:
    generated_at: "2026-05-02T12:03:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

برای نمای کلی، دستورالعمل عملیاتی، و مفاهیم، [ACP agents](/fa/tools/acp-agents) را ببینید.

بخش‌های زیر پیکربندی acpx harness، راه‌اندازی Plugin برای پل‌های MCP، و پیکربندی مجوز را پوشش می‌دهند.

از این صفحه فقط زمانی استفاده کنید که مسیر ACP/acpx را راه‌اندازی می‌کنید. برای پیکربندی native Codex
app-server runtime، از [Codex harness](/fa/plugins/codex-harness) استفاده کنید. برای
کلیدهای OpenAI API یا پیکربندی Codex OAuth model-provider، از
[OpenAI](/fa/providers/openai) استفاده کنید.

Codex دو مسیر OpenClaw دارد:

| مسیر                      | پیکربندی/فرمان                                         | صفحه راه‌اندازی                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Native Codex app-server    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/fa/plugins/codex-harness) |
| آداپتور صریح Codex ACP | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | این صفحه                               |

مسیر native را ترجیح دهید، مگر اینکه صراحتاً به رفتار ACP/acpx نیاز داشته باشید.

## پشتیبانی acpx harness (فعلی)

نام‌های مستعار harness داخلی فعلی acpx:

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

وقتی OpenClaw از backend acpx استفاده می‌کند، این مقادیر را برای `agentId` ترجیح دهید، مگر اینکه پیکربندی acpx شما نام‌های مستعار عامل سفارشی تعریف کرده باشد.
اگر نصب محلی Cursor شما هنوز ACP را به‌صورت `agent acp` ارائه می‌کند، به‌جای تغییر پیش‌فرض داخلی، فرمان عامل `cursor` را در پیکربندی acpx خود override کنید.

استفاده مستقیم از acpx CLI همچنین می‌تواند آداپتورهای دلخواه را از طریق `--agent <command>` هدف بگیرد، اما این راه گریز خام یک قابلیت acpx CLI است (نه مسیر عادی `agentId` در OpenClaw).

کنترل مدل به قابلیت آداپتور وابسته است. ارجاع‌های مدل Codex ACP پیش از راه‌اندازی توسط OpenClaw
نرمال‌سازی می‌شوند. سایر harnessها به ACP `models` به‌همراه
پشتیبانی `session/set_model` نیاز دارند؛ اگر یک harness نه آن قابلیت ACP
و نه flag مدل راه‌اندازی خودش را ارائه کند، OpenClaw/acpx نمی‌تواند انتخاب مدل را اجبار کند.

## پیکربندی لازم

خط مبنای Core ACP:

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

پیکربندی اتصال نخ به آداپتور کانال وابسته است. نمونه برای Discord:

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

اگر spawn وابسته به نخ در ACP کار نمی‌کند، ابتدا flag قابلیت آداپتور را بررسی کنید:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

اتصال‌های مکالمه فعلی به ایجاد child-thread نیاز ندارند. آن‌ها به context فعال مکالمه و یک آداپتور کانال که اتصال‌های مکالمه ACP را ارائه کند نیاز دارند.

[Configuration Reference](/fa/gateway/configuration-reference) را ببینید.

## راه‌اندازی Plugin برای backend acpx

نصب‌های بسته‌بندی‌شده از Plugin runtime رسمی `@openclaw/acpx` برای ACP استفاده می‌کنند.
پیش از استفاده از نشست‌های ACP harness، آن را نصب و فعال کنید:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

checkoutهای سورس نیز می‌توانند پس از `pnpm install` از Plugin محلی workspace استفاده کنند.

با این شروع کنید:

```text
/acp doctor
```

اگر `acpx` را غیرفعال کرده‌اید، آن را از طریق `plugins.allow` / `plugins.deny` رد کرده‌اید، یا می‌خواهید
به Plugin بسته‌بندی‌شده برگردید، از مسیر بسته صریح استفاده کنید:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

نصب workspace محلی در زمان توسعه:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

سپس سلامت backend را بررسی کنید:

```text
/acp doctor
```

### پیکربندی فرمان و نسخه acpx

به‌طور پیش‌فرض، Plugin `acpx` backend داخلی ACP را بدون
spawn کردن یک عامل ACP هنگام راه‌اندازی Gateway ثبت می‌کند. برای probe زنده صریح،
`/acp doctor` را اجرا کنید. `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` را فقط زمانی تنظیم کنید که نیاز دارید
Gateway هنگام راه‌اندازی عامل پیکربندی‌شده را probe کند.

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

- `command` یک مسیر مطلق، مسیر نسبی (حل‌شده از workspace OpenClaw)، یا نام فرمان را می‌پذیرد.
- `expectedVersion: "any"` تطبیق سخت‌گیرانه نسخه را غیرفعال می‌کند.
- مسیرهای سفارشی `command` نصب خودکار محلی Plugin را غیرفعال می‌کنند.

[Plugins](/fa/tools/plugin) را ببینید.

### نصب خودکار وابستگی

وقتی OpenClaw را به‌صورت global با `npm install -g openclaw` نصب می‌کنید، وابستگی‌های runtime
acpx (binaryهای وابسته به پلتفرم) به‌طور خودکار
از طریق postinstall hook نصب می‌شوند. اگر نصب خودکار شکست بخورد، gateway همچنان
به‌طور عادی شروع می‌شود و وابستگی گمشده را از طریق `openclaw acp doctor` گزارش می‌کند.

### پل MCP ابزارهای Plugin

به‌طور پیش‌فرض، نشست‌های ACPX ابزارهای ثبت‌شده توسط Pluginهای OpenClaw را در معرض
ACP harness قرار **نمی‌دهند**.

اگر می‌خواهید عامل‌های ACP مانند Codex یا Claude Code ابزارهای Plugin نصب‌شده
OpenClaw مانند memory recall/store را فراخوانی کنند، پل اختصاصی را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

این کار چه می‌کند:

- یک سرور MCP داخلی با نام `openclaw-plugin-tools` را به bootstrap نشست ACPX
  تزریق می‌کند.
- ابزارهای Plugin را که از قبل توسط Pluginهای نصب‌شده و فعال OpenClaw ثبت شده‌اند، ارائه می‌کند.
- قابلیت را صریح و به‌صورت پیش‌فرض خاموش نگه می‌دارد.

نکات امنیتی و اعتماد:

- این سطح ابزار ACP harness را گسترش می‌دهد.
- عامل‌های ACP فقط به ابزارهای Plugin که از قبل در gateway فعال هستند دسترسی می‌گیرند.
- این را همان مرز اعتماد در نظر بگیرید که اجازه می‌دهد آن Pluginها در
  خود OpenClaw اجرا شوند.
- پیش از فعال‌سازی، Pluginهای نصب‌شده را بازبینی کنید.

`mcpServers` سفارشی همچنان مثل قبل کار می‌کند. پل داخلی plugin-tools یک
سهولت opt-in اضافی است، نه جایگزینی برای پیکربندی عمومی سرور MCP.

### پل MCP ابزارهای OpenClaw

به‌طور پیش‌فرض، نشست‌های ACPX همچنین ابزارهای داخلی OpenClaw را از طریق
MCP ارائه **نمی‌کنند**. وقتی یک عامل ACP به ابزارهای داخلی انتخاب‌شده
مانند `cron` نیاز دارد، پل جداگانه core-tools را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

این کار چه می‌کند:

- یک سرور MCP داخلی با نام `openclaw-tools` را به bootstrap نشست ACPX
  تزریق می‌کند.
- ابزارهای داخلی انتخاب‌شده OpenClaw را ارائه می‌کند. سرور اولیه `cron` را ارائه می‌کند.
- نمایش ابزارهای core را صریح و به‌صورت پیش‌فرض خاموش نگه می‌دارد.

### پیکربندی timeout runtime

Plugin `acpx` به‌طور پیش‌فرض turnهای runtime داخلی را روی timeout
۱۲۰ ثانیه تنظیم می‌کند. این به harnessهای کندتر مانند Gemini CLI زمان کافی می‌دهد تا
راه‌اندازی و مقداردهی اولیه ACP را کامل کنند. اگر میزبان شما به محدودیت runtime متفاوتی
نیاز دارد، آن را override کنید:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

پس از تغییر این مقدار، gateway را restart کنید.

### پیکربندی عامل health probe

وقتی `/acp doctor` یا startup probe اختیاری backend را بررسی می‌کند، Plugin بسته‌بندی‌شده
`acpx` یک عامل harness را probe می‌کند. اگر `acp.allowedAgents` تنظیم شده باشد، به‌طور پیش‌فرض
از اولین عامل مجاز استفاده می‌کند؛ در غیر این صورت پیش‌فرض آن `codex` است. اگر deployment شما
برای بررسی‌های سلامت به عامل ACP متفاوتی نیاز دارد، عامل probe را صریح تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

پس از تغییر این مقدار، gateway را restart کنید.

## پیکربندی مجوز

نشست‌های ACP به‌صورت غیرتعاملی اجرا می‌شوند؛ TTY برای تأیید یا رد promptهای مجوز file-write و shell-exec وجود ندارد. Plugin acpx دو کلید پیکربندی ارائه می‌کند که نحوه مدیریت مجوزها را کنترل می‌کنند:

این مجوزهای ACPX harness از تأییدهای exec در OpenClaw جدا هستند و همچنین از flagهای bypass vendor در CLI-backend مانند Claude CLI `--permission-mode bypassPermissions` جدا هستند. ACPX `approve-all` کلید break-glass در سطح harness برای نشست‌های ACP است.

### `permissionMode`

کنترل می‌کند عامل harness کدام عملیات را بدون prompt می‌تواند انجام دهد.

| مقدار           | رفتار                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | همه نوشتن‌های فایل و فرمان‌های shell را به‌طور خودکار تأیید می‌کند.          |
| `approve-reads` | فقط خواندن‌ها را به‌طور خودکار تأیید می‌کند؛ نوشتن‌ها و exec به prompt نیاز دارند. |
| `deny-all`      | همه promptهای مجوز را رد می‌کند.                              |

### `nonInteractivePermissions`

کنترل می‌کند وقتی قرار است prompt مجوز نمایش داده شود اما TTY تعاملی در دسترس نیست چه اتفاقی می‌افتد (که همیشه برای نشست‌های ACP همین‌طور است).

| مقدار  | رفتار                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | نشست را با `AcpRuntimeError` متوقف می‌کند. **(پیش‌فرض)**           |
| `deny` | مجوز را بی‌صدا رد می‌کند و ادامه می‌دهد (کاهش تدریجی قابلیت). |

### پیکربندی

از طریق پیکربندی Plugin تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

پس از تغییر این مقادیر، gateway را restart کنید.

<Warning>
OpenClaw به‌طور پیش‌فرض از `permissionMode=approve-reads` و `nonInteractivePermissions=fail` استفاده می‌کند. در نشست‌های ACP غیرتعاملی، هر write یا exec که prompt مجوز را فعال کند می‌تواند با `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` شکست بخورد.

اگر لازم است مجوزها را محدود کنید، `nonInteractivePermissions` را روی `deny` تنظیم کنید تا نشست‌ها به‌جای crash کردن، به‌صورت تدریجی قابلیت را کاهش دهند.
</Warning>

## مرتبط

- [ACP agents](/fa/tools/acp-agents) — نمای کلی، دستورالعمل عملیاتی، مفاهیم
- [Sub-agents](/fa/tools/subagents)
- [Multi-agent routing](/fa/concepts/multi-agent)
