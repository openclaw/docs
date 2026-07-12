---
read_when:
    - تريد معرفة معنى npm shrinkwrap في إصدار OpenClaw
    - أنت تراجع ملفات قفل الحزم أو تغييرات التبعيات أو مخاطر سلسلة التوريد
    - أنت تتحقق من حزم npm الجذرية أو حزم Plugin قبل نشرها
summary: شرح مبسّط وتقني لملف تقليص تبعيات npm في إصدارات OpenClaw
title: تقليص إصدارات npm
x-i18n:
    generated_at: "2026-07-12T06:02:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

تستخدم نُسخ شيفرة OpenClaw المصدرية المستنسخة الملف `pnpm-lock.yaml`. وتستخدم حزم OpenClaw المنشورة على npm الملف `npm-shrinkwrap.json`، وهو ملف npm القابل للنشر لقفل التبعيات، بحيث تستخدم عمليات تثبيت الحزم مخطط التبعيات الذي خضع للمراجعة أثناء الإصدار.

## لماذا يهم ذلك

يمثّل ملف Shrinkwrap إيصالًا لشجرة التبعيات التي تُشحن مع حزمة npm: فهو يحدد لـ npm الإصدارات الانتقالية الدقيقة المطلوب تثبيتها.

| الملف                 | موضع أهميته                        | ما يعنيه                              |
| --------------------- | ---------------------------------- | ------------------------------------- |
| `pnpm-lock.yaml`      | نسخة شيفرة OpenClaw المصدرية       | مخطط التبعيات الخاص بالمشرفين         |
| `npm-shrinkwrap.json` | حزمة npm منشورة                    | مخطط تثبيت npm للمستخدمين             |
| `package-lock.json`   | تطبيقات npm المحلية                | ليس عقد النشر الخاص بـ OpenClaw       |

بالنسبة إلى إصدارات OpenClaw، يعني ذلك ما يلي:

- لا تطلب الحزمة المنشورة من npm إنشاء مخطط تبعيات جديد وقت التثبيت؛
- يمكن مراجعة تغييرات التبعيات لأنها تظهر في فرق ملف القفل؛
- يختبر التحقق من صحة الإصدار المخطط نفسه الذي سيثبّته المستخدمون؛
- تظهر مفاجآت حجم الحزمة أو التبعيات الأصلية قبل النشر.

لا يُعد Shrinkwrap بيئة معزولة. فهو لا يجعل التبعية آمنة بذاته، ولا يحل محل عزل المضيف أو `openclaw security audit` أو التحقق من منشأ الحزمة أو اختبارات التثبيت الأولية.

يعمل OpenClaw بوصفه Gateway ومضيف Plugins وموجّه نماذج وبيئة تشغيل للوكلاء، لذا يؤثر التثبيت الافتراضي في وقت بدء التشغيل واستخدام القرص وتنزيلات الحزم الأصلية والتعرض لمخاطر سلسلة التوريد. يوفّر Shrinkwrap حدًا ثابتًا لمراجعة الإصدار: يرى المراجعون حركة التبعيات الانتقالية، وترفض أدوات التحقق الانحراف غير المتوقع في ملف القفل، وتحمل حزم Plugins مخطط تبعياتها المقفول بدلًا من الاعتماد على الحزمة الجذرية.

## الإنشاء والتحقق

تتضمن حزمة npm الجذرية `openclaw` وحزم Plugins المملوكة لـ OpenClaw والمنشورة على npm (مثل `@openclaw/discord`) وحزم مساحة العمل القابلة للنشر، مثل [`@openclaw/ai`](/reference/openclaw-ai)، الملف `npm-shrinkwrap.json` عند نشرها. تُستبعد تبعيات مساحة العمل من ملف Shrinkwrap الجذري لأنها تُنشر إلى جانب الحزمة الجذرية؛ وبدلًا من ذلك، تثبّت كل حزمة قابلة للنشر في مساحة العمل شجرة تبعياتها الانتقالية الخاصة. ويمكن لحزم Plugins المناسبة أيضًا النشر باستخدام `bundledDependencies` صريحة، بحيث تحمل ملفات تبعيات وقت التشغيل داخل أرشيف Plugin بدلًا من الاعتماد فقط على الحل وقت التثبيت.

```bash
# جميع الحزم المُدارة بواسطة Shrinkwrap (الجذر + Plugins القابلة للنشر)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# الحزمة الجذرية فقط
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# الحزم المتأثرة فقط بمجموعة التغييرات الحالية
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

تستخرج أداة الإنشاء تنسيق القفل القابل للنشر الخاص بـ npm، لكنها ترفض إصدارات الحزم المُنشأة غير الموجودة مسبقًا في `pnpm-lock.yaml`. يحافظ ذلك على حدود مراجعة عمر تبعيات pnpm وعمليات التجاوز والتصحيحات.

راجع ما يلي بوصفه حساسًا أمنيًا:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- حمولات تبعيات Plugins المضمّنة
- أي فرق في `package-lock.json`

تتطلب أدوات التحقق من حزم OpenClaw وجود Shrinkwrap في أرشيفات الحزمة الجذرية الجديدة، وترفض `package-lock.json` للحزم المنشورة. يتحقق مسار نشر Plugins على npm من ملف Shrinkwrap المحلي الخاص بـ Plugin، ويثبّت التبعيات المضمّنة المحلية للحزمة، ثم يحزمها أو ينشرها.

## فحص حزمة منشورة

الحزمة الجذرية:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

حزمة Plugin:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

للمزيد من المعلومات: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
