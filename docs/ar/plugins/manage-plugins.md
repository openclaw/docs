---
read_when:
    - تريد أمثلة سريعة على تثبيت Plugin أو عرضه أو تحديثه أو إلغاء تثبيته
    - تريد الاختيار بين ClawHub وتوزيع Plugin عبر npm
    - أنت تنشر حزمة Plugin
sidebarTitle: Manage plugins
summary: أمثلة سريعة على تثبيت Plugins الخاصة بـ OpenClaw واستعراضها وإلغاء تثبيتها وتحديثها ونشرها
title: إدارة Plugins
x-i18n:
    generated_at: "2026-05-02T22:20:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

تكون معظم سير عمل Plugins عبارة عن بضعة أوامر: البحث، والتثبيت، وإعادة تشغيل Gateway،
والتحقق، وإلغاء التثبيت عندما لا تعود بحاجة إلى Plugin.

## سرد Plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

استخدم `--json` للبرامج النصية. يتضمن ذلك تشخيصات السجل وحالة
`dependencyStatus` الثابتة لكل Plugin عندما تعلن حزمة Plugin عن `dependencies` أو
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` هو فحص مخزون بارد. يعرض ما يمكن لـ OpenClaw اكتشافه
من الإعدادات، والبيانات الوصفية، وسجل Plugin؛ ولا يثبت أن عملية
Gateway قيد التشغيل بالفعل قد استوردت وقت تشغيل Plugin.

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

استخدم `inspect --runtime` عندما تحتاج إلى إثبات أن Plugin سجّل أسطح وقت التشغيل
مثل الأدوات، والخطافات، والخدمات، وطرق Gateway، أو أوامر CLI المملوكة لـ Plugin.

## تحديث Plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

إذا كان Plugin قد ثُبّت من وسم توزيع npm مثل `@beta`، فستعيد استدعاءات
`update <plugin-id>` اللاحقة استخدام ذلك الوسم المسجل. يؤدي تمرير مواصفة npm صريحة
إلى تحويل التثبيت المتتبع إلى تلك المواصفة للتحديثات المستقبلية.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

يعيد الأمر الثاني Plugin إلى مسار الإصدار الافتراضي في السجل
عندما كان مثبتا سابقا على إصدار أو وسم محدد.

عندما يعمل `openclaw update` على قناة beta، تحاول سجلات Plugin الافتراضية من npm وClawHub
استخدام إصدار Plugin المطابق `@beta` أولا. إذا لم يكن إصدار beta ذلك
موجودا، يعود OpenClaw إلى المواصفة الافتراضية/الأحدث المسجلة.
تُحفظ الإصدارات الدقيقة والوسوم الصريحة مثل `@rc` أو `@beta`.

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

لا يزال النموذج المجرّد يتحقق من ClawHub أولا.

### النشر إلى npmjs.com

يجب أن تتضمن Plugins الأصلية لـ npm بيان Plugin وبيانات وصفية لنقطة دخول
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

يثبّت المستخدمون من npm فقط باستخدام:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

إذا كانت الحزمة نفسها متاحة أيضا على ClawHub، فإن `npm:` يتخطى بحث ClawHub ويفرض
حل npm.

## اختيار المصدر

- **ClawHub**: استخدمه عندما تريد اكتشافا أصليا لـ OpenClaw، وملخصات فحص،
  وإصدارات، وتلميحات تثبيت.
- **npmjs.com**: استخدمه عندما تكون قد أصدرت بالفعل حزم JavaScript أو تحتاج إلى
  سير عمل وسوم توزيع npm/السجلات الخاصة.
- **Git**: استخدمه عندما تريد التثبيت مباشرة من فرع أو وسم أو commit.
- **مسار محلي**: استخدمه عندما تطور أو تختبر Plugin على الجهاز نفسه.

## ذات صلة

- [Plugins](/ar/tools/plugin) - نظرة عامة واستكشاف الأخطاء وإصلاحها
- [`openclaw plugins`](/ar/cli/plugins) - مرجع CLI الكامل
- [ClawHub](/ar/tools/clawhub) - عمليات النشر والسجل
- [بناء Plugins](/ar/plugins/building-plugins) - إنشاء حزمة Plugin
- [بيان Plugin](/ar/plugins/manifest) - البيان وبيانات الحزمة الوصفية
