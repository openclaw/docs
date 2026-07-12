---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: رفع مشکلات راه‌اندازی CDP در Chrome/Brave/Edge/Chromium برای کنترل مرورگر OpenClaw در Linux
title: عیب‌یابی مرورگر
x-i18n:
    generated_at: "2026-07-12T10:50:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## مشکل: Chrome CDP روی پورت 18800 راه‌اندازی نشد

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### علت اصلی

در Ubuntu و بیشتر توزیع‌های Linux، دستور `apt install chromium` به‌جای یک مرورگر واقعی، یک
پوشش snap نصب می‌کند:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

محدودسازی AppArmor در snap با نحوه اجرای فرایند مرورگر و پایش آن توسط OpenClaw
تداخل ایجاد می‌کند.

سایر خطاهای رایج اجرا در Linux:

- `The profile appears to be in use by another Chromium process`: فایل‌های قفل قدیمی
  `Singleton*` در پوشه نمایه مدیریت‌شده. وقتی قفل به فرایندی خاتمه‌یافته یا
  فرایندی روی میزبانی دیگر اشاره کند، OpenClaw این قفل‌ها را حذف می‌کند و یک‌بار
  دیگر تلاش می‌کند.
- `Missing X server or $DISPLAY`: اجرای مرورگر قابل‌مشاهده به‌صراحت روی میزبانی
  بدون نشست دسکتاپ درخواست شده است. وقتی هر دو متغیر `DISPLAY` و
  `WAYLAND_DISPLAY` تنظیم نشده باشند، نمایه‌های مدیریت‌شده محلی در Linux به حالت
  بدون رابط گرافیکی بازمی‌گردند. اگر `OPENCLAW_BROWSER_HEADLESS=0`،
  `browser.headless: false` یا `browser.profiles.<name>.headless: false` را تنظیم
  کرده‌اید، آن بازنویسی حالت دارای رابط گرافیکی را حذف کنید،
  `OPENCLAW_BROWSER_HEADLESS=1` را تنظیم کنید، `Xvfb` را راه‌اندازی کنید، برای یک
  اجرای مدیریت‌شده یک‌باره دستور `openclaw browser start --headless` را اجرا کنید،
  یا OpenClaw را در یک نشست دسکتاپ واقعی اجرا کنید.

