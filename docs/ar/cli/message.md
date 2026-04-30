---
read_when:
    - إضافة إجراءات CLI للرسائل أو تعديلها
    - تغيير سلوك القناة الصادرة
summary: مرجع CLI لـ `openclaw message` (الإرسال + إجراءات القنوات)
title: رسالة
x-i18n:
    generated_at: "2026-04-30T07:49:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43f14b3815d89c92a7503e620e2424f41a3f6b92e20e089504017305b19bace4
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

أمر صادر واحد لإرسال الرسائل وإجراءات القنوات
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## الاستخدام

```
openclaw message <subcommand> [flags]
```

اختيار القناة:

- يكون `--channel` مطلوبًا إذا كانت هناك أكثر من قناة واحدة مهيأة.
- إذا كانت هناك قناة واحدة مهيأة بالضبط، فتصبح القناة الافتراضية.
- القيم: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (يتطلب Mattermost plugin)
- يحل `openclaw message` القناة المحددة إلى plugin المالكة لها عند وجود `--channel` أو هدف مسبوق باسم قناة؛ وإلا فإنه يحمّل plugins القنوات المهيأة لاستنتاج القناة الافتراضية.

تنسيقات الهدف (`--target`):

- WhatsApp: E.164 أو JID مجموعة
- Telegram: معرّف الدردشة أو `@username`
- Discord: `channel:<id>` أو `user:<id>` (أو إشارة `<@id>`؛ تُعامل المعرّفات الرقمية الخام كقنوات)
- Google Chat: `spaces/<spaceId>` أو `users/<userId>`
- Slack: `channel:<id>` أو `user:<id>` (يُقبل معرّف القناة الخام)
- Mattermost (plugin): `channel:<id>` أو `user:<id>` أو `@username` (تُعامل المعرّفات المجردة كقنوات)
- Signal: `+E.164` أو `group:<id>` أو `signal:+E.164` أو `signal:group:<id>` أو `username:<name>`/`u:<name>`
- iMessage: المعرّف، أو `chat_id:<id>`، أو `chat_guid:<guid>`، أو `chat_identifier:<id>`
- Matrix: `@user:server` أو `!room:server` أو `#alias:server`
- Microsoft Teams: معرّف المحادثة (`19:...@thread.tacv2`) أو `conversation:<id>` أو `user:<aad-object-id>`

البحث بالاسم:

- بالنسبة إلى المزوّدين المدعومين (Discord/Slack/إلخ)، تُحل أسماء القنوات مثل `Help` أو `#help` عبر ذاكرة التخزين المؤقت للدليل.
- عند عدم وجود نتيجة في ذاكرة التخزين المؤقت، سيحاول OpenClaw إجراء بحث مباشر في الدليل عندما يدعم المزوّد ذلك.

## الأعلام الشائعة

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (القناة أو المستخدم الهدف للإرسال/الاستطلاع/القراءة/إلخ)
- `--targets <name>` (يُكرر؛ للبث فقط)
- `--json`
- `--dry-run`
- `--verbose`

## سلوك SecretRef

- يحل `openclaw message` قيم SecretRefs المدعومة للقنوات قبل تشغيل الإجراء المحدد.
- يكون الحل محصورًا في هدف الإجراء النشط عندما يكون ذلك ممكنًا:
  - بنطاق القناة عند تعيين `--channel` (أو استنتاجها من أهداف مسبوقة مثل `discord:...`)
  - بنطاق الحساب عند تعيين `--account` (عموميات القناة + أسطح الحساب المحدد)
  - عند حذف `--account`، لا يفرض OpenClaw نطاق SecretRef لحساب `default`
- لا تمنع SecretRefs غير المحلولة في القنوات غير ذات الصلة إجراء رسالة مستهدفًا.
- إذا لم يتم حل SecretRef للقناة/الحساب المحدد، يفشل الأمر بشكل مغلق لذلك الإجراء.

## الإجراءات

### الأساسي

- `send`
  - القنوات: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - مطلوب: `--target`، بالإضافة إلى `--message` أو `--media` أو `--presentation`
  - اختياري: `--media`، `--presentation`، `--delivery`، `--pin`، `--reply-to`، `--thread-id`، `--gif-playback`، `--force-document`، `--silent`
  - حمولات العرض التقديمي المشتركة: يرسل `--presentation` كتلًا دلالية (`text`، `context`، `divider`، `buttons`، `select`) يعرضها النواة عبر القدرات المعلنة للقناة المحددة. راجع [عرض الرسائل](/ar/plugins/message-presentation).
  - تفضيلات التسليم العامة: يقبل `--delivery` تلميحات تسليم مثل `{ "pin": true }`؛ ويُعد `--pin` اختصارًا للتسليم المثبت عندما تدعمه القناة.
  - Telegram فقط: `--force-document` (إرسال الصور وملفات GIF كمستندات لتجنب ضغط Telegram)
  - Telegram فقط: `--thread-id` (معرّف موضوع المنتدى)
  - Slack فقط: `--thread-id` (طابع وقت سلسلة المحادثات؛ يستخدم `--reply-to` الحقل نفسه)
  - Telegram + Discord: `--silent`
  - WhatsApp فقط: `--gif-playback`

