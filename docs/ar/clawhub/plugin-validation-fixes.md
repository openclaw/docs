---
read_when:
    - لقد شغّلت clawhub package validate وتحتاج إلى إصلاح نتائج Plugin
    - رفض ClawHub نشر حزمة Plugin أو أصدر تحذيرًا بشأنها
    - أنت تحدّث بيانات تعريف حزمة Plugin قبل الإصدار
summary: إصلاح نتائج التحقق من حزمة Plugin في ClawHub قبل النشر
title: إصلاحات التحقق من صحة Plugin
x-i18n:
    generated_at: "2026-06-28T06:02:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# إصلاحات التحقق من Plugin

يتحقق ClawHub من حزم Plugin قبل النشر، ويمكنه أيضًا عرض النتائج من
عمليات فحص الحزم المؤتمتة. تتناول هذه الصفحة النتائج الموجهة للمؤلفين، أي
النتائج التي يمكن لمؤلف Plugin إصلاحها في بيانات الحزمة الوصفية، أو البيان، أو
استيرادات SDK، أو الأثر المنشور.

لا تتناول نتائج تغطية Plugin Inspector الداخلية. إذا كان التقرير الكامل
يتضمن رموز صيانة للماسح من دون إرشادات معالجة للمؤلف، فهي مخصصة لمشرفي
OpenClaw بدلًا من مؤلفي Plugin.

بعد تطبيق أي إصلاح، أعد تشغيل:

```bash
clawhub package validate <path-to-plugin>
```

## النتائج الموجهة للمؤلفين

