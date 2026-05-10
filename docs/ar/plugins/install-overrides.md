---
read_when:
    - اختبار تدفقات الإعداد الأولي أو الإعداد مقابل Plugin محزوم محليًا
    - التحقق من حزمة Plugin قبل نشرها
    - استبدال تثبيت Plugin تلقائي بعنصر اختباري
sidebarTitle: Install overrides
summary: اختبار تجاوزات Plugin المعبأة باستخدام تدفقات التثبيت في وقت الإعداد
title: تجاوزات تثبيت Plugin
x-i18n:
    generated_at: "2026-05-10T19:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

تتيح تجاوزات تثبيت Plugin للمشرفين اختبار عمليات تثبيت Plugin وقت الإعداد مقابل
حزمة npm محددة أو ملف tarball محلي من npm-pack. وهي مخصصة للتحقق من E2E والحزم
فقط. ينبغي للمستخدمين العاديين تثبيت Plugin باستخدام
[`openclaw plugins install`](/ar/cli/plugins).

<Warning>
تنفّذ التجاوزات كود Plugin من المصدر الذي تقدمه. استخدمها فقط في دليل حالة
معزول أو جهاز اختبار قابل للتخلص منه.
</Warning>

## البيئة

تكون التجاوزات معطلة ما لم يتم تعيين كلا المتغيرين:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

خريطة التجاوز هي JSON مفهرسة حسب معرّف Plugin. تدعم القيم:

- `npm:<registry-spec>` لحزم السجل والإصدارات أو الوسوم المحددة بدقة
- `npm-pack:<path.tgz>` لملفات tarball المحلية الناتجة عن `npm pack`

تُحل مسارات `npm-pack:` النسبية من دليل العمل الحالي.

## السلوك

عندما يطلب تدفق وقت الإعداد تثبيت Plugin يظهر معرّفه في الخريطة،
يستخدم OpenClaw مصدر التجاوز بدلاً من مصدر npm من الفهرس أو المضمّن أو الافتراضي.
ينطبق هذا على التهيئة الأولية والتدفقات الأخرى التي تستخدم مثبّت Plugin
المشترك وقت الإعداد.

تظل التجاوزات تفرض معرّف Plugin المتوقع. يجب أن يثبّت ملف tarball المعيّن إلى `codex`
Plugin يكون معرّف بيانه هو `codex`.

لا ترث التجاوزات حالة المصدر الرسمي الموثوق. حتى عندما يمثل إدخال الفهرس
عادةً حزمة مملوكة لـ OpenClaw، يُعامل التجاوز كمدخل اختبار مقدم من المشغّل.

لا يمكن لملفات `.env` في مساحة العمل تمكين تجاوزات التثبيت. عيّن هذه المتغيرات في
الصدفة الموثوقة أو مهمة CI أو أمر الاختبار البعيد الذي يشغّل OpenClaw.

## E2E الحزم

استخدم دليل حالة معزولاً بحيث لا تمس عمليات تثبيت الحزم وسجلات التثبيت
حالة OpenClaw العادية لديك:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

تحقق من الحزمة المثبتة ضمن دليل الحالة:

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

بالنسبة إلى E2E لمزوّد حي، حمّل مفتاح API الحقيقي من صدفة موثوقة أو سر CI
قبل تشغيل أمر الاختبار. لا تطبع المفاتيح؛ أبلغ فقط عن المصدر
وما إذا كان المفتاح موجوداً.
