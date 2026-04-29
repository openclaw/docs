---
read_when:
    - پیاده‌سازی ویژگی‌های برنامه macOS
    - تغییر چرخهٔ عمر Gateway یا پل‌سازی Node در macOS
summary: برنامه همراه macOS برای OpenClaw (نوار منو + کارگزار Gateway)
title: برنامهٔ macOS
x-i18n:
    generated_at: "2026-04-29T23:12:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

برنامه macOS، **همراه نوار منو** برای OpenClaw است. این برنامه مجوزها را در اختیار دارد،
Gateway را به‌صورت محلی مدیریت می‌کند یا به آن متصل می‌شود (launchd یا دستی)، و قابلیت‌های
macOS را به‌عنوان یک گره در اختیار عامل قرار می‌دهد.

## چه کار می‌کند

- اعلان‌ها و وضعیت بومی را در نوار منو نمایش می‌دهد.
- مالک درخواست‌های TCC است (Notifications، Accessibility، Screen Recording، Microphone،
  Speech Recognition، Automation/AppleScript).
- Gateway را اجرا می‌کند یا به آن متصل می‌شود (محلی یا راه‌دور).
- ابزارهای مخصوص macOS را ارائه می‌کند (Canvas، Camera، Screen Recording، `system.run`).
- سرویس میزبان گره محلی را در حالت **راه‌دور** (launchd) راه‌اندازی می‌کند، و در حالت **محلی** آن را متوقف می‌کند.
- به‌صورت اختیاری **PeekabooBridge** را برای خودکارسازی UI میزبانی می‌کند.
- در صورت درخواست، CLI سراسری (`openclaw`) را از طریق npm، pnpm، یا bun نصب می‌کند (برنامه ابتدا npm، سپس pnpm، سپس bun را ترجیح می‌دهد؛ Node همچنان runtime پیشنهادی Gateway است).

## حالت محلی در برابر راه‌دور

- **محلی** (پیش‌فرض): اگر Gateway محلی در حال اجرا وجود داشته باشد، برنامه به آن متصل می‌شود؛
  در غیر این صورت سرویس launchd را از طریق `openclaw gateway install` فعال می‌کند.
- **راه‌دور**: برنامه از طریق SSH/Tailscale به یک Gateway متصل می‌شود و هرگز
  یک فرایند محلی را شروع نمی‌کند.
  برنامه سرویس **میزبان گره محلی** را راه‌اندازی می‌کند تا Gateway راه‌دور بتواند به این Mac دسترسی پیدا کند.
  برنامه Gateway را به‌عنوان یک فرایند فرزند اجرا نمی‌کند.
  کشف Gateway اکنون نام‌های Tailscale MagicDNS را به IPهای خام tailnet ترجیح می‌دهد،
  بنابراین برنامه Mac هنگام تغییر IPهای tailnet قابل‌اعتمادتر بازیابی می‌شود.

## کنترل Launchd

برنامه یک LaunchAgent به‌ازای هر کاربر با برچسب `ai.openclaw.gateway`
(یا هنگام استفاده از `--profile`/`OPENCLAW_PROFILE`، با `ai.openclaw.<profile>`؛ برچسب قدیمی `com.openclaw.*` همچنان unload می‌شود) را مدیریت می‌کند.

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

هنگام اجرای یک پروفایل نام‌گذاری‌شده، برچسب را با `ai.openclaw.<profile>` جایگزین کنید.

اگر LaunchAgent نصب نشده است، آن را از برنامه فعال کنید یا اجرا کنید:
`openclaw gateway install`.

## قابلیت‌های Node (mac)

برنامه macOS خود را به‌عنوان یک گره معرفی می‌کند. فرمان‌های رایج:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

گره یک نگاشت `permissions` گزارش می‌کند تا عامل‌ها بتوانند تصمیم بگیرند چه چیزی مجاز است.

سرویس گره + IPC برنامه:

