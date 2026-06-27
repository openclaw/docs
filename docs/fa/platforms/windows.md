---
read_when:
    - نصب OpenClaw روی Windows
    - انتخاب بین Windows Hub، Windows بومی، و WSL2
    - راه‌اندازی برنامه همراه Windows یا حالت گره Windows
summary: 'پشتیبانی از Windows: Windows Hub، CLI و Gateway بومی، راه‌اندازی Gateway در WSL2، حالت node، و عیب‌یابی'
title: Windows
x-i18n:
    generated_at: "2026-06-27T18:08:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw یک برنامه همراه بومی **Windows Hub** به‌همراه پشتیبانی CLI ویندوز ارائه می‌کند.
وقتی یک برنامه دسکتاپ با راه‌اندازی، وضعیت tray، چت،
عیب‌یابی Command Center و قابلیت‌های Node ویندوز می‌خواهید، از Windows Hub استفاده کنید. وقتی CLI/Gateway را مستقیم می‌خواهید، از نصب‌کننده PowerShell استفاده کنید. وقتی
سازگارترین runtime Gateway با لینوکس را می‌خواهید، از WSL2 استفاده کنید.

## پیشنهادی: Windows Hub

Windows Hub برنامه همراه بومی WinUI برای Windows 10 20H2+ و Windows 11 است. بدون دسترسی administrator نصب می‌شود و با نصب‌کننده‌های امضاشده
x64 و ARM64 در نسخه‌های منتشرشده OpenClaw ارائه می‌شود.

