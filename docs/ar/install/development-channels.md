---
read_when:
    - تريد التبديل بين stable/beta/dev
    - تريد تثبيت إصدار أو وسم أو SHA محدد
    - أنت تقوم بوسم أو نشر إصدارات prerelease
sidebarTitle: Release Channels
summary: 'قنوات stable وbeta وdev: الدلالات والتبديل والتثبيت والوسوم'
title: قنوات الإصدار
x-i18n:
    generated_at: "2026-04-24T07:47:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# قنوات التطوير

يشحن OpenClaw ثلاث قنوات تحديث:

- **stable**: وسم npm dist-tag ‏`latest`. موصى بها لمعظم المستخدمين.
- **beta**: وسم npm dist-tag ‏`beta` عندما يكون حاليًا؛ وإذا كانت beta مفقودة أو أقدم من
  أحدث إصدار stable، فإن تدفق التحديث يرجع إلى `latest`.
- **dev**: الرأس المتحرك للفرع `main` ‏(git). وسم npm dist-tag: ‏`dev` ‏(عند نشره).
  يُستخدم الفرع `main` للتجربة والتطوير النشط. وقد يحتوي على
  ميزات غير مكتملة أو تغييرات كاسرة. لا تستخدمه لـ Gateways الإنتاجية.

نقوم عادةً بشحن الإصدارات stable إلى **beta** أولًا، ونختبرها هناك، ثم نشغّل
خطوة ترقية صريحة تنقل الإصدار المُعتمد إلى `latest` من دون
تغيير رقم الإصدار. ويمكن للمشرفين أيضًا نشر إصدار stable
مباشرة إلى `latest` عند الحاجة. وتُعد dist-tags مصدر الحقيقة
لعمليات التثبيت عبر npm.

## التبديل بين القنوات

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

تؤدي `--channel` إلى حفظ اختيارك في الإعدادات (`update.channel`) ومواءمة
طريقة التثبيت:

- **`stable`** ‏(عمليات التثبيت عبر الحزم): يتم التحديث عبر npm dist-tag ‏`latest`.
- **`beta`** ‏(عمليات التثبيت عبر الحزم): تفضّل npm dist-tag ‏`beta`، لكنها ترجع إلى
  `latest` عندما تكون `beta` مفقودة أو أقدم من وسم stable الحالي.
- **`stable`** ‏(عمليات التثبيت عبر git): يتم التبديل إلى أحدث وسم git مستقر.
- **`beta`** ‏(عمليات التثبيت عبر git): تفضّل أحدث وسم git خاص بـ beta، لكنها ترجع إلى
  أحدث وسم git مستقر عندما تكون beta مفقودة أو أقدم.
- **`dev`**: يضمن وجود git checkout ‏(الافتراضي `~/openclaw`، ويمكن تجاوزه عبر
  `OPENCLAW_GIT_DIR`)، ويبدّل إلى `main`، ويعيد الأساس إلى upstream، ويبني،
  ويثبت CLI العام من تلك النسخة.

نصيحة: إذا كنت تريد stable + dev بالتوازي، فاحتفظ بنسختين موجّهتين ووجّه
gateway إلى النسخة المستقرة.

## استهداف إصدار أو وسم لمرة واحدة

استخدم `--tag` لاستهداف dist-tag أو إصدار أو مواصفة حزمة محددة لتحديث واحد
**من دون** تغيير القناة المحفوظة لديك:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

ملاحظات:

- تنطبق `--tag` على **عمليات التثبيت عبر الحزم (npm) فقط**. وتتجاهلها عمليات التثبيت عبر git.
- لا يتم حفظ الوسم. وسيستخدم `openclaw update` التالي قناتك المضبوطة
  كالمعتاد.
- الحماية من الرجوع إلى إصدار أقدم: إذا كان الإصدار المستهدف أقدم من إصدارك الحالي،
  فسيطلب OpenClaw تأكيدًا (يمكن التخطي باستخدام `--yes`).
- تختلف `--channel beta` عن `--tag beta`: إذ يمكن لتدفق القناة أن يرجع
  إلى stable/latest عندما تكون beta مفقودة أو أقدم، بينما تستهدف `--tag beta`
  وسم dist-tag الخام `beta` لتلك العملية فقط.

## التشغيل التجريبي

عاين ما الذي سيفعله `openclaw update` من دون إجراء تغييرات:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

يعرض التشغيل التجريبي القناة الفعلية، والإصدار المستهدف، والإجراءات المخططة،
وما إذا كان سيلزم تأكيد الرجوع إلى إصدار أقدم.

## Plugins والقنوات

عندما تبدّل القنوات باستخدام `openclaw update`، يقوم OpenClaw أيضًا بمزامنة
مصادر Plugins:

- يفضّل `dev` Plugins المضمّنة من git checkout.
- تستعيد `stable` و`beta` حزم Plugins المثبتة عبر npm.
- يتم تحديث Plugins المثبتة عبر npm بعد اكتمال تحديث النواة.

## التحقق من الحالة الحالية

```bash
openclaw update status
```

يعرض القناة النشطة، ونوع التثبيت (git أو package)، والإصدار الحالي،
والمصدر (config، أو git tag، أو git branch، أو default).

## أفضل ممارسات الوسوم

- قم بوسم الإصدارات التي تريد أن تصل إليها نسخ git checkout ‏(`vYYYY.M.D` للإصدارات stable،
  و`vYYYY.M.D-beta.N` للإصدارات beta).
- يتم أيضًا التعرف على `vYYYY.M.D.beta.N` للتوافق، لكن فضّل `-beta.N`.
- لا تزال الوسوم القديمة `vYYYY.M.D-<patch>` معترفًا بها على أنها stable ‏(غير beta).
- أبقِ الوسوم غير قابلة للتغيير: لا تنقل وسمًا ولا تعيد استخدامه مطلقًا.
- تظل npm dist-tags مصدر الحقيقة لعمليات التثبيت عبر npm:
  - `latest` -> stable
  - `beta` -> بنية مرشحة أو بنية stable تُطرح أولًا إلى beta
  - `dev` -> لقطة من `main` ‏(اختياري)

## توفر تطبيق macOS

قد **لا** تتضمن إصدارات beta وdev إصدار تطبيق macOS. وهذا أمر مقبول:

- لا يزال من الممكن نشر git tag وnpm dist-tag.
- اذكر "لا يوجد إصدار macOS لهذا الإصدار beta" في ملاحظات الإصدار أو سجل التغييرات.

## ذو صلة

- [التحديث](/ar/install/updating)
- [الأجزاء الداخلية للمثبّت](/ar/install/installer)
