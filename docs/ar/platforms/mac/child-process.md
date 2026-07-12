---
read_when:
    - دمج تطبيق Mac مع دورة حياة Gateway
summary: دورة حياة Gateway على macOS ‏(launchd)
title: دورة حياة Gateway على macOS
x-i18n:
    generated_at: "2026-07-12T06:05:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

يدير تطبيق macOS الـ Gateway عبر **launchd** افتراضيًا، ولا يشغّل
الـ Gateway كعملية فرعية. يحاول أولًا الاتصال بـ Gateway قيد التشغيل بالفعل
على المنفذ المُهيأ؛ وإذا تعذّر الوصول إلى أي منها، فإنه يفعّل خدمة launchd
عبر `openclaw` CLI الخارجي (من دون بيئة تشغيل مضمنة). يوفّر ذلك بدءًا تلقائيًا
موثوقًا عند تسجيل الدخول وإعادة التشغيل عند حدوث أعطال.

وضع العملية الفرعية (حيث يشغّل التطبيق الـ Gateway مباشرةً) **غير مستخدم**
حاليًا. إذا كنت بحاجة إلى اقتران أوثق بواجهة المستخدم، فشغّل الـ Gateway
يدويًا في طرفية.

## السلوك الافتراضي (launchd)

- يثبّت التطبيق LaunchAgent خاصًا بكل مستخدم ويحمل التسمية `ai.openclaw.gateway` (أو
  `ai.openclaw.<profile>` عند استخدام `--profile`/`OPENCLAW_PROFILE`).
- عند تمكين الوضع المحلي، يضمن التطبيق تحميل LaunchAgent ويبدأ تشغيل
  الـ Gateway عند الحاجة.
- تُكتب السجلات في مسار سجل Gateway الخاص بـ launchd (الظاهر في إعدادات تصحيح الأخطاء).

الأوامر الشائعة:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

استبدل التسمية بـ `ai.openclaw.<profile>` عند تشغيل ملف تعريف مُسمّى.

## إصدارات التطوير غير الموقّعة

يُستخدم `scripts/restart-mac.sh --no-sign` لإجراء عمليات بناء محلية سريعة من دون
مفاتيح توقيع. ولمنع launchd من الإشارة إلى ملف ثنائي غير موقّع للترحيل، فإنه يكتب
`~/.openclaw/disable-launchagent`.

تزيل عمليات التشغيل الموقّعة للبرنامج النصي `scripts/restart-mac.sh` هذا التجاوز إذا كانت
العلامة موجودة. لإعادة الضبط يدويًا:

```bash
rm ~/.openclaw/disable-launchagent
```

## وضع الاتصال فقط

لفرض عدم تثبيت تطبيق macOS لـ launchd أو إدارته مطلقًا، شغّله باستخدام
`--attach-only` (أو `--no-launchd`). يؤدي ذلك إلى تعيين
`~/.openclaw/disable-launchagent`، بحيث لا يتصل التطبيق إلا بـ Gateway قيد
التشغيل بالفعل. يمكنك تبديل السلوك نفسه في إعدادات تصحيح الأخطاء.

## الوضع البعيد

لا يبدأ الوضع البعيد تشغيل Gateway محلي مطلقًا. يستخدم التطبيق نفق SSH إلى
المضيف البعيد ويتصل عبر ذلك النفق.

## لماذا نفضّل launchd

- البدء التلقائي عند تسجيل الدخول.
- دلالات إعادة التشغيل/KeepAlive المضمنة.
- سجلات وإشراف يمكن التنبؤ بهما.

إذا دعت الحاجة مجددًا إلى وضع عملية فرعية حقيقي، فيجب توثيقه باعتباره
وضعًا منفصلًا وصريحًا مخصصًا للتطوير فقط.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [دليل تشغيل Gateway](/ar/gateway)