- وقتی سرویس میزبان گره بدون رابط کاربری در حال اجرا است (حالت راه‌دور)، به‌عنوان یک گره به Gateway WS متصل می‌شود.
- `system.run` در برنامه macOS (زمینه UI/TCC) از طریق یک سوکت Unix محلی اجرا می‌شود؛ درخواست‌ها + خروجی داخل برنامه باقی می‌مانند.

نمودار (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## تأییدهای اجرا (system.run)

`system.run` توسط **تأییدهای اجرا** در برنامه macOS کنترل می‌شود (Settings → Exec approvals).
امنیت + پرسش + فهرست مجاز به‌صورت محلی روی Mac در این مسیر ذخیره می‌شوند:

```
~/.openclaw/exec-approvals.json
```

مثال:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

نکته‌ها:

- ورودی‌های `allowlist` الگوهای glob برای مسیرهای باینری resolve‌شده هستند، یا نام‌های فرمان بدون مسیر برای فرمان‌هایی که از طریق PATH فراخوانی می‌شوند.
- متن خام فرمان shell که شامل کنترل shell یا نحو گسترش باشد (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) به‌عنوان عدم‌تطابق با allowlist در نظر گرفته می‌شود و به تأیید صریح نیاز دارد (یا باید باینری shell در allowlist قرار گیرد).
- انتخاب «Always Allow» در درخواست، آن فرمان را به allowlist اضافه می‌کند.
- overrideهای محیطی `system.run` پالایش می‌شوند (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` حذف می‌شوند) و سپس با محیط برنامه ادغام می‌شوند.
- برای wrapperهای shell (`bash|sh|zsh ... -c/-lc`)، overrideهای محیطی در محدوده درخواست به یک allowlist کوچک و صریح کاهش می‌یابند (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- برای تصمیم‌های همیشه‌مجاز در حالت allowlist، wrapperهای dispatch شناخته‌شده (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) به‌جای مسیرهای wrapper، مسیرهای فایل اجرایی داخلی را نگه می‌دارند. اگر بازکردن wrapper ایمن نباشد، هیچ ورودی allowlist به‌صورت خودکار ذخیره نمی‌شود.

## پیوندهای عمیق

برنامه طرح URL‏ `openclaw://` را برای اقدام‌های محلی ثبت می‌کند.

### `openclaw://agent`

یک درخواست `agent` در Gateway را فعال می‌کند.
__OC_I18N_900004__
پارامترهای پرس‌وجو:

- `message` (الزامی)
- `sessionKey` (اختیاری)
- `thinking` (اختیاری)
- `deliver` / `to` / `channel` (اختیاری)
- `timeoutSeconds` (اختیاری)
- `key` (کلید حالت بدون نظارت، اختیاری)

ایمنی:

- بدون `key`، برنامه برای تأیید درخواست می‌دهد.
- بدون `key`، برنامه برای درخواست تأیید یک محدودیت کوتاه پیام اعمال می‌کند و `deliver` / `to` / `channel` را نادیده می‌گیرد.
- با یک `key` معتبر، اجرا بدون نظارت است (برای خودکارسازی‌های شخصی در نظر گرفته شده است).

## جریان آغازبه‌کار (معمول)

1. **OpenClaw.app** را نصب و اجرا کنید.
2. چک‌لیست مجوزها را کامل کنید (درخواست‌های TCC).
3. مطمئن شوید حالت **محلی** فعال است و Gateway در حال اجرا است.
4. اگر دسترسی ترمینال می‌خواهید، CLI را نصب کنید.

## محل قرارگیری دایرکتوری وضعیت (macOS)

از قرار دادن دایرکتوری وضعیت OpenClaw در iCloud یا پوشه‌های همگام‌سازی‌شده ابری دیگر خودداری کنید.
مسیرهای پشتیبانی‌شده با همگام‌سازی می‌توانند تأخیر اضافه کنند و گاهی باعث رقابت‌های قفل فایل/همگام‌سازی برای
نشست‌ها و اعتبارنامه‌ها شوند.

یک مسیر وضعیت محلی و غیرهمگام‌سازی‌شده را ترجیح دهید، مانند:
__OC_I18N_900005__
اگر `openclaw doctor` وضعیت را در این مسیرها تشخیص دهد:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

هشدار می‌دهد و توصیه می‌کند به یک مسیر محلی برگردید.

## گردش‌کار ساخت و توسعه (بومی)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (یا Xcode)
- بسته‌بندی برنامه: `scripts/package-mac-app.sh`

## اشکال‌زدایی اتصال Gateway (CLI در macOS)

از CLI اشکال‌زدایی برای آزمایش همان handshake و منطق کشف WebSocket در Gateway
که برنامه macOS استفاده می‌کند بهره ببرید، بدون اینکه برنامه را اجرا کنید.
__OC_I18N_900006__
گزینه‌های اتصال:

- `--url <ws://host:port>`: override کردن پیکربندی
- `--mode <local|remote>`: resolve از پیکربندی (پیش‌فرض: پیکربندی یا محلی)
- `--probe`: اجبار به یک health probe تازه
- `--timeout <ms>`: timeout درخواست (پیش‌فرض: `15000`)
- `--json`: خروجی ساختاریافته برای مقایسه diff

گزینه‌های کشف:

- `--include-local`: شامل کردن Gatewayهایی که به‌عنوان «محلی» فیلتر می‌شدند
- `--timeout <ms>`: پنجره کلی کشف (پیش‌فرض: `2000`)
- `--json`: خروجی ساختاریافته برای مقایسه diff

<Tip>
با `openclaw gateway discover --json` مقایسه کنید تا ببینید آیا pipeline کشف برنامه macOS (`local.` به‌همراه دامنه wide-area پیکربندی‌شده، با fallbackهای wide-area و Tailscale Serve) با کشف مبتنی بر `dns-sd` در Node CLI تفاوت دارد یا نه.
</Tip>

## لوله‌کشی اتصال راه‌دور (تونل‌های SSH)

وقتی برنامه macOS در حالت **راه‌دور** اجرا می‌شود، یک تونل SSH باز می‌کند تا مؤلفه‌های UI محلی
بتوانند با یک Gateway راه‌دور طوری صحبت کنند که انگار روی localhost است.

### تونل کنترل (درگاه WebSocket Gateway)

- **هدف:** health checkها، وضعیت، Web Chat، پیکربندی، و دیگر فراخوانی‌های control-plane.
- **درگاه محلی:** درگاه Gateway (پیش‌فرض `18789`)، همیشه پایدار.
- **درگاه راه‌دور:** همان درگاه Gateway روی میزبان راه‌دور.
- **رفتار:** بدون درگاه محلی تصادفی؛ برنامه از تونل سالم موجود دوباره استفاده می‌کند
  یا در صورت نیاز آن را بازراه‌اندازی می‌کند.
- **شکل SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` با BatchMode +
  ExitOnForwardFailure + گزینه‌های keepalive.
- **گزارش IP:** تونل SSH از loopback استفاده می‌کند، بنابراین gateway، IP گره را
  به‌صورت `127.0.0.1` خواهد دید. اگر می‌خواهید IP واقعی کلاینت نمایش داده شود، از انتقال **مستقیم (ws/wss)** استفاده کنید
  (ببینید [دسترسی راه‌دور macOS](/fa/platforms/mac/remote)).

برای مراحل راه‌اندازی، ببینید [دسترسی راه‌دور macOS](/fa/platforms/mac/remote). برای جزئیات protocol،
ببینید [protocol Gateway](/fa/gateway/protocol).

## مستندات مرتبط

- [runbook Gateway](/fa/gateway)
- [Gateway (macOS)](/fa/platforms/mac/bundled-gateway)
- [مجوزهای macOS](/fa/platforms/mac/permissions)
- [Canvas](/fa/platforms/mac/canvas)
