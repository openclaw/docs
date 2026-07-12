---
read_when:
    - افزودن یا تغییر کنش‌های CLI پیام‌رسانی
    - تغییر رفتار کانال خروجی
summary: مرجع CLI برای `openclaw message` (ارسال + کنش‌های کانال)
title: پیام
x-i18n:
    generated_at: "2026-07-12T09:45:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

فرمان واحد خروجی برای ارسال پیام‌ها و انجام عملیات کانال در
Discord، Google Chat، iMessage، Matrix، Mattermost ‏(Plugin)، Microsoft Teams،
Signal، Slack، Telegram و WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## انتخاب کانال

- اگر بیش از یک کانال پیکربندی شده باشد، `--channel <name>` الزامی است؛ اگر
  دقیقاً یک کانال پیکربندی شده باشد، همان کانال پیش‌فرض است.
- مقادیر: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost به Plugin نیاز دارد).
- مقصدهای دارای پیشوند کانال (برای مثال `discord:channel:123`)، بدون نیاز به
  `--channel` صریح، Plugin مالک را پیدا می‌کنند.

## قالب‌های مقصد (`-t, --target`)

| کانال               | قالب                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`، `user:<id>`، منشن `<@id>` یا شناسهٔ عددی بدون پیشوند (به‌عنوان شناسهٔ کانال در نظر گرفته می‌شود)    |
| Google Chat         | `spaces/<spaceId>` یا `users/<userId>`                                                                               |
| iMessage            | شناسهٔ تماس، `chat_id:<id>`، `chat_guid:<guid>` یا `chat_identifier:<id>`                                           |
| Mattermost (Plugin) | `channel:<id>`، `user:<id>`، `@username` یا شناسهٔ بدون پیشوند (به‌عنوان کانال در نظر گرفته می‌شود)                 |
| Matrix              | `@user:server`، `!room:server` یا `#alias:server`                                                                    |
| Microsoft Teams     | `conversation:<id>` ‏(`19:...@thread.tacv2`)، شناسهٔ مکالمهٔ بدون پیشوند یا `user:<aad-object-id>`                  |
| Signal              | `+E.164`، `group:<id>`، `uuid:<id>`، `username:<name>`/`u:<name>` یا هرکدام از این موارد با پیشوند `signal:`       |
| Slack               | `channel:<id>` یا `user:<id>` (شناسهٔ بدون پیشوند به‌عنوان کانال در نظر گرفته می‌شود)                               |
| Telegram            | شناسهٔ گفت‌وگو، `@username` یا مقصد موضوع انجمن: `<chatId>:topic:<topicId>` (یا `--thread-id <topicId>`)            |
| WhatsApp            | E.164،‏ JID گروه (`...@g.us`) یا JID کانال/خبرنامه (`...@newsletter`)                                                |

جست‌وجوی نام کانال: برای ارائه‌دهندگانی که فهرست راهنما دارند
(Discord/Slack/و غیره)، نام‌هایی مانند `Help` یا `#help` از طریق کش فهرست
راهنما پیدا می‌شوند و اگر موردی در کش یافت نشود و ارائه‌دهنده پشتیبانی کند،
جست‌وجوی زنده در فهرست راهنما انجام می‌شود.

## پرچم‌های مشترک

هر عملیات این موارد را می‌پذیرد: `--channel <name>`، `--account <id>`، `--json`،
`--dry-run`، `--verbose`. عملیاتی که مقصد می‌گیرند، `-t, --target <dest>` را
نیز می‌پذیرند.

## تفکیک SecretRef

`openclaw message` پیش از اجرای عملیات، SecretRefهای کانال را با محدودترین
دامنهٔ ممکن تفکیک می‌کند:

- وقتی `--channel` تنظیم شده باشد (یا از مقصد پیشونددار استنباط شود)، در دامنهٔ کانال
- وقتی `--account` نیز تنظیم شده باشد، در دامنهٔ حساب
- وقتی هیچ‌کدام تنظیم نشده باشند، برای همهٔ کانال‌های پیکربندی‌شده

SecretRefهای تفکیک‌نشده در کانال‌های نامرتبط هرگز یک عملیات هدف‌دار را مسدود
نمی‌کنند؛ وجود SecretRef تفکیک‌نشده در کانال/حساب انتخاب‌شده باعث می‌شود
عملیات به‌صورت بسته و ایمن شکست بخورد.

