---
read_when:
    - تثبيت OpenClaw على Windows
    - الاختيار بين Windows Hub وWindows الأصلي وWSL2
    - إعداد التطبيق المرافق لنظام Windows أو وضع Node على Windows
summary: 'دعم Windows: Windows Hub، وCLI وGateway أصليان، وإعداد Gateway على WSL2، ووضع Node، واستكشاف الأخطاء وإصلاحها'
title: Windows
x-i18n:
    generated_at: "2026-07-16T14:24:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

يوفّر OpenClaw تطبيقًا مرافقًا أصليًا باسم **Windows Hub** إلى جانب دعم CLI على Windows.
استخدم Windows Hub للحصول على تطبيق سطح مكتب يتضمن الإعداد، وحالة علبة النظام، والدردشة، وتشخيصات مركز
الأوامر، وإمكانات عقدة Windows. استخدم مُثبّت PowerShell
لتثبيت CLI/Gateway مباشرةً. استخدم WSL2 للحصول على بيئة تشغيل Gateway
الأكثر توافقًا مع Linux.

## موصى به: Windows Hub

Windows Hub هو التطبيق المرافق الأصلي المبني باستخدام WinUI لنظامي Windows 10 20H2+
وWindows 11. يُثبَّت دون امتيازات المسؤول ويوفّر مُثبّتات x64
وARM64 موقّعة من صفحة إصداراته الخاصة.

