---
read_when:
    - تريد البحث عن معرّفات جهات الاتصال/المجموعات/المعرّفات الذاتية لقناة
    - أنت تطوّر محوّل دليل القنوات
summary: مرجع CLI لـ `openclaw directory` (الذات، الأقران، المجموعات)
title: الدليل
x-i18n:
    generated_at: "2026-05-02T07:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

عمليات البحث في الدليل للقنوات التي تدعم ذلك (جهات الاتصال/الأقران، والمجموعات، و"أنا").

## الخيارات الشائعة

- `--channel <name>`: معرّف/اسم مستعار للقناة (مطلوب عند تكوين عدة قنوات؛ تلقائي عند تكوين قناة واحدة فقط)
- `--account <id>`: معرّف الحساب (الافتراضي: الإعداد الافتراضي للقناة)
- `--json`: إخراج JSON

## ملاحظات

- يهدف `directory` إلى مساعدتك في العثور على معرّفات يمكنك لصقها في أوامر أخرى (خصوصًا `openclaw message send --target ...`).
- بالنسبة إلى كثير من القنوات، تكون النتائج مدعومة بالإعدادات (قوائم السماح / المجموعات المكوّنة) بدلًا من دليل مباشر من المزوّد.
- ما زال بإمكان Plugins القنوات المثبّتة حذف دعم الدليل؛ في هذه الحالة يبلّغ الأمر عن عملية الدليل غير المدعومة بدلًا من إعادة تثبيت Plugin.
- الإخراج الافتراضي هو `id` (وأحيانًا `name`) مفصولًا بعلامة جدولة؛ استخدم `--json` للبرمجة النصية.

## استخدام النتائج مع `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## تنسيقات المعرّفات (حسب القناة)

- WhatsApp: `+15551234567` (رسالة مباشرة)، `1234567890-1234567890@g.us` (مجموعة)
- Telegram: `@username` أو معرّف دردشة رقمي؛ المجموعات هي معرّفات رقمية
- Slack: `user:U…` و`channel:C…`
- Discord: `user:<id>` و`channel:<id>`
- Matrix (Plugin): `user:@user:server`، أو `room:!roomId:server`، أو `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` و`conversation:<id>`
- Zalo (Plugin): معرّف المستخدم (Bot API)
- Zalo Personal / `zalouser` (Plugin): معرّف سلسلة المحادثة (رسالة مباشرة/مجموعة) من `zca` (`me`، `friend list`، `group list`)

## الذات ("أنا")

```bash
openclaw directory self --channel zalouser
```

## الأقران (جهات الاتصال/المستخدمون)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## المجموعات

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## ذو صلة

- [مرجع CLI](/ar/cli)
