---
read_when:
    - إنشاء إصدارات تصحيح أخطاء mac أو توقيعها
summary: خطوات التوقيع لبُنى تصحيح الأخطاء على macOS التي تنشئها برامج التحزيم النصية
title: توقيع macOS
x-i18n:
    generated_at: "2026-07-16T14:26:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# توقيع mac (إصدارات تصحيح الأخطاء)

ينشئ [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) التطبيق ويحزّمه في مسار ثابت (`dist/OpenClaw.app`)، ثم يستدعي [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) لتوقيعه. ترتبط أذونات TCC بمعرّف الحزمة وتوقيع الرمز؛ والحفاظ على ثبات كليهما (مع إبقاء التطبيق في مسار ثابت) عبر عمليات إعادة الإنشاء يمنع macOS من نسيان منح أذونات TCC (الإشعارات، وإمكانية الوصول، وتسجيل الشاشة، والميكروفون، والتعرّف على الكلام).

- الإعداد الافتراضي لمعرّف حزمة تصحيح الأخطاء هو `ai.openclaw.mac.debug` (يمكن تجاوزه باستخدام `BUNDLE_ID=...`).
- Node: ‏`>=22.22.3 <23` أو `>=24.15.0 <25` أو `>=25.9.0` (المستودع `package.json` `engines`). ينشئ برنامج التحزيم أيضًا واجهة التحكم (`pnpm ui:build`).
- يتطلب هوية توقيع حقيقية افتراضيًا؛ وينهي سكربت توقيع الرمز التنفيذ بخطأ إذا لم يعثر على أي هوية ولم يكن `ALLOW_ADHOC_SIGNING` مضبوطًا. يتطلب التوقيع المخصص (`SIGN_IDENTITY="-"`) اشتراكًا صريحًا ولا يحافظ على أذونات TCC عبر عمليات إعادة الإنشاء. راجع [أذونات macOS](/ar/platforms/mac/permissions).
- يقرأ `SIGN_IDENTITY` من البيئة (مثل `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` أو شهادة Developer ID Application). في حال عدم توفره، يختار `codesign-mac-app.sh` هوية تلقائيًا بالترتيب التالي: Developer ID Application، ثم Apple Distribution، ثم Apple Development، ثم أول هوية صالحة لتوقيع الرمز يعثر عليها.
- يُفعّل `CODESIGN_TIMESTAMP=auto` (افتراضيًا) الطوابع الزمنية الموثوقة لتوقيعات Developer ID Application فقط. اضبط `on`/`off` لفرض التفعيل أو التعطيل.
- يختم Info.plist بالقيمتين `OpenClawBuildTimestamp` (بتنسيق ISO8601 UTC) و`OpenClawGitCommit` (تجزئة قصيرة، أو `unknown` إذا لم تكن متاحة) حتى تتمكن علامة التبويب «حول» من عرض معلومات الإنشاء وgit وقناة تصحيح الأخطاء/الإصدار.
- يجري تدقيقًا لمعرّف الفريق بعد التوقيع ويفشل إذا كان لأي ملف Mach-O داخل الحزمة معرّف فريق مختلف. اضبط `SKIP_TEAM_ID_CHECK=1` للتجاوز.

## الاستخدام

```bash
# من جذر المستودع
scripts/package-mac-app.sh                                                      # يختار الهوية تلقائيًا؛ ويُظهر خطأ إذا لم يعثر على أي هوية
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # شهادة حقيقية
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # مخصص (لن تستمر الأذونات)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # مخصص صراحةً (مع التحذير نفسه)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # حل بديل خاص بالتطوير لعدم تطابق معرّف فريق Sparkle
```

### ملاحظة حول التوقيع المخصص

يعطّل `SIGN_IDENTITY="-"` وقت التشغيل المحصّن (`--options runtime`) لمنع الأعطال عندما يحمّل التطبيق أُطر العمل المضمّنة (مثل Sparkle) التي لا تشترك في معرّف الفريق نفسه. تؤدي التوقيعات المخصصة أيضًا إلى تعطيل استمرارية أذونات TCC؛ راجع [أذونات macOS](/ar/platforms/mac/permissions) لمعرفة خطوات الاسترداد.

## بيانات الإنشاء الوصفية لنافذة «حول»

تقرأ علامة التبويب «حول» القيمتين `OpenClawBuildTimestamp` و`OpenClawGitCommit` من Info.plist لعرض الإصدار وتاريخ الإنشاء والتزام git وما إذا كان الإنشاء من نوع DEBUG (عبر `#if DEBUG`). أعِد تشغيل برنامج التحزيم بعد تغييرات الرمز لتحديث هذه القيم.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
