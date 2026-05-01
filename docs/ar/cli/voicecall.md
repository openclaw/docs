---
read_when:
    - تستخدم Plugin المكالمات الصوتية وتريد نقاط دخول CLI
    - تريد أمثلة سريعة لـ `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: مرجع CLI لـ `openclaw voicecall` (واجهة أوامر Plugin المكالمات الصوتية)
title: مكالمة صوتية
x-i18n:
    generated_at: "2026-05-01T07:37:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` أمر يوفّره Plugin. لا يظهر إلا إذا كان Plugin المكالمات الصوتية مثبتًا ومفعّلًا.

عندما يكون Gateway قيد التشغيل، تُرسل الأوامر التشغيلية (`call`، و`start`،
و`continue`، و`speak`، و`dtmf`، و`end`، و`status`) إلى بيئة تشغيل المكالمات الصوتية
الخاصة بذلك Gateway. إذا لم يكن أي Gateway قابلًا للوصول، فإنها تعود إلى بيئة تشغيل
CLI مستقلة.

المستند الأساسي:

- Plugin المكالمات الصوتية: [المكالمة الصوتية](/ar/plugins/voice-call)

## الأوامر الشائعة

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

يطبع `setup` فحوصات الجاهزية بصيغة قابلة للقراءة البشرية افتراضيًا. استخدم `--json` من أجل
السكربتات:

```bash
openclaw voicecall setup --json
```

يطبع `status` المكالمات النشطة بصيغة JSON افتراضيًا. مرّر `--call-id <id>` لفحص
مكالمة واحدة.

بالنسبة إلى المزوّدين الخارجيين (`twilio`، و`telnyx`، و`plivo`)، يجب أن يحل الإعداد عنوان URL عامًا لـ
Webhook من `publicUrl` أو نفق أو تعريض عبر Tailscale. يُرفض الحل الاحتياطي للتقديم عبر loopback/خاص
لأن شركات الاتصالات لا يمكنها الوصول إليه.

يشغّل `smoke` فحوصات الجاهزية نفسها. لن يجري مكالمة هاتفية حقيقية
ما لم يكن كل من `--to` و`--yes` موجودين:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## إتاحة Webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

ملاحظة أمنية: لا تُتح نقطة نهاية Webhook إلا للشبكات التي تثق بها. فضّل Tailscale Serve على Funnel متى أمكن.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
