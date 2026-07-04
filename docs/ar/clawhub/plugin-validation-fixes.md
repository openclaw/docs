---
read_when:
    - شغّلت clawhub package validate وتحتاج إلى إصلاح ملاحظات Plugin
    - رفض ClawHub نشر حزمة Plugin أو أصدر تحذيرًا بشأنها
    - أنت تحدّث بيانات تعريف حزمة Plugin قبل الإصدار
summary: إصلاح ملاحظات التحقق من حزمة Plugin في ClawHub قبل النشر
title: إصلاحات التحقق من Plugin
x-i18n:
    generated_at: "2026-07-04T20:32:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# إصلاحات التحقق من Plugin

يتحقق ClawHub من حزم Plugin قبل النشر، ويمكنه أيضًا عرض النتائج من
عمليات فحص الحزم الآلية. تغطي هذه الصفحة النتائج الموجهة للمؤلفين، أي
النتائج التي يمكن لمؤلف Plugin إصلاحها في بيانات الحزمة الوصفية أو البيان أو عمليات
استيراد SDK أو الأثر المنشور.

لا تغطي هذه الصفحة نتائج تغطية Plugin Inspector الداخلية. إذا احتوى تقرير كامل
على رموز صيانة للماسح دون إرشادات معالجة للمؤلف، فهي مخصصة لمشرفي OpenClaw
وليس لمؤلفي Plugin.

بعد تطبيق أي إصلاح، أعد التشغيل:

```bash
clawhub package validate <path-to-plugin>
```

## النتائج الموجهة للمؤلفين

