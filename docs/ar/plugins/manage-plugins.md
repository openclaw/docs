---
read_when:
    - تريد أمثلة سريعة لتثبيت Plugin أو سردها أو تحديثها أو إلغاء تثبيتها
    - تريد الاختيار بين ClawHub وتوزيع Plugin عبر npm
    - أنت تنشر حزمة Plugin
sidebarTitle: Manage plugins
summary: أمثلة سريعة لتثبيت Plugins الخاصة بـ OpenClaw وسردها وإلغاء تثبيتها وتحديثها ونشرها
title: إدارة Plugins
x-i18n:
    generated_at: "2026-05-10T19:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

معظم سير عمل Plugin عبارة عن بضعة أوامر: البحث، والتثبيت، وإعادة تشغيل Gateway،
والتحقق، وإلغاء التثبيت عندما لا تعود بحاجة إلى Plugin.

## عرض Plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

استخدم `--json` مع السكربتات. فهو يتضمن تشخيصات السجل وحالة
`dependencyStatus` الثابتة لكل Plugin عندما تعلن حزمة Plugin عن `dependencies` أو
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` هو فحص مخزون بارد. يعرض ما يستطيع OpenClaw اكتشافه
من الإعدادات والبيانات الوصفية وسجل Plugin؛ ولا يثبت أن عملية Gateway
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
مثل الأدوات أو الخطافات أو الخدمات أو أساليب Gateway أو أوامر CLI
المملوكة لـ Plugin.

## تحديث Plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

إذا كان Plugin قد ثُبّت من وسم توزيع npm مثل `@beta`، فإن استدعاءات
`update <plugin-id>` اللاحقة تعيد استخدام ذلك الوسم المسجل. تمرير مواصفة npm صريحة
يبدّل التثبيت المتتبَّع إلى تلك المواصفة للتحديثات المستقبلية.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

يعيد الأمر الثاني Plugin إلى خط الإصدار الافتراضي في السجل
عندما كان مثبتًا سابقًا على إصدار دقيق أو وسم محدد.

عند تشغيل `openclaw update` على قناة beta، تحاول سجلات Plugin الافتراضية من npm وClawHub
استخدام إصدار Plugin المطابق `@beta` أولًا. إذا لم يكن إصدار beta
هذا موجودًا، يعود OpenClaw إلى المواصفة الافتراضية/الأحدث المسجلة.
بالنسبة إلى Plugins من npm، يعود OpenClaw أيضًا عندما تكون حزمة beta موجودة لكنها تفشل
في تحقق التثبيت. تُحفظ الإصدارات الدقيقة والوسوم الصريحة مثل `@rc` أو `@beta`.

## إلغاء تثبيت Plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

يزيل إلغاء التثبيت إدخال إعدادات Plugin، وسجل فهرس Plugin، وإدخالات قوائم السماح/الحظر،
ومسارات التحميل المرتبطة عند الاقتضاء. تُزال أدلة التثبيت المُدارة
ما لم تمرر `--keep-files`.

في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون أوامر تثبيت Plugin وتحديثه وإلغاء تثبيته وتمكينه
وتعطيله معطلة. أدِر هذه الاختيارات في مصدر Nix الخاص
بالتثبيت بدلًا من ذلك؛ بالنسبة إلى nix-openclaw، استخدم
[البداية السريعة](https://github.com/openclaw/nix-openclaw#quick-start) المعتمدة على الوكيل أولًا.

## نشر Plugins

يمكنك نشر Plugins خارجية إلى [ClawHub](https://clawhub.ai)، أو npmjs.com، أو
كليهما.

### النشر إلى ClawHub

ClawHub هو سطح الاكتشاف العام الأساسي لـ Plugins في OpenClaw. فهو يمنح
المستخدمين بيانات وصفية قابلة للبحث، وسجل الإصدارات، ونتائج فحص السجل قبل
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

لا يزال الشكل المجرد يفحص ClawHub أولًا.

### النشر إلى npmjs.com

يجب أن تتضمن Plugins الأصلية من npm بيان Plugin وبيانات وصفية لنقطة دخول OpenClaw
في `package.json`.

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

يثبّت المستخدمون Plugins المتاحة عبر npm فقط باستخدام:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

إذا كانت الحزمة نفسها متاحة أيضًا على ClawHub، فإن `npm:` يتجاوز البحث في ClawHub ويفرض
الحل عبر npm.

## اختيار المصدر

- **ClawHub**: استخدمه عندما تريد اكتشافًا أصليًا لـ OpenClaw، وملخصات فحص،
  وإصدارات، وتلميحات تثبيت.
- **npmjs.com**: استخدمه عندما تكون قد بدأت بالفعل في شحن حزم JavaScript أو تحتاج إلى
  وسوم توزيع npm أو سير عمل السجلات الخاصة.
- **Git**: استخدمه عندما تريد التثبيت مباشرة من فرع أو وسم أو commit.
- **مسار محلي**: استخدمه عندما تطوّر أو تختبر Plugin على الجهاز نفسه.

## ذات صلة

- [Plugins](/ar/tools/plugin) - نظرة عامة واستكشاف الأخطاء وإصلاحها
- [`openclaw plugins`](/ar/cli/plugins) - مرجع CLI الكامل
- [ClawHub](/ar/clawhub/cli) - عمليات النشر والسجل
- [بناء Plugins](/ar/plugins/building-plugins) - إنشاء حزمة Plugin
- [بيان Plugin](/ar/plugins/manifest) - البيان والبيانات الوصفية للحزمة
