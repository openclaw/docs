---
read_when:
    - أنت تصحّح أخطاء تثبيت حزم Plugin
    - أنت تغيّر سلوك بدء تشغيل Plugin أو doctor أو تثبيت مدير الحزم
    - أنت تدير تثبيتات OpenClaw المعبأة أو ملفات بيان Plugin المضمّنة
sidebarTitle: Dependencies
summary: كيف يثبّت OpenClaw حزم Plugin ويحلّ اعتماديات Plugin
title: حل تبعيات Plugin
x-i18n:
    generated_at: "2026-07-04T15:20:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

يبقي OpenClaw عمل تبعيات Plugin في وقت التثبيت/التحديث. لا يقوم تحميل وقت التشغيل
بتشغيل مديري الحزم، أو إصلاح أشجار التبعيات، أو تعديل دليل حزمة OpenClaw.

## تقسيم المسؤوليات

تمتلك حزم Plugin مخطط التبعيات الخاص بها:

- تبعيات وقت التشغيل توجد في `dependencies` أو
  `optionalDependencies` في حزمة Plugin
- استيرادات SDK/النواة هي استيرادات نظيرة أو استيرادات يوفرها OpenClaw
- Plugins التطوير المحلية تجلب تبعياتها المثبتة مسبقًا بنفسها
- تُثبَّت Plugins من npm وgit في جذور حزم مملوكة لـ OpenClaw

يمتلك OpenClaw دورة حياة Plugin فقط:

- اكتشاف مصدر Plugin
- تثبيت الحزمة أو تحديثها عند الطلب الصريح
- تسجيل بيانات التعريف الخاصة بالتثبيت
- تحميل نقطة دخول Plugin
- الفشل مع خطأ قابل للتنفيذ عند فقدان التبعيات

## جذور التثبيت

يستخدم OpenClaw جذورًا مستقرة لكل مصدر:

- تُثبَّت حزم npm في مشاريع لكل Plugin تحت
  `~/.openclaw/npm/projects/<encoded-package>`
- تُستنسخ حزم git تحت `~/.openclaw/git`
- تُنسخ أو تُشار إلى تثبيتات local/path/archive دون إصلاح للتبعيات

تعمل تثبيتات npm في جذر المشروع الخاص بكل Plugin باستخدام:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

يستخدم `openclaw plugins install npm-pack:<path.tgz>` جذر مشروع npm نفسه
الخاص بكل Plugin لحزمة tarball محلية من npm-pack. يقرأ OpenClaw بيانات تعريف npm
الخاصة بحزمة tarball، ويضيفها إلى المشروع المُدار كتبعية `file:` منسوخة، ويشغّل
تثبيت npm العادي، ثم يتحقق من بيانات تعريف lockfile المثبتة قبل الوثوق بـ Plugin.
هذا مخصص لإثبات قبول الحزمة ومرشح الإصدار عندما يجب أن يتصرف أثر حزمة محلي مثل أثر السجل الذي يحاكيه.

استخدم `npm-pack:` عند اختبار حزم Plugin الرسمية أو الخارجية قبل النشر.
يفيد تثبيت أرشيف خام أو مسار في تصحيح الأخطاء المحلي، لكنه لا يثبت مسار التبعية نفسه
كتثبيت حزمة npm أو ClawHub مثبتة. يثبت `npm-pack:` شكل تثبيت الحزمة المُدارة؛
ولا يثبت بحد ذاته أن Plugin محتوى رسمي مرتبط بالفهرس.

عندما يعتمد السلوك على حالة Plugin المضمنة أو Plugin الرسمية الموثوقة، اقرن
إثبات الحزمة المحلي بتثبيت رسمي مدعوم بالفهرس أو مسار حزمة منشورة يسجل الثقة الرسمية.
يجب التحقق من وصول المساعدات ذات الامتيازات ومعالجة نطاق الرسمي الموثوق على مسار
التثبيت الموثوق ذاك، لا استنتاجه من تثبيت tarball محلي.

إذا فشل Plugin في وقت التشغيل بسبب استيراد مفقود، فأصلح بيان الحزمة
بدلًا من إصلاح المشروع المُدار يدويًا. تنتمي استيرادات وقت التشغيل إلى
`dependencies` أو `optionalDependencies` في حزمة Plugin؛ ولا تُثبَّت
`devDependencies` لمشاريع وقت التشغيل المُدارة. يمكن أن يزيل `npm install` محلي داخل
`~/.openclaw/npm/projects/<encoded-package>` عائق تشخيص مؤقت،
لكنه ليس إثبات قبول حزمة لأن التثبيت أو التحديث التالي سيعيد إنشاء المشروع من بيانات تعريف الحزمة.

