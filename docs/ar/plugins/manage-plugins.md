---
doc-schema-version: 1
read_when:
    - تريد استعراض Plugins أو تثبيتها أو تفعيلها أو تعطيلها في واجهة التحكم
    - تريد أمثلة سريعة لعرض قائمة المكونات الإضافية أو تثبيتها أو تحديثها أو فحصها أو إلغاء تثبيتها
    - تريد اختيار مصدر لتثبيت Plugin
    - تريد المرجع المناسب لنشر حزم Plugin
sidebarTitle: Manage plugins
summary: إدارة Plugins الخاصة بـ OpenClaw من واجهة التحكم أو CLI
title: إدارة الإضافات
x-i18n:
    generated_at: "2026-07-12T06:17:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

تغطي واجهة التحكم سير العمل الشائع للاكتشاف والتثبيت والتمكين والتعطيل.
تضيف CLI التحديث وإلغاء التثبيت والتهيئة المتقدمة وعناصر تحكم صريحة
في مصدر التثبيت. للاطلاع على عقد الأوامر الكامل والخيارات وقواعد اختيار
المصدر والحالات الحدّية، راجع [`openclaw plugins`](/ar/cli/plugins).

سير عمل CLI نموذجي: ابحث عن حزمة، وثبّتها من ClawHub أو npm أو git أو
مسار محلي، ودع Gateway المُدار يُعيد التشغيل تلقائيًا (أو أعد تشغيله يدويًا)، ثم
تحقق من تسجيلات وقت التشغيل الخاصة بالـ Plugin.

## استخدام واجهة التحكم

افتح **الإضافات** في واجهة التحكم، أو استخدم `/settings/plugins` نسبةً إلى
المسار الأساسي المُهيأ لواجهة التحكم. على سبيل المثال، يستخدم المسار الأساسي `/openclaw`
المسار `/openclaw/settings/plugins`. تحتوي الصفحة على علامتي تبويب:

- تعرض **المُثبّتة** المخزون المحلي الكامل مجمّعًا حسب الفئة (القنوات،
  وموفّرو النماذج، والذاكرة، والأدوات). يفتح كل صف عرضًا تفصيليًا؛ وتتيح قائمة
  التجاوز (`…`) الخاصة به تمكين الـ Plugin أو تعطيله، كما توفر خيار **إزالة**
  للإضافات المثبّتة خارجيًا. تسرد علامة التبويب أيضًا
  [خوادم MCP](/ar/cli/mcp) المُهيأة، مع إجراءات التمكين والتعطيل والإزالة
  نفسها المعتمدة على القوائم، وذلك عبر تعديل `mcp.servers` في تهيئة Gateway.
