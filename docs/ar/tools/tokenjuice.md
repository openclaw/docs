---
read_when:
    - تريد نتائج أقصر لأداتي `exec` أو `bash` في OpenClaw
    - تريد تمكين Plugin المضمن tokenjuice
    - تحتاج إلى فهم ما الذي يغيّره tokenjuice وما الذي يتركه خامًا
summary: ضغط نتائج أداتي exec وbash المزعجة باستخدام Plugin مضمّن اختياري
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T08:11:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` هو Plugin مضمّن اختياري يضغط نتائج أداتي `exec` و`bash`
المزعجة بعد أن يكون الأمر قد نُفّذ بالفعل.

إنه يغيّر `tool_result` المعاد، وليس الأمر نفسه. ولا يقوم Tokenjuice
بإعادة كتابة إدخال shell، أو إعادة تشغيل الأوامر، أو تغيير رموز الخروج.

وينطبق هذا اليوم على عمليات تشغيل Pi المضمنة، حيث يربط tokenjuice
بمسار `tool_result` المضمن ويقلّص المخرجات التي تعود إلى الجلسة.

## تمكين Plugin

المسار السريع:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

المكافئ:

```bash
openclaw plugins enable tokenjuice
```

يشحن OpenClaw هذا Plugin بالفعل. ولا توجد خطوة منفصلة مثل `plugins install`
أو `tokenjuice install openclaw`.

إذا كنت تفضل تعديل التهيئة مباشرة:

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

- يضغط نتائج `exec` و`bash` المزعجة قبل إعادتها إلى الجلسة.
- يُبقي تنفيذ الأمر الأصلي من دون تغيير.
- يحافظ على قراءات محتوى الملفات الدقيقة وغيرها من الأوامر التي ينبغي أن يتركها tokenjuice خامًا.
- يظل اختياريًا: عطّل Plugin إذا كنت تريد مخرجات حرفية في كل مكان.

## التحقق من أنه يعمل

1. فعّل Plugin.
2. ابدأ جلسة يمكنها استدعاء `exec`.
3. شغّل أمرًا مزعجًا مثل `git status`.
4. تحقّق من أن نتيجة الأداة المعادة أقصر وأكثر تنظيمًا من مخرجات shell الخام.

## تعطيل Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

أو:

```bash
openclaw plugins disable tokenjuice
```

## ذو صلة

- [Exec tool](/ar/tools/exec)
- [Thinking levels](/ar/tools/thinking)
- [Context engine](/ar/concepts/context-engine)
