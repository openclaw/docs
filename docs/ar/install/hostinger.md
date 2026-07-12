---
read_when:
    - إعداد OpenClaw على Hostinger
    - هل تبحث عن خادم VPS مُدار لـ OpenClaw؟
    - استخدام OpenClaw بنقرة واحدة من Hostinger
summary: استضف OpenClaw على Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T05:59:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

شغّل Gateway دائمًا لـ OpenClaw على [Hostinger](https://www.hostinger.com/openclaw)، إما كنشر مُدار بنقرة واحدة **1-Click** أو كتثبيت على **VPS** تديره بنفسك.

## المتطلبات الأساسية

- حساب Hostinger ([التسجيل](https://www.hostinger.com/openclaw))
- نحو 5-10 دقائق

## الخيار أ: OpenClaw بنقرة واحدة

تتولى Hostinger إدارة البنية التحتية وDocker والتحديثات التلقائية. وهذا أسرع مسار للحصول على مثيل قيد التشغيل.

<Steps>
  <Step title="الشراء والتشغيل">
    1. من [صفحة OpenClaw على Hostinger](https://www.hostinger.com/openclaw)، اختر خطة OpenClaw مُدارة وأكمل عملية الدفع.

    <Note>
    أثناء الدفع، يمكنك تحديد رصيد **Ready-to-Use AI** مدفوع مسبقًا ومُدمج فورًا داخل OpenClaw، من دون الحاجة إلى حسابات خارجية أو مفاتيح API من مزودين آخرين. ويمكنك بدء المحادثة على الفور. وبدلًا من ذلك، أدخل مفتاحك الخاص من Anthropic أو OpenAI أو Google Gemini أو xAI أثناء الإعداد.
    </Note>

  </Step>

  <Step title="اختيار قناة مراسلة">
    اختر قناة واحدة أو أكثر للاتصال بها:

    - **WhatsApp** -- امسح رمز QR الظاهر في معالج الإعداد.
    - **Telegram** -- الصق رمز البوت من [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="إكمال التثبيت">
    انقر على **Finish** لنشر المثيل. بعد أن يصبح جاهزًا، افتح لوحة معلومات OpenClaw من **OpenClaw Overview** في hPanel.
  </Step>

</Steps>

## الخيار ب: OpenClaw على VPS

يمنحك هذا الخيار تحكمًا أكبر في الخادم. تنشر Hostinger ‏OpenClaw عبر Docker على خادم VPS الخاص بك، وتتولى أنت إدارته من خلال **Docker Manager** في hPanel.

<Steps>
  <Step title="شراء VPS">
    1. من [صفحة OpenClaw على Hostinger](https://www.hostinger.com/openclaw)، اختر خطة OpenClaw على VPS وأكمل عملية الدفع.

    <Note>
    يمكنك تحديد رصيد **Ready-to-Use AI** أثناء الدفع، وهو رصيد مدفوع مسبقًا ومُدمج فورًا داخل OpenClaw، ما يتيح لك بدء المحادثة من دون أي حسابات خارجية أو مفاتيح API من مزودين آخرين.
    </Note>

  </Step>

  <Step title="تهيئة OpenClaw">
    بعد تجهيز VPS، املأ حقول التهيئة:

    - **رمز Gateway** -- يُنشأ تلقائيًا؛ احفظه لاستخدامه لاحقًا.
    - **رقم WhatsApp** -- رقمك متضمنًا رمز البلد (اختياري).
    - **رمز بوت Telegram** -- من [BotFather](https://t.me/BotFather) (اختياري).
    - **مفاتيح API** -- لا تكون مطلوبة إلا إذا لم تحدد رصيد Ready-to-Use AI أثناء الدفع.

  </Step>

  <Step title="تشغيل OpenClaw">
    انقر على **Deploy**. بعد بدء التشغيل، افتح لوحة معلومات OpenClaw من hPanel بالنقر على **Open**.
  </Step>

</Steps>

يمكن إدارة السجلات وعمليات إعادة التشغيل والتحديثات من واجهة Docker Manager في hPanel. للتحديث، اضغط على **Update** في Docker Manager لتنزيل أحدث صورة.

## التحقق من الإعداد

أرسل "مرحبًا" إلى مساعدك عبر القناة التي ربطتها. سيرد OpenClaw ويرشدك خلال ضبط التفضيلات الأولية.

## استكشاف الأخطاء وإصلاحها

**لوحة المعلومات لا تُحمّل** -- انتظر بضع دقائق حتى تنتهي تهيئة الحاوية، ثم تحقق من سجلات Docker Manager في hPanel.

**تستمر حاوية Docker في إعادة التشغيل** -- افتح سجلات Docker Manager وابحث عن أخطاء التهيئة، مثل الرموز المفقودة أو مفاتيح API غير الصالحة.

**بوت Telegram لا يستجيب** -- إذا كانت مصادقة الاقتران مطلوبة، فسيتلقى المرسل غير المعروف رمز اقتران قصيرًا بدلًا من الرد. وافق عليه من محادثة لوحة معلومات OpenClaw، أو باستخدام `openclaw pairing approve telegram <CODE>` إذا كان لديك وصول إلى صدفة الحاوية. راجع [الاقتران](/ar/channels/pairing).

## الخطوات التالية

- [القنوات](/ar/channels) -- اربط Telegram وWhatsApp وDiscord وغيرها
- [تهيئة Gateway](/ar/gateway/configuration) -- جميع خيارات التهيئة

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [استضافة VPS](/ar/vps)
- [DigitalOcean](/ar/install/digitalocean)
