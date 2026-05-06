---
read_when:
    - أنت تصحح أخطاء تثبيت حزم Plugin
    - أنت تغيّر سلوك بدء تشغيل Plugin أو doctor أو التثبيت عبر مدير الحزم
    - أنت تدير صيانة عمليات تثبيت OpenClaw المعبأة أو ملفات بيان Plugin المضمّنة
sidebarTitle: Dependencies
summary: كيفية تثبيت OpenClaw لحزم Plugin وحل تبعيات Plugin
title: حل تبعيات Plugin
x-i18n:
    generated_at: "2026-05-06T19:35:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

يحافظ OpenClaw على عمل تبعيات Plugin في وقت التثبيت/التحديث. لا يقوم التحميل في وقت التشغيل بتشغيل مديري الحزم، أو إصلاح أشجار التبعيات، أو تعديل دليل حزمة OpenClaw.

## تقسيم المسؤوليات

تمتلك حزم Plugin مخطط تبعياتها:

- تبعيات وقت التشغيل موجودة في `dependencies` أو `optionalDependencies` الخاصة بحزمة Plugin
- استيرادات SDK/النواة تكون peer أو استيرادات OpenClaw موفّرة
- Plugins التطوير المحلية تجلب تبعياتها المثبّتة مسبقًا
- تُثبّت Plugins الخاصة بـ npm وgit داخل جذور حزم مملوكة لـ OpenClaw

يمتلك OpenClaw دورة حياة Plugin فقط:

- اكتشاف مصدر Plugin
- تثبيت الحزمة أو تحديثها عند طلب ذلك صراحةً
- تسجيل بيانات تعريف التثبيت
- تحميل نقطة دخول Plugin
- الفشل مع خطأ قابل للإجراء عند فقدان التبعيات

## جذور التثبيت

يستخدم OpenClaw جذورًا ثابتة لكل مصدر:

- تُثبّت حزم npm تحت `~/.openclaw/npm`
- تُستنسخ حزم git تحت `~/.openclaw/git`
- تُنسخ تثبيتات local/path/archive أو يُشار إليها دون إصلاح التبعيات

تعمل تثبيتات npm في جذر npm باستخدام:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

يستخدم `openclaw plugins install npm-pack:<path.tgz>` جذر npm المُدار نفسه
لملف tarball محلي من نوع npm-pack. يقرأ OpenClaw بيانات تعريف npm الخاصة بملف tarball، ويضيفه
إلى الجذر المُدار كتابعية `file:` منسوخة، ثم يشغّل تثبيت npm المعتاد،
وبعدها يتحقق من بيانات تعريف lockfile المثبّت قبل الوثوق بـ Plugin.
هذا مخصص لإثبات قبول الحزمة وإصدارات release-candidate حيث يجب أن يتصرف
أثر pack المحلي مثل أثر السجل الذي يحاكيه.

قد يرفع npm التبعيات الانتقالية إلى `~/.openclaw/npm/node_modules` بجانب
حزمة Plugin. يفحص OpenClaw جذر npm المُدار قبل الوثوق
بالتثبيت ويستخدم npm لإزالة الحزم المُدارة بواسطة npm أثناء إلغاء التثبيت، لذلك تبقى
تبعيات وقت التشغيل المرفوعة داخل حدود التنظيف المُدارة.

تعلن Plugins التي تستورد `openclaw/plugin-sdk/*` عن `openclaw` كتابعية peer.
لا يسمح OpenClaw لـ npm بتثبيت نسخة سجل منفصلة من حزمة
المضيف داخل الجذر المُدار، لأن حزم المضيف القديمة يمكن أن تؤثر في
حل peer الخاص بـ npm أثناء تثبيتات Plugin اللاحقة. تتجاوز تثبيتات npm المُدارة
حل/تجسيد peer الخاص بـ npm للجذر المشترك، ويعيد OpenClaw تأكيد روابط
`node_modules/openclaw` المحلية لكل Plugin للحزم المثبّتة التي تعلن
عن peer المضيف بعد التثبيت أو التحديث أو إلغاء التثبيت.

تستنسخ تثبيتات git المستودع أو تحدّثه، ثم تشغّل:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

ثم يُحمّل Plugin المثبّت من دليل تلك الحزمة، لذلك يعمل حل
`node_modules` المحلي للحزمة والأب بالطريقة نفسها التي يعمل بها لحزمة
Node عادية.

## Plugins المحلية

