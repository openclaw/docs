---
read_when:
    - تريد إبقاء OpenClaw معزولًا عن بيئة macOS الرئيسية لديك
    - تريد تكامل iMessage (BlueBubbles) في بيئة معزولة
    - تريد بيئة macOS قابلة لإعادة الضبط يمكنك استنساخها
    - تريد مقارنة خيارات الأجهزة الافتراضية المحلية مقابل المستضافة لنظام macOS
summary: شغّل OpenClaw في جهاز افتراضي معزول يعمل بنظام macOS (محلي أو مستضاف) عندما تحتاج إلى العزل أو iMessage
title: آلات macOS الافتراضية
x-i18n:
    generated_at: "2026-05-06T08:01:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## الإعداد الافتراضي الموصى به (معظم المستخدمين)

- **VPS Linux صغير** لتشغيل Gateway دائم وبتكلفة منخفضة. راجع [استضافة VPS](/ar/vps).
- **عتاد مخصص** (Mac mini أو جهاز Linux) إذا كنت تريد تحكما كاملا و**عنوان IP منزليا** لأتمتة المتصفح. تحظر مواقع كثيرة عناوين IP الخاصة بمراكز البيانات، لذلك غالبا ما يعمل التصفح المحلي بشكل أفضل.
- **هجين:** أبق Gateway على VPS رخيص، وصِل جهاز Mac لديك بصفته **Node** عندما تحتاج إلى أتمتة المتصفح/واجهة المستخدم. راجع [Nodes](/ar/nodes) و[Gateway عن بعد](/ar/gateway/remote).

استخدم آلة macOS افتراضية عندما تحتاج تحديدا إلى إمكانات حصرية لـ macOS (iMessage/BlueBubbles) أو تريد عزلا صارما عن جهاز Mac اليومي لديك.

## خيارات آلة macOS الافتراضية

### آلة افتراضية محلية على جهاز Apple Silicon Mac لديك (Lume)