## عملیات

### اصلی

| عملیات           | کانال‌ها                                                                                                           | الزامی                                                         | توضیحات                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`           | Discord، Google Chat، iMessage، Matrix، Mattermost ‏(Plugin)، Microsoft Teams، Signal، Slack، Telegram، WhatsApp | `--target`، به‌علاوه یکی از `--message`/`--media`/`--presentation` | بخش [ارسال](#send) را در ادامه ببینید.                                                                                                                                                                                                                                                                                                                |
| `poll`           | Discord، Matrix، Microsoft Teams، Telegram، WhatsApp                                                             | `--target`، `--poll-question`، `--poll-option` (تکرارشونده)    | بخش [نظرسنجی](#poll) را در ادامه ببینید.                                                                                                                                                                                                                                                                                                              |
| `react`          | Discord، Matrix، Nextcloud Talk، Signal، Slack، Telegram، WhatsApp                                               | `--message-id`، `--target`                                     | `--emoji`، `--remove` (به `--emoji` نیاز دارد؛ برای پاک‌کردن واکنش‌های خود در موارد پشتیبانی‌شده، آن را حذف کنید؛ [واکنش‌ها](/fa/tools/reactions) را ببینید). WhatsApp:‏ `--participant`، `--from-me`. واکنش‌های گروهی Signal به `--target-author` یا `--target-author-uuid` نیاز دارند. Nextcloud Talk فقط واکنش اضافه می‌کند؛ `--remove` خطا می‌دهد. |
| `reactions`      | Discord، Matrix، Microsoft Teams، Slack                                                                          | `--message-id`، `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                            |
| `read`           | Discord، Matrix، Microsoft Teams، Slack                                                                          | `--target`                                                     | `--limit`، `--message-id`، `--before`، `--after`. در Discord:‏ `--around`، `--include-thread`. در Slack،‏ `--message-id` یک برچسب زمانی مشخص را می‌خواند؛ برای پاسخ دقیق در یک رشته، آن را با `--thread-id` ترکیب کنید.                                                                                                                                    |
| `edit`           | Discord، Matrix، Microsoft Teams، Slack، Telegram                                                                | `--message-id`، `--message`، `--target`                        | رشته‌های انجمن Telegram از `--thread-id` استفاده می‌کنند.                                                                                                                                                                                                                                                                                            |
| `delete`         | Discord، Matrix، Microsoft Teams، Slack، Telegram                                                                | `--message-id`، `--target`                                     |                                                                                                                                                                                                                                                                                                                                                       |
| `pin` / `unpin`  | Discord، Matrix، Microsoft Teams، Slack                                                                          | `--message-id`، `--target`                                     | `unpin` همچنین `--pinned-message-id` را می‌پذیرد (در Microsoft Teams: شناسهٔ منبع سنجاق/فهرست سنجاق‌ها، نه شناسهٔ پیام گفت‌وگو).                                                                                                                                                                                                                       |
| `pins` (فهرست)   | Discord، Matrix، Microsoft Teams، Slack                                                                          | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                            |
| `permissions`    | Discord، Matrix                                                                                                  | `--target`                                                     | در Matrix: فقط هنگامی در دسترس است که رمزنگاری فعال باشد و عملیات تأیید مجاز باشند.                                                                                                                                                                                                                                                                  |
| `search`         | Discord                                                                                                          | `--guild-id`، `--query`                                        | `--channel-id`، `--channel-ids` (تکرارشونده)، `--author-id`، `--author-ids` (تکرارشونده)، `--limit`.                                                                                                                                                                                                                                                   |
| `member info`    | Discord، Matrix، Microsoft Teams، Slack                                                                          | `--user-id`                                                    | `--guild-id` ‏(Discord).                                                                                                                                                                                                                                                                                                                              |

### ارسال

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: پیوست‌کردن تصویر/صدا/ویدئو/سند (مسیر محلی یا
  URL).
- `--presentation <json>`: بار دادهٔ مشترک با بلوک‌های `text`، `context`،
  `divider`، `chart`، `table`، `buttons` و `select` که متناسب با قابلیت هر
  کانال نمایش داده می‌شود. [ارائهٔ پیام](/fa/plugins/message-presentation) را ببینید.
- `--delivery <json>`: ترجیحات عمومی تحویل، برای مثال `{"pin":
true}`. وقتی کانال از تحویل سنجاق‌شده پشتیبانی کند، `--pin` شکل کوتاه‌شدهٔ
  آن است.
