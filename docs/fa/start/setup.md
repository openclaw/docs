---
read_when:
    - راه‌اندازی یک دستگاه جدید
    - شما «جدیدترین و بهترین» را می‌خواهید، بدون اینکه راه‌اندازی شخصی‌تان خراب شود
summary: راه‌اندازی پیشرفته و گردش‌کارهای توسعه برای OpenClaw
title: راه‌اندازی
x-i18n:
    generated_at: "2026-06-27T18:54:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
اگر برای اولین بار راه‌اندازی می‌کنید، با [شروع به کار](/fa/start/getting-started) شروع کنید.
برای جزئیات آماده‌سازی اولیه، [آماده‌سازی اولیه (CLI)](/fa/start/wizard) را ببینید.
</Note>

## خلاصه

بر اساس اینکه هر چند وقت یک‌بار به‌روزرسانی می‌خواهید و اینکه آیا می‌خواهید خودتان Gateway را اجرا کنید، یک گردش‌کار راه‌اندازی انتخاب کنید:

- **سفارشی‌سازی بیرون از مخزن زندگی می‌کند:** پیکربندی و فضای کاری خود را در `~/.openclaw/openclaw.json` و `~/.openclaw/workspace/` نگه دارید تا به‌روزرسانی‌های مخزن به آن‌ها دست نزنند.
- **گردش‌کار پایدار (پیشنهادی برای بیشتر کاربران):** برنامه macOS را نصب کنید و بگذارید Gateway همراه آن را اجرا کند.
- **گردش‌کار لبه توسعه (dev):** خودتان Gateway را با `pnpm gateway:watch` اجرا کنید، سپس بگذارید برنامه macOS در حالت محلی به آن متصل شود.

## پیش‌نیازها (از منبع)

- Node 24 پیشنهاد می‌شود (Node 22 LTS، در حال حاضر `22.19+`، همچنان پشتیبانی می‌شود)
- برای checkoutهای منبع، `pnpm` لازم است. OpenClaw در حالت توسعه Pluginهای همراه را از بسته‌های workspace مربوط به `extensions/*` در pnpm بارگذاری می‌کند، بنابراین اجرای `npm install` در ریشه، درخت منبع کامل را آماده نمی‌کند.
- Docker (اختیاری؛ فقط برای راه‌اندازی کانتینری/e2e - [Docker](/fa/install/docker) را ببینید)

## راهبرد سفارشی‌سازی (تا به‌روزرسانی‌ها آسیب نزنند)

اگر «۱۰۰٪ متناسب با من» _و_ به‌روزرسانی آسان می‌خواهید، سفارشی‌سازی خود را در اینجا نگه دارید:

- **پیکربندی:** `~/.openclaw/openclaw.json` (شبیه JSON/JSON5)
- **فضای کاری:** `~/.openclaw/workspace` (skills، promptها، memoryها؛ آن را به یک مخزن git خصوصی تبدیل کنید)

یک‌بار راه‌اندازی اولیه کنید:

```bash
openclaw setup
```

از داخل این مخزن، ورودی CLI محلی را به کار ببرید:

```bash
openclaw setup
```

اگر هنوز نصب سراسری ندارید، آن را با `pnpm openclaw setup` اجرا کنید.

## اجرای Gateway از این مخزن

پس از `pnpm build`، می‌توانید CLI بسته‌بندی‌شده را مستقیم اجرا کنید:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## گردش‌کار پایدار (اول برنامه macOS)

1. **OpenClaw.app** را نصب و اجرا کنید (نوار منو).
2. چک‌لیست آماده‌سازی اولیه/مجوزها را کامل کنید (درخواست‌های TCC).
3. مطمئن شوید Gateway روی **محلی** است و اجرا می‌شود (برنامه آن را مدیریت می‌کند).
4. سطح‌ها را وصل کنید (نمونه: WhatsApp):

```bash
openclaw channels login
```

5. بررسی سلامت:

```bash
openclaw health
```

اگر آماده‌سازی اولیه در build شما در دسترس نیست:

- `openclaw setup` را اجرا کنید، سپس `openclaw channels login`، و بعد Gateway را دستی شروع کنید (`openclaw gateway`).

## گردش‌کار لبه توسعه (Gateway در ترمینال)

هدف: کار روی Gateway TypeScript، دریافت بارگذاری مجدد سریع، و متصل نگه داشتن رابط کاربری برنامه macOS.

### 0) (اختیاری) برنامه macOS را هم از منبع اجرا کنید

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

