---
read_when:
    - تريد البحث عن معرّفات جهات الاتصال/المجموعات/الحساب نفسه لقناة
    - أنت تطوّر محوّل دليل القنوات
summary: مرجع CLI لـ `openclaw directory` (الذات، النظراء، المجموعات)
title: الدليل
x-i18n:
    generated_at: "2026-05-06T17:52:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

عمليات البحث في الدليل للقنوات التي تدعم ذلك (جهات الاتصال/الأقران، والمجموعات، و"أنا").

## العلامات الشائعة

- `--channel <name>`: معرّف/اسم مستعار للقناة (مطلوب عند تكوين عدة قنوات؛ تلقائي عند تكوين قناة واحدة فقط)
- `--account <id>`: معرّف الحساب (الافتراضي: افتراضي القناة)
- `--json`: إخراج JSON

## ملاحظات

- يهدف `directory` إلى مساعدتك في العثور على المعرّفات التي يمكنك لصقها في أوامر أخرى (خصوصًا `openclaw message send --target ...`).
- بالنسبة إلى كثير من القنوات، تكون النتائج مستندة إلى التكوين (قوائم السماح / المجموعات المكوّنة) بدلًا من دليل موفّر مباشر.
- لا يزال بإمكان Plugins القنوات المثبتة إغفال دعم الدليل؛ في هذه الحالة يبلّغ الأمر عن عملية الدليل غير المدعومة بدلًا من إعادة تثبيت Plugin.
- الإخراج الافتراضي هو `id` (وأحيانًا `name`) مفصولًا بعلامة تبويب؛ استخدم `--json` للبرمجة النصية.

## استخدام النتائج مع `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## صيغ المعرّفات (حسب القناة)

- WhatsApp: `+15551234567` (رسالة مباشرة)، `1234567890-1234567890@g.us` (مجموعة)، `120363123456789@newsletter` (هدف صادر لقناة/نشرة إخبارية)
- Telegram: `@username` أو معرّف دردشة رقمي؛ المجموعات هي معرّفات رقمية
- Slack: `user:U…` و`channel:C…`
- Discord: `user:<id>` و`channel:<id>`
- Matrix (Plugin): `user:@user:server` أو `room:!roomId:server` أو `#alias:server`
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

## ذات صلة

- [مرجع CLI](/ar/cli)
