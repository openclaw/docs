---
read_when:
    - پیاده‌سازی قابلیت‌های برنامهٔ macOS
    - تغییر چرخهٔ حیات Gateway یا پل‌زنی Node در macOS
summary: برنامهٔ همراه macOS برای OpenClaw (نوار منو + کارگزار Gateway)
title: برنامه macOS
x-i18n:
    generated_at: "2026-05-06T09:31:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

برنامه macOS، **همراه نوار منو** برای OpenClaw است. این برنامه مالک مجوزهاست،
Gateway را به‌صورت محلی مدیریت می‌کند/به آن متصل می‌شود (launchd یا دستی)، و قابلیت‌های macOS
را به‌عنوان یک Node در اختیار عامل قرار می‌دهد.

## چه کاری انجام می‌دهد

- اعلان‌های بومی و وضعیت را در نوار منو نشان می‌دهد.
- مالک اعلان‌های TCC است (اعلان‌ها، دسترس‌پذیری، ضبط صفحه، میکروفون،
  تشخیص گفتار، Automation/AppleScript).
- Gateway را اجرا می‌کند یا به آن وصل می‌شود (محلی یا راه‌دور).
- ابزارهای مخصوص macOS را ارائه می‌کند (Canvas، Camera، Screen Recording، `system.run`).
- سرویس میزبان Node محلی را در حالت **راه‌دور** (launchd) شروع می‌کند، و آن را در حالت **محلی** متوقف می‌کند.
- به‌صورت اختیاری **PeekabooBridge** را برای خودکارسازی UI میزبانی می‌کند.
- CLI سراسری (`openclaw`) را در صورت درخواست از طریق npm، pnpm، یا bun نصب می‌کند (برنامه ابتدا npm، سپس pnpm، و بعد bun را ترجیح می‌دهد؛ Node همچنان زمان‌اجرای پیشنهادی Gateway است).

## حالت محلی در برابر راه‌دور

- **محلی** (پیش‌فرض): اگر Gateway محلی در حال اجرا وجود داشته باشد، برنامه به آن متصل می‌شود؛
  در غیر این صورت سرویس launchd را از طریق `openclaw gateway install` فعال می‌کند.
- **راه‌دور**: برنامه از طریق SSH/Tailscale به یک Gateway وصل می‌شود و هرگز
  یک فرایند محلی را شروع نمی‌کند.
  برنامه سرویس **میزبان Node** محلی را شروع می‌کند تا Gateway راه‌دور بتواند به این Mac دسترسی پیدا کند.
  برنامه Gateway را به‌عنوان فرایند فرزند اجرا نمی‌کند.
  کشف Gateway اکنون نام‌های Tailscale MagicDNS را به IPهای خام tailnet ترجیح می‌دهد،
  بنابراین برنامه Mac هنگام تغییر IPهای tailnet قابل‌اعتمادتر بازیابی می‌شود.

## کنترل Launchd

برنامه یک LaunchAgent برای هر کاربر با برچسب `ai.openclaw.gateway`
(یا `ai.openclaw.<profile>` هنگام استفاده از `--profile`/`OPENCLAW_PROFILE`؛ `com.openclaw.*` قدیمی همچنان unload می‌شود) را مدیریت می‌کند.

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

هنگام اجرای یک پروفایل نام‌گذاری‌شده، برچسب را با `ai.openclaw.<profile>` جایگزین کنید.

اگر LaunchAgent نصب نشده است، آن را از داخل برنامه فعال کنید یا اجرا کنید:
`openclaw gateway install`.

## قابلیت‌های Node (mac)

برنامه macOS خود را به‌عنوان یک Node معرفی می‌کند. دستورهای رایج:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node یک نگاشت `permissions` گزارش می‌کند تا عامل‌ها بتوانند تصمیم بگیرند چه چیزی مجاز است.

سرویس Node + IPC برنامه:

- وقتی سرویس میزبان Node بدون رابط در حال اجراست (حالت راه‌دور)، به Gateway WS به‌عنوان یک Node وصل می‌شود.
- `system.run` در برنامه macOS (زمینه UI/TCC) از طریق یک سوکت Unix محلی اجرا می‌شود؛ اعلان‌ها + خروجی داخل برنامه باقی می‌مانند.

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

نمونه:

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

