---
read_when:
    - إضافة أو تعديل إجراءات الرسائل في CLI
    - تغيير سلوك القناة الصادرة
summary: مرجع CLI لـ `openclaw message` (الإرسال + إجراءات القنوات)
title: الرسالة
x-i18n:
    generated_at: "2026-04-24T07:35:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39932fb54caee37bdf58681da22b30e1b4cc7cc11b654010bf0335b1da3b2b4d
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

أمر صادر موحّد لإرسال الرسائل وإجراءات القنوات
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## الاستخدام

```
openclaw message <subcommand> [flags]
```

اختيار القناة:

- يكون `--channel` مطلوبًا إذا كانت هناك أكثر من قناة واحدة مهيأة.
- إذا كانت هناك قناة واحدة مهيأة فقط، فتصبح هي القناة الافتراضية.
- القيم: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (يتطلب Mattermost وجود Plugin)

صيغ الهدف (`--target`):

- WhatsApp: ‏E.164 أو group JID
- Telegram: معرّف الدردشة أو `@username`
- Discord: ‏`channel:<id>` أو `user:<id>` (أو الإشارة `<@id>`؛ وتُعامل المعرّفات الرقمية الخام على أنها قنوات)
- Google Chat: ‏`spaces/<spaceId>` أو `users/<userId>`
- Slack: ‏`channel:<id>` أو `user:<id>` (يتم قبول معرّف القناة الخام)
- Mattermost (Plugin): ‏`channel:<id>` أو `user:<id>` أو `@username` (تُعامل المعرّفات المجردة على أنها قنوات)
- Signal: ‏`+E.164` أو `group:<id>` أو `signal:+E.164` أو `signal:group:<id>` أو `username:<name>`/`u:<name>`
- iMessage: المعرّف، أو `chat_id:<id>`، أو `chat_guid:<guid>`، أو `chat_identifier:<id>`
- Matrix: ‏`@user:server` أو `!room:server` أو `#alias:server`
- Microsoft Teams: معرّف المحادثة (`19:...@thread.tacv2`) أو `conversation:<id>` أو `user:<aad-object-id>`

حل الأسماء:

- بالنسبة إلى المزوّدين المدعومين (Discord/Slack/إلخ)، يتم حل أسماء القنوات مثل `Help` أو `#help` عبر ذاكرة التخزين المؤقت للدليل.
- عند عدم وجود نتيجة في الذاكرة المؤقتة، سيحاول OpenClaw إجراء بحث حي في الدليل عندما يدعم المزوّد ذلك.

## العلامات الشائعة

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (القناة أو المستخدم الهدف للإرسال/الاستطلاع/القراءة/إلخ)
- `--targets <name>` (يمكن تكراره؛ للبث فقط)
- `--json`
- `--dry-run`
- `--verbose`

## سلوك SecretRef

- يقوم `openclaw message` بحل SecretRefs المدعومة للقنوات قبل تشغيل الإجراء المحدد.
- يكون الحل ضمن نطاق الهدف النشط للإجراء عندما يكون ذلك ممكنًا:
  - ضمن نطاق القناة عندما يتم ضبط `--channel` (أو استنتاجه من أهداف مسبوقة مثل `discord:...`)
  - ضمن نطاق الحساب عندما يتم ضبط `--account` (الأسطح العامة للقناة + أسطح الحساب المحدد)
  - عند حذف `--account`، لا يفرض OpenClaw نطاق SecretRef لحساب `default`
- لا تمنع SecretRefs غير المحلولة في القنوات غير ذات الصلة إجراء رسالة موجّهة.
- إذا كان SecretRef للقناة/الحساب المحدد غير محلول، يفشل الأمر بشكل مغلق لهذا الإجراء.

## الإجراءات

### الأساسي

- `send`
  - القنوات: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - مطلوب: `--target`، بالإضافة إلى `--message` أو `--media` أو `--presentation`
  - اختياري: `--media`، و`--presentation`، و`--delivery`، و`--pin`، و`--reply-to`، و`--thread-id`، و`--gif-playback`، و`--force-document`، و`--silent`
  - حمولات العرض المشتركة: يرسل `--presentation` كتلًا دلالية (`text` و`context` و`divider` و`buttons` و`select`) يصيّرها الأساس عبر الإمكانات المعلنة للقناة المحددة. راجع [عرض الرسائل](/ar/plugins/message-presentation).
  - تفضيلات الإرسال العامة: يقبل `--delivery` تلميحات إرسال مثل `{ "pin": true }`؛ ويكون `--pin` اختصارًا للإرسال المثبّت عندما تدعم القناة ذلك.
  - Telegram فقط: ‏`--force-document` (إرسال الصور وGIF كملفات لتجنب ضغط Telegram)
  - Telegram فقط: ‏`--thread-id` (معرّف موضوع المنتدى)
  - Slack فقط: ‏`--thread-id` (الطابع الزمني لسلسلة الرسائل؛ ويستخدم `--reply-to` الحقل نفسه)
  - Telegram + Discord: ‏`--silent`
  - WhatsApp فقط: ‏`--gif-playback`

