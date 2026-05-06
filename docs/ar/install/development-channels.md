---
read_when:
    - تريد التبديل بين المستقر/بيتا/التطوير
    - تريد تثبيت إصدار محدد أو وسم أو SHA
    - أنت تضع وسومًا للإصدارات التمهيدية أو تنشرها
sidebarTitle: Release Channels
summary: 'قنوات الإصدار المستقر والبيتا والتطوير: الدلالات، والتبديل، والتثبيت، ووضع العلامات'
title: قنوات الإصدار
x-i18n:
    generated_at: "2026-05-06T08:00:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

يوفر OpenClaw ثلاث قنوات تحديث:

- **stable**: وسم توزيع npm ‏`latest`. موصى بها لمعظم المستخدمين.
- **beta**: وسم توزيع npm ‏`beta` عندما يكون حديثًا؛ إذا كان beta مفقودًا أو أقدم من
  أحدث إصدار stable، يعود مسار التحديث إلى `latest`.
- **dev**: الرأس المتحرك لفرع `main` (git). وسم توزيع npm: ‏`dev` (عند النشر).
  فرع `main` مخصص للتجريب والتطوير النشط. قد يحتوي على
  ميزات غير مكتملة أو تغييرات كاسرة. لا تستخدمه لـ gateways الإنتاجية.

نصدر عادةً إصدارات stable إلى **beta** أولًا، ونختبرها هناك، ثم نشغّل
خطوة ترقية صريحة تنقل الإصدار المراجع إلى `latest` من دون
تغيير رقم الإصدار. يمكن للمشرفين أيضًا نشر إصدار stable
مباشرةً إلى `latest` عند الحاجة. وسوم التوزيع هي مصدر الحقيقة لعمليات تثبيت npm.

## تبديل القنوات

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

يحفظ `--channel` اختيارك في الإعدادات (`update.channel`) ويوائم
طريقة التثبيت:

- **`stable`** (تثبيتات الحزمة): يتم التحديث عبر وسم توزيع npm ‏`latest`.
- **`beta`** (تثبيتات الحزمة): يفضّل وسم توزيع npm ‏`beta`، لكنه يعود إلى
  `latest` عندما يكون `beta` مفقودًا أو أقدم من وسم stable الحالي.
- **`stable`** (تثبيتات git): ينتقل إلى أحدث وسم git لإصدار stable.
- **`beta`** (تثبيتات git): يفضّل أحدث وسم git لإصدار beta، لكنه يعود إلى
  أحدث وسم git لإصدار stable عندما يكون beta مفقودًا أو أقدم.
- **`dev`**: يضمن وجود checkout من git (الافتراضي `~/openclaw`، ويمكن تجاوزه باستخدام
  `OPENCLAW_GIT_DIR`)، وينتقل إلى `main`، ويعيد التأسيس على upstream، ويبني،
  ويثبت CLI العام من ذلك checkout.

<Tip>
إذا أردت تشغيل stable وdev بالتوازي، فاحتفظ بنسختين مستنسختين ووجّه gateway لديك إلى نسخة stable.
</Tip>

## استهداف إصدار أو وسم لمرة واحدة

استخدم `--tag` لاستهداف وسم توزيع محدد، أو إصدار، أو مواصفة حزمة لتحديث واحد
**من دون** تغيير قناتك المحفوظة:

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

- ينطبق `--tag` على **تثبيتات الحزمة (npm) فقط**. تتجاهله تثبيتات git.
- لا يتم حفظ الوسم. يستخدم أمر `openclaw update` التالي لديك القناة المضبوطة
  كالمعتاد.
- حماية الرجوع إلى إصدار أقدم: إذا كان الإصدار المستهدف أقدم من إصدارك الحالي،
  يطلب OpenClaw التأكيد (يمكن التخطي باستخدام `--yes`).
- يختلف `--channel beta` عن `--tag beta`: يمكن لمسار القناة الرجوع إلى
  stable/latest عندما يكون beta مفقودًا أو أقدم، بينما يستهدف `--tag beta`
  وسم التوزيع الخام `beta` لذلك التشغيل الواحد.

## تشغيل تجريبي

عاين ما سيفعله `openclaw update` من دون إجراء تغييرات:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

يعرض التشغيل التجريبي القناة الفعلية، والإصدار المستهدف، والإجراءات المخطط لها، وما إذا كان
سيلزم تأكيد الرجوع إلى إصدار أقدم.

## Plugins والقنوات

عندما تبدّل القنوات باستخدام `openclaw update`، يزامن OpenClaw أيضًا
مصادر Plugin:

- يفضّل `dev` الـ Plugins المضمنة من checkout الخاص بـ git.
- يعيد `stable` و`beta` حزم Plugin المثبتة عبر npm.
- يتم تحديث الـ Plugins المثبتة عبر npm بعد اكتمال تحديث النواة.

## التحقق من الحالة الحالية

```bash
openclaw update status
```

يعرض القناة النشطة، ونوع التثبيت (git أو حزمة)، والإصدار الحالي، و
المصدر (إعدادات، أو وسم git، أو فرع git، أو الافتراضي).

## أفضل ممارسات وضع الوسوم

- ضع وسومًا للإصدارات التي تريد أن تصل إليها checkouts الخاصة بـ git (`vYYYY.M.D` لـ stable،
  و`vYYYY.M.D-beta.N` لـ beta).
- يتم التعرف أيضًا على `vYYYY.M.D.beta.N` للتوافق، لكن يفضّل استخدام `-beta.N`.
- لا تزال وسوم `vYYYY.M.D-<patch>` القديمة معروفة كإصدارات stable (غير beta).
- أبقِ الوسوم غير قابلة للتغيير: لا تنقل وسمًا أو تعيد استخدامه أبدًا.
- تظل وسوم توزيع npm مصدر الحقيقة لتثبيتات npm:
  - `latest` -> stable
  - `beta` -> إصدار مرشح أو إصدار stable منشور أولًا إلى beta
  - `dev` -> لقطة main (اختياري)

## توفر تطبيق macOS

قد **لا** تتضمن إصدارات beta وdev إصدار تطبيق macOS. لا بأس بذلك:

- يمكن مع ذلك نشر وسم git ووسم توزيع npm.
- اذكر "لا يوجد بناء macOS لهذا الإصدار beta" في ملاحظات الإصدار أو سجل التغييرات.

## ذات صلة

- [التحديث](/ar/install/updating)
- [البنية الداخلية للمثبّت](/ar/install/installer)
