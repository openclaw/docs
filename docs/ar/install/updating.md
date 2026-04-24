---
read_when:
    - تحديث OpenClaw
    - حدث عطل بعد تحديث
summary: تحديث OpenClaw بأمان (تثبيت عام أو من المصدر)، بالإضافة إلى استراتيجية التراجع
title: التحديث ติดต่อฝ่ายขาย
x-i18n:
    generated_at: "2026-04-24T07:50:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

حافظ على تحديث OpenClaw.

## الموصى به: `openclaw update`

أسرع طريقة للتحديث. يكتشف نوع التثبيت لديك (npm أو git)، ويجلب أحدث إصدار، ويشغّل `openclaw doctor`، ثم يعيد تشغيل Gateway.

```bash
openclaw update
```

للتبديل بين القنوات أو استهداف إصدار محدد:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # معاينة من دون تطبيق
```

يفضّل `--channel beta` قناة beta، لكن Runtime يعود إلى stable/latest عندما
تكون وسم beta مفقودة أو أقدم من أحدث إصدار stable. استخدم `--tag beta`
إذا كنت تريد وسم npm beta dist-tag الخام لتحديث حزمة لمرة واحدة.

راجع [قنوات التطوير](/ar/install/development-channels) لمعاني القنوات.

## بديل: أعد تشغيل برنامج التثبيت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتخطي الإعداد الأولي. وبالنسبة إلى التثبيتات من المصدر، مرر `--install-method git --no-onboard`.

## بديل: npm أو pnpm أو bun يدويًا

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### تثبيتات npm العامة المملوكة لـ root

تقوم بعض إعدادات npm على Linux بتثبيت الحزم العامة تحت أدلة مملوكة لـ root مثل
`/usr/lib/node_modules/openclaw`. يدعم OpenClaw هذا التخطيط: تُعامل الحزمة المثبتة
على أنها للقراءة فقط في Runtime، وتُجهَّز تبعيات Runtime الخاصة بالـ Plugin
المضمّنة في دليل Runtime قابل للكتابة بدلًا من تعديل
شجرة الحزمة.

بالنسبة إلى وحدات systemd المقوّاة، اضبط دليل staging قابلًا للكتابة يكون متضمنًا في
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

إذا لم يتم ضبط `OPENCLAW_PLUGIN_STAGE_DIR`، يستخدم OpenClaw القيمة `$STATE_DIRECTORY` عندما
يوفرها systemd، ثم يعود إلى `~/.openclaw/plugin-runtime-deps`.

## أداة التحديث التلقائي

تكون أداة التحديث التلقائي معطلة افتراضيًا. فعّلها في `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| القناة   | السلوك                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------ |
| `stable` | ينتظر `stableDelayHours`، ثم يطبق مع jitter حتمي موزع على `stableJitterHours` (نشر متدرج).            |
| `beta`   | يفحص كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبق فورًا.                                     |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويًا.                                                |

كما يسجل Gateway تلميح تحديث عند بدء التشغيل (عطّله باستخدام `update.checkOnStart: false`).

## بعد التحديث

<Steps>

### شغّل doctor

```bash
openclaw doctor
```

ينقل التكوين، ويدقق سياسات الرسائل الخاصة، ويتحقق من سلامة Gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

### أعد تشغيل Gateway

```bash
openclaw gateway restart
```

### تحقّق

```bash
openclaw health
```

</Steps>

## التراجع

### تثبيت إصدار محدد (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

نصيحة: يعرض `npm view openclaw version` الإصدار المنشور الحالي.

### تثبيت commit محدد (المصدر)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

للعودة إلى الأحدث: `git checkout main && git pull`.

## إذا تعثرت

- شغّل `openclaw doctor` مرة أخرى واقرأ المخرجات بعناية.
- بالنسبة إلى `openclaw update --channel dev` على نسخ المصدر، تقوم أداة التحديث بتهيئة `pnpm` تلقائيًا عند الحاجة. إذا رأيت خطأ bootstrap متعلقًا بـ pnpm/corepack، فثبّت `pnpm` يدويًا (أو أعد تفعيل `corepack`) ثم أعد تشغيل التحديث.
- راجع: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل على Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [Doctor](/ar/gateway/doctor) — فحوصات السلامة بعد التحديثات
- [الترحيل](/ar/install/migrating) — أدلة ترحيل الإصدارات الرئيسية