- `poll`
  - القنوات: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - مطلوب: `--target`، و`--poll-question`، و`--poll-option` (يمكن تكراره)
  - اختياري: `--poll-multi`
  - Discord فقط: ‏`--poll-duration-hours`، و`--silent`، و`--message`
  - Telegram فقط: ‏`--poll-duration-seconds` (من 5 إلى 600)، و`--silent`، و`--poll-anonymous` / `--poll-public`، و`--thread-id`

- `react`
  - القنوات: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - مطلوب: `--message-id`، و`--target`
  - اختياري: `--emoji`، و`--remove`، و`--participant`، و`--from-me`، و`--target-author`، و`--target-author-uuid`
  - ملاحظة: يتطلب `--remove` وجود `--emoji` (احذف `--emoji` لمسح تفاعلاتك الخاصة عندما يكون ذلك مدعومًا؛ راجع /tools/reactions)
  - WhatsApp فقط: ‏`--participant`، و`--from-me`
  - تفاعلات مجموعات Signal: يتطلب `--target-author` أو `--target-author-uuid`

- `reactions`
  - القنوات: Discord/Google Chat/Slack/Matrix
  - مطلوب: `--message-id`، و`--target`
  - اختياري: `--limit`

- `read`
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--target`
  - اختياري: `--limit`، و`--before`، و`--after`
  - Discord فقط: ‏`--around`

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
  - Matrix فقط: متاح عندما يكون تشفير Matrix مفعّلًا وتكون إجراءات التحقق مسموحًا بها

- `search`
  - القنوات: Discord
  - مطلوب: `--guild-id`، و`--query`
  - اختياري: `--channel-id`، و`--channel-ids` (يمكن تكراره)، و`--author-id`، و`--author-ids` (يمكن تكراره)، و`--limit`

### سلاسل الرسائل

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
  - مطلوب: `--target` (معرّف سلسلة الرسائل)، و`--message`
  - اختياري: `--media`، و`--reply-to`

### الرموز التعبيرية

- `emoji list`
  - Discord: ‏`--guild-id`
  - Slack: لا توجد علامات إضافية

- `emoji upload`
  - القنوات: Discord
  - مطلوب: `--guild-id`، و`--emoji-name`، و`--media`
  - اختياري: `--role-ids` (يمكن تكراره)

### الملصقات

- `sticker send`
  - القنوات: Discord
  - مطلوب: `--target`، و`--sticker-id` (يمكن تكراره)
  - اختياري: `--message`

- `sticker upload`
  - القنوات: Discord
  - مطلوب: `--guild-id`، و`--sticker-name`، و`--sticker-desc`، و`--sticker-tags`، و`--media`

### الأدوار / القنوات / الأعضاء / الصوت

- `role info` (Discord): ‏`--guild-id`
- `role add` / `role remove` (Discord): ‏`--guild-id`، و`--user-id`، و`--role-id`
- `channel info` (Discord): ‏`--target`
- `channel list` (Discord): ‏`--guild-id`
- `member info` (Discord/Slack): ‏`--user-id` (+ `--guild-id` لـ Discord)
- `voice status` (Discord): ‏`--guild-id`، و`--user-id`

### الأحداث

- `event list` (Discord): ‏`--guild-id`
- `event create` (Discord): ‏`--guild-id`، و`--event-name`، و`--start-time`
  - اختياري: `--end-time`، و`--desc`، و`--channel-id`، و`--location`، و`--event-type`

### الإشراف (Discord)

- `timeout`: ‏`--guild-id`، و`--user-id` (اختياري `--duration-min` أو `--until`؛ احذف الاثنين لإلغاء timeout)
- `kick`: ‏`--guild-id`، و`--user-id` (+ `--reason`)
- `ban`: ‏`--guild-id`، و`--user-id` (+ `--delete-days`، و`--reason`)
  - يدعم `timeout` أيضًا `--reason`

### البث

- `broadcast`
  - القنوات: أي قناة مهيأة؛ استخدم `--channel all` لاستهداف كل المزوّدين
  - مطلوب: `--targets <target...>`
  - اختياري: `--message`، و`--media`، و`--dry-run`

## أمثلة

إرسال رد على Discord:

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

يقوم الأساس بتصيير حمولة `presentation` نفسها إلى مكوّنات Discord، وكتل Slack، وأزرار Telegram المضمّنة، وخصائص Mattermost، أو بطاقات Teams/Feishu بحسب إمكانات القناة. راجع [عرض الرسائل](/ar/plugins/message-presentation) للاطلاع على العقد الكامل وقواعد الرجوع.

إرسال حمولة عرض أكثر غنى:

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

إنشاء استطلاع Telegram (إغلاق تلقائي بعد دقيقتين):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

إرسال رسالة استباقية إلى Teams:

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

إرسال أزرار Telegram المضمّنة عبر العرض العام:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

إرسال بطاقة Teams عبر العرض العام:

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
