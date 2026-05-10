---
read_when:
    - تريد البحث في وثائق OpenClaw الحية من الطرفية
    - تحتاج إلى معرفة ملفات التنفيذ الثنائية المساعدة التي تستدعيها أداة CLI الخاصة بالوثائق عبر الصدفة
summary: مرجع CLI لـ `openclaw docs` (البحث في فهرس الوثائق المباشر)
title: المستندات
x-i18n:
    generated_at: "2026-05-10T19:30:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

ابحث في فهرس وثائق OpenClaw الحية من الطرفية. يستدعي الأمر نقطة نهاية بحث MCP العامة لوثائق Mintlify المستضافة على `https://docs.openclaw.ai/mcp.SearchOpenClaw` ويعرض النتائج في الطرفية لديك.

## الاستخدام

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

الوسائط:

| الوسيط       | الوصف                                                                                  |
| ------------ | -------------------------------------------------------------------------------------- |
| `[query...]` | استعلام بحث حر الصياغة. تُدمج الاستعلامات متعددة الكلمات بمسافات وتُرسل كاستعلام واحد. |

## أمثلة

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

من دون استعلام، يطبع `openclaw docs` عنوان URL لنقطة دخول الوثائق بالإضافة إلى أمر بحث نموذجي بدلاً من تشغيل بحث.

## آلية العمل

يستدعي `openclaw docs` أداة CLI المسماة `mcporter` لاستدعاء أداة بحث MCP في الوثائق، ثم يحلل كتل `Title: / Link: / Content:` من خرج الأداة إلى قائمة نتائج.

لحل `mcporter`، يتحقق OpenClaw بالترتيب:

1. `mcporter` على `PATH` (يُستخدم مباشرة إذا كان موجوداً).
2. `pnpm dlx mcporter ...` إذا كان `pnpm` مثبتاً.
3. `npx -y mcporter ...` إذا كان `npx` مثبتاً.

إذا لم يكن أي منها متاحاً، يفشل الأمر مع تلميح لتثبيت `pnpm` (`npm install -g pnpm`).

تستخدم مكالمة البحث مهلة ثابتة قدرها 30 ثانية. تُختصر مقتطفات النتائج إلى نحو 220 حرفاً لكل إدخال.

## الخرج

في طرفية غنية (TTY)، تُعرض النتائج كعنوان يليه تعداد نقطي. تعرض كل نقطة عنوان الصفحة، وعنوان URL المرتبط للوثائق، ومقتطفاً قصيراً في السطر التالي. تطبع النتائج الفارغة "لا توجد نتائج.".

في الخرج غير الغني (عند التوجيه عبر الأنابيب، أو `--no-color`، أو السكربتات)، تُعرض البيانات نفسها بصيغة Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## رموز الخروج

| الرمز | المعنى                                                 |
| ----- | ------------------------------------------------------ |
| `0`   | نجح البحث (بما في ذلك الاستجابات ذات النتائج الصفرية). |
| `1`   | فشلت مكالمة أداة MCP؛ يُطبع stderr ضمن السطر.          |

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الوثائق الحية](https://docs.openclaw.ai)
