---
read_when:
    - تريد البحث عن معرّفات جهات الاتصال/المجموعات/المعرّف الذاتي لقناة ما
    - أنت تطوّر محوّلًا لدليل القنوات
summary: مرجع CLI لـ `openclaw directory` (الذات، والنظراء، والمجموعات)
title: الدليل
x-i18n:
    generated_at: "2026-07-12T05:44:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

عمليات البحث في الدليل للقنوات التي تدعمها: جهات الاتصال/الأقران، والمجموعات، و«أنا» (الذات).

النتائج معدّة للصقها في أوامر أخرى، وخصوصًا `openclaw message send --target ...`.

## الخيارات الشائعة

- `--channel <name>`: معرّف القناة/اسمها المستعار (مطلوب عند إعداد قنوات متعددة؛ ويُحدَّد تلقائيًا عند إعداد قناة واحدة فقط)
- `--account <id>`: معرّف الحساب (الافتراضي: الحساب الافتراضي للقناة)
- `--json`: إخراج JSON

الإخراج الافتراضي (غير JSON) هو `id` (وأحيانًا `name`) مفصولًا بعلامة جدولة.

## ملاحظات

- في العديد من القنوات، تستند النتائج إلى الإعدادات (قوائم السماح / المجموعات المعدّة) بدلًا من دليل مباشر لدى المزوّد.
- قد تفتقر إضافة قناة مثبّتة بالفعل إلى دعم الدليل. في هذه الحالة، يُبلغ الأمر بأن العملية غير مدعومة؛ ولا يحاول إعادة تثبيت الإضافة أو ترقيتها لإضافة الدعم.

## استخدام النتائج مع `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## تنسيقات المعرّفات حسب القناة

| القناة                              | تنسيق معرّف الهدف                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (رسالة مباشرة)، `1234567890-1234567890@g.us` (مجموعة)، `120363123456789@newsletter` (قناة/نشرة إخبارية، للإرسال فقط) |
| Signal                              | تُحوَّل الأسماء المستعارة المعدّة إلى أهداف رسائل مباشرة بصيغة E.164/UUID أو أهداف مجموعات بصيغة `group:<id>`                 |
| Telegram                            | `@username` أو معرّف محادثة رقمي؛ تستخدم المجموعات معرّفات رقمية                                                               |
| Slack                               | `user:U…` و`channel:C…`                                                                                                       |
| Discord                             | `user:<id>` و`channel:<id>`                                                                                                   |
| Matrix (إضافة)                      | `user:@user:server` أو `room:!roomId:server` أو `#alias:server`                                                               |
| Microsoft Teams (إضافة)             | `user:<id>` و`conversation:<id>`                                                                                              |
| Zalo (إضافة)                        | معرّف المستخدم (Bot API)                                                                                                     |
| Zalo Personal / `zalouser` (إضافة) | معرّف سلسلة المحادثة (رسالة مباشرة/مجموعة)، من `zca` ‏(`me`، و`friend list`، و`group list`)                                  |

## الذات («أنا»)

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
