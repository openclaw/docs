---
read_when:
    - بناء إصدارات تصحيح الأخطاء لنظام ماك أو توقيعها
summary: خطوات التوقيع لبُنى تصحيح أخطاء macOS التي تُنشئها سكربتات التحزيم
title: توقيع macOS
x-i18n:
    generated_at: "2026-05-06T08:05:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# توقيع mac (إصدارات التصحيح)

يُبنى هذا التطبيق عادةً من [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)، والذي يقوم الآن بما يلي:

- يضبط معرّف حزمة تصحيح ثابتًا: `ai.openclaw.mac.debug`
- يكتب Info.plist باستخدام معرّف الحزمة هذا (يمكن تجاوزه عبر `BUNDLE_ID=...`)
- يستدعي [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) لتوقيع الملف الثنائي الرئيسي وحزمة التطبيق بحيث يتعامل macOS مع كل إعادة بناء على أنها الحزمة الموقّعة نفسها ويحافظ على أذونات TCC (الإشعارات، تسهيلات الاستخدام، تسجيل الشاشة، الميكروفون، الكلام). للحصول على أذونات مستقرة، استخدم هوية توقيع حقيقية؛ أما التوقيع المخصص فهو اختياري وهش (راجع [أذونات macOS](/ar/platforms/mac/permissions)).
- يستخدم `CODESIGN_TIMESTAMP=auto` افتراضيًا؛ وهو يفعّل الطوابع الزمنية الموثوقة لتواقيع Developer ID. اضبط `CODESIGN_TIMESTAMP=off` لتخطي إضافة الطابع الزمني (إصدارات التصحيح غير المتصلة بالإنترنت).
- يحقن بيانات تعريف البناء في Info.plist: `OpenClawBuildTimestamp` (UTC) و`OpenClawGitCommit` (تجزئة قصيرة) حتى تعرض لوحة About البناء وgit وقناة التصحيح/الإصدار.
- **تستخدم الحزمة Node 24 افتراضيًا**: يشغّل السكربت عمليات بناء TS وبناء واجهة Control UI. يظل Node 22 LTS، حاليًا `22.14+`، مدعومًا للتوافق.
- يقرأ `SIGN_IDENTITY` من البيئة. أضف `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (أو شهادة Developer ID Application الخاصة بك) إلى ملف rc الخاص بالصدفة لديك للتوقيع دائمًا بشهادتك. يتطلب التوقيع المخصص اشتراكًا صريحًا عبر `ALLOW_ADHOC_SIGNING=1` أو `SIGN_IDENTITY="-"` (غير موصى به لاختبار الأذونات).
- يشغّل تدقيق Team ID بعد التوقيع ويفشل إذا كان أي Mach-O داخل حزمة التطبيق موقّعًا بواسطة Team ID مختلف. اضبط `SKIP_TEAM_ID_CHECK=1` للتجاوز.

## الاستخدام

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### ملاحظة حول التوقيع المخصص

عند التوقيع باستخدام `SIGN_IDENTITY="-"` (توقيع مخصص)، يعطّل السكربت تلقائيًا **Hardened Runtime** (`--options runtime`). هذا ضروري لمنع الأعطال عندما يحاول التطبيق تحميل أطر عمل مضمّنة (مثل Sparkle) لا تشارك Team ID نفسه. تؤدي التواقيع المخصصة أيضًا إلى تعطيل استمرارية أذونات TCC؛ راجع [أذونات macOS](/ar/platforms/mac/permissions) للاطلاع على خطوات الاسترداد.

## بيانات تعريف البناء في About

يضع `package-mac-app.sh` طابعًا على الحزمة يتضمن:

- `OpenClawBuildTimestamp`: وقت الحزم بصيغة ISO8601 UTC
- `OpenClawGitCommit`: تجزئة git قصيرة (أو `unknown` إذا لم تكن متاحة)

تقرأ علامة تبويب About هذه المفاتيح لعرض الإصدار، وتاريخ البناء، وgit commit، وما إذا كان إصدار تصحيح (عبر `#if DEBUG`). شغّل أداة الحزم لتحديث هذه القيم بعد تغييرات الكود.

## السبب

ترتبط أذونات TCC بمعرّف الحزمة _وتوقيع_ الكود. كانت إصدارات التصحيح غير الموقّعة ذات UUIDs المتغيرة تجعل macOS ينسى المنح بعد كل إعادة بناء. توقيع الملفات الثنائية (مخصص افتراضيًا) والحفاظ على معرّف/مسار حزمة ثابت (`dist/OpenClaw.app`) يحافظ على المنح بين عمليات البناء، بما يطابق نهج VibeTunnel.

## ذات صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
