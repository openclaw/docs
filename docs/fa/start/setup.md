---
read_when:
    - راه‌اندازی یک دستگاه جدید
    - می‌خواهید «جدیدترین + بهترین» را بدون خراب‌کردن پیکربندی شخصی‌تان داشته باشید
summary: راه‌اندازی پیشرفته و گردش‌کارهای توسعه برای OpenClaw
title: راه‌اندازی
x-i18n:
    generated_at: "2026-05-06T09:43:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
اگر برای اولین بار راه‌اندازی می‌کنید، با [شروع به کار](/fa/start/getting-started) آغاز کنید.
برای جزئیات آنبوردینگ، [آنبوردینگ (CLI)](/fa/start/wizard) را ببینید.
</Note>

## خلاصه

بر اساس اینکه هر چند وقت یک‌بار به‌روزرسانی می‌خواهید و آیا می‌خواهید Gateway را خودتان اجرا کنید، یک جریان کاری راه‌اندازی انتخاب کنید:

- **سفارشی‌سازی بیرون از مخزن می‌ماند:** پیکربندی و فضای کاری خود را در `~/.openclaw/openclaw.json` و `~/.openclaw/workspace/` نگه دارید تا به‌روزرسانی‌های مخزن به آن‌ها دست نزنند.
- **جریان کاری پایدار (پیشنهادی برای بیشتر افراد):** برنامهٔ macOS را نصب کنید و بگذارید Gateway همراه آن را اجرا کند.
- **جریان کاری لبهٔ توسعه (dev):** Gateway را خودتان از طریق `pnpm gateway:watch` اجرا کنید، سپس بگذارید برنامهٔ macOS در حالت Local متصل شود.

## پیش‌نیازها (از سورس)

- Node 24 توصیه می‌شود (Node 22 LTS، در حال حاضر `22.14+`، همچنان پشتیبانی می‌شود)
- برای checkoutهای سورس، `pnpm` لازم است. OpenClaw در حالت dev، Pluginهای همراه را از بسته‌های workspace مربوط به `extensions/*` در pnpm بارگذاری می‌کند، بنابراین اجرای `npm install` در ریشه، کل درخت سورس را آماده نمی‌کند.
- Docker (اختیاری؛ فقط برای راه‌اندازی کانتینری/e2e - [Docker](/fa/install/docker) را ببینید)

## راهبرد سفارشی‌سازی (تا به‌روزرسانی‌ها دردسرساز نشوند)

اگر «۱۰۰٪ سفارشی برای من» _و_ به‌روزرسانی آسان می‌خواهید، سفارشی‌سازی خود را اینجا نگه دارید:

- **پیکربندی:** `~/.openclaw/openclaw.json` (شبیه JSON/JSON5)
- **فضای کاری:** `~/.openclaw/workspace` (مهارت‌ها، پرامپت‌ها، حافظه‌ها؛ آن را یک مخزن git خصوصی کنید)

یک‌بار بوت‌استرپ کنید:

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

## جریان کاری پایدار (اول برنامهٔ macOS)

1. **OpenClaw.app** را نصب و اجرا کنید (نوار منو).
2. چک‌لیست آنبوردینگ/مجوزها را کامل کنید (پرامپت‌های TCC).
3. مطمئن شوید Gateway روی **Local** است و در حال اجراست (برنامه آن را مدیریت می‌کند).
4. سطح‌ها را متصل کنید (مثال: WhatsApp):

```bash
openclaw channels login
```

5. بررسی سلامت:

```bash
openclaw health
```

اگر آنبوردینگ در build شما در دسترس نیست:

- `openclaw setup` را اجرا کنید، سپس `openclaw channels login`، و بعد Gateway را دستی شروع کنید (`openclaw gateway`).

## جریان کاری لبهٔ توسعه (Gateway در ترمینال)

هدف: کار روی Gateway تایپ‌اسکریپتی، دریافت hot reload، و متصل نگه‌داشتن UI برنامهٔ macOS.

### ۰) (اختیاری) برنامهٔ macOS را هم از سورس اجرا کنید

اگر برنامهٔ macOS را هم روی لبهٔ توسعه می‌خواهید:

```bash
./scripts/restart-mac.sh
```

