---
read_when:
    - راه‌اندازی یک دستگاه جدید
    - می‌خواهید «جدیدترین و بهترین» را داشته باشید، بدون اینکه پیکربندی شخصی‌تان به‌هم بخورد
summary: راه‌اندازی پیشرفته و گردش‌کارهای توسعه برای OpenClaw
title: راه‌اندازی
x-i18n:
    generated_at: "2026-05-03T21:41:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
اگر برای نخستین بار راه‌اندازی می‌کنید، با [شروع به کار](/fa/start/getting-started) آغاز کنید.
برای جزئیات آماده‌سازی اولیه، [آماده‌سازی اولیه (CLI)](/fa/start/wizard) را ببینید.
</Note>

## خلاصه

بر اساس اینکه چند وقت یک‌بار به‌روزرسانی می‌خواهید و اینکه آیا می‌خواهید Gateway را خودتان اجرا کنید یا نه، یک جریان کار راه‌اندازی انتخاب کنید:

- **شخصی‌سازی بیرون از مخزن قرار می‌گیرد:** پیکربندی و فضای کاری خود را در `~/.openclaw/openclaw.json` و `~/.openclaw/workspace/` نگه دارید تا به‌روزرسانی‌های مخزن به آن‌ها دست نزنند.
- **جریان کار پایدار (پیشنهادی برای بیشتر کاربران):** برنامه macOS را نصب کنید و اجازه دهید Gateway همراه آن را اجرا کند.
- **جریان کار لبه توسعه (dev):** Gateway را خودتان با `pnpm gateway:watch` اجرا کنید، سپس اجازه دهید برنامه macOS در حالت محلی وصل شود.

## پیش‌نیازها (از کد منبع)

- Node 24 توصیه می‌شود (Node 22 LTS، در حال حاضر `22.14+`، همچنان پشتیبانی می‌شود)
- برای checkoutهای کد منبع، `pnpm` لازم است. OpenClaw در حالت dev، Pluginهای همراه را از بسته‌های workspace مربوط به `extensions/*` در pnpm بارگذاری می‌کند، بنابراین اجرای `npm install` در ریشه، کل درخت کد منبع را آماده نمی‌کند.
- Docker (اختیاری؛ فقط برای راه‌اندازی/e2e کانتینری‌شده — [Docker](/fa/install/docker) را ببینید)

## راهبرد شخصی‌سازی (تا به‌روزرسانی‌ها آسیب نزنند)

اگر می‌خواهید «۱۰۰٪ مطابق نیاز من» _و_ به‌روزرسانی آسان داشته باشید، سفارشی‌سازی خود را اینجا نگه دارید:

- **پیکربندی:** `~/.openclaw/openclaw.json` (شبیه JSON/JSON5)
- **فضای کاری:** `~/.openclaw/workspace` (Skills، پرامپت‌ها، حافظه‌ها؛ آن را به یک مخزن git خصوصی تبدیل کنید)

یک‌بار bootstrap کنید:

```bash
openclaw setup
```

از داخل این مخزن، ورودی CLI محلی را استفاده کنید:

```bash
openclaw setup
```

اگر هنوز نصب سراسری ندارید، آن را با `pnpm openclaw setup` اجرا کنید.

## اجرای Gateway از این مخزن

پس از `pnpm build`، می‌توانید CLI بسته‌بندی‌شده را مستقیم اجرا کنید:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## جریان کار پایدار (ابتدا برنامه macOS)

1. **OpenClaw.app** را نصب و اجرا کنید (نوار منو).
2. چک‌لیست آماده‌سازی اولیه/مجوزها را کامل کنید (درخواست‌های TCC).
3. مطمئن شوید Gateway روی **محلی** است و در حال اجراست (برنامه آن را مدیریت می‌کند).
4. سطح‌ها را متصل کنید (مثال: WhatsApp):

```bash
openclaw channels login
```

5. بررسی سلامت:

```bash
openclaw health
```

اگر آماده‌سازی اولیه در build شما در دسترس نیست:

- `openclaw setup` را اجرا کنید، سپس `openclaw channels login`، سپس Gateway را دستی شروع کنید (`openclaw gateway`).

## جریان کار لبه توسعه (Gateway در ترمینال)

هدف: کار روی Gateway مبتنی بر TypeScript، دریافت hot reload، و متصل نگه داشتن رابط کاربری برنامه macOS.

### 0) (اختیاری) برنامه macOS را هم از کد منبع اجرا کنید

اگر می‌خواهید برنامه macOS هم روی لبه توسعه باشد:

```bash
./scripts/restart-mac.sh
```

