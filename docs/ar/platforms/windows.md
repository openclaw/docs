---
read_when:
    - تثبيت OpenClaw على Windows
    - الاختيار بين Windows الأصلي وWSL2
    - البحث عن حالة التطبيق المرافق لـ Windows
summary: 'دعم Windows: مسارات التثبيت الأصلية وWSL2، الخدمة الخلفية، والمحاذير الحالية'
title: Windows
x-i18n:
    generated_at: "2026-04-19T07:16:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

يدعم OpenClaw كلاً من **Windows الأصلي** و**WSL2**. يُعد WSL2 المسار الأكثر
استقرارًا ويوصى به للحصول على التجربة الكاملة — إذ تعمل CLI وGateway وأدوات
العمل داخل Linux مع توافق كامل. يعمل Windows الأصلي مع استخدامات CLI وGateway
الأساسية، مع بعض المحاذير الموضحة أدناه.

تطبيقات Windows المرافقة الأصلية مخطط لها.

## WSL2 (موصى به)

- [البدء](/ar/start/getting-started) (استخدمه داخل WSL)
- [التثبيت والتحديثات](/ar/install/updating)
- دليل WSL2 الرسمي (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## حالة Windows الأصلي

تتحسن تدفقات CLI الأصلية على Windows، لكن WSL2 لا يزال هو المسار الموصى به.

ما الذي يعمل جيدًا على Windows الأصلي اليوم:

- مُثبّت الموقع عبر `install.ps1`
- استخدام CLI المحلي مثل `openclaw --version` و`openclaw doctor` و`openclaw plugins list --json`
- اختبارات local-agent/provider المضمنة مثل:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

المحاذير الحالية:

- لا يزال `openclaw onboard --non-interactive` يتوقع وجود Gateway محلي قابل للوصول ما لم تمرر `--skip-health`
- يحاول `openclaw onboard --non-interactive --install-daemon` و`openclaw gateway install` استخدام Windows Scheduled Tasks أولاً
- إذا تم رفض إنشاء Scheduled Task، يعود OpenClaw إلى عنصر تسجيل دخول لكل مستخدم داخل مجلد Startup ويبدأ Gateway فورًا
- إذا تعطل `schtasks` نفسه أو توقف عن الاستجابة، فإن OpenClaw يوقف هذا المسار الآن بسرعة ويعود إلى البديل بدلًا من التعليق إلى الأبد
- لا تزال Scheduled Tasks هي الخيار المفضل عند توفرها لأنها توفّر حالة إشراف أفضل

إذا كنت تريد CLI الأصلي فقط، من دون تثبيت خدمة Gateway، فاستخدم أحد هذين الأمرين:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

إذا كنت تريد تشغيلًا مُدارًا عند بدء التشغيل على Windows الأصلي:

```powershell
openclaw gateway install
openclaw gateway status --json
```

إذا كان إنشاء Scheduled Task محظورًا، فسيظل وضع الخدمة الاحتياطي يبدأ تلقائيًا بعد تسجيل الدخول عبر مجلد Startup الخاص بالمستخدم الحالي.

## Gateway

- [دليل تشغيل Gateway](/ar/gateway)
- [الإعدادات](/ar/gateway/configuration)

## تثبيت خدمة Gateway (CLI)

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

اختر **خدمة Gateway** عند ظهور المطالبة.

الإصلاح/الترحيل:

```
openclaw doctor
```

## البدء التلقائي لـ Gateway قبل تسجيل الدخول إلى Windows

لإعدادات التشغيل دون واجهة، تأكد من أن سلسلة الإقلاع الكاملة تعمل حتى عندما لا
يقوم أحد بتسجيل الدخول إلى Windows.

### 1) إبقاء خدمات المستخدم قيد التشغيل دون تسجيل دخول

داخل WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) تثبيت خدمة مستخدم OpenClaw gateway

داخل WSL:

```bash
openclaw gateway install
```

### 3) تشغيل WSL تلقائيًا عند إقلاع Windows

في PowerShell بصلاحيات Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

استبدل `Ubuntu` باسم توزيعتك من:

```powershell
wsl --list --verbose
```

### التحقق من سلسلة بدء التشغيل

بعد إعادة التشغيل (وقبل تسجيل الدخول إلى Windows)، تحقق من داخل WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## متقدم: إتاحة خدمات WSL عبر LAN ‏(portproxy)

يمتلك WSL شبكته الافتراضية الخاصة. إذا كانت هناك حاجة لأن يصل جهاز آخر إلى خدمة
تعمل **داخل WSL** (مثل SSH أو خادم TTS محلي أو Gateway)، فيجب عليك إعادة توجيه
منفذ في Windows إلى عنوان IP الحالي لـ WSL. يتغير عنوان IP الخاص بـ WSL بعد
إعادة التشغيل، لذا قد تحتاج إلى تحديث قاعدة إعادة التوجيه.

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

اسمح بمرور المنفذ عبر Windows Firewall (مرة واحدة):

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

- يستهدف SSH من جهاز آخر **عنوان IP لمضيف Windows** (مثال: `ssh user@windows-host -p 2222`).
- يجب أن تشير Node البعيدة إلى عنوان URL لـ Gateway **قابل للوصول** (وليس `127.0.0.1`)؛ استخدم
  `openclaw status --all` للتأكد.
- استخدم `listenaddress=0.0.0.0` للوصول عبر LAN؛ أما `127.0.0.1` فيبقيه محليًا فقط.
- إذا أردت أن يتم هذا تلقائيًا، فسجّل Scheduled Task لتشغيل
  خطوة التحديث عند تسجيل الدخول.

## تثبيت WSL2 خطوة بخطوة

### 1) تثبيت WSL2 + Ubuntu

افتح PowerShell (بصلاحيات Admin):

```powershell
wsl --install
# أو اختر توزيعة بشكل صريح:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

أعد التشغيل إذا طلب Windows ذلك.

### 2) تفعيل systemd (مطلوب لتثبيت Gateway)

في طرفية WSL لديك:

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

### 3) تثبيت OpenClaw (داخل WSL)

لإعداد أولي عادي داخل WSL، اتبع تدفق البدء الخاص بـ Linux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

إذا كنت تطور من المصدر بدلًا من تنفيذ الإعداد الأولي لأول مرة، فاستخدم
حلقة تطوير المصدر من [الإعداد](/ar/start/setup):

```bash
pnpm install
# التشغيل الأول فقط (أو بعد إعادة تعيين إعدادات/مساحة عمل OpenClaw المحلية)
pnpm openclaw setup
pnpm gateway:watch
```

الدليل الكامل: [البدء](/ar/start/getting-started)

## تطبيق Windows المرافق

لا نملك تطبيق Windows مرافقًا بعد. نرحب بالمساهمات إذا كنت تريد
المساعدة في تحقيق ذلك.
