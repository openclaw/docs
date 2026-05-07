---
read_when:
    - راه‌اندازی یک دستگاه جدید
    - می‌خواهید «جدیدترین + بهترین» را داشته باشید، بدون اینکه راه‌اندازی شخصی‌تان خراب شود
summary: راه‌اندازی پیشرفته و گردش‌کارهای توسعه برای OpenClaw
title: راه‌اندازی
x-i18n:
    generated_at: "2026-05-07T13:32:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
اگر برای نخستین بار راه‌اندازی می‌کنید، با [شروع به کار](/fa/start/getting-started) آغاز کنید.
برای جزئیات راه‌اندازی اولیه، [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.
</Note>

## خلاصه

یک گردش‌کار راه‌اندازی را بر اساس این انتخاب کنید که هر چند وقت یک‌بار به‌روزرسانی می‌خواهید و آیا می‌خواهید Gateway را خودتان اجرا کنید یا نه:

- **سفارشی‌سازی بیرون از مخزن می‌ماند:** پیکربندی و فضای کاری خود را در `~/.openclaw/openclaw.json` و `~/.openclaw/workspace/` نگه دارید تا به‌روزرسانی‌های مخزن به آن‌ها دست نزنند.
- **گردش‌کار پایدار (توصیه‌شده برای بیشتر افراد):** برنامه macOS را نصب کنید و بگذارید Gateway همراه را اجرا کند.
- **گردش‌کار لبه‌ی توسعه (dev):** Gateway را خودتان از طریق `pnpm gateway:watch` اجرا کنید، سپس بگذارید برنامه macOS در حالت Local به آن متصل شود.

## پیش‌نیازها (از سورس)

- Node 24 توصیه می‌شود (Node 22 LTS، در حال حاضر `22.16+`، همچنان پشتیبانی می‌شود)
- `pnpm` برای checkoutهای سورس لازم است. OpenClaw در حالت dev، Pluginهای همراه را از بسته‌های فضای کاری pnpm در
  `extensions/*` بارگذاری می‌کند، بنابراین اجرای `npm install` در ریشه
  کل درخت سورس را آماده نمی‌کند.
- Docker (اختیاری؛ فقط برای راه‌اندازی کانتینری/e2e - [Docker](/fa/install/docker) را ببینید)

## راهبرد سفارشی‌سازی (تا به‌روزرسانی‌ها آسیب نزنند)

اگر «۱۰۰٪ مطابق نیاز خودم» _و_ به‌روزرسانی آسان می‌خواهید، سفارشی‌سازی خود را در این موارد نگه دارید:

- **پیکربندی:** `~/.openclaw/openclaw.json` (شبیه JSON/JSON5)
- **فضای کاری:** `~/.openclaw/workspace` (Skills، پرامپت‌ها، حافظه‌ها؛ آن را یک مخزن git خصوصی کنید)

یک‌بار راه‌اندازی اولیه را انجام دهید:

```bash
openclaw setup
```

از داخل این مخزن، از ورودی CLI محلی استفاده کنید:

```bash
openclaw setup
```

اگر هنوز نصب سراسری ندارید، آن را با `pnpm openclaw setup` اجرا کنید.

## اجرای Gateway از این مخزن

پس از `pnpm build`، می‌توانید CLI بسته‌بندی‌شده را مستقیما اجرا کنید:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## گردش‌کار پایدار (ابتدا برنامه macOS)

1. **OpenClaw.app** را نصب و اجرا کنید (نوار منو).
2. چک‌لیست راه‌اندازی اولیه/مجوزها را کامل کنید (پرامپت‌های TCC).
3. مطمئن شوید Gateway روی **Local** است و اجرا می‌شود (برنامه آن را مدیریت می‌کند).
4. سطح‌ها را لینک کنید (مثال: WhatsApp):

```bash
openclaw channels login
```

5. بررسی سلامت:

```bash
openclaw health
```

اگر راه‌اندازی اولیه در build شما در دسترس نیست:

- `openclaw setup` را اجرا کنید، سپس `openclaw channels login`، و بعد Gateway را دستی شروع کنید (`openclaw gateway`).

## گردش‌کار لبه‌ی توسعه (Gateway در ترمینال)

هدف: کار روی Gateway TypeScript، دریافت بارگذاری مجدد داغ، و متصل نگه داشتن UI برنامه macOS.

### 0) (اختیاری) برنامه macOS را نیز از سورس اجرا کنید

اگر می‌خواهید برنامه macOS هم روی لبه‌ی توسعه باشد:

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

`gateway:watch` فرایند watch مربوط به Gateway را در یک نشست tmux نام‌گذاری‌شده شروع یا بازشروع می‌کند
و از ترمینال‌های تعاملی به‌صورت خودکار attach می‌شود. shellهای غیرتعاملی
detached می‌مانند و `tmux attach -t openclaw-gateway-watch-main` را چاپ می‌کنند؛ برای detached نگه داشتن اجرای تعاملی از
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` استفاده کنید،
یا برای حالت watch در foreground از `pnpm gateway:watch:raw` استفاده کنید. watcher
با تغییرات مرتبط در سورس، پیکربندی، و فراداده Pluginهای همراه reload می‌شود. اگر
Gateway تحت watch هنگام startup خارج شود، `gateway:watch` یک‌بار
`openclaw doctor --fix --non-interactive` را اجرا می‌کند و دوباره تلاش می‌کند؛ برای غیرفعال کردن این گذر تعمیر فقط-dev،
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` را تنظیم کنید.
`pnpm openclaw setup` مرحله یک‌باره مقداردهی اولیه پیکربندی/فضای کاری محلی برای یک checkout تازه است.
`pnpm gateway:watch`، `dist/control-ui` را دوباره build نمی‌کند، بنابراین پس از تغییرات `ui/` دوباره `pnpm ui:build` را اجرا کنید یا هنگام توسعه Control UI از `pnpm ui:dev` استفاده کنید.

### 2) برنامه macOS را به Gateway در حال اجرای خود وصل کنید

در **OpenClaw.app**:

- حالت اتصال: **Local**
  برنامه به gateway در حال اجرا روی پورت پیکربندی‌شده attach می‌شود.

### 3) تأیید

- وضعیت Gateway درون برنامه باید **"Using existing gateway …"** را نشان دهد
- یا از طریق CLI:

```bash
openclaw health
```

### دام‌های رایج

- **پورت اشتباه:** مقدار پیش‌فرض Gateway WS برابر `ws://127.0.0.1:18789` است؛ برنامه و CLI را روی همان پورت نگه دارید.
- **محل نگهداری وضعیت:**
  - وضعیت کانال/ارائه‌دهنده: `~/.openclaw/credentials/`
  - پروفایل‌های احراز هویت مدل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - نشست‌ها: `~/.openclaw/agents/<agentId>/sessions/`
  - لاگ‌ها: `/tmp/openclaw/`

## نقشه ذخیره‌سازی اعتبارنامه‌ها

هنگام عیب‌یابی احراز هویت یا تصمیم‌گیری درباره مواردی که باید پشتیبان‌گیری شوند، از این استفاده کنید:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **توکن ربات Telegram**: پیکربندی/env یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ symlinkها رد می‌شوند)
- **توکن ربات Discord**: پیکربندی/env یا SecretRef (ارائه‌دهندگان env/file/exec)
- **توکن‌های Slack**: پیکربندی/env (`channels.slack.*`)
- **فهرست‌های مجاز pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (حساب پیش‌فرض)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (حساب‌های غیرپیش‌فرض)
- **پروفایل‌های احراز هویت مدل**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload رازهای مبتنی بر فایل (اختیاری)**: `~/.openclaw/secrets.json`
- **واردسازی OAuth قدیمی**: `~/.openclaw/credentials/oauth.json`
  جزئیات بیشتر: [امنیت](/fa/gateway/security#credential-storage-map).

## به‌روزرسانی (بدون خراب کردن راه‌اندازی شما)

- `~/.openclaw/workspace` و `~/.openclaw/` را به‌عنوان «چیزهای خودتان» نگه دارید؛ پرامپت‌ها/پیکربندی شخصی را در مخزن `openclaw` قرار ندهید.
- به‌روزرسانی سورس: `git pull` + `pnpm install` + ادامه استفاده از `pnpm gateway:watch`.

## Linux (سرویس کاربری systemd)

نصب‌های Linux از سرویس **کاربری** systemd استفاده می‌کنند. به‌طور پیش‌فرض، systemd سرویس‌های کاربری را
هنگام logout/idle متوقف می‌کند، که Gateway را می‌کشد. راه‌اندازی اولیه تلاش می‌کند
lingering را برای شما فعال کند (ممکن است sudo بخواهد). اگر هنوز خاموش است، اجرا کنید:

```bash
sudo loginctl enable-linger $USER
```

برای سرورهای همیشه‌روشن یا چندکاربره، به‌جای سرویس کاربری،
یک سرویس **سیستمی** را در نظر بگیرید (نیازی به lingering ندارد). برای یادداشت‌های systemd، [runbook Gateway](/fa/gateway) را ببینید.

## مستندات مرتبط

- [runbook Gateway](/fa/gateway) (flagها، supervision، پورت‌ها)
- [پیکربندی Gateway](/fa/gateway/configuration) (schema پیکربندی + مثال‌ها)
- [Discord](/fa/channels/discord) و [Telegram](/fa/channels/telegram) (برچسب‌های پاسخ + تنظیمات replyToMode)
- [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw)
- [برنامه macOS](/fa/platforms/macos) (چرخه عمر gateway)
