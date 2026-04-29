---
read_when:
    - راه‌اندازی اولیه یک نمونه جدید از دستیار
    - بررسی پیامدهای ایمنی/مجوزها
summary: راهنمای سرتاسری برای اجرای OpenClaw به‌عنوان یک دستیار شخصی همراه با نکات احتیاطی ایمنی
title: راه‌اندازی دستیار شخصی
x-i18n:
    generated_at: "2026-04-29T23:37:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0614272f9a2b30e0900c55b39a8bd6a2b71b9f5d5fbf0fe00c534b91193e6a0
    source_path: start/openclaw.md
    workflow: 16
---

# ساخت یک دستیار شخصی با OpenClaw

OpenClaw یک Gateway خودمیزبان است که Discord، Google Chat، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo و موارد بیشتر را به عامل‌های هوش مصنوعی متصل می‌کند. این راهنما راه‌اندازی «دستیار شخصی» را پوشش می‌دهد: یک شماره اختصاصی WhatsApp که مانند دستیار هوش مصنوعی همیشه‌فعال شما رفتار می‌کند.

## ⚠️ اول ایمنی

شما یک عامل را در موقعیتی قرار می‌دهید که می‌تواند:

- فرمان‌ها را روی دستگاه شما اجرا کند (بسته به سیاست ابزار شما)
- فایل‌ها را در فضای کاری شما بخواند/بنویسد
- پیام‌ها را از طریق WhatsApp/Telegram/Discord/Mattermost و کانال‌های همراه دیگر ارسال کند

محافظه‌کارانه شروع کنید:

- همیشه `channels.whatsapp.allowFrom` را تنظیم کنید (هرگز روی Mac شخصی خود آن را برای همه جهان باز اجرا نکنید).
- برای دستیار از یک شماره اختصاصی WhatsApp استفاده کنید.
- Heartbeatها اکنون به‌طور پیش‌فرض هر ۳۰ دقیقه اجرا می‌شوند. تا زمانی که به راه‌اندازی اعتماد نکرده‌اید، با تنظیم `agents.defaults.heartbeat.every: "0m"` آن را غیرفعال کنید.

## پیش‌نیازها

- OpenClaw نصب و راه‌اندازی اولیه شده باشد — اگر هنوز این کار را نکرده‌اید، [شروع به کار](/fa/start/getting-started) را ببینید
- یک شماره تلفن دوم (SIM/eSIM/اعتباری) برای دستیار

## راه‌اندازی دوگوشی (توصیه‌شده)

شما این را می‌خواهید:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

اگر WhatsApp شخصی خود را به OpenClaw وصل کنید، هر پیامی که برای شما می‌آید به «ورودی عامل» تبدیل می‌شود. این به‌ندرت همان چیزی است که می‌خواهید.

## شروع سریع ۵ دقیقه‌ای

1. WhatsApp Web را جفت کنید (QR نشان داده می‌شود؛ با گوشی دستیار اسکن کنید):

```bash
openclaw channels login
```

2. Gateway را شروع کنید (در حال اجرا نگهش دارید):

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

حالا از گوشی مجازشده خود به شماره دستیار پیام بدهید.

وقتی راه‌اندازی اولیه تمام می‌شود، OpenClaw داشبورد را خودکار باز می‌کند و یک پیوند تمیز (بدون توکن) چاپ می‌کند. اگر داشبورد درخواست احراز هویت کرد، رمز مشترک پیکربندی‌شده را در تنظیمات Control UI وارد کنید. راه‌اندازی اولیه به‌طور پیش‌فرض از یک توکن استفاده می‌کند (`gateway.auth.token`)، اما اگر `gateway.auth.mode` را به `password` تغییر داده باشید، احراز هویت با گذرواژه هم کار می‌کند. برای باز کردن دوباره بعداً: `openclaw dashboard`.

## به عامل یک فضای کاری بدهید (AGENTS)

OpenClaw دستورالعمل‌های عملیاتی و «حافظه» را از دایرکتوری فضای کاری خود می‌خواند.

به‌طور پیش‌فرض، OpenClaw از `~/.openclaw/workspace` به‌عنوان فضای کاری عامل استفاده می‌کند و آن را (به‌همراه فایل‌های آغازین `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`) هنگام راه‌اندازی/اولین اجرای عامل به‌طور خودکار ایجاد می‌کند. `BOOTSTRAP.md` فقط وقتی ایجاد می‌شود که فضای کاری کاملاً جدید باشد (پس از حذف، نباید دوباره برگردد). `MEMORY.md` اختیاری است (خودکار ایجاد نمی‌شود)؛ وقتی وجود داشته باشد، برای نشست‌های عادی بارگذاری می‌شود. نشست‌های زیرفعامل فقط `AGENTS.md` و `TOOLS.md` را تزریق می‌کنند.

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

