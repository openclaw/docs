---
read_when:
    - اجرای OpenClaw Gateway در WSL2، در حالی که Chrome روی Windows اجرا می‌شود
    - مشاهدهٔ خطاهای هم‌پوشان مرورگر/رابط کاربری کنترل در WSL2 و Windows
    - تصمیم‌گیری بین MCP کرومِ محلیِ میزبان و CDP خامِ راه دور در پیکربندی‌های میزبانِ تفکیک‌شده
summary: عیب‌یابی لایه‌ای WSL2 Gateway + CDP راه‌دور Chrome در Windows
title: عیب‌یابی WSL2 + Windows + CDP راه‌دور Chrome
x-i18n:
    generated_at: "2026-04-29T23:39:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

در چیدمان رایج میزبانِ جداگانه، OpenClaw Gateway داخل WSL2 اجرا می‌شود، Chrome روی Windows اجرا می‌شود، و کنترل مرورگر باید از مرز WSL2 و Windows عبور کند. الگوی خرابی لایه‌ای از [issue #39369](https://github.com/openclaw/openclaw/issues/39369) یعنی چند مشکل مستقل می‌توانند هم‌زمان ظاهر شوند، که باعث می‌شود ابتدا لایه‌ی اشتباه خراب به نظر برسد.

## ابتدا حالت مرورگر درست را انتخاب کنید

دو الگوی معتبر دارید:

### گزینه ۱: CDP خام از راه دور از WSL2 به Windows

از یک پروفایل مرورگر از راه دور استفاده کنید که از WSL2 به یک endpoint مربوط به Chrome CDP در Windows اشاره می‌کند.

این گزینه را زمانی انتخاب کنید که:

- Gateway داخل WSL2 باقی می‌ماند
- Chrome روی Windows اجرا می‌شود
- باید کنترل مرورگر از مرز WSL2/Windows عبور کند

### گزینه ۲: Chrome MCP محلیِ میزبان

فقط زمانی از `existing-session` / `user` استفاده کنید که خود Gateway روی همان میزبانی اجرا می‌شود که Chrome روی آن است.

این گزینه را زمانی انتخاب کنید که:

- OpenClaw و Chrome روی یک ماشین هستند
- وضعیت مرورگر محلیِ واردشده را می‌خواهید
- به انتقال مرورگر بین میزبان‌ها نیاز ندارید
- به مسیرهای پیشرفته‌ی مدیریت‌شده/فقط-CDP-خام مثل `responsebody`، خروجی
  PDF، رهگیری دانلود، یا عملیات دسته‌ای نیاز ندارید

برای WSL2 Gateway + Windows Chrome، CDP خام از راه دور را ترجیح دهید. Chrome MCP محلیِ میزبان است، نه پلی از WSL2 به Windows.

## معماری کاری

شکل مرجع:

- WSL2 Gateway را روی `127.0.0.1:18789` اجرا می‌کند
- Windows رابط Control UI را در یک مرورگر عادی در `http://127.0.0.1:18789/` باز می‌کند
- Windows Chrome یک endpoint مربوط به CDP را روی پورت `9222` ارائه می‌کند
- WSL2 می‌تواند به آن endpoint مربوط به CDP در Windows دسترسی پیدا کند
- OpenClaw یک پروفایل مرورگر را به آدرسی اشاره می‌دهد که از WSL2 قابل دسترسی است

## چرا این چیدمان گیج‌کننده است

چند خرابی می‌توانند هم‌پوشانی داشته باشند:

- WSL2 نمی‌تواند به endpoint مربوط به CDP در Windows دسترسی پیدا کند
- Control UI از یک origin غیرامن باز شده است
- `gateway.controlUi.allowedOrigins` با origin صفحه مطابقت ندارد
- token یا جفت‌سازی وجود ندارد
- پروفایل مرورگر به آدرس اشتباه اشاره می‌کند

به همین دلیل، اصلاح یک لایه همچنان می‌تواند خطای متفاوتی را قابل مشاهده باقی بگذارد.

## قانون حیاتی برای Control UI

وقتی UI از Windows باز می‌شود، از localhost ویندوز استفاده کنید مگر اینکه چیدمان HTTPS عمدی داشته باشید.

استفاده کنید از:

`http://127.0.0.1:18789/`

برای Control UI به‌صورت پیش‌فرض از IP شبکه LAN استفاده نکنید. HTTP ساده روی یک آدرس LAN یا tailnet می‌تواند رفتار insecure-origin/device-auth را فعال کند که به خود CDP ربطی ندارد. [Control UI](/fa/web/control-ui) را ببینید.

## لایه‌به‌لایه اعتبارسنجی کنید

از بالا به پایین کار کنید. جلوتر نپرید.

### لایه ۱: بررسی کنید Chrome روی Windows در حال ارائه‌ی CDP است

Chrome را روی Windows با remote debugging فعال اجرا کنید:

```powershell
chrome.exe --remote-debugging-port=9222
```

از Windows، ابتدا خود Chrome را بررسی کنید:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

اگر این مورد روی Windows شکست بخورد، OpenClaw هنوز مشکل نیست.

### لایه ۲: بررسی کنید WSL2 می‌تواند به آن endpoint در Windows دسترسی پیدا کند

از WSL2، همان آدرس دقیقی را که قصد دارید در `cdpUrl` استفاده کنید آزمایش کنید:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

نتیجه‌ی خوب:

- `/json/version` یک JSON با فراداده‌ی Browser / Protocol-Version برمی‌گرداند
- `/json/list` یک JSON برمی‌گرداند (اگر هیچ صفحه‌ای باز نیست، آرایه‌ی خالی هم قابل قبول است)

اگر این مورد شکست بخورد:

- Windows هنوز پورت را برای WSL2 ارائه نمی‌کند
- آدرس برای سمت WSL2 اشتباه است
- firewall / port forwarding / local proxying هنوز وجود ندارد

قبل از دست زدن به پیکربندی OpenClaw، این را اصلاح کنید.

### لایه ۳: پروفایل مرورگر درست را پیکربندی کنید

برای CDP خام از راه دور، OpenClaw را به آدرسی اشاره دهید که از WSL2 قابل دسترسی است:

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

- از آدرس قابل دسترسی از WSL2 استفاده کنید، نه چیزی که فقط روی Windows کار می‌کند
- برای مرورگرهای مدیریت‌شده‌ی خارجی، `attachOnly: true` را نگه دارید
- `cdpUrl` می‌تواند `http://`، `https://`، `ws://`، یا `wss://` باشد
- وقتی می‌خواهید OpenClaw بتواند `/json/version` را کشف کند، از HTTP(S) استفاده کنید
- فقط زمانی از WS(S) استفاده کنید که ارائه‌دهنده‌ی مرورگر یک URL مستقیم DevTools socket به شما می‌دهد
- قبل از اینکه انتظار موفقیت از OpenClaw داشته باشید، همان URL را با `curl` آزمایش کنید

### لایه ۴: لایه‌ی Control UI را جداگانه بررسی کنید

UI را از Windows باز کنید:

`http://127.0.0.1:18789/`

سپس بررسی کنید:

- origin صفحه با چیزی که `gateway.controlUi.allowedOrigins` انتظار دارد مطابقت دارد
- token auth یا جفت‌سازی درست پیکربندی شده است
- مشکل احراز هویت Control UI را طوری اشکال‌زدایی نمی‌کنید که انگار مشکل مرورگر است

صفحه‌ی مفید:

- [Control UI](/fa/web/control-ui)

### لایه ۵: کنترل مرورگر را از ابتدا تا انتها بررسی کنید

از WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

نتیجه‌ی خوب:

- زبانه در Windows Chrome باز می‌شود
- `openclaw browser tabs` هدف را برمی‌گرداند
- عملیات بعدی (`snapshot`، `screenshot`، `navigate`) از همان پروفایل کار می‌کنند

## خطاهای رایج گمراه‌کننده

هر پیام را به‌عنوان سرنخی مخصوص یک لایه در نظر بگیرید:

- `control-ui-insecure-auth`
  - مشکل origin رابط UI / secure-context است، نه مشکل انتقال CDP
- `token_missing`
  - مشکل پیکربندی احراز هویت است
- `pairing required`
  - مشکل تأیید دستگاه است
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 نمی‌تواند به `cdpUrl` پیکربندی‌شده دسترسی پیدا کند
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - endpoint مربوط به HTTP پاسخ داده است، اما DevTools WebSocket همچنان نتوانسته باز شود
- بازنویسی‌های قدیمی viewport / dark-mode / locale / offline پس از یک نشست از راه دور
  - `openclaw browser stop --browser-profile remote` را اجرا کنید
  - این نشست کنترل فعال را می‌بندد و وضعیت شبیه‌سازی Playwright/CDP را بدون راه‌اندازی دوباره‌ی gateway یا مرورگر خارجی آزاد می‌کند
- `gateway timeout after 1500ms`
  - اغلب همچنان مربوط به قابل دسترسی بودن CDP یا یک endpoint از راه دور کند/غیرقابل دسترسی است
- `No Chrome tabs found for profile="user"`
  - پروفایل محلی Chrome MCP انتخاب شده، در حالی که هیچ زبانه‌ی محلیِ میزبان در دسترس نیست

## چک‌لیست سریع تریاژ

1. Windows: آیا `curl http://127.0.0.1:9222/json/version` کار می‌کند؟
2. WSL2: آیا `curl http://WINDOWS_HOST_OR_IP:9222/json/version` کار می‌کند؟
3. پیکربندی OpenClaw: آیا `browser.profiles.<name>.cdpUrl` از همان آدرس دقیق قابل دسترسی از WSL2 استفاده می‌کند؟
4. Control UI: آیا به‌جای IP شبکه LAN، `http://127.0.0.1:18789/` را باز می‌کنید؟
5. آیا تلاش می‌کنید به‌جای CDP خام از راه دور، از `existing-session` در میان WSL2 و Windows استفاده کنید؟

## نتیجه‌ی عملی

این چیدمان معمولاً عملی است. بخش سخت این است که انتقال مرورگر، امنیت origin در Control UI، و token/جفت‌سازی هرکدام می‌توانند مستقل از هم شکست بخورند، در حالی که از سمت کاربر شبیه به هم به نظر می‌رسند.

وقتی شک دارید:

- ابتدا endpoint مربوط به Windows Chrome را به‌صورت محلی بررسی کنید
- سپس همان endpoint را از WSL2 بررسی کنید
- فقط بعد از آن پیکربندی OpenClaw یا احراز هویت Control UI را اشکال‌زدایی کنید

## مرتبط

- [مرورگر](/fa/tools/browser)
- [ورود به مرورگر](/fa/tools/browser-login)
- [عیب‌یابی مرورگر Linux](/fa/tools/browser-linux-troubleshooting)
