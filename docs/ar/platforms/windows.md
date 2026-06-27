---
read_when:
    - تثبيت OpenClaw على Windows
    - الاختيار بين Windows Hub وWindows الأصلي وWSL2
    - إعداد تطبيق Windows المرافق أو وضع عقدة Windows
summary: 'دعم Windows: Windows Hub، وCLI وGateway الأصليان، وإعداد Gateway عبر WSL2، ووضع Node، واستكشاف الأخطاء وإصلاحها'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:59:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

يشحن OpenClaw تطبيقًا مرافقًا أصليًا باسم **Windows Hub** مع دعم CLI على Windows.
استخدم Windows Hub عندما تريد تطبيق سطح مكتب يتضمن الإعداد، وحالة علبة النظام، والدردشة،
وتشخيصات مركز الأوامر، وقدرات عقدة Windows. استخدم مثبّت PowerShell
عندما تريد CLI/Gateway مباشرة. استخدم WSL2 عندما تريد
بيئة تشغيل Gateway الأكثر توافقًا مع Linux.

## موصى به: Windows Hub

Windows Hub هو التطبيق المرافق الأصلي المبني بـ WinUI لنظامي Windows 10 20H2+ وWindows 11. يُثبَّت من دون امتيازات مسؤول، ويُنشر بمثبّتات
x64 وARM64 موقّعة ضمن إصدارات OpenClaw.

