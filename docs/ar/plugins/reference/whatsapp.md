---
read_when:
    - تقوم بتثبيت Plugin الخاص بـ WhatsApp أو تكوينه أو تدقيقه
summary: يضيف واجهة قناة WhatsApp لإرسال رسائل OpenClaw واستلامها.
title: Plugin WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:19:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# WhatsApp Plugin

يضيف سطح قناة WhatsApp لإرسال رسائل OpenClaw واستقبالها.

## التوزيع

- الحزمة: `@openclaw/whatsapp`
- مسار التثبيت: npm؛ ClawHub

## السطح

channels: whatsapp

## ملاحظة تثبيت Windows

على Windows، يحتاج WhatsApp Plugin إلى وجود Git في `PATH` أثناء تثبيت npm لأن إحدى تبعيات Baileys/libsignal الخاصة به تُجلب من عنوان URL خاص بـ git. ثبّت Git for Windows، ثم أعد تشغيل الصدفة وأعد تنفيذ التثبيت:

```powershell
winget install --id Git.Git -e
```

يعمل Portable Git أيضًا إذا كان دليل `bin` الخاص به موجودًا في `PATH`.

## المستندات ذات الصلة

- [whatsapp](/ar/channels/whatsapp)
