---
read_when:
    - تريد عزل OpenClaw عن بيئة macOS الرئيسية لديك
    - تريد تكامل iMessage في بيئة معزولة
    - تريد بيئة macOS قابلة لإعادة الضبط يمكنك استنساخها
    - تريد مقارنة خيارات أجهزة macOS الافتراضية المحلية مقابل المستضافة
summary: شغّل OpenClaw في آلة افتراضية معزولة على macOS (محلية أو مستضافة) عندما تحتاج إلى العزل أو iMessage
title: أجهزة macOS الافتراضية
x-i18n:
    generated_at: "2026-06-27T17:52:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## الإعداد الافتراضي الموصى به (لمعظم المستخدمين)

- **خادم VPS صغير يعمل بنظام Linux** للحصول على Gateway دائم التشغيل وبتكلفة منخفضة. راجع [استضافة VPS](/ar/vps).
- **عتاد مخصص** (Mac mini أو جهاز Linux) إذا كنت تريد تحكمًا كاملًا و**عنوان IP منزليًا** لأتمتة المتصفح. تحظر مواقع كثيرة عناوين IP الخاصة بمراكز البيانات، لذلك غالبًا ما يعمل التصفح المحلي بشكل أفضل.
- **هجين:** أبقِ Gateway على VPS رخيص، وصِل جهاز Mac لديك كـ **عقدة** عندما تحتاج إلى أتمتة المتصفح/واجهة المستخدم. راجع [العُقد](/ar/nodes) و[Gateway عن بُعد](/ar/gateway/remote).

استخدم جهاز macOS افتراضيًا عندما تحتاج تحديدًا إلى قدرات متاحة على macOS فقط مثل iMessage أو تريد عزلًا صارمًا عن جهاز Mac اليومي لديك.

## خيارات جهاز macOS الافتراضي

### جهاز افتراضي محلي على جهاز Apple Silicon Mac لديك (Lume)

