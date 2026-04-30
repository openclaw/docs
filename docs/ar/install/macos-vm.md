---
read_when:
    - تريد عزل OpenClaw عن بيئة macOS الرئيسية لديك
    - تريد تكامل iMessage (BlueBubbles) في بيئة معزولة
    - تريد بيئة macOS قابلة لإعادة التعيين يمكنك استنساخها
    - تريد مقارنة خيارات الآلات الافتراضية لنظام macOS المحلية مقابل المستضافة
summary: شغّل OpenClaw في آلة افتراضية معزولة بنظام macOS (محلية أو مستضافة) عندما تحتاج إلى العزل أو iMessage
title: أجهزة macOS الافتراضية
x-i18n:
    generated_at: "2026-04-30T08:08:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# OpenClaw على أجهزة macOS الافتراضية (Sandboxing)

## الإعداد الافتراضي الموصى به (لمعظم المستخدمين)

- **VPS صغير يعمل بنظام Linux** للحصول على Gateway يعمل دائمًا وبتكلفة منخفضة. راجع [استضافة VPS](/ar/vps).
- **عتاد مخصص** (Mac mini أو جهاز Linux) إذا كنت تريد تحكمًا كاملًا و**عنوان IP سكنيًا** لأتمتة المتصفح. تحظر مواقع كثيرة عناوين IP الخاصة بمراكز البيانات، لذلك غالبًا ما يعمل التصفح المحلي بشكل أفضل.
- **مختلط:** أبقِ Gateway على VPS رخيص، ووصل جهاز Mac الخاص بك كـ **node** عندما تحتاج إلى أتمتة المتصفح/واجهة المستخدم. راجع [العُقد](/ar/nodes) و[Gateway البعيد](/ar/gateway/remote).

استخدم جهاز macOS افتراضيًا عندما تحتاج تحديدًا إلى إمكانات حصرية لـ macOS (iMessage/BlueBubbles) أو تريد عزلًا صارمًا عن جهاز Mac اليومي الخاص بك.

## خيارات جهاز macOS الافتراضي

### جهاز افتراضي محلي على جهاز Apple Silicon Mac الخاص بك (Lume)

