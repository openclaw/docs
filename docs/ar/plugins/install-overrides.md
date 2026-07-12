---
read_when:
    - اختبار تدفقات الإعداد الأولي أو التهيئة باستخدام Plugin مُحزَّمة محليًا
    - التحقق من حزمة Plugin قبل نشرها
    - استبدال التثبيت التلقائي للـ Plugin بأثر اختباري
sidebarTitle: Install overrides
summary: اختبار تجاوزات Plugin المعبّأة باستخدام تدفقات التثبيت أثناء الإعداد
title: تجاوزات تثبيت Plugin
x-i18n:
    generated_at: "2026-07-12T06:17:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

تتيح تجاوزات تثبيت Plugin للمشرفين توجيه عمليات تثبيت Plugin أثناء الإعداد إلى
حزمة npm محددة أو ملف tar محلي ناتج عن `npm pack` بدلًا من المصدر الموجود في الكتالوج
أو المضمّن أو مصدر npm الافتراضي. وهي مخصّصة فقط لاختبارات E2E والتحقق من الحزم؛
أما المستخدمون العاديون فيثبّتون الإضافات باستخدام
[`openclaw plugins install`](/ar/cli/plugins).

<Warning>
تُنفّذ التجاوزات شيفرة Plugin من المصدر الذي توفره. لا تستخدمها إلا في
دليل حالة معزول أو جهاز اختبار مؤقت.
</Warning>

## البيئة

تظل التجاوزات معطلة ما لم يُعيَّن كلا المتغيرين:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

خريطة التجاوزات هي JSON مفاتيحها معرّفات الإضافات. تدعم القيم ما يلي:

| البادئة               | المصدر                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | حزم السجل أو الإصدارات المحددة بدقة أو الوسوم                                                      |
| `npm-pack:<path.tgz>` | ملفات tar محلية ناتجة عن `npm pack`؛ تُحلّ المسارات النسبية انطلاقًا من دليل العمل الحالي          |

## السلوك

عندما يثبّت تدفق أثناء الإعداد Plugin يظهر معرّفه في الخريطة، يستخدم OpenClaw
مصدر التجاوز بدلًا من المصدر الموجود في الكتالوج أو المضمّن أو مصدر npm
الافتراضي. ينطبق ذلك على الإعداد الأولي وأي تدفق آخر يستخدم مثبّت
Plugin المشترك أثناء الإعداد.

- تظل التجاوزات تفرض معرّف Plugin المتوقع: يجب أن يثبّت ملف tar المعيّن إلى `codex`
  Plugin يكون معرّف البيان الخاص به هو `codex`.
- لا ترث التجاوزات حالة المصدر الرسمي الموثوق. حتى عندما يمثّل
  إدخال الكتالوج عادةً حزمة مملوكة لـ OpenClaw، يُعامل التجاوز على أنه
  إدخال اختبار يقدمه المشغّل.
- لا يمكن لملفات `.env` في مساحة العمل تفعيل تجاوزات التثبيت؛ فكلا متغيري البيئة
  مدرجان في قائمة dotenv المحظورة لمساحة العمل. عيّنهما في الصدفة الموثوقة أو مهمة CI أو
  أمر الاختبار البعيد الذي يشغّل OpenClaw.

## اختبار E2E للحزمة

استخدم دليل حالة معزولًا كي لا تمس عمليات تثبيت الحزم وسجلات التثبيت
حالة OpenClaw العادية لديك:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

تحقق من الحزمة المثبتة داخل دليل الحالة:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

لاختبار E2E المباشر لمزوّد الخدمة، حمّل مفتاح API الحقيقي من صدفة موثوقة أو
سرّ CI قبل تشغيل أمر الاختبار. لا تطبع المفاتيح؛ أبلغ فقط عن
المصدر وما إذا كان المفتاح موجودًا.
