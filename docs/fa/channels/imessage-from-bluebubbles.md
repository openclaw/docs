---
read_when:
    - برنامه‌ریزی برای مهاجرت از BlueBubbles به Plugin همراه iMessage
    - ترجمهٔ کلیدهای پیکربندی BlueBubbles به معادل‌های iMessage
    - راستی‌آزمایی imsg پیش از فعال‌سازی Plugin iMessage
summary: پیکربندی‌های قدیمی BlueBubbles را بدون از دست دادن جفت‌سازی، فهرست‌های مجاز یا پیوندهای گروهی، به Plugin همراه iMessage منتقل کنید.
title: مهاجرت از BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin همراه `imessage` اکنون با هدایت [`steipete/imsg`](https://github.com/steipete/imsg) از طریق JSON-RPC به همان سطح API خصوصی BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`، مدیریت گروه، پیوست‌ها) دسترسی پیدا می‌کند. اگر از قبل یک Mac با `imsg` نصب‌شده اجرا می‌کنید، می‌توانید سرور BlueBubbles را کنار بگذارید و اجازه دهید Plugin مستقیماً با Messages.app صحبت کند.

پشتیبانی از BlueBubbles حذف شده است. OpenClaw فقط از طریق `imsg` از iMessage پشتیبانی می‌کند. این راهنما برای مهاجرت پیکربندی‌های قدیمی `channels.bluebubbles` به `channels.imessage` است؛ هیچ مسیر مهاجرت پشتیبانی‌شده دیگری وجود ندارد.

## چه زمانی این مهاجرت منطقی است

- از قبل `imsg` را روی همان Mac اجرا می‌کنید (یا روی موردی که از طریق SSH در دسترس است) که Messages.app در آن وارد حساب شده است.
- یک جزء متحرک کمتر می‌خواهید — بدون سرور جداگانه BlueBubbles، بدون endpoint REST برای احراز هویت، بدون تنظیمات Webhook. یک باینری CLI واحد به‌جای سرور + برنامه کلاینت + ابزار کمکی.
- روی یک [نسخه پشتیبانی‌شده macOS / `imsg`](/fa/channels/imessage#requirements-and-permissions-macos) هستید که در آن بررسی API خصوصی مقدار `available: true` را گزارش می‌کند.

## imsg چه می‌کند

`imsg` یک CLI محلی macOS برای Messages است. OpenClaw، `imsg rpc` را به‌عنوان فرایند فرزند شروع می‌کند و از طریق stdin/stdout با JSON-RPC صحبت می‌کند. هیچ سرور HTTP، نشانی Webhook، daemon پس‌زمینه، launch agent یا پورتی برای در معرض قرار دادن وجود ندارد.

- خواندن‌ها از `~/Library/Messages/chat.db` با استفاده از یک handle فقط‌خواندنی SQLite انجام می‌شوند.
- پیام‌های ورودی زنده از `imsg watch` / `watch.subscribe` می‌آیند، که رویدادهای فایل‌سیستم `chat.db` را با یک fallback مبتنی بر polling دنبال می‌کند.
- ارسال‌ها برای متن عادی و ارسال فایل از اتوماسیون Messages.app استفاده می‌کنند.
- کنش‌های پیشرفته از `imsg launch` برای تزریق ابزار کمکی `imsg` به Messages.app استفاده می‌کنند. همین مورد رسیدهای خواندن، نشانگرهای تایپ، ارسال‌های غنی، ویرایش، لغو ارسال، پاسخ رشته‌ای، tapbackها و مدیریت گروه را فعال می‌کند.
- بیلدهای Linux می‌توانند یک `chat.db` کپی‌شده را بررسی کنند، اما نمی‌توانند ارسال کنند، پایگاه‌داده زنده Mac را watch کنند، یا Messages.app را هدایت کنند. برای iMessage در OpenClaw، `imsg` را روی Mac واردشده به حساب اجرا کنید یا از طریق یک wrapper SSH به همان Mac.

## پیش از شروع

1. `imsg` را روی Macی که Messages.app را اجرا می‌کند نصب کنید:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   اگر `imsg chats` با `unable to open database file`، خروجی خالی، یا `authorization denied` شکست خورد، Full Disk Access را به ترمینال، ویرایشگر، فرایند Node، سرویس Gateway، یا فرایند والد SSH که `imsg` را اجرا می‌کند بدهید، سپس همان فرایند والد را دوباره باز کنید.

2. پیش از تغییر پیکربندی OpenClaw، سطح‌های خواندن، watch، ارسال و RPC را بررسی کنید:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` را با یک شناسه گفت‌وگوی واقعی از `imsg chats` جایگزین کنید. ارسال به مجوز Automation برای Messages.app نیاز دارد. اگر OpenClaw از طریق SSH اجرا خواهد شد، این فرمان‌ها را از طریق همان wrapper SSH یا زمینه کاربری‌ای اجرا کنید که OpenClaw استفاده خواهد کرد.

3. وقتی به کنش‌های پیشرفته نیاز دارید، پل API خصوصی را فعال کنید:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` نیاز دارد SIP غیرفعال باشد. ارسال پایه، تاریخچه و watch بدون `imsg launch` کار می‌کنند؛ کنش‌های پیشرفته کار نمی‌کنند.

4. پل را از طریق OpenClaw بررسی کنید:

   ```bash
   openclaw channels status --probe
   ```

   مقدار مطلوب `imessage.privateApi.available: true` است. اگر `false` گزارش می‌کند، ابتدا آن را برطرف کنید — [تشخیص قابلیت](/fa/channels/imessage#private-api-actions) را ببینید.

5. از پیکربندی خود snapshot بگیرید:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## ترجمه پیکربندی

iMessage و BlueBubbles مقدار زیادی از پیکربندی سطح کانال را به اشتراک می‌گذارند. کلیدهایی که تغییر می‌کنند بیشتر مربوط به transport هستند (سرور REST در برابر CLI محلی). کلیدهای رفتاری (`dmPolicy`, `groupPolicy`, `allowFrom` و غیره) همان معنی را حفظ می‌کنند.

| BlueBubbles                                                | iMessage همراه                            | یادداشت‌ها                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | همان معناشناسی.                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(حذف شده)_                               | سرور REST وجود ندارد — Plugin، `imsg rpc` را روی stdio اجرا می‌کند.                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.password`                            | _(حذف شده)_                               | احراز هویت webhook لازم نیست.                                                                                                                                                                                                                                                                                                                |
| _(ضمنی)_                                                   | `channels.imessage.cliPath`               | مسیر `imsg` (پیش‌فرض `imsg`)؛ برای SSH از یک اسکریپت پوششی استفاده کنید.                                                                                                                                                                                                                                                                     |
| _(ضمنی)_                                                   | `channels.imessage.dbPath`                | بازنویسی اختیاری `chat.db` مربوط به Messages.app؛ در صورت حذف، به‌صورت خودکار شناسایی می‌شود.                                                                                                                                                                                                                                               |
| _(ضمنی)_                                                   | `channels.imessage.remoteHost`            | `host` یا `user@host` — فقط وقتی لازم است که `cliPath` یک پوشش SSH باشد و بخواهید پیوست‌ها را با SCP دریافت کنید.                                                                                                                                                                                                                           |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | همان مقادیر (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | تأییدهای جفت‌سازی بر اساس handle منتقل می‌شوند، نه بر اساس token.                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | همان مقادیر (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | همان.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **این را عیناً کپی کنید، از جمله هر ورودی wildcard به شکل `groups: { "*": { ... } }`.** مقادیر هر گروه برای `requireMention`، `tools`، `toolsBySender` منتقل می‌شوند. با `groupPolicy: "allowlist"`، بلوک `groups` خالی یا موجود نبودن آن همه پیام‌های گروهی را بی‌صدا حذف می‌کند — پایین‌تر «لغزش‌گاه رجیستری گروه» را ببینید.          |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | پیش‌فرض `true`. با Plugin همراه، این فقط زمانی اجرا می‌شود که کاوش API خصوصی فعال باشد.                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | همان ساختار، **همان پیش‌فرض غیرفعال**. اگر پیوست‌ها در BlueBubbles جریان داشتند، باید این را صراحتاً در بلوک iMessage دوباره تنظیم کنید — به‌صورت ضمنی منتقل نمی‌شود، و عکس‌ها/رسانه‌های ورودی بدون هیچ خط گزارش `Inbound message` بی‌صدا حذف می‌شوند تا وقتی این کار را انجام دهید.                                                        |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ریشه‌های محلی؛ همان قواعد wildcard.                                                                                                                                                                                                                                                                                                         |
| _(نامرتبط)_                                                | `channels.imessage.remoteAttachmentRoots` | فقط وقتی استفاده می‌شود که `remoteHost` برای دریافت‌های SCP تنظیم شده باشد.                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | پیش‌فرض در iMessage برابر 16 MB است (پیش‌فرض BlueBubbles برابر 8 MB بود). اگر می‌خواهید سقف پایین‌تر را نگه دارید، صراحتاً تنظیم کنید.                                                                                                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | پیش‌فرض در هر دو 4000 است.                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | همان حالت opt-in. فقط برای DM — گفت‌وگوهای گروهی در هر دو کانال، ارسال فوری برای هر پیام را حفظ می‌کنند. وقتی بدون `messages.inbound.byChannel.imessage` صریح فعال شود، debounce ورودی پیش‌فرض را به 2500 ms افزایش می‌دهد. [مستندات iMessage § ادغام DMهای split-send](/fa/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) را ببینید. |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(نامرتبط)_                               | iMessage از قبل نام‌های نمایشی فرستنده را از `chat.db` می‌خواند.                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | سوییچ‌های هر اقدام: `reactions`، `edit`، `unsend`، `reply`، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، `sendAttachment`.                                                                                                                                                          |

پیکربندی‌های چندحسابی (`channels.bluebubbles.accounts.*`) به‌صورت یک‌به‌یک به `channels.imessage.accounts.*` ترجمه می‌شوند.

## لغزش‌گاه رجیستری گروه

Plugin همراه iMessage **دو** دروازه جداگانه allowlist گروه را پشت سر هم اجرا می‌کند. هر دو باید عبور کنند تا یک پیام گروهی به agent برسد:

1. **allowlist فرستنده / مقصد گفت‌وگو** (`channels.imessage.groupAllowFrom`) — توسط `isAllowedIMessageSender` بررسی می‌شود. پیام‌های ورودی را بر اساس handle فرستنده، `chat_guid`، `chat_identifier`، یا `chat_id` تطبیق می‌دهد. همان ساختار BlueBubbles.
2. **رجیستری گروه** (`channels.imessage.groups`) — توسط `resolveChannelGroupPolicy` از `inbound-processing.ts:199` بررسی می‌شود. با `groupPolicy: "allowlist"`، این دروازه یکی از این موارد را لازم دارد:
   - یک ورودی wildcard به شکل `groups: { "*": { ... } }` (مقدار `allowAll = true` را تنظیم می‌کند)، یا
   - یک ورودی صریح برای هر `chat_id` زیر `groups`.

اگر دروازه 1 عبور کند اما دروازه 2 رد شود، پیام حذف می‌شود. Plugin دو سیگنال در سطح `warn` منتشر می‌کند تا این موضوع دیگر در سطح گزارش پیش‌فرض بی‌صدا نباشد:

- یک `warn` یک‌باره هنگام راه‌اندازی برای هر حساب، وقتی `groupPolicy: "allowlist"` تنظیم شده اما `channels.imessage.groups` خالی است (بدون wildcard به شکل `"*"`، بدون ورودی‌های هر `chat_id`) — پیش از رسیدن هر پیام اجرا می‌شود.
- یک `warn` یک‌باره برای هر `chat_id` در اولین باری که یک گروه مشخص در زمان اجرا حذف می‌شود، با نام‌بردن از chat_id و کلید دقیقی که باید برای مجاز کردن آن به `groups` اضافه شود.

DMها همچنان کار می‌کنند چون از مسیر کد متفاوتی عبور می‌کنند.

این رایج‌ترین حالت شکست مهاجرت BlueBubbles ← iMessage همراه است: اپراتورها `groupAllowFrom` و `groupPolicy` را کپی می‌کنند اما بلوک `groups` را رد می‌کنند، چون `groups: { "*": { "requireMention": true } }` در BlueBubbles شبیه یک تنظیم نامرتبط برای mention به نظر می‌رسد. در واقع برای دروازه رجیستری حیاتی است.

حداقل پیکربندی برای ادامه جریان پیام‌های گروهی بعد از `groupPolicy: "allowlist"`:

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

`requireMention: true` زیر `*` وقتی الگوهای اشاره پیکربندی نشده‌اند بی‌ضرر است: زمان اجرا `canDetectMention = false` را تنظیم می‌کند و حذف اشاره را در `inbound-processing.ts:512` کوتاه‌مسیر می‌کند. با پیکربندی الگوهای اشاره (`agents.list[].groupChat.mentionPatterns`)، طبق انتظار کار می‌کند.

اگر گزارش‌های Gateway شامل `imessage: dropping group message from chat_id=<id>` یا خط راه‌اندازی `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` باشد، دروازهٔ ۲ در حال حذف است — بلوک `groups` را اضافه کنید.

## گام‌به‌گام

1. یک بلوک iMessage در کنار بلوک BlueBubbles موجود اضافه کنید. بلوک قدیمی را فقط تا زمانی نگه دارید که مسیر جدید تأیید شود:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **کاوش اجرای خشک** — Gateway را شروع کنید و تأیید کنید iMessage وضعیت سالم گزارش می‌دهد:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   چون `imessage.enabled` هنوز `false` است، هنوز هیچ ترافیک ورودی iMessage مسیریابی نمی‌شود — اما `--probe` پل را اجرا می‌کند تا پیش از جابه‌جایی، مشکلات مجوز یا نصب را پیدا کنید.

3. **جابه‌جایی را انجام دهید.** پیکربندی BlueBubbles را حذف کنید و iMessage را در یک ویرایش پیکربندی فعال کنید:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway را راه‌اندازی مجدد کنید. ترافیک ورودی iMessage اکنون از طریق Plugin همراه عبور می‌کند.

4. **پیام‌های مستقیم را تأیید کنید.** برای عامل یک پیام مستقیم بفرستید؛ تأیید کنید پاسخ می‌رسد.

5. **گروه‌ها را جداگانه تأیید کنید.** پیام‌های مستقیم و گروه‌ها مسیرهای کد متفاوتی دارند — موفقیت پیام مستقیم ثابت نمی‌کند گروه‌ها مسیریابی می‌شوند. در یک گفت‌وگوی گروهی جفت‌شده برای عامل پیام بفرستید و تأیید کنید پاسخ می‌رسد. اگر گروه ساکت شد (نه پاسخ عامل، نه خطا)، گزارش Gateway را برای `imessage: dropping group message from chat_id=<id>` یا خط راه‌اندازی `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` بررسی کنید — هر دو در سطح گزارش پیش‌فرض فعال می‌شوند. اگر هرکدام ظاهر شد، بلوک `groups` شما وجود ندارد یا خالی است — «اشکال پنهان رجیستری گروه» بالا را ببینید.

6. **سطح اقدام را تأیید کنید** — از یک پیام مستقیم جفت‌شده، از عامل بخواهید واکنش نشان دهد، ویرایش کند، ارسال را لغو کند، پاسخ دهد، عکس بفرستد، و (در یک گروه) نام گروه را تغییر دهد / شرکت‌کننده‌ای را اضافه یا حذف کند. هر اقدام باید به‌صورت بومی در Messages.app اعمال شود. اگر هرکدام خطای "iMessage `<action>` requires the imsg private API bridge" داد، دوباره `imsg launch` را اجرا کنید و `channels status --probe` را تازه‌سازی کنید.

7. **سرور و پیکربندی BlueBubbles را حذف کنید** وقتی پیام‌های مستقیم، گروه‌ها و اقدام‌های iMessage تأیید شدند. OpenClaw از `channels.bluebubbles` استفاده نخواهد کرد.

## برابری اقدام‌ها در یک نگاه

| اقدام                                                     | BlueBubbles قدیمی                  | iMessage همراه                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ارسال متن / جایگزین SMS                                   | ✅                                  | ✅                                                                                                                      |
| ارسال رسانه (عکس، ویدئو، فایل، صدا)                     | ✅                                  | ✅                                                                                                                      |
| پاسخ رشته‌ای (`reply_to_guid`)                           | ✅                                  | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) را می‌بندد)                                                 |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| ویرایش / لغو ارسال (گیرندگان macOS 13+)                       | ✅                                  | ✅                                                                                                                      |
| ارسال با جلوهٔ صفحه                                    | ✅                                  | ✅ (بخشی از [#9394](https://github.com/openclaw/openclaw/issues/9394) را می‌بندد)                                           |
| متن غنی ضخیم / کج / زیرخط‌دار / خط‌خورده        | ✅                                  | ✅ (قالب‌بندی typed-run از طریق attributedBody)                                                                            |
| تغییر نام گروه / تنظیم نماد گروه                              | ✅                                  | ✅                                                                                                                      |
| افزودن / حذف شرکت‌کننده، ترک گروه                      | ✅                                  | ✅                                                                                                                      |
| رسیدهای خواندن و نشانگر در حال تایپ                         | ✅                                  | ✅ (وابسته به کاوش API خصوصی)                                                                                         |
| یکی‌سازی پیام مستقیم از همان فرستنده                                  | ✅                                  | ✅ (فقط پیام مستقیم؛ با `channels.imessage.coalesceSameSenderDms` به‌صورت اختیاری فعال می‌شود)                                                      |
| جبران پیام‌های ورودی دریافت‌شده زمانی که Gateway خاموش بوده است | ✅ (بازپخش Webhook + واکشی تاریخچه) | ✅ (با `channels.imessage.catchup.enabled` به‌صورت اختیاری فعال می‌شود؛ [#78649](https://github.com/openclaw/openclaw/issues/78649) را می‌بندد) |

جبران iMessage اکنون به‌عنوان یک قابلیت اختیاری در Plugin همراه در دسترس است. هنگام راه‌اندازی Gateway، اگر `channels.imessage.catchup.enabled` برابر `true` باشد، Gateway یک گذر `chats.list` + `messages.history` برای هر گفت‌وگو را با همان کلاینت JSON-RPC استفاده‌شده توسط `imsg watch` اجرا می‌کند، هر ردیف ورودی ازدست‌رفته را از مسیر ارسال زنده (فهرست‌های مجاز، سیاست گروه، ضدپرش، کش پژواک) بازپخش می‌کند، و برای هر حساب یک نشانگر ماندگار می‌کند تا راه‌اندازی‌های بعدی از همان نقطه ادامه دهند. برای تنظیم، [جبران پس از خاموشی Gateway](/fa/channels/imessage#catching-up-after-gateway-downtime) را ببینید.

## جفت‌سازی، نشست‌ها، و اتصال‌های ACP

- **تأییدهای جفت‌سازی** بر اساس شناسه منتقل می‌شوند. لازم نیست فرستندگان شناخته‌شده را دوباره تأیید کنید — `channels.imessage.allowFrom` همان رشته‌های `+15555550123` / `user@example.com` را که BlueBubbles استفاده می‌کرد می‌شناسد.
- **نشست‌ها** برای هر عامل + گفت‌وگو جدا می‌مانند. پیام‌های مستقیم زیر `session.dmScope=main` پیش‌فرض در نشست اصلی عامل ادغام می‌شوند؛ نشست‌های گروه برای هر `chat_id` جدا می‌مانند. کلیدهای نشست متفاوت‌اند (`agent:<id>:imessage:group:<chat_id>` در برابر معادل BlueBubbles) — تاریخچهٔ گفت‌وگوی قدیمی زیر کلیدهای نشست BlueBubbles به نشست‌های iMessage منتقل نمی‌شود.
- **اتصال‌های ACP** که به `match.channel: "bluebubbles"` ارجاع می‌دهند باید به `"imessage"` به‌روزرسانی شوند. شکل‌های `match.peer.id` (`chat_id:`، `chat_guid:`، `chat_identifier:`، شناسهٔ ساده) یکسان هستند.

## بدون کانال بازگشت

هیچ زمان اجرای BlueBubbles پشتیبانی‌شده‌ای برای بازگشت وجود ندارد. اگر تأیید iMessage شکست خورد، `channels.imessage.enabled: false` را تنظیم کنید، Gateway را راه‌اندازی مجدد کنید، مانع `imsg` را رفع کنید، و جابه‌جایی را دوباره امتحان کنید.

کش پاسخ در `~/.openclaw/state/imessage/reply-cache.jsonl` قرار دارد (حالت `0600`، دایرکتوری والد `0700`). اگر یک شروع پاک می‌خواهید، حذف آن بی‌خطر است.

## مرتبط

- [iMessage](/fa/channels/imessage) — مرجع کامل کانال iMessage، شامل راه‌اندازی `imsg launch` و تشخیص قابلیت.
- `/channels/bluebubbles` — URL قدیمی که به این راهنمای مهاجرت هدایت می‌شود.
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی.
- [مسیریابی کانال](/fa/channels/channel-routing) — اینکه Gateway چگونه برای پاسخ‌های خروجی یک کانال انتخاب می‌کند.