| الرمز                                   | ابدأ هنا                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [أضف بيانات الحزمة الوصفية](/ar/clawhub/plugin-validation-fixes#package-json-missing)                                          |
| `package-openclaw-metadata-missing`     | [أضف كتلة openclaw للحزمة](/ar/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                              |
| `package-openclaw-entry-missing`        | [صرح بنقاط دخول حزمة OpenClaw](/ar/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                             |
| `package-entrypoint-missing`            | [انشر نقطة الدخول المصرح بها](/ar/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [أكمل بيانات التثبيت الوصفية](/ar/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                         |
| `package-plugin-api-compat-missing`     | [صرح بتوافق واجهة Plugin API](/ar/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                           |
| `package-min-host-version-drift`        | [طابق الحد الأدنى لإصدار المضيف](/ar/clawhub/plugin-validation-fixes#package-min-host-version-drift)                           |
| `package-manifest-version-drift`        | [طابق إصداري الحزمة والبيان](/ar/clawhub/plugin-validation-fixes#package-manifest-version-drift)                               |
| `package-openclaw-unsupported-metadata` | [أزل بيانات حزمة OpenClaw الوصفية غير المدعومة](/ar/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)     |
| `package-npm-pack-unavailable`          | [اجعل أثر npm قابلا للحزم](/ar/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                   |
| `package-npm-pack-entrypoint-missing`   | [ضمن نقاط الدخول في مخرجات حزمة npm](/ar/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [ضمن البيانات الوصفية في مخرجات حزمة npm](/ar/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)               |
| `manifest-name-missing`                 | [أضف اسم عرض للبيان](/ar/clawhub/plugin-validation-fixes#manifest-name-missing)                                                |
| `manifest-unknown-fields`               | [أزل حقول البيان غير المدعومة](/ar/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                    |
| `manifest-unknown-contracts`            | [أزل مفاتيح العقود غير المدعومة](/ar/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                               |
| `legacy-root-sdk-import`                | [استبدل عمليات استيراد SDK الجذرية](/ar/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                |
| `reserved-sdk-import`                   | [أزل عمليات استيراد SDK المحجوزة](/ar/clawhub/plugin-validation-fixes#reserved-sdk-import)                                     |
| `sdk-load-session-store`                | [استبدل الوصول إلى مخزن الجلسة الكامل](/ar/clawhub/plugin-validation-fixes#sdk-load-session-store)                             |
| `sdk-session-store-write`               | [استبدل عمليات الكتابة إلى مخزن الجلسة الكامل](/ar/clawhub/plugin-validation-fixes#sdk-session-store-write)                    |
| `sdk-session-file-helper`               | [استبدل مساعدات مسارات ملفات الجلسات](/ar/clawhub/plugin-validation-fixes#sdk-session-file-helper)                             |
| `sdk-session-transcript-file-target`    | [استبدل أهداف ملفات النصوص القديمة](/ar/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                    |
| `sdk-session-transcript-low-level`      | [استبدل مساعدات النصوص منخفضة المستوى](/ar/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                   |
| `legacy-before-agent-start`             | [استبدل before_agent_start](/ar/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                      |
| `provider-auth-env-vars`                | [انقل متغيرات بيئة الموفر إلى بيانات الإعداد الوصفية](/ar/clawhub/plugin-validation-fixes#provider-auth-env-vars)              |
| `channel-env-vars`                      | [اعكس متغيرات بيئة القناة في البيانات الوصفية الحالية](/ar/clawhub/plugin-validation-fixes#channel-env-vars)                   |
| `security-manifest-schema-unavailable`  | [أزل مراجع مخططات بيان الأمان غير المتاحة](/ar/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable)           |
| `unrecognized-security-manifest`        | [أزل ملفات بيان الأمان غير المدعومة](/ar/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                       |

## بيانات الحزمة الوصفية

### package-json-missing

لا يتضمن جذر الحزمة `package.json`، لذلك لا يستطيع ClawHub تحديد حزمة
npm أو الإصدار أو نقاط الدخول أو بيانات OpenClaw الوصفية.

- أضف `package.json` يتضمن `name` و`version` و`type`.
- أضف كتلة `openclaw` عندما تشحن الحزمة Plugin لـ OpenClaw.
- استخدم [بناء Plugins](/ar/plugins/building-plugins) للحصول على مثال حزمة
  مصغر، و[بيان Plugin](/ar/plugins/manifest#manifest-versus-packagejson)
  للتفريق بين الحزمة والبيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

تحتوي الحزمة على `package.json`، لكنها لا تصرح ببيانات حزمة OpenClaw
الوصفية.

- أضف `package.json#openclaw`.
- ضمن بيانات وصفية لنقاط الدخول مثل `openclaw.extensions` أو
  `openclaw.runtimeExtensions`.
- أضف بيانات التوافق والتثبيت الوصفية عندما ستنشر الحزمة أو
  تثبت عبر ClawHub.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

بيانات الحزمة الوصفية موجودة، لكنها لا تصرح بنقطة دخول وقت تشغيل
OpenClaw.

- أضف `openclaw.extensions` لنقاط دخول Plugin الأصلية.
- أضف `openclaw.runtimeExtensions` عندما يجب أن تحمل الحزمة المنشورة
  JavaScript المبني.
- أبق جميع مسارات نقاط الدخول داخل دليل الحزمة.
- راجع [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints) و
  [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

تصرح الحزمة بنقطة دخول OpenClaw، لكن الملف المشار إليه مفقود
من الحزمة التي يجري التحقق منها.

- تحقق من كل مسار في `openclaw.extensions` و`openclaw.runtimeExtensions`
  و`openclaw.setupEntry` و`openclaw.runtimeSetupEntry`.
- ابن الحزمة إذا كانت نقطة الدخول تولد داخل `dist`.
- حدث البيانات الوصفية إذا انتقلت نقطة الدخول.
- راجع [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

لا يستطيع ClawHub معرفة كيفية تثبيت الحزمة أو تحديثها.

- املأ `openclaw.install` بمصدر التثبيت المدعوم، مثل
  `clawhubSpec` أو `npmSpec` أو `localPath`.
- عين `openclaw.install.defaultChoice` عندما يتوفر أكثر من مصدر تثبيت واحد.
- استخدم `openclaw.install.minHostVersion` للحد الأدنى من إصدار مضيف OpenClaw.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

لا تصرح الحزمة بنطاق واجهة Plugin API في OpenClaw الذي تدعمه.

- أضف `openclaw.compat.pluginApi` إلى `package.json`.
- استخدم إصدار واجهة Plugin API في OpenClaw أو حد semver الأدنى الذي بنيت واختبرت
  بناء عليه.
- أبق هذا منفصلا عن إصدار الحزمة. يصف إصدار الحزمة
  إصدار Plugin؛ بينما يصف `openclaw.compat.pluginApi` عقد API للمضيف.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

لا يطابق الحد الأدنى لإصدار المضيف في الحزمة بيانات إصدار OpenClaw الوصفية
التي بنيت الحزمة بناء عليها.

- تحقق من `openclaw.install.minHostVersion`.
- تحقق من أي بيانات بناء وصفية لـ OpenClaw في الحزمة، مثل إصدار OpenClaw
  المستخدم أثناء الإصدار.
- طابق الحد الأدنى لإصدار المضيف مع نطاق إصدار المضيف الذي تدعمه الحزمة
  فعليا.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

إصدار الحزمة وإصدار بيان Plugin غير متطابقين.

- فضل `package.json#version` بوصفه إصدار إصدار الحزمة.
- إذا كان `openclaw.plugin.json` يحتوي أيضا على `version`، فحدثه ليتطابق أو أزل
  بيانات إصدار البيان القديمة عندما تكون بيانات الحزمة الوصفية هي المرجع.
- انشر إصدار حزمة جديدا بعد تغيير البيانات الوصفية المنشورة.
- راجع [بيان Plugin](/ar/plugins/manifest).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

تحتوي كتلة `package.json#openclaw` على حقول ليست مدعومة
كبيانات وصفية لحزمة OpenClaw.

- أزل الحقول غير المدعومة مثل `openclaw.bundle`.
- أبق بيانات Plugin الأصلية الوصفية في `openclaw.plugin.json`.
- أبق نقاط دخول الحزمة والتوافق والتثبيت والإعداد وبيانات الفهرس الوصفية
  في حقول `package.json#openclaw` المدعومة.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## الأثر المنشور

### package-npm-pack-unavailable

لا يمكن حزم الحزمة في الأثر الذي سيفحصه ClawHub أو
ينشره.

- شغل `npm pack --dry-run` من جذر الحزمة.
- أصلح بيانات الحزمة الوصفية غير الصالحة أو نصوص دورة الحياة المعطلة أو إدخالات الملفات التي
  تجعل الحزم يفشل.
- أزل `private: true` إذا كانت هذه الحزمة مخصصة للنشر العام.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

يمكن حزم الحزمة، لكن الأثر المحزم لا يتضمن
ملفات نقاط الدخول المصرح بها في `package.json#openclaw`.

- شغل `npm pack --dry-run` وافحص الملفات التي ستضمن.
- ابن نقاط الدخول المولدة قبل الحزم.
- حدث `files` أو `.npmignore` أو مخرجات البناء بحيث تضمن نقاط الدخول
  المصرح بها.
- راجع [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

يفتقد الأثر المحزم بيانات OpenClaw الوصفية الموجودة في حزمة
المصدر لديك.

- شغل `npm pack --dry-run` وافحص ملفات البيانات الوصفية المضمنة.
- تأكد من أن `package.json` يتضمن كتلة `openclaw` في الأثر المحزم.
- تأكد من تضمين `openclaw.plugin.json` عندما تكون الحزمة Plugin أصلية
  لـ OpenClaw.
- حدث `files` أو `.npmignore` حتى لا تستبعد بيانات الحزمة الوصفية.
- راجع [بناء Plugins](/ar/plugins/building-plugins).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## بيانات البيان الوصفية

### manifest-name-missing

لا يتضمن بيان Plugin الأصلي اسم عرض.

- أضف حقل `name` غير فارغ إلى `openclaw.plugin.json`.
- اجعل `name` قابلاً للقراءة البشرية وأبقِ `id` معرّف الجهاز الثابت.
- راجع [بيان Plugin](/ar/plugins/manifest).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

يحتوي بيان الإضافة على حقول على المستوى الأعلى لا يدعمها OpenClaw.

- قارن كل حقل على المستوى الأعلى مع
  [مرجع حقول البيان](/ar/plugins/manifest#top-level-field-reference).
- أزل الحقول المخصصة من `openclaw.plugin.json`.
- انقل بيانات الحزمة أو التثبيت الوصفية إلى حقول `package.json#openclaw`
  المدعومة بدلاً من البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

يعلن البيان مفاتيح غير مدعومة داخل `contracts`.

- قارن كل مفتاح ضمن `contracts` مع
  [مرجع العقود](/ar/plugins/manifest#contracts-reference).
- أزل مفاتيح العقود غير المدعومة.
- انقل سلوك وقت التشغيل إلى كود تسجيل الإضافة، واجعل `contracts`
  مقتصرة على بيانات وصفية ثابتة لملكية القدرات.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## ترحيل SDK والتوافق

### legacy-root-sdk-import

تستورد الإضافة من حزمة SDK الجذرية المهملة:
`openclaw/plugin-sdk`.

- استبدل استيرادات الحزمة الجذرية باستيرادات مسارات فرعية عامة ومركزة.
- استخدم `openclaw/plugin-sdk/plugin-entry` من أجل `definePluginEntry`.
- استخدم `openclaw/plugin-sdk/channel-core` من أجل مساعدات إدخال القنوات.
- استخدم [اصطلاحات الاستيراد](/ar/plugins/building-plugins#import-conventions) و
  [مسارات Plugin SDK الفرعية](/ar/plugins/sdk-subpaths) للعثور على الاستيراد الضيق.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

تستورد الإضافة مسار SDK محجوزاً للإضافات المضمنة أو للتوافق
الداخلي.

- استبدل استيرادات SDK الداخلية المحجوزة في OpenClaw بمسارات فرعية عامة
  وموثقة من `openclaw/plugin-sdk/*`.
- إذا لم يكن للسلوك SDK عام، فأبقِ المساعد داخل حزمتك أو
  اطلب API عامة من OpenClaw.
- استخدم [مسارات Plugin SDK الفرعية](/ar/plugins/sdk-subpaths) و
  [ترحيل SDK](/ar/plugins/sdk-migration) لاختيار استيراد مدعوم.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

ما زالت الإضافة تستخدم مساعد مخزن الجلسة الكامل المهمل
`loadSessionStore`.

- استخدم `getSessionEntry(...)` أو `listSessionEntries(...)` عند قراءة حالة
  الجلسة.
- استخدم `patchSessionEntry(...)` أو `upsertSessionEntry(...)` عند كتابة حالة
  الجلسة.
- تجنب تحميل كائن مخزن الجلسة الكامل وتعديله وحفظه.
- أبقِ `loadSessionStore(...)` فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [مسارات Plugin SDK الفرعية](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

ما زالت الإضافة تستخدم مساعد كتابة مخزن جلسة كامل مهمل مثل
`saveSessionStore` أو `updateSessionStore`.

- استخدم `patchSessionEntry(...)` عند تحديث الحقول في إدخال جلسة موجود.
- استخدم `upsertSessionEntry(...)` عند استبدال إدخال جلسة أو إنشائه.
- تجنب تحميل كائن مخزن الجلسة الكامل وتعديله وحفظه.
- أبقِ مساعدات كتابة المخزن الكامل فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبها.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [مسارات Plugin SDK الفرعية](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

ما زالت الإضافة تستخدم مساعدات مسارات ملفات الجلسات المهملة مثل
`resolveSessionFilePath` أو `resolveAndPersistSessionFile`.

- استخدم `getSessionEntry(...)` لقراءة بيانات الجلسة الوصفية حسب هوية الوكيل
  والجلسة.
- استخدم `patchSessionEntry(...)` أو `upsertSessionEntry(...)` لحفظ بيانات
  الجلسة الوصفية.
- استخدم مساعدات هوية النص أو الهدف عندما يكون الكود يحضر عملية
  نص.
- لا تحفظ مسارات ملفات النصوص القديمة ولا تعتمد عليها.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [مسارات Plugin SDK الفرعية](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

ما زالت الإضافة تستخدم مساعد هدف ملف النص المهمل
`resolveSessionTranscriptLegacyFileTarget`.

- استخدم `resolveSessionTranscriptIdentity(...)` عندما يحتاج الكود فقط إلى
  هوية الجلسة العامة.
- استخدم `resolveSessionTranscriptTarget(...)` عندما يحتاج الكود إلى هدف
  عملية نص منظم.
- تجنب قراءة أو إنشاء أهداف ملفات النصوص القديمة مباشرة.
- أبقِ المساعد القديم فقط ما دام نطاق التوافق المعلن لديك لا يزال
  يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [مسارات Plugin SDK الفرعية](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

ما زالت الإضافة تستخدم مساعدات نص منخفضة المستوى مهملة مثل
`appendSessionTranscriptMessage` أو `emitSessionTranscriptUpdate`.

- استخدم `appendSessionTranscriptMessageByIdentity(...)` لإلحاقات النص.
- استخدم `publishSessionTranscriptUpdateByIdentity(...)` لإشعارات تحديث النص.
- فضّل واجهة وقت تشغيل النص المنظمة حتى يتمكن OpenClaw من تطبيق
  حدود المعاملة الصحيحة ومعالجة الهوية.
- أبقِ مساعدات النص منخفضة المستوى فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبها.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [مسارات Plugin SDK الفرعية](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

ما زالت الإضافة تستخدم الخطاف القديم `before_agent_start`.

- انقل عمل تجاوز النموذج أو المزوّد إلى `before_model_resolve`.
- انقل عمل تعديل الموجه أو السياق إلى `before_prompt_build`.
- أبقِ `before_agent_start` فقط ما دام نطاق التوافق المعلن لديك لا يزال
  يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [الخطافات](/ar/plugins/hooks) و
  [توافق Plugin](/ar/plugins/compatibility).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

ما زال البيان يستخدم بيانات وصفية قديمة لمصادقة المزوّد باسم `providerAuthEnvVars`.

- انسخ بيانات متغيرات بيئة المزوّد الوصفية إلى `setup.providers[].envVars`.
- أبقِ `providerAuthEnvVars` فقط كبيانات وصفية للتوافق ما دام نطاق
  OpenClaw المدعوم لديك لا يزال يحتاج إليه.
- راجع [مرجع الإعداد](/ar/plugins/manifest#setup-reference) و
  [ترحيل SDK](/ar/plugins/sdk-migration).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### channel-env-vars

يستخدم البيان بيانات وصفية قديمة أو أقدم لمتغيرات بيئة القناة من دون بيانات
الإعداد أو التكوين الوصفية الحالية التي يتوقعها ClawHub.

- أبقِ بيانات متغيرات بيئة القناة الوصفية تصريحية حتى يتمكن OpenClaw من فحص حالة
  الإعداد من دون تحميل وقت تشغيل القناة.
- انسخ إعداد القناة المدفوع بالبيئة إلى بيانات الإعداد الحالية أو تكوين القناة أو
  بيانات قناة الحزمة الوصفية التي يستخدمها شكل إضافتك.
- أبقِ `channelEnvVars` فقط كبيانات وصفية للتوافق ما دامت إصدارات
  OpenClaw الأقدم المدعومة لا تزال تتطلبها.
- راجع [بيان Plugin](/ar/plugins/manifest) و
  [إضافات القنوات](/ar/plugins/sdk-channel-plugins).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## بيان الأمان

### security-manifest-schema-unavailable

تشحن الحزمة `openclaw.security.json` مع مرجع مخطط لا يتعرف عليه ClawHub
على أنه متاح.

- أزل عنوان URL الخاص بالمخطط إذا كان إرشادياً فقط.
- استخدم مخططاً موثقاً ومصدراً بإصدار فقط بعد أن ينشر OpenClaw واحداً.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

تشحن الحزمة ملف بيان أمان غير مدعوم.

- أزل `openclaw.security.json` إلى أن يوثق OpenClaw مخطط بيان أمان
  بإصدار وسلوك ClawHub.
- أبقِ السلوك الحساس أمنياً موثقاً في وثائق حزمتك العامة أو
  README إلى أن يوجد عقد البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## ذو صلة

- [ClawHub CLI](/ar/clawhub/cli)
- [النشر في ClawHub](/ar/clawhub/publishing)
- [بناء الإضافات](/ar/plugins/building-plugins)
- [بيان Plugin](/ar/plugins/manifest)
- [نقاط إدخال Plugin](/ar/plugins/sdk-entrypoints)
- [توافق Plugin](/ar/plugins/compatibility)
