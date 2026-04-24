---
read_when:
    - أنت تستخدم Plugin الخاص بـ voice-call وتريد نقاط إدخال CLI
    - أنت تريد أمثلة سريعة لـ `voicecall call|continue|dtmf|status|tail|expose`
summary: مرجع CLI لـ `openclaw voicecall` (سطح أوامر Plugin الخاص بـ voice-call)
title: Voicecall
x-i18n:
    generated_at: "2026-04-24T07:36:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` هو أمر يوفّره Plugin. ولا يظهر إلا إذا كان Plugin الخاص بـ voice-call مثبتًا ومفعّلًا.

المستند الأساسي:

- Plugin الخاص بـ Voice-call: [Voice Call](/ar/plugins/voice-call)

## الأوامر الشائعة

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## كشف Webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

ملاحظة أمنية: لا تكشف نقطة نهاية Webhook إلا للشبكات التي تثق بها. ويفضّل استخدام Tailscale Serve بدلًا من Funnel عندما يكون ذلك ممكنًا.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Plugin الخاص بالمكالمات الصوتية](/ar/plugins/voice-call)