نزّل أحدث مثبّت مستقر من [صفحة إصدارات OpenClaw](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Checksums](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

إذا أعاد أحد روابط التنزيل أعلاه خطأ 404، فزر [صفحة الإصدارات](https://github.com/openclaw/openclaw/releases) وابحث عن أصول `OpenClawCompanion-Setup-*` في أحدث إصدار.

بعد التثبيت، شغّل **OpenClaw Companion** من قائمة البدء أو من علبة النظام.
يضيف المثبّت أيضًا اختصارات لإعداد Gateway، والدردشة، والإعدادات،
والتحقق من التحديثات، وإلغاء التثبيت.

### ما يتضمنه Windows Hub

- حالة علبة النظام والتشغيل عند تسجيل الدخول
- إعداد أول تشغيل لـ Gateway ضمن WSL مملوك للتطبيق ومحلي
- إعدادات اتصال لـ Gateways المحلية والبعيدة والممرّرة عبر SSH
- نافذة دردشة أصلية مع وصول إلى واجهة التحكم في المتصفح
- تشخيصات مركز الأوامر للجلسات، والاستخدام، والقنوات، والعقد، والإقران، و
  أوامر الإصلاح
- وضع عقدة Windows للوحات يتحكم بها الوكيل، والشاشة، والكاميرا، والإشعارات،
  وحالة الجهاز، وتحويل النص إلى كلام، وتحويل الكلام إلى نص، و`system.run` المتحكَّم به
- وضع خادم MCP محلي لعملاء MCP مثل Claude Desktop وClaude Code و
  Cursor

### التشغيل الأول

عند التشغيل الأول، يفتح Windows Hub الإعداد عندما لا توجد Gateway محفوظة وقابلة للاستخدام.
أسرع مسار هو **الإعداد محليًا**، والذي يجهّز توزيعة WSL
`OpenClawGateway` مملوكة للتطبيق، ويثبّت Gateway داخلها، ويقرن التطبيق.
لا يصدّر هذا توزيعة Ubuntu الحالية لديك ولا يعدّلها.

اختر **الإعداد المتقدم** أو افتح تبويب الاتصالات عندما تكون لديك Gateway بالفعل.
يمكنك الاتصال بـ:

- Gateway محلية على هذا الحاسوب
- Gateway ضمن WSL على هذا الحاسوب
- Gateway بعيدة عبر URL ورمز مميز أو رمز إعداد
- Gateway يمكن الوصول إليها عبر نفق SSH

عند انتهاء الإعداد، يتحول رمز علبة النظام إلى اللون الأخضر. افتح **مركز الأوامر** من
علبة النظام لتأكيد الاتصال، والإقران، وحالة العقدة، وصحة القنوات.

## وضع عقدة Windows

يمكن لـ Windows Hub التسجيل كعقدة OpenClaw من الدرجة الأولى. يمكن للوكيل بعد ذلك استخدام
قدرات Windows الأصلية المعلنة عبر Gateway.

تشمل الأوامر الشائعة:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` ومع الاشتراك الصريح، `screen.record`
- `camera.list` ومع الاشتراك الصريح، `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

يتطلب وضع العقدة الإقران مع Gateway. إذا عرض التطبيق طلب إقران، فوافق
عليه من مضيف Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

لا يمرر Gateway إلا الأوامر التي تعلنها العقدة وتسمح بها سياسة الخادم.
تتطلب الأوامر الحساسة للخصوصية مثل `screen.record` و`camera.snap` و
`camera.clip` اشتراكًا صريحًا عبر `gateway.nodes.allowCommands`.

## وضع MCP المحلي

يمكن لـ Windows Hub إتاحة سجل القدرات الأصلية نفسه في Windows كخادم
MCP محلي على local loopback. يكون هذا مفيدًا عندما تريد من عملاء MCP المحليين تشغيل
قدرات Windows من دون Gateway قيد التشغيل.

فعّله في إعدادات Windows Hub ضمن قسم المطور/المتقدم. يعرض التطبيق
نقطة نهاية local loopback ورمز الحامل بعد تفعيل الخادم.

مصفوفة الأوضاع:

| وضع العقدة | خادم MCP | السلوك                           |
| --------- | ---------- | ---------------------------------- |
| متوقف       | متوقف        | تطبيق سطح مكتب للمشغّل فقط          |
| قيد التشغيل        | متوقف        | عقدة Windows متصلة بـ Gateway     |
| متوقف       | قيد التشغيل         | خادم MCP محلي فقط              |
| قيد التشغيل        | قيد التشغيل         | عقدة Gateway مع خادم MCP محلي |

## CLI وGateway الأصليان على Windows

للاستخدام الموجّه للطرفية، ثبّت OpenClaw من PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

تحقق:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

تدفقات CLI وGateway الأصلية على Windows مدعومة وتستمر في التحسن.
يستخدم بدء التشغيل المُدار مهام Windows المجدولة عندما تكون متاحة. تحتفظ المهمة
بسكربت `gateway.cmd` القابل للقراءة في دليل حالة OpenClaw، لكنها تشغّله عبر
غلاف WScript مُولَّد باسم `gateway.vbs` كي لا يفتح Gateway العامل في الخلفية
نافذة وحدة تحكم مرئية. إذا رُفض إنشاء المهمة، يعود OpenClaw إلى عنصر تسجيل دخول
في مجلد Startup لكل مستخدم.

لتثبيت خدمة Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

إذا كنت تريد استخدام CLI فقط من دون خدمة Gateway مُدارة:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

يبقى WSL2 بيئة تشغيل Gateway الأكثر توافقًا مع Linux على Windows. يمكن لـ Windows Hub
إعداد Gateway ضمن WSL مملوك للتطبيق لك، أو يمكنك التثبيت يدويًا داخل
توزيعتك الخاصة.

الإعداد اليدوي:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

فعّل systemd داخل WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

أعد تشغيل WSL من PowerShell:

```powershell
wsl --shutdown
```

ثم ثبّت OpenClaw داخل WSL باستخدام البدء السريع الخاص بـ Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## بدء Gateway تلقائيًا قبل تسجيل الدخول إلى Windows

لإعدادات WSL بلا شاشة، تأكد من تشغيل سلسلة الإقلاع كاملة حتى عندما لا يسجل أحد
الدخول إلى Windows.

داخل WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

في PowerShell كمسؤول:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

استبدل `Ubuntu` باسم توزيعتك من:

```powershell
wsl --list --verbose
```

> **ملاحظة:** تغييران عن الوصفات الأقدم:
>
> - **`dbus-launch true` بدلًا من `/bin/true`** — في WSL ≥ 2.6.1.0، يتسبب تراجع ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) في إنهاء التوزيعة خمولًا بعد 15-20 ثانية من خروج آخر عميل، حتى مع تفعيل linger. يحافظ `dbus-launch true` على عملية فرعية من init حية كحل بديل ([نقاش المجتمع، microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` بدلًا من `/ru SYSTEM`** — توزيعات WSL لكل مستخدم (الإعداد الافتراضي) غير مرئية لحساب SYSTEM؛ تبدو المهمة كأنها تعمل لكن التوزيعة لا تبدأ أبدًا. تشغيلها بحسابك يتجنب ذلك. سيطلب Windows كلمة مرورك عند إنشاء المهمة.

بعد إعادة التشغيل، تحقق من WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## إتاحة خدمات WSL عبر LAN

لدى WSL شبكته الافتراضية الخاصة. إذا كان على جهاز آخر الوصول إلى خدمة داخل
WSL، فمرّر منفذ Windows إلى عنوان IP الحالي لـ WSL. يمكن أن يتغير عنوان IP الخاص بـ WSL بعد
إعادة التشغيل، لذا حدّث قاعدة التمرير عند الحاجة.

مثال في PowerShell كمسؤول:

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

ملاحظات:

- يستهدف SSH من جهاز آخر عنوان IP لمضيف Windows، على سبيل المثال
  `ssh user@windows-host -p 2222`.
- يجب أن تشير العقد البعيدة إلى URL يمكن الوصول إليه لـ Gateway، وليس `127.0.0.1`.
- استخدم `listenaddress=0.0.0.0` للوصول عبر LAN. استخدم `127.0.0.1` للوصول
  المحلي فقط.

## استكشاف الأخطاء وإصلاحها

### لا يظهر رمز علبة النظام

تحقق من مدير المهام بحثًا عن `OpenClaw.Tray.WinUI.exe`. إذا كان يعمل، فافتح
منطقة رموز علبة النظام المخفية وثبّته. إذا لم يكن يعمل، فشغّل **OpenClaw
Companion** من قائمة البدء.

### فشل الإعداد المحلي

افتح سجل الإعداد من Windows Hub أو افحص:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

الأسباب الشائعة هي تعطيل WSL، أو حظر الافتراضية، أو حالة WSL قديمة مملوكة للتطبيق،
أو فشل في الشبكة أثناء تثبيت حزمة Gateway.

### يقول التطبيق إن الإقران مطلوب

وافق على طلب المشغّل أو العقدة من Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

إذا كان لدى الجهاز رمز مميز مسبقًا، فأعد الاتصال من تبويب الاتصالات بعد
الموافقة.

### لا يمكن لدردشة الويب الوصول إلى Gateway بعيدة

تحتاج دردشة الويب البعيدة إلى HTTPS أو localhost. للشهادات الموقعة ذاتيًا، ثق
بالشهادة في Windows، أو استخدم نفق SSH إلى URL على localhost.

### فشل أوامر `screen.snapshot` أو الكاميرا أو الصوت

أكد أذونات Windows للكاميرا، والميكروفون، والتقاط الشاشة، و
الإشعارات. تعلن التثبيتات المعبأة القدرات المحمية، لكن Windows
قد يظل يطلب الإذن في المرة الأولى التي يستخدمها فيها أمر.

### فشل الاتصال بـ Git أو GitHub

تحظر بعض الشبكات أو تخنق HTTPS إلى GitHub. إذا فشل `git clone` أو `gh auth
login`، فجرّب شبكة أخرى، أو VPN، أو وكيل HTTP/HTTPS.

لمصادقة `gh` المعتمدة على الرمز المميز في الجلسة الحالية:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

لا تلتزم الرموز المميزة أبدًا ولا تلصقها في القضايا أو طلبات السحب.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [إعداد Node.js](/ar/install/node)
- [العقد](/ar/nodes)
- [واجهة التحكم](/ar/web/control-ui)
- [تهيئة Gateway](/ar/gateway/configuration)
