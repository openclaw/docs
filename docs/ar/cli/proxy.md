---
read_when:
    - تحتاج إلى التقاط حركة نقل OpenClaw محليًا لأغراض تصحيح الأخطاء
    - تريد فحص جلسات وكيل التصحيح أو الكائنات الثنائية الكبيرة أو الإعدادات المسبقة المدمجة للاستعلامات
summary: مرجع CLI لـ `openclaw proxy`، وكيل التصحيح المحلي وفاحص الالتقاطات
title: الوكيل
x-i18n:
    generated_at: "2026-04-24T07:35:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

شغّل وكيل التصحيح المحلي الصريح وافحص حركة المرور الملتقطة.

هذا أمر تصحيح أخطاء للتحقيق على مستوى النقل. ويمكنه بدء
وكيل محلي، وتشغيل أمر فرعي مع تمكين الالتقاط، وسرد جلسات الالتقاط،
والاستعلام عن أنماط حركة المرور الشائعة، وقراءة الكائنات الثنائية الكبيرة الملتقطة، وحذف
بيانات الالتقاط المحلية.

## الأوامر

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## الإعدادات المسبقة للاستعلام

يقبل `openclaw proxy query --preset <name>` ما يلي:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## ملاحظات

- يستخدم `start` القيمة الافتراضية `127.0.0.1` ما لم يتم تعيين `--host`.
- يبدأ `run` وكيل تصحيح محليًا ثم يشغّل الأمر الواقع بعد `--`.
- الالتقاطات هي بيانات تصحيح أخطاء محلية؛ استخدم `openclaw proxy purge` عند الانتهاء.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [مصادقة trusted proxy](/ar/gateway/trusted-proxy-auth)
