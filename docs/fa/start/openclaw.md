---
read_when:
    - آماده‌سازی اولیهٔ یک نمونهٔ جدید دستیار
    - بررسی پیامدهای ایمنی/مجوزها
summary: راهنمای سرتاسری برای اجرای OpenClaw به‌عنوان دستیار شخصی همراه با هشدارهای ایمنی
title: راه‌اندازی دستیار شخصی
x-i18n:
    generated_at: "2026-05-02T22:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f6087d0756c98741166135df8b915eb5a0803b23e68e486d2d25ec98d4dca79
    source_path: start/openclaw.md
    workflow: 16
---

# ساخت یک دستیار شخصی با OpenClaw

OpenClaw یک Gateway خودمیزبان است که Discord، Google Chat، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo و موارد بیشتر را به عامل‌های هوش مصنوعی وصل می‌کند. این راهنما راه‌اندازی «دستیار شخصی» را پوشش می‌دهد: یک شماره اختصاصی WhatsApp که مثل دستیار هوش مصنوعی همیشه‌روشن شما رفتار می‌کند.

## ⚠️ اول ایمنی

شما دارید یک عامل را در موقعیتی قرار می‌دهید که بتواند:

- فرمان‌ها را روی ماشین شما اجرا کند (بسته به سیاست ابزار شما)
- فایل‌ها را در فضای کاری شما بخواند/بنویسد
- از طریق WhatsApp/Telegram/Discord/Mattermost و کانال‌های بسته‌بندی‌شده دیگر پیام ارسال کند

محافظه‌کارانه شروع کنید:

- همیشه `channels.whatsapp.allowFrom` را تنظیم کنید (هرگز روی Mac شخصی خودتان آن را برای همه دنیا باز اجرا نکنید).
- برای دستیار از یک شماره اختصاصی WhatsApp استفاده کنید.
- Heartbeatها اکنون به‌طور پیش‌فرض هر ۳۰ دقیقه اجرا می‌شوند. تا وقتی به راه‌اندازی اعتماد نکرده‌اید، با تنظیم `agents.defaults.heartbeat.every: "0m"` آن را غیرفعال کنید.

## پیش‌نیازها

- OpenClaw نصب و راه‌اندازی اولیه شده باشد — اگر هنوز این کار را نکرده‌اید، [شروع به کار](/fa/start/getting-started) را ببینید
- یک شماره تلفن دوم (SIM/eSIM/اعتباری) برای دستیار

## راه‌اندازی دو تلفنی (پیشنهادی)

شما این را می‌خواهید:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

اگر WhatsApp شخصی خودتان را به OpenClaw لینک کنید، هر پیامی که برای شما می‌آید به «ورودی عامل» تبدیل می‌شود. این معمولاً چیزی نیست که می‌خواهید.

## شروع سریع ۵ دقیقه‌ای

1. WhatsApp Web را جفت کنید (QR نشان داده می‌شود؛ با تلفن دستیار اسکن کنید):

```bash
openclaw channels login
```

2. Gateway را شروع کنید (بگذارید در حال اجرا بماند):

```bash
openclaw gateway --port 18789
```

3. یک پیکربندی حداقلی در `~/.openclaw/openclaw.json` قرار دهید:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

حالا از تلفن مجازشده خودتان به شماره دستیار پیام بدهید.

وقتی راه‌اندازی اولیه تمام شود، OpenClaw داشبورد را به‌طور خودکار باز می‌کند و یک لینک تمیز (بدون توکن) چاپ می‌کند. اگر داشبورد احراز هویت خواست، راز مشترک پیکربندی‌شده را در تنظیمات Control UI جای‌گذاری کنید. راه‌اندازی اولیه به‌طور پیش‌فرض از توکن استفاده می‌کند (`gateway.auth.token`)، اما اگر `gateway.auth.mode` را به `password` تغییر داده باشید، احراز هویت با رمز عبور هم کار می‌کند. برای باز کردن دوباره در آینده: `openclaw dashboard`.

