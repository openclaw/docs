---
read_when:
    - نصب یا پیکربندی هارنس acpx برای Claude Code / Codex / Gemini CLI
    - فعال‌سازی پل MCP ‏plugin-tools یا OpenClaw-tools
    - پیکربندی حالت‌های مجوز ACP
summary: 'راه‌اندازی عامل‌های ACP: پیکربندی هارنس acpx، راه‌اندازی Plugin، مجوزها'
title: عامل‌های ACP — راه‌اندازی
x-i18n:
    generated_at: "2026-04-29T23:38:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

برای نمای کلی، runbook اپراتور، و مفاهیم، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

بخش‌های زیر پیکربندی هارنس acpx، راه‌اندازی Plugin برای پل‌های MCP، و پیکربندی مجوزها را پوشش می‌دهند.

از این صفحه فقط زمانی استفاده کنید که مسیر ACP/acpx را راه‌اندازی می‌کنید. برای پیکربندی runtime بومی سرور برنامه Codex، از [هارنس Codex](/fa/plugins/codex-harness) استفاده کنید. برای کلیدهای API OpenAI یا پیکربندی model-provider مربوط به Codex OAuth، از [OpenAI](/fa/providers/openai) استفاده کنید.

Codex دو مسیر OpenClaw دارد:

| مسیر                       | پیکربندی/فرمان                                         | صفحه راه‌اندازی                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| سرور برنامه بومی Codex     | `/codex ...`, `agentRuntime.id: "codex"`               | [هارنس Codex](/fa/plugins/codex-harness)   |
| آداپتور صریح Codex ACP     | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | این صفحه                                |

مسیر بومی را ترجیح دهید، مگر اینکه صراحتا به رفتار ACP/acpx نیاز داشته باشید.

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

وقتی OpenClaw از backend مربوط به acpx استفاده می‌کند، این مقادیر را برای `agentId` ترجیح دهید، مگر اینکه پیکربندی acpx شما نام‌های مستعار عامل سفارشی تعریف کرده باشد.
اگر نصب محلی Cursor شما هنوز ACP را به‌صورت `agent acp` ارائه می‌کند، به‌جای تغییر پیش‌فرض داخلی، فرمان عامل `cursor` را در پیکربندی acpx خود override کنید.

استفاده مستقیم از acpx CLI می‌تواند آداپتورهای دلخواه را نیز از طریق `--agent <command>` هدف بگیرد، اما این راه گریز خام یک قابلیت acpx CLI است (نه مسیر معمول `agentId` در OpenClaw).

کنترل مدل به قابلیت آداپتور وابسته است. ارجاع‌های مدل Codex ACP پیش از startup توسط OpenClaw نرمال‌سازی می‌شوند. هارنس‌های دیگر به ACP `models` به‌همراه پشتیبانی `session/set_model` نیاز دارند؛ اگر یک هارنس نه آن قابلیت ACP و نه flag مدل startup خودش را ارائه کند، OpenClaw/acpx نمی‌تواند انتخاب مدل را اجبار کند.

## پیکربندی لازم

خط پایه ACP اصلی:

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

پیکربندی اتصال thread به channel-adapter وابسته است. نمونه برای Discord:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

اگر spawn مربوط به ACP وابسته به thread کار نمی‌کند، ابتدا flag قابلیت آداپتور را بررسی کنید:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

اتصال‌های گفت‌وگوی فعلی نیازی به ایجاد child-thread ندارند. آن‌ها به یک context گفت‌وگوی فعال و یک آداپتور کانال که اتصال‌های گفت‌وگوی ACP را ارائه می‌کند نیاز دارند.

[مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## راه‌اندازی Plugin برای backend مربوط به acpx

نصب‌های تازه Plugin runtime بسته‌بندی‌شده `acpx` را به‌طور پیش‌فرض فعال دارند، بنابراین ACP معمولا بدون مرحله نصب دستی Plugin کار می‌کند.

با این شروع کنید:

```text
/acp doctor
```

اگر `acpx` را غیرفعال کرده‌اید، از طریق `plugins.allow` / `plugins.deny` آن را رد کرده‌اید، یا می‌خواهید به یک checkout توسعه محلی جابه‌جا شوید، از مسیر صریح Plugin استفاده کنید:

```bash
openclaw plugins install acpx
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

به‌طور پیش‌فرض، Plugin بسته‌بندی‌شده `acpx`، backend جاسازی‌شده ACP را بدون spawn کردن یک عامل ACP هنگام startup مربوط به Gateway ثبت می‌کند. برای یک probe زنده صریح، `/acp doctor` را اجرا کنید. فقط زمانی `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` را تنظیم کنید که لازم دارید Gateway هنگام startup عامل پیکربندی‌شده را probe کند.

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

- `command` یک مسیر مطلق، مسیر نسبی (که از workspace مربوط به OpenClaw resolve می‌شود)، یا نام فرمان را می‌پذیرد.
- `expectedVersion: "any"` تطبیق سخت‌گیرانه نسخه را غیرفعال می‌کند.
- مسیرهای سفارشی `command` نصب خودکار محلی Plugin را غیرفعال می‌کنند.

[Plugins](/fa/tools/plugin) را ببینید.

### نصب خودکار وابستگی

وقتی OpenClaw را به‌صورت سراسری با `npm install -g openclaw` نصب می‌کنید، وابستگی‌های runtime مربوط به acpx (باینری‌های وابسته به پلتفرم) به‌طور خودکار از طریق hook مربوط به postinstall نصب می‌شوند. اگر نصب خودکار شکست بخورد، Gateway همچنان به‌صورت عادی شروع می‌شود و وابستگی گم‌شده را از طریق `openclaw acp doctor` گزارش می‌کند.

### پل MCP برای ابزارهای Plugin

به‌طور پیش‌فرض، sessionهای ACPX ابزارهای ثبت‌شده توسط Pluginهای OpenClaw را در اختیار هارنس ACP قرار **نمی‌دهند**.

اگر می‌خواهید عامل‌های ACP مانند Codex یا Claude Code بتوانند ابزارهای Plugin نصب‌شده OpenClaw مانند recall/store حافظه را فراخوانی کنند، پل اختصاصی را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

این کار چه می‌کند:

- یک سرور داخلی MCP با نام `openclaw-plugin-tools` را به bootstrap session مربوط به ACPX تزریق می‌کند.
- ابزارهای Plugin را که از قبل توسط Pluginهای نصب‌شده و فعال OpenClaw ثبت شده‌اند، ارائه می‌کند.
- این قابلیت را صریح و به‌طور پیش‌فرض خاموش نگه می‌دارد.

نکات امنیتی و اعتماد:

- این کار سطح ابزار هارنس ACP را گسترش می‌دهد.
- عامل‌های ACP فقط به ابزارهای Plugin که از قبل در Gateway فعال هستند دسترسی پیدا می‌کنند.
- با این مورد مانند همان مرز اعتمادی برخورد کنید که به آن Pluginها اجازه اجرا در خود OpenClaw را می‌دهد.
- پیش از فعال‌سازی، Pluginهای نصب‌شده را بازبینی کنید.

`mcpServers` سفارشی همچنان مثل قبل کار می‌کند. پل داخلی ابزارهای Plugin یک امکان opt-in اضافی است، نه جایگزینی برای پیکربندی عمومی سرور MCP.

### پل MCP برای ابزارهای OpenClaw

به‌طور پیش‌فرض، sessionهای ACPX همچنین ابزارهای داخلی OpenClaw را از طریق MCP ارائه **نمی‌دهند**. وقتی یک عامل ACP به ابزارهای داخلی انتخاب‌شده مانند `cron` نیاز دارد، پل جداگانه ابزارهای اصلی را فعال کنید:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

این کار چه می‌کند:

- یک سرور داخلی MCP با نام `openclaw-tools` را به bootstrap session مربوط به ACPX تزریق می‌کند.
- ابزارهای داخلی انتخاب‌شده OpenClaw را ارائه می‌کند. سرور اولیه `cron` را ارائه می‌کند.
- ارائه ابزارهای اصلی را صریح و به‌طور پیش‌فرض خاموش نگه می‌دارد.

### پیکربندی timeout مربوط به runtime

Plugin بسته‌بندی‌شده `acpx` به‌طور پیش‌فرض turnهای runtime جاسازی‌شده را روی timeout برابر با ۱۲۰ ثانیه تنظیم می‌کند. این به هارنس‌های کندتر مانند Gemini CLI زمان کافی می‌دهد تا startup و initialization مربوط به ACP را کامل کنند. اگر میزبان شما به محدودیت runtime متفاوتی نیاز دارد، آن را override کنید:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

پس از تغییر این مقدار، Gateway را restart کنید.

### پیکربندی عامل probe سلامت

وقتی `/acp doctor` یا probe اختیاری startup، backend را بررسی می‌کند، Plugin بسته‌بندی‌شده `acpx` یک عامل هارنس را probe می‌کند. اگر `acp.allowedAgents` تنظیم شده باشد، پیش‌فرض آن نخستین عامل مجاز است؛ در غیر این صورت پیش‌فرض آن `codex` است. اگر deployment شما برای health checkها به عامل ACP متفاوتی نیاز دارد، عامل probe را صریحا تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

پس از تغییر این مقدار، Gateway را restart کنید.

## پیکربندی مجوز

sessionهای ACP به‌صورت غیرتعاملی اجرا می‌شوند — هیچ TTY برای تایید یا رد promptهای مجوز file-write و shell-exec وجود ندارد. Plugin مربوط به acpx دو کلید پیکربندی ارائه می‌کند که نحوه مدیریت مجوزها را کنترل می‌کنند:

این مجوزهای هارنس ACPX جدا از تاییدهای exec در OpenClaw و جدا از flagهای bypass فروشنده backend مربوط به CLI مانند Claude CLI `--permission-mode bypassPermissions` هستند. `approve-all` در ACPX، سوییچ اضطراری سطح هارنس برای sessionهای ACP است.

### `permissionMode`

کنترل می‌کند عامل هارنس بدون prompt کدام عملیات را می‌تواند انجام دهد.

| مقدار          | رفتار                                                     |
| -------------- | --------------------------------------------------------- |
| `approve-all`  | همه نوشتن‌های فایل و فرمان‌های shell را خودکار تایید می‌کند. |
| `approve-reads` | فقط خواندن‌ها را خودکار تایید می‌کند؛ نوشتن‌ها و exec به prompt نیاز دارند. |
| `deny-all`     | همه promptهای مجوز را رد می‌کند.                          |

### `nonInteractivePermissions`

کنترل می‌کند وقتی یک prompt مجوز باید نمایش داده شود اما TTY تعاملی در دسترس نیست چه اتفاقی بیفتد (که برای sessionهای ACP همیشه همین‌طور است).

| مقدار  | رفتار                                                          |
| ------ | -------------------------------------------------------------- |
| `fail` | session را با `AcpRuntimeError` abort می‌کند. **(پیش‌فرض)**    |
| `deny` | مجوز را بی‌صدا رد می‌کند و ادامه می‌دهد (کاهش عملکرد نرم).     |

### پیکربندی

از طریق پیکربندی Plugin تنظیم کنید:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

پس از تغییر این مقادیر، Gateway را restart کنید.

<Warning>
OpenClaw به‌طور پیش‌فرض از `permissionMode=approve-reads` و `nonInteractivePermissions=fail` استفاده می‌کند. در sessionهای غیرتعاملی ACP، هر نوشتن یا exec که prompt مجوز ایجاد کند می‌تواند با `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` شکست بخورد.

اگر لازم است مجوزها را محدود کنید، `nonInteractivePermissions` را روی `deny` تنظیم کنید تا sessionها به‌جای crash کردن، به‌صورت نرم degrade شوند.
</Warning>

## مرتبط

- [عامل‌های ACP](/fa/tools/acp-agents) — نمای کلی، runbook اپراتور، مفاهیم
- [زیرعامل‌ها](/fa/tools/subagents)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