### راه‌حل ۱: نصب Google Chrome (توصیه‌شده)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # اگر خطاهای وابستگی وجود دارد
```

فایل `~/.openclaw/openclaw.json` را به‌روزرسانی کنید:

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### راه‌حل ۲: استفاده از Chromium نسخه snap در حالت فقط اتصال

اگر باید Chromium نسخه snap را نگه دارید، OpenClaw را طوری پیکربندی کنید که
به‌جای راه‌اندازی مرورگر، به مرورگری که به‌صورت دستی اجرا شده است متصل شود:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

Chromium را به‌صورت دستی راه‌اندازی کنید:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

در صورت تمایل، آن را با یک سرویس کاربری systemd به‌طور خودکار راه‌اندازی کنید:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### بررسی عملکرد مرورگر

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### مرجع پیکربندی

| گزینه                            | توضیحات                                                                 | مقدار پیش‌فرض                                                        |
| -------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `browser.enabled`                | فعال‌سازی کنترل مرورگر                                                  | `true`                                                               |
| `browser.executablePath`         | مسیر فایل اجرایی یک مرورگر مبتنی بر Chromium (Chrome/Brave/Edge/Chromium) | شناسایی خودکار (در صورت مبتنی بودن بر Chromium، مرورگر پیش‌فرض سیستم‌عامل ترجیح داده می‌شود) |
| `browser.headless`               | اجرا بدون رابط کاربری گرافیکی                                           | `false`                                                              |
| `OPENCLAW_BROWSER_HEADLESS`      | بازنویسی مختص هر فرایند برای حالت بدون رابط گرافیکی مرورگر مدیریت‌شده محلی | تنظیم‌نشده                                                           |
| `browser.noSandbox`              | افزودن پرچم `--no-sandbox` (برای برخی پیکربندی‌های Linux ضروری است)       | `false`                                                              |
| `browser.attachOnly`             | مرورگر را راه‌اندازی نکن؛ فقط به مرورگر موجود متصل شو                    | `false`                                                              |
| `browser.cdpPortRangeStart`      | پورت آغازین محلی CDP برای نمایه‌هایی که خودکار تخصیص می‌یابند             | `18800` (مشتق‌شده از پورت Gateway)                                   |
| `browser.localLaunchTimeoutMs`   | مهلت کشف Chrome مدیریت‌شده محلی، حداکثر تا `120000`                      | `15000`                                                              |
| `browser.localCdpReadyTimeoutMs` | مهلت آماده‌شدن CDP پس از اجرای محلی مدیریت‌شده، حداکثر تا `120000`       | `8000`                                                               |

هر دو مقدار مهلت باید عدد صحیح مثبت و حداکثر `120000` میلی‌ثانیه باشند؛ مقادیر
دیگر هنگام بارگذاری پیکربندی رد می‌شوند. در Raspberry Pi، میزبان‌های VPS قدیمی یا
فضای ذخیره‌سازی کند، وقتی Chrome برای در دسترس قرار دادن نقطه پایانی HTTP مربوط
به CDP به زمان بیشتری نیاز دارد، مقدار `browser.localLaunchTimeoutMs` را افزایش
دهید. وقتی راه‌اندازی موفق است اما `openclaw browser start` همچنان
`not reachable after start` را گزارش می‌کند، مقدار
`browser.localCdpReadyTimeoutMs` را افزایش دهید.

### مشکل: هیچ زبانه Chrome برای profile="user" یافت نشد

شما از نمایه `user` (`existing-session` / Chrome MCP) استفاده می‌کنید و هیچ
زبانه‌ای برای اتصال باز نیست.

گزینه‌های رفع مشکل:

1. به‌جای آن از مرورگر مدیریت‌شده استفاده کنید:
   `openclaw browser --browser-profile openclaw start` (یا
   `browser.defaultProfile: "openclaw"` را تنظیم کنید).
2. Chrome محلی را با حداقل یک زبانه باز در حال اجرا نگه دارید، سپس با
   `--browser-profile user` دوباره تلاش کنید.

نکات:

- `user` فقط روی میزبان قابل استفاده است. در سرورهای Linux، کانتینرها یا
  میزبان‌های راه‌دور، به‌جای آن نمایه‌های CDP را ترجیح دهید.
- `user` و سایر نمایه‌های `existing-session` محدودیت‌های فعلی Chrome MCP را
  به‌اشتراک می‌گذارند: فقط کنش‌های مبتنی بر ارجاع، یک فایل در هر بار بارگذاری،
  بدون بازنویسی `timeoutMs` برای کادرهای محاوره‌ای، بدون
  `wait --load networkidle` و بدون `responsebody`، برون‌بری PDF، رهگیری دانلود
  یا کنش‌های دسته‌ای.
- نمایه‌های محلی با درایور `openclaw`، مقادیر `cdpPort`/`cdpUrl` را به‌طور
  خودکار تخصیص می‌دهند؛ آن‌ها را فقط برای CDP راه‌دور به‌صورت دستی تنظیم کنید.
- نمایه‌های CDP راه‌دور، `http://`، `https://`، `ws://` و `wss://` را
  می‌پذیرند. برای کشف `/json/version` از HTTP(S) استفاده کنید، یا وقتی سرویس
  مرورگر شما نشانی مستقیم سوکت DevTools را ارائه می‌دهد، از WS(S) استفاده کنید.

## مرتبط

- [مرورگر](/fa/tools/browser)
- [ورود به مرورگر](/fa/tools/browser-login)
- [عیب‌یابی WSL2 مرورگر](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
