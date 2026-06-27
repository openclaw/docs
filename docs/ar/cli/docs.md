---
read_when:
    - تريد البحث في وثائق OpenClaw المباشرة من الطرفية
    - تحتاج إلى معرفة واجهة برمجة تطبيقات البحث المستضافة التي يستدعيها CLI الخاص بالوثائق
summary: مرجع CLI لـ `openclaw docs` (ابحث في فهرس الوثائق المباشرة)
title: المستندات
x-i18n:
    generated_at: "2026-06-27T17:21:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

ابحث في فهرس مستندات OpenClaw المباشرة من الطرفية. يستدعي الأمر واجهة API لبحث المستندات المستضافة على Cloudflare من OpenClaw ويعرض النتائج في طرفيتك.

## الاستخدام

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

الوسيطات:

| الوسيطة     | الوصف                                                                        |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | استعلام بحث حر الصياغة. تُدمج الاستعلامات متعددة الكلمات بمسافات وتُرسل كاستعلام واحد. |

## أمثلة

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

دون استعلام، يطبع `openclaw docs` عنوان URL لنقطة دخول المستندات إضافة إلى نموذج أمر بحث بدلًا من تشغيل بحث.

## كيف يعمل

يستدعي `openclaw docs` العنوان `https://docs.openclaw.ai/api/search` ويعرض نتائج JSON. تستخدم مكالمة البحث مهلة ثابتة قدرها 30 ثانية.

## الإخراج

في طرفية غنية (TTY)، تُعرض النتائج كعنوان يليه قائمة نقطية. يعرض كل بند عنوان الصفحة، وعنوان URL المرتبط للمستندات، ومقتطفًا قصيرًا في السطر التالي. تطبع النتائج الفارغة "لا توجد نتائج.".

في الإخراج غير الغني (عند التمرير عبر أنبوب، أو `--no-color`، أو السكربتات)، تُعرض البيانات نفسها بصيغة Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## رموز الخروج

| الرمز | المعنى                                                           |
| ---- | ----------------------------------------------------------------- |
| `0`  | نجح البحث (بما في ذلك الاستجابات ذات النتائج الصفرية).               |
| `1`  | فشلت مكالمة واجهة API لبحث المستندات المستضافة؛ يُطبع stderr ضمن السطر. |

## ذات صلة

- [مرجع CLI](/ar/cli)
- [المستندات المباشرة](https://docs.openclaw.ai)
