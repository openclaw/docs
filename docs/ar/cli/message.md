---
read_when:
    - إضافة إجراءات CLI للرسائل أو تعديلها
    - تغيير سلوك القناة الصادرة
summary: مرجع CLI لـ `openclaw message` (إرسال + إجراءات القناة)
title: الرسالة
x-i18n:
    generated_at: "2026-06-27T17:22:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
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
- إذا كانت هناك قناة واحدة مهيأة بالضبط، تصبح هي الافتراضية.
- القيم: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (يتطلب Mattermost ‏Plugin)
- يحل `openclaw message` القناة المحددة إلى Plugin المالكة لها عند وجود `--channel` أو هدف مسبوق باسم قناة؛ وإلا فإنه يحمّل Plugins القنوات المهيأة لاستنتاج القناة الافتراضية.

تنسيقات الهدف (`--target`):

- WhatsApp: ‏E.164، أو JID مجموعة، أو JID قناة/نشرة WhatsApp (`...@newsletter`)
- Telegram: معرّف المحادثة، أو `@username`، أو هدف موضوع منتدى (`-1001234567890:topic:42`، أو `--thread-id 42`)
- Discord: ‏`channel:<id>` أو `user:<id>` (أو إشارة `<@id>`؛ تُعامل المعرّفات الرقمية الخام كقنوات)
- Google Chat: ‏`spaces/<spaceId>` أو `users/<userId>`
- Slack: ‏`channel:<id>` أو `user:<id>` (يُقبل معرّف القناة الخام)
- Mattermost ‏(Plugin): ‏`channel:<id>`، أو `user:<id>`، أو `@username` (تُعامل المعرّفات المجردة كقنوات)
- Signal: ‏`+E.164`، أو `group:<id>`، أو `signal:+E.164`، أو `signal:group:<id>`، أو `username:<name>`/`u:<name>`
- iMessage: المقبض، أو `chat_id:<id>`، أو `chat_guid:<guid>`، أو `chat_identifier:<id>`
- Matrix: ‏`@user:server`، أو `!room:server`، أو `#alias:server`
- Microsoft Teams: معرّف المحادثة (`19:...@thread.tacv2`) أو `conversation:<id>` أو `user:<aad-object-id>`

البحث بالاسم:

- بالنسبة إلى المزوّدين المدعومين (Discord/Slack/إلخ)، تُحل أسماء القنوات مثل `Help` أو `#help` عبر ذاكرة التخزين المؤقت للدليل.
- عند إخفاق العثور في ذاكرة التخزين المؤقت، سيحاول OpenClaw إجراء بحث مباشر في الدليل عندما يدعمه المزوّد.

## الأعلام الشائعة

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (القناة أو المستخدم الهدف للإرسال/الاستطلاع/القراءة/إلخ)
- `--targets <name>` (يُكرر؛ للبث فقط)
- `--json`
- `--dry-run`
- `--verbose`

## سلوك SecretRef

- يحل `openclaw message` ‏SecretRefs القنوات المدعومة قبل تشغيل الإجراء المحدد.
- يكون الحل مقيدًا بهدف الإجراء النشط عندما يكون ذلك ممكنًا:
  - على نطاق القناة عند تعيين `--channel` (أو استنتاجه من الأهداف المسبوقة مثل `discord:...`)
  - على نطاق الحساب عند تعيين `--account` (عموميات القناة + أسطح الحساب المحدد)
  - عند حذف `--account`، لا يفرض OpenClaw نطاق SecretRef لحساب `default`
- لا تمنع SecretRefs غير المحلولة في القنوات غير ذات الصلة إجراء رسالة موجّهة.
- إذا كان SecretRef للقناة/الحساب المحدد غير محلول، يفشل الأمر بإغلاق آمن لذلك الإجراء.

## الإجراءات

### الأساسي