قد يرفع npm التبعيات الانتقالية إلى `node_modules` في مشروع كل Plugin
بجانب حزمة Plugin. يفحص OpenClaw جذر المشروع المُدار قبل الوثوق بالتثبيت ويزيل
ذلك المشروع أثناء إلغاء التثبيت، لذلك تبقى تبعيات وقت التشغيل المرفوعة داخل حد تنظيف ذلك Plugin.

يمكن لحزم Plugin المنشورة على npm شحن `npm-shrinkwrap.json`. يستخدم npm ذلك
الـ lockfile القابل للنشر أثناء التثبيت، ويدعمه جذر مشروع npm المُدار من OpenClaw
عبر مسار تثبيت npm العادي. يجب أن تتضمن حزم Plugin القابلة للنشر والمملوكة لـ OpenClaw
ملف shrinkwrap محليًا للحزمة مولدًا من مخطط التبعيات المنشور لحزمة Plugin تلك:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

يزيل المولد `devDependencies` الخاصة بـ Plugin، ويطبق سياسة تجاوزات مساحة العمل،
ويكتب `extensions/<id>/npm-shrinkwrap.json` لكل Plugin يحمل `publishToNpm`.
قد تشحن حزم Plugin التابعة لأطراف ثالثة shrinkwrap أيضًا؛ لا يطلب OpenClaw ذلك
لحزم المجتمع، لكن npm سيحترمه عند وجوده.

قبل التعامل مع حزمة محلية كإثبات لمرشح إصدار، افحص حزمة tarball
التي ستُثبَّت:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

بالنسبة إلى تغييرات التبعيات، تحقق أيضًا من أن تثبيت إنتاج يمكنه حل
حزم وقت التشغيل دون تبعيات التطوير:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

يمكن لحزم Plugin من npm المملوكة لـ OpenClaw أن تنشر أيضًا مع
`bundledDependencies` صريحة. يراكب مسار نشر npm قائمة أسماء تبعيات وقت التشغيل،
ويزيل بيانات تعريف مساحة العمل الخاصة بالتطوير فقط من بيان الحزمة المنشورة،
ويشغّل تثبيت npm بلا سكربتات لتبعيات وقت التشغيل المحلية للحزمة، ثم يحزم أو ينشر
حزمة tarball الخاصة بـ Plugin مع تضمين ملفات التبعيات تلك. تتجنب الحزم الثقيلة
بالأجزاء الأصلية، بما في ذلك أوقات تشغيل Codex وACP، ذلك باستخدام
`openclaw.release.bundleRuntimeDependencies: false`؛ لا تزال تلك الحزم تشحن
shrinkwrap الخاص بها، لكن npm يحل تبعيات وقت التشغيل أثناء التثبيت بدلًا من تضمين
كل ملف ثنائي خاص بمنصة في حزمة tarball الخاصة بـ Plugin. لا تجمع حزمة الجذر
`openclaw` شجرة تبعياتها الكاملة.

تعلن Plugins التي تستورد `openclaw/plugin-sdk/*` عن `openclaw` كتبعية نظيرة.
لا يسمح OpenClaw لـ npm بتثبيت نسخة سجل منفصلة من حزمة المضيف داخل مشروع مُدار،
لأن حزم المضيف القديمة يمكن أن تؤثر في حل النظراء لدى npm داخل ذلك Plugin.
تتخطى تثبيتات npm المُدارة حل/تجسيد نظراء npm ويعيد OpenClaw تأكيد روابط
`node_modules/openclaw` المحلية لـ Plugin للحزم المثبتة التي تعلن عن نظير المضيف
بعد التثبيت أو التحديث.

تستنسخ تثبيتات git المستودع أو تحدثه، ثم تشغّل:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

ثم يُحمَّل Plugin المثبت من دليل الحزمة ذاك، لذلك يعمل حل `node_modules`
المحلي للحزمة والأب بالطريقة نفسها كما في حزمة Node عادية.

## Plugins المحلية

تُعامل Plugins المحلية كأدلة يسيطر عليها المطور. لا يقوم OpenClaw
بتشغيل `npm install` أو `pnpm install` أو إصلاح التبعيات لها. إذا كان لدى Plugin
محلي تبعيات، فثبّتها في ذلك Plugin قبل تحميله.

