---
read_when:
    - اختبار تدفقات التهيئة الأولية أو الإعداد مقابل Plugin محزوم محليًا
    - التحقق من حزمة Plugin قبل نشرها
    - استبدال تثبيت Plugin تلقائي بأثر اختباري
sidebarTitle: Install overrides
summary: اختبر تجاوزات Plugin المعبأة باستخدام تدفقات التثبيت أثناء الإعداد
title: تجاوزات تثبيت Plugin
x-i18n:
    generated_at: "2026-06-27T18:06:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

تتيح تجاوزات تثبيت Plugin للمشرفين اختبار عمليات تثبيت Plugin في وقت الإعداد مقابل
حزمة npm محددة أو أرشيف tarball محلي ناتج عن npm-pack. وهي مخصصة لاختبارات E2E والتحقق من الحزم
فقط. يجب على المستخدمين العاديين تثبيت Plugins باستخدام
[`openclaw plugins install`](/ar/cli/plugins).

<Warning>
تنفذ التجاوزات كود Plugin من المصدر الذي توفره. استخدمها فقط في
دليل حالة معزول أو جهاز اختبار قابل للتخلص منه.
</Warning>

## البيئة

تكون التجاوزات معطلة ما لم يُضبط كلا المتغيرين:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

خريطة التجاوز هي JSON مفهرسة حسب معرّف Plugin. تدعم القيم:

- `npm:<registry-spec>` لحزم السجل والإصدارات أو الوسوم المحددة بدقة
- `npm-pack:<path.tgz>` للأرشيفات المحلية التي ينتجها `npm pack`

تُحل مسارات `npm-pack:` النسبية من دليل العمل الحالي.

## السلوك

عندما يطلب مسار في وقت الإعداد تثبيت Plugin يظهر معرّفه في الخريطة،
يستخدم OpenClaw مصدر التجاوز بدلا من مصدر npm من الكتالوج أو المضمن أو الافتراضي.
ينطبق هذا على الإعداد الأولي والمسارات الأخرى التي تستخدم مثبت Plugin المشترك
في وقت الإعداد.

ما زالت التجاوزات تفرض معرّف Plugin المتوقع. يجب أن يثبت أرشيف tarball مربوط بـ `codex`
Plugin يكون معرّف manifest الخاص به هو `codex`.

لا ترث التجاوزات حالة المصدر الرسمي الموثوق. حتى عندما يمثل إدخال الكتالوج
عادة حزمة مملوكة لـ OpenClaw، يُعامل التجاوز كمدخل اختبار يقدمه المشغل.

لا يمكن لملفات `.env` في مساحة العمل تمكين تجاوزات التثبيت. اضبط هذه المتغيرات في
الصدفة الموثوقة أو مهمة CI أو أمر الاختبار البعيد الذي يشغل OpenClaw.

## حزمة E2E

استخدم دليل حالة معزولا حتى لا تلمس عمليات تثبيت الحزم وسجلات التثبيت
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

بالنسبة لاختبار E2E لمزود حي، استورد مفتاح API الحقيقي من صدفة موثوقة أو سر CI
قبل تشغيل أمر الاختبار. لا تطبع المفاتيح؛ أبلغ فقط عن المصدر
وما إذا كان المفتاح موجودا.
