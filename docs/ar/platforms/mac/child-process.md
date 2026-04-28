---
read_when:
    - دمج تطبيق mac مع دورة حياة Gateway
summary: دورة حياة Gateway على macOS ‏(launchd)
title: دورة حياة Gateway
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T07:52:15Z"
  model: gpt-5.4
  provider: openai
  source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
  source_path: platforms/mac/child-process.md
  workflow: 15
---

# دورة حياة Gateway على macOS

يقوم تطبيق macOS **بإدارة Gateway عبر launchd** افتراضيًا ولا يشغّل
Gateway كعملية فرعية تابعة له. فهو يحاول أولًا الارتباط بـ Gateway
قيد التشغيل بالفعل على المنفذ المكوّن؛ وإذا لم يكن أي Gateway قابلًا للوصول، فإنه يفعّل خدمة launchd
عبر CLI الخارجي `openclaw` ‏(من دون Runtime مضمّن). وهذا يمنحك
بدءًا تلقائيًا موثوقًا عند تسجيل الدخول وإعادة تشغيل بعد التعطل.

وضع العملية الفرعية (تشغيل Gateway مباشرة من التطبيق) **غير مستخدم** اليوم.
إذا كنت تحتاج إلى اقتران أوثق مع واجهة المستخدم، فشغّل Gateway يدويًا داخل طرفية.

## السلوك الافتراضي (launchd)

- يثبّت التطبيق LaunchAgent لكل مستخدم بالوسم `ai.openclaw.gateway`
  (أو `ai.openclaw.<profile>` عند استخدام `--profile`/`OPENCLAW_PROFILE`؛ كما أن `com.openclaw.*` القديم مدعوم).
- عند تفعيل الوضع المحلي، يضمن التطبيق تحميل LaunchAgent
  ويبدأ Gateway عند الحاجة.
- تُكتب السجلات إلى مسار سجل Gateway الخاص بـ launchd ‏(وهو ظاهر في Debug Settings).

الأوامر الشائعة:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

استبدل الوسم بـ `ai.openclaw.<profile>` عند تشغيل ملف تعريف مسمّى.

## بنيات التطوير غير الموقعة

إن `scripts/restart-mac.sh --no-sign` مخصص للبنيات المحلية السريعة عندما لا تكون لديك
مفاتيح توقيع. ولمنع launchd من الإشارة إلى ملف relay ثنائي غير موقّع، فإنه:

- يكتب `~/.openclaw/disable-launchagent`.

تقوم التشغيلات الموقعة لـ `scripts/restart-mac.sh` بمسح هذا التجاوز إذا كانت العلامة
موجودة. ولإعادة التعيين يدويًا:

```bash
rm ~/.openclaw/disable-launchagent
```

## وضع الارتباط فقط

لفرض أن تطبيق macOS **لا يثبّت launchd أو يديره أبدًا**، شغّله باستخدام
`--attach-only` ‏(أو `--no-launchd`). يؤدي هذا إلى ضبط `~/.openclaw/disable-launchagent`،
بحيث يرتبط التطبيق فقط بـ Gateway قيد التشغيل بالفعل. ويمكنك تبديل
السلوك نفسه من Debug Settings.

## الوضع البعيد

لا يبدأ الوضع البعيد Gateway محليًا أبدًا. يستخدم التطبيق نفق SSH إلى
المضيف البعيد ويتصل عبر ذلك النفق.

## لماذا نفضّل launchd

- بدء تلقائي عند تسجيل الدخول.
- دلالات إعادة تشغيل/KeepAlive مدمجة.
- سجلات وإشراف متوقعان.

إذا كانت هناك حاجة فعلية إلى وضع عملية فرعية مرة أخرى في المستقبل، فيجب توثيقه
كوضع تطوير منفصل وصريح فقط.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [دليل تشغيل Gateway](/ar/gateway)
