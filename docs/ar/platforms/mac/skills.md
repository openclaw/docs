---
read_when:
    - تحديث واجهة مستخدم إعدادات Skills في macOS
    - تغيير تقييد Skills أو سلوك التثبيت
summary: واجهة مستخدم إعدادات Skills في macOS والحالة المدعومة من Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T06:13:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

يعرض تطبيق macOS مهارات OpenClaw عبر Gateway؛ ولا يحلّل المهارات محليًا.

## مصدر البيانات

- تُعيد `skills.status` ‏(Gateway) جميع المهارات مع حالة الأهلية والمتطلبات المفقودة، بما في ذلك عمليات الحظر بقائمة السماح للمهارات المضمّنة.
- تأتي المتطلبات من `metadata.openclaw.requires` في كل ملف `SKILL.md`.

## إجراءات التثبيت

- يحدّد `metadata.openclaw.install` خيارات التثبيت (brew/node/go/uv/download).
- يستدعي التطبيق `skills.install` لتشغيل برامج التثبيت على مضيف Gateway.
- يمكن لسياسة `security.installPolicy` التي يديرها المشغّل (`enabled` و`targets` و`exec`) حظر عمليات تثبيت المهارات المدعومة من Gateway قبل تشغيل بيانات برنامج التثبيت الوصفية. فحص التعليمات البرمجية الخطرة المضمّن (المستخدم في عمليات تثبيت Plugin) غير موصول بمسار تثبيت المهارات.
- إذا كان كل خيار تثبيت هو `download`، فسيعرض Gateway جميع خيارات التنزيل.
- وإلا، يختار Gateway برنامج تثبيت مفضّلًا واحدًا باستخدام تفضيلات التثبيت الحالية (`skills.install.preferBrew` و`skills.install.nodeManager`) والملفات التنفيذية المتوفرة على المضيف: Homebrew أولًا عند تمكين `preferBrew` وتوفر `brew`، ثم `uv`، ثم مدير node المُهيّأ، ثم Homebrew مرة أخرى إذا كان متوفرًا (حتى من دون `preferBrew`)، ثم `go`، ثم `download`.
- تعكس تسميات تثبيت Node مدير node المُهيّأ، بما في ذلك `yarn`.

## مفاتيح البيئة وواجهة API

- يخزّن التطبيق المفاتيح في `~/.openclaw/openclaw.json` ضمن `skills.entries.<skillKey>`.
- يُحدّث `skills.update` القيم `enabled` و`apiKey` و`env`.

## الوضع البعيد

- تحدث تحديثات التثبيت والتهيئة على مضيف Gateway، وليس على جهاز Mac المحلي.

## ذو صلة

- [Skills](/ar/tools/skills)
- [تطبيق macOS](/ar/platforms/macos)
