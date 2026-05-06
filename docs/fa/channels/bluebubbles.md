---
read_when:
    - راه‌اندازی کانال BlueBubbles
    - عیب‌یابی جفت‌سازی Webhook
    - پیکربندی iMessage در macOS
sidebarTitle: BlueBubbles
summary: iMessage از طریق سرور macOS BlueBubbles (ارسال/دریافت REST، نشانگر تایپ، واکنش‌ها، جفت‌سازی، اقدامات پیشرفته).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-06T09:02:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2308a016826addc1098937d764b753ee08f3e86f39b0657c930a12b486793f
    source_path: channels/bluebubbles.md
    workflow: 16
---

وضعیت: Plugin همراه که از طریق HTTP با سرور BlueBubbles در macOS ارتباط برقرار می‌کند. **برای یکپارچه‌سازی iMessage توصیه می‌شود**، چون در مقایسه با کانال قدیمی imsg، API غنی‌تر و راه‌اندازی ساده‌تری دارد.

<Note>
نسخه‌های فعلی OpenClaw شامل BlueBubbles هستند، بنابراین بیلدهای بسته‌بندی‌شده معمولی به مرحله جداگانه `openclaw plugins install` نیاز ندارند.
</Note>

## نمای کلی

- روی macOS از طریق برنامه کمکی BlueBubbles اجرا می‌شود ([bluebubbles.app](https://bluebubbles.app)).
- توصیه‌شده/آزمایش‌شده: macOS Sequoia (15). macOS Tahoe (26) کار می‌کند؛ قابلیت ویرایش در حال حاضر روی Tahoe خراب است و به‌روزرسانی‌های آیکون گروه ممکن است موفقیت گزارش کنند اما همگام‌سازی نشوند.
- OpenClaw از طریق REST API آن با آن ارتباط برقرار می‌کند (`GET /api/v1/ping`، `POST /message/text`، `POST /chat/:id/*`).
- پیام‌های ورودی از طریق webhooks می‌رسند؛ پاسخ‌های خروجی، نشانگرهای تایپ، رسیدهای خواندن، و tapbackها فراخوانی‌های REST هستند.
- پیوست‌ها و استیکرها به‌عنوان رسانه ورودی دریافت می‌شوند (و در صورت امکان به agent ارائه می‌شوند).
- پاسخ‌های خودکار TTS که صدای MP3 یا CAF تولید می‌کنند، به‌جای پیوست فایل ساده، به‌صورت حباب‌های یادداشت صوتی iMessage تحویل داده می‌شوند.
- جفت‌سازی/فهرست مجاز مانند کانال‌های دیگر کار می‌کند (`/channels/pairing` و غیره) با `channels.bluebubbles.allowFrom` + کدهای جفت‌سازی.
- واکنش‌ها درست مثل Slack/Telegram به‌عنوان رویدادهای سیستمی ارائه می‌شوند تا agentها بتوانند پیش از پاسخ دادن آن‌ها را «mention» کنند.
- قابلیت‌های پیشرفته: ویرایش، لغو ارسال، رشته‌کردن پاسخ‌ها، جلوه‌های پیام، مدیریت گروه.

## شروع سریع

<Steps>
  <Step title="نصب BlueBubbles">
    سرور BlueBubbles را روی Mac خود نصب کنید (دستورالعمل‌ها را در [bluebubbles.app/install](https://bluebubbles.app/install) دنبال کنید).
  </Step>
  <Step title="فعال‌سازی web API">
    در پیکربندی BlueBubbles، web API را فعال کنید و یک گذرواژه تنظیم کنید.
  </Step>
  <Step title="پیکربندی OpenClaw">
    `openclaw onboard` را اجرا کنید و BlueBubbles را انتخاب کنید، یا به‌صورت دستی پیکربندی کنید:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="هدایت webhooks به gateway">
    webhooksهای BlueBubbles را به gateway خود هدایت کنید (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="راه‌اندازی gateway">
    gateway را راه‌اندازی کنید؛ handler وبهوک را ثبت می‌کند و جفت‌سازی را شروع می‌کند.
  </Step>
</Steps>

<Warning>
**امنیت**

- همیشه یک گذرواژه وبهوک تنظیم کنید.
- احراز هویت Webhook همیشه الزامی است. OpenClaw درخواست‌های وبهوک BlueBubbles را رد می‌کند مگر اینکه شامل password/guid مطابق با `channels.bluebubbles.password` باشند (برای مثال `?password=<password>` یا `x-password`)، صرف‌نظر از توپولوژی loopback/proxy.
- احراز هویت با گذرواژه پیش از خواندن/تجزیه کامل بدنه‌های وبهوک بررسی می‌شود.

</Warning>

## زنده نگه داشتن Messages.app (VM / راه‌اندازی‌های بدون نمایشگر)

برخی راه‌اندازی‌های macOS VM / همیشه‌روشن ممکن است باعث شوند Messages.app «idle» شود (رویدادهای ورودی تا زمانی که برنامه باز/foreground نشود متوقف می‌شوند). یک راه‌حل ساده این است که با استفاده از AppleScript + LaunchAgent، **هر 5 دقیقه Messages را poke کنید**.

<Steps>
  <Step title="ذخیره AppleScript">
    این را به‌عنوان `~/Scripts/poke-messages.scpt` ذخیره کنید:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="نصب LaunchAgent">
    این را به‌عنوان `~/Library/LaunchAgents/com.user.poke-messages.plist` ذخیره کنید:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    این **هر 300 ثانیه** و **هنگام ورود** اجرا می‌شود. اجرای اول ممکن است promptهای **Automation** در macOS را فعال کند (`osascript` → Messages). آن‌ها را در همان نشست کاربری که LaunchAgent را اجرا می‌کند تأیید کنید.

  </Step>
  <Step title="بارگذاری آن">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## راه‌اندازی اولیه

BlueBubbles در راه‌اندازی اولیه تعاملی در دسترس است:

```
openclaw onboard
```

جادوگر موارد زیر را می‌پرسد:

<ParamField path="Server URL" type="string" required>
  آدرس سرور BlueBubbles (مثلاً `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  گذرواژه API از تنظیمات BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  مسیر endpoint وبهوک.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`، `allowlist`، `open`، یا `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  شماره‌های تلفن، ایمیل‌ها، یا هدف‌های chat.
</ParamField>

همچنین می‌توانید BlueBubbles را از طریق CLI اضافه کنید:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## کنترل دسترسی (DMها + گروه‌ها)

<Tabs>
  <Tab title="DMها">
    - پیش‌فرض: `channels.bluebubbles.dmPolicy = "pairing"`.
    - فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از 1 ساعت منقضی می‌شوند).
    - تأیید از طریق:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - جفت‌سازی تبادل توکن پیش‌فرض است. جزئیات: [جفت‌سازی](/fa/channels/pairing)

  </Tab>
  <Tab title="گروه‌ها">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` کنترل می‌کند چه کسی می‌تواند در گروه‌ها زمانی که `allowlist` تنظیم شده است trigger کند.

  </Tab>
</Tabs>

### غنی‌سازی نام مخاطب (macOS، اختیاری)

وبهوک‌های گروهی BlueBubbles اغلب فقط آدرس‌های خام شرکت‌کنندگان را شامل می‌شوند. اگر می‌خواهید context مربوط به `GroupMembers` به‌جای آن نام‌های مخاطبان محلی را نشان دهد، می‌توانید در macOS غنی‌سازی محلی Contacts را فعال کنید:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` lookup را فعال می‌کند. پیش‌فرض: `false`.
- lookupها فقط پس از اینکه دسترسی گروه، مجوز فرمان، و gating مربوط به mention اجازه عبور پیام را داده باشند اجرا می‌شوند.
- فقط شرکت‌کنندگان تلفنی بدون نام غنی‌سازی می‌شوند.
- شماره‌های تلفن خام زمانی که تطبیق محلی پیدا نشود به‌عنوان fallback باقی می‌مانند.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### gating مربوط به mention (گروه‌ها)

BlueBubbles از gating مربوط به mention برای chatهای گروهی پشتیبانی می‌کند، مطابق با رفتار iMessage/WhatsApp:

- از `agents.list[].groupChat.mentionPatterns` (یا `messages.groupChat.mentionPatterns`) برای تشخیص mentionها استفاده می‌کند.
- وقتی `requireMention` برای یک گروه فعال باشد، agent فقط زمانی پاسخ می‌دهد که mention شده باشد.
- فرمان‌های کنترلی از فرستنده‌های مجاز از gating مربوط به mention عبور می‌کنند.

پیکربندی برای هر گروه:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### gating فرمان

- فرمان‌های کنترلی (مثلاً `/config`، `/model`) به مجوز نیاز دارند.
- از `allowFrom` و `groupAllowFrom` برای تعیین مجوز فرمان استفاده می‌کند.
- فرستنده‌های مجاز می‌توانند فرمان‌های کنترلی را حتی بدون mention کردن در گروه‌ها اجرا کنند.

### prompt سیستمی برای هر گروه

هر ورودی زیر `channels.bluebubbles.groups.*` یک رشته اختیاری `systemPrompt` را می‌پذیرد. مقدار در هر نوبتی که پیامی را در آن گروه پردازش می‌کند به prompt سیستمی agent تزریق می‌شود، بنابراین می‌توانید بدون ویرایش promptهای agent، persona یا قواعد رفتاری مخصوص هر گروه را تنظیم کنید:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

کلید با هر چیزی که BlueBubbles برای گروه به‌عنوان `chatGuid` / `chatIdentifier` / `chatId` عددی گزارش می‌کند مطابقت دارد، و یک ورودی wildcard با `"*"` برای هر گروهی که تطبیق دقیق ندارد یک پیش‌فرض فراهم می‌کند (همان الگویی که توسط `requireMention` و سیاست‌های ابزار برای هر گروه استفاده می‌شود). تطبیق‌های دقیق همیشه بر wildcard اولویت دارند. DMها این فیلد را نادیده می‌گیرند؛ به‌جای آن از سفارشی‌سازی prompt در سطح agent یا حساب استفاده کنید.

#### مثال عملی: پاسخ‌های رشته‌ای و واکنش‌های tapback (Private API)

با فعال بودن BlueBubbles Private API، پیام‌های ورودی با شناسه‌های کوتاه پیام می‌رسند (برای مثال `[[reply_to:5]]`) و agent می‌تواند `action=reply` را برای رشته‌کردن در یک پیام مشخص یا `action=react` را برای انداختن یک tapback فراخوانی کند. یک `systemPrompt` برای هر گروه راه مطمئنی برای نگه داشتن agent روی انتخاب ابزار درست است:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

واکنش‌های tapback و پاسخ‌های رشته‌ای هر دو به BlueBubbles Private API نیاز دارند؛ برای سازوکار زیربنایی، [اقدام‌های پیشرفته](#advanced-actions) و [شناسه‌های پیام](#message-ids-short-vs-full) را ببینید.

## اتصال‌های مکالمه ACP

chatهای BlueBubbles را می‌توان بدون تغییر لایه انتقال به workspaceهای بادوام ACP تبدیل کرد.

جریان سریع operator:

- `/acp spawn codex --bind here` را داخل DM یا chat گروهی مجاز اجرا کنید.
- پیام‌های آینده در همان مکالمه BlueBubbles به نشست ACP ایجادشده route می‌شوند.
- `/new` و `/reset` همان نشست ACP متصل را درجا reset می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده نیز از طریق ورودی‌های سطح‌بالای `bindings[]` با `type: "acp"` و `match.channel: "bluebubbles"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از هر فرم هدف پشتیبانی‌شده BlueBubbles استفاده کند:

- handle نرمال‌شده DM مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

برای اتصال‌های گروهی پایدار، `chat_id:*` یا `chat_identifier:*` را ترجیح دهید.

مثال:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

برای رفتار مشترک اتصال ACP، [Agentهای ACP](/fa/tools/acp-agents) را ببینید.

## تایپ + رسیدهای خواندن

- **نشانگرهای تایپ**: به‌صورت خودکار پیش از تولید پاسخ و در طول آن ارسال می‌شوند.
- **رسیدهای خواندن**: توسط `channels.bluebubbles.sendReadReceipts` کنترل می‌شوند (پیش‌فرض: `true`).
- **نشانگرهای تایپ**: OpenClaw رویدادهای شروع تایپ را ارسال می‌کند؛ BlueBubbles تایپ را به‌صورت خودکار هنگام ارسال یا timeout پاک می‌کند (توقف دستی از طریق DELETE قابل اتکا نیست).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## اقدام‌های پیشرفته

BlueBubbles وقتی در پیکربندی فعال شود، از اقدام‌های پیشرفتهٔ پیام پشتیبانی می‌کند:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: واکنش‌های tapback را اضافه/حذف کنید (`messageId`، `emoji`، `remove`). مجموعهٔ tapback بومی iMessage شامل `love`، `like`، `dislike`، `laugh`، `emphasize` و `question` است. وقتی یک عامل ایموجی‌ای خارج از آن مجموعه انتخاب کند (برای مثال `👀`)، ابزار واکنش به `love` برمی‌گردد تا tapback همچنان نمایش داده شود، به‌جای اینکه کل درخواست شکست بخورد. واکنش‌های تأیید پیکربندی‌شده همچنان سخت‌گیرانه اعتبارسنجی می‌شوند و برای مقدارهای ناشناخته خطا می‌دهند.
    - **edit**: یک پیام ارسال‌شده را ویرایش کنید (`messageId`، `text`).
    - **unsend**: یک پیام را پس بگیرید (`messageId`).
    - **reply**: به یک پیام مشخص پاسخ دهید (`messageId`، `text`، `to`).
    - **sendWithEffect**: با افکت iMessage ارسال کنید (`text`، `to`، `effectId`).
    - **renameGroup**: نام یک گفت‌وگوی گروهی را تغییر دهید (`chatGuid`، `displayName`).
    - **setGroupIcon**: نماد/عکس یک گفت‌وگوی گروهی را تنظیم کنید (`chatGuid`، `media`) - روی macOS 26 Tahoe ناپایدار است (ممکن است API موفقیت برگرداند، اما نماد همگام‌سازی نشود).
    - **addParticipant**: کسی را به یک گروه اضافه کنید (`chatGuid`، `address`).
    - **removeParticipant**: کسی را از یک گروه حذف کنید (`chatGuid`، `address`).
    - **leaveGroup**: یک گفت‌وگوی گروهی را ترک کنید (`chatGuid`).
    - **upload-file**: رسانه/فایل‌ها را ارسال کنید (`to`، `buffer`، `filename`، `asVoice`).
      - یادداشت‌های صوتی: برای ارسال به‌عنوان پیام صوتی iMessage، `asVoice: true` را همراه با صدای **MP3** یا **CAF** تنظیم کنید. BlueBubbles هنگام ارسال یادداشت‌های صوتی، MP3 → CAF را تبدیل می‌کند.
    - نام مستعار قدیمی: `sendAttachment` همچنان کار می‌کند، اما `upload-file` نام متعارف اقدام است.

  </Accordion>
</AccordionGroup>

### شناسه‌های پیام (کوتاه در برابر کامل)

OpenClaw ممکن است برای صرفه‌جویی در توکن‌ها، شناسه‌های پیام _کوتاه_ (مانند `1`، `2`) را نمایش دهد.

- `MessageSid` / `ReplyToId` می‌توانند شناسه‌های کوتاه باشند.
- `MessageSidFull` / `ReplyToIdFull` شامل شناسه‌های کامل ارائه‌دهنده هستند.
- شناسه‌های کوتاه در حافظه نگه داشته می‌شوند؛ ممکن است پس از راه‌اندازی دوباره یا حذف از کش منقضی شوند.
- اقدام‌ها `messageId` کوتاه یا کامل را می‌پذیرند، اما اگر شناسه‌های کوتاه دیگر در دسترس نباشند خطا می‌دهند.

برای خودکارسازی‌ها و ذخیره‌سازی پایدار از شناسه‌های کامل استفاده کنید:

- الگوها: `{{MessageSidFull}}`، `{{ReplyToIdFull}}`
- زمینه: `MessageSidFull` / `ReplyToIdFull` در بارهای ورودی

برای متغیرهای الگو، [پیکربندی](/fa/gateway/configuration) را ببینید.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## یکی‌سازی پیام‌های مستقیم split-send (دستور + URL در یک ترکیب)

وقتی کاربر در iMessage یک دستور و یک URL را با هم تایپ می‌کند - مثلاً `Dump https://example.com/article` - Apple ارسال را به **دو تحویل Webhook جداگانه** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک بالون پیش‌نمایش URL (`"https://..."`) با تصاویر پیش‌نمایش OG به‌عنوان پیوست.

در بیشتر تنظیمات، این دو Webhook با فاصلهٔ حدود 0.8 تا 2.0 ثانیه به OpenClaw می‌رسند. بدون یکی‌سازی، عامل در نوبت 1 فقط دستور را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست»)، و URL را فقط در نوبت 2 می‌بیند - در این مرحله زمینهٔ دستور از قبل از دست رفته است.

`channels.bluebubbles.coalesceSameSenderDms` یک پیام مستقیم را برای ادغام Webhookهای پیاپی از همان فرستنده در یک نوبت عامل فعال می‌کند. گفت‌وگوهای گروهی همچنان بر اساس هر پیام کلیدگذاری می‌شوند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="When to enable">
    زمانی فعال کنید که:

    - Skills شما انتظار دارند `command + payload` در یک پیام باشد (dump، paste، save، queue و غیره).
    - کاربران شما URLها، تصاویر یا محتوای طولانی را همراه با دستورها جای‌گذاری می‌کنند.
    - می‌توانید تأخیر اضافه‌شده به نوبت پیام مستقیم را بپذیرید (پایین را ببینید).

    زمانی غیرفعال بگذارید که:

    - برای تریگرهای پیام مستقیم تک‌کلمه‌ای، به کمترین تأخیر دستور نیاز دارید.
    - همهٔ جریان‌های شما دستورهای یک‌مرحله‌ای بدون پیگیری بار هستند.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    با روشن بودن این پرچم و بدون `messages.inbound.byChannel.bluebubbles` صریح، پنجرهٔ debounce به **2500 ms** گسترش می‌یابد (پیش‌فرض حالت بدون یکی‌سازی 500 ms است). این پنجرهٔ بزرگ‌تر لازم است - آهنگ split-send شرکت Apple با فاصلهٔ 0.8 تا 2.0 ثانیه در پیش‌فرض تنگ‌تر جا نمی‌شود.

    برای تنظیم دستی پنجره:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **تأخیر اضافه برای دستورهای کنترلی پیام مستقیم.** با روشن بودن این پرچم، پیام‌های دستور کنترلی پیام مستقیم (مانند `Dump`، `Save` و غیره) اکنون پیش از ارسال، تا سقف پنجرهٔ debounce منتظر می‌مانند تا در صورت آمدن Webhook بار، آن را دریافت کنند. دستورهای گفت‌وگوی گروهی همچنان فوراً ارسال می‌شوند.
    - **خروجی ادغام‌شده محدود است** - متن ادغام‌شده با نشانگر صریح `…[truncated]` به 4000 نویسه محدود می‌شود؛ پیوست‌ها به 20 محدود می‌شوند؛ ورودی‌های منبع به 10 محدود می‌شوند (اولین و تازه‌ترین مورد پس از آن حفظ می‌شوند). هر `messageId` منبع همچنان به حذف تکراری ورودی می‌رسد، بنابراین بازپخش بعدی هر رویداد جداگانه توسط MessagePoller به‌عنوان تکراری تشخیص داده می‌شود.
    - **اختیاری و مخصوص هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تأثیر قرار نمی‌گیرند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

| آنچه کاربر می‌سازد                                                | آنچه Apple تحویل می‌دهد  | پرچم خاموش (پیش‌فرض)                  | پرچم روشن + پنجرهٔ 2500 ms                                             |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | 2 Webhook با فاصلهٔ حدود 1 s | دو نوبت عامل: فقط "Dump"، سپس URL | یک نوبت: متن ادغام‌شدهٔ `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (پیوست + متن)                | 2 Webhook                | دو نوبت                               | یک نوبت: متن + تصویر                                                  |
| `/status` (دستور مستقل)                                     | 1 Webhook                 | ارسال فوری                        | **تا سقف پنجره منتظر می‌ماند، سپس ارسال می‌کند**                                    |
| URL به‌تنهایی جای‌گذاری شده                                                   | 1 Webhook                 | ارسال فوری                        | ارسال فوری (فقط یک ورودی در bucket)                             |
| متن + URL به‌صورت دو پیام جداگانهٔ عمدی، با فاصلهٔ چند دقیقه | 2 Webhook خارج از پنجره | دو نوبت                               | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                 |
| سیل سریع (>10 پیام مستقیم کوچک داخل پنجره)                          | N Webhook                | N نوبت                                 | یک نوبت، خروجی محدود (اولین + تازه‌ترین، سقف‌های متن/پیوست اعمال می‌شوند) |

### عیب‌یابی یکی‌سازی split-send

اگر پرچم روشن است و split-sendها همچنان به‌صورت دو نوبت می‌رسند، هر لایه را بررسی کنید:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    سپس `openclaw gateway restart` - پرچم هنگام ایجاد رجیستری debouncer خوانده می‌شود.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    به گزارش سرور BlueBubbles در `~/Library/Logs/bluebubbles-server/main.log` نگاه کنید:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    فاصلهٔ بین ارسال متن از نوع `"Dump"` و ارسال بعدی `"https://..."; Attachments:` را اندازه بگیرید. `messages.inbound.byChannel.bluebubbles` را آن‌قدر افزایش دهید که با حاشیهٔ کافی این فاصله را پوشش دهد.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    مهرهای زمانی رویداد نشست (`~/.openclaw/agents/<id>/sessions/*.jsonl`) نشان می‌دهند Gateway چه زمانی پیام را به عامل تحویل می‌دهد، **نه** اینکه Webhook چه زمانی رسیده است. پیام دوم صف‌شده با برچسب `[Queued messages while agent was busy]` یعنی نوبت اول هنگام رسیدن Webhook دوم هنوز در حال اجرا بوده است - bucket یکی‌سازی از قبل تخلیه شده بود. پنجره را بر اساس گزارش سرور BB تنظیم کنید، نه گزارش نشست.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    روی ماشین‌های کوچک‌تر (8 GB)، نوبت‌های عامل ممکن است آن‌قدر طول بکشند که bucket یکی‌سازی پیش از کامل شدن پاسخ تخلیه شود و URL به‌عنوان نوبت دوم صف‌شده وارد شود. `memory_pressure` و `ps -o rss -p $(pgrep openclaw-gateway)` را بررسی کنید؛ اگر Gateway بیش از حدود 500 MB RSS مصرف می‌کند و فشرده‌ساز فعال است، فرایندهای سنگین دیگر را ببندید یا به میزبانی بزرگ‌تر ارتقا دهید.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    اگر کاربر روی `Dump` به‌عنوان **پاسخ** به یک بالون URL موجود زده باشد (iMessage روی حباب Dump نشان «1 Reply» را نمایش می‌دهد)، URL در `replyToBody` قرار دارد، نه در Webhook دوم. یکی‌سازی اعمال نمی‌شود - این موضوع به skill/پرامپت مربوط است، نه debouncer.
  </Accordion>
</AccordionGroup>

## استریم بلوکی

کنترل کنید پاسخ‌ها به‌صورت یک پیام واحد ارسال شوند یا در بلوک‌ها استریم شوند:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## رسانه + محدودیت‌ها

- پیوست‌های ورودی دانلود شده و در کش رسانه ذخیره می‌شوند.
- سقف رسانه از طریق `channels.bluebubbles.mediaMaxMb` برای رسانهٔ ورودی و خروجی تنظیم می‌شود (پیش‌فرض: 8 MB).
- متن خروجی تا `channels.bluebubbles.textChunkLimit` بخش‌بندی می‌شود (پیش‌فرض: 4000 نویسه).

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: کانال را فعال/غیرفعال کنید.
    - `channels.bluebubbles.serverUrl`: URL پایهٔ BlueBubbles REST API.
    - `channels.bluebubbles.password`: رمز عبور API.
    - `channels.bluebubbles.webhookPath`: مسیر endpoint مربوط به Webhook (پیش‌فرض: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist پیام مستقیم (شناسه‌ها، ایمیل‌ها، شماره‌های E.164، `chat_id:*`، `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist فرستندهٔ گروه.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: در macOS، در صورت تمایل، پس از عبور از gating، شرکت‌کنندگان گروه بدون نام را از Contacts محلی غنی‌سازی کنید. پیش‌فرض: `false`.
    - `channels.bluebubbles.groups`: پیکربندی برای هر گروه (`requireMention` و غیره).

  </Accordion>
  <Accordion title="تحویل و بخش‌بندی">
    - `channels.bluebubbles.sendReadReceipts`: ارسال رسیدهای خواندن (پیش‌فرض: `true`).
    - `channels.bluebubbles.blockStreaming`: فعال‌سازی استریمینگ بلوکی (پیش‌فرض: `false`؛ برای پاسخ‌های استریمینگ لازم است).
    - `channels.bluebubbles.textChunkLimit`: اندازه بخش خروجی بر حسب نویسه (پیش‌فرض: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلت زمانی هر درخواست بر حسب میلی‌ثانیه برای ارسال متن خروجی از طریق `/api/v1/message/text` (پیش‌فرض: 30000). در راه‌اندازی‌های macOS 26 که ارسال‌های iMessage با Private API ممکن است داخل چارچوب iMessage بیش از ۶۰ ثانیه متوقف بمانند، مقدار را افزایش دهید؛ برای مثال `45000` یا `60000`. کاوش‌ها، جست‌وجوهای چت، واکنش‌ها، ویرایش‌ها، و بررسی‌های سلامت فعلاً پیش‌فرض کوتاه‌تر ۱۰ ثانیه‌ای را نگه می‌دارند؛ گسترش پوشش به واکنش‌ها و ویرایش‌ها به‌عنوان پیگیری بعدی برنامه‌ریزی شده است. بازنویسی در سطح حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (پیش‌فرض) فقط هنگام عبور از `textChunkLimit` بخش‌بندی می‌کند؛ `newline` پیش از بخش‌بندی بر اساس طول، روی خطوط خالی (مرزهای پاراگراف) تقسیم می‌کند.

  </Accordion>
  <Accordion title="رسانه و تاریخچه">
    - `channels.bluebubbles.mediaMaxMb`: سقف رسانه ورودی/خروجی بر حسب MB (پیش‌فرض: 8).
    - `channels.bluebubbles.mediaLocalRoots`: فهرست مجاز صریحی از پوشه‌های محلی مطلق که برای مسیرهای رسانه محلی خروجی مجاز هستند. ارسال مسیر محلی به‌طور پیش‌فرض رد می‌شود مگر اینکه این مورد پیکربندی شده باشد. بازنویسی در سطح حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Webhookهای DM پیاپی از یک فرستنده را در یک نوبت عامل ادغام می‌کند تا ارسال جداگانه متن+URL توسط Apple به‌صورت یک پیام واحد برسد (پیش‌فرض: `false`). برای سناریوها، تنظیم پنجره، و بده‌بستان‌ها، [ادغام DMهای ارسال جداشده](#coalescing-split-send-dms-command--url-in-one-composition) را ببینید. وقتی بدون `messages.inbound.byChannel.bluebubbles` صریح فعال شود، پنجره پیش‌فرض کاهش نوسان ورودی را از 500 ms به 2500 ms گسترش می‌دهد.
    - `channels.bluebubbles.historyLimit`: حداکثر پیام‌های گروه برای زمینه (0 غیرفعال می‌کند).
    - `channels.bluebubbles.dmHistoryLimit`: حد تاریخچه DM.
    - `channels.bluebubbles.replyContextApiFallback`: وقتی یک پاسخ ورودی بدون `replyToBody`/`replyToSender` برسد و کش زمینه پاسخ در حافظه هم پیدا نشود، پیام اصلی را از BlueBubbles HTTP API به‌عنوان fallback با بهترین تلاش دریافت می‌کند (پیش‌فرض: `false`). برای استقرارهای چندنمونه‌ای که یک حساب BlueBubbles را به اشتراک می‌گذارند، پس از راه‌اندازی دوباره فرایند، یا پس از تخلیه کش TTL/LRU طولانی‌عمر مفید است. این دریافت با همان سیاست هر درخواست دیگر کلاینت BlueBubbles در برابر SSRF محافظت می‌شود، هرگز خطا پرتاب نمی‌کند، و کش را پر می‌کند تا پاسخ‌های بعدی هزینه را سرشکن کنند. بازنویسی در سطح حساب: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. تنظیم در سطح کانال به حساب‌هایی که این پرچم را حذف کرده‌اند منتقل می‌شود.

  </Accordion>
  <Accordion title="کنش‌ها و حساب‌ها">
    - `channels.bluebubbles.actions`: فعال/غیرفعال کردن کنش‌های خاص.
    - `channels.bluebubbles.accounts`: پیکربندی چندحسابی.

  </Accordion>
</AccordionGroup>

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (یا `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## نشانی‌دهی / مقصدهای تحویل

برای مسیریابی پایدار، `chat_guid` را ترجیح دهید:

- `chat_guid:iMessage;-;+15555550123` (ترجیحی برای گروه‌ها)
- `chat_id:123`
- `chat_identifier:...`
- هندل‌های مستقیم: `+15555550123`، `user@example.com`
  - اگر یک هندل مستقیم چت DM موجود نداشته باشد، OpenClaw از طریق `POST /api/v1/chat/new` یکی ایجاد می‌کند. این کار نیاز دارد Private API مربوط به BlueBubbles فعال باشد.

### مسیریابی iMessage در برابر SMS

وقتی همان هندل روی Mac هم چت iMessage و هم چت SMS دارد (برای مثال شماره تلفنی که در iMessage ثبت شده اما fallbackهای حباب سبز را هم دریافت کرده است)، OpenClaw چت iMessage را ترجیح می‌دهد و هرگز بی‌صدا به SMS تنزل نمی‌دهد. برای اجبار به استفاده از چت SMS، از پیشوند هدف صریح `sms:` استفاده کنید (برای مثال `sms:+15555550123`). هندل‌هایی که چت iMessage مطابق ندارند همچنان از هر چتی که BlueBubbles گزارش می‌دهد ارسال می‌شوند.

## امنیت

- درخواست‌های Webhook با مقایسه پارامترهای پرس‌وجو یا سرآیندهای `guid`/`password` با `channels.bluebubbles.password` احراز هویت می‌شوند.
- گذرواژه API و نقطه پایانی Webhook را محرمانه نگه دارید (با آن‌ها مانند اعتبارنامه رفتار کنید).
- برای احراز هویت Webhookهای BlueBubbles هیچ میان‌بری برای localhost وجود ندارد. اگر ترافیک Webhook را پراکسی می‌کنید، گذرواژه BlueBubbles را در کل مسیر درخواست نگه دارید. `gateway.trustedProxies` در اینجا جایگزین `channels.bluebubbles.password` نمی‌شود. [امنیت Gateway](/fa/gateway/security#reverse-proxy-configuration) را ببینید.
- اگر سرور BlueBubbles را بیرون از LAN خود در دسترس قرار می‌دهید، HTTPS و قواعد firewall را فعال کنید.

## عیب‌یابی

- اگر رویدادهای تایپ/خواندن از کار افتادند، لاگ‌های Webhook مربوط به BlueBubbles را بررسی کنید و مطمئن شوید مسیر Gateway با `channels.bluebubbles.webhookPath` مطابقت دارد.
- کدهای جفت‌سازی پس از یک ساعت منقضی می‌شوند؛ از `openclaw pairing list bluebubbles` و `openclaw pairing approve bluebubbles <code>` استفاده کنید.
- واکنش‌ها به API خصوصی BlueBubbles نیاز دارند (`POST /api/v1/message/react`)؛ مطمئن شوید نسخه سرور آن را ارائه می‌کند.
- ویرایش/لغو ارسال به macOS 13+ و نسخه سازگار سرور BlueBubbles نیاز دارد. در macOS 26 (Tahoe)، ویرایش در حال حاضر به‌دلیل تغییرات API خصوصی خراب است.
- به‌روزرسانی‌های آیکون گروه می‌توانند در macOS 26 (Tahoe) ناپایدار باشند: API ممکن است موفقیت برگرداند اما آیکون جدید همگام‌سازی نشود.
- OpenClaw بر اساس نسخه macOS سرور BlueBubbles، کنش‌های شناخته‌شده خراب را به‌طور خودکار پنهان می‌کند. اگر ویرایش همچنان در macOS 26 (Tahoe) ظاهر می‌شود، آن را با `channels.bluebubbles.actions.edit=false` به‌صورت دستی غیرفعال کنید.
- `coalesceSameSenderDms` فعال است اما ارسال‌های جداشده (مثلاً `Dump` + URL) همچنان به‌صورت دو نوبت می‌رسند: چک‌لیست [عیب‌یابی ادغام ارسال جداشده](#split-send-coalescing-troubleshooting) را ببینید - علت‌های رایج شامل پنجره کاهش نوسان بیش از حد تنگ، تفسیر اشتباه مُهرهای زمانی لاگ جلسه به‌عنوان زمان ورود Webhook، یا ارسال نقل‌قول پاسخ است (که از `replyToBody` استفاده می‌کند، نه Webhook دوم).
- برای اطلاعات وضعیت/سلامت: `openclaw status --all` یا `openclaw status --deep`.

برای مرجع کلی گردش‌کار کانال، [کانال‌ها](/fa/channels) و راهنمای [Plugins](/fa/tools/plugin) را ببینید.

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی جلسه برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و دروازه‌گذاری منشن
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت DM و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
