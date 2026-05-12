---
read_when:
    - نشر الأرواح
    - تصحيح إخفاقات نشر soul
summary: تنسيق حزمة Soul، والملفات المطلوبة، والحدود.
x-i18n:
    generated_at: "2026-05-12T15:43:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# تنسيق الروح

## على القرص

الروح ملف واحد:

- `SOUL.md` (أو `soul.md`)

في الوقت الحالي، يرفض onlycrabs.ai أي ملفات إضافية.

## `SOUL.md`

- Markdown مع frontmatter اختياري بصيغة YAML.
- يستخرج الخادم البيانات الوصفية من frontmatter أثناء النشر.
- يُستخدم `description` كملخص للروح في الواجهة/البحث.

## الحدود

- إجمالي حجم الحزمة: 50MB.
- يتضمن نص التضمين `SOUL.md` فقط.

## Slugs

- تُشتق من اسم المجلد افتراضيًا.
- يجب أن تكون بأحرف صغيرة وآمنة للاستخدام في عناوين URL: `^[a-z0-9][a-z0-9-]*$`.

## تعيين الإصدارات + الوسوم

- ينشئ كل نشر إصدارًا جديدًا (semver).
- الوسوم مؤشرات نصية إلى إصدار؛ يُستخدم `latest` بشكل شائع.
