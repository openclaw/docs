---
read_when:
    - دمج تطبيق Mac مع دورة حياة Gateway
summary: دورة حياة Gateway على macOS (launchd)
title: دورة حياة Gateway على macOS
x-i18n:
    generated_at: "2026-05-06T08:04:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
---

يدير تطبيق macOS **Gateway عبر launchd** افتراضياً ولا يشغّل
Gateway كعملية فرعية. يحاول أولاً الاتصال بـ Gateway قيد التشغيل
بالفعل على المنفذ المكوّن؛ وإذا لم يكن أي منها قابلاً للوصول، فإنه يفعّل خدمة launchd
عبر CLI `openclaw` الخارجي (من دون وقت تشغيل مضمّن). يوفّر لك ذلك
بدءاً تلقائياً موثوقاً عند تسجيل الدخول وإعادة التشغيل عند حدوث الأعطال.

وضع العملية الفرعية (تشغيل Gateway مباشرةً بواسطة التطبيق) **ليس قيد الاستخدام** اليوم.
إذا كنت تحتاج إلى اقتران أوثق بواجهة المستخدم، فشغّل Gateway يدوياً في طرفية.

## السلوك الافتراضي (launchd)

- يثبّت التطبيق LaunchAgent لكل مستخدم بالوسم `ai.openclaw.gateway`
  (أو `ai.openclaw.<profile>` عند استخدام `--profile`/`OPENCLAW_PROFILE`؛ ويدعم `com.openclaw.*` القديم).
- عند تفعيل الوضع المحلي، يتأكد التطبيق من تحميل LaunchAgent ويبدأ
  Gateway عند الحاجة.
- تُكتب السجلات إلى مسار سجل launchd الخاص بـ Gateway (مرئي في إعدادات التصحيح).

الأوامر الشائعة:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

استبدل الوسم بـ `ai.openclaw.<profile>` عند تشغيل ملف تعريف مسمّى.

## إصدارات التطوير غير الموقعة

`scripts/restart-mac.sh --no-sign` مخصص للإصدارات المحلية السريعة عندما لا تكون لديك
مفاتيح توقيع. لمنع launchd من الإشارة إلى ملف ثنائي مرحّل غير موقّع، فإنه:

- يكتب `~/.openclaw/disable-launchagent`.

تشغيل `scripts/restart-mac.sh` الموقّع يمسح هذا التجاوز إذا كانت العلامة
موجودة. لإعادة الضبط يدوياً:

```bash
rm ~/.openclaw/disable-launchagent
```

## وضع الإرفاق فقط

لإجبار تطبيق macOS على **عدم تثبيت launchd أو إدارته مطلقاً**، شغّله باستخدام
`--attach-only` (أو `--no-launchd`). يضبط هذا `~/.openclaw/disable-launchagent`،
لذلك لا يرفق التطبيق إلا بـ Gateway قيد التشغيل بالفعل. يمكنك تبديل السلوك نفسه
في إعدادات التصحيح.

## الوضع البعيد

لا يبدأ الوضع البعيد Gateway محلياً أبداً. يستخدم التطبيق نفق SSH إلى
المضيف البعيد ويتصل عبر ذلك النفق.

## لماذا نفضل launchd

- بدء تلقائي عند تسجيل الدخول.
- دلالات إعادة التشغيل/KeepAlive المضمّنة.
- سجلات وإشراف يمكن التنبؤ بهما.

إذا دعت الحاجة مرة أخرى إلى وضع عملية فرعية حقيقي، فيجب توثيقه كوضع
منفصل وصريح ومخصص للتطوير فقط.

## ذات صلة

- [تطبيق macOS](/ar/platforms/macos)
- [دليل تشغيل Gateway](/ar/gateway)