## به عامل یک فضای کاری بدهید (AGENTS)

OpenClaw دستورالعمل‌های عملیاتی و «حافظه» را از دایرکتوری فضای کاری خودش می‌خواند.

به‌طور پیش‌فرض، OpenClaw از `~/.openclaw/workspace` به‌عنوان فضای کاری عامل استفاده می‌کند و آن را (به‌همراه `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md` آغازین) به‌صورت خودکار هنگام راه‌اندازی/اولین اجرای عامل ایجاد می‌کند. `BOOTSTRAP.md` فقط وقتی ایجاد می‌شود که فضای کاری کاملاً جدید باشد (بعد از حذفش نباید برگردد). `MEMORY.md` اختیاری است (خودکار ایجاد نمی‌شود)؛ وقتی وجود داشته باشد، برای نشست‌های عادی بارگذاری می‌شود. نشست‌های زیرعامل فقط `AGENTS.md` و `TOOLS.md` را تزریق می‌کنند.

<Tip>
با این پوشه مثل حافظه OpenClaw رفتار کنید و آن را به یک مخزن git تبدیل کنید (ترجیحاً خصوصی) تا `AGENTS.md` و فایل‌های حافظه شما پشتیبان‌گیری شوند. اگر git نصب باشد، فضاهای کاری کاملاً جدید به‌طور خودکار مقداردهی اولیه می‌شوند.
</Tip>

```bash
openclaw setup
```

چیدمان کامل فضای کاری + راهنمای پشتیبان‌گیری: [فضای کاری عامل](/fa/concepts/agent-workspace)
گردش‌کار حافظه: [حافظه](/fa/concepts/memory)

اختیاری: با `agents.defaults.workspace` یک فضای کاری متفاوت انتخاب کنید (از `~` پشتیبانی می‌کند).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

اگر از قبل فایل‌های فضای کاری خودتان را از یک مخزن ارائه می‌کنید، می‌توانید ایجاد فایل‌های bootstrap را به‌طور کامل غیرفعال کنید:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## پیکربندی‌ای که آن را به «یک دستیار» تبدیل می‌کند

پیش‌فرض‌های OpenClaw برای راه‌اندازی یک دستیار خوب هستند، اما معمولاً می‌خواهید این موارد را تنظیم کنید:

- شخصیت/دستورالعمل‌ها در [`SOUL.md`](/fa/concepts/soul)
- پیش‌فرض‌های فکر کردن (در صورت تمایل)
- Heartbeatها (وقتی به آن اعتماد کردید)

مثال:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## نشست‌ها و حافظه

- فایل‌های نشست: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- فراداده نشست (مصرف توکن، آخرین مسیر، و غیره): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (قدیمی: `~/.openclaw/sessions/sessions.json`)
- `/new` یا `/reset` برای آن چت یک نشست تازه شروع می‌کند (از طریق `resetTriggers` قابل پیکربندی است). اگر به‌تنهایی ارسال شود، OpenClaw بدون فراخوانی مدل، بازنشانی را تأیید می‌کند.
- `/compact [instructions]` زمینه نشست را فشرده می‌کند و بودجه زمینه باقی‌مانده را گزارش می‌دهد.

## Heartbeatها (حالت پیش‌دستانه)

به‌طور پیش‌فرض، OpenClaw هر ۳۰ دقیقه یک Heartbeat را با این پرامپت اجرا می‌کند:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
برای غیرفعال کردن، `agents.defaults.heartbeat.every: "0m"` را تنظیم کنید.

- اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خطوط خالی و سرآیندهای Markdown مثل `# Heading`)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند.
- اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کاری انجام دهد.
- اگر عامل با `HEARTBEAT_OK` پاسخ دهد (اختیاراً با padding کوتاه؛ `agents.defaults.heartbeat.ackMaxChars` را ببینید)، OpenClaw تحویل خروجی برای آن Heartbeat را سرکوب می‌کند.
- به‌طور پیش‌فرض، تحویل Heartbeat به مقصدهای سبک پیام مستقیم `user:<id>` مجاز است. برای سرکوب تحویل به مقصد مستقیم در حالی که اجرای Heartbeat فعال می‌ماند، `agents.defaults.heartbeat.directPolicy: "block"` را تنظیم کنید.
- Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند — فاصله‌های کوتاه‌تر توکن بیشتری مصرف می‌کنند.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## رسانه ورودی و خروجی

پیوست‌های ورودی (تصاویر/صدا/سندها) می‌توانند از طریق قالب‌ها به فرمان شما ارائه شوند:

- `{{MediaPath}}` (مسیر فایل موقت محلی)
- `{{MediaUrl}}` (شبه-URL)
- `{{Transcript}}` (اگر رونویسی صدا فعال باشد)

پیوست‌های خروجی از عامل: `MEDIA:<path-or-url>` را در خط جداگانه خودش قرار دهید (بدون فاصله). مثال:

```
در اینجا اسکرین‌شات است.
MEDIA:https://example.com/screenshot.png
```

OpenClaw این‌ها را استخراج می‌کند و همراه متن به‌عنوان رسانه ارسال می‌کند.

رفتار مسیر محلی از همان مدل اعتماد خواندن فایل پیروی می‌کند که عامل استفاده می‌کند:

- اگر `tools.fs.workspaceOnly` برابر `true` باشد، مسیرهای محلی خروجی `MEDIA:` محدود به ریشه موقت OpenClaw، کش رسانه، مسیرهای فضای کاری عامل، و فایل‌های تولیدشده توسط sandbox می‌مانند.
- اگر `tools.fs.workspaceOnly` برابر `false` باشد، خروجی `MEDIA:` می‌تواند از فایل‌های محلی میزبان استفاده کند که عامل از قبل اجازه خواندن آن‌ها را دارد.
- مسیرهای محلی می‌توانند مطلق، نسبی به فضای کاری، یا نسبی به خانه با `~/` باشند.
- ارسال‌های محلی میزبان همچنان فقط رسانه و انواع سند ایمن را مجاز می‌دانند (تصاویر، صدا، ویدیو، PDF، و سندهای Office). متن ساده و فایل‌های شبیه راز به‌عنوان رسانه قابل ارسال در نظر گرفته نمی‌شوند.

یعنی تصاویر/فایل‌های تولیدشده خارج از فضای کاری حالا وقتی سیاست fs شما از قبل آن خواندن‌ها را مجاز می‌داند، می‌توانند ارسال شوند، بدون اینکه راه خروج دلخواه پیوست‌های متن میزبان دوباره باز شود.

## چک‌لیست عملیات

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

لاگ‌ها زیر `/tmp/openclaw/` قرار دارند (پیش‌فرض: `openclaw-YYYY-MM-DD.log`).

## گام‌های بعدی

- WebChat: [WebChat](/fa/web/webchat)
- عملیات Gateway: [راهنمای عملیاتی Gateway](/fa/gateway)
- Cron + بیدارباش‌ها: [کارهای Cron](/fa/automation/cron-jobs)
- همراه نوار منوی macOS: [برنامه macOS OpenClaw](/fa/platforms/macos)
- برنامه گره iOS: [برنامه iOS](/fa/platforms/ios)
- برنامه گره Android: [برنامه Android](/fa/platforms/android)
- وضعیت Windows: [Windows (WSL2)](/fa/platforms/windows)
- وضعیت Linux: [برنامه Linux](/fa/platforms/linux)
- امنیت: [امنیت](/fa/gateway/security)

## مرتبط

- [شروع به کار](/fa/start/getting-started)
- [راه‌اندازی](/fa/start/setup)
- [نمای کلی کانال‌ها](/fa/channels)
