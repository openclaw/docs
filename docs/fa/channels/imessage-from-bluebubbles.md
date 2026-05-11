---
read_when:
    - برنامه‌ریزی برای مهاجرت از BlueBubbles به Plugin همراه iMessage
    - ترجمهٔ کلیدهای پیکربندی BlueBubbles به معادل‌های iMessage
    - راستی‌آزمایی imsg پیش از فعال‌سازی Plugin iMessage
summary: پیکربندی‌های قدیمی BlueBubbles را بدون از دست دادن جفت‌سازی، فهرست‌های مجاز یا پیوندهای گروهی به Plugin همراه iMessage مهاجرت دهید.
title: مهاجرت از BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin همراه `imessage` اکنون با هدایت [`steipete/imsg`](https://github.com/steipete/imsg) از طریق JSON-RPC به همان سطح API خصوصی BlueBubbles (`react`، `edit`، `unsend`، `reply`، `sendWithEffect`، مدیریت گروه، پیوست‌ها) دسترسی دارد. اگر از قبل یک Mac با `imsg` نصب‌شده اجرا می‌کنید، می‌توانید سرور BlueBubbles را حذف کنید و اجازه دهید Plugin مستقیما با Messages.app صحبت کند.

پشتیبانی از BlueBubbles حذف شده است. OpenClaw از iMessage فقط از طریق `imsg` پشتیبانی می‌کند. این راهنما برای مهاجرت پیکربندی‌های قدیمی `channels.bluebubbles` به `channels.imessage` است؛ مسیر مهاجرت پشتیبانی‌شده دیگری وجود ندارد.

<Note>
برای اعلامیه کوتاه و خلاصه اپراتور، [حذف BlueBubbles و مسیر imsg برای iMessage](/fa/announcements/bluebubbles-imessage) را ببینید.
</Note>

## چک‌لیست مهاجرت

وقتی پیکربندی قدیمی BlueBubbles خود را از قبل می‌شناسید و کوتاه‌ترین مسیر امن را می‌خواهید، از این چک‌لیست استفاده کنید:

1. `imsg` را مستقیما روی Macی که Messages.app را اجرا می‌کند بررسی کنید (`imsg chats`، `imsg history`، `imsg send`، و `imsg rpc --help`).
2. کلیدهای رفتاری را از `channels.bluebubbles` به `channels.imessage` کپی کنید: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `includeAttachments`، `attachmentRoots`، `mediaMaxMb`، `textChunkLimit`، `coalesceSameSenderDms`، و `actions`.
3. کلیدهای انتقالی را که دیگر وجود ندارند حذف کنید: `serverUrl`، `password`، URLهای webhook، و راه‌اندازی سرور BlueBubbles.
4. اگر Gateway روی Macِ Messages اجرا نمی‌شود، `channels.imessage.cliPath` را روی یک wrapper مبتنی بر SSH تنظیم کنید و `remoteHost` را برای دریافت پیوست‌های راه‌دور تنظیم کنید.
5. در حالی که Gateway متوقف است، `channels.imessage` را فعال کنید، سپس `openclaw channels status --probe --channel imessage` را اجرا کنید.
6. یک DM، یک گروه مجاز، پیوست‌ها در صورت فعال بودن، و هر عمل API خصوصی را که انتظار دارید agent استفاده کند آزمایش کنید.
7. پس از تایید مسیر iMessage، سرور BlueBubbles و پیکربندی قدیمی `channels.bluebubbles` را حذف کنید.

## چه زمانی این مهاجرت منطقی است

- شما از قبل `imsg` را روی همان Mac (یا Macی که از طریق SSH قابل دسترسی است) اجرا می‌کنید که Messages.app در آن وارد حساب شده است.
- یک جزء متحرک کمتر می‌خواهید — بدون سرور جداگانه BlueBubbles، بدون endpoint REST برای احراز هویت، بدون لوله‌کشی webhook. یک باینری CLI واحد به‌جای سرور + برنامه کلاینت + helper.
- روی یک [ساخت پشتیبانی‌شده macOS / `imsg`](/fa/channels/imessage#requirements-and-permissions-macos) هستید که probe API خصوصی در آن `available: true` گزارش می‌دهد.

## imsg چه می‌کند

`imsg` یک CLI محلی macOS برای Messages است. OpenClaw، `imsg rpc` را به‌عنوان یک پردازش فرزند شروع می‌کند و از طریق stdin/stdout با JSON-RPC صحبت می‌کند. هیچ سرور HTTP، URL webhook، daemon پس‌زمینه، launch agent، یا پورتی برای expose کردن وجود ندارد.

- خواندن‌ها از `~/Library/Messages/chat.db` با استفاده از یک handle فقط‌خواندنی SQLite انجام می‌شوند.
- پیام‌های ورودی زنده از `imsg watch` / `watch.subscribe` می‌آیند، که رویدادهای فایل‌سیستم `chat.db` را با fallback مبتنی بر polling دنبال می‌کند.
- ارسال‌ها برای متن عادی و ارسال فایل از اتوماسیون Messages.app استفاده می‌کنند.
- عمل‌های پیشرفته از `imsg launch` برای inject کردن helperِ `imsg` در Messages.app استفاده می‌کنند. همین مورد رسید خواندن، نشانگرهای تایپ، ارسال‌های غنی، ویرایش، لغو ارسال، پاسخ رشته‌ای، tapbackها، و مدیریت گروه را آزاد می‌کند.
- ساخت‌های Linux می‌توانند یک `chat.db` کپی‌شده را بررسی کنند، اما نمی‌توانند ارسال کنند، پایگاه‌داده زنده Mac را watch کنند، یا Messages.app را هدایت کنند. برای iMessage در OpenClaw، `imsg` را روی Mac واردشده اجرا کنید یا از طریق یک wrapper مبتنی بر SSH به آن Mac اجرا کنید.

## پیش از شروع

1. `imsg` را روی Macی نصب کنید که Messages.app را اجرا می‌کند:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   اگر `imsg chats` با `unable to open database file`، خروجی خالی، یا `authorization denied` شکست خورد، Full Disk Access را به ترمینال، ویرایشگر، پردازش Node، سرویس Gateway، یا پردازش والد SSH که `imsg` را اجرا می‌کند بدهید، سپس آن پردازش والد را دوباره باز کنید.

2. پیش از تغییر پیکربندی OpenClaw، سطوح خواندن، watch، ارسال، و RPC را بررسی کنید:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` را با یک شناسه گفت‌وگوی واقعی از `imsg chats` جایگزین کنید. ارسال به مجوز Automation برای Messages.app نیاز دارد. اگر OpenClaw قرار است از طریق SSH اجرا شود، این دستورها را از طریق همان wrapper مبتنی بر SSH یا context کاربری‌ای اجرا کنید که OpenClaw استفاده خواهد کرد.

3. وقتی به عمل‌های پیشرفته نیاز دارید، پل API خصوصی را فعال کنید:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` نیاز دارد SIP غیرفعال باشد. ارسال پایه، history، و watch بدون `imsg launch` کار می‌کنند؛ عمل‌های پیشرفته کار نمی‌کنند.

4. پس از افزودن پیکربندی فعال `channels.imessage`، پل را از طریق OpenClaw بررسی کنید:

   ```bash
   openclaw channels status --probe
   ```

   مقدار مطلوب `imessage.privateApi.available: true` است. اگر `false` گزارش شد، ابتدا آن را رفع کنید — [تشخیص قابلیت](/fa/channels/imessage#private-api-actions) را ببینید. `channels status --probe` فقط حساب‌های پیکربندی‌شده و فعال را probe می‌کند.

5. از پیکربندی خود snapshot بگیرید:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## ترجمه پیکربندی

iMessage و BlueBubbles بخش زیادی از پیکربندی سطح channel را به اشتراک می‌گذارند. کلیدهایی که تغییر می‌کنند عمدتا مربوط به انتقال هستند (سرور REST در برابر CLI محلی). کلیدهای رفتاری (`dmPolicy`، `groupPolicy`، `allowFrom`، و غیره) همان معنا را حفظ می‌کنند.

| BlueBubbles                                                | iMessage همراه                            | یادداشت‌ها                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | معناشناسی یکسان.                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(حذف شده)_                               | سرور REST وجود ندارد — Plugin، `imsg rpc` را از طریق stdio اجرا می‌کند.                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(حذف شده)_                               | به احراز هویت Webhook نیازی نیست.                                                                                                                                                                                                                                                                                                            |
| _(ضمنی)_                                               | `channels.imessage.cliPath`               | مسیر `imsg` (پیش‌فرض `imsg`)؛ برای SSH از یک اسکریپت پوششی استفاده کنید.                                                                                                                                                                                                                                                                               |
| _(ضمنی)_                                               | `channels.imessage.dbPath`                | بازنویسی اختیاری `chat.db` مربوط به Messages.app؛ در صورت حذف، به‌صورت خودکار شناسایی می‌شود.                                                                                                                                                                                                                                                                        |
| _(ضمنی)_                                               | `channels.imessage.remoteHost`            | `host` یا `user@host` — فقط زمانی لازم است که `cliPath` یک پوشش SSH باشد و بخواهید پیوست‌ها را با SCP دریافت کنید.                                                                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | مقادیر یکسان (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | تأییدهای جفت‌سازی بر اساس handle منتقل می‌شوند، نه بر اساس token.                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | مقادیر یکسان (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | یکسان.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **این را عیناً کپی کنید، از جمله هر ورودی wildcard مانند `groups: { "*": { ... } }`.** مقادیر به‌ازای هر گروه برای `requireMention`، `tools`، و `toolsBySender` منتقل می‌شوند. با `groupPolicy: "allowlist"`، یک بلوک `groups` خالی یا حذف‌شده، همه پیام‌های گروهی را بی‌صدا حذف می‌کند — بخش «دام رجیستری گروه» را در پایین ببینید.                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | پیش‌فرض `true`. با Plugin همراه، این فقط زمانی اجرا می‌شود که probe خصوصی API فعال باشد.                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | همان شکل، **همان حالت خاموش به‌صورت پیش‌فرض**. اگر در BlueBubbles پیوست‌ها برای شما جریان داشتند، باید این را صریحاً در بلوک iMessage دوباره تنظیم کنید — به‌صورت ضمنی منتقل نمی‌شود، و عکس‌ها/رسانه‌های ورودی تا زمانی که این کار را انجام ندهید، بی‌صدا و بدون خط لاگ `Inbound message` حذف می‌شوند.                                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ریشه‌های محلی؛ همان قواعد wildcard.                                                                                                                                                                                                                                                                                                            |
| _(ناموجود)_                                                    | `channels.imessage.remoteAttachmentRoots` | فقط زمانی استفاده می‌شود که `remoteHost` برای دریافت‌های SCP تنظیم شده باشد.                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | پیش‌فرض در iMessage برابر 16 MB است (پیش‌فرض BlueBubbles برابر 8 MB بود). اگر می‌خواهید سقف پایین‌تر را حفظ کنید، صریحاً تنظیم کنید.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | پیش‌فرض در هر دو 4000 است.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | همان گزینه فعال‌سازی اختیاری. فقط برای DM — چت‌های گروهی در هر دو کانال، ارسال فوری به‌ازای هر پیام را حفظ می‌کنند. وقتی بدون `messages.inbound.byChannel.imessage` صریح فعال شود، debounce پیش‌فرض ورودی را به 2500 ms افزایش می‌دهد. [مستندات iMessage § ادغام DMهای split-send](/fa/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) را ببینید. |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(ناموجود)_                                   | iMessage از قبل نام‌های نمایشی فرستنده را از `chat.db` می‌خواند.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | کلیدهای فعال/غیرفعال‌سازی به‌ازای هر کنش: `reactions`، `edit`، `unsend`، `reply`، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، `sendAttachment`.                                                                                                                                                          |

پیکربندی‌های چندحسابی (`channels.bluebubbles.accounts.*`) به‌صورت یک‌به‌یک به `channels.imessage.accounts.*` ترجمه می‌شوند.

## دام رجیستری گروه

Plugin همراه iMessage، **دو** دروازه allowlist جداگانه گروه را پشت سر هم اجرا می‌کند. هر دو باید قبول شوند تا یک پیام گروهی به agent برسد:

1. **allowlist فرستنده / مقصد چت** (`channels.imessage.groupAllowFrom`) — توسط `isAllowedIMessageSender` بررسی می‌شود. پیام‌های ورودی را بر اساس handle فرستنده، `chat_guid`، `chat_identifier`، یا `chat_id` مطابقت می‌دهد. همان شکل BlueBubbles.
2. **رجیستری گروه** (`channels.imessage.groups`) — توسط `resolveChannelGroupPolicy` از `inbound-processing.ts:199` بررسی می‌شود. با `groupPolicy: "allowlist"`، این دروازه یکی از این موارد را لازم دارد:
   - یک ورودی wildcard مانند `groups: { "*": { ... } }` (مقدار `allowAll = true` را تنظیم می‌کند)، یا
   - یک ورودی صریح به‌ازای هر `chat_id` زیر `groups`.

اگر دروازه 1 قبول شود اما دروازه 2 رد شود، پیام حذف می‌شود. Plugin دو سیگنال سطح `warn` منتشر می‌کند تا این وضعیت دیگر در سطح لاگ پیش‌فرض بی‌صدا نباشد:

- یک `warn` یک‌باره هنگام راه‌اندازی برای هر حساب، وقتی `groupPolicy: "allowlist"` تنظیم شده اما `channels.imessage.groups` خالی است (بدون wildcard `"*"` و بدون ورودی‌های به‌ازای هر `chat_id`) — پیش از رسیدن هر پیام اجرا می‌شود.
- یک `warn` یک‌باره به‌ازای هر `chat_id`، اولین باری که یک گروه مشخص در زمان اجرا حذف می‌شود، با نام‌بردن از chat_id و کلید دقیقی که باید به `groups` اضافه شود تا مجاز شود.

DMها همچنان کار می‌کنند، چون مسیر کد متفاوتی را طی می‌کنند.

این رایج‌ترین حالت شکست مهاجرت از BlueBubbles به iMessage همراه است: اپراتورها `groupAllowFrom` و `groupPolicy` را کپی می‌کنند اما بلوک `groups` را جا می‌اندازند، چون `groups: { "*": { "requireMention": true } }` در BlueBubbles شبیه یک تنظیم نامرتبط برای mention به نظر می‌رسد. در واقع برای دروازه رجیستری حیاتی است.

حداقل پیکربندی برای ادامه جریان پیام‌های گروهی پس از `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` زیر `*` وقتی هیچ الگوی اشاره‌ای پیکربندی نشده باشد بی‌ضرر است: runtime مقدار `canDetectMention = false` را تنظیم می‌کند و حذف اشاره را در `inbound-processing.ts:512` میان‌بُر می‌زند. وقتی الگوهای اشاره پیکربندی شده باشند (`agents.list[].groupChat.mentionPatterns`)، مطابق انتظار کار می‌کند.

اگر لاگ‌های Gateway عبارت `imessage: dropping group message from chat_id=<id>` یا خط راه‌اندازی `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` را نشان می‌دهند، گیت ۲ در حال حذف کردن است — بلوک `groups` را اضافه کنید.

## گام‌به‌گام

1. یک بلوک iMessage کنار بلوک موجود BlueBubbles اضافه کنید. تا وقتی Gateway هنوز ترافیک BlueBubbles را مسیریابی می‌کند، آن را غیرفعال نگه دارید:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **پیش از آنکه ترافیک اهمیت پیدا کند، بررسی کنید** — Gateway را متوقف کنید، موقتاً بلوک iMessage را فعال کنید، و تأیید کنید iMessage از CLI سالم گزارش می‌شود:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` فقط حساب‌های پیکربندی‌شده و فعال را بررسی می‌کند. Gateway را با فعال بودن هم‌زمان BlueBubbles و iMessage راه‌اندازی مجدد نکنید، مگر اینکه عمداً بخواهید هر دو پایشگر کانال در حال اجرا باشند. اگر بلافاصله در حال جابه‌جایی نیستید، پیش از راه‌اندازی مجدد Gateway مقدار `channels.imessage.enabled` را دوباره به `false` برگردانید. برای اعتبارسنجی Mac پیش از فعال کردن ترافیک OpenClaw، از فرمان‌های مستقیم `imsg` در [پیش از شروع](#before-you-start) استفاده کنید.

3. **جابه‌جا شوید.** وقتی حساب iMessage فعال، سالم گزارش شد، پیکربندی BlueBubbles را حذف کنید و iMessage را فعال نگه دارید:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway را راه‌اندازی مجدد کنید. ترافیک ورودی iMessage اکنون از مسیر Plugin همراه عبور می‌کند.

4. **DMها را تأیید کنید.** به عامل یک پیام مستقیم بفرستید؛ تأیید کنید پاسخ می‌رسد.

5. **گروه‌ها را جداگانه تأیید کنید.** DMها و گروه‌ها مسیرهای کد متفاوتی دارند — موفقیت DM ثابت نمی‌کند گروه‌ها مسیریابی می‌شوند. در یک گفت‌وگوی گروهی جفت‌شده به عامل پیام بفرستید و تأیید کنید پاسخ می‌رسد. اگر گروه ساکت شد (نه پاسخی از عامل، نه خطایی)، لاگ Gateway را برای `imessage: dropping group message from chat_id=<id>` یا خط راه‌اندازی `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` بررسی کنید — هر دو در سطح لاگ پیش‌فرض فعال می‌شوند. اگر هرکدام ظاهر شد، بلوک `groups` شما وجود ندارد یا خالی است — «Group registry footgun» بالا را ببینید.

6. **سطح کنش‌ها را تأیید کنید** — از یک DM جفت‌شده، از عامل بخواهید واکنش بدهد، ویرایش کند، ارسال را لغو کند، پاسخ بدهد، عکس بفرستد، و (در گروه) نام گروه را تغییر دهد / شرکت‌کننده‌ای اضافه یا حذف کند. هر کنش باید به‌صورت بومی در Messages.app انجام شود. اگر هرکدام خطای "iMessage `<action>` requires the imsg private API bridge" داد، دوباره `imsg launch` را اجرا کنید و `channels status --probe` را تازه‌سازی کنید.

7. پس از تأیید DMهای iMessage، گروه‌ها، و کنش‌ها، **سرور و پیکربندی BlueBubbles را حذف کنید**. OpenClaw از `channels.bluebubbles` استفاده نخواهد کرد.

## برابری کنش‌ها در یک نگاه

| کنش                                                       | BlueBubbles قدیمی                    | iMessage همراه                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ارسال متن / بازگشت به SMS                                  | ✅                                  | ✅                                                                                                                      |
| ارسال رسانه (عکس، ویدیو، فایل، صدا)                       | ✅                                  | ✅                                                                                                                      |
| پاسخ رشته‌ای (`reply_to_guid`)                             | ✅                                  | ✅ (می‌بندد [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| ویرایش / لغو ارسال (گیرندگان macOS 13+)                   | ✅                                  | ✅                                                                                                                      |
| ارسال با جلوه صفحه                                         | ✅                                  | ✅ (بخشی از [#9394](https://github.com/openclaw/openclaw/issues/9394) را می‌بندد)                                      |
| متن غنی پررنگ / کج / زیرخط‌دار / خط‌خورده                 | ✅                                  | ✅ (قالب‌بندی typed-run از طریق attributedBody)                                                                         |
| تغییر نام گروه / تنظیم آیکن گروه                          | ✅                                  | ✅                                                                                                                      |
| افزودن / حذف شرکت‌کننده، ترک گروه                         | ✅                                  | ✅                                                                                                                      |
| رسید خواندن و نشانگر در حال تایپ                          | ✅                                  | ✅ (وابسته به بررسی private API)                                                                                        |
| ادغام DMهای فرستنده یکسان                                  | ✅                                  | ✅ (فقط DM؛ با `channels.imessage.coalesceSameSenderDms` به‌صورت opt-in)                                                |
| جبران پیام‌های ورودی دریافت‌شده هنگام خاموش بودن Gateway   | ✅ (بازپخش Webhook + واکشی تاریخچه) | ✅ (به‌صورت opt-in با `channels.imessage.catchup.enabled`؛ می‌بندد [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

قابلیت جبران iMessage اکنون به‌عنوان یک ویژگی opt-in روی Plugin همراه در دسترس است. هنگام راه‌اندازی Gateway، اگر `channels.imessage.catchup.enabled` برابر `true` باشد، Gateway یک گذر `chats.list` + `messages.history` برای هر گفت‌وگو را روی همان سرویس‌گیرنده JSON-RPC که `imsg watch` استفاده می‌کند اجرا می‌کند، هر ردیف ورودی ازدست‌رفته را از مسیر dispatch زنده بازپخش می‌کند (فهرست‌های مجاز، سیاست گروه، debouncer، cache اکو)، و برای هر حساب یک cursor نگه می‌دارد تا راه‌اندازی‌های بعدی از همان‌جا ادامه دهند. برای تنظیمات، [جبران پس از خاموشی Gateway](/fa/channels/imessage#catching-up-after-gateway-downtime) را ببینید.

## Pairing، نشست‌ها، و اتصال‌های ACP

- **تأییدهای Pairing** بر اساس handle منتقل می‌شوند. لازم نیست فرستنده‌های شناخته‌شده را دوباره تأیید کنید — `channels.imessage.allowFrom` همان رشته‌های `+15555550123` / `user@example.com` را که BlueBubbles استفاده می‌کرد می‌شناسد.
- **نشست‌ها** به‌ازای هر عامل + گفت‌وگو محدود می‌مانند. با مقدار پیش‌فرض `session.dmScope=main`، DMها در نشست اصلی عامل ادغام می‌شوند؛ نشست‌های گروهی به‌ازای هر `chat_id` جدا می‌مانند. کلیدهای نشست متفاوت‌اند (`agent:<id>:imessage:group:<chat_id>` در برابر معادل BlueBubbles) — تاریخچه گفت‌وگوی قدیمی زیر کلیدهای نشست BlueBubbles به نشست‌های iMessage منتقل نمی‌شود.
- **اتصال‌های ACP** که به `match.channel: "bluebubbles"` اشاره می‌کنند باید به `"imessage"` به‌روزرسانی شوند. شکل‌های `match.peer.id` (`chat_id:`، `chat_guid:`، `chat_identifier:`، handle خام) یکسان‌اند.

## بدون کانال بازگشت

هیچ runtime پشتیبانی‌شده‌ای برای BlueBubbles وجود ندارد که بتوانید به آن برگردید. اگر تأیید iMessage شکست خورد، `channels.imessage.enabled: false` را تنظیم کنید، Gateway را راه‌اندازی مجدد کنید، مانع `imsg` را رفع کنید، و جابه‌جایی را دوباره امتحان کنید.

cache پاسخ در `~/.openclaw/state/imessage/reply-cache.jsonl` قرار دارد (حالت `0600`، دایرکتوری والد `0700`). اگر بخواهید از نو شروع کنید، حذف آن بی‌خطر است.

## مرتبط

- [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) — اعلامیه کوتاه و خلاصه اپراتور.
- [iMessage](/fa/channels/imessage) — مرجع کامل کانال iMessage، شامل راه‌اندازی `imsg launch` و تشخیص قابلیت.
- `/channels/bluebubbles` — URL قدیمی که به این راهنمای مهاجرت تغییرمسیر می‌دهد.
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان Pairing.
- [مسیریابی کانال](/fa/channels/channel-routing) — اینکه Gateway چگونه کانال را برای پاسخ‌های خروجی انتخاب می‌کند.