يُنشَر Windows Hub بصورة مستقلة عن CLI وGateway الخاصين بـ OpenClaw. نزّل
أحدث مُثبّت مستقر لـ Hub من
[صفحة إصدارات Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
أو مباشرةً عبر `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

إذا أعاد أحد الرابطين أعلاه خطأ 404، فانتقل إلى [صفحة إصدارات Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
وافتح أحدث إصدار مستقر من Windows Hub. تعكس إصدارات OpenClaw المستقرة العادية
أيضًا نسخة Windows Hub مثبّتة الإصدار وخاضعة للتحقق؛ وقد تتأخر هذه النسخة المعكوسة عن
إصدار مستقل أحدث من Hub.

بعد التثبيت، شغّل **OpenClaw Companion** من قائمة Start أو علبة
النظام. يضيف المُثبّت أيضًا اختصارات لإعداد Gateway والدردشة والإعدادات
والتحقق من وجود تحديثات وإلغاء التثبيت.

### ما يتضمنه Windows Hub

- حالة علبة النظام والتشغيل عند تسجيل الدخول.
- إعداد التشغيل الأول لـ WSL Gateway محلي يملكه التطبيق.
- إعدادات الاتصال ببوابات Gateway المحلية والبعيدة والتي يمكن الوصول إليها عبر نفق SSH.
- نافذة دردشة أصلية بالإضافة إلى الوصول إلى واجهة التحكم في المتصفح.
- تشخيصات مركز الأوامر للجلسات والاستخدام والقنوات والعقد والاقتران
  وأوامر الإصلاح.
- وضع عقدة Windows للوحة العرض والشاشة والكاميرا
  والإشعارات وحالة الجهاز والتحدث و`system.run` المتحكَّم فيه، تحت تحكم الوكيل.
- وضع خادم MCP محلي لعملاء MCP مثل Claude Desktop وClaude Code
  وCursor.

### التشغيل الأول

عند التشغيل الأول، يفتح Windows Hub الإعداد إذا لم توجد
Gateway محفوظة قابلة للاستخدام. أسرع مسار هو **Set up locally**، الذي ينشئ
توزيعة WSL ‏`OpenClawGateway` يملكها التطبيق، ويثبّت Gateway داخلها،
ويقترن بالتطبيق. لا يصدّر هذا توزيعة Ubuntu الحالية لديك ولا يعدّلها.

اختر **Advanced setup** أو افتح علامة تبويب Connections إذا كانت لديك
Gateway بالفعل. يمكنك الاتصال بما يلي:

- Gateway محلية على هذا الكمبيوتر
- WSL Gateway على هذا الكمبيوتر
- Gateway بعيدة باستخدام عنوان URL ورمز مميز أو رمز إعداد
- Gateway يمكن الوصول إليها عبر نفق SSH

عند اكتمال الإعداد، تتحول أيقونة العلبة إلى اللون الأخضر. افتح **Command Center** من
العلبة للتأكد من الاتصال والاقتران وحالة العقدة وسلامة القنوات.

## وضع عقدة Windows

يمكن لـ Windows Hub التسجيل كعقدة OpenClaw حتى يتمكن الوكيل من استخدام
إمكانات Windows الأصلية المعلنة عبر Gateway. يجب أن تكون أوامر العقدة
معلنة من قِبل العقدة ومسموحًا بها وفق سياسة Gateway قبل تشغيلها؛ راجع
[العقد](/ar/nodes#command-policy) للاطلاع على نموذج السماح/الرفض الكامل.

الأوامر الشائعة:

| الفئة | الأوامر                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| لوحة العرض | `canvas.present`، `canvas.hide`، `canvas.navigate`، `canvas.eval`، `canvas.snapshot` |
| الشاشة | `screen.snapshot`؛ يتطلب `screen.record` اشتراكًا صريحًا                          |
| الكاميرا | `camera.list`؛ يتطلب `camera.snap` و`camera.clip` اشتراكًا صريحًا                  |
| النظام | `system.notify`، `system.run`، `system.run.prepare`، `system.which`                  |
| الجهاز | `location.get`، `device.info`، `device.status`                                       |
| التحدث   | `talk.ptt.start`، `talk.ptt.stop`، `talk.ptt.cancel`، `talk.ptt.once`، `talk.speak`  |

يتطلب وضع العقدة الاقتران بـ Gateway. إذا عرض التطبيق طلب اقتران،
فوافق عليه من مضيف Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

لا تعيد Gateway توجيه سوى الأوامر التي تعلنها العقدة وتسمح بها
سياسة الخادم. تحتاج الأوامر الحساسة للخصوصية مثل `screen.record` و`camera.snap`
و`camera.clip` إلى اشتراك `gateway.nodes.allowCommands` صريح.

## وضع MCP المحلي

يمكن لـ Windows Hub إتاحة سجل إمكانات Windows الأصلية نفسه بوصفه
خادم MCP محليًا على واجهة الاسترجاع، بحيث يستطيع عملاء MCP المحليون التحكم في إمكانات Windows
دون تشغيل OpenClaw Gateway.

فعّله في إعدادات Windows Hub ضمن قسم المطور/الإعدادات المتقدمة. يعرض
التطبيق نقطة نهاية الاسترجاع ورمز الحامل بمجرد تمكين الخادم.

مصفوفة الأوضاع:

| وضع العقدة | خادم MCP | السلوك                           |
| --------- | ---------- | ---------------------------------- |
| متوقف       | متوقف        | تطبيق سطح مكتب للمشغّل فقط          |
| مفعّل        | متوقف        | عقدة Windows متصلة بـ Gateway     |
| متوقف       | مفعّل         | خادم MCP محلي فقط              |
| مفعّل        | مفعّل         | عقدة Gateway بالإضافة إلى خادم MCP محلي |

## CLI وGateway الأصليان على Windows

للاستخدام المعتمد على الطرفية، ثبّت OpenClaw من PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

تحقّق:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

يستخدم بدء التشغيل المُدار «المهام المجدولة» في Windows عند توفرها. تحتفظ المهمة
بالبرنامج النصي `gateway.cmd` القابل للقراءة في دليل حالة OpenClaw، لكنها تشغّله
عبر غلاف WScript مُنشأ باسم `gateway.vbs`، كي لا تفتح Gateway العاملة
في الخلفية نافذة وحدة تحكم مرئية. إذا رُفض إنشاء المهمة، يعود OpenClaw
إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup.

ثبّت خدمة Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

لاستخدام CLI فقط دون خدمة Gateway مُدارة:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

يظل WSL2 بيئة تشغيل Gateway الأكثر توافقًا مع Linux على Windows. يمكن لـ Windows
Hub إعداد WSL Gateway يملكها التطبيق، أو يمكنك التثبيت يدويًا داخل
توزيعتك الخاصة.

الإعداد اليدوي:

```powershell
wsl --install
# أو اختر توزيعة صراحةً:
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

ثم ثبّت OpenClaw داخل WSL باستخدام دليل البدء السريع لـ Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## التشغيل التلقائي لـ Gateway قبل تسجيل الدخول إلى Windows

بالنسبة إلى إعدادات WSL بلا واجهة، تأكد من تشغيل سلسلة الإقلاع كاملةً حتى عندما لا
يسجّل أحد الدخول إلى Windows.

داخل WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

في PowerShell بصلاحيات المسؤول:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

استبدل `Ubuntu` باسم توزيعتك من:

```powershell
wsl --list --verbose
```

<Note>
تغييران مقارنةً بالوصفات الأقدم:

- **`dbus-launch true` بدلًا من `/bin/true`**: في WSL >= 2.6.1.0 يؤدي
  انحدار ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  إلى إنهاء التوزيعة عند الخمول بعد 15-20 ثانية من خروج آخر عميل، حتى
  مع تمكين الاستمرار. يُبقي `dbus-launch true` عملية فرعية لـ init قيد التشغيل
  كحل بديل (نقاش المجتمع، [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` بدلًا من `/ru SYSTEM`**: توزيعات WSL الخاصة بكل مستخدم (وهي
  الإعداد الافتراضي) غير مرئية لحساب SYSTEM، لذلك تبدو المهمة
  وكأنها تعمل، لكن التوزيعة لا تبدأ أبدًا. يؤدي التشغيل باستخدام حسابك
  إلى تجنب ذلك؛ ويطلب Windows كلمة مرورك عند إنشاء المهمة.

</Note>

بعد إعادة التشغيل، تحقّق من داخل WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## إتاحة خدمات WSL عبر الشبكة المحلية

لدى WSL شبكته الافتراضية الخاصة. إذا كان يجب أن يصل جهاز آخر إلى خدمة
داخل WSL، فأعِد توجيه منفذ Windows إلى عنوان IP الحالي لـ WSL. قد يتغير عنوان IP الخاص بـ WSL
بعد عمليات إعادة التشغيل، لذا حدّث قاعدة إعادة التوجيه عند الحاجة.

مثال في PowerShell بصلاحيات المسؤول:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP غير موجود." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

ملاحظات:

- يستهدف SSH من جهاز آخر عنوان IP لمضيف Windows، مثل `ssh user@windows-host -p 2222`.
- يجب أن تشير العقد البعيدة إلى عنوان URL قابل للوصول لـ Gateway، وليس `127.0.0.1`.
- استخدم `listenaddress=0.0.0.0` للوصول عبر الشبكة المحلية، و`127.0.0.1` للوصول المحلي فقط.

## استكشاف الأخطاء وإصلاحها

### لا تظهر أيقونة علبة النظام

تحقّق من «إدارة المهام» بحثًا عن `OpenClaw.Tray.WinUI.exe`. إذا كانت العملية قيد التشغيل، فافتح
منطقة أيقونات العلبة المخفية وثبّتها. وإن لم تكن كذلك، فشغّل **OpenClaw Companion** من
قائمة Start.

### فشل الإعداد المحلي

افتح سجل الإعداد من Windows Hub أو افحص:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

الأسباب الشائعة: تعطيل WSL، أو حظر المحاكاة الافتراضية، أو تقادم حالة WSL
التي يملكها التطبيق، أو فشل الشبكة أثناء تثبيت حزمة Gateway.

### يفيد التطبيق بأن الاقتران مطلوب

وافق على طلب المشغّل أو العقدة من Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

إذا كان لدى الجهاز رمز مميز بالفعل، فأعِد الاتصال من علامة تبويب Connections بعد
الموافقة.

### لا تستطيع دردشة الويب الوصول إلى Gateway بعيدة

تتطلب دردشة الويب البعيدة HTTPS أو localhost. بالنسبة إلى الشهادات الموقّعة ذاتيًا، ضع
الشهادة ضمن الشهادات الموثوقة في Windows، أو استخدم نفق SSH إلى عنوان URL على localhost.

### فشل أوامر `screen.snapshot` أو الكاميرا أو الصوت

تحقّق من أذونات Windows للكاميرا والميكروفون والتقاط الشاشة
والإشعارات. تعلن عمليات التثبيت المعبّأة الإمكانات المحمية، لكن
قد يظل Windows يطلب الإذن في أول مرة يستخدم فيها أمرٌ ما تلك الإمكانات.

### فشل الاتصال بـ Git أو GitHub

تحظر بعض الشبكات اتصال HTTPS بـ GitHub أو تحد من سرعته. إذا فشل `git clone` أو
`gh auth login`، فجرّب شبكة أخرى أو VPN أو وكيل HTTP/HTTPS.

لمصادقة `gh` المستندة إلى رمز مميز في الجلسة الحالية:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

لا تودع الرموز المميزة أبدًا ولا تلصقها في المشكلات أو طلبات السحب.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [إعداد Node.js](/ar/install/node)
- [العقد](/ar/nodes)
- [واجهة التحكم](/ar/web/control-ui)
- [تهيئة Gateway](/ar/gateway/configuration)
