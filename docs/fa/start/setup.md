---
read_when:
    - راه‌اندازی یک دستگاه جدید
    - می‌خواهید بدون به‌هم‌زدن تنظیمات شخصی‌تان، از «جدیدترین و بهترین» امکانات بهره‌مند شوید
summary: راه‌اندازی پیشرفته و گردش‌کارهای توسعه برای OpenClaw
title: راه‌اندازی
x-i18n:
    generated_at: "2026-07-16T17:46:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
اگر برای نخستین بار راه‌اندازی می‌کنید، از [شروع به کار](/fa/start/getting-started) آغاز کنید.
برای جزئیات آغاز به کار، [آغاز به کار (CLI)](/fa/start/wizard) را ببینید.
</Note>

## خلاصه

گردش‌کار راه‌اندازی را بر اساس دفعات موردنظر برای دریافت به‌روزرسانی و اینکه آیا می‌خواهید Gateway را خودتان اجرا کنید، انتخاب کنید:

- **سفارشی‌سازی بیرون از مخزن قرار دارد:** پیکربندی و فضای کاری خود را در `~/.openclaw/openclaw.json` و `~/.openclaw/workspace/` نگه دارید تا به‌روزرسانی‌های مخزن به آن‌ها دست نزنند.
- **گردش‌کار پایدار (پیشنهادی برای بیشتر کاربران):** برنامه macOS را نصب کنید و اجازه دهید Gateway همراه آن را اجرا کند.
- **گردش‌کار لبه فناوری (توسعه):** Gateway را خودتان از طریق `pnpm gateway:watch` اجرا کنید، سپس اجازه دهید برنامه macOS در حالت Local به آن متصل شود.

## پیش‌نیازها (از منبع)

- Node 24.15+ پیشنهاد می‌شود (Node 22 LTS، در حال حاضر `22.22.3+`، همچنان پشتیبانی می‌شود)
- `pnpm` برای دریافت‌های منبع لازم است. OpenClaw در حالت توسعه، پلاگین‌های همراه را از بسته‌های فضای کاری pnpm در
  `extensions/*` بارگذاری می‌کند، بنابراین `npm install` در ریشه
  کل درخت منبع را آماده نمی‌کند.
- Docker (اختیاری؛ فقط برای راه‌اندازی کانتینری/e2e — [Docker](/fa/install/docker) را ببینید)

## راهبرد سفارشی‌سازی (تا به‌روزرسانی‌ها آسیبی نزنند)

اگر هم «کاملاً متناسب با خودم» و هم به‌روزرسانی آسان می‌خواهید، سفارشی‌سازی‌های خود را در این موارد نگه دارید:

- **پیکربندی:** `~/.openclaw/openclaw.json` (JSON/تقریباً JSON5)
- **فضای کاری:** `~/.openclaw/workspace` (مهارت‌ها، پرامپت‌ها، حافظه‌ها؛ آن را به یک مخزن خصوصی git تبدیل کنید)

پوشه‌های پیکربندی/فضای کاری را یک‌بار، بدون اجرای راهنمای کامل آغاز به کار، آماده کنید:

```bash
openclaw setup --baseline
```

