---
doc-schema-version: 1
read_when:
    - تريد أمثلة سريعة لعرض قائمة Plugin أو تثبيته أو تحديثه أو فحصه أو إلغاء تثبيته
    - تريد اختيار مصدر تثبيت Plugin
    - تريد المرجع الصحيح لنشر حزم Plugin
sidebarTitle: Manage plugins
summary: أمثلة سريعة لسرد Plugin الخاصة بـ OpenClaw وتثبيتها وتحديثها وفحصها وإلغاء تثبيتها
title: إدارة plugins
x-i18n:
    generated_at: "2026-06-27T18:06:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

استخدم هذه الصفحة لأوامر إدارة Plugin الشائعة. للاطلاع على عقد الأمر
الكامل، والرايات، وقواعد اختيار المصدر، والحالات الطرفية، راجع
[`openclaw plugins`](/ar/cli/plugins).

معظم مسارات عمل التثبيت تكون كالتالي:

1. العثور على حزمة
2. تثبيتها من ClawHub، أو npm، أو git، أو مسار محلي
3. السماح لـ Gateway المُدار بإعادة التشغيل تلقائيًا، أو إعادة تشغيله يدويًا عندما لا يكون مُدارًا
4. التحقق من تسجيلات وقت تشغيل Plugin

## سرد Plugins والبحث عنها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