اگر از قبل فایل‌های فضای کاری خودتان را از یک مخزن ارائه می‌کنید، می‌توانید ایجاد فایل‌های bootstrap را کاملاً غیرفعال کنید:

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

OpenClaw به‌طور پیش‌فرض یک راه‌اندازی خوب برای دستیار دارد، اما معمولاً می‌خواهید این موارد را تنظیم کنید:

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
- فراداده نشست (مصرف توکن، آخرین مسیر و غیره): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (قدیمی: `~/.openclaw/sessions/sessions.json`)
- `/new` یا `/reset` یک نشست تازه برای آن گفت‌وگو شروع می‌کند (از طریق `resetTriggers` قابل پیکربندی است). اگر به‌تنهایی فرستاده شود، OpenClaw بدون فراخوانی مدل، بازنشانی را تأیید می‌کند.
- `/compact [instructions]` زمینه نشست را فشرده می‌کند و بودجه زمینه باقی‌مانده را گزارش می‌دهد.

## Heartbeatها (حالت پیش‌دستانه)

به‌طور پیش‌فرض، OpenClaw هر ۳۰ دقیقه یک Heartbeat را با این پرامپت اجرا می‌کند:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
برای غیرفعال کردن، `agents.defaults.heartbeat.every: "0m"` را تنظیم کنید.

- اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خطوط خالی و سرصفحه‌های markdown مثل `# Heading`)، OpenClaw برای صرفه‌جویی در فراخوانی‌های API اجرای Heartbeat را رد می‌کند.
- اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.
- اگر عامل با `HEARTBEAT_OK` پاسخ دهد (اختیاراً با padding کوتاه؛ `agents.defaults.heartbeat.ackMaxChars` را ببینید)، OpenClaw ارسال خروجی برای آن Heartbeat را سرکوب می‌کند.
- به‌طور پیش‌فرض، تحویل Heartbeat به هدف‌های سبک پیام مستقیم `user:<id>` مجاز است. برای سرکوب تحویل به هدف مستقیم در حالی که اجراهای Heartbeat فعال می‌مانند، `agents.defaults.heartbeat.directPolicy: "block"` را تنظیم کنید.
- Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند — بازه‌های کوتاه‌تر توکن بیشتری مصرف می‌کنند.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## رسانه ورودی و خروجی

پیوست‌های ورودی (تصویر/صدا/سند) می‌توانند از طریق قالب‌ها در اختیار فرمان شما قرار بگیرند:

- `{{MediaPath}}` (مسیر فایل موقت محلی)
- `{{MediaUrl}}` (شبه‌URL)
- `{{Transcript}}` (اگر رونویسی صدا فعال باشد)

پیوست‌های خروجی از عامل: `MEDIA:<path-or-url>` را در خط جداگانه خودش قرار دهید (بدون فاصله). مثال:

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw این‌ها را استخراج می‌کند و همراه متن به‌عنوان رسانه ارسال می‌کند.

رفتار مسیر محلی از همان مدل اعتماد خواندن فایلِ عامل پیروی می‌کند:

- اگر `tools.fs.workspaceOnly` برابر `true` باشد، مسیرهای محلی خروجی `MEDIA:` به ریشه موقت OpenClaw، کش رسانه، مسیرهای فضای کاری عامل و فایل‌های تولیدشده در sandbox محدود می‌مانند.
- اگر `tools.fs.workspaceOnly` برابر `false` باشد، خروجی `MEDIA:` می‌تواند از فایل‌های محلی میزبان استفاده کند که عامل از قبل اجازه خواندنشان را دارد.
- ارسال‌های محلی میزبان همچنان فقط رسانه و انواع سند امن را مجاز می‌دانند (تصاویر، صدا، ویدئو، PDF و اسناد Office). فایل‌های متن ساده و فایل‌های شبیه راز به‌عنوان رسانه قابل ارسال در نظر گرفته نمی‌شوند.

این یعنی تصاویر/فایل‌های تولیدشده خارج از فضای کاری اکنون وقتی سیاست fs شما از قبل آن خواندن‌ها را مجاز می‌داند می‌توانند ارسال شوند، بدون اینکه راه نشت پیوست‌های متنی دلخواه میزبان دوباره باز شود.

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
- همراه نوار منوی macOS: [برنامه OpenClaw برای macOS](/fa/platforms/macos)
- برنامه Node برای iOS: [برنامه iOS](/fa/platforms/ios)
- برنامه Node برای Android: [برنامه Android](/fa/platforms/android)
- وضعیت Windows: [Windows (WSL2)](/fa/platforms/windows)
- وضعیت Linux: [برنامه Linux](/fa/platforms/linux)
- امنیت: [امنیت](/fa/gateway/security)

## مرتبط

- [شروع به کار](/fa/start/getting-started)
- [راه‌اندازی](/fa/start/setup)
- [نمای کلی کانال‌ها](/fa/channels)
