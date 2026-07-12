---
read_when:
    - إنشاء أو توقيع إصدارات تصحيح الأخطاء لنظام macOS
summary: خطوات التوقيع لإصدارات تصحيح الأخطاء على macOS المُنشأة بواسطة نصوص الحزم البرمجية
title: توقيع macOS
x-i18n:
    generated_at: "2026-07-12T06:06:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# توقيع mac (إصدارات تصحيح الأخطاء)

يبني السكربت [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) التطبيق ويُحزّمه في مسار ثابت (`dist/OpenClaw.app`)، ثم يستدعي [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) لتوقيعه. ترتبط أذونات TCC بمعرّف الحزمة وتوقيع الشيفرة؛ ويؤدي الحفاظ على ثبات كليهما (مع إبقاء التطبيق في مسار ثابت) عبر عمليات إعادة البناء إلى منع macOS من نسيان منح أذونات TCC (الإشعارات، وإمكانية الوصول، وتسجيل الشاشة، والميكروفون، والتعرّف على الكلام).

- معرّف حزمة تصحيح الأخطاء الافتراضي هو `ai.openclaw.mac.debug` (يمكن تجاوزه باستخدام `BUNDLE_ID=...`).
- Node: الإصدار `>=22.19.0 <23` أو `>=23.11.0` (الحقل `engines` في ملف `package.json` بالمستودع). كما يبني المُحزِّم واجهة التحكم (`pnpm ui:build`).
- يتطلب هوية توقيع حقيقية افتراضيًا؛ وينهي سكربت التوقيع التنفيذ بخطأ إذا لم يعثر على أي هوية ولم يكن `ALLOW_ADHOC_SIGNING` مضبوطًا. يتطلب التوقيع المخصص (`SIGN_IDENTITY="-"`) اشتراكًا صريحًا، ولا يحافظ على أذونات TCC عبر عمليات إعادة البناء. راجع [أذونات macOS](/ar/platforms/mac/permissions).
- يقرأ `SIGN_IDENTITY` من البيئة (مثل `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`، أو شهادة Developer ID Application). في حال عدم ضبطه، يختار `codesign-mac-app.sh` هوية تلقائيًا بالترتيب التالي: Developer ID Application، ثم Apple Distribution، ثم Apple Development، ثم أول هوية صالحة لتوقيع الشيفرة يُعثر عليها.
- يفعّل `CODESIGN_TIMESTAMP=auto` (الافتراضي) الطوابع الزمنية الموثوقة لتوقيعات Developer ID Application فقط. اضبطه على `on` أو `off` لفرض التفعيل أو التعطيل.
- يضيف إلى Info.plist الحقلين `OpenClawBuildTimestamp` (بتنسيق ISO8601 وبتوقيت UTC) و`OpenClawGitCommit` (تجزئة مختصرة، أو `unknown` إذا لم تكن متاحة)، بحيث يمكن لعلامة تبويب «حول» عرض معلومات البناء وgit وقناة تصحيح الأخطاء/الإصدار.
- يجري تدقيقًا لمعرّف الفريق بعد التوقيع، ويفشل إذا كان لأي ملف Mach-O داخل الحزمة معرّف فريق مختلف. اضبط `SKIP_TEAM_ID_CHECK=1` للتجاوز.

## الاستخدام

```bash
# من جذر المستودع
scripts/package-mac-app.sh                                                      # يختار الهوية تلقائيًا؛ ويُصدر خطأ إذا لم يعثر على أي هوية
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # شهادة حقيقية
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # مخصص (لن تستمر الأذونات)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # مخصص صريح (مع التحذير نفسه)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # حل بديل مخصص للتطوير فقط لعدم تطابق معرّف فريق Sparkle
```

### ملاحظة حول التوقيع المخصص

يعطّل `SIGN_IDENTITY="-"` بيئة التشغيل المعززة (`--options runtime`) لمنع الأعطال عندما يحمّل التطبيق أُطر عمل مضمّنة (مثل Sparkle) لا تشترك في معرّف الفريق نفسه. كما تمنع التوقيعات المخصصة استمرار أذونات TCC؛ راجع [أذونات macOS](/ar/platforms/mac/permissions) للاطلاع على خطوات الاسترداد.

## بيانات البناء الوصفية لعلامة تبويب «حول»

تقرأ علامة تبويب «حول» الحقلين `OpenClawBuildTimestamp` و`OpenClawGitCommit` من Info.plist لعرض الإصدار وتاريخ البناء والتزام git وما إذا كان البناء من نوع DEBUG (عبر `#if DEBUG`). أعد تشغيل المُحزِّم بعد تغييرات الشيفرة لتحديث هذه القيم.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