تُعامل Plugins المحلية كدلائل يتحكم بها المطور. لا يقوم OpenClaw
بتشغيل `npm install` أو `pnpm install` أو إصلاح التبعيات لها. إذا كان لدى
Plugin محلي تبعيات، فثبّتها في ذلك Plugin قبل تحميله.

يمكن لـ Plugins TypeScript المحلية التابعة لجهات خارجية استخدام مسار Jiti الطارئ. تُحمّل
Plugins JavaScript المحزّمة وPlugins الداخلية المضمّنة عبر
import/require الأصليين بدلًا من Jiti.

## بدء التشغيل وإعادة التحميل

لا يثبّت بدء تشغيل Gateway وإعادة تحميل الإعدادات تبعيات Plugin أبدًا. يقرآن
سجلات تثبيت Plugin، ويحسبان نقطة الدخول، ويحمّلانها.

إذا كانت إحدى التبعيات مفقودة في وقت التشغيل، يفشل تحميل Plugin ويجب
أن يوجه الخطأ المشغّل إلى إصلاح صريح:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

يمكن لـ `doctor --fix` تنظيف حالة التبعيات القديمة التي أنشأها OpenClaw واسترداد
Plugins القابلة للتنزيل المفقودة من سجلات التثبيت المحلية عندما تشير إليها الإعدادات.
لا يصلح Doctor التبعيات لـ Plugin محلي مثبّت بالفعل.

## Plugins المضمّنة

تُشحن Plugins الخفيفة والحرجة للنواة كجزء من OpenClaw.
يجب إما ألا تحتوي على شجرة تبعيات وقت تشغيل ثقيلة، أو أن تُنقل إلى
حزمة قابلة للتنزيل على ClawHub/npm.

للاطلاع على القائمة الحالية المُولّدة لـ Plugins التي تُشحن في حزمة النواة، أو تُثبّت
خارجيًا، أو تبقى مصدرية فقط، راجع [مخزون Plugin](/ar/plugins/plugin-inventory).

يجب ألا تطلب بيانات manifest الخاصة بـ Plugin المضمّن staging للتبعيات. يجب
تحزيم وظيفة Plugin الكبيرة أو الاختيارية كـ Plugin عادي وتثبيتها عبر
مسار npm/git/ClawHub نفسه مثل Plugins الجهات الخارجية.

في source checkouts، يعامل OpenClaw المستودع كـ pnpm monorepo. بعد
`pnpm install`، تُحمّل Plugins المضمّنة من `extensions/<id>` بحيث تكون تبعيات
workspace المحلية للحزمة متاحة ويتم التقاط التعديلات مباشرة. تطوير
source checkout هو pnpm-only؛ لا يُعد `npm install` العادي في جذر المستودع
طريقة مدعومة لتحضير تبعيات Plugin المضمّن.

| شكل التثبيت                    | موقع Plugin المضمّن               | مالك التبعية                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | شجرة وقت التشغيل المبنية داخل الحزمة | حزمة OpenClaw وتدفقات تثبيت/تحديث/doctor الصريحة لـ Plugin     |
| Git checkout plus `pnpm install` | حزم workspace في `extensions/<id>`  | pnpm workspace، بما في ذلك تبعيات كل حزمة Plugin الخاصة |
| `openclaw plugins install ...`   | جذر Plugin مُدار لـ npm/git/ClawHub   | تدفق تثبيت/تحديث Plugin                                       |

## تنظيف الإرث

أنشأت إصدارات OpenClaw الأقدم جذور تبعيات Plugin المضمّن عند بدء التشغيل أو
أثناء إصلاح doctor. يزيل تنظيف doctor الحالي تلك الأدلة القديمة
والروابط الرمزية عند استخدام `--fix`، بما في ذلك جذور `plugin-runtime-deps` القديمة، والروابط الرمزية
لحزم Node-prefix العامة التي تشير إلى أهداف `plugin-runtime-deps` المشذّبة،
وبيانات manifest من نوع `.openclaw-runtime-deps*`، و`node_modules` الخاصة بـ Plugin المُولّدة، وأدلة
مرحلة التثبيت، ومخازن pnpm المحلية للحزمة. يزيل postinstall المحزّم أيضًا
تلك الروابط الرمزية العامة قبل تشذيب جذور الأهداف القديمة لكي لا تترك الترقيات
استيرادات حزم ESM معلّقة.

هذه المسارات مجرد بقايا قديمة. يجب ألا تنشئها التثبيتات الجديدة.