- `send`
  - القنوات: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost ‏(Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - مطلوب: `--target`، بالإضافة إلى `--message`، أو `--media`، أو `--presentation`
  - اختياري: `--media`، `--presentation`، `--delivery`، `--pin`، `--reply-to`، `--thread-id`، `--gif-playback`، `--force-document`، `--silent`
  - حمولات العرض التقديمي المشتركة: يرسل `--presentation` كتلًا دلالية (`text`، `context`، `divider`، `buttons`، `select`) يعرضها core عبر القدرات المعلنة للقناة المحددة. راجع [عرض الرسائل](/ar/plugins/message-presentation).
  - تفضيلات التسليم العامة: يقبل `--delivery` تلميحات تسليم مثل `{ "pin": true }`؛ ويُعد `--pin` اختصارًا للتسليم المثبت عندما تدعمه القناة.
  - Telegram + WhatsApp: ‏`--force-document` (إرسال الصور وملفات GIF ومقاطع الفيديو كمستندات لتجنب ضغط القناة)
  - Telegram فقط: `--thread-id` (معرّف موضوع المنتدى)
  - Slack فقط: `--thread-id` (طابع زمني للسلسلة؛ يستخدم `--reply-to` الحقل نفسه)
  - Telegram + Discord: ‏`--silent`
  - WhatsApp فقط: `--gif-playback`؛ تُخاطب قنوات/نشرات WhatsApp باستخدام JID الأصلي `@newsletter`.

- `poll`
  - القنوات: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - مطلوب: `--target`، و`--poll-question`، و`--poll-option` (يُكرر)
  - اختياري: `--poll-multi`
  - Discord فقط: `--poll-duration-hours`، `--silent`، `--message`
  - Telegram فقط: `--poll-duration-seconds` (5-600)، `--silent`، `--poll-anonymous` / `--poll-public`، `--thread-id`

- `react`
  - القنوات: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - مطلوب: `--message-id`، و`--target`
  - اختياري: `--emoji`، `--remove`، `--participant`، `--from-me`، `--target-author`، `--target-author-uuid`
  - ملاحظة: يتطلب `--remove` ‏`--emoji` (احذف `--emoji` لمسح تفاعلاتك حيثما كان ذلك مدعومًا؛ راجع /tools/reactions)
  - WhatsApp فقط: `--participant`، `--from-me`
  - تفاعلات مجموعات Signal: يلزم `--target-author` أو `--target-author-uuid`
  - Nextcloud Talk: إضافة التفاعلات فقط؛ يُرفض `--remove` بخطأ واضح (راجع /tools/reactions)

- `reactions`
  - القنوات: Discord/Google Chat/Slack/Matrix
  - مطلوب: `--message-id`، و`--target`
  - اختياري: `--limit`

- `read`
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--target`
  - اختياري: `--limit`، `--message-id`، `--before`، `--after`
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

- `pins` (سرد)
  - القنوات: Discord/Slack/Matrix
  - مطلوب: `--target`

- `permissions`
  - القنوات: Discord/Matrix
  - مطلوب: `--target`
  - Matrix فقط: متاح عند تمكين تشفير Matrix والسماح بإجراءات التحقق

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
  - Discord: ‏`--guild-id`
  - Slack: لا أعلام إضافية

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
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` لـ Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### الأحداث

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - اختياري: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### الإشراف (Discord)

- `timeout`: `--guild-id`, `--user-id` (اختياريًا `--duration-min` أو `--until`؛ احذف كليهما لمسح المهلة)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - يدعم `timeout` أيضًا `--reason`

### البث

- `broadcast`
  - القنوات: أي قناة مكوّنة؛ استخدم `--channel all` لاستهداف جميع المزوّدين
  - مطلوب: `--targets <target...>`
  - اختياري: `--message`, `--media`, `--dry-run`

## أمثلة

أرسل ردًا في Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

أرسل رسالة مع أزرار دلالية:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

تعرض النواة حمولة `presentation` نفسها كمكوّنات Discord، أو كتل Slack، أو أزرار Telegram المضمنة، أو خصائص Mattermost، أو بطاقات Teams/Feishu حسب قدرة القناة. راجع [عرض الرسائل](/ar/plugins/message-presentation) للاطلاع على العقد الكامل وقواعد الرجوع الاحتياطي.

أرسل حمولة عرض أكثر ثراءً:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

أنشئ استطلاعًا في Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

أنشئ استطلاعًا في Telegram (إغلاق تلقائي خلال دقيقتين):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

أرسل رسالة Teams استباقية:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

أنشئ استطلاعًا في Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

تفاعل في Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

تفاعل في مجموعة Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

أرسل أزرار Telegram مضمنة عبر العرض العام:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

أرسل زر Telegram Mini App عبر العرض العام:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

لا تُدعم أزرار تطبيق ويب Telegram إلا في المحادثات الخاصة بين مستخدم
والروبوت. لا تزال حمولات JSON الأقدم التي تستخدم `web_app` قابلة للتحليل، لكن `webApp` هو
حقل العرض المعتمد.

أرسل بطاقة Teams عبر العرض العام:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

أرسل صورة Telegram أو WhatsApp كمستند لتجنب الضغط:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إرسال الوكيل](/ar/tools/agent-send)
