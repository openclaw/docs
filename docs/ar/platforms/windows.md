---
read_when:
    - تثبيت OpenClaw على Windows
    - الاختيار بين Windows الأصلي وWSL2
    - جارٍ البحث عن حالة تطبيق Windows المصاحب
summary: 'دعم Windows: مسارات التثبيت الأصلية وعبر WSL2، والخدمة الخلفية، والمحاذير الحالية'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:18:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

يدعم OpenClaw كلاً من **Windows الأصلي** و **WSL2**. يُعد WSL2 المسار الأكثر
استقرارًا والموصى به للتجربة الكاملة — حيث تعمل CLI وGateway
والأدوات داخل Linux بتوافق كامل. يعمل Windows الأصلي لاستخدام
CLI وGateway الأساسي، مع بعض التنبيهات المذكورة أدناه.

تطبيقات Windows الأصلية المرافقة مخطط لها.

## WSL2 (موصى به)

- [بدء الاستخدام](/ar/start/getting-started) (استخدمه داخل WSL)
- [التثبيت والتحديثات](/ar/install/updating)
- دليل WSL2 الرسمي (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## حالة Windows الأصلي

تتحسن مسارات CLI على Windows الأصلي، لكن WSL2 لا يزال المسار الموصى به.

ما يعمل جيدًا على Windows الأصلي اليوم:

- مثبّت الموقع عبر `install.ps1`
- استخدام CLI المحلي مثل `openclaw --version` و`openclaw doctor` و`openclaw plugins list --json`
- اختبارات دخان الوكيل/المزوّد المحلي المضمّن مثل:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

التنبيهات الحالية:

- ما زال `openclaw onboard --non-interactive` يتوقع Gateway محليًا يمكن الوصول إليه ما لم تمرر `--skip-health`
- يحاول `openclaw onboard --non-interactive --install-daemon` و`openclaw gateway install` استخدام مهام Windows المجدولة أولًا
- إذا رُفض إنشاء المهمة المجدولة، يرجع OpenClaw إلى عنصر تسجيل دخول في مجلد بدء التشغيل لكل مستخدم ويبدأ Gateway فورًا
- إذا تعطّل `schtasks` نفسه أو توقف عن الاستجابة، فإن OpenClaw يجهض ذلك المسار بسرعة الآن ويرجع إلى المسار البديل بدلًا من التعليق إلى الأبد
- لا تزال المهام المجدولة مفضلة عند توفرها لأنها توفر حالة إشراف أفضل

إذا كنت تريد CLI الأصلي فقط، من دون تثبيت خدمة Gateway، فاستخدم أحد هذين الأمرين:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

إذا كنت تريد فعلًا بدء تشغيل مُدارًا على Windows الأصلي:

```powershell
openclaw gateway install
openclaw gateway status --json
```

إذا حُظر إنشاء المهمة المجدولة، فسيظل وضع الخدمة البديل يبدأ تلقائيًا بعد تسجيل الدخول من خلال مجلد بدء التشغيل للمستخدم الحالي.

## Gateway

- [دليل تشغيل Gateway](/ar/gateway)
- [التكوين](/ar/gateway/configuration)

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

اختر **خدمة Gateway** عند المطالبة.

الإصلاح/الترحيل:

```
openclaw doctor
```

## بدء Gateway تلقائيًا قبل تسجيل الدخول إلى Windows

للإعدادات بلا واجهة، تأكد من تشغيل سلسلة الإقلاع كاملة حتى عندما لا يسجل أحد الدخول إلى
Windows.

### 1) إبقاء خدمات المستخدم قيد التشغيل من دون تسجيل دخول

داخل WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) تثبيت خدمة مستخدم Gateway الخاصة بـOpenClaw

داخل WSL:

```bash
openclaw gateway install
```

### 3) بدء WSL تلقائيًا عند إقلاع Windows

في PowerShell كمسؤول:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

استبدل `Ubuntu` باسم التوزيعة لديك من:

```powershell
wsl --list --verbose
```

### التحقق من سلسلة بدء التشغيل

بعد إعادة التشغيل (قبل تسجيل الدخول إلى Windows)، تحقق من WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## متقدم: كشف خدمات WSL عبر الشبكة المحلية LAN (portproxy)

لدى WSL شبكته الافتراضية الخاصة. إذا احتاج جهاز آخر إلى الوصول إلى خدمة
تعمل **داخل WSL** (SSH، أو خادم TTS محلي، أو Gateway)، فيجب عليك
تمرير منفذ Windows إلى عنوان IP الحالي الخاص بـWSL. يتغير عنوان IP الخاص بـWSL بعد عمليات إعادة التشغيل،
لذلك قد تحتاج إلى تحديث قاعدة التمرير.

مثال (PowerShell **كمسؤول**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

اسمح للمنفذ عبر جدار حماية Windows (مرة واحدة):

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
- يجب أن تشير العقد البعيدة إلى عنوان URL لـGateway **يمكن الوصول إليه** (وليس `127.0.0.1`)؛ استخدم
  `openclaw status --all` للتأكيد.
- استخدم `listenaddress=0.0.0.0` للوصول عبر LAN؛ أما `127.0.0.1` فيبقيه محليًا فقط.
- إذا كنت تريد جعل هذا تلقائيًا، فسجّل مهمة مجدولة لتشغيل خطوة التحديث
  عند تسجيل الدخول.

## تثبيت WSL2 خطوة بخطوة

### 1) تثبيت WSL2 + Ubuntu

افتح PowerShell (مسؤول):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

أعد التشغيل إذا طلب Windows ذلك.

### 2) تمكين systemd (مطلوب لتثبيت Gateway)

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

لإعداد عادي لأول مرة داخل WSL، اتبع مسار بدء الاستخدام الخاص بـLinux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

إذا كنت تطوّر من المصدر بدلًا من إجراء تهيئة أولية لأول مرة، فاستخدم
حلقة تطوير المصدر من [الإعداد](/ar/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

الدليل الكامل: [بدء الاستخدام](/ar/start/getting-started)

## تطبيق Windows المرافق

ليس لدينا تطبيق Windows مرافق بعد. نرحب بالمساهمات إذا كنت تريد
المساعدة في تحقيق ذلك.

## اتصال Git وGitHub (للمساهمين)

تحظر بعض الشبكات HTTPS إلى GitHub أو تخنقه. إذا فشل `git clone` بسبب انتهاء المهلة
أو إعادة تعيين الاتصال، فجرّب شبكة أخرى، أو VPN، أو وكيل HTTP/HTTPS توفره
مؤسستك.

إذا فشل `gh auth login` أثناء مسار جهاز المتصفح (على سبيل المثال انتهاء مهلة
الوصول إلى `github.com:443`)، فصادق باستخدام رمز وصول شخصي بدلًا من ذلك:

1. أنشئ رمزًا بنطاق `repo` على الأقل (PAT كلاسيكي) أو وصولًا دقيق الصلاحيات
   مكافئًا.
2. في PowerShell للجلسة الحالية:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. إذا حذّر `gh auth status` من فقدان `read:org`، فأصدر رمزًا يتضمن
   ذلك النطاق وأعد تعيين المتغير:

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

ينطبق `gh auth refresh -s read:org` فقط عندما تكون قد صادقت عبر `gh auth login`
ولديك بيانات اعتماد مخزنة لتحديثها (وليس عند استخدام `GH_TOKEN`).

لا تلتزم بالرموز مطلقًا ولا تلصقها في القضايا أو طلبات السحب.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [المنصات](/ar/platforms)
