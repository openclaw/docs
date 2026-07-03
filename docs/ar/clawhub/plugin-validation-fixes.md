---
read_when:
    - شغّلت clawhub package validate وتحتاج إلى إصلاح ملاحظات Plugin
    - رفض ClawHub نشر حزمة Plugin أو أصدر تحذيرًا بشأنها
    - أنت تحدّث بيانات تعريف حزمة Plugin قبل الإصدار
summary: إصلاح نتائج التحقق من حزمة Plugin في ClawHub قبل النشر
title: إصلاحات التحقق من صحة Plugin
x-i18n:
    generated_at: "2026-07-03T09:38:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# إصلاحات التحقق من صحة Plugin

يتحقق ClawHub من حزم Plugin قبل النشر، ويمكنه أيضًا عرض النتائج من
عمليات فحص الحزم المؤتمتة. تغطي هذه الصفحة النتائج الموجهة للمؤلفين، أي
النتائج التي يمكن لمؤلف Plugin إصلاحها في بيانات تعريف الحزمة، أو البيان، أو
استيرادات SDK، أو الأثر المنشور.

لا تغطي هذه الصفحة نتائج تغطية Plugin Inspector الداخلية. إذا كان التقرير الكامل
يحتوي على رموز صيانة للماسح من دون إرشادات معالجة للمؤلف، فهي مخصصة
لمشرفي OpenClaw لا لمؤلفي Plugin.

بعد تطبيق أي إصلاح، أعد التشغيل:

```bash
clawhub package validate <path-to-plugin>
```

## النتائج الموجهة للمؤلفين

