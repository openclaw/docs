---
read_when:
    - نصب OpenClaw در Windows
    - انتخاب بین Windows Hub، ویندوز بومی و WSL2
    - راه‌اندازی برنامه همراه Windows یا حالت Node در Windows
summary: 'پشتیبانی از Windows: Windows Hub، CLI و Gateway بومی، راه‌اندازی Gateway در WSL2، حالت Node و عیب‌یابی'
title: ویندوز
x-i18n:
    generated_at: "2026-07-16T16:51:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw یک برنامه همراه بومی **Windows Hub** به‌علاوه پشتیبانی CLI ویندوز ارائه می‌کند.
برای بهره‌مندی از یک برنامه دسکتاپ شامل راه‌اندازی، وضعیت سینی سیستم، گفت‌وگو، عیب‌یابی Command
Center و قابلیت‌های Node ویندوز، از Windows Hub استفاده کنید. برای استفاده مستقیم از CLI/Gateway،
از نصب‌کننده PowerShell استفاده کنید. برای سازگارترین محیط اجرای Gateway
با لینوکس، از WSL2 استفاده کنید.

## توصیه‌شده: Windows Hub

Windows Hub برنامه همراه بومی WinUI برای Windows 10 20H2+ و
Windows 11 است. بدون دسترسی مدیر نصب می‌شود و نصب‌کننده‌های امضاشده x64
و ARM64 را در صفحه انتشار مستقل خود ارائه می‌کند.

