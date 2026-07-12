---
read_when:
    - تريد عزل OpenClaw عن بيئة macOS الرئيسية لديك
    - تريد تكامل iMessage في بيئة معزولة
    - تريد بيئة macOS قابلة لإعادة الضبط ويمكنك استنساخها
    - تريد مقارنة خيارات الأجهزة الافتراضية لنظام macOS المحلية والمستضافة
summary: شغّل OpenClaw في جهاز افتراضي معزول بنظام macOS (محلي أو مستضاف) عندما تحتاج إلى العزل أو iMessage
title: الأجهزة الافتراضية بنظام macOS
x-i18n:
    generated_at: "2026-07-12T06:10:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## الإعداد الافتراضي الموصى به (لمعظم المستخدمين)

- **خادم VPS صغير يعمل بنظام Linux** لتشغيل Gateway دائمًا وبتكلفة منخفضة. راجع [استضافة VPS](/ar/vps).
- **جهاز مخصص** (Mac mini أو جهاز Linux) إذا كنت تريد تحكمًا كاملًا و**عنوان IP منزليًا** لأتمتة المتصفح. تحظر مواقع كثيرة عناوين IP الخاصة بمراكز البيانات، لذلك غالبًا ما يعمل التصفح المحلي بصورة أفضل.
- **إعداد هجين**: أبقِ Gateway على خادم VPS رخيص، وصِل جهاز Mac بوصفه **Node** عندما تحتاج إلى أتمتة المتصفح أو واجهة المستخدم. راجع [العُقد](/ar/nodes) و[Gateway البعيد](/ar/gateway/remote).

استخدم جهاز macOS افتراضيًا فقط عندما تحتاج تحديدًا إلى إمكانات حصرية لنظام macOS مثل iMessage، أو عندما تريد عزله تمامًا عن جهاز Mac الذي تستخدمه يوميًا.

## خيارات جهاز macOS الافتراضي

### جهاز افتراضي محلي على جهاز Mac المزود بـ Apple Silicon ‏(Lume)

