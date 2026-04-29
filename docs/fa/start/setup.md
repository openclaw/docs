---
read_when:
    - راه‌اندازی یک دستگاه جدید
    - شما «جدیدترین و بهترین» را می‌خواهید، بدون اینکه تنظیمات شخصی‌تان خراب شود
summary: راه‌اندازی پیشرفته و گردش‌کارهای توسعه برای OpenClaw
title: راه‌اندازی
x-i18n:
    generated_at: "2026-04-29T23:37:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
اگر برای نخستین بار راه‌اندازی می‌کنید، از [شروع به کار](/fa/start/getting-started) آغاز کنید.
برای جزئیات راه‌اندازی اولیه، [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.
</Note>

## خلاصه

بر اساس اینکه هر چند وقت یک‌بار به‌روزرسانی می‌خواهید و آیا می‌خواهید Gateway را خودتان اجرا کنید، یک جریان کاری راه‌اندازی انتخاب کنید:

- **سفارشی‌سازی بیرون از مخزن می‌ماند:** پیکربندی و فضای کاری خود را در `~/.openclaw/openclaw.json` و `~/.openclaw/workspace/` نگه دارید تا به‌روزرسانی‌های مخزن به آن‌ها دست نزنند.
- **جریان کاری پایدار (توصیه‌شده برای بیشتر کاربران):** برنامه macOS را نصب کنید و بگذارید Gateway همراه آن را اجرا کند.
- **جریان کاری لبه تیز (توسعه):** Gateway را خودتان با `pnpm gateway:watch` اجرا کنید، سپس بگذارید برنامه macOS در حالت Local متصل شود.

## پیش‌نیازها (از سورس)

- Node 24 توصیه می‌شود (Node 22 LTS، در حال حاضر `22.14+`، همچنان پشتیبانی می‌شود)
- `pnpm` ترجیح داده می‌شود (یا Bun اگر عمداً از [جریان کاری Bun](/fa/install/bun) استفاده می‌کنید)
- Docker (اختیاری؛ فقط برای راه‌اندازی/e2e کانتینری — [Docker](/fa/install/docker) را ببینید)

## راهبرد سفارشی‌سازی (تا به‌روزرسانی‌ها آسیب نزنند)

اگر «۱۰۰٪ متناسب با من» _و_ به‌روزرسانی آسان می‌خواهید، سفارشی‌سازی خود را در اینجا نگه دارید:

- **پیکربندی:** `~/.openclaw/openclaw.json` (شبیه JSON/JSON5)
- **فضای کاری:** `~/.openclaw/workspace` (skills، promptها، حافظه‌ها؛ آن را یک مخزن git خصوصی کنید)

یک‌بار راه‌اندازی اولیه کنید:

```bash
openclaw setup
```

از داخل این مخزن، از ورودی CLI محلی استفاده کنید:

```bash
openclaw setup
```

اگر هنوز نصب سراسری ندارید، آن را با `pnpm openclaw setup` اجرا کنید (یا اگر از جریان کاری Bun استفاده می‌کنید، `bun run openclaw setup`).

## اجرای Gateway از این مخزن

پس از `pnpm build`، می‌توانید CLI بسته‌بندی‌شده را مستقیماً اجرا کنید:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## جریان کاری پایدار (ابتدا برنامه macOS)

1. **OpenClaw.app** را نصب و اجرا کنید (نوار منو).
2. فهرست بررسی راه‌اندازی اولیه/مجوزها را کامل کنید (اعلان‌های TCC).
3. مطمئن شوید Gateway روی **Local** است و اجرا می‌شود (برنامه آن را مدیریت می‌کند).
4. سطح‌ها را پیوند دهید (نمونه: WhatsApp):

```bash
openclaw channels login
```

5. بررسی سلامت:

```bash
openclaw health
```

اگر راه‌اندازی اولیه در بیلد شما در دسترس نیست:

- `openclaw setup` را اجرا کنید، سپس `openclaw channels login`، سپس Gateway را دستی شروع کنید (`openclaw gateway`).

## جریان کاری لبه تیز (Gateway در ترمینال)

هدف: کار روی Gateway مبتنی بر TypeScript، دریافت بارگذاری مجدد داغ، و متصل نگه داشتن رابط برنامه macOS.

### 0) (اختیاری) برنامه macOS را هم از سورس اجرا کنید

اگر برنامه macOS را هم روی لبه تیز می‌خواهید:

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

`gateway:watch` فرایند پایش Gateway را در یک نشست tmux نام‌گذاری‌شده شروع یا بازشروع می‌کند و از ترمینال‌های تعاملی به‌صورت خودکار متصل می‌شود. پوسته‌های غیرتعاملی جدا می‌مانند و `tmux attach -t openclaw-gateway-watch-main` را چاپ می‌کنند؛ برای جدا نگه داشتن یک اجرای تعاملی از `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` استفاده کنید، یا برای حالت پایش در پیش‌زمینه از `pnpm gateway:watch:raw`. پایشگر با تغییرات مرتبط در سورس، پیکربندی و فراداده Pluginهای همراه، دوباره بارگذاری می‌شود.
`pnpm openclaw setup` مرحله یک‌باره مقداردهی اولیه پیکربندی/فضای کاری محلی برای یک checkout تازه است.
`pnpm gateway:watch`، `dist/control-ui` را دوباره نمی‌سازد، بنابراین پس از تغییرات `ui/` دوباره `pnpm ui:build` را اجرا کنید یا هنگام توسعه Control UI از `pnpm ui:dev` استفاده کنید.

اگر عمداً از جریان کاری Bun استفاده می‌کنید، فرمان‌های معادل این‌ها هستند:

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) برنامه macOS را به Gateway در حال اجرا اشاره دهید

