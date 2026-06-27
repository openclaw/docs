---
read_when:
    - تريد معرفة ما يعنيه npm shrinkwrap في إصدار OpenClaw
    - أنت تراجع ملفات قفل الحزم أو تغييرات التبعيات أو مخاطر سلسلة التوريد
    - أنت تتحقق من حزم npm الجذرية أو حزم Plugin قبل النشر
summary: شرح بلغة مبسطة وشرح تقني لـ npm shrinkwrap في إصدارات OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:44:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw source checkouts تستخدم `pnpm-lock.yaml`. أما حزم OpenClaw المنشورة على npm
فتستخدم `npm-shrinkwrap.json`، وهو ملف قفل التبعيات القابل للنشر في npm، بحيث
تستخدم عمليات تثبيت الحزم مخطط التبعيات الذي تمت مراجعته أثناء الإصدار.

## النسخة السهلة

Shrinkwrap هو إيصال لشجرة التبعيات التي تُشحن مع حزمة npm.
وهو يخبر npm بإصدارات الحزم الانتقالية الدقيقة التي يجب تثبيتها.

بالنسبة إلى إصدارات OpenClaw، يعني ذلك:

- لا تطلب الحزمة المنشورة من npm اختراع مخطط تبعيات جديد أثناء
  وقت التثبيت؛
- تصبح تغييرات التبعيات أسهل في المراجعة لأنها تظهر في ملف قفل؛
- يمكن للتحقق من الإصدار اختبار المخطط نفسه الذي سيثبته المستخدمون؛
- تصبح مفاجآت حجم الحزمة أو التبعيات الأصلية أسهل في الاكتشاف قبل
  النشر.

Shrinkwrap ليس صندوقًا معزولًا. فهو لا يجعل التبعية آمنة بحد ذاته، ولا
يستبدل عزل المضيف، أو `openclaw security audit`، أو منشأ الحزمة،
أو اختبارات تثبيت الدخان.

النموذج الذهني المختصر:

| الملف                  | أين يهم                  | ما الذي يعنيه                     |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw source checkout | مخطط تبعيات المشرفين              |
| `npm-shrinkwrap.json` | حزمة npm منشورة          | مخطط تثبيت npm للمستخدمين         |
| `package-lock.json`   | تطبيقات npm المحلية      | ليس عقد نشر OpenClaw              |

## لماذا يستخدمه OpenClaw

OpenClaw هو Gateway، ومضيف Plugin، وموجّه نماذج، وبيئة تشغيل للوكلاء. يمكن
أن يؤثر التثبيت الافتراضي في وقت بدء التشغيل، واستخدام القرص، وتنزيلات الحزم
الأصلية، والتعرض لسلسلة التوريد.

يوفر Shrinkwrap حدًا مستقرًا لمراجعة الإصدار:

- يستطيع المراجعون رؤية حركة التبعيات الانتقالية؛
- تستطيع أدوات التحقق من الحزم رفض الانحراف غير المتوقع في ملف القفل؛
- يمكن لقبول الحزم اختبار التثبيتات بالمخطط الذي سيُشحن؛
- يمكن لحزم Plugin حمل مخطط تبعياتها المقفل بدلًا من
  الاعتماد على الحزمة الجذرية لامتلاك تبعيات Plugin فقط.

الهدف ليس "المزيد من ملفات القفل". الهدف هو تثبيتات إصدارات قابلة لإعادة الإنتاج
مع ملكية واضحة.

## التفاصيل التقنية

تتضمن حزمة npm الجذرية `openclaw` وحزم npm الخاصة بـ Plugin المملوكة لـ OpenClaw
ملف `npm-shrinkwrap.json` عند نشرها. يمكن أيضًا لحزم Plugin المناسبة والمملوكة لـ OpenClaw
النشر مع `bundledDependencies` صريحة، بحيث تُحمل ملفات تبعيات وقت التشغيل الخاصة بها
داخل أرشيف Plugin بدلًا من الاعتماد فقط على حل التبعيات وقت التثبيت.

حافظ على هذا الحد بهذا الشكل:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

ينشئ المولّد صيغة القفل القابلة للنشر في npm، لكنه يرفض إصدارات الحزم
المولدة غير الموجودة أصلًا في `pnpm-lock.yaml`. وهذا يحافظ على حد عمر
تبعيات pnpm، والتجاوزات، ومراجعة التصحيحات كما هو.

استخدم أوامر الجذر فقط عند تحديث الحزمة الجذرية عمدًا
دون لمس حزم Plugin:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

راجع هذه الملفات باعتبارها حساسة أمنيًا:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- حمولات تبعيات Plugin المضمّنة
- أي فرق في `package-lock.json`

تتطلب أدوات التحقق من حزم OpenClaw وجود shrinkwrap في أرشيفات الحزمة الجذرية الجديدة.
يتحقق مسار نشر Plugin على npm من shrinkwrap المحلي داخل Plugin، ويثبت
التبعيات المضمّنة المحلية للحزمة، ثم يحزم أو ينشر. ترفض أدوات التحقق من الحزم
`package-lock.json` للحزم المنشورة من OpenClaw.

لفحص حزمة جذرية منشورة:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

لفحص حزمة Plugin مملوكة لـ OpenClaw:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

الخلفية: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
