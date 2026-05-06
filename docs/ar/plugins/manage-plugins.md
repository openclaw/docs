---
read_when:
    - تريد أمثلة سريعة على تثبيت Plugin أو سرده أو تحديثه أو إلغاء تثبيته
    - تريد الاختيار بين ClawHub وتوزيع Plugin عبر npm
    - أنت تنشر حزمة Plugin
sidebarTitle: Manage plugins
summary: أمثلة سريعة لتثبيت Plugins الخاصة بـ OpenClaw وسردها وإلغاء تثبيتها وتحديثها ونشرها
title: إدارة Plugins
x-i18n:
    generated_at: "2026-05-06T18:01:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

معظم سير عمل Plugin هي بضعة أوامر: البحث، والتثبيت، وإعادة تشغيل Gateway،
والتحقق، وإلغاء التثبيت عندما لا تعود بحاجة إلى Plugin.

## سرد Plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

استخدم `--json` للسكربتات. يتضمن ذلك تشخيصات السجل وحالة
`dependencyStatus` الثابتة لكل Plugin عندما تعلن حزمة Plugin عن `dependencies` أو
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` هو فحص مخزون بارد. يعرض ما يمكن لـ OpenClaw اكتشافه
من الإعدادات، والمانيفستات، وسجل Plugin؛ ولا يثبت أن عملية Gateway
قيد التشغيل بالفعل قد استوردت وقت تشغيل Plugin.

## تثبيت Plugins

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

بعد تثبيت كود Plugin، أعد تشغيل Gateway الذي يخدم قنواتك:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

استخدم `inspect --runtime` عندما تحتاج إلى دليل على أن Plugin سجّل أسطح وقت التشغيل
مثل الأدوات، والخطافات، والخدمات، وطرق Gateway، أو أوامر CLI
المملوكة لـ Plugin.

## تحديث Plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

إذا كان Plugin قد ثُبّت من وسم توزيع npm مثل `@beta`، فإن استدعاءات
`update <plugin-id>` اللاحقة تعيد استخدام ذلك الوسم المسجل. تمرير مواصفة npm صريحة
يحوّل التثبيت المتتبَّع إلى تلك المواصفة للتحديثات المستقبلية.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

يعيد الأمر الثاني Plugin إلى خط الإصدار الافتراضي في السجل
عندما كان مثبّتًا سابقًا على إصدار دقيق أو وسم.

عندما يعمل `openclaw update` على قناة بيتا، تحاول سجلات Plugin الخاصة بـ npm وClawHub
على الخط الافتراضي استخدام إصدار Plugin الموافق `@beta` أولًا. إذا لم يكن إصدار بيتا
هذا موجودًا، يعود OpenClaw إلى مواصفة الافتراضي/الأحدث المسجلة.
بالنسبة إلى Plugins من npm، يعود OpenClaw أيضًا عندما تكون حزمة بيتا موجودة لكنها تفشل
في تحقق التثبيت. تُحفظ الإصدارات الدقيقة والوسوم الصريحة مثل `@rc` أو `@beta`.

## إلغاء تثبيت Plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

يزيل إلغاء التثبيت مُدخل إعدادات Plugin، وسجل فهرس Plugin، ومدخلات قائمة السماح/المنع،
ومسارات التحميل المرتبطة عند انطباق ذلك. تُزال أدلة التثبيت المُدارة
ما لم تمرر `--keep-files`.

في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تُعطّل أوامر تثبيت Plugin، وتحديثه، وإلغاء تثبيته، وتمكينه،
وتعطيله. أدِر تلك الخيارات في مصدر Nix الخاص بالتثبيت بدلًا من ذلك؛ بالنسبة إلى nix-openclaw، استخدم
[البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) القائم على الوكيل أولًا.

## نشر Plugins

يمكنك نشر Plugins خارجية إلى [ClawHub](https://clawhub.ai)، أو npmjs.com، أو
كليهما.

### النشر إلى ClawHub

ClawHub هو سطح الاكتشاف العام الأساسي لـ Plugins الخاصة بـ OpenClaw. يمنح
المستخدمين بيانات وصفية قابلة للبحث، وسجل إصدارات، ونتائج فحص السجل قبل
التثبيت.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

يثبّت المستخدمون من ClawHub باستخدام:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

ما يزال الشكل المجرد يتحقق من ClawHub أولًا.

### النشر إلى npmjs.com

يجب أن تتضمن Plugins الأصلية من npm مانيفست Plugin وبيانات وصفية لنقطة دخول
OpenClaw في `package.json`.

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
```

يثبّت المستخدمون حزم npm فقط باستخدام:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

إذا كانت الحزمة نفسها متاحة أيضًا على ClawHub، فإن `npm:` يتجاوز البحث في ClawHub
ويفرض الحل عبر npm.

## اختيار المصدر

- **ClawHub**: استخدمه عندما تريد اكتشافًا أصليًا لـ OpenClaw، وملخصات فحص،
  وإصدارات، وتلميحات تثبيت.
- **npmjs.com**: استخدمه عندما تكون تشحن بالفعل حزم JavaScript أو تحتاج إلى
  سير عمل وسوم توزيع npm/السجلات الخاصة.
- **Git**: استخدمه عندما تريد التثبيت مباشرة من فرع، أو وسم، أو تثبيت.
- **مسار محلي**: استخدمه عندما تطور Plugin أو تختبره على الجهاز نفسه.

## ذو صلة

- [Plugins](/ar/tools/plugin) - نظرة عامة واستكشاف الأخطاء وإصلاحها
- [`openclaw plugins`](/ar/cli/plugins) - مرجع CLI الكامل
- [ClawHub](/ar/tools/clawhub) - النشر وعمليات السجل
- [بناء Plugins](/ar/plugins/building-plugins) - إنشاء حزمة Plugin
- [مانيفست Plugin](/ar/plugins/manifest) - المانيفست وبيانات الحزمة الوصفية
