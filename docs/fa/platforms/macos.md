---
read_when:
    - پیاده‌سازی قابلیت‌های برنامه macOS
    - تغییر چرخهٔ حیات Gateway یا پل‌زنی Node در macOS
summary: برنامه همراه macOS برای OpenClaw (نوار منو + واسط Gateway)
title: برنامه macOS
x-i18n:
    generated_at: "2026-06-27T18:08:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

برنامه macOS، **همراه نوار منو** برای OpenClaw است. این برنامه مالک مجوزهاست،
Gateway را به‌صورت محلی مدیریت می‌کند یا به آن متصل می‌شود (launchd یا دستی)، و قابلیت‌های macOS
را به‌عنوان یک گره در اختیار عامل قرار می‌دهد.

## چه کار می‌کند

- اعلان‌های بومی و وضعیت را در نوار منو نشان می‌دهد.
- مالک درخواست‌های TCC است (اعلان‌ها، دسترسی‌پذیری، ضبط صفحه، میکروفون،
  تشخیص گفتار، Automation/AppleScript).
- Gateway را اجرا می‌کند یا به آن متصل می‌شود (محلی یا راه‌دور).
- ابزارهای مخصوص macOS را ارائه می‌کند (Canvas، Camera، Screen Recording، `system.run`).
- سرویس میزبان گره محلی را در حالت **راه‌دور** شروع می‌کند (launchd)، و در حالت **محلی** آن را متوقف می‌کند.
- در صورت نیاز **PeekabooBridge** را برای خودکارسازی UI میزبانی می‌کند.
- CLI سراسری (`openclaw`) را بنا به درخواست از طریق npm، pnpm، یا bun نصب می‌کند (برنامه ابتدا npm، سپس pnpm، سپس bun را ترجیح می‌دهد؛ Node همچنان runtime پیشنهادی Gateway است).

## حالت محلی در برابر راه‌دور

- **محلی** (پیش‌فرض): برنامه در صورت وجود، به یک Gateway محلی در حال اجرا متصل می‌شود؛
  در غیر این صورت سرویس launchd را از طریق `openclaw gateway install` فعال می‌کند.
- **راه‌دور**: برنامه از طریق SSH/Tailscale به یک Gateway متصل می‌شود و هرگز
  یک فرایند محلی را شروع نمی‌کند.
  برنامه سرویس **میزبان گره** محلی را شروع می‌کند تا Gateway راه‌دور بتواند به این Mac دسترسی پیدا کند.
  برنامه Gateway را به‌عنوان فرایند فرزند اجرا نمی‌کند.
  کشف Gateway اکنون نام‌های Tailscale MagicDNS را به IPهای خام tailnet ترجیح می‌دهد،
  بنابراین برنامه Mac هنگام تغییر IPهای tailnet با اطمینان بیشتری بازیابی می‌شود.

## کنترل launchd

برنامه یک LaunchAgent برای هر کاربر با برچسب `ai.openclaw.gateway`
(یا هنگام استفاده از `--profile`/`OPENCLAW_PROFILE`، با `ai.openclaw.<profile>`؛ شکل قدیمی `com.openclaw.*` همچنان unload می‌شود) را مدیریت می‌کند.

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

هنگام اجرای یک پروفایل نام‌دار، برچسب را با `ai.openclaw.<profile>` جایگزین کنید.

اگر LaunchAgent نصب نشده است، آن را از برنامه فعال کنید یا
`openclaw gateway install` را اجرا کنید.

اگر Gateway بارها برای چند دقیقه تا چند ساعت ناپدید می‌شود و فقط وقتی Control UI را لمس می‌کنید یا با SSH وارد میزبان می‌شوید از سر گرفته می‌شود، یادداشت عیب‌یابی مربوط به macOS Maintenance Sleep / کرش‌های `ENETDOWN` و دروازه محافظت در برابر respawn در launchd را در [عیب‌یابی Gateway](/fa/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard) ببینید.

## قابلیت‌های Node (Mac)

