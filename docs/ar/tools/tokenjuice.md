---
read_when:
    - تريد نتائج أقصر لأداتي `exec` أو `bash` في OpenClaw
    - تريد تفعيل Plugin tokenjuice المضمّن
    - تحتاج إلى فهم ما الذي يغيّره tokenjuice وما الذي يتركه بصيغته الخام
summary: ضغط نتائج أدوات exec وbash المليئة بالضوضاء باستخدام Plugin مضمّن اختياري
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-22T07:19:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` هو Plugin مضمّن اختياري يضغط نتائج أدوات `exec` و`bash`
المليئة بالضوضاء بعد تنفيذ الأمر بالفعل.

إنه يغيّر `tool_result` المُعاد، وليس الأمر نفسه. ولا يقوم Tokenjuice
بإعادة كتابة إدخال shell، أو إعادة تشغيل الأوامر، أو تغيير رموز الخروج.

ينطبق هذا اليوم على عمليات التشغيل المضمّنة لـ Pi، حيث يربط tokenjuice نفسه
بمسار `tool_result` المضمّن ويقلّم المخرجات التي تعود إلى الجلسة.

## تفعيل Plugin

المسار السريع:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

المكافئ:

```bash
openclaw plugins enable tokenjuice
```

يشحن OpenClaw الـ Plugin بالفعل. ولا توجد خطوة منفصلة مثل `plugins install`
أو `tokenjuice install openclaw`.

إذا كنت تفضّل تعديل الإعدادات مباشرةً:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## ما الذي يغيّره tokenjuice

- يضغط نتائج `exec` و`bash` المليئة بالضوضاء قبل إعادتها إلى الجلسة.
- يُبقي تنفيذ الأمر الأصلي من دون تغيير.
- يحافظ على قراءات محتوى الملفات الدقيقة والأوامر الأخرى التي ينبغي أن يتركها tokenjuice بصيغتها الخام.
- يظل اختياريًا: عطّل Plugin إذا كنت تريد مخرجات حرفية في كل مكان.

## تحقّق من أنه يعمل

1. فعّل Plugin.
2. ابدأ جلسة يمكنها استدعاء `exec`.
3. شغّل أمرًا مليئًا بالضوضاء مثل `git status`.
4. تحقّق من أن نتيجة الأداة المُعادة أقصر وأكثر تنظيمًا من مخرجات shell الخام.

## تعطيل Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

أو:

```bash
openclaw plugins disable tokenjuice
```