`gateway:watch` فرایند watch مربوط به Gateway را در یک نشست tmux نام‌گذاری‌شده شروع یا بازراه‌اندازی می‌کند و از ترمینال‌های تعاملی به‌صورت خودکار متصل می‌شود. Shellهای غیرتعاملی جدا می‌مانند و `tmux attach -t openclaw-gateway-watch-main` را چاپ می‌کنند؛ برای جدا نگه داشتن اجرای تعاملی از `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` استفاده کنید، یا برای حالت watch در پیش‌زمینه از `pnpm gateway:watch:raw` استفاده کنید. watcher روی تغییرات مرتبط منبع، پیکربندی، و فراداده Pluginهای همراه دوباره بارگذاری می‌شود. اگر Gateway تحت watch هنگام startup خارج شود، `gateway:watch` یک‌بار `openclaw doctor --fix --non-interactive` را اجرا می‌کند و دوباره تلاش می‌کند؛ برای غیرفعال کردن این مرحله تعمیر مخصوص توسعه، `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` را تنظیم کنید.
`pnpm openclaw setup` مرحله یک‌باره مقداردهی اولیه پیکربندی/فضای کاری محلی برای یک checkout تازه است.
`pnpm gateway:watch`، `dist/control-ui` را دوباره build نمی‌کند، پس پس از تغییرات `ui/` دوباره `pnpm ui:build` را اجرا کنید یا هنگام توسعه Control UI از `pnpm ui:dev` استفاده کنید.

### 2) برنامه macOS را به Gateway در حال اجرای خودتان وصل کنید

در **OpenClaw.app**:

- حالت اتصال: **محلی**
  برنامه به gateway در حال اجرا روی پورت پیکربندی‌شده متصل می‌شود.

### 3) تأیید

- وضعیت Gateway درون برنامه باید **"استفاده از gateway موجود …"** را نشان دهد
- یا از طریق CLI:

```bash
openclaw health
```

### خطاهای رایج

- **پورت اشتباه:** مقدار پیش‌فرض Gateway WS برابر `ws://127.0.0.1:18789` است؛ برنامه و CLI را روی یک پورت نگه دارید.
- **محل نگهداری state:**
  - state کانال/ارائه‌دهنده: `~/.openclaw/credentials/`
  - پروفایل‌های احراز هویت مدل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - نشست‌ها: `~/.openclaw/agents/<agentId>/sessions/`
  - لاگ‌ها: `/tmp/openclaw/`

## نقشه ذخیره‌سازی اعتبارنامه

برای اشکال‌زدایی احراز هویت یا تصمیم‌گیری درباره پشتیبان‌گیری از این بخش استفاده کنید:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **توکن ربات Telegram**: پیکربندی/env یا `channels.telegram.tokenFile` (فقط فایل عادی؛ symlinkها رد می‌شوند)
- **توکن ربات Discord**: پیکربندی/env یا SecretRef (ارائه‌دهنده‌های env/file/exec)
- **توکن‌های Slack**: پیکربندی/env (`channels.slack.*`)
- **فهرست‌های مجاز pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (حساب پیش‌فرض)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (حساب‌های غیرپیش‌فرض)
- **پروفایل‌های احراز هویت مدل**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload اسرار مبتنی بر فایل (اختیاری)**: `~/.openclaw/secrets.json`
- **واردسازی OAuth قدیمی**: `~/.openclaw/credentials/oauth.json`
  جزئیات بیشتر: [امنیت](/fa/gateway/security#credential-storage-map).

## به‌روزرسانی (بدون خراب کردن راه‌اندازی شما)

- `~/.openclaw/workspace` و `~/.openclaw/` را به‌عنوان «چیزهای خودتان» نگه دارید؛ promptها/پیکربندی شخصی را داخل مخزن `openclaw` نگذارید.
- به‌روزرسانی منبع: `git pull` + `pnpm install` + ادامه استفاده از `pnpm gateway:watch`.

## Linux (سرویس کاربر systemd)

نصب‌های Linux از سرویس **کاربر** systemd استفاده می‌کنند. به‌صورت پیش‌فرض، systemd سرویس‌های کاربر را هنگام خروج/بیکاری متوقف می‌کند، که Gateway را می‌کشد. آماده‌سازی اولیه تلاش می‌کند lingering را برای شما فعال کند (ممکن است sudo بخواهد). اگر هنوز خاموش است، اجرا کنید:

```bash
sudo loginctl enable-linger $USER
```

برای سرورهای همیشه‌روشن یا چندکاربره، به‌جای سرویس کاربر، یک سرویس **سیستم** را در نظر بگیرید (نیازی به lingering نیست). برای نکته‌های systemd، [راهنمای عملیاتی Gateway](/fa/gateway) را ببینید.

## مستندات مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway) (flagها، نظارت، پورت‌ها)
- [پیکربندی Gateway](/fa/gateway/configuration) (schema پیکربندی + نمونه‌ها)
- [Discord](/fa/channels/discord) و [Telegram](/fa/channels/telegram) (تگ‌های پاسخ + تنظیمات replyToMode)
- [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw)
- [برنامه macOS](/fa/platforms/macos) (چرخه حیات gateway)
