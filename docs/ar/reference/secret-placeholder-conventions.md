---
read_when:
    - كتابة مستندات تتضمن رموزًا، أو مفاتيح API، أو مقتطفات اعتماد
    - تحديث الأمثلة التي قد تفحصها أدوات كشف الأسرار
summary: اصطلاحات العناصر النائبة الآمنة لماسح الأسرار في الوثائق والأمثلة
title: اصطلاحات العناصر النائبة للأسرار
x-i18n:
    generated_at: "2026-06-27T18:33:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# اصطلاحات العناصر النائبة للأسرار

استخدم عناصر نائبة قابلة للقراءة البشرية لكنها لا تشبه الأسرار الحقيقية.

## النمط الموصى به

- فضّل القيم الوصفية مثل `example-openai-key-not-real` أو `example-discord-bot-token`.
- في مقتطفات shell، فضّل `${OPENAI_API_KEY}` على السلاسل المضمنة التي تشبه الرموز المميزة.
- اجعل الأمثلة مزيفة بوضوح ومحددة النطاق بحسب الغرض (المزوّد، القناة، نوع المصادقة).

## تجنب هذه الأنماط في الوثائق

- نص ترويسة أو تذييل مفتاح خاص PEM حرفي.
- البادئات التي تشبه بيانات اعتماد حية، مثل `sk-...` و`xoxb-...` و`AKIA...`.
- رموز bearer تبدو واقعية ومنسوخة من سجلات وقت التشغيل.

## مثال

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
