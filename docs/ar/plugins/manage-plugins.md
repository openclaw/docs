---
doc-schema-version: 1
read_when:
    - تريد استعراض Plugins أو تثبيتها أو تمكينها أو تعطيلها في واجهة التحكم
    - تريد أمثلة سريعة لسرد Plugins أو تثبيتها أو تحديثها أو فحصها أو إلغاء تثبيتها
    - تريد اختيار مصدر لتثبيت Plugin
    - تريد المرجع المناسب لنشر حزم Plugin
sidebarTitle: Manage plugins
summary: إدارة إضافات OpenClaw من واجهة التحكم أو CLI
title: إدارة الإضافات
x-i18n:
    generated_at: "2026-07-16T14:34:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

تغطي واجهة التحكم سير العمل الشائع للاكتشاف والتثبيت والتمكين والتعطيل.
وتضيف CLI التحديث وإلغاء التثبيت والإعداد المتقدم وعناصر التحكم الصريحة
في مصدر التثبيت. للاطلاع على عقد الأوامر الكامل والعلامات وقواعد اختيار المصدر
والحالات الحدّية، راجع [`openclaw plugins`](/ar/cli/plugins).

سير عمل CLI نموذجي: ابحث عن حزمة، وثبّتها من ClawHub أو npm أو git أو
مسار محلي، ودع Gateway المُدار يُعاد تشغيله تلقائيًا (أو أعد تشغيله يدويًا)، ثم
تحقق من تسجيلات وقت التشغيل الخاصة بالـ Plugin.

## استخدام واجهة التحكم

افتح **Plugins** في واجهة التحكم، أو استخدم `/settings/plugins` نسبةً إلى
المسار الأساسي المُعدّ لواجهة التحكم. على سبيل المثال، يستخدم المسار الأساسي `/openclaw`
المسار `/openclaw/settings/plugins`. تحتوي الصفحة على علامتي تبويب:

- **المثبّتة** تعرض المخزون المحلي الكامل مجمّعًا حسب الفئة (القنوات،
  وموفّرو النماذج، والذاكرة، والأدوات). يفتح كل صف عرضًا تفصيليًا؛ وتتيح قائمة
  التجاوز (`…`) الخاصة به تمكين الـ Plugin أو تعطيله، كما توفر
  **الإزالة** للـ Plugins المثبّتة خارجيًا. وتعرض علامة التبويب أيضًا
  [خوادم MCP](/ar/cli/mcp) المُعدّة، مع إجراءات التمكين والتعطيل والإزالة نفسها
  المستندة إلى القوائم، وذلك بتحرير `mcp.servers` في إعدادات Gateway.