| الرمز                                    | ابدأ هنا                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [أضف بيانات تعريف الحزمة](/ar/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [أضف كتلة openclaw للحزمة](/ar/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [صرّح بنقاط دخول حزمة OpenClaw](/ar/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [انشر نقطة الدخول المصرح بها](/ar/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [أكمل بيانات تعريف التثبيت](/ar/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [صرّح بتوافق واجهة Plugin البرمجية](/ar/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [واءم الحد الأدنى لإصدار المضيف](/ar/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [واءم إصداري الحزمة والبيان](/ar/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [أزل بيانات تعريف حزمة OpenClaw غير المدعومة](/ar/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [اجعل أثر npm قابلاً للحزم](/ar/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [ضمّن نقاط الدخول في مخرجات حزم npm](/ar/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [ضمّن بيانات التعريف في مخرجات حزم npm](/ar/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [أضف اسم عرض للبيان](/ar/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [أزل حقول البيان غير المدعومة](/ar/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [أزل مفاتيح العقود غير المدعومة](/ar/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [استبدل استيرادات SDK الجذرية](/ar/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [أزل استيرادات SDK المحجوزة](/ar/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [استبدل الوصول إلى مخزن الجلسة بالكامل](/ar/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [استبدل عمليات الكتابة إلى مخزن الجلسة بالكامل](/ar/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [استبدل مساعدات مسار ملف الجلسة](/ar/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [استبدل أهداف ملفات النصوص القديمة](/ar/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [استبدل مساعدات النصوص منخفضة المستوى](/ar/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [استبدل before_agent_start](/ar/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [انقل متغيرات بيئة الموفر إلى بيانات تعريف الإعداد](/ar/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [اعكس متغيرات بيئة القناة في بيانات التعريف الحالية](/ar/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [أزل مراجع مخطط بيان الأمان غير المتاحة](/ar/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [أزل ملفات بيان الأمان غير المدعومة](/ar/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## بيانات تعريف الحزمة

### package-json-missing

لا يتضمن جذر الحزمة `package.json`، لذلك لا يستطيع ClawHub تحديد حزمة
npm، أو الإصدار، أو نقاط الدخول، أو بيانات تعريف OpenClaw.

- أضف `package.json` مع `name` و`version` و`type`.
- أضف كتلة `openclaw` عندما تشحن الحزمة Plugin من OpenClaw.
- استخدم [بناء Plugins](/ar/plugins/building-plugins) للحصول على مثال حزمة
  أدنى، و[بيان Plugin](/ar/plugins/manifest#manifest-versus-packagejson)
  لفصل الحزمة عن البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

تحتوي الحزمة على `package.json`، لكنها لا تصرّح ببيانات تعريف حزمة
OpenClaw.

- أضف `package.json#openclaw`.
- ضمّن بيانات تعريف نقطة الدخول مثل `openclaw.extensions` أو
  `openclaw.runtimeExtensions`.
- أضف بيانات تعريف التوافق والتثبيت عندما ستُنشر الحزمة أو
  تُثبّت عبر ClawHub.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

بيانات تعريف الحزمة موجودة، لكنها لا تصرّح بنقطة دخول وقت تشغيل
OpenClaw.

- أضف `openclaw.extensions` لنقاط دخول Plugin الأصلية.
- أضف `openclaw.runtimeExtensions` عندما يجب أن تحمّل الحزمة المنشورة
  JavaScript المبني.
- أبقِ جميع مسارات نقاط الدخول داخل دليل الحزمة.
- راجع [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints) و
  [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

تصرّح الحزمة بنقطة دخول OpenClaw، لكن الملف المشار إليه مفقود
من الحزمة التي يجري التحقق منها.

- تحقق من كل مسار في `openclaw.extensions` و`openclaw.runtimeExtensions`
  و`openclaw.setupEntry` و`openclaw.runtimeSetupEntry`.
- ابنِ الحزمة إذا كانت نقطة الدخول تُولّد داخل `dist`.
- حدّث بيانات التعريف إذا نُقلت نقطة الدخول.
- راجع [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

لا يستطيع ClawHub معرفة كيف يجب تثبيت الحزمة أو تحديثها.

- املأ `openclaw.install` بمصدر التثبيت المدعوم، مثل
  `clawhubSpec` أو `npmSpec` أو `localPath`.
- عيّن `openclaw.install.defaultChoice` عند توفر أكثر من مصدر تثبيت واحد.
- استخدم `openclaw.install.minHostVersion` للحد الأدنى من إصدار مضيف OpenClaw.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

لا تصرّح الحزمة بنطاق واجهة Plugin البرمجية في OpenClaw الذي تدعمه.

- أضف `openclaw.compat.pluginApi` إلى `package.json`.
- استخدم إصدار واجهة Plugin البرمجية في OpenClaw أو حد semver الأدنى الذي بنيت واختبرت
  عليه.
- أبقِ هذا منفصلًا عن إصدار الحزمة. يصف إصدار الحزمة
  إصدار Plugin؛ بينما يصف `openclaw.compat.pluginApi` عقد واجهة برمجة تطبيقات المضيف.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

لا يطابق الحد الأدنى لإصدار المضيف في الحزمة بيانات تعريف إصدار OpenClaw
الذي بُنيت الحزمة عليه.

- تحقق من `openclaw.install.minHostVersion`.
- تحقق من أي بيانات تعريف بناء OpenClaw في الحزمة، مثل إصدار OpenClaw
  المستخدم أثناء الإصدار.
- وائم الحد الأدنى لإصدار المضيف مع نطاق إصدار المضيف الذي تدعمه الحزمة
  فعليًا.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

إصدار الحزمة وإصدار بيان Plugin غير متوافقين.

- فضّل `package.json#version` كإصدار نشر الحزمة.
- إذا كان `openclaw.plugin.json` يحتوي أيضًا على `version`، فحدّثه ليتطابق أو أزل
  بيانات تعريف إصدار البيان القديمة عندما تكون بيانات تعريف الحزمة هي المرجع.
- انشر إصدار حزمة جديدًا بعد تغيير بيانات التعريف المنشورة.
- راجع [بيان Plugin](/ar/plugins/manifest).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

تحتوي كتلة `package.json#openclaw` على حقول ليست مدعومة
كبيانات تعريف حزمة OpenClaw.

- أزل الحقول غير المدعومة مثل `openclaw.bundle`.
- أبقِ بيانات تعريف Plugin الأصلية في `openclaw.plugin.json`.
- أبقِ نقاط دخول الحزمة، والتوافق، والتثبيت، والإعداد، وبيانات تعريف الفهرس
  في حقول `package.json#openclaw` المدعومة.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## الأثر المنشور

### package-npm-pack-unavailable

لا يمكن حزم الحزمة في الأثر الذي سيفحصه ClawHub أو
ينشره.

- شغّل `npm pack --dry-run` من جذر الحزمة.
- أصلح بيانات تعريف الحزمة غير الصالحة، أو سكربتات دورة الحياة المعطلة، أو إدخالات الملفات التي
  تجعل الحزم يفشل.
- أزل `private: true` إذا كانت هذه الحزمة مخصصة للنشر العام.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

يمكن حزم الحزمة، لكن الأثر المحزوم لا يتضمن
ملفات نقاط الدخول المصرح بها في `package.json#openclaw`.

- شغّل `npm pack --dry-run` وافحص الملفات التي ستُضمّن.
- ابنِ نقاط الدخول المولّدة قبل الحزم.
- حدّث `files` أو `.npmignore` أو مخرجات البناء بحيث تُضمّن نقاط الدخول
  المصرح بها.
- راجع [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

يفتقد الأثر المحزوم بيانات تعريف OpenClaw الموجودة في حزمة
المصدر لديك.

- شغّل `npm pack --dry-run` وافحص ملفات بيانات التعريف المضمّنة.
- تأكد من أن `package.json` يتضمن كتلة `openclaw` في الأثر المحزوم.
- تأكد من تضمين `openclaw.plugin.json` عندما تكون الحزمة Plugin أصلية
  من OpenClaw.
- حدّث `files` أو `.npmignore` حتى لا تُستبعد بيانات تعريف الحزمة.
- راجع [بناء Plugins](/ar/plugins/building-plugins).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## بيانات تعريف البيان

### manifest-name-missing

لا يتضمن بيان Plugin الأصلي اسم عرض.

- أضف حقل `name` غير فارغ إلى `openclaw.plugin.json`.
- اجعل `name` سهل القراءة للبشر، واجعل `id` معرّف الجهاز المستقر.
- راجع [بيان Plugin](/ar/plugins/manifest).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

يحتوي بيان Plugin على حقول في المستوى الأعلى لا يدعمها OpenClaw.

- قارِن كل حقل في المستوى الأعلى مع
  [مرجع حقول البيان](/ar/plugins/manifest#top-level-field-reference).
- أزِل الحقول المخصصة من `openclaw.plugin.json`.
- انقل بيانات الحزمة أو التثبيت الوصفية إلى حقول `package.json#openclaw`
  المدعومة بدلا من البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

يعلن البيان عن مفاتيح غير مدعومة داخل `contracts`.

- قارِن كل مفتاح ضمن `contracts` مع
  [مرجع العقود](/ar/plugins/manifest#contracts-reference).
- أزِل مفاتيح العقود غير المدعومة.
- انقل سلوك وقت التشغيل إلى كود تسجيل Plugin، وأبقِ `contracts`
  مقتصرة على بيانات وصفية ثابتة لملكية القدرات.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## SDK وترحيل التوافق

### legacy-root-sdk-import

يستورد Plugin من برميل SDK الجذري المهمل:
`openclaw/plugin-sdk`.

- استبدل استيرادات البرميل الجذري باستيرادات مسارات فرعية عامة ومركزة.
- استخدم `openclaw/plugin-sdk/plugin-entry` لـ `definePluginEntry`.
- استخدم `openclaw/plugin-sdk/channel-core` لمساعدات مدخل القناة.
- استخدم [اصطلاحات الاستيراد](/ar/plugins/building-plugins#import-conventions) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths) للعثور على الاستيراد الضيق.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

يستورد Plugin مسار SDK محجوزا للـ plugins المجمعة أو للتوافق
الداخلي.

- استبدل استيرادات SDK الداخلية المحجوزة في OpenClaw بمسارات فرعية عامة موثقة
  من `openclaw/plugin-sdk/*`.
- إذا لم يكن للسلوك SDK عام، فأبقِ المساعد داخل حزمتك أو
  اطلب API عاما من OpenClaw.
- استخدم [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths) و
  [ترحيل SDK](/ar/plugins/sdk-migration) لاختيار استيراد مدعوم.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

لا يزال Plugin يستخدم مساعد مخزن الجلسة الكامل المهمل
`loadSessionStore`.

- استخدم `getSessionEntry(...)` أو `listSessionEntries(...)` عند قراءة حالة
  الجلسة.
- استخدم `patchSessionEntry(...)` أو `upsertSessionEntry(...)` عند كتابة حالة
  الجلسة.
- تجنب تحميل كائن مخزن الجلسة الكامل وتعديله وحفظه.
- أبقِ `loadSessionStore(...)` فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

لا يزال Plugin يستخدم مساعد كتابة مهمل لمخزن الجلسة الكامل مثل
`saveSessionStore` أو `updateSessionStore`.

- استخدم `patchSessionEntry(...)` عند تحديث الحقول في إدخال جلسة موجود.
- استخدم `upsertSessionEntry(...)` عند استبدال إدخال جلسة أو إنشائه.
- تجنب تحميل كائن مخزن الجلسة الكامل وتعديله وحفظه.
- أبقِ مساعدات الكتابة للمخزن الكامل فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبها.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

لا يزال Plugin يستخدم مساعدات مسار ملف الجلسة المهملة مثل
`resolveSessionFilePath` أو `resolveAndPersistSessionFile`.

- استخدم `getSessionEntry(...)` لقراءة بيانات الجلسة الوصفية حسب هوية الوكيل
  والجلسة.
- استخدم `patchSessionEntry(...)` أو `upsertSessionEntry(...)` لحفظ بيانات
  الجلسة الوصفية.
- استخدم هوية النص أو مساعدات الهدف عندما يكون الكود يحضر
  عملية نص.
- لا تحفظ مسارات ملفات النصوص القديمة أو تعتمد عليها.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

لا يزال Plugin يستخدم مساعد هدف ملف النص المهمل
`resolveSessionTranscriptLegacyFileTarget`.

- استخدم `resolveSessionTranscriptIdentity(...)` عندما يحتاج الكود فقط إلى هوية
  الجلسة العامة.
- استخدم `resolveSessionTranscriptTarget(...)` عندما يحتاج الكود إلى هدف عملية
  نص منظمة.
- تجنب قراءة أهداف ملفات النصوص القديمة أو إنشائها مباشرة.
- أبقِ المساعد القديم فقط ما دام نطاق التوافق المعلن لديك لا يزال
  يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

لا يزال Plugin يستخدم مساعدات نصوص منخفضة المستوى ومهملة مثل
`appendSessionTranscriptMessage` أو `emitSessionTranscriptUpdate`.

- استخدم `appendSessionTranscriptMessageByIdentity(...)` لإلحاقات النص.
- استخدم `publishSessionTranscriptUpdateByIdentity(...)` لإشعارات تحديث النص.
- فضّل سطح وقت تشغيل النص المنظم حتى يتمكن OpenClaw من تطبيق
  حدود المعاملات الصحيحة ومعالجة الهوية.
- أبقِ مساعدات النص منخفضة المستوى فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبها.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

لا يزال Plugin يستخدم الخطاف القديم `before_agent_start`.

- انقل عمل تجاوز النموذج أو الموفر إلى `before_model_resolve`.
- انقل عمل تعديل الموجه أو السياق إلى `before_prompt_build`.
- أبقِ `before_agent_start` فقط ما دام نطاق التوافق المعلن لديك لا يزال
  يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [الخطافات](/ar/plugins/hooks) و
  [توافق Plugin](/ar/plugins/compatibility).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

لا يزال البيان يستخدم بيانات مصادقة الموفر الوصفية القديمة `providerAuthEnvVars`.

- اعكس بيانات متغيرات بيئة الموفر الوصفية في `setup.providers[].envVars`.
- أبقِ `providerAuthEnvVars` فقط كبيانات وصفية للتوافق ما دام نطاق
  OpenClaw المدعوم لديك لا يزال يحتاج إليها.
- راجع [مرجع الإعداد](/ar/plugins/manifest#setup-reference) و
  [ترحيل SDK](/ar/plugins/sdk-migration).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### channel-env-vars

يستخدم البيان بيانات وصفية قديمة أو أقدم لمتغيرات بيئة القناة من دون بيانات
الإعداد أو التكوين الوصفية الحالية التي يتوقعها ClawHub.

- أبقِ بيانات متغيرات بيئة القناة الوصفية تعريفية حتى يتمكن OpenClaw من فحص حالة الإعداد
  من دون تحميل وقت تشغيل القناة.
- اعكس إعداد القناة المعتمد على البيئة في بيانات الإعداد أو تكوين القناة أو
  بيانات القناة الوصفية للحزمة الحالية المستخدمة في شكل Plugin لديك.
- أبقِ `channelEnvVars` فقط كبيانات وصفية للتوافق ما دامت إصدارات
  OpenClaw الأقدم المدعومة لا تزال تتطلبها.
- راجع [بيان Plugin](/ar/plugins/manifest) و
  [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## بيان الأمان

### security-manifest-schema-unavailable

تشحن الحزمة `openclaw.security.json` مع مرجع مخطط لا يتعرف عليه ClawHub
على أنه متاح.

- أزِل URL المخطط إذا كان إرشاديا فقط.
- استخدم مخططا موثقا ذا إصدار فقط بعد أن ينشر OpenClaw واحدا.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

تشحن الحزمة ملف بيان أمان غير مدعوم.

- أزِل `openclaw.security.json` حتى يوثق OpenClaw مخطط بيان أمان
  ذا إصدار وسلوك ClawHub.
- أبقِ السلوك الحساس أمنيا موثقا في وثائق حزمتك العامة أو
  README حتى يوجد عقد البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## ذات صلة

- [ClawHub CLI](/ar/clawhub/cli)
- [النشر عبر ClawHub](/ar/clawhub/publishing)
- [بناء plugins](/ar/plugins/building-plugins)
- [بيان Plugin](/ar/plugins/manifest)
- [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints)
- [توافق Plugin](/ar/plugins/compatibility)
