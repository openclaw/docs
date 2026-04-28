---
read_when:
    - تريد استخدام Gradium لتحويل النص إلى كلام
    - تحتاج إلى مفتاح API أو إعدادات الصوت الخاصة بـ Gradium
summary: استخدم Gradium لتحويل النص إلى كلام في OpenClaw
title: Gradium
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T13:56:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium هو موفّر مضمّن لتحويل النص إلى كلام في OpenClaw. ويمكنه إنشاء
ردود صوتية عادية، ومخرجات Opus متوافقة مع الملاحظات الصوتية، وصوت
u-law بتردد 8 kHz لواجهات الاتصالات الهاتفية.

## الإعداد

أنشئ مفتاح API لـ Gradium، ثم عرّضه إلى OpenClaw:

```bash
export GRADIUM_API_KEY="gsk_..."
```

يمكنك أيضًا تخزين المفتاح في الإعدادات تحت `messages.tts.providers.gradium.apiKey`.

## الإعدادات

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## الأصوات

| الاسم | معرّف الصوت |
| --------- | ------------------ |
| Emma | `YTpq7expH9539ERJ` |
| Kent | `LFZvm12tW_z0xfGo` |
| Tiffany | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney | `jtEKaLYNn6iif5PR` |
| John | `KWJiFWu2O9nMPYcR` |
| Arthur | `3jUdJyOi9pgbxBTK` |

الصوت الافتراضي: Emma.

## المخرجات

- تستخدم الردود الصوتية كملفات تنسيق WAV.
- تستخدم الردود على شكل ملاحظات صوتية تنسيق Opus وتُعلَّم على أنها متوافقة مع الصوت.
- يستخدم التخليق الصوتي للاتصالات الهاتفية `ulaw_8000` بتردد 8 kHz.

## ذو صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [نظرة عامة على الوسائط](/ar/tools/media-overview)
