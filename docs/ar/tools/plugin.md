---
doc-schema-version: 1
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميلها
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Getting Started
summary: ثبّت Plugins الخاصة بـ OpenClaw وهيّئها وأدرها
title: Plugins
x-i18n:
    generated_at: "2026-06-27T18:44:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw عبر القنوات، وموفري النماذج، وحاويات تشغيل الوكلاء، والأدوات،
وSkills، والكلام، والنسخ الفوري، والصوت، وفهم الوسائط، والتوليد،
وجلب الويب، والبحث في الويب، وقدرات تشغيل أخرى.

استخدم هذه الصفحة عندما تريد تثبيت Plugin، وإعادة تشغيل Gateway، والتحقق
من أن بيئة التشغيل حمّلته، وتوجيه حالات فشل الإعداد الشائعة. للأمثلة المعتمدة على الأوامر فقط،
راجع [إدارة plugins](/ar/plugins/manage-plugins). وللاطلاع على المخزون الكامل المولّد
لـ plugins المضمنة، والرسمية الخارجية، والمتاحة من المصدر فقط، راجع
[مخزون Plugin](/ar/plugins/plugin-inventory).

## المتطلبات

قبل تثبيت Plugin، تأكد من توفر ما يلي:

- نسخة OpenClaw أو تثبيت OpenClaw مع توفر CLI `openclaw`
- وصول شبكي إلى المصدر المحدد، مثل ClawHub أو npm أو مضيف git
- أي بيانات اعتماد خاصة بـ Plugin، أو مفاتيح إعداد، أو أدوات نظام تشغيل تذكرها
  وثائق إعداد ذلك Plugin
- إذن لـ Gateway الذي يخدم قنواتك لإعادة التحميل أو إعادة التشغيل

## البدء السريع

<Steps>
  <Step title="Find the plugin">
    ابحث في [ClawHub](/ar/clawhub) عن حزم plugins العامة:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub هو سطح الاكتشاف الأساسي لـ plugins المجتمع. أثناء الانتقال
    عند الإطلاق، تظل مواصفات الحزم العادية المجردة تثبت من npm ما لم
    تطابق معرف Plugin رسميًا. مواصفات حزم `@openclaw/*` الخام التي تطابق
    plugins مضمنة تستخدم النسخة المضمنة من بناء OpenClaw الحالي. استخدم
    بادئة صريحة عندما تحتاج إلى مصدر محدد.

  </Step>

  <Step title="Install the plugin">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    تعامل مع تثبيت plugins كما تتعامل مع تشغيل الكود. فضّل الإصدارات المثبتة عندما
    تحتاج إلى تثبيتات إنتاجية قابلة لإعادة الإنتاج.

  </Step>

  <Step title="Configure and enable it">
    اضبط الإعدادات الخاصة بـ Plugin ضمن `plugins.entries.<id>.config`.
    فعّل Plugin عندما لا يكون مفعّلًا بالفعل:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    إذا كان إعدادك يستخدم قائمة `plugins.allow` مقيّدة، فيجب أن يكون معرف Plugin
    المثبت موجودًا فيها قبل أن يتمكن Plugin من التحميل.
    يضيف `openclaw plugins install` المعرف المثبت إلى قائمة
    `plugins.allow` موجودة ويزيل المعرف نفسه من `plugins.deny` لكي
    يتمكن التثبيت الصريح من التحميل بعد إعادة التشغيل.

  </Step>

  <Step title="Let the Gateway reload">
    يتطلب تثبيت كود Plugin أو تحديثه أو إلغاء تثبيته إعادة تشغيل Gateway.
    عندما يكون Gateway مُدارًا ويعمل بالفعل مع تمكين إعادة تحميل الإعداد،
    يكتشف OpenClaw سجل تثبيت Plugin المتغير ويعيد تشغيل
    Gateway تلقائيًا. إذا لم يكن Gateway مُدارًا أو كانت إعادة التحميل معطلة،
    فأعد تشغيله بنفسك:

    ```bash
    openclaw gateway restart
    ```

    تحدّث عمليات التفعيل والتعطيل الإعداد وتحدّث السجل البارد.
    يظل فحص وقت التشغيل أوضح مسار تحقق لأسطح وقت التشغيل الحية.

  </Step>

  <Step title="Verify runtime registration">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات، أو الخطافات، أو الخدمات،
    أو طرق Gateway، أو أوامر CLI المملوكة لـ Plugin المسجلة. أما `inspect`
    العادي فهو فحص بارد للبيان والسجل.

  </Step>