- تمثل **الاكتشاف** المتجر: الإضافات المميزة المضمّنة مع OpenClaw، والإضافات
  الخارجية الرسمية، ورفًا منسقًا للموصلات. تضيف بطاقات الموصلات إما خادم
  MCP مستضافًا بنقرة واحدة (GitHub وNotion وLinear وSentry
  وHome Assistant)، أو تنقلك إلى بحث مُعبّأ مسبقًا في ClawHub. تؤدي الكتابة في مربع البحث
  إلى الاستعلام من [ClawHub](https://clawhub.ai/plugins) ضمن الصفحة وإلحاق قسم **من
  ClawHub** يتضمن أعداد التنزيل وشارات التحقق من المصدر.

لا تحتاج الإضافات المضمّنة إلى تثبيت حزمة. يكون إجراء القائمة الخاص بها **تمكين**
أو **تعطيل**. على سبيل المثال، يأتي Workboard مضمنًا مع OpenClaw ويكون معطّلًا
افتراضيًا، لذا اختر **تمكين** لتشغيله. لا يمكن
إزالة الإضافات المجمّعة، بل يمكن تعطيلها فقط.

يتطلب الوصول إلى الكتالوج والبحث `operator.read`. ويتطلب التثبيت والتمكين والتعطيل
والإزالة وتغييرات خادم MCP الصلاحية `operator.admin`. ينفّذ Gateway عملية تثبيت من ClawHub
مع الحفاظ على فحوصات سياسة الثقة والتكامل وتثبيت
الإضافات.

يتطلب تثبيت شيفرة Plugin أو إزالتها إعادة تشغيل Gateway. يمكن تطبيق
تغييرات التمكين دون إعادة تشغيل عندما يدعم ذلك كل من الـ Plugin المثبّت ووقت تشغيل
Gateway الحالي؛ وإلا فستخبرك الواجهة بأن إعادة التشغيل مطلوبة.
لا تزال موصلات MCP المدعومة بـ OAuth تحتاج إلى تنفيذ `openclaw mcp login <name>`
مرة واحدة من CLI بعد إضافتها.

لا تثبّت واجهة التحكم من مصادر npm أو git أو المسارات المحلية الاعتباطية،
ولا تحدّث الإضافات، ولا تعرض تهيئة غنية للـ Plugin. استخدم مسارات عمل CLI
أدناه لهذه العمليات.

## سرد الإضافات والبحث عنها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

استخدام `--json` في البرامج النصية:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

يمثل `plugins list` فحصًا ساكنًا للمخزون: ما يمكن لـ OpenClaw اكتشافه من
التهيئة والبيانات الوصفية وسجل الإضافات المحفوظ. ولا يثبت أن Gateway
قيد التشغيل بالفعل قد استورد وقت تشغيل الـ Plugin. يتضمن إخراج JSON
تشخيصات السجل وحالة `dependencyStatus` لكل Plugin (أي ما إذا كانت
`dependencies`/`optionalDependencies` المعلنة قابلة للحل على القرص).

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
تلميح تثبيت (`openclaw plugins install clawhub:<package>`) لكل نتيجة.

## تمكين الإضافات وتعطيلها

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

يبدّل إدخال تهيئة Plugin دون المساس بالملفات المثبّتة. تكون بعض
الإضافات المجمّعة (موفّرو النماذج/الكلام المجمّعون، وPlugin المتصفح المجمّع)
مُمكّنة افتراضيًا؛ وتتطلب إضافات أخرى تنفيذ `enable` بعد التثبيت.

## تثبيت الإضافات

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm-pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

تُثبّت مواصفات الحزم المجرّدة من npm أثناء الانتقال عند الإطلاق، ما لم
يطابق الاسم معرّف Plugin مجمّعًا أو رسميًا، وفي هذه الحالة يستخدم OpenClaw
النسخة المحلية/الرسمية بدلًا منه. استخدم `clawhub:` أو `npm:` أو `git:` أو
`npm-pack:` لاختيار مصدر حتمي.

استخدم `--force` فقط لاستبدال هدف تثبيت موجود من مصدر مختلف.
للترقيات الاعتيادية لتثبيت npm أو ClawHub أو hook-pack متتبَّع،
استخدم `openclaw plugins update` بدلًا من ذلك؛ لا يُدعم `--force` مع
`--link`.

## إعادة التشغيل والفحص

يُعاد تشغيل Gateway مُدار وقيد التشغيل، مع تمكين إعادة تحميل التهيئة، تلقائيًا
بعد تثبيت شيفرة Plugin أو تحديثها أو إلغاء تثبيتها. إذا كان Gateway
غير مُدار أو كانت إعادة التحميل معطّلة، فأعد تشغيله بنفسك قبل فحص
أسطح وقت التشغيل الحية:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

يحمّل `inspect --runtime` وحدة الـ Plugin ويثبت أنها سجّلت أسطح وقت التشغيل
(الأدوات، والخطافات، والخدمات، وطرائق Gateway، ومسارات HTTP، وأوامر
CLI المملوكة للـ Plugin). أما `inspect` العادي و`list` فهما مجرد
فحوصات ساكنة للبيان/التهيئة/السجل.

## تحديث الإضافات

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

تؤدي تمرير معرّف Plugin إلى إعادة استخدام مواصفة التثبيت المتتبَّعة الخاصة به: تنتقل
وسوم التوزيع المخزنة (`@beta`) والإصدارات المثبّتة بدقة إلى عمليات
`update <plugin-id>` اللاحقة.

يمثل `openclaw plugins update --all` مسار الصيانة الجماعية. ولا يزال
يحترم مواصفات التثبيت المتتبَّعة الاعتيادية، لكن سجلات إضافات OpenClaw
الرسمية الموثوقة تتزامن مع هدف الكتالوج الرسمي الحالي بدلًا من
البقاء مثبّتة على حزمة رسمية قديمة ذات إصدار دقيق؛ وعندما تكون `update.channel`
بالقيمة `beta`، تفضّل هذه المزامنة مسار إصدار بيتا. استخدم
`update <plugin-id>` مستهدفًا للإبقاء على مواصفة رسمية دقيقة أو موسومة دون تغيير.

بالنسبة إلى عمليات تثبيت npm، مرّر مواصفة حزمة صريحة لتبديل السجل
المتتبَّع:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

يعيد الأمر الثاني Plugin إلى مسار الإصدار الافتراضي للسجل
عندما يكون قد ثُبّت سابقًا على إصدار دقيق أو وسم.

راجع [`openclaw plugins`](/ar/cli/plugins#update) للاطلاع على قواعد الرجوع الاحتياطي
والتثبيت الدقيقة.

## إلغاء تثبيت الإضافات

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

يزيل إلغاء التثبيت إدخال تهيئة الـ Plugin، وسجل فهرس الإضافات المحفوظ،
وإدخالات قوائم السماح/المنع، وإدخالات `plugins.load.paths` المرتبطة عند
الانطباق. ويُزال دليل التثبيت المُدار ما لم تمرّر
`--keep-files`. يُعاد تشغيل Gateway مُدار وقيد التشغيل تلقائيًا عندما
يغيّر إلغاء التثبيت مصدر الـ Plugin.

في وضع Nix ‏(`OPENCLAW_NIX_MODE=1`)، تكون عمليات تثبيت الإضافات وتحديثها وإلغاء تثبيتها
وتمكينها وتعطيلها كلها معطّلة؛ أدِر هذه الخيارات في مصدر Nix
الخاص بالتثبيت بدلًا من ذلك.

## اختيار مصدر

| المصدر      | يُستخدم عندما                                                                    | مثال                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | تريد اكتشافًا أصيلًا في OpenClaw وملخصات الفحص والإصدارات والتلميحات     | `openclaw plugins install clawhub:<package>`                   |
| git         | تريد فرعًا أو وسمًا أو تثبيتًا من مستودع                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| مسار محلي  | تطوّر Plugin أو تختبره على الجهاز نفسه                  | `openclaw plugins install --link ./my-plugin`                  |
| سوق | تثبّت Plugin من سوق متوافق مع Claude                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| حزمة npm    | تثبت صلاحية عنصر حزمة محلي عبر دلالات تثبيت npm      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | تنشر حزم JavaScript بالفعل أو تحتاج إلى وسوم توزيع npm/سجل خاص | `openclaw plugins install npm:@acme/openclaw-plugin`           |

يجب أن تكون عمليات التثبيت المُدارة من مسار محلي أدلة Plugin أو أرشيفات. ضع
ملفات Plugin المستقلة في `plugins.load.paths` بدلًا من تثبيتها
باستخدام `plugins install`.

## نشر الإضافات

يمثل ClawHub سطح الاكتشاف العام الأساسي لإضافات OpenClaw. انشر
هناك عندما تريد أن يعثر المستخدمون على البيانات الوصفية للـ Plugin، وسجل الإصدارات، ونتائج
فحص السجل، وتلميحات التثبيت قبل أن يثبّتوه.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

يجب أن تتضمن إضافات npm الأصلية بيان Plugin ‏(`openclaw.plugin.json`) بالإضافة إلى
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

استخدم هذه الصفحات للاطلاع على عقد النشر الكامل بدلًا من التعامل مع هذه
الصفحة على أنها مرجع النشر:

- يشرح [النشر في ClawHub](/ar/clawhub/publishing) المالكين والنطاقات
  والإصدارات والمراجعة والتحقق من الحزم ونقل الحزم.
- تعرض [بناء الإضافات](/ar/plugins/building-plugins) الشكل الكامل لحزمة Plugin
  (بما في ذلك `openclaw.plugin.json`) وسير عمل النشر الأول.
- يعرّف [بيان الـ Plugin](/ar/plugins/manifest) حقول بيان الـ Plugin
  الأصلي.

إذا كانت الحزمة نفسها متاحة على كل من ClawHub وnpm، فاستخدم البادئة الصريحة
`clawhub:` أو `npm:` لفرض مصدر واحد.

## ذو صلة

- [الإضافات](/ar/tools/plugin) - التثبيت والتهيئة وإعادة التشغيل واستكشاف الأخطاء وإصلاحها
- [`openclaw plugins`](/ar/cli/plugins) - مرجع CLI الكامل
- [إضافات المجتمع](/ar/plugins/community) - الاكتشاف العام والنشر في ClawHub
- [ClawHub](/ar/clawhub/cli) - عمليات CLI الخاصة بالسجل
- [بناء الإضافات](/ar/plugins/building-plugins) - إنشاء حزمة Plugin
- [بيان الـ Plugin](/ar/plugins/manifest) - البيان والبيانات الوصفية للحزمة
