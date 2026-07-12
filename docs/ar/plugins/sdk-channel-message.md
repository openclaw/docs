---
summary: إعادة التوجيه إلى /plugins/sdk-channel-outbound
title: واجهة برمجة تطبيقات رسائل القناة
x-i18n:
    generated_at: "2026-07-12T06:23:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

انتقلت هذه الصفحة إلى [واجهة API الصادرة للقنوات](/ar/plugins/sdk-channel-outbound).

يظل المساران الفرعيان `openclaw/plugin-sdk/channel-message` و
`openclaw/plugin-sdk/channel-message-runtime` متروكين للتوافق مع الإضافات
الأقدم؛ وكلاهما اسمان مستعاران بسيطان فوق النواة المشتركة لرسائل القنوات.
ينبغي لإضافات القنوات الجديدة استخدام
`openclaw/plugin-sdk/channel-outbound` لدورة حياة الرسائل، وإيصالات الاستلام،
والإرسال الدائم، ومساعدات المعاينة المباشرة بدلًا من إضافة مساعدات جديدة إلى
المسارات الفرعية المتروكة.

خطة الإزالة: الاحتفاظ بهذه الأسماء المستعارة طوال فترة ترحيل الإضافات
الخارجية، ثم إزالتها في عملية التنظيف الرئيسية التالية لحزمة SDK بعد انتقال
المستدعين إلى `channel-outbound`.
