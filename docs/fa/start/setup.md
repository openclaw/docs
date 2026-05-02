---
read_when:
    - راه‌اندازی یک دستگاه جدید
    - می‌خواهید «آخرین و بهترین» را داشته باشید، بدون اینکه تنظیمات شخصی‌تان خراب شود
summary: راه‌اندازی پیشرفته و گردش‌کارهای توسعه برای OpenClaw
title: راه‌اندازی
x-i18n:
    generated_at: "2026-05-02T12:03:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
اگر برای نخستین بار راه‌اندازی می‌کنید، با [شروع به کار](/fa/start/getting-started) آغاز کنید.
برای جزئیات آماده‌سازی اولیه، [آماده‌سازی اولیه (CLI)](/fa/start/wizard) را ببینید.
</Note>

## خلاصه

یک روند راه‌اندازی را بر اساس اینکه هر چند وقت یک‌بار به‌روزرسانی می‌خواهید و اینکه آیا می‌خواهید Gateway را خودتان اجرا کنید انتخاب کنید:

- **سفارشی‌سازی بیرون از مخزن قرار دارد:** پیکربندی و فضای کاری خود را در `~/.openclaw/openclaw.json` و `~/.openclaw/workspace/` نگه دارید تا به‌روزرسانی‌های مخزن آن‌ها را تغییر ندهند.
- **روند پایدار (پیشنهادی برای بیشتر افراد):** برنامه macOS را نصب کنید و بگذارید Gateway همراه‌شده را اجرا کند.
- **روند لبه فناوری (توسعه):** Gateway را خودتان با `pnpm gateway:watch` اجرا کنید، سپس بگذارید برنامه macOS در حالت محلی به آن متصل شود.

## پیش‌نیازها (از سورس)

- Node 24 توصیه می‌شود (Node 22 LTS، در حال حاضر `22.14+`، همچنان پشتیبانی می‌شود)
- `pnpm` برای checkoutهای سورس لازم است. OpenClaw در حالت توسعه Pluginهای همراه‌شده را از بسته‌های workspace مربوط به pnpm در `extensions/*` بارگذاری می‌کند، بنابراین اجرای `npm install` در ریشه، کل درخت سورس را آماده نمی‌کند.
- Docker (اختیاری؛ فقط برای راه‌اندازی/e2e کانتینری — [Docker](/fa/install/docker) را ببینید)

## راهبرد سفارشی‌سازی (تا به‌روزرسانی‌ها دردسرساز نشوند)

اگر «۱۰۰٪ متناسب با من» _و_ به‌روزرسانی آسان می‌خواهید، سفارشی‌سازی خود را در این موارد نگه دارید:

- **پیکربندی:** `~/.openclaw/openclaw.json` (شبیه JSON/JSON5)
- **فضای کاری:** `~/.openclaw/workspace` (Skills، promptها، حافظه‌ها؛ آن را یک مخزن git خصوصی کنید)

یک‌بار راه‌اندازی اولیه کنید:

```bash
openclaw setup
```

از داخل این مخزن، از ورودی CLI محلی استفاده کنید:

```bash
openclaw setup
```

اگر هنوز نصب سراسری ندارید، آن را با `pnpm openclaw setup` اجرا کنید.

## اجرای Gateway از این مخزن

پس از `pnpm build`، می‌توانید CLI بسته‌بندی‌شده را مستقیماً اجرا کنید:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## روند پایدار (ابتدا برنامه macOS)

1. **OpenClaw.app** را نصب و اجرا کنید (نوار منو).
2. فهرست آماده‌سازی اولیه/مجوزها را کامل کنید (درخواست‌های TCC).
3. مطمئن شوید Gateway روی **محلی** است و اجرا می‌شود (برنامه آن را مدیریت می‌کند).
4. سطح‌ها را پیوند دهید (مثال: WhatsApp):

```bash
openclaw channels login
```

5. بررسی سلامت:

```bash
openclaw health
```

اگر آماده‌سازی اولیه در build شما موجود نیست:

- `openclaw setup` را اجرا کنید، سپس `openclaw channels login`، و بعد Gateway را دستی شروع کنید (`openclaw gateway`).

## روند لبه فناوری (Gateway در ترمینال)

هدف: کار روی Gateway نوشته‌شده با TypeScript، دریافت بارگذاری مجدد سریع، و متصل نگه داشتن رابط برنامه macOS.

### ۰) (اختیاری) اجرای برنامه macOS از سورس نیز

اگر برنامه macOS را هم روی لبه فناوری می‌خواهید:

```bash
./scripts/restart-mac.sh
```

