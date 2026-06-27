---
read_when:
    - التحقق من تغطية بيانات اعتماد SecretRef
    - تدقيق ما إذا كانت بيانات الاعتماد مؤهلة لـ `secrets configure` أو `secrets apply`
    - التحقق من سبب وجود بيانات اعتماد خارج السطح المدعوم
summary: 'سطح بيانات اعتماد SecretRef المعتمد: المدعوم مقابل غير المدعوم'
title: سطح اعتماد SecretRef
x-i18n:
    generated_at: "2026-06-27T18:33:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 668ee7e72565194bfe53a397767d060e5fe7743c9bf8bde2597ec3dad2a32431
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

تعرّف هذه الصفحة سطح بيانات اعتماد SecretRef المعياري.

نية النطاق:

- ضمن النطاق: بيانات الاعتماد المقدمة حصراً من المستخدم والتي لا ينشئها OpenClaw ولا يدوّرها.
- خارج النطاق: بيانات الاعتماد التي تُنشأ أو تُدوّر وقت التشغيل، ومواد تحديث OAuth، والعناصر الشبيهة بالجلسات.

## بيانات الاعتماد المدعومة

### أهداف `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)
