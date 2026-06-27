---
read_when:
    - جارٍ البحث عن حالة تطبيق Linux المرافق
    - تخطيط تغطية المنصات أو المساهمات
    - تصحيح أخطاء عمليات القتل بسبب نفاد الذاكرة OOM في Linux أو رمز الخروج 137 على VPS أو حاوية
summary: دعم Linux + حالة التطبيق المرافق
title: تطبيق Linux
x-i18n:
    generated_at: "2026-06-27T17:57:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

يدعم Gateway نظام Linux بالكامل. **Node هو وقت التشغيل الموصى به**.
لا يوصى باستخدام Bun مع Gateway (بسبب أخطاء WhatsApp/Telegram).

تطبيقات Linux المرافقة الأصلية مخطط لها. المساهمات مرحب بها إذا أردت المساعدة في بناء أحدها.

## المسار السريع للمبتدئين (VPS)

1. ثبّت Node 24 (موصى به؛ Node 22 LTS، حاليًا `22.19+`، لا يزال يعمل للتوافق)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. من حاسوبك المحمول: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. افتح `http://127.0.0.1:18789/` وصادِق باستخدام السر المشترك المكوَّن (الرمز افتراضيًا؛ أو كلمة المرور إذا عيّنت `gateway.auth.mode: "password"`)

دليل خادم Linux الكامل: [خادم Linux](/ar/vps). مثال VPS خطوة بخطوة: [exe.dev](/ar/install/exe-dev)

## التثبيت

- [بدء الاستخدام](/ar/start/getting-started)
- [التثبيت والتحديثات](/ar/install/updating)
- تدفقات اختيارية: [Bun (تجريبي)](/ar/install/bun)، [Nix](/ar/install/nix)، [Docker](/ar/install/docker)

## Gateway

- [دليل تشغيل Gateway](/ar/gateway)
- [التكوين](/ar/gateway/configuration)

## تثبيت خدمة Gateway (CLI)

استخدم أحد هذه الأوامر:

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

اختر **خدمة Gateway** عند مطالبتك.

الإصلاح/الترحيل:

```
openclaw doctor
```

## التحكم في النظام (وحدة مستخدم systemd)

يثبّت OpenClaw خدمة **مستخدم** في systemd افتراضيًا. استخدم خدمة **نظام**
للخوادم المشتركة أو التي تعمل دائمًا. يقوم `openclaw gateway install` و
`openclaw onboard --install-daemon` بالفعل بإنشاء الوحدة المرجعية الحالية
نيابةً عنك؛ اكتب واحدة يدويًا فقط عندما تحتاج إلى إعداد نظام/مدير خدمة
مخصص. توجد إرشادات الخدمة الكاملة في [دليل تشغيل Gateway](/ar/gateway).

الإعداد الأدنى:

أنشئ `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

فعّلها:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## ضغط الذاكرة وعمليات القتل بسبب OOM

على Linux، تختار النواة ضحية OOM عندما تنفد الذاكرة في مضيف أو VM أو cgroup
لحاوية. قد يكون Gateway ضحية سيئة لأنه يملك جلسات واتصالات قنوات طويلة العمر.
لذلك يوجّه OpenClaw عمليات الأبناء العابرة لتُقتل قبل Gateway عندما يكون ذلك
ممكنًا.

بالنسبة إلى عمليات الأبناء المؤهلة على Linux، يبدأ OpenClaw العملية الفرعية عبر
غلاف قصير من `/bin/sh` يرفع قيمة `oom_score_adj` الخاصة بالعملية الفرعية إلى
`1000`، ثم ينفّذ الأمر الحقيقي باستخدام `exec`. هذه عملية لا تتطلب امتيازات
لأن العملية الفرعية تزيد فقط من احتمال قتلها بسبب OOM.

تشمل أسطح عمليات الأبناء المشمولة:

- عمليات أوامر فرعية يديرها المشرف،
- عمليات أبناء لأصداف PTY،
- عمليات أبناء لخوادم MCP stdio،
- عمليات المتصفح/Chrome التي يشغّلها OpenClaw.

الغلاف خاص بـ Linux فقط ويُتخطى عندما لا يكون `/bin/sh` متاحًا. كما يُتخطى إذا
عيّنت بيئة العملية الفرعية `OPENCLAW_CHILD_OOM_SCORE_ADJ=0` أو `false` أو
`no` أو `off`.

للتحقق من عملية فرعية:

```bash
cat /proc/<child-pid>/oom_score_adj
```

القيمة المتوقعة للعمليات الفرعية المشمولة هي `1000`. يجب أن تحتفظ عملية Gateway
بدرجتها العادية، وغالبًا ما تكون `0`.

تعيّن وحدة systemd الموصى بها أيضًا `OOMPolicy=continue`. يحافظ ذلك على وحدة
Gateway حيّة عندما يختار قاتل OOM عملية فرعية عابرة؛ يمكن أن يفشل أمر/جلسة
العملية الفرعية ويبلّغ عن الخطأ دون أن يعتبر systemd خدمة Gateway بالكامل
فاشلة ويعيد تشغيل كل القنوات.

لا يحل هذا محل ضبط الذاكرة العادي. إذا كان VPS أو حاوية يقتل العمليات الفرعية
مرارًا، فزِد حد الذاكرة، أو قلّل التوازي، أو أضف عناصر تحكم أقوى في الموارد مثل
`MemoryMax=` في systemd أو حدود الذاكرة على مستوى الحاوية.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [خادم Linux](/ar/vps)
- [Raspberry Pi](/ar/install/raspberry-pi)