شغّل OpenClaw في جهاز macOS افتراضي معزول على جهاز Apple Silicon Mac الحالي لديك باستخدام [Lume](https://cua.ai/docs/lume).

يوفر لك ذلك:

- بيئة macOS كاملة ومعزولة (يبقى المضيف نظيفًا)
- دعم iMessage عبر `imsg` (المسار المحلي الافتراضي غير ممكن على Linux/Windows)
- إعادة ضبط فورية عبر استنساخ الأجهزة الافتراضية
- بدون عتاد إضافي أو تكاليف سحابية

### مزودو Mac المستضافون (السحابة)

إذا كنت تريد macOS في السحابة، فإن مزودي Mac المستضافين يعملون أيضًا:

- [MacStadium](https://www.macstadium.com/) (أجهزة Mac مستضافة)
- يعمل مزودو Mac مستضافون آخرون أيضًا؛ اتبع وثائقهم الخاصة بالجهاز الافتراضي + SSH

بعد أن تحصل على وصول SSH إلى جهاز macOS افتراضي، تابع من الخطوة 6 أدناه.

---

## المسار السريع (Lume، للمستخدمين ذوي الخبرة)

1. ثبّت Lume
2. `lume create openclaw --os macos --ipsw latest`
3. أكمل مساعد الإعداد، وفعّل تسجيل الدخول عن بُعد (SSH)
4. `lume run openclaw --no-display`
5. ادخل عبر SSH، وثبّت OpenClaw، واضبط القنوات
6. انتهيت

---

## ما تحتاجه (Lume)

- جهاز Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia أو أحدث على المضيف
- نحو 60 غيغابايت من مساحة القرص الحرة لكل جهاز افتراضي
- نحو 20 دقيقة

---

## 1) تثبيت Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

إذا لم يكن `~/.local/bin` ضمن PATH لديك:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

تحقق:

```bash
lume --version
```

الوثائق: [تثبيت Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) إنشاء جهاز macOS الافتراضي

```bash
lume create openclaw --os macos --ipsw latest
```

يؤدي هذا إلى تنزيل macOS وإنشاء الجهاز الافتراضي. تُفتح نافذة VNC تلقائيًا.

<Note>
قد يستغرق التنزيل بعض الوقت حسب اتصالك.
</Note>

---

## 3) إكمال مساعد الإعداد

في نافذة VNC:

1. اختر اللغة والمنطقة
2. تجاوز Apple ID (أو سجّل الدخول إذا كنت تريد iMessage لاحقًا)
3. أنشئ حساب مستخدم (تذكّر اسم المستخدم وكلمة المرور)
4. تجاوز كل الميزات الاختيارية

بعد اكتمال الإعداد:

1. فعّل SSH: افتح إعدادات النظام -> عام -> مشاركة وفعّل "تسجيل الدخول عن بُعد".
2. لاستخدام الجهاز الافتراضي دون واجهة عرض، فعّل تسجيل الدخول التلقائي: افتح إعدادات النظام -> المستخدمون والمجموعات، وحدد "تسجيل الدخول تلقائيًا باسم:"، واختر مستخدم الجهاز الافتراضي.

---

## 4) الحصول على عنوان IP للجهاز الافتراضي

```bash
lume get openclaw
```

ابحث عن عنوان IP (عادةً `192.168.64.x`).

---

## 5) الدخول إلى الجهاز الافتراضي عبر SSH

```bash
ssh youruser@192.168.64.X
```

استبدل `youruser` بالحساب الذي أنشأته، واستبدل عنوان IP بعنوان IP الخاص بجهازك الافتراضي.

---

## 6) تثبيت OpenClaw

داخل الجهاز الافتراضي:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

اتبع مطالبات التهيئة لإعداد مزود النموذج لديك (Anthropic وOpenAI وما إلى ذلك).

---

## 7) ضبط القنوات

عدّل ملف الإعدادات:

```bash
nano ~/.openclaw/openclaw.json
```

أضف قنواتك:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

ثم سجّل الدخول إلى WhatsApp (امسح رمز QR):

```bash
openclaw channels login
```

---

## 8) تشغيل الجهاز الافتراضي دون واجهة عرض

أوقف الجهاز الافتراضي وأعد تشغيله بدون عرض:

```bash
lume stop openclaw
lume run openclaw --no-display
```

يعمل الجهاز الافتراضي في الخلفية. يحافظ عفريت OpenClaw على تشغيل Gateway.

للتحقق من الحالة:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## إضافة: تكامل iMessage

هذه هي الميزة الأبرز للتشغيل على macOS. استخدم [iMessage](/ar/channels/imessage) مع `imsg` لإضافة الرسائل إلى OpenClaw.

داخل الجهاز الافتراضي:

1. سجّل الدخول إلى الرسائل.
2. ثبّت `imsg`.
3. امنح إذن الوصول الكامل إلى القرص وإذن الأتمتة للعملية التي تشغّل OpenClaw/`imsg`.
4. تحقق من دعم RPC باستخدام `imsg rpc --help`.

أضف إلى إعدادات OpenClaw لديك:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

أعد تشغيل Gateway. يمكن لوكيلك الآن إرسال رسائل iMessage واستقبالها.

تفاصيل الإعداد الكاملة: [قناة iMessage](/ar/channels/imessage)

---

## حفظ صورة ذهبية

قبل إجراء مزيد من التخصيص، التقط لقطة لحالتك النظيفة:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

أعد الضبط في أي وقت:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## التشغيل على مدار الساعة

أبقِ الجهاز الافتراضي قيد التشغيل عبر:

- إبقاء جهاز Mac موصولًا بالطاقة
- تعطيل السكون في إعدادات النظام → موفر الطاقة
- استخدام `caffeinate` عند الحاجة

للحصول على تشغيل دائم حقيقي، فكّر في Mac mini مخصص أو VPS صغير. راجع [استضافة VPS](/ar/vps).

---

## استكشاف الأخطاء وإصلاحها

| المشكلة                  | الحل                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------- |
| تعذّر الدخول إلى الجهاز الافتراضي عبر SSH | تحقق من تفعيل "تسجيل الدخول عن بُعد" في إعدادات النظام الخاصة بالجهاز الافتراضي |
| لا يظهر عنوان IP للجهاز الافتراضي | انتظر حتى يكتمل إقلاع الجهاز الافتراضي، ثم شغّل `lume get openclaw` مرة أخرى |
| أمر Lume غير موجود       | أضف `~/.local/bin` إلى PATH لديك                                                   |
| رمز WhatsApp QR لا يُمسح | تأكد من أنك مسجّل الدخول إلى الجهاز الافتراضي (وليس المضيف) عند تشغيل `openclaw channels login` |

---

## وثائق ذات صلة

- [استضافة VPS](/ar/vps)
- [العُقد](/ar/nodes)
- [Gateway عن بُعد](/ar/gateway/remote)
- [قناة iMessage](/ar/channels/imessage)
- [البدء السريع مع Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [مرجع Lume CLI](https://cua.ai/docs/lume/reference/cli-reference)
- [إعداد جهاز افتراضي غير مراقب](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (متقدم)
- [عزل Docker](/ar/install/docker) (نهج عزل بديل)
