---
read_when:
    - برنامه‌ریزی برای مهاجرت از BlueBubbles به Plugin همراه iMessage
    - ترجمهٔ کلیدهای پیکربندی BlueBubbles به معادل‌های iMessage
    - تأیید imsg پیش از فعال‌سازی Plugin مربوط به iMessage
summary: 'پیکربندی‌های قدیمی BlueBubbles را به Plugin همراه iMessage منتقل کنید: نگاشت کلیدها، کنترل‌های فهرست مجاز گروه‌ها و تأیید انتقال نهایی.'
title: مهاجرت از BlueBubbles
x-i18n:
    generated_at: "2026-07-12T09:33:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

پشتیبانی از BlueBubbles حذف شده است. OpenClaw فقط از طریق Plugin همراه `imessage` از iMessage پشتیبانی می‌کند؛ این Plugin، [`steipete/imsg`](https://github.com/steipete/imsg) را از طریق JSON-RPC راه‌اندازی می‌کند و به همان سطح API خصوصی دسترسی دارد که BlueBubbles داشت (`react`، `edit`، `unsend`، `reply`، `sendWithEffect`، نظرسنجی‌های بومی، مدیریت گروه و پیوست‌ها). یک فایل اجرایی CLI جایگزین سرور BlueBubbles، برنامهٔ کارخواه و زیرساخت Webhook می‌شود: بدون نقطهٔ پایانی REST و بدون احراز هویت Webhook.

این راهنما پیکربندی‌های قدیمی `channels.bluebubbles` را به `channels.imessage` منتقل می‌کند. هیچ مسیر انتقال پشتیبانی‌شدهٔ دیگری وجود ندارد. در نسخهٔ فعلی OpenClaw، بلوک باقی‌ماندهٔ `channels.bluebubbles` غیرفعال است — هیچ بخش زمان اجرایی آن را نمی‌خواند.

<Note>
برای اطلاعیهٔ کوتاه و خلاصهٔ ویژهٔ راهبران، به [حذف BlueBubbles و مسیر imsg برای iMessage](/fa/announcements/bluebubbles-imessage) مراجعه کنید.
</Note>

## فهرست بررسی انتقال

اگر از قبل پیکربندی قدیمی BlueBubbles خود را می‌شناسید، کوتاه‌ترین مسیر امن چنین است:

1. `imsg` را مستقیماً روی Mac اجراکنندهٔ Messages.app بررسی کنید (`imsg chats`، `imsg history`، `imsg send`، `imsg rpc --help`).
2. کلیدهای رفتاری را از `channels.bluebubbles` به `channels.imessage` کپی کنید: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `includeAttachments`، `attachmentRoots`، `mediaMaxMb`، `textChunkLimit`، `coalesceSameSenderDms` و `actions`.
3. کلیدهای انتقالی را که دیگر وجود ندارند حذف کنید: `serverUrl`، `password`، نشانی‌های Webhook و راه‌اندازی سرور BlueBubbles.
4. اگر Gateway روی Mac مربوط به Messages اجرا نمی‌شود، `channels.imessage.cliPath` را روی یک پوشش SSH تنظیم کنید و برای دریافت پیوست‌ها از راه دور، `remoteHost` را تنظیم کنید.
5. `channels.imessage` را فعال و Gateway را بازراه‌اندازی کنید، سپس `openclaw channels status --probe --channel imessage` را اجرا کنید.
6. یک پیام مستقیم، یک گروه مجاز، در صورت فعال بودن پیوست‌ها و همهٔ کنش‌های API خصوصی مورد انتظار برای استفادهٔ عامل را آزمایش کنید.
7. پس از تأیید مسیر iMessage، سرور BlueBubbles و پیکربندی قدیمی `channels.bluebubbles` را حذف کنید.

## کارکرد imsg

`imsg` یک CLI محلی macOS برای Messages است. OpenClaw، `imsg rpc` را به‌عنوان فرایند فرزند آغاز می‌کند و از طریق ورودی/خروجی استاندارد با JSON-RPC ارتباط برقرار می‌کند. هیچ سرور HTTP، نشانی Webhook، خدمت پس‌زمینه، عامل راه‌انداز یا درگاهی برای در معرض دسترس قرار دادن وجود ندارد.

- خواندن‌ها با استفاده از یک دستهٔ فقط‌خواندنی SQLite از `~/Library/Messages/chat.db` انجام می‌شوند.
- پیام‌های ورودی زنده از `imsg watch` / `watch.subscribe` دریافت می‌شوند که رویدادهای سامانهٔ فایل `chat.db` را با یک سازوکار پشتیبانِ نظرسنجی دنبال می‌کند.
- ارسال متن عادی و فایل با خودکارسازی Messages.app انجام می‌شود.
- کنش‌های پیشرفته از `imsg launch` برای تزریق دستیار `imsg` به Messages.app استفاده می‌کنند. این قابلیت، رسید خواندن، نشانگرهای تایپ، ارسال‌های غنی، ویرایش، لغو ارسال، پاسخ رشته‌ای، واکنش‌ها، نظرسنجی‌ها و مدیریت گروه را فعال می‌کند.
- ساخت‌های Linux می‌توانند یک `chat.db` کپی‌شده را بررسی کنند، اما نمی‌توانند پیام ارسال کنند، پایگاه دادهٔ زندهٔ Mac را پایش کنند یا Messages.app را کنترل کنند. برای iMessage در OpenClaw، `imsg` را روی Mac واردشده به حساب اجرا کنید یا از یک پوشش SSH برای اتصال به آن Mac استفاده کنید.

## پیش از شروع

1. `imsg` را روی Mac اجراکنندهٔ Messages.app نصب کنید:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   در راه‌اندازی معمول محلی، فرایند راه‌اندازی OpenClaw می‌تواند نصب یا به‌روزرسانی `imsg` با Homebrew را روی Mac واردشده به Messages، پس از تأیید کاربر، پیشنهاد دهد. راه‌اندازی دستی و توپولوژی‌های پوشش SSH همچنان باید توسط راهبر مدیریت شوند: به‌روزرسانی Homebrew را در همان زمینهٔ کاربر محلی یا راه دور که `imsg` را اجرا خواهد کرد، تکرار کنید. اگر `imsg chats` با خطای `unable to open database file`، خروجی خالی یا `authorization denied` مواجه شد، دسترسی کامل دیسک را به پایانه، ویرایشگر، فرایند Node، سرویس Gateway یا فرایند والد SSH که `imsg` را اجرا می‌کند بدهید، سپس آن فرایند والد را دوباره باز کنید.

2. پیش از تغییر پیکربندی OpenClaw، سطوح خواندن، پایش، ارسال و RPC را بررسی کنید:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` را با شناسهٔ واقعی یک گفتگو از `imsg chats` جایگزین کنید. ارسال به مجوز Automation برای Messages.app نیاز دارد. اگر OpenClaw از طریق SSH اجرا خواهد شد، این فرمان‌ها را از طریق همان پوشش SSH یا زمینهٔ کاربری اجرا کنید که OpenClaw استفاده خواهد کرد. اگر خواندن انجام می‌شود اما ارسال با خطای AppleEvents `-1743` ناموفق است، بررسی کنید که آیا مجوز Automation به `/usr/libexec/sshd-keygen-wrapper` اختصاص یافته است؛ به [شکست ارسال‌های پوشش SSH با AppleEvents -1743](/fa/channels/imessage#requirements-and-permissions-macos) مراجعه کنید.

3. پل API خصوصی را فعال کنید. استفاده از آن برای iMessage در OpenClaw اکیداً توصیه می‌شود، زیرا پاسخ‌ها، واکنش‌ها، جلوه‌ها، نظرسنجی‌ها، پاسخ به پیوست‌ها و کنش‌های گروه به آن وابسته‌اند:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` نیازمند غیرفعال بودن SIP است (و در نسخه‌های جدید macOS، اعتبارسنجی کتابخانه نیز باید آسان‌گیرانه‌تر شود — به [فعال‌سازی API خصوصی imsg](/fa/channels/imessage#enabling-the-imsg-private-api) مراجعه کنید). ارسال پایه، تاریخچه و پایش بدون `imsg launch` کار می‌کنند؛ اما مجموعهٔ کامل کنش‌های iMessage در OpenClaw در دسترس نخواهد بود.

4. پس از فعال‌سازی `channels.imessage` و راه‌اندازی Gateway، پل را از طریق OpenClaw بررسی کنید:

   ```bash
   openclaw channels status --probe
   ```

   حساب iMessage باید وضعیت `works` را گزارش کند؛ با `--json`، بار دادهٔ بررسی شامل `privateApi.available: true` است. اگر مقدار `false` گزارش شد، ابتدا آن را برطرف کنید — به [تشخیص قابلیت‌ها](/fa/channels/imessage#private-api-actions) مراجعه کنید. بررسی به Gateway قابل‌دسترسی نیاز دارد (در غیر این صورت، CLI فقط خروجی مبتنی بر پیکربندی ارائه می‌دهد) و فقط حساب‌های پیکربندی‌شده و فعال را بررسی می‌کند.

5. از پیکربندی خود یک نسخهٔ لحظه‌ای تهیه کنید:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## تبدیل پیکربندی

iMessage و BlueBubbles بیشتر کلیدهای رفتاری سطح کانال را مشترک دارند. آنچه تغییر می‌کند، سازوکار انتقال (سرور REST در برابر CLI محلی) و قالب کلید دفتر ثبت گروه‌ها است.

| BlueBubbles                                                | iMessage همراه‌شده                         | یادداشت‌ها                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | معنا و رفتار یکسان است (پس از وجود بلوک، مقدار پیش‌فرض `true` است).                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.serverUrl`                           | _(حذف‌شده)_                               | سرور REST وجود ندارد — Plugin، دستور `imsg rpc` را از طریق stdio اجرا می‌کند.                                                                                                                                                                                                                                          |
| `channels.bluebubbles.password`                            | _(حذف‌شده)_                               | نیازی به احراز هویت Webhook نیست.                                                                                                                                                                                                                                                                                       |
| _(ضمنی)_                                                   | `channels.imessage.cliPath`               | مسیر `imsg` (پیش‌فرض `imsg`)؛ برای SSH از اسکریپت پوششی استفاده کنید.                                                                                                                                                                                                                                                   |
| _(ضمنی)_                                                   | `channels.imessage.dbPath`                | بازنویسی اختیاری مسیر `chat.db` مربوط به Messages.app؛ در صورت حذف، به‌طور خودکار شناسایی می‌شود.                                                                                                                                                                                                                       |
| _(ضمنی)_                                                   | `channels.imessage.remoteHost`            | `host` یا `user@host` — فقط زمانی لازم است که `cliPath` یک پوشش SSH باشد و بخواهید پیوست‌ها از طریق SCP دریافت شوند.                                                                                                                                                                                                     |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | مقادیر یکسان (`pairing` / `allowlist` / `open` / `disabled`)؛ پیش‌فرض `pairing` است.                                                                                                                                                                                                                                    |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | قالب شناسه‌ها یکسان است (`+15555550123`، `user@example.com`). تأییدهای ذخیره‌شده در مخزن جفت‌سازی منتقل نمی‌شوند — پایین‌تر را ببینید.                                                                                                                                                                                   |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | مقادیر یکسان (`allowlist` / `open` / `disabled`)؛ پیش‌فرض `allowlist` است.                                                                                                                                                                                                                                              |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | یکسان است. اگر تنظیم نشده باشد، iMessage از `allowFrom` استفاده می‌کند؛ مقدار صریحاً خالی `groupAllowFrom: []` همه گروه‌ها را در حالت `groupPolicy: "allowlist"` مسدود می‌کند.                                                                                                                                            |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | ورودی عام `"*"` را عیناً کپی کنید؛ کلید ورودی‌های هر گروه را با `chat_id` عددی iMessage جایگزین کنید — بخش «دام رجیستری گروه» را ببینید. گزینه‌های `requireMention`، `tools`، `toolsBySender` و `systemPrompt` بدون تغییر منتقل می‌شوند.                                                                                   |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | پیش‌فرض `true` است. با Plugin همراه‌شده، این گزینه فقط زمانی فعال می‌شود که کاوش API خصوصی برقرار باشد.                                                                                                                                                                                                                  |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | ساختار یکسان و در هر دو حالت به‌طور پیش‌فرض غیرفعال است. اگر پیوست‌ها در BlueBubbles منتقل می‌شدند، این گزینه را صریحاً تنظیم کنید — تا پیش از آن، عکس‌ها و رسانه‌های ورودی بی‌صدا حذف می‌شوند (بدون خط گزارش `Inbound message`).                                                                                           |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ریشه‌های محلی؛ قواعد نویسه عام یکسان است.                                                                                                                                                                                                                                                                               |
| _(قابل‌اعمال نیست)_                                        | `channels.imessage.remoteAttachmentRoots` | فقط زمانی استفاده می‌شود که `remoteHost` برای دریافت از طریق SCP تنظیم شده باشد.                                                                                                                                                                                                                                       |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | پیش‌فرض در iMessage برابر ۱۶ مگابایت است (پیش‌فرض BlueBubbles برابر ۸ مگابایت بود). برای حفظ سقف پایین‌تر، آن را صریحاً تنظیم کنید.                                                                                                                                                                                        |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | پیش‌فرض در هر دو ۴۰۰۰ است.                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | همان گزینه انتخابی است. فقط برای پیام خصوصی — گروه‌ها ارسال جداگانه هر پیام را حفظ می‌کنند. مگر اینکه `messages.inbound.byChannel.imessage` یا مقدار سراسری `messages.inbound.debounceMs` تنظیم شده باشد، تأخیر تجمیع پیش‌فرض ورودی را به ۷۰۰۰ میلی‌ثانیه افزایش می‌دهد. بخش [تجمیع پیام‌های خصوصی چندبخشی](/fa/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) را ببینید. |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(قابل‌اعمال نیست)_                        | `imsg` از قبل نام نمایشی فرستندگان را از `chat.db` ارائه می‌کند.                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | کلیدهای فعال‌سازی هر کنش یکسان‌اند (`reactions`، `edit`، `unsend`، `reply`، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، `sendAttachment`) و گزینه جدید `polls` نیز اضافه شده است. همه به‌طور پیش‌فرض فعال‌اند؛ کنش‌های API خصوصی همچنان به پل نیاز دارند.                                      |

پیکربندی‌های چندحسابی (`channels.bluebubbles.accounts.*`) به‌صورت یک‌به‌یک به `channels.imessage.accounts.*` تبدیل می‌شوند.

## دام رجیستری گروه

Plugin همراه‌شده iMessage دو دروازه گروه را پشت‌سرهم اجرا می‌کند. پیام گروهی برای رسیدن به عامل باید از هر دو عبور کند:

1. **فهرست مجاز فرستنده / مقصد گپ** (`channels.imessage.groupAllowFrom`) — با شناسه فرستنده یا مقصد گپ (ورودی‌های `chat_id:`، `chat_guid:` و `chat_identifier:`) تطبیق داده می‌شود. اگر `groupAllowFrom` تنظیم نشده باشد، این دروازه از `allowFrom` استفاده می‌کند؛ مقدار صریح `groupAllowFrom: []` این بازگشت را غیرفعال می‌کند و در حالت `groupPolicy: "allowlist"` همه پیام‌های گروهی را کنار می‌گذارد.
2. **رجیستری گروه** (`channels.imessage.groups`) — با `chat_id` عددی iMessage کلیدگذاری می‌شود:
   - بدون بلوک `groups` (یا با بلوک خالی): تا زمانی که دروازه ۱ یک فهرست مجاز مؤثر و غیرخالی برای فرستندگان داشته باشد، گروه‌ها از این دروازه عبور می‌کنند؛ پالایش فرستنده دسترسی را کنترل می‌کند و هشدار حذف همه در زمان راه‌اندازی صادر نمی‌شود.
   - `groups` دارای ورودی، اما بدون `"*"`: فقط کلیدهای `chat_id` فهرست‌شده عبور می‌کنند. فهرست‌کردن هر گروهی، رجیستری را حتی در حالت `groupPolicy: "open"` به فهرست مجاز تبدیل می‌کند.
   - `groups: { "*": { ... } }`: همه گروه‌ها از این دروازه عبور می‌کنند.

دام مهاجرت این است: BlueBubbles ورودی‌های `groups` را با GUID گپ / شناسه گپ کلیدگذاری می‌کرد، اما رجیستری iMessage از `chat_id` عددی استفاده می‌کند. کپی عینی ورودی‌های هر گروه، رجیستری غیرخالی‌ای ایجاد می‌کند که کلیدهایش هرگز تطبیق نمی‌یابند؛ بنابراین همه پیام‌های گروهی در دروازه ۲ کنار گذاشته می‌شوند. ورودی عام `"*"` را عیناً کپی کنید؛ کلید ورودی‌های گروه‌های مشخص را با مقادیر `chat_id` برگرفته از `imsg chats` جایگزین کنید.

هر دو مسیر حذف در سطح پیش‌فرض گزارش، از طریق خطوط `warn` قابل مشاهده‌اند:

- یک بار برای هر حساب هنگام راه‌اندازی، وقتی `groupPolicy: "allowlist"` تنظیم شده اما فهرست مجاز مؤثر فرستندگان گروه خالی است: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. برای پذیرش فرستندگان، `groupAllowFrom` (یا `allowFrom`) را تنظیم کنید؛ افزودن صرف `groups` دروازه فرستنده را برآورده نمی‌کند.
- یک بار برای هر `chat_id` هنگام اجرا، وقتی رجیستری گروهی را حذف می‌کند: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist` که کلید دقیق لازم برای افزودن را مشخص می‌کند.

پیام‌های خصوصی در هر دو حالت همچنان کار می‌کنند — آن‌ها مسیر کد متفاوتی دارند، بنابراین موفقیت پیام خصوصی، مسیریابی صحیح گروه را اثبات نمی‌کند.

حداقل پیکربندی محدودشده به فرستنده با `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

این پیکربندی فرستندگان تنظیم‌شده را در هر گروهی می‌پذیرد. برای محدودکردن گپ‌های مجاز یا تنظیم گزینه‌های هر گپ مانند `requireMention`، ورودی‌های `groups` را اضافه کنید؛ ورودی `"*"` از BlueBubbles را عیناً کپی کنید، اما کلید ورودی‌های مشخص را با مقادیر عددی `chat_id` مربوط به iMessage جایگزین کنید.

## گام‌به‌گام

1. پیکربندی را منتقل کنید. هنگام ویرایش، بلوک جدید را غیرفعال نگه دارید؛ بلوک قدیمی `channels.bluebubbles` در نسخهٔ فعلی OpenClaw نادیده گرفته می‌شود و می‌تواند برای مرجع در کنار آن باقی بماند:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **انتقال را انجام دهید و بررسی کنید.** مقدار `channels.imessage.enabled: true` را تنظیم کنید، Gateway را راه‌اندازی مجدد کنید و مطمئن شوید کانال وضعیت سالم گزارش می‌کند:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   این بررسی به یک Gateway در دسترس نیاز دارد و فقط حساب‌های پیکربندی‌شده و فعال را بررسی می‌کند. برای اعتبارسنجی خود Mac، از فرمان‌های مستقیم `imsg` در [پیش از شروع](#before-you-start) استفاده کنید.

3. **پیام‌های مستقیم را بررسی کنید.** یک پیام مستقیم برای عامل ارسال کنید و مطمئن شوید پاسخ دریافت می‌شود.

4. **گروه‌ها را جداگانه بررسی کنید.** پیام‌های مستقیم و گروه‌ها از مسیرهای کد متفاوتی عبور می‌کنند — موفقیت پیام مستقیم ثابت نمی‌کند که مسیریابی گروه‌ها درست کار می‌کند. در یک گفت‌وگوی گروهی مجاز پیامی ارسال کنید و مطمئن شوید پاسخ دریافت می‌شود. اگر گروه ساکت ماند (نه پاسخی از عامل و نه خطایی)، گزارش Gateway را برای دو خط `warn` بخش "Group registry footgun" در بالا بررسی کنید. هشدار هنگام راه‌اندازی یعنی فهرست مجاز مؤثر فرستندگان خالی است؛ هشدار مربوط به یک `chat_id` مشخص یعنی رجیستری پرشدهٔ `groups` شامل آن گفت‌وگو نیست.

5. **سطح کنش‌ها را بررسی کنید.** از طریق یک پیام مستقیم جفت‌شده، از عامل بخواهید واکنش نشان دهد، ویرایش کند، ارسال را لغو کند، پاسخ دهد، عکس بفرستد و در یک گروه، نام گروه را تغییر دهد یا شرکت‌کننده‌ای را اضافه/حذف کند. هر کنش باید به‌صورت بومی در Messages.app اعمال شود. اگر هر کنشی خطای `iMessage <action> requires the imsg private API bridge` ایجاد کرد، دوباره `imsg launch` را اجرا کنید و با `openclaw channels status --probe` وضعیت را تازه‌سازی کنید.

6. پس از تأیید پیام‌های مستقیم، گروه‌ها و کنش‌های iMessage، **سرور BlueBubbles و بلوک `channels.bluebubbles` را حذف کنید**. OpenClaw مقدار `channels.bluebubbles` را نمی‌خواند.

## مقایسهٔ سریع قابلیت‌های کنش

| کنش                                                | BlueBubbles قدیمی | iMessage همراه بسته                                                           |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| ارسال متن / بازگشت به SMS                           | ✅                 | ✅                                                                            |
| ارسال رسانه (عکس، ویدئو، فایل، صدا)                | ✅                 | ✅                                                                            |
| پاسخ رشته‌ای (`reply_to_guid`)                      | ✅                 | ✅ (مسئلهٔ [#51892](https://github.com/openclaw/openclaw/issues/51892) را حل می‌کند) |
| واکنش Tapback (`react`)                             | ✅                 | ✅                                                                            |
| ویرایش / لغو ارسال (گیرندگان macOS 13+)             | ✅                 | ✅                                                                            |
| ارسال با جلوهٔ صفحه                                 | ✅                 | ✅ (بخشی از [#9394](https://github.com/openclaw/openclaw/issues/9394) را حل می‌کند) |
| متن غنی پررنگ / مورب / زیرخط‌دار / خط‌خورده         | ✅                 | ✅ (قالب‌بندی اجرای نوع‌دار از طریق attributedBody)                           |
| نظرسنجی‌های بومی Messages (ایجاد و رأی‌دادن)         | ❌                 | ✅ (`actions.polls`؛ گیرندگان برای نمایش بومی به iOS/macOS 26+ نیاز دارند)   |
| تغییر نام گروه / تنظیم نماد گروه                    | ✅                 | ✅                                                                            |
| افزودن / حذف شرکت‌کننده، ترک گروه                   | ✅                 | ✅                                                                            |
| رسید خواندن و نشانگر تایپ                           | ✅                 | ✅ (مشروط به موفقیت بررسی API خصوصی)                                         |
| ادغام پیام‌های مستقیم از یک فرستنده                 | ✅                 | ✅ (فقط پیام مستقیم؛ فعال‌سازی اختیاری از طریق `channels.imessage.coalesceSameSenderDms`) |
| بازیابی ورودی‌ها پس از راه‌اندازی مجدد              | ✅                 | ✅ (خودکار: بازپخش `since_rowid` + حذف موارد تکراری با GUID؛ پنجرهٔ گسترده‌تر در حالت محلی) |

iMessage پیام‌هایی را که هنگام ازکارافتادگی Gateway از دست رفته‌اند بازیابی می‌کند: هنگام راه‌اندازی، از آخرین rowid ارسال‌شده با استفاده از `since_rowid` در `imsg watch.subscribe` بازپخش می‌کند، موارد تکراری را بر اساس GUID حذف می‌کند و یک محدودیت سنی برای صف قدیمی، «انفجار صف» ناشی از تخلیهٔ Push را مهار می‌کند. این فرایند از طریق اتصال RPC مربوط به `imsg` اجرا می‌شود، بنابراین برای راه‌اندازی‌های `cliPath` از راه دور با SSH نیز کار می‌کند؛ راه‌اندازی‌های محلی پنجرهٔ بازیابی گسترده‌تری دارند، زیرا می‌توانند `chat.db` را بخوانند. به [بازیابی ورودی‌ها پس از راه‌اندازی مجدد پل یا Gateway](/fa/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart) مراجعه کنید.

## جفت‌سازی، نشست‌ها و اتصال‌های ACP

- **فهرست‌های مجاز بر اساس شناسه منتقل می‌شوند.** `channels.imessage.allowFrom` همان رشته‌های `+15555550123` / `user@example.com` را که BlueBubbles استفاده می‌کرد تشخیص می‌دهد — آن‌ها را بدون تغییر کپی کنید.
- **تأییدیه‌های مخزن جفت‌سازی منتقل نمی‌شوند.** مخزن جفت‌سازی مختص هر کانال است و هیچ‌چیز مخزن قدیمی BlueBubbles را منتقل نمی‌کند. فرستندگانی که فقط از طریق جفت‌سازی تأیید شده بودند، باید یک‌بار دیگر در iMessage جفت شوند یا باید شناسه‌هایشان را به `allowFrom` اضافه کنید.
- **نشست‌ها** همچنان به هر عامل + گفت‌وگو محدود می‌مانند. با مقدار پیش‌فرض `session.dmScope=main`، پیام‌های مستقیم در نشست اصلی عامل ادغام می‌شوند؛ نشست‌های گروهی برای هر `chat_id` جدا می‌مانند (`agent:<agentId>:imessage:group:<chat_id>`). تاریخچهٔ قدیمی گفت‌وگوها در کلیدهای نشست BlueBubbles به نشست‌های iMessage منتقل نمی‌شود.
- **اتصال‌های ACP** که به `match.channel: "bluebubbles"` ارجاع می‌دهند باید به `"imessage"` تغییر کنند. قالب‌های `match.peer.id` (`chat_id:`، `chat_guid:`، `chat_identifier:` و شناسهٔ خام) یکسان هستند.

## نبود کانال بازگشت

هیچ محیط اجرایی پشتیبانی‌شده‌ای از BlueBubbles برای بازگشت وجود ندارد. اگر تأیید iMessage ناموفق بود، مقدار `channels.imessage.enabled: false` را تنظیم کنید، Gateway را راه‌اندازی مجدد کنید، مانع مربوط به `imsg` را برطرف کنید و انتقال را دوباره امتحان کنید.

حافظهٔ نهان پاسخ در وضعیت SQLite مربوط به Plugin نگهداری می‌شود. در صورت وجود فایل جانبی قدیمی `imessage/reply-cache.jsonl`، فرمان `openclaw doctor --fix` آن را وارد و بایگانی می‌کند.

## مطالب مرتبط

- [حذف BlueBubbles و مسیر iMessage مبتنی بر imsg](/fa/announcements/bluebubbles-imessage) — اطلاعیه‌ای کوتاه و خلاصه‌ای برای اپراتورها.
- [iMessage](/fa/channels/imessage) — مرجع کامل کانال iMessage، شامل راه‌اندازی `imsg launch` و تشخیص قابلیت‌ها.
- `/channels/bluebubbles` — نشانی قدیمی که به این راهنمای مهاجرت هدایت می‌شود.
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و فرایند جفت‌سازی.
- [مسیریابی کانال](/fa/channels/channel-routing) — نحوهٔ انتخاب کانال توسط Gateway برای پاسخ‌های خروجی.
