---
read_when:
    - تريد البحث عن جهات الاتصال/المجموعات/معرّفات self الخاصة بقناة ما
    - أنت تطوّر مهايئ دليل قناة
summary: مرجع CLI لـ `openclaw directory` (self، والأقران، والمجموعات)
title: الدليل
x-i18n:
    generated_at: "2026-04-24T07:34:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

عمليات بحث الدليل للقنوات التي تدعم ذلك (جهات الاتصال/الأقران، والمجموعات، و"أنا").

## العلامات الشائعة

- `--channel <name>`: معرّف/اسم مستعار للقناة (مطلوب عند ضبط عدة قنوات؛ ويُحدَّد تلقائيًا عند ضبط قناة واحدة فقط)
- `--account <id>`: معرّف الحساب (الافتراضي: الحساب الافتراضي للقناة)
- `--json`: إخراج JSON

## ملاحظات

- يهدف `directory` إلى مساعدتك في العثور على المعرّفات التي يمكنك لصقها في أوامر أخرى (وخاصة `openclaw message send --target ...`).
- بالنسبة إلى كثير من القنوات، تكون النتائج مدعومة بالإعدادات (قوائم السماح / المجموعات المضبوطة) بدلًا من دليل provider مباشر.
- يكون الإخراج الافتراضي هو `id` (وأحيانًا `name`) مفصولين بعلامة تبويب؛ استخدم `--json` للبرمجة النصية.

## استخدام النتائج مع `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## تنسيقات المعرّفات (حسب القناة)

- WhatsApp: ‏`+15551234567` (رسالة مباشرة)، ‏`1234567890-1234567890@g.us` (مجموعة)
- Telegram: ‏`@username` أو معرّف دردشة رقمي؛ والمجموعات تكون معرّفات رقمية
- Slack: ‏`user:U…` و`channel:C…`
- Discord: ‏`user:<id>` و`channel:<id>`
- Matrix (Plugin): ‏`user:@user:server` و`room:!roomId:server` أو `#alias:server`
- Microsoft Teams (Plugin): ‏`user:<id>` و`conversation:<id>`
- Zalo (Plugin): معرّف المستخدم (Bot API)
- Zalo Personal / `zalouser` (Plugin): معرّف سلسلة المحادثة (مباشر/مجموعة) من `zca` ‏(`me` و`friend list` و`group list`)

## self ("أنا")

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
