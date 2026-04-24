---
read_when:
    - إعداد OpenClaw على Hostinger
    - البحث عن VPS مُدار لـ OpenClaw
    - استخدام تثبيت OpenClaw بنقرة واحدة على Hostinger
summary: استضافة OpenClaw على Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T07:48:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
---

شغّل OpenClaw Gateway دائمة على [Hostinger](https://www.hostinger.com/openclaw) عبر نشر مُدار **بنقرة واحدة** أو تثبيت على **VPS**.

## المتطلبات الأساسية

- حساب Hostinger ‏([التسجيل](https://www.hostinger.com/openclaw))
- نحو 5-10 دقائق

## الخيار A: OpenClaw بنقرة واحدة

أسرع طريقة للبدء. تتولى Hostinger البنية التحتية وDocker والتحديثات التلقائية.

<Steps>
  <Step title="الشراء والتشغيل">
    1. من [صفحة OpenClaw في Hostinger](https://www.hostinger.com/openclaw)، اختر خطة OpenClaw مُدارة وأكمل عملية الشراء.

    <Note>
    أثناء إتمام الشراء يمكنك اختيار أرصدة **Ready-to-Use AI** التي يتم شراؤها مسبقًا ودمجها فورًا داخل OpenClaw -- من دون الحاجة إلى حسابات خارجية أو مفاتيح API من موفّرين آخرين. يمكنك البدء بالدردشة فورًا. وبدلًا من ذلك، يمكنك تقديم مفتاحك الخاص من Anthropic أو OpenAI أو Google Gemini أو xAI أثناء الإعداد.
    </Note>

  </Step>

  <Step title="اختيار قناة مراسلة">
    اختر قناة واحدة أو أكثر للاتصال بها:

    - **WhatsApp** -- امسح رمز QR المعروض في معالج الإعداد.
    - **Telegram** -- الصق رمز البوت من [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="إكمال التثبيت">
    انقر على **Finish** لنشر المثيل. وبمجرد أن يصبح جاهزًا، ادخل إلى لوحة تحكم OpenClaw من **OpenClaw Overview** في hPanel.
  </Step>

</Steps>

## الخيار B: OpenClaw على VPS

تحكم أكبر في الخادم. تنشر Hostinger OpenClaw عبر Docker على VPS الخاصة بك، وتقوم بإدارتها من خلال **Docker Manager** في hPanel.

<Steps>
  <Step title="شراء VPS">
    1. من [صفحة OpenClaw في Hostinger](https://www.hostinger.com/openclaw)، اختر خطة OpenClaw على VPS وأكمل عملية الشراء.

    <Note>
    يمكنك اختيار أرصدة **Ready-to-Use AI** أثناء إتمام الشراء -- يتم شراؤها مسبقًا ودمجها فورًا داخل OpenClaw، بحيث يمكنك بدء الدردشة من دون أي حسابات خارجية أو مفاتيح API من موفّرين آخرين.
    </Note>

  </Step>

  <Step title="إعداد OpenClaw">
    بعد تهيئة VPS، املأ حقول الإعداد:

    - **Gateway token** -- يتم إنشاؤه تلقائيًا؛ احفظه لاستخدامه لاحقًا.
    - **رقم WhatsApp** -- رقمك مع رمز الدولة (اختياري).
    - **Telegram bot token** -- من [BotFather](https://t.me/BotFather) (اختياري).
    - **مفاتيح API** -- مطلوبة فقط إذا لم تختر أرصدة Ready-to-Use AI أثناء إتمام الشراء.

  </Step>

  <Step title="بدء OpenClaw">
    انقر على **Deploy**. وبعد التشغيل، افتح لوحة تحكم OpenClaw من hPanel بالنقر على **Open**.
  </Step>

</Steps>

تُدار السجلات وعمليات إعادة التشغيل والتحديثات مباشرة من واجهة Docker Manager في hPanel. وللتحديث، اضغط على **Update** في Docker Manager وسيقوم ذلك بسحب أحدث صورة.

## التحقق من الإعداد

أرسل "Hi" إلى مساعدك على القناة التي قمت بربطها. سيرد OpenClaw ويرشدك خلال التفضيلات الأولية.

## استكشاف الأخطاء وإصلاحها

**لوحة التحكم لا تُحمّل** -- انتظر بضع دقائق حتى تنتهي الحاوية من التهيئة. تحقق من سجلات Docker Manager في hPanel.

**حاوية Docker تستمر في إعادة التشغيل** -- افتح سجلات Docker Manager وابحث عن أخطاء في الإعداد (رموز مميزة مفقودة، أو مفاتيح API غير صالحة).

**بوت Telegram لا يستجيب** -- أرسل رسالة رمز الاقتران من Telegram مباشرة كرسالة داخل دردشة OpenClaw لإكمال الاتصال.

## الخطوات التالية

- [القنوات](/ar/channels) -- ربط Telegram وWhatsApp وDiscord والمزيد
- [إعداد Gateway](/ar/gateway/configuration) -- جميع خيارات الإعداد

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [استضافة VPS](/ar/vps)
- [DigitalOcean](/ar/install/digitalocean)
