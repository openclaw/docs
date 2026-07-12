---
read_when:
    - البحث عن حالة التطبيق المصاحب لنظام Linux
    - التخطيط لتغطية المنصات أو المساهمات
    - تصحيح عمليات الإنهاء بسبب نفاد الذاكرة (OOM) في Linux أو الخروج بالرمز 137 على خادم VPS أو حاوية
summary: دعم Linux وحالة التطبيق المرافق
title: تطبيق Linux
x-i18n:
    generated_at: "2026-07-12T06:05:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

يحظى Gateway بدعم كامل على Linux. ويُعد Node بيئة التشغيل الموصى بها؛ أما Bun
فلا يُنصح به (بسبب مشكلات معروفة في WhatsApp/Telegram).

لا يوجد حتى الآن تطبيق مرافق أصلي لنظام Linux. نرحب بالمساهمات.

## المسار السريع (VPS)

1. ثبّت Node 24 (موصى به) أو Node 22.19+ (إصدار LTS، ولا يزال مدعومًا).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. من حاسوبك المحمول: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. افتح `http://127.0.0.1:18789/` وصادِق باستخدام السر المشترك المُهيأ
   (رمز مميز افتراضيًا؛ أو كلمة مرور إذا كانت قيمة `gateway.auth.mode` هي `"password"`).

دليل الخادم الكامل: [خادم Linux](/ar/vps). مثال تفصيلي خطوة بخطوة على VPS:
[exe.dev](/ar/install/exe-dev).

## التثبيت

- [بدء الاستخدام](/ar/start/getting-started)
- [التثبيت والتحديثات](/ar/install/updating)
- اختياري: [Bun (تجريبي)](/ar/install/bun)، [Nix](/ar/install/nix)، [Docker](/ar/install/docker)

## خدمة Gateway ‏(systemd)

ثبّتها بإحدى الطرق التالية:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # حدد "خدمة Gateway" عند مطالبتك
```

لإصلاح تثبيت موجود أو ترحيله:

```bash
openclaw doctor
```

ينشئ `openclaw gateway install` وحدة systemd خاصة **بالمستخدم** افتراضيًا. تتوفر
إرشادات الخدمة الكاملة، بما في ذلك صيغة الوحدة على مستوى **النظام** للمضيفين
المشتركين أو دائمي التشغيل، في [دليل تشغيل Gateway](/ar/gateway#supervision-and-service-lifecycle).

اكتب وحدة يدويًا فقط لإعداد مخصص. مثال مبسط لوحدة المستخدم
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

فعّلها:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## ضغط الذاكرة وإنهاء العمليات بسبب نفاد الذاكرة

في Linux، تختار النواة عمليةً ضحيةً لنفاد الذاكرة (OOM) عندما تنفد ذاكرة المضيف
أو الجهاز الافتراضي أو مجموعة التحكم في الحاوية. ويُعد Gateway ضحيةً غير مناسبة
لأنه يدير جلسات طويلة الأمد واتصالات القنوات، لذا يوجّه OpenClaw النظام نحو
إنهاء العمليات الفرعية المؤقتة أولًا متى أمكن.

بالنسبة إلى العمليات الفرعية المؤهلة التي تُنشأ على Linux، يغلّف OpenClaw الأمر
بطبقة قصيرة من `/bin/sh` ترفع قيمة `oom_score_adj` الخاصة بالعملية الفرعية نفسها
إلى `1000`، ثم تستخدم `exec` لتشغيل الأمر الفعلي. لا يتطلب ذلك امتيازات: إذ يمكن
للعملية دائمًا رفع درجة OOM الخاصة بها.

أسطح العمليات الفرعية المشمولة:

- العمليات الفرعية للأوامر التي يديرها المشرف
- العمليات الفرعية لصدفة PTY
- العمليات الفرعية لخادم MCP عبر الإدخال والإخراج القياسيين
- عمليات المتصفح/Chrome التي يشغّلها OpenClaw (عبر بيئة تشغيل العمليات في SDK الخاص بالـ Plugin)

يعمل هذا الغلاف على Linux فقط، ويُتخطى عندما لا يتوفر `/bin/sh`، أو عندما تضبط
بيئة العملية الفرعية `OPENCLAW_CHILD_OOM_SCORE_ADJ` على `0` أو `false` أو `no`
أو `off`.

للتحقق من عملية فرعية:

```bash
cat /proc/<child-pid>/oom_score_adj
```

القيمة المتوقعة للعمليات الفرعية المشمولة هي `1000`؛ أما عملية Gateway نفسها
فتحتفظ بدرجتها العادية (عادةً `0`).

يُبقي `OOMPolicy=continue` في وحدة systemd خدمة Gateway قيد التشغيل عندما يختار
مُنهي عمليات OOM عمليةً فرعيةً مؤقتة، بدلًا من وضع علامة فشل على الوحدة بأكملها
وإعادة تشغيل جميع القنوات؛ وتُبلغ العملية الفرعية أو الجلسة الفاشلة عن خطئها
بنفسها.

لا يغني هذا عن الضبط المعتاد للذاكرة. إذا كان VPS أو الحاوية ينهيان العمليات
الفرعية مرارًا، فارفع حد الذاكرة أو قلّل التزامن أو أضف ضوابط أقوى للموارد
(`MemoryMax=` في systemd، أو حدود ذاكرة الحاوية).

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [خادم Linux](/ar/vps)
- [Raspberry Pi](/ar/install/raspberry-pi)
- [دليل تشغيل Gateway](/ar/gateway)
- [تهيئة Gateway](/ar/gateway/configuration)