- **الاكتشاف** هو المتجر: Plugins مميزة مضمنة مع OpenClaw، وPlugins
  خارجية رسمية، ورفّ منتقى من الموصلات. إما أن تضيف بطاقات الموصلات
  خادم MCP مستضافًا بنقرة واحدة (GitHub وNotion وLinear وSentry
  وHome Assistant)، أو تنتقل إلى بحث ClawHub مُعبّأ مسبقًا. تؤدي الكتابة في مربع البحث
  إلى الاستعلام من [ClawHub](https://clawhub.ai/plugins) ضمن الصفحة وإلحاق قسم **من
  ClawHub** يتضمن أعداد التنزيل وشارات التحقق من المصدر.

لا تحتاج الـ Plugins المضمنة إلى تثبيت حزمة. إجراء القائمة الخاص بها هو **التمكين**
أو **التعطيل**. على سبيل المثال، يأتي Workboard مضمنًا مع OpenClaw ومعطّلًا
افتراضيًا، لذا اختر **التمكين** لتشغيله. لا يمكن إزالة الـ Plugins المجمّعة،
بل يمكن تعطيلها فقط.

يتطلب الوصول إلى الكتالوج والبحث `operator.read`. وتتطلب تغييرات التثبيت والتمكين والتعطيل
والإزالة وخادم MCP الصلاحية `operator.admin`. ينفّذ Gateway عملية تثبيت ClawHub
مع الحفاظ على فحوصات الثقة والتكامل وسياسة تثبيت الـ Plugins.
كما أن تمكين Plugin مثبّت بصفة مسؤول يسجّل تلك الثقة الصريحة
بإضافة الـ Plugin المحدد إلى قائمة `plugins.allow` تقييدية موجودة.
ويظل إدخال `plugins.deny` الصريح هو المرجع الحاكم، ويجب
إزالته قبل تمكين الـ Plugin.

يتطلب تثبيت شيفرة Plugin أو إزالتها إعادة تشغيل Gateway. ويمكن تطبيق تغييرات
التمكين دون إعادة تشغيل عندما يدعم ذلك كل من الـ Plugin المثبّت ووقت تشغيل
Gateway الحالي؛ وإلا فستخبرك الواجهة بأن إعادة التشغيل مطلوبة.
وتظل موصلات MCP المدعومة بـ OAuth بحاجة إلى تنفيذ `openclaw mcp login <name>`
مرة واحدة من CLI بعد إضافتها.

لا تثبّت واجهة التحكم من مصادر npm أو git أو المسارات المحلية العشوائية،
ولا تحدّث الـ Plugins، ولا تعرض إعدادات Plugin الغنية. استخدم مسارات عمل CLI
أدناه لهذه العمليات.

## عرض الـ Plugins والبحث عنها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` للبرامج النصية:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

يمثل `plugins list` فحصًا ساكنًا للمخزون: ما يستطيع OpenClaw اكتشافه من
الإعدادات والبيانات الوصفية وسجل الـ Plugins الدائم. ولا يثبت أن
Gateway قيد التشغيل قد استورد وقت تشغيل الـ Plugin. يتضمن إخراج JSON
تشخيصات السجل وقيمة `dependencyStatus` لكل Plugin (أي ما إذا كانت
`dependencies`/`optionalDependencies` المعلنة قابلة للحل على القرص).

يستعلم `plugins search` من ClawHub عن حزم Plugins القابلة للتثبيت، ويطبع
تلميح تثبيت (`openclaw plugins install clawhub:<package>`) لكل نتيجة.

## تمكين الـ Plugins وتعطيلها

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

يبدّل إدخال إعدادات Plugin دون المساس بالملفات المثبّتة. تكون بعض
الـ Plugins المجمّعة (موفّرو النماذج/الكلام المجمّعون، وPlugin المتصفح المجمّع)
ممكّنة افتراضيًا؛ بينما تتطلب أخرى `enable` بعد التثبيت.

## تثبيت الـ Plugins

```bash
# ابحث في ClawHub عن حزم Plugins.
openclaw plugins search "calendar"

# ثبّت من ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# ثبّت من npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# ثبّت من عنصر npm-pack محلي.
openclaw plugins install npm-pack:<path.tgz>

# ثبّت من git أو نسخة تطوير محلية.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

تُثبّت مواصفات الحزم المجردة من npm خلال انتقال الإطلاق، إلا إذا كان
الاسم يطابق معرّف Plugin مجمّع أو رسمي، وعندئذٍ يستخدم OpenClaw
النسخة المحلية/الرسمية بدلًا منه. استخدم `clawhub:` أو `npm:` أو `git:` أو
`npm-pack:` لاختيار المصدر بصورة حتمية. تُعد حزم كتالوج OpenClaw المجمّعة والرسمية
موثوقة إلى جانب حزم ClawHub. وتتطلب مصادر npm العشوائية الجديدة
أو git أو المسار/الأرشيف المحلي أو `npm-pack:` أو السوق
الخيار `--force` في عمليات التثبيت غير التفاعلية، بعد مراجعة
المصدر والثقة به.

يؤكد `--force` مصدرًا غير تابع لـ ClawHub دون مطالبة، ويستبدل
هدف تثبيت موجودًا عند الحاجة. وللترقيات الروتينية لتثبيت npm
أو ClawHub أو hook-pack متعقّب، استخدم `openclaw plugins update` بدلًا منه. مع
`--link`، لا يفعل `--force` سوى تأكيد المصدر؛ ولا يُنسخ المجلد المرتبط
ولا يُستبدل.

## إعادة التشغيل والفحص

يُعاد تشغيل Gateway مُدار قيد التشغيل ومفعّل فيه إعادة تحميل الإعدادات تلقائيًا
بعد تثبيت شيفرة Plugin أو تحديثها أو إلغاء تثبيتها. إذا كان Gateway
غير مُدار أو كانت إعادة التحميل معطّلة، فأعد تشغيله بنفسك قبل فحص
أسطح وقت التشغيل الحية:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

يحمّل `inspect --runtime` وحدة الـ Plugin ويثبت أنها سجّلت أسطح وقت التشغيل
(الأدوات، والخطافات، والخدمات، وطرائق Gateway، ومسارات HTTP، وأوامر
CLI المملوكة للـ Plugin). أما `inspect` و`list` العاديان فهما فحوصات
ساكنة للبيانات الوصفية/الإعدادات/السجل فقط.

## تحديث الـ Plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

تؤدي تمرير معرّف Plugin إلى إعادة استخدام مواصفة التثبيت المتعقّبة الخاصة به:
تُرحّل وسوم التوزيع المخزّنة (`@beta`) والإصدارات الدقيقة المثبّتة إلى عمليات
`update <plugin-id>` اللاحقة.

يمثل `openclaw plugins update --all` مسار الصيانة المجمّعة. ولا يزال
يحترم مواصفات التثبيت المتعقّبة العادية، لكن سجلات Plugins الرسمية الموثوقة من OpenClaw
تتزامن مع هدف الكتالوج الرسمي الحالي بدلًا من
البقاء مثبّتة على حزمة رسمية دقيقة قديمة؛ وعندما تكون `update.channel`
هي `beta`، تفضّل هذه المزامنة مسار إصدار beta. استخدم
`update <plugin-id>` موجّهًا للإبقاء على مواصفة رسمية دقيقة أو موسومة دون تغيير.

بالنسبة إلى عمليات تثبيت npm، مرّر مواصفة حزمة صريحة لتغيير السجل
المتعقّب:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

يعيد الأمر الثاني Plugin إلى مسار الإصدار الافتراضي للسجل
عندما يكون قد ثُبّت سابقًا على إصدار أو وسم دقيق.

راجع [`openclaw plugins`](/ar/cli/plugins#update) للاطلاع على قواعد الرجوع
والتثبيت الدقيقة.

## إلغاء تثبيت الـ Plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

يؤدي إلغاء التثبيت إلى إزالة إدخال إعدادات الـ Plugin، وسجل فهرس الـ Plugin الدائم،
وإدخالات قائمة السماح/الرفض، وإدخالات `plugins.load.paths` المرتبطة عند
انطباق ذلك. ويُزال دليل التثبيت المُدار ما لم تمرّر
`--keep-files`. ويُعاد تشغيل Gateway مُدار قيد التشغيل تلقائيًا عندما
يغيّر إلغاء التثبيت مصدر الـ Plugin.

في وضع Nix ‏(`OPENCLAW_NIX_MODE=1`)، تكون عمليات تثبيت الـ Plugin وتحديثه وإلغاء تثبيته
وتمكينه وتعطيله كلها معطّلة؛ أدِر هذه الخيارات في مصدر Nix
الخاص بالتثبيت بدلًا من ذلك.

## اختيار مصدر

| المصدر      | استخدمه عندما                                                                    | مثال                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | تريد اكتشافًا أصيلًا في OpenClaw وملخصات الفحص والإصدارات والتلميحات     | `openclaw plugins install clawhub:<package>`                   |
| git         | تريد فرعًا أو وسمًا أو التزامًا من مستودع                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| مسار محلي  | تطوّر Plugin أو تختبره على الجهاز نفسه                  | `openclaw plugins install --link ./my-plugin`                  |
| السوق | تثبّت Plugin سوق متوافقًا مع Claude                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | تتحقق من عنصر حزمة محلي عبر دلالات تثبيت npm      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | تنشر حزم JavaScript بالفعل أو تحتاج إلى وسوم توزيع npm/سجل خاص | `openclaw plugins install npm:@acme/openclaw-plugin`           |

يجب أن تكون عمليات تثبيت المسارات المحلية المُدارة أدلة Plugins أو أرشيفات. ضع
ملفات Plugin المستقلة في `plugins.load.paths` بدلًا من تثبيتها
باستخدام `plugins install`.

## نشر الـ Plugins

يمثل ClawHub سطح الاكتشاف العام الأساسي لـ Plugins الخاصة بـ OpenClaw. انشر
هناك عندما تريد أن يعثر المستخدمون على البيانات الوصفية للـ Plugin، وسجل الإصدارات، ونتائج
فحص السجل، وتلميحات التثبيت قبل أن يثبّتوه.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

يجب أن تتضمن Plugins الأصلية لـ npm بيان Plugin ‏(`openclaw.plugin.json`) بالإضافة إلى
بيانات `package.json` الوصفية قبل النشر:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

استخدم هذه الصفحات للاطلاع على عقد النشر الكامل بدلًا من اعتبار هذه
الصفحة مرجع النشر:

- [النشر على ClawHub](/ar/clawhub/publishing) يشرح المالكين والنطاقات
  والإصدارات والمراجعة والتحقق من صحة الحزمة ونقل الحزمة.
- [إنشاء الـ Plugins](/ar/plugins/building-plugins) يعرض بنية حزمة الـ Plugin
  الكاملة (بما في ذلك `openclaw.plugin.json`) وسير عمل النشر
  الأول.
- [بيان الـ Plugin](/ar/plugins/manifest) يعرّف حقول بيان الـ Plugin
  الأصلي.

إذا كانت الحزمة نفسها متاحة على كل من ClawHub وnpm، فاستخدم البادئة الصريحة
`clawhub:` أو `npm:` لفرض مصدر واحد.

## ذو صلة

- [الـ Plugins](/ar/tools/plugin) - التثبيت والإعداد وإعادة التشغيل واستكشاف الأخطاء وإصلاحها
- [`openclaw plugins`](/ar/cli/plugins) - مرجع CLI الكامل
- [Plugins المجتمع](/ar/plugins/community) - الاكتشاف العام والنشر على ClawHub
- [ClawHub](/ar/clawhub/cli) - عمليات CLI الخاصة بالسجل
- [إنشاء الـ Plugins](/ar/plugins/building-plugins) - إنشاء حزمة Plugin
- [بيان الـ Plugin](/ar/plugins/manifest) - البيان والبيانات الوصفية للحزمة
