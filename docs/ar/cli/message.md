---
read_when:
    - إضافة إجراءات CLI الخاصة بالرسائل أو تعديلها
    - تغيير سلوك القناة الصادرة
summary: مرجع CLI لـ `openclaw message` (الإرسال + إجراءات القناة)
title: رسالة
x-i18n:
    generated_at: "2026-05-04T07:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ef57d33c93206a61a6d044667de4faf6340f7d8cc324300f235e838ee3b7ff1
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

أمر صادر واحد لإرسال الرسائل وإجراءات القنوات
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## الاستخدام

```
openclaw message <subcommand> [flags]
```

اختيار القناة:

- يكون `--channel` مطلوبًا إذا كانت هناك أكثر من قناة واحدة مهيأة.
- إذا كانت هناك قناة واحدة مهيأة بالضبط، فتصبح هي الافتراضية.
- القيم: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (يتطلب Mattermost وجود Plugin)
- يحل `openclaw message` القناة المحددة إلى Plugin المالك لها عند وجود `--channel` أو هدف مسبوق باسم قناة؛ وإلا فإنه يحمّل Plugins القنوات المهيأة لاستنتاج القناة الافتراضية.

تنسيقات الهدف (`--target`):

- WhatsApp: رقم E.164، أو JID مجموعة، أو JID قناة/نشرة WhatsApp (`...@newsletter`)
- Telegram: معرّف دردشة، أو `@username`، أو هدف موضوع منتدى (`-1001234567890:topic:42`، أو `--thread-id 42`)
- Discord: `channel:<id>` أو `user:<id>` (أو إشارة `<@id>`؛ وتُعامل المعرّفات الرقمية الخام كقنوات)
- Google Chat: `spaces/<spaceId>` أو `users/<userId>`
- Slack: `channel:<id>` أو `user:<id>` (يُقبل معرّف القناة الخام)
- Mattermost (Plugin): `channel:<id>`، أو `user:<id>`، أو `@username` (تُعامل المعرّفات المجردة كقنوات)
- Signal: `+E.164`، أو `group:<id>`، أو `signal:+E.164`، أو `signal:group:<id>`، أو `username:<name>`/`u:<name>`
- iMessage: مقبض، أو `chat_id:<id>`، أو `chat_guid:<guid>`، أو `chat_identifier:<id>`
- Matrix: `@user:server`، أو `!room:server`، أو `#alias:server`
- Microsoft Teams: معرّف محادثة (`19:...@thread.tacv2`) أو `conversation:<id>` أو `user:<aad-object-id>`

البحث بالاسم:

- لمقدمي الخدمة المدعومين (Discord/Slack/وغيرهما)، تُحل أسماء القنوات مثل `Help` أو `#help` عبر ذاكرة التخزين المؤقت للدليل.
- عند عدم العثور في ذاكرة التخزين المؤقت، سيحاول OpenClaw إجراء بحث مباشر في الدليل عندما يدعم مقدم الخدمة ذلك.

## الأعلام الشائعة

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (القناة أو المستخدم الهدف للإرسال/الاستطلاع/القراءة/وغير ذلك)
- `--targets <name>` (يُكرر؛ للبث فقط)
- `--json`
- `--dry-run`
- `--verbose`

## سلوك SecretRef

- يحل `openclaw message` قيم SecretRef المدعومة للقنوات قبل تشغيل الإجراء المحدد.
- يكون الحل محدودًا بهدف الإجراء النشط عندما يكون ذلك ممكنًا:
  - على مستوى القناة عندما يُعيّن `--channel` (أو يُستنتج من الأهداف المسبوقة مثل `discord:...`)
  - على مستوى الحساب عندما يُعيّن `--account` (عموميات القناة + واجهات الحساب المحدد)
  - عندما يُحذف `--account`، لا يفرض OpenClaw نطاق SecretRef لحساب `default`
- لا تمنع قيم SecretRef غير المحلولة في قنوات غير مرتبطة إجراء رسالة مستهدفًا.
- إذا كانت قيمة SecretRef للقناة/الحساب المحدد غير محلولة، يفشل الأمر فشلًا مغلقًا لذلك الإجراء.

## الإجراءات

### الأساسي

- `send`
  - القنوات: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - مطلوب: `--target`، بالإضافة إلى `--message` أو `--media` أو `--presentation`
  - اختياري: `--media`، `--presentation`، `--delivery`، `--pin`، `--reply-to`، `--thread-id`، `--gif-playback`، `--force-document`، `--silent`
  - حمولات العرض التقديمي المشتركة: يرسل `--presentation` كتلًا دلالية (`text`، `context`، `divider`، `buttons`، `select`) يعرضها القلب عبر القدرات المعلنة للقناة المحددة. راجع [عرض الرسائل](/ar/plugins/message-presentation).
  - تفضيلات التسليم العامة: يقبل `--delivery` تلميحات تسليم مثل `{ "pin": true }`؛ ويكون `--pin` اختصارًا للتسليم المثبت عندما تدعمه القناة.
  - Telegram فقط: `--force-document` (إرسال الصور وملفات GIF كمستندات لتجنب ضغط Telegram)
  - Telegram فقط: `--thread-id` (معرّف موضوع المنتدى)
  - Slack فقط: `--thread-id` (الطابع الزمني للسلسلة؛ يستخدم `--reply-to` الحقل نفسه)
  - Telegram + Discord: `--silent`
  - WhatsApp فقط: `--gif-playback`؛ تُخاطَب قنوات/نشرات WhatsApp باستخدام JID الأصلي `@newsletter`.

