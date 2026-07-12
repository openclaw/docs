---
doc-schema-version: 1
read_when:
    - تثبيت الإضافات أو تهيئتها
    - فهم قواعد اكتشاف الإضافات وتحميلها
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Getting Started
summary: ثبّت Plugins الخاصة بـ OpenClaw وهيّئها وأدِرها
title: الإضافات
x-i18n:
    generated_at: "2026-07-12T06:37:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw من خلال القنوات، وموفّري النماذج، وأطر تشغيل الوكلاء، والأدوات،
وSkills، والكلام، والنسخ الفوري، والصوت، وفهم الوسائط، والتوليد،
وجلب محتوى الويب، والبحث في الويب، وقدرات وقت التشغيل الأخرى.

استخدم هذه الصفحة لتثبيت Plugin، وإعادة تشغيل Gateway، والتحقق من أن وقت التشغيل
قد حمّله، ومعالجة إخفاقات الإعداد الشائعة. للحصول على أمثلة مقتصرة على الأوامر، راجع
[إدارة Plugins](/ar/plugins/manage-plugins). وللاطلاع على القائمة المُنشأة
للـ Plugins المضمّنة، والخارجية الرسمية، والمتاحة كمصدر فقط، راجع
[قائمة Plugins](/ar/plugins/plugin-inventory).

## المتطلبات

- نسخة عمل أو تثبيت من OpenClaw تتوفر فيه CLI ‏`openclaw`
- وصول إلى الشبكة للمصدر المحدد (ClawHub أو npm أو مضيف git)
- أي بيانات اعتماد أو مفاتيح إعداد أو أدوات لنظام التشغيل خاصة بالـ Plugin ومذكورة في
  وثائق إعداد ذلك الـ Plugin
- إذن يسمح بإعادة تحميل أو إعادة تشغيل Gateway الذي يخدم قنواتك

## البدء السريع

