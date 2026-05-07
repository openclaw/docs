---
read_when:
    - بناء إصدارات تصحيح الأخطاء لنظام Mac أو توقيعها
summary: خطوات التوقيع لبُنى تصحيح أخطاء macOS التي تولدها نصوص التحزيم
title: توقيع macOS
x-i18n:
    generated_at: "2026-05-07T13:24:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a4edd3d0df0d06c6e60251345a8e4a658bc4a3fceb4c01a21a9e98aeabfb6f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# توقيع mac (بُنى التصحيح)

عادةً ما يُبنى هذا التطبيق من [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)، والذي يقوم الآن بما يلي:

- يضبط معرّف حزمة تصحيح ثابتًا: `ai.openclaw.mac.debug`
- يكتب Info.plist باستخدام معرّف الحزمة هذا (يمكن التجاوز عبر `BUNDLE_ID=...`)
- يستدعي [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) لتوقيع الملف الثنائي الرئيسي وحزمة التطبيق بحيث يتعامل macOS مع كل إعادة بناء على أنها الحزمة الموقّعة نفسها ويحتفظ بأذونات TCC (الإشعارات، إمكانية الوصول، تسجيل الشاشة، الميكروفون، النطق). للحصول على أذونات مستقرة، استخدم هوية توقيع حقيقية؛ التوقيع المخصّص اختياري وهش (راجع [أذونات macOS](/ar/platforms/mac/permissions)).
- يستخدم `CODESIGN_TIMESTAMP=auto` افتراضيًا؛ وهو يفعّل الطوابع الزمنية الموثوقة لتوقيعات Developer ID. اضبط `CODESIGN_TIMESTAMP=off` لتجاوز إضافة الطابع الزمني (بُنى التصحيح دون اتصال).
- يحقن بيانات تعريف البناء في Info.plist: `OpenClawBuildTimestamp` (UTC) و`OpenClawGitCommit` (تجزئة قصيرة) حتى تتمكن لوحة About من عرض البناء وgit وقناة التصحيح/الإصدار.
- **تستخدم الحزمة Node 24 افتراضيًا**: يشغّل السكربت بُنى TS وبناء Control UI. لا يزال Node 22 LTS، وهو حاليًا `22.16+`، مدعومًا للتوافق.
- يقرأ `SIGN_IDENTITY` من البيئة. أضف `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (أو شهادة Developer ID Application الخاصة بك) إلى ملف rc للصدفة لديك للتوقيع دائمًا بشهادتك. يتطلب التوقيع المخصّص اشتراكًا صريحًا عبر `ALLOW_ADHOC_SIGNING=1` أو `SIGN_IDENTITY="-"` (غير موصى به لاختبار الأذونات).
- يشغّل تدقيق Team ID بعد التوقيع ويفشل إذا كان أي ملف Mach-O داخل حزمة التطبيق موقّعًا بواسطة Team ID مختلف. اضبط `SKIP_TEAM_ID_CHECK=1` للتجاوز.

## الاستخدام

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### ملاحظة التوقيع المخصّص

عند التوقيع باستخدام `SIGN_IDENTITY="-"` (مخصّص)، يعطّل السكربت تلقائيًا **Hardened Runtime** (`--options runtime`). هذا ضروري لمنع الأعطال عندما يحاول التطبيق تحميل أطر عمل مضمّنة (مثل Sparkle) لا تشترك في Team ID نفسه. كما أن التواقيع المخصّصة تعطل استمرار أذونات TCC؛ راجع [أذونات macOS](/ar/platforms/mac/permissions) لمعرفة خطوات الاسترداد.

## بيانات تعريف البناء لـ About

يختم `package-mac-app.sh` الحزمة بما يلي:

- `OpenClawBuildTimestamp`: وقت UTC بصيغة ISO8601 عند التغليف
- `OpenClawGitCommit`: تجزئة git قصيرة (أو `unknown` إذا لم تكن متاحة)

يقرأ تبويب About هذه المفاتيح لعرض الإصدار، وتاريخ البناء، وcommit في git، وما إذا كان بناء تصحيح (عبر `#if DEBUG`). شغّل أداة التغليف لتحديث هذه القيم بعد تغييرات الكود.

## السبب

ترتبط أذونات TCC بمعرّف الحزمة _و_ توقيع الكود. كانت بُنى التصحيح غير الموقّعة ذات معرّفات UUID المتغيرة تجعل macOS ينسى المنح بعد كل إعادة بناء. توقيع الملفات الثنائية (توقيع مخصّص افتراضيًا) والإبقاء على معرّف/مسار حزمة ثابت (`dist/OpenClaw.app`) يحافظان على المنح بين البُنى، بما يطابق نهج VibeTunnel.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