آخرین نصب‌کننده پایدار را از [صفحه انتشارهای OpenClaw](https://github.com/openclaw/openclaw/releases) دانلود کنید:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Checksums](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

اگر یکی از پیوندهای دانلود بالا خطای 404 داد، به [صفحه انتشارها](https://github.com/openclaw/openclaw/releases) بروید و در آخرین انتشار به‌دنبال دارایی‌های `OpenClawCompanion-Setup-*` بگردید.

پس از نصب، **OpenClaw Companion** را از منوی Start یا system
tray اجرا کنید. نصب‌کننده همچنین میان‌برهایی برای Gateway Setup، Chat، Settings،
Check for Updates و حذف نصب اضافه می‌کند.

### Windows Hub شامل چه چیزهایی است

- وضعیت system tray و اجرا هنگام ورود
- راه‌اندازی اولین اجرا برای یک WSL Gateway محلی متعلق به برنامه
- تنظیمات اتصال برای Gatewayهای محلی، راه دور و تونل‌شده با SSH
- پنجره چت بومی به‌همراه دسترسی به Control UI مرورگر
- عیب‌یابی Command Center برای نشست‌ها، مصرف، کانال‌ها، Nodeها، pairing و
  دستورهای تعمیر
- حالت Node ویندوز برای canvas، صفحه‌نمایش، دوربین، اعلان‌ها،
  وضعیت دستگاه، متن‌به‌گفتار، گفتاربه‌متن و `system.run` کنترل‌شده توسط agent
- حالت سرور MCP محلی برای مشتریان MCP مانند Claude Desktop، Claude Code و
  Cursor

### اولین اجرا

در اولین اجرا، وقتی Gateway ذخیره‌شده قابل‌استفاده‌ای وجود نداشته باشد، Windows Hub راه‌اندازی را باز می‌کند.
سریع‌ترین مسیر **Set up locally** است، که یک توزیع WSL متعلق به برنامه با نام
`OpenClawGateway` فراهم می‌کند، Gateway را داخل آن نصب می‌کند، و برنامه را pair می‌کند.
این کار توزیع Ubuntu موجود شما را export یا تغییر نمی‌دهد.

وقتی از قبل Gateway دارید، **Advanced setup** را انتخاب کنید یا زبانه Connections را باز کنید.
می‌توانید به این موارد متصل شوید:

- یک Gateway محلی روی همین PC
- یک WSL Gateway روی همین PC
- یک Gateway راه دور با URL و token یا setup code
- یک Gateway که از طریق تونل SSH در دسترس است

وقتی راه‌اندازی تمام شد، نماد tray سبز می‌شود. **Command Center** را از
tray باز کنید تا اتصال، pairing، وضعیت Node و سلامت کانال را تأیید کنید.

## حالت Node ویندوز

Windows Hub می‌تواند به‌عنوان یک Node درجه‌یک OpenClaw ثبت شود. سپس agent می‌تواند
از قابلیت‌های بومی ویندوز که از طریق Gateway اعلام شده‌اند استفاده کند.

دستورهای رایج شامل این موارد هستند:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` و، با opt-in صریح، `screen.record`
- `camera.list` و، با opt-in صریح، `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

حالت Node به pairing با Gateway نیاز دارد. اگر برنامه درخواست pairing نشان داد، آن را
از میزبان Gateway تأیید کنید:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway فقط دستورهایی را عبور می‌دهد که Node اعلام کرده و سیاست سرور
اجازه داده است. دستورهای حساس به حریم خصوصی مانند `screen.record`، `camera.snap` و
`camera.clip` به opt-in صریح `gateway.nodes.allowCommands` نیاز دارند.

## حالت MCP محلی

Windows Hub می‌تواند همان رجیستری قابلیت بومی ویندوز را به‌صورت یک سرور MCP محلی
روی loopback ارائه کند. این زمانی مفید است که بخواهید مشتریان MCP محلی
قابلیت‌های ویندوز را بدون یک OpenClaw Gateway در حال اجرا کنترل کنند.

آن را در Settings ویندوز هاب، زیر بخش developer/advanced فعال کنید. پس از فعال‌شدن سرور، برنامه
endpoint loopback و bearer token را نشان می‌دهد.

ماتریس حالت‌ها:

| حالت Node | سرور MCP | رفتار                           |
| --------- | ---------- | ---------------------------------- |
| خاموش       | خاموش        | برنامه دسکتاپ فقط برای operator          |
| روشن        | خاموش        | Node ویندوز متصل به Gateway     |
| خاموش       | روشن         | فقط سرور MCP محلی              |
| روشن        | روشن         | Node Gateway به‌همراه سرور MCP محلی |

## CLI و Gateway بومی ویندوز

برای استفاده terminal-first، OpenClaw را از PowerShell نصب کنید:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

بررسی کنید:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

جریان‌های CLI و Gateway بومی ویندوز پشتیبانی می‌شوند و همچنان در حال بهبود هستند.
راه‌اندازی مدیریت‌شده، وقتی در دسترس باشد، از Windows Scheduled Tasks استفاده می‌کند. task اسکریپت خوانای
`gateway.cmd` را در دایرکتوری state مربوط به OpenClaw نگه می‌دارد، اما آن را از طریق
یک wrapper تولیدشده `gateway.vbs` برای WScript اجرا می‌کند تا Gateway پس‌زمینه
یک پنجره console قابل‌مشاهده باز نکند. اگر ساخت task رد شود، OpenClaw به یک
آیتم ورود پوشه Startup برای هر کاربر fallback می‌کند.

برای نصب سرویس Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

اگر فقط استفاده CLI بدون سرویس Gateway مدیریت‌شده می‌خواهید:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 همچنان سازگارترین runtime Gateway با لینوکس روی ویندوز است. Windows Hub
می‌تواند یک WSL Gateway متعلق به برنامه را برای شما راه‌اندازی کند، یا می‌توانید به‌صورت دستی داخل
توزیع خودتان نصب کنید.

راه‌اندازی دستی:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

systemd را داخل WSL فعال کنید:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

WSL را از PowerShell دوباره راه‌اندازی کنید:

```powershell
wsl --shutdown
```

سپس OpenClaw را داخل WSL با quickstart لینوکس نصب کنید:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## شروع خودکار Gateway پیش از ورود به ویندوز

برای راه‌اندازی‌های WSL بدون نمایشگر، مطمئن شوید زنجیره کامل boot حتی وقتی کسی وارد
ویندوز نشده اجرا می‌شود.

داخل WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

در PowerShell به‌عنوان Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

`Ubuntu` را با نام توزیع خود از این دستور جایگزین کنید:

```powershell
wsl --list --verbose
```

> **نکته:** دو تغییر نسبت به دستورالعمل‌های قدیمی‌تر:
>
> - **`dbus-launch true` به‌جای `/bin/true`** — در WSL ≥ 2.6.1.0 یک regression ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) باعث می‌شود توزیع 15 تا 20 ثانیه پس از خروج آخرین client، حتی با فعال بودن linger، به‌علت بیکاری terminate شود. `dbus-launch true` به‌عنوان workaround یک فرایند child-of-init را زنده نگه می‌دارد ([بحث جامعه، microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` به‌جای `/ru SYSTEM`** — توزیع‌های WSL هر کاربر (راه‌اندازی پیش‌فرض) برای حساب SYSTEM قابل‌مشاهده نیستند؛ task ظاهراً اجرا می‌شود اما توزیع هرگز شروع نمی‌شود. اجرا با حساب خودتان از این مشکل جلوگیری می‌کند. هنگام ساخت task، ویندوز گذرواژه شما را درخواست می‌کند.

پس از reboot، از WSL بررسی کنید:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## در دسترس قراردادن سرویس‌های WSL روی LAN

WSL شبکه مجازی خودش را دارد. اگر دستگاه دیگری باید به سرویسی داخل
WSL دسترسی داشته باشد، یک پورت ویندوز را به IP فعلی WSL forward کنید. IP مربوط به WSL ممکن است پس از
راه‌اندازی‌های مجدد تغییر کند، بنابراین در صورت نیاز rule مربوط به forwarding را refresh کنید.

نمونه در PowerShell به‌عنوان Administrator:

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

نکته‌ها:

- SSH از دستگاه دیگر، IP میزبان ویندوز را هدف می‌گیرد، برای مثال
  `ssh user@windows-host -p 2222`.
- Nodeهای راه دور باید به URL قابل‌دسترسی Gateway اشاره کنند، نه `127.0.0.1`.
- برای دسترسی LAN از `listenaddress=0.0.0.0` استفاده کنید. برای دسترسی فقط محلی
  از `127.0.0.1` استفاده کنید.

## عیب‌یابی

### نماد tray ظاهر نمی‌شود

Task Manager را برای `OpenClaw.Tray.WinUI.exe` بررسی کنید. اگر در حال اجراست، ناحیه
نمادهای پنهان tray را باز کنید و آن را pin کنید. اگر در حال اجرا نیست، **OpenClaw
Companion** را از منوی Start اجرا کنید.

### راه‌اندازی محلی ناموفق است

لاگ راه‌اندازی را از Windows Hub باز کنید یا این مسیر را بررسی کنید:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

علت‌های رایج عبارت‌اند از WSL غیرفعال، virtualization مسدودشده، state کهنه WSL
متعلق به برنامه، یا خطای شبکه هنگام نصب بسته Gateway.

### برنامه می‌گوید pairing لازم است

درخواست operator یا Node را از Gateway تأیید کنید:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

اگر دستگاه از قبل token داشت، پس از
تأیید از زبانه Connections دوباره متصل شوید.

### چت وب نمی‌تواند به Gateway راه دور دسترسی پیدا کند

چت وب راه دور به HTTPS یا localhost نیاز دارد. برای گواهی‌های self-signed،
گواهی را در ویندوز trust کنید، یا از یک تونل SSH به URL localhost استفاده کنید.

### دستورهای `screen.snapshot`، دوربین، یا صدا ناموفق هستند

مجوزهای ویندوز برای دوربین، میکروفون، screen capture و
اعلان‌ها را تأیید کنید. نصب‌های packaged قابلیت‌های محافظت‌شده را declare می‌کنند، اما ویندوز
ممکن است در اولین استفاده یک دستور از آن‌ها همچنان prompt نشان دهد.

### اتصال Git یا GitHub ناموفق است

برخی شبکه‌ها HTTPS به GitHub را مسدود یا throttle می‌کنند. اگر `git clone` یا `gh auth
login` ناموفق بود، یک شبکه دیگر، VPN، یا proxy HTTP/HTTPS را امتحان کنید.

برای auth مبتنی بر token در `gh` در نشست فعلی:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

هرگز tokenها را commit نکنید یا آن‌ها را در issueها یا pull requestها paste نکنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [راه‌اندازی Node.js](/fa/install/node)
- [Nodeها](/fa/nodes)
- [Control UI](/fa/web/control-ui)
- [پیکربندی Gateway](/fa/gateway/configuration)
