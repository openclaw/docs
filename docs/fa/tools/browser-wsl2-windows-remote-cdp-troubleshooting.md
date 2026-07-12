---
read_when:
    - اجرای Gateway در OpenClaw روی WSL2، درحالی‌که Chrome روی Windows قرار دارد
    - مشاهدهٔ خطاهای هم‌پوشان مرورگر/رابط کاربری کنترل در WSL2 و Windows
    - تصمیم‌گیری میان Chrome MCP محلیِ میزبان و CDP خامِ راه‌دور در پیکربندی‌های چندمیزبانه
summary: عیب‌یابی لایه‌به‌لایه Gateway در WSL2 و CDP راه‌دور Chrome در Windows
title: عیب‌یابی WSL2 + Windows + Chrome CDP راه‌دور
x-i18n:
    generated_at: "2026-07-12T10:59:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

در پیکربندی رایجِ میزبان‌های جدا، OpenClaw Gateway درون WSL2 اجرا می‌شود، Chrome روی Windows اجرا می‌شود و کنترل مرورگر باید از مرز WSL2/Windows عبور کند. ممکن است چند مشکل مستقل هم‌زمان بروز کنند (به [شمارهٔ 39369](https://github.com/openclaw/openclaw/issues/39369) مراجعه کنید): انتقال CDP، امنیت مبدأ Control UI و توکن/جفت‌سازی ممکن است هرکدام جداگانه شکست بخورند، درحالی‌که خطاهایی با ظاهر مشابه ایجاد می‌کنند. به‌جای حدس‌زدن اینکه کدام بخش خراب است، لایه‌های زیر را به‌ترتیب بررسی کنید.

## ابتدا حالت صحیح مرورگر را انتخاب کنید

### گزینهٔ ۱: CDP خام و راه‌دور از WSL2 به Windows

از یک پروفایل مرورگر راه‌دور استفاده کنید که از WSL2 به نقطهٔ پایانی CDP در Chrome روی Windows اشاره می‌کند. این گزینه را زمانی انتخاب کنید که Gateway درون WSL2 باقی می‌ماند، Chrome روی Windows اجرا می‌شود و کنترل مرورگر باید از مرز WSL2/Windows عبور کند.

### گزینهٔ ۲: Chrome MCP محلیِ میزبان

از راه‌انداز `existing-session` (پروفایل `user`) فقط زمانی استفاده کنید که Gateway روی همان میزبان Chrome اجرا می‌شود، می‌خواهید از وضعیت محلیِ مرورگرِ واردشده به حساب استفاده کنید، به انتقال مرورگر بین میزبان‌ها نیازی ندارید و به `responsebody`، خروجی PDF، رهگیری دانلود یا عملیات دسته‌ای نیاز ندارید (پروفایل‌های Chrome MCP از این قابلیت‌ها پشتیبانی نمی‌کنند).

برای Gateway روی WSL2 و Chrome روی Windows، از CDP خام و راه‌دور استفاده کنید. Chrome MCP محلیِ میزبان است، نه پلی از WSL2 به Windows.

## معماری عملیاتی

- WSL2، Gateway را روی `127.0.0.1:18789` اجرا می‌کند
- Windows، Control UI را در یک مرورگر عادی در `http://127.0.0.1:18789/` باز می‌کند
- Chrome روی Windows یک نقطهٔ پایانی CDP را روی درگاه `9222` ارائه می‌کند
- WSL2 می‌تواند به آن نقطهٔ پایانی CDP روی Windows دسترسی پیدا کند
- OpenClaw یک پروفایل مرورگر را به نشانیِ قابل‌دسترسی از WSL2 متصل می‌کند

## قانون حیاتی برای Control UI

وقتی رابط کاربری از Windows باز می‌شود، مگر اینکه عمداً HTTPS را راه‌اندازی کرده باشید، از localhost ویندوز استفاده کنید:

```text
http://127.0.0.1:18789/
```

به‌طور پیش‌فرض از IP شبکهٔ محلی استفاده نکنید. HTTP ساده روی نشانی شبکهٔ محلی یا tailnet می‌تواند رفتار مربوط به مبدأ ناامن/احراز هویت دستگاه را فعال کند که ارتباطی با خود CDP ندارد. به [Control UI](/fa/web/control-ui) مراجعه کنید.

## اعتبارسنجی لایه‌به‌لایه

از بالا به پایین پیش بروید؛ از هیچ مرحله‌ای نپرید. رفع یک لایه ممکن است همچنان خطای متفاوتی را از لایه‌ای پایین‌تر نمایان نگه دارد.

### لایهٔ ۱: بررسی کنید Chrome روی Windows سرویس CDP ارائه می‌کند

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome نسخهٔ 136 و بالاتر، گزینه‌های خط فرمان اشکال‌زدایی راه‌دور را برای پوشهٔ دادهٔ پیش‌فرض Chrome نادیده می‌گیرد. همان‌طور که در بالا نشان داده شده است، از یک پوشهٔ دادهٔ جداگانه و غیراصلی استفاده کنید. به [تغییر امنیتی اشکال‌زدایی راه‌دور Chrome](https://developer.chrome.com/blog/remote-debugging-port) مراجعه کنید. این کار پروفایل عادی Chrome را که به حساب وارد شده است، از راه دور قابل‌کنترل نمی‌کند.

ابتدا از Windows خود Chrome را بررسی کنید:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

اگر این مرحله شکست خورد، شنونده‌های Windows را مطابق بخش زیر عیب‌یابی کنید. هنوز مشکل از OpenClaw نیست.

#### پیش از تغییر portproxy، IPv4 و IPv6 را عیب‌یابی کنید

Chromium ابتدا تلاش می‌کند اشکال‌زدایی راه‌دور را به `127.0.0.1` متصل کند و فقط در صورت شکست اتصال IPv4، به `[::1]` بازمی‌گردد. یک قانون دائمی `v4tov4` که روی `127.0.0.1:9222` گوش می‌دهد، ممکن است پیش از شروع Chrome آن نقطهٔ پایانی را اشغال کند. در این صورت Chrome به `[::1]:9222` بازمی‌گردد، درحالی‌که قانون قدیمی ترافیک IPv4 را دوباره به شنوندهٔ خودش هدایت می‌کند و پاسخی خالی برمی‌گرداند.

به‌جای استنتاج وضعیت از نسخهٔ Chrome، شنونده‌ها و قوانین پراکسی واقعی را از Windows بررسی کنید:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

برای هر PID نمایش‌داده‌شده توسط `netstat` از `tasklist /fi "PID eq <PID>"` استفاده کنید.

- اگر `chrome.exe` روی `127.0.0.1` پاسخ می‌دهد، هر قانون portproxy را که آن نیز روی `127.0.0.1:9222` گوش می‌دهد حذف کنید. فقط نشانی آداپتور Windows را که از WSL2 قابل‌دسترسی است، به `127.0.0.1` هدایت کنید.
- اگر `chrome.exe` فقط روی `[::1]` پاسخ می‌دهد، به‌جای هدایت به یک نشانی IPv4 بلااستفاده، شنوندهٔ قابل‌دسترسی از WSL2 را با `v4tov6` به `::1` متصل کنید:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

شنونده را به نشانی آداپتوری متصل کنید که WSL2 به آن نیاز دارد. درگاه CDP را روی `0.0.0.0`، نشانی شبکهٔ محلی یا نشانی tailnet در معرض دسترسی قرار ندهید: CDP امکان کنترل نشست مرورگر را فراهم می‌کند.

### لایهٔ ۲: بررسی کنید WSL2 می‌تواند به آن نقطهٔ پایانی Windows دسترسی پیدا کند

از WSL2، نشانی دقیقی را که قصد دارید در `cdpUrl` استفاده کنید آزمایش کنید:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

نتیجهٔ مطلوب:

- `/json/version` یک JSON شامل فرادادهٔ Browser / Protocol-Version برمی‌گرداند
- `/json/list` یک JSON برمی‌گرداند (اگر هیچ صفحه‌ای باز نیست، آرایهٔ خالی قابل‌قبول است)

اگر این مرحله شکست خورد، Windows هنوز درگاه را در اختیار WSL2 قرار نداده است، نشانی برای سمت WSL2 اشتباه است یا دیوار آتش/هدایت درگاه/پراکسی وجود ندارد. پیش از تغییر پیکربندی OpenClaw، این مشکل را برطرف کنید.

### لایهٔ ۳: پروفایل صحیح مرورگر را پیکربندی کنید

OpenClaw را به نشانیِ قابل‌دسترسی از WSL2 متصل کنید:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

نکته‌ها:

- از نشانیِ قابل‌دسترسی از WSL2 استفاده کنید، نه نشانی‌ای که فقط روی Windows کار می‌کند
- برای مرورگرهایی که خارج از OpenClaw مدیریت می‌شوند، `attachOnly: true` را حفظ کنید
- `cdpUrl` می‌تواند `http://`، `https://`، `ws://` یا `wss://` باشد
- وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند، از HTTP(S) استفاده کنید
- فقط زمانی از WS(S) استفاده کنید که ارائه‌دهندهٔ مرورگر یک URL مستقیم برای سوکت DevTools در اختیارتان قرار می‌دهد
- پیش از انتظار موفقیت از OpenClaw، همان URL را با `curl` آزمایش کنید

### لایهٔ ۴: لایهٔ Control UI را جداگانه بررسی کنید

`http://127.0.0.1:18789/` را از Windows باز کنید، سپس موارد زیر را بررسی کنید:

- مبدأ صفحه با آنچه `gateway.controlUi.allowedOrigins` انتظار دارد مطابقت دارد
- احراز هویت با توکن یا جفت‌سازی به‌درستی پیکربندی شده است
- یک مشکل احراز هویت Control UI را به‌اشتباه مانند مشکل مرورگر عیب‌یابی نمی‌کنید

صفحهٔ مفید: [Control UI](/fa/web/control-ui).

### لایهٔ ۵: کنترل سرتاسری مرورگر را بررسی کنید

از WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

نتیجهٔ مطلوب:

- زبانه در Chrome روی Windows باز می‌شود
- `browser tabs` مقصد را برمی‌گرداند
- عملیات بعدی (`snapshot`، `screenshot`، `navigate`) از همان پروفایل کار می‌کنند

## خطاهای رایجِ گمراه‌کننده

| پیام                                                                                   | معنی                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                             | مشکل مبدأ رابط کاربری/بافت امن است، نه مشکل انتقال CDP                                                                                                                                                        |
| `token_missing`                                                                        | مشکل پیکربندی احراز هویت                                                                                                                                                                                       |
| `pairing required`                                                                     | مشکل تأیید دستگاه                                                                                                                                                                                             |
| `Remote CDP for profile "remote" is not reachable`                                     | WSL2 نمی‌تواند به `cdpUrl` پیکربندی‌شده دسترسی پیدا کند                                                                                                                                                        |
| پاسخ خالی CDP / `other side closed` از طریق portproxy                                  | ناهماهنگی شنوندهٔ Windows یا حلقهٔ خودارجاع؛ هر دو خانوادهٔ loopback و خروجی `netsh interface portproxy show all` را بررسی کنید                                                                                |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | نقطهٔ پایانی HTTP پاسخ داده است، اما WebSocket مربوط به DevTools باز نشده است                                                                                                                                 |
| نمای منقضی‌شده / تنظیمات حالت تاریک / زبان / آفلاین پس از یک نشست راه‌دور              | برای بستن نشست و آزادسازی اتصال ذخیره‌شدهٔ Playwright/CDP بدون راه‌اندازی مجدد Gateway یا مرورگر خارجی، `openclaw browser --browser-profile remote stop` را اجرا کنید                                           |
| پایان مهلت در حدود `remoteCdpTimeoutMs` (پیش‌فرض 1500ms)                               | معمولاً همچنان مشکل دسترسی به CDP یا کندبودن/دردسترس‌نبودن نقطهٔ پایانی راه‌دور است                                                                                                                           |
| `Playwright page enumeration timed out after 3000ms`                                   | CDP راه‌دور متصل شده است، اما خواندن پایدار زبانه‌های آن متوقف شده است؛ مهلت برابر با مقدار بزرگ‌تر میان `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` است                                               |
| `No Chrome tabs found for profile="user"`                                              | پروفایل محلی Chrome MCP در جایی انتخاب شده است که هیچ زبانهٔ محلیِ میزبان در دسترس نیست                                                                                                                        |

## فهرست بررسی عیب‌یابی سریع

1. Windows: کدام‌یک از `127.0.0.1` یا `[::1]` روی `/json/version` پاسخ می‌دهد و آیا آن شنونده متعلق به `chrome.exe` است؟
2. WSL2: آیا `curl http://WINDOWS_HOST_OR_IP:9222/json/version` کار می‌کند؟
3. پیکربندی OpenClaw: آیا `browser.profiles.<name>.cdpUrl` دقیقاً از همان نشانیِ قابل‌دسترسی از WSL2 استفاده می‌کند؟
4. Control UI: آیا به‌جای IP شبکهٔ محلی، `http://127.0.0.1:18789/` را باز می‌کنید؟
5. آیا به‌جای CDP خام و راه‌دور، تلاش می‌کنید از `existing-session` میان WSL2 و Windows استفاده کنید؟

ابتدا نقطهٔ پایانی Chrome روی Windows را به‌صورت محلی بررسی کنید، سپس همان نقطهٔ پایانی را از WSL2 بررسی کنید و فقط پس از آن به عیب‌یابی پیکربندی OpenClaw یا احراز هویت Control UI بپردازید.

## مطالب مرتبط

- [مرورگر](/fa/tools/browser)
- [ورود به مرورگر](/fa/tools/browser-login)
- [عیب‌یابی مرورگر در Linux](/fa/tools/browser-linux-troubleshooting)