يمكن لـ Plugins TypeScript المحلية التابعة لأطراف ثالثة استخدام مسار Jiti الطارئ.
تُحمَّل Plugins JavaScript المحزمة وPlugins الداخلية المضمنة عبر
import/require الأصلي بدلًا من Jiti.

## بدء التشغيل وإعادة التحميل

لا يقوم بدء تشغيل Gateway ولا إعادة تحميل الإعدادات بتثبيت تبعيات Plugin. بل يقرآن
سجلات تثبيت Plugin، ويحسبان نقطة الدخول، ويحمّلانها.

إذا كانت تبعية مفقودة في وقت التشغيل، يفشل تحميل Plugin ويجب أن يوجه الخطأ
المشغل إلى إصلاح صريح:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

يمكن لـ `doctor --fix` تنظيف حالة التبعيات القديمة التي أنشأها OpenClaw واسترداد
Plugins القابلة للتنزيل المفقودة من سجلات التثبيت المحلية عندما تشير إليها الإعدادات.
لا يصلح Doctor تبعيات Plugin محلي مثبت مسبقًا.

## Plugins المضمنة

تُشحن Plugins الخفيفة والحرجة للنواة كجزء من OpenClaw.
يجب إما ألا تحتوي على شجرة تبعيات وقت تشغيل ثقيلة أو أن تُنقل إلى حزمة
قابلة للتنزيل على ClawHub/npm.

للقائمة الحالية المولدة من Plugins التي تُشحن في حزمة النواة، أو تُثبَّت خارجيًا،
أو تبقى كمصدر فقط، راجع [مخزون Plugin](/ar/plugins/plugin-inventory).

يجب ألا تطلب بيانات تعريف Plugins المضمنة تمهيد التبعيات. يجب أن تُحزم وظائف
Plugin الكبيرة أو الاختيارية كـ Plugin عادي وتُثبَّت عبر مسار npm/git/ClawHub نفسه
المستخدم مع Plugins التابعة لأطراف ثالثة.

في checkouts المصدرية، يعامل OpenClaw المستودع كـ pnpm monorepo. بعد
`pnpm install`، تُحمَّل Plugins المضمنة من `extensions/<id>` بحيث تكون تبعيات
مساحة العمل المحلية للحزمة متاحة وتُلتقط التعديلات مباشرة. تطوير checkout مصدري
يدعم pnpm فقط؛ ولا يُعد `npm install` عادي في جذر المستودع طريقة مدعومة
لتحضير تبعيات Plugin المضمنة.

| شكل التثبيت                     | موقع Plugin المضمن                  | مالك التبعية                                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | شجرة وقت التشغيل المبنية داخل الحزمة | حزمة OpenClaw وتدفقات تثبيت/تحديث/doctor الصريحة لـ Plugin          |
| Git checkout plus `pnpm install` | حزم مساحة العمل `extensions/<id>`    | مساحة عمل pnpm، بما في ذلك تبعيات كل حزمة Plugin الخاصة بها          |
| `openclaw plugins install ...`   | جذر npm project/git/ClawHub مُدار    | تدفق تثبيت/تحديث Plugin                                               |

## تنظيف القديم

كانت إصدارات OpenClaw الأقدم تولد جذور تبعيات Plugin المضمنة عند بدء التشغيل أو
أثناء إصلاح doctor. يزيل تنظيف doctor الحالي تلك الأدلة والروابط الرمزية القديمة عند
استخدام `--fix`، بما في ذلك جذور `plugin-runtime-deps` القديمة، وروابط حزم
بادئة Node العامة التي تشير إلى أهداف `plugin-runtime-deps` مقلمة،
وبيانات تعريف `.openclaw-runtime-deps*`، و`node_modules` المولدة لـ Plugin،
وأدلة مرحلة التثبيت، ومخازن pnpm المحلية للحزمة. كما يزيل postinstall المحزم
تلك الروابط الرمزية العامة قبل تقليم جذور الأهداف القديمة كي لا تترك الترقيات
استيرادات حزم ESM متدلية.

استخدمت تثبيتات npm الأقدم أيضًا جذرًا مشتركًا `~/.openclaw/npm/node_modules`.
لا تزال تدفقات التثبيت والتحديث وإلغاء التثبيت وdoctor الحالية تتعرف إلى ذلك
الجذر المسطح القديم للاسترداد والتنظيف فقط. يجب أن تنشئ تثبيتات npm الجديدة
جذور مشاريع لكل Plugin بدلًا من ذلك.