### 1) Gateway توسعه را شروع کنید

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` فرایند watch مربوط به Gateway را در یک نشست tmux نام‌گذاری‌شده شروع یا بازشروع می‌کند و از ترمینال‌های تعاملی به‌صورت خودکار attach می‌شود. shellهای غیرتعاملی detached می‌مانند و `tmux attach -t openclaw-gateway-watch-main` را چاپ می‌کنند؛ برای detached نگه داشتن یک اجرای تعاملی از `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` استفاده کنید، یا برای حالت watch در foreground از `pnpm gateway:watch:raw` استفاده کنید. watcher هنگام تغییرات مرتبط در کد منبع، پیکربندی، و فراداده Pluginهای همراه reload می‌کند. اگر Gateway تحت watch هنگام راه‌اندازی خارج شود، `gateway:watch` یک‌بار `openclaw doctor --fix --non-interactive` را اجرا می‌کند و دوباره تلاش می‌کند؛ برای غیرفعال کردن این گذر تعمیر فقط مخصوص dev، `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` را تنظیم کنید.
`pnpm openclaw setup` مرحله یک‌باره مقداردهی اولیه پیکربندی/فضای کاری محلی برای یک checkout تازه است.
`pnpm gateway:watch`، `dist/control-ui` را دوباره build نمی‌کند، بنابراین پس از تغییرات `ui/` دوباره `pnpm ui:build` را اجرا کنید یا هنگام توسعه Control UI از `pnpm ui:dev` استفاده کنید.

### 2) برنامه macOS را به Gateway در حال اجرای خود متصل کنید

در **OpenClaw.app**:

- حالت اتصال: **محلی**
  برنامه به gateway در حال اجرا روی پورت پیکربندی‌شده وصل می‌شود.

### 3) تأیید

- وضعیت درون‌برنامه‌ای Gateway باید **«در حال استفاده از gateway موجود …»** را نشان دهد
- یا از طریق CLI:

```bash
openclaw health
```

### خطاهای رایج

- **پورت اشتباه:** مقدار پیش‌فرض Gateway WS برابر `ws://127.0.0.1:18789` است؛ برنامه و CLI را روی همان پورت نگه دارید.
- **محل نگهداری وضعیت:**
  - وضعیت کانال/ارائه‌دهنده: `~/.openclaw/credentials/`
  - پروفایل‌های احراز هویت مدل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - نشست‌ها: `~/.openclaw/agents/<agentId>/sessions/`
  - لاگ‌ها: `/tmp/openclaw/`

## نقشه ذخیره‌سازی اعتبارنامه‌ها

هنگام اشکال‌زدایی auth یا تصمیم‌گیری درباره اینکه چه چیزی را پشتیبان بگیرید، از این استفاده کنید:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **توکن ربات Telegram**: پیکربندی/env یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ symlinkها رد می‌شوند)
- **توکن ربات Discord**: پیکربندی/env یا SecretRef (ارائه‌دهنده‌های env/file/exec)
- **توکن‌های Slack**: پیکربندی/env (`channels.slack.*`)
- **allowlistهای pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (حساب پیش‌فرض)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (حساب‌های غیرپیش‌فرض)
- **پروفایل‌های احراز هویت مدل**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload اسرار مبتنی بر فایل (اختیاری)**: `~/.openclaw/secrets.json`
- **درون‌ریزی OAuth قدیمی**: `~/.openclaw/credentials/oauth.json`
  جزئیات بیشتر: [امنیت](/fa/gateway/security#credential-storage-map).

## به‌روزرسانی (بدون خراب کردن راه‌اندازی شما)

- `~/.openclaw/workspace` و `~/.openclaw/` را به‌عنوان «چیزهای خودتان» نگه دارید؛ پرامپت‌ها/پیکربندی شخصی را داخل مخزن `openclaw` نگذارید.
- به‌روزرسانی کد منبع: `git pull` + `pnpm install` + ادامه استفاده از `pnpm gateway:watch`.

## Linux (سرویس کاربری systemd)

نصب‌های Linux از سرویس systemd **کاربری** استفاده می‌کنند. به‌صورت پیش‌فرض، systemd سرویس‌های کاربری را هنگام logout/idle متوقف می‌کند، که باعث توقف Gateway می‌شود. آماده‌سازی اولیه تلاش می‌کند lingering را برای شما فعال کند (ممکن است sudo بخواهد). اگر هنوز خاموش است، اجرا کنید:

```bash
sudo loginctl enable-linger $USER
```

برای سرورهای همیشه‌روشن یا چندکاربره، به‌جای سرویس کاربری، یک سرویس **سیستمی** را در نظر بگیرید (نیازی به lingering ندارد). برای نکات systemd، [runbook مربوط به Gateway](/fa/gateway) را ببینید.

## مستندات مرتبط

- [runbook مربوط به Gateway](/fa/gateway) (flagها، supervision، پورت‌ها)
- [پیکربندی Gateway](/fa/gateway/configuration) (schema پیکربندی + مثال‌ها)
- [Discord](/fa/channels/discord) و [Telegram](/fa/channels/telegram) (تنظیمات reply tags + replyToMode)
- [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw)
- [برنامه macOS](/fa/platforms/macos) (چرخه عمر gateway)