### ۱) Gateway توسعه را شروع کنید

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` فرایند watch مربوط به Gateway را در یک نشست tmux نام‌دار شروع یا بازشروع می‌کند و از ترمینال‌های تعاملی به‌طور خودکار attach می‌شود. shellهای غیرتعاملی detached می‌مانند و `tmux attach -t openclaw-gateway-watch-main` را چاپ می‌کنند؛ برای detached نگه‌داشتن یک اجرای تعاملی از `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` استفاده کنید، یا برای حالت watch پیش‌زمینه از `pnpm gateway:watch:raw` استفاده کنید. watcher با تغییرات مرتبط در سورس، پیکربندی، و فرادادهٔ Pluginهای همراه دوباره بارگذاری می‌شود. اگر Gateway تحت watch هنگام startup خارج شود، `gateway:watch` یک‌بار `openclaw doctor --fix --non-interactive` را اجرا می‌کند و دوباره تلاش می‌کند؛ برای غیرفعال کردن این گذر تعمیر مخصوص dev، `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` را تنظیم کنید.
`pnpm openclaw setup` مرحلهٔ یک‌بارهٔ مقداردهی اولیهٔ پیکربندی/فضای کاری محلی برای یک checkout تازه است.
`pnpm gateway:watch`، `dist/control-ui` را rebuild نمی‌کند، بنابراین پس از تغییرات `ui/` دوباره `pnpm ui:build` را اجرا کنید یا هنگام توسعهٔ Control UI از `pnpm ui:dev` استفاده کنید.

### ۲) برنامهٔ macOS را به Gateway در حال اجرای خودتان اشاره دهید

در **OpenClaw.app**:

- حالت اتصال: **Local**
  برنامه به gateway در حال اجرا روی پورت پیکربندی‌شده متصل می‌شود.

### ۳) تأیید

- وضعیت Gateway درون برنامه باید **"Using existing gateway …"** را نشان دهد
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

## نقشهٔ ذخیره‌سازی اعتبارنامه‌ها

هنگام اشکال‌زدایی auth یا تصمیم‌گیری برای مواردی که باید backup بگیرید، از این استفاده کنید:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **توکن ربات Telegram**: پیکربندی/env یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ symlinkها رد می‌شوند)
- **توکن ربات Discord**: پیکربندی/env یا SecretRef (ارائه‌دهنده‌های env/file/exec)
- **توکن‌های Slack**: پیکربندی/env (`channels.slack.*`)
- **allowlistهای pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (حساب پیش‌فرض)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (حساب‌های غیرپیش‌فرض)
- **پروفایل‌های احراز هویت مدل**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload اسرار مبتنی بر فایل (اختیاری)**: `~/.openclaw/secrets.json`
- **واردسازی OAuth قدیمی**: `~/.openclaw/credentials/oauth.json`
  جزئیات بیشتر: [امنیت](/fa/gateway/security#credential-storage-map).

## به‌روزرسانی (بدون خراب کردن راه‌اندازی شما)

- `~/.openclaw/workspace` و `~/.openclaw/` را به‌عنوان «چیزهای خودتان» نگه دارید؛ پرامپت‌ها/پیکربندی شخصی را داخل مخزن `openclaw` نگذارید.
- به‌روزرسانی سورس: `git pull` + `pnpm install` + ادامهٔ استفاده از `pnpm gateway:watch`.

## Linux (سرویس user در systemd)

نصب‌های Linux از سرویس **user** در systemd استفاده می‌کنند. به‌طور پیش‌فرض، systemd سرویس‌های user را هنگام logout/idle متوقف می‌کند، که Gateway را می‌کشد. آنبوردینگ تلاش می‌کند lingering را برای شما فعال کند (ممکن است sudo بخواهد). اگر هنوز خاموش است، اجرا کنید:

```bash
sudo loginctl enable-linger $USER
```

برای سرورهای always-on یا چندکاربره، به‌جای سرویس user، سرویس **system** را در نظر بگیرید (بدون نیاز به lingering). برای یادداشت‌های systemd، [راهنمای عملیاتی Gateway](/fa/gateway) را ببینید.

## مستندات مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway) (فلگ‌ها، نظارت، پورت‌ها)
- [پیکربندی Gateway](/fa/gateway/configuration) (schema پیکربندی + مثال‌ها)
- [Discord](/fa/channels/discord) و [Telegram](/fa/channels/telegram) (برچسب‌های پاسخ + تنظیمات replyToMode)
- [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw)
- [برنامهٔ macOS](/fa/platforms/macos) (چرخهٔ عمر gateway)
