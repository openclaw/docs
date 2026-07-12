---
read_when:
    - شما اغلب OpenClaw را با Docker اجرا می‌کنید و برای کارهای روزمره فرمان‌های کوتاه‌تری می‌خواهید
    - شما یک لایهٔ کمکی برای داشبورد، گزارش‌ها، راه‌اندازی توکن و فرایندهای جفت‌سازی می‌خواهید
summary: توابع کمکی پوستهٔ ClawDock برای نصب‌های مبتنی بر Dockerِ OpenClaw
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T10:09:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock یک لایهٔ کوچک از ابزارهای کمکی پوسته برای نصب‌های مبتنی بر Docker در OpenClaw است.

این ابزار به‌جای فراخوانی‌های طولانی‌تر `docker compose ...`، فرمان‌های کوتاهی مانند `clawdock-start`، `clawdock-dashboard` و `clawdock-fix-token` در اختیارتان می‌گذارد.

اگر هنوز Docker را راه‌اندازی نکرده‌اید، از [Docker](/fa/install/docker) شروع کنید.

## نصب

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر پیش‌تر ClawDock را از `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، آن را دوباره از مسیر فعلی `scripts/clawdock/clawdock-helpers.sh` نصب کنید؛ مسیر خام قدیمی GitHub حذف شده است.

ابزارهای کمکی در نخستین استفاده، محل کد دریافت‌شدهٔ OpenClaw را به‌طور خودکار شناسایی می‌کنند (با بررسی مسیرهای رایجی مانند `~/openclaw` و `~/projects/openclaw`) و نتیجه را در `~/.clawdock/config` ذخیره می‌کنند. اگر کد دریافت‌شدهٔ شما در محل دیگری قرار دارد، خودتان `CLAWDOCK_DIR` را تنظیم کنید.

## امکانات

### عملیات پایه

| فرمان              | توضیحات                    |
| ------------------ | -------------------------- |
| `clawdock-start`   | Gateway را راه‌اندازی می‌کند |
| `clawdock-stop`    | Gateway را متوقف می‌کند      |
| `clawdock-restart` | Gateway را دوباره راه‌اندازی می‌کند |
| `clawdock-status`  | وضعیت کانتینر را بررسی می‌کند |
| `clawdock-logs`    | گزارش‌های Gateway را دنبال می‌کند |

### دسترسی به کانتینر

| فرمان                      | توضیحات                                       |
| -------------------------- | --------------------------------------------- |
| `clawdock-shell`           | یک پوسته درون کانتینر Gateway باز می‌کند       |
| `clawdock-cli <command>`   | فرمان‌های CLI مربوط به OpenClaw را در Docker اجرا می‌کند |
| `clawdock-exec <command>`  | یک فرمان دلخواه را در کانتینر اجرا می‌کند       |

### رابط کاربری وب و جفت‌سازی

| فرمان                    | توضیحات                         |
| ------------------------ | ------------------------------- |
| `clawdock-dashboard`     | نشانی اینترنتی رابط کنترل را باز می‌کند |
| `clawdock-devices`       | جفت‌سازی‌های در انتظار دستگاه را فهرست می‌کند |
| `clawdock-approve <id>`  | یک درخواست جفت‌سازی را تأیید می‌کند |

### راه‌اندازی و نگه‌داری

| فرمان                 | توضیحات                                              |
| --------------------- | ---------------------------------------------------- |
| `clawdock-fix-token`  | توکن Gateway را در پیکربندی کانتینر می‌نویسد          |
| `clawdock-update`     | دریافت، بازسازی و راه‌اندازی مجدد را انجام می‌دهد     |
| `clawdock-rebuild`    | فقط تصویر Docker را بازسازی می‌کند                    |
| `clawdock-clean`      | کانتینرها و حجم‌ها را حذف می‌کند                      |

### ابزارها

| فرمان                   | توضیحات                                        |
| ----------------------- | ---------------------------------------------- |
| `clawdock-health`       | بررسی سلامت Gateway را اجرا می‌کند              |
| `clawdock-token`        | توکن Gateway را چاپ می‌کند                      |
| `clawdock-cd`           | به پوشهٔ پروژهٔ OpenClaw می‌رود                 |
| `clawdock-config`       | `~/.openclaw` را باز می‌کند                     |
| `clawdock-show-config`  | فایل‌های پیکربندی را با مقادیر پوشانده‌شده چاپ می‌کند |
| `clawdock-workspace`    | پوشهٔ فضای کاری را باز می‌کند                   |
| `clawdock-help`         | همهٔ فرمان‌های ClawDock را فهرست می‌کند         |

## روند نخستین استفاده

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

## پیکربندی و اطلاعات محرمانه

ClawDock دو فایل جداگانهٔ `.env` را می‌خواند که با تفکیک توضیح‌داده‌شده در [Docker](/fa/install/docker) مطابقت دارند:

- فایل `.env` پروژه در کنار `docker-compose.yml`: مقادیر ویژهٔ Docker مانند نام تصویر، درگاه‌ها و `OPENCLAW_GATEWAY_TOKEN`. فرمان `clawdock-token` توکن را از اینجا می‌خواند.
- فایل `~/.openclaw/.env` (که در کانتینر سوار می‌شود): اطلاعات محرمانهٔ مبتنی بر متغیرهای محیطی که خود OpenClaw مدیریت می‌کند، در کنار `openclaw.json` و `agents/<agentId>/agent/auth-profiles.json`.

فرمان `clawdock-fix-token` توکن را از فایل `.env` پروژه در مقادیر پیکربندی `gateway.remote.token` و `gateway.auth.token` کانتینر کپی می‌کند و Gateway را دوباره راه‌اندازی می‌کند.

برای بررسی سریع `openclaw.json` و هر دو فایل `.env` از `clawdock-show-config` استفاده کنید؛ این فرمان مقادیر `.env` را در خروجی چاپ‌شدهٔ خود می‌پوشاند.

## مرتبط

<CardGroup cols={2}>
  <Card title="Docker" href="/fa/install/docker" icon="docker">
    روش مرجع نصب OpenClaw با Docker.
  </Card>
  <Card title="محیط اجرای ماشین مجازی Docker" href="/fa/install/docker-vm-runtime" icon="cube">
    محیط اجرای ماشین مجازی مدیریت‌شده با Docker برای جداسازی مقاوم‌سازی‌شده.
  </Card>
  <Card title="به‌روزرسانی" href="/fa/install/updating" icon="arrow-up-right-from-square">
    به‌روزرسانی بستهٔ OpenClaw و سرویس‌های مدیریت‌شده.
  </Card>
</CardGroup>
