---
read_when:
    - راه‌اندازی کانال BlueBubbles
    - عیب‌یابی جفت‌سازی Webhook
    - پیکربندی iMessage در macOS
sidebarTitle: BlueBubbles
summary: iMessage از طریق سرور macOS BlueBubbles (ارسال/دریافت REST، وضعیت تایپ، واکنش‌ها، جفت‌سازی، اقدامات پیشرفته).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-29T22:24:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

وضعیت: Plugin همراه که از طریق HTTP با سرور BlueBubbles macOS ارتباط برقرار می‌کند. **برای یکپارچه‌سازی iMessage توصیه می‌شود** چون در مقایسه با کانال قدیمی imsg، API غنی‌تر و راه‌اندازی آسان‌تری دارد.

<Note>
نسخه‌های فعلی OpenClaw، BlueBubbles را همراه خود دارند، بنابراین buildهای بسته‌بندی‌شده عادی به مرحله جداگانه `openclaw plugins install` نیاز ندارند.
</Note>

## نمای کلی

- از طریق برنامه کمکی BlueBubbles روی macOS اجرا می‌شود ([bluebubbles.app](https://bluebubbles.app)).
- توصیه‌شده/آزمایش‌شده: macOS Sequoia (15). macOS Tahoe (26) کار می‌کند؛ ویرایش در حال حاضر روی Tahoe خراب است، و به‌روزرسانی‌های نماد گروه ممکن است موفقیت گزارش کنند اما همگام نشوند.
- OpenClaw از طریق REST API آن با آن ارتباط برقرار می‌کند (`GET /api/v1/ping`، `POST /message/text`، `POST /chat/:id/*`).
- پیام‌های ورودی از طریق webhooks می‌رسند؛ پاسخ‌های خروجی، نشانگرهای تایپ، رسیدهای خوانده‌شدن، و tapbackها فراخوانی‌های REST هستند.
- پیوست‌ها و استیکرها به‌عنوان رسانه ورودی دریافت می‌شوند (و در صورت امکان به عامل نمایش داده می‌شوند).
- پاسخ‌های Auto-TTS که صدای MP3 یا CAF تولید می‌کنند، به‌جای پیوست فایل ساده، به‌صورت حباب‌های یادداشت صوتی iMessage تحویل داده می‌شوند.
- جفت‌سازی/فهرست مجاز همانند کانال‌های دیگر کار می‌کند (`/channels/pairing` و غیره) با `channels.bluebubbles.allowFrom` + کدهای جفت‌سازی.
- واکنش‌ها درست مانند Slack/Telegram به‌عنوان رویدادهای سیستم نمایش داده می‌شوند تا عامل‌ها بتوانند پیش از پاسخ‌دادن آن‌ها را «ذکر» کنند.
- قابلیت‌های پیشرفته: ویرایش، لغو ارسال، رشته‌بندی پاسخ‌ها، جلوه‌های پیام، مدیریت گروه.

## شروع سریع

<Steps>
  <Step title="Install BlueBubbles">
    سرور BlueBubbles را روی Mac خود نصب کنید (دستورالعمل‌ها را در [bluebubbles.app/install](https://bluebubbles.app/install) دنبال کنید).
  </Step>
  <Step title="Enable the web API">
    در پیکربندی BlueBubbles، web API را فعال کنید و یک رمز عبور تنظیم کنید.
  </Step>
  <Step title="Configure OpenClaw">
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
  <Step title="Point webhooks at the gateway">
    webhooksهای BlueBubbles را به gateway خود اشاره دهید (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    gateway را شروع کنید؛ handler مربوط به webhook را ثبت می‌کند و جفت‌سازی را آغاز می‌کند.
  </Step>
</Steps>

<Warning>
**امنیت**

- همیشه یک رمز عبور webhook تنظیم کنید.
- احراز هویت Webhook همیشه الزامی است. OpenClaw درخواست‌های webhook مربوط به BlueBubbles را رد می‌کند مگر اینکه شامل password/guid مطابق با `channels.bluebubbles.password` باشند (برای مثال `?password=<password>` یا `x-password`)، صرف‌نظر از توپولوژی loopback/proxy.
- احراز هویت رمز عبور پیش از خواندن/تجزیه کامل بدنه‌های webhook بررسی می‌شود.

</Warning>

## زنده نگه‌داشتن Messages.app (راه‌اندازی‌های VM / بدون نمایشگر)

برخی راه‌اندازی‌های VM macOS / همیشه‌روشن ممکن است باعث شوند Messages.app «idle» شود (رویدادهای ورودی متوقف می‌شوند تا زمانی که برنامه باز/foreground شود). یک راه‌حل ساده این است که با استفاده از AppleScript + LaunchAgent، **هر ۵ دقیقه Messages را تحریک کنید**.

<Steps>
  <Step title="Save the AppleScript">
    این را با نام `~/Scripts/poke-messages.scpt` ذخیره کنید:

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
  <Step title="Install a LaunchAgent">
    این را با نام `~/Library/LaunchAgents/com.user.poke-messages.plist` ذخیره کنید:

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

    این کار **هر ۳۰۰ ثانیه** و **هنگام ورود** اجرا می‌شود. اجرای اول ممکن است اعلان‌های **Automation** در macOS را فعال کند (`osascript` → Messages). آن‌ها را در همان نشست کاربری که LaunchAgent را اجرا می‌کند تأیید کنید.

  </Step>
  <Step title="Load it">
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

ویزارد این موارد را درخواست می‌کند:

<ParamField path="Server URL" type="string" required>
  نشانی سرور BlueBubbles (مثلاً `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  رمز عبور API از تنظیمات BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  مسیر نقطه پایانی Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`، `allowlist`، `open`، یا `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  شماره تلفن‌ها، ایمیل‌ها، یا هدف‌های گفتگو.
</ParamField>

همچنین می‌توانید BlueBubbles را از طریق CLI اضافه کنید:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## کنترل دسترسی (DMها + گروه‌ها)

<Tabs>
  <Tab title="DMs">
    - پیش‌فرض: `channels.bluebubbles.dmPolicy = "pairing"`.
    - فرستنده‌های ناشناخته یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از ۱ ساعت منقضی می‌شوند).
    - تأیید از طریق:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - جفت‌سازی تبادل توکن پیش‌فرض است. جزئیات: [جفت‌سازی](/fa/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` کنترل می‌کند وقتی `allowlist` تنظیم شده است، چه کسی می‌تواند در گروه‌ها فعال‌سازی انجام دهد.

  </Tab>
</Tabs>

### غنی‌سازی نام مخاطب (macOS، اختیاری)

webhooksهای گروهی BlueBubbles اغلب فقط نشانی‌های خام شرکت‌کنندگان را شامل می‌شوند. اگر می‌خواهید زمینه `GroupMembers` به‌جای آن نام مخاطبان محلی را نشان دهد، می‌توانید در macOS غنی‌سازی محلی Contacts را فعال کنید:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` جست‌وجو را فعال می‌کند. پیش‌فرض: `false`.
- جست‌وجوها فقط پس از آن اجرا می‌شوند که دسترسی گروه، مجوز فرمان، و gating ذکر اجازه عبور پیام را داده باشند.
- فقط شرکت‌کنندگان تلفنی بدون نام غنی‌سازی می‌شوند.
- وقتی هیچ تطابق محلی پیدا نشود، شماره تلفن‌های خام به‌عنوان fallback باقی می‌مانند.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### gating ذکر (گروه‌ها)

BlueBubbles از gating ذکر برای گفتگوهای گروهی پشتیبانی می‌کند و با رفتار iMessage/WhatsApp هماهنگ است:

- از `agents.list[].groupChat.mentionPatterns` (یا `messages.groupChat.mentionPatterns`) برای تشخیص ذکرها استفاده می‌کند.
- وقتی `requireMention` برای یک گروه فعال باشد، عامل فقط هنگام ذکرشدن پاسخ می‌دهد.
- فرمان‌های کنترلی از فرستنده‌های مجاز، gating ذکر را دور می‌زنند.

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
- برای تعیین مجوز فرمان از `allowFrom` و `groupAllowFrom` استفاده می‌کند.
- فرستنده‌های مجاز می‌توانند حتی بدون ذکرکردن در گروه‌ها، فرمان‌های کنترلی را اجرا کنند.

### prompt سیستمی برای هر گروه

هر ورودی زیر `channels.bluebubbles.groups.*` یک رشته اختیاری `systemPrompt` می‌پذیرد. مقدار آن در هر نوبتی که پیامی را در آن گروه مدیریت می‌کند، در prompt سیستمی عامل تزریق می‌شود، بنابراین می‌توانید بدون ویرایش promptهای عامل، persona یا قواعد رفتاری مخصوص هر گروه تنظیم کنید:

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

کلید با هر چیزی که BlueBubbles برای گروه به‌عنوان `chatGuid` / `chatIdentifier` / `chatId` عددی گزارش می‌کند مطابقت دارد، و یک ورودی wildcard با مقدار `"*"` برای هر گروهی که تطابق دقیق ندارد پیش‌فرض فراهم می‌کند (همان الگویی که توسط `requireMention` و سیاست‌های ابزار برای هر گروه استفاده می‌شود). تطابق‌های دقیق همیشه بر wildcard اولویت دارند. DMها این فیلد را نادیده می‌گیرند؛ به‌جای آن از سفارشی‌سازی prompt در سطح عامل یا حساب استفاده کنید.

#### مثال کامل: پاسخ‌های رشته‌ای و واکنش‌های tapback (Private API)

با فعال‌بودن Private API در BlueBubbles، پیام‌های ورودی با شناسه‌های کوتاه پیام می‌رسند (برای مثال `[[reply_to:5]]`) و عامل می‌تواند `action=reply` را فراخوانی کند تا به یک پیام مشخص رشته شود یا `action=react` را برای ارسال tapback به‌کار ببرد. یک `systemPrompt` برای هر گروه راهی قابل‌اعتماد برای واداشتن عامل به انتخاب ابزار درست است:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

واکنش‌های tapback و پاسخ‌های رشته‌ای هر دو به Private API در BlueBubbles نیاز دارند؛ برای سازوکارهای زیربنایی، [اقدام‌های پیشرفته](#advanced-actions) و [شناسه‌های پیام](#message-ids-short-vs-full) را ببینید.

## اتصال‌های گفتگوی ACP

گفتگوهای BlueBubbles را می‌توان بدون تغییر لایه انتقال، به workspaceهای پایدار ACP تبدیل کرد.

جریان سریع اپراتور:

- داخل DM یا گفتگوی گروهی مجاز، `/acp spawn codex --bind here` را اجرا کنید.
- پیام‌های آینده در همان گفتگوی BlueBubbles به نشست ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان نشست ACP متصل‌شده را درجا بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده نیز از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "bluebubbles"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از هر شکل هدف پشتیبانی‌شده BlueBubbles استفاده کند:

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

برای رفتار مشترک اتصال ACP، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## تایپ + رسیدهای خوانده‌شدن

- **نشانگرهای تایپ**: پیش از تولید پاسخ و در طول آن به‌طور خودکار ارسال می‌شوند.
- **رسیدهای خوانده‌شدن**: با `channels.bluebubbles.sendReadReceipts` کنترل می‌شود (پیش‌فرض: `true`).
- **نشانگرهای تایپ**: OpenClaw رویدادهای شروع تایپ را ارسال می‌کند؛ BlueBubbles هنگام ارسال یا پایان مهلت، تایپ را به‌طور خودکار پاک می‌کند (توقف دستی از طریق DELETE قابل اعتماد نیست).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## کنش‌های پیشرفته

BlueBubbles هنگامی که در پیکربندی فعال شده باشد از کنش‌های پیام پیشرفته پشتیبانی می‌کند:

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
  <Accordion title="کنش‌های موجود">
    - **react**: واکنش‌های tapback را اضافه/حذف می‌کند (`messageId`، `emoji`، `remove`). مجموعه tapback بومی iMessage شامل `love`، `like`، `dislike`، `laugh`، `emphasize` و `question` است. وقتی یک عامل ایموجی‌ای خارج از آن مجموعه انتخاب کند (برای مثال `👀`)، ابزار واکنش به `love` برمی‌گردد تا tapback همچنان نمایش داده شود، به‌جای اینکه کل درخواست شکست بخورد. واکنش‌های تأیید پیکربندی‌شده همچنان سخت‌گیرانه اعتبارسنجی می‌شوند و برای مقدارهای ناشناخته خطا می‌دهند.
    - **edit**: یک پیام ارسال‌شده را ویرایش می‌کند (`messageId`، `text`).
    - **unsend**: ارسال یک پیام را لغو می‌کند (`messageId`).
    - **reply**: به یک پیام مشخص پاسخ می‌دهد (`messageId`، `text`، `to`).
    - **sendWithEffect**: با افکت iMessage ارسال می‌کند (`text`، `to`، `effectId`).
    - **renameGroup**: نام یک گفت‌وگوی گروهی را تغییر می‌دهد (`chatGuid`، `displayName`).
    - **setGroupIcon**: آیکن/عکس یک گفت‌وگوی گروهی را تنظیم می‌کند (`chatGuid`، `media`) — در macOS 26 Tahoe ناپایدار است (API ممکن است موفقیت برگرداند اما آیکن همگام‌سازی نشود).
    - **addParticipant**: کسی را به یک گروه اضافه می‌کند (`chatGuid`، `address`).
    - **removeParticipant**: کسی را از یک گروه حذف می‌کند (`chatGuid`، `address`).
    - **leaveGroup**: یک گفت‌وگوی گروهی را ترک می‌کند (`chatGuid`).
    - **upload-file**: رسانه/فایل‌ها را ارسال می‌کند (`to`، `buffer`، `filename`، `asVoice`).
      - یادداشت‌های صوتی: برای ارسال به‌عنوان پیام صوتی iMessage، `asVoice: true` را همراه با صوت **MP3** یا **CAF** تنظیم کنید. BlueBubbles هنگام ارسال یادداشت‌های صوتی، MP3 → CAF را تبدیل می‌کند.
    - نام مستعار قدیمی: `sendAttachment` همچنان کار می‌کند، اما `upload-file` نام کنش رسمی است.

  </Accordion>
</AccordionGroup>

### شناسه‌های پیام (کوتاه در برابر کامل)

OpenClaw ممکن است شناسه‌های پیام _کوتاه_ (مثلاً `1`، `2`) را برای صرفه‌جویی در توکن‌ها نمایش دهد.

- `MessageSid` / `ReplyToId` می‌توانند شناسه‌های کوتاه باشند.
- `MessageSidFull` / `ReplyToIdFull` شامل شناسه‌های کامل ارائه‌دهنده هستند.
- شناسه‌های کوتاه در حافظه نگه داشته می‌شوند؛ ممکن است با راه‌اندازی مجدد یا حذف از کش منقضی شوند.
- کنش‌ها `messageId` کوتاه یا کامل را می‌پذیرند، اما اگر شناسه‌های کوتاه دیگر در دسترس نباشند خطا می‌دهند.

برای خودکارسازی‌ها و ذخیره‌سازی بادوام از شناسه‌های کامل استفاده کنید:

- الگوها: `{{MessageSidFull}}`، `{{ReplyToIdFull}}`
- زمینه: `MessageSidFull` / `ReplyToIdFull` در payloadهای ورودی

برای متغیرهای الگو، [پیکربندی](/fa/gateway/configuration) را ببینید.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## ادغام DMهای ارسالِ جداشده (فرمان + URL در یک نگارش)

وقتی کاربر در iMessage یک فرمان و یک URL را با هم تایپ می‌کند — مثلاً `Dump https://example.com/article` — Apple ارسال را به **دو تحویل Webhook جداگانه** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک بالن پیش‌نمایش URL (`"https://..."`) با تصویرهای پیش‌نمایش OG به‌عنوان پیوست.

این دو Webhook در بیشتر تنظیمات با فاصله حدود 0.8 تا 2.0 ثانیه به OpenClaw می‌رسند. بدون ادغام، عامل در نوبت 1 فقط فرمان را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست»)، و URL را فقط در نوبت 2 می‌بیند — در آن زمان زمینه فرمان از دست رفته است.

`channels.bluebubbles.coalesceSameSenderDms` یک DM را وارد ادغام Webhookهای متوالی از همان فرستنده در یک نوبت عامل می‌کند. گفت‌وگوهای گروهی همچنان به‌ازای هر پیام کلید می‌خورند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="زمان فعال‌سازی">
    فعال کنید وقتی:

    - Skillsی ارائه می‌کنید که انتظار دارند `command + payload` در یک پیام باشد (dump، paste، save، queue و غیره).
    - کاربران شما URLها، تصویرها یا محتوای طولانی را همراه فرمان‌ها جای‌گذاری می‌کنند.
    - می‌توانید تأخیر افزوده‌شده نوبت DM را بپذیرید (پایین را ببینید).

    غیرفعال بگذارید وقتی:

    - برای محرک‌های DM تک‌کلمه‌ای به کمترین تأخیر فرمان نیاز دارید.
    - همه جریان‌های شما فرمان‌های یک‌مرحله‌ای بدون payloadهای پیگیری هستند.

  </Tab>
  <Tab title="فعال‌سازی">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    با روشن بودن پرچم و نبود `messages.inbound.byChannel.bluebubbles` صریح، پنجره debounce به **2500 ms** گسترش می‌یابد (پیش‌فرض برای حالت بدون ادغام 500 ms است). پنجره گسترده‌تر لازم است — آهنگ ارسالِ جداشده Apple با فاصله 0.8 تا 2.0 ثانیه در پیش‌فرض محدودتر جا نمی‌شود.

    برای تنظیم پنجره به‌صورت دستی:

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
  <Tab title="مصالحه‌ها">
    - **تأخیر افزوده برای فرمان‌های کنترلی DM.** با روشن بودن پرچم، پیام‌های فرمان کنترلی DM (مانند `Dump`، `Save` و غیره) اکنون پیش از dispatch شدن تا سقف پنجره debounce منتظر می‌مانند، برای حالتی که یک Webhook حاوی payload در راه باشد. فرمان‌های گفت‌وگوی گروهی همچنان dispatch فوری دارند.
    - **خروجی ادغام‌شده محدود است** — متن ادغام‌شده با نشانگر صریح `…[truncated]` حداکثر 4000 نویسه دارد؛ پیوست‌ها حداکثر 20 هستند؛ ورودی‌های منبع حداکثر 10 هستند (پس از آن، اولین و جدیدترین نگه داشته می‌شوند). هر `messageId` منبع همچنان به inbound-dedupe می‌رسد تا پخش دوباره بعدی هر رویداد جداگانه توسط MessagePoller به‌عنوان تکراری شناخته شود.
    - **انتخابی و به‌ازای هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تأثیر قرار نمی‌گیرند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

| کاربر می‌نویسد                                                      | Apple تحویل می‌دهد            | پرچم خاموش (پیش‌فرض)                      | پرچم روشن + پنجره 2500 ms                                                |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | 2 Webhook با فاصله حدود 1 ثانیه     | دو نوبت عامل: فقط "Dump"، سپس URL | یک نوبت: متن ادغام‌شده `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (پیوست + متن)                | 2 Webhook                | دو نوبت                               | یک نوبت: متن + تصویر                                                  |
| `/status` (فرمان مستقل)                                     | 1 Webhook                 | dispatch فوری                        | **تا سقف پنجره صبر می‌کند، سپس dispatch می‌شود**                                    |
| URL به‌تنهایی جای‌گذاری شده                                                   | 1 Webhook                 | dispatch فوری                        | dispatch فوری (فقط یک ورودی در bucket)                             |
| متن + URL به‌صورت دو پیام جداگانه عمدی، با فاصله چند دقیقه ارسال شده‌اند | 2 Webhook خارج از پنجره | دو نوبت                               | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                 |
| سیل سریع (>10 DM کوچک داخل پنجره)                          | N Webhook                | N نوبت                                 | یک نوبت، خروجی محدودشده (اولین + جدیدترین، با اعمال سقف متن/پیوست) |

### عیب‌یابی ادغام ارسالِ جداشده

اگر پرچم روشن است و ارسال‌های جداشده همچنان به‌صورت دو نوبت می‌رسند، هر لایه را بررسی کنید:

<AccordionGroup>
  <Accordion title="پیکربندی واقعاً بارگذاری شده است">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    سپس `openclaw gateway restart` — پرچم هنگام ساخت debouncer-registry خوانده می‌شود.

  </Accordion>
  <Accordion title="پنجره debounce برای تنظیمات شما به‌اندازه کافی گسترده است">
    به گزارش سرور BlueBubbles در `~/Library/Logs/bluebubbles-server/main.log` نگاه کنید:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    فاصله بین dispatch متن به سبک `"Dump"` و dispatch بعدی `"https://..."; Attachments:` را اندازه بگیرید. `messages.inbound.byChannel.bluebubbles` را آن‌قدر افزایش دهید که آن فاصله را با حاشیه مناسب پوشش دهد.

  </Accordion>
  <Accordion title="مُهرهای زمانی JSONL نشست ≠ رسیدن Webhook">
    مُهرهای زمانی رویداد نشست (`~/.openclaw/agents/<id>/sessions/*.jsonl`) زمانی را نشان می‌دهند که Gateway یک پیام را به عامل تحویل می‌دهد، **نه** زمانی را که Webhook رسیده است. پیام دومِ صف‌شده با برچسب `[Queued messages while agent was busy]` یعنی نوبت اول هنوز در حال اجرا بوده که Webhook دوم رسیده است — bucket ادغام از قبل flush شده بود. پنجره را بر اساس گزارش سرور BB تنظیم کنید، نه گزارش نشست.
  </Accordion>
  <Accordion title="فشار حافظه dispatch پاسخ را کند می‌کند">
    روی ماشین‌های کوچک‌تر (8 GB)، نوبت‌های عامل ممکن است آن‌قدر طول بکشند که bucket ادغام پیش از تکمیل پاسخ flush شود و URL به‌عنوان نوبت دوم صف‌شده وارد شود. `memory_pressure` و `ps -o rss -p $(pgrep openclaw-gateway)` را بررسی کنید؛ اگر Gateway بیش از حدود 500 MB RSS است و فشرده‌ساز فعال است، پردازش‌های سنگین دیگر را ببندید یا به میزبان بزرگ‌تری ارتقا دهید.
  </Accordion>
  <Accordion title="ارسال‌های نقل‌قول پاسخ مسیر متفاوتی دارند">
    اگر کاربر `Dump` را به‌عنوان یک **پاسخ** به بالن URL موجود لمس کرده باشد (iMessage نشان «1 Reply» را روی بالن Dump نشان می‌دهد)، URL در `replyToBody` قرار دارد، نه در Webhook دوم. ادغام اعمال نمی‌شود — این دغدغه skill/prompt است، نه دغدغه debouncer.
  </Accordion>
</AccordionGroup>

## پخش جریانی بلوکی

کنترل کنید پاسخ‌ها به‌صورت یک پیام واحد ارسال شوند یا به‌صورت بلوک‌ها پخش جریانی شوند:

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

- پیوست‌های ورودی دانلود و در کش رسانه ذخیره می‌شوند.
- سقف رسانه از طریق `channels.bluebubbles.mediaMaxMb` برای رسانه ورودی و خروجی (پیش‌فرض: 8 MB).
- متن خروجی به `channels.bluebubbles.textChunkLimit` قطعه‌بندی می‌شود (پیش‌فرض: 4000 نویسه).

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

<AccordionGroup>
  <Accordion title="اتصال و Webhook">
    - `channels.bluebubbles.enabled`: کانال را فعال/غیرفعال می‌کند.
    - `channels.bluebubbles.serverUrl`: URL پایه REST API BlueBubbles.
    - `channels.bluebubbles.password`: رمز عبور API.
    - `channels.bluebubbles.webhookPath`: مسیر endpoint Webhook (پیش‌فرض: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="سیاست دسترسی">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).
    - `channels.bluebubbles.allowFrom`: فهرست مجاز DM (handles، ایمیل‌ها، شماره‌های E.164، `chat_id:*`، `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: فهرست مجاز فرستنده گروه.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: در macOS، پس از عبور از gating، شرکت‌کنندگان بی‌نام گروه را به‌صورت اختیاری از Contacts محلی غنی‌سازی می‌کند. پیش‌فرض: `false`.
    - `channels.bluebubbles.groups`: پیکربندی به‌ازای هر گروه (`requireMention` و غیره).

  </Accordion>
  <Accordion title="تحویل و قطعه‌بندی">
    - `channels.bluebubbles.sendReadReceipts`: ارسال رسیدهای خوانده‌شدن (پیش‌فرض: `true`).
    - `channels.bluebubbles.blockStreaming`: فعال‌کردن جریان‌سازی بلوکی (پیش‌فرض: `false`؛ برای پاسخ‌های جریانی لازم است).
    - `channels.bluebubbles.textChunkLimit`: اندازه قطعه خروجی بر حسب نویسه (پیش‌فرض: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلت زمانی هر درخواست بر حسب میلی‌ثانیه برای ارسال‌های متن خروجی از طریق `/api/v1/message/text` (پیش‌فرض: 30000). در راه‌اندازی‌های macOS 26 که در آن‌ها ارسال‌های Private API iMessage می‌توانند درون چارچوب iMessage برای بیش از 60 ثانیه متوقف شوند، آن را افزایش دهید؛ برای مثال `45000` یا `60000`. کاوش‌ها، جست‌وجوهای چت، واکنش‌ها، ویرایش‌ها، و بررسی‌های سلامت در حال حاضر پیش‌فرض کوتاه‌تر 10 ثانیه‌ای را نگه می‌دارند؛ گسترش پوشش به واکنش‌ها و ویرایش‌ها به‌عنوان پیگیری بعدی برنامه‌ریزی شده است. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (پیش‌فرض) فقط هنگام فراتر رفتن از `textChunkLimit` تقسیم می‌کند؛ `newline` پیش از قطعه‌بندی بر اساس طول، روی خطوط خالی (مرزهای پاراگراف) تقسیم می‌کند.

  </Accordion>
  <Accordion title="رسانه و تاریخچه">
    - `channels.bluebubbles.mediaMaxMb`: سقف رسانه ورودی/خروجی بر حسب MB (پیش‌فرض: 8).
    - `channels.bluebubbles.mediaLocalRoots`: فهرست مجاز صریح از دایرکتوری‌های محلی مطلق که برای مسیرهای رسانه محلی خروجی مجاز هستند. ارسال مسیر محلی به‌صورت پیش‌فرض رد می‌شود مگر اینکه این مورد پیکربندی شده باشد. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Webhookهای DM پیاپی از همان فرستنده را در یک نوبت عامل ادغام کنید تا ارسال جداگانه متن+URL اپل به‌صورت یک پیام واحد برسد (پیش‌فرض: `false`). برای سناریوها، تنظیم پنجره، و مصالحه‌ها، [ادغام DMهای ارسال‌شده به‌صورت جداگانه](#coalescing-split-send-dms-command--url-in-one-composition) را ببینید. وقتی بدون `messages.inbound.byChannel.bluebubbles` صریح فعال شود، پنجره debounce ورودی پیش‌فرض را از 500 ms به 2500 ms افزایش می‌دهد.
    - `channels.bluebubbles.historyLimit`: حداکثر پیام‌های گروه برای زمینه (0 غیرفعال می‌کند).
    - `channels.bluebubbles.dmHistoryLimit`: محدودیت تاریخچه DM.

  </Accordion>
  <Accordion title="اقدام‌ها و حساب‌ها">
    - `channels.bluebubbles.actions`: فعال/غیرفعال‌کردن اقدام‌های مشخص.
    - `channels.bluebubbles.accounts`: پیکربندی چندحسابی.

  </Accordion>
</AccordionGroup>

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (یا `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## آدرس‌دهی / مقصدهای تحویل

برای مسیریابی پایدار، `chat_guid` را ترجیح دهید:

- `chat_guid:iMessage;-;+15555550123` (ترجیحی برای گروه‌ها)
- `chat_id:123`
- `chat_identifier:...`
- هندل‌های مستقیم: `+15555550123`، `user@example.com`
  - اگر یک هندل مستقیم چت DM موجود نداشته باشد، OpenClaw یکی را از طریق `POST /api/v1/chat/new` ایجاد می‌کند. این کار نیاز دارد Private API BlueBubbles فعال باشد.

### مسیریابی iMessage در برابر SMS

وقتی همان هندل روی Mac هم چت iMessage و هم چت SMS داشته باشد (برای مثال شماره تلفنی که در iMessage ثبت شده اما پیام‌های جایگزین حباب سبز هم دریافت کرده است)، OpenClaw چت iMessage را ترجیح می‌دهد و هرگز بی‌صدا به SMS تنزل نمی‌دهد. برای اجبار به استفاده از چت SMS، از پیشوند مقصد صریح `sms:` استفاده کنید (برای مثال `sms:+15555550123`). هندل‌هایی که چت iMessage منطبق ندارند همچنان از طریق هر چتی که BlueBubbles گزارش می‌کند ارسال می‌شوند.

## امنیت

- درخواست‌های Webhook با مقایسه پارامترهای پرس‌وجوی `guid`/`password` یا سرآیندها با `channels.bluebubbles.password` احراز هویت می‌شوند.
- گذرواژه API و نقطه پایانی Webhook را محرمانه نگه دارید (با آن‌ها مانند اعتبارنامه‌ها رفتار کنید).
- برای احراز هویت Webhook در BlueBubbles هیچ میان‌بری برای localhost وجود ندارد. اگر ترافیک Webhook را پراکسی می‌کنید، گذرواژه BlueBubbles را روی درخواست از ابتدا تا انتها نگه دارید. `gateway.trustedProxies` در اینجا جایگزین `channels.bluebubbles.password` نمی‌شود. [امنیت Gateway](/fa/gateway/security#reverse-proxy-configuration) را ببینید.
- اگر سرور BlueBubbles را بیرون از LAN خود در معرض دسترس قرار می‌دهید، HTTPS و قوانین فایروال را فعال کنید.

## عیب‌یابی

- اگر رویدادهای تایپ/خواندن از کار افتادند، لاگ‌های Webhook BlueBubbles را بررسی کنید و مطمئن شوید مسیر Gateway با `channels.bluebubbles.webhookPath` مطابقت دارد.
- کدهای جفت‌سازی پس از یک ساعت منقضی می‌شوند؛ از `openclaw pairing list bluebubbles` و `openclaw pairing approve bluebubbles <code>` استفاده کنید.
- واکنش‌ها به private API BlueBubbles نیاز دارند (`POST /api/v1/message/react`)؛ مطمئن شوید نسخه سرور آن را ارائه می‌کند.
- ویرایش/لغو ارسال به macOS 13+ و یک نسخه سازگار از سرور BlueBubbles نیاز دارد. در macOS 26 (Tahoe)، ویرایش در حال حاضر به‌دلیل تغییرات private API خراب است.
- به‌روزرسانی‌های نماد گروه ممکن است در macOS 26 (Tahoe) ناپایدار باشند: API ممکن است موفقیت برگرداند اما نماد جدید همگام‌سازی نشود.
- OpenClaw اقدام‌هایی را که بر اساس نسخه macOS سرور BlueBubbles خراب بودنشان شناخته شده است، به‌صورت خودکار پنهان می‌کند. اگر ویرایش همچنان در macOS 26 (Tahoe) نمایش داده می‌شود، آن را به‌صورت دستی با `channels.bluebubbles.actions.edit=false` غیرفعال کنید.
- `coalesceSameSenderDms` فعال است اما ارسال‌های جداگانه (مثلاً `Dump` + URL) همچنان به‌صورت دو نوبت می‌رسند: چک‌لیست [عیب‌یابی ادغام ارسال جداگانه](#split-send-coalescing-troubleshooting) را ببینید — علت‌های رایج شامل پنجره debounce بیش‌ازحد کوتاه، زمان‌مهرهای لاگ نشست که به‌اشتباه زمان رسیدن Webhook خوانده شده‌اند، یا ارسال نقل‌قول پاسخ است (که از `replyToBody` استفاده می‌کند، نه Webhook دوم).
- برای اطلاعات وضعیت/سلامت: `openclaw status --all` یا `openclaw status --deep`.

برای مرجع کلی گردش‌کار کانال، [کانال‌ها](/fa/channels) و راهنمای [Plugins](/fa/tools/plugin) را ببینید.

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و دروازه‌گذاری اشاره
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
