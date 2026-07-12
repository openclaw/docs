---
read_when:
    - لقد شغّلت `clawhub package validate` وتحتاج إلى إصلاح النتائج المتعلقة بالـ Plugin
    - رفض ClawHub نشر حزمة Plugin أو أصدر تحذيرًا بشأنها
    - أنت تحدّث البيانات الوصفية لحزمة Plugin قبل الإصدار
summary: أصلح مشكلات التحقق من حزمة Plugin في ClawHub قبل النشر
title: إصلاحات التحقق من صحة Plugin
x-i18n:
    generated_at: "2026-07-12T05:42:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# إصلاحات التحقق من صحة الـ Plugin

يتحقق ClawHub من حزم الـ Plugin قبل النشر، ويمكنه أيضًا عرض النتائج المستخلصة من
عمليات الفحص الآلي للحزم. تتناول هذه الصفحة النتائج الموجّهة إلى المؤلف، أي
النتائج التي يستطيع مؤلف الـ Plugin إصلاحها في بيانات الحزمة الوصفية أو ملف البيان أو عمليات
استيراد SDK أو العنصر المنشور.

لا تتناول هذه الصفحة نتائج تغطية Plugin Inspector الداخلية. إذا احتوى تقرير كامل
على رموز صيانة للماسح من دون إرشادات للمؤلف حول المعالجة، فهي موجّهة إلى مشرفي
OpenClaw وليست إلى مؤلفي الـ Plugin.

بعد تطبيق أي إصلاح، أعد التشغيل:

```bash
clawhub package validate <path-to-plugin>
```

## النتائج الموجّهة إلى المؤلف