- `poll`
  - القنوات: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - مطلوب: `--target`، و`--poll-question`، و`--poll-option` (يُكرر)
  - اختياري: `--poll-multi`
  - Discord فقط: `--poll-duration-hours`، و`--silent`، و`--message`
  - Telegram فقط: `--poll-duration-seconds` (5-600)، و`--silent`، و`--poll-anonymous` / `--poll-public`، و`--thread-id`

- `react`
  - القنوات: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - مطلوب: `--message-id`، و`--target`
  - اختياري: `--emoji`، و`--remove`، و`--participant`، و`--from-me`، و`--target-author`، و`--target-author-uuid`
  - ملاحظة: يتطلب `--remove` وجود `--emoji` (احذف `--emoji` لمسح تفاعلاتك الخاصة حيث يكون ذلك مدعومًا؛ راجع /tools/reactions)
  - WhatsApp فقط: `--participant`، و`--from-me`
  - تفاعلات مجموعات Signal: يكون `--target-author` أو `--target-author-uuid` مطلوبًا

- `reactions`
  - القنوات: Discord/Google Chat/Slack/Matrix
  - مطلوب: `--message-id`، و`--target`
  - اختياري: `--limit`

- `read`
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--target`
  - اختياري: `--limit`، و`--message-id`، و`--before`، و`--after`
  - Slack فقط: يقرأ `--message-id` طابعًا زمنيًا محددًا لرسالة Slack؛ ادمجه مع `--thread-id` لقراءة رد محدد في سلسلة بدقة.
  - Discord فقط: `--around`

- `edit`
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--message-id`، و`--message`، و`--target`

- `delete`
  - القنوات: Discord/Slack/Telegram/Matrix
  - مطلوب: `--message-id`، و`--target`

- `pin` / `unpin`
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--message-id`، و`--target`

- `pins` (قائمة)
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--target`

- `permissions`
  - القنوات: Discord/Matrix
  - مطلوب: `--target`
  - Matrix فقط: متاح عندما يكون تشفير Matrix ممكّنًا وتكون إجراءات التحقق مسموحًا بها

- `search`
  - القنوات: Discord
  - مطلوب: `--guild-id`، و`--query`
  - اختياري: `--channel-id`، و`--channel-ids` (يُكرر)، و`--author-id`، و`--author-ids` (يُكرر)، و`--limit`

### السلاسل

- `thread create`
  - القنوات: Discord
  - مطلوب: `--thread-name`، و`--target` (معرّف القناة)
  - اختياري: `--message-id`، و`--message`، و`--auto-archive-min`

- `thread list`
  - القنوات: Discord
  - مطلوب: `--guild-id`
  - اختياري: `--channel-id`، و`--include-archived`، و`--before`، و`--limit`

- `thread reply`
  - القنوات: Discord
  - مطلوب: `--target` (معرّف السلسلة)، و`--message`
  - اختياري: `--media`، و`--reply-to`

### الرموز التعبيرية

- `emoji list`
  - Discord: `--guild-id`
  - Slack: لا توجد أعلام إضافية

- `emoji upload`
  - القنوات: Discord
  - مطلوب: `--guild-id`، و`--emoji-name`، و`--media`
  - اختياري: `--role-ids` (يُكرر)

### الملصقات

- `sticker send`
  - القنوات: Discord
  - مطلوب: `--target`، و`--sticker-id` (يُكرر)
  - اختياري: `--message`

- `sticker upload`
  - القنوات: Discord
  - مطلوب: `--guild-id`، و`--sticker-name`، و`--sticker-desc`، و`--sticker-tags`، و`--media`

### الأدوار / القنوات / الأعضاء / الصوت

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`، و`--user-id`، و`--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` لـ Discord)
- `voice status` (Discord): `--guild-id`، و`--user-id`

### الأحداث

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`، و`--event-name`، و`--start-time`
  - اختياري: `--end-time`، و`--desc`، و`--channel-id`، و`--location`، و`--event-type`

### الإشراف (Discord)

- `timeout`: `--guild-id`، و`--user-id` (اختياريًا `--duration-min` أو `--until`؛ احذف كليهما لمسح المهلة)
- `kick`: `--guild-id`، و`--user-id` (+ `--reason`)
- `ban`: `--guild-id`، و`--user-id` (+ `--delete-days`، و`--reason`)
  - يدعم `timeout` أيضًا `--reason`

### البث

- `broadcast`
  - القنوات: أي قناة مهيأة؛ استخدم `--channel all` لاستهداف جميع مقدمي الخدمة
  - مطلوب: `--targets <target...>`
  - اختياري: `--message`، و`--media`، و`--dry-run`

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

يعرض القلب حمولة `presentation` نفسها في مكوّنات Discord، أو كتل Slack، أو أزرار Telegram المضمنة، أو خصائص Mattermost، أو بطاقات Teams/Feishu بحسب قدرة القناة. راجع [عرض الرسائل](/ar/plugins/message-presentation) للاطلاع على العقد الكامل وقواعد الرجوع الاحتياطي.

إرسال حمولة عرض تقديمي أغنى:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

إنشاء استطلاع Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

إنشاء استطلاع Telegram (إغلاق تلقائي خلال دقيقتين):

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

إنشاء استطلاع Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

التفاعل في Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

التفاعل في مجموعة Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

إرسال أزرار Telegram مضمنة عبر العرض التقديمي العام:

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
- [إرسال الوكيل](/ar/tools/agent-send)