استخدم `--json` للبرامج النصية:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` فحص جرد بارد. يعرض ما يمكن لـ OpenClaw اكتشافه
من الإعدادات، وملفات البيان، وسجل Plugins؛ ولا يثبت أن Gateway
قيد التشغيل بالفعل قد استورد وقت تشغيل Plugin. يتضمن إخراج JSON
تشخيصات السجل و`dependencyStatus` الثابتة لكل Plugin عندما تعلن
حزمة Plugin عن `dependencies` أو `optionalDependencies`.

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
تلميحات التثبيت مثل `openclaw plugins install clawhub:<package>`.

## تثبيت Plugins

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

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

مواصفات الحزم العارية تُثبَّت من npm أثناء انتقال الإطلاق. استخدم `clawhub:`
أو `npm:` أو `git:` أو `npm-pack:` عندما تحتاج إلى اختيار مصدر حتمي.
إذا كان الاسم العاري يطابق معرّف Plugin رسميًا، يستطيع OpenClaw تثبيت
إدخال الفهرس مباشرة.

استخدم `--force` فقط عندما تريد عن قصد الكتابة فوق هدف تثبيت موجود.
للترقيات الروتينية لتثبيتات npm أو ClawHub أو hook-pack المتتبعة، استخدم
`openclaw plugins update`.

## إعادة التشغيل والفحص

بعد تثبيت أو تحديث أو إلغاء تثبيت كود Plugin، يعيد Gateway المُدار قيد التشغيل
مع تمكين إعادة تحميل الإعدادات تشغيل نفسه تلقائيًا. إذا لم يكن Gateway
مُدارًا أو كانت إعادة التحميل معطلة، فأعد تشغيله بنفسك قبل فحص أسطح وقت
التشغيل الحية:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

استخدم `inspect --runtime` عندما تحتاج إلى دليل على أن Plugin سجّل أسطح
وقت التشغيل مثل الأدوات، أو الخطافات، أو الخدمات، أو طرائق Gateway، أو
مسارات HTTP، أو أوامر CLI التي يملكها Plugin. أما `inspect` و`list`
العاديان فهما فحوصات باردة لملف البيان، والإعدادات، والسجل.

## تحديث Plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

عند تمرير معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المتتبعة.
تظل وسوم التوزيع المخزنة مثل `@beta` والإصدارات الدقيقة المثبتة مستخدمة
في تشغيلات `update <plugin-id>` اللاحقة.

`openclaw plugins update --all` هو مسار الصيانة المجمّعة. لا يزال يحترم
مواصفات التثبيت المتتبعة العادية، لكن سجلات Plugin الرسمية الموثوقة الخاصة
بـ OpenClaw يمكن أن تتزامن مع هدف الفهرس الرسمي الحالي بدل البقاء على
حزمة رسمية دقيقة قديمة. إذا تم ضبط `update.channel` على `beta`، فستستخدم
المزامنة الرسمية المجمّعة هذه سياق قناة beta. استخدم `update <plugin-id>`
المستهدف عندما تريد عن قصد إبقاء مواصفة رسمية دقيقة أو موسومة دون تغيير.

بالنسبة لتثبيتات npm، يمكنك تمرير مواصفة حزمة صريحة لتبديل السجل المتتبع:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

يعيد الأمر الثاني Plugin إلى خط الإصدار الافتراضي في السجل عندما كان
مثبتًا سابقًا على إصدار أو وسم دقيق.

عندما يعمل `openclaw update` على قناة beta، يمكن لسجلات Plugin تفضيل
إصدارات `@beta` المطابقة. للاطلاع على قواعد الرجوع والتثبيت الدقيقة، راجع
[`openclaw plugins`](/ar/cli/plugins#update).

## إلغاء تثبيت Plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

يزيل إلغاء التثبيت إدخال إعدادات Plugin، وسجل فهرس Plugin المستمر،
ومدخلات قوائم السماح/الرفض، ومسارات التحميل المرتبطة عند انطباق ذلك.
تُزال أدلة التثبيت المُدارة ما لم تمرر `--keep-files`. يعيد Gateway المُدار
قيد التشغيل تشغيل نفسه تلقائيًا عندما يغيّر إلغاء التثبيت مصدر Plugin.

في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون أوامر تثبيت Plugin وتحديثه
وإلغاء تثبيته وتمكينه وتعطيله معطلة. أدر هذه الخيارات في مصدر Nix الخاص
بالتثبيت بدلًا من ذلك.

## اختيار مصدر

| المصدر      | استخدمه عندما                                                                  | مثال                                                          |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | تريد اكتشافًا أصيلًا لـ OpenClaw، وملخصات فحص، وإصدارات، وتلميحات          | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | تشحن حزم JavaScript بالفعل أو تحتاج إلى وسوم توزيع npm/سجل خاص             | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | تريد فرعًا أو وسمًا أو تثبيتًا من مستودع                                     | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| مسار محلي   | تطوّر أو تختبر Plugin على الجهاز نفسه                                       | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | تثبت أثر حزمة محلية عبر دلالات تثبيت npm                                    | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | تثبت Plugin متوافقًا مع Claude من marketplace                               | `openclaw plugins install <plugin> --marketplace <source>`     |

يجب أن تكون تثبيتات المسار المحلي المُدارة أدلة Plugin أو أرشيفات. ضع
ملفات Plugin المستقلة في `plugins.load.paths` بدل تثبيتها باستخدام
`plugins install`.

## نشر Plugins

ClawHub هو سطح الاكتشاف العام الأساسي لـ OpenClaw Plugins. انشر هناك
عندما تريد أن يعثر المستخدمون على بيانات Plugin الوصفية، وسجل الإصدارات،
ونتائج فحص السجل، وتلميحات التثبيت قبل أن يثبتوا.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

يجب أن تتضمن Plugins الأصلية في npm ملف بيان Plugin وبيانات وصفية للحزمة
قبل النشر:

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

استخدم هذه الصفحات لعقد النشر الكامل بدل اعتبار هذه الصفحة مرجع النشر:

- يشرح [نشر ClawHub](/ar/clawhub/publishing) المالكين، والنطاقات، والإصدارات،
  والمراجعة، والتحقق من الحزمة، ونقل الحزمة.
- تعرض [بناء Plugins](/ar/plugins/building-plugins) شكل حزمة Plugin
  ومسار عمل النشر الأول.
- يعرّف [ملف بيان Plugin](/ar/plugins/manifest) حقول ملف بيان Plugin الأصلية.

إذا كانت الحزمة نفسها متاحة على كل من ClawHub وnpm، فاستخدم البادئة الصريحة
`clawhub:` أو `npm:` عندما تحتاج إلى فرض مصدر واحد.

## ذات صلة

- [Plugins](/ar/tools/plugin) - التثبيت، والإعداد، وإعادة التشغيل، واستكشاف الأخطاء وإصلاحها
- [`openclaw plugins`](/ar/cli/plugins) - مرجع CLI الكامل
- [Plugins المجتمع](/ar/plugins/community) - الاكتشاف العام والنشر عبر ClawHub
- [ClawHub](/ar/clawhub/cli) - عمليات CLI للسجل
- [بناء Plugins](/ar/plugins/building-plugins) - إنشاء حزمة Plugin
- [ملف بيان Plugin](/ar/plugins/manifest) - ملف البيان والبيانات الوصفية للحزمة