شغّل OpenClaw داخل جهاز macOS افتراضي معزول على جهاز Apple Silicon Mac الحالي لديك باستخدام [Lume](https://cua.ai/docs/lume).

يمنحك هذا:

- بيئة macOS كاملة ومعزولة (يبقى المضيف نظيفًا)
- دعم iMessage عبر BlueBubbles (غير ممكن على Linux/Windows)
- إعادة تعيين فورية عبر استنساخ الأجهزة الافتراضية
- دون عتاد إضافي أو تكاليف سحابية

### مزودو Mac المستضافون (السحابة)

إذا كنت تريد macOS في السحابة، فإن مزودي Mac المستضافين يعملون أيضًا:

- [MacStadium](https://www.macstadium.com/) (أجهزة Mac مستضافة)
- يعمل مزودو Mac المستضافون الآخرون أيضًا؛ اتبع وثائق الجهاز الافتراضي وSSH لديهم

بعد حصولك على وصول SSH إلى جهاز macOS افتراضي، تابع من الخطوة 6 أدناه.

---

## المسار السريع (Lume، للمستخدمين ذوي الخبرة)

1. ثبّت Lume
2. `lume create openclaw --os macos --ipsw latest`
3. أكمل مساعد الإعداد، وفعل Remote Login (SSH)
4. `lume run openclaw --no-display`
5. ادخل عبر SSH، وثبّت OpenClaw، واضبط القنوات
6. انتهى

---

## ما تحتاجه (Lume)

- جهاز Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia أو أحدث على المضيف
- نحو 60 GB من مساحة القرص الحرة لكل جهاز افتراضي
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

ينزل هذا macOS وينشئ الجهاز الافتراضي. تُفتح نافذة VNC تلقائيًا.

<Note>
قد يستغرق التنزيل بعض الوقت حسب اتصالك.
</Note>

---

## 3) إكمال مساعد الإعداد

في نافذة VNC:

1. اختر اللغة والمنطقة
2. تخطَّ Apple ID (أو سجّل الدخول إذا كنت تريد iMessage لاحقًا)
3. أنشئ حساب مستخدم (تذكر اسم المستخدم وكلمة المرور)
4. تخطَّ كل الميزات الاختيارية

بعد اكتمال الإعداد، فعّل SSH:

1. افتح System Settings → General → Sharing
2. فعّل "Remote Login"

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

اتبع مطالبات الإعداد الأولي لضبط مزود النموذج الخاص بك (Anthropic وOpenAI وغيرهما).

---

## 7) ضبط القنوات

حرر ملف الإعدادات:

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

ثم سجّل الدخول إلى WhatsApp (امسح QR):

```bash
openclaw channels login
```

---

## 8) تشغيل الجهاز الافتراضي دون واجهة عرض

أوقف الجهاز الافتراضي وأعد تشغيله دون عرض:

```bash
lume stop openclaw
lume run openclaw --no-display
```

يعمل الجهاز الافتراضي في الخلفية. تبقي خدمة OpenClaw الخفية Gateway قيد التشغيل.

للتحقق من الحالة:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## إضافة: تكامل iMessage

هذه هي الميزة الأهم للتشغيل على macOS. استخدم [BlueBubbles](https://bluebubbles.app) لإضافة iMessage إلى OpenClaw.

داخل الجهاز الافتراضي:

1. نزّل BlueBubbles من bluebubbles.app
2. سجّل الدخول باستخدام Apple ID الخاص بك
3. فعّل Web API واضبط كلمة مرور
4. وجّه BlueBubbles webhooks إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

أضف إلى إعداد OpenClaw لديك:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

أعد تشغيل Gateway. يمكن لوكيلك الآن إرسال iMessages واستقبالها.

تفاصيل الإعداد الكاملة: [قناة BlueBubbles](/ar/channels/bluebubbles)

---

## حفظ صورة ذهبية

قبل إجراء مزيد من التخصيصات، التقط نسخة من الحالة النظيفة:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

أعد التعيين في أي وقت:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## التشغيل على مدار الساعة

أبقِ الجهاز الافتراضي قيد التشغيل عبر:

- إبقاء جهاز Mac موصولًا بالطاقة
- تعطيل السكون في System Settings → Energy Saver
- استخدام `caffeinate` عند الحاجة

للحصول على تشغيل دائم حقيقي، فكر في جهاز Mac mini مخصص أو VPS صغير. راجع [استضافة VPS](/ar/vps).

---

## استكشاف الأخطاء وإصلاحها

| المشكلة                  | الحل                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------- |
| لا يمكن الدخول إلى الجهاز الافتراضي عبر SSH | تحقق من تفعيل "Remote Login" في System Settings داخل الجهاز الافتراضي              |
| عنوان IP للجهاز الافتراضي لا يظهر | انتظر حتى يكتمل إقلاع الجهاز الافتراضي، ثم شغّل `lume get openclaw` مرة أخرى       |
| أمر Lume غير موجود       | أضف `~/.local/bin` إلى PATH لديك                                                   |
| لا يتم مسح QR الخاص بـ WhatsApp | تأكد من أنك مسجل الدخول إلى الجهاز الافتراضي (وليس المضيف) عند تشغيل `openclaw channels login` |

---

## وثائق ذات صلة

- [استضافة VPS](/ar/vps)
- [العُقد](/ar/nodes)
- [Gateway البعيد](/ar/gateway/remote)
- [قناة BlueBubbles](/ar/channels/bluebubbles)
- [بدء Lume السريع](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [مرجع Lume CLI](https://cua.ai/docs/lume/reference/cli-reference)
- [إعداد جهاز افتراضي غير مراقب](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (متقدم)
- [Docker Sandboxing](/ar/install/docker) (نهج عزل بديل)