برنامه macOS خود را به‌عنوان یک گره معرفی می‌کند. فرمان‌های رایج:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

گره یک نگاشت `permissions` گزارش می‌کند تا عامل‌ها بتوانند تصمیم بگیرند چه چیزی مجاز است.

سرویس Node + IPC برنامه:

- وقتی سرویس میزبان گره headless در حال اجراست (حالت راه‌دور)، به‌عنوان یک گره به Gateway WS متصل می‌شود.
- `system.run` در برنامه macOS (بافت UI/TCC) از طریق یک سوکت Unix محلی اجرا می‌شود؛ درخواست‌ها و خروجی درون برنامه می‌مانند.

نمودار (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## تأییدهای اجرا (system.run)

`system.run` توسط **تأییدهای اجرا** در برنامه macOS کنترل می‌شود (Settings → Exec approvals).
امنیت + درخواست + فهرست مجاز به‌صورت محلی روی Mac در این مسیر ذخیره می‌شوند:

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

- ورودی‌های `allowlist` الگوهای glob برای مسیرهای دودویی resolve‌شده هستند، یا نام‌های فرمان بدون مسیر برای فرمان‌هایی که از طریق PATH فراخوانی می‌شوند.
- متن خام فرمان shell که شامل کنترل shell یا نحو گسترش باشد (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) به‌عنوان عدم تطابق با allowlist در نظر گرفته می‌شود و به تأیید صریح نیاز دارد (یا باید دودویی shell در allowlist قرار گیرد).
- انتخاب «Always Allow» در درخواست، آن فرمان را به allowlist اضافه می‌کند.
- overrideهای محیطی `system.run` پالایش می‌شوند (`PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` حذف می‌شوند) و سپس با محیط برنامه ادغام می‌شوند.
- برای wrapperهای shell (`bash|sh|zsh ... -c/-lc`)، overrideهای محیطی در محدوده درخواست به یک allowlist کوچک و صریح کاهش می‌یابند (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- برای تصمیم‌های همیشه‌مجاز در حالت allowlist، wrapperهای dispatch شناخته‌شده (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) به‌جای مسیرهای wrapper، مسیرهای اجرایی داخلی را پایدار می‌کنند. اگر بازکردن wrapper ایمن نباشد، هیچ ورودی allowlist به‌صورت خودکار پایدار نمی‌شود.

## پیوندهای عمیق

برنامه طرح URL با نام `openclaw://` را برای کنش‌های محلی ثبت می‌کند.

### `openclaw://agent`

یک درخواست `agent` در Gateway را راه‌اندازی می‌کند.
__OC_I18N_900004__
پارامترهای query:

- `message` (ضروری)
- `sessionKey` (اختیاری)
- `thinking` (اختیاری)
- `deliver` / `to` / `channel` (اختیاری)
- `timeoutSeconds` (اختیاری)
- `key` (کلید حالت بدون نظارت، اختیاری)

ایمنی:

- بدون `key`، برنامه برای تأیید درخواست نشان می‌دهد.
- بدون `key`، برنامه برای درخواست تأیید یک محدودیت کوتاه پیام اعمال می‌کند و `deliver` / `to` / `channel` را نادیده می‌گیرد.
- با یک `key` معتبر، اجرا بدون نظارت است (برای خودکارسازی‌های شخصی در نظر گرفته شده است).

## جریان راه‌اندازی اولیه (معمول)

1. **OpenClaw.app** را نصب و اجرا کنید.
2. چک‌لیست مجوزها را کامل کنید (درخواست‌های TCC).
3. مطمئن شوید حالت **محلی** فعال است و Gateway در حال اجراست.
4. اگر دسترسی ترمینال می‌خواهید، CLI را نصب کنید.

## محل قرارگیری پوشه وضعیت (macOS)

از قرار دادن پوشه وضعیت OpenClaw در iCloud یا دیگر پوشه‌های همگام‌سازی‌شده با ابر خودداری کنید.
مسیرهای متکی به همگام‌سازی می‌توانند تأخیر اضافه کنند و گاهی باعث رقابت‌های قفل فایل/همگام‌سازی برای
نشست‌ها و اعتبارنامه‌ها شوند.

یک مسیر وضعیت محلی و همگام‌سازی‌نشده مانند این را ترجیح دهید:
__OC_I18N_900005__
اگر `openclaw doctor` وضعیت را زیر این مسیرها تشخیص دهد:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

هشدار می‌دهد و توصیه می‌کند به یک مسیر محلی برگردید.

## فرایند build و توسعه (بومی)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (یا Xcode)
- بسته‌بندی برنامه: `scripts/package-mac-app.sh`

## اشکال‌زدایی اتصال Gateway (CLI در macOS)

از CLI اشکال‌زدایی استفاده کنید تا همان handshake وب‌سوکت Gateway و منطق کشف
مورد استفاده برنامه macOS را بدون اجرای برنامه تمرین کنید.
__OC_I18N_900006__
گزینه‌های اتصال:

- `--url <ws://host:port>`: نادیده گرفتن پیکربندی
- `--mode <local|remote>`: resolve از پیکربندی (پیش‌فرض: پیکربندی یا محلی)
- `--probe`: اجبار به health probe تازه
- `--timeout <ms>`: مهلت درخواست (پیش‌فرض: `15000`)
- `--json`: خروجی ساخت‌یافته برای مقایسه diff

گزینه‌های کشف:

- `--include-local`: شامل کردن Gatewayهایی که به‌عنوان «محلی» فیلتر می‌شدند
- `--timeout <ms>`: پنجره کلی کشف (پیش‌فرض: `2000`)
- `--json`: خروجی ساخت‌یافته برای مقایسه diff

<Tip>
با `openclaw gateway discover --json` مقایسه کنید تا ببینید آیا خط لوله کشف برنامه macOS (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، همراه با fallbackهای wide-area و Tailscale Serve) با کشف مبتنی بر `dns-sd` در CLI مبتنی بر Node تفاوت دارد یا نه.
</Tip>

## لوله‌کشی اتصال راه‌دور (تونل‌های SSH)

وقتی برنامه macOS در حالت **راه‌دور** اجرا می‌شود، یک تونل SSH باز می‌کند تا مؤلفه‌های UI محلی
بتوانند با یک Gateway راه‌دور طوری صحبت کنند که انگار روی localhost است.

### تونل کنترل (درگاه وب‌سوکت Gateway)

- **هدف:** health checkها، وضعیت، Web Chat، پیکربندی، و دیگر فراخوانی‌های control-plane.
- **درگاه محلی:** درگاه Gateway (پیش‌فرض `18789`)، همیشه پایدار.
- **درگاه راه‌دور:** همان درگاه Gateway روی میزبان راه‌دور.
- **رفتار:** بدون درگاه محلی تصادفی؛ برنامه از یک تونل سالم موجود دوباره استفاده می‌کند
  یا در صورت نیاز آن را راه‌اندازی مجدد می‌کند.
- **شکل SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` همراه با BatchMode +
  ExitOnForwardFailure + گزینه‌های keepalive.
- **گزارش IP:** تونل SSH از loopback استفاده می‌کند، بنابراین gateway، IP گره
  را به‌صورت `127.0.0.1` خواهد دید. اگر می‌خواهید IP واقعی کلاینت ظاهر شود، از انتقال **Direct (ws/wss)** استفاده کنید (نگاه کنید به [دسترسی راه‌دور macOS](/fa/platforms/mac/remote)).

برای مراحل راه‌اندازی، [دسترسی راه‌دور macOS](/fa/platforms/mac/remote) را ببینید. برای جزئیات پروتکل،
[پروتکل Gateway](/fa/gateway/protocol) را ببینید.

## اسناد مرتبط

- [راهنمای اجرایی Gateway](/fa/gateway)
- [Gateway (macOS)](/fa/platforms/mac/bundled-gateway)
- [مجوزهای macOS](/fa/platforms/mac/permissions)
- [Canvas](/fa/platforms/mac/canvas)