<Steps>
  <Step title="العثور على Plugin">
    ابحث في [ClawHub](/clawhub) عن حزم Plugins العامة:

    ```bash
    openclaw plugins search "calendar"
    ```

    يُعد ClawHub الواجهة الأساسية لاكتشاف Plugins الخاصة بالمجتمع. أثناء
    الانتقال عند الإطلاق، تظل مواصفات الحزم العادية المجرّدة تُثبَّت من npm ما لم
    تطابق معرّف Plugin رسميًا. وتُحل مواصفات `@openclaw/*` الخام التي تطابق
    Plugin مضمّنًا إلى نسخته المضمّنة. استخدم بادئة مصدر صريحة
    عندما تحتاج إلى مصدر محدد بعينه.

  </Step>

  <Step title="تثبيت Plugin">
    ```bash
    # من ClawHub.
    openclaw plugins install clawhub:<package>

    # من npm.
    openclaw plugins install npm:<package>

    # من git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # من نسخة عمل تطوير محلية.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    تعامل مع تثبيت Plugins كما تتعامل مع تشغيل التعليمات البرمجية. فضّل الإصدارات المثبّتة
    لضمان تثبيتات إنتاج قابلة لإعادة التنفيذ.

  </Step>

  <Step title="إعداده وتمكينه">
    اضبط الإعدادات الخاصة بالـ Plugin ضمن `plugins.entries.<id>.config`.
    مكّن Plugin إذا لم يكن ممكّنًا بالفعل:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    إذا كانت `plugins.allow` معيّنة، فيجب أن يكون معرّف Plugin المثبّت ضمن تلك القائمة
    قبل أن يتمكن Plugin من التحميل. يضيف `openclaw plugins install` المعرّف
    المثبّت إلى قائمة `plugins.allow` الحالية، ويزيل المعرّف نفسه من
    `plugins.deny` حتى يمكن تحميل التثبيت الصريح بعد إعادة التشغيل.

  </Step>

  <Step title="السماح لـ Gateway بإعادة التحميل">
    يتطلب تثبيت تعليمات Plugin البرمجية أو تحديثها أو إلغاء تثبيتها إعادة تشغيل Gateway.
    يكتشف Gateway المُدار، عند تمكين إعادة تحميل الإعداد، تغيير
    سجل تثبيت Plugin ويُعيد التشغيل تلقائيًا. وإلا فأعد تشغيله
    بنفسك:

    ```bash
    openclaw gateway restart
    ```

    يؤدي التمكين أو التعطيل إلى تحديث الإعداد والسجل غير النشط. ويظل فحص وقت التشغيل
    أوضح دليل على واجهات وقت التشغيل النشطة.

  </Step>

  <Step title="التحقق من التسجيل في وقت التشغيل">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    استخدم `--runtime` لإثبات تسجيل الأدوات، والخطافات، والخدمات، وأساليب Gateway،
    أو أوامر CLI التي يملكها Plugin. أما `inspect` العادي فهو مجرد فحص غير نشط
    للبيان والسجل.

  </Step>
</Steps>

## الإعداد

### اختيار مصدر التثبيت

| المصدر      | يُستخدم عندما                                                                       | المثال                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | تريد اكتشافًا أصيلًا في OpenClaw، وعمليات فحص، وبيانات وصفية للإصدارات، وتلميحات للتثبيت | `openclaw plugins install clawhub:<package>`                   |
| npm         | تحتاج إلى سير عمل مباشر لسجل npm أو لوسوم التوزيع                             | `openclaw plugins install npm:<package>`                       |
| git         | تحتاج إلى فرع أو وسم أو تثبيت من مستودع                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| مسار محلي  | تطوّر Plugin أو تختبره على الجهاز نفسه                     | `openclaw plugins install --link ./my-plugin`                  |
| سوق | تثبّت Plugin لسوق متوافق مع Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

تتمتع مواصفات الحزم المجرّدة بسلوك توافق خاص: فالاسم المجرّد الذي
يطابق معرّف Plugin مضمّنًا يستخدم ذلك المصدر المضمّن؛ والاسم المجرّد الذي يطابق
معرّف Plugin خارجيًا رسميًا يستخدم دليل الحزم الرسمي؛ وأي
مواصفة مجرّدة أخرى تُثبَّت عبر npm أثناء الانتقال عند الإطلاق. كما تُحل مواصفات `@openclaw/*`
الخام التي تطابق Plugins مضمّنة إلى النسخة المضمّنة قبل
الرجوع إلى npm. استخدم `npm:@openclaw/<plugin>@<version>` لتثبيت
حزمة npm الخارجية عمدًا بدلًا من النسخة المضمّنة. استخدم `clawhub:` أو `npm:` أو
`git:` أو `npm-pack:` لاختيار المصدر بصورة حتمية. راجع
[`openclaw plugins`](/ar/cli/plugins#install) للاطلاع على عقد الأمر الكامل.

بالنسبة إلى تثبيتات npm، تختار المواصفات غير المثبّتة و`@latest` أحدث
حزمة مستقرة تعلن توافقها مع بنية OpenClaw هذه. إذا كان
أحدث إصدار حالي في npm يعلن `openclaw.compat.pluginApi` أحدث أو
`openclaw.install.minHostVersion` أعلى مما تدعمه هذه البنية، يفحص OpenClaw
الإصدارات المستقرة الأقدم ويثبّت أحدث إصدار ملائم. تظل الإصدارات الدقيقة
ووسوم القنوات الصريحة مثل `@beta` مثبّتة على الحزمة المحددة
وتفشل عند عدم التوافق.

### سياسة تثبيت المشغّل

اضبط `security.installPolicy` لتشغيل أمر سياسة محلي موثوق
قبل متابعة تثبيت Plugin أو تحديثه. تتلقى السياسة البيانات الوصفية بالإضافة إلى
مسار المصدر المرحلي، ويمكنها السماح بالتثبيت أو حظره. وهي تغطي مسارات
التثبيت والتحديث المستندة إلى CLI وGateway معًا. تعمل خطافات Plugin ‏`before_install`
لاحقًا، وفقط داخل عمليات OpenClaw التي تُحمّل فيها خطافات Plugin، لذا استخدم
`security.installPolicy` بدلًا منها لقرارات التثبيت التي يملكها المشغّل. يُقبل
العَلَم المتقادم `--dangerously-force-unsafe-install` لأغراض
التوافق، لكنه لا ينفّذ أي إجراء: فهو لا يتجاوز سياسة التثبيت ولا قائمة
رفض تبعيات Plugins المضمّنة في OpenClaw.

راجع [إعداد Skills](/ar/tools/skills-config#operator-install-policy-securityinstallpolicy)
للاطلاع على مخطط تنفيذ `security.installPolicy` المشترك الذي تستخدمه Skills
وPlugins.

### إعداد سياسة Plugins

الشكل الشائع لإعداد Plugins هو:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

قواعد السياسة الأساسية:

- تعطّل `plugins.enabled: false` جميع Plugins وتتخطى أعمال الاكتشاف والتحميل.
  وتظل مراجع Plugins القديمة خاملة ما دام هذا الخيار نشطًا؛ أعد تمكين
  Plugins قبل تشغيل تنظيف doctor إذا أردت إزالة المعرّفات القديمة.
- تتغلب `plugins.deny` على السماح والتمكين لكل Plugin.
- تمثل `plugins.allow` قائمة سماح حصرية. وتظل الأدوات التي تملكها Plugins خارج
  قائمة السماح غير متاحة حتى عندما تتضمن `tools.allow` القيمة `"*"`.
- تعطّل `plugins.entries.<id>.enabled: false` Plugin واحدًا مع الاحتفاظ
  بإعداده.
- تضيف `plugins.load.paths` ملفات أو أدلة Plugins محلية صريحة.
  يجب أن تكون المسارات المحلية المُدارة عبر `plugins install` أدلة Plugins أو
  أرشيفات؛ استخدم `plugins.load.paths` لملفات Plugins المستقلة.
- تكون Plugins الناشئة من مساحة العمل معطّلة افتراضيًا؛ مكّنها صراحةً أو
  أضفها إلى قائمة السماح قبل استخدام تعليمات مساحة العمل المحلية.
- تتبع Plugins المضمّنة بياناتها الوصفية الداخلية للتشغيل أو الإيقاف الافتراضي
  ما لم يتجاوزها الإعداد صراحةً.
- يختار `plugins.slots.<slot>` ‏(`memory` أو `contextEngine`) Plugin واحدًا لفئة
  حصرية. ويُعد اختيار الفتحة تنشيطًا صريحًا ويُجبر على تمكين
  Plugin المحدد لتلك الفتحة، حتى لو كان يتطلب الاشتراك عادةً.
  ومع ذلك تظل `plugins.deny` و`plugins.entries.<id>.enabled: false`
  تمنعانه.
- يمكن تنشيط Plugins المضمّنة التي تتطلب الاشتراك تلقائيًا عندما يسمّي الإعداد إحدى
  واجهاتها المملوكة، مثل مرجع موفّر أو نموذج، أو إعداد قناة، أو واجهة CLI خلفية،
  أو وقت تشغيل إطار وكيل.
- يفصل توجيه Codex ضمن عائلة OpenAI بين حدود موفّر Plugin وPlugin وقت التشغيل:
  فمراجع نماذج Codex القديمة هي إعدادات قديمة يصلحها doctor،
  بينما يملك Plugin ‏`codex` المضمّن وقت تشغيل خادم تطبيق Codex لمراجع الوكلاء
  القياسية `openai/*`، و`agentRuntime.id: "codex"` الصريحة،
  ومراجع `codex/*` القديمة.

عندما لا تكون `plugins.allow` معيّنة وتُكتشف Plugins غير مضمّنة تلقائيًا من
مساحة العمل أو جذور Plugins العامة، تسجل عملية بدء التشغيل
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
مع معرّفات Plugins المكتشفة، ومع مقتطف `plugins.allow` مختصر
للقوائم القصيرة. شغّل [`openclaw plugins list --enabled --verbose`](/ar/cli/plugins#list)
أو [`openclaw plugins inspect <id>`](/ar/cli/plugins#inspect) على معرّف
Plugin المدرج قبل نسخ Plugins الموثوقة إلى `openclaw.json`. ينطبق
تثبيت الثقة نفسه عندما تشير التشخيصات إلى تحميل Plugin
`without install/load-path provenance`: افحص معرّف ذلك Plugin، ثم ثبّته في
`plugins.allow` أو أعد تثبيته من مصدر موثوق حتى يسجل OpenClaw
مصدر التثبيت.

شغّل `openclaw doctor` أو `openclaw doctor --fix` عندما يُبلغ التحقق من صحة الإعداد
عن معرّفات Plugins قديمة، أو حالات عدم تطابق بين قائمة السماح والأدوات، أو مسارات Plugins
مضمّنة قديمة.

## فهم تنسيقات Plugins

يتعرف OpenClaw على تنسيقين للـ Plugins:

| التنسيق                 | كيفية تحميله                                                                 | يُستخدم عندما                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin أصلي لـ OpenClaw | ملف `openclaw.plugin.json` بالإضافة إلى وحدة وقت تشغيل تُحمّل داخل العملية               | تثبّت أو تنشئ قدرات وقت تشغيل خاصة بـ OpenClaw  |
| حزمة متوافقة      | تخطيط Plugin خاص بـ Codex أو Claude أو Cursor يُطابق مع قائمة Plugins في OpenClaw | تعيد استخدام Skills أو الأوامر أو الخطافات أو البيانات الوصفية للحزمة المتوافقة |

يظهر كلا التنسيقين في `openclaw plugins list` و`openclaw plugins inspect`
و`openclaw plugins enable` و`openclaw plugins disable`. راجع
[حزم Plugins](/ar/plugins/bundles) لمعرفة حدود توافق الحزم، و
[إنشاء Plugins](/ar/plugins/building-plugins) لمعرفة كيفية تأليف Plugin أصلي.

## خطافات Plugins

يمكن للـ Plugins تسجيل خطافات في وقت التشغيل من خلال واجهتي API مختلفتين:

- خطافات `api.on(...)` ذات الأنواع لأحداث دورة حياة وقت التشغيل. وهي
  الواجهة المفضلة للبرمجيات الوسيطة، والسياسة، وإعادة كتابة الرسائل، وتشكيل
  المطالبات، والتحكم في الأدوات.
- `api.registerHook(...)` لنظام الخطافات الداخلي الموضح في
  [الخطافات](/ar/automation/hooks). ويُستخدم هذا أساسًا للآثار الجانبية العامة للأوامر أو دورة الحياة
  وللتوافق مع الأتمتة الحالية ذات نمط HOOK.

قاعدة سريعة: إذا احتاج المعالج إلى أولوية أو دلالات دمج أو
سلوك حظر أو إلغاء، فاستخدم الخطافات ذات الأنواع. وإذا كان يتفاعل فقط مع `command:new`
أو `command:reset` أو `message:sent` أو أحداث عامة مشابهة، فإن `api.registerHook`
مناسب.

تظهر الخطافات الداخلية التي تديرها Plugins في `openclaw hooks list` بالصيغة
`plugin:<id>`. لا يمكنك تمكينها أو تعطيلها عبر `openclaw hooks`؛
بل مكّن Plugin أو عطّله بدلًا من ذلك.

## التحقق من Gateway النشط

يقرأ `openclaw plugins list` و`openclaw plugins inspect` العادي الإعداد غير النشط،
والبيان، وحالة السجل. ولا يثبتان أن Gateway قيد التشغيل بالفعل
قد استورد تعليمات Plugin البرمجية نفسها.

عندما يظهر Plugin على أنه مثبّت لكن حركة المحادثات المباشرة لا تستخدمه:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

تُعاد تشغيل مثيلات Gateway المُدارة تلقائيًا بعد تثبيت Plugin أو تحديثه أو إلغاء تثبيته عندما تغيّر هذه العمليات مصدر Plugin. في عمليات التثبيت على VPS أو حاويات، تأكد من أن أي إعادة تشغيل يدوية تستهدف العملية الفرعية الفعلية `openclaw gateway run` التي تخدم قنواتك، وليس مجرد غلاف أو مشرف عمليات.

## استكشاف الأخطاء وإصلاحها

| العَرَض                                                        | التحقق                                                                                                                                      | الإصلاح                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| يظهر Plugin في `plugins list` لكن خطافات وقت التشغيل لا تعمل  | استخدم `openclaw plugins inspect <id> --runtime --json` وتأكد من Gateway النشط باستخدام `gateway status --deep --require-rpc`             | أعد تشغيل Gateway الفعلي بعد تغييرات التثبيت أو التحديث أو الإعداد أو المصدر                               |
| تظهر تشخيصات ازدواجية ملكية القناة أو الأداة         | شغّل `openclaw plugins list --enabled --verbose`، وافحص كل Plugin مشتبه به باستخدام `--runtime --json`، وقارن ملكية القنوات/الأدوات | عطّل أحد المالكين، أو أزل عمليات التثبيت القديمة، أو استخدم `preferOver` في البيان للاستبدال المقصود      |
| يشير الإعداد إلى أن Plugin مفقود                                | راجع [مخزون Plugin](/ar/plugins/plugin-inventory) لمعرفة ما إذا كان مضمّنًا أو خارجيًا رسميًا أو متاحًا كمصدر فقط                           | ثبّت الحزمة الخارجية، أو فعّل Plugin المضمّن، أو أزل الإعداد القديم                         |
| الإعداد غير صالح أثناء التثبيت                               | اقرأ رسالة التحقق وشغّل `openclaw doctor --fix` إذا كانت تشير إلى حالة Plugin قديمة                                             | يمكن لأداة Doctor عزل إعداد Plugin غير الصالح بتعطيل الإدخال وإزالة الحمولة غير الصالحة     |
| حُظر مسار Plugin بسبب ملكية أو أذونات مريبة | افحص التشخيص الذي يسبق خطأ الإعداد                                                                                             | أصلح ملكية/أذونات نظام الملفات، ثم شغّل `openclaw plugins registry --refresh`                    |
| يمنع `OPENCLAW_NIX_MODE=1` أوامر دورة الحياة                | تأكد من أن التثبيت يُدار بواسطة Nix                                                                                                      | غيّر اختيار Plugin في مصدر Nix بدلًا من استخدام أوامر تعديل Plugin                      |
| يفشل استيراد التبعية في وقت التشغيل                             | تحقق مما إذا كان Plugin قد ثُبّت عبر npm/git/ClawHub أو حُمّل من مسار محلي                                                 | شغّل `openclaw plugins update <id>`، أو أعد تثبيت المصدر، أو ثبّت تبعيات Plugin المحلي بنفسك |

عندما يظل إعداد Plugin القديم يشير إلى Plugin قناة لم يعد قابلًا للاكتشاف، يخفض التحقق من الإعداد مفتاح تلك القناة إلى تحذير بدلًا من فشل قطعي، بحيث يظل بإمكان بدء تشغيل Gateway خدمة جميع القنوات الأخرى. شغّل `openclaw doctor --fix` لإزالة إدخالات Plugin والقناة القديمة. تظل مفاتيح القنوات غير المعروفة التي لا يوجد دليل على ارتباطها بـ Plugin قديم سببًا لفشل التحقق حتى تبقى الأخطاء الإملائية ظاهرة.

لاستبدال قناة بشكل مقصود، ينبغي أن يعلن Plugin المفضّل عن `channelConfigs.<channel-id>.preferOver` مع معرّف Plugin القديم أو الأقل أولوية. إذا كان كلا Plugin مفعّلًا صراحةً، يحتفظ OpenClaw بهذا الطلب ويبلغ عن تشخيصات ازدواجية القناة/الأداة بدلًا من اختيار مالك بصمت.

إذا أبلغت حزمة مثبتة بأنها `requires compiled runtime output for
TypeScript entry ...`، فهذا يعني أن الحزمة نُشرت دون ملفات JavaScript التي يحتاجها OpenClaw في وقت التشغيل. حدّث أو أعد التثبيت بعد أن ينشر الناشر ملفات JavaScript المترجمة، أو عطّل/ألغِ تثبيت Plugin حتى ذلك الحين.

### ملكية مسار Plugin المحظور

إذا أشارت التشخيصات إلى
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
ثم أعقبها التحقق برسالة `plugin present but blocked`، فقد وجد OpenClaw ملفات Plugin مملوكة لمستخدم Unix مختلف عن مستخدم العملية التي تحمّلها. أبقِ إعداد Plugin كما هو؛ أصلح ملكية نظام الملفات أو شغّل OpenClaw بالمستخدم نفسه الذي يملك دليل الحالة.

في عمليات تثبيت Docker، تعمل الصورة الرسمية بالمستخدم `node` (بالمعرّف uid `1000`)، لذا ينبغي عادةً أن تكون أدلة إعداد OpenClaw ومساحة العمل المربوطة من المضيف مملوكة للمعرّف uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

إذا كنت تشغّل OpenClaw عمدًا بصلاحيات root، فأصلح جذر Plugin المُدار ليكون مملوكًا للمستخدم root بدلًا من ذلك:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

بعد إصلاح الملكية، أعد تشغيل `openclaw doctor --fix` أو
`openclaw plugins registry --refresh` حتى يتطابق سجل Plugin المحفوظ مع الملفات التي أُصلحت.

### بطء إعداد أدوات Plugin

إذا بدت دورات الوكيل متوقفة أثناء تجهيز الأدوات، ففعّل تسجيل التتبع وتحقق من أسطر توقيت مصنع أدوات Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يسرد الملخص إجمالي وقت المصانع وأبطأ مصانع أدوات Plugin، بما في ذلك معرّف Plugin وأسماء الأدوات المعلنة وشكل النتيجة وما إذا كانت الأداة اختيارية. تُرفع الأسطر البطيئة إلى مستوى التحذيرات عندما يستغرق مصنع واحد ثانية واحدة على الأقل، أو يستغرق إجمالي تجهيز مصانع أدوات Plugin خمس ثوانٍ على الأقل.

يخزّن OpenClaw مؤقتًا نتائج مصانع أدوات Plugin الناجحة لعمليات الحل المتكررة ذات سياق الطلب الفعلي نفسه. يتضمن مفتاح ذاكرة التخزين المؤقت إعداد وقت التشغيل الفعلي، ومساحة العمل ومعرّف الوكيل، وسياسة صندوق العزل، وإعدادات المتصفح، وسياق التسليم، وهوية مقدم الطلب، وحالة الملكية، لذلك تُعاد تشغيل المصانع التي تعتمد على هذه الحقول الموثوقة عندما يتغير السياق. إذا ظلت التوقيتات مرتفعة، فقد ينفّذ Plugin عملًا مكلفًا قبل إعادة تعريفات أدواته.

إذا هيمن Plugin واحد على التوقيت، فافحص تسجيلاته في وقت التشغيل:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث Plugin أو أعد تثبيته أو عطّله. ينبغي لمؤلفي Plugin نقل تحميل التبعيات المكلف إلى ما وراء مسار تنفيذ الأداة بدلًا من تنفيذه داخل مصنع الأدوات.

للاطلاع على جذور التبعيات، والتحقق من بيانات تعريف الحزمة، وسجلات التسجيل، وسلوك إعادة التحميل عند بدء التشغيل، وتنظيف العناصر القديمة، راجع
[حل تبعيات Plugin](/ar/plugins/dependency-resolution).

## ذو صلة

- [إدارة Plugins](/ar/plugins/manage-plugins) - أمثلة أوامر للسرد والتثبيت والتحديث وإلغاء التثبيت والنشر
- [`openclaw plugins`](/ar/cli/plugins) - مرجع CLI الكامل
- [مخزون Plugin](/ar/plugins/plugin-inventory) - قائمة Plugins المضمّنة والخارجية المُنشأة
- [مرجع Plugin](/ar/plugins/reference) - صفحات مرجعية مُنشأة لكل Plugin
- [Plugins المجتمع](/ar/plugins/community) - الاكتشاف عبر ClawHub وسياسة طلبات سحب الوثائق
- [حل تبعيات Plugin](/ar/plugins/dependency-resolution) - جذور التثبيت وسجلات التسجيل وحدود وقت التشغيل
- [بناء Plugins](/ar/plugins/building-plugins) - دليل تأليف Plugin الأصلي
- [نظرة عامة على SDK الخاص بـ Plugin](/ar/plugins/sdk-overview) - التسجيل في وقت التشغيل والخطافات وحقول API
- [بيان Plugin](/ar/plugins/manifest) - البيان وبيانات تعريف الحزمة
