---
read_when:
    - تريد عزل OpenClaw عن بيئة macOS الرئيسية لديك
    - تريد تكامل iMessage في بيئة معزولة
    - تريد بيئة macOS قابلة لإعادة الضبط يمكنك استنساخها
    - تريد مقارنة خيارات أجهزة macOS الافتراضية المحلية بالمستضافة
summary: شغّل OpenClaw في آلة افتراضية معزولة بنظام macOS (محلية أو مستضافة) عندما تحتاج إلى العزل أو iMessage
title: آلات macOS الافتراضية
x-i18n:
    generated_at: "2026-05-10T19:46:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## الإعداد الافتراضي الموصى به (معظم المستخدمين)

- **خادم Linux VPS صغير** لتشغيل Gateway دائمًا وبتكلفة منخفضة. راجع [استضافة VPS](/ar/vps).
- **عتاد مخصص** (Mac mini أو جهاز Linux) إذا كنت تريد تحكمًا كاملًا و**عنوان IP سكنيًا** لأتمتة المتصفح. تحظر مواقع كثيرة عناوين IP الخاصة بمراكز البيانات، لذلك غالبًا ما يعمل التصفح المحلي بشكل أفضل.
- **هجين:** أبقِ Gateway على VPS رخيص، ووصل جهاز Mac الخاص بك باعتباره **Node** عندما تحتاج إلى أتمتة المتصفح/واجهة المستخدم. راجع [Nodes](/ar/nodes) و[Gateway عن بعد](/ar/gateway/remote).

استخدم آلة macOS افتراضية عندما تحتاج تحديدًا إلى قدرات متاحة على macOS فقط مثل iMessage أو تريد عزلًا صارمًا عن جهاز Mac اليومي الخاص بك.

## خيارات آلة macOS الافتراضية

### آلة افتراضية محلية على جهاز Apple Silicon Mac الخاص بك (Lume)

شغّل OpenClaw في آلة macOS افتراضية معزولة على جهاز Apple Silicon Mac الحالي لديك باستخدام [Lume](https://cua.ai/docs/lume).

يمنحك هذا:

- بيئة macOS كاملة ومعزولة (يبقى المضيف لديك نظيفًا)
- دعم iMessage عبر `imsg` (المسار المحلي الافتراضي مستحيل على Linux/Windows)
- إعادة ضبط فورية عبر استنساخ الآلات الافتراضية
- دون عتاد إضافي أو تكاليف سحابية

### مزودو Mac المستضافون (السحابة)

إذا كنت تريد macOS في السحابة، فإن مزودي Mac المستضافين يعملون أيضًا:

- [MacStadium](https://www.macstadium.com/) (أجهزة Mac مستضافة)
- يعمل موردو Mac المستضافون الآخرون أيضًا؛ اتبع وثائقهم الخاصة بالآلة الافتراضية وSSH

بعد أن تحصل على وصول SSH إلى آلة macOS افتراضية، تابع من الخطوة 6 أدناه.

---

## المسار السريع (Lume، للمستخدمين ذوي الخبرة)

1. ثبّت Lume
2. `lume create openclaw --os macos --ipsw latest`
3. أكمل مساعد الإعداد، وفعّل تسجيل الدخول عن بعد (SSH)
4. `lume run openclaw --no-display`
5. ادخل عبر SSH، وثبّت OpenClaw، واضبط القنوات
6. انتهى

---

## ما تحتاجه (Lume)

- جهاز Apple Silicon Mac ‏(M1/M2/M3/M4)
- macOS Sequoia أو أحدث على المضيف
- نحو 60 غيغابايت من مساحة القرص الحرة لكل آلة افتراضية
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

يؤدي هذا إلى تنزيل macOS وإنشاء الآلة الافتراضية. تُفتح نافذة VNC تلقائيًا.

<Note>
قد يستغرق التنزيل بعض الوقت حسب اتصالك.
</Note>

---

## 3) إكمال مساعد الإعداد

في نافذة VNC:

1. حدد اللغة والمنطقة
2. تخطّ Apple ID (أو سجّل الدخول إذا كنت تريد iMessage لاحقًا)
3. أنشئ حساب مستخدم (تذكر اسم المستخدم وكلمة المرور)
4. تخطّ كل الميزات الاختيارية

بعد اكتمال الإعداد، فعّل SSH:

1. افتح إعدادات النظام ← عام ← المشاركة
2. فعّل "تسجيل الدخول عن بعد"

---

## 4) الحصول على عنوان IP للآلة الافتراضية

```bash
lume get openclaw
```

ابحث عن عنوان IP (عادةً `192.168.64.x`).

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

اتبع مطالبات الإعداد الأولي لإعداد مزود النموذج لديك (Anthropic وOpenAI وما إلى ذلك).

---

## 7) ضبط القنوات

حرر ملف الإعداد:

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

تعمل الآلة الافتراضية في الخلفية. يحافظ عفريت OpenClaw على تشغيل Gateway.

للتحقق من الحالة:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## إضافة: تكامل iMessage

هذه هي الميزة الأهم للتشغيل على macOS. استخدم [iMessage](/ar/channels/imessage) مع `imsg` لإضافة Messages إلى OpenClaw.

داخل الآلة الافتراضية:

1. سجّل الدخول إلى Messages.
2. ثبّت `imsg`.
3. امنح إذن الوصول الكامل إلى القرص وإذن الأتمتة للعملية التي تشغّل OpenClaw/`imsg`.
4. تحقق من دعم RPC باستخدام `imsg rpc --help`.

أضف إلى إعداد OpenClaw لديك:

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

أعد تشغيل Gateway. يمكن لوكيلك الآن إرسال رسائل iMessage واستلامها.

تفاصيل الإعداد الكاملة: [قناة iMessage](/ar/channels/imessage)

---

## حفظ صورة ذهبية

قبل المزيد من التخصيص، التقط لقطة لحالتك النظيفة:

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

أبقِ الآلة الافتراضية قيد التشغيل عبر:

- إبقاء جهاز Mac موصولًا بالطاقة
- تعطيل السكون في إعدادات النظام ← موفر الطاقة
- استخدام `caffeinate` عند الحاجة

للتشغيل الدائم الحقيقي، فكّر في Mac mini مخصص أو VPS صغير. راجع [استضافة VPS](/ar/vps).

---

## استكشاف الأخطاء وإصلاحها

| المشكلة                  | الحل                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| لا يمكن الدخول إلى الآلة الافتراضية عبر SSH        | تحقق من تفعيل "تسجيل الدخول عن بعد" في إعدادات النظام الخاصة بالآلة الافتراضية                            |
| لا يظهر عنوان IP للآلة الافتراضية        | انتظر حتى تكتمل عملية إقلاع الآلة الافتراضية، ثم شغّل `lume get openclaw` مرة أخرى                           |
| لم يتم العثور على أمر Lume   | أضف `~/.local/bin` إلى PATH لديك                                                    |
| لا يتم مسح رمز WhatsApp QR | تأكد من أنك مسجل الدخول إلى الآلة الافتراضية (وليس المضيف) عند تشغيل `openclaw channels login` |

---

## الوثائق ذات الصلة

- [استضافة VPS](/ar/vps)
- [Nodes](/ar/nodes)
- [Gateway عن بعد](/ar/gateway/remote)
- [قناة iMessage](/ar/channels/imessage)
- [بدء Lume السريع](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [مرجع CLI الخاص بـ Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [إعداد آلة افتراضية دون حضور](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (متقدم)
- [عزل Docker](/ar/install/docker) (نهج عزل بديل)
