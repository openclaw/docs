---
read_when:
    - تحديث واجهة مستخدم إعدادات Skills في macOS
    - تغيير ضوابط بوابات Skills أو سلوك التثبيت
summary: واجهة إعدادات Skills في macOS والحالة المدعومة بـ Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:58:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

يعرض تطبيق macOS ‏Skills في OpenClaw عبر Gateway؛ ولا يحلل Skills محليًا.

## مصدر البيانات

- يعيد `skills.status` (Gateway) جميع Skills بالإضافة إلى الأهلية والمتطلبات الناقصة
  (بما في ذلك حظر قائمة السماح لـ Skills المضمّنة).
- تُشتق المتطلبات من `metadata.openclaw.requires` في كل `SKILL.md`.

## إجراءات التثبيت

- يحدد `metadata.openclaw.install` خيارات التثبيت (brew/node/go/uv).
- يستدعي التطبيق `skills.install` لتشغيل أدوات التثبيت على مضيف Gateway.
- يمكن لـ `security.installPolicy` المملوكة للمشغّل حظر عمليات تثبيت Skills
  المدعومة من Gateway قبل تشغيل بيانات التعريف الخاصة بأداة التثبيت. لا يُعد حظر التعليمات البرمجية الخطرة المدمج وقت التثبيت
  جزءًا من تدفق تثبيت Skills.
- إذا كان كل خيار تثبيت هو `download`، يعرض Gateway جميع
  خيارات التنزيل.
- بخلاف ذلك، يختار Gateway أداة تثبيت مفضلة واحدة باستخدام تفضيلات
  التثبيت الحالية والملفات التنفيذية للمضيف: Homebrew أولًا عندما
  يكون `skills.install.preferBrew` مفعّلًا ويكون `brew` موجودًا، ثم `uv`، ثم مدير
  Node المكوّن من `skills.install.nodeManager`، ثم البدائل اللاحقة
  مثل `go` أو `download`.
- تعكس تسميات تثبيت Node مدير Node المكوّن، بما في ذلك `yarn`.

## مفاتيح البيئة/API

- يخزن التطبيق المفاتيح في `~/.openclaw/openclaw.json` ضمن `skills.entries.<skillKey>`.
- يحدّث `skills.update` كلًا من `enabled` و`apiKey` و`env`.

## الوضع البعيد

- تحدث عمليات التثبيت وتحديثات الإعداد على مضيف Gateway (وليس على جهاز Mac المحلي).

## ذات صلة

- [Skills](/ar/tools/skills)
- [تطبيق macOS](/ar/platforms/macos)
