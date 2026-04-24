---
read_when:
    - تثبيت OpenClaw على Windows
    - الاختيار بين Windows الأصلي وWSL2
    - البحث عن حالة التطبيق المرافق على Windows
summary: 'دعم Windows: مسارات التثبيت الأصلية وعبر WSL2، والخدمة الخلفية، والمحاذير الحالية'
title: Windows
x-i18n:
    generated_at: "2026-04-24T07:53:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

يدعم OpenClaw كلاً من **Windows الأصلي** و**WSL2**. يُعد WSL2 المسار الأكثر
استقرارًا ويوصى به للحصول على التجربة الكاملة — إذ تعمل CLI وGateway
والأدوات داخل Linux مع توافق كامل. يعمل Windows الأصلي للاستخدامات الأساسية
لـ CLI وGateway، مع بعض المحاذير المذكورة أدناه.

تطبيقات Windows المرافقة الأصلية مخطط لها.

## WSL2 ‏(موصى به)

- [البدء](/ar/start/getting-started) ‏(استخدمه داخل WSL)
- [التثبيت والتحديثات](/ar/install/updating)
- دليل WSL2 الرسمي (Microsoft): ‏[https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## حالة Windows الأصلي

تتحسن تدفقات CLI الأصلية على Windows، لكن WSL2 لا يزال هو المسار الموصى به.

ما الذي يعمل جيدًا على Windows الأصلي اليوم:

- مثبّت الموقع عبر `install.ps1`
- استخدام CLI المحلي مثل `openclaw --version` و`openclaw doctor` و`openclaw plugins list --json`
- اختبارات smoke محلية مضمّنة للوكيل/الموفر مثل:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

المحاذير الحالية:

- لا يزال `openclaw onboard --non-interactive` يتوقع Gateway محلية قابلة للوصول ما لم تمرر `--skip-health`
- يحاول `openclaw onboard --non-interactive --install-daemon` و`openclaw gateway install` استخدام Windows Scheduled Tasks أولًا
- إذا تم رفض إنشاء Scheduled Task، فإن OpenClaw يرجع إلى عنصر تشغيل بعد تسجيل الدخول في Startup-folder لكل مستخدم ويبدأ gateway فورًا
- إذا تعطلت `schtasks` نفسها أو توقفت عن الاستجابة، فإن OpenClaw يوقف هذا المسار الآن بسرعة ويرجع بدلًا من التعليق إلى الأبد
- تظل Scheduled Tasks هي المفضلة عند توفرها لأنها توفر حالة إشراف أفضل

إذا كنت تريد CLI الأصلية فقط، من دون تثبيت خدمة gateway، فاستخدم أحد ما يلي:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

إذا كنت تريد تشغيلًا مُدارًا عند البدء على Windows الأصلي:

```powershell
openclaw gateway install
openclaw gateway status --json
```

إذا كان إنشاء Scheduled Task محظورًا، فسيظل وضع الخدمة الاحتياطي يبدأ تلقائيًا بعد تسجيل الدخول من خلال مجلد Startup الخاص بالمستخدم الحالي.

## Gateway

- [دليل تشغيل Gateway](/ar/gateway)
- [الإعداد](/ar/gateway/configuration)

## تثبيت خدمة Gateway ‏(CLI)

داخل WSL2:

```
openclaw onboard --install-daemon
```

أو:

```
openclaw gateway install
```

أو:

```
openclaw configure
```

اختر **Gateway service** عند المطالبة.

الإصلاح/الترحيل:

```
openclaw doctor
```

## التشغيل التلقائي لـ Gateway قبل تسجيل الدخول إلى Windows

بالنسبة إلى الإعدادات headless، تأكد من أن سلسلة الإقلاع الكاملة تعمل حتى عندما لا يقوم أحد بتسجيل الدخول إلى
Windows.

### 1) الإبقاء على خدمات المستخدم قيد التشغيل من دون تسجيل دخول

داخل WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) تثبيت خدمة مستخدم OpenClaw gateway

داخل WSL:

```bash
openclaw gateway install
```

### 3) بدء WSL تلقائيًا عند إقلاع Windows

في PowerShell بصلاحيات Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

استبدل `Ubuntu` باسم توزيعتك من:

```powershell
wsl --list --verbose
```

### التحقق من سلسلة البدء

بعد إعادة التشغيل (قبل تسجيل الدخول إلى Windows)، تحقق من داخل WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## متقدم: كشف خدمات WSL عبر LAN ‏(portproxy)

تمتلك WSL شبكتها الافتراضية الخاصة. وإذا كان جهاز آخر يحتاج إلى الوصول إلى خدمة
تعمل **داخل WSL** ‏(SSH أو خادم TTS محلي أو Gateway)، فيجب عليك
تمرير منفذ Windows إلى عنوان WSL IP الحالي. ويتغير عنوان WSL IP بعد إعادة التشغيل،
لذا قد تحتاج إلى تحديث قاعدة التمرير.

مثال (PowerShell **بصلاحيات Administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

اسمح بالمنفذ عبر Windows Firewall ‏(مرة واحدة):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

حدّث portproxy بعد إعادة تشغيل WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

ملاحظات:

- يستهدف SSH من جهاز آخر **عنوان IP الخاص بمضيف Windows** ‏(مثال: `ssh user@windows-host -p 2222`).
- يجب أن تشير nodes البعيدة إلى عنوان URL لـ Gateway **يمكن الوصول إليه** (وليس `127.0.0.1`)؛ استخدم
  `openclaw status --all` للتأكد.
- استخدم `listenaddress=0.0.0.0` للوصول عبر LAN؛ أما `127.0.0.1` فيُبقيه محليًا فقط.
- إذا أردت ذلك تلقائيًا، فسجل Scheduled Task لتشغيل
  خطوة التحديث عند تسجيل الدخول.

## تثبيت WSL2 خطوة بخطوة

### 1) تثبيت WSL2 + Ubuntu

افتح PowerShell ‏(Admin):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

أعد التشغيل إذا طلب Windows ذلك.

### 2) تمكين systemd ‏(مطلوب لتثبيت gateway)

في طرفية WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

ثم من PowerShell:

```powershell
wsl --shutdown
```

أعد فتح Ubuntu، ثم تحقق:

```bash
systemctl --user status
```

### 3) تثبيت OpenClaw ‏(داخل WSL)

لإعداد طبيعي أول مرة داخل WSL، اتبع تدفق Linux في البدء:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

إذا كنت تطوّر من المصدر بدلًا من إجراء onboarding لأول مرة، فاستخدم
حلقة التطوير من المصدر من [الإعداد](/ar/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

الدليل الكامل: [البدء](/ar/start/getting-started)

## تطبيق Windows المرافق

ليس لدينا تطبيق Windows مرافق بعد. المساهمات مرحب بها إذا كنت تريد
المساعدة في تحقيق ذلك.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [المنصات](/ar/platforms)