شغّل OpenClaw في آلة macOS افتراضية معزولة على جهاز Apple Silicon Mac الحالي لديك باستخدام [Lume](https://cua.ai/docs/lume).

يمنحك هذا:

- بيئة macOS كاملة ومعزولة (يبقى المضيف نظيفا)
- دعم iMessage عبر BlueBubbles (غير ممكن على Linux/Windows)
- إعادة ضبط فورية باستنساخ الآلات الافتراضية
- لا حاجة إلى عتاد إضافي أو تكاليف سحابية

### موفرو Mac المستضافون (السحابة)

إذا كنت تريد macOS في السحابة، فيمكن لموفري Mac المستضافين العمل أيضا:

- [MacStadium](https://www.macstadium.com/) (أجهزة Mac مستضافة)
- يعمل موفرو Mac مستضافون آخرون أيضا؛ اتبع وثائق الآلة الافتراضية + SSH لديهم

بمجرد حصولك على وصول SSH إلى آلة macOS افتراضية، تابع من الخطوة 6 أدناه.

---

## المسار السريع (Lume، للمستخدمين ذوي الخبرة)

1. ثبّت Lume
2. `lume create openclaw --os macos --ipsw latest`
3. أكمل Setup Assistant، وفعّل Remote Login (SSH)
4. `lume run openclaw --no-display`
5. ادخل عبر SSH، وثبّت OpenClaw، واضبط القنوات
6. انتهى

---

## ما تحتاجه (Lume)

- جهاز Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia أو أحدث على المضيف
- نحو 60 GB من مساحة القرص الحرة لكل آلة افتراضية
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

## 2) إنشاء آلة macOS الافتراضية

```bash
lume create openclaw --os macos --ipsw latest
```

يؤدي هذا إلى تنزيل macOS وإنشاء الآلة الافتراضية. تفتح نافذة VNC تلقائيا.

<Note>
قد يستغرق التنزيل بعض الوقت حسب اتصالك.
</Note>

---

## 3) إكمال Setup Assistant

في نافذة VNC:

1. اختر اللغة والمنطقة
2. تخط Apple ID (أو سجّل الدخول إذا كنت تريد iMessage لاحقا)
3. أنشئ حساب مستخدم (تذكر اسم المستخدم وكلمة المرور)
4. تخط جميع الميزات الاختيارية

بعد اكتمال الإعداد، فعّل SSH:

1. افتح System Settings → General → Sharing
2. فعّل "Remote Login"

---

## 4) الحصول على عنوان IP للآلة الافتراضية

```bash
lume get openclaw
```

ابحث عن عنوان IP (عادة `192.168.64.x`).

---

## 5) الدخول إلى الآلة الافتراضية عبر SSH

```bash
ssh youruser@192.168.64.X
```

استبدل `youruser` بالحساب الذي أنشأته، واستبدل عنوان IP بعنوان IP الخاص بآلتك الافتراضية.

---

## 6) تثبيت OpenClaw

داخل الآلة الافتراضية:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

اتبع مطالبات الإعداد الأولي لإعداد موفر النموذج لديك (Anthropic، OpenAI، وما إلى ذلك).

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

## 8) تشغيل الآلة الافتراضية بلا واجهة عرض

أوقف الآلة الافتراضية وأعد تشغيلها دون عرض:

```bash
lume stop openclaw
lume run openclaw --no-display
```

تعمل الآلة الافتراضية في الخلفية. يحافظ daemon الخاص بـ OpenClaw على تشغيل Gateway.

للتحقق من الحالة:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## إضافة: تكامل iMessage

هذه هي الميزة الأهم للتشغيل على macOS. استخدم [BlueBubbles](https://bluebubbles.app) لإضافة iMessage إلى OpenClaw.

داخل الآلة الافتراضية:

1. نزّل BlueBubbles من bluebubbles.app
2. سجّل الدخول باستخدام Apple ID لديك
3. فعّل Web API وعيّن كلمة مرور
4. وجّه Webhook الخاصة بـ BlueBubbles إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

أضف إلى إعدادات OpenClaw لديك:

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

أعد تشغيل Gateway. الآن يستطيع وكيلك إرسال رسائل iMessages واستقبالها.

تفاصيل الإعداد الكاملة: [قناة BlueBubbles](/ar/channels/bluebubbles)

---

## حفظ صورة ذهبية

قبل تخصيص المزيد، التقط لقطة لحالتك النظيفة:

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

## التشغيل 24/7

أبق الآلة الافتراضية قيد التشغيل عبر:

- إبقاء جهاز Mac موصولا بالطاقة
- تعطيل وضع السكون في System Settings → Energy Saver
- استخدام `caffeinate` عند الحاجة

للتشغيل الدائم الحقيقي، فكّر في جهاز Mac mini مخصص أو VPS صغير. راجع [استضافة VPS](/ar/vps).

---

## استكشاف الأخطاء وإصلاحها

| المشكلة                  | الحل                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| لا يمكن الدخول إلى الآلة الافتراضية عبر SSH        | تحقق من تفعيل "Remote Login" في System Settings الخاصة بالآلة الافتراضية                            |
| لا يظهر عنوان IP للآلة الافتراضية        | انتظر حتى تكتمل إقلاع الآلة الافتراضية، ثم شغّل `lume get openclaw` مرة أخرى                           |
| أمر Lume غير موجود   | أضف `~/.local/bin` إلى PATH لديك                                                    |
| لا يتم مسح رمز QR الخاص بـ WhatsApp | تأكد من أنك مسجل الدخول إلى الآلة الافتراضية (وليس المضيف) عند تشغيل `openclaw channels login` |

---

## وثائق ذات صلة

- [استضافة VPS](/ar/vps)
- [Nodes](/ar/nodes)
- [Gateway عن بعد](/ar/gateway/remote)
- [قناة BlueBubbles](/ar/channels/bluebubbles)
- [بدء Lume السريع](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [مرجع Lume CLI](https://cua.ai/docs/lume/reference/cli-reference)
- [إعداد آلة افتراضية غير مراقب](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (متقدم)
- [عزل Docker](/ar/install/docker) (نهج عزل بديل)
