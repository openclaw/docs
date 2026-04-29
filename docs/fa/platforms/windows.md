---
read_when:
    - نصب OpenClaw روی Windows
    - انتخاب بین Windows بومی و WSL2
    - در حال بررسی وضعیت برنامهٔ همراه Windows
summary: 'پشتیبانی از Windows: مسیرهای نصب بومی و WSL2، دیمون، و ملاحظات فعلی'
title: Windows
x-i18n:
    generated_at: "2026-04-29T23:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw هم از **Windows بومی** و هم از **WSL2** پشتیبانی می‌کند. WSL2 مسیر
پایدارتر است و برای تجربه کامل توصیه می‌شود؛ CLI، Gateway و
ابزارها داخل Linux با سازگاری کامل اجرا می‌شوند. Windows بومی برای
استفاده اصلی از CLI و Gateway کار می‌کند، با چند ملاحظه که در ادامه آمده است.

برنامه‌های همراه بومی Windows برنامه‌ریزی شده‌اند.

## WSL2 (توصیه‌شده)

- [شروع به کار](/fa/start/getting-started) (داخل WSL استفاده کنید)
- [نصب و به‌روزرسانی‌ها](/fa/install/updating)
- راهنمای رسمی WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## وضعیت Windows بومی

جریان‌های CLI در Windows بومی در حال بهبود هستند، اما WSL2 همچنان مسیر توصیه‌شده است.

مواردی که امروز روی Windows بومی خوب کار می‌کنند:

- نصب‌کننده وب‌سایت از طریق `install.ps1`
- استفاده محلی از CLI مانند `openclaw --version`، `openclaw doctor` و `openclaw plugins list --json`
- دودآزمایی local-agent/provider تعبیه‌شده مانند:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

ملاحظات فعلی:

- `openclaw onboard --non-interactive` هنوز انتظار دارد یک Gateway محلی در دسترس باشد، مگر اینکه `--skip-health` را پاس دهید
- `openclaw onboard --non-interactive --install-daemon` و `openclaw gateway install` ابتدا Windows Scheduled Tasks را امتحان می‌کنند
- اگر ایجاد Scheduled Task رد شود، OpenClaw به یک مورد ورود به سیستم در Startup folder برای هر کاربر برمی‌گردد و Gateway را بلافاصله شروع می‌کند
- اگر خود `schtasks` گیر کند یا پاسخ ندهد، OpenClaw اکنون آن مسیر را سریع متوقف می‌کند و به‌جای معطل ماندن همیشگی به مسیر جایگزین برمی‌گردد
- Scheduled Tasks همچنان در صورت در دسترس بودن ترجیح داده می‌شوند، چون وضعیت سرپرست بهتری ارائه می‌کنند

اگر فقط CLI بومی را بدون نصب سرویس Gateway می‌خواهید، از یکی از این‌ها استفاده کنید:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

اگر راه‌اندازی مدیریت‌شده روی Windows بومی را می‌خواهید:

```powershell
openclaw gateway install
openclaw gateway status --json
```

اگر ایجاد Scheduled Task مسدود باشد، حالت سرویس جایگزین همچنان پس از ورود به سیستم از طریق Startup folder کاربر فعلی به‌صورت خودکار شروع می‌شود.

## Gateway

- [راهنمای عملی Gateway](/fa/gateway)
- [پیکربندی](/fa/gateway/configuration)

## نصب سرویس Gateway (CLI)

داخل WSL2:

```
openclaw onboard --install-daemon
```

یا:

```
openclaw gateway install
```

یا:

```
openclaw configure
```

وقتی درخواست شد، **سرویس Gateway** را انتخاب کنید.

تعمیر/مهاجرت:

```
openclaw doctor
```

## شروع خودکار Gateway پیش از ورود به Windows

برای راه‌اندازی‌های headless، مطمئن شوید زنجیره کامل بوت حتی وقتی هیچ‌کس وارد
Windows نشده است اجرا می‌شود.

### 1) سرویس‌های کاربر را بدون ورود به سیستم فعال نگه دارید

داخل WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) سرویس کاربری Gateway متعلق به OpenClaw را نصب کنید

داخل WSL:

```bash
openclaw gateway install
```

### 3) WSL را هنگام بوت Windows به‌صورت خودکار شروع کنید

در PowerShell به‌عنوان مدیر:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` را با نام توزیع خود از خروجی زیر جایگزین کنید:

```powershell
wsl --list --verbose
```

### تأیید زنجیره شروع

پس از راه‌اندازی مجدد (پیش از ورود به Windows)، از داخل WSL بررسی کنید:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## پیشرفته: در دسترس قرار دادن سرویس‌های WSL روی LAN (portproxy)

WSL شبکه مجازی خودش را دارد. اگر دستگاه دیگری باید به سرویسی که
**داخل WSL** اجرا می‌شود (SSH، یک سرور محلی TTS، یا Gateway) دسترسی داشته باشد، باید
یک پورت Windows را به IP فعلی WSL فوروارد کنید. IP مربوط به WSL پس از راه‌اندازی مجدد تغییر می‌کند،
پس ممکن است لازم باشد قاعده فوروارد را تازه‌سازی کنید.

مثال (PowerShell **به‌عنوان مدیر**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

اجازه عبور پورت از Windows Firewall را بدهید (یک‌بار):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

پس از راه‌اندازی مجدد WSL، portproxy را تازه‌سازی کنید:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

نکته‌ها:

- SSH از دستگاه دیگر IP **میزبان Windows** را هدف می‌گیرد (مثال: `ssh user@windows-host -p 2222`).
- گره‌های راه دور باید به یک URL قابل دسترس برای Gateway اشاره کنند (نه `127.0.0.1`)؛ برای تأیید از
  `openclaw status --all` استفاده کنید.
- برای دسترسی LAN از `listenaddress=0.0.0.0` استفاده کنید؛ `127.0.0.1` آن را فقط محلی نگه می‌دارد.
- اگر می‌خواهید این کار خودکار باشد، یک Scheduled Task ثبت کنید تا مرحله تازه‌سازی را
  هنگام ورود به سیستم اجرا کند.

## نصب گام‌به‌گام WSL2

### 1) نصب WSL2 + Ubuntu

PowerShell را باز کنید (مدیر):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

اگر Windows درخواست کرد، راه‌اندازی مجدد کنید.

### 2) فعال کردن systemd (برای نصب Gateway لازم است)

در ترمینال WSL خود:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

سپس از PowerShell:

```powershell
wsl --shutdown
```

Ubuntu را دوباره باز کنید، سپس تأیید کنید:

```bash
systemctl --user status
```

### 3) نصب OpenClaw (داخل WSL)

برای راه‌اندازی عادی بار اول داخل WSL، جریان شروع به کار Linux را دنبال کنید:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

اگر به‌جای onboarding بار اول، از سورس توسعه می‌دهید، از
چرخه توسعه سورس در [راه‌اندازی](/fa/start/setup) استفاده کنید:

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

راهنمای کامل: [شروع به کار](/fa/start/getting-started)

## برنامه همراه Windows

هنوز برنامه همراه Windows نداریم. اگر می‌خواهید
در تحقق آن مشارکت کنید، از مشارکت‌ها استقبال می‌شود.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [پلتفرم‌ها](/fa/platforms)
