---
read_when:
    - إنشاء إصدارات تصحيح أخطاء mac أو توقيعها
summary: خطوات التوقيع لبُنى تصحيح أخطاء macOS التي تُنشئها سكربتات التحزيم
title: توقيع macOS
x-i18n:
    generated_at: "2026-06-27T17:58:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# توقيع mac (بُنى التصحيح)

يُبنى هذا التطبيق عادةً من [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)، والذي أصبح الآن:

- يعيّن معرّف حزمة تصحيح ثابتًا: `ai.openclaw.mac.debug`
- يكتب Info.plist باستخدام معرّف الحزمة هذا (يمكن تجاوزه عبر `BUNDLE_ID=...`)
- يستدعي [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) لتوقيع الملف الثنائي الرئيسي وحزمة التطبيق لكي يتعامل macOS مع كل إعادة بناء على أنها الحزمة الموقّعة نفسها ويحافظ على أذونات TCC (الإشعارات، إمكانية الوصول، تسجيل الشاشة، الميكروفون، النطق). للحصول على أذونات مستقرة، استخدم هوية توقيع حقيقية؛ التوقيع المخصص اختياري وهش (راجع [أذونات macOS](/ar/platforms/mac/permissions)).
- يستخدم `CODESIGN_TIMESTAMP=auto` افتراضيًا؛ إذ يفعّل الطوابع الزمنية الموثوقة لتوقيعات Developer ID. عيّن `CODESIGN_TIMESTAMP=off` لتخطي إضافة الطابع الزمني (بُنى تصحيح دون اتصال).
- يحقن بيانات تعريف البناء في Info.plist: `OpenClawBuildTimestamp` (UTC) و`OpenClawGitCommit` (تجزئة قصيرة) لكي تتمكن لوحة «حول» من إظهار البناء وgit وقناة التصحيح/الإصدار.
- **تستخدم الحزمة Node 24 افتراضيًا**: يشغّل السكربت بُنى TS وبناء واجهة Control UI. يظل Node 22 LTS، حاليًا `22.19+`، مدعومًا للتوافق.
- يقرأ `SIGN_IDENTITY` من البيئة. أضف `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (أو شهادة Developer ID Application الخاصة بك) إلى ملف إعدادات الصدفة لديك لتوقيع التطبيق دائمًا بشهادتك. يتطلب التوقيع المخصص تفعيلًا صريحًا عبر `ALLOW_ADHOC_SIGNING=1` أو `SIGN_IDENTITY="-"` (غير موصى به لاختبار الأذونات).
- يشغّل تدقيق Team ID بعد التوقيع ويفشل إذا كان أي Mach-O داخل حزمة التطبيق موقّعًا بواسطة Team ID مختلف. عيّن `SKIP_TEAM_ID_CHECK=1` للتجاوز.

## الاستخدام

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### ملاحظة التوقيع المخصص

عند التوقيع باستخدام `SIGN_IDENTITY="-"` (مخصص)، يعطّل السكربت تلقائيًا **Hardened Runtime** (`--options runtime`). وهذا ضروري لمنع الأعطال عندما يحاول التطبيق تحميل أطر عمل مضمّنة (مثل Sparkle) لا تشارك Team ID نفسه. كما تكسر التوقيعات المخصصة استمرارية أذونات TCC؛ راجع [أذونات macOS](/ar/platforms/mac/permissions) للاطلاع على خطوات الاسترداد.

## بيانات تعريف البناء للوحة «حول»

يختم `package-mac-app.sh` الحزمة باستخدام:

- `OpenClawBuildTimestamp`: UTC بصيغة ISO8601 وقت التحزيم
- `OpenClawGitCommit`: تجزئة git قصيرة (أو `unknown` إذا لم تكن متاحة)

يقرأ تبويب «حول» هذه المفاتيح لإظهار الإصدار، وتاريخ البناء، والتزام git، وما إذا كان بناء تصحيح (عبر `#if DEBUG`). شغّل أداة التحزيم لتحديث هذه القيم بعد تغييرات الكود.

## السبب

ترتبط أذونات TCC بمعرّف الحزمة _و_ توقيع الكود. كانت بُنى التصحيح غير الموقّعة ذات UUIDs المتغيرة تتسبب في أن ينسى macOS المنح بعد كل إعادة بناء. يحافظ توقيع الملفات الثنائية (مخصصًا افتراضيًا) والإبقاء على معرّف/مسار حزمة ثابت (`dist/OpenClaw.app`) على المنح بين البُنى، بما يطابق نهج VibeTunnel.

## ذات صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
