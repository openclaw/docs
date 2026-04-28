---
read_when:
    - بناء أو توقيع إصدارات macOS debug
summary: خطوات التوقيع لإصدارات debug الخاصة بـ macOS التي تُولَّد بواسطة نصوص التغليف
title: توقيع macOS
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# توقيع mac ‏(إصدارات debug)

يُبنى هذا التطبيق عادةً من [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)، والذي يقوم الآن بما يلي:

- يضبط معرّف حزمة debug ثابتًا: `ai.openclaw.mac.debug`
- يكتب Info.plist بهذا المعرّف (مع إمكانية التجاوز عبر `BUNDLE_ID=...`)
- يستدعي [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) لتوقيع الملف التنفيذي الرئيسي وحزمة التطبيق بحيث يتعامل macOS مع كل إعادة بناء على أنها الحزمة الموقعة نفسها ويحافظ على أذونات TCC (الإشعارات، وإمكانية الوصول، وتسجيل الشاشة، والميكروفون، والكلام). وللحصول على أذونات مستقرة، استخدم هوية توقيع حقيقية؛ أما التوقيع ad-hoc فهو اشتراك اختياري وهش (راجع [أذونات macOS](/ar/platforms/mac/permissions)).
- يستخدم `CODESIGN_TIMESTAMP=auto` افتراضيًا؛ فهو يفعّل الطوابع الزمنية الموثوقة لتواقيع Developer ID. اضبط `CODESIGN_TIMESTAMP=off` لتخطي ختم الوقت (إصدارات debug دون اتصال).
- يحقن بيانات البناء الوصفية في Info.plist: ‏`OpenClawBuildTimestamp` ‏(UTC) و`OpenClawGitCommit` ‏(تجزئة قصيرة) بحيث يمكن للوحة About عرض البناء وgit وقناة debug/release.
- **يستخدم التغليف Node 24 افتراضيًا**: إذ يشغّل النص عمليات بناء TS وبناء Control UI. وما يزال Node 22 LTS، حاليًا `22.14+`، مدعومًا للتوافق.
- يقرأ `SIGN_IDENTITY` من البيئة. أضف `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (أو شهادة Developer ID Application الخاصة بك) إلى shell rc لديك لتوقّع دائمًا باستخدام شهادتك. ويتطلب التوقيع ad-hoc اشتراكًا صريحًا عبر `ALLOW_ADHOC_SIGNING=1` أو `SIGN_IDENTITY="-"` (غير موصى به لاختبار الأذونات).
- يشغّل تدقيق Team ID بعد التوقيع ويفشل إذا كان أي Mach-O داخل حزمة التطبيق موقّعًا بواسطة Team ID مختلف. اضبط `SKIP_TEAM_ID_CHECK=1` لتجاوز ذلك.

## الاستخدام

```bash
# من جذر المستودع
scripts/package-mac-app.sh               # يختار الهوية تلقائيًا؛ ويعطي خطأ إذا لم يجد أي هوية
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # شهادة حقيقية
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (لن تستمر الأذونات)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc صريح (بنفس التحذير)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # حل مؤقت خاص بالتطوير لعدم تطابق Sparkle Team ID
```

### ملاحظة حول التوقيع ad-hoc

عند التوقيع باستخدام `SIGN_IDENTITY="-"` ‏(ad-hoc)، يقوم النص تلقائيًا بتعطيل **Hardened Runtime** ‏(`--options runtime`). وهذا ضروري لمنع الأعطال عندما يحاول التطبيق تحميل أطر عمل مضمنة (مثل Sparkle) لا تشترك في Team ID نفسه. كما أن التواقيع ad-hoc تكسر استمرارية أذونات TCC؛ راجع [أذونات macOS](/ar/platforms/mac/permissions) للاطلاع على خطوات الاستعادة.

## بيانات البناء الوصفية لـ About

يضع `package-mac-app.sh` ختمًا على الحزمة بالقيم التالية:

- `OpenClawBuildTimestamp`: ‏ISO8601 UTC وقت التغليف
- `OpenClawGitCommit`: تجزئة git قصيرة (أو `unknown` إذا لم تكن متاحة)

يقرأ تبويب About هذه المفاتيح لعرض الإصدار، وتاريخ البناء، وcommit الخاص بـ git، وما إذا كان إصدار debug ‏(عبر `#if DEBUG`). شغّل أداة التغليف لتحديث هذه القيم بعد تغييرات الشيفرة.

## لماذا

ترتبط أذونات TCC بمعرّف الحزمة _وبالتوقيع البرمجي_. وكانت إصدارات debug غير الموقعة ذات UUIDs المتغيرة تتسبب في نسيان macOS للأذونات بعد كل إعادة بناء. إن توقيع الملفات التنفيذية (ad‑hoc افتراضيًا) مع الإبقاء على معرّف/مسار حزمة ثابت (`dist/OpenClaw.app`) يحافظ على الأذونات بين عمليات البناء، بما يطابق نهج VibeTunnel.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