شغّل OpenClaw داخل جهاز macOS افتراضي معزول على جهاز Mac الحالي المزود بـ Apple Silicon باستخدام [Lume](https://cua.ai/docs/lume). يمنحك ذلك:

- بيئة macOS كاملة ومعزولة (مع بقاء النظام المضيف نظيفًا)
- دعم iMessage عبر `imsg`؛ إذ يستحيل استخدام المسار المحلي الافتراضي على Linux/Windows
- إعادة ضبط فورية عن طريق استنساخ الأجهزة الافتراضية
- عدم الحاجة إلى أجهزة إضافية أو تكاليف سحابية

### موفرو أجهزة Mac المستضافة (السحابة)

إذا كنت تريد macOS في السحابة، فيمكنك أيضًا استخدام موفري أجهزة Mac المستضافة:

- [MacStadium](https://www.macstadium.com/) (أجهزة Mac مستضافة)
- يعمل أيضًا موفرو أجهزة Mac المستضافة الآخرون؛ اتبع وثائقهم المتعلقة بالأجهزة الافتراضية وSSH

بعد حصولك على وصول SSH إلى جهاز macOS افتراضي، تابع إلى [تثبيت OpenClaw](#6-install-openclaw) أدناه.

## المسار السريع (Lume، للمستخدمين ذوي الخبرة)

1. ثبّت Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. أكمل مساعد الإعداد، وفعّل Remote Login ‏(SSH).
4. `lume run openclaw --no-display`
5. اتصل عبر SSH، وثبّت OpenClaw، واضبط القنوات.
6. انتهى.

## المتطلبات (Lume)

- جهاز Mac مزود بـ Apple Silicon ‏(M1/M2/M3/M4)
- إصدار macOS Sequoia أو أحدث على النظام المضيف
- نحو 60 غيغابايت من مساحة القرص الحرة لكل جهاز افتراضي
- نحو 20 دقيقة

## 1) تثبيت Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

إذا لم يكن `~/.local/bin` ضمن PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

تحقق:

```bash
lume --version
```

الوثائق: [تثبيت Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) إنشاء جهاز macOS الافتراضي

```bash
lume create openclaw --os macos --ipsw latest
```

يؤدي ذلك إلى تنزيل macOS وإنشاء الجهاز الافتراضي. تُفتح نافذة VNC تلقائيًا.

<Note>
قد يستغرق التنزيل بعض الوقت حسب سرعة اتصالك.
</Note>

## 3) إكمال مساعد الإعداد

في نافذة VNC:

1. اختر اللغة والمنطقة.
2. تخطَّ Apple ID (أو سجّل الدخول إذا كنت تريد استخدام iMessage لاحقًا).
3. أنشئ حساب مستخدم (وتذكّر اسم المستخدم وكلمة المرور).
4. تخطَّ جميع الميزات الاختيارية.

بعد اكتمال الإعداد:

1. فعّل SSH: System Settings -> General -> Sharing، ثم فعّل "Remote Login".
2. لاستخدام الجهاز الافتراضي دون واجهة عرض، فعّل تسجيل الدخول التلقائي: System Settings -> Users & Groups، وحدد "Automatically log in as:"، ثم اختر مستخدم الجهاز الافتراضي.

## 4) الحصول على عنوان IP للجهاز الافتراضي

```bash
lume get openclaw
```

ابحث عن عنوان IP (عادةً `192.168.64.x`).

## 5) الاتصال بالجهاز الافتراضي عبر SSH

```bash
ssh youruser@192.168.64.X
```

استبدل `youruser` بالحساب الذي أنشأته، واستبدل عنوان IP بعنوان IP الخاص بجهازك الافتراضي.

## 6) تثبيت OpenClaw

داخل الجهاز الافتراضي:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

اتبع مطالبات الإعداد الأولي لضبط موفر النموذج (Anthropic أو OpenAI أو غيرهما).

## 7) ضبط القنوات

حرّر ملف الإعداد:

```bash
nano ~/.openclaw/openclaw.json
```

أضف قنواتك:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

ثم سجّل الدخول إلى WhatsApp (امسح رمز QR ضوئيًا):

```bash
openclaw channels login
```

## 8) تشغيل الجهاز الافتراضي دون واجهة عرض

أوقف الجهاز الافتراضي وأعد تشغيله دون واجهة عرض:

```bash
lume stop openclaw
lume run openclaw --no-display
```

يعمل الجهاز الافتراضي في الخلفية، وتحافظ خدمة OpenClaw على تشغيل Gateway. للتحقق من الحالة:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## إضافة: تكامل iMessage

هذه هي أبرز ميزة للتشغيل على macOS. استخدم [iMessage](/ar/channels/imessage) مع `imsg` لإضافة تطبيق Messages إلى OpenClaw.

داخل الجهاز الافتراضي:

1. سجّل الدخول إلى Messages.
2. ثبّت `imsg`.
3. امنح إذني Full Disk Access وAutomation للعملية التي تشغّل OpenClaw/`imsg`.
4. تحقق من دعم RPC باستخدام `imsg rpc --help`.

أضف ما يلي إلى إعداد OpenClaw:

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

أعد تشغيل Gateway. يمكن لوكيلك الآن إرسال رسائل iMessage واستقبالها. تفاصيل الإعداد الكاملة: [قناة iMessage](/ar/channels/imessage).

## حفظ صورة أساسية

قبل إجراء مزيد من التخصيص، التقط نسخة لحالتك النظيفة:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

يمكنك إعادة الضبط في أي وقت:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## التشغيل على مدار الساعة

أبقِ الجهاز الافتراضي قيد التشغيل من خلال:

- إبقاء جهاز Mac موصولًا بالطاقة
- تعطيل وضع السكون من System Settings -> Energy Saver
- استخدام `caffeinate` عند الحاجة

للتشغيل الدائم فعليًا، فكّر في استخدام Mac mini مخصص أو خادم VPS صغير. راجع [استضافة VPS](/ar/vps).

## استكشاف الأخطاء وإصلاحها

| المشكلة                              | الحل                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| يتعذر الاتصال بالجهاز الافتراضي عبر SSH | تحقق من تفعيل "Remote Login" في System Settings داخل الجهاز الافتراضي                                       |
| لا يظهر عنوان IP للجهاز الافتراضي      | انتظر حتى يكتمل إقلاع الجهاز الافتراضي، ثم شغّل `lume get openclaw` مجددًا                                  |
| لم يتم العثور على أمر Lume             | أضف `~/.local/bin` إلى PATH                                                                                  |
| لا يعمل مسح رمز QR الخاص بـ WhatsApp   | تأكد من تسجيل دخولك إلى الجهاز الافتراضي (وليس النظام المضيف) عند تشغيل `openclaw channels login`          |

## وثائق ذات صلة

- [استضافة VPS](/ar/vps)
- [العُقد](/ar/nodes)
- [Gateway البعيد](/ar/gateway/remote)
- [قناة iMessage](/ar/channels/imessage)
- [البدء السريع مع Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [مرجع CLI الخاص بـ Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [إعداد جهاز افتراضي دون تدخل](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (متقدم)
- [العزل باستخدام Docker](/ar/install/docker) (نهج بديل للعزل)
