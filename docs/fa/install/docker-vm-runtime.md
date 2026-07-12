---
read_when:
    - شما در حال استقرار OpenClaw روی یک ماشین مجازی ابری با Docker هستید
    - به فرایند مشترک آماده‌سازی باینری، ماندگاری و به‌روزرسانی نیاز دارید
summary: مراحل زمان اجرای ماشین مجازی Docker مشترک برای میزبان‌های بلندمدت Gateway در OpenClaw
title: محیط اجرای ماشین مجازی Docker
x-i18n:
    generated_at: "2026-07-12T10:10:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

گام‌های مشترک زمان اجرا برای نصب‌های مبتنی بر ماشین مجازی Docker، مانند GCP، Hetzner و ارائه‌دهندگان مشابه VPS.

## گنجاندن باینری‌های موردنیاز در ایمیج

نصب باینری‌ها درون کانتینر در حال اجرا یک دام است: هر چیزی که در زمان اجرا نصب شود، با راه‌اندازی مجدد از بین می‌رود. هر باینری خارجی موردنیاز یک Skill را هنگام ساخت در ایمیج بگنجانید.

نمونه‌های زیر فقط سه باینری را به‌ترتیب الفبایی پوشش می‌دهند:

- `gog` (از `gogcli`) برای دسترسی به Gmail
- `goplaces` برای Google Places
- `wacli` برای WhatsApp

این‌ها صرفاً نمونه‌اند، نه فهرستی کامل. با استفاده از همین الگو، هر تعداد باینری که Skills شما نیاز دارند نصب کنید. اگر بعداً Skill جدیدی اضافه کردید که به باینری تازه‌ای نیاز دارد:

1. Dockerfile را به‌روزرسانی کنید.
2. ایمیج را دوباره بسازید.
3. کانتینرها را راه‌اندازی مجدد کنید.

**نمونه Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
نشانی‌های بالا نمونه هستند. برای ماشین‌های مجازی مبتنی بر ARM، فایل‌های `arm64` را انتخاب کنید. برای ساخت‌های تکرارپذیر، نشانی انتشار نسخه‌دار را ثابت کنید.
</Note>

## ساخت و راه‌اندازی

```bash
docker compose build
docker compose up -d openclaw-gateway
```

اگر ساخت هنگام اجرای `pnpm install --frozen-lockfile` با پیام `Killed` یا کد خروج ۱۳۷ ناموفق شود، حافظه ماشین مجازی تمام شده است. پیش از تلاش مجدد، از رده ماشینی بزرگ‌تری استفاده کنید.

باینری‌ها را بررسی کنید:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

خروجی مورد انتظار:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

از فعال‌بودن Gateway مطمئن شوید:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

بازگرداندن پاسخ ۲۰۰ توسط `/healthz` تأیید می‌کند که فرایند Gateway در حال گوش‌دادن و سالم است؛ دستور داخلی `HEALTHCHECK` ایمیج نیز همین نقطه پایانی را پایش می‌کند.

## چه چیزی در کجا پایدار می‌ماند

OpenClaw در Docker اجرا می‌شود، اما Docker منبع حقیقت نیست. تمام وضعیت‌های بلندمدت باید پس از راه‌اندازی مجدد، ساخت دوباره و راه‌اندازی مجدد سیستم باقی بمانند.

| مؤلفه                    | مکان                                                   | سازوکار ماندگاری           | توضیحات                                                                                                                    |
| ------------------------ | ------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| پیکربندی Gateway         | `/home/node/.openclaw/`                                | اتصال جلد میزبان           | شامل `openclaw.json`                                                                                                       |
| اطلاعات احراز کانال/ارائه‌دهنده | `/home/node/.openclaw/credentials/`                    | اتصال جلد میزبان           | اطلاعات اعتبارنامه کانال و ارائه‌دهنده                                                                                    |
| نمایه‌های احراز هویت مدل | `/home/node/.openclaw/agents/`                         | اتصال جلد میزبان           | `agents/<agentId>/agent/auth-profiles.json` (OAuth، کلیدهای API)                                                           |
| فایل کلید قدیمی OAuth    | `/home/node/.config/openclaw/`                         | اتصال جلد میزبان           | سازگاری فقط‌خواندنی برای فایل‌های جانبی OAuth پیش از مهاجرت؛ `openclaw doctor --fix` آن‌ها را به `auth-profiles.json` منتقل می‌کند |
| پیکربندی‌های Skill       | `/home/node/.openclaw/skills/`                         | اتصال جلد میزبان           | وضعیت در سطح Skill                                                                                                         |
| فضای کاری عامل           | `/home/node/.openclaw/workspace/`                      | اتصال جلد میزبان           | کد و مصنوعات عامل                                                                                                         |
| نشست WhatsApp            | `/home/node/.openclaw/`                                | اتصال جلد میزبان           | ورود با QR را حفظ می‌کند                                                                                                   |
| جاکلیدی Gmail            | `/home/node/.openclaw/`                                | جلد میزبان + گذرواژه        | به `GOG_KEYRING_PASSWORD` نیاز دارد                                                                                        |
| بسته‌های Plugin          | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | اتصال جلد میزبان           | ریشه بسته‌های قابل دانلود Plugin                                                                                           |
| باینری‌های خارجی         | `/usr/local/bin/`                                      | ایمیج Docker               | باید هنگام ساخت در ایمیج گنجانده شوند                                                                                      |
| زمان اجرای Node          | سامانه فایل کانتینر                                    | ایمیج Docker               | با هر بار ساخت ایمیج دوباره ساخته می‌شود                                                                                   |
| بسته‌های سیستم‌عامل      | سامانه فایل کانتینر                                    | ایمیج Docker               | در زمان اجرا نصب نکنید                                                                                                     |
| کانتینر Docker           | موقت                                                   | قابل راه‌اندازی مجدد        | حذف آن بی‌خطر است                                                                                                          |

## به‌روزرسانی‌ها

برای به‌روزرسانی OpenClaw روی ماشین مجازی:

```bash
git pull
docker compose build
docker compose up -d
```

## مرتبط

- [Docker](/fa/install/docker)
- [Podman](/fa/install/podman)
- [ClawDock](/fa/install/clawdock)