| الرمز                                    | ابدأ من هنا                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [أضف بيانات الحزمة الوصفية](/ar/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [أضف كتلة openclaw إلى الحزمة](/ar/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [صرّح بنقاط دخول حزمة OpenClaw](/ar/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [انشر نقطة الدخول المصرّح بها](/ar/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [أكمل بيانات التثبيت الوصفية](/ar/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [صرّح بتوافق واجهة API للـ Plugin](/ar/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [وائم الحد الأدنى لإصدار المضيف](/ar/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [وائم إصداري الحزمة وملف البيان](/ar/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [أزل بيانات حزمة OpenClaw الوصفية غير المدعومة](/ar/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [اجعل عنصر npm قابلًا للحزم](/ar/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [ضمّن نقاط الدخول في مخرجات حزمة npm](/ar/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [ضمّن البيانات الوصفية في مخرجات حزمة npm](/ar/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [أضف اسم عرض إلى ملف البيان](/ar/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [أزل حقول ملف البيان غير المدعومة](/ar/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [أزل مفاتيح العقود غير المدعومة](/ar/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [استبدل عمليات الاستيراد من جذر SDK](/ar/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [أزل عمليات استيراد SDK المحجوزة](/ar/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [استبدل الوصول إلى مخزن الجلسات بالكامل](/ar/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [استبدل عمليات الكتابة إلى مخزن الجلسات بالكامل](/ar/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [استبدل أدوات مساعدة مسارات ملفات الجلسة](/ar/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [استبدل أهداف ملفات نصوص الجلسات القديمة](/ar/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [استبدل أدوات نصوص الجلسات منخفضة المستوى](/ar/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [استبدل before_agent_start](/ar/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [انقل متغيرات بيئة المزوّد إلى بيانات الإعداد الوصفية](/ar/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [طابق متغيرات بيئة القناة في البيانات الوصفية الحالية](/ar/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [أزل مراجع مخطط ملف بيان الأمان غير المتاح](/ar/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [أزل ملفات بيان الأمان غير المدعومة](/ar/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## بيانات الحزمة الوصفية

### package-json-missing

لا يحتوي جذر الحزمة على `package.json`، لذلك لا يستطيع ClawHub تحديد
حزمة npm أو إصدارها أو نقاط دخولها أو بيانات OpenClaw الوصفية.

- أضف `package.json` يتضمن `name` و`version` و`type`.
- أضف كتلة `openclaw` عندما تتضمن الحزمة Plugin لـ OpenClaw.
- استخدم [إنشاء Plugins](/ar/plugins/building-plugins) للاطلاع على مثال مبسط للحزمة،
  و[ملف بيان الـ Plugin](/ar/plugins/manifest#manifest-versus-packagejson)
  لفهم الفصل بين الحزمة وملف البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

تحتوي الحزمة على `package.json`، لكنها لا تصرّح ببيانات حزمة
OpenClaw الوصفية.

- أضف `package.json#openclaw`.
- ضمّن بيانات نقاط الدخول الوصفية مثل `openclaw.extensions` أو
  `openclaw.runtimeExtensions`.
- أضف بيانات التوافق والتثبيت الوصفية عندما ستُنشر الحزمة أو
  تُثبّت عبر ClawHub.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

بيانات الحزمة الوصفية موجودة، لكنها لا تصرّح بنقطة دخول لوقت تشغيل
OpenClaw.

- أضف `openclaw.extensions` لنقاط دخول الـ Plugin الأصلية.
- أضف `openclaw.runtimeExtensions` عندما ينبغي للحزمة المنشورة تحميل
  JavaScript المبني.
- أبقِ جميع مسارات نقاط الدخول داخل دليل الحزمة.
- راجع [نقاط دخول الـ Plugin](/ar/plugins/sdk-entrypoints) و
  [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

تصرّح الحزمة بنقطة دخول لـ OpenClaw، لكن الملف المشار إليه مفقود
من الحزمة الجاري التحقق منها.

- تحقق من كل مسار في `openclaw.extensions` و`openclaw.runtimeExtensions`
  و`openclaw.setupEntry` و`openclaw.runtimeSetupEntry`.
- ابنِ الحزمة إذا كانت نقطة الدخول تُنشأ داخل `dist`.
- حدّث البيانات الوصفية إذا نُقلت نقطة الدخول.
- راجع [نقاط دخول الـ Plugin](/ar/plugins/sdk-entrypoints).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

لا يستطيع ClawHub تحديد كيفية تثبيت الحزمة أو تحديثها.

- املأ `openclaw.install` بمصدر التثبيت المدعوم، مثل
  `clawhubSpec` أو `npmSpec` أو `localPath`.
- اضبط `openclaw.install.defaultChoice` عندما يتوفر أكثر من مصدر تثبيت
  واحد.
- استخدم `openclaw.install.minHostVersion` لتحديد الحد الأدنى لإصدار مضيف OpenClaw.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

لا تصرّح الحزمة بنطاق واجهة API للـ Plugin في OpenClaw الذي تدعمه.

- أضف `openclaw.compat.pluginApi` إلى `package.json`.
- استخدم إصدار واجهة API للـ Plugin في OpenClaw أو الحد الأدنى وفق semver الذي بنيت
  واختبرت الحزمة بناءً عليه.
- أبقِ هذا منفصلًا عن إصدار الحزمة. يصف إصدار الحزمة
  إصدار الـ Plugin؛ بينما يصف `openclaw.compat.pluginApi` عقد واجهة API للمضيف.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

لا يتطابق الحد الأدنى لإصدار المضيف في الحزمة مع بيانات إصدار OpenClaw الوصفية
التي بُنيت الحزمة استنادًا إليها.

- تحقق من `openclaw.install.minHostVersion`.
- تحقق من أي بيانات بناء وصفية لـ OpenClaw في الحزمة، مثل إصدار OpenClaw
  المستخدم أثناء الإصدار.
- وائم الحد الأدنى لإصدار المضيف مع نطاق إصدارات المضيف الذي تدعمه الحزمة
  فعليًا.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

يوجد تعارض بين إصدار الحزمة وإصدار ملف بيان الـ Plugin.

- فضّل `package.json#version` بوصفه إصدار نشر الحزمة.
- إذا كان `openclaw.plugin.json` يحتوي أيضًا على `version`، فحدّثه ليتطابق أو أزل
  بيانات إصدار ملف البيان القديمة عندما تكون بيانات الحزمة الوصفية هي المرجع المعتمد.
- انشر إصدارًا جديدًا من الحزمة بعد تغيير البيانات الوصفية المنشورة.
- راجع [ملف بيان الـ Plugin](/ar/plugins/manifest).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

تحتوي كتلة `package.json#openclaw` على حقول لا تُعد من بيانات حزمة
OpenClaw الوصفية المدعومة.

- أزل الحقول غير المدعومة مثل `openclaw.bundle`.
- احتفظ ببيانات الـ Plugin الأصلية الوصفية في `openclaw.plugin.json`.
- احتفظ ببيانات نقاط دخول الحزمة والتوافق والتثبيت والإعداد والفهرس الوصفية
  في حقول `package.json#openclaw` المدعومة.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## العنصر المنشور

### package-npm-pack-unavailable

لا يمكن حزم الحزمة في العنصر الذي سيفحصه ClawHub أو
ينشره.

- شغّل `npm pack --dry-run` من جذر الحزمة.
- أصلح بيانات الحزمة الوصفية غير الصالحة أو نصوص دورة الحياة المعطلة أو إدخالات الملفات التي
  تتسبب في فشل الحزم.
- أزل `private: true` إذا كانت هذه الحزمة مخصصة للنشر العام.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

يمكن حزم الحزمة، لكن العنصر المحزوم لا يتضمن
ملفات نقاط الدخول المصرّح بها في `package.json#openclaw`.

- شغّل `npm pack --dry-run` وافحص الملفات التي ستُضمّن.
- ابنِ نقاط الدخول المُنشأة قبل الحزم.
- حدّث `files` أو `.npmignore` أو مخرجات البناء حتى تُضمّن
  نقاط الدخول المصرّح بها.
- راجع [نقاط دخول الـ Plugin](/ar/plugins/sdk-entrypoints).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

يفتقد العنصر المحزوم بيانات OpenClaw الوصفية الموجودة في حزمة
المصدر.

- شغّل `npm pack --dry-run` وافحص ملفات البيانات الوصفية المضمّنة.
- تأكد من أن `package.json` يتضمن كتلة `openclaw` في العنصر المحزوم.
- تأكد من تضمين `openclaw.plugin.json` عندما تكون الحزمة Plugin أصليًا
  لـ OpenClaw.
- حدّث `files` أو `.npmignore` حتى لا تُستبعد بيانات الحزمة الوصفية.
- راجع [إنشاء Plugins](/ar/plugins/building-plugins).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## بيانات ملف البيان الوصفية

### manifest-name-missing

لا يتضمن بيان Plugin الأصلي اسم عرض.

- أضف حقل `name` غير فارغ إلى `openclaw.plugin.json`.
- اجعل `name` سهل القراءة للبشر، واحتفظ بـ `id` بوصفه معرّف الجهاز الثابت.
- راجع [بيان Plugin](/ar/plugins/manifest).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

يحتوي بيان Plugin على حقول في المستوى الأعلى لا يدعمها OpenClaw.

- قارن كل حقل في المستوى الأعلى بـ
  [مرجع حقول البيان](/ar/plugins/manifest#top-level-field-reference).
- أزل الحقول المخصصة من `openclaw.plugin.json`.
- انقل بيانات تعريف الحزمة أو التثبيت إلى حقول `package.json#openclaw` المدعومة
  بدلًا من وضعها في البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

يعلن البيان عن مفاتيح غير مدعومة داخل `contracts`.

- قارن كل مفتاح ضمن `contracts` بـ
  [مرجع العقود](/ar/plugins/manifest#contracts-reference).
- أزل مفاتيح العقود غير المدعومة.
- انقل سلوك وقت التشغيل إلى رمز تسجيل Plugin، واجعل `contracts`
  مقتصرًا على بيانات التعريف الثابتة لملكية الإمكانات.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## ترحيل SDK والتوافق

### legacy-root-sdk-import

يستورد Plugin من حزمة التصدير الجذرية المهملة لـ SDK:
`openclaw/plugin-sdk`.

- استبدل عمليات الاستيراد من حزمة التصدير الجذرية بعمليات استيراد مركّزة من المسارات الفرعية العامة.
- استخدم `openclaw/plugin-sdk/plugin-entry` من أجل `definePluginEntry`.
- استخدم `openclaw/plugin-sdk/channel-core` من أجل مساعدات نقطة دخول القناة.
- استخدم [اصطلاحات الاستيراد](/ar/plugins/building-plugins#import-conventions) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths) للعثور على الاستيراد الأضيق نطاقًا.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

يستورد Plugin مسار SDK محجوزًا للإضافات المضمّنة أو للتوافق
الداخلي.

- استبدل عمليات الاستيراد الداخلية المحجوزة لـ SDK في OpenClaw بمسارات
  `openclaw/plugin-sdk/*` الفرعية العامة والموثقة.
- إذا لم يكن للسلوك SDK عام، فاحتفظ بالمساعد داخل حزمتك أو
  اطلب واجهة API عامة من OpenClaw.
- استخدم [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths) و
  [ترحيل SDK](/ar/plugins/sdk-migration) لاختيار استيراد مدعوم.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

لا يزال Plugin يستخدم مساعد مخزن الجلسات الكامل المهمل
`loadSessionStore`.

- استخدم `getSessionEntry(...)` أو `listSessionEntries(...)` عند قراءة حالة
  الجلسة.
- استخدم `patchSessionEntry(...)` أو `upsertSessionEntry(...)` عند كتابة حالة
  الجلسة.
- تجنب تحميل كائن مخزن الجلسات بالكامل وتعديله وحفظه.
- احتفظ بـ `loadSessionStore(...)` فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [واجهة API لوقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

لا يزال Plugin يستخدم مساعد كتابة مهملًا لمخزن الجلسات الكامل، مثل
`saveSessionStore` أو `updateSessionStore`.

- استخدم `patchSessionEntry(...)` عند تحديث حقول في إدخال جلسة موجود.
- استخدم `upsertSessionEntry(...)` عند استبدال إدخال جلسة أو إنشائه.
- تجنب تحميل كائن مخزن الجلسات بالكامل وتعديله وحفظه.
- احتفظ بمساعدات كتابة المخزن الكامل فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبها.
- راجع [واجهة API لوقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

لا يزال Plugin يستخدم مساعدات مسار ملف الجلسة المهملة، مثل
`resolveSessionFilePath` أو `resolveAndPersistSessionFile`.

- استخدم `getSessionEntry(...)` لقراءة بيانات تعريف الجلسة بحسب هوية الوكيل
  والجلسة.
- استخدم `patchSessionEntry(...)` أو `upsertSessionEntry(...)` لحفظ بيانات تعريف
  الجلسة.
- استخدم مساعدات هوية السجل النصي أو هدفه عندما يجهّز الرمز
  عملية على السجل النصي.
- لا تحفظ مسارات ملفات السجل النصي القديمة ولا تعتمد عليها.
- راجع [واجهة API لوقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

لا يزال Plugin يستخدم مساعد هدف ملف السجل النصي المهمل
`resolveSessionTranscriptLegacyFileTarget`.

- استخدم `resolveSessionTranscriptIdentity(...)` عندما لا يحتاج الرمز إلا إلى هوية
  الجلسة العامة.
- استخدم `resolveSessionTranscriptTarget(...)` عندما يحتاج الرمز إلى هدف منظم
  لعملية السجل النصي.
- تجنب قراءة أهداف ملفات السجل النصي القديمة أو إنشائها مباشرةً.
- احتفظ بالمساعد القديم فقط ما دام نطاق التوافق المعلن لديك لا يزال
  يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [واجهة API لوقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

لا يزال Plugin يستخدم مساعدات السجل النصي منخفضة المستوى المهملة، مثل
`appendSessionTranscriptMessage` أو `emitSessionTranscriptUpdate`.

- استخدم `appendSessionTranscriptMessageByIdentity(...)` لإلحاق محتوى بالسجل النصي.
- استخدم `publishSessionTranscriptUpdateByIdentity(...)` لإشعارات تحديث
  السجل النصي.
- فضّل واجهة وقت تشغيل السجل النصي المنظمة حتى يتمكن OpenClaw من تطبيق
  حدود المعاملات الصحيحة ومعالجة الهوية.
- احتفظ بمساعدات السجل النصي منخفضة المستوى فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبها.
- راجع [واجهة API لوقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

لا يزال Plugin يستخدم خطاف `before_agent_start` القديم.

- انقل عمل تجاوز النموذج أو المزوّد إلى `before_model_resolve`.
- انقل عمل تعديل الموجّه أو السياق إلى `before_prompt_build`.
- احتفظ بـ `before_agent_start` فقط ما دام نطاق التوافق المعلن لديك لا يزال
  يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [الخطافات](/ar/plugins/hooks) و
  [توافق Plugin](/ar/plugins/compatibility).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

لا يزال البيان يستخدم بيانات تعريف مصادقة المزوّد القديمة `providerAuthEnvVars`.

- انسخ بيانات تعريف متغيرات بيئة المزوّد إلى `setup.providers[].envVars`.
- احتفظ بـ `providerAuthEnvVars` بوصفها بيانات تعريف للتوافق فقط ما دام نطاق
  OpenClaw المدعوم لديك لا يزال يحتاج إليها.
- راجع [مرجع الإعداد](/ar/plugins/manifest#setup-reference) و
  [ترحيل SDK](/ar/plugins/sdk-migration).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### channel-env-vars

يستخدم البيان بيانات تعريف قديمة أو أقدم لمتغيرات بيئة القناة من دون بيانات تعريف
الإعداد أو التكوين الحالية التي يتوقعها ClawHub.

- اجعل بيانات تعريف متغيرات بيئة القناة تعريفية حتى يتمكن OpenClaw من فحص حالة الإعداد
  من دون تحميل وقت تشغيل القناة.
- انسخ إعداد القناة المعتمد على البيئة إلى بيانات تعريف الإعداد الحالي أو تكوين القناة أو
  قناة الحزمة التي يستخدمها شكل Plugin لديك.
- احتفظ بـ `channelEnvVars` بوصفها بيانات تعريف للتوافق فقط ما دامت إصدارات OpenClaw
  الأقدم المدعومة لا تزال تتطلبها.
- راجع [بيان Plugin](/ar/plugins/manifest) و
  [إضافات القنوات](/ar/plugins/sdk-channel-plugins).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## بيان الأمان

### security-manifest-schema-unavailable

تتضمن الحزمة `openclaw.security.json` مع مرجع مخطط لا يتعرف ClawHub
على أنه متاح.

- أزل عنوان URL للمخطط إذا كان إرشاديًا فقط.
- استخدم مخططًا موثقًا ذا إصدار فقط بعد أن ينشر OpenClaw واحدًا.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

تتضمن الحزمة ملف بيان أمان غير مدعوم.

- أزل `openclaw.security.json` إلى أن يوثّق OpenClaw مخططًا ذا إصدار لبيان
  الأمان وسلوك ClawHub.
- أبقِ السلوك الحساس أمنيًا موثقًا في وثائق حزمتك العامة أو
  ملف README إلى أن يتوفر عقد البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## ذو صلة

- [CLI لـ ClawHub](/ar/clawhub/cli)
- [النشر على ClawHub](/ar/clawhub/publishing)
- [بناء الإضافات](/ar/plugins/building-plugins)
- [بيان Plugin](/ar/plugins/manifest)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [توافق Plugin](/ar/plugins/compatibility)
