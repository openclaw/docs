---
summary: إعادة التوجيه إلى /plugins/sdk-channel-outbound
title: واجهة برمجة تطبيقات رسائل القنوات
x-i18n:
    generated_at: "2026-06-27T18:16:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

انتقلت هذه الصفحة إلى [واجهة API الصادرة للقنوات](/ar/plugins/sdk-channel-outbound).

يبقى `openclaw/plugin-sdk/channel-message` و
`openclaw/plugin-sdk/channel-message-runtime` مسارين فرعيين مهملين للتوافق
مع الإضافات الأقدم. يجب على إضافات القنوات الجديدة استخدام
`openclaw/plugin-sdk/channel-outbound` لدورة حياة الرسائل، والإيصال، والإرسال
الدائم، ومساعدات المعاينة الحية. المسارات الفرعية المهملة هي أسماء بديلة خفيفة
فوق نواة رسائل القنوات المشتركة وأسطح SDK المركزة للوارد/الصادر؛
لا تضف مساعدات جديدة هناك.

خطة الإزالة: أبقِ هذه الأسماء البديلة طوال نافذة ترحيل الإضافات الخارجية،
ثم أزلها في عملية تنظيف SDK الرئيسية التالية بعد انتقال المستدعين إلى
`channel-outbound`.