| الرمز                                    | ابدأ من هنا                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [أضف بيانات الحزمة الوصفية](/ar/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [أضف كتلة openclaw إلى الحزمة](/ar/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [أعلن نقاط دخول حزمة OpenClaw](/ar/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [انشر نقطة الدخول المعلنة](/ar/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [أكمل بيانات التثبيت الوصفية](/ar/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [أعلن توافق API الخاص بـ Plugin](/ar/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [واءم الحد الأدنى لإصدار المضيف](/ar/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [واءم إصداري الحزمة والبيان](/ar/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [أزل بيانات حزمة OpenClaw الوصفية غير المدعومة](/ar/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [اجعل أثر npm قابلًا للتحزيم](/ar/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [ضمّن نقاط الدخول في مخرجات حزمة npm](/ar/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [ضمّن البيانات الوصفية في مخرجات حزمة npm](/ar/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [أضف اسم عرض للبيان](/ar/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [أزل حقول البيان غير المدعومة](/ar/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [أزل مفاتيح العقود غير المدعومة](/ar/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [استبدل استيرادات SDK الجذرية](/ar/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [أزل استيرادات SDK المحجوزة](/ar/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [استبدل الوصول إلى مخزن الجلسة بالكامل](/ar/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [استبدل before_agent_start](/ar/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [انقل متغيرات بيئة الموفر إلى بيانات الإعداد الوصفية](/ar/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [اعكس متغيرات بيئة القناة في البيانات الوصفية الحالية](/ar/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [أزل مراجع مخطط بيان الأمان غير المتاحة](/ar/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [أزل ملفات بيان الأمان غير المدعومة](/ar/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## بيانات الحزمة الوصفية

### package-json-missing

لا يتضمن جذر الحزمة `package.json`، لذلك لا يستطيع ClawHub تحديد حزمة
npm أو الإصدار أو نقاط الدخول أو بيانات OpenClaw الوصفية.

- أضف `package.json` مع `name` و`version` و`type`.
- أضف كتلة `openclaw` عندما تشحن الحزمة Plugin لـ OpenClaw.
- استخدم [بناء Plugins](/ar/plugins/building-plugins) للحصول على مثال حزمة
  بسيط و[بيان Plugin](/ar/plugins/manifest#manifest-versus-packagejson)
  لفصل الحزمة عن البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

تحتوي الحزمة على `package.json`، لكنها لا تعلن بيانات حزمة OpenClaw
الوصفية.

- أضف `package.json#openclaw`.
- ضمّن بيانات وصفية لنقاط الدخول مثل `openclaw.extensions` أو
  `openclaw.runtimeExtensions`.
- أضف بيانات التوافق والتثبيت الوصفية عندما ستُنشر الحزمة أو
  تُثبّت عبر ClawHub.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

بيانات الحزمة الوصفية موجودة، لكنها لا تعلن نقطة دخول تشغيلية لـ OpenClaw.

- أضف `openclaw.extensions` لنقاط دخول Plugin الأصلية.
- أضف `openclaw.runtimeExtensions` عندما يجب أن تحمّل الحزمة المنشورة
  JavaScript مبنيًا.
- أبقِ كل مسارات نقاط الدخول داخل دليل الحزمة.
- راجع [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints) و
  [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

تعلن الحزمة نقطة دخول لـ OpenClaw، لكن الملف المشار إليه مفقود
من الحزمة التي يتم التحقق منها.

- تحقق من كل مسار في `openclaw.extensions` و`openclaw.runtimeExtensions`
  و`openclaw.setupEntry` و`openclaw.runtimeSetupEntry`.
- ابنِ الحزمة إذا كانت نقطة الدخول تُنشأ داخل `dist`.
- حدّث البيانات الوصفية إذا انتقلت نقطة الدخول.
- راجع [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

لا يستطيع ClawHub معرفة كيف يجب تثبيت الحزمة أو تحديثها.

- املأ `openclaw.install` بمصدر التثبيت المدعوم، مثل
  `clawhubSpec` أو `npmSpec` أو `localPath`.
- عيّن `openclaw.install.defaultChoice` عندما يتوفر أكثر من مصدر تثبيت واحد.
- استخدم `openclaw.install.minHostVersion` للحد الأدنى لإصدار مضيف OpenClaw.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

لا تعلن الحزمة نطاق API الخاص بـ Plugin في OpenClaw الذي تدعمه.

- أضف `openclaw.compat.pluginApi` إلى `package.json`.
- استخدم إصدار API الخاص بـ Plugin في OpenClaw أو حد semver الأدنى الذي بنيت واختبرت
  وفقًا له.
- أبقِ هذا منفصلًا عن إصدار الحزمة. يصف إصدار الحزمة
  إصدار Plugin؛ أما `openclaw.compat.pluginApi` فيصف عقد API للمضيف.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

لا يطابق الحد الأدنى لإصدار المضيف في الحزمة بيانات إصدار OpenClaw الوصفية
التي بُنيت الحزمة وفقًا لها.

- تحقق من `openclaw.install.minHostVersion`.
- تحقق من أي بيانات بناء وصفية لـ OpenClaw في الحزمة، مثل إصدار OpenClaw
  المستخدم أثناء الإصدار.
- وائم الحد الأدنى لإصدار المضيف مع نطاق إصدار المضيف الذي تدعمه الحزمة
  فعليًا.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

إصدار الحزمة وإصدار بيان Plugin غير متفقين.

- فضّل `package.json#version` كإصدار نشر الحزمة.
- إذا كان `openclaw.plugin.json` يحتوي أيضًا على `version`، فحدّثه ليطابق أو أزل
  بيانات إصدار البيان الوصفية القديمة عندما تكون بيانات الحزمة الوصفية هي المرجع.
- انشر إصدار حزمة جديدًا بعد تغيير البيانات الوصفية المنشورة.
- راجع [بيان Plugin](/ar/plugins/manifest).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

تحتوي كتلة `package.json#openclaw` على حقول غير مدعومة
كبيانات وصفية لحزمة OpenClaw.

- أزل الحقول غير المدعومة مثل `openclaw.bundle`.
- أبقِ بيانات Plugin الأصلية الوصفية في `openclaw.plugin.json`.
- أبقِ نقاط دخول الحزمة، والتوافق، والتثبيت، والإعداد، وبيانات الفهرس الوصفية
  في حقول `package.json#openclaw` المدعومة.
- راجع [حقول package.json التي تؤثر في الاكتشاف](/ar/plugins/manifest#packagejson-fields-that-affect-discovery).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## الأثر المنشور

### package-npm-pack-unavailable

لا يمكن تحزيم الحزمة في الأثر الذي سيفحصه ClawHub أو
ينشره.

- شغّل `npm pack --dry-run` من جذر الحزمة.
- أصلح بيانات الحزمة الوصفية غير الصالحة، أو سكربتات دورة الحياة المعطلة، أو مدخلات files التي
  تجعل التحزيم يفشل.
- أزل `private: true` إذا كانت هذه الحزمة مخصصة للنشر العام.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

يمكن تحزيم الحزمة، لكن الأثر المحزم لا يتضمن
ملفات نقاط الدخول المعلنة في `package.json#openclaw`.

- شغّل `npm pack --dry-run` وافحص الملفات التي ستُضمّن.
- ابنِ نقاط الدخول المولدة قبل التحزيم.
- حدّث `files` أو `.npmignore` أو مخرجات البناء بحيث تُضمّن نقاط الدخول
  المعلنة.
- راجع [نقاط دخول Plugin](/ar/plugins/sdk-entrypoints).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

يفتقد الأثر المحزم بيانات OpenClaw الوصفية الموجودة في حزمة المصدر
لديك.

- شغّل `npm pack --dry-run` وافحص ملفات البيانات الوصفية المضمّنة.
- تأكد من أن `package.json` يتضمن كتلة `openclaw` في الأثر المحزم.
- تأكد من تضمين `openclaw.plugin.json` عندما تكون الحزمة Plugin أصلية
  لـ OpenClaw.
- حدّث `files` أو `.npmignore` حتى لا تُستبعد بيانات الحزمة الوصفية.
- راجع [بناء Plugins](/ar/plugins/building-plugins).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## بيانات البيان الوصفية

### manifest-name-missing

لا يتضمن بيان Plugin الأصلي اسم عرض.

- أضف حقل `name` غير فارغ إلى `openclaw.plugin.json`.
- أبقِ `name` مقروءًا للبشر وأبقِ `id` كمعرّف آلي ثابت.
- راجع [بيان Plugin](/ar/plugins/manifest).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

يحتوي بيان Plugin على حقول عليا لا يدعمها OpenClaw.

- قارِن كل حقل من المستوى الأعلى مع
  [مرجع حقول البيان](/ar/plugins/manifest#top-level-field-reference).
- أزِل الحقول المخصصة من `openclaw.plugin.json`.
- انقل بيانات الحزمة أو التثبيت الوصفية إلى حقول `package.json#openclaw`
  المدعومة بدلًا من البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

يُعلن البيان عن مفاتيح غير مدعومة داخل `contracts`.

- قارِن كل مفتاح ضمن `contracts` مع
  [مرجع العقود](/ar/plugins/manifest#contracts-reference).
- أزِل مفاتيح العقود غير المدعومة.
- انقل سلوك وقت التشغيل إلى كود تسجيل Plugin، واجعل `contracts`
  مقتصرًا على بيانات ملكية القدرات الوصفية الثابتة.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## ترحيل SDK والتوافق

### legacy-root-sdk-import

يستورد Plugin من حزمة SDK الجذرية المهملة:
`openclaw/plugin-sdk`.

- استبدل الاستيرادات من الحزمة الجذرية باستيرادات من مسارات فرعية عامة ومركزة.
- استخدم `openclaw/plugin-sdk/plugin-entry` من أجل `definePluginEntry`.
- استخدم `openclaw/plugin-sdk/channel-core` من أجل مساعدات نقطة إدخال القناة.
- استخدم [اصطلاحات الاستيراد](/ar/plugins/building-plugins#import-conventions) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths) للعثور على الاستيراد الضيق.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

يستورد Plugin مسار SDK محجوزًا لـ Plugins المضمنة أو التوافق
الداخلي.

- استبدل استيرادات SDK الداخلية المحجوزة في OpenClaw بمسارات فرعية عامة
  موثقة من `openclaw/plugin-sdk/*`.
- إذا لم يكن للسلوك SDK عام، فأبقِ المساعد داخل حزمتك أو
  اطلب API عامًا من OpenClaw.
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
- تجنّب تحميل كائن مخزن الجلسة الكامل وتعديله وحفظه.
- أبقِ `loadSessionStore(...)` فقط ما دام نطاق التوافق المعلن لديك
  لا يزال يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [API وقت التشغيل](/ar/plugins/sdk-runtime#agent-session-state) و
  [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

لا يزال Plugin يستخدم الخطاف القديم `before_agent_start`.

- انقل عمل تجاوز النموذج أو المزوّد إلى `before_model_resolve`.
- انقل عمل تعديل الموجه أو السياق إلى `before_prompt_build`.
- أبقِ `before_agent_start` فقط ما دام نطاق التوافق المعلن لديك لا يزال
  يدعم إصدارات OpenClaw الأقدم التي تتطلبه.
- راجع [الخطافات](/ar/plugins/hooks) و
  [توافق Plugin](/ar/plugins/compatibility).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

لا يزال البيان يستخدم بيانات تعريف مصادقة المزوّد القديمة `providerAuthEnvVars`.

- انسخ بيانات تعريف متغيرات بيئة المزوّد إلى `setup.providers[].envVars`.
- أبقِ `providerAuthEnvVars` فقط كبيانات تعريف للتوافق ما دام نطاق
  OpenClaw المدعوم لديك لا يزال يحتاج إليه.
- راجع [مرجع الإعداد](/ar/plugins/manifest#setup-reference) و
  [ترحيل SDK](/ar/plugins/sdk-migration).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### channel-env-vars

يستخدم البيان بيانات تعريف قديمة أو أقدم لمتغيرات بيئة القناة بدون بيانات
الإعداد أو التكوين الوصفية الحالية التي يتوقعها ClawHub.

- أبقِ بيانات تعريف متغيرات بيئة القناة تصريحية حتى يتمكن OpenClaw من فحص حالة الإعداد
  بدون تحميل وقت تشغيل القناة.
- انسخ إعداد القناة المدفوع بمتغيرات البيئة إلى بيانات الإعداد أو تكوين القناة أو
  بيانات القناة الوصفية في الحزمة الحالية المستخدمة حسب بنية Plugin لديك.
- أبقِ `channelEnvVars` فقط كبيانات تعريف للتوافق ما دامت إصدارات
  OpenClaw الأقدم المدعومة لا تزال تتطلبه.
- راجع [بيان Plugin](/ar/plugins/manifest) و
  [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## بيان الأمان

### security-manifest-schema-unavailable

تتضمن الحزمة `openclaw.security.json` مع مرجع مخطط لا يتعرف عليه ClawHub
على أنه متاح.

- أزِل عنوان URL للمخطط إذا كان إرشاديًا فقط.
- استخدم مخططًا موثقًا بإصدار فقط بعد أن ينشر OpenClaw واحدًا.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

تتضمن الحزمة ملف بيان أمان غير مدعوم.

- أزِل `openclaw.security.json` إلى أن يوثق OpenClaw مخطط بيان أمان
  بإصدار وسلوك ClawHub.
- أبقِ السلوك الحساس أمنيًا موثقًا في مستندات حزمتك العامة أو
  README إلى أن يوجد عقد البيان.
- أعد تشغيل `clawhub package validate <path-to-plugin>`.

## ذو صلة

- [ClawHub CLI](/ar/clawhub/cli)
- [نشر ClawHub](/ar/clawhub/publishing)
- [بناء Plugins](/ar/plugins/building-plugins)
- [بيان Plugin](/ar/plugins/manifest)
- [نقاط إدخال Plugin](/ar/plugins/sdk-entrypoints)
- [توافق Plugin](/ar/plugins/compatibility)
