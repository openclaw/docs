---
read_when:
    - شما در حال استقرار OpenClaw روی یک ماشین مجازی ابری با Docker هستید
    - به فرایند ساخت باینری مشترک، ماندگاری، و جریان به‌روزرسانی نیاز دارید
summary: مراحل زمان اجرای ماشین مجازی مشترک Docker برای میزبان‌های بلندمدت OpenClaw Gateway
title: محیط اجرای VM Docker
x-i18n:
    generated_at: "2026-05-02T11:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

مراحل runtime مشترک برای نصب‌های Docker مبتنی بر VM مانند GCP، Hetzner و ارائه‌دهندگان VPS مشابه.

## باینری‌های موردنیاز را داخل image آماده کنید

نصب باینری‌ها داخل container در حال اجرا یک دام است.
هر چیزی که در runtime نصب شود، پس از restart از بین می‌رود.

همه باینری‌های خارجی موردنیاز Skills باید هنگام build کردن image نصب شوند.

نمونه‌های زیر فقط سه باینری رایج را نشان می‌دهند:

- `gog` (از `gogcli`) برای دسترسی به Gmail
- `goplaces` برای Google Places
- `wacli` برای WhatsApp

این‌ها نمونه هستند، نه یک فهرست کامل.
می‌توانید با همین الگو هر تعداد باینری که نیاز دارید نصب کنید.

اگر بعدا Skills جدیدی اضافه کنید که به باینری‌های بیشتری وابسته باشند، باید:

1. Dockerfile را به‌روزرسانی کنید
2. image را دوباره build کنید
3. containerها را restart کنید

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
URLهای بالا نمونه هستند. برای VMهای مبتنی بر ARM، assetهای `arm64` را انتخاب کنید. برای buildهای قابل بازتولید، URLهای release نسخه‌دار را pin کنید.
</Note>

## Build و اجرا

```bash
docker compose build
docker compose up -d openclaw-gateway
```

اگر build هنگام `pnpm install --frozen-lockfile` با `Killed` یا `exit code 137` شکست خورد، VM با کمبود حافظه مواجه است.
پیش از تلاش دوباره، از یک کلاس ماشین بزرگ‌تر استفاده کنید.

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
همه stateهای بلندمدت باید پس از restart، rebuild و reboot باقی بمانند.

| مؤلفه | مکان | سازوکار پایداری | یادداشت‌ها |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| پیکربندی Gateway | `/home/node/.openclaw/` | mount کردن volume میزبان | شامل `openclaw.json`، `.env` |
| پروفایل‌های احراز هویت مدل | `/home/node/.openclaw/agents/` | mount کردن volume میزبان | `agents/<agentId>/agent/auth-profiles.json` (OAuth، کلیدهای API) |
| پیکربندی‌های Skills | `/home/node/.openclaw/skills/` | mount کردن volume میزبان | state در سطح Skills |
| workspace عامل | `/home/node/.openclaw/workspace/` | mount کردن volume میزبان | کد و artifactهای عامل |
| session WhatsApp | `/home/node/.openclaw/` | mount کردن volume میزبان | ورود QR را حفظ می‌کند |
| keyring مربوط به Gmail | `/home/node/.openclaw/` | volume میزبان + password | به `GOG_KEYRING_PASSWORD` نیاز دارد |
| بسته‌های Plugin | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | mount کردن volume میزبان | ریشه‌های بسته Plugin قابل دانلود |
| باینری‌های خارجی | `/usr/local/bin/` | Docker image | باید هنگام build داخل image آماده شوند |
| runtime مربوط به Node | filesystem مربوط به container | Docker image | با هر build کردن image دوباره ساخته می‌شود |
| بسته‌های سیستم‌عامل | filesystem مربوط به container | Docker image | در runtime نصب نکنید |
| container مربوط به Docker | موقتی | قابل restart | نابود کردن آن امن است |

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
