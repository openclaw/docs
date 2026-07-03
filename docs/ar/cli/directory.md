---
read_when:
    - تريد البحث عن معرفات جهات الاتصال/المجموعات/الذات لقناة ما
    - أنت تطوّر محوّل دليل قناة
summary: مرجع CLI لـ `openclaw directory` (الذات، النظراء، المجموعات)
title: الدليل
x-i18n:
    generated_at: "2026-07-03T15:27:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

عمليات البحث في الدليل للقنوات التي تدعم ذلك (جهات الاتصال/النظراء، والمجموعات، و"me").

## العلامات الشائعة

- `--channel <name>`: معرف/اسم مستعار للقناة (مطلوب عند تكوين قنوات متعددة؛ تلقائي عند تكوين قناة واحدة فقط)
- `--account <id>`: معرف الحساب (الافتراضي: افتراضي القناة)
- `--json`: إخراج JSON

## ملاحظات

- يهدف `directory` إلى مساعدتك في العثور على المعرفات التي يمكنك لصقها في أوامر أخرى (خصوصًا `openclaw message send --target ...`).
- في العديد من القنوات، تكون النتائج مدعومة بالإعدادات (قوائم السماح / المجموعات المكوّنة) بدلًا من دليل مزود حي.
- لا يزال بإمكان Plugins القنوات المثبتة إغفال دعم الدليل؛ في هذه الحالة يبلّغ الأمر عن عملية الدليل غير المدعومة بدلًا من إعادة تثبيت Plugin.
- الإخراج الافتراضي هو `id` (وأحيانًا `name`) مفصولًا بعلامة جدولة؛ استخدم `--json` للبرمجة النصية.

## استخدام النتائج مع `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## تنسيقات المعرفات (حسب القناة)

- WhatsApp: `+15551234567` (رسالة مباشرة)، `1234567890-1234567890@g.us` (مجموعة)، `120363123456789@newsletter` (هدف إرسال صادر لقناة/نشرة إخبارية)
- Signal: الأسماء المستعارة المكوّنة تُحل إلى أهداف رسائل مباشرة E.164/UUID أو أهداف مجموعات `group:<id>`
- Telegram: `@username` أو معرف دردشة رقمي؛ المجموعات هي معرفات رقمية
- Slack: `user:U…` و`channel:C…`
- Discord: `user:<id>` و`channel:<id>`
- Matrix (Plugin): `user:@user:server`، أو `room:!roomId:server`، أو `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` و`conversation:<id>`
- Zalo (Plugin): معرف المستخدم (Bot API)
- Zalo Personal / `zalouser` (Plugin): معرف سلسلة المحادثة (رسالة مباشرة/مجموعة) من `zca` (`me`، `friend list`، `group list`)

## الذات ("me")

```bash
openclaw directory self --channel zalouser
```

## النظراء (جهات الاتصال/المستخدمون)

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
