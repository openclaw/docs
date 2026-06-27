---
read_when:
    - برنامه‌ریزی برای مهاجرت از BlueBubbles به Plugin همراه iMessage
    - ترجمه کلیدهای پیکربندی BlueBubbles به معادل‌های iMessage
    - در حال تأیید imsg پیش از فعال‌سازی Plugin iMessage
summary: پیکربندی‌های قدیمی BlueBubbles را بدون از دست دادن جفت‌سازی، فهرست‌های مجاز یا اتصال‌های گروهی به Plugin همراه iMessage مهاجرت دهید.
title: مهاجرت از BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:10:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

افزونهٔ همراه `imessage` اکنون با هدایت [`steipete/imsg`](https://github.com/steipete/imsg) از طریق JSON-RPC به همان سطح API خصوصی BlueBubbles (`react`، `edit`، `unsend`، `reply`، `sendWithEffect`، مدیریت گروه، پیوست‌ها) دسترسی دارد. اگر از قبل یک Mac با `imsg` نصب‌شده اجرا می‌کنید، می‌توانید سرور BlueBubbles را کنار بگذارید و بگذارید افزونه مستقیماً با Messages.app صحبت کند.

پشتیبانی از BlueBubbles حذف شده است. OpenClaw از iMessage فقط از طریق `imsg` پشتیبانی می‌کند. این راهنما برای مهاجرت پیکربندی‌های قدیمی `channels.bluebubbles` به `channels.imessage` است؛ هیچ مسیر مهاجرت پشتیبانی‌شدهٔ دیگری وجود ندارد.

<Note>
برای اعلامیهٔ کوتاه و خلاصهٔ اپراتور، [حذف BlueBubbles و مسیر imsg برای iMessage](/fa/announcements/bluebubbles-imessage) را ببینید.
</Note>

## چک‌لیست مهاجرت

وقتی پیکربندی قدیمی BlueBubbles خود را از قبل می‌شناسید و کوتاه‌ترین مسیر امن را می‌خواهید، از این چک‌لیست استفاده کنید:

1. `imsg` را مستقیماً روی همان Mac که Messages.app را اجرا می‌کند تأیید کنید (`imsg chats`، `imsg history`، `imsg send` و `imsg rpc --help`).
2. کلیدهای رفتاری را از `channels.bluebubbles` به `channels.imessage` کپی کنید: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `includeAttachments`، `attachmentRoots`، `mediaMaxMb`، `textChunkLimit`، `coalesceSameSenderDms` و `actions`.
3. کلیدهای انتقالی را که دیگر وجود ندارند حذف کنید: `serverUrl`، `password`، URLهای وب‌هوک و راه‌اندازی سرور BlueBubbles.
4. اگر Gateway روی Mac مربوط به Messages اجرا نمی‌شود، `channels.imessage.cliPath` را روی یک wrapper مربوط به SSH تنظیم کنید و برای دریافت پیوست‌های راه‌دور، `remoteHost` را تنظیم کنید.
5. در حالی که Gateway متوقف است، `channels.imessage` را فعال کنید، سپس `openclaw channels status --probe --channel imessage` را اجرا کنید.
6. یک DM، یک گروه مجاز، پیوست‌ها در صورت فعال بودن، و هر اقدام API خصوصی‌ای را که انتظار دارید عامل استفاده کند آزمایش کنید.
7. پس از تأیید مسیر iMessage، سرور BlueBubbles و پیکربندی قدیمی `channels.bluebubbles` را حذف کنید.

## چه زمانی این مهاجرت منطقی است

- شما از قبل `imsg` را روی همان Mac (یا Macی که از طریق SSH در دسترس است) اجرا می‌کنید که Messages.app در آن وارد حساب شده است.
- یک جزء متحرک کمتر می‌خواهید — بدون سرور جداگانهٔ BlueBubbles، بدون endpoint مربوط به REST برای احراز هویت، بدون لوله‌کشی وب‌هوک. یک باینری CLI واحد به‌جای سرور + برنامهٔ کلاینت + ابزار کمکی.
- روی یک [macOS / ساخت `imsg` پشتیبانی‌شده](/fa/channels/imessage#requirements-and-permissions-macos) هستید که probe مربوط به API خصوصی مقدار `available: true` را گزارش می‌کند.

## imsg چه می‌کند

`imsg` یک CLI محلی macOS برای Messages است. OpenClaw، `imsg rpc` را به‌عنوان فرایند فرزند شروع می‌کند و از طریق stdin/stdout با JSON-RPC صحبت می‌کند. هیچ سرور HTTP، URL وب‌هوک، daemon پس‌زمینه، launch agent یا پورتی برای در معرض قرار دادن وجود ندارد.

- خواندن‌ها از `~/Library/Messages/chat.db` با استفاده از یک handle فقط‌خواندنی SQLite انجام می‌شوند.
- پیام‌های ورودی زنده از `imsg watch` / `watch.subscribe` می‌آیند، که رویدادهای فایل‌سیستم `chat.db` را با fallback مبتنی بر polling دنبال می‌کند.
- ارسال‌ها برای متن عادی و ارسال فایل از خودکارسازی Messages.app استفاده می‌کنند.
- اقدامات پیشرفته از `imsg launch` برای تزریق ابزار کمکی `imsg` به Messages.app استفاده می‌کنند. همین مورد رسید خواندن، نشانگرهای تایپ، ارسال‌های غنی، ویرایش، لغو ارسال، پاسخ رشته‌ای، tapbackها و مدیریت گروه را فعال می‌کند.
- ساخت‌های Linux می‌توانند یک `chat.db` کپی‌شده را بررسی کنند، اما نمی‌توانند ارسال کنند، پایگاه‌دادهٔ زندهٔ Mac را watch کنند، یا Messages.app را هدایت کنند. برای OpenClaw iMessage، `imsg` را روی Mac واردشده اجرا کنید یا از طریق یک wrapper مربوط به SSH به آن Mac وصل شوید.

## پیش از شروع

1. `imsg` را روی Macی نصب کنید که Messages.app را اجرا می‌کند:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   اگر `imsg chats` با `unable to open database file`، خروجی خالی، یا `authorization denied` شکست خورد، دسترسی کامل به دیسک را به ترمینال، ویرایشگر، فرایند Node، سرویس Gateway، یا فرایند والد SSH که `imsg` را اجرا می‌کند بدهید، سپس آن فرایند والد را دوباره باز کنید.

2. پیش از تغییر پیکربندی OpenClaw، سطوح خواندن، watch، ارسال و RPC را تأیید کنید:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` را با یک شناسهٔ چت واقعی از `imsg chats` جایگزین کنید. ارسال به مجوز Automation برای Messages.app نیاز دارد. اگر OpenClaw از طریق SSH اجرا خواهد شد، این فرمان‌ها را از همان wrapper مربوط به SSH یا زمینهٔ کاربری‌ای اجرا کنید که OpenClaw استفاده خواهد کرد. اگر خواندن‌ها/probeها کار می‌کنند اما ارسال‌ها با AppleEvents `-1743` شکست می‌خورند، بررسی کنید آیا Automation روی `/usr/libexec/sshd-keygen-wrapper` ثبت شده است یا نه؛ [ارسال‌های wrapper مربوط به SSH با AppleEvents -1743 شکست می‌خورند](/fa/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743) را ببینید.

3. وقتی به اقدامات پیشرفته نیاز دارید، پل API خصوصی را فعال کنید:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` نیاز دارد SIP غیرفعال باشد. ارسال پایه، تاریخچه و watch بدون `imsg launch` کار می‌کنند؛ اقدامات پیشرفته کار نمی‌کنند.

4. پس از افزودن یک پیکربندی فعال `channels.imessage`، پل را از طریق OpenClaw تأیید کنید:

   ```bash
   openclaw channels status --probe
   ```

   مقدار مطلوب شما `imessage.privateApi.available: true` است. اگر `false` گزارش شد، ابتدا همان را اصلاح کنید — [تشخیص قابلیت](/fa/channels/imessage#private-api-actions) را ببینید. `channels status --probe` فقط حساب‌های پیکربندی‌شده و فعال را probe می‌کند.

5. از پیکربندی خود snapshot بگیرید:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## ترجمهٔ پیکربندی

iMessage و BlueBubbles مقدار زیادی از پیکربندی سطح کانال را به اشتراک می‌گذارند. کلیدهایی که تغییر می‌کنند عمدتاً مربوط به انتقال هستند (سرور REST در برابر CLI محلی). کلیدهای رفتاری (`dmPolicy`، `groupPolicy`، `allowFrom` و غیره) همان معنا را حفظ می‌کنند.

| BlueBubbles                                                | iMessage همراه                          | یادداشت‌ها                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | همان معناشناسی.                                                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.serverUrl`                           | _(حذف‌شده)_                               | سرور REST وجود ندارد — این Plugin، `imsg rpc` را از طریق stdio اجرا می‌کند.                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(حذف‌شده)_                               | احراز هویت Webhook لازم نیست.                                                                                                                                                                                                                                                                                                                                                    |
| _(ضمنی)_                                               | `channels.imessage.cliPath`               | مسیر `imsg` (پیش‌فرض `imsg`)؛ برای SSH از یک اسکریپت wrapper استفاده کنید.                                                                                                                                                                                                                                                                                                                       |
| _(ضمنی)_                                               | `channels.imessage.dbPath`                | بازنویسی اختیاری `chat.db` مربوط به Messages.app؛ وقتی حذف شود، به‌صورت خودکار شناسایی می‌شود.                                                                                                                                                                                                                                                                                                                |
| _(ضمنی)_                                               | `channels.imessage.remoteHost`            | `host` یا `user@host` — فقط وقتی لازم است که `cliPath` یک wrapper برای SSH باشد و بخواهید پیوست‌ها را با SCP دریافت کنید.                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | همان مقادیر (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | تأییدهای جفت‌سازی بر اساس handle منتقل می‌شوند، نه بر اساس token.                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | همان مقادیر (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | همان.                                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **این را عیناً کپی کنید، از جمله هر ورودی wildcard به شکل `groups: { "*": { ... } }`.** موارد `requireMention`، `tools` و `toolsBySender` برای هر گروه منتقل می‌شوند. با `groupPolicy: "allowlist"`، یک بلوک `groups` خالی یا حذف‌شده همه پیام‌های گروه را بی‌سروصدا حذف می‌کند — پایین‌تر «دام رجیستری گروه» را ببینید.                                                                                       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | پیش‌فرض `true`. با Plugin همراه، این فقط وقتی فعال می‌شود که probe مربوط به API خصوصی بالا باشد.                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | همان شکل، **همان حالت پیش‌فرض خاموش**. اگر پیوست‌ها در BlueBubbles برای شما جریان داشتند، باید این را صراحتاً در بلوک iMessage دوباره تنظیم کنید — این مورد به‌صورت ضمنی منتقل نمی‌شود و عکس‌ها/رسانه‌های ورودی تا زمانی که این کار را انجام ندهید، بی‌سروصدا و بدون خط لاگ `Inbound message` حذف خواهند شد.                                                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ریشه‌های محلی؛ همان قواعد wildcard.                                                                                                                                                                                                                                                                                                                                                    |
| _(ناموجود)_                                                    | `channels.imessage.remoteAttachmentRoots` | فقط وقتی استفاده می‌شود که `remoteHost` برای دریافت‌های SCP تنظیم شده باشد.                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | پیش‌فرض در iMessage برابر 16 MB است (پیش‌فرض BlueBubbles برابر 8 MB بود). اگر می‌خواهید سقف پایین‌تر را نگه دارید، صراحتاً تنظیم کنید.                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | پیش‌فرض در هر دو 4000 است.                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | همان حالت opt-in. فقط برای DM — چت‌های گروهی در هر دو کانال ارسال فوری برای هر پیام را حفظ می‌کنند. وقتی بدون `messages.inbound.byChannel.imessage` صریح یا `messages.inbound.debounceMs` سراسری فعال شود، debounce ورودی پیش‌فرض را به 7000 ms افزایش می‌دهد. [مستندات iMessage § ادغام DMهای split-send](/fa/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) را ببینید. |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(ناموجود)_                                   | iMessage از قبل نام‌های نمایشی فرستنده را از `chat.db` می‌خواند.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | toggleهای هر action: `reactions`، `edit`، `unsend`، `reply`، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، `sendAttachment`.                                                                                                                                                                                                  |

پیکربندی‌های چندحسابی (`channels.bluebubbles.accounts.*`) به‌صورت یک‌به‌یک به `channels.imessage.accounts.*` ترجمه می‌شوند.

## دام رجیستری گروه

Plugin همراه iMessage **دو** دروازه allowlist گروه جداگانه را پشت‌سرهم اجرا می‌کند. برای اینکه پیام گروه به عامل برسد، هر دو باید عبور کنند:

1. **allowlist فرستنده / هدف چت** (`channels.imessage.groupAllowFrom`) — توسط `isAllowedIMessageSender` بررسی می‌شود. پیام‌های ورودی را بر اساس handle فرستنده، `chat_guid`، `chat_identifier` یا `chat_id` تطبیق می‌دهد. همان شکل BlueBubbles.
2. **رجیستری گروه** (`channels.imessage.groups`) — توسط `resolveChannelGroupPolicy` از `inbound-processing.ts:199` بررسی می‌شود. با `groupPolicy: "allowlist"`، این دروازه یکی از این موارد را لازم دارد:
   - یک ورودی wildcard به شکل `groups: { "*": { ... } }` (که `allowAll = true` را تنظیم می‌کند)، یا
   - یک ورودی صریح برای هر `chat_id` زیر `groups`.

اگر دروازه 1 عبور کند اما دروازه 2 شکست بخورد، پیام حذف می‌شود. Plugin دو سیگنال سطح `warn` منتشر می‌کند تا این وضعیت دیگر در سطح لاگ پیش‌فرض بی‌صدا نباشد:

- یک `warn` یک‌باره در زمان راه‌اندازی برای هر حساب، وقتی `groupPolicy: "allowlist"` تنظیم شده اما `channels.imessage.groups` خالی است (بدون wildcard `"*"` و بدون ورودی‌های هر `chat_id`) — پیش از رسیدن هر پیام اجرا می‌شود.
- یک `warn` یک‌باره برای هر `chat_id`، اولین باری که یک گروه مشخص در زمان اجرا حذف می‌شود، که chat_id و کلید دقیق لازم برای افزودن به `groups` جهت اجازه دادن به آن را نام می‌برد.

DMها همچنان کار می‌کنند، چون از یک مسیر کد متفاوت عبور می‌کنند.

این رایج‌ترین حالت شکست مهاجرت BlueBubbles → iMessage همراه است: اپراتورها `groupAllowFrom` و `groupPolicy` را کپی می‌کنند اما بلوک `groups` را جا می‌اندازند، چون `groups: { "*": { "requireMention": true } }` در BlueBubbles شبیه یک تنظیم نامرتبط برای منشن به نظر می‌رسد. در واقع این بخش برای گیت رجیستری حیاتی است.

حداقل پیکربندی برای ادامه یافتن جریان پیام‌های گروهی پس از `groupPolicy: "allowlist"`:

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

`requireMention: true` زیر `*` وقتی هیچ الگوی منشنی پیکربندی نشده باشد بی‌ضرر است: runtime مقدار `canDetectMention = false` را تنظیم می‌کند و حذف منشن را در `inbound-processing.ts:512` کوتاه‌مسیر می‌کند. با الگوهای منشن پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`)، طبق انتظار کار می‌کند.

اگر لاگ‌های gateway پیام `imessage: dropping group message from chat_id=<id>` یا خط راه‌اندازی `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` را نشان دهند، گیت ۲ در حال حذف است — بلوک `groups` را اضافه کنید.

## گام‌به‌گام

1. یک بلوک iMessage را کنار بلوک موجود BlueBubbles اضافه کنید. تا وقتی Gateway هنوز ترافیک BlueBubbles را مسیریابی می‌کند، آن را غیرفعال نگه دارید:

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

2. **قبل از مهم شدن ترافیک، Probe کنید** — Gateway را متوقف کنید، بلوک iMessage را موقتاً فعال کنید، و از CLI تأیید کنید که iMessage سالم گزارش می‌شود:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` فقط حساب‌های پیکربندی‌شده و فعال را Probe می‌کند. Gateway را در حالی که هم BlueBubbles و هم iMessage فعال‌اند دوباره راه‌اندازی نکنید، مگر اینکه عمداً بخواهید هر دو مانیتور کانال اجرا شوند. اگر فوراً در حال cut over نیستید، پیش از راه‌اندازی دوباره Gateway مقدار `channels.imessage.enabled` را به `false` برگردانید. برای اعتبارسنجی Mac پیش از فعال کردن ترافیک OpenClaw، از فرمان‌های مستقیم `imsg` در [پیش از شروع](#before-you-start) استفاده کنید.

3. **Cut over کنید.** وقتی حساب فعال iMessage سالم گزارش شد، پیکربندی BlueBubbles را حذف کنید و iMessage را فعال نگه دارید:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   gateway را دوباره راه‌اندازی کنید. ترافیک ورودی iMessage اکنون از Plugin همراه عبور می‌کند.

4. **DMها را تأیید کنید.** یک پیام مستقیم به agent بفرستید؛ تأیید کنید پاسخ می‌رسد.

5. **گروه‌ها را جداگانه تأیید کنید.** DMها و گروه‌ها از مسیرهای کد متفاوتی عبور می‌کنند — موفقیت DM ثابت نمی‌کند گروه‌ها مسیریابی می‌شوند. در یک چت گروهی pairشده، پیامی به agent بفرستید و تأیید کنید پاسخ می‌رسد. اگر گروه ساکت شد (نه پاسخی از agent، نه خطا)، لاگ gateway را برای `imessage: dropping group message from chat_id=<id>` یا خط راه‌اندازی `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` بررسی کنید — هر دو در سطح لاگ پیش‌فرض فعال می‌شوند. اگر هرکدام ظاهر شد، بلوک `groups` شما وجود ندارد یا خالی است — «دام رجیستری گروه» بالا را ببینید.

6. **سطح action را تأیید کنید** — از یک DM pairشده، از agent بخواهید واکنش نشان دهد، ویرایش کند، ارسال را لغو کند، پاسخ دهد، عکس بفرستد، و (در یک گروه) نام گروه را تغییر دهد / مشارکت‌کننده‌ای را اضافه یا حذف کند. هر action باید به‌صورت بومی در Messages.app اعمال شود. اگر هرکدام خطای "iMessage `<action>` requires the imsg private API bridge" داد، دوباره `imsg launch` را اجرا کنید و `channels status --probe` را تازه‌سازی کنید.

7. پس از تأیید DMها، گروه‌ها، و actionهای iMessage، سرور و پیکربندی BlueBubbles را حذف کنید. OpenClaw از `channels.bluebubbles` استفاده نخواهد کرد.

## برابری actionها در یک نگاه

| Action                                              | BlueBubbles قدیمی                  | iMessage همراه                                                              |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| ارسال متن / fallback به SMS                            | ✅                                  | ✅                                                                            |
| ارسال رسانه (عکس، ویدیو، فایل، صدا)              | ✅                                  | ✅                                                                            |
| پاسخ رشته‌ای (`reply_to_guid`)                    | ✅                                  | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) را می‌بندد)       |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| ویرایش / لغو ارسال (گیرندگان macOS 13+)                | ✅                                  | ✅                                                                            |
| ارسال با جلوه صفحه                             | ✅                                  | ✅ (بخشی از [#9394](https://github.com/openclaw/openclaw/issues/9394) را می‌بندد) |
| متن غنی پررنگ / مورب / زیرخط‌دار / خط‌خورده | ✅                                  | ✅ (قالب‌بندی typed-run از طریق attributedBody)                                  |
| تغییر نام گروه / تنظیم آیکن گروه                       | ✅                                  | ✅                                                                            |
| افزودن / حذف مشارکت‌کننده، ترک گروه               | ✅                                  | ✅                                                                            |
| رسید خوانده‌شدن و نشانگر تایپ                  | ✅                                  | ✅ (وابسته به private API probe)                                               |
| ادغام DMهای فرستنده یکسان                           | ✅                                  | ✅ (فقط DM؛ opt-in از طریق `channels.imessage.coalesceSameSenderDms`)            |
| بازیابی ورودی پس از راه‌اندازی مجدد                    | ✅ (بازپخش Webhook + دریافت تاریخچه) | ✅ (خودکار: بازپخش موارد ازدست‌رفته از طریق since_rowid + dedupe؛ پنجره گسترده‌تر روی local) |

iMessage پیام‌هایی را که هنگام خاموش بودن gateway از دست رفته‌اند بازیابی می‌کند: هنگام راه‌اندازی، از آخرین rowid ارسال‌شده از طریق `imsg watch.subscribe` و `since_rowid` بازپخش می‌کند و بر اساس GUID dedupe انجام می‌دهد، در حالی که یک حصار سنی برای backlog کهنه از «انفجار backlog» ناشی از Push-flush جلوگیری می‌کند. این کار روی اتصال RPC مربوط به `imsg` اجرا می‌شود، بنابراین برای setupهای SSH راه‌دور `cliPath` هم کار می‌کند؛ setupهای local پنجره بازیابی گسترده‌تری دارند چون می‌توانند `chat.db` را بخوانند. [بازیابی ورودی پس از راه‌اندازی مجدد bridge یا gateway](/fa/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart) را ببینید.

## Pairing، نشست‌ها، و bindingهای ACP

- **تأییدهای Pairing** بر اساس handle منتقل می‌شوند. نیازی نیست فرستندگان شناخته‌شده را دوباره تأیید کنید — `channels.imessage.allowFrom` همان رشته‌های `+15555550123` / `user@example.com` را که BlueBubbles استفاده می‌کرد می‌شناسد.
- **نشست‌ها** برای هر agent + چت محدود می‌مانند. DMها با مقدار پیش‌فرض `session.dmScope=main` در نشست اصلی agent ادغام می‌شوند؛ نشست‌های گروهی برای هر `chat_id` جدا می‌مانند. کلیدهای نشست متفاوت‌اند (`agent:<id>:imessage:group:<chat_id>` در برابر معادل BlueBubbles) — تاریخچه مکالمه قدیمی زیر کلیدهای نشست BlueBubbles به نشست‌های iMessage منتقل نمی‌شود.
- **bindingهای ACP** که به `match.channel: "bluebubbles"` اشاره می‌کنند باید به `"imessage"` به‌روزرسانی شوند. شکل‌های `match.peer.id` (`chat_id:`، `chat_guid:`، `chat_identifier:`، handle خام) یکسان‌اند.

## بدون کانال rollback

هیچ runtime پشتیبانی‌شده‌ای برای BlueBubbles وجود ندارد که بتوانید به آن برگردید. اگر تأیید iMessage شکست خورد، مقدار `channels.imessage.enabled: false` را تنظیم کنید، Gateway را دوباره راه‌اندازی کنید، مانع `imsg` را برطرف کنید، و cutover را دوباره امتحان کنید.

کش پاسخ در وضعیت SQLite Plugin زندگی می‌کند. `openclaw doctor --fix` در صورت وجود، sidecar قدیمی `imessage/reply-cache.jsonl` را import و archive می‌کند.

## مرتبط

- [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) — اعلامیه کوتاه و خلاصه اپراتور.
- [iMessage](/fa/channels/imessage) — مرجع کامل کانال iMessage، شامل setup با `imsg launch` و تشخیص قابلیت.
- `/channels/bluebubbles` — URL قدیمی که به این راهنمای مهاجرت redirect می‌شود.
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing.
- [مسیریابی کانال](/fa/channels/channel-routing) — اینکه gateway چگونه یک کانال را برای پاسخ‌های خروجی انتخاب می‌کند.