### ۱) شروع Gateway توسعه

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` فرایند watch مربوط به Gateway را در یک session نام‌دار tmux شروع یا دوباره شروع می‌کند و از ترمینال‌های تعاملی به‌صورت خودکار به آن متصل می‌شود. shellهای غیرتعاملی جدا می‌مانند و `tmux attach -t openclaw-gateway-watch-main` را چاپ می‌کنند؛ برای جدا نگه داشتن یک اجرای تعاملی از `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` استفاده کنید، یا برای حالت watch در foreground از `pnpm gateway:watch:raw` استفاده کنید. watcher با تغییرات مرتبط در سورس، پیکربندی، و فراداده Pluginهای همراه‌شده دوباره بارگذاری می‌شود.
`pnpm openclaw setup` مرحله یک‌باره مقداردهی اولیه پیکربندی/فضای کاری محلی برای یک checkout تازه است.
`pnpm gateway:watch`، `dist/control-ui` را دوباره build نمی‌کند؛ بنابراین پس از تغییرات `ui/` دوباره `pnpm ui:build` را اجرا کنید یا هنگام توسعه Control UI از `pnpm ui:dev` استفاده کنید.

### ۲) هدایت برنامه macOS به Gateway در حال اجرا

در **OpenClaw.app**:

- حالت اتصال: **محلی**
  برنامه به gateway در حال اجرا روی پورت پیکربندی‌شده متصل می‌شود.

### ۳) تأیید

- وضعیت Gateway درون برنامه باید **«در حال استفاده از gateway موجود …»** را نشان دهد
- یا از طریق CLI:

```bash
openclaw health
```

### دام‌های رایج

- **پورت اشتباه:** مقدار پیش‌فرض WS مربوط به Gateway برابر `ws://127.0.0.1:18789` است؛ برنامه و CLI را روی یک پورت نگه دارید.
- **محل نگهداری وضعیت:**
  - وضعیت کانال/ارائه‌دهنده: `~/.openclaw/credentials/`
  - پروفایل‌های احراز هویت مدل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - sessionها: `~/.openclaw/agents/<agentId>/sessions/`
  - گزارش‌ها: `/tmp/openclaw/`

## نقشه ذخیره‌سازی اعتبارنامه‌ها

هنگام اشکال‌زدایی احراز هویت یا تصمیم‌گیری درباره پشتیبان‌گیری از این استفاده کنید:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **توکن ربات Telegram**: پیکربندی/env یا `channels.telegram.tokenFile` (فقط فایل عادی؛ symlinkها رد می‌شوند)
- **توکن ربات Discord**: پیکربندی/env یا SecretRef (ارائه‌دهنده‌های env/file/exec)
- **توکن‌های Slack**: پیکربندی/env (`channels.slack.*`)
- **allowlistهای جفت‌سازی**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (حساب پیش‌فرض)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (حساب‌های غیردیفالت)
- **پروفایل‌های احراز هویت مدل**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload اسرار مبتنی بر فایل (اختیاری)**: `~/.openclaw/secrets.json`
- **وارد کردن OAuth قدیمی**: `~/.openclaw/credentials/oauth.json`
  جزئیات بیشتر: [امنیت](/fa/gateway/security#credential-storage-map).

## به‌روزرسانی (بدون خراب کردن راه‌اندازی شما)

- `~/.openclaw/workspace` و `~/.openclaw/` را به‌عنوان «چیزهای خودتان» نگه دارید؛ promptها/پیکربندی شخصی را داخل مخزن `openclaw` نگذارید.
- به‌روزرسانی سورس: `git pull` + `pnpm install` + ادامه استفاده از `pnpm gateway:watch`.

## Linux (سرویس کاربر systemd)

نصب‌های Linux از سرویس **کاربر** systemd استفاده می‌کنند. به‌طور پیش‌فرض، systemd سرویس‌های کاربر را هنگام logout/بیکاری متوقف می‌کند و این کار Gateway را می‌کشد. آماده‌سازی اولیه تلاش می‌کند lingering را برای شما فعال کند (ممکن است sudo بخواهد). اگر همچنان خاموش است، اجرا کنید:

```bash
sudo loginctl enable-linger $USER
```

برای سرورهای همیشه‌روشن یا چندکاربره، به‌جای سرویس کاربر، یک سرویس **سیستم** را در نظر بگیرید (نیازی به lingering نیست). برای یادداشت‌های systemd، [راهنمای عملیاتی Gateway](/fa/gateway) را ببینید.

## مستندات مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway) (flagها، supervision، پورت‌ها)
- [پیکربندی Gateway](/fa/gateway/configuration) (schema پیکربندی + مثال‌ها)
- [Discord](/fa/channels/discord) و [Telegram](/fa/channels/telegram) (برچسب‌های پاسخ + تنظیمات replyToMode)
- [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw)
- [برنامه macOS](/fa/platforms/macos) (چرخه عمر gateway)
