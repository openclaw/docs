---
read_when:
    - افزودن یا ویرایش اقدام‌های CLI پیام
    - تغییر رفتار کانال خروجی
summary: مرجع CLI برای `openclaw message` (ارسال + کنش‌های کانال)
title: پیام
x-i18n:
    generated_at: "2026-04-29T22:36:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43f14b3815d89c92a7503e620e2424f41a3f6b92e20e089504017305b19bace4
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

فرمان خروجی واحد برای ارسال پیام‌ها و کنش‌های کانال
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## نحوه استفاده

```
openclaw message <subcommand> [flags]
```

انتخاب کانال:

- اگر بیش از یک کانال پیکربندی شده باشد، `--channel` الزامی است.
- اگر دقیقا یک کانال پیکربندی شده باشد، همان پیش‌فرض می‌شود.
- مقادیر: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost به Plugin نیاز دارد)
- وقتی `--channel` یا مقصدی با پیشوند کانال وجود داشته باشد، `openclaw message` کانال انتخاب‌شده را به Plugin مالک آن نگاشت می‌کند؛ در غیر این صورت، Pluginهای کانال پیکربندی‌شده را برای استنتاج کانال پیش‌فرض بارگذاری می‌کند.

قالب‌های مقصد (`--target`):

- WhatsApp: E.164 یا group JID
- Telegram: شناسه گفت‌وگو یا `@username`
- Discord: `channel:<id>` یا `user:<id>` (یا اشاره `<@id>`؛ شناسه‌های عددی خام به‌عنوان کانال در نظر گرفته می‌شوند)
- Google Chat: `spaces/<spaceId>` یا `users/<userId>`
- Slack: `channel:<id>` یا `user:<id>` (شناسه خام کانال پذیرفته می‌شود)
- Mattermost (Plugin): `channel:<id>`، `user:<id>`، یا `@username` (شناسه‌های بدون پیشوند به‌عنوان کانال در نظر گرفته می‌شوند)
- Signal: `+E.164`، `group:<id>`، `signal:+E.164`، `signal:group:<id>`، یا `username:<name>`/`u:<name>`
- iMessage: دسته، `chat_id:<id>`، `chat_guid:<guid>`، یا `chat_identifier:<id>`
- Matrix: `@user:server`، `!room:server`، یا `#alias:server`
- Microsoft Teams: شناسه مکالمه (`19:...@thread.tacv2`) یا `conversation:<id>` یا `user:<aad-object-id>`

جست‌وجوی نام:

- برای ارائه‌دهندگان پشتیبانی‌شده (Discord/Slack/غیره)، نام کانال‌هایی مانند `Help` یا `#help` از طریق کش فهرست حل می‌شوند.
- در صورت نبودن در کش، OpenClaw وقتی ارائه‌دهنده پشتیبانی کند، تلاش می‌کند جست‌وجوی زنده فهرست انجام دهد.

## فلگ‌های رایج

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (کانال یا کاربر مقصد برای send/poll/read/غیره)
- `--targets <name>` (تکرارشونده؛ فقط پخش همگانی)
- `--json`
- `--dry-run`
- `--verbose`

## رفتار SecretRef

- `openclaw message` پیش از اجرای کنش انتخاب‌شده، SecretRefهای پشتیبانی‌شده کانال را حل می‌کند.
- حل‌کردن در صورت امکان به مقصد کنش فعال محدود می‌شود:
  - در سطح کانال، وقتی `--channel` تنظیم شده باشد (یا از مقصدهای پیشونددار مانند `discord:...` استنتاج شود)
  - در سطح حساب، وقتی `--account` تنظیم شده باشد (سراسری‌های کانال + سطح‌های حساب انتخاب‌شده)
  - وقتی `--account` حذف شده باشد، OpenClaw محدوده SecretRef حساب `default` را اجباری نمی‌کند
- SecretRefهای حل‌نشده در کانال‌های نامرتبط، کنش پیام هدفمند را مسدود نمی‌کنند.
- اگر SecretRef کانال/حساب انتخاب‌شده حل‌نشده باشد، فرمان برای آن کنش بسته شکست می‌خورد.

## کنش‌ها

### هسته

- `send`
  - کانال‌ها: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - الزامی: `--target`، به‌همراه `--message`، `--media`، یا `--presentation`
  - اختیاری: `--media`، `--presentation`، `--delivery`، `--pin`، `--reply-to`، `--thread-id`، `--gif-playback`، `--force-document`، `--silent`
  - payloadهای ارائه مشترک: `--presentation` بلوک‌های معنایی (`text`، `context`، `divider`، `buttons`، `select`) را ارسال می‌کند که هسته آن‌ها را از طریق قابلیت‌های اعلام‌شده کانال انتخاب‌شده رندر می‌کند. [ارائه پیام](/fa/plugins/message-presentation) را ببینید.
  - ترجیحات تحویل عمومی: `--delivery` راهنمایی‌های تحویل مانند `{ "pin": true }` را می‌پذیرد؛ `--pin` میان‌بری برای تحویل سنجاق‌شده است، وقتی کانال از آن پشتیبانی کند.
  - فقط Telegram: `--force-document` (ارسال تصویرها و GIFها به‌عنوان سند برای جلوگیری از فشرده‌سازی Telegram)
  - فقط Telegram: `--thread-id` (شناسه موضوع انجمن)
  - فقط Slack: `--thread-id` (برچسب زمانی thread؛ `--reply-to` از همان فیلد استفاده می‌کند)
  - Telegram + Discord: `--silent`
  - فقط WhatsApp: `--gif-playback`

