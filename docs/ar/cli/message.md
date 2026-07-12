---
read_when:
    - إضافة إجراءات CLI للرسائل أو تعديلها
    - تغيير سلوك القناة الصادرة
summary: مرجع CLI للأمر `openclaw message` (الإرسال + إجراءات القناة)
title: رسالة
x-i18n:
    generated_at: "2026-07-12T05:42:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

أمر صادر موحّد لإرسال الرسائل وتنفيذ إجراءات القنوات عبر
Discord وGoogle Chat وiMessage وMatrix وMattermost ‏(Plugin) وMicrosoft Teams
وSignal وSlack وTelegram وWhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## اختيار القناة

- يكون `--channel <name>` مطلوبًا إذا كانت هناك أكثر من قناة مُهيأة؛ وعند
  تهيئة قناة واحدة فقط، تكون تلك القناة هي الافتراضية.
- القيم: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (يتطلب Mattermost الـ Plugin).
- الأهداف المسبوقة باسم القناة (مثل `discord:channel:123`) تحدد الـ Plugin
  المالك دون الحاجة إلى تحديد `--channel` صراحةً.

## تنسيقات الهدف (`-t, --target`)

| القناة              | التنسيق                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>` أو `user:<id>` أو إشارة `<@id>` أو معرّف رقمي مجرد (يُعامل كمعرّف قناة)                               |
| Google Chat         | `spaces/<spaceId>` أو `users/<userId>`                                                                                |
| iMessage            | المعرّف أو `chat_id:<id>` أو `chat_guid:<guid>` أو `chat_identifier:<id>`                                             |
| Mattermost ‏(Plugin) | `channel:<id>` أو `user:<id>` أو `@username` أو معرّف مجرد (يُعامل كقناة)                                             |
| Matrix              | `@user:server` أو `!room:server` أو `#alias:server`                                                                    |
| Microsoft Teams     | `conversation:<id>` ‏(`19:...@thread.tacv2`) أو معرّف محادثة مجرد أو `user:<aad-object-id>`                           |
| Signal              | `+E.164` أو `group:<id>` أو `uuid:<id>` أو `username:<name>`/`u:<name>` أو أي منها مسبوقًا بـ `signal:`              |
| Slack               | `channel:<id>` أو `user:<id>` (يُعامل المعرّف المجرد كقناة)                                                           |
| Telegram            | معرّف الدردشة أو `@username` أو هدف موضوع منتدى: `<chatId>:topic:<topicId>` (أو `--thread-id <topicId>`)              |
| WhatsApp            | E.164 أو JID لمجموعة (`...@g.us`) أو JID لقناة/نشرة إخبارية (`...@newsletter`)                                        |

البحث باسم القناة: بالنسبة إلى المزوّدين الذين لديهم دليل (Discord وSlack
وغيرهما)، تُحدَّد أسماء مثل `Help` أو `#help` عبر ذاكرة التخزين المؤقت للدليل،
مع الرجوع إلى بحث مباشر في الدليل عند عدم العثور عليها في الذاكرة المؤقتة
إذا كان المزوّد يدعم ذلك.

## العلامات الشائعة

يقبل كل إجراء: `--channel <name>` و`--account <id>` و`--json`
و`--dry-run` و`--verbose`. كما تقبل الإجراءات التي تحتاج إلى وجهة
`-t, --target <dest>`.

## تحليل SecretRef

يحل الأمر `openclaw message` مراجع SecretRef الخاصة بالقنوات قبل تشغيل الإجراء،
ضمن أضيق نطاق ممكن:

- على نطاق القناة عند تعيين `--channel` (أو استنتاجه من هدف مسبوق باسم القناة)
- على نطاق الحساب عند تعيين `--account` أيضًا
- جميع القنوات المُهيأة عند عدم تعيين أي منهما

لا تمنع مراجع SecretRef غير المحلولة في القنوات غير ذات الصلة تنفيذ إجراء
موجّه مطلقًا؛ أما مرجع SecretRef غير المحلول في القناة/الحساب المحدد فيؤدي
إلى إيقاف الإجراء بأمان.

## الإجراءات

### الأساسية

