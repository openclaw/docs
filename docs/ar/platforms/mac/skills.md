---
read_when:
    - تحديث واجهة إعدادات Skills على macOS
    - تغيير بوابة Skills أو سلوك التثبيت
summary: واجهة إعدادات Skills على macOS والحالة المدعومة من Gateway
title: Skills (macOS)
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T07:52:45Z"
  model: gpt-5.4
  provider: openai
  source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
  source_path: platforms/mac/skills.md
  workflow: 15
---

يعرض تطبيق macOS ‏Skills الخاصة بـ OpenClaw عبر Gateway؛ ولا يقوم بتحليل Skills محليًا.

## مصدر البيانات

- يعيد `skills.status` (في gateway) جميع Skills بالإضافة إلى الأهلية والمتطلبات المفقودة
  (بما في ذلك كتل قائمة السماح الخاصة بـ Skills المجمعة).
- تُشتق المتطلبات من `metadata.openclaw.requires` في كل `SKILL.md`.

## إجراءات التثبيت

- يحدد `metadata.openclaw.install` خيارات التثبيت (brew/node/go/uv).
- يستدعي التطبيق `skills.install` لتشغيل المُثبّتات على مضيف gateway.
- تؤدي نتائج `critical` المدمجة الخاصة بالشيفرة الخطرة إلى حظر `skills.install` افتراضيًا؛ أما النتائج المشبوهة فلا تزال تحذيرية فقط. ويوجد تجاوز الخطورة في طلب gateway، لكن التدفق الافتراضي للتطبيق يبقى على وضع الفشل المغلق.
- إذا كانت كل خيارات التثبيت من نوع `download`، فإن gateway تعرض جميع
  خيارات التنزيل.
- بخلاف ذلك، تختار gateway مُثبّتًا مفضّلًا واحدًا باستخدام تفضيلات
  التثبيت الحالية والملفات التنفيذية على المضيف: Homebrew أولًا عندما
  تكون `skills.install.preferBrew` مفعّلة ويكون `brew` موجودًا، ثم `uv`، ثم
  مدير node المهيأ من `skills.install.nodeManager`، ثم بدائل لاحقة
  مثل `go` أو `download`.
- تعكس تسميات تثبيت Node مدير node المهيأ، بما في ذلك `yarn`.

## Env/مفاتيح API

- يخزن التطبيق المفاتيح في `~/.openclaw/openclaw.json` تحت `skills.entries.<skillKey>`.
- يقوم `skills.update` بترقيع `enabled` و`apiKey` و`env`.

## الوضع البعيد

- تحدث تحديثات التثبيت + الإعداد على مضيف gateway (وليس على Mac المحلي).

## ذو صلة

- [Skills](/ar/tools/skills)
- [تطبيق macOS](/ar/platforms/macos)
