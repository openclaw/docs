---
read_when:
    - البحث عن حالة التطبيق المرافق على Linux
    - تخطيط تغطية المنصات أو المساهمات
    - تصحيح إنهاءات OOM على Linux أو الخروج 137 على VPS أو حاوية
summary: دعم Linux + حالة التطبيق المرافق
title: تطبيق Linux
x-i18n:
    generated_at: "2026-04-24T07:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

تُدعَم Gateway بالكامل على Linux. **Node هي بيئة التشغيل الموصى بها**.
ولا يُنصح باستخدام Bun مع Gateway (بسبب أخطاء WhatsApp/Telegram).

يُخطَّط لتطبيقات Linux المرافقة الأصلية. والمساهمات مرحب بها إذا كنت ترغب في المساعدة في بناء واحد منها.

## المسار السريع للمبتدئين (VPS)

1. ثبّت Node 24 (موصى به؛ ولا يزال Node 22 LTS، حاليًا `22.14+`، يعمل للتوافق)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. من حاسوبك المحمول: ‏`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. افتح `http://127.0.0.1:18789/` وصادِق باستخدام السر المشترك المهيأ (token افتراضيًا؛ أو كلمة مرور إذا ضبطت `gateway.auth.mode: "password"`)

الدليل الكامل لخادم Linux: [خادم Linux](/ar/vps). مثال VPS خطوة بخطوة: [exe.dev](/ar/install/exe-dev)

## التثبيت

- [البدء](/ar/start/getting-started)
- [التثبيت والتحديثات](/ar/install/updating)
- التدفقات الاختيارية: [Bun (تجريبي)](/ar/install/bun)، [Nix](/ar/install/nix)، [Docker](/ar/install/docker)

## Gateway

- [دليل تشغيل Gateway](/ar/gateway)
- [الإعداد](/ar/gateway/configuration)

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

اختر **Gateway service** عندما يُطلب منك ذلك.

الإصلاح/الترحيل:

```
openclaw doctor
```

## التحكم بالنظام (وحدة مستخدم systemd)

يثبّت OpenClaw خدمة مستخدم **systemd** افتراضيًا. استخدم خدمة **نظام**
للخوادم المشتركة أو الدائمة التشغيل. يقوم كل من `openclaw gateway install` و
`openclaw onboard --install-daemon` بالفعل بتوليد الوحدة القياسية الحالية
لك؛ فلا تكتب واحدة يدويًا إلا عندما تحتاج إلى إعداد مخصص للنظام/مدير الخدمة.
توجد الإرشادات الكاملة للخدمة في [دليل تشغيل Gateway](/ar/gateway).

إعداد أدنى:

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
KillMode=control-group

[Install]
WantedBy=default.target
```

فعّلها:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## ضغط الذاكرة وإنهاءات OOM

على Linux، تختار النواة ضحية OOM عندما ينفد memory من مضيف أو آلة افتراضية أو cgroup خاصة بحاوية.
وقد تكون Gateway ضحية سيئة لأنه يملك جلسات طويلة العمر
واتصالات قنوات. لذلك يوجّه OpenClaw العمليات الفرعية العابرة بحيث تُقتل قبل Gateway متى أمكن.

بالنسبة إلى عمليات Linux الفرعية المؤهلة، يبدأ OpenClaw العملية الفرعية عبر
غلاف قصير من نوع `/bin/sh` يرفع قيمة `oom_score_adj` الخاصة بالعملية الفرعية إلى `1000`، ثم
ينفذ الأمر الحقيقي عبر `exec`. وهذه عملية غير مميّزة لأن العملية الفرعية
لا تفعل سوى زيادة احتمالية قتلها عبر OOM.

تشمل أسطح العمليات الفرعية المغطاة ما يلي:

- العمليات الفرعية للأوامر التي يديرها المشرف،
- العمليات الفرعية لقشرة PTY،
- العمليات الفرعية لخوادم MCP stdio،
- عمليات المتصفح/Chrome التي يشغّلها OpenClaw.

يكون الغلاف خاصًا بـ Linux فقط ويتم تخطيه عندما يكون `/bin/sh` غير متاح. كما
يتم تخطيه أيضًا إذا كانت env الخاصة بالعملية الفرعية تضبط `OPENCLAW_CHILD_OOM_SCORE_ADJ=0` أو `false` أو
`no` أو `off`.

للتحقق من عملية فرعية:

```bash
cat /proc/<child-pid>/oom_score_adj
```

القيمة المتوقعة للعمليات الفرعية المغطاة هي `1000`. ويجب أن تحتفظ عملية Gateway
بقيمتها العادية، وعادةً `0`.

لا يحل هذا محل ضبط الذاكرة المعتاد. إذا كان VPS أو الحاوية يقتلان العمليات الفرعية
مرارًا، فقم بزيادة حد الذاكرة، أو تقليل التوازي، أو أضف ضوابط موارد أقوى مثل
`MemoryMax=` في systemd أو حدود الذاكرة على مستوى الحاوية.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [خادم Linux](/ar/vps)
- [Raspberry Pi](/ar/install/raspberry-pi)