در **OpenClaw.app**:

- حالت اتصال: **Local**
  برنامه به gateway در حال اجرا روی پورت پیکربندی‌شده متصل می‌شود.

### 3) بررسی کنید

- وضعیت Gateway درون برنامه باید **«Using existing gateway …»** را نشان دهد
- یا از طریق CLI:

```bash
openclaw health
```

### خطاهای رایج

- **پورت اشتباه:** پیش‌فرض Gateway WS برابر `ws://127.0.0.1:18789` است؛ برنامه و CLI را روی همان پورت نگه دارید.
- **محل نگهداری وضعیت:**
  - وضعیت کانال/ارائه‌دهنده: `~/.openclaw/credentials/`
  - پروفایل‌های احراز هویت مدل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - نشست‌ها: `~/.openclaw/agents/<agentId>/sessions/`
  - گزارش‌ها: `/tmp/openclaw/`

## نقشه ذخیره‌سازی اعتبارنامه‌ها

هنگام اشکال‌زدایی احراز هویت یا تصمیم‌گیری درباره اینکه از چه چیزی نسخه پشتیبان بگیرید، از این استفاده کنید:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **توکن ربات Telegram**: پیکربندی/env یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ symlinkها رد می‌شوند)
- **توکن ربات Discord**: پیکربندی/env یا SecretRef (ارائه‌دهندگان env/file/exec)
- **توکن‌های Slack**: پیکربندی/env (`channels.slack.*`)
- **فهرست‌های مجاز جفت‌سازی**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (حساب پیش‌فرض)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (حساب‌های غیرپیش‌فرض)
- **پروفایل‌های احراز هویت مدل**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **محموله رازهای مبتنی بر فایل (اختیاری)**: `~/.openclaw/secrets.json`
- **واردسازی OAuth قدیمی**: `~/.openclaw/credentials/oauth.json`
  جزئیات بیشتر: [امنیت](/fa/gateway/security#credential-storage-map).

## به‌روزرسانی (بدون خراب کردن راه‌اندازی شما)

- `~/.openclaw/workspace` و `~/.openclaw/` را به‌عنوان «چیزهای خودتان» نگه دارید؛ promptها/پیکربندی شخصی را داخل مخزن `openclaw` نگذارید.
- به‌روزرسانی سورس: `git pull` + مرحله نصب package-manager انتخابی شما (`pnpm install` به‌صورت پیش‌فرض؛ `bun install` برای جریان کاری Bun) + ادامه استفاده از فرمان `gateway:watch` متناظر.

## Linux (سرویس کاربر systemd)

نصب‌های Linux از یک سرویس systemd از نوع **کاربر** استفاده می‌کنند. به‌صورت پیش‌فرض، systemd سرویس‌های کاربر را هنگام خروج/بیکاری متوقف می‌کند، که Gateway را می‌کشد. راه‌اندازی اولیه تلاش می‌کند ماندگاری را برای شما فعال کند (ممکن است sudo بخواهد). اگر هنوز خاموش است، اجرا کنید:

```bash
sudo loginctl enable-linger $USER
```

برای سرورهای همیشه‌روشن یا چندکاربره، به‌جای سرویس کاربر، یک سرویس **سیستم** را در نظر بگیرید (نیازی به ماندگاری نیست). برای نکات systemd، [دفترچه اجرای Gateway](/fa/gateway) را ببینید.

## مستندات مرتبط

- [دفترچه اجرای Gateway](/fa/gateway) (پرچم‌ها، نظارت، پورت‌ها)
- [پیکربندی Gateway](/fa/gateway/configuration) (شِمای پیکربندی + نمونه‌ها)
- [Discord](/fa/channels/discord) و [Telegram](/fa/channels/telegram) (برچسب‌های پاسخ + تنظیمات replyToMode)
- [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw)
- [برنامه macOS](/fa/platforms/macos) (چرخه عمر gateway)