- ورودی‌های `allowlist` الگوهای glob برای مسیرهای دودویی حل‌شده هستند، یا نام‌های فرمان ساده برای فرمان‌هایی که از PATH فراخوانی می‌شوند.
- متن خام فرمان shell که شامل کنترل shell یا نحو گسترش باشد (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) به‌عنوان نبودن در فهرست مجاز در نظر گرفته می‌شود و نیازمند تأیید صریح است (یا افزودن دودویی shell به فهرست مجاز).
- انتخاب "Always Allow" در اعلان، آن فرمان را به فهرست مجاز اضافه می‌کند.
- بازنویسی‌های محیطی `system.run` پالایش می‌شوند (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` حذف می‌شوند) و سپس با محیط برنامه ادغام می‌شوند.
- برای پوشش‌های shell (`bash|sh|zsh ... -c/-lc`)، بازنویسی‌های محیطی محدود به درخواست به یک فهرست مجاز کوچک و صریح کاهش می‌یابند (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- برای تصمیم‌های اجازه همیشگی در حالت فهرست مجاز، پوشش‌های dispatch شناخته‌شده (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) مسیرهای اجرایی داخلی را به‌جای مسیرهای پوشش ذخیره می‌کنند. اگر بازکردن پوشش امن نباشد، هیچ ورودی فهرست مجازی به‌صورت خودکار ذخیره نمی‌شود.

## لینک‌های عمیق

برنامه scheme URL با نام `openclaw://` را برای کنش‌های محلی ثبت می‌کند.

### `openclaw://agent`

یک درخواست `agent` در Gateway را فعال می‌کند.
__OC_I18N_900004__
پارامترهای query:

- `message` (الزامی)
- `sessionKey` (اختیاری)
- `thinking` (اختیاری)
- `deliver` / `to` / `channel` (اختیاری)
- `timeoutSeconds` (اختیاری)
- `key` (کلید حالت unattended اختیاری)

ایمنی:

- بدون `key`، برنامه برای تأیید درخواست می‌دهد.
- بدون `key`، برنامه یک حد کوتاه برای پیام در اعلان تأیید اعمال می‌کند و `deliver` / `to` / `channel` را نادیده می‌گیرد.
- با یک `key` معتبر، اجرا unattended است (برای خودکارسازی‌های شخصی در نظر گرفته شده است).

## جریان راه‌اندازی اولیه (معمول)

1. **OpenClaw.app** را نصب و اجرا کنید.
2. چک‌لیست مجوزها را کامل کنید (اعلان‌های TCC).
3. مطمئن شوید حالت **محلی** فعال است و Gateway در حال اجراست.
4. اگر دسترسی ترمینال می‌خواهید، CLI را نصب کنید.

## جای‌گذاری دایرکتوری وضعیت (macOS)

از قرار دادن دایرکتوری وضعیت OpenClaw در iCloud یا پوشه‌های دیگری که با cloud همگام می‌شوند خودداری کنید.
مسیرهای متکی به همگام‌سازی می‌توانند تأخیر اضافه کنند و گاهی برای
نشست‌ها و اعتبارنامه‌ها باعث رقابت‌های قفل فایل/همگام‌سازی شوند.

یک مسیر وضعیت محلی و غیرهمگام‌شده مانند زیر را ترجیح دهید:
__OC_I18N_900005__
اگر `openclaw doctor` وضعیت را زیر این مسیرها تشخیص دهد:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

هشدار می‌دهد و توصیه می‌کند به یک مسیر محلی برگردید.

## گردش کار ساخت و توسعه (بومی)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (یا Xcode)
- بسته‌بندی برنامه: `scripts/package-mac-app.sh`

## اشکال‌زدایی اتصال Gateway (CLI در macOS)

از CLI اشکال‌زدایی استفاده کنید تا همان دست‌دهی Gateway WebSocket و منطق کشفی را که برنامه macOS استفاده می‌کند،
بدون اجرای برنامه آزمایش کنید.
__OC_I18N_900006__
گزینه‌های اتصال:

- `--url <ws://host:port>`: بازنویسی پیکربندی
- `--mode <local|remote>`: حل از پیکربندی (پیش‌فرض: پیکربندی یا محلی)
- `--probe`: اجبار به یک health probe تازه
- `--timeout <ms>`: مهلت درخواست (پیش‌فرض: `15000`)
- `--json`: خروجی ساختاریافته برای diff

گزینه‌های کشف:

- `--include-local`: شامل کردن Gatewayهایی که به‌عنوان "local" پالایش می‌شدند
- `--timeout <ms>`: پنجره کلی کشف (پیش‌فرض: `2000`)
- `--json`: خروجی ساختاریافته برای diff

<Tip>
با `openclaw gateway discover --json` مقایسه کنید تا ببینید آیا pipeline کشف برنامه macOS (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، همراه با fallbackهای wide-area و Tailscale Serve) با کشف مبتنی بر `dns-sd` در CLI مربوط به Node تفاوت دارد یا نه.
</Tip>

## لوله‌کشی اتصال راه‌دور (تونل‌های SSH)

وقتی برنامه macOS در حالت **راه‌دور** اجرا می‌شود، یک تونل SSH باز می‌کند تا مؤلفه‌های UI محلی
بتوانند با یک Gateway راه‌دور طوری صحبت کنند که انگار روی localhost است.

### تونل کنترل (درگاه Gateway WebSocket)

- **هدف:** بررسی‌های سلامت، وضعیت، Web Chat، پیکربندی، و سایر فراخوانی‌های control-plane.
- **درگاه محلی:** درگاه Gateway (پیش‌فرض `18789`)، همیشه پایدار.
- **درگاه راه‌دور:** همان درگاه Gateway روی میزبان راه‌دور.
- **رفتار:** بدون درگاه محلی تصادفی؛ برنامه از یک تونل سالم موجود دوباره استفاده می‌کند
  یا در صورت نیاز آن را راه‌اندازی مجدد می‌کند.
- **شکل SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` با BatchMode +
  ExitOnForwardFailure + گزینه‌های keepalive.
- **گزارش IP:** تونل SSH از loopback استفاده می‌کند، بنابراین Gateway، IP مربوط به Node را
  به‌صورت `127.0.0.1` خواهد دید. اگر می‌خواهید IP واقعی client ظاهر شود، از انتقال **Direct (ws/wss)** استفاده کنید
  (ببینید [دسترسی راه‌دور macOS](/fa/platforms/mac/remote)).

برای مراحل راه‌اندازی، ببینید [دسترسی راه‌دور macOS](/fa/platforms/mac/remote). برای جزئیات پروتکل،
ببینید [پروتکل Gateway](/fa/gateway/protocol).

## مستندات مرتبط

- [runbook Gateway](/fa/gateway)
- [Gateway (macOS)](/fa/platforms/mac/bundled-gateway)
- [مجوزهای macOS](/fa/platforms/mac/permissions)
- [Canvas](/fa/platforms/mac/canvas)
