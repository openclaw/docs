---
read_when:
    - تغيير عرض مخرجات المساعد في Control UI
    - تصحيح توجيهات العرض الخاصة بـ `[embed ...]` و`MEDIA:` وreply وaudio
summary: بروتوكول shortcodes للمخرجات الغنية من أجل التضمينات، والوسائط، وتلميحات الصوت، والردود
title: بروتوكول المخرجات الغنية
x-i18n:
    generated_at: "2026-04-24T08:03:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

يمكن أن يحمل خرج المساعد مجموعة صغيرة من توجيهات التسليم/العرض:

- `MEDIA:` لتسليم المرفقات
- `[[audio_as_voice]]` لتلميحات عرض الصوت
- `[[reply_to_current]]` / `[[reply_to:<id>]]` لبيانات reply الوصفية
- `[embed ...]` للعرض الغني في Control UI

هذه التوجيهات منفصلة. يظل `MEDIA:` ووسوم reply/voice بيانات وصفية للتسليم؛ أما `[embed ...]` فهو مسار العرض الغني المخصص للويب فقط.

## `[embed ...]`

يمثل `[embed ...]` صيغة العرض الغني الوحيدة الموجّهة إلى الوكيل في Control UI.

مثال ذاتي الإغلاق:

```text
[embed ref="cv_123" title="Status" /]
```

القواعد:

- لم يعد `[view ...]` صالحًا للمخرجات الجديدة.
- يتم عرض shortcodes الخاصة بـ Embed في سطح رسالة المساعد فقط.
- لا يتم عرض إلا التضمينات المعتمدة على URL. استخدم `ref="..."` أو `url="..."`.
- لا يتم عرض shortcodes الخاصة بـ embed بصيغة HTML المضمّنة ضمن block-form.
- تقوم واجهة الويب بإزالة shortcode من النص المرئي وتعرض التضمين داخل السطر.
- ليس `MEDIA:` اسمًا مستعارًا لـ embed ولا ينبغي استخدامه لعرض embed الغني.

## شكل العرض المخزن

كتلة محتوى المساعد المعيارية/المخزنة هي عنصر `canvas` مهيكل:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

تستخدم الكتل الغنية المخزنة/المعروضة هذا الشكل `canvas` مباشرةً. ولا يتم التعرف على `present_view`.

## ذو صلة

- [مهايئات RPC](/ar/reference/rpc)
- [Typebox](/ar/concepts/typebox)