- `poll`
  - کانال‌ها: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - الزامی: `--target`، `--poll-question`، `--poll-option` (تکرارشونده)
  - اختیاری: `--poll-multi`
  - فقط Discord: `--poll-duration-hours`، `--silent`، `--message`
  - فقط Telegram: `--poll-duration-seconds` (5-600)، `--silent`، `--poll-anonymous` / `--poll-public`، `--thread-id`

- `react`
  - کانال‌ها: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - الزامی: `--message-id`، `--target`
  - اختیاری: `--emoji`، `--remove`، `--participant`، `--from-me`، `--target-author`، `--target-author-uuid`
  - نکته: `--remove` به `--emoji` نیاز دارد (`--emoji` را حذف کنید تا واکنش‌های خودتان در موارد پشتیبانی‌شده پاک شوند؛ /tools/reactions را ببینید)
  - فقط WhatsApp: `--participant`، `--from-me`
  - واکنش‌های گروه Signal: `--target-author` یا `--target-author-uuid` الزامی است

- `reactions`
  - کانال‌ها: Discord/Google Chat/Slack/Matrix
  - الزامی: `--message-id`، `--target`
  - اختیاری: `--limit`

- `read`
  - کانال‌ها: Discord/Slack/Matrix
  - الزامی: `--target`
  - اختیاری: `--limit`، `--before`، `--after`
  - فقط Discord: `--around`

- `edit`
  - کانال‌ها: Discord/Slack/Matrix
  - الزامی: `--message-id`، `--message`، `--target`

- `delete`
  - کانال‌ها: Discord/Slack/Telegram/Matrix
  - الزامی: `--message-id`، `--target`

- `pin` / `unpin`
  - کانال‌ها: Discord/Slack/Matrix
  - الزامی: `--message-id`، `--target`

- `pins` (فهرست)
  - کانال‌ها: Discord/Slack/Matrix
  - الزامی: `--target`

- `permissions`
  - کانال‌ها: Discord/Matrix
  - الزامی: `--target`
  - فقط Matrix: وقتی رمزنگاری Matrix فعال باشد و کنش‌های تایید مجاز باشند، در دسترس است

- `search`
  - کانال‌ها: Discord
  - الزامی: `--guild-id`، `--query`
  - اختیاری: `--channel-id`، `--channel-ids` (تکرارشونده)، `--author-id`، `--author-ids` (تکرارشونده)، `--limit`

### Threadها

- `thread create`
  - کانال‌ها: Discord
  - الزامی: `--thread-name`، `--target` (شناسه کانال)
  - اختیاری: `--message-id`، `--message`، `--auto-archive-min`

- `thread list`
  - کانال‌ها: Discord
  - الزامی: `--guild-id`
  - اختیاری: `--channel-id`، `--include-archived`، `--before`، `--limit`

- `thread reply`
  - کانال‌ها: Discord
  - الزامی: `--target` (شناسه thread)، `--message`
  - اختیاری: `--media`، `--reply-to`

### اموجی‌ها

- `emoji list`
  - Discord: `--guild-id`
  - Slack: بدون فلگ اضافی

- `emoji upload`
  - کانال‌ها: Discord
  - الزامی: `--guild-id`، `--emoji-name`، `--media`
  - اختیاری: `--role-ids` (تکرارشونده)

### استیکرها

- `sticker send`
  - کانال‌ها: Discord
  - الزامی: `--target`، `--sticker-id` (تکرارشونده)
  - اختیاری: `--message`

- `sticker upload`
  - کانال‌ها: Discord
  - الزامی: `--guild-id`، `--sticker-name`، `--sticker-desc`، `--sticker-tags`، `--media`

### نقش‌ها / کانال‌ها / اعضا / صدا

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`، `--user-id`، `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` برای Discord)
- `voice status` (Discord): `--guild-id`، `--user-id`

### رویدادها

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`، `--event-name`، `--start-time`
  - اختیاری: `--end-time`، `--desc`، `--channel-id`، `--location`، `--event-type`

### مدیریت محتوا (Discord)

- `timeout`: `--guild-id`، `--user-id` (`--duration-min` یا `--until` اختیاری؛ هر دو را حذف کنید تا timeout پاک شود)
- `kick`: `--guild-id`، `--user-id` (+ `--reason`)
- `ban`: `--guild-id`، `--user-id` (+ `--delete-days`، `--reason`)
  - `timeout` از `--reason` نیز پشتیبانی می‌کند

### پخش همگانی

- `broadcast`
  - کانال‌ها: هر کانال پیکربندی‌شده؛ برای هدف‌گیری همه ارائه‌دهندگان از `--channel all` استفاده کنید
  - الزامی: `--targets <target...>`
  - اختیاری: `--message`، `--media`، `--dry-run`

## مثال‌ها

ارسال پاسخ Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

ارسال پیام با دکمه‌های معنایی:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

هسته همان payload `presentation` را بسته به قابلیت کانال، به کامپوننت‌های Discord، بلوک‌های Slack، دکمه‌های درون‌خطی Telegram، propsهای Mattermost، یا کارت‌های Teams/Feishu رندر می‌کند. برای قرارداد کامل و قواعد fallback، [ارائه پیام](/fa/plugins/message-presentation) را ببینید.

ارسال payload ارائه غنی‌تر:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

ایجاد نظرسنجی Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

ایجاد نظرسنجی Telegram (بسته‌شدن خودکار در 2 دقیقه):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

ارسال پیام پیش‌دستانه Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

ایجاد نظرسنجی Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

واکنش در Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

واکنش در گروه Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

ارسال دکمه‌های درون‌خطی Telegram از طریق ارائه عمومی:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

ارسال کارت Teams از طریق ارائه عمومی:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

ارسال تصویر Telegram به‌عنوان سند برای جلوگیری از فشرده‌سازی:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [ارسال Agent](/fa/tools/agent-send)
