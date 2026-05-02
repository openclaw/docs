---
read_when:
    - أنت تقوم بتصحيح أخطاء عمليات تثبيت حزم Plugin
    - أنت تغيّر سلوك بدء تشغيل Plugin أو الفحص أو التثبيت عبر مدير الحزم
    - أنت تصون تثبيتات OpenClaw المعبأة أو ملفات بيان Plugin المضمّنة
sidebarTitle: Dependencies
summary: كيفية تثبيت OpenClaw لحزم Plugin وحلّ اعتماديات Plugin
title: حل تبعيات Plugin
x-i18n:
    generated_at: "2026-05-02T20:50:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# حل تبعيات Plugin

يبقي OpenClaw عمل تبعيات Plugin في وقت التثبيت/التحديث. لا يقوم التحميل وقت التشغيل
بتشغيل مديري الحزم، أو إصلاح أشجار التبعيات، أو تعديل دليل حزمة OpenClaw.

## تقسيم المسؤوليات

تمتلك حزم Plugin مخطط تبعياتها:

- تبعيات وقت التشغيل تكون في `dependencies` أو `optionalDependencies` الخاصة بحزمة Plugin
- استيرادات SDK/core تكون أقرانًا أو استيرادات يوفرها OpenClaw
- Plugins التطوير المحلي تجلب تبعياتها المثبتة مسبقًا
- يتم تثبيت Plugins من npm وgit في جذور حزم مملوكة لـ OpenClaw

يمتلك OpenClaw دورة حياة Plugin فقط:

- اكتشاف مصدر Plugin
- تثبيت الحزمة أو تحديثها عند الطلب الصريح
- تسجيل بيانات تعريف التثبيت
- تحميل نقطة دخول Plugin
- الفشل بخطأ قابل للتنفيذ عندما تكون التبعيات مفقودة

## جذور التثبيت

يستخدم OpenClaw جذورًا مستقرة لكل مصدر:

- تُثبت حزم npm تحت `~/.openclaw/npm`
- تُستنسخ حزم git تحت `~/.openclaw/git`
- تُنسخ تثبيتات local/path/archive أو يُشار إليها دون إصلاح التبعيات

تُشغّل تثبيتات npm في جذر npm باستخدام:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

قد يرفع npm التبعيات المتعدية إلى `~/.openclaw/npm/node_modules` بجانب
حزمة Plugin. يفحص OpenClaw جذر npm المُدار قبل الوثوق بالتثبيت، ويستخدم npm لإزالة
الحزم المُدارة بواسطة npm أثناء إلغاء التثبيت، لذلك تبقى تبعيات وقت التشغيل المرفوعة
داخل حدود التنظيف المُدارة.

تقوم تثبيتات git باستنساخ المستودع أو تحديثه، ثم تشغيل:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

ثم يتم تحميل Plugin المثبت من دليل تلك الحزمة، لذلك يعمل حل `node_modules`
المحلي للحزمة والأب بالطريقة نفسها التي يعمل بها مع حزمة Node عادية.

## Plugins المحلية

تُعامل Plugins المحلية كأدلة يتحكم بها المطور. لا يقوم OpenClaw بتشغيل
`npm install` أو `pnpm install` أو إصلاح التبعيات لها. إذا كانت لدى Plugin محلية
تبعيات، فثبّتها داخل تلك Plugin قبل تحميلها.

يمكن لـ Plugins TypeScript المحلية التابعة لجهات خارجية استخدام مسار Jiti الطارئ. أما
Plugins JavaScript المعبأة وPlugins الداخلية المضمّنة فتُحمّل عبر
import/require الأصلي بدلًا من Jiti.

## بدء التشغيل وإعادة التحميل

لا يقوم بدء تشغيل Gateway ولا إعادة تحميل الإعدادات بتثبيت تبعيات Plugin. فهي تقرأ
سجلات تثبيت Plugin، وتحسب نقطة الدخول، وتحمّلها.

إذا كانت إحدى التبعيات مفقودة وقت التشغيل، تفشل Plugin في التحميل وينبغي أن يوجّه الخطأ
المشغّل إلى إصلاح صريح:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

يمكن لـ `doctor --fix` تنظيف حالة التبعيات القديمة التي أنشأها OpenClaw وتثبيت
Plugins القابلة للتنزيل والمكوّنة والمفقودة من سجلات التثبيت المحلية.
ولا يصلح التبعيات لـ Plugin محلية مثبتة مسبقًا.

## Plugins المضمّنة

تُشحن Plugins المضمّنة الخفيفة والحرجة للنواة كجزء من OpenClaw.
ينبغي أن تكون إما بلا شجرة تبعيات وقت تشغيل ثقيلة أو تُنقل إلى حزمة قابلة للتنزيل
على ClawHub/npm.

للاطلاع على القائمة المولّدة الحالية لـ Plugins التي تُشحن في حزمة النواة، أو تُثبت
خارجيًا، أو تبقى كمصدر فقط، راجع [جرد Plugin](/ar/plugins/plugin-inventory).

يجب ألا تطلب بيانات manifest الخاصة بـ Plugins المضمّنة تهيئة التبعيات. ينبغي تعبئة
وظائف Plugin الكبيرة أو الاختيارية كـ Plugin عادية وتثبيتها عبر مسار
npm/git/ClawHub نفسه مثل Plugins الجهات الخارجية.

في نسخ المصدر، يتعامل OpenClaw مع المستودع على أنه pnpm monorepo. بعد
`pnpm install`، تُحمّل Plugins المضمّنة من `extensions/<id>` بحيث تكون
تبعيات workspace المحلية للحزمة متاحة وتُلتقط التعديلات مباشرة. تطوير نسخة المصدر
يدعم pnpm فقط؛ ولا يُعد تشغيل `npm install` عاديًا في جذر المستودع طريقة مدعومة
لتحضير تبعيات Plugins المضمّنة.

| شكل التثبيت                    | موقع Plugin المضمّنة               | مالك التبعية                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | شجرة وقت تشغيل مبنية داخل الحزمة | حزمة OpenClaw وتدفقات تثبيت/تحديث/doctor الصريحة لـ Plugin     |
| نسخة git مع `pnpm install` | حزم workspace في `extensions/<id>`  | pnpm workspace، بما في ذلك تبعيات كل حزمة Plugin الخاصة بها |
| `openclaw plugins install ...`   | جذر Plugin مُدار لـ npm/git/ClawHub   | تدفق تثبيت/تحديث Plugin                                       |

## تنظيف القديم

كانت إصدارات OpenClaw الأقدم تنشئ جذور تبعيات Plugins المضمّنة عند بدء التشغيل أو
أثناء إصلاح doctor. يزيل تنظيف doctor الحالي تلك الأدلة والروابط الرمزية القديمة عند
استخدام `--fix`، بما في ذلك جذور `plugin-runtime-deps` القديمة،
وبيانات manifest من نوع `.openclaw-runtime-deps*`، و`node_modules` الخاصة بـ Plugin
المولّدة، وأدلة مراحل التثبيت، ومخازن pnpm المحلية للحزمة.

هذه المسارات بقايا قديمة فقط. ينبغي ألا تنشئها التثبيتات الجديدة.