- `--reply-to <id>`، `--thread-id <id>` (موضوع انجمن Telegram؛ برچسب زمانی
  رشته در Slack، همان فیلد `--reply-to`).
- `--force-document` ‏(Telegram، WhatsApp): ارسال تصاویر/GIFها/ویدئوها به‌شکل
  سند برای جلوگیری از فشرده‌سازی کانال.
- `--silent` ‏(Telegram، Discord): ارسال بدون اعلان.
- `--gif-playback` (فقط WhatsApp): رسانهٔ ویدئویی را به‌صورت پخش GIF در نظر
  می‌گیرد.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack بلوک‌های نمودار پشتیبانی‌شده را به‌صورت بومی نمایش می‌دهد؛ کانال‌های
دیگر همان داده‌ها را به‌شکل متن خوانا دریافت می‌کنند:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack همچنین بلوک‌های صریح جدول را به‌صورت بومی نمایش می‌دهد. کانال‌های دیگر
عنوان و همهٔ ردیف‌ها را به‌صورت متن قطعی دریافت می‌کنند:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

دکمه‌های Mini App در Telegram از `webApp` استفاده می‌کنند (`web_app` همچنان برای JSON
قدیمی تجزیه می‌شود) و فقط در گفت‌وگوهای خصوصی میان کاربر و ربات نمایش داده می‌شوند:

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

### نظرسنجی

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: ۲ تا ۱۲ بار تکرار کنید.
- `--poll-multi`: امکان انتخاب چند گزینه را فراهم می‌کند.
- Discord: `--poll-duration-hours`، `--silent`، `--message`.
- Telegram: `--poll-duration-seconds <n>` (۵ تا ۶۰۰)، `--silent`،
  `--poll-anonymous` / `--poll-public`، `--thread-id`.

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

### رشته‌ها

- `thread create`: کانال Discord. الزامی: `--thread-name`، `--target`
  (شناسهٔ کانال). اختیاری: `--message-id`، `--message`، `--auto-archive-min`.
- `thread list`: کانال Discord. الزامی: `--guild-id`. اختیاری:
  `--channel-id`، `--include-archived`، `--before`، `--limit`.
- `thread reply`: کانال Discord. الزامی: `--target` (شناسهٔ رشته)،
  `--message`. اختیاری: `--media`، `--reply-to`.

### ایموجی‌ها

- `emoji list`: Discord (`--guild-id`)، Slack (بدون پرچم اضافی).
- `emoji upload`: Discord. الزامی: `--guild-id`، `--emoji-name`، `--media`.
  اختیاری: `--role-ids` (قابل تکرار).

### برچسب‌ها

- `sticker send`: Discord. الزامی: `--target`، `--sticker-id` (قابل تکرار).
  اختیاری: `--message`.
- `sticker upload`: Discord. الزامی: `--guild-id`، `--sticker-name`،
  `--sticker-desc`، `--sticker-tags`، `--media`.

### نقش‌ها، کانال‌ها، صدا و رویدادها (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`، `--user-id`، `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`، `--user-id`.
- `event list`: `--guild-id`.
- `event create`: الزامی: `--guild-id`، `--event-name`، `--start-time`؛
  اختیاری: `--end-time`، `--desc`، `--channel-id`، `--location`،
  `--event-type`، `--image <url-or-path>`.

### مدیریت محتوا (Discord)

- `timeout`: `--guild-id`، `--user-id`؛ اختیاری: `--duration-min` یا
  `--until` (برای رفع محدودیت زمانی، هر دو را حذف کنید)، `--reason`.
- `kick`: `--guild-id`، `--user-id`، `--reason`.
- `ban`: `--guild-id`، `--user-id`، `--delete-days`، `--reason`.

### پخش همگانی

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

یک بار داده را به چند مقصد ارسال می‌کند. `--targets` فهرستی با موارد جداشده
با فاصله می‌گیرد. برای هدف‌گرفتن همهٔ ارائه‌دهندگان پیکربندی‌شده، از `--channel all` استفاده کنید.

## مطالب مرتبط

- [مرجع CLI](/fa/cli)
- [ارسال عامل](/fa/tools/agent-send)
- [نحوهٔ نمایش پیام](/fa/plugins/message-presentation)
