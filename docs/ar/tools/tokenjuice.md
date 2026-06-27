---
read_when:
    - تريد نتائج أدوات أقصر `exec` أو `bash` في OpenClaw
    - تريد تثبيت Plugin Tokenjuice أو تمكينه
    - تحتاج إلى فهم ما يغيّره tokenjuice وما يتركه خامًا
summary: ضغط نتائج أدوات exec و bash المليئة بالضجيج باستخدام Plugin الاختياري Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:47:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` هو Plugin خارجي اختياري يضغط نتائج أدوات `exec` و`bash`
المليئة بالضجيج بعد تشغيل الأمر بالفعل.

إنه يغيّر `tool_result` المُعاد، وليس الأمر نفسه. لا يعيد Tokenjuice
كتابة إدخال الصدفة، ولا يعيد تشغيل الأوامر، ولا يغيّر رموز الخروج.

ينطبق هذا اليوم على تشغيلات OpenClaw المضمّنة وأدوات OpenClaw الديناميكية في حزام
app-server الخاص بتطبيق Codex. يتصل Tokenjuice بالبرمجيات الوسيطة لنتائج الأدوات في OpenClaw
ويقلّم المخرجات قبل أن تعود إلى جلسة الحزام النشطة.

## تفعيل Plugin

ثبّته مرة واحدة:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

ثم فعّله:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

ما يكافئ ذلك:

```bash
openclaw plugins enable tokenjuice
```

إذا كنت تفضّل تعديل الإعدادات مباشرة:

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

- يضغط نتائج `exec` و`bash` المليئة بالضجيج قبل إعادتها إلى الجلسة.
- يبقي تنفيذ الأمر الأصلي دون تغيير.
- يحافظ على قراءات محتوى الملفات الدقيقة وغيرها من الأوامر التي يجب أن يتركها tokenjuice خامًا.
- يبقى اختياريًا: عطّل Plugin إذا كنت تريد المخرجات الحرفية في كل مكان.

## التحقق من أنه يعمل

1. فعّل Plugin.
2. ابدأ جلسة يمكنها استدعاء `exec`.
3. شغّل أمرًا كثير المخرجات مثل `git status`.
4. تحقق من أن نتيجة الأداة المُعادة أقصر وأكثر تنظيمًا من مخرجات الصدفة الخام.

## تعطيل Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

أو:

```bash
openclaw plugins disable tokenjuice
```

## ذات صلة

- [أداة Exec](/ar/tools/exec)
- [مستويات التفكير](/ar/tools/thinking)
- [محرك السياق](/ar/concepts/context-engine)
