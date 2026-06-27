---
read_when:
    - تريد التبديل بين stable/beta/dev
    - تريد تثبيت إصدار أو وسم أو SHA محدد
    - أنت تضع وسومًا للإصدارات التمهيدية أو تنشرها
sidebarTitle: Release Channels
summary: 'القنوات المستقرة والتجريبية والتطويرية: الدلالات والتبديل والتثبيت والوسم'
title: قنوات الإصدار
x-i18n:
    generated_at: "2026-06-27T17:50:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

توفّر OpenClaw ثلاث قنوات تحديث:

- **stable**: وسم توزيع npm `latest`. موصى بها لمعظم المستخدمين.
- **beta**: وسم توزيع npm `beta` عندما يكون حاليًا؛ إذا كان beta مفقودًا أو أقدم من
  أحدث إصدار stable، يعود مسار التحديث إلى `latest`.
- **dev**: الرأس المتحرك لفرع `main` (git). وسم توزيع npm: `dev` (عند نشره).
  فرع `main` مخصص للتجريب والتطوير النشط. قد يحتوي على
  ميزات غير مكتملة أو تغييرات كاسرة. لا تستخدمه في بوابات الإنتاج.

عادةً ننشر بُنى stable إلى **beta** أولًا، ونختبرها هناك، ثم نشغّل
خطوة ترقية صريحة تنقل البنية المُدقّقة إلى `latest` دون
تغيير رقم الإصدار. يمكن للمشرفين أيضًا نشر إصدار stable
مباشرةً إلى `latest` عند الحاجة. وسوم التوزيع هي مصدر الحقيقة لتثبيتات npm.

## تبديل القنوات

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

يحفظ `--channel` اختيارك في الإعدادات (`update.channel`) ويوائم
طريقة التثبيت:

- **`stable`** (تثبيتات الحزمة): تُحدَّث عبر وسم توزيع npm `latest`.
- **`beta`** (تثبيتات الحزمة): تفضّل وسم توزيع npm `beta`، لكنها تعود إلى
  `latest` عندما يكون `beta` مفقودًا أو أقدم من وسم stable الحالي.
- **`stable`** (تثبيتات git): تنتقل إلى أحدث وسم git لإصدار stable، مع استبعاد
  وسوم إصدارات semver التمهيدية مثل `-alpha.N`، و`-beta.N`، و`-rc.N`، و`-dev.N`،
  و`-next.N`، و`-preview.N`، و`-canary.N`، و`-nightly.N`، ولواحق الإصدارات التمهيدية
  الأخرى.
- **`beta`** (تثبيتات git): تفضّل أحدث وسم git لإصدار beta، لكنها تعود إلى
  أحدث وسم git لإصدار stable عندما يكون beta مفقودًا أو أقدم.
- **`dev`**: تضمن وجود نسخة git محلية (افتراضيًا `~/openclaw`، أو
  `$OPENCLAW_HOME/openclaw` عندما يكون `OPENCLAW_HOME` معيّنًا؛ ويمكن التجاوز عبر
  `OPENCLAW_GIT_DIR`)، وتبدّل إلى `main`، وتعيد التأسيس فوق upstream، وتبني،
  وتثبّت CLI العام من تلك النسخة المحلية.

<Tip>
إذا أردت تشغيل stable وdev بالتوازي، فاحتفظ بنسختين مستنسختين ووجّه بوابتك إلى نسخة stable.
</Tip>

## استهداف إصدار أو وسم لمرة واحدة

استخدم `--tag` لاستهداف وسم توزيع محدد، أو إصدار، أو مواصفة حزمة لتحديث واحد
**دون** تغيير قناتك المحفوظة:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

ملاحظات:

- ينطبق `--tag` على **تثبيتات الحزمة (npm) فقط**. تتجاهله تثبيتات git.
- لا يُحفَظ الوسم. يستخدم أمر `openclaw update` التالي القناة المضبوطة لديك
  كالمعتاد.
- في تثبيتات الحزمة، تُحضّر OpenClaw مواصفات مصدر GitHub/git مسبقًا في
  أرشيف tar مؤقت قبل تثبيت npm المرحلي. استخدم `--channel dev` أو
  `--install-method git --version main` عندما تريد نسخة `main` المتحركة
  كتثبيت دائم لديك.
- حماية الرجوع إلى إصدار أقدم: إذا كان الإصدار الهدف أقدم من إصدارك الحالي،
  تطلب OpenClaw التأكيد (يمكن التخطي باستخدام `--yes`).
- يختلف `--channel beta` عن `--tag beta`: يمكن لمسار القناة الرجوع إلى
  stable/latest عندما يكون beta مفقودًا أو أقدم، بينما يستهدف `--tag beta`
  وسم التوزيع الخام `beta` لذلك التشغيل الواحد.

## تشغيل تجريبي

عاين ما سيفعله `openclaw update` دون إجراء تغييرات:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

يعرض التشغيل التجريبي القناة الفعلية، والإصدار الهدف، والإجراءات المخططة، وما إذا
كان سيلزم تأكيد الرجوع إلى إصدار أقدم.

## Plugins والقنوات

عند تبديل القنوات باستخدام `openclaw update`، تزامن OpenClaw أيضًا مصادر Plugin:

- تفضّل `dev` حِزم Plugins المضمّنة من نسخة git المحلية.
- تستعيد `stable` و`beta` حزم Plugin المثبّتة عبر npm.
- تُحدَّث Plugins المثبّتة عبر npm بعد اكتمال تحديث النواة.

## التحقق من الحالة الحالية

```bash
openclaw update status
```

يعرض القناة النشطة، ونوع التثبيت (git أو حزمة)، والإصدار الحالي،
والمصدر (الإعدادات، أو وسم git، أو فرع git، أو الافتراضي).

## أفضل ممارسات الوسم

- ضع وسومًا للإصدارات التي تريد أن تصل إليها نسخ git المحلية (`vYYYY.M.PATCH` لإصدار stable،
  و`vYYYY.M.PATCH-beta.N` لإصدار beta؛ لواحق إصدارات semver التمهيدية المسماة مثل
  `-alpha.N`، و`-rc.N`، و`-next.N` ليست أهداف stable).
- لا تزال وسوم stable الرقمية القديمة مثل `vYYYY.M.PATCH-1` و`v1.0.1-1`
  معروفة كوسوم git لإصدارات stable من أجل التوافق.
- يُعرَف `vYYYY.M.PATCH.beta.N` أيضًا من أجل التوافق، لكن يُفضَّل `-beta.N`.
- أبقِ الوسوم غير قابلة للتغيير: لا تنقل وسمًا أو تعيد استخدامه أبدًا.
- تبقى وسوم توزيع npm مصدر الحقيقة لتثبيتات npm:
  - `latest` -> stable
  - `beta` -> بناء مرشح أو بناء stable يبدأ عبر beta
  - `dev` -> لقطة main (اختياري)

## توفر تطبيق macOS

قد **لا** تتضمن بُنى beta وdev إصدار تطبيق macOS. هذا مقبول:

- لا يزال من الممكن نشر وسم git ووسم توزيع npm.
- اذكر "لا توجد بنية macOS لهذا الإصدار beta" في ملاحظات الإصدار أو سجل التغييرات.

## ذات صلة

- [التحديث](/ar/install/updating)
- [تفاصيل المثبّت الداخلية](/ar/install/installer)