Windows Hub مستقل از CLI و Gateway متعلق به OpenClaw منتشر می‌شود. جدیدترین
نصب‌کننده پایدار Hub را از
[صفحه انتشارهای Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
یا مستقیماً از طریق `releases/latest/download` دریافت کنید:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

اگر یکی از پیوندهای بالا خطای 404 داد، به [صفحه انتشارهای Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
بروید و جدیدترین انتشار پایدار Windows Hub را باز کنید. انتشارهای پایدار معمول OpenClaw
نیز یک بیلد ثابت و اعتبارسنجی‌شده هنگام انتشار از Windows Hub را آینه می‌کنند؛ این آینه ممکن است از
یک انتشار مستقل جدیدتر Hub عقب‌تر باشد.

پس از نصب، **OpenClaw Companion** را از منوی Start یا سینی
سیستم اجرا کنید. نصب‌کننده میان‌برهایی نیز برای Gateway Setup، Chat، Settings،
Check for Updates و حذف نصب اضافه می‌کند.

### امکانات Windows Hub

- وضعیت سینی سیستم و اجرا هنگام ورود.
- راه‌اندازی اولیه برای یک WSL Gateway محلی متعلق به برنامه.
- تنظیمات اتصال برای Gatewayهای محلی، راه‌دور و تونل‌شده با SSH.
- پنجره گفت‌وگوی بومی به‌علاوه دسترسی به Control UI مرورگر.
- عیب‌یابی Command Center برای نشست‌ها، میزان استفاده، کانال‌ها، Nodeها، جفت‌سازی
  و فرمان‌های تعمیر.
- حالت Node ویندوز برای بوم، صفحه‌نمایش، دوربین، اعلان‌ها، وضعیت دستگاه، گفتار
  و `system.run` کنترل‌شده توسط عامل.
- حالت سرور MCP محلی برای کلاینت‌های MCP مانند Claude Desktop، Claude Code
  و Cursor.

### نخستین اجرا

در نخستین اجرا، اگر Gateway ذخیره‌شده قابل‌استفاده‌ای وجود نداشته باشد، Windows Hub
صفحه راه‌اندازی را باز می‌کند. سریع‌ترین مسیر **Set up locally** است که یک
توزیع WSL `OpenClawGateway` متعلق به برنامه فراهم می‌کند، Gateway را درون آن نصب می‌کند و
برنامه را جفت می‌کند. این فرایند توزیع Ubuntu موجود شما را صادر یا تغییر نمی‌دهد.

اگر از قبل Gateway دارید، **Advanced setup** را انتخاب کنید یا زبانه Connections را باز کنید.
می‌توانید به موارد زیر متصل شوید:

- یک Gateway محلی روی این رایانه
- یک WSL Gateway روی این رایانه
- یک Gateway راه‌دور با URL و توکن یا کد راه‌اندازی
- یک Gateway در دسترس از طریق تونل SSH

پس از پایان راه‌اندازی، نماد سینی سبز می‌شود. برای تأیید اتصال، جفت‌سازی،
وضعیت Node و سلامت کانال، **Command Center** را از سینی باز کنید.

## حالت Node ویندوز

Windows Hub می‌تواند به‌عنوان یک Node متعلق به OpenClaw ثبت شود تا عامل بتواند از طریق
Gateway از قابلیت‌های بومی اعلام‌شده ویندوز استفاده کند. پیش از اجرای فرمان‌های Node،
آن‌ها باید توسط Node اعلام و در خط‌مشی Gateway مجاز شده باشند؛ برای مشاهده مدل کامل
اجازه/رد، به [Nodeها](/fa/nodes#command-policy) مراجعه کنید.

فرمان‌های رایج:

| خانواده | فرمان‌ها                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| بوم | `canvas.present`، `canvas.hide`، `canvas.navigate`، `canvas.eval`، `canvas.snapshot` |
| صفحه‌نمایش | `screen.snapshot`؛ `screen.record` به اعلام رضایت صریح نیاز دارد                          |
| دوربین | `camera.list`؛ `camera.snap` و `camera.clip` به اعلام رضایت صریح نیاز دارند                  |
| سیستم | `system.notify`، `system.run`، `system.run.prepare`، `system.which`                  |
| دستگاه | `location.get`، `device.info`، `device.status`                                       |
| گفتار   | `talk.ptt.start`، `talk.ptt.stop`، `talk.ptt.cancel`، `talk.ptt.once`، `talk.speak`  |

حالت Node به جفت‌سازی Gateway نیاز دارد. اگر برنامه درخواست جفت‌سازی نمایش داد،
آن را از میزبان Gateway تأیید کنید:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway فقط فرمان‌هایی را ارسال می‌کند که Node اعلام کرده و خط‌مشی سرور
اجازه داده باشد. فرمان‌های حساس به حریم خصوصی مانند `screen.record`، `camera.snap`
و `camera.clip` به اعلام رضایت صریح `gateway.nodes.allowCommands` نیاز دارند.

## حالت MCP محلی

Windows Hub می‌تواند همان رجیستری قابلیت‌های بومی ویندوز را به‌صورت یک سرور
MCP محلی روی loopback ارائه کند تا کلاینت‌های MCP محلی بدون اجرای
OpenClaw Gateway بتوانند قابلیت‌های ویندوز را کنترل کنند.

آن را در Settings متعلق به Windows Hub و در بخش developer/advanced فعال کنید. پس از فعال‌شدن
سرور، برنامه نقطه پایانی loopback و توکن bearer را نمایش می‌دهد.

ماتریس حالت‌ها:

| حالت Node | سرور MCP | رفتار                           |
| --------- | ---------- | ---------------------------------- |
| خاموش       | خاموش        | فقط برنامه دسکتاپ اپراتور          |
| روشن        | خاموش        | Node ویندوز متصل به Gateway     |
| خاموش       | روشن         | فقط سرور MCP محلی              |
| روشن        | روشن         | Node متعلق به Gateway به‌علاوه سرور MCP محلی |

## CLI و Gateway بومی ویندوز

برای استفاده مبتنی بر ترمینال، OpenClaw را از PowerShell نصب کنید:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

تأیید کنید:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

راه‌اندازی مدیریت‌شده، در صورت دسترس‌بودن از Windows Scheduled Tasks استفاده می‌کند. وظیفه،
اسکریپت خوانای `gateway.cmd` را در دایرکتوری وضعیت OpenClaw نگه می‌دارد، اما آن را
از طریق یک پوشش WScript تولیدشده `gateway.vbs` اجرا می‌کند تا Gateway پس‌زمینه
پنجره کنسول قابل‌مشاهده‌ای باز نکند. اگر ایجاد وظیفه رد شود، OpenClaw
به یک مورد ورود در پوشه Startup مختص کاربر برمی‌گردد.

سرویس Gateway را نصب کنید:

```powershell
openclaw gateway install
openclaw gateway status --json
```

برای استفاده صرفاً از CLI بدون سرویس Gateway مدیریت‌شده:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 همچنان سازگارترین محیط اجرای Gateway با لینوکس در ویندوز است. Windows
Hub می‌تواند یک WSL Gateway متعلق به برنامه را برای شما راه‌اندازی کند، یا می‌توانید آن را به‌صورت دستی
در توزیع خود نصب کنید.

راه‌اندازی دستی:

```powershell
wsl --install
# یا یک توزیع را صراحتاً انتخاب کنید:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

systemd را در WSL فعال کنید:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

WSL را از PowerShell راه‌اندازی مجدد کنید:

```powershell
wsl --shutdown
```

سپس OpenClaw را با راهنمای شروع سریع لینوکس درون WSL نصب کنید:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## شروع خودکار Gateway پیش از ورود به ویندوز

برای راه‌اندازی‌های WSL بدون رابط، مطمئن شوید زنجیره کامل بوت حتی وقتی هیچ‌کس
وارد ویندوز نمی‌شود اجرا می‌شود.

درون WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

در PowerShell با دسترسی Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

`Ubuntu` را با نام توزیع خود از خروجی زیر جایگزین کنید:

```powershell
wsl --list --verbose
```

<Note>
دو تغییر نسبت به دستورالعمل‌های قدیمی‌تر:

- **`dbus-launch true` به‌جای `/bin/true`**: در WSL >= 2.6.1.0 یک
  پس‌رفت ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  باعث می‌شود توزیع 15-20 ثانیه پس از خروج آخرین کلاینت به‌دلیل بیکاری خاتمه یابد، حتی
  با وجود فعال‌بودن linger. `dbus-launch true` به‌عنوان راهکار موقت، یک فرایند فرزند init را زنده
  نگه می‌دارد (گفت‌وگوی جامعه، [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` به‌جای `/ru SYSTEM`**: توزیع‌های WSL مختص کاربر (راه‌اندازی
  پیش‌فرض) برای حساب SYSTEM قابل‌مشاهده نیستند، بنابراین وظیفه ظاهراً
  اجرا می‌شود، اما توزیع هرگز شروع نمی‌شود. اجرا با حساب خودتان از این مشکل
  جلوگیری می‌کند؛ هنگام ایجاد وظیفه، ویندوز گذرواژه شما را درخواست می‌کند.

</Note>

پس از راه‌اندازی مجدد، از WSL تأیید کنید:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## ارائه سرویس‌های WSL در شبکه LAN

WSL شبکه مجازی خودش را دارد. اگر دستگاه دیگری باید به یک سرویس
درون WSL دسترسی پیدا کند، یک درگاه ویندوز را به IP فعلی WSL هدایت کنید. IP متعلق به WSL ممکن است
پس از راه‌اندازی مجدد تغییر کند، بنابراین در صورت نیاز قانون هدایت را تازه‌سازی کنید.

نمونه در PowerShell با دسترسی Administrator:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

نکات:

- SSH از دستگاهی دیگر IP میزبان ویندوز را هدف می‌گیرد، برای نمونه `ssh user@windows-host -p 2222`.
- Nodeهای راه‌دور باید به یک URL در دسترس Gateway اشاره کنند، نه `127.0.0.1`.
- برای دسترسی LAN از `listenaddress=0.0.0.0` و برای دسترسی فقط محلی از `127.0.0.1` استفاده کنید.

## عیب‌یابی

### نماد سینی ظاهر نمی‌شود

در Task Manager وجود `OpenClaw.Tray.WinUI.exe` را بررسی کنید. اگر در حال اجرا است، بخش
نمادهای مخفی سینی را باز و آن را سنجاق کنید. در غیر این صورت، **OpenClaw Companion** را از
منوی Start اجرا کنید.

### راه‌اندازی محلی ناموفق است

گزارش راه‌اندازی را از Windows Hub باز کنید یا مورد زیر را بررسی کنید:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

علت‌های رایج: WSL غیرفعال، مجازی‌سازی مسدود، وضعیت قدیمی WSL
متعلق به برنامه، یا خرابی شبکه هنگام نصب بسته Gateway.

### برنامه اعلام می‌کند جفت‌سازی لازم است

درخواست اپراتور یا Node را از Gateway تأیید کنید:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

اگر دستگاه از قبل توکن داشت، پس از تأیید از زبانه Connections دوباره
متصل شوید.

### گفت‌وگوی وب به Gateway راه‌دور دسترسی ندارد

گفت‌وگوی وب راه‌دور به HTTPS یا localhost نیاز دارد. برای گواهی‌های خودامضا،
گواهی را در ویندوز مورد اعتماد قرار دهید یا از تونل SSH به یک URL متعلق به localhost استفاده کنید.

### فرمان‌های `screen.snapshot`، دوربین یا صدا ناموفق هستند

مجوزهای ویندوز برای دوربین، میکروفن، ضبط صفحه‌نمایش و
اعلان‌ها را تأیید کنید. نصب‌های بسته‌بندی‌شده قابلیت‌های محافظت‌شده را اعلام می‌کنند، اما
ممکن است ویندوز هنگام نخستین استفاده یک فرمان از آن‌ها همچنان درخواست تأیید کند.

### اتصال Git یا GitHub ناموفق است

برخی شبکه‌ها HTTPS به GitHub را مسدود یا محدود می‌کنند. اگر `git clone` یا
`gh auth login` ناموفق بود، شبکه‌ای دیگر، VPN یا پراکسی HTTP/HTTPS را امتحان کنید.

برای احراز هویت مبتنی بر توکن `gh` در نشست فعلی:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

هرگز توکن‌ها را commit نکنید یا آن‌ها را در issueها یا pull requestها جای‌گذاری نکنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [راه‌اندازی Node.js](/fa/install/node)
- [Nodeها](/fa/nodes)
- [Control UI](/fa/web/control-ui)
- [پیکربندی Gateway](/fa/gateway/configuration)
