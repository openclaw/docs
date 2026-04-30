---
read_when:
    - تريد التبديل بين المستقر/التجريبي/التطوير
    - تريد تثبيت إصدار أو وسم أو SHA محدد
    - أنت تضع وسومًا للإصدارات المسبقة أو تنشرها
sidebarTitle: Release Channels
summary: 'قنوات الإصدار المستقر والتجريبي والتطويري: الدلالات، والتبديل، والتثبيت، والوسم'
title: قنوات الإصدار
x-i18n:
    generated_at: "2026-04-30T08:06:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# قنوات التطوير

يوفّر OpenClaw ثلاث قنوات تحديث:

- **stable**: وسم توزيع npm ‏`latest`. موصى بها لمعظم المستخدمين.
- **beta**: وسم توزيع npm ‏`beta` عندما يكون حاليًا؛ إذا كان beta مفقودًا أو أقدم من
  أحدث إصدار مستقر، يعود مسار التحديث إلى `latest`.
- **dev**: الرأس المتحرك للفرع `main` (git). وسم توزيع npm: ‏`dev` (عند نشره).
  فرع `main` مخصص للتجريب والتطوير النشط. قد يحتوي على
  ميزات غير مكتملة أو تغييرات كاسرة. لا تستخدمه لبوابات الإنتاج.

عادةً ننشر إصدارات مستقرة إلى **beta** أولًا، ونختبرها هناك، ثم نشغّل خطوة
ترقية صريحة تنقل الإصدار المفحوص إلى `latest` من دون
تغيير رقم الإصدار. يمكن للمشرفين أيضًا نشر إصدار مستقر
مباشرةً إلى `latest` عند الحاجة. وسوم التوزيع هي مصدر الحقيقة لتثبيتات npm.

## تبديل القنوات

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

يحفظ `--channel` اختيارك في الإعدادات (`update.channel`) ويوائم
طريقة التثبيت:

- **`stable`** (تثبيتات الحزمة): يحدّث عبر وسم توزيع npm ‏`latest`.
- **`beta`** (تثبيتات الحزمة): يفضّل وسم توزيع npm ‏`beta`، لكنه يعود إلى
  `latest` عندما يكون `beta` مفقودًا أو أقدم من وسم stable الحالي.
- **`stable`** (تثبيتات git): ينتقل إلى أحدث وسم git مستقر.
- **`beta`** (تثبيتات git): يفضّل أحدث وسم git تجريبي، لكنه يعود إلى
  أحدث وسم git مستقر عندما يكون beta مفقودًا أو أقدم.
- **`dev`**: يضمن وجود checkout من git (الافتراضي `~/openclaw`، ويمكن تجاوزه باستخدام
  `OPENCLAW_GIT_DIR`)، وينتقل إلى `main`، ويعيد تأسيسه على upstream، ويبني، ثم
  يثبّت CLI العام من ذلك checkout.

<Tip>
إذا كنت تريد stable وdev بالتوازي، فاحتفظ بنسختين مستنسختين ووجّه Gateway إلى النسخة المستقرة.
</Tip>

## استهداف إصدار أو وسم لمرة واحدة

استخدم `--tag` لاستهداف وسم توزيع أو إصدار أو مواصفة حزمة محددة لتحديث واحد
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
- لا يُحفظ الوسم. يستخدم أمر `openclaw update` التالي القناة المضبوطة لديك
  كالمعتاد.
- الحماية من الرجوع إلى إصدار أقدم: إذا كان الإصدار الهدف أقدم من إصدارك الحالي،
  يطلب OpenClaw التأكيد (يمكن التجاوز باستخدام `--yes`).
- يختلف `--channel beta` عن `--tag beta`: يمكن لمسار القناة أن يعود إلى
  stable/latest عندما يكون beta مفقودًا أو أقدم، بينما يستهدف `--tag beta`
  وسم توزيع `beta` الخام لذلك التشغيل الواحد.

## تشغيل تجريبي

عاين ما سيفعله `openclaw update` من دون إجراء تغييرات:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

يعرض التشغيل التجريبي القناة الفعلية، والإصدار الهدف، والإجراءات المخططة، وما إذا كان
تأكيد الرجوع إلى إصدار أقدم سيكون مطلوبًا.

## Plugins والقنوات

عندما تبدّل القنوات باستخدام `openclaw update`، يزامن OpenClaw أيضًا مصادر Plugin:

- يفضّل `dev` Plugins المضمّنة من checkout الخاص بـ git.
- تستعيد `stable` و`beta` حزم Plugin المثبتة عبر npm.
- تُحدّث Plugins المثبتة عبر npm بعد اكتمال تحديث النواة.

## التحقق من الحالة الحالية

```bash
openclaw update status
```

يعرض القناة النشطة، ونوع التثبيت (git أو حزمة)، والإصدار الحالي، والمصدر
(الإعدادات، وسم git، فرع git، أو الافتراضي).

## أفضل ممارسات الوسم

- ضع وسومًا للإصدارات التي تريد أن تصل إليها عمليات checkout عبر git (`vYYYY.M.D` للمستقر،
  و`vYYYY.M.D-beta.N` للـ beta).
- يُتعرّف أيضًا على `vYYYY.M.D.beta.N` للتوافق، لكن يُفضّل `-beta.N`.
- ما زال يُتعرّف على وسوم `vYYYY.M.D-<patch>` القديمة كمستقرة (غير beta).
- أبقِ الوسوم غير قابلة للتغيير: لا تنقل وسمًا أو تعيد استخدامه أبدًا.
- تظل وسوم توزيع npm مصدر الحقيقة لتثبيتات npm:
  - `latest` -> stable
  - `beta` -> إصدار مرشح أو إصدار مستقر يبدأ من beta
  - `dev` -> لقطة من main (اختياري)

## توفر تطبيق macOS

قد **لا** تتضمن إصدارات beta وdev إصدار تطبيق macOS. هذا مقبول:

- لا يزال من الممكن نشر وسم git ووسم توزيع npm.
- اذكر "لا يوجد بناء macOS لهذا الإصدار beta" في ملاحظات الإصدار أو سجل التغييرات.

## ذو صلة

- [التحديث](/ar/install/updating)
- [تفاصيل المثبّت الداخلية](/ar/install/installer)
