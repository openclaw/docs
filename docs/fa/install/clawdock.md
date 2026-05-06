---
read_when:
    - شما اغلب OpenClaw را با Docker اجرا می‌کنید و دستورهای روزمره کوتاه‌تری می‌خواهید
    - شما یک لایهٔ کمکی برای جریان‌های داشبورد، گزارش‌ها، راه‌اندازی توکن و جفت‌سازی می‌خواهید
summary: کمک‌کننده‌های پوسته ClawDock برای نصب‌های OpenClaw مبتنی بر Docker
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T09:24:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock یک لایه کوچک کمک‌کننده شل برای نصب‌های مبتنی بر Docker در OpenClaw است.

به‌جای فراخوانی‌های طولانی‌تر `docker compose ...`، فرمان‌های کوتاهی مانند `clawdock-start`، `clawdock-dashboard` و `clawdock-fix-token` در اختیارتان می‌گذارد.

اگر هنوز Docker را راه‌اندازی نکرده‌اید، از [Docker](/fa/install/docker) شروع کنید.

## نصب

از مسیر کمک‌کننده رسمی استفاده کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر قبلاً ClawDock را از `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، آن را دوباره از مسیر جدید `scripts/clawdock/clawdock-helpers.sh` نصب کنید. مسیر خام قدیمی GitHub حذف شده است.

## چه چیزی دریافت می‌کنید

### عملیات پایه

| فرمان              | توضیح                   |
| ------------------ | ---------------------- |
| `clawdock-start`   | شروع Gateway           |
| `clawdock-stop`    | توقف Gateway           |
| `clawdock-restart` | راه‌اندازی مجدد Gateway |
| `clawdock-status`  | بررسی وضعیت کانتینر    |
| `clawdock-logs`    | دنبال‌کردن لاگ‌های Gateway |

### دسترسی به کانتینر

| فرمان                    | توضیح                                      |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | باز کردن یک شل داخل کانتینر Gateway           |
| `clawdock-cli <command>`  | اجرای فرمان‌های OpenClaw CLI در Docker        |
| `clawdock-exec <command>` | اجرای یک فرمان دلخواه در کانتینر              |

### رابط وب و جفت‌سازی

| فرمان                  | توضیح                         |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | باز کردن URL رابط کاربری کنترل |
| `clawdock-devices`      | فهرست جفت‌سازی‌های دستگاه در انتظار |
| `clawdock-approve <id>` | تأیید یک درخواست جفت‌سازی      |

### راه‌اندازی و نگهداری

| فرمان               | توضیح                                      |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | پیکربندی توکن Gateway داخل کانتینر        |
| `clawdock-update`    | کشیدن، ساخت مجدد و راه‌اندازی مجدد        |
| `clawdock-rebuild`   | فقط ساخت مجدد تصویر Docker                |
| `clawdock-clean`     | حذف کانتینرها و حجم‌ها                    |

### ابزارهای کمکی

| فرمان                 | توضیح                                      |
| ---------------------- | --------------------------------------- |
| `clawdock-health`      | اجرای بررسی سلامت Gateway               |
| `clawdock-token`       | چاپ توکن Gateway                         |
| `clawdock-cd`          | رفتن به دایرکتوری پروژه OpenClaw         |
| `clawdock-config`      | باز کردن `~/.openclaw`                   |
| `clawdock-show-config` | چاپ فایل‌های پیکربندی با مقادیر پنهان‌شده |
| `clawdock-workspace`   | باز کردن دایرکتوری فضای کاری             |

## جریان بار اول

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

اگر مرورگر اعلام کرد که جفت‌سازی لازم است:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## پیکربندی و اسرار

ClawDock با همان تفکیک پیکربندی Docker که در [Docker](/fa/install/docker) توضیح داده شده کار می‌کند:

- `<project>/.env` برای مقادیر مخصوص Docker مانند نام تصویر، پورت‌ها و توکن Gateway
- `~/.openclaw/.env` برای کلیدهای ارائه‌دهنده و توکن‌های بات مبتنی بر env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` برای احراز هویت OAuth/API-key ذخیره‌شده ارائه‌دهنده
- `~/.openclaw/openclaw.json` برای پیکربندی رفتار

وقتی می‌خواهید فایل‌های `.env` و `openclaw.json` را سریع بررسی کنید، از `clawdock-show-config` استفاده کنید. این فرمان مقادیر `.env` را در خروجی چاپ‌شده پنهان می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="Docker" href="/fa/install/docker" icon="docker">
    نصب رسمی Docker برای OpenClaw.
  </Card>
  <Card title="زمان اجرای Docker VM" href="/fa/install/docker-vm-runtime" icon="cube">
    زمان اجرای VM مدیریت‌شده با Docker برای جداسازی سخت‌گیرانه‌تر.
  </Card>
  <Card title="به‌روزرسانی" href="/fa/install/updating" icon="arrow-up-right-from-square">
    به‌روزرسانی بسته OpenClaw و سرویس‌های مدیریت‌شده.
  </Card>
</CardGroup>
