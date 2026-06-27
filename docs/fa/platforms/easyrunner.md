---
read_when:
    - استقرار OpenClaw روی EasyRunner
    - اجرای Gateway پشت پروکسی Caddy متعلق به EasyRunner
    - انتخاب حجم‌های پایدار و احراز هویت برای یک Gateway میزبانی‌شده
summary: اجرای Gateway مربوط به OpenClaw روی EasyRunner با Podman و Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T18:05:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner می‌تواند Gateway متعلق به OpenClaw را به‌صورت یک برنامهٔ کانتینری کوچک پشت پراکسی
Caddy خود میزبانی کند. این راهنما یک میزبان EasyRunner را فرض می‌کند که برنامه‌های Compose سازگار با Podman را اجرا می‌کند و HTTPS را از طریق Caddy در دسترس می‌گذارد.

## پیش از شروع

- یک سرور EasyRunner با دامنه‌ای که به آن مسیریابی شده است.
- یک تصویر کانتینری OpenClaw ساخته‌شده یا منتشرشده.
- یک volume پیکربندی پایدار برای `/home/node/.openclaw`.
- یک volume فضای کاری پایدار برای `/workspace`.
- یک توکن یا گذرواژهٔ قوی برای Gateway.

در صورت امکان احراز هویت دستگاه را فعال نگه دارید. اگر استقرار reverse proxy شما نمی‌تواند
هویت دستگاه را درست منتقل کند، ابتدا تنظیمات trusted-proxy را اصلاح کنید؛ از
دورزدن‌های خطرناک احراز هویت فقط برای یک شبکهٔ کاملاً خصوصی و تحت کنترل اپراتور استفاده کنید.

## برنامهٔ Compose

یک برنامهٔ EasyRunner با فایل Compose به این شکل ایجاد کنید:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

`openclaw.example.com` را با نام میزبان Gateway خود جایگزین کنید. به‌جای
ثبت `OPENCLAW_GATEWAY_TOKEN` در تعریف برنامه، آن را در مدیر secret/environment متعلق به EasyRunner ذخیره کنید.

## پیکربندی OpenClaw

درون volume پیکربندی پایدار، Gateway را فقط از طریق
پراکسی در دسترس نگه دارید و احراز هویت را الزامی کنید:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

اگر Caddy خاتمهٔ TLS را برای Gateway انجام می‌دهد، تنظیمات trusted proxy را برای
مسیر دقیق پراکسی پیکربندی کنید، نه اینکه بررسی‌های احراز هویت را به‌صورت سراسری غیرفعال کنید. ببینید
[احراز هویت trusted proxy](/fa/gateway/trusted-proxy-auth).

## تأیید

از ایستگاه کاری خود:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

از میزبان EasyRunner، لاگ‌های برنامه را بررسی کنید تا مطمئن شوید Gateway در حال گوش دادن است و
هیچ خطای راه‌اندازی مربوط به SecretRef، plugin یا احراز هویت کانال وجود ندارد.

## به‌روزرسانی‌ها و پشتیبان‌گیری‌ها

- تصویر جدید OpenClaw را pull یا build کنید، سپس برنامهٔ EasyRunner را دوباره مستقر کنید.
- پیش از به‌روزرسانی‌ها از volume به نام `openclaw-config` پشتیبان بگیرید.
- اگر agentها داده‌های پایدار پروژه را در آنجا می‌نویسند، از `openclaw-workspace` پشتیبان بگیرید.
- پس از به‌روزرسانی‌های بزرگ، `openclaw doctor` را اجرا کنید تا migrationهای پیکربندی و
  هشدارهای سرویس را پیدا کند.

## عیب‌یابی

- `gateway probe` نمی‌تواند متصل شود: تأیید کنید نام میزبان Caddy به برنامه اشاره می‌کند
  و کانتینر روی `0.0.0.0:1455` گوش می‌دهد.
- احراز هویت ناموفق است: توکن را در secrets متعلق به EasyRunner و فرمان کلاینت محلی
  هم‌زمان rotate کنید.
- فایل‌ها پس از بازیابی متعلق به root هستند: volumeهای mountشده را اصلاح کنید تا
  کاربر کانتینر بتواند در `/home/node/.openclaw` و `/workspace` بنویسد.
- Browser یا pluginهای کانال ناموفق می‌شوند: بررسی کنید که binaryهای خارجی موردنیاز،
  خروجی شبکه و اعتبارنامه‌های mountشده درون کانتینر در دسترس باشند.
