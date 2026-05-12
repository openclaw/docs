---
read_when:
    - شما OpenClaw را با Docker روی یک ماشین مجازی ابری مستقر می‌کنید
    - به آماده‌سازی باینری مشترک، ماندگاری و جریان به‌روزرسانی نیاز دارید
summary: مراحل زمان اجرای ماشین مجازی Docker مشترک برای میزبان‌های بلندمدت OpenClaw Gateway
title: زمان اجرای ماشین مجازی Docker
x-i18n:
    generated_at: "2026-05-12T12:51:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6a01c20ac6b85a32167fd1d897368ee0ebc6997cbc95a25f831ea7dd2e623c9
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

مراحل runtime مشترک برای نصب‌های Docker مبتنی بر VM مانند GCP، Hetzner و ارائه‌دهندگان VPS مشابه.

## باینری‌های موردنیاز را در image آماده‌سازی کنید

نصب باینری‌ها داخل یک container در حال اجرا دام است.
هر چیزی که در runtime نصب شود، پس از restart از بین می‌رود.

همه باینری‌های خارجی موردنیاز Skills باید هنگام build شدن image نصب شوند.

نمونه‌های زیر فقط سه باینری رایج را نشان می‌دهند:

- `gog` (از `gogcli`) برای دسترسی به Gmail
- `goplaces` برای Google Places
- `wacli` برای WhatsApp

این‌ها نمونه‌اند، نه یک فهرست کامل.
می‌توانید با همین الگو هر تعداد باینری لازم را نصب کنید.

اگر بعدا Skills جدیدی اضافه کنید که به باینری‌های بیشتری وابسته‌اند، باید:

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
URLهای بالا نمونه هستند. برای VMهای مبتنی بر ARM، assetهای `arm64` را انتخاب کنید. برای buildهای بازتولیدپذیر، URLهای release نسخه‌دار را pin کنید.
</Note>

## Build و اجرا

```bash
docker compose build
docker compose up -d openclaw-gateway
```

اگر build هنگام `pnpm install --frozen-lockfile` با `Killed` یا `exit code 137` شکست خورد، حافظه VM کافی نیست.
پیش از تلاش دوباره، از machine class بزرگ‌تری استفاده کنید.

باینری‌ها را بررسی کنید:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

خروجی موردانتظار:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway را بررسی کنید:

```bash
docker compose logs -f openclaw-gateway
```

خروجی موردانتظار:

```
[gateway] listening on ws://0.0.0.0:18789
```

## چه چیزی کجا پایدار می‌ماند

OpenClaw در Docker اجرا می‌شود، اما Docker منبع حقیقت نیست.
همه stateهای بلندمدت باید پس از restart، rebuild و reboot باقی بمانند.

| مؤلفه             | مکان                                                   | سازوکار پایداری        | یادداشت‌ها                                                    |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| پیکربندی Gateway    | `/home/node/.openclaw/`                                | mount کردن volume میزبان | شامل `openclaw.json`، `.env`                                  |
| پروفایل‌های احراز هویت مدل | `/home/node/.openclaw/agents/`                         | mount کردن volume میزبان | `agents/<agentId>/agent/auth-profiles.json` (OAuth، کلیدهای API) |
| کلید پروفایل احراز هویت | `/home/node/.config/openclaw/`                         | mount کردن volume میزبان | کلید رمزنگاری محلی برای مواد token پروفایل احراز هویت OAuth |
| پیکربندی‌های Skill  | `/home/node/.openclaw/skills/`                         | mount کردن volume میزبان | state در سطح Skill                                           |
| workspace عامل      | `/home/node/.openclaw/workspace/`                      | mount کردن volume میزبان | کد و artifactهای عامل                                        |
| نشست WhatsApp       | `/home/node/.openclaw/`                                | mount کردن volume میزبان | ورود با QR را حفظ می‌کند                                     |
| keyring مربوط به Gmail | `/home/node/.openclaw/`                                | volume میزبان + گذرواژه | به `GOG_KEYRING_PASSWORD` نیاز دارد                           |
| بسته‌های Plugin     | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | mount کردن volume میزبان | ریشه‌های بسته Plugin قابل دانلود                             |
| باینری‌های خارجی    | `/usr/local/bin/`                                      | image Docker           | باید هنگام build آماده‌سازی شوند                             |
| runtime Node        | فایل‌سیستم container                                   | image Docker           | در هر build شدن image دوباره ساخته می‌شود                    |
| بسته‌های OS         | فایل‌سیستم container                                   | image Docker           | در runtime نصب نکنید                                         |
| container Docker    | ناپایدار                                               | قابل restart           | حذف آن بی‌خطر است                                            |

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