| الإجراء         | القنوات                                                                                                           | المطلوب                                                        | ملاحظات                                                                                                                                                                                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord وGoogle Chat وiMessage وMatrix وMattermost ‏(Plugin) وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp | `--target`، بالإضافة إلى أحد `--message`/`--media`/`--presentation` | راجع [الإرسال](#send) أدناه.                                                                                                                                                                                                                                                                                                                          |
| `poll`          | Discord وMatrix وMicrosoft Teams وTelegram وWhatsApp                                                              | `--target` و`--poll-question` و`--poll-option` (متكرر)         | راجع [الاستطلاع](#poll) أدناه.                                                                                                                                                                                                                                                                                                                        |
| `react`         | Discord وMatrix وNextcloud Talk وSignal وSlack وTelegram وWhatsApp                                                | `--message-id` و`--target`                                     | `--emoji` و`--remove` (يتطلب `--emoji`؛ احذفه لمسح تفاعلاتك حيثما كان ذلك مدعومًا، راجع [التفاعلات](/ar/tools/reactions)). في WhatsApp: ‏`--participant` و`--from-me`. تتطلب تفاعلات مجموعات Signal ‏`--target-author` أو `--target-author-uuid`. لا يضيف Nextcloud Talk سوى التفاعلات؛ ويؤدي `--remove` إلى خطأ. |
| `reactions`     | Discord وMatrix وMicrosoft Teams وSlack                                                                           | `--message-id` و`--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                            |
| `read`          | Discord وMatrix وMicrosoft Teams وSlack                                                                           | `--target`                                                     | `--limit` و`--message-id` و`--before` و`--after`. في Discord: ‏`--around` و`--include-thread`. في Slack: يقرأ `--message-id` طابعًا زمنيًا محددًا؛ ادمجه مع `--thread-id` لقراءة رد محدد في سلسلة محادثة.                                                                                                                                                |
| `edit`          | Discord وMatrix وMicrosoft Teams وSlack وTelegram                                                                 | `--message-id` و`--message` و`--target`                        | تستخدم سلاسل منتديات Telegram ‏`--thread-id`.                                                                                                                                                                                                                                                                                                         |
| `delete`        | Discord وMatrix وMicrosoft Teams وSlack وTelegram                                                                 | `--message-id` و`--target`                                     |                                                                                                                                                                                                                                                                                                                                                       |
| `pin` / `unpin` | Discord وMatrix وMicrosoft Teams وSlack                                                                           | `--message-id` و`--target`                                     | يقبل `unpin` أيضًا `--pinned-message-id` (في Microsoft Teams: معرّف مورد التثبيت/قائمة العناصر المثبّتة، وليس معرّف رسالة الدردشة).                                                                                                                                                                                                                  |
| `pins` (قائمة)  | Discord وMatrix وMicrosoft Teams وSlack                                                                           | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                            |
| `permissions`   | Discord وMatrix                                                                                                   | `--target`                                                     | في Matrix: متاح فقط عند تمكين التشفير والسماح بإجراءات التحقق.                                                                                                                                                                                                                                                                                        |
| `search`        | Discord                                                                                                           | `--guild-id` و`--query`                                        | `--channel-id` و`--channel-ids` (متكرر) و`--author-id` و`--author-ids` (متكرر) و`--limit`.                                                                                                                                                                                                                                                            |
| `member info`   | Discord وMatrix وMicrosoft Teams وSlack                                                                           | `--user-id`                                                    | `--guild-id` ‏(Discord).                                                                                                                                                                                                                                                                                                                              |

### الإرسال

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: إرفاق صورة/صوت/فيديو/مستند (مسار محلي أو
  URL).
- `--presentation <json>`: حمولة مشتركة تحتوي على كتل `text` و`context` و`divider`
  و`chart` و`table` و`buttons` و`select`، وتُعرض وفق إمكانات كل قناة.
  راجع [عرض الرسائل](/ar/plugins/message-presentation).
- `--delivery <json>`: تفضيلات تسليم عامة، مثل `{"pin":
true}`. يُعد `--pin` اختصارًا للتسليم المثبّت عندما تدعمه القناة.
- `--reply-to <id>` و`--thread-id <id>` (موضوع منتدى Telegram؛ الطابع
  الزمني لسلسلة Slack، وهو الحقل نفسه المستخدم في `--reply-to`).
- `--force-document` ‏(Telegram وWhatsApp): إرسال الصور وملفات GIF ومقاطع الفيديو
  كمستندات لتجنب ضغط القناة.
- `--silent` ‏(Telegram وDiscord): الإرسال دون إشعار.
- `--gif-playback` ‏(WhatsApp فقط): معاملة وسائط الفيديو كتشغيل GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

يعرض Slack كتل المخططات المدعومة عرضًا أصليًا؛ بينما تتلقى القنوات الأخرى
البيانات نفسها كنص سهل القراءة:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

يعرض Slack أيضًا كتل الجداول الصريحة عرضًا أصليًا. وتتلقى القنوات الأخرى
التسمية التوضيحية وكل صف كنص حتمي:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

تستخدم أزرار تطبيق Telegram المصغّر `webApp` (ولا يزال `web_app` يُحلَّل لتوافق
JSON القديم)، ولا تُعرض إلا في المحادثات الخاصة بين مستخدم والروبوت:

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### استطلاع رأي

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: كرّره من مرتين إلى 12 مرة.
- `--poll-multi`: يسمح باختيارات متعددة.
- Discord: ‏`--poll-duration-hours`، و`--silent`، و`--message`.
- Telegram: ‏`--poll-duration-seconds <n>` ‏(5-600)، و`--silent`،
  و`--poll-anonymous` / `--poll-public`، و`--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### سلاسل المحادثات

- `thread create`: لقنوات Discord. المطلوب: `--thread-name`، و`--target`
  (معرّف القناة). اختياري: `--message-id`، و`--message`، و`--auto-archive-min`.
- `thread list`: لقنوات Discord. المطلوب: `--guild-id`. اختياري:
  `--channel-id`، و`--include-archived`، و`--before`، و`--limit`.
- `thread reply`: لقنوات Discord. المطلوب: `--target` (معرّف سلسلة المحادثة)،
  و`--message`. اختياري: `--media`، و`--reply-to`.

### الرموز التعبيرية

- `emoji list`: ‏Discord ‏(`--guild-id`)، وSlack (من دون خيارات إضافية).
- `emoji upload`: ‏Discord. المطلوب: `--guild-id`، و`--emoji-name`، و`--media`.
  اختياري: `--role-ids` (قابل للتكرار).

### الملصقات

- `sticker send`: ‏Discord. المطلوب: `--target`، و`--sticker-id` (قابل للتكرار).
  اختياري: `--message`.
- `sticker upload`: ‏Discord. المطلوب: `--guild-id`، و`--sticker-name`،
  و`--sticker-desc`، و`--sticker-tags`، و`--media`.

### الأدوار والقنوات والصوت والأحداث (Discord)

- `role info`: ‏`--guild-id`.
- `role add` / `role remove`: ‏`--guild-id`، و`--user-id`، و`--role-id`.
- `channel info`: ‏`--target`.
- `channel list`: ‏`--guild-id`.
- `voice status`: ‏`--guild-id`، و`--user-id`.
- `event list`: ‏`--guild-id`.
- `event create`: المطلوب `--guild-id`، و`--event-name`، و`--start-time`؛
  والاختياري `--end-time`، و`--desc`، و`--channel-id`، و`--location`،
  و`--event-type`، و`--image <url-or-path>`.

### الإشراف (Discord)

- `timeout`: ‏`--guild-id`، و`--user-id`؛ واختياريًا `--duration-min` أو
  `--until` (احذف كليهما لإلغاء المهلة)، و`--reason`.
- `kick`: ‏`--guild-id`، و`--user-id`، و`--reason`.
- `ban`: ‏`--guild-id`، و`--user-id`، و`--delete-days`، و`--reason`.

### البث

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

يرسل حمولة واحدة إلى أهداف متعددة. يقبل `--targets` قائمة مفصولة بمسافات.
استخدم `--channel all` لاستهداف كل موفّر مُهيّأ.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إرسال الوكيل](/ar/tools/agent-send)
- [عرض الرسائل](/ar/plugins/message-presentation)
