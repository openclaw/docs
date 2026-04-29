---
read_when:
    - شما اغلب OpenClaw را با Docker اجرا می‌کنید و می‌خواهید فرمان‌های روزمره کوتاه‌تری داشته باشید
    - شما یک لایهٔ کمکی برای داشبورد، گزارش‌ها، راه‌اندازی توکن و جریان‌های جفت‌سازی می‌خواهید
summary: کمک‌کننده‌های شِل ClawDock برای نصب‌های مبتنی بر Dockerِ OpenClaw
title: ClawDock
x-i18n:
    generated_at: "2026-04-29T23:02:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock یک لایه کوچک کمکی برای shell در نصب‌های مبتنی بر Docker برای OpenClaw است.

به‌جای فراخوانی‌های طولانی‌تر `docker compose ...`، دستورهای کوتاهی مانند `clawdock-start`، `clawdock-dashboard` و `clawdock-fix-token` در اختیار شما می‌گذارد.

اگر هنوز Docker را راه‌اندازی نکرده‌اید، از [Docker](/fa/install/docker) شروع کنید.

## نصب

از مسیر کمکی استاندارد استفاده کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر قبلا ClawDock را از `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، از مسیر جدید `scripts/clawdock/clawdock-helpers.sh` دوباره نصب کنید. مسیر خام قدیمی GitHub حذف شده است.

## آنچه دریافت می‌کنید

### عملیات پایه

| دستور              | توضیح                 |
| ------------------ | ---------------------- |
| `clawdock-start`   | شروع Gateway           |
| `clawdock-stop`    | توقف Gateway           |
| `clawdock-restart` | راه‌اندازی مجدد Gateway |
| `clawdock-status`  | بررسی وضعیت کانتینر    |
| `clawdock-logs`    | دنبال کردن لاگ‌های Gateway |

### دسترسی به کانتینر

| دستور                    | توضیح                                      |
| ------------------------- | ------------------------------------------ |
| `clawdock-shell`          | باز کردن shell داخل کانتینر Gateway        |
| `clawdock-cli <command>`  | اجرای دستورهای CLI مربوط به OpenClaw در Docker |
| `clawdock-exec <command>` | اجرای یک دستور دلخواه در کانتینر           |

### Web UI و جفت‌سازی

| دستور                  | توضیح                         |
| ----------------------- | ----------------------------- |
| `clawdock-dashboard`    | باز کردن نشانی Control UI     |
| `clawdock-devices`      | فهرست کردن جفت‌سازی‌های در انتظار دستگاه |
| `clawdock-approve <id>` | تأیید یک درخواست جفت‌سازی     |

### راه‌اندازی و نگهداری

| دستور               | توضیح                                         |
| -------------------- | --------------------------------------------- |
| `clawdock-fix-token` | پیکربندی توکن Gateway داخل کانتینر            |
| `clawdock-update`    | دریافت، بازسازی و راه‌اندازی مجدد             |
| `clawdock-rebuild`   | فقط بازسازی image مربوط به Docker             |
| `clawdock-clean`     | حذف کانتینرها و volumeها                      |

### ابزارها

| دستور                 | توضیح                                      |
| ---------------------- | ------------------------------------------ |
| `clawdock-health`      | اجرای بررسی سلامت Gateway                  |
| `clawdock-token`       | چاپ توکن Gateway                           |
| `clawdock-cd`          | رفتن به دایرکتوری پروژه OpenClaw           |
| `clawdock-config`      | باز کردن `~/.openclaw`                     |
| `clawdock-show-config` | چاپ فایل‌های پیکربندی با مقادیر پوشانده‌شده |
| `clawdock-workspace`   | باز کردن دایرکتوری workspace               |

## روند بار اول

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

- `<project>/.env` برای مقادیر اختصاصی Docker مانند نام image، پورت‌ها و توکن Gateway
- `~/.openclaw/.env` برای کلیدهای provider و توکن‌های bot که با env پشتیبانی می‌شوند
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` برای احراز هویت ذخیره‌شده OAuth/API-key مربوط به provider
- `~/.openclaw/openclaw.json` برای پیکربندی رفتار

وقتی می‌خواهید فایل‌های `.env` و `openclaw.json` را سریع بررسی کنید، از `clawdock-show-config` استفاده کنید. این دستور مقادیر `.env` را در خروجی چاپ‌شده می‌پوشاند.

## صفحه‌های مرتبط

- [Docker](/fa/install/docker)
- [زمان اجرای Docker VM](/fa/install/docker-vm-runtime)
- [به‌روزرسانی](/fa/install/updating)