هنوز نصب سراسری ندارید؟ به‌جای آن، از همین مخزن اجرا کنید:

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` به‌تنهایی و بدون `--baseline`، نام مستعاری برای `openclaw onboard` است و راهنمای تعاملی کامل را اجرا می‌کند.)

## اجرای Gateway از این مخزن

پس از `pnpm build`، می‌توانید CLI بسته‌بندی‌شده را مستقیماً اجرا کنید:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## گردش‌کار پایدار (ابتدا برنامه macOS)

1. **OpenClaw.app** را نصب و اجرا کنید (نوار منو).
2. فهرست بررسی آغاز به کار/مجوزها را تکمیل کنید (اعلان‌های TCC).
3. مطمئن شوید Gateway روی **Local** است و اجرا می‌شود (برنامه آن را مدیریت می‌کند).
4. سطوح را پیوند دهید (مثال: WhatsApp):

```bash
openclaw channels login
```

5. بررسی صحت:

```bash
openclaw health
```

اگر آغاز به کار در بیلد شما موجود نیست:

- `openclaw setup` و سپس `openclaw channels login` را اجرا کنید، سپس Gateway را به‌صورت دستی راه‌اندازی کنید (`openclaw gateway`).

## گردش‌کار لبه فناوری (Gateway در ترمینال)

هدف: کار روی Gateway مبتنی بر TypeScript، بهره‌گیری از بارگذاری مجدد فوری و متصل نگه‌داشتن رابط کاربری برنامه macOS.

### 0) (اختیاری) برنامه macOS را نیز از منبع اجرا کنید

اگر می‌خواهید برنامه macOS نیز روی لبه فناوری باشد:

```bash
./scripts/restart-mac.sh
```

### 1) راه‌اندازی Gateway توسعه

```bash
pnpm install
# فقط نخستین اجرا (یا پس از بازنشانی پیکربندی/فضای کاری محلی OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` فرایند پایش Gateway را در یک نشست نام‌گذاری‌شده tmux
(`openclaw-gateway-watch-main`) راه‌اندازی یا بازراه‌اندازی می‌کند و از ترمینال‌های
تعاملی به‌طور خودکار به آن متصل می‌شود. پوسته‌های غیرتعاملی جدا باقی می‌مانند و
`tmux attach -t openclaw-gateway-watch-main` را چاپ می‌کنند؛ برای جدا نگه‌داشتن یک اجرای
تعاملی از `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` یا برای حالت پایش پیش‌زمینه از
`pnpm gateway:watch:raw` استفاده کنید. پایشگر پیش از در اختیار گرفتن درگاه
پیکربندی‌شده/پیش‌فرض، سرویس Gateway نصب‌شده نمایه فعال را متوقف می‌کند و از
جایگزین‌شدن فرایند منبع توسط ناظر سرویس جلوگیری می‌کند. سرویس نصب‌شده باقی
می‌ماند؛ پس از پایان پایش، `pnpm openclaw gateway start` را اجرا کنید. پنجره tmux پس از
شکست راه‌اندازی همچنان در دسترس می‌ماند تا ترمینال یا عامل دیگری بتواند متصل
شود یا گزارش‌های آن را دریافت کند. پایشگر با تغییرات مرتبط در منبع، پیکربندی و
فراداده پلاگین‌های همراه، بارگذاری مجدد می‌شود. اگر Gateway تحت پایش هنگام
راه‌اندازی خارج شود، `gateway:watch` یک‌بار `openclaw doctor --fix --non-interactive` را اجرا
می‌کند و دوباره تلاش می‌کند؛ برای غیرفعال‌کردن این مرحله ترمیم مختص توسعه،
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` را تنظیم کنید.
`pnpm gateway:watch`، `dist/control-ui` را دوباره نمی‌سازد؛ بنابراین پس از
تغییرات `ui/`، `pnpm ui:build` را دوباره اجرا کنید یا هنگام
توسعه رابط کاربری کنترل از `pnpm ui:dev` استفاده کنید.

### 2) برنامه macOS را به Gateway در حال اجرای خود متصل کنید

در **OpenClaw.app**:

- Connection Mode: **Local**
  برنامه به Gateway در حال اجرا روی درگاه پیکربندی‌شده متصل می‌شود.

### 3) تأیید

- وضعیت Gateway درون برنامه باید **"Using existing gateway …"** را نشان دهد
- یا از طریق CLI:

```bash
openclaw health
```

### خطاهای رایج

- **درگاه اشتباه:** مقدار پیش‌فرض Gateway WS برابر `ws://127.0.0.1:18789` است؛ برنامه و CLI را روی یک درگاه نگه دارید.
- **محل نگه‌داری وضعیت:**
  - وضعیت کانال/ارائه‌دهنده: `~/.openclaw/credentials/`
  - نمایه‌های احراز هویت مدل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - نشست‌ها و رونوشت‌ها: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - آثار نشست قدیمی/بایگانی‌شده: `~/.openclaw/agents/<agentId>/sessions/`
  - گزارش‌ها: `/tmp/openclaw/`

## نقشه ذخیره‌سازی اعتبارنامه‌ها

هنگام اشکال‌زدایی احراز هویت یا تصمیم‌گیری درباره موارد پشتیبان‌گیری، از این بخش استفاده کنید:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **توکن ربات Telegram**: پیکربندی/متغیر محیطی یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ پیوندهای نمادین رد می‌شوند)
- **توکن ربات Discord**: پیکربندی/متغیر محیطی یا SecretRef (ارائه‌دهندگان env/file/exec)
- **توکن‌های Slack**: پیکربندی/متغیر محیطی (`channels.slack.*`)
- **فهرست‌های مجاز جفت‌سازی**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (حساب پیش‌فرض)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (حساب‌های غیرپیش‌فرض)
- **نمایه‌های احراز هویت مدل**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **بار اسرار مبتنی بر فایل (اختیاری)**: `~/.openclaw/secrets.json`
- **درون‌ریزی OAuth قدیمی**: `~/.openclaw/credentials/oauth.json`
  جزئیات بیشتر: [امنیت](/fa/gateway/security#credential-storage-map).

## به‌روزرسانی (بدون خراب‌کردن راه‌اندازی)

- `~/.openclaw/workspace` و `~/.openclaw/` را به‌عنوان «موارد شخصی خود» نگه دارید؛ پرامپت‌ها/پیکربندی شخصی را در مخزن `openclaw` قرار ندهید.
- به‌روزرسانی منبع: `git pull` + `pnpm install` + ادامه استفاده از `pnpm gateway:watch`.

## Linux (سرویس کاربر systemd)

نصب‌های Linux از سرویس **کاربر** systemd استفاده می‌کنند. systemd به‌طور پیش‌فرض
سرویس‌های کاربر را هنگام خروج/بی‌کاری متوقف می‌کند که باعث پایان‌یافتن Gateway
می‌شود. آغاز به کار تلاش می‌کند ماندگاری را برایتان فعال کند (ممکن است sudo
درخواست شود). اگر همچنان غیرفعال است، اجرا کنید:

```bash
sudo loginctl enable-linger $USER
```

برای سرورهای همیشه‌روشن یا چندکاربره، به‌جای سرویس کاربر از سرویس **سیستم**
استفاده کنید (به ماندگاری نیازی ندارد). برای نکات systemd، [راهنمای عملیات Gateway](/fa/gateway) را ببینید.

## مستندات مرتبط

- [راهنمای عملیات Gateway](/fa/gateway) (پرچم‌ها، نظارت، درگاه‌ها)
- [پیکربندی Gateway](/fa/gateway/configuration) (طرح‌واره پیکربندی + مثال‌ها)
- [Discord](/fa/channels/discord) و [Telegram](/fa/channels/telegram) (برچسب‌های پاسخ + تنظیمات replyToMode)
- [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw)
- [برنامه macOS](/fa/platforms/macos) (چرخه عمر Gateway)
