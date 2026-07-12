---
read_when:
    - تريد نتائج أقصر لأداتي `exec` أو `bash` في OpenClaw
    - تريد تثبيت Plugin Tokenjuice أو تمكينه
    - تحتاج إلى فهم ما الذي يغيّره tokenjuice وما الذي يتركه دون معالجة
summary: ضغط نتائج أداتي `exec` و`bash` كثيرة الضوضاء باستخدام Plugin ‏Tokenjuice الاختياري
title: عصارة الرموز المميزة
x-i18n:
    generated_at: "2026-07-12T06:38:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` هو Plugin خارجي اختياري يضغط نتائج أداتي `exec` و`bash`
المليئة بالضوضاء بعد تنفيذ الأمر بالفعل.

وهو يغيّر `tool_result` المُعاد، وليس الأمر نفسه. لا يعيد Tokenjuice
كتابة مُدخلات الصدفة، ولا يعيد تنفيذ الأوامر، ولا يغيّر رموز الخروج.

ينطبق هذا حاليًا على عمليات التشغيل المضمّنة في OpenClaw وأدوات OpenClaw الديناميكية في بيئة
app-server التجريبية لتطبيق Codex. يرتبط Tokenjuice بالبرمجية الوسيطة لنتائج الأدوات في OpenClaw
ويختصر المخرجات قبل إعادتها إلى جلسة البيئة التجريبية النشطة.

## تفعيل Plugin

ثبّته مرة واحدة:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

ثم فعّله:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

الأمر المكافئ:

```bash
openclaw plugins enable tokenjuice
```

إذا كنت تفضّل تعديل الإعداد مباشرةً:

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
- يُبقي تنفيذ الأمر الأصلي دون تغيير.
- يطبّق سياسة جرد آمنة: تظل قراءات محتوى الملفات الدقيقة بصيغتها الخام، ويمكن ضغط أوامر جرد المستودع المستقلة، بينما تظل تسلسلات الأوامر المختلطة غير الآمنة بصيغتها الخام.
- يظل اختياريًا: عطّل Plugin إذا كنت تريد مخرجات حرفية في كل موضع.

## التحقق من عمله

1. فعّل Plugin.
2. ابدأ جلسة يمكنها استدعاء `exec`.
3. نفّذ أمرًا كثير المخرجات مثل `git status`.
4. تحقّق من أن نتيجة الأداة المُعادة أقصر وأكثر تنظيمًا من مخرجات الصدفة الخام.

## تعطيل Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

أو:

```bash
openclaw plugins disable tokenjuice
```

## موضوعات ذات صلة

- [أداة Exec](/ar/tools/exec)
- [مستويات التفكير](/ar/tools/thinking)
- [محرك السياق](/ar/concepts/context-engine)
