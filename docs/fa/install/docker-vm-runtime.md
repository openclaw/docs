---
read_when:
    - شما در حال استقرار OpenClaw روی یک ماشین مجازی ابری با Docker هستید
    - شما به جریان مشترک ساخت باینری، ماندگاری و به‌روزرسانی نیاز دارید
summary: مراحل زمان اجرای ماشین مجازی مشترک Docker برای میزبان‌های بلندمدت OpenClaw Gateway
title: محیط اجرای ماشین مجازی Docker
x-i18n:
    generated_at: "2026-04-29T23:03:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

مراحل زمان اجرای مشترک برای نصب‌های Docker مبتنی بر VM مانند GCP، Hetzner و ارائه‌دهندگان VPS مشابه.

## گنجاندن باینری‌های لازم در تصویر

نصب باینری‌ها داخل یک کانتینر در حال اجرا یک دام است.
هر چیزی که در زمان اجرا نصب شود، پس از راه‌اندازی مجدد از دست می‌رود.

همه باینری‌های خارجی موردنیاز Skills باید در زمان ساخت تصویر نصب شوند.

نمونه‌های زیر فقط سه باینری رایج را نشان می‌دهند:

- `gog` (از `gogcli`) برای دسترسی به Gmail
- `goplaces` برای Google Places
- `wacli` برای WhatsApp

این‌ها نمونه هستند، نه یک فهرست کامل.
می‌توانید با همین الگو هر تعداد باینری موردنیاز را نصب کنید.

اگر بعدا Skills جدیدی اضافه کنید که به باینری‌های بیشتری وابسته باشد، باید:

1. Dockerfile را به‌روزرسانی کنید
2. تصویر را دوباره بسازید
3. کانتینرها را راه‌اندازی مجدد کنید

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
URLهای بالا نمونه هستند. برای VMهای مبتنی بر ARM، دارایی‌های `arm64` را انتخاب کنید. برای ساخت‌های قابل بازتولید، URLهای انتشار نسخه‌دار را سنجاق کنید.
</Note>

## ساخت و راه‌اندازی

```bash
docker compose build
docker compose up -d openclaw-gateway
```

اگر ساخت هنگام `pnpm install --frozen-lockfile` با `Killed` یا `exit code 137` شکست بخورد، حافظه VM تمام شده است.
پیش از تلاش دوباره، از یک رده ماشین بزرگ‌تر استفاده کنید.

باینری‌ها را بررسی کنید:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

خروجی مورد انتظار:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway را بررسی کنید:

```bash
docker compose logs -f openclaw-gateway
```

خروجی مورد انتظار:

```
[gateway] listening on ws://0.0.0.0:18789
```

## چه چیزی کجا پایدار می‌ماند

OpenClaw در Docker اجرا می‌شود، اما Docker منبع حقیقت نیست.
همه وضعیت‌های بلندمدت باید پس از راه‌اندازی‌های مجدد، بازسازی‌ها و راه‌اندازی‌های دوباره سیستم باقی بمانند.

| مؤلفه               | مکان                                      | سازوکار پایداری        | یادداشت‌ها                                                   |
| ------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| پیکربندی Gateway    | `/home/node/.openclaw/`                  | اتصال volume میزبان    | شامل `openclaw.json`، `.env`                                  |
| پروفایل‌های احراز هویت مدل | `/home/node/.openclaw/agents/`           | اتصال volume میزبان    | `agents/<agentId>/agent/auth-profiles.json` (OAuth، کلیدهای API) |
| پیکربندی‌های Skill  | `/home/node/.openclaw/skills/`           | اتصال volume میزبان    | وضعیت در سطح Skill                                           |
| فضای کاری عامل      | `/home/node/.openclaw/workspace/`        | اتصال volume میزبان    | کد و مصنوعات عامل                                            |
| نشست WhatsApp       | `/home/node/.openclaw/`                  | اتصال volume میزبان    | ورود با QR را حفظ می‌کند                                      |
| keyring مربوط به Gmail | `/home/node/.openclaw/`                  | volume میزبان + گذرواژه | به `GOG_KEYRING_PASSWORD` نیاز دارد                           |
| وابستگی‌های زمان اجرای Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | volume نام‌دار Docker   | وابستگی‌های Plugin بسته‌بندی‌شده تولیدشده و mirrorهای زمان اجرا |
| باینری‌های خارجی    | `/usr/local/bin/`                        | تصویر Docker           | باید در زمان ساخت گنجانده شوند                               |
| زمان اجرای Node     | فایل‌سیستم کانتینر                       | تصویر Docker           | در هر ساخت تصویر دوباره ساخته می‌شود                         |
| بسته‌های سیستم‌عامل | فایل‌سیستم کانتینر                       | تصویر Docker           | در زمان اجرا نصب نکنید                                       |
| کانتینر Docker      | ناپایدار                                 | قابل راه‌اندازی مجدد   | نابود کردن آن ایمن است                                       |

## به‌روزرسانی‌ها

برای به‌روزرسانی OpenClaw روی VM:

```bash
git pull
docker compose build
docker compose up -d
```

## مرتبط

- [Docker](/fa/install/docker)
- [Podman](/fa/install/podman)
- [ClawDock](/fa/install/clawdock)