</Steps>

## الإعداد

### اختيار مصدر تثبيت

| المصدر      | استخدمه عندما                                                                       | مثال                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | تريد اكتشافًا أصيلًا لـ OpenClaw، وفحوصات، وبيانات وصفية للإصدارات، وتلميحات تثبيت | `openclaw plugins install clawhub:<package>`                   |
| npm         | تحتاج إلى سجل npm مباشر أو مسارات عمل dist-tag                             | `openclaw plugins install npm:<package>`                       |
| git         | تحتاج إلى فرع، أو وسم، أو commit من مستودع                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| مسار محلي  | تطوّر أو تختبر Plugin على الجهاز نفسه                     | `openclaw plugins install --link ./my-plugin`                  |
| سوق | تثبّت Plugin متوافقًا مع Claude من سوق                      | `openclaw plugins install <plugin> --marketplace <source>`     |

لمواصفات الحزم المجردة سلوك توافق خاص. إذا كان الاسم المجرد يطابق
معرف Plugin مضمنًا، يستخدم OpenClaw ذلك المصدر المضمن. وإذا طابق
معرف Plugin رسميًا خارجيًا، يستخدم OpenClaw كتالوج الحزم الرسمي. أما
مواصفات الحزم العادية المجردة الأخرى فتثبت عبر npm أثناء الانتقال عند الإطلاق. كما
تُحل مواصفات حزم `@openclaw/*` الخام التي تطابق plugins مضمنة إلى
النسخة المضمنة قبل الرجوع إلى npm. استخدم `npm:@openclaw/<plugin>@<version>` عندما
تريد عمدًا حزمة npm الخارجية بدلًا من النسخة المضمنة المملوكة للصورة.
استخدم `clawhub:` أو `npm:` أو `git:` أو `npm-pack:` عندما تحتاج
إلى اختيار مصدر حتمي. راجع [`openclaw plugins`](/ar/cli/plugins#install)
لعقد الأمر الكامل.

بالنسبة لتثبيتات npm، تختار مواصفات الحزم غير المثبتة و`@latest` أحدث حزمة مستقرة
تعلن التوافق مع بناء OpenClaw هذا. إذا كان إصدار npm الأحدث الحالي
يعلن `openclaw.compat.pluginApi` أو `openclaw.install.minHostVersion` أحدث،
يفحص OpenClaw إصدارات الحزم المستقرة الأقدم
ويثبت أحدث إصدار مناسب. تبقى الإصدارات الدقيقة ووسوم القنوات الصريحة
مثل `@beta` مثبتة على الحزمة المختارة وتفشل عند عدم التوافق.

### سياسة تثبيت المشغّل

اضبط `security.installPolicy` لتشغيل أمر سياسة محلي موثوق قبل
متابعة تثبيت Plugin أو تحديثه. تتلقى السياسة بيانات وصفية إضافة إلى مسار
المصدر المرحلي ويمكنها السماح بالتثبيت أو حظره. تغطي هذه السياسة مسارات
تثبيت/تحديث Plugin عبر CLI والمدعومة من Gateway. تعمل خطافات Plugin
`before_install` لاحقًا فقط داخل عمليات OpenClaw التي تُحمّل فيها خطافات Plugin،
لذلك استخدم `security.installPolicy` لقرارات التثبيت المملوكة للمشغّل. يُقبل
العلم المهمل `--dangerously-force-unsafe-install` للتوافق، لكنه لا
يتجاوز سياسة التثبيت أو قائمة حظر تبعيات Plugin المدمجة في OpenClaw.

راجع [إعداد Skills](/ar/tools/skills-config#operator-install-policy-securityinstallpolicy)
لمخطط تنفيذ `security.installPolicy` المشترك الذي تستخدمه كل من Skills و
plugins.

### ضبط سياسة Plugin

الشكل الشائع لإعداد Plugin هو:

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

- يعطّل `plugins.enabled: false` جميع plugins ويتخطى عمل اكتشاف/تحميل Plugin.
  تكون مراجع Plugin القديمة خاملة أثناء تفعيل ذلك؛ أعد تفعيل
  plugins قبل تشغيل تنظيف doctor عندما تريد إزالة المعرفات القديمة.
- يتقدم `plugins.deny` على allow وعلى تفعيل Plugin الفردي.
- `plugins.allow` قائمة سماح حصرية. تبقى الأدوات المملوكة لـ Plugin خارج
  قائمة السماح غير متاحة، حتى عندما يتضمن `tools.allow` القيمة `"*"`.
- يعطّل `plugins.entries.<id>.enabled: false` Plugin واحدًا مع الحفاظ على
  إعداده.
- يضيف `plugins.load.paths` ملفات أو أدلة Plugin محلية صريحة. يجب أن تكون
  المسارات المحلية التي يديرها `plugins install` أدلة Plugin أو أرشيفات؛ استخدم
  `plugins.load.paths` لملفات Plugin المستقلة.
- تكون plugins ذات أصل مساحة العمل معطلة افتراضيًا؛ فعّلها صراحة أو
  أضفها إلى قائمة السماح قبل استخدام كود مساحة العمل المحلي.
- تتبع plugins المضمنة بياناتها الوصفية المدمجة الخاصة بالتفعيل الافتراضي/التعطيل الافتراضي ما لم
  يتجاوزها الإعداد صراحة.
- يختار `plugins.slots.<slot>` Plugin واحدًا للفئات الحصرية مثل
  محركات الذاكرة والسياق. يفعّل اختيار الخانة Plugin المحدد إجباريًا
  لتلك الخانة باعتباره تفعيلًا صريحًا؛ ويمكنه التحميل حتى عندما
  كان سيحتاج خلاف ذلك إلى اشتراك صريح. ما زال `plugins.deny` و
  `plugins.entries.<id>.enabled: false` يحظرانه.
- يمكن أن تتفعّل plugins المضمنة الاختيارية تلقائيًا عندما يذكر الإعداد أحد
  أسطحها المملوكة، مثل مرجع موفر/نموذج، أو إعداد قناة، أو خلفية CLI، أو
  وقت تشغيل حاوية وكيل.
- يحافظ توجيه Codex من عائلة OpenAI على فصل حدود Plugin الخاصة بالموفر ووقت التشغيل:
  مراجع نماذج Codex القديمة هي إعداد قديم يصلحه doctor، بينما يملك Plugin
  `codex` المضمن وقت تشغيل خادم تطبيق Codex لمراجع وكلاء `openai/*` القياسية،
  و`agentRuntime.id: "codex"` الصريح، ومراجع `codex/*` القديمة.

عندما لا يكون `plugins.allow` معينًا وتُكتشف plugins غير مضمنة تلقائيًا من
مساحة العمل أو جذور Plugin العامة، تسجل بدء التشغيل
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
يتضمن التحذير معرفات Plugin المكتشفة، وللقوائم القصيرة، مقتطف
`plugins.allow` صغيرًا. شغّل
[`openclaw plugins list --enabled --verbose`](/ar/cli/plugins#list) أو
[`openclaw plugins inspect <id>`](/ar/cli/plugins#inspect) باستخدام معرف Plugin
المذكور قبل نسخ plugins موثوقة إلى `openclaw.json`. تنطبق إرشادات تثبيت الثقة
نفسها عندما تقول التشخيصات إن Plugin تم تحميله
`without install/load-path provenance`: افحص معرف Plugin ذلك، ثم ثبّت
المعرف الموثوق في `plugins.allow` أو أعد التثبيت من مصدر موثوق لكي يسجل OpenClaw
مصدر التثبيت.

شغّل `openclaw doctor` أو `openclaw doctor --fix` عندما يبلغ التحقق من الإعداد
عن معرفات Plugin قديمة، أو عدم تطابق بين قائمة السماح والأدوات، أو مسارات Plugin مضمنة قديمة.

## فهم صيغ Plugin

يتعرف OpenClaw على صيغتين لـ Plugin:

| الصيغة                 | كيفية تحميلها                                                                 | استخدمها عندما                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin أصلي لـ OpenClaw | `openclaw.plugin.json` مع وحدة وقت تشغيل تُحمّل داخل العملية               | تثبّت أو تبني قدرات وقت تشغيل خاصة بـ OpenClaw  |
| حزمة متوافقة      | تخطيط Plugin خاص بـ Codex أو Claude أو Cursor يُربط بمخزون Plugin في OpenClaw | تعيد استخدام Skills أو أوامر أو خطافات أو بيانات وصفية للحزم متوافقة |

تظهر كلتا الصيغتين في `openclaw plugins list` و`openclaw plugins inspect` و
`openclaw plugins enable` و`openclaw plugins disable`. راجع
[حزم Plugin](/ar/plugins/bundles) لحدود توافق الحزم و
[بناء plugins](/ar/plugins/building-plugins) لتأليف Plugin أصلي.

## خطافات Plugin

يمكن لـ plugins تسجيل خطافات وقت التشغيل، لكن هناك واجهتا API مختلفتان
بوظيفتين مختلفتين.

- استخدم الخطافات المكتوبة عبر `api.on(...)` لخطافات دورة حياة وقت التشغيل. هذا هو
  السطح المفضل للبرمجيات الوسيطة، والسياسات، وإعادة كتابة الرسائل، وتشكيل المطالبات،
  والتحكم في الأدوات.
- استخدم `api.registerHook(...)` فقط عندما تريد المشاركة في نظام
  الخطافات الداخلي الموضح في [الخطافات](/ar/automation/hooks). هذا مخصص أساسًا للتأثيرات الجانبية
  الخشنة للأوامر/دورة الحياة والتوافق مع الأتمتة الحالية بنمط HOOK.

قاعدة سريعة:

- إذا كان المعالج يحتاج إلى أولوية، أو دلالات دمج، أو سلوك حظر/إلغاء، فاستخدم
  خطافات Plugin المكتوبة.
- إذا كان المعالج يتفاعل فقط مع `command:new` أو `command:reset` أو `message:sent`
  أو أحداث خشنة مشابهة، فإن `api.registerHook(...)` مناسب.

تظهر الخطافات الداخلية التي يديرها Plugin في `openclaw hooks list` مع
`plugin:<id>`. لا يمكنك تفعيلها أو تعطيلها عبر `openclaw hooks`؛
فعّل Plugin أو عطّله بدلًا من ذلك.

## التحقق من Gateway النشط

`openclaw plugins list` و`openclaw plugins inspect` العاديان يقرآن حالة الإعدادات
والـ manifest والسجل الباردة. ولا يثبتان أن Gateway قيد التشغيل بالفعل
استورد رمز Plugin نفسه.

عندما يبدو Plugin مثبتًا لكن حركة المحادثة المباشرة لا تستخدمه:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

تُعاد تشغيل Gateways المُدارة تلقائيًا بعد تغييرات تثبيت Plugin أو تحديثه أو
إلغاء تثبيته عندما تغيّر مصدر Plugin. في عمليات التثبيت على VPS أو الحاويات،
تأكد من أن أي إعادة تشغيل يدوية تستهدف ابن `openclaw gateway run` الفعلي الذي
يخدم قنواتك، وليس مجرد غلاف أو مشرف.

## استكشاف الأخطاء وإصلاحها

| العرض                                                        | التحقق                                                                                                                                      | الإصلاح                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| يظهر Plugin في `plugins list` لكن خطافات وقت التشغيل لا تعمل  | استخدم `openclaw plugins inspect <id> --runtime --json` وتأكد من Gateway النشط باستخدام `gateway status --deep --require-rpc`             | أعد تشغيل Gateway المباشر بعد تغييرات التثبيت أو التحديث أو الإعدادات أو المصدر                               |
| تظهر تشخيصات تكرار ملكية القناة أو الأداة         | شغّل `openclaw plugins list --enabled --verbose`، وافحص كل Plugin مشتبه به باستخدام `--runtime --json`، وقارن ملكية القناة/الأداة | عطّل مالكًا واحدًا، أو أزل التثبيتات القديمة، أو استخدم `preferOver` في manifest للاستبدال المقصود      |
| تقول الإعدادات إن Plugin مفقود                                | راجع [مخزون Plugin](/ar/plugins/plugin-inventory) لمعرفة ما إذا كان مضمّنًا أو خارجيًا رسميًا أو للمصدر فقط                           | ثبّت الحزمة الخارجية، أو فعّل Plugin المضمّن، أو أزل الإعدادات القديمة                         |
| الإعدادات غير صالحة أثناء التثبيت                               | اقرأ رسالة التحقق وشغّل `openclaw doctor --fix` عندما تشير إلى حالة Plugin قديمة                                           | يستطيع Doctor عزل إعدادات Plugin غير الصالحة بتعطيل الإدخال وإزالة الحمولة غير الصالحة     |
| مسار Plugin محظور بسبب ملكية أو أذونات مريبة | افحص التشخيص قبل خطأ الإعدادات                                                                                             | أصلح ملكية/أذونات نظام الملفات، ثم شغّل `openclaw plugins registry --refresh`                    |
| يمنع `OPENCLAW_NIX_MODE=1` أوامر دورة الحياة                | تأكد من أن التثبيت مُدار بواسطة Nix                                                                                                      | غيّر اختيار Plugin في مصدر Nix بدلًا من استخدام أوامر تعديل Plugin                      |
| يفشل استيراد التبعية في وقت التشغيل                             | تحقق مما إذا كان Plugin مثبتًا عبر npm/git/ClawHub أو محمّلًا من مسار محلي                                                 | شغّل `openclaw plugins update <id>`، أو أعد تثبيت المصدر، أو ثبّت تبعيات Plugin المحلي بنفسك |

عندما تظل إعدادات Plugin القديمة تذكر Plugin قناة لم يعد قابلاً للاكتشاف،
يتجاوز بدء Gateway تلك القناة المدعومة بـ Plugin بدلًا من حظر كل
القنوات الأخرى. شغّل `openclaw doctor --fix` لإزالة إدخالات Plugin والقنوات
القديمة. ستظل مفاتيح القنوات غير المعروفة التي لا تملك دليلًا على Plugin قديم
تفشل في التحقق حتى تبقى الأخطاء المطبعية ظاهرة.

لاستبدال قناة مقصود، يجب أن يعلن Plugin المفضّل
`channelConfigs.<channel-id>.preferOver` مع معرّف Plugin القديم أو الأقل
أولوية. إذا كان كلا Pluginين مفعّلين صراحةً، يحتفظ OpenClaw بذلك الطلب
ويبلغ عن تشخيصات تكرار القناة أو الأداة بدلًا من اختيار مالك واحد بصمت.

إذا أبلغت حزمة مثبتة أنها `requires compiled runtime output for
TypeScript entry ...`، فقد نُشرت الحزمة من دون ملفات JavaScript التي
يحتاجها OpenClaw في وقت التشغيل. حدّث أو أعد التثبيت بعد أن ينشر الناشر
JavaScript المترجم، أو عطّل/أزل تثبيت Plugin حتى ذلك الحين.

### ملكية مسار Plugin محظور

إذا قالت تشخيصات Plugin
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
وتبعها تحقق الإعدادات برسالة `plugin present but blocked`، فهذا يعني أن OpenClaw وجد
ملفات Plugin مملوكة لمستخدم Unix مختلف عن العملية التي تحمّلها.
أبقِ إعدادات Plugin في مكانها؛ أصلح ملكية نظام الملفات أو شغّل
OpenClaw بالمستخدم نفسه الذي يملك دليل الحالة.

بالنسبة لتثبيتات Docker، تعمل الصورة الرسمية باسم `node` (uid `1000`)، لذلك يجب عادةً
أن تكون أدلة إعدادات OpenClaw ومساحة العمل المثبتة من المضيف مملوكة
لـ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

إذا كنت تشغّل OpenClaw عن قصد بصلاحيات root، فأصلح جذر Plugin المُدار إلى
ملكية root بدلًا من ذلك:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

بعد إصلاح الملكية، أعد تشغيل `openclaw doctor --fix` أو
`openclaw plugins registry --refresh` حتى يطابق سجل Plugin المحفوظ
الملفات التي أُصلحت.

### إعداد أداة Plugin بطيء

إذا بدا أن دورات الوكيل تتوقف أثناء تجهيز الأدوات، فعّل تسجيل التتبع وتحقق
من أسطر توقيت مصنع أدوات Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يعرض الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات Plugin، بما في ذلك
معرّف Plugin، وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة
اختيارية. تُرقّى الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد
ثانية واحدة على الأقل أو يستغرق إعداد مصانع أدوات Plugin إجمالًا 5 ثوانٍ على الأقل.

يخزّن OpenClaw نتائج مصانع أدوات Plugin الناجحة مؤقتًا لعمليات الحل المتكررة
مع سياق الطلب الفعال نفسه. يتضمن مفتاح التخزين المؤقت إعدادات وقت التشغيل
الفعالة، ومساحة العمل، ومعرّفات الوكيل/الجلسة، وسياسة sandbox، وإعدادات المتصفح،
وسياق التسليم، وهوية الطالب، وحالة الملكية، لذلك يُعاد تشغيل المصانع التي
تعتمد على تلك الحقول الموثوقة عندما يتغير السياق. إذا ظلت التوقيتات مرتفعة،
فقد يكون Plugin ينفذ عملًا مكلفًا قبل إرجاع تعريفات أدواته.

إذا هيمن Plugin واحد على التوقيت، فافحص تسجيلاته في وقت التشغيل:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك Plugin أو أعد تثبيته أو عطّله. يجب على مؤلفي Plugin نقل
تحميل التبعيات المكلف إلى مسار تنفيذ الأداة بدلًا من تنفيذه داخل مصنع الأداة.

لجذور التبعيات، والتحقق من بيانات تعريف الحزمة، وسجلات السجل، وسلوك إعادة
التحميل عند بدء التشغيل، والتنظيف القديم، راجع
[حل تبعيات Plugin](/ar/plugins/dependency-resolution).

## ذات صلة

- [إدارة Plugins](/ar/plugins/manage-plugins) - أمثلة أوامر للسرد والتثبيت والتحديث وإلغاء التثبيت والنشر
- [`openclaw plugins`](/ar/cli/plugins) - مرجع CLI الكامل
- [مخزون Plugin](/ar/plugins/plugin-inventory) - قائمة Plugins المضمّنة والخارجية المولّدة
- [مرجع Plugin](/ar/plugins/reference) - صفحات مرجع مولّدة لكل Plugin
- [Plugins المجتمع](/ar/plugins/community) - اكتشاف ClawHub وسياسة PR للوثائق
- [حل تبعيات Plugin](/ar/plugins/dependency-resolution) - جذور التثبيت، وسجلات السجل، وحدود وقت التشغيل
- [بناء Plugins](/ar/plugins/building-plugins) - دليل تأليف Plugin أصلي
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview) - التسجيل في وقت التشغيل، والخطافات، وحقول API
- [Plugin manifest](/ar/plugins/manifest) - بيانات تعريف manifest والحزمة