- `poll`
  - القنوات: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - مطلوب: `--target`، `--poll-question`، `--poll-option` (يُكرر)
  - اختياري: `--poll-multi`
  - Discord فقط: `--poll-duration-hours`، `--silent`، `--message`
  - Telegram فقط: `--poll-duration-seconds` (5-600)، `--silent`، `--poll-anonymous` / `--poll-public`، `--thread-id`

- `react`
  - القنوات: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - مطلوب: `--message-id`، `--target`
  - اختياري: `--emoji`، `--remove`، `--participant`، `--from-me`، `--target-author`، `--target-author-uuid`
  - ملاحظة: يتطلب `--remove` وجود `--emoji` (احذف `--emoji` لمسح تفاعلاتك حيثما يكون ذلك مدعومًا؛ راجع /tools/reactions)
  - WhatsApp فقط: `--participant`، `--from-me`
  - تفاعلات مجموعات Signal: يكون `--target-author` أو `--target-author-uuid` مطلوبًا

- `reactions`
  - القنوات: Discord/Google Chat/Slack/Matrix
  - مطلوب: `--message-id`، `--target`
  - اختياري: `--limit`

- `read`
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--target`
  - اختياري: `--limit`، `--before`، `--after`
  - Discord فقط: `--around`

- `edit`
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--message-id`، `--message`، `--target`

- `delete`
  - القنوات: Discord/Slack/Telegram/Matrix
  - مطلوب: `--message-id`، `--target`

- `pin` / `unpin`
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--message-id`، `--target`

- `pins` (قائمة)
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--target`

- `permissions`
  - القنوات: Discord/Matrix
  - مطلوب: `--target`
  - Matrix فقط: متاح عند تمكين تشفير Matrix والسماح بإجراءات التحقق

- `search`
  - القنوات: Discord
  - مطلوب: `--guild-id`، `--query`
  - اختياري: `--channel-id`، `--channel-ids` (يُكرر)، `--author-id`، `--author-ids` (يُكرر)، `--limit`

### سلاسل المحادثات

- `thread create`
  - القنوات: Discord
  - مطلوب: `--thread-name`، `--target` (معرّف القناة)
  - اختياري: `--message-id`، `--message`، `--auto-archive-min`

- `thread list`
  - القنوات: Discord
  - مطلوب: `--guild-id`
  - اختياري: `--channel-id`، `--include-archived`، `--before`، `--limit`

- `thread reply`
  - القنوات: Discord
  - مطلوب: `--target` (معرّف سلسلة المحادثات)، `--message`
  - اختياري: `--media`، `--reply-to`

### الرموز التعبيرية

- `emoji list`
  - Discord: `--guild-id`
  - Slack: لا توجد أعلام إضافية

- `emoji upload`
  - القنوات: Discord
  - مطلوب: `--guild-id`، `--emoji-name`، `--media`
  - اختياري: `--role-ids` (يُكرر)

### الملصقات

- `sticker send`
  - القنوات: Discord
  - مطلوب: `--target`، `--sticker-id` (يُكرر)
  - اختياري: `--message`

- `sticker upload`
  - القنوات: Discord
  - مطلوب: `--guild-id`، `--sticker-name`، `--sticker-desc`، `--sticker-tags`، `--media`

### الأدوار / القنوات / الأعضاء / الصوت

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`، `--user-id`، `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` لـ Discord)
- `voice status` (Discord): `--guild-id`، `--user-id`

### الأحداث

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`، `--event-name`، `--start-time`
  - اختياري: `--end-time`، `--desc`، `--channel-id`، `--location`، `--event-type`

### الإشراف (Discord)

- `timeout`: `--guild-id`، `--user-id` (اختياريًا `--duration-min` أو `--until`؛ احذف كليهما لمسح المهلة)
- `kick`: `--guild-id`، `--user-id` (+ `--reason`)
- `ban`: `--guild-id`، `--user-id` (+ `--delete-days`، `--reason`)
  - يدعم `timeout` أيضًا `--reason`

### البث

- `broadcast`
  - القنوات: أي قناة مهيأة؛ استخدم `--channel all` لاستهداف جميع المزوّدين
  - مطلوب: `--targets <target...>`
  - اختياري: `--message`، `--media`، `--dry-run`

## أمثلة

إرسال رد في Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

إرسال رسالة بأزرار دلالية:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

تعرض النواة حمولة `presentation` نفسها إلى مكونات Discord، أو كتل Slack، أو أزرار Telegram المضمنة، أو خصائص Mattermost، أو بطاقات Teams/Feishu بحسب قدرة القناة. راجع [عرض الرسائل](/ar/plugins/message-presentation) للعقد الكامل وقواعد الرجوع.

إرسال حمولة عرض تقديمي أكثر ثراءً:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

إنشاء استطلاع في Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

إنشاء استطلاع في Telegram (إغلاق تلقائي خلال دقيقتين):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

إرسال رسالة استباقية في Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

إنشاء استطلاع في Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

إضافة تفاعل في Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

إضافة تفاعل في مجموعة Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

إرسال أزرار Telegram المضمنة عبر العرض التقديمي العام:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

إرسال بطاقة Teams عبر العرض التقديمي العام:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

إرسال صورة Telegram كمستند لتجنب الضغط:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إرسال Agent](/ar/tools/agent-send)
